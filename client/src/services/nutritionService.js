/**
 * Service de gestion des données de nutrition pour les cyclistes
 * Fournit les fonctions pour récupérer et mettre à jour les données nutritionnelles
 */

// URL de base pour les appels API
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Service pour la gestion des données de nutrition
 */
class NutritionService {
  /**
   * Récupère les données de nutrition d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} - Données nutritionnelles de l'utilisateur
   */
  async getUserNutritionData(userId) {
    try {
      if (!userId) {
        throw new Error('ID utilisateur requis');
      }

      // Simulation d'appel API avec données fictives
      // À remplacer par un appel réel à l'API
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            dailyIntake: {
              calories: 2800,
              carbs: 350, // en grammes
              protein: 120, // en grammes
              fat: 80, // en grammes
              hydration: 3.5 // en litres
            },
            metrics: {
              weight: 75, // en kg
              height: 180, // en cm
              bodyFat: 12, // en pourcentage
              basalMetabolicRate: 1700 // en calories
            },
            goals: {
              type: 'performance', // performance, weight-loss, maintenance
              weeklyCalories: 19600,
              calorieSurplusOnRideDays: 800,
              calorieDeficitOnRestDays: 200
            },
            mealPlans: [
              {
                id: 'mp001',
                name: 'Plan Haute Intensité',
                type: 'ride-day',
                meals: [
                  {
                    type: 'breakfast',
                    items: [
                      { name: 'Flocons d\'avoine', quantity: '100g', calories: 370, carbs: 65, protein: 10, fat: 7 },
                      { name: 'Banane', quantity: '1', calories: 105, carbs: 27, protein: 1, fat: 0 },
                      { name: 'Lait d\'amande', quantity: '250ml', calories: 35, carbs: 1, protein: 1, fat: 3 },
                      { name: 'Miel', quantity: '15g', calories: 45, carbs: 12, protein: 0, fat: 0 }
                    ]
                  },
                  {
                    type: 'pre-ride',
                    items: [
                      { name: 'Pain complet', quantity: '2 tranches', calories: 160, carbs: 30, protein: 8, fat: 2 },
                      { name: 'Beurre d\'amande', quantity: '30g', calories: 190, carbs: 6, protein: 7, fat: 16 },
                      { name: 'Banane', quantity: '1', calories: 105, carbs: 27, protein: 1, fat: 0 }
                    ]
                  },
                  {
                    type: 'during-ride',
                    items: [
                      { name: 'Barre énergétique', quantity: '2', calories: 440, carbs: 64, protein: 10, fat: 16 },
                      { name: 'Gel énergétique', quantity: '2', calories: 200, carbs: 50, protein: 0, fat: 0 },
                      { name: 'Boisson électrolytes', quantity: '750ml', calories: 150, carbs: 38, protein: 0, fat: 0 }
                    ]
                  },
                  {
                    type: 'post-ride',
                    items: [
                      { name: 'Boisson protéinée', quantity: '500ml', calories: 280, carbs: 30, protein: 25, fat: 8 },
                      { name: 'Banane', quantity: '1', calories: 105, carbs: 27, protein: 1, fat: 0 }
                    ]
                  },
                  {
                    type: 'dinner',
                    items: [
                      { name: 'Poulet grillé', quantity: '200g', calories: 330, carbs: 0, protein: 62, fat: 10 },
                      { name: 'Riz brun', quantity: '150g', calories: 160, carbs: 35, protein: 3, fat: 1 },
                      { name: 'Légumes variés', quantity: '200g', calories: 70, carbs: 12, protein: 4, fat: 1 },
                      { name: 'Huile d\'olive', quantity: '15ml', calories: 120, carbs: 0, protein: 0, fat: 14 }
                    ]
                  }
                ]
              },
              {
                id: 'mp002',
                name: 'Plan Récupération',
                type: 'recovery-day',
                meals: [
                  {
                    type: 'breakfast',
                    items: [
                      { name: 'Œufs', quantity: '3', calories: 215, carbs: 1, protein: 18, fat: 15 },
                      { name: 'Pain complet', quantity: '1 tranche', calories: 80, carbs: 15, protein: 4, fat: 1 },
                      { name: 'Avocat', quantity: '1/2', calories: 160, carbs: 8, protein: 2, fat: 15 }
                    ]
                  },
                  {
                    type: 'lunch',
                    items: [
                      { name: 'Salade de quinoa', quantity: '200g', calories: 280, carbs: 40, protein: 12, fat: 8 },
                      { name: 'Saumon', quantity: '125g', calories: 240, carbs: 0, protein: 36, fat: 12 },
                      { name: 'Légumes variés', quantity: '150g', calories: 50, carbs: 9, protein: 3, fat: 1 }
                    ]
                  },
                  {
                    type: 'snack',
                    items: [
                      { name: 'Yaourt grec', quantity: '150g', calories: 135, carbs: 5, protein: 12, fat: 8 },
                      { name: 'Baies', quantity: '50g', calories: 30, carbs: 7, protein: 1, fat: 0 },
                      { name: 'Noix', quantity: '30g', calories: 190, carbs: 4, protein: 6, fat: 18 }
                    ]
                  },
                  {
                    type: 'dinner',
                    items: [
                      { name: 'Poulet rôti', quantity: '150g', calories: 250, carbs: 0, protein: 47, fat: 7 },
                      { name: 'Patate douce', quantity: '150g', calories: 130, carbs: 30, protein: 2, fat: 0 },
                      { name: 'Légumes verts', quantity: '200g', calories: 70, carbs: 12, protein: 4, fat: 1 }
                    ]
                  }
                ]
              }
            ],
            recommendations: [
              {
                id: 'rec001',
                type: 'pre-ride',
                title: 'Avant l\'effort',
                description: 'Consommez 1-4g de glucides par kg de poids corporel 1-4 heures avant l\'effort pour optimiser les réserves de glycogène.',
                foods: ['Flocons d\'avoine', 'Banane', 'Pain complet', 'Miel', 'Riz']
              },
              {
                id: 'rec002',
                type: 'during-ride',
                title: 'Pendant l\'effort',
                description: 'Pour les efforts > 90 minutes, consommez 30-60g de glucides par heure pour maintenir la glycémie.',
                foods: ['Barres énergétiques', 'Gels', 'Boissons sportives', 'Bananes']
              },
              {
                id: 'rec003',
                type: 'post-ride',
                title: 'Après l\'effort',
                description: 'Consommez des protéines (20-25g) et des glucides (1g/kg) dans les 30-60 minutes après l\'effort pour optimiser la récupération.',
                foods: ['Boisson protéinée', 'Yaourt grec', 'Œufs', 'Smoothie récupération']
              },
              {
                id: 'rec004',
                type: 'hydration',
                title: 'Hydratation',
                description: 'Buvez 500-750ml par heure d\'effort selon les conditions climatiques et votre taux de transpiration.',
                foods: ['Eau', 'Boissons électrolytes', 'Boissons isotoniques']
              }
            ],
            activityLog: [
              {
                date: '2024-04-01',
                calories: {
                  consumed: 2950,
                  burned: 3200,
                  balance: -250
                },
                nutrients: {
                  carbs: 370, // en grammes
                  protein: 130, // en grammes
                  fat: 85 // en grammes
                },
                hydration: 3.8, // en litres
                notes: 'Sortie longue, bonne gestion de la nutrition pendant l\'effort'
              },
              {
                date: '2024-04-02',
                calories: {
                  consumed: 2600,
                  burned: 2400,
                  balance: 200
                },
                nutrients: {
                  carbs: 320, // en grammes
                  protein: 135, // en grammes
                  fat: 75 // en grammes
                },
                hydration: 3.2, // en litres
                notes: 'Jour de récupération, focus sur les protéines'
              }
            ]
          });
        }, 800);
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des données de nutrition:', error);
      throw error;
    }
  }

  /**
   * Enregistre un repas dans le journal alimentaire
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} mealData - Données du repas
   * @returns {Promise<Object>} - Confirmation d'enregistrement
   */
  async logMeal(userId, mealData) {
    try {
      if (!userId) {
        throw new Error('ID utilisateur requis');
      }

      if (!mealData || !mealData.type || !mealData.items || !Array.isArray(mealData.items)) {
        throw new Error('Données de repas invalides');
      }

      // Simulation d'appel API
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            message: 'Repas enregistré avec succès',
            mealId: `meal-${Date.now()}`
          });
        }, 500);
      });
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du repas:', error);
      throw error;
    }
  }

  /**
   * Récupère les plans de repas recommandés pour un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {string} type - Type de plan (ride-day, recovery-day, etc.)
   * @returns {Promise<Array>} - Plans de repas recommandés
   */
  async getMealPlans(userId, type = null) {
    try {
      if (!userId) {
        throw new Error('ID utilisateur requis');
      }

      // Simulation d'appel API
      return new Promise((resolve) => {
        setTimeout(() => {
          // Récupération des données fictives
          const userData = {
            mealPlans: [
              {
                id: 'mp001',
                name: 'Plan Haute Intensité',
                type: 'ride-day',
                totalCalories: 2500,
                macros: { carbs: 65, protein: 20, fat: 15 }
              },
              {
                id: 'mp002',
                name: 'Plan Récupération',
                type: 'recovery-day',
                totalCalories: 2100,
                macros: { carbs: 45, protein: 30, fat: 25 }
              },
              {
                id: 'mp003',
                name: 'Plan Sortie Longue',
                type: 'ride-day',
                totalCalories: 3200,
                macros: { carbs: 70, protein: 15, fat: 15 }
              }
            ]
          };

          // Filtrer par type si spécifié
          const plans = type 
            ? userData.mealPlans.filter(plan => plan.type === type) 
            : userData.mealPlans;

          resolve(plans);
        }, 600);
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des plans de repas:', error);
      throw error;
    }
  }

  /**
   * Calcule les besoins nutritionnels en fonction des paramètres utilisateur
   * @param {Object} userData - Données utilisateur (poids, taille, etc.)
   * @param {Object} activityData - Données d'activité (durée, intensité, etc.)
   * @returns {Promise<Object>} - Besoins nutritionnels calculés
   */
  async calculateNutrition(userData, activityData) {
    try {
      if (!userData || !userData.weight || !userData.height || !userData.age || !userData.gender) {
        throw new Error('Données utilisateur incomplètes');
      }

      if (!activityData || !activityData.activityLevel || !activityData.goals) {
        throw new Error('Données d\'activité incomplètes');
      }

      // Simulation du calcul
      return new Promise((resolve) => {
        setTimeout(() => {
          // Calcul du métabolisme de base (BMR) avec la formule de Mifflin-St Jeor
          let bmr;
          if (userData.gender === 'male') {
            bmr = 10 * userData.weight + 6.25 * userData.height - 5 * userData.age + 5;
          } else {
            bmr = 10 * userData.weight + 6.25 * userData.height - 5 * userData.age - 161;
          }

          // Facteur d'activité
          const activityFactors = {
            sedentary: 1.2,
            lightlyActive: 1.375,
            moderatelyActive: 1.55,
            veryActive: 1.725,
            extremelyActive: 1.9
          };

          const factor = activityFactors[activityData.activityLevel] || 1.55;
          const tdee = Math.round(bmr * factor); // Total Daily Energy Expenditure

          // Ajustement selon l'objectif
          let adjustedCalories;
          switch (activityData.goals) {
            case 'weightLoss':
              adjustedCalories = Math.round(tdee * 0.85); // Déficit de 15%
              break;
            case 'performance':
              adjustedCalories = Math.round(tdee * 1.1); // Surplus de 10%
              break;
            case 'maintenance':
            default:
              adjustedCalories = tdee;
          }

          // Répartition des macronutriments selon l'objectif
          let macros;
          switch (activityData.goals) {
            case 'weightLoss':
              macros = { carbs: 40, protein: 35, fat: 25 }; // Plus de protéines pour préserver la masse musculaire
              break;
            case 'performance':
              macros = { carbs: 60, protein: 20, fat: 20 }; // Plus de glucides pour l'énergie pendant l'effort
              break;
            case 'maintenance':
            default:
              macros = { carbs: 50, protein: 25, fat: 25 }; // Équilibre standard
          }

          // Calcul des grammes de chaque macronutriment en tenant compte des calories par gramme
          // Glucides: 4 cal/g, Protéines: 4 cal/g, Lipides: 9 cal/g
          const carbsGrams = Math.round((adjustedCalories * (macros.carbs / 100)) / 4);
          const proteinGrams = Math.round((adjustedCalories * (macros.protein / 100)) / 4);
          const fatGrams = Math.round((adjustedCalories * (macros.fat / 100)) / 9);

          // Vérification que le total des calories calculées correspond bien aux calories ajustées
          const calculatedCalories = (carbsGrams * 4) + (proteinGrams * 4) + (fatGrams * 9);
          
          // Ajustement des glucides si nécessaire pour correspondre aux calories totales
          let adjustedCarbsGrams = carbsGrams;
          if (Math.abs(calculatedCalories - adjustedCalories) > 50) {
            adjustedCarbsGrams = carbsGrams + Math.round((adjustedCalories - calculatedCalories) / 4);
          }

          // Hydratation quotidienne de base (en litres) - 35ml par kg de poids corporel
          const baseHydration = Math.round(userData.weight * 0.035 * 100) / 100;
          
          // Hydratation pour l'entraînement (en litres supplémentaires)
          // Environ 750ml par heure d'entraînement
          let trainingHydration = 0;
          if (activityData.trainingDuration) {
            trainingHydration = Math.round((activityData.trainingDuration / 60) * 0.75 * 100) / 100;
          }

          resolve({
            dailyCalories: adjustedCalories,
            macronutrients: {
              carbs: {
                percentage: macros.carbs,
                grams: adjustedCarbsGrams
              },
              protein: {
                percentage: macros.protein,
                grams: proteinGrams
              },
              fat: {
                percentage: macros.fat,
                grams: fatGrams
              }
            },
            hydration: {
              base: baseHydration,
              training: trainingHydration,
              total: Math.round((baseHydration + trainingHydration) * 100) / 100
            },
            bmr: Math.round(bmr),
            tdee: tdee
          });
        }, 700);
      });
    } catch (error) {
      console.error('Erreur lors du calcul des besoins nutritionnels:', error);
      throw error;
    }
  }

  /**
   * Récupère toutes les recettes disponibles pour les cyclistes
   * @returns {Promise<Array>} Liste des recettes disponibles
   */
  async getRecipes() {
    // Simulation d'un appel API
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.getMockRecipes());
      }, 500);
    });
  }

  /**
   * Récupère les recettes favorites d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Array>} Liste des recettes favorites
   */
  async getUserFavoriteRecipes(userId) {
    // Simulation d'un appel API
    return new Promise((resolve) => {
      // Simuler les données de favoris stockées en backend
      const mockFavoriteIds = ['recipe-1', 'recipe-4', 'recipe-7'];
      
      setTimeout(() => {
        // Récupérer les recettes complètes correspondant aux IDs favoris
        const favorites = this.getMockRecipes().filter(recipe => 
          mockFavoriteIds.includes(recipe.id)
        );
        resolve(favorites);
      }, 300);
    });
  }

  /**
   * Ajoute une recette aux favoris d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {string} recipeId - ID de la recette à ajouter
   * @returns {Promise<void>}
   */
  async addToFavorites(userId, recipeId) {
    // Simulation d'un appel API POST
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Recette ${recipeId} ajoutée aux favoris de l'utilisateur ${userId}`);
        resolve({ success: true });
      }, 300);
    });
  }

  /**
   * Retire une recette des favoris d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {string} recipeId - ID de la recette à retirer
   * @returns {Promise<void>}
   */
  async removeFromFavorites(userId, recipeId) {
    // Simulation d'un appel API DELETE
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Recette ${recipeId} retirée des favoris de l'utilisateur ${userId}`);
        resolve({ success: true });
      }, 300);
    });
  }

  /**
   * Génère des recettes mockées pour les tests
   * @returns {Array} Liste de recettes mockées
   */
  getMockRecipes() {
    return [
      {
        id: 'recipe-1',
        name: 'Porridge énergétique aux fruits',
        description: 'Un petit-déjeuner riche en glucides complexes pour préparer votre organisme à l\'effort. Idéal avant une sortie matinale.',
        image: 'https://images.unsplash.com/photo-1565299999261-751e7b18aaa5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        prepTimeMinutes: 10,
        difficulty: 'easy',
        mealType: 'breakfast',
        dietaryTags: ['vegetarian', 'high-carb'],
        ingredients: [
          { name: 'Flocons d\'avoine', quantity: '60g' },
          { name: 'Lait ou boisson végétale', quantity: '250ml' },
          { name: 'Banane', quantity: '1' },
          { name: 'Fruits rouges', quantity: '100g' },
          { name: 'Miel', quantity: '1 cuillère à soupe' },
          { name: 'Graines de chia', quantity: '1 cuillère à soupe' }
        ],
        instructions: [
          'Dans une casserole, mélangez les flocons d\'avoine et le lait.',
          'Faites chauffer à feu moyen en remuant régulièrement jusqu\'à épaississement.',
          'Pendant ce temps, coupez la banane en rondelles.',
          'Une fois le porridge cuit, ajoutez la banane, les fruits rouges, le miel et les graines de chia.',
          'Mélangez et servez chaud.'
        ],
        nutrition: {
          calories: 450,
          carbs: 80,
          protein: 12,
          fat: 8
        },
        cyclingNotes: 'Consommez ce porridge 2-3h avant une sortie longue. Les glucides complexes des flocons d\'avoine libèrent progressivement de l\'énergie et vous éviteront les coups de pompe.'
      },
      {
        id: 'recipe-2',
        name: 'Barres énergétiques maison',
        description: 'Des barres faciles à transporter et à consommer pendant l\'effort, idéales pour les sorties longues.',
        image: 'https://images.unsplash.com/photo-1490567674076-8bd264180bf6?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        prepTimeMinutes: 25,
        difficulty: 'medium',
        mealType: 'during-ride',
        dietaryTags: ['vegetarian', 'high-carb'],
        ingredients: [
          { name: 'Flocons d\'avoine', quantity: '150g' },
          { name: 'Miel', quantity: '80g' },
          { name: 'Beurre de cacahuète', quantity: '50g' },
          { name: 'Dattes dénoyautées', quantity: '100g' },
          { name: 'Bananes mûres', quantity: '2' },
          { name: 'Pépites de chocolat noir', quantity: '50g' }
        ],
        instructions: [
          'Préchauffez le four à 180°C.',
          'Mixez les dattes avec les bananes jusqu\'à obtenir une purée homogène.',
          'Dans un grand bol, mélangez les flocons d\'avoine, le miel et le beurre de cacahuète.',
          'Ajoutez la purée de dattes et bananes, puis les pépites de chocolat. Mélangez bien.',
          'Étalez le mélange dans un moule carré tapissé de papier cuisson en tassant bien.',
          'Enfournez pour 15 minutes jusqu\'à ce que les bords soient dorés.',
          'Laissez refroidir complètement puis découpez en barres.'
        ],
        nutrition: {
          calories: 180,
          carbs: 30,
          protein: 5,
          fat: 6
        },
        cyclingNotes: 'Emballez chaque barre individuellement dans du papier sulfurisé pour les transporter facilement. Consommez une barre toutes les 45-60 minutes pendant l\'effort pour maintenir votre niveau d\'énergie.'
      },
      {
        id: 'recipe-3',
        name: 'Shake de récupération protéiné',
        description: 'Un shake complet pour optimiser votre récupération musculaire après l\'effort.',
        image: 'https://images.unsplash.com/photo-1553530666-ba11a90bb110?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        prepTimeMinutes: 5,
        difficulty: 'easy',
        mealType: 'post-ride',
        dietaryTags: ['high-protein'],
        ingredients: [
          { name: 'Lait ou boisson végétale', quantity: '250ml' },
          { name: 'Poudre de protéine whey ou végétale', quantity: '30g (1 mesure)' },
          { name: 'Banane', quantity: '1' },
          { name: 'Flocons d\'avoine', quantity: '20g' },
          { name: 'Miel', quantity: '1 cuillère à café' },
          { name: 'Glaçons', quantity: '4-5' }
        ],
        instructions: [
          'Placez tous les ingrédients dans un blender.',
          'Mixez à haute vitesse jusqu\'à obtenir une texture homogène.',
          'Servez immédiatement.'
        ],
        nutrition: {
          calories: 350,
          carbs: 40,
          protein: 30,
          fat: 5
        },
        cyclingNotes: 'Consommez ce shake dans les 30 minutes suivant votre effort pour maximiser la récupération musculaire. Le ratio protéines/glucides idéal favorise la reconstruction musculaire et la reconstitution des réserves de glycogène.'
      },
      {
        id: 'recipe-4',
        name: 'Bowl de quinoa au saumon',
        description: 'Un repas complet riche en protéines, glucides complexes et acides gras essentiels.',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        prepTimeMinutes: 30,
        difficulty: 'medium',
        mealType: 'lunch',
        dietaryTags: ['high-protein', 'gluten-free'],
        ingredients: [
          { name: 'Quinoa', quantity: '150g' },
          { name: 'Filet de saumon', quantity: '150g' },
          { name: 'Avocat', quantity: '1/2' },
          { name: 'Concombre', quantity: '1/2' },
          { name: 'Tomates cerises', quantity: '10' },
          { name: 'Jus de citron', quantity: '1 cuillère à soupe' },
          { name: 'Huile d\'olive', quantity: '1 cuillère à soupe' },
          { name: 'Graines de sésame', quantity: '1 cuillère à café' }
        ],
        instructions: [
          'Rincez le quinoa puis cuisez-le selon les instructions du paquet (généralement 15 minutes dans 2 fois son volume d\'eau).',
          'Pendant ce temps, faites cuire le filet de saumon à la poêle 3-4 minutes de chaque côté.',
          'Coupez l\'avocat et le concombre en dés, et les tomates cerises en deux.',
          'Dans un bol, disposez le quinoa, puis ajoutez le saumon émietté et les légumes.',
          'Arrosez de jus de citron et d\'huile d\'olive, puis saupoudrez de graines de sésame.'
        ],
        nutrition: {
          calories: 550,
          carbs: 50,
          protein: 35,
          fat: 25
        },
        cyclingNotes: 'Ce plat équilibré est idéal pour un déjeuner avant une sortie l\'après-midi, ou pour reconstituer vos réserves après un entraînement matinal. Les acides gras oméga-3 du saumon contribuent à réduire l\'inflammation musculaire.'
      },
      {
        id: 'recipe-5',
        name: 'Pâtes complètes au poulet et légumes',
        description: 'Un plat classique riche en glucides et protéines pour les cyclistes.',
        image: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        prepTimeMinutes: 25,
        difficulty: 'easy',
        mealType: 'dinner',
        dietaryTags: ['high-carb', 'high-protein'],
        ingredients: [
          { name: 'Pâtes complètes', quantity: '150g' },
          { name: 'Blanc de poulet', quantity: '150g' },
          { name: 'Courgette', quantity: '1' },
          { name: 'Poivron rouge', quantity: '1' },
          { name: 'Tomates cerises', quantity: '10' },
          { name: 'Ail', quantity: '2 gousses' },
          { name: 'Huile d\'olive', quantity: '2 cuillères à soupe' },
          { name: 'Parmesan râpé', quantity: '20g' },
          { name: 'Basilic frais', quantity: 'quelques feuilles' }
        ],
        instructions: [
          'Faites cuire les pâtes al dente selon les instructions du paquet.',
          'Pendant ce temps, coupez le poulet en dés et faites-le revenir dans une poêle avec 1 cuillère à soupe d\'huile d\'olive, jusqu\'à ce qu\'il soit bien cuit.',
          'Émincez l\'ail et coupez les légumes en dés.',
          'Dans une grande poêle, faites revenir l\'ail dans le reste d\'huile d\'olive, puis ajoutez les légumes. Faites-les sauter 5-7 minutes.',
          'Ajoutez le poulet aux légumes, puis incorporez les pâtes égouttées. Mélangez bien.',
          'Servez avec le parmesan râpé et des feuilles de basilic.'
        ],
        nutrition: {
          calories: 650,
          carbs: 80,
          protein: 40,
          fat: 18
        },
        cyclingNotes: 'Ce plat est parfait pour la veille d\'une sortie longue ou intense. Les pâtes complètes fournissent des glucides à libération lente qui maximiseront vos réserves de glycogène.'
      },
      {
        id: 'recipe-6',
        name: 'Smoothie pré-entraînement aux fruits',
        description: 'Une boisson rafraîchissante et énergisante pour préparer votre corps à l\'effort.',
        image: 'https://images.unsplash.com/photo-1502741224143-90386d7f8c82?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        prepTimeMinutes: 5,
        difficulty: 'easy',
        mealType: 'pre-ride',
        dietaryTags: ['vegetarian', 'vegan', 'high-carb'],
        ingredients: [
          { name: 'Banane', quantity: '1' },
          { name: 'Fruits rouges surgelés', quantity: '100g' },
          { name: 'Jus d\'orange', quantity: '150ml' },
          { name: 'Eau de coco', quantity: '100ml' },
          { name: 'Miel', quantity: '1 cuillère à café' },
          { name: 'Gingembre frais râpé', quantity: '1 pincée' }
        ],
        instructions: [
          'Placez tous les ingrédients dans un blender.',
          'Mixez à haute vitesse jusqu\'à obtenir une texture homogène.',
          'Servez immédiatement ou conservez au frais jusqu\'à 2 heures.'
        ],
        nutrition: {
          calories: 240,
          carbs: 55,
          protein: 3,
          fat: 1
        },
        cyclingNotes: 'Consommez ce smoothie 30-60 minutes avant une sortie pour un boost d\'énergie immédiat. L\'eau de coco apporte des électrolytes naturels qui aideront à prévenir la déshydratation.'
      },
      {
        id: 'recipe-7',
        name: 'Omelette aux légumes et patates douces',
        description: 'Un petit-déjeuner protéiné et énergétique pour bien démarrer la journée.',
        image: 'https://images.unsplash.com/photo-1510693206972-df098062cb71?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        prepTimeMinutes: 20,
        difficulty: 'medium',
        mealType: 'breakfast',
        dietaryTags: ['high-protein', 'gluten-free'],
        ingredients: [
          { name: 'Œufs', quantity: '3' },
          { name: 'Patate douce', quantity: '1 petite' },
          { name: 'Poivron', quantity: '1/2' },
          { name: 'Oignon rouge', quantity: '1/4' },
          { name: 'Épinards frais', quantity: '30g' },
          { name: 'Fromage de chèvre', quantity: '30g' },
          { name: 'Huile d\'olive', quantity: '1 cuillère à soupe' },
          { name: 'Sel et poivre', quantity: 'à votre goût' }
        ],
        instructions: [
          'Épluchez et coupez la patate douce en petits cubes. Faites-les cuire à la vapeur pendant 8-10 minutes jusqu\'à ce qu\'ils soient tendres.',
          'Émincez l\'oignon et le poivron, hachez les épinards.',
          'Dans une poêle, faites chauffer l\'huile et faites revenir l\'oignon et le poivron pendant 3-4 minutes.',
          'Ajoutez les cubes de patate douce et faites-les dorer légèrement.',
          'Battez les œufs dans un bol, assaisonnez avec du sel et du poivre.',
          'Versez les œufs battus dans la poêle, ajoutez les épinards et laissez cuire à feu moyen.',
          'Émiettez le fromage de chèvre sur l\'omelette.',
          'Lorsque les œufs sont presque cuits, pliez l\'omelette en deux et servez.'
        ],
        nutrition: {
          calories: 420,
          carbs: 30,
          protein: 25,
          fat: 22
        },
        cyclingNotes: 'Cette omelette fournit un excellent équilibre de protéines et de glucides complexes, idéal pour un petit-déjeuner avant un entraînement matinal. Les patates douces apportent des glucides à libération lente qui vous soutiendront pendant plusieurs heures.'
      },
      {
        id: 'recipe-8',
        name: 'Riz au poulet et légumes pour bidon',
        description: 'Une recette spéciale à emporter dans votre bidon pour les sorties de plus de 3 heures.',
        image: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        prepTimeMinutes: 15,
        difficulty: 'easy',
        mealType: 'during-ride',
        dietaryTags: ['high-carb'],
        ingredients: [
          { name: 'Riz blanc cuit', quantity: '100g' },
          { name: 'Poulet émincé cuit', quantity: '50g' },
          { name: 'Carottes râpées', quantity: '50g' },
          { name: 'Sel', quantity: '1/4 cuillère à café' },
          { name: 'Miel', quantity: '1 cuillère à soupe' },
          { name: 'Eau', quantity: '150ml' }
        ],
        instructions: [
          'Mélangez tous les ingrédients solides dans un bol.',
          'Ajoutez l\'eau et le miel, puis mixez jusqu\'à obtenir une consistance fluide adaptée au bidon.',
          'Versez dans un bidon propre et stockez au frais jusqu\'au départ.'
        ],
        nutrition: {
          calories: 300,
          carbs: 50,
          protein: 15,
          fat: 3
        },
        cyclingNotes: 'Cette préparation semblable à une bouillie est parfaite pour les sorties longues. Elle fournit à la fois des glucides rapides et des protéines légères. Consommez par petites gorgées régulièrement après la première heure d\'effort, en alternant avec de l\'eau.'
      }
    ];
  }
}

export default new NutritionService();
