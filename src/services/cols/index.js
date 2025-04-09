/**
 * Cols and Routes Service
 * Handles col details and route optimization using Mapbox and OpenRoute APIs
 */

import { ENV } from '../../config/environment';
import { monitoring } from '../monitoring';

const mapboxToken = ENV.maps.mapboxToken;
const openRouteKey = ENV.apiKeys.openroute;
const API_BASE_URL = ENV.app.apiUrl || '';

export const colsService = {
  /**
   * Get detailed information about a specific col
   * @param {string} colId - The unique identifier of the col
   * @returns {Promise<Object>} - The col details response 
   */
  async getColDetails(colId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cols/${colId}`, {
        headers: {
          Authorization: `Bearer ${mapboxToken}`
        }
      });
      
      const data = await response.json();
      monitoring.logApiCall('mapbox', `getColDetails/${colId}`, response.status);
      
      return data;
    } catch (error) {
      monitoring.logApiCall('mapbox', `getColDetails/${colId}`, 'error');
      console.error('Error fetching col details:', error);
      throw error;
    }
  },

  /**
   * Get optimized route based on provided points
   * @param {Array<Object>} points - Array of points with lat/lon coordinates
   * @returns {Promise<Object>} - The optimized route response
   */
  async getRouteOptimization(points) {
    try {
      const response = await fetch(`https://api.openrouteservice.org/v2/directions/cycling-road`, {
        method: 'POST',
        headers: {
          'Authorization': openRouteKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          coordinates: points.map(p => [p.lon, p.lat]),
          preference: 'recommended',
          units: 'km',
          language: 'fr'
        })
      });
      
      const data = await response.json();
      monitoring.logApiCall('openroute', 'getRouteOptimization', response.status);
      
      return data;
    } catch (error) {
      monitoring.logApiCall('openroute', 'getRouteOptimization', 'error');
      console.error('Error optimizing route:', error);
      throw error;
    }
  },
  
  /**
   * Update all cols data from the backend
   * @returns {Promise<Object>} - Status of the update operation
   */
  async updateColsData() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cols/update`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mapboxToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      monitoring.logApiCall('colsService', 'updateColsData', response.status);
      
      return data;
    } catch (error) {
      monitoring.logApiCall('colsService', 'updateColsData', 'error');
      console.error('Error updating cols data:', error);
      throw error;
    }
  }
};

export default colsService;
