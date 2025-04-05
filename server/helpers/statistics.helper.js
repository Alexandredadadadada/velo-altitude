/**
 * Helper pour les calculs statistiques
 * Fournit des fonctions pour analyser les corrélations et tendances dans les données
 */

/**
 * Classe utilitaire pour les calculs statistiques
 */
class StatisticsHelper {
  /**
   * Calcule le coefficient de corrélation de Pearson entre deux ensembles de données
   * @param {Array<number>} x - Premier ensemble de données
   * @param {Array<number>} y - Second ensemble de données
   * @returns {number} Coefficient de corrélation (-1 à 1)
   */
  static calculatePearsonCorrelation(x, y) {
    if (!x || !y || x.length !== y.length || x.length === 0) {
      return 0;
    }

    // Filtrer les valeurs non numériques
    const validPairs = [];
    for (let i = 0; i < x.length; i++) {
      if (!isNaN(x[i]) && !isNaN(y[i])) {
        validPairs.push({ x: x[i], y: y[i] });
      }
    }

    if (validPairs.length < 3) {
      return 0; // Trop peu de données pour une corrélation significative
    }

    const n = validPairs.length;

    // Calculer les moyennes
    const meanX = validPairs.reduce((sum, pair) => sum + pair.x, 0) / n;
    const meanY = validPairs.reduce((sum, pair) => sum + pair.y, 0) / n;

    // Calculer les sommes pour la formule
    let sumXY = 0;
    let sumX2 = 0;
    let sumY2 = 0;

    for (const pair of validPairs) {
      const dX = pair.x - meanX;
      const dY = pair.y - meanY;
      sumXY += dX * dY;
      sumX2 += dX * dX;
      sumY2 += dY * dY;
    }

    // Éviter la division par zéro
    if (sumX2 === 0 || sumY2 === 0) {
      return 0;
    }

    // Calculer le coefficient de corrélation
    const r = sumXY / Math.sqrt(sumX2 * sumY2);

    // Limiter à [-1, 1] pour éviter les erreurs d'arrondi
    return Math.max(-1, Math.min(1, r));
  }

  /**
   * Calcule le coefficient de corrélation de Spearman (basé sur les rangs)
   * @param {Array<number>} x - Premier ensemble de données
   * @param {Array<number>} y - Second ensemble de données
   * @returns {number} Coefficient de corrélation de Spearman
   */
  static calculateSpearmanCorrelation(x, y) {
    if (!x || !y || x.length !== y.length || x.length === 0) {
      return 0;
    }

    // Filtrer les valeurs non numériques
    const validPairs = [];
    for (let i = 0; i < x.length; i++) {
      if (!isNaN(x[i]) && !isNaN(y[i])) {
        validPairs.push({ x: x[i], y: y[i] });
      }
    }

    if (validPairs.length < 3) {
      return 0; // Trop peu de données pour une corrélation significative
    }

    // Convertir les valeurs en rangs
    const rankX = this._convertToRanks(validPairs.map(p => p.x));
    const rankY = this._convertToRanks(validPairs.map(p => p.y));

    // Calculer la corrélation de Pearson sur les rangs
    return this.calculatePearsonCorrelation(rankX, rankY);
  }

  /**
   * Détecte les tendances dans une série temporelle
   * @param {Array<{date: Date, value: number}>} timeSeries - Série temporelle
   * @param {string} method - Méthode de détection ('linear', 'moving_average')
   * @returns {Object} Informations sur la tendance détectée
   */
  static detectTrend(timeSeries, method = 'linear') {
    if (!timeSeries || timeSeries.length < 3) {
      return { trend: 'unknown', coefficient: 0, significance: false };
    }

    // Trier par date
    const sortedSeries = [...timeSeries].sort((a, b) => a.date - b.date);
    
    // Extraire les valeurs
    const values = sortedSeries.map(point => point.value);
    
    if (method === 'linear') {
      // Régression linéaire simple
      const x = sortedSeries.map((_, i) => i); // Indices comme variable indépendante
      const slope = this._calculateLinearRegressionSlope(x, values);
      
      // Déterminer la tendance et sa force
      const trend = slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable';
      const strength = Math.abs(slope) * sortedSeries.length / (Math.max(...values) - Math.min(...values));
      
      return {
        trend,
        coefficient: slope,
        strength: Math.min(1, strength), // Normalisé entre 0 et 1
        significance: Math.abs(slope) > 0.05 // Seuil arbitraire pour la significativité
      };
    } else if (method === 'moving_average') {
      // Moyenne mobile
      const windowSize = Math.max(2, Math.floor(values.length / 5));
      const movingAvg = this._calculateMovingAverage(values, windowSize);
      
      // Comparer le début et la fin de la moyenne mobile
      const firstAvg = movingAvg.slice(0, Math.floor(movingAvg.length / 4)).reduce((sum, v) => sum + v, 0) / 
                      Math.floor(movingAvg.length / 4);
      const lastAvg = movingAvg.slice(-Math.floor(movingAvg.length / 4)).reduce((sum, v) => sum + v, 0) / 
                      Math.floor(movingAvg.length / 4);
      
      const difference = lastAvg - firstAvg;
      const trend = difference > 0 ? 'increasing' : difference < 0 ? 'decreasing' : 'stable';
      const strength = Math.abs(difference) / (Math.max(...values) - Math.min(...values));
      
      return {
        trend,
        averageDifference: difference,
        strength: Math.min(1, strength), // Normalisé entre 0 et 1
        significance: Math.abs(difference) > 0.1 * (Math.max(...values) - Math.min(...values)) // 10% de la plage
      };
    }
    
    return { trend: 'unknown', coefficient: 0, significance: false };
  }

  /**
   * Détecte les valeurs aberrantes (outliers) dans un ensemble de données
   * @param {Array<number>} data - Données à analyser
   * @param {string} method - Méthode de détection ('iqr', 'zscore')
   * @returns {Array<{index: number, value: number}>} Valeurs aberrantes détectées
   */
  static detectOutliers(data, method = 'iqr') {
    if (!data || data.length < 4) {
      return [];
    }

    const outliers = [];

    if (method === 'iqr') {
      // Méthode de l'écart interquartile (IQR)
      const sortedData = [...data].sort((a, b) => a - b);
      const q1Index = Math.floor(sortedData.length * 0.25);
      const q3Index = Math.floor(sortedData.length * 0.75);
      const q1 = sortedData[q1Index];
      const q3 = sortedData[q3Index];
      const iqr = q3 - q1;
      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;

      for (let i = 0; i < data.length; i++) {
        if (data[i] < lowerBound || data[i] > upperBound) {
          outliers.push({ index: i, value: data[i] });
        }
      }
    } else if (method === 'zscore') {
      // Méthode du Z-score
      const mean = data.reduce((sum, value) => sum + value, 0) / data.length;
      const stdDev = Math.sqrt(data.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / data.length);

      if (stdDev === 0) return []; // Éviter la division par zéro

      for (let i = 0; i < data.length; i++) {
        const zScore = Math.abs((data[i] - mean) / stdDev);
        if (zScore > 2.5) { // Seuil de Z-score à 2.5 (environ 99% de confiance)
          outliers.push({ index: i, value: data[i] });
        }
      }
    }

    return outliers;
  }

  /**
   * Calcule des statistiques descriptives pour un ensemble de données
   * @param {Array<number>} data - Données à analyser
   * @returns {Object} Statistiques descriptives
   */
  static calculateDescriptiveStats(data) {
    if (!data || data.length === 0) {
      return {
        count: 0,
        min: null,
        max: null,
        mean: null,
        median: null,
        stdDev: null,
        quartiles: { q1: null, q2: null, q3: null }
      };
    }

    const filteredData = data.filter(value => !isNaN(value));
    const sortedData = [...filteredData].sort((a, b) => a - b);
    const count = filteredData.length;

    if (count === 0) {
      return {
        count: 0,
        min: null,
        max: null,
        mean: null,
        median: null,
        stdDev: null,
        quartiles: { q1: null, q2: null, q3: null }
      };
    }

    const min = sortedData[0];
    const max = sortedData[count - 1];
    const sum = filteredData.reduce((acc, value) => acc + value, 0);
    const mean = sum / count;

    // Médiane et quartiles
    const medianIndex = Math.floor(count * 0.5);
    const q1Index = Math.floor(count * 0.25);
    const q3Index = Math.floor(count * 0.75);

    const median = count % 2 === 0 
      ? (sortedData[medianIndex - 1] + sortedData[medianIndex]) / 2 
      : sortedData[medianIndex];
    
    const q1 = sortedData[q1Index];
    const q3 = sortedData[q3Index];

    // Écart-type
    const sumSquaredDiff = filteredData.reduce((acc, value) => acc + Math.pow(value - mean, 2), 0);
    const stdDev = Math.sqrt(sumSquaredDiff / count);

    return {
      count,
      min,
      max,
      mean,
      median,
      stdDev,
      quartiles: { q1, q2: median, q3 }
    };
  }

  /**
   * Calcule des statistiques de quantité d'entraînement (training load)
   * @param {Array<{date: Date, tss: number}>} activities - Activités avec dates et TSS
   * @param {number} ctlDays - Jours pour CTL (Chronic Training Load)
   * @param {number} atlDays - Jours pour ATL (Acute Training Load)
   * @returns {Array<{date: Date, ctl: number, atl: number, tsb: number}>} Statistiques calculées
   */
  static calculateTrainingLoadStats(activities, ctlDays = 42, atlDays = 7) {
    if (!activities || activities.length === 0) {
      return [];
    }

    // Trier les activités par date
    const sortedActivities = [...activities].sort((a, b) => a.date - b.date);
    
    // Générer une série temporelle complète sur la période
    const startDate = new Date(sortedActivities[0].date);
    const endDate = new Date(sortedActivities[sortedActivities.length - 1].date);
    const dayCount = Math.ceil((endDate - startDate) / (24 * 60 * 60 * 1000)) + 1;
    
    // Initialiser le tableau de statistiques
    const stats = [];
    const dailyTSS = new Array(dayCount).fill(0);
    
    // Remplir le tableau avec les TSS quotidiens
    for (const activity of sortedActivities) {
      const dayIndex = Math.floor((activity.date - startDate) / (24 * 60 * 60 * 1000));
      dailyTSS[dayIndex] += activity.tss || 0;
    }
    
    // Calculer CTL, ATL et TSB pour chaque jour
    for (let i = 0; i < dayCount; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      // Calculer CTL (moyenne exponentielle sur ctlDays)
      let ctlSum = 0;
      let ctlWeight = 0;
      for (let j = 0; j <= i; j++) {
        const daysAgo = i - j;
        const weight = Math.exp(-daysAgo / ctlDays);
        ctlSum += dailyTSS[j] * weight;
        ctlWeight += weight;
      }
      const ctl = ctlWeight > 0 ? ctlSum / ctlWeight : 0;
      
      // Calculer ATL (moyenne exponentielle sur atlDays)
      let atlSum = 0;
      let atlWeight = 0;
      for (let j = 0; j <= i; j++) {
        const daysAgo = i - j;
        const weight = Math.exp(-daysAgo / atlDays);
        atlSum += dailyTSS[j] * weight;
        atlWeight += weight;
      }
      const atl = atlWeight > 0 ? atlSum / atlWeight : 0;
      
      // Calculer TSB (Training Stress Balance = CTL - ATL)
      const tsb = ctl - atl;
      
      stats.push({
        date: new Date(currentDate),
        ctl,
        atl,
        tsb,
        dailyTSS: dailyTSS[i]
      });
    }
    
    return stats;
  }

  /**
   * Méthodes privées d'aide au calcul
   */

  /**
   * Convertit une liste de valeurs en rangs
   * @private
   * @param {Array<number>} values - Valeurs à convertir
   * @returns {Array<number>} Rangs correspondants
   */
  static _convertToRanks(values) {
    // Créer des paires [valeur, index]
    const indexed = values.map((v, i) => [v, i]);
    
    // Trier par valeur
    indexed.sort((a, b) => a[0] - b[0]);
    
    // Attribuer des rangs (gestion des ex-aequo)
    const ranks = new Array(values.length);
    let currentRank = 1;
    
    for (let i = 0; i < indexed.length; i++) {
      const [currentValue, currentIndex] = indexed[i];
      
      // Trouver les ex-aequo
      let j = i;
      let equalCount = 1;
      
      while (j + 1 < indexed.length && indexed[j + 1][0] === currentValue) {
        j++;
        equalCount++;
      }
      
      // Calculer le rang moyen pour les ex-aequo
      const avgRank = currentRank + (equalCount - 1) / 2;
      
      // Attribuer le même rang à tous les ex-aequo
      for (let k = 0; k < equalCount; k++) {
        ranks[indexed[i + k][1]] = avgRank;
      }
      
      // Mettre à jour le rang et l'index
      currentRank += equalCount;
      i = j;
    }
    
    return ranks;
  }

  /**
   * Calcule la pente d'une régression linéaire
   * @private
   * @param {Array<number>} x - Variable indépendante
   * @param {Array<number>} y - Variable dépendante
   * @returns {number} Pente de la régression
   */
  static _calculateLinearRegressionSlope(x, y) {
    if (x.length !== y.length || x.length < 2) {
      return 0;
    }
    
    const n = x.length;
    
    // Calculer les moyennes
    const meanX = x.reduce((sum, val) => sum + val, 0) / n;
    const meanY = y.reduce((sum, val) => sum + val, 0) / n;
    
    // Calculer les sommes pour la formule
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      numerator += (x[i] - meanX) * (y[i] - meanY);
      denominator += Math.pow(x[i] - meanX, 2);
    }
    
    // Éviter la division par zéro
    if (denominator === 0) {
      return 0;
    }
    
    return numerator / denominator;
  }

  /**
   * Calcule une moyenne mobile
   * @private
   * @param {Array<number>} values - Valeurs
   * @param {number} windowSize - Taille de la fenêtre
   * @returns {Array<number>} Moyenne mobile
   */
  static _calculateMovingAverage(values, windowSize) {
    if (!values || values.length < windowSize) {
      return [...values];
    }
    
    const result = [];
    
    for (let i = 0; i < values.length; i++) {
      let windowStart = Math.max(0, i - Math.floor(windowSize / 2));
      let windowEnd = Math.min(values.length - 1, i + Math.floor(windowSize / 2));
      let windowSum = 0;
      
      for (let j = windowStart; j <= windowEnd; j++) {
        windowSum += values[j];
      }
      
      result.push(windowSum / (windowEnd - windowStart + 1));
    }
    
    return result;
  }
}

module.exports = StatisticsHelper;
