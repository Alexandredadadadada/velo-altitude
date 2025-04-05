/**
 * Contrôleur pour l'estimation d'effort
 * Gère les endpoints API pour estimer l'effort requis pour un itinéraire
 */

const effortEstimationService = require('../services/effort-estimation.service');
const routeService = require('../services/route.service');
const userService = require('../services/user.service');
const environmentalPredictionService = require('../services/environmental-prediction.service');
const logger = require('../utils/logger');

/**
 * Estime l'effort requis pour un itinéraire à une date spécifique
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
async function estimateEffort(req, res) {
  try {
    const { routeId } = req.params;
    const { date, userId } = req.query;
    
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
      // Par défaut, utiliser la date actuelle
      targetDate = new Date();
    }
    
    // Récupérer l'itinéraire
    const route = await routeService.getRouteById(routeId);
    if (!route) {
      return res.status(404).json({ 
        success: false,
        error: 'Itinéraire non trouvé' 
      });
    }
    
    // Récupérer le profil utilisateur si spécifié
    let riderProfile;
    if (userId) {
      const user = await userService.getUserById(userId);
      if (!user) {
        return res.status(404).json({ 
          success: false,
          error: 'Utilisateur non trouvé' 
        });
      }
      riderProfile = user.profile || {};
    } else {
      // Profil par défaut si non spécifié
      riderProfile = {
        level: 'intermediate',
        id: 'default'
      };
    }
    
    // Récupérer les prédictions environnementales
    const environmentalConditions = await environmentalPredictionService.predictRouteConditions(
      route.points,
      targetDate
    );
    
    // Estimer l'effort
    const effortEstimation = await effortEstimationService.estimateEffort(
      route,
      environmentalConditions,
      riderProfile
    );
    
    res.json({
      success: true,
      data: effortEstimation
    });
  } catch (error) {
    logger.error(`Erreur lors de l'estimation de l'effort: ${error.message}`);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}

/**
 * Estime l'effort pour plusieurs itinéraires
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
async function compareRoutesEffort(req, res) {
  try {
    const { routeIds } = req.body;
    const { date, userId } = req.query;
    
    if (!routeIds || !Array.isArray(routeIds) || routeIds.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Liste d\'IDs d\'itinéraires requise' 
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
      // Par défaut, utiliser la date actuelle
      targetDate = new Date();
    }
    
    // Récupérer le profil utilisateur si spécifié
    let riderProfile;
    if (userId) {
      const user = await userService.getUserById(userId);
      if (!user) {
        return res.status(404).json({ 
          success: false,
          error: 'Utilisateur non trouvé' 
        });
      }
      riderProfile = user.profile || {};
    } else {
      // Profil par défaut si non spécifié
      riderProfile = {
        level: 'intermediate',
        id: 'default'
      };
    }
    
    // Traiter chaque itinéraire
    const estimations = await Promise.all(
      routeIds.map(async (routeId) => {
        try {
          // Récupérer l'itinéraire
          const route = await routeService.getRouteById(routeId);
          if (!route) {
            return {
              routeId,
              error: 'Itinéraire non trouvé'
            };
          }
          
          // Récupérer les prédictions environnementales
          const environmentalConditions = await environmentalPredictionService.predictRouteConditions(
            route.points,
            targetDate
          );
          
          // Estimer l'effort
          const effortEstimation = await effortEstimationService.estimateEffort(
            route,
            environmentalConditions,
            riderProfile
          );
          
          return {
            routeId,
            estimation: effortEstimation
          };
        } catch (error) {
          logger.error(`Erreur pour l'itinéraire ${routeId}: ${error.message}`);
          return {
            routeId,
            error: error.message
          };
        }
      })
    );
    
    // Trier les estimations par score d'effort (du plus facile au plus difficile)
    estimations.sort((a, b) => {
      if (a.error || b.error) return 0;
      return a.estimation.effort.score - b.estimation.effort.score;
    });
    
    res.json({
      success: true,
      data: {
        date: targetDate.toISOString(),
        estimations
      }
    });
  } catch (error) {
    logger.error(`Erreur lors de la comparaison des efforts: ${error.message}`);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}

module.exports = {
  estimateEffort,
  compareRoutesEffort
};
