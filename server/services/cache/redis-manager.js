// Redis connection manager using ioredis
const Redis = require('ioredis');

class RedisManager {
  constructor(config = {}) {
    this.client = new Redis({
      host: config.host || process.env.REDIS_HOST || 'localhost',
      port: config.port || process.env.REDIS_PORT || 6379,
      password: config.password || process.env.REDIS_PASSWORD,
      db: config.db || 0,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 50, 2000)
    });

    this.client.on('error', err => console.error('Redis error:', err));
    this.client.on('connect', () => console.log('Redis connected'));
  }

  async get(key) {
    return this.client.get(key);
  }

  async set(key, value, ttl) {
    if (ttl) {
      return this.client.set(key, value, 'EX', ttl);
    }
    return this.client.set(key, value);
  }

  async del(key) {
    return this.client.del(key);
  }

  async flush() {
    return this.client.flushdb();
  }
}

module.exports = RedisManager;
