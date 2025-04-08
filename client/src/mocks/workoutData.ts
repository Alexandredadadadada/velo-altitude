/**
 * Données fictives pour les entraînements de cyclisme
 * 
 * Ces données simulent les réponses de l'API en attendant l'intégration avec le backend
 * Compatible avec l'infrastructure backend optimisée (cache, authentification, etc.)
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Interface pour un entraînement complet
 */
export interface Workout {
  id: string;
  title: string;
  subtitle: string;
  type: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  duration: number;
  distance?: number;
  elevation?: number;
  calories?: number;
  description: string;
  imageUrl: string;
  thumbnailUrl: string;
  featured: boolean;
  premium: boolean;
  createdAt: string;
  updatedAt: string;
  benefits: string[];
  tags: string[];
  sections: Array<{
    title: string;
    duration: number;
    description: string;
    targets: string[];
  }>;
  tips?: string[];
  metrics: {
    avgPower?: number;
    maxPower?: number;
    avgHeartRate?: number;
    maxHeartRate?: number;
    avgCadence?: number;
    maxCadence?: number;
    avgSpeed?: number;
    maxSpeed?: number;
    calories?: number;
    intensity?: number;
    recoveryScore?: number;
    effortScore?: number;
    timeSeriesData?: {
      power?: Array<{time: number, value: number}>;
      heartRate?: Array<{time: number, value: number}>;
      cadence?: Array<{time: number, value: number}>;
      speed?: Array<{time: number, value: number}>;
    };
  };
  equipment: Array<{
    id: string;
    name: string;
    description: string;
    type: string;
    optional: boolean;
    recommendationLevel?: number;
    imageUrl?: string;
  }>;
  instructor: {
    id: string;
    name: string;
    title: string;
    bio: string;
    profileImage?: string;
    email?: string;
    website?: string;
    yearsOfExperience?: number;
    certifications?: string[];
    location?: string;
    specialties?: string[];
    stats?: {
      workouts?: number;
      athletes?: number;
      rating?: number;
    };
  };
  comments: Array<{
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    content: string;
    createdAt: string;
    likes: number;
    isLiked?: boolean;
    isOwn?: boolean;
    replies?: Array<{
      id: string;
      userId: string;
      userName: string;
      userAvatar?: string;
      content: string;
      createdAt: string;
      likes: number;
      isLiked?: boolean;
      isOwn?: boolean;
    }>;
  }>;
}

/**
 * Données fictives pour un entraînement de cyclisme
 */
export const mockWorkout: Workout = {
  id: "w001",
  title: "Intervalles de Puissance - Seuil Anaérobie",
  subtitle: "Améliorez votre capacité anaérobie et votre résistance",
  type: "Intervalle",
  level: "advanced",
  duration: 75,
  distance: 30,
  elevation: 450,
  calories: 650,
  description: "Cet entraînement par intervalles de haute intensité est conçu pour améliorer votre seuil anaérobie et votre capacité à maintenir des efforts soutenus. Idéal pour les cyclistes qui veulent progresser en compétition ou dans les montées difficiles du Grand Est.",
  imageUrl: "/images/workouts/intervals-training.jpg",
  thumbnailUrl: "/images/workouts/thumbnails/intervals-training.jpg",
  featured: true,
  premium: true,
  createdAt: "2025-01-15T08:30:00.000Z",
  updatedAt: "2025-03-22T14:45:00.000Z",
  benefits: [
    "Amélioration du seuil anaérobie",
    "Augmentation de la puissance maximale sur 5 minutes",
    "Renforcement de l'endurance musculaire",
    "Optimisation de la récupération entre les efforts intenses",
    "Préparation spécifique pour les parcours vallonnés du Grand Est"
  ],
  tags: ["HIIT", "Seuil", "Montagne", "Compétition", "VO2max"],
  sections: [
    {
      title: "Échauffement progressif",
      duration: 15,
      description: "Commencez par un échauffement léger en augmentant progressivement l'intensité. Inclut des accélérations courtes pour préparer le système cardio-vasculaire.",
      targets: ["50-60% FTP", "Cadence 90-95 rpm"]
    },
    {
      title: "Intervalles au seuil",
      duration: 30,
      description: "6 intervalles de 3 minutes à intensité élevée, suivis de 2 minutes de récupération active. Maintenez une cadence légèrement plus élevée pendant les intervalles.",
      targets: ["95-105% FTP", "Cadence 95-100 rpm"]
    },
    {
      title: "Bloc de supra-seuil",
      duration: 15,
      description: "3 intervalles de 2 minutes à intensité très élevée, suivis de 3 minutes de récupération. L'objectif est de dépasser votre zone de confort tout en maintenant une bonne technique.",
      targets: ["110-120% FTP", "Cadence 100+ rpm"]
    },
    {
      title: "Récupération active",
      duration: 15,
      description: "Pédalage léger pour favoriser l'élimination des toxines et préparer le corps à la récupération. Concentrez-vous sur votre respiration et une technique fluide.",
      targets: ["40-50% FTP", "Cadence libre"]
    }
  ],
  tips: [
    "Hydratez-vous régulièrement, même pendant les intervalles de haute intensité",
    "Si vous ne pouvez pas maintenir la puissance cible, réduisez légèrement l'intensité plutôt que de raccourcir les intervalles",
    "Suivez cet entraînement 1 à 2 fois par semaine, jamais lors de jours consécutifs",
    "Utilisez les données météo de l'application pour adapter votre équipement aux conditions extérieures"
  ],
  metrics: {
    avgPower: 230,
    maxPower: 385,
    avgHeartRate: 152,
    maxHeartRate: 183,
    avgCadence: 92,
    maxCadence: 110,
    avgSpeed: 27.5,
    maxSpeed: 38.2,
    calories: 650,
    intensity: 8,
    recoveryScore: 7,
    effortScore: 85,
    timeSeriesData: {
      power: Array.from({ length: 20 }, (_, i) => ({
        time: i * 225,
        value: 130 + Math.floor(Math.random() * 150)
      })),
      heartRate: Array.from({ length: 20 }, (_, i) => ({
        time: i * 225,
        value: 120 + Math.floor(Math.random() * 60)
      }))
    }
  },
  equipment: [
    {
      id: "e001",
      name: "Vélo de route ou home trainer",
      description: "Un vélo de route ou un home trainer connecté capable de mesurer la puissance est idéal pour cet entraînement.",
      type: "bike",
      optional: false,
      recommendationLevel: 5
    },
    {
      id: "e002",
      name: "Capteur de puissance",
      description: "Un capteur de puissance vous aidera à maintenir précisément les zones d'intensité ciblées pendant les intervalles.",
      type: "sensor",
      optional: false,
      recommendationLevel: 5,
      imageUrl: "/images/equipment/power-meter.jpg"
    },
    {
      id: "e003",
      name: "Moniteur de fréquence cardiaque",
      description: "Permet de suivre votre effort cardiovasculaire et d'ajuster l'intensité si nécessaire.",
      type: "sensor",
      optional: true,
      recommendationLevel: 4,
      imageUrl: "/images/equipment/heart-rate-monitor.jpg"
    },
    {
      id: "e004",
      name: "Vêtements adaptés aux conditions",
      description: "Habillez-vous en fonction des conditions météo, en privilégiant les matériaux respirants.",
      type: "clothing",
      optional: false,
      recommendationLevel: 4
    },
    {
      id: "e005",
      name: "Bouteilles d'eau et nutrition",
      description: "Prévoyez suffisamment d'eau et éventuellement une barre énergétique pour maintenir votre niveau d'énergie.",
      type: "accessory",
      optional: false,
      recommendationLevel: 5
    }
  ],
  instructor: {
    id: "i001",
    name: "Thomas Laurent",
    title: "Entraîneur Élite & Spécialiste de la Performance",
    bio: "Thomas est un ancien coureur professionnel spécialisé dans les entraînements de haute intensité. Avec 15 ans d'expérience dans le cyclisme de compétition, il a développé une approche scientifique de l'entraînement par intervalles. Basé dans les Vosges, il connaît parfaitement les défis spécifiques du cyclisme dans le Grand Est.",
    profileImage: "/images/instructors/thomas-laurent.jpg",
    email: "thomas.laurent@velo-altitude.fr",
    website: "https://www.velo-altitude.fr/coach/thomas",
    yearsOfExperience: 15,
    certifications: [
      "Diplôme d'État Supérieur de la Jeunesse, de l'Éducation Populaire et du Sport",
      "Certification SRM Power Expert",
      "Formation en physiologie de l'effort (INSEP)"
    ],
    location: "Gérardmer, Vosges",
    specialties: [
      "Entraînement par intervalles",
      "Préparation pour la montagne",
      "Cyclisme sur route",
      "Analyse de la performance",
      "Périodisation de l'entraînement"
    ],
    stats: {
      workouts: 148,
      athletes: 320,
      rating: 4.9
    }
  },
  comments: [
    {
      id: uuidv4(),
      userId: "u002",
      userName: "Marie Dubois",
      userAvatar: "/images/users/marie-dubois.jpg",
      content: "J'ai suivi cet entraînement deux fois par semaine pendant un mois, et j'ai vu ma puissance au seuil augmenter de 7% ! Les intervalles sont difficiles mais très efficaces.",
      createdAt: "2025-03-10T14:25:00.000Z",
      likes: 8,
      isLiked: false,
      replies: [
        {
          id: uuidv4(),
          userId: "i001",
          userName: "Thomas Laurent",
          userAvatar: "/images/instructors/thomas-laurent.jpg",
          content: "Merci pour votre retour Marie ! C'est exactement le type de progression que nous visons. Continuez ce rythme et pensez à refaire un test FTP bientôt pour ajuster vos zones.",
          createdAt: "2025-03-10T15:40:00.000Z",
          likes: 3,
          isLiked: false,
          isOwn: false
        }
      ]
    },
    {
      id: uuidv4(),
      userId: "u003",
      userName: "Pierre Martin",
      userAvatar: "/images/users/pierre-martin.jpg",
      content: "Est-ce qu'on peut adapter cet entraînement pour l'extérieur si on n'a pas de parcours plat ? J'habite dans une région très vallonnée.",
      createdAt: "2025-03-15T09:15:00.000Z",
      likes: 2,
      isLiked: false,
      replies: [
        {
          id: uuidv4(),
          userId: "i001",
          userName: "Thomas Laurent",
          userAvatar: "/images/instructors/thomas-laurent.jpg",
          content: "Bonjour Pierre, tout à fait ! Sur terrain vallonné, concentrez-vous sur le maintien de l'effort plutôt que sur la puissance exacte. Choisissez un circuit avec des montées légères pour les intervalles. L'application peut vous suggérer des parcours adaptés dans votre région.",
          createdAt: "2025-03-15T10:05:00.000Z",
          likes: 4,
          isLiked: true,
          isOwn: false
        }
      ]
    },
    {
      id: uuidv4(),
      userId: "u001",
      userName: "Vous",
      content: "Super séance ! J'ai particulièrement apprécié les conseils sur la récupération entre les intervalles. Est-ce qu'il existe une version plus courte pour les jours où j'ai moins de temps ?",
      createdAt: "2025-03-20T18:30:00.000Z",
      likes: 1,
      isLiked: false,
      isOwn: true
    }
  ]
};

/**
 * Liste de plusieurs entraînements fictifs
 */
export const mockWorkouts: Workout[] = [
  mockWorkout,
  {
    ...mockWorkout,
    id: "w002",
    title: "Endurance Longue Distance",
    subtitle: "Renforcez votre base aérobie et votre endurance",
    type: "Endurance",
    level: "intermediate",
    duration: 180,
    distance: 80,
    elevation: 850,
    calories: 1800,
    description: "Session d'endurance conçue pour développer votre capacité aérobie et votre efficacité énergétique sur de longues distances. Parfait pour préparer les cyclosportives et les longues sorties dans les montagnes vosgiennes ou le Jura alsacien.",
    featured: false,
    premium: false
  },
  {
    ...mockWorkout,
    id: "w003",
    title: "Sprint et Explosivité",
    subtitle: "Développez votre puissance maximale et votre accélération",
    type: "Sprint",
    level: "advanced",
    duration: 60,
    distance: 25,
    elevation: 200,
    calories: 550,
    description: "Entraînement focalisé sur le développement de la puissance explosive et la capacité à produire des efforts maximaux répétés. Idéal pour les coureurs souhaitant améliorer leurs sprints et leur accélération dans les berges finales.",
    featured: true,
    premium: true
  }
];

/**
 * Récupère un entraînement par son ID
 * 
 * @param {string} id - L'ID de l'entraînement à récupérer
 * @returns {Workout | undefined} L'entraînement correspondant ou undefined si non trouvé
 */
export const getWorkoutById = (id: string): Workout | undefined => {
  return mockWorkouts.find(workout => workout.id === id);
};

// Export par défaut des workouts pour faciliter l'importation
export default {
  workouts: mockWorkouts,
  getWorkoutById
};
