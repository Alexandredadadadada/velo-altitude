/**
 * Contrôleur pour la visualisation des itinéraires
 * @module controllers/route-visualization.controller
 */

const Route = require('../models/route.model');
const visualizationModel = require('../models/visualization.model');
const routeColorService = require('../services/route-color.service');
const logger = require('../utils/logger');
const { errorHandler } = require('../utils/error-handler');

/**
 * Récupère un itinéraire avec code couleur par difficulté
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @returns {Object} - Réponse HTTP avec GeoJSON de l'itinéraire
 */
async function getColorCodedRoute(req, res) {
  try {
    const { routeId } = req.params;
    const { includeSegments = true } = req.query;
    
    // Convertir la chaîne 'true'/'false' en booléen
    const includeSegmentsBoolean = includeSegments === 'true' || includeSegments === true;
    
    // Récupérer l'itinéraire depuis la base de données
    const route = await Route.findById(routeId);
    
    if (!route) {
      return res.status(404).json({
        status: 'error',
        message: 'Itinéraire non trouvé'
      });
    }
    
    // Générer le GeoJSON coloré pour l'itinéraire
    const colorCodedGeoJSON = await visualizationModel.generateColorCodedRouteGeoJSON(route, includeSegmentsBoolean);
    
    // Répondre avec le GeoJSON
    return res.status(200).json({
      status: 'success',
      data: colorCodedGeoJSON
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération de l\'itinéraire coloré', {
      error: error.message,
      stack: error.stack
    });
    return errorHandler(error, req, res);
  }
}

/**
 * Récupère le CSS pour les couleurs d'itinéraires
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @returns {String} - CSS pour les couleurs d'itinéraires
 */
function getRouteColorsCss(req, res) {
  try {
    // Générer le CSS
    const css = routeColorService.generateRouteColorsCss();
    
    // Définir les headers pour le CSS
    res.setHeader('Content-Type', 'text/css');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache d'un jour
    
    // Répondre avec le CSS
    return res.status(200).send(css);
  } catch (error) {
    logger.error('Erreur lors de la génération du CSS pour les couleurs d\'itinéraires', {
      error: error.message,
      stack: error.stack
    });
    return errorHandler(error, req, res);
  }
}

/**
 * Calcule la difficulté globale d'un itinéraire
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @returns {Object} - Niveau de difficulté et information associée
 */
async function calculateRouteDifficulty(req, res) {
  try {
    const routeStats = req.body;
    
    // Vérifier que les paramètres nécessaires sont fournis
    if (!routeStats || typeof routeStats !== 'object') {
      return res.status(400).json({
        status: 'error',
        message: 'Statistiques d\'itinéraire invalides'
      });
    }
    
    // Calculer la difficulté
    const difficulty = routeColorService.calculateRouteDifficulty(routeStats);
    
    // Récupérer les informations de couleur associées
    const colorInfo = {
      baseColor: routeColorService.getColorForDifficulty(difficulty),
      gradient: routeColorService.getGradientForDifficulty(difficulty),
      cssClass: routeColorService.getCssClassForDifficulty(difficulty),
      gpxColor: routeColorService.getGpxColorForDifficulty(difficulty)
    };
    
    // Répondre avec les informations de difficulté
    return res.status(200).json({
      status: 'success',
      data: {
        difficulty,
        colorInfo
      }
    });
  } catch (error) {
    logger.error('Erreur lors du calcul de la difficulté d\'itinéraire', {
      error: error.message,
      stack: error.stack
    });
    return errorHandler(error, req, res);
  }
}

/**
 * Génère le style Leaflet pour un segment de pente spécifique
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @returns {Object} - Style Leaflet pour la pente
 */
function getGradientStyle(req, res) {
  try {
    const { gradient } = req.params;
    
    // Vérifier que le gradient est un nombre
    const gradientValue = parseFloat(gradient);
    
    if (isNaN(gradientValue)) {
      return res.status(400).json({
        status: 'error',
        message: 'Gradient invalide'
      });
    }
    
    // Récupérer le style pour cette pente
    const style = routeColorService.getGradientSegmentStyle(gradientValue);
    
    // Répondre avec le style
    return res.status(200).json({
      status: 'success',
      data: style
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération du style pour gradient', {
      error: error.message,
      stack: error.stack
    });
    return errorHandler(error, req, res);
  }
}

/**
 * Obtient une palette de couleurs pour un ensemble de routes
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @returns {Object} - Palette de couleurs pour les routes
 */
async function getRouteColorPalette(req, res) {
  try {
    const { routeIds } = req.body;
    
    if (!routeIds || !Array.isArray(routeIds)) {
      return res.status(400).json({
        status: 'error',
        message: 'Liste d\'IDs d\'itinéraires invalide'
      });
    }
    
    // Récupérer les routes depuis la base de données
    const routes = await Route.find({ _id: { $in: routeIds } });
    
    // Générer la palette de couleurs
    const colorPalette = {};
    
    for (const route of routes) {
      // Extraire les statistiques pertinentes
      const routeStats = {
        avgGradient: route.stats?.avgGradient || 0,
        elevationGain: route.stats?.elevationGain || 0,
        distance: route.stats?.distance || 0,
        maxGradient: route.stats?.maxGradient || 0
      };
      
      // Calculer la difficulté
      const difficulty = routeColorService.calculateRouteDifficulty(routeStats);
      
      // Ajouter à la palette
      colorPalette[route._id.toString()] = {
        difficulty,
        color: routeColorService.getColorForDifficulty(difficulty),
        cssClass: routeColorService.getCssClassForDifficulty(difficulty)
      };
    }
    
    // Répondre avec la palette
    return res.status(200).json({
      status: 'success',
      data: colorPalette
    });
  } catch (error) {
    logger.error('Erreur lors de la génération de la palette de couleurs', {
      error: error.message,
      stack: error.stack
    });
    return errorHandler(error, req, res);
  }
}

module.exports = {
  getColorCodedRoute,
  getRouteColorsCss,
  calculateRouteDifficulty,
  getGradientStyle,
  getRouteColorPalette
};
