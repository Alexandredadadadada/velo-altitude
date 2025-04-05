/**
 * Programmes d'entraînement détaillés pour différents objectifs cyclistes
 * Chaque programme inclut des phases progressives, des séances variées
 * et des paramètres adaptables selon le niveau du cycliste
 */

const trainingPrograms = {
  colsPreparation: {
    id: "cols-prep",
    name: "Préparation aux cols européens",
    description: "Programme progressif pour préparer les ascensions longues en montagne",
    duration: "12 semaines",
    targetAudience: ["Cyclosportifs", "Cyclotouristes", "Grimpeurs débutants à confirmés"],
    requiredFTP: "Connaissance de votre FTP recommandée",
    keyBenefits: [
      "Amélioration de la puissance en montée",
      "Optimisation du rapport poids/puissance",
      "Développement de l'endurance spécifique aux longues ascensions",
      "Préparation mentale pour les cols difficiles"
    ],
    phases: [
      {
        name: "Phase de base - Force et endurance",
        duration: "4 semaines",
        focus: "Développer la force et l'endurance de base",
        weeklyHours: "8-12h",
        keyWorkouts: [
          {
            name: "Force en côte",
            description: "Répétitions en côte à basse cadence (50-60 rpm)",
            details: "Trouver une côte de 5-8%, répéter 5-8 fois des montées de 3-5 minutes en restant assis, à une cadence de 50-60 rpm, à 85-90% FTP. Récupération en descente.",
            frequency: "1 fois par semaine",
            adaptations: {
              beginner: "5 répétitions de 3 minutes",
              intermediate: "6 répétitions de 4 minutes",
              advanced: "8 répétitions de 5 minutes"
            }
          },
          {
            name: "Sortie longue progressive",
            description: "Sortie longue avec segments à intensité croissante",
            details: "Sortie de 3-5 heures avec 3 segments de 20 minutes à intensité croissante (70%, 80%, 90% FTP) séparés par 10 minutes de récupération active.",
            frequency: "1 fois par semaine",
            adaptations: {
              beginner: "3h avec segments de 15 minutes",
              intermediate: "4h avec segments de 20 minutes",
              advanced: "5h avec segments de 25 minutes"
            }
          },
          {
            name: "Sweet Spot en plaine",
            description: "Intervalles longs en zone sweet spot (88-93% FTP)",
            details: "Échauffement de 15 minutes, puis 3-5 intervalles de 10-15 minutes à 88-93% FTP avec 5 minutes de récupération entre chaque. Retour au calme de 10 minutes.",
            frequency: "1 fois par semaine",
            adaptations: {
              beginner: "3 x 10 minutes",
              intermediate: "4 x 12 minutes",
              advanced: "5 x 15 minutes"
            }
          }
        ],
        recoveryStrategy: "Une semaine plus légère (-40% volume) toutes les 4 semaines"
      },
      {
        name: "Phase de construction - Spécificité",
        duration: "4 semaines",
        focus: "Développer les qualités spécifiques aux cols",
        weeklyHours: "10-14h",
        keyWorkouts: [
          {
            name: "Simulation d'ascension",
            description: "Effort long et constant similaire à l'ascension d'un col",
            details: "Trouver une côte longue ou utiliser un home trainer, maintenir un effort de 30-60 minutes à 85-92% FTP, en position assise majoritairement, avec cadence variable.",
            frequency: "1 fois par semaine",
            adaptations: {
              beginner: "30 minutes à 85% FTP",
              intermediate: "45 minutes à 88% FTP",
              advanced: "60 minutes à 92% FTP"
            }
          },
          {
            name: "Entraînement par blocs",
            description: "Alternance d'intensités simulant un profil de col irrégulier",
            details: "Échauffement de 15 minutes, puis 3 blocs de 15 minutes avec alternance de 1 minute à 105-110% FTP et 2 minutes à 85-90% FTP (sans récupération). 10 minutes de récupération entre les blocs.",
            frequency: "1 fois par semaine",
            adaptations: {
              beginner: "2 blocs, ratios 30s/90s",
              intermediate: "3 blocs, ratios 1min/2min",
              advanced: "4 blocs, ratios 1min/1min30s"
            }
          },
          {
            name: "Sortie très longue avec dénivelé",
            description: "Sortie d'endurance avec accumulation de dénivelé",
            details: "Sortie de 4-6 heures avec au moins 2000m de dénivelé positif, majorité en zone endurance (65-75% FTP) avec quelques portions à 80-85% FTP.",
            frequency: "1 fois par semaine",
            adaptations: {
              beginner: "4h, 1500m D+",
              intermediate: "5h, 2000m D+",
              advanced: "6h, 2500-3000m D+"
            }
          }
        ],
        recoveryStrategy: "Une semaine plus légère (-40% volume) à la fin de la phase"
      },
      {
        name: "Phase spécifique - Simulation cols",
        duration: "3 semaines",
        focus: "Préparer spécifiquement les cols ciblés",
        weeklyHours: "12-16h",
        keyWorkouts: [
          {
            name: "Double ascension",
            description: "Simulation de cols avec deux ascensions consécutives",
            details: "Deux ascensions de 30-45 minutes à 85-90% FTP avec seulement 15 minutes de récupération entre les deux. Idéalement sur la même montée pour simuler les cols.",
            frequency: "1 fois par semaine",
            adaptations: {
              beginner: "2 x 30min à 85% FTP",
              intermediate: "2 x 40min à 87% FTP",
              advanced: "2 x 45min à 90% FTP"
            }
          },
          {
            name: "Enchaînement de cols",
            description: "Sortie avec plusieurs cols consécutifs",
            details: "Sortie de 4-5 heures incluant 3-4 montées significatives, avec effort contrôlé à 80-85% FTP dans les montées.",
            frequency: "1 fois par semaine",
            adaptations: {
              beginner: "3 cols courts",
              intermediate: "3 cols moyens",
              advanced: "4 cols dont 2 longs"
            }
          },
          {
            name: "Accélérations en côte",
            description: "Travail d'explosivité pour les passages raides",
            details: "Dans une côte régulière, effectuer 8-12 accélérations de 30 secondes à >120% FTP, avec 2-3 minutes de récupération active entre chaque.",
            frequency: "1 fois par semaine",
            adaptations: {
              beginner: "8 x 30s",
              intermediate: "10 x 30s",
              advanced: "12 x 30s ou 8 x 45s"
            }
          }
        ],
        recoveryStrategy: "Semaine de récupération progressive avant l'événement"
      },
      {
        name: "Phase d'affûtage - Pic de forme",
        duration: "1 semaine",
        focus: "Récupérer tout en maintenant les adaptations",
        weeklyHours: "6-8h",
        keyWorkouts: [
          {
            name: "Activation",
            description: "Séance courte avec stimulations intenses",
            details: "1 heure avec 4-6 efforts courts (30-60s) à haute intensité (110-120% FTP) entrecoupés de récupération complète.",
            frequency: "2 fois dans la semaine",
            adaptations: {
              beginner: "4 x 30s",
              intermediate: "5 x 45s",
              advanced: "6 x 60s"
            }
          },
          {
            name: "Sortie d'endurance courte",
            description: "Maintien du volume à intensité réduite",
            details: "2-3 heures en zone d'endurance basse (60-70% FTP), sur terrain plat à vallonné.",
            frequency: "1 fois dans la semaine",
            adaptations: {
              beginner: "2h plat",
              intermediate: "2h30 vallonné",
              advanced: "3h vallonné"
            }
          }
        ],
        recoveryStrategy: "Repos complet ou sortie très légère la veille de l'événement"
      }
    ],
    complementaryTraining: [
      {
        type: "Renforcement musculaire",
        frequency: "2 séances par semaine en phase de base, 1 séance en phase de construction",
        exercises: [
          "Squat (3-4 séries de 8-12 répétitions)",
          "Fentes avant (3 séries de 10 par jambe)",
          "Extension des mollets (3 séries de 15)",
          "Gainage (planches frontales et latérales, 3x30-60s)"
        ]
      },
      {
        type: "Travail de la souplesse",
        frequency: "3-4 séances de 15 minutes par semaine",
        exercises: [
          "Étirements des quadriceps (3x30s par jambe)",
          "Étirements des ischio-jambiers (3x30s par jambe)",
          "Étirements du psoas et des fléchisseurs de hanche (3x30s par côté)",
          "Mobilité thoracique (rotations du buste, 2x10 par côté)"
        ]
      }
    ],
    nutritionTips: [
      "Maintenir un rapport poids/puissance optimal par une nutrition adaptée",
      "Entraîner le système digestif à assimiler les glucides pendant l'effort",
      "Travailler la capacité à supporter la chaleur, notamment par une hydratation adéquate",
      "Expérimenter différentes stratégies nutritionnelles pendant les longues sorties"
    ],
    colSpecificWorkouts: {
      alpes: [
        {
          col: "Alpe d'Huez",
          workout: "Intervalles 4x8 minutes à 90-95% FTP avec 4 minutes de récupération, simulant les 21 virages"
        },
        {
          col: "Col du Galibier",
          workout: "Effort progressif de 45-60 minutes débutant à 80% FTP et terminant à 90% FTP"
        }
      ],
      pyrenees: [
        {
          col: "Tourmalet",
          workout: "2x20 minutes à 85-90% FTP avec 10 minutes de récupération active"
        },
        {
          col: "Aubisque",
          workout: "30 minutes en Sweet Spot (88-93% FTP) suivies sans récupération de 10 minutes à 80-85% FTP"
        }
      ],
      dolomites: [
        {
          col: "Stelvio",
          workout: "Effort long de 60 minutes à 85% FTP avec 4-5 accélérations de 1 minute à 110% FTP"
        }
      ]
    }
  },
  
  longDistance: {
    id: "long-distance",
    name: "Préparation longue distance",
    description: "Programme pour développer l'endurance et l'efficacité sur les longues distances (150km+)",
    duration: "16 semaines",
    targetAudience: ["Cyclotouristes", "Randonneurs", "Ultracyclistes"],
    requiredFTP: "Connaissance de base recommandée",
    keyBenefits: [
      "Développement de l'endurance aérobie de base",
      "Amélioration de l'efficacité énergétique",
      "Adaptation du corps aux longues heures en selle",
      "Préparation mentale aux défis d'endurance"
    ],
    phases: [
      {
        name: "Phase de fondation - Endurance de base",
        duration: "6 semaines",
        focus: "Développer les fondations aérobies",
        weeklyHours: "8-12h",
        keyWorkouts: [
          {
            name: "Sortie longue à rythme constant",
            description: "Sortie longue en zone d'endurance progressive",
            details: "Sortie de 3-5 heures en zone d'endurance (65-75% FTP), en maintenant un rythme régulier et une cadence élevée (90-100 rpm).",
            frequency: "1 fois par semaine, augmentant progressivement en durée",
            adaptations: {
              beginner: "Commencer à 3h, ajouter 20min chaque semaine",
              intermediate: "Commencer à 4h, ajouter 20min chaque semaine",
              advanced: "Commencer à 5h, ajouter 30min chaque semaine"
            }
          },
          {
            name: "Tempo endurance",
            description: "Intervalles longs en zone tempo pour développer l'endurance",
            details: "2-3 intervalles de 20-30 minutes en zone tempo (75-85% FTP) avec 10 minutes de récupération entre chaque.",
            frequency: "1 fois par semaine",
            adaptations: {
              beginner: "2 x 20min à 75-80% FTP",
              intermediate: "2 x 30min à 80-85% FTP",
              advanced: "3 x 30min à 80-85% FTP"
            }
          }
        ],
        recoveryStrategy: "Une semaine plus légère (-30% volume) toutes les 3 semaines"
      },
      {
        name: "Phase de construction - Endurance spécifique",
        duration: "6 semaines",
        focus: "Développer l'endurance spécifique et l'efficacité",
        weeklyHours: "10-15h",
        keyWorkouts: [
          {
            name: "Sortie très longue avec ravitaillement",
            description: "Simulation d'événement avec stratégie de ravitaillement",
            details: "Sortie de 5-8 heures avec pratique des stratégies de ravitaillement (arrêts courts et efficaces) et gestion de l'effort (65-75% FTP).",
            frequency: "1 fois toutes les 2 semaines",
            adaptations: {
              beginner: "5h avec 2 arrêts",
              intermediate: "6-7h avec 2-3 arrêts",
              advanced: "7-8h avec 2-3 arrêts courts"
            }
          },
          {
            name: "Séance de pédalage économique",
            description: "Travail technique pour améliorer l'efficacité",
            details: "2-3h avec alternance de 10 minutes à cadence très élevée (100-110 rpm) et 10 minutes à cadence normale (85-95 rpm), tout en restant en zone d'endurance (65-75% FTP).",
            frequency: "1 fois par semaine",
            adaptations: {
              beginner: "2h, alternance 5min/10min",
              intermediate: "2.5h, alternance 8min/8min",
              advanced: "3h, alternance 10min/10min"
            }
          },
          {
            name: "Sweet Spot endurance",
            description: "Développer la résistance à la fatigue",
            details: "3 blocs de 30 minutes en sweet spot (88-93% FTP) avec 15 minutes de récupération active entre les blocs.",
            frequency: "1 fois par semaine",
            adaptations: {
              beginner: "2 x 20min",
              intermediate: "2 x 30min",
              advanced: "3 x 30min"
            }
          }
        ],
        recoveryStrategy: "Une semaine plus légère (-40% volume) à la fin de la phase"
      },
      {
        name: "Phase spécifique - Simulation d'événement",
        duration: "3 semaines",
        focus: "Préparer spécifiquement l'événement cible",
        weeklyHours: "12-18h",
        keyWorkouts: [
          {
            name: "Sortie jour après jour",
            description: "Développer la capacité de récupération entre les jours",
            details: "2-3 jours consécutifs de sorties longues (4-6h) à intensité d'endurance (65-75% FTP).",
            frequency: "1 bloc par semaine",
            adaptations: {
              beginner: "2 jours, 4h chaque jour",
              intermediate: "2 jours, 5h chaque jour",
              advanced: "3 jours, 5-6h chaque jour"
            }
          },
          {
            name: "Simulation finale",
            description: "Répétition générale de l'événement",
            details: "Sortie reproduisant exactement les conditions de l'événement (distance, dénivelé, ravitaillements) à 70-80% de la distance totale.",
            frequency: "1 fois dans cette phase",
            adaptations: {
              beginner: "70% de la distance à intensité légèrement réduite",
              intermediate: "75% de la distance à intensité cible",
              advanced: "80% de la distance à intensité cible"
            }
          }
        ],
        recoveryStrategy: "Semaine d'affûtage avant l'événement"
      },
      {
        name: "Phase d'affûtage",
        duration: "1-2 semaines",
        focus: "Récupération et préservation des adaptations",
        weeklyHours: "5-8h",
        keyWorkouts: [
          {
            name: "Maintien de l'endurance",
            description: "Sorties courtes pour maintenir les adaptations",
            details: "2-3 sorties de 1.5-2h comprenant 2-3 efforts de 10min à 80-85% FTP.",
            frequency: "2-3 fois dans la semaine",
            adaptations: {
              beginner: "2 sorties de 1.5h",
              intermediate: "2-3 sorties de 1.5-2h",
              advanced: "3 sorties de 2h"
            }
          }
        ],
        recoveryStrategy: "Réduction progressive du volume, maintien de quelques stimuli d'intensité"
      }
    ],
    complementaryTraining: [
      {
        type: "Renforcement postural",
        frequency: "2 séances par semaine",
        exercises: [
          "Gainage dynamique (3 séries de 10 mouvements)",
          "Exercices de stabilisation du tronc (bird dog, 3 séries de 10 par côté)",
          "Renforcement des lombaires (extensions du dos, 3 séries de 12)",
          "Renforcement des trapèzes et rhomboïdes pour soutenir la position du cycliste"
        ]
      },
      {
        type: "Mobilité et récupération",
        frequency: "Quotidien, 15-20 minutes",
        exercises: [
          "Mobilité de la hanche (cercles de hanche, 2 séries de 10 par côté)",
          "Étirements du dos (rotation du tronc, 2 séries de 30s par côté)",
          "Auto-massage des quadriceps et ischio-jambiers avec rouleau",
          "Exercices de mobilité cervicale (2-3 minutes)"
        ]
      }
    ],
    nutritionTips: [
      "S'entraîner à manger sur le vélo sans s'arrêter",
      "Tester différentes sources de glucides pour trouver ce qui convient le mieux",
      "Pratiquer l'hydratation régulière (150-250ml toutes les 15-20 minutes)",
      "Expérimenter la nutrition liquide pour les événements à haute intensité"
    ]
  },
  
  competition: {
    id: "competition",
    name: "Préparation compétition",
    description: "Programme intensif pour maximiser les performances en course",
    duration: "12 semaines",
    targetAudience: ["Compétiteurs", "Coureurs amateurs", "Cyclistes expérimentés"],
    requiredFTP: "Connaissance précise nécessaire",
    keyBenefits: [
      "Développement des capacités anaérobies",
      "Amélioration de la puissance maximale",
      "Optimisation des capacités tactiques",
      "Affûtage pour les événements clés"
    ],
    phases: [
      {
        name: "Phase de préparation générale",
        duration: "4 semaines",
        focus: "Développer les bases physiologiques",
        weeklyHours: "10-14h",
        keyWorkouts: [
          {
            name: "VO2max court",
            description: "Développer la capacité maximale aérobie",
            details: "5 séries de 5 répétitions de 30s à >120% FTP, avec 30s de récupération entre les répétitions et 5min entre les séries.",
            frequency: "1 fois par semaine",
            adaptations: {
              beginner: "4 séries de 4 répétitions",
              intermediate: "5 séries de 5 répétitions",
              advanced: "5 séries de 6 répétitions"
            }
          },
          {
            name: "Sweet Spot prolongé",
            description: "Développer l'endurance à haute intensité",
            details: "3-4 intervalles de 15-20min à 88-93% FTP avec 8min de récupération.",
            frequency: "1 fois par semaine",
            adaptations: {
              beginner: "3 x 15min",
              intermediate: "3 x 20min",
              advanced: "4 x 20min"
            }
          },
          {
            name: "Entraînement par bloc",
            description: "Variation d'intensité pour simuler la course",
            details: "3 blocs de 15min comprenant chacun: 30s à 120% FTP, 2min à 95% FTP, 30s à 120% FTP, 2min à 95% FTP, 30s à 120% FTP, 9min à 85% FTP. Récupération de 8min entre les blocs.",
            frequency: "1 fois par semaine",
            adaptations: {
              beginner: "2 blocs",
              intermediate: "3 blocs",
              advanced: "4 blocs"
            }
          }
        ],
        recoveryStrategy: "Une semaine plus légère (-40% volume) à la fin de la phase"
      },
      {
        name: "Phase de préparation spécifique",
        duration: "4 semaines",
        focus: "Développer les capacités spécifiques à la compétition",
        weeklyHours: "12-16h",
        keyWorkouts: [
          {
            name: "Attaques répétées",
            description: "Préparer aux accélérations multiples en course",
            details: "10-15 sprints de 15s à puissance maximale, récupération variable de 30s à 2min30s (simulant le peloton).",
            frequency: "1 fois par semaine",
            adaptations: {
              beginner: "10 sprints",
              intermediate: "12 sprints",
              advanced: "15 sprints"
            }
          },
          {
            name: "Simulation de course",
            description: "Reproduire les exigences d'une course",
            details: "2-3h avec sections structurées: 5min à 110% FTP (échappée), 15min à 85% FTP (peloton), répété 3-5 fois, puis 5min à puissance maximale (sprint final).",
            frequency: "1 fois par semaine",
            adaptations: {
              beginner: "2h, 3 répétitions",
              intermediate: "2.5h, 4 répétitions",
              advanced: "3h, 5 répétitions"
            }
          },
          {
            name: "Seuil sous fatigue",
            description: "Améliorer la capacité à performer fatigué",
            details: "Après 2h d'endurance, effectuer 2-3 efforts de 10min à 95-100% FTP avec 5min de récupération.",
            frequency: "1 fois par semaine",
            adaptations: {
              beginner: "1.5h + 2 x 8min",
              intermediate: "2h + 2 x 10min",
              advanced: "2h + 3 x 10min"
            }
          }
        ],
        recoveryStrategy: "Une semaine plus légère (-40% volume) à la fin de la phase"
      },
      {
        name: "Phase de compétition/affûtage",
        duration: "4 semaines",
        focus: "Optimiser la forme pour les compétitions",
        weeklyHours: "8-12h (hors compétitions)",
        keyWorkouts: [
          {
            name: "Activation pré-course",
            description: "Préparer le corps le jour de la compétition",
            details: "30-45min, incluant 3 efforts progressifs de 5min (70%, 80%, 90% FTP), puis 3-4 sprints courts de 10s à puissance maximale.",
            frequency: "Jour de la course ou la veille",
            adaptations: {
              beginner: "30min, 3 efforts",
              intermediate: "40min, 3 efforts + 3 sprints",
              advanced: "45min, 3 efforts + 4 sprints"
            }
          },
          {
            name: "Maintien de l'intensité",
            description: "Séance courte et intense pour maintenir les adaptations",
            details: "1h avec 5 efforts de 3min à 110-120% FTP, récupération complète de 3min entre chaque.",
            frequency: "1-2 fois par semaine (selon calendrier de courses)",
            adaptations: {
              beginner: "4 efforts",
              intermediate: "5 efforts",
              advanced: "6 efforts"
            }
          }
        ],
        recoveryStrategy: "Volume réduit, focus sur la qualité et la récupération entre les compétitions"
      }
    ],
    complementaryTraining: [
      {
        type: "Travail de sprint",
        frequency: "1-2 séances par semaine",
        exercises: [
          "Départs arrêtés (5-8 répétitions de 10-15s)",
          "Sprints en danseuse (5-8 répétitions de 10-15s)",
          "Accélérations progressives (5 répétitions de 20s)"
        ]
      },
      {
        type: "Renforcement explosif",
        frequency: "1-2 séances par semaine",
        exercises: [
          "Squat sauté (3-4 séries de 6-8 répétitions)",
          "Fentes sautées (3 séries de 8 par jambe)",
          "Step-up dynamique (3 séries de 8 par jambe)"
        ]
      }
    ],
    nutritionTips: [
      "Périodiser l'apport en glucides (jours d'entraînement intense vs jours légers)",
      "Optimiser la fenêtre de récupération post-entraînement intense",
      "Affûter la stratégie de carbo-loading avant les compétitions",
      "Pratiquer les stratégies nutritionnelles de course en entraînement"
    ],
    raceSpecificWorkouts: {
      criterium: [
        {
          type: "Critérium",
          workout: "20-30 sprints de 10-15s à puissance maximale avec récupération de 45-60s entre chaque"
        }
      ],
      roadRace: [
        {
          type: "Course sur route",
          workout: "2-3h avec 5-8 efforts de 3-5min à 110-120% FTP, répartis de manière irrégulière"
        }
      ],
      timeTrials: [
        {
          type: "Contre-la-montre",
          workout: "2-3 efforts de 10-20min à 100-105% FTP, position aéro"
        }
      ]
    }
  }
};

export default trainingPrograms;
