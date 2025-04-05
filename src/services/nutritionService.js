/**
 * Service de gestion des données nutritionnelles
 * Fournit des méthodes pour calculer les besoins nutritionnels, gérer les recettes
 * et synchroniser les plans alimentaires avec les programmes d'entraînement
 */

import api from './api';
import mockRecipes from '../data/mockRecipes';
import { capitalize } from '../utils/stringUtils';

const nutritionService = {
  /**
   * Récupère les données nutritionnelles d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<object>} - Données nutritionnelles de l'utilisateur
   */
  getUserNutritionData: async (userId) => {
    try {
      // En mode développement ou test, utiliser les données mockées
      if (process.env.REACT_APP_USE_MOCK_DATA === 'true') {
        return getMockUserNutritionData(userId);
      }

      const response = await api.get(`/users/${userId}/nutrition`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des données nutritionnelles:', error);
      // Utiliser les données mockées en fallback
      return getMockUserNutritionData(userId);
    }
  },

  /**
   * Calcule les besoins nutritionnels en fonction des paramètres fournis
   * @param {object} params - Paramètres de calcul
   * @returns {Promise<object>} - Résultats du calcul nutritionnel
   */
  calculateNutrition: async (params) => {
    try {
      // En mode développement ou test, calculer localement
      if (process.env.REACT_APP_USE_MOCK_DATA === 'true') {
        return calculateNutritionLocally(params);
      }

      const response = await api.post('/nutrition/calculate', params);
      return response.data;
    } catch (error) {
      console.error('Erreur lors du calcul nutritionnel:', error);
      // Calculer localement en fallback
      return calculateNutritionLocally(params);
    }
  },

  /**
   * Récupère la liste des recettes adaptées au cyclisme
   * @param {object} filters - Filtres optionnels
   * @returns {Promise<Array>} - Liste des recettes
   */
  getRecipes: async (filters = {}) => {
    try {
      // En mode développement ou test, utiliser les recettes mockées
      if (process.env.REACT_APP_USE_MOCK_DATA === 'true') {
        return getFilteredMockRecipes(filters);
      }

      let url = '/recipes';
      // Ajouter les filtres à l'URL si nécessaire
      if (Object.keys(filters).length > 0) {
        const queryParams = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value && value !== 'all') {
            queryParams.append(key, value);
          }
        });
        url = `${url}?${queryParams.toString()}`;
      }

      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des recettes:', error);
      // Utiliser les recettes mockées en fallback
      return getFilteredMockRecipes(filters);
    }
  },

  /**
   * Récupère les recettes favorites d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Array>} - Liste des IDs des recettes favorites
   */
  getUserFavoriteRecipes: async (userId) => {
    try {
      // En mode développement ou test, utiliser les favoris mockés
      if (process.env.REACT_APP_USE_MOCK_DATA === 'true') {
        return getMockUserFavorites(userId);
      }

      const response = await api.get(`/users/${userId}/favorite-recipes`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des recettes favorites:', error);
      // Utiliser les favoris mockés en fallback
      return getMockUserFavorites(userId);
    }
  },

  /**
   * Ajoute une recette aux favoris d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {string} recipeId - ID de la recette
   * @returns {Promise<object>} - Résultat de l'opération
   */
  addToFavorites: async (userId, recipeId) => {
    try {
      // En mode développement ou test, simuler l'ajout
      if (process.env.REACT_APP_USE_MOCK_DATA === 'true') {
        return { success: true, message: 'Recette ajoutée aux favoris' };
      }

      const response = await api.post(`/users/${userId}/favorite-recipes`, { recipeId });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'ajout aux favoris:', error);
      throw error;
    }
  },

  /**
   * Retire une recette des favoris d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {string} recipeId - ID de la recette
   * @returns {Promise<object>} - Résultat de l'opération
   */
  removeFromFavorites: async (userId, recipeId) => {
    try {
      // En mode développement ou test, simuler le retrait
      if (process.env.REACT_APP_USE_MOCK_DATA === 'true') {
        return { success: true, message: 'Recette retirée des favoris' };
      }

      const response = await api.delete(`/users/${userId}/favorite-recipes/${recipeId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors du retrait des favoris:', error);
      throw error;
    }
  },
  
  /**
   * Récupère les IDs des recettes favorites de l'utilisateur connecté
   * @returns {Promise<Array>} - Liste des IDs des recettes favorites
   */
  getUserFavorites: async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (!currentUser || !currentUser.id) {
        return [];
      }
      
      // En mode développement ou test, utiliser les favoris mockés
      if (process.env.REACT_APP_USE_MOCK_DATA === 'true') {
        return getMockUserFavorites(currentUser.id);
      }
      
      const response = await api.get(`/users/${currentUser.id}/favorite-recipes`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des favoris:', error);
      return [];
    }
  },
  
  /**
   * Ajoute une recette aux recettes sauvegardées de l'utilisateur connecté
   * @param {string} recipeId - ID de la recette
   * @returns {Promise<object>} - Résultat de l'opération
   */
  addToSaved: async (recipeId) => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (!currentUser || !currentUser.id) {
        throw new Error('Utilisateur non connecté');
      }
      
      // En mode développement ou test, simuler l'ajout
      if (process.env.REACT_APP_USE_MOCK_DATA === 'true') {
        const savedRecipes = JSON.parse(localStorage.getItem(`savedRecipes_${currentUser.id}`) || '[]');
        if (!savedRecipes.includes(recipeId)) {
          savedRecipes.push(recipeId);
          localStorage.setItem(`savedRecipes_${currentUser.id}`, JSON.stringify(savedRecipes));
        }
        return { success: true, message: 'Recette sauvegardée' };
      }
      
      const response = await api.post(`/users/${currentUser.id}/saved-recipes`, { recipeId });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la recette:', error);
      throw error;
    }
  },
  
  /**
   * Retire une recette des recettes sauvegardées de l'utilisateur connecté
   * @param {string} recipeId - ID de la recette
   * @returns {Promise<object>} - Résultat de l'opération
   */
  removeFromSaved: async (recipeId) => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (!currentUser || !currentUser.id) {
        throw new Error('Utilisateur non connecté');
      }
      
      // En mode développement ou test, simuler le retrait
      if (process.env.REACT_APP_USE_MOCK_DATA === 'true') {
        const savedRecipes = JSON.parse(localStorage.getItem(`savedRecipes_${currentUser.id}`) || '[]');
        const updatedSaved = savedRecipes.filter(id => id !== recipeId);
        localStorage.setItem(`savedRecipes_${currentUser.id}`, JSON.stringify(updatedSaved));
        return { success: true, message: 'Recette retirée des sauvegardes' };
      }
      
      const response = await api.delete(`/users/${currentUser.id}/saved-recipes/${recipeId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors du retrait de la sauvegarde:', error);
      throw error;
    }
  },
  
  /**
   * Récupère les IDs des recettes sauvegardées de l'utilisateur connecté
   * @returns {Promise<Array>} - Liste des IDs des recettes sauvegardées
   */
  getUserSaved: async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (!currentUser || !currentUser.id) {
        return [];
      }
      
      // En mode développement ou test, utiliser les sauvegardes mockées
      if (process.env.REACT_APP_USE_MOCK_DATA === 'true') {
        const savedRecipes = JSON.parse(localStorage.getItem(`savedRecipes_${currentUser.id}`) || '[]');
        return savedRecipes;
      }
      
      const response = await api.get(`/users/${currentUser.id}/saved-recipes`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des recettes sauvegardées:', error);
      return [];
    }
  },
  
  /**
   * Récupère les détails d'une recette par son ID
   * @param {string} recipeId - ID de la recette
   * @returns {Promise<object>} - Détails de la recette
   */
  getRecipeById: async (recipeId) => {
    try {
      // En mode développement ou test, utiliser les recettes mockées
      if (process.env.REACT_APP_USE_MOCK_DATA === 'true') {
        const recipe = mockRecipes.find(r => r.id === recipeId);
        return recipe || null;
      }
      
      const response = await api.get(`/recipes/${recipeId}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération de la recette ${recipeId}:`, error);
      // Utiliser les recettes mockées en fallback
      const recipe = mockRecipes.find(r => r.id === recipeId);
      return recipe || null;
    }
  },

  /**
   * Génère un plan alimentaire basé sur les besoins nutritionnels et l'entraînement
   * @param {object} params - Paramètres pour la génération du plan
   * @returns {Promise<object>} - Plan alimentaire généré
   */
  generateMealPlan: async (params) => {
    try {
      // En mode développement ou test, générer localement
      if (process.env.REACT_APP_USE_MOCK_DATA === 'true') {
        return generateMockMealPlan(params);
      }

      const response = await api.post('/nutrition/meal-plan', params);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la génération du plan alimentaire:', error);
      // Générer localement en fallback
      return generateMockMealPlan(params);
    }
  },

  /**
   * Synchronise le plan alimentaire avec le plan d'entraînement
   * @param {object} params - Paramètres pour la synchronisation
   * @returns {Promise<object>} - Résultat de la synchronisation
   */
  syncWithTrainingPlan: async (params) => {
    try {
      // En mode développement ou test, simuler la synchronisation
      if (process.env.REACT_APP_USE_MOCK_DATA === 'true') {
        return simulateSyncWithTraining(params);
      }

      const response = await api.post('/nutrition/sync-with-training', params);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la synchronisation avec l\'entraînement:', error);
      // Simuler la synchronisation en fallback
      return simulateSyncWithTraining(params);
    }
  }
};

/**
 * Données nutritionnelles mockées pour le développement
 */
const getMockUserNutritionData = (userId) => {
  // Simuler un délai de réseau
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        metrics: {
          weight: 70,
          height: 175,
          age: 35,
          gender: 'male',
          activityLevel: 'active'
        },
        goals: {
          type: 'performance',
          specificFocus: ['endurance', 'recovery']
        },
        cycling: {
          discipline: 'road',
          weeklyHours: 10,
          ftp: 250
        },
        nutritionNeeds: {
          calories: 2800,
          protein: 120,
          carbs: 380,
          fat: 90
        },
        // ID d'utilisateur fictif pour la simulation
        userId: userId || 'user123'
      });
    }, 300);
  });
};

/**
 * Calcul local des besoins nutritionnels
 */
const calculateNutritionLocally = (params) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const { weight, height, age, gender, activityLevel, goal, trainingHours, ftp } = params;
      
      // Calcul du métabolisme de base (formule de Mifflin-St Jeor)
      let bmr;
      if (gender === 'male') {
        bmr = 10 * weight + 6.25 * height - 5 * age + 5;
      } else {
        bmr = 10 * weight + 6.25 * height - 5 * age - 161;
      }
      
      // Facteurs d'activité
      const activityFactors = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        very_active: 1.9
      };
      
      // Niveau d'entraînement hebdomadaire
      let trainingFactor = 1.0;
      if (trainingHours > 0) {
        trainingFactor = 1.0 + (trainingHours * 0.05);
      }
      
      // Facteur d'activité
      const activityFactor = activityFactors[activityLevel] || activityFactors.moderate;
      
      // Calories totales selon l'objectif
      let totalCalories = bmr * activityFactor * trainingFactor;
      switch (goal) {
        case 'lose':
          totalCalories *= 0.85; // Déficit de 15%
          break;
        case 'gain':
          totalCalories *= 1.15; // Surplus de 15%
          break;
        // 'maintain' ou 'performance' restent à 100%
        default:
          break;
      }
      
      // Calcul des macronutriments selon l'objectif
      let protein, carbs, fat;
      switch (goal) {
        case 'lose':
          protein = weight * 2.0; // 2g par kg de poids corporel
          fat = weight * 1.0;     // 1g par kg de poids corporel
          carbs = (totalCalories - (protein * 4 + fat * 9)) / 4;
          break;
        case 'gain':
          protein = weight * 2.2; // 2.2g par kg de poids corporel
          carbs = weight * 6;     // 6g par kg de poids corporel
          fat = (totalCalories - (protein * 4 + carbs * 4)) / 9;
          break;
        case 'performance':
          protein = weight * 1.8; // 1.8g par kg de poids corporel
          carbs = weight * 7;     // 7g par kg de poids corporel
          fat = (totalCalories - (protein * 4 + carbs * 4)) / 9;
          break;
        default: // 'maintain'
          protein = weight * 1.6; // 1.6g par kg de poids corporel
          fat = totalCalories * 0.25 / 9; // 25% des calories
          carbs = (totalCalories - (protein * 4 + fat * 9)) / 4;
          break;
      }
      
      // Arrondir les valeurs
      totalCalories = Math.round(totalCalories);
      protein = Math.round(protein);
      carbs = Math.round(carbs);
      fat = Math.round(fat);
      
      // Calculer la zone d'hydratation
      const hydrationNeeds = {
        base: weight * 0.03, // 30ml par kg de poids corporel
        training: trainingHours * 0.5 // 500ml supplémentaires par heure d'entraînement
      };
      
      resolve({
        calories: totalCalories,
        macros: {
          protein,
          carbs,
          fat
        },
        distribution: {
          protein: Math.round((protein * 4 / totalCalories) * 100),
          carbs: Math.round((carbs * 4 / totalCalories) * 100),
          fat: Math.round((fat * 9 / totalCalories) * 100)
        },
        hydration: {
          dailyBase: Math.round(hydrationNeeds.base * 1000) / 1000, // en litres
          duringTraining: Math.round(hydrationNeeds.training * 1000) / 1000 // en litres
        }
      });
    }, 500);
  });
};

/**
 * Simulation des recettes favorites
 */
const getMockUserFavorites = (userId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Pour la simulation, prendre quelques IDs aléatoires des mockRecipes
      const favoriteIds = mockRecipes
        .slice(0, 5)
        .map(recipe => recipe.id);
      
      resolve(favoriteIds);
    }, 300);
  });
};

/**
 * Filtrage des recettes mockées
 */
const getFilteredMockRecipes = (filters = {}) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let filteredRecipes = [...mockRecipes];
      
      // Appliquer les filtres si fournis
      if (filters) {
        // Filtrer par type de repas
        if (filters.mealType && filters.mealType !== 'all') {
          filteredRecipes = filteredRecipes.filter(recipe => 
            recipe.mealType === filters.mealType
          );
        }
        
        // Filtrer par difficulté
        if (filters.difficulty && filters.difficulty !== 'all') {
          filteredRecipes = filteredRecipes.filter(recipe => 
            recipe.difficulty === filters.difficulty
          );
        }
        
        // Filtrer par temps de préparation
        if (filters.prepTime && filters.prepTime !== 'all') {
          const prepTimeRanges = {
            quick: { max: 15 },
            medium: { max: 30 },
            long: { max: 60 }
          };
          
          const range = prepTimeRanges[filters.prepTime];
          if (range) {
            filteredRecipes = filteredRecipes.filter(recipe => 
              recipe.prepTimeMinutes <= range.max
            );
          }
        }
        
        // Filtrer par préférence alimentaire
        if (filters.dietaryPreference && filters.dietaryPreference !== 'all') {
          filteredRecipes = filteredRecipes.filter(recipe => 
            recipe.dietaryPreferences.includes(filters.dietaryPreference)
          );
        }
        
        // Filtrer par phase d'entraînement
        if (filters.trainingPhase && filters.trainingPhase !== 'all') {
          filteredRecipes = filteredRecipes.filter(recipe => 
            recipe.recommendedFor.trainingPhases.includes(filters.trainingPhase)
          );
        }
        
        // Filtrer par focus nutritionnel
        if (filters.nutrientFocus && filters.nutrientFocus !== 'all') {
          filteredRecipes = filteredRecipes.filter(recipe => 
            recipe.nutrientFocus === filters.nutrientFocus
          );
        }
        
        // Filtrer par recherche textuelle
        if (filters.searchTerm && filters.searchTerm.trim() !== '') {
          const searchTermLower = filters.searchTerm.toLowerCase();
          filteredRecipes = filteredRecipes.filter(recipe => 
            recipe.name.toLowerCase().includes(searchTermLower) || 
            recipe.description.toLowerCase().includes(searchTermLower) ||
            recipe.ingredients.some(ing => ing.toLowerCase().includes(searchTermLower))
          );
        }
      }
      
      resolve(filteredRecipes);
    }, 500);
  });
};

/**
 * Génération d'un plan de repas fictif
 */
const generateMockMealPlan = (params) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const { nutritionNeeds, preferences, days, includedMeals } = params;
      
      // Créer un tableau de jours
      const mealPlan = Array.from({ length: days || 7 }, (_, dayIndex) => {
        // Déterminer si c'est un jour d'entraînement
        const isTrainingDay = dayIndex % 2 === 0; // Pour le mock, alternance de jours d'entraînement
        
        // Sélectionner des recettes appropriées pour chaque repas
        const meals = {};
        
        // Petit-déjeuner
        if (includedMeals.includes('breakfast')) {
          const breakfastRecipes = mockRecipes.filter(recipe => recipe.mealType === 'breakfast');
          meals.breakfast = breakfastRecipes[dayIndex % breakfastRecipes.length];
        }
        
        // Déjeuner
        if (includedMeals.includes('lunch')) {
          const lunchRecipes = mockRecipes.filter(recipe => recipe.mealType === 'lunch');
          meals.lunch = lunchRecipes[(dayIndex + 1) % lunchRecipes.length];
        }
        
        // Dîner
        if (includedMeals.includes('dinner')) {
          const dinnerRecipes = mockRecipes.filter(recipe => recipe.mealType === 'dinner');
          meals.dinner = dinnerRecipes[(dayIndex + 2) % dinnerRecipes.length];
        }
        
        // Collations
        if (includedMeals.includes('snacks')) {
          const snackRecipes = mockRecipes.filter(recipe => recipe.mealType === 'snack');
          meals.snacks = [
            snackRecipes[dayIndex % snackRecipes.length],
            snackRecipes[(dayIndex + 3) % snackRecipes.length]
          ];
        }
        
        // Repas spécifiques à l'entraînement si c'est un jour d'entraînement
        if (isTrainingDay) {
          if (includedMeals.includes('pre_workout')) {
            const preWorkoutRecipes = mockRecipes.filter(recipe => recipe.mealType === 'pre-ride');
            meals.pre_workout = preWorkoutRecipes[dayIndex % preWorkoutRecipes.length];
          }
          
          if (includedMeals.includes('post_workout')) {
            const postWorkoutRecipes = mockRecipes.filter(recipe => recipe.mealType === 'post-ride');
            meals.post_workout = postWorkoutRecipes[dayIndex % postWorkoutRecipes.length];
          }
        }
        
        // Calculer les totaux nutritionnels de la journée
        const dailyTotals = calculateDailyNutrition(meals);
        
        return {
          day: dayIndex + 1,
          date: new Date(Date.now() + dayIndex * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          isTrainingDay,
          meals,
          nutrition: dailyTotals
        };
      });
      
      resolve({
        plan: mealPlan,
        summary: {
          totalDays: days || 7,
          trainingDays: Math.ceil((days || 7) / 2), // Dans le mock, la moitié sont des jours d'entraînement
          averageDailyCalories: Math.round(nutritionNeeds.calories),
          adherenceToGoals: calculateAdherenceToGoals(mealPlan, nutritionNeeds)
        }
      });
    }, 1000);
  });
};

/**
 * Calcul des valeurs nutritionnelles quotidiennes
 */
const calculateDailyNutrition = (meals) => {
  let calories = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;
  
  // Parcourir tous les repas de la journée
  Object.values(meals).forEach(meal => {
    if (Array.isArray(meal)) {
      // Si c'est un tableau (comme snacks), calculer pour chaque élément
      meal.forEach(item => {
        if (item && item.nutritionalInfo) {
          calories += item.nutritionalInfo.calories || 0;
          protein += item.nutritionalInfo.protein || 0;
          carbs += item.nutritionalInfo.carbs || 0;
          fat += item.nutritionalInfo.fat || 0;
        }
      });
    } else if (meal && meal.nutritionalInfo) {
      // Sinon calculer pour le repas unique
      calories += meal.nutritionalInfo.calories || 0;
      protein += meal.nutritionalInfo.protein || 0;
      carbs += meal.nutritionalInfo.carbs || 0;
      fat += meal.nutritionalInfo.fat || 0;
    }
  });
  
  return {
    calories: Math.round(calories),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat)
  };
};

/**
 * Calcul de l'adhérence aux objectifs nutritionnels
 */
const calculateAdherenceToGoals = (mealPlan, nutritionNeeds) => {
  // Calculer la moyenne des valeurs nutritionnelles quotidiennes
  const totalDays = mealPlan.length;
  const nutritionSum = mealPlan.reduce((sum, day) => {
    sum.calories += day.nutrition.calories;
    sum.protein += day.nutrition.protein;
    sum.carbs += day.nutrition.carbs;
    sum.fat += day.nutrition.fat;
    return sum;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  
  const avgCalories = Math.round(nutritionSum.calories / totalDays);
  const avgProtein = Math.round(nutritionSum.protein / totalDays);
  const avgCarbs = Math.round(nutritionSum.carbs / totalDays);
  const avgFat = Math.round(nutritionSum.fat / totalDays);
  
  // Calculer le pourcentage d'adhérence pour chaque macro
  const calorieAdherence = Math.round((avgCalories / nutritionNeeds.calories) * 100);
  const proteinAdherence = Math.round((avgProtein / nutritionNeeds.macros.protein) * 100);
  const carbsAdherence = Math.round((avgCarbs / nutritionNeeds.macros.carbs) * 100);
  const fatAdherence = Math.round((avgFat / nutritionNeeds.macros.fat) * 100);
  
  return {
    calories: {
      target: nutritionNeeds.calories,
      actual: avgCalories,
      adherence: calorieAdherence
    },
    protein: {
      target: nutritionNeeds.macros.protein,
      actual: avgProtein,
      adherence: proteinAdherence
    },
    carbs: {
      target: nutritionNeeds.macros.carbs,
      actual: avgCarbs,
      adherence: carbsAdherence
    },
    fat: {
      target: nutritionNeeds.macros.fat,
      actual: avgFat,
      adherence: fatAdherence
    },
    overall: Math.round((calorieAdherence + proteinAdherence + carbsAdherence + fatAdherence) / 4)
  };
};

/**
 * Simulation de la synchronisation avec le plan d'entraînement
 */
const simulateSyncWithTraining = (params) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const { userId, trainingPlanId, adaptationType } = params;
      
      // Simulation de différentes adaptations
      let adaptationStrategy;
      switch (adaptationType) {
        case 'strict':
          adaptationStrategy = 'Adaptation stricte aux charges d\'entraînement';
          break;
        case 'moderate':
          adaptationStrategy = 'Adaptation modérée avec flexibilité';
          break;
        case 'minimal':
          adaptationStrategy = 'Ajustements minimaux pour les jours d\'intensité élevée uniquement';
          break;
        default:
          adaptationStrategy = 'Adaptation standard aux charges d\'entraînement';
      }
      
      resolve({
        success: true,
        message: 'Synchronisation effectuée avec succès',
        details: {
          userId,
          trainingPlanId,
          adaptationType,
          adaptationStrategy,
          modifications: {
            increasedCalorieDays: 3,
            increasedCarbDays: 4,
            recoveryFocusDays: 2
          },
          recommendations: [
            'Augmentation des glucides les jours d\'intensité élevée',
            'Optimisation de la fenêtre de récupération post-entraînement',
            'Hydratation stratégique avant les sorties longues'
          ]
        }
      });
    }, 800);
  });
};

export default nutritionService;
