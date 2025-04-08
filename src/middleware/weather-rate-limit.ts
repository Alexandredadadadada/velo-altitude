/**
 * Weather Rate Limiting Middleware
 * 
 * Provides rate limiting functionality for weather API endpoints
 * using the WeatherRateLimiter service with token bucket algorithm.
 */

import { Request, Response, NextFunction } from 'express';
import { WeatherRateLimiter } from '../services/rate-limiting';
import { weatherRateLimitConfig } from '../config/rate-limiting';
import monitoringService from '../services/monitoring';

// Singleton instance of rate limiter
let rateLimiter: WeatherRateLimiter | null = null;

/**
 * Initialize the rate limiter instance
 */
const initializeRateLimiter = (): WeatherRateLimiter => {
  if (!rateLimiter) {
    rateLimiter = new WeatherRateLimiter(weatherRateLimitConfig);
    monitoringService.trackEvent('weather_rate_limiter_initialized', {
      config: rateLimiter.getConfig()
    });
  }
  return rateLimiter;
};

/**
 * Get unique identifier for the request
 * Uses IP address and optional API key if present
 */
const getRequestIdentifier = (req: Request): string => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  
  // If API key is present, use it as the identifier
  // This allows different rate limits for authenticated users
  if (apiKey) {
    return `api:${apiKey}`;
  }

  // Otherwise use IP address
  return `ip:${ip}`;
};

/**
 * Weather rate limiting middleware
 * Can be applied to specific routes or globally for all weather endpoints
 */
export const weatherRateLimitMiddleware = () => {
  const limiter = initializeRateLimiter();
  
  return async (req: Request, res: Response, next: NextFunction) => {
    const identifier = getRequestIdentifier(req);
    
    try {
      // Determine request cost based on endpoint or query complexity
      // Default cost is 1 token per request
      let cost = 1;
      
      // If requesting forecast, increase cost based on days requested
      if (req.path.includes('/forecast')) {
        const days = parseInt(req.query.days as string, 10) || 1;
        cost = Math.max(1, Math.min(5, days)); // Cap cost between 1-5
      }
      
      // Check if request is allowed
      const result = await limiter.checkRateLimit(identifier, cost);
      
      // Apply rate limit headers to response
      limiter.applyHeaders(res, result);
      
      // If rate limit exceeded, return 429 Too Many Requests
      if (!result.allowed) {
        monitoringService.trackEvent('weather_rate_limit_exceeded', {
          identifier,
          path: req.path,
          remaining: result.remaining,
          resetTime: result.resetTime
        });
        
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: 'Too many requests, please try again later',
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
        });
      }
      
      // If allowed, proceed to next middleware
      next();
    } catch (error) {
      // Log error and allow request to proceed
      monitoringService.trackError('weather_rate_limit_error', error as Error, {
        identifier,
        path: req.path
      });
      
      // In case of error, allow the request to go through
      // This prevents rate limiting from blocking legitimate requests
      next();
    }
  };
};

// Export a configured instance for direct use in routes
export const weatherRateLimit = weatherRateLimitMiddleware();

// Also export the initialized rate limiter for direct access
export const getWeatherRateLimiter = (): WeatherRateLimiter => {
  return initializeRateLimiter();
};

export default weatherRateLimit;
