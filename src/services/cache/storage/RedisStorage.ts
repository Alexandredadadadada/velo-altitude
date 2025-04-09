/**
 * Implémentation du stockage Redis pour le cache
 * Permet un cache distribué et persistant entre plusieurs instances
 */

import { Redis } from 'ioredis';
import { StorageStrategy } from '../types';
import { monitoringService } from '../../monitoring';

export class RedisStorage<T> implements StorageStrategy<T> {
  private client: Redis;
  private connected: boolean = false;
  private prefix: string;
  
  /**
   * Constructeur
   * @param config Configuration Redis
   * @param prefix Préfixe pour les clés (optionnel)
   */
  constructor(redisUrl: string, prefix: string = 'velo:cache:') {
    this.prefix = prefix;
    
    // Initialiser la connexion Redis
    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableOfflineQueue: true,
      connectTimeout: 10000,
      keyPrefix: prefix
    });
    
    // Gérer les événements de connexion
    this.client.on('connect', () => {
      this.connected = true;
      console.info('[RedisStorage] Connected to Redis');
    });
    
    this.client.on('error', (err) => {
      this.connected = false;
      console.error('[RedisStorage] Redis error:', err);
      monitoringService.trackError('redis_connection_error', err, {
        service: 'CacheService'
      });
    });
    
    this.client.on('reconnecting', () => {
      console.warn('[RedisStorage] Reconnecting to Redis...');
    });
  }
  
  /**
   * Récupère une valeur du cache Redis
   */
  async get(key: string): Promise<T | null> {
    if (!this.connected) {
      throw new Error('Redis not connected');
    }
    
    try {
      const value = await this.client.get(key);
      
      if (!value) {
        return null;
      }
      
      // Désérialiser la valeur JSON
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`[RedisStorage] Error getting key ${key}:`, error);
      monitoringService.trackError('redis_get_error', error as Error, { key });
      return null;
    }
  }
  
  /**
   * Stocke une valeur dans le cache Redis
   */
  async set(key: string, value: T, ttl?: number): Promise<void> {
    if (!this.connected) {
      throw new Error('Redis not connected');
    }
    
    try {
      // Sérialiser la valeur en JSON
      const serialized = JSON.stringify(value);
      
      if (ttl) {
        // Avec TTL
        await this.client.set(key, serialized, 'EX', ttl);
      } else {
        // Sans TTL
        await this.client.set(key, serialized);
      }
    } catch (error) {
      console.error(`[RedisStorage] Error setting key ${key}:`, error);
      monitoringService.trackError('redis_set_error', error as Error, { key });
    }
  }
  
  /**
   * Supprime une entrée du cache Redis
   */
  async delete(key: string): Promise<boolean> {
    if (!this.connected) {
      throw new Error('Redis not connected');
    }
    
    try {
      const result = await this.client.del(key);
      return result > 0;
    } catch (error) {
      console.error(`[RedisStorage] Error deleting key ${key}:`, error);
      monitoringService.trackError('redis_delete_error', error as Error, { key });
      return false;
    }
  }
  
  /**
   * Vide le cache Redis (avec pattern optionnel)
   */
  async clear(pattern?: string): Promise<void> {
    if (!this.connected) {
      throw new Error('Redis not connected');
    }
    
    try {
      if (!pattern) {
        // Vider tout le cache associé au préfixe
        const keys = await this.client.keys(`${this.prefix}*`);
        
        if (keys.length > 0) {
          await this.client.del(...keys);
        }
      } else {
        // Vider selon un pattern
        const fullPattern = `${this.prefix}${pattern.replace('*', '')}*`;
        const keys = await this.client.keys(fullPattern);
        
        if (keys.length > 0) {
          await this.client.del(...keys);
        }
      }
    } catch (error) {
      console.error('[RedisStorage] Error clearing cache:', error);
      monitoringService.trackError('redis_clear_error', error as Error, { pattern });
    }
  }
  
  /**
   * Vérifie si une clé existe dans le cache Redis
   */
  async has(key: string): Promise<boolean> {
    if (!this.connected) {
      throw new Error('Redis not connected');
    }
    
    try {
      const exists = await this.client.exists(key);
      return exists === 1;
    } catch (error) {
      console.error(`[RedisStorage] Error checking key ${key}:`, error);
      monitoringService.trackError('redis_has_error', error as Error, { key });
      return false;
    }
  }
  
  /**
   * Récupère toutes les clés du cache Redis correspondant à un pattern
   */
  async keys(pattern?: string): Promise<string[]> {
    if (!this.connected) {
      throw new Error('Redis not connected');
    }
    
    try {
      if (!pattern) {
        return await this.client.keys(`${this.prefix}*`);
      }
      
      const fullPattern = `${this.prefix}${pattern.replace('*', '')}*`;
      return await this.client.keys(fullPattern);
    } catch (error) {
      console.error('[RedisStorage] Error getting keys:', error);
      monitoringService.trackError('redis_keys_error', error as Error, { pattern });
      return [];
    }
  }
  
  /**
   * Récupère la taille du cache Redis
   */
  async size(): Promise<number> {
    if (!this.connected) {
      throw new Error('Redis not connected');
    }
    
    try {
      const keys = await this.client.keys(`${this.prefix}*`);
      return keys.length;
    } catch (error) {
      console.error('[RedisStorage] Error getting size:', error);
      monitoringService.trackError('redis_size_error', error as Error);
      return 0;
    }
  }
  
  /**
   * Libère les ressources
   */
  async destroy(): Promise<void> {
    try {
      await this.client.quit();
    } catch (error) {
      console.error('[RedisStorage] Error destroying Redis client:', error);
    }
  }
  
  /**
   * Vérifie si la connexion Redis est active
   */
  isConnected(): boolean {
    return this.connected;
  }
}
