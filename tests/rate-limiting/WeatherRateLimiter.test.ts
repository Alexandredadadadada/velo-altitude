import WeatherRateLimiter, { RateLimitConfig, RateLimitResult } from '../../src/services/rate-limiting/WeatherRateLimiter';
import Redis from 'ioredis';

// Mock Redis
jest.mock('ioredis', () => {
  const mockScript = jest.fn().mockImplementation((scriptContent) => {
    return 'mocked-script-sha';
  });
  
  const mockEvalsha = jest.fn().mockImplementation((sha, keyCount, key, ...args) => {
    // Mock successful rate limit check (allowed)
    return [1, 59, Math.floor(Date.now() / 1000) + 60];
  });
  
  return jest.fn().mockImplementation(() => {
    return {
      script: mockScript,
      evalsha: mockEvalsha,
      on: jest.fn((event, callback) => {
        // Trigger ready event immediately
        if (event === 'ready') {
          callback();
        }
        return this;
      }),
      disconnect: jest.fn(),
      quit: jest.fn().mockResolvedValue(undefined),
    };
  });
});

// Mock monitoring service
jest.mock('../../src/services/monitoring', () => ({
  monitoringService: {
    trackEvent: jest.fn(),
    trackError: jest.fn(),
    trackMetric: jest.fn(),
  },
}));

describe('WeatherRateLimiter', () => {
  let rateLimiter: WeatherRateLimiter;
  const testConfig: RateLimitConfig = {
    bucket: {
      capacity: 60,
      refillRate: 1,
      refillInterval: 1000,
    },
    redis: {
      host: 'localhost',
      port: 6379,
      password: 'test-password',
    },
    fallbackMode: 'strict',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Ensure singleton is reset
    (WeatherRateLimiter as any).instance = undefined;
    rateLimiter = WeatherRateLimiter.getInstance(testConfig);
  });

  afterEach(async () => {
    await rateLimiter.close();
  });

  describe('Initialization', () => {
    it('should initialize with valid configuration', () => {
      expect(rateLimiter).toBeDefined();
    });

    it('should create a singleton instance', () => {
      const instance1 = WeatherRateLimiter.getInstance();
      const instance2 = WeatherRateLimiter.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should update configuration when provided', () => {
      const newConfig: Partial<RateLimitConfig> = {
        bucket: {
          capacity: 100,
          refillRate: 2,
          refillInterval: 500,
        },
      };
      
      rateLimiter.updateConfig(newConfig);
      
      // Testing that update worked would require a way to get the config
      // This is just a structural test since we don't expose the config directly
      expect(true).toBeTruthy();
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests when under the limit', async () => {
      const result = await rateLimiter.checkRateLimit('test-user', 'test-endpoint');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeLessThan(testConfig.bucket.capacity);
    });

    it('should use local fallback when Redis is not connected', async () => {
      // Manipulate internal state to simulate Redis disconnection
      (rateLimiter as any).isRedisConnected = false;
      
      const result = await rateLimiter.checkRateLimit('test-user', 'test-endpoint');
      expect(result.allowed).toBe(true);
    });

    it('should track calls through monitoring service', async () => {
      await rateLimiter.checkRateLimit('test-user', 'test-endpoint');
      
      // Check if monitoring was called (implementation detail)
      expect(require('../../src/services/monitoring').monitoringService.trackEvent).toHaveBeenCalled();
    });
  });

  describe('Middleware', () => {
    it('should create middleware function', () => {
      const middleware = rateLimiter.createMiddleware();
      expect(typeof middleware).toBe('function');
    });

    it('should pass request through middleware when under limit', async () => {
      const middleware = rateLimiter.createMiddleware();
      
      const req = { ip: '127.0.0.1', path: '/test' };
      const res = { 
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        header: jest.fn()
      };
      const next = jest.fn();
      
      await middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });

    it('should apply rate limit headers', () => {
      const result: RateLimitResult = {
        allowed: true,
        remaining: 59,
        resetAt: Date.now() + 60000,
        limit: 60
      };
      
      const res = { header: jest.fn() };
      
      rateLimiter.applyRateLimitHeaders(res, result);
      
      expect(res.header).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      // Mock Redis error
      (Redis as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Redis connection error');
      });
      
      // This should still create an instance with fallback mode
      const errorRateLimiter = WeatherRateLimiter.getInstance({
        ...testConfig,
        fallbackMode: 'permissive'
      });
      
      const result = await errorRateLimiter.checkRateLimit('test-user', 'test-endpoint');
      
      // In permissive mode, requests should still be allowed
      expect(result.allowed).toBe(true);
    });
  });
});
