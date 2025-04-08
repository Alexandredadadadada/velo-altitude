import { jest } from '@jest/globals';
import { Redis } from 'ioredis';
import { WeatherCache } from '../../src/services/cache/WeatherCache';

// Mock Redis client
jest.mock('ioredis');
const MockRedis = Redis as jest.MockedClass<typeof Redis>;

// Mock monitoring service
jest.mock('../../src/monitoring', () => ({
  __esModule: true,
  default: {
    trackEvent: jest.fn(),
    trackError: jest.fn(),
    trackMetric: jest.fn()
  }
}));

describe('WeatherCache', () => {
  let weatherCache: WeatherCache;
  let mockRedisInstance: any;

  // Setup for each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup Redis mock implementation
    mockRedisInstance = {
      on: jest.fn(),
      set: jest.fn().mockResolvedValue('OK'),
      get: jest.fn().mockResolvedValue(null),
      del: jest.fn().mockResolvedValue(1),
      keys: jest.fn().mockResolvedValue([]),
      quit: jest.fn().mockResolvedValue('OK'),
      pexpire: jest.fn().mockResolvedValue(1)
    };
    
    MockRedis.mockImplementation(() => mockRedisInstance);
  });

  afterEach(async () => {
    if (weatherCache) {
      await weatherCache.close();
    }
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      weatherCache = new WeatherCache();
      expect(MockRedis).toHaveBeenCalled();
      expect(mockRedisInstance.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should initialize with custom configuration', () => {
      const customConfig = {
        ttl: {
          current: 300,
          forecast: 600,
          historical: 3600,
          mountainPass: 900
        },
        limits: {
          maxEntries: 500,
          maxSize: 25 * 1024 * 1024
        }
      };

      weatherCache = new WeatherCache(customConfig);
      expect(MockRedis).toHaveBeenCalled();
    });

    it('should handle Redis initialization error gracefully', () => {
      MockRedis.mockImplementationOnce(() => {
        throw new Error('Connection error');
      });

      weatherCache = new WeatherCache();
      // Should not throw and should continue without Redis
    });
  });

  describe('Cache Operations', () => {
    beforeEach(() => {
      weatherCache = new WeatherCache();
    });

    describe('get', () => {
      it('should return null for non-existent key', async () => {
        const result = await weatherCache.get('non-existent-key');
        expect(result).toBeNull();
      });

      it('should retrieve data from memory cache', async () => {
        const testData = { temperature: 25 };
        
        // First set the data
        await weatherCache.set('current:paris', testData, {
          type: 'current',
          provider: 'openweather'
        });
        
        // Then retrieve it
        const result = await weatherCache.get('current:paris');
        expect(result).toEqual(testData);
      });

      it('should retrieve data from Redis if not in memory', async () => {
        const testData = { temperature: 28 };
        mockRedisInstance.get.mockResolvedValueOnce(JSON.stringify({
          data: testData,
          timestamp: Date.now(),
          expiry: Date.now() + 10000,
          type: 'current',
          provider: 'openweather',
          size: JSON.stringify(testData).length
        }));
        
        const result = await weatherCache.get('current:london');
        expect(result).toEqual(testData);
      });

      it('should return null for expired cache item', async () => {
        const testData = { temperature: 22 };
        
        // Set with a very short TTL
        await weatherCache.set('current:nyc', testData, {
          type: 'current',
          provider: 'openweather',
          ttl: 1 // 1 second TTL
        });
        
        // Wait for expiration
        await new Promise(resolve => setTimeout(resolve, 1100));
        
        const result = await weatherCache.get('current:nyc');
        expect(result).toBeNull();
      });
    });

    describe('set', () => {
      it('should store data in memory cache', async () => {
        const testData = { temperature: 30 };
        
        const result = await weatherCache.set('current:tokyo', testData, {
          type: 'current',
          provider: 'openweather'
        });
        
        expect(result).toBe(true);
        
        // Verify it was stored
        const cachedData = await weatherCache.get('current:tokyo');
        expect(cachedData).toEqual(testData);
      });

      it('should store data in Redis when available', async () => {
        const testData = { temperature: 32 };
        
        await weatherCache.set('current:singapore', testData, {
          type: 'current',
          provider: 'openweather'
        });
        
        expect(mockRedisInstance.set).toHaveBeenCalled();
        expect(mockRedisInstance.pexpire).toHaveBeenCalled();
      });

      it('should use appropriate TTL based on data type', async () => {
        // Test current weather TTL
        await weatherCache.set('current:berlin', { temperature: 20 }, {
          type: 'current',
          provider: 'openweather'
        });
        
        // Test forecast TTL
        await weatherCache.set('forecast:berlin', { forecast: [1, 2, 3] }, {
          type: 'forecast',
          provider: 'openweather'
        });
        
        // Test mountain pass TTL
        await weatherCache.set('mountainPass:alps', { snow: 10 }, {
          type: 'mountainPass',
          provider: 'openweather'
        });
        
        // Verify different TTLs were used by checking Redis pexpire calls
        expect(mockRedisInstance.pexpire).toHaveBeenCalledTimes(3);
      });

      it('should handle custom TTL', async () => {
        const customTtl = 7200; // 2 hours
        
        await weatherCache.set('custom:paris', { data: 'custom' }, {
          type: 'current', // Standard type but with custom TTL
          provider: 'openweather',
          ttl: customTtl
        });
        
        // Should use the custom TTL for Redis
        expect(mockRedisInstance.pexpire).toHaveBeenCalledWith(
          expect.any(String),
          customTtl * 1000
        );
      });
    });

    describe('delete', () => {
      it('should delete item from memory cache', async () => {
        // Add test data
        const testData = { temperature: 18 };
        await weatherCache.set('current:rome', testData, {
          type: 'current',
          provider: 'openweather'
        });
        
        // Verify it exists
        expect(await weatherCache.get('current:rome')).toEqual(testData);
        
        // Delete it
        await weatherCache.delete('current:rome');
        
        // Verify it's gone
        expect(await weatherCache.get('current:rome')).toBeNull();
      });

      it('should delete item from Redis cache', async () => {
        // Add test data
        await weatherCache.set('current:madrid', { temperature: 35 }, {
          type: 'current',
          provider: 'openweather'
        });
        
        // Delete it
        await weatherCache.delete('current:madrid');
        
        // Verify Redis delete was called
        expect(mockRedisInstance.del).toHaveBeenCalled();
      });
    });

    describe('invalidateByPattern', () => {
      beforeEach(async () => {
        // Setup test data
        await weatherCache.set('current:paris', { temp: 20 }, { type: 'current', provider: 'openweather' });
        await weatherCache.set('current:london', { temp: 15 }, { type: 'current', provider: 'openweather' });
        await weatherCache.set('forecast:paris', { forecast: [1, 2, 3] }, { type: 'forecast', provider: 'openweather' });
        await weatherCache.set('current:madrid', { temp: 30 }, { type: 'current', provider: 'windy' });
      });

      it('should invalidate all items matching a pattern', async () => {
        // Mock Redis keys response
        mockRedisInstance.keys.mockResolvedValueOnce([
          'weather_cache:current:paris',
          'weather_cache:current:london'
        ]);
        
        // Invalidate all current weather
        await weatherCache.invalidateByPattern('current:*');
        
        // Verify they are gone from memory cache
        expect(await weatherCache.get('current:paris')).toBeNull();
        expect(await weatherCache.get('current:london')).toBeNull();
        
        // But forecast should still be there
        expect(await weatherCache.get('forecast:paris')).not.toBeNull();
      });

      it('should invalidate by provider pattern', async () => {
        // Setup Redis keys response
        mockRedisInstance.keys.mockResolvedValueOnce([
          'weather_cache:current:madrid'
        ]);
        
        // Invalidate all windy provider data
        await weatherCache.invalidateByPattern('*:windy');
        
        // Verify windy data is gone
        expect(await weatherCache.get('current:madrid')).toBeNull();
        
        // But openweather data should remain
        expect(await weatherCache.get('current:paris')).not.toBeNull();
        expect(await weatherCache.get('current:london')).not.toBeNull();
      });
    });

    describe('Cache Statistics', () => {
      it('should track cache hits and misses', async () => {
        // Add test data
        await weatherCache.set('current:stats-test', { temp: 25 }, {
          type: 'current',
          provider: 'openweather'
        });
        
        // Hit memory cache
        await weatherCache.get('current:stats-test');
        
        // Miss
        await weatherCache.get('non-existent');
        
        // Get stats
        const stats = weatherCache.getStats();
        
        expect(stats.hits.memory).toBe(1);
        expect(stats.hits.miss).toBe(1);
      });

      it('should report correct cache size', async () => {
        // Add test data of known size
        const testData = { data: 'X'.repeat(1000) }; // 1KB approx
        
        await weatherCache.set('sizeable:item', testData, {
          type: 'current',
          provider: 'openweather'
        });
        
        const stats = weatherCache.getStats();
        
        // Size should be tracked
        expect(stats.size).toBeGreaterThan(0);
        expect(stats.entries).toBe(1);
      });
    });
  });

  describe('Cache Eviction', () => {
    it('should evict oldest entries when reaching entry limit', async () => {
      // Create cache with small limits for testing
      weatherCache = new WeatherCache({
        limits: {
          maxEntries: 2,
          maxSize: 1024 * 1024
        }
      });
      
      // Add test data
      await weatherCache.set('eviction:test1', { data: 1 }, {
        type: 'current',
        provider: 'openweather'
      });
      
      await weatherCache.set('eviction:test2', { data: 2 }, {
        type: 'current',
        provider: 'openweather'
      });
      
      // This should trigger eviction of test1
      await weatherCache.set('eviction:test3', { data: 3 }, {
        type: 'current',
        provider: 'openweather'
      });
      
      // Verify test1 was evicted
      expect(await weatherCache.get('eviction:test1')).toBeNull();
      expect(await weatherCache.get('eviction:test2')).not.toBeNull();
      expect(await weatherCache.get('eviction:test3')).not.toBeNull();
    });

    it('should evict by size when reaching size limit', async () => {
      // Create cache with small size limit
      weatherCache = new WeatherCache({
        limits: {
          maxEntries: 100, // High entry limit
          maxSize: 2000 // Very small size limit (2KB)
        }
      });
      
      // Add large item (1KB)
      await weatherCache.set('size:test1', { data: 'X'.repeat(1000) }, {
        type: 'current',
        provider: 'openweather'
      });
      
      // Add another large item (1KB)
      await weatherCache.set('size:test2', { data: 'Y'.repeat(1000) }, {
        type: 'current',
        provider: 'openweather'
      });
      
      // This should trigger size-based eviction
      await weatherCache.set('size:test3', { data: 'Z'.repeat(1000) }, {
        type: 'current',
        provider: 'openweather'
      });
      
      // Verify oldest items were evicted
      const stats = weatherCache.getStats();
      expect(stats.size).toBeLessThan(2000); // Size should be under limit after eviction
    });
  });

  describe('Pattern Matching', () => {
    it('should match simple wildcard patterns', () => {
      weatherCache = new WeatherCache();
      
      // We need to test the private method, which we can't directly access
      // Instead we'll test through invalidateByPattern with mock cache entries
      
      // Setup test data
      weatherCache.set('test:paris:current', { temp: 20 }, { type: 'current', provider: 'openweather' });
      weatherCache.set('test:london:forecast', { forecast: [1,2,3] }, { type: 'forecast', provider: 'openweather' });
      weatherCache.set('test:berlin:historical', { history: [1,2,3] }, { type: 'historical', provider: 'windy' });
      
      // Match all paris data
      weatherCache.invalidateByPattern('test:paris:*');
      expect(weatherCache.get('test:paris:current')).resolves.toBeNull();
      expect(weatherCache.get('test:london:forecast')).resolves.not.toBeNull();
      
      // Match all forecast data
      weatherCache.invalidateByPattern('test:*:forecast');
      expect(weatherCache.get('test:london:forecast')).resolves.toBeNull();
      expect(weatherCache.get('test:berlin:historical')).resolves.not.toBeNull();
      
      // Match all remaining data
      weatherCache.invalidateByPattern('test:*');
      expect(weatherCache.get('test:berlin:historical')).resolves.toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle Redis errors gracefully during get', async () => {
      weatherCache = new WeatherCache();
      
      // Set up Redis get to throw an error
      mockRedisInstance.get.mockRejectedValueOnce(new Error('Redis error'));
      
      // Should fall back to null instead of throwing
      const result = await weatherCache.get('error:test');
      expect(result).toBeNull();
    });

    it('should handle Redis errors gracefully during set', async () => {
      weatherCache = new WeatherCache();
      
      // Set up Redis set to throw an error
      mockRedisInstance.set.mockRejectedValueOnce(new Error('Redis error'));
      
      // Should not throw but return false
      const result = await weatherCache.set('error:test', { data: 'test' }, {
        type: 'current',
        provider: 'openweather'
      });
      
      // Memory cache should still work despite Redis error
      expect(result).toBe(true);
      expect(await weatherCache.get('error:test')).not.toBeNull();
    });
  });
});
