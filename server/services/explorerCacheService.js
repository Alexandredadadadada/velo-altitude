/**
 * Service de cache spécialisé pour l'Explorateur de Cols
 * Optimisé pour les requêtes géospatiales et les données d'élévation
 */

const { explorerCluster, shardingStrategies } = require('../config/redis-cluster');
const logger = require('../utils/logger');

// Constantes de TTL par type de données
const CACHE_TTL = {
  // Données statiques (changement rare)
  COL_DETAILS: 60 * 60 * 24 * 7,    // 7 jours
  ROUTE_DETAILS: 60 * 60 * 24 * 3,  // 3 jours
  ELEVATION_DATA: 60 * 60 * 24 * 30, // 30 jours (très statique)
  
  // Données semi-dynamiques
  REGION_SUMMARY: 60 * 60 * 12,     // 12 heures
  POPULAR_COLS: 60 * 60 * 4,        // 4 heures
  
  // Données dynamiques (changement fréquent)
  WEATHER_ON_COLS: 60 * 15,         // 15 minutes
  USER_FAVORITE_COLS: 60 * 5,       // 5 minutes
  RECENT_ACTIVITIES: 60 * 10,       // 10 minutes
};

/**
 * Cache pour les détails d'un col spécifique
 * @param {string} colId - Identifiant du col
 * @param {Object} data - Données à mettre en cache
 * @param {number} ttl - Durée de vie en secondes (facultatif)
 * @returns {Promise<boolean>} - Succès de l'opération
 */
async function cacheColDetails(colId, data, ttl = CACHE_TTL.COL_DETAILS) {
  try {
    const key = `col:${colId}:details`;
    const serializedData = JSON.stringify(data);
    
    // Utilisation du client cluster avec le keyPrefix 'explorer:'
    await explorerCluster.set(key, serializedData, 'EX', ttl);
    
    logger.debug(`Col details cached: ${colId}`, { service: 'explorerCacheService' });
    return true;
  } catch (error) {
    logger.error(`Error caching col details: ${error.message}`, {
      service: 'explorerCacheService',
      stack: error.stack,
      colId
    });
    return false;
  }
}

/**
 * Récupère les détails d'un col depuis le cache
 * @param {string} colId - Identifiant du col
 * @returns {Promise<Object|null>} - Données mises en cache ou null
 */
async function getColDetailsFromCache(colId) {
  try {
    const key = `col:${colId}:details`;
    const data = await explorerCluster.get(key);
    
    if (!data) {
      logger.debug(`Col details cache miss: ${colId}`, { service: 'explorerCacheService' });
      return null;
    }
    
    logger.debug(`Col details cache hit: ${colId}`, { service: 'explorerCacheService' });
    return JSON.parse(data);
  } catch (error) {
    logger.error(`Error getting col details from cache: ${error.message}`, {
      service: 'explorerCacheService',
      stack: error.stack,
      colId
    });
    return null;
  }
}

/**
 * Cache pour les cols dans une région géographique
 * Utilise une stratégie avancée de mise en cache par quadrillage géographique
 * @param {number} lat - Latitude centrale
 * @param {number} lng - Longitude centrale
 * @param {number} radius - Rayon de recherche en km
 * @param {Array<Object>} cols - Liste des cols à mettre en cache
 * @param {number} ttl - Durée de vie en secondes (facultatif)
 * @returns {Promise<boolean>} - Succès de l'opération
 */
async function cacheColsInRegion(lat, lng, radius, cols, ttl = CACHE_TTL.REGION_SUMMARY) {
  try {
    // Utilisation de la stratégie de sharding géographique pour optimiser la distribution
    const geoPrefix = shardingStrategies.weatherDataStrategy(lat, lng, 1);
    const key = `${geoPrefix}:region:${radius}km`;
    
    const serializedData = JSON.stringify({
      center: { lat, lng },
      radius,
      cols,
      timestamp: Date.now()
    });
    
    await explorerCluster.set(key, serializedData, 'EX', ttl);
    
    logger.debug(`Cols in region cached: ${lat},${lng},${radius}km (${cols.length} cols)`, {
      service: 'explorerCacheService',
      count: cols.length
    });
    
    return true;
  } catch (error) {
    logger.error(`Error caching cols in region: ${error.message}`, {
      service: 'explorerCacheService',
      stack: error.stack,
      location: `${lat},${lng},${radius}km`
    });
    return false;
  }
}

/**
 * Récupère les cols dans une région depuis le cache
 * @param {number} lat - Latitude centrale
 * @param {number} lng - Longitude centrale
 * @param {number} radius - Rayon de recherche en km
 * @param {number} maxAge - Âge maximum des données en secondes
 * @returns {Promise<Array<Object>|null>} - Liste des cols ou null
 */
async function getColsInRegionFromCache(lat, lng, radius, maxAge = CACHE_TTL.REGION_SUMMARY) {
  try {
    const geoPrefix = shardingStrategies.weatherDataStrategy(lat, lng, 1);
    const key = `${geoPrefix}:region:${radius}km`;
    
    const data = await explorerCluster.get(key);
    
    if (!data) {
      logger.debug(`Cols in region cache miss: ${lat},${lng},${radius}km`, {
        service: 'explorerCacheService'
      });
      return null;
    }
    
    const parsedData = JSON.parse(data);
    
    // Vérifier la fraîcheur des données
    const ageInSeconds = (Date.now() - parsedData.timestamp) / 1000;
    if (ageInSeconds > maxAge) {
      logger.debug(`Cols in region cache expired: ${lat},${lng},${radius}km (age: ${ageInSeconds}s)`, {
        service: 'explorerCacheService',
        age: ageInSeconds
      });
      return null;
    }
    
    logger.debug(`Cols in region cache hit: ${lat},${lng},${radius}km (${parsedData.cols.length} cols)`, {
      service: 'explorerCacheService',
      count: parsedData.cols.length
    });
    
    return parsedData.cols;
  } catch (error) {
    logger.error(`Error getting cols in region from cache: ${error.message}`, {
      service: 'explorerCacheService',
      stack: error.stack,
      location: `${lat},${lng},${radius}km`
    });
    return null;
  }
}

/**
 * Cache pour les données d'élévation
 * @param {string} path - Chemin encodé de la route
 * @param {Array<Object>} elevationData - Données d'élévation
 * @returns {Promise<boolean>} - Succès de l'opération
 */
async function cacheElevationData(path, elevationData, ttl = CACHE_TTL.ELEVATION_DATA) {
  try {
    // Utiliser un hash du chemin pour créer une clé plus courte
    const pathHash = require('crypto').createHash('md5').update(path).digest('hex');
    const key = `elevation:${pathHash}`;
    
    const serializedData = JSON.stringify(elevationData);
    
    await explorerCluster.set(key, serializedData, 'EX', ttl);
    
    logger.debug(`Elevation data cached for path: ${pathHash}`, {
      service: 'explorerCacheService',
      pathLength: path.length,
      dataPoints: elevationData.length
    });
    
    return true;
  } catch (error) {
    logger.error(`Error caching elevation data: ${error.message}`, {
      service: 'explorerCacheService',
      stack: error.stack
    });
    return false;
  }
}

/**
 * Récupère les données d'élévation depuis le cache
 * @param {string} path - Chemin encodé de la route
 * @returns {Promise<Array<Object>|null>} - Données d'élévation ou null
 */
async function getElevationDataFromCache(path) {
  try {
    const pathHash = require('crypto').createHash('md5').update(path).digest('hex');
    const key = `elevation:${pathHash}`;
    
    const data = await explorerCluster.get(key);
    
    if (!data) {
      logger.debug(`Elevation data cache miss for path: ${pathHash}`, {
        service: 'explorerCacheService'
      });
      return null;
    }
    
    logger.debug(`Elevation data cache hit for path: ${pathHash}`, {
      service: 'explorerCacheService'
    });
    
    return JSON.parse(data);
  } catch (error) {
    logger.error(`Error getting elevation data from cache: ${error.message}`, {
      service: 'explorerCacheService',
      stack: error.stack
    });
    return null;
  }
}

/**
 * Cache pour les itinéraires populaires
 * @param {string} regionId - Identifiant de la région
 * @param {Array<Object>} routes - Itinéraires populaires
 * @param {number} ttl - Durée de vie en secondes (facultatif)
 * @returns {Promise<boolean>} - Succès de l'opération
 */
async function cachePopularRoutes(regionId, routes, ttl = CACHE_TTL.POPULAR_COLS) {
  try {
    const key = `region:${regionId}:popular_routes`;
    const serializedData = JSON.stringify({
      routes,
      timestamp: Date.now()
    });
    
    await explorerCluster.set(key, serializedData, 'EX', ttl);
    
    logger.debug(`Popular routes cached for region: ${regionId} (${routes.length} routes)`, {
      service: 'explorerCacheService',
      count: routes.length
    });
    
    return true;
  } catch (error) {
    logger.error(`Error caching popular routes: ${error.message}`, {
      service: 'explorerCacheService',
      stack: error.stack,
      regionId
    });
    return false;
  }
}

/**
 * Récupère les itinéraires populaires depuis le cache
 * @param {string} regionId - Identifiant de la région
 * @returns {Promise<Array<Object>|null>} - Itinéraires populaires ou null
 */
async function getPopularRoutesFromCache(regionId) {
  try {
    const key = `region:${regionId}:popular_routes`;
    const data = await explorerCluster.get(key);
    
    if (!data) {
      logger.debug(`Popular routes cache miss for region: ${regionId}`, {
        service: 'explorerCacheService'
      });
      return null;
    }
    
    const parsedData = JSON.parse(data);
    
    logger.debug(`Popular routes cache hit for region: ${regionId} (${parsedData.routes.length} routes)`, {
      service: 'explorerCacheService',
      count: parsedData.routes.length
    });
    
    return parsedData.routes;
  } catch (error) {
    logger.error(`Error getting popular routes from cache: ${error.message}`, {
      service: 'explorerCacheService',
      stack: error.stack,
      regionId
    });
    return null;
  }
}

/**
 * Cache pour les conditions météo sur un col
 * @param {string} colId - Identifiant du col
 * @param {Object} weatherData - Données météo
 * @param {number} ttl - Durée de vie en secondes (facultatif)
 * @returns {Promise<boolean>} - Succès de l'opération
 */
async function cacheColWeather(colId, weatherData, ttl = CACHE_TTL.WEATHER_ON_COLS) {
  try {
    const key = `col:${colId}:weather`;
    const serializedData = JSON.stringify({
      ...weatherData,
      timestamp: Date.now()
    });
    
    await explorerCluster.set(key, serializedData, 'EX', ttl);
    
    logger.debug(`Weather data cached for col: ${colId}`, {
      service: 'explorerCacheService'
    });
    
    return true;
  } catch (error) {
    logger.error(`Error caching col weather: ${error.message}`, {
      service: 'explorerCacheService',
      stack: error.stack,
      colId
    });
    return false;
  }
}

/**
 * Récupère les conditions météo d'un col depuis le cache
 * @param {string} colId - Identifiant du col
 * @returns {Promise<Object|null>} - Données météo ou null
 */
async function getColWeatherFromCache(colId) {
  try {
    const key = `col:${colId}:weather`;
    const data = await explorerCluster.get(key);
    
    if (!data) {
      logger.debug(`Weather data cache miss for col: ${colId}`, {
        service: 'explorerCacheService'
      });
      return null;
    }
    
    const parsedData = JSON.parse(data);
    
    logger.debug(`Weather data cache hit for col: ${colId}`, {
      service: 'explorerCacheService'
    });
    
    return parsedData;
  } catch (error) {
    logger.error(`Error getting col weather from cache: ${error.message}`, {
      service: 'explorerCacheService',
      stack: error.stack,
      colId
    });
    return null;
  }
}

/**
 * Invalide les données en cache pour une région géographique
 * @param {string} regionId - Identifiant de la région
 * @returns {Promise<number>} - Nombre de clés invalidées
 */
async function invalidateRegionCache(regionId) {
  try {
    const pattern = `region:${regionId}:*`;
    
    // Utiliser SCAN pour trouver toutes les clés correspondant au pattern
    const keys = await scanKeys(pattern);
    
    if (keys.length === 0) {
      logger.debug(`No keys found to invalidate for region: ${regionId}`, {
        service: 'explorerCacheService'
      });
      return 0;
    }
    
    // Supprimer les clés en batch
    await explorerCluster.del(...keys);
    
    logger.debug(`Invalidated cache for region: ${regionId} (${keys.length} keys)`, {
      service: 'explorerCacheService',
      count: keys.length
    });
    
    return keys.length;
  } catch (error) {
    logger.error(`Error invalidating region cache: ${error.message}`, {
      service: 'explorerCacheService',
      stack: error.stack,
      regionId
    });
    return 0;
  }
}

/**
 * Utilitaire pour scanner les clés correspondant à un pattern
 * @param {string} pattern - Pattern de clés à chercher
 * @returns {Promise<Array<string>>} - Liste des clés trouvées
 * @private
 */
async function scanKeys(pattern) {
  const keys = [];
  let cursor = '0';
  
  do {
    // Dans un environnement cluster, SCAN fonctionne différemment
    // On doit faire un SCAN sur chaque nœud du cluster
    const result = await explorerCluster.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
    cursor = result[0];
    keys.push(...result[1]);
  } while (cursor !== '0');
  
  return keys;
}

// Exporter les fonctions du service
module.exports = {
  // Cache pour les cols
  cacheColDetails,
  getColDetailsFromCache,
  cacheColsInRegion,
  getColsInRegionFromCache,
  
  // Cache pour les données d'élévation
  cacheElevationData,
  getElevationDataFromCache,
  
  // Cache pour les itinéraires
  cachePopularRoutes,
  getPopularRoutesFromCache,
  
  // Cache pour les données météo
  cacheColWeather,
  getColWeatherFromCache,
  
  // Utilitaires d'invalidation
  invalidateRegionCache,
  
  // Constantes
  CACHE_TTL
};
