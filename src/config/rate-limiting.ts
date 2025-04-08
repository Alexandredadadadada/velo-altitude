/**
 * Rate Limiting Configuration
 * 
 * Provides centralized configuration for rate limiters used throughout the application.
 * This leverages the existing Redis infrastructure used by the Cache Service.
 */

import { RateLimitConfig } from '../services/rate-limiting';

// Configuration structure by service
interface RateLimitingConfig {
  weather: RateLimitConfig;
  strava: RateLimitConfig;
  mapbox: RateLimitConfig;
  userApi: RateLimitConfig;
}

// Redis connection settings - using same connection as Cache Service
const redisConnectionConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || '',
};

// Default configuration
const config: RateLimitingConfig = {
  // Weather API rate limiting configuration
  weather: {
    bucket: {
      capacity: parseInt(process.env.WEATHER_RATE_LIMIT_CAPACITY || '60', 10),
      refillRate: parseFloat(process.env.WEATHER_RATE_LIMIT_REFILL_RATE || '1'),
      refillInterval: parseInt(process.env.WEATHER_RATE_LIMIT_REFILL_INTERVAL || '1000', 10)
    },
    redis: redisConnectionConfig,
    fallbackMode: (process.env.WEATHER_RATE_LIMIT_FALLBACK || 'strict') as 'strict' | 'permissive'
  },
  
  // Strava API rate limiting configuration
  strava: {
    bucket: {
      capacity: parseInt(process.env.STRAVA_RATE_LIMIT_CAPACITY || '100', 10),
      refillRate: parseFloat(process.env.STRAVA_RATE_LIMIT_REFILL_RATE || '2'),
      refillInterval: parseInt(process.env.STRAVA_RATE_LIMIT_REFILL_INTERVAL || '1000', 10)
    },
    redis: redisConnectionConfig,
    fallbackMode: (process.env.STRAVA_RATE_LIMIT_FALLBACK || 'strict') as 'strict' | 'permissive'
  },
  
  // Mapbox API rate limiting configuration
  mapbox: {
    bucket: {
      capacity: parseInt(process.env.MAPBOX_RATE_LIMIT_CAPACITY || '300', 10),
      refillRate: parseFloat(process.env.MAPBOX_RATE_LIMIT_REFILL_RATE || '5'),
      refillInterval: parseInt(process.env.MAPBOX_RATE_LIMIT_REFILL_INTERVAL || '1000', 10)
    },
    redis: redisConnectionConfig,
    fallbackMode: (process.env.MAPBOX_RATE_LIMIT_FALLBACK || 'strict') as 'strict' | 'permissive'
  },
  
  // User API rate limiting configuration
  userApi: {
    bucket: {
      capacity: parseInt(process.env.USER_API_RATE_LIMIT_CAPACITY || '30', 10),
      refillRate: parseFloat(process.env.USER_API_RATE_LIMIT_REFILL_RATE || '0.5'),
      refillInterval: parseInt(process.env.USER_API_RATE_LIMIT_REFILL_INTERVAL || '1000', 10)
    },
    redis: redisConnectionConfig,
    fallbackMode: (process.env.USER_API_RATE_LIMIT_FALLBACK || 'strict') as 'strict' | 'permissive'
  }
};

// Default export of configuration
export default config;

// Export individual configurations for convenience
export const weatherRateLimitConfig = config.weather;
export const stravaRateLimitConfig = config.strava;
export const mapboxRateLimitConfig = config.mapbox;
export const userApiRateLimitConfig = config.userApi;
