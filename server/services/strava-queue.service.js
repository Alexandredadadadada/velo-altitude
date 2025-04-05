/**
 * Service de file d'attente pour les requêtes Strava
 * Gère les limites de taux et permet la synchronisation en arrière-plan
 */

const CacheService = require('./cache.service');
const apiMonitoringService = require('./api-monitoring.service');
const logger = require('../utils/logger');
const axios = require('axios');

// Configuration des limites Strava
const STRAVA_LIMITS = {
  DAILY_LIMIT: 1000,
  FIFTEEN_MINUTES_LIMIT: 100,
  SHORT_TERM_SECONDS: 900, // 15 minutes en secondes
  BUCKET_SIZE: 25, // Nombre maximal de requêtes par bucket
  COOLING_PERIOD: 5000 // 5 secondes entre chaque bucket
};

class StravaQueueService {
  constructor() {
    this.queue = [];
    this.processingQueue = false;
    this.usageCounters = {
      daily: 0,
      fifteenMinutes: 0,
      lastReset: new Date(),
      shortTermReset: new Date()
    };
    this.refreshTokenPromises = new Map(); // Pour éviter les refresh token parallèles
    this.initialized = false;
  }

  /**
   * Initialise le service de file d'attente
   */
  initialize() {
    if (this.initialized) return;

    // Récupérer les compteurs depuis le cache
    const counters = CacheService.getCache().get('strava_api_counters');
    if (counters) {
      this.usageCounters = counters;
    }

    // Planifier les réinitialisations des compteurs
    setInterval(() => this._resetCounters(), 60000); // Vérifier toutes les minutes

    // Démarrer le traitement de la file d'attente
    setInterval(() => this._processQueue(), 1000);

    this.initialized = true;
    logger.info('Service de file d\'attente Strava initialisé');
  }

  /**
   * Ajoute une requête à la file d'attente
   * @param {Object} requestConfig - Configuration de la requête
   * @param {string} requestConfig.userId - ID de l'utilisateur
   * @param {string} requestConfig.accessToken - Token d'accès
   * @param {Object} requestConfig.requestOptions - Options pour axios
   * @param {boolean} requestConfig.priority - Priorité élevée
   * @param {Function} requestConfig.onComplete - Callback à la fin
   * @param {Function} requestConfig.onError - Callback en cas d'erreur
   * @returns {Promise} Promesse résolue avec le résultat de la requête
   */
  async enqueue(requestConfig) {
    return new Promise((resolve, reject) => {
      // Valider les paramètres requis
      if (!requestConfig || !requestConfig.requestOptions || !requestConfig.accessToken) {
        return reject(new Error('Configuration de requête incomplète'));
      }

      // Ajouter à la file d'attente
      const queueItem = {
        ...requestConfig,
        priority: requestConfig.priority || false,
        timestamp: Date.now(),
        resolve,
        reject,
        retries: 0,
        maxRetries: requestConfig.maxRetries || 3
      };

      // Insérer selon la priorité
      if (queueItem.priority) {
        this.queue.unshift(queueItem);
      } else {
        this.queue.push(queueItem);
      }

      logger.debug(`Requête Strava ajoutée à la file d'attente. Taille de la file: ${this.queue.length}`);
      
      // Si la file n'est pas en cours de traitement, la démarrer
      if (!this.processingQueue) {
        this._processQueue();
      }
    });
  }

  /**
   * Prépare une requête batch pour synchroniser plusieurs activités
   * @param {string} userId - ID de l'utilisateur
   * @param {string} accessToken - Token d'accès
   * @param {Array} activityIds - IDs des activités à synchroniser
   * @param {Object} options - Options additionnelles
   * @returns {Promise} Promesse résolue avec les résultats
   */
  async batchSyncActivities(userId, accessToken, activityIds, options = {}) {
    if (!activityIds || !Array.isArray(activityIds) || activityIds.length === 0) {
      throw new Error('Liste d\'IDs d\'activités requise');
    }

    // Diviser en groupes pour respecter les limites
    const activityGroups = this._chunkArray(activityIds, 10);
    const results = [];

    // Traiter chaque groupe séquentiellement
    for (const group of activityGroups) {
      const groupResults = await Promise.all(
        group.map(activityId => 
          this.enqueue({
            userId,
            accessToken,
            requestOptions: {
              method: 'GET',
              url: `https://www.strava.com/api/v3/activities/${activityId}`,
              headers: {
                'Authorization': `Bearer ${accessToken}`
              }
            },
            priority: options.priority || false,
            background: options.background || false
          })
        )
      );
      
      results.push(...groupResults);
      
      // Attendre entre les groupes pour éviter de surcharger l'API
      if (group !== activityGroups[activityGroups.length - 1]) {
        await this._sleep(2000);
      }
    }

    return results;
  }

  /**
   * Lance une synchronisation en arrière-plan des activités récentes
   * @param {string} userId - ID de l'utilisateur
   * @param {string} accessToken - Token d'accès Strava
   * @param {Object} options - Options de synchronisation
   * @returns {Object} Informations sur la tâche de synchronisation
   */
  async startBackgroundSync(userId, accessToken, options = {}) {
    // Créer un ID de tâche unique
    const taskId = `sync_${userId}_${Date.now()}`;
    
    // Enregistrer la tâche dans le cache
    const syncTask = {
      taskId,
      userId,
      status: 'pending',
      startTime: new Date(),
      options,
      progress: 0,
      totalActivities: 0,
      completedActivities: 0,
      errors: []
    };
    
    CacheService.getCache().set(`strava_sync_${taskId}`, syncTask, 86400); // 24h TTL
    
    // Lancer le processus de synchronisation en arrière-plan
    setImmediate(async () => {
      try {
        // Mettre à jour le statut
        syncTask.status = 'running';
        CacheService.getCache().set(`strava_sync_${taskId}`, syncTask, 86400);
        
        // Récupérer la liste des activités
        const activitiesResponse = await this.enqueue({
          userId,
          accessToken,
          requestOptions: {
            method: 'GET',
            url: 'https://www.strava.com/api/v3/athlete/activities',
            params: {
              per_page: options.limit || 30,
              page: 1
            },
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          },
          priority: true
        });
        
        const activities = activitiesResponse.data;
        
        // Mettre à jour la tâche
        syncTask.totalActivities = activities.length;
        CacheService.getCache().set(`strava_sync_${taskId}`, syncTask, 86400);
        
        // Synchroniser chaque activité
        for (let i = 0; i < activities.length; i++) {
          try {
            // Récupérer les détails de l'activité
            await this.enqueue({
              userId,
              accessToken,
              requestOptions: {
                method: 'GET',
                url: `https://www.strava.com/api/v3/activities/${activities[i].id}`,
                headers: {
                  'Authorization': `Bearer ${accessToken}`
                }
              },
              background: true
            });
            
            // Mettre à jour la progression
            syncTask.completedActivities++;
            syncTask.progress = Math.round((syncTask.completedActivities / syncTask.totalActivities) * 100);
            CacheService.getCache().set(`strava_sync_${taskId}`, syncTask, 86400);
            
          } catch (activityError) {
            syncTask.errors.push({
              activityId: activities[i].id,
              error: activityError.message
            });
            CacheService.getCache().set(`strava_sync_${taskId}`, syncTask, 86400);
          }
        }
        
        // Finaliser la tâche
        syncTask.status = 'completed';
        syncTask.endTime = new Date();
        syncTask.duration = syncTask.endTime - syncTask.startTime;
        CacheService.getCache().set(`strava_sync_${taskId}`, syncTask, 86400);
        
        logger.info(`Synchronisation Strava en arrière-plan terminée pour l'utilisateur ${userId}`);
        
      } catch (error) {
        syncTask.status = 'failed';
        syncTask.error = error.message;
        CacheService.getCache().set(`strava_sync_${taskId}`, syncTask, 86400);
        
        logger.error(`Erreur lors de la synchronisation Strava en arrière-plan: ${error.message}`);
      }
    });
    
    return {
      taskId,
      status: 'pending',
      message: 'Synchronisation démarrée en arrière-plan'
    };
  }

  /**
   * Récupère l'état d'une tâche de synchronisation
   * @param {string} taskId - ID de la tâche
   * @returns {Object} État de la tâche
   */
  getSyncTaskStatus(taskId) {
    const task = CacheService.getCache().get(`strava_sync_${taskId}`);
    
    if (!task) {
      throw new Error('Tâche de synchronisation non trouvée');
    }
    
    return task;
  }

  /**
   * Vérifie si les limites d'API sont atteintes
   * @returns {boolean} True si les limites sont atteintes
   */
  isRateLimited() {
    return (
      this.usageCounters.daily >= STRAVA_LIMITS.DAILY_LIMIT ||
      this.usageCounters.fifteenMinutes >= STRAVA_LIMITS.FIFTEEN_MINUTES_LIMIT
    );
  }

  /**
   * Obtient les statistiques actuelles d'utilisation de l'API
   * @returns {Object} Statistiques d'utilisation
   */
  getUsageStats() {
    return {
      daily: {
        limit: STRAVA_LIMITS.DAILY_LIMIT,
        used: this.usageCounters.daily,
        remaining: STRAVA_LIMITS.DAILY_LIMIT - this.usageCounters.daily,
        resetAt: new Date(this.usageCounters.lastReset.getTime() + 24 * 60 * 60 * 1000)
      },
      fifteenMinutes: {
        limit: STRAVA_LIMITS.FIFTEEN_MINUTES_LIMIT,
        used: this.usageCounters.fifteenMinutes,
        remaining: STRAVA_LIMITS.FIFTEEN_MINUTES_LIMIT - this.usageCounters.fifteenMinutes,
        resetAt: new Date(this.usageCounters.shortTermReset.getTime() + STRAVA_LIMITS.SHORT_TERM_SECONDS * 1000)
      },
      queueSize: this.queue.length
    };
  }

  /**
   * Méthodes privées
   */

  /**
   * Traite la file d'attente
   * @private
   */
  async _processQueue() {
    if (this.processingQueue || this.queue.length === 0) {
      return;
    }

    this.processingQueue = true;

    try {
      // Vérifier les limites de taux
      if (this.isRateLimited()) {
        logger.warn('Limites d\'API Strava atteintes, pause du traitement de la file d\'attente');
        this.processingQueue = false;
        return;
      }

      // Traiter un lot de requêtes
      const currentBatch = this.queue.splice(0, Math.min(STRAVA_LIMITS.BUCKET_SIZE, this.queue.length));
      
      for (const request of currentBatch) {
        try {
          // Exécuter la requête
          const response = await axios(request.requestOptions);
          
          // Mettre à jour les compteurs
          this.usageCounters.daily++;
          this.usageCounters.fifteenMinutes++;
          
          // Persister les compteurs
          CacheService.getCache().set('strava_api_counters', this.usageCounters);
          
          // Enregistrer l'appel API
          apiMonitoringService.logApiCall({
            api: 'Strava',
            endpoint: request.requestOptions.url,
            method: request.requestOptions.method,
            statusCode: response.status,
            responseTime: Date.now() - request.timestamp,
            userId: request.userId
          });
          
          // Résoudre la promesse
          request.resolve(response);
          
          // Appeler le callback si fourni
          if (typeof request.onComplete === 'function') {
            request.onComplete(response);
          }
          
        } catch (error) {
          const statusCode = error.response?.status;
          
          // Gérer les erreurs
          if (statusCode === 401 || statusCode === 403) {
            // Problème d'authentification
            logger.warn(`Erreur d'authentification Strava pour l'utilisateur ${request.userId}`);
            request.reject(error);
          } else if (statusCode === 429) {
            // Rate limit atteint, remettre la requête dans la file
            logger.warn('Rate limit Strava atteint, requête remise en file d\'attente');
            if (request.retries < request.maxRetries) {
              request.retries++;
              this.queue.push(request);
            } else {
              request.reject(new Error('Nombre maximal de tentatives atteint pour la requête Strava'));
            }
          } else {
            // Autre erreur
            logger.error(`Erreur Strava: ${error.message}`);
            request.reject(error);
          }
          
          // Appeler le callback d'erreur si fourni
          if (typeof request.onError === 'function') {
            request.onError(error);
          }
          
          // Enregistrer l'appel API échoué
          apiMonitoringService.logApiCall({
            api: 'Strava',
            endpoint: request.requestOptions.url,
            method: request.requestOptions.method,
            statusCode: statusCode || 500,
            responseTime: Date.now() - request.timestamp,
            userId: request.userId,
            error: error.message
          });
        }
        
        // Petit délai entre les requêtes pour éviter les bursts
        await this._sleep(200);
      }
      
      // Attendre avant de traiter le prochain lot
      await this._sleep(STRAVA_LIMITS.COOLING_PERIOD);
      
    } finally {
      this.processingQueue = false;
      
      // S'il reste des éléments dans la file, continuer le traitement
      if (this.queue.length > 0) {
        setImmediate(() => this._processQueue());
      }
    }
  }

  /**
   * Réinitialise les compteurs de taux selon les périodes
   * @private
   */
  _resetCounters() {
    const now = new Date();
    
    // Réinitialisation quotidienne
    if (now.getTime() - this.usageCounters.lastReset.getTime() >= 24 * 60 * 60 * 1000) {
      logger.info('Réinitialisation du compteur journalier Strava');
      this.usageCounters.daily = 0;
      this.usageCounters.lastReset = now;
    }
    
    // Réinitialisation toutes les 15 minutes
    if (now.getTime() - this.usageCounters.shortTermReset.getTime() >= STRAVA_LIMITS.SHORT_TERM_SECONDS * 1000) {
      logger.info('Réinitialisation du compteur 15 minutes Strava');
      this.usageCounters.fifteenMinutes = 0;
      this.usageCounters.shortTermReset = now;
    }
    
    // Persister les compteurs
    CacheService.getCache().set('strava_api_counters', this.usageCounters);
  }

  /**
   * Divise un tableau en sous-tableaux de la taille spécifiée
   * @private
   * @param {Array} array - Tableau à diviser
   * @param {number} size - Taille des sous-tableaux
   * @returns {Array} Tableau de sous-tableaux
   */
  _chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Promesse résolue après un délai
   * @private
   * @param {number} ms - Millisecondes à attendre
   * @returns {Promise} Promesse résolue après le délai
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Exporter une instance unique du service
const stravaQueueService = new StravaQueueService();
module.exports = stravaQueueService;
