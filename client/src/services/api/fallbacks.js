// Fallback strategies for API services (cache, historical, etc.)
// Example: WeatherService fallback logic

const HISTORICAL_WEATHER = {
  // Example: 'location': { 0: {...}, 1: {...}, ... }
};

export const fallbackWeather = {
  async getCachedWeather(location, cacheService) {
    const cached = await cacheService.get(`weather:${location}`);
    if (!cached) throw new Error('No cached weather available');
    return { ...cached, source: 'cache', cachedAt: cached.timestamp };
  },
  getHistoricalAverage(location) {
    const month = new Date().getMonth();
    const historicalData = HISTORICAL_WEATHER[location]?.[month];
    if (!historicalData) {
      return { temperature: null, conditions: 'Unknown', source: 'unavailable' };
    }
    return { ...historicalData, source: 'historical' };
  }
};
