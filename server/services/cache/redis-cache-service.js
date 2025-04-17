// RedisCacheService: cache abstraction for Velo-Altitude
const RedisManager = require('./redis-manager');
const cacheConfig = require('../../config/cache-config');

class RedisCacheService {
  constructor() {
    this.redis = new RedisManager(cacheConfig.redis);
    this.metrics = {
      hits: 0,
      misses: 0,
      errors: 0
    };
  }

  async get(key, type = 'default') {
    try {
      const data = await this.redis.get(key);
      if (!data) {
        this.metrics.misses++;
        return null;
      }
      this.metrics.hits++;
      return JSON.parse(data);
    } catch (error) {
      this.metrics.errors++;
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set(key, value, customTtl = null, type = 'default') {
    try {
      const ttl = customTtl || cacheConfig.ttlConfig[type] || cacheConfig.defaultTTL;
      await this.redis.set(key, JSON.stringify(value), ttl);
      return true;
    } catch (error) {
      this.metrics.errors++;
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  async del(key) {
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      this.metrics.errors++;
      console.error(`Cache del error for key ${key}:`, error);
      return false;
    }
  }

  async flush() {
    try {
      await this.redis.flush();
      return true;
    } catch (error) {
      this.metrics.errors++;
      console.error('Cache flush error:', error);
      return false;
    }
  }

  getMetrics() {
    return { ...this.metrics };
  }
}

module.exports = new RedisCacheService();
