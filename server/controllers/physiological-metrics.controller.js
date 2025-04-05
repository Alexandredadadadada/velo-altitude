/**
 * Contrôleur pour les métriques physiologiques avancées
 */
const physiologicalMetricsService = require('../services/physiological-metrics.service');
const { handleError } = require('../utils/error-handler');
const logger = require('../utils/logger');
const { validateRequiredFields } = require('../utils/validation');

/**
 * Estime la FTP d'un utilisateur avec différents modèles
 * @route POST /api/physiological-metrics/estimate-ftp
 */
exports.estimateFTP = async (req, res) => {
  try {
    const { userId } = req.user;
    const { modelType = 'multifactorialModel', additionalData = {} } = req.body;
    
    logger.info(`[PhysiologicalController] Demande d'estimation FTP pour l'utilisateur ${userId}`);
    
    const estimate = await physiologicalMetricsService.estimateFTP(userId, modelType, additionalData);
    
    res.status(200).json(estimate);
  } catch (error) {
    handleError(res, error, 'Échec de l\'estimation de la FTP');
  }
};

/**
 * Récupère les zones d'entraînement basées sur une FTP donnée
 * @route GET /api/physiological-metrics/training-zones/:ftp
 */
exports.getTrainingZones = async (req, res) => {
  try {
    const ftp = parseInt(req.params.ftp, 10);
    
    if (!ftp || isNaN(ftp) || ftp <= 0) {
      return res.status(400).json({ message: 'FTP invalide' });
    }
    
    logger.info(`[PhysiologicalController] Calcul des zones d'entraînement pour FTP=${ftp}`);
    
    // La méthode de calcul des zones est privée dans le service, donc on refait le calcul ici
    const trainingZones = {
      zone1: { min: Math.round(ftp * 0.55), max: Math.round(ftp * 0.75), name: 'Récupération active' },
      zone2: { min: Math.round(ftp * 0.75), max: Math.round(ftp * 0.85), name: 'Endurance' },
      zone3: { min: Math.round(ftp * 0.85), max: Math.round(ftp * 0.90), name: 'Tempo' },
      zone4: { min: Math.round(ftp * 0.90), max: Math.round(ftp * 1.05), name: 'Seuil' },
      zone5: { min: Math.round(ftp * 1.05), max: Math.round(ftp * 1.20), name: 'VO2max' },
      zone6: { min: Math.round(ftp * 1.20), max: Math.round(ftp * 1.50), name: 'Capacité anaérobie' },
      zone7: { min: Math.round(ftp * 1.50), max: null, name: 'Puissance neuromusculaire' }
    };
    
    res.status(200).json({ ftp, trainingZones });
  } catch (error) {
    handleError(res, error, 'Échec du calcul des zones d\'entraînement');
  }
};

/**
 * Évalue l'état de fatigue d'un utilisateur
 * @route POST /api/physiological-metrics/evaluate-fatigue
 */
exports.evaluateFatigue = async (req, res) => {
  try {
    const { userId } = req.user;
    const { modelType = 'advanced', externalFactors = {} } = req.body;
    
    logger.info(`[PhysiologicalController] Demande d'évaluation de fatigue pour l'utilisateur ${userId}`);
    
    const fatigueEvaluation = await physiologicalMetricsService.evaluateFatigue(userId, modelType, externalFactors);
    
    res.status(200).json(fatigueEvaluation);
  } catch (error) {
    handleError(res, error, 'Échec de l\'évaluation de la fatigue');
  }
};

/**
 * Génère un modèle prédictif de progression
 * @route POST /api/physiological-metrics/progression-model
 */
exports.generateProgressionModel = async (req, res) => {
  try {
    const { userId } = req.user;
    const params = req.body;
    
    logger.info(`[PhysiologicalController] Génération de modèle prédictif pour l'utilisateur ${userId}`);
    
    const progressionModel = await physiologicalMetricsService.generateProgressionModel(userId, params);
    
    res.status(200).json(progressionModel);
  } catch (error) {
    handleError(res, error, 'Échec de la génération du modèle prédictif');
  }
};

/**
 * Enregistre des données physiologiques supplémentaires
 * @route POST /api/physiological-metrics/record-data
 */
exports.recordPhysiologicalData = async (req, res) => {
  try {
    const { userId } = req.user;
    const { dataType, values } = req.body;
    
    // Validation des champs requis
    validateRequiredFields(req.body, ['dataType', 'values']);
    
    logger.info(`[PhysiologicalController] Enregistrement de données ${dataType} pour l'utilisateur ${userId}`);
    
    // Service à implémenter pour sauvegarder les données
    const savedData = await physiologicalMetricsService.recordPhysiologicalData(userId, dataType, values);
    
    res.status(201).json(savedData);
  } catch (error) {
    handleError(res, error, 'Échec de l\'enregistrement des données physiologiques');
  }
};

/**
 * Récupère les modèles d'estimation de FTP disponibles
 * @route GET /api/physiological-metrics/ftp-models
 */
exports.getFTPEstimationModels = async (req, res) => {
  try {
    logger.info('[PhysiologicalController] Récupération des modèles d\'estimation FTP');
    
    const ftpModels = physiologicalMetricsService.ftpEstimationModels || {};
    
    res.status(200).json(Object.entries(ftpModels).map(([key, model]) => ({
      id: key,
      name: model.name,
      description: model.description,
      accuracy: model.accuracy,
      requirements: model.requirements
    })));
  } catch (error) {
    handleError(res, error, 'Échec de la récupération des modèles d\'estimation FTP');
  }
};

/**
 * Récupère les modèles de suivi de fatigue disponibles
 * @route GET /api/physiological-metrics/fatigue-models
 */
exports.getFatigueTrackingModels = async (req, res) => {
  try {
    logger.info('[PhysiologicalController] Récupération des modèles de suivi de fatigue');
    
    const fatigueModels = physiologicalMetricsService.fatigueTrackingModels || {};
    
    res.status(200).json(Object.entries(fatigueModels).map(([key, model]) => ({
      id: key,
      name: model.name,
      description: model.description,
      factors: model.factors
    })));
  } catch (error) {
    handleError(res, error, 'Échec de la récupération des modèles de suivi de fatigue');
  }
};
