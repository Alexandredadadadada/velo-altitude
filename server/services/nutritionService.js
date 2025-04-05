/**
 * Service pour gérer toutes les opérations liées à la nutrition
 * Version optimisée avec mise en cache Redis et requêtes MongoDB optimisées
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const NutritionProfile = require('../models/NutritionProfile');
const Recipe = require('../models/Recipe');
const MealPlan = require('../models/MealPlan');
const FoodItem = require('../models/FoodItem');
const nutritionCacheService = require('./nutritionCacheService');
const logger = require('../utils/logger');
const { getErrorMessage } = require('../utils/errorHandler');
const { CACHE_TTL } = require('./nutritionCacheService');

// Optimisations des requêtes MongoDB
const USER_NUTRITION_PROJECTION = {
  _id: 1,
  metrics: 1,
  goals: 1,
  preferences: 1,
  calculations: 1,
  lastUpdated: 1
};

const RECIPE_PROJECTION = {
  _id: 1,
  name: 1,
  description: 1,
  ingredients: 1,
  nutritionalInfo: 1,
  preparationTime: 1,
  cookingTime: 1,
  difficulty: 1,
  mealType: 1,
  seasonality: 1,
  tags: 1,
  rating: 1,
  image: 1
};

/**
 * Récupère les données nutritionnelles complètes d'un utilisateur avec mise en cache
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object>} - Données nutritionnelles de l'utilisateur
 */
async function getUserNutritionData(userId) {
  try {
    const cacheKey = `user:nutrition:${userId}`;

    // Utiliser la stratégie stale-while-revalidate
    return await nutritionCacheService.getWithStaleWhileRevalidate(
      cacheKey,
      async () => {
        logger.debug(`Fetching fresh nutrition data for user: ${userId}`, { service: 'nutritionService' });
        
        // Exécuter les requêtes en parallèle pour optimiser les performances
        const [nutritionProfile, recentPlans] = await Promise.all([
          // Utiliser lean() pour obtenir des objets JavaScript simples au lieu de documents Mongoose
          NutritionProfile.findOne({ userId })
            .select(USER_NUTRITION_PROJECTION)
            .lean(),
          
          // Récupérer uniquement les plans récents (limité à 5)
          MealPlan.find({ userId })
            .sort({ createdAt: -1 })
            .limit(5)
            .lean()
        ]);

        if (!nutritionProfile) {
          logger.warn(`No nutrition profile found for user: ${userId}`, { service: 'nutritionService' });
          return null;
        }

        // Construire l'objet de réponse optimisé
        const response = {
          ...nutritionProfile,
          recentPlans: recentPlans || []
        };

        return response;
      },
      300, // Données considérées fraîches pendant 5 minutes
      CACHE_TTL.USER_NUTRITION_DATA // Durée maximale du cache
    );
  } catch (error) {
    logger.error(`Error fetching user nutrition data: ${getErrorMessage(error)}`, {
      service: 'nutritionService',
      userId,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Mettre à jour les données nutritionnelles d'un utilisateur et invalider le cache
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} nutritionData - Nouvelles données nutritionnelles
 * @returns {Promise<Object>} - Profil nutritionnel mis à jour
 */
async function updateUserNutritionData(userId, nutritionData) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    logger.debug(`Updating nutrition data for user: ${userId}`, { service: 'nutritionService' });

    // Mettre à jour le profil nutritionnel avec la date de dernière mise à jour
    const updatedProfile = await NutritionProfile.findOneAndUpdate(
      { userId },
      { 
        ...nutritionData,
        lastUpdated: new Date()
      },
      { new: true, upsert: true, session }
    ).lean();

    await session.commitTransaction();
    session.endSession();

    // Invalider le cache pour forcer un rechargement des données
    await nutritionCacheService.invalidateCache(`user:nutrition:${userId}`);
    
    // Invalider également tous les caches liés à l'utilisateur et à la nutrition
    await nutritionCacheService.invalidateCachePattern(`user:*:${userId}:nutrition:*`);

    return updatedProfile;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    logger.error(`Error updating user nutrition data: ${getErrorMessage(error)}`, {
      service: 'nutritionService',
      userId,
      stack: error.stack
    });
    
    throw error;
  }
}

/**
 * Récupérer des recettes optimisées pour un utilisateur avec mise en cache
 * @param {Object} filters - Filtres pour les recettes (mealType, difficulty, etc.)
 * @param {string} userId - ID de l'utilisateur pour les recommandations personnalisées
 * @param {number} page - Numéro de page (pagination)
 * @param {number} limit - Nombre d'éléments par page
 * @returns {Promise<Object>} - Recettes et métadonnées de pagination
 */
async function getRecipesForUser(filters = {}, userId = null, page = 1, limit = 12) {
  try {
    const skip = (page - 1) * limit;
    const queryFilter = buildRecipeQueryFilter(filters);
    
    // Clé de cache basée sur les paramètres de recherche
    const filterHash = JSON.stringify(queryFilter);
    const cacheKey = `recipes:${filterHash}:page:${page}:limit:${limit}:user:${userId || 'guest'}`;

    return await nutritionCacheService.getWithStaleWhileRevalidate(
      cacheKey,
      async () => {
        logger.debug(`Fetching fresh recipes with filters: ${JSON.stringify(filters)}`, { 
          service: 'nutritionService',
          userId: userId || 'guest'
        });

        // Optimisation: exécuter les requêtes en parallèle
        const [recipes, totalCount, userPreferences] = await Promise.all([
          Recipe.find(queryFilter)
            .select(RECIPE_PROJECTION)
            .sort({ rating: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
          
          Recipe.countDocuments(queryFilter),
          
          // Récupérer les préférences nutritionnelles de l'utilisateur si disponibles
          userId ? NutritionProfile.findOne({ userId }).select('preferences').lean() : null
        ]);

        // Ajouter un indicateur si la recette correspond aux préférences de l'utilisateur
        const enhancedRecipes = recipes.map(recipe => {
          const enhanced = { ...recipe };
          
          if (userPreferences && userPreferences.preferences) {
            // Calculer un score de pertinence basé sur les préférences de l'utilisateur
            enhanced.relevanceScore = calculateRecipeRelevanceScore(recipe, userPreferences.preferences);
            enhanced.matchesPreferences = enhanced.relevanceScore > 70; // Seuil arbitraire
          }
          
          return enhanced;
        });

        // Trier les recettes par score de pertinence si l'utilisateur est connecté
        if (userId && userPreferences) {
          enhancedRecipes.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
        }

        return {
          recipes: enhancedRecipes,
          pagination: {
            total: totalCount,
            page,
            limit,
            pages: Math.ceil(totalCount / limit)
          }
        };
      },
      600, // Fraîcheur: 10 minutes
      CACHE_TTL.RECENT_RECIPES
    );
  } catch (error) {
    logger.error(`Error fetching recipes: ${getErrorMessage(error)}`, {
      service: 'nutritionService',
      filters,
      userId: userId || 'guest',
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Construire le filtre de requête pour les recettes
 * @param {Object} filters - Filtres bruts depuis l'API
 * @returns {Object} - Filtre optimisé pour MongoDB
 */
function buildRecipeQueryFilter(filters) {
  const queryFilter = {};
  
  // Filtrer par type de repas
  if (filters.mealType && filters.mealType.length > 0) {
    queryFilter.mealType = { $in: Array.isArray(filters.mealType) ? filters.mealType : [filters.mealType] };
  }
  
  // Filtrer par difficulté
  if (filters.difficulty) {
    queryFilter.difficulty = filters.difficulty;
  }
  
  // Filtrer par temps de préparation maximum
  if (filters.maxPrepTime) {
    queryFilter.preparationTime = { $lte: parseInt(filters.maxPrepTime) };
  }
  
  // Filtrer par saison
  if (filters.season) {
    queryFilter.seasonality = { $in: Array.isArray(filters.season) ? filters.season : [filters.season] };
  }
  
  // Filtrer par tags (utiliser un index pour cette requête)
  if (filters.tags && filters.tags.length > 0) {
    queryFilter.tags = { $all: Array.isArray(filters.tags) ? filters.tags : [filters.tags] };
  }
  
  // Filtrer par plages nutritionnelles
  if (filters.minProtein) {
    queryFilter['nutritionalInfo.protein'] = { $gte: parseInt(filters.minProtein) };
  }
  
  if (filters.maxCalories) {
    queryFilter['nutritionalInfo.calories'] = { $lte: parseInt(filters.maxCalories) };
  }
  
  return queryFilter;
}

/**
 * Calculer un score de pertinence pour une recette basé sur les préférences utilisateur
 * @param {Object} recipe - Recette
 * @param {Object} preferences - Préférences utilisateur
 * @returns {number} - Score de pertinence (0-100)
 */
function calculateRecipeRelevanceScore(recipe, preferences) {
  let score = 0;
  const weights = {
    dietaryRestrictions: 40, // Poids important pour les restrictions alimentaires
    favoriteIngredients: 25,
    favoriteRecipes: 15, 
    tags: 10,
    mealType: 10
  };
  
  // Vérifier les restrictions alimentaires (facteur d'exclusion)
  if (preferences.dietaryRestrictions && preferences.dietaryRestrictions.length > 0) {
    const hasRestrictedIngredient = recipe.ingredients.some(ingredient => 
      preferences.dietaryRestrictions.some(restriction => 
        ingredient.name.toLowerCase().includes(restriction.toLowerCase())
      )
    );
    
    // Si la recette contient un ingrédient restreint, score très bas
    if (hasRestrictedIngredient) {
      return 0;
    }
    
    // Bonus pour les recettes sans ingrédients restreints
    score += weights.dietaryRestrictions;
  }
  
  // Vérifier les ingrédients préférés
  if (preferences.favoriteIngredients && preferences.favoriteIngredients.length > 0) {
    const matchingIngredients = recipe.ingredients.filter(ingredient => 
      preferences.favoriteIngredients.some(favorite => 
        ingredient.name.toLowerCase().includes(favorite.toLowerCase())
      )
    );
    
    if (matchingIngredients.length > 0) {
      const matchRatio = matchingIngredients.length / recipe.ingredients.length;
      score += weights.favoriteIngredients * matchRatio;
    }
  }
  
  // Vérifier les types de repas préférés
  if (preferences.preferredMealTypes && preferences.preferredMealTypes.includes(recipe.mealType)) {
    score += weights.mealType;
  }
  
  // Vérifier les tags
  if (preferences.favoriteTags && preferences.favoriteTags.length > 0 && recipe.tags) {
    const matchingTags = recipe.tags.filter(tag => 
      preferences.favoriteTags.includes(tag)
    );
    
    if (matchingTags.length > 0) {
      const tagRatio = matchingTags.length / recipe.tags.length;
      score += weights.tags * tagRatio;
    }
  }
  
  // Vérifier si la recette est similaire aux recettes préférées
  if (preferences.favoriteRecipes && preferences.favoriteRecipes.length > 0) {
    // Si la recette est directement dans les favoris
    if (preferences.favoriteRecipes.includes(recipe._id.toString())) {
      score += weights.favoriteRecipes;
    }
  }
  
  return Math.min(100, score);
}

/**
 * Générer un plan de repas personnalisé selon les besoins nutritionnels
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} nutritionalRequirements - Besoins nutritionnels calculés
 * @param {Object} preferences - Préférences alimentaires
 * @returns {Promise<Object>} - Plan de repas généré
 */
async function generateMealPlan(userId, nutritionalRequirements, preferences = {}) {
  try {
    logger.debug(`Generating meal plan for user: ${userId}`, { 
      service: 'nutritionService',
      requirements: JSON.stringify(nutritionalRequirements)
    });

    const cacheKey = `meal:plan:generation:${userId}:${JSON.stringify(nutritionalRequirements)}:${JSON.stringify(preferences)}`;

    // Vérifier si un plan récent existe déjà en cache
    const cachedPlan = await nutritionCacheService.getCache(cacheKey);
    if (cachedPlan) {
      logger.debug(`Using cached meal plan for user: ${userId}`, { service: 'nutritionService' });
      return cachedPlan;
    }

    // Construction des filtres pour les recettes adaptées aux besoins
    const mealTypeFilters = {
      breakfast: { 
        mealType: 'breakfast', 
        maxCalories: Math.round(nutritionalRequirements.dailyCalories * 0.25) 
      },
      lunch: { 
        mealType: 'lunch', 
        maxCalories: Math.round(nutritionalRequirements.dailyCalories * 0.35),
        minProtein: Math.round(nutritionalRequirements.dailyProtein * 0.3)
      },
      dinner: { 
        mealType: 'dinner', 
        maxCalories: Math.round(nutritionalRequirements.dailyCalories * 0.35),
        minProtein: Math.round(nutritionalRequirements.dailyProtein * 0.3)
      },
      snack: { 
        mealType: 'snack', 
        maxCalories: Math.round(nutritionalRequirements.dailyCalories * 0.1) 
      }
    };

    // Ajouter les préférences alimentaires aux filtres
    if (preferences.dietaryRestrictions && preferences.dietaryRestrictions.length > 0) {
      Object.keys(mealTypeFilters).forEach(mealType => {
        mealTypeFilters[mealType].dietaryRestrictions = preferences.dietaryRestrictions;
      });
    }

    // Récupérer les recettes pour chaque type de repas en parallèle (optimisation)
    const [breakfastRecipes, lunchRecipes, dinnerRecipes, snackRecipes] = await Promise.all([
      Recipe.find(buildRecipeQueryFilter(mealTypeFilters.breakfast))
        .select(RECIPE_PROJECTION)
        .sort({ rating: -1 })
        .limit(5)
        .lean(),
      
      Recipe.find(buildRecipeQueryFilter(mealTypeFilters.lunch))
        .select(RECIPE_PROJECTION)
        .sort({ rating: -1 })
        .limit(8)
        .lean(),
      
      Recipe.find(buildRecipeQueryFilter(mealTypeFilters.dinner))
        .select(RECIPE_PROJECTION)
        .sort({ rating: -1 })
        .limit(8)
        .lean(),
      
      Recipe.find(buildRecipeQueryFilter(mealTypeFilters.snack))
        .select(RECIPE_PROJECTION)
        .sort({ rating: -1 })
        .limit(5)
        .lean()
    ]);

    // Générer un plan sur 7 jours
    const mealPlan = {
      userId,
      nutritionalRequirements,
      days: []
    };

    for (let day = 0; day < 7; day++) {
      mealPlan.days.push({
        dayNumber: day + 1,
        dayName: getDayName(day),
        meals: {
          breakfast: selectRandomRecipe(breakfastRecipes),
          lunch: selectRandomRecipe(lunchRecipes),
          dinner: selectRandomRecipe(dinnerRecipes),
          snacks: [selectRandomRecipe(snackRecipes)]
        }
      });
    }

    // Calculer les totaux nutritionnels pour chaque jour
    mealPlan.days.forEach(day => {
      day.nutritionTotals = calculateDailyNutritionTotals(day.meals);
    });

    // Mettre en cache le plan généré
    await nutritionCacheService.setCache(cacheKey, mealPlan, CACHE_TTL.MEAL_PLAN);

    return mealPlan;
  } catch (error) {
    logger.error(`Error generating meal plan: ${getErrorMessage(error)}`, {
      service: 'nutritionService',
      userId,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Sélectionner une recette aléatoire dans une liste
 * @param {Array} recipes - Liste de recettes
 * @returns {Object} - Recette sélectionnée
 */
function selectRandomRecipe(recipes) {
  if (!recipes || recipes.length === 0) {
    return null;
  }
  
  const randomIndex = Math.floor(Math.random() * recipes.length);
  return recipes[randomIndex];
}

/**
 * Obtenir le nom du jour de la semaine
 * @param {number} dayIndex - Index du jour (0-6)
 * @returns {string} - Nom du jour
 */
function getDayName(dayIndex) {
  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  return days[dayIndex % 7];
}

/**
 * Calculer les totaux nutritionnels pour un jour
 * @param {Object} meals - Repas du jour
 * @returns {Object} - Totaux nutritionnels
 */
function calculateDailyNutritionTotals(meals) {
  const totals = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0
  };
  
  // Ajouter les valeurs nutritionnelles de chaque repas
  Object.values(meals).forEach(meal => {
    if (!meal) return;
    
    if (Array.isArray(meal)) {
      // Pour les snacks (tableau)
      meal.forEach(snack => {
        if (snack && snack.nutritionalInfo) {
          totals.calories += snack.nutritionalInfo.calories || 0;
          totals.protein += snack.nutritionalInfo.protein || 0;
          totals.carbs += snack.nutritionalInfo.carbs || 0;
          totals.fat += snack.nutritionalInfo.fat || 0;
          totals.fiber += snack.nutritionalInfo.fiber || 0;
        }
      });
    } else if (meal && meal.nutritionalInfo) {
      // Pour les repas individuels
      totals.calories += meal.nutritionalInfo.calories || 0;
      totals.protein += meal.nutritionalInfo.protein || 0;
      totals.carbs += meal.nutritionalInfo.carbs || 0;
      totals.fat += meal.nutritionalInfo.fat || 0;
      totals.fiber += meal.nutritionalInfo.fiber || 0;
    }
  });
  
  // Arrondir les valeurs pour la lisibilité
  Object.keys(totals).forEach(key => {
    totals[key] = Math.round(totals[key]);
  });
  
  return totals;
}

/**
 * Rechercher des aliments dans la base de données
 * @param {string} query - Terme de recherche
 * @param {number} limit - Nombre maximum de résultats
 * @returns {Promise<Array>} - Résultats de recherche
 */
async function searchFoodItems(query, limit = 20) {
  try {
    if (!query || query.trim().length < 2) {
      return [];
    }
    
    const cacheKey = `food:search:${query.toLowerCase()}:limit:${limit}`;
    
    return await nutritionCacheService.getWithStaleWhileRevalidate(
      cacheKey,
      async () => {
        logger.debug(`Searching food items with query: ${query}`, { service: 'nutritionService' });
        
        // Utilisation de l'index de texte pour une recherche optimisée
        const results = await FoodItem.find(
          { $text: { $search: query } },
          { score: { $meta: 'textScore' } }
        )
          .select('name nutritionalInfo category portionSize')
          .sort({ score: { $meta: 'textScore' } })
          .limit(limit)
          .lean();
          
        return results;
      },
      600, // Fraîcheur: 10 minutes
      3600 * 12 // Cache max: 12 heures (les données alimentaires changent rarement)
    );
  } catch (error) {
    logger.error(`Error searching food items: ${getErrorMessage(error)}`, {
      service: 'nutritionService',
      query,
      stack: error.stack
    });
    
    // Fallback avec une recherche moins optimisée mais plus robuste
    try {
      return await FoodItem.find({ 
        name: { $regex: query, $options: 'i' } 
      })
        .select('name nutritionalInfo category portionSize')
        .limit(limit)
        .lean();
    } catch (fallbackError) {
      logger.error(`Fallback food search also failed: ${getErrorMessage(fallbackError)}`, {
        service: 'nutritionService',
        query,
        stack: fallbackError.stack
      });
      return [];
    }
  }
}

/**
 * Calculer les besoins nutritionnels en fonction des métriques et objectifs
 * @param {Object} metrics - Métriques de l'utilisateur (poids, taille, âge, etc.)
 * @param {Object} goals - Objectifs de l'utilisateur
 * @returns {Object} - Besoins nutritionnels calculés
 */
function calculateNutritionalNeeds(metrics, goals) {
  try {
    if (!metrics || !metrics.weight || !metrics.height || !metrics.age || !metrics.gender || !metrics.activityLevel) {
      throw new Error('Metrics incomplete for nutritional calculation');
    }
    
    if (!goals || !goals.type) {
      throw new Error('Goals incomplete for nutritional calculation');
    }
    
    // Calculer les besoins métaboliques de base (BMR) avec la formule Mifflin-St Jeor
    let bmr = 0;
    if (metrics.gender === 'male') {
      bmr = 10 * metrics.weight + 6.25 * metrics.height - 5 * metrics.age + 5;
    } else {
      bmr = 10 * metrics.weight + 6.25 * metrics.height - 5 * metrics.age - 161;
    }
    
    // Facteurs d'activité
    const activityFactors = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      veryActive: 1.9
    };
    
    // Calculer les dépenses caloriques totales (TDEE)
    const activityFactor = activityFactors[metrics.activityLevel] || activityFactors.moderate;
    let tdee = bmr * activityFactor;
    
    // Ajuster selon l'objectif
    let dailyCalories = tdee;
    let proteinRatio = 0;
    let carbsRatio = 0;
    let fatRatio = 0;
    
    switch (goals.type) {
      case 'weightLoss':
        dailyCalories = tdee * 0.8; // Déficit de 20%
        proteinRatio = 0.3; // 30% des calories
        carbsRatio = 0.4; // 40% des calories
        fatRatio = 0.3; // 30% des calories
        break;
        
      case 'maintenance':
        dailyCalories = tdee;
        proteinRatio = 0.25; // 25% des calories
        carbsRatio = 0.5; // 50% des calories
        fatRatio = 0.25; // 25% des calories
        break;
        
      case 'performance':
        dailyCalories = tdee * 1.1; // Surplus de 10% pour la performance
        proteinRatio = 0.25; // 25% des calories
        carbsRatio = 0.55; // 55% des calories
        fatRatio = 0.2; // 20% des calories
        break;
        
      case 'weightGain':
        dailyCalories = tdee * 1.15; // Surplus de 15%
        proteinRatio = 0.25; // 25% des calories
        carbsRatio = 0.5; // 50% des calories
        fatRatio = 0.25; // 25% des calories
        break;
        
      default:
        dailyCalories = tdee;
        proteinRatio = 0.25;
        carbsRatio = 0.5;
        fatRatio = 0.25;
    }
    
    // Ajustement pour les cyclistes (augmentation des besoins)
    if (metrics.activityLevel === 'active' || metrics.activityLevel === 'veryActive') {
      // Augmenter les glucides pour une meilleure endurance
      carbsRatio += 0.05;
      fatRatio -= 0.05;
    }

    // Calcul des macronutriments en grammes
    // 1g protéine = 4 calories, 1g glucides = 4 calories, 1g lipides = 9 calories
    const dailyProtein = (dailyCalories * proteinRatio) / 4;
    const dailyCarbs = (dailyCalories * carbsRatio) / 4;
    const dailyFat = (dailyCalories * fatRatio) / 9;
    
    // Besoins hydriques (eau) en ml - Formule simplifiée
    const dailyWater = metrics.weight * 35; // 35ml par kg de poids corporel
    
    // Besoins en fibres (recommandation générale)
    const dailyFiber = 25 + (metrics.gender === 'male' ? 13 : 0); // 38g hommes, 25g femmes
    
    return {
      dailyCalories: Math.round(dailyCalories),
      dailyProtein: Math.round(dailyProtein),
      dailyCarbs: Math.round(dailyCarbs),
      dailyFat: Math.round(dailyFat),
      dailyWater: Math.round(dailyWater),
      dailyFiber: Math.round(dailyFiber),
      macroRatios: {
        protein: Math.round(proteinRatio * 100),
        carbs: Math.round(carbsRatio * 100),
        fat: Math.round(fatRatio * 100)
      },
      bmr: Math.round(bmr),
      tdee: Math.round(tdee)
    };
  } catch (error) {
    logger.error(`Error calculating nutritional needs: ${getErrorMessage(error)}`, {
      service: 'nutritionService',
      metrics: JSON.stringify(metrics),
      goals: JSON.stringify(goals),
      stack: error.stack
    });
    throw error;
  }
}

// Memoize la fonction de calcul nutritionnel pour optimiser les performances
const memoizedCalculateNutritionalNeeds = nutritionCacheService.memoize(
  calculateNutritionalNeeds,
  60 * 60 // Cache d'une heure
);

module.exports = {
  getUserNutritionData,
  updateUserNutritionData,
  getRecipesForUser,
  generateMealPlan,
  searchFoodItems,
  calculateNutritionalNeeds: memoizedCalculateNutritionalNeeds
};
