/**
 * Recettes additionnelles adaptées aux cyclistes avec valeurs nutritionnelles complètes
 * Partie 2: Recettes pendant l'effort (duringRide)
 */

const additionalNutritionRecipes2 = {
  duringRide: [
    {
      id: "during-3",
      name: "Bouchées énergétiques datte-coco",
      category: "En-cas",
      timing: "Pendant l'effort, toutes les 30-45 minutes",
      prepTime: 15,
      cookTime: 0,
      difficulty: "Facile",
      servings: 10,
      ingredients: [
        "200g de dattes Medjool dénoyautées",
        "50g de flocons d'avoine",
        "30g de noix de coco râpée",
        "2 cuillères à soupe de sirop d'érable",
        "1 cuillère à soupe d'huile de coco",
        "1 pincée de sel de mer",
        "1/2 cuillère à café d'extrait de vanille",
        "30g de noix de coco râpée pour l'enrobage"
      ],
      instructions: [
        "Placer les dattes, les flocons d'avoine, la noix de coco râpée, le sirop d'érable, l'huile de coco, le sel et la vanille dans un robot culinaire.",
        "Mixer jusqu'à obtenir une pâte homogène et collante.",
        "Former des boules de la taille d'une bouchée (environ 25g chacune).",
        "Rouler les boules dans la noix de coco râpée pour l'enrobage.",
        "Réfrigérer au moins 1 heure avant de les emballer individuellement."
      ],
      nutritionalInfo: {
        calories: 120,
        macros: {
          carbs: 22,
          protein: 1.5,
          fat: 3.5,
          fiber: 2.5
        },
        micros: {
          sodium: 50,
          potassium: 180,
          magnesium: 15,
          iron: 0.6
        }
      },
      benefits: [
        "Format pratique qui tient dans la poche de maillot",
        "Apport rapide en glucides simples grâce aux dattes",
        "Les lipides de la noix de coco fournissent une énergie durable",
        "Faciles à consommer même pendant un effort intense"
      ],
      tips: "Ces bouchées se conservent jusqu'à 2 semaines au réfrigérateur et 3 mois au congélateur. Pour les sorties chaudes, conservez-les dans un sac isotherme pour éviter qu'elles ne ramollissent trop.",
      image: "coconut_date_bites.jpg"
    },
    {
      id: "during-4",
      name: "Gaufres de patate douce salées",
      category: "En-cas",
      timing: "Pendant l'effort, pour les sorties longues",
      prepTime: 15,
      cookTime: 20,
      difficulty: "Moyen",
      servings: 6,
      ingredients: [
        "300g de patate douce cuite et écrasée",
        "150g de farine de riz",
        "2 œufs",
        "100ml de lait",
        "2 cuillères à soupe d'huile d'olive",
        "1 cuillère à café de levure chimique",
        "1/2 cuillère à café de sel",
        "1 cuillère à café de romarin séché (optionnel)",
        "Huile de cuisson pour le gaufrier"
      ],
      instructions: [
        "Préchauffer le gaufrier.",
        "Dans un grand bol, mélanger la purée de patate douce, les œufs, le lait et l'huile d'olive.",
        "Dans un autre bol, mélanger la farine de riz, la levure, le sel et le romarin.",
        "Incorporer les ingrédients secs aux ingrédients humides et mélanger jusqu'à obtention d'une pâte homogène.",
        "Huiler légèrement le gaufrier et verser environ 1/4 tasse de pâte par gaufre.",
        "Cuire jusqu'à ce que les gaufres soient dorées et croustillantes (environ 3-4 minutes).",
        "Laisser refroidir avant de les emballer individuellement."
      ],
      nutritionalInfo: {
        calories: 200,
        macros: {
          carbs: 32,
          protein: 5,
          fat: 6,
          fiber: 3
        },
        micros: {
          sodium: 220,
          potassium: 300,
          calcium: 55,
          iron: 1.2
        }
      },
      benefits: [
        "Alternative salée aux en-cas sucrés traditionnels",
        "La patate douce offre des glucides complexes pour une énergie soutenue",
        "Texture facile à mâcher pendant l'effort",
        "Sans gluten, adaptées aux cyclistes sensibles"
      ],
      tips: "Ces gaufres sont une excellente alternative aux barres énergétiques commerciales. Elles se conservent 2 jours à température ambiante et jusqu'à 3 mois au congélateur. Pour plus de saveur, ajoutez des herbes fraîches ou du parmesan râpé à la pâte.",
      image: "sweet_potato_waffles.jpg"
    },
    {
      id: "during-5",
      name: "Gel énergétique maison aux agrumes",
      category: "En-cas",
      timing: "Pendant l'effort, toutes les 45-60 minutes",
      prepTime: 10,
      cookTime: 5,
      difficulty: "Facile",
      servings: 4,
      ingredients: [
        "200ml de jus d'orange fraîchement pressé",
        "100ml de jus de citron",
        "80g de miel",
        "40g de sucre",
        "10g de sel",
        "15g de maïzena (ou fécule de maïs)",
        "1/2 cuillère à café de gingembre moulu (optionnel)"
      ],
      instructions: [
        "Mélanger la maïzena avec une petite quantité de jus d'orange pour former une pâte lisse.",
        "Dans une casserole, mélanger le reste du jus d'orange, le jus de citron, le miel, le sucre et le sel.",
        "Porter à ébullition à feu moyen, puis réduire le feu.",
        "Ajouter le mélange de maïzena en fouettant constamment.",
        "Continuer à cuire à feu doux pendant 1-2 minutes jusqu'à épaississement.",
        "Retirer du feu et ajouter le gingembre si désiré.",
        "Laisser refroidir légèrement puis verser dans des flacons de gel réutilisables."
      ],
      nutritionalInfo: {
        calories: 125,
        macros: {
          carbs: 30,
          protein: 0.5,
          fat: 0,
          fiber: 0.5
        },
        micros: {
          sodium: 600,
          potassium: 150,
          magnesium: 10,
          vitamin_c: 45
        }
      },
      benefits: [
        "Alternative économique et naturelle aux gels du commerce",
        "Équilibre parfait entre glucides simples et électrolytes",
        "Apport rapide d'énergie facilement digestible",
        "La vitamine C des agrumes contribue à réduire le stress oxydatif pendant l'effort"
      ],
      tips: "Ces gels se conservent jusqu'à 1 semaine au réfrigérateur. Utilisez des flacons à gel réutilisables pour une solution écologique. Pour les efforts en conditions chaudes, doublez la quantité de sel pour prévenir l'hyponatrémie.",
      image: "citrus_gel.jpg"
    },
    {
      id: "during-6",
      name: "Mini-wraps énergétiques jambon-miel",
      category: "En-cas",
      timing: "Pendant l'effort, pour les sorties très longues",
      prepTime: 10,
      cookTime: 0,
      difficulty: "Facile",
      servings: 4,
      ingredients: [
        "4 petites tortillas de blé (diamètre 15cm)",
        "4 tranches fines de jambon",
        "60g de fromage à tartiner",
        "2 cuillères à soupe de miel",
        "1 cuillère à café de moutarde douce",
        "1 pincée de sel"
      ],
      instructions: [
        "Étaler une fine couche de fromage à tartiner sur chaque tortilla.",
        "Mélanger le miel, la moutarde et le sel dans un petit bol.",
        "Répartir le mélange miel-moutarde sur le fromage.",
        "Placer une tranche de jambon sur chaque tortilla.",
        "Rouler fermement chaque tortilla et l'envelopper dans du papier sulfurisé ou du film alimentaire.",
        "Couper chaque rouleau en 2 ou 3 portions de la taille d'une bouchée avant de partir."
      ],
      nutritionalInfo: {
        calories: 220,
        macros: {
          carbs: 30,
          protein: 10,
          fat: 7,
          fiber: 1
        },
        micros: {
          sodium: 580,
          potassium: 130,
          calcium: 100,
          iron: 1.5
        }
      },
      benefits: [
        "Apporte des protéines et des glucides, idéal pour les efforts de plus de 3 heures",
        "Le goût salé aide à stimuler l'appétit pendant l'effort prolongé",
        "Format facile à manger d'une seule main sur le vélo",
        "Combine glucides rapides (miel) et énergie soutenue (tortilla, jambon)"
      ],
      tips: "Ces mini-wraps sont parfaits pour éviter la lassitude des aliments sucrés pendant les sorties très longues. Ils se conservent 24 heures au réfrigérateur. Pour les végétariens, remplacez le jambon par des tranches d'avocat ou du houmous.",
      image: "ham_honey_wraps.jpg"
    },
    {
      id: "during-7",
      name: "Boisson d'effort maison aux fruits rouges",
      category: "Boisson",
      timing: "Pendant l'effort, en continu",
      prepTime: 10,
      cookTime: 5,
      difficulty: "Facile",
      servings: 4,
      ingredients: [
        "1 litre d'eau",
        "100g de fruits rouges mixtes (frais ou surgelés)",
        "60g de sucre",
        "40g de maltodextrine (disponible en magasin de nutrition sportive)",
        "3g de sel",
        "Le jus d'un citron",
        "1/2 cuillère à café de gingembre moulu (optionnel)"
      ],
      instructions: [
        "Faire chauffer 200ml d'eau avec le sucre jusqu'à dissolution complète.",
        "Ajouter les fruits rouges et porter à ébullition pendant 1 minute.",
        "Retirer du feu et laisser infuser 5 minutes.",
        "Filtrer le mélange pour retirer les morceaux de fruits.",
        "Ajouter le reste de l'eau, la maltodextrine, le sel, le jus de citron et le gingembre.",
        "Mélanger vigoureusement jusqu'à dissolution complète de la maltodextrine.",
        "Laisser refroidir et verser dans des bidons."
      ],
      nutritionalInfo: {
        calories: 120,
        macros: {
          carbs: 30,
          protein: 0,
          fat: 0,
          fiber: 0
        },
        micros: {
          sodium: 750,
          potassium: 85,
          magnesium: 15,
          vitamin_c: 15
        }
      },
      benefits: [
        "Ratio optimal d'eau, d'électrolytes et de glucides pour une hydratation efficace",
        "Mélange de sucres simples et complexes (maltodextrine) pour une énergie immédiate et soutenue",
        "Apport d'électrolytes pour prévenir les crampes et maintenir l'équilibre hydrique",
        "Le gingembre peut aider à réduire les inconforts digestifs pendant l'effort"
      ],
      tips: "Cette boisson se conserve 48 heures au réfrigérateur. Ajustez la concentration en sucre selon l'intensité de l'effort et la température extérieure. Pour les efforts de plus de 3 heures, augmentez légèrement la teneur en sel.",
      image: "berry_drink.jpg"
    },
    {
      id: "during-8",
      name: "Bouchées de riz gluant au parmesan",
      category: "En-cas",
      timing: "Pendant l'effort, toutes les 45-60 minutes",
      prepTime: 20,
      cookTime: 20,
      difficulty: "Moyen",
      servings: 8,
      ingredients: [
        "200g de riz à sushi",
        "300ml d'eau",
        "50g de parmesan râpé",
        "2 cuillères à soupe d'huile d'olive",
        "1 cuillère à café de sel",
        "1/2 cuillère à café de poivre noir",
        "1 cuillère à café d'herbes de Provence",
        "Papier d'aluminium pour l'emballage"
      ],
      instructions: [
        "Rincer le riz jusqu'à ce que l'eau soit claire.",
        "Cuire le riz avec l'eau selon les instructions du paquet.",
        "Une fois cuit, incorporer le parmesan, l'huile d'olive, le sel, le poivre et les herbes.",
        "Mélanger énergiquement jusqu'à ce que le riz devienne collant.",
        "Former des boules de la taille d'une balle de golf.",
        "Laisser refroidir complètement.",
        "Emballer individuellement dans du papier d'aluminium."
      ],
      nutritionalInfo: {
        calories: 150,
        macros: {
          carbs: 25,
          protein: 5,
          fat: 4,
          fiber: 0.5
        },
        micros: {
          sodium: 300,
          potassium: 60,
          calcium: 80,
          iron: 0.5
        }
      },
      benefits: [
        "Alternative salée aux en-cas sucrés pour éviter la lassitude gustative",
        "Le riz fournit des glucides rapidement assimilables",
        "Apport de protéines et de sodium grâce au parmesan",
        "Texture moelleuse facile à manger pendant l'effort"
      ],
      tips: "Ces bouchées de riz s'inspirent des onigiri japonais et sont très populaires chez les cyclistes professionnels. Elles se conservent 24 heures à température ambiante. Pour une variante, remplacez le parmesan par du thon en conserve émietté.",
      image: "rice_bites.jpg"
    }
  ]
};

export default additionalNutritionRecipes2;
