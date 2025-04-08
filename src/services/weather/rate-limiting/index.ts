/**
 * Weather Rate Limiting Module
 * 
 * Exports components for implementing rate limiting on weather API endpoints
 */

export { WeatherRateLimiter, RateLimitExceededError } from './WeatherRateLimiter';
export type { TokenBucketConfig, RateLimitResult } from './WeatherRateLimiter';

// Default export
export { WeatherRateLimiter as default } from './WeatherRateLimiter';
