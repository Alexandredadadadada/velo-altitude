/**
 * Programmes d'entraînement d'endurance pour cyclistes
 * Structurés pour développer progressivement les capacités d'endurance
 * Adaptés pour différents niveaux et objectifs de distance
 */

const endurancePrograms = {
  baseEndurance: {
    id: "base-endurance",
    name: "Fondation d'endurance cycliste",
    description: "Programme pour construire une base solide d'endurance aérobie",
    duration: "8 semaines",
    targetAudience: ["Cyclistes débutants", "Cyclistes intermédiaires", "Retour après pause"],
    requiredFTP: "Test FTP initial recommandé pour le suivi des progrès",
    keyBenefits: [
      "Développement du système aérobie",
      "Amélioration de l'efficacité métabolique",
      "Renforcement cardiovasculaire",
      "Adaptation physiologique progressive"
    ],
    phases: [
      {
        name: "Phase 1 - Adaptation initiale",
        duration: "2 semaines",
        focus: "Habituation progressive à l'effort cycliste",
        weeklyHours: "4-6h",
        keyWorkouts: [
          {
            name: "Endurance de base",
            description: "Sortie à intensité modérée en zone 2",
            details: "Maintenir une cadence de 85-95 rpm, rester en zone 2 (65-75% FTP), focus sur la régularité",
            frequency: "2-3 fois par semaine",
            adaptations: {
              beginner: "45-60 minutes",
              intermediate: "1h15-1h30",
              advanced: "2h"
            }
          },
          {
            name: "Travail de cadence",
            description: "Variation de cadence pour améliorer l'efficacité pédaleuse",
            details: "Alternance de périodes à cadence modérée (85 rpm) et élevée (100+ rpm), tout en maintenant une intensité en zone 2",
            frequency: "1 fois par semaine",
            adaptations: {
              beginner: "30 minutes avec blocs de 3 minutes",
              intermediate: "45 minutes avec blocs de 4 minutes",
              advanced: "1h avec blocs de 5 minutes"
            }
          }
        ],
        recoveryStrategy: "Un jour de repos complet entre chaque sortie"
      },
      {
        name: "Phase 2 - Construction du volume",
        duration: "3 semaines",
        focus: "Augmentation progressive du volume d'entraînement",
        weeklyHours: "6-8h",
        keyWorkouts: [
          {
            name: "Sortie longue progressive",
            description: "Sortie d'endurance avec augmentation de durée chaque semaine",
            details: "Maintenir une intensité en zone 2 (65-75% FTP), avec attention particulière à l'hydratation et la nutrition",
            frequency: "1 fois par semaine (week-end)",
            adaptations: {
              beginner: "1h30 → 2h → 2h30",
              intermediate: "2h → 2h30 → 3h",
              advanced: "2h30 → 3h → 3h30"
            }
          },
          {
            name: "Endurance avec intervalles doux",
            description: "Sortie d'endurance avec brèves périodes en zone 3",
            details: "Sur une base d'endurance, inclure 3-5 intervalles de 5 minutes en zone 3 (76-85% FTP), récupération de 5 minutes en zone 1-2",
            frequency: "1 fois par semaine",
            adaptations: {
              beginner: "3 intervalles",
              intermediate: "4 intervalles",
              advanced: "5 intervalles"
            }
          },
          {
            name: "Sortie récupération active",
            description: "Sortie très légère pour favoriser la récupération",
            details: "Rester strictement en zone 1 (< 65% FTP), cadence élevée (95+ rpm), parcours plat",
            frequency: "1 fois par semaine",
            adaptations: {
              beginner: "30 minutes",
              intermediate: "45 minutes",
              advanced: "1h"
            }
          }
        ],
        recoveryStrategy: "Une semaine plus légère (-30% volume) après cette phase"
      },
      {
        name: "Phase 3 - Introduction Sweet Spot",
        duration: "2 semaines",
        focus: "Amélioration de la puissance soutenue",
        weeklyHours: "7-10h",
        keyWorkouts: [
          {
            name: "Intervalles Sweet Spot",
            description: "Efforts en zone Sweet Spot (88-93% FTP)",
            details: "Échauffement de 15 minutes, puis intervalles en Sweet Spot, récupération de 5 minutes entre chaque, retour au calme de 10 minutes",
            frequency: "1 fois par semaine",
            adaptations: {
              beginner: "3 x 8 minutes",
              intermediate: "3 x 12 minutes",
              advanced: "3 x 15 minutes"
            }
          },
          {
            name: "Sortie longue avec sections vallonnées",
            description: "Endurance avec focus sur les montées à rythme constant",
            details: "Sortie globalement en zone 2, avec les montées abordées à 80-85% FTP en restant assis",
            frequency: "1 fois par semaine",
            adaptations: {
              beginner: "2h avec 3-4 montées",
              intermediate: "2h30 avec 4-5 montées",
              advanced: "3h avec 5-6 montées"
            }
          }
        ],
        recoveryStrategy: "Minimum un jour de récupération active après chaque séance intense"
      },
      {
        name: "Phase 4 - Spécifique endurance",
        duration: "1 semaine",
        focus: "Test d'endurance progressive",
        weeklyHours: "6-7h",
        keyWorkouts: [
          {
            name: "Sortie de validation",
            description: "Longue sortie avec sections à intensités variées",
            details: "1ère partie en zone 2, 2ème partie avec alternance zone 2/zone 3, dernière section avec 20 minutes en Sweet Spot",
            frequency: "1 fois (fin de programme)",
            adaptations: {
              beginner: "2h30 total",
              intermediate: "3h total",
              advanced: "3h30-4h total"
            }
          },
          {
            name: "Test FTP de suivi",
            description: "Réévaluation du FTP pour mesurer les progrès",
            details: "Protocole de test FTP standard (échauffement, effort de 20 minutes, retour au calme)",
            frequency: "1 fois (fin de programme)",
            adaptations: {
              beginner: "Test de 20 minutes",
              intermediate: "Test de 20 minutes",
              advanced: "Test de 20 minutes"
            }
          }
        ],
        recoveryStrategy: "Semaine de récupération avant de commencer un nouveau bloc d'entraînement"
      }
    ],
    complementaryTraining: [
      {
        type: "Renforcement musculaire",
        frequency: "1-2 séances par semaine",
        exercises: [
          "Squats (3 séries de 12-15 répétitions)",
          "Fentes (3 séries de 10 répétitions par jambe)",
          "Planche (3 séries de 30-60 secondes)",
          "Extensions lombaires (3 séries de 12-15 répétitions)"
        ]
      },
      {
        type: "Étirements et mobilité",
        frequency: "3-4 séances par semaine, 15-20 minutes",
        exercises: [
          "Étirements des quadriceps et ischio-jambiers",
          "Mobilisation de la hanche",
          "Étirements des fléchisseurs de hanche",
          "Mobilité thoracique"
        ]
      }
    ],
    nutritionTips: [
      "Consommer des glucides avant les sorties longues (1-2g/kg)",
      "S'hydrater régulièrement (500-750ml/heure selon conditions)",
      "Assurer un apport protéique de qualité pour la récupération",
      "Expérimenter différentes stratégies nutritionnelles durant les sorties longues"
    ]
  },
  
  longDistanceEndurance: {
    id: "long-distance",
    name: "Préparation aux longues distances",
    description: "Programme pour préparer des événements de 100km+ et des cyclosportives",
    duration: "12 semaines",
    targetAudience: ["Cyclistes intermédiaires", "Cyclistes avancés", "Cyclosportifs"],
    requiredFTP: "Test FTP requis pour le calibrage des zones d'intensité",
    keyBenefits: [
      "Endurance spécifique aux longues distances",
      "Économie énergétique et gestion de l'effort",
      "Adaptation neuromusculaire aux longues heures en selle",
      "Stratégies nutritionnelles pour événements longue distance"
    ],
    phases: [
      {
        name: "Phase 1 - Volume progressif",
        duration: "4 semaines",
        focus: "Construction méthodique du volume d'entraînement",
        weeklyHours: "8-12h",
        keyWorkouts: [
          {
            name: "Sortie longue progressive",
            description: "Augmentation graduelle de la distance/durée chaque semaine",
            details: "Maintenir une intensité en zone 2 (65-75% FTP), focus sur l'économie énergétique et l'alimentation en route",
            frequency: "1 fois par semaine",
            adaptations: {
              beginner: "2h → 2h30 → 3h → 3h30",
              intermediate: "3h → 3h30 → 4h → 4h30",
              advanced: "3h30 → 4h → 4h30 → 5h"
            }
          },
          {
            name: "Tempo ondulé",
            description: "Alternance de périodes en zone 3 et zone 2",
            details: "Blocs de 10 minutes en zone 3 (76-85% FTP) suivis de 10 minutes en zone 2 (65-75% FTP), répétés selon niveau",
            frequency: "1 fois par semaine",
            adaptations: {
              beginner: "3 répétitions (1h total)",
              intermediate: "4 répétitions (1h20 total)",
              advanced: "5 répétitions (1h40 total)"
            }
          }
        ],
        recoveryStrategy: "Une semaine plus légère (-30% volume) après les 4 semaines"
      },
      {
        name: "Phase 2 - Spécificité physiologique",
        duration: "4 semaines",
        focus: "Développement des qualités physiologiques spécifiques",
        weeklyHours: "10-14h",
        keyWorkouts: [
          {
            name: "Blocs Sweet Spot",
            description: "Entraînement en zone Sweet Spot pour améliorer la puissance soutenue",
            details: "Après échauffement, intervalles à 88-93% FTP avec récupération courte",
            frequency: "1 fois par semaine",
            adaptations: {
              beginner: "3 x 15 minutes, récup 5 min",
              intermediate: "3 x 20 minutes, récup 5 min",
              advanced: "4 x 20 minutes, récup 5 min"
            }
          },
          {
            name: "Sortie très longue",
            description: "Sortie d'endurance prolongée simulant la demande de l'événement",
            details: "Intensité principalement en zone 2, avec segments de 15-20 minutes à 80-85% FTP intercalés",
            frequency: "1 fois par semaine",
            adaptations: {
              beginner: "4h avec 2 segments intensifiés",
              intermediate: "5h avec 3 segments intensifiés",
              advanced: "6h avec 4 segments intensifiés"
            }
          },
          {
            name: "Entraînement métabolique",
            description: "Travail spécifique d'économie des graisses",
            details: "Sortie à jeun le matin à faible intensité (60-70% FTP) avec apport hydrique et électrolytique",
            frequency: "1 fois par semaine",
            adaptations: {
              beginner: "1h30",
              intermediate: "2h",
              advanced: "2h30"
            }
          }
        ],
        recoveryStrategy: "Une semaine plus légère (-40% volume) après les 4 semaines"
      },
      {
        name: "Phase 3 - Simulation d'événement",
        duration: "3 semaines",
        focus: "Préparation spécifique à l'événement cible",
        weeklyHours: "12-16h",
        keyWorkouts: [
          {
            name: "Sortie de simulation",
            description: "Reproduction des conditions de l'événement",
            details: "Tenter de reproduire le profil, l'intensité et la durée de l'événement cible, avec stratégie nutritionnelle adaptée",
            frequency: "1 fois par semaine",
            adaptations: {
              beginner: "70-80% de la distance cible",
              intermediate: "80-90% de la distance cible",
              advanced: "90-100% de la distance cible"
            }
          },
          {
            name: "Bloc d'endurance intensive",
            description: "Sortie longue avec intervalles progressifs",
            details: "Sortie longue avec 3 blocs de 20-30 minutes à intensité progressive (75%, 85%, 90% FTP)",
            frequency: "1 fois par semaine",
            adaptations: {
              beginner: "Blocs de 20 minutes",
              intermediate: "Blocs de 25 minutes",
              advanced: "Blocs de 30 minutes"
            }
          }
        ],
        recoveryStrategy: "Diminution progressive du volume en approchant de l'événement"
      },
      {
        name: "Phase 4 - Affûtage",
        duration: "1 semaine",
        focus: "Préparation finale pour l'événement",
        weeklyHours: "5-8h",
        keyWorkouts: [
          {
            name: "Activation avec intensité",
            description: "Maintien de l'intensité avec volume réduit",
            details: "Sortie courte avec 2-3 efforts de 5 minutes à 90-95% FTP pour maintenir les adaptations",
            frequency: "2 fois dans la semaine",
            adaptations: {
              beginner: "45 minutes total, 2 efforts",
              intermediate: "1h total, 3 efforts",
              advanced: "1h15 total, 3 efforts"
            }
          },
          {
            name: "Sortie technique",
            description: "Révision des compétences techniques",
            details: "Parcours varié pour pratiquer changements de vitesse, virage, position en groupe, etc.",
            frequency: "1 fois (milieu de semaine)",
            adaptations: {
              beginner: "1h",
              intermediate: "1h15",
              advanced: "1h30"
            }
          }
        ],
        recoveryStrategy: "Repos presque complet 1-2 jours avant l'événement"
      }
    ],
    complementaryTraining: [
      {
        type: "Stabilité posturale",
        frequency: "2 séances par semaine",
        exercises: [
          "Planche avec variantes (3 séries de 45-60 secondes)",
          "Superman (3 séries de 10-15 répétitions)",
          "Bird-dog (3 séries de 8-12 par côté)",
          "Pont fessier (3 séries de 15 répétitions)"
        ]
      }
    ],
    nutritionTips: [
      "Pratiquer la stratégie nutritionnelle en entraînement (60-90g glucides/heure pour efforts >2h30)",
      "S'habituer à manger sur le vélo pendant les sorties longues",
      "Expérimenter différentes sources de glucides (gels, barres, boissons, aliments solides)",
      "Hydrater correctement (objectif: pas plus de 2-3% de perte de poids corporel)"
    ]
  }
};

export default endurancePrograms;
