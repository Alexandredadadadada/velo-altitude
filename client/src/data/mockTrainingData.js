/**
 * Données mockées pour le module Entraînement
 * Ces données simulent les réponses de l'API pour permettre le fonctionnement
 * en mode hors-ligne ou sans backend sur Netlify
 */

// Profil d'entraînement de l'utilisateur
export const trainingProfile = {
  id: 'default-user',
  ftp: 285, // Functional Threshold Power en watts
  heartRateZones: {
    z1: { min: 0, max: 125 },
    z2: { min: 126, max: 150 },
    z3: { min: 151, max: 165 },
    z4: { min: 166, max: 180 },
    z5: { min: 181, max: 195 }
  },
  powerZones: {
    z1: { min: 0, max: 170 },
    z2: { min: 171, max: 228 },
    z3: { min: 229, max: 256 },
    z4: { min: 257, max: 285 },
    z5: { min: 286, max: 342 },
    z6: { min: 343, max: 400 },
    z7: { min: 401, max: 1000 }
  },
  level: 'intermediate', // beginner, intermediate, advanced, elite
  experience: 4, // années
  weeklyAvailability: 12, // heures
  goals: {
    primary: 'endurance',
    secondary: 'climbing',
    events: ['Grand Ballon - 15 mai 2025', 'La Marmotte - 5 juillet 2025']
  },
  strengths: ['endurance', 'recovery'],
  weaknesses: ['explosive power', 'steep climbs']
};

// Plans d'entraînement générés
export const trainingPlans = [
  {
    id: 'improve-climbing',
    title: 'Amélioration des capacités en montagne',
    duration: 8, // semaines
    description: 'Un programme spécialement conçu pour améliorer votre performance sur les longs cols et les montées exigeantes.',
    level: 'intermediate',
    targetFtpIncrease: 25, // watts
    weeklyHours: 10,
    focusAreas: ['climbing', 'threshold power', 'muscular endurance'],
    expectedOutcomes: [
      'Augmentation de la puissance sur les longues montées',
      'Meilleure économie d\'effort sur terrain vallonné',
      'Capacité à maintenir une cadence efficace en montée'
    ],
    weeklySchedule: [
      {
        week: 1,
        theme: 'Adaptation',
        workouts: [
          {
            day: 'Lundi',
            title: 'Repos actif',
            type: 'recovery',
            duration: 45,
            description: 'Pédalage facile, récupération active',
            intensity: 'z1',
            completed: true
          },
          {
            day: 'Mardi',
            title: 'Répétitions en côte',
            type: 'climbing',
            duration: 90,
            description: '6 x 4 minutes en Z4 dans une côte à 5-8%, récupération 3 minutes en Z1',
            intensity: 'z3-z4',
            completed: true
          },
          {
            day: 'Mercredi',
            title: 'Endurance de base',
            type: 'endurance',
            duration: 120,
            description: 'Sortie longue à intensité modérée sur parcours vallonné',
            intensity: 'z2',
            completed: true
          },
          {
            day: 'Jeudi',
            title: 'Repos',
            type: 'rest',
            duration: 0,
            description: 'Récupération complète',
            intensity: 'none',
            completed: true
          },
          {
            day: 'Vendredi',
            title: 'Sweet Spot',
            type: 'threshold',
            duration: 75,
            description: '3 x 10 minutes en Sweet Spot (88-94% FTP), récupération 5 minutes en Z1',
            intensity: 'z3-z4',
            completed: true
          },
          {
            day: 'Samedi',
            title: 'Sortie longue avec intervalles',
            type: 'mixed',
            duration: 180,
            description: '3h avec 3-4 ascensions de 10-15 minutes à intensité progressive',
            intensity: 'z2-z4',
            completed: true
          },
          {
            day: 'Dimanche',
            title: 'Endurance de récupération',
            type: 'recovery',
            duration: 90,
            description: 'Sortie facile sur terrain plat, maintenir cadence élevée',
            intensity: 'z1-z2',
            completed: true
          }
        ]
      }
    ]
  },
  {
    id: 'event-preparation',
    title: 'Préparation La Marmotte',
    duration: 12, // semaines
    description: 'Plan d\'entraînement spécifique pour préparer la cyclosportive La Marmotte, avec ses 174 km et 5000m de dénivelé positif.',
    level: 'advanced',
    targetFtpIncrease: 20, // watts
    weeklyHours: 12,
    focusAreas: ['climbing', 'endurance', 'fatigue resistance'],
    expectedOutcomes: [
      'Capacité à enchaîner plusieurs cols difficiles',
      'Amélioration de l\'endurance sur très longue distance',
      'Optimisation de la gestion de l\'effort et de la nutrition'
    ],
    weeklySchedule: []
  }
];

// Données de séances d'entraînement spécifiques pour cols
export const colTrainingWorkouts = [
  {
    id: 'tourmalet-simulation',
    colId: 'col-du-tourmalet',
    title: 'Simulation Tourmalet',
    duration: 120, // minutes
    elevation: 1250, // mètres
    description: 'Cette séance simule l\'ascension du Tourmalet avec une progression d\'intensité pour préparer votre corps et votre mental à ce défi.',
    warmup: {
      duration: 15,
      description: '15 minutes d\'échauffement progressif, terminant par 3 accélérations de 30 secondes'
    },
    mainSet: [
      {
        duration: 20,
        zone: 'z2',
        description: 'Début d\'ascension à intensité modérée, établir un rythme'
      },
      {
        duration: 30,
        zone: 'z3',
        description: 'Augmenter légèrement l\'intensité, simule la partie médiane'
      },
      {
        duration: 15,
        zone: 'z4',
        description: 'Passage difficile, intensité élevée'
      },
      {
        duration: 10,
        zone: 'z3',
        description: 'Léger répit, maintenir un bon rythme'
      },
      {
        duration: 15,
        zone: 'z4',
        description: 'Section finale, effort soutenu'
      }
    ],
    cooldown: {
      duration: 15,
      description: '15 minutes de récupération active'
    },
    tips: [
      'Maintenez une cadence relativement élevée (75-85 rpm) même dans les passages difficiles',
      'Hydratez-vous régulièrement, visez 500-750ml par heure selon la température',
      'Adoptez une position confortable sur le vélo pour les longues montées'
    ],
    terrain: 'Idéalement sur home trainer avec simulation de pente ou sur une longue montée régulière'
  },
  {
    id: 'ventoux-preparation',
    colId: 'mont-ventoux',
    title: 'Préparation Mont Ventoux',
    duration: 150, // minutes
    elevation: 1600, // mètres
    description: 'Entraînement spécifique pour préparer l\'ascension du Mont Ventoux, avec un focus sur la gestion de l\'effort sur longue durée et dans des pentes variées.',
    warmup: {
      duration: 20,
      description: '20 minutes d\'échauffement progressif avec 5 minutes en Z2 à la fin'
    },
    mainSet: [
      {
        duration: 25,
        zone: 'z2-z3',
        description: 'Première section, établir un rythme confortable et régulier'
      },
      {
        duration: 35,
        zone: 'z3',
        description: 'Section forestière, maintenir l\'effort'
      },
      {
        duration: 20,
        zone: 'z3-z4',
        description: 'Passage au Chalet Reynard, augmenter l\'intensité'
      },
      {
        duration: 30,
        zone: 'z4',
        description: 'Section finale exposée, effort maximal soutenu'
      }
    ],
    cooldown: {
      duration: 20,
      description: '20 minutes de récupération active, descente prudente'
    },
    tips: [
      'Sur le vrai Ventoux, la section après Chalet Reynard est exposée au vent et au soleil - préparez-vous mentalement',
      'Apportez suffisamment d\'eau et de nutrition, pas de ravitaillement sur la partie finale',
      'Anticipez les changements météorologiques potentiels au sommet'
    ],
    terrain: 'Idéalement sur une longue montée régulière ou sur home trainer avec simulation de pente'
  }
];

// Données de progrès d'entraînement
export const trainingProgress = {
  weeklyVolume: [8.5, 10.2, 11.0, 9.5, 12.3, 11.8, 10.5, 13.0], // heures par semaine sur 8 semaines
  ftpHistory: [
    { date: '2024-11-15', value: 265 },
    { date: '2025-01-10', value: 272 },
    { date: '2025-02-25', value: 278 },
    { date: '2025-04-01', value: 285 }
  ],
  weeklyTss: [450, 520, 540, 480, 570, 550, 510, 620], // Training Stress Score
  completedWorkouts: [
    {
      date: '2025-04-05',
      title: 'Répétitions en seuil',
      planned: 75, // minutes
      actual: 78, // minutes
      tss: 85,
      averagePower: 245,
      normalizedPower: 265,
      averageHr: 162,
      elevationGain: 850,
      distance: 45,
      feeling: 4, // 1-5
      notes: 'Bonnes sensations, progression sur les derniers intervalles'
    },
    {
      date: '2025-04-03',
      title: 'Endurance longue',
      planned: 180,
      actual: 190,
      tss: 150,
      averagePower: 210,
      normalizedPower: 225,
      averageHr: 145,
      elevationGain: 1200,
      distance: 92,
      feeling: 3,
      notes: 'Fatigue dans les 30 dernières minutes, hydratation insuffisante'
    },
    {
      date: '2025-04-01',
      title: 'VO2max montée',
      planned: 90,
      actual: 92,
      tss: 110,
      averagePower: 230,
      normalizedPower: 255,
      averageHr: 168,
      elevationGain: 950,
      distance: 38,
      feeling: 5,
      notes: 'Excellente séance, puissance stable sur tous les intervalles'
    }
  ],
  upcomingWorkouts: [
    {
      date: '2025-04-07',
      title: 'Récupération active',
      duration: 60,
      description: 'Pédalage facile, cadence élevée, 100% Z1'
    },
    {
      date: '2025-04-08',
      title: 'Pyramide de puissance',
      duration: 90,
      description: 'Après échauffement: 1min/2min/3min/4min/3min/2min/1min en Z4-Z5, récupération égale à l\'effort'
    },
    {
      date: '2025-04-10',
      title: 'Sweet spot montée',
      duration: 120,
      description: '3x12 minutes à 88-92% FTP en montée, récupération 6 minutes'
    }
  ]
};

// Données du simulateur d'entraînement pour cols
export const colSimulatorData = {
  userFitness: {
    level: 'intermediate',
    ftp: 285,
    weight: 72, // kg
    experienceYears: 4,
    weeklyHours: 10,
    lastBigClimb: '2025-02-15', // date de la dernière grosse ascension
    specificPreparation: 65 // pourcentage de préparation spécifique pour les cols
  },
  recommendations: {
    trainingPlan: [
      {
        phase: 'Préparation spécifique',
        duration: '4 semaines',
        description: 'Focus sur les intervalles en montée et l\'endurance spécifique',
        keyWorkouts: [
          'Répétitions en côte: 6-8x5 minutes Z4 avec récupération en descente',
          'Sortie longue avec 3-4 ascensions significatives',
          'Intervalles Sweet Spot (88-94% FTP) de 15-20 minutes'
        ]
      },
      {
        phase: 'Affûtage',
        duration: '1 semaine',
        description: 'Réduction du volume, maintien de l\'intensité',
        keyWorkouts: [
          'Sortie courte avec 2-3 efforts courts à haute intensité',
          'Reconnaissance du col si possible',
          'Pédalage de récupération active'
        ]
      }
    ],
    nutrition: {
      beforeClimb: 'Repas riche en glucides la veille, petit-déjeuner léger 3h avant',
      duringClimb: '60-90g de glucides par heure, 500-750ml d\'eau par heure',
      afterClimb: 'Récupération immédiate: 20g protéines, 60g glucides'
    },
    pacing: {
      strategy: 'Effort négatif - commencer conservateur, augmenter progressivement',
      powerTarget: '75-82% FTP pendant la majorité de l\'ascension',
      estimatedTime: '85 minutes', // temps estimé pour l'ascension
      keySegments: [
        {
          name: 'Première section',
          strategy: 'Établir un rythme confortable, ne pas surengager',
          powerTarget: '75% FTP'
        },
        {
          name: 'Section médiane',
          strategy: 'Maintenir un effort stable',
          powerTarget: '80% FTP'
        },
        {
          name: 'Derniers kilomètres',
          strategy: 'Augmenter progressivement l\'effort si les sensations sont bonnes',
          powerTarget: '82-88% FTP'
        }
      ]
    }
  }
};

export default {
  trainingProfile,
  trainingPlans,
  colTrainingWorkouts,
  trainingProgress,
  colSimulatorData
};
