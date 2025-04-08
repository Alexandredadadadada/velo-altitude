/**
 * AI Chatbox Optimization Settings
 * Provides configuration and utilities for optimizing AI chatbox performance
 */

/**
 * Caching configuration for AI responses and contexts
 * Helps reduce API calls and improve response times
 */
export const chatOptimization = {
  caching: {
    responses: {
      ttl: 30 * 60 * 1000, // 30 minutes
      maxSize: 100 // messages
    },
    context: {
      ttl: 5 * 60 * 1000, // 5 minutes
      maxSize: 50 // contexts
    }
  },
  
  /**
   * Streaming configuration for real-time AI responses
   * Improves perceived response time by showing partial results
   */
  streaming: {
    enabled: true,
    chunkSize: 100, // characters per chunk
    debounceTime: 100 // ms between updates
  },
  
  /**
   * Performance optimization settings
   */
  performance: {
    maxHistoryLength: 50, // maximum messages to keep in context
    contextUpdateInterval: 60000, // ms between context refreshes
    messageDebounce: 300 // ms to wait before sending user message
  },
  
  /**
   * Initialize optimizations and cache
   */
  initialize() {
    // Set up response cache with LRU eviction
    this.responseCache = new Map();
    this.contextCache = new Map();
    
    // Track cache statistics
    this.cacheStats = {
      hits: 0,
      misses: 0,
      evictions: 0
    };
    
    console.log('AI Chatbox optimizations initialized');
    return this;
  },
  
  /**
   * Get cached response if available
   * @param {string} key - Cache key
   * @returns {Object|null} - Cached response or null
   */
  getCachedResponse(key) {
    const cached = this.responseCache.get(key);
    
    if (!cached) {
      this.cacheStats.misses++;
      return null;
    }
    
    // Check if cached response is still valid
    if (Date.now() - cached.timestamp > this.caching.responses.ttl) {
      this.responseCache.delete(key);
      this.cacheStats.evictions++;
      return null;
    }
    
    this.cacheStats.hits++;
    return cached.data;
  },
  
  /**
   * Cache a response
   * @param {string} key - Cache key
   * @param {Object} data - Response data to cache
   */
  cacheResponse(key, data) {
    // Evict oldest entries if cache is full
    if (this.responseCache.size >= this.caching.responses.maxSize) {
      const oldestKey = this.responseCache.keys().next().value;
      this.responseCache.delete(oldestKey);
      this.cacheStats.evictions++;
    }
    
    // Add to cache with timestamp
    this.responseCache.set(key, {
      data,
      timestamp: Date.now()
    });
  },
  
  /**
   * Generate cache key for message and context
   * @param {string} message - User message
   * @param {Object} context - Message context
   * @returns {string} - Cache key
   */
  generateCacheKey(message, context = {}) {
    // Create simplified context object with only essential data
    const simplifiedContext = {
      userId: context.userId || 'anonymous',
      language: context.language || 'fr',
      hasProfile: !!context.profile,
      hasActivities: !!(context.activities && context.activities.length > 0),
      hasWeather: !!context.weather,
      hasEquipment: !!context.equipment
    };
    
    // Create key from message and context
    return `${message}_${JSON.stringify(simplifiedContext)}`;
  },
  
  /**
   * Optimize chat history by keeping only relevant messages
   * @param {Array} messages - Full chat history
   * @returns {Array} - Optimized chat history
   */
  optimizeChatHistory(messages) {
    if (!messages || messages.length <= this.performance.maxHistoryLength) {
      return messages;
    }
    
    // Keep essential system messages and recent user/assistant messages
    const systemMessages = messages.filter(msg => msg.role === 'system');
    const recentMessages = messages.slice(-this.performance.maxHistoryLength);
    
    return [...systemMessages, ...recentMessages];
  },
  
  /**
   * Get cache statistics
   * @returns {Object} - Cache statistics
   */
  getCacheStats() {
    return {
      ...this.cacheStats,
      cacheSize: this.responseCache.size,
      hitRate: this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses)
    };
  }
};

// Initialize optimization on import
export default chatOptimization.initialize();
