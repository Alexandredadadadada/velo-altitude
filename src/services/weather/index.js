/**
 * Weather Service
 * Handles weather data retrieval for cycling routes and cols
 */

import { ENV } from '../../config/environment';
import { monitoring } from '../monitoring';

const weatherKey = ENV.weather.openWeatherKey;
const windyKey = ENV.apiKeys.windy;
const API_BASE_URL = ENV.app.apiUrl || '';

export const weatherService = {
  /**
   * Get current weather conditions for a specific col
   * @param {number} lat - Latitude of the col
   * @param {number} lon - Longitude of the col
   * @returns {Promise<Object>} - Weather data for the specified location
   */
  async getColWeather(lat, lon) {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${weatherKey}`
      );
      
      const data = await response.json();
      monitoring.logApiCall('openweather', `getColWeather/${lat},${lon}`, response.status);
      
      return data;
    } catch (error) {
      monitoring.logApiCall('openweather', `getColWeather/${lat},${lon}`, 'error');
      console.error('Error fetching weather data:', error);
      throw error;
    }
  },

  /**
   * Get forecast weather for a specific col
   * @param {number} lat - Latitude of the col
   * @param {number} lon - Longitude of the col
   * @returns {Promise<Object>} - Weather forecast data
   */
  async getColForecast(lat, lon) {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${weatherKey}`
      );
      
      const data = await response.json();
      monitoring.logApiCall('openweather', `getColForecast/${lat},${lon}`, response.status);
      
      return data;
    } catch (error) {
      monitoring.logApiCall('openweather', `getColForecast/${lat},${lon}`, 'error');
      console.error('Error fetching weather forecast:', error);
      throw error;
    }
  },

  /**
   * Integrates Windy.com widget into the specified DOM element
   * @param {HTMLElement} element - DOM element to render the Windy map
   * @param {Object} options - Configuration options for the Windy widget
   */
  async getWindyMap(element, options = {}) {
    try {
      if (!window.windyInit) {
        console.error('Windy API not loaded');
        return;
      }
      
      // Configure Windy widget
      const defaultOptions = {
        key: windyKey,
        lat: options.lat || 45.8,
        lon: options.lon || 6.5,
        zoom: options.zoom || 8,
        timestamp: options.timestamp || Math.round(new Date().getTime() / 1000),
        hourFormat: '24h',
        showMenu: false
      };
      
      // Initialize Windy API
      window.windyInit(defaultOptions, windyAPI => {
        const { map } = windyAPI;
        // Add map controls or additional features here
        monitoring.logApiCall('windy', 'getWindyMap', 'success');
      });
    } catch (error) {
      monitoring.logApiCall('windy', 'getWindyMap', 'error');
      console.error('Error initializing Windy map:', error);
      throw error;
    }
  },
  
  /**
   * Update weather data for all cols in the database
   * @returns {Promise<Object>} - Result of the update operation
   */
  async updateAllColsWeather() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/weather/update-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      monitoring.logApiCall('weatherService', 'updateAllColsWeather', response.status);
      
      return data;
    } catch (error) {
      monitoring.logApiCall('weatherService', 'updateAllColsWeather', 'error');
      console.error('Error updating weather for all cols:', error);
      throw error;
    }
  }
};

export default weatherService;
