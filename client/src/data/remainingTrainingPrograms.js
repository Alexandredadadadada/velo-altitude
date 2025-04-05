/**
 * Données des 3 programmes d'entraînement restants pour Dashboard-Velo.com
 * - Programme spécial cols nordiques
 * - Programme altitude extrême
 * - Programme famille multi-niveaux
 */

const remainingTrainingPrograms = [
  // Programme #1 - Spécial Cols Nordiques
  {
    id: "nordic-cols-training",
    title: "Préparation Cols Nordiques",
    titleEn: "Nordic Cols Training",
    titleDe: "Training für nordische Pässe",
    level: "Intermédiaire-Avancé",
    duration: 8, // Semaines
    description: "Programme spécifique pour préparer les ascensions dans les conditions particulières des cols scandinaves (Norvège, Suède, Finlande). Adapté aux conditions venteuses, aux changements météorologiques rapides et aux routes exposées.",
    goalDescription: "Vous préparer aux défis spécifiques des ascensions nordiques: efforts irréguliers dus au vent, adaptation rapide aux changements météorologiques, et endurance spécifique pour les longues routes exposées.",
    targetAudience: "Cyclistes intermédiaires à avancés prévoyant de découvrir les cols scandinaves, notamment Trollstigen, Stalheimskleiva, ou Hardangervidda.",
    prerequisites: {
      fitnessLevel: "Pouvoir rouler confortablement 3h d'affilée",
      experience: "Au moins un an d'expérience en cyclisme régulier",
      equipment: ["Vélo de route ou gravel", "Home trainer (pour les séances par mauvais temps)", "Cardiofréquencemètre", "Vêtements adaptables multicouches"]
    },
    key_stats: {
      weeklyHours: { min: 6, max: 10 },
      totalDistance: { min: 800, max: 1200 }, // km
      elevationGain: { min: 10000, max: 15000 }, // mètres
      intensitySplit: {
        endurance: 65, // % du temps total
        threshold: 20, // % du temps total
        vo2max: 10, // % du temps total
        strength: 5 // % du temps total
      }
    },
    specificFeatures: [
      {
        name: "Entraînement par intervalles contre le vent",
        description: "Séances spécifiques simulant les efforts irréguliers causés par les vents des régions nordiques"
      },
      {
        name: "Bloc d'endurance par tous temps",
        description: "Sorties longues maintenues même dans des conditions météorologiques défavorables (adaptées en sécurité)"
      },
      {
        name: "Travail spécifique de changement de rythme",
        description: "Préparation aux routes nordiques qui alternent souvent entre plat et sections raides"
      },
      {
        name: "Travail mental de résilience",
        description: "Exercices de concentration et de persévérance dans des conditions difficiles"
      }
    ],
    weekByWeekPlan: [
      // Semaine 1
      {
        weekNumber: 1,
        theme: "Introduction et adaptation",
        totalHours: 6,
        workouts: [
          {
            day: 1,
            title: "Évaluation initiale",
            type: "Test",
            duration: 60, // minutes
            description: "Test FTP de 20 minutes pour déterminer vos zones d'entraînement + familiarisation avec le programme",
            details: "Échauffement de 15 min, test de 20 min à effort maximal soutenable, récupération de 15 min",
            indoorAlternative: "Identique sur home trainer"
          },
          {
            day: 3,
            title: "Endurance de base - simulation conditions venteuses",
            type: "Endurance",
            duration: 90,
            description: "Sortie à intensité variable simulant des conditions de vent changeantes",
            details: "10 min échauffement, puis alternez toutes les 5 min entre Z2 (65-75% FTP) et Z3 (76-90% FTP), 10 min retour au calme",
            indoorAlternative: "Séance similaire sur home trainer avec variations de résistance aléatoires"
          },
          {
            day: 5,
            title: "Force spécifique nordique",
            type: "Force",
            duration: 75,
            description: "Travail de force à basse cadence simulant les montées abruptes des cols nordiques",
            details: "Échauffement 15 min, puis 6 x (5 min en cadence 50-60rpm à 80-85% FTP, récup 3 min facile), retour au calme 10 min",
            indoorAlternative: "Identique sur home trainer avec résistance élevée"
          },
          {
            day: 7,
            title: "Endurance longue par temps variable",
            type: "Endurance",
            duration: 120,
            description: "Sortie longue idéalement avec conditions météorologiques changeantes (si possible en sécurité)",
            details: "Maintenir Z2 (65-75% FTP) pendant toute la sortie, avec attention particulière à l'hydratation et l'alimentation",
            indoorAlternative: "Diviser en deux séances de 60 min sur home trainer si nécessaire"
          }
        ],
        tips: "Cette première semaine établit la base. Privilégiez des sorties avec du vent si possible, ou utilisez un ventilateur orienté différemment pendant les séances indoor."
      },
      // Semaine 2
      {
        weekNumber: 2,
        theme: "Développement des capacités spécifiques",
        totalHours: 7,
        workouts: [
          {
            day: 1,
            title: "Récupération active",
            type: "Récupération",
            duration: 45,
            description: "Sortie légère pour récupérer de la semaine précédente",
            details: "Maintenir Z1 (<65% FTP) pendant toute la sortie, cadence élevée >90rpm",
            indoorAlternative: "Identique sur home trainer, très léger"
          },
          {
            day: 2,
            title: "Intervalles nordiques",
            type: "Intervalles",
            duration: 75,
            description: "Séance d'intervalles simulant les variations d'intensité dues au vent et au terrain",
            details: "15 min échauffement, puis 5 x (3 min Z4 (91-105% FTP), 1 min Z5 (106-120% FTP), 3 min récup), 10 min retour au calme",
            indoorAlternative: "Identique sur home trainer"
          },
          {
            day: 4,
            title: "Endurance et technique",
            type: "Endurance",
            duration: 90,
            description: "Travail d'endurance avec focus sur la technique en montée",
            details: "15 min échauffement, trouvez une montée de 5-10 min et répétez-la 3-4 fois en Z3 (76-90% FTP) en travaillant la position, 15 min retour au calme",
            indoorAlternative: "Simulation de montées sur home trainer"
          },
          {
            day: 6,
            title: "Force-endurance spécifique",
            type: "Force",
            duration: 80,
            description: "Développement de la force-endurance nécessaire pour les cols longs et exposés",
            details: "15 min échauffement, puis 4 x (8 min à 70-80rpm en Z3 (76-90% FTP), 4 min récup), 15 min retour au calme",
            indoorAlternative: "Identique sur home trainer"
          },
          {
            day: 7,
            title: "Sortie longue avec simulation météo",
            type: "Endurance",
            duration: 150,
            description: "Sortie longue idéalement avec conditions variables (pluie légère si sécurisé, ou changements de température)",
            details: "Maintenir Z2 (65-75% FTP), inclure si possible 2-3 montées de 10-15 min en Z3 (76-90% FTP)",
            indoorAlternative: "Deux séances de 75 min avec variations de température dans la pièce si possible"
          }
        ],
        tips: "Les cols nordiques exigent une adaptation rapide aux changements météorologiques. Entraînez-vous à changer de vêtements rapidement pendant vos sorties."
      },
      // Semaines 3-8 simplifiées pour ce document
      {
        weekNumber: "3-8",
        theme: "Progression et spécification",
        description: "Les semaines suivantes continuent la progression avec une augmentation graduelle du volume et de l'intensité, tout en incorporant davantage de simulations spécifiques aux conditions nordiques: sorties par vents forts, entraînement par températures variables, et travail mental de résilience.",
        keyWorkouts: [
          "Blocs d'intervalles venteux (simulant rafales et vents contraires)",
          "Sorties longues par temps changeant (si sécurisé)",
          "Séances de force spécifique à basse cadence",
          "Entraînement par températures variables (préparation aux microclimats nordiques)",
          "Simulation d'ascensions longues et exposées"
        ]
      }
    ],
    equipment_recommendations: [
      {
        category: "Vêtements",
        items: [
          {
            name: "Système multicouche complet",
            description: "Capacité à ajouter/enlever rapidement des couches selon les conditions changeantes"
          },
          {
            name: "Veste imperméable respirante",
            description: "Essentielle pour les conditions nordiques imprévisibles"
          },
          {
            name: "Gants imperméables",
            description: "Protection contre le froid et la pluie, cruciale en descente"
          }
        ]
      },
      {
        category: "Nutrition",
        items: [
          {
            name: "Boisson électrolytique renforcée",
            description: "Formule adaptée aux efforts prolongés par temps frais"
          },
          {
            name: "Barres énergétiques denses",
            description: "Nutrition concentrée qui reste consommable même par temps froid"
          }
        ]
      },
      {
        category: "Technique",
        items: [
          {
            name: "Développements adaptés",
            description: "Cassette avec grand pignon de 32 ou 34 dents recommandée pour les pentes raides"
          },
          {
            name: "Pneus 4 saisons",
            description: "Adhérence optimisée pour routes humides et conditions variables"
          }
        ]
      }
    ],
    nutritional_advice: {
      general: "Les conditions nordiques augmentent les besoins caloriques même par temps chaud. Prévoyez 10-15% de calories supplémentaires par rapport à votre consommation habituelle.",
      duringRide: "Consommez 60-90g de glucides par heure d'effort, avec une hydratation régulière même si la sensation de soif est réduite par le climat frais.",
      recovery: "Privilégiez une récupération protéinée chaude après les sorties par temps froid (ex: boisson protéinée chaude type chocolat protéiné)."
    },
    success_stories: [
      {
        name: "Martin K.",
        age: 42,
        background: "Cycliste amateur avec 5 ans d'expérience",
        testimonial: "Ce programme m'a parfaitement préparé aux conditions imprévisibles du Trollstigen. La simulation des conditions venteuses m'a permis de rester stable et confiant même dans les virages exposés."
      },
      {
        name: "Sophie L.",
        age: 36,
        background: "Triathlète reconvertie au cyclisme de montagne",
        testimonial: "J'ai suivi ce programme avant ma semaine de découverte des cols norvégiens. La préparation mentale à l'imprévisibilité météo a fait toute la différence!"
      }
    ],
    recovery_strategies: {
      active_recovery: "Marche nordique ou natation les jours de récupération pour maintenir une activité adaptée au climat nordique",
      sleep: "Insistez sur 8-9h de sommeil, particulièrement important pour l'adaptation aux journées longues des régions nordiques en été",
      nutrition: "Augmentez les acides gras oméga-3 dans votre alimentation (poissons gras nordiques, huiles de colza/lin)"
    },
    adaptability: {
      weather_conditions: "Programme conçu pour s'adapter aux conditions météorologiques variables. Les séances peuvent être modifiées selon les conditions réelles.",
      fitness_level: "Ajustez les intensités en fonction de votre niveau réel. Les débutants peuvent réduire les volumes de 20-30%."
    },
    video_resources: [
      {
        title: "Technique d'ascension par vent latéral",
        url: "/videos/training/nordic-cols/side-wind-technique.mp4",
        duration: "8:45"
      },
      {
        title: "Habillement optimal pour conditions changeantes",
        url: "/videos/training/nordic-cols/layering-system.mp4",
        duration: "6:20"
      },
      {
        title: "Préparation mentale aux conditions nordiques",
        url: "/videos/training/nordic-cols/mental-preparation.mp4",
        duration: "12:15"
      }
    ],
    scientific_background: "Ce programme est basé sur des recherches sur l'impact physiologique des conditions nordiques sur les performances cyclistes. Les cols nordiques présentent des défis uniques: passages abrupts, exposition aux vents, et changements météorologiques rapides qui nécessitent une adaptation spécifique du système cardiovasculaire et de la composition musculaire.",
    coach_contact: {
      name: "Lars Petersen",
      speciality: "Spécialiste des programmes nordiques",
      email: "lars.petersen@dashboard-velo.com"
    }
  },
  
  // Programme #2 sera dans un autre fichier pour respecter les limites
];

export { remainingTrainingPrograms };
