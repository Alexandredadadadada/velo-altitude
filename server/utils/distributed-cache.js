/**
 * Système de cache distribué pour Dashboard-Velo
 * Optimisé pour les données des cols et les requêtes géospatiales à l'échelle européenne
 */

const Redis = require('redis');
const NodeCache = require('node-cache');
const { promisify } = require('util');
const logger = require('./logger');
const config = require('../config');

/**
 * Classe DistributedCache
 * Implémente un système de cache distribué avec Redis et fallback sur NodeCache
 * Optimisé pour les données géospatiales et les requêtes fréquentes
 */
class DistributedCache {
  constructor(options = {}) {
    this.options = {
      redisUrl: options.redisUrl || config.redis.url,
      redisPassword: options.redisPassword || config.redis.password,
      defaultTTL: options.defaultTTL || 3600, // 1 heure par défaut
      enableCompression: options.enableCompression !== false,
      compressionThreshold: options.compressionThreshold || 1024, // 1KB
      maxMemorySize: options.maxMemorySize || 100, // 100MB pour le cache local
      regionSpecificTTL: options.regionSpecificTTL || {
        western: 7200,  // 2 heures pour l'Europe occidentale (trafic élevé)
        eastern: 10800, // 3 heures pour l'Europe orientale (trafic modéré)
        northern: 10800, // 3 heures pour l'Europe du Nord (trafic modéré)
        southern: 7200,  // 2 heures pour l'Europe du Sud (trafic élevé)
        central: 7200   // 2 heures pour l'Europe centrale (trafic élevé)
      },
      colDataTTL: options.colDataTTL || 86400, // 24 heures pour les données des cols
      routeDataTTL: options.routeDataTTL || 43200, // 12 heures pour les données d'itinéraires
      weatherDataTTL: options.weatherDataTTL || 1800, // 30 minutes pour les données météo
      geoDataTTL: options.geoDataTTL || 604800, // 7 jours pour les données géographiques statiques
      statsDataTTL: options.statsDataTTL || 3600, // 1 heure pour les données statistiques
      ...options
    };

    // Initialiser le cache local (fallback)
    this.localCache = new NodeCache({
      stdTTL: this.options.defaultTTL,
      checkperiod: 120,
      maxKeys: -1, // Pas de limite de clés
      useClones: false, // Amélioration des performances
      deleteOnExpire: true
    });

    // Tenter de se connecter à Redis
    this.initRedisClient();

    // Statistiques du cache
    this.stats = {
      hits: 0,
      misses: 0,
      redisHits: 0,
      redisErrors: 0,
      localHits: 0,
      sets: 0,
      evictions: 0,
      lastReset: Date.now()
    };

    // Initialiser le nettoyage périodique
    this.initPeriodicCleanup();

    logger.info('DistributedCache initialisé');
  }

  /**
   * Initialise le client Redis avec reconnexion automatique
   */
  initRedisClient() {
    try {
      this.redisClient = Redis.createClient({
        url: this.options.redisUrl,
        password: this.options.redisPassword,
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            logger.warn('Connexion Redis refusée, tentative de reconnexion...');
            return Math.min(options.attempt * 100, 3000);
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            logger.error('Échec de reconnexion à Redis après 1 heure, passage en mode local uniquement');
            this.redisClient = null;
            return null;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });

      // Promisifier les méthodes Redis
      this.redisGet = promisify(this.redisClient.get).bind(this.redisClient);
      this.redisSet = promisify(this.redisClient.set).bind(this.redisClient);
      this.redisDel = promisify(this.redisClient.del).bind(this.redisClient);
      this.redisExpire = promisify(this.redisClient.expire).bind(this.redisClient);
      this.redisKeys = promisify(this.redisClient.keys).bind(this.redisClient);
      this.redisFlushDb = promisify(this.redisClient.flushdb).bind(this.redisClient);

      // Gérer les événements Redis
      this.redisClient.on('error', (err) => {
        logger.error(`Erreur Redis: ${err.message}`, { error: err });
        this.stats.redisErrors++;
      });

      this.redisClient.on('connect', () => {
        logger.info('Connexion Redis établie');
      });

      this.redisClient.on('reconnecting', () => {
        logger.info('Tentative de reconnexion à Redis...');
      });

      this.redisAvailable = true;
    } catch (error) {
      logger.error(`Impossible d'initialiser Redis: ${error.message}`, { error });
      this.redisClient = null;
      this.redisAvailable = false;
    }
  }

  /**
   * Détermine le TTL approprié en fonction du type de données et de la région
   * @param {string} key - Clé de cache
   * @param {string} region - Région européenne (optionnel)
   * @param {number} ttl - TTL spécifié (optionnel)
   * @returns {number} TTL en secondes
   */
  determineTTL(key, region, ttl) {
    // Si un TTL spécifique est fourni, l'utiliser
    if (ttl !== undefined) {
      return ttl;
    }

    // Déterminer le TTL en fonction du préfixe de la clé
    if (key.startsWith('col:')) {
      return this.options.colDataTTL;
    } else if (key.startsWith('route:')) {
      return this.options.routeDataTTL;
    } else if (key.startsWith('weather:')) {
      return this.options.weatherDataTTL;
    } else if (key.startsWith('geo:')) {
      return this.options.geoDataTTL;
    } else if (key.startsWith('stats:')) {
      return this.options.statsDataTTL;
    }

    // Ajuster le TTL en fonction de la région si spécifiée
    if (region && this.options.regionSpecificTTL[region]) {
      return this.options.regionSpecificTTL[region];
    }

    // TTL par défaut
    return this.options.defaultTTL;
  }

  /**
   * Compresse les données si nécessaire
   * @param {*} data - Données à compresser
   * @returns {Object} Données compressées avec métadonnées
   */
  async compressIfNeeded(data) {
    const serialized = JSON.stringify(data);
    
    // Si la compression est désactivée ou les données sont trop petites
    if (!this.options.enableCompression || serialized.length < this.options.compressionThreshold) {
      return {
        data: serialized,
        compressed: false
      };
    }

    try {
      const zlib = require('zlib');
      const compressed = await new Promise((resolve, reject) => {
        zlib.deflate(serialized, (err, buffer) => {
          if (err) reject(err);
          else resolve(buffer);
        });
      });

      return {
        data: compressed.toString('base64'),
        compressed: true,
        originalSize: serialized.length,
        compressedSize: compressed.length
      };
    } catch (error) {
      logger.warn(`Échec de compression: ${error.message}`, { error });
      return {
        data: serialized,
        compressed: false
      };
    }
  }

  /**
   * Décompresse les données si nécessaire
   * @param {Object} storedData - Données stockées avec métadonnées
   * @returns {*} Données décompressées
   */
  async decompressIfNeeded(storedData) {
    try {
      const parsed = JSON.parse(storedData);
      
      // Si les données ne sont pas compressées
      if (!parsed.compressed) {
        return JSON.parse(parsed.data);
      }

      // Décompresser les données
      const zlib = require('zlib');
      const buffer = Buffer.from(parsed.data, 'base64');
      const decompressed = await new Promise((resolve, reject) => {
        zlib.inflate(buffer, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      return JSON.parse(decompressed.toString());
    } catch (error) {
      logger.warn(`Échec de décompression: ${error.message}`, { error });
      // Tenter de parser directement en cas d'erreur
      try {
        return JSON.parse(storedData);
      } catch {
        return storedData;
      }
    }
  }

  /**
   * Récupère une valeur du cache
   * @param {string} key - Clé de cache
   * @returns {Promise<*>} Valeur mise en cache ou null
   */
  async get(key) {
    try {
      // Tenter d'abord de récupérer depuis Redis
      if (this.redisAvailable) {
        try {
          const redisValue = await this.redisGet(key);
          if (redisValue) {
            this.stats.hits++;
            this.stats.redisHits++;
            return await this.decompressIfNeeded(redisValue);
          }
        } catch (error) {
          logger.warn(`Erreur lors de la récupération Redis: ${error.message}`, { error, key });
          this.stats.redisErrors++;
        }
      }

      // Fallback sur le cache local
      const localValue = this.localCache.get(key);
      if (localValue !== undefined) {
        this.stats.hits++;
        this.stats.localHits++;
        return localValue;
      }

      // Cache miss
      this.stats.misses++;
      return null;
    } catch (error) {
      logger.error(`Erreur lors de la récupération du cache: ${error.message}`, { error, key });
      return null;
    }
  }

  /**
   * Stocke une valeur dans le cache
   * @param {string} key - Clé de cache
   * @param {*} value - Valeur à mettre en cache
   * @param {Object} options - Options de mise en cache
   * @param {number} options.ttl - Durée de vie en secondes
   * @param {string} options.region - Région européenne
   * @param {boolean} options.localOnly - Stocker uniquement dans le cache local
   * @returns {Promise<boolean>} Succès de l'opération
   */
  async set(key, value, options = {}) {
    try {
      const ttl = this.determineTTL(key, options.region, options.ttl);
      
      // Stocker dans le cache local
      this.localCache.set(key, value, ttl);
      
      // Stocker dans Redis si disponible et non localOnly
      if (this.redisAvailable && !options.localOnly) {
        try {
          const compressed = await this.compressIfNeeded(value);
          await this.redisSet(key, JSON.stringify(compressed), 'EX', ttl);
        } catch (error) {
          logger.warn(`Erreur lors du stockage Redis: ${error.message}`, { error, key });
          this.stats.redisErrors++;
        }
      }
      
      this.stats.sets++;
      return true;
    } catch (error) {
      logger.error(`Erreur lors du stockage dans le cache: ${error.message}`, { error, key });
      return false;
    }
  }

  /**
   * Supprime une valeur du cache
   * @param {string} key - Clé de cache
   * @returns {Promise<boolean>} Succès de l'opération
   */
  async del(key) {
    try {
      // Supprimer du cache local
      this.localCache.del(key);
      
      // Supprimer de Redis si disponible
      if (this.redisAvailable) {
        try {
          await this.redisDel(key);
        } catch (error) {
          logger.warn(`Erreur lors de la suppression Redis: ${error.message}`, { error, key });
          this.stats.redisErrors++;
        }
      }
      
      return true;
    } catch (error) {
      logger.error(`Erreur lors de la suppression du cache: ${error.message}`, { error, key });
      return false;
    }
  }

  /**
   * Vide le cache pour un préfixe donné
   * @param {string} prefix - Préfixe de clé
   * @returns {Promise<boolean>} Succès de l'opération
   */
  async flush(prefix = '') {
    try {
      // Vider le cache local
      if (prefix) {
        const keys = this.localCache.keys();
        for (const key of keys) {
          if (key.startsWith(prefix)) {
            this.localCache.del(key);
          }
        }
      } else {
        this.localCache.flushAll();
      }
      
      // Vider Redis si disponible
      if (this.redisAvailable) {
        try {
          if (prefix) {
            const keys = await this.redisKeys(`${prefix}*`);
            if (keys.length > 0) {
              await this.redisDel(...keys);
            }
          } else {
            await this.redisFlushDb();
          }
        } catch (error) {
          logger.warn(`Erreur lors du vidage Redis: ${error.message}`, { error, prefix });
          this.stats.redisErrors++;
        }
      }
      
      return true;
    } catch (error) {
      logger.error(`Erreur lors du vidage du cache: ${error.message}`, { error, prefix });
      return false;
    }
  }

  /**
   * Précharge les données des cols pour une région spécifique
   * @param {string} region - Région européenne
   * @param {Array} colIds - IDs des cols à précharger
   * @returns {Promise<boolean>} Succès de l'opération
   */
  async preloadColData(region, colIds) {
    try {
      logger.info(`Préchargement des données pour ${colIds.length} cols de la région ${region}`);
      
      // Importer les services nécessaires
      const ColService = require('../services/col.service');
      const colService = new ColService();
      
      // Précharger les données pour chaque col
      for (const colId of colIds) {
        const cacheKey = `col:${colId}`;
        const cachedData = await this.get(cacheKey);
        
        // Si les données ne sont pas en cache, les récupérer et les mettre en cache
        if (!cachedData) {
          try {
            const colData = await colService.getColById(colId);
            if (colData) {
              await this.set(cacheKey, colData, { region });
              logger.debug(`Col ${colId} préchargé avec succès`);
            }
          } catch (error) {
            logger.warn(`Erreur lors du préchargement du col ${colId}: ${error.message}`);
          }
        }
      }
      
      return true;
    } catch (error) {
      logger.error(`Erreur lors du préchargement des cols: ${error.message}`, { error, region });
      return false;
    }
  }

  /**
   * Précharge les données géographiques pour une région spécifique
   * @param {string} region - Région européenne
   * @returns {Promise<boolean>} Succès de l'opération
   */
  async preloadGeoData(region) {
    try {
      logger.info(`Préchargement des données géographiques pour la région ${region}`);
      
      // Importer les services nécessaires
      const GeoService = require('../services/geo.service');
      const geoService = new GeoService();
      
      // Précharger les données géographiques de base
      const cacheKey = `geo:region:${region}`;
      const cachedData = await this.get(cacheKey);
      
      // Si les données ne sont pas en cache, les récupérer et les mettre en cache
      if (!cachedData) {
        try {
          const geoData = await geoService.getRegionData(region);
          if (geoData) {
            await this.set(cacheKey, geoData, { 
              region,
              ttl: this.options.geoDataTTL
            });
            logger.debug(`Données géographiques pour ${region} préchargées avec succès`);
          }
        } catch (error) {
          logger.warn(`Erreur lors du préchargement des données géographiques pour ${region}: ${error.message}`);
        }
      }
      
      return true;
    } catch (error) {
      logger.error(`Erreur lors du préchargement des données géographiques: ${error.message}`, { error, region });
      return false;
    }
  }

  /**
   * Initialise le nettoyage périodique du cache
   */
  initPeriodicCleanup() {
    // Nettoyage toutes les 6 heures
    setInterval(() => {
      this.cleanup();
    }, 6 * 60 * 60 * 1000);
  }

  /**
   * Nettoie le cache et réinitialise les statistiques
   */
  async cleanup() {
    try {
      logger.info('Nettoyage périodique du cache');
      
      // Réinitialiser les statistiques
      const oldStats = { ...this.stats };
      this.stats = {
        hits: 0,
        misses: 0,
        redisHits: 0,
        redisErrors: 0,
        localHits: 0,
        sets: 0,
        evictions: 0,
        lastReset: Date.now()
      };
      
      // Calculer le taux de hit
      const totalRequests = oldStats.hits + oldStats.misses;
      const hitRate = totalRequests > 0 ? oldStats.hits / totalRequests : 0;
      
      logger.info(`Statistiques du cache: ${oldStats.hits} hits, ${oldStats.misses} misses, taux de hit ${(hitRate * 100).toFixed(2)}%`);
      
      // Nettoyer le cache local (NodeCache gère automatiquement l'expiration)
      const keysCount = this.localCache.keys().length;
      logger.info(`Cache local: ${keysCount} clés`);
      
      return true;
    } catch (error) {
      logger.error(`Erreur lors du nettoyage du cache: ${error.message}`, { error });
      return false;
    }
  }

  /**
   * Récupère les statistiques du cache
   * @returns {Object} Statistiques du cache
   */
  getStats() {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;
    const redisHitRate = this.stats.hits > 0 ? this.stats.redisHits / this.stats.hits : 0;
    const localHitRate = this.stats.hits > 0 ? this.stats.localHits / this.stats.hits : 0;
    
    return {
      ...this.stats,
      totalRequests,
      hitRate,
      redisHitRate,
      localHitRate,
      keysCount: this.localCache.keys().length,
      redisAvailable: this.redisAvailable,
      uptime: Date.now() - this.stats.lastReset
    };
  }
}

// Singleton
let instance = null;

/**
 * Récupère l'instance du cache distribué
 * @param {Object} options - Options de configuration
 * @returns {DistributedCache} Instance du cache distribué
 */
function getInstance(options = {}) {
  if (!instance) {
    instance = new DistributedCache(options);
  }
  return instance;
}

module.exports = {
  DistributedCache,
  getInstance
};
