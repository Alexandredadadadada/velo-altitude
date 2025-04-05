/**
 * Prédicteur d'utilisation des quotas API
 * Utilise des modèles statistiques simples pour prédire l'utilisation future des quotas
 */

const { logger } = require('./logger');
const quotaAnalytics = require('./quota-analytics');

class QuotaPredictor {
  constructor(options = {}) {
    this.config = {
      predictionHorizon: options.predictionHorizon || 7, // Jours
      confidenceInterval: options.confidenceInterval || 0.95, // Intervalle de confiance (95%)
      minimumDataPoints: options.minimumDataPoints || 14, // Nombre minimum de points de données requis
      seasonalityPeriod: options.seasonalityPeriod || 7, // Période de saisonnalité (hebdomadaire)
      smoothingFactor: options.smoothingFactor || 0.3 // Facteur de lissage pour les moyennes mobiles
    };
    
    this.models = {
      daily: {
        trend: [], // Tendance quotidienne
        seasonal: [], // Composante saisonnière
        lastPredictions: [] // Dernières prédictions pour évaluation
      },
      hourly: {
        pattern: {}, // Modèle d'utilisation horaire
        peakHours: [] // Heures de pointe
      }
    };
    
    logger.info('Système de prédiction des quotas API initialisé');
  }
  
  /**
   * Génère des prédictions d'utilisation pour les jours à venir
   * @returns {Object} Prédictions d'utilisation
   */
  generatePredictions() {
    try {
      // Récupérer les données historiques
      const historicalData = this._getHistoricalData();
      
      if (!this._hasEnoughData(historicalData)) {
        return {
          status: 'insufficient_data',
          message: 'Données insuffisantes pour générer des prédictions fiables',
          minimumRequired: this.config.minimumDataPoints,
          current: historicalData.length
        };
      }
      
      // Calculer les composantes du modèle
      this._calculateTrend(historicalData);
      this._calculateSeasonality(historicalData);
      
      // Générer les prédictions
      const predictions = this._forecast(historicalData);
      
      // Calculer les métriques de qualité
      const accuracy = this._evaluateAccuracy();
      
      return {
        status: 'success',
        predictions: predictions.map((value, index) => ({
          day: this._formatDate(new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000)),
          predicted: Math.round(value),
          lowerBound: Math.round(value * (1 - (1 - this.config.confidenceInterval))),
          upperBound: Math.round(value * (1 + (1 - this.config.confidenceInterval)))
        })),
        accuracy: {
          mape: accuracy.mape, // Erreur absolue moyenne en pourcentage
          rmse: accuracy.rmse, // Racine carrée de l'erreur quadratique moyenne
          confidence: this.config.confidenceInterval
        },
        insights: this._generateInsights(predictions)
      };
    } catch (error) {
      logger.error(`Erreur lors de la génération des prédictions: ${error.message}`);
      return {
        status: 'error',
        message: `Erreur lors de la génération des prédictions: ${error.message}`
      };
    }
  }
  
  /**
   * Prédit l'utilisation pour une journée spécifique
   * @param {Date} date Date pour laquelle générer la prédiction
   * @returns {Object} Prédiction pour la journée
   */
  predictForDate(date) {
    try {
      const predictions = this.generatePredictions();
      
      if (predictions.status !== 'success') {
        return predictions;
      }
      
      const targetDate = this._formatDate(date);
      const dayIndex = this._getDayDifference(new Date(), date);
      
      if (dayIndex < 0 || dayIndex >= predictions.predictions.length) {
        return {
          status: 'out_of_range',
          message: 'Date hors de la plage de prédiction'
        };
      }
      
      const prediction = predictions.predictions[dayIndex];
      
      // Ajouter la répartition horaire
      const hourlyDistribution = this._predictHourlyDistribution(date, prediction.predicted);
      
      return {
        status: 'success',
        date: targetDate,
        prediction: {
          ...prediction,
          hourlyDistribution
        }
      };
    } catch (error) {
      logger.error(`Erreur lors de la prédiction pour la date ${date}: ${error.message}`);
      return {
        status: 'error',
        message: `Erreur lors de la prédiction: ${error.message}`
      };
    }
  }
  
  /**
   * Détermine si une date donnée risque de dépasser le quota
   * @param {Date} date Date à vérifier
   * @param {number} quotaLimit Limite de quota journalier
   * @returns {Object} Évaluation du risque
   */
  assessQuotaRisk(date, quotaLimit) {
    try {
      const prediction = this.predictForDate(date);
      
      if (prediction.status !== 'success') {
        return prediction;
      }
      
      const { predicted, upperBound } = prediction.prediction;
      const riskRatio = predicted / quotaLimit;
      const worstCaseRatio = upperBound / quotaLimit;
      
      let riskLevel = 'low';
      if (worstCaseRatio >= 1) {
        riskLevel = 'critical';
      } else if (riskRatio >= 0.8) {
        riskLevel = 'high';
      } else if (riskRatio >= 0.6) {
        riskLevel = 'medium';
      }
      
      return {
        status: 'success',
        date: prediction.date,
        quotaLimit,
        predicted,
        riskLevel,
        riskRatio: parseFloat(riskRatio.toFixed(2)),
        worstCaseRatio: parseFloat(worstCaseRatio.toFixed(2)),
        recommendations: this._generateRiskRecommendations(riskLevel, riskRatio)
      };
    } catch (error) {
      logger.error(`Erreur lors de l'évaluation du risque: ${error.message}`);
      return {
        status: 'error',
        message: `Erreur lors de l'évaluation du risque: ${error.message}`
      };
    }
  }
  
  /**
   * Récupère les données historiques d'utilisation
   * @returns {Array} Données historiques
   * @private
   */
  _getHistoricalData() {
    const analytics = quotaAnalytics.data.dailyUsage || {};
    
    // Convertir en tableau trié par date
    return Object.entries(analytics)
      .map(([date, data]) => ({
        date,
        count: data.count || 0
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
  
  /**
   * Vérifie s'il y a suffisamment de données pour générer des prédictions fiables
   * @param {Array} data Données historiques
   * @returns {boolean} True si suffisamment de données
   * @private
   */
  _hasEnoughData(data) {
    return data.length >= this.config.minimumDataPoints;
  }
  
  /**
   * Calcule la tendance à partir des données historiques
   * @param {Array} data Données historiques
   * @private
   */
  _calculateTrend(data) {
    // Utiliser une moyenne mobile simple pour la tendance
    const counts = data.map(item => item.count);
    const windowSize = Math.min(7, Math.floor(data.length / 2));
    
    this.models.daily.trend = [];
    
    for (let i = 0; i < counts.length; i++) {
      let sum = 0;
      let validPoints = 0;
      
      for (let j = Math.max(0, i - windowSize); j <= Math.min(counts.length - 1, i + windowSize); j++) {
        sum += counts[j];
        validPoints++;
      }
      
      this.models.daily.trend.push(sum / validPoints);
    }
  }
  
  /**
   * Calcule la composante saisonnière
   * @param {Array} data Données historiques
   * @private
   */
  _calculateSeasonality(data) {
    const period = this.config.seasonalityPeriod;
    const counts = data.map(item => item.count);
    
    // Initialiser le modèle saisonnier
    this.models.daily.seasonal = Array(period).fill(0);
    
    // Calculer les moyennes par jour de la semaine
    const dayTotals = Array(period).fill(0);
    const dayCounts = Array(period).fill(0);
    
    data.forEach((item, index) => {
      const date = new Date(item.date);
      const dayOfWeek = date.getDay();
      
      dayTotals[dayOfWeek] += item.count / this.models.daily.trend[index];
      dayCounts[dayOfWeek]++;
    });
    
    // Calculer les indices saisonniers
    for (let i = 0; i < period; i++) {
      this.models.daily.seasonal[i] = dayCounts[i] > 0 ? dayTotals[i] / dayCounts[i] : 1;
    }
    
    // Normaliser pour que la somme soit égale à la période
    const seasonalSum = this.models.daily.seasonal.reduce((sum, val) => sum + val, 0);
    const normalizationFactor = period / seasonalSum;
    
    this.models.daily.seasonal = this.models.daily.seasonal.map(val => val * normalizationFactor);
  }
  
  /**
   * Génère des prévisions pour les jours à venir
   * @param {Array} data Données historiques
   * @returns {Array} Prévisions
   * @private
   */
  _forecast(data) {
    const horizon = this.config.predictionHorizon;
    const forecasts = [];
    
    // Calculer la tendance future
    const recentTrend = this.models.daily.trend.slice(-14);
    const trendSlope = this._calculateTrendSlope(recentTrend);
    
    // Dernière valeur de tendance
    const lastTrendValue = this.models.daily.trend[this.models.daily.trend.length - 1];
    
    // Générer les prévisions
    for (let i = 1; i <= horizon; i++) {
      const forecastDate = new Date();
      forecastDate.setDate(forecastDate.getDate() + i);
      
      const dayOfWeek = forecastDate.getDay();
      const seasonalFactor = this.models.daily.seasonal[dayOfWeek];
      
      // Tendance projetée
      const projectedTrend = lastTrendValue + (trendSlope * i);
      
      // Prévision finale (tendance × saisonnalité)
      const forecast = projectedTrend * seasonalFactor;
      
      // Assurer que la prévision est positive
      forecasts.push(Math.max(0, forecast));
    }
    
    return forecasts;
  }
  
  /**
   * Calcule la pente de la tendance récente
   * @param {Array} trendData Données de tendance
   * @returns {number} Pente de la tendance
   * @private
   */
  _calculateTrendSlope(trendData) {
    if (trendData.length < 2) return 0;
    
    // Régression linéaire simple
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;
    const n = trendData.length;
    
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += trendData[i];
      sumXY += i * trendData[i];
      sumXX += i * i;
    }
    
    // Formule de la pente: (n*sumXY - sumX*sumY) / (n*sumXX - sumX^2)
    const denominator = n * sumXX - sumX * sumX;
    
    if (denominator === 0) return 0;
    
    return (n * sumXY - sumX * sumY) / denominator;
  }
  
  /**
   * Évalue la précision des prédictions précédentes
   * @returns {Object} Métriques de précision
   * @private
   */
  _evaluateAccuracy() {
    // Si nous n'avons pas de prédictions précédentes, retourner des valeurs par défaut
    if (this.models.daily.lastPredictions.length === 0) {
      return {
        mape: null,
        rmse: null
      };
    }
    
    // Récupérer les données réelles pour les jours prédits
    const actualData = this._getHistoricalData();
    const predictions = this.models.daily.lastPredictions;
    
    // Calculer les erreurs
    let sumAbsPercentError = 0;
    let sumSquaredError = 0;
    let validComparisons = 0;
    
    predictions.forEach(prediction => {
      const actual = actualData.find(item => item.date === prediction.date);
      
      if (actual) {
        const absPercentError = Math.abs((actual.count - prediction.value) / actual.count);
        const squaredError = Math.pow(actual.count - prediction.value, 2);
        
        sumAbsPercentError += absPercentError;
        sumSquaredError += squaredError;
        validComparisons++;
      }
    });
    
    if (validComparisons === 0) {
      return {
        mape: null,
        rmse: null
      };
    }
    
    const mape = (sumAbsPercentError / validComparisons) * 100;
    const rmse = Math.sqrt(sumSquaredError / validComparisons);
    
    return {
      mape: parseFloat(mape.toFixed(2)),
      rmse: parseFloat(rmse.toFixed(2))
    };
  }
  
  /**
   * Prédit la distribution horaire pour une journée
   * @param {Date} date Date cible
   * @param {number} totalPredicted Total prédit pour la journée
   * @returns {Array} Distribution horaire
   * @private
   */
  _predictHourlyDistribution(date, totalPredicted) {
    // Récupérer le modèle horaire ou en créer un par défaut
    if (!this.models.hourly.pattern || Object.keys(this.models.hourly.pattern).length === 0) {
      this._buildHourlyModel();
    }
    
    const dayOfWeek = date.getDay();
    const dayType = [0, 6].includes(dayOfWeek) ? 'weekend' : 'weekday';
    const hourlyPattern = this.models.hourly.pattern[dayType] || this._getDefaultHourlyPattern(dayType);
    
    // Appliquer le modèle au total prédit
    return hourlyPattern.map(ratio => ({
      hour: ratio.hour,
      predicted: Math.round(totalPredicted * ratio.ratio)
    }));
  }
  
  /**
   * Construit un modèle de distribution horaire à partir des données historiques
   * @private
   */
  _buildHourlyModel() {
    // Initialiser le modèle
    this.models.hourly.pattern = {
      weekday: Array(24).fill(0).map((_, i) => ({ hour: i, count: 0, ratio: 0 })),
      weekend: Array(24).fill(0).map((_, i) => ({ hour: i, count: 0, ratio: 0 }))
    };
    
    // Compter les occurrences par heure
    const hourlyBreakdown = quotaAnalytics.data.hourlyBreakdown || {};
    let weekdayTotal = 0;
    let weekendTotal = 0;
    
    Object.entries(hourlyBreakdown).forEach(([date, hours]) => {
      const dayDate = new Date(date);
      const dayOfWeek = dayDate.getDay();
      const dayType = [0, 6].includes(dayOfWeek) ? 'weekend' : 'weekday';
      
      Object.entries(hours).forEach(([hour, count]) => {
        const hourNum = parseInt(hour, 10);
        if (hourNum >= 0 && hourNum < 24) {
          this.models.hourly.pattern[dayType][hourNum].count += count;
          
          if (dayType === 'weekday') {
            weekdayTotal += count;
          } else {
            weekendTotal += count;
          }
        }
      });
    });
    
    // Calculer les ratios
    if (weekdayTotal > 0) {
      this.models.hourly.pattern.weekday = this.models.hourly.pattern.weekday.map(item => ({
        ...item,
        ratio: item.count / weekdayTotal
      }));
    } else {
      this.models.hourly.pattern.weekday = this._getDefaultHourlyPattern('weekday');
    }
    
    if (weekendTotal > 0) {
      this.models.hourly.pattern.weekend = this.models.hourly.pattern.weekend.map(item => ({
        ...item,
        ratio: item.count / weekendTotal
      }));
    } else {
      this.models.hourly.pattern.weekend = this._getDefaultHourlyPattern('weekend');
    }
    
    // Identifier les heures de pointe
    this.models.hourly.peakHours = {
      weekday: this._identifyPeakHours(this.models.hourly.pattern.weekday),
      weekend: this._identifyPeakHours(this.models.hourly.pattern.weekend)
    };
  }
  
  /**
   * Fournit un modèle horaire par défaut
   * @param {string} dayType Type de jour ('weekday' ou 'weekend')
   * @returns {Array} Modèle horaire par défaut
   * @private
   */
  _getDefaultHourlyPattern(dayType) {
    if (dayType === 'weekday') {
      // Modèle pour jour de semaine: pic le matin et en fin d'après-midi
      return Array(24).fill(0).map((_, hour) => {
        let ratio;
        if (hour >= 9 && hour <= 11) {
          ratio = 0.08; // Pic du matin
        } else if (hour >= 14 && hour <= 17) {
          ratio = 0.09; // Pic de l'après-midi
        } else if (hour >= 7 && hour <= 19) {
          ratio = 0.05; // Heures de travail
        } else if (hour >= 20 && hour <= 22) {
          ratio = 0.03; // Soirée
        } else {
          ratio = 0.01; // Nuit
        }
        return { hour, ratio };
      });
    } else {
      // Modèle pour weekend: plus uniforme avec pic en milieu de journée
      return Array(24).fill(0).map((_, hour) => {
        let ratio;
        if (hour >= 10 && hour <= 16) {
          ratio = 0.08; // Milieu de journée
        } else if (hour >= 8 && hour <= 20) {
          ratio = 0.05; // Journée étendue
        } else if (hour >= 21 && hour <= 23) {
          ratio = 0.03; // Soirée
        } else {
          ratio = 0.01; // Nuit
        }
        return { hour, ratio };
      });
    }
  }
  
  /**
   * Identifie les heures de pointe
   * @param {Array} hourlyPattern Modèle horaire
   * @returns {Array} Heures de pointe
   * @private
   */
  _identifyPeakHours(hourlyPattern) {
    // Trier par ratio décroissant
    const sorted = [...hourlyPattern].sort((a, b) => b.ratio - a.ratio);
    
    // Prendre les 3 premières heures comme heures de pointe
    return sorted.slice(0, 3).map(item => item.hour);
  }
  
  /**
   * Génère des recommandations basées sur le niveau de risque
   * @param {string} riskLevel Niveau de risque
   * @param {number} riskRatio Ratio de risque
   * @returns {Array} Recommandations
   * @private
   */
  _generateRiskRecommendations(riskLevel, riskRatio) {
    const recommendations = [];
    
    switch (riskLevel) {
      case 'critical':
        recommendations.push({
          type: 'critical',
          message: 'Risque élevé de dépassement de quota. Augmentez immédiatement la durée de cache.'
        });
        recommendations.push({
          type: 'critical',
          message: 'Envisagez de désactiver temporairement les fonctionnalités non essentielles.'
        });
        break;
        
      case 'high':
        recommendations.push({
          type: 'warning',
          message: 'Augmentez la durée de cache pour les itinéraires fréquemment demandés.'
        });
        recommendations.push({
          type: 'warning',
          message: 'Réduisez la fréquence des mises à jour automatiques.'
        });
        break;
        
      case 'medium':
        recommendations.push({
          type: 'info',
          message: 'Surveillez l\'utilisation des quotas pendant les heures de pointe.'
        });
        break;
        
      default:
        recommendations.push({
          type: 'success',
          message: 'Aucune action requise, l\'utilisation prévue est dans les limites sécuritaires.'
        });
    }
    
    // Ajouter des recommandations spécifiques basées sur le ratio
    if (riskRatio > 0.9) {
      recommendations.push({
        type: 'critical',
        message: 'Envisagez d\'augmenter temporairement la limite de quota ou de contacter le fournisseur d\'API.'
      });
    }
    
    return recommendations;
  }
  
  /**
   * Génère des insights basés sur les prédictions
   * @param {Array} predictions Prédictions
   * @returns {Array} Insights
   * @private
   */
  _generateInsights(predictions) {
    const insights = [];
    
    // Tendance générale
    const firstDay = predictions[0];
    const lastDay = predictions[predictions.length - 1];
    const trend = lastDay > firstDay ? 'à la hausse' : lastDay < firstDay ? 'à la baisse' : 'stable';
    
    insights.push({
      type: 'trend',
      message: `Tendance générale ${trend} sur les ${predictions.length} prochains jours.`
    });
    
    // Jour de pic
    const peakDay = Math.max(...predictions);
    const peakDayIndex = predictions.indexOf(peakDay);
    
    if (peakDayIndex >= 0) {
      const peakDate = new Date();
      peakDate.setDate(peakDate.getDate() + peakDayIndex + 1);
      
      insights.push({
        type: 'peak',
        message: `Pic d'utilisation prévu le ${this._formatDate(peakDate)} avec environ ${Math.round(peakDay)} requêtes.`
      });
    }
    
    return insights;
  }
  
  /**
   * Formate une date au format YYYY-MM-DD
   * @param {Date} date Date à formater
   * @returns {string} Date formatée
   * @private
   */
  _formatDate(date) {
    return date.toISOString().split('T')[0];
  }
  
  /**
   * Calcule la différence en jours entre deux dates
   * @param {Date} date1 Première date
   * @param {Date} date2 Deuxième date
   * @returns {number} Différence en jours
   * @private
   */
  _getDayDifference(date1, date2) {
    const diffTime = Math.abs(date2 - date1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) - 1;
  }
}

// Créer une instance singleton
const quotaPredictor = new QuotaPredictor({
  predictionHorizon: 14, // Prédire pour les 14 prochains jours
  confidenceInterval: 0.95
});

module.exports = quotaPredictor;
