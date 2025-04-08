/**
 * Service Météo Unifié
 * 
 * Ce service consolide toutes les fonctionnalités météo précédemment
 * dispersées dans plusieurs fichiers.
 * 
 * Fonctionnalités:
 * - Prévisions météo pour les cols et itinéraires
 * - Système d'alertes météo pour les cyclistes
 * - Cache intelligent des données météo
 * - Support multi-provider (OpenWeatherMap, MétéoFrance, etc.)
 * - Notifications météo personnalisées
 */

import { UnifiedAPIService } from '../api/unified-api-service';
import WeatherCache from './internal/WeatherCache';
import WeatherAlerts from './internal/WeatherAlerts';
import WeatherPredictions from './internal/WeatherPredictions';
import WeatherNotifications from './internal/WeatherNotifications';

// Constantes pour les unités et fournisseurs
const UNITS = {
  METRIC: 'metric',
  IMPERIAL: 'imperial'
};

const PROVIDERS = {
  OPEN_WEATHER: 'openWeather',
  METEO_FRANCE: 'meteoFrance',
  WEATHER_API: 'weatherApi',
  CLIMACELL: 'climacell'
};

class UnifiedWeatherService {
  constructor(config = {}) {
    this.config = {
      defaultProvider: PROVIDERS.OPEN_WEATHER,
      defaultUnits: UNITS.METRIC,
      alertsEnabled: true,
      predictionsEnabled: true,
      notificationsEnabled: true,
      cacheTtl: 30 * 60 * 1000, // 30 minutes par défaut
      ...config
    };
    
    // API unifié pour toutes les requêtes externes
    this.apiService = new UnifiedAPIService({
      cacheEnabled: true,
      monitoringEnabled: true
    });
    
    // Enregistrer tous les fournisseurs API météo
    this._registerWeatherAPIs();
    
    // Initialiser les sous-systèmes
    this.cache = new WeatherCache({
      defaultTtl: this.config.cacheTtl,
      compressData: true
    });
    
    this.alerts = new WeatherAlerts({
      enabled: this.config.alertsEnabled,
      dangerThresholds: {
        windSpeed: 40, // km/h
        rain: 10, // mm
        thunderstorm: 80, // %
        snow: 1, // mm
        temperature: {
          low: 0, // °C
          high: 35 // °C
        }
      }
    });
    
    this.predictions = new WeatherPredictions({
      enabled: this.config.predictionsEnabled,
      modelPath: '/models/weather-prediction-model.json',
    });
    
    this.notifications = new WeatherNotifications({
      enabled: this.config.notificationsEnabled
    });
    
    console.log(`[UnifiedWeatherService] Initialized with ${this.config.defaultProvider} as default provider`);
  }
  
  /**
   * Enregistre tous les fournisseurs météo avec l'API service
   */
  _registerWeatherAPIs() {
    this.apiService.registerAPI(PROVIDERS.OPEN_WEATHER, {
      keys: [process.env.OPEN_WEATHER_API_KEY],
      quota: {
        daily: 1000,
        hourly: 60
      }
    });
    
    this.apiService.registerAPI(PROVIDERS.METEO_FRANCE, {
      keys: [process.env.METEO_FRANCE_API_KEY],
      quota: {
        daily: 5000,
        hourly: 500
      }
    });
    
    this.apiService.registerAPI(PROVIDERS.WEATHER_API, {
      keys: [process.env.WEATHER_API_KEY],
      quota: {
        daily: 1000,
        hourly: 200
      }
    });
    
    this.apiService.registerAPI(PROVIDERS.CLIMACELL, {
      keys: [process.env.CLIMACELL_API_KEY],
      quota: {
        daily: 1000,
        hourly: 100
      }
    });
  }
  
  /**
   * Obtient les prévisions météo actuelles pour une localisation
   */
  async getCurrentWeather(location, options = {}) {
    const provider = options.provider || this.config.defaultProvider;
    const units = options.units || this.config.defaultUnits;
    
    // Vérifier le cache
    const cacheKey = `current:${provider}:${location}:${units}`;
    const cachedData = await this.cache.get(cacheKey);
    
    if (cachedData) {
      console.log(`[UnifiedWeatherService] Cache hit for ${cacheKey}`);
      return cachedData;
    }
    
    // Construire l'appel API en fonction du fournisseur
    let endpoint, apiParams;
    
    switch (provider) {
      case PROVIDERS.OPEN_WEATHER:
        endpoint = 'https://api.openweathermap.org/data/2.5/weather';
        apiParams = {
          q: location,
          units: units,
          appid: 'API_KEY' // Sera remplacé par le service d'API
        };
        break;
      
      case PROVIDERS.METEO_FRANCE:
        endpoint = 'https://api.meteo-france.com/v1/current';
        apiParams = {
          location: location,
          units: units
        };
        break;
      
      // Autres fournisseurs...
      
      default:
        throw new Error(`Provider not supported: ${provider}`);
    }
    
    try {
      // Exécuter la requête via le service API unifié
      const data = await this.apiService.executeRequest(provider, endpoint, {
        method: 'GET',
        params: apiParams,
        authType: 'param',
        authParamName: 'appid',
        retry: true,
        maxRetries: 3,
        useCache: true
      });
      
      // Normaliser la réponse pour avoir un format cohérent
      const normalizedData = this._normalizeWeatherData(data, provider);
      
      // Mettre en cache
      await this.cache.set(cacheKey, normalizedData);
      
      // Vérifier les alertes
      if (this.config.alertsEnabled) {
        this.alerts.checkWeatherAlerts(normalizedData, location);
      }
      
      return normalizedData;
    } catch (error) {
      console.error(`[UnifiedWeatherService] Error fetching weather for ${location}:`, error);
      
      // Essayer un fournisseur de secours si spécifié
      if (options.fallbackProvider && options.fallbackProvider !== provider) {
        console.log(`[UnifiedWeatherService] Trying fallback provider: ${options.fallbackProvider}`);
        return this.getCurrentWeather(location, {
          ...options,
          provider: options.fallbackProvider,
          fallbackProvider: null // Éviter une boucle infinie
        });
      }
      
      throw error;
    }
  }
  
  /**
   * Obtient les prévisions météo sur plusieurs jours
   */
  async getForecast(location, days = 5, options = {}) {
    const provider = options.provider || this.config.defaultProvider;
    const units = options.units || this.config.defaultUnits;
    
    // Vérifier le cache
    const cacheKey = `forecast:${provider}:${location}:${days}:${units}`;
    const cachedData = await this.cache.get(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }
    
    // Construire l'appel API
    let endpoint, apiParams;
    
    switch (provider) {
      case PROVIDERS.OPEN_WEATHER:
        endpoint = 'https://api.openweathermap.org/data/2.5/forecast';
        apiParams = {
          q: location,
          units: units,
          cnt: days * 8 // 8 prévisions par jour (toutes les 3h)
        };
        break;
      
      // Autres fournisseurs...
      
      default:
        throw new Error(`Provider not supported: ${provider}`);
    }
    
    try {
      const data = await this.apiService.executeRequest(provider, endpoint, {
        params: apiParams,
        authType: 'param',
        authParamName: 'appid'
      });
      
      const normalizedData = this._normalizeForecastData(data, provider);
      
      // Mettre en cache
      await this.cache.set(cacheKey, normalizedData);
      
      // Appliquer le modèle de prédiction avancé si activé
      if (this.config.predictionsEnabled) {
        await this.predictions.enhanceForecast(normalizedData, location);
      }
      
      return normalizedData;
    } catch (error) {
      console.error(`[UnifiedWeatherService] Error fetching forecast for ${location}:`, error);
      
      // Fallback comme pour getCurrentWeather
      if (options.fallbackProvider && options.fallbackProvider !== provider) {
        return this.getForecast(location, days, {
          ...options,
          provider: options.fallbackProvider,
          fallbackProvider: null
        });
      }
      
      throw error;
    }
  }
  
  /**
   * Obtient les prévisions météo spécifiques pour un col de montagne
   */
  async getMountainPassWeather(passId, options = {}) {
    // Obtenir les coordonnées du col à partir de sa base de données
    const passData = await this._getPassCoordinates(passId);
    
    if (!passData) {
      throw new Error(`Pass not found: ${passId}`);
    }
    
    // Obtenir les données météo par coordonnées
    const weatherData = await this.getCurrentWeather(
      `${passData.latitude},${passData.longitude}`, 
      options
    );
    
    // Enrichir avec les données spécifiques aux cyclistes
    return {
      ...weatherData,
      cyclingConditions: {
        difficulty: this._calculateWeatherDifficulty(weatherData),
        recommendations: this._generateCyclingRecommendations(weatherData),
        warning: this.alerts.getWarningForLocation(passData.name)
      },
      passInfo: {
        name: passData.name,
        altitude: passData.altitude,
        grade: passData.grade
      }
    };
  }
  
  /**
   * Abonne un utilisateur aux alertes météo pour un lieu
   */
  subscribeToAlerts(userId, location, alertTypes = ['extreme', 'warning', 'info']) {
    return this.notifications.subscribe(userId, location, alertTypes);
  }
  
  /**
   * Désabonne un utilisateur des alertes
   */
  unsubscribeFromAlerts(userId, location) {
    return this.notifications.unsubscribe(userId, location);
  }
  
  /**
   * Normalise les données météo de différents fournisseurs
   * vers un format unifié
   */
  _normalizeWeatherData(data, provider) {
    switch (provider) {
      case PROVIDERS.OPEN_WEATHER:
        return {
          location: {
            name: data.name,
            country: data.sys.country,
            coordinates: {
              lat: data.coord.lat,
              lon: data.coord.lon
            }
          },
          current: {
            timestamp: data.dt * 1000,
            temperature: data.main.temp,
            feelsLike: data.main.feels_like,
            humidity: data.main.humidity,
            pressure: data.main.pressure,
            windSpeed: data.wind.speed,
            windDirection: data.wind.deg,
            cloudiness: data.clouds.all,
            weather: {
              id: data.weather[0].id,
              main: data.weather[0].main,
              description: data.weather[0].description,
              icon: data.weather[0].icon
            },
            rain: data.rain ? data.rain['1h'] : 0,
            snow: data.snow ? data.snow['1h'] : 0,
            visibility: data.visibility
          }
        };
      
      // Autres fournisseurs...
      
      default:
        throw new Error(`Normalization not implemented for provider: ${provider}`);
    }
  }
  
  /**
   * Normalise les prévisions de différents fournisseurs
   */
  _normalizeForecastData(data, provider) {
    switch (provider) {
      case PROVIDERS.OPEN_WEATHER:
        return {
          location: {
            name: data.city.name,
            country: data.city.country,
            coordinates: {
              lat: data.city.coord.lat,
              lon: data.city.coord.lon
            }
          },
          forecast: data.list.map(item => ({
            timestamp: item.dt * 1000,
            temperature: item.main.temp,
            feelsLike: item.main.feels_like,
            humidity: item.main.humidity,
            pressure: item.main.pressure,
            windSpeed: item.wind.speed,
            windDirection: item.wind.deg,
            cloudiness: item.clouds.all,
            weather: {
              id: item.weather[0].id,
              main: item.weather[0].main,
              description: item.weather[0].description,
              icon: item.weather[0].icon
            },
            rain: item.rain ? item.rain['3h'] : 0,
            snow: item.snow ? item.snow['3h'] : 0,
            visibility: item.visibility,
            pop: item.pop // Probabilité de précipitation
          }))
        };
      
      default:
        throw new Error(`Forecast normalization not implemented for provider: ${provider}`);
    }
  }
  
  /**
   * Récupère les informations d'un col depuis la base de données
   */
  async _getPassCoordinates(passId) {
    // Ceci est une implémentation simplifiée.
    // En production, il faudrait utiliser un service dédié aux cols.
    const passesData = {
      'col-du-galibier': {
        name: 'Col du Galibier',
        latitude: 45.064,
        longitude: 6.4134,
        altitude: 2642,
        grade: 7.5
      },
      'alpe-dhuez': {
        name: 'Alpe d\'Huez',
        latitude: 45.092,
        longitude: 6.0703,
        altitude: 1860,
        grade: 8.1
      },
      // Autres cols...
    };
    
    return passesData[passId];
  }
  
  /**
   * Calcule l'indice de difficulté cycliste basé sur la météo
   */
  _calculateWeatherDifficulty(weatherData) {
    if (!weatherData || !weatherData.current) {
      return 0;
    }
    
    const { temperature, windSpeed, rain, snow } = weatherData.current;
    
    // Facteurs qui augmentent la difficulté
    let difficulty = 0;
    
    // Températures extrêmes
    if (temperature < 5) difficulty += (5 - temperature) * 0.5;
    if (temperature > 30) difficulty += (temperature - 30) * 0.4;
    
    // Vent
    difficulty += windSpeed * 0.3;
    
    // Précipitations
    if (rain) difficulty += rain * 2;
    if (snow) difficulty += snow * 4;
    
    // Normaliser entre 0 et 10
    difficulty = Math.min(Math.max(difficulty, 0), 10);
    
    return Math.round(difficulty * 10) / 10;
  }
  
  /**
   * Génère des recommendations pour cyclistes
   */
  _generateCyclingRecommendations(weatherData) {
    if (!weatherData || !weatherData.current) {
      return ['Données météo insuffisantes pour générer des recommandations'];
    }
    
    const { temperature, windSpeed, weather, rain, snow } = weatherData.current;
    const recommendations = [];
    
    // Recommandations basées sur la température
    if (temperature < 5) {
      recommendations.push('Portez des vêtements thermiques et des gants');
      recommendations.push('Risque d\'hypothermie, envisagez de reporter votre sortie');
    } else if (temperature < 10) {
      recommendations.push('Portez des couches supplémentaires et des gants');
    } else if (temperature > 30) {
      recommendations.push('Risque de déshydratation, emportez beaucoup d\'eau');
      recommendations.push('Évitez de rouler pendant les heures les plus chaudes');
    } else if (temperature > 25) {
      recommendations.push('Emportez suffisamment d\'eau et de la protection solaire');
    }
    
    // Vent
    if (windSpeed > 30) {
      recommendations.push('Vents très forts, prudence dans les descentes');
    } else if (windSpeed > 20) {
      recommendations.push('Vents modérés, adaptez votre effort');
    }
    
    // Pluie et neige
    if (rain > 5) {
      recommendations.push('Fortes pluies, visibilité réduite et risque de glissade');
    } else if (rain > 0) {
      recommendations.push('Pluie légère, portez un imperméable');
    }
    
    if (snow > 0) {
      recommendations.push('Conditions neigeuses, déconseillé pour le cyclisme');
    }
    
    // Si tout va bien
    if (recommendations.length === 0) {
      recommendations.push('Conditions idéales pour le cyclisme');
    }
    
    return recommendations;
  }
}

// Exporter les constantes utiles
export const WeatherUnits = UNITS;
export const WeatherProviders = PROVIDERS;

export default UnifiedWeatherService;
