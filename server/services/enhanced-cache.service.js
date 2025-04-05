/**
 * Service de cache amélioré avec stratégie d'éviction LRU agressive
 * 
 * Ce service implémente un système de cache avec une stratégie d'éviction LRU avancée,
 * incluant time-to-idle, éviction proactive et limites par type de cache.
 * 
 * @module services/enhanced-cache
 */

const Redis = require('ioredis');
const logger = require('../utils/logger');
const config = require('../config');
const crypto = require('crypto');
const zlib = require('zlib');
const { promisify } = require('util');

// Promisify zlib functions
const gzipAsync = promisify(zlib.gzip);
const gunzipAsync = promisify(zlib.gunzip);

/**
 * Classe gérant le cache avec stratégie d'éviction avancée
 */
class EnhancedCache {
  /**
   * Crée une nouvelle instance du gestionnaire de cache
   * @param {Object} options - Options de configuration
   * @param {string} options.namespace - Espace de noms pour ce cache (défaut: 'app')
   * @param {Object} options.redisOptions - Options de connexion Redis
   * @param {number} options.defaultTTL - TTL par défaut en secondes (défaut: 1h)
   * @param {number} options.idleTimeout - Timeout d'inactivité en secondes (défaut: 30min)
   * @param {number} options.compressionThreshold - Seuil de taille pour la compression en bytes (défaut: 10KB)
   * @param {Object} options.limits - Limites par type de cache
   * @param {number} options.cleanupInterval - Intervalle de nettoyage en secondes (défaut: 5min)
   */
  constructor(options = {}) {
    this.options = {
      namespace: options.namespace || 'app',
      redisOptions: options.redisOptions || {
        host: config.redis.host || 'localhost',
        port: config.redis.port || 6379,
        password: config.redis.password,
        db: config.redis.db || 0,
        keyPrefix: `cache:${options.namespace || 'app'}:`,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        }
      },
      defaultTTL: options.defaultTTL || 3600, // 1 heure par défaut
      idleTimeout: options.idleTimeout || 1800, // 30 minutes par défaut
      compressionThreshold: options.compressionThreshold || 10240, // 10KB
      limits: options.limits || {
        default: { maxSize: '100mb', maxItems: 10000 }
      },
      cleanupInterval: options.cleanupInterval || 300, // 5 minutes
      evictionLevels: options.evictionLevels || {
        normal: { threshold: 0.7, action: 'standard' },
        attention: { threshold: 0.8, action: 'accelerated' },
        alert: { threshold: 0.9, action: 'aggressive' },
        critical: { threshold: 0.95, action: 'emergency' }
      }
    };

    // Connexion Redis principale
    this.redis = new Redis(this.options.redisOptions);
    
    // Connexion Redis pour les opérations de maintenance
    this.maintenanceRedis = new Redis(this.options.redisOptions);

    // Convertir les limites de taille en bytes
    this._normalizeLimits();

    // Statistiques
    this.stats = {
      sets: 0,
      gets: 0,
      hits: 0,
      misses: 0,
      evictions: { normal: 0, accelerated: 0, aggressive: 0, emergency: 0 },
      compressions: 0,
      errors: 0,
      byType: {}
    };

    // Initialiser les statistiques par type
    Object.keys(this.options.limits).forEach(type => {
      this.stats.byType[type] = { sets: 0, gets: 0, hits: 0, misses: 0, evictions: 0 };
    });

    // Démarrer le nettoyage périodique
    if (this.options.cleanupInterval > 0) {
      this._startPeriodicCleanup();
    }

    // Écouter les événements de connexion
    this._setupEventListeners();

    logger.info(`EnhancedCache '${this.options.namespace}' initialisé avec TTL=${this.options.defaultTTL}s, IdleTimeout=${this.options.idleTimeout}s`);
  }

  /**
   * Normalise les limites de taille en bytes
   * @private
   */
  _normalizeLimits() {
    const sizeToBytes = (size) => {
      if (typeof size === 'number') return size;
      if (typeof size !== 'string') return 0;
      
      const units = {
        b: 1,
        kb: 1024,
        mb: 1024 * 1024,
        gb: 1024 * 1024 * 1024
      };
      
      const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*([kmg]?b)$/);
      if (!match) return 0;
      
      const value = parseFloat(match[1]);
      const unit = match[2];
      
      return value * (units[unit] || 1);
    };

    // Normaliser les limites
    Object.keys(this.options.limits).forEach(type => {
      const limit = this.options.limits[type];
      if (limit.maxSize) {
        limit.maxSizeBytes = sizeToBytes(limit.maxSize);
      }
    });
  }

  /**
   * Configure les écouteurs d'événements pour la connexion Redis
   * @private
   */
  _setupEventListeners() {
    this.redis.on('connect', () => {
      logger.info(`EnhancedCache '${this.options.namespace}' connecté au serveur Redis`);
    });

    this.redis.on('error', (err) => {
      logger.error(`Erreur de connexion Redis pour le cache '${this.options.namespace}': ${err.message}`, err);
      this.stats.errors++;
    });

    this.redis.on('reconnecting', (delay) => {
      logger.warn(`Tentative de reconnexion à Redis pour le cache '${this.options.namespace}' dans ${delay}ms`);
    });
  }

  /**
   * Démarre le processus de nettoyage périodique
   * @private
   */
  _startPeriodicCleanup() {
    this.cleanupInterval = setInterval(() => {
      this._runCleanup()
        .catch(err => {
          logger.error(`Erreur lors du nettoyage du cache '${this.options.namespace}': ${err.message}`, err);
          this.stats.errors++;
        });
    }, this.options.cleanupInterval * 1000);

    // S'assurer que l'intervalle ne bloque pas la fin du processus
    this.cleanupInterval.unref();
    
    logger.debug(`Nettoyage périodique configuré pour le cache '${this.options.namespace}' (intervalle: ${this.options.cleanupInterval}s)`);
  }

  /**
   * Exécute le processus de nettoyage
   * @private
   * @returns {Promise<Object>} Statistiques de nettoyage
   */
  async _runCleanup() {
    // Vérifier l'utilisation mémoire de Redis
    const memoryInfo = await this._getMemoryUsage();
    const memoryUsedPercentage = memoryInfo.used_memory / memoryInfo.total_system_memory;
    
    // Déterminer le niveau d'éviction
    let evictionLevel = 'normal';
    for (const [level, config] of Object.entries(this.options.evictionLevels)) {
      if (memoryUsedPercentage >= config.threshold) {
        evictionLevel = level;
      } else {
        break;
      }
    }
    
    logger.debug(`Nettoyage du cache '${this.options.namespace}' - Niveau: ${evictionLevel}, Mémoire: ${(memoryUsedPercentage * 100).toFixed(2)}%`);
    
    // Nettoyer les éléments expirés par TTL
    const expiredStats = await this._cleanupExpiredItems();
    
    // Nettoyer les éléments inactifs
    const idleStats = await this._cleanupIdleItems();
    
    // Si le niveau d'éviction est plus élevé que 'normal', effectuer une éviction proactive
    let proactiveStats = { count: 0 };
    if (evictionLevel !== 'normal') {
      proactiveStats = await this._runProactiveEviction(evictionLevel);
    }
    
    // Mettre à jour les statistiques
    this.stats.evictions[evictionLevel]++;
    
    return {
      level: evictionLevel,
      memoryUsage: memoryUsedPercentage,
      expired: expiredStats.count,
      idle: idleStats.count,
      proactive: proactiveStats.count,
      total: expiredStats.count + idleStats.count + proactiveStats.count
    };
  }

  /**
   * Récupère les informations d'utilisation mémoire de Redis
   * @private
   * @returns {Promise<Object>} Informations mémoire
   */
  async _getMemoryUsage() {
    try {
      const info = await this.maintenanceRedis.info('memory');
      const lines = info.split('\r\n');
      
      const result = {};
      lines.forEach(line => {
        const match = line.match(/^(used_memory|used_memory_peak|total_system_memory):(\d+)$/);
        if (match) {
          result[match[1]] = parseInt(match[2], 10);
        }
      });
      
      return result;
    } catch (err) {
      logger.error(`Erreur lors de la récupération des informations mémoire: ${err.message}`, err);
      return { used_memory: 0, used_memory_peak: 0, total_system_memory: 1 };
    }
  }

  /**
   * Nettoie les éléments expirés par TTL
   * @private
   * @returns {Promise<Object>} Statistiques de nettoyage
   */
  async _cleanupExpiredItems() {
    // Redis gère automatiquement l'expiration par TTL
    // Cette méthode est principalement pour la compatibilité et les statistiques
    return { count: 0 };
  }

  /**
   * Nettoie les éléments inactifs depuis trop longtemps
   * @private
   * @returns {Promise<Object>} Statistiques de nettoyage
   */
  async _cleanupIdleItems() {
    const now = Date.now();
    let cursor = '0';
    let cleanedCount = 0;
    const idleThreshold = now - (this.options.idleTimeout * 1000);
    
    do {
      // Utiliser SCAN pour itérer sur les clés sans bloquer Redis
      const [nextCursor, keys] = await this.maintenanceRedis.scan(
        cursor, 
        'MATCH', 
        `${this.options.redisOptions.keyPrefix}*:meta`, 
        'COUNT', 
        100
      );
      
      cursor = nextCursor;
      
      if (keys.length === 0) continue;
      
      // Pour chaque clé méta, vérifier lastAccess
      for (const metaKey of keys) {
        try {
          const metaData = await this.maintenanceRedis.get(metaKey);
          if (!metaData) continue;
          
          const meta = JSON.parse(metaData);
          
          // Vérifier si l'élément est inactif depuis trop longtemps
          if (meta.lastAccess && meta.lastAccess < idleThreshold) {
            // Extraire la clé de base (sans le suffixe :meta)
            const baseKey = metaKey.substring(0, metaKey.length - 5);
            const dataKey = `${baseKey}:data`;
            
            // Supprimer les clés de données et méta
            await this.maintenanceRedis.del(dataKey, metaKey);
            
            cleanedCount++;
            
            // Mettre à jour les statistiques par type
            if (meta.type && this.stats.byType[meta.type]) {
              this.stats.byType[meta.type].evictions++;
            }
          }
        } catch (err) {
          logger.error(`Erreur lors du traitement de la clé ${metaKey}: ${err.message}`, err);
          this.stats.errors++;
        }
      }
      
    } while (cursor !== '0');
    
    if (cleanedCount > 0) {
      logger.info(`Cache '${this.options.namespace}': ${cleanedCount} éléments inactifs supprimés`);
    }
    
    return { count: cleanedCount };
  }

  /**
   * Exécute une éviction proactive basée sur le niveau d'éviction
   * @param {string} level - Niveau d'éviction ('attention', 'alert', 'critical')
   * @private
   * @returns {Promise<Object>} Statistiques d'éviction
   */
  async _runProactiveEviction(level) {
    const action = this.options.evictionLevels[level]?.action || 'standard';
    let evictedCount = 0;
    
    // Définir les paramètres d'éviction selon le niveau
    const evictionParams = {
      standard: {
        scanCount: 100,
        targetPercentage: 0.1, // Éviction de 10% des éléments
        priorityTypes: [] // Pas de types prioritaires
      },
      accelerated: {
        scanCount: 200,
        targetPercentage: 0.2, // Éviction de 20% des éléments
        priorityTypes: ['optional'] // Éviction prioritaire des données optionnelles
      },
      aggressive: {
        scanCount: 300,
        targetPercentage: 0.3, // Éviction de 30% des éléments
        priorityTypes: ['optional', 'standard'] // Éviction des données optionnelles et standard
      },
      emergency: {
        scanCount: 500,
        targetPercentage: 0.5, // Éviction de 50% des éléments
        priorityTypes: ['optional', 'standard', 'important'] // Éviction de tout sauf critique
      }
    };
    
    const params = evictionParams[action] || evictionParams.standard;
    
    // Récupérer le nombre total d'éléments dans le cache
    const totalItems = await this._countCacheItems();
    const targetEvictionCount = Math.ceil(totalItems * params.targetPercentage);
    
    if (targetEvictionCount <= 0) {
      return { count: 0 };
    }
    
    logger.info(`Cache '${this.options.namespace}': Éviction proactive niveau '${level}' (${action}), cible: ${targetEvictionCount} éléments`);
    
    // D'abord, éviction des types prioritaires
    if (params.priorityTypes.length > 0) {
      for (const type of params.priorityTypes) {
        const typeEvicted = await this._evictByType(type, targetEvictionCount - evictedCount);
        evictedCount += typeEvicted;
        
        if (evictedCount >= targetEvictionCount) {
          break;
        }
      }
    }
    
    // Si on n'a pas atteint la cible, éviction LRU générale
    if (evictedCount < targetEvictionCount) {
      const lruEvicted = await this._evictLRU(targetEvictionCount - evictedCount);
      evictedCount += lruEvicted;
    }
    
    return { count: evictedCount };
  }

  /**
   * Compte le nombre total d'éléments dans le cache
   * @private
   * @returns {Promise<number>} Nombre d'éléments
   */
  async _countCacheItems() {
    try {
      let cursor = '0';
      let count = 0;
      
      do {
        const [nextCursor, keys] = await this.maintenanceRedis.scan(
          cursor, 
          'MATCH', 
          `${this.options.redisOptions.keyPrefix}*:meta`, 
          'COUNT', 
          1000
        );
        
        cursor = nextCursor;
        count += keys.length;
        
      } while (cursor !== '0');
      
      return count;
    } catch (err) {
      logger.error(`Erreur lors du comptage des éléments du cache: ${err.message}`, err);
      return 0;
    }
  }

  /**
   * Éviction des éléments d'un type spécifique
   * @param {string} type - Type de cache
   * @param {number} limit - Nombre maximum d'éléments à évincer
   * @private
   * @returns {Promise<number>} Nombre d'éléments évincés
   */
  async _evictByType(type, limit) {
    if (limit <= 0) return 0;
    
    let cursor = '0';
    let evictedCount = 0;
    const metaKeys = [];
    
    // Collecter les clés méta du type spécifié
    do {
      const [nextCursor, keys] = await this.maintenanceRedis.scan(
        cursor, 
        'MATCH', 
        `${this.options.redisOptions.keyPrefix}*:meta`, 
        'COUNT', 
        100
      );
      
      cursor = nextCursor;
      
      if (keys.length === 0) continue;
      
      // Filtrer les clés par type
      for (const metaKey of keys) {
        if (evictedCount >= limit) break;
        
        try {
          const metaData = await this.maintenanceRedis.get(metaKey);
          if (!metaData) continue;
          
          const meta = JSON.parse(metaData);
          
          if (meta.type === type) {
            metaKeys.push({
              key: metaKey,
              lastAccess: meta.lastAccess || 0
            });
          }
        } catch (err) {
          logger.error(`Erreur lors du filtrage par type: ${err.message}`, err);
        }
      }
      
    } while (cursor !== '0' && metaKeys.length < limit);
    
    // Trier par lastAccess (LRU)
    metaKeys.sort((a, b) => a.lastAccess - b.lastAccess);
    
    // Évincer jusqu'à la limite
    for (const { key } of metaKeys.slice(0, limit)) {
      try {
        // Extraire la clé de base (sans le suffixe :meta)
        const baseKey = key.substring(0, key.length - 5);
        const dataKey = `${baseKey}:data`;
        
        // Supprimer les clés de données et méta
        await this.maintenanceRedis.del(dataKey, key);
        
        evictedCount++;
        
        // Mettre à jour les statistiques
        if (this.stats.byType[type]) {
          this.stats.byType[type].evictions++;
        }
      } catch (err) {
        logger.error(`Erreur lors de l'éviction: ${err.message}`, err);
      }
    }
    
    return evictedCount;
  }

  /**
   * Éviction LRU générale
   * @param {number} limit - Nombre maximum d'éléments à évincer
   * @private
   * @returns {Promise<number>} Nombre d'éléments évincés
   */
  async _evictLRU(limit) {
    if (limit <= 0) return 0;
    
    let cursor = '0';
    let evictedCount = 0;
    const metaKeys = [];
    
    // Collecter toutes les clés méta
    do {
      const [nextCursor, keys] = await this.maintenanceRedis.scan(
        cursor, 
        'MATCH', 
        `${this.options.redisOptions.keyPrefix}*:meta`, 
        'COUNT', 
        100
      );
      
      cursor = nextCursor;
      
      if (keys.length === 0) continue;
      
      // Récupérer les métadonnées pour le tri LRU
      for (const metaKey of keys) {
        try {
          const metaData = await this.maintenanceRedis.get(metaKey);
          if (!metaData) continue;
          
          const meta = JSON.parse(metaData);
          
          // Ignorer les éléments critiques en éviction LRU
          if (meta.importance !== 'critical') {
            metaKeys.push({
              key: metaKey,
              lastAccess: meta.lastAccess || 0,
              type: meta.type
            });
          }
        } catch (err) {
          logger.error(`Erreur lors de la collecte pour LRU: ${err.message}`, err);
        }
      }
      
    } while (cursor !== '0' && metaKeys.length < limit * 2); // Collecter plus que nécessaire pour un meilleur tri
    
    // Trier par lastAccess (LRU)
    metaKeys.sort((a, b) => a.lastAccess - b.lastAccess);
    
    // Évincer jusqu'à la limite
    for (const { key, type } of metaKeys.slice(0, limit)) {
      try {
        // Extraire la clé de base (sans le suffixe :meta)
        const baseKey = key.substring(0, key.length - 5);
        const dataKey = `${baseKey}:data`;
        
        // Supprimer les clés de données et méta
        await this.maintenanceRedis.del(dataKey, key);
        
        evictedCount++;
        
        // Mettre à jour les statistiques
        if (type && this.stats.byType[type]) {
          this.stats.byType[type].evictions++;
        }
      } catch (err) {
        logger.error(`Erreur lors de l'éviction LRU: ${err.message}`, err);
      }
    }
    
    return evictedCount;
  }

  /**
   * Génère une clé de cache
   * @param {string} key - Clé de base
   * @param {string} type - Type de cache
   * @returns {Object} Clés générées
   * @private
   */
  _generateCacheKeys(key, type) {
    // Normaliser la clé
    const normalizedKey = typeof key === 'string' ? key : JSON.stringify(key);
    
    // Générer un hash pour éviter les caractères problématiques
    const keyHash = crypto.createHash('md5').update(normalizedKey).digest('hex');
    
    // Préfixer avec le type
    const prefix = type ? `${type}:` : '';
    const baseKey = `${prefix}${keyHash}`;
    
    return {
      dataKey: `${baseKey}:data`,
      metaKey: `${baseKey}:meta`
    };
  }

  /**
   * Compresse des données si nécessaire
   * @param {*} data - Données à compresser
   * @returns {Promise<Object>} Données compressées et métadonnées
   * @private
   */
  async _compressIfNeeded(data) {
    const serialized = JSON.stringify(data);
    const size = Buffer.byteLength(serialized, 'utf8');
    
    // Si la taille dépasse le seuil, compresser
    if (size > this.options.compressionThreshold) {
      try {
        const compressed = await gzipAsync(Buffer.from(serialized));
        this.stats.compressions++;
        
        return {
          data: compressed,
          compressed: true,
          originalSize: size,
          compressedSize: compressed.length
        };
      } catch (err) {
        logger.error(`Erreur lors de la compression: ${err.message}`, err);
        return { data: serialized, compressed: false, size };
      }
    }
    
    return { data: serialized, compressed: false, size };
  }

  /**
   * Décompresse des données si nécessaire
   * @param {*} data - Données à décompresser
   * @param {boolean} compressed - Si les données sont compressées
   * @returns {Promise<*>} Données décompressées
   * @private
   */
  async _decompressIfNeeded(data, compressed) {
    if (!compressed) {
      return JSON.parse(data);
    }
    
    try {
      const decompressed = await gunzipAsync(Buffer.from(data));
      return JSON.parse(decompressed.toString());
    } catch (err) {
      logger.error(`Erreur lors de la décompression: ${err.message}`, err);
      throw new Error('Erreur de décompression des données du cache');
    }
  }

  /**
   * Stocke une valeur dans le cache
   * @param {string} key - Clé du cache
   * @param {*} value - Valeur à stocker
   * @param {Object} options - Options de stockage
   * @param {string} options.type - Type de cache (défaut: 'default')
   * @param {number} options.ttl - TTL en secondes (défaut: options.defaultTTL)
   * @param {string} options.importance - Importance ('optional', 'standard', 'important', 'critical')
   * @returns {Promise<boolean>} true si stocké avec succès
   */
  async set(key, value, options = {}) {
    const type = options.type || 'default';
    const ttl = options.ttl || this.options.defaultTTL;
    const importance = options.importance || 'standard';
    
    try {
      // Vérifier si le type est valide
      if (!this.options.limits[type] && type !== 'default') {
        logger.warn(`Type de cache inconnu: ${type}, utilisation du type 'default'`);
      }
      
      // Générer les clés
      const { dataKey, metaKey } = this._generateCacheKeys(key, type);
      
      // Compresser si nécessaire
      const { data, compressed, size, originalSize, compressedSize } = await this._compressIfNeeded(value);
      
      // Métadonnées
      const meta = {
        key,
        type,
        importance,
        compressed,
        size: compressed ? compressedSize : size,
        originalSize: compressed ? originalSize : size,
        createdAt: Date.now(),
        lastAccess: Date.now()
      };
      
      // Stocker les données et les métadonnées
      const pipeline = this.redis.pipeline();
      pipeline.set(dataKey, data, 'EX', ttl);
      pipeline.set(metaKey, JSON.stringify(meta), 'EX', ttl);
      
      await pipeline.exec();
      
      // Mettre à jour les statistiques
      this.stats.sets++;
      if (this.stats.byType[type]) {
        this.stats.byType[type].sets++;
      }
      
      return true;
    } catch (err) {
      logger.error(`Erreur lors du stockage dans le cache (${key}): ${err.message}`, err);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Récupère une valeur du cache
   * @param {string} key - Clé du cache
   * @param {Object} options - Options de récupération
   * @param {string} options.type - Type de cache (défaut: 'default')
   * @param {boolean} options.updateAccess - Mettre à jour lastAccess (défaut: true)
   * @returns {Promise<*>} Valeur du cache ou null si non trouvée
   */
  async get(key, options = {}) {
    const type = options.type || 'default';
    const updateAccess = options.updateAccess !== false;
    
    try {
      // Générer les clés
      const { dataKey, metaKey } = this._generateCacheKeys(key, type);
      
      // Récupérer les données et les métadonnées
      const [dataResult, metaResult] = await this.redis.mget(dataKey, metaKey);
      
      // Mettre à jour les statistiques
      this.stats.gets++;
      if (this.stats.byType[type]) {
        this.stats.byType[type].gets++;
      }
      
      // Si les données ou les métadonnées sont manquantes
      if (!dataResult || !metaResult) {
        this.stats.misses++;
        if (this.stats.byType[type]) {
          this.stats.byType[type].misses++;
        }
        return null;
      }
      
      // Mettre à jour lastAccess si demandé
      if (updateAccess) {
        const meta = JSON.parse(metaResult);
        meta.lastAccess = Date.now();
        
        // Utiliser un pipeline pour éviter de bloquer
        this.redis.set(metaKey, JSON.stringify(meta), 'KEEPTTL').catch(err => {
          logger.error(`Erreur lors de la mise à jour de lastAccess: ${err.message}`, err);
        });
      }
      
      // Décompresser si nécessaire
      const meta = JSON.parse(metaResult);
      const value = await this._decompressIfNeeded(dataResult, meta.compressed);
      
      // Mettre à jour les statistiques
      this.stats.hits++;
      if (this.stats.byType[type]) {
        this.stats.byType[type].hits++;
      }
      
      return value;
    } catch (err) {
      logger.error(`Erreur lors de la récupération du cache (${key}): ${err.message}`, err);
      this.stats.errors++;
      return null;
    }
  }

  /**
   * Supprime une valeur du cache
   * @param {string} key - Clé du cache
   * @param {Object} options - Options de suppression
   * @param {string} options.type - Type de cache (défaut: 'default')
   * @returns {Promise<boolean>} true si supprimé avec succès
   */
  async delete(key, options = {}) {
    const type = options.type || 'default';
    
    try {
      // Générer les clés
      const { dataKey, metaKey } = this._generateCacheKeys(key, type);
      
      // Supprimer les données et les métadonnées
      const result = await this.redis.del(dataKey, metaKey);
      
      return result > 0;
    } catch (err) {
      logger.error(`Erreur lors de la suppression du cache (${key}): ${err.message}`, err);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Vérifie si une clé existe dans le cache
   * @param {string} key - Clé du cache
   * @param {Object} options - Options de vérification
   * @param {string} options.type - Type de cache (défaut: 'default')
   * @returns {Promise<boolean>} true si la clé existe
   */
  async has(key, options = {}) {
    const type = options.type || 'default';
    
    try {
      // Générer les clés
      const { dataKey } = this._generateCacheKeys(key, type);
      
      // Vérifier si la clé existe
      const exists = await this.redis.exists(dataKey);
      
      return exists === 1;
    } catch (err) {
      logger.error(`Erreur lors de la vérification du cache (${key}): ${err.message}`, err);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Met à jour le TTL d'une clé
   * @param {string} key - Clé du cache
   * @param {number} ttl - Nouveau TTL en secondes
   * @param {Object} options - Options de mise à jour
   * @param {string} options.type - Type de cache (défaut: 'default')
   * @returns {Promise<boolean>} true si mis à jour avec succès
   */
  async touch(key, ttl, options = {}) {
    const type = options.type || 'default';
    
    try {
      // Générer les clés
      const { dataKey, metaKey } = this._generateCacheKeys(key, type);
      
      // Mettre à jour le TTL
      const pipeline = this.redis.pipeline();
      pipeline.expire(dataKey, ttl);
      pipeline.expire(metaKey, ttl);
      
      const results = await pipeline.exec();
      
      // Vérifier si au moins une des clés a été mise à jour
      return results.some(([err, result]) => !err && result === 1);
    } catch (err) {
      logger.error(`Erreur lors de la mise à jour du TTL (${key}): ${err.message}`, err);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Vide le cache pour un type spécifique ou tout le cache
   * @param {Object} options - Options de nettoyage
   * @param {string} options.type - Type de cache à vider (défaut: tous)
   * @returns {Promise<number>} Nombre d'éléments supprimés
   */
  async clear(options = {}) {
    const type = options.type;
    
    try {
      let pattern;
      if (type) {
        // Vider un type spécifique
        pattern = `${this.options.redisOptions.keyPrefix}${type}:*`;
      } else {
        // Vider tout le cache
        pattern = `${this.options.redisOptions.keyPrefix}*`;
      }
      
      let cursor = '0';
      let deletedCount = 0;
      
      do {
        const [nextCursor, keys] = await this.redis.scan(
          cursor, 
          'MATCH', 
          pattern, 
          'COUNT', 
          100
        );
        
        cursor = nextCursor;
        
        if (keys.length > 0) {
          const result = await this.redis.del(...keys);
          deletedCount += result;
        }
        
      } while (cursor !== '0');
      
      return deletedCount;
    } catch (err) {
      logger.error(`Erreur lors du vidage du cache: ${err.message}`, err);
      this.stats.errors++;
      return 0;
    }
  }

  /**
   * Récupère les statistiques du cache
   * @returns {Object} Statistiques
   */
  getStats() {
    // Calculer le taux de hit
    const hitRatio = (this.stats.hits / (this.stats.hits + this.stats.misses || 1)).toFixed(2);
    
    // Statistiques par type
    const typeStats = {};
    Object.entries(this.stats.byType).forEach(([type, stats]) => {
      typeStats[type] = {
        ...stats,
        hitRatio: (stats.hits / (stats.hits + stats.misses || 1)).toFixed(2)
      };
    });
    
    return {
      global: {
        sets: this.stats.sets,
        gets: this.stats.gets,
        hits: this.stats.hits,
        misses: this.stats.misses,
        hitRatio,
        compressions: this.stats.compressions,
        evictions: this.stats.evictions,
        errors: this.stats.errors
      },
      byType: typeStats
    };
  }

  /**
   * Vérifie la santé du cache
   * @returns {Promise<Object>} État de santé
   */
  async healthCheck() {
    try {
      // Vérifier la connexion Redis
      const isRedisConnected = this.redis.status === 'ready';
      
      // Vérifier l'utilisation mémoire
      const memoryInfo = await this._getMemoryUsage();
      const memoryUsedPercentage = memoryInfo.used_memory / memoryInfo.total_system_memory;
      
      // Déterminer le niveau d'alerte mémoire
      let memoryStatus = 'normal';
      for (const [level, config] of Object.entries(this.options.evictionLevels)) {
        if (memoryUsedPercentage >= config.threshold) {
          memoryStatus = level;
        } else {
          break;
        }
      }
      
      return {
        healthy: isRedisConnected && memoryStatus !== 'critical',
        redis: isRedisConnected ? 'ready' : 'error',
        memory: {
          status: memoryStatus,
          usedPercentage: (memoryUsedPercentage * 100).toFixed(2) + '%',
          used: memoryInfo.used_memory,
          peak: memoryInfo.used_memory_peak,
          total: memoryInfo.total_system_memory
        },
        stats: {
          hitRatio: (this.stats.hits / (this.stats.hits + this.stats.misses || 1)).toFixed(2),
          errors: this.stats.errors
        },
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      logger.error(`Erreur lors du health check: ${err.message}`, err);
      return {
        healthy: false,
        error: err.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Ferme les connexions et nettoie les ressources
   */
  async close() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    await this.redis.quit();
    await this.maintenanceRedis.quit();
    
    logger.info(`EnhancedCache '${this.options.namespace}' fermé`);
  }
}

module.exports = EnhancedCache;
