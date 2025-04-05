/**
 * Recettes adaptées aux cyclistes avec valeurs nutritionnelles complètes
 * Organisées par catégorie et moment de consommation
 */

const nutritionRecipes = {
  preRide: [
    {
      id: "pre-1",
      name: "Porridge énergétique aux fruits rouges",
      category: "Petit-déjeuner",
      timing: "2-3 heures avant l'effort",
      prepTime: 10,
      cookTime: 5,
      difficulty: "Facile",
      servings: 1,
      ingredients: [
        "80g de flocons d'avoine",
        "250ml de lait (ou alternative végétale)",
        "100g de fruits rouges (frais ou surgelés)",
        "1 cuillère à soupe de miel",
        "1 cuillère à café de cannelle",
        "10g d'amandes effilées",
        "1 cuillère à soupe de graines de chia"
      ],
      instructions: [
        "Dans une casserole, mélanger les flocons d'avoine et le lait.",
        "Porter à ébullition puis réduire le feu et laisser mijoter 3-5 minutes en remuant.",
        "Retirer du feu et ajouter le miel et la cannelle.",
        "Verser dans un bol et garnir avec les fruits rouges, les amandes et les graines de chia."
      ],
      nutritionalInfo: {
        calories: 490,
        macros: {
          carbs: 75,
          protein: 17,
          fat: 12,
          fiber: 11
        },
        micros: {
          sodium: 120,
          potassium: 650,
          calcium: 300,
          iron: 3.5
        }
      },
      benefits: [
        "Libération progressive d'énergie grâce aux glucides complexes",
        "Bon apport de fibres pour la satiété",
        "Riche en antioxydants grâce aux fruits rouges",
        "Bon apport de protéines pour préserver la masse musculaire"
      ],
      tips: "Préparez la veille et réchauffez le matin pour gagner du temps. Ajustez la quantité de flocons selon l'intensité prévue de votre sortie.",
      image: "porridge.jpg"
    },
    {
      id: "pre-2",
      name: "Pancakes banane et avoine sans gluten",
      category: "Petit-déjeuner",
      timing: "2 heures avant l'effort",
      prepTime: 5,
      cookTime: 10,
      difficulty: "Facile",
      servings: 2,
      ingredients: [
        "1 banane bien mûre",
        "2 œufs",
        "60g de flocons d'avoine moulus (ou farine d'avoine)",
        "120ml de lait d'amande",
        "1 cuillère à café de levure chimique",
        "1 pincée de sel",
        "1 cuillère à café d'extrait de vanille",
        "Huile de coco pour la cuisson"
      ],
      instructions: [
        "Écraser la banane dans un saladier.",
        "Ajouter les œufs et fouetter.",
        "Incorporer les flocons d'avoine moulus, la levure, le sel et la vanille.",
        "Ajouter le lait d'amande progressivement jusqu'à obtenir une pâte fluide.",
        "Chauffer une poêle à feu moyen avec un peu d'huile de coco.",
        "Verser des petites louches de pâte et cuire 2-3 minutes de chaque côté."
      ],
      nutritionalInfo: {
        calories: 380,
        macros: {
          carbs: 55,
          protein: 14,
          fat: 11,
          fiber: 6
        },
        micros: {
          sodium: 320,
          potassium: 550,
          calcium: 200,
          iron: 2
        }
      },
      benefits: [
        "Sans gluten, facile à digérer avant l'effort",
        "Bon équilibre entre glucides complexes et protéines",
        "Apport modéré en fibres pour limiter les problèmes digestifs",
        "Faible index glycémique pour une énergie soutenue"
      ],
      tips: "Servir avec un peu de miel ou de sirop d'érable pour un apport en glucides simples supplémentaires. Peut se préparer à l'avance et se réchauffer.",
      image: "pancakes.jpg"
    },
    {
      id: "pre-3",
      name: "Wrap au poulet et patate douce",
      category: "Repas principal",
      timing: "3 heures avant l'effort",
      prepTime: 15,
      cookTime: 20,
      difficulty: "Moyen",
      servings: 2,
      ingredients: [
        "2 tortillas de blé complet (ou sans gluten)",
        "150g de blanc de poulet",
        "1 patate douce moyenne (environ 200g)",
        "1 cuillère à soupe d'huile d'olive",
        "1 cuillère à café de paprika",
        "1/2 cuillère à café de cumin",
        "1 poignée de roquette",
        "2 cuillères à soupe de yaourt grec",
        "1 cuillère à café de jus de citron",
        "Sel et poivre"
      ],
      instructions: [
        "Préchauffer le four à 200°C.",
        "Couper la patate douce en cubes de 1cm et les mélanger avec l'huile d'olive, le paprika, le cumin, le sel et le poivre.",
        "Disposer sur une plaque de cuisson et cuire 15-20 minutes jusqu'à ce qu'ils soient tendres.",
        "Pendant ce temps, cuire le poulet dans une poêle avec un peu d'huile d'olive, puis le couper en lanières.",
        "Mélanger le yaourt grec avec le jus de citron, le sel et le poivre pour faire une sauce.",
        "Réchauffer les tortillas, puis garnir avec la roquette, le poulet, les cubes de patate douce et la sauce au yaourt.",
        "Rouler les wraps et couper en deux."
      ],
      nutritionalInfo: {
        calories: 420,
        macros: {
          carbs: 45,
          protein: 35,
          fat: 12,
          fiber: 7
        },
        micros: {
          sodium: 550,
          potassium: 820,
          calcium: 150,
          iron: 3
        }
      },
      benefits: [
        "Apport équilibré en macronutriments pour une sortie longue",
        "Patate douce riche en glucides complexes et en potassium",
        "Protéines de haute qualité du poulet pour préserver la masse musculaire",
        "Facile à digérer avec un niveau modéré en fibres et en graisses"
      ],
      tips: "Préparez les ingrédients la veille pour un montage rapide le jour J. Pour les sorties très longues, augmentez la portion de patate douce.",
      image: "wrap.jpg"
    }
  ],
  duringRide: [
    {
      id: "during-1",
      name: "Barres énergétiques maison aux dattes et noix",
      category: "En-cas",
      timing: "Pendant l'effort, toutes les 45-60 minutes",
      prepTime: 15,
      cookTime: 0,
      difficulty: "Facile",
      servings: 8,
      ingredients: [
        "200g de dattes dénoyautées",
        "50g d'amandes",
        "50g de noix de cajou non salées",
        "40g de flocons d'avoine",
        "2 cuillères à soupe de miel",
        "1 cuillère à soupe de beurre d'amande",
        "1 pincée de sel de mer",
        "Zeste d'un citron (optionnel)"
      ],
      instructions: [
        "Faire tremper les dattes dans de l'eau chaude pendant 10 minutes si elles sont sèches, puis égoutter.",
        "Mixer les amandes et les noix de cajou jusqu'à obtenir des morceaux de taille moyenne.",
        "Ajouter les dattes, le miel, le beurre d'amande, le sel et le zeste de citron, puis mixer à nouveau jusqu'à obtenir une pâte collante.",
        "Incorporer les flocons d'avoine et mélanger à la main.",
        "Étaler le mélange dans un moule rectangulaire tapissé de papier cuisson, en pressant fermement.",
        "Réfrigérer pendant au moins 2 heures, puis découper en 8 barres.",
        "Emballer individuellement dans du papier sulfurisé pour faciliter le transport."
      ],
      nutritionalInfo: {
        calories: 180,
        macros: {
          carbs: 32,
          protein: 4,
          fat: 5,
          fiber: 4
        },
        micros: {
          sodium: 20,
          potassium: 240,
          magnesium: 45,
          iron: 1
        }
      },
      benefits: [
        "Mélange idéal de glucides rapides (dattes) et plus lents (flocons d'avoine)",
        "Apport modéré en protéines et acides gras essentiels grâce aux noix",
        "Format compact et pratique pour le transport en poche de maillot",
        "Sans additifs ni conservateurs contrairement aux barres commerciales"
      ],
      tips: "Ces barres se conservent 1 semaine au réfrigérateur et 1 mois au congélateur. Pour les sorties chaudes, ajoutez une pincée de sel supplémentaire.",
      image: "energy_bars.jpg"
    },
    {
      id: "during-2",
      name: "Gâteau de riz énergétique",
      category: "En-cas",
      timing: "Pendant l'effort, pour les sorties longues",
      prepTime: 5,
      cookTime: 20,
      difficulty: "Facile",
      servings: 6,
      ingredients: [
        "150g de riz à risotto",
        "500ml de lait",
        "50g de sucre",
        "1 cuillère à café d'extrait de vanille",
        "Zeste d'orange",
        "1 pincée de sel",
        "30g de raisins secs"
      ],
      instructions: [
        "Dans une casserole, porter à ébullition le lait avec le zeste d'orange et la vanille.",
        "Ajouter le riz et cuire à feu doux pendant 15-20 minutes en remuant régulièrement.",
        "Ajouter le sucre, le sel et les raisins secs, puis cuire encore 2-3 minutes.",
        "Verser dans un moule carré et laisser refroidir complètement.",
        "Découper en 6 portions et emballer individuellement pour le transport."
      ],
      nutritionalInfo: {
        calories: 190,
        macros: {
          carbs: 38,
          protein: 5,
          fat: 2,
          fiber: 1
        },
        micros: {
          sodium: 55,
          potassium: 150,
          calcium: 120,
          iron: 0.5
        }
      },
      benefits: [
        "Très riche en glucides facilement assimilables",
        "Texture moelleuse facile à consommer pendant l'effort",
        "Apport en sodium et potassium pour l'équilibre électrolytique",
        "Peut remplacer les gels énergétiques commerciaux"
      ],
      tips: "Se conserve 2-3 jours au réfrigérateur. Idéal pour les ascensions de cols ou les sorties de plus de 3 heures.",
      image: "rice_cake.jpg"
    }
  ],
  postRide: [
    {
      id: "post-1",
      name: "Smoothie récupération framboise-banane",
      category: "Boisson",
      timing: "Dans les 30 minutes après l'effort",
      prepTime: 5,
      cookTime: 0,
      difficulty: "Facile",
      servings: 1,
      ingredients: [
        "1 banane",
        "100g de framboises (fraîches ou surgelées)",
        "250ml de lait (ou alternative végétale)",
        "30g de protéine de whey (ou protéine végétale)",
        "1 cuillère à soupe de miel",
        "1 cuillère à soupe de graines de chia",
        "Quelques glaçons (optionnel)"
      ],
      instructions: [
        "Placer tous les ingrédients dans un blender.",
        "Mixer jusqu'à obtenir une consistance lisse.",
        "Servir immédiatement."
      ],
      nutritionalInfo: {
        calories: 380,
        macros: {
          carbs: 50,
          protein: 30,
          fat: 6,
          fiber: 8
        },
        micros: {
          sodium: 160,
          potassium: 750,
          calcium: 350,
          iron: 2
        }
      },
      benefits: [
        "Ratio optimal glucides/protéines (5:3) pour la récupération musculaire",
        "Riche en antioxydants grâce aux framboises pour lutter contre l'inflammation",
        "Apport de potassium important pour la récupération neuromusculaire",
        "Facilement digestible et rapidement assimilable"
      ],
      tips: "Consommez dans les 30 minutes suivant l'effort pour maximiser la resynthèse du glycogène. Ajoutez des glaçons pour les sorties par temps chaud.",
      image: "recovery_smoothie.jpg"
    },
    {
      id: "post-2",
      name: "Bowl de récupération au saumon et quinoa",
      category: "Repas principal",
      timing: "1-2 heures après l'effort",
      prepTime: 15,
      cookTime: 20,
      difficulty: "Moyen",
      servings: 2,
      ingredients: [
        "120g de quinoa",
        "200g de filet de saumon",
        "1 avocat",
        "100g d'épinards frais",
        "1 betterave cuite",
        "1 cuillère à soupe d'huile d'olive",
        "1 citron",
        "2 cuillères à soupe de graines de courge",
        "Sel et poivre"
      ],
      instructions: [
        "Rincer le quinoa et le cuire dans 2 fois son volume d'eau salée pendant 15 minutes.",
        "Cuire le saumon au four à 180°C pendant 15 minutes avec un filet d'huile d'olive, du sel et du poivre.",
        "Couper l'avocat et la betterave en dés.",
        "Dresser le bol avec le quinoa, les épinards, le saumon émietté, l'avocat et la betterave.",
        "Arroser d'huile d'olive et de jus de citron, puis parsemer de graines de courge."
      ],
      nutritionalInfo: {
        calories: 580,
        macros: {
          carbs: 45,
          protein: 35,
          fat: 28,
          fiber: 12
        },
        micros: {
          sodium: 320,
          potassium: 1200,
          calcium: 150,
          iron: 6,
          omega3: 2.5
        }
      },
      benefits: [
        "Riche en protéines complètes pour la réparation musculaire",
        "Apport d'acides gras oméga-3 anti-inflammatoires",
        "Charge glycémique modérée pour restaurer les réserves sans pic d'insuline",
        "Riche en antioxydants et nitrates (betterave) pour favoriser la récupération"
      ],
      tips: "Ce repas est idéal après une sortie intense ou longue. Les restes se conservent bien pour le lendemain.",
      image: "salmon_bowl.jpg"
    }
  ],
  colSpecific: [
    {
      id: "col-1",
      name: "Barres énergétiques spéciales cols",
      category: "En-cas",
      timing: "Avant et pendant l'ascension",
      prepTime: 20,
      cookTime: 10,
      difficulty: "Moyen",
      servings: 10,
      ingredients: [
        "150g de dattes dénoyautées",
        "100g de flocons d'avoine",
        "50g de riz soufflé",
        "50g d'amandes effilées",
        "30g de graines de tournesol",
        "2 cuillères à soupe de miel",
        "2 cuillères à soupe de sirop d'érable",
        "30g de beurre",
        "1/2 cuillère à café de sel de mer",
        "1 cuillère à café de gingembre moulu"
      ],
      instructions: [
        "Préchauffer le four à 160°C.",
        "Mixer les dattes jusqu'à obtenir une pâte.",
        "Faire fondre le beurre avec le miel et le sirop d'érable dans une casserole.",
        "Mélanger tous les ingrédients secs dans un grand bol.",
        "Ajouter la pâte de dattes et le mélange de beurre/miel, puis bien mélanger.",
        "Presser fermement le mélange dans un moule rectangulaire tapissé de papier cuisson.",
        "Cuire au four pendant 10 minutes, puis laisser refroidir complètement avant de découper en 10 barres."
      ],
      nutritionalInfo: {
        calories: 200,
        macros: {
          carbs: 30,
          protein: 5,
          fat: 8,
          fiber: 3
        },
        micros: {
          sodium: 120,
          potassium: 220,
          magnesium: 60,
          iron: 1.5
        }
      },
      benefits: [
        "Enrichies en sodium et magnésium pour prévenir les crampes en montée",
        "Mélange de sources de glucides pour une énergie immédiate et soutenue",
        "Texture moins collante que les barres classiques pour faciliter la consommation en effort",
        "Le gingembre aide à réduire les nausées parfois ressenties en altitude"
      ],
      tips: "Ces barres sont spécialement conçues pour résister à la chaleur et fournir des électrolytes. Idéales pour les cols comme l'Alpe d'Huez ou le Tourmalet.",
      colRecommendations: [
        "Ventoux - Consommer aux chalets Reynard",
        "Tourmalet - Idéal à La Mongie",
        "Galibier - Recommandé après le Plan Lachat"
      ],
      image: "col_bars.jpg"
    }
  ]
};

export default nutritionRecipes;
