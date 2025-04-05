/**
 * Service de corrélation des performances
 * Analyse les corrélations entre différentes métriques d'entraînement et performances
 */

const CacheService = require('./cache.service');
const TrainingService = require('./training.service');
const TrainingZonesService = require('./training-zones.service');
const NutritionService = require('./nutrition.service');
const PerformanceAnalysisService = require('./performance-analysis.service');
const StatisticsHelper = require('../helpers/statistics.helper');
const mongoose = require('mongoose');
const NodeCache = require('node-cache');

// Cache local pour les calculs lourds
const analysisCache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });

/**
 * Service d'analyse de corrélation des performances
 */
class PerformanceCorrelationService {
  /**
   * Calcule les corrélations entre différentes variables d'entraînement et les performances
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} options - Options d'analyse (période, métriques à analyser, etc.)
   * @returns {Object} Données de corrélation
   */
  static async analyzeTrainingPerformanceCorrelations(userId, options = {}) {
    try {
      // Paramètres par défaut
      const defaults = {
        period: 90, // jours
        activityTypes: ['ride', 'virtualRide'],
        metrics: ['duration', 'distance', 'elevationGain', 'averagePower', 'tss', 'intensity']
      };
      
      // Fusionner avec les options fournies
      const analysisOptions = { ...defaults, ...options };
      
      // Générer une clé de cache unique
      const cacheKey = `correlation_${userId}_${JSON.stringify(analysisOptions)}`;
      
      // Vérifier dans le cache
      const cachedAnalysis = analysisCache.get(cacheKey);
      if (cachedAnalysis) {
        return cachedAnalysis;
      }
      
      // Récupérer les activités sur la période
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - analysisOptions.period);
      
      const activities = await TrainingService.getUserActivities(userId, {
        startDate: startDate.toISOString(),
        types: analysisOptions.activityTypes
      });
      
      if (!activities || activities.length < 5) {
        throw new Error('Données insuffisantes pour l\'analyse de corrélation (minimum 5 activités requises)');
      }
      
      // Préparer les données pour l'analyse
      const correlationData = {
        trainingMetrics: {},
        performanceIndicators: {},
        correlations: {},
        timeSeriesData: [],
        insights: []
      };
      
      // Extraire les métriques d'entraînement
      analysisOptions.metrics.forEach(metric => {
        correlationData.trainingMetrics[metric] = activities.map(activity => {
          // Extraire la valeur de la métrique (gestion des données manquantes)
          let value = this._extractMetricValue(activity, metric);
          return { date: new Date(activity.date), value };
        });
      });
      
      // Calculer les indicateurs de performance
      // 1. Performance récente (moyenne mobile des 7 derniers jours)
      correlationData.performanceIndicators.recentPerformance = this._calculateRecentPerformance(activities);
      
      // 2. Progression (comparaison début vs fin de période)
      correlationData.performanceIndicators.progression = this._calculateProgression(activities);
      
      // 3. Pic de performance
      correlationData.performanceIndicators.peakPerformance = this._calculatePeakPerformance(activities);
      
      // Calculer les corrélations entre métriques d'entraînement et performance
      for (const metric of analysisOptions.metrics) {
        const metricValues = correlationData.trainingMetrics[metric].map(item => item.value);
        
        // Corrélation avec performance récente
        correlationData.correlations[`${metric}_recentPerformance`] = {
          coefficient: StatisticsHelper.calculatePearsonCorrelation(
            metricValues,
            correlationData.performanceIndicators.recentPerformance.values
          ),
          significance: this._calculateSignificance(metricValues, correlationData.performanceIndicators.recentPerformance.values)
        };
        
        // Corrélation avec progression
        correlationData.correlations[`${metric}_progression`] = {
          coefficient: StatisticsHelper.calculatePearsonCorrelation(
            metricValues,
            correlationData.performanceIndicators.progression.values
          ),
          significance: this._calculateSignificance(metricValues, correlationData.performanceIndicators.progression.values)
        };
      }
      
      // Préparer les données chronologiques pour visualisation
      activities.forEach(activity => {
        const dataPoint = {
          date: new Date(activity.date),
          performanceScore: this._calculatePerformanceScore(activity)
        };
        
        // Ajouter les métriques d'entraînement pour chaque activité
        analysisOptions.metrics.forEach(metric => {
          dataPoint[metric] = this._extractMetricValue(activity, metric);
        });
        
        correlationData.timeSeriesData.push(dataPoint);
      });
      
      // Trier les données chronologiques
      correlationData.timeSeriesData.sort((a, b) => a.date - b.date);
      
      // Générer des insights basés sur les corrélations les plus fortes
      correlationData.insights = this._generateCorrelationInsights(correlationData.correlations, analysisOptions.metrics);
      
      // Mettre en cache
      analysisCache.set(cacheKey, correlationData, 3600); // 1 heure
      
      return correlationData;
    } catch (error) {
      console.error(`Erreur lors de l'analyse des corrélations: ${error.message}`);
      throw new Error(`Impossible d'analyser les corrélations de performance: ${error.message}`);
    }
  }

  /**
   * Compare les performances de l'utilisateur avec des cyclistes similaires
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} options - Options de comparaison
   * @returns {Object} Données de comparaison
   */
  static async compareWithSimilarAthletes(userId, options = {}) {
    try {
      // Paramètres par défaut
      const defaults = {
        count: 5, // nombre de cyclistes similaires à trouver
        matchCriteria: ['gender', 'ageRange', 'experienceLevel'],
        includeDetailedStats: true
      };
      
      // Fusionner avec les options fournies
      const comparisonOptions = { ...defaults, ...options };
      
      // Générer une clé de cache unique
      const cacheKey = `athlete_comparison_${userId}_${JSON.stringify(comparisonOptions)}`;
      
      // Vérifier dans le cache
      const cachedComparison = CacheService.getCache().get(cacheKey);
      if (cachedComparison) {
        return cachedComparison;
      }
      
      // Récupérer le profil de l'utilisateur
      const userProfile = await TrainingService.getUserProfile(userId);
      if (!userProfile) {
        throw new Error('Profil utilisateur non trouvé');
      }
      
      // Récupérer les statistiques d'entraînement de l'utilisateur
      const userStats = await TrainingService.getUserStats(userId);
      
      // Récupérer les activités récentes de l'utilisateur
      const recentActivities = await TrainingService.getUserActivities(userId, { limit: 10 });
      
      // Récupérer la progression de l'utilisateur
      const userProgressions = await this._calculateUserProgressions(userId);
      
      // Trouver des cyclistes similaires
      // Note: Ceci est une version simplifiée, une implémentation réelle utiliserait
      // un algorithme plus sophistiqué avec des données anonymisées
      const similarAthletes = await this._findSimilarAthletes(
        userProfile,
        comparisonOptions.matchCriteria,
        comparisonOptions.count
      );
      
      // Enrichir les données des cyclistes similaires
      const enrichedSimilarAthletes = await Promise.all(
        similarAthletes.map(async athlete => {
          // Anonymiser les noms pour la protection des données
          const anonymizedName = `Cycliste ${athlete.anonymizedId}`;
          
          // Récupérer les statistiques si demandé
          let stats = null;
          let performance = null;
          
          if (comparisonOptions.includeDetailedStats) {
            stats = await TrainingService.getUserStats(athlete.id);
            performance = await this._calculateAthletePerfSummary(athlete.id);
          }
          
          return {
            id: athlete.anonymizedId,
            anonymizedName,
            similarity: athlete.similarity,
            stats,
            performance
          };
        })
      );
      
      // Construire les recommandations basées sur la comparaison
      const recommendations = this._generateComparisonRecommendations(
        userStats,
        userProgressions,
        enrichedSimilarAthletes
      );
      
      // Construire l'objet résultat
      const comparisonData = {
        user: {
          stats: userStats,
          recentActivities,
          progressions: userProgressions
        },
        similarAthletes: enrichedSimilarAthletes,
        recommendations
      };
      
      // Mettre en cache
      CacheService.getCache().set(cacheKey, comparisonData, 86400); // 24 heures
      
      return comparisonData;
    } catch (error) {
      console.error(`Erreur lors de la comparaison avec des cyclistes similaires: ${error.message}`);
      throw new Error(`Impossible de comparer avec des cyclistes similaires: ${error.message}`);
    }
  }

  /**
   * Génère des visualisations pour les métriques avancées d'entraînement
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} options - Options de visualisation
   * @returns {Object} Données pour visualisation
   */
  static async generateAdvancedMetricsVisualizations(userId, options = {}) {
    try {
      // Paramètres par défaut
      const defaults = {
        period: 90, // jours
        metrics: ['tss', 'ctl', 'atl', 'tsb', 'if', 'variabilityIndex'],
        includeExplanations: true
      };
      
      // Fusionner avec les options fournies
      const visualizationOptions = { ...defaults, ...options };
      
      // Générer une clé de cache unique
      const cacheKey = `adv_metrics_viz_${userId}_${JSON.stringify(visualizationOptions)}`;
      
      // Vérifier dans le cache
      const cachedVisualization = CacheService.getCache().get(cacheKey);
      if (cachedVisualization) {
        return cachedVisualization;
      }
      
      // Récupérer les activités sur la période
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - visualizationOptions.period);
      
      const activities = await TrainingService.getUserActivities(userId, {
        startDate: startDate.toISOString()
      });
      
      if (!activities || activities.length === 0) {
        throw new Error('Aucune activité disponible pour la période spécifiée');
      }
      
      // Calculer les métriques avancées pour chaque jour
      const dailyMetrics = await this._calculateDailyAdvancedMetrics(userId, activities, startDate);
      
      // Préparer les données pour visualisation avec D3.js/Chart.js
      const visualizationData = {
        metrics: {},
        explanations: {},
        timeSeriesData: dailyMetrics
      };
      
      // Pour chaque métrique demandée, préparer les données de visualisation
      for (const metric of visualizationOptions.metrics) {
        // Extraire les valeurs pour cette métrique
        visualizationData.metrics[metric] = {
          labels: dailyMetrics.map(day => day.date),
          data: dailyMetrics.map(day => day[metric] || 0)
        };
        
        // Ajouter des explications si demandé
        if (visualizationOptions.includeExplanations) {
          visualizationData.explanations[metric] = this._getMetricExplanation(metric);
        }
      }
      
      // Mettre en cache
      CacheService.getCache().set(cacheKey, visualizationData, 3600); // 1 heure
      
      return visualizationData;
    } catch (error) {
      console.error(`Erreur lors de la génération des visualisations: ${error.message}`);
      throw new Error(`Impossible de générer les visualisations: ${error.message}`);
    }
  }

  /**
   * Prédit les performances futures pour un événement spécifique
   * @param {string} userId - ID de l'utilisateur
   * @param {string} eventId - ID de l'événement
   * @param {Object} options - Options de prédiction
   * @returns {Object} Prédictions de performance
   */
  static async predictEventPerformance(userId, eventId, options = {}) {
    try {
      // Paramètres par défaut
      const defaults = {
        includeTrainingReadiness: true,
        includeConfidenceScore: true,
        includeRecommendations: true,
        considerWeather: true
      };
      
      // Fusionner avec les options fournies
      const predictionOptions = { ...defaults, ...options };
      
      // Générer une clé de cache unique
      const cacheKey = `performance_prediction_${userId}_${eventId}_${JSON.stringify(predictionOptions)}`;
      
      // Vérifier dans le cache
      const cachedPrediction = CacheService.getCache().get(cacheKey);
      if (cachedPrediction) {
        return cachedPrediction;
      }
      
      // Récupérer les informations de l'événement
      // Dans une implémentation réelle, vous auriez un service d'événements
      const event = await this._getEventDetails(eventId);
      
      if (!event) {
        throw new Error('Événement non trouvé');
      }
      
      // Récupérer le profil et l'historique de l'utilisateur
      const userProfile = await TrainingService.getUserProfile(userId);
      const userStats = await TrainingService.getUserStats(userId);
      
      // Récupérer les activités récentes (3 mois)
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 90);
      
      const recentActivities = await TrainingService.getUserActivities(userId, {
        startDate: startDate.toISOString()
      });
      
      // Calculer les métriques avancées actuelles
      const advancedMetrics = await this._calculateCurrentAdvancedMetrics(userId, recentActivities);
      
      // Calculer la préparation à l'entraînement
      let trainingReadiness = null;
      if (predictionOptions.includeTrainingReadiness) {
        trainingReadiness = await this._calculateTrainingReadiness(userId, event, advancedMetrics);
      }
      
      // Prédire les performances
      const predictions = this._predictPerformance(
        userProfile,
        userStats,
        event,
        recentActivities,
        predictionOptions.considerWeather
      );
      
      // Calculer le score de confiance
      let confidenceScore = null;
      if (predictionOptions.includeConfidenceScore) {
        confidenceScore = this._calculateConfidenceScore(
          recentActivities,
          event,
          trainingReadiness
        );
      }
      
      // Générer des recommandations
      let recommendations = [];
      if (predictionOptions.includeRecommendations) {
        recommendations = this._generateEventRecommendations(
          userProfile,
          event,
          predictions,
          trainingReadiness
        );
      }
      
      // Construire l'objet résultat
      const predictionData = {
        eventId,
        eventName: event.name,
        eventDate: event.date,
        predictions,
        trainingReadiness,
        confidenceScore,
        recommendations
      };
      
      // Mettre en cache
      CacheService.getCache().set(cacheKey, predictionData, 86400); // 24 heures
      
      return predictionData;
    } catch (error) {
      console.error(`Erreur lors de la prédiction de performance: ${error.message}`);
      throw new Error(`Impossible de prédire la performance: ${error.message}`);
    }
  }

  /**
   * Extrait la valeur d'une métrique spécifique d'une activité
   * @private
   * @param {Object} activity - Activité d'entraînement
   * @param {string} metric - Nom de la métrique
   * @returns {number} Valeur de la métrique
   */
  static _extractMetricValue(activity, metric) {
    // Métriques de base directement disponibles dans l'activité
    if (activity[metric] !== undefined) {
      return activity[metric];
    }
    
    // Métriques calculées
    switch (metric) {
      case 'tss':
        return this._calculateTSS(activity);
      case 'intensity':
        return this._calculateIntensity(activity);
      case 'variabilityIndex':
        return this._calculateVariabilityIndex(activity);
      case 'efficiencyFactor':
        return this._calculateEfficiencyFactor(activity);
      default:
        return 0; // Valeur par défaut si la métrique n'est pas trouvée
    }
  }

  /**
   * Calcule le TSS (Training Stress Score) d'une activité
   * @private
   * @param {Object} activity - Activité d'entraînement
   * @returns {number} TSS calculé
   */
  static _calculateTSS(activity) {
    // Formule simplifiée: TSS = (sec * NP * IF) / (FTP * 3600) * 100
    if (!activity.averagePower || !activity.duration) {
      return 0;
    }
    
    const ftp = activity.userFTP || 200; // FTP par défaut si non disponible
    const normalizedPower = activity.normalizedPower || activity.averagePower;
    const intensityFactor = normalizedPower / ftp;
    
    // Convertir la durée en secondes si nécessaire
    let durationSeconds = activity.duration;
    if (typeof durationSeconds === 'string') {
      // Si la durée est au format "HH:MM:SS"
      const parts = durationSeconds.split(':').map(Number);
      durationSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    
    return (durationSeconds * normalizedPower * intensityFactor) / (ftp * 3600) * 100;
  }

  /**
   * Calcule le facteur d'intensité d'une activité
   * @private
   * @param {Object} activity - Activité d'entraînement
   * @returns {number} Facteur d'intensité
   */
  static _calculateIntensity(activity) {
    if (!activity.averagePower) {
      return 0;
    }
    
    const ftp = activity.userFTP || 200; // FTP par défaut si non disponible
    const normalizedPower = activity.normalizedPower || activity.averagePower;
    
    return normalizedPower / ftp;
  }

  /**
   * Calcule l'indice de variabilité d'une activité
   * @private
   * @param {Object} activity - Activité d'entraînement
   * @returns {number} Indice de variabilité
   */
  static _calculateVariabilityIndex(activity) {
    if (!activity.averagePower || !activity.normalizedPower) {
      return 1.0; // Valeur par défaut si données insuffisantes
    }
    
    return activity.normalizedPower / activity.averagePower;
  }

  /**
   * Calcule le facteur d'efficacité d'une activité
   * @private
   * @param {Object} activity - Activité d'entraînement
   * @returns {number} Facteur d'efficacité
   */
  static _calculateEfficiencyFactor(activity) {
    if (!activity.normalizedPower || !activity.averageHeartRate) {
      return 0;
    }
    
    return activity.normalizedPower / activity.averageHeartRate;
  }

  /**
   * Méthodes auxiliaires qui seraient implémentées dans une version complète
   * Ces méthodes seraient complétées avec des algorithmes spécifiques
   */
  
  static _calculateRecentPerformance(activities) {
    // Simuler un calcul de performance récente
    return {
      values: activities.map(a => this._calculatePerformanceScore(a) || 0),
      trend: 'improving'
    };
  }
  
  static _calculateProgression(activities) {
    // Simuler un calcul de progression
    return {
      values: activities.map(a => a.averagePower || 0),
      percent: 5.2
    };
  }
  
  static _calculatePeakPerformance(activities) {
    // Simuler un calcul de pic de performance
    return {
      value: Math.max(...activities.map(a => a.averagePower || 0)),
      date: new Date(activities[0].date)
    };
  }
  
  static _calculatePerformanceScore(activity) {
    // Simuler un score de performance
    if (!activity.averagePower) return 0;
    
    return (activity.averagePower * 0.75) + 
           (activity.normalizedPower || activity.averagePower) * 0.25;
  }
  
  static _calculateSignificance(array1, array2) {
    // Simuler un calcul de significativité statistique
    return Math.random() < 0.7 ? 'significant' : 'not significant';
  }
  
  static _generateCorrelationInsights(correlations, metrics) {
    // Simuler des insights basés sur les corrélations
    return [
      'Les séances d\'intensité élevée semblent avoir un impact particulièrement positif sur votre progression.',
      'Vos performances s\'améliorent davantage après des périodes de récupération adéquates.',
      'Les longues sorties d\'endurance sont fortement corrélées à l\'amélioration de votre FTP.'
    ];
  }

  // Autres méthodes auxiliaires seraient définies ici
}

module.exports = PerformanceCorrelationService;
