/**
 * Base de données des recettes et collations à consommer pendant l'effort cycliste
 * Optimisées pour fournir de l'énergie facilement assimilable et maintenir l'hydratation
 */

const duringRideRecipes = [
  {
    id: 'during-1',
    name: 'Boisson isotonique maison',
    description: 'Une boisson énergétique équilibrée en électrolytes pour maintenir l\'hydratation et les niveaux d\'énergie pendant l\'effort.',
    image: '/images/recipes/boisson-isotonique-maison.jpg',
    mealType: 'during-ride',
    difficulty: 'easy',
    prepTimeMinutes: 5,
    cookTimeMinutes: 0,
    servings: 1,
    ingredients: [
      '750ml d\'eau',
      '250ml de jus d\'orange frais',
      '1/4 c. à café de sel de mer',
      '2 c. à soupe de miel ou sirop d\'érable',
      'Jus d\'un demi-citron'
    ],
    instructions: [
      'Mélanger tous les ingrédients dans un shaker ou une gourde.',
      'Bien agiter jusqu\'à dissolution complète du miel et du sel.',
      'Conserver au frais jusqu\'à l\'utilisation.'
    ],
    nutritionalInfo: {
      calories: 120,
      protein: 1,
      carbs: 29,
      fat: 0,
      fiber: 0,
      sugar: 26,
      sodium: 250
    },
    dietaryPreferences: ['vegetarian', 'vegan', 'gluten-free', 'high-carb'],
    nutrientFocus: 'hydration',
    recommendedFor: {
      trainingPhases: ['base', 'build', 'peak'],
      effortTypes: ['long-ride', 'endurance-session', 'race-day'],
      timeOfDay: 'during-workout'
    },
    tips: 'Consommez 500-750ml par heure d\'effort selon la température et l\'intensité. Alternez avec de l\'eau pure par temps chaud.',
    variations: [
      'Ajoutez 1/4 c. à café de bicarbonate de soude pour un effet tampon contre l\'acidité musculaire',
      'Utilisez du jus de pomme à la place du jus d\'orange pour une version plus douce'
    ]
  },
  {
    id: 'during-2',
    name: 'Barres énergétiques riz soufflé et miel',
    description: 'Des barres faciles à mâcher et à digérer pendant l\'effort, apportant des glucides rapidement disponibles.',
    image: '/images/recipes/barres-riz-souffle-miel.jpg',
    mealType: 'during-ride',
    difficulty: 'medium',
    prepTimeMinutes: 15,
    cookTimeMinutes: 5,
    servings: 8,
    ingredients: [
      '100g de riz soufflé',
      '80g de miel',
      '50g de beurre ou huile de coco',
      '40g de sucre brun',
      '30g de raisins secs',
      '20g de graines de tournesol',
      '1 pincée de sel'
    ],
    instructions: [
      'Dans une casserole, faire chauffer le miel, le beurre et le sucre à feu doux jusqu\'à dissolution.',
      'Ajouter une pincée de sel et porter à ébullition pendant 1 minute.',
      'Retirer du feu et incorporer le riz soufflé, les raisins secs et les graines.',
      'Transférer dans un moule rectangulaire tapissé de papier cuisson et presser fermement.',
      'Laisser refroidir puis réfrigérer au moins 2 heures avant de couper en barres.',
      'Emballer individuellement dans du papier cuisson ou film alimentaire.'
    ],
    nutritionalInfo: {
      calories: 180,
      protein: 2,
      carbs: 30,
      fat: 7,
      fiber: 1,
      sugar: 20
    },
    dietaryPreferences: ['vegetarian', 'gluten-free', 'high-carb'],
    nutrientFocus: 'energy-dense',
    recommendedFor: {
      trainingPhases: ['build', 'peak'],
      effortTypes: ['long-ride', 'race-day', 'endurance-session'],
      timeOfDay: 'during-workout'
    },
    tips: 'Consommez une barre toutes les 45-60 minutes d\'effort. Les barres maison sont plus digestes que les versions commerciales pour beaucoup de cyclistes.',
    variations: [
      'Ajoutez un peu de protéine en poudre pour une récupération musculaire en continu',
      'Incorporez des fruits secs comme des cranberries ou abricots pour varier les saveurs'
    ]
  },
  {
    id: 'during-3',
    name: 'Boulettes d\'énergie dattes-amandes',
    description: 'Des bouchées énergétiques naturelles, faciles à transporter et à consommer pendant l\'effort.',
    image: '/images/recipes/boulettes-dattes-amandes.jpg',
    mealType: 'during-ride',
    difficulty: 'easy',
    prepTimeMinutes: 15,
    cookTimeMinutes: 0,
    servings: 12,
    ingredients: [
      '200g de dattes dénoyautées',
      '100g d\'amandes',
      '2 c. à soupe de cacao en poudre non sucré',
      '1 c. à soupe de miel',
      '1 pincée de sel',
      'Noix de coco râpée pour l\'enrobage (optionnel)'
    ],
    instructions: [
      'Si les dattes sont sèches, les faire tremper 15 minutes dans l\'eau chaude puis les égoutter.',
      'Mixer les amandes jusqu\'à obtenir une poudre grossière.',
      'Ajouter les dattes, le cacao, le miel et le sel. Mixer jusqu\'à obtenir une pâte collante.',
      'Former des boulettes de la taille d\'une noix.',
      'Rouler dans la noix de coco râpée si désiré.',
      'Réfrigérer au moins 1 heure avant l\'utilisation.'
    ],
    nutritionalInfo: {
      calories: 120,
      protein: 3,
      carbs: 18,
      fat: 5,
      fiber: 3,
      sugar: 15
    },
    dietaryPreferences: ['vegetarian', 'vegan', 'gluten-free', 'high-carb'],
    nutrientFocus: 'energy-dense',
    recommendedFor: {
      trainingPhases: ['base', 'build', 'peak'],
      effortTypes: ['long-ride', 'moderate-intensity'],
      timeOfDay: 'during-workout'
    },
    tips: 'Emballez les boulettes individuellement pour faciliter l\'accès pendant la sortie. Une boulette toutes les 30-45 minutes est idéale.',
    variations: [
      'Ajoutez du gingembre en poudre pour favoriser la circulation sanguine',
      'Remplacez le cacao par de la cannelle pour une version différente'
    ]
  },
  {
    id: 'during-4',
    name: 'Mini-sandwichs à la banane et miel',
    description: 'Des mini-sandwichs faciles à manger sur le vélo, apportant des glucides rapides et une énergie immédiate.',
    image: '/images/recipes/mini-sandwich-banane.jpg',
    mealType: 'during-ride',
    difficulty: 'easy',
    prepTimeMinutes: 5,
    cookTimeMinutes: 0,
    servings: 4,
    ingredients: [
      '4 petites tranches de pain blanc ou brioche',
      '1 banane bien mûre',
      '2 c. à soupe de miel',
      '1 pincée de sel'
    ],
    instructions: [
      'Écraser la banane à la fourchette.',
      'Mélanger avec le miel et la pincée de sel.',
      'Étaler sur les tranches de pain.',
      'Couper chaque sandwich en deux ou quatre selon la taille.',
      'Emballer individuellement dans du papier aluminium ou film alimentaire.'
    ],
    nutritionalInfo: {
      calories: 130,
      protein: 2,
      carbs: 30,
      fat: 1,
      fiber: 2,
      sugar: 18
    },
    dietaryPreferences: ['vegetarian', 'high-carb', 'low-fiber'],
    nutrientFocus: 'high-carb',
    recommendedFor: {
      trainingPhases: ['build', 'peak'],
      effortTypes: ['race-day', 'long-ride'],
      timeOfDay: 'during-workout'
    },
    tips: 'Idéal pour les courses et randonnées longues. Le pain blanc est préféré pendant l\'effort car plus facilement digestible.',
    variations: [
      'Ajoutez une fine couche de beurre d\'amande pour un apport énergétique prolongé',
      'Utilisez de la confiture à la place du miel pour varier les saveurs'
    ]
  },
  {
    id: 'during-5',
    name: 'Gel énergétique maison aux fruits',
    description: 'Un gel énergétique naturel et économique, sans additifs et facile à digérer pendant l\'effort intense.',
    image: '/images/recipes/gel-energetique-maison.jpg',
    mealType: 'during-ride',
    difficulty: 'medium',
    prepTimeMinutes: 10,
    cookTimeMinutes: 5,
    servings: 4,
    ingredients: [
      '100g de miel',
      '50g de purée de fruits (banane, fraises ou myrtilles)',
      '1 c. à soupe de jus de citron',
      '1/4 c. à café de sel de mer',
      '1 pincée de gingembre en poudre (optionnel)'
    ],
    instructions: [
      'Mixer la purée de fruits jusqu\'à obtenir une consistance lisse.',
      'Mélanger avec le miel, le jus de citron, le sel et le gingembre.',
      'Chauffer à feu doux pendant 3-4 minutes en remuant constamment.',
      'Laisser refroidir puis transférer dans des flacons souples réutilisables.',
      'Conserver au réfrigérateur jusqu\'à 5 jours.'
    ],
    nutritionalInfo: {
      calories: 90,
      protein: 0,
      carbs: 23,
      fat: 0,
      fiber: 1,
      sugar: 21,
      sodium: 150
    },
    dietaryPreferences: ['vegetarian', 'vegan', 'gluten-free', 'high-carb'],
    nutrientFocus: 'high-carb',
    recommendedFor: {
      trainingPhases: ['build', 'peak'],
      effortTypes: ['high-intensity', 'race-day', 'climbs'],
      timeOfDay: 'during-workout'
    },
    tips: 'Consommez un gel toutes les 30-45 minutes pendant l\'effort intense. Toujours accompagner la prise de gel avec de l\'eau.',
    variations: [
      'Ajoutez 1/4 c. à café de caféine en poudre (environ 50mg) pour un effet stimulant',
      'Incorporez de la maltodextrine pour des glucides à assimilation plus progressive'
    ]
  },
  {
    id: 'during-6',
    name: 'Gaufres salées pour cyclistes',
    description: 'Des gaufres légères et salées, parfaites comme alternative aux barres industrielles pendant les longues sorties.',
    image: '/images/recipes/gaufres-salees-cyclistes.jpg',
    mealType: 'during-ride',
    difficulty: 'medium',
    prepTimeMinutes: 15,
    cookTimeMinutes: 15,
    servings: 8,
    ingredients: [
      '100g de farine de riz',
      '50g de fécule de maïs',
      '1 c. à café de levure chimique',
      '2 œufs',
      '200ml de lait',
      '30g de beurre fondu',
      '1 c. à café de sel',
      '1 c. à soupe d\'herbes de Provence (optionnel)'
    ],
    instructions: [
      'Mélanger les ingrédients secs : farine, fécule, levure et sel.',
      'Dans un autre bol, battre les œufs avec le lait et le beurre fondu.',
      'Incorporer les ingrédients secs aux liquides et mélanger jusqu\'à obtention d\'une pâte lisse.',
      'Ajouter les herbes si désiré.',
      'Cuire dans un gaufrier jusqu\'à ce qu\'elles soient dorées.',
      'Laisser refroidir complètement puis emballer individuellement.'
    ],
    nutritionalInfo: {
      calories: 150,
      protein: 4,
      carbs: 22,
      fat: 5,
      fiber: 1,
      sugar: 2,
      sodium: 300
    },
    dietaryPreferences: ['vegetarian', 'low-fiber'],
    nutrientFocus: 'energy-dense',
    recommendedFor: {
      trainingPhases: ['build', 'peak'],
      effortTypes: ['long-ride', 'endurance-session'],
      timeOfDay: 'during-workout'
    },
    tips: 'Les gaufres offrent une alternative solide appréciable après plusieurs heures de sortie. La version salée évite l\'écœurement du sucré.',
    variations: [
      'Ajoutez du fromage râpé à la pâte pour plus de goût et de calories',
      'Version sucrée: remplacez le sel par 1 c. à soupe de sucre et les herbes par de la cannelle'
    ]
  },
  {
    id: 'during-7',
    name: 'Riz gluant sucrée à l\'asiatique',
    description: 'Inspiré des onigiri japonais, ces boules de riz sucrées sont faciles à transporter et procurent une énergie durable pendant l\'effort.',
    image: '/images/recipes/riz-gluant-sucre.jpg',
    mealType: 'during-ride',
    difficulty: 'medium',
    prepTimeMinutes: 15,
    cookTimeMinutes: 20,
    servings: 8,
    ingredients: [
      '200g de riz à sushi',
      '250ml d\'eau',
      '2 c. à soupe de miel',
      '1 c. à soupe de graines de sésame',
      '1 pincée de sel',
      'Papier d\'algue nori (optionnel pour l\'emballage)'
    ],
    instructions: [
      'Rincer le riz jusqu\'à ce que l\'eau soit claire.',
      'Cuire le riz avec l\'eau selon les instructions du paquet.',
      'Une fois cuit, incorporer le miel et le sel au riz encore chaud.',
      'Laisser refroidir légèrement puis former des boules ou triangles avec les mains humides.',
      'Parsemer de graines de sésame.',
      'Envelopper dans du papier d\'algue nori si désiré, puis dans du film alimentaire.'
    ],
    nutritionalInfo: {
      calories: 120,
      protein: 2,
      carbs: 26,
      fat: 1,
      fiber: 0,
      sugar: 8
    },
    dietaryPreferences: ['vegetarian', 'vegan', 'high-carb', 'low-fiber'],
    nutrientFocus: 'high-carb',
    recommendedFor: {
      trainingPhases: ['build', 'peak'],
      effortTypes: ['long-ride', 'endurance-session'],
      timeOfDay: 'during-workout'
    },
    tips: 'Le riz fournit des glucides facilement digestibles pendant l\'effort. Un bon choix pour les sorties de plus de 3 heures.',
    variations: [
      'Ajoutez des petits morceaux de fruits secs à l\'intérieur',
      'Version salée: remplacez le miel par une pincée de sel et ajoutez du saumon fumé'
    ]
  },
  {
    id: 'during-8',
    name: 'Wrap à la banane et beurre d\'amande',
    description: 'Un wrap simple, riche en glucides et protéines, facile à mâcher et à digérer pendant l\'effort.',
    image: '/images/recipes/wrap-banane-amande.jpg',
    mealType: 'during-ride',
    difficulty: 'easy',
    prepTimeMinutes: 5,
    cookTimeMinutes: 0,
    servings: 2,
    ingredients: [
      '2 petites tortillas de blé',
      '2 c. à soupe de beurre d\'amande',
      '1 banane',
      '1 c. à soupe de miel',
      '1 pincée de cannelle'
    ],
    instructions: [
      'Étaler le beurre d\'amande sur chaque tortilla.',
      'Couper la banane en tranches et les disposer sur le beurre d\'amande.',
      'Drizzler avec le miel et saupoudrer de cannelle.',
      'Rouler fermement la tortilla et couper en deux.',
      'Emballer dans du papier aluminium ou film alimentaire.'
    ],
    nutritionalInfo: {
      calories: 220,
      protein: 6,
      carbs: 35,
      fat: 8,
      fiber: 3,
      sugar: 18
    },
    dietaryPreferences: ['vegetarian', 'high-carb'],
    nutrientFocus: 'balanced',
    recommendedFor: {
      trainingPhases: ['build', 'peak'],
      effortTypes: ['long-ride', 'moderate-intensity'],
      timeOfDay: 'during-workout'
    },
    tips: 'Idéal pour les pauses ravitaillement pendant les longues sorties. Le beurre d\'amande apporte des protéines et graisses saines pour une énergie durable.',
    variations: [
      'Utilisez du beurre de cacahuète à la place du beurre d\'amande',
      'Ajoutez des raisins secs pour plus de glucides rapides'
    ]
  },
  {
    id: 'during-9',
    name: 'Cake salé portable',
    description: 'Un cake salé dense en énergie, facile à transporter dans la poche de maillot et à manger pendant l\'effort.',
    image: '/images/recipes/cake-sale-portable.jpg',
    mealType: 'during-ride',
    difficulty: 'medium',
    prepTimeMinutes: 15,
    cookTimeMinutes: 40,
    servings: 10,
    ingredients: [
      '200g de farine',
      '100g de fromage râpé',
      '100g de jambon coupé en dés',
      '50g d\'olives dénoyautées coupées en morceaux',
      '3 œufs',
      '80ml d\'huile d\'olive',
      '100ml de lait',
      '1 sachet de levure chimique',
      '1 c. à café de sel',
      'Herbes de Provence, poivre'
    ],
    instructions: [
      'Préchauffer le four à 180°C.',
      'Dans un saladier, mélanger la farine, la levure et le sel.',
      'Dans un autre bol, battre les œufs avec l\'huile et le lait.',
      'Incorporer les ingrédients secs aux liquides.',
      'Ajouter le fromage, le jambon, les olives et les herbes. Bien mélanger.',
      'Verser dans un moule à cake et cuire 35-40 minutes.',
      'Laisser refroidir complètement avant de couper en tranches.'
    ],
    nutritionalInfo: {
      calories: 220,
      protein: 9,
      carbs: 20,
      fat: 12,
      fiber: 1,
      sugar: 1,
      sodium: 450
    },
    dietaryPreferences: ['high-protein'],
    nutrientFocus: 'balanced',
    recommendedFor: {
      trainingPhases: ['build', 'peak'],
      effortTypes: ['long-ride', 'endurance-session'],
      timeOfDay: 'during-workout'
    },
    tips: 'L\'apport de sel est bénéfique pendant l\'effort prolongé, surtout par temps chaud. Emballez chaque tranche individuellement dans du papier cuisson.',
    variations: [
      'Version végétarienne: remplacez le jambon par des légumes grillés',
      'Ajoutez des noix ou des graines pour plus de protéines et de graisses saines'
    ]
  },
  {
    id: 'during-10',
    name: 'Purée de fruits énergétique',
    description: 'Une alternative naturelle aux gels du commerce, sous forme de purée de fruits concentrée en énergie.',
    image: '/images/recipes/puree-fruits-energetique.jpg',
    mealType: 'during-ride',
    difficulty: 'easy',
    prepTimeMinutes: 10,
    cookTimeMinutes: 5,
    servings: 4,
    ingredients: [
      '200g de fruits mixtes (banane, mangue, fraises)',
      '2 c. à soupe de miel',
      '1 c. à soupe de jus de citron',
      '1 pincée de sel',
      '1 c. à café d\'huile de coco'
    ],
    instructions: [
      'Mixer les fruits jusqu\'à obtenir une purée lisse.',
      'Dans une casserole, chauffer la purée avec le miel, le jus de citron et le sel à feu doux.',
      'Ajouter l\'huile de coco et remuer jusqu\'à ce qu\'elle soit fondue.',
      'Laisser réduire légèrement pendant 3-5 minutes en remuant.',
      'Laisser refroidir puis transférer dans des gourdes souples réutilisables.'
    ],
    nutritionalInfo: {
      calories: 110,
      protein: 1,
      carbs: 26,
      fat: 1,
      fiber: 2,
      sugar: 24
    },
    dietaryPreferences: ['vegetarian', 'vegan', 'gluten-free', 'high-carb'],
    nutrientFocus: 'high-carb',
    recommendedFor: {
      trainingPhases: ['build', 'peak'],
      effortTypes: ['high-intensity', 'race-day'],
      timeOfDay: 'during-workout'
    },
    tips: 'Consommez toutes les 30-45 minutes en alternance avec l\'hydratation. L\'avantage de cette purée est qu\'elle contient des antioxydants naturels.',
    variations: [
      'Ajoutez une pincée de gingembre ou de cannelle pour stimuler la circulation',
      'Version plus énergétique: incorporez 1 c. à soupe de sirop de glucose'
    ]
  },
  {
    id: 'during-11',
    name: 'Pâte d\'amande sportive aux cranberries',
    description: 'Une alternative naturelle aux gels énergétiques commerciaux, facile à transporter et à consommer pendant l\'effort.',
    image: '/images/recipes/pate-amande-sportive.jpg',
    mealType: 'during-ride',
    difficulty: 'easy',
    prepTimeMinutes: 15,
    cookTimeMinutes: 5,
    servings: 8,
    ingredients: [
      '100g d\'amandes moulues',
      '80g de miel liquide',
      '40g de cranberries séchées hachées',
      '20g de maltodextrine (optionnel pour prolonger l\'énergie)',
      '1 c. à café d\'huile de coco',
      '1/4 c. à café de sel',
      '1 c. à café d\'extrait de vanille',
      'Zeste d\'une orange'
    ],
    instructions: [
      'Dans une casserole à feu doux, faire chauffer le miel et l\'huile de coco jusqu\'à ce que le mélange soit liquide.',
      'Ajouter les amandes moulues, les cranberries, le sel, l\'extrait de vanille et le zeste d\'orange.',
      'Si vous utilisez de la maltodextrine, l\'incorporer à ce stade.',
      'Bien mélanger jusqu\'à obtention d\'une pâte homogène.',
      'Étaler la pâte sur une plaque recouverte de papier sulfurisé sur environ 1 cm d\'épaisseur.',
      'Réfrigérer pendant au moins 2 heures puis découper en 8 portions.',
      'Emballer individuellement dans du papier cuisson ou film alimentaire pour faciliter le transport.'
    ],
    nutritionalInfo: {
      calories: 135,
      protein: 3,
      carbs: 20,
      fat: 6,
      fiber: 2,
      sugar: 16
    },
    dietaryPreferences: ['vegetarian', 'vegan', 'gluten-free', 'high-carb'],
    nutrientFocus: 'energy-dense',
    recommendedFor: {
      trainingPhases: ['build', 'peak'],
      effortTypes: ['long-ride', 'race-day', 'climbs'],
      timeOfDay: 'during-workout'
    },
    tips: 'Consommez une portion toutes les 45-60 minutes pendant l\'effort. La combinaison des sucres rapides (miel) et plus lents (amandes) permet une libération progressive d\'énergie.',
    variations: [
      'Ajoutez 1 c. à café de caféine en poudre pour un effet stimulant lors des moments difficiles',
      'Remplacez les cranberries par des abricots secs ou des cerises séchées pour varier les saveurs'
    ]
  },
  {
    id: 'during-12',
    name: 'Wraps de tortilla au beurre d\'amande et banane',
    description: 'Un en-cas compact et énergétique, facile à transporter et à manger d\'une main pendant une pause rapide.',
    image: '/images/recipes/wrap-amande-banane.jpg',
    mealType: 'during-ride',
    difficulty: 'easy',
    prepTimeMinutes: 5,
    cookTimeMinutes: 0,
    servings: 2,
    ingredients: [
      '2 petites tortillas de blé',
      '3 c. à soupe de beurre d\'amande',
      '2 bananes mûres',
      '1 c. à soupe de miel',
      '1 pincée de cannelle',
      '1 pincée de sel'
    ],
    instructions: [
      'Étaler le beurre d\'amande sur chaque tortilla.',
      'Déposer une banane entière sur chaque tortilla, près d\'un bord.',
      'Arroser d\'un filet de miel et saupoudrer légèrement de cannelle et d\'une pincée de sel.',
      'Rouler fermement la tortilla autour de la banane.',
      'Couper chaque wrap en 2 ou 3 morceaux pour faciliter la consommation.',
      'Emballer dans du papier aluminium ou du film alimentaire pour le transport.'
    ],
    nutritionalInfo: {
      calories: 310,
      protein: 7,
      carbs: 45,
      fat: 12,
      fiber: 4,
      sugar: 22
    },
    dietaryPreferences: ['vegetarian', 'high-carb'],
    nutrientFocus: 'energy-dense',
    recommendedFor: {
      trainingPhases: ['build', 'peak'],
      effortTypes: ['long-ride', 'moderate-intensity'],
      timeOfDay: 'during-workout'
    },
    tips: 'Le beurre d\'amande apporte des protéines et des graisses pour une énergie soutenue, tandis que la banane fournit des glucides rapidement assimilables. Le sel aide à maintenir l\'équilibre électrolytique.',
    variations: [
      'Remplacez le beurre d\'amande par du beurre de cacahuète ou de noisette',
      'Ajoutez une cuillère à café de poudre de protéine mélangée au beurre d\'amande pour un apport protéique supplémentaire'
    ]
  },
  {
    id: 'during-13',
    name: 'Boisson isotonique au gingembre et citron vert',
    description: 'Une boisson d\'effort rafraîchissante avec des propriétés anti-inflammatoires, idéale pour les sorties par temps chaud.',
    image: '/images/recipes/isotonique-gingembre-citron.jpg',
    mealType: 'during-ride',
    difficulty: 'easy',
    prepTimeMinutes: 10,
    cookTimeMinutes: 2,
    servings: 2,
    ingredients: [
      '1L d\'eau',
      '60g de sucre ou 4 c. à soupe de miel',
      '1/2 c. à café de sel de mer',
      '20g de gingembre frais râpé',
      'Jus et zeste de 2 citrons verts',
      '1 c. à soupe de jus d\'orange concentré (optionnel)',
      '200ml d\'eau froide supplémentaire pour diluer après préparation'
    ],
    instructions: [
      'Dans une casserole, porter à ébullition 200ml d\'eau avec le sucre ou le miel et le gingembre râpé.',
      'Laisser frémir 2 minutes, puis retirer du feu et laisser infuser 5 minutes.',
      'Filtrer pour retirer les morceaux de gingembre et verser dans un pichet avec les 800ml d\'eau restants.',
      'Ajouter le sel, le jus et le zeste de citron vert, et le jus d\'orange concentré si utilisé.',
      'Bien mélanger et réfrigérer jusqu\'à utilisation.',
      'Avant de remplir les bidons, ajouter 200ml d\'eau supplémentaire pour atteindre la concentration isotonique idéale.'
    ],
    nutritionalInfo: {
      calories: 115,
      protein: 0,
      carbs: 30,
      fat: 0,
      fiber: 0,
      sugar: 28,
      sodium: 250
    },
    dietaryPreferences: ['vegetarian', 'vegan', 'gluten-free'],
    nutrientFocus: 'hydration',
    recommendedFor: {
      trainingPhases: ['base', 'build', 'peak'],
      effortTypes: ['long-ride', 'hot-weather'],
      timeOfDay: 'during-workout'
    },
    tips: 'Le gingembre aide à réduire l\'inflammation et peut calmer l\'estomac pendant l\'effort. Buvez 500-750ml par heure selon l\'intensité et la température extérieure.',
    variations: [
      'Ajoutez une pincée de cayenne pour stimuler la circulation sanguine',
      'Version hivernale: utilisez de l\'eau tiède et augmentez la quantité de gingembre'
    ]
  },
  {
    id: 'during-14',
    name: 'Chutney de patate douce salé',
    description: 'Une alternative salée aux gels sucrés, dans un format compact et énergétique pour les sorties longues.',
    image: '/images/recipes/chutney-patate-douce.jpg',
    mealType: 'during-ride',
    difficulty: 'medium',
    prepTimeMinutes: 15,
    cookTimeMinutes: 15,
    servings: 4,
    ingredients: [
      '300g de patate douce cuite et écrasée',
      '1 c. à soupe d\'huile d\'olive',
      '1/2 c. à café de sel',
      '1 c. à café de cumin moulu',
      '1/2 c. à café de paprika',
      '1 c. à soupe de sirop d\'érable',
      '1 c. à soupe de vinaigre de cidre',
      '20g de noix concassées (optionnel)'
    ],
    instructions: [
      'Cuire les patates douces au four ou à la vapeur jusqu\'à ce qu\'elles soient tendres.',
      'Écraser les patates douces jusqu\'à obtenir une purée lisse.',
      'Dans une poêle, chauffer l\'huile d\'olive et ajouter le cumin et le paprika. Cuire 30 secondes jusqu\'à ce que les épices soient parfumées.',
      'Ajouter la purée de patate douce, le sel, le sirop d\'érable et le vinaigre de cidre.',
      'Cuire à feu moyen pendant 5 minutes en remuant fréquemment pour réduire l\'humidité.',
      'Si utilisées, incorporer les noix concassées hors du feu.',
      'Laisser refroidir puis transférer dans des sachets ou petits contenants portables.'
    ],
    nutritionalInfo: {
      calories: 150,
      protein: 2,
      carbs: 25,
      fat: 5,
      fiber: 3,
      sugar: 8,
      sodium: 300
    },
    dietaryPreferences: ['vegetarian', 'vegan', 'gluten-free'],
    nutrientFocus: 'balanced',
    recommendedFor: {
      trainingPhases: ['build', 'peak'],
      effortTypes: ['long-ride', 'endurance-session'],
      timeOfDay: 'during-workout'
    },
    tips: 'Particulièrement utile lors des longues sorties quand la saturation en sucre devient un problème. Le salé offre un break bienvenu et aide à maintenir l\'équilibre électrolytique.',
    variations: [
      'Version plus épicée: ajoutez une pincée de piment de Cayenne',
      'Version protéinée: incorporez 25g de protéine en poudre non sucrée à la purée'
    ]
  },
  {
    id: 'during-15',
    name: 'Brownies énergétiques aux dattes et noix',
    description: 'Des carrés énergétiques denses inspirés du brownie, parfaits pour les phases d\'effort prolongé nécessitant un apport calorique soutenu.',
    image: '/images/recipes/brownies-energetiques.jpg',
    mealType: 'during-ride',
    difficulty: 'medium',
    prepTimeMinutes: 15,
    cookTimeMinutes: 20,
    servings: 8,
    ingredients: [
      '200g de dattes dénoyautées',
      '100g de farine d\'avoine',
      '50g de cacao en poudre non sucré',
      '60ml d\'huile de coco fondue',
      '2 c. à soupe de sirop d\'érable',
      '50g de noix concassées',
      '30g de pépites de chocolat noir',
      '1 pincée de sel de mer',
      '1/2 c. à café d\'extrait de vanille'
    ],
    instructions: [
      'Préchauffer le four à 180°C et chemiser un moule carré de papier cuisson.',
      'Mixer les dattes jusqu\'à obtenir une pâte collante.',
      'Dans un grand bol, mélanger la farine d\'avoine, le cacao et le sel.',
      'Ajouter la pâte de dattes, l\'huile de coco, le sirop d\'érable et la vanille. Bien mélanger.',
      'Incorporer la moitié des noix et des pépites de chocolat.',
      'Verser la préparation dans le moule et saupoudrer du reste des noix et chocolat.',
      'Cuire au four 15-18 minutes pour obtenir un brownie encore un peu moelleux.',
      'Laisser refroidir complètement avant de couper en 8 carrés.'
    ],
    nutritionalInfo: {
      calories: 240,
      protein: 4,
      carbs: 30,
      fat: 12,
      fiber: 5,
      sugar: 20
    },
    dietaryPreferences: ['vegetarian', 'vegan'],
    nutrientFocus: 'energy-dense',
    recommendedFor: {
      trainingPhases: ['build', 'peak'],
      effortTypes: ['long-ride', 'cold-weather', 'race-day'],
      timeOfDay: 'during-workout'
    },
    tips: 'Ces brownies sont particulièrement efficaces lors des sorties par temps froid où les besoins caloriques sont plus élevés. L\'apport combiné de glucides et de matières grasses fournit une énergie durable.',
    variations: [
      'Ajoutez 1 c. à café d\'espresso instantané pour un coup de boost mental',
      'Remplacez les noix par des graines de tournesol pour une version sans allergènes'
    ]
  }
];

export default duringRideRecipes;
