/**
 * Tests for WeatherRateLimiter
 * 
 * Tests the token bucket algorithm implementation
 * for rate limiting weather API requests.
 */

import { Redis } from 'ioredis';
import { WeatherRateLimiter, RateLimitExceededError, TokenBucketConfig } from '../WeatherRateLimiter';
import monitoringService from '../../../monitoring';

// Mock Redis
jest.mock('ioredis');
const MockRedis = Redis as jest.MockedClass<typeof Redis>;

// Mock monitoring service
jest.mock('../../../monitoring', () => ({
  __esModule: true,
  default: {
    trackEvent: jest.fn(),
    trackError: jest.fn(),
    trackMetric: jest.fn()
  }
}));

describe('WeatherRateLimiter', () => {
  let rateLimiter: WeatherRateLimiter;
  let mockRedis: jest.Mocked<Redis>;
  
  // Test bucket configuration
  const testConfig: TokenBucketConfig = {
    capacity: 10,
    refillRate: 1,
    refillInterval: 1000
  };
  
  // Sample bucket data for tests
  const sampleBucketData = {
    tokens: '5',
    lastRefill: '1649500000000', // Some fixed timestamp
    capacity: '10',
    refillRate: '1',
    refillInterval: '1000'
  };
  
  beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks();
    
    // Setup Redis mock
    mockRedis = {
      exists: jest.fn(),
      hgetall: jest.fn(),
      hset: jest.fn(),
      expire: jest.fn(),
      multi: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
      quit: jest.fn(),
    } as unknown as jest.Mocked<Redis>;
    
    // Make the mock Redis constructor return our mock instance
    MockRedis.mockImplementation(() => mockRedis);
    
    // Create rate limiter with test config
    rateLimiter = new WeatherRateLimiter(testConfig);
  });
  
  afterEach(async () => {
    // Clean up
    await rateLimiter.close();
  });
  
  describe('initialization', () => {
    it('should initialize with default configuration when none provided', () => {
      const defaultLimiter = new WeatherRateLimiter();
      expect(MockRedis).toHaveBeenCalled();
      expect(monitoringService.trackEvent).toHaveBeenCalledWith(
        'weather_rate_limiter_initialized',
        expect.any(Object)
      );
    });
    
    it('should initialize with provided configuration', () => {
      expect(MockRedis).toHaveBeenCalled();
      expect(monitoringService.trackEvent).toHaveBeenCalledWith(
        'weather_rate_limiter_initialized',
        expect.objectContaining({ config: testConfig })
      );
    });
    
    it('should throw error if Redis connection fails', () => {
      MockRedis.mockImplementationOnce(() => {
        throw new Error('Redis connection failed');
      });
      
      expect(() => new WeatherRateLimiter(testConfig)).toThrow('Failed to initialize Redis connection');
      expect(monitoringService.trackError).toHaveBeenCalledWith(
        'weather_rate_limiter_redis_connection_failed',
        expect.any(Error)
      );
    });
  });
  
  describe('consumeToken', () => {
    it('should initialize bucket for new user and consume token', async () => {
      // Mock non-existent bucket
      mockRedis.exists.mockResolvedValue(0);
      
      // Call consumeToken
      const result = await rateLimiter.consumeToken('user123');
      
      // Verify bucket initialization
      expect(mockRedis.exists).toHaveBeenCalledWith('weather_rate_limit:user123');
      expect(mockRedis.hset).toHaveBeenCalled();
      expect(mockRedis.expire).toHaveBeenCalled();
      expect(monitoringService.trackEvent).toHaveBeenCalledWith(
        'weather_rate_limiter_new_bucket',
        expect.objectContaining({ userId: 'user123' })
      );
      
      // Verify result
      expect(result).toBe(true);
    });
    
    it('should consume token from existing bucket', async () => {
      // Mock existing bucket
      mockRedis.exists.mockResolvedValue(1);
      mockRedis.hgetall.mockResolvedValue(sampleBucketData);
      
      // Call consumeToken
      const result = await rateLimiter.consumeToken('user123');
      
      // Verify bucket update
      expect(mockRedis.exists).toHaveBeenCalledWith('weather_rate_limit:user123');
      expect(mockRedis.hgetall).toHaveBeenCalledWith('weather_rate_limit:user123');
      expect(mockRedis.hset).toHaveBeenCalled();
      
      // Verify result
      expect(result).toBe(true);
      expect(monitoringService.trackMetric).toHaveBeenCalledWith(
        'weather_rate_limiter_tokens_remaining',
        expect.any(Number),
        expect.any(Object)
      );
    });
    
    it('should handle token cost greater than 1', async () => {
      // Mock existing bucket
      mockRedis.exists.mockResolvedValue(1);
      mockRedis.hgetall.mockResolvedValue(sampleBucketData);
      
      // Call consumeToken with higher cost
      const result = await rateLimiter.consumeToken('user123', 3);
      
      // Verify bucket update with correct token consumption
      expect(mockRedis.hset).toHaveBeenCalled();
      expect(result).toBe(true);
    });
    
    it('should throw RateLimitExceededError when not enough tokens', async () => {
      // Mock existing bucket with low tokens
      mockRedis.exists.mockResolvedValue(1);
      mockRedis.hgetall.mockResolvedValue({
        ...sampleBucketData,
        tokens: '0.5' // Not enough for even 1 token
      });
      
      // Call consumeToken and expect error
      await expect(rateLimiter.consumeToken('user123')).rejects.toThrow(RateLimitExceededError);
      
      // Verify rate limit exceeded event
      expect(monitoringService.trackEvent).toHaveBeenCalledWith(
        'weather_rate_limiter_exceeded',
        expect.any(Object)
      );
    });
    
    it('should allow request on Redis failure (fail open)', async () => {
      // Mock Redis error
      mockRedis.exists.mockRejectedValue(new Error('Redis error'));
      
      // Call consumeToken
      const result = await rateLimiter.consumeToken('user123');
      
      // Verify error tracking
      expect(monitoringService.trackError).toHaveBeenCalledWith(
        'weather_rate_limiter_consume_error',
        expect.any(Error),
        expect.any(Object)
      );
      
      // Verify fail-open behavior (allow request)
      expect(result).toBe(true);
    });
  });
  
  describe('getRateLimitInfo', () => {
    it('should return full capacity for new users', async () => {
      // Mock non-existent bucket
      mockRedis.exists.mockResolvedValue(0);
      
      // Call getRateLimitInfo
      const info = await rateLimiter.getRateLimitInfo('user123');
      
      // Verify results
      expect(info.allowed).toBe(true);
      expect(info.remaining).toBe(testConfig.capacity);
      expect(info.resetTime).toBeDefined();
    });
    
    it('should return correct information for existing buckets', async () => {
      // Mock existing bucket
      mockRedis.exists.mockResolvedValue(1);
      mockRedis.hgetall.mockResolvedValue(sampleBucketData);
      
      // Call getRateLimitInfo
      const info = await rateLimiter.getRateLimitInfo('user123');
      
      // Verify results
      expect(info.allowed).toBe(true);
      expect(info.remaining).toBeDefined();
      expect(info.resetTime).toBeDefined();
    });
    
    it('should handle Redis failures gracefully', async () => {
      // Mock Redis error
      mockRedis.exists.mockRejectedValue(new Error('Redis error'));
      
      // Call getRateLimitInfo
      const info = await rateLimiter.getRateLimitInfo('user123');
      
      // Verify error tracking
      expect(monitoringService.trackError).toHaveBeenCalledWith(
        'weather_rate_limiter_info_error',
        expect.any(Error),
        expect.any(Object)
      );
      
      // Verify fail-open behavior (allow request)
      expect(info.allowed).toBe(true);
      expect(info.remaining).toBe(testConfig.capacity);
    });
  });
  
  describe('applyRateLimitHeaders', () => {
    it('should apply correct headers to response', () => {
      // Mock response object
      const res = { set: jest.fn() };
      
      // Sample rate limit result
      const result = {
        allowed: true,
        remaining: 8,
        resetTime: Date.now() + 5000
      };
      
      // Apply headers
      rateLimiter.applyRateLimitHeaders(res, result);
      
      // Verify headers
      expect(res.set).toHaveBeenCalledWith('X-RateLimit-Limit', '10');
      expect(res.set).toHaveBeenCalledWith('X-RateLimit-Remaining', '8');
      expect(res.set).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(String));
    });
    
    it('should add Retry-After header when rate limited', () => {
      // Mock response object
      const res = { set: jest.fn() };
      
      // Sample rate limit result (exceeded)
      const result = {
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 5000,
        retryAfter: 5
      };
      
      // Apply headers
      rateLimiter.applyRateLimitHeaders(res, result);
      
      // Verify headers including Retry-After
      expect(res.set).toHaveBeenCalledWith('Retry-After', '5');
    });
    
    it('should handle invalid response object gracefully', () => {
      // Call with invalid response
      expect(() => {
        rateLimiter.applyRateLimitHeaders(null, {
          allowed: true,
          remaining: 8,
          resetTime: Date.now()
        });
      }).not.toThrow();
    });
  });
  
  describe('close', () => {
    it('should quit Redis connection', async () => {
      // Close rate limiter
      await rateLimiter.close();
      
      // Verify Redis quit was called
      expect(mockRedis.quit).toHaveBeenCalled();
    });
    
    it('should handle errors when closing', async () => {
      // Mock error on quit
      mockRedis.quit.mockRejectedValue(new Error('Quit error'));
      
      // Close rate limiter
      await rateLimiter.close();
      
      // Verify error tracking
      expect(monitoringService.trackError).toHaveBeenCalledWith(
        'weather_rate_limiter_close_error',
        expect.any(Error)
      );
    });
  });
});
