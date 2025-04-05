/**
 * Service de métriques pour mesurer et analyser les performances des API
 * Fournit des fonctionnalités de suivi du temps de réponse, des taux d'erreur et de disponibilité
 */

const NodeCache = require('node-cache');
const logger = require('../utils/logger');

// Cache pour stocker les métriques
const metricsCache = new NodeCache({ 
  stdTTL: 86400,  // TTL de 24 heures
  checkperiod: 600  // Vérification toutes les 10 minutes
});

// Statistiques globales des API
const apiStats = {
  totalCalls: 0,
  successfulCalls: 0,
  failedCalls: 0,
  timeouts: 0,
  totalResponseTime: 0,
  apiUsage: {}
};

/**
 * Enregistre une métrique d'appel API
 * @param {string} apiName - Nom de l'API
 * @param {string} endpoint - Endpoint appelé
 * @param {number} responseTime - Temps de réponse en ms
 * @param {boolean} successful - Si l'appel a réussi ou non
 * @param {string} errorType - Type d'erreur si l'appel a échoué
 */
const recordApiCall = (apiName, endpoint, responseTime, successful, errorType = null) => {
  try {
    // Incrémenter les compteurs globaux
    apiStats.totalCalls++;
    successful ? apiStats.successfulCalls++ : apiStats.failedCalls++;
    if (errorType === 'timeout') apiStats.timeouts++;
    apiStats.totalResponseTime += responseTime;
    
    // S'assurer que l'API existe dans les statistiques
    if (!apiStats.apiUsage[apiName]) {
      apiStats.apiUsage[apiName] = {
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        timeouts: 0,
        totalResponseTime: 0,
        endpoints: {},
        failureTimestamps: []
      };
    }
    
    // Mettre à jour les statistiques de l'API
    const apiStat = apiStats.apiUsage[apiName];
    apiStat.totalCalls++;
    successful ? apiStat.successfulCalls++ : apiStat.failedCalls++;
    if (errorType === 'timeout') apiStat.timeouts++;
    apiStat.totalResponseTime += responseTime;
    
    // Si l'appel a échoué, enregistrer l'horodatage pour analyser les patterns de défaillance
    if (!successful) {
      apiStat.failureTimestamps.push({
        timestamp: new Date().toISOString(),
        endpoint,
        errorType
      });
      
      // Limiter le nombre d'entrées d'échec pour éviter la consommation excessive de mémoire
      if (apiStat.failureTimestamps.length > 100) {
        apiStat.failureTimestamps.shift();
      }
    }
    
    // S'assurer que l'endpoint existe dans les statistiques
    if (!apiStat.endpoints[endpoint]) {
      apiStat.endpoints[endpoint] = {
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        timeouts: 0,
        totalResponseTime: 0,
        responseTimeHistory: []
      };
    }
    
    // Mettre à jour les statistiques de l'endpoint
    const endpointStat = apiStat.endpoints[endpoint];
    endpointStat.totalCalls++;
    successful ? endpointStat.successfulCalls++ : endpointStat.failedCalls++;
    if (errorType === 'timeout') endpointStat.timeouts++;
    endpointStat.totalResponseTime += responseTime;
    
    // Enregistrer l'historique des temps de réponse pour l'analyse des tendances
    endpointStat.responseTimeHistory.push({
      timestamp: new Date().toISOString(),
      responseTime,
      successful
    });
    
    // Limiter le nombre d'entrées d'historique
    if (endpointStat.responseTimeHistory.length > 100) {
      endpointStat.responseTimeHistory.shift();
    }
    
    // Sauvegarder périodiquement les statistiques dans le cache pour persistance
    if (apiStats.totalCalls % 100 === 0) {
      metricsCache.set('apiStats', apiStats);
      logger.debug(`[MetricsService] Statistiques API sauvegardées (${apiStats.totalCalls} appels totaux)`);
    }
  } catch (error) {
    logger.error(`[MetricsService] Erreur lors de l'enregistrement des métriques: ${error.message}`);
  }
};

/**
 * Récupère les statistiques globales d'utilisation des API
 * @returns {Object} Statistiques d'API
 */
const getApiStats = () => {
  try {
    // Calculer les statistiques dérivées
    const avgResponseTime = apiStats.totalCalls > 0 
      ? apiStats.totalResponseTime / apiStats.totalCalls 
      : 0;
    
    const successRate = apiStats.totalCalls > 0 
      ? (apiStats.successfulCalls / apiStats.totalCalls) * 100 
      : 0;
    
    return {
      ...apiStats,
      avgResponseTime,
      successRate
    };
  } catch (error) {
    logger.error(`[MetricsService] Erreur lors de la récupération des statistiques: ${error.message}`);
    return {
      error: error.message
    };
  }
};

/**
 * Récupère les statistiques détaillées pour une API spécifique
 * @param {string} apiName - Nom de l'API
 * @returns {Object} Statistiques détaillées de l'API
 */
const getApiDetailedStats = (apiName) => {
  try {
    if (!apiStats.apiUsage[apiName]) {
      return {
        error: `Aucune statistique trouvée pour l'API ${apiName}`
      };
    }
    
    const apiStat = apiStats.apiUsage[apiName];
    
    // Calculer les statistiques dérivées
    const avgResponseTime = apiStat.totalCalls > 0 
      ? apiStat.totalResponseTime / apiStat.totalCalls 
      : 0;
    
    const successRate = apiStat.totalCalls > 0 
      ? (apiStat.successfulCalls / apiStat.totalCalls) * 100 
      : 0;
    
    // Analyser les patterns de défaillance
    const failureAnalysis = analyzeFailurePatterns(apiStat.failureTimestamps);
    
    return {
      ...apiStat,
      avgResponseTime,
      successRate,
      failureAnalysis
    };
  } catch (error) {
    logger.error(`[MetricsService] Erreur lors de la récupération des statistiques détaillées: ${error.message}`);
    return {
      error: error.message
    };
  }
};

/**
 * Analyse les patterns de défaillance pour identifier les problèmes potentiels
 * @param {Array} failureTimestamps - Tableau d'horodatages d'échecs
 * @returns {Object} Analyse des échecs
 */
const analyzeFailurePatterns = (failureTimestamps) => {
  if (!failureTimestamps || failureTimestamps.length === 0) {
    return {
      recentFailures: 0,
      potentialOutage: false,
      errorTypeCounts: {}
    };
  }
  
  try {
    // Compter les défaillances récentes (dernières 30 minutes)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const recentFailures = failureTimestamps.filter(f => f.timestamp >= thirtyMinutesAgo).length;
    
    // Détecter une panne potentielle (3 échecs ou plus dans les 5 dernières minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const veryRecentFailures = failureTimestamps.filter(f => f.timestamp >= fiveMinutesAgo).length;
    const potentialOutage = veryRecentFailures >= 3;
    
    // Compter les types d'erreurs
    const errorTypeCounts = {};
    failureTimestamps.forEach(failure => {
      if (!errorTypeCounts[failure.errorType]) {
        errorTypeCounts[failure.errorType] = 0;
      }
      errorTypeCounts[failure.errorType]++;
    });
    
    return {
      recentFailures,
      potentialOutage,
      errorTypeCounts
    };
  } catch (error) {
    logger.error(`[MetricsService] Erreur lors de l'analyse des patterns de défaillance: ${error.message}`);
    return {
      error: error.message
    };
  }
};

/**
 * Calcule des recommandations pour améliorer la fiabilité basées sur les métriques
 * @returns {Array} Recommandations
 */
const getReliabilityRecommendations = () => {
  try {
    const recommendations = [];
    
    // Pour chaque API
    Object.entries(apiStats.apiUsage).forEach(([apiName, apiStat]) => {
      // Vérifier le taux de succès
      const successRate = apiStat.totalCalls > 0
        ? (apiStat.successfulCalls / apiStat.totalCalls) * 100
        : 0;
      
      if (successRate < 95 && apiStat.totalCalls > 10) {
        recommendations.push({
          type: 'warning',
          api: apiName,
          message: `Faible taux de succès (${successRate.toFixed(1)}%) pour l'API ${apiName}`,
          recommendation: 'Augmenter le nombre de tentatives ou ajouter une API alternative'
        });
      }
      
      // Vérifier les temps de réponse
      const avgResponseTime = apiStat.totalCalls > 0
        ? apiStat.totalResponseTime / apiStat.totalCalls
        : 0;
      
      if (avgResponseTime > 2000 && apiStat.totalCalls > 10) {
        recommendations.push({
          type: 'performance',
          api: apiName,
          message: `Temps de réponse élevé (${avgResponseTime.toFixed(0)}ms) pour l'API ${apiName}`,
          recommendation: 'Envisager la mise en cache ou une API plus rapide'
        });
      }
      
      // Vérifier les délais d'attente
      const timeoutRate = apiStat.totalCalls > 0
        ? (apiStat.timeouts / apiStat.totalCalls) * 100
        : 0;
      
      if (timeoutRate > 5 && apiStat.totalCalls > 10) {
        recommendations.push({
          type: 'critical',
          api: apiName,
          message: `Taux élevé de délais d'attente (${timeoutRate.toFixed(1)}%) pour l'API ${apiName}`,
          recommendation: 'Augmenter le délai d\'attente ou passer à une API alternative'
        });
      }
    });
    
    return recommendations;
  } catch (error) {
    logger.error(`[MetricsService] Erreur lors du calcul des recommandations de fiabilité: ${error.message}`);
    return [{
      type: 'error',
      message: `Erreur lors du calcul des recommandations: ${error.message}`
    }];
  }
};

// Charger les statistiques précédentes du cache au démarrage
const cachedStats = metricsCache.get('apiStats');
if (cachedStats) {
  Object.assign(apiStats, cachedStats);
  logger.info(`[MetricsService] Statistiques API chargées depuis le cache (${apiStats.totalCalls} appels totaux)`);
}

module.exports = {
  recordApiCall,
  getApiStats,
  getApiDetailedStats,
  getReliabilityRecommendations
};
