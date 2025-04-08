/**
 * Middleware de rate limiting avancé pour Velo-Altitude
 * Protège les APIs contre les abus et assure une distribution équitable des ressources
 * Utilise des limites différentes selon le type d'utilisateur
 */

const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

// Configuration Redis (utilise la même instance que le cache)
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || '',
  tls: process.env.NODE_ENV === 'production' ? {} : undefined
});

// Configuration des limites par rôle
const rateLimitConfig = {
  public: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requêtes par fenêtre
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      status: 'error',
      message: 'Trop de requêtes, veuillez réessayer plus tard.'
    }
  },
  user: {
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false
  },
  premium: {
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false
  },
  admin: {
    windowMs: 15 * 60 * 1000,
    max: 5000,
    standardHeaders: true,
    legacyHeaders: false
  }
};

// Store Redis pour le rate limiting (pour la persistance entre redémarrages)
const redisStore = new RedisStore({
  client: redisClient,
  prefix: 'velo-altitude:ratelimit:'
});

/**
 * Middleware qui applique dynamiquement les limites en fonction du rôle de l'utilisateur
 */
const dynamicRateLimit = (req, res, next) => {
  // Déterminer le rôle/niveau de l'utilisateur
  let role = 'public';
  
  if (req.user) {
    if (req.user.role === 'admin') {
      role = 'admin';
    } else if (req.user.premium) {
      role = 'premium';
    } else {
      role = 'user';
    }
  }
  
  // Appliquer le rate limiter correspondant
  const limiter = rateLimit({
    ...rateLimitConfig[role],
    store: redisStore,
    keyGenerator: (req) => {
      // Utiliser une combinaison de l'IP et de l'ID utilisateur si disponible
      return req.user ? 
        `${req.ip}:${req.user.id}` : 
        req.ip;
    },
    skip: (req) => {
      // Ne pas appliquer le rate limiting pour certains endpoints critiques
      return req.path === '/auth/emergency-login' || 
             req.path === '/health';
    }
  });
  
  // Journaliser les informations de rate limiting en mode développement
  if (process.env.NODE_ENV === 'development') {
    console.log(`[RateLimiter] Applied ${role} limits for ${req.ip}`);
  }
  
  return limiter(req, res, next);
};

// Limiter spécifique pour les endpoints sensibles
const sensitiveEndpointLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 10, // 10 requêtes par heure
  store: redisStore,
  message: {
    status: 'error',
    message: 'Trop de tentatives, veuillez réessayer plus tard.'
  }
});

// Exporter les middlewares
module.exports = {
  dynamicRateLimit,
  sensitiveEndpointLimiter,
  rateConfigs: rateLimitConfig
};
