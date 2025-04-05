/**
 * Données des programmes d'entraînement restants (2/3) pour Dashboard-Velo.com
 * - Programme altitude extrême
 */

const remainingTrainingPrograms2 = [
  // Programme #2 - Altitude Extrême
  {
    id: "extreme-altitude-training",
    title: "Préparation Altitude Extrême",
    titleEn: "Extreme Altitude Training",
    titleDe: "Training für Extremhöhen",
    level: "Avancé",
    duration: 10, // Semaines
    description: "Programme spécialisé pour préparer les cyclistes aux ascensions à très haute altitude (cols au-dessus de 2000m). Focalisé sur les adaptations physiologiques nécessaires pour performer en conditions d'hypoxie relative.",
    goalDescription: "Vous préparer spécifiquement aux défis des cols à haute altitude: baisse de performance liée à la raréfaction de l'oxygène, récupération plus difficile, et exigences cardio-respiratoires spécifiques.",
    targetAudience: "Cyclistes avancés visant des cols mythiques à haute altitude comme le Stelvio, le Galibier, ou l'Iseran, ou prévoyant des voyages cyclistes en altitude (Andes, Himalaya)",
    prerequisites: {
      fitnessLevel: "Bon niveau d'endurance, FTP >3.2 W/kg recommandée",
      experience: "Au moins deux ans d'expérience en cyclisme régulier, y compris en montagne",
      equipment: ["Vélo de route avec développements adaptés", "Home trainer smart permettant la simulation d'altitude", "Cardiofréquencemètre et capteur de puissance", "Oxymètre de pouls (fortement recommandé)"]
    },
    key_stats: {
      weeklyHours: { min: 8, max: 14 },
      totalDistance: { min: 1200, max: 1800 }, // km
      elevationGain: { min: 18000, max: 25000 }, // mètres
      intensitySplit: {
        endurance: 60, // % du temps total
        threshold: 25, // % du temps total
        vo2max: 10, // % du temps total
        strength: 5 // % du temps total
      }
    },
    specificFeatures: [
      {
        name: "Simulation d'altitude sur home trainer",
        description: "Séances spécifiques avec modulation du rythme respiratoire simulant les conditions d'altitude"
      },
      {
        name: "Blocs de répétitions de cols",
        description: "Enchainement de montées pour préparer l'organisme à l'effort prolongé en déficit d'oxygène"
      },
      {
        name: "Travail respiratoire spécifique",
        description: "Exercices ciblés pour renforcer les muscles respiratoires, particulièrement sollicités en altitude"
      },
      {
        name: "Protocole d'acclimatation progressive",
        description: "Semaines finales avec augmentation progressive de l'altitude simulée pour favoriser les adaptations physiologiques"
      }
    ],
    weekByWeekPlan: [
      // Semaine 1
      {
        weekNumber: 1,
        theme: "Évaluation et base",
        totalHours: 8,
        workouts: [
          {
            day: 1,
            title: "Tests initiaux avec mesures cardio-respiratoires",
            type: "Test",
            duration: 75, // minutes
            description: "Test FTP complet avec mesure de fréquence cardiaque, puissance et saturation en oxygène si disponible",
            details: "20 min échauffement, test FTP de 20 min, 20 min récupération. Notez la FC max et moyenne",
            indoorAlternative: "Identique sur home trainer, idéalement avec masque respiratoire pour mesurer ventilation"
          },
          {
            day: 3,
            title: "Renforcement des muscles respiratoires",
            type: "Spécifique",
            duration: 60,
            description: "Séance combinant exercices respiratoires et effort modéré",
            details: "15 min échauffement, puis 6 x (4 min Z3 (76-90% FTP) avec respiration contrôlée 3s inspiration/3s expiration, 2 min récup normale), 10 min retour au calme",
            indoorAlternative: "Identique sur home trainer"
          },
          {
            day: 5,
            title: "Développement seuil aérobie",
            type: "Seuil",
            duration: 90,
            description: "Travail au seuil pour améliorer l'endurance aérobie, base de la performance en altitude",
            details: "20 min échauffement, 3 x (12 min Z4 (91-105% FTP), récup 6 min), 10 min retour au calme",
            indoorAlternative: "Identique sur home trainer avec ventilation réduite si possible"
          },
          {
            day: 7,
            title: "Sortie longue avec dénivelé",
            type: "Endurance",
            duration: 180,
            description: "Endurance de base avec accumulation de dénivelé modéré",
            details: "Maintenir Z2 (65-75% FTP) sur l'ensemble, inclure au moins 1000m de dénivelé positif",
            indoorAlternative: "Séance divisée en deux blocs de 90 min avec simulation de montées"
          }
        ],
        tips: "Cette première semaine établit les références et commence à préparer votre système cardio-respiratoire. Surveillez votre fréquence cardiaque par rapport à la puissance développée."
      },
      // Semaine 2
      {
        weekNumber: 2,
        theme: "Développement cardio-respiratoire",
        totalHours: 9,
        workouts: [
          {
            day: 1,
            title: "Récupération active",
            type: "Récupération",
            duration: 45,
            description: "Sortie légère pour récupérer des efforts du weekend",
            details: "Maintenir Z1 (<65% FTP) pendant toute la sortie, cadence élevée >90rpm, pratique respiration nasale",
            indoorAlternative: "Identique sur home trainer, très léger"
          },
          {
            day: 2,
            title: "Intervalles sous-respiratoires",
            type: "VO2max",
            duration: 75,
            description: "Séance d'intervalles avec respiration contrôlée pour simuler l'altitude",
            details: "15 min échauffement, puis 5 x (3 min Z5 (106-120% FTP) en respirant uniquement par le nez OU en réduisant volontairement la fréquence respiratoire, 3 min récup complète), 15 min retour au calme",
            indoorAlternative: "Identique sur home trainer, encore plus efficace avec réduction artificielle d'oxygène"
          },
          {
            day: 4,
            title: "Escalade progressive",
            type: "Seuil",
            duration: 90,
            description: "Simulation d'une longue ascension avec augmentation progressive de l'intensité",
            details: "15 min échauffement, puis 45 min d'effort continu avec 15 min en Z2 (65-75% FTP), 15 min en Z3 (76-90% FTP), 15 min en Z4 (91-105% FTP), 15 min retour au calme",
            indoorAlternative: "Identique sur home trainer avec augmentation progressive de la pente"
          },
          {
            day: 6,
            title: "Force-endurance spécifique altitude",
            type: "Force",
            duration: 80,
            description: "Développement de la force à basse cadence, crucial en altitude où la puissance diminue",
            details: "15 min échauffement, puis 5 x (6 min à 50-60rpm en Z3 (76-90% FTP), 4 min récup), 15 min retour au calme",
            indoorAlternative: "Identique sur home trainer avec résistance élevée"
          },
          {
            day: 7,
            title: "Block de montées répétées",
            type: "Endurance-montagne",
            duration: 210,
            description: "Accumulation de dénivelé avec répétitions d'une même montée",
            details: "Trouvez une montée de 20-30 min et répétez-la 3-4 fois à intensité Z2-Z3 (65-90% FTP), récupération en descente",
            indoorAlternative: "Séance longue sur home trainer avec 4-5 simulations de cols"
          }
        ],
        tips: "Commencez à prêter attention à votre ressenti respiratoire. En altitude, votre respiration sera plus rapide et moins efficace - ces exercices commencent à préparer votre corps."
      },
      // Semaines 3-10 simplifiées pour ce document
      {
        weekNumber: "3-6",
        theme: "Progression et adaptation",
        description: "Ces semaines augmentent progressivement le volume et l'intensité. Le focus est mis sur la répétition de montées et le travail respiratoire spécifique. Introduction progressive de séances de simulation d'altitude plus poussées.",
        keyWorkouts: [
          "Séances de seuil avec restriction respiratoire volontaire",
          "Blocs de montées multiples (2000-3000m de dénivelé par sortie longue)",
          "Exercices de respiration spécifiques hors vélo (15 min/jour)",
          "Séances d'intervalles hypoxiques (si disponible)"
        ]
      },
      {
        weekNumber: "7-10",
        theme: "Spécialisation et acclimatation",
        description: "Phase finale avec simulation d'acclimatation à l'altitude. Volume légèrement réduit mais intensité maintenue. Si possible, inclure un camp d'entraînement en moyenne montagne (1500-2000m).",
        keyWorkouts: [
          "Séances de simulation d'ascensions complètes des cols ciblés",
          "Blocs d'altitude simulée (respiratoire ou équipement spécifique)",
          "Protocole d'acclimatation progressive (dormir en altitude simulée si possible)",
          "Tests de performance en condition d'hypoxie relative"
        ]
      }
    ],
    equipment_recommendations: [
      {
        category: "Mesure et analyse",
        items: [
          {
            name: "Oxymètre de pouls",
            description: "Pour surveiller votre saturation en oxygène pendant les séances simulant l'altitude"
          },
          {
            name: "Capteur de puissance",
            description: "Essentiel pour maintenir une intensité appropriée malgré les sensations trompeuses en altitude"
          },
          {
            name: "Masque d'entraînement respiratoire",
            description: "Permet de simuler partiellement les conditions d'altitude (optionnel mais recommandé)"
          }
        ]
      },
      {
        category: "Nutrition",
        items: [
          {
            name: "Compléments en fer",
            description: "À discuter avec un médecin - souvent bénéfiques pour optimiser le transport d'oxygène"
          },
          {
            name: "Hydratation électrolytique renforcée",
            description: "Formule spécifique pour compenser la déshydratation accélérée en altitude"
          }
        ]
      },
      {
        category: "Technique",
        items: [
          {
            name: "Rapport de développement très souple",
            description: "Cassette 11-34 minimum, voire plus facile pour compenser la perte de puissance en altitude"
          },
          {
            name: "Roues légères",
            description: "Chaque gramme compte encore plus en altitude où l'oxygène est rare"
          }
        ]
      }
    ],
    nutritional_advice: {
      general: "L'altitude augmente le métabolisme et les besoins caloriques de 10-15%. La déshydratation est également plus rapide et moins perceptible.",
      duringRide: "Augmentez votre consommation de glucides de 20% par rapport à votre habitude (70-100g/heure) et hydratez-vous toutes les 15 minutes même sans soif.",
      recovery: "La récupération est ralentie en altitude. Doublez votre apport protéique post-effort et augmentez vos glucides complexes le soir.",
      supplements: "Une supplémentation en fer peut être bénéfique après consultation médicale. Les antioxydants naturels aident à combattre le stress oxydatif accru en altitude."
    },
    success_stories: [
      {
        name: "Pierre M.",
        age: 38,
        background: "Cycliste passionné visant les grands cols alpins",
        testimonial: "Ce programme m'a permis d'enchaîner Galibier-Iseran-Agnel en trois jours sans ressentir les effets délétères de l'altitude qui m'avaient terrassé l'an dernier."
      },
      {
        name: "Amélie D.",
        age: 33,
        background: "Ex-coureuse amateur préparant un voyage dans les Andes",
        testimonial: "La préparation respiratoire spécifique a fait toute la différence pour mon voyage cycliste au Pérou. J'ai pu profiter des cols à 4000m sans les terribles maux de tête habituels!"
      }
    ],
    recovery_strategies: {
      active_recovery: "Marche en côte à intensité très faible pour maintenir l'acclimatation sans fatigue supplémentaire",
      sleep: "Priorité absolue avec 8-9h par nuit, potentiellement en utilisant une tente hypoxique les dernières semaines (si disponible)",
      nutrition: "Insistez sur les aliments riches en fer (viandes rouges maigres, légumineuses) et antioxydants (baies, noix)"
    },
    adaptability: {
      altitude_exposure: "Le programme peut être optimisé selon vos possibilités d'exposition réelle à l'altitude pendant l'entraînement",
      equipment: "Les séances peuvent être adaptées selon l'équipement disponible (avec/sans simulateur d'altitude)"
    },
    video_resources: [
      {
        title: "Technique respiratoire optimale en altitude",
        url: "/videos/training/extreme-altitude/optimal-breathing.mp4",
        duration: "10:30"
      },
      {
        title: "Gestion de l'effort au-dessus de 2000m",
        url: "/videos/training/extreme-altitude/effort-management.mp4",
        duration: "8:45"
      },
      {
        title: "Signes d'alerte du mal aigu des montagnes",
        url: "/videos/training/extreme-altitude/altitude-sickness.mp4",
        duration: "7:20"
      }
    ],
    scientific_background: "Ce programme est fondé sur les recherches en physiologie d'altitude. L'exposition à l'altitude provoque une cascade d'adaptations: augmentation des globules rouges, densification capillaire, et modification du métabolisme énergétique. Notre approche progressive permet d'optimiser ces adaptations tout en évitant le surentraînement.",
    coach_contact: {
      name: "Dr. Elena Rodriguez",
      speciality: "Physiologiste d'altitude et coach cycliste",
      email: "elena.rodriguez@dashboard-velo.com"
    }
  }
];

export { remainingTrainingPrograms2 };
