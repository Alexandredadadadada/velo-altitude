/**
 * Politique d'éviction Least Frequently Used (LFU)
 * Supprime les entrées les moins fréquemment utilisées
 */

import { EvictionPolicy } from '../types';

export class LFUPolicy implements EvictionPolicy {
  private frequencyMap: Map<string, number> = new Map();
  private accessTimestamps: Map<string, number> = new Map();
  
  /**
   * Enregistre un accès à une clé
   * @param key Clé accédée
   */
  recordAccess(key: string): void {
    const currentFrequency = this.frequencyMap.get(key) || 0;
    this.frequencyMap.set(key, currentFrequency + 1);
    this.accessTimestamps.set(key, Date.now());
  }
  
  /**
   * Enregistre l'ajout d'une clé
   * @param key Clé ajoutée
   */
  recordSet(key: string): void {
    // Initialiser la fréquence à 1 lors de l'ajout
    this.frequencyMap.set(key, 1);
    this.accessTimestamps.set(key, Date.now());
  }
  
  /**
   * Récupère la clé candidate à l'éviction
   * @returns Clé à supprimer ou null si le cache est vide
   */
  getEvictionCandidate(): string | null {
    if (this.frequencyMap.size === 0) {
      return null;
    }
    
    let leastFrequentKey: string | null = null;
    let lowestFrequency = Infinity;
    let oldestTimestamp = Infinity;
    
    // Trouver l'entrée avec la fréquence la plus basse
    // En cas d'égalité, prendre la plus ancienne
    for (const [key, frequency] of this.frequencyMap.entries()) {
      const timestamp = this.accessTimestamps.get(key) || 0;
      
      if (frequency < lowestFrequency || 
          (frequency === lowestFrequency && timestamp < oldestTimestamp)) {
        lowestFrequency = frequency;
        oldestTimestamp = timestamp;
        leastFrequentKey = key;
      }
    }
    
    return leastFrequentKey;
  }
  
  /**
   * Supprime une clé de la politique
   * @param key Clé à supprimer
   */
  removeKey(key: string): void {
    this.frequencyMap.delete(key);
    this.accessTimestamps.delete(key);
  }
  
  /**
   * Vide la politique
   */
  clear(): void {
    this.frequencyMap.clear();
    this.accessTimestamps.clear();
  }
  
  /**
   * Récupère la fréquence d'accès d'une clé
   * @param key Clé à vérifier
   * @returns Fréquence d'accès
   */
  getFrequency(key: string): number {
    return this.frequencyMap.get(key) || 0;
  }
}
