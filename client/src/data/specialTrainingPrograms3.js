/**
 * Programmes d'entraînement spéciaux (3/3) pour Dashboard-Velo.com
 * - Programme HIIT (High-Intensity Interval Training)
 */

const specialTrainingPrograms3 = [
  // Programme #3 - HIIT (High-Intensity Interval Training)
  {
    id: "hiit-cycling-program",
    title: "Programme HIIT Cyclisme",
    titleEn: "HIIT Cycling Program",
    titleDe: "HIIT-Radsportprogramm",
    level: "Intermédiaire à Avancé",
    duration: 8, // Semaines
    description: "Programme d'entraînement par intervalles à haute intensité spécifiquement conçu pour les cyclistes cherchant à maximiser leurs gains de performance en un minimum de temps. Basé sur les dernières recherches scientifiques en physiologie de l'effort.",
    goalDescription: "Développer rapidement votre puissance, votre capacité anaérobie et votre VO2max grâce à des séances courtes mais extrêmement efficaces. Idéal pour les cyclistes pressés ou en complément d'un entraînement d'endurance.",
    targetAudience: "Cyclistes intermédiaires à avancés cherchant à améliorer significativement leurs performances, personnes avec peu de temps disponible pour l'entraînement, cyclistes en phase de préparation spécifique",
    prerequisites: {
      fitnessLevel: "Bonne base d'endurance établie (min. 3 mois de pratique régulière)",
      experience: "Maîtrise technique du vélo et expérience des efforts intenses",
      equipment: ["Vélo de route ou home trainer", "Cardiofréquencemètre obligatoire", "Capteur de puissance fortement recommandé"]
    },
    key_stats: {
      weeklyHours: { min: 3, max: 6 },
      totalDistance: { min: 400, max: 800 }, // km
      sessionDuration: { min: 30, max: 75 }, // minutes
      intensitySplit: {
        warmup: 20, // % du temps total
        hiit: 30, // % du temps total
        recovery: 40, // % du temps total
        cooldown: 10 // % du temps total
      }
    },
    specificFeatures: [
      {
        name: "Protocoles HIIT scientifiquement validés",
        description: "Séances basées sur les protocoles les plus efficaces selon la recherche (Tabata, 30/30, 4x4, etc.)"
      },
      {
        name: "Progression méthodique des ratios effort/récupération",
        description: "Évolution progressive de l'intensité et de la densité des séances pour maximiser les adaptations"
      },
      {
        name: "Variété des stimuli d'entraînement",
        description: "Alternance stratégique des types d'intervalles pour cibler différents systèmes énergétiques"
      },
      {
        name: "Récupération optimisée",
        description: "Structure précise des périodes de récupération entre séances pour maximiser les adaptations sans surentraînement"
      }
    ],
    weekByWeekPlan: [
      // Semaine 1
      {
        weekNumber: 1,
        theme: "Introduction et adaptation",
        totalHours: 3.5,
        workouts: [
          {
            day: 1,
            title: "Évaluation FTP/PMA",
            type: "Test",
            duration: 60, // minutes
            description: "Test pour établir vos zones d'entraînement précises, essentiel pour calibrer correctement les intensités HIIT",
            details: "15 min échauffement progressif, test FTP de 20 min OU test de puissance maximale aérobie (PMA) avec paliers de 1 min, 15 min retour au calme",
            indoorAlternative: "Identique sur home trainer, préférable pour des mesures précises",
            hiitFocus: "Établissement précis des zones d'intensité pour les futures séances"
          },
          {
            day: 3,
            title: "Introduction aux courts intervalles",
            type: "HIIT",
            duration: 45,
            description: "Première séance d'intervalles courts pour familiarisation",
            details: "15 min échauffement progressif, 10 × (15 sec effort à 120% FTP / 45 sec récupération active), 15 min retour au calme",
            indoorAlternative: "Idéal sur home trainer pour contrôle précis des intervalles",
            hiitFocus: "Adaptation neuromusculaire aux changements rapides d'intensité"
          },
          {
            day: 5,
            title: "Endurance fondamentale active",
            type: "Endurance",
            duration: 60,
            description: "Séance d'endurance avec micro-accélérations pour maintenir la réactivité",
            details: "10 min échauffement, 40 min Z2 (65-75% FTP) incluant 8 × (15 sec accélération dynamique, non maximale), 10 min retour au calme",
            indoorAlternative: "Session sur home trainer avec film de motivation",
            hiitFocus: "Récupération active permettant le maintien de la réactivité neuromusculaire"
          },
          {
            day: 7,
            title: "Intervalles moyens introductifs",
            type: "HIIT",
            duration: 50,
            description: "Introduction aux intervalles de durée moyenne",
            details: "15 min échauffement progressif, 5 × (1 min effort à 110-115% FTP / 2 min récupération active), 15 min retour au calme",
            indoorAlternative: "Idéal sur home trainer pour précision des efforts",
            hiitFocus: "Développement initial de la tolérance lactique et capacité anaérobie"
          }
        ],
        tips: "Cette première semaine permet d'introduire progressivement les efforts à haute intensité. Soyez particulièrement attentif à vos sensations et n'hésitez pas à réduire légèrement l'intensité si nécessaire."
      },
      // Semaine 2
      {
        weekNumber: 2,
        theme: "Progression et diversification",
        totalHours: 4,
        workouts: [
          {
            day: 1,
            title: "Récupération active",
            type: "Récupération",
            duration: 30,
            description: "Session légère pour récupérer des efforts intenses du weekend",
            details: "30 min très facile en Z1 (<65% FTP), cadence élevée (90-100rpm)",
            indoorAlternative: "Session similaire sur home trainer, très légère",
            hiitFocus: "Élimination des déchets métaboliques et régénération"
          },
          {
            day: 2,
            title: "HIIT Tabata adapté",
            type: "HIIT",
            duration: 45,
            description: "Adaptation cycliste du protocole Tabata scientifiquement validé",
            details: "15 min échauffement progressif, 8 × (20 sec effort maximal / 10 sec récupération), repos 4 min, puis seconde série identique, 15 min retour au calme",
            indoorAlternative: "Version idéale sur home trainer pour effort véritablement maximal",
            hiitFocus: "Développement puissant du système anaérobie et stimulus pour VO2max"
          },
          {
            day: 4,
            title: "Séance 30/30 introductive",
            type: "HIIT",
            duration: 50,
            description: "Introduction au format 30/30, excellent pour développer la PMA",
            details: "15 min échauffement, 10 × (30 sec à 110-120% FTP / 30 sec récup active), repos 5 min, puis 6 × (30 sec à 110-120% FTP / 30 sec récup active), 15 min retour au calme",
            indoorAlternative: "Idéal sur home trainer pour précision des efforts",
            hiitFocus: "Développement de la puissance maximale aérobie (PMA)"
          },
          {
            day: 6,
            title: "Endurance dynamique",
            type: "Endurance",
            duration: 75,
            description: "Sortie plus longue avec variations d'intensité légères",
            details: "10 min échauffement, 55 min en Z2 (65-75% FTP) incluant 4 × (3 min en Z3 (76-90% FTP)), 10 min retour au calme",
            indoorAlternative: "Séance divisible en deux parties si nécessaire",
            hiitFocus: "Maintien de l'endurance fondamentale avec stimuli variés"
          },
          {
            day: 7,
            title: "HIIT spécifique montée",
            type: "HIIT",
            duration: 60,
            description: "Intervalles spécifiques en montée pour développer la puissance",
            details: "15 min échauffement, trouver une montée de 2-3 min et réaliser 6 × (1 min effort intense en montée à 120% FTP / descente comme récupération), 15 min retour au calme",
            indoorAlternative: "Sur home trainer avec résistance élevée et éventuellement en position surélevée à l'avant",
            hiitFocus: "Développement de la puissance spécifique en montée et recrutement musculaire maximal"
          }
        ],
        tips: "Les sensations peuvent varier considérablement d'un jour à l'autre avec l'entraînement HIIT. Apprenez à distinguer la fatigue normale de l'épuisement."
      },
      // Semaines 3-8 simplifiées pour ce document
      {
        weekNumber: "3-5",
        theme: "Intensification et spécialisation",
        description: "Ces semaines augmentent la densité des intervalles et introduisent des formats plus exigeants. Chaque semaine alterne entre différents types de HIIT pour maximiser les adaptations physiologiques.",
        keyWorkouts: [
          "Séances 40/20 (40 sec effort intense / 20 sec récupération)",
          "Protocole 4×4 norvégien (4 min effort très soutenu / 4 min récupération)",
          "Séances pyramidales (30 sec / 1 min / 2 min / 1 min / 30 sec à intensité constante)",
          "Efforts supra-maximaux très courts (10 sec all-out / 50 sec récup)"
        ]
      },
      {
        weekNumber: "6-8",
        theme: "Optimisation et spécificité",
        description: "Phase finale avec individualisation poussée selon vos réponses aux différents types d'intervalles. Augmentation de la spécificité par rapport à vos objectifs cyclistes.",
        keyWorkouts: [
          "Séances composites combinant différents types d'intervalles",
          "HIIT spécifique au profil des événements ciblés",
          "Microcycles d'accumulation/récupération pour pic de forme",
          "Test final pour mesurer les progrès accomplis"
        ]
      }
    ],
    hiit_protocols: [
      {
        name: "Tabata",
        format: "8 × (20s effort all-out / 10s récupération)",
        benefits: "Développement maximal VO2max et capacité anaérobie",
        targetSystem: "Anaérobie alactique + aérobie",
        intensity: "140%+ FTP ou effort subjectif 10/10",
        frequency: "1-2 fois par semaine maximum"
      },
      {
        name: "30/30",
        format: "10-20 × (30s effort intense / 30s récupération active)",
        benefits: "Développement optimal de la PMA",
        targetSystem: "Aérobie puissance + tolérance lactique",
        intensity: "110-130% FTP ou effort subjectif 8-9/10",
        frequency: "1-2 fois par semaine"
      },
      {
        name: "4×4 norvégien",
        format: "4 × (4min effort soutenu / 4min récupération)",
        benefits: "Développement VO2max et endurance aérobie",
        targetSystem: "Aérobie puissance et capacité",
        intensity: "90-95% FCmax ou 100-110% FTP",
        frequency: "1-2 fois par semaine"
      },
      {
        name: "Microbursts",
        format: "10-20 × (15s effort très intense / 15-45s récupération)",
        benefits: "Développement neuromuscular et réactivité",
        targetSystem: "Anaérobie + recrutement neuromusculaire",
        intensity: "150%+ FTP ou effort subjectif 9-10/10",
        frequency: "1 fois par semaine"
      },
      {
        name: "Pyramide",
        format: "30s/1min/2min/3min/2min/1min/30s avec intensité constante",
        benefits: "Travail complet des différents systèmes énergétiques",
        targetSystem: "Mixte - tous les systèmes",
        intensity: "105-115% FTP ou effort subjectif 8/10",
        frequency: "1 fois par semaine"
      }
    ],
    recovery_optimization: {
      between_intervals: "Récupération active légère, jamais complètement à l'arrêt pour maintenir la circulation sanguine",
      between_sessions: "24-48h entre deux séances HIIT, possibilité d'endurance très légère entre deux",
      nutrition_timing: "Apport glucidique important dans les 30 min post-séance HIIT pour reconstituer le glycogène",
      sleep: "Priorité absolue avec 7-9h de sommeil de qualité, encore plus crucial avec le HIIT",
      active_recovery: "Sessions très légères (Z1) recommandées entre les séances HIIT intensives"
    },
    warning_signs: [
      "Baisse de performance sur plusieurs séances consécutives",
      "Fréquence cardiaque matinale au repos élevée (+5-10 bpm)",
      "Sensation de jambes lourdes persistante plus de 48h",
      "Troubles du sommeil inhabituels",
      "Irritabilité ou baisse de motivation"
    ],
    success_stories: [
      {
        name: "Julien R.",
        age: 35,
        background: "Cycliste avec peu de temps d'entraînement disponible",
        testimonial: "Avec seulement 4-5h d'entraînement par semaine grâce au HIIT, j'ai pu améliorer ma FTP de 15% en 8 semaines. Mes performances en course ont fait un bond alors que je m'entraîne deux fois moins longtemps qu'avant!"
      },
      {
        name: "Caroline T.",
        age: 28,
        background: "Triathlète cherchant à améliorer son segment cyclisme",
        testimonial: "Le programme HIIT a transformé mes performances sur vélo. Non seulement mes chronos se sont améliorés, mais ma capacité à supporter les changements de rythme en course est incomparable à avant."
      }
    ],
    common_mistakes: {
      intensity: "Ne pas pousser suffisamment fort pendant les intervalles - un vrai HIIT doit être très inconfortable",
      volume: "Faire trop de séances HIIT par semaine - 2-3 maximum est l'idéal pour la plupart des cyclistes",
      progression: "Augmenter trop rapidement le volume des intervalles au détriment de la qualité",
      recovery: "Négliger la récupération entre les séances HIIT, conduisant à un surentraînement",
      technique: "Perdre la technique de pédalage pendant les efforts maximaux"
    },
    equipment_recommendations: [
      {
        category: "Mesure et analyse",
        items: [
          {
            name: "Capteur de puissance",
            description: "Quasi-indispensable pour calibrer précisément les intensités HIIT"
          },
          {
            name: "Cardiofréquencemètre",
            description: "Essentiel pour surveiller l'effort et la récupération"
          },
          {
            name: "Application d'analyse d'entraînement",
            description: "Pour suivre objectivement vos progrès et adapter les séances"
          }
        ]
      },
      {
        category: "Confort et performance",
        items: [
          {
            name: "Ventilateur puissant (pour home trainer)",
            description: "Crucial pour dissiper la chaleur pendant les efforts intenses"
          },
          {
            name: "Vêtements techniques respirants",
            description: "Pour évacuer efficacement la transpiration abondante des séances HIIT"
          }
        ]
      },
      {
        category: "Récupération",
        items: [
          {
            name: "Rouleau de massage",
            description: "Pour favoriser la récupération musculaire entre les séances"
          },
          {
            name: "Boisson de récupération spécifique HIIT",
            description: "Formule optimisée pour reconstituer rapidement le glycogène"
          }
        ]
      }
    ],
    indoor_vs_outdoor: {
      indoor_benefits: "Contrôle précis des intervalles, absence de feux rouges/descentes, mesures plus précises",
      outdoor_benefits: "Plus engageant mentalement, développement des compétences techniques, variété des terrains",
      recommendation: "Combiner les deux approches si possible, avec préférence indoor pour les intervalles très courts et intenses"
    },
    scientific_background: "Ce programme s'appuie sur les recherches les plus récentes en physiologie de l'exercice qui démontrent l'efficacité supérieure de l'entraînement par intervalles à haute intensité pour développer rapidement les capacités cardiovasculaires et métaboliques. Des études ont montré qu'aussi peu que 3 séances HIIT par semaine de 20-30 minutes peuvent produire des adaptations similaires à des entraînements d'endurance traditionnels bien plus longs.",
    coach_contact: {
      name: "Xavier Moreau",
      speciality: "Spécialiste HIIT cyclisme et préparation physique",
      email: "xavier.moreau@dashboard-velo.com"
    }
  }
];

export { specialTrainingPrograms3 };
