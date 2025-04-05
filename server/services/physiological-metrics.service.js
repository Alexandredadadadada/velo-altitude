/**
 * Service de mesures physiologiques
 * Fournit des algorithmes avancés pour l'estimation de FTP et le suivi physiologique
 */
const NodeCache = require('node-cache');
const logger = require('../utils/logger');
const userService = require('./user.service');
const trainingService = require('./training.service');

// Cache avec TTL de 12 heures
const metricsCache = new NodeCache({ stdTTL: 43200 });

/**
 * Service de gestion des métriques physiologiques avancées
 */
class PhysiologicalMetricsService {
  constructor() {
    this.cache = metricsCache;
    this.ftpEstimationModels = {
      heartRateBased: {
        name: 'Modèle basé sur la fréquence cardiaque',
        description: 'Utilise la relation entre FC et puissance pour estimer la FTP',
        accuracy: 0.75,
        requirements: ['heartRateMax', 'heartRateRest', 'recentActivities']
      },
      powerCurveBased: {
        name: 'Modèle basé sur la courbe de puissance',
        description: 'Analyse la courbe de puissance pour estimer la FTP',
        accuracy: 0.85,
        requirements: ['powerData', 'recentActivities']
      },
      rpeBasedModel: {
        name: 'Modèle basé sur la perception d\'effort',
        description: 'Utilise la perception d\'effort pour estimer la FTP',
        accuracy: 0.65,
        requirements: ['rpeData', 'recentActivities']
      },
      multifactorialModel: {
        name: 'Modèle multi-factoriel',
        description: 'Combine plusieurs sources de données pour une estimation optimale',
        accuracy: 0.92,
        requirements: ['powerData', 'heartRateData', 'rpeData', 'recentActivities']
      }
    };
    
    this.fatigueTrackingModels = {
      basic: {
        name: 'Suivi de fatigue basique',
        description: 'Calcule la fatigue basée uniquement sur l\'entraînement',
        factors: ['trainingLoad']
      },
      advanced: {
        name: 'Suivi de fatigue avancé',
        description: 'Intègre des facteurs externes comme le sommeil et le stress',
        factors: ['trainingLoad', 'sleepQuality', 'stressLevel']
      },
      elite: {
        name: 'Suivi de fatigue élite',
        description: 'Modèle complet incluant des marqueurs de récupération et variabilité cardiaque',
        factors: ['trainingLoad', 'sleepQuality', 'stressLevel', 'hrvData', 'nutritionQuality', 'hydrationLevel']
      }
    };
  }

  /**
   * Estime la FTP d'un utilisateur en utilisant un modèle multi-factoriel
   * @param {string} userId - ID de l'utilisateur
   * @param {string} modelType - Type de modèle à utiliser
   * @param {Object} additionalData - Données supplémentaires pour l'estimation
   * @returns {Promise<Object>} - Résultat de l'estimation de FTP
   */
  async estimateFTP(userId, modelType = 'multifactorialModel', additionalData = {}) {
    try {
      logger.info(`[PhysiologicalMetrics] Estimation de la FTP pour l'utilisateur ${userId} avec le modèle ${modelType}`);
      
      // Vérifier si une estimation récente existe dans le cache
      const cacheKey = `ftp_${userId}_${modelType}`;
      const cachedEstimate = this.cache.get(cacheKey);
      if (cachedEstimate && !additionalData.forceRefresh) {
        return cachedEstimate;
      }
      
      // Récupérer les données utilisateur
      const userData = await this._getUserData(userId);
      const selectedModel = this.ftpEstimationModels[modelType] || this.ftpEstimationModels.multifactorialModel;
      
      // Vérifier si nous avons les données requises pour le modèle
      const missingRequirements = this._checkRequirements(selectedModel.requirements, userData, additionalData);
      if (missingRequirements.length > 0) {
        return {
          success: false,
          message: `Données insuffisantes pour l'estimation. Manquant: ${missingRequirements.join(', ')}`,
          missingData: missingRequirements,
          estimatedFTP: null,
          confidence: 0,
          suggestedTest: this._suggestTestType(userData)
        };
      }
      
      // Effectuer l'estimation en fonction du modèle
      const estimate = await this._executeEstimationModel(modelType, userData, additionalData);
      
      // Stocker dans le cache
      this.cache.set(cacheKey, estimate);
      
      return estimate;
    } catch (error) {
      logger.error(`[PhysiologicalMetrics] Erreur lors de l'estimation de la FTP: ${error.message}`);
      throw new Error(`Échec de l'estimation de la FTP: ${error.message}`);
    }
  }

  /**
   * Exécute un modèle d'estimation de FTP spécifique
   * @param {string} modelType - Type de modèle
   * @param {Object} userData - Données utilisateur
   * @param {Object} additionalData - Données supplémentaires
   * @returns {Promise<Object>} - Résultat de l'estimation
   */
  async _executeEstimationModel(modelType, userData, additionalData) {
    switch (modelType) {
      case 'heartRateBased':
        return this._estimateFTPFromHeartRate(userData, additionalData);
      case 'powerCurveBased':
        return this._estimateFTPFromPowerCurve(userData, additionalData);
      case 'rpeBasedModel':
        return this._estimateFTPFromRPE(userData, additionalData);
      case 'multifactorialModel':
      default:
        return this._estimateFTPMultifactorial(userData, additionalData);
    }
  }

  /**
   * Estimation multi-factorielle de la FTP
   * @param {Object} userData - Données utilisateur
   * @param {Object} additionalData - Données supplémentaires
   * @returns {Object} - Résultat de l'estimation
   */
  async _estimateFTPMultifactorial(userData, additionalData) {
    // Récupérer les résultats des différents modèles disponibles
    const estimates = [];
    const weights = {
      powerCurveBased: 0.5,
      heartRateBased: 0.3,
      rpeBasedModel: 0.2
    };
    
    // Obtenir les estimations des différents modèles si les données sont disponibles
    if (this._hasRequiredData('powerCurveBased', userData)) {
      const powerEstimate = await this._estimateFTPFromPowerCurve(userData, additionalData);
      estimates.push({
        value: powerEstimate.estimatedFTP,
        weight: weights.powerCurveBased,
        confidence: powerEstimate.confidence
      });
    }
    
    if (this._hasRequiredData('heartRateBased', userData)) {
      const hrEstimate = await this._estimateFTPFromHeartRate(userData, additionalData);
      estimates.push({
        value: hrEstimate.estimatedFTP,
        weight: weights.heartRateBased,
        confidence: hrEstimate.confidence
      });
    }
    
    if (this._hasRequiredData('rpeBasedModel', userData)) {
      const rpeEstimate = await this._estimateFTPFromRPE(userData, additionalData);
      estimates.push({
        value: rpeEstimate.estimatedFTP,
        weight: weights.rpeBasedModel,
        confidence: rpeEstimate.confidence
      });
    }
    
    // Si aucune estimation n'est disponible
    if (estimates.length === 0) {
      return {
        success: false,
        message: "Aucun modèle d'estimation n'a pu être exécuté avec les données disponibles",
        estimatedFTP: null,
        confidence: 0
      };
    }
    
    // Calculer la FTP pondérée et la confiance globale
    let weightedFTP = 0;
    let totalWeight = 0;
    let avgConfidence = 0;
    
    estimates.forEach(est => {
      weightedFTP += est.value * est.weight;
      totalWeight += est.weight;
      avgConfidence += est.confidence * est.weight;
    });
    
    // Normaliser
    weightedFTP = Math.round(weightedFTP / totalWeight);
    avgConfidence = avgConfidence / totalWeight;
    
    return {
      success: true,
      message: `FTP estimée avec succès en utilisant ${estimates.length} modèles différents`,
      estimatedFTP: weightedFTP,
      confidence: avgConfidence,
      individualEstimates: estimates,
      recommendedTrainingZones: this._calculateTrainingZones(weightedFTP)
    };
  }

  /**
   * Calcule les zones d'entraînement basées sur la FTP
   * @param {number} ftp - FTP estimée
   * @returns {Object} - Zones d'entraînement
   */
  _calculateTrainingZones(ftp) {
    return {
      zone1: { min: Math.round(ftp * 0.55), max: Math.round(ftp * 0.75), name: 'Récupération active' },
      zone2: { min: Math.round(ftp * 0.75), max: Math.round(ftp * 0.85), name: 'Endurance' },
      zone3: { min: Math.round(ftp * 0.85), max: Math.round(ftp * 0.90), name: 'Tempo' },
      zone4: { min: Math.round(ftp * 0.90), max: Math.round(ftp * 1.05), name: 'Seuil' },
      zone5: { min: Math.round(ftp * 1.05), max: Math.round(ftp * 1.20), name: 'VO2max' },
      zone6: { min: Math.round(ftp * 1.20), max: Math.round(ftp * 1.50), name: 'Capacité anaérobie' },
      zone7: { min: Math.round(ftp * 1.50), max: null, name: 'Puissance neuromusculaire' }
    };
  }

  /**
   * Évalue l'état de fatigue d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {string} modelType - Type de modèle de fatigue
   * @param {Object} externalFactors - Facteurs externes (sommeil, stress, etc.)
   * @returns {Promise<Object>} - État de fatigue et recommandations
   */
  async evaluateFatigue(userId, modelType = 'advanced', externalFactors = {}) {
    try {
      logger.info(`[PhysiologicalMetrics] Évaluation de la fatigue pour l'utilisateur ${userId}`);
      
      // Vérifier le cache sauf si des facteurs externes sont fournis
      if (!Object.keys(externalFactors).length) {
        const cacheKey = `fatigue_${userId}`;
        const cachedEvaluation = this.cache.get(cacheKey);
        if (cachedEvaluation) {
          return cachedEvaluation;
        }
      }
      
      // Récupérer les données d'entraînement récentes
      const userData = await this._getUserData(userId);
      const recentActivities = userData.recentActivities || [];
      
      // Calculer la charge d'entraînement
      const trainingLoad = this._calculateTrainingLoad(recentActivities);
      
      // Sélectionner le modèle
      const selectedModel = this.fatigueTrackingModels[modelType] || this.fatigueTrackingModels.advanced;
      
      // Évaluer la fatigue selon le modèle
      let fatigue = {};
      
      if (modelType === 'basic') {
        fatigue = this._evaluateBasicFatigue(trainingLoad);
      } else if (modelType === 'advanced') {
        fatigue = this._evaluateAdvancedFatigue(trainingLoad, externalFactors);
      } else {
        fatigue = this._evaluateEliteFatigue(trainingLoad, externalFactors, userData);
      }
      
      // Ajouter des recommandations
      const recommendations = this._generateRecoveryRecommendations(fatigue);
      
      const result = {
        userId,
        evaluationDate: new Date().toISOString(),
        modelUsed: selectedModel.name,
        fatigueLevel: fatigue.level,
        fatigueScore: fatigue.score,
        readiness: fatigue.readiness,
        components: fatigue.components,
        recommendations,
        nextEvaluationRecommended: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };
      
      // Mettre en cache sauf si des facteurs externes sont fournis
      if (!Object.keys(externalFactors).length) {
        this.cache.set(`fatigue_${userId}`, result);
      }
      
      return result;
    } catch (error) {
      logger.error(`[PhysiologicalMetrics] Erreur lors de l'évaluation de la fatigue: ${error.message}`);
      throw new Error(`Échec de l'évaluation de la fatigue: ${error.message}`);
    }
  }

  /**
   * Génère un modèle prédictif de progression pour un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} params - Paramètres du modèle
   * @returns {Promise<Object>} - Modèle prédictif de progression
   */
  async generateProgressionModel(userId, params = {}) {
    try {
      logger.info(`[PhysiologicalMetrics] Génération d'un modèle prédictif pour l'utilisateur ${userId}`);
      
      // Récupérer les données utilisateur
      const userData = await this._getUserData(userId);
      const historicalData = await this._getHistoricalPerformanceData(userId);
      
      // Paramètres de progression
      const timeframe = params.timeframe || 12; // semaines
      const targetImprovement = params.targetImprovement || 0.1; // 10%
      const currentFTP = userData.ftp || (await this.estimateFTP(userId)).estimatedFTP;
      
      if (!currentFTP) {
        return {
          success: false,
          message: "Impossible de générer un modèle prédictif sans FTP"
        };
      }
      
      // Analyser la progression historique
      const historicalRate = this._analyzeHistoricalProgressionRate(historicalData);
      
      // Identifier les plateaux potentiels
      const plateauPrediction = this._predictPlateaus(historicalData, userData);
      
      // Générer la courbe de progression prédictive
      const progressionCurve = this._generateProgressionCurve(
        currentFTP, 
        timeframe, 
        targetImprovement, 
        historicalRate,
        plateauPrediction
      );
      
      // Générer des recommandations pour surmonter les plateaux prévus
      const plateauStrategies = plateauPrediction.predicted ? 
        this._generatePlateauStrategies(plateauPrediction, userData) : [];
      
      return {
        success: true,
        userId,
        currentFTP,
        targetFTP: Math.round(currentFTP * (1 + targetImprovement)),
        timeframe,
        progressionCurve,
        plateauPrediction,
        plateauStrategies,
        updateFrequency: "weekly",
        confidenceScore: this._calculatePredictionConfidence(historicalData, userData)
      };
    } catch (error) {
      logger.error(`[PhysiologicalMetrics] Erreur lors de la génération du modèle prédictif: ${error.message}`);
      throw new Error(`Échec de la génération du modèle prédictif: ${error.message}`);
    }
  }

  /**
   * Récupère et prépare les données utilisateur pour les analyses
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} - Données utilisateur
   */
  async _getUserData(userId) {
    // Récupérer le profil utilisateur
    const userProfile = await userService.getUserProfile(userId);
    
    // Récupérer les activités récentes
    const recentActivities = await trainingService.getUserRecentActivities(userId, 30); // 30 derniers jours
    
    // Enrichir avec des données physiologiques si disponibles
    let physiologicalData = {};
    try {
      physiologicalData = await userService.getUserPhysiologicalData(userId);
    } catch (error) {
      logger.warn(`[PhysiologicalMetrics] Données physiologiques non disponibles pour l'utilisateur ${userId}`);
    }
    
    return {
      userId,
      profile: userProfile,
      recentActivities,
      ...physiologicalData
    };
  }
  
  // Méthodes additionnelles pour l'estimation de FTP et le suivi de fatigue
  // seraient implémentées ici...
}

// Exporter une instance singleton
const physiologicalMetricsService = new PhysiologicalMetricsService();
module.exports = physiologicalMetricsService;
