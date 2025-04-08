/**
 * Types et interfaces pour l'API Velo-Altitude
 */

// Type pour représenter un col
export interface Col {
  id: string;
  name: string;
  region: string;
  country: string;
  altitude: number;
  difficulty: string;
  length: number;
  gradient: number;
  imageUrl?: string;
  description?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  tags?: string[];
}

// Type pour représenter un profil utilisateur
export interface UserProfile {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  preferences?: {
    language?: string;
    units?: string;
    theme?: string;
  };
  stats?: {
    totalDistance?: number;
    totalElevation?: number;
    totalActivities?: number;
  };
  registeredDate: string;
  lastActive?: string;
}

// Type pour les activités
export interface Activity {
  id: string;
  userId: string;
  title: string;
  type: string;
  date: string;
  distance: number;
  duration: number;
  elevation?: number;
  avgSpeed?: number;
  maxSpeed?: number;
  avgPower?: number;
  normalizedPower?: number;
  colsClimbed?: string[];
  description?: string;
  stravaId?: string;
  routeData?: any;
}

// Type pour les défis 7 Majeurs
export interface Majeurs7Challenge {
  id: string;
  name: string;
  description: string;
  region: string;
  cols: Col[];
  imageUrl?: string;
  difficulty: string;
  totalDistance: number;
  totalElevation: number;
}

// Type pour la progression d'un défi
export interface Majeurs7Progress {
  userId: string;
  challengeId: string;
  startDate: string;
  completedCols: {
    colId: string;
    completedDate: string;
    activityId?: string;
  }[];
  isCompleted: boolean;
  completionDate?: string;
}

// Type pour les données météo
export interface WeatherData {
  temperature: number;
  windSpeed: number;
  windDirection: number;
  precipitation: number;
  humidity: number;
  pressure: number;
  visibility: number;
  cloudCover: number;
  iconCode: string;
  description: string;
  timestamp: string;
}

// Type pour les plans d'entraînement
export interface TrainingPlan {
  id: string;
  userId: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  type: string;
  objective: string;
  weeklyHours: number;
  sessions: TrainingSession[];
}

// Type pour les sessions d'entraînement
export interface TrainingSession {
  id: string;
  planId: string;
  name: string;
  type: string;
  description?: string;
  scheduledDate: string;
  duration: number;
  targetIntensity?: string;
  targetPower?: number;
  completedDate?: string;
  metrics?: {
    actualPower?: number;
    tss?: number;
    if?: number;
  };
}

// Type pour l'historique FTP
export interface FTPRecord {
  id: string;
  userId: string;
  value: number;
  date: string;
  method: string;
  note?: string;
}

// Type pour le plan nutritionnel
export interface NutritionPlan {
  id: string;
  userId: string;
  name: string;
  objective: string;
  dailyCalories: number;
  macroRatio: {
    carbs: number;
    protein: number;
    fat: number;
  };
  specialRestrictions?: string[];
  createdAt: string;
  updatedAt: string;
}

// Type pour le journal nutritionnel
export interface NutritionLog {
  id: string;
  userId: string;
  date: string;
  entries: NutritionEntry[];
  summary: {
    totalCalories: number;
    totalCarbs: number;
    totalProtein: number;
    totalFat: number;
    hydration: number;
  };
}

// Type pour une entrée nutritionnelle
export interface NutritionEntry {
  id: string;
  userId: string;
  date: string;
  mealType: string;
  items: {
    name: string;
    quantity: number;
    unit: string;
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
  }[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Type pour une recette nutritionnelle
export interface NutritionRecipe {
  id: string;
  name: string;
  description: string;
  preparationTime: number;
  servings: number;
  ingredients: {
    name: string;
    quantity: number;
    unit: string;
  }[];
  instructions: string[];
  nutritionPerServing: {
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
  };
  tags: string[];
  imageUrl?: string;
}

// Types pour le forum
export interface ForumCategory {
  id: string;
  name: string;
  description: string;
  topics: number;
  lastActivity?: string;
}

export interface ForumTopic {
  id: string;
  categoryId: string;
  title: string;
  author: {
    id: string;
    username: string;
    profilePicture?: string;
  };
  createdAt: string;
  updatedAt: string;
  replies: number;
  views: number;
  isPinned: boolean;
  isLocked: boolean;
}

export interface ForumPost {
  id: string;
  topicId: string;
  author: {
    id: string;
    username: string;
    profilePicture?: string;
  };
  content: string;
  createdAt: string;
  updatedAt?: string;
  isEdited: boolean;
  likes: number;
}

// Interface pour l'orchestrateur d'API
export interface ApiOrchestrator {
  // Cols
  getAllCols: () => Promise<Col[]>;
  getColById: (id: string) => Promise<Col>;
  getColsByRegion: (region: string) => Promise<Col[]>;
  getColsByDifficulty: (difficulty: string) => Promise<Col[]>;
  searchCols: (query: string) => Promise<Col[]>;
  
  // Utilisateurs
  getUserProfile: (userId: string) => Promise<UserProfile>;
  updateUserProfile: (userId: string, data: Partial<UserProfile>) => Promise<UserProfile>;
  getUserActivities: (userId: string, page?: number, pageSize?: number) => Promise<{ activities: Activity[], total: number }>;
  
  // Activités
  createActivity: (activity: Partial<Activity>) => Promise<Activity>;
  getActivity: (id: string) => Promise<Activity>;
  updateActivity: (id: string, data: Partial<Activity>) => Promise<Activity>;
  deleteActivity: (id: string) => Promise<void>;
  
  // 7 Majeurs
  getAllMajeurs7Challenges: () => Promise<Majeurs7Challenge[]>;
  getMajeurs7Challenge: (id: string) => Promise<Majeurs7Challenge>;
  startMajeurs7Challenge: (userId: string, challengeId: string) => Promise<Majeurs7Progress>;
  getMajeurs7Progress: (userId: string, challengeId: string) => Promise<Majeurs7Progress>;
  updateMajeurs7Progress: (userId: string, progress: Partial<Majeurs7Progress>) => Promise<Majeurs7Progress>;
  
  // Météo
  getColWeather: (colId: string) => Promise<WeatherData>;
  getLocationWeather: (lat: number, lng: number) => Promise<WeatherData>;
  getWeatherForecast: (colId: string, days?: number) => Promise<WeatherData[]>;
  
  // Entraînement
  getUserTrainingPlans: (userId: string) => Promise<TrainingPlan[]>;
  getTrainingPlan: (planId: string) => Promise<TrainingPlan>;
  createTrainingPlan: (plan: Partial<TrainingPlan>) => Promise<TrainingPlan>;
  updateTrainingPlan: (planId: string, data: Partial<TrainingPlan>) => Promise<TrainingPlan>;
  updateFTP: (userId: string, value: number, method: string) => Promise<FTPRecord>;
  getFTPHistory: (userId: string) => Promise<FTPRecord[]>;
  
  // Nutrition
  getUserNutritionPlan: (userId: string) => Promise<NutritionPlan>;
  updateNutritionPlan: (planId: string, data: Partial<NutritionPlan>) => Promise<NutritionPlan>;
  getNutritionLog: (userId: string, date: string) => Promise<NutritionLog>;
  createNutritionLogEntry: (userId: string, log: Partial<NutritionEntry>) => Promise<NutritionEntry>;
  getNutritionRecipes: (query?: string, tags?: string[]) => Promise<NutritionRecipe[]>;
  getNutritionRecipe: (recipeId: string) => Promise<NutritionRecipe>;
  
  // Forum
  getForumCategories: () => Promise<ForumCategory[]>;
  getForumTopics: (categoryId: string, page?: number, pageSize?: number) => Promise<{ topics: ForumTopic[], total: number }>;
  getForumPosts: (topicId: string, page?: number, pageSize?: number) => Promise<{ posts: ForumPost[], total: number }>;
  createForumTopic: (categoryId: string, title: string, content: string) => Promise<ForumTopic>;
  createForumPost: (topicId: string, content: string) => Promise<ForumPost>;
  
  // Auth
  login: (email: string, password: string) => Promise<{ token: string; user: UserProfile }>;
  register: (userData: { email: string; password: string; username: string }) => Promise<{ token: string; user: UserProfile }>;
  refreshToken: () => Promise<{ token: string }>;
  logout: () => Promise<void>;
  
  // Strava
  connectStrava: (userId: string, code: string) => Promise<{ success: boolean }>;
  disconnectStrava: (userId: string) => Promise<{ success: boolean }>;
  syncStravaActivities: (userId: string) => Promise<{ success: boolean; activitiesCount: number }>;
  
  // Recherche
  searchGlobal: (query: string) => Promise<{
    cols: Col[];
    activities: Activity[];
    topics: ForumTopic[];
  }>;
}

// Type pour la réponse d'API
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: any;
}

// Type pour les options de requête
export interface ApiRequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  withAuth?: boolean;
}

// Type pour les erreurs API
export interface ApiError {
  status: number;
  message: string;
  code?: string;
  details?: any;
}
