/**
 * Monitoring Service
 * 
 * Provides real-time performance tracking, error logging, and system metrics collection
 * for the Velo-Altitude application.
 */

import { EventEmitter } from 'events';

export interface MetricEvent {
  name: string;
  value: number | string | boolean;
  tags?: Record<string, string>;
  timestamp?: number;
}

export interface ErrorEvent {
  message: string;
  stack?: string;
  code?: string;
  service?: string;
  metadata?: Record<string, any>;
  timestamp?: number;
}

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  lastChecked: number;
  message?: string;
}

class MonitoringService extends EventEmitter {
  private metrics: Map<string, any[]> = new Map();
  private errors: ErrorEvent[] = [];
  private healthChecks: Map<string, HealthCheckResult> = new Map();
  private readonly MAX_METRICS_PER_KEY = 1000;
  private readonly MAX_ERRORS = 100;

  constructor() {
    super();
    // Set up event listeners
    this.on('metric', this.recordMetric.bind(this));
    this.on('error', this.recordError.bind(this));
    this.on('healthCheck', this.updateHealthCheck.bind(this));
  }

  /**
   * Record a metric event
   */
  public recordMetric(event: MetricEvent): void {
    const { name, value, tags = {}, timestamp = Date.now() } = event;
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const metricList = this.metrics.get(name)!;
    metricList.push({ value, tags, timestamp });
    
    // Trim to max size
    if (metricList.length > this.MAX_METRICS_PER_KEY) {
      metricList.shift();
    }
  }

  /**
   * Record an error event
   */
  public recordError(event: ErrorEvent): void {
    const errorEvent = {
      ...event,
      timestamp: event.timestamp || Date.now()
    };
    
    this.errors.push(errorEvent);
    
    // Trim to max size
    if (this.errors.length > this.MAX_ERRORS) {
      this.errors.shift();
    }
    
    // Log to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[${errorEvent.service || 'unknown'}] ${errorEvent.message}`, errorEvent.metadata || '');
    }
  }

  /**
   * Update a service health check
   */
  public updateHealthCheck(result: HealthCheckResult): void {
    this.healthChecks.set(result.service, result);
  }

  /**
   * Get metrics for a specific metric name
   */
  public getMetrics(name: string): any[] {
    return this.metrics.get(name) || [];
  }

  /**
   * Get all recent errors
   */
  public getErrors(): ErrorEvent[] {
    return [...this.errors];
  }

  /**
   * Get health status for all services
   */
  public getHealthStatus(): HealthCheckResult[] {
    return Array.from(this.healthChecks.values());
  }

  /**
   * Track a specific metric value
   */
  public trackMetric(
    name: string,
    value: number | string | boolean,
    tags: Record<string, any> = {}
  ): void {
    this.emit('metric', {
      name,
      value,
      tags: Object.entries(tags).reduce((acc, [key, val]) => {
        acc[key] = typeof val === 'object' ? JSON.stringify(val) : String(val);
        return acc;
      }, {} as Record<string, string>)
    });
  }

  /**
   * Track an error with additional metadata
   */
  public trackError(
    message: string,
    error: Error,
    metadata: Record<string, any> = {}
  ): void {
    this.emit('error', {
      message,
      stack: error.stack,
      code: (error as any).code,
      metadata
    });
  }

  /**
   * Track an API call with response time
   */
  public trackApiCall(
    service: string, 
    endpoint: string, 
    responseTime: number, 
    success: boolean,
    metadata: Record<string, any> = {}
  ): void {
    this.emit('metric', {
      name: 'api_call',
      value: responseTime,
      tags: {
        service,
        endpoint,
        success: String(success),
        ...metadata
      }
    });
  }

  /**
   * Track a rate limit event
   */
  public trackRateLimit(
    service: string,
    limit: number,
    remaining: number,
    isExceeded: boolean
  ): void {
    this.emit('metric', {
      name: 'rate_limit',
      value: remaining,
      tags: {
        service,
        limit: String(limit),
        exceeded: String(isExceeded)
      }
    });
  }

  /**
   * Track a general event with metadata
   */
  public trackEvent(
    eventName: string,
    metadata: Record<string, any> = {}
  ): void {
    this.emit('metric', {
      name: eventName,
      value: 1,
      tags: {
        ...Object.entries(metadata).reduce((acc, [key, value]) => {
          acc[key] = typeof value === 'object' ? JSON.stringify(value) : String(value);
          return acc;
        }, {} as Record<string, string>)
      }
    });
  }

  /**
   * Check if a service is healthy
   */
  public isServiceHealthy(service: string): boolean {
    const healthCheck = this.healthChecks.get(service);
    if (!healthCheck) return false;
    return healthCheck.status === 'healthy';
  }
}

// Export singleton instance
const monitoringService = new MonitoringService();
export default monitoringService;
