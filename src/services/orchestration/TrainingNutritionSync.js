/**
 * Service d'orchestration pour synchroniser les données entre les modules
 * d'entraînement et de nutrition pour une expérience utilisateur intégrée
 */

import nutritionService from '../nutritionService';
import trainingService from '../trainingService';
import { ENV } from '../../config/environment';

export class TrainingNutritionSync {
  constructor() {
    this.syncPoints = {
      PRE_WORKOUT: 'pre_workout',
      DURING_WORKOUT: 'during_workout',
      POST_WORKOUT: 'post_workout'
    };
  }

  /**
   * Synchronise un entraînement spécifique avec les recommandations nutritionnelles
   * @param {string} workoutId - ID de l'entraînement
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Résultat de la synchronisation avec recommandations
   */
  async syncWorkoutWithNutrition(workoutId, userId) {
    try {
      // Récupérer les détails de l'entraînement
      const workout = await trainingService.getWorkoutById(workoutId);
      if (!workout) {
        throw new Error('Entraînement non trouvé');
      }

      // Récupérer le profil nutritionnel de l'utilisateur
      const nutritionProfile = await nutritionService.getUserNutritionData(userId);
      if (!nutritionProfile) {
        throw new Error('Profil nutritionnel non trouvé');
      }

      // Calculer les besoins nutritionnels spécifiques à cet entraînement
      const workoutIntensity = this._calculateWorkoutIntensity(workout);
      const workoutDuration = workout.plannedDuration || 0;
      const caloriesBurned = workout.estimatedCalories || this._estimateCaloriesBurned(workout, nutritionProfile);

      // Générer des recommandations spécifiques
      const recommendations = {
        pre: this._generatePreWorkoutRecommendations(workout, nutritionProfile, workoutIntensity),
        during: this._generateDuringWorkoutRecommendations(workout, nutritionProfile, workoutDuration),
        post: this._generatePostWorkoutRecommendations(workout, nutritionProfile, caloriesBurned)
      };

      // Enregistrer la synchronisation dans la base de données
      const syncResult = {
        userId,
        workoutId,
        timestamp: new Date(),
        recommendations,
        nutritionalNeeds: {
          preWorkoutCalories: recommendations.pre.calories,
          duringWorkoutCalories: recommendations.during.calories,
          postWorkoutCalories: recommendations.post.calories,
          hydration: recommendations.pre.hydration + recommendations.during.hydration + recommendations.post.hydration,
          proteinNeeds: recommendations.post.protein
        }
      };

      return syncResult;
    } catch (error) {
      console.error('Erreur lors de la synchronisation workout-nutrition:', error);
      throw error;
    }
  }

  /**
   * Met à jour le plan nutritionnel en fonction du plan d'entraînement
   * @param {Object} trainingPlan - Plan d'entraînement complet
   * @returns {Promise<Object>} Plan nutritionnel mis à jour
   */
  async updateNutritionPlan(trainingPlan) {
    try {
      if (!trainingPlan || !trainingPlan.userId) {
        throw new Error('Plan d\'entraînement invalide');
      }

      const { userId } = trainingPlan;

      // Récupérer le profil nutritionnel actuel
      const currentNutritionProfile = await nutritionService.getUserNutritionData(userId);
      if (!currentNutritionProfile) {
        throw new Error('Profil nutritionnel non trouvé');
      }

      // Analyser la charge d'entraînement pour la période
      const trainingLoad = this._calculateTrainingLoad(trainingPlan);
      
      // Calculer les besoins caloriques quotidiens en fonction de la charge d'entraînement
      const baseCalories = currentNutritionProfile.baseCalories || 2000;
      const dailyCalories = this._calculateDailyCalorieNeeds(baseCalories, trainingLoad);
      
      // Ajuster la répartition des macronutriments en fonction du type d'entraînement
      const macroDistribution = this._calculateMacroDistribution(trainingPlan, currentNutritionProfile);
      
      // Générer un plan de repas basé sur les nouveaux besoins
      const mealPlanParams = {
        userId,
        dailyCalories,
        macroDistribution,
        trainingSchedule: trainingPlan.schedule,
        nutritionGoals: currentNutritionProfile.goals || { type: 'performance' }
      };
      
      const updatedMealPlan = await nutritionService.generateMealPlan(mealPlanParams);
      
      // Mettre à jour les besoins d'hydratation
      const hydrationNeeds = this._calculateHydrationNeeds(trainingPlan, currentNutritionProfile);
      
      // Construire le plan nutritionnel mis à jour
      const updatedNutritionPlan = {
        ...currentNutritionProfile,
        dailyCalories,
        macroDistribution,
        hydrationNeeds,
        mealPlan: updatedMealPlan,
        lastSync: new Date(),
        trainingPlanId: trainingPlan.id
      };
      
      // Utiliser la synchronisation du service nutrition
      const syncResult = await nutritionService.syncWithTrainingPlan({
        userId,
        trainingPlanId: trainingPlan.id,
        adaptationType: 'moderate',
        nutritionPlan: updatedNutritionPlan
      });
      
      return {
        success: true,
        nutritionPlan: updatedNutritionPlan,
        syncDetails: syncResult
      };
    } catch (error) {
      console.error('Erreur lors de la mise à jour du plan nutritionnel:', error);
      throw error;
    }
  }

  /**
   * Calcule l'intensité d'un entraînement sur une échelle de 1 à 10
   * @private
   * @param {Object} workout - Détails de l'entraînement
   * @returns {number} Intensité de l'entraînement
   */
  _calculateWorkoutIntensity(workout) {
    if (!workout) return 5; // Intensité moyenne par défaut
    
    // Utiliser le TSS si disponible
    if (workout.tss) {
      if (workout.tss < 100) return 3; // Faible
      if (workout.tss < 200) return 6; // Modéré
      return 9; // Élevé
    }
    
    // Sinon utiliser d'autres métriques
    const hasIntervals = workout.segments && workout.segments.some(s => s.type === 'interval');
    const longDuration = (workout.plannedDuration || 0) > 120; // Plus de 2 heures
    
    if (hasIntervals) return longDuration ? 9 : 7;
    return longDuration ? 6 : 4;
  }

  /**
   * Estime les calories brûlées lors d'un entraînement
   * @private
   * @param {Object} workout - Détails de l'entraînement
   * @param {Object} nutritionProfile - Profil nutritionnel
   * @returns {number} Calories estimées
   */
  _estimateCaloriesBurned(workout, nutritionProfile) {
    const duration = workout.plannedDuration || 0; // en minutes
    const weight = nutritionProfile.metrics?.weight || 70; // en kg
    const intensity = this._calculateWorkoutIntensity(workout);
    
    // Formule simplifiée basée sur le MET (Metabolic Equivalent of Task)
    const met = 4 + (intensity * 0.7); // MET entre 4 et 11 selon intensité
    const caloriesPerMinute = (met * 3.5 * weight) / 200;
    
    return Math.round(caloriesPerMinute * duration);
  }

  /**
   * Génère des recommandations nutritionnelles pré-entraînement
   * @private
   * @param {Object} workout - Détails de l'entraînement
   * @param {Object} nutritionProfile - Profil nutritionnel
   * @param {number} intensity - Intensité de l'entraînement (1-10)
   * @returns {Object} Recommandations pré-entraînement
   */
  _generatePreWorkoutRecommendations(workout, nutritionProfile, intensity) {
    const isHighIntensity = intensity > 7;
    const isLongDuration = (workout.plannedDuration || 0) > 90; // Plus de 1h30
    
    // Calculer les besoins caloriques
    const baseCalories = isHighIntensity ? 400 : 300;
    const durationFactor = isLongDuration ? 1.3 : 1;
    const calories = Math.round(baseCalories * durationFactor);
    
    // Répartition des macros
    const carbPercentage = isHighIntensity ? 0.7 : 0.6;
    const proteinPercentage = 0.2;
    const fatPercentage = 1 - carbPercentage - proteinPercentage;
    
    // Calculer les grammes
    const carbs = Math.round((calories * carbPercentage) / 4); // 4 calories par gramme
    const protein = Math.round((calories * proteinPercentage) / 4);
    const fat = Math.round((calories * fatPercentage) / 9); // 9 calories par gramme
    
    // Calculer l'hydratation
    const baseHydration = 500; // 500ml de base
    const hydration = isLongDuration ? baseHydration * 1.5 : baseHydration;
    
    // Suggestions alimentaires
    const foodSuggestions = [];
    if (isHighIntensity) {
      foodSuggestions.push('Une banane avec du beurre d\'amande');
      foodSuggestions.push('Un bol de porridge avec du miel');
      foodSuggestions.push('Des dattes et une poignée d\'amandes');
    } else {
      foodSuggestions.push('Un yaourt avec des fruits frais');
      foodSuggestions.push('Une tranche de pain complet avec du fromage blanc');
      foodSuggestions.push('Une compote avec des biscuits secs');
    }
    
    return {
      timing: '1-2 heures avant l\'entraînement',
      calories,
      carbs,
      protein,
      fat,
      hydration,
      foodSuggestions,
      tips: [
        isHighIntensity 
          ? 'Privilégiez les glucides à index glycémique moyen à élevé'
          : 'Privilégiez les glucides à index glycémique bas à moyen',
        'Limitez les aliments riches en fibres pour éviter l\'inconfort digestif',
        'Assurez-vous d\'être bien hydraté avant de commencer l\'entraînement'
      ]
    };
  }

  /**
   * Génère des recommandations nutritionnelles pendant l'entraînement
   * @private
   * @param {Object} workout - Détails de l'entraînement
   * @param {Object} nutritionProfile - Profil nutritionnel
   * @param {number} duration - Durée de l'entraînement en minutes
   * @returns {Object} Recommandations pendant l'entraînement
   */
  _generateDuringWorkoutRecommendations(workout, nutritionProfile, duration) {
    // Pas besoin de nutrition pendant les entraînements courts
    if (duration <= 60) {
      return {
        calories: 0,
        carbs: 0,
        protein: 0,
        fat: 0,
        hydration: duration * 10, // 10ml par minute
        foodSuggestions: [],
        tips: ['Hydratation uniquement pour les entraînements de moins d\'une heure']
      };
    }
    
    // Pour les entraînements plus longs
    const hourlyCarbs = duration > 150 ? 60 : 40; // g par heure
    const totalDurationHours = duration / 60;
    const totalCarbs = Math.round(hourlyCarbs * totalDurationHours);
    const calories = totalCarbs * 4; // 4 calories par gramme de glucides
    
    // Hydratation: entre 500-1000ml par heure selon intensité et température
    const hourlyHydration = 750; // ml par heure (moyenne)
    const totalHydration = Math.round(hourlyHydration * totalDurationHours);
    
    let foodSuggestions = [];
    if (duration > 180) { // Plus de 3 heures
      foodSuggestions = [
        'Gel énergétique (25g de glucides) toutes les 45 minutes',
        'Barre énergétique à haute teneur en glucides',
        'Boisson isotonique (60g de glucides par litre)'
      ];
    } else { // Entre 1h et 3h
      foodSuggestions = [
        'Gel énergétique (25g de glucides) si nécessaire',
        'Boisson isotonique (30-60g de glucides par litre)',
        'Banane ou fruits secs pour les sorties longues'
      ];
    }
    
    return {
      timing: 'Pendant l\'entraînement',
      calories,
      carbs: totalCarbs,
      protein: 0, // Généralement pas besoin de protéines pendant l'effort
      fat: 0, // Éviter les graisses pendant l'effort
      hydration: totalHydration,
      foodSuggestions,
      tips: [
        'Commencez à consommer des glucides dès la première heure pour les efforts longs',
        'Hydratez-vous régulièrement, ne pas attendre d\'avoir soif',
        'Évitez les nouveaux produits le jour d\'une compétition ou d\'une sortie importante'
      ]
    };
  }

  /**
   * Génère des recommandations nutritionnelles post-entraînement
   * @private
   * @param {Object} workout - Détails de l'entraînement
   * @param {Object} nutritionProfile - Profil nutritionnel
   * @param {number} caloriesBurned - Calories brûlées pendant l'entraînement
   * @returns {Object} Recommandations post-entraînement
   */
  _generatePostWorkoutRecommendations(workout, nutritionProfile, caloriesBurned) {
    const isHighIntensity = this._calculateWorkoutIntensity(workout) > 7;
    const weight = nutritionProfile.metrics?.weight || 70; // en kg
    
    // Besoins en protéines basés sur le poids et l'intensité
    const proteinPerKg = isHighIntensity ? 0.3 : 0.2; // g/kg
    const proteinNeeds = Math.round(weight * proteinPerKg);
    
    // Besoins en glucides basés sur les calories brûlées
    const carbsPercentage = 0.6; // 60% des calories de récupération sous forme de glucides
    const totalCarbsCal = caloriesBurned * carbsPercentage;
    const carbsNeeds = Math.round(totalCarbsCal / 4); // 4 calories par gramme
    
    // Besoins caloriques totaux pour la récupération (environ 70% des calories brûlées)
    const recoveryCalories = Math.round(caloriesBurned * 0.7);
    
    // Calculer les lipides pour compléter les besoins caloriques
    const proteinCal = proteinNeeds * 4; // 4 calories par gramme
    const fatCal = recoveryCalories - totalCarbsCal - proteinCal;
    const fatNeeds = Math.max(0, Math.round(fatCal / 9)); // 9 calories par gramme
    
    // Hydratation: 150% des pertes (estimation basée sur les calories)
    const estimatedSweatLoss = Math.round(caloriesBurned / 10); // ml, estimation très simplifiée
    const hydrationNeeds = Math.round(estimatedSweatLoss * 1.5);
    
    // Suggestions alimentaires
    const foodSuggestions = [
      'Smoothie protéiné avec banane et lait',
      'Yaourt grec avec fruits et miel',
      'Omelette avec légumes et une tranche de pain complet',
      'Wrap au poulet avec légumes et houmous'
    ];
    
    if (isHighIntensity) {
      foodSuggestions.push('Boisson de récupération commerciale (4:1 glucides/protéines)');
      foodSuggestions.push('Lait chocolaté (excellent ratio glucides/protéines)');
    }
    
    return {
      timing: 'Dans les 30-60 minutes après l\'entraînement',
      calories: recoveryCalories,
      carbs: carbsNeeds,
      protein: proteinNeeds,
      fat: fatNeeds,
      hydration: hydrationNeeds,
      foodSuggestions,
      tips: [
        'La fenêtre de récupération optimale est dans les 30-60 minutes après l\'effort',
        'Privilégiez une combinaison de glucides et protéines pour optimiser la récupération',
        'Réhydratez-vous progressivement plutôt que de boire de grandes quantités d\'un coup'
      ]
    };
  }

  /**
   * Calcule la charge d'entraînement globale du plan
   * @private
   * @param {Object} trainingPlan - Plan d'entraînement
   * @returns {number} Score de charge d'entraînement
   */
  _calculateTrainingLoad(trainingPlan) {
    if (!trainingPlan.workouts || !trainingPlan.workouts.length) {
      return 0;
    }
    
    // Calculer le TSS total ou une estimation
    return trainingPlan.workouts.reduce((total, workout) => {
      // Utiliser le TSS si disponible
      if (workout.tss) {
        return total + workout.tss;
      }
      
      // Sinon faire une estimation basée sur la durée et l'intensité
      const duration = workout.plannedDuration || 0;
      const intensity = this._calculateWorkoutIntensity(workout);
      const estimatedTSS = (duration * intensity) / 10;
      
      return total + estimatedTSS;
    }, 0);
  }

  /**
   * Calcule les besoins caloriques quotidiens en fonction de la charge d'entraînement
   * @private
   * @param {number} baseCalories - Calories de base (métabolisme)
   * @param {number} trainingLoad - Charge d'entraînement
   * @returns {number} Besoins caloriques quotidiens
   */
  _calculateDailyCalorieNeeds(baseCalories, trainingLoad) {
    // Ajuster selon la charge hebdomadaire
    let trainingFactor;
    
    if (trainingLoad < 200) {
      trainingFactor = 1.3; // Charge légère
    } else if (trainingLoad < 400) {
      trainingFactor = 1.5; // Charge modérée
    } else if (trainingLoad < 600) {
      trainingFactor = 1.7; // Charge élevée
    } else {
      trainingFactor = 1.9; // Charge très élevée
    }
    
    return Math.round(baseCalories * trainingFactor);
  }

  /**
   * Calcule la répartition des macronutriments en fonction du type d'entraînement
   * @private
   * @param {Object} trainingPlan - Plan d'entraînement
   * @param {Object} nutritionProfile - Profil nutritionnel
   * @returns {Object} Répartition des macronutriments
   */
  _calculateMacroDistribution(trainingPlan, nutritionProfile) {
    // Déterminer le type d'entraînement prédominant
    const hasHighIntensity = trainingPlan.workouts && 
      trainingPlan.workouts.some(w => this._calculateWorkoutIntensity(w) > 7);
    
    const hasLongEndurance = trainingPlan.workouts && 
      trainingPlan.workouts.some(w => (w.plannedDuration || 0) > 180);
    
    // Définir les ratios de base selon le profil actuel ou valeurs par défaut
    const currentMacros = nutritionProfile.macroDistribution || {
      carbs: 50,
      protein: 20,
      fat: 30
    };
    
    let macroDistribution = { ...currentMacros };
    
    // Ajuster selon le type d'entraînement
    if (hasHighIntensity && hasLongEndurance) {
      // Mix haute intensité et endurance
      macroDistribution = {
        carbs: 60,
        protein: 20,
        fat: 20
      };
    } else if (hasHighIntensity) {
      // Haute intensité prédominante
      macroDistribution = {
        carbs: 55,
        protein: 25,
        fat: 20
      };
    } else if (hasLongEndurance) {
      // Endurance longue prédominante
      macroDistribution = {
        carbs: 65,
        protein: 15,
        fat: 20
      };
    }
    
    // Personnaliser selon les objectifs de l'utilisateur
    if (nutritionProfile.goals) {
      if (nutritionProfile.goals.type === 'weightLoss') {
        // Réduire légèrement les glucides pour la perte de poids
        macroDistribution.carbs = Math.max(40, macroDistribution.carbs - 10);
        macroDistribution.protein = Math.min(30, macroDistribution.protein + 5);
        macroDistribution.fat = 100 - macroDistribution.carbs - macroDistribution.protein;
      } else if (nutritionProfile.goals.type === 'recovery') {
        // Augmenter les protéines pour la récupération
        macroDistribution.protein = Math.min(30, macroDistribution.protein + 5);
        macroDistribution.fat = Math.min(35, macroDistribution.fat + 5);
        macroDistribution.carbs = 100 - macroDistribution.protein - macroDistribution.fat;
      }
    }
    
    return macroDistribution;
  }

  /**
   * Calcule les besoins en hydratation en fonction du plan d'entraînement
   * @private
   * @param {Object} trainingPlan - Plan d'entraînement
   * @param {Object} nutritionProfile - Profil nutritionnel
   * @returns {Object} Plan d'hydratation
   */
  _calculateHydrationNeeds(trainingPlan, nutritionProfile) {
    const weight = nutritionProfile.metrics?.weight || 70; // en kg
    const baseHydration = weight * 35; // 35ml/kg de poids corporel
    
    // Calculer la durée totale d'entraînement hebdomadaire en minutes
    const weeklyDuration = trainingPlan.workouts?.reduce((total, workout) => {
      return total + (workout.plannedDuration || 0);
    }, 0) || 0;
    
    // Facteur d'ajustement basé sur la durée hebdomadaire
    let activityFactor;
    if (weeklyDuration < 300) {
      activityFactor = 1.1; // Activité légère
    } else if (weeklyDuration < 600) {
      activityFactor = 1.2; // Activité modérée
    } else {
      activityFactor = 1.3; // Activité intense
    }
    
    // Hydratation quotidienne de base (en ml)
    const dailyHydration = Math.round(baseHydration * activityFactor);
    
    // Recommandations spécifiques pour les jours d'entraînement
    const workoutDayExtra = 500; // 500ml supplémentaires les jours d'entraînement
    
    return {
      daily: dailyHydration,
      workoutDayExtra,
      tips: [
        'Buvez régulièrement tout au long de la journée',
        'Augmentez l\'hydratation les jours de forte chaleur',
        'Surveillez la couleur de votre urine pour évaluer votre niveau d\'hydratation'
      ]
    };
  }
}

export default new TrainingNutritionSync();
