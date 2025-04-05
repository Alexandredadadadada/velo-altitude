// weather.service.js - Service pour l'intégration avec l'API OpenWeatherMap
const axios = require('axios');
const config = require('../config/api.config');
// Import différé pour éviter la dépendance circulaire
let apiManager;
setTimeout(() => {
  apiManager = require('./api-manager.service');
}, 0);
const { logger } = require('../utils/logger');
const apiServices = require('./apiServices');

// Import des services d'optimisation
const geoClusteringService = require('./geo-clustering.service');
const weatherCacheService = require('./weather-cache.service');
const weatherPredictionService = require('./weather-prediction.service');

class WeatherService {
  constructor() {
    this.apiKey = config.openWeather.apiKey;
    this.baseUrl = config.openWeather.baseUrl;
    this.units = config.openWeather.units;
    this.lang = config.openWeather.lang;
    
    // Enregistrer ce service dans le gestionnaire d'API
    this._registerWithApiManager();
    
    // Initialiser le service de prédiction avec une référence à ce service
    setTimeout(() => {
      weatherPredictionService.init(this);
      logger.info('Service de prédiction météo initialisé avec succès');
    }, 1000);
  }
  
  /**
   * Enregistre les méthodes du service dans le gestionnaire d'API
   * @private
   */
  _registerWithApiManager() {
    // Ce service sera disponible via apiManager.execute('weather', 'getCurrentWeather', ...)
    if (!apiManager.services.weather) {
      logger.info('Enregistrement du service météo dans le gestionnaire d\'API');
      
      // Configuration spécifique pour l'API météo
      apiManager.services.weather = {
        service: this,
        retryConfig: { maxRetries: 3, initialDelay: 1000, maxDelay: 10000 },
        rateLimit: { requestsPerMinute: 50 },
        fallbackStrategy: 'cache'
      };
    }
  }

  /**
   * Récupère les données météo actuelles pour une localisation
   * @param {number} lat Latitude
   * @param {number} lon Longitude
   * @param {Object} options Options supplémentaires
   * @returns {Promise<object>} Données météo actuelles
   */
  async getCurrentWeather(lat, lon, options = {}) {
    try {
      // Enregistrer la requête pour analyse de prédiction
      weatherPredictionService.recordRequest(lat, lon, 'current', options.context || {});
      
      // Générer une clé de cache unique
      const cacheKey = `current_lat_${lat.toFixed(4)}_lon_${lon.toFixed(4)}`;
      
      // Utiliser le service de cache avancé
      return await weatherCacheService.getOrFetch(
        cacheKey,
        async () => {
          // Récupérer les données via le gestionnaire d'API
          return await apiManager.execute('weather', 'fetchCurrentWeather', { lat, lon });
        },
        {
          type: 'current',
          lat,
          lon,
          forceRefresh: options.forceRefresh,
          weatherCondition: options.weatherCondition
        }
      );
    } catch (error) {
      logger.error(`Erreur lors de la récupération des données météo actuelles pour (${lat}, ${lon}): ${error.message}`);
      throw new Error('Échec de la récupération des données météo');
    }
  }

  /**
   * Version optimisée qui utilise le gestionnaire d'API central
   * @param {Object} params Paramètres avec lat et lon
   * @returns {Promise<object>} Données météo actuelles
   */
  async fetchCurrentWeather(params) {
    try {
      const { lat, lon } = params;
      
      // Utiliser la clé API active du gestionnaire de clés
      const activeApiKey = this._getActiveApiKey();
      
      const response = await axios.get(`${this.baseUrl}/weather`, {
        params: {
          lat,
          lon,
          appid: activeApiKey,
          units: this.units,
          lang: this.lang
        }
      });
      
      return this._formatWeatherData(response.data);
    } catch (error) {
      logger.error('Erreur lors de la récupération des données météo actuelles:', error);
      throw error;
    }
  }

  /**
   * Récupère les prévisions météo pour une localisation
   * @param {number} lat Latitude
   * @param {number} lon Longitude
   * @param {Object} options Options supplémentaires
   * @returns {Promise<object>} Prévisions météo sur 5 jours
   */
  async getForecast(lat, lon, options = {}) {
    try {
      // Enregistrer la requête pour analyse de prédiction
      weatherPredictionService.recordRequest(lat, lon, 'forecast', options.context || {});
      
      // Générer une clé de cache unique
      const cacheKey = `forecast_lat_${lat.toFixed(4)}_lon_${lon.toFixed(4)}`;
      
      // Utiliser le service de cache avancé
      return await weatherCacheService.getOrFetch(
        cacheKey,
        async () => {
          // Récupérer les données via le gestionnaire d'API
          return await apiManager.execute('weather', 'fetchForecast', { lat, lon });
        },
        {
          type: 'forecast',
          lat,
          lon,
          forceRefresh: options.forceRefresh,
          timeFrame: options.timeFrame || 'medium'
        }
      );
    } catch (error) {
      logger.error(`Erreur lors de la récupération des prévisions météo pour (${lat}, ${lon}): ${error.message}`);
      throw new Error('Échec de la récupération des prévisions météo');
    }
  }
  
  /**
   * Version optimisée qui utilise le gestionnaire d'API central
   * @param {Object} params Paramètres avec lat et lon
   * @returns {Promise<object>} Prévisions météo
   */
  async fetchForecast(params) {
    try {
      const { lat, lon } = params;
      
      // Utiliser la clé API active du gestionnaire de clés
      const activeApiKey = this._getActiveApiKey();
      
      const response = await axios.get(`${this.baseUrl}/forecast`, {
        params: {
          lat,
          lon,
          appid: activeApiKey,
          units: this.units,
          lang: this.lang
        }
      });
      
      return {
        city: response.data.city,
        list: response.data.list.map(item => this._formatForecastItem(item))
      };
    } catch (error) {
      logger.error('Erreur lors de la récupération des prévisions météo:', error);
      throw error;
    }
  }

  /**
   * Récupère les données météo par créneau horaire (utile pour planifier une sortie)
   * @param {number} lat Latitude
   * @param {number} lon Longitude
   * @param {Object} options Options supplémentaires
   * @returns {Promise<object>} Prévisions météo par heure
   */
  async getHourlyForecast(lat, lon, options = {}) {
    try {
      // Enregistrer la requête pour analyse de prédiction
      weatherPredictionService.recordRequest(lat, lon, 'hourly', options.context || {});
      
      // Générer une clé de cache unique
      const cacheKey = `hourly_lat_${lat.toFixed(4)}_lon_${lon.toFixed(4)}`;
      
      // Utiliser le service de cache avancé
      return await weatherCacheService.getOrFetch(
        cacheKey,
        async () => {
          // Récupérer les données via le gestionnaire d'API
          return await apiManager.execute('weather', 'fetchHourlyForecast', { lat, lon });
        },
        {
          type: 'hourly',
          lat,
          lon,
          forceRefresh: options.forceRefresh
        }
      );
    } catch (error) {
      logger.error(`Erreur lors de la récupération des prévisions horaires pour (${lat}, ${lon}): ${error.message}`);
      throw new Error('Échec de la récupération des prévisions horaires');
    }
  }

  /**
   * Version optimisée qui utilise le gestionnaire d'API central
   * @param {Object} params Paramètres avec lat et lon
   * @returns {Promise<object>} Prévisions météo horaires
   */
  async fetchHourlyForecast(params) {
    try {
      const { lat, lon } = params;
      
      // Utiliser la clé API active du gestionnaire de clés
      const activeApiKey = this._getActiveApiKey();
      
      const response = await axios.get(`${this.baseUrl}/forecast`, {
        params: {
          lat,
          lon,
          appid: activeApiKey,
          units: this.units,
          lang: this.lang,
          cnt: 24 // Limite à 24 heures
        }
      });
      
      // Filtrage pour obtenir uniquement les prévisions horaires
      return {
        city: response.data.city,
        hourly: response.data.list.map(item => this._formatForecastItem(item))
      };
    } catch (error) {
      logger.error('Erreur lors de la récupération des prévisions horaires:', error);
      throw error;
    }
  }

  /**
   * Récupère l'indice UV pour une localisation
   * @param {number} lat Latitude
   * @param {number} lon Longitude
   * @param {Object} options Options supplémentaires
   * @returns {Promise<object>} Données d'indice UV
   */
  async getUvIndex(lat, lon, options = {}) {
    try {
      // Enregistrer la requête pour analyse de prédiction
      weatherPredictionService.recordRequest(lat, lon, 'uv', options.context || {});
      
      // Générer une clé de cache unique
      const cacheKey = `uv_lat_${lat.toFixed(4)}_lon_${lon.toFixed(4)}`;
      
      // Utiliser le service de cache avancé
      return await weatherCacheService.getOrFetch(
        cacheKey,
        async () => {
          // Récupérer les données via le gestionnaire d'API
          return await apiManager.execute('weather', 'fetchUvIndex', { lat, lon });
        },
        {
          type: 'uv',
          lat,
          lon,
          forceRefresh: options.forceRefresh
        }
      );
    } catch (error) {
      logger.error(`Erreur lors de la récupération de l'indice UV pour (${lat}, ${lon}): ${error.message}`);
      throw new Error('Échec de la récupération de l\'indice UV');
    }
  }

  /**
   * Version optimisée qui utilise le gestionnaire d'API central
   * @param {Object} params Paramètres avec lat et lon
   * @returns {Promise<object>} Données d'indice UV
   */
  async fetchUvIndex(params) {
    try {
      const { lat, lon } = params;
      
      // Utiliser la clé API active du gestionnaire de clés
      const activeApiKey = this._getActiveApiKey();
      
      const response = await axios.get(`${this.baseUrl}/uvi`, {
        params: {
          lat,
          lon,
          appid: activeApiKey
        }
      });
      
      return {
        value: response.data.value,
        riskLevel: this._getUvRiskLevel(response.data.value),
        date: new Date(response.data.date * 1000).toISOString()
      };
    } catch (error) {
      logger.error('Erreur lors de la récupération de l\'indice UV:', error);
      throw error;
    }
  }

  /**
   * Récupère les données de pollution de l'air
   * @param {number} lat Latitude
   * @param {number} lon Longitude
   * @param {Object} options Options supplémentaires
   * @returns {Promise<object>} Données de qualité de l'air
   */
  async getAirPollution(lat, lon, options = {}) {
    try {
      // Enregistrer la requête pour analyse de prédiction
      weatherPredictionService.recordRequest(lat, lon, 'air', options.context || {});
      
      // Générer une clé de cache unique
      const cacheKey = `air_lat_${lat.toFixed(4)}_lon_${lon.toFixed(4)}`;
      
      // Utiliser le service de cache avancé
      return await weatherCacheService.getOrFetch(
        cacheKey,
        async () => {
          // Récupérer les données via le gestionnaire d'API
          return await apiManager.execute('weather', 'fetchAirPollution', { lat, lon });
        },
        {
          type: 'air',
          lat,
          lon,
          forceRefresh: options.forceRefresh
        }
      );
    } catch (error) {
      logger.error(`Erreur lors de la récupération des données de pollution pour (${lat}, ${lon}): ${error.message}`);
      throw new Error('Échec de la récupération des données de pollution');
    }
  }

  /**
   * Version optimisée qui utilise le gestionnaire d'API central
   * @param {Object} params Paramètres avec lat et lon
   * @returns {Promise<object>} Données de qualité de l'air
   */
  async fetchAirPollution(params) {
    try {
      const { lat, lon } = params;
      
      // Utiliser la clé API active du gestionnaire de clés
      const activeApiKey = this._getActiveApiKey();
      
      const response = await axios.get(`${this.baseUrl}/air_pollution`, {
        params: {
          lat,
          lon,
          appid: activeApiKey
        }
      });
      
      // Extraction des données principales de pollution
      const data = response.data.list[0];
      
      return {
        aqi: data.main.aqi,
        qualityLabel: this._getAirQualityLabel(data.main.aqi),
        components: data.components,
        date: new Date(data.dt * 1000).toISOString()
      };
    } catch (error) {
      logger.error('Erreur lors de la récupération des données de pollution:', error);
      throw error;
    }
  }

  /**
   * Récupère les données météo pour plusieurs points en une seule fois
   * @param {Array} points Liste de points [{lat, lon, ...}]
   * @param {string} dataType Type de données (current, forecast, etc.)
   * @param {Object} options Options supplémentaires
   * @returns {Promise<Array>} Données météo pour chaque point
   */
  async getBatchWeather(points, dataType = 'current', options = {}) {
    try {
      if (!points || points.length === 0) {
        return [];
      }
      
      // Si un seul point, utiliser les méthodes standards
      if (points.length === 1) {
        const point = points[0];
        if (dataType === 'current') {
          return [await this.getCurrentWeather(point.lat, point.lon, options)];
        } else if (dataType === 'forecast') {
          return [await this.getForecast(point.lat, point.lon, options)];
        } else if (dataType === 'hourly') {
          return [await this.getHourlyForecast(point.lat, point.lon, options)];
        } else if (dataType === 'uv') {
          return [await this.getUvIndex(point.lat, point.lon, options)];
        } else if (dataType === 'air') {
          return [await this.getAirPollution(point.lat, point.lon, options)];
        }
        return [];
      }
      
      logger.info(`Traitement par lots pour ${points.length} points (type: ${dataType})`);
      
      // Optimiser les requêtes avec le service de clustering
      const { optimizedRequests, mapping } = geoClusteringService.optimizeWeatherRequests(
        points,
        { maxDistance: 10, minPoints: 2 }
      );
      
      logger.info(`Requêtes optimisées: ${optimizedRequests.length} au lieu de ${points.length}`);
      
      // Récupérer les données pour chaque requête optimisée
      const responses = await Promise.all(
        optimizedRequests.map(async request => {
          if (dataType === 'current') {
            return await this.getCurrentWeather(request.lat, request.lon, options);
          } else if (dataType === 'forecast') {
            return await this.getForecast(request.lat, request.lon, options);
          } else if (dataType === 'hourly') {
            return await this.getHourlyForecast(request.lat, request.lon, options);
          } else if (dataType === 'uv') {
            return await this.getUvIndex(request.lat, request.lon, options);
          } else if (dataType === 'air') {
            return await this.getAirPollution(request.lat, request.lon, options);
          }
          return null;
        })
      );
      
      // Reconstruire les résultats pour correspondre aux requêtes originales
      return geoClusteringService.reconstructResults(responses, mapping);
    } catch (error) {
      logger.error(`Erreur lors de la récupération par lots des données météo: ${error.message}`);
      throw new Error('Échec de la récupération par lots des données météo');
    }
  }

  /**
   * Précharge les données météo pour les zones populaires
   * @param {Object} options Options de préchargement
   * @returns {Promise<number>} Nombre de zones préchargées
   */
  async preloadPopularAreas(options = {}) {
    return await weatherPredictionService.preloadPopularAreas(options);
  }

  /**
   * Formate les données météo brutes
   * @param {object} data Données brutes de l'API
   * @returns {object} Données formatées
   * @private
   */
  _formatWeatherData(data) {
    return {
      location: {
        name: data.name,
        country: data.sys.country,
        coordinates: {
          lat: data.coord.lat,
          lon: data.coord.lon
        }
      },
      weather: {
        id: data.weather[0].id,
        main: data.weather[0].main,
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        iconUrl: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`
      },
      temperature: {
        current: data.main.temp,
        feelsLike: data.main.feels_like,
        min: data.main.temp_min,
        max: data.main.temp_max
      },
      wind: {
        speed: data.wind.speed,
        direction: data.wind.deg,
        gust: data.wind.gust,
        directionText: this._getWindDirection(data.wind.deg)
      },
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      visibility: data.visibility,
      cloudiness: data.clouds.all,
      timestamp: data.dt,
      date: new Date(data.dt * 1000).toISOString(),
      sunrise: new Date(data.sys.sunrise * 1000).toISOString(),
      sunset: new Date(data.sys.sunset * 1000).toISOString(),
      // Évaluation des conditions pour le cyclisme (1-10)
      cyclingCondition: this._evaluateCyclingConditions(data)
    };
  }

  /**
   * Formate un élément de prévision
   * @param {object} item Élément de prévision
   * @returns {object} Donnée formatée
   * @private
   */
  _formatForecastItem(item) {
    return {
      date: new Date(item.dt * 1000).toISOString(),
      timestamp: item.dt,
      temperature: {
        current: item.main.temp,
        feelsLike: item.main.feels_like,
        min: item.main.temp_min,
        max: item.main.temp_max
      },
      weather: {
        id: item.weather[0].id,
        main: item.weather[0].main,
        description: item.weather[0].description,
        icon: item.weather[0].icon,
        iconUrl: `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`
      },
      wind: {
        speed: item.wind.speed,
        direction: item.wind.deg,
        directionText: this._getWindDirection(item.wind.deg)
      },
      humidity: item.main.humidity,
      pressure: item.main.pressure,
      cloudiness: item.clouds.all,
      // Évaluation des conditions pour le cyclisme (1-10)
      cyclingCondition: this._evaluateCyclingConditions(item)
    };
  }

  /**
   * Détermine la direction du vent à partir de l'angle en degrés
   * @param {number} degrees Angle en degrés
   * @returns {string} Direction du vent en texte
   * @private
   */
  _getWindDirection(degrees) {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  }

  /**
   * Détermine le niveau de risque UV
   * @param {number} uvIndex Indice UV
   * @returns {string} Niveau de risque
   * @private
   */
  _getUvRiskLevel(uvIndex) {
    if (uvIndex < 3) return 'Faible';
    if (uvIndex < 6) return 'Modéré';
    if (uvIndex < 8) return 'Élevé';
    if (uvIndex < 11) return 'Très élevé';
    return 'Extrême';
  }

  /**
   * Détermine la qualité de l'air
   * @param {number} aqi Indice de qualité de l'air (1-5)
   * @returns {string} Libellé de qualité
   * @private
   */
  _getAirQualityLabel(aqi) {
    const labels = [
      'Bonne',
      'Acceptable',
      'Modérée',
      'Mauvaise',
      'Très mauvaise'
    ];
    return labels[aqi - 1] || 'Inconnue';
  }

  /**
   * Évalue les conditions météo pour le cyclisme
   * @param {object} data Données météo
   * @returns {number} Score de condition (1-10)
   * @private
   */
  _evaluateCyclingConditions(data) {
    let score = 10;
    
    // Facteurs météorologiques qui affectent le cyclisme
    
    // Température (idéale entre 15 et 25°C)
    const temp = data.main?.temp || data.temp;
    if (temp < 5) score -= 4;
    else if (temp < 10) score -= 2;
    else if (temp > 30) score -= 3;
    else if (temp > 25) score -= 1;
    
    // Vent (idéal < 15 km/h)
    const wind = data.wind?.speed || 0;
    if (wind > 30) score -= 5;
    else if (wind > 20) score -= 3;
    else if (wind > 15) score -= 1;
    
    // Précipitations
    const weatherId = data.weather[0].id;
    if (weatherId >= 200 && weatherId < 300) score -= 8; // Orage
    else if (weatherId >= 300 && weatherId < 400) score -= 3; // Bruine
    else if (weatherId >= 500 && weatherId < 600) {
      if (weatherId >= 502) score -= 7; // Pluie forte
      else score -= 5; // Pluie légère à modérée
    }
    else if (weatherId >= 600 && weatherId < 700) score -= 6; // Neige
    else if (weatherId >= 700 && weatherId < 800) score -= 2; // Brouillard, brume
    
    // Nuages (50-75% peut être idéal pour éviter le soleil direct)
    const clouds = data.clouds?.all || 0;
    if (clouds > 90) score -= 1;
    else if (clouds < 20 && temp > 25) score -= 1; // Plein soleil par temps chaud
    
    // Limitation à l'échelle 1-10
    return Math.max(1, Math.min(10, score));
  }

  /**
   * Obtient la clé API active pour les requêtes
   * @returns {string} Clé API active
   * @private
   */
  _getActiveApiKey() {
    // Utiliser le nouveau système de gestion des clés API
    try {
      return apiServices.weatherService.getKey();
    } catch (error) {
      logger.warn(`Erreur lors de la récupération de la clé API Weather: ${error.message}. Utilisation de la clé de secours.`);
      return this.apiKey;
    }
  }
}

// Créer l'instance et l'exporter
const weatherService = new WeatherService();
module.exports = weatherService;
