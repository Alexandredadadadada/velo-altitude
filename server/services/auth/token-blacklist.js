const crypto = require('crypto');
const { RedisManager } = require('../cache/redis-manager');

class TokenBlacklist {
  constructor() {
    this.redis = new RedisManager().getClient();
    this.prefix = 'blacklist:token:';
  }
  
  async addToBlacklist(token, expiryTime) {
    const tokenHash = this.hashToken(token);
    // Use token's remaining lifetime as TTL, or default to 24 hours
    const ttl = expiryTime ? Math.ceil((expiryTime - Date.now()) / 1000) : 86400;
    await this.redis.set(`${this.prefix}${tokenHash}`, '1', 'EX', ttl);
    return true;
  }
  
  async isBlacklisted(token) {
    const tokenHash = this.hashToken(token);
    const result = await this.redis.get(`${this.prefix}${tokenHash}`);
    return result !== null;
  }
  
  hashToken(token) {
    // Use SHA-256 for secure hashing
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

module.exports = new TokenBlacklist();
