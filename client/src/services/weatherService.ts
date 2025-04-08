/**
 * Service pour la gestion des données météorologiques
 * Utilise RealApiOrchestrator pour les opérations de données
 */

import RealApiOrchestrator from './api/RealApiOrchestrator';

/**
 * Interface pour les conditions météo actuelles
 */
export interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  precipitation: number;
  condition: string;
  icon: string;
  timestamp: string;
}

/**
 * Interface pour les prévisions horaires
 */
export interface HourlyForecast {
  temperature: number;
  precipitation: number;
  windSpeed: number;
  condition: string;
  icon: string;
  timestamp: string;
}

/**
 * Interface pour les prévisions quotidiennes
 */
export interface DailyForecast {
  date: string;
  temperatureMax: number;
  temperatureMin: number;
  precipitation: number;
  windSpeed: number;
  condition: string;
  icon: string;
}

/**
 * Interface pour les prévisions météo d'une localisation
 */
export interface LocationForecast {
  location: {
    name: string;
    region: string;
    country: string;
    lat: number;
    lng: number;
    elevation: number;
  };
  current: CurrentWeather;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  lastUpdated: string;
}

/**
 * Service pour la gestion des données météorologiques
 */
class WeatherService {
  /**
   * Récupère les données météo pour un col
   * @param colId ID du col
   * @returns Données météo pour le col
   */
  async getColWeather(colId: string): Promise<CurrentWeather> {
    try {
      const weatherData = await RealApiOrchestrator.getColWeather(colId);
      return this.mapToCurrentWeather(weatherData);
    } catch (error) {
      console.error(`[WeatherService] Error fetching weather for col ${colId}:`, error);
      throw error;
    }
  }

  /**
   * Récupère les données météo pour une localisation
   * @param lat Latitude
   * @param lng Longitude
   * @returns Données météo pour la localisation
   */
  async getLocationWeather(lat: number, lng: number): Promise<CurrentWeather> {
    try {
      const weatherData = await RealApiOrchestrator.getLocationWeather(lat, lng);
      return this.mapToCurrentWeather(weatherData);
    } catch (error) {
      console.error(`[WeatherService] Error fetching weather for location (${lat}, ${lng}):`, error);
      throw error;
    }
  }

  /**
   * Récupère les prévisions météo pour un col
   * @param colId ID du col
   * @param days Nombre de jours de prévision (1-7)
   * @returns Prévisions météo pour le col
   */
  async getWeatherForecast(colId: string, days: number = 5): Promise<LocationForecast> {
    try {
      const forecastData = await RealApiOrchestrator.getWeatherForecast(colId, days);
      return this.mapToLocationForecast(forecastData, days);
    } catch (error) {
      console.error(`[WeatherService] Error fetching forecast for col ${colId}:`, error);
      throw error;
    }
  }

  /**
   * Récupère les prévisions horaires pour un col
   * @param colId ID du col
   * @param hours Nombre d'heures de prévision (1-48)
   * @returns Prévisions horaires pour le col
   */
  async getHourlyForecast(colId: string, hours: number = 24): Promise<HourlyForecast[]> {
    try {
      const forecast = await this.getWeatherForecast(colId, 2);
      // Extraire les prévisions horaires des données complètes
      return forecast.hourly.slice(0, hours);
    } catch (error) {
      console.error(`[WeatherService] Error fetching hourly forecast for col ${colId}:`, error);
      throw error;
    }
  }

  /**
   * Récupère les prévisions quotidiennes pour un col
   * @param colId ID du col
   * @param days Nombre de jours de prévision (1-7)
   * @returns Prévisions quotidiennes pour le col
   */
  async getDailyForecast(colId: string, days: number = 5): Promise<DailyForecast[]> {
    try {
      const forecast = await this.getWeatherForecast(colId, days);
      // Extraire les prévisions quotidiennes des données complètes
      return forecast.daily.slice(0, days);
    } catch (error) {
      console.error(`[WeatherService] Error fetching daily forecast for col ${colId}:`, error);
      throw error;
    }
  }

  /**
   * Vérifie si les conditions météo sont favorables pour un col
   * @param colId ID du col
   * @returns true si les conditions sont favorables
   */
  async isWeatherFavorable(colId: string): Promise<boolean> {
    try {
      const weather = await this.getColWeather(colId);
      
      // Critères pour des conditions favorables
      const isFavorable = 
        weather.temperature > 5 && // Température > 5°C
        weather.temperature < 30 && // Température < 30°C
        weather.windSpeed < 30 && // Vent < 30 km/h
        weather.precipitation < 1 && // Précipitations < 1 mm
        !['thunderstorm', 'snow', 'sleet', 'hail'].includes(weather.condition.toLowerCase());
      
      return isFavorable;
    } catch (error) {
      console.error(`[WeatherService] Error checking weather favorability for col ${colId}:`, error);
      throw error;
    }
  }

  /**
   * Convertit les données brutes en objet CurrentWeather
   * @param data Données brutes
   * @returns Objet CurrentWeather formaté
   */
  private mapToCurrentWeather(data: any): CurrentWeather {
    return {
      temperature: data.temperature || 0,
      feelsLike: data.feelsLike || data.temperature || 0,
      humidity: data.humidity || 0,
      windSpeed: data.windSpeed || 0,
      windDirection: data.windDirection || 0,
      precipitation: data.precipitation || 0,
      condition: data.condition || 'unknown',
      icon: data.icon || 'default',
      timestamp: data.timestamp || new Date().toISOString()
    };
  }

  /**
   * Convertit les données brutes en objet LocationForecast
   * @param data Données brutes
   * @param days Nombre de jours
   * @returns Objet LocationForecast formaté
   */
  private mapToLocationForecast(data: any, days: number): LocationForecast {
    // Créer un objet LocationForecast à partir des données brutes
    return {
      location: {
        name: data.location?.name || '',
        region: data.location?.region || '',
        country: data.location?.country || '',
        lat: data.location?.lat || 0,
        lng: data.location?.lng || 0,
        elevation: data.location?.elevation || 0
      },
      current: this.mapToCurrentWeather(data.current || {}),
      hourly: Array.isArray(data.hourly) ? data.hourly.map(this.mapToHourlyForecast) : [],
      daily: Array.isArray(data.daily) ? data.daily.map(this.mapToDailyForecast) : [],
      lastUpdated: data.lastUpdated || new Date().toISOString()
    };
  }

  /**
   * Convertit les données brutes en objet HourlyForecast
   * @param data Données brutes
   * @returns Objet HourlyForecast formaté
   */
  private mapToHourlyForecast(data: any): HourlyForecast {
    return {
      temperature: data.temperature || 0,
      precipitation: data.precipitation || 0,
      windSpeed: data.windSpeed || 0,
      condition: data.condition || 'unknown',
      icon: data.icon || 'default',
      timestamp: data.timestamp || new Date().toISOString()
    };
  }

  /**
   * Convertit les données brutes en objet DailyForecast
   * @param data Données brutes
   * @returns Objet DailyForecast formaté
   */
  private mapToDailyForecast(data: any): DailyForecast {
    return {
      date: data.date || new Date().toISOString().split('T')[0],
      temperatureMax: data.temperatureMax || 0,
      temperatureMin: data.temperatureMin || 0,
      precipitation: data.precipitation || 0,
      windSpeed: data.windSpeed || 0,
      condition: data.condition || 'unknown',
      icon: data.icon || 'default'
    };
  }
}

// Créer une instance et l'exporter
const weatherService = new WeatherService();
export default weatherService;
