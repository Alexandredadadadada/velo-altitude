/**
 * Programme d'entraînement cycliste pour débutants
 * Structuré sur 8 semaines pour introduire progressivement les bases du cyclisme
 */

const beginnerProgram = {
  id: 'beginner-cyclist-program',
  name: 'Programme Débutant',
  description: 'Programme d\'introduction au cyclisme sur 8 semaines, idéal pour les nouveaux cyclistes souhaitant acquérir les bases techniques, développer l\'endurance et prendre confiance sur le vélo. Progression douce et adaptée.',
  duration: 8, // semaines
  level: ['débutant'],
  goals: [
    'Développer l\'endurance de base pour rouler confortablement 1 à 2 heures',
    'Acquérir les techniques fondamentales du cyclisme',
    'Établir une routine d\'entraînement régulière et agréable',
    'Construire des habitudes durables et une motivation à long terme'
  ],
  requirements: {
    minFTP: 'Non requis',
    minTrainingHours: 3,
    equipment: ['Vélo en bon état', 'Casque', 'Tenue adaptée']
  },
  phases: [
    {
      id: 'familiarisation',
      name: 'Phase de familiarisation',
      weeks: 2,
      focus: 'Premières sorties et apprentissage technique',
      description: 'Établir une routine d\'entraînement, s\'habituer à la position sur le vélo et apprendre les bases techniques.'
    },
    {
      id: 'endurance',
      name: 'Phase d\'endurance fondamentale',
      weeks: 3,
      focus: 'Développement de l\'endurance et confiance',
      description: 'Augmentation progressive du temps en selle et introduction des premières côtes douces.'
    },
    {
      id: 'consolidation',
      name: 'Phase de consolidation',
      weeks: 2,
      focus: 'Sorties plus longues et techniques avancées',
      description: 'Consolidation des acquis techniques et introduction de sorties plus longues.'
    },
    {
      id: 'conclusion',
      name: 'Phase de conclusion',
      weeks: 1,
      focus: 'Sortie challenge et planification future',
      description: 'Application des compétences acquises lors d\'une sortie plus longue et planification de la suite.'
    }
  ],
  weeklyPlans: [
    // PHASE 1: FAMILIARISATION - SEMAINES 1-2
    {
      week: 1,
      theme: 'Premiers pas sur le vélo',
      workouts: [
        {
          day: 1,
          name: 'Introduction au cyclisme',
          type: 'Technique',
          duration: 30,
          intensityType: 'Facile',
          description: 'Première sortie courte pour se familiariser avec le vélo et les bases',
          structure: [
            { name: 'Vérification du vélo et équipement', duration: 5, zone: 'NA' },
            { name: 'Pratique du démarrage et arrêt', duration: 5, zone: 'NA' },
            { name: 'Roulage tranquille sur terrain plat', duration: 15, zone: 'Conversation facile' },
            { name: 'Retour au calme', duration: 5, zone: 'Très facile' }
          ]
        },
        {
          day: 3,
          name: 'Techniques de base',
          type: 'Technique',
          duration: 40,
          intensityType: 'Facile',
          description: 'Apprentissage des techniques de base: position, freinage, changements de vitesse',
          structure: [
            { name: 'Échauffement léger', duration: 5, zone: 'Très facile' },
            { name: 'Exercices de position sur le vélo', duration: 10, zone: 'NA' },
            { name: 'Pratique des freins et changements de vitesse', duration: 15, zone: 'NA' },
            { name: 'Application en roulage', duration: 10, zone: 'Conversation facile' }
          ]
        },
        {
          day: 5,
          name: 'Sortie découverte',
          type: 'Endurance',
          duration: 45,
          intensityType: 'Facile',
          description: 'Première sortie légèrement plus longue sur terrain plat',
          structure: [
            { name: 'Échauffement progressif', duration: 10, zone: 'Très facile' },
            { name: 'Roulage en endurance légère', duration: 30, zone: 'Conversation facile' },
            { name: 'Retour au calme', duration: 5, zone: 'Très facile' }
          ]
        }
      ]
    },
    {
      week: 2,
      theme: 'Développement de la confiance',
      workouts: [
        {
          day: 1,
          name: 'Maniabilité et agilité',
          type: 'Technique',
          duration: 45,
          intensityType: 'Facile',
          description: 'Exercices de maniabilité pour développer la confiance sur le vélo',
          structure: [
            { name: 'Échauffement', duration: 10, zone: 'Très facile' },
            { name: 'Slaloms et exercices d\'agilité', duration: 20, zone: 'NA' },
            { name: 'Application en roulage', duration: 15, zone: 'Conversation facile' }
          ]
        },
        {
          day: 3,
          name: 'Petite côte introduction',
          type: 'Endurance',
          duration: 50,
          intensityType: 'Facile-Modéré',
          description: 'Introduction aux premières petites côtes',
          structure: [
            { name: 'Échauffement progressif', duration: 10, zone: 'Très facile' },
            { name: 'Roulage avec 2-3 petites côtes douces', duration: 35, zone: 'Conversation possible' },
            { name: 'Retour au calme', duration: 5, zone: 'Très facile' }
          ]
        },
        {
          day: 5,
          name: 'Sortie d\'endurance',
          type: 'Endurance',
          duration: 60,
          intensityType: 'Facile',
          description: 'Première sortie d\'une heure pour développer l\'endurance de base',
          structure: [
            { name: 'Échauffement progressif', duration: 10, zone: 'Très facile' },
            { name: 'Roulage en endurance', duration: 45, zone: 'Conversation facile' },
            { name: 'Retour au calme', duration: 5, zone: 'Très facile' }
          ],
          nutrition: 'Emporter un bidon d\'eau et une petite collation'
        }
      ]
    },
    
    // PHASE 2: ENDURANCE FONDAMENTALE - SEMAINES 3-5
    {
      week: 3,
      theme: 'Construction de l\'endurance',
      workouts: [
        {
          day: 1,
          name: 'Technique et cadence',
          type: 'Technique',
          duration: 45,
          intensityType: 'Facile',
          description: 'Travail sur la cadence de pédalage et l\'efficacité',
          structure: [
            { name: 'Échauffement', duration: 10, zone: 'Très facile' },
            { name: 'Exercices de cadence variée (70-90 rpm)', duration: 25, zone: 'Conversation facile' },
            { name: 'Retour au calme', duration: 10, zone: 'Très facile' }
          ]
        },
        {
          day: 3,
          name: 'Sortie vallonnée légère',
          type: 'Endurance',
          duration: 70,
          intensityType: 'Facile-Modéré',
          description: 'Sortie sur parcours légèrement vallonné',
          structure: [
            { name: 'Échauffement progressif', duration: 10, zone: 'Très facile' },
            { name: 'Parcours avec quelques petites côtes', duration: 50, zone: 'Conversation possible' },
            { name: 'Retour au calme', duration: 10, zone: 'Très facile' }
          ]
        },
        {
          day: 5,
          name: 'Endurance progressive',
          type: 'Endurance',
          duration: 80,
          intensityType: 'Facile',
          description: 'Sortie plus longue à allure régulière',
          structure: [
            { name: 'Échauffement progressif', duration: 10, zone: 'Très facile' },
            { name: 'Roulage en endurance constante', duration: 60, zone: 'Conversation facile' },
            { name: 'Retour au calme', duration: 10, zone: 'Très facile' }
          ],
          nutrition: 'Emporter deux bidons et une collation pour mi-parcours'
        }
      ]
    },
    {
      week: 4,
      theme: 'Techniques avancées et volume',
      workouts: [
        {
          day: 1,
          name: 'Relais et roulage en groupe',
          type: 'Technique',
          duration: 60,
          intensityType: 'Facile-Modéré',
          description: 'Introduction aux techniques de roulage en groupe (si possible)',
          structure: [
            { name: 'Échauffement', duration: 10, zone: 'Très facile' },
            { name: 'Exercices de relais et positionnement', duration: 40, zone: 'Conversation possible' },
            { name: 'Retour au calme', duration: 10, zone: 'Très facile' }
          ]
        },
        {
          day: 3,
          name: 'Sortie dénivelé',
          type: 'Endurance',
          duration: 90,
          intensityType: 'Facile-Modéré',
          description: 'Sortie avec un peu plus de dénivelé pour renforcer les jambes',
          structure: [
            { name: 'Échauffement progressif', duration: 15, zone: 'Très facile' },
            { name: 'Parcours vallonné', duration: 60, zone: 'Conversation possible' },
            { name: 'Retour au calme', duration: 15, zone: 'Très facile' }
          ]
        },
        {
          day: 6,
          name: 'Longue sortie détendue',
          type: 'Endurance',
          duration: 100,
          intensityType: 'Facile',
          description: 'Première sortie de plus d\'1h30 pour bâtir l\'endurance',
          structure: [
            { name: 'Échauffement progressif', duration: 15, zone: 'Très facile' },
            { name: 'Roulage en endurance constante', duration: 75, zone: 'Conversation facile' },
            { name: 'Retour au calme', duration: 10, zone: 'Très facile' }
          ],
          nutrition: 'Emporter deux bidons et plusieurs collations, manger toutes les 45 minutes'
        }
      ]
    },
    {
      week: 5,
      theme: 'Consolidation endurance',
      workouts: [
        {
          day: 1,
          name: 'Récupération active',
          type: 'Récupération',
          duration: 30,
          intensityType: 'Très facile',
          description: 'Sortie très légère pour récupérer',
          structure: [
            { name: 'Roulage très léger', duration: 30, zone: 'Très facile' }
          ]
        },
        {
          day: 2,
          name: 'Variations d\'allure',
          type: 'Endurance',
          duration: 60,
          intensityType: 'Facile-Modéré',
          description: 'Introduction aux légères variations d\'allure',
          structure: [
            { name: 'Échauffement', duration: 10, zone: 'Très facile' },
            { name: 'Alternance 5min allure normale / 2min allure légèrement plus soutenue', duration: 40, zone: 'Variable' },
            { name: 'Retour au calme', duration: 10, zone: 'Très facile' }
          ]
        },
        {
          day: 4,
          name: 'Endurance et technique',
          type: 'Mixte',
          duration: 75,
          intensityType: 'Facile',
          description: 'Combinaison d\'endurance et travail technique',
          structure: [
            { name: 'Échauffement', duration: 10, zone: 'Très facile' },
            { name: 'Roulage avec focus technique', duration: 55, zone: 'Conversation facile' },
            { name: 'Retour au calme', duration: 10, zone: 'Très facile' }
          ]
        },
        {
          day: 6,
          name: 'Sortie endurance moyenne',
          type: 'Endurance',
          duration: 120,
          intensityType: 'Facile',
          description: 'Sortie de 2 heures pour consolider l\'endurance',
          structure: [
            { name: 'Échauffement progressif', duration: 15, zone: 'Très facile' },
            { name: 'Roulage en endurance constante', duration: 90, zone: 'Conversation facile' },
            { name: 'Retour au calme', duration: 15, zone: 'Très facile' }
          ],
          nutrition: 'Plan nutritionnel plus structuré: 1 bidon/heure et 30-60g glucides/heure'
        }
      ]
    },
    
    // PHASE 3: CONSOLIDATION - SEMAINES 6-7
    {
      week: 6,
      theme: 'Techniques spécifiques',
      workouts: [
        {
          day: 1,
          name: 'Travail de descentes',
          type: 'Technique',
          duration: 60,
          intensityType: 'Facile-Modéré',
          description: 'Focus sur les techniques de descente et virages',
          structure: [
            { name: 'Échauffement', duration: 10, zone: 'Très facile' },
            { name: 'Exercices de descente et virages', duration: 40, zone: 'Variable' },
            { name: 'Retour au calme', duration: 10, zone: 'Très facile' }
          ]
        },
        {
          day: 3,
          name: 'Sortie rythmée',
          type: 'Endurance',
          duration: 90,
          intensityType: 'Modéré',
          description: 'Sortie avec quelques sections à allure plus soutenue',
          structure: [
            { name: 'Échauffement', duration: 15, zone: 'Très facile' },
            { name: 'Roulage avec 3-4 sections de 5-10min à allure soutenue', duration: 60, zone: 'Variable' },
            { name: 'Retour au calme', duration: 15, zone: 'Très facile' }
          ]
        },
        {
          day: 5,
          name: 'Récupération technique',
          type: 'Technique',
          duration: 45,
          intensityType: 'Facile',
          description: 'Sortie légère axée sur les habiletés techniques',
          structure: [
            { name: 'Échauffement', duration: 10, zone: 'Très facile' },
            { name: 'Exercices techniques variés', duration: 25, zone: 'Conversation facile' },
            { name: 'Retour au calme', duration: 10, zone: 'Très facile' }
          ]
        },
        {
          day: 7,
          name: 'Sortie longue vallonnée',
          type: 'Endurance',
          duration: 135,
          intensityType: 'Facile-Modéré',
          description: 'Sortie longue sur parcours vallonné',
          structure: [
            { name: 'Échauffement progressif', duration: 15, zone: 'Très facile' },
            { name: 'Parcours vallonné en endurance', duration: 105, zone: 'Conversation possible' },
            { name: 'Retour au calme', duration: 15, zone: 'Très facile' }
          ],
          nutrition: 'Stratégie complète: 2 bidons/3h, 30-60g glucides/heure, collation salée en fin de sortie'
        }
      ]
    },
    {
      week: 7,
      theme: 'Volume et confiance',
      workouts: [
        {
          day: 1,
          name: 'Récupération active',
          type: 'Récupération',
          duration: 40,
          intensityType: 'Très facile',
          description: 'Sortie très légère pour récupérer',
          structure: [
            { name: 'Roulage très léger', duration: 40, zone: 'Très facile' }
          ]
        },
        {
          day: 3,
          name: 'Endurance avec sections collines',
          type: 'Endurance',
          duration: 90,
          intensityType: 'Facile-Modéré',
          description: 'Sortie d\'endurance avec focus sur les montées',
          structure: [
            { name: 'Échauffement', duration: 15, zone: 'Très facile' },
            { name: 'Parcours avec plusieurs montées modérées', duration: 60, zone: 'Variable' },
            { name: 'Retour au calme', duration: 15, zone: 'Très facile' }
          ]
        },
        {
          day: 5,
          name: 'Préparation sortie longue',
          type: 'Endurance',
          duration: 75,
          intensityType: 'Facile',
          description: 'Sortie modérée préparatoire à la sortie longue finale',
          structure: [
            { name: 'Échauffement', duration: 10, zone: 'Très facile' },
            { name: 'Endurance constante', duration: 55, zone: 'Conversation facile' },
            { name: 'Retour au calme', duration: 10, zone: 'Très facile' }
          ]
        },
        {
          day: 7,
          name: 'Sortie longue de consolidation',
          type: 'Endurance',
          duration: 150,
          intensityType: 'Facile-Modéré',
          description: 'Sortie longue pour préparer le challenge final',
          structure: [
            { name: 'Échauffement progressif', duration: 15, zone: 'Très facile' },
            { name: 'Parcours varié en endurance', duration: 120, zone: 'Conversation possible' },
            { name: 'Retour au calme', duration: 15, zone: 'Très facile' }
          ],
          nutrition: 'Application complète de la stratégie nutritionnelle pratiquée'
        }
      ]
    },
    
    // PHASE 4: CONCLUSION - SEMAINE 8
    {
      week: 8,
      theme: 'Challenge final et planification',
      workouts: [
        {
          day: 1,
          name: 'Sortie de récupération',
          type: 'Récupération',
          duration: 40,
          intensityType: 'Très facile',
          description: 'Récupération active avant le challenge final',
          structure: [
            { name: 'Roulage très léger', duration: 40, zone: 'Très facile' }
          ]
        },
        {
          day: 3,
          name: 'Préparation challenge',
          type: 'Endurance',
          duration: 60,
          intensityType: 'Facile',
          description: 'Dernière sortie avant le challenge, révision des techniques',
          structure: [
            { name: 'Échauffement', duration: 10, zone: 'Très facile' },
            { name: 'Roulage léger avec rappels techniques', duration: 40, zone: 'Conversation facile' },
            { name: 'Retour au calme', duration: 10, zone: 'Très facile' }
          ]
        },
        {
          day: 5,
          name: 'Journée de repos',
          type: 'Repos',
          duration: 0,
          intensityType: 'Repos',
          description: 'Repos complet avant le challenge final'
        },
        {
          day: 6,
          name: 'CHALLENGE FINAL',
          type: 'Événement',
          duration: 180,
          intensityType: 'Modéré',
          description: 'Sortie challenge de 3 heures, application de toutes les compétences acquises',
          structure: [
            { name: 'Échauffement complet', duration: 20, zone: 'Progressive' },
            { name: 'Sortie challenge sur parcours varié', duration: 150, zone: 'Variable' },
            { name: 'Retour au calme', duration: 10, zone: 'Très facile' }
          ],
          nutrition: 'Application complète du plan nutritionnel avec objectif 45-60g glucides/heure'
        },
        {
          day: 7,
          name: 'Récupération et planification',
          type: 'Récupération',
          duration: 45,
          intensityType: 'Très facile',
          description: 'Sortie légère de récupération et planification des prochains objectifs',
          structure: [
            { name: 'Roulage très léger', duration: 45, zone: 'Très facile' }
          ]
        }
      ]
    }
  ],
  adaptations: {
    limitedTime: 'Prioriser 2 séances par semaine: une séance technique et la sortie longue du weekend',
    olderBeginners: 'Réduire l\'intensité des variations d\'allure et allonger les périodes de récupération',
    fitnessBackground: 'Pour ceux avec un fond sportif, augmenter progressivement le volume de 10-15%',
    healthConcerns: 'Toujours consulter un médecin avant de commencer, et privilégier la régularité plutôt que l\'intensité'
  },
  progressionMetrics: {
    endurance: 'De 30 minutes à 3 heures de sortie',
    technique: 'Maîtrise du changement de vitesses, freinage, position et équilibre',
    confort: 'Augmentation progressive du confort sur le vélo sur des distances plus longues',
    confiance: 'Capacité à rouler en groupe et à affronter différents terrains'
  },
  equipment: {
    essential: ['Vélo adapté et bien réglé', 'Casque', 'Cuissard rembourré', 'Gants', 'Bidon'],
    recommended: ['Compteur vélo basique', 'Lunettes de soleil', 'Petit sac de selle avec kit de réparation'],
    maintenance: ['Apprendre à vérifier la pression des pneus', 'Bases du nettoyage et lubrification']
  },
  nutrition: {
    hydration: 'Boire régulièrement, 1 bidon par heure environ selon conditions',
    shortRides: 'Pour les sorties <1h, un bidon d\'eau suffit généralement',
    longRides: 'Pour les sorties >1h30, prévoir 30-60g de glucides par heure',
    recovery: 'Après les sorties longues, consommer un repas équilibré avec protéines et glucides dans les 30-60 minutes'
  },
  nextSteps: {
    progression: 'Programme intermédiaire de 12 semaines pour continuer la progression',
    events: 'Envisager une première cyclosportive courte (50-70km)',
    community: 'Rejoindre un club ou groupe de cyclistes pour pratique régulière',
    skills: 'Approfondir les aspects techniques et commencer le travail de force spécifique'
  }
};

export default beginnerProgram;
