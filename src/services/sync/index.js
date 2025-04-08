/**
 * Sync Service
 * Handles data synchronization for all services
 */

import { weatherService } from '../weather';
import { stravaService } from '../strava';
import { colsService } from '../cols';
import { monitoring } from '../monitoring';

export const syncService = {
  /**
   * Synchronize all data across services
   * @returns {Promise<Object>} Result of synchronization operation
   */
  async syncAllData() {
    try {
      monitoring.logApiCall('syncService', 'syncAllData', 'started');
      
      // Synchronisation des données météo
      const weatherResult = await weatherService.updateAllColsWeather();
      
      // Synchronisation des activités Strava
      const stravaResult = await stravaService.syncLatestActivities();
      
      // Mise à jour des données de cols
      const colsResult = await colsService.updateColsData();
      
      const result = {
        success: true,
        details: {
          weather: weatherResult,
          strava: stravaResult, 
          cols: colsResult
        },
        timestamp: new Date().toISOString()
      };
      
      monitoring.logApiCall('syncService', 'syncAllData', 'completed');
      return result;
    } catch (error) {
      monitoring.logApiCall('syncService', 'syncAllData', 'error');
      console.error('Sync error:', error);
      return { 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  },
  
  /**
   * Synchronize data for a specific service
   * @param {string} service - Service name to synchronize ('weather', 'strava', 'cols')
   * @returns {Promise<Object>} Result of the specific service synchronization
   */
  async syncService(service) {
    try {
      monitoring.logApiCall('syncService', `syncService/${service}`, 'started');
      
      let result;
      
      switch (service) {
        case 'weather':
          result = await weatherService.updateAllColsWeather();
          break;
        case 'strava':
          result = await stravaService.syncLatestActivities();
          break;
        case 'cols':
          result = await colsService.updateColsData();
          break;
        default:
          throw new Error(`Unknown service: ${service}`);
      }
      
      monitoring.logApiCall('syncService', `syncService/${service}`, 'completed');
      
      return {
        success: true,
        service,
        result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      monitoring.logApiCall('syncService', `syncService/${service}`, 'error');
      console.error(`Sync error for ${service}:`, error);
      
      return {
        success: false,
        service,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
};

export default syncService;
