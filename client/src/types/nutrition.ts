/**
 * Types et interfaces pour le module de nutrition
 */

/**
 * Interface représentant les données nutritionnelles d'un utilisateur
 */
export interface UserNutritionData {
  /** ID unique de l'utilisateur */
  userId: string;
  /** Métabolisme de base (calories) */
  bmr?: number;
  /** Besoins caloriques quotidiens */
  dailyCalories?: number;
  /** Besoins en macronutriments */
  macros?: {
    /** Besoins en protéines (g) */
    protein: number;
    /** Besoins en glucides (g) */
    carbs: number; 
    /** Besoins en lipides (g) */
    fat: number;
  };
  /** Préférences alimentaires */
  preferences?: {
    /** Régime alimentaire (omnivore, végétarien, etc.) */
    diet?: string;
    /** Allergies alimentaires */
    allergies?: string[];
    /** Aliments à éviter */
    avoidances?: string[];
  };
  /** Journal alimentaire récent */
  recentMeals?: Meal[];
  /** Date de dernière mise à jour */
  updatedAt?: string;
}

/**
 * Interface représentant un repas
 */
export interface Meal {
  /** ID unique du repas */
  id?: string;
  /** ID de l'utilisateur */
  userId?: string;
  /** Date et heure du repas */
  timestamp: string | Date;
  /** Type de repas (petit déjeuner, déjeuner, etc.) */
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre-ride' | 'during-ride' | 'post-ride';
  /** Titre du repas */
  title: string;
  /** Description du repas */
  description?: string;
  /** Aliments consommés */
  foods: MealFood[];
  /** Valeurs nutritionnelles totales */
  nutritionValues: NutritionValues;
  /** Lié à une activité spécifique ? */
  activityId?: string;
}

/**
 * Interface représentant un aliment dans un repas
 */
export interface MealFood {
  /** ID de l'aliment */
  foodId: string;
  /** Nom de l'aliment */
  name: string;
  /** Quantité (g ou ml) */
  quantity: number;
  /** Unité de mesure */
  unit: string;
  /** Valeurs nutritionnelles pour cette portion */
  nutritionValues: NutritionValues;
}

/**
 * Interface représentant les valeurs nutritionnelles
 */
export interface NutritionValues {
  /** Calories (kcal) */
  calories: number;
  /** Protéines (g) */
  protein: number;
  /** Glucides (g) */
  carbs: number;
  /** - dont sucres (g) */
  sugar?: number;
  /** Lipides (g) */
  fat: number;
  /** - dont graisses saturées (g) */
  saturatedFat?: number;
  /** Fibres (g) */
  fiber?: number;
  /** Sodium (mg) */
  sodium?: number;
  /** Potassium (mg) */
  potassium?: number;
  /** Autres micronutriments */
  micronutrients?: Record<string, number>;
}

/**
 * Interface représentant une recette
 */
export interface Recipe {
  /** ID unique de la recette */
  id: string;
  /** Titre de la recette */
  title: string;
  /** Description de la recette */
  description: string;
  /** URL de l'image */
  imageUrl?: string;
  /** Temps de préparation (minutes) */
  prepTime: number;
  /** Temps de cuisson (minutes) */
  cookTime: number;
  /** Niveau de difficulté (1-5) */
  difficulty: number;
  /** Nombre de portions */
  servings: number;
  /** Type de recette */
  type: 'pre-ride' | 'post-ride' | 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'recovery';
  /** Ingrédients */
  ingredients: RecipeIngredient[];
  /** Étapes de préparation */
  steps: string[];
  /** Valeurs nutritionnelles (par portion) */
  nutritionValues: NutritionValues;
  /** Tags */
  tags: string[];
  /** Adapté pour quels types d'effort ? */
  suitableFor?: ('endurance' | 'intensity' | 'recovery' | 'general')[];
}

/**
 * Interface représentant un ingrédient dans une recette
 */
export interface RecipeIngredient {
  /** ID de l'ingrédient */
  id?: string;
  /** Nom de l'ingrédient */
  name: string;
  /** Quantité */
  quantity: number;
  /** Unité */
  unit: string;
  /** Notes spécifiques */
  notes?: string;
}

/**
 * Interface représentant un plan de repas
 */
export interface MealPlan {
  /** ID unique du plan */
  id: string;
  /** Titre du plan */
  title: string;
  /** Description du plan */
  description: string;
  /** Type de plan */
  type: 'ride-day' | 'recovery-day' | 'training-day' | 'custom';
  /** Durée du plan (jours) */
  duration: number;
  /** Pour quel objectif ? */
  goal?: 'performance' | 'weight-loss' | 'recovery' | 'general';
  /** Pour quel niveau d'effort ? */
  intensity?: 'low' | 'medium' | 'high';
  /** Repas par jour */
  days: MealPlanDay[];
  /** Valeurs nutritionnelles totales par jour */
  dailyNutritionAverage: NutritionValues;
}

/**
 * Interface représentant un jour dans un plan de repas
 */
export interface MealPlanDay {
  /** Numéro du jour */
  dayNumber: number;
  /** Titre du jour */
  title?: string;
  /** Description du jour */
  description?: string;
  /** Repas de la journée */
  meals: MealPlanMeal[];
  /** Valeurs nutritionnelles totales */
  totalNutrition: NutritionValues;
}

/**
 * Interface représentant un repas dans un plan
 */
export interface MealPlanMeal {
  /** Type de repas */
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre-ride' | 'during-ride' | 'post-ride';
  /** Heure recommandée */
  recommendedTime?: string;
  /** Recette utilisée */
  recipe: Recipe;
  /** Ajustement de portion */
  servingAdjustment?: number;
}

/**
 * Paramètres pour le calcul des besoins nutritionnels
 */
export interface NutritionCalculationParams {
  /** Données utilisateur */
  userData: {
    /** Genre */
    gender: 'male' | 'female' | 'other';
    /** Âge */
    age: number;
    /** Poids (kg) */
    weight: number;
    /** Taille (cm) */
    height: number;
    /** Niveau d'activité quotidienne (hors cyclisme) */
    activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active';
  };
  /** Données d'activité cycliste */
  activityData: {
    /** Type d'activité */
    type: 'race' | 'training' | 'leisure' | 'recovery';
    /** Durée prévue (minutes) */
    duration: number;
    /** Intensité prévue (1-5) */
    intensity: number;
    /** Dénivelé positif prévu (m) */
    elevationGain?: number;
    /** Température extérieure (°C) */
    temperature?: number;
  };
}

/**
 * Paramètres des requêtes API
 */
export interface NutritionApiParams {
  /** Paramètres pour récupérer les plans de repas */
  getMealPlans?: {
    /** ID utilisateur */
    userId?: string;
    /** Type de plan */
    type?: 'ride-day' | 'recovery-day' | 'training-day';
    /** Niveau d'intensité */
    intensity?: 'low' | 'medium' | 'high';
    /** Objectif */
    goal?: 'performance' | 'weight-loss' | 'recovery' | 'general';
  };
  
  /** Paramètres pour récupérer les recettes */
  getRecipes?: {
    /** Type de recette */
    type?: string;
    /** Tags à inclure */
    tags?: string[];
    /** Niveau de difficulté max */
    maxDifficulty?: number;
    /** Temps de préparation max (minutes) */
    maxPrepTime?: number;
    /** Adapté pour quel type d'effort */
    suitableFor?: string;
  };
}

/**
 * Réponse d'API pour les favoris
 */
export interface FavoriteResponse {
  /** Succès de l'opération */
  success: boolean;
  /** Message */
  message?: string;
  /** ID de l'utilisateur */
  userId: string;
  /** ID de la recette */
  recipeId: string;
}

/**
 * Interface représentant les préférences nutritionnelles d'un utilisateur
 */
export interface UserPreferences {
  /** ID de l'utilisateur */
  userId: string;
  /** Objectif nutritionnel */
  goal: 'performance' | 'weight-loss' | 'recovery' | 'general';
  /** Restrictions alimentaires */
  dietaryRestrictions?: string[];
  /** Préférences de macronutriments */
  macroPreferences?: {
    /** Pourcentage de protéines */
    proteinPercentage: number;
    /** Pourcentage de glucides */
    carbsPercentage: number;
    /** Pourcentage de lipides */
    fatPercentage: number;
  };
  /** Aliments préférés */
  preferredFoods?: string[];
  /** Aliments à éviter */
  avoidFoods?: string[];
  /** Préférences de repas */
  mealPreferences?: {
    /** Nombre de repas par jour */
    mealsPerDay: number;
    /** Préfère les petits repas fréquents */
    preferSmallFrequentMeals: boolean;
    /** Heure du premier repas */
    firstMealTime?: string;
    /** Heure du dernier repas */
    lastMealTime?: string;
  };
  /** Préférences d'hydratation */
  hydrationPreferences?: {
    /** Objectif quotidien (ml) */
    dailyTarget: number;
    /** Préfère les boissons avec électrolytes */
    preferElectrolytes: boolean;
  };
  /** Dernière mise à jour */
  updatedAt: string;
}

/**
 * Interface représentant les favoris d'un utilisateur
 */
export interface UserFavorites {
  /** ID de l'utilisateur */
  userId: string;
  /** Recettes favorites */
  recipes: string[];
  /** Aliments favoris */
  foods: string[];
  /** Plans de repas favoris */
  mealPlans: string[];
}
