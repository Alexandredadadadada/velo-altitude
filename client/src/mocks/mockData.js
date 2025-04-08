/**
 * Données mockées centralisées pour MSW
 * 
 * Ce fichier contient toutes les données mockées utilisées par l'application pour le développement.
 * Il est utilisé par MSW pour simuler des réponses API sans avoir besoin d'un backend réel.
 */

// Importer les données mockées existantes
import mockComments from './comments';
import mockPosts from './posts';
import mockRoutes from './routes';
import mockStravaActivities from './stravaActivities';
import mockUserRoutes from './userRoutes';

// Les données des cols
export const cols = [
  {
    id: "col-1",
    name: "Col du Galibier",
    region: "Alpes",
    elevation: 2642,
    length: 17.7,
    averageGradient: 6.9,
    maxGradient: 10.1,
    difficulty: "hard",
    startPoint: { latitude: 45.0345, longitude: 6.4071, altitude: 1450 },
    endPoint: { latitude: 45.0641, longitude: 6.4096, altitude: 2642 },
    description: "Le col du Galibier est l'un des plus hauts cols routiers des Alpes françaises. Il est souvent au programme du Tour de France.",
    images: [
      "https://example.com/cols/galibier1.jpg",
      "https://example.com/cols/galibier2.jpg"
    ],
    profileImage: "https://example.com/cols/galibier-profile.png",
    mapData: {
      path: [
        { latitude: 45.0345, longitude: 6.4071, altitude: 1450 },
        { latitude: 45.0400, longitude: 6.4080, altitude: 1600 },
        { latitude: 45.0500, longitude: 6.4090, altitude: 1900 },
        { latitude: 45.0600, longitude: 6.4095, altitude: 2300 },
        { latitude: 45.0641, longitude: 6.4096, altitude: 2642 }
      ],
      bounds: {
        northeast: { latitude: 45.0641, longitude: 6.4096 },
        southwest: { latitude: 45.0345, longitude: 6.4071 }
      },
      elevationProfile: [
        { distance: 0, altitude: 1450 },
        { distance: 5, altitude: 1600, gradient: 3.0 },
        { distance: 10, altitude: 1900, gradient: 6.0 },
        { distance: 15, altitude: 2300, gradient: 8.0 },
        { distance: 17.7, altitude: 2642, gradient: 10.1 }
      ]
    },
    isPartOf7Majeurs: true
  },
  {
    id: "col-2",
    name: "Alpe d'Huez",
    region: "Alpes",
    elevation: 1860,
    length: 13.8,
    averageGradient: 8.1,
    maxGradient: 13,
    difficulty: "hard",
    startPoint: { latitude: 45.0522, longitude: 6.0281, altitude: 720 },
    endPoint: { latitude: 45.0909, longitude: 6.0639, altitude: 1860 },
    description: "L'Alpe d'Huez est célèbre pour ses 21 virages numérotés et est l'une des montées les plus emblématiques du Tour de France.",
    images: [
      "https://example.com/cols/alpe1.jpg",
      "https://example.com/cols/alpe2.jpg"
    ],
    profileImage: "https://example.com/cols/alpe-profile.png",
    mapData: {
      path: [
        { latitude: 45.0522, longitude: 6.0281, altitude: 720 },
        { latitude: 45.0600, longitude: 6.0350, altitude: 1000 },
        { latitude: 45.0700, longitude: 6.0450, altitude: 1300 },
        { latitude: 45.0800, longitude: 6.0550, altitude: 1600 },
        { latitude: 45.0909, longitude: 6.0639, altitude: 1860 }
      ],
      bounds: {
        northeast: { latitude: 45.0909, longitude: 6.0639 },
        southwest: { latitude: 45.0522, longitude: 6.0281 }
      },
      elevationProfile: [
        { distance: 0, altitude: 720 },
        { distance: 3, altitude: 1000, gradient: 9.3 },
        { distance: 7, altitude: 1300, gradient: 7.5 },
        { distance: 11, altitude: 1600, gradient: 7.5 },
        { distance: 13.8, altitude: 1860, gradient: 9.3 }
      ]
    },
    isPartOf7Majeurs: true
  },
  {
    id: "col-3",
    name: "Mont Ventoux",
    region: "Provence",
    elevation: 1909,
    length: 21.4,
    averageGradient: 7.5,
    maxGradient: 12,
    difficulty: "extreme",
    startPoint: { latitude: 44.1157, longitude: 5.1648, altitude: 300 },
    endPoint: { latitude: 44.1741, longitude: 5.2786, altitude: 1909 },
    description: "Le Mont Ventoux, surnommé le 'Géant de Provence', est l'un des cols les plus redoutés en raison de ses conditions météorologiques extrêmes et de sa difficulté.",
    images: [
      "https://example.com/cols/ventoux1.jpg",
      "https://example.com/cols/ventoux2.jpg"
    ],
    profileImage: "https://example.com/cols/ventoux-profile.png",
    mapData: {
      path: [
        { latitude: 44.1157, longitude: 5.1648, altitude: 300 },
        { latitude: 44.1300, longitude: 5.1900, altitude: 600 },
        { latitude: 44.1450, longitude: 5.2100, altitude: 1000 },
        { latitude: 44.1600, longitude: 5.2400, altitude: 1400 },
        { latitude: 44.1741, longitude: 5.2786, altitude: 1909 }
      ],
      bounds: {
        northeast: { latitude: 44.1741, longitude: 5.2786 },
        southwest: { latitude: 44.1157, longitude: 5.1648 }
      },
      elevationProfile: [
        { distance: 0, altitude: 300 },
        { distance: 5, altitude: 600, gradient: 6.0 },
        { distance: 10, altitude: 1000, gradient: 8.0 },
        { distance: 15, altitude: 1400, gradient: 8.0 },
        { distance: 21.4, altitude: 1909, gradient: 7.9 }
      ]
    },
    isPartOf7Majeurs: true
  }
];

// Les données des utilisateurs
export const users = [
  {
    id: "user-1",
    username: "cycliste_pro",
    email: "cycliste@example.com",
    fullName: "Jean Dupont",
    profilePicture: "https://example.com/users/jean.jpg",
    bio: "Cycliste passionné et amateur de cols alpins",
    location: "Grenoble, France",
    registeredAt: "2023-01-15T10:30:00Z",
    role: "user",
    stats: {
      totalAscents: 156,
      totalDistance: 8750,
      totalElevation: 125000,
      achievements: [
        {
          id: "achievement-1",
          title: "Conquérant des Alpes",
          description: "A gravi tous les cols majeurs des Alpes",
          icon: "trophy-gold",
          category: "cols",
          level: 3,
          unlockedAt: "2023-05-20T14:15:00Z"
        }
      ],
      majeurs7Progress: {
        challengeId: "challenge-1",
        startDate: "2023-03-01T00:00:00Z",
        completedCols: [
          {
            colId: "col-1",
            completionDate: "2023-04-15T11:20:00Z",
            activityId: "activity-1"
          },
          {
            colId: "col-2",
            completionDate: "2023-05-10T09:45:00Z",
            activityId: "activity-2"
          }
        ],
        isCompleted: false
      },
      level: 42,
      pointsEarned: 12500
    },
    preferences: {
      measurementUnit: "metric",
      theme: "dark",
      emailNotifications: true,
      privacySettings: {
        profileVisibility: "public",
        activityVisibility: "friends",
        showRealName: true,
        showLocation: true
      },
      language: "fr-FR"
    }
  }
];

// Les données des activités
export const activities = [
  {
    id: "activity-1",
    userId: "user-1",
    type: "cycling",
    title: "Ascension du Galibier",
    description: "Belle journée pour grimper le Galibier",
    startDate: "2023-04-15T08:30:00Z",
    endDate: "2023-04-15T11:20:00Z",
    distance: 35.4,
    duration: 10200, // en secondes
    elevationGain: 1192,
    averageSpeed: 12.5,
    maxSpeed: 25.3,
    route: [
      { latitude: 45.0345, longitude: 6.4071, altitude: 1450 },
      { latitude: 45.0400, longitude: 6.4080, altitude: 1600 },
      { latitude: 45.0500, longitude: 6.4090, altitude: 1900 },
      { latitude: 45.0600, longitude: 6.4095, altitude: 2300 },
      { latitude: 45.0641, longitude: 6.4096, altitude: 2642 }
    ],
    colsClimbed: [
      {
        id: "col-1",
        name: "Col du Galibier",
        elevation: 2642
      }
    ],
    weather: {
      current: {
        temperature: 15,
        feelsLike: 13,
        windSpeed: 10,
        windDirection: 180,
        precipitation: 0,
        humidity: 65,
        pressure: 1013,
        visibility: 10000,
        uvIndex: 4,
        conditions: "Ensoleillé",
        icon: "sun"
      },
      lastUpdated: "2023-04-15T08:00:00Z"
    },
    isPrivate: false,
    source: "manual"
  }
];

// Les données des défis 7 Majeurs
export const majeurs7Challenges = [
  {
    id: "challenge-1",
    name: "Les 7 Majeurs des Alpes",
    description: "Un défi consistant à gravir les 7 cols les plus emblématiques des Alpes françaises",
    region: "Alpes",
    cols: [
      {
        id: "col-1",
        name: "Col du Galibier",
        elevation: 2642
      },
      {
        id: "col-2",
        name: "Alpe d'Huez",
        elevation: 1860
      },
      {
        id: "col-3",
        name: "Mont Ventoux",
        elevation: 1909
      }
      // 4 autres cols non détaillés ici
    ],
    totalDistance: 150,
    totalElevation: 12000,
    difficulty: "hard",
    createdBy: "admin",
    isOfficial: true,
    participants: 1250,
    completions: 325,
    image: "https://example.com/challenges/alpes7.jpg"
  }
];

// Les données des plans d'entraînement
export const trainingPlans = [
  {
    id: "plan-1",
    userId: "user-1",
    name: "Préparation Marmotte 2023",
    description: "Plan d'entraînement pour La Marmotte 2023",
    startDate: "2023-01-01T00:00:00Z",
    endDate: "2023-07-01T00:00:00Z",
    goal: "Terminer La Marmotte en moins de 8 heures",
    weeks: [
      {
        weekNumber: 1,
        focus: "Reprise",
        targetHours: 8,
        workouts: [
          {
            id: "workout-1",
            day: 1,
            title: "Sortie d'endurance",
            description: "Sortie longue à intensité modérée",
            type: "endurance",
            duration: 7200, // 2h
            distance: 50,
            targetPower: 150,
            targetHeartRate: 130,
            completed: true,
            notes: "Sensation de bien-être, pas de fatigue"
          }
        ]
      }
    ],
    ftpHistory: [
      {
        value: 250,
        date: "2023-01-01T00:00:00Z",
        method: "test"
      },
      {
        value: 265,
        date: "2023-03-01T00:00:00Z",
        method: "test"
      }
    ],
    targetEvents: [
      {
        id: "event-1",
        name: "La Marmotte 2023",
        description: "Cyclosportive exigeante dans les Alpes françaises",
        date: "2023-07-02T06:00:00Z",
        location: "Alpe d'Huez, France",
        type: "race",
        distance: 174,
        elevation: 5000,
        url: "https://example.com/events/marmotte2023"
      }
    ]
  }
];

// Les données de nutrition
export const nutritionPlans = [
  {
    id: "nutrition-plan-1",
    userId: "user-1",
    name: "Plan pour cycliste actif",
    description: "Plan nutritionnel adapté à un entraînement intensif",
    dailyCalorieTarget: 2800,
    macroSplit: {
      carbs: 60,
      protein: 20,
      fat: 20
    },
    meals: [
      {
        id: "meal-1",
        name: "Petit-déjeuner",
        time: "07:30",
        calorieTarget: 700,
        recipes: [
          {
            id: "recipe-1",
            name: "Porridge à la banane",
            description: "Porridge nutritif avec banane et miel",
            ingredients: [
              {
                name: "Flocons d'avoine",
                quantity: 80,
                unit: "g",
                calories: 300,
                macros: {
                  carbs: 54,
                  protein: 10,
                  fat: 6
                }
              },
              {
                name: "Lait d'amande",
                quantity: 250,
                unit: "ml",
                calories: 80,
                macros: {
                  carbs: 6,
                  protein: 4,
                  fat: 6
                }
              },
              {
                name: "Banane",
                quantity: 1,
                unit: "pièce",
                calories: 100,
                macros: {
                  carbs: 25,
                  protein: 1,
                  fat: 0
                }
              }
            ],
            instructions: [
              "Mélanger les flocons d'avoine et le lait",
              "Chauffer 3 minutes au micro-ondes",
              "Ajouter la banane coupée en rondelles"
            ],
            prepTime: 5,
            calories: 480,
            macros: {
              carbs: 85,
              protein: 15,
              fat: 12
            },
            servings: 1,
            tags: ["breakfast", "vegan", "quick"],
            isFavorite: true
          }
        ],
        notes: "Prendre 30 minutes avant l'entraînement"
      }
    ],
    hydrationTarget: 3000,
    created: "2023-01-05T10:00:00Z",
    updated: "2023-03-10T15:30:00Z"
  }
];

// Les données météo
export const weatherData = {
  "col-1": {
    current: {
      temperature: 12,
      feelsLike: 10,
      windSpeed: 15,
      windDirection: 270,
      precipitation: 0,
      humidity: 70,
      pressure: 1010,
      visibility: 8000,
      uvIndex: 3,
      conditions: "Partiellement nuageux",
      icon: "partly-cloudy"
    },
    forecast: [
      {
        date: "2023-04-15T00:00:00Z",
        sunrise: "2023-04-15T06:45:00Z",
        sunset: "2023-04-15T20:15:00Z",
        temperatureMin: 5,
        temperatureMax: 15,
        precipitation: 0,
        precipitationProbability: 10,
        windSpeed: 12,
        conditions: "Ensoleillé",
        icon: "sun"
      },
      {
        date: "2023-04-16T00:00:00Z",
        sunrise: "2023-04-16T06:44:00Z",
        sunset: "2023-04-16T20:16:00Z",
        temperatureMin: 7,
        temperatureMax: 17,
        precipitation: 0,
        precipitationProbability: 5,
        windSpeed: 8,
        conditions: "Ensoleillé",
        icon: "sun"
      }
    ],
    lastUpdated: "2023-04-15T08:00:00Z"
  }
};

// Les données du forum
export const forumData = {
  categories: [
    {
      id: "category-1",
      name: "Entraînement",
      description: "Discussions sur les méthodes et plans d'entraînement",
      topics: 125,
      posts: 1250,
      lastPost: {
        id: "post-1",
        title: "Méthodes d'entraînement pour améliorer le seuil",
        author: "cycliste_pro",
        date: "2023-04-10T15:30:00Z"
      }
    },
    {
      id: "category-2",
      name: "Nutrition",
      description: "Conseils nutritionnels pour cyclistes",
      topics: 85,
      posts: 950,
      lastPost: {
        id: "post-2",
        title: "Nutrition pendant une longue sortie",
        author: "dietexpert",
        date: "2023-04-12T09:15:00Z"
      }
    }
  ],
  topics: [
    {
      id: "topic-1",
      categoryId: "category-1",
      title: "Méthodes d'entraînement pour améliorer le seuil",
      author: {
        id: "user-1",
        username: "cycliste_pro",
        avatar: "https://example.com/users/jean.jpg"
      },
      createdAt: "2023-04-05T10:20:00Z",
      views: 1250,
      replies: 15,
      isPinned: false,
      isLocked: false,
      lastReply: {
        author: "coach_cycling",
        date: "2023-04-10T15:30:00Z"
      }
    }
  ],
  posts: [
    {
      id: "post-1",
      topicId: "topic-1",
      author: {
        id: "user-1",
        username: "cycliste_pro",
        avatar: "https://example.com/users/jean.jpg",
        role: "user",
        postCount: 156,
        joinDate: "2023-01-15T10:30:00Z"
      },
      content: "Bonjour à tous, je cherche des conseils pour améliorer mon seuil. Actuellement à 250W, j'aimerais atteindre 280W d'ici 3 mois. Quelles méthodes recommandez-vous?",
      createdAt: "2023-04-05T10:20:00Z",
      likes: 8
    }
  ]
};

// Combinaison de toutes les données mockées
const mockData = {
  cols,
  users,
  activities,
  majeurs7Challenges,
  trainingPlans,
  nutritionPlans,
  weatherData,
  forumData,
  // Données existantes
  comments: mockComments,
  posts: mockPosts,
  routes: mockRoutes,
  stravaActivities: mockStravaActivities,
  userRoutes: mockUserRoutes
};

export default mockData;
