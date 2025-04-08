/**
 * API Validation Utilities
 * Validates responses from various APIs to ensure data integrity
 */

/**
 * Collection of validation functions for API responses
 */
export const validateApiResponses = {
  /**
   * Validates weather API responses
   * @param {Object} response - Response from weather API
   * @returns {boolean} - true if valid, false otherwise
   */
  checkWeather(response) {
    // Check if response and data exist
    if (!response || !response.data) return false;
    
    // Check for successful status
    if (response.status !== 200) return false;
    
    // Verify basic weather data structure
    const data = response.data;
    return (
      data && 
      data.main && 
      typeof data.main.temp === 'number' &&
      typeof data.main.humidity === 'number' &&
      data.weather && 
      Array.isArray(data.weather)
    );
  },
  
  /**
   * Validates Strava API responses
   * @param {Object} response - Response from Strava API
   * @returns {boolean} - true if valid, false otherwise
   */
  checkStrava(response) {
    // Check if response exists
    if (!response) return false;
    
    // Check for successful status
    if (response.status !== 200) return false;
    
    // For activities endpoint, check if response data is an array
    if (Array.isArray(response.data)) {
      return true;
    }
    
    // For other endpoints, check if data exists
    return (
      response.data && 
      typeof response.data === 'object'
    );
  },
  
  /**
   * Validates Mapbox API responses
   * @param {Object} response - Response from Mapbox API
   * @returns {boolean} - true if valid, false otherwise
   */
  checkMapbox(response) {
    // Check if response exists
    if (!response) return false;
    
    // Check for successful status
    if (response.status !== 200) return false;
    
    // Verify features array for GeoJSON responses
    return (
      response.data && 
      response.data.features && 
      Array.isArray(response.data.features)
    );
  },
  
  /**
   * Validates OpenRoute API responses
   * @param {Object} response - Response from OpenRoute API
   * @returns {boolean} - true if valid, false otherwise
   */
  checkOpenRoute(response) {
    // Check if response exists
    if (!response) return false;
    
    // Check for successful status
    if (response.status !== 200) return false;
    
    // Verify route data
    return (
      response.data && 
      response.data.routes && 
      Array.isArray(response.data.routes) &&
      response.data.routes.length > 0
    );
  },
  
  /**
   * Generic validation for any API response
   * @param {Object} response - API response
   * @param {Object} options - Validation options
   * @returns {boolean} - true if valid, false otherwise
   */
  genericCheck(response, options = {}) {
    // Check if response exists
    if (!response) return false;
    
    // Check status (default to 200)
    const expectedStatus = options.expectedStatus || 200;
    if (response.status !== expectedStatus) return false;
    
    // Check required fields if specified
    if (options.requiredFields && Array.isArray(options.requiredFields)) {
      for (const field of options.requiredFields) {
        if (!response.data || response.data[field] === undefined) {
          return false;
        }
      }
    }
    
    return true;
  }
};

export default validateApiResponses;
