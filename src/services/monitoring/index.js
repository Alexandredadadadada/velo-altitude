/**
 * Monitoring Service
 * Handles API call logging, performance tracking and error logging
 */

const ENABLE_ANALYTICS = process.env.REACT_APP_ENABLE_ANALYTICS === 'true';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

export const monitoring = {
  /**
   * Log API call with service name, endpoint and status
   * @param {string} service - Service name (e.g., 'strava', 'weather')
   * @param {string} endpoint - API endpoint called
   * @param {string|number} status - HTTP status code or error message
   */
  logApiCall(service, endpoint, status) {
    if (ENABLE_ANALYTICS) {
      // Log to console in development
      console.log(`API Call: ${service} - ${endpoint} - Status: ${status}`);
      
      // Send to monitoring backend in production
      if (process.env.NODE_ENV === 'production') {
        this.sendToMonitoringSystem({
          type: 'api_call',
          service,
          endpoint,
          status,
          timestamp: new Date().toISOString()
        });
      }
    }
  },
  
  /**
   * Log performance metrics
   * @param {string} component - Component or service being measured
   * @param {string} action - Action being performed
   * @param {number} duration - Duration in milliseconds
   */
  logPerformance(component, action, duration) {
    if (ENABLE_ANALYTICS) {
      // Log to console in development
      console.log(`Performance: ${component} - ${action} - ${duration}ms`);
      
      // Send to monitoring backend in production
      if (process.env.NODE_ENV === 'production') {
        this.sendToMonitoringSystem({
          type: 'performance',
          component,
          action,
          duration,
          timestamp: new Date().toISOString()
        });
      }
    }
  },
  
  /**
   * Log error with details
   * @param {string} source - Error source (component/service name)
   * @param {string} message - Error message
   * @param {Object} details - Additional error details
   */
  logError(source, message, details = {}) {
    // Always log errors to console
    console.error(`Error: ${source} - ${message}`, details);
    
    if (ENABLE_ANALYTICS && process.env.NODE_ENV === 'production') {
      this.sendToMonitoringSystem({
        type: 'error',
        source,
        message,
        details,
        timestamp: new Date().toISOString()
      });
    }
  },
  
  /**
   * Send metrics to monitoring backend
   * @param {Object} data - Monitoring data to send
   * @returns {Promise<void>}
   * @private
   */
  async sendToMonitoringSystem(data) {
    try {
      await fetch(`${API_BASE_URL}/api/monitoring/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
    } catch (error) {
      // Log locally but don't throw to avoid monitoring errors affecting app
      console.error('Error sending to monitoring system:', error);
    }
  },
  
  /**
   * Get system health metrics
   * @returns {Promise<Object>} Health metrics for the application
   */
  async getHealthMetrics() {
    if (!ENABLE_ANALYTICS) {
      return { enabled: false };
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/monitoring/health`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching health metrics:', error);
      return { 
        error: 'Failed to fetch health metrics',
        timestamp: new Date().toISOString()
      };
    }
  }
};

// Standard API performance metrics for the application
export const apiMetrics = {
  responseTime: '< 300ms',
  successRate: '> 99%',
  dataFreshness: '< 5 minutes'
};

export default monitoring;
