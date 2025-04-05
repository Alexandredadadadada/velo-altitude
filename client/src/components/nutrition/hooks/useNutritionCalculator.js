import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Hook personnalisé pour gérer les calculs nutritionnels
 * 
 * @returns {Object} Fonctions et données pour les calculs nutritionnels
 */
const useNutritionCalculator = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  /**
   * Calcule les besoins nutritionnels en fonction du profil utilisateur
   * 
   * @param {Object} userProfile - Profil de l'utilisateur
   * @returns {Object} Résultats nutritionnels calculés
   */
  const calculateNutrition = useCallback(async (userProfile) => {
    try {
      setLoading(true);
      setError(null);
      
      // Calculer les besoins caloriques de base (BMR) avec l'équation de Mifflin-St Jeor
      let bmr = 0;
      if (userProfile.gender === 'male') {
        bmr = 10 * userProfile.weight + 6.25 * userProfile.height - 5 * userProfile.age + 5;
      } else {
        bmr = 10 * userProfile.weight + 6.25 * userProfile.height - 5 * userProfile.age - 161;
      }
      
      // Facteur d'activité
      const activityFactors = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        veryActive: 1.9
      };
      
      // Calories dépensées lors du cyclisme
      // Approximation basée sur MET (Metabolic Equivalent of Task)
      // MET moyen pour le cyclisme récréatif: 8.0
      const cyclingCaloriesPerHour = 
        (userProfile.weight * 8.0 * 3.5) / 200 * 60;
      const weeklyExtraCalories = 
        cyclingCaloriesPerHour * userProfile.cyclingHoursPerWeek;
      const dailyExtraCalories = weeklyExtraCalories / 7;
      
      // Calculer les calories quotidiennes totales
      let tdee = bmr * activityFactors[userProfile.activityLevel] + dailyExtraCalories;
      
      // Ajuster en fonction de l'objectif
      const goalAdjustment = {
        weightLoss: 0.8, // Déficit de 20%
        maintain: 1.0,   // Maintien
        performance: 1.1, // Surplus de 10% pour les performances
        endurance: 1.2,   // Surplus de 20% pour l'endurance
        recovery: 1.05    // Léger surplus pour la récupération
      };
      
      tdee = Math.round(tdee * goalAdjustment[userProfile.goal]);
      
      // Calculer les macronutriments selon le modèle nutritionnel actif
      const nutritionModel = getActiveNutritionModel(userProfile.goal);
      
      const proteinGrams = Math.round((tdee * (nutritionModel.macroRatio.protein / 100)) / 4);
      const carbsGrams = Math.round((tdee * (nutritionModel.macroRatio.carbs / 100)) / 4);
      const fatGrams = Math.round((tdee * (nutritionModel.macroRatio.fat / 100)) / 9);
      
      // Simuler un léger délai pour donner l'impression d'un calcul complexe
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const results = {
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
        dailyCyclingCalories: Math.round(dailyExtraCalories),
        dailyIntake: {
          calories: Math.round(tdee),
          protein: proteinGrams,
          carbs: carbsGrams,
          fat: fatGrams
        },
        macroRatio: nutritionModel.macroRatio,
        nutritionModel: nutritionModel,
        recommendedSupplements: nutritionModel.recommendedSupplements
      };
      
      setLoading(false);
      return results;
    } catch (err) {
      setError(t('nutrition.calculation_error'));
      setLoading(false);
      throw err;
    }
  }, [t]);
  
  /**
   * Obtient le modèle nutritionnel actif en fonction de l'objectif
   * 
   * @param {string} goal - Objectif nutritionnel
   * @returns {Object} Modèle nutritionnel correspondant
   */
  const getActiveNutritionModel = useCallback((goal) => {
    const models = {
      performance: generatePerformanceModel(),
      weightLoss: generateWeightLossModel(),
      endurance: generateEnduranceModel(),
      recovery: generateRecoveryModel(),
      maintain: generatePerformanceModel() // Par défaut, utilisez le modèle de performance
    };
    
    return models[goal] || models.maintain;
  }, []);
  
  /**
   * Génère un modèle nutritionnel pour la performance
   * 
   * @returns {Object} Modèle nutritionnel pour la performance
   */
  const generatePerformanceModel = useCallback(() => {
    return {
      title: t('nutrition.models.performance_title'),
      description: t('nutrition.models.performance_description'),
      macroRatio: { carbs: 60, protein: 20, fat: 20 },
      calorieAdjustment: 1.1, // +10% de calories
      recommendedSupplements: [
        t('nutrition.supplements.creatine'),
        t('nutrition.supplements.caffeine'),
        t('nutrition.supplements.bcaa'),
        t('nutrition.supplements.beta_alanine')
      ],
      mealTiming: [
        { name: t('nutrition.meals.breakfast'), percent: 25 },
        { name: t('nutrition.meals.pre_workout'), percent: 15 },
        { name: t('nutrition.meals.post_workout'), percent: 25 },
        { name: t('nutrition.meals.dinner'), percent: 25 },
        { name: t('nutrition.meals.evening_snack'), percent: 10 }
      ]
    };
  }, [t]);
  
  /**
   * Génère un modèle nutritionnel pour la perte de poids
   * 
   * @returns {Object} Modèle nutritionnel pour la perte de poids
   */
  const generateWeightLossModel = useCallback(() => {
    return {
      title: t('nutrition.models.weight_loss_title'),
      description: t('nutrition.models.weight_loss_description'),
      macroRatio: { carbs: 40, protein: 35, fat: 25 },
      calorieAdjustment: 0.8, // -20% de calories
      recommendedSupplements: [
        t('nutrition.supplements.protein_powder'),
        t('nutrition.supplements.green_tea_extract'),
        t('nutrition.supplements.cla'),
        t('nutrition.supplements.fiber')
      ],
      mealTiming: [
        { name: t('nutrition.meals.breakfast'), percent: 25 },
        { name: t('nutrition.meals.lunch'), percent: 30 },
        { name: t('nutrition.meals.afternoon_snack'), percent: 15 },
        { name: t('nutrition.meals.dinner'), percent: 30 }
      ]
    };
  }, [t]);
  
  /**
   * Génère un modèle nutritionnel pour l'endurance
   * 
   * @returns {Object} Modèle nutritionnel pour l'endurance
   */
  const generateEnduranceModel = useCallback(() => {
    return {
      title: t('nutrition.models.endurance_title'),
      description: t('nutrition.models.endurance_description'),
      macroRatio: { carbs: 65, protein: 15, fat: 20 },
      calorieAdjustment: 1.2, // +20% de calories
      recommendedSupplements: [
        t('nutrition.supplements.electrolytes'),
        t('nutrition.supplements.carb_powder'),
        t('nutrition.supplements.beetroot_juice'),
        t('nutrition.supplements.omega3')
      ],
      mealTiming: [
        { name: t('nutrition.meals.pre_ride_breakfast'), percent: 20 },
        { name: t('nutrition.meals.during_ride'), percent: 30 },
        { name: t('nutrition.meals.post_ride_recovery'), percent: 25 },
        { name: t('nutrition.meals.dinner'), percent: 25 }
      ]
    };
  }, [t]);
  
  /**
   * Génère un modèle nutritionnel pour la récupération
   * 
   * @returns {Object} Modèle nutritionnel pour la récupération
   */
  const generateRecoveryModel = useCallback(() => {
    return {
      title: t('nutrition.models.recovery_title'),
      description: t('nutrition.models.recovery_description'),
      macroRatio: { carbs: 55, protein: 25, fat: 20 },
      calorieAdjustment: 1.05, // +5% de calories
      recommendedSupplements: [
        t('nutrition.supplements.protein_powder'),
        t('nutrition.supplements.tart_cherry'),
        t('nutrition.supplements.turmeric'),
        t('nutrition.supplements.collagen')
      ],
      mealTiming: [
        { name: t('nutrition.meals.breakfast'), percent: 25 },
        { name: t('nutrition.meals.lunch'), percent: 25 },
        { name: t('nutrition.meals.post_workout_recovery'), percent: 20 },
        { name: t('nutrition.meals.dinner'), percent: 25 },
        { name: t('nutrition.meals.before_bed'), percent: 5 }
      ]
    };
  }, [t]);
  
  return {
    calculateNutrition,
    getActiveNutritionModel,
    loading,
    error
  };
};

export default useNutritionCalculator;
