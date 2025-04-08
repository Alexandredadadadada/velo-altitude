/**
 * Point d'entrée pour les services de nutrition
 * 
 * Réexporte les différents services spécialisés et fournit une API compatible
 * avec l'ancien nutritionService.js pour faciliter la migration progressive.
 */

import recipeService from './recipeService';
import mealPlanService from './mealPlanService';
import * as userNutritionService from './userNutritionService';

// Réexport des services modulaires
export { 
  recipeService,
  mealPlanService,
  userNutritionService
};

/**
 * API compatible avec l'ancien nutritionService.js
 * Ce service agrégé permet une transition en douceur vers l'architecture modulaire
 */
const compatibilityService = {
  // Méthodes de userNutritionService
  getUserNutritionPreferences: userNutritionService.getUserNutritionPreferences,
  updateUserNutritionPreferences: userNutritionService.updateUserNutritionPreferences,
  getUserFavoriteNutritionItems: userNutritionService.getUserFavoriteNutritionItems,
  getUserNutritionStats: userNutritionService.getUserNutritionStats,
  
  // Méthodes de recipeService
  getRecipes: recipeService.getRecipes,
  getNutritionRecipeById: recipeService.getRecipeById,
  getUserFavoriteRecipes: recipeService.getUserFavoriteRecipes,
  addToFavorites: recipeService.addToFavorites,
  removeFromFavorites: recipeService.removeFromFavorites,
  
  // Méthodes de mealPlanService
  getMealPlans: mealPlanService.getMealPlans,
  logMeal: mealPlanService.logMeal,
  calculateNutrition: mealPlanService.calculateNutrition,
  getUserNutritionData: mealPlanService.getUserNutritionData,
  generatePersonalizedMealPlan: mealPlanService.generatePersonalizedMealPlan
};

// Export par défaut pour compatibilité avec l'ancien code
export default compatibilityService;
