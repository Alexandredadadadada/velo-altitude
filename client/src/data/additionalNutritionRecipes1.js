/**
 * Recettes additionnelles adaptées aux cyclistes avec valeurs nutritionnelles complètes
 * Partie 1: Recettes avant l'effort (preRide)
 */

const additionalNutritionRecipes1 = {
  preRide: [
    {
      id: "pre-4",
      name: "Bol de smoothie açaï et granola",
      category: "Petit-déjeuner",
      timing: "1-2 heures avant l'effort",
      prepTime: 10,
      cookTime: 0,
      difficulty: "Facile",
      servings: 1,
      ingredients: [
        "100g de pulpe d'açaï congelée",
        "1 banane",
        "100g de fruits rouges congelés",
        "120ml de lait d'amande",
        "40g de granola",
        "1 cuillère à soupe de graines de lin moulues",
        "1 cuillère à café de miel",
        "Garnitures au choix: tranches de banane, baies fraîches, noix de coco râpée"
      ],
      instructions: [
        "Mélanger la pulpe d'açaï, la banane, les fruits rouges et le lait d'amande dans un blender jusqu'à obtenir une texture homogène.",
        "Verser dans un bol.",
        "Saupoudrer le granola et les graines de lin sur le dessus.",
        "Ajouter les garnitures de votre choix et un filet de miel."
      ],
      nutritionalInfo: {
        calories: 410,
        macros: {
          carbs: 68,
          protein: 10,
          fat: 13,
          fiber: 14
        },
        micros: {
          sodium: 80,
          potassium: 780,
          calcium: 250,
          iron: 4
        }
      },
      benefits: [
        "Riche en antioxydants grâce à l'açaï et aux fruits rouges pour réduire l'inflammation",
        "Mélange de glucides rapides et lents pour une énergie immédiate et soutenue",
        "Apport d'acides gras essentiels grâce aux graines de lin",
        "Texture fraîche idéale avant un effort par temps chaud"
      ],
      tips: "Pour les sorties très intenses, ajoutez une cuillère de protéine en poudre et une demi-banane supplémentaire. Préparez tous les ingrédients la veille pour gagner du temps.",
      image: "acai_bowl.jpg"
    },
    {
      id: "pre-5",
      name: "Muffins salés à la patate douce et feta",
      category: "En-cas",
      timing: "1-2 heures avant l'effort",
      prepTime: 15,
      cookTime: 25,
      difficulty: "Moyen",
      servings: 6,
      ingredients: [
        "1 patate douce moyenne (environ 200g)",
        "150g de farine complète",
        "2 œufs",
        "60ml d'huile d'olive",
        "80ml de lait",
        "100g de feta émiettée",
        "2 oignons verts émincés",
        "1 cuillère à café de levure chimique",
        "1/2 cuillère à café de paprika fumé",
        "Sel et poivre"
      ],
      instructions: [
        "Préchauffer le four à 180°C et préparer un moule à muffins.",
        "Peler et couper la patate douce en cubes, puis la faire cuire à la vapeur pendant 10-15 minutes jusqu'à ce qu'elle soit tendre.",
        "Écraser la patate douce en purée et la laisser refroidir.",
        "Dans un bol, mélanger la farine, la levure, le paprika, le sel et le poivre.",
        "Dans un autre bol, battre les œufs avec l'huile et le lait.",
        "Incorporer la purée de patate douce aux ingrédients liquides, puis ajouter les ingrédients secs.",
        "Ajouter la feta et les oignons verts, puis mélanger délicatement.",
        "Répartir la préparation dans le moule à muffins et cuire au four pendant 20-25 minutes."
      ],
      nutritionalInfo: {
        calories: 280,
        macros: {
          carbs: 25,
          protein: 9,
          fat: 16,
          fiber: 3
        },
        micros: {
          sodium: 320,
          potassium: 350,
          calcium: 150,
          iron: 1.8
        }
      },
      benefits: [
        "Format pratique et facile à transporter pour les départs matinaux",
        "Combinaison de glucides complexes et de protéines pour une énergie durable",
        "Riches en bêta-carotène grâce à la patate douce",
        "Apport de sodium naturel (feta) pour prévenir les crampes"
      ],
      tips: "Ces muffins se conservent 3 jours au réfrigérateur et peuvent être congelés. Réchauffez-les rapidement avant de partir ou mangez-les froids. Parfaits pour les départs matinaux en groupe.",
      image: "sweet_potato_muffins.jpg"
    },
    {
      id: "pre-6",
      name: "Chia pudding énergétique cacao-banane",
      category: "Petit-déjeuner",
      timing: "1-2 heures avant l'effort",
      prepTime: 10,
      cookTime: 0,
      difficulty: "Facile",
      servings: 1,
      ingredients: [
        "3 cuillères à soupe de graines de chia",
        "250ml de lait d'amande",
        "1 banane mûre",
        "1 cuillère à soupe de cacao en poudre non sucré",
        "1 cuillère à café de sirop d'érable",
        "1/2 cuillère à café d'extrait de vanille",
        "1 cuillère à soupe de beurre d'amande",
        "Une pincée de sel"
      ],
      instructions: [
        "Mélanger les graines de chia, le lait d'amande, le cacao, le sirop d'érable, la vanille et le sel dans un bol.",
        "Bien mélanger pour éviter les grumeaux de cacao.",
        "Réfrigérer pendant au moins 4 heures ou toute la nuit.",
        "Au moment de servir, écraser la moitié de la banane et l'incorporer au pudding.",
        "Couper l'autre moitié en rondelles pour la garniture.",
        "Ajouter le beurre d'amande et les rondelles de banane sur le dessus."
      ],
      nutritionalInfo: {
        calories: 380,
        macros: {
          carbs: 45,
          protein: 12,
          fat: 18,
          fiber: 16
        },
        micros: {
          sodium: 180,
          potassium: 650,
          calcium: 320,
          iron: 4.5,
          magnesium: 120
        }
      },
      benefits: [
        "Très riche en fibres pour une digestion optimale",
        "Les graines de chia fournissent des acides gras oméga-3 anti-inflammatoires",
        "Faible index glycémique pour une libération constante d'énergie",
        "Le magnésium aide à prévenir les crampes pendant l'effort"
      ],
      tips: "Préparez ce pudding la veille au soir pour un petit-déjeuner rapide. Pour les sorties plus longues, augmentez les quantités de banane et de sirop d'érable pour un apport glucidique supplémentaire.",
      image: "chia_pudding.jpg"
    },
    {
      id: "pre-7",
      name: "Toast à l'avocat et aux œufs brouillés",
      category: "Petit-déjeuner",
      timing: "2 heures avant l'effort",
      prepTime: 10,
      cookTime: 5,
      difficulty: "Facile",
      servings: 1,
      ingredients: [
        "2 tranches de pain complet ou au levain",
        "1 avocat mûr",
        "2 œufs",
        "1 cuillère à café d'huile d'olive",
        "30g de fromage frais",
        "Quelques feuilles d'épinard",
        "1/2 tomate",
        "Jus de citron, sel, poivre",
        "Piment d'Espelette ou paprika (optionnel)"
      ],
      instructions: [
        "Toaster le pain.",
        "Écraser l'avocat dans un bol avec un peu de jus de citron, du sel et du poivre.",
        "Battre les œufs dans un bol et les faire brouiller à feu doux dans une poêle avec l'huile d'olive.",
        "Étaler le fromage frais sur les toasts, puis ajouter les feuilles d'épinard.",
        "Répartir l'avocat écrasé sur les épinards.",
        "Ajouter les œufs brouillés et les tranches de tomate.",
        "Assaisonner avec du sel, du poivre et du piment d'Espelette si désiré."
      ],
      nutritionalInfo: {
        calories: 450,
        macros: {
          carbs: 35,
          protein: 22,
          fat: 25,
          fiber: 9
        },
        micros: {
          sodium: 420,
          potassium: 820,
          calcium: 180,
          iron: 3.5
        }
      },
      benefits: [
        "Équilibre parfait entre protéines, graisses saines et glucides complexes",
        "Les graisses mono-insaturées de l'avocat améliorent l'endurance",
        "Apport protéique optimal pour préserver les muscles pendant l'effort",
        "Riche en potassium pour prévenir les crampes"
      ],
      tips: "Pour les sorties très longues, ajoutez une tranche de pain supplémentaire ou accompagnez d'un fruit pour augmenter l'apport en glucides. Si vous partez tôt, préparez les œufs la veille et réchauffez-les rapidement.",
      image: "avocado_toast.jpg"
    },
    {
      id: "pre-8",
      name: "Bowl de riz au poulet et légumes",
      category: "Repas principal",
      timing: "3-4 heures avant l'effort",
      prepTime: 15,
      cookTime: 25,
      difficulty: "Moyen",
      servings: 2,
      ingredients: [
        "150g de riz basmati",
        "200g de blanc de poulet",
        "1 courgette",
        "1 carotte",
        "1 poivron rouge",
        "1 oignon",
        "2 gousses d'ail",
        "2 cuillères à soupe d'huile d'olive",
        "1 cuillère à café de curcuma",
        "1/2 cuillère à café de gingembre moulu",
        "Sauce soja à faible teneur en sodium",
        "Jus d'un demi-citron",
        "Coriandre fraîche (facultatif)"
      ],
      instructions: [
        "Cuire le riz selon les instructions du paquet.",
        "Couper le poulet en dés et les légumes en julienne.",
        "Dans une poêle, faire revenir l'oignon et l'ail dans l'huile d'olive.",
        "Ajouter le poulet et cuire jusqu'à ce qu'il soit doré.",
        "Ajouter les légumes, le curcuma et le gingembre, et cuire 5-7 minutes.",
        "Incorporer le riz cuit, arroser de sauce soja et de jus de citron.",
        "Mélanger et servir, garni de coriandre fraîche si désirée."
      ],
      nutritionalInfo: {
        calories: 480,
        macros: {
          carbs: 60,
          protein: 30,
          fat: 14,
          fiber: 6
        },
        micros: {
          sodium: 280,
          potassium: 750,
          calcium: 60,
          iron: 2.5
        }
      },
      benefits: [
        "Apport élevé en glucides complexes pour charger les réserves de glycogène",
        "Bonne source de protéines maigres pour préserver la masse musculaire",
        "Le curcuma et le gingembre ont des propriétés anti-inflammatoires",
        "Faible en fibres pour minimiser les risques de troubles digestifs pendant l'effort"
      ],
      tips: "Idéal comme repas de veille pour une compétition ou une sortie longue. Vous pouvez préparer une plus grande quantité et la conserver jusqu'à deux jours au réfrigérateur. Servez chaud ou froid selon vos préférences.",
      image: "chicken_rice_bowl.jpg"
    },
    {
      id: "pre-9",
      name: "Crêpes salées aux légumes et fromage",
      category: "Repas principal",
      timing: "2-3 heures avant l'effort",
      prepTime: 15,
      cookTime: 25,
      difficulty: "Moyen",
      servings: 2,
      ingredients: [
        "Pour la pâte: 150g de farine, 2 œufs, 300ml de lait, 1 cuillère à soupe d'huile, sel",
        "100g d'épinards frais",
        "1 poivron rouge",
        "1 oignon",
        "100g de champignons",
        "120g de fromage râpé (comté ou emmental)",
        "2 cuillères à soupe d'huile d'olive",
        "1 cuillère à café d'herbes de Provence",
        "Sel et poivre"
      ],
      instructions: [
        "Préparer la pâte à crêpes en mélangeant la farine, les œufs, le lait, l'huile et le sel. Laisser reposer 30 minutes.",
        "Pendant ce temps, émincer l'oignon et le poivron, et couper les champignons en lamelles.",
        "Faire revenir les légumes dans l'huile d'olive avec les herbes, le sel et le poivre.",
        "Ajouter les épinards en fin de cuisson et laisser flétrir 1-2 minutes.",
        "Cuire les crêpes dans une poêle légèrement huilée.",
        "Garnir chaque crêpe de légumes et parsemer de fromage râpé.",
        "Plier les crêpes en carrés ou les rouler."
      ],
      nutritionalInfo: {
        calories: 550,
        macros: {
          carbs: 50,
          protein: 25,
          fat: 28,
          fiber: 5
        },
        micros: {
          sodium: 650,
          potassium: 550,
          calcium: 450,
          iron: 4
        }
      },
      benefits: [
        "Bon équilibre entre protéines et glucides pour une énergie durable",
        "Le calcium du fromage contribue à la santé osseuse et à la fonction musculaire",
        "Les légumes fournissent des vitamines essentielles et des antioxydants",
        "Repas satiétant mais pas trop lourd avant l'effort"
      ],
      tips: "La pâte à crêpes peut être préparée la veille. Pour une version plus légère, limitez la quantité de fromage ou optez pour une version allégée. Ce plat convient parfaitement avant une sortie d'intensité moyenne.",
      image: "savory_crepes.jpg"
    }
  ]
};

export default additionalNutritionRecipes1;
