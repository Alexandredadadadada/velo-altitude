/**
 * Contrôleur pour les données environnementales
 * Expose les API pour accéder aux données de qualité d'air et de vent
 */

const environmentalService = require('../services/environmental.service');
const airQualityService = require('../services/air-quality.service');
const windForecastService = require('../services/wind-forecast.service');
const logger = require('../utils/logger');

/**
 * Récupère les données environnementales complètes pour une localisation
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
exports.getEnvironmentalData = async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ 
        success: false, 
        error: 'Les paramètres lat et lng sont requis' 
      });
    }
    
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Les coordonnées doivent être des nombres valides' 
      });
    }
    
    logger.info(`[EnvironmentalController] Récupération des données environnementales pour ${latitude}, ${longitude}`);
    
    const environmentalData = await environmentalService.getEnvironmentalDataByLocation(
      latitude, 
      longitude
    );
    
    return res.json({
      success: true,
      data: environmentalData
    });
  } catch (error) {
    logger.error(`[EnvironmentalController] Erreur: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des données environnementales',
      message: error.message
    });
  }
};

/**
 * Récupère uniquement les données de qualité d'air pour une localisation
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
exports.getAirQuality = async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ 
        success: false, 
        error: 'Les paramètres lat et lng sont requis' 
      });
    }
    
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Les coordonnées doivent être des nombres valides' 
      });
    }
    
    logger.info(`[EnvironmentalController] Récupération de la qualité d'air pour ${latitude}, ${longitude}`);
    
    const airQualityData = await airQualityService.getAirQualityByLocation(
      latitude, 
      longitude
    );
    
    return res.json({
      success: true,
      data: airQualityData
    });
  } catch (error) {
    logger.error(`[EnvironmentalController] Erreur: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des données de qualité d\'air',
      message: error.message
    });
  }
};

/**
 * Récupère uniquement les prévisions de vent pour une localisation
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
exports.getWindForecast = async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ 
        success: false, 
        error: 'Les paramètres lat et lng sont requis' 
      });
    }
    
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Les coordonnées doivent être des nombres valides' 
      });
    }
    
    logger.info(`[EnvironmentalController] Récupération des prévisions de vent pour ${latitude}, ${longitude}`);
    
    const windForecastData = await windForecastService.getWindForecastByLocation(
      latitude, 
      longitude
    );
    
    return res.json({
      success: true,
      data: windForecastData
    });
  } catch (error) {
    logger.error(`[EnvironmentalController] Erreur: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des prévisions de vent',
      message: error.message
    });
  }
};

/**
 * Récupère les données environnementales le long d'un itinéraire
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
exports.getEnvironmentalDataAlongRoute = async (req, res) => {
  try {
    const { routePoints } = req.body;
    
    if (!routePoints || !Array.isArray(routePoints) || routePoints.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Un tableau de points d\'itinéraire valide est requis dans le corps de la requête' 
      });
    }
    
    // Valider le format des points
    for (const point of routePoints) {
      if (!point.lat || !point.lng || isNaN(parseFloat(point.lat)) || isNaN(parseFloat(point.lng))) {
        return res.status(400).json({ 
          success: false, 
          error: 'Chaque point doit avoir des propriétés lat et lng valides' 
        });
      }
    }
    
    logger.info(`[EnvironmentalController] Récupération des données environnementales pour un itinéraire de ${routePoints.length} points`);
    
    const environmentalData = await environmentalService.getEnvironmentalDataAlongRoute(routePoints);
    
    return res.json({
      success: true,
      data: environmentalData
    });
  } catch (error) {
    logger.error(`[EnvironmentalController] Erreur: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des données environnementales pour l\'itinéraire',
      message: error.message
    });
  }
};

/**
 * Récupère uniquement les données de qualité d'air le long d'un itinéraire
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
exports.getAirQualityAlongRoute = async (req, res) => {
  try {
    const { routePoints } = req.body;
    
    if (!routePoints || !Array.isArray(routePoints) || routePoints.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Un tableau de points d\'itinéraire valide est requis dans le corps de la requête' 
      });
    }
    
    logger.info(`[EnvironmentalController] Récupération de la qualité d'air pour un itinéraire de ${routePoints.length} points`);
    
    const airQualityData = await airQualityService.getAirQualityAlongRoute(routePoints);
    
    return res.json({
      success: true,
      data: airQualityData
    });
  } catch (error) {
    logger.error(`[EnvironmentalController] Erreur: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des données de qualité d\'air pour l\'itinéraire',
      message: error.message
    });
  }
};

/**
 * Récupère uniquement les prévisions de vent le long d'un itinéraire
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
exports.getWindForecastAlongRoute = async (req, res) => {
  try {
    const { routePoints } = req.body;
    
    if (!routePoints || !Array.isArray(routePoints) || routePoints.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Un tableau de points d\'itinéraire valide est requis dans le corps de la requête' 
      });
    }
    
    logger.info(`[EnvironmentalController] Récupération des prévisions de vent pour un itinéraire de ${routePoints.length} points`);
    
    const windForecastData = await windForecastService.getWindForecastAlongRoute(routePoints);
    
    return res.json({
      success: true,
      data: windForecastData
    });
  } catch (error) {
    logger.error(`[EnvironmentalController] Erreur: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des prévisions de vent pour l\'itinéraire',
      message: error.message
    });
  }
};
