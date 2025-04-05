/**
 * Séances d'entraînement spécifiques pour améliorer différentes capacités cyclistes
 * Ces séances sont organisées par type de capacité et peuvent être intégrées
 * dans les programmes d'entraînement personnalisés
 */

const trainingWorkouts = {
  power: [
    {
      id: "power-1",
      name: "Développement de la puissance maximale",
      type: "Anaérobie",
      focus: "Développer la puissance maximale sur des efforts courts",
      targetZone: "Zone 7 (>150% FTP)",
      duration: "60-75 minutes",
      requiredEquipment: ["Capteur de puissance recommandé", "Home trainer optionnel"],
      structure: {
        warmup: {
          duration: "15-20 minutes",
          description: "Échauffement progressif incluant 2-3 accélérations courtes"
        },
        mainSet: {
          intervals: "8-10 sprints de 10-15 secondes à puissance maximale",
          recovery: "4-5 minutes de récupération complète entre chaque sprint",
          cues: "Focus sur position, technique et accélération explosive"
        },
        cooldown: {
          duration: "10-15 minutes",
          description: "Retour au calme progressif en pédalage souple"
        }
      },
      adaptations: {
        beginner: "6 sprints de 10 secondes, récupération de 5 minutes",
        intermediate: "8 sprints de 12 secondes, récupération de 4-5 minutes",
        advanced: "10 sprints de 15 secondes, récupération de 4 minutes"
      },
      progressionVariants: [
        "Augmenter le nombre de sprints (jusqu'à 12)",
        "Réduire légèrement le temps de récupération (pas moins de 3 minutes)",
        "Ajouter une légère pente (3-5%) pour augmenter la résistance"
      ],
      physiologicalBenefits: [
        "Amélioration du recrutement des fibres musculaires rapides",
        "Augmentation de la puissance maximale sur 5-15 secondes",
        "Développement de la coordination neuromusculaire",
        "Amélioration de l'économie d'effort en sprint"
      ],
      tips: "Réalisez cette séance reposé. Privilégiez une cadence légèrement plus basse (80-90 rpm) pour maximiser la puissance. Maintenez une position optimale et stable sur le vélo.",
      recommendedFrequency: "1 fois par semaine maximum",
      recovery: "Prévoir 48h minimum avant tout autre entraînement intensif"
    },
    {
      id: "power-2",
      name: "Capacité anaérobie mixte",
      type: "Anaérobie",
      focus: "Développer la puissance sur des efforts de 30s à 2min",
      targetZone: "Zone 6 (121-150% FTP)",
      duration: "60-90 minutes",
      requiredEquipment: ["Capteur de puissance recommandé", "Home trainer ou parcours avec côtes courtes"],
      structure: {
        warmup: {
          duration: "15-20 minutes",
          description: "Échauffement progressif incluant 3 accélérations de 20 secondes"
        },
        mainSet: {
          intervals: "2-3 séries de 4x30s à 130-150% FTP",
          recovery: "30s entre répétitions, 5min entre séries",
          cues: "Rester assis pour les premières répétitions, en danseuse pour les dernières"
        },
        cooldown: {
          duration: "15 minutes",
          description: "Retour au calme progressif"
        }
      },
      adaptations: {
        beginner: "2 séries de 3 répétitions, intensité 130% FTP",
        intermediate: "2 séries de 4 répétitions, intensité 140% FTP",
        advanced: "3 séries de 4 répétitions, intensité 150% FTP"
      },
      progressionVariants: [
        "Format pyramidal: 15s/30s/45s/30s/15s à intensité maximale soutenable",
        "Format 30/30: 8-12 répétitions de 30s d'effort, 30s de récupération",
        "Augmenter progressivement la durée des répétitions jusqu'à 1 minute"
      ],
      physiologicalBenefits: [
        "Amélioration de la capacité anaérobie",
        "Développement de la tolérance au lactate",
        "Augmentation de la capacité à répéter des efforts intenses",
        "Préparation aux attaques et changements de rythme en course"
      ],
      tips: "Concentrez-vous sur le maintien de la puissance tout au long de la séance. Les dernières répétitions doivent être aussi intenses que les premières. Trouvez un bon équilibre entre position assise et en danseuse.",
      recommendedFrequency: "1-2 fois par semaine",
      recovery: "24-36h avant un autre entraînement intensif"
    },
    {
      id: "power-3",
      name: "Force-vitesse en côte",
      type: "Force-puissance",
      focus: "Développer la force spécifique en côte",
      targetZone: "Zone 5-6 (106-130% FTP)",
      duration: "75-90 minutes",
      requiredEquipment: ["Parcours avec côte de 5-8% sur 1-2km", "Capteur de puissance recommandé"],
      structure: {
        warmup: {
          duration: "20 minutes",
          description: "Échauffement progressif incluant la reconnaissance de la côte à faible intensité"
        },
        mainSet: {
          intervals: "5-8 répétitions de 2-3 minutes en côte à basse cadence (50-60 rpm)",
          recovery: "Descente en récupération active",
          cues: "Rester assis, focus sur la poussée et la traction complètes du pédalage"
        },
        cooldown: {
          duration: "15-20 minutes",
          description: "Retour au calme sur terrain plat"
        }
      },
      adaptations: {
        beginner: "5 répétitions de 2 minutes, cadence 60 rpm",
        intermediate: "6 répétitions de 2.5 minutes, cadence 55 rpm",
        advanced: "8 répétitions de 3 minutes, cadence 50 rpm"
      },
      progressionVariants: [
        "Enchaîner 2 côtes différentes sans récupération entre elles",
        "Alterner entre répétitions en force (basse cadence) et vitesse (haute cadence)",
        "Terminer chaque répétition par 15 secondes d'accélération maximale"
      ],
      physiologicalBenefits: [
        "Renforcement musculaire spécifique au cyclisme",
        "Amélioration du couple de pédalage",
        "Développement des capacités de grimpe",
        "Économie d'effort améliorée en montée"
      ],
      tips: "Choisissez un développement qui vous permet de maintenir la puissance cible à basse cadence sans vous mettre 'dans le rouge'. Concentrez-vous sur une technique de pédalage fluide malgré la faible cadence.",
      recommendedFrequency: "1 fois par semaine",
      recovery: "36-48h avant un autre entraînement en force"
    }
  ],
  
  endurance: [
    {
      id: "endurance-1",
      name: "Endurance fondamentale progressive",
      type: "Endurance aérobie",
      focus: "Développer les bases aérobies et l'efficacité",
      targetZone: "Zone 2 (56-75% FTP)",
      duration: "2.5-5 heures",
      requiredEquipment: ["Parcours plat à vallonné", "Ravitaillement"],
      structure: {
        warmup: {
          duration: "15-20 minutes",
          description: "Mise en route progressive"
        },
        mainSet: {
          intervals: "Corps principal de 2-4.5 heures en zone endurance (65-75% FTP)",
          pattern: "Pédalage à cadence variable: 20min à cadence normale (85-95 rpm), 10min à cadence élevée (100-110 rpm)",
          cues: "Focus sur la position, la respiration et l'hydratation régulière"
        },
        cooldown: {
          duration: "15-20 minutes",
          description: "Retour progressif à faible intensité"
        }
      },
      adaptations: {
        beginner: "2.5 heures au total, alternance 15min/5min",
        intermediate: "3.5 heures au total, alternance 20min/10min",
        advanced: "5 heures au total, alternance 20min/10min avec sections en milieu de terrain vallonné"
      },
      progressionVariants: [
        "Ajouter 1-2 segments de 15-20min en Sweet Spot (88-93% FTP) en milieu de sortie",
        "Introduire des variations de terrain plus importantes tout en maintenant l'intensité cible",
        "Augmenter progressivement la durée totale (10-15% par semaine)"
      ],
      physiologicalBenefits: [
        "Amélioration du système cardiovasculaire",
        "Augmentation de la densité capillaire",
        "Développement du métabolisme des graisses",
        "Amélioration de l'efficacité du pédalage"
      ],
      nutritionStrategy: {
        beforeRide: "Repas complet 2-3h avant avec glucides complexes",
        duringRide: "30-60g de glucides par heure, hydratation régulière",
        afterRide: "Récupération avec ratio glucides/protéines 3:1 dans les 30min"
      },
      tips: "Maintenir une intensité constante malgré le terrain. Ne jamais aller au-delà de la zone cible, même dans les côtes (utiliser les vitesses). L'objectif est le volume, pas l'intensité.",
      recommendedFrequency: "1-2 fois par semaine",
      recovery: "Pas de récupération particulière nécessaire avant un entraînement léger le lendemain"
    },
    {
      id: "endurance-2",
      name: "Sweet Spot prolongé",
      type: "Endurance intensive",
      focus: "Développer l'endurance à intensité modérée à élevée",
      targetZone: "Sweet Spot (88-93% FTP)",
      duration: "1.5-2.5 heures",
      requiredEquipment: ["Capteur de puissance recommandé", "Home trainer ou parcours avec sections plates"],
      structure: {
        warmup: {
          duration: "15-20 minutes",
          description: "Échauffement progressif incluant 2-3 accélérations courtes"
        },
        mainSet: {
          intervals: "2-3 intervalles de 20-30 minutes en Sweet Spot (88-93% FTP)",
          recovery: "10 minutes de récupération active entre les intervalles",
          cues: "Maintenir une position stable et une cadence régulière (85-95 rpm)"
        },
        cooldown: {
          duration: "15 minutes",
          description: "Retour au calme progressif"
        }
      },
      adaptations: {
        beginner: "2 x 20 minutes, récupération de 10 minutes",
        intermediate: "2 x 30 minutes, récupération de 10 minutes",
        advanced: "3 x 30 minutes, récupération de 8 minutes"
      },
      progressionVariants: [
        "Augmenter la durée des intervalles (jusqu'à 40 minutes)",
        "Réduire légèrement le temps de récupération (minimum 5 minutes)",
        "Enchaîner avec une sortie longue le lendemain (bloc d'endurance)"
      ],
      physiologicalBenefits: [
        "Amélioration de l'endurance au seuil",
        "Augmentation de la capacité à maintenir une intensité élevée",
        "Développement de l'économie à des intensités proches du seuil",
        "Préparation pour les efforts prolongés en compétition"
      ],
      tips: "Commencez légèrement en dessous de la zone cible et augmentez progressivement pendant l'intervalle. Évitez les variations brutales de puissance. Restez discipliné dans le maintien de la zone d'intensité.",
      recommendedFrequency: "1-2 fois par semaine",
      recovery: "24h minimum avant un autre entraînement intensif"
    },
    {
      id: "endurance-3",
      name: "Endurance tempo avec variations",
      type: "Endurance tempo",
      focus: "Développer l'endurance à intensité modulée",
      targetZone: "Principalement Zone 3 (76-90% FTP) avec variations",
      duration: "2-3 heures",
      requiredEquipment: ["Parcours vallonné idéalement", "Capteur de puissance ou cardiofréquencemètre"],
      structure: {
        warmup: {
          duration: "20 minutes",
          description: "Échauffement progressif"
        },
        mainSet: {
          pattern: "3 blocs de 30-40 minutes structurés ainsi: 25-35min en tempo (76-85% FTP) + 5min en seuil (95-100% FTP)",
          recovery: "10-15 minutes de récupération active entre les blocs",
          cues: "Transition fluide entre les intensités, adaptation au terrain"
        },
        cooldown: {
          duration: "15-20 minutes",
          description: "Retour au calme progressif"
        }
      },
      adaptations: {
        beginner: "2 blocs de 30 minutes (25min tempo + 5min seuil)",
        intermediate: "3 blocs de 35 minutes (30min tempo + 5min seuil)",
        advanced: "3 blocs de 40 minutes (35min tempo + 5min seuil)"
      },
      progressionVariants: [
        "Format pyramidal: tempo → seuil → sweet spot → seuil → tempo",
        "Profiter du terrain naturel: tempo en plat, seuil en montée",
        "Ajouter des micro-accélérations (15s) pendant les sections tempo"
      ],
      physiologicalBenefits: [
        "Développement de l'endurance aérobie avancée",
        "Amélioration de la capacité à changer de rythme",
        "Préparation aux variations d'intensité en course",
        "Économie d'effort à intensité modérée"
      ],
      nutritionStrategy: {
        beforeRide: "Repas léger 2h avant avec glucides complexes",
        duringRide: "60g de glucides par heure, hydratation avec électrolytes",
        afterRide: "Récupération avec ratio glucides/protéines 3:1 dans les 30min"
      },
      tips: "Utilisez le terrain à votre avantage. Cette séance peut être réalisée sur un parcours vallonné naturel, en utilisant les montées pour les sections à intensité plus élevée.",
      recommendedFrequency: "1 fois par semaine",
      recovery: "24-36h avant un autre entraînement intensif"
    }
  ],
  
  recovery: [
    {
      id: "recovery-1",
      name: "Récupération active structurée",
      type: "Récupération",
      focus: "Favoriser la récupération musculaire et mentale",
      targetZone: "Zone 1 (<55% FTP)",
      duration: "30-60 minutes",
      requiredEquipment: ["Parcours plat", "Home trainer optionnel"],
      structure: {
        entireWorkout: {
          description: "Maintenir une intensité très légère (50-55% FTP maximum) tout au long de la séance",
          pattern: "Alterner 5 minutes à cadence normale (80-90 rpm) et 5 minutes à cadence élevée (100-110 rpm)",
          cues: "Position détendue, respiration profonde et régulière"
        }
      },
      adaptations: {
        beginner: "30 minutes",
        intermediate: "45 minutes",
        advanced: "60 minutes"
      },
      physiologicalBenefits: [
        "Élimination des déchets métaboliques",
        "Réduction de la tension musculaire",
        "Maintien du flux sanguin vers les muscles",
        "Récupération du système nerveux"
      ],
      tips: "Cette séance doit être réellement facile - vous devez pouvoir parler sans difficulté à tout moment. Évitez absolument toute intensité, même dans les légères montées. Hydratez-vous bien pendant et après la séance.",
      recommendedFrequency: "1-2 fois par semaine, après des séances intenses ou entre deux blocs d'entraînement",
      complementaryPractices: [
        "Étirements légers post-séance",
        "Hydratation optimisée avec électrolytes",
        "Alimentation riche en antioxydants",
        "Techniques de relaxation (respiration, méditation)"
      ]
    },
    {
      id: "recovery-2",
      name: "Jour de récupération alternatif",
      type: "Récupération cross-training",
      focus: "Favoriser la récupération tout en maintenant une activité légère",
      targetZone: "Très faible intensité",
      duration: "30-45 minutes",
      requiredEquipment: ["Tapis de yoga ou surface souple", "Rouleau de massage optionnel"],
      structure: {
        warmup: {
          duration: "5 minutes",
          description: "Mobilisation articulaire douce"
        },
        mainSet: {
          activities: [
            "10 minutes de marche ou natation très légère",
            "10 minutes d'étirements dynamiques pour cyclistes",
            "10 minutes de yoga spécifique pour cyclistes",
            "5 minutes d'auto-massage avec rouleau"
          ]
        },
        cooldown: {
          duration: "5 minutes",
          description: "Exercices de respiration et relaxation"
        }
      },
      adaptations: {
        all: "Adapter la durée de chaque partie selon les besoins individuels"
      },
      physiologicalBenefits: [
        "Récupération active sans impact supplémentaire sur les groupes musculaires sollicités en cyclisme",
        "Amélioration de la mobilité et de la souplesse",
        "Réduction des tensions musculaires chroniques",
        "Récupération mentale et diminution du stress"
      ],
      tips: "Cette séance est parfaite pour remplacer une journée complète de repos ou comme activité de récupération après une période intense d'entraînement. Concentrez-vous sur la qualité des mouvements plutôt que sur l'intensité.",
      recommendedFrequency: "1-2 fois par semaine",
      complementaryPractices: [
        "Bain chaud ou sauna (15 minutes maximum)",
        "Compression (chaussettes, manchons) post-exercice",
        "Hydratation optimale toute la journée",
        "Alimentation centrée sur la récupération"
      ]
    }
  ],
  
  vo2max: [
    {
      id: "vo2max-1",
      name: "Intervalles courts à haute intensité",
      type: "VO2max",
      focus: "Développer la puissance aérobie maximale",
      targetZone: "Zone 5 (106-120% FTP)",
      duration: "75-90 minutes",
      requiredEquipment: ["Capteur de puissance recommandé", "Home trainer ou parcours avec section plate/légère montée"],
      structure: {
        warmup: {
          duration: "15-20 minutes",
          description: "Échauffement progressif incluant 3 accélérations de 30 secondes"
        },
        mainSet: {
          intervals: "5-6 séries de 5 répétitions de 30s à 120% FTP",
          recovery: "30s entre répétitions, 5min entre séries",
          cues: "Cadence élevée (100-110 rpm), position stable"
        },
        cooldown: {
          duration: "15 minutes",
          description: "Retour au calme progressif"
        }
      },
      adaptations: {
        beginner: "4 séries de 4 répétitions",
        intermediate: "5 séries de 5 répétitions",
        advanced: "6 séries de 5 répétitions"
      },
      progressionVariants: [
        "Augmenter progressivement la durée des répétitions (jusqu'à 40s)",
        "Réduire légèrement la récupération entre répétitions (minimum 15s)",
        "Format 30/15: 30s d'effort, 15s de récupération"
      ],
      physiologicalBenefits: [
        "Augmentation de la consommation maximale d'oxygène (VO2max)",
        "Amélioration de la capacité à répéter des efforts intenses",
        "Développement du système cardiovasculaire",
        "Adaptation des fibres musculaires rapides au travail aérobie"
      ],
      tips: "Maintenez l'intensité du début à la fin de chaque répétition. Les premières peuvent sembler faciles, ne surestimez pas votre capacité. Si vous ne pouvez pas maintenir l'intensité cible, terminez la série en cours puis arrêtez la séance.",
      recommendedFrequency: "1-2 fois par semaine maximum",
      recovery: "36-48h avant un autre entraînement intensif"
    },
    {
      id: "vo2max-2",
      name: "Intervalles pyramidaux VO2max",
      type: "VO2max",
      focus: "Développer la puissance aérobie à différentes durées",
      targetZone: "Zone 5 (106-120% FTP), ajustée selon durée",
      duration: "75-90 minutes",
      requiredEquipment: ["Capteur de puissance recommandé", "Home trainer ou parcours varié"],
      structure: {
        warmup: {
          duration: "15-20 minutes",
          description: "Échauffement progressif incluant 2-3 accélérations"
        },
        mainSet: {
          intervals: "Structure pyramidale: 1min, 2min, 3min, 4min, 3min, 2min, 1min à intensité VO2max",
          intensity: "1min: 120% FTP, 2min: 115% FTP, 3min: 110% FTP, 4min: 105% FTP",
          recovery: "Récupération égale à la durée de l'effort précédent",
          cues: "Cadence élevée (95-105 rpm), concentration sur la respiration"
        },
        cooldown: {
          duration: "15 minutes",
          description: "Retour au calme progressif"
        }
      },
      adaptations: {
        beginner: "Demi-pyramide: 1min, 2min, 3min, 2min, 1min",
        intermediate: "Pyramide complète mais intensités réduites de 5%",
        advanced: "Pyramide complète aux intensités indiquées"
      },
      progressionVariants: [
        "Doubler la pyramide avec récupération plus longue entre les deux",
        "Augmenter l'intensité de chaque palier de 3-5%",
        "Réduire progressivement les temps de récupération"
      ],
      physiologicalBenefits: [
        "Développement complet du système VO2max",
        "Amélioration de la capacité à soutenir des efforts de différentes durées",
        "Adaptation à la variabilité d'intensité typique en course",
        "Renforcement mental face à différents types d'effort"
      ],
      tips: "Ajustez l'intensité précisément selon la durée de l'intervalle. Ne partez pas trop fort sur les intervalles longs. La récupération doit être active mais très légère (40-50% FTP).",
      recommendedFrequency: "1 fois par semaine",
      recovery: "48h minimum avant un autre entraînement intensif"
    }
  ],
  
  threshold: [
    {
      id: "threshold-1",
      name: "Développement du seuil",
      type: "Seuil",
      focus: "Augmenter la puissance au seuil lactique",
      targetZone: "Zone 4 (91-105% FTP)",
      duration: "75-90 minutes",
      requiredEquipment: ["Capteur de puissance recommandé", "Home trainer ou parcours plat/régulier"],
      structure: {
        warmup: {
          duration: "15-20 minutes",
          description: "Échauffement progressif incluant 2 accélérations de 1 minute"
        },
        mainSet: {
          intervals: "2-3 intervalles de 15-20 minutes à 95-100% FTP",
          recovery: "5-10 minutes de récupération active entre les intervalles",
          cues: "Cadence modérée à élevée (85-95 rpm), position aérodynamique"
        },
        cooldown: {
          duration: "10-15 minutes",
          description: "Retour au calme progressif"
        }
      },
      adaptations: {
        beginner: "2 x 15 minutes à 95% FTP",
        intermediate: "2 x 20 minutes à 95-98% FTP",
        advanced: "3 x 20 minutes à 98-100% FTP"
      },
      progressionVariants: [
        "Format 2 x 30 minutes avec récupération de 10 minutes",
        "Intervalles progressifs (90% → 95% → 100% FTP) au sein de chaque bloc",
        "Alternance de cadence haute et basse pendant les intervalles"
      ],
      physiologicalBenefits: [
        "Augmentation de la puissance au seuil lactique",
        "Amélioration de la capacité à éliminer le lactate",
        "Développement de l'endurance spécifique à haute intensité",
        "Adaptation mentale aux efforts prolongés inconfortables"
      ],
      tips: "Visez une intensité que vous pourriez théoriquement maintenir pendant 60 minutes (bien que cette séance soit plus courte). Maintenez une puissance constante plutôt que de partir trop fort et de décliner. Surveillez votre technique de pédalage à mesure que la fatigue s'installe.",
      recommendedFrequency: "1-2 fois par semaine",
      recovery: "36-48h avant un autre entraînement intensif"
    },
    {
      id: "threshold-2",
      name: "Intervalles au seuil sur-unders",
      type: "Seuil",
      focus: "Développer la capacité à récupérer à haute intensité",
      targetZone: "Zone 4-5 (90-110% FTP)",
      duration: "80-100 minutes",
      requiredEquipment: ["Capteur de puissance nécessaire", "Home trainer ou parcours vallonné"],
      structure: {
        warmup: {
          duration: "15-20 minutes",
          description: "Échauffement progressif incluant 3 accélérations progressives"
        },
        mainSet: {
          intervals: "3 blocs de 12 minutes avec alternance 2min à 90% FTP ('under') et 1min à 110% FTP ('over')",
          recovery: "6 minutes de récupération active entre les blocs",
          cues: "Transitions fluides entre les intensités, maintien de la position"
        },
        cooldown: {
          duration: "15 minutes",
          description: "Retour au calme progressif"
        }
      },
      adaptations: {
        beginner: "2 blocs de 9 minutes (alternance 2min/1min)",
        intermediate: "3 blocs de 12 minutes (alternance 2min/1min)",
        advanced: "3 blocs de 15 minutes (alternance 2min/1min)"
      },
      progressionVariants: [
        "Modifier le ratio under/over (ex: 1min/1min)",
        "Augmenter l'intensité des phases 'over' (jusqu'à 115% FTP)",
        "Réduire la récupération entre les blocs (minimum 3 minutes)"
      ],
      physiologicalBenefits: [
        "Amélioration de la capacité à récupérer à haute intensité",
        "Développement de la résistance à la fatigue",
        "Préparation aux variations d'intensité en course",
        "Affinage de la perception d'effort"
      ],
      tips: "Ce format est particulièrement efficace pour simuler les conditions de course. Concentrez-vous sur les transitions fluides entre les intensités. Ne sous-estimez pas la difficulté progressive de cette séance - le dernier bloc sera significativement plus difficile que le premier.",
      recommendedFrequency: "1 fois par semaine",
      recovery: "36-48h avant un autre entraînement intensif"
    }
  ]
};

export default trainingWorkouts;
