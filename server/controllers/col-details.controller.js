/**
 * Contrôleur pour la gestion des détails des cols
 * @module controllers/col-details.controller
 */

const Col = require('../models/col.model');
const visualizationModel = require('../models/visualization.model');
const routeColorService = require('../services/route-color.service');
const logger = require('../utils/logger');
const { errorHandler } = require('../utils/error-handler');
const cacheMiddleware = require('../middleware/cache.middleware');

/**
 * Récupère les détails complets d'un col
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @returns {Object} - Réponse HTTP avec les détails du col
 */
async function getColDetails(req, res) {
  try {
    const { colId } = req.params;
    
    // Récupérer le col depuis la base de données avec toutes les informations associées
    const col = await Col.findById(colId)
      .populate('routes')
      .populate('pointsOfInterest')
      .populate('weatherStations')
      .populate('segments');
    
    if (!col) {
      return res.status(404).json({
        status: 'error',
        message: 'Col non trouvé'
      });
    }
    
    // Générer le profil d'élévation
    const elevationProfile = await visualizationModel.generateElevationProfile(col);
    
    // Générer le profil de gradient
    const gradientProfile = await visualizationModel.generateGradientProfile(col);
    
    // Calculer la difficulté du col
    const colStats = {
      avgGradient: col.avgGradient || 0,
      elevationGain: col.elevationGain || 0,
      distance: col.length || 0,
      maxGradient: col.maxGradient || 0
    };
    
    const difficulty = routeColorService.calculateRouteDifficulty(colStats);
    const colorInfo = {
      baseColor: routeColorService.getColorForDifficulty(difficulty),
      gradient: routeColorService.getGradientForDifficulty(difficulty),
      cssClass: routeColorService.getCssClassForDifficulty(difficulty)
    };
    
    // Préparer les données 3D si disponibles
    let visualization3D = null;
    if (col.has3DModel) {
      visualization3D = await visualizationModel.generate3DRoutePreview(col);
    }
    
    // Préparer les données de réponse
    const colDetails = {
      ...col.toObject(),
      elevationProfile,
      gradientProfile,
      difficulty,
      colorInfo,
      visualization3D,
      // Ajouter des informations supplémentaires pour l'affichage
      formattedStats: {
        elevationGain: `${col.elevationGain || 0} m`,
        length: `${col.length || 0} km`,
        avgGradient: `${col.avgGradient || 0}%`,
        maxGradient: `${col.maxGradient || 0}%`,
        altitude: `${col.altitude || 0} m`,
        difficultyLabel: getDifficultyLabel(difficulty)
      }
    };
    
    // Répondre avec les détails du col
    return res.status(200).json({
      status: 'success',
      data: colDetails
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des détails du col', {
      error: error.message,
      stack: error.stack
    });
    return errorHandler(error, req, res);
  }
}

/**
 * Récupère les segments d'un col avec code couleur par difficulté
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @returns {Object} - Réponse HTTP avec les segments du col
 */
async function getColSegments(req, res) {
  try {
    const { colId } = req.params;
    
    // Récupérer le col et ses segments
    const col = await Col.findById(colId).populate('segments');
    
    if (!col) {
      return res.status(404).json({
        status: 'error',
        message: 'Col non trouvé'
      });
    }
    
    if (!col.segments || col.segments.length === 0) {
      return res.status(200).json({
        status: 'success',
        data: [],
        message: 'Ce col ne contient pas de segments'
      });
    }
    
    // Préparer les segments avec leur code couleur
    const colorCodedSegments = col.segments.map(segment => {
      const gradient = segment.gradient || 0;
      const style = routeColorService.getGradientSegmentStyle(gradient);
      
      return {
        ...segment.toObject(),
        style,
        colorCode: {
          color: style.color,
          cssClass: style.className
        }
      };
    });
    
    // Trier les segments par position sur le col (du début à la fin)
    colorCodedSegments.sort((a, b) => a.startDistance - b.startDistance);
    
    // Répondre avec les segments
    return res.status(200).json({
      status: 'success',
      data: colorCodedSegments
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des segments du col', {
      error: error.message,
      stack: error.stack
    });
    return errorHandler(error, req, res);
  }
}

/**
 * Récupère les points d'intérêt d'un col
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @returns {Object} - Réponse HTTP avec les points d'intérêt du col
 */
async function getColPointsOfInterest(req, res) {
  try {
    const { colId } = req.params;
    
    // Récupérer le col et ses points d'intérêt
    const col = await Col.findById(colId).populate('pointsOfInterest');
    
    if (!col) {
      return res.status(404).json({
        status: 'error',
        message: 'Col non trouvé'
      });
    }
    
    if (!col.pointsOfInterest || col.pointsOfInterest.length === 0) {
      return res.status(200).json({
        status: 'success',
        data: [],
        message: 'Ce col ne contient pas de points d\'intérêt'
      });
    }
    
    // Répondre avec les points d'intérêt
    return res.status(200).json({
      status: 'success',
      data: col.pointsOfInterest
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des points d\'intérêt du col', {
      error: error.message,
      stack: error.stack
    });
    return errorHandler(error, req, res);
  }
}

/**
 * Récupère les prévisions météo pour un col
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @returns {Object} - Réponse HTTP avec les prévisions météo du col
 */
async function getColWeatherForecast(req, res) {
  try {
    const { colId } = req.params;
    
    // Récupérer le col
    const col = await Col.findById(colId);
    
    if (!col) {
      return res.status(404).json({
        status: 'error',
        message: 'Col non trouvé'
      });
    }
    
    // Récupérer les prévisions météo depuis le service météo
    // Note: Cette partie dépendra de votre implémentation du service météo
    const weatherService = require('../services/weather.service');
    const forecast = await weatherService.getWeatherForecast(col.location.lat, col.location.lon);
    
    // Ajouter des informations spécifiques aux cols
    const colSpecificForecast = {
      ...forecast,
      colSpecific: {
        windDirection: forecast.windDirection,
        windSpeed: forecast.windSpeed,
        temperature: forecast.temperature,
        // Calculer la température au sommet en tenant compte de l'altitude
        summitTemperature: calculateSummitTemperature(forecast.temperature, col.altitude),
        // Évaluer les conditions pour le cyclisme
        cyclingConditions: evaluateCyclingConditions(forecast, col)
      }
    };
    
    // Répondre avec les prévisions météo
    return res.status(200).json({
      status: 'success',
      data: colSpecificForecast
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des prévisions météo du col', {
      error: error.message,
      stack: error.stack
    });
    return errorHandler(error, req, res);
  }
}

/**
 * Récupère les itinéraires qui passent par un col
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @returns {Object} - Réponse HTTP avec les itinéraires du col
 */
async function getColRoutes(req, res) {
  try {
    const { colId } = req.params;
    
    // Récupérer le col et ses itinéraires
    const col = await Col.findById(colId).populate('routes');
    
    if (!col) {
      return res.status(404).json({
        status: 'error',
        message: 'Col non trouvé'
      });
    }
    
    if (!col.routes || col.routes.length === 0) {
      return res.status(200).json({
        status: 'success',
        data: [],
        message: 'Aucun itinéraire ne passe par ce col'
      });
    }
    
    // Préparer les itinéraires avec leur code couleur
    const colorCodedRoutes = await Promise.all(col.routes.map(async route => {
      // Calculer la difficulté de l'itinéraire
      const routeStats = {
        avgGradient: route.stats?.avgGradient || 0,
        elevationGain: route.stats?.elevationGain || 0,
        distance: route.stats?.distance || 0,
        maxGradient: route.stats?.maxGradient || 0
      };
      
      const difficulty = routeColorService.calculateRouteDifficulty(routeStats);
      
      return {
        ...route.toObject(),
        difficulty,
        colorCode: {
          color: routeColorService.getColorForDifficulty(difficulty),
          cssClass: routeColorService.getCssClassForDifficulty(difficulty)
        }
      };
    }));
    
    // Répondre avec les itinéraires
    return res.status(200).json({
      status: 'success',
      data: colorCodedRoutes
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des itinéraires du col', {
      error: error.message,
      stack: error.stack
    });
    return errorHandler(error, req, res);
  }
}

/**
 * Récupère les cols similaires à un col donné
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @returns {Object} - Réponse HTTP avec les cols similaires
 */
async function getSimilarCols(req, res) {
  try {
    const { colId } = req.params;
    
    // Récupérer le col
    const col = await Col.findById(colId);
    
    if (!col) {
      return res.status(404).json({
        status: 'error',
        message: 'Col non trouvé'
      });
    }
    
    // Trouver des cols similaires basés sur des critères comme la difficulté, la région, etc.
    const similarCols = await Col.find({
      _id: { $ne: colId }, // Exclure le col actuel
      $or: [
        // Cols dans la même région
        { region: col.region },
        // Cols avec une difficulté similaire
        { 
          avgGradient: { $gte: col.avgGradient - 1, $lte: col.avgGradient + 1 },
          length: { $gte: col.length * 0.8, $lte: col.length * 1.2 }
        }
      ]
    }).limit(5);
    
    // Préparer les cols similaires avec leur code couleur
    const colorCodedSimilarCols = similarCols.map(similarCol => {
      const colStats = {
        avgGradient: similarCol.avgGradient || 0,
        elevationGain: similarCol.elevationGain || 0,
        distance: similarCol.length || 0,
        maxGradient: similarCol.maxGradient || 0
      };
      
      const difficulty = routeColorService.calculateRouteDifficulty(colStats);
      
      return {
        ...similarCol.toObject(),
        difficulty,
        colorCode: {
          color: routeColorService.getColorForDifficulty(difficulty),
          cssClass: routeColorService.getCssClassForDifficulty(difficulty)
        }
      };
    });
    
    // Répondre avec les cols similaires
    return res.status(200).json({
      status: 'success',
      data: colorCodedSimilarCols
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des cols similaires', {
      error: error.message,
      stack: error.stack
    });
    return errorHandler(error, req, res);
  }
}

/**
 * Obtient le libellé de difficulté à partir du niveau de difficulté
 * @param {String} difficulty - Niveau de difficulté
 * @returns {String} - Libellé de difficulté
 */
function getDifficultyLabel(difficulty) {
  switch (difficulty) {
    case 'easy':
      return 'Facile';
    case 'moderate':
      return 'Modéré';
    case 'difficult':
      return 'Difficile';
    case 'very_difficult':
      return 'Très difficile';
    case 'extreme':
      return 'Extrême';
    case 'challenge':
      return 'Challenge exceptionnel';
    default:
      return 'Non défini';
  }
}

/**
 * Calcule la température au sommet en tenant compte de l'altitude
 * @param {Number} baseTemperature - Température de base en °C
 * @param {Number} altitude - Altitude en mètres
 * @returns {Number} - Température au sommet en °C
 */
function calculateSummitTemperature(baseTemperature, altitude) {
  // La température diminue d'environ 0.6°C tous les 100m d'altitude
  const temperatureDrop = (altitude / 100) * 0.6;
  return Math.round((baseTemperature - temperatureDrop) * 10) / 10;
}

/**
 * Évalue les conditions pour le cyclisme
 * @param {Object} forecast - Prévisions météo
 * @param {Object} col - Informations sur le col
 * @returns {Object} - Évaluation des conditions pour le cyclisme
 */
function evaluateCyclingConditions(forecast, col) {
  // Initialiser l'évaluation
  const evaluation = {
    overall: 'good', // good, moderate, poor, dangerous
    temperature: 'good',
    wind: 'good',
    precipitation: 'good',
    visibility: 'good',
    warnings: []
  };
  
  // Évaluer la température
  const summitTemperature = calculateSummitTemperature(forecast.temperature, col.altitude);
  if (summitTemperature < 5) {
    evaluation.temperature = 'poor';
    evaluation.warnings.push('Températures basses au sommet, prévoir des vêtements chauds.');
  } else if (summitTemperature < 0) {
    evaluation.temperature = 'dangerous';
    evaluation.warnings.push('Risque de gel au sommet, conditions dangereuses.');
  } else if (summitTemperature > 30) {
    evaluation.temperature = 'moderate';
    evaluation.warnings.push('Températures élevées, risque de déshydratation.');
  }
  
  // Évaluer le vent
  if (forecast.windSpeed > 30) {
    evaluation.wind = 'dangerous';
    evaluation.warnings.push('Vents violents, conditions dangereuses pour le cyclisme.');
  } else if (forecast.windSpeed > 20) {
    evaluation.wind = 'poor';
    evaluation.warnings.push('Vents forts, prudence recommandée.');
  } else if (forecast.windSpeed > 15) {
    evaluation.wind = 'moderate';
    evaluation.warnings.push('Vents modérés, peut affecter la performance.');
  }
  
  // Évaluer les précipitations
  if (forecast.precipitation > 5) {
    evaluation.precipitation = 'dangerous';
    evaluation.warnings.push('Fortes précipitations, conditions dangereuses.');
  } else if (forecast.precipitation > 2) {
    evaluation.precipitation = 'poor';
    evaluation.warnings.push('Précipitations modérées, routes potentiellement glissantes.');
  } else if (forecast.precipitation > 0.5) {
    evaluation.precipitation = 'moderate';
    evaluation.warnings.push('Légères précipitations, prévoir un équipement imperméable.');
  }
  
  // Évaluer la visibilité
  if (forecast.visibility < 1000) {
    evaluation.visibility = 'dangerous';
    evaluation.warnings.push('Très faible visibilité, conditions dangereuses.');
  } else if (forecast.visibility < 5000) {
    evaluation.visibility = 'poor';
    evaluation.warnings.push('Visibilité réduite, prudence recommandée.');
  } else if (forecast.visibility < 10000) {
    evaluation.visibility = 'moderate';
    evaluation.warnings.push('Visibilité modérée.');
  }
  
  // Déterminer l'évaluation globale
  if (evaluation.temperature === 'dangerous' || 
      evaluation.wind === 'dangerous' || 
      evaluation.precipitation === 'dangerous' || 
      evaluation.visibility === 'dangerous') {
    evaluation.overall = 'dangerous';
  } else if (evaluation.temperature === 'poor' || 
             evaluation.wind === 'poor' || 
             evaluation.precipitation === 'poor' || 
             evaluation.visibility === 'poor') {
    evaluation.overall = 'poor';
  } else if (evaluation.temperature === 'moderate' || 
             evaluation.wind === 'moderate' || 
             evaluation.precipitation === 'moderate' || 
             evaluation.visibility === 'moderate') {
    evaluation.overall = 'moderate';
  }
  
  return evaluation;
}

module.exports = {
  getColDetails,
  getColSegments,
  getColPointsOfInterest,
  getColWeatherForecast,
  getColRoutes,
  getSimilarCols
};
