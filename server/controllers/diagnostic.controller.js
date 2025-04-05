/**
 * Contrôleur pour les endpoints de diagnostic et monitoring
 * Expose les données de santé système et les statistiques d'erreurs
 */

const diagnosticService = require('../services/diagnostic.service');
const logger = require('../utils/logger');
const weatherErrorHandler = require('../utils/weather-error-handler');

/**
 * Obtient l'état de santé global du système
 * @route GET /api/diagnostic/health
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
async function getHealth(req, res) {
  try {
    // S'assurer que le service est initialisé
    if (!diagnosticService.initialized) {
      await diagnosticService.initialize();
    }
    
    const healthStatus = await diagnosticService.getHealthStatus();
    res.json(healthStatus);
  } catch (error) {
    logger.error('Erreur lors de la récupération de l\'état de santé', { error });
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération de l\'état de santé',
      error: error.message
    });
  }
}

/**
 * Obtient les statistiques d'erreurs
 * @route GET /api/diagnostic/errors
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
async function getErrorStats(req, res) {
  try {
    // S'assurer que le service est initialisé
    if (!diagnosticService.initialized) {
      await diagnosticService.initialize();
    }
    
    const errorStats = diagnosticService.getErrorStats();
    res.json(errorStats);
  } catch (error) {
    logger.error('Erreur lors de la récupération des statistiques d\'erreurs', { error });
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération des statistiques d\'erreurs',
      error: error.message
    });
  }
}

/**
 * Analyse les modèles d'erreur
 * @route GET /api/diagnostic/errors/patterns
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
async function analyzeErrorPatterns(req, res) {
  try {
    // S'assurer que le service est initialisé
    if (!diagnosticService.initialized) {
      await diagnosticService.initialize();
    }
    
    const options = {
      timeframe: parseInt(req.query.timeframe) || 24,
      minOccurrences: parseInt(req.query.minOccurrences) || 3,
      types: req.query.types ? req.query.types.split(',') : ['error', 'weather', 'api']
    };
    
    const patterns = await diagnosticService.analyzeErrorPatterns(options);
    res.json(patterns);
  } catch (error) {
    logger.error('Erreur lors de l\'analyse des modèles d\'erreurs', { error });
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de l\'analyse des modèles d\'erreurs',
      error: error.message
    });
  }
}

/**
 * Vérifie l'état des services météo
 * @route GET /api/diagnostic/weather
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
async function checkWeatherServices(req, res) {
  try {
    // S'assurer que le service est initialisé
    if (!weatherErrorHandler.initialized) {
      await weatherErrorHandler.initialize();
    }
    
    const services = req.query.services ? req.query.services.split(',') : undefined;
    const healthStatus = await weatherErrorHandler.checkWeatherServicesHealth(services);
    res.json(healthStatus);
  } catch (error) {
    logger.error('Erreur lors de la vérification des services météo', { error });
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la vérification des services météo',
      error: error.message
    });
  }
}

/**
 * Effectue un diagnostic des logs
 * @route GET /api/diagnostic/logs
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
async function diagnoseLogs(req, res) {
  try {
    // S'assurer que le service est initialisé
    if (!diagnosticService.initialized) {
      await diagnosticService.initialize();
    }
    
    const logDiagnostics = await diagnosticService.diagnoseLogs();
    res.json(logDiagnostics);
  } catch (error) {
    logger.error('Erreur lors du diagnostic des logs', { error });
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors du diagnostic des logs',
      error: error.message
    });
  }
}

/**
 * Réinitialise les statistiques d'erreur
 * @route POST /api/diagnostic/errors/reset
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
async function resetErrorStats(req, res) {
  try {
    // S'assurer que le service est initialisé
    if (!weatherErrorHandler.initialized) {
      await weatherErrorHandler.initialize();
    }
    
    weatherErrorHandler.resetErrorStats();
    res.json({
      status: 'success',
      message: 'Statistiques d\'erreurs réinitialisées avec succès',
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Erreur lors de la réinitialisation des statistiques d\'erreurs', { error });
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la réinitialisation des statistiques d\'erreurs',
      error: error.message
    });
  }
}

module.exports = {
  getHealth,
  getErrorStats,
  analyzeErrorPatterns,
  checkWeatherServices,
  diagnoseLogs,
  resetErrorStats
};
