/**
 * Enhanced Weather Service with Rate Limiting
 * 
 * This service extends the UnifiedWeatherService with additional features:
 * - Token bucket rate limiting with Redis
 * - Better error handling and fallback mechanisms
 * - Multiple weather provider support with failover
 * - Performance monitoring and metrics collection
 */

import UnifiedWeatherService, { WeatherProviders, WeatherUnits } from './unified-weather-service';
import { WeatherRateLimiter, RateLimitExceededError } from './rate-limiting';
import monitoringService from '../../monitoring';
import { redisConfig } from '../../config/redis';
import weatherCache from '../cache/WeatherCache';

// Add Windy API to providers
const ENHANCED_PROVIDERS = {
  ...WeatherProviders,
  WINDY: 'windy'
};

interface EnhancedWeatherConfig {
  defaultProvider?: string;
  defaultUnits?: string;
  alertsEnabled?: boolean;
  predictionsEnabled?: boolean;
  notificationsEnabled?: boolean;
  cacheTtl?: number;
  rateLimiting?: {
    enabled: boolean;
    bucket?: {
      capacity: number;
      refillRate: number;
      refillInterval: number;
    };
    capacity?: number;
    refillRate?: number;
    refillInterval?: number;
    fallbackMode?: 'strict' | 'permissive';
  };
  // Enable provider fallback chain
  enableFallback?: boolean;
  // Health check interval in milliseconds
  healthCheckInterval?: number;
}

// Weather API status tracking
interface ProviderStatus {
  provider: string;
  healthy: boolean;
  lastCheck: number;
  errorCount: number;
  averageLatency: number;
}

/**
 * Enhanced Weather Service with Redis-based rate limiting
 * and multiple provider fallback support
 */
class EnhancedWeatherService extends UnifiedWeatherService {
  private rateLimiter: WeatherRateLimiter | null = null;
  private rateLimitingEnabled: boolean = false;
  private enableFallback: boolean = true;
  private providerStatus: Map<string, ProviderStatus> = new Map();
  private healthCheckInterval: number = 300000; // Default: 5 minutes
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private cacheEnabled: boolean = true;
  private defaultProvider: string = ENHANCED_PROVIDERS.OPEN_WEATHER;

  /**
   * Constructor
   * @param config Configuration object
   */
  constructor(config: EnhancedWeatherConfig = {}) {
    // Initialize the parent UnifiedWeatherService
    super(config);

    // Setup provider fallback option
    this.enableFallback = config.enableFallback !== false;
    
    // Set health check interval
    if (config.healthCheckInterval) {
      this.healthCheckInterval = config.healthCheckInterval;
    }
    
    // Set cache configuration
    this.cacheEnabled = config.cacheTtl !== 0;

    // Register Windy API as additional provider
    this._registerWindyAPI();

    // Initialize provider status tracking
    this._initializeProviderStatus();
    
    // Setup rate limiting
    this._initializeRateLimiting(config);
    
    // Start health checks
    this._startHealthChecks();

    // Log initialization
    console.log(`[EnhancedWeatherService] Initialized with rate limiting: ${this.rateLimitingEnabled}, fallback: ${this.enableFallback}, cache: ${this.cacheEnabled}`);
    
    // Track service initialization
    monitoringService.trackEvent('weather_service_initialized', {
      rateLimiting: this.rateLimitingEnabled,
      fallback: this.enableFallback,
      cache: this.cacheEnabled,
      providers: Array.from(this.providerStatus.keys())
    });
  }

  /**
   * Register Windy API with the API service
   */
  private _registerWindyAPI() {
    this.apiService.registerAPI(ENHANCED_PROVIDERS.WINDY, {
      keys: [process.env.WINDY_API_KEY],
      quota: {
        daily: 1000,
        hourly: 60
      }
    });
  }

  /**
   * Initialize provider status tracking
   */
  private _initializeProviderStatus() {
    // Track status for all providers
    const providers = [
      ENHANCED_PROVIDERS.OPEN_WEATHER,
      ENHANCED_PROVIDERS.METEO_FRANCE,
      ENHANCED_PROVIDERS.WEATHER_API,
      ENHANCED_PROVIDERS.CLIMACELL,
      ENHANCED_PROVIDERS.WINDY
    ];
    
    providers.forEach(provider => {
      this.providerStatus.set(provider, {
        provider,
        healthy: true,
        lastCheck: Date.now(),
        errorCount: 0,
        averageLatency: 0
      });
    });
  }

  /**
   * Start periodic health checks
   */
  private _startHealthChecks() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    
    this.healthCheckTimer = setInterval(() => {
      this._performHealthChecks();
    }, this.healthCheckInterval);
  }

  /**
   * Perform health checks on all providers
   */
  private async _performHealthChecks() {
    // Simple test location for health checks
    const testLocation = 'paris';
    
    for (const provider of this.providerStatus.keys()) {
      try {
        const startTime = Date.now();
        
        // Call the provider with a simple request
        await this.apiService.request(provider, {
          method: 'GET',
          endpoint: this._getProviderEndpoint(provider),
          params: {
            q: testLocation,
            units: this.config.defaultUnits
          }
        }, true); // true = this is a health check
        
        const latency = Date.now() - startTime;
        
        // Update provider status
        const status = this.providerStatus.get(provider);
        if (status) {
          // Weighted average latency (30% new, 70% historical)
          status.averageLatency = status.averageLatency === 0 
            ? latency 
            : (latency * 0.3) + (status.averageLatency * 0.7);
          
          status.healthy = true;
          status.lastCheck = Date.now();
          status.errorCount = 0;
          
          this.providerStatus.set(provider, status);
        }
        
        // Track metrics
        monitoringService.trackMetric(`weather_provider_latency_${provider}`, latency);
      } catch (error) {
        // Update provider status on error
        const status = this.providerStatus.get(provider);
        if (status) {
          status.errorCount++;
          status.healthy = status.errorCount < 3; // Mark as unhealthy after 3 consecutive failures
          status.lastCheck = Date.now();
          
          this.providerStatus.set(provider, status);
          
          // Track error
          monitoringService.trackError('weather_provider_health_check_failed', error as Error, {
            provider,
            errorCount: status.errorCount
          });
        }
      }
    }
    
    // Report overall health status
    const healthReport = Array.from(this.providerStatus.values()).map(status => ({
      provider: status.provider,
      healthy: status.healthy,
      latency: status.averageLatency
    }));
    
    monitoringService.trackEvent('weather_providers_health', { providers: healthReport });
  }

  /**
   * Get appropriate endpoint for health checks
   */
  private _getProviderEndpoint(provider: string): string {
    switch (provider) {
      case ENHANCED_PROVIDERS.OPEN_WEATHER:
        return 'https://api.openweathermap.org/data/2.5/weather';
      case ENHANCED_PROVIDERS.METEO_FRANCE:
        return 'https://api.meteo-concept.com/api/forecast/daily';
      case ENHANCED_PROVIDERS.WEATHER_API:
        return 'https://api.weatherapi.com/v1/current.json';
      case ENHANCED_PROVIDERS.CLIMACELL:
        return 'https://api.climacell.co/v3/weather/realtime';
      case ENHANCED_PROVIDERS.WINDY:
        return 'https://api.windy.com/api/point-forecast/v2';
      default:
        return 'https://api.openweathermap.org/data/2.5/weather';
    }
  }

  /**
   * Initialize rate limiting with Redis
   * @param config Configuration object
   */
  private _initializeRateLimiting(config: EnhancedWeatherConfig) {
    // Skip if rate limiting is explicitly disabled
    if (config.rateLimiting?.enabled === false) {
      this.rateLimitingEnabled = false;
      return;
    }
    
    try {
      // Set up token bucket configuration
      const bucketConfig = config.rateLimiting?.bucket || {
        capacity: config.rateLimiting?.capacity || 60,
        refillRate: config.rateLimiting?.refillRate || 1,
        refillInterval: config.rateLimiting?.refillInterval || 1000
      };
      
      // Set fallback mode
      const fallbackMode = config.rateLimiting?.fallbackMode || 'strict';
      
      // Create rate limiter with Redis
      this.rateLimiter = new WeatherRateLimiter({
        capacity: bucketConfig.capacity,
        refillRate: bucketConfig.refillRate,
        refillInterval: bucketConfig.refillInterval,
        fallbackMode: fallbackMode as 'strict' | 'permissive',
        keyPrefix: 'velo_altitude:weather_ratelimit:'
      });
      
      this.rateLimitingEnabled = true;
      
      // Log rate limiter initialization
      console.log(
        `[EnhancedWeatherService] Rate limiting initialized with capacity: ${bucketConfig.capacity}, ` +
        `refill rate: ${bucketConfig.refillRate}, interval: ${bucketConfig.refillInterval}ms, ` +
        `fallback mode: ${fallbackMode}`
      );
      
      // Track rate limiter configuration
      monitoringService.trackEvent('weather_rate_limiter_initialized', {
        capacity: bucketConfig.capacity,
        refillRate: bucketConfig.refillRate,
        refillInterval: bucketConfig.refillInterval,
        fallbackMode
      });
    } catch (error) {
      // Log error and disable rate limiting
      console.error('[EnhancedWeatherService] Failed to initialize rate limiter:', error);
      this.rateLimitingEnabled = false;
      this.rateLimiter = null;
      
      // Track initialization failure
      monitoringService.trackError('weather_rate_limiter_init_failed', error as Error);
    }
  }

  /**
   * Get current weather with rate limiting and fallback
   * Override the parent class method
   */
  async getCurrentWeather(location: string, options: any = {}, userId?: string): Promise<any> {
    // Generate a cache key for this request
    const cacheKey = `current:${location}:${JSON.stringify(options)}`;
    
    // Try to get from cache first if enabled
    if (this.cacheEnabled) {
      const cachedData = await weatherCache.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }
    
    // Apply rate limiting if enabled
    if (this.rateLimitingEnabled && this.rateLimiter) {
      try {
        // Use a token for current weather (lowest cost)
        await this.rateLimiter.consumeToken(userId || 'anonymous', 1);
      } catch (error) {
        if (error instanceof RateLimitExceededError) {
          throw error;
        }
        // For other errors, log but continue
        console.error('[EnhancedWeatherService] Rate limit error:', error);
      }
    }
    
    // Prepare for potential fallback
    const startTime = Date.now();
    const triedProviders: string[] = [];
    let provider = options.provider || this.defaultProvider;
    
    while (true) {
      try {
        // Try to get data from this provider
        const result = await this.apiService.request(provider, {
          method: 'GET',
          endpoint: 'current',
          params: {
            location,
            ...options
          }
        });
        
        // Track successful API call
        monitoringService.trackApiCall(
          'weather', 
          'current', 
          Date.now() - startTime, 
          true, 
          { provider, location }
        );
        
        // Update provider health
        this._updateProviderHealth(provider, true);
        
        // Process and cache the result
        const processedResult = this.processCurrentWeather(result, options);
        
        // Cache the result if caching is enabled
        if (this.cacheEnabled) {
          await weatherCache.set(cacheKey, processedResult, {
            type: 'current',
            provider
          });
        }
        
        return processedResult;
      } catch (error) {
        console.error(`[EnhancedWeatherService] Error with provider ${provider}:`, error);
        
        // Track provider error
        monitoringService.trackError('weather_api_call_failed', error as Error, {
          provider,
          endpoint: 'current',
          location,
          attemptNumber: triedProviders.length + 1
        });
        
        // Update provider health
        this._updateProviderHealth(provider, false);
        
        if (this.enableFallback) {
          // Try next provider if available
          triedProviders.push(provider);
          const nextProvider = this._getNextProvider(triedProviders);
          
          if (nextProvider) {
            console.log(`[EnhancedWeatherService] Trying fallback provider: ${nextProvider}`);
            provider = nextProvider;
            continue;
          }
        }
        
        // No more fallbacks available, re-throw the error
        throw error;
      }
    }
  }

  /**
   * Get forecast with rate limiting and fallback
   * Override the parent class method
   */
  async getForecast(location: string, days: number = 5, options: any = {}, userId?: string): Promise<any> {
    // Generate a cache key for this request
    const cacheKey = `forecast:${location}:${days}:${JSON.stringify(options)}`;
    
    // Try to get from cache first if enabled
    if (this.cacheEnabled) {
      const cachedData = await weatherCache.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }
    
    // Apply rate limiting if enabled
    if (this.rateLimitingEnabled && this.rateLimiter) {
      try {
        // Cost is proportional to the number of forecast days
        const tokenCost = Math.max(1, Math.min(5, Math.ceil(days / 2)));
        await this.rateLimiter.consumeToken(userId || 'anonymous', tokenCost);
      } catch (error) {
        if (error instanceof RateLimitExceededError) {
          throw error;
        }
        // For other errors, log but continue
        console.error('[EnhancedWeatherService] Rate limit error:', error);
      }
    }
    
    // Prepare for potential fallback
    const startTime = Date.now();
    const triedProviders: string[] = [];
    let provider = options.provider || this.defaultProvider;
    
    while (true) {
      try {
        // Try to get data from this provider
        const result = await this.apiService.request(provider, {
          method: 'GET',
          endpoint: 'forecast',
          params: {
            location,
            days,
            ...options
          }
        });
        
        // Track successful API call
        monitoringService.trackApiCall(
          'weather', 
          'forecast', 
          Date.now() - startTime, 
          true, 
          { provider, location, days }
        );
        
        // Update provider health
        this._updateProviderHealth(provider, true);
        
        // Process and cache the result
        const processedResult = this.processForecast(result, options);
        
        // Cache the result if caching is enabled
        if (this.cacheEnabled) {
          await weatherCache.set(cacheKey, processedResult, {
            type: 'forecast',
            provider
          });
        }
        
        return processedResult;
      } catch (error) {
        console.error(`[EnhancedWeatherService] Error with provider ${provider}:`, error);
        
        // Track provider error
        monitoringService.trackError('weather_api_call_failed', error as Error, {
          provider,
          endpoint: 'forecast',
          location,
          days,
          attemptNumber: triedProviders.length + 1
        });
        
        // Update provider health
        this._updateProviderHealth(provider, false);
        
        if (this.enableFallback) {
          // Try next provider if available
          triedProviders.push(provider);
          const nextProvider = this._getNextProvider(triedProviders);
          
          if (nextProvider) {
            console.log(`[EnhancedWeatherService] Trying fallback provider: ${nextProvider}`);
            provider = nextProvider;
            continue;
          }
        }
        
        // No more fallbacks available, re-throw the error
        throw error;
      }
    }
  }

  /**
   * Get mountain pass weather with rate limiting and fallback
   * Override the parent class method
   */
  async getMountainPassWeather(passId: string, options: any = {}, userId?: string): Promise<any> {
    // Generate cache key
    const cacheKey = `mountain_pass:${passId}:${JSON.stringify(options)}`;
    
    // Try to get from cache first if enabled
    if (this.cacheEnabled) {
      const cachedData = await weatherCache.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }
    
    // Apply rate limiting if enabled
    if (this.rateLimitingEnabled && this.rateLimiter) {
      try {
        // Mountain pass data is more complex, costs 2 tokens
        await this.rateLimiter.consumeToken(userId || 'anonymous', 2);
      } catch (error) {
        if (error instanceof RateLimitExceededError) {
          throw error;
        }
        // For other errors, log but continue
        console.error('[EnhancedWeatherService] Rate limit error:', error);
      }
    }
    
    // Normalize options
    const convertedOptions = this.convertOptions(options);
    
    // Prepare for potential fallback
    const startTime = Date.now();
    const triedProviders: string[] = [];
    let provider = options.provider || this.defaultProvider;
    let attempts = 0;
    
    while (true) {
      attempts++;
      
      try {
        // Try to get data from this provider
        const result = await this.apiService.request(provider, {
          method: 'GET',
          endpoint: 'mountain_pass',
          params: {
            id: passId,
            ...convertedOptions
          }
        });
        
        // Track successful API call
        monitoringService.trackApiCall(
          'weather', 
          'mountain_pass', 
          Date.now() - startTime, 
          true, 
          { provider, passId }
        );
        
        // Update provider health
        this._updateProviderHealth(provider, true);
        
        // Process and cache the result
        const processedResult = this.processMountainPassData(result, options);
        
        // Cache the result if caching is enabled
        if (this.cacheEnabled) {
          await weatherCache.set(cacheKey, processedResult, {
            type: 'mountainPass',
            provider
          });
        }
        
        return processedResult;
      } catch (error) {
        console.error(`[EnhancedWeatherService] Error with provider ${provider}:`, error);
        
        // Track provider error
        monitoringService.trackError('weather_api_call_failed', error as Error, {
          provider,
          endpoint: 'mountain_pass',
          passId,
          attemptNumber: attempts
        });
        
        // Update provider health
        this._updateProviderHealth(provider, false);
        
        if (this.enableFallback) {
          // Try next provider if available
          triedProviders.push(provider);
          const nextProvider = this._getNextProvider(triedProviders);
          
          if (nextProvider) {
            console.log(`[EnhancedWeatherService] Trying fallback provider: ${nextProvider}`);
            provider = nextProvider;
            continue;
          }
        }
        
        // No more fallbacks available, re-throw the error
        throw error;
      }
    }
  }

  /**
   * Get the next provider for fallback
   * @param triedProviders Array of already tried providers
   * @returns Next provider to try
   */
  private _getNextProvider(triedProviders: string[]): string {
    // If all providers have been tried, return null
    if (triedProviders.length >= Object.keys(ENHANCED_PROVIDERS).length) {
      return '';
    }

    // Get all available providers
    const allProviders = Object.values(ENHANCED_PROVIDERS);
    
    // Filter out already tried providers
    const availableProviders = allProviders.filter(
      provider => !triedProviders.includes(provider)
    );
    
    // Filter by health status - prioritize healthy providers
    const healthyProviders = availableProviders.filter(provider => {
      const status = this.providerStatus.get(provider);
      return status && status.healthy;
    });
    
    // Return first healthy provider, or first available if none are healthy
    return healthyProviders.length > 0 
      ? healthyProviders[0] 
      : (availableProviders.length > 0 ? availableProviders[0] : '');
  }

  /**
   * Update the health status of a provider
   */
  private _updateProviderHealth(provider: string, isHealthy: boolean): void {
    const status = this.providerStatus.get(provider);
    if (status) {
      if (isHealthy) {
        status.healthy = true;
        status.errorCount = 0;
      } else {
        status.errorCount++;
        status.healthy = status.errorCount < 3; // Mark as unhealthy after 3 errors
      }
      
      status.lastCheck = Date.now();
      this.providerStatus.set(provider, status);
    }
  }

  /**
   * Process current weather data from API response
   * @param data Raw API response data
   * @param options Request options
   * @returns Processed weather data
   */
  private processCurrentWeather(data: any, options: any = {}): any {
    // Basic processing of the weather data
    try {
      const processedData = {
        ...data,
        processed: true,
        processedTime: new Date().toISOString(),
        source: data.source || options.provider || this.defaultProvider
      };
      
      // Add units information if available
      if (options.units) {
        processedData.units = options.units;
      }
      
      return processedData;
    } catch (error) {
      console.error('[EnhancedWeatherService] Error processing current weather data:', error);
      // Return original data if processing fails
      return data;
    }
  }

  /**
   * Process forecast data from API response
   * @param data Raw API response data
   * @param options Request options
   * @returns Processed forecast data
   */
  private processForecast(data: any, options: any = {}): any {
    // Basic processing of the forecast data
    try {
      const processedData = {
        ...data,
        processed: true,
        processedTime: new Date().toISOString(),
        source: data.source || options.provider || this.defaultProvider
      };
      
      // Add units information if available
      if (options.units) {
        processedData.units = options.units;
      }
      
      // Process forecast days if available
      if (data.forecast && Array.isArray(data.forecast)) {
        processedData.forecast = data.forecast.map((day: any) => ({
          ...day,
          processed: true
        }));
      }
      
      return processedData;
    } catch (error) {
      console.error('[EnhancedWeatherService] Error processing forecast data:', error);
      // Return original data if processing fails
      return data;
    }
  }

  /**
   * Process mountain pass data from API response
   * @param data Raw API response data
   * @param options Request options
   * @returns Processed mountain pass data
   */
  private processMountainPassData(data: any, options: any = {}): any {
    // Basic processing of the mountain pass data
    try {
      const processedData = {
        ...data,
        processed: true,
        processedTime: new Date().toISOString(),
        source: data.source || options.provider || this.defaultProvider
      };
      
      // Add units information if available
      if (options.units) {
        processedData.units = options.units;
      }
      
      // Process elevation data if available
      if (data.elevation) {
        processedData.elevation = {
          ...data.elevation,
          processed: true
        };
      }
      
      return processedData;
    } catch (error) {
      console.error('[EnhancedWeatherService] Error processing mountain pass data:', error);
      // Return original data if processing fails
      return data;
    }
  }

  /**
   * Convert options to a format compatible with the API
   * @param options Original options object
   * @returns Converted options
   */
  private convertOptions(options: any = {}): any {
    const convertedOptions = { ...options };
    
    // Convert units if needed
    if (options.units) {
      switch (options.units.toLowerCase()) {
        case 'imperial':
          convertedOptions.units = 'imperial';
          break;
        case 'metric':
          convertedOptions.units = 'metric';
          break;
        default:
          convertedOptions.units = 'metric'; // Default to metric
      }
    }
    
    // Convert date format if needed
    if (options.dateFormat) {
      convertedOptions.format = options.dateFormat;
    }
    
    return convertedOptions;
  }

  /**
   * Create Express middleware for rate limiting
   * Can be attached to API routes
   */
  createRateLimitMiddleware() {
    return (req: any, res: any, next: any) => {
      if (!this.rateLimitingEnabled || !this.rateLimiter) {
        // If rate limiting is disabled, pass through
        return next();
      }
      
      // Get user identifier (API key or IP)
      const userId = req.headers['x-api-key'] || req.ip || 'anonymous';
      
      // Determine token cost based on endpoint
      let tokenCost = 1;
      if (req.path.includes('/forecast')) {
        const days = parseInt(req.query.days, 10) || 5;
        tokenCost = Math.max(1, Math.min(5, Math.ceil(days / 2)));
      } else if (req.path.includes('/mountain-pass')) {
        tokenCost = 2;
      }
      
      // Check rate limit
      this.rateLimiter.consumeToken(userId, tokenCost)
        .then(() => {
          // Apply headers with rate limit info
          this.rateLimiter?.getRateLimitInfo(userId)
            .then(info => {
              // Apply rate limit headers
              if (res.set) {
                res.set('X-RateLimit-Limit', info.remaining.toString());
                res.set('X-RateLimit-Remaining', Math.floor(info.remaining).toString());
                res.set('X-RateLimit-Reset', Math.ceil(info.resetTime / 1000).toString());
              }
              next();
            })
            .catch(() => next()); // Proceed even if getting info fails
        })
        .catch(error => {
          if (error instanceof RateLimitExceededError) {
            // Track rate limit exceeded
            monitoringService.trackEvent('weather_api_rate_limited', {
              userId,
              path: req.path,
              method: req.method
            });
            
            // Return rate limit response
            res.status(429).json({
              error: 'Rate limit exceeded',
              message: 'Too many requests, please try again later',
              retryAfter: error.resetTime 
                ? Math.ceil((error.resetTime - Date.now()) / 1000) 
                : 60
            });
          } else {
            // For other errors, proceed
            console.error('[EnhancedWeatherService] Rate limit middleware error:', error);
            next();
          }
        });
    };
  }

  /**
   * Get provider health status
   */
  getProvidersHealth(): Array<{
    provider: string;
    healthy: boolean;
    lastCheck: number;
    averageLatency: number;
  }> {
    return Array.from(this.providerStatus.values()).map(status => ({
      provider: status.provider,
      healthy: status.healthy,
      lastCheck: status.lastCheck,
      averageLatency: status.averageLatency
    }));
  }

  /**
   * Get rate limiter instance
   */
  getRateLimiter(): WeatherRateLimiter | null {
    return this.rateLimiter;
  }

  /**
   * Get rate limiting status
   */
  isRateLimitingEnabled(): boolean {
    return this.rateLimitingEnabled;
  }

  /**
   * Clean up resources
   */
  async destroy(): Promise<void> {
    // Stop health checks
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
    
    // Close rate limiter connections
    if (this.rateLimiter) {
      await this.rateLimiter.close();
      this.rateLimiter = null;
    }
    
    console.log('[EnhancedWeatherService] Service destroyed and connections closed');
  }
}

// Re-export constants from parent service
export { ENHANCED_PROVIDERS as WeatherProviders, WeatherUnits };

export default EnhancedWeatherService;
