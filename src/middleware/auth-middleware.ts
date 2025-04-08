/**
 * Auth0 Authentication Middleware
 * 
 * This middleware provides JWT verification, token blacklisting, and role-based access control.
 * It integrates with the existing backend security infrastructure and monitoring.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'express-jwt';
import jwksRsa from 'jwks-rsa';
import { auth0Config } from '../config/auth0';
import monitoringService from '../monitoring';
import { Redis } from 'ioredis';
import { redisConfig } from '../config/redis';

// Token blacklist cache using Redis
let tokenBlacklist: Redis | null = null;

// Initialize Redis for token blacklisting if enabled
try {
  // Create a modified config with proper tls format
  const redisConnectionOptions = {
    ...redisConfig,
    tls: redisConfig.tls ? {} : undefined // Convert boolean to empty object or undefined
  };
  
  tokenBlacklist = new Redis(redisConnectionOptions);
  console.log('[AuthMiddleware] Token blacklist Redis initialized');
  
  tokenBlacklist.on('error', (err) => {
    console.error('[AuthMiddleware] Redis error:', err);
    monitoringService.trackError('auth_redis_error', err, {
      service: 'AuthMiddleware'
    });
  });
} catch (error) {
  console.error('[AuthMiddleware] Failed to initialize Redis for token blacklist:', error);
  monitoringService.trackError('auth_redis_init_failed', error as Error, {
    service: 'AuthMiddleware'
  });
  tokenBlacklist = null;
}

// Middleware to validate JWT tokens
export const requireAuth = jwt({
  // Dynamically provide a signing key based on the kid in the header
  secret: jwksRsa.expressJwtSecret({
    cache: true,                       // Cache the signing keys
    rateLimit: true,                   // Enable rate limiting
    jwksRequestsPerMinute: 5,          // Limit requests per minute to avoid abuse
    jwksUri: `https://${auth0Config.domain}/.well-known/jwks.json`
  }),
  
  // Validate the audience and issuer
  audience: auth0Config.audience,
  issuer: `https://${auth0Config.domain}/`,
  algorithms: ['RS256'] // Auth0 uses RS256 as default
});

/**
 * Middleware to check if a token has been blacklisted
 * Uses Redis for distributed blacklist storage
 */
export const checkTokenBlacklist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    
    const token = authHeader.split(' ')[1];
    
    // If Redis is available, check blacklist
    if (tokenBlacklist) {
      const isBlacklisted = await tokenBlacklist.exists(`blacklist:${token}`);
      if (isBlacklisted) {
        monitoringService.trackEvent('auth_blacklisted_token_attempt', {
          path: req.path
        });
        return res.status(401).json({ message: 'Token has been revoked' });
      }
    }
    
    next();
  } catch (error) {
    console.error('[AuthMiddleware] Error checking token blacklist:', error);
    monitoringService.trackError('token_blacklist_check_error', error as Error);
    // Continue even if blacklist check fails, to avoid blocking legitimate requests
    next();
  }
};

/**
 * Add a token to the blacklist with an expiration time
 * @param token The JWT token to blacklist
 * @param expirySeconds Seconds until the token expires (from JWT exp claim)
 */
export const blacklistToken = async (token: string, expirySeconds: number = 3600): Promise<boolean> => {
  try {
    if (!tokenBlacklist) {
      console.warn('[AuthMiddleware] Token blacklist not available, cannot blacklist token');
      return false;
    }
    
    // Add to blacklist with expiration (no need to store revoked tokens forever)
    await tokenBlacklist.setex(`blacklist:${token}`, expirySeconds, '1');
    
    monitoringService.trackEvent('auth_token_blacklisted');
    return true;
  } catch (error) {
    console.error('[AuthMiddleware] Error blacklisting token:', error);
    monitoringService.trackError('token_blacklist_error', error as Error);
    return false;
  }
};

/**
 * Middleware to check specific user roles
 * @param requiredRoles Array of roles that are allowed to access the endpoint
 */
export const requireRoles = (requiredRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as { [key: string]: any } | undefined;
    
    if (!user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Check if the user has at least one of the required roles
    const userRoles: string[] = user.permissions || [];
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
    
    if (!hasRequiredRole) {
      monitoringService.trackEvent('auth_insufficient_permissions', {
        requiredRoles,
        userRoles,
        path: req.path
      });
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    
    next();
  };
};

/**
 * Middleware to extract user ID for rate limiting
 * Makes the user ID available on the request object for the rate limiter
 */
export const extractUserForRateLimit = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as { [key: string]: any } | undefined;
  
  if (user && user.sub) {
    // Add user ID to a custom property for rate limiters
    (req as any).userId = user.sub;
  } else {
    // Use IP address for anonymous requests
    (req as any).userId = req.ip || 'anonymous';
  }
  
  next();
};

/**
 * Error handler middleware for authentication errors
 */
export const handleAuthErrors = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err.name === 'UnauthorizedError') {
    monitoringService.trackEvent('auth_unauthorized_request', {
      path: req.path,
      errorType: err.name
    });
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
  
  next(err);
};

// Export a function to close the Redis connection
export const closeAuthConnections = async (): Promise<void> => {
  if (tokenBlacklist) {
    await tokenBlacklist.quit();
    tokenBlacklist = null;
    console.log('[AuthMiddleware] Redis connection closed');
  }
};

// Export the auth middleware configuration as an array for easy application
export const authMiddleware = [
  checkTokenBlacklist,
  requireAuth,
  extractUserForRateLimit
];

export default authMiddleware;
