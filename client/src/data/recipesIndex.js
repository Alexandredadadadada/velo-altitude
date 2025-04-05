/**
 * Index centralisé de toutes les recettes disponibles sur Dashboard-Velo
 * Organise et catégorise les recettes pour permettre une navigation et recherche efficace
 */

import nutritionRecipes from './nutritionRecipes';

// Importer d'autres ensembles de recettes ici
// import additionalRecipes from './additionalRecipes';
// import seasonalRecipes from './seasonalRecipes';

/**
 * Catégories principales de recettes
 */
const categories = {
  preRide: {
    id: 'preRide',
    name: 'Avant l\'effort',
    description: 'Recettes idéales pour préparer votre organisme à l\'effort, avec un focus sur les glucides complexes et une bonne digestibilité',
    icon: 'breakfast',
    recipes: nutritionRecipes.preRide || []
  },
  duringRide: {
    id: 'duringRide',
    name: 'Pendant l\'effort',
    description: 'Aliments et en-cas pratiques pour vous ravitailler pendant vos sorties vélo',
    icon: 'energy',
    recipes: nutritionRecipes.duringRide || []
  },
  postRide: {
    id: 'postRide',
    name: 'Récupération',
    description: 'Recettes riches en protéines et nutriments pour optimiser votre récupération après l\'effort',
    icon: 'recovery',
    recipes: nutritionRecipes.postRide || []
  },
  colSpecific: {
    id: 'colSpecific',
    name: 'Spécial cols',
    description: 'Recettes spécialement conçues pour la préparation et le ravitaillement lors des ascensions de cols',
    icon: 'mountain',
    recipes: nutritionRecipes.colSpecific || []
  }
};

/**
 * Objectifs nutritionnels et leurs recettes associées
 */
const objectives = {
  endurance: {
    id: 'endurance',
    name: 'Endurance',
    description: 'Recettes riches en glucides complexes pour les efforts de longue durée',
    icon: 'timer',
    recipes: [] // Sera rempli ci-dessous
  },
  performance: {
    id: 'performance',
    name: 'Performance',
    description: 'Nutrition optimisée pour les efforts intenses et la compétition',
    icon: 'speed',
    recipes: [] // Sera rempli ci-dessous
  },
  weightLoss: {
    id: 'weightLoss',
    name: 'Perte de poids',
    description: 'Recettes équilibrées pour perdre du poids sans compromettre vos performances',
    icon: 'scale',
    recipes: [] // Sera rempli ci-dessous
  },
  recovery: {
    id: 'recovery',
    name: 'Récupération optimale',
    description: 'Focus sur les protéines et antioxydants pour accélérer la récupération',
    icon: 'healing',
    recipes: [] // Sera rempli ci-dessous
  }
};

/**
 * Propriétés diététiques spéciales
 */
const dietaryProperties = {
  glutenFree: {
    id: 'glutenFree',
    name: 'Sans gluten',
    description: 'Recettes sans gluten adaptées aux cyclistes sensibles ou intolérants',
    icon: 'glutenFree',
    recipes: [] // Sera rempli ci-dessous
  },
  vegetarian: {
    id: 'vegetarian',
    name: 'Végétarien',
    description: 'Recettes végétariennes complètes pour les cyclistes',
    icon: 'vegetarian',
    recipes: [] // Sera rempli ci-dessous
  },
  vegan: {
    id: 'vegan',
    name: 'Végétalien',
    description: 'Recettes 100% végétales adaptées aux besoins des cyclistes',
    icon: 'vegan',
    recipes: [] // Sera rempli ci-dessous
  },
  dairyFree: {
    id: 'dairyFree',
    name: 'Sans lactose',
    description: 'Recettes sans produits laitiers pour les cyclistes intolérants',
    icon: 'dairyFree',
    recipes: [] // Sera rempli ci-dessous
  },
  highProtein: {
    id: 'highProtein',
    name: 'Riche en protéines',
    description: 'Recettes concentrées en protéines pour la récupération et le développement musculaire',
    icon: 'protein',
    recipes: [] // Sera rempli ci-dessous
  }
};

/**
 * Toutes les recettes disponibles dans l'application
 */
const allRecipes = [
  ...nutritionRecipes.preRide || [],
  ...nutritionRecipes.duringRide || [],
  ...nutritionRecipes.postRide || [],
  ...nutritionRecipes.colSpecific || []
  // Ajouter d'autres collections ici au besoin
];

// Classification des recettes par objectif
allRecipes.forEach(recipe => {
  // Cette classification est simplifiée, dans un système réel
  // elle pourrait être basée sur des métadonnées explicites dans chaque recette
  
  // Classification par objectif
  if (recipe.nutritionalInfo && recipe.nutritionalInfo.macros) {
    const macros = recipe.nutritionalInfo.macros;
    
    // Recettes pour l'endurance (riches en glucides)
    if (macros.carbs > 60 || (macros.carbs / (macros.protein + macros.fat) > 2)) {
      objectives.endurance.recipes.push(recipe);
    }
    
    // Recettes pour la performance (équilibrées)
    if (macros.protein >= 20 && macros.carbs >= 40) {
      objectives.performance.recipes.push(recipe);
    }
    
    // Recettes pour la perte de poids (pauvres en calories, riches en protéines)
    if (recipe.nutritionalInfo.calories < 400 && macros.protein / macros.carbs > 0.5) {
      objectives.weightLoss.recipes.push(recipe);
    }
    
    // Recettes pour la récupération (riches en protéines)
    if (macros.protein > 25 || macros.protein / recipe.nutritionalInfo.calories > 0.15) {
      objectives.recovery.recipes.push(recipe);
    }
    
    // Recettes riches en protéines
    if (macros.protein > 20) {
      dietaryProperties.highProtein.recipes.push(recipe);
    }
  }
  
  // Classification par propriétés diététiques
  if (recipe.ingredients) {
    const ingredients = recipe.ingredients.join(' ').toLowerCase();
    
    // Recettes sans gluten (détection simplifiée)
    if (!ingredients.includes('blé') && 
        !ingredients.includes('gluten') && 
        !ingredients.includes('orge') && 
        !ingredients.includes('seigle') &&
        !(ingredients.includes('avoine') && !ingredients.includes('sans gluten'))) {
      dietaryProperties.glutenFree.recipes.push(recipe);
    }
    
    // Recettes végétariennes
    if (!ingredients.includes('viande') && 
        !ingredients.includes('poulet') && 
        !ingredients.includes('bœuf') && 
        !ingredients.includes('porc') &&
        !ingredients.includes('jambon') &&
        !ingredients.includes('bacon') &&
        !ingredients.includes('saucisse')) {
      dietaryProperties.vegetarian.recipes.push(recipe);
      
      // Vérification supplémentaire pour les recettes végétaliennes
      if (!ingredients.includes('œuf') && 
          !ingredients.includes('lait') && 
          !ingredients.includes('fromage') && 
          !ingredients.includes('yaourt') &&
          !ingredients.includes('beurre') &&
          !ingredients.includes('crème')) {
        dietaryProperties.vegan.recipes.push(recipe);
      }
    }
    
    // Recettes sans lactose
    if (!ingredients.includes('lait') && 
        !ingredients.includes('fromage') && 
        !ingredients.includes('yaourt') && 
        !ingredients.includes('crème') &&
        !ingredients.includes('beurre')) {
      dietaryProperties.dairyFree.recipes.push(recipe);
    }
  }
});

/**
 * Moteur de recherche pour trouver des recettes par mots-clés
 * @param {string} query - Termes de recherche
 * @param {number} limit - Nombre maximum de résultats
 * @returns {Array} - Recettes correspondantes
 */
const search = (query, limit = 20) => {
  if (!query || query.trim() === '') return allRecipes.slice(0, limit);
  
  const searchTerms = query.toLowerCase().split(' ');
  const results = allRecipes.filter(recipe => {
    const searchString = `${recipe.name.toLowerCase()} ${recipe.category?.toLowerCase() || ''} ${recipe.ingredients?.join(' ').toLowerCase() || ''}`;
    
    return searchTerms.some(term => searchString.includes(term));
  });
  
  return results.slice(0, limit);
};

/**
 * Système de recommandation de recettes basé sur le profil utilisateur
 * @param {Object} userProfile - Profil de l'utilisateur
 * @param {number} limit - Nombre maximum de recettes à recommander
 * @returns {Array} - Recettes recommandées
 */
const recommend = (userProfile, limit = 10) => {
  if (!userProfile) return allRecipes.slice(0, limit);
  
  // Algorithme simplifié de recommandation
  let recommendedRecipes = [];
  
  // Recommandations basées sur l'objectif principal
  if (userProfile.goal === 'endurance') {
    recommendedRecipes = [...objectives.endurance.recipes];
  } else if (userProfile.goal === 'weightLoss') {
    recommendedRecipes = [...objectives.weightLoss.recipes];
  } else if (userProfile.goal === 'performance') {
    recommendedRecipes = [...objectives.performance.recipes];
  } else if (userProfile.goal === 'recovery') {
    recommendedRecipes = [...objectives.recovery.recipes];
  }
  
  // Recommandations basées sur les restrictions alimentaires
  if (userProfile.dietaryRestrictions) {
    if (userProfile.dietaryRestrictions.includes('glutenFree')) {
      recommendedRecipes = recommendedRecipes.filter(recipe => 
        dietaryProperties.glutenFree.recipes.some(r => r.id === recipe.id)
      );
    }
    
    if (userProfile.dietaryRestrictions.includes('vegetarian')) {
      recommendedRecipes = recommendedRecipes.filter(recipe => 
        dietaryProperties.vegetarian.recipes.some(r => r.id === recipe.id)
      );
    }
    
    if (userProfile.dietaryRestrictions.includes('vegan')) {
      recommendedRecipes = recommendedRecipes.filter(recipe => 
        dietaryProperties.vegan.recipes.some(r => r.id === recipe.id)
      );
    }
    
    if (userProfile.dietaryRestrictions.includes('dairyFree')) {
      recommendedRecipes = recommendedRecipes.filter(recipe => 
        dietaryProperties.dairyFree.recipes.some(r => r.id === recipe.id)
      );
    }
  }
  
  // Si le nombre de recettes recommandées est insuffisant,
  // compléter avec d'autres recettes populaires
  if (recommendedRecipes.length < limit) {
    const additionalRecipes = allRecipes
      .filter(recipe => !recommendedRecipes.some(r => r.id === recipe.id))
      .slice(0, limit - recommendedRecipes.length);
    
    recommendedRecipes = [...recommendedRecipes, ...additionalRecipes];
  }
  
  return recommendedRecipes.slice(0, limit);
};

/**
 * Récupération de recettes par catégorie
 * @param {string} categoryId - Identifiant de la catégorie
 * @param {number} limit - Nombre maximum de recettes à retourner
 * @returns {Array} - Recettes de la catégorie
 */
const getRecipesByCategory = (categoryId, limit = 50) => {
  if (categories[categoryId]) {
    return categories[categoryId].recipes.slice(0, limit);
  }
  return [];
};

/**
 * Récupération de recettes par objectif
 * @param {string} objectiveId - Identifiant de l'objectif
 * @param {number} limit - Nombre maximum de recettes à retourner
 * @returns {Array} - Recettes pour l'objectif spécifié
 */
const getRecipesByObjective = (objectiveId, limit = 50) => {
  if (objectives[objectiveId]) {
    return objectives[objectiveId].recipes.slice(0, limit);
  }
  return [];
};

/**
 * Récupération de recettes par propriété diététique
 * @param {string} propertyId - Identifiant de la propriété
 * @param {number} limit - Nombre maximum de recettes à retourner
 * @returns {Array} - Recettes correspondant à la propriété
 */
const getRecipesByDietaryProperty = (propertyId, limit = 50) => {
  if (dietaryProperties[propertyId]) {
    return dietaryProperties[propertyId].recipes.slice(0, limit);
  }
  return [];
};

export default {
  allRecipes,
  categories,
  objectives,
  dietaryProperties,
  search,
  recommend,
  getRecipesByCategory,
  getRecipesByObjective,
  getRecipesByDietaryProperty
};
