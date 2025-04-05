/**
 * Service de calcul des zones d'entraînement
 * Fournit des fonctions pour calculer les zones d'entraînement en fonction
 * des caractéristiques physiologiques des cyclistes
 */

const logger = require('../utils/logger');
const NodeCache = require('node-cache');

// Cache avec TTL de 24 heures pour les calculs de zones
const zonesCache = new NodeCache({ stdTTL: 86400 });

/**
 * Récupère les zones d'entraînement depuis le cache ou les calcule si nécessaire
 * @param {string} userId - ID de l'utilisateur
 * @param {number} ftp - Functional Threshold Power en watts
 * @param {number} hrMax - Fréquence cardiaque maximale en bpm
 * @param {number} age - Âge du cycliste
 * @param {number} weight - Poids du cycliste en kg
 * @param {string} gender - Genre du cycliste ('male' ou 'female')
 * @returns {Promise<Object>} Zones d'entraînement calculées
 */
const getCachedZones = async (userId, ftp, hrMax, age, weight, gender = 'male') => {
  try {
    // Générer une clé de cache unique
    const cacheKey = `training_zones_${userId}_${ftp}_${hrMax}_${age}_${weight}_${gender}`;
    
    // Vérifier si les données sont en cache
    const cachedData = zonesCache.get(cacheKey);
    if (cachedData) {
      logger.debug(`[TrainingZonesService] Zones récupérées depuis le cache pour l'utilisateur ${userId}`);
      return cachedData;
    }
    
    // Calculer les zones si pas en cache
    const zones = await calculateZones(ftp, hrMax, age, weight, gender);
    
    // Stocker en cache
    zonesCache.set(cacheKey, zones);
    
    return zones;
  } catch (error) {
    logger.error(`[TrainingZonesService] Erreur lors de la récupération des zones en cache: ${error.message}`);
    throw error;
  }
};

/**
 * Calcule les zones d'entraînement basées sur la puissance (FTP) et la fréquence cardiaque
 * @param {number} ftp - Functional Threshold Power en watts
 * @param {number} hrMax - Fréquence cardiaque maximale en bpm
 * @param {number} age - Âge du cycliste
 * @param {number} weight - Poids du cycliste en kg
 * @param {string} gender - Genre du cycliste ('male' ou 'female')
 * @returns {Object} Zones d'entraînement calculées
 */
const calculateZones = async (ftp, hrMax, age, weight, gender = 'male') => {
  try {
    logger.info('[TrainingZonesService] Calcul des zones d\'entraînement');
    
    // Valider les entrées
    if (!ftp && !hrMax) {
      throw new Error('FTP ou fréquence cardiaque maximale requis pour le calcul des zones');
    }
    
    // Objet pour stocker les résultats
    const zones = {
      powerZones: null,
      heartRateZones: null,
      timestamp: new Date().toISOString()
    };
    
    // Si FTP fourni, calculer les zones de puissance
    if (ftp && ftp > 0) {
      zones.powerZones = calculatePowerZones(ftp);
      
      // Calculer la puissance au poids (W/kg)
      if (weight && weight > 0) {
        zones.powerToWeight = parseFloat((ftp / weight).toFixed(2));
        zones.performanceLevel = determinePowerToWeightLevel(zones.powerToWeight, gender);
      }
    }
    
    // Si fréquence cardiaque max fournie, calculer les zones FC
    if (hrMax && hrMax > 0) {
      // Estimer la fréquence cardiaque de repos si non fournie
      const hrRest = estimateRestingHeartRate(age, gender);
      zones.heartRateZones = calculateHeartRateZones(hrMax, hrRest);
    }
    
    return zones;
  } catch (error) {
    logger.error(`[TrainingZonesService] Erreur lors du calcul des zones: ${error.message}`);
    throw new Error(`Échec du calcul des zones d'entraînement: ${error.message}`);
  }
};

/**
 * Calcule les zones de puissance basées sur le FTP
 * @param {number} ftp - Functional Threshold Power en watts
 * @returns {Array<Object>} Zones de puissance
 */
const calculatePowerZones = (ftp) => {
  // Modèle à 7 zones basé sur le modèle d'entraînement de Coggan
  return [
    {
      zone: 1,
      name: 'Récupération active',
      min: Math.round(ftp * 0),
      max: Math.round(ftp * 0.55),
      percentage: '0-55%',
      description: 'Récupération très légère, peut être maintenue indéfiniment'
    },
    {
      zone: 2,
      name: 'Endurance',
      min: Math.round(ftp * 0.56),
      max: Math.round(ftp * 0.75),
      percentage: '56-75%',
      description: 'Intensité que vous pouvez maintenir pendant plusieurs heures'
    },
    {
      zone: 3,
      name: 'Tempo',
      min: Math.round(ftp * 0.76),
      max: Math.round(ftp * 0.90),
      percentage: '76-90%',
      description: 'Intensité modérée, effort de groupe soutenu'
    },
    {
      zone: 4,
      name: 'Seuil',
      min: Math.round(ftp * 0.91),
      max: Math.round(ftp * 1.05),
      percentage: '91-105%',
      description: 'Proche de votre seuil, maintien de 30-60 minutes maximum'
    },
    {
      zone: 5,
      name: 'VO2max',
      min: Math.round(ftp * 1.06),
      max: Math.round(ftp * 1.20),
      percentage: '106-120%',
      description: 'Développe la puissance aérobie, intervalles de 3-8 minutes'
    },
    {
      zone: 6,
      name: 'Capacité anaérobie',
      min: Math.round(ftp * 1.21),
      max: Math.round(ftp * 1.50),
      percentage: '121-150%',
      description: 'Efforts très intenses, intervalles de 30s à 3 minutes'
    },
    {
      zone: 7,
      name: 'Neuromuscular Power',
      min: Math.round(ftp * 1.51),
      max: null, // Pas de limite supérieure définie
      percentage: '>150%',
      description: 'Sprints et efforts maximaux, moins de 30 secondes'
    }
  ];
};

/**
 * Calcule les zones de fréquence cardiaque basées sur la méthode Karvonen
 * @param {number} hrMax - Fréquence cardiaque maximale en bpm
 * @param {number} hrRest - Fréquence cardiaque de repos en bpm
 * @returns {Array<Object>} Zones de fréquence cardiaque
 */
const calculateHeartRateZones = (hrMax, hrRest) => {
  // Réserve cardiaque
  const hrReserve = hrMax - hrRest;
  
  // Modèle à 5 zones basé sur la méthode Karvonen
  return [
    {
      zone: 1,
      name: 'Récupération active',
      min: Math.round(hrRest + hrReserve * 0.5),
      max: Math.round(hrRest + hrReserve * 0.6),
      percentage: '50-60%',
      description: 'Très facile, récupération active'
    },
    {
      zone: 2,
      name: 'Endurance',
      min: Math.round(hrRest + hrReserve * 0.6),
      max: Math.round(hrRest + hrReserve * 0.7),
      percentage: '60-70%',
      description: 'Facile à modéré, développement d\'endurance'
    },
    {
      zone: 3,
      name: 'Tempo',
      min: Math.round(hrRest + hrReserve * 0.7),
      max: Math.round(hrRest + hrReserve * 0.8),
      percentage: '70-80%',
      description: 'Modéré à difficile, améliore l\'efficacité aérobie'
    },
    {
      zone: 4,
      name: 'Seuil',
      min: Math.round(hrRest + hrReserve * 0.8),
      max: Math.round(hrRest + hrReserve * 0.9),
      percentage: '80-90%',
      description: 'Difficile, améliore la tolérance lactique'
    },
    {
      zone: 5,
      name: 'VO2max',
      min: Math.round(hrRest + hrReserve * 0.9),
      max: hrMax,
      percentage: '90-100%',
      description: 'Très difficile, développe la capacité aérobie maximale'
    }
  ];
};

/**
 * Estime la fréquence cardiaque de repos basée sur l'âge et le genre
 * @param {number} age - Âge du cycliste
 * @param {string} gender - Genre du cycliste ('male' ou 'female')
 * @returns {number} Fréquence cardiaque de repos estimée
 */
const estimateRestingHeartRate = (age, gender = 'male') => {
  // Formule approximative, idéalement on utiliserait une valeur mesurée
  if (!age) return 60; // Valeur par défaut
  
  // Ajustements basés sur le genre (les femmes ont généralement une FC de repos légèrement plus élevée)
  const genderOffset = (gender === 'female') ? 5 : 0;
  
  // La FC de repos augmente généralement avec l'âge
  if (age < 20) return 55 + genderOffset;
  if (age < 30) return 60 + genderOffset;
  if (age < 40) return 65 + genderOffset;
  if (age < 50) return 68 + genderOffset;
  if (age < 60) return 70 + genderOffset;
  return 72 + genderOffset;
};

/**
 * Détermine le niveau de performance basé sur le rapport puissance/poids et le genre
 * @param {number} powerToWeight - Rapport puissance/poids (W/kg)
 * @param {string} gender - Genre du cycliste ('male' ou 'female')
 * @returns {Object} Niveau de performance avec catégorie et description
 */
const determinePowerToWeightLevel = (powerToWeight, gender = 'male') => {
  // Ajuster les seuils de performance en fonction du genre
  if (gender === 'female') {
    // Échelle basée sur les standards de cyclisme (femmes)
    // Les seuils sont environ 10-15% inférieurs à ceux des hommes
    if (powerToWeight >= 5.0) {
      return {
        category: 'Classe mondiale',
        description: 'Niveau professionnel féminin de haut niveau'
      };
    } else if (powerToWeight >= 4.0) {
      return {
        category: 'Excellent',
        description: 'Niveau professionnel/amateur féminin de haut niveau'
      };
    } else if (powerToWeight >= 3.3) {
      return {
        category: 'Très bon',
        description: 'Cycliste féminine expérimentée de niveau régional'
      };
    } else if (powerToWeight >= 2.7) {
      return {
        category: 'Bon',
        description: 'Cycliste féminine régulière bien entraînée'
      };
    } else if (powerToWeight >= 2.2) {
      return {
        category: 'Modéré',
        description: 'Cycliste féminine régulière ou débutante'
      };
    } else if (powerToWeight >= 1.8) {
      return {
        category: 'Débutant',
        description: 'Niveau débutant ou loisir'
      };
    } else {
      return {
        category: 'Non-entraîné',
        description: 'Niveau non-entraîné ou récréatif'
      };
    }
  } else {
    // Échelle basée sur les standards de cyclisme (hommes) - comme avant
    if (powerToWeight >= 5.6) {
      return {
        category: 'Classe mondiale',
        description: 'Niveau professionnel de haut niveau'
      };
    } else if (powerToWeight >= 4.5) {
      return {
        category: 'Excellent',
        description: 'Niveau professionnel/amateur de haut niveau'
      };
    } else if (powerToWeight >= 3.7) {
      return {
        category: 'Très bon',
        description: 'Cycliste expérimenté de niveau régional'
      };
    } else if (powerToWeight >= 3.0) {
      return {
        category: 'Bon',
        description: 'Cycliste régulier bien entraîné'
      };
    } else if (powerToWeight >= 2.5) {
      return {
        category: 'Modéré',
        description: 'Cycliste régulier ou débutant'
      };
    } else if (powerToWeight >= 2.0) {
      return {
        category: 'Débutant',
        description: 'Niveau débutant ou loisir'
      };
    } else {
      return {
        category: 'Non-entraîné',
        description: 'Niveau non-entraîné ou récréatif'
      };
    }
  }
};

/**
 * Estime le FTP à partir des données d'une activité de 20 minutes à intensité maximale
 * @param {number} power20min - Puissance moyenne sur 20 minutes (watts)
 * @returns {number} FTP estimé
 */
const estimateFtpFrom20Min = (power20min) => {
  // FTP est généralement 95% de la puissance maintenue sur 20 minutes
  return Math.round(power20min * 0.95);
};

/**
 * Estime le FTP à partir des données d'une activité de 8 minutes à intensité maximale
 * @param {number} power8min - Puissance moyenne sur 8 minutes (watts)
 * @returns {number} FTP estimé
 */
const estimateFtpFrom8Min = (power8min) => {
  // FTP est généralement 90% de la puissance maintenue sur 8 minutes
  return Math.round(power8min * 0.9);
};

/**
 * Estime le FTP à partir des données d'une activité de 5 minutes à intensité maximale
 * @param {number} power5min - Puissance moyenne sur 5 minutes (watts)
 * @returns {number} FTP estimé
 */
const estimateFtpFrom5Min = (power5min) => {
  // FTP est généralement 85% de la puissance maintenue sur 5 minutes
  return Math.round(power5min * 0.85);
};

/**
 * Invalide le cache pour un utilisateur spécifique
 * @param {string} userId - ID de l'utilisateur
 */
const invalidateUserCache = (userId) => {
  try {
    const keys = zonesCache.keys();
    const userKeys = keys.filter(key => key.includes(`training_zones_${userId}`));
    
    if (userKeys.length > 0) {
      userKeys.forEach(key => zonesCache.del(key));
      logger.debug(`[TrainingZonesService] Cache invalidé pour l'utilisateur ${userId}`);
    }
  } catch (error) {
    logger.error(`[TrainingZonesService] Erreur lors de l'invalidation du cache: ${error.message}`);
  }
};

module.exports = {
  calculateZones,
  calculatePowerZones,
  calculateHeartRateZones,
  estimateFtpFrom20Min,
  estimateFtpFrom8Min,
  estimateFtpFrom5Min,
  determinePowerToWeightLevel,
  getCachedZones,
  invalidateUserCache
};
