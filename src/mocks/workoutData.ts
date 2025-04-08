/**
 * Mocks de données pour le module d'entraînement
 * À utiliser uniquement en développement en attendant l'intégration avec l'API
 * 
 * Intégration prévue avec:
 * - Cache Service: Pour optimiser le chargement des données avec TTL et LRU
 * - Monitoring Service: Pour suivre les performances des requêtes
 * - User Profile Service: Pour associer les entraînements avec les profils utilisateurs
 */

export interface WorkoutInstructor {
  id: string;
  name: string;
  title: string;
  avatar: string;
  bio: string;
  experience: number;
  workouts: number;
  rating: number;
  social?: {
    twitter?: string;
    instagram?: string;
    strava?: string;
    [key: string]: string | undefined;
  };
  specialties?: string[];
  certifications?: string[];
}

export interface WorkoutSection {
  title: string;
  duration: number;
  description: string;
  targets: {
    type: 'power' | 'cadence' | 'heartrate' | string;
    value: string;
  }[];
}

export interface WorkoutEquipment {
  name: string;
  description: string;
  icon: string;
  optional: boolean;
}

export interface WorkoutMetrics {
  power?: {
    avg: number;
    normalized: number;
    max: number;
    zones: number[];
  };
  heartrate?: {
    avg: number;
    max: number;
    zones: number[];
  };
  cadence?: {
    avg: number;
    max: number;
    min: number;
  };
  elevation?: {
    total: number;
    avgGradient: number;
    maxGradient: number;
  };
}

export interface WorkoutComment {
  id: string;
  user: {
    id: string;
    name: string;
    avatar: string;
  };
  text: string;
  date: string;
  likes: number;
  liked?: boolean;
}

export interface Workout {
  id: string;
  title: string;
  type: 'endurance' | 'interval' | 'recovery' | 'strength' | 'climbing';
  difficulty: 'débutant' | 'intermédiaire' | 'avancé' | 'expert';
  duration: number;
  distance: number;
  elevation: number;
  instructor: WorkoutInstructor;
  description: string;
  sections: WorkoutSection[];
  equipment: WorkoutEquipment[];
  metrics: WorkoutMetrics;
  comments: WorkoutComment[];
  tips?: {
    title: string;
    description: string;
  }[];
}

const mockWorkouts: Workout[] = [
  {
    id: "w1",
    title: "Escalade du Mont Ventoux",
    type: "climbing",
    difficulty: "avancé",
    duration: 120,
    distance: 24.5,
    elevation: 1912,
    instructor: {
      id: "i1",
      name: "Thomas Voeckler",
      title: "Coach Pro & Ex-Champion de France",
      avatar: "/assets/instructors/voeckler.jpg",
      bio: "Ancien coureur professionnel français, connu pour son combativité et ses maillots jaunes sur le Tour de France. Spécialiste de la montagne et des parcours accidentés.",
      experience: 15,
      workouts: 47,
      rating: 4.9,
      social: {
        twitter: "thomasvoeckler",
        instagram: "thomasvoeckler",
        strava: "thomasvoeckler"
      },
      specialties: ["Montagne", "Endurance", "Tactique de course"],
      certifications: [
        "Diplôme d'État d'entraîneur cycliste",
        "Formation Directeur Sportif UCI",
        "Certification Nutrition Sportive"
      ]
    },
    description: "Cet entraînement vous prépare à l'ascension du mythique Mont Ventoux, le 'Géant de Provence'. Suivez un programme intensif d'entraînement en plusieurs phases pour améliorer votre endurance et votre technique en montée.",
    sections: [
      {
        title: "Échauffement progressif",
        duration: 20,
        description: "Commencez par un échauffement progressif sur terrain plat, en augmentant graduellement votre cadence et votre puissance.",
        targets: [
          { type: "power", value: "120-150W" },
          { type: "cadence", value: "85-95rpm" }
        ]
      },
      {
        title: "Pré-montée - approche tactique",
        duration: 15,
        description: "Préparation mentale et positionnement avant d'aborder les premières pentes. Travaillez sur votre position et anticipez les changements de rythme.",
        targets: [
          { type: "power", value: "150-180W" },
          { type: "cadence", value: "80-90rpm" }
        ]
      },
      {
        title: "Phase 1 - Premières pentes",
        duration: 25,
        description: "Abordez les premières pentes du Ventoux avec un rythme régulier. Concentrez-vous sur votre respiration et maintenez une cadence élevée pour économiser vos muscles.",
        targets: [
          { type: "power", value: "180-220W" },
          { type: "cadence", value: "75-85rpm" },
          { type: "heartrate", value: "Zone 3" }
        ]
      },
      {
        title: "Phase 2 - Section forestière",
        duration: 30,
        description: "Dans la forêt, les pentes sont plus constantes. Trouvez votre rythme idéal et tenez-le. Alternez entre position assise et position danseuse pour soulager vos muscles.",
        targets: [
          { type: "power", value: "220-260W" },
          { type: "cadence", value: "70-80rpm" },
          { type: "heartrate", value: "Zone 4" }
        ]
      },
      {
        title: "Phase 3 - Derniers kilomètres lunaires",
        duration: 20,
        description: "Sur les pentes lunaires du sommet, chaque coup de pédale compte. Gestion de l'effort et mental d'acier pour terminer cette ascension mythique.",
        targets: [
          { type: "power", value: "240-280W" },
          { type: "cadence", value: "65-75rpm" },
          { type: "heartrate", value: "Zone 4-5" }
        ]
      },
      {
        title: "Récupération au sommet",
        duration: 10,
        description: "Profitez de la vue imprenable et récupérez avant la descente. Hydratez-vous bien et préparez-vous mentalement pour la descente technique.",
        targets: [
          { type: "power", value: "100-120W" },
          { type: "heartrate", value: "Zone 1-2" }
        ]
      }
    ],
    equipment: [
      {
        name: "Vélo de route ou gravel",
        description: "Préférez un vélo léger avec des rapports adaptés à la montagne (compact 50/34 avec cassette 11-32 ou plus).",
        icon: "bike",
        optional: false
      },
      {
        name: "Capteur de puissance",
        description: "Pour suivre précisément vos zones d'effort pendant l'ascension.",
        icon: "activity",
        optional: true
      },
      {
        name: "Vêtements adaptables",
        description: "Prévoyez plusieurs couches car la température peut varier de +15°C entre le bas et le sommet.",
        icon: "thermometer",
        optional: false
      },
      {
        name: "Bidons (min. 2)",
        description: "L'hydratation est cruciale, surtout en été où les températures peuvent être extrêmes.",
        icon: "droplet",
        optional: false
      }
    ],
    metrics: {
      power: {
        avg: 225,
        normalized: 245,
        max: 320,
        zones: [5, 15, 35, 30, 15]
      },
      heartrate: {
        avg: 158,
        max: 185,
        zones: [0, 10, 25, 40, 25]
      },
      cadence: {
        avg: 78,
        max: 95,
        min: 65
      },
      elevation: {
        total: 1912,
        avgGradient: 7.5,
        maxGradient: 12
      }
    },
    comments: [
      {
        id: "c1",
        user: {
          id: "u2",
          name: "Sophie Martin",
          avatar: "/assets/users/sophie.jpg"
        },
        text: "J'ai suivi cet entraînement avant de faire le Ventoux cet été. La préparation par phases est vraiment efficace, surtout pour la partie lunaire !",
        date: "2025-03-20T10:15:00Z",
        likes: 8
      },
      {
        id: "c2",
        user: {
          id: "u3",
          name: "Marc Dupont",
          avatar: "/assets/users/marc.jpg"
        },
        text: "Le découpage par sections est très bien pensé, ça permet de bien gérer son effort. J'ajouterais qu'il faut vraiment faire attention au vent qui peut être très fort sur la partie finale.",
        date: "2025-03-15T16:30:00Z",
        likes: 5
      }
    ]
  },
  {
    id: "w2",
    title: "Fractionné Haute Intensité - Vosges",
    type: "interval",
    difficulty: "intermédiaire",
    duration: 90,
    distance: 35,
    elevation: 650,
    instructor: {
      id: "i2",
      name: "Marion Rousse",
      title: "Coach Élite & Consultante",
      avatar: "/assets/instructors/rousse.jpg",
      bio: "Ancienne championne de France, reconvertie avec succès comme consultante et directrice du Tour de France Femmes. Experte en préparation physique et analyse technique.",
      experience: 12,
      workouts: 38,
      rating: 4.8,
      social: {
        twitter: "Rousse_Marion",
        instagram: "rousse_marion",
        strava: "marionrousse"
      },
      specialties: ["Fractionné", "Analyse de performance", "Coaching féminin"],
      certifications: [
        "Diplôme Fédéral d'Entraîneur",
        "Certification Analyse de la Performance",
        "Formation Cyclisme au Féminin"
      ]
    },
    description: "Séance de fractionné haute intensité sur les routes vallonnées des Vosges. Idéal pour améliorer votre VO2max et votre capacité à répéter les efforts intenses. Parfait pour les coureurs cherchant à progresser sur les parcours accidentés et les courses nerveuses.",
    sections: [
      {
        title: "Échauffement progressif",
        duration: 15,
        description: "Échauffement sur routes plates à vallonnées, en augmentant progressivement l'intensité.",
        targets: [
          { type: "power", value: "120-150W" },
          { type: "cadence", value: "90-100rpm" }
        ]
      },
      {
        title: "Blocs d'intervalles 30/30",
        duration: 20,
        description: "10 répétitions d'efforts de 30 secondes à haute intensité, suivis de 30 secondes de récupération active.",
        targets: [
          { type: "power", value: "300-350W / 100-120W" },
          { type: "cadence", value: "100-110rpm / 80-90rpm" },
          { type: "heartrate", value: "Zone 5 / Zone 2" }
        ]
      },
      {
        title: "Récupération active",
        duration: 10,
        description: "Période de récupération à intensité légère pour préparer le prochain bloc.",
        targets: [
          { type: "power", value: "100-130W" },
          { type: "cadence", value: "85-95rpm" },
          { type: "heartrate", value: "Zone 1-2" }
        ]
      },
      {
        title: "Blocs d'intervalles 2'/1'",
        duration: 25,
        description: "5 répétitions d'efforts de 2 minutes à intensité sous-maximale, suivis d'1 minute de récupération.",
        targets: [
          { type: "power", value: "250-300W / 100-120W" },
          { type: "cadence", value: "85-95rpm / 80-90rpm" },
          { type: "heartrate", value: "Zone 4-5 / Zone 2" }
        ]
      },
      {
        title: "Retour au calme",
        duration: 15,
        description: "Récupération progressive pour terminer la séance et faciliter la récupération.",
        targets: [
          { type: "power", value: "100-130W" },
          { type: "cadence", value: "85-95rpm" },
          { type: "heartrate", value: "Zone 1" }
        ]
      }
    ],
    equipment: [
      {
        name: "Vélo de route",
        description: "Un vélo de route léger et réactif est idéal pour ce type de séance.",
        icon: "bike",
        optional: false
      },
      {
        name: "Capteur de puissance",
        description: "Fortement recommandé pour suivre avec précision les intervalles d'intensité.",
        icon: "activity",
        optional: false
      },
      {
        name: "Cardiofréquencemètre",
        description: "Pour surveiller votre fréquence cardiaque pendant les efforts et la récupération.",
        icon: "heart",
        optional: false
      },
      {
        name: "Nutrition sportive",
        description: "Prévoyez des gels ou boissons énergétiques pour maintenir l'intensité durant toute la séance.",
        icon: "coffee",
        optional: true
      }
    ],
    metrics: {
      power: {
        avg: 210,
        normalized: 235,
        max: 350,
        zones: [15, 25, 20, 15, 25]
      },
      heartrate: {
        avg: 162,
        max: 188,
        zones: [5, 15, 20, 30, 30]
      },
      cadence: {
        avg: 92,
        max: 110,
        min: 75
      },
      elevation: {
        total: 650,
        avgGradient: 4.2,
        maxGradient: 8.5
      }
    },
    comments: [
      {
        id: "c3",
        user: {
          id: "u4",
          name: "Thomas Laurent",
          avatar: "/assets/users/thomas.jpg"
        },
        text: "Séance très intense mais efficace ! J'ai vu une amélioration significative de ma capacité à enchaîner les efforts après quelques semaines de ce type d'entraînement.",
        date: "2025-03-18T08:45:00Z",
        likes: 12
      }
    ]
  }
];

/**
 * Récupère les données d'un entraînement spécifique par son ID
 * @param {string} workoutId - L'identifiant de l'entraînement à récupérer
 * @returns {Workout | undefined} Les données de l'entraînement ou undefined si non trouvé
 */
export const getMockWorkoutData = (workoutId: string): Workout | undefined => {
  return mockWorkouts.find(w => w.id === workoutId);
};

/**
 * Récupère la liste complète des entraînements
 * @returns {Workout[]} La liste des entraînements
 */
export const getMockWorkouts = (): Workout[] => {
  return [...mockWorkouts];
};

/**
 * Récupère les entraînements filtrés par type
 * @param {string} type - Le type d'entraînement à filtrer
 * @returns {Workout[]} La liste des entraînements filtrés
 */
export const getMockWorkoutsByType = (type: string): Workout[] => {
  return mockWorkouts.filter(w => w.type === type);
};

/**
 * Filtre des entraînements selon différents critères
 * @param {Object} filters - Critères de filtrage
 * @returns {Workout[]} La liste des entraînements filtrés
 */
export const filterMockWorkouts = (filters: {
  type?: string;
  difficulty?: string;
  duration?: [number, number];
  elevation?: [number, number];
  search?: string;
}): Workout[] => {
  return mockWorkouts.filter(workout => {
    // Filtre par type
    if (filters.type && workout.type !== filters.type) {
      return false;
    }
    
    // Filtre par difficulté
    if (filters.difficulty && workout.difficulty !== filters.difficulty) {
      return false;
    }
    
    // Filtre par durée
    if (filters.duration) {
      const [min, max] = filters.duration;
      if (workout.duration < min || workout.duration > max) {
        return false;
      }
    }
    
    // Filtre par dénivelé
    if (filters.elevation) {
      const [min, max] = filters.elevation;
      if (workout.elevation < min || workout.elevation > max) {
        return false;
      }
    }
    
    // Filtre par recherche textuelle
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const titleMatch = workout.title.toLowerCase().includes(searchLower);
      const descMatch = workout.description.toLowerCase().includes(searchLower);
      const instructorMatch = workout.instructor.name.toLowerCase().includes(searchLower);
      
      if (!(titleMatch || descMatch || instructorMatch)) {
        return false;
      }
    }
    
    return true;
  });
};
