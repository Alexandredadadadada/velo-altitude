/**
 * Plans nutritionnels détaillés pour différents types d'efforts cyclistes
 * Ces plans incluent des stratégies avant/pendant/après effort et sont adaptés
 * aux besoins spécifiques des différents types de cyclistes
 */

const nutritionPlans = {
  endurance: {
    name: "Plan Endurance",
    description: "Nutrition optimisée pour les sorties longues et les événements d'endurance",
    suitableFor: ["Cyclosportifs", "Randonneurs", "Cyclistes longue distance"],
    macroRatio: {
      carbs: 65, // pourcentage des calories totales
      protein: 15,
      fat: 20
    },
    calorieAdjustment: 1.2, // multiplicateur des besoins caloriques de base
    hydrationStrategy: {
      beforeRide: "500-750ml dans les 2 heures précédant l'effort",
      duringRide: "500-750ml par heure (augmenter jusqu'à 1L en conditions chaudes)",
      electrolytes: "300-500mg de sodium par litre en conditions normales, 700-1000mg en conditions chaudes"
    },
    timingStrategies: {
      preworkout: {
        timing: "2-3 heures avant",
        description: "Repas riche en glucides complexes, modéré en protéines, faible en graisses et fibres",
        macroRatio: {
          carbs: 70,
          protein: 15,
          fat: 15
        },
        examples: [
          {
            meal: "Porridge aux fruits rouges",
            description: "80g de flocons d'avoine, 250ml de lait, 100g de fruits rouges, 1 cuillère de miel",
            nutrients: {
              calories: 450,
              carbs: 75,
              protein: 15,
              fat: 8
            }
          },
          {
            meal: "Pancakes au sarrasin et banane",
            description: "60g de farine de sarrasin, 1 banane, 1 œuf, 200ml de lait, sirop d'érable",
            nutrients: {
              calories: 480,
              carbs: 85,
              protein: 14,
              fat: 9
            }
          },
          {
            meal: "Riz et poulet",
            description: "100g de riz, 80g de blanc de poulet, sauce tomate légère",
            nutrients: {
              calories: 420,
              carbs: 70,
              protein: 25,
              fat: 5
            }
          }
        ]
      },
      duringWorkout: {
        timing: "Toutes les 45-60 minutes",
        description: "Apports riches en glucides facilement assimilables, faibles en protéines et lipides",
        macroRatio: {
          carbs: 90,
          protein: 5,
          fat: 5
        },
        examples: [
          {
            food: "Banane",
            portion: "1 moyenne",
            nutrients: {
              calories: 100,
              carbs: 25,
              protein: 1,
              fat: 0
            }
          },
          {
            food: "Barre énergétique maison",
            portion: "1 barre (60g)",
            description: "Flocons d'avoine, dattes, miel, amandes",
            nutrients: {
              calories: 220,
              carbs: 40,
              protein: 5,
              fat: 4
            }
          },
          {
            food: "Gel énergétique",
            portion: "1 sachet",
            nutrients: {
              calories: 100,
              carbs: 25,
              protein: 0,
              fat: 0
            }
          }
        ],
        strategy: "Alterner entre gels, barres et aliments solides. Viser 60-90g de glucides par heure."
      },
      postWorkout: {
        timing: "Dans les 30 minutes après l'effort",
        description: "Récupération avec ratio glucides/protéines 4:1 pour favoriser la resynthèse du glycogène",
        macroRatio: {
          carbs: 75,
          protein: 20,
          fat: 5
        },
        examples: [
          {
            meal: "Smoothie récupération",
            description: "1 banane, 200ml de lait, 30g de protéine de whey, 1 cuillère de miel",
            nutrients: {
              calories: 350,
              carbs: 45,
              protein: 30,
              fat: 5
            }
          },
          {
            meal: "Yaourt grec aux fruits et granola",
            description: "200g de yaourt grec, 100g de fruits frais, 30g de granola, 1 cuillère de miel",
            nutrients: {
              calories: 380,
              carbs: 50,
              protein: 25,
              fat: 8
            }
          }
        ]
      }
    },
    weeklyMealPlan: [
      // Structure de base d'un plan hebdomadaire
      // Peut être personnalisé selon les horaires d'entraînement
    ],
    supplementsRecommended: [
      {
        name: "Électrolytes",
        dosage: "Selon les conditions (chaleur, humidité) et le taux de sudation",
        timing: "Avant et pendant les sorties longues",
        benefits: "Prévention des crampes, maintien de l'équilibre hydro-électrolytique"
      },
      {
        name: "Maltodextrine",
        dosage: "30-60g par heure d'effort",
        timing: "Pendant les sorties de plus de 90 minutes",
        benefits: "Source de glucides facilement digestible, énergie soutenue"
      }
    ]
  },
  
  highIntensity: {
    name: "Plan Haute Intensité",
    description: "Nutrition ciblée pour les efforts courts et intenses, les compétitions et le fractionné",
    suitableFor: ["Compétiteurs", "Pratiquants de critériums", "Amateurs de fractionné"],
    macroRatio: {
      carbs: 60,
      protein: 20,
      fat: 20
    },
    calorieAdjustment: 1.1,
    hydrationStrategy: {
      beforeRide: "400-600ml dans les 2 heures précédant l'effort",
      duringRide: "150-250ml toutes les 15-20 minutes",
      electrolytes: "400-600mg de sodium par litre"
    },
    timingStrategies: {
      preworkout: {
        timing: "1.5-2 heures avant",
        description: "Repas facilement digestible, riche en glucides, modéré en protéines",
        macroRatio: {
          carbs: 65,
          protein: 20,
          fat: 15
        },
        examples: [
          {
            meal: "Toast au miel et beurre d'amande",
            description: "2 tranches de pain complet, 1 cuillère de beurre d'amande, 1 cuillère de miel",
            nutrients: {
              calories: 340,
              carbs: 45,
              protein: 12,
              fat: 10
            }
          },
          {
            meal: "Bol de riz et œuf",
            description: "100g de riz, 2 œufs brouillés, sauce soja légère",
            nutrients: {
              calories: 380,
              carbs: 55,
              protein: 20,
              fat: 8
            }
          }
        ]
      },
      duringWorkout: {
        timing: "Pendant les phases de récupération",
        description: "Glucides simples à assimilation rapide",
        macroRatio: {
          carbs: 95,
          protein: 3,
          fat: 2
        },
        examples: [
          {
            food: "Gel énergétique avec caféine",
            portion: "1 sachet",
            nutrients: {
              calories: 100,
              carbs: 25,
              protein: 0,
              fat: 0
            }
          },
          {
            food: "Boisson isotonique",
            portion: "300ml",
            nutrients: {
              calories: 80,
              carbs: 20,
              protein: 0,
              fat: 0
            }
          }
        ],
        strategy: "Privilégier les gels et boissons. Viser 30-60g de glucides par heure selon l'intensité."
      },
      postWorkout: {
        timing: "Dans les 20 minutes après l'effort",
        description: "Récupération avec ratio glucides/protéines 3:1 pour favoriser la récupération musculaire",
        macroRatio: {
          carbs: 65,
          protein: 25,
          fat: 10
        },
        examples: [
          {
            meal: "Shake protéiné à la banane",
            description: "30g de protéine de whey, 1 banane, 200ml de lait, 1 cuillère de miel",
            nutrients: {
              calories: 350,
              carbs: 45,
              protein: 35,
              fat: 5
            }
          },
          {
            meal: "Pain complet avec œuf et avocat",
            description: "2 tranches de pain complet, 2 œufs, 1/4 d'avocat",
            nutrients: {
              calories: 400,
              carbs: 35,
              protein: 25,
              fat: 18
            }
          }
        ]
      }
    },
    supplementsRecommended: [
      {
        name: "Créatine monohydrate",
        dosage: "3-5g par jour",
        timing: "Quotidiennement, peu importe le moment",
        benefits: "Amélioration de la puissance lors des efforts explosifs, récupération entre les séries"
      },
      {
        name: "Caféine",
        dosage: "3-6mg/kg de poids corporel",
        timing: "30-60 minutes avant l'effort intense",
        benefits: "Amélioration de la vigilance et de la performance, réduction de la perception de l'effort"
      },
      {
        name: "BCAA",
        dosage: "5-10g",
        timing: "Avant et/ou pendant l'effort",
        benefits: "Réduction des dommages musculaires, amélioration potentielle de la récupération"
      }
    ]
  },
  
  mountain: {
    name: "Plan Montagne",
    description: "Nutrition spécifique pour les ascensions de cols et la haute altitude",
    suitableFor: ["Grimpeurs", "Cyclosportifs en montagne", "Cyclotouristes en régions montagneuses"],
    macroRatio: {
      carbs: 65,
      protein: 20,
      fat: 15
    },
    calorieAdjustment: 1.25,
    hydrationStrategy: {
      beforeRide: "500-750ml dans les 2 heures précédant l'effort",
      duringRide: "750-1000ml par heure (les pertes par respiration sont plus importantes en altitude)",
      electrolytes: "500-800mg de sodium par litre, avec ajout de magnésium pour prévenir les crampes"
    },
    timingStrategies: {
      preworkout: {
        timing: "3 heures avant",
        description: "Repas riche en glucides complexes, modéré en protéines, faible en graisses",
        macroRatio: {
          carbs: 70,
          protein: 20,
          fat: 10
        },
        examples: [
          {
            meal: "Pâtes complètes au poulet",
            description: "100g de pâtes complètes, 100g de blanc de poulet, sauce tomate légère",
            nutrients: {
              calories: 450,
              carbs: 70,
              protein: 30,
              fat: 5
            }
          },
          {
            meal: "Riz basmati et saumon",
            description: "100g de riz basmati, 100g de saumon, légumes vapeur",
            nutrients: {
              calories: 480,
              carbs: 65,
              protein: 30,
              fat: 10
            }
          }
        ]
      },
      duringWorkout: {
        timing: "Avant chaque ascension et régulièrement pendant",
        description: "Apports réguliers en glucides pour maintenir l'énergie sur les longues ascensions",
        macroRatio: {
          carbs: 85,
          protein: 10,
          fat: 5
        },
        examples: [
          {
            food: "Barre énergétique spéciale montagne",
            portion: "1 barre (65g)",
            description: "Enrichie en sodium et magnésium",
            nutrients: {
              calories: 240,
              carbs: 40,
              protein: 8,
              fat: 4
            }
          },
          {
            food: "Mélange de fruits secs et oléagineux",
            portion: "40g",
            description: "Amandes, abricots secs, raisins secs",
            nutrients: {
              calories: 180,
              carbs: 25,
              protein: 5,
              fat: 8
            }
          },
          {
            food: "Gel énergétique avec électrolytes",
            portion: "1 sachet",
            nutrients: {
              calories: 100,
              carbs: 25,
              protein: 0,
              fat: 0
            }
          }
        ],
        strategy: "Alimenter avant les ascensions difficiles. Fractionner les apports toutes les 20-30 minutes pendant les longues montées. Viser 60-90g de glucides par heure."
      },
      postWorkout: {
        timing: "Dans les 30 minutes après la dernière descente",
        description: "Récupération avec ratio glucides/protéines 4:1 et antioxydants pour contrer le stress oxydatif accru en altitude",
        macroRatio: {
          carbs: 70,
          protein: 20,
          fat: 10
        },
        examples: [
          {
            meal: "Shake récupération montagne",
            description: "30g de protéine de whey, 1 banane, 200ml de lait, 15g de poudre de betterave, 1 cuillère de miel",
            nutrients: {
              calories: 380,
              carbs: 55,
              protein: 35,
              fat: 5
            }
          },
          {
            meal: "Salade de quinoa et poulet",
            description: "100g de quinoa cuit, 100g de poulet, légumes variés, vinaigrette légère",
            nutrients: {
              calories: 450,
              carbs: 55,
              protein: 35,
              fat: 10
            }
          }
        ]
      }
    },
    supplementsRecommended: [
      {
        name: "Fer",
        dosage: "À déterminer selon les analyses sanguines",
        timing: "Quotidiennement avec de la vitamine C pour améliorer l'absorption",
        benefits: "Optimisation du transport d'oxygène, particulièrement important en altitude"
      },
      {
        name: "Antioxydants (Vitamines C, E)",
        dosage: "500-1000mg Vit C, 200-400 UI Vit E",
        timing: "Quotidiennement pendant les stages en altitude",
        benefits: "Protection contre le stress oxydatif accru en altitude"
      },
      {
        name: "Magnésium",
        dosage: "300-400mg",
        timing: "Quotidiennement, de préférence le soir",
        benefits: "Prévention des crampes, amélioration de la récupération musculaire"
      }
    ],
    altitudeSpecificRecommendations: {
      mediumAltitude: {
        range: "1000-2000m",
        hydration: "+10-15% par rapport aux besoins habituels",
        carbs: "+5-10% de glucides supplémentaires",
        considerations: "Acclimatation généralement rapide, ajustements mineurs nécessaires"
      },
      highAltitude: {
        range: "2000-3000m",
        hydration: "+15-25% par rapport aux besoins habituels",
        carbs: "+10-15% de glucides supplémentaires",
        considerations: "Acclimatation de 2-3 jours recommandée, hydratation cruciale"
      },
      veryHighAltitude: {
        range: ">3000m",
        hydration: "+25-35% par rapport aux besoins habituels",
        carbs: "+15-20% de glucides supplémentaires",
        considerations: "Acclimatation prolongée nécessaire, risque accru de mal aigu des montagnes"
      }
    }
  }
};

export default nutritionPlans;
