/**
 * Politique d'éviction Least Recently Used (LRU)
 * Supprime les entrées utilisées le moins récemment
 */

import { EvictionPolicy } from '../types';

export class LRUPolicy implements EvictionPolicy {
  private accessMap: Map<string, number> = new Map();
  
  /**
   * Enregistre un accès à une clé
   * @param key Clé accédée
   */
  recordAccess(key: string): void {
    this.accessMap.set(key, Date.now());
  }
  
  /**
   * Enregistre l'ajout d'une clé
   * @param key Clé ajoutée
   */
  recordSet(key: string): void {
    this.accessMap.set(key, Date.now());
  }
  
  /**
   * Récupère la clé candidate à l'éviction
   * @returns Clé à supprimer ou null si le cache est vide
   */
  getEvictionCandidate(): string | null {
    if (this.accessMap.size === 0) {
      return null;
    }
    
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    
    for (const [key, timestamp] of this.accessMap.entries()) {
      if (timestamp < oldestTime) {
        oldestTime = timestamp;
        oldestKey = key;
      }
    }
    
    return oldestKey;
  }
  
  /**
   * Supprime une clé de la politique
   * @param key Clé à supprimer
   */
  removeKey(key: string): void {
    this.accessMap.delete(key);
  }
  
  /**
   * Vide la politique
   */
  clear(): void {
    this.accessMap.clear();
  }
}
