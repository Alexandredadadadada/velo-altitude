/**
 * Données mockées pour le module Nutrition
 * Ces données simulent les réponses de l'API pour permettre le fonctionnement
 * en mode hors-ligne ou sans backend sur Netlify
 */

// Données de profil nutritionnel par défaut
export const nutritionProfile = {
  id: 'default-user',
  calories: 2800,
  macros: {
    carbs: 330, // grammes
    proteins: 140, // grammes
    fats: 93, // grammes
  },
  hydration: 3200, // ml
  preferences: {
    diet: 'balanced', // balanced, vegetarian, vegan, keto, etc.
    allergies: ['none'],
    intolerances: ['none'],
    dislikes: ['none']
  },
  goals: {
    primary: 'performance',
    secondary: 'maintain-weight',
    custom: 'Améliorer l\'endurance pour les longs cols'
  }
};

// Données des repas recommandés
export const mealRecommendations = [
  {
    id: 'pre-ride',
    title: 'Repas avant sortie',
    description: 'Repas riche en glucides à consommer 2-3h avant une sortie intense',
    meals: [
      {
        id: 'breakfast-1',
        name: 'Petit déjeuner complet',
        image: '/images/nutrition/meals/breakfast-oatmeal.jpg',
        ingredients: [
          '100g de flocons d\'avoine',
          '1 banane',
          '1 cuillère à soupe de miel',
          '20g d\'amandes',
          '250ml de lait d\'amande',
          '1 café sans sucre'
        ],
        nutrients: {
          calories: 650,
          carbs: 105,
          proteins: 22,
          fats: 18
        },
        preparation: 'Mélanger les flocons d\'avoine au lait d\'amande. Ajouter le miel et les amandes concassées. Décorer avec des tranches de banane.'
      },
      {
        id: 'breakfast-2',
        name: 'Toast avocat-œuf',
        image: '/images/nutrition/meals/avocado-toast.jpg',
        ingredients: [
          '2 tranches de pain complet',
          '1 avocat',
          '2 œufs',
          'Sel et poivre',
          'Jus de citron',
          '1 verre de jus d\'orange pressé'
        ],
        nutrients: {
          calories: 580,
          carbs: 65,
          proteins: 24,
          fats: 28
        },
        preparation: 'Toaster le pain. Écraser l\'avocat avec du jus de citron, du sel et du poivre. Étaler sur le pain. Faire cuire les œufs au plat et les poser sur l\'avocat.'
      }
    ]
  },
  {
    id: 'during-ride',
    title: 'Nutrition pendant l\'effort',
    description: 'Aliments faciles à transporter et à digérer pour maintenir l\'énergie',
    meals: [
      {
        id: 'energy-bars',
        name: 'Barres énergétiques maison',
        image: '/images/nutrition/meals/energy-bars.jpg',
        ingredients: [
          '100g de dattes',
          '50g d\'abricots secs',
          '50g d\'amandes',
          '50g de flocons d\'avoine',
          '2 cuillères à soupe de miel',
          '1 pincée de sel'
        ],
        nutrients: {
          calories: 120, // par portion
          carbs: 22,
          proteins: 3,
          fats: 3
        },
        preparation: 'Mixer tous les ingrédients jusqu\'à obtenir une pâte collante. Former des barres et les réfrigérer pendant au moins 1 heure.'
      },
      {
        id: 'banana-sandwich',
        name: 'Sandwich banane-beurre d\'amande',
        image: '/images/nutrition/meals/banana-sandwich.jpg',
        ingredients: [
          '2 tranches de pain blanc',
          '1 banane',
          '2 cuillères à café de beurre d\'amande',
          '1 cuillère à café de miel'
        ],
        nutrients: {
          calories: 340,
          carbs: 58,
          proteins: 8,
          fats: 10
        },
        preparation: 'Étaler le beurre d\'amande sur les tranches de pain. Couper la banane en rondelles et les disposer sur une tranche. Ajouter le miel et refermer le sandwich.'
      }
    ]
  },
  {
    id: 'recovery',
    title: 'Nutrition de récupération',
    description: 'Repas post-effort pour favoriser la récupération musculaire',
    meals: [
      {
        id: 'recovery-smoothie',
        name: 'Smoothie récupération',
        image: '/images/nutrition/meals/recovery-smoothie.jpg',
        ingredients: [
          '1 banane',
          '250ml de lait',
          '30g de protéine whey',
          '100g de myrtilles',
          '1 cuillère à café de miel',
          'Quelques glaçons'
        ],
        nutrients: {
          calories: 380,
          carbs: 55,
          proteins: 30,
          fats: 5
        },
        preparation: 'Mixer tous les ingrédients jusqu\'à obtenir une consistance lisse.'
      },
      {
        id: 'chicken-rice-bowl',
        name: 'Bowl poulet-riz-légumes',
        image: '/images/nutrition/meals/chicken-rice-bowl.jpg',
        ingredients: [
          '150g de blanc de poulet',
          '100g de riz basmati',
          '100g de légumes variés (brocoli, carottes, poivrons)',
          '1 cuillère à soupe d\'huile d\'olive',
          'Herbes et épices'
        ],
        nutrients: {
          calories: 520,
          carbs: 60,
          proteins: 45,
          fats: 12
        },
        preparation: 'Cuire le riz. Faire sauter le poulet coupé en dés jusqu\'à ce qu\'il soit bien cuit. Ajouter les légumes et faire sauter encore quelques minutes. Servir le tout dans un bol avec un filet d\'huile d\'olive.'
      }
    ]
  }
];

// Données simulées de suivi nutritionnel sur 7 jours
export const nutritionTracking = {
  currentWeek: {
    dates: ['2025-04-01', '2025-04-02', '2025-04-03', '2025-04-04', '2025-04-05', '2025-04-06', '2025-04-07'],
    caloriesConsumed: [2650, 2820, 2780, 3100, 2700, 2900, 2750],
    caloriesBurned: [2700, 3200, 2600, 3400, 2800, 3100, 2300],
    macrosConsumed: [
      { carbs: 310, proteins: 132, fats: 88 },
      { carbs: 340, proteins: 145, fats: 90 },
      { carbs: 320, proteins: 140, fats: 95 },
      { carbs: 380, proteins: 155, fats: 102 },
      { carbs: 300, proteins: 135, fats: 91 },
      { carbs: 350, proteins: 142, fats: 97 },
      { carbs: 315, proteins: 138, fats: 89 }
    ],
    hydration: [2800, 3100, 3200, 3400, 3000, 3300, 2900],
    workoutDays: [true, true, false, true, true, true, false]
  },
  dailyLogs: [
    {
      date: '2025-04-06',
      meals: [
        { 
          type: 'breakfast', 
          name: 'Flocons d\'avoine aux fruits', 
          calories: 580,
          macros: { carbs: 85, proteins: 20, fats: 15 },
          time: '07:30',
          image: '/images/nutrition/meals/breakfast-oatmeal.jpg'
        },
        { 
          type: 'snack', 
          name: 'Banane et barre protéinée', 
          calories: 280,
          macros: { carbs: 40, proteins: 15, fats: 6 },
          time: '10:00',
          image: '/images/nutrition/meals/protein-bar.jpg'
        },
        { 
          type: 'lunch', 
          name: 'Salade de quinoa au poulet', 
          calories: 650,
          macros: { carbs: 70, proteins: 45, fats: 25 },
          time: '13:00',
          image: '/images/nutrition/meals/quinoa-salad.jpg'
        },
        { 
          type: 'snack', 
          name: 'Yaourt grec et myrtilles', 
          calories: 190,
          macros: { carbs: 15, proteins: 18, fats: 8 },
          time: '16:30',
          image: '/images/nutrition/meals/greek-yogurt.jpg'
        },
        { 
          type: 'dinner', 
          name: 'Saumon, patates douces et légumes', 
          calories: 720,
          macros: { carbs: 65, proteins: 42, fats: 32 },
          time: '19:30',
          image: '/images/nutrition/meals/salmon-dinner.jpg'
        },
        { 
          type: 'evening', 
          name: 'Tisane et amandes', 
          calories: 120,
          macros: { carbs: 5, proteins: 4, fats: 10 },
          time: '21:30',
          image: '/images/nutrition/meals/herbal-tea.jpg'
        }
      ],
      waterIntake: 3300,
      workoutDetails: {
        type: 'Cyclisme',
        duration: 180, // minutes
        distance: 65, // km
        caloriesBurned: 2200
      },
      notes: 'Bonne journée, énergie stable pendant la sortie à vélo. Petit coup de fatigue en fin d\'après-midi.'
    }
  ]
};

// Catalogue de recettes pour cyclistes
export const recipes = [
  {
    id: 'pasta-chicken-pesto',
    name: 'Pâtes au poulet et pesto',
    category: 'pre-ride',
    prepTime: 15,
    cookTime: 20,
    servings: 4,
    difficulty: 'easy',
    image: '/images/nutrition/recipes/pasta-chicken-pesto.jpg',
    description: 'Un repas riche en glucides et protéines, idéal la veille d\'une sortie longue.',
    ingredients: [
      '400g de pâtes (préférablement penne ou fusilli)',
      '300g de blanc de poulet',
      '4 cuillères à soupe de pesto maison ou du commerce',
      '2 cuillères à soupe d\'huile d\'olive',
      '50g de parmesan râpé',
      '1 poignée de pignons de pin',
      'Sel et poivre noir fraîchement moulu'
    ],
    instructions: [
      'Faire cuire les pâtes al dente dans une grande casserole d\'eau salée.',
      'Pendant ce temps, couper le poulet en lanières et le faire sauter dans une poêle avec 1 cuillère à soupe d\'huile d\'olive jusqu\'à ce qu\'il soit bien cuit.',
      'Égoutter les pâtes en réservant un peu d\'eau de cuisson.',
      'Dans la casserole, mélanger les pâtes, le poulet, le pesto et un peu d\'eau de cuisson si nécessaire.',
      'Servir dans des assiettes et garnir de parmesan râpé et de pignons de pin légèrement torréfiés.'
    ],
    nutrition: {
      calories: 680,
      carbs: 80,
      proteins: 40,
      fats: 22
    },
    tags: ['carbs-loading', 'protein-rich', 'pre-ride']
  },
  {
    id: 'quinoa-bowl',
    name: 'Bowl de quinoa aux légumes rôtis',
    category: 'recovery',
    prepTime: 20,
    cookTime: 30,
    servings: 2,
    difficulty: 'medium',
    image: '/images/nutrition/recipes/quinoa-vegetable-bowl.jpg',
    description: 'Un repas complet et équilibré, parfait pour la récupération après l\'effort.',
    ingredients: [
      '150g de quinoa',
      '1 patate douce moyenne',
      '1 courgette',
      '1 poivron rouge',
      '1 oignon rouge',
      '2 cuillères à soupe d\'huile d\'olive',
      '1 avocat',
      '50g de feta',
      'Jus d\'un demi-citron',
      'Sel, poivre et herbes de Provence'
    ],
    instructions: [
      'Préchauffer le four à 200°C.',
      'Rincer le quinoa et le faire cuire selon les instructions du paquet.',
      'Couper tous les légumes en dés (sauf l\'avocat). Les disposer sur une plaque de cuisson, arroser d\'huile d\'olive, saupoudrer d\'herbes de Provence, de sel et de poivre.',
      'Enfourner les légumes pendant environ 25-30 minutes, en remuant à mi-cuisson.',
      'Couper l\'avocat en tranches.',
      'Dans un bol, disposer le quinoa, ajouter les légumes rôtis et les tranches d\'avocat.',
      'Émietter la feta sur le dessus et arroser de jus de citron.'
    ],
    nutrition: {
      calories: 520,
      carbs: 65,
      proteins: 18,
      fats: 24
    },
    tags: ['vegetarian', 'gluten-free', 'antioxidants', 'recovery']
  },
  {
    id: 'energy-balls',
    name: 'Energy balls aux dattes et noix',
    category: 'during-ride',
    prepTime: 15,
    cookTime: 0,
    servings: 12,
    difficulty: 'easy',
    image: '/images/nutrition/recipes/energy-balls.jpg',
    description: 'Collation énergétique facile à transporter pour vos sorties à vélo.',
    ingredients: [
      '200g de dattes dénoyautées',
      '100g d\'amandes',
      '50g de noix de cajou',
      '2 cuillères à soupe de beurre d\'amande',
      '2 cuillères à soupe de cacao en poudre non sucré',
      '1 cuillère à soupe de miel',
      '1 pincée de sel'
    ],
    instructions: [
      'Faire tremper les dattes dans de l\'eau chaude pendant 10 minutes si elles ne sont pas très tendres.',
      'Dans un robot culinaire, mixer les amandes et les noix de cajou jusqu\'à obtenir une texture grossière.',
      'Ajouter les dattes, le beurre d\'amande, le cacao, le miel et le sel. Mixer jusqu\'à obtenir une pâte collante.',
      'Former des boules d\'environ 3 cm de diamètre avec vos mains.',
      'Réfrigérer pendant au moins 1 heure avant de déguster.',
      'Conserver au réfrigérateur jusqu\'à 2 semaines ou congeler pour une conservation plus longue.'
    ],
    nutrition: {
      calories: 140,
      carbs: 15,
      proteins: 4,
      fats: 8
    },
    tags: ['snack', 'portable', 'natural-sugars', 'during-ride']
  }
];

export default {
  nutritionProfile,
  mealRecommendations,
  nutritionTracking,
  recipes
};
