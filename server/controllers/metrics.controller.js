/**
 * Contrôleur de métriques pour l'API
 * Fournit des endpoints pour surveiller les performances et la fiabilité des services
 */

const metricsService = require('../services/metrics.service');
const logger = require('../utils/logger');

/**
 * Récupère les statistiques d'API globales
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const getApiStats = (req, res) => {
  try {
    const stats = metricsService.getApiStats();
    
    res.json({
      status: 'success',
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`[MetricsController] Erreur lors de la récupération des statistiques d'API: ${error.message}`);
    
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
};

/**
 * Récupère les statistiques détaillées pour une API spécifique
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const getApiDetailedStats = (req, res) => {
  try {
    const { apiName } = req.params;
    
    if (!apiName) {
      return res.status(400).json({
        status: 'error',
        message: 'Nom d\'API requis'
      });
    }
    
    const detailedStats = metricsService.getApiDetailedStats(apiName);
    
    if (detailedStats.error) {
      return res.status(404).json({
        status: 'error',
        message: detailedStats.error
      });
    }
    
    res.json({
      status: 'success',
      data: detailedStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`[MetricsController] Erreur lors de la récupération des statistiques détaillées pour l'API ${req.params.apiName}: ${error.message}`);
    
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération des statistiques détaillées',
      error: error.message
    });
  }
};

/**
 * Récupère les recommandations pour améliorer la fiabilité
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const getReliabilityRecommendations = (req, res) => {
  try {
    const recommendations = metricsService.getReliabilityRecommendations();
    
    res.json({
      status: 'success',
      data: recommendations,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`[MetricsController] Erreur lors de la récupération des recommandations: ${error.message}`);
    
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération des recommandations',
      error: error.message
    });
  }
};

/**
 * Réinitialise les statistiques d'API (réservé aux administrateurs)
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const resetApiStats = (req, res) => {
  try {
    // Cette opération nécessite des droits d'administration
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'Opération réservée aux administrateurs'
      });
    }
    
    const result = metricsService.resetStats();
    
    res.json({
      status: 'success',
      message: 'Statistiques réinitialisées avec succès',
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`[MetricsController] Erreur lors de la réinitialisation des statistiques: ${error.message}`);
    
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la réinitialisation des statistiques',
      error: error.message
    });
  }
};

/**
 * Exporte les statistiques d'API au format CSV (réservé aux administrateurs)
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const exportApiStats = (req, res) => {
  try {
    // Cette opération nécessite des droits d'administration
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'Opération réservée aux administrateurs'
      });
    }
    
    const { format } = req.query;
    
    if (format && format.toLowerCase() === 'csv') {
      // Logique d'export CSV
      const csvData = metricsService.exportStatsToCSV();
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="api-stats-${new Date().toISOString().split('T')[0]}.csv"`);
      
      return res.send(csvData);
    }
    
    // Par défaut, JSON
    const stats = metricsService.getApiStats();
    
    res.json({
      status: 'success',
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`[MetricsController] Erreur lors de l'export des statistiques: ${error.message}`);
    
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de l\'export des statistiques',
      error: error.message
    });
  }
};

module.exports = {
  getApiStats,
  getApiDetailedStats,
  getReliabilityRecommendations,
  resetApiStats,
  exportApiStats
};
