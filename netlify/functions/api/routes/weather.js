/**
 * Weather Routes for Velo-Altitude API
 * 
 * Provides endpoints for weather data optimized for cyclists
 * Implements caching and performance optimizations
 */

const express = require('express');
const router = express.Router();
const weatherService = require('../services/weatherService');
const { securityHeaders, validateInput, rateLimiter } = require('../../../utils/securityMiddleware');
const cache = require('../../../utils/cacheService');
const monitoringService = require('../../../utils/monitoringService');

// Authentication middleware
const requireAuth = require('../middleware/requireAuth');

// Apply security headers to all routes
router.use(securityHeaders());

// Apply rate limiting to all routes
router.use(rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per windowMs
  keyGenerator: (req) => req.user ? `weather:${req.user.id}` : `weather:${req.ip}`,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      requestId: req.requestId
    });
  }
}));

/**
 * Get current weather by coordinates
 * GET /api/v1/weather/current
 */
router.get('/current', validateInput({
  query: {
    lat: { type: 'number', required: true },
    lon: { type: 'number', required: true },
    units: { type: 'string', enum: ['metric', 'imperial'], default: 'metric' }
  }
}), async (req, res) => {
  try {
    const { lat, lon, units } = req.query;
    
    // Generate cache key
    const cacheKey = `weather:current:${lat},${lon}:${units}`;
    
    // Check response cache
    const cachedResponse = cache.get(cacheKey, 'api:responses');
    
    if (cachedResponse) {
      return res.status(200).json(cachedResponse);
    }
    
    // Get weather data
    const weatherData = await weatherService.getWeather(
      parseFloat(lat),
      parseFloat(lon),
      { 
        includeHourly: true,
        includeDaily: true,
        units
      }
    );
    
    // Format response
    const response = {
      current: weatherData.current,
      hourly: weatherData.hourly.slice(0, 24), // Next 24 hours
      daily: weatherData.daily.slice(0, 7), // Next 7 days
      recommendations: weatherData.recommendations,
      alerts: weatherData.alerts || []
    };
    
    // Cache response
    cache.set(cacheKey, response, {
      ttl: 30 * 60 * 1000, // 30 minutes
      segment: 'api:responses'
    });
    
    res.status(200).json(response);
  } catch (error) {
    console.error('[Weather API] Error getting current weather:', error);
    
    monitoringService.recordError({
      type: 'api_error',
      endpoint: '/api/v1/weather/current',
      message: error.message,
      requestId: req.requestId
    });
    
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to get weather data',
      requestId: req.requestId
    });
  }
});

/**
 * Get weather forecast for a route
 * POST /api/v1/weather/route
 */
router.post('/route', requireAuth({ optional: true }), validateInput({
  body: {
    waypoints: { 
      type: 'array', 
      required: true,
      items: {
        type: 'object',
        properties: {
          lat: { type: 'number', required: true },
          lng: { type: 'number', required: true }
        }
      }
    }
  }
}), async (req, res) => {
  try {
    const { waypoints } = req.body;
    
    // Generate cache key based on start and end points
    const start = waypoints[0];
    const end = waypoints[waypoints.length - 1];
    const cacheKey = `weather:route:${start.lat},${start.lng}:${end.lat},${end.lng}`;
    
    // Check response cache
    const cachedResponse = cache.get(cacheKey, 'api:responses');
    
    if (cachedResponse) {
      return res.status(200).json(cachedResponse);
    }
    
    // Get route weather
    const routeWeather = await weatherService.getRouteWeather(waypoints);
    
    // Cache response
    cache.set(cacheKey, routeWeather, {
      ttl: 60 * 60 * 1000, // 1 hour
      segment: 'api:responses'
    });
    
    res.status(200).json(routeWeather);
  } catch (error) {
    console.error('[Weather API] Error getting route weather:', error);
    
    monitoringService.recordError({
      type: 'api_error',
      endpoint: '/api/v1/weather/route',
      message: error.message,
      requestId: req.requestId
    });
    
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to get route weather data',
      requestId: req.requestId
    });
  }
});

/**
 * Geocode a location name
 * GET /api/v1/weather/geocode
 */
router.get('/geocode', validateInput({
  query: {
    q: { type: 'string', required: true, minLength: 2 }
  }
}), async (req, res) => {
  try {
    const { q } = req.query;
    
    // Generate cache key
    const cacheKey = `weather:geocode:${q.toLowerCase().trim()}`;
    
    // Check response cache
    const cachedResponse = cache.get(cacheKey, 'api:responses');
    
    if (cachedResponse) {
      return res.status(200).json(cachedResponse);
    }
    
    // Get geocoding results
    const geocodingResults = await weatherService.geocodeLocation(q);
    
    // Cache response
    cache.set(cacheKey, geocodingResults, {
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      segment: 'api:responses'
    });
    
    res.status(200).json(geocodingResults);
  } catch (error) {
    console.error('[Weather API] Error geocoding location:', error);
    
    monitoringService.recordError({
      type: 'api_error',
      endpoint: '/api/v1/weather/geocode',
      message: error.message,
      requestId: req.requestId
    });
    
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to geocode location',
      requestId: req.requestId
    });
  }
});

/**
 * Get cycling recommendations based on weather
 * GET /api/v1/weather/recommendations
 */
router.get('/recommendations', validateInput({
  query: {
    lat: { type: 'number', required: true },
    lon: { type: 'number', required: true }
  }
}), async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    // Generate cache key
    const cacheKey = `weather:recommendations:${lat},${lon}`;
    
    // Check response cache
    const cachedResponse = cache.get(cacheKey, 'api:responses');
    
    if (cachedResponse) {
      return res.status(200).json(cachedResponse);
    }
    
    // Get weather data
    const weatherData = await weatherService.getWeather(
      parseFloat(lat),
      parseFloat(lon),
      { includeHourly: true, includeDaily: false }
    );
    
    // Get recommendations
    const recommendations = weatherData.recommendations;
    
    // Add weather context
    const response = {
      recommendations,
      weather_context: {
        temp: weatherData.current.temp,
        wind_speed: weatherData.current.wind_speed,
        conditions: weatherData.current.weather.main,
        uvi: weatherData.current.uvi
      },
      timestamp: Date.now(),
      location: {
        lat: parseFloat(lat),
        lon: parseFloat(lon)
      }
    };
    
    // Cache response
    cache.set(cacheKey, response, {
      ttl: 60 * 60 * 1000, // 1 hour
      segment: 'api:responses'
    });
    
    res.status(200).json(response);
  } catch (error) {
    console.error('[Weather API] Error getting weather recommendations:', error);
    
    monitoringService.recordError({
      type: 'api_error',
      endpoint: '/api/v1/weather/recommendations',
      message: error.message,
      requestId: req.requestId
    });
    
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to get weather recommendations',
      requestId: req.requestId
    });
  }
});

/**
 * Get weather alerts for a location
 * GET /api/v1/weather/alerts
 */
router.get('/alerts', validateInput({
  query: {
    lat: { type: 'number', required: true },
    lon: { type: 'number', required: true }
  }
}), async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    // Generate cache key
    const cacheKey = `weather:alerts:${lat},${lon}`;
    
    // Check response cache
    const cachedResponse = cache.get(cacheKey, 'api:responses');
    
    if (cachedResponse) {
      return res.status(200).json(cachedResponse);
    }
    
    // Get weather data
    const weatherData = await weatherService.getWeather(
      parseFloat(lat),
      parseFloat(lon),
      { includeHourly: false, includeDaily: false }
    );
    
    // Extract alerts
    const alerts = weatherData.alerts || [];
    
    // Add weather context
    const response = {
      alerts,
      has_alerts: alerts.length > 0,
      timestamp: Date.now(),
      location: {
        lat: parseFloat(lat),
        lon: parseFloat(lon)
      }
    };
    
    // Cache response
    cache.set(cacheKey, response, {
      ttl: 30 * 60 * 1000, // 30 minutes
      segment: 'api:responses'
    });
    
    res.status(200).json(response);
  } catch (error) {
    console.error('[Weather API] Error getting weather alerts:', error);
    
    monitoringService.recordError({
      type: 'api_error',
      endpoint: '/api/v1/weather/alerts',
      message: error.message,
      requestId: req.requestId
    });
    
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to get weather alerts',
      requestId: req.requestId
    });
  }
});

module.exports = router;
