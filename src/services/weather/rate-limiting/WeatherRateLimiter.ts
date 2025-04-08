/**
 * Weather Rate Limiter
 * 
 * Implements a token bucket algorithm with Redis for distributed rate limiting
 * of weather API requests. Includes fallback to local memory if Redis is unavailable.
 */

import Redis from 'ioredis';
import { redisConfig } from '../../../config/redis';
import monitoringService from '../../../monitoring';

// Rate limiting errors
export class RateLimitExceededError extends Error {
  public remaining: number;
  public limit: number;
  public resetTime?: number;

  constructor(message: string, remaining: number, limit: number, resetTime?: number) {
    super(message);
    this.name = 'RateLimitExceededError';
    this.remaining = remaining;
    this.limit = limit;
    this.resetTime = resetTime;
  }
}

// Configuration for token bucket algorithm
export interface TokenBucketConfig {
  // Maximum number of tokens in the bucket
  capacity: number;
  // Number of tokens added per refill interval
  refillRate: number;
  // Time in milliseconds between refills
  refillInterval: number;
  // Optional prefix for Redis keys
  keyPrefix?: string;
  // Fallback mode when Redis is unavailable
  fallbackMode?: 'strict' | 'permissive';
}

// Result of rate limit check
export interface RateLimitResult {
  // Whether the request is allowed
  allowed: boolean;
  // Number of tokens remaining
  remaining: number;
  // Maximum tokens allowed
  limit: number;
  // Time in milliseconds until bucket is refilled
  resetTime?: number;
}

// In-memory bucket for fallback mode
interface MemoryBucket {
  tokens: number;
  lastRefill: number;
}

/**
 * WeatherRateLimiter class using token bucket algorithm
 * with Redis for distributed rate limiting
 */
export class WeatherRateLimiter {
  private readonly config: TokenBucketConfig;
  private redisClient: Redis | null = null;
  private memoryBuckets: Map<string, MemoryBucket> = new Map();
  private redisAvailable: boolean = false;
  private readonly KEY_PREFIX: string;
  private readonly FALLBACK_MODE: 'strict' | 'permissive';
  
  /**
   * Constructor
   * @param config Token bucket configuration
   */
  constructor(config: TokenBucketConfig) {
    // Set default values
    this.config = {
      capacity: config.capacity || 60,
      refillRate: config.refillRate || 1,
      refillInterval: config.refillInterval || 1000,
      keyPrefix: config.keyPrefix || 'weather_ratelimit:',
      fallbackMode: config.fallbackMode || 'strict'
    };
    
    this.KEY_PREFIX = this.config.keyPrefix!;
    this.FALLBACK_MODE = this.config.fallbackMode!;
    
    // Initialize Redis connection
    this.initializeRedis();
  }
  
  /**
   * Initialize Redis connection
   */
  private async initializeRedis(): Promise<void> {
    try {
      if (!process.env.REDIS_URL) {
        console.warn('[WeatherRateLimiter] Redis URL not provided, using in-memory rate limiting');
        this.redisAvailable = false;
        return;
      }
      
      // Create Redis client
      this.redisClient = new Redis(process.env.REDIS_URL, {
        password: process.env.REDIS_PASSWORD,
        enableReadyCheck: true,
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        }
      });
      
      // Set up event handlers
      this.redisClient.on('connect', () => {
        console.log('[WeatherRateLimiter] Connected to Redis');
        this.redisAvailable = true;
        
        // Track successful connection
        monitoringService.trackEvent('redis_connected', {
          service: 'weather_rate_limiter'
        });
      });
      
      this.redisClient.on('error', (err) => {
        console.error('[WeatherRateLimiter] Redis error:', err);
        this.redisAvailable = false;
        
        // Track connection error
        monitoringService.trackError('redis_connection_error', err, {
          service: 'weather_rate_limiter'
        });
      });
      
      // Test connection
      await this.redisClient.ping();
      this.redisAvailable = true;
    } catch (error) {
      console.error('[WeatherRateLimiter] Failed to initialize Redis:', error);
      this.redisAvailable = false;
      
      // Track initialization failure
      monitoringService.trackError('redis_initialization_failed', error as Error, {
        service: 'weather_rate_limiter'
      });
    }
  }
  
  /**
   * Get Redis bucket key for a user
   * @param userId User identifier
   */
  private getBucketKey(userId: string): string {
    return `${this.KEY_PREFIX}${userId}`;
  }
  
  /**
   * Initialize a token bucket for a user
   * @param userId User identifier
   */
  public async initializeBucket(userId: string): Promise<void> {
    if (this.redisAvailable && this.redisClient) {
      const bucketKey = this.getBucketKey(userId);
      const now = Date.now();
      
      // Check if bucket exists
      const exists = await this.redisClient.exists(bucketKey);
      if (!exists) {
        // Create bucket with initial values
        await this.redisClient.hmset(bucketKey, {
          'tokens': this.config.capacity,
          'lastRefill': now
        });
        
        // Set expiration (24 hours by default)
        await this.redisClient.expire(bucketKey, 86400);
      }
    } else {
      // Initialize in-memory bucket
      if (!this.memoryBuckets.has(userId)) {
        this.memoryBuckets.set(userId, {
          tokens: this.config.capacity,
          lastRefill: Date.now()
        });
      }
    }
  }
  
  /**
   * Get rate limit info for a user
   * @param userId User identifier
   */
  public async getRateLimitInfo(userId: string): Promise<RateLimitResult> {
    if (this.redisAvailable && this.redisClient) {
      return this.checkRedisRateLimit(this.getBucketKey(userId), 0);
    } else {
      return this.checkMemoryRateLimit(userId, 0);
    }
  }
  
  /**
   * Consume tokens from a user's bucket
   * @param userId User identifier
   * @param tokenCount Number of tokens to consume
   * @throws RateLimitExceededError if rate limit is exceeded
   */
  public async consumeToken(userId: string, tokenCount: number = 1): Promise<RateLimitResult> {
    // Ensure bucket exists
    await this.initializeBucket(userId);
    
    let result: RateLimitResult;
    
    if (this.redisAvailable && this.redisClient) {
      // Use Redis for distributed rate limiting
      result = await this.checkRedisRateLimit(this.getBucketKey(userId), tokenCount);
    } else {
      // Fall back to in-memory rate limiting
      result = this.checkMemoryRateLimit(userId, tokenCount);
    }
    
    // Track rate limit check
    monitoringService.trackRateLimit(
      'weather_api', 
      this.config.capacity,
      result.remaining,
      !result.allowed
    );
    
    if (!result.allowed) {
      throw new RateLimitExceededError(
        'Rate limit exceeded', 
        result.remaining, 
        this.config.capacity,
        result.resetTime
      );
    }
    
    return result;
  }
  
  /**
   * Check rate limit using Redis
   * @param bucketKey Redis key for the bucket
   * @param cost Number of tokens to consume
   */
  private async checkRedisRateLimit(bucketKey: string, cost: number): Promise<RateLimitResult> {
    if (!this.redisClient) {
      throw new Error('Redis client not initialized');
    }
    
    // Execute rate limiting logic in a Redis transaction
    const luaScript = `
      local bucket = redis.call('HMGET', KEYS[1], 'tokens', 'lastRefill')
      local tokens = tonumber(bucket[1]) or ${this.config.capacity}
      local lastRefill = tonumber(bucket[2]) or 0
      local now = tonumber(ARGV[1])
      local capacity = tonumber(ARGV[2])
      local refillRate = tonumber(ARGV[3])
      local refillInterval = tonumber(ARGV[4])
      local cost = tonumber(ARGV[5])
      
      -- Calculate token refill
      local elapsedTime = now - lastRefill
      local tokensToAdd = math.floor(elapsedTime / refillInterval) * refillRate
      
      -- Update tokens with refill (capped at capacity)
      if tokensToAdd > 0 then
        tokens = math.min(capacity, tokens + tokensToAdd)
        lastRefill = lastRefill + math.floor(elapsedTime / refillInterval) * refillInterval
      end
      
      -- Check if enough tokens
      local allowed = 0
      local remaining = tokens
      
      if tokens >= cost then
        allowed = 1
        remaining = tokens - cost
      end
      
      -- Update bucket state if tokens were consumed
      if allowed == 1 and cost > 0 then
        redis.call('HMSET', KEYS[1], 'tokens', remaining, 'lastRefill', lastRefill)
        redis.call('EXPIRE', KEYS[1], 86400)  -- Expire in 24 hours
      else
        -- Just update the refill time if no tokens were consumed
        if tokensToAdd > 0 then
          redis.call('HSET', KEYS[1], 'lastRefill', lastRefill)
        end
      end
      
      -- Calculate time until next token
      local refillTime = 0
      if remaining < capacity then
        refillTime = refillInterval - (now - lastRefill) % refillInterval
      end
      
      return {allowed, remaining, refillTime}
    `;
    
    const now = Date.now();
    const result = await this.redisClient.eval(
      luaScript,
      1,  // Number of keys
      bucketKey,  // KEYS[1]
      now.toString(),  // ARGV[1]
      this.config.capacity.toString(),  // ARGV[2]
      this.config.refillRate.toString(),  // ARGV[3]
      this.config.refillInterval.toString(),  // ARGV[4]
      cost.toString()  // ARGV[5]
    ) as [number, number, number];
    
    const [allowed, remaining, refillTime] = result;
    
    return {
      allowed: allowed === 1,
      remaining,
      limit: this.config.capacity,
      resetTime: now + refillTime
    };
  }
  
  /**
   * Check rate limit using in-memory store (fallback)
   * @param userId User identifier
   * @param cost Number of tokens to consume
   */
  private checkMemoryRateLimit(userId: string, cost: number): RateLimitResult {
    // Get or create bucket
    if (!this.memoryBuckets.has(userId)) {
      this.memoryBuckets.set(userId, {
        tokens: this.config.capacity,
        lastRefill: Date.now()
      });
    }
    
    const bucket = this.memoryBuckets.get(userId)!;
    const now = Date.now();
    
    // Calculate token refill
    const elapsedTime = now - bucket.lastRefill;
    const tokensToAdd = Math.floor(elapsedTime / this.config.refillInterval) * this.config.refillRate;
    
    // Update tokens with refill
    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(this.config.capacity, bucket.tokens + tokensToAdd);
      bucket.lastRefill = bucket.lastRefill + Math.floor(elapsedTime / this.config.refillInterval) * this.config.refillInterval;
    }
    
    // Check if enough tokens and consume
    const allowed = bucket.tokens >= cost;
    
    // Only consume tokens if allowed and cost > 0
    if (allowed && cost > 0) {
      bucket.tokens -= cost;
    }
    
    // Update bucket
    this.memoryBuckets.set(userId, bucket);
    
    // Calculate reset time
    let resetTime: number | undefined;
    if (bucket.tokens < this.config.capacity) {
      resetTime = now + (this.config.refillInterval - (now - bucket.lastRefill) % this.config.refillInterval);
    }
    
    // Use permissive mode if configured
    if (this.FALLBACK_MODE === 'permissive' && !this.redisAvailable) {
      // In permissive mode, if Redis is down, always allow requests
      return {
        allowed: true,
        remaining: Math.max(1, bucket.tokens),
        limit: this.config.capacity,
        resetTime
      };
    }
    
    return {
      allowed,
      remaining: bucket.tokens,
      limit: this.config.capacity,
      resetTime
    };
  }
  
  /**
   * Apply rate limit headers to an HTTP response
   * @param res HTTP response object
   * @param result Rate limit result
   */
  public applyRateLimitHeaders(res: any, result: RateLimitResult): void {
    if (!res || typeof res.set !== 'function') return;
    
    res.set('X-RateLimit-Limit', this.config.capacity.toString());
    res.set('X-RateLimit-Remaining', Math.floor(result.remaining).toString());
    
    if (result.resetTime) {
      res.set('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());
    }
  }
  
  /**
   * Close Redis connection
   */
  public async close(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
      this.redisClient = null;
      this.redisAvailable = false;
    }
  }
  
  /**
   * Check if Redis is available
   */
  public isRedisAvailable(): boolean {
    return this.redisAvailable;
  }
}

export default WeatherRateLimiter;
