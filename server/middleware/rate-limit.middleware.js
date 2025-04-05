/**
 * Middleware de limitation de débit (rate limiting)
 * Protège les API contre les abus et les attaques par déni de service
 */
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('../config/redis');
const logger = require('../utils/logger');
const errorService = require('../services/error.service').getInstance();

// Configuration par défaut
const DEFAULT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const DEFAULT_MAX = 100; // 100 requêtes par fenêtre

// Store Redis pour le rate limiting (si Redis est configuré)
let limiterStore;

try {
  if (redis.client) {
    limiterStore = new RedisStore({
      // Configuration pour Redis v4+
      sendCommand: (...args) => redis.client.sendCommand(args),
      prefix: 'ratelimit:'
    });
    logger.info('Rate limiter using Redis store');
  } else {
    logger.info('Rate limiter using memory store (Redis not available)');
  }
} catch (error) {
  logger.warn(`Failed to initialize Redis store for rate limiter: ${error.message}`);
}

/**
 * Crée un middleware de limitation de débit
 * @param {Object} options - Options de configuration
 * @returns {Function} Middleware Express
 */
const createRateLimiter = (options = {}) => {
  const config = {
    windowMs: options.windowMs || DEFAULT_WINDOW_MS,
    max: options.max || DEFAULT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    store: limiterStore,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    keyGenerator: options.keyGenerator || ((req) => {
      // Utiliser l'ID utilisateur si disponible, sinon l'IP
      return req.user ? `user:${req.user.userId}` : req.ip;
    }),
    handler: (req, res, next, options) => {
      const error = errorService.createError(
        'RATE_LIMIT_EXCEEDED',
        'Trop de requêtes, veuillez réessayer plus tard',
        {
          retryAfter: Math.ceil(options.windowMs / 1000),
          limit: options.max
        }
      );
      
      return errorService.sendErrorResponse(
        res,
        errorService.ERROR_TYPES.TOO_MANY_REQUESTS,
        error.message,
        error.details
      );
    }
  };
  
  return rateLimit(config);
};

// Limiteurs spécifiques pour différentes routes
module.exports = {
  // Limiteur général pour toutes les API
  general: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300 // 300 requêtes par fenêtre
  }),
  
  // Limiteur pour les opérations d'authentification
  auth: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 heure
    max: 10, // 10 tentatives par heure
    skipSuccessfulRequests: true // Ne pas compter les requêtes réussies
  }),
  
  // Limiteur pour la création d'avis
  limitReviewCreation: createRateLimiter({
    windowMs: 24 * 60 * 60 * 1000, // 24 heures
    max: 10 // 10 avis par jour
  }),
  
  // Limiteur pour la mise à jour d'avis
  limitReviewUpdates: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 heure
    max: 5 // 5 mises à jour par heure
  }),
  
  // Limiteur pour les interactions (j'aime, signalements)
  limitInteractions: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 heure
    max: 50 // 50 interactions par heure
  }),
  
  // Limiteur pour la recherche d'itinéraires
  limitRouteSearch: createRateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 30 // 30 recherches par 5 minutes
  }),
  
  // Limiteur pour les téléchargements de fichiers GPX
  limitGpxDownloads: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 heure
    max: 20 // 20 téléchargements par heure
  }),
  
  // Fonction utilitaire pour créer des limiteurs personnalisés
  createCustomLimiter: createRateLimiter
};
