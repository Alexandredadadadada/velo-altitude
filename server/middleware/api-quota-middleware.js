/**
 * Middleware pour la gestion des quotas d'API
 * Intercepte les appels API pour surveiller et gérer les limites de taux
 */
const apiQuotaManager = require('../services/api-quota-manager');
const logger = require('../utils/logger');

/**
 * Middleware pour la surveillance des quotas d'API
 * @param {object} options Options de configuration
 * @returns {function} Middleware Express
 */
function apiQuotaMiddleware(options = {}) {
  const {
    apiName,          // Nom de l'API à surveiller (obligatoire)
    costPerRequest = 1, // Coût de chaque requête (défaut: 1)
    bypassCheck = false, // Si true, enregistre l'usage mais n'empêche pas les requêtes dépassant le quota
    endpointExtractor = req => req.originalUrl, // Fonction pour extraire le nom du endpoint
    onQuotaExceeded   // Fonction à appeler quand le quota est dépassé
  } = options;

  return (req, res, next) => {
    if (!apiName) {
      logger.warn('API Quota Middleware: Nom de l\'API non spécifié');
      return next();
    }

    // Vérifier si la requête peut être effectuée
    const canProceed = apiQuotaManager.canMakeRequest(apiName, costPerRequest);

    if (!canProceed && !bypassCheck) {
      // Quota dépassé
      const message = `Quota d'API dépassé pour ${apiName}`;
      logger.warn(message);

      // Si un handler personnalisé est fourni, l'appeler
      if (typeof onQuotaExceeded === 'function') {
        return onQuotaExceeded(req, res, next);
      }

      // Réponse par défaut
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Le quota d\'API a été dépassé. Veuillez réessayer plus tard.'
      });
    }

    // Capturer le temps de début pour mesurer le temps de réponse
    const startTime = Date.now();

    // Intercepter la méthode send pour capturer la réponse
    const originalSend = res.send;
    res.send = function(data) {
      const responseTime = Date.now() - startTime;
      const endpoint = endpointExtractor(req);
      const success = res.statusCode >= 200 && res.statusCode < 300;

      // Enregistrer l'utilisation
      apiQuotaManager.recordRequest(
        apiName,
        endpoint,
        costPerRequest,
        success,
        responseTime
      );

      // Logger les informations de la requête
      logger.debug(`API Call: ${apiName} - ${endpoint}`, {
        method: req.method,
        statusCode: res.statusCode,
        responseTime,
        success
      });

      // Appeler la méthode send originale
      return originalSend.call(this, data);
    };

    next();
  };
}

/**
 * Middleware spécifique pour l'API Strava
 * Configuration prédéfinie pour une utilisation facile
 */
function stravaApiQuotaMiddleware() {
  return apiQuotaMiddleware({
    apiName: 'strava',
    costPerRequest: 1,
    endpointExtractor: req => {
      // Extraction intelligente de l'endpoint Strava
      const url = req.originalUrl || req.url;
      // Enlever les paramètres de requête pour mieux regrouper les endpoints
      const baseUrl = url.split('?')[0];
      // Identifier le type d'endpoint Strava
      if (baseUrl.includes('/activities')) {
        return 'strava/activities';
      } else if (baseUrl.includes('/athletes')) {
        return 'strava/athletes';
      } else if (baseUrl.includes('/clubs')) {
        return 'strava/clubs';
      } else if (baseUrl.includes('/segments')) {
        return 'strava/segments';
      } else if (baseUrl.includes('/routes')) {
        return 'strava/routes';
      } else {
        return `strava/${baseUrl}`;
      }
    },
    onQuotaExceeded: (req, res, next) => {
      // Réponse spécifique à Strava
      return res.status(429).json({
        error: 'Strava API Quota Exceeded',
        message: 'Le quota de l\'API Strava a été dépassé. Les requêtes sont limitées à 100 par 15 minutes et 1000 par jour.',
        retryAfter: '15 minutes'
      });
    }
  });
}

/**
 * Middleware pour les appels directs à axios ou autres bibliothèques HTTP
 * À utiliser manuellement dans les services qui font des appels API directs
 * 
 * Exemple d'utilisation:
 * const { trackApiCall } = require('../middleware/api-quota-middleware');
 * 
 * async function callExternalApi() {
 *   try {
 *     const response = await axios.get('https://api.example.com/data');
 *     trackApiCall('example', '/data', true, response.status, Date.now() - startTime);
 *     return response.data;
 *   } catch (error) {
 *     trackApiCall('example', '/data', false);
 *     throw error;
 *   }
 * }
 */
function trackApiCall(apiName, endpoint, success = true, statusCode = 200, responseTime = 0, cost = 1) {
  apiQuotaManager.recordRequest(
    apiName,
    endpoint,
    cost,
    success,
    responseTime
  );
  
  logger.debug(`API Call Manual Tracking: ${apiName} - ${endpoint}`, {
    statusCode,
    responseTime,
    success
  });
}

/**
 * Fonction utilitaire pour vérifier si un appel API peut être effectué
 * avant de tenter l'appel
 * 
 * Exemple d'utilisation:
 * if (canCallApi('strava')) {
 *   // faire l'appel API
 * } else {
 *   // gérer le cas où le quota est dépassé
 * }
 */
function canCallApi(apiName, cost = 1) {
  return apiQuotaManager.canMakeRequest(apiName, cost);
}

module.exports = {
  apiQuotaMiddleware,
  stravaApiQuotaMiddleware,
  trackApiCall,
  canCallApi
};
