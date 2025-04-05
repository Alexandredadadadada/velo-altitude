/**
 * Bibliothèque complète de templates HIIT pour cyclistes
 * Organisée par niveaux et objectifs d'entraînement
 */

module.exports = {
  // Templates de base (niveau débutant)
  beginner: {
    introduction: {
      name: 'Introduction au HIIT',
      description: 'Séance d'introduction aux intervalles à haute intensité, idéale pour les débutants',
      structure: {
        warmupTime: 600, // 10 minutes
        intervals: { work: 30, rest: 90 },
        sets: 5,
        rounds: 1,
        restBetweenRounds: 0,
        cooldownTime: 600 // 10 minutes
      },
      intensity: 'medium',
      targetZone: 3,
      terrain: 'flat',
      totalTime: 1500, // 25 minutes
      physiologicalBenefits: [
        'Introduction à l\'entraînement par intervalles',
        'Amélioration de la capacité aérobie de base',
        'Adaptation cardiovasculaire progressive'
      ],
      recommendedFrequency: '1-2 fois par semaine',
      progressionTo: 'beginner.enduranceBuilder'
    },
    enduranceBuilder: {
      name: 'Constructeur d\'endurance',
      description: 'Intervalles modérés pour développer l\'endurance de base et la résistance cardiovasculaire',
      structure: {
        warmupTime: 600, // 10 minutes
        intervals: { work: 60, rest: 60 },
        sets: 6,
        rounds: 1,
        restBetweenRounds: 0,
        cooldownTime: 600 // 10 minutes
      },
      intensity: 'medium',
      targetZone: 3,
      terrain: 'flat',
      totalTime: 1920, // 32 minutes
      physiologicalBenefits: [
        'Développement de l\'endurance cardiovasculaire',
        'Amélioration de la capacité aérobie',
        'Renforcement musculaire progressif'
      ],
      recommendedFrequency: '2 fois par semaine',
      progressionTo: 'beginner.thresholdIntroduction'
    },
    thresholdIntroduction: {
      name: 'Introduction au seuil',
      description: 'Première approche des intervalles au seuil pour développer la résistance à la fatigue',
      structure: {
        warmupTime: 600, // 10 minutes
        intervals: { work: 180, rest: 120 },
        sets: 3,
        rounds: 1, 
        restBetweenRounds: 0,
        cooldownTime: 600 // 10 minutes
      },
      intensity: 'medium-high',
      targetZone: 4,
      terrain: 'rolling',
      totalTime: 1800, // 30 minutes
      physiologicalBenefits: [
        'Introduction au travail au seuil lactique',
        'Amélioration de la résistance à la fatigue',
        'Développement de la capacité à maintenir un effort prolongé'
      ],
      recommendedFrequency: '1 fois par semaine',
      progressionTo: 'intermediate.threshold'
    },
    recovery: {
      name: 'Récupération active',
      description: 'Séance légère avec alternance d\'intensité pour favoriser la récupération',
      structure: {
        warmupTime: 300, // 5 minutes
        intervals: { work: 30, rest: 90 },
        sets: 5,
        rounds: 1,
        restBetweenRounds: 0,
        cooldownTime: 300 // 5 minutes
      },
      intensity: 'low',
      targetZone: 2,
      terrain: 'flat',
      totalTime: 1200, // 20 minutes
      physiologicalBenefits: [
        'Facilitation de la récupération musculaire',
        'Élimination des déchets métaboliques',
        'Maintien de l\'activité cardiovasculaire sans stress significatif'
      ],
      recommendedFrequency: 'Après des séances intenses ou en période de fatigue',
      progressionTo: null
    }
  },
  
  // Templates intermédiaires
  intermediate: {
    threshold: {
      name: 'Séance au seuil',
      description: 'Intervalles au seuil lactique pour améliorer la capacité à maintenir un effort soutenu',
      structure: {
        warmupTime: 600, // 10 minutes
        intervals: { work: 300, rest: 150 },
        sets: 3,
        rounds: 1,
        restBetweenRounds: 0,
        cooldownTime: 600 // 10 minutes
      },
      intensity: 'high',
      targetZone: 4,
      terrain: 'rolling',
      totalTime: 2550, // 42.5 minutes
      physiologicalBenefits: [
        'Amélioration du seuil lactique',
        'Augmentation de la capacité à maintenir un effort prolongé',
        'Optimisation de l\'efficacité métabolique'
      ],
      recommendedFrequency: '1-2 fois par semaine',
      progressionTo: 'intermediate.sweetSpot'
    },
    sweetSpot: {
      name: 'Sweet Spot',
      description: 'Travail dans la zone "sweet spot" (entre le seuil et la VO2max) pour maximiser les gains d\'endurance',
      structure: {
        warmupTime: 600, // 10 minutes
        intervals: { work: 480, rest: 240 },
        sets: 3,
        rounds: 1,
        restBetweenRounds: 0,
        cooldownTime: 600 // 10 minutes
      },
      intensity: 'high',
      targetZone: 4.5, // Entre zone 4 et 5
      terrain: 'rolling',
      totalTime: 3960, // 66 minutes
      physiologicalBenefits: [
        'Développement optimal du seuil fonctionnel',
        'Amélioration de l\'endurance musculaire',
        'Balance idéale entre stress physiologique et récupération'
      ],
      recommendedFrequency: '1-2 fois par semaine',
      progressionTo: 'intermediate.vo2max'
    },
    vo2max: {
      name: 'Développement VO2max',
      description: 'Intervalles courts et intenses pour augmenter la consommation maximale d\'oxygène',
      structure: {
        warmupTime: 600, // 10 minutes
        intervals: { work: 180, rest: 180 },
        sets: 5,
        rounds: 1,
        restBetweenRounds: 0,
        cooldownTime: 600 // 10 minutes
      },
      intensity: 'very-high',
      targetZone: 5,
      terrain: 'flat',
      totalTime: 2400, // 40 minutes
      physiologicalBenefits: [
        'Augmentation de la VO2max',
        'Développement de la puissance aérobie',
        'Amélioration de la capacité cardiaque'
      ],
      recommendedFrequency: '1 fois par semaine',
      progressionTo: 'advanced.vo2maxExtended'
    },
    pyramide: {
      name: 'Pyramide croissante',
      description: 'Intervalles qui augmentent progressivement en durée puis diminuent',
      structure: {
        warmupTime: 600, // 10 minutes
        intervals: 'custom',
        customIntervals: [
          { work: 60, rest: 60 },
          { work: 120, rest: 60 },
          { work: 180, rest: 90 },
          { work: 240, rest: 120 },
          { work: 180, rest: 90 },
          { work: 120, rest: 60 },
          { work: 60, rest: 60 }
        ],
        sets: 1,
        rounds: 1,
        restBetweenRounds: 0,
        cooldownTime: 600 // 10 minutes
      },
      intensity: 'high',
      targetZone: 4,
      terrain: 'rolling',
      totalTime: 2490, // 41.5 minutes
      physiologicalBenefits: [
        'Développement complet des systèmes énergétiques',
        'Amélioration de la transition entre zones d\'intensité',
        'Renforcement mental et capacité d\'adaptation à l\'effort'
      ],
      recommendedFrequency: '1 fois par semaine',
      progressionTo: 'intermediate.microBurst'
    },
    microBurst: {
      name: 'Micro-bursts',
      description: 'Série d\'efforts très courts à haute intensité pour développer la capacité anaérobie',
      structure: {
        warmupTime: 600, // 10 minutes
        intervals: { work: 15, rest: 15 },
        sets: 10,
        rounds: 3,
        restBetweenRounds: 300,
        cooldownTime: 600 // 10 minutes
      },
      intensity: 'very-high',
      targetZone: 5,
      terrain: 'flat',
      totalTime: 2100, // 35 minutes
      physiologicalBenefits: [
        'Amélioration de la capacité anaérobie',
        'Développement de la puissance neuromusculaire',
        'Augmentation de la tolérance à l\'acide lactique'
      ],
      recommendedFrequency: '1 fois par semaine',
      progressionTo: 'advanced.tabata'
    }
  },
  
  // Templates avancés
  advanced: {
    vo2maxExtended: {
      name: 'VO2max étendu',
      description: 'Intervalles longs et intensifs pour maximiser le développement de la VO2max',
      structure: {
        warmupTime: 900, // 15 minutes
        intervals: { work: 240, rest: 240 },
        sets: 5,
        rounds: 1,
        restBetweenRounds: 0,
        cooldownTime: 900 // 15 minutes
      },
      intensity: 'very-high',
      targetZone: 5,
      terrain: 'flat',
      totalTime: 3300, // 55 minutes
      physiologicalBenefits: [
        'Maximisation de la VO2max',
        'Développement avancé de la puissance aérobie',
        'Amélioration de l\'efficacité cardiaque'
      ],
      recommendedFrequency: '1-2 fois par semaine pour les cyclistes compétitifs',
      progressionTo: 'advanced.over-unders'
    },
    'over-unders': {
      name: 'Over-Unders',
      description: 'Alternance d\'efforts au-dessus et en-dessous du seuil pour développer la résistance à la fatigue',
      structure: {
        warmupTime: 900, // 15 minutes
        intervals: 'custom',
        customIntervals: [
          { work: 180, intensity: 'high', zone: 4, rest: 0 },
          { work: 60, intensity: 'very-high', zone: 5, rest: 0 },
          { work: 180, intensity: 'high', zone: 4, rest: 0 },
          { work: 60, intensity: 'very-high', zone: 5, rest: 180 }
        ],
        sets: 3,
        rounds: 1,
        restBetweenRounds: 0,
        cooldownTime: 900 // 15 minutes
      },
      intensity: 'variable',
      targetZone: '4-5',
      terrain: 'rolling',
      totalTime: 3240, // 54 minutes
      physiologicalBenefits: [
        'Développement de la résistance au lactate',
        'Amélioration de la capacité à gérer les variations d\'intensité',
        'Préparation aux exigences des courses cyclistes'
      ],
      recommendedFrequency: '1 fois par semaine',
      progressionTo: 'advanced.30-30'
    },
    '30-30': {
      name: '30-30 Intensif',
      description: 'Alternance de périodes de 30 secondes à très haute intensité et de récupération active',
      structure: {
        warmupTime: 900, // 15 minutes
        intervals: { work: 30, rest: 30 },
        sets: 20,
        rounds: 1,
        restBetweenRounds: 0,
        cooldownTime: 900 // 15 minutes
      },
      intensity: 'max',
      targetZone: 6,
      terrain: 'flat',
      totalTime: 2700, // 45 minutes
      physiologicalBenefits: [
        'Développement de la puissance anaérobie',
        'Amélioration de la capacité à répéter les efforts intenses',
        'Augmentation de la résistance à la fatigue neuromusculaire'
      ],
      recommendedFrequency: '1 fois par semaine',
      progressionTo: 'advanced.attackSimulation'
    },
    attackSimulation: {
      name: 'Simulation d\'attaques',
      description: 'Séance qui reproduit les exigences des attaques en course avec efforts maximaux courts',
      structure: {
        warmupTime: 900, // 15 minutes
        intervals: 'custom',
        customIntervals: [
          { work: 15, intensity: 'max', zone: 7, rest: 45 },
          { work: 15, intensity: 'max', zone: 7, rest: 45 },
          { work: 15, intensity: 'max', zone: 7, rest: 45 },
          { work: 600, intensity: 'high', zone: 4, rest: 300 }
        ],
        sets: 3,
        rounds: 1,
        restBetweenRounds: 0,
        cooldownTime: 900 // 15 minutes
      },
      intensity: 'variable',
      targetZone: '4-7',
      terrain: 'rolling',
      totalTime: 3960, // 66 minutes
      physiologicalBenefits: [
        'Développement de la puissance explosive',
        'Amélioration de la capacité à maintenir l\'effort après des accélérations',
        'Préparation spécifique aux courses'
      ],
      recommendedFrequency: '1 fois par semaine pendant la phase de compétition',
      progressionTo: 'elite.raceSimulation'
    },
    tabata: {
      name: 'Tabata avancé',
      description: 'Version avancée du protocole Tabata avec intervalles de 20/10 à intensité maximale',
      structure: {
        warmupTime: 900, // 15 minutes
        intervals: { work: 20, rest: 10 },
        sets: 8,
        rounds: 2,
        restBetweenRounds: 300, // 5 minutes de récupération entre les rounds
        cooldownTime: 900 // 15 minutes
      },
      intensity: 'max',
      targetZone: 7,
      terrain: 'flat',
      totalTime: 2540, // 42.33 minutes
      physiologicalBenefits: [
        'Développement maximal des systèmes aérobie et anaérobie',
        'Amélioration significative de la VO2max',
        'Augmentation de la tolérance à l\'acide lactique'
      ],
      recommendedFrequency: '1 fois par semaine (pas plus en raison de l\'intensité extrême)',
      progressionTo: 'elite.supra-threshold'
    }
  },
  
  // Templates élite (pour cyclistes très avancés)
  elite: {
    'supra-threshold': {
      name: 'Supra-threshold',
      description: 'Intervalles prolongés juste au-dessus du seuil pour maximiser l\'adaptation physiologique',
      structure: {
        warmupTime: 1200, // 20 minutes
        intervals: { work: 480, rest: 240 },
        sets: 4,
        rounds: 1,
        restBetweenRounds: 0,
        cooldownTime: 1200 // 20 minutes
      },
      intensity: 'very-high',
      targetZone: 5,
      terrain: 'rolling',
      totalTime: 5280, // 88 minutes
      physiologicalBenefits: [
        'Maximisation de la puissance au seuil',
        'Développement du système tampon lactique',
        'Adaptation cardiovasculaire élite'
      ],
      recommendedFrequency: '1 fois par semaine pour cyclistes entraînés',
      progressionTo: 'elite.lactateShuttle'
    },
    lactateShuttle: {
      name: 'Navette lactique',
      description: 'Séance conçue pour améliorer la réutilisation du lactate comme substrat énergétique',
      structure: {
        warmupTime: 1200, // 20 minutes
        intervals: 'custom',
        customIntervals: [
          { work: 120, intensity: 'max', zone: 6, rest: 0 },
          { work: 240, intensity: 'medium', zone: 2, rest: 0 },
          { work: 120, intensity: 'max', zone: 6, rest: 0 },
          { work: 240, intensity: 'medium', zone: 2, rest: 120 }
        ],
        sets: 3,
        rounds: 1,
        restBetweenRounds: 0,
        cooldownTime: 1200 // 20 minutes
      },
      intensity: 'variable',
      targetZone: '2-6',
      terrain: 'rolling',
      totalTime: 4440, // 74 minutes
      physiologicalBenefits: [
        'Optimisation du métabolisme du lactate',
        'Amélioration de la récupération inter-efforts',
        'Développement de la capacité à enchaîner les efforts intenses'
      ],
      recommendedFrequency: '1 fois tous les 10-14 jours',
      progressionTo: 'elite.neuromuscularPower'
    },
    neuromuscularPower: {
      name: 'Puissance neuromusculaire',
      description: 'Développement de la puissance neuromusculaire à travers des efforts supra-maximaux',
      structure: {
        warmupTime: 1200, // 20 minutes
        intervals: { work: 10, rest: 170 },
        sets: 10,
        rounds: 1,
        restBetweenRounds: 0,
        cooldownTime: 1200 // 20 minutes
      },
      intensity: 'max',
      targetZone: 7,
      terrain: 'flat',
      totalTime: 3600, // 60 minutes
      physiologicalBenefits: [
        'Optimisation de la puissance maximale',
        'Développement du recrutement des fibres musculaires rapides',
        'Amélioration de la coordination neuromusculaire à haute cadence'
      ],
      recommendedFrequency: '1 fois par semaine pendant les phases spécifiques',
      progressionTo: 'elite.raceSimulation'
    },
    raceSimulation: {
      name: 'Simulation de course',
      description: 'Entraînement complet qui reproduit les exigences variables d\'une course cycliste',
      structure: {
        warmupTime: 1200, // 20 minutes
        intervals: 'custom',
        customIntervals: [
          // Phase 1: Départ et première sélection
          { work: 300, intensity: 'high', zone: 4, rest: 0 },
          { work: 30, intensity: 'max', zone: 7, rest: 0 },
          { work: 300, intensity: 'medium-high', zone: 3, rest: 0 },
          // Phase 2: Attaques intermédiaires
          { work: 60, intensity: 'very-high', zone: 6, rest: 0 },
          { work: 240, intensity: 'high', zone: 4, rest: 0 },
          { work: 60, intensity: 'very-high', zone: 6, rest: 0 },
          { work: 240, intensity: 'high', zone: 4, rest: 0 },
          // Phase 3: Pré-final et sprint
          { work: 300, intensity: 'high', zone: 4, rest: 0 },
          { work: 120, intensity: 'very-high', zone: 5, rest: 0 },
          { work: 20, intensity: 'max', zone: 7, rest: 0 }
        ],
        sets: 1,
        rounds: 1,
        restBetweenRounds: 0,
        cooldownTime: 1200 // 20 minutes
      },
      intensity: 'variable',
      targetZone: '3-7',
      terrain: 'variable',
      totalTime: 4070, // ~68 minutes
      physiologicalBenefits: [
        'Préparation spécifique aux courses',
        'Développement de la capacité à gérer les efforts variables',
        'Amélioration de la tactique et de la gestion de l\'effort'
      ],
      recommendedFrequency: '1 fois par semaine pendant la phase de compétition',
      progressionTo: null
    }
  },
  
  // Templates spécifiques par objectif
  specific: {
    // Programmes pour la perte de poids
    weightLoss: {
      fatBurning: {
        name: 'Brûleur de graisse',
        description: 'Intervalles modérés avec récupération active pour maximiser la combustion des graisses',
        structure: {
          warmupTime: 600, // 10 minutes
          intervals: { work: 120, rest: 60 },
          sets: 8,
          rounds: 1,
          restBetweenRounds: 0,
          cooldownTime: 600 // 10 minutes
        },
        intensity: 'medium',
        targetZone: 3,
        terrain: 'flat',
        totalTime: 2640, // 44 minutes
        physiologicalBenefits: [
          'Optimisation de l\'utilisation des graisses comme substrat',
          'Augmentation du métabolisme post-exercice',
          'Préservation de la masse musculaire'
        ],
        recommendedFrequency: '2-3 fois par semaine',
        progressionTo: 'specific.weightLoss.metabolicBooster'
      },
      metabolicBooster: {
        name: 'Boost métabolique',
        description: 'Combinaison d\'intervalles courts et intenses pour maximiser la dépense calorique',
        structure: {
          warmupTime: 600, // 10 minutes
          intervals: 'custom',
          customIntervals: [
            { work: 20, intensity: 'very-high', zone: 5, rest: 10 },
            { work: 20, intensity: 'very-high', zone: 5, rest: 10 },
            { work: 20, intensity: 'very-high', zone: 5, rest: 10 },
            { work: 20, intensity: 'very-high', zone: 5, rest: 60 }
          ],
          sets: 5,
          rounds: 1,
          restBetweenRounds: 0,
          cooldownTime: 600 // 10 minutes
        },
        intensity: 'variable',
        targetZone: 5,
        terrain: 'flat',
        totalTime: 1750, // ~29 minutes
        physiologicalBenefits: [
          'Effet EPOC (consommation d\'oxygène post-exercice) élevé',
          'Augmentation significative du métabolisme sur 24-48h',
          'Développement musculaire favorisant un métabolisme de base plus élevé'
        ],
        recommendedFrequency: '2 fois par semaine',
        progressionTo: null
      }
    },
    
    // Programmes pour l'endurance de fond
    endurance: {
      longSweetSpot: {
        name: 'Sweet Spot prolongé',
        description: 'Intervalles longs en zone sweet spot pour développer l\'endurance spécifique',
        structure: {
          warmupTime: 900, // 15 minutes
          intervals: { work: 1200, rest: 300 },
          sets: 2,
          rounds: 1,
          restBetweenRounds: 0,
          cooldownTime: 900 // 15 minutes
        },
        intensity: 'high',
        targetZone: 4,
        terrain: 'rolling',
        totalTime: 4800, // 80 minutes
        physiologicalBenefits: [
          'Développement de l\'endurance spécifique au seuil',
          'Amélioration de l\'économie d\'effort',
          'Adaptation métabolique pour les longues distances'
        ],
        recommendedFrequency: '1 fois par semaine',
        progressionTo: 'specific.endurance.tempoBlocks'
      },
      tempoBlocks: {
        name: 'Blocs de tempo',
        description: 'Alternance de périodes longues à intensité modérée et haute',
        structure: {
          warmupTime: 900, // 15 minutes
          intervals: 'custom',
          customIntervals: [
            { work: 1800, intensity: 'medium', zone: 3, rest: 0 },
            { work: 300, intensity: 'high', zone: 4, rest: 0 },
            { work: 1800, intensity: 'medium', zone: 3, rest: 0 },
            { work: 300, intensity: 'high', zone: 4, rest: 0 }
          ],
          sets: 1,
          rounds: 1,
          restBetweenRounds: 0,
          cooldownTime: 900 // 15 minutes
        },
        intensity: 'variable',
        targetZone: '3-4',
        terrain: 'rolling',
        totalTime: 6000, // 100 minutes
        physiologicalBenefits: [
          'Développement de l\'endurance fondamentale',
          'Amélioration de la capacité à changer de rythme sur de longues distances',
          'Adaptation métabolique et psychologique aux efforts prolongés'
        ],
        recommendedFrequency: '1 fois par semaine pour les cyclistes d\'endurance',
        progressionTo: null
      }
    },
    
    // Programmes pour le sprint et la puissance
    sprint: {
      sprintDevelopment: {
        name: 'Développement du sprint',
        description: 'Séance focalisée sur l\'amélioration de la puissance maximale et explosive',
        structure: {
          warmupTime: 900, // 15 minutes
          intervals: { work: 15, rest: 345 },
          sets: 6,
          rounds: 1,
          restBetweenRounds: 0,
          cooldownTime: 900 // 15 minutes
        },
        intensity: 'max',
        targetZone: 7,
        terrain: 'flat',
        totalTime: 3960, // 66 minutes
        physiologicalBenefits: [
          'Développement de la puissance explosive',
          'Amélioration du recrutement musculaire',
          'Optimisation du système anaérobie alactique'
        ],
        recommendedFrequency: '1 fois par semaine',
        progressionTo: 'specific.sprint.sprintResistance'
      },
      sprintResistance: {
        name: 'Résistance au sprint',
        description: 'Développement de la capacité à maintenir la puissance sur des sprints plus longs',
        structure: {
          warmupTime: 900, // 15 minutes
          intervals: 'custom',
          customIntervals: [
            { work: 15, intensity: 'max', zone: 7, rest: 45 },
            { work: 15, intensity: 'max', zone: 7, rest: 45 },
            { work: 15, intensity: 'max', zone: 7, rest: 45 },
            { work: 30, intensity: 'max', zone: 7, rest: 330 }
          ],
          sets: 4,
          rounds: 1,
          restBetweenRounds: 0,
          cooldownTime: 900 // 15 minutes
        },
        intensity: 'max',
        targetZone: 7,
        terrain: 'flat',
        totalTime: 3960, // 66 minutes
        physiologicalBenefits: [
          'Développement de la résistance à la fatigue dans les sprints',
          'Amélioration du système tampon lactique',
          'Optimisation de la technique de sprint sous fatigue'
        ],
        recommendedFrequency: '1 fois par semaine pour les sprinteurs',
        progressionTo: null
      }
    }
  }
};
