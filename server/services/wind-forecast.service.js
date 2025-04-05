// wind-forecast.service.js
const axios = require('axios');
const NodeCache = require('node-cache');
const { createApiClient, callApiWithFallback } = require('../utils/retry.service');

// Cache avec TTL de 1 heure pour les données de vent
const windForecastCache = new NodeCache({ stdTTL: 3600 });

// Configuration des API pour les prévisions de vent
const apiConfig = {
  openWeatherMap: {
    baseUrl: 'https://api.openweathermap.org/data/2.5',
    key: '58fdbb4f9c440c681fb537cccf413aba',
    endpoint: '/forecast',
    params: {
      appid: '58fdbb4f9c440c681fb537cccf413aba',
      units: 'metric'
    }
  },
  // API alternative pour le fallback
  weatherbit: {
    baseUrl: 'https://api.weatherbit.io/v2.0',
    key: 'demo', // Remplacer par une vraie clé si disponible
    endpoint: '/forecast/hourly',
    params: {
      key: 'demo',
      units: 'M'
    }
  }
};

// Création des clients API avec retry
const openWeatherMapClient = createApiClient({
  baseURL: apiConfig.openWeatherMap.baseUrl,
  timeout: 5000,
  params: apiConfig.openWeatherMap.params,
  __maxRetries: 3
});

const weatherbitClient = createApiClient({
  baseURL: apiConfig.weatherbit.baseUrl,
  timeout: 5000,
  params: apiConfig.weatherbit.params,
  __maxRetries: 2
});

/**
 * Récupère les prévisions de vent pour une localisation spécifique
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Object>} Données de prévision de vent formatées
 */
const getWindForecastByLocation = async (lat, lng) => {
  const cacheKey = `wind_${lat.toFixed(2)}_${lng.toFixed(2)}`;
  
  // Vérifier le cache
  const cachedData = windForecastCache.get(cacheKey);
  if (cachedData) {
    console.log(`Utilisation des données en cache pour ${cacheKey}`);
    return cachedData;
  }
  
  try {
    // Fonction pour l'API primaire (OpenWeatherMap)
    const fetchFromOpenWeatherMap = async () => {
      const response = await openWeatherMapClient.get(apiConfig.openWeatherMap.endpoint, {
        params: {
          lat,
          lon: lng,
          cnt: 24 // 24 heures de prévisions
        }
      });
      
      return formatOpenWeatherMapWindData(response.data);
    };
    
    // Fonction pour l'API de fallback (Weatherbit)
    const fetchFromWeatherbit = async () => {
      const response = await weatherbitClient.get(apiConfig.weatherbit.endpoint, {
        params: {
          lat,
          lon: lng,
          hours: 24
        }
      });
      
      return formatWeatherbitWindData(response.data);
    };
    
    // Appel avec retry et fallback
    const windData = await callApiWithFallback(
      fetchFromOpenWeatherMap,
      fetchFromWeatherbit,
      cacheKey,
      3600 // TTL de 1 heure
    );
    
    return windData;
  } catch (error) {
    console.error(`Erreur lors de la récupération des prévisions de vent: ${error.message}`);
    throw new Error('Service de prévision de vent temporairement indisponible');
  }
};

/**
 * Récupère les prévisions de vent le long d'un itinéraire
 * @param {Array<Object>} routePoints - Points de l'itinéraire [{lat, lng}, ...]
 * @param {number} interval - Intervalle entre les points (en nombre de points)
 * @returns {Promise<Array<Object>>} Données de vent le long de l'itinéraire
 */
const getWindForecastAlongRoute = async (routePoints, interval = 10) => {
  if (!routePoints || !Array.isArray(routePoints) || routePoints.length === 0) {
    throw new Error('Points d\'itinéraire invalides');
  }
  
  // Sélectionner des points à intervalles réguliers pour éviter trop de requêtes
  const sampledPoints = routePoints.filter((_, index) => index % interval === 0);
  
  // Ajouter toujours le dernier point s'il n'est pas déjà inclus
  if (sampledPoints[sampledPoints.length - 1] !== routePoints[routePoints.length - 1]) {
    sampledPoints.push(routePoints[routePoints.length - 1]);
  }
  
  // Récupérer les prévisions de vent pour chaque point échantillonné
  const windForecastPromises = sampledPoints.map(point => 
    getWindForecastByLocation(point.lat, point.lng)
      .then(data => ({
        ...data,
        location: {
          lat: point.lat,
          lng: point.lng
        }
      }))
      .catch(error => ({
        location: {
          lat: point.lat,
          lng: point.lng
        },
        error: error.message,
        current: null,
        forecast: []
      }))
  );
  
  // Attendre toutes les requêtes
  const results = await Promise.all(windForecastPromises);
  
  // Analyser les résultats pour des recommandations
  const recommendations = generateWindRecommendations(results);
  
  return {
    points: results,
    recommendations,
    timestamp: new Date().toISOString()
  };
};

/**
 * Formate les données de vent de l'API OpenWeatherMap
 * @param {Object} data - Données brutes de l'API
 * @returns {Object} Données formatées
 */
const formatOpenWeatherMapWindData = (data) => {
  if (!data || !data.list || data.list.length === 0) {
    throw new Error('Données OpenWeatherMap invalides');
  }
  
  // Données actuelles (première entrée)
  const currentData = data.list[0];
  const current = {
    speed: currentData.wind.speed, // m/s
    direction: currentData.wind.deg,
    gust: currentData.wind.gust || null,
    timestamp: new Date(currentData.dt * 1000).toISOString()
  };
  
  // Prévisions futures
  const forecast = data.list.slice(1).map(item => ({
    speed: item.wind.speed,
    direction: item.wind.deg,
    gust: item.wind.gust || null,
    timestamp: new Date(item.dt * 1000).toISOString()
  }));
  
  return {
    source: 'OpenWeatherMap',
    location: data.city ? data.city.name : 'Unknown',
    current,
    forecast,
    timestamp: new Date().toISOString()
  };
};

/**
 * Formate les données de vent de l'API Weatherbit
 * @param {Object} data - Données brutes de l'API
 * @returns {Object} Données formatées
 */
const formatWeatherbitWindData = (data) => {
  if (!data || !data.data || data.data.length === 0) {
    throw new Error('Données Weatherbit invalides');
  }
  
  // Données actuelles (première entrée)
  const currentData = data.data[0];
  const current = {
    speed: currentData.wind_spd, // m/s
    direction: currentData.wind_dir,
    gust: currentData.wind_gust_spd || null,
    timestamp: new Date(currentData.ts * 1000).toISOString()
  };
  
  // Prévisions futures
  const forecast = data.data.slice(1).map(item => ({
    speed: item.wind_spd,
    direction: item.wind_dir,
    gust: item.wind_gust_spd || null,
    timestamp: new Date(item.ts * 1000).toISOString()
  }));
  
  return {
    source: 'Weatherbit',
    location: data.city_name || 'Unknown',
    current,
    forecast,
    timestamp: new Date().toISOString()
  };
};

/**
 * Convertit la vitesse du vent de m/s en km/h
 * @param {number} speedInMps - Vitesse en mètres par seconde
 * @returns {number} Vitesse en kilomètres par heure
 */
const convertWindSpeedToKmh = (speedInMps) => {
  return speedInMps * 3.6;
};

/**
 * Convertit les degrés en direction cardinale
 * @param {number} degrees - Direction en degrés
 * @returns {string} Direction cardinale
 */
const degreesToCardinal = (degrees) => {
  const cardinals = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return cardinals[index];
};

/**
 * Génère des recommandations basées sur les données de vent
 * @param {Array<Object>} windPoints - Données de vent
 * @returns {Object} Recommandations pour les cyclistes
 */
const generateWindRecommendations = (windPoints) => {
  // Filtrer les points valides
  const validPoints = windPoints.filter(point => point.current !== null);
  if (validPoints.length === 0) {
    return {
      overall: 'Données insuffisantes pour générer des recommandations',
      warnings: [],
      equipment: []
    };
  }
  
  // Calculer la vitesse moyenne du vent
  const avgWindSpeed = validPoints.reduce((sum, point) => sum + point.current.speed, 0) / validPoints.length;
  const avgWindSpeedKmh = convertWindSpeedToKmh(avgWindSpeed);
  
  // Identifier les zones à vent fort
  const strongWindPoints = validPoints.filter(point => convertWindSpeedToKmh(point.current.speed) > 25);
  
  // Générer des recommandations
  let overall = '';
  const warnings = [];
  const equipment = [];
  
  if (avgWindSpeedKmh < 10) {
    overall = 'Conditions de vent favorables pour le cyclisme';
  } else if (avgWindSpeedKmh < 20) {
    overall = 'Vent modéré, impact léger sur les performances';
    equipment.push('Vêtements ajustés pour réduire la résistance au vent');
  } else if (avgWindSpeedKmh < 30) {
    overall = 'Vent fort, impact significatif sur les performances';
    equipment.push('Vêtements ajustés pour réduire la résistance au vent');
    equipment.push('Lunettes de protection');
    warnings.push('Soyez prudent dans les descentes exposées');
  } else {
    overall = 'Vent très fort, conditions difficiles pour le cyclisme';
    equipment.push('Vêtements ajustés pour réduire la résistance au vent');
    equipment.push('Lunettes de protection');
    equipment.push('Casque avec visière');
    warnings.push('Évitez les zones exposées et les descentes');
    warnings.push('Risque de rafales dangereuses');
  }
  
  // Ajouter des avertissements pour les zones spécifiques
  if (strongWindPoints.length > 0) {
    warnings.push(`${strongWindPoints.length} zone(s) avec vent fort identifiée(s)`);
  }
  
  // Vérifier la direction dominante du vent
  const directions = validPoints.map(point => point.current.direction);
  const avgDirection = directions.reduce((sum, dir) => sum + dir, 0) / directions.length;
  const cardinalDirection = degreesToCardinal(avgDirection);
  
  overall += `. Direction dominante du vent: ${cardinalDirection}`;
  
  return {
    overall,
    warnings,
    equipment,
    windDirection: cardinalDirection
  };
};

module.exports = {
  getWindForecastByLocation,
  getWindForecastAlongRoute,
  convertWindSpeedToKmh,
  degreesToCardinal
};
