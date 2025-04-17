console.log('Loading cache.service.js...');

/**
 * Service de cache distribué
 * Gère le stockage et la récupération des données fréquemment consultées pour optimiser les performances
 * Version améliorée avec stratégies de mise en cache avancées et optimisations de performance
 */

const logger = require('../config/logger');
const crypto = require('crypto');
const redisCache = require('./cache/redis-cache-service');

class CacheService {
  constructor() {
    // Cache en mémoire simplifié (legacy)
    this.memoryCache = new Map();
    this.cacheTTL = new Map();
    
    // Cache secondaire pour les données fréquemment accédées (legacy)
    this.hotCache = new Map();
    this.hotCacheMaxSize = 100; // Nombre maximum d'éléments dans le hot cache (legacy)
    this.hotCacheThreshold = 5; // Nombre d'accès pour considérer une clé comme "hot" (legacy)
    this.accessCount = new Map(); // Compteur d'accès pour chaque clé (legacy)
    
    // Métriques de performance du cache
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      errors: 0,
      redis: redisCache.getMetrics(),
      hotHits: 0,
      evictions: 0
    };
    
    // Configuration
    this.config = {
      defaultTTL: 300, // 5 minutes par défaut
      cleanupInterval: 60, // Nettoyage toutes les 60 secondes
      compressionThreshold: 1024, // Compression pour les valeurs > 1KB
      maxKeySize: 250, // Taille maximale des clés en caractères
      maxValueSize: 5 * 1024 * 1024 // 5MB max par valeur
    };
    
    // Nettoyage périodique des clés expirées (legacy)
    this.cleanupInterval = setInterval(() => this._cleanup(), this.config.cleanupInterval * 1000);
    
    // Initialisation des namespaces
    this.namespaces = new Set(['default', 'user', 'route', 'api', 'geo', 'stats']);
    
    logger.info('[CacheService] Service de cache avancé initialisé');
  }

  /**
   * Récupère une valeur du cache
   * @param {string} key - Clé de cache
   * @param {Object} options - Options supplémentaires
   * @returns {Promise<any>} Valeur mise en cache
   */
  async get(key, options = {}) {
    try {
      // Utiliser Redis comme backend principal
      return redisCache.get(key, options.type || 'default');
    } catch (error) {
      this.metrics.errors++;
      logger.error(`[CacheService] Erreur lors de la récupération de ${key}: ${error.message}`);
      return null;
    }
  }

  /**
   * Stocke une valeur dans le cache
   * @param {string} key - Clé de cache
   * @param {any} value - Valeur à mettre en cache
   * @param {number} ttl - Durée de vie en secondes (0 = pas d'expiration)
   * @param {Object} options - Options supplémentaires
   * @returns {Promise<boolean>} Succès de l'opération
   */
  async set(key, value, ttl = null, options = {}) {
    try {
      return redisCache.set(key, value, ttl, options.type || 'default');
    } catch (error) {
      this.metrics.errors++;
      logger.error(`[CacheService] Erreur lors du stockage de ${key}: ${error.message}`);
      return false;
    }
  }

  /**
   * Supprime une valeur du cache
   * @param {string} key - Clé de cache à supprimer
   * @returns {Promise<boolean>} Succès de l'opération
   */
  async del(key) {
    try {
      return redisCache.del(key);
    } catch (error) {
      this.metrics.errors++;
      logger.error(`[CacheService] Erreur lors de la suppression de ${key}: ${error.message}`);
      return false;
    }
  }

  /**
   * Supprime toutes les clés correspondant à un motif
   * @param {string} pattern - Motif de clés à supprimer (ex: "user:*")
   * @returns {Promise<number>} Nombre de clés supprimées
   */
  async delByPattern(pattern) {
    try {
      let count = 0;
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      
      // Collecter toutes les clés à supprimer
      const keysToDelete = [];
      for (const key of this.memoryCache.keys()) {
        if (regex.test(key)) {
          keysToDelete.push(key);
        }
      }
      
      // Supprimer les clés
      for (const key of keysToDelete) {
        if (this._removeKey(key)) {
          count++;
        }
      }
      
      return count;
    } catch (error) {
      this.metrics.errors++;
      logger.error(`[CacheService] Erreur lors de la suppression par motif: ${error.message}`);
      return 0;
    }
  }

  /**
   * Supprime toutes les clés d'un namespace
   * @param {string} namespace - Namespace à vider
   * @returns {Promise<number>} Nombre de clés supprimées
   */
  async clearNamespace(namespace) {
    return this.delByPattern(`${namespace}:*`);
  }

  /**
   * Incrémente une valeur de compteur dans le cache
   * @param {string} key - Clé du compteur
   * @param {number} increment - Valeur d'incrément (par défaut 1)
   * @param {Object} options - Options supplémentaires
   * @returns {Promise<number>} Nouvelle valeur du compteur
   */
  async increment(key, increment = 1, options = {}) {
    try {
      const normalizedKey = this._normalizeKey(key);
      let currentValue = 0;
      
      if (this.memoryCache.has(normalizedKey)) {
        currentValue = parseInt(JSON.parse(this.memoryCache.get(normalizedKey))) || 0;
      }
      
      const newValue = currentValue + increment;
      
      // Récupérer le TTL actuel s'il existe
      let ttl = options.ttl;
      if (!ttl && this.cacheTTL.has(normalizedKey)) {
        const expireTime = this.cacheTTL.get(normalizedKey);
        if (expireTime) {
          ttl = Math.max(1, Math.floor((expireTime - Date.now()) / 1000));
        }
      }
      
      await this.set(normalizedKey, newValue, ttl || this.config.defaultTTL, options);
      return newValue;
    } catch (error) {
      this.metrics.errors++;
      logger.error(`[CacheService] Erreur lors de l'incrémentation de ${key}: ${error.message}`);
      return 0;
    }
  }

  /**
   * Récupère plusieurs valeurs du cache en une seule opération
   * @param {Array<string>} keys - Liste des clés à récupérer
   * @param {Object} options - Options supplémentaires
   * @returns {Promise<Object>} Objet avec les valeurs récupérées
   */
  async mget(keys, options = {}) {
    try {
      const values = {};
      const promises = [];
      
      // Préparer les promesses pour toutes les clés
      for (const key of keys) {
        promises.push(
          this.get(key, options).then(value => {
            values[key] = value;
          })
        );
      }
      
      // Attendre que toutes les récupérations soient terminées
      await Promise.all(promises);
      
      return values;
    } catch (error) {
      this.metrics.errors++;
      logger.error(`[CacheService] Erreur lors de la récupération multiple: ${error.message}`);
      return {};
    }
  }

  /**
   * Stocke plusieurs valeurs dans le cache en une seule opération
   * @param {Object} keyValues - Objet avec les clés et valeurs à stocker
   * @param {number} ttl - Durée de vie en secondes
   * @param {Object} options - Options supplémentaires
   * @returns {Promise<boolean>} Succès de l'opération
   */
  async mset(keyValues, ttl = this.config.defaultTTL, options = {}) {
    try {
      const promises = [];
      
      // Préparer les promesses pour toutes les paires clé-valeur
      for (const [key, value] of Object.entries(keyValues)) {
        promises.push(this.set(key, value, ttl, options));
      }
      
      // Attendre que toutes les opérations soient terminées
      await Promise.all(promises);
      
      return true;
    } catch (error) {
      this.metrics.errors++;
      logger.error(`[CacheService] Erreur lors du stockage multiple: ${error.message}`);
      return false;
    }
  }

  /**
   * Récupère les métriques du service de cache
   * @returns {Object} Métriques du cache
   */
  getMetrics() {
    const totalRequests = this.metrics.hits + this.metrics.misses;
    const hitRate = totalRequests > 0
      ? (this.metrics.hits / totalRequests * 100).toFixed(2)
      : 0;
    
    const hotHitRate = this.metrics.hits > 0
      ? (this.metrics.hotHits / this.metrics.hits * 100).toFixed(2)
      : 0;
    
    return {
      ...this.metrics,
      hitRate: `${hitRate}%`,
      hotHitRate: `${hotHitRate}%`,
      type: 'memory-advanced',
      status: 'connected',
      keys: this.memoryCache.size,
      hotKeys: this.hotCache.size
    };
  }

  /**
   * Réinitialise les métriques du service de cache
   */
  resetMetrics() {
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      errors: 0,
      hotHits: 0,
      evictions: 0
    };
    
    return this.metrics;
  }

  /**
   * Initialiser le service de cache
   * @returns {Promise<boolean>} Statut d'initialisation
   */
  async initialize() {
    try {
      logger.info('[CacheService] Service de cache avancé initialisé');
      return true;
    } catch (error) {
      logger.error(`[CacheService] Erreur d'initialisation: ${error.message}`);
      return false;
    }
  }

  /**
   * Récupère les statistiques du cache
   * @returns {Promise<Object>} Statistiques du cache
   */
  async getStats() {
    try {
      const metrics = this.getMetrics();
      
      // Calculer la taille approximative du cache en mémoire
      let totalSize = 0;
      for (const [key, value] of this.memoryCache.entries()) {
        totalSize += key.length * 2; // Approximation pour les chaînes UTF-16
        totalSize += value.length;
      }
      
      // Convertir en MB
      const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
      
      return {
        ...metrics,
        connected: true,
        type: 'memory-advanced',
        keys: this.memoryCache.size,
        hotKeys: this.hotCache.size,
        size: `${sizeMB} MB`,
        uptime: process.uptime()
      };
    } catch (error) {
      logger.error(`[CacheService] Erreur lors de la récupération des statistiques: ${error.message}`);
      return {
        hits: this.metrics.hits,
        misses: this.metrics.misses,
        keys: 0,
        connected: false,
        type: 'memory-advanced'
      };
    }
  }

  /**
   * Vide complètement le cache
   * @returns {Promise<number>} Nombre de clés supprimées
   */
  async flush() {
    try {
      return redisCache.flush();
    } catch (error) {
      this.metrics.errors++;
      logger.error(`[CacheService] Erreur lors du vidage du cache: ${error.message}`);
      return 0;
    }
  }
  
  /**
   * Nettoie les clés expirées
   * @private
   */
  _cleanup() {
    const now = Date.now();
    let expired = 0;
    
    for (const [key, expireTime] of this.cacheTTL.entries()) {
      if (expireTime && expireTime < now) {
        this._removeKey(key);
        expired++;
      }
    }
    
    if (expired > 0) {
      logger.debug(`[CacheService] ${expired} clés expirées supprimées`);
    }
  }
  
  /**
   * Supprime une clé de tous les caches
   * @param {string} key - Clé à supprimer
   * @returns {boolean} True si la clé existait
   * @private
   */
  _removeKey(key) {
    const existed = this.memoryCache.has(key);
    this.memoryCache.delete(key);
    this.cacheTTL.delete(key);
    this.hotCache.delete(key);
    this.accessCount.delete(key);
    return existed;
  }
  
  /**
   * Incrémente le compteur d'accès pour une clé
   * @param {string} key - Clé à incrémenter
   * @private
   */
  _incrementAccessCount(key) {
    const count = (this.accessCount.get(key) || 0) + 1;
    this.accessCount.set(key, count);
    
    // Si la clé atteint le seuil, l'ajouter au hot cache
    if (count === this.hotCacheThreshold && !this.hotCache.has(key)) {
      this.hotCache.set(key, this.memoryCache.get(key));
      this._manageHotCacheSize();
    }
  }
  
  /**
   * Gère la taille du hot cache en supprimant les éléments les moins accédés si nécessaire
   * @private
   */
  _manageHotCacheSize() {
    if (this.hotCache.size <= this.hotCacheMaxSize) {
      return;
    }
    
    // Trier les clés par nombre d'accès
    const keysByAccess = Array.from(this.hotCache.keys())
      .map(key => ({ key, count: this.accessCount.get(key) || 0 }))
      .sort((a, b) => a.count - b.count);
    
    // Supprimer les clés les moins accédées
    const toRemove = keysByAccess.slice(0, Math.ceil(this.hotCacheMaxSize * 0.2)); // Supprimer 20% des clés
    
    for (const { key } of toRemove) {
      this.hotCache.delete(key);
      this.metrics.evictions++;
    }
  }
  
  /**
   * Normalise une clé de cache
   * @param {string} key - Clé à normaliser
   * @returns {string} Clé normalisée
   * @private
   */
  _normalizeKey(key) {
    // Si la clé contient déjà un namespace, la retourner telle quelle
    if (key.includes(':')) {
      return key;
    }
    
    // Sinon, ajouter le namespace par défaut
    return `default:${key}`;
  }
  
  /**
   * Génère une clé de cache basée sur des paramètres
   * @param {string} namespace - Namespace de la clé
   * @param {Object} params - Paramètres à inclure dans la clé
   * @returns {string} Clé de cache générée
   */
  generateKey(namespace, params) {
    // Vérifier si le namespace est valide
    if (!this.namespaces.has(namespace)) {
      this.namespaces.add(namespace);
    }
    
    // Trier les paramètres pour garantir la cohérence des clés
    const sortedParams = {};
    Object.keys(params).sort().forEach(key => {
      sortedParams[key] = params[key];
    });
    
    // Générer un hash des paramètres
    const paramsHash = crypto
      .createHash('md5')
      .update(JSON.stringify(sortedParams))
      .digest('hex');
    
    return `${namespace}:${paramsHash}`;
  }
}

module.exports = new CacheService();
