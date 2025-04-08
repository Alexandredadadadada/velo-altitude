/**
 * Service API Unifié
 * 
 * Ce service consolide toutes les fonctionnalités de gestion d'API précédemment
 * dispersées dans plusieurs fichiers (api-manager.service.js, api-monitoring.service.js, etc.)
 * 
 * Fonctionnalités:
 * - Gestion centralisée des clés API
 * - Monitoring des quotas et utilisation
 * - Rotation automatique des clés API
 * - Gestion des erreurs et retries
 * - Caching intelligent des requêtes
 */

import KeyManager from './internal/KeyManager';
import QuotaManager from './internal/QuotaManager';
import MonitoringService from './internal/MonitoringService';
import APICache from './internal/APICache';
import apiErrorHandler, { FallbackStrategy } from '../errorHandling/apiErrorHandler';

class UnifiedAPIService {
  constructor(config = {}) {
    this.config = {
      rotationInterval: 24 * 60 * 60 * 1000, // 24h
      monitoringEnabled: true,
      cacheEnabled: true,
      quotaCheckInterval: 60 * 1000, // 1min
      alertThreshold: 0.8,
      logLevel: 'info',
      ...config
    };

    // Initialisation des sous-services
    this.keyManager = new KeyManager({
      rotationInterval: this.config.rotationInterval,
      backupEnabled: true
    });
    
    this.quotaManager = new QuotaManager({
      checkInterval: this.config.quotaCheckInterval
    });
    
    this.monitor = new MonitoringService({
      alertThreshold: this.config.alertThreshold,
      logLevel: this.config.logLevel,
      enabled: this.config.monitoringEnabled
    });

    this.cache = new APICache({
      enabled: this.config.cacheEnabled,
      defaultTtl: 5 * 60 * 1000 // 5min
    });

    // Journalisation de l'initialisation
    console.log(`[UnifiedAPIService] Initialized with config: ${JSON.stringify(this.config)}`);
  }

  /**
   * Enregistre une nouvelle API dans le système
   */
  registerAPI(apiName, config) {
    this.keyManager.registerAPI(apiName, config.keys);
    this.quotaManager.registerAPI(apiName, config.quota);
    this.monitor.registerAPI(apiName);
    return this;
  }

  /**
   * Exécute une requête API avec gestion complète
   */
  async executeRequest(apiName, endpoint, options = {}) {
    const startTime = Date.now();
    const requestId = `${apiName}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    try {
      // Vérifier le cache si activé
      if (this.config.cacheEnabled && options.useCache !== false) {
        const cacheKey = this.generateCacheKey(apiName, endpoint, options);
        const cachedResponse = await this.cache.get(cacheKey);
        
        if (cachedResponse) {
          this.monitor.logCacheHit(apiName, endpoint);
          return cachedResponse;
        }
      }

      // Vérifier les quotas
      await this.quotaManager.checkQuota(apiName);

      // Obtenir une clé API valide
      const apiKey = await this.keyManager.getKey(apiName);
      
      // Préparer les options de requête
      const requestOptions = this.prepareRequestOptions(options, apiKey);
      
      // Exécuter la requête
      this.monitor.logRequestStart(apiName, endpoint, requestId);
      
      const response = await fetch(endpoint, requestOptions);
      
      // Analyser la réponse
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Mettre à jour les métriques
      const duration = Date.now() - startTime;
      this.monitor.logRequestComplete(apiName, endpoint, requestId, duration);
      this.quotaManager.incrementUsage(apiName);
      
      // Mettre en cache si activé
      if (this.config.cacheEnabled && options.useCache !== false) {
        const cacheKey = this.generateCacheKey(apiName, endpoint, options);
        const ttl = options.cacheTtl || this.config.defaultTtl;
        await this.cache.set(cacheKey, data, ttl);
      }
      
      return data;
    } catch (error) {
      // Gestion des erreurs avec apiErrorHandler
      this.monitor.logRequestError(apiName, endpoint, requestId, error);
      
      // Contexte de la requête pour le gestionnaire d'erreurs
      const errorContext = {
        endpoint,
        method: options.method || 'GET',
        params: options.params,
        body: options.body,
        apiName,
        requestId
      };
      
      // Déterminer les stratégies de fallback à utiliser
      const fallbackStrategies = [];
      
      // Si le cache est activé, essayer d'abord celui-ci
      if (this.config.cacheEnabled && options.useCache !== false) {
        fallbackStrategies.push(FallbackStrategy.CACHE);
      }
      
      // Si les retries sont configurés, les utiliser ensuite
      if (options.retry && (options.retryCount || 0) < (options.maxRetries || 3)) {
        fallbackStrategies.push(FallbackStrategy.RETRY);
      }
      
      // Toujours notifier et finalement lancer l'erreur si les autres stratégies échouent
      fallbackStrategies.push(FallbackStrategy.NOTIFY, FallbackStrategy.THROW);
      
      // Déléguer la gestion de l'erreur à apiErrorHandler
      return apiErrorHandler.handleApiError(error, errorContext, fallbackStrategies);
    }
  }

  /**
   * Génère une clé de cache cohérente
   */
  generateCacheKey(apiName, endpoint, options) {
    const baseKey = `${apiName}:${endpoint}`;
    
    if (!options.params) {
      return baseKey;
    }
    
    // Générer une clé basée sur les paramètres
    const paramKeys = Object.keys(options.params).sort();
    const paramString = paramKeys
      .map(key => `${key}=${options.params[key]}`)
      .join('&');
    
    return `${baseKey}:${paramString}`;
  }

  /**
   * Prépare les options pour fetch
   */
  prepareRequestOptions(options, apiKey) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    // Ajouter l'API key selon la méthode appropriée
    if (options.authType === 'header') {
      headers[options.authHeader || 'Authorization'] = `${options.authPrefix || 'Bearer'} ${apiKey}`;
    }
    
    const requestOptions = {
      method: options.method || 'GET',
      headers,
      ...options
    };
    
    // Gérer les paramètres d'URL ou body selon la méthode
    if (['GET', 'HEAD'].includes(requestOptions.method) && options.params) {
      const queryParams = new URLSearchParams(options.params).toString();
      requestOptions.url = `${endpoint}?${queryParams}`;
    } else if (options.body) {
      requestOptions.body = JSON.stringify(options.body);
    }
    
    return requestOptions;
  }

  /**
   * Retente une requête échouée
   */
  async retryRequest(apiName, endpoint, options) {
    const delay = options.retryDelay || Math.pow(2, options.retryCount) * 1000; // Backoff exponentiel
    
    console.log(`[UnifiedAPIService] Retrying request to ${apiName}:${endpoint} in ${delay}ms (attempt ${options.retryCount})`);
    
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        this.executeRequest(apiName, endpoint, options)
          .then(resolve)
          .catch(reject);
      }, delay);
    });
  }

  /**
   * Obtient des statistiques sur l'utilisation des APIs
   */
  getStats() {
    return {
      quotas: this.quotaManager.getQuotaStatus(),
      performance: this.monitor.getPerformanceStats(),
      cacheStats: this.cache.getStats()
    };
  }

  /**
   * Réinitialise les compteurs et le cache
   */
  reset() {
    this.quotaManager.reset();
    this.monitor.reset();
    this.cache.clear();
  }
}

export default UnifiedAPIService;
