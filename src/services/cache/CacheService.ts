/**
 * Service de cache avancé pour Velo-Altitude
 * 
 * Caractéristiques:
 * - Support multi-stockage (mémoire, Redis, hybride)
 * - Stratégies d'éviction configurables (LRU, LFU)
 * - Segmentation par type de données
 * - Métriques de performance
 * - Compression optionnelle
 * - TTL configurable par entrée
 */

import { CacheConfig, CacheOptions, CacheResult, EvictionStrategy, StorageType } from './types';
import { MemoryStorage } from './storage/MemoryStorage';
import { LRUPolicy } from './eviction/LRUPolicy';
import { LFUPolicy } from './eviction/LFUPolicy';
import { monitoringService } from '../monitoring';

// Valeurs par défaut
const DEFAULT_CONFIG: CacheConfig = {
  defaultTTL: 3600,            // 1 heure
  maxSize: 10000,              // 10000 entrées max
  evictionStrategy: EvictionStrategy.LRU,
  segmentationEnabled: true,
  compressionEnabled: false,
  storageType: StorageType.MEMORY,
  keyPrefix: 'velo:'
};

/**
 * Service de cache principal
 */
export class CacheService<T = any> {
  private storage: MemoryStorage<T>;
  private evictionPolicy: LRUPolicy | LFUPolicy;
  private config: CacheConfig;
  private segmentSizes: Map<string, number> = new Map();
  
  // Métriques
  private hits: number = 0;
  private misses: number = 0;
  private evictions: number = 0;
  private latencySum: number = 0;
  private latencyCount: number = 0;
  private segmentHits: Map<string, number> = new Map();
  private segmentMisses: Map<string, number> = new Map();
  
  /**
   * Constructeur
   * @param config Configuration du cache (optionnel)
   */
  constructor(config?: Partial<CacheConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Initialiser le stockage
    this.storage = new MemoryStorage<T>();
    
    // Initialiser la politique d'éviction
    if (this.config.evictionStrategy === EvictionStrategy.LFU) {
      this.evictionPolicy = new LFUPolicy();
    } else {
      this.evictionPolicy = new LRUPolicy();
    }
    
    // Configurer la surveillance des métriques
    this.setupMetricsReporting();
  }
  
  /**
   * Récupère une valeur du cache
   * @param key Clé à récupérer
   * @param options Options de cache
   * @returns Résultat avec la valeur et les métadonnées
   */
  async get(key: string, options?: CacheOptions): Promise<CacheResult<T>> {
    const startTime = performance.now();
    const fullKey = this.buildKey(key, options?.segment);
    
    try {
      const value = await this.storage.get(fullKey);
      const endTime = performance.now();
      const latency = endTime - startTime;
      
      if (value !== null) {
        // Cache hit
        this.hits++;
        this.latencySum += latency;
        this.latencyCount++;
        this.evictionPolicy.recordAccess(fullKey);
        
        // Métriques par segment
        if (options?.segment) {
          const segmentHits = this.segmentHits.get(options.segment) || 0;
          this.segmentHits.set(options.segment, segmentHits + 1);
        }
        
        return {
          hit: true,
          value,
          latency,
          source: 'memory'
        };
      } else {
        // Cache miss
        this.misses++;
        
        // Métriques par segment
        if (options?.segment) {
          const segmentMisses = this.segmentMisses.get(options.segment) || 0;
          this.segmentMisses.set(options.segment, segmentMisses + 1);
        }
        
        return {
          hit: false,
          value: null,
          latency,
          source: 'network'
        };
      }
    } catch (error) {
      const endTime = performance.now();
      const latency = endTime - startTime;
      
      // Erreur de cache, traiter comme un miss
      this.misses++;
      
      monitoringService.trackError('cache_error', error as Error, {
        key: fullKey,
        operation: 'get'
      });
      
      return {
        hit: false,
        value: null,
        latency,
        source: 'network'
      };
    }
  }
  
  /**
   * Stocke une valeur dans le cache
   * @param key Clé à stocker
   * @param value Valeur à stocker
   * @param options Options de cache
   */
  async set(key: string, value: T, options?: CacheOptions): Promise<void> {
    if (value === null || value === undefined) {
      return;
    }
    
    const fullKey = this.buildKey(key, options?.segment);
    const ttl = options?.ttl || this.config.defaultTTL;
    
    try {
      // Vérifier si le cache a atteint sa capacité maximale
      const size = await this.storage.size();
      if (size >= this.config.maxSize) {
        await this.evictEntry();
      }
      
      // Stocker la valeur
      await this.storage.set(fullKey, value, ttl);
      this.evictionPolicy.recordSet(fullKey);
      
      // Mettre à jour les compteurs de segments
      if (options?.segment) {
        const segmentSize = this.segmentSizes.get(options.segment) || 0;
        this.segmentSizes.set(options.segment, segmentSize + 1);
      }
      
      // Journaliser l'opération pour le débogage
      if (process.env.NODE_ENV === 'development') {
        console.debug(`[CacheService] Set: ${fullKey}, TTL: ${ttl}s`);
      }
    } catch (error) {
      monitoringService.trackError('cache_error', error as Error, {
        key: fullKey,
        operation: 'set'
      });
    }
  }
  
  /**
   * Récupère une valeur du cache ou exécute la fonction de récupération
   * @param key Clé à récupérer
   * @param fetcher Fonction de récupération si la clé n'existe pas
   * @param options Options de cache
   * @returns Valeur du cache ou résultat du fetcher
   */
  async getOrFetch(key: string, fetcher: () => Promise<T>, options?: CacheOptions): Promise<T> {
    const result = await this.get(key, options);
    
    if (result.hit && result.value !== null) {
      // Utiliser la valeur du cache
      return result.value;
    }
    
    try {
      // Exécuter le fetcher pour récupérer la valeur
      const startTime = performance.now();
      const fetchedValue = await fetcher();
      const fetchDuration = performance.now() - startTime;
      
      // Enregistrer les métriques pour le fetcher
      monitoringService.trackEvent('cache_fetch', {
        key,
        segment: options?.segment || 'default',
        duration: fetchDuration
      });
      
      // Stocker la valeur récupérée dans le cache
      if (fetchedValue !== null && fetchedValue !== undefined) {
        await this.set(key, fetchedValue, options);
      }
      
      return fetchedValue;
    } catch (error) {
      // Journaliser l'erreur
      monitoringService.trackError('cache_fetch_error', error as Error, {
        key,
        segment: options?.segment || 'default'
      });
      
      // Relancer l'erreur
      throw error;
    }
  }
  
  /**
   * Supprime une entrée du cache
   * @param key Clé à supprimer
   * @param segment Segment optionnel
   */
  async invalidate(key: string, segment?: string): Promise<boolean> {
    const fullKey = this.buildKey(key, segment);
    
    try {
      const result = await this.storage.delete(fullKey);
      if (result) {
        this.evictionPolicy.removeKey(fullKey);
        
        // Mettre à jour les compteurs de segments
        if (segment) {
          const segmentSize = this.segmentSizes.get(segment) || 0;
          if (segmentSize > 0) {
            this.segmentSizes.set(segment, segmentSize - 1);
          }
        }
      }
      
      return result;
    } catch (error) {
      monitoringService.trackError('cache_error', error as Error, {
        key: fullKey,
        operation: 'invalidate'
      });
      
      return false;
    }
  }
  
  /**
   * Vide le cache entier ou un segment spécifique
   * @param segment Segment à vider (optionnel)
   */
  async clear(segment?: string): Promise<void> {
    try {
      if (segment) {
        // Vider un segment spécifique
        const pattern = this.buildKey('*', segment);
        await this.storage.clear(pattern);
        this.segmentSizes.set(segment, 0);
      } else {
        // Vider tout le cache
        await this.storage.clear();
        this.evictionPolicy.clear();
        this.segmentSizes.clear();
      }
    } catch (error) {
      monitoringService.trackError('cache_error', error as Error, {
        operation: 'clear',
        segment: segment || 'all'
      });
    }
  }
  
  /**
   * Récupère les métriques du cache
   * @returns Métriques de performance
   */
  getMetrics() {
    const hitRatio = this.hits + this.misses > 0
      ? (this.hits / (this.hits + this.misses))
      : 0;
    
    const averageLatency = this.latencyCount > 0
      ? (this.latencySum / this.latencyCount)
      : 0;
    
    // Construire les statistiques par segment
    const segmentStats: Record<string, { hits: number; misses: number; size: number }> = {};
    
    for (const [segment, size] of this.segmentSizes.entries()) {
      segmentStats[segment] = {
        hits: this.segmentHits.get(segment) || 0,
        misses: this.segmentMisses.get(segment) || 0,
        size
      };
    }
    
    return {
      hits: this.hits,
      misses: this.misses,
      hitRatio,
      evictions: this.evictions,
      averageLatency,
      segmentStats
    };
  }
  
  /**
   * Configure la déclaration périodique des métriques
   * @private
   */
  private setupMetricsReporting(): void {
    // Envoyer les métriques toutes les 5 minutes
    setInterval(() => {
      const metrics = this.getMetrics();
      
      // Envoyer les métriques au service de monitoring
      monitoringService.trackMetrics('cache_performance', {
        hits: metrics.hits,
        misses: metrics.misses,
        hit_ratio: metrics.hitRatio,
        evictions: metrics.evictions,
        average_latency: metrics.averageLatency
      });
      
      // Réinitialiser le compteur de latence pour éviter qu'il ne dépasse les limites
      if (this.latencyCount > 10000) {
        this.latencySum = this.latencySum / this.latencyCount * 100;
        this.latencyCount = 100;
      }
    }, 5 * 60 * 1000);
  }
  
  /**
   * Construit une clé complète avec préfixe et segment
   * @param key Clé de base
   * @param segment Segment optionnel
   * @returns Clé complète
   * @private
   */
  private buildKey(key: string, segment?: string): string {
    if (segment && this.config.segmentationEnabled) {
      return `${this.config.keyPrefix}${segment}:${key}`;
    }
    
    return `${this.config.keyPrefix}${key}`;
  }
  
  /**
   * Éjecte une entrée du cache selon la politique d'éviction
   * @private
   */
  private async evictEntry(): Promise<void> {
    const keyToEvict = this.evictionPolicy.getEvictionCandidate();
    
    if (keyToEvict) {
      await this.storage.delete(keyToEvict);
      this.evictionPolicy.removeKey(keyToEvict);
      this.evictions++;
      
      // Mettre à jour les compteurs de segments
      for (const [segment, pattern] of Object.entries(this.segmentSizes)) {
        if (keyToEvict.includes(segment)) {
          const segmentSize = this.segmentSizes.get(segment) || 0;
          if (segmentSize > 0) {
            this.segmentSizes.set(segment, segmentSize - 1);
          }
          break;
        }
      }
    }
  }
  
  /**
   * Libère les ressources du cache
   */
  destroy(): void {
    this.storage.destroy();
  }
}

// Exporter une instance singleton par défaut
export const cacheService = new CacheService();

// Exporter les types pour une utilisation facile
export * from './types';
