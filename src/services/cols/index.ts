/**
 * Point d'entrée public pour le service des cols
 * Export des classes et types principaux
 */

// Export du service principal
import { ColService } from './ColService';
export { ColService };

// Export des services auxiliaires
import { ColDataValidator } from './ColDataValidator';
import { ColErrorHandler } from './ColErrorHandler';
export { ColDataValidator, ColErrorHandler };

// Export des types
export * from './types/ColTypes';
export * from './types/WeatherTypes';
export * from './types/TerrainTypes';

/**
 * Instance par défaut du service des cols pour une utilisation directe
 * Cette instance utilise une implémentation de cache basique en mémoire
 */

// Implémentation basique de cache en mémoire
class InMemoryCache {
  private cache: Map<string, { data: any, expiry: number }> = new Map();

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data as T;
  }

  async set<T>(key: string, data: T, ttl: number = 3600000): Promise<void> {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl
    });
  }

  async remove(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }
}

// Création de l'instance par défaut avec cache en mémoire
const colService = new ColService(new InMemoryCache());

// Export de l'instance par défaut pour une utilisation directe
export default colService;
