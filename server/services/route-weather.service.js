/**
 * Service de météo pour les itinéraires
 * Fournit des prévisions météo détaillées pour les itinéraires
 * et propose des recommandations basées sur les conditions
 */

const axios = require('axios');
const turf = require('@turf/turf');
const NodeCache = require('node-cache');
const { logger } = require('../utils/logger');
const weatherNotificationService = require('./weather-notification.service');
const routesService = require('./routes.service');
const userService = require('./user.service');
const { trackApiCall } = require('../middleware/api-quota-middleware');
const gpxValidator = require('../utils/gpx-validator');
const weatherErrorHandler = require('../utils/weather-error-handler');
const retryService = require('../utils/retry.service');

// Import des services d'optimisation
const weatherService = require('./weather.service');
const geoClusteringService = require('./geo-clustering.service');
const weatherPredictionService = require('./weather-prediction.service');

class RouteWeatherService {
  constructor() {
    this.apiKey = process.env.OPENWEATHERMAP_API_KEY;
    this.cache = new NodeCache({ stdTTL: 1800 }); // 30 minutes par défaut
    this.weatherImpactWeights = {
      rain: 0.35,
      wind: 0.25,
      temperature: 0.2,
      visibility: 0.1,
      snow: 0.1
    };
    this.routeSegmentLength = 5; // Division de l'itinéraire tous les 5km pour l'analyse météo
    
    logger.info('Service météo pour les itinéraires initialisé');
  }

  /**
   * Obtient les prévisions météo détaillées pour un itinéraire
   * @param {string} routeId - ID de l'itinéraire
   * @param {Object} options - Options de prévision
   * @returns {Object} Prévisions météo pour l'itinéraire
   */
  async getRouteWeatherForecast(routeId, options = {}) {
    const cacheKey = `route_weather_${routeId}_${options.startTime || 'now'}`;
    
    try {
      // Vérifier le cache
      const cachedData = this.cache.get(cacheKey);
      if (cachedData && !options.forceRefresh) {
        logger.info(`Utilisation du cache pour les prévisions météo de l'itinéraire ${routeId}`);
        return cachedData;
      }
      
      // Récupérer les données de l'itinéraire via un wrapper d'erreur
      const route = await weatherErrorHandler.executeWeatherOperation(
        async () => routesService.getRouteById(routeId),
        { routeId },
        { 
          source: 'RouteWeatherService.getRouteWeatherForecast',
          maxRetries: 2
        }
      );
      
      // Validation de l'itinéraire
      if (!route || !route.geometry || !route.geometry.coordinates || route.geometry.coordinates.length === 0) {
        return weatherErrorHandler.setProcessingError(
          'Itinéraire invalide ou incomplet', 
          { routeId, geometryValid: !!route?.geometry },
          'INVALID_ROUTE'
        );
      }
      
      // Diviser l'itinéraire en segments pour une analyse météo précise
      const segments = this._divideRouteIntoSegments(route.geometry);
      
      // Déterminer l'heure de départ (maintenant par défaut)
      const startTime = options.startTime ? new Date(options.startTime) : new Date();
      
      // Méthode optimisée: Préparer les points pour la requête en lot
      const points = segments.map(segment => ({
        lat: segment.center[1],
        lon: segment.center[0],
        time: startTime.getTime() / 1000 + segment.timeOffset,
        segmentData: segment // Préserver les données du segment
      }));
      
      // Obtenir les prévisions météo en utilisant getBatchWeather
      const forecasts = await weatherErrorHandler.executeWeatherOperation(
        async () => {
          // Si des prévisions avec timestamp spécifique sont nécessaires
          if (options.startTime) {
            // Traitement individuel pour les prévisions avec timestamp (requis par l'API)
            return await Promise.all(
              points.map(point => 
                this._getWeatherForecastForPoint(
                  point.lat,
                  point.lon,
                  point.time
                )
              )
            );
          } else {
            // Utiliser la méthode optimisée pour les prévisions actuelles
            return await weatherService.getBatchWeather(
              points,
              'current', 
              { 
                context: { routeId },
                forceRefresh: options.forceRefresh
              }
            );
          }
        },
        { 
          routeId,
          segmentCount: segments.length
        },
        { 
          source: 'RouteWeatherService.getBatchWeatherForSegments',
          maxRetries: 3,
          fallbackValue: segments.map(() => this._getDefaultWeatherData())
        }
      );
      
      // Regrouper les prévisions avec les segments
      const segmentForecasts = segments.map((segment, index) => ({
        ...segment,
        weather: forecasts[index] || this._getDefaultWeatherData()
      }));
      
      // Calculer des statistiques globales pour l'itinéraire
      const weatherStats = this._calculateRouteWeatherStats(segmentForecasts);
      
      // Évaluer si les conditions sont bonnes pour le cyclisme
      const assessment = this._assessRouteWeather(weatherStats, route.tags || {});
      
      // Générer des recommandations
      const recommendation = this._generateRideRecommendation(
        weatherStats, 
        assessment.overallScore
      );
      
      // Préparer le résultat
      const result = {
        routeId,
        routeName: route.name,
        timestamp: new Date().toISOString(),
        forecastTime: startTime.toISOString(),
        segments: segmentForecasts,
        statistics: weatherStats,
        assessment,
        recommendation,
        warning: assessment.overallScore < 4 ? 
          'Conditions météorologiques potentiellement dangereuses' : null
      };
      
      // Stocker en cache
      this.cache.set(cacheKey, result);
      
      // Si les conditions sont mauvaises, envoyer une notification aux utilisateurs concernés
      if (assessment.overallScore < 4) {
        this._notifyUsersAboutBadWeather(routeId, route.name, weatherStats);
      }
      
      return result;
    } catch (error) {
      logger.error(`Erreur lors de l'obtention des prévisions météo pour l'itinéraire ${routeId}:`, error);
      throw new Error(`Impossible d'obtenir les prévisions météo pour cet itinéraire: ${error.message}`);
    }
  }

  /**
   * Obtient les prévisions météo pour un point
   * @private
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @param {number} time - Timestamp Unix (ou null pour maintenant)
   * @returns {Object} Prévisions météo
   */
  async _getWeatherForecastForPoint(lat, lon, time = null) {
    // Gérer les cas où time n'est pas un nombre
    if (time && isNaN(time)) {
      logger.warn(`Timestamp invalide pour la prévision météo: ${time}, utilisation de l'heure actuelle`);
      time = Math.floor(Date.now() / 1000);
    }
    
    try {
      // SI on demande la météo actuelle (time = null ou proche du temps actuel)
      const currentTime = Math.floor(Date.now() / 1000);
      const isCurrentWeather = !time || Math.abs(time - currentTime) < 3600; // Dans l'heure
      
      if (isCurrentWeather) {
        // Utiliser le service météo optimisé pour les conditions actuelles
        const weatherData = await weatherService.getCurrentWeather(lat, lon, {
          context: { source: 'route-weather' }
        });
        
        return {
          temperature: {
            current: weatherData.temperature.current,
            feelsLike: weatherData.temperature.feelsLike,
            min: weatherData.temperature.min,
            max: weatherData.temperature.max
          },
          wind: {
            speed: weatherData.wind.speed,
            direction: weatherData.wind.direction,
            gust: weatherData.wind.gust || null,
            directionText: weatherData.wind.directionText
          },
          precipitation: {
            probability: weatherData.rain ? 100 : (weatherData.clouds > 50 ? 30 : 0),
            intensity: weatherData.rain ? weatherData.rain['1h'] || 0 : 0,
            type: weatherData.weather.main.toLowerCase().includes('rain') ? 'rain' :
                 weatherData.weather.main.toLowerCase().includes('snow') ? 'snow' : 'none'
          },
          humidity: weatherData.humidity,
          pressure: weatherData.pressure,
          visibility: weatherData.visibility,
          uvIndex: weatherData.uvIndex || 0,
          clouds: weatherData.cloudiness,
          time: weatherData.timestamp || currentTime,
          condition: {
            id: weatherData.weather.id,
            main: weatherData.weather.main,
            description: weatherData.weather.description,
            icon: weatherData.weather.icon
          },
          cyclingScore: weatherData.cyclingCondition
        };
      } else {
        // Pour les prévisions futures, utiliser l'API de prévision
        // Obtenir les données de l'API OpenWeatherMap
        const forecastResponse = await weatherService.getForecast(lat, lon, {
          context: { source: 'route-weather' }
        });
        
        if (!forecastResponse || !forecastResponse.list || forecastResponse.list.length === 0) {
          throw new Error('Données de prévision invalides ou manquantes');
        }
        
        // Trouver la prévision la plus proche du temps demandé
        const targetTime = time;
        let closestForecast = forecastResponse.list[0];
        let minTimeDiff = Math.abs(closestForecast.timestamp - targetTime);
        
        for (const forecast of forecastResponse.list) {
          const timeDiff = Math.abs(forecast.timestamp - targetTime);
          if (timeDiff < minTimeDiff) {
            minTimeDiff = timeDiff;
            closestForecast = forecast;
          }
        }
        
        return {
          temperature: closestForecast.temperature,
          wind: closestForecast.wind,
          precipitation: {
            probability: closestForecast.pop * 100 || 0,
            intensity: (closestForecast.rain && closestForecast.rain['3h']) ? closestForecast.rain['3h'] / 3 : 0,
            type: closestForecast.weather.main.toLowerCase().includes('rain') ? 'rain' :
                 closestForecast.weather.main.toLowerCase().includes('snow') ? 'snow' : 'none'
          },
          humidity: closestForecast.humidity,
          pressure: closestForecast.pressure,
          visibility: closestForecast.visibility || 10000,
          uvIndex: closestForecast.uvIndex || 0,
          clouds: closestForecast.cloudiness,
          time: closestForecast.timestamp,
          condition: {
            id: closestForecast.weather.id,
            main: closestForecast.weather.main,
            description: closestForecast.weather.description,
            icon: closestForecast.weather.icon
          },
          cyclingScore: closestForecast.cyclingCondition
        };
      }
    } catch (error) {
      logger.error(`Erreur lors de la récupération des prévisions météo pour le point (${lat}, ${lon}, ${time}):`, error);
      // Renvoyer des données par défaut
      return this._getDefaultWeatherData();
    }
  }

  /**
   * Fournit des données météo par défaut en cas d'erreur
   * @private
   * @returns {Object} Données météo par défaut
   */
  _getDefaultWeatherData() {
    return {
      temperature: {
        current: null,
        feelsLike: null,
        min: null,
        max: null
      },
      wind: {
        speed: null,
        direction: null,
        gust: null,
        directionText: null
      },
      precipitation: {
        probability: null,
        intensity: null,
        type: null
      },
      humidity: null,
      pressure: null,
      visibility: null,
      uvIndex: null,
      clouds: null,
      time: Math.floor(Date.now() / 1000),
      condition: {
        id: 800,
        main: 'Unknown',
        description: 'Données non disponibles',
        icon: '01d'
      },
      cyclingScore: 5
    };
  }

  /**
   * Récupère les données météo pour une grille
   * @private
   * @param {Array} grid - Points de la grille
   * @param {Object} options - Options de visualisation
   * @returns {Array} Données météo pour la grille
   */
  async _fetchWeatherDataForGrid(grid, options) {
    try {
      logger.info(`Récupération des données météo pour une grille de ${grid.length} points`);
      
      // Utiliser la méthode getBatchWeather optimisée du weatherService
      // qui utilise le clustering géographique pour réduire le nombre d'appels API
      const weatherData = await weatherService.getBatchWeather(
        grid.map(point => ({
          lat: point.lat,
          lon: point.lon
        })),
        options.forecast ? 'forecast' : 'current',
        {
          context: { source: 'route-weather-grid' },
          forceRefresh: options.forceRefresh
        }
      );
      
      // Combiner les données de la grille avec les données météo
      return grid.map((point, index) => ({
        ...point,
        weather: weatherData[index] || this._getDefaultWeatherData()
      }));
    } catch (error) {
      logger.error(`Erreur lors de la récupération des données météo pour la grille:`, error);
      
      // En cas d'erreur, retourner des données par défaut
      return grid.map(point => ({
        ...point,
        weather: this._getDefaultWeatherData()
      }));
    }
  }

  // ... Reste du code inchangé ...
}

module.exports = new RouteWeatherService();
