import { jest } from '@jest/globals';
import { EnhancedWeatherService } from '../../src/services/weather/enhanced-weather-service';

// Mock API service
jest.mock('../../src/services/api', () => ({
  ApiService: jest.fn().mockImplementation(() => ({
    registerAPI: jest.fn(),
    makeRequest: jest.fn(),
    getKey: jest.fn(),
    getRateLimit: jest.fn().mockReturnValue({ remaining: 100 }),
    updateUsage: jest.fn()
  }))
}));

// Mock cache service
jest.mock('../../src/services/cache', () => ({
  cacheService: {
    get: jest.fn(),
    set: jest.fn(),
    invalidate: jest.fn()
  }
}));

// Mock monitoring service
jest.mock('../../src/monitoring', () => ({
  default: {
    trackEvent: jest.fn(),
    trackError: jest.fn(),
    trackMetric: jest.fn(),
    logApiCall: jest.fn()
  }
}));

// Mock environment
jest.mock('../../src/config/environment', () => ({
  default: {
    weather: {
      rateLimiting: {
        capacity: 100,
        refillRate: 10,
        refillInterval: 1000,
        fallbackMode: 'permissive'
      },
      openweather: {
        apiKey: 'mock-openweather-key'
      },
      windy: {
        apiKey: 'mock-windy-key'
      }
    }
  }
}));

describe('Weather Service Fallback Tests', () => {
  let weatherService: EnhancedWeatherService;
  let apiServiceMock: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get reference to the mocked ApiService inside the weather service
    weatherService = new EnhancedWeatherService();
    apiServiceMock = (weatherService as any).apiService;
  });

  describe('OpenWeather to Windy Fallback', () => {
    it('should use OpenWeather as primary service when available', async () => {
      // Mock successful response from OpenWeather
      apiServiceMock.makeRequest.mockResolvedValueOnce({
        status: 200,
        data: { main: { temp: 20 }, weather: [{ description: 'sunny' }] }
      });

      const result = await weatherService.getCurrentWeather(48.8566, 2.3522);
      
      // Verify OpenWeather was called and result was processed
      expect(apiServiceMock.makeRequest).toHaveBeenCalledWith(
        'openweather',
        expect.any(String),
        expect.any(Object)
      );
      expect(result).toBeDefined();
      expect(result.temperature).toBe(20);
    });

    it('should fall back to Windy when OpenWeather API fails', async () => {
      // Mock OpenWeather failure
      apiServiceMock.makeRequest.mockImplementationOnce((provider: string) => {
        if (provider === 'openweather') {
          throw new Error('Service unavailable');
        }
      });
      
      // Mock successful Windy response
      apiServiceMock.makeRequest.mockImplementationOnce((provider: string) => {
        if (provider === 'windy') {
          return {
            status: 200,
            data: { 
              current: { temperature: 22 },
              current_weather: { weathercode: 0 }
            }
          };
        }
      });

      const result = await weatherService.getCurrentWeather(48.8566, 2.3522);
      
      // Verify fallback to Windy occurred
      expect(apiServiceMock.makeRequest).toHaveBeenCalledWith(
        'windy',
        expect.any(String),
        expect.any(Object)
      );
      expect(result).toBeDefined();
      expect(result.temperature).toBe(22);
    });
    
    it('should fall back to Windy when OpenWeather rate limit is exceeded', async () => {
      // Mock rate limit for OpenWeather
      apiServiceMock.getRateLimit.mockImplementationOnce((provider: string) => {
        if (provider === 'openweather') {
          return { remaining: 0 };
        }
        return { remaining: 100 };
      });

      // Mock successful Windy response
      apiServiceMock.makeRequest.mockImplementationOnce((provider: string) => {
        if (provider === 'windy') {
          return {
            status: 200,
            data: { 
              current: { temperature: 22 },
              current_weather: { weathercode: 0 }
            }
          };
        }
      });

      const result = await weatherService.getCurrentWeather(48.8566, 2.3522);
      
      // Verify OpenWeather was skipped and Windy was used
      expect(apiServiceMock.makeRequest).not.toHaveBeenCalledWith(
        'openweather',
        expect.any(String),
        expect.any(Object)
      );
      expect(apiServiceMock.makeRequest).toHaveBeenCalledWith(
        'windy',
        expect.any(String),
        expect.any(Object)
      );
      expect(result).toBeDefined();
      expect(result.temperature).toBe(22);
    });
    
    it('should provide degraded service when all weather providers fail', async () => {
      // Mock all providers failing
      apiServiceMock.makeRequest.mockImplementation(() => {
        throw new Error('All services unavailable');
      });

      // Set up cache to return no cached data
      const cacheService = require('../../src/services/cache').cacheService;
      cacheService.get.mockResolvedValue(null);

      try {
        await weatherService.getCurrentWeather(48.8566, 2.3522);
        fail('Should have thrown an error when all providers fail');
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as Error).message).toContain('All weather providers failed');
      }
      
      // Verify monitoring was called to track the complete failure
      const monitoring = require('../../src/monitoring').default;
      expect(monitoring.trackError).toHaveBeenCalled();
    });
    
    it('should handle API response format inconsistencies between providers', async () => {
      // Mock OpenWeather failure
      apiServiceMock.makeRequest.mockImplementationOnce((provider: string) => {
        if (provider === 'openweather') {
          throw new Error('Service unavailable');
        }
      });
      
      // Mock Windy response with different format
      apiServiceMock.makeRequest.mockImplementationOnce((provider: string) => {
        if (provider === 'windy') {
          return {
            status: 200,
            data: { 
              // Different format than OpenWeather
              temperature: 22,
              weatherCode: 0,
              windSpeed: 5
            }
          };
        }
      });

      const result = await weatherService.getCurrentWeather(48.8566, 2.3522);
      
      // Verify the service normalized the different response formats
      expect(result).toBeDefined();
      expect(result).toHaveProperty('temperature');
      expect(result).toHaveProperty('weather');
      expect(result).toHaveProperty('wind');
    });

    it('should respect cache settings when using fallback provider', async () => {
      // Mock cache miss for initial request
      const cacheService = require('../../src/services/cache').cacheService;
      cacheService.get.mockResolvedValue(null);
      
      // Mock OpenWeather failure
      apiServiceMock.makeRequest.mockImplementationOnce((provider: string) => {
        if (provider === 'openweather') {
          throw new Error('Service unavailable');
        }
      });
      
      // Mock successful Windy response
      apiServiceMock.makeRequest.mockImplementationOnce((provider: string) => {
        if (provider === 'windy') {
          return {
            status: 200,
            data: { temperature: 22, weatherCode: 0 }
          };
        }
      });

      await weatherService.getCurrentWeather(48.8566, 2.3522);
      
      // Verify result was cached with appropriate metadata
      expect(cacheService.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          provider: 'windy',
          ttl: expect.any(Number)
        })
      );
      
      // Verify the TTL for fallback provider is correct
      // Windy should have a longer cache duration (1 hour vs 30 minutes)
      const ttlArg = cacheService.set.mock.calls[0][2].ttl;
      expect(ttlArg).toBeGreaterThanOrEqual(60 * 60); // At least 1 hour in seconds
    });
  });
});
