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

  constructor() {
    // En environnement de production, utilisez l'URL réelle de l'API
    this.apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.velo-altitude.fr';
    
    // Mode mock pour le développement local ou les démos
    this.mockMode = process.env.NEXT_PUBLIC_MOCK_API === 'true' || process.env.NODE_ENV !== 'production';
    
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
   * Récupère les entrées du journal nutritionnel pour une date spécifique
   */
  async getNutritionLogEntries(date: string): Promise<NutritionLog[]> {
    if (this.mockMode) {
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Retourner des données mockées
      return [
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
    }
    
    // Requête API réelle
    const response = await axios.get(`${this.apiBaseUrl}/nutrition/log/${date}`);
    return response.data;
  }

  /**
   * Crée une nouvelle entrée dans le journal nutritionnel
   */
  async createNutritionLogEntry(entry: NutritionLog): Promise<void> {
    if (this.mockMode) {
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 300));
      return;
    }
    
    // Requête API réelle
    await axios.post(`${this.apiBaseUrl}/nutrition/log`, entry);
  }

  /**
   * Supprime une entrée du journal nutritionnel
   */
  async deleteNutritionLogEntry(entryId: string): Promise<void> {
    if (this.mockMode) {
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 300));
      return;
    }
    
    // Requête API réelle
    await axios.delete(`${this.apiBaseUrl}/nutrition/log/${entryId}`);
  }

  /**
   * Récupère les tendances nutritionnelles pour une période donnée
   */
  async getNutritionTrends(startDate: string, endDate: string): Promise<any> {
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
      
      return {
        startDate,
        endDate,
        dailyData,
        recommendations: {
          calories: "Maintien d'un apport calorique régulier entre 2200 et 2500 kcal selon l'intensité de vos entraînements.",
          macros: "Augmentez légèrement votre apport en protéines pour favoriser la récupération musculaire, surtout après des séances intenses."
        }
      };
    }
    
    // Requête API réelle
    const response = await axios.get(`${this.apiBaseUrl}/nutrition/trends?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  }

  /**
   * Récupère le plan nutritionnel actif de l'utilisateur
   */
  async getActiveNutritionPlan(): Promise<NutritionPlan | null> {
    if (this.mockMode) {
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // Retourner un plan mockée
      return {
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
      };
    }
    
    // Requête API réelle
    try {
      const response = await axios.get(`${this.apiBaseUrl}/nutrition/plans/active`);
      return response.data;
    } catch (error) {
      // Si aucun plan actif n'est trouvé, retourner null
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Récupère le détail d'un plan nutritionnel par son ID
   */
  async getNutritionPlanById(planId: string): Promise<NutritionPlan> {
    if (this.mockMode) {
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // Retourner un plan mockée
      return {
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
      };
    }
    
    // Requête API réelle
    const response = await axios.get(`${this.apiBaseUrl}/nutrition/plans/${planId}`);
    return response.data;
  }

  /**
   * Récupère les séances d'entraînement à venir
   */
  async getUpcomingTrainingSessions(): Promise<TrainingSession[]> {
    if (this.mockMode) {
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Date actuelle
      const now = new Date();
      
      // Générer des séances mockées pour les prochains jours
      return [
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
    }
    
    // Requête API réelle
    const response = await axios.get(`${this.apiBaseUrl}/training/sessions/upcoming`);
    return response.data;
  }

  /**
   * Vérifie si le compte Strava est connecté
   */
  async checkStravaConnection(): Promise<{ connected: boolean }> {
    if (this.mockMode) {
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Retourner un statut mockée (50% de chance d'être connecté)
      return { connected: Math.random() > 0.5 };
    }
    
    // Requête API réelle
    const response = await axios.get(`${this.apiBaseUrl}/integrations/strava/status`);
    return response.data;
  }

  /**
   * Récupère l'URL d'authentification Strava
   */
  async getStravaAuthUrl(): Promise<string> {
    if (this.mockMode) {
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // URL de redirection mockée
      return 'https://www.strava.com/oauth/authorize?client_id=12345&response_type=code&redirect_uri=https://velo-altitude.fr/api/strava/callback&approval_prompt=auto&scope=activity:read,profile:read_all';
    }
    
    // Requête API réelle
    const response = await axios.get(`${this.apiBaseUrl}/integrations/strava/auth-url`);
    return response.data.authUrl;
  }

  /**
   * Récupère les activités Strava
   */
  async getStravaActivities(): Promise<any> {
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
      
      return {
        activities,
        summary: {
          weeklyCaloriesBurned: Math.round(totalCalories / 2),
          weeklyDistance: Math.round(totalDistance / 2),
          weeklyElevation: Math.round(totalElevation / 2),
          weeklyTime: Math.round(totalTime / 2)
        }
      };
    }
    
    // Requête API réelle
    const response = await axios.get(`${this.apiBaseUrl}/integrations/strava/activities`);
    return response.data;
  }

  /**
   * Récupère les recommandations nutritionnelles basées sur l'entraînement
   */
  async getNutritionTrainingRecommendations(planId?: string): Promise<any> {
    if (this.mockMode) {
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Date actuelle
      const now = new Date();
      
      // Générer des recommandations mockées
      return {
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
    }
    
    // Requête API réelle
    const endpoint = planId 
      ? `${this.apiBaseUrl}/nutrition/recommendations?planId=${planId}` 
      : `${this.apiBaseUrl}/nutrition/recommendations`;
    
    const response = await axios.get(endpoint);
    return response.data;
  }
}
