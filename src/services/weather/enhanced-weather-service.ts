/**
 * Enhanced Weather Service with Rate Limiting
 * 
 * This service extends the UnifiedWeatherService with additional features:
 * - Token bucket rate limiting with Redis
 * - Better error handling and fallback mechanisms
 * - Multiple weather provider support with failover
 * - Performance monitoring and metrics collection
 * - Enhanced wind data using Windy API
 */

import UnifiedWeatherService, { WeatherProviders, WeatherUnits } from './unified-weather-service';
import { WeatherRateLimiter, RateLimitExceededError } from './rate-limiting';
import monitoringService from '../../monitoring';
import apiMetricsService from '../../monitoring/api-metrics';
import { redisConfig } from '../../config/redis';
import weatherCache from '../cache/WeatherCache';
import { ENV } from '../../config/environment';
import WindyService from './windy-service';
import { 
  GeoLocation, 
  WindData, 
  WindForecast, 
  WindWarning, 
  WindyConfig 
} from './types/wind-types';
import { assessWindSafety } from '../../utils/wind-safety';

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
  // Windy service instance
  private windyService: WindyService;
  private windWarningCallbacks: Array<(warning: WindWarning) => void> = [];

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

    // Initialize Windy service
    this.windyService = new WindyService({
      apiKey: ENV.weather?.windy?.apiKey || process.env.WINDY_PLUGINS_API || '',
      cacheDuration: config.cacheTtl || 1800,
      alertThresholds: {
        warning: 30, // km/h
        danger: 45   // km/h
      }
    });

    // Register for wind warnings
    this.registerForWindWarnings();

    // Register Windy API as additional provider
    this._registerWindyAPI();

    // Initialize provider status tracking
    this._initializeProviderStatus();
    
    // Setup rate limiting
    this._initializeRateLimiting(config);
    
    // Start health checks
    this._startHealthChecks();

    // Log initialization
    console.log(`[EnhancedWeatherService] Initialized with rate limiting: ${this.rateLimitingEnabled}, fallback: ${this.enableFallback}, cache: ${this.cacheEnabled}, wind service: ${!!this.windyService}`);
    
    // Track service initialization
    monitoringService.trackEvent('weather_service_initialized', {
      rateLimiting: this.rateLimitingEnabled,
      fallback: this.enableFallback,
      cache: this.cacheEnabled,
      providers: Array.from(this.providerStatus.keys()),
      windService: !!this.windyService
    });
  }

  /**
   * Register callback for wind warnings 
   */
  private registerForWindWarnings() {
    const unregister = this.windyService.registerWarningCallback((warning: WindWarning) => {
      // Forward warning to any registered callbacks
      this.windWarningCallbacks.forEach(callback => {
        try {
          callback(warning);
        } catch (e) {
          console.error('[EnhancedWeatherService] Error in wind warning callback:', e);
        }
      });
      
      // Track warning for monitoring
      monitoringService.trackEvent('wind_warning_received', {
        level: warning.level,
        speed: warning.speed,
        colId: warning.colId || 'unknown'
      });
    });
    
    // Store unregister function to call during destroy
    this._windWarningUnregister = unregister;
  }

  private _windWarningUnregister: (() => void) | null = null;

  /**
   * Get current weather with rate limiting and fallback
   * Override the parent class method
   */
  async getCurrentWeather(latitude: number | string, longitude?: number, options: any = {}, userId?: string): Promise<any> {
    const startTime = Date.now();
    let location: string | { lat: number, lon: number } = '';
    let provider = this.defaultProvider;
    let providersTried: string[] = [];
    let usedFallback = false;
    let result = null;
    
    try {
      // Handle both string (location name) and coordinates
      if (typeof latitude === 'string' && !longitude) {
        // It's a location name
        location = latitude;
        const geo = await this.geocodeLocation(latitude);
        latitude = geo.lat;
        longitude = geo.lon;
      } else if (typeof latitude === 'number' && typeof longitude === 'number') {
        // It's coordinates
        location = `${latitude},${longitude}`;
      } else {
        throw new Error('Invalid location format');
      }
            
      // Try to get from cache first if enabled
      if (this.cacheEnabled) {
        const cacheKey = `current:${location.toString().toLowerCase().replace(/\s+/g, '_')}`;
        const cachedData = await weatherCache.get(cacheKey);
        
        if (cachedData) {
          // Track cache hit
          apiMetricsService.trackAPICall(
            'weather_cache',
            'get_current_weather',
            0, // No external API call made
            true,
            { location, fromCache: true }
          );
          return cachedData;
        }
      }
      
      // No cached data, proceed with API calls
      while (!result && providersTried.length < 3) { // Limit to 3 attempts
        try {
          // Check if we should use a different provider
          if (providersTried.length > 0) {
            usedFallback = true;
            provider = this._getNextProvider(providersTried);
            console.log(`[EnhancedWeatherService] Falling back to ${provider} for current weather`);
          }
          
          providersTried.push(provider);
          
          // Check if rate limited for this provider
          if (this.rateLimitingEnabled && this.rateLimiter) {
            // Get rate limit info for this provider
            const rateLimitInfo = await this.rateLimiter.getRateLimitInfo(userId || 'anonymous');
            
            // Track rate limit status
            apiMetricsService.trackRateLimit(
              provider,
              rateLimitInfo.limit,
              rateLimitInfo.remaining,
              rateLimitInfo.resetTime
            );
            
            // Skip this provider if rate limited and we have fallback enabled
            if (rateLimitInfo.remaining <= 0 && this.enableFallback) {
              console.log(`[EnhancedWeatherService] ${provider} rate limited, trying next provider`);
              continue;
            }
          }
          
          // Make the API call
          const apiStartTime = Date.now();
          const apiOptions = this.convertOptions(options);
          const data = await this.apiService.makeRequest(
            provider, 
            `/data/2.5/weather`, 
            {
              lat: latitude,
              lon: longitude,
              ...apiOptions
            }
          );
          const apiEndTime = Date.now();
          const responseTime = apiEndTime - apiStartTime;
          
          // Track successful API call
          apiMetricsService.trackAPICall(
            provider,
            'get_current_weather',
            responseTime,
            true,
            { location }
          );
          
          // Update provider health
          this._updateProviderHealth(provider, true);
          
          // Process the data
          result = this.processCurrentWeather(data);
          
          // Cache the result if caching is enabled
          if (this.cacheEnabled && result) {
            const cacheKey = `current:${location.toString().toLowerCase().replace(/\s+/g, '_')}`;
            await weatherCache.set(cacheKey, result, {
              type: 'current',
              provider,
              ttl: 1800 // 30 minutes
            });
          }
        } catch (error) {
          console.error(`[EnhancedWeatherService] Error fetching current weather from ${provider}:`, error);
          
          // Track API error
          apiMetricsService.trackAPIError(
            provider,
            'get_current_weather',
            error as Error,
            { location }
          );
          
          // Update provider health
          this._updateProviderHealth(provider, false);
          
          // If fallback is disabled, or we've tried all providers, throw the error
          if (!this.enableFallback || providersTried.length >= 3) {
            throw error;
          }
        }
      }
      
      // If we used fallback and it succeeded, track the fallback usage
      if (usedFallback && result) {
        apiMetricsService.trackFallbackUsage(
          this.defaultProvider,
          provider,
          providersTried.length > 1 ? 'api_error' : 'rate_limit_exceeded',
          { location }
        );
      }
      
      return result;
    } catch (error) {
      // Track overall failure
      monitoringService.trackError(
        `Failed to fetch current weather after trying ${providersTried.length} providers`,
        error as Error,
        { providersTried, location }
      );
      
      throw new Error(`All weather providers failed: ${(error as Error).message}`);
    } finally {
      // Track overall response time
      const totalTime = Date.now() - startTime;
      monitoringService.trackMetric('weather_request_time', totalTime, {
        operation: 'getCurrentWeather',
        providersCount: providersTried.length,
        usedFallback,
        success: !!result
      });
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
        apiMetricsService.trackAPICall(
          provider, 
          'get_forecast', 
          Date.now() - startTime, 
          true, 
          { location, days }
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
        apiMetricsService.trackAPIError(
          provider,
          'get_forecast',
          error as Error,
          { location, days }
        );
        
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
        apiMetricsService.trackAPICall(
          provider, 
          'get_mountain_pass_weather', 
          Date.now() - startTime, 
          true, 
          { passId }
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
        apiMetricsService.trackAPIError(
          provider,
          'get_mountain_pass_weather',
          error as Error,
          { passId }
        );
        
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
    // Priority order of providers
    const providerChain = [
      ENHANCED_PROVIDERS.OPEN_WEATHER,
      ENHANCED_PROVIDERS.WINDY,
      ENHANCED_PROVIDERS.WEATHER_API
    ];
    
    // Find first provider in chain that hasn't been tried yet
    for (const provider of providerChain) {
      if (!triedProviders.includes(provider)) {
        return provider;
      }
    }
    
    // If all have been tried, return a provider based on health
    for (const [provider, status] of this.providerStatus.entries()) {
      if (status.healthy && !triedProviders.includes(provider)) {
        return provider;
      }
    }
    
    // Last resort: return the first provider not in tried list, or the first provider
    return providerChain.find(p => !triedProviders.includes(p)) || providerChain[0];
  }

  /**
   * Update the health status of a provider
   */
  private _updateProviderHealth(provider: string, isHealthy: boolean): void {
    const status = this.providerStatus.get(provider);
    
    if (status) {
      // Update existing status
      status.healthy = isHealthy;
      status.lastCheck = Date.now();
      
      if (!isHealthy) {
        status.errorCount++;
      }
      
      this.providerStatus.set(provider, status);
      
      // Track provider health status change
      apiMetricsService.trackAPICall(
        'monitoring',
        'provider_health_update',
        0,
        true,
        {
          provider,
          healthy: isHealthy,
          errorCount: status.errorCount
        }
      );
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
   * Get detailed wind data for a location
   * 
   * @param location Location coordinates or name
   * @param options Additional options
   * @returns Promise with wind data
   */
  async getDetailedWindData(location: string | GeoLocation, options: any = {}): Promise<WindData> {
    try {
      // Convert string location to coordinates if needed
      let coordinates: GeoLocation;
      
      if (typeof location === 'string') {
        const geocoded = await this.geocodeLocation(location);
        coordinates = {
          lat: geocoded.lat,
          lon: geocoded.lon,
          name: geocoded.name || location
        };
      } else {
        coordinates = location;
      }
      
      // Get wind data from Windy service
      return await this.windyService.getDetailedWindData(coordinates, options);
    } catch (error) {
      console.error('[EnhancedWeatherService] Error getting detailed wind data:', error);
      monitoringService.trackError('get_detailed_wind_data_error', error);
      throw error;
    }
  }
  
  /**
   * Get wind forecast for a location
   * 
   * @param location Location coordinates or name
   * @param days Number of days for forecast
   * @param options Additional options
   * @returns Promise with wind forecast
   */
  async getWindForecast(location: string | GeoLocation, days: number = 3, options: any = {}): Promise<WindForecast> {
    try {
      // Convert string location to coordinates if needed
      let coordinates: GeoLocation;
      
      if (typeof location === 'string') {
        const geocoded = await this.geocodeLocation(location);
        coordinates = {
          lat: geocoded.lat,
          lon: geocoded.lon,
          name: geocoded.name || location
        };
      } else {
        coordinates = location;
      }
      
      // Get forecast from Windy service
      return await this.windyService.getWindForecast(coordinates, days, options);
    } catch (error) {
      console.error('[EnhancedWeatherService] Error getting wind forecast:', error);
      monitoringService.trackError('get_wind_forecast_error', error);
      throw error;
    }
  }
  
  /**
   * Get wind safety recommendation for cycling
   * 
   * @param location Location coordinates or name
   * @param experienceLevel Rider experience level
   * @param terrain Type of terrain
   * @returns Wind safety assessment
   */
  async getWindSafetyRecommendation(
    location: string | GeoLocation,
    experienceLevel: 'beginner' | 'intermediate' | 'advanced' = 'intermediate',
    terrain: 'flat' | 'mountain_descent' | 'mountain_col' | 'exposed_road' = 'flat'
  ) {
    try {
      // Convert string location to coordinates if needed
      let coordinates: GeoLocation;
      
      if (typeof location === 'string') {
        const geocoded = await this.geocodeLocation(location);
        coordinates = {
          lat: geocoded.lat,
          lon: geocoded.lon,
          name: geocoded.name || location
        };
      } else {
        coordinates = location;
      }
      
      // Get wind data
      const windData = await this.windyService.getDetailedWindData(coordinates);
      
      // Assess safety
      return assessWindSafety(windData, experienceLevel, terrain);
    } catch (error) {
      console.error('[EnhancedWeatherService] Error getting wind safety recommendation:', error);
      monitoringService.trackError('get_wind_safety_recommendation_error', error);
      throw error;
    }
  }
  
  /**
   * Check wind conditions for a specific mountain pass
   * 
   * @param colId Mountain pass ID
   * @param location Pass location
   * @returns Wind conditions and safety assessment
   */
  async getColWindConditions(colId: string, location: GeoLocation) {
    try {
      return await this.windyService.checkMountainPassWindConditions(colId, location);
    } catch (error) {
      console.error('[EnhancedWeatherService] Error getting col wind conditions:', error);
      monitoringService.trackError('get_col_wind_conditions_error', error);
      throw error;
    }
  }
  
  /**
   * Register a callback for wind warnings
   * 
   * @param callback Function to call when warning is triggered
   * @returns Function to unregister the callback
   */
  registerWindWarningCallback(callback: (warning: WindWarning) => void): () => void {
    this.windWarningCallbacks.push(callback);
    
    // Return unregister function
    return () => {
      this.windWarningCallbacks = this.windWarningCallbacks.filter(cb => cb !== callback);
    };
  }
  
  /**
   * Geocode a location string to coordinates
   * 
   * @param location Location name or address
   * @returns Promise with coordinates
   */
  private async geocodeLocation(location: string): Promise<{ lat: number; lon: number; name?: string }> {
    try {
      // Try to get from cache first
      const cacheKey = `geocode_${location.toLowerCase().replace(/\s+/g, '_')}`;
      const cachedLocation = await weatherCache.get(cacheKey);
      
      if (cachedLocation) {
        return JSON.parse(cachedLocation);
      }
      
      // Not in cache, perform geocoding
      // This uses the OpenWeather geocoding API
      const apiKey = this.apiService.getAPIKey(ENHANCED_PROVIDERS.OPEN_WEATHER);
      const response = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${apiKey}`);
      
      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data || !data.length) {
        throw new Error(`Location not found: ${location}`);
      }
      
      const result = {
        lat: data[0].lat,
        lon: data[0].lon,
        name: data[0].name
      };
      
      // Cache the result
      await weatherCache.set(cacheKey, JSON.stringify(result), { 
        type: 'geocode',
        provider: 'openweather',
        ttl: 86400 // 24 hours
      });
      
      return result;
    } catch (error) {
      console.error(`[EnhancedWeatherService] Geocoding error for "${location}":`, error);
      throw new Error(`Could not geocode location: ${(error as Error).message}`);
    }
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
    
    // Unregister from wind warnings
    if (this._windWarningUnregister) {
      this._windWarningUnregister();
      this._windWarningUnregister = null;
    }
    
    console.log('[EnhancedWeatherService] Service destroyed and connections closed');
  }

  /**
   * Register Windy API with the API service
   */
  private _registerWindyAPI() {
    this.apiService.registerAPI(ENHANCED_PROVIDERS.WINDY, {
      keys: [ENV.weather.windy.apiKey],
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
    // Check if rate limiting is enabled
    this.rateLimitingEnabled = config.rateLimiting?.enabled !== false && ENV.weather.rateLimiting.enabled;
    
    if (!this.rateLimitingEnabled) {
      return;
    }
    
    try {
      // Configure rate limiter
      const rateLimitConfig = {
        capacity: ENV.weather.rateLimiting.capacity || config.rateLimiting?.capacity || config.rateLimiting?.bucket?.capacity || 60,
        refillRate: ENV.weather.rateLimiting.refillRate || config.rateLimiting?.refillRate || config.rateLimiting?.bucket?.refillRate || 1,
        refillInterval: ENV.weather.rateLimiting.refillInterval || config.rateLimiting?.refillInterval || config.rateLimiting?.bucket?.refillInterval || 1000,
        fallbackMode: ENV.weather.rateLimiting.fallbackMode as 'strict' | 'permissive' || config.rateLimiting?.fallbackMode || 'strict'
      };
      
      // Initialize rate limiter
      this.rateLimiter = new WeatherRateLimiter({
        capacity: rateLimitConfig.capacity,
        refillRate: rateLimitConfig.refillRate,
        refillInterval: rateLimitConfig.refillInterval,
        fallbackMode: rateLimitConfig.fallbackMode
      });
      
      console.log(`[EnhancedWeatherService] Rate limiting initialized with config:`, rateLimitConfig);
      
    } catch (error) {
      console.error('[EnhancedWeatherService] Failed to initialize rate limiting:', error);
      monitoringService.trackError('weather_rate_limit_init_failed', error as Error);
      this.rateLimitingEnabled = false;
    }
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
   * Geocode a location string to coordinates
   * 
   * @param location Location name or address
   * @returns Promise with coordinates
   */
  private async geocodeLocation(location: string): Promise<{ lat: number; lon: number; name?: string }> {
    try {
      // Try to get from cache first
      const cacheKey = `geocode_${location.toLowerCase().replace(/\s+/g, '_')}`;
      const cachedLocation = await weatherCache.get(cacheKey);
      
      if (cachedLocation) {
        return JSON.parse(cachedLocation as string);
      }
      
      // Not in cache, perform geocoding
      // This uses the OpenWeather geocoding API
      const apiKey = this.apiService.getAPIKey(ENHANCED_PROVIDERS.OPEN_WEATHER);
      const response = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${apiKey}`);
      
      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data || !data.length) {
        throw new Error(`Location not found: ${location}`);
      }
      
      const result = {
        lat: data[0].lat,
        lon: data[0].lon,
        name: data[0].name
      };
      
      // Cache the result
      await weatherCache.set(cacheKey, JSON.stringify(result), { 
        type: 'geocode',
        provider: 'openweather',
        ttl: 86400 // 24 hours
      });
      
      return result;
    } catch (error) {
      console.error(`[EnhancedWeatherService] Geocoding error for "${location}":`, error);
      throw new Error(`Could not geocode location: ${(error as Error).message}`);
    }
  }
}

// Re-export constants from parent service
export { ENHANCED_PROVIDERS as WeatherProviders, WeatherUnits };

export default EnhancedWeatherService;
