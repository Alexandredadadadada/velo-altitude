/**
 * Contrôleur de corrélation des performances
 * Gère les endpoints API pour l'analyse des corrélations entre métriques d'entraînement et performances
 */

const PerformanceCorrelationService = require('../services/performance-correlation.service');
const { handleError } = require('../helpers/error.helper');

/**
 * Contrôleur pour les fonctionnalités d'analyse de corrélation des performances
 */
class PerformanceCorrelationController {
  /**
   * Analyse les corrélations entre différentes variables d'entraînement et les performances
   * @param {*} req - Requête Express
   * @param {*} res - Réponse Express
   */
  async analyzeTrainingPerformanceCorrelations(req, res) {
    try {
      const userId = req.params.userId;
      const options = req.body.options || {};
      
      const correlationData = await PerformanceCorrelationService.analyzeTrainingPerformanceCorrelations(
        userId,
        options
      );
      
      res.json({
        success: true,
        data: correlationData
      });
    } catch (error) {
      handleError(res, error, 'Erreur lors de l\'analyse des corrélations');
    }
  }

  /**
   * Compare les performances de l'utilisateur avec des cyclistes similaires
   * @param {*} req - Requête Express
   * @param {*} res - Réponse Express
   */
  async compareWithSimilarAthletes(req, res) {
    try {
      const userId = req.params.userId;
      const options = req.body.options || {};
      
      const comparisonData = await PerformanceCorrelationService.compareWithSimilarAthletes(
        userId,
        options
      );
      
      res.json({
        success: true,
        data: comparisonData
      });
    } catch (error) {
      handleError(res, error, 'Erreur lors de la comparaison avec des cyclistes similaires');
    }
  }

  /**
   * Génère des visualisations pour les métriques avancées d'entraînement
   * @param {*} req - Requête Express
   * @param {*} res - Réponse Express
   */
  async generateAdvancedMetricsVisualizations(req, res) {
    try {
      const userId = req.params.userId;
      const options = req.query.options ? JSON.parse(req.query.options) : {};
      
      const visualizationData = await PerformanceCorrelationService.generateAdvancedMetricsVisualizations(
        userId,
        options
      );
      
      res.json({
        success: true,
        data: visualizationData
      });
    } catch (error) {
      handleError(res, error, 'Erreur lors de la génération des visualisations');
    }
  }

  /**
   * Prédit les performances futures pour un événement spécifique
   * @param {*} req - Requête Express
   * @param {*} res - Réponse Express
   */
  async predictEventPerformance(req, res) {
    try {
      const userId = req.params.userId;
      const eventId = req.params.eventId;
      const options = req.query.options ? JSON.parse(req.query.options) : {};
      
      const predictionData = await PerformanceCorrelationService.predictEventPerformance(
        userId,
        eventId,
        options
      );
      
      res.json({
        success: true,
        data: predictionData
      });
    } catch (error) {
      handleError(res, error, 'Erreur lors de la prédiction de performance');
    }
  }

  /**
   * Récupère le tableau de bord analytique personnalisé de l'utilisateur
   * @param {*} req - Requête Express
   * @param {*} res - Réponse Express
   */
  async getCustomAnalyticsDashboard(req, res) {
    try {
      const userId = req.params.userId;
      
      // Pour l'instant, c'est une simple fusion de différentes analyses
      // Dans une version complète, cela prendrait en compte les préférences
      // de visualisation sauvegardées par l'utilisateur
      
      // Récupérer les corrélations
      const correlations = await PerformanceCorrelationService.analyzeTrainingPerformanceCorrelations(
        userId,
        { period: 60 } // Derniers 60 jours
      );
      
      // Récupérer les comparaisons
      const comparisons = await PerformanceCorrelationService.compareWithSimilarAthletes(
        userId,
        { count: 3 }
      );
      
      // Récupérer les visualisations
      const visualizations = await PerformanceCorrelationService.generateAdvancedMetricsVisualizations(
        userId
      );
      
      // Fusionner les données pour un tableau de bord complet
      const dashboardData = {
        correlations,
        comparisons,
        visualizations,
        lastUpdated: new Date().toISOString()
      };
      
      res.json({
        success: true,
        data: dashboardData
      });
    } catch (error) {
      handleError(res, error, 'Erreur lors de la récupération du tableau de bord analytique');
    }
  }
}

module.exports = new PerformanceCorrelationController();
