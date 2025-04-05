/**
 * Point d'entrée pour toutes les recettes nutritionnelles
 * Regroupe et exporte les différentes catégories de recettes pour cyclistes
 */

import breakfastRecipes from './breakfast';
import preRideRecipes from './pre-ride';
import duringRideRecipes from './during-ride';
import postRideRecipes from './post-ride';
import snackRecipes from './snack';

// Collecter toutes les recettes dans un tableau unique
const allRecipes = [
  ...breakfastRecipes,
  ...preRideRecipes,
  ...duringRideRecipes,
  ...postRideRecipes,
  ...snackRecipes
];

// Créer des mappages par ID et par catégorie pour faciliter les recherches
const recipesById = allRecipes.reduce((acc, recipe) => {
  acc[recipe.id] = recipe;
  return acc;
}, {});

const recipesByCategory = allRecipes.reduce((acc, recipe) => {
  if (!acc[recipe.mealType]) {
    acc[recipe.mealType] = [];
  }
  acc[recipe.mealType].push(recipe);
  return acc;
}, {});

// Métadonnées pour les filtres de l'interface utilisateur
const mealTypes = [
  { id: 'all', label: 'Toutes les recettes' },
  { id: 'breakfast', label: 'Petit-déjeuner' },
  { id: 'pre-ride', label: 'Avant l\'effort' },
  { id: 'during-ride', label: 'Pendant l\'effort' },
  { id: 'post-ride', label: 'Récupération' },
  { id: 'snack', label: 'Collation' }
];

const difficultyLevels = [
  { id: 'all', label: 'Toutes' },
  { id: 'easy', label: 'Facile' },
  { id: 'medium', label: 'Moyenne' },
  { id: 'hard', label: 'Complexe' }
];

const prepTimeRanges = [
  { id: 'all', label: 'Tous' },
  { id: 'quick', label: 'Rapide (< 15min)', maxMinutes: 15 },
  { id: 'medium', label: 'Moyen (< 30min)', maxMinutes: 30 },
  { id: 'long', label: 'Long (< 60min)', maxMinutes: 60 }
];

const dietaryPreferences = [
  { id: 'all', label: 'Toutes' },
  { id: 'vegetarian', label: 'Végétarien' },
  { id: 'vegan', label: 'Végan' },
  { id: 'gluten-free', label: 'Sans gluten' },
  { id: 'high-protein', label: 'Riche en protéines' },
  { id: 'high-carb', label: 'Riche en glucides' },
  { id: 'low-fiber', label: 'Faible en fibres' }
];

const nutrientFocus = [
  { id: 'all', label: 'Tous les focus' },
  { id: 'balanced', label: 'Équilibré' },
  { id: 'high-protein', label: 'Riche en protéines' },
  { id: 'high-carb', label: 'Riche en glucides' },
  { id: 'recovery', label: 'Récupération optimale' },
  { id: 'hydration', label: 'Hydratation' },
  { id: 'energy-dense', label: 'Haute densité énergétique' }
];

const trainingPhases = [
  { id: 'all', label: 'Toutes les phases' },
  { id: 'base', label: 'Phase de base (volume)' },
  { id: 'build', label: 'Phase de construction (intensité)' },
  { id: 'peak', label: 'Phase de pic (compétition)' },
  { id: 'recovery', label: 'Phase de récupération' }
];

// Fonction utilitaire pour rechercher des recettes avec divers filtres
const searchRecipes = ({
  query = '',
  mealType = 'all',
  difficulty = 'all',
  prepTime = 'all',
  dietaryPreference = 'all',
  trainingPhase = 'all',
  nutrientFocus = 'all'
} = {}) => {
  let filteredRecipes = [...allRecipes];
  
  // Filtrer par type de repas
  if (mealType !== 'all') {
    filteredRecipes = filteredRecipes.filter(recipe => recipe.mealType === mealType);
  }
  
  // Filtrer par difficulté
  if (difficulty !== 'all') {
    filteredRecipes = filteredRecipes.filter(recipe => recipe.difficulty === difficulty);
  }
  
  // Filtrer par temps de préparation
  if (prepTime !== 'all') {
    const selectedRange = prepTimeRanges.find(range => range.id === prepTime);
    if (selectedRange && selectedRange.maxMinutes) {
      filteredRecipes = filteredRecipes.filter(recipe => 
        recipe.prepTimeMinutes <= selectedRange.maxMinutes
      );
    }
  }
  
  // Filtrer par préférence alimentaire
  if (dietaryPreference !== 'all') {
    filteredRecipes = filteredRecipes.filter(recipe => 
      recipe.dietaryPreferences && recipe.dietaryPreferences.includes(dietaryPreference)
    );
  }
  
  // Filtrer par phase d'entraînement
  if (trainingPhase !== 'all') {
    filteredRecipes = filteredRecipes.filter(recipe => 
      recipe.recommendedFor && 
      recipe.recommendedFor.trainingPhases && 
      recipe.recommendedFor.trainingPhases.includes(trainingPhase)
    );
  }
  
  // Filtrer par focus nutritionnel
  if (nutrientFocus !== 'all') {
    filteredRecipes = filteredRecipes.filter(recipe => 
      recipe.nutrientFocus === nutrientFocus
    );
  }
  
  // Recherche textuelle
  if (query && query.trim() !== '') {
    const searchTerms = query.toLowerCase().trim().split(/\s+/);
    filteredRecipes = filteredRecipes.filter(recipe => 
      searchTerms.every(term => 
        recipe.name.toLowerCase().includes(term) || 
        recipe.description.toLowerCase().includes(term) ||
        (recipe.ingredients && recipe.ingredients.some(ing => 
          typeof ing === 'string' 
            ? ing.toLowerCase().includes(term)
            : ing.name && ing.name.toLowerCase().includes(term)
        ))
      )
    );
  }
  
  return filteredRecipes;
};

export {
  // Collections de recettes
  allRecipes,
  breakfastRecipes,
  preRideRecipes,
  duringRideRecipes,
  postRideRecipes,
  snackRecipes,
  recipesById,
  recipesByCategory,
  
  // Métadonnées pour filtres
  mealTypes,
  difficultyLevels,
  prepTimeRanges,
  dietaryPreferences,
  nutrientFocus,
  trainingPhases,
  
  // Fonction utilitaire
  searchRecipes
};
