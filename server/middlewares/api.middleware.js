/**
 * Middleware API
 * Fournit des middlewares pour la gestion des requêtes API, la pagination, le cache et la sécurité
 */

const errorService = require('../services/error.service').getInstance();
const cacheService = require('../services/cache.service').getInstance();
const paginationService = require('../services/pagination.service').getInstance();
const logger = require('../config/logger');

/**
 * Middleware pour la pagination des résultats
 * @param {Object} options - Options de pagination
 * @returns {Function} Middleware Express
 */
const paginate = (options = {}) => {
  return (req, res, next) => {
    try {
      // Obtenir les options de pagination à partir des paramètres de requête
      const paginationOptions = paginationService.getPaginationOptions(req.query, options);
      
      // Stocker les options de pagination dans la requête pour les utiliser dans les contrôleurs
      req.pagination = paginationOptions;
      
      // Mémoriser la requête paginée pour l'utilisateur si authentifié
      if (req.user && req.user.id) {
        const resourceType = req.baseUrl.split('/').pop();
        paginationService.cacheUserQuery(req.user.id, resourceType, req.query, paginationOptions);
      }
      
      // Fonction utilitaire pour créer une réponse paginée
      res.paginate = (data, total, additionalData = {}) => {
        const response = paginationService.createPaginatedResponse(
          data,
          total,
          req.pagination,
          additionalData
        );
        
        // Ajouter les en-têtes de pagination
        const totalPages = Math.ceil(total / req.pagination.limit);
        const linkHeader = paginationService.generateLinkHeader(
          `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}`,
          req.pagination,
          totalPages
        );
        
        res.set('X-Total-Count', total.toString());
        res.set('X-Total-Pages', totalPages.toString());
        res.set('X-Current-Page', req.pagination.page.toString());
        res.set('Link', linkHeader);
        
        return res.json(response);
      };
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware pour la mise en cache des réponses API
 * @param {number} ttl - Durée de vie du cache en secondes
 * @param {Object} options - Options supplémentaires
 * @returns {Function} Middleware Express
 */
const cache = (ttl = 300, options = {}) => {
  return async (req, res, next) => {
    // Ne pas mettre en cache les requêtes non-GET ou si le cache est désactivé
    if (req.method !== 'GET' || options.disabled === true) {
      return next();
    }
    
    try {
      // Générer une clé de cache basée sur l'URL et les paramètres
      const cacheKey = cacheService.generateKey('api', {
        url: req.originalUrl,
        userId: req.user ? req.user.id : 'anonymous'
      });
      
      // Vérifier si la réponse est déjà en cache
      const cachedResponse = await cacheService.get(cacheKey);
      
      if (cachedResponse) {
        // Restaurer les en-têtes depuis le cache
        if (cachedResponse.headers) {
          Object.entries(cachedResponse.headers).forEach(([key, value]) => {
            res.set(key, value);
          });
        }
        
        // Envoyer la réponse mise en cache
        return res.status(cachedResponse.status || 200).json(cachedResponse.data);
      }
      
      // Intercepter la méthode json pour mettre en cache la réponse
      const originalJson = res.json;
      res.json = function(data) {
        // Stocker la réponse en cache seulement si le statut est 200
        if (res.statusCode === 200) {
          const headers = {};
          
          // Capturer les en-têtes importants
          ['X-Total-Count', 'X-Total-Pages', 'X-Current-Page', 'Link'].forEach(header => {
            if (res.get(header)) {
              headers[header] = res.get(header);
            }
          });
          
          // Stocker la réponse dans le cache
          cacheService.set(cacheKey, {
            data,
            status: res.statusCode,
            headers
          }, ttl, { hot: options.hot });
        }
        
        // Appeler la méthode json d'origine
        return originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      logger.error(`[Cache Middleware] Erreur: ${error.message}`);
      next(); // Continuer sans cache en cas d'erreur
    }
  };
};

/**
 * Middleware pour la gestion des erreurs API
 * @returns {Function} Middleware Express
 */
const errorHandler = () => {
  return errorService.getErrorMiddleware();
};

/**
 * Middleware pour limiter le taux de requêtes
 * @param {Object} options - Options de limitation
 * @returns {Function} Middleware Express
 */
const rateLimit = (options = {}) => {
  const defaults = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requêtes par fenêtre
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Trop de requêtes, veuillez réessayer plus tard'
  };
  
  const config = { ...defaults, ...options };
  
  return async (req, res, next) => {
    try {
      // Identifier l'utilisateur par son ID ou son IP
      const identifier = req.user ? req.user.id : req.ip;
      
      // Clé de cache pour le compteur de requêtes
      const key = `ratelimit:${identifier}:${req.baseUrl}`;
      
      // Obtenir le compteur actuel
      const counter = await cacheService.get(key) || { count: 0, resetAt: Date.now() + config.windowMs };
      
      // Réinitialiser le compteur si la fenêtre est expirée
      if (counter.resetAt < Date.now()) {
        counter.count = 0;
        counter.resetAt = Date.now() + config.windowMs;
      }
      
      // Incrémenter le compteur
      counter.count++;
      
      // Mettre à jour le compteur dans le cache
      const ttl = Math.ceil(config.windowMs / 1000);
      await cacheService.set(key, counter, ttl);
      
      // Ajouter les en-têtes de limitation
      if (config.standardHeaders) {
        res.set('RateLimit-Limit', config.max.toString());
        res.set('RateLimit-Remaining', Math.max(0, config.max - counter.count).toString());
        res.set('RateLimit-Reset', Math.ceil(counter.resetAt / 1000).toString());
      }
      
      if (config.legacyHeaders) {
        res.set('X-RateLimit-Limit', config.max.toString());
        res.set('X-RateLimit-Remaining', Math.max(0, config.max - counter.count).toString());
        res.set('X-RateLimit-Reset', Math.ceil(counter.resetAt / 1000).toString());
      }
      
      // Vérifier si la limite est dépassée
      if (counter.count > config.max) {
        return errorService.sendErrorResponse(
          res,
          errorService.ERROR_TYPES.RATE_LIMIT,
          config.message,
          { limit: config.max, window: config.windowMs / 1000 }
        );
      }
      
      next();
    } catch (error) {
      logger.error(`[Rate Limit Middleware] Erreur: ${error.message}`);
      next(); // Continuer sans limitation en cas d'erreur
    }
  };
};

/**
 * Middleware pour valider les paramètres de requête
 * @param {Object} schema - Schéma de validation Joi
 * @param {string} source - Source des données à valider (body, query, params)
 * @returns {Function} Middleware Express
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      if (!schema || !schema.validate) {
        return next();
      }
      
      const { error, value } = schema.validate(req[source], { abortEarly: false });
      
      if (error) {
        const details = error.details.map(detail => ({
          message: detail.message,
          path: detail.path.join('.')
        }));
        
        return errorService.sendErrorResponse(
          res,
          errorService.ERROR_TYPES.VALIDATION,
          'Données invalides',
          { details }
        );
      }
      
      // Remplacer les données validées
      req[source] = value;
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  paginate,
  cache,
  errorHandler,
  rateLimit,
  validate
};
