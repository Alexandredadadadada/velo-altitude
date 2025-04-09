/**
 * Implémentation du stockage en mémoire pour le cache
 */

import { StorageStrategy } from '../types';

/**
 * Entrée de cache avec TTL et métadonnées
 */
interface CacheEntry<T> {
  value: T;
  expires: number | null; // Timestamp d'expiration ou null si pas d'expiration
  createdAt: number;
  lastAccessed: number;
  accessCount: number;
}

/**
 * Stockage en mémoire pour le service de cache
 */
export class MemoryStorage<T> implements StorageStrategy<T> {
  private store: Map<string, CacheEntry<T>> = new Map();
  private expirationCheckInterval: NodeJS.Timeout | null = null;
  
  constructor(private checkIntervalMs: number = 60000) {
    this.startExpirationChecker();
  }
  
  /**
   * Récupère une valeur du cache
   */
  async get(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Vérifier si l'entrée est expirée
    if (entry.expires !== null && entry.expires < Date.now()) {
      this.store.delete(key);
      return null;
    }
    
    // Mettre à jour les statistiques d'accès
    entry.lastAccessed = Date.now();
    entry.accessCount++;
    
    return entry.value;
  }
  
  /**
   * Stocke une valeur dans le cache
   */
  async set(key: string, value: T, ttl?: number): Promise<void> {
    const now = Date.now();
    const expires = ttl ? now + (ttl * 1000) : null;
    
    this.store.set(key, {
      value,
      expires,
      createdAt: now,
      lastAccessed: now,
      accessCount: 0
    });
  }
  
  /**
   * Supprime une entrée du cache
   */
  async delete(key: string): Promise<boolean> {
    return this.store.delete(key);
  }
  
  /**
   * Vide le cache
   */
  async clear(pattern?: string): Promise<void> {
    if (!pattern) {
      this.store.clear();
      return;
    }
    
    const regex = new RegExp(pattern.replace('*', '.*'));
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
      }
    }
  }
  
  /**
   * Vérifie si une clé existe dans le cache
   */
  async has(key: string): Promise<boolean> {
    const entry = this.store.get(key);
    
    if (!entry) {
      return false;
    }
    
    // Vérifier si l'entrée est expirée
    if (entry.expires !== null && entry.expires < Date.now()) {
      this.store.delete(key);
      return false;
    }
    
    return true;
  }
  
  /**
   * Récupère toutes les clés du cache correspondant à un pattern
   */
  async keys(pattern?: string): Promise<string[]> {
    const keys = [...this.store.keys()];
    
    if (!pattern) {
      return keys;
    }
    
    const regex = new RegExp(pattern.replace('*', '.*'));
    return keys.filter(key => regex.test(key));
  }
  
  /**
   * Récupère la taille du cache
   */
  async size(): Promise<number> {
    return this.store.size;
  }
  
  /**
   * Récupère les métadonnées d'une entrée de cache
   */
  getEntryMetadata(key: string): Omit<CacheEntry<T>, 'value'> | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    
    const { value, ...metadata } = entry;
    return metadata;
  }
  
  /**
   * Récupère toutes les entrées pour l'éviction
   */
  getAllEntries(): Map<string, CacheEntry<T>> {
    return this.store;
  }
  
  /**
   * Démarre le vérificateur d'expiration
   */
  private startExpirationChecker(): void {
    // Nettoyer l'intervalle précédent s'il existe
    if (this.expirationCheckInterval) {
      clearInterval(this.expirationCheckInterval);
    }
    
    // Créer un nouvel intervalle
    this.expirationCheckInterval = setInterval(() => {
      this.cleanExpiredEntries();
    }, this.checkIntervalMs);
  }
  
  /**
   * Nettoie les entrées expirées
   */
  private cleanExpiredEntries(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.store.entries()) {
      if (entry.expires !== null && entry.expires < now) {
        this.store.delete(key);
      }
    }
  }
  
  /**
   * Arrête le vérificateur d'expiration
   */
  destroy(): void {
    if (this.expirationCheckInterval) {
      clearInterval(this.expirationCheckInterval);
      this.expirationCheckInterval = null;
    }
  }
}
