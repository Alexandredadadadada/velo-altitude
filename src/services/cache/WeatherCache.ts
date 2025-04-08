/**
 * Weather Caching Service
 * 
 * Advanced caching service specifically designed for weather data:
 * - Multi-tiered caching (memory + Redis)
 * - Implements TTL (Time-To-Live) with variable expiration based on data type
 * - Segmented cache by geolocation
 * - Support for partial cache invalidation
 * - Automatic data staleness detection
 */

import { Redis } from 'ioredis';
import { redisConfig } from '../../config/redis';
import monitoringService from '../../monitoring';

// Default cache configuration
const DEFAULT_CONFIG = {
  // TTL in seconds for each data type
  ttl: {
    current: 15 * 60,       // Current weather: 15 minutes
    forecast: 60 * 60,      // Forecast: 1 hour
    historical: 24 * 60 * 60, // Historical: 24 hours
    mountainPass: 30 * 60   // Mountain pass data: 30 minutes
  },
  // In-memory cache size limits
  limits: {
    maxEntries: 1000,       // Maximum cache entries
    maxSize: 50 * 1024 * 1024 // 50MB max cache size
  },
  // Whether to use Redis as secondary cache
  useRedis: true,
  // Cache segment prefixes
  prefix: {
    memory: 'weather_mem:',
    redis: 'weather_cache:'
  }
};

// Cache item metadata
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
  size: number;
  type: string;
  provider: string;
}

export class WeatherCache {
  private memoryCache: Map<string, CacheItem<any>> = new Map();
  private redis: Redis | null = null;
  private config: typeof DEFAULT_CONFIG;
  private cacheSize: number = 0;
  private hits: { [key: string]: number } = {
    memory: 0,
    redis: 0,
    miss: 0
  };

  /**
   * Create a new WeatherCache instance
   * @param config Optional configuration to override defaults
   */
  constructor(config: Partial<typeof DEFAULT_CONFIG> = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      ttl: {
        ...DEFAULT_CONFIG.ttl,
        ...(config.ttl || {})
      },
      limits: {
        ...DEFAULT_CONFIG.limits,
        ...(config.limits || {})
      },
      prefix: {
        ...DEFAULT_CONFIG.prefix,
        ...(config.prefix || {})
      }
    };

    // Initialize Redis if enabled
    if (this.config.useRedis) {
      try {
        // Create a modified config with proper tls format
        const redisConnectionOptions = {
          ...redisConfig,
          tls: redisConfig.tls ? {} : undefined // Convert boolean to empty object or undefined
        };
        
        this.redis = new Redis(redisConnectionOptions);
        console.log('[WeatherCache] Redis cache initialized');
        
        this.redis.on('error', (err) => {
          console.error('[WeatherCache] Redis error:', err);
          monitoringService.trackError('redis_cache_error', err, {
            service: 'WeatherCache'
          });
        });
      } catch (error) {
        console.error('[WeatherCache] Failed to initialize Redis cache:', error);
        monitoringService.trackError('redis_cache_init_failed', error as Error, {
          service: 'WeatherCache'
        });
        this.redis = null;
      }
    }

    // Track initialization
    monitoringService.trackEvent('weather_cache_initialized', {
      redisEnabled: !!this.redis,
      maxEntries: this.config.limits.maxEntries,
      maxSize: this.config.limits.maxSize
    });
  }

  /**
   * Get a cached weather data item
   * @param key Cache key
   * @returns Cached data or null if not found/expired
   */
  public async get<T>(key: string): Promise<T | null> {
    // Try memory cache first
    const memKey = `${this.config.prefix.memory}${key}`;
    const cachedItem = this.memoryCache.get(memKey);

    if (cachedItem && Date.now() < cachedItem.expiry) {
      // Memory cache hit
      this.hits.memory++;
      monitoringService.trackEvent('weather_cache_hit', {
        type: 'memory',
        key
      });
      return cachedItem.data as T;
    }

    // If Redis is available, try it next
    if (this.redis) {
      try {
        const redisKey = `${this.config.prefix.redis}${key}`;
        const redisData = await this.redis.get(redisKey);

        if (redisData) {
          // Redis cache hit
          this.hits.redis++;
          
          try {
            const parsedItem = JSON.parse(redisData) as CacheItem<T>;

            // Check if still valid
            if (Date.now() < parsedItem.expiry) {
              // Store in memory cache for faster access next time
              this.set(key, parsedItem.data, {
                type: parsedItem.type,
                provider: parsedItem.provider
              });

              monitoringService.trackEvent('weather_cache_hit', {
                type: 'redis',
                key
              });

              return parsedItem.data;
            }
          } catch (error) {
            console.error('[WeatherCache] Error parsing Redis data:', error);
            monitoringService.trackError('redis_parse_error', error as Error, {
              key
            });
          }
        }
      } catch (error) {
        console.error('[WeatherCache] Redis get error:', error);
        monitoringService.trackError('redis_get_error', error as Error, {
          key
        });
      }
    }

    // Cache miss
    this.hits.miss++;
    monitoringService.trackEvent('weather_cache_miss', { key });
    return null;
  }

  /**
   * Store a weather data item in cache
   * @param key Cache key
   * @param data Data to cache
   * @param options Cache options (type, provider, custom TTL)
   * @returns Success indicator
   */
  public async set(
    key: string,
    data: any,
    options: {
      type: string;
      provider: string;
      ttl?: number;
    }
  ): Promise<boolean> {
    if (!data) return false;

    // Determine TTL based on data type
    const ttl = options.ttl || this.getTtlByType(options.type);
    const expiry = Date.now() + (ttl * 1000);
    
    // Estimate data size
    const dataString = JSON.stringify(data);
    const size = dataString.length * 2; // Rough estimate in bytes
    
    // Create cache item
    const cacheItem: CacheItem<any> = {
      data,
      timestamp: Date.now(),
      expiry,
      size,
      type: options.type,
      provider: options.provider
    };

    // Store in memory cache
    const memKey = `${this.config.prefix.memory}${key}`;
    this.memoryCache.set(memKey, cacheItem);
    this.cacheSize += size;
    
    // Enforce memory cache limits
    this.enforceCacheLimits();

    // Store in Redis if available
    if (this.redis) {
      try {
        const redisKey = `${this.config.prefix.redis}${key}`;
        await this.redis.set(
          redisKey, 
          JSON.stringify(cacheItem),
          'EX', 
          ttl
        );
      } catch (error) {
        console.error('[WeatherCache] Redis set error:', error);
        monitoringService.trackError('redis_set_error', error as Error, {
          key
        });
        return false;
      }
    }

    monitoringService.trackEvent('weather_cache_set', {
      key,
      type: options.type,
      provider: options.provider,
      size,
      ttl
    });

    return true;
  }

  /**
   * Delete a specific item from cache
   * @param key Cache key
   */
  public async delete(key: string): Promise<void> {
    // Remove from memory cache
    const memKey = `${this.config.prefix.memory}${key}`;
    const cachedItem = this.memoryCache.get(memKey);
    
    if (cachedItem) {
      this.cacheSize -= cachedItem.size;
      this.memoryCache.delete(memKey);
    }

    // Remove from Redis
    if (this.redis) {
      try {
        const redisKey = `${this.config.prefix.redis}${key}`;
        await this.redis.del(redisKey);
      } catch (error) {
        console.error('[WeatherCache] Redis delete error:', error);
        monitoringService.trackError('redis_delete_error', error as Error, {
          key
        });
      }
    }
  }

  /**
   * Invalidate cache by pattern (e.g., all forecasts or specific provider)
   * @param pattern Pattern to match (e.g., 'forecast:*' or '*:openweather:*')
   */
  public async invalidateByPattern(pattern: string): Promise<void> {
    // Memory cache invalidation
    for (const [key, item] of this.memoryCache.entries()) {
      if (this.matchPattern(key, pattern)) {
        this.cacheSize -= item.size;
        this.memoryCache.delete(key);
      }
    }

    // Redis cache invalidation
    if (this.redis) {
      try {
        const redisPattern = `${this.config.prefix.redis}${pattern}`;
        const keys = await this.redis.keys(redisPattern);
        
        if (keys.length > 0) {
          await this.redis.del(...keys);
          console.log(`[WeatherCache] Invalidated ${keys.length} Redis keys matching pattern: ${pattern}`);
        }
      } catch (error) {
        console.error('[WeatherCache] Redis pattern invalidation error:', error);
        monitoringService.trackError('redis_invalidate_error', error as Error, {
          pattern
        });
      }
    }

    monitoringService.trackEvent('weather_cache_invalidated', {
      pattern
    });
  }

  /**
   * Get cache statistics
   */
  public getStats(): {
    size: number;
    entries: number;
    hits: typeof this.hits;
    hitRate: number;
  } {
    const totalRequests = this.hits.memory + this.hits.redis + this.hits.miss;
    const hitRate = totalRequests > 0 
      ? ((this.hits.memory + this.hits.redis) / totalRequests) * 100 
      : 0;

    return {
      size: this.cacheSize,
      entries: this.memoryCache.size,
      hits: { ...this.hits },
      hitRate
    };
  }

  /**
   * Close any open connections
   */
  public async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
      console.log('[WeatherCache] Redis connection closed');
    }
  }

  /**
   * Enforce memory cache limits by removing oldest items
   */
  private enforceCacheLimits(): void {
    // Check entry count limit
    if (this.memoryCache.size > this.config.limits.maxEntries) {
      this.evictOldestEntries(this.memoryCache.size - this.config.limits.maxEntries);
    }

    // Check size limit
    if (this.cacheSize > this.config.limits.maxSize) {
      const sizeToReclaim = this.cacheSize - (this.config.limits.maxSize * 0.8);
      this.evictBySize(sizeToReclaim);
    }
  }

  /**
   * Evict oldest entries from memory cache
   * @param count Number of entries to evict
   */
  private evictOldestEntries(count: number): void {
    // Sort by timestamp
    const entries = Array.from(this.memoryCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove oldest entries
    for (let i = 0; i < Math.min(count, entries.length); i++) {
      const [key, item] = entries[i];
      this.cacheSize -= item.size;
      this.memoryCache.delete(key);
    }

    monitoringService.trackEvent('weather_cache_eviction', {
      type: 'oldest',
      count
    });
  }

  /**
   * Evict entries to reclaim target size
   * @param targetSize Size to reclaim in bytes
   */
  private evictBySize(targetSize: number): void {
    let reclaimedSize = 0;
    let evictedCount = 0;
    
    // Sort by timestamp
    const entries = Array.from(this.memoryCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove entries until we hit the target
    for (const [key, item] of entries) {
      if (reclaimedSize >= targetSize) break;
      
      this.cacheSize -= item.size;
      reclaimedSize += item.size;
      evictedCount++;
      this.memoryCache.delete(key);
    }

    monitoringService.trackEvent('weather_cache_eviction', {
      type: 'size',
      targetSize,
      reclaimedSize,
      count: evictedCount
    });
  }

  /**
   * Get appropriate TTL based on data type
   * @param type Data type (current, forecast, etc.)
   */
  private getTtlByType(type: string): number {
    switch (type.toLowerCase()) {
      case 'current':
        return this.config.ttl.current;
      case 'forecast':
        return this.config.ttl.forecast;
      case 'historical':
        return this.config.ttl.historical;
      case 'mountainpass':
      case 'mountain_pass':
        return this.config.ttl.mountainPass;
      default:
        return this.config.ttl.current; // Default to current TTL
    }
  }

  /**
   * Simple pattern matching for cache keys
   * @param key Cache key
   * @param pattern Pattern to match
   */
  private matchPattern(key: string, pattern: string): boolean {
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(key.replace(this.config.prefix.memory, ''));
  }
}

// Export a singleton instance
export default new WeatherCache();
