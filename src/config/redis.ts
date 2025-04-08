/**
 * Redis Configuration
 * 
 * Provides connection details for Redis services used throughout the application.
 * Uses environment variables for secure configuration.
 */

// Redis connection configuration
export const redisConfig = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  password: process.env.REDIS_PASSWORD || '',
  connectTimeout: 10000, // 10 seconds
  maxRetriesPerRequest: 3,
  enableOfflineQueue: true,
  tls: process.env.NODE_ENV === 'production'
};

export default redisConfig;
