/**
 * Tests for ElevationService
 * 
 * These tests verify the functionality of the ElevationService,
 * including API integration, rate limiting, and fallback mechanisms.
 */

import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { Redis } from 'ioredis';
import { ElevationService } from '../../src/services/elevation/ElevationService';
import { RateLimitExceededError } from '../../src/services/weather/rate-limiting';

// Mock dependencies
jest.mock('ioredis');
jest.mock('../../src/monitoring', () => ({
  trackEvent: jest.fn(),
  trackApiCall: jest.fn(),
  trackError: jest.fn()
}));

describe('ElevationService', () => {
  let elevationService: ElevationService;
  let mockAxios: MockAdapter;
  const sampleCoordinates: [number, number][] = [
    [6.8667, 45.9167], // Chamonix
    [6.8701, 45.9215],
    [6.8733, 45.9250],
    [6.8764, 45.9298],
    [6.8816, 45.9336]  // End point
  ];
  
  const mockElevationResponse = {
    geometry: [
      { longitude: 6.8667, latitude: 45.9167, elevation: 1035 },
      { longitude: 6.8701, latitude: 45.9215, elevation: 1050 },
      { longitude: 6.8733, latitude: 45.9250, elevation: 1080 },
      { longitude: 6.8764, latitude: 45.9298, elevation: 1110 },
      { longitude: 6.8816, latitude: 45.9336, elevation: 1150 }
    ]
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock Axios
    mockAxios = new MockAdapter(axios);
    
    // Mock successful OpenRoute API response
    mockAxios.onPost(/.*\/v2\/elevation\/line/).reply(200, mockElevationResponse);
    
    // Create service instance with mocked Redis
    elevationService = new ElevationService();
    
    // Mock Redis methods
    const MockRedis = Redis as jest.MockedClass<typeof Redis>;
    MockRedis.prototype.eval.mockImplementation((script, keyCount, key, ...args) => {
      // Mock successful rate limit check
      return Promise.resolve([1, 39, Date.now() + 60000, 0]);
    });
  });

  afterEach(() => {
    mockAxios.restore();
  });

  test('should retrieve elevation data from OpenRoute API', async () => {
    const result = await elevationService.getElevationProfile(sampleCoordinates);
    
    // Check profile structure
    expect(result).toHaveProperty('points');
    expect(result).toHaveProperty('totalAscent');
    expect(result).toHaveProperty('totalDescent');
    expect(result).toHaveProperty('minElevation');
    expect(result).toHaveProperty('maxElevation');
    
    // Check that we have the correct number of points
    expect(result.points.length).toBe(5);
    
    // Check elevation statistics
    expect(result.totalAscent).toBe(115); // 1150 - 1035
    expect(result.minElevation).toBe(1035);
    expect(result.maxElevation).toBe(1150);
  });

  test('should respect rate limits', async () => {
    // Mock rate limit exceeded
    const MockRedis = Redis as jest.MockedClass<typeof Redis>;
    MockRedis.prototype.eval.mockImplementation((script, keyCount, key, ...args) => {
      return Promise.resolve([0, 0, Date.now() + 60000, 10]);
    });
    
    // Attempt to get elevation data
    await expect(
      elevationService.getElevationProfile(sampleCoordinates, 'test-user-123')
    ).rejects.toThrow(RateLimitExceededError);
  });

  test('should fall back to Mapbox when OpenRoute fails', async () => {
    // Mock OpenRoute API failure
    mockAxios.onPost(/.*\/v2\/elevation\/line/).reply(500, { error: 'Service unavailable' });
    
    // Mock successful Mapbox response
    mockAxios.onGet(/.*mapbox.terrain-rgb.*/).reply(200, {
      features: sampleCoordinates.map((coord, index) => ({
        geometry: {
          coordinates: coord
        },
        properties: {
          ele: 1000 + index * 20 // Mock elevations: 1000, 1020, 1040, 1060, 1080
        }
      }))
    });
    
    // Should not throw but return a fallback elevation profile
    const result = await elevationService.getElevationProfile(sampleCoordinates);
    
    // Even if fallback doesn't have full data, it should return a valid structure
    expect(result).toHaveProperty('points');
    expect(result).toHaveProperty('totalAscent');
    expect(result).toHaveProperty('totalDescent');
  });

  test('should handle Redis connection failures gracefully', async () => {
    // Mock Redis connection failure
    const MockRedis = Redis as jest.MockedClass<typeof Redis>;
    MockRedis.prototype.eval.mockImplementation(() => {
      throw new Error('Redis connection failed');
    });
    
    // Should not throw but bypass rate limiting
    const result = await elevationService.getElevationProfile(sampleCoordinates);
    
    // Should still get valid elevation data
    expect(result.points.length).toBe(5);
  });

  test('should classify gradients correctly', async () => {
    const result = await elevationService.getElevationProfile(sampleCoordinates);
    
    // Segments should be identified and classified
    expect(result.segments).toBeDefined();
    expect(result.segments!.length).toBeGreaterThan(0);
    
    // Check that segment has proper classification
    const segment = result.segments![0];
    expect(segment).toHaveProperty('classification');
    
    // Classification should be one of the defined values
    expect(['easy', 'moderate', 'challenging', 'difficult', 'extreme']).toContain(
      segment.classification
    );
  });
});
