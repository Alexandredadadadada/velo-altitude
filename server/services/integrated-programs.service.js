/**
 * Service d'intégration des programmes d'entraînement et de nutrition
 * Ce service combine les fonctionnalités des services de nutrition et d'entraînement
 * pour créer des programmes holistiques adaptés aux objectifs des cyclistes
 */

const mongoose = require('mongoose');
const TrainingProgramsService = require('./training-programs.service');
const NutritionService = require('./nutrition.service');
const UserService = require('./user.service');
const TrainingService = require('./training.service');
const NutritionData = require('../models/nutrition.model');
const CacheService = require('./cache.service');

const cache = CacheService.getCache();
const CACHE_TTL = 3600; // 1 heure

/**
 * Service pour la génération et la gestion des programmes intégrés
 */
class IntegratedProgramsService {
  /**
   * Génère un programme intégré combinant entraînement et nutrition
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} params - Paramètres du programme
   * @returns {Object} Programme intégré
   */
  static async generateIntegratedProgram(userId, params) {
    try {
      const cacheKey = `integrated_program:${userId}:${JSON.stringify(params)}`;
      const cachedProgram = cache.get(cacheKey);
      if (cachedProgram) {
        return cachedProgram;
      }
      
      // Récupérer le profil utilisateur
      const user = await UserService.getUserById(userId);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }
      
      // Vérifier si un profil nutritionnel existe déjà
      let nutritionData = await NutritionData.findOne({ userId });
      if (!nutritionData) {
        // Créer un profil nutritionnel par défaut si nécessaire
        nutritionData = new NutritionData({
          userId,
          preferences: params.nutritionPreferences || {},
          currentGoal: params.goal || 'performance'
        });
        await nutritionData.save();
      }
      
      // Adapter les paramètres pour le programme d'entraînement
      const trainingParams = {
        type: params.type || 'endurance',
        weeklyHours: params.weeklyHours || 8,
        focusAreas: params.focusAreas || ['endurance'],
        experience: params.experience || 'intermediate',
        duration: params.duration || 28, // jours
        includeRecovery: params.includeRecovery !== false,
        includeLongRides: params.includeLongRides !== false
      };
      
      // Générer le programme d'entraînement
      const trainingProgram = await TrainingProgramsService.generateProgram(userId, trainingParams);
      
      // Adapter les paramètres pour le plan nutritionnel
      const nutritionParams = {
        goal: params.goal || 'performance',
        preferences: nutritionData.preferences || params.nutritionPreferences || {},
        trainingPhase: params.trainingPhase || 'base',
        trainingLoad: {
          weeklyHours: trainingParams.weeklyHours,
          intensity: this._determineIntensity(trainingParams.type, trainingParams.focusAreas),
          focusAreas: trainingParams.focusAreas
        }
      };
      
      // Générer le plan nutritionnel
      const nutritionPlan = await NutritionService.generateNutritionPlan({
        _id: userId,
        ...user.profile
      }, nutritionParams);
      
      // Intégrer les recommandations spécifiques aux jours d'entraînement
      const integratedRecommendations = await this._generateIntegratedRecommendations(
        trainingProgram,
        nutritionPlan,
        user.profile
      );
      
      // Construire le programme intégré
      const integratedProgram = {
        id: `int_${Date.now()}_${userId.substring(0, 8)}`,
        name: `Programme intégré - ${trainingProgram.name}`,
        description: `Programme personnalisé combinant entraînement ${trainingProgram.type} et nutrition ${nutritionPlan.type}`,
        training: trainingProgram,
        nutrition: nutritionPlan,
        recommendations: integratedRecommendations,
        createdAt: new Date(),
        userId
      };
      
      // Sauvegarder dans le cache
      cache.set(cacheKey, integratedProgram, CACHE_TTL);
      
      return integratedProgram;
    } catch (error) {
      console.error(`Erreur lors de la génération du programme intégré: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Ajuste un programme intégré en fonction des performances et du feedback
   * @param {string} userId - ID de l'utilisateur
   * @param {string} programId - ID du programme à ajuster
   * @param {Object} adjustmentParams - Paramètres d'ajustement
   * @returns {Object} Programme ajusté
   */
  static async adjustIntegratedProgram(userId, programId, adjustmentParams) {
    try {
      const cacheKey = `integrated_program:${programId}`;
      let program = cache.get(cacheKey);
      
      if (!program) {
        // Dans un système réel, nous récupérerions le programme depuis la base de données
        // Pour cette démonstration, nous générons un nouveau programme
        return await this.generateIntegratedProgram(userId, adjustmentParams);
      }
      
      // Ajuster le programme d'entraînement
      if (adjustmentParams.trainingAdjustments) {
        program.training = await TrainingProgramsService.adjustProgram(
          userId,
          program.training.id,
          adjustmentParams.trainingAdjustments
        );
      }
      
      // Ajuster le plan nutritionnel
      if (adjustmentParams.nutritionAdjustments) {
        // Récupérer le profil utilisateur
        const user = await UserService.getUserById(userId);
        
        const nutritionParams = {
          goal: adjustmentParams.nutritionAdjustments.goal || program.nutrition.type,
          preferences: adjustmentParams.nutritionAdjustments.preferences || {},
          trainingPhase: adjustmentParams.nutritionAdjustments.trainingPhase || 'base'
        };
        
        program.nutrition = await NutritionService.generateNutritionPlan({
          _id: userId,
          ...user.profile
        }, nutritionParams);
      }
      
      // Mettre à jour les recommandations intégrées
      const user = await UserService.getUserById(userId);
      program.recommendations = await this._generateIntegratedRecommendations(
        program.training,
        program.nutrition,
        user.profile
      );
      
      // Mettre à jour dans le cache
      program.updatedAt = new Date();
      cache.set(cacheKey, program, CACHE_TTL);
      
      return program;
    } catch (error) {
      console.error(`Erreur lors de l'ajustement du programme intégré: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Génère des conseils personnalisés basés sur l'intégration des données d'entraînement et de nutrition
   * @param {Object} trainingProgram - Programme d'entraînement
   * @param {Object} nutritionPlan - Plan nutritionnel
   * @param {Object} userProfile - Profil de l'utilisateur
   * @returns {Array} Recommandations intégrées
   */
  static async _generateIntegratedRecommendations(trainingProgram, nutritionPlan, userProfile) {
    // Recommandations générales
    const recommendations = [
      "Adaptez votre hydratation en fonction de l'intensité et de la durée de vos séances",
      "Consommez des glucides avant vos séances de haute intensité pour optimiser vos performances",
      "Privilégiez une récupération active et une alimentation riche en protéines après les séances intenses"
    ];
    
    // Recommandations spécifiques au type d'entraînement
    if (trainingProgram.type === 'endurance') {
      recommendations.push(
        "Augmentez légèrement votre apport en glucides les jours de longues sorties",
        "Consommez des aliments riches en glucides complexes pour soutenir votre endurance",
        "Planifiez une collation riche en glucides toutes les 45-60 minutes pendant vos longues sorties"
      );
    } else if (trainingProgram.type === 'performance') {
      recommendations.push(
        "Synchronisez vos repas riches en protéines avec vos séances d'intensité",
        "Incluez une source de caféine 30-60 minutes avant vos séances de haute intensité",
        "Privilégiez les hydrates de carbone à indice glycémique élevé immédiatement après l'entraînement"
      );
    } else if (trainingProgram.type === 'mountain') {
      recommendations.push(
        "Augmentez votre apport calorique les jours d'entraînement en montagne",
        "Privilégiez les aliments riches en fer pour optimiser le transport d'oxygène",
        "Adaptez votre hydratation aux conditions d'altitude et à l'effort prolongé"
      );
    }
    
    // Recommandations spécifiques basées sur le profil utilisateur
    if (userProfile.weight > 80) {
      recommendations.push(
        "Concentrez-vous sur la qualité nutritionnelle plutôt que la quantité pour optimiser votre ratio poids/puissance"
      );
    }
    
    if (userProfile.age > 40) {
      recommendations.push(
        "Privilégiez les aliments anti-inflammatoires pour favoriser la récupération",
        "Adaptez votre hydratation car les besoins augmentent avec l'âge"
      );
    }
    
    // Recommandations intégrées pour les jours spécifiques
    const workoutDayRecommendations = {};
    
    // Parcourir le programme d'entraînement hebdomadaire
    if (trainingProgram.weeklyWorkouts) {
      Object.entries(trainingProgram.weeklyWorkouts).forEach(([day, workout]) => {
        if (!workout) return;
        
        // Si c'est un jour d'intensité
        if (workout.type === 'intensity' || workout.intensity === 'high') {
          workoutDayRecommendations[day] = [
            `Jour ${day} - Haute intensité: Augmentez les glucides de 10-15% et consommez une collation riche en protéines dans les 30 minutes suivant la séance`
          ];
        } 
        // Si c'est un jour d'endurance
        else if (workout.type === 'endurance' || workout.duration > 120) {
          workoutDayRecommendations[day] = [
            `Jour ${day} - Endurance: Préparez des collations faciles à consommer pendant la sortie et restez bien hydraté tout au long de la séance`
          ];
        }
        // Si c'est un jour de récupération
        else if (workout.type === 'recovery' || workout.intensity === 'low') {
          workoutDayRecommendations[day] = [
            `Jour ${day} - Récupération: Privilégiez les aliments anti-inflammatoires et réduisez légèrement les glucides`
          ];
        }
      });
      
      recommendations.push(
        "Adaptations nutritionnelles spécifiques aux jours d'entraînement :",
        ...Object.values(workoutDayRecommendations).flat()
      );
    }
    
    return recommendations;
  }
  
  /**
   * Détermine l'intensité de l'entraînement en fonction du type et des zones ciblées
   * @param {string} type - Type d'entraînement
   * @param {Array} focusAreas - Zones d'entraînement ciblées
   * @returns {string} Niveau d'intensité
   */
  static _determineIntensity(type, focusAreas) {
    if (type === 'performance' || focusAreas.includes('intensity') || focusAreas.includes('threshold')) {
      return 'high';
    } else if (type === 'endurance' && !focusAreas.includes('recovery')) {
      return 'medium';
    } else if (focusAreas.includes('recovery') || type === 'recovery') {
      return 'low';
    }
    
    // Par défaut
    return 'medium';
  }
  
  /**
   * Récupère un programme intégré par son ID
   * @param {string} userId - ID de l'utilisateur
   * @param {string} programId - ID du programme
   * @returns {Object} Programme intégré
   */
  static async getIntegratedProgramById(userId, programId) {
    try {
      const cacheKey = `integrated_program:${programId}`;
      const program = cache.get(cacheKey);
      
      if (program && program.userId === userId) {
        return program;
      }
      
      // Dans un système complet, nous récupérerions le programme depuis la base de données
      // Pour cette démonstration, nous retournons null si non trouvé dans le cache
      return null;
    } catch (error) {
      console.error(`Erreur lors de la récupération du programme intégré: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Récupère tous les programmes intégrés d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Array} Liste des programmes intégrés
   */
  static async getUserIntegratedPrograms(userId) {
    try {
      // Cette méthode serait idéalement implémentée avec une recherche dans la base de données
      // Pour cette démonstration, nous retournons un tableau vide
      return [];
    } catch (error) {
      console.error(`Erreur lors de la récupération des programmes intégrés: ${error.message}`);
      throw error;
    }
  }
}

module.exports = IntegratedProgramsService;
