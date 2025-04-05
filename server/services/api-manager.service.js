/**
 * Service de gestion centralisée des API
 * Fournit une interface unifiée pour toutes les API externes utilisées par l'application
 * Implémente les retries intelligents avec backoff exponentiel et système de fallback
 */

const axios = require('axios');
const NodeCache = require('node-cache');
const { logger } = require('../utils/logger');
const config = require('../config/api.config');
const { promiseWithTimeout, retryAsync, parallelLimit } = require('../utils/promise-helpers');

// Référence singleton pour éviter les multiples instances
let instance = null;

class ApiManagerService {
  constructor() {
    // Pattern Singleton pour éviter les multiples instances
    if (instance) {
      return instance;
    }
    instance = this;

    if (!config) {
      throw new Error('Configuration manquante pour le gestionnaire d\'API');
    }
    
    // Statut d'initialisation
    this.initialized = false;
    this.initializing = false;
    this.initializationError = null;
    this.initPromise = null;
    
    // Cache côté serveur pour les réponses API
    this.cache = new NodeCache({
      stdTTL: 600, // TTL par défaut de 10 minutes
      checkperiod: 120, // Vérification des expirations toutes les 2 minutes
      useClones: false // Pour économiser de la mémoire
    });

    // Système de gestion des clés API
    this.apiKeys = {
      // Configuration des clés API pour chaque service
      weather: this._initApiKeys('openWeather', [config.openWeather?.apiKey]),
      openroute: this._initApiKeys('openRoute', [config.openRoute?.apiKey]),
      mapbox: this._initApiKeys('mapbox', [config.mapbox?.accessToken]),
      strava: this._initApiKeys('strava', [{ 
        key: config.strava?.clientId, 
        secret: config.strava?.clientSecret 
      }])
    };

    // Configuration des services API - utilisation de setter pour éviter les références directes
    this.services = {};
    
    // Métriques globales
    this.globalMetrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      lastResponseTimes: [],
      serviceMetrics: {},
      startTime: Date.now()
    };

    // Compteurs et timestamps pour la gestion du rate limiting
    this.requestCounters = {};
    
    // Surveillance des erreurs par clé API pour détecter les problèmes
    this.keyErrorCounts = {};
    
    logger.info('[ApiManagerService] Service créé, en attente d\'initialisation');
  }

  /**
   * Initialise le service de manière asynchrone
   * @returns {Promise<boolean>} - true si l'initialisation a réussi, false sinon
   */
  async initialize() {
    // Si déjà initialisé, retourner immédiatement
    if (this.initialized) {
      return true;
    }
    
    // Si l'initialisation est en cours, attendre qu'elle se termine
    if (this.initializing) {
      return this.initPromise;
    }
    
    // Marquer comme en cours d'initialisation
    this.initializing = true;
    
    // Créer une promesse pour l'initialisation
    this.initPromise = new Promise(async (resolve) => {
      try {
        logger.info('[ApiManagerService] Initialisation du service...');
        
        // Démarrer les intervalles de monitoring
        this._startMonitoringIntervals();
        
        // Marquer comme initialisé
        this.initialized = true;
        this.initializing = false;
        
        logger.info('[ApiManagerService] Service initialisé avec succès');
        resolve(true);
      } catch (error) {
        this.initializationError = error;
        this.initializing = false;
        
        logger.error(`[ApiManagerService] Erreur lors de l'initialisation: ${error.message}`, {
          stack: error.stack
        });
        
        resolve(false);
      }
    });
    
    return this.initPromise;
  }
  
  /**
   * Démarre les intervalles de monitoring
   * @private
   */
  _startMonitoringIntervals() {
    // Intervalle pour la rotation des clés et réinitialisation des compteurs d'erreurs
    setInterval(() => this._monitorAndRotateKeys(), 60000); // Vérification toutes les minutes
    
    // Intervalle pour analyser les métriques et ajuster les stratégies
    setInterval(() => this._analyzeMetricsAndAdjustStrategies(), 300000); // Toutes les 5 minutes
    
    logger.debug('[ApiManagerService] Intervalles de monitoring démarrés');
  }
  
  /**
   * Analyse les métriques et ajuste les stratégies en conséquence
   * @private
   */
  _analyzeMetricsAndAdjustStrategies() {
    // Implémentation de l'analyse des métriques
    // Cette méthode sera appelée périodiquement pour ajuster les stratégies
    // en fonction des performances observées
    
    // Pour chaque service, vérifier les taux d'erreur et les temps de réponse
    Object.keys(this.globalMetrics.serviceMetrics).forEach(serviceName => {
      const metrics = this.globalMetrics.serviceMetrics[serviceName];
      const totalRequests = metrics.successfulRequests + metrics.failedRequests;
      
      if (totalRequests > 0) {
        const errorRate = metrics.failedRequests / totalRequests;
        
        // Si le taux d'erreur est élevé, ajuster la stratégie
        if (errorRate > 0.2) { // Plus de 20% d'erreurs
          logger.warn(`[ApiManagerService] Taux d'erreur élevé pour ${serviceName}: ${(errorRate * 100).toFixed(2)}%`);
          
          // Ajuster la stratégie de retry
          if (this.services[serviceName]) {
            const currentRetries = this.services[serviceName].retryConfig?.maxRetries || 3;
            
            // Augmenter le nombre de retries si nécessaire
            if (currentRetries < 5) {
              this.services[serviceName].retryConfig = {
                ...this.services[serviceName].retryConfig,
                maxRetries: currentRetries + 1
              };
              
              logger.info(`[ApiManagerService] Augmentation du nombre de retries pour ${serviceName} à ${currentRetries + 1}`);
            }
          }
        }
      }
    });
  }

  /**
   * Initialise les clés API pour un service donné
   * @private
   * @param {string} serviceName - Nom du service API
   * @param {Array<string|Object>} keys - Liste des clés API
   * @returns {Object} - Configuration des clés API
   */
  _initApiKeys(serviceName, keys = []) {
    if (!keys || keys.length === 0) {
      logger.warn(`Aucune clé API configurée pour le service ${serviceName}`);
      return {
        keys: [],
        currentIndex: 0,
        lastRotation: Date.now()
      };
    }
    
    // Transformation des clés en format standard avec métadonnées
    const formattedKeys = keys.map((key, index) => {
      if (typeof key === 'string') {
        return {
          key,
          isActive: true,
          errorCount: 0,
          requestCount: 0,
          lastUsed: 0,
          region: 'global' // Par défaut
        };
      }
      
      return {
        ...key,
        isActive: true,
        errorCount: 0,
        requestCount: 0,
        lastUsed: 0,
        region: key.region || 'global'
      };
    });
    
    return {
      keys: formattedKeys,
      currentIndex: 0,
      lastRotation: Date.now()
    };
  }

  /**
   * Enregistre un service API auprès du gestionnaire
   * @param {string} serviceName - Nom du service API
   * @param {Object} service - Instance du service
   * @param {Object} options - Options de configuration
   * @returns {boolean} - true si l'enregistrement a réussi
   */
  registerService(serviceName, service, options = {}) {
    if (!serviceName || !service) {
      logger.error('[ApiManagerService] Tentative d\'enregistrement d\'un service invalide');
      return false;
    }
    
    // Vérifier si le service existe déjà
    if (this.services[serviceName]) {
      logger.warn(`[ApiManagerService] Le service ${serviceName} est déjà enregistré, écrasement`);
    }
    
    // Enregistrer le service avec ses options
    this.services[serviceName] = {
      service,
      retryConfig: options.retryConfig || { maxRetries: 3, initialDelay: 1000, maxDelay: 10000 },
      rateLimit: options.rateLimit || { requestsPerMinute: 60 },
      fallbackStrategy: options.fallbackStrategy || 'cache',
      cacheTTL: options.cacheTTL || 600, // 10 minutes par défaut
      timeout: options.timeout || 30000, // 30 secondes par défaut
      registeredAt: Date.now()
    };
    
    // Initialiser les métriques pour ce service
    if (!this.globalMetrics.serviceMetrics[serviceName]) {
      this.globalMetrics.serviceMetrics[serviceName] = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        lastResponseTimes: []
      };
    }
    
    logger.info(`[ApiManagerService] Service ${serviceName} enregistré avec succès`);
    return true;
  }

  /**
   * Vérifie si le service est initialisé
   * @returns {boolean} - true si le service est initialisé
   */
  isInitialized() {
    return this.initialized;
  }

  /**
   * Obtient les métriques pour un service spécifique
   * @param {string} serviceName - Nom du service API
   * @returns {Object} - Métriques du service
   */
  getServiceMetrics(serviceName) {
    if (!serviceName) {
      return this.globalMetrics;
    }
    
    return this.globalMetrics.serviceMetrics[serviceName] || {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0
    };
  }

  /**
   * Réinitialise les métriques pour un service ou tous les services
   * @param {string} [serviceName] - Nom du service API (optionnel)
   */
  resetMetrics(serviceName = null) {
    if (serviceName) {
      // Réinitialiser les métriques pour un service spécifique
      this.globalMetrics.serviceMetrics[serviceName] = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        lastResponseTimes: []
      };
      
      logger.info(`[ApiManagerService] Métriques réinitialisées pour le service ${serviceName}`);
    } else {
      // Réinitialiser toutes les métriques
      this.globalMetrics = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        lastResponseTimes: [],
        serviceMetrics: {},
        startTime: Date.now()
      };
      
      logger.info('[ApiManagerService] Toutes les métriques ont été réinitialisées');
    }
  }

  /**
   * Obtient la clé API active pour un service donné, avec gestion de région
   * @param {string} serviceName - Nom du service API
   * @param {string} [region='global'] - Région pour laquelle la clé est requise
   * @returns {string|Object} - Clé API active
   */
  getApiKey(serviceName, region = 'global') {
    const serviceKeys = this.apiKeys[serviceName];
    if (!serviceKeys || !serviceKeys.keys || serviceKeys.keys.length === 0) {
      logger.warn(`Aucune clé API disponible pour le service ${serviceName}`);
      return null;
    }
    
    // Recherche d'une clé adaptée à la région spécifiée
    const regionKeys = serviceKeys.keys.filter(k => k.isActive && (k.region === region || k.region === 'global'));
    
    if (regionKeys.length === 0) {
      // Si aucune clé n'est disponible pour cette région, utiliser une clé globale
      const globalKeys = serviceKeys.keys.filter(k => k.isActive && k.region === 'global');
      if (globalKeys.length === 0) {
        logger.warn(`Aucune clé API active disponible pour le service ${serviceName}`);
        return null;
      }
      
      const selectedKey = globalKeys[serviceKeys.currentIndex % globalKeys.length];
      selectedKey.lastUsed = Date.now();
      selectedKey.requestCount++;
      
      return selectedKey.key;
    }
    
    // Sélection de la clé adaptée à la région avec le moins d'erreurs
    regionKeys.sort((a, b) => a.errorCount - b.errorCount);
    const selectedKey = regionKeys[0];
    selectedKey.lastUsed = Date.now();
    selectedKey.requestCount++;
    
    return selectedKey.key;
  }

  /**
   * Surveille les erreurs des clés API et effectue une rotation si nécessaire
   * @private
   */
  _monitorAndRotateKeys() {
    Object.keys(this.apiKeys).forEach(serviceName => {
      const serviceKeys = this.apiKeys[serviceName];
      if (!serviceKeys || !serviceKeys.keys || serviceKeys.keys.length <= 1) {
        return; // Ignorer si pas assez de clés pour faire une rotation
      }
      
      const now = Date.now();
      const minutesSinceLastRotation = (now - serviceKeys.lastRotation) / (1000 * 60);
      
      // Détection des clés problématiques (trop d'erreurs)
      const problematicKeys = serviceKeys.keys.filter(k => k.errorCount > 5);
      
      // Si des clés sont problématiques ou si la dernière rotation date de plus d'une heure
      if (problematicKeys.length > 0 || minutesSinceLastRotation >= 60) {
        this._rotateApiKey(serviceName);
        
        // Réinitialiser les compteurs d'erreurs pour toutes les clés
        serviceKeys.keys.forEach(k => {
          k.errorCount = 0;
        });
        
        logger.info(`Rotation des clés API pour le service ${serviceName}`);
      }
    });
  }

  /**
   * Effectue une rotation de la clé API pour un service
   * @private
   * @param {string} serviceName - Nom du service API
   */
  _rotateApiKey(serviceName) {
    const serviceKeys = this.apiKeys[serviceName];
    if (!serviceKeys || !serviceKeys.keys || serviceKeys.keys.length <= 1) {
      return; // Ignorer si pas assez de clés pour faire une rotation
    }
    
    // Récupérer les clés actives
    const activeKeys = serviceKeys.keys.filter(k => k.isActive);
    if (activeKeys.length <= 1) {
      // Si une seule clé active ou moins, activer toutes les clés
      serviceKeys.keys.forEach(k => {
        k.isActive = true;
      });
    }
    
    // Passer à l'indice suivant
    serviceKeys.currentIndex = (serviceKeys.currentIndex + 1) % serviceKeys.keys.length;
    serviceKeys.lastRotation = Date.now();
  }

  /**
   * Enregistre une erreur pour une clé API
   * @private
   * @param {string} serviceName - Nom du service API
   */
  _recordApiKeyError(serviceName) {
    const serviceKeys = this.apiKeys[serviceName];
    if (!serviceKeys || !serviceKeys.keys || serviceKeys.keys.length === 0) {
      return;
    }
    
    const currentIndex = serviceKeys.currentIndex;
    if (currentIndex >= 0 && currentIndex < serviceKeys.keys.length) {
      const currentKey = serviceKeys.keys[currentIndex];
      currentKey.errorCount++;
      
      // Si trop d'erreurs, désactiver la clé
      if (currentKey.errorCount > 10) {
        currentKey.isActive = false;
        logger.warn(`Clé API désactivée pour le service ${serviceName} après trop d'erreurs`);
      }
    }
  }

  /**
   * Exécute une requête API avec gestion des retries et fallbacks
   * @param {string} serviceName - Nom du service API ('weather', 'openroute', 'strava', etc.)
   * @param {string} endpoint - Point d'entrée/méthode à appeler sur le service
   * @param {Object} params - Paramètres à passer à la requête
   * @param {Object} options - Options additionnelles
   * @returns {Promise} - La réponse de l'API ou du fallback
   */
  async execute(serviceName, endpoint, params = {}, options = {}) {
    // Vérifier si le service est initialisé
    if (!this.initialized && !this.initializing) {
      await this.initialize();
    }
    
    const startTime = Date.now();
    this.globalMetrics.totalRequests++;
    
    // Mettre à jour les métriques par service
    if (!this.globalMetrics.serviceMetrics[serviceName]) {
      this.globalMetrics.serviceMetrics[serviceName] = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        lastResponseTimes: []
      };
    }
    this.globalMetrics.serviceMetrics[serviceName].totalRequests++;
    
    // Vérifier si le service existe
    if (!this.services[serviceName]) {
      const error = new Error(`Service API "${serviceName}" non enregistré dans le gestionnaire d'API`);
      error.code = 'SERVICE_NOT_FOUND';
      error.status = 500;
      this._updateMetrics(false, Date.now() - startTime, serviceName);
      logger.error(error.message);
      throw error;
    }
    
    // Vérifier si le service a la méthode demandée
    const service = this.services[serviceName].service;
    if (!service || typeof service[endpoint] !== 'function') {
      const error = new Error(`Endpoint "${endpoint}" non disponible pour le service "${serviceName}"`);
      error.code = 'ENDPOINT_NOT_FOUND';
      error.status = 500;
      this._updateMetrics(false, Date.now() - startTime, serviceName);
      logger.error(error.message);
      throw error;
    }
    
    try {
      // Générer une clé de cache si nécessaire
      const shouldCache = options.cache !== false;
      let cacheKey = null;
      
      if (shouldCache) {
        cacheKey = this._generateCacheKey(serviceName, endpoint, params);
        
        // Vérifier si la réponse est en cache
        const cachedResponse = this.cache.get(cacheKey);
        if (cachedResponse) {
          logger.debug(`Utilisation du cache pour ${serviceName}.${endpoint}`);
          this._updateMetrics(true, 0, serviceName, true);
          return cachedResponse;
        }
      }
      
      // Vérifier les limites de taux avant d'exécuter la requête
      const serviceConfig = this.services[serviceName];
      if (!this.checkRateLimit(serviceName, serviceConfig)) {
        return this.handleRateLimitExceeded(serviceName, endpoint, params, options);
      }
      
      // Exécuter la requête avec retry si nécessaire
      const result = await this.executeWithRetry(serviceName, endpoint, params, options, cacheKey);
      
      // Mettre à jour les métriques en cas de succès
      const responseTime = Date.now() - startTime;
      this._updateMetrics(true, responseTime, serviceName);
      
      return result;
    } catch (error) {
      // Mettre à jour les métriques en cas d'erreur
      const responseTime = Date.now() - startTime;
      this._updateMetrics(false, responseTime, serviceName);
      
      // Enrichir l'erreur avec des informations contextuelles
      error.serviceName = serviceName;
      error.endpoint = endpoint;
      error.params = params;
      
      // Journaliser l'erreur avec contexte
      logger.error(`Erreur lors de l'exécution de ${serviceName}.${endpoint}: ${error.message}`, {
        service: serviceName,
        endpoint,
        params: JSON.stringify(params).substring(0, 200), // Tronquer pour éviter les logs trop volumineux
        errorCode: error.code,
        errorStatus: error.status
      });
      
      // Propager l'erreur
      throw error;
    }
  }

  /**
   * Exécute une requête API avec mécanisme de retry
   * @param {string} serviceName - Nom du service API
   * @param {string} endpoint - Point d'entrée/méthode à appeler
   * @param {Object} params - Paramètres de la requête
   * @param {Object} options - Options additionnelles
   * @param {string} cacheKey - Clé pour la mise en cache
   * @returns {Promise} - La réponse de l'API ou du fallback
   */
  async executeWithRetry(serviceName, endpoint, params, options, cacheKey) {
    const serviceConfig = this.services[serviceName];
    const retryConfig = serviceConfig.retryConfig || { maxRetries: 3, initialDelay: 1000, maxDelay: 10000 };
    
    try {
      // Utiliser notre utilitaire retryAsync pour une gestion plus robuste des retries
      const result = await retryAsync(
        async (attempt) => {
          try {
            // Si ce n'est pas la première tentative, attendre avant de réessayer
            if (attempt > 0) {
              logger.debug(`Tentative ${attempt + 1} pour ${serviceName}.${endpoint}`);
            }
            
            // Modifier la région API si nécessaire pour équilibrer la charge
            const region = this._determineApiRegion(params);
            
            // Adapter les paramètres selon la région
            const adaptedParams = this._adaptParamsForRegion(params, region);
            
            // Exécuter la requête avec un timeout pour éviter les requêtes bloquées
            const service = serviceConfig.service;
            const timeout = options.timeout || serviceConfig.timeout || 30000;
            
            return await promiseWithTimeout(
              service[endpoint](adaptedParams),
              timeout,
              `Requête à ${serviceName}.${endpoint} expirée après ${timeout}ms`
            );
          } catch (error) {
            // Enregistrer l'erreur pour la clé API si applicable
            if (error.status === 401 || error.status === 403) {
              this._recordApiKeyError(serviceName);
            }
            
            // Enrichir l'erreur avec des informations contextuelles
            error.attempt = attempt + 1;
            error.maxRetries = retryConfig.maxRetries;
            
            throw error;
          }
        },
        {
          ...retryConfig,
          shouldRetry: (error) => {
            // Déterminer si l'erreur est récupérable ou pas
            // Ne pas réessayer pour les erreurs de validation (400), d'authentification (401, 403)
            // ou les ressources non trouvées (404)
            const isClientError = error.status >= 400 && error.status < 500;
            if (isClientError && error.status !== 429) { // Sauf rate limit (429)
              return false;
            }
            
            // Réessayer pour les erreurs réseau et les erreurs serveur (500+)
            const isNetworkError = !error.response;
            const isServerError = error.status >= 500;
            const isRateLimitError = error.status === 429;
            
            return isNetworkError || isServerError || isRateLimitError;
          }
        }
      );
      
      // Mettre en cache le résultat si nécessaire
      if (cacheKey && options.cache !== false) {
        const ttl = options.cacheTTL || serviceConfig.cacheTTL || 600; // 10 minutes par défaut
        this.cache.set(cacheKey, result, ttl);
      }
      
      // Enregistrer la requête réussie pour le rate limiting
      this.recordRequest(serviceName);
      
      return result;
    } catch (error) {
      // Utiliser une stratégie de fallback en cas d'échec
      return this.useFallback(serviceName, endpoint, params, options, error, cacheKey);
    }
  }

  /**
   * Détermine la région API à utiliser en fonction des paramètres
   * @private
   * @param {Object} params - Paramètres de la requête
   * @returns {string} - Région à utiliser
   */
  _determineApiRegion(params) {
    // Par défaut, utiliser la région globale
    let region = 'global';
    
    // Si les paramètres contiennent des coordonnées, déterminer la région
    if (params.lat && params.lon) {
      // Coordonnées européennes approximatives
      if (params.lat >= 36 && params.lat <= 71 && params.lon >= -10 && params.lon <= 40) {
        region = 'europe';
      }
    }
    
    // Si une région est explicitement spécifiée, l'utiliser
    if (params.region) {
      region = params.region;
    }
    
    return region;
  }
  
  /**
   * Adapte les paramètres en fonction de la région
   * @private
   * @param {Object} params - Paramètres originaux
   * @param {string} region - Région cible
   * @returns {Object} - Paramètres adaptés
   */
  _adaptParamsForRegion(params, region) {
    // Copier les paramètres pour éviter de modifier l'original
    const adaptedParams = { ...params };
    
    // Supprimer le paramètre de région pour éviter les conflits
    delete adaptedParams.region;
    
    // Ajouter des paramètres spécifiques à la région si nécessaire
    if (region === 'europe') {
      // Paramètres spécifiques pour les API européennes
      adaptedParams.units = adaptedParams.units || 'metric';
      adaptedParams.language = adaptedParams.language || 'fr-fr';
    }
    
    return adaptedParams;
  }

  /**
   * Utilise une stratégie de fallback en cas d'échec de la requête
   * @param {string} serviceName - Nom du service API
   * @param {string} endpoint - Point d'entrée/méthode
   * @param {Object} params - Paramètres de la requête
   * @param {Object} options - Options additionnelles
   * @param {Error} error - Erreur d'origine
   * @param {string} cacheKey - Clé de cache
   * @returns {Promise} - Réponse du fallback
   */
  async useFallback(serviceName, endpoint, params, options, error, cacheKey) {
    const serviceConfig = this.services[serviceName];
    const fallbackStrategy = options.fallbackStrategy || serviceConfig.fallbackStrategy || 'throw';
    
    logger.debug(`Utilisation de la stratégie de fallback '${fallbackStrategy}' pour ${serviceName}.${endpoint}`);
    
    switch (fallbackStrategy) {
      case 'cache':
        // Essayer de récupérer une version en cache, même expirée
        const cachedData = this.cache.get(cacheKey, true); // true = ignorer TTL
        if (cachedData) {
          logger.info(`Utilisation d'une version en cache expirée pour ${serviceName}.${endpoint}`);
          return cachedData;
        }
        break;
        
      case 'mock':
        // Utiliser des données mockées
        if (serviceConfig.mockData && serviceConfig.mockData[endpoint]) {
          logger.info(`Utilisation de données mockées pour ${serviceName}.${endpoint}`);
          return serviceConfig.mockData[endpoint](params);
        }
        break;
        
      case 'alternative':
        // Essayer un service alternatif
        if (serviceConfig.alternativeService) {
          try {
            logger.info(`Utilisation d'un service alternatif pour ${serviceName}.${endpoint}`);
            return await this.execute(
              serviceConfig.alternativeService,
              endpoint,
              params,
              { ...options, fallbackStrategy: 'throw' } // Éviter les boucles infinies
            );
          } catch (altError) {
            logger.error(`Échec du service alternatif pour ${serviceName}.${endpoint}: ${altError.message}`);
          }
        }
        break;
    }
    
    // Si aucune stratégie n'a fonctionné ou si la stratégie est 'throw', propager l'erreur
    throw error;
  }

  /**
   * Gère le cas où la limite de taux est dépassée
   * @param {string} serviceName - Nom du service API
   * @param {string} endpoint - Point d'entrée/méthode à appeler
   * @param {Object} params - Paramètres de la requête
   * @param {Object} options - Options additionnelles
   * @returns {Promise} - Réponse du fallback
   */
  async handleRateLimitExceeded(serviceName, endpoint, params, options) {
    const error = new Error(`Limite de taux dépassée pour le service ${serviceName}`);
    error.code = 'RATE_LIMIT_EXCEEDED';
    error.status = 429;
    
    logger.warn(`Limite de taux dépassée pour ${serviceName}.${endpoint}`);
    
    // Utiliser la stratégie de fallback
    return this.useFallback(serviceName, endpoint, params, options, error, this._generateCacheKey(serviceName, endpoint, params));
  }

  /**
   * Met à jour les métriques de performance globales et par service
   * @param {boolean} success - Indique si la requête a réussi
   * @param {number} responseTime - Temps de réponse en ms
   * @param {string} serviceName - Nom du service
   * @param {boolean} fromCache - Indique si la réponse vient du cache
   */
  _updateMetrics(success, responseTime, serviceName, fromCache = false) {
    // Mettre à jour les métriques globales
    if (success) {
      this.globalMetrics.successfulRequests++;
      
      // Ne pas compter les temps de réponse des requêtes en cache
      if (!fromCache) {
        this.globalMetrics.lastResponseTimes.push(responseTime);
        if (this.globalMetrics.lastResponseTimes.length > 100) {
          this.globalMetrics.lastResponseTimes.shift();
        }
        
        // Calculer la moyenne globale
        const total = this.globalMetrics.lastResponseTimes.reduce((sum, time) => sum + time, 0);
        this.globalMetrics.averageResponseTime = Math.round(total / this.globalMetrics.lastResponseTimes.length);
      }
    } else {
      this.globalMetrics.failedRequests++;
    }
    
    // Mettre à jour les métriques par service
    const serviceMetrics = this.globalMetrics.serviceMetrics[serviceName];
    if (serviceMetrics) {
      if (success) {
        serviceMetrics.successfulRequests++;
        
        if (!fromCache) {
          serviceMetrics.lastResponseTimes.push(responseTime);
          if (serviceMetrics.lastResponseTimes.length > 20) {
            serviceMetrics.lastResponseTimes.shift();
          }
          
          // Calculer la moyenne par service
          const total = serviceMetrics.lastResponseTimes.reduce((sum, time) => sum + time, 0);
          serviceMetrics.averageResponseTime = Math.round(total / serviceMetrics.lastResponseTimes.length);
        }
      } else {
        serviceMetrics.failedRequests++;
      }
    }
  }

  /**
   * Génère une clé de cache unique pour une requête API
   * @param {string} serviceName - Nom du service API
   * @param {string} endpoint - Point d'entrée/méthode
   * @param {Object} params - Paramètres de la requête
   * @returns {string} - Clé de cache
   */
  _generateCacheKey(serviceName, endpoint, params) {
    // Filtrer les paramètres non-pertinents pour le cache
    const cacheableParams = { ...params };
    delete cacheableParams.timestamp;
    delete cacheableParams.randomParam;
    
    // Générer une clé de cache unique
    return `${serviceName}:${endpoint}:${JSON.stringify(cacheableParams)}`;
  }
  
  /**
   * Calcule le délai pour le backoff exponentiel
   * @param {number} attempt - Numéro de la tentative actuelle
   * @param {Object} retryConfig - Configuration de retry
   * @returns {number} - Délai en millisecondes
   */
  calculateBackoff(attempt, retryConfig) {
    const { initialDelay, maxDelay } = retryConfig;
    // Formule de backoff exponentiel avec jitter (variation aléatoire)
    const exponentialDelay = initialDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 0.5 + 0.5; // Entre 0.5 et 1
    const delay = Math.min(exponentialDelay * jitter, maxDelay);
    
    return Math.round(delay);
  }

  /**
   * Vérifie si le service respecte ses limites de taux
   * @param {string} serviceName - Nom du service API
   * @param {Object} serviceConfig - Configuration du service
   * @returns {boolean} - true si la requête est autorisée, false sinon
   */
  checkRateLimit(serviceName, serviceConfig) {
    if (!serviceConfig.rateLimit) {
      return true; // Pas de limite de taux définie
    }
    
    const now = Date.now();
    
    // Initialiser les compteurs si nécessaire
    if (!this.requestCounters[serviceName]) {
      this.requestCounters[serviceName] = {
        minuteCounter: 0,
        hourCounter: 0,
        dayCounter: 0,
        lastMinute: now,
        lastHour: now,
        lastDay: now
      };
    }
    
    const counter = this.requestCounters[serviceName];
    
    // Réinitialiser les compteurs si nécessaire
    if (now - counter.lastMinute > 60000) {
      counter.minuteCounter = 0;
      counter.lastMinute = now;
    }
    
    if (now - counter.lastHour > 3600000) {
      counter.hourCounter = 0;
      counter.lastHour = now;
    }
    
    if (now - counter.lastDay > 86400000) {
      counter.dayCounter = 0;
      counter.lastDay = now;
    }
    
    // Vérifier les limites
    if (serviceConfig.rateLimit.requestsPerMinute && counter.minuteCounter >= serviceConfig.rateLimit.requestsPerMinute) {
      logger.warn(`Limite de taux atteinte pour ${serviceName}: ${counter.minuteCounter}/${serviceConfig.rateLimit.requestsPerMinute} req/min`);
      return false;
    }
    
    if (serviceConfig.rateLimit.requestsPerHour && counter.hourCounter >= serviceConfig.rateLimit.requestsPerHour) {
      logger.warn(`Limite de taux atteinte pour ${serviceName}: ${counter.hourCounter}/${serviceConfig.rateLimit.requestsPerHour} req/h`);
      return false;
    }
    
    if (serviceConfig.rateLimit.requestsPerDay && counter.dayCounter >= serviceConfig.rateLimit.requestsPerDay) {
      logger.warn(`Limite de taux atteinte pour ${serviceName}: ${counter.dayCounter}/${serviceConfig.rateLimit.requestsPerDay} req/jour`);
      return false;
    }
    
    return true;
  }

  /**
   * Enregistre une requête réussie pour le rate limiting
   * @param {string} serviceName - Nom du service API
   */
  recordRequest(serviceName) {
    if (!this.requestCounters[serviceName]) {
      this.requestCounters[serviceName] = {
        minuteCounter: 0,
        hourCounter: 0,
        dayCounter: 0,
        lastMinute: Date.now(),
        lastHour: Date.now(),
        lastDay: Date.now()
      };
    }
    
    const counter = this.requestCounters[serviceName];
    
    // Incrémenter les compteurs
    counter.minuteCounter++;
    counter.hourCounter++;
    counter.dayCounter++;
    
    // Si on approche des limites, journaliser un avertissement
    const serviceConfig = this.services[serviceName];
    if (serviceConfig && serviceConfig.rateLimit) {
      if (serviceConfig.rateLimit.requestsPerMinute && counter.minuteCounter >= serviceConfig.rateLimit.requestsPerMinute * 0.8) {
        logger.warn(`Approche de la limite de taux pour ${serviceName}: ${counter.minuteCounter}/${serviceConfig.rateLimit.requestsPerMinute} req/min`);
      }
    }
  }
}

// Exporter une instance unique du service
module.exports = new ApiManagerService();
