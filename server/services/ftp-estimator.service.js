/**
 * Service d'estimation du FTP basé sur l'historique des activités
 * Permet d'estimer automatiquement le FTP d'un cycliste à partir
 * de données d'entraînement historiques
 */

const logger = require('../utils/logger');
const NodeCache = require('node-cache');

// Cache avec TTL de 24 heures pour les estimations
const ftpEstimationCache = new NodeCache({ stdTTL: 86400 });

/**
 * Estime le FTP d'un cycliste à partir de ses activités récentes
 * @param {string} userId - ID de l'utilisateur
 * @param {Array<Object>} activities - Liste des activités
 * @returns {Promise<Object>} FTP estimé avec métadonnées
 */
const estimateFtpFromActivities = async (userId, activities) => {
  try {
    logger.info(`[FtpEstimatorService] Estimation du FTP pour l'utilisateur ${userId}`);
    
    if (!activities || !Array.isArray(activities) || activities.length === 0) {
      throw new Error('Liste d\'activités vide ou invalide');
    }
    
    // Filtrer les activités pertinentes (avec données de puissance)
    const relevantActivities = activities.filter(activity => 
      activity.power && activity.power > 0 && 
      activity.duration && activity.duration > 0
    );
    
    if (relevantActivities.length === 0) {
      throw new Error('Aucune activité avec données de puissance');
    }
    
    // Trier par date décroissante (plus récente d'abord)
    relevantActivities.sort((a, b) => 
      new Date(b.startDate) - new Date(a.startDate)
    );
    
    // Récupérer les meilleures performances pour différentes durées
    const bestPerformances = {
      '5min': findBestPowerForDuration(relevantActivities, 5 * 60),
      '8min': findBestPowerForDuration(relevantActivities, 8 * 60),
      '20min': findBestPowerForDuration(relevantActivities, 20 * 60),
      '60min': findBestPowerForDuration(relevantActivities, 60 * 60)
    };
    
    // Calculer les estimations FTP pour différentes méthodes
    const ftpEstimates = {};
    let bestMethod = null;
    let highestConfidence = 0;
    
    // Méthode 1: Basée sur l'effort de 60 minutes (si disponible)
    if (bestPerformances['60min'].power > 0) {
      ftpEstimates.from60min = {
        value: Math.round(bestPerformances['60min'].power),
        confidence: 0.95,
        activityId: bestPerformances['60min'].activityId,
        date: bestPerformances['60min'].date
      };
      
      bestMethod = 'from60min';
      highestConfidence = 0.95;
    }
    
    // Méthode 2: Basée sur l'effort de 20 minutes (95% de la puissance)
    if (bestPerformances['20min'].power > 0) {
      ftpEstimates.from20min = {
        value: Math.round(bestPerformances['20min'].power * 0.95),
        confidence: 0.90,
        activityId: bestPerformances['20min'].activityId,
        date: bestPerformances['20min'].date
      };
      
      if (!bestMethod || ftpEstimates.from20min.confidence > highestConfidence) {
        bestMethod = 'from20min';
        highestConfidence = ftpEstimates.from20min.confidence;
      }
    }
    
    // Méthode 3: Basée sur l'effort de 8 minutes (90% de la puissance)
    if (bestPerformances['8min'].power > 0) {
      ftpEstimates.from8min = {
        value: Math.round(bestPerformances['8min'].power * 0.9),
        confidence: 0.85,
        activityId: bestPerformances['8min'].activityId,
        date: bestPerformances['8min'].date
      };
      
      if (!bestMethod || ftpEstimates.from8min.confidence > highestConfidence) {
        bestMethod = 'from8min';
        highestConfidence = ftpEstimates.from8min.confidence;
      }
    }
    
    // Méthode 4: Basée sur l'effort de 5 minutes (85% de la puissance)
    if (bestPerformances['5min'].power > 0) {
      ftpEstimates.from5min = {
        value: Math.round(bestPerformances['5min'].power * 0.85),
        confidence: 0.80,
        activityId: bestPerformances['5min'].activityId,
        date: bestPerformances['5min'].date
      };
      
      if (!bestMethod || ftpEstimates.from5min.confidence > highestConfidence) {
        bestMethod = 'from5min';
        highestConfidence = ftpEstimates.from5min.confidence;
      }
    }
    
    // Méthode 5: Détection automatique des intervalles structurés
    const structuredIntervals = detectStructuredIntervals(relevantActivities);
    if (structuredIntervals.found) {
      ftpEstimates.fromIntervals = {
        value: Math.round(structuredIntervals.estimatedFtp),
        confidence: 0.88,
        activityId: structuredIntervals.activityId,
        date: structuredIntervals.date,
        details: structuredIntervals.details
      };
      
      if (!bestMethod || ftpEstimates.fromIntervals.confidence > highestConfidence) {
        bestMethod = 'fromIntervals';
        highestConfidence = ftpEstimates.fromIntervals.confidence;
      }
    }
    
    // Méthode 6: Analyse des puissances critiques (modèle 3 paramètres)
    const criticalPower = analyzeCriticalPower(relevantActivities);
    if (criticalPower.valid) {
      ftpEstimates.fromCriticalPower = {
        value: Math.round(criticalPower.cp),
        confidence: 0.92,
        details: criticalPower.details
      };
      
      if (!bestMethod || ftpEstimates.fromCriticalPower.confidence > highestConfidence) {
        bestMethod = 'fromCriticalPower';
        highestConfidence = ftpEstimates.fromCriticalPower.confidence;
      }
    }
    
    // Si aucune méthode n'a fonctionné, erreur
    if (!bestMethod) {
      throw new Error('Données insuffisantes pour estimer le FTP');
    }
    
    // Créer le résultat final avec la meilleure estimation
    const result = {
      userId,
      bestEstimateFtp: ftpEstimates[bestMethod].value,
      bestMethod,
      confidence: ftpEstimates[bestMethod].confidence,
      allEstimates: ftpEstimates,
      timestamp: new Date().toISOString()
    };
    
    // Mettre en cache le résultat
    const cacheKey = `ftp_estimate_${userId}`;
    ftpEstimationCache.set(cacheKey, result);
    
    return result;
  } catch (error) {
    logger.error(`[FtpEstimatorService] Erreur lors de l'estimation du FTP: ${error.message}`);
    throw new Error(`Échec de l'estimation du FTP: ${error.message}`);
  }
};

/**
 * Estime le FTP à partir d'un test spécifique
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} testData - Données du test FTP
 * @returns {Promise<Object>} FTP estimé avec métadonnées
 */
const estimateFtpFromTest = async (userId, testData) => {
  try {
    logger.info(`[FtpEstimatorService] Estimation du FTP depuis un test pour l'utilisateur ${userId}`);
    
    if (!testData || !testData.testType) {
      throw new Error('Données de test invalides');
    }
    
    let estimatedFtp = 0;
    let confidence = 0;
    
    // Estimer le FTP selon le type de test
    switch (testData.testType) {
      case 'ramp':
        // Test rampe (augmentation progressive jusqu'à épuisement)
        if (!testData.finalMinutePower) {
          throw new Error('Puissance finale manquante pour le test rampe');
        }
        estimatedFtp = Math.round(testData.finalMinutePower * 0.75);
        confidence = 0.85;
        break;
        
      case '20min':
        // Test FTP 20 minutes
        if (!testData.avgPower) {
          throw new Error('Puissance moyenne manquante pour le test 20 minutes');
        }
        estimatedFtp = Math.round(testData.avgPower * 0.95);
        confidence = 0.90;
        break;
        
      case '8min':
        // Test FTP 8 minutes (peut être répété 2 fois)
        if (!testData.avgPower) {
          throw new Error('Puissance moyenne manquante pour le test 8 minutes');
        }
        
        // Si deux efforts, prendre la moyenne
        if (testData.secondEffortPower) {
          const avgOfBoth = (testData.avgPower + testData.secondEffortPower) / 2;
          estimatedFtp = Math.round(avgOfBoth * 0.9);
        } else {
          estimatedFtp = Math.round(testData.avgPower * 0.9);
        }
        confidence = 0.88;
        break;
        
      case '5min':
        // Test 5 minutes
        if (!testData.avgPower) {
          throw new Error('Puissance moyenne manquante pour le test 5 minutes');
        }
        estimatedFtp = Math.round(testData.avgPower * 0.85);
        confidence = 0.82;
        break;
        
      default:
        throw new Error(`Type de test non pris en charge: ${testData.testType}`);
    }
    
    // Créer le résultat
    const result = {
      userId,
      estimatedFtp,
      testType: testData.testType,
      confidence,
      testDate: testData.date || new Date().toISOString(),
      timestamp: new Date().toISOString()
    };
    
    // Mettre en cache le résultat
    const cacheKey = `ftp_test_${userId}`;
    ftpEstimationCache.set(cacheKey, result);
    
    return result;
  } catch (error) {
    logger.error(`[FtpEstimatorService] Erreur lors de l'estimation du FTP depuis le test: ${error.message}`);
    throw new Error(`Échec de l'estimation du FTP depuis le test: ${error.message}`);
  }
};

/**
 * Récupère la meilleure performance sur une durée spécifique dans toutes les activités
 * @private
 * @param {Array<Object>} activities - Liste des activités
 * @param {number} targetDuration - Durée cible en secondes
 * @returns {Object} Meilleure performance
 */
const findBestPowerForDuration = (activities, targetDuration) => {
  // Résultat par défaut
  const result = {
    power: 0,
    activityId: null,
    date: null
  };
  
  // Parcourir toutes les activités
  for (const activity of activities) {
    // Vérifier si l'activité a des streams de puissance et temps
    if (activity.powerCurve && Array.isArray(activity.powerCurve)) {
      // Chercher l'entrée correspondant à la durée cible
      for (const entry of activity.powerCurve) {
        if (entry.duration === targetDuration && entry.power > result.power) {
          result.power = entry.power;
          result.activityId = activity.id;
          result.date = activity.startDate;
        }
      }
    } 
    // Si l'activité n'a pas de courbe de puissance mais sa durée est proche de la cible
    else if (Math.abs(activity.duration - targetDuration) < 60 && activity.power > result.power) {
      result.power = activity.power;
      result.activityId = activity.id;
      result.date = activity.startDate;
    }
  }
  
  return result;
};

/**
 * Détecte les intervalles structurés dans les activités pour estimer le FTP
 * @private
 * @param {Array<Object>} activities - Liste des activités
 * @returns {Object} Résultat de la détection
 */
const detectStructuredIntervals = (activities) => {
  // Résultat par défaut
  const result = {
    found: false,
    estimatedFtp: 0,
    activityId: null,
    date: null,
    details: {}
  };
  
  // Parcourir les activités pour trouver celles avec des intervalles structurés
  for (const activity of activities) {
    // Vérifier si l'activité a des segments ou des laps
    if (activity.segments && Array.isArray(activity.segments) && activity.segments.length > 0) {
      // Rechercher des patterns d'intervalles spécifiques au FTP
      // Par exemple: des intervalles de 3-5 minutes à haute intensité
      
      const ftpIntervals = activity.segments.filter(segment => 
        segment.duration >= 180 && segment.duration <= 300 && // 3-5 minutes
        segment.avgPower > 0 && 
        segment.type === 'interval'
      );
      
      // Si on trouve au moins 2 intervalles FTP
      if (ftpIntervals.length >= 2) {
        // Calculer la puissance moyenne des intervalles
        const avgIntervalPower = ftpIntervals.reduce((sum, interval) => 
          sum + interval.avgPower, 0) / ftpIntervals.length;
        
        // Estimer le FTP (généralement 90-95% de la puissance d'intervalle)
        const estimatedFtp = avgIntervalPower * 0.92;
        
        // Si c'est la meilleure estimation trouvée, mettre à jour le résultat
        if (estimatedFtp > result.estimatedFtp) {
          result.found = true;
          result.estimatedFtp = estimatedFtp;
          result.activityId = activity.id;
          result.date = activity.startDate;
          result.details = {
            intervalCount: ftpIntervals.length,
            avgIntervalPower,
            intervalDurations: ftpIntervals.map(i => i.duration)
          };
        }
      }
    }
  }
  
  return result;
};

/**
 * Analyse les données de puissance pour estimer la puissance critique (CP)
 * @private
 * @param {Array<Object>} activities - Liste des activités
 * @returns {Object} Résultat de l'analyse de puissance critique
 */
const analyzeCriticalPower = (activities) => {
  // Modèle de puissance critique (3 paramètres: CP, W', tau)
  // CP est approximativement équivalent au FTP
  
  // Résultat par défaut
  const result = {
    valid: false,
    cp: 0,
    wprime: 0,
    details: {}
  };
  
  // Récupérer les meilleures performances pour différentes durées
  const durations = [30, 60, 180, 300, 480, 600, 1200, 1800, 3600]; // secondes
  const powerPoints = [];
  
  // Pour chaque durée, trouver la meilleure performance
  durations.forEach(duration => {
    const best = findBestPowerForDuration(activities, duration);
    if (best.power > 0) {
      powerPoints.push({
        duration,
        power: best.power
      });
    }
  });
  
  // Vérifier s'il y a assez de points pour une analyse fiable
  if (powerPoints.length < 5) {
    return result;
  }
  
  // Implémenter l'algorithme de régression non linéaire pour le modèle CP
  // Ceci est une version simplifiée, une vraie implémentation utiliserait
  // des techniques d'optimisation plus avancées
  
  // Transformer les données pour une régression linéaire simple
  // Modèle simplifié: P = W' / t + CP
  // Transformé en: P * t = W' + CP * t
  
  const transformedPoints = powerPoints.map(p => ({
    x: p.duration, // t
    y: p.power * p.duration // P * t
  }));
  
  // Régression linéaire simple
  const n = transformedPoints.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  
  transformedPoints.forEach(point => {
    sumX += point.x;
    sumY += point.y;
    sumXY += point.x * point.y;
    sumXX += point.x * point.x;
  });
  
  // Calculer les coefficients de la régression
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // CP est la pente, W' est l'interception
  const cp = slope;
  const wprime = intercept;
  
  // Vérifier si les résultats sont plausibles
  if (cp > 100 && cp < 500 && wprime > 5000 && wprime < 50000) {
    result.valid = true;
    result.cp = cp;
    result.wprime = wprime;
    result.details = {
      dataPoints: powerPoints.length,
      r2: calculateR2(transformedPoints, slope, intercept),
      model: "P = W' / t + CP"
    };
  }
  
  return result;
};

/**
 * Calcule le coefficient de détermination (R²) pour évaluer la qualité de la régression
 * @private
 * @param {Array<Object>} points - Points utilisés pour la régression
 * @param {number} slope - Pente de la droite de régression
 * @param {number} intercept - Ordonnée à l'origine de la droite de régression
 * @returns {number} Coefficient R²
 */
const calculateR2 = (points, slope, intercept) => {
  const n = points.length;
  
  // Calculer la moyenne de y
  const yMean = points.reduce((sum, p) => sum + p.y, 0) / n;
  
  // Calculer la somme totale des carrés (STC)
  const sstot = points.reduce((sum, p) => sum + Math.pow(p.y - yMean, 2), 0);
  
  // Calculer la somme des carrés des résidus (SCR)
  const ssres = points.reduce((sum, p) => {
    const prediction = slope * p.x + intercept;
    return sum + Math.pow(p.y - prediction, 2);
  }, 0);
  
  // Calculer R²
  const r2 = 1 - (ssres / sstot);
  
  return r2;
};

/**
 * Récupère l'estimation FTP en cache pour un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @returns {Object|null} Estimation FTP en cache ou null si absente
 */
const getCachedFtpEstimate = (userId) => {
  const cacheKey = `ftp_estimate_${userId}`;
  return ftpEstimationCache.get(cacheKey) || null;
};

/**
 * Invalide le cache d'estimation FTP pour un utilisateur
 * @param {string} userId - ID de l'utilisateur
 */
const invalidateFtpEstimateCache = (userId) => {
  try {
    const keys = ftpEstimationCache.keys();
    const userKeys = keys.filter(key => key.includes(userId));
    
    if (userKeys.length > 0) {
      userKeys.forEach(key => ftpEstimationCache.del(key));
      logger.debug(`[FtpEstimatorService] Cache invalidé pour l'utilisateur ${userId}`);
    }
  } catch (error) {
    logger.error(`[FtpEstimatorService] Erreur lors de l'invalidation du cache: ${error.message}`);
  }
};

module.exports = {
  estimateFtpFromActivities,
  estimateFtpFromTest,
  getCachedFtpEstimate,
  invalidateFtpEstimateCache
};
