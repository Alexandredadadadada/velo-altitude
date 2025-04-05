/**
 * Gestionnaire de quotas d'API
 * Permet de suivre et gérer la consommation des ressources API
 * Implémente des stratégies de limitation et de priorisation
 */

const fs = require('fs');
const path = require('path');
const { logger } = require('./logger');
const { EventEmitter } = require('events');

class ApiQuotaManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // Configuration par défaut
    this.config = {
      quotaPerDay: options.quotaPerDay || 2000,        // Nombre maximal d'appels par jour
      quotaPerHour: options.quotaPerHour || 200,       // Nombre maximal d'appels par heure
      quotaPerMinute: options.quotaPerMinute || 40,    // Nombre maximal d'appels par minute
      warningThreshold: options.warningThreshold || 0.8, // Seuil d'alerte (80% du quota)
      dataDirectory: options.dataDirectory || path.join(__dirname, '../data/quota'),
      resetTime: options.resetTime || '00:00',         // Heure de réinitialisation des compteurs journaliers
      apiName: options.apiName || 'openroute',         // Nom de l'API pour les logs et fichiers
      realTimeTracking: options.realTimeTracking !== false, // Activer le suivi en temps réel
      adaptiveQuota: options.adaptiveQuota !== false,  // Ajuster les quotas en fonction de l'utilisation
      telemetryInterval: options.telemetryInterval || 5000 // Intervalle de télémétrie en ms
    };
    
    // Initialisation des compteurs
    this.counters = {
      daily: 0,
      hourly: {},
      minute: {},
      lastReset: {
        daily: null,
        hourly: {},
        minute: {}
      }
    };
    
    // File d'attente pour les requêtes en attente
    this.queue = {
      high: [],    // Priorité haute
      normal: [],  // Priorité normale
      low: []      // Priorité basse
    };
    
    // État du gestionnaire
    this.state = {
      isLimited: false,
      limitReason: null,
      limitUntil: null,
      activeRequests: 0,
      lastRequestTime: null,
      currentRate: 0 // Requêtes par minute
    };
    
    // Statistiques
    this.stats = {
      totalRequests: 0,
      limitedRequests: 0,
      queuedRequests: 0,
      priorityRequests: 0,
      lastWarning: null,
      requestsByEndpoint: {},
      averageResponseTime: 0,
      responseTimeHistory: [],
      successRate: 100,
      errorsByType: {}
    };
    
    // Suivi en temps réel
    this.realTimeData = {
      rateHistory: [], // Historique des taux de requêtes
      quotaUsageHistory: [], // Historique d'utilisation des quotas
      activeEndpoints: new Set(), // Endpoints actuellement actifs
      lastTelemetry: Date.now()
    };
    
    // Créer le répertoire de données si nécessaire
    this._ensureDirectoryExists();
    
    // Charger les données existantes
    this._loadState();
    
    // Configurer la vérification périodique
    this.checkInterval = setInterval(() => this._periodicCheck(), 60000); // Vérification toutes les minutes
    
    // Configurer la télémétrie en temps réel si activée
    if (this.config.realTimeTracking) {
      this.telemetryInterval = setInterval(() => this._collectTelemetry(), this.config.telemetryInterval);
    }
    
    logger.info(`Gestionnaire de quotas pour l'API ${this.config.apiName} initialisé`);
  }
  
  /**
   * Vérifie si une requête API peut être effectuée
   * @param {Object} options Options de la requête
   * @param {string} options.priority Priorité ('high', 'normal', 'low')
   * @returns {boolean} True si la requête peut être effectuée
   */
  canMakeRequest(options = {}) {
    // Mise à jour des compteurs
    this._updateCounters();
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const minuteKey = `${currentHour}:${currentMinute}`;
    
    // Récupérer les compteurs actuels
    const dailyCount = this.counters.daily;
    const hourlyCount = this.counters.hourly[currentHour] || 0;
    const minuteCount = this.counters.minute[minuteKey] || 0;
    
    // Vérifier si les limites sont atteintes
    const isDailyLimitReached = dailyCount >= this.config.quotaPerDay;
    const isHourlyLimitReached = hourlyCount >= this.config.quotaPerHour;
    const isMinuteLimitReached = minuteCount >= this.config.quotaPerMinute;
    
    // Vérifier la priorité de la requête
    const priority = options.priority || 'normal';
    
    // Les requêtes de haute priorité peuvent dépasser légèrement les limites par minute
    if (priority === 'high') {
      // Même les requêtes de haute priorité ne peuvent pas dépasser les limites quotidiennes
      if (isDailyLimitReached) {
        this._setLimitedState('daily', this._getNextResetTime('daily'));
        return false;
      }
      
      // Les requêtes de haute priorité peuvent dépasser de 20% la limite horaire
      const highPriorityHourlyLimit = Math.ceil(this.config.quotaPerHour * 1.2);
      if (hourlyCount >= highPriorityHourlyLimit) {
        this._setLimitedState('hourly', this._getNextResetTime('hourly'));
        return false;
      }
      
      // Les requêtes de haute priorité peuvent dépasser de 50% la limite par minute
      const highPriorityMinuteLimit = Math.ceil(this.config.quotaPerMinute * 1.5);
      return minuteCount < highPriorityMinuteLimit;
    }
    
    // Les requêtes normales suivent strictement les limites
    if (priority === 'normal') {
      if (isDailyLimitReached) {
        this._setLimitedState('daily', this._getNextResetTime('daily'));
        return false;
      }
      
      if (isHourlyLimitReached) {
        this._setLimitedState('hourly', this._getNextResetTime('hourly'));
        return false;
      }
      
      if (isMinuteLimitReached) {
        this._setLimitedState('minute', this._getNextResetTime('minute'));
        return false;
      }
      
      return true;
    }
    
    // Les requêtes de basse priorité sont plus restrictives
    if (priority === 'low') {
      // Vérifier si on approche des limites (80%)
      const isDailyLimitApproaching = dailyCount >= this.config.quotaPerDay * 0.8;
      const isHourlyLimitApproaching = hourlyCount >= this.config.quotaPerHour * 0.8;
      const isMinuteLimitApproaching = minuteCount >= this.config.quotaPerMinute * 0.8;
      
      if (isDailyLimitApproaching || isHourlyLimitApproaching || isMinuteLimitApproaching) {
        // Si on approche des limites, mettre en file d'attente les requêtes de basse priorité
        return false;
      }
      
      return true;
    }
    
    // Par défaut, vérifier les limites standard
    if (isDailyLimitReached || isHourlyLimitReached || isMinuteLimitReached) {
      const limitType = isDailyLimitReached ? 'daily' : isHourlyLimitReached ? 'hourly' : 'minute';
      this._setLimitedState(limitType, this._getNextResetTime(limitType));
      return false;
    }
    
    return true;
  }
  
  /**
   * Ajoute une requête à la file d'attente pour exécution ultérieure
   * @param {Function} requestFunction Fonction à exécuter lorsque possible
   * @param {Object} options Options de la requête
   * @param {string} options.priority Priorité ('high', 'normal', 'low')
   * @param {number} options.timeout Délai maximum d'attente en ms
   * @param {string} options.endpoint Point d'accès de la requête
   * @param {Object} options.context Contexte supplémentaire pour la requête
   * @returns {Promise} Promesse résolue lorsque la requête est traitée
   */
  queueRequest(requestFunction, options = {}) {
    return new Promise((resolve, reject) => {
      const priority = options.priority || 'normal';
      const timeout = options.timeout || 30000; // 30 secondes par défaut
      const endpoint = options.endpoint || 'unknown';
      
      // Vérifier si la file d'attente est disponible
      if (!this.queue[priority]) {
        logger.warn(`Priorité invalide: ${priority}, utilisation de 'normal'`);
        priority = 'normal';
      }
      
      const queueItem = {
        fn: requestFunction,
        priority,
        added: Date.now(),
        timeout: Date.now() + timeout,
        endpoint,
        context: options.context || {},
        resolve,
        reject,
        retryCount: 0,
        maxRetries: options.maxRetries || 3
      };
      
      // Ajouter à la file d'attente
      this.queue[priority].push(queueItem);
      this.stats.queuedRequests++;
      
      if (priority === 'high') {
        this.stats.priorityRequests++;
      }
      
      logger.info(`Requête ajoutée à la file d'attente (priorité: ${priority}, endpoint: ${endpoint}, position: ${this.queue[priority].length})`);
      
      // Émettre un événement pour le suivi en temps réel
      this.emit('queued', {
        timestamp: new Date().toISOString(),
        priority,
        endpoint,
        queueLengths: {
          high: this.queue.high.length,
          normal: this.queue.normal.length,
          low: this.queue.low.length
        }
      });
      
      // Planifier le traitement de la file d'attente
      setTimeout(() => this._processQueue(), 100);
    });
  }
  
  /**
   * Traite les requêtes en file d'attente si possible
   * @private
   */
  _processQueue() {
    // Vérifier s'il y a des requêtes en attente
    const totalQueuedRequests = this.queue.high.length + this.queue.normal.length + this.queue.low.length;
    if (totalQueuedRequests === 0) {
      return;
    }
    
    // Traiter d'abord les requêtes de haute priorité
    if (this.queue.high.length > 0 && this.canMakeRequest({ priority: 'high' })) {
      this._processQueueItem(this.queue.high.shift(), 'high');
      return;
    }
    
    // Ensuite les requêtes de priorité normale
    if (this.queue.normal.length > 0 && this.canMakeRequest({ priority: 'normal' })) {
      this._processQueueItem(this.queue.normal.shift(), 'normal');
      return;
    }
    
    // Enfin les requêtes de basse priorité
    if (this.queue.low.length > 0 && this.canMakeRequest({ priority: 'low' })) {
      this._processQueueItem(this.queue.low.shift(), 'low');
      return;
    }
    
    // Si on arrive ici, c'est qu'aucune requête ne peut être traitée pour le moment
    // Planifier une nouvelle tentative
    const backoffTime = this.state.isLimited ? 10000 : 1000; // Attendre plus longtemps si limité
    setTimeout(() => this._processQueue(), backoffTime);
  }
  
  /**
   * Traite un élément de la file d'attente
   * @param {Object} item Élément de la file d'attente
   * @param {string} priorityLevel Niveau de priorité ('high', 'normal', 'low')
   * @private
   */
  _processQueueItem(item, priorityLevel) {
    // Vérifier si l'élément a expiré
    if (Date.now() > item.timeout) {
      item.reject(new Error(`La requête a expiré dans la file d'attente après ${Math.round((Date.now() - item.added) / 1000)}s`));
      logger.warn(`Requête expirée après ${Math.round((Date.now() - item.added) / 1000)}s dans la file d'attente (priorité: ${priorityLevel}, endpoint: ${item.endpoint})`);
      
      // Continuer avec la file d'attente
      setImmediate(() => this._processQueue());
      return;
    }
    
    // Incrémenter le compteur de requêtes actives
    this.state.activeRequests++;
    
    // Mesurer le temps d'exécution
    const startTime = Date.now();
    
    // Exécuter la requête
    try {
      Promise.resolve(item.fn())
        .then(result => {
          // Calculer le temps de réponse
          const responseTime = Date.now() - startTime;
          
          // Résoudre la promesse
          item.resolve(result);
          
          // Enregistrer la requête réussie
          this.recordRequest({ 
            endpoint: item.endpoint,
            responseTime,
            success: true,
            context: item.context
          });
          
          // Émettre un événement pour le suivi en temps réel
          this.emit('dequeued', {
            timestamp: new Date().toISOString(),
            priority: priorityLevel,
            endpoint: item.endpoint,
            success: true,
            responseTime,
            queueTime: startTime - item.added
          });
        })
        .catch(error => {
          // Calculer le temps de réponse
          const responseTime = Date.now() - startTime;
          
          // Vérifier si on doit réessayer
          if (item.retryCount < item.maxRetries) {
            item.retryCount++;
            
            // Calculer le délai de backoff exponentiel
            const backoffDelay = Math.min(1000 * Math.pow(2, item.retryCount), 30000);
            
            logger.warn(`Échec de la requête (${item.endpoint}), nouvelle tentative ${item.retryCount}/${item.maxRetries} dans ${backoffDelay}ms: ${error.message}`);
            
            // Remettre dans la file d'attente avec un délai
            setTimeout(() => {
              // Remettre en file d'attente avec une priorité plus élevée pour les retries
              const retryPriority = priorityLevel === 'low' ? 'normal' : priorityLevel;
              this.queue[retryPriority].push(item);
              this._processQueue();
            }, backoffDelay);
          } else {
            // Échec définitif après toutes les tentatives
            item.reject(error);
            
            // Enregistrer l'échec
            this.recordRequest({ 
              endpoint: item.endpoint,
              responseTime,
              success: false,
              error: error.message,
              errorType: error.name || 'UnknownError',
              context: item.context
            });
            
            // Émettre un événement pour le suivi en temps réel
            this.emit('dequeued', {
              timestamp: new Date().toISOString(),
              priority: priorityLevel,
              endpoint: item.endpoint,
              success: false,
              error: error.message,
              responseTime,
              queueTime: startTime - item.added,
              retries: item.retryCount
            });
          }
        })
        .finally(() => {
          // Décrémenter le compteur de requêtes actives
          this.state.activeRequests = Math.max(0, this.state.activeRequests - 1);
          
          // Continuer avec la file d'attente après un court délai
          // pour éviter de surcharger l'API
          setTimeout(() => this._processQueue(), 200);
        });
    } catch (error) {
      // Erreur synchrone lors de l'exécution
      item.reject(error);
      
      // Enregistrer l'échec
      this.recordRequest({ 
        endpoint: item.endpoint,
        success: false,
        error: error.message,
        errorType: 'SyncError',
        context: item.context
      });
      
      // Décrémenter le compteur de requêtes actives
      this.state.activeRequests = Math.max(0, this.state.activeRequests - 1);
      
      // Continuer avec la file d'attente
      setTimeout(() => this._processQueue(), 200);
    }
  }
  
  /**
   * Définit l'état limité du gestionnaire
   * @param {string} reason Raison de la limitation
   * @param {number} until Timestamp jusqu'auquel la limitation est active
   * @private
   */
  _setLimitedState(reason, until) {
    if (!this.state.isLimited) {
      this.state.isLimited = true;
      this.state.limitReason = reason;
      this.state.limitUntil = until;
      
      this.stats.limitedRequests++;
      
      logger.warn(`API limitée: ${reason}, jusqu'à ${new Date(until).toISOString()}`);
      
      // Émettre un événement pour le suivi en temps réel
      this.emit('limited', {
        timestamp: new Date().toISOString(),
        reason,
        until: new Date(until).toISOString(),
        queueLengths: {
          high: this.queue.high.length,
          normal: this.queue.normal.length,
          low: this.queue.low.length
        }
      });
      
      // Planifier la réinitialisation de l'état limité
      setTimeout(() => this._resetLimitedState(), until - Date.now());
    }
  }
  
  /**
   * Réinitialise l'état limité du gestionnaire
   * @private
   */
  _resetLimitedState() {
    if (this.state.isLimited && Date.now() >= this.state.limitUntil) {
      this.state.isLimited = false;
      this.state.limitReason = null;
      this.state.limitUntil = null;
      
      logger.info('État limité réinitialisé, reprise du traitement des requêtes');
      
      // Émettre un événement pour le suivi en temps réel
      this.emit('unlimited', {
        timestamp: new Date().toISOString()
      });
      
      // Traiter la file d'attente
      this._processQueue();
    }
  }
  
  /**
   * Calcule le prochain temps de réinitialisation pour un type de compteur
   * @param {string} type Type de compteur ('daily', 'hourly', 'minute')
   * @returns {number} Timestamp du prochain temps de réinitialisation
   * @private
   */
  _getNextResetTime(type) {
    const now = new Date();
    
    switch (type) {
      case 'daily':
        // Réinitialisation à l'heure configurée le jour suivant
        const [resetHour, resetMinute] = this.config.resetTime.split(':').map(Number);
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(resetHour, resetMinute, 0, 0);
        return tomorrow.getTime();
        
      case 'hourly':
        // Réinitialisation à la prochaine heure
        const nextHour = new Date(now);
        nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
        return nextHour.getTime();
        
      case 'minute':
        // Réinitialisation à la prochaine minute
        const nextMinute = new Date(now);
        nextMinute.setMinutes(nextMinute.getMinutes() + 1, 0, 0);
        return nextMinute.getTime();
        
      default:
        // Par défaut, réinitialisation dans 5 minutes
        return now.getTime() + 300000;
    }
  }
  
  /**
   * Effectue une récupération automatique en cas de problème
   * @param {string} errorType Type d'erreur rencontrée
   * @returns {Object} Stratégie de récupération
   */
  autoRecover(errorType) {
    // Stratégies de récupération par type d'erreur
    const recoveryStrategies = {
      'RateLimitExceeded': {
        action: 'wait',
        delay: 60000, // Attendre 1 minute
        message: 'Limite de taux dépassée, attente avant nouvelle tentative'
      },
      'QuotaExceeded': {
        action: 'wait',
        delay: 3600000, // Attendre 1 heure
        message: 'Quota dépassé, attente prolongée avant nouvelle tentative'
      },
      'NetworkError': {
        action: 'retry',
        maxRetries: 3,
        backoffFactor: 2,
        initialDelay: 1000,
        message: 'Erreur réseau, nouvelles tentatives avec backoff exponentiel'
      },
      'ServerError': {
        action: 'retry',
        maxRetries: 2,
        backoffFactor: 3,
        initialDelay: 2000,
        message: 'Erreur serveur, nouvelles tentatives limitées'
      },
      'AuthenticationError': {
        action: 'alert',
        message: 'Erreur d\'authentification, intervention manuelle requise'
      },
      'TimeoutError': {
        action: 'retry',
        maxRetries: 2,
        backoffFactor: 1.5,
        initialDelay: 2000,
        message: 'Délai d\'attente dépassé, nouvelles tentatives avec délai augmenté'
      }
    };
    
    // Récupérer la stratégie correspondante ou la stratégie par défaut
    const strategy = recoveryStrategies[errorType] || {
      action: 'retry',
      maxRetries: 1,
      backoffFactor: 2,
      initialDelay: 1000,
      message: 'Erreur inconnue, tentative unique de récupération'
    };
    
    // Journaliser la stratégie de récupération
    logger.info(`Récupération automatique pour ${errorType}: ${strategy.message}`);
    
    // Émettre un événement pour le suivi en temps réel
    this.emit('recovery', {
      timestamp: new Date().toISOString(),
      errorType,
      strategy
    });
    
    return strategy;
  }
  
  /**
   * Ferme proprement le gestionnaire de quotas
   */
  shutdown() {
    // Arrêter les intervalles
    clearInterval(this.checkInterval);
    
    if (this.telemetryInterval) {
      clearInterval(this.telemetryInterval);
    }
    
    // Sauvegarder l'état actuel
    this._saveState();
    
    // Rejeter toutes les requêtes en attente
    const rejectAllInQueue = (queue, reason) => {
      while (queue.length > 0) {
        const item = queue.shift();
        item.reject(new Error(reason));
      }
    };
    
    rejectAllInQueue(this.queue.high, 'Arrêt du gestionnaire de quotas');
    rejectAllInQueue(this.queue.normal, 'Arrêt du gestionnaire de quotas');
    rejectAllInQueue(this.queue.low, 'Arrêt du gestionnaire de quotas');
    
    logger.info(`Gestionnaire de quotas pour l'API ${this.config.apiName} arrêté proprement`);
  }
  
  // ... (autres méthodes restent inchangées)
}

// Créer une instance singleton
const apiQuotaManager = new ApiQuotaManager({
  apiName: 'openroute',
  quotaPerDay: 2000,  // Ajuster selon les limites réelles de l'API
  quotaPerHour: 200,
  quotaPerMinute: 40
});

module.exports = apiQuotaManager;
