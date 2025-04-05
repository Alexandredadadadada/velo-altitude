/**
 * Programmes d'entraînement spéciaux pour Dashboard-Velo.com
 * - Programme FemmeVelo (spécifique aux cyclistes féminines)
 * - Programme perte de poids
 * - Programme HIIT (High-Intensity Interval Training)
 */

const specialTrainingPrograms = [
  // Programme #1 - FemmeVelo
  {
    id: "femme-velo-program",
    title: "Programme FemmeVelo",
    titleEn: "WomenCycling Program",
    titleDe: "FrauenRad Programm",
    level: "Tous niveaux",
    duration: 8, // Semaines
    description: "Programme conçu spécifiquement pour les femmes cyclistes, prenant en compte les particularités physiologiques féminines, les variations hormonales et les objectifs spécifiques. Adapté à tous les niveaux avec progressions personnalisées.",
    goalDescription: "Développer votre potentiel cycliste en tant que femme, en tenant compte des spécificités physiologiques féminines. Améliorer l'endurance, la force et la confiance sur le vélo tout en créant une communauté d'entraide.",
    targetAudience: "Femmes cyclistes de tous niveaux, débutantes à confirmées, souhaitant progresser avec une approche adaptée à leur physiologie",
    prerequisites: {
      fitnessLevel: "Tous niveaux - adaptations proposées",
      experience: "De débutante (savoir rouler en sécurité) à confirmée",
      equipment: ["Vélo de route, gravel ou VTT", "Cardiofréquencemètre recommandé", "Tenue adaptée (cuissard femme de qualité)"]
    },
    key_stats: {
      weeklyHours: { min: 4, max: 8 },
      totalDistance: { min: 500, max: 1200 }, // km
      elevationGain: { min: 5000, max: 12000 }, // mètres
      intensitySplit: {
        endurance: 70, // % du temps total
        threshold: 15, // % du temps total
        vo2max: 10, // % du temps total
        technique: 5 // % du temps total
      }
    },
    specificFeatures: [
      {
        name: "Synchronisation au cycle menstruel",
        description: "Planification intelligente des intensités en fonction des phases du cycle hormonal"
      },
      {
        name: "Focus ergonomie et confort",
        description: "Attention particulière portée aux aspects ergonomiques spécifiques aux femmes (position, points de contact)"
      },
      {
        name: "Dimension communautaire",
        description: "Intégration d'éléments favorisant la création de liens et le soutien entre participantes"
      },
      {
        name: "Renforcement musculaire ciblé",
        description: "Exercices spécifiques pour les zones souvent plus faibles chez les cyclistes féminines (haut du corps, stabilité pelvienne)"
      }
    ],
    weekByWeekPlan: [
      // Semaine 1
      {
        weekNumber: 1,
        theme: "Évaluation et fondamentaux",
        totalHours: 4,
        workouts: [
          {
            day: 1,
            title: "Évaluation initiale et positionnement",
            type: "Test et technique",
            duration: 60, // minutes
            description: "Session combinant évaluation du niveau et vérification du positionnement sur le vélo",
            details: "15 min échauffement, test FTP simplifié ou test de perception d'effort, suivi de vérifications de position et ajustements",
            indoorAlternative: "Test sur home trainer + auto-évaluation de la position avec vidéo si possible"
          },
          {
            day: 3,
            title: "Endurance fondamentale et gestuelle",
            type: "Endurance",
            duration: 75,
            description: "Travail d'endurance de base combiné à des exercices de technique de pédalage",
            details: "10 min échauffement, 55 min en Z2 (65-75% FTP) incluant 3 x 5 min de travail de pédalage à une jambe, 10 min retour au calme",
            indoorAlternative: "Session identique sur home trainer, focus sur la visualisation du pédalage rond"
          },
          {
            day: 5,
            title: "Renforcement spécifique hors vélo",
            type: "Force",
            duration: 45,
            description: "Séance de renforcement musculaire ciblé pour cyclistes féminines",
            details: "Circuit de 3 tours: gainage, ponts fessiers, pompes adaptées, fentes, travail des lombaires - 30s effort/30s récup",
            indoorAlternative: "Identique, à faire à la maison avec peu ou pas d'équipement"
          },
          {
            day: 7,
            title: "Sortie endurance en groupe",
            type: "Endurance",
            duration: 90,
            description: "Sortie longue idéalement en groupe de femmes pour renforcer l'aspect communautaire",
            details: "Maintenir Z2 (65-75% FTP) sur terrain varié mais éviter les grosses difficultés",
            indoorAlternative: "Session sur home trainer, potentiellement en groupe virtuel"
          }
        ],
        tips: "Pendant cette première semaine, concentrez-vous sur le confort et les sensations plutôt que sur la performance. Notez vos observations sur votre position et vos sensations pour les ajuster progressivement."
      },
      // Semaine 2
      {
        weekNumber: 2,
        theme: "Construction des fondations",
        totalHours: 5,
        workouts: [
          {
            day: 1,
            title: "Récupération active et mobilité",
            type: "Récupération",
            duration: 40,
            description: "Session légère combinée à des exercices de mobilité spécifiques",
            details: "30 min très facile en Z1 (<65% FTP), suivi de 10 min d'étirements dynamiques ciblant hanches et épaules",
            indoorAlternative: "Session courte sur home trainer + mobilité"
          },
          {
            day: 2,
            title: "Développement force-endurance",
            type: "Force",
            duration: 70,
            description: "Travail spécifique de force-endurance adaptée à la physiologie féminine",
            details: "15 min échauffement, puis 5 x (5 min à cadence modérée (70-80rpm) en Z3 (76-90% FTP), 3 min récup), 10 min retour au calme",
            indoorAlternative: "Identique sur home trainer avec focus sur l'engagement du haut du corps"
          },
          {
            day: 4,
            title: "Habileté technique et confiance",
            type: "Technique",
            duration: 60,
            description: "Session axée sur les compétences techniques pour renforcer la confiance",
            details: "Après échauffement, pratique de: freinage précis, trajectoires en virage, passage d'obstacles simples, démarrage en côte",
            indoorAlternative: "Travail de visualisation et exercices statiques de balance et position"
          },
          {
            day: 6,
            title: "Introduction aux intervalles",
            type: "Intervalles",
            duration: 65,
            description: "Première séance d'intervalles adaptée à la physiologie féminine",
            details: "15 min échauffement, 6 x (2 min Z4 (91-105% FTP), 3 min récup), 10 min retour au calme",
            indoorAlternative: "Identique sur home trainer avec attention à la récupération entre intervalles"
          },
          {
            day: 7,
            title: "Endurance progressive",
            type: "Endurance",
            duration: 120,
            description: "Sortie longue avec sections à intensité légèrement plus élevée",
            details: "15 min échauffement, puis alternance de Z2 (65-75% FTP) et Z3 (76-90% FTP): 20 min Z2, 10 min Z3, 30 min Z2, 10 min Z3, 20 min Z2, 15 min retour au calme",
            indoorAlternative: "Version raccourcie sur home trainer avec film motivant"
          }
        ],
        tips: "En phase folliculaire (début de cycle), profitez de ces jours pour placer les entraînements plus intenses. En phase lutéale, privilégiez l'endurance et la technique."
      },
      // Semaines 3-8 simplifiées pour ce document
      {
        weekNumber: "3-5",
        theme: "Développement adaptatif",
        description: "Ces semaines développent progressivement l'endurance et la puissance tout en respectant les phases du cycle menstruel. Intensification graduelle avec attention particulière à la récupération.",
        keyWorkouts: [
          "Séances de seuil adaptées aux phases du cycle",
          "Renforcement musculaire spécifique hors vélo",
          "Sorties longues progressives avec sections de tempo",
          "Travail technique en groupe pour renforcer confiance et communauté"
        ]
      },
      {
        weekNumber: "6-8",
        theme: "Consolidation et spécialisation",
        description: "Phase finale avec affinage des compétences et intégration complète de la synchronisation au cycle menstruel. Préparation à un objectif concret: événement cyclosportif, voyage à vélo, ou défi personnel.",
        keyWorkouts: [
          "Séances spécifiques selon objectif personnel",
          "Simulation d'événement ou défi à échelle réduite",
          "Renforcement des aspects communautaires et partage d'expérience",
          "Bilan et plan de progression future"
        ]
      }
    ],
    equipment_recommendations: [
      {
        category: "Confort",
        items: [
          {
            name: "Selle adaptée à l'anatomie féminine",
            description: "Élément crucial pour le confort à long terme et la prévention des problèmes"
          },
          {
            name: "Cuissard femme de qualité",
            description: "Avec chamois spécifique femme et coupe adaptée au bassin féminin"
          },
          {
            name: "Gants avec rembourrage adapté",
            description: "Protection contre les compressions nerveuses, fréquentes chez les cyclistes féminines"
          }
        ]
      },
      {
        category: "Ergonomie",
        items: [
          {
            name: "Cintre de largeur adaptée",
            description: "Généralement plus étroit que pour les hommes, correspondant à la largeur des épaules"
          },
          {
            name: "Potence adaptée",
            description: "Souvent plus courte pour une position confortable pour le haut du corps"
          }
        ]
      },
      {
        category: "Suivi et communauté",
        items: [
          {
            name: "Application de suivi du cycle",
            description: "Pour synchroniser vos entraînements avec votre cycle hormonal"
          },
          {
            name: "Accès à un groupe ou communauté féminine",
            description: "Le soutien entre femmes est un facteur clé de motivation et progression"
          }
        ]
      }
    ],
    nutritional_advice: {
      general: "Les besoins nutritionnels féminins diffèrent des hommes et varient selon les phases du cycle. L'apport en fer et en calcium est particulièrement important.",
      duringRide: "40-70g de glucides par heure selon l'intensité, avec attention particulière à l'hydratation qui peut être affectée par les hormones",
      recovery: "Privilégiez des protéines de qualité (15-25g) dans les 30 minutes post-effort, particulièrement importantes pour les femmes",
      cycleSynchronization: {
        follicular: "Phase favorable pour l'utilisation des glucides, idéale pour les sessions intenses",
        luteal: "Augmentez légèrement les apports protéiques et lipidiques, réduisez légèrement l'intensité des efforts"
      }
    },
    success_stories: [
      {
        name: "Claire D.",
        age: 38,
        background: "Débutante qui n'avait jamais fait de sport",
        testimonial: "Ce programme a complètement changé ma relation au vélo. La prise en compte de mon cycle a été révélatrice - je comprends maintenant pourquoi certains jours sont plus difficiles que d'autres, et comment adapter mon entraînement en conséquence."
      },
      {
        name: "Mélanie T.",
        age: 42,
        background: "Cycliste expérimentée après grossesse",
        testimonial: "Après ma grossesse, je n'arrivais pas à retrouver mon niveau. L'approche spécifique de ce programme m'a permis de reconstruire progressivement ma force et mon endurance, tout en respectant les changements de mon corps."
      }
    ],
    recovery_strategies: {
      hormonal_adaptation: "Accordez une attention particulière à la récupération pendant la phase prémenstruelle et menstruelle, périodes où le corps est plus vulnérable à la fatigue",
      specific_recovery: "Privilégiez les techniques de récupération ciblant les zones de tension spécifiques aux femmes: bas du dos, trapèzes, psoas",
      sleep: "Le sommeil est encore plus crucial pendant certaines phases du cycle - visez 7-9h de qualité"
    },
    adaptability: {
      cycle_variability: "Le programme s'adapte automatiquement aux variations de votre cycle, avec options pour cycles irréguliers ou absence de cycle",
      pregnancy: "Des modifications sont proposées pour les femmes enceintes ou post-partum, après validation médicale",
      menopause: "Des ajustements spécifiques sont disponibles pour les femmes en périménopause ou ménopause"
    },
    video_resources: [
      {
        title: "Positionnement optimal féminin sur le vélo",
        url: "/videos/training/femme-velo/optimal-position.mp4",
        duration: "9:30"
      },
      {
        title: "Renforcement musculaire spécifique pour cyclistes féminines",
        url: "/videos/training/femme-velo/strength-training.mp4",
        duration: "12:15"
      },
      {
        title: "Synchroniser cycle menstruel et entraînement",
        url: "/videos/training/femme-velo/cycle-sync.mp4",
        duration: "10:45"
      }
    ],
    scientific_background: "Ce programme est fondé sur les recherches récentes en physiologie féminine appliquée au cyclisme. Les femmes présentent des différences significatives en termes de composition corporelle, d'endurance à la fatigue, et de réponse aux stimuli d'entraînement selon les phases hormonales. Notre approche intègre ces spécificités pour optimiser progression et bien-être.",
    coach_contact: {
      name: "Émilie Moreau",
      speciality: "Coach certifiée spécialisée cyclisme féminin",
      email: "emilie.moreau@dashboard-velo.com"
    }
  }
];

export { specialTrainingPrograms };
