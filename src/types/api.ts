/**
 * Types API pour l'application Velo-Altitude
 * Ce fichier contient les interfaces TypeScript pour tous les modèles de données
 */

// Types communs
export type ApiResponse<T> = {
  data: T;
  status: number;
  message?: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type ApiError = {
  status: number;
  message: string;
  code?: string;
  details?: any;
};

// Types pour les cols
export interface Col {
  id: string;
  name: string;
  region: string;
  elevation: number;
  length: number;
  averageGradient: number;
  maxGradient: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
  startPoint: GeoCoordinates;
  endPoint: GeoCoordinates;
  description: string;
  images: string[];
  profileImage: string;
  mapData: MapData;
  weather?: WeatherData;
  activities?: Activity[];
  relatedCols?: Col[];
  stats?: ColStatistics;
  isPartOf7Majeurs?: boolean;
}

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
  altitude?: number;
}

export interface MapData {
  path: GeoCoordinates[];
  bounds: {
    northeast: GeoCoordinates;
    southwest: GeoCoordinates;
  };
  elevationProfile: ElevationPoint[];
}

export interface ElevationPoint {
  distance: number; // km depuis le départ
  altitude: number; // m
  gradient?: number; // %
}

export interface ColStatistics {
  totalAscents: number;
  averageTime: number; // en secondes
  fastestTime: number; // en secondes
  fastestUser?: string;
  popularity: number; // rang de popularité
  rating: number; // note moyenne sur 5
}

// Types pour les utilisateurs
export interface UserProfile {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  profilePicture?: string;
  bio?: string;
  location?: string;
  registeredAt: string;
  role: 'user' | 'admin' | 'moderator';
  stats: UserStats;
  preferences: UserPreferences;
  socialLinks?: Record<string, string>;
  stravaConnection?: StravaConnection;
}

export interface UserStats {
  totalAscents: number;
  totalDistance: number;
  totalElevation: number;
  achievements: Achievement[];
  majeurs7Progress?: Majeurs7Progress;
  level: number;
  pointsEarned: number;
}

export interface UserPreferences {
  measurementUnit: 'metric' | 'imperial';
  theme: 'light' | 'dark' | 'system';
  emailNotifications: boolean;
  privacySettings: PrivacySettings;
  language: string;
  dashboardLayout?: DashboardLayout;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private';
  activityVisibility: 'public' | 'friends' | 'private';
  showRealName: boolean;
  showLocation: boolean;
}

export interface DashboardLayout {
  widgets: {
    id: string;
    position: { x: number; y: number; w: number; h: number };
    type: string;
    config?: any;
  }[];
}

export interface StravaConnection {
  connected: boolean;
  lastSynced?: string;
  athleteId?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
}

// Types pour les activités
export interface Activity {
  id: string;
  userId: string;
  type: 'cycling' | 'running' | 'hiking' | 'other';
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  distance: number;
  duration: number;
  elevationGain: number;
  averageSpeed: number;
  maxSpeed: number;
  route: GeoCoordinates[];
  colsClimbed?: Col[];
  weather?: WeatherData;
  photos?: string[];
  kudos?: string[]; // IDs des utilisateurs
  comments?: Comment[];
  isPrivate: boolean;
  source?: 'manual' | 'strava' | 'garmin' | 'app';
  sourceId?: string; // ID externe de l'activité
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  text: string;
  createdAt: string;
  updatedAt?: string;
}

// Types pour la météo
export interface WeatherData {
  current?: CurrentWeather;
  forecast?: WeatherForecast[];
  alerts?: WeatherAlert[];
  lastUpdated: string;
}

export interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  windSpeed: number;
  windDirection: number;
  precipitation: number;
  humidity: number;
  pressure: number;
  visibility: number;
  uvIndex: number;
  conditions: string;
  icon: string;
}

export interface WeatherForecast {
  date: string;
  sunrise: string;
  sunset: string;
  temperatureMin: number;
  temperatureMax: number;
  precipitation: number;
  precipitationProbability: number;
  windSpeed: number;
  conditions: string;
  icon: string;
}

export interface WeatherAlert {
  type: string;
  severity: 'information' | 'warning' | 'severe' | 'extreme';
  title: string;
  description: string;
  startTime: string;
  endTime: string;
}

// Types pour les défis "Les 7 Majeurs"
export interface Majeurs7Challenge {
  id: string;
  name: string;
  description: string;
  region: string;
  cols: Col[];
  totalDistance: number;
  totalElevation: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
  createdBy: string;
  isOfficial: boolean;
  participants: number;
  completions: number;
  image?: string;
}

export interface Majeurs7Progress {
  challengeId: string;
  startDate?: string;
  completedCols: {
    colId: string;
    completionDate: string;
    activityId?: string;
  }[];
  isCompleted: boolean;
  completionDate?: string;
  totalTimeSpent?: number;
}

// Types pour les achievements
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'distance' | 'elevation' | 'speed' | 'cols' | 'challenges' | 'social';
  level: number;
  unlockedAt: string;
}

// Types pour la formation et nutrition
export interface TrainingPlan {
  id: string;
  userId: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  goal: string;
  weeks: TrainingWeek[];
  ftpHistory: FTPEntry[];
  targetEvents?: Event[];
}

export interface TrainingWeek {
  weekNumber: number;
  focus: string;
  targetHours: number;
  workouts: Workout[];
}

export interface Workout {
  id: string;
  day: number;
  title: string;
  description: string;
  type: 'endurance' | 'threshold' | 'vo2max' | 'strength' | 'recovery' | 'race';
  duration: number;
  distance?: number;
  targetPower?: number;
  targetHeartRate?: number;
  completed: boolean;
  notes?: string;
  activityId?: string;
}

export interface FTPEntry {
  value: number;
  date: string;
  method: 'test' | 'estimate' | 'manual';
}

export interface Event {
  id: string;
  name: string;
  description?: string;
  date: string;
  location: string;
  type: 'race' | 'challenge' | 'group ride' | 'other';
  distance?: number;
  elevation?: number;
  url?: string;
}

// Types pour la nutrition
export interface NutritionPlan {
  id: string;
  userId: string;
  name: string;
  description?: string;
  dailyCalorieTarget: number;
  macroSplit: {
    carbs: number; // pourcentage
    protein: number; // pourcentage
    fat: number; // pourcentage
  };
  meals: NutritionMeal[];
  hydrationTarget: number; // ml
  created: string;
  updated: string;
}

export interface NutritionMeal {
  id: string;
  name: string;
  time: string;
  calorieTarget: number;
  recipes: NutritionRecipe[];
  notes?: string;
}

export interface NutritionRecipe {
  id: string;
  name: string;
  description?: string;
  ingredients: NutritionIngredient[];
  instructions: string[];
  prepTime: number;
  calories: number;
  macros: {
    carbs: number;
    protein: number;
    fat: number;
  };
  servings: number;
  image?: string;
  tags: string[];
  isFavorite: boolean;
}

export interface NutritionIngredient {
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  macros: {
    carbs: number;
    protein: number;
    fat: number;
  };
}

export interface NutritionLog {
  id: string;
  userId: string;
  date: string;
  meals: {
    type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    time: string;
    items: {
      name: string;
      quantity: number;
      calories: number;
      macros: {
        carbs: number;
        protein: number;
        fat: number;
      };
    }[];
  }[];
  hydration: number;
  notes?: string;
  totals: {
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
  };
}

// Types pour la communauté
export interface ForumCategory {
  id: string;
  name: string;
  description: string;
  topics: number;
  posts: number;
  lastPost?: {
    id: string;
    title: string;
    author: string;
    date: string;
  };
}

export interface ForumTopic {
  id: string;
  categoryId: string;
  title: string;
  author: {
    id: string;
    username: string;
    avatar?: string;
  };
  createdAt: string;
  views: number;
  replies: number;
  isPinned: boolean;
  isLocked: boolean;
  lastReply?: {
    author: string;
    date: string;
  };
}

export interface ForumPost {
  id: string;
  topicId: string;
  author: {
    id: string;
    username: string;
    avatar?: string;
    role: string;
    postCount: number;
    joinDate: string;
  };
  content: string;
  createdAt: string;
  updatedAt?: string;
  likes: number;
  attachments?: {
    name: string;
    url: string;
    type: string;
  }[];
}

// Interface principale de l'orchestrateur API
export interface ApiOrchestrator {
  // Services des cols
  getAllCols: () => Promise<Col[]>;
  getColById: (id: string) => Promise<Col>;
  getColsByRegion: (region: string) => Promise<Col[]>;
  getColsByDifficulty: (difficulty: string) => Promise<Col[]>;
  searchCols: (query: string) => Promise<Col[]>;
  
  // Services utilisateur
  getUserProfile: (userId: string) => Promise<UserProfile>;
  updateUserProfile: (userId: string, data: Partial<UserProfile>) => Promise<UserProfile>;
  getUserActivities: (userId: string, page?: number, pageSize?: number) => Promise<PaginatedResponse<Activity>>;
  
  // Services d'activité
  createActivity: (activity: Omit<Activity, 'id'>) => Promise<Activity>;
  getActivity: (id: string) => Promise<Activity>;
  updateActivity: (id: string, data: Partial<Activity>) => Promise<Activity>;
  deleteActivity: (id: string) => Promise<void>;
  
  // Services des défis 7 Majeurs
  getAllMajeurs7Challenges: () => Promise<Majeurs7Challenge[]>;
  getMajeurs7Challenge: (id: string) => Promise<Majeurs7Challenge>;
  startMajeurs7Challenge: (userId: string, challengeId: string) => Promise<Majeurs7Progress>;
  getMajeurs7Progress: (userId: string, challengeId: string) => Promise<Majeurs7Progress>;
  updateMajeurs7Progress: (userId: string, progress: Partial<Majeurs7Progress>) => Promise<Majeurs7Progress>;
  
  // Services météo
  getColWeather: (colId: string) => Promise<WeatherData>;
  getLocationWeather: (lat: number, lng: number) => Promise<WeatherData>;
  getWeatherForecast: (colId: string, days: number) => Promise<WeatherForecast[]>;
  
  // Services d'entraînement
  getUserTrainingPlans: (userId: string) => Promise<TrainingPlan[]>;
  getTrainingPlan: (planId: string) => Promise<TrainingPlan>;
  createTrainingPlan: (plan: Omit<TrainingPlan, 'id'>) => Promise<TrainingPlan>;
  updateTrainingPlan: (planId: string, data: Partial<TrainingPlan>) => Promise<TrainingPlan>;
  updateFTP: (userId: string, value: number, method: FTPEntry['method']) => Promise<FTPEntry>;
  getFTPHistory: (userId: string) => Promise<FTPEntry[]>;
  
  // Services de nutrition
  getUserNutritionPlan: (userId: string) => Promise<NutritionPlan>;
  updateNutritionPlan: (planId: string, data: Partial<NutritionPlan>) => Promise<NutritionPlan>;
  getNutritionLog: (userId: string, date: string) => Promise<NutritionLog>;
  createNutritionLogEntry: (log: Omit<NutritionLog, 'id'>) => Promise<NutritionLog>;
  getNutritionRecipes: (query?: string, tags?: string[]) => Promise<NutritionRecipe[]>;
  getNutritionRecipe: (recipeId: string) => Promise<NutritionRecipe>;
  
  // Services de forum et communauté
  getForumCategories: () => Promise<ForumCategory[]>;
  getForumTopics: (categoryId: string, page?: number, pageSize?: number) => Promise<PaginatedResponse<ForumTopic>>;
  getForumPosts: (topicId: string, page?: number, pageSize?: number) => Promise<PaginatedResponse<ForumPost>>;
  createForumTopic: (categoryId: string, title: string, content: string) => Promise<ForumTopic>;
  createForumPost: (topicId: string, content: string) => Promise<ForumPost>;
  
  // Services d'authentification
  login: (email: string, password: string) => Promise<{ token: string; user: UserProfile }>;
  register: (userData: { email: string; password: string; username: string }) => Promise<{ token: string; user: UserProfile }>;
  refreshToken: () => Promise<{ token: string }>;
  logout: () => Promise<void>;
  
  // Services Strava
  connectStrava: (userId: string, authCode: string) => Promise<StravaConnection>;
  disconnectStrava: (userId: string) => Promise<void>;
  syncStravaActivities: (userId: string) => Promise<Activity[]>;
  
  // Services de recherche
  searchGlobal: (query: string) => Promise<{
    cols: Col[];
    users: UserProfile[];
    activities: Activity[];
    topics: ForumTopic[];
  }>;
}
