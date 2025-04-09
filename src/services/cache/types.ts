/**
 * Types pour le service de cache avancé
 */

/**
 * Stratégies d'éviction pour le cache
 */
export enum EvictionStrategy {
  LRU = 'LRU',   // Least Recently Used
  LFU = 'LFU',   // Least Frequently Used
  FIFO = 'FIFO', // First In First Out
  TTL = 'TTL'    // Time To Live
}

/**
 * Types de stockage pour le cache
 */
export enum StorageType {
  MEMORY = 'memory',
  REDIS = 'redis',
  HYBRID = 'hybrid'
}

/**
 * Options de configuration du cache
 */
export interface CacheConfig {
  defaultTTL: number;        // Durée de vie par défaut des entrées en secondes
  maxSize: number;           // Taille maximale du cache (en nombre d'entrées)
  evictionStrategy: EvictionStrategy;
  segmentationEnabled?: boolean; // Activer la segmentation du cache par type de données
  compressionEnabled?: boolean;  // Activer la compression des données
  storageType: StorageType;
  keyPrefix?: string;           // Préfixe pour les clés (utile pour multi-tenant)
}

/**
 * Options pour les opérations de cache
 */
export interface CacheOptions {
  ttl?: number;              // Durée de vie spécifique pour cette entrée
  segment?: string;          // Segment de cache (ex: 'weather', 'strava', etc.)
  priority?: number;         // Priorité de l'entrée (0-10)
  skipCompression?: boolean; // Désactiver la compression pour cette entrée
}

/**
 * Résultat d'une opération de cache
 */
export interface CacheResult<T> {
  hit: boolean;             // Cache hit ou miss
  value: T | null;          // Valeur récupérée
  latency: number;          // Latence de l'opération en ms
  source?: 'memory' | 'redis' | 'network'; // Source de la donnée
}

/**
 * Métriques du cache
 */
export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRatio: number;
  size: number;
  evictions: number;
  averageLatency: number;
  segmentStats: Record<string, {
    hits: number;
    misses: number;
    size: number;
  }>;
}

/**
 * Interface pour les stratégies de stockage
 */
export interface StorageStrategy<T> {
  get(key: string): Promise<T | null>;
  set(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(pattern?: string): Promise<void>;
  has(key: string): Promise<boolean>;
  keys(pattern?: string): Promise<string[]>;
  size(): Promise<number>;
}

/**
 * Interface pour les stratégies d'éviction
 */
export interface EvictionPolicy {
  recordAccess(key: string): void;
  recordSet(key: string): void;
  getEvictionCandidate(): string | null;
  clear(): void;
}
