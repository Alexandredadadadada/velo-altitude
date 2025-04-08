// Weather Service
import api from './apiWrapper';
import config from '../config';

// OpenWeatherMap API key et URL de base depuis la configuration centralisée
const WEATHER_API_KEY = config.api.weatherApiKey || '';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

/**
 * Service météo pour obtenir et traiter les données météorologiques
 * Utilise apiWrapper qui gère les appels API réels avec MSW en mode développement.
 */
class WeatherService {
  /**
   * Fetches current weather for a specific location
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {string} lang - Language code (en, fr, de, etc.)
   * @returns {Promise<Object>} Weather data
   */
  async getCurrentWeather(lat, lng, lang = 'en') {
    try {
      const response = await api.get(`/weather/current`, {
        params: {
          lat,
          lng,
          lang
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching current weather:', error);
      throw error;
    }
  }

  /**
   * Fetches 5-day weather forecast for a specific location
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {string} lang - Language code (en, fr, de, etc.)
   * @returns {Promise<Object>} Forecast data
   */
  async getForecast(lat, lng, lang = 'en') {
    try {
      const response = await api.get(`/weather/forecast`, {
        params: {
          lat,
          lng,
          lang
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching forecast:', error);
      throw error;
    }
  }

  /**
   * Gets weather data for multiple points along a route
   * @param {Array<{lat: number, lng: number}>} routePoints - Array of route coordinates
   * @param {string} lang - Language code (en, fr, de, etc.)
   * @returns {Promise<Array<Object>>} Array of weather data for each point
   */
  async getRouteWeather(routePoints, lang = 'en') {
    try {
      // Take a sample of points to avoid too many API calls
      const sampleSize = Math.min(10, routePoints.length);
      const step = Math.max(1, Math.floor(routePoints.length / sampleSize));
      const sampledPoints = [];
      
      for (let i = 0; i < routePoints.length; i += step) {
        sampledPoints.push(routePoints[i]);
      }
      
      // Add the last point if it's not already included
      if (routePoints.length > 0 && 
          sampledPoints[sampledPoints.length - 1] !== routePoints[routePoints.length - 1]) {
        sampledPoints.push(routePoints[routePoints.length - 1]);
      }
      
      const response = await api.post(`/weather/route`, {
        points: sampledPoints,
        lang
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching route weather:', error);
      throw error;
    }
  }
  
  /**
   * Determines the cycling condition severity based on weather data
   * @param {Object} weatherData - Weather data for a specific location
   * @returns {string} Severity level: 'good', 'moderate', 'difficult', or 'dangerous'
   */
  getCyclingConditionSeverity(weatherData) {
    if (!weatherData) return 'moderate';
    
    const { weather, main, wind, rain, snow } = weatherData;
    
    // Check for dangerous conditions first
    if (
      (weather && weather.some(w => ['Thunderstorm', 'Hurricane', 'Tornado'].includes(w.main))) ||
      (wind && wind.speed > 30) ||
      (main && main.temp > 35) ||
      (main && main.temp < -5) ||
      (rain && rain['1h'] > 10) ||
      (snow && snow['1h'] > 5)
    ) {
      return 'dangerous';
    }
    
    // Check for difficult conditions
    if (
      (weather && weather.some(w => ['Rain', 'Snow', 'Fog'].includes(w.main))) ||
      (wind && wind.speed > 20) ||
      (main && (main.temp > 30 || main.temp < 0)) ||
      (rain && rain['1h'] > 5) ||
      (snow && snow['1h'] > 2)
    ) {
      return 'difficult';
    }
    
    // Check for moderate conditions
    if (
      (weather && weather.some(w => ['Clouds', 'Drizzle', 'Mist'].includes(w.main))) ||
      (wind && wind.speed > 10) ||
      (main && (main.temp > 25 || main.temp < 5)) ||
      (rain && rain['1h'] > 1) ||
      (main && main.humidity > 80)
    ) {
      return 'moderate';
    }
    
    // Default to good conditions
    return 'good';
  }
  
  /**
   * Provides equipment recommendations based on weather conditions
   * @param {Object} weatherData - Weather data for a specific location
   * @returns {Object} Recommendations categorized by type
   */
  getEquipmentRecommendations(weatherData) {
    if (!weatherData) return {
      clothing: [],
      accessories: [],
      bike: [],
      nutrition: [],
      safety: []
    };
    
    const { weather, main, wind, rain, snow } = weatherData;
    const condition = weather?.[0]?.main || '';
    const temp = main?.temp || 20;
    const windSpeed = wind?.speed || 0;
    const isRaining = rain && rain['1h'] > 0;
    const isSnowing = snow && snow['1h'] > 0;
    
    const recommendations = {
      clothing: [],
      accessories: [],
      bike: [],
      nutrition: [],
      safety: []
    };
    
    // Clothing recommendations based on temperature
    if (temp < 5) {
      recommendations.clothing.push('winterJacket', 'thermalBase', 'winterGloves', 'thermalTights');
      recommendations.accessories.push('winterCap', 'earWarmers', 'neckWarmer');
    } else if (temp < 10) {
      recommendations.clothing.push('longSleeveJersey', 'armWarmers', 'legWarmers', 'lightGloves');
      recommendations.accessories.push('windproofCap');
    } else if (temp < 15) {
      recommendations.clothing.push('longSleeveJersey', 'armWarmers', 'kneeWarmers');
    } else if (temp < 20) {
      recommendations.clothing.push('shortSleeveJersey', 'lightArmWarmers');
    } else if (temp < 25) {
      recommendations.clothing.push('shortSleeveJersey', 'lightweightSocks');
    } else if (temp < 30) {
      recommendations.clothing.push('lightweightJersey', 'lightweightSocks');
      recommendations.accessories.push('sunCap');
    } else {
      recommendations.clothing.push('lightweightJersey', 'lightweightSocks');
      recommendations.accessories.push('sunCap');
      recommendations.nutrition.push('extraHydration');
    }
    
    // Recommendations based on wind conditions
    if (windSpeed > 25) {
      recommendations.clothing.push('windproofJacket');
      recommendations.accessories.push('aeroHelmet');
      recommendations.bike.push('lowProfile');
    } else if (windSpeed > 15) {
      recommendations.clothing.push('windbreaker');
    }
    
    // Recommendations based on precipitation
    if (isRaining) {
      recommendations.clothing.push('waterproofJacket', 'waterproofGloves');
      recommendations.accessories.push('capWithVisor');
      recommendations.bike.push('fenders', 'wetTires');
      recommendations.safety.push('extraLights');
    }
    
    if (isSnowing) {
      recommendations.clothing.push('waterproofJacket', 'waterproofGloves', 'waterproofShoes');
      recommendations.bike.push('winterTires');
      recommendations.safety.push('extraLights', 'highVisibilityVest');
    }
    
    // Recommendations based on specific weather conditions
    switch(condition) {
      case 'Thunderstorm':
        recommendations.safety.push('seekShelter', 'avoidOpenAreas', 'alternatePlan');
        break;
      case 'Fog':
      case 'Mist':
        recommendations.safety.push('extraLights', 'highVisibilityVest', 'slowSpeed');
        break;
      case 'Clear':
        recommendations.accessories.push('sunglasses', 'sunscreen');
        if (temp > 25) recommendations.nutrition.push('extraHydration', 'electrolyteSupplements');
        break;
      default:
        break;
    }
    
    // Always recommend these items
    recommendations.safety.push('helmet', 'mobilePhone');
    recommendations.bike.push('spareTube', 'tirePump');
    recommendations.nutrition.push('water');
    
    return recommendations;
  }
}

export const weatherService = new WeatherService();
