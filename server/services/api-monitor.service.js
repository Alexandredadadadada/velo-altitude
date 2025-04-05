const axios = require('axios');
const NodeCache = require('node-cache');

/**
 * Service de monitoring des API
 * Implémente les recommandations de l'Agent 3 (Assurance Qualité & Intégration)
 * - Surveille les appels API
 * - Gère la mise en cache
 * - Collecte des statistiques d'utilisation
 * - Génère des rapports
 */
class ApiMonitorService {
  constructor() {
    // Cache avec une durée de vie par défaut d'une heure
    this.cache = new NodeCache({ stdTTL: 3600 });
    this.usageStats = {};
    this.startTime = Date.now();
  }

  /**
   * Surveille un appel API avec gestion de cache et stats
   * @param {string} service - Nom du service API
   * @param {string} endpoint - Point de terminaison appelé
   * @param {Object} params - Paramètres de l'appel axios
   * @param {number} cacheTTL - Durée de vie en cache (en secondes)
   * @returns {Promise<any>} - Résultat de l'appel API
   */
  async monitorApiCall(service, endpoint, params, cacheTTL = 3600) {
    const startTime = Date.now();
    
    // Générer une clé de cache unique basée sur les paramètres de la requête
    const cacheKey = this.generateCacheKey(service, endpoint, params);
    
    // Vérifier si les données sont en cache
    const cachedResponse = this.cache.get(cacheKey);
    if (cachedResponse) {
      this.recordUsage(service, endpoint, 'cache', 0);
      return cachedResponse;
    }
    
    try {
      // Exécuter l'appel API avec retry automatique
      const response = await this.executeWithRetry(async () => {
        return await axios(params);
      });
      
      const duration = Date.now() - startTime;
      
      // Enregistrer les statistiques
      this.recordUsage(service, endpoint, response.status, duration);
      
      // Mettre en cache si c'est un succès
      if (response.status >= 200 && response.status < 300) {
        this.cache.set(cacheKey, response.data, cacheTTL);
      }
      
      return response.data;
    } catch (error) {
      const duration = Date.now() - startTime;
      const status = error.response?.status || 'error';
      
      this.recordUsage(service, endpoint, status, duration);
      
      // Remontée de l'erreur avec informations enrichies
      throw {
        originalError: error,
        service,
        endpoint,
        duration,
        status,
        message: `Erreur lors de l'appel à ${service}/${endpoint}: ${error.message}`
      };
    }
  }
  
  /**
   * Génère une clé de cache unique
   * @param {string} service - Nom du service
   * @param {string} endpoint - Point de terminaison
   * @param {Object} params - Paramètres de la requête
   * @returns {string} - Clé de cache
   */
  generateCacheKey(service, endpoint, params) {
    const method = params.method || 'GET';
    const url = params.url || '';
    const queryParams = params.params ? JSON.stringify(params.params) : '';
    const body = params.data ? JSON.stringify(params.data) : '';
    
    return `${service}_${endpoint}_${method}_${url}_${queryParams}_${body}`;
  }
  
  /**
   * Exécute une fonction avec retry automatique
   * @param {Function} fn - Fonction à exécuter
   * @param {number} maxRetries - Nombre maximum de tentatives
   * @param {number} baseDelay - Délai initial en ms
   * @returns {Promise<any>} - Résultat de la fonction
   */
  async executeWithRetry(fn, maxRetries = 3, baseDelay = 300) {
    let lastError;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        // Ne pas réessayer pour certaines erreurs
        if (error.response && [400, 401, 403, 404].includes(error.response.status)) {
          throw error;
        }
        
        // Délai exponentiel avant la prochaine tentative
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  /**
   * Enregistre les statistiques d'utilisation d'API
   * @param {string} service - Nom du service
   * @param {string} endpoint - Point de terminaison
   * @param {number|string} status - Code de statut HTTP ou 'cache'/'error'
   * @param {number} duration - Durée de l'appel en ms
   */
  recordUsage(service, endpoint, status, duration) {
    const key = `${service}_${endpoint}`;
    
    if (!this.usageStats[key]) {
      this.usageStats[key] = {
        calls: 0,
        errors: 0,
        cacheHits: 0,
        totalDuration: 0,
        avgDuration: 0,
        minDuration: Number.MAX_SAFE_INTEGER,
        maxDuration: 0,
        statusCodes: {},
        lastCall: null
      };
    }
    
    const stats = this.usageStats[key];
    stats.calls++;
    stats.lastCall = new Date().toISOString();
    
    if (status === 'cache') {
      stats.cacheHits++;
    } else {
      stats.totalDuration += duration;
      stats.avgDuration = stats.totalDuration / (stats.calls - stats.cacheHits);
      stats.minDuration = Math.min(stats.minDuration, duration);
      stats.maxDuration = Math.max(stats.maxDuration, duration);
      
      if (status !== 'cache' && (typeof status !== 'number' || status < 200 || status >= 300)) {
        stats.errors++;
      }
      
      if (!stats.statusCodes[status]) {
        stats.statusCodes[status] = 0;
      }
      stats.statusCodes[status]++;
    }
  }

  /**
   * Récupère les statistiques d'utilisation brutes
   * @returns {Object} - Statistiques d'utilisation
   */
  getUsageStats() {
    return this.usageStats;
  }

  /**
   * Génère un rapport d'utilisation des API
   * @returns {Object} - Rapport formaté
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      summary: {
        totalCalls: 0,
        totalErrors: 0,
        totalCacheHits: 0,
        avgDuration: 0,
        totalDuration: 0,
        errorRate: 0
      },
      services: {}
    };
    
    Object.keys(this.usageStats).forEach(key => {
      const [service, endpoint] = key.split('_');
      const stats = this.usageStats[key];
      
      // Ajouter au résumé global
      report.summary.totalCalls += stats.calls;
      report.summary.totalErrors += stats.errors;
      report.summary.totalCacheHits += stats.cacheHits;
      report.summary.totalDuration += stats.totalDuration;
      
      // Initialiser le service s'il n'existe pas
      if (!report.services[service]) {
        report.services[service] = {
          calls: 0,
          errors: 0,
          cacheHits: 0,
          errorRate: 0,
          endpoints: {}
        };
      }
      
      // Ajouter les statistiques du service
      report.services[service].calls += stats.calls;
      report.services[service].errors += stats.errors;
      report.services[service].cacheHits += stats.cacheHits;
      
      // Ajouter les statistiques de l'endpoint
      report.services[service].endpoints[endpoint] = {
        calls: stats.calls,
        errors: stats.errors,
        cacheHits: stats.cacheHits,
        avgDuration: stats.avgDuration,
        minDuration: stats.minDuration === Number.MAX_SAFE_INTEGER ? 0 : stats.minDuration,
        maxDuration: stats.maxDuration,
        errorRate: stats.calls > 0 ? (stats.errors / stats.calls) * 100 : 0,
        cacheHitRate: stats.calls > 0 ? (stats.cacheHits / stats.calls) * 100 : 0,
        statusCodes: stats.statusCodes,
        lastCall: stats.lastCall
      };
      
      // Calculer le taux d'erreur du service
      report.services[service].errorRate = 
        report.services[service].calls > 0 
          ? (report.services[service].errors / report.services[service].calls) * 100 
          : 0;
    });
    
    // Calculer la durée moyenne globale
    const realCalls = report.summary.totalCalls - report.summary.totalCacheHits;
    if (realCalls > 0) {
      report.summary.avgDuration = report.summary.totalDuration / realCalls;
      report.summary.errorRate = (report.summary.totalErrors / report.summary.totalCalls) * 100;
    }
    
    return report;
  }
  
  /**
   * Vide le cache
   * @param {string} [servicePattern] - Modèle pour filtrer les services
   * @param {string} [endpointPattern] - Modèle pour filtrer les endpoints
   */
  clearCache(servicePattern = null, endpointPattern = null) {
    if (!servicePattern && !endpointPattern) {
      this.cache.flushAll();
      return;
    }
    
    const keys = this.cache.keys();
    keys.forEach(key => {
      const [service, endpoint] = key.split('_');
      if (
        (!servicePattern || service.match(servicePattern)) && 
        (!endpointPattern || endpoint.match(endpointPattern))
      ) {
        this.cache.del(key);
      }
    });
  }
}

// Exporter une instance singleton
module.exports = new ApiMonitorService();
