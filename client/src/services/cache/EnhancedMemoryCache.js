/**
 * Service de cache en mémoire optimisé pour Velo-Altitude
 * Implémente la compression, les métriques et la gestion avancée de la mémoire
 */

import LZString from 'lz-string';
import { performanceMonitor } from '../monitoring/performanceMonitor';

class EnhancedMemoryCache {
  constructor(options = {}) {
    this.cache = new Map();
    this.config = {
      maxSize: options.maxSize || 1000,
      defaultTTL: options.defaultTTL || 3600 * 1000, // 1 heure en ms
      cleanupInterval: options.cleanupInterval || 300 * 1000, // 5 minutes en ms
      compression: options.compression !== undefined ? options.compression : true,
      compressionThreshold: options.compressionThreshold || 1024, // Compresser si > 1KB
      debug: options.debug || false
    };
    
    // Métriques
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0,
      cleanups: 0,
      compressionSavings: 0,
      totalSize: 0,
      maxSizeReached: false
    };
    
    // Démarrer le nettoyage périodique
    this._startCleanupInterval();
    
    if (this.config.debug) {
      console.log('[EnhancedMemoryCache] Initialized with config:', this.config);
    }
  }
  
  /**
   * Récupère une valeur du cache
   * @param {string} key - Clé de cache
   * @returns {*} Valeur cachée ou null
   */
  get(key) {
    const start = performance.now();
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.metrics.misses++;
      performanceMonitor.recordCacheOperation('miss', key, performance.now() - start);
      return null;
    }
    
    // Vérifier l'expiration
    if (entry.expires && entry.expires < Date.now()) {
      this.cache.delete(key);
      this.metrics.evictions++;
      this.metrics.misses++;
      performanceMonitor.recordCacheOperation('expired', key, performance.now() - start);
      return null;
    }
    
    // Décompresser si nécessaire
    let value = entry.value;
    if (entry.compressed) {
      try {
        value = JSON.parse(LZString.decompress(entry.value));
      } catch (error) {
        console.error(`[EnhancedMemoryCache] Decompression error for key ${key}:`, error);
        this.cache.delete(key);
        this.metrics.misses++;
        return null;
      }
    }
    
    // Mettre à jour les statistiques
    this.metrics.hits++;
    
    // Enregistrer la performance
    const duration = performance.now() - start;
    performanceMonitor.recordCacheOperation('hit', key, duration);
    
    if (this.config.debug) {
      console.log(`[EnhancedMemoryCache] Cache hit for ${key} (${duration.toFixed(2)}ms)`);
    }
    
    return value;
  }
  
  /**
   * Stocke une valeur dans le cache
   * @param {string} key - Clé de cache
   * @param {*} value - Valeur à mettre en cache
   * @param {object} options - Options de mise en cache
   * @returns {boolean} true si réussi
   */
  set(key, value, options = {}) {
    const start = performance.now();
    
    // Vérifier si le cache est plein et qu'on doit évacuer
    if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
      this._evictOldest();
    }
    
    const ttl = options.ttl || this.config.defaultTTL;
    const expires = ttl > 0 ? Date.now() + ttl : null;
    
    let shouldCompress = this.config.compression;
    let compressed = false;
    let valueToStore = value;
    let originalSize = 0;
    let compressedSize = 0;
    
    // Décider si on compresse (uniquement pour les objets/arrays)
    if (shouldCompress && (typeof value === 'object' || Array.isArray(value))) {
      const stringValue = JSON.stringify(value);
      originalSize = stringValue.length * 2; // Approximation de la taille en mémoire
      
      // Ne compresser que si la valeur dépasse le seuil
      if (originalSize > this.config.compressionThreshold) {
        try {
          valueToStore = LZString.compress(stringValue);
          compressedSize = valueToStore.length * 2;
          
          // Ne compresser que si ça apporte un gain réel
          if (compressedSize < originalSize * 0.9) { // Au moins 10% de gain
            compressed = true;
            this.metrics.compressionSavings += (originalSize - compressedSize);
          } else {
            valueToStore = value;
          }
        } catch (error) {
          console.warn(`[EnhancedMemoryCache] Compression failed for key ${key}:`, error);
          valueToStore = value;
        }
      } else {
        // Valeur trop petite pour être compressée
        shouldCompress = false;
      }
    } else {
      shouldCompress = false;
    }
    
    // Stocker dans le cache
    this.cache.set(key, {
      value: valueToStore,
      compressed,
      expires,
      size: compressed ? compressedSize : originalSize,
      lastAccessed: Date.now()
    });
    
    // Mettre à jour les métriques
    this.metrics.sets++;
    if (compressed) {
      if (this.config.debug) {
        const savingsPercent = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
        console.log(`[EnhancedMemoryCache] Compressed ${key}: ${originalSize} -> ${compressedSize} bytes (${savingsPercent}% saved)`);
      }
    }
    
    // Enregistrer la performance
    const duration = performance.now() - start;
    performanceMonitor.recordCacheOperation('set', key, duration);
    
    return true;
  }
  
  /**
   * Supprime une entrée du cache
   * @param {string} key - Clé de cache à supprimer
   * @returns {boolean} true si l'entrée existait
   */
  delete(key) {
    const result = this.cache.delete(key);
    if (result && this.config.debug) {
      console.log(`[EnhancedMemoryCache] Deleted ${key} from cache`);
    }
    return result;
  }
  
  /**
   * Vide entièrement le cache
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    
    if (this.config.debug) {
      console.log(`[EnhancedMemoryCache] Cleared entire cache (${size} entries)`);
    }
    
    return size;
  }
  
  /**
   * Supprime les entrées expirées
   * @returns {number} Nombre d'entrées nettoyées
   */
  cleanup() {
    const start = performance.now();
    const now = Date.now();
    let count = 0;
    
    // Parcourir toutes les entrées et supprimer celles expirées
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expires && entry.expires < now) {
        this.cache.delete(key);
        count++;
        this.metrics.evictions++;
      }
    }
    
    this.metrics.cleanups++;
    
    const duration = performance.now() - start;
    if (count > 0 && this.config.debug) {
      console.log(`[EnhancedMemoryCache] Cleaned up ${count} expired entries (${duration.toFixed(2)}ms)`);
    }
    
    return count;
  }
  
  /**
   * Retourne les statistiques actuelles du cache
   * @returns {Object} Statistiques du cache
   */
  getStats() {
    const hitRate = this.metrics.hits + this.metrics.misses > 0
      ? (this.metrics.hits / (this.metrics.hits + this.metrics.misses) * 100).toFixed(2)
      : 0;
      
    // Calculer la taille approximative totale
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += entry.size || 0;
    }
    
    this.metrics.totalSize = totalSize;
    
    return {
      ...this.metrics,
      size: this.cache.size,
      maxSize: this.config.maxSize,
      usage: (this.cache.size / this.config.maxSize * 100).toFixed(2) + '%',
      hitRate: hitRate + '%',
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2) + ' MB',
      compressionSavingsMB: (this.metrics.compressionSavings / (1024 * 1024)).toFixed(2) + ' MB'
    };
  }
  
  /**
   * Évince l'entrée la moins récemment utilisée
   * @private
   */
  _evictOldest() {
    let oldest = Infinity;
    let oldestKey = null;
    
    // Trouver l'entrée la moins récemment accédée
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldest) {
        oldest = entry.lastAccessed;
        oldestKey = key;
      }
    }
    
    // Supprimer l'entrée
    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.metrics.evictions++;
      
      if (this.config.debug) {
        console.log(`[EnhancedMemoryCache] Evicted oldest entry: ${oldestKey}`);
      }
      
      this.metrics.maxSizeReached = true;
    }
  }
  
  /**
   * Démarre l'intervalle de nettoyage périodique
   * @private
   */
  _startCleanupInterval() {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
    
    // S'assurer que l'intervalle ne bloque pas la fermeture de l'application
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        clearInterval(this.cleanupInterval);
      });
    }
  }
}

// Exporter une instance par défaut avec la configuration standard
const defaultCache = new EnhancedMemoryCache({
  maxSize: 1000,
  defaultTTL: 3600 * 1000, // 1 heure
  cleanupInterval: 300 * 1000, // 5 minutes
  compression: true,
  compressionThreshold: 1024 // 1KB
});

export { EnhancedMemoryCache, defaultCache };
