/**
 * Configuration des catégories pour Velo-Altitude
 * 
 * Ce fichier centralise la configuration de toutes les catégories du site,
 * avec leurs filtres, options de tri, sous-catégories et métadonnées SEO.
 */

// Configuration des catégories principales
const categoriesConfig = {
  // Configuration de la catégorie COLS
  cols: {
    label: {
      fr: 'Cols',
      en: 'Mountain Passes'
    },
    description: {
      fr: 'Découvrez notre catalogue complet de cols à travers l\'Europe, avec profils d\'élévation, difficulté, météo et points d\'intérêt.',
      en: 'Explore our comprehensive catalog of mountain passes across Europe, with elevation profiles, difficulty, weather, and points of interest.'
    },
    filters: [
      {
        key: 'search',
        type: 'search',
        label: {
          fr: 'Rechercher un col',
          en: 'Search for a pass'
        }
      },
      {
        key: 'region',
        type: 'select',
        label: {
          fr: 'Région',
          en: 'Region'
        },
        options: [
          { value: 'alps', label: { fr: 'Alpes', en: 'Alps' } },
          { value: 'pyrenees', label: { fr: 'Pyrénées', en: 'Pyrenees' } },
          { value: 'massif-central', label: { fr: 'Massif Central', en: 'Massif Central' } },
          { value: 'jura', label: { fr: 'Jura', en: 'Jura' } },
          { value: 'vosges', label: { fr: 'Vosges', en: 'Vosges' } },
          { value: 'dolomites', label: { fr: 'Dolomites', en: 'Dolomites' } },
          { value: 'carpathians', label: { fr: 'Carpates', en: 'Carpathians' } }
        ]
      },
      {
        key: 'difficulty',
        type: 'select',
        label: {
          fr: 'Difficulté',
          en: 'Difficulty'
        },
        options: [
          { value: '1', label: { fr: 'Facile (1/5)', en: 'Easy (1/5)' } },
          { value: '2', label: { fr: 'Modérée (2/5)', en: 'Moderate (2/5)' } },
          { value: '3', label: { fr: 'Intermédiaire (3/5)', en: 'Intermediate (3/5)' } },
          { value: '4', label: { fr: 'Difficile (4/5)', en: 'Difficult (4/5)' } },
          { value: '5', label: { fr: 'Très difficile (5/5)', en: 'Very difficult (5/5)' } }
        ]
      },
      {
        key: 'altitude',
        type: 'range',
        label: {
          fr: 'Altitude',
          en: 'Altitude'
        },
        min: 500,
        max: 3000,
        step: 100,
        unit: 'm'
      },
      {
        key: 'length',
        type: 'range',
        label: {
          fr: 'Longueur',
          en: 'Length'
        },
        min: 0,
        max: 30,
        step: 1,
        unit: 'km'
      },
      {
        key: 'gradient',
        type: 'range',
        label: {
          fr: 'Pente moyenne',
          en: 'Average gradient'
        },
        min: 4,
        max: 12,
        step: 0.5,
        unit: '%'
      }
    ],
    sortOptions: [
      { value: 'featured', label: { fr: 'Recommandés', en: 'Featured' } },
      { value: 'name_asc', label: { fr: 'Nom (A-Z)', en: 'Name (A-Z)' } },
      { value: 'name_desc', label: { fr: 'Nom (Z-A)', en: 'Name (Z-A)' } },
      { value: 'altitude_desc', label: { fr: 'Altitude (décroissante)', en: 'Altitude (descending)' } },
      { value: 'altitude_asc', label: { fr: 'Altitude (croissante)', en: 'Altitude (ascending)' } },
      { value: 'difficulty_desc', label: { fr: 'Difficulté (décroissante)', en: 'Difficulty (descending)' } },
      { value: 'difficulty_asc', label: { fr: 'Difficulté (croissante)', en: 'Difficulty (ascending)' } }
    ],
    subcategories: [
      {
        key: 'alps',
        label: {
          fr: 'Alpes',
          en: 'Alps'
        },
        description: {
          fr: 'Découvrez les cols mythiques des Alpes françaises, italiennes et suisses, dont certains des plus hauts sommets d\'Europe accessibles à vélo.',
          en: 'Discover the mythical passes of the French, Italian and Swiss Alps, including some of the highest peaks in Europe accessible by bike.'
        }
      },
      {
        key: 'pyrenees',
        label: {
          fr: 'Pyrénées',
          en: 'Pyrenees'
        },
        description: {
          fr: 'Explorez les cols emblématiques des Pyrénées, chaîne montagneuse formant une frontière naturelle entre la France et l\'Espagne.',
          en: 'Explore the iconic passes of the Pyrenees, a mountain range forming a natural border between France and Spain.'
        }
      },
      {
        key: 'famous',
        label: {
          fr: 'Cols mythiques',
          en: 'Famous passes'
        },
        description: {
          fr: 'Les cols les plus emblématiques du cyclisme, rendus célèbres par les grands tours et les courses professionnelles.',
          en: 'The most iconic cycling passes, made famous by grand tours and professional races.'
        }
      },
      {
        key: 'easy',
        label: {
          fr: 'Cols faciles',
          en: 'Easy passes'
        },
        description: {
          fr: 'Cols accessibles aux cyclistes débutants ou intermédiaires, parfaits pour s\'initier au cyclisme de montagne.',
          en: 'Passes accessible to beginner or intermediate cyclists, perfect for getting into mountain cycling.'
        }
      },
      {
        key: 'challenge',
        label: {
          fr: 'Cols difficiles',
          en: 'Challenging passes'
        },
        description: {
          fr: 'Les cols les plus redoutables, représentant un véritable défi même pour les cyclistes expérimentés.',
          en: 'The most formidable passes, representing a real challenge even for experienced cyclists.'
        }
      }
    ]
  },
  
  // Configuration de la catégorie PROGRAMS (Programmes d'entraînement)
  programs: {
    label: {
      fr: 'Programmes d\'entraînement',
      en: 'Training Programs'
    },
    description: {
      fr: 'Programmes d\'entraînement spécifiques pour préparer l\'ascension des cols, développés par des experts du cyclisme de montagne.',
      en: 'Specific training programs to prepare for climbing mountain passes, developed by mountain cycling experts.'
    },
    filters: [
      {
        key: 'search',
        type: 'search',
        label: {
          fr: 'Rechercher un programme',
          en: 'Search for a program'
        }
      },
      {
        key: 'level',
        type: 'select',
        label: {
          fr: 'Niveau',
          en: 'Level'
        },
        options: [
          { value: '1', label: { fr: 'Débutant (1/5)', en: 'Beginner (1/5)' } },
          { value: '2', label: { fr: 'Intermédiaire bas (2/5)', en: 'Low intermediate (2/5)' } },
          { value: '3', label: { fr: 'Intermédiaire (3/5)', en: 'Intermediate (3/5)' } },
          { value: '4', label: { fr: 'Avancé (4/5)', en: 'Advanced (4/5)' } },
          { value: '5', label: { fr: 'Expert (5/5)', en: 'Expert (5/5)' } }
        ]
      },
      {
        key: 'duration',
        type: 'select',
        label: {
          fr: 'Durée',
          en: 'Duration'
        },
        options: [
          { value: '4', label: { fr: '4 semaines', en: '4 weeks' } },
          { value: '6', label: { fr: '6 semaines', en: '6 weeks' } },
          { value: '8', label: { fr: '8 semaines', en: '8 weeks' } },
          { value: '12', label: { fr: '12 semaines', en: '12 weeks' } },
          { value: '16', label: { fr: '16 semaines', en: '16 weeks' } }
        ]
      },
      {
        key: 'goal',
        type: 'multiSelect',
        label: {
          fr: 'Objectif',
          en: 'Goal'
        },
        options: [
          { value: 'endurance', label: { fr: 'Endurance', en: 'Endurance' } },
          { value: 'power', label: { fr: 'Puissance', en: 'Power' } },
          { value: 'climbing', label: { fr: 'Escalade', en: 'Climbing' } },
          { value: 'recovery', label: { fr: 'Récupération', en: 'Recovery' } },
          { value: 'weight-loss', label: { fr: 'Perte de poids', en: 'Weight loss' } }
        ]
      }
    ],
    sortOptions: [
      { value: 'featured', label: { fr: 'Recommandés', en: 'Featured' } },
      { value: 'name_asc', label: { fr: 'Nom (A-Z)', en: 'Name (A-Z)' } },
      { value: 'name_desc', label: { fr: 'Nom (Z-A)', en: 'Name (Z-A)' } },
      { value: 'level_asc', label: { fr: 'Niveau (croissant)', en: 'Level (ascending)' } },
      { value: 'level_desc', label: { fr: 'Niveau (décroissant)', en: 'Level (descending)' } },
      { value: 'duration_asc', label: { fr: 'Durée (croissante)', en: 'Duration (ascending)' } },
      { value: 'duration_desc', label: { fr: 'Durée (décroissante)', en: 'Duration (descending)' } }
    ],
    subcategories: [
      {
        key: 'col-specific',
        label: {
          fr: 'Spécifique cols',
          en: 'Pass specific'
        },
        description: {
          fr: 'Programmes d\'entraînement spécialement conçus pour préparer l\'ascension des cols de montagne.',
          en: 'Training programs specifically designed to prepare for climbing mountain passes.'
        }
      },
      {
        key: 'beginner',
        label: {
          fr: 'Débutants',
          en: 'Beginners'
        },
        description: {
          fr: 'Programmes adaptés aux cyclistes débutants souhaitant s\'initier à l\'ascension des cols.',
          en: 'Programs adapted for beginner cyclists looking to get started with climbing passes.'
        }
      },
      {
        key: 'advanced',
        label: {
          fr: 'Avancés',
          en: 'Advanced'
        },
        description: {
          fr: 'Programmes intensifs pour cyclistes confirmés cherchant à améliorer leurs performances en montagne.',
          en: 'Intensive programs for confirmed cyclists looking to improve their mountain performance.'
        }
      },
      {
        key: 'recovery',
        label: {
          fr: 'Récupération',
          en: 'Recovery'
        },
        description: {
          fr: 'Programmes de récupération et de maintien de la forme entre les périodes d\'entraînement intense.',
          en: 'Recovery and fitness maintenance programs between intense training periods.'
        }
      }
    ]
  },
  
  // Configuration de la catégorie NUTRITION
  nutrition: {
    label: {
      fr: 'Nutrition',
      en: 'Nutrition'
    },
    description: {
      fr: 'Recettes et plans nutritionnels adaptés aux besoins des cyclistes de montagne, pour optimiser performance et récupération.',
      en: 'Recipes and nutritional plans adapted to the needs of mountain cyclists, to optimize performance and recovery.'
    },
    filters: [
      {
        key: 'search',
        type: 'search',
        label: {
          fr: 'Rechercher',
          en: 'Search'
        }
      },
      {
        key: 'type',
        type: 'select',
        label: {
          fr: 'Type',
          en: 'Type'
        },
        options: [
          { value: 'recipe', label: { fr: 'Recette', en: 'Recipe' } },
          { value: 'plan', label: { fr: 'Plan nutritionnel', en: 'Nutritional plan' } },
          { value: 'supplement', label: { fr: 'Supplément', en: 'Supplement' } }
        ]
      },
      {
        key: 'timing',
        type: 'select',
        label: {
          fr: 'Moment',
          en: 'Timing'
        },
        options: [
          { value: 'before', label: { fr: 'Avant effort', en: 'Before effort' } },
          { value: 'during', label: { fr: 'Pendant effort', en: 'During effort' } },
          { value: 'after', label: { fr: 'Après effort', en: 'After effort' } },
          { value: 'daily', label: { fr: 'Quotidien', en: 'Daily' } }
        ]
      },
      {
        key: 'prepTime',
        type: 'range',
        label: {
          fr: 'Temps de préparation',
          en: 'Preparation time'
        },
        min: 0,
        max: 60,
        step: 5,
        unit: 'min'
      },
      {
        key: 'dietary',
        type: 'multiSelect',
        label: {
          fr: 'Régime alimentaire',
          en: 'Dietary restrictions'
        },
        options: [
          { value: 'vegetarian', label: { fr: 'Végétarien', en: 'Vegetarian' } },
          { value: 'vegan', label: { fr: 'Végétalien', en: 'Vegan' } },
          { value: 'gluten-free', label: { fr: 'Sans gluten', en: 'Gluten-free' } },
          { value: 'dairy-free', label: { fr: 'Sans lactose', en: 'Dairy-free' } },
          { value: 'high-protein', label: { fr: 'Riche en protéines', en: 'High-protein' } },
          { value: 'low-carb', label: { fr: 'Faible en glucides', en: 'Low-carb' } }
        ]
      }
    ],
    sortOptions: [
      { value: 'featured', label: { fr: 'Recommandés', en: 'Featured' } },
      { value: 'name_asc', label: { fr: 'Nom (A-Z)', en: 'Name (A-Z)' } },
      { value: 'name_desc', label: { fr: 'Nom (Z-A)', en: 'Name (Z-A)' } },
      { value: 'prepTime_asc', label: { fr: 'Temps de préparation (croissant)', en: 'Prep time (ascending)' } },
      { value: 'calories_asc', label: { fr: 'Calories (croissant)', en: 'Calories (ascending)' } },
      { value: 'date_desc', label: { fr: 'Plus récents', en: 'Most recent' } }
    ],
    subcategories: [
      {
        key: 'cycling-specific',
        label: {
          fr: 'Spécifique cyclisme',
          en: 'Cycling specific'
        },
        description: {
          fr: 'Recettes et plans nutritionnels spécifiquement conçus pour les besoins des cyclistes.',
          en: 'Recipes and nutritional plans specifically designed for cyclists\' needs.'
        }
      },
      {
        key: 'col-day',
        label: {
          fr: 'Jour de col',
          en: 'Pass day'
        },
        description: {
          fr: 'Nutrition optimale pour le jour d\'ascension d\'un col: avant, pendant et après l\'effort.',
          en: 'Optimal nutrition for pass climbing day: before, during, and after the effort.'
        }
      },
      {
        key: 'recovery',
        label: {
          fr: 'Récupération',
          en: 'Recovery'
        },
        description: {
          fr: 'Nutrition spécialisée pour optimiser la récupération après des efforts intenses en montagne.',
          en: 'Specialized nutrition to optimize recovery after intense mountain efforts.'
        }
      },
      {
        key: 'long-distance',
        label: {
          fr: 'Longue distance',
          en: 'Long distance'
        },
        description: {
          fr: 'Stratégies nutritionnelles pour les défis d\'endurance et les sorties longue distance.',
          en: 'Nutritional strategies for endurance challenges and long-distance rides.'
        }
      }
    ]
  },
  
  // Configuration de la catégorie CHALLENGES (Défis)
  challenges: {
    label: {
      fr: 'Défis',
      en: 'Challenges'
    },
    description: {
      fr: 'Défis cyclistes variés, du concept unique "Les 7 Majeurs" aux challenges régionaux à travers les plus beaux cols d\'Europe.',
      en: 'Various cycling challenges, from the unique "The 7 Majors" concept to regional challenges across Europe\'s most beautiful passes.'
    },
    filters: [
      {
        key: 'search',
        type: 'search',
        label: {
          fr: 'Rechercher un défi',
          en: 'Search for a challenge'
        }
      },
      {
        key: 'difficulty',
        type: 'select',
        label: {
          fr: 'Difficulté',
          en: 'Difficulty'
        },
        options: [
          { value: '1', label: { fr: 'Facile (1/5)', en: 'Easy (1/5)' } },
          { value: '2', label: { fr: 'Modérée (2/5)', en: 'Moderate (2/5)' } },
          { value: '3', label: { fr: 'Intermédiaire (3/5)', en: 'Intermediate (3/5)' } },
          { value: '4', label: { fr: 'Difficile (4/5)', en: 'Difficult (4/5)' } },
          { value: '5', label: { fr: 'Très difficile (5/5)', en: 'Very difficult (5/5)' } }
        ]
      },
      {
        key: 'region',
        type: 'select',
        label: {
          fr: 'Région',
          en: 'Region'
        },
        options: [
          { value: 'alps', label: { fr: 'Alpes', en: 'Alps' } },
          { value: 'pyrenees', label: { fr: 'Pyrénées', en: 'Pyrenees' } },
          { value: 'massif-central', label: { fr: 'Massif Central', en: 'Massif Central' } },
          { value: 'europe', label: { fr: 'Europe', en: 'Europe' } }
        ]
      },
      {
        key: 'colCount',
        type: 'range',
        label: {
          fr: 'Nombre de cols',
          en: 'Number of passes'
        },
        min: 1,
        max: 10,
        step: 1
      },
      {
        key: 'totalDistance',
        type: 'range',
        label: {
          fr: 'Distance totale',
          en: 'Total distance'
        },
        min: 0,
        max: 500,
        step: 50,
        unit: 'km'
      }
    ],
    sortOptions: [
      { value: 'featured', label: { fr: 'Recommandés', en: 'Featured' } },
      { value: 'name_asc', label: { fr: 'Nom (A-Z)', en: 'Name (A-Z)' } },
      { value: 'name_desc', label: { fr: 'Nom (Z-A)', en: 'Name (Z-A)' } },
      { value: 'difficulty_asc', label: { fr: 'Difficulté (croissante)', en: 'Difficulty (ascending)' } },
      { value: 'difficulty_desc', label: { fr: 'Difficulté (décroissante)', en: 'Difficulty (descending)' } },
      { value: 'colCount_desc', label: { fr: 'Nombre de cols (décroissant)', en: 'Number of passes (descending)' } }
    ],
    subcategories: [
      {
        key: 'seven-majors',
        label: {
          fr: 'Les 7 Majeurs',
          en: 'The 7 Majors'
        },
        description: {
          fr: 'Notre concept unique permettant de créer votre propre défi en sélectionnant 7 cols prestigieux à conquérir.',
          en: 'Our unique concept allowing you to create your own challenge by selecting 7 prestigious passes to conquer.'
        }
      },
      {
        key: 'alps',
        label: {
          fr: 'Alpes',
          en: 'Alps'
        },
        description: {
          fr: 'Défis regroupant les plus beaux cols des Alpes françaises, suisses et italiennes.',
          en: 'Challenges featuring the most beautiful passes of the French, Swiss, and Italian Alps.'
        }
      },
      {
        key: 'pyrenees',
        label: {
          fr: 'Pyrénées',
          en: 'Pyrenees'
        },
        description: {
          fr: 'Défis à travers les cols emblématiques des Pyrénées.',
          en: 'Challenges across the iconic passes of the Pyrenees.'
        }
      },
      {
        key: 'tour-inspired',
        label: {
          fr: 'Inspirés du Tour',
          en: 'Tour inspired'
        },
        description: {
          fr: 'Défis inspirés des étapes mythiques du Tour de France et des grands tours.',
          en: 'Challenges inspired by mythical stages of the Tour de France and grand tours.'
        }
      }
    ]
  }
};

/**
 * Fonction pour récupérer la configuration d'une catégorie
 * @param {string} category - Clé de la catégorie
 * @returns {Object} Configuration de la catégorie
 */
export const getCategoryConfig = (category) => {
  return categoriesConfig[category] || null;
};

/**
 * Fonction pour récupérer toutes les catégories
 * @returns {Object} Toutes les configurations de catégories
 */
export const getAllCategories = () => {
  return categoriesConfig;
};

export default {
  getCategoryConfig,
  getAllCategories
};
