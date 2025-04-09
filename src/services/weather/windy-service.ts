/**
 * Windy Service for Velo-Altitude
 * 
 * Provides detailed wind data and forecasts for cyclists
 * using the Windy API to enhance safety and route planning.
 */

import axios from 'axios';
import { 
  GeoLocation, 
  WindData, 
  WindForecast, 
  WindWarning,
  WindyConfig, 
  WindyApiOptions 
} from './types/wind-types';
import weatherCache from '../cache/WeatherCache';
import { ENV } from '../../config/environment';
import monitoringService from '../../monitoring';

class WindyService {
  private apiKey: string;
  private cacheDuration: number;
  private alertThresholds: {
    warning: number;
    danger: number;
  };
  private baseUrl = 'https://api.windy.com/api/point-forecast/v2';
  private debounceTime: number;
  private refreshInterval: number;
  private units: 'metric' | 'imperial';
  private warningCallbacks: Array<(warning: WindWarning) => void> = [];

  constructor(config: WindyConfig) {
    // Initialisation avec la clé API de Netlify ou utilisation de la clé fournie
    this.apiKey = config.apiKey || ENV.weather?.windy?.apiKey || process.env.WINDY_PLUGINS_API || '';
    
    if (!this.apiKey) {
      console.error('[WindyService] No API key provided. Windy features will be disabled.');
    }
    
    this.cacheDuration = config.cacheDuration || 1800; // 30 minutes par défaut
    this.alertThresholds = config.alertThresholds || {
      warning: 30, // km/h
      danger: 45   // km/h
    };
    this.debounceTime = config.debounce || 500; // 500ms debounce
    this.refreshInterval = config.refreshInterval || 900000; // 15 minutes
    this.units = config.units || 'metric';
    
    console.log('[WindyService] Initialized with API key and thresholds:', {
      warning: this.alertThresholds.warning,
      danger: this.alertThresholds.danger
    });
    
    // Track initialization for monitoring
    monitoringService.trackEvent('windy_service_initialized', {
      cacheDuration: this.cacheDuration,
      warningThreshold: this.alertThresholds.warning,
      dangerThreshold: this.alertThresholds.danger
    });
  }

  /**
   * Get detailed wind data for a specific location
   * 
   * @param location Geographic location (lat/lon)
   * @param options API options
   * @returns Promise with wind data
   */
  async getDetailedWindData(location: GeoLocation, options: WindyApiOptions = {}): Promise<WindData> {
    const cacheKey = `windy_data_${location.lat}_${location.lon}`;
    
    try {
      // Check cache first
      const cachedData = await weatherCache.get(cacheKey);
      if (cachedData) {
        console.log('[WindyService] Using cached wind data');
        monitoringService.trackEvent('windy_data_cache_hit');
        return JSON.parse(cachedData);
      }
      
      // Prepare API request
      const startTime = Date.now();
      const response = await this.makeApiRequest('/point', {
        lat: location.lat,
        lon: location.lon,
        model: 'gfs',
        parameters: ['wind', 'windGust'],
        levels: ['surface'],
        units: options.units || this.units,
        key: this.apiKey
      });
      
      const latency = Date.now() - startTime;
      monitoringService.trackMetric('windy_api_latency', latency);
      
      // Process API response
      const windData: WindData = {
        speed: this.convertWindSpeed(response.data?.wind?.[0]?.value || 0),
        direction: response.data?.wind?.[0]?.direction || 0,
        gust: this.convertWindSpeed(response.data?.windGust?.[0]?.value || 0),
        timestamp: Date.now(),
        provider: 'windy'
      };
      
      // Check for dangerous wind conditions and trigger alerts
      this.checkForAlerts(windData, location);
      
      // Cache results
      await weatherCache.set(cacheKey, JSON.stringify(windData), this.cacheDuration);
      
      return windData;
    } catch (error) {
      console.error('[WindyService] Error fetching wind data:', error);
      monitoringService.trackError('windy_api_error', error);
      throw new Error(`Failed to fetch wind data: ${error.message}`);
    }
  }

  /**
   * Get wind forecast for a location over specified days
   * 
   * @param location Geographic location
   * @param days Number of days for forecast
   * @param options API options
   * @returns Promise with wind forecast
   */
  async getWindForecast(location: GeoLocation, days: number = 3, options: WindyApiOptions = {}): Promise<WindForecast> {
    const cacheKey = `windy_forecast_${location.lat}_${location.lon}_${days}`;
    
    try {
      // Check cache first
      const cachedData = await weatherCache.get(cacheKey);
      if (cachedData) {
        console.log('[WindyService] Using cached wind forecast');
        monitoringService.trackEvent('windy_forecast_cache_hit');
        return JSON.parse(cachedData);
      }
      
      // Calculate hours based on days (4 data points per day)
      const hours = days * 24;
      
      // Prepare API request
      const startTime = Date.now();
      const response = await this.makeApiRequest('/forecast', {
        lat: location.lat,
        lon: location.lon,
        model: 'gfs',
        parameters: ['wind', 'windGust', 'temp'],
        levels: ['surface'],
        hours: hours,
        units: options.units || this.units,
        key: this.apiKey
      });
      
      const latency = Date.now() - startTime;
      monitoringService.trackMetric('windy_forecast_api_latency', latency);
      
      // Get current wind data
      const currentWind = await this.getDetailedWindData(location, options);
      
      // Process forecast data
      const hourlyForecast = this.processHourlyForecast(response.data);
      const dailyForecast = this.aggregateDailyForecast(hourlyForecast);
      
      const windForecast: WindForecast = {
        location,
        current: currentWind,
        hourly: hourlyForecast,
        daily: dailyForecast,
        updateTime: Date.now(),
        source: 'windy'
      };
      
      // Cache results
      await weatherCache.set(cacheKey, JSON.stringify(windForecast), this.cacheDuration);
      
      return windForecast;
    } catch (error) {
      console.error('[WindyService] Error fetching wind forecast:', error);
      monitoringService.trackError('windy_forecast_api_error', error);
      throw new Error(`Failed to fetch wind forecast: ${error.message}`);
    }
  }
  
  /**
   * Get wind safety recommendation for cycling
   * based on current wind conditions
   * 
   * @param location Location to check
   * @returns Safety recommendation with wind data
   */
  async getWindSafetyRecommendation(location: GeoLocation): Promise<{
    safeToRide: boolean;
    windData: WindData;
    recommendation: string;
    warningLevel: 'none' | 'info' | 'warning' | 'danger';
  }> {
    try {
      const windData = await this.getDetailedWindData(location);
      
      // Determine safety level
      let safeToRide = true;
      let recommendation = '';
      let warningLevel: 'none' | 'info' | 'warning' | 'danger' = 'none';
      
      if (windData.speed >= this.alertThresholds.danger || windData.gust >= this.alertThresholds.danger + 10) {
        safeToRide = false;
        warningLevel = 'danger';
        recommendation = 'Conditions de vent dangereuses. Il est recommandé de ne pas rouler aujourd\'hui.';
      } else if (windData.speed >= this.alertThresholds.warning || windData.gust >= this.alertThresholds.warning + 10) {
        safeToRide = true; // Still safe but with caution
        warningLevel = 'warning';
        recommendation = 'Vents forts. Soyez vigilant, particulièrement dans les descentes et les zones exposées.';
      } else if (windData.speed >= 20) {
        safeToRide = true;
        warningLevel = 'info';
        recommendation = 'Vents modérés. Adaptez votre parcours et votre rythme en fonction du vent.';
      } else {
        recommendation = 'Conditions de vent favorables pour le cyclisme.';
      }
      
      return {
        safeToRide,
        windData,
        recommendation,
        warningLevel
      };
    } catch (error) {
      console.error('[WindyService] Error getting safety recommendation:', error);
      monitoringService.trackError('windy_safety_recommendation_error', error);
      throw error;
    }
  }
  
  /**
   * Register a callback for wind warnings
   * 
   * @param callback Function to call when warning is triggered
   * @returns Function to unregister the callback
   */
  registerWarningCallback(callback: (warning: WindWarning) => void): () => void {
    this.warningCallbacks.push(callback);
    
    // Return unregister function
    return () => {
      this.warningCallbacks = this.warningCallbacks.filter(cb => cb !== callback);
    };
  }
  
  /**
   * Check wind conditions for a specific mountain pass
   * 
   * @param colId Mountain pass ID
   * @param location Pass location
   * @returns Wind data and safety information
   */
  async checkMountainPassWindConditions(colId: string, location: GeoLocation): Promise<{
    windData: WindData;
    warningLevel: 'none' | 'info' | 'warning' | 'danger';
    safeToRide: boolean;
    recommendation: string;
  }> {
    try {
      const safety = await this.getWindSafetyRecommendation(location);
      
      // Additional logic specific to mountain passes
      let recommendation = safety.recommendation;
      let warningLevel = safety.warningLevel;
      
      // For cols, we're a bit more conservative
      if (safety.windData.speed >= 25 && safety.warningLevel === 'info') {
        warningLevel = 'warning';
        recommendation = 'Vents modérés à forts sur ce col. Soyez particulièrement vigilant dans les descentes.';
      }
      
      // Check for wind at altitude (optional feature if available)
      try {
        const altitudeResponse = await this.makeApiRequest('/point', {
          lat: location.lat,
          lon: location.lon,
          model: 'gfs',
          parameters: ['wind'],
          levels: ['850h'], // 850 hPa ~ 1500m typical cycling altitude
          units: this.units,
          key: this.apiKey
        });
        
        const altitudeWind = altitudeResponse.data?.wind?.[0]?.value || 0;
        if (altitudeWind > safety.windData.speed * 1.3) {
          // Wind significantly stronger at altitude
          recommendation += ' Attention : le vent est significativement plus fort en altitude sur ce col.';
          if (warningLevel === 'info') warningLevel = 'warning';
        }
      } catch (e) {
        // Silently continue if altitude data isn't available
        console.warn('[WindyService] Could not fetch altitude wind data', e);
      }
      
      return {
        windData: safety.windData,
        warningLevel,
        safeToRide: warningLevel !== 'danger',
        recommendation
      };
    } catch (error) {
      console.error('[WindyService] Error checking mountain pass conditions:', error);
      monitoringService.trackError('windy_mountain_pass_error', error);
      throw error;
    }
  }

  private async makeApiRequest(endpoint: string, params: any): Promise<any> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await axios.get(url, { params });
      return response.data;
    } catch (error) {
      console.error(`[WindyService] API request failed: ${error.message}`);
      monitoringService.trackError('windy_api_request_error', error);
      throw error;
    }
  }

  private processHourlyForecast(data: any): any[] {
    const hourlyForecast = [];
    const hours = data.hours || [];
    const windData = data.wind || [];
    const gustData = data.windGust || [];
    const tempData = data.temp || [];
    
    for (let i = 0; i < hours.length; i++) {
      const dateTime = new Date(hours[i] * 1000).toISOString();
      const entry = {
        dateTime,
        speed: this.convertWindSpeed(windData[i]?.value || 0),
        direction: windData[i]?.direction || 0,
        gust: this.convertWindSpeed(gustData[i]?.value || 0),
        feelsLike: this.calculateWindChill(tempData[i]?.value || 0, windData[i]?.value || 0),
        probability: Math.min(100, Math.round(Math.random() * 30 + 70)), // Placeholder for probability
        timestamp: hours[i],
        provider: 'windy'
      };
      
      hourlyForecast.push(entry);
    }
    
    return hourlyForecast;
  }

  private aggregateDailyForecast(hourlyForecast: any[]): any[] {
    const dailyMap = new Map();
    
    for (const hour of hourlyForecast) {
      const date = hour.dateTime.split('T')[0]; // Extract just the date part
      
      if (!dailyMap.has(date)) {
        dailyMap.set(date, {
          date,
          speeds: [],
          directions: [],
          gusts: []
        });
      }
      
      const dayData = dailyMap.get(date);
      dayData.speeds.push(hour.speed);
      dayData.directions.push(hour.direction);
      dayData.gusts.push(hour.gust);
    }
    
    // Calculate aggregate values
    return Array.from(dailyMap.values()).map(day => {
      return {
        date: day.date,
        min: Math.min(...day.speeds),
        max: Math.max(...day.speeds),
        avgDirection: this.calculateAverageDirection(day.directions),
        maxGust: Math.max(...day.gusts)
      };
    });
  }

  private calculateAverageDirection(directions: number[]): number {
    // Convert to cartesian coordinates
    let sumSin = 0;
    let sumCos = 0;
    
    for (const dir of directions) {
      const rad = (dir * Math.PI) / 180;
      sumSin += Math.sin(rad);
      sumCos += Math.cos(rad);
    }
    
    // Convert back to degrees
    const avgDir = Math.atan2(sumSin / directions.length, sumCos / directions.length);
    return ((avgDir * 180) / Math.PI + 360) % 360;
  }

  private calculateWindChill(tempC: number, windSpeed: number): number {
    // Wind chill formula (Canadian formula)
    if (tempC <= 10 && windSpeed > 4.8) {
      const windSpeedKmh = windSpeed * 3.6; // Convert m/s to km/h if needed
      return 13.12 + 0.6215 * tempC - 11.37 * Math.pow(windSpeedKmh, 0.16) + 0.3965 * tempC * Math.pow(windSpeedKmh, 0.16);
    }
    return tempC;
  }

  private convertWindSpeed(speed: number): number {
    // Convert from m/s to km/h
    return Math.round(speed * 3.6 * 10) / 10;
  }

  private checkForAlerts(windData: WindData, location: GeoLocation, colId?: string): void {
    // Don't bother if no callbacks registered
    if (this.warningCallbacks.length === 0) {
      return;
    }
    
    let level: 'info' | 'warning' | 'danger' = 'info';
    let message = '';
    
    if (windData.speed >= this.alertThresholds.danger || windData.gust >= this.alertThresholds.danger + 10) {
      level = 'danger';
      message = colId 
        ? `Vents dangereux (${windData.speed} km/h) sur le col ${colId}. Rafales à ${windData.gust} km/h.`
        : `Vents dangereux (${windData.speed} km/h) détectés. Rafales à ${windData.gust} km/h.`;
    } else if (windData.speed >= this.alertThresholds.warning || windData.gust >= this.alertThresholds.warning + 10) {
      level = 'warning';
      message = colId
        ? `Vents forts (${windData.speed} km/h) sur le col ${colId}. Rafales à ${windData.gust} km/h.`
        : `Vents forts (${windData.speed} km/h) détectés. Rafales à ${windData.gust} km/h.`;
    } else {
      // No need to alert for normal conditions
      return;
    }
    
    const warning: WindWarning = {
      level,
      message,
      speed: windData.speed,
      gust: windData.gust,
      colId: colId || '',
      location,
      timestamp: Date.now(),
      expiresAt: Date.now() + 3600000 // Expire after 1 hour
    };
    
    // Trigger callbacks
    this.warningCallbacks.forEach(callback => {
      try {
        callback(warning);
      } catch (e) {
        console.error('[WindyService] Error in warning callback:', e);
      }
    });
    
    // Track alert trigger
    monitoringService.trackEvent('wind_alert_triggered', {
      level,
      speed: windData.speed,
      gust: windData.gust,
      colId: colId || 'unknown'
    });
  }
}

export default WindyService;
