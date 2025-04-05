import { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Hook personnalisé pour gérer la planification des repas
 * Optimisé avec useMemo et useCallback pour minimiser les re-renders
 * 
 * @returns {Object} Fonctions et données pour la planification des repas
 */
const useMealPlanner = () => {
  const { t } = useTranslation();
  const [savedPlans, setSavedPlans] = useState([]);
  const [planName, setPlanName] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)); // Lundi comme premier jour
    
    // Créer un tableau pour les 7 jours de la semaine
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      weekDays.push({
        date: day.toISOString().split('T')[0],
        dayName: day.toLocaleDateString(undefined, { weekday: 'long' }),
        meals: []
      });
    }
    return weekDays;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  /**
   * Charge les plans sauvegardés depuis le localStorage
   */
  const loadSavedPlans = useCallback(() => {
    try {
      setLoading(true);
      const savedPlansData = localStorage.getItem('nutritionPlans');
      if (savedPlansData) {
        setSavedPlans(JSON.parse(savedPlansData));
      }
      
      // Charger également le plan hebdomadaire actuel s'il existe
      const currentWeekData = localStorage.getItem('currentWeekPlan');
      if (currentWeekData) {
        setCurrentWeek(JSON.parse(currentWeekData));
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading saved plans:', error);
      setError('Erreur lors du chargement des plans sauvegardés');
      setLoading(false);
    }
  }, []);
  
  /**
   * Base de données d'aliments classés par type de repas
   * En production, ceci serait remplacé par un appel API
   */
  const foodDatabase = useMemo(() => ({
    breakfast: [
      { 
        id: 'breakfast1',
        name: t('nutrition.foods.oatmeal'), 
        calories: 150, 
        protein: 5, 
        carbs: 27, 
        fat: 3, 
        portion: '40g',
        category: 'carbs',
        tags: ['breakfast', 'fiber', 'whole-grain']
      },
      { 
        id: 'breakfast2',
        name: t('nutrition.foods.eggs'), 
        calories: 140, 
        protein: 12, 
        carbs: 1, 
        fat: 10, 
        portion: '2 eggs',
        category: 'protein',
        tags: ['breakfast', 'protein', 'keto-friendly']
      },
      { 
        id: 'breakfast3',
        name: t('nutrition.foods.greek_yogurt'), 
        calories: 150, 
        protein: 15, 
        carbs: 6, 
        fat: 8, 
        portion: '150g',
        category: 'protein',
        tags: ['breakfast', 'dairy', 'probiotics']
      },
      { 
        id: 'breakfast4',
        name: t('nutrition.foods.banana'), 
        calories: 105, 
        protein: 1, 
        carbs: 27, 
        fat: 0, 
        portion: '1 medium',
        category: 'fruit',
        tags: ['breakfast', 'fruit', 'potassium']
      },
      { 
        id: 'breakfast5',
        name: t('nutrition.foods.whole_grain_bread'), 
        calories: 80, 
        protein: 4, 
        carbs: 15, 
        fat: 1, 
        portion: '1 slice',
        category: 'carbs',
        tags: ['breakfast', 'fiber', 'whole-grain']
      },
      { 
        id: 'breakfast6',
        name: t('nutrition.foods.almond_butter'), 
        calories: 100, 
        protein: 3, 
        carbs: 3, 
        fat: 9, 
        portion: '1 tbsp',
        category: 'fat',
        tags: ['breakfast', 'nuts', 'healthy-fat']
      },
      { 
        id: 'breakfast7',
        name: t('nutrition.foods.milk'), 
        calories: 120, 
        protein: 8, 
        carbs: 12, 
        fat: 5, 
        portion: '240ml',
        category: 'dairy',
        tags: ['breakfast', 'calcium', 'dairy']
      },
      { 
        id: 'breakfast8',
        name: t('nutrition.foods.protein_shake'), 
        calories: 150, 
        protein: 25, 
        carbs: 3, 
        fat: 2, 
        portion: '1 scoop',
        category: 'protein',
        tags: ['breakfast', 'protein', 'post-workout']
      }
    ],
    lunch: [
      { 
        id: 'lunch1',
        name: t('nutrition.foods.chicken_breast'), 
        calories: 165, 
        protein: 31, 
        carbs: 0, 
        fat: 3.6, 
        portion: '100g',
        category: 'protein',
        tags: ['lunch', 'protein', 'low-carb']
      },
      { 
        id: 'lunch2',
        name: t('nutrition.foods.brown_rice'), 
        calories: 215, 
        protein: 5, 
        carbs: 45, 
        fat: 1.8, 
        portion: '100g',
        category: 'carbs',
        tags: ['lunch', 'fiber', 'whole-grain']
      },
      { 
        id: 'lunch3',
        name: t('nutrition.foods.mixed_salad'), 
        calories: 35, 
        protein: 1, 
        carbs: 7, 
        fat: 0, 
        portion: '100g',
        category: 'vegetable',
        tags: ['lunch', 'fiber', 'low-calorie']
      },
      { 
        id: 'lunch4',
        name: t('nutrition.foods.tuna'), 
        calories: 130, 
        protein: 29, 
        carbs: 0, 
        fat: 1, 
        portion: '100g',
        category: 'protein',
        tags: ['lunch', 'protein', 'omega-3']
      },
      { 
        id: 'lunch5',
        name: t('nutrition.foods.quinoa'), 
        calories: 120, 
        protein: 4, 
        carbs: 21, 
        fat: 2, 
        portion: '100g',
        category: 'carbs',
        tags: ['lunch', 'protein', 'gluten-free']
      },
      { 
        id: 'lunch6',
        name: t('nutrition.foods.olive_oil'), 
        calories: 120, 
        protein: 0, 
        carbs: 0, 
        fat: 14, 
        portion: '1 tbsp',
        category: 'fat',
        tags: ['lunch', 'healthy-fat', 'condiment']
      }
    ],
    dinner: [
      { 
        id: 'dinner1',
        name: t('nutrition.foods.salmon'), 
        calories: 206, 
        protein: 22, 
        carbs: 0, 
        fat: 13, 
        portion: '100g',
        category: 'protein',
        tags: ['dinner', 'protein', 'omega-3']
      },
      { 
        id: 'dinner2',
        name: t('nutrition.foods.sweet_potato'), 
        calories: 90, 
        protein: 2, 
        carbs: 20, 
        fat: 0, 
        portion: '100g',
        category: 'carbs',
        tags: ['dinner', 'complex-carbs', 'vitamin-a']
      },
      { 
        id: 'dinner3',
        name: t('nutrition.foods.broccoli'), 
        calories: 55, 
        protein: 3.7, 
        carbs: 11, 
        fat: 0.6, 
        portion: '100g',
        category: 'vegetable',
        tags: ['dinner', 'fiber', 'vitamin-c']
      },
      { 
        id: 'dinner4',
        name: t('nutrition.foods.pasta'), 
        calories: 200, 
        protein: 7, 
        carbs: 40, 
        fat: 1, 
        portion: '100g',
        category: 'carbs',
        tags: ['dinner', 'carbs', 'quick-energy']
      },
      { 
        id: 'dinner5',
        name: t('nutrition.foods.tofu'), 
        calories: 144, 
        protein: 17, 
        carbs: 3, 
        fat: 9, 
        portion: '100g',
        category: 'protein',
        tags: ['dinner', 'vegetarian', 'plant-protein']
      }
    ],
    snack: [
      { 
        id: 'snack1',
        name: t('nutrition.foods.almonds'), 
        calories: 170, 
        protein: 6, 
        carbs: 6, 
        fat: 15, 
        portion: '28g',
        category: 'fat',
        tags: ['snack', 'nuts', 'healthy-fat']
      },
      { 
        id: 'snack2',
        name: t('nutrition.foods.berries'), 
        calories: 70, 
        protein: 1, 
        carbs: 17, 
        fat: 0, 
        portion: '100g',
        category: 'fruit',
        tags: ['snack', 'antioxidants', 'low-calorie']
      },
      { 
        id: 'snack3',
        name: t('nutrition.foods.energy_bar'), 
        calories: 230, 
        protein: 8, 
        carbs: 35, 
        fat: 7, 
        portion: '1 bar',
        category: 'balanced',
        tags: ['snack', 'pre-workout', 'convenient']
      },
      { 
        id: 'snack4',
        name: t('nutrition.foods.apple'), 
        calories: 95, 
        protein: 0.5, 
        carbs: 25, 
        fat: 0, 
        portion: '1 medium',
        category: 'fruit',
        tags: ['snack', 'fiber', 'vitamin-c']
      },
      { 
        id: 'snack5',
        name: t('nutrition.foods.cottage_cheese'), 
        calories: 110, 
        protein: 12, 
        carbs: 3, 
        fat: 5, 
        portion: '100g',
        category: 'protein',
        tags: ['snack', 'protein', 'dairy']
      }
    ]
  }), [t]);
  
  /**
   * Génère un plan de repas basé sur les besoins nutritionnels
   * Optimisé avec useMemo pour minimiser les recalculs
   * 
   * @param {Object} nutrition - Besoins nutritionnels
   * @returns {Array} Plan de repas généré
   */
  const generateMealPlan = useCallback((nutrition) => {
    if (!nutrition) return [];
    
    try {
      setLoading(true);
      setError(null);
      
      // Distributions des calories par repas
      const mealDistribution = [
        { name: 'breakfast', title: t('nutrition.meals.breakfast'), percent: 0.25 },
        { name: 'lunch', title: t('nutrition.meals.lunch'), percent: 0.3 },
        { name: 'snack', title: t('nutrition.meals.snack'), percent: 0.15 },
        { name: 'dinner', title: t('nutrition.meals.dinner'), percent: 0.3 }
      ];
      
      // Générer les repas
      const meals = mealDistribution.map(meal => {
        const mealCalories = Math.round(nutrition.dailyIntake.calories * meal.percent);
        const mealProtein = Math.round(nutrition.dailyIntake.protein * meal.percent);
        const mealCarbs = Math.round(nutrition.dailyIntake.carbs * meal.percent);
        const mealFat = Math.round(nutrition.dailyIntake.fat * meal.percent);
        
        // Générer des aliments pour chaque repas
        const foods = generateFoodsForMeal(
          meal.name, 
          mealCalories, 
          mealProtein, 
          mealCarbs, 
          mealFat
        );
        
        return {
          id: `meal-${meal.name}-${Date.now()}`,
          name: meal.name,
          title: meal.title,
          calories: foods.reduce((sum, food) => sum + food.calories, 0),
          protein: foods.reduce((sum, food) => sum + food.protein, 0),
          carbs: foods.reduce((sum, food) => sum + food.carbs, 0),
          fat: foods.reduce((sum, food) => sum + food.fat, 0),
          foods: foods
        };
      });
      
      setLoading(false);
      return meals;
    } catch (error) {
      console.error('Error generating meal plan:', error);
      setError('Erreur lors de la génération du plan de repas');
      setLoading(false);
      return [];
    }
  }, [t, generateFoodsForMeal]);
  
  /**
   * Génère des suggestions d'aliments pour un repas
   * 
   * @param {string} meal - Type de repas
   * @param {number} calories - Calories totales pour le repas
   * @param {number} protein - Protéines totales pour le repas
   * @param {number} carbs - Glucides totaux pour le repas
   * @param {number} fat - Lipides totaux pour le repas
   * @returns {Array} Liste d'aliments générée
   */
  const generateFoodsForMeal = useCallback((meal, calories, protein, carbs, fat) => {
    // Initialiser la liste d'aliments sélectionnés
    const selectedFoods = [];
    
    /**
     * Sélectionne des aliments basés sur les macros manquantes
     * 
     * @param {Array} foodList - Liste d'aliments disponibles
     * @param {number} targetCalories - Calories cibles
     * @param {number} targetProtein - Protéines cibles
     * @param {number} targetCarbs - Glucides cibles
     * @param {number} targetFat - Lipides cibles
     * @param {Array} selectedFoods - Aliments déjà sélectionnés
     * @returns {Array} Liste d'aliments mise à jour
     */
    const selectFoods = (foodList, targetCalories, targetProtein, targetCarbs, targetFat, selectedFoods = []) => {
      // Calculer les macros actuelles
      let currentCalories = selectedFoods.reduce((sum, food) => sum + food.calories, 0);
      let currentProtein = selectedFoods.reduce((sum, food) => sum + food.protein, 0);
      let currentCarbs = selectedFoods.reduce((sum, food) => sum + food.carbs, 0);
      let currentFat = selectedFoods.reduce((sum, food) => sum + food.fat, 0);
      
      // Mélanger la liste pour avoir des suggestions variées à chaque fois
      const shuffledFoods = [...foodList].sort(() => 0.5 - Math.random());
      
      // Sélectionner des aliments jusqu'à atteindre approximativement les macros cibles
      for (const food of shuffledFoods) {
        // Éviter les doublons
        if (selectedFoods.some(f => f.id === food.id)) {
          continue;
        }
        
        // Vérifier si l'ajout de cet aliment nous rapproche des cibles
        const newCalories = currentCalories + food.calories;
        const newProtein = currentProtein + food.protein;
        const newCarbs = currentCarbs + food.carbs;
        const newFat = currentFat + food.fat;
        
        // Si l'ajout nous fait dépasser les calories cibles de plus de 10%, passer à l'aliment suivant
        if (newCalories > targetCalories * 1.1) {
          continue;
        }
        
        // Ajouter l'aliment à la sélection
        selectedFoods.push({
          ...food,
          id: `food-${food.id}-${Date.now()}`
        });
        
        // Mettre à jour les macros actuelles
        currentCalories = newCalories;
        currentProtein = newProtein;
        currentCarbs = newCarbs;
        currentFat = newFat;
        
        // Si nous avons suffisamment d'aliments ou que nous sommes proches des cibles, arrêter
        if (
          selectedFoods.length >= 4 || 
          (currentCalories >= targetCalories * 0.9 && 
           currentProtein >= targetProtein * 0.9 && 
           currentCarbs >= targetCarbs * 0.9 && 
           currentFat >= targetFat * 0.9)
        ) {
          break;
        }
      }
      
      return selectedFoods;
    };
    
    // Utiliser la liste d'aliments correspondant au repas
    const mealFoods = foodDatabase[meal] || foodDatabase.snack;
    
    // Sélectionner les aliments pour ce repas
    return selectFoods(mealFoods, calories, protein, carbs, fat, selectedFoods);
  }, [foodDatabase]);
  
  /**
   * Sauvegarde un plan nutritionnel
   * 
   * @param {Array} mealPlan - Plan de repas à sauvegarder
   * @param {string} name - Nom du plan
   * @param {Object} nutritionResults - Résultats nutritionnels associés
   */
  const savePlan = useCallback((mealPlan, name, nutritionResults) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!name.trim()) {
        throw new Error('Le nom du plan ne peut pas être vide');
      }
      
      const newPlan = {
        id: `plan-${Date.now()}`,
        name: name,
        createdAt: new Date().toISOString(),
        meals: mealPlan,
        nutritionSummary: {
          calories: nutritionResults.dailyIntake.calories,
          protein: nutritionResults.dailyIntake.protein,
          carbs: nutritionResults.dailyIntake.carbs,
          fat: nutritionResults.dailyIntake.fat
        },
        macroRatio: nutritionResults.macroRatio
      };
      
      const updatedPlans = [...savedPlans, newPlan];
      setSavedPlans(updatedPlans);
      
      // Sauvegarder dans le localStorage
      localStorage.setItem('nutritionPlans', JSON.stringify(updatedPlans));
      
      setPlanName('');
      setShowSaveForm(false);
      setLoading(false);
      
      return newPlan;
    } catch (error) {
      console.error('Error saving plan:', error);
      setError(error.message || 'Erreur lors de la sauvegarde du plan');
      setLoading(false);
      throw error;
    }
  }, [savedPlans]);
  
  /**
   * Supprime un plan sauvegardé
   * 
   * @param {string} planId - Identifiant du plan à supprimer
   */
  const deletePlan = useCallback((planId) => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedPlans = savedPlans.filter(plan => plan.id !== planId);
      setSavedPlans(updatedPlans);
      
      // Mettre à jour le localStorage
      localStorage.setItem('nutritionPlans', JSON.stringify(updatedPlans));
      
      setLoading(false);
    } catch (error) {
      console.error('Error deleting plan:', error);
      setError('Erreur lors de la suppression du plan');
      setLoading(false);
    }
  }, [savedPlans]);
  
  /**
   * Ajoute un repas à une journée spécifique du calendrier
   * 
   * @param {string} dateStr - Date au format YYYY-MM-DD
   * @param {Object} meal - Repas à ajouter
   */
  const addMealToDay = useCallback((dateStr, meal) => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedWeek = [...currentWeek];
      const dayIndex = updatedWeek.findIndex(day => day.date === dateStr);
      
      if (dayIndex === -1) {
        throw new Error('Date non trouvée dans la semaine actuelle');
      }
      
      // Vérifier si un repas du même type existe déjà pour cette journée
      const existingMealIndex = updatedWeek[dayIndex].meals.findIndex(m => m.name === meal.name);
      
      if (existingMealIndex !== -1) {
        // Remplacer le repas existant
        updatedWeek[dayIndex].meals[existingMealIndex] = {
          ...meal,
          id: `meal-${meal.name}-${Date.now()}`
        };
      } else {
        // Ajouter un nouveau repas
        updatedWeek[dayIndex].meals.push({
          ...meal,
          id: `meal-${meal.name}-${Date.now()}`
        });
      }
      
      // Mettre à jour l'état et le localStorage
      setCurrentWeek(updatedWeek);
      localStorage.setItem('currentWeekPlan', JSON.stringify(updatedWeek));
      
      setLoading(false);
    } catch (error) {
      console.error('Error adding meal to day:', error);
      setError(error.message || 'Erreur lors de l\'ajout du repas');
      setLoading(false);
    }
  }, [currentWeek]);
  
  /**
   * Supprime un repas d'une journée
   * 
   * @param {string} dateStr - Date au format YYYY-MM-DD
   * @param {string} mealId - Identifiant du repas à supprimer
   */
  const removeMealFromDay = useCallback((dateStr, mealId) => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedWeek = [...currentWeek];
      const dayIndex = updatedWeek.findIndex(day => day.date === dateStr);
      
      if (dayIndex === -1) {
        throw new Error('Date non trouvée dans la semaine actuelle');
      }
      
      // Filtrer le repas à supprimer
      updatedWeek[dayIndex].meals = updatedWeek[dayIndex].meals.filter(meal => meal.id !== mealId);
      
      // Mettre à jour l'état et le localStorage
      setCurrentWeek(updatedWeek);
      localStorage.setItem('currentWeekPlan', JSON.stringify(updatedWeek));
      
      setLoading(false);
    } catch (error) {
      console.error('Error removing meal from day:', error);
      setError(error.message || 'Erreur lors de la suppression du repas');
      setLoading(false);
    }
  }, [currentWeek]);
  
  /**
   * Calcule les totaux nutritionnels pour une journée spécifique
   * Optimisé avec useMemo pour éviter les recalculs inutiles
   * 
   * @param {string} dateStr - Date au format YYYY-MM-DD
   * @returns {Object} Totaux nutritionnels pour la journée
   */
  const getDayTotals = useCallback((dateStr) => {
    const day = currentWeek.find(day => day.date === dateStr);
    
    if (!day || day.meals.length === 0) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }
    
    // Calculer les totaux pour la journée
    return day.meals.reduce(
      (totals, meal) => {
        return {
          calories: totals.calories + meal.calories,
          protein: totals.protein + meal.protein,
          carbs: totals.carbs + meal.carbs,
          fat: totals.fat + meal.fat
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [currentWeek]);
  
  /**
   * Change la semaine active dans le planificateur
   * 
   * @param {number} offset - Nombre de semaines à ajouter (+) ou soustraire (-)
   */
  const changeWeek = useCallback((offset) => {
    try {
      setLoading(true);
      setError(null);
      
      // Sauvegarder la semaine actuelle
      localStorage.setItem('currentWeekPlan', JSON.stringify(currentWeek));
      
      // Calculer la nouvelle semaine
      const firstDayOfCurrentWeek = new Date(currentWeek[0].date);
      const firstDayOfNewWeek = new Date(firstDayOfCurrentWeek);
      firstDayOfNewWeek.setDate(firstDayOfCurrentWeek.getDate() + (offset * 7));
      
      // Créer un tableau pour les 7 jours de la semaine
      const weekDays = [];
      for (let i = 0; i < 7; i++) {
        const day = new Date(firstDayOfNewWeek);
        day.setDate(firstDayOfNewWeek.getDate() + i);
        const dateStr = day.toISOString().split('T')[0];
        
        // Vérifier si nous avons déjà des données pour cette date
        const existingDay = currentWeek.find(d => d.date === dateStr);
        
        weekDays.push(existingDay || {
          date: dateStr,
          dayName: day.toLocaleDateString(undefined, { weekday: 'long' }),
          meals: []
        });
      }
      
      setCurrentWeek(weekDays);
      setLoading(false);
    } catch (error) {
      console.error('Error changing week:', error);
      setError('Erreur lors du changement de semaine');
      setLoading(false);
    }
  }, [currentWeek]);
  
  // Charger les plans et la semaine actuelle au montage du composant
  useEffect(() => {
    loadSavedPlans();
  }, [loadSavedPlans]);
  
  // Mémoisation des totaux hebdomadaires
  const weeklyTotals = useMemo(() => {
    return currentWeek.reduce(
      (weekTotals, day) => {
        const dayTotal = getDayTotals(day.date);
        return {
          calories: weekTotals.calories + dayTotal.calories,
          protein: weekTotals.protein + dayTotal.protein,
          carbs: weekTotals.carbs + dayTotal.carbs,
          fat: weekTotals.fat + dayTotal.fat
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [currentWeek, getDayTotals]);
  
  return {
    savedPlans,
    planName,
    showSaveForm,
    currentWeek,
    weeklyTotals,
    loading,
    error,
    setPlanName,
    setShowSaveForm,
    loadSavedPlans,
    generateMealPlan,
    savePlan,
    deletePlan,
    addMealToDay,
    removeMealFromDay,
    getDayTotals,
    changeWeek
  };
};

export default useMealPlanner;
