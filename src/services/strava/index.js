/**
 * Strava Service
 * Handles Strava API integration for athlete activities and segments
 */

const stravaConfig = {
  clientId: process.env.REACT_APP_STRAVA_CLIENT_ID,
  clientSecret: process.env.REACT_APP_STRAVA_CLIENT_SECRET,
  accessToken: process.env.REACT_APP_STRAVA_ACCESS_TOKEN,
  refreshToken: process.env.REACT_APP_STRAVA_REFRESH_TOKEN
};

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

import { monitoring } from '../monitoring';

export const stravaService = {
  /**
   * Get activities for the authenticated athlete
   * @param {Object} options - Query parameters
   * @returns {Promise<Array>} - List of athlete activities
   */
  async getAthleteActivities(options = { page: 1, per_page: 30 }) {
    try {
      const queryParams = new URLSearchParams(options).toString();
      const response = await fetch(`https://www.strava.com/api/v3/athlete/activities?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${stravaConfig.accessToken}`
        }
      });
      
      // Handle token refresh if needed
      if (response.status === 401) {
        await this.refreshAccessToken();
        return this.getAthleteActivities(options);
      }
      
      const data = await response.json();
      monitoring.logApiCall('strava', 'getAthleteActivities', response.status);
      
      return data;
    } catch (error) {
      monitoring.logApiCall('strava', 'getAthleteActivities', 'error');
      console.error('Error fetching athlete activities:', error);
      throw error;
    }
  },

  /**
   * Get details for a specific Strava segment
   * @param {string} segmentId - ID of the segment to retrieve
   * @returns {Promise<Object>} - Segment details
   */
  async getSegment(segmentId) {
    try {
      const response = await fetch(`https://www.strava.com/api/v3/segments/${segmentId}`, {
        headers: {
          Authorization: `Bearer ${stravaConfig.accessToken}`
        }
      });
      
      // Handle token refresh if needed
      if (response.status === 401) {
        await this.refreshAccessToken();
        return this.getSegment(segmentId);
      }
      
      const data = await response.json();
      monitoring.logApiCall('strava', `getSegment/${segmentId}`, response.status);
      
      return data;
    } catch (error) {
      monitoring.logApiCall('strava', `getSegment/${segmentId}`, 'error');
      console.error(`Error fetching segment ${segmentId}:`, error);
      throw error;
    }
  },
  
  /**
   * Synchronize latest Strava activities with the application database
   * @returns {Promise<Object>} - Result of the sync operation
   */
  async syncLatestActivities() {
    try {
      // First, get latest activities from Strava
      const activities = await this.getAthleteActivities({ per_page: 50 });
      
      // Then sync with our backend
      const response = await fetch(`${API_BASE_URL}/api/strava/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${stravaConfig.accessToken}`
        },
        body: JSON.stringify({ activities })
      });
      
      const data = await response.json();
      monitoring.logApiCall('strava', 'syncLatestActivities', response.status);
      
      return data;
    } catch (error) {
      monitoring.logApiCall('strava', 'syncLatestActivities', 'error');
      console.error('Error syncing Strava activities:', error);
      throw error;
    }
  },
  
  /**
   * Refresh the Strava access token using the refresh token
   * @returns {Promise<Object>} - New token data
   */
  async refreshAccessToken() {
    try {
      const response = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: stravaConfig.clientId,
          client_secret: stravaConfig.clientSecret,
          refresh_token: stravaConfig.refreshToken,
          grant_type: 'refresh_token'
        })
      });
      
      const tokenData = await response.json();
      
      // Update the current access token in memory
      stravaConfig.accessToken = tokenData.access_token;
      
      // In a real app, you would store this token securely
      // This is simplified for the example
      monitoring.logApiCall('strava', 'refreshAccessToken', response.status);
      
      return tokenData;
    } catch (error) {
      monitoring.logApiCall('strava', 'refreshAccessToken', 'error');
      console.error('Error refreshing Strava token:', error);
      throw error;
    }
  }
};

export default stravaService;
