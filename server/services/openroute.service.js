// openroute.service.js - Service pour l'intégration avec l'API OpenRouteService
const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');
const { enrichError } = require('../utils/error-utils');
const cacheService = require('./cache.service');
const apiKeyManager = require('../utils/apiKeyManager');
const performanceMonitor = require('./performance-monitor.service');
const routeCache = require('../utils/routeCache');
const ApiQuotaManager = require('../utils/apiQuotaManager');
const quotaAnalytics = require('../utils/quota-analytics');
const errorRecoveryService = require('./error-recovery.service');
const apiKeyRotationManager = require('../utils/api-key-rotation');
const apiServices = require('./apiServices');
const { 
  promiseWithTimeout, 
  retryAsync, 
  parallelLimit, 
  allSettled,
  circuitBreaker,
  adaptiveTimeout,
  retryWithBackoff,
  CircuitBreaker,
  Bulkhead
} = require('../utils/promise-helpers');
const { parseHttpError } = require('../utils/error-utils');

class OpenRouteService {
  constructor() {
    this.apiKey = config.openRoute?.apiKey || process.env.OPENROUTE_API_KEY;
    this.baseUrl = config.openRoute?.baseUrl || 'https://api.openrouteservice.org';
    this.profile = config.openRoute?.profile || 'cycling-road';
    this.options = config.openRoute?.options || {
      preference: 'recommended',
      units: 'km',
      language: 'fr-fr'
    };
    this.timeout = config.openRoute?.timeout || 10000; // Timeout par défaut: 10s
    this.retryConfig = {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 10000
    };
    
    // Initialiser le gestionnaire de quotas amélioré
    this.quotaManager = ApiQuotaManager;
    
    // Configurer les écouteurs d'événements pour le suivi en temps réel
    this._setupQuotaEventListeners();
    
    // Initialiser la rotation des clés API
    this._setupApiKeyRotation();
    
    // Initialiser les métriques de performance
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cacheHits: 0,
      averageResponseTime: 0,
      lastResponseTimes: [],
      quotaLimits: 0,
      queuedRequests: 0
    };
    
    // Configurer les stratégies de résilience
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      resetTimeout: 30000,
      onOpen: () => {
        logger.warn('Circuit breaker ouvert pour OpenRouteService API');
        this._sendAdminAlert('Circuit Breaker activé', {
          reason: 'Trop d\'erreurs consécutives',
          timestamp: new Date().toISOString()
        });
      },
      onClose: () => logger.info('Circuit breaker fermé pour OpenRouteService API'),
      onHalfOpen: () => logger.info('Circuit breaker en mode semi-ouvert pour OpenRouteService API')
    });
    
    // Configurer le bulkhead pour limiter les requêtes concurrentes
    this.bulkhead = new Bulkhead({
      maxConcurrent: 10,
      maxQueue: 100
    });
    
    // Initialiser le cache de routes
    try {
      routeCache.initialize();
      logger.info('Service de cache d\'itinéraires initialisé');
    } catch (error) {
      logger.error(`Erreur lors de l'initialisation du cache d'itinéraires: ${error.message}`);
    }
    
    logger.info('Service OpenRouteService initialisé avec cache, monitoring et gestion des quotas améliorée');
    
    this.serviceName = 'openRouteService'; // Définir le nom du service
    this.currentApiKey = null; // Stocker la clé API active
    this.apiKeyManager = apiKeyManager; // Référence au gestionnaire de clés API
  }
  
  /**
   * Configure les écouteurs d'événements pour le suivi en temps réel des quotas
   * @private
   */
  _setupQuotaEventListeners() {
    // Écouter les événements de limitation
    this.quotaManager.on('limited', (data) => {
      logger.warn(`API OpenRouteService limitée: ${data.reason}, jusqu'à ${data.until}`);
      this.metrics.quotaLimits++;
      
      // Enregistrer l'événement dans les analytics
      quotaAnalytics.recordUsage({
        success: false,
        endpoint: 'quota_limit',
        quotaExceeded: true,
        quotaExceededReason: data.reason
      });
      
      // Notifier les administrateurs si nécessaire
      if (data.reason === 'daily') {
        // Envoyer une alerte par email ou autre
        this._sendAdminAlert('Quota journalier OpenRouteService atteint', data);
      }
    });
    
    // Écouter les événements de télémétrie
    this.quotaManager.on('telemetry', (data) => {
      // Enregistrer les données de télémétrie pour analyse
      if (data.dailyPercentage > 80) {
        logger.warn(`Utilisation élevée de l'API OpenRouteService: ${data.dailyPercentage}% du quota journalier`);
      }
      
      // Ajuster dynamiquement les stratégies de cache si nécessaire
      if (data.dailyPercentage > 90) {
        // Augmenter la durée de cache pour économiser des requêtes
        logger.info('Augmentation de la durée de cache en raison d\'une utilisation élevée du quota');
      }
    });
    
    // Écouter les événements de récupération
    this.quotaManager.on('recovery', (data) => {
      logger.info(`Stratégie de récupération appliquée pour ${data.errorType}: ${data.strategy.message}`);
      
      // Enregistrer l'événement de récupération dans les analytics
      quotaAnalytics.recordUsage({
        success: true,
        endpoint: 'recovery',
        responseTime: 0
      });
    });
  }
  
  /**
   * Configure la rotation des clés API pour OpenRouteService
   * @private
   */
  _setupApiKeyRotation() {
    // Écouter les événements de quota pour déclencher une rotation si nécessaire
    this.quotaManager.on('quota-critical', (service, stats) => {
      if (service === 'openroute' && stats.currentUsage.dailyPercentage > 90) {
        logger.warn(`Quota OpenRouteService critique (${stats.currentUsage.dailyPercentage}%), rotation de clé déclenchée`);
        
        // Utiliser le nouveau système de rotation des clés
        apiServices.openRouteService.rotateKeys();
        
        // Mettre à jour la clé API active
        this.apiKey = apiServices.openRouteService.getKey();
        
        logger.info('Clé API OpenRouteService rotée avec succès');
      }
    });
  }
  
  /**
   * Envoie une alerte aux administrateurs
   * @param {string} subject Sujet de l'alerte
   * @param {Object} data Données associées
   * @private
   */
  _sendAdminAlert(subject, data) {
    // Implémentation à compléter (email, SMS, webhook, etc.)
    logger.error(`ALERTE ADMIN: ${subject}`, data);
    
    // Enregistrer l'alerte dans les analytics
    quotaAnalytics.recordUsage({
      success: false,
      endpoint: 'admin_alert',
      quotaExceeded: data.reason === 'daily',
      quotaExceededReason: data.reason
    });
  }
  
  /**
   * Effectue une requête API avec mécanisme de retry automatique
   * @param {Function} apiCall Fonction qui effectue l'appel API
   * @param {number} maxRetries Nombre maximum de tentatives
   * @param {number} initialDelay Délai initial entre les tentatives (ms)
   * @returns {Promise<any>} Résultat de l'appel API
   * @private
   */
  async _executeWithRetry(apiCall, maxRetries = 3, initialDelay = 1000) {
    let lastError;
    let attempt = 0;
    
    while (attempt <= maxRetries) {
      try {
        return await apiCall();
      } catch (error) {
        lastError = this._parseApiError(error);
        attempt++;
        
        // Si l'erreur n'est pas retryable ou si nous avons atteint le nombre maximum de tentatives
        if (!lastError.retryable || attempt > maxRetries) {
          throw lastError;
        }
        
        // Calculer le délai avant la prochaine tentative (avec backoff exponentiel)
        const delay = lastError.retryDelay || initialDelay * Math.pow(2, attempt - 1);
        
        logger.info(`Tentative ${attempt}/${maxRetries} échouée pour OpenRouteService. Nouvelle tentative dans ${delay}ms.`);
        
        // Attendre avant de réessayer
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }
  
  /**
   * Calcule un itinéraire cyclable entre deux points
   * @param {Array<number>} start Coordonnées du point de départ [longitude, latitude]
   * @param {Array<number>} end Coordonnées du point d'arrivée [longitude, latitude]
   * @param {Array<Array<number>>} waypoints Points intermédiaires [[long1, lat1], [long2, lat2], ...]
   * @param {Object} options Options supplémentaires pour le calcul d'itinéraire
   * @returns {Promise<object>} Données de l'itinéraire (geojson)
   */
  async getRoute(start, end, waypoints = [], options = {}) {
    const startTime = Date.now();
    const requestPriority = options.priority || 'normal';
    const cacheKey = this._generateCacheKey(start, end, waypoints, options);
    
    try {
      // Vérifier le cache d'abord
      const cachedRoute = await routeCache.get(cacheKey);
      if (cachedRoute) {
        this.metrics.cacheHits++;
        logger.debug('Itinéraire récupéré depuis le cache');
        
        // Enregistrer l'utilisation dans les analytics
        quotaAnalytics.recordUsage({
          success: true,
          endpoint: 'directions',
          responseTime: Date.now() - startTime,
          cached: true
        });
        
        return cachedRoute;
      }
      
      // Vérifier si nous pouvons faire une requête API
      const canMakeRequest = this.quotaManager.canMakeRequest({ 
        priority: requestPriority,
        endpoint: 'directions'
      });
      
      if (!canMakeRequest) {
        logger.warn(`Requête d'itinéraire mise en file d'attente (quota limité), priorité: ${requestPriority}`);
        
        // Mettre la requête en file d'attente
        return this._queueRouteRequest(start, end, waypoints, options);
      }
      
      // Préparer les données pour la requête
      const requestData = {
        coordinates: [start, ...waypoints, end],
        profile: options.profile || this.profile,
        preference: options.preference || this.options.preference,
        units: options.units || this.options.units,
        language: options.language || this.options.language,
        instructions: options.instructions !== undefined ? options.instructions : this.options.instructions,
        elevation: options.elevation !== undefined ? options.elevation : this.options.elevation
      };
      
      // Ajouter des options supplémentaires si présentes
      if (options.avoid) requestData.options = { avoid_features: options.avoid };
      if (options.maxSpeed) requestData.options = { ...(requestData.options || {}), maximum_speed: options.maxSpeed };
      
      // Effectuer la requête API avec le circuit breaker et retry automatique
      const routeData = await this.circuitBreaker.execute(async () => {
        return this.bulkhead.execute(async () => {
          return this._executeWithRetry(async () => {
            return this._makeRequest('v2/directions/' + requestData.profile, requestData, {
              method: 'POST',
              timeout: options.timeout || this.timeout,
              priority: requestPriority
            });
          }, 3, 2000);
        });
      });
      
      // Mettre en cache le résultat
      const cacheTTL = this._determineCacheTTL(requestData);
      await routeCache.set(cacheKey, routeData, cacheTTL);
      
      // Mettre à jour les métriques
      this._updateMetrics(Date.now() - startTime, true);
      
      // Enregistrer l'utilisation dans les analytics
      quotaAnalytics.recordUsage({
        success: true,
        endpoint: 'directions',
        responseTime: Date.now() - startTime
      });
      
      return routeData;
    } catch (error) {
      // Mettre à jour les métriques
      this._updateMetrics(Date.now() - startTime, false);
      
      // Enregistrer l'erreur dans les analytics
      quotaAnalytics.recordUsage({
        success: false,
        endpoint: 'directions',
        responseTime: Date.now() - startTime,
        error: error.message
      });
      
      // Enrichir l'erreur avec des informations contextuelles
      const enhancedError = this._parseApiError(error);
      
      // Journaliser l'erreur
      logger.error(`Erreur lors du calcul d'itinéraire: ${enhancedError.message}`, enhancedError);
      
      // Propager l'erreur
      throw enhancedError;
    }
  }
  
  /**
   * Met en file d'attente une requête d'itinéraire pour exécution ultérieure
   * @param {Array<number>} start Coordonnées du point de départ
   * @param {Array<number>} end Coordonnées du point d'arrivée
   * @param {Array<Array<number>>} waypoints Points intermédiaires
   * @param {Object} options Options supplémentaires
   * @returns {Promise<Object>} Résultat de la requête
   * @private
   */
  _queueRouteRequest(start, end, waypoints = [], options = {}) {
    this.metrics.queuedRequests++;
    
    // Enregistrer la mise en file d'attente dans les analytics
    quotaAnalytics.recordUsage({
      success: true,
      endpoint: 'directions_queued',
      priority: options.priority || 'normal'
    });
    
    return this.quotaManager.queueRequest(
      () => this.getRoute(start, end, waypoints, options),
      {
        priority: options.priority || 'normal',
        context: {
          type: 'route',
          start,
          end,
          waypoints: waypoints.length
        }
      }
    );
  }
  
  /**
   * Effectue une requête à l'API OpenRouteService avec gestion améliorée des erreurs et quotas
   * @param {string} endpoint Point d'entrée de l'API
   * @param {Object} data Données à envoyer
   * @param {Object} options Options de la requête
   * @returns {Promise<Object>} Réponse de l'API
   * @private
   */
  async _makeRequest(endpoint, data, options = {}) {
    // Démarrer la mesure de performance
    const endMeasure = performanceMonitor.startRequest('OpenRouteService');
    
    try {
      // Obtenir une clé API valide
      const apiKey = await this._getActiveApiKey();
      
      // Préparer les options de la requête
      const requestOptions = {
        method: options.method || 'GET',
        url: `${this.baseUrl}/${endpoint}`,
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Accept-Language': options.language || 'fr-FR'
        },
        timeout: options.timeout || this.timeout
      };
      
      // Ajouter les données selon la méthode
      if (requestOptions.method === 'GET') {
        requestOptions.params = data;
      } else {
        requestOptions.data = data;
      }
      
      // Effectuer la requête
      const response = await axios(requestOptions);
      
      // Enregistrer la réussite de la requête
      this.apiKeyManager.reportSuccessfulRequest(this.serviceName, apiKey);
      
      // Terminer la mesure de performance (succès)
      endMeasure();
      
      return response.data;
    } catch (error) {
      // Enrichir l'erreur
      const enhancedError = this._parseApiError(error);
      
      // Terminer la mesure de performance (échec)
      endMeasure(enhancedError);
      
      throw enhancedError;
    }
  }
  
  /**
   * Obtient la clé API active pour les requêtes
   * @returns {string} Clé API active
   * @private
   */
  _getActiveApiKey() {
    // Utiliser le nouveau système de gestion des clés API
    try {
      this.currentApiKey = apiServices.openRouteService.getKey();
      return this.currentApiKey;
    } catch (error) {
      logger.warn(`Erreur lors de la récupération de la clé API OpenRouteService: ${error.message}. Utilisation de la clé de secours.`);
      this.currentApiKey = this.apiKey;
      return this.currentApiKey;
    }
  }
  
  /**
   * Détermine la durée de mise en cache en fonction des paramètres de la requête
   * @param {Object} requestData Données de la requête
   * @returns {number} Durée de mise en cache en ms
   * @private
   */
  _determineCacheTTL(requestData) {
    // Obtenir les statistiques d'utilisation des quotas
    const stats = this.quotaManager.getStats();
    
    // Durée de base: 24 heures
    let baseTTL = 24 * 60 * 60 * 1000;
    
    // Si l'utilisation du quota est élevée, augmenter la durée de cache
    if (stats.currentUsage.dailyPercentage > 90) {
      baseTTL = 48 * 60 * 60 * 1000; // 48 heures
    } else if (stats.currentUsage.dailyPercentage > 75) {
      baseTTL = 36 * 60 * 60 * 1000; // 36 heures
    }
    
    // Ajuster en fonction du profil (les itinéraires de randonnée changent moins souvent)
    if (requestData.profile === 'cycling-mountain' || requestData.profile === 'hiking') {
      baseTTL *= 1.5; // 50% plus long pour les itinéraires de montagne/randonnée
    }
    
    // Ajuster en fonction de la préférence (les itinéraires les plus rapides peuvent changer plus souvent)
    if (requestData.preference === 'fastest') {
      baseTTL *= 0.75; // 25% plus court pour les itinéraires rapides (trafic, etc.)
    }
    
    return baseTTL;
  }
  
  /**
   * Met à jour les métriques de performance
   * @param {number} responseTime Temps de réponse en ms
   * @param {boolean} success Indique si la requête a réussi
   * @private
   */
  _updateMetrics(responseTime, success) {
    this.metrics.totalRequests++;
    
    if (success) {
      this.metrics.successfulRequests++;
      
      // Mettre à jour le temps de réponse moyen
      this.metrics.lastResponseTimes.push(responseTime);
      if (this.metrics.lastResponseTimes.length > 100) {
        this.metrics.lastResponseTimes.shift();
      }
      
      const totalTime = this.metrics.lastResponseTimes.reduce((sum, time) => sum + time, 0);
      this.metrics.averageResponseTime = totalTime / this.metrics.lastResponseTimes.length;
    } else {
      this.metrics.failedRequests++;
    }
  }
  
  /**
   * Génère une clé de cache pour un itinéraire
   * @param {Array<number>} start Coordonnées du point de départ
   * @param {Array<number>} end Coordonnées du point d'arrivée
   * @param {Array<Array<number>>} waypoints Points intermédiaires
   * @param {Object} options Options supplémentaires
   * @returns {string} Clé de cache unique
   * @private
   */
  _generateCacheKey(start, end, waypoints = [], options = {}) {
    const coordinates = [start, ...waypoints, end]
      .map(coord => coord.join(','))
      .join('|');
      
    const profile = options.profile || this.profile;
    const preference = options.preference || this.options.preference;
    
    // Inclure les options importantes dans la clé de cache
    const optionsKey = JSON.stringify({
      avoid: options.avoid,
      maxSpeed: options.maxSpeed,
      elevation: options.elevation !== undefined ? options.elevation : this.options.elevation
    });
    
    return `route:${profile}:${preference}:${coordinates}:${optionsKey}`;
  }
  
  /**
   * Parse et enrichit une erreur API
   * @param {Error} error Erreur à traiter
   * @returns {Error} Erreur enrichie
   * @private
   */
  _parseApiError(error) {
    // Déterminer le type d'erreur
    let errorType = 'UnknownError';
    let statusCode = error.response?.status;
    let retryable = false;
    let retryDelay = 0;
    
    if (statusCode === 429) {
      errorType = 'RateLimitExceeded';
      retryable = true;
      
      // Extraire le temps d'attente recommandé des en-têtes si disponible
      const retryAfter = error.response?.headers?.['retry-after'];
      retryDelay = retryAfter ? parseInt(retryAfter, 10) * 1000 : 60000; // Défaut à 1 minute
    } else if (statusCode === 403 || statusCode === 401) {
      errorType = 'AuthenticationError';
      
      // Utiliser le nouveau système de gestion sécurisée des clés API
      if (this.apiKeyManager && this.serviceName && this.currentApiKey) {
        // Signaler l'échec de la clé et tenter une rotation automatique
        try {
          const apiServices = require('./apiServices');
          
          // Vérifier si la clé est toujours valide
          apiServices[this.serviceName].isValidKey(this.currentApiKey)
            .then(isValid => {
              if (!isValid) {
                // Forcer une rotation de clé si la clé n'est plus valide
                logger.warn(`Clé API ${this.serviceName} invalide, rotation automatique initiée`);
                return apiServices[this.serviceName].rotateKeys();
              }
            })
            .catch(rotationError => {
              logger.error(`Erreur lors de la vérification/rotation de la clé ${this.serviceName}`, {
                error: rotationError.message
              });
            });
        } catch (e) {
          logger.error(`Erreur lors de la gestion de la clé API invalide`, {
            service: this.serviceName,
            error: e.message
          });
        }
      }
    } else if (statusCode >= 500) {
      errorType = 'ServerError';
      retryable = true;
      retryDelay = 5000; // 5 secondes
    } else if (error.code === 'ECONNABORTED') {
      errorType = 'TimeoutError';
      retryable = true;
      retryDelay = 3000; // 3 secondes
    } else if (!error.response && error.request) {
      errorType = 'NetworkError';
      retryable = true;
      retryDelay = 2000; // 2 secondes
    }
    
    // Enrichir l'erreur avec des métadonnées
    const enhancedError = enrichError(error, {
      type: errorType,
      statusCode,
      component: 'OpenRouteService',
      timestamp: new Date().toISOString(),
      retryable,
      retryDelay
    });
    
    // Journaliser l'erreur
    logger.error(`OpenRouteService API error: ${errorType}`, {
      statusCode,
      message: error.message,
      retryable,
      retryDelay
    });
    
    return enhancedError;
  }
  
  /**
   * Tente de récupérer automatiquement après une erreur
   * @param {Error} error Erreur rencontrée
   * @returns {Promise<void>}
   * @private
   */
  async _attemptErrorRecovery(error) {
    // Obtenir la stratégie de récupération appropriée
    const strategy = this.quotaManager.autoRecover(error.type || 'UnknownError');
    
    if (strategy.action === 'wait') {
      logger.info(`Attente de ${strategy.delay}ms avant nouvelle tentative`);
      await new Promise(resolve => setTimeout(resolve, strategy.delay));
    } else if (strategy.action === 'alert') {
      this._sendAdminAlert('Erreur nécessitant une intervention', {
        error: error.message,
        type: error.type,
        timestamp: new Date().toISOString()
      });
    }
  }
}

module.exports = new OpenRouteService();
