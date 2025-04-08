import Redis from 'ioredis';
import { EventEmitter } from 'events';
import monitoringService from '../monitoring';

/**
 * Configuration for rate limiting
 */
export interface RateLimitConfig {
  bucket: {
    capacity: number;         // Maximum number of tokens
    refillRate: number;       // Tokens per second
    refillInterval: number;   // Milliseconds between refills
  };
  redis: {
    host: string;
    port: number;
    password: string;
  };
  endpoint?: string;          // Optional endpoint-specific configuration
  fallbackMode?: 'strict' | 'permissive';  // How to handle Redis failures
}

/**
 * Result of a rate limit check
 */
export interface RateLimitResult {
  allowed: boolean;           // Whether the request is allowed
  remaining: number;          // Remaining tokens
  resetAt: number;            // Timestamp when bucket will refill
  retryAfter?: number;        // Seconds after which to retry (if not allowed)
  limit: number;              // Total capacity
}

/**
 * Token Bucket implementation for rate limiting weather API calls
 * Uses Redis for distributed rate limiting across multiple server instances
 */
export class WeatherRateLimiter extends EventEmitter {
  private static instance: WeatherRateLimiter;
  private redisClient: Redis | null = null;
  private config: RateLimitConfig;
  private isRedisConnected: boolean = false;
  private localBuckets: Map<string, { tokens: number, lastRefill: number }> = new Map();
  
  /**
   * LUA script for atomic token bucket implementation in Redis
   * Returns: [allowed (0/1), remaining tokens, reset timestamp]
   */
  private static readonly BUCKET_SCRIPT = `
  local key = KEYS[1]
  local now = tonumber(ARGV[1])
  local capacity = tonumber(ARGV[2])
  local requested = tonumber(ARGV[3])
  local refillRate = tonumber(ARGV[4])
  local refillTime = tonumber(ARGV[5])
  local ttl = tonumber(ARGV[6])

  -- Get the current bucket data or initialize it
  local bucket = redis.call('HMGET', key, 'tokens', 'lastRefill')
  local tokens = tonumber(bucket[1]) or capacity
  local lastRefill = tonumber(bucket[2]) or now

  -- Calculate token refill based on time elapsed
  local elapsed = math.max(0, now - lastRefill)
  local tokensToAdd = math.floor(elapsed / refillTime * refillRate)
  
  if tokensToAdd > 0 then
    -- Refill the bucket (up to capacity)
    tokens = math.min(capacity, tokens + tokensToAdd)
    lastRefill = lastRefill + (tokensToAdd / refillRate * refillTime)
  end

  -- Calculate reset time (when bucket will be full again)
  local tokensNeeded = capacity - tokens
  local resetAt = now
  
  if tokensNeeded > 0 then
    resetAt = now + math.ceil(tokensNeeded / refillRate * refillTime)
  end

  -- Check if the request can be fulfilled
  local allowed = 0
  if tokens >= requested then
    tokens = tokens - requested
    allowed = 1
  end

  -- Update the bucket in Redis
  redis.call('HMSET', key, 'tokens', tokens, 'lastRefill', lastRefill)
  redis.call('EXPIRE', key, ttl)

  return {allowed, tokens, resetAt}
  `;

  private bucketScriptSha: string | null = null;

  /**
   * Private constructor for singleton pattern
   */
  private constructor(config: RateLimitConfig) {
    super();
    this.config = this.validateConfig(config);
    
    // Initialize Redis connection
    this.initializeRedis();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: RateLimitConfig): WeatherRateLimiter {
    if (!WeatherRateLimiter.instance) {
      if (!config) {
        throw new Error('WeatherRateLimiter must be initialized with a config the first time it is accessed');
      }
      WeatherRateLimiter.instance = new WeatherRateLimiter(config);
    } else if (config) {
      // Update config if provided
      WeatherRateLimiter.instance.updateConfig(config);
    }
    
    return WeatherRateLimiter.instance;
  }

  /**
   * Validate and normalize configuration
   */
  private validateConfig(config: RateLimitConfig): RateLimitConfig {
    const validatedConfig = { ...config };
    
    // Set defaults if missing
    if (!validatedConfig.bucket) {
      validatedConfig.bucket = {
        capacity: 60,          // 60 requests
        refillRate: 1,         // 1 token per second
        refillInterval: 1000   // Check every 1 second
      };
    }
    
    // Set fallback mode default
    if (!validatedConfig.fallbackMode) {
      validatedConfig.fallbackMode = 'strict';
    }
    
    return validatedConfig;
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<RateLimitConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      bucket: {
        ...this.config.bucket,
        ...(config.bucket || {})
      },
      redis: {
        ...this.config.redis,
        ...(config.redis || {})
      }
    };
    
    // Reconnect Redis if connection details changed
    if (config.redis) {
      this.initializeRedis();
    }
    
    // Log configuration update
    monitoringService.trackEvent('weather_rate_limiter_config_updated', {
      capacity: this.config.bucket.capacity,
      refillRate: this.config.bucket.refillRate
    });
  }

  /**
   * Initialize Redis connection
   */
  private async initializeRedis(): Promise<void> {
    try {
      // Close existing connection if any
      if (this.redisClient) {
        this.redisClient.disconnect();
      }
      
      // Create new connection
      this.redisClient = new Redis({
        host: this.config.redis.host,
        port: this.config.redis.port,
        password: this.config.redis.password,
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 100, 3000);
          return delay;
        },
        enableReadyCheck: true,
        maxRetriesPerRequest: 3
      });
      
      // Setup event listeners
      this.redisClient.on('connect', () => {
        console.log('WeatherRateLimiter Redis connected');
        monitoringService.trackEvent('weather_rate_limiter_redis_connected');
      });
      
      this.redisClient.on('ready', async () => {
        this.isRedisConnected = true;
        this.emit('ready');
        
        // Load the LUA script
        try {
          this.bucketScriptSha = await this.redisClient!.script('load', WeatherRateLimiter.BUCKET_SCRIPT);
          console.log('WeatherRateLimiter Redis script loaded');
        } catch (error) {
          console.error('Failed to load WeatherRateLimiter Redis script:', error);
          monitoringService.trackError('weather_rate_limiter_script_load_failed', error as Error);
        }
      });
      
      this.redisClient.on('error', (error) => {
        console.error('WeatherRateLimiter Redis error:', error);
        this.isRedisConnected = false;
        monitoringService.trackError('weather_rate_limiter_redis_error', error);
      });
      
      this.redisClient.on('close', () => {
        console.log('WeatherRateLimiter Redis connection closed');
        this.isRedisConnected = false;
        monitoringService.trackEvent('weather_rate_limiter_redis_disconnected');
      });
      
    } catch (error) {
      console.error('Failed to initialize Redis for WeatherRateLimiter:', error);
      this.isRedisConnected = false;
      monitoringService.trackError('weather_rate_limiter_initialization_failed', error as Error);
    }
  }

  /**
   * Check if a request is allowed based on rate limits
   * @param userId User ID or API key for per-user rate limiting
   * @param endpoint Optional endpoint for different rate limits per endpoint
   * @param cost Token cost for this request (default: 1)
   * @returns Promise<RateLimitResult> Result of the rate limit check
   */
  public async checkRateLimit(
    userId: string,
    endpoint: string = 'default',
    cost: number = 1
  ): Promise<RateLimitResult> {
    const bucketKey = `rate:weather:${endpoint}:${userId}`;
    
    try {
      // If Redis is connected, use distributed rate limiting
      if (this.isRedisConnected && this.redisClient && this.bucketScriptSha) {
        return await this.checkRedisRateLimit(bucketKey, cost);
      } else {
        // Fallback to local in-memory rate limiting
        console.warn('WeatherRateLimiter using local fallback mode');
        monitoringService.trackEvent('weather_rate_limiter_using_fallback');
        return this.checkLocalRateLimit(bucketKey, cost);
      }
    } catch (error) {
      console.error('WeatherRateLimiter error during rate check:', error);
      monitoringService.trackError('weather_rate_limiter_check_failed', error as Error);
      
      // Handle error based on fallback mode
      if (this.config.fallbackMode === 'permissive') {
        return {
          allowed: true,
          remaining: this.config.bucket.capacity - cost,
          resetAt: Date.now() + 60000,
          limit: this.config.bucket.capacity
        };
      } else {
        // Strict mode - deny requests on error
        return {
          allowed: false,
          remaining: 0,
          resetAt: Date.now() + 60000,
          retryAfter: 60,
          limit: this.config.bucket.capacity
        };
      }
    }
  }

  /**
   * Check rate limit using Redis
   */
  private async checkRedisRateLimit(
    bucketKey: string,
    cost: number
  ): Promise<RateLimitResult> {
    const now = Math.floor(Date.now() / 1000);
    const capacity = this.config.bucket.capacity;
    const refillRate = this.config.bucket.refillRate;
    const refillTime = this.config.bucket.refillInterval / 1000; // Convert ms to seconds
    const ttl = Math.ceil((capacity / refillRate) * refillTime * 2); // 2x the time to refill the bucket
    
    // Execute the rate limiting script
    const result = await this.redisClient!.evalsha(
      this.bucketScriptSha!,
      1,
      bucketKey,
      now.toString(),
      capacity.toString(),
      cost.toString(),
      refillRate.toString(),
      refillTime.toString(),
      ttl.toString()
    );
    
    const allowed = result[0] === 1;
    const remaining = parseInt(result[1], 10);
    const resetAt = parseInt(result[2], 10) * 1000; // Convert to milliseconds
    
    // Calculate retry after time if not allowed
    const retryAfter = allowed ? undefined : Math.ceil((resetAt - Date.now()) / 1000);
    
    // Track rate limit event
    monitoringService.trackEvent('weather_rate_limit_check', {
      allowed,
      remaining,
      userId: bucketKey,
      cost
    });
    
    return {
      allowed,
      remaining,
      resetAt,
      retryAfter,
      limit: capacity
    };
  }

  /**
   * Check rate limit using local memory (fallback)
   */
  private checkLocalRateLimit(
    bucketKey: string,
    cost: number
  ): RateLimitResult {
    const now = Date.now();
    const capacity = this.config.bucket.capacity;
    const refillRate = this.config.bucket.refillRate;
    const refillInterval = this.config.bucket.refillInterval;
    
    // Get or create bucket
    let bucket = this.localBuckets.get(bucketKey);
    if (!bucket) {
      bucket = {
        tokens: capacity,
        lastRefill: now
      };
      this.localBuckets.set(bucketKey, bucket);
    }
    
    // Calculate token refill
    const elapsed = now - bucket.lastRefill;
    const tokensToAdd = Math.floor((elapsed / refillInterval) * refillRate);
    
    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(capacity, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;
    }
    
    // Check if request can be fulfilled
    const allowed = bucket.tokens >= cost;
    
    if (allowed) {
      bucket.tokens -= cost;
    }
    
    // Calculate reset time
    const tokensNeeded = capacity - bucket.tokens;
    const resetAt = allowed
      ? now + Math.ceil((tokensNeeded / refillRate) * refillInterval)
      : now + Math.ceil((cost - bucket.tokens) / refillRate * refillInterval);
    
    // Calculate retry after time if not allowed
    const retryAfter = allowed ? undefined : Math.ceil((resetAt - now) / 1000);
    
    return {
      allowed,
      remaining: bucket.tokens,
      resetAt,
      retryAfter,
      limit: capacity
    };
  }

  /**
   * Get current device configuration
   */
  public getConfig(): RateLimitConfig {
    return { ...this.config };
  }

  /**
   * Apply rate limit headers to a response object
   * @param response The Express response object
   * @param result The rate limit check result
   */
  public applyRateLimitHeaders(response: any, result: RateLimitResult): void {
    if (!response || !response.header) return;
    
    response.header('X-RateLimit-Limit', result.limit.toString());
    response.header('X-RateLimit-Remaining', result.remaining.toString());
    response.header('X-RateLimit-Reset', Math.floor(result.resetAt / 1000).toString());
    
    if (!result.allowed && result.retryAfter) {
      response.header('Retry-After', result.retryAfter.toString());
    }
  }

  /**
   * Creates middleware for Express to enforce rate limits
   * @param options Options for rate limiting
   */
  public createMiddleware(options: {
    endpoint?: string;
    getUserId?: (req: any) => string;
    cost?: (req: any) => number;
    onRateLimited?: (req: any, res: any, next: any, result: RateLimitResult) => void;
  } = {}) {
    return async (req: any, res: any, next: any) => {
      try {
        // Get user ID from request (default: IP address)
        const userId = options.getUserId
          ? options.getUserId(req)
          : req.headers['x-api-key'] || req.ip;
        
        // Get endpoint
        const endpoint = options.endpoint || req.path;
        
        // Get cost (default: 1)
        const cost = options.cost ? options.cost(req) : 1;
        
        // Check rate limit
        const result = await this.checkRateLimit(userId, endpoint, cost);
        
        // Apply headers
        this.applyRateLimitHeaders(res, result);
        
        if (result.allowed) {
          // Request allowed, continue
          next();
        } else {
          // Rate limited - call custom handler or use default
          if (options.onRateLimited) {
            options.onRateLimited(req, res, next, result);
          } else {
            // Default response
            res.status(429).json({
              error: 'Too Many Requests',
              message: `Rate limit exceeded. Try again after ${result.retryAfter} seconds.`,
              retryAfter: result.retryAfter
            });
          }
          
          // Track rate limit events
          monitoringService.trackEvent('weather_api_rate_limited', {
            userId,
            endpoint,
            cost,
            retryAfter: result.retryAfter
          });
        }
      } catch (error) {
        // Log error and allow request to proceed
        console.error('Error in rate limit middleware:', error);
        monitoringService.trackError('weather_rate_limiter_middleware_error', error as Error);
        next();
      }
    };
  }

  /**
   * Close connection to Redis
   */
  public async close(): Promise<void> {
    if (this.redisClient) {
      try {
        await this.redisClient.quit();
        this.redisClient = null;
        this.isRedisConnected = false;
      } catch (error) {
        console.error('Error closing Redis connection:', error);
      }
    }
  }
}

export default WeatherRateLimiter;
