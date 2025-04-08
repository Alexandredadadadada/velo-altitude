/**
 * API Check Utilities
 * Tests the availability and connectivity of various APIs used in the application
 */

import { weatherService } from '../services/weather';
import { stravaService } from '../services/strava';
import { colsService } from '../services/cols';
import { monitoring } from '../services/monitoring';

/**
 * Test the OpenWeather API connectivity
 * @returns {Promise<Object>} Status of the API
 */
async function testWeatherApi() {
  try {
    // Test with Paris coordinates
    const result = await weatherService.getColWeather(48.8566, 2.3522);
    return {
      status: 'available',
      detail: 'Connected to OpenWeather API',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    monitoring.logError('apiCheck', 'Weather API unavailable', error);
    return {
      status: 'unavailable',
      detail: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Test the Strava API connectivity
 * @returns {Promise<Object>} Status of the API
 */
async function testStravaApi() {
  try {
    // Just request a single activity to minimize data transfer
    const result = await stravaService.getAthleteActivities({ per_page: 1 });
    return {
      status: 'available',
      detail: 'Connected to Strava API',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    monitoring.logError('apiCheck', 'Strava API unavailable', error);
    return {
      status: 'unavailable',
      detail: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Test the Mapbox API connectivity
 * @returns {Promise<Object>} Status of the API
 */
async function testMapboxApi() {
  try {
    // Test with a sample col ID
    const result = await colsService.getColDetails('col-du-galibier');
    return {
      status: 'available',
      detail: 'Connected to Mapbox API',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    monitoring.logError('apiCheck', 'Mapbox API unavailable', error);
    return {
      status: 'unavailable',
      detail: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Test the OpenRoute API connectivity
 * @returns {Promise<Object>} Status of the API
 */
async function testOpenRouteApi() {
  try {
    // Test with two sample points
    const samplePoints = [
      { lat: 45.3052, lon: 6.5784 }, // Galibier
      { lat: 45.0036, lon: 6.3983 }  // Nearby point
    ];
    const result = await colsService.getRouteOptimization(samplePoints);
    return {
      status: 'available',
      detail: 'Connected to OpenRoute API',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    monitoring.logError('apiCheck', 'OpenRoute API unavailable', error);
    return {
      status: 'unavailable',
      detail: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Check the status of all APIs used in the application
 * @returns {Promise<Object>} Status of all APIs
 */
export async function checkApiStatus() {
  monitoring.logApiCall('apiCheck', 'checkApiStatus', 'started');
  
  const checks = {
    weather: await testWeatherApi(),
    strava: await testStravaApi(),
    mapbox: await testMapboxApi(),
    openroute: await testOpenRouteApi()
  };
  
  // Calculate overall status
  const allAvailable = Object.values(checks).every(check => check.status === 'available');
  checks.overall = {
    status: allAvailable ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString()
  };
  
  monitoring.logApiCall('apiCheck', 'checkApiStatus', 'completed');
  return checks;
}

export {
  testWeatherApi,
  testStravaApi,
  testMapboxApi,
  testOpenRouteApi
};
