/**
 * Contrôleur de nutrition
 * Gère les requêtes API liées à la nutrition des cyclistes
 */

const logger = require('../utils/logger');
const nutritionService = require('../services/nutrition.service');
const trainingService = require('../services/training.service');
const userService = require('../services/user.service'); // Supposé existant pour obtenir les profils

/**
 * Contrôleur de nutrition
 */
class NutritionController {
  /**
   * Récupère tous les plans nutritionnels
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async getAllNutritionPlans(req, res) {
    try {
      logger.info('[NutritionController] Récupération de tous les plans nutritionnels');
      const plans = await nutritionService.getAllNutritionPlans();
      
      return res.status(200).json({
        success: true,
        data: plans
      });
    } catch (error) {
      logger.error(`[NutritionController] Erreur lors de la récupération des plans: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des plans nutritionnels',
        error: error.message
      });
    }
  }

  /**
   * Récupère un plan nutritionnel par son ID
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async getNutritionPlanById(req, res) {
    try {
      const { planId } = req.params;
      
      if (!planId) {
        return res.status(400).json({
          success: false,
          message: 'ID du plan nutritionnel requis'
        });
      }
      
      logger.info(`[NutritionController] Récupération du plan nutritionnel: ${planId}`);
      const plan = await nutritionService.getNutritionPlanById(planId);
      
      return res.status(200).json({
        success: true,
        data: plan
      });
    } catch (error) {
      logger.error(`[NutritionController] Erreur lors de la récupération du plan: ${error.message}`);
      
      if (error.message.includes('non trouvé')) {
        return res.status(404).json({
          success: false,
          message: 'Plan nutritionnel non trouvé',
          error: error.message
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du plan nutritionnel',
        error: error.message
      });
    }
  }

  /**
   * Calcule les besoins nutritionnels d'un utilisateur
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async calculateNutritionalNeeds(req, res) {
    try {
      const { userId } = req.params;
      const { activityLevel, goal } = req.query;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'ID utilisateur requis'
        });
      }
      
      logger.info(`[NutritionController] Calcul des besoins nutritionnels pour l'utilisateur: ${userId}`);
      
      // Récupérer le profil utilisateur
      let userProfile;
      try {
        userProfile = await userService.getUserProfile(userId);
      } catch (error) {
        logger.error(`[NutritionController] Profil utilisateur non trouvé: ${error.message}`);
        return res.status(404).json({
          success: false,
          message: 'Profil utilisateur non trouvé',
          error: error.message
        });
      }
      
      // Enrichir le profil avec les paramètres optionnels de la requête
      if (activityLevel) {
        userProfile.activityLevel = activityLevel;
      }
      
      if (goal) {
        userProfile.goal = goal;
      }
      
      // Récupérer les données d'entraînement récentes pour estimer la charge
      const recentActivities = await trainingService.getUserActivities(userId, {
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 derniers jours
      });
      
      // Calculer la charge d'entraînement moyenne
      let avgDuration = 0;
      let avgIntensity = 0.7; // Valeur par défaut modérée
      
      if (recentActivities.length > 0) {
        avgDuration = recentActivities.reduce((sum, act) => sum + (act.duration || 0), 0) / recentActivities.length;
        
        // Si disponible, calculer l'intensité moyenne basée sur les zones de fréquence cardiaque ou de puissance
        const activitiesWithIntensity = recentActivities.filter(act => act.intensity || act.averageHeartRatePercentage || act.normalizedPower);
        
        if (activitiesWithIntensity.length > 0) {
          const intensities = activitiesWithIntensity.map(act => {
            if (act.intensity) return act.intensity;
            if (act.averageHeartRatePercentage) return act.averageHeartRatePercentage / 100;
            if (act.normalizedPower && userProfile.ftp) return act.normalizedPower / userProfile.ftp;
            return 0.7; // Valeur par défaut
          });
          
          avgIntensity = intensities.reduce((sum, intensity) => sum + intensity, 0) / intensities.length;
        }
      }
      
      const trainingLoad = {
        duration: avgDuration * 7, // Durée hebdomadaire estimée en minutes
        intensity: avgIntensity
      };
      
      // Calculer les besoins nutritionnels
      const nutritionalNeeds = await nutritionService.calculateNutritionalNeeds(userProfile, trainingLoad);
      
      return res.status(200).json({
        success: true,
        data: {
          userId,
          ...nutritionalNeeds,
          trainingContext: {
            weeklyDuration: Math.round(trainingLoad.duration / 60), // en heures
            averageIntensity: Math.round(trainingLoad.intensity * 100) + '%'
          }
        }
      });
    } catch (error) {
      logger.error(`[NutritionController] Erreur lors du calcul des besoins nutritionnels: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors du calcul des besoins nutritionnels',
        error: error.message
      });
    }
  }

  /**
   * Génère un plan nutritionnel personnalisé pour un utilisateur
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async generatePersonalizedPlan(req, res) {
    try {
      const { userId } = req.params;
      const { trainingPlanId } = req.query;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'ID utilisateur requis'
        });
      }
      
      logger.info(`[NutritionController] Génération d'un plan nutritionnel personnalisé pour l'utilisateur: ${userId}`);
      
      // Récupérer le profil utilisateur
      let userProfile;
      try {
        userProfile = await userService.getUserProfile(userId);
      } catch (error) {
        logger.error(`[NutritionController] Profil utilisateur non trouvé: ${error.message}`);
        return res.status(404).json({
          success: false,
          message: 'Profil utilisateur non trouvé',
          error: error.message
        });
      }
      
      // Si un ID de plan d'entraînement est fourni, le récupérer
      let trainingPlan = null;
      if (trainingPlanId) {
        try {
          const userPrograms = await trainingService.getUserPrograms(userId);
          trainingPlan = userPrograms.find(plan => plan.id === trainingPlanId);
          
          if (!trainingPlan) {
            logger.warn(`[NutritionController] Plan d'entraînement non trouvé: ${trainingPlanId}`);
          }
        } catch (error) {
          logger.warn(`[NutritionController] Erreur lors de la récupération du plan d'entraînement: ${error.message}`);
          // Continuer sans plan d'entraînement
        }
      }
      
      // Générer le plan nutritionnel personnalisé
      const personalizedPlan = await nutritionService.generatePersonalizedNutritionPlan(
        userId,
        userProfile,
        trainingPlan
      );
      
      return res.status(200).json({
        success: true,
        data: personalizedPlan
      });
    } catch (error) {
      logger.error(`[NutritionController] Erreur lors de la génération du plan personnalisé: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la génération du plan nutritionnel personnalisé',
        error: error.message
      });
    }
  }

  /**
   * Génère une stratégie nutritionnelle pour un événement
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async generateEventStrategy(req, res) {
    try {
      const { userId } = req.params;
      const eventDetails = req.body;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'ID utilisateur requis'
        });
      }
      
      if (!eventDetails || !eventDetails.name || !eventDetails.duration) {
        return res.status(400).json({
          success: false,
          message: 'Détails de l\'événement requis (nom et durée minimum)'
        });
      }
      
      logger.info(`[NutritionController] Génération d'une stratégie nutritionnelle pour l'événement: ${eventDetails.name}`);
      
      // Récupérer le profil utilisateur
      let userProfile;
      try {
        userProfile = await userService.getUserProfile(userId);
      } catch (error) {
        logger.error(`[NutritionController] Profil utilisateur non trouvé: ${error.message}`);
        return res.status(404).json({
          success: false,
          message: 'Profil utilisateur non trouvé',
          error: error.message
        });
      }
      
      // Générer la stratégie nutritionnelle
      const strategy = await nutritionService.generateEventNutritionStrategy(eventDetails, userProfile);
      
      return res.status(200).json({
        success: true,
        data: strategy
      });
    } catch (error) {
      logger.error(`[NutritionController] Erreur lors de la génération de la stratégie d'événement: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la génération de la stratégie nutritionnelle',
        error: error.message
      });
    }
  }

  /**
   * Analyse le journal alimentaire d'un utilisateur
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async analyzeNutritionJournal(req, res) {
    try {
      const { userId } = req.params;
      const { foodJournal } = req.body;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'ID utilisateur requis'
        });
      }
      
      if (!foodJournal || !Array.isArray(foodJournal) || foodJournal.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Journal alimentaire requis et doit être un tableau non vide'
        });
      }
      
      logger.info(`[NutritionController] Analyse du journal alimentaire pour l'utilisateur: ${userId}`);
      
      // Analyser le journal alimentaire
      const analysis = await nutritionService.analyzeNutritionJournal(userId, foodJournal);
      
      return res.status(200).json({
        success: true,
        data: analysis
      });
    } catch (error) {
      logger.error(`[NutritionController] Erreur lors de l'analyse du journal alimentaire: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'analyse du journal alimentaire',
        error: error.message
      });
    }
  }
}

module.exports = new NutritionController();
