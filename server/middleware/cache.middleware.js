/**
 * Middleware de cache pour les réponses API
 * Permet de mettre en cache les réponses des endpoints fréquemment appelés
 */

const cacheService = require('../services/cache.service');
const logger = require('../utils/logger');

/**
 * Middleware pour mettre en cache les réponses API
 * @param {number|string} ttl - Durée de vie en secondes ou type de contenu
 * @param {Function} keyGenerator - Fonction pour générer la clé de cache (optionnelle)
 * @returns {Function} - Middleware Express
 */
const cacheMiddleware = (ttl = 3600, keyGenerator = null) => {
  return async (req, res, next) => {
    // Ignorer le cache pour les méthodes non-GET
    if (req.method !== 'GET') {
      return next();
    }
    
    try {
      // Extraction du code pays depuis la requête
      const countryCode = req.query.country || req.headers['x-country-code'] || 'fr';
      
      // Déterminer la durée de vie du cache
      let cacheTTL = ttl;
      if (typeof ttl === 'string') {
        cacheTTL = getCacheTTL(ttl, countryCode);
      }
      
      // Générer la clé de cache
      const cacheKey = keyGenerator 
        ? keyGenerator(req)
        : `${req.originalUrl || req.url}`;
      
      // Vérifier le cache
      const cachedData = await cacheService.get(cacheKey);
      
      if (cachedData) {
        logger.debug(`Cache hit for ${cacheKey}`);
        return res.json(cachedData);
      }
      
      // Si pas en cache, intercepter la réponse
      const originalSend = res.json;
      
      res.json = function(data) {
        // Restaurer la méthode originale
        res.json = originalSend;
        
        // Mettre en cache si la réponse est un succès
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cacheService.set(cacheKey, data, cacheTTL)
            .catch(err => logger.error(`Error caching response: ${err.message}`));
        }
        
        // Envoyer la réponse
        return originalSend.call(this, data);
      };
      
      next();
    } catch (error) {
      logger.error(`Cache middleware error: ${error.message}`);
      next();
    }
  };
};

/**
 * Générateur de clé de cache pour les routes environnementales
 * @param {Object} req - Requête Express
 * @returns {string} - Clé de cache
 */
const environmentalCacheKeyGenerator = (req) => {
  // Extraction du code pays/région depuis la requête
  const countryCode = req.query.country || req.headers['x-country-code'] || 'fr';
  const regionCode = req.query.region || req.headers['x-region-code'] || '';
  
  if (req.path.includes('/weather') && req.query.lat && req.query.lng) {
    return `api:weather:${countryCode}:${parseFloat(req.query.lat).toFixed(2)}:${parseFloat(req.query.lng).toFixed(2)}`;
  }
  
  if (req.path.includes('/air-quality') && req.query.lat && req.query.lng) {
    return `api:air-quality:${countryCode}:${parseFloat(req.query.lat).toFixed(2)}:${parseFloat(req.query.lng).toFixed(2)}`;
  }
  
  if (req.path.includes('/route/') && req.params.routeId) {
    return `route:${countryCode}:${req.params.routeId}:environmental`;
  }
  
  if (req.path.includes('/predictions/route/') && req.params.routeId) {
    const date = req.query.date ? new Date(req.query.date).toISOString().split('T')[0] : 'default';
    return `route:${countryCode}:${req.params.routeId}:predictions:${date}`;
  }
  
  if (req.path.includes('/predictions/optimal-date/') && req.params.routeId) {
    return `route:${countryCode}:${req.params.routeId}:optimal-date`;
  }
  
  if (req.path.includes('/effort-estimation/route/') && req.params.routeId) {
    const date = req.query.date ? new Date(req.query.date).toISOString().split('T')[0] : 'default';
    const userId = req.query.userId || 'default';
    return `route:${countryCode}:${req.params.routeId}:effort:${date}:${userId}`;
  }
  
  return `api:environmental:${countryCode}:${regionCode}:${req.originalUrl || req.url}`;
};

/**
 * Générateur de clé de cache pour les routes d'entraînement
 * @param {Object} req - Requête Express
 * @returns {string} - Clé de cache
 */
const trainingCacheKeyGenerator = (req) => {
  // Extraction du code pays/région depuis la requête
  const countryCode = req.query.country || req.headers['x-country-code'] || 'fr';
  
  if (req.path.includes('/zones') && req.query.ftp) {
    return `api:training:zones:${req.query.ftp}`;
  }
  
  if (req.path.includes('/recommendations/') && req.params.userId) {
    return `user:${req.params.userId}:training:recommendations:${countryCode}`;
  }
  
  if (req.path.includes('/analyze/') && req.params.userId && req.params.activityId) {
    return `user:${req.params.userId}:activity:${req.params.activityId}:analysis`;
  }
  
  return `api:training:${countryCode}:${req.originalUrl || req.url}`;
};

/**
 * Générateur de clé de cache pour les routes de parcours
 * @param {Object} req - Requête Express
 * @returns {string} - Clé de cache
 */
const routeCacheKeyGenerator = (req) => {
  // Extraction du code pays/région depuis la requête
  const countryCode = req.query.country || req.headers['x-country-code'] || 'fr';
  const regionCode = req.query.region || req.headers['x-region-code'] || '';
  
  if (req.path.includes('/elevation/') && req.params.routeId) {
    return `route:${countryCode}:${req.params.routeId}:elevation`;
  }
  
  if (req.path.includes('/alternatives/') && req.params.routeId) {
    return `route:${countryCode}:${req.params.routeId}:alternatives`;
  }
  
  if (req.path.includes('/statistics/') && req.params.routeId) {
    return `route:${countryCode}:${req.params.routeId}:statistics`;
  }
  
  if (req.path.includes('/nearby') && req.query.lat && req.query.lng) {
    const radius = req.query.radius || 10;
    return `routes:${countryCode}:nearby:${parseFloat(req.query.lat).toFixed(2)}:${parseFloat(req.query.lng).toFixed(2)}:${radius}`;
  }
  
  return `api:routes:${countryCode}:${regionCode}:${req.originalUrl || req.url}`;
};

/**
 * Générateur de clé de cache pour les cols
 * @param {Object} req - Requête Express
 * @returns {string} - Clé de cache
 */
const colCacheKeyGenerator = (req) => {
  // Extraction du code pays/région depuis la requête
  const countryCode = req.query.country || req.headers['x-country-code'] || 'fr';
  const regionCode = req.query.region || req.headers['x-region-code'] || '';
  
  if (req.path.includes('/cols/') && req.params.colId) {
    return `col:${countryCode}:${req.params.colId}:details`;
  }
  
  if (req.path.includes('/segments') && req.params.colId) {
    return `col:${countryCode}:${req.params.colId}:segments`;
  }
  
  if (req.path.includes('/weather') && req.params.colId) {
    return `col:${countryCode}:${req.params.colId}:weather`;
  }
  
  if (req.path.includes('/routes') && req.params.colId) {
    return `col:${countryCode}:${req.params.colId}:routes`;
  }
  
  if (req.path.includes('/similar') && req.params.colId) {
    return `col:${countryCode}:${req.params.colId}:similar`;
  }
  
  if (req.path.includes('/cols') && req.query.search) {
    return `cols:${countryCode}:search:${req.query.search}`;
  }
  
  if (req.path.includes('/cols') && req.query.difficulty) {
    return `cols:${countryCode}:difficulty:${req.query.difficulty}`;
  }
  
  return `api:cols:${countryCode}:${regionCode}:${req.originalUrl || req.url}`;
};

/**
 * Obtient la durée de vie du cache en fonction du type de contenu et de la région
 * @param {string} contentType - Type de contenu (weather, route, col, etc.)
 * @param {string} countryCode - Code pays
 * @returns {number} - Durée de vie en secondes
 */
const getCacheTTL = (contentType, countryCode = 'fr') => {
  // TTL par défaut (1 heure)
  const defaultTTL = 3600;
  
  // TTL par type de contenu
  const contentTTL = {
    // Données météo (15-30 minutes selon le pays)
    'weather': {
      'default': 900, // 15 minutes
      'fr': 900,      // 15 minutes
      'es': 1200,     // 20 minutes (climat plus stable)
      'it': 1200,     // 20 minutes
      'de': 900,      // 15 minutes
      'be': 600,      // 10 minutes (climat changeant)
      'ch': 600,      // 10 minutes
      'uk': 600       // 10 minutes
    },
    // Données de cols (24-48 heures selon le pays)
    'col': {
      'default': 86400, // 24 heures
      'fr': 86400,      // 24 heures
      'es': 172800,     // 48 heures (moins de changements)
      'it': 172800,     // 48 heures
      'de': 86400,      // 24 heures
      'be': 86400,      // 24 heures
      'ch': 86400,      // 24 heures
      'uk': 86400       // 24 heures
    },
    // Segments de cols (1 semaine)
    'segment': {
      'default': 604800, // 1 semaine
    },
    // Itinéraires (12-24 heures selon le pays)
    'route': {
      'default': 43200, // 12 heures
      'fr': 43200,      // 12 heures
      'es': 86400,      // 24 heures
      'it': 86400,      // 24 heures
      'de': 43200,      // 12 heures
      'be': 43200,      // 12 heures
      'ch': 43200,      // 12 heures
      'uk': 43200       // 12 heures
    },
    // Données d'entraînement (6-12 heures)
    'training': {
      'default': 21600, // 6 heures
    },
    // Recherches (1-2 heures)
    'search': {
      'default': 3600,  // 1 heure
    }
  };
  
  // Récupérer le TTL pour le type de contenu et le pays
  if (contentTTL[contentType]) {
    return contentTTL[contentType][countryCode] || contentTTL[contentType]['default'] || defaultTTL;
  }
  
  return defaultTTL;
};

/**
 * Middleware pour invalider le cache lors de la modification d'une ressource
 * @param {Function} keyGenerator - Fonction pour générer les clés de cache à invalider
 * @returns {Function} - Middleware Express
 */
const invalidateCacheMiddleware = (keyGenerator) => {
  return async (req, res, next) => {
    // Capture la réponse originale
    const originalSend = res.json;
    
    res.json = function(data) {
      // Restaurer la méthode originale
      res.json = originalSend;
      
      // Invalider le cache si l'opération est un succès
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          // Obtenir les clés à invalider
          const patterns = keyGenerator(req, data);
          
          if (Array.isArray(patterns) && patterns.length > 0) {
            // Invalider chaque motif de clé
            patterns.forEach(pattern => {
              cacheService.delByPattern(pattern)
                .then(count => {
                  if (count > 0) {
                    logger.debug(`Invalidated ${count} cache entries with pattern: ${pattern}`);
                  }
                })
                .catch(err => logger.error(`Error invalidating cache: ${err.message}`));
            });
          }
        } catch (error) {
          logger.error(`Cache invalidation error: ${error.message}`);
        }
      }
      
      // Envoyer la réponse
      return originalSend.call(this, data);
    };
    
    next();
  };
};

module.exports = {
  cacheMiddleware,
  environmentalCacheKeyGenerator,
  trainingCacheKeyGenerator,
  routeCacheKeyGenerator,
  colCacheKeyGenerator,
  invalidateCacheMiddleware,
  getCacheTTL
};
