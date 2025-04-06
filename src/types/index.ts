// Types pour les routes et cols
export interface Col {
  id: string;
  name: string;
  region: string;
  country: string;
  elevation: number;
  length: number;
  avgGradient: number;
  maxGradient: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
  coordinates: [number, number]; // [longitude, latitude]
  description?: string;
  imageUrl?: string;
  pointsOfInterest?: PointOfInterest[];
  startCoordinates?: [number, number];
  endCoordinates?: [number, number];
  routeProfile?: RoutePoint[];
}

export interface PointOfInterest {
  id: string;
  name: string;
  type: 'restaurant' | 'viewpoint' | 'landmark' | 'water' | 'parking' | 'other';
  coordinates: [number, number];
  description?: string;
  imageUrl?: string;
  distance?: number; // Distance depuis le début du parcours en km
}

export interface RoutePoint {
  distance: number; // Distance depuis le début en km
  elevation: number; // Altitude en mètres
  gradient?: number; // Pente en pourcentage
  coordinates: [number, number]; // [longitude, latitude]
}

// Types pour la météo
export interface Weather {
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
  };
  weather: {
    id: number;
    main: string;
    description: string;
    icon: string;
  }[];
  wind: {
    speed: number;
    deg: number;
  };
  clouds: {
    all: number;
  };
  dt: number; // Timestamp
}

// Types pour les itinéraires
export interface Route {
  id: string;
  name: string;
  description?: string;
  coordinates: [number, number][]; // Array de [longitude, latitude]
  elevation: {
    coordinate: [number, number];
    elevation: number;
  }[];
  statistics?: {
    distance: number;
    elevationGain: number;
    elevationLoss: number;
    lowestPoint: number;
    highestPoint: number;
    grade: number;
  };
  weather?: {
    start: Weather;
    end?: Weather;
  };
  cols?: Col[];
  pointsOfInterest?: PointOfInterest[];
}

// Types pour les défis "7 Majeurs"
export interface Challenge {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: string;
  isPublic: boolean;
  cols: Col[];
  totalElevation: number;
  totalDistance: number;
  difficulty: number; // Score de difficulté calculé
  completedBy?: number; // Nombre de cyclistes ayant complété le défi
  imageUrl?: string;
}

// Types pour les profils utilisateurs
export interface User {
  id: string;
  firstname: string;
  lastname: string;
  city?: string;
  country?: string;
  sex?: 'M' | 'F';
  weight?: number;
  height?: number;
  ftp?: number;
  created_at: string;
  profile?: string; // URL de l'image de profil
  activities?: Activity[];
  nutritionPreferences?: NutritionPreferences;
}

// Types pour les activités
export interface Activity {
  id: string;
  name: string;
  type: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  start_date: string;
  start_latlng?: [number, number];
  end_latlng?: [number, number];
  map?: {
    summary_polyline: string;
  };
}

// Types pour le module Nutrition
export interface Recipe {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  prepTime: number; // Temps de préparation en minutes
  calories: number;
  servings: number;
  ingredients: Ingredient[];
  instructions: string[];
  nutritionFacts: NutritionFacts;
  tags: string[]; // Ex: "avant-effort", "récupération", "végétarien", etc.
  category: 'before' | 'during' | 'after' | 'special'; // Avant, pendant, après effort, spécial cols
  difficulty: 'easy' | 'medium' | 'hard';
  authorId?: string; // Utilisateur qui a créé ou partagé la recette
  publicId?: string; // Identifiant pour les recettes publiques
  createdAt: string;
  updatedAt: string;
}

export interface Ingredient {
  name: string;
  quantity: number;
  unit: string; // "g", "ml", "cuillère à soupe", etc.
}

export interface NutritionFacts {
  calories: number;
  protein: number; // en grammes
  carbs: number; // en grammes
  sugar?: number; // en grammes
  fat: number; // en grammes
  saturatedFat?: number; // en grammes
  fiber?: number; // en grammes
  sodium?: number; // en mg
  potassium?: number; // en mg
  calcium?: number; // en mg
  iron?: number; // en mg
  vitaminC?: number; // en mg
  vitaminD?: number; // en μg
}

export interface NutritionPlan {
  id: string;
  name: string;
  description: string;
  userId: string;
  targetGoal: 'weight_loss' | 'maintenance' | 'performance' | 'endurance' | 'climbing';
  dailyCalories: number;
  macroRatio: {
    protein: number; // Pourcentage
    carbs: number; // Pourcentage
    fat: number; // Pourcentage
  };
  meals: PlanMeal[];
  createdAt: string;
  updatedAt: string;
}

export interface PlanMeal {
  name: string; // Petit-déjeuner, Déjeuner, Dîner, Collation, etc.
  time: string; // Heure de la journée au format HH:MM
  recipes: { recipeId: string; servings: number }[];
  nutritionGoals?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
}

export interface NutritionPreferences {
  dietaryRestrictions: string[]; // 'vegetarian', 'vegan', 'gluten-free', etc.
  allergies: string[]; // 'dairy', 'nuts', 'shellfish', etc.
  dislikedIngredients: string[];
  favoriteIngredients: string[];
}

export interface NutritionLogEntry {
  id: string;
  userId: string;
  date: string;
  meals: {
    mealType: string;
    recipes: { recipeId: string; servings: number }[];
    customFoods?: {
      name: string;
      calories: number;
      protein?: number;
      carbs?: number;
      fat?: number;
    }[];
  }[];
  water: number; // en millilitres
  notes?: string;
  totalNutrition: NutritionFacts;
}

// Types pour les badges, certifications et classements
export interface Badge {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  category: 'seven-majors' | 'elevation' | 'distance' | 'cols' | 'special';
  difficulty: 'bronze' | 'silver' | 'gold' | 'platinum';
  requirements: {
    challengeId?: string;
    minElevation?: number;
    minDistance?: number;
    minCols?: number;
    minGradient?: number;
    specificRegion?: string;
    specificSeason?: string;
    time?: number; // Temps maximal en secondes
  };
  createdAt: string;
}

export interface Certification {
  id: string;
  userId: string;
  challengeId: string;
  status: 'pending' | 'verified' | 'rejected';
  completionDate: string;
  completionTime?: number; // En secondes
  stravaActivityId?: string;
  gpxFileUrl?: string;
  photoUrls?: string[];
  description?: string;
  verifiedAt?: string;
  badgesEarned?: Badge[];
  kudos: number;
  comments?: {
    userId: string;
    comment: string;
    timestamp: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface UserRanking {
  userId: string;
  userName: string;
  userAvatar?: string;
  rank: number;
  challengeId: string;
  challengeName: string;
  completionTime?: number;
  completionDate: string;
  kudos: number;
  badges?: Badge[];
}

export interface Achievement {
  id: string;
  userId: string;
  type: 'challenge' | 'badge' | 'milestone';
  referenceId: string; // Challenge ID ou Badge ID
  name: string;
  description: string;
  imageUrl: string;
  earnedAt: string;
  public: boolean;
}

// Types pour les réponses API
export interface ApiResponse<T> {
  data: T;
  loading: boolean;
  error: Error | null;
}
