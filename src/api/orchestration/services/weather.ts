import axios from 'axios';

const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

export class WeatherService {
  private apiKey: string;
  
  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY || '';
    if (!this.apiKey) {
      console.warn('OpenWeather API key is not available');
    }
  }
  
  // Get current weather for coordinates
  async getWeatherForCoordinates([lon, lat]: [number, number]) {
    return axios.get(`${OPENWEATHER_BASE_URL}/weather`, {
      params: {
        lon,
        lat,
        appid: this.apiKey,
        units: 'metric'
      }
    }).then(response => response.data);
  }
  
  // Get weather forecast for coordinates
  async getForecastForCoordinates([lon, lat]: [number, number]) {
    return axios.get(`${OPENWEATHER_BASE_URL}/forecast`, {
      params: {
        lon,
        lat,
        appid: this.apiKey,
        units: 'metric'
      }
    }).then(response => response.data);
  }
  
  // Get weather data for multiple points along a route
  async getWeatherForRoute(coordinates: [number, number][]) {
    // Select a subset of coordinates to avoid too many API calls
    const sampledCoordinates = this.sampleCoordinates(coordinates, 5);
    
    // Get weather for each sampled point
    const weatherPromises = sampledCoordinates.map(coord => 
      this.getWeatherForCoordinates(coord)
    );
    
    return Promise.all(weatherPromises);
  }
  
  // Get forecast for multiple points along a route
  async getForecastForRoute(coordinates: [number, number][]) {
    // Select a subset of coordinates to avoid too many API calls
    const sampledCoordinates = this.sampleCoordinates(coordinates, 3);
    
    // Get forecast for each sampled point
    const forecastPromises = sampledCoordinates.map(coord => 
      this.getForecastForCoordinates(coord)
    );
    
    return Promise.all(forecastPromises);
  }
  
  // Helper to sample coordinates to reduce API calls
  private sampleCoordinates(coordinates: [number, number][], maxSamples: number): [number, number][] {
    if (coordinates.length <= maxSamples) {
      return coordinates;
    }
    
    const result: [number, number][] = [];
    const step = Math.floor(coordinates.length / maxSamples);
    
    // Always include start and end coordinates
    result.push(coordinates[0]);
    
    // Add evenly spaced coordinates in between
    for (let i = step; i < coordinates.length - step; i += step) {
      if (result.length < maxSamples - 1) {
        result.push(coordinates[i]);
      }
    }
    
    // Add end coordinate
    result.push(coordinates[coordinates.length - 1]);
    
    return result;
  }
}
