/**
 * Contrôleur pour les fonctionnalités d'IA liées à l'entraînement
 * Gère les endpoints pour les recommandations personnalisées et l'analyse de performance
 */

const trainingRecommendationsService = require('../services/training-recommendations.service');
const userService = require('../services/user.service');
const activityService = require('../services/activity.service');
const logger = require('../utils/logger');

/**
 * Génère des recommandations d'entraînement personnalisées
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
async function getPersonalizedRecommendations(req, res) {
  try {
    const { userId } = req.params;
    
    // Récupérer le profil utilisateur
    const userProfile = await userService.getUserProfile(userId);
    
    if (!userProfile) {
      return res.status(404).json({
        success: false,
        error: 'Profil utilisateur non trouvé'
      });
    }
    
    // Récupérer l'historique des activités (30 derniers jours)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activityHistory = await activityService.getUserActivities(
      userId, 
      { startDate: thirtyDaysAgo.toISOString() }
    );
    
    // Générer les recommandations
    const recommendations = await trainingRecommendationsService
      .generateTrainingRecommendations(userId, userProfile, activityHistory);
    
    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    logger.error(`Erreur lors de la génération des recommandations: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Analyse les performances d'une activité spécifique
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
async function analyzeActivityPerformance(req, res) {
  try {
    const { userId, activityId } = req.params;
    
    // Récupérer les données de l'activité
    const activity = await activityService.getActivityById(activityId);
    
    if (!activity) {
      return res.status(404).json({
        success: false,
        error: 'Activité non trouvée'
      });
    }
    
    // Vérifier que l'activité appartient à l'utilisateur
    if (activity.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Non autorisé à accéder à cette activité'
      });
    }
    
    // Générer l'analyse de performance
    const analysis = await trainingRecommendationsService.analyzePerformance(userId, activity);
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    logger.error(`Erreur lors de l'analyse de performance: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

module.exports = {
  getPersonalizedRecommendations,
  analyzeActivityPerformance
};
