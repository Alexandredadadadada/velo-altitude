/**
 * Middleware de limitation de taux de requêtes (rate limiting)
 * Protège les endpoints contre les abus et les attaques par déni de service
 */

const { RateLimiterMemory, RateLimiterRedis } = require('rate-limiter-flexible');
const redis = require('redis');
const { logger } = require('../utils/logger');
const errorService = require('../services/error.service');
const config = require('../config/api.config');

// Configuration des limiteurs
const limiterConfigs = {
  // Limiteur standard pour les requêtes API générales
  standard: {
    points: 60,           // Nombre de requêtes autorisées
    duration: 60,         // Période en secondes (1 minute)
    blockDuration: 0,     // Pas de blocage automatique
    keyPrefix: 'rlim_std' // Préfixe pour les clés Redis
  },
  
  // Limiteur strict pour les endpoints sensibles (authentification, etc.)
  strict: {
    points: 10,           // Nombre de requêtes autorisées
    duration: 60,         // Période en secondes (1 minute)
    blockDuration: 300,   // Blocage de 5 minutes après dépassement
    keyPrefix: 'rlim_str' // Préfixe pour les clés Redis
  },
  
  // Limiteur pour les endpoints d'administration
  admin: {
    points: 120,          // Nombre de requêtes autorisées
    duration: 60,         // Période en secondes (1 minute)
    blockDuration: 0,     // Pas de blocage automatique
    keyPrefix: 'rlim_adm' // Préfixe pour les clés Redis
  },
  
  // Limiteur pour les API externes (OpenRouteService, etc.)
  external: {
    points: 5,            // Nombre de requêtes autorisées
    duration: 10,         // Période en secondes (10 secondes)
    blockDuration: 0,     // Pas de blocage automatique
    keyPrefix: 'rlim_ext' // Préfixe pour les clés Redis
  }
};

// Initialisation des limiteurs
let limiters = {};

// Fonction d'initialisation des limiteurs
const initLimiters = () => {
  try {
    // Vérifier si Redis est configuré et disponible
    if (config.redis && config.redis.host) {
      logger.info('[RATE-LIMITER] Initialisation des limiteurs avec Redis');
      
      // Créer un client Redis
      const redisClient = redis.createClient({
        host: config.redis.host,
        port: config.redis.port || 6379,
        password: config.redis.password,
        enable_offline_queue: false,
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            // Erreur de connexion, revenir au limiteur en mémoire
            logger.warn('[RATE-LIMITER] Connexion Redis refusée, utilisation du limiteur en mémoire');
            initMemoryLimiters();
            return new Error('Redis non disponible');
          }
          
          // Stratégie de reconnexion
          if (options.total_retry_time > 1000 * 60 * 60) {
            // Arrêter de réessayer après 1 heure
            return new Error('Retry time exhausted');
          }
          if (options.attempt > 10) {
            // Arrêter de réessayer après 10 tentatives
            return new Error('Max retries reached');
          }
          
          // Réessayer avec un délai exponentiel
          return Math.min(options.attempt * 100, 3000);
        }
      });
      
      // Gérer les erreurs Redis
      redisClient.on('error', (err) => {
        logger.error(`[RATE-LIMITER] Erreur Redis: ${err.message}`);
        
        // Si Redis n'est pas disponible, revenir aux limiteurs en mémoire
        if (!limiters.memory) {
          logger.warn('[RATE-LIMITER] Basculement vers les limiteurs en mémoire');
          initMemoryLimiters();
        }
      });
      
      // Initialiser les limiteurs Redis
      Object.entries(limiterConfigs).forEach(([name, config]) => {
        limiters[name] = new RateLimiterRedis({
          ...config,
          storeClient: redisClient
        });
      });
      
      logger.info('[RATE-LIMITER] Limiteurs Redis initialisés avec succès');
    } else {
      // Redis non configuré, utiliser les limiteurs en mémoire
      logger.info('[RATE-LIMITER] Redis non configuré, utilisation des limiteurs en mémoire');
      initMemoryLimiters();
    }
  } catch (error) {
    logger.error(`[RATE-LIMITER] Erreur lors de l'initialisation des limiteurs: ${error.message}`);
    
    // En cas d'erreur, utiliser les limiteurs en mémoire
    initMemoryLimiters();
  }
};

// Initialisation des limiteurs en mémoire (fallback)
const initMemoryLimiters = () => {
  Object.entries(limiterConfigs).forEach(([name, config]) => {
    limiters[name] = new RateLimiterMemory(config);
  });
  
  // Marquer que nous utilisons les limiteurs en mémoire
  limiters.memory = true;
  
  logger.info('[RATE-LIMITER] Limiteurs en mémoire initialisés avec succès');
};

// Initialiser les limiteurs au démarrage
initLimiters();

/**
 * Middleware de limitation de taux générique
 * @param {string} type Type de limiteur à utiliser (standard, strict, admin, external)
 * @param {Object} options Options supplémentaires
 * @returns {Function} Middleware Express
 */
const rateLimiter = (type = 'standard', options = {}) => {
  return async (req, res, next) => {
    try {
      // Vérifier si le limiteur existe
      if (!limiters[type]) {
        logger.warn(`[RATE-LIMITER] Type de limiteur inconnu: ${type}, utilisation du limiteur standard`);
        type = 'standard';
      }
      
      // Récupérer l'adresse IP du client
      const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      
      // Construire la clé unique pour cette requête
      let key = clientIP;
      
      // Si l'utilisateur est authentifié, utiliser son ID comme partie de la clé
      if (req.user && req.user._id) {
        key = `${req.user._id}:${clientIP}`;
      }
      
      // Si des options de personnalisation de clé sont fournies
      if (options.keyGenerator) {
        key = options.keyGenerator(req, key);
      }
      
      // Appliquer le limiteur
      await limiters[type].consume(key, options.weight || 1);
      
      // La requête est autorisée, continuer
      next();
    } catch (error) {
      // Si l'erreur vient du limiteur (quota dépassé)
      if (error.remainingPoints !== undefined) {
        // Calculer le temps d'attente avant la prochaine requête autorisée
        const waitTime = Math.ceil(error.msBeforeNext / 1000) || 1;
        
        // Ajouter les en-têtes de limitation
        res.set('Retry-After', String(waitTime));
        res.set('X-RateLimit-Limit', String(limiterConfigs[type].points));
        res.set('X-RateLimit-Remaining', String(0));
        res.set('X-RateLimit-Reset', String(Math.ceil(Date.now() / 1000 + waitTime)));
        
        // Créer une erreur appropriée
        const rateLimitError = errorService.createError({
          type: 'rate_limit_exceeded',
          message: `Trop de requêtes. Veuillez réessayer dans ${waitTime} secondes.`,
          severity: 'warning',
          details: {
            waitTime,
            limitType: type
          },
          notification: {
            type: 'toast',
            position: 'top-center',
            autoClose: 5000,
            requireConfirmation: false
          }
        });
        
        // Consigner l'événement
        const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        logger.warn(`[RATE-LIMITER] Limite dépassée pour ${clientIP} (type: ${type}, chemin: ${req.path})`);
        
        // Envoyer la réponse d'erreur
        return errorService.sendErrorResponse(res, rateLimitError, 429);
      }
      
      // Autre type d'erreur
      logger.error(`[RATE-LIMITER] Erreur: ${error.message}`);
      next(error);
    }
  };
};

// Middleware pour les requêtes API standard
exports.standardLimiter = (options = {}) => rateLimiter('standard', options);

// Middleware pour les endpoints sensibles
exports.strictLimiter = (options = {}) => rateLimiter('strict', options);

// Middleware pour les endpoints d'administration
exports.adminLimiter = (options = {}) => rateLimiter('admin', options);

// Middleware pour les appels aux API externes
exports.externalLimiter = (options = {}) => rateLimiter('external', options);

// Middleware dynamique basé sur le chemin de la requête
exports.dynamicLimiter = (options = {}) => {
  return (req, res, next) => {
    const path = req.path.toLowerCase();
    
    // Déterminer le type de limiteur en fonction du chemin
    let limiterType = 'standard';
    
    // Endpoints d'authentification
    if (path.includes('/auth/') || path.includes('/login') || path.includes('/register')) {
      limiterType = 'strict';
    }
    // Endpoints d'administration
    else if (path.includes('/admin/') || path.includes('/dashboard/')) {
      limiterType = 'admin';
    }
    // Endpoints d'API externes
    else if (path.includes('/external/') || path.includes('/proxy/')) {
      limiterType = 'external';
    }
    
    // Appliquer le limiteur approprié
    return rateLimiter(limiterType, options)(req, res, next);
  };
};

// Exporter les configurations pour permettre leur modification
exports.configs = limiterConfigs;

// Exporter les limiteurs pour un accès direct si nécessaire
exports.limiters = limiters;

// Fonction pour réinitialiser un limiteur pour une clé spécifique
exports.resetLimit = async (type, key) => {
  try {
    if (limiters[type]) {
      await limiters[type].delete(key);
      return true;
    }
    return false;
  } catch (error) {
    logger.error(`[RATE-LIMITER] Erreur lors de la réinitialisation du limiteur: ${error.message}`);
    return false;
  }
};
