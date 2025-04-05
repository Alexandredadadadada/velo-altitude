/**
 * Service de nutrition pour les cyclistes
 * Gère les plans nutritionnels, les recommandations et les calculs de besoins énergétiques
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');
const cacheService = require('./cache.service');

/**
 * Service de nutrition
 */
class NutritionService {
  constructor() {
    this.nutritionPlansPath = path.join(__dirname, '../data/nutrition-plans.json');
    this.initialized = false;
    this.nutritionPlans = [];
  }

  /**
   * Initialise le service de nutrition
   * @returns {Promise<boolean>}
   */
  async initialize() {
    try {
      // Vérifier si les plans sont déjà en cache
      const cachedPlans = await cacheService.get('nutrition:plans');
      
      if (cachedPlans) {
        this.nutritionPlans = cachedPlans;
        this.initialized = true;
        logger.info('[NutritionService] Plans chargés depuis le cache');
        return true;
      }
      
      // Charger les plans depuis le fichier JSON
      const data = await fs.readFile(this.nutritionPlansPath, 'utf8');
      const plansData = JSON.parse(data);
      
      if (plansData && plansData.nutrition_plans) {
        this.nutritionPlans = plansData.nutrition_plans;
        
        // Mettre en cache pour future utilisation (1 jour)
        await cacheService.set('nutrition:plans', this.nutritionPlans, 86400);
        
        this.initialized = true;
        logger.info(`[NutritionService] ${this.nutritionPlans.length} plans nutritionnels chargés`);
        return true;
      } else {
        throw new Error('Format des plans nutritionnels invalide');
      }
    } catch (error) {
      logger.error(`[NutritionService] Erreur lors de l'initialisation: ${error.message}`);
      return false;
    }
  }

  /**
   * Récupère tous les plans nutritionnels
   * @returns {Promise<Array>} Liste des plans
   */
  async getAllNutritionPlans() {
    if (!this.initialized) {
      await this.initialize();
    }
    return this.nutritionPlans;
  }

  /**
   * Récupère un plan nutritionnel par son ID
   * @param {string} planId - ID du plan
   * @returns {Promise<Object>} Plan nutritionnel
   */
  async getNutritionPlanById(planId) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const plan = this.nutritionPlans.find(p => p.id === planId);
    
    if (!plan) {
      throw new Error(`Plan nutritionnel non trouvé: ${planId}`);
    }
    
    return plan;
  }

  /**
   * Calcule les besoins caloriques quotidiens
   * @param {Object} userProfile - Profil de l'utilisateur
   * @param {Object} trainingLoad - Charge d'entraînement
   * @returns {Promise<Object>} Besoins nutritionnels
   */
  async calculateNutritionalNeeds(userProfile, trainingLoad) {
    try {
      const cacheKey = `nutrition:needs:${userProfile.id}:${JSON.stringify(trainingLoad)}`;
      const cachedNeeds = await cacheService.get(cacheKey);
      
      if (cachedNeeds) {
        return cachedNeeds;
      }
      
      // Métabolisme de base selon l'équation de Mifflin-St Jeor
      let bmr;
      if (userProfile.gender === 'female') {
        bmr = (10 * userProfile.weight) + (6.25 * userProfile.height) - (5 * userProfile.age) - 161;
      } else {
        bmr = (10 * userProfile.weight) + (6.25 * userProfile.height) - (5 * userProfile.age) + 5;
      }
      
      // Facteur d'activité hors entraînement
      const activityFactors = {
        sedentary: 1.2,      // Travail de bureau, peu d'activité
        lightlyActive: 1.375, // Activité légère 1-3 jours/semaine
        moderatelyActive: 1.55, // Activité modérée 3-5 jours/semaine
        veryActive: 1.725,   // Activité intense 6-7 jours/semaine
        extraActive: 1.9     // Activité très intense, travail physique
      };
      
      const activityFactor = activityFactors[userProfile.activityLevel] || 1.55;
      
      // Dépense calorique sans entraînement
      let tdee = bmr * activityFactor;
      
      // Ajouter la dépense de l'entraînement
      if (trainingLoad) {
        // Estimation basée sur la durée, l'intensité et le poids
        const trainingCalories = (trainingLoad.duration / 60) * trainingLoad.intensity * (userProfile.weight * 0.3);
        tdee += trainingCalories;
      }
      
      // Calculer les besoins en macronutriments selon l'objectif
      let macronutrients;
      switch (userProfile.goal) {
        case 'performance':
          macronutrients = {
            carbs: (tdee * 0.55) / 4, // 55-60% de l'apport calorique (4 cal/g)
            protein: (userProfile.weight * 1.8), // 1.8g/kg pour les athlètes d'endurance en période d'entraînement intense
            fat: (tdee * 0.25) / 9    // 25% de l'apport calorique (9 cal/g)
          };
          break;
        case 'weightLoss':
          tdee = tdee * 0.85; // Déficit de 15%
          macronutrients = {
            carbs: (tdee * 0.45) / 4, // 45% de l'apport calorique
            protein: (userProfile.weight * 2.0), // 2g/kg pour préserver la masse musculaire
            fat: (tdee * 0.30) / 9    // 30% de l'apport calorique
          };
          break;
        case 'recovery':
          macronutrients = {
            carbs: (tdee * 0.60) / 4, // 60% pour optimiser la récupération
            protein: (userProfile.weight * 1.6), // 1.6g/kg
            fat: (tdee * 0.25) / 9    // 25% de l'apport calorique
          };
          break;
        default: // maintenance
          macronutrients = {
            carbs: (tdee * 0.50) / 4, // 50% de l'apport calorique
            protein: (userProfile.weight * 1.5), // 1.5g/kg
            fat: (tdee * 0.30) / 9    // 30% de l'apport calorique
          };
      }
      
      // Arrondir les valeurs
      macronutrients.carbs = Math.round(macronutrients.carbs);
      macronutrients.protein = Math.round(macronutrients.protein);
      macronutrients.fat = Math.round(macronutrients.fat);
      
      // Calculer les calories totales des macronutriments
      const calculatedCalories = 
        (macronutrients.carbs * 4) + 
        (macronutrients.protein * 4) + 
        (macronutriments.fat * 9);
      
      // Ajuster si nécessaire pour atteindre le TDEE cible
      if (Math.abs(calculatedCalories - tdee) > 50) {
        const ratio = tdee / calculatedCalories;
        macronutrients.carbs = Math.round(macronutrients.carbs * ratio);
        macronutrients.fat = Math.round(macronutrients.fat * ratio);
      }
      
      const nutritionalNeeds = {
        calories: Math.round(tdee),
        macronutrients: macronutrients,
        hydration: {
          baseNeeds: Math.round(userProfile.weight * 0.03 * 1000), // 30ml/kg en ml
          trainingNeeds: trainingLoad ? Math.round((trainingLoad.duration / 60) * 500) : 0 // 500ml par heure d'entraînement
        }
      };
      
      // Mettre en cache pour 24 heures
      await cacheService.set(cacheKey, nutritionalNeeds, 86400);
      
      return nutritionalNeeds;
    } catch (error) {
      logger.error(`[NutritionService] Erreur lors du calcul des besoins nutritionnels: ${error.message}`);
      throw new Error(`Échec du calcul des besoins nutritionnels: ${error.message}`);
    }
  }

  /**
   * Génère un plan nutritionnel personnalisé
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} userProfile - Profil de l'utilisateur
   * @param {Object} trainingPlan - Plan d'entraînement
   * @returns {Promise<Object>} Plan nutritionnel personnalisé
   */
  async generatePersonalizedNutritionPlan(userId, userProfile, trainingPlan) {
    try {
      const cacheKey = `nutrition:personalized:${userId}:${trainingPlan ? trainingPlan.id : 'generic'}`;
      const cachedPlan = await cacheService.get(cacheKey);
      
      if (cachedPlan) {
        return cachedPlan;
      }
      
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Sélectionner un plan de base approprié selon l'objectif
      let basePlanType;
      switch (userProfile.goal) {
        case 'performance':
          basePlanType = 'endurance';
          break;
        case 'weightLoss':
          basePlanType = 'weight-loss';
          break;
        case 'recovery':
          basePlanType = 'recovery';
          break;
        default:
          basePlanType = 'endurance';
      }
      
      // Trouver le plan de base
      const basePlan = this.nutritionPlans.find(p => p.type === basePlanType) || this.nutritionPlans[0];
      
      if (!basePlan) {
        throw new Error('Aucun plan nutritionnel de base trouvé');
      }
      
      // Calculer les besoins caloriques
      const trainingLoad = trainingPlan ? {
        duration: trainingPlan.weeklyDuration * 60, // en minutes
        intensity: trainingPlan.intensity || 0.7 // 0.0 à 1.0
      } : null;
      
      const nutritionalNeeds = await this.calculateNutritionalNeeds(userProfile, trainingLoad);
      
      // Ajuster le plan de base en fonction des besoins calculés
      const personalizedPlan = {
        id: `${userId}_${Date.now()}`,
        basedOn: basePlan.id,
        name: `Plan personnalisé pour ${userProfile.firstName || 'cycliste'}`,
        type: basePlan.type,
        description: `Plan nutritionnel personnalisé basé sur votre profil et vos objectifs`,
        daily_calories: nutritionalNeeds.calories,
        macronutrients: {
          carbs: `${Math.round((nutritionalNeeds.macronutrients.carbs * 4 / nutritionalNeeds.calories) * 100)}%`,
          protein: `${Math.round((nutritionalNeeds.macronutrients.protein * 4 / nutritionalNeeds.calories) * 100)}%`,
          fat: `${Math.round((nutritionalNeeds.macronutrients.fat * 9 / nutritionalNeeds.calories) * 100)}%`
        },
        // Copier les plans journaliers et ajuster
        daily_plans: basePlan.daily_plans.map(dayPlan => {
          // Ajuster les macros en fonction des besoins
          const ratio = nutritionalNeeds.calories / basePlan.daily_calories;
          
          return {
            ...dayPlan,
            total_macros: {
              calories: Math.round(dayPlan.total_macros.calories * ratio),
              carbs: Math.round(dayPlan.total_macros.carbs * ratio),
              protein: Math.round(dayPlan.total_macros.protein * ratio),
              fat: Math.round(dayPlan.total_macros.fat * ratio)
            }
          };
        }),
        // Inclure les suppléments du plan de base
        supplements: basePlan.supplements,
        // Inclure la stratégie d'événement du plan de base
        event_strategies: basePlan.event_strategies,
        // Ajouter des notes personnalisées
        personalized_notes: [
          `Plan adapté à votre objectif de ${userProfile.goal}`,
          `Besoins hydriques: ${nutritionalNeeds.hydration.baseNeeds}ml/jour + ${nutritionalNeeds.hydration.trainingNeeds}ml pendant l'entraînement`,
          `Macronutriments optimisés pour votre poids de ${userProfile.weight}kg et votre niveau d'activité`
        ]
      };
      
      // Mettre en cache pour 7 jours
      await cacheService.set(cacheKey, personalizedPlan, 7 * 86400);
      
      return personalizedPlan;
    } catch (error) {
      logger.error(`[NutritionService] Erreur lors de la génération du plan personnalisé: ${error.message}`);
      throw new Error(`Échec de la génération du plan nutritionnel: ${error.message}`);
    }
  }

  /**
   * Génère des recommandations nutritionnelles pour un événement spécifique
   * @param {Object} eventDetails - Détails de l'événement
   * @param {Object} userProfile - Profil de l'utilisateur
   * @returns {Promise<Object>} Recommandations nutritionnelles
   */
  async generateEventNutritionStrategy(eventDetails, userProfile) {
    try {
      const cacheKey = `nutrition:event:${userProfile.id}:${eventDetails.id || eventDetails.name}`;
      const cachedStrategy = await cacheService.get(cacheKey);
      
      if (cachedStrategy) {
        return cachedStrategy;
      }
      
      // Estimer les besoins caloriques pendant l'événement
      const eventDuration = eventDetails.duration || 180; // en minutes
      const eventIntensity = eventDetails.intensity || 0.75; // 0.0 à 1.0
      
      // Calories brûlées pendant l'événement (estimation)
      const caloriesBurned = Math.round((eventDuration / 60) * eventIntensity * (userProfile.weight * 8));
      
      // Besoins en glucides pendant l'effort (30-90g/h selon l'intensité et la durée)
      let carbsPerHour;
      if (eventDuration <= 90) {
        carbsPerHour = 30; // 30g/h pour les efforts courts
      } else if (eventDuration <= 180) {
        carbsPerHour = 60; // 60g/h pour les efforts moyens
      } else {
        carbsPerHour = 90; // 90g/h pour les efforts longs
      }
      
      const totalCarbsDuringEvent = Math.round((eventDuration / 60) * carbsPerHour);
      
      // Génération de la stratégie
      const strategy = {
        eventName: eventDetails.name || 'Événement cycliste',
        eventType: eventDetails.type || 'course',
        eventDistance: eventDetails.distance || 'non spécifié',
        eventDuration: eventDuration,
        caloriesBurned: caloriesBurned,
        nutritionStrategy: {
          before: {
            timing: '3-4 heures avant',
            meal: {
              description: 'Repas riche en glucides, faible en fibres et en graisses',
              examples: [
                'Porridge avec banane et miel',
                'Pâtes blanches avec sauce tomate légère',
                'Riz blanc avec poulet grillé'
              ],
              macros: {
                carbs: '2-3g/kg de poids corporel',
                protein: '15-20g',
                fat: 'limité'
              }
            },
            hydration: `${Math.round(userProfile.weight * 5)}ml d'eau avec électrolytes 3h avant, puis ${Math.round(userProfile.weight * 3)}ml 1h avant`
          },
          during: {
            carbs: {
              perHour: carbsPerHour,
              total: totalCarbsDuringEvent,
              sources: [
                'Gels énergétiques',
                'Boissons isotoniques',
                'Barres énergétiques',
                'Purées de fruits'
              ],
              strategy: eventDuration > 180 ? 'Mélanger différentes sources de glucides (glucose + fructose) pour optimiser l\'absorption' : 'Se concentrer sur des glucides à absorption rapide'
            },
            hydration: {
              perHour: `${Math.round(500 + (userProfile.weight * 2))}ml/heure ajusté selon la température`,
              electrolytes: 'Inclure des électrolytes pour prévenir l\'hyponatrémie et les crampes',
              scheduleExample: `Boire ${Math.round((500 + (userProfile.weight * 2)) / 4)}ml tous les 15 minutes`
            }
          },
          after: {
            immediate: {
              timing: '0-30 minutes après l\'arrivée',
              description: 'Fenêtre anabolique - focus sur la récupération immédiate',
              recommendation: `${Math.round(userProfile.weight * 0.8)}g de glucides et ${Math.round(userProfile.weight * 0.25)}g de protéines`,
              examples: [
                'Boisson de récupération protéinée',
                'Yaourt aux fruits et miel',
                'Smoothie banane-lait-protéines de lactosérum'
              ]
            },
            meal: {
              timing: '1-2 heures après',
              description: 'Repas complet de récupération',
              recommendation: 'Repas équilibré avec des glucides complexes, des protéines de qualité et des antioxydants',
              examples: [
                'Pâtes complètes avec poulet et légumes',
                'Riz avec saumon et légumes grillés',
                'Quinoa, lentilles et légumes rôtis (option végétarienne)'
              ]
            },
            hydration: `Remplacer 150% du poids perdu pendant l'effort - environ ${Math.round((eventDuration / 60) * 500 * 1.5)}ml`
          }
        },
        personalizedTips: [
          'Testez votre stratégie nutritionnelle pendant l\'entraînement, jamais le jour J',
          `Avec votre poids de ${userProfile.weight}kg, visez environ ${Math.round(userProfile.weight * carbsPerHour / 60)}g de glucides toutes les 20 minutes`,
          'Commencez à vous alimenter dès les premières 15-20 minutes de l\'événement'
        ]
      };
      
      // Ajouter des conseils spécifiques selon le type d'événement
      if (eventDetails.type === 'montagne' || eventDetails.elevation > 1500) {
        strategy.personalizedTips.push('Pour les longues montées, consommez des glucides juste avant pour avoir de l\'énergie pendant l\'ascension');
        strategy.personalizedTips.push('En altitude, vos besoins hydriques augmentent - buvez 10-15% de plus que d\'habitude');
      }
      
      if (eventDetails.temperature && eventDetails.temperature > 25) {
        strategy.personalizedTips.push('Par forte chaleur, augmentez votre apport en électrolytes et buvez 20-30% de plus');
        strategy.personalizedTips.push('Optez pour des aliments liquides ou semi-liquides pour faciliter la digestion en cas de chaleur');
      }
      
      // Mettre en cache pour 30 jours
      await cacheService.set(cacheKey, strategy, 30 * 86400);
      
      return strategy;
    } catch (error) {
      logger.error(`[NutritionService] Erreur lors de la génération de la stratégie d'événement: ${error.message}`);
      throw new Error(`Échec de la génération de la stratégie nutritionnelle: ${error.message}`);
    }
  }

  /**
   * Analyse le journal alimentaire d'un utilisateur et fournit des recommandations
   * @param {string} userId - ID de l'utilisateur
   * @param {Array} foodJournal - Journal alimentaire
   * @returns {Promise<Object>} Analyse et recommandations
   */
  async analyzeNutritionJournal(userId, foodJournal) {
    try {
      // Réaliser une analyse basique du journal
      const totalCalories = foodJournal.reduce((sum, entry) => sum + entry.calories, 0);
      const totalCarbs = foodJournal.reduce((sum, entry) => sum + entry.macros.carbs, 0);
      const totalProtein = foodJournal.reduce((sum, entry) => sum + entry.macros.protein, 0);
      const totalFat = foodJournal.reduce((sum, entry) => sum + entry.macros.fat, 0);
      
      // Calculer les pourcentages
      const totalMacroCalories = (totalCarbs * 4) + (totalProtein * 4) + (totalFat * 9);
      const carbPercentage = Math.round((totalCarbs * 4 / totalMacroCalories) * 100);
      const proteinPercentage = Math.round((totalProtein * 4 / totalMacroCalories) * 100);
      const fatPercentage = Math.round((totalFat * 9 / totalMacroCalories) * 100);
      
      // Analyser les catégories d'aliments
      const categories = {
        fruits: 0,
        vegetables: 0,
        protein: 0,
        dairy: 0,
        grains: 0,
        processed: 0
      };
      
      foodJournal.forEach(entry => {
        if (entry.category) {
          categories[entry.category] = (categories[entry.category] || 0) + 1;
        }
      });
      
      // Générer des recommandations
      const recommendations = [];
      
      // Recommandations basées sur les macros
      if (carbPercentage < 45) {
        recommendations.push({
          type: 'carbs',
          severity: 'medium',
          message: 'Votre apport en glucides semble faible. Envisagez d\'augmenter votre consommation de glucides complexes pour un meilleur support de vos entraînements.'
        });
      } else if (carbPercentage > 65) {
        recommendations.push({
          type: 'carbs',
          severity: 'low',
          message: 'Votre apport en glucides est élevé. Cela peut être approprié pendant une phase de surcompensation ou avant un événement majeur, mais vérifiez que vous avez un bon équilibre avec les protéines pour la récupération.'
        });
      }
      
      if (proteinPercentage < 15) {
        recommendations.push({
          type: 'protein',
          severity: 'high',
          message: 'Votre apport en protéines est insuffisant. Augmentez votre consommation pour favoriser la récupération et le maintien de la masse musculaire.'
        });
      }
      
      if (fatPercentage < 15) {
        recommendations.push({
          type: 'fat',
          severity: 'medium',
          message: 'Votre apport en graisses semble trop faible. Les graisses saines sont essentielles pour les fonctions hormonales et l\'absorption des vitamines liposolubles.'
        });
      } else if (fatPercentage > 35) {
        recommendations.push({
          type: 'fat',
          severity: 'medium',
          message: 'Votre apport en graisses est élevé. Assurez-vous de privilégier les graisses insaturées (avocat, huile d\'olive, poissons gras) et de limiter les graisses saturées.'
        });
      }
      
      // Recommandations sur la diversité alimentaire
      if ((categories.fruits + categories.vegetables) < foodJournal.length * 0.3) {
        recommendations.push({
          type: 'diversity',
          severity: 'high',
          message: 'Votre consommation de fruits et légumes semble insuffisante. Visez au moins 5 portions par jour pour un apport optimal en micronutriments et antioxydants.'
        });
      }
      
      if (categories.processed > foodJournal.length * 0.4) {
        recommendations.push({
          type: 'quality',
          severity: 'high',
          message: 'Votre alimentation contient une proportion élevée d\'aliments transformés. Privilégiez les aliments entiers pour une meilleure santé et récupération.'
        });
      }
      
      const analysis = {
        calories: totalCalories,
        macronutrients: {
          carbs: {
            grams: totalCarbs,
            percentage: carbPercentage
          },
          protein: {
            grams: totalProtein,
            percentage: proteinPercentage
          },
          fat: {
            grams: totalFat,
            percentage: fatPercentage
          }
        },
        foodCategories: Object.entries(categories).map(([category, count]) => ({
          category,
          count,
          percentage: Math.round((count / foodJournal.length) * 100)
        })),
        recommendations: recommendations,
        summary: recommendations.length > 0 
          ? 'Votre journal alimentaire présente quelques points à améliorer. Suivez nos recommandations pour optimiser votre nutrition.'
          : 'Votre journal alimentaire semble bien équilibré. Continuez comme ça pour maintenir une nutrition optimale.'
      };
      
      return analysis;
    } catch (error) {
      logger.error(`[NutritionService] Erreur lors de l'analyse du journal alimentaire: ${error.message}`);
      throw new Error(`Échec de l'analyse du journal alimentaire: ${error.message}`);
    }
  }
}

module.exports = new NutritionService();
