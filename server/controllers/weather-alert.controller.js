/**
 * Contrôleur pour les alertes météo
 * Gère les endpoints API pour la vérification et la gestion des alertes météo
 */

const weatherAlertService = require('../services/weather-alert.service');
const userService = require('../services/user.service');
const routeService = require('../services/route.service');
const logger = require('../utils/logger');

/**
 * Vérifie les alertes météo pour un itinéraire spécifique
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
async function checkRouteAlerts(req, res) {
  try {
    const { routeId } = req.params;
    const userId = req.user.id; // ID de l'utilisateur authentifié
    
    if (!routeId) {
      return res.status(400).json({ 
        success: false,
        error: 'ID d\'itinéraire requis' 
      });
    }
    
    // Forcer une vérification des alertes
    const alerts = await weatherAlertService.forceCheck(userId, routeId);
    
    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    logger.error(`Erreur lors de la vérification des alertes météo: ${error.message}`);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}

/**
 * Active ou désactive les alertes météo pour un itinéraire favori
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
async function toggleRouteAlerts(req, res) {
  try {
    const { routeId } = req.params;
    const { enabled } = req.body;
    const userId = req.user.id; // ID de l'utilisateur authentifié
    
    if (!routeId) {
      return res.status(400).json({ 
        success: false,
        error: 'ID d\'itinéraire requis' 
      });
    }
    
    if (enabled === undefined) {
      return res.status(400).json({ 
        success: false,
        error: 'Paramètre "enabled" requis' 
      });
    }
    
    // Vérifier si l'itinéraire est dans les favoris de l'utilisateur
    const favoriteRoute = await userService.getUserFavoriteRoute(userId, routeId);
    if (!favoriteRoute) {
      return res.status(404).json({ 
        success: false,
        error: 'Itinéraire non trouvé dans vos favoris' 
      });
    }
    
    // Activer ou désactiver les alertes
    await userService.updateFavoriteRouteAlerts(userId, routeId, !!enabled);
    
    res.json({
      success: true,
      data: {
        routeId,
        alertsEnabled: !!enabled
      }
    });
  } catch (error) {
    logger.error(`Erreur lors de la modification des alertes: ${error.message}`);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}

/**
 * Configure les seuils d'alerte météo
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
async function configureAlertThresholds(req, res) {
  try {
    const { thresholds } = req.body;
    
    if (!thresholds || typeof thresholds !== 'object') {
      return res.status(400).json({ 
        success: false,
        error: 'Configuration de seuils invalide' 
      });
    }
    
    // Vérifier si l'utilisateur a les droits d'administrateur
    if (!req.user.isAdmin) {
      return res.status(403).json({ 
        success: false,
        error: 'Droits d\'administrateur requis' 
      });
    }
    
    // Mettre à jour les seuils
    const updatedThresholds = weatherAlertService.configureThresholds(thresholds);
    
    res.json({
      success: true,
      data: {
        thresholds: updatedThresholds
      }
    });
  } catch (error) {
    logger.error(`Erreur lors de la configuration des seuils: ${error.message}`);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}

/**
 * Récupère l'historique des alertes pour un utilisateur
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
async function getUserAlertHistory(req, res) {
  try {
    const userId = req.params.userId || req.user.id;
    
    // Vérifier si l'utilisateur demande l'historique d'un autre utilisateur
    if (userId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ 
        success: false,
        error: 'Accès non autorisé' 
      });
    }
    
    // Récupérer l'historique des alertes
    const alertHistory = await userService.getUserAlertHistory(userId);
    
    res.json({
      success: true,
      data: alertHistory
    });
  } catch (error) {
    logger.error(`Erreur lors de la récupération de l'historique des alertes: ${error.message}`);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}

module.exports = {
  checkRouteAlerts,
  toggleRouteAlerts,
  configureAlertThresholds,
  getUserAlertHistory
};
