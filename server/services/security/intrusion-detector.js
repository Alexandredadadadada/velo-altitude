const { RedisManager } = require('../cache/redis-manager');
const logger = require('../logger');

class IntrusionDetector {
  constructor() {
    this.redis = new RedisManager().getClient();
    this.prefix = 'security:attempts:';
    this.blockPrefix = 'security:blocked:';
    this.thresholds = {
      warning: 5,    // Log warning after 5 failures
      delay: 8,      // Add progressive delay after 8 failures
      block: 10,     // Temporary block after 10 failures
      window: 300,   // 5 minute window (in seconds)
      blockDuration: 3600 // 1 hour block (in seconds)
    };
  }
  
  async trackFailedAttempt(ip, userId = null, reason = 'unknown') {
    // Check if already blocked
    if (await this.isBlocked(ip)) {
      return { status: 'blocked', action: 'reject' };
    }
    
    const key = `${this.prefix}${ip}`;
    await this.redis.incr(key);
    await this.redis.expire(key, this.thresholds.window);
    
    const count = parseInt(await this.redis.get(key)) || 0;
    
    // Log the attempt
    logger.warn('Authentication failure', { 
      ip, userId, reason, attemptCount: count 
    });
    
    // Determine action based on count
    if (count >= this.thresholds.block) {
      await this.blockIP(ip, userId);
      return { status: 'blocked', action: 'reject' };
    } else if (count >= this.thresholds.delay) {
      const delay = (count - this.thresholds.delay) * 1000; // Progressive delay
      return { status: 'delayed', action: 'delay', delayMs: delay };
    } else if (count >= this.thresholds.warning) {
      return { status: 'warned', action: 'monitor' };
    }
    
    return { status: 'tracked', action: 'none' };
  }
  
  async blockIP(ip, userId = null) {
    await this.redis.set(
      `${this.blockPrefix}${ip}`, 
      JSON.stringify({ timestamp: Date.now(), userId }), 
      'EX', 
      this.thresholds.blockDuration
    );
    
    logger.error('IP blocked due to excessive failed attempts', { ip, userId });
  }
  
  async isBlocked(ip) {
    return await this.redis.get(`${this.blockPrefix}${ip}`) !== null;
  }
  
  async getFailedAttemptCount(ip) {
    const count = await this.redis.get(`${this.prefix}${ip}`);
    return parseInt(count) || 0;
  }
  
  async resetAttempts(ip) {
    await this.redis.del(`${this.prefix}${ip}`);
  }
}

module.exports = new IntrusionDetector();
