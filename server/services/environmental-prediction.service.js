/**
 * Service de prédiction environnementale
 * Prédit les conditions environnementales pour les itinéraires cyclistes
 */

const NodeCache = require('node-cache');
const logger = require('../utils/logger');

class EnvironmentalPredictionService {
  constructor() {
    // Cache pour les prédictions (TTL de 3 heures)
    this.cache = new NodeCache({ stdTTL: 10800 });
    
    // Modèles de prédiction
    this.models = {
      weather: null,
      airQuality: null,
      wind: null
    };
    
    // Initialiser les modèles
    this.initModels();
    
    logger.info('Service de prédiction environnementale initialisé');
  }
  
  // Initialisation des modèles prédictifs
  async initModels() {
    try {
      // Dans une implémentation réelle, vous chargeriez ici des modèles ML
      // Pour cette version, nous utiliserons des algorithmes basés sur des règles
      this.models.weather = this.createWeatherModel();
      this.models.airQuality = this.createAirQualityModel();
      this.models.wind = this.createWindModel();
      
      logger.info('Modèles prédictifs initialisés');
    } catch (error) {
      logger.error(`Erreur lors de l'initialisation des modèles: ${error.message}`);
    }
  }
  
  // Création du modèle météo (version simplifiée)
  createWeatherModel() {
    return {
      predict: async (location, historicalData, targetDate) => {
        // Algorithme de prédiction basé sur les données historiques
        // et les tendances saisonnières
        return this.predictWeatherConditions(location, historicalData, targetDate);
      }
    };
  }
  
  // Création du modèle de qualité d'air (version simplifiée)
  createAirQualityModel() {
    return {
      predict: async (location, historicalData, targetDate) => {
        return this.predictAirQualityConditions(location, historicalData, targetDate);
      }
    };
  }
  
  // Création du modèle de vent (version simplifiée)
  createWindModel() {
    return {
      predict: async (location, historicalData, targetDate) => {
        return this.predictWindConditions(location, historicalData, targetDate);
      }
    };
  }
  
  /**
   * Prédit les conditions environnementales pour un itinéraire et une date future
   * @param {Array<Object>} routePoints - Points de l'itinéraire
   * @param {Date} targetDate - Date cible pour la prédiction
   * @returns {Promise<Object>} Prédictions environnementales
   */
  async predictRouteConditions(routePoints, targetDate) {
    try {
      // Générer une clé de cache unique
      const cacheKey = this.generateCacheKey(routePoints, targetDate);
      
      // Vérifier si les prédictions sont en cache
      const cachedPredictions = this.cache.get(cacheKey);
      if (cachedPredictions) {
        logger.info('Prédictions récupérées depuis le cache');
        return cachedPredictions;
      }
      
      // Extraire les points clés de l'itinéraire
      const keyPoints = this.extractKeyRoutePoints(routePoints);
      
      // Récupérer les données historiques pour ces points
      const historicalData = await this.getHistoricalData(keyPoints, targetDate);
      
      // Générer les prédictions pour chaque point clé
      const predictions = await Promise.all(
        keyPoints.map(async (point, index) => {
          const pointHistory = historicalData[index];
          
          // Prédire les conditions météo, qualité d'air et vent
          const [weatherPrediction, airQualityPrediction, windPrediction] = await Promise.all([
            this.models.weather.predict(point, pointHistory.weatherHistory, targetDate),
            this.models.airQuality.predict(point, pointHistory.airQualityHistory, targetDate),
            this.models.wind.predict(point, pointHistory.windHistory, targetDate)
          ]);
          
          return {
            location: point,
            weather: weatherPrediction,
            airQuality: airQualityPrediction,
            wind: windPrediction,
            overallScore: this.calculateOverallScore(weatherPrediction, airQualityPrediction, windPrediction)
          };
        })
      );
      
      // Générer la prédiction globale pour l'itinéraire
      const routePrediction = {
        routePoints: routePoints.length,
        keyPointsPredictions: predictions,
        overallPrediction: this.generateOverallPrediction(predictions),
        optimalTimeOfDay: this.determineOptimalTimeOfDay(predictions),
        confidence: this.calculatePredictionConfidence(predictions, targetDate),
        timestamp: new Date().toISOString()
      };
      
      // Stocker en cache
      this.cache.set(cacheKey, routePrediction);
      
      return routePrediction;
    } catch (error) {
      logger.error(`Erreur lors de la prédiction des conditions: ${error.message}`);
      throw new Error(`Échec de la prédiction environnementale: ${error.message}`);
    }
  }
  
  /**
   * Extrait les points clés d'un itinéraire pour l'analyse
   * @param {Array<Object>} routePoints - Tous les points de l'itinéraire
   * @returns {Array<Object>} Points clés sélectionnés
   */
  extractKeyRoutePoints(routePoints) {
    if (routePoints.length <= 5) {
      return routePoints; // Tous les points si peu nombreux
    }
    
    const keyPoints = [];
    
    // Toujours inclure le point de départ
    keyPoints.push(routePoints[0]);
    
    // Sélectionner des points intermédiaires à intervalles réguliers
    const step = Math.floor(routePoints.length / 4);
    for (let i = step; i < routePoints.length - step; i += step) {
      keyPoints.push(routePoints[i]);
    }
    
    // Toujours inclure le point d'arrivée
    keyPoints.push(routePoints[routePoints.length - 1]);
    
    return keyPoints;
  }
  
  /**
   * Récupère les données historiques pour un ensemble de points
   * @param {Array<Object>} points - Points géographiques
   * @param {Date} targetDate - Date cible
   * @returns {Promise<Array<Object>>} Données historiques
   */
  async getHistoricalData(points, targetDate) {
    // Simulation de récupération de données historiques
    return points.map(point => ({
      location: point,
      weatherHistory: this.generateMockWeatherHistory(point, targetDate),
      airQualityHistory: this.generateMockAirQualityHistory(point, targetDate),
      windHistory: this.generateMockWindHistory(point, targetDate)
    }));
  }
  
  /**
   * Générer une clé de cache unique pour un itinéraire et une date
   * @param {Array<Object>} routePoints - Points de l'itinéraire
   * @param {Date} targetDate - Date cible
   * @returns {string} Clé de cache
   */
  generateCacheKey(routePoints, targetDate) {
    // Utiliser les points de départ et d'arrivée pour la clé
    const start = routePoints[0];
    const end = routePoints[routePoints.length - 1];
    
    // Formater la date (YYYY-MM-DD)
    const dateStr = targetDate.toISOString().split('T')[0];
    
    return `prediction_${start.lat.toFixed(2)}_${start.lng.toFixed(2)}_${end.lat.toFixed(2)}_${end.lng.toFixed(2)}_${dateStr}`;
  }
  
  /**
   * Calcule un score global pour les conditions environnementales
   * @param {Object} weather - Prédiction météo
   * @param {Object} airQuality - Prédiction qualité d'air
   * @param {Object} wind - Prédiction vent
   * @returns {Object} Score global
   */
  calculateOverallScore(weather, airQuality, wind) {
    // Calculer des scores individuels (0-100)
    const weatherScore = this.calculateWeatherScore(weather);
    const airQualityScore = this.calculateAirQualityScore(airQuality);
    const windScore = this.calculateWindScore(wind);
    
    // Calculer le score global (pondéré)
    const overallScore = Math.round(
      weatherScore * 0.5 + 
      airQualityScore * 0.3 + 
      windScore * 0.2
    );
    
    // Déterminer la catégorie
    let category;
    if (overallScore >= 80) category = 'Excellent';
    else if (overallScore >= 60) category = 'Bon';
    else if (overallScore >= 40) category = 'Acceptable';
    else if (overallScore >= 20) category = 'Difficile';
    else category = 'Déconseillé';
    
    return {
      score: overallScore,
      category,
      components: {
        weather: weatherScore,
        airQuality: airQualityScore,
        wind: windScore
      }
    };
  }
  
  /**
   * Génère une prédiction globale pour l'itinéraire basée sur les prédictions des points clés
   * @param {Array<Object>} pointPredictions - Prédictions pour les points clés
   * @returns {Object} Prédiction globale
   */
  generateOverallPrediction(pointPredictions) {
    // Calculer la moyenne des scores
    const avgScore = pointPredictions.reduce((sum, pred) => sum + pred.overallScore.score, 0) / pointPredictions.length;
    
    // Déterminer la catégorie globale
    let category;
    if (avgScore >= 80) category = 'Excellent';
    else if (avgScore >= 60) category = 'Bon';
    else if (avgScore >= 40) category = 'Acceptable';
    else if (avgScore >= 20) category = 'Difficile';
    else category = 'Déconseillé';
    
    // Identifier les points problématiques
    const concernPoints = pointPredictions
      .filter(pred => pred.overallScore.score < 40)
      .map(pred => ({
        location: pred.location,
        score: pred.overallScore.score,
        issues: this.identifyIssues(pred)
      }));
    
    return {
      score: Math.round(avgScore),
      category,
      concernPoints: concernPoints.length > 0 ? concernPoints : null,
      summary: this.generateConditionSummary(pointPredictions)
    };
  }
  
  /**
   * Détermine l'heure optimale de la journée pour l'itinéraire
   * @param {Array<Object>} predictions - Prédictions pour les points clés
   * @returns {Object} Heure optimale
   */
  determineOptimalTimeOfDay(predictions) {
    // Simulation simple - en réalité, analyserait les variations horaires des prévisions
    return {
      morning: {
        score: 75,
        start: '07:00',
        end: '10:00',
        reason: 'Températures modérées et vent faible'
      },
      midday: {
        score: 60,
        start: '10:00',
        end: '14:00',
        reason: 'Températures plus élevées mais bonne visibilité'
      },
      afternoon: {
        score: 80,
        start: '14:00',
        end: '18:00',
        reason: 'Conditions optimales avec vent favorable'
      },
      recommendation: 'afternoon'
    };
  }
  
  /**
   * Calcule la confiance de la prédiction
   * @param {Array<Object>} predictions - Prédictions pour les points clés
   * @param {Date} targetDate - Date cible
   * @returns {Object} Niveau de confiance
   */
  calculatePredictionConfidence(predictions, targetDate) {
    // La confiance diminue avec l'éloignement de la date
    const today = new Date();
    const daysAhead = Math.round((targetDate - today) / (1000 * 60 * 60 * 24));
    
    let confidenceScore;
    if (daysAhead <= 2) confidenceScore = 85;
    else if (daysAhead <= 5) confidenceScore = 70;
    else if (daysAhead <= 10) confidenceScore = 55;
    else confidenceScore = 40;
    
    // Ajuster en fonction de la variabilité des prédictions
    const scores = predictions.map(p => p.overallScore.score);
    const variance = this.calculateVariance(scores);
    
    if (variance > 400) confidenceScore -= 15;
    else if (variance > 200) confidenceScore -= 10;
    else if (variance > 100) confidenceScore -= 5;
    
    let level;
    if (confidenceScore >= 80) level = 'Élevée';
    else if (confidenceScore >= 60) level = 'Bonne';
    else if (confidenceScore >= 40) level = 'Moyenne';
    else level = 'Faible';
    
    return {
      score: confidenceScore,
      level,
      factors: {
        timeHorizon: daysAhead,
        variability: Math.round(variance)
      }
    };
  }
  
  /**
   * Calcule la variance d'un ensemble de valeurs
   * @param {Array<number>} values - Valeurs
   * @returns {number} Variance
   */
  calculateVariance(values) {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }
  
  // Méthodes de génération de données mockées pour démonstration
  generateMockWeatherHistory(point, targetDate) {
    return [{
      temperature: { min: 10, max: 22, avg: 16 },
      precipitation: { probability: 30, amount: 2 },
      conditions: 'partly_cloudy'
    }];
  }
  
  generateMockAirQualityHistory(point, targetDate) {
    return [{
      index: 2, // Bon
      pollutants: {
        pm25: 15,
        pm10: 25,
        o3: 40
      }
    }];
  }
  
  generateMockWindHistory(point, targetDate) {
    return [{
      speed: 15, // km/h
      direction: 270, // Ouest
      gusts: 25
    }];
  }
  
  /**
   * Identifie les problèmes spécifiques dans une prédiction
   * @param {Object} prediction - Prédiction pour un point
   * @returns {Array<string>} Problèmes identifiés
   */
  identifyIssues(prediction) {
    const issues = [];
    
    if (prediction.weather.precipitation.probability > 70) {
      issues.push('Risque élevé de précipitations');
    }
    
    if (prediction.wind.speed > 30) {
      issues.push('Vents forts');
    }
    
    if (prediction.airQuality.index > 3) {
      issues.push('Qualité de l\'air dégradée');
    }
    
    return issues;
  }
  
  /**
   * Génère un résumé des conditions pour l'itinéraire
   * @param {Array<Object>} predictions - Prédictions pour les points clés
   * @returns {string} Résumé des conditions
   */
  generateConditionSummary(predictions) {
    // Simplification - en réalité, analyserait les tendances et générerait un texte pertinent
    const avgScore = predictions.reduce((sum, pred) => sum + pred.overallScore.score, 0) / predictions.length;
    
    if (avgScore >= 80) {
      return "Conditions excellentes sur l'ensemble de l'itinéraire. Idéal pour une sortie à vélo.";
    } else if (avgScore >= 60) {
      return "Bonnes conditions générales avec quelques variations locales. Sortie recommandée.";
    } else if (avgScore >= 40) {
      return "Conditions acceptables mais avec des zones potentiellement difficiles. Prévoyez des vêtements adaptés.";
    } else {
      return "Conditions difficiles sur plusieurs segments de l'itinéraire. Sortie déconseillée ou à adapter.";
    }
  }
  
  /**
   * Calcule un score pour les conditions météo
   * @param {Object} weather - Prédiction météo
   * @returns {number} Score (0-100)
   */
  calculateWeatherScore(weather) {
    // Simplification - évaluerait la température, précipitations, etc.
    return 100 - Math.min(100, weather.precipitation.probability);
  }
  
  /**
   * Calcule un score pour la qualité de l'air
   * @param {Object} airQuality - Prédiction qualité d'air
   * @returns {number} Score (0-100)
   */
  calculateAirQualityScore(airQuality) {
    // Simplification - basé sur l'indice de qualité de l'air
    return 100 - (airQuality.index * 20);
  }
  
  /**
   * Calcule un score pour les conditions de vent
   * @param {Object} wind - Prédiction vent
   * @returns {number} Score (0-100)
   */
  calculateWindScore(wind) {
    // Simplification - considère la vitesse du vent
    return 100 - Math.min(100, (wind.speed * 2));
  }
  
  /**
   * Prédit les conditions météorologiques
   * @param {Object} location - Localisation
   * @param {Array<Object>} historicalData - Données historiques
   * @param {Date} targetDate - Date cible
   * @returns {Object} Prédiction météo
   */
  async predictWeatherConditions(location, historicalData, targetDate) {
    // Simulation simple d'une prédiction météo
    return {
      temperature: {
        min: 12,
        max: 24,
        avg: 18
      },
      precipitation: {
        probability: 30,
        amount: 2
      },
      conditions: 'partly_cloudy',
      confidence: 0.75
    };
  }
  
  /**
   * Prédit les conditions de qualité d'air
   * @param {Object} location - Localisation
   * @param {Array<Object>} historicalData - Données historiques
   * @param {Date} targetDate - Date cible
   * @returns {Object} Prédiction qualité d'air
   */
  async predictAirQualityConditions(location, historicalData, targetDate) {
    // Simulation simple d'une prédiction de qualité d'air
    return {
      index: 2, // Bon
      pollutants: {
        pm25: 15,
        pm10: 25,
        o3: 40
      },
      confidence: 0.8
    };
  }
  
  /**
   * Prédit les conditions de vent
   * @param {Object} location - Localisation
   * @param {Array<Object>} historicalData - Données historiques
   * @param {Date} targetDate - Date cible
   * @returns {Object} Prédiction vent
   */
  async predictWindConditions(location, historicalData, targetDate) {
    // Simulation simple d'une prédiction de vent
    return {
      speed: 15, // km/h
      direction: 270, // Ouest
      gusts: 25,
      confidence: 0.7
    };
  }
}

module.exports = new EnvironmentalPredictionService();
