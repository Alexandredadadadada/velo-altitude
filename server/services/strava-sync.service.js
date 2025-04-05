/**
 * Service de synchronisation des activités Strava
 * Gère la synchronisation incrémentielle et la reprise en cas d'échec
 */

const mongoose = require('mongoose');
const { logger } = require('../utils/logger');
const stravaService = require('./strava.service');
const stravaTokenService = require('./strava-token.service');
const notificationService = require('./notification.service');
const cacheService = require('./cache.service');
const Activity = require('../models/activity.model');
const SyncStatus = require('../models/sync-status.model');
const User = require('../models/user.model');
const { promiseWithTimeout } = require('../utils/promise-helpers');

class StravaSyncService {
  constructor() {
    this.syncJobs = new Map(); // userId -> {status, progress, lastUpdate, error}
    this.syncInProgress = new Set(); // Set of userIds currently syncing
    this.batchSize = 30; // Nombre d'activités à récupérer par page
    this.maxConcurrentSyncs = 10; // Augmenter de 5 à 10
    this.cacheKeyPrefix = 'strava:sync:';
    
    // Ajouter une file d'attente pour les synchronisations
    this.syncQueue = [];
    this.processQueueInterval = setInterval(() => this._processQueue(), 5000);
    
    // Codes d'erreur pour la gestion des échecs
    this.ERROR_CODES = {
      TOKEN_EXPIRED: 'TOKEN_EXPIRED',
      RATE_LIMIT: 'RATE_LIMIT',
      NETWORK: 'NETWORK',
      SERVER: 'SERVER',
      NOT_FOUND: 'NOT_FOUND',
      UNKNOWN: 'UNKNOWN'
    };
    
    logger.info('Service de synchronisation Strava initialisé');
  }

  /**
   * Démarre une synchronisation des activités pour un utilisateur
   * @param {string} userId ID de l'utilisateur
   * @param {Object} options Options de synchronisation
   * @param {boolean} options.fullSync Force une synchronisation complète (ignorer l'historique)
   * @param {number} options.daysToSync Nombre de jours à synchroniser (par défaut 30)
   * @param {Date} options.startDate Date de début pour la synchronisation
   * @param {Date} options.endDate Date de fin pour la synchronisation
   * @returns {Promise<Object>} Statut initial de la synchronisation
   */
  async startSync(userId, options = {}) {
    // Si nous sommes au maximum de synchronisations, mettre en file d'attente
    if (this.syncInProgress.size >= this.maxConcurrentSyncs) {
      logger.info(`File d'attente pour la synchronisation de l'utilisateur ${userId}`);
      
      return new Promise((resolve, reject) => {
        this.syncQueue.push({ userId, options, resolve, reject });
      });
    }
    
    return this._startSyncInternal(userId, options);
  }

  /**
   * Méthode interne pour démarrer la synchronisation
   * @param {string} userId ID de l'utilisateur
   * @param {Object} options Options de synchronisation
   * @returns {Promise<Object>} Statut de la synchronisation
   * @private
   */
  async _startSyncInternal(userId, options) {
    try {
      // Vérifier si une synchronisation est déjà en cours pour cet utilisateur
      if (this.syncInProgress.has(userId)) {
        logger.info(`Synchronisation déjà en cours pour l'utilisateur ${userId}`);
        return this.getSyncStatus(userId);
      }
      
      // Vérifier le nombre de synchronisations actives
      if (this.syncInProgress.size >= this.maxConcurrentSyncs) {
        logger.warn('Nombre maximum de synchronisations simultanées atteint');
        throw new Error('Trop de synchronisations simultanées. Veuillez réessayer plus tard.');
      }
      
      // Récupérer l'utilisateur et ses tokens
      const user = await User.findById(userId);
      
      if (!user || !user.stravaConnection || !user.stravaConnection.refreshToken) {
        logger.warn(`L'utilisateur ${userId} n'est pas connecté à Strava`);
        throw new Error('Utilisateur non connecté à Strava');
      }
      
      // Déterminer les dates de synchronisation
      const syncOptions = this._prepareSyncOptions(userId, options);
      
      // Initialiser le statut de synchronisation
      const syncStatus = {
        userId,
        status: 'initializing',
        progress: 0,
        startTime: new Date(),
        lastUpdate: new Date(),
        options: syncOptions,
        stats: {
          total: 0,
          processed: 0,
          added: 0,
          updated: 0,
          failed: 0,
          skipped: 0
        },
        error: null,
        message: 'Initialisation de la synchronisation'
      };
      
      // Enregistrer le statut dans le cache et en mémoire
      this.syncJobs.set(userId, syncStatus);
      await this._saveSyncStatus(userId, syncStatus);
      
      // Ajouter à la liste des synchronisations en cours
      this.syncInProgress.add(userId);
      
      // Lancer la synchronisation en arrière-plan
      this._performSync(userId, syncOptions).catch(error => {
        logger.error(`Erreur non gérée lors de la synchronisation Strava pour ${userId}`, { error });
      });
      
      return syncStatus;
    } catch (error) {
      logger.error(`Erreur lors du démarrage de la synchronisation pour ${userId}`, { error });
      
      const errorStatus = {
        userId,
        status: 'error',
        progress: 0,
        startTime: new Date(),
        lastUpdate: new Date(),
        options: options,
        stats: {
          total: 0,
          processed: 0,
          added: 0,
          updated: 0,
          failed: 0,
          skipped: 0
        },
        error: {
          message: error.message,
          code: this._classifyError(error)
        },
        message: `Erreur de démarrage: ${error.message}`
      };
      
      this.syncJobs.set(userId, errorStatus);
      await this._saveSyncStatus(userId, errorStatus);
      
      throw error;
    }
  }

  /**
   * Récupère le statut actuel d'une synchronisation
   * @param {string} userId ID de l'utilisateur
   * @returns {Promise<Object>} Statut de la synchronisation
   */
  async getSyncStatus(userId) {
    // Vérifier d'abord en mémoire
    if (this.syncJobs.has(userId)) {
      return this.syncJobs.get(userId);
    }
    
    // Sinon chercher dans le cache
    const cacheKey = `${this.cacheKeyPrefix}${userId}`;
    const cachedStatus = await cacheService.get(cacheKey);
    
    if (cachedStatus) {
      return cachedStatus;
    }
    
    // Si pas de cache, chercher dans la base de données le dernier statut
    const lastSyncStatus = await SyncStatus.findOne({ userId }).sort({ startTime: -1 }).lean();
    
    if (lastSyncStatus) {
      return lastSyncStatus;
    }
    
    // Aucune synchronisation trouvée
    return {
      userId,
      status: 'never_synced',
      lastUpdate: null,
      message: 'Aucune synchronisation n\'a encore été effectuée'
    };
  }

  /**
   * Annule une synchronisation en cours
   * @param {string} userId ID de l'utilisateur
   * @returns {Promise<boolean>} Succès de l'annulation
   */
  async cancelSync(userId) {
    if (!this.syncInProgress.has(userId)) {
      logger.warn(`Tentative d'annulation d'une synchronisation inexistante pour ${userId}`);
      return false;
    }
    
    // Mettre à jour le statut
    const currentStatus = this.syncJobs.get(userId);
    const updatedStatus = {
      ...currentStatus,
      status: 'cancelled',
      lastUpdate: new Date(),
      message: 'Synchronisation annulée par l\'utilisateur'
    };
    
    // Enregistrer le statut
    this.syncJobs.set(userId, updatedStatus);
    await this._saveSyncStatus(userId, updatedStatus);
    
    // Retirer de la liste des synchronisations actives
    this.syncInProgress.delete(userId);
    
    logger.info(`Synchronisation annulée pour l'utilisateur ${userId}`);
    return true;
  }

  /**
   * Récupère l'historique des synchronisations d'un utilisateur
   * @param {string} userId ID de l'utilisateur
   * @param {number} limit Nombre maximum de résultats
   * @returns {Promise<Array>} Historique des synchronisations
   */
  async getSyncHistory(userId, limit = 10) {
    const history = await SyncStatus.find({ userId })
      .sort({ startTime: -1 })
      .limit(limit)
      .lean();
    
    return history;
  }

  /**
   * Récupère les statistiques de synchronisation globales
   * @returns {Promise<Object>} Statistiques globales
   */
  async getGlobalStats() {
    const stats = {
      activeSyncs: this.syncInProgress.size,
      queuedSyncs: this.syncJobs.size - this.syncInProgress.size,
      syncCompletedLast24h: 0,
      totalActivitiesSynced: 0,
      failedSyncsLast24h: 0
    };
    
    // Calculer les statistiques des dernières 24h
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const last24hStats = await SyncStatus.aggregate([
      { $match: { lastUpdate: { $gte: oneDayAgo } } },
      { $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalActivities: { $sum: "$stats.processed" }
        }
      }
    ]);
    
    last24hStats.forEach(stat => {
      if (stat._id === 'completed') {
        stats.syncCompletedLast24h = stat.count;
        stats.totalActivitiesSynced = stat.totalActivities;
      } else if (stat._id === 'error') {
        stats.failedSyncsLast24h = stat.count;
      }
    });
    
    return stats;
  }

  /**
   * Effectue la synchronisation des activités Strava
   * @param {string} userId ID de l'utilisateur
   * @param {Object} options Options de synchronisation
   * @private
   */
  async _performSync(userId, options) {
    try {
      // Mise à jour du statut
      await this._updateSyncStatus(userId, {
        status: 'running',
        message: 'Synchronisation en cours'
      });
      
      // Récupérer les tokens Strava
      const accessToken = await stravaTokenService.getValidToken(userId);
      
      // Construire les paramètres pour l'API Strava
      const lastSyncTime = options.fullSync ? null : await this._getLastSyncTime(userId);
      const params = this._buildApiParams(options, lastSyncTime);
      
      // Estimer le nombre total d'activités
      const estimatedTotal = await this._estimateTotalActivities(userId, accessToken, params);
      
      await this._updateSyncStatus(userId, {
        stats: { total: estimatedTotal },
        message: `Estimation: ${estimatedTotal} activités à synchroniser`
      });
      
      // Variables pour la pagination et le suivi
      let page = 1;
      let processedCount = 0;
      let hasMoreActivities = true;
      let consecutiveErrors = 0;
      let lastSuccessfulPage = 0;
      
      // Boucle de récupération des activités
      while (hasMoreActivities) {
        try {
          // Vérifier si la synchronisation a été annulée
          const currentStatus = this.syncJobs.get(userId);
          if (currentStatus.status === 'cancelled') {
            logger.info(`Synchronisation annulée pour l'utilisateur ${userId}`);
            break;
          }
          
          // Récupérer une page d'activités
          const activities = await this._fetchActivitiesWithTimeout(
            accessToken,
            {
              ...params,
              page,
              per_page: this.batchSize
            },
            30000 // 30 secondes de timeout
          );
          
          // Si nous n'avons pas d'activités, nous avons terminé
          if (!activities || activities.length === 0) {
            hasMoreActivities = false;
            break;
          }
          
          // Traiter le lot d'activités
          const batchStats = await this._processActivitiesBatch(userId, activities);
          processedCount += activities.length;
          
          // Mettre à jour le statut
          const progress = Math.min(100, Math.round((processedCount / estimatedTotal) * 100));
          await this._updateSyncStatus(userId, {
            progress,
            stats: {
              processed: processedCount,
              added: (currentStatus.stats.added || 0) + batchStats.added,
              updated: (currentStatus.stats.updated || 0) + batchStats.updated,
              failed: (currentStatus.stats.failed || 0) + batchStats.failed,
              skipped: (currentStatus.stats.skipped || 0) + batchStats.skipped
            },
            message: `Synchronisation en cours: ${processedCount}/${estimatedTotal} activités (${progress}%)`
          });
          
          // Réinitialiser le compteur d'erreurs consécutives et enregistrer la dernière page réussie
          consecutiveErrors = 0;
          lastSuccessfulPage = page;
          
          // Passer à la page suivante
          page++;
          
          // Pause pour éviter de dépasser les limites de l'API
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          consecutiveErrors++;
          logger.error(`Erreur lors de la récupération des activités (page ${page}): ${error.message}`);
          
          // Mettre à jour le statut avec l'erreur
          await this._updateSyncStatus(userId, {
            error: {
              message: `Erreur lors de la récupération des activités: ${error.message}`,
              code: this._classifyError(error)
            }
          });
          
          // Stratégie de reprise: si moins de 3 erreurs consécutives, réessayer
          if (consecutiveErrors < 3) {
            logger.info(`Tentative de reprise pour l'utilisateur ${userId}, page ${page} (tentative ${consecutiveErrors})`);
            await new Promise(resolve => setTimeout(resolve, 2000 * consecutiveErrors)); // Attente progressive
            continue;
          }
          
          // Si nous avons déjà traité des activités, considérer comme un succès partiel
          if (processedCount > 0) {
            logger.warn(`Synchronisation partiellement réussie pour ${userId}: ${processedCount} activités traitées`);
            break;
          }
          
          // Sinon, marquer comme échouée
          await this._updateSyncStatus(userId, {
            status: 'failed',
            message: `Échec de la synchronisation: ${error.message}`
          });
          
          // Supprimer de la liste des synchronisations en cours
          this.syncInProgress.delete(userId);
          return;
        }
      }
      
      // Synchronisation terminée avec succès
      const finalStatus = this.syncJobs.get(userId);
      await this._updateSyncStatus(userId, {
        status: 'completed',
        progress: 100,
        endTime: new Date(),
        message: `Synchronisation terminée: ${finalStatus.stats.processed} activités traitées`
      });
      
      // Enregistrer la date de dernière synchronisation
      await this._saveLastSyncTime(userId);
      
      // Envoyer une notification à l'utilisateur
      await notificationService.sendToUser(userId, {
        type: 'sync_completed',
        title: 'Synchronisation Strava terminée',
        message: `${finalStatus.stats.added} activités ajoutées, ${finalStatus.stats.updated} mises à jour`
      });
      
      logger.info(`Synchronisation terminée pour l'utilisateur ${userId}`);
    } catch (error) {
      logger.error(`Erreur lors de la synchronisation pour ${userId}: ${error.message}`);
      
      // Mettre à jour le statut
      await this._updateSyncStatus(userId, {
        status: 'failed',
        error: {
          message: error.message,
          code: this._classifyError(error)
        },
        endTime: new Date(),
        message: `Échec de la synchronisation: ${error.message}`
      });
    } finally {
      // Supprimer de la liste des synchronisations en cours
      this.syncInProgress.delete(userId);
    }
  }

  /**
   * Récupère une page d'activités avec un timeout
   * @param {string} accessToken Token d'accès Strava
   * @param {Object} params Paramètres de l'API
   * @param {number} timeout Délai d'expiration en ms
   * @returns {Promise<Array>} Liste des activités
   * @private
   */
  async _fetchActivitiesWithTimeout(accessToken, params, timeout) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Timeout lors de la récupération des activités Strava'));
      }, timeout);
      
      stravaService.getActivities(accessToken, params)
        .then(activities => {
          clearTimeout(timeoutId);
          resolve(activities);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * Traite un lot d'activités
   * @param {string} userId ID de l'utilisateur
   * @param {Array} activities Liste des activités à traiter
   * @returns {Promise<Object>} Statistiques du traitement
   * @private
   */
  async _processActivitiesBatch(userId, activities) {
    const stats = {
      added: 0,
      updated: 0,
      failed: 0,
      skipped: 0
    };
    
    // Traiter les activités en séquence pour éviter les problèmes de concurrence
    for (const activity of activities) {
      try {
        // Vérifier si l'activité existe déjà
        const existingActivity = await Activity.findOne({
          stravaId: activity.id,
          userId
        });
        
        if (existingActivity) {
          // Vérifier si une mise à jour est nécessaire
          if (new Date(activity.start_date) > new Date(existingActivity.lastSyncTime)) {
            await Activity.updateOne(
              { _id: existingActivity._id },
              {
                $set: this._mapStravaActivity(activity, userId),
                lastSyncTime: new Date()
              }
            );
            stats.updated++;
          } else {
            stats.skipped++;
          }
        } else {
          // Créer une nouvelle activité
          await Activity.create(this._mapStravaActivity(activity, userId));
          stats.added++;
        }
      } catch (error) {
        logger.error(`Erreur lors du traitement de l'activité Strava ${activity.id}`, {
          error: error.message
        });
        stats.failed++;
      }
    }
    
    return stats;
  }

  /**
   * Convertit une activité Strava au format de l'application
   * @param {Object} activity Activité Strava
   * @param {string} userId ID de l'utilisateur
   * @returns {Object} Activité au format de l'application
   * @private
   */
  _mapStravaActivity(activity, userId) {
    return {
      userId,
      stravaId: activity.id,
      name: activity.name,
      type: activity.type,
      startDate: new Date(activity.start_date),
      startDateLocal: new Date(activity.start_date_local),
      timezone: activity.timezone,
      distance: activity.distance,
      movingTime: activity.moving_time,
      elapsedTime: activity.elapsed_time,
      totalElevationGain: activity.total_elevation_gain,
      startLatitude: activity.start_latlng ? activity.start_latlng[0] : null,
      startLongitude: activity.start_latlng ? activity.start_latlng[1] : null,
      endLatitude: activity.end_latlng ? activity.end_latlng[0] : null,
      endLongitude: activity.end_latlng ? activity.end_latlng[1] : null,
      achievementCount: activity.achievement_count,
      kudosCount: activity.kudos_count,
      commentCount: activity.comment_count,
      athleteCount: activity.athlete_count,
      photoCount: activity.photo_count,
      map: activity.map ? {
        id: activity.map.id,
        summaryPolyline: activity.map.summary_polyline,
        polyline: activity.map.polyline
      } : null,
      trainer: activity.trainer,
      commute: activity.commute,
      manual: activity.manual,
      private: activity.private,
      flagged: activity.flagged,
      workoutType: activity.workout_type,
      averageSpeed: activity.average_speed,
      maxSpeed: activity.max_speed,
      deviceName: activity.device_name,
      averageCadence: activity.average_cadence,
      averageHeartrate: activity.average_heartrate,
      maxHeartrate: activity.max_heartrate,
      lastSyncTime: new Date()
    };
  }

  /**
   * Estime le nombre total d'activités à synchroniser
   * @param {string} userId ID de l'utilisateur
   * @param {string} accessToken Token d'accès Strava
   * @param {Object} params Paramètres de l'API
   * @returns {Promise<number>} Nombre estimé d'activités
   * @private
   */
  async _estimateTotalActivities(userId, accessToken, params) {
    try {
      // Récupérer le nombre d'activités déjà en base
      let estimatedTotal;
      
      if (params.after) {
        // Si on a une date de début, compter les activités depuis cette date dans Strava
        const initialPage = await stravaService.getActivities(accessToken, {
          ...params,
          page: 1,
          per_page: 1
        });
        
        // Récupérer uniquement le premier élément pour voir combien d'activités il y a
        estimatedTotal = initialPage.length > 0 ? 30 : 0; // Estimation grossière
      } else {
        // Pour une synchronisation complète, utiliser les statistiques de l'athlète
        const athleteStats = await stravaService.getAthleteStats(accessToken);
        estimatedTotal = athleteStats.all_ride_totals.count + athleteStats.all_run_totals.count;
      }
      
      return estimatedTotal;
    } catch (error) {
      logger.warn(`Impossible d'estimer le nombre total d'activités pour ${userId}`, {
        error: error.message
      });
      
      // Valeur par défaut
      return 50;
    }
  }

  /**
   * Construit les paramètres pour l'API Strava
   * @param {Object} options Options de synchronisation
   * @param {Date} lastSyncTime Date de dernière synchronisation
   * @returns {Object} Paramètres pour l'API
   * @private
   */
  _buildApiParams(options, lastSyncTime) {
    const params = {};
    
    // Si synchronisation complète, ne pas spécifier de date de début
    if (!options.fullSync && lastSyncTime) {
      // Convertir en timestamp Unix pour Strava (secondes)
      params.after = Math.floor(lastSyncTime.getTime() / 1000);
    } else if (options.startDate) {
      // Utiliser la date de début spécifiée
      params.after = Math.floor(options.startDate.getTime() / 1000);
    } else if (options.daysToSync) {
      // Calculer la date de début basée sur le nombre de jours
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - options.daysToSync);
      params.after = Math.floor(startDate.getTime() / 1000);
    }
    
    // Date de fin optionnelle
    if (options.endDate) {
      params.before = Math.floor(options.endDate.getTime() / 1000);
    }
    
    return params;
  }

  /**
   * Prépare les options de synchronisation
   * @param {string} userId ID de l'utilisateur
   * @param {Object} userOptions Options fournies par l'utilisateur
   * @returns {Object} Options normalisées
   * @private
   */
  _prepareSyncOptions(userId, userOptions) {
    const defaultOptions = {
      fullSync: false,
      daysToSync: 30,
      startDate: null,
      endDate: null
    };
    
    const options = { ...defaultOptions, ...userOptions };
    
    // Si fullSync est true, ignorer les autres options de date
    if (options.fullSync) {
      options.daysToSync = null;
      options.startDate = null;
      options.endDate = null;
    } 
    // Convertir les dates si elles sont en string
    else {
      if (options.startDate && !(options.startDate instanceof Date)) {
        options.startDate = new Date(options.startDate);
      }
      
      if (options.endDate && !(options.endDate instanceof Date)) {
        options.endDate = new Date(options.endDate);
      }
    }
    
    return options;
  }

  /**
   * Met à jour le statut d'une synchronisation
   * @param {string} userId ID de l'utilisateur
   * @param {Object} updates Mises à jour du statut
   * @returns {Promise<Object>} Statut mis à jour
   * @private
   */
  async _updateSyncStatus(userId, updates) {
    // Récupérer le statut actuel
    const currentStatus = this.syncJobs.get(userId) || {
      userId,
      status: 'unknown',
      progress: 0,
      startTime: new Date(),
      stats: {
        total: 0,
        processed: 0,
        added: 0,
        updated: 0,
        failed: 0,
        skipped: 0
      }
    };
    
    // Mettre à jour le statut
    const updatedStatus = {
      ...currentStatus,
      ...updates,
      lastUpdate: new Date()
    };
    
    // Si les stats sont présentes dans les mises à jour, les fusionner
    if (updates.stats) {
      updatedStatus.stats = {
        ...currentStatus.stats,
        ...updates.stats
      };
    }
    
    // Enregistrer le statut
    this.syncJobs.set(userId, updatedStatus);
    await this._saveSyncStatus(userId, updatedStatus);
    
    return updatedStatus;
  }

  /**
   * Enregistre le statut d'une synchronisation dans le cache
   * @param {string} userId ID de l'utilisateur
   * @param {Object} status Statut à enregistrer
   * @private
   */
  async _saveSyncStatus(userId, status) {
    const cacheKey = `${this.cacheKeyPrefix}${userId}`;
    await cacheService.set(cacheKey, status, 24 * 60 * 60); // 24h TTL
  }

  /**
   * Classe une erreur par type
   * @param {Error} error Erreur à classifier
   * @returns {string} Code d'erreur
   * @private
   */
  _classifyError(error) {
    if (error.code === 'TOKEN_EXPIRED' || error.message.includes('token') || error.message.includes('autorisation')) {
      return this.ERROR_CODES.TOKEN_EXPIRED;
    }
    
    if (error.status === 429 || error.message.includes('rate limit') || error.message.includes('quota dépassé')) {
      return this.ERROR_CODES.RATE_LIMIT;
    }
    
    if (error.status >= 500 || error.message.includes('server') || error.message.includes('serveur')) {
      return this.ERROR_CODES.SERVER;
    }
    
    if (error.status === 404 || error.message.includes('not found') || error.message.includes('introuvable')) {
      return this.ERROR_CODES.NOT_FOUND;
    }
    
    if (!error.response || error.code === 'ECONNABORTED' || error.message.includes('timeout') || error.message.includes('réseau')) {
      return this.ERROR_CODES.NETWORK;
    }
    
    return this.ERROR_CODES.UNKNOWN;
  }

  /**
   * Traite la file d'attente des synchronisations
   * @private
   */
  async _processQueue() {
    if (this.syncQueue.length === 0 || this.syncInProgress.size >= this.maxConcurrentSyncs) {
      return;
    }
    
    const { userId, options, resolve, reject } = this.syncQueue.shift();
    
    try {
      // Vérifier si une synchronisation est déjà en cours pour cet utilisateur
      if (this.syncInProgress.has(userId)) {
        const status = await this.getSyncStatus(userId);
        resolve(status);
        return;
      }
      
      // Démarrer la synchronisation
      const syncStatus = await this._startSyncInternal(userId, options);
      resolve(syncStatus);
    } catch (error) {
      reject(error);
    }
  }
}

// Exporter une instance singleton
const stravaSyncService = new StravaSyncService();
module.exports = stravaSyncService;
