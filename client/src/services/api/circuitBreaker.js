// API Circuit Breaker (opossum wrapper)
// Install opossum: npm install opossum
import CircuitBreaker from 'opossum';

class APICircuitBreaker {
  constructor() {
    this.breakers = new Map();
  }

  getBreaker(serviceName) {
    if (!this.breakers.has(serviceName)) {
      const options = {
        failureThreshold: 50,
        resetTimeout: 10000,
        timeout: 5000,
        errorThresholdPercentage: 50,
        rollingCountTimeout: 60000,
        rollingCountBuckets: 10,
      };
      const breaker = new CircuitBreaker(
        async (config) => {
          const response = await fetch(config.url, config);
          if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
          }
          return response.json();
        },
        options
      );
      breaker.on('open', () => {
        console.warn(`Circuit breaker for ${serviceName} is open`);
      });
      breaker.on('halfOpen', () => {
        console.info(`Circuit breaker for ${serviceName} is half-open`);
      });
      breaker.on('close', () => {
        console.info(`Circuit breaker for ${serviceName} is closed`);
      });
      this.breakers.set(serviceName, breaker);
    }
    return this.breakers.get(serviceName);
  }

  async fetch(serviceName, url, options = {}) {
    const breaker = this.getBreaker(serviceName);
    try {
      return await breaker.fire({ url, ...options });
    } catch (error) {
      console.error(`Circuit breaker error for ${serviceName}:`, error);
      throw error;
    }
  }
}

export const apiCircuitBreaker = new APICircuitBreaker();
