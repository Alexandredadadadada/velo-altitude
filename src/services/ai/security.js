/**
 * AI Chatbox Security Service
 * Provides security features for the AI chatbox including rate limiting,
 * input validation, and sanitization
 */

/**
 * Security features for AI chatbox
 */
export const chatSecurity = {
  // Rate limiting configuration
  rateLimit: {
    maxRequests: 60, // Maximum requests per time window
    timeWindow: 60 * 1000, // Time window in milliseconds (1 minute)
    userRequests: new Map() // Map to track user requests
  },
  
  // Input validation rules
  validation: {
    maxMessageLength: 1000, // Maximum characters per message
    allowedCommands: ['/help', '/clear', '/context'], // Allowed special commands
    prohibitedPatterns: [
      /script/i, // Prevent script injection attempts
      /(\w+)=.*?1=1/i, // Basic SQL injection pattern
      /<[^>]*>/g // HTML tags
    ]
  },
  
  // Sanitization configuration
  sanitization: {
    // Replace patterns with safe alternatives
    replacements: [
      { pattern: /<script.*?>.*?<\/script>/gi, replacement: '' }, // Remove script tags
      { pattern: /<style.*?>.*?<\/style>/gi, replacement: '' }, // Remove style tags
      { pattern: /javascript:/gi, replacement: 'removed:' }, // Remove javascript: protocol
      { pattern: /on\w+=/gi, replacement: 'data-removed=' } // Remove event handlers
    ]
  },
  
  /**
   * Initialize security service
   */
  initialize() {
    console.log('AI Chatbox security initialized');
    
    // Clean up rate limit tracking periodically
    setInterval(() => {
      this.cleanupRateLimitTracking();
    }, 5 * 60 * 1000); // Run every 5 minutes
    
    return this;
  },
  
  /**
   * Check if a user has exceeded rate limits
   * @param {string} userId - User ID
   * @returns {boolean} - Whether rate limit is exceeded
   */
  isRateLimited(userId) {
    const now = Date.now();
    const userKey = userId || 'anonymous';
    
    // Get user's request history
    if (!this.rateLimit.userRequests.has(userKey)) {
      this.rateLimit.userRequests.set(userKey, []);
    }
    
    const requests = this.rateLimit.userRequests.get(userKey);
    
    // Filter out requests outside current time window
    const recentRequests = requests.filter(time => 
      now - time < this.rateLimit.timeWindow
    );
    
    // Update request history
    this.rateLimit.userRequests.set(userKey, recentRequests);
    
    // Check if rate limit exceeded
    return recentRequests.length >= this.rateLimit.maxRequests;
  },
  
  /**
   * Record a request for rate limiting
   * @param {string} userId - User ID
   */
  recordRequest(userId) {
    const userKey = userId || 'anonymous';
    
    // Get user's request history
    if (!this.rateLimit.userRequests.has(userKey)) {
      this.rateLimit.userRequests.set(userKey, []);
    }
    
    const requests = this.rateLimit.userRequests.get(userKey);
    
    // Add current timestamp
    requests.push(Date.now());
    
    // Update request history
    this.rateLimit.userRequests.set(userKey, requests);
  },
  
  /**
   * Clean up old rate limit tracking data
   */
  cleanupRateLimitTracking() {
    const now = Date.now();
    
    // Iterate through all users
    for (const [userKey, requests] of this.rateLimit.userRequests.entries()) {
      // Filter out requests outside current time window
      const recentRequests = requests.filter(time => 
        now - time < this.rateLimit.timeWindow
      );
      
      // Update request history or remove if empty
      if (recentRequests.length > 0) {
        this.rateLimit.userRequests.set(userKey, recentRequests);
      } else {
        this.rateLimit.userRequests.delete(userKey);
      }
    }
  },
  
  /**
   * Validate user input
   * @param {string} message - User message
   * @returns {Object} - Validation result
   */
  validateInput(message) {
    // Check message length
    if (!message || message.length > this.validation.maxMessageLength) {
      return {
        valid: false,
        reason: 'Message length exceeds maximum allowed'
      };
    }
    
    // Check for command validity
    if (message.startsWith('/')) {
      const command = message.split(' ')[0].toLowerCase();
      if (!this.validation.allowedCommands.includes(command)) {
        return {
          valid: false,
          reason: 'Command not allowed'
        };
      }
    }
    
    // Check for prohibited patterns
    for (const pattern of this.validation.prohibitedPatterns) {
      if (pattern.test(message)) {
        return {
          valid: false,
          reason: 'Message contains prohibited content'
        };
      }
    }
    
    return { valid: true };
  },
  
  /**
   * Sanitize user input to remove potentially harmful content
   * @param {string} message - User message
   * @returns {string} - Sanitized message
   */
  sanitizeInput(message) {
    let sanitized = message;
    
    // Apply all sanitization replacements
    for (const { pattern, replacement } of this.sanitization.replacements) {
      sanitized = sanitized.replace(pattern, replacement);
    }
    
    return sanitized;
  },
  
  /**
   * Process user input through security checks
   * @param {string} message - User message
   * @param {string} userId - User ID
   * @returns {Object} - Processing result
   */
  processInput(message, userId) {
    // Check rate limit
    if (this.isRateLimited(userId)) {
      return {
        success: false,
        reason: 'Rate limit exceeded',
        message: null
      };
    }
    
    // Record this request
    this.recordRequest(userId);
    
    // Validate input
    const validation = this.validateInput(message);
    if (!validation.valid) {
      return {
        success: false,
        reason: validation.reason,
        message: null
      };
    }
    
    // Sanitize input
    const sanitized = this.sanitizeInput(message);
    
    return {
      success: true,
      message: sanitized
    };
  }
};

// Initialize security on import
export default chatSecurity.initialize();
