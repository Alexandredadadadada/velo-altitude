/**
 * Contrôleur pour les fonctionnalités d'entraînement
 * Expose les APIs pour la gestion des données d'entraînement, le calcul des zones,
 * l'estimation du FTP et la génération de programmes personnalisés
 */

const trainingService = require('../services/training.service');
const trainingZonesService = require('../services/training-zones.service');
const ftpEstimatorService = require('../services/ftp-estimator.service');
const logger = require('../utils/logger');

/**
 * Récupère les zones d'entraînement pour un utilisateur
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const getTrainingZones = async (req, res) => {
  try {
    const { userId } = req.params;
    const { ftp, hrMax, age, weight, gender } = req.query;
    
    // Valider les données requises
    if (!userId) {
      return res.status(400).json({ error: 'ID utilisateur requis' });
    }
    
    // Convertir les paramètres numériques
    const ftpValue = ftp ? parseFloat(ftp) : null;
    const hrMaxValue = hrMax ? parseFloat(hrMax) : null;
    const ageValue = age ? parseFloat(age) : null;
    const weightValue = weight ? parseFloat(weight) : null;
    
    // Vérifier si au moins un des paramètres FTP ou HR Max est fourni
    if (!ftpValue && !hrMaxValue) {
      return res.status(400).json({
        error: 'Au moins un des paramètres FTP ou fréquence cardiaque maximale est requis'
      });
    }
    
    // Récupérer les zones (depuis le cache si disponible)
    const zones = await trainingZonesService.getCachedZones(
      userId,
      ftpValue,
      hrMaxValue,
      ageValue,
      weightValue,
      gender || 'male'
    );
    
    return res.json({
      userId,
      ...zones
    });
  } catch (error) {
    logger.error(`[TrainingController] Erreur lors de la récupération des zones: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Estime le FTP à partir des activités récentes
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const estimateFtpFromActivities = async (req, res) => {
  try {
    const { userId } = req.params;
    const { activityIds } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'ID utilisateur requis' });
    }
    
    if (!activityIds || !Array.isArray(activityIds) || activityIds.length === 0) {
      return res.status(400).json({ error: 'Liste d\'activités requise' });
    }
    
    // Récupérer les activités depuis le service
    const activities = await trainingService.getUserActivitiesByIds(userId, activityIds);
    
    if (!activities || activities.length === 0) {
      return res.status(404).json({ error: 'Aucune activité trouvée' });
    }
    
    // Estimer le FTP
    const ftpEstimation = await ftpEstimatorService.estimateFtpFromActivities(userId, activities);
    
    return res.json(ftpEstimation);
  } catch (error) {
    logger.error(`[TrainingController] Erreur lors de l'estimation du FTP: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Estime le FTP à partir d'un test spécifique
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const estimateFtpFromTest = async (req, res) => {
  try {
    const { userId } = req.params;
    const testData = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'ID utilisateur requis' });
    }
    
    if (!testData || !testData.testType) {
      return res.status(400).json({ error: 'Données de test invalides' });
    }
    
    // Estimer le FTP
    const ftpEstimation = await ftpEstimatorService.estimateFtpFromTest(userId, testData);
    
    return res.json(ftpEstimation);
  } catch (error) {
    logger.error(`[TrainingController] Erreur lors de l'estimation du FTP depuis un test: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Enregistre une nouvelle activité d'entraînement
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const saveActivity = async (req, res) => {
  try {
    const { userId } = req.params;
    const activityData = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'ID utilisateur requis' });
    }
    
    if (!activityData) {
      return res.status(400).json({ error: 'Données d\'activité requises' });
    }
    
    // Enregistrer l'activité
    const savedActivity = await trainingService.saveActivity(userId, activityData);
    
    // Invalider les caches liés à l'utilisateur
    trainingZonesService.invalidateUserCache(userId);
    ftpEstimatorService.invalidateFtpEstimateCache(userId);
    
    return res.status(201).json(savedActivity);
  } catch (error) {
    logger.error(`[TrainingController] Erreur lors de l'enregistrement de l'activité: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Récupère les activités d'un utilisateur
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const getUserActivities = async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate, type, limit, offset } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'ID utilisateur requis' });
    }
    
    // Récupérer les activités
    const options = { startDate, endDate, type, limit, offset };
    const activities = await trainingService.getUserActivities(userId, options);
    
    return res.json({
      userId,
      count: activities.length,
      activities
    });
  } catch (error) {
    logger.error(`[TrainingController] Erreur lors de la récupération des activités: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Génère un programme d'entraînement personnalisé
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const generateTrainingProgram = async (req, res) => {
  try {
    const { userId } = req.params;
    const programParams = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'ID utilisateur requis' });
    }
    
    if (!programParams) {
      return res.status(400).json({ error: 'Paramètres du programme requis' });
    }
    
    // Générer le programme
    const program = await trainingService.generateTrainingProgram(userId, programParams);
    
    return res.json(program);
  } catch (error) {
    logger.error(`[TrainingController] Erreur lors de la génération du programme: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Récupère les programmes d'entraînement d'un utilisateur
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const getUserPrograms = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'ID utilisateur requis' });
    }
    
    // Récupérer les programmes
    const programs = await trainingService.getUserPrograms(userId);
    
    return res.json({
      userId,
      count: programs.length,
      programs
    });
  } catch (error) {
    logger.error(`[TrainingController] Erreur lors de la récupération des programmes: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Analyse les performances d'un utilisateur
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const analyzePerformance = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'ID utilisateur requis' });
    }
    
    // Analyser les performances
    const analysis = await trainingService.analyzePerformance(userId);
    
    return res.json(analysis);
  } catch (error) {
    logger.error(`[TrainingController] Erreur lors de l'analyse des performances: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getTrainingZones,
  estimateFtpFromActivities,
  estimateFtpFromTest,
  saveActivity,
  getUserActivities,
  generateTrainingProgram,
  getUserPrograms,
  analyzePerformance
};
