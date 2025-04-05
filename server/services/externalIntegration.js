/**
 * Service d'intégration avec les APIs externes
 * Optimisé avec stratégies de cache, gestion des quotas et fallbacks
 */

const axios = require('axios');
const { weatherCluster } = require('../config/redis-cluster');
const logger = require('../utils/logger');
const { DateTime } = require('luxon');

// Durées de cache par type de données
const CACHE_TTL = {
  WEATHER_CURRENT: 60 * 30,         // 30 minutes
  WEATHER_FORECAST: 60 * 60 * 2,    // 2 heures
  STRAVA_SEGMENT: 60 * 60 * 12,     // 12 heures
  STRAVA_ACTIVITY: 60 * 10,         // 10 minutes
  ELEVATION_DATA: 60 * 60 * 24 * 7, // 7 jours
  DIRECTIONS: 60 * 60 * 24,         // 24 heures
};

// Configuration des API externes
const API_CONFIG = {
  openWeather: {
    baseUrl: 'https://api.openweathermap.org/data/2.5',
    apiKey: process.env.OPENWEATHER_API_KEY,
    requestsPerMinute: 60,
    requestsPerDay: 1000000,
    timeout: 5000
  },
  strava: {
    baseUrl: 'https://www.strava.com/api/v3',
    clientId: process.env.STRAVA_CLIENT_ID,
    clientSecret: process.env.STRAVA_CLIENT_SECRET,
    timeout: 8000,
    requestsPerMinute: 100,
    requestsPerDay: 1000
  },
  googleMaps: {
    baseUrl: 'https://maps.googleapis.com/maps/api',
    apiKey: process.env.GOOGLE_MAPS_API_KEY,
    timeout: 5000,
    requestsPerMinute: 100
  },
  openElevation: {
    baseUrl: 'https://api.open-elevation.com/api/v1/lookup',
    timeout: 10000,
    requestsPerMinute: 60
  }
};

// Etat des quotas pour chaque API
const apiQuotas = {
  openWeather: {
    minuteCounter: 0,
    dayCounter: 0,
    resetMinute: Date.now(),
    resetDay: DateTime.now().endOf('day').toMillis()
  },
  strava: {
    minuteCounter: 0,
    dayCounter: 0,
    resetMinute: Date.now(),
    resetDay: DateTime.now().endOf('day').toMillis(),
    rateLimitHeader: {
      limit: 100,
      usage: 0
    }
  },
  googleMaps: {
    minuteCounter: 0,
    resetMinute: Date.now()
  },
  openElevation: {
    minuteCounter: 0,
    resetMinute: Date.now()
  }
};

// Créer un client axios avec des valeurs par défaut et intercepteurs
const createApiClient = (baseConfig) => {
  const client = axios.create({
    baseURL: baseConfig.baseUrl,
    timeout: baseConfig.timeout,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });

  // Intercepteur pour la gestion des erreurs
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response) {
        const { status, data } = error.response;
        logger.error(`API Error: ${status} - ${JSON.stringify(data)}`, {
          service: 'externalIntegration',
          url: error.config.url,
          method: error.config.method
        });

        // Gestion spécifique des erreurs de quota
        if (status === 429) {
          logger.warn(`Rate limit exceeded for API: ${error.config.baseURL}`, {
            service: 'externalIntegration'
          });
        }
      } else {
        logger.error(`API Request Error: ${error.message}`, {
          service: 'externalIntegration',
          stack: error.stack
        });
      }

      return Promise.reject(error);
    }
  );

  return client;
};

// Clients API
const openWeatherClient = createApiClient(API_CONFIG.openWeather);
const stravaClient = createApiClient(API_CONFIG.strava);
const googleMapsClient = createApiClient(API_CONFIG.googleMaps);
const openElevationClient = createApiClient(API_CONFIG.openElevation);

/**
 * Vérification et mise à jour des quotas d'API
 * @param {string} apiName - Nom de l'API
 * @returns {boolean} - True si le quota est respecté, false sinon
 */
const checkAndUpdateQuota = (apiName) => {
  const now = Date.now();
  const quota = apiQuotas[apiName];
  const config = API_CONFIG[apiName];

  // Réinitialisation des compteurs de quota minute si nécessaire
  if (now - quota.resetMinute > 60000) {
    quota.minuteCounter = 0;
    quota.resetMinute = now;
  }

  // Réinitialisation des compteurs de quota jour si nécessaire
  if (quota.resetDay && now > quota.resetDay) {
    quota.dayCounter = 0;
    quota.resetDay = DateTime.now().endOf('day').toMillis();
  }

  // Vérification des quotas
  if (quota.minuteCounter >= config.requestsPerMinute) {
    logger.warn(`Minute quota exceeded for ${apiName}`, {
      service: 'externalIntegration',
      quota: quota.minuteCounter,
      limit: config.requestsPerMinute
    });
    return false;
  }

  if (config.requestsPerDay && quota.dayCounter >= config.requestsPerDay) {
    logger.warn(`Daily quota exceeded for ${apiName}`, {
      service: 'externalIntegration',
      quota: quota.dayCounter,
      limit: config.requestsPerDay
    });
    return false;
  }

  // Incrémentation des compteurs
  quota.minuteCounter++;
  if (quota.dayCounter !== undefined) {
    quota.dayCounter++;
  }

  return true;
};

/**
 * Récupérer les données météo actuelles pour une localisation
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {string} units - Unités (metric, imperial)
 * @returns {Promise<Object>} - Données météo
 */
async function getCurrentWeather(lat, lon, units = 'metric') {
  try {
    // Vérifier si les données sont en cache
    const cacheKey = `current:${lat},${lon}:${units}`;
    const cachedData = await weatherCluster.get(cacheKey);

    if (cachedData) {
      logger.debug(`Weather cache hit for ${lat},${lon}`, {
        service: 'externalIntegration'
      });
      return JSON.parse(cachedData);
    }

    // Vérifier les quotas
    if (!checkAndUpdateQuota('openWeather')) {
      throw new Error('OpenWeather API quota exceeded');
    }

    // Appel à l'API
    const response = await openWeatherClient.get('/weather', {
      params: {
        lat,
        lon,
        units,
        appid: API_CONFIG.openWeather.apiKey
      }
    });

    const weatherData = response.data;

    // Mettre en cache
    await weatherCluster.set(
      cacheKey, 
      JSON.stringify(weatherData),
      'EX',
      CACHE_TTL.WEATHER_CURRENT
    );

    logger.debug(`Retrieved current weather for ${lat},${lon}`, {
      service: 'externalIntegration'
    });

    return weatherData;
  } catch (error) {
    logger.error(`Error getting current weather: ${error.message}`, {
      service: 'externalIntegration',
      location: `${lat},${lon}`,
      stack: error.stack
    });

    // Fallback à des données moins précises en cas d'erreur
    return getFallbackWeatherData(lat, lon);
  }
}

/**
 * Récupérer les prévisions météo pour une localisation
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {number} days - Nombre de jours de prévision (max 7)
 * @param {string} units - Unités (metric, imperial)
 * @returns {Promise<Object>} - Données de prévision
 */
async function getWeatherForecast(lat, lon, days = 5, units = 'metric') {
  try {
    // Limiter le nombre de jours à 7
    const daysParam = Math.min(days, 7);
    
    // Vérifier si les données sont en cache
    const cacheKey = `forecast:${lat},${lon}:${daysParam}:${units}`;
    const cachedData = await weatherCluster.get(cacheKey);

    if (cachedData) {
      logger.debug(`Forecast cache hit for ${lat},${lon}`, {
        service: 'externalIntegration'
      });
      return JSON.parse(cachedData);
    }

    // Vérifier les quotas
    if (!checkAndUpdateQuota('openWeather')) {
      throw new Error('OpenWeather API quota exceeded');
    }

    // Appel à l'API
    const response = await openWeatherClient.get('/forecast', {
      params: {
        lat,
        lon,
        units,
        cnt: daysParam * 8, // 8 mesures par jour (toutes les 3 heures)
        appid: API_CONFIG.openWeather.apiKey
      }
    });

    const forecastData = response.data;

    // Mettre en cache
    await weatherCluster.set(
      cacheKey, 
      JSON.stringify(forecastData),
      'EX',
      CACHE_TTL.WEATHER_FORECAST
    );

    logger.debug(`Retrieved weather forecast for ${lat},${lon}`, {
      service: 'externalIntegration'
    });

    return forecastData;
  } catch (error) {
    logger.error(`Error getting weather forecast: ${error.message}`, {
      service: 'externalIntegration',
      location: `${lat},${lon}`,
      stack: error.stack
    });
    
    // Fallback aux données météo actuelles avec prévision limitée
    try {
      const currentWeather = await getCurrentWeather(lat, lon, units);
      return {
        city: {
          name: currentWeather.name,
          coord: currentWeather.coord
        },
        list: [
          {
            dt: Math.floor(Date.now() / 1000),
            main: currentWeather.main,
            weather: currentWeather.weather,
            wind: currentWeather.wind,
            dt_txt: new Date().toISOString()
          }
        ],
        limited_forecast: true
      };
    } catch (fallbackError) {
      return { error: 'Forecast unavailable', limited_forecast: true };
    }
  }
}

/**
 * Récupérer les données d'élévation pour un ensemble de points
 * @param {Array<{lat: number, lng: number}>} points - Points pour lesquels récupérer l'élévation
 * @returns {Promise<Array<{lat: number, lng: number, elevation: number}>>} - Points avec élévation
 */
async function getElevationData(points) {
  try {
    // Vérifier si les données sont en cache
    const pointsHash = JSON.stringify(points).split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const cacheKey = `elevation:${pointsHash}`;
    
    const cachedData = await weatherCluster.get(cacheKey);
    if (cachedData) {
      logger.debug(`Elevation data cache hit for ${points.length} points`, {
        service: 'externalIntegration'
      });
      return JSON.parse(cachedData);
    }

    // Vérifier les quotas
    if (!checkAndUpdateQuota('openElevation')) {
      throw new Error('Open Elevation API quota exceeded');
    }

    // Préparer les données pour l'API
    const locations = points.map(p => ({ latitude: p.lat, longitude: p.lng }));

    // Appel à l'API
    const response = await openElevationClient.post('', {
      locations
    });

    // Transformer les résultats
    const elevationData = response.data.results.map((result, index) => ({
      lat: points[index].lat,
      lng: points[index].lng,
      elevation: result.elevation
    }));

    // Mettre en cache
    await weatherCluster.set(
      cacheKey, 
      JSON.stringify(elevationData),
      'EX',
      CACHE_TTL.ELEVATION_DATA
    );

    logger.debug(`Retrieved elevation data for ${points.length} points`, {
      service: 'externalIntegration'
    });

    return elevationData;
  } catch (error) {
    logger.error(`Error getting elevation data: ${error.message}`, {
      service: 'externalIntegration',
      pointsCount: points.length,
      stack: error.stack
    });

    // Fallback à Google Maps Elevation API
    try {
      if (!checkAndUpdateQuota('googleMaps')) {
        throw new Error('Google Maps API quota exceeded');
      }

      // Limiter à 500 points maximum pour rester dans les limites de l'API
      const limitedPoints = points.length > 500 ? 
        points.filter((_, i) => i % Math.ceil(points.length / 500) === 0) : 
        points;

      // Préparer le format pour Google Maps
      const locations = limitedPoints.map(p => `${p.lat},${p.lng}`).join('|');

      const response = await googleMapsClient.get('/elevation/json', {
        params: {
          locations,
          key: API_CONFIG.googleMaps.apiKey
        }
      });

      // Transformer les résultats
      const elevationData = response.data.results.map((result, index) => ({
        lat: limitedPoints[index].lat,
        lng: limitedPoints[index].lng,
        elevation: result.elevation
      }));

      return elevationData;
    } catch (fallbackError) {
      logger.error(`Fallback elevation data also failed: ${fallbackError.message}`, {
        service: 'externalIntegration',
        stack: fallbackError.stack
      });
      
      // En dernier recours, utiliser des données d'élévation approximatives
      return points.map(p => ({
        ...p,
        elevation: 0, // Valeur par défaut si aucune donnée disponible
        estimated: true
      }));
    }
  }
}

/**
 * Récupérer les données d'un segment Strava
 * @param {string} segmentId - ID du segment Strava
 * @param {string} accessToken - Token d'accès Strava
 * @returns {Promise<Object>} - Données du segment
 */
async function getStravaSegment(segmentId, accessToken) {
  try {
    // Vérifier si les données sont en cache
    const cacheKey = `strava:segment:${segmentId}`;
    const cachedData = await weatherCluster.get(cacheKey);

    if (cachedData) {
      logger.debug(`Strava segment cache hit for ${segmentId}`, {
        service: 'externalIntegration'
      });
      return JSON.parse(cachedData);
    }

    // Vérifier les quotas
    if (!checkAndUpdateQuota('strava')) {
      throw new Error('Strava API quota exceeded');
    }

    // Appel à l'API
    const response = await stravaClient.get(`/segments/${segmentId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    // Mise à jour des quotas basée sur les headers de réponse
    if (response.headers['x-ratelimit-limit']) {
      apiQuotas.strava.rateLimitHeader.limit = parseInt(response.headers['x-ratelimit-limit']);
      apiQuotas.strava.rateLimitHeader.usage = parseInt(response.headers['x-ratelimit-usage']);
    }

    const segmentData = response.data;

    // Mettre en cache
    await weatherCluster.set(
      cacheKey, 
      JSON.stringify(segmentData),
      'EX',
      CACHE_TTL.STRAVA_SEGMENT
    );

    logger.debug(`Retrieved Strava segment data for ${segmentId}`, {
      service: 'externalIntegration'
    });

    return segmentData;
  } catch (error) {
    logger.error(`Error getting Strava segment: ${error.message}`, {
      service: 'externalIntegration',
      segmentId,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Obtenir un token d'accès Strava avec le code d'autorisation
 * @param {string} code - Code d'autorisation
 * @returns {Promise<Object>} - Détails du token
 */
async function getStravaToken(code) {
  try {
    const response = await stravaClient.post('/oauth/token', {
      client_id: API_CONFIG.strava.clientId,
      client_secret: API_CONFIG.strava.clientSecret,
      code,
      grant_type: 'authorization_code'
    });

    const tokenData = response.data;

    logger.debug(`Retrieved Strava token`, {
      service: 'externalIntegration',
      athleteId: tokenData.athlete.id
    });

    return tokenData;
  } catch (error) {
    logger.error(`Error getting Strava token: ${error.message}`, {
      service: 'externalIntegration',
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Rafraîchir un token d'accès Strava expiré
 * @param {string} refreshToken - Token de rafraîchissement
 * @returns {Promise<Object>} - Nouveau token d'accès
 */
async function refreshStravaToken(refreshToken) {
  try {
    const response = await stravaClient.post('/oauth/token', {
      client_id: API_CONFIG.strava.clientId,
      client_secret: API_CONFIG.strava.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    });

    const tokenData = response.data;

    logger.debug(`Refreshed Strava token`, {
      service: 'externalIntegration',
      expiresAt: new Date(tokenData.expires_at * 1000).toISOString()
    });

    return tokenData;
  } catch (error) {
    logger.error(`Error refreshing Strava token: ${error.message}`, {
      service: 'externalIntegration',
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Récupérer les activités récentes d'un utilisateur Strava
 * @param {string} accessToken - Token d'accès Strava
 * @param {number} page - Numéro de page
 * @param {number} perPage - Nombre d'activités par page
 * @returns {Promise<Array<Object>>} - Liste des activités
 */
async function getStravaActivities(accessToken, page = 1, perPage = 10) {
  try {
    // Vérifier les quotas
    if (!checkAndUpdateQuota('strava')) {
      throw new Error('Strava API quota exceeded');
    }

    // Appel à l'API
    const response = await stravaClient.get('/athlete/activities', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      params: {
        page,
        per_page: perPage
      }
    });

    // Mise à jour des quotas basée sur les headers de réponse
    if (response.headers['x-ratelimit-limit']) {
      apiQuotas.strava.rateLimitHeader.limit = parseInt(response.headers['x-ratelimit-limit']);
      apiQuotas.strava.rateLimitHeader.usage = parseInt(response.headers['x-ratelimit-usage']);
    }

    const activitiesData = response.data;

    logger.debug(`Retrieved ${activitiesData.length} Strava activities`, {
      service: 'externalIntegration',
      page,
      perPage
    });

    return activitiesData;
  } catch (error) {
    logger.error(`Error getting Strava activities: ${error.message}`, {
      service: 'externalIntegration',
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Récupérer les directions entre deux points
 * @param {Object} origin - Point d'origine {lat, lng}
 * @param {Object} destination - Point de destination {lat, lng}
 * @param {Array<Object>} waypoints - Points intermédiaires [{lat, lng}]
 * @param {string} mode - Mode de transport (bicycling, driving, walking)
 * @returns {Promise<Object>} - Directions
 */
async function getDirections(origin, destination, waypoints = [], mode = 'bicycling') {
  try {
    // Créer une clé de cache en fonction des paramètres
    const waypointsStr = waypoints.map(wp => `${wp.lat},${wp.lng}`).join('|');
    const cacheKey = `directions:${origin.lat},${origin.lng}:${destination.lat},${destination.lng}:${waypointsStr}:${mode}`;
    
    const cachedData = await weatherCluster.get(cacheKey);
    if (cachedData) {
      logger.debug(`Directions cache hit for route`, {
        service: 'externalIntegration'
      });
      return JSON.parse(cachedData);
    }

    // Vérifier les quotas
    if (!checkAndUpdateQuota('googleMaps')) {
      throw new Error('Google Maps API quota exceeded');
    }

    // Formater les waypoints
    const formattedWaypoints = waypoints.map(wp => ({
      location: `${wp.lat},${wp.lng}`,
      stopover: false
    }));

    // Appel à l'API
    const response = await googleMapsClient.get('/directions/json', {
      params: {
        origin: `${origin.lat},${origin.lng}`,
        destination: `${destination.lat},${destination.lng}`,
        waypoints: formattedWaypoints.length > 0 ? 
          `optimize:true|${formattedWaypoints.map(wp => wp.location).join('|')}` : 
          undefined,
        mode,
        alternatives: true,
        key: API_CONFIG.googleMaps.apiKey
      }
    });

    const directionsData = response.data;

    // Mettre en cache
    await weatherCluster.set(
      cacheKey, 
      JSON.stringify(directionsData),
      'EX',
      CACHE_TTL.DIRECTIONS
    );

    logger.debug(`Retrieved directions for route with ${waypoints.length} waypoints`, {
      service: 'externalIntegration',
      origin: `${origin.lat},${origin.lng}`,
      destination: `${destination.lat},${destination.lng}`
    });

    return directionsData;
  } catch (error) {
    logger.error(`Error getting directions: ${error.message}`, {
      service: 'externalIntegration',
      origin: `${origin.lat},${origin.lng}`,
      destination: `${destination.lat},${destination.lng}`,
      stack: error.stack
    });
    
    // Fallback à une réponse simple sans itinéraire détaillé
    return {
      status: 'FALLBACK',
      error_message: 'Could not retrieve directions',
      routes: [
        {
          summary: 'Direct path (fallback)',
          legs: [
            {
              distance: { text: 'Unknown', value: 0 },
              duration: { text: 'Unknown', value: 0 },
              start_location: origin,
              end_location: destination,
              steps: [
                {
                  distance: { text: 'Unknown', value: 0 },
                  duration: { text: 'Unknown', value: 0 },
                  start_location: origin,
                  end_location: destination,
                  travel_mode: mode.toUpperCase(),
                  instructions: 'Direct path'
                }
              ]
            }
          ],
          is_fallback: true
        }
      ]
    };
  }
}

/**
 * Obtenir des données météo de secours lorsque l'API est indisponible
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Object} - Données météo basiques
 * @private
 */
function getFallbackWeatherData(lat, lon) {
  // Déterminer la saison approximative en fonction de la latitude et du mois
  const now = new Date();
  const month = now.getMonth(); // 0-11
  
  // Déterminer si c'est l'hémisphère nord ou sud
  const isNorthernHemisphere = lat > 0;
  
  // Déterminer si c'est été ou hiver
  const isSummer = isNorthernHemisphere 
    ? (month >= 5 && month <= 8) // Été dans l'hémisphère nord: juin-septembre
    : (month <= 2 || month >= 9); // Été dans l'hémisphère sud: décembre-mars
  
  // Météo par défaut basée sur la saison et l'heure
  const hour = now.getHours();
  const isDay = hour >= 7 && hour <= 19;
  
  // Températures approximatives basées sur la latitude (très simplifié)
  let baseTemp;
  if (Math.abs(lat) < 23.5) { // Zone tropicale
    baseTemp = 28; // 28°C
  } else if (Math.abs(lat) < 40) { // Zone tempérée
    baseTemp = isSummer ? 25 : 8; // 25°C en été, 8°C en hiver
  } else { // Zone froide
    baseTemp = isSummer ? 15 : -5; // 15°C en été, -5°C en hiver
  }
  
  // Ajustement jour/nuit
  const temp = isDay ? baseTemp : baseTemp - 8;
  
  return {
    coord: { lat, lon },
    weather: [
      {
        id: 800,
        main: "Clear",
        description: "clear sky",
        icon: isDay ? "01d" : "01n"
      }
    ],
    main: {
      temp: temp,
      feels_like: temp - 2,
      temp_min: temp - 3,
      temp_max: temp + 3,
      pressure: 1013,
      humidity: 70
    },
    wind: {
      speed: 2.5,
      deg: 220
    },
    clouds: {
      all: 0
    },
    dt: Math.floor(Date.now() / 1000),
    sys: {
      sunrise: Math.floor(new Date().setHours(7, 0, 0, 0) / 1000),
      sunset: Math.floor(new Date().setHours(19, 0, 0, 0) / 1000)
    },
    timezone: 0,
    id: 0,
    name: "Unknown Location",
    is_fallback: true
  };
}

// Exporter les fonctions du service
module.exports = {
  // Services météo
  getCurrentWeather,
  getWeatherForecast,
  
  // Services d'élévation
  getElevationData,
  
  // Services Strava
  getStravaSegment,
  getStravaToken,
  refreshStravaToken,
  getStravaActivities,
  
  // Services de cartographie
  getDirections,
  
  // Constantes et état
  CACHE_TTL,
  apiQuotas
};
