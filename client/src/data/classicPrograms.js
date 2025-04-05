/**
 * Programmes d'entraînement classiques pour cyclistes
 * Structurés pour différents niveaux et objectifs cyclistes
 * Complémentaires aux programmes HIIT et d'endurance
 */

const classicPrograms = {
  improvePower: {
    id: "improve-power",
    name: "Développement de la puissance cycliste",
    description: "Programme d'entraînement axé sur le développement de la puissance FTP",
    duration: "8 semaines",
    targetAudience: ["Cyclistes intermédiaires", "Cyclistes avancés", "Compétiteurs"],
    requiredFTP: "Test FTP initial requis pour calibrer les zones",
    keyBenefits: [
      "Augmentation du FTP",
      "Amélioration de la puissance soutenue",
      "Développement du seuil lactique",
      "Préparation aux compétitions"
    ],
    phases: [
      {
        name: "Phase 1 - Base de puissance",
        duration: "2 semaines",
        focus: "Établir les fondations et adapter le corps au travail de puissance",
        weeklyHours: "6-8h",
        keyWorkouts: [
          {
            name: "Sweet Spot progressif",
            description: "Intervalles en zone Sweet Spot avec progression de durée",
            details: "Échauffement de 15 minutes, puis intervalles à 88-93% FTP, récupération de 5 minutes entre chaque, retour au calme de 10 minutes",
            frequency: "2 fois par semaine",
            adaptations: {
              beginner: "3 x 8 minutes",
              intermediate: "3 x 12 minutes",
              advanced: "3 x 15 minutes"
            }
          },
          {
            name: "Force spécifique",
            description: "Travail de force à basse cadence en côte",
            details: "Trouver une côte de 4-8%, faire des répétitions de 4 minutes à 80-85% FTP en restant assis avec une cadence de 50-60 rpm",
            frequency: "1 fois par semaine",
            adaptations: {
              beginner: "4 répétitions, récupération 4 minutes",
              intermediate: "6 répétitions, récupération 3 minutes",
              advanced: "8 répétitions, récupération 2 minutes"
            }
          }
        ],
        recoveryStrategy: "Une journée complète de repos après chaque séance intense"
      },
      {
        name: "Phase 2 - Seuil et supra-seuil",
        duration: "3 semaines",
        focus: "Développement de la capacité à maintenir un effort au seuil et légèrement au-dessus",
        weeklyHours: "8-10h",
        keyWorkouts: [
          {
            name: "Intervalles au seuil",
            description: "Efforts soutenus à 95-105% du FTP",
            details: "Échauffement de 15 minutes, puis intervalles à 95-105% FTP, récupération active à 65% FTP pendant la moitié du temps d'effort, retour au calme de 10 minutes",
            frequency: "1 fois par semaine",
            adaptations: {
              beginner: "3 x 8 minutes à 95% FTP",
              intermediate: "3 x 10 minutes à 100% FTP",
              advanced: "3 x 12 minutes à 105% FTP"
            }
          },
          {
            name: "Pyramide de puissance",
            description: "Série d'intervalles ascendants puis descendants en intensité",
            details: "Après échauffement, série d'intervalles à intensité croissante puis décroissante, avec récupération égale au temps d'effort",
            frequency: "1 fois par semaine",
            adaptations: {
              beginner: "1'/2'/3'/2'/1' à 105/100/95/100/105% FTP",
              intermediate: "2'/3'/4'/5'/4'/3'/2' à 105/100/95/90/95/100/105% FTP",
              advanced: "2'/4'/6'/8'/6'/4'/2' à 110/105/100/95/100/105/110% FTP"
            }
          },
          {
            name: "Micro-bursts",
            description: "Alternance rapide d'efforts intenses et de récupération",
            details: "Après échauffement, séries de micro-intervalles de 15s à 130-150% FTP suivis de 15s de récupération à 50% FTP",
            frequency: "1 fois par semaine",
            adaptations: {
              beginner: "3 séries de 5 minutes (10 répétitions par série)",
              intermediate: "4 séries de 5 minutes (10 répétitions par série)",
              advanced: "5 séries de 5 minutes (10 répétitions par série)"
            }
          }
        ],
        recoveryStrategy: "Une semaine allégée (-40% volume) après cette phase"
      },
      {
        name: "Phase 3 - Spécificité et intensité",
        duration: "2 semaines",
        focus: "Augmentation de l'intensité et spécificité par rapport aux objectifs",
        weeklyHours: "7-9h",
        keyWorkouts: [
          {
            name: "Seuil étendu",
            description: "Effort prolongé juste en dessous du seuil anaérobie",
            details: "Après échauffement, maintenir un effort continu à 95-98% FTP",
            frequency: "1 fois par semaine",
            adaptations: {
              beginner: "1 x 20 minutes",
              intermediate: "1 x 30 minutes",
              advanced: "1 x 40 minutes"
            }
          },
          {
            name: "VO2max ciblé",
            description: "Intervalles courts à haute intensité pour stimuler le VO2max",
            details: "Après échauffement, intervalles à 110-120% FTP avec récupération égale au temps d'effort",
            frequency: "1 fois par semaine",
            adaptations: {
              beginner: "5 x 3 minutes, récupération 3 minutes",
              intermediate: "6 x 3 minutes, récupération 3 minutes",
              advanced: "7 x 3 minutes, récupération 3 minutes"
            }
          }
        ],
        recoveryStrategy: "Récupération active entre les séances avec sorties de faible intensité"
      },
      {
        name: "Phase 4 - Affûtage et test final",
        duration: "1 semaine",
        focus: "Affûtage pour le pic de forme et évaluation des progrès",
        weeklyHours: "4-5h",
        keyWorkouts: [
          {
            name: "Activation qualitative",
            description: "Maintien de l'intensité avec réduction du volume",
            details: "Échauffement de 15 minutes, puis courtes séries d'efforts intenses, retour au calme de 10 minutes",
            frequency: "2 fois dans la semaine",
            adaptations: {
              beginner: "2 x 5 minutes à 95% FTP + 4 x 30s à 120% FTP",
              intermediate: "2 x 6 minutes à 95% FTP + 5 x 30s à 120% FTP",
              advanced: "2 x 8 minutes à 95% FTP + 6 x 30s à 120% FTP"
            }
          },
          {
            name: "Test FTP final",
            description: "Évaluation du nouveau FTP après le programme",
            details: "Protocole de test FTP standard (échauffement, effort de 20 minutes, retour au calme)",
            frequency: "1 fois (fin de programme)",
            adaptations: {
              beginner: "Test de 20 minutes",
              intermediate: "Test de 20 minutes",
              advanced: "Test de 20 minutes"
            }
          }
        ],
        recoveryStrategy: "Repos complet 1-2 jours avant le test FTP final"
      }
    ],
    complementaryTraining: [
      {
        type: "Renforcement musculaire",
        frequency: "1-2 séances par semaine (phases 1-2)",
        exercises: [
          "Squats (3-4 séries de 8-10 répétitions)",
          "Fentes avec haltères (3 séries de 8 par jambe)",
          "Step-ups (3 séries de 10 par jambe)",
          "Planches latérales (3 séries de 30-45 secondes par côté)"
        ]
      },
      {
        type: "Récupération active",
        frequency: "1-2 séances par semaine",
        exercises: [
          "Vélo très facile (zone 1, 30-45 minutes)",
          "Yoga pour cyclistes (20-30 minutes)",
          "Étirements dynamiques et statiques (15-20 minutes)"
        ]
      }
    ],
    nutritionTips: [
      "Consommation de glucides avant les séances intenses (1-1.5g/kg)",
      "Apport protéique augmenté pour favoriser la récupération (1.6-1.8g/kg/jour)",
      "Hydratation optimale avant, pendant et après les séances",
      "Fenêtre de récupération: apport de glucides et protéines dans les 30 minutes post-entraînement"
    ]
  },
  
  racePreparation: {
    id: "race-prep",
    name: "Préparation aux compétitions cyclistes",
    description: "Programme d'entraînement spécifique pour les compétitions sur route",
    duration: "6 semaines",
    targetAudience: ["Cyclistes compétiteurs", "Cyclosportifs"],
    requiredFTP: "Test FTP récent nécessaire pour calibrage précis",
    keyBenefits: [
      "Optimisation de la forme pour les compétitions",
      "Amélioration des capacités anaérobies et du sprint",
      "Développement des aptitudes tactiques",
      "Gestion de la fatigue entre les compétitions"
    ],
    phases: [
      {
        name: "Phase 1 - Préparation spécifique",
        duration: "3 semaines",
        focus: "Développement des qualités spécifiques à la compétition",
        weeklyHours: "8-12h",
        keyWorkouts: [
          {
            name: "Simulation de course",
            description: "Entraînement reproduisant les intensités variables d'une course",
            details: "Après échauffement, alternance d'efforts à intensités variables simulant attaques, montées, et phases de peloton",
            frequency: "1 fois par semaine",
            adaptations: {
              beginner: "1h avec 5 'attaques' de 1min à 120% FTP",
              intermediate: "1h30 avec 7 'attaques' de 1min à 120-130% FTP",
              advanced: "2h avec 10 'attaques' de 1min à 130-140% FTP"
            }
          },
          {
            name: "Travail de sprint",
            description: "Développement de la puissance en sprint",
            details: "Après échauffement et partie principale à intensité modérée, série de sprints maximaux",
            frequency: "1 fois par semaine",
            adaptations: {
              beginner: "5 sprints de 10-15s, récupération 5min",
              intermediate: "7 sprints de 10-15s, récupération 4min",
              advanced: "10 sprints de 10-15s, récupération 3min"
            }
          },
          {
            name: "Capacité anaérobie",
            description: "Développement de la capacité à produire des efforts supra-maximaux",
            details: "Après échauffement, intervalles courts à très haute intensité",
            frequency: "1 fois par semaine",
            adaptations: {
              beginner: "6 x 1min à 120% FTP, récupération 2min",
              intermediate: "8 x 1min à 125% FTP, récupération 2min",
              advanced: "10 x 1min à 130% FTP, récupération 2min"
            }
          }
        ],
        recoveryStrategy: "Récupération active le lendemain des séances intenses"
      },
      {
        name: "Phase 2 - Affûtage pré-compétition",
        duration: "2 semaines",
        focus: "Optimisation de la forme et récupération",
        weeklyHours: "6-8h",
        keyWorkouts: [
          {
            name: "Intensité ciblée",
            description: "Maintien de l'intensité avec réduction du volume",
            details: "Séances courtes avec quelques efforts spécifiques à haute intensité",
            frequency: "2 fois par semaine",
            adaptations: {
              beginner: "45min dont 3 x 4min à 100% FTP",
              intermediate: "1h dont 3 x 5min à 100% FTP + 3 x 30s à 120% FTP",
              advanced: "1h15 dont 3 x 6min à 100% FTP + 4 x 30s à 120% FTP"
            }
          },
          {
            name: "Activation pré-course",
            description: "Préparation optimale pour la compétition (J-1)",
            details: "Séance courte d'activation avec quelques accélérations",
            frequency: "La veille de la compétition",
            adaptations: {
              beginner: "30min dont 3 x 1min à 90% FTP + 2 x 10s sprint",
              intermediate: "40min dont 3 x 2min à 90% FTP + 3 x 10s sprint",
              advanced: "45min dont 3 x 3min à 90% FTP + 4 x 10s sprint"
            }
          }
        ],
        recoveryStrategy: "Repos optimal avant la compétition (1-2 jours selon l'athlète)"
      },
      {
        name: "Phase 3 - Récupération et maintien",
        duration: "1 semaine",
        focus: "Récupération post-compétition et maintien de la forme",
        weeklyHours: "4-6h",
        keyWorkouts: [
          {
            name: "Récupération active",
            description: "Faciliter la récupération post-course",
            details: "Vélo facile en zone 1-2, sans aucun effort intense",
            frequency: "1-2 jours après la compétition",
            adaptations: {
              beginner: "30-45min en zone 1",
              intermediate: "45-60min en zone 1-2",
              advanced: "60-90min en zone 1-2"
            }
          },
          {
            name: "Maintien qualitatif",
            description: "Maintenir les adaptations avec volume réduit",
            details: "Séance courte avec quelques intervalles de qualité",
            frequency: "3-4 jours après la compétition",
            adaptations: {
              beginner: "45min dont 2 x 5min à 90% FTP",
              intermediate: "1h dont 2 x 8min à 90% FTP",
              advanced: "1h15 dont 2 x 10min à 90% FTP"
            }
          }
        ],
        recoveryStrategy: "Priorité à la récupération complète avant le prochain bloc intensif"
      }
    ],
    complementaryTraining: [
      {
        type: "Préparation mentale",
        frequency: "2-3 séances par semaine",
        exercises: [
          "Visualisation du parcours et des scénarios de course",
          "Techniques de gestion du stress pré-compétition",
          "Établissement d'objectifs spécifiques et mesurables",
          "Analyse post-course pour identification des points d'amélioration"
        ]
      }
    ],
    nutritionTips: [
      "Stratégie de carbo-loading 48h avant la compétition",
      "Petit-déjeuner adapté 3h avant le départ",
      "Hydratation et nutrition en course: 60-90g de glucides/heure",
      "Récupération post-course: ratio glucides/protéines de 3:1 dans les 30 minutes"
    ]
  }
};

export default classicPrograms;
