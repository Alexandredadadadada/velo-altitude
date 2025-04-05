/**
 * Programmes d'entraînement complémentaires pour cyclistes - Module 3
 * Focus sur le développement des compétences spécifiques, la préparation mentale et l'amélioration technique
 * Conçu pour s'intégrer parfaitement avec le FTPCalculator et les zones d'entraînement
 */

const remainingTrainingPrograms3 = {
  technicalMastery: {
    id: "technical-mastery",
    name: "Maîtrise technique cycliste",
    description: "Programme de perfectionnement des compétences techniques sur le vélo",
    duration: "6 semaines",
    targetAudience: ["Tous niveaux", "Cyclistes cherchant à améliorer leur sécurité", "Descendeurs"],
    requiredFTP: "Non nécessaire, basé sur le développement des compétences",
    keyBenefits: [
      "Amélioration du contrôle du vélo",
      "Confiance accrue dans les descentes",
      "Efficacité dans les virages",
      "Gestion optimisée de l'équilibre et du freinage"
    ],
    phases: [
      {
        name: "Phase 1 - Compétences fondamentales",
        duration: "2 semaines",
        focus: "Maîtrise des bases techniques du cyclisme",
        weeklyHours: "4-6h",
        keyWorkouts: [
          {
            name: "Position et équilibre",
            description: "Exercices de maîtrise de la position sur le vélo",
            details: "Séance d'entraînement sur terrain plat puis légèrement vallonné, avec exercices spécifiques: position des mains, équilibre en danseuse, équilibre à basse vitesse",
            frequency: "1 fois par semaine",
            adaptations: {
              beginner: "Focus sur l'équilibre statique et dynamique",
              intermediate: "Ajout d'exercices en danseuse prolongée",
              advanced: "Exercices avancés type 'track stand' et équilibre unijambiste"
            }
          },
          {
            name: "Précision et agilité",
            description: "Parcours de slalom et exercices de précision",
            details: "Installation de cônes/obstacles pour créer un parcours technique nécessitant changements de direction précis, évitements d'obstacles et passages étroits",
            frequency: "1 fois par semaine",
            adaptations: {
              beginner: "Slalom large et simple",
              intermediate: "Slalom plus serré avec virages à 90°",
              advanced: "Parcours complexe avec virages serrés et passages étroits"
            }
          }
        ],
        recoveryStrategy: "Ces séances sont peu exigeantes physiquement mais demandent de la concentration"
      },
      {
        name: "Phase 2 - Technique de virage",
        duration: "2 semaines",
        focus: "Perfectionnement des trajectoires et de la technique en virage",
        weeklyHours: "5-7h",
        keyWorkouts: [
          {
            name: "Virages techniques",
            description: "Travail spécifique sur la technique de virage",
            details: "Recherche de virages variés (serrés, ouverts, dévers, contre-dévers) pour pratiquer: point de freinage, appui, trajectoire idéale, accélération en sortie",
            frequency: "1 fois par semaine",
            adaptations: {
              beginner: "Virages à vitesse modérée, focus sur la position",
              intermediate: "Virages à vitesse croissante, travail sur la trajectoire",
              advanced: "Virages à vitesse élevée, optimisation de l'appui et la trajectoire"
            }
          },
          {
            name: "Enchaînements techniques",
            description: "Pratique d'enchaînements de virages et passages techniques",
            details: "Recherche d'un segment de route/chemin avec succession de virages pour travailler les enchaînements et le transfert de poids",
            frequency: "1 fois par semaine",
            adaptations: {
              beginner: "Descentes faciles, focus sur le regard et la position",
              intermediate: "Descentes de difficulté moyenne, travail sur l'anticipation",
              advanced: "Descentes techniques, travail sur la fluidité et l'efficacité"
            }
          }
        ],
        recoveryStrategy: "Alternance avec des sorties d'endurance calmes pour récupérer mentalement"
      },
      {
        name: "Phase 3 - Maîtrise de la descente",
        duration: "1 semaine",
        focus: "Perfectionnement des techniques de descente",
        weeklyHours: "5-7h",
        keyWorkouts: [
          {
            name: "Descentes progressives",
            description: "Pratique sur des descentes de difficulté croissante",
            details: "Sélection de plusieurs descentes de difficulté variable pour pratiquer progressivement: position, freinage, lecture de la route, gestion de la vitesse",
            frequency: "1-2 fois dans la semaine",
            adaptations: {
              beginner: "Descentes courtes et peu techniques",
              intermediate: "Descentes plus longues avec quelques passages techniques",
              advanced: "Descentes longues et techniques avec variations de surface"
            }
          },
          {
            name: "Freinage d'urgence",
            description: "Techniques de freinage d'urgence et d'évitement",
            details: "Sur terrain sécurisé, pratiquer des freinages d'urgence à différentes vitesses et des manœuvres d'évitement",
            frequency: "1 fois dans la semaine",
            adaptations: {
              beginner: "Vitesse modérée, focus sur la technique de freinage équilibré",
              intermediate: "Vitesse moyenne, ajout d'évitements simples",
              advanced: "Vitesse plus élevée, évitements complexes avec freinage limité"
            }
          }
        ],
        recoveryStrategy: "Ces séances peuvent être mentalement fatigantes, prévoir des récupérations adéquates"
      },
      {
        name: "Phase 4 - Intégration et application",
        duration: "1 semaine",
        focus: "Application des compétences en conditions réelles",
        weeklyHours: "6-8h",
        keyWorkouts: [
          {
            name: "Sortie technique complète",
            description: "Parcours intégrant tous les aspects techniques travaillés",
            details: "Concevoir une sortie incluant virages techniques, descentes, montées raides pour appliquer toutes les compétences dans un contexte global",
            frequency: "1 fois (fin de programme)",
            adaptations: {
              beginner: "Parcours modéré avec quelques sections techniques",
              intermediate: "Parcours avec sections techniques variées",
              advanced: "Parcours exigeant avec multiples défis techniques"
            }
          },
          {
            name: "Challenge personnel",
            description: "Défi sur un segment technique spécifique",
            details: "Sélectionner un segment technique (descente, virage technique ou série de virages) et mesurer sa progression",
            frequency: "1 fois (évaluation finale)",
            adaptations: {
              beginner: "Segment de niveau débutant/intermédiaire",
              intermediate: "Segment technique de longueur moyenne",
              advanced: "Segment technique exigeant et prolongé"
            }
          }
        ],
        recoveryStrategy: "Semaine plus légère avec focus sur l'application plutôt que l'intensité"
      }
    ],
    complementaryTraining: [
      {
        type: "Exercices de proprioception",
        frequency: "2-3 fois par semaine, 15 minutes",
        exercises: [
          "Équilibre sur une jambe (30s par jambe, 3 séries)",
          "Exercices sur bosu ou coussin instable",
          "Planche avec mouvements de déstabilisation",
          "Squat sur surface instable"
        ]
      },
      {
        type: "Renforcement du haut du corps",
        frequency: "2 fois par semaine",
        exercises: [
          "Pompes (3 séries de 10-15)",
          "Tractions avec élastique si nécessaire (3 séries de 8-12)",
          "Dips (3 séries de 10-15)",
          "Renforcement des avant-bras et poignets"
        ]
      }
    ],
    nutritionTips: [
      "Hydratation optimale pour maintenir la concentration",
      "Collation légère avant les séances techniques pour rester alerte",
      "Éviter les aliments lourds qui pourraient diminuer la réactivité",
      "Privilégier les glucides complexes pour l'énergie mentale soutenue"
    ]
  },
  
  mentalPreparation: {
    id: "mental-prep",
    name: "Préparation mentale pour cyclistes",
    description: "Programme de développement des aptitudes mentales pour optimiser la performance",
    duration: "4 semaines",
    targetAudience: ["Cyclistes de tous niveaux", "Compétiteurs", "Cyclistes face à des défis"],
    requiredFTP: "Non applicable, mais peut être combiné avec d'autres programmes physiques",
    keyBenefits: [
      "Amélioration de la confiance en soi",
      "Gestion optimisée du stress et de l'anxiété",
      "Renforcement de la concentration",
      "Développement de la résilience mentale"
    ],
    phases: [
      {
        name: "Phase 1 - Pleine conscience et concentration",
        duration: "1 semaine",
        focus: "Développement de la pleine conscience et de la concentration",
        weeklyHours: "3-4h (séances mentales)",
        keyWorkouts: [
          {
            name: "Pleine conscience à vélo",
            description: "Pratique de la pleine conscience pendant les sorties",
            details: "Sorties à faible intensité avec focus complet sur les sensations physiques, la respiration, et l'environnement, sans distraction mentale",
            frequency: "2 fois par semaine",
            adaptations: {
              beginner: "Sorties de 30 minutes en terrain facile",
              intermediate: "Sorties de 45 minutes avec sections variées",
              advanced: "Sorties de 60+ minutes intégrant des sections techniques"
            }
          },
          {
            name: "Exercices de concentration ciblée",
            description: "Développement de la capacité à maintenir la concentration",
            details: "Séances structurées avec exercices spécifiques de concentration: focus sur cadence précise, maintien d'une puissance exacte, comptage de respiration",
            frequency: "2 fois par semaine",
            adaptations: {
              beginner: "Intervalles de concentration de 5 minutes",
              intermediate: "Intervalles de concentration de 10 minutes",
              advanced: "Intervalles de concentration de 15 minutes avec distractions"
            }
          }
        ],
        recoveryStrategy: "Ces séances sont intégrées dans l'entraînement physique normal"
      },
      {
        name: "Phase 2 - Visualisation et dialogue interne",
        duration: "1 semaine",
        focus: "Techniques de visualisation et optimisation du dialogue interne",
        weeklyHours: "3-5h (séances mentales)",
        keyWorkouts: [
          {
            name: "Visualisation de performance",
            description: "Pratique de la visualisation mentale des performances cyclistes",
            details: "Séances de visualisation guidée: imaginer avec le maximum de détails sensoriels une performance réussie (col difficile, compétition, segment technique)",
            frequency: "3-4 fois par semaine",
            adaptations: {
              beginner: "Visualisations de 10 minutes, scénarios simples",
              intermediate: "Visualisations de 15 minutes, scénarios complets",
              advanced: "Visualisations de 20 minutes, incluant gestion d'imprévus"
            }
          },
          {
            name: "Restructuration du dialogue interne",
            description: "Transformation des pensées négatives en pensées constructives",
            details: "Identification des schémas de pensée limitants pendant l'effort et pratique de leur restructuration en affirmations positives et constructives",
            frequency: "Quotidien + 2 séances d'entraînement",
            adaptations: {
              beginner: "Focus sur l'identification des pensées négatives",
              intermediate: "Travail sur la neutralisation des pensées négatives",
              advanced: "Transformation active en dialogue interne optimisé"
            }
          }
        ],
        recoveryStrategy: "Peut être pratiqué en dehors des séances d'entraînement physique"
      },
      {
        name: "Phase 3 - Gestion du stress et de l'adversité",
        duration: "1 semaine",
        focus: "Développement de la résilience face aux difficultés",
        weeklyHours: "4-6h (séances intégrées)",
        keyWorkouts: [
          {
            name: "Simulation de difficulté",
            description: "Entraînement dans des conditions volontairement difficiles",
            details: "Séances planifiées dans des conditions adverses contrôlées: vent, pluie légère, terrain difficile, fatigue simulée... tout en maintenant une attitude positive",
            frequency: "1-2 fois par semaine",
            adaptations: {
              beginner: "Difficulté modérée, durée limitée",
              intermediate: "Difficulté moyenne, durée prolongée",
              advanced: "Conditions multiples adverses, longue durée"
            }
          },
          {
            name: "Techniques de régulation du stress",
            description: "Apprentissage et pratique des méthodes de gestion du stress",
            details: "Pratique de techniques de respiration, relaxation progressive et réinitialisation mentale pendant l'effort",
            frequency: "3-4 fois par semaine",
            adaptations: {
              beginner: "Respiration contrôlée simple",
              intermediate: "Ajout de techniques de relaxation musculaire",
              advanced: "Intégration de reset mental complet pendant l'effort"
            }
          }
        ],
        recoveryStrategy: "Ces séances sont plus exigeantes mentalement, prévoir des récupérations adéquates"
      },
      {
        name: "Phase 4 - Intégration et routines de performance",
        duration: "1 semaine",
        focus: "Création de routines mentales optimales pour la performance",
        weeklyHours: "4-5h (séances intégrées)",
        keyWorkouts: [
          {
            name: "Routines pré-performance",
            description: "Développement et test de routines mentales avant l'effort",
            details: "Création et test de séquences personnalisées de préparation mentale: visualisation, affirmations, respiration, activation mentale avant un effort important",
            frequency: "3 fois dans la semaine",
            adaptations: {
              beginner: "Routine simple de 5 minutes",
              intermediate: "Routine complète de 10 minutes",
              advanced: "Routine détaillée de 15 minutes avec contingences"
            }
          },
          {
            name: "Simulation d'objectif",
            description: "Mise en situation réelle d'un objectif important",
            details: "Simulation complète d'un événement/objectif cycliste avec application de toutes les techniques mentales apprises",
            frequency: "1 fois (fin de programme)",
            adaptations: {
              beginner: "Événement de faible enjeu",
              intermediate: "Événement d'enjeu modéré",
              advanced: "Simulation de haute importance"
            }
          }
        ],
        recoveryStrategy: "Intégrer ces routines dans la préparation normale d'entraînement"
      }
    ],
    complementaryTraining: [
      {
        type: "Méditation guidée",
        frequency: "3-5 fois par semaine, 10-15 minutes",
        exercises: [
          "Méditation de pleine conscience",
          "Body scan (balayage corporel)",
          "Méditation sur la respiration",
          "Méditation de gratitude"
        ]
      },
      {
        type: "Journal de cyclisme",
        frequency: "Quotidien, 5-10 minutes",
        exercises: [
          "Enregistrement des réussites et difficultés",
          "Analyse des pensées limitantes identifiées",
          "Planification des objectifs mentaux spécifiques",
          "Suivi des progrès des techniques mentales"
        ]
      }
    ],
    nutritionTips: [
      "Alimentation équilibrée pour optimiser la fonction cognitive",
      "Hydratation adéquate pour la clarté mentale",
      "Limitation de la caféine qui peut augmenter l'anxiété",
      "Alimentation régulière pour éviter les baisses d'énergie affectant la concentration"
    ]
  }
};

export default remainingTrainingPrograms3;
