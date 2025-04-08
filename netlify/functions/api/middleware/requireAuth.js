/**
 * Authentication Middleware for Velo-Altitude API
 * 
 * Verifies JWT tokens and adds user information to request object
 * Implements token validation, expiration checking, and role-based access control
 */

const jwt = require('jsonwebtoken');
const cache = require('../../../utils/cacheService');
const dbManager = require('../../../utils/dbManager');

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'velo-altitude-api';
const JWT_ISSUER = process.env.JWT_ISSUER || 'velo-altitude';

/**
 * Token blacklist check
 * @param {string} token - JWT token
 * @returns {Promise<boolean>} True if token is blacklisted
 */
async function isTokenBlacklisted(token) {
  // Check cache first
  const cacheKey = `blacklist:${token.substring(0, 32)}`;
  const isBlacklisted = cache.get(cacheKey, 'security');
  
  if (isBlacklisted !== undefined) {
    return isBlacklisted;
  }
  
  // Check database
  try {
    const result = await dbManager.executeQuery(
      async () => {
        const db = await dbManager.connectMongoose();
        const BlacklistedToken = db.model('BlacklistedToken');
        return await BlacklistedToken.findOne({ token: token.substring(0, 64) });
      },
      'checkBlacklistedToken'
    );
    
    const blacklisted = !!result;
    
    // Cache result
    cache.set(cacheKey, blacklisted, { ttl: 24 * 60 * 60 * 1000, segment: 'security' });
    
    return blacklisted;
  } catch (error) {
    console.error('[Auth] Error checking token blacklist:', error);
    return false;
  }
}

/**
 * Get user from database
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User object
 */
async function getUser(userId) {
  // Check cache first
  const cacheKey = `user:${userId}`;
  const cachedUser = cache.get(cacheKey, 'user');
  
  if (cachedUser) {
    return cachedUser;
  }
  
  // Get from database
  try {
    const user = await dbManager.executeQuery(
      async () => {
        const db = await dbManager.connectMongoose();
        const User = db.model('User');
        return await User.findById(userId).select('-password -__v');
      },
      'getUserById'
    );
    
    if (!user) {
      return null;
    }
    
    // Cache user
    cache.set(cacheKey, user, { ttl: 15 * 60 * 1000, segment: 'user' });
    
    return user;
  } catch (error) {
    console.error('[Auth] Error fetching user:', error);
    return null;
  }
}

/**
 * Authentication middleware
 * @param {Object} options - Options
 * @param {boolean} options.optional - If true, will not return 401 for missing token
 * @param {Array<string>} options.requiredRoles - Required roles for access
 * @returns {Function} Express middleware
 */
function requireAuth(options = {}) {
  const opts = {
    optional: false,
    requiredRoles: [],
    ...options
  };
  
  return async (req, res, next) => {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    let token;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    // Check if token exists
    if (!token) {
      if (opts.optional) {
        return next();
      }
      
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
        requestId: req.requestId
      });
    }
    
    try {
      // Check if token is blacklisted
      const blacklisted = await isTokenBlacklisted(token);
      
      if (blacklisted) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Token has been revoked',
          requestId: req.requestId
        });
      }
      
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET, {
        audience: JWT_AUDIENCE,
        issuer: JWT_ISSUER
      });
      
      // Get user from database
      const user = await getUser(decoded.sub);
      
      if (!user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not found',
          requestId: req.requestId
        });
      }
      
      // Check if user is active
      if (!user.active) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'User account is inactive',
          requestId: req.requestId
        });
      }
      
      // Check required roles
      if (opts.requiredRoles.length > 0) {
        const hasRequiredRole = opts.requiredRoles.some(role => user.roles.includes(role));
        
        if (!hasRequiredRole) {
          return res.status(403).json({
            error: 'Forbidden',
            message: 'Insufficient permissions',
            requestId: req.requestId
          });
        }
      }
      
      // Add user to request
      req.user = user;
      req.token = decoded;
      
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Token expired',
          requestId: req.requestId
        });
      }
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid token',
          requestId: req.requestId
        });
      }
      
      console.error('[Auth] Token verification error:', error);
      
      return res.status(500).json({
        error: 'Server Error',
        message: 'Authentication error',
        requestId: req.requestId
      });
    }
  };
}

// Export middleware factory
module.exports = requireAuth;
