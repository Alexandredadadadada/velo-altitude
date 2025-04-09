/**
 * API Metrics Monitoring Service
 * 
 * Specialized service for tracking API usage metrics, response times, fallback rates,
 * and error counts per service. Provides alert thresholds for rate limiting and fallback failures.
 */

import monitoringService from './index';

export interface APIMetricThresholds {
  rateLimitWarning: number;      // Percentage of rate limit remaining to trigger warning
  fallbackRateWarning: number;   // Percentage of calls using fallback to trigger warning
  responseTimeWarning: number;   // Response time threshold in ms to trigger warning
  errorRateWarning: number;      // Error rate percentage to trigger warning
}

export interface APIServiceConfig {
  name: string;                  // API service name (e.g., 'openweather', 'windy')
  isPrimary: boolean;            // Whether this is a primary service or fallback
  thresholds?: Partial<APIMetricThresholds>; // Custom thresholds for this service
}

class APIMetricsService {
  private readonly DEFAULT_THRESHOLDS: APIMetricThresholds = {
    rateLimitWarning: 20,        // Warn when only 20% of rate limit remains
    fallbackRateWarning: 30,     // Warn when fallback usage exceeds 30%
    responseTimeWarning: 500,    // Warn on response times over 500ms
    errorRateWarning: 5          // Warn when error rate exceeds 5%
  };

  private apiConfigs: Map<string, APIServiceConfig> = new Map();
  private apiThresholds: Map<string, APIMetricThresholds> = new Map();
  
  // Sliding window metrics (last hour)
  private apiCalls: Map<string, any[]> = new Map();
  private readonly METRICS_WINDOW_MS = 60 * 60 * 1000; // 1 hour
  
  constructor() {
    // Configure core weather services
    this.registerAPIService({
      name: 'openweather',
      isPrimary: true,
      thresholds: {
        rateLimitWarning: 15,    // OpenWeather has stricter rate limit concerns
        responseTimeWarning: 800
      }
    });
    
    this.registerAPIService({
      name: 'windy',
      isPrimary: false,
      thresholds: {
        responseTimeWarning: 1000 // Windy can be a bit slower
      }
    });
    
    // Configure map services
    this.registerAPIService({
      name: 'mapbox',
      isPrimary: true
    });
    
    this.registerAPIService({
      name: 'openroute',
      isPrimary: true
    });
    
    // Configure AI services
    this.registerAPIService({
      name: 'claude',
      isPrimary: true,
      thresholds: {
        responseTimeWarning: 2000 // AI services can take longer
      }
    });
    
    this.registerAPIService({
      name: 'openai',
      isPrimary: false,
      thresholds: {
        responseTimeWarning: 2000
      }
    });
    
    // Start periodic metrics aggregation
    setInterval(() => this.cleanupOldMetrics(), 5 * 60 * 1000); // Every 5 minutes
  }
  
  /**
   * Register an API service for monitoring
   */
  public registerAPIService(config: APIServiceConfig): void {
    this.apiConfigs.set(config.name, config);
    
    // Set thresholds for this service
    const thresholds = {
      ...this.DEFAULT_THRESHOLDS,
      ...(config.thresholds || {})
    };
    
    this.apiThresholds.set(config.name, thresholds);
    this.apiCalls.set(config.name, []);
  }
  
  /**
   * Track an API call with detailed metrics
   */
  public trackAPICall(
    service: string,
    endpoint: string,
    responseTime: number,
    success: boolean,
    metadata: Record<string, any> = {}
  ): void {
    // First, use the core monitoring service
    monitoringService.trackApiCall(service, endpoint, responseTime, success, metadata);
    
    // Then, track in our specialized service
    const calls = this.apiCalls.get(service) || [];
    calls.push({
      timestamp: Date.now(),
      endpoint,
      responseTime,
      success,
      fallback: !!metadata.fallback,
      ...metadata
    });
    
    this.apiCalls.set(service, calls);
    
    // Check if any thresholds are exceeded
    this.checkThresholds(service);
  }
  
  /**
   * Track when a fallback service is used
   */
  public trackFallbackUsage(
    primaryService: string,
    fallbackService: string,
    reason: string,
    metadata: Record<string, any> = {}
  ): void {
    monitoringService.trackEvent('api_fallback', {
      primaryService,
      fallbackService,
      reason,
      ...metadata
    });
    
    // Calculate and track fallback rate
    const fallbackRate = this.calculateFallbackRate(primaryService);
    monitoringService.trackMetric('fallback_rate', fallbackRate, {
      primaryService,
      fallbackService
    });
  }
  
  /**
   * Track rate limit status for an API
   */
  public trackRateLimit(
    service: string,
    limit: number,
    remaining: number,
    resetTime?: number
  ): void {
    monitoringService.trackRateLimit(service, limit, remaining, remaining <= 0);
    
    // Calculate remaining percentage
    const remainingPercentage = (remaining / limit) * 100;
    
    // Check if we're approaching the limit
    const threshold = this.apiThresholds.get(service)?.rateLimitWarning || 
                     this.DEFAULT_THRESHOLDS.rateLimitWarning;
    
    if (remainingPercentage <= threshold) {
      monitoringService.trackEvent('rate_limit_warning', {
        service,
        remainingPercentage,
        limit,
        remaining,
        resetTime
      });
      
      // Update service health
      monitoringService.updateHealthCheck({
        service,
        status: remainingPercentage <= 5 ? 'degraded' : 'healthy',
        lastChecked: Date.now(),
        message: `Rate limit at ${remaining}/${limit} (${remainingPercentage.toFixed(1)}% remaining)`
      });
    }
  }
  
  /**
   * Track API errors with additional metadata
   */
  public trackAPIError(
    service: string,
    endpoint: string,
    error: Error,
    metadata: Record<string, any> = {}
  ): void {
    monitoringService.trackError(
      `API Error for ${service} (${endpoint})`, 
      error,
      { service, endpoint, ...metadata }
    );
    
    // Track error count
    monitoringService.trackMetric('api_error_count', 1, {
      service,
      endpoint,
      errorType: error.name,
      errorCode: (error as any).code || 'unknown'
    });
    
    // Calculate the error rate
    const errorRate = this.calculateErrorRate(service);
    monitoringService.trackMetric('api_error_rate', errorRate, { service });
    
    // Check if error rate exceeds threshold
    const threshold = this.apiThresholds.get(service)?.errorRateWarning || 
                     this.DEFAULT_THRESHOLDS.errorRateWarning;
    
    if (errorRate >= threshold) {
      monitoringService.trackEvent('error_rate_warning', {
        service,
        errorRate,
        threshold
      });
      
      // Update service health
      monitoringService.updateHealthCheck({
        service,
        status: errorRate >= threshold * 2 ? 'unhealthy' : 'degraded',
        lastChecked: Date.now(),
        message: `Error rate is ${errorRate.toFixed(1)}% (threshold: ${threshold}%)`
      });
    }
  }
  
  /**
   * Get API usage metrics for a specific service
   */
  public getAPIMetrics(service: string): any {
    const calls = this.apiCalls.get(service) || [];
    const recent = calls.filter(c => c.timestamp > Date.now() - this.METRICS_WINDOW_MS);
    
    // Skip if there are no calls
    if (recent.length === 0) {
      return {
        totalCalls: 0,
        averageResponseTime: 0,
        successRate: 100,
        errorRate: 0,
        fallbackRate: 0
      };
    }
    
    // Calculate metrics
    const totalCalls = recent.length;
    const successfulCalls = recent.filter(c => c.success).length;
    const fallbackCalls = recent.filter(c => c.fallback).length;
    const averageResponseTime = recent.reduce((sum, c) => sum + c.responseTime, 0) / totalCalls;
    
    return {
      totalCalls,
      averageResponseTime,
      successRate: (successfulCalls / totalCalls) * 100,
      errorRate: ((totalCalls - successfulCalls) / totalCalls) * 100,
      fallbackRate: (fallbackCalls / totalCalls) * 100
    };
  }
  
  /**
   * Get a dashboard of all API metrics
   */
  public getDashboard(): Record<string, any> {
    const dashboard: Record<string, any> = {};
    
    for (const service of this.apiConfigs.keys()) {
      dashboard[service] = this.getAPIMetrics(service);
    }
    
    return dashboard;
  }
  
  /**
   * Check if any thresholds are exceeded and trigger alerts
   */
  private checkThresholds(service: string): void {
    const metrics = this.getAPIMetrics(service);
    const thresholds = this.apiThresholds.get(service) || this.DEFAULT_THRESHOLDS;
    const config = this.apiConfigs.get(service);
    
    if (!config) return;
    
    // Check response time threshold
    if (metrics.averageResponseTime > thresholds.responseTimeWarning) {
      monitoringService.trackEvent('response_time_warning', {
        service,
        averageResponseTime: metrics.averageResponseTime,
        threshold: thresholds.responseTimeWarning
      });
    }
    
    // For fallback services, no need to check fallback rate
    if (!config.isPrimary) return;
    
    // Check fallback rate threshold
    if (metrics.fallbackRate > thresholds.fallbackRateWarning) {
      monitoringService.trackEvent('fallback_rate_warning', {
        service,
        fallbackRate: metrics.fallbackRate,
        threshold: thresholds.fallbackRateWarning
      });
      
      // Update service health
      if (metrics.fallbackRate > thresholds.fallbackRateWarning * 2) {
        monitoringService.updateHealthCheck({
          service,
          status: 'degraded',
          lastChecked: Date.now(),
          message: `High fallback rate: ${metrics.fallbackRate.toFixed(1)}%`
        });
      }
    }
  }
  
  /**
   * Calculate the current fallback rate for a primary service
   */
  private calculateFallbackRate(service: string): number {
    const calls = this.apiCalls.get(service) || [];
    const recent = calls.filter(c => c.timestamp > Date.now() - this.METRICS_WINDOW_MS);
    
    if (recent.length === 0) return 0;
    
    const fallbackCalls = recent.filter(c => c.fallback).length;
    return (fallbackCalls / recent.length) * 100;
  }
  
  /**
   * Calculate the current error rate for a service
   */
  private calculateErrorRate(service: string): number {
    const calls = this.apiCalls.get(service) || [];
    const recent = calls.filter(c => c.timestamp > Date.now() - this.METRICS_WINDOW_MS);
    
    if (recent.length === 0) return 0;
    
    const errorCalls = recent.filter(c => !c.success).length;
    return (errorCalls / recent.length) * 100;
  }
  
  /**
   * Clean up metrics older than the tracking window
   */
  private cleanupOldMetrics(): void {
    const cutoff = Date.now() - this.METRICS_WINDOW_MS;
    
    for (const [service, calls] of this.apiCalls.entries()) {
      const recent = calls.filter(c => c.timestamp >= cutoff);
      this.apiCalls.set(service, recent);
    }
  }
}

// Export singleton instance
const apiMetricsService = new APIMetricsService();
export default apiMetricsService;
