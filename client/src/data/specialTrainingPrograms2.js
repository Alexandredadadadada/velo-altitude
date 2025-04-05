/**
 * Programmes d'entraînement spéciaux (2/3) pour Dashboard-Velo.com
 * - Programme perte de poids 
 */

const specialTrainingPrograms2 = [
  // Programme #2 - Perte de Poids
  {
    id: "weight-loss-program",
    title: "Programme Cyclisme Perte de Poids",
    titleEn: "Cycling Weight Loss Program",
    titleDe: "Radsport-Gewichtsverlust-Programm",
    level: "Débutant à Intermédiaire",
    duration: 12, // Semaines
    description: "Programme spécialisé combinant cyclisme et nutrition pour optimiser la perte de poids saine et durable. Conçu pour maximiser la dépense calorique tout en préservant la masse musculaire et en développant les capacités cyclistes.",
    goalDescription: "Perdre du poids de façon progressive et durable par le cyclisme, tout en développant une meilleure condition physique, des habitudes alimentaires équilibrées et un rapport sain à l'exercice.",
    targetAudience: "Cyclistes débutants à intermédiaires souhaitant perdre du poids de manière saine, personnes en surpoids découvrant le cyclisme, sportifs cherchant à optimiser leur composition corporelle",
    prerequisites: {
      fitnessLevel: "Capacité à rouler au moins 30 minutes sans s'arrêter",
      experience: "Aucune expérience requise, adapté aux débutants",
      equipment: ["Vélo (route, VTC, VTT ou home trainer)", "Cardiofréquencemètre fortement recommandé", "Balance (idéalement à impédancemétrie)"]
    },
    key_stats: {
      weeklyHours: { min: 4, max: 8 },
      totalDistance: { min: 600, max: 1500 }, // km
      caloriesBurned: { min: 4000, max: 8000 }, // par semaine
      intensitySplit: {
        fatBurning: 65, // % du temps total (Z2 principalement)
        threshold: 20, // % du temps total
        hiit: 10, // % du temps total
        recovery: 5 // % du temps total
      }
    },
    specificFeatures: [
      {
        name: "Zones de fréquence cardiaque optimales",
        description: "Entraînement ciblé dans les zones maximisant l'utilisation des graisses comme substrat énergétique"
      },
      {
        name: "Combinaison cardio-métabolique",
        description: "Alternance stratégique d'efforts longs et d'intervalles courts pour optimiser la dépense calorique"
      },
      {
        name: "Progression graduelle du volume",
        description: "Augmentation progressive du volume d'entraînement adaptée à la perte de poids et à l'amélioration de la condition physique"
      },
      {
        name: "Intégration nutrition-entraînement",
        description: "Recommandations nutritionnelles spécifiques avant, pendant et après chaque type de séance"
      }
    ],
    weekByWeekPlan: [
      // Semaine 1
      {
        weekNumber: 1,
        theme: "Évaluation et mise en place des habitudes",
        totalHours: 4,
        workouts: [
          {
            day: 1,
            title: "Évaluation initiale et familiarisation",
            type: "Test",
            duration: 45, // minutes
            description: "Évaluation de votre niveau actuel et prise de repères pour suivre vos progrès",
            details: "10 min échauffement, test de 20 min à allure constante confortable, mesure de distance et FC moyenne, 10 min retour au calme",
            indoorAlternative: "Test similaire sur home trainer avec mesure de puissance si disponible",
            nutritionTip: "Repas léger 2h avant la séance, hydratation uniquement pendant (eau)"
          },
          {
            day: 3,
            title: "Zone de combustion des graisses",
            type: "Endurance fondamentale",
            duration: 60,
            description: "Séance centrée sur la zone optimale d'utilisation des graisses",
            details: "10 min échauffement progressif, 40 min en Z2 (65-75% FCmax ou 'conversation possible'), 10 min retour au calme",
            indoorAlternative: "Identique sur home trainer, éventuellement avec film/série pour maintenir la motivation",
            nutritionTip: "Possibilité de réaliser cette séance à jeun le matin (consulter un professionnel)"
          },
          {
            day: 5,
            title: "Initiation aux intervalles courts",
            type: "Intervalles",
            duration: 45,
            description: "Introduction aux efforts courts pour stimuler le métabolisme",
            details: "10 min échauffement, 5 x (1 min allure dynamique Z3, 3 min récupération active), 10 min retour au calme",
            indoorAlternative: "Idéal sur home trainer pour contrôler précisément les intervalles",
            nutritionTip: "Repas normal 2-3h avant, hydratation avec eau légèrement sucrée pendant l'effort"
          },
          {
            day: 7,
            title: "Sortie longue découverte",
            type: "Endurance",
            duration: 90,
            description: "Première sortie plus longue à intensité modérée",
            details: "Maintenir une allure confortable (Z2, 65-75% FCmax) sur terrain plat à vallonné",
            indoorAlternative: "Diviser en deux sessions de 45 min si nécessaire sur home trainer",
            nutritionTip: "Petit en-cas glucidique au milieu de la sortie, hydratation régulière (150-200ml toutes les 15min)"
          }
        ],
        tips: "Cette première semaine établit vos bases. Concentrez-vous sur la régularité des séances plutôt que sur l'intensité. Commencez à tenir un journal alimentaire simple pour prendre conscience de vos habitudes actuelles."
      },
      // Semaine 2
      {
        weekNumber: 2,
        theme: "Construction des fondations métaboliques",
        totalHours: 4.5,
        workouts: [
          {
            day: 1,
            title: "Récupération active",
            type: "Récupération",
            duration: 30,
            description: "Session légère pour récupérer tout en maintenant l'activation métabolique",
            details: "30 min très facile en Z1 (<65% FCmax), cadence légèrement plus élevée que d'habitude",
            indoorAlternative: "Session équivalente sur home trainer, très légère",
            nutritionTip: "Journée idéale pour réduire légèrement les calories tout en maintenant l'apport protéique"
          },
          {
            day: 3,
            title: "Zone de brûlage des graisses progressive",
            type: "Endurance",
            duration: 70,
            description: "Extension de la durée en zone optimale de combustion des graisses",
            details: "10 min échauffement, 50 min en Z2 (65-75% FCmax), 10 min retour au calme",
            indoorAlternative: "Session similaire sur home trainer avec variations légères de résistance",
            nutritionTip: "Hydrates de carbone à index glycémique bas 2h avant, hydratation aux électrolytes pendant"
          },
          {
            day: 5,
            title: "Intervalles métaboliques",
            type: "Intervalles",
            duration: 50,
            description: "Séance structurée pour maximiser l'impact métabolique post-exercice",
            details: "10 min échauffement, 6 x (1 min allure dynamique Z3, 3 min récupération active), 10 min retour au calme",
            indoorAlternative: "Idéal sur home trainer pour précision des intervalles",
            nutritionTip: "Protéines de qualité dans les 30 min après la séance pour optimiser la récupération"
          },
          {
            day: 7,
            title: "Endurance progressive",
            type: "Endurance",
            duration: 120,
            description: "Sortie plus longue avec variations légères d'intensité",
            details: "10 min échauffement, puis alternance toutes les 10 min entre Z1 et Z2, terminant par 10 min de retour au calme",
            indoorAlternative: "Deux sessions de 60 min dans la journée si nécessaire",
            nutritionTip: "Prévoir 40-50g de glucides par heure d'effort, privilégier aliments réels plutôt que gels"
          }
        ],
        tips: "Commencez à observer comment votre corps réagit aux différentes intensités. À faible intensité (Z1-Z2), votre corps utilise principalement les graisses comme carburant - idéal pour votre objectif."
      },
      // Semaines 3-12 simplifiées pour ce document
      {
        weekNumber: "3-6",
        theme: "Développement du volume et variation des intensités",
        description: "Ces semaines augmentent progressivement le volume d'entraînement et introduisent davantage de variations d'intensité. Objectif de perte de poids de 0,5-1kg par semaine.",
        keyWorkouts: [
          "Séances longues en Z2 augmentant jusqu'à 2h30",
          "Introduction d'intervalles pyramidaux (30s/1min/2min/1min/30s)",
          "Session hebdomadaire combinant vélo et renforcement musculaire",
          "Intégration de séances en côtes légères"
        ]
      },
      {
        weekNumber: "7-9",
        theme: "Intensification métabolique",
        description: "Phase d'intensification ciblée pour accélérer les adaptations métaboliques tout en maintenant la perte de poids progressive.",
        keyWorkouts: [
          "Intervalles plus longs en Z3 (3-5 min)",
          "Introduction de séances spécifiques 'après-combustion'",
          "Sorties longues avec sections à intensité variable",
          "Séance hebdomadaire de vélocité pure (cadence élevée)"
        ]
      },
      {
        weekNumber: "10-12",
        theme: "Consolidation et transition",
        description: "Phase finale visant à stabiliser le poids perdu et préparer la transition vers un programme de maintien ou de performance.",
        keyWorkouts: [
          "Séance de simulation d'événement à intensité contrôlée",
          "Combinaisons vélo-renforcement plus avancées",
          "Test final pour mesurer les progrès accomplis",
          "Introduction aux séances de type 'sweet spot' (entre seuil et tempo)"
        ]
      }
    ],
    nutrition_plan: {
      general_principles: [
        "Déficit calorique modéré (300-500 kcal/jour) pour une perte de poids saine et durable",
        "Apport protéique élevé (1.6-2g/kg de poids) pour préserver la masse musculaire",
        "Hydratation optimale (minimum 2L/jour + compensation des pertes pendant l'effort)",
        "Timing nutritionnel synchronisé avec les séances d'entraînement"
      ],
      meal_distribution: {
        trainingDays: "3-4 repas équilibrés avec collation pré-entraînement et récupération post-entraînement",
        restDays: "3 repas principaux légèrement réduits en glucides mais maintenus en protéines"
      },
      pre_workout: {
        highIntensity: "Petite collation digeste 1-2h avant (15-30g glucides + protéines)",
        lowIntensity: "Possibilité de s'entraîner à jeun (selon tolérance individuelle)"
      },
      during_workout: {
        under60min: "Eau uniquement, sauf chaleur intense",
        over60min: "20-40g glucides/heure, hydratation aux électrolytes"
      },
      post_workout: {
        immediate: "15-25g protéines + 30-50g glucides dans les 30 minutes",
        meal: "Repas complet équilibré dans les 2 heures suivantes"
      },
      sample_day_plan: {
        breakfast: "Omelette aux légumes + flocons d'avoine + fruits rouges",
        lunch: "Salade complète protéinée (quinoa, poulet, légumes, avocat)",
        pre_workout: "Yaourt grec + banane (si haute intensité)",
        post_workout: "Smoothie récupération (lait végétal, protéine, fruits, flocons)",
        dinner: "Poisson/viande maigre + légumes variés + féculent en quantité adaptée",
        hydration: "Eau tout au long de la journée, thé/café sans sucre"
      }
    },
    progress_tracking: {
      weekly: [
        "Pesée hebdomadaire (même jour, même heure, à jeun)",
        "Mesures de circonférence (taille, hanches, cuisses)",
        "Photo de référence mensuelle",
        "Test de performance cycliste toutes les 4 semaines"
      ],
      metrics_beyond_weight: [
        "Sensation de bien-être général",
        "Qualité du sommeil",
        "Niveau d'énergie quotidien",
        "Performance cycliste (distance, vitesse, puissance)",
        "Composition corporelle (si possible)"
      ],
      plateaus_management: {
        strategy1: "Augmentation temporaire du volume d'entraînement",
        strategy2: "Introduction de nouvelles variantes d'intervalles",
        strategy3: "Réévaluation et ajustement précis de l'apport nutritionnel",
        strategy4: "Semaine de récupération pour réinitialiser le métabolisme"
      }
    },
    success_stories: [
      {
        name: "Thomas L.",
        age: 42,
        weightLoss: "18kg en 6 mois",
        testimonial: "Ce programme a transformé ma relation avec le vélo et l'alimentation. J'ai perdu progressivement du poids tout en devenant un bien meilleur cycliste. Le plus surprenant est à quel point je me sens énergique au quotidien."
      },
      {
        name: "Sandrine M.",
        age: 38,
        weightLoss: "12kg en 4 mois",
        testimonial: "Après plusieurs régimes yo-yo, j'ai enfin trouvé un équilibre. Le cyclisme est devenu ma passion et les kilos sont partis naturellement. J'apprécie particulièrement l'approche équilibrée de la nutrition qui n'interdit aucun aliment."
      }
    ],
    common_challenges: {
      plateaus: "Alternez les types d'entraînement et réévaluez votre alimentation sans diminuer drastiquement les calories",
      fatigue: "Assurez-vous de maintenir un apport calorique suffisant malgré le déficit (minimum 1500 kcal/j pour femmes, 1800 kcal/j pour hommes)",
      hunger: "Augmentez la consommation d'aliments à haute densité nutritionnelle et faible densité calorique (légumes, protéines maigres)",
      social: "Apprenez des stratégies pour gérer les occasions sociales sans compromettre vos objectifs"
    },
    afterProgram: {
      maintenance: "Transition vers un programme de maintien avec ajustement calorique progressif",
      further_goals: "Options pour orienter votre entraînement vers la performance, l'endurance ou d'autres aspects du cyclisme",
      lifestyle: "Intégration des nouvelles habitudes dans un mode de vie durable à long terme"
    },
    scientific_background: "Ce programme est basé sur les dernières recherches en physiologie de l'exercice et nutrition sportive. Il intègre les principes de la périodisation de l'entraînement, de l'oxydation préférentielle des substrats selon l'intensité, et des adaptations métaboliques à l'exercice régulier. L'approche nutritionnelle est fondée sur une alimentation équilibrée sans restriction extrême, pour assurer durabilité et santé à long terme.",
    coach_contact: {
      name: "Marc Dupont",
      speciality: "Spécialiste perte de poids par le cyclisme et nutrition sportive",
      email: "marc.dupont@dashboard-velo.com"
    }
  }
];

export { specialTrainingPrograms2 };
