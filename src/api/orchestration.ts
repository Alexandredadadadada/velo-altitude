import axios from 'axios';

// Types pour la gestion des journaux nutritionnels
export interface NutritionLog {
  id?: string;
  date: string;
  mealType: string;
  foodName: string;
  portion: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  notes?: string;
}

// Types pour les plans nutritionnels
export interface NutritionPlan {
  id?: string;
  name: string;
  description: string;
  dailyCalories: number;
  macroRatio: {
    protein: number;
    carbs: number;
    fat: number;
  };
  meals: {
    name: string;
    time: string;
    description: string;
    foods: Array<{
      name: string;
      portion: number;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    }>;
  }[];
  targetWeight?: number;
  goal: 'performance' | 'weightLoss' | 'weightGain' | 'maintenance';
  cyclingProfile: 'endurance' | 'climber' | 'sprinter' | 'allRounder';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Type pour les recettes
export interface Recipe {
  id?: string;
  name: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  preparationTime: number;
  cookingTime: number;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  tags: string[];
  category: 'pre' | 'during' | 'post' | 'recovery' | 'general';
  difficulty: 'easy' | 'medium' | 'hard';
  imageUrl: string;
  author?: string;
  ratings?: {
    average: number;
    count: number;
  };
  createdAt: string;
  updatedAt: string;
}

// Type pour les séances d'entraînement
export interface TrainingSession {
  id: string;
  title: string;
  date: string;
  type: 'Endurance' | 'Intensité' | 'HIIT' | 'Ascension' | 'Récupération';
  duration: number;
  description: string;
  intensityScore: number; // 0-100
  estimatedCaloriesBurn: number;
  targets: {
    power?: number;
    heartRate?: number;
    cadence?: number;
  };
  intervals?: {
    work: number;
    rest: number;
    sets: number;
  };
}

/**
 * Classe pour orchestrer toutes les requêtes API de l'application
 */
export class APIOrchestrator {
  private apiBaseUrl: string;
  private mockMode: boolean;
  private cacheStore: Map<string, {data: any, timestamp: number}>;
  // Durées de vie du cache en millisecondes
  private cacheTTL = {
    nutrition: 5 * 60 * 1000, // 5 minutes pour les données nutritionnelles
    training: 10 * 60 * 1000, // 10 minutes pour les données d'entraînement
    strava: 15 * 60 * 1000,   // 15 minutes pour les données Strava
    ai: 30 * 60 * 1000,       // 30 minutes pour les suggestions AI
    default: 10 * 60 * 1000   // 10 minutes par défaut
  };

  constructor() {
    // En environnement de production, utilisez l'URL réelle de l'API
    this.apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.velo-altitude.fr';
    
    // Mode mock pour le développement local ou les démos
    this.mockMode = process.env.NEXT_PUBLIC_MOCK_API === 'true' || process.env.NODE_ENV !== 'production';
    
    // Initialisation du cache
    this.cacheStore = new Map();
    
    // Configuration d'Axios avec les intercepteurs nécessaires
    axios.interceptors.request.use(config => {
      // Ajouter les headers d'autorisation si nécessaire
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  /**
   * Récupère une entrée du cache
   * @param key Clé de l'entrée à récupérer
   * @param category Catégorie de la donnée (pour déterminer le TTL)
   * @returns Donnée en cache ou null si non trouvée ou expirée
   */
  private getCachedData<T>(key: string, category: keyof typeof this.cacheTTL = 'default'): T | null {
    const cacheEntry = this.cacheStore.get(key);
    
    if (!cacheEntry) {
      return null;
    }
    
    const now = Date.now();
    const ttl = this.cacheTTL[category] || this.cacheTTL.default;
    
    // Vérifier si l'entrée est expirée
    if (now - cacheEntry.timestamp > ttl) {
      this.cacheStore.delete(key);
      return null;
    }
    
    return cacheEntry.data as T;
  }

  /**
   * Stocke une entrée dans le cache
   * @param key Clé de l'entrée à stocker
   * @param data Données à stocker
   */
  private setCachedData<T>(key: string, data: T): void {
    this.cacheStore.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Vide le cache de l'orchestrateur API
   * @param cacheType Type de cache à vider ('all' pour tout vider, ou spécifier un type spécifique)
   */
  clearCache(cacheType: 'all' | 'nutrition' | 'training' | 'strava' | 'ai' = 'all'): void {
    if (cacheType === 'all') {
      // Vider tout le cache
      this.cacheStore.clear();
      console.log('Cache API entièrement vidé');
      return;
    }
    
    // Filtrer les clés du cache qui commencent par le type spécifié
    const keysToRemove: string[] = [];
    this.cacheStore.forEach((_, key) => {
      if (key.startsWith(cacheType)) {
        keysToRemove.push(key);
      }
    });
    
    // Supprimer les entrées du cache correspondantes
    keysToRemove.forEach(key => {
      this.cacheStore.delete(key);
    });
    
    console.log(`Cache API de type '${cacheType}' vidé (${keysToRemove.length} entrées)`);
  }

  /**
   * Récupère les entrées du journal nutritionnel pour une date spécifique
   */
  async getNutritionLogEntries(date: string): Promise<NutritionLog[]> {
    // Vérifier si les données sont en cache
    const cacheKey = `nutrition:log:${date}`;
    const cachedData = this.getCachedData<NutritionLog[]>(cacheKey, 'nutrition');
    
    if (cachedData) {
      console.log(`Utilisation des données en cache pour ${cacheKey}`);
      return cachedData;
    }
    
    if (this.mockMode) {
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Retourner des données mockées
      const mockData = [
        {
          id: '1',
          date,
          mealType: 'petit-déjeuner',
          foodName: 'Porridge aux fruits rouges',
          portion: 1,
          calories: 350,
          protein: 12,
          carbs: 45,
          fat: 10,
          notes: 'Ajout de miel et de myrtilles'
        },
        {
          id: '2',
          date,
          mealType: 'déjeuner',
          foodName: 'Pâtes complètes aux légumes',
          portion: 1,
          calories: 450,
          protein: 18,
          carbs: 65,
          fat: 12,
          notes: 'Avec sauce tomate maison'
        },
        {
          id: '3',
          date,
          mealType: 'collation',
          foodName: 'Barre énergétique',
          portion: 1,
          calories: 180,
          protein: 8,
          carbs: 25,
          fat: 5,
          notes: 'Avant l\'entraînement'
        }
      ];
      
      // Mettre en cache les données mockées
      this.setCachedData(cacheKey, mockData);
      return mockData;
    }
    
    try {
      // Requête API réelle
      const response = await axios.get(`${this.apiBaseUrl}/nutrition/log/${date}`);
      // Mettre en cache les données récupérées
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des données nutritionnelles pour la date ${date}:`, error);
      throw error;
    }
  }

  /**
   * Récupère le plan nutritionnel actif de l'utilisateur
   */
  async getActiveNutritionPlan(): Promise<NutritionPlan | null> {
    // Vérifier si les données sont en cache
    const cacheKey = 'nutrition:plan:active';
    const cachedData = this.getCachedData<NutritionPlan | null>(cacheKey, 'nutrition');
    
    if (cachedData !== null) {
      console.log(`Utilisation des données en cache pour ${cacheKey}`);
      return cachedData;
    }
    
    if (this.mockMode) {
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // Retourner un plan mockée
      const mockData = {
        id: 'plan-123',
        name: 'Plan Performance Cycliste',
        description: 'Plan nutritionnel optimisé pour les performances en cyclisme de montagne',
        dailyCalories: 2400,
        macroRatio: {
          protein: 25,
          carbs: 55,
          fat: 20
        },
        meals: [
          {
            name: 'Petit-déjeuner',
            time: '07:00',
            description: 'Riche en glucides complexes pour l\'énergie',
            foods: [
              {
                name: 'Porridge d\'avoine',
                portion: 1,
                calories: 300,
                protein: 10,
                carbs: 50,
                fat: 5
              },
              {
                name: 'Banane',
                portion: 1,
                calories: 105,
                protein: 1,
                carbs: 27,
                fat: 0
              }
            ]
          },
          {
            name: 'Déjeuner',
            time: '12:30',
            description: 'Équilibré en protéines et glucides',
            foods: [
              {
                name: 'Pâtes complètes',
                portion: 1,
                calories: 350,
                protein: 12,
                carbs: 70,
                fat: 2
              },
              {
                name: 'Blanc de poulet',
                portion: 1,
                calories: 165,
                protein: 31,
                carbs: 0,
                fat: 3.6
              }
            ]
          }
        ],
        goal: 'performance',
        cyclingProfile: 'climber',
        isActive: true,
        createdAt: '2023-03-15T10:00:00Z',
        updatedAt: '2023-04-01T14:30:00Z'
      } as NutritionPlan;
      
      // Mettre en cache les données mockées
      this.setCachedData(cacheKey, mockData);
      return mockData;
    }
    
    try {
      // Requête API réelle
      const response = await axios.get(`${this.apiBaseUrl}/nutrition/plans/active`);
      // Mettre en cache les données récupérées
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      // Si aucun plan actif n'est trouvé, retourner null
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        // Mettre en cache le résultat null
        this.setCachedData(cacheKey, null);
        return null;
      }
      console.error('Erreur lors de la récupération du plan nutritionnel actif:', error);
      throw error;
    }
  }

  /**
   * Récupère des suggestions de questions pour le chatbot AI
   * @param language Langue des suggestions (fr/en)
   * @returns Liste de suggestions
   */
  async getAISuggestions(language: string = 'fr'): Promise<string[]> {
    // Vérifier si les données sont en cache
    const cacheKey = `ai:suggestions:${language}`;
    const cachedData = this.getCachedData<string[]>(cacheKey, 'ai');
    
    if (cachedData) {
      console.log(`Utilisation des suggestions AI en cache pour la langue ${language}`);
      return cachedData;
    }
    
    try {
      if (this.mockMode) {
        // Simuler un délai réseau
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Suggestions mockées basées sur la langue
        let mockData: string[];
        if (language === 'fr') {
          mockData = [
            "Comment améliorer mon endurance ?",
            "Conseils pour grimper plus efficacement ?",
            "Nutrition avant une sortie longue ?",
            "Comment ajuster ma position sur le vélo ?"
          ];
        } else {
          mockData = [
            "How can I improve my endurance?",
            "Tips for climbing more efficiently?",
            "Nutrition before a long ride?",
            "How to adjust my bike position?"
          ];
        }
        
        // Mettre en cache les suggestions mockées
        this.setCachedData(cacheKey, mockData);
        return mockData;
      }
      
      // Requête API réelle
      const response = await axios.get(`${this.apiBaseUrl}/api/ai/suggestions?language=${language}`);
      // Mettre en cache les suggestions récupérées
      this.setCachedData(cacheKey, response.data.suggestions);
      return response.data.suggestions;
    } catch (error) {
      console.error(`Erreur lors de la récupération des suggestions AI pour la langue ${language}:`, error);
      
      // Retourner des suggestions par défaut en cas d'erreur
      const defaultSuggestions = language === 'fr' 
        ? [
            "Comment améliorer mes performances ?",
            "Conseils pour l'entraînement en hiver ?",
            "Meilleure nutrition pour cyclistes ?"
          ]
        : [
            "How to improve my performance?",
            "Tips for winter training?",
            "Best nutrition for cyclists?"
          ];
      
      return defaultSuggestions;
    }
  }

  /**
   * Récupère les séances d'entraînement à venir
   */
  async getUpcomingTrainingSessions(): Promise<TrainingSession[]> {
    // Vérifier si les données sont en cache
    const cacheKey = 'training:sessions:upcoming';
    const cachedData = this.getCachedData<TrainingSession[]>(cacheKey, 'training');
    
    if (cachedData) {
      console.log(`Utilisation des séances d'entraînement en cache`);
      return cachedData;
    }
    
    if (this.mockMode) {
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Date actuelle
      const now = new Date();
      
      // Générer des séances mockées pour les prochains jours
      const mockData: TrainingSession[] = [
        {
          id: 'session-1',
          title: 'Sortie longue endurance',
          date: new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString(),
          type: 'Endurance',
          duration: 180,
          description: 'Sortie longue à intensité modérée pour développer l\'endurance de base',
          intensityScore: 60,
          estimatedCaloriesBurn: 1200,
          targets: {
            power: 180,
            heartRate: 145,
            cadence: 90
          }
        },
        {
          id: 'session-2',
          title: 'Intervals HIIT',
          date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2).toISOString(),
          type: 'HIIT',
          duration: 75,
          description: 'Séance d\'intervalles à haute intensité pour développer la puissance',
          intensityScore: 85,
          estimatedCaloriesBurn: 850,
          targets: {
            power: 250,
            heartRate: 165,
            cadence: 95
          },
          intervals: {
            work: 30,
            rest: 60,
            sets: 8
          }
        },
        {
          id: 'session-3',
          title: 'Simulation ascension du Col du Tourmalet',
          date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 4).toISOString(),
          type: 'Ascension',
          duration: 120,
          description: 'Séance spécifique pour préparer l\'ascension du Col du Tourmalet',
          intensityScore: 75,
          estimatedCaloriesBurn: 1100,
          targets: {
            power: 220,
            heartRate: 155,
            cadence: 80
          }
        }
      ];
      
      // Mettre en cache les données mockées
      this.setCachedData(cacheKey, mockData);
      return mockData;
    }
    
    try {
      // Requête API réelle
      const response = await axios.get(`${this.apiBaseUrl}/training/sessions/upcoming`);
      // Mettre en cache les données récupérées
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des séances d\'entraînement à venir:', error);
      throw error;
    }
  }

  /**
   * Récupère les tendances nutritionnelles pour une période donnée
   */
  async getNutritionTrends(startDate: string, endDate: string): Promise<any> {
    // Vérifier si les données sont en cache
    const cacheKey = `nutrition:trends:${startDate}-${endDate}`;
    const cachedData = this.getCachedData<any>(cacheKey, 'nutrition');
    
    if (cachedData) {
      console.log(`Utilisation des tendances nutritionnelles en cache pour la période ${startDate} - ${endDate}`);
      return cachedData;
    }
    
    if (this.mockMode) {
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 700));
      
      // Générer des données mockées pour la période
      const dailyData: Record<string, any> = {};
      
      // Convertir les dates en objets Date
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Pour chaque jour de la période
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        
        // Générer des valeurs aléatoires mais réalistes
        const baseCalories = 2200 + Math.floor(Math.random() * 500);
        const calorieTarget = 2400;
        const proteinBase = 80 + Math.floor(Math.random() * 40);
        const carbsBase = 250 + Math.floor(Math.random() * 80);
        const fatBase = 65 + Math.floor(Math.random() * 25);
        
        dailyData[dateStr] = {
          calories: baseCalories,
          calorieTarget: calorieTarget,
          protein: proteinBase,
          carbs: carbsBase,
          fat: fatBase
        };
      }
      
      const mockData = {
        startDate,
        endDate,
        dailyData,
        recommendations: {
          calories: "Maintien d'un apport calorique régulier entre 2200 et 2500 kcal selon l'intensité de vos entraînements.",
          macros: "Augmentez légèrement votre apport en protéines pour favoriser la récupération musculaire, surtout après des séances intenses."
        }
      };
      
      // Mettre en cache les données mockées
      this.setCachedData(cacheKey, mockData);
      return mockData;
    }
    
    try {
      // Requête API réelle
      const response = await axios.get(`${this.apiBaseUrl}/nutrition/trends?startDate=${startDate}&endDate=${endDate}`);
      // Mettre en cache les données récupérées
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des tendances nutritionnelles pour la période ${startDate} - ${endDate}:`, error);
      throw error;
    }
  }

  /**
   * Récupère le détail d'un plan nutritionnel par son ID
   */
  async getNutritionPlanById(planId: string): Promise<NutritionPlan> {
    // Vérifier si les données sont en cache
    const cacheKey = `nutrition:plan:${planId}`;
    const cachedData = this.getCachedData<NutritionPlan>(cacheKey, 'nutrition');
    
    if (cachedData) {
      console.log(`Utilisation du plan nutritionnel en cache pour l'ID ${planId}`);
      return cachedData;
    }
    
    if (this.mockMode) {
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // Retourner un plan mockée
      const mockData = {
        id: planId,
        name: 'Plan Performance Cycliste',
        description: 'Plan nutritionnel optimisé pour les performances en cyclisme de montagne',
        dailyCalories: 2400,
        macroRatio: {
          protein: 25,
          carbs: 55,
          fat: 20
        },
        meals: [
          {
            name: 'Petit-déjeuner',
            time: '07:00',
            description: 'Riche en glucides complexes pour l\'énergie',
            foods: [
              {
                name: 'Porridge d\'avoine',
                portion: 1,
                calories: 300,
                protein: 10,
                carbs: 50,
                fat: 5
              },
              {
                name: 'Banane',
                portion: 1,
                calories: 105,
                protein: 1,
                carbs: 27,
                fat: 0
              }
            ]
          },
          {
            name: 'Déjeuner',
            time: '12:30',
            description: 'Équilibré en protéines et glucides',
            foods: [
              {
                name: 'Pâtes complètes',
                portion: 1,
                calories: 350,
                protein: 12,
                carbs: 70,
                fat: 2
              },
              {
                name: 'Blanc de poulet',
                portion: 1,
                calories: 165,
                protein: 31,
                carbs: 0,
                fat: 3.6
              }
            ]
          }
        ],
        goal: 'performance',
        cyclingProfile: 'climber',
        isActive: true,
        createdAt: '2023-03-15T10:00:00Z',
        updatedAt: '2023-04-01T14:30:00Z'
      } as NutritionPlan;
      
      // Mettre en cache les données mockées
      this.setCachedData(cacheKey, mockData);
      return mockData;
    }
    
    try {
      // Requête API réelle
      const response = await axios.get(`${this.apiBaseUrl}/nutrition/plans/${planId}`);
      // Mettre en cache les données récupérées
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du plan nutritionnel ${planId}:`, error);
      throw error;
    }
  }

  /**
   * Crée une nouvelle entrée dans le journal nutritionnel
   */
  async createNutritionLogEntry(entry: NutritionLog): Promise<void> {
    if (this.mockMode) {
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Invalider le cache des entrées du journal pour cette date
      this.clearCache('nutrition');
      return;
    }
    
    try {
      // Requête API réelle
      await axios.post(`${this.apiBaseUrl}/nutrition/log`, entry);
      // Invalider le cache des entrées du journal pour cette date
      this.clearCache('nutrition');
    } catch (error) {
      console.error('Erreur lors de la création d\'une entrée dans le journal nutritionnel:', error);
      throw error;
    }
  }

  /**
   * Supprime une entrée du journal nutritionnel
   */
  async deleteNutritionLogEntry(entryId: string): Promise<void> {
    if (this.mockMode) {
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Invalider le cache des entrées du journal
      this.clearCache('nutrition');
      return;
    }
    
    try {
      // Requête API réelle
      await axios.delete(`${this.apiBaseUrl}/nutrition/log/${entryId}`);
      // Invalider le cache des entrées du journal
      this.clearCache('nutrition');
    } catch (error) {
      console.error(`Erreur lors de la suppression de l'entrée ${entryId} du journal nutritionnel:`, error);
      throw error;
    }
  }

  /**
   * Vérifie si le compte Strava est connecté
   */
  async checkStravaConnection(): Promise<{ connected: boolean }> {
    // Vérifier si les données sont en cache
    const cacheKey = 'strava:connection';
    const cachedData = this.getCachedData<{ connected: boolean }>(cacheKey, 'strava');
    
    if (cachedData) {
      console.log(`Utilisation des données en cache pour ${cacheKey}`);
      return cachedData;
    }
    
    if (this.mockMode) {
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Retourner un statut mockée (50% de chance d'être connecté)
      const mockData = { connected: Math.random() > 0.5 };
      
      // Mettre en cache les données mockées
      this.setCachedData(cacheKey, mockData);
      return mockData;
    }
    
    try {
      // Requête API réelle
      const response = await axios.get(`${this.apiBaseUrl}/integrations/strava/status`);
      // Mettre en cache les données récupérées
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la vérification de la connexion Strava:', error);
      throw error;
    }
  }

  /**
   * Récupère l'URL d'authentification Strava
   */
  async getStravaAuthUrl(): Promise<string> {
    // Vérifier si les données sont en cache
    const cacheKey = 'strava:auth-url';
    const cachedData = this.getCachedData<string>(cacheKey, 'strava');
    
    if (cachedData) {
      console.log(`Utilisation des données en cache pour ${cacheKey}`);
      return cachedData;
    }
    
    if (this.mockMode) {
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // URL de redirection mockée
      const mockData = 'https://www.strava.com/oauth/authorize?client_id=12345&response_type=code&redirect_uri=https://velo-altitude.fr/api/strava/callback&approval_prompt=auto&scope=activity:read,profile:read_all';
      
      // Mettre en cache les données mockées
      this.setCachedData(cacheKey, mockData);
      return mockData;
    }
    
    try {
      // Requête API réelle
      const response = await axios.get(`${this.apiBaseUrl}/integrations/strava/auth-url`);
      // Mettre en cache les données récupérées
      this.setCachedData(cacheKey, response.data.authUrl);
      return response.data.authUrl;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'URL d\'authentification Strava:', error);
      throw error;
    }
  }

  /**
   * Récupère les activités Strava
   */
  async getStravaActivities(): Promise<any> {
    // Vérifier si les données sont en cache
    const cacheKey = 'strava:activities';
    const cachedData = this.getCachedData<any>(cacheKey, 'strava');
    
    if (cachedData) {
      console.log(`Utilisation des données en cache pour ${cacheKey}`);
      return cachedData;
    }
    
    if (this.mockMode) {
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Date actuelle
      const now = new Date();
      
      // Générer des activités mockées pour les 14 derniers jours
      const activities = [];
      let totalCalories = 0;
      let totalDistance = 0;
      let totalElevation = 0;
      let totalTime = 0;
      
      for (let i = 14; i >= 1; i--) {
        const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Ne pas ajouter d'activité pour certains jours (jours de repos)
        if (i % 3 === 0) continue;
        
        const intensity = Math.random();
        const distance = Math.round(20 + Math.random() * 60);
        const elevation = Math.round(200 + Math.random() * 1000);
        const duration = Math.round(60 + (distance * 3));
        const caloriesBurned = Math.round(300 + (distance * 15));
        
        activities.push({
          id: `activity-${i}`,
          date: dateStr,
          name: intensity > 0.7 
            ? 'Sortie intensive' 
            : intensity > 0.4 
              ? 'Sortie endurance' 
              : 'Sortie récupération',
          type: 'Ride',
          distance: distance,
          elevation: elevation,
          duration: duration,
          caloriesBurned: caloriesBurned,
          averagePower: Math.round(150 + Math.random() * 100),
          averageHeartRate: Math.round(130 + Math.random() * 40)
        });
        
        totalCalories += caloriesBurned;
        totalDistance += distance;
        totalElevation += elevation;
        totalTime += duration;
      }
      
      const mockData = {
        activities,
        summary: {
          weeklyCaloriesBurned: Math.round(totalCalories / 2),
          weeklyDistance: Math.round(totalDistance / 2),
          weeklyElevation: Math.round(totalElevation / 2),
          weeklyTime: Math.round(totalTime / 2)
        }
      };
      
      // Mettre en cache les données mockées
      this.setCachedData(cacheKey, mockData);
      return mockData;
    }
    
    try {
      // Requête API réelle
      const response = await axios.get(`${this.apiBaseUrl}/integrations/strava/activities`);
      // Mettre en cache les données récupérées
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des activités Strava:', error);
      throw error;
    }
  }

  /**
   * Récupère les recommandations nutritionnelles basées sur l'entraînement
   */
  async getNutritionTrainingRecommendations(planId?: string): Promise<any> {
    // Vérifier si les données sont en cache
    const cacheKey = `nutrition:recommendations:${planId}`;
    const cachedData = this.getCachedData<any>(cacheKey, 'nutrition');
    
    if (cachedData) {
      console.log(`Utilisation des recommandations nutritionnelles en cache pour le plan ${planId}`);
      return cachedData;
    }
    
    if (this.mockMode) {
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Date actuelle
      const now = new Date();
      
      // Générer des recommandations mockées
      const mockData = {
        dailyRecommendations: {
          calories: 2600,
          protein: 130,
          carbs: 350,
          fat: 75
        },
        predictedWeeklyBurn: 8500,
        predictedCalorieBurn: {
          [new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString().split('T')[0]]: 1200,
          [new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2).toISOString().split('T')[0]]: 850,
          [new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3).toISOString().split('T')[0]]: 400,
          [new Date(now.getFullYear(), now.getMonth(), now.getDate() + 4).toISOString().split('T')[0]]: 1100,
          [new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5).toISOString().split('T')[0]]: 600,
          [new Date(now.getFullYear(), now.getMonth(), now.getDate() + 6).toISOString().split('T')[0]]: 1500,
          [new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7).toISOString().split('T')[0]]: 300
        },
        actualCaloriesConsumed: {
          [new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString().split('T')[0]]: 2300,
          [new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6).toISOString().split('T')[0]]: 2450,
          [new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5).toISOString().split('T')[0]]: 2200,
          [new Date(now.getFullYear(), now.getMonth(), now.getDate() - 4).toISOString().split('T')[0]]: 2600,
          [new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3).toISOString().split('T')[0]]: 2150,
          [new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2).toISOString().split('T')[0]]: 2400,
          [new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString().split('T')[0]]: 2350,
          [new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split('T')[0]]: 2500
        },
        recommendedCalories: {
          [new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString().split('T')[0]]: 2750,
          [new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2).toISOString().split('T')[0]]: 2600,
          [new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3).toISOString().split('T')[0]]: 2400,
          [new Date(now.getFullYear(), now.getMonth(), now.getDate() + 4).toISOString().split('T')[0]]: 2700,
          [new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5).toISOString().split('T')[0]]: 2500,
          [new Date(now.getFullYear(), now.getMonth(), now.getDate() + 6).toISOString().split('T')[0]]: 2800,
          [new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7).toISOString().split('T')[0]]: 2300
        },
        foodRecommendations: {
          pre: [
            {
              id: 'pre-workout-oatmeal',
              name: 'Porridge énergétique',
              category: 'Petit-déjeuner',
              timing: 'pre',
              description: 'Porridge enrichi en glucides complexes, idéal avant un entraînement matinal',
              benefits: ['Énergie progressive', 'Satiété', 'Digestion facile'],
              macros: {
                calories: 350,
                protein: 12,
                carbs: 60,
                fat: 8
              },
              example: 'Flocons d\'avoine, banane, miel et cannelle'
            },
            {
              id: 'pre-workout-toast',
              name: 'Toast complet & beurre d\'amande',
              category: 'En-cas',
              timing: 'pre',
              description: 'Combinaison idéale de glucides et lipides sains pour un entraînement modéré',
              benefits: ['Énergie durable', 'Antioxydants', 'Oméga-3'],
              macros: {
                calories: 280,
                protein: 8,
                carbs: 35,
                fat: 12
              },
              example: 'Pain complet, beurre d\'amande et miel'
            }
          ],
          during: [
            {
              id: 'during-workout-gel',
              name: 'Gel énergétique maison',
              category: 'Nutrition sportive',
              timing: 'during',
              description: 'Gel riche en glucides rapidement assimilables pour maintenir l\'énergie pendant l\'effort',
              benefits: ['Énergie rapide', 'Anti-crampes', 'Hydratation'],
              macros: {
                calories: 100,
                protein: 0,
                carbs: 25,
                fat: 0
              },
              example: 'Miel, eau, sel, jus de citron et sirop d\'agave'
            },
            {
              id: 'during-workout-banana',
              name: 'Banane et fruits secs',
              category: 'En-cas',
              timing: 'during',
              description: 'Collation naturelle facile à transporter pour les sorties longues',
              benefits: ['Potassium', 'Énergie progressive', 'Digestion facile'],
              macros: {
                calories: 180,
                protein: 2,
                carbs: 40,
                fat: 1
              },
              example: 'Banane mûre et abricots secs'
            }
          ],
          post: [
            {
              id: 'post-workout-smoothie',
              name: 'Smoothie récupération',
              category: 'Boisson',
              timing: 'post',
              description: 'Smoothie riche en protéines et glucides pour optimiser la récupération musculaire',
              benefits: ['Réparation musculaire', 'Réhydratation', 'Glycogène'],
              macros: {
                calories: 320,
                protein: 20,
                carbs: 40,
                fat: 7
              },
              example: 'Lait, banane, myrtilles, protéine en poudre et flocons d\'avoine'
            },
            {
              id: 'post-workout-rice-chicken',
              name: 'Bol riz & poulet',
              category: 'Repas',
              timing: 'post',
              description: 'Repas complet idéal après un entraînement intensif pour maximiser la récupération',
              benefits: ['Protéines complètes', 'Glycogène', 'Anti-inflammatoire'],
              macros: {
                calories: 450,
                protein: 30,
                carbs: 55,
                fat: 8
              },
              example: 'Riz, blanc de poulet, légumes et sauce au yaourt'
            }
          ]
        },
        goalSpecificAdvice: [
          'Augmentez votre apport calorique de 300-500 kcal les jours d\'entraînement intensif ou long.',
          'Consommez des protéines dans les 30 minutes suivant un entraînement difficile pour favoriser la récupération musculaire.',
          'Pour les ascensions prévues, privilégiez des glucides à index glycémique bas la veille et des glucides rapides pendant l\'effort.'
        ]
      };
      
      // Mettre en cache les données mockées
      this.setCachedData(cacheKey, mockData);
      return mockData;
    }
    
    try {
      // Requête API réelle
      const endpoint = planId 
        ? `${this.apiBaseUrl}/nutrition/recommendations?planId=${planId}` 
        : `${this.apiBaseUrl}/nutrition/recommendations`;
      
      const response = await axios.get(endpoint);
      // Mettre en cache les données récupérées
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des recommandations nutritionnelles pour le plan ${planId}:`, error);
      throw error;
    }
  }

  /**
   * Envoie un message au chatbot AI et reçoit une réponse
   * @param params Paramètres du message
   * @returns Réponse du chatbot avec suggestions
   */
  async sendAIChatMessage(params: {
    message: string;
    history: Array<{role: string; content: string; timestamp: string}>;
    context?: any;
    language?: string;
  }): Promise<{message: string; suggestedQueries: string[]}> {
    try {
      if (this.mockMode) {
        // Simuler un délai réseau
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Réponse mock basée sur le contenu du message
        const message = params.message.toLowerCase();
        let response = '';
        let suggestedQueries: string[] = [];
        
        if (params.language === 'fr') {
          if (message.includes('entraînement') || message.includes('entrainement')) {
            response = "Pour un plan d'entraînement efficace, je recommande 2-3 séances d'intensité par semaine, complétées par des sorties longues à faible intensité. Alternez entre intervalles courts à haute intensité et efforts soutenus plus longs. N'oubliez pas d'inclure 1-2 jours de récupération complète.";
            suggestedQueries = [
              "Comment améliorer mon endurance ?",
              "Meilleurs exercices pour monter les cols ?",
              "Plan de récupération après effort intensif ?"
            ];
          } else if (message.includes('nutrition')) {
            response = "Pour optimiser votre nutrition cycliste, privilégiez les glucides complexes avant les sorties longues (pâtes, riz). Pendant l'effort, consommez 30-60g de glucides par heure. Après l'effort, une collation avec un ratio de 4:1 (glucides:protéines) favorise la récupération. Restez hydraté en buvant 500-750ml par heure d'exercice.";
            suggestedQueries = [
              "Quels aliments avant une compétition ?",
              "Meilleure hydratation pendant l'effort ?",
              "Récupération nutritionnelle après 100km ?"
            ];
          } else {
            response = "Je suis votre assistant cyclisme personnel. Je peux vous aider avec des conseils d'entraînement, de nutrition, d'équipement ou d'analyse de performance. Comment puis-je vous aider aujourd'hui ?";
            suggestedQueries = [
              "Plan d'entraînement pour débutant ?",
              "Conseils nutrition pour cyclisme ?",
              "Comment améliorer ma technique de pédalage ?"
            ];
          }
        } else {
          // English responses
          if (message.includes('training')) {
            response = "For an effective training plan, I recommend 2-3 intensity sessions per week, complemented by longer low-intensity rides. Alternate between short high-intensity intervals and longer sustained efforts. Don't forget to include 1-2 days of complete recovery.";
            suggestedQueries = [
              "How to improve my endurance?",
              "Best exercises for climbing hills?",
              "Recovery plan after intense effort?"
            ];
          } else if (message.includes('nutrition')) {
            response = "To optimize your cycling nutrition, focus on complex carbohydrates before long rides (pasta, rice). During exercise, consume 30-60g of carbohydrates per hour. After exercise, a snack with a 4:1 ratio (carbs:protein) promotes recovery. Stay hydrated by drinking 500-750ml per hour of exercise.";
            suggestedQueries = [
              "What foods before a competition?",
              "Best hydration during exercise?",
              "Nutritional recovery after 100km?"
            ];
          } else {
            response = "I'm your personal cycling assistant. I can help with training advice, nutrition, equipment, or performance analysis. How can I assist you today?";
            suggestedQueries = [
              "Training plan for beginners?",
              "Nutrition tips for cycling?",
              "How to improve my pedaling technique?"
            ];
          }
        }
        
        return { message: response, suggestedQueries };
      }
      
      // Requête API réelle
      const response = await axios.post(`${this.apiBaseUrl}/api/ai/chat`, params);
      return response.data;
    } catch (error) {
      console.error('Error sending AI chat message:', error);
      throw new Error('Failed to get AI response');
    }
  }
  
  /**
   * Sauvegarde l'historique des conversations de l'utilisateur
   * @param userId ID de l'utilisateur
   * @param messages Historique des messages
   */
  async saveAIChatHistory(userId: string, messages: Array<any>): Promise<void> {
    if (this.mockMode) {
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Sauvegarder dans le localStorage pour le mode mock
      localStorage.setItem(`chat_history_${userId}`, JSON.stringify(messages));
      return;
    }
    
    // Requête API réelle - implémentation à venir
    await axios.post(`${this.apiBaseUrl}/api/ai/history/${userId}`, { messages });
  }
  
  /**
   * Efface l'historique des conversations de l'utilisateur
   * @param userId ID de l'utilisateur
   */
  async clearAIChatHistory(userId: string): Promise<void> {
    if (this.mockMode) {
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Supprimer du localStorage pour le mode mock
      localStorage.removeItem(`chat_history_${userId}`);
      return;
    }
    
    // Requête API réelle
    await axios.delete(`${this.apiBaseUrl}/api/ai/history/${userId}`);
  }
}
