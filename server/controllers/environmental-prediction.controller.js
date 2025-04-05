/**
 * Contrôleur pour les prédictions environnementales
 * Gère les endpoints API pour les prédictions de conditions et dates optimales
 */

const environmentalPredictionService = require('../services/environmental-prediction.service');
const routeService = require('../services/route.service');
const logger = require('../utils/logger');

/**
 * Prédit les conditions environnementales pour un itinéraire à une date spécifique
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
async function predictRouteConditions(req, res) {
  try {
    const { routeId } = req.params;
    const { date } = req.query;
    
    if (!routeId) {
      return res.status(400).json({ 
        success: false,
        error: 'ID d\'itinéraire requis' 
      });
    }
    
    // Valider et parser la date
    let targetDate;
    if (date) {
      targetDate = new Date(date);
      if (isNaN(targetDate.getTime())) {
        return res.status(400).json({ 
          success: false,
          error: 'Format de date invalide' 
        });
      }
    } else {
      // Par défaut, utiliser la date actuelle + 1 jour
      targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 1);
    }
    
    // Récupérer les points de l'itinéraire
    const route = await routeService.getRouteById(routeId);
    if (!route) {
      return res.status(404).json({ 
        success: false,
        error: 'Itinéraire non trouvé' 
      });
    }
    
    // Générer les prédictions
    const predictions = await environmentalPredictionService.predictRouteConditions(
      route.points,
      targetDate
    );
    
    res.json({
      success: true,
      data: predictions
    });
  } catch (error) {
    logger.error(`Erreur lors de la prédiction des conditions: ${error.message}`);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}

/**
 * Détermine la date optimale pour un itinéraire dans une plage donnée
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
async function findOptimalDate(req, res) {
  try {
    const { routeId } = req.params;
    const { startDate, endDate } = req.query;
    
    if (!routeId) {
      return res.status(400).json({ 
        success: false,
        error: 'ID d\'itinéraire requis' 
      });
    }
    
    // Valider et parser les dates
    let start, end;
    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ 
          success: false,
          error: 'Format de date invalide' 
        });
      }
      
      if (start >= end) {
        return res.status(400).json({ 
          success: false,
          error: 'La date de début doit être antérieure à la date de fin' 
        });
      }
    } else {
      // Par défaut, utiliser les 7 prochains jours
      start = new Date();
      end = new Date();
      end.setDate(end.getDate() + 7);
    }
    
    // Récupérer les points de l'itinéraire
    const route = await routeService.getRouteById(routeId);
    if (!route) {
      return res.status(404).json({ 
        success: false,
        error: 'Itinéraire non trouvé' 
      });
    }
    
    // Générer les prédictions pour chaque jour de la plage
    const dateRange = generateDateRange(start, end);
    const predictions = await Promise.all(
      dateRange.map(date => 
        environmentalPredictionService.predictRouteConditions(route.points, date)
      )
    );
    
    // Trouver la date optimale
    const optimalDate = findBestDate(dateRange, predictions);
    
    res.json({
      success: true,
      data: {
        routeId,
        optimalDate: optimalDate.date.toISOString(),
        score: optimalDate.score,
        allDates: dateRange.map((date, index) => ({
          date: date.toISOString(),
          score: predictions[index].overallPrediction.score,
          category: predictions[index].overallPrediction.category
        }))
      }
    });
  } catch (error) {
    logger.error(`Erreur lors de la recherche de date optimale: ${error.message}`);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}

/**
 * Génère une plage de dates
 * @param {Date} start - Date de début
 * @param {Date} end - Date de fin
 * @returns {Array<Date>} Plage de dates
 */
function generateDateRange(start, end) {
  const dates = [];
  const current = new Date(start);
  
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

/**
 * Trouve la meilleure date en fonction des prédictions
 * @param {Array<Date>} dates - Plage de dates
 * @param {Array<Object>} predictions - Prédictions pour chaque date
 * @returns {Object} Meilleure date avec son score
 */
function findBestDate(dates, predictions) {
  let bestIndex = 0;
  let bestScore = predictions[0].overallPrediction.score;
  
  for (let i = 1; i < predictions.length; i++) {
    const score = predictions[i].overallPrediction.score;
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }
  
  return {
    date: dates[bestIndex],
    score: bestScore,
    prediction: predictions[bestIndex]
  };
}

module.exports = {
  predictRouteConditions,
  findOptimalDate
};
