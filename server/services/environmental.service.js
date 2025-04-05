// environmental.service.js
const { getAirQualityByLocation, getAirQualityAlongRoute } = require('./air-quality.service');
const { getWindForecastByLocation, getWindForecastAlongRoute } = require('./wind-forecast.service');
const logger = require('../utils/logger');

/**
 * Service centralisé pour les données environnementales
 * Combine les données de qualité d'air et de vent pour fournir des informations
 * environnementales complètes pour les cyclistes
 */

// Définition des régions européennes pour la couverture géographique
const EUROPEAN_REGIONS = [
  { name: 'Western Europe', countries: ['France', 'Germany', 'Belgium', 'Netherlands', 'Luxembourg'] },
  { name: 'Southern Europe', countries: ['Spain', 'Italy', 'Portugal', 'Greece'] },
  { name: 'Northern Europe', countries: ['Sweden', 'Norway', 'Finland', 'Denmark'] },
  { name: 'Eastern Europe', countries: ['Poland', 'Czech Republic', 'Hungary', 'Romania'] },
  { name: 'Central Europe', countries: ['Austria', 'Switzerland', 'Slovakia', 'Slovenia'] },
  { name: 'British Isles', countries: ['United Kingdom', 'Ireland'] },
  { name: 'Baltic States', countries: ['Estonia', 'Latvia', 'Lithuania'] },
  { name: 'Balkans', countries: ['Croatia', 'Bulgaria', 'Serbia', 'North Macedonia', 'Albania'] }
];

/**
 * Détermine le taux d'échantillonnage optimal en fonction de la longueur de l'itinéraire
 * @param {Array<Object>} routePoints - Points de l'itinéraire
 * @returns {Object} Taux d'échantillonnage optimal pour différents services
 */
const getOptimalSamplingRates = (routePoints) => {
  const routeLength = routePoints.length;
  
  // Adapter dynamiquement le taux d'échantillonnage en fonction du nombre de points
  let airQualitySamplingRate = 5;   // Par défaut: un point tous les 5 pour les courts itinéraires
  let windForecastSamplingRate = 10; // Par défaut: un point tous les 10 pour les courts itinéraires
  
  if (routeLength > 1000) {
    airQualitySamplingRate = 50;     // Un point tous les 50 pour les très longs itinéraires
    windForecastSamplingRate = 100;  // Un point tous les 100 pour les très longs itinéraires
  } else if (routeLength > 500) {
    airQualitySamplingRate = 25;     // Un point tous les 25 pour les longs itinéraires
    windForecastSamplingRate = 50;   // Un point tous les 50 pour les longs itinéraires
  } else if (routeLength > 200) {
    airQualitySamplingRate = 10;     // Un point tous les 10 pour les itinéraires moyens
    windForecastSamplingRate = 20;   // Un point tous les 20 pour les itinéraires moyens
  }
  
  logger.debug(`[EnvironmentalService] Taux d'échantillonnage optimisé pour itinéraire de ${routeLength} points: Air ${airQualitySamplingRate}, Vent ${windForecastSamplingRate}`);
  
  return {
    airQuality: airQualitySamplingRate,
    windForecast: windForecastSamplingRate
  };
};

/**
 * Récupère les données environnementales complètes pour une localisation
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Object>} Données environnementales combinées
 */
const getEnvironmentalDataByLocation = async (lat, lng) => {
  try {
    logger.info(`[EnvironmentalService] Récupération des données environnementales pour la position ${lat}, ${lng}`);
    
    // Exécuter les requêtes en parallèle pour optimiser les performances
    const [airQualityData, windForecastData] = await Promise.all([
      getAirQualityByLocation(lat, lng),
      getWindForecastByLocation(lat, lng)
    ]);
    
    // Déterminer la région européenne
    const region = determineEuropeanRegion(lat, lng);
    
    // Générer des recommandations combinées
    const combinedRecommendations = generateCombinedRecommendations(
      airQualityData, 
      windForecastData
    );
    
    return {
      location: {
        lat,
        lng,
        region: region ? region.name : 'Unknown'
      },
      airQuality: airQualityData,
      windForecast: windForecastData,
      recommendations: combinedRecommendations,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error(`[EnvironmentalService] Erreur lors de la récupération des données environnementales: ${error.message}`);
    
    // Retourner les données partielles si disponibles
    const result = {
      location: {
        lat,
        lng
      },
      error: error.message,
      timestamp: new Date().toISOString()
    };
    
    try {
      result.airQuality = await getAirQualityByLocation(lat, lng);
    } catch (airError) {
      result.airQualityError = airError.message;
    }
    
    try {
      result.windForecast = await getWindForecastByLocation(lat, lng);
    } catch (windError) {
      result.windForecastError = windError.message;
    }
    
    return result;
  }
};

/**
 * Récupère les données environnementales complètes le long d'un itinéraire
 * @param {Array<Object>} routePoints - Points de l'itinéraire [{lat, lng}, ...]
 * @returns {Promise<Object>} Données environnementales le long de l'itinéraire
 */
const getEnvironmentalDataAlongRoute = async (routePoints) => {
  if (!routePoints || !Array.isArray(routePoints) || routePoints.length === 0) {
    throw new Error('Points d\'itinéraire invalides');
  }
  
  try {
    logger.info(`[EnvironmentalService] Récupération des données environnementales pour un itinéraire de ${routePoints.length} points`);
    
    // Déterminer les taux d'échantillonnage optimaux
    const samplingRates = getOptimalSamplingRates(routePoints);
    
    // Exécuter les requêtes en parallèle pour optimiser les performances
    const [airQualityData, windForecastData] = await Promise.all([
      getAirQualityAlongRoute(routePoints, samplingRates.airQuality),
      getWindForecastAlongRoute(routePoints, samplingRates.windForecast)
    ]);
    
    // Détecter les pays/régions traversés par l'itinéraire
    const regions = detectRegionsAlongRoute(routePoints);
    
    // Générer une carte de chaleur environnementale
    const heatmap = generateEnvironmentalHeatmap(routePoints, airQualityData, windForecastData);
    
    // Générer des recommandations combinées pour l'itinéraire
    const routeRecommendations = generateRouteRecommendations(airQualityData, windForecastData);
    
    return {
      routePoints: routePoints.length,
      regions,
      samplingRates,
      airQuality: airQualityData,
      windForecast: windForecastData,
      heatmap,
      recommendations: routeRecommendations,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error(`[EnvironmentalService] Erreur lors de la récupération des données environnementales pour l'itinéraire: ${error.message}`);
    
    // Retourner les données partielles si disponibles
    const result = {
      routePoints: routePoints.length,
      error: error.message,
      timestamp: new Date().toISOString()
    };
    
    try {
      // Utiliser les taux d'échantillonnage optimaux même en cas d'erreur
      const samplingRates = getOptimalSamplingRates(routePoints);
      result.airQuality = await getAirQualityAlongRoute(routePoints, samplingRates.airQuality);
    } catch (airError) {
      result.airQualityError = airError.message;
    }
    
    try {
      // Utiliser les taux d'échantillonnage optimaux même en cas d'erreur
      const samplingRates = getOptimalSamplingRates(routePoints);
      result.windForecast = await getWindForecastAlongRoute(routePoints, samplingRates.windForecast);
    } catch (windError) {
      result.windForecastError = windError.message;
    }
    
    return result;
  }
};

/**
 * Détermine la région européenne pour des coordonnées données
 * Utilise une approche simplifiée basée sur des délimitations approximatives
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Object|null} Région européenne ou null si hors Europe
 */
const determineEuropeanRegion = (lat, lng) => {
  // Délimitation approximative de l'Europe
  if (lat < 36 || lat > 71 || lng < -10 || lng > 40) {
    return null; // Hors Europe
  }
  
  // Délimitations simplifiées des régions
  if (lat > 55) {
    return EUROPEAN_REGIONS.find(r => r.name === 'Northern Europe');
  } else if (lat < 42) {
    return EUROPEAN_REGIONS.find(r => r.name === 'Southern Europe');
  } else if (lng < 0) {
    return EUROPEAN_REGIONS.find(r => r.name === 'British Isles');
  } else if (lng < 5) {
    return EUROPEAN_REGIONS.find(r => r.name === 'Western Europe');
  } else if (lng > 20) {
    return EUROPEAN_REGIONS.find(r => r.name === 'Eastern Europe');
  } else {
    return EUROPEAN_REGIONS.find(r => r.name === 'Central Europe');
  }
};

/**
 * Détecte les régions européennes traversées par un itinéraire
 * @param {Array<Object>} routePoints - Points de l'itinéraire
 * @returns {Array<Object>} Régions traversées avec points de début et fin
 */
const detectRegionsAlongRoute = (routePoints) => {
  if (!routePoints || routePoints.length < 2) {
    return [];
  }
  
  const regions = [];
  let currentRegion = null;
  let regionStartIndex = 0;
  
  // Échantillonner les points pour éviter de traiter trop de données
  const samplingStep = Math.max(1, Math.floor(routePoints.length / 50));
  
  for (let i = 0; i < routePoints.length; i += samplingStep) {
    const point = routePoints[i];
    const region = determineEuropeanRegion(point.lat, point.lng);
    
    // Si la région change ou c'est le dernier point
    if ((region && !currentRegion) || 
        (region && currentRegion && region.name !== currentRegion.name) ||
        (i + samplingStep >= routePoints.length && currentRegion)) {
      
      // Enregistrer la région précédente si elle existe
      if (currentRegion) {
        regions.push({
          region: currentRegion,
          startPoint: routePoints[regionStartIndex],
          endPoint: routePoints[i-1],
          startIndex: regionStartIndex,
          endIndex: i-1
        });
      }
      
      // Nouvelle région
      currentRegion = region;
      regionStartIndex = i;
    }
  }
  
  // Ajouter la dernière région si nécessaire
  if (currentRegion) {
    regions.push({
      region: currentRegion,
      startPoint: routePoints[regionStartIndex],
      endPoint: routePoints[routePoints.length-1],
      startIndex: regionStartIndex,
      endIndex: routePoints.length-1
    });
  }
  
  return regions;
};

/**
 * Génère des recommandations combinées basées sur les données de qualité d'air et de vent
 * @param {Object} airQualityData - Données de qualité d'air
 * @param {Object} windForecastData - Données de prévision de vent
 * @returns {Object} Recommandations combinées
 */
const generateCombinedRecommendations = (airQualityData, windForecastData) => {
  // Extraire les recommandations individuelles
  const airRecommendations = airQualityData.qualityLabel ? {
    overall: `Qualité de l'air: ${airQualityData.qualityLabel}`,
    warnings: [],
    equipment: []
  } : { overall: 'Données de qualité d\'air non disponibles', warnings: [], equipment: [] };
  
  const windRecommendations = windForecastData.current ? {
    overall: `Vent: ${windForecastData.current.speed.toFixed(1)} m/s (${(windForecastData.current.speed * 3.6).toFixed(1)} km/h)`,
    warnings: [],
    equipment: []
  } : { overall: 'Données de vent non disponibles', warnings: [], equipment: [] };
  
  // Combiner les recommandations
  const combined = {
    overall: `${airRecommendations.overall}. ${windRecommendations.overall}`,
    warnings: [...(airQualityData.recommendations?.warnings || []), ...(windForecastData.recommendations?.warnings || [])],
    equipment: [...(airQualityData.recommendations?.equipment || []), ...(windForecastData.recommendations?.equipment || [])],
    rideCondition: determineRideCondition(airQualityData, windForecastData)
  };
  
  return combined;
};

/**
 * Détermine les conditions générales pour la sortie cycliste
 * @param {Object} airQualityData - Données de qualité d'air
 * @param {Object} windForecastData - Données de prévision de vent
 * @returns {string} Évaluation des conditions
 */
const determineRideCondition = (airQualityData, windForecastData) => {
  // Évaluer la qualité de l'air (échelle 1-5)
  let airQualityScore = 5; // Par défaut excellent
  if (airQualityData && airQualityData.aqi) {
    airQualityScore = 6 - airQualityData.aqi; // Inverser l'échelle (5=mauvais devient 1, 1=bon devient 5)
  }
  
  // Évaluer le vent (échelle 1-5)
  let windScore = 5; // Par défaut excellent
  if (windForecastData && windForecastData.current) {
    const windSpeedKmh = windForecastData.current.speed * 3.6;
    if (windSpeedKmh > 40) windScore = 1;
    else if (windSpeedKmh > 30) windScore = 2;
    else if (windSpeedKmh > 20) windScore = 3;
    else if (windSpeedKmh > 10) windScore = 4;
  }
  
  // Calculer le score combiné (moyenne pondérée)
  const combinedScore = (airQualityScore * 0.6) + (windScore * 0.4);
  
  // Déterminer la condition générale
  if (combinedScore >= 4.5) return 'Excellente';
  if (combinedScore >= 3.5) return 'Bonne';
  if (combinedScore >= 2.5) return 'Acceptable';
  if (combinedScore >= 1.5) return 'Difficile';
  return 'Déconseillée';
};

/**
 * Génère une carte de chaleur environnementale pour un itinéraire
 * @param {Array<Object>} routePoints - Points de l'itinéraire
 * @param {Object} airQualityData - Données de qualité d'air
 * @param {Object} windForecastData - Données de prévision de vent
 * @returns {Array<Object>} Données de carte de chaleur
 */
const generateEnvironmentalHeatmap = (routePoints, airQualityData, windForecastData) => {
  // Créer un tableau pour stocker les données de la carte de chaleur
  const heatmapData = [];
  
  // Points de qualité d'air
  const airPoints = airQualityData.points || [];
  for (const point of airPoints) {
    if (point.location && point.aqi !== null) {
      heatmapData.push({
        lat: point.location.lat,
        lng: point.location.lng,
        value: point.aqi,
        type: 'air',
        label: point.qualityLabel,
        color: getAirQualityColor(point.aqi)
      });
    }
  }
  
  // Points de vent
  const windPoints = windForecastData.points || [];
  for (const point of windPoints) {
    if (point.location && point.current) {
      const windSpeedKmh = point.current.speed * 3.6;
      heatmapData.push({
        lat: point.location.lat,
        lng: point.location.lng,
        value: windSpeedKmh,
        type: 'wind',
        direction: point.current.direction,
        color: getWindSpeedColor(windSpeedKmh)
      });
    }
  }
  
  return heatmapData;
};

/**
 * Obtient la couleur correspondant à un indice de qualité de l'air
 * @param {number} aqi - Indice de qualité de l'air (1-5)
 * @returns {string} Code couleur hexadécimal
 */
const getAirQualityColor = (aqi) => {
  switch (aqi) {
    case 1:
      return '#00E400'; // Vert - Bon
    case 2:
      return '#FFFF00'; // Jaune - Acceptable
    case 3:
      return '#FF7E00'; // Orange - Modéré
    case 4:
      return '#FF0000'; // Rouge - Mauvais
    case 5:
      return '#99004C'; // Violet - Très mauvais
    default:
      return '#CCCCCC'; // Gris - Inconnu
  }
};

/**
 * Obtient la couleur correspondant à une vitesse de vent
 * @param {number} speedKmh - Vitesse du vent en km/h
 * @returns {string} Code couleur hexadécimal
 */
const getWindSpeedColor = (speedKmh) => {
  if (speedKmh < 10) return '#00E400'; // Vert - Faible
  if (speedKmh < 20) return '#FFFF00'; // Jaune - Modéré
  if (speedKmh < 30) return '#FF7E00'; // Orange - Fort
  if (speedKmh < 40) return '#FF0000'; // Rouge - Très fort
  return '#99004C'; // Violet - Extrême
};

/**
 * Génère des recommandations spécifiques pour un itinéraire
 * @param {Object} airQualityData - Données de qualité d'air
 * @param {Object} windForecastData - Données de prévision de vent
 * @returns {Object} Recommandations pour l'itinéraire
 */
const generateRouteRecommendations = (airQualityData, windForecastData) => {
  // Extraire les recommandations de base
  const airRecommendations = airQualityData.recommendations || { 
    overall: 'Données de qualité d\'air non disponibles', 
    warnings: [], 
    equipment: [] 
  };
  
  const windRecommendations = windForecastData.recommendations || { 
    overall: 'Données de vent non disponibles', 
    warnings: [], 
    equipment: [] 
  };
  
  // Identifier les segments problématiques
  const problemSegments = [];
  
  // Segments avec mauvaise qualité d'air
  const airPoints = airQualityData.points || [];
  for (let i = 0; i < airPoints.length; i++) {
    const point = airPoints[i];
    if (point.aqi >= 4) { // Mauvais ou très mauvais
      problemSegments.push({
        type: 'air',
        location: point.location,
        issue: `Mauvaise qualité d'air (${point.qualityLabel})`,
        recommendation: 'Réduire l\'effort ou éviter cette zone'
      });
    }
  }
  
  // Segments avec vent fort
  const windPoints = windForecastData.points || [];
  for (let i = 0; i < windPoints.length; i++) {
    const point = windPoints[i];
    if (point.current && point.current.speed * 3.6 > 30) { // Plus de 30 km/h
      problemSegments.push({
        type: 'wind',
        location: point.location,
        issue: `Vent fort (${(point.current.speed * 3.6).toFixed(1)} km/h)`,
        recommendation: 'Prudence, risque de rafales'
      });
    }
  }
  
  // Générer des itinéraires alternatifs si nécessaire
  const alternativeRoutes = problemSegments.length > 0 ? 
    { suggested: true, reason: `${problemSegments.length} segment(s) problématique(s) identifié(s)` } : 
    { suggested: false };
  
  // Combiner toutes les recommandations
  return {
    overall: `${airRecommendations.overall}. ${windRecommendations.overall}`,
    warnings: [...airRecommendations.warnings, ...windRecommendations.warnings],
    equipment: [...airRecommendations.equipment, ...windRecommendations.equipment],
    problemSegments,
    alternativeRoutes,
    bestTimeToRide: suggestBestTimeToRide(airQualityData, windForecastData)
  };
};

/**
 * Suggère le meilleur moment pour faire du vélo dans les prochaines 24h
 * @param {Object} airQualityData - Données de qualité d'air
 * @param {Object} windForecastData - Données de prévision de vent
 * @returns {Object} Suggestion du meilleur moment
 */
const suggestBestTimeToRide = (airQualityData, windForecastData) => {
  // Par défaut, si nous n'avons pas assez de données
  if (!windForecastData.forecast || windForecastData.forecast.length === 0) {
    return {
      available: false,
      message: 'Données insuffisantes pour suggérer le meilleur moment'
    };
  }
  
  // Évaluer chaque créneau horaire des prochaines 24h
  const timeSlots = [];
  
  for (let i = 0; i < windForecastData.forecast.length; i++) {
    const forecast = windForecastData.forecast[i];
    const timestamp = new Date(forecast.timestamp);
    const hour = timestamp.getHours();
    
    // Calculer un score pour ce créneau (plus élevé = meilleur)
    let score = 10; // Score de base
    
    // Pénalité pour vent fort
    const windSpeedKmh = forecast.speed * 3.6;
    if (windSpeedKmh > 40) score -= 5;
    else if (windSpeedKmh > 30) score -= 4;
    else if (windSpeedKmh > 20) score -= 2;
    else if (windSpeedKmh > 10) score -= 1;
    
    // Pénalité pour heures de nuit
    if (hour < 6 || hour > 20) score -= 3;
    
    // Bonus pour les heures de faible trafic
    if ((hour >= 10 && hour <= 15) || hour >= 19) score += 1;
    
    timeSlots.push({
      timestamp: forecast.timestamp,
      hour,
      score,
      windSpeed: windSpeedKmh,
      conditions: getConditionDescription(windSpeedKmh, hour)
    });
  }
  
  // Trier par score décroissant
  timeSlots.sort((a, b) => b.score - a.score);
  
  // Retourner les 3 meilleurs créneaux
  return {
    available: true,
    bestOptions: timeSlots.slice(0, 3)
  };
};

/**
 * Obtient une description des conditions basée sur la vitesse du vent et l'heure
 * @param {number} windSpeedKmh - Vitesse du vent en km/h
 * @param {number} hour - Heure de la journée
 * @returns {string} Description des conditions
 */
const getConditionDescription = (windSpeedKmh, hour) => {
  let description = '';
  
  // Description du vent
  if (windSpeedKmh < 5) description += 'Vent très faible';
  else if (windSpeedKmh < 10) description += 'Vent faible';
  else if (windSpeedKmh < 20) description += 'Vent modéré';
  else if (windSpeedKmh < 30) description += 'Vent assez fort';
  else if (windSpeedKmh < 40) description += 'Vent fort';
  else description += 'Vent très fort';
  
  // Description du moment de la journée
  if (hour >= 5 && hour < 8) description += ', tôt le matin';
  else if (hour >= 8 && hour < 12) description += ', matinée';
  else if (hour >= 12 && hour < 14) description += ', midi';
  else if (hour >= 14 && hour < 18) description += ', après-midi';
  else if (hour >= 18 && hour < 21) description += ', soirée';
  else description += ', nuit';
  
  return description;
};

module.exports = {
  getEnvironmentalDataByLocation,
  getEnvironmentalDataAlongRoute,
  determineEuropeanRegion,
  getOptimalSamplingRates
};
