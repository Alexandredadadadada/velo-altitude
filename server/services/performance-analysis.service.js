/**
 * Service d'analyse de performance intégrant nutrition et entraînement
 * Ce service analyse les performances sportives en corrélation avec les données nutritionnelles
 * pour identifier des tendances et fournir des recommandations d'optimisation
 */

const NutritionData = require('../models/nutrition.model');
const TrainingService = require('./training.service');
const NutritionService = require('./nutrition.service');
const UserService = require('./user.service');
const ClaudeApiService = require('./claude-api.service');
const CacheService = require('./cache.service');

const cache = CacheService.getCache();
const CACHE_TTL = 1800; // 30 minutes

/**
 * Service d'analyse de performance
 */
class PerformanceAnalysisService {
  /**
   * Analyse la corrélation entre nutrition et performance
   * @param {string} userId - ID de l'utilisateur
   * @param {number} days - Nombre de jours à analyser (défaut: 30)
   * @returns {Object} Analyse de corrélation
   */
  static async analyzeNutritionPerformanceCorrelation(userId, days = 30) {
    try {
      const cacheKey = `nutrition_performance:${userId}:${days}`;
      const cachedAnalysis = cache.get(cacheKey);
      if (cachedAnalysis) {
        return cachedAnalysis;
      }
      
      // Récupérer les données d'entraînement
      const trainingData = await TrainingService.getUserActivities(userId, days);
      if (!trainingData || trainingData.length === 0) {
        return {
          success: false,
          message: "Aucune donnée d'entraînement disponible pour la période spécifiée"
        };
      }
      
      // Récupérer les données nutritionnelles
      const nutritionData = await NutritionData.findOne({ userId });
      if (!nutritionData || !nutritionData.foodJournal || nutritionData.foodJournal.length === 0) {
        return {
          success: false,
          message: "Aucune donnée nutritionnelle disponible pour la période spécifiée"
        };
      }
      
      // Filtrer les entrées de journal alimentaire pour la période spécifiée
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const recentFoodEntries = nutritionData.foodJournal.filter(entry => 
        new Date(entry.date) >= cutoffDate
      );
      
      if (recentFoodEntries.length === 0) {
        return {
          success: false,
          message: "Aucune donnée nutritionnelle récente disponible"
        };
      }
      
      // Créer un mapping des jours avec des données nutritionnelles
      const nutritionByDay = {};
      recentFoodEntries.forEach(entry => {
        const dateStr = new Date(entry.date).toISOString().split('T')[0];
        if (!nutritionByDay[dateStr]) {
          nutritionByDay[dateStr] = {
            calories: 0,
            carbs: 0,
            protein: 0,
            fat: 0,
            entries: []
          };
        }
        
        nutritionByDay[dateStr].calories += entry.calories;
        nutritionByDay[dateStr].carbs += entry.macros.carbs;
        nutritionByDay[dateStr].protein += entry.macros.protein;
        nutritionByDay[dateStr].fat += entry.macros.fat;
        nutritionByDay[dateStr].entries.push(entry);
      });
      
      // Créer un mapping des activités par jour
      const activityByDay = {};
      trainingData.forEach(activity => {
        const dateStr = new Date(activity.date).toISOString().split('T')[0];
        if (!activityByDay[dateStr]) {
          activityByDay[dateStr] = [];
        }
        activityByDay[dateStr].push(activity);
      });
      
      // Analyser les jours où il y a à la fois des données nutritionnelles et d'entraînement
      const correlationData = [];
      
      for (const [dateStr, nutrition] of Object.entries(nutritionByDay)) {
        const activities = activityByDay[dateStr] || [];
        
        if (activities.length > 0) {
          // Calculer les métriques de performance pour la journée
          const dailyPerformance = activities.reduce((acc, activity) => {
            acc.duration += activity.duration || 0;
            acc.distance += activity.distance || 0;
            acc.calories += activity.calories || 0;
            
            // Calculer le score de performance relatif en fonction du type d'activité
            const intensityFactor = this._getIntensityFactor(activity);
            acc.performanceScore += (activity.duration * intensityFactor);
            
            return acc;
          }, { duration: 0, distance: 0, calories: 0, performanceScore: 0 });
          
          // Ajouter les données corrélées pour ce jour
          correlationData.push({
            date: dateStr,
            nutrition: {
              totalCalories: nutrition.calories,
              macros: {
                carbs: nutrition.carbs,
                protein: nutrition.protein,
                fat: nutrition.fat
              },
              carbsPercentage: Math.round((nutrition.carbs * 4 / (nutrition.carbs * 4 + nutrition.protein * 4 + nutrition.fat * 9)) * 100),
              proteinPercentage: Math.round((nutrition.protein * 4 / (nutrition.carbs * 4 + nutrition.protein * 4 + nutrition.fat * 9)) * 100),
              fatPercentage: Math.round((nutrition.fat * 9 / (nutrition.carbs * 4 + nutrition.protein * 4 + nutrition.fat * 9)) * 100)
            },
            performance: dailyPerformance
          });
        }
      }
      
      if (correlationData.length === 0) {
        return {
          success: false,
          message: "Aucune corrélation trouvée entre nutrition et performance pour la période spécifiée"
        };
      }
      
      // Calculer les statistiques de corrélation
      const analysis = this._calculateCorrelationStatistics(correlationData);
      
      // Générer des recommandations basées sur l'analyse
      const recommendations = await this._generateRecommendations(analysis, userId);
      
      const result = {
        success: true,
        correlationData,
        analysis,
        recommendations,
        daysAnalyzed: days,
        dataPoints: correlationData.length
      };
      
      // Mettre en cache les résultats
      cache.set(cacheKey, result, CACHE_TTL);
      
      return result;
    } catch (error) {
      console.error(`Erreur lors de l'analyse de la corrélation nutrition-performance: ${error.message}`);
      return {
        success: false,
        message: `Erreur lors de l'analyse: ${error.message}`
      };
    }
  }
  
  /**
   * Génère des recommandations personnalisées basées sur l'analyse de performance nutritionnelle
   * Utilise optionnellement Claude AI pour des recommandations avancées
   * @param {Object} analysis - Analyse de corrélation
   * @param {string} userId - ID de l'utilisateur
   * @returns {Array} Recommandations personnalisées
   */
  static async _generateRecommendations(analysis, userId) {
    try {
      // Récupérer le profil utilisateur
      const user = await UserService.getUserById(userId);
      
      // Recommandations de base
      const baseRecommendations = [
        "Maintenez une hydratation adéquate avant, pendant et après l'entraînement",
        "Consommez un repas riche en glucides et protéines dans les 30-60 minutes suivant l'exercice intense"
      ];
      
      // Recommandations basées sur l'analyse de corrélation
      const correlationRecommendations = [];
      
      // Macronutriments
      if (analysis.bestPerformanceMacros) {
        correlationRecommendations.push(
          `Vos meilleures performances sont associées à une répartition des macronutriments d'environ ${analysis.bestPerformanceMacros.carbs}% de glucides, ${analysis.bestPerformanceMacros.protein}% de protéines et ${analysis.bestPerformanceMacros.fat}% de lipides`
        );
      }
      
      // Calories
      if (analysis.optimalCalorieRange) {
        correlationRecommendations.push(
          `Pour optimiser vos performances, visez un apport calorique journalier entre ${analysis.optimalCalorieRange.min} et ${analysis.optimalCalorieRange.max} calories les jours d'entraînement`
        );
      }
      
      // Timing
      if (analysis.nutritionTiming) {
        correlationRecommendations.push(
          `Le timing de vos repas semble important: ${analysis.nutritionTiming}`
        );
      }
      
      // Essayer d'utiliser Claude AI pour des recommandations avancées si disponible
      try {
        const claudeRecommendations = await this._getClaudeRecommendations(analysis, user);
        if (claudeRecommendations && claudeRecommendations.length > 0) {
          return [...baseRecommendations, ...correlationRecommendations, ...claudeRecommendations];
        }
      } catch (aiError) {
        console.warn(`Impossible d'obtenir des recommandations AI: ${aiError.message}`);
      }
      
      return [...baseRecommendations, ...correlationRecommendations];
    } catch (error) {
      console.error(`Erreur lors de la génération des recommandations: ${error.message}`);
      return ["Maintenez une alimentation équilibrée et une hydratation adéquate pour optimiser vos performances"];
    }
  }
  
  /**
   * Obtient des recommandations personnalisées depuis Claude AI
   * @param {Object} analysis - Analyse de corrélation
   * @param {Object} user - Profil utilisateur
   * @returns {Array} Recommandations avancées
   */
  static async _getClaudeRecommendations(analysis, user) {
    try {
      if (!ClaudeApiService) {
        return null;
      }
      
      const prompt = `En tant qu'expert en nutrition sportive pour cyclistes, analysez ces données et fournissez 3-5 recommandations spécifiques pour améliorer les performances:
      
Profil du cycliste:
- Âge: ${user.profile.age || 'Non spécifié'}
- Sexe: ${user.profile.gender || 'Non spécifié'}
- Poids: ${user.profile.weight || 'Non spécifié'} kg
- Niveau d'activité: ${user.profile.activityLevel || 'Modéré'}

Données d'analyse:
${JSON.stringify(analysis, null, 2)}

Fournissez uniquement une liste numérotée de recommandations nutritionnelles précises et actionnables. Chaque recommandation doit être concise (max 2 phrases) et directement liée aux données présentées.`;

      const response = await ClaudeApiService.generateCompletion(prompt, {
        temperature: 0.3,
        maxTokens: 500
      });
      
      if (!response || !response.content) {
        return null;
      }
      
      // Traiter la réponse pour extraire les recommandations
      const recommendations = response.content
        .split('\n')
        .filter(line => /^\d+\./.test(line)) // Lignes commençant par un nombre suivi d'un point
        .map(line => line.replace(/^\d+\.\s*/, '').trim()) // Supprimer le nombre et les espaces
        .filter(line => line.length > 0);
      
      return recommendations;
    } catch (error) {
      console.error(`Erreur lors de la génération des recommandations AI: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Calcule les statistiques de corrélation entre nutrition et performance
   * @param {Array} correlationData - Données de corrélation nutrition-performance
   * @returns {Object} Statistiques de corrélation
   */
  static _calculateCorrelationStatistics(correlationData) {
    // Trier les jours par score de performance
    const sortedByPerformance = [...correlationData].sort(
      (a, b) => b.performance.performanceScore - a.performance.performanceScore
    );
    
    // Récupérer le top 25% des jours de performance
    const topPerformanceDays = sortedByPerformance.slice(
      0, Math.max(1, Math.floor(sortedByPerformance.length * 0.25))
    );
    
    // Calculer les moyennes nutritionnelles pour les jours de top performance
    const topPerformanceNutrition = topPerformanceDays.reduce((acc, day) => {
      acc.calories += day.nutrition.totalCalories;
      acc.carbs += day.nutrition.macros.carbs;
      acc.protein += day.nutrition.macros.protein;
      acc.fat += day.nutrition.macros.fat;
      acc.carbsPercentage += day.nutrition.carbsPercentage;
      acc.proteinPercentage += day.nutrition.proteinPercentage;
      acc.fatPercentage += day.nutrition.fatPercentage;
      return acc;
    }, { 
      calories: 0, carbs: 0, protein: 0, fat: 0, 
      carbsPercentage: 0, proteinPercentage: 0, fatPercentage: 0 
    });
    
    const count = topPerformanceDays.length;
    
    // Moyennes des macros pour les jours de meilleures performances
    const bestPerformanceMacros = {
      carbs: Math.round(topPerformanceNutrition.carbsPercentage / count),
      protein: Math.round(topPerformanceNutrition.proteinPercentage / count),
      fat: Math.round(topPerformanceNutrition.fatPercentage / count)
    };
    
    // Déterminer la plage optimale de calories
    const avgTopCalories = Math.round(topPerformanceNutrition.calories / count);
    const optimalCalorieRange = {
      min: Math.round(avgTopCalories * 0.95),
      max: Math.round(avgTopCalories * 1.05),
      avg: avgTopCalories
    };
    
    // Calculer les tendances générales
    const trends = {
      carbsImpact: this._calculateImpactFactor(correlationData, 'carbsPercentage'),
      proteinImpact: this._calculateImpactFactor(correlationData, 'proteinPercentage'),
      fatImpact: this._calculateImpactFactor(correlationData, 'fatPercentage'),
      caloriesImpact: this._calculateImpactFactor(correlationData, 'totalCalories')
    };
    
    // Identifier les nutriments ayant le plus d'impact sur la performance
    const impactFactors = [
      { nutrient: 'glucides', impact: trends.carbsImpact },
      { nutrient: 'protéines', impact: trends.proteinImpact },
      { nutrient: 'lipides', impact: trends.fatImpact }
    ].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
    
    const mostImpactfulNutrient = impactFactors[0];
    
    // Interprétation de l'impact
    let nutritionTiming = null;
    if (topPerformanceDays.length >= 3) {
      // Analyser le timing des repas avant l'exercice dans les jours de top performance
      const timingPatterns = topPerformanceDays.flatMap(day => {
        const entries = day.nutrition.entries || [];
        return entries
          .filter(entry => ['breakfast', 'morning_snack', 'lunch', 'afternoon_snack'].includes(entry.timing))
          .map(entry => entry.timing);
      });
      
      const mostCommonTiming = this._getMostFrequent(timingPatterns);
      if (mostCommonTiming) {
        const timingMap = {
          breakfast: "petit-déjeuner complet",
          morning_snack: "collation matinale",
          lunch: "déjeuner équilibré",
          afternoon_snack: "collation d'après-midi",
          dinner: "dîner léger",
          evening_snack: "collation nocturne",
          during_exercise: "nutrition pendant l'exercice",
          post_exercise: "nutrition post-exercice"
        };
        
        nutritionTiming = `Un ${timingMap[mostCommonTiming]} semble particulièrement important pour vos performances`;
      }
    }
    
    return {
      bestPerformanceMacros,
      optimalCalorieRange,
      mostImpactfulNutrient: {
        nutrient: mostImpactfulNutrient.nutrient,
        impact: mostImpactfulNutrient.impact > 0 ? 'positif' : 'négatif',
        magnitude: Math.abs(mostImpactfulNutrient.impact) > 0.5 ? 'fort' : 'modéré'
      },
      nutritionTiming,
      trends
    };
  }
  
  /**
   * Calcule le facteur d'impact d'un nutriment sur la performance
   * @param {Array} data - Données de corrélation
   * @param {string} nutrientKey - Clé du nutriment à analyser
   * @returns {number} Facteur d'impact (-1 à 1, où 1 est fortement positif)
   */
  static _calculateImpactFactor(data, nutrientKey) {
    // Cette fonction utilise une méthode simplifiée de corrélation
    const n = data.length;
    if (n <= 1) return 0;
    
    const xVals = data.map(d => nutrientKey === 'totalCalories' ? 
      d.nutrition.totalCalories : 
      d.nutrition[nutrientKey]);
    
    const yVals = data.map(d => d.performance.performanceScore);
    
    const xMean = xVals.reduce((sum, val) => sum + val, 0) / n;
    const yMean = yVals.reduce((sum, val) => sum + val, 0) / n;
    
    let numerator = 0;
    let denomX = 0;
    let denomY = 0;
    
    for (let i = 0; i < n; i++) {
      const xDiff = xVals[i] - xMean;
      const yDiff = yVals[i] - yMean;
      numerator += xDiff * yDiff;
      denomX += xDiff * xDiff;
      denomY += yDiff * yDiff;
    }
    
    const denominator = Math.sqrt(denomX * denomY);
    
    // Éviter la division par zéro
    return denominator === 0 ? 0 : numerator / denominator;
  }
  
  /**
   * Obtient l'élément le plus fréquent dans un tableau
   * @param {Array} arr - Tableau d'éléments
   * @returns {*} Élément le plus fréquent
   */
  static _getMostFrequent(arr) {
    if (!arr || arr.length === 0) return null;
    
    const frequency = {};
    let maxFreq = 0;
    let mostFrequent = null;
    
    for (const item of arr) {
      frequency[item] = (frequency[item] || 0) + 1;
      
      if (frequency[item] > maxFreq) {
        maxFreq = frequency[item];
        mostFrequent = item;
      }
    }
    
    return mostFrequent;
  }
  
  /**
   * Calcule un facteur d'intensité pour une activité d'entraînement
   * @param {Object} activity - Données d'activité
   * @returns {number} Facteur d'intensité (0.8 à 1.5)
   */
  static _getIntensityFactor(activity) {
    if (!activity) return 1.0;
    
    // Facteur de base selon le type d'activité
    let factor = 1.0;
    
    // Ajuster en fonction de l'intensité si disponible
    if (activity.intensity) {
      switch (activity.intensity.toLowerCase()) {
        case 'high':
        case 'intense':
        case 'très intense':
          factor = 1.5;
          break;
        case 'medium':
        case 'moderate':
        case 'modéré':
          factor = 1.2;
          break;
        case 'low':
        case 'easy':
        case 'facile':
          factor = 0.8;
          break;
      }
    }
    
    // Ajuster en fonction du TSS (Training Stress Score) si disponible
    if (activity.tss) {
      if (activity.tss > 150) factor *= 1.2;
      else if (activity.tss < 50) factor *= 0.9;
    }
    
    return factor;
  }
  
  /**
   * Analyse la consommation nutritionnelle avant un événement spécifique
   * @param {string} userId - ID de l'utilisateur
   * @param {string} eventId - ID de l'événement
   * @returns {Object} Analyse et recommandations
   */
  static async analyzePreEventNutrition(userId, eventId) {
    try {
      const cacheKey = `pre_event_nutrition:${userId}:${eventId}`;
      const cachedAnalysis = cache.get(cacheKey);
      if (cachedAnalysis) {
        return cachedAnalysis;
      }
      
      // Récupérer l'événement (idéalement depuis un service d'événements)
      // Pour cette démonstration, nous utilisons des données fictives
      const event = {
        id: eventId,
        name: "Grand Prix des Ardennes",
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours dans le futur
        type: "road_race",
        distance: 120, // km
        elevation: 1800, // m
        expectedDuration: 3.5, // heures
        intensity: "high"
      };
      
      // Récupérer le profil utilisateur
      const user = await UserService.getUserById(userId);
      
      // Générer une stratégie nutritionnelle pour l'événement
      const nutritionStrategy = await NutritionService.generateEventStrategy(
        { _id: userId, ...user.profile },
        {
          eventName: event.name,
          eventType: event.type,
          distance: event.distance,
          elevation: event.elevation,
          expectedDuration: event.expectedDuration,
          weather: { temperature: 20, conditions: 'variable' } // valeurs par défaut
        }
      );
      
      // Récupérer les données nutritionnelles actuelles
      const nutritionData = await NutritionData.findOne({ userId });
      
      // Analyser si les habitudes alimentaires actuelles correspondent aux besoins pour l'événement
      let complianceScore = 0;
      let complianceAreas = [];
      
      if (nutritionData && nutritionData.foodJournal && nutritionData.foodJournal.length > 0) {
        // Calculer les moyennes récentes
        const recentStats = nutritionData.getRecentStats(7);
        
        if (recentStats) {
          // Comparer les calories
          const calorieCompliance = recentStats.averageDailyCalories / nutritionStrategy.caloriesBurned;
          if (calorieCompliance >= 0.8 && calorieCompliance <= 1.2) {
            complianceScore += 30;
            complianceAreas.push("Apport calorique approprié");
          } else if (calorieCompliance < 0.8) {
            complianceAreas.push("Apport calorique insuffisant");
          } else {
            complianceAreas.push("Apport calorique potentiellement excessif");
          }
          
          // Comparer les macronutriments
          const carbsTarget = nutritionStrategy.nutritionStrategy.during.carbs || 60;
          if (Math.abs(recentStats.macroDistribution.carbs - carbsTarget) <= 10) {
            complianceScore += 25;
            complianceAreas.push("Répartition des glucides appropriée");
          } else {
            complianceAreas.push("Ajustement nécessaire de l'apport en glucides");
          }
          
          const proteinTarget = nutritionStrategy.nutritionStrategy.during.protein || 15;
          if (Math.abs(recentStats.macroDistribution.protein - proteinTarget) <= 5) {
            complianceScore += 15;
            complianceAreas.push("Apport en protéines approprié");
          } else {
            complianceAreas.push("Ajustement nécessaire de l'apport en protéines");
          }
          
          // Vérifier la diversité alimentaire
          if (Object.keys(recentStats.categoryDistribution).length >= 4) {
            complianceScore += 15;
            complianceAreas.push("Bonne diversité alimentaire");
          } else {
            complianceAreas.push("Diversité alimentaire à améliorer");
          }
          
          // Bonus pour hydratation (si nous avions ces données)
          complianceScore += 15;
        }
      }
      
      // Générer des recommandations d'ajustement
      const daysToEvent = Math.ceil((event.date - new Date()) / (24 * 60 * 60 * 1000));
      
      const adjustmentRecommendations = [
        `J-${daysToEvent}: Augmentez progressivement votre apport en glucides au cours des 3 prochains jours`,
        "Hydratez-vous davantage les 48h précédant l'événement (au moins 2.5-3L d'eau par jour)",
        "La veille de l'événement, privilégiez les glucides complexes et évitez les aliments nouveaux",
        "Le matin de l'événement, prévoyez un repas riche en glucides 2-3h avant le départ"
      ];
      
      if (complianceScore < 50) {
        adjustmentRecommendations.unshift(
          "Attention: vos habitudes alimentaires actuelles nécessitent des ajustements importants pour optimiser votre performance lors de cet événement"
        );
      }
      
      const result = {
        event,
        nutritionStrategy,
        complianceAnalysis: {
          score: complianceScore,
          level: complianceScore >= 80 ? "Excellent" : complianceScore >= 60 ? "Bon" : complianceScore >= 40 ? "Moyen" : "À améliorer",
          strengths: complianceAreas.filter(area => !area.includes("à améliorer") && !area.includes("insuffisant") && !area.includes("excessif") && !area.includes("Ajustement")),
          improvements: complianceAreas.filter(area => area.includes("à améliorer") || area.includes("insuffisant") || area.includes("excessif") || area.includes("Ajustement"))
        },
        adjustmentRecommendations,
        daysToEvent
      };
      
      // Mettre en cache les résultats
      cache.set(cacheKey, result, 3600);
      
      return result;
    } catch (error) {
      console.error(`Erreur lors de l'analyse de la nutrition pré-événement: ${error.message}`);
      return {
        success: false,
        message: `Erreur lors de l'analyse: ${error.message}`
      };
    }
  }
}

module.exports = PerformanceAnalysisService;
