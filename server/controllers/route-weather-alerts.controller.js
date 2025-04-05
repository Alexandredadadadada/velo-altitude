/**
 * Contrôleur pour les alertes météo liées aux itinéraires
 * Gère les requêtes d'analyse météo pour les itinéraires de cyclisme
 */

const routeWeatherAlertsService = require('../services/route-weather-alerts.service');
const routeService = require('../services/route.service');
const weatherErrorHandler = require('../utils/weather-error-handler');
const logger = require('../utils/logger');
const cacheMiddleware = require('../middleware/cache.middleware');

/**
 * Analyse les conditions météo le long d'un itinéraire et génère des alertes
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
async function analyzeRouteWeather(req, res) {
  try {
    const { routeId } = req.params;
    const { forecastHours, alertTypes, threshold, useCache, segmentLength } = req.query;

    // Vérifier que l'itinéraire existe
    const route = await routeService.getRouteById(routeId);
    if (!route) {
      return res.status(404).json({
        success: false,
        message: `Itinéraire avec ID ${routeId} non trouvé`
      });
    }

    // Options d'analyse
    const options = {
      forecastHours: forecastHours ? parseInt(forecastHours, 10) : 24,
      threshold: threshold || 'standard',
      useCache: useCache !== 'false',
      segmentLength: segmentLength ? parseFloat(segmentLength) : undefined
    };

    // Filtrer les types d'alertes si spécifiés
    if (alertTypes) {
      options.alertTypes = alertTypes.split(',');
    }
    
    logger.info(`[RouteWeatherAlertsController] Analyse météo demandée pour l'itinéraire ${routeId}`);
    
    // Appeler le service d'analyse météo
    const alerts = await routeWeatherAlertsService.analyzeRouteWeather(route, options);
    
    // Statistiques sur les alertes pour le frontend
    const alertStats = {
      total: alerts.length,
      bySeverity: {
        high: alerts.filter(a => a.severity === 'high').length,
        medium: alerts.filter(a => a.severity === 'medium').length,
        low: alerts.filter(a => a.severity === 'low').length,
      },
      byType: {}
    };
    
    // Compter par type
    alerts.forEach(alert => {
      const type = alert.type;
      if (!alertStats.byType[type]) {
        alertStats.byType[type] = 0;
      }
      alertStats.byType[type]++;
    });

    // Réponse avec les alertes et les statistiques
    return res.status(200).json({
      success: true,
      data: {
        alerts,
        stats: alertStats,
        routeInfo: {
          id: route.id,
          name: route.name,
          distance: route.distance,
          pointsCount: route.points.length
        }
      }
    });
  } catch (error) {
    logger.error(`[RouteWeatherAlertsController] Erreur: ${error.message}`);
    return weatherErrorHandler.handleApiError(error, req, res);
  }
}

/**
 * Vérifie si des changements météo significatifs sont survenus pour l'itinéraire
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
async function checkWeatherChanges(req, res) {
  try {
    const { routeId } = req.params;
    
    // Options de vérification
    const options = {
      onlySignificant: req.query.onlySignificant !== 'false'
    };
    
    logger.info(`[RouteWeatherAlertsController] Vérification des changements météo pour l'itinéraire ${routeId}`);
    
    // Vérifier que l'itinéraire existe
    const route = await routeService.getRouteById(routeId);
    if (!route) {
      return res.status(404).json({
        success: false,
        message: `Itinéraire avec ID ${routeId} non trouvé`
      });
    }
    
    // Appeler le service de vérification des changements
    const changes = await routeWeatherAlertsService.checkWeatherChanges(routeId, options);
    
    return res.status(200).json({
      success: true,
      data: {
        changes,
        hasSignificantChanges: changes.length > 0,
        timestamp: new Date()
      }
    });
  } catch (error) {
    logger.error(`[RouteWeatherAlertsController] Erreur: ${error.message}`);
    return weatherErrorHandler.handleApiError(error, req, res);
  }
}

module.exports = {
  analyzeRouteWeather,
  checkWeatherChanges
};
