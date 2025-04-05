/**
 * Gestionnaire d'erreurs spécifique pour les services météo
 * Centralise la gestion et le logging des erreurs liées aux données météo
 */

const logger = require('./logger');
const retryService = require('./retry.service');
const { createHash } = require('crypto');

// États des erreurs pour le suivi
const weatherErrorStates = new Map();

// Cache des alertes météo récentes
const recentAlerts = new Map();

/**
 * Journalise une erreur de traitement météo avec des détails
 * @param {Error} error - L'erreur à journaliser
 * @param {Object} context - Contexte supplémentaire
 * @param {string} source - Source de l'erreur (service, fonction)
 */
function logWeatherError(error, context = {}, source = 'unknown') {
  const errorId = createHash('md5')
    .update(`${Date.now()}${source}${error.message}`)
    .digest('hex')
    .substring(0, 8);
  
  // Structurer les informations d'erreur
  const errorInfo = {
    id: errorId,
    timestamp: new Date().toISOString(),
    source,
    message: error.message,
    stack: error.stack,
    context
  };
  
  // Utiliser le système de journalisation par domaine
  logger.logDomainError('weather', error.message, errorInfo);
  
  // Suivre les erreurs fréquentes
  const errorKey = `${source}:${error.message.substring(0, 50)}`;
  const currentCount = weatherErrorStates.get(errorKey) || 0;
  weatherErrorStates.set(errorKey, currentCount + 1);
  
  // Alerter si une erreur devient trop fréquente
  if (currentCount + 1 >= 5 && !recentAlerts.has(errorKey)) { // 5 occurrences de la même erreur
    logger.warn(`ALERTE: Erreur météo répétée ${currentCount + 1} fois`, {
      errorKey,
      count: currentCount + 1,
      errorId,
      source
    });
    
    // Éviter de spammer les alertes (maximum une alerte par heure pour la même erreur)
    recentAlerts.set(errorKey, Date.now());
    setTimeout(() => {
      recentAlerts.delete(errorKey);
    }, 60 * 60 * 1000); // 1 heure
  }
  
  return errorId;
}

/**
 * Exécute une opération météo avec gestion d'erreur et retry
 * @param {Function} operation - La fonction à exécuter
 * @param {Object} context - Contexte pour les logs
 * @param {Object} options - Options de retry et fallback
 * @returns {Promise<any>} Résultat de l'opération
 */
async function executeWeatherOperation(operation, context = {}, options = {}) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    source = 'weather-operation',
    fallbackValue = null,
    fallbackOperation = null,
    cacheKey = null,
    cacheTTL = 1800,
    criticalOperation = false,
    timeout = 30000 // 30 secondes de timeout par défaut
  } = options;
  
  // Enregistrer le début de l'opération
  const startTime = Date.now();
  logger.debug(`Début opération météo: ${source}`, { context, options });
  
  // Créer une promesse avec timeout
  const executeWithTimeout = async (op) => {
    return Promise.race([
      op(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Timeout après ${timeout}ms`)), timeout)
      )
    ]);
  };
  
  // Si nous avons une opération de fallback et une clé de cache, utiliser le service de retry
  if (fallbackOperation && cacheKey) {
    try {
      const result = await retryService.callApiWithFallback(
        () => executeWithTimeout(operation),
        fallbackOperation,
        cacheKey,
        cacheTTL
      );
      
      // Enregistrer la durée de l'opération réussie
      const duration = Date.now() - startTime;
      logger.debug(`Opération météo réussie: ${source}`, { 
        duration,
        cacheKey,
        cacheTTL
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorId = logWeatherError(error, { 
        ...context, 
        retriesExhausted: true,
        duration
      }, source);
      
      if (fallbackValue !== null) {
        logger.info(`Utilisation de la valeur par défaut après échec des retries pour ${source}`, {
          errorId,
          duration
        });
        return {
          ...fallbackValue,
          errorId,
          isDefaultValue: true
        };
      }
      
      throw error;
    }
  }
  
  // Sinon, gérer manuellement les retries
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await executeWithTimeout(operation);
      
      // Enregistrer la durée de l'opération réussie
      const duration = Date.now() - startTime;
      logger.debug(`Opération météo réussie: ${source} (tentative ${attempt}/${maxRetries})`, { 
        duration, 
        attempt 
      });
      
      return result;
    } catch (error) {
      lastError = error;
      
      // Log l'erreur avec le contexte
      const attemptDuration = Date.now() - startTime;
      logWeatherError(error, { 
        ...context, 
        attempt, 
        maxRetries,
        attemptDuration 
      }, source);
      
      // Si c'est la dernière tentative, ne pas attendre
      if (attempt === maxRetries) break;
      
      // Backoff exponentiel
      const delay = retryDelay * Math.pow(2, attempt - 1);
      logger.debug(`Nouvel essai dans ${delay}ms pour ${source} (tentative ${attempt}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // Toutes les tentatives ont échoué
  const totalDuration = Date.now() - startTime;
  const errorId = logWeatherError(lastError, { 
    ...context, 
    retriesExhausted: true,
    totalDuration
  }, source);
  
  // Retourner la valeur par défaut si fournie
  if (fallbackValue !== null) {
    logger.info(`Utilisation de la valeur par défaut après échec des retries pour ${source}`, {
      errorId,
      totalDuration
    });
    return {
      ...fallbackValue,
      errorId,
      isDefaultValue: true,
      operationDuration: totalDuration
    };
  }
  
  // Pour les opérations critiques, enregistrer une alerte système
  if (criticalOperation) {
    logger.error(`ALERTE CRITIQUE: Échec d'une opération météo essentielle: ${source}`, {
      errorId,
      totalDuration,
      error: lastError.message,
      stack: lastError.stack
    });
  }
  
  // Sinon, propager l'erreur
  throw new Error(`Échec après ${maxRetries} tentatives: ${lastError.message} [ID: ${errorId}]`);
}

/**
 * Définit une erreur de traitement avec des détails enrichis
 * @param {string} message - Message d'erreur principal
 * @param {Object} details - Détails supplémentaires
 * @param {string} code - Code d'erreur
 * @returns {Object} Objet d'erreur enrichi
 */
function setProcessingError(message, details = {}, code = 'WEATHER_PROCESSING_ERROR') {
  // Journaliser l'erreur
  const errorId = logWeatherError(new Error(message), details, details.source || 'processing');
  
  // Enrichir avec impact métier si applicable
  const businessImpact = determineBusinessImpact(code, message);
  
  // Structurer l'erreur pour l'API
  return {
    error: true,
    code,
    message,
    timestamp: new Date().toISOString(),
    id: errorId,
    businessImpact,
    details: {
      ...details,
      // Enrichir avec des conseils de résolution si disponibles
      suggestions: getErrorSuggestions(code, message)
    }
  };
}

/**
 * Détermine l'impact métier d'une erreur
 * @param {string} code - Code d'erreur
 * @param {string} message - Message d'erreur
 * @returns {Object} - Impact métier évalué
 */
function determineBusinessImpact(code, message) {
  let severity = 'low';
  let userVisibility = false;
  let description = '';
  
  switch (code) {
    case 'API_UNAVAILABLE':
      severity = 'high';
      userVisibility = true;
      description = 'Prévisions météo indisponibles pour les utilisateurs';
      break;
    case 'LOCATION_NOT_FOUND':
    case 'INVALID_COORDINATES':
      severity = 'medium';
      userVisibility = true;
      description = 'Impossible de fournir des prévisions pour certains itinéraires';
      break;
    case 'GPX_PARSING_ERROR':
      severity = 'medium';
      userVisibility = true;
      description = 'Impossible d\'analyser certains fichiers d\'itinéraires';
      break;
    case 'WEATHER_DATA_INCOMPLETE':
      severity = 'low';
      userVisibility = true;
      description = 'Données météo partielles, expérience utilisateur dégradée';
      break;
    default:
      severity = 'low';
      userVisibility = false;
      description = 'Impact limité sur l\'expérience utilisateur';
  }
  
  // Affiner en fonction du message
  if (message.includes('clé API') || message.includes('API key')) {
    severity = 'critical';
    userVisibility = true;
    description = 'Service météo complètement indisponible - problème d\'authentification';
  }
  if (message.includes('quota') || message.includes('rate limit')) {
    severity = 'critical';
    userVisibility = true;
    description = 'Service météo temporairement indisponible - limite d\'utilisation dépassée';
  }
  
  return {
    severity,
    userVisibility,
    description
  };
}

/**
 * Génère des suggestions de résolution basées sur le code d'erreur
 * @param {string} code - Code d'erreur
 * @param {string} message - Message d'erreur
 * @returns {Array<string>} Suggestions de résolution
 */
function getErrorSuggestions(code, message) {
  const suggestions = [];
  
  switch (code) {
    case 'API_UNAVAILABLE':
      suggestions.push('Vérifiez votre connexion internet');
      suggestions.push('Le service météo tiers peut être temporairement indisponible');
      suggestions.push('Réessayez dans quelques minutes');
      break;
    case 'LOCATION_NOT_FOUND':
      suggestions.push('Vérifiez les coordonnées GPS spécifiées');
      suggestions.push('Essayez d\'utiliser une localité ou un code postal plutôt que des coordonnées précises');
      suggestions.push('Vérifiez que la zone géographique est couverte par le service météo');
      break;
    case 'INVALID_COORDINATES':
      suggestions.push('Les coordonnées doivent être dans un format valide (latitude entre -90 et 90, longitude entre -180 et 180)');
      suggestions.push('Vérifiez le format des données GPS dans votre fichier');
      break;
    case 'GPX_PARSING_ERROR':
      suggestions.push('Vérifiez que le fichier GPX est correctement formaté');
      suggestions.push('Essayez d\'exporter à nouveau le fichier depuis votre appareil ou logiciel');
      suggestions.push('Utilisez un outil de validation GPX pour vérifier la structure de votre fichier');
      break;
    case 'WEATHER_DATA_INCOMPLETE':
      suggestions.push('Certaines données météo sont manquantes, les valeurs affichées sont partielles');
      suggestions.push('Essayez de réduire la plage temporelle de votre requête');
      suggestions.push('Vérifiez que les paramètres demandés sont disponibles pour cette région');
      break;
    default:
      suggestions.push('Réessayez l\'opération');
      suggestions.push('Si le problème persiste, contactez le support technique');
  }
  
  // Ajouter des suggestions basées sur le contenu du message
  if (message.includes('clé API') || message.includes('API key')) {
    suggestions.push('Vérifiez que vos clés API sont valides et correctement configurées');
    suggestions.push('Renouvelez votre clé API si elle a expiré');
  }
  if (message.includes('timeout') || message.includes('délai d\'attente')) {
    suggestions.push('Le service météo est peut-être surchargé, réessayez plus tard');
    suggestions.push('Vérifiez la taille de votre requête, elle est peut-être trop volumineuse');
  }
  if (message.includes('quota') || message.includes('rate limit')) {
    suggestions.push('Le quota d\'appels API est peut-être dépassé, attendez avant de réessayer');
    suggestions.push('Envisagez de mettre à niveau votre abonnement au service météo');
  }
  
  return suggestions;
}

/**
 * Obtient des statistiques sur les erreurs rencontrées
 * @returns {Object} Statistiques d'erreurs
 */
function getErrorStats() {
  // Convertir la map en objet pour plus de lisibilité
  const errorCounts = {};
  weatherErrorStates.forEach((count, key) => {
    errorCounts[key] = count;
  });
  
  // Trouver les erreurs les plus fréquentes
  const sortedErrors = [...weatherErrorStates.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5); // Top 5
  
  // Analyser les erreurs par type de source
  const sourceGroups = {};
  for (const [key, count] of weatherErrorStates.entries()) {
    const source = key.split(':')[0];
    if (!sourceGroups[source]) {
      sourceGroups[source] = 0;
    }
    sourceGroups[source] += count;
  }
  
  return {
    total: [...weatherErrorStates.values()].reduce((sum, count) => sum + count, 0),
    unique: weatherErrorStates.size,
    mostCommon: sortedErrors.map(([key, count]) => ({ key, count })),
    bySource: errorCounts,
    sourceGroups
  };
}

/**
 * Réinitialise les statistiques d'erreurs
 */
function resetErrorStats() {
  weatherErrorStates.clear();
  recentAlerts.clear();
}

/**
 * Vérifie l'état de santé des services météo
 * @param {Array} services - Services à vérifier
 * @returns {Object} État de santé des services météo
 */
async function checkWeatherServicesHealth(services = ['openweathermap', 'weatherapi']) {
  const results = {};
  const checkPromises = [];
  
  // Fonction de vérification de santé générique
  const checkServiceHealth = async (serviceName, checkFn) => {
    try {
      const startTime = Date.now();
      const result = await executeWeatherOperation(
        checkFn,
        { service: serviceName },
        { 
          source: `health-check-${serviceName}`,
          maxRetries: 1,
          timeout: 5000 // Timeout court pour les health checks
        }
      );
      const responseTime = Date.now() - startTime;
      
      return {
        service: serviceName,
        status: 'healthy',
        responseTime,
        message: `Service opérationnel (${responseTime}ms)`
      };
    } catch (error) {
      return {
        service: serviceName,
        status: 'unhealthy',
        message: error.message,
        error: true
      };
    }
  };
  
  // Définir les fonctions de vérification par service
  const healthChecks = {
    openweathermap: async () => {
      // Simuler un appel de vérification de santé à OpenWeatherMap
      // En production, on utiliserait un vrai appel API léger
      return { status: 'ok' };
    },
    weatherapi: async () => {
      // Simuler un appel de vérification de santé à WeatherAPI
      // En production, on utiliserait un vrai appel API léger
      return { status: 'ok' };
    }
  };
  
  // Exécuter les vérifications pour chaque service demandé
  for (const service of services) {
    if (healthChecks[service]) {
      checkPromises.push(
        checkServiceHealth(service, healthChecks[service])
          .then(result => {
            results[service] = result;
          })
      );
    } else {
      results[service] = {
        service,
        status: 'unknown',
        message: 'Service non configuré'
      };
    }
  }
  
  // Attendre que toutes les vérifications soient terminées
  await Promise.all(checkPromises);
  
  // Déterminer l'état global
  const overallStatus = Object.values(results).some(r => r.status !== 'healthy')
    ? 'degraded'
    : 'healthy';
  
  return {
    timestamp: new Date().toISOString(),
    overall: overallStatus,
    services: results
  };
}

module.exports = {
  logWeatherError,
  executeWeatherOperation,
  setProcessingError,
  getErrorStats,
  resetErrorStats,
  checkWeatherServicesHealth,
  determineBusinessImpact
};
