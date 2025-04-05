/**
 * Service de cache Redis pour les données nutritionnelles
 * Optimise les performances des requêtes nutrition fréquentes
 */

const Redis = require('ioredis');
const { promisify } = require('util');
const config = require('../config/redis');
const logger = require('../utils/logger');

// Initialisation du client Redis avec les options de connexion depuis la config
const redisClient = new Redis({
  host: config.host,
  port: config.port,
  password: config.password,
  db: config.nutritionDb,
  keyPrefix: 'nutrition:',
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

// Log des événements Redis pour le débogage
redisClient.on('error', (err) => {
  logger.error(`Redis Nutrition Cache Error: ${err.message}`, { service: 'nutritionCacheService' });
});

redisClient.on('connect', () => {
  logger.info('Redis Nutrition Cache connected successfully', { service: 'nutritionCacheService' });
});

// Configurations des TTL (Time-To-Live) par type de données
const CACHE_TTL = {
  // Données qui changent rarement
  USER_PROFILE: 60 * 60 * 24, // 24 heures
  FOOD_DATABASE: 60 * 60 * 24 * 7, // 7 jours
  NUTRITIONAL_INFO: 60 * 60 * 24 * 3, // 3 jours
  
  // Données qui changent fréquemment
  USER_NUTRITION_DATA: 60 * 15, // 15 minutes
  RECENT_RECIPES: 60 * 30, // 30 minutes
  MEAL_PLAN: 60 * 60, // 1 heure
  
  // Données calculées
  NUTRITION_CALCULATIONS: 60 * 60 * 2, // 2 heures
};

/**
 * Récupérer des données du cache
 * @param {string} key - Clé de cache 
 * @returns {Promise<Object|null>} Données mise en cache ou null si non trouvées
 */
async function getCache(key) {
  try {
    const data = await redisClient.get(key);
    if (!data) return null;
    
    const parsedData = JSON.parse(data);
    logger.debug(`Cache hit for key: ${key}`, { service: 'nutritionCacheService' });
    
    return parsedData;
  } catch (error) {
    logger.error(`Error getting cache for key ${key}: ${error.message}`, { 
      service: 'nutritionCacheService',
      stack: error.stack 
    });
    return null;
  }
}

/**
 * Mettre en cache des données avec TTL spécifié
 * @param {string} key - Clé de cache
 * @param {Object} data - Données à mettre en cache
 * @param {number} ttl - Durée de vie en secondes (utilise la valeur par défaut si non fournie)
 * @returns {Promise<boolean>} - Succès de l'opération
 */
async function setCache(key, data, ttl = null) {
  try {
    // Déterminer le TTL approprié basé sur le préfixe de la clé
    const defaultTtl = determineDefaultTtl(key);
    const finalTtl = ttl || defaultTtl;
    
    const serializedData = JSON.stringify(data);
    await redisClient.set(key, serializedData, 'EX', finalTtl);
    
    logger.debug(`Cache set for key: ${key} with TTL: ${finalTtl}s`, { 
      service: 'nutritionCacheService' 
    });
    
    return true;
  } catch (error) {
    logger.error(`Error setting cache for key ${key}: ${error.message}`, { 
      service: 'nutritionCacheService',
      stack: error.stack 
    });
    return false;
  }
}

/**
 * Invalider une entrée de cache
 * @param {string} key - Clé à invalider
 * @returns {Promise<boolean>} - Succès de l'opération
 */
async function invalidateCache(key) {
  try {
    await redisClient.del(key);
    logger.debug(`Cache invalidated for key: ${key}`, { service: 'nutritionCacheService' });
    return true;
  } catch (error) {
    logger.error(`Error invalidating cache for key ${key}: ${error.message}`, { 
      service: 'nutritionCacheService',
      stack: error.stack 
    });
    return false;
  }
}

/**
 * Invalider plusieurs entrées de cache par pattern
 * @param {string} pattern - Pattern de clés à invalider (ex: "user:123:*")
 * @returns {Promise<number>} - Nombre de clés supprimées
 */
async function invalidateCachePattern(pattern) {
  try {
    // Scan pour trouver toutes les clés correspondant au pattern
    const stream = redisClient.scanStream({
      match: pattern,
      count: 100
    });
    
    let deletedCount = 0;
    
    return new Promise((resolve, reject) => {
      stream.on('data', async (keys) => {
        if (keys.length) {
          const pipeline = redisClient.pipeline();
          keys.forEach(key => {
            pipeline.del(key);
            deletedCount++;
          });
          await pipeline.exec();
          logger.debug(`Batch deleted ${keys.length} keys matching pattern: ${pattern}`, { 
            service: 'nutritionCacheService' 
          });
        }
      });
      
      stream.on('end', () => {
        logger.info(`Cache invalidation complete for pattern: ${pattern}, deleted ${deletedCount} keys`, { 
          service: 'nutritionCacheService' 
        });
        resolve(deletedCount);
      });
      
      stream.on('error', (err) => {
        logger.error(`Error during cache invalidation for pattern ${pattern}: ${err.message}`, { 
          service: 'nutritionCacheService',
          stack: err.stack 
        });
        reject(err);
      });
    });
  } catch (error) {
    logger.error(`Error invalidating cache for pattern ${pattern}: ${error.message}`, { 
      service: 'nutritionCacheService',
      stack: error.stack 
    });
    return 0;
  }
}

/**
 * Récupère une valeur du cache avec la stratégie stale-while-revalidate
 * @param {string} key - Clé de cache
 * @param {Function} fetchFunction - Fonction pour récupérer les données fraîches
 * @param {number} staleTime - Temps en secondes pendant lequel les données sont considérées comme fraîches
 * @param {number} maxAge - Temps maximal en secondes pendant lequel les données peuvent être utilisées même si stale
 * @returns {Promise<Object>} - Données (du cache ou fraîchement récupérées)
 */
async function getWithStaleWhileRevalidate(key, fetchFunction, staleTime = 300, maxAge = 3600) {
  try {
    // Structure du cache: { data: {...}, timestamp: Number }
    const cached = await getCache(key);
    
    // Si aucune donnée en cache, récupérer les données fraîches et les mettre en cache
    if (!cached) {
      logger.debug(`Cache miss for key: ${key}, fetching fresh data`, { service: 'nutritionCacheService' });
      const freshData = await fetchFunction();
      const dataWithTimestamp = {
        data: freshData,
        timestamp: Date.now()
      };
      await setCache(key, dataWithTimestamp, maxAge);
      return freshData;
    }
    
    const now = Date.now();
    const isStale = now - cached.timestamp > staleTime * 1000;
    
    // Si les données sont fraîches, les retourner directement
    if (!isStale) {
      logger.debug(`Returning fresh cached data for key: ${key}`, { service: 'nutritionCacheService' });
      return cached.data;
    }
    
    // Si les données sont stale mais encore utilisables, revalider en arrière-plan
    logger.debug(`Stale cache hit for key: ${key}, revalidating in background`, { service: 'nutritionCacheService' });
    
    // Revalidation asynchrone
    (async () => {
      try {
        const freshData = await fetchFunction();
        const dataWithTimestamp = {
          data: freshData,
          timestamp: Date.now()
        };
        await setCache(key, dataWithTimestamp, maxAge);
        logger.debug(`Background revalidation complete for key: ${key}`, { service: 'nutritionCacheService' });
      } catch (revalidationError) {
        logger.error(`Background revalidation failed for key ${key}: ${revalidationError.message}`, { 
          service: 'nutritionCacheService',
          stack: revalidationError.stack 
        });
      }
    })();
    
    // Retourner les données stale immédiatement
    return cached.data;
  } catch (error) {
    logger.error(`Error in stale-while-revalidate for key ${key}: ${error.message}`, { 
      service: 'nutritionCacheService',
      stack: error.stack 
    });
    
    // En cas d'erreur, tenter de récupérer les données fraîches directement
    return await fetchFunction();
  }
}

/**
 * Détermine le TTL par défaut en fonction du préfixe de la clé
 * @param {string} key - Clé de cache
 * @returns {number} - TTL en secondes
 */
function determineDefaultTtl(key) {
  if (key.includes('user:profile:')) return CACHE_TTL.USER_PROFILE;
  if (key.includes('food:database:')) return CACHE_TTL.FOOD_DATABASE;
  if (key.includes('nutrition:info:')) return CACHE_TTL.NUTRITIONAL_INFO;
  if (key.includes('user:nutrition:')) return CACHE_TTL.USER_NUTRITION_DATA;
  if (key.includes('recipes:recent:')) return CACHE_TTL.RECENT_RECIPES;
  if (key.includes('meal:plan:')) return CACHE_TTL.MEAL_PLAN;
  if (key.includes('calculations:')) return CACHE_TTL.NUTRITION_CALCULATIONS;
  
  // Valeur par défaut: 1 heure
  return 3600;
}

/**
 * Mise en mémoire d'une fonction pour accélérer les appels répétitifs
 * @param {Function} fn - Fonction à mettre en mémoire
 * @param {number} ttl - Durée de vie en secondes
 * @returns {Function} - Fonction mise en mémoire
 */
function memoize(fn, ttl = 60) {
  const cache = new Map();
  
  return async function(...args) {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      const { value, timestamp } = cache.get(key);
      const isValid = (Date.now() - timestamp) < ttl * 1000;
      
      if (isValid) return value;
    }
    
    const result = await fn(...args);
    cache.set(key, { value: result, timestamp: Date.now() });
    
    // Nettoyage pour éviter les fuites de mémoire
    setTimeout(() => {
      cache.delete(key);
    }, ttl * 1000);
    
    return result;
  };
}

module.exports = {
  getCache,
  setCache,
  invalidateCache,
  invalidateCachePattern,
  getWithStaleWhileRevalidate,
  memoize,
  CACHE_TTL,
  redisClient
};
