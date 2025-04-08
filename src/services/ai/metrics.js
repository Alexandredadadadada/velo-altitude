/**
 * AI Chatbox Metrics Service
 * Tracks and reports performance metrics for the AI chatbox
 */

import { monitoringService } from '../../services/monitoring';

/**
 * Metrics collection and reporting for AI chatbox performance
 */
export const chatMetrics = {
  // Performance metrics storage
  performance: {
    responseTime: [], // Response times (ms)
    messageSize: [], // Size of messages (chars)
    cacheHits: 0, // Number of cache hits
    contextUpdates: 0, // Number of context refreshes
    tokenUsage: [], // API token usage per request
    requests: {
      success: 0,
      error: 0,
      total: 0
    },
    userInteractions: {
      messages: 0,
      suggestions: 0,
      commands: 0
    }
  },
  
  /**
   * Initialize metrics collection
   */
  initialize() {
    this.startTime = Date.now();
    this.lastReportTime = this.startTime;
    
    // Set up periodic reporting if monitoring service is available
    if (monitoringService && monitoringService.isEnabled) {
      this.reportingInterval = setInterval(() => {
        this.reportMetrics();
      }, 10 * 60 * 1000); // Report every 10 minutes
    }
    
    console.log('AI Chatbox metrics initialized');
    return this;
  },
  
  /**
   * Track a message send operation
   * @param {Object} params - Tracking parameters
   * @param {string} params.message - User message
   * @param {boolean} params.fromCache - Whether response came from cache
   * @param {number} params.startTime - Request start timestamp
   * @param {number} params.endTime - Request end timestamp
   * @param {Object} params.tokenUsage - Token usage data if available
   */
  trackMessage(params) {
    const { 
      message, 
      fromCache = false, 
      startTime, 
      endTime,
      tokenUsage = null
    } = params;
    
    // Calculate response time
    if (startTime && endTime) {
      const responseTime = endTime - startTime;
      this.performance.responseTime.push(responseTime);
      
      // Keep only the last 100 response times
      if (this.performance.responseTime.length > 100) {
        this.performance.responseTime.shift();
      }
    }
    
    // Track message size
    if (message) {
      this.performance.messageSize.push(message.length);
      
      // Keep only the last 100 message sizes
      if (this.performance.messageSize.length > 100) {
        this.performance.messageSize.shift();
      }
    }
    
    // Update cache hits
    if (fromCache) {
      this.performance.cacheHits++;
    }
    
    // Track token usage
    if (tokenUsage) {
      this.performance.tokenUsage.push(tokenUsage);
      
      // Keep only the last 100 token usages
      if (this.performance.tokenUsage.length > 100) {
        this.performance.tokenUsage.shift();
      }
    }
    
    // Update request counts
    this.performance.requests.total++;
    this.performance.requests.success++;
    
    // Track user interaction
    this.performance.userInteractions.messages++;
  },
  
  /**
   * Track an error that occurred during message processing
   * @param {Error} error - The error that occurred
   * @param {string} context - Error context
   */
  trackError(error, context = 'unknown') {
    // Update error count
    this.performance.requests.error++;
    this.performance.requests.total++;
    
    // Log to monitoring service if available
    if (monitoringService && monitoringService.logError) {
      monitoringService.logError('ai_chatbox', error, { context });
    } else {
      console.error(`AI Chatbox error (${context}):`, error);
    }
  },
  
  /**
   * Track a context update operation
   */
  trackContextUpdate() {
    this.performance.contextUpdates++;
  },
  
  /**
   * Track user interaction with suggested queries
   */
  trackSuggestionUse() {
    this.performance.userInteractions.suggestions++;
  },
  
  /**
   * Track special command usage
   * @param {string} command - The command used
   */
  trackCommand(command) {
    this.performance.userInteractions.commands++;
  },
  
  /**
   * Get average response time from collected metrics
   * @returns {number} - Average response time in ms
   */
  getAverageResponseTime() {
    if (this.performance.responseTime.length === 0) {
      return 0;
    }
    
    const sum = this.performance.responseTime.reduce((a, b) => a + b, 0);
    return sum / this.performance.responseTime.length;
  },
  
  /**
   * Get cache hit rate from collected metrics
   * @returns {number} - Cache hit rate (0-1)
   */
  getCacheHitRate() {
    return this.performance.requests.total === 0
      ? 0
      : this.performance.cacheHits / this.performance.requests.total;
  },
  
  /**
   * Collect all metrics for reporting
   * @returns {Object} - Collected metrics
   */
  async collectMetrics() {
    return {
      uptime: Date.now() - this.startTime,
      performance: {
        averageResponseTime: this.getAverageResponseTime(),
        cacheHitRate: this.getCacheHitRate(),
        contextUpdates: this.performance.contextUpdates,
        requestCounts: this.performance.requests,
        userInteractions: this.performance.userInteractions
      },
      tokenUsage: this.performance.tokenUsage.length > 0
        ? {
            total: this.performance.tokenUsage.reduce((sum, usage) => sum + usage.total, 0),
            average: this.performance.tokenUsage.reduce((sum, usage) => sum + usage.total, 0) / this.performance.tokenUsage.length
          }
        : { total: 0, average: 0 }
    };
  },
  
  /**
   * Generate a performance report
   * @returns {string} - Performance report
   */
  async generateReport() {
    const metrics = await this.collectMetrics();
    
    return `
# AI Chatbox Performance Report
Generated: ${new Date().toISOString()}
Uptime: ${Math.floor(metrics.uptime / (1000 * 60 * 60))} hours

## Performance Metrics
- Average Response Time: ${metrics.performance.averageResponseTime.toFixed(2)} ms
- Cache Hit Rate: ${(metrics.performance.cacheHitRate * 100).toFixed(2)}%
- Context Updates: ${metrics.performance.contextUpdates}

## Request Statistics
- Total Requests: ${metrics.performance.requestCounts.total}
- Successful: ${metrics.performance.requestCounts.success}
- Errors: ${metrics.performance.requestCounts.error}
- Success Rate: ${((metrics.performance.requestCounts.success / metrics.performance.requestCounts.total) * 100).toFixed(2)}%

## User Interactions
- Messages Sent: ${metrics.performance.userInteractions.messages}
- Suggestions Used: ${metrics.performance.userInteractions.suggestions}
- Commands Used: ${metrics.performance.userInteractions.commands}

## Token Usage
- Total Tokens: ${metrics.tokenUsage.total}
- Average Per Request: ${metrics.tokenUsage.average.toFixed(2)}
`;
  },
  
  /**
   * Report metrics to monitoring service
   */
  async reportMetrics() {
    const metrics = await this.collectMetrics();
    
    // Report to monitoring service if available
    if (monitoringService && monitoringService.logMetrics) {
      monitoringService.logMetrics('ai_chatbox', metrics);
    }
    
    // Update last report time
    this.lastReportTime = Date.now();
  },
  
  /**
   * Clean up resources
   */
  cleanup() {
    if (this.reportingInterval) {
      clearInterval(this.reportingInterval);
    }
  }
};

// Initialize metrics on import
export default chatMetrics.initialize();
