/**
 * Advanced Memory Cache Service for Velo-Altitude
 * Provides efficient caching with TTL, LRU eviction, and segmentation
 */

class CacheService {
  constructor(options = {}) {
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0
    };
    this.maxSize = options.maxSize || 1000;
    this.defaultTTL = options.defaultTTL || 3600000; // 1 hour in ms
    this.segments = new Map();
    this.segmentLimits = options.segmentLimits || {};
    this.accessLog = [];
    this.accessLogLimit = 1000;
  }

  /**
   * Get an item from cache
   * @param {string} key - Cache key
   * @param {string} segment - Optional cache segment
   * @returns {*} Cached value or undefined if not found/expired
   */
  get(key, segment = 'default') {
    const fullKey = this._getFullKey(key, segment);
    const item = this.cache.get(fullKey);
    
    if (!item) {
      this.stats.misses++;
      return undefined;
    }
    
    // Check if the item has expired
    if (item.expiry && item.expiry < Date.now()) {
      this.cache.delete(fullKey);
      this.stats.misses++;
      return undefined;
    }
    
    // Update access time for LRU
    item.lastAccessed = Date.now();
    this._logAccess(fullKey, 'hit');
    this.stats.hits++;
    
    return item.value;
  }

  /**
   * Set an item in cache
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {Object} options - Cache options
   * @param {number} options.ttl - Time to live in ms
   * @param {string} options.segment - Cache segment
   */
  set(key, value, options = {}) {
    const segment = options.segment || 'default';
    const ttl = options.ttl || this.defaultTTL;
    const fullKey = this._getFullKey(key, segment);
    
    // Ensure segment exists in tracking
    if (!this.segments.has(segment)) {
      this.segments.set(segment, new Set());
    }
    
    // Check if we need to evict items from this segment
    this._checkSegmentLimit(segment);
    
    // Check if we need to evict items from the entire cache
    if (this.cache.size >= this.maxSize) {
      this._evictLRU();
    }
    
    // Add to cache with expiry
    const expiry = ttl > 0 ? Date.now() + ttl : null;
    this.cache.set(fullKey, {
      value,
      expiry,
      created: Date.now(),
      lastAccessed: Date.now(),
      segment
    });
    
    // Track key in segment
    this.segments.get(segment).add(fullKey);
    this._logAccess(fullKey, 'set');
    this.stats.sets++;
    
    return value;
  }

  /**
   * Delete an item from cache
   * @param {string} key - Cache key
   * @param {string} segment - Optional cache segment
   * @returns {boolean} True if item was deleted
   */
  delete(key, segment = 'default') {
    const fullKey = this._getFullKey(key, segment);
    const result = this.cache.delete(fullKey);
    
    if (result && this.segments.has(segment)) {
      this.segments.get(segment).delete(fullKey);
    }
    
    return result;
  }

  /**
   * Clear all items from cache or from a specific segment
   * @param {string} segment - Optional segment to clear
   */
  clear(segment) {
    if (segment) {
      if (this.segments.has(segment)) {
        const keys = this.segments.get(segment);
        for (const key of keys) {
          this.cache.delete(key);
        }
        this.segments.get(segment).clear();
      }
    } else {
      this.cache.clear();
      for (const segmentSet of this.segments.values()) {
        segmentSet.clear();
      }
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    const hitRatio = this.stats.hits + this.stats.misses > 0
      ? this.stats.hits / (this.stats.hits + this.stats.misses)
      : 0;
    
    const segmentStats = {};
    for (const [segment, keys] of this.segments.entries()) {
      segmentStats[segment] = {
        size: keys.size,
        limit: this.segmentLimits[segment] || 'unlimited'
      };
    }
    
    return {
      ...this.stats,
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRatio: hitRatio.toFixed(2),
      segments: segmentStats
    };
  }

  /**
   * Prune expired items from cache
   * @returns {number} Number of items pruned
   */
  prune() {
    let pruned = 0;
    const now = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (item.expiry && item.expiry < now) {
        this.cache.delete(key);
        
        if (this.segments.has(item.segment)) {
          this.segments.get(item.segment).delete(key);
        }
        
        pruned++;
      }
    }
    
    return pruned;
  }

  /**
   * Check if a segment has reached its limit and evict if necessary
   * @param {string} segment - Segment to check
   * @private
   */
  _checkSegmentLimit(segment) {
    if (!this.segmentLimits[segment]) return;
    
    const segmentKeys = this.segments.get(segment);
    if (segmentKeys && segmentKeys.size >= this.segmentLimits[segment]) {
      // Find least recently used item in this segment
      let oldestKey = null;
      let oldestAccess = Infinity;
      
      for (const key of segmentKeys) {
        const item = this.cache.get(key);
        if (item && item.lastAccessed < oldestAccess) {
          oldestAccess = item.lastAccessed;
          oldestKey = key;
        }
      }
      
      if (oldestKey) {
        this.cache.delete(oldestKey);
        segmentKeys.delete(oldestKey);
        this.stats.evictions++;
      }
    }
  }

  /**
   * Evict least recently used items
   * @private
   */
  _evictLRU() {
    let oldestKey = null;
    let oldestAccess = Infinity;
    
    for (const [key, item] of this.cache.entries()) {
      if (item.lastAccessed < oldestAccess) {
        oldestAccess = item.lastAccessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      const item = this.cache.get(oldestKey);
      this.cache.delete(oldestKey);
      
      if (item && this.segments.has(item.segment)) {
        this.segments.get(item.segment).delete(oldestKey);
      }
      
      this.stats.evictions++;
    }
  }

  /**
   * Get full cache key including segment
   * @param {string} key - Original key
   * @param {string} segment - Cache segment
   * @returns {string} Full cache key
   * @private
   */
  _getFullKey(key, segment) {
    return `${segment}:${key}`;
  }

  /**
   * Log cache access for analytics
   * @param {string} key - Cache key
   * @param {string} action - Action performed
   * @private
   */
  _logAccess(key, action) {
    this.accessLog.push({
      key,
      action,
      timestamp: Date.now()
    });
    
    // Trim log if it gets too large
    if (this.accessLog.length > this.accessLogLimit) {
      this.accessLog = this.accessLog.slice(-this.accessLogLimit);
    }
  }

  /**
   * Get access patterns for analytics
   * @param {number} limit - Maximum number of entries to return
   * @returns {Array} Recent access log entries
   */
  getAccessPatterns(limit = 100) {
    return this.accessLog.slice(-limit);
  }
}

// Export a singleton instance with default configuration
const cache = new CacheService({
  maxSize: 5000,
  defaultTTL: 15 * 60 * 1000, // 15 minutes
  segmentLimits: {
    'cols': 1000,
    'routes': 1000,
    'weather': 500,
    'user': 1000,
    'strava': 500
  }
});

module.exports = cache;
