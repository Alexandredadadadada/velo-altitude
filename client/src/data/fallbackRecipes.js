// Données de fallback pour les recettes nutritionnelles
// Utilisé lorsque la connexion à MongoDB échoue dans les fonctions Netlify

module.exports = [
  {
    _id: "recipe001",
    title: "Porridge énergétique pré-sortie",
    description: "Un porridge complet pour faire le plein d'énergie avant une sortie vélo exigeante.",
    ingredients: [
      "80g de flocons d'avoine",
      "250ml de lait d'amande",
      "1 banane mûre",
      "1 cuillère à soupe de miel",
      "1 cuillère à café de cannelle",
      "15g d'amandes effilées",
      "10g de graines de chia"
    ],
    instructions: [
      "Dans une casserole, mélangez les flocons d'avoine et le lait d'amande.",
      "Faites chauffer à feu moyen en remuant régulièrement.",
      "Quand le mélange commence à épaissir, ajoutez la banane écrasée et le miel.",
      "Continuez la cuisson 2-3 minutes en remuant constamment.",
      "Retirez du feu et ajoutez la cannelle, les amandes et les graines de chia.",
      "Laissez reposer 2 minutes avant de servir."
    ],
    prepTime: 10,
    cookTime: 5,
    servings: 1,
    category: "petit-dejeuner",
    mealType: "pre-entrainement",
    calories: 485,
    macros: {
      carbs: 68,
      protein: 12,
      fat: 16
    },
    dietaryTags: ["vegetarien"],
    popularity: 95,
    image: "/images/recipes/porridge-energetique.jpg"
  },
  {
    _id: "recipe002",
    title: "Pâtes au saumon et épinards",
    description: "Un plat de récupération riche en protéines et en glucides complexes.",
    ingredients: [
      "100g de pâtes complètes",
      "100g de saumon frais",
      "60g d'épinards frais",
      "1 gousse d'ail",
      "1 cuillère à soupe d'huile d'olive",
      "Jus d'un demi-citron",
      "Sel et poivre"
    ],
    instructions: [
      "Faites cuire les pâtes selon les instructions du paquet.",
      "Pendant ce temps, faites revenir l'ail émincé dans l'huile d'olive.",
      "Ajoutez le saumon coupé en dés et faites cuire 3-4 minutes.",
      "Incorporez les épinards et laissez-les réduire.",
      "Égouttez les pâtes et ajoutez-les à la poêle.",
      "Arrosez de jus de citron, assaisonnez et mélangez bien."
    ],
    prepTime: 10,
    cookTime: 15,
    servings: 1,
    category: "plat-principal",
    mealType: "post-entrainement",
    calories: 520,
    macros: {
      carbs: 58,
      protein: 32,
      fat: 18
    },
    dietaryTags: ["riche-proteines"],
    popularity: 88,
    image: "/images/recipes/pates-saumon-epinards.jpg"
  },
  {
    _id: "recipe003",
    title: "Smoothie récupération banane-myrtille",
    description: "Un smoothie antioxydant parfait pour la récupération après l'effort.",
    ingredients: [
      "1 banane",
      "100g de myrtilles",
      "200ml de lait d'amande",
      "20g de protéine whey (vanille)",
      "1 cuillère à café de miel",
      "5g de graines de lin moulues",
      "Glaçons (optionnel)"
    ],
    instructions: [
      "Placez tous les ingrédients dans un blender.",
      "Mixez jusqu'à obtenir une texture lisse et homogène.",
      "Ajoutez des glaçons si désiré et mixez à nouveau.",
      "Servez immédiatement."
    ],
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    category: "boisson",
    mealType: "post-entrainement",
    calories: 340,
    macros: {
      carbs: 42,
      protein: 25,
      fat: 8
    },
    dietaryTags: ["vegetarien", "riche-proteines", "antioxydants"],
    popularity: 92,
    image: "/images/recipes/smoothie-recuperation.jpg"
  },
  {
    _id: "recipe004",
    title: "Barre énergétique maison",
    description: "Des barres énergétiques faites maison, idéales à emporter lors de vos sorties cyclistes.",
    ingredients: [
      "100g de dattes dénoyautées",
      "50g d'abricots secs",
      "30g d'amandes",
      "30g de noix de cajou",
      "20g de flocons d'avoine",
      "15g de graines de tournesol",
      "1 cuillère à soupe de miel",
      "1 pincée de sel"
    ],
    instructions: [
      "Mixez les dattes et les abricots jusqu'à obtenir une pâte.",
      "Ajoutez les amandes, les noix de cajou et mixez brièvement pour garder des morceaux.",
      "Transférez dans un bol et incorporez les flocons d'avoine, les graines et le sel.",
      "Ajoutez le miel et mélangez bien à la main.",
      "Étalez la préparation sur une plaque recouverte de papier cuisson (environ 1cm d'épaisseur).",
      "Réfrigérez 2 heures minimum puis découpez en barres."
    ],
    prepTime: 15,
    cookTime: 0,
    servings: 8,
    category: "snack",
    mealType: "pendant-effort",
    calories: 125,
    macros: {
      carbs: 18,
      protein: 3,
      fat: 5
    },
    dietaryTags: ["vegetarien", "vegan", "sans-gluten"],
    popularity: 85,
    image: "/images/recipes/barre-energetique-maison.jpg"
  },
  {
    _id: "recipe005",
    title: "Omelette aux légumes et fromage de chèvre",
    description: "Une omelette riche en protéines et nutriments essentiels pour la récupération musculaire.",
    ingredients: [
      "3 œufs",
      "50g de poivron rouge",
      "30g d'épinards frais",
      "20g d'oignon rouge",
      "30g de fromage de chèvre",
      "1 cuillère à café d'huile d'olive",
      "Herbes fraîches (ciboulette, persil)",
      "Sel et poivre"
    ],
    instructions: [
      "Coupez les légumes en petits morceaux.",
      "Battez les œufs dans un bol, assaisonnez de sel et poivre.",
      "Chauffez l'huile dans une poêle à feu moyen.",
      "Faites revenir l'oignon et le poivron 2-3 minutes.",
      "Ajoutez les épinards et laissez-les réduire.",
      "Versez les œufs battus sur les légumes.",
      "Laissez cuire à feu doux jusqu'à ce que l'omelette soit presque prise.",
      "Émiettez le fromage de chèvre sur la moitié de l'omelette.",
      "Repliez l'omelette, parsemez d'herbes fraîches et servez."
    ],
    prepTime: 10,
    cookTime: 8,
    servings: 1,
    category: "plat-principal",
    mealType: "post-entrainement",
    calories: 380,
    macros: {
      carbs: 6,
      protein: 28,
      fat: 26
    },
    dietaryTags: ["vegetarien", "riche-proteines", "low-carb"],
    popularity: 78,
    image: "/images/recipes/omelette-legumes-chevre.jpg"
  }
];
