/**
 * Base de données des recettes de petit-déjeuner pour cyclistes
 * Optimisées pour différentes phases d'entraînement et types d'efforts
 */

const breakfastRecipes = [
  {
    id: 'brkfst-1',
    name: 'Porridge à l\'avoine et aux fruits rouges',
    description: 'Un petit-déjeuner équilibré riche en glucides complexes pour commencer la journée avec de l\'énergie, idéal avant une sortie longue.',
    image: '/images/recipes/porridge-fruits-rouges.jpg',
    mealType: 'breakfast',
    difficulty: 'easy',
    prepTimeMinutes: 10,
    cookTimeMinutes: 5,
    servings: 1,
    ingredients: [
      '60g de flocons d\'avoine',
      '250ml de lait (vache, amande ou avoine)',
      '1 banane mûre écrasée',
      '1 c. à soupe de miel',
      '100g de fruits rouges (fraises, framboises, myrtilles)',
      '1 c. à soupe de graines de chia',
      '15g d\'amandes effilées'
    ],
    instructions: [
      'Dans une casserole, mélanger les flocons d\'avoine et le lait.',
      'Porter à ébullition, puis réduire le feu et laisser mijoter pendant 4-5 minutes en remuant régulièrement.',
      'Ajouter la banane écrasée et le miel, bien mélanger.',
      'Verser dans un bol et garnir de fruits rouges, graines de chia et amandes effilées.'
    ],
    nutritionalInfo: {
      calories: 505,
      protein: 15,
      carbs: 78,
      fat: 15,
      fiber: 11,
      sugar: 35
    },
    dietaryPreferences: ['vegetarian'],
    nutrientFocus: 'balanced',
    recommendedFor: {
      trainingPhases: ['base', 'build'],
      effortTypes: ['long-ride', 'moderate-intensity'],
      timeOfDay: 'morning'
    },
    tips: 'Préparable la veille en version overnight oats pour gagner du temps le matin. Ajoutez une cuillère de protéine en poudre pour augmenter l\'apport protéique.',
    variations: [
      'Version salée: remplacez les fruits par des œufs brouillés et de l\'avocat',
      'Version protéinée: ajoutez du skyr ou du fromage blanc'
    ]
  },
  {
    id: 'brkfst-2',
    name: 'Omelette protéinée aux légumes',
    description: 'Une option riche en protéines pour favoriser la récupération musculaire, idéale pour les jours de repos ou après une séance intense.',
    image: '/images/recipes/omelette-legumes.jpg',
    mealType: 'breakfast',
    difficulty: 'medium',
    prepTimeMinutes: 10,
    cookTimeMinutes: 8,
    servings: 1,
    ingredients: [
      '3 œufs (ou 1 œuf entier + 3 blancs d\'œufs)',
      '50g de champignons émincés',
      '1/2 poivron rouge coupé en dés',
      '30g d\'épinards frais',
      '30g de fromage feta émiettée',
      '1 c. à café d\'huile d\'olive',
      'Sel, poivre, herbes de Provence'
    ],
    instructions: [
      'Battre les œufs dans un bol, assaisonner avec sel et poivre.',
      'Chauffer l\'huile dans une poêle antiadhésive à feu moyen.',
      'Faire revenir les champignons et le poivron pendant 3 minutes.',
      'Ajouter les épinards et laisser flétrir 1 minute.',
      'Verser les œufs battus et cuire à feu doux en ramenant les bords vers le centre.',
      'Quand l\'omelette est presque cuite, parsemer de feta et replier en deux.',
      'Servir immédiatement.'
    ],
    nutritionalInfo: {
      calories: 320,
      protein: 28,
      carbs: 7,
      fat: 21,
      fiber: 3,
      sugar: 4
    },
    dietaryPreferences: ['gluten-free', 'high-protein'],
    nutrientFocus: 'high-protein',
    recommendedFor: {
      trainingPhases: ['recovery', 'build'],
      effortTypes: ['high-intensity', 'recovery-day'],
      timeOfDay: 'morning'
    },
    tips: 'Accompagnez d\'une tranche de pain complet pour augmenter l\'apport en glucides si c\'est un jour d\'entraînement.',
    variations: [
      'Ajoutez 80g de patates douces sautées pour plus de glucides avant une sortie',
      'Remplacez la feta par du fromage de chèvre pour une variante plus douce'
    ]
  },
  {
    id: 'brkfst-3',
    name: 'Smoothie bowl énergétique',
    description: 'Un petit-déjeuner rafraîchissant riche en glucides naturels, antioxydants et fibres. Parfait avant une sortie d\'intensité moyenne à élevée.',
    image: '/images/recipes/smoothie-bowl.jpg',
    mealType: 'breakfast',
    difficulty: 'easy',
    prepTimeMinutes: 10,
    cookTimeMinutes: 0,
    servings: 1,
    ingredients: [
      '1 banane congelée',
      '150g de mangue congelée',
      '100ml de lait d\'amande',
      '100g de yaourt grec',
      '1 c. à soupe de beurre d\'amande',
      'Garnitures: 1 c. à soupe de granola, baies fraîches, graines de chia'
    ],
    instructions: [
      'Placer la banane et la mangue congelées dans un mixeur.',
      'Ajouter le lait d\'amande, le yaourt grec et le beurre d\'amande.',
      'Mixer jusqu\'à obtenir une consistance lisse et crémeuse.',
      'Verser dans un bol et garnir de granola, baies fraîches et graines de chia.'
    ],
    nutritionalInfo: {
      calories: 450,
      protein: 15,
      carbs: 65,
      fat: 16,
      fiber: 9,
      sugar: 42
    },
    dietaryPreferences: ['vegetarian'],
    nutrientFocus: 'high-carb',
    recommendedFor: {
      trainingPhases: ['build', 'peak'],
      effortTypes: ['moderate-intensity', 'high-intensity'],
      timeOfDay: 'morning'
    },
    tips: 'Consommez 1h30 à 2h avant l\'entraînement pour permettre une bonne digestion.',
    variations: [
      'Version post-entraînement: ajoutez une portion de protéine en poudre',
      'Version pré-compétition: augmentez les fruits et réduisez les matières grasses'
    ]
  },
  {
    id: 'brkfst-4',
    name: 'Pancakes protéinés à la banane',
    description: 'Des pancakes moelleux et savoureux, riches en protéines et glucides complexes. Idéals pour le petit-déjeuner d\'un jour de compétition ou d\'entraînement long.',
    image: '/images/recipes/pancakes-proteines.jpg',
    mealType: 'breakfast',
    difficulty: 'medium',
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    servings: 2,
    ingredients: [
      '100g de flocons d\'avoine mixés en farine',
      '1 banane bien mûre',
      '2 œufs',
      '150g de fromage blanc 0%',
      '1 c. à café de levure chimique',
      '1 c. à café de vanille liquide',
      '1 pincée de sel',
      'Fruits frais et miel pour servir'
    ],
    instructions: [
      'Mixer les flocons d\'avoine pour obtenir une farine fine.',
      'Dans un bol, écraser la banane à la fourchette puis ajouter les œufs et le fromage blanc.',
      'Ajouter la farine d\'avoine, la levure, la vanille et le sel. Bien mélanger.',
      'Chauffer une poêle antiadhésive à feu moyen.',
      'Déposer des cuillerées de pâte et cuire 2-3 minutes de chaque côté.',
      'Servir avec des fruits frais et un filet de miel.'
    ],
    nutritionalInfo: {
      calories: 380,
      protein: 23,
      carbs: 55,
      fat: 8,
      fiber: 7,
      sugar: 20
    },
    dietaryPreferences: ['vegetarian', 'high-protein'],
    nutrientFocus: 'balanced',
    recommendedFor: {
      trainingPhases: ['build', 'peak'],
      effortTypes: ['long-ride', 'race-day'],
      timeOfDay: 'morning'
    },
    tips: 'Préparation idéale 2-3h avant une compétition. Pour augmenter l\'apport calorique, ajoutez du beurre d\'amande.',
    variations: [
      'Ajoutez des myrtilles ou des pépites de chocolat noir dans la pâte',
      'Version salée: retirez la banane et la vanille, ajoutez des herbes et du fromage'
    ]
  },
  {
    id: 'brkfst-5',
    name: 'Toast à l\'avocat et aux œufs pochés',
    description: 'Un petit-déjeuner complet apportant des graisses saines, des protéines et des glucides complexes. Parfait pour un jour d\'entraînement modéré.',
    image: '/images/recipes/toast-avocat-oeuf.jpg',
    mealType: 'breakfast',
    difficulty: 'medium',
    prepTimeMinutes: 10,
    cookTimeMinutes: 5,
    servings: 1,
    ingredients: [
      '2 tranches de pain complet ou au levain',
      '1/2 avocat mûr',
      '2 œufs',
      'Quelques feuilles d\'épinard',
      '1 c. à café de jus de citron',
      'Flocons de piment rouge (facultatif)',
      'Sel et poivre'
    ],
    instructions: [
      'Porter à ébullition une casserole d\'eau, réduire le feu et ajouter un filet de vinaigre.',
      'Casser les œufs dans l\'eau frémissante et pocher pendant 3 minutes.',
      'Pendant ce temps, faire griller les tranches de pain.',
      'Écraser l\'avocat avec le jus de citron, du sel et du poivre.',
      'Étaler l\'avocat sur les toasts, disposer les épinards puis les œufs pochés.',
      'Assaisonner et saupoudrer de flocons de piment si désiré.'
    ],
    nutritionalInfo: {
      calories: 410,
      protein: 19,
      carbs: 30,
      fat: 25,
      fiber: 8,
      sugar: 3
    },
    dietaryPreferences: ['vegetarian'],
    nutrientFocus: 'balanced',
    recommendedFor: {
      trainingPhases: ['base', 'build'],
      effortTypes: ['moderate-intensity', 'technique-session'],
      timeOfDay: 'morning'
    },
    tips: 'Les graisses saines de l\'avocat ralentissent la digestion, consommez ce repas au moins 2h avant l\'effort.',
    variations: [
      'Ajoutez du saumon fumé pour plus de protéines et d\'oméga-3',
      'Version vegan: remplacez les œufs par du tofu brouillé assaisonné au curcuma'
    ]
  },
  {
    id: 'brkfst-6',
    name: 'Bol de riz au lait protéiné',
    description: 'Un petit-déjeuner riche en glucides complexes et en protéines, idéal pour les matins froids ou avant une sortie longue à intensité modérée.',
    image: '/images/recipes/riz-au-lait-proteine.jpg',
    mealType: 'breakfast',
    difficulty: 'easy',
    prepTimeMinutes: 5,
    cookTimeMinutes: 20,
    servings: 2,
    ingredients: [
      '100g de riz rond spécial dessert',
      '400ml de lait demi-écrémé',
      '100ml de lait de coco',
      '1 scoop de protéine en poudre vanille (30g)',
      '1 c. à soupe de miel ou sirop d\'érable',
      '1/2 c. à café de cannelle',
      'Garniture: fruits secs, noix, fruits frais'
    ],
    instructions: [
      'Rincer le riz à l\'eau froide.',
      'Dans une casserole, verser le lait et le lait de coco, ajouter le riz.',
      'Porter à ébullition puis réduire à feu doux et laisser mijoter 15-20 minutes en remuant régulièrement.',
      'Hors du feu, incorporer la protéine en poudre, le miel et la cannelle.',
      'Servir tiède ou froid, garni de fruits secs, noix et fruits frais.'
    ],
    nutritionalInfo: {
      calories: 390,
      protein: 22,
      carbs: 55,
      fat: 12,
      fiber: 2,
      sugar: 18
    },
    dietaryPreferences: ['vegetarian', 'high-carb'],
    nutrientFocus: 'high-carb',
    recommendedFor: {
      trainingPhases: ['base', 'build'],
      effortTypes: ['long-ride', 'endurance-session'],
      timeOfDay: 'morning'
    },
    tips: 'Préparez-le la veille et réchauffez-le simplement le matin pour gagner du temps.',
    variations: [
      'Remplacez le riz par du quinoa pour augmenter l\'apport protéique',
      'Version chocolatée: utilisez de la protéine au chocolat et ajoutez du cacao'
    ]
  },
  {
    id: 'brkfst-7',
    name: 'Pain perdu protéiné',
    description: 'Une version revisitée du pain perdu, enrichie en protéines et moins sucrée. Parfait pour un petit-déjeuner gourmand avant une sortie modérée.',
    image: '/images/recipes/pain-perdu-proteine.jpg',
    mealType: 'breakfast',
    difficulty: 'easy',
    prepTimeMinutes: 5,
    cookTimeMinutes: 10,
    servings: 1,
    ingredients: [
      '2 tranches de pain complet ou de brioche légère',
      '2 œufs',
      '100ml de lait',
      '1 scoop de protéine vanille (30g)',
      '1/4 c. à café de cannelle',
      '1 c. à café d\'huile de coco pour la cuisson',
      'Garniture: fruits frais, yaourt grec, sirop d\'érable léger'
    ],
    instructions: [
      'Dans un bol large, mélanger les œufs, le lait, la protéine en poudre et la cannelle.',
      'Tremper les tranches de pain dans ce mélange en les laissant bien s\'imbiber.',
      'Chauffer l\'huile de coco dans une poêle à feu moyen-vif.',
      'Cuire les tranches de pain 2-3 minutes de chaque côté jusqu\'à ce qu\'elles soient dorées.',
      'Servir avec des fruits frais, un peu de yaourt grec et un filet de sirop d\'érable.'
    ],
    nutritionalInfo: {
      calories: 440,
      protein: 36,
      carbs: 40,
      fat: 16,
      fiber: 5,
      sugar: 15
    },
    dietaryPreferences: ['vegetarian', 'high-protein'],
    nutrientFocus: 'balanced',
    recommendedFor: {
      trainingPhases: ['build', 'peak'],
      effortTypes: ['moderate-intensity', 'strength-session'],
      timeOfDay: 'morning'
    },
    tips: 'Consommez 1h30-2h avant l\'effort pour permettre une digestion adéquate.',
    variations: [
      'Version gourmande: ajoutez des pépites de chocolat noir dans la pâte',
      'Version salée: retirez la cannelle et la protéine, ajoutez des herbes et du fromage'
    ]
  },
  {
    id: 'brkfst-8',
    name: 'Bol de quinoa sucré aux fruits',
    description: 'Un petit-déjeuner riche en protéines végétales et en glucides complexes, idéal pour les cyclistes végétariens ou végans.',
    image: '/images/recipes/quinoa-bowl.jpg',
    mealType: 'breakfast',
    difficulty: 'medium',
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    servings: 2,
    ingredients: [
      '100g de quinoa',
      '300ml de lait végétal (amande, avoine)',
      '1 c. à café d\'extrait de vanille',
      '1 c. à soupe de sirop d\'érable',
      '1 c. à café de cannelle',
      '30g d\'amandes effilées',
      'Fruits frais de saison (banane, fruits rouges)',
      '1 c. à soupe de beurre d\'amande'
    ],
    instructions: [
      'Rincer le quinoa à l\'eau froide.',
      'Dans une casserole, porter à ébullition le lait végétal puis ajouter le quinoa.',
      'Réduire le feu, couvrir et laisser mijoter 12-15 minutes jusqu\'à absorption du liquide.',
      'Incorporer la vanille, le sirop d\'érable et la cannelle.',
      'Servir dans un bol, garnir de fruits frais, d\'amandes effilées et d\'une cuillère de beurre d\'amande.'
    ],
    nutritionalInfo: {
      calories: 380,
      protein: 14,
      carbs: 52,
      fat: 15,
      fiber: 7,
      sugar: 16
    },
    dietaryPreferences: ['vegetarian', 'vegan', 'gluten-free'],
    nutrientFocus: 'balanced',
    recommendedFor: {
      trainingPhases: ['base', 'build'],
      effortTypes: ['endurance-session', 'moderate-intensity'],
      timeOfDay: 'morning'
    },
    tips: 'Préparez une grande quantité de quinoa cuit la veille pour gagner du temps le matin.',
    variations: [
      'Version salée: utilisez du bouillon au lieu du lait et ajoutez des légumes et des épices',
      'Version protéinée: ajoutez une cuillère de protéine en poudre après cuisson'
    ]
  },
  {
    id: 'brkfst-9',
    name: 'Wrap d\'œufs et légumes',
    description: 'Un petit-déjeuner salé, pratique à emporter et riche en protéines, idéal avant une séance d\'entraînement ou une sortie matinale.',
    image: '/images/recipes/wrap-oeufs-legumes.jpg',
    mealType: 'breakfast',
    difficulty: 'medium',
    prepTimeMinutes: 10,
    cookTimeMinutes: 10,
    servings: 1,
    ingredients: [
      '1 grande tortilla complète',
      '2 œufs',
      '30g d\'épinards frais',
      '1/4 d\'avocat tranché',
      '30g de poivron rouge en lanières',
      '20g de fromage râpé',
      'Sel, poivre, paprika'
    ],
    instructions: [
      'Battre les œufs avec du sel, du poivre et du paprika.',
      'Dans une poêle antiadhésive, faire revenir le poivron 2 minutes.',
      'Ajouter les épinards et laisser flétrir.',
      'Verser les œufs et cuire comme une omelette fine.',
      'Chauffer brièvement la tortilla dans une poêle sèche.',
      'Étaler l\'avocat sur la tortilla, ajouter l\'omelette aux légumes et parsemer de fromage.',
      'Rouler serré et couper en deux.'
    ],
    nutritionalInfo: {
      calories: 390,
      protein: 24,
      carbs: 30,
      fat: 21,
      fiber: 7,
      sugar: 3
    },
    dietaryPreferences: ['vegetarian'],
    nutrientFocus: 'high-protein',
    recommendedFor: {
      trainingPhases: ['build', 'peak'],
      effortTypes: ['moderate-intensity', 'morning-ride'],
      timeOfDay: 'morning'
    },
    tips: 'Préparez plusieurs wraps à l\'avance et conservez-les au réfrigérateur pour la semaine.',
    variations: [
      'Ajoutez des tranches de jambon maigre ou de dinde pour plus de protéines',
      'Version végane: remplacez les œufs par du tofu brouillé et omettez le fromage'
    ]
  },
  {
    id: 'brkfst-10',
    name: 'Overnight oats aux pommes et cannelle',
    description: 'Un petit-déjeuner préparé la veille, riche en fibres et en glucides complexes. Idéal pour les matins pressés avant une sortie.',
    image: '/images/recipes/overnight-oats-pomme.jpg',
    mealType: 'breakfast',
    difficulty: 'easy',
    prepTimeMinutes: 10,
    cookTimeMinutes: 0,
    servings: 1,
    ingredients: [
      '50g de flocons d\'avoine',
      '150ml de lait (vache ou végétal)',
      '100g de yaourt grec',
      '1 pomme râpée',
      '1 c. à café de cannelle',
      '1 c. à soupe de miel',
      '15g de noix hachées',
      '1 c. à soupe de graines de chia'
    ],
    instructions: [
      'Dans un bocal, mélanger les flocons d\'avoine, le lait, le yaourt et les graines de chia.',
      'Ajouter la pomme râpée, la cannelle et le miel. Bien mélanger.',
      'Fermer le bocal et réfrigérer toute la nuit (ou minimum 4 heures).',
      'Le matin, garnir de noix hachées et éventuellement de fruits frais supplémentaires.'
    ],
    nutritionalInfo: {
      calories: 420,
      protein: 18,
      carbs: 60,
      fat: 14,
      fiber: 10,
      sugar: 30
    },
    dietaryPreferences: ['vegetarian'],
    nutrientFocus: 'high-carb',
    recommendedFor: {
      trainingPhases: ['base', 'build'],
      effortTypes: ['long-ride', 'moderate-intensity'],
      timeOfDay: 'morning'
    },
    tips: 'Préparez plusieurs portions le dimanche pour toute la semaine d\'entraînement.',
    variations: [
      'Remplacez la pomme par des baies ou de la banane',
      'Ajoutez une cuillère de protéine en poudre pour augmenter l\'apport protéique'
    ]
  },
  {
    id: 'brkfst-11',
    name: 'Gaufres protéinées aux myrtilles',
    description: 'Des gaufres riches en protéines et en antioxydants, parfaites pour les matins d\'entraînement ou avant une compétition.',
    image: '/images/recipes/gaufres-proteinees-myrtilles.jpg',
    mealType: 'breakfast',
    difficulty: 'medium',
    prepTimeMinutes: 15,
    cookTimeMinutes: 10,
    servings: 2,
    ingredients: [
      '100g de farine d\'avoine',
      '30g de protéine en poudre (vanille)',
      '200ml de lait (vache ou végétal)',
      '2 œufs',
      '1 c. à café de levure chimique',
      '1 c. à soupe de miel',
      '100g de myrtilles fraîches',
      '1 c. à café d\'extrait de vanille',
      '1 pincée de sel'
    ],
    instructions: [
      'Dans un saladier, mélanger la farine d\'avoine, la protéine en poudre, la levure et le sel.',
      'Dans un autre bol, fouetter les œufs, puis ajouter le lait, le miel et l\'extrait de vanille.',
      'Incorporer les ingrédients liquides aux ingrédients secs et mélanger jusqu\'à obtention d\'une pâte homogène.',
      'Ajouter délicatement les myrtilles à la pâte.',
      'Préchauffer le gaufrier et le graisser légèrement.',
      'Verser la pâte dans le gaufrier et cuire selon les instructions du fabricant (généralement 3-5 minutes).',
      'Servir avec un filet de miel ou du yaourt grec.'
    ],
    nutritionalInfo: {
      calories: 390,
      protein: 28,
      carbs: 45,
      fat: 12,
      fiber: 8,
      sugar: 18
    },
    dietaryPreferences: ['vegetarian', 'high-protein'],
    nutrientFocus: 'balanced',
    recommendedFor: {
      trainingPhases: ['build', 'peak'],
      effortTypes: ['moderate-intensity', 'race-day'],
      timeOfDay: 'morning'
    },
    tips: 'Préparez la pâte la veille pour gagner du temps le matin. Les myrtilles sont riches en antioxydants qui aident à combattre le stress oxydatif lié à l\'exercice intense.',
    variations: [
      'Remplacez les myrtilles par des framboises ou des morceaux de banane',
      'Version sans gluten: utilisez de la farine de sarrasin à la place de la farine d\'avoine'
    ]
  },
  {
    id: 'brkfst-12',
    name: 'Bols de chia aux fruits et granola',
    description: 'Un petit-déjeuner hautement nutritif, préparé la veille, idéal pour les jours d\'entraînement matinal.',
    image: '/images/recipes/bol-chia-fruits-granola.jpg',
    mealType: 'breakfast',
    difficulty: 'easy',
    prepTimeMinutes: 10,
    cookTimeMinutes: 0,
    servings: 2,
    ingredients: [
      '60g de graines de chia',
      '400ml de lait d\'amande ou de coco',
      '2 c. à soupe de sirop d\'érable ou de miel',
      '1 c. à café d\'extrait de vanille',
      '1 c. à café de cannelle',
      '200g de fruits frais mixtes (fraises, mangue, kiwi)',
      '40g de granola protéiné',
      '2 c. à soupe de noix ou graines (amandes, graines de courge)'
    ],
    instructions: [
      'Dans un bol, mélanger les graines de chia, le lait, le sirop d\'érable, la vanille et la cannelle.',
      'Bien remuer pour éviter les grumeaux, puis laisser reposer 5 minutes et remuer à nouveau.',
      'Couvrir et réfrigérer toute la nuit ou au moins 4 heures.',
      'Le matin, répartir le mélange dans deux bols.',
      'Garnir de fruits frais coupés, de granola et de noix ou graines.',
      'Ajouter éventuellement un filet de miel supplémentaire.'
    ],
    nutritionalInfo: {
      calories: 420,
      protein: 15,
      carbs: 45,
      fat: 22,
      fiber: 15,
      sugar: 20
    },
    dietaryPreferences: ['vegetarian', 'vegan', 'gluten-free'],
    nutrientFocus: 'balanced',
    recommendedFor: {
      trainingPhases: ['base', 'build'],
      effortTypes: ['moderate-intensity', 'morning-ride'],
      timeOfDay: 'morning'
    },
    tips: 'Les graines de chia sont excellentes pour l\'hydratation prolongée et l\'apport en acides gras essentiels. Préparez plusieurs portions pour toute la semaine.',
    variations: [
      'Ajoutez une cuillère de protéine en poudre au mélange de base pour augmenter l\'apport protéique',
      'Version chocolatée: ajoutez 1 c. à soupe de cacao non sucré et utilisez des fruits rouges'
    ]
  },
  {
    id: 'brkfst-13',
    name: 'Frittata aux légumes et fromage de chèvre',
    description: 'Une option salée riche en protéines et légumes, parfaite pour les cyclistes préférant un petit-déjeuner salé avant l\'effort.',
    image: '/images/recipes/frittata-legumes-chevre.jpg',
    mealType: 'breakfast',
    difficulty: 'medium',
    prepTimeMinutes: 15,
    cookTimeMinutes: 20,
    servings: 3,
    ingredients: [
      '6 œufs',
      '60ml de lait',
      '100g d\'épinards frais',
      '1 poivron rouge coupé en dés',
      '1 petit oignon émincé',
      '100g de champignons émincés',
      '80g de fromage de chèvre émietté',
      '1 c. à soupe d\'huile d\'olive',
      'Sel, poivre, herbes de Provence'
    ],
    instructions: [
      'Préchauffer le four à 180°C.',
      'Dans une poêle, faire chauffer l\'huile d\'olive et faire revenir l\'oignon jusqu\'à ce qu\'il soit translucide.',
      'Ajouter les champignons et le poivron, cuire 5 minutes.',
      'Ajouter les épinards et laisser flétrir, puis retirer du feu.',
      'Battre les œufs avec le lait, sel, poivre et herbes.',
      'Ajouter les légumes cuits aux œufs battus et mélanger.',
      'Verser dans un plat à gratin huilé, parsemer de fromage de chèvre.',
      'Cuire au four pendant 20 minutes ou jusqu\'à ce que la frittata soit dorée et prise.'
    ],
    nutritionalInfo: {
      calories: 310,
      protein: 22,
      carbs: 8,
      fat: 22,
      fiber: 3,
      sugar: 4
    },
    dietaryPreferences: ['vegetarian', 'gluten-free', 'high-protein'],
    nutrientFocus: 'high-protein',
    recommendedFor: {
      trainingPhases: ['build', 'peak'],
      effortTypes: ['strength-session', 'recovery-day'],
      timeOfDay: 'morning'
    },
    tips: 'Préparez cette frittata la veille pour un petit-déjeuner rapide à réchauffer. Consommez 2-3 heures avant l\'effort pour une digestion complète.',
    variations: [
      'Ajoutez des pommes de terre précuites pour plus de glucides avant une sortie longue',
      'Remplacez le fromage de chèvre par de la feta ou du parmesan pour varier les saveurs'
    ]
  },
  {
    id: 'brkfst-14',
    name: 'Bowl açaï énergétique',
    description: 'Un bol rempli d\'antioxydants et de nutriments essentiels pour booster l\'énergie avant l\'entraînement et favoriser la récupération.',
    image: '/images/recipes/bowl-acai-energetique.jpg',
    mealType: 'breakfast',
    difficulty: 'medium',
    prepTimeMinutes: 15,
    cookTimeMinutes: 0,
    servings: 1,
    ingredients: [
      '100g de pulpe d\'açaï congelée (ou 2 c. à soupe de poudre d\'açaï + 1 banane congelée)',
      '1 banane, moitié congelée, moitié fraîche',
      '120ml de lait d\'amande',
      '1 c. à soupe de beurre d\'amande',
      '1 c. à café de miel',
      'Garnitures: 2 c. à soupe de granola, fruits frais, 1 c. à soupe de graines de lin, 1 c. à café de noix de coco râpée'
    ],
    instructions: [
      'Mixer la pulpe d\'açaï (ou la poudre), la banane congelée, le lait d\'amande, le beurre d\'amande et le miel jusqu\'à obtenir une consistance crémeuse mais épaisse.',
      'Verser dans un bol.',
      'Garnir avec la demi-banane fraîche tranchée, le granola, les fruits frais, les graines de lin et la noix de coco râpée.'
    ],
    nutritionalInfo: {
      calories: 450,
      protein: 10,
      carbs: 65,
      fat: 18,
      fiber: 12,
      sugar: 35
    },
    dietaryPreferences: ['vegetarian', 'vegan'],
    nutrientFocus: 'high-carb',
    recommendedFor: {
      trainingPhases: ['build', 'peak'],
      effortTypes: ['moderate-intensity', 'high-intensity'],
      timeOfDay: 'morning'
    },
    tips: 'L\'açaï est extrêmement riche en antioxydants qui aident à réduire l\'inflammation et favorisent la récupération. Idéal 1h30-2h avant l\'effort.',
    variations: [
      'Ajoutez une cuillère de protéine en poudre pour augmenter l\'apport protéique',
      'Version performance: ajoutez 1 c. à soupe de poudre de cacao et 1 c. à café de maca'
    ]
  },
  {
    id: 'brkfst-15',
    name: 'Tartines de pain de seigle au saumon fumé',
    description: 'Un petit-déjeuner salé riche en protéines et en acides gras oméga-3, parfait pour les cyclistes recherchant une énergie durable.',
    image: '/images/recipes/tartines-seigle-saumon.jpg',
    mealType: 'breakfast',
    difficulty: 'easy',
    prepTimeMinutes: 10,
    cookTimeMinutes: 0,
    servings: 1,
    ingredients: [
      '2 tranches de pain de seigle',
      '100g de saumon fumé',
      '30g de fromage frais à tartiner',
      '1/4 d\'avocat écrasé',
      'Quelques gouttes de jus de citron',
      '1 c. à café d\'aneth frais haché',
      'Poivre noir fraîchement moulu',
      'Optionnel: quelques câpres, tranches fines de concombre'
    ],
    instructions: [
      'Toaster légèrement les tranches de pain de seigle.',
      'Mélanger le fromage frais avec l\'avocat écrasé, le jus de citron et l\'aneth.',
      'Étaler ce mélange sur les tranches de pain.',
      'Disposer le saumon fumé par-dessus.',
      'Ajouter quelques câpres et des tranches de concombre si désiré.',
      'Poivrer selon le goût.'
    ],
    nutritionalInfo: {
      calories: 380,
      protein: 25,
      carbs: 30,
      fat: 18,
      fiber: 6,
      sugar: 2
    },
    dietaryPreferences: ['high-protein'],
    nutrientFocus: 'balanced',
    recommendedFor: {
      trainingPhases: ['build', 'peak'],
      effortTypes: ['endurance-session', 'morning-ride'],
      timeOfDay: 'morning'
    },
    tips: 'Les acides gras oméga-3 du saumon aident à réduire l\'inflammation et à améliorer la récupération. Le pain de seigle fournit des glucides à libération lente.',
    variations: [
      'Remplacez le saumon par de la truite fumée ou du maquereau pour varier les apports',
      'Ajoutez un œuf poché pour augmenter l\'apport protéique avant un effort intense'
    ]
  }
];

export default breakfastRecipes;
