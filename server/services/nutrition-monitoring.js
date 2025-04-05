/**
 * Module de surveillance des performances du service de nutrition
 * S'intègre avec le système de monitoring général et fournit des métriques
 * spécifiques pour les fonctionnalités de nutrition
 */

const winston = require('winston');
const { createMetricsCollector } = require('./metrics-collector');
const alertSystem = require('./alert-system');
const externalServicesMonitor = require('./external-services-monitor');

// Configuration du logger spécifique pour la nutrition
const nutritionLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'nutrition-service' },
  transports: [
    new winston.transports.File({ filename: 'logs/nutrition-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/nutrition-service.log' })
  ]
});

// En développement, on affiche aussi dans la console
if (process.env.NODE_ENV !== 'production') {
  nutritionLogger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Initialisation du collecteur de métriques spécifique à la nutrition
const nutritionMetrics = createMetricsCollector('nutrition');

// Seuils d'alerte pour les métriques de nutrition
const NUTRITION_THRESHOLDS = {
  calculationTime: {
    warning: 1000,    // ms
    critical: 3000    // ms
  },
  apiErrorRate: {
    warning: 0.05,    // 5%
    critical: 0.10    // 10%
  },
  planGenerationTime: {
    warning: 5000,    // ms
    critical: 10000   // ms
  },
  externalApiLatency: {
    warning: 2000,    // ms
    critical: 5000    // ms
  },
  cacheHitRate: {
    warning: 0.7,     // 70%
    critical: 0.5     // 50%
  }
};

/**
 * Enregistre le temps de calcul pour une opération nutritionnelle
 * @param {string} operationType - Type d'opération (basicCalculation, cyclistSpecific, activityBased, planGeneration)
 * @param {number} durationMs - Durée de l'opération en millisecondes
 * @param {Object} metadata - Métadonnées supplémentaires (userProfile, requestSize, etc.)
 */
function recordCalculationTime(operationType, durationMs, metadata = {}) {
  nutritionMetrics.recordDuration(`nutrition.calculation.${operationType}`, durationMs);
  
  // Journalisation
  nutritionLogger.info(`Nutrition calculation: ${operationType}`, {
    duration: durationMs,
    ...metadata
  });
  
  // Vérification des seuils d'alerte
  if (operationType === 'planGeneration') {
    if (durationMs > NUTRITION_THRESHOLDS.planGenerationTime.critical) {
      alertSystem.createAlert('nutrition', 'critical', 
        `La génération de plan nutritionnel est extrêmement lente (${durationMs}ms)`, 
        { operationType, duration: durationMs, ...metadata });
    } else if (durationMs > NUTRITION_THRESHOLDS.planGenerationTime.warning) {
      alertSystem.createAlert('nutrition', 'warning',
        `La génération de plan nutritionnel est lente (${durationMs}ms)`,
        { operationType, duration: durationMs, ...metadata });
    }
  } else {
    if (durationMs > NUTRITION_THRESHOLDS.calculationTime.critical) {
      alertSystem.createAlert('nutrition', 'critical',
        `Le calcul nutritionnel ${operationType} est extrêmement lent (${durationMs}ms)`,
        { operationType, duration: durationMs, ...metadata });
    } else if (durationMs > NUTRITION_THRESHOLDS.calculationTime.warning) {
      alertSystem.createAlert('nutrition', 'warning',
        `Le calcul nutritionnel ${operationType} est lent (${durationMs}ms)`,
        { operationType, duration: durationMs, ...metadata });
    }
  }
}

/**
 * Enregistre une erreur d'API nutritionnelle
 * @param {string} endpoint - Endpoint qui a généré l'erreur
 * @param {Error} error - Objet d'erreur
 * @param {Object} requestData - Données de la requête qui a échoué
 */
function recordApiError(endpoint, error, requestData = {}) {
  nutritionMetrics.incrementCounter('nutrition.api.errors', { endpoint });
  
  // Journalisation détaillée de l'erreur
  nutritionLogger.error(`Nutrition API error: ${endpoint}`, {
    endpoint,
    errorMessage: error.message,
    errorStack: error.stack,
    requestData: JSON.stringify(requestData).substring(0, 1000) // Limiter la taille des logs
  });
  
  // Création d'une alerte
  alertSystem.createAlert('nutrition', 'error',
    `Erreur API nutritionnelle sur ${endpoint}: ${error.message}`,
    { endpoint, errorMessage: error.message });
}

/**
 * Surveille les taux de réussite des calculs nutritionnels
 * @param {string} calculationType - Type de calcul
 * @param {boolean} success - Si le calcul a réussi
 * @param {Object} metadata - Métadonnées supplémentaires
 */
function trackCalculationSuccess(calculationType, success, metadata = {}) {
  nutritionMetrics.recordMetric('nutrition.calculation.success', success ? 1 : 0, { type: calculationType });
  
  if (!success) {
    nutritionLogger.warn(`Échec de calcul nutritionnel: ${calculationType}`, metadata);
  }
}

/**
 * Surveille les performances du cache de nutrition
 * @param {string} cacheType - Type de cache (userProfile, foodData, calculationResults)
 * @param {boolean} hit - Si c'était un hit (true) ou un miss (false)
 * @param {Object} metadata - Métadonnées supplémentaires
 */
function trackCachePerformance(cacheType, hit, metadata = {}) {
  nutritionMetrics.recordMetric('nutrition.cache.hit', hit ? 1 : 0, { type: cacheType });
  
  // Journalisation
  nutritionLogger.debug(`Cache ${cacheType}: ${hit ? 'HIT' : 'MISS'}`, metadata);
}

/**
 * Surveille la disponibilité et les performances des services externes de données nutritionnelles
 * @param {string} serviceName - Nom du service externe (foodDatabase, recipeApi, etc.)
 * @param {number} latencyMs - Latence du service en millisecondes
 * @param {boolean} available - Si le service était disponible
 * @param {Object} metadata - Métadonnées supplémentaires
 */
function monitorExternalNutritionService(serviceName, latencyMs, available, metadata = {}) {
  // Intégration avec le système de surveillance des services externes
  externalServicesMonitor.recordServiceStatus(
    'nutrition', serviceName, available, latencyMs, metadata
  );
  
  // Vérification des seuils d'alerte spécifiques à la nutrition
  if (!available) {
    alertSystem.createAlert('nutrition', 'critical',
      `Service externe de nutrition ${serviceName} indisponible`,
      { service: serviceName, ...metadata });
  } else if (latencyMs > NUTRITION_THRESHOLDS.externalApiLatency.critical) {
    alertSystem.createAlert('nutrition', 'critical',
      `Service externe de nutrition ${serviceName} extrêmement lent (${latencyMs}ms)`,
      { service: serviceName, latency: latencyMs, ...metadata });
  } else if (latencyMs > NUTRITION_THRESHOLDS.externalApiLatency.warning) {
    alertSystem.createAlert('nutrition', 'warning',
      `Service externe de nutrition ${serviceName} lent (${latencyMs}ms)`,
      { service: serviceName, latency: latencyMs, ...metadata });
  }
}

/**
 * Enregistre des métriques d'utilisation des fonctionnalités de nutrition
 * @param {string} feature - Fonctionnalité utilisée
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} metadata - Métadonnées supplémentaires
 */
function trackFeatureUsage(feature, userId, metadata = {}) {
  nutritionMetrics.incrementCounter('nutrition.feature.usage', { feature, userId });
  
  nutritionLogger.info(`Utilisation de fonctionnalité nutrition: ${feature}`, {
    feature,
    userId,
    ...metadata
  });
}

/**
 * Génère un rapport de santé des services de nutrition
 * @returns {Object} Rapport de santé
 */
function getNutritionServicesHealthReport() {
  // Collecte des métriques des dernières 24h
  const lastDayMetrics = nutritionMetrics.getMetricsSummary(24 * 60 * 60 * 1000);
  
  // Calcul des indicateurs clés
  const avgCalculationTime = lastDayMetrics.averages['nutrition.calculation.basicCalculation'] || 0;
  const avgPlanGenerationTime = lastDayMetrics.averages['nutrition.calculation.planGeneration'] || 0;
  const errorRate = lastDayMetrics.ratios['nutrition.api.errors'] || 0;
  const cacheHitRate = lastDayMetrics.ratios['nutrition.cache.hit'] || 0;
  
  // Détermination de l'état global
  let overallStatus = 'healthy';
  if (avgCalculationTime > NUTRITION_THRESHOLDS.calculationTime.critical ||
      avgPlanGenerationTime > NUTRITION_THRESHOLDS.planGenerationTime.critical ||
      errorRate > NUTRITION_THRESHOLDS.apiErrorRate.critical ||
      cacheHitRate < NUTRITION_THRESHOLDS.cacheHitRate.critical) {
    overallStatus = 'critical';
  } else if (avgCalculationTime > NUTRITION_THRESHOLDS.calculationTime.warning ||
             avgPlanGenerationTime > NUTRITION_THRESHOLDS.planGenerationTime.warning ||
             errorRate > NUTRITION_THRESHOLDS.apiErrorRate.warning ||
             cacheHitRate < NUTRITION_THRESHOLDS.cacheHitRate.warning) {
    overallStatus = 'warning';
  }
  
  // Construction du rapport
  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    metrics: {
      avgCalculationTime,
      avgPlanGenerationTime,
      errorRate,
      cacheHitRate,
      totalRequests: lastDayMetrics.counts['nutrition.api.requests'] || 0,
      topFeatures: lastDayMetrics.topK['nutrition.feature.usage'] || []
    },
    thresholds: NUTRITION_THRESHOLDS,
    recentAlerts: alertSystem.getRecentAlerts('nutrition', 5)
  };
}

/**
 * Surveille la performance du composant NutritionCalculator côté client
 * @param {number} renderTimeMs - Temps de rendu en millisecondes
 * @param {string} formComplexity - Complexité du formulaire (simple, advanced, complete)
 * @param {Object} metadata - Métadonnées supplémentaires
 */
function trackClientPerformance(renderTimeMs, formComplexity, metadata = {}) {
  nutritionMetrics.recordDuration('nutrition.client.renderTime', renderTimeMs, { complexity: formComplexity });
  
  nutritionLogger.info(`Performance client NutritionCalculator`, {
    renderTime: renderTimeMs,
    formComplexity,
    ...metadata
  });
  
  // Seuils spécifiques à la complexité du formulaire
  const thresholds = {
    simple: { warning: 500, critical: 1000 },
    advanced: { warning: 1000, critical: 2000 },
    complete: { warning: 1500, critical: 3000 }
  };
  
  const relevantThreshold = thresholds[formComplexity] || thresholds.advanced;
  
  if (renderTimeMs > relevantThreshold.critical) {
    alertSystem.createAlert('nutrition', 'warning',
      `Le rendu du calculateur nutritionnel est très lent côté client (${renderTimeMs}ms)`,
      { renderTime: renderTimeMs, formComplexity, ...metadata });
  }
}

module.exports = {
  recordCalculationTime,
  recordApiError,
  trackCalculationSuccess,
  trackCachePerformance,
  monitorExternalNutritionService,
  trackFeatureUsage,
  getNutritionServicesHealthReport,
  trackClientPerformance
};
