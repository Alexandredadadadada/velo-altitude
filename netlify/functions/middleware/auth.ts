import { auth, claimCheck, InsufficientScopeError } from 'express-oauth2-jwt-bearer';
import { NextFunction, Request, Response } from 'express';
import { createClient } from 'redis';

// Middleware pour vérifier les JWT
export const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
  tokenSigningAlg: 'RS256'
});

// Middleware pour vérifier les permissions spécifiques
export const checkPermissions = (requiredPermission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const permissionCheck = claimCheck((claims) => {
      const permissions = claims.permissions as string[];
      return Array.isArray(permissions) && permissions.includes(requiredPermission);
    });
    
    try {
      permissionCheck(req, res, (err) => {
        if (err) {
          throw new InsufficientScopeError();
        }
        next();
      });
    } catch (error) {
      res.status(403).json({
        error: 'insufficient_permissions',
        error_description: `Required permission: ${requiredPermission}`
      });
    }
  };
};

// Middleware pour vérifier les rôles spécifiques
export const checkRole = (requiredRole: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const roleCheck = claimCheck((claims) => {
      const roles = claims['https://velo-altitude.com/roles'] as string[];
      return Array.isArray(roles) && roles.includes(requiredRole);
    });
    
    try {
      roleCheck(req, res, (err) => {
        if (err) {
          throw new InsufficientScopeError();
        }
        next();
      });
    } catch (error) {
      res.status(403).json({
        error: 'insufficient_role',
        error_description: `Required role: ${requiredRole}`
      });
    }
  };
};

// Redis client pour blacklist de tokens
let redisClient: ReturnType<typeof createClient> | null = null;

const initRedisClient = async () => {
  if (!redisClient) {
    if (!process.env.REDIS_URL) {
      console.warn('REDIS_URL not set, token blacklisting will not be available');
      return null;
    }
    
    redisClient = createClient({
      url: process.env.REDIS_URL
    });
    
    redisClient.on('error', (err) => {
      console.error('Redis client error:', err);
      redisClient = null;
    });
    
    await redisClient.connect();
  }
  return redisClient;
};

// Middleware pour vérifier si un token est blacklisté
export const checkTokenBlacklist = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return next();
  }
  
  try {
    const client = await initRedisClient();
    if (!client) {
      return next();
    }
    
    const isBlacklisted = await client.get(`blacklist:${token}`);
    
    if (isBlacklisted) {
      return res.status(401).json({
        error: 'invalid_token',
        error_description: 'Token has been revoked'
      });
    }
    
    next();
  } catch (error) {
    console.error('Error checking token blacklist:', error);
    next();
  }
};

// Helper pour blacklister un token
export const blacklistToken = async (token: string, expiryTime: number) => {
  try {
    const client = await initRedisClient();
    if (!client) {
      return false;
    }
    
    await client.set(`blacklist:${token}`, 'revoked', {
      EX: expiryTime
    });
    
    return true;
  } catch (error) {
    console.error('Error blacklisting token:', error);
    return false;
  }
};
