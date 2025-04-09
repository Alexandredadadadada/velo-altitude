/**
 * Implémentation du stockage hybride pour le cache
 * Combine le cache mémoire (rapide) et Redis (partagé entre instances)
 * 
 * Stratégie:
 * - Lire d'abord depuis la mémoire (haute performance)
 * - Si absent, lire depuis Redis
 * - Écrire simultanément en mémoire et dans Redis
 */

import { StorageStrategy } from '../types';
import { MemoryStorage } from './MemoryStorage';
import { RedisStorage } from './RedisStorage';
import { monitoringService } from '../../monitoring';

export class HybridStorage<T> implements StorageStrategy<T> {
  private memoryStorage: MemoryStorage<T>;
  private redisStorage: RedisStorage<T>;
  private fallbackToMemoryOnly: boolean = false;
  
  /**
   * Constructeur
   * @param redisUrl URL de connexion Redis
   * @param prefix Préfixe pour les clés Redis
   * @param memoryCheckIntervalMs Intervalle de vérification de la mémoire
   */
  constructor(
    redisUrl: string,
    prefix: string = 'velo:cache:',
    memoryCheckIntervalMs: number = 60000
  ) {
    // Initialiser les deux stockages
    this.memoryStorage = new MemoryStorage<T>(memoryCheckIntervalMs);
    
    try {
      this.redisStorage = new RedisStorage<T>(redisUrl, prefix);
    } catch (error) {
      console.error('[HybridStorage] Failed to initialize Redis, falling back to memory-only:', error);
      monitoringService.trackError('hybrid_storage_init_error', error as Error);
      this.fallbackToMemoryOnly = true;
    }
    
    // Surveiller périodiquement l'état de Redis
    this.monitorRedisConnection();
  }
  
  /**
   * Récupère une valeur du cache
   * Tente d'abord la mémoire, puis Redis si nécessaire
   */
  async get(key: string): Promise<T | null> {
    try {
      // Vérifier d'abord dans la mémoire (plus rapide)
      const memoryValue = await this.memoryStorage.get(key);
      
      if (memoryValue !== null) {
        // Cache hit en mémoire
        monitoringService.trackEvent('cache_hit', { storage: 'memory', key });
        return memoryValue;
      }
      
      // Si pas en mémoire et Redis est disponible, vérifier dans Redis
      if (!this.fallbackToMemoryOnly) {
        try {
          const redisValue = await this.redisStorage.get(key);
          
          if (redisValue !== null) {
            // Cache hit dans Redis, synchroniser avec la mémoire
            await this.memoryStorage.set(key, redisValue);
            monitoringService.trackEvent('cache_hit', { storage: 'redis', key });
            return redisValue;
          }
        } catch (error) {
          // Erreur Redis, se rabattre sur le résultat de la mémoire (null)
          console.warn(`[HybridStorage] Redis get error for ${key}:`, error);
          this.checkRedisConnection(error as Error);
        }
      }
      
      // Cache miss complet
      monitoringService.trackEvent('cache_miss', { key });
      return null;
    } catch (error) {
      console.error(`[HybridStorage] Error getting key ${key}:`, error);
      monitoringService.trackError('hybrid_storage_get_error', error as Error, { key });
      return null;
    }
  }
  
  /**
   * Stocke une valeur dans le cache (mémoire et Redis)
   */
  async set(key: string, value: T, ttl?: number): Promise<void> {
    try {
      // Toujours stocker en mémoire
      await this.memoryStorage.set(key, value, ttl);
      
      // Si Redis est disponible, stocker également dans Redis
      if (!this.fallbackToMemoryOnly) {
        try {
          await this.redisStorage.set(key, value, ttl);
        } catch (error) {
          console.warn(`[HybridStorage] Redis set error for ${key}:`, error);
          this.checkRedisConnection(error as Error);
        }
      }
    } catch (error) {
      console.error(`[HybridStorage] Error setting key ${key}:`, error);
      monitoringService.trackError('hybrid_storage_set_error', error as Error, { key });
    }
  }
  
  /**
   * Supprime une entrée du cache (mémoire et Redis)
   */
  async delete(key: string): Promise<boolean> {
    try {
      // Supprimer de la mémoire
      const memoryResult = await this.memoryStorage.delete(key);
      
      // Si Redis est disponible, supprimer également de Redis
      if (!this.fallbackToMemoryOnly) {
        try {
          await this.redisStorage.delete(key);
        } catch (error) {
          console.warn(`[HybridStorage] Redis delete error for ${key}:`, error);
          this.checkRedisConnection(error as Error);
        }
      }
      
      return memoryResult;
    } catch (error) {
      console.error(`[HybridStorage] Error deleting key ${key}:`, error);
      monitoringService.trackError('hybrid_storage_delete_error', error as Error, { key });
      return false;
    }
  }
  
  /**
   * Vide le cache (mémoire et Redis)
   */
  async clear(pattern?: string): Promise<void> {
    try {
      // Vider la mémoire
      await this.memoryStorage.clear(pattern);
      
      // Si Redis est disponible, vider également Redis
      if (!this.fallbackToMemoryOnly) {
        try {
          await this.redisStorage.clear(pattern);
        } catch (error) {
          console.warn('[HybridStorage] Redis clear error:', error);
          this.checkRedisConnection(error as Error);
        }
      }
    } catch (error) {
      console.error('[HybridStorage] Error clearing cache:', error);
      monitoringService.trackError('hybrid_storage_clear_error', error as Error, { pattern });
    }
  }
  
  /**
   * Vérifie si une clé existe dans le cache
   */
  async has(key: string): Promise<boolean> {
    try {
      // Vérifier d'abord dans la mémoire
      if (await this.memoryStorage.has(key)) {
        return true;
      }
      
      // Si pas en mémoire et Redis est disponible, vérifier dans Redis
      if (!this.fallbackToMemoryOnly) {
        try {
          return await this.redisStorage.has(key);
        } catch (error) {
          console.warn(`[HybridStorage] Redis has error for ${key}:`, error);
          this.checkRedisConnection(error as Error);
        }
      }
      
      return false;
    } catch (error) {
      console.error(`[HybridStorage] Error checking key ${key}:`, error);
      monitoringService.trackError('hybrid_storage_has_error', error as Error, { key });
      return false;
    }
  }
  
  /**
   * Récupère toutes les clés du cache
   */
  async keys(pattern?: string): Promise<string[]> {
    try {
      const memoryKeys = await this.memoryStorage.keys(pattern);
      
      // Si Redis est disponible, récupérer également les clés Redis
      if (!this.fallbackToMemoryOnly) {
        try {
          const redisKeys = await this.redisStorage.keys(pattern);
          
          // Combiner les clés uniques
          const allKeys = new Set([...memoryKeys, ...redisKeys]);
          return Array.from(allKeys);
        } catch (error) {
          console.warn('[HybridStorage] Redis keys error:', error);
          this.checkRedisConnection(error as Error);
        }
      }
      
      return memoryKeys;
    } catch (error) {
      console.error('[HybridStorage] Error getting keys:', error);
      monitoringService.trackError('hybrid_storage_keys_error', error as Error, { pattern });
      return [];
    }
  }
  
  /**
   * Récupère la taille du cache
   * Note: peut retourner une approximation car les deux caches peuvent avoir des clés différentes
   */
  async size(): Promise<number> {
    try {
      const memorySize = await this.memoryStorage.size();
      
      // Si Redis est disponible, récupérer également la taille Redis
      if (!this.fallbackToMemoryOnly) {
        try {
          const redisSize = await this.redisStorage.size();
          
          // Prendre la plus grande des deux tailles comme approximation
          return Math.max(memorySize, redisSize);
        } catch (error) {
          console.warn('[HybridStorage] Redis size error:', error);
          this.checkRedisConnection(error as Error);
        }
      }
      
      return memorySize;
    } catch (error) {
      console.error('[HybridStorage] Error getting size:', error);
      monitoringService.trackError('hybrid_storage_size_error', error as Error);
      return 0;
    }
  }
  
  /**
   * Libère les ressources
   */
  async destroy(): Promise<void> {
    this.memoryStorage.destroy();
    
    if (!this.fallbackToMemoryOnly) {
      await this.redisStorage.destroy();
    }
  }
  
  /**
   * Surveille périodiquement la connexion Redis
   * @private
   */
  private monitorRedisConnection(): void {
    // Vérifier toutes les 30 secondes si Redis est connecté
    setInterval(() => {
      if (this.fallbackToMemoryOnly) {
        // Tenter de réinitialiser Redis si en mode fallback
        try {
          this.redisStorage = new RedisStorage<T>(process.env.REDIS_URL || '', 'velo:cache:');
          this.fallbackToMemoryOnly = false;
          console.info('[HybridStorage] Successfully reconnected to Redis');
          
          monitoringService.trackEvent('cache_redis_reconnected', {
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          // Toujours en échec, reste en mode mémoire uniquement
        }
      } else if (!this.redisStorage.isConnected()) {
        // Redis était connecté mais ne l'est plus
        this.fallbackToMemoryOnly = true;
        
        monitoringService.trackEvent('cache_redis_disconnected', {
          timestamp: new Date().toISOString()
        });
      }
    }, 30000);
  }
  
  /**
   * Vérifie si une erreur Redis devrait déclencher un passage en mode mémoire uniquement
   * @param error Erreur Redis
   * @private
   */
  private checkRedisConnection(error: Error): void {
    // Certains types d'erreurs indiquent que Redis n'est pas disponible
    const connectionErrors = [
      'ECONNREFUSED',
      'CONNECTION_BROKEN',
      'CONNECTION_CLOSED',
      'READONLY',
      'ETIMEDOUT'
    ];
    
    const errorString = error.toString();
    const isConnectionError = connectionErrors.some(errType => 
      errorString.includes(errType)
    );
    
    if (isConnectionError) {
      this.fallbackToMemoryOnly = true;
      
      monitoringService.trackEvent('cache_redis_fallback', {
        reason: errorString.substring(0, 100),
        timestamp: new Date().toISOString()
      });
    }
  }
}
