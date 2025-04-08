/**
 * Weather Service for Velo-Altitude API
 * 
 * Provides optimized access to weather data with advanced caching strategies
 * Implements geospatial weather forecasting for cycling routes
 */

const axios = require('axios');
const cache = require('../../../utils/cacheService');
const monitoringService = require('../../../utils/monitoringService');

// OpenWeather API configuration
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/3.0';
const ONECALL_ENDPOINT = '/onecall';
const GEOCODING_ENDPOINT = '/geo/1.0/direct';

// Cache configuration
const CACHE_CONFIG = {
  current: {
    ttl: 30 * 60 * 1000, // 30 minutes
    segment: 'weather:current'
  },
  forecast: {
    ttl: 3 * 60 * 60 * 1000, // 3 hours
    segment: 'weather:forecast'
  },
  historical: {
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    segment: 'weather:historical'
  },
  geocoding: {
    ttl: 30 * 24 * 60 * 60 * 1000, // 30 days
    segment: 'weather:geocoding'
  }
};

// Weather data transformation
const transformWeatherData = (data) => {
  if (!data) return null;
  
  // Extract current weather
  const current = {
    timestamp: data.current.dt * 1000,
    temp: Math.round((data.current.temp - 273.15) * 10) / 10, // Kelvin to Celsius
    feels_like: Math.round((data.current.feels_like - 273.15) * 10) / 10,
    humidity: data.current.humidity,
    pressure: data.current.pressure,
    wind_speed: data.current.wind_speed,
    wind_direction: data.current.wind_deg,
    wind_gust: data.current.wind_gust,
    clouds: data.current.clouds,
    uvi: data.current.uvi,
    visibility: data.current.visibility,
    weather: {
      id: data.current.weather[0].id,
      main: data.current.weather[0].main,
      description: data.current.weather[0].description,
      icon: data.current.weather[0].icon
    }
  };
  
  // Extract daily forecast
  const daily = data.daily.map(day => ({
    timestamp: day.dt * 1000,
    sunrise: day.sunrise * 1000,
    sunset: day.sunset * 1000,
    temp: {
      morning: Math.round((day.temp.morn - 273.15) * 10) / 10,
      day: Math.round((day.temp.day - 273.15) * 10) / 10,
      evening: Math.round((day.temp.eve - 273.15) * 10) / 10,
      night: Math.round((day.temp.night - 273.15) * 10) / 10,
      min: Math.round((day.temp.min - 273.15) * 10) / 10,
      max: Math.round((day.temp.max - 273.15) * 10) / 10
    },
    feels_like: {
      morning: Math.round((day.feels_like.morn - 273.15) * 10) / 10,
      day: Math.round((day.feels_like.day - 273.15) * 10) / 10,
      evening: Math.round((day.feels_like.eve - 273.15) * 10) / 10,
      night: Math.round((day.feels_like.night - 273.15) * 10) / 10
    },
    pressure: day.pressure,
    humidity: day.humidity,
    wind_speed: day.wind_speed,
    wind_direction: day.wind_deg,
    weather: {
      id: day.weather[0].id,
      main: day.weather[0].main,
      description: day.weather[0].description,
      icon: day.weather[0].icon
    },
    clouds: day.clouds,
    pop: day.pop, // Probability of precipitation
    rain: day.rain,
    uvi: day.uvi
  }));
  
  // Extract hourly forecast (next 24 hours)
  const hourly = data.hourly.slice(0, 24).map(hour => ({
    timestamp: hour.dt * 1000,
    temp: Math.round((hour.temp - 273.15) * 10) / 10,
    feels_like: Math.round((hour.feels_like - 273.15) * 10) / 10,
    pressure: hour.pressure,
    humidity: hour.humidity,
    wind_speed: hour.wind_speed,
    wind_direction: hour.wind_deg,
    weather: {
      id: hour.weather[0].id,
      main: hour.weather[0].main,
      description: hour.weather[0].description,
      icon: hour.weather[0].icon
    },
    clouds: hour.clouds,
    pop: hour.pop
  }));
  
  // Extract alerts if available
  const alerts = data.alerts ? data.alerts.map(alert => ({
    sender: alert.sender_name,
    event: alert.event,
    start: alert.start * 1000,
    end: alert.end * 1000,
    description: alert.description
  })) : [];
  
  return {
    lat: data.lat,
    lon: data.lon,
    timezone: data.timezone,
    timezone_offset: data.timezone_offset,
    current,
    hourly,
    daily,
    alerts
  };
};

/**
 * Get cycling-specific weather recommendations
 * @param {Object} weather - Weather data
 * @returns {Object} Cycling recommendations
 */
const getCyclingRecommendations = (weather) => {
  const current = weather.current;
  const hourly = weather.hourly;
  
  // Initialize recommendations
  const recommendations = {
    overall: 'favorable',
    details: [],
    clothing: [],
    warnings: []
  };
  
  // Temperature recommendations
  if (current.temp < 5) {
    recommendations.overall = 'challenging';
    recommendations.details.push('Very cold conditions');
    recommendations.clothing.push('Full winter gear', 'Thermal layers', 'Winter gloves');
  } else if (current.temp < 10) {
    recommendations.details.push('Cold conditions');
    recommendations.clothing.push('Thermal jersey', 'Leg warmers', 'Long finger gloves');
  } else if (current.temp > 30) {
    recommendations.overall = 'challenging';
    recommendations.details.push('Very hot conditions');
    recommendations.clothing.push('Lightweight jersey', 'Sun protection');
    recommendations.warnings.push('Risk of dehydration', 'Avoid riding during peak heat (11am-3pm)');
  } else if (current.temp > 25) {
    recommendations.details.push('Warm conditions');
    recommendations.clothing.push('Lightweight jersey', 'Sun protection');
  }
  
  // Wind recommendations
  if (current.wind_speed > 40) {
    recommendations.overall = 'severe';
    recommendations.details.push('Dangerously strong winds');
    recommendations.warnings.push('Consider postponing your ride');
  } else if (current.wind_speed > 30) {
    recommendations.overall = 'challenging';
    recommendations.details.push('Very strong winds');
    recommendations.warnings.push('Be cautious on exposed sections and descents');
  } else if (current.wind_speed > 20) {
    recommendations.details.push('Strong winds');
    recommendations.warnings.push('Be prepared for crosswinds');
  }
  
  // Rain recommendations
  const rainInNext3Hours = hourly.slice(0, 3).some(hour => 
    hour.weather.main === 'Rain' || hour.weather.main === 'Thunderstorm');
  
  if (current.weather.main === 'Rain' || current.weather.main === 'Thunderstorm') {
    recommendations.overall = 'challenging';
    recommendations.details.push('Rainy conditions');
    recommendations.clothing.push('Waterproof jacket', 'Waterproof gloves');
    recommendations.warnings.push('Reduced visibility', 'Slippery surfaces');
  } else if (rainInNext3Hours) {
    recommendations.details.push('Rain expected soon');
    recommendations.clothing.push('Pack a rain jacket');
  }
  
  // Thunderstorm warning
  if (current.weather.main === 'Thunderstorm' || 
      hourly.slice(0, 6).some(hour => hour.weather.main === 'Thunderstorm')) {
    recommendations.overall = 'severe';
    recommendations.warnings.push('Thunderstorms in the area', 'Seek shelter if lightning is present');
  }
  
  // UV Index recommendations
  if (current.uvi >= 8) {
    recommendations.details.push('Very high UV index');
    recommendations.clothing.push('Sunscreen (SPF 50+)', 'Sunglasses', 'UV-protective arm sleeves');
  } else if (current.uvi >= 6) {
    recommendations.details.push('High UV index');
    recommendations.clothing.push('Sunscreen (SPF 30+)', 'Sunglasses');
  }
  
  return recommendations;
};

/**
 * Get weather data for a specific location
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {Object} options - Options
 * @returns {Promise<Object>} Weather data
 */
async function getWeather(lat, lon, options = {}) {
  try {
    const { includeHourly = true, includeDaily = true, units = 'metric' } = options;
    
    // Generate cache key
    const cacheKey = `weather:${lat.toFixed(4)},${lon.toFixed(4)}`;
    
    // Check cache
    const cachedData = cache.get(cacheKey, CACHE_CONFIG.current.segment);
    
    if (cachedData) {
      return cachedData;
    }
    
    // Build API URL
    const url = `${OPENWEATHER_BASE_URL}${ONECALL_ENDPOINT}`;
    const params = {
      lat,
      lon,
      exclude: [],
      appid: OPENWEATHER_API_KEY,
      units
    };
    
    if (!includeHourly) params.exclude.push('hourly');
    if (!includeDaily) params.exclude.push('daily');
    if (params.exclude.length > 0) params.exclude = params.exclude.join(',');
    
    // Make API request
    const startTime = Date.now();
    const response = await axios.get(url, { params });
    const requestDuration = Date.now() - startTime;
    
    // Log API request for monitoring
    monitoringService.recordError({
      type: 'external_api',
      service: 'openweather',
      endpoint: ONECALL_ENDPOINT,
      duration: requestDuration,
      status: response.status
    });
    
    // Transform data
    const weatherData = transformWeatherData(response.data);
    
    // Add cycling-specific recommendations
    weatherData.recommendations = getCyclingRecommendations(weatherData);
    
    // Cache the result
    cache.set(cacheKey, weatherData, { 
      ttl: CACHE_CONFIG.current.ttl,
      segment: CACHE_CONFIG.current.segment
    });
    
    return weatherData;
  } catch (error) {
    console.error('[WeatherService] Error fetching weather data:', error);
    
    // Log error for monitoring
    monitoringService.recordError({
      type: 'external_api_error',
      service: 'openweather',
      endpoint: ONECALL_ENDPOINT,
      message: error.message,
      code: error.response?.status || 500
    });
    
    throw new Error(`Failed to fetch weather data: ${error.message}`);
  }
}

/**
 * Get weather forecast for a route
 * @param {Array<Object>} waypoints - Array of waypoints with lat/lng
 * @returns {Promise<Object>} Route weather data
 */
async function getRouteWeather(waypoints) {
  try {
    if (!waypoints || !Array.isArray(waypoints) || waypoints.length === 0) {
      throw new Error('Invalid waypoints');
    }
    
    // For routes, we'll sample weather at start, middle and end points
    const sampledPoints = [
      waypoints[0], // Start
      waypoints[Math.floor(waypoints.length / 2)], // Middle
      waypoints[waypoints.length - 1] // End
    ];
    
    // Get weather for each sampled point
    const weatherPromises = sampledPoints.map(point => 
      getWeather(point.lat, point.lng || point.lon)
    );
    
    const weatherResults = await Promise.all(weatherPromises);
    
    // Analyze weather conditions along the route
    const routeAnalysis = analyzeRouteWeather(weatherResults, sampledPoints);
    
    return {
      points: weatherResults.map((weather, index) => ({
        position: index === 0 ? 'start' : (index === weatherResults.length - 1 ? 'end' : 'middle'),
        location: {
          lat: sampledPoints[index].lat,
          lon: sampledPoints[index].lng || sampledPoints[index].lon
        },
        current: weather.current,
        hourly: weather.hourly.slice(0, 12) // Next 12 hours
      })),
      analysis: routeAnalysis
    };
  } catch (error) {
    console.error('[WeatherService] Error fetching route weather:', error);
    
    // Log error for monitoring
    monitoringService.recordError({
      type: 'service_error',
      service: 'weatherService',
      function: 'getRouteWeather',
      message: error.message
    });
    
    throw new Error(`Failed to fetch route weather: ${error.message}`);
  }
}

/**
 * Analyze weather conditions along a route
 * @param {Array<Object>} weatherPoints - Weather data for points along the route
 * @param {Array<Object>} waypoints - Corresponding waypoints
 * @returns {Object} Route weather analysis
 */
function analyzeRouteWeather(weatherPoints, waypoints) {
  // Check for significant weather changes along the route
  const temperatureVariation = Math.max(
    ...weatherPoints.map(w => w.current.temp)
  ) - Math.min(
    ...weatherPoints.map(w => w.current.temp)
  );
  
  const windVariation = Math.max(
    ...weatherPoints.map(w => w.current.wind_speed)
  ) - Math.min(
    ...weatherPoints.map(w => w.current.wind_speed)
  );
  
  // Check for precipitation along the route
  const hasPrecipitation = weatherPoints.some(w => 
    w.current.weather.main === 'Rain' || 
    w.current.weather.main === 'Snow' ||
    w.current.weather.main === 'Thunderstorm'
  );
  
  // Check for upcoming precipitation
  const hasUpcomingPrecipitation = weatherPoints.some(w => 
    w.hourly.slice(0, 6).some(h => 
      h.weather.main === 'Rain' || 
      h.weather.main === 'Snow' ||
      h.weather.main === 'Thunderstorm'
    )
  );
  
  // Generate insights
  const insights = [];
  
  if (temperatureVariation > 5) {
    insights.push(`Temperature varies by ${temperatureVariation.toFixed(1)}°C along the route`);
  }
  
  if (windVariation > 10) {
    insights.push(`Wind speed varies significantly along the route`);
  }
  
  if (hasPrecipitation) {
    insights.push('Precipitation present along parts of the route');
  } else if (hasUpcomingPrecipitation) {
    insights.push('Precipitation expected within the next 6 hours');
  }
  
  // Check for challenging sections
  const challengingSections = [];
  
  weatherPoints.forEach((weather, index) => {
    const challenges = [];
    
    if (weather.current.wind_speed > 20) {
      challenges.push({
        type: 'wind',
        severity: weather.current.wind_speed > 30 ? 'high' : 'medium',
        description: `Strong winds (${weather.current.wind_speed} km/h)`
      });
    }
    
    if (weather.current.weather.main === 'Rain' || weather.current.weather.main === 'Thunderstorm') {
      challenges.push({
        type: 'precipitation',
        severity: weather.current.weather.main === 'Thunderstorm' ? 'high' : 'medium',
        description: weather.current.weather.description
      });
    }
    
    if (challenges.length > 0) {
      challengingSections.push({
        position: index === 0 ? 'start' : (index === weatherPoints.length - 1 ? 'end' : 'middle'),
        location: {
          lat: waypoints[index].lat,
          lon: waypoints[index].lng || waypoints[index].lon
        },
        challenges
      });
    }
  });
  
  // Overall recommendation
  let overallCondition = 'favorable';
  
  if (challengingSections.some(section => 
    section.challenges.some(challenge => challenge.severity === 'high')
  )) {
    overallCondition = 'challenging';
  } else if (challengingSections.length > 0) {
    overallCondition = 'moderate';
  }
  
  return {
    overall_condition: overallCondition,
    insights,
    challenging_sections: challengingSections,
    temperature_variation: temperatureVariation,
    wind_variation: windVariation,
    has_precipitation: hasPrecipitation,
    has_upcoming_precipitation: hasUpcomingPrecipitation
  };
}

/**
 * Get geocoding information for a location name
 * @param {string} locationName - Location name to geocode
 * @returns {Promise<Array<Object>>} Geocoding results
 */
async function geocodeLocation(locationName) {
  try {
    // Generate cache key
    const cacheKey = `geocode:${locationName.toLowerCase().trim()}`;
    
    // Check cache
    const cachedData = cache.get(cacheKey, CACHE_CONFIG.geocoding.segment);
    
    if (cachedData) {
      return cachedData;
    }
    
    // Build API URL
    const url = `${OPENWEATHER_BASE_URL}${GEOCODING_ENDPOINT}`;
    const params = {
      q: locationName,
      limit: 5,
      appid: OPENWEATHER_API_KEY
    };
    
    // Make API request
    const startTime = Date.now();
    const response = await axios.get(url, { params });
    const requestDuration = Date.now() - startTime;
    
    // Log API request for monitoring
    monitoringService.recordError({
      type: 'external_api',
      service: 'openweather',
      endpoint: GEOCODING_ENDPOINT,
      duration: requestDuration,
      status: response.status
    });
    
    // Transform and cache results
    const results = response.data.map(location => ({
      name: location.name,
      local_names: location.local_names,
      lat: location.lat,
      lon: location.lon,
      country: location.country,
      state: location.state
    }));
    
    // Cache the result
    cache.set(cacheKey, results, { 
      ttl: CACHE_CONFIG.geocoding.ttl,
      segment: CACHE_CONFIG.geocoding.segment
    });
    
    return results;
  } catch (error) {
    console.error('[WeatherService] Error geocoding location:', error);
    
    // Log error for monitoring
    monitoringService.recordError({
      type: 'external_api_error',
      service: 'openweather',
      endpoint: GEOCODING_ENDPOINT,
      message: error.message,
      code: error.response?.status || 500
    });
    
    throw new Error(`Failed to geocode location: ${error.message}`);
  }
}

module.exports = {
  getWeather,
  getRouteWeather,
  geocodeLocation
};
