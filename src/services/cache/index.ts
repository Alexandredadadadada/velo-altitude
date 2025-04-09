/**
 * Système de cache avancé pour Velo-Altitude
 * 
 * Fonctionnalités:
 * - Support multi-stockage (mémoire, Redis, hybride)
 * - Stratégies d'éviction configurables (LRU, LFU)
 * - Segmentation par type de données
 * - Métriques de performance
 * - TTL configurable par entrée
 * 
 * Ce module exporte:
 * - Une instance de cache par défaut pour une utilisation immédiate
 * - Des constructeurs pour créer des instances personnalisées
 * - Des utilitaires pour la gestion du cache
 */

import { CacheService } from './CacheService';
import { MemoryStorage } from './storage/MemoryStorage';
import { RedisStorage } from './storage/RedisStorage';
import { HybridStorage } from './storage/HybridStorage';
import { LRUPolicy } from './eviction/LRUPolicy';
import { LFUPolicy } from './eviction/LFUPolicy';
import { CacheMetrics } from './CacheMetrics';
import { CacheConfig, StorageType, EvictionStrategy } from './types';

// Créer une instance singleton des métriques
export const cacheMetrics = new CacheMetrics();

// Instance de cache par défaut pour une utilisation immédiate
const defaultConfig: CacheConfig = {
  defaultTTL: 3600,            // 1 heure
  maxSize: 10000,              // 10000 entrées max
  evictionStrategy: EvictionStrategy.LRU,
  segmentationEnabled: true,
  compressionEnabled: false,
  storageType: StorageType.MEMORY,
  keyPrefix: 'velo:'
};

// Créer l'instance par défaut en fonction de l'environnement
let storageType = StorageType.MEMORY;

// En production, utiliser Redis si disponible, sinon utiliser la mémoire
if (process.env.NODE_ENV === 'production' && process.env.REDIS_URL) {
  storageType = StorageType.HYBRID;
}

const defaultCacheService = new CacheService({
  ...defaultConfig,
  storageType
});

/**
 * Crée une nouvelle instance de cache avec une configuration personnalisée
 * @param config Configuration du cache
 * @returns Instance de CacheService
 */
export function createCache<T = any>(config?: Partial<CacheConfig>): CacheService<T> {
  return new CacheService<T>(config);
}

/**
 * Crée une nouvelle instance de cache avec une stratégie de stockage en mémoire
 * @param config Configuration du cache
 * @returns Instance de CacheService avec stockage en mémoire
 */
export function createMemoryCache<T = any>(config?: Partial<CacheConfig>): CacheService<T> {
  return new CacheService<T>({
    ...config,
    storageType: StorageType.MEMORY
  });
}

/**
 * Crée une nouvelle instance de cache avec une stratégie de stockage Redis
 * @param redisUrl URL de connexion Redis
 * @param config Configuration du cache
 * @returns Instance de CacheService avec stockage Redis
 */
export function createRedisCache<T = any>(
  redisUrl: string = process.env.REDIS_URL || '',
  config?: Partial<CacheConfig>
): CacheService<T> {
  return new CacheService<T>({
    ...config,
    storageType: StorageType.REDIS,
    redisUrl
  });
}

/**
 * Crée une nouvelle instance de cache avec une stratégie de stockage hybride
 * @param redisUrl URL de connexion Redis
 * @param config Configuration du cache
 * @returns Instance de CacheService avec stockage hybride
 */
export function createHybridCache<T = any>(
  redisUrl: string = process.env.REDIS_URL || '',
  config?: Partial<CacheConfig>
): CacheService<T> {
  return new CacheService<T>({
    ...config,
    storageType: StorageType.HYBRID,
    redisUrl
  });
}

/**
 * Utilitaire pour déterminer le meilleur type de stockage en fonction de l'environnement
 * @returns Type de stockage recommandé
 */
export function getBestStorageType(): StorageType {
  // En production, utiliser Redis si disponible, sinon utiliser la mémoire
  if (process.env.NODE_ENV === 'production' && process.env.REDIS_URL) {
    // Si nous avons plusieurs instances, utiliser le stockage hybride
    if (process.env.INSTANCE_COUNT && parseInt(process.env.INSTANCE_COUNT, 10) > 1) {
      return StorageType.HYBRID;
    }
    return StorageType.REDIS;
  }
  
  // En développement, utiliser la mémoire
  return StorageType.MEMORY;
}

// Exporter les classes pour une utilisation personnalisée
export { 
  CacheService,
  MemoryStorage, 
  RedisStorage, 
  HybridStorage,
  LRUPolicy,
  LFUPolicy,
  CacheMetrics
};

// Exporter les types
export * from './types';

// Exporter l'instance par défaut comme export par défaut
export default defaultCacheService;
