const { expect } = require('chai');
const sinon = require('sinon');
const axios = require('axios');
const { DistributedCache } = require('../../utils/distributed-cache');
const ApiQuotaManager = require('../../utils/apiQuotaManager');
const OpenRouteService = require('../../services/openroute.service');

describe('OpenRouteService', () => {
  let openRouteService;
  let axiosStub;
  let cacheStub;
  let quotaManagerStub;
  let clock;

  beforeEach(() => {
    // Stub axios
    axiosStub = sinon.stub(axios, 'post');
    
    // Stub cache
    cacheStub = {
      get: sinon.stub(),
      set: sinon.stub(),
      getTTL: sinon.stub().returns(3600)
    };
    
    // Stub quota manager
    quotaManagerStub = {
      canMakeRequest: sinon.stub().returns(true),
      recordRequest: sinon.stub(),
      getQuotaStats: sinon.stub().returns({
        currentUsage: {
          dailyPercentage: 50,
          hourlyPercentage: 30
        },
        limits: {
          daily: 1000,
          hourly: 100
        },
        remaining: {
          daily: 500,
          hourly: 70
        }
      })
    };
    
    // Use fake timers
    clock = sinon.useFakeTimers();
    
    // Create instance with stubs
    openRouteService = new OpenRouteService({
      apiKey: 'test-api-key',
      cache: cacheStub,
      quotaManager: quotaManagerStub
    });
  });

  afterEach(() => {
    sinon.restore();
    clock.restore();
  });

  describe('getRoute', () => {
    it('should return cached route when available', async () => {
      const start = [48.8566, 2.3522];
      const end = [45.7640, 4.8357];
      const options = { profile: 'cycling-road' };
      const cachedRoute = {
        type: 'FeatureCollection',
        features: [/* route data */]
      };
      
      cacheStub.get.resolves(cachedRoute);
      
      const result = await openRouteService.getRoute(start, end, [], options);
      
      expect(cacheStub.get.called).to.be.true;
      expect(axiosStub.called).to.be.false;
      expect(result).to.deep.equal(cachedRoute);
    });

    it('should fetch and cache route when not in cache', async () => {
      const start = [48.8566, 2.3522];
      const end = [45.7640, 4.8357];
      const options = { profile: 'cycling-road' };
      const routeResponse = {
        data: {
          type: 'FeatureCollection',
          features: [/* route data */]
        }
      };
      
      cacheStub.get.resolves(null);
      axiosStub.resolves(routeResponse);
      
      const result = await openRouteService.getRoute(start, end, [], options);
      
      expect(cacheStub.get.called).to.be.true;
      expect(axiosStub.called).to.be.true;
      expect(cacheStub.set.called).to.be.true;
      expect(result).to.deep.equal(routeResponse.data);
    });

    it('should respect quota limits', async () => {
      const start = [48.8566, 2.3522];
      const end = [45.7640, 4.8357];
      
      quotaManagerStub.canMakeRequest.returns(false);
      
      try {
        await openRouteService.getRoute(start, end);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('API quota limit reached');
      }
      
      expect(axiosStub.called).to.be.false;
    });

    it('should handle API errors gracefully', async () => {
      const start = [48.8566, 2.3522];
      const end = [45.7640, 4.8357];
      
      cacheStub.get.resolves(null);
      axiosStub.rejects(new Error('API error'));
      
      try {
        await openRouteService.getRoute(start, end);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Failed to fetch route');
      }
      
      expect(openRouteService.metrics.failedRequests).to.equal(1);
    });

    it('should update metrics on success', async () => {
      const start = [48.8566, 2.3522];
      const end = [45.7640, 4.8357];
      const routeResponse = {
        data: {
          type: 'FeatureCollection',
          features: [/* route data */]
        }
      };
      
      cacheStub.get.resolves(null);
      axiosStub.resolves(routeResponse);
      
      await openRouteService.getRoute(start, end);
      
      expect(openRouteService.metrics.successfulRequests).to.equal(1);
      expect(openRouteService.metrics.lastResponseTimes.length).to.equal(1);
    });
  });

  describe('_calculateCacheTTL', () => {
    it('should adjust TTL based on quota usage', () => {
      const requestData = { profile: 'cycling-road', preference: 'recommended' };
      const stats = {
        currentUsage: {
          dailyPercentage: 95
        }
      };
      
      const ttl = openRouteService._calculateCacheTTL(requestData, stats);
      
      // Should use longer TTL when quota usage is high
      expect(ttl).to.be.greaterThan(24 * 60 * 60 * 1000);
    });

    it('should adjust TTL based on profile type', () => {
      const mountainRequestData = { profile: 'cycling-mountain', preference: 'recommended' };
      const roadRequestData = { profile: 'cycling-road', preference: 'recommended' };
      const stats = {
        currentUsage: {
          dailyPercentage: 50
        }
      };
      
      const mountainTTL = openRouteService._calculateCacheTTL(mountainRequestData, stats);
      const roadTTL = openRouteService._calculateCacheTTL(roadRequestData, stats);
      
      // Mountain routes should have longer TTL
      expect(mountainTTL).to.be.greaterThan(roadTTL);
    });

    it('should adjust TTL based on preference', () => {
      const fastestRequestData = { profile: 'cycling-road', preference: 'fastest' };
      const recommendedRequestData = { profile: 'cycling-road', preference: 'recommended' };
      const stats = {
        currentUsage: {
          dailyPercentage: 50
        }
      };
      
      const fastestTTL = openRouteService._calculateCacheTTL(fastestRequestData, stats);
      const recommendedTTL = openRouteService._calculateCacheTTL(recommendedRequestData, stats);
      
      // Fastest routes should have shorter TTL (more likely to change)
      expect(fastestTTL).to.be.lessThan(recommendedTTL);
    });
  });

  describe('_updateMetrics', () => {
    it('should update metrics on successful request', () => {
      openRouteService._updateMetrics(150, true);
      
      expect(openRouteService.metrics.totalRequests).to.equal(1);
      expect(openRouteService.metrics.successfulRequests).to.equal(1);
      expect(openRouteService.metrics.lastResponseTimes).to.deep.equal([150]);
      expect(openRouteService.metrics.averageResponseTime).to.equal(150);
    });

    it('should update metrics on failed request', () => {
      openRouteService._updateMetrics(150, false);
      
      expect(openRouteService.metrics.totalRequests).to.equal(1);
      expect(openRouteService.metrics.failedRequests).to.equal(1);
      expect(openRouteService.metrics.successfulRequests).to.equal(0);
    });

    it('should maintain a limited history of response times', () => {
      // Fill the response times array
      for (let i = 0; i < 101; i++) {
        openRouteService._updateMetrics(100 + i, true);
      }
      
      // Should only keep the last 100 entries
      expect(openRouteService.metrics.lastResponseTimes.length).to.equal(100);
      // First entry should be 101, not 100 (the oldest one was removed)
      expect(openRouteService.metrics.lastResponseTimes[0]).to.equal(101);
    });

    it('should calculate average response time correctly', () => {
      openRouteService._updateMetrics(100, true);
      openRouteService._updateMetrics(200, true);
      openRouteService._updateMetrics(300, true);
      
      // Average should be (100 + 200 + 300) / 3 = 200
      expect(openRouteService.metrics.averageResponseTime).to.equal(200);
    });
  });

  describe('_generateCacheKey', () => {
    it('should generate consistent cache keys', () => {
      const start = [48.8566, 2.3522];
      const end = [45.7640, 4.8357];
      const waypoints = [[47.2173, 1.5534]];
      const options = { profile: 'cycling-road', preference: 'recommended' };
      
      const key1 = openRouteService._generateCacheKey(start, end, waypoints, options);
      const key2 = openRouteService._generateCacheKey(start, end, waypoints, options);
      
      expect(key1).to.equal(key2);
    });

    it('should generate different keys for different routes', () => {
      const start1 = [48.8566, 2.3522];
      const end1 = [45.7640, 4.8357];
      const start2 = [48.8566, 2.3522];
      const end2 = [43.2965, 5.3698];
      
      const key1 = openRouteService._generateCacheKey(start1, end1);
      const key2 = openRouteService._generateCacheKey(start2, end2);
      
      expect(key1).to.not.equal(key2);
    });

    it('should generate different keys for different options', () => {
      const start = [48.8566, 2.3522];
      const end = [45.7640, 4.8357];
      const options1 = { profile: 'cycling-road' };
      const options2 = { profile: 'cycling-mountain' };
      
      const key1 = openRouteService._generateCacheKey(start, end, [], options1);
      const key2 = openRouteService._generateCacheKey(start, end, [], options2);
      
      expect(key1).to.not.equal(key2);
    });

    it('should handle waypoints correctly', () => {
      const start = [48.8566, 2.3522];
      const end = [45.7640, 4.8357];
      const waypoints1 = [[47.2173, 1.5534]];
      const waypoints2 = [[47.2173, 1.5534], [46.1591, 1.2635]];
      
      const key1 = openRouteService._generateCacheKey(start, end, waypoints1);
      const key2 = openRouteService._generateCacheKey(start, end, waypoints2);
      
      expect(key1).to.not.equal(key2);
    });
  });

  describe('getElevation', () => {
    it('should fetch elevation data for coordinates', async () => {
      const coordinates = [[48.8566, 2.3522], [45.7640, 4.8357]];
      const elevationResponse = {
        data: {
          results: [100, 200]
        }
      };
      
      axiosStub.resolves(elevationResponse);
      
      const result = await openRouteService.getElevation(coordinates);
      
      expect(axiosStub.called).to.be.true;
      expect(result).to.deep.equal([100, 200]);
    });

    it('should respect quota limits for elevation requests', async () => {
      const coordinates = [[48.8566, 2.3522], [45.7640, 4.8357]];
      
      quotaManagerStub.canMakeRequest.returns(false);
      
      try {
        await openRouteService.getElevation(coordinates);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('API quota limit reached');
      }
    });
  });

  describe('getMetrics', () => {
    it('should return current metrics', () => {
      openRouteService.metrics.totalRequests = 100;
      openRouteService.metrics.successfulRequests = 90;
      openRouteService.metrics.failedRequests = 10;
      openRouteService.metrics.averageResponseTime = 150;
      
      const metrics = openRouteService.getMetrics();
      
      expect(metrics.totalRequests).to.equal(100);
      expect(metrics.successfulRequests).to.equal(90);
      expect(metrics.failedRequests).to.equal(10);
      expect(metrics.successRate).to.equal(0.9);
      expect(metrics.averageResponseTime).to.equal(150);
    });
  });
});
