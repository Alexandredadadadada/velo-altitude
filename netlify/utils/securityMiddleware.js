/**
 * Security Middleware for Velo-Altitude API
 * Provides rate limiting, input validation, and security protections
 */

const cache = require('./cacheService');
const { v4: uuidv4 } = require('uuid');

// Security configuration
const config = {
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: {
      default: 60, // 60 requests per minute by default
      auth: 10,    // 10 auth requests per minute
      api: 120,    // 120 API requests per minute
      public: 240  // 240 public requests per minute
    },
    blockDuration: 15 * 60 * 1000, // 15 minutes block for violators
  },
  security: {
    maxBodySize: 1024 * 1024, // 1MB
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    contentTypes: ['application/json', 'multipart/form-data', 'application/x-www-form-urlencoded'],
    corsOrigins: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['https://velo-altitude.com'],
    headerRequirements: {
      'content-type': ['POST', 'PUT']
    }
  },
  validation: {
    enabled: true,
    strictMode: process.env.NODE_ENV === 'production',
    sanitize: true
  }
};

// Security metrics
const securityMetrics = {
  rateLimitViolations: [],
  blockedIPs: new Set(),
  securityViolations: [],
  validationErrors: []
};

/**
 * Rate limiting middleware
 * @param {Object} options - Rate limiting options
 * @returns {Function} Express middleware
 */
function rateLimiter(options = {}) {
  const opts = {
    ...config.rateLimit,
    ...options
  };
  
  return (req, res, next) => {
    // Determine client identifier (IP or API key)
    const clientId = req.headers['x-api-key'] || req.ip;
    
    // Determine route type for specific limits
    const routeType = getRouteType(req.path);
    const maxRequests = opts.maxRequests[routeType] || opts.maxRequests.default;
    
    // Check if client is blocked
    if (securityMetrics.blockedIPs.has(clientId)) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'You have been temporarily blocked due to excessive requests',
        retryAfter: Math.ceil(opts.blockDuration / 1000)
      });
    }
    
    // Get client's request count
    const cacheKey = `ratelimit:${clientId}`;
    const clientRequests = cache.get(cacheKey, 'security') || {
      count: 0,
      resetAt: Date.now() + opts.windowMs
    };
    
    // Reset count if window has expired
    if (clientRequests.resetAt <= Date.now()) {
      clientRequests.count = 0;
      clientRequests.resetAt = Date.now() + opts.windowMs;
    }
    
    // Increment request count
    clientRequests.count++;
    
    // Update cache
    cache.set(cacheKey, clientRequests, {
      ttl: opts.windowMs,
      segment: 'security'
    });
    
    // Set headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - clientRequests.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(clientRequests.resetAt / 1000));
    
    // Check if rate limit exceeded
    if (clientRequests.count > maxRequests) {
      // Record violation
      recordRateLimitViolation(clientId, req.path);
      
      // Check for repeated violations
      const violations = securityMetrics.rateLimitViolations.filter(v => 
        v.clientId === clientId && 
        v.timestamp > Date.now() - opts.windowMs * 5
      );
      
      // Block client if violations exceed threshold
      if (violations.length >= 5) {
        securityMetrics.blockedIPs.add(clientId);
        
        // Set expiration for the block
        setTimeout(() => {
          securityMetrics.blockedIPs.delete(clientId);
        }, opts.blockDuration);
      }
      
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded',
        retryAfter: Math.ceil((clientRequests.resetAt - Date.now()) / 1000)
      });
    }
    
    next();
  };
}

/**
 * Security headers middleware
 * @returns {Function} Express middleware
 */
function securityHeaders() {
  return (req, res, next) => {
    // Set security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://api.mapbox.com; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://api.mapbox.com; img-src 'self' data: https://*.mapbox.com https://*.openstreetmap.org https://res.cloudinary.com; connect-src 'self' https://api.mapbox.com https://api.openweathermap.org https://www.strava.com");
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
    
    // Generate request ID for tracking
    const requestId = uuidv4();
    req.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);
    
    next();
  };
}

/**
 * Input validation middleware
 * @param {Object} schema - Validation schema
 * @returns {Function} Express middleware
 */
function validateInput(schema) {
  return (req, res, next) => {
    if (!config.validation.enabled || !schema) {
      return next();
    }
    
    try {
      // Validate request body
      if (schema.body && req.body) {
        validateObject(req.body, schema.body, 'body');
      }
      
      // Validate query parameters
      if (schema.query && req.query) {
        validateObject(req.query, schema.query, 'query');
      }
      
      // Validate URL parameters
      if (schema.params && req.params) {
        validateObject(req.params, schema.params, 'params');
      }
      
      next();
    } catch (error) {
      // Record validation error
      recordValidationError(req.requestId, error.message, req.path);
      
      res.status(400).json({
        error: 'Validation Error',
        message: config.validation.strictMode ? 'Invalid request parameters' : error.message,
        requestId: req.requestId
      });
    }
  };
}

/**
 * Request sanitization middleware
 * @returns {Function} Express middleware
 */
function sanitizeRequest() {
  return (req, res, next) => {
    if (!config.validation.sanitize) {
      return next();
    }
    
    // Sanitize request body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }
    
    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query);
    }
    
    next();
  };
}

/**
 * CORS middleware
 * @returns {Function} Express middleware
 */
function corsHandler() {
  return (req, res, next) => {
    const origin = req.headers.origin;
    
    // Check if origin is allowed
    if (origin && (config.security.corsOrigins.includes(origin) || config.security.corsOrigins.includes('*'))) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', config.security.allowedMethods.join(', '));
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
      res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    }
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    
    next();
  };
}

/**
 * Request validation middleware
 * @returns {Function} Express middleware
 */
function validateRequest() {
  return (req, res, next) => {
    // Validate HTTP method
    if (!config.security.allowedMethods.includes(req.method)) {
      return res.status(405).json({
        error: 'Method Not Allowed',
        message: `Allowed methods: ${config.security.allowedMethods.join(', ')}`
      });
    }
    
    // Validate Content-Type header for POST/PUT requests
    if (['POST', 'PUT'].includes(req.method) && req.headers['content-type']) {
      const contentType = req.headers['content-type'].split(';')[0];
      if (!config.security.contentTypes.some(ct => contentType.includes(ct))) {
        return res.status(415).json({
          error: 'Unsupported Media Type',
          message: `Supported content types: ${config.security.contentTypes.join(', ')}`
        });
      }
    }
    
    // Validate required headers
    for (const [header, methods] of Object.entries(config.security.headerRequirements)) {
      if (methods.includes(req.method) && !req.headers[header]) {
        return res.status(400).json({
          error: 'Bad Request',
          message: `${header} header is required for ${methods.join('/')} requests`
        });
      }
    }
    
    // Validate body size
    if (req.headers['content-length'] && parseInt(req.headers['content-length']) > config.security.maxBodySize) {
      return res.status(413).json({
        error: 'Payload Too Large',
        message: `Request body exceeds maximum size of ${config.security.maxBodySize / 1024}KB`
      });
    }
    
    next();
  };
}

/**
 * Error handling middleware
 * @returns {Function} Express middleware
 */
function errorHandler() {
  return (err, req, res, next) => {
    console.error(`[ERROR] ${req.method} ${req.path}:`, err);
    
    // Record security violation if it's a security error
    if (err.name === 'SecurityError') {
      recordSecurityViolation(req.ip, err.message, req.path);
    }
    
    // Send appropriate error response
    res.status(err.status || 500).json({
      error: err.name || 'Server Error',
      message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
      requestId: req.requestId
    });
  };
}

/**
 * Get route type for rate limiting
 * @param {string} path - Request path
 * @returns {string} Route type
 */
function getRouteType(path) {
  if (path.startsWith('/api/auth')) {
    return 'auth';
  } else if (path.startsWith('/api/')) {
    return 'api';
  } else {
    return 'public';
  }
}

/**
 * Validate object against schema
 * @param {Object} obj - Object to validate
 * @param {Object} schema - Validation schema
 * @param {string} location - Location of object (body, query, params)
 * @throws {Error} Validation error
 */
function validateObject(obj, schema, location) {
  for (const [field, rules] of Object.entries(schema)) {
    // Check if field is required
    if (rules.required && (obj[field] === undefined || obj[field] === null)) {
      throw new Error(`${location}.${field} is required`);
    }
    
    // Skip validation if field is not present and not required
    if (obj[field] === undefined || obj[field] === null) {
      continue;
    }
    
    // Validate type
    if (rules.type && typeof obj[field] !== rules.type) {
      throw new Error(`${location}.${field} must be of type ${rules.type}`);
    }
    
    // Validate enum
    if (rules.enum && !rules.enum.includes(obj[field])) {
      throw new Error(`${location}.${field} must be one of: ${rules.enum.join(', ')}`);
    }
    
    // Validate min/max for numbers
    if (typeof obj[field] === 'number') {
      if (rules.min !== undefined && obj[field] < rules.min) {
        throw new Error(`${location}.${field} must be at least ${rules.min}`);
      }
      
      if (rules.max !== undefined && obj[field] > rules.max) {
        throw new Error(`${location}.${field} must be at most ${rules.max}`);
      }
    }
    
    // Validate min/max length for strings
    if (typeof obj[field] === 'string') {
      if (rules.minLength !== undefined && obj[field].length < rules.minLength) {
        throw new Error(`${location}.${field} must be at least ${rules.minLength} characters`);
      }
      
      if (rules.maxLength !== undefined && obj[field].length > rules.maxLength) {
        throw new Error(`${location}.${field} must be at most ${rules.maxLength} characters`);
      }
      
      // Validate pattern
      if (rules.pattern && !new RegExp(rules.pattern).test(obj[field])) {
        throw new Error(`${location}.${field} has invalid format`);
      }
    }
    
    // Validate array
    if (Array.isArray(obj[field])) {
      if (rules.minItems !== undefined && obj[field].length < rules.minItems) {
        throw new Error(`${location}.${field} must contain at least ${rules.minItems} items`);
      }
      
      if (rules.maxItems !== undefined && obj[field].length > rules.maxItems) {
        throw new Error(`${location}.${field} must contain at most ${rules.maxItems} items`);
      }
      
      // Validate array items
      if (rules.items && rules.items.type) {
        for (let i = 0; i < obj[field].length; i++) {
          const item = obj[field][i];
          
          if (typeof item !== rules.items.type) {
            throw new Error(`${location}.${field}[${i}] must be of type ${rules.items.type}`);
          }
          
          // Validate nested object
          if (rules.items.type === 'object' && rules.items.properties) {
            validateObject(item, rules.items.properties, `${location}.${field}[${i}]`);
          }
        }
      }
    }
    
    // Validate nested object
    if (rules.properties && typeof obj[field] === 'object' && !Array.isArray(obj[field])) {
      validateObject(obj[field], rules.properties, `${location}.${field}`);
    }
  }
}

/**
 * Sanitize object to prevent injection attacks
 * @param {Object} obj - Object to sanitize
 * @returns {Object} Sanitized object
 */
function sanitizeObject(obj) {
  const sanitized = {};
  
  for (const [key, value] of Object.entries(obj)) {
    // Skip null or undefined values
    if (value === null || value === undefined) {
      sanitized[key] = value;
      continue;
    }
    
    // Recursively sanitize nested objects
    if (typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value);
      continue;
    }
    
    // Sanitize arrays
    if (Array.isArray(value)) {
      sanitized[key] = value.map(item => {
        if (typeof item === 'object' && item !== null) {
          return sanitizeObject(item);
        }
        if (typeof item === 'string') {
          return sanitizeString(item);
        }
        return item;
      });
      continue;
    }
    
    // Sanitize strings
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
      continue;
    }
    
    // Keep other types as is
    sanitized[key] = value;
  }
  
  return sanitized;
}

/**
 * Sanitize string to prevent XSS and injection attacks
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeString(str) {
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/\\/g, '&#x5C;')
    .replace(/`/g, '&#96;');
}

/**
 * Record rate limit violation
 * @param {string} clientId - Client identifier
 * @param {string} path - Request path
 */
function recordRateLimitViolation(clientId, path) {
  securityMetrics.rateLimitViolations.push({
    clientId,
    path,
    timestamp: Date.now()
  });
  
  // Keep array at a reasonable size
  if (securityMetrics.rateLimitViolations.length > 1000) {
    securityMetrics.rateLimitViolations.shift();
  }
}

/**
 * Record security violation
 * @param {string} clientId - Client identifier
 * @param {string} message - Violation message
 * @param {string} path - Request path
 */
function recordSecurityViolation(clientId, message, path) {
  securityMetrics.securityViolations.push({
    clientId,
    message,
    path,
    timestamp: Date.now()
  });
  
  // Keep array at a reasonable size
  if (securityMetrics.securityViolations.length > 1000) {
    securityMetrics.securityViolations.shift();
  }
}

/**
 * Record validation error
 * @param {string} requestId - Request identifier
 * @param {string} message - Error message
 * @param {string} path - Request path
 */
function recordValidationError(requestId, message, path) {
  securityMetrics.validationErrors.push({
    requestId,
    message,
    path,
    timestamp: Date.now()
  });
  
  // Keep array at a reasonable size
  if (securityMetrics.validationErrors.length > 1000) {
    securityMetrics.validationErrors.shift();
  }
}

/**
 * Get security metrics
 * @returns {Object} Security metrics
 */
function getSecurityMetrics() {
  return {
    rateLimitViolations: securityMetrics.rateLimitViolations.length,
    blockedIPs: Array.from(securityMetrics.blockedIPs),
    securityViolations: securityMetrics.securityViolations.length,
    validationErrors: securityMetrics.validationErrors.length,
    recentViolations: securityMetrics.securityViolations.slice(-10),
    recentValidationErrors: securityMetrics.validationErrors.slice(-10)
  };
}

module.exports = {
  rateLimiter,
  securityHeaders,
  validateInput,
  sanitizeRequest,
  corsHandler,
  validateRequest,
  errorHandler,
  getSecurityMetrics
};
