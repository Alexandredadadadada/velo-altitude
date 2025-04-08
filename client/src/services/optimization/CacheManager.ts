import { IndexedDBManager } from './storage/IndexedDBManager';
import { LRUCache } from './algorithms/LRUCache';
import { CompressionService } from './utils/CompressionService';

/**
 * Interface pour les stratégies de cache
 */
export interface CacheStrategy {
  storage: 'memory' | 'localStorage' | 'indexedDB';
  ttl: number; // Time to live en millisecondes
  compression: boolean;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Type pour les options de cache
 */
export interface CacheOptions {
  namespace?: string;
  ttl?: number;
  compression?: boolean;
  priority?: 'high' | 'medium' | 'low';
}

/**
 * Gestionnaire unifié de cache pour l'application
 * Permet de gérer différents types de données avec des stratégies appropriées
 */
export class UnifiedCacheManager {
  private memoryCache: LRUCache;
  private persistentCache: Storage;
  private indexedDB: IndexedDBManager;
  private compressionService: CompressionService;
  
  // Définition des stratégies par type de donnée
  private strategies: Record<string, CacheStrategy> = {
    // Données de terrain (grandes, stables)
    terrain: {
      storage: 'indexedDB',
      ttl: 7 * 24 * 60 * 60 * 1000, // 7 jours
      compression: true,
      priority: 'high'
    },
    // Données météo (petites, volatiles)
    weather: {
      storage: 'memory',
      ttl: 30 * 60 * 1000, // 30 minutes
      compression: false,
      priority: 'medium'
    },
    // Données d'itinéraires (taille moyenne, semi-stables)
    routes: {
      storage: 'localStorage',
      ttl: 24 * 60 * 60 * 1000, // 24 heures
      compression: true,
      priority: 'medium'
    },
    // Préférences utilisateur (petites, importantes)
    userPrefs: {
      storage: 'localStorage',
      ttl: Infinity, // Ne pas expirer
      compression: false,
      priority: 'high'
    }
  };
  
  private config = {
    memoryManagement: {
      maxSize: {
        memory: 100 * 1024 * 1024, // 100MB
        localStorage: 5 * 1024 * 1024, // 5MB
        indexedDB: 500 * 1024 * 1024 // 500MB
      },
      cleanupStrategy: {
        type: 'LRU',
        checkInterval: 5 * 60 * 1000, // 5 minutes
        threshold: 0.9 // 90% de la capacité max
      }
    },
    preloadManager: {
      critical: ['userPrefs', 'terrainBase'],
      onIdle: ['weatherData', 'routeCache'],
      onDemand: ['highResTextures', 'detailMaps']
    },
    namespaces: {
      default: 'veloaltitude_cache',
      terrain: 'veloaltitude_terrain',
      weather: 'veloaltitude_weather',
      user: 'veloaltitude_user'
    }
  };

  /**
   * Crée une nouvelle instance du gestionnaire de cache
   * @param customConfig Configuration personnalisée (optionnelle)
   */
  constructor(customConfig?: Partial<typeof UnifiedCacheManager.prototype.config>) {
    // Fusion de la configuration par défaut avec la configuration personnalisée
    if (customConfig) {
      this.config = this.mergeConfigs(this.config, customConfig);
    }
    
    // Initialisation des services de stockage
    this.memoryCache = new LRUCache(this.config.memoryManagement.maxSize.memory);
    this.persistentCache = window.localStorage;
    this.indexedDB = new IndexedDBManager(this.config.namespaces.default);
    this.compressionService = new CompressionService();
    
    // Démarrer la surveillance et le nettoyage périodique
    this.setupPeriodicCleanup();
    
    // Précharger les données critiques
    this.preloadCriticalData();
  }

  /**
   * Récupère une entrée du cache
   * @param key Clé de l'entrée à récupérer
   * @param options Options supplémentaires
   * @returns Valeur mise en cache ou null si non trouvée
   */
  public async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const { namespace = 'default' } = options;
    const fullKey = this.getFullKey(key, namespace);
    const strategy = this.getStrategyForKey(key);
    
    try {
      let value: any = null;
      
      // Récupérer depuis le stockage approprié
      switch (strategy.storage) {
        case 'memory':
          value = this.memoryCache.get(fullKey);
          break;
        case 'localStorage':
          const rawLocalValue = this.persistentCache.getItem(fullKey);
          if (rawLocalValue) {
            const parsed = JSON.parse(rawLocalValue);
            
            // Vérifier l'expiration
            if (parsed.expiry && parsed.expiry < Date.now()) {
              this.persistentCache.removeItem(fullKey);
              return null;
            }
            
            value = parsed.value;
          }
          break;
        case 'indexedDB':
          value = await this.indexedDB.get(fullKey);
          
          // Vérifier l'expiration si la valeur existe
          if (value && value.expiry && value.expiry < Date.now()) {
            await this.indexedDB.delete(fullKey);
            return null;
          }
          
          if (value) {
            value = value.value;
          }
          break;
      }
      
      // Si la valeur est compressée, la décompresser
      if (value && strategy.compression) {
        value = await this.compressionService.decompress(value);
      }
      
      // Métriques: enregistrer un hit de cache
      this.recordMetric('hit', strategy.storage, key);
      
      return value as T;
    } catch (error) {
      console.error(`[CacheManager] Error retrieving ${fullKey}:`, error);
      
      // Métriques: enregistrer un miss de cache
      this.recordMetric('miss', strategy.storage, key);
      
      return null;
    }
  }

  /**
   * Ajoute ou met à jour une entrée dans le cache
   * @param key Clé de l'entrée
   * @param value Valeur à stocker
   * @param options Options supplémentaires
   * @returns true si réussi, false sinon
   */
  public async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<boolean> {
    const { namespace = 'default', ttl, compression, priority } = options;
    const fullKey = this.getFullKey(key, namespace);
    const strategy = this.getStrategyForKey(key, { ttl, compression, priority });
    
    try {
      // Calculer l'expiration
      const expiry = strategy.ttl === Infinity ? Infinity : Date.now() + strategy.ttl;
      
      // Compresser si nécessaire
      let valueToStore: any = value;
      if (strategy.compression) {
        valueToStore = await this.compressionService.compress(value);
      }
      
      // Stocker dans le stockage approprié
      switch (strategy.storage) {
        case 'memory':
          this.memoryCache.set(fullKey, valueToStore, expiry);
          break;
        case 'localStorage':
          const storageItem = {
            value: valueToStore,
            expiry,
            timestamp: Date.now()
          };
          
          try {
            this.persistentCache.setItem(fullKey, JSON.stringify(storageItem));
          } catch (e) {
            // Si localStorage est plein, nettoyer et réessayer
            if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
              await this.cleanStorage('localStorage');
              this.persistentCache.setItem(fullKey, JSON.stringify(storageItem));
            } else {
              throw e;
            }
          }
          break;
        case 'indexedDB':
          await this.indexedDB.set(fullKey, {
            value: valueToStore,
            expiry,
            timestamp: Date.now()
          });
          break;
      }
      
      // Métriques: enregistrer un set de cache
      this.recordMetric('set', strategy.storage, key);
      
      return true;
    } catch (error) {
      console.error(`[CacheManager] Error storing ${fullKey}:`, error);
      return false;
    }
  }

  /**
   * Supprime une entrée du cache
   * @param key Clé de l'entrée à supprimer
   * @param namespace Espace de noms
   * @returns true si réussi, false sinon
   */
  public async delete(key: string, namespace = 'default'): Promise<boolean> {
    const fullKey = this.getFullKey(key, namespace);
    const strategy = this.getStrategyForKey(key);
    
    try {
      switch (strategy.storage) {
        case 'memory':
          this.memoryCache.delete(fullKey);
          break;
        case 'localStorage':
          this.persistentCache.removeItem(fullKey);
          break;
        case 'indexedDB':
          await this.indexedDB.delete(fullKey);
          break;
      }
      
      return true;
    } catch (error) {
      console.error(`[CacheManager] Error deleting ${fullKey}:`, error);
      return false;
    }
  }

  /**
   * Vide un espace de noms du cache ou le cache entier
   * @param namespace Espace de noms à vider (ou 'all' pour tout vider)
   * @returns true si réussi, false sinon
   */
  public async clear(namespace = 'default'): Promise<boolean> {
    try {
      if (namespace === 'all') {
        // Vider tous les espaces de noms
        this.memoryCache.clear();
        
        for (const key in this.persistentCache) {
          if (key.startsWith(this.config.namespaces.default)) {
            this.persistentCache.removeItem(key);
          }
        }
        
        await this.indexedDB.clear();
      } else {
        // Vider un espace de noms spécifique
        const prefix = this.config.namespaces[namespace] || this.config.namespaces.default;
        
        this.memoryCache.clearNamespace(prefix);
        
        for (const key in this.persistentCache) {
          if (key.startsWith(prefix)) {
            this.persistentCache.removeItem(key);
          }
        }
        
        await this.indexedDB.clearNamespace(prefix);
      }
      
      return true;
    } catch (error) {
      console.error(`[CacheManager] Error clearing cache (namespace: ${namespace}):`, error);
      return false;
    }
  }

  /**
   * Précharge des données dans le cache
   * @param keys Tableau de clés à précharger
   * @returns Nombre d'éléments préchargés avec succès
   */
  public async preload(keys: string[]): Promise<number> {
    let successCount = 0;
    
    for (const key of keys) {
      try {
        // Déterminer la source de données pour cette clé
        const dataSource = await this.getDataSourceForKey(key);
        
        if (dataSource) {
          // Récupérer les données depuis la source
          const data = await dataSource(key);
          
          // Mettre en cache avec la stratégie appropriée
          if (data) {
            const success = await this.set(key, data);
            if (success) {
              successCount++;
            }
          }
        }
      } catch (error) {
        console.error(`[CacheManager] Error preloading ${key}:`, error);
      }
    }
    
    return successCount;
  }

  /**
   * Retourne les statistiques d'utilisation du cache
   */
  public getStats() {
    return {
      memory: {
        size: this.memoryCache.getSize(),
        capacity: this.memoryCache.getCapacity(),
        usage: this.memoryCache.getSize() / this.memoryCache.getCapacity()
      },
      localStorage: {
        size: this.getLocalStorageSize(),
        capacity: this.config.memoryManagement.maxSize.localStorage,
        usage: this.getLocalStorageSize() / this.config.memoryManagement.maxSize.localStorage
      },
      indexedDB: this.indexedDB.getStats(),
      hits: this.memoryCache.getHits(),
      misses: this.memoryCache.getMisses(),
      hitRate: this.memoryCache.getHitRate()
    };
  }

  /**
   * Détermine la stratégie de cache à utiliser pour une clé
   * @param key Clé à analyser
   * @param overrides Options qui peuvent surcharger la stratégie par défaut
   * @returns Stratégie de cache à utiliser
   */
  private getStrategyForKey(key: string, overrides?: Partial<CacheStrategy>): CacheStrategy {
    // Chercher une correspondance dans les stratégies prédéfinies
    let strategy: CacheStrategy;
    
    // Recherche par préfixe
    for (const [type, typeStrategy] of Object.entries(this.strategies)) {
      if (key.startsWith(`${type}_`)) {
        strategy = { ...typeStrategy };
        break;
      }
    }
    
    // Stratégie par défaut si aucune correspondance
    if (!strategy) {
      strategy = {
        storage: 'memory',
        ttl: 60 * 60 * 1000, // 1 heure
        compression: false,
        priority: 'low'
      };
    }
    
    // Appliquer les surcharges si fournies
    if (overrides) {
      strategy = { ...strategy, ...overrides };
    }
    
    return strategy;
  }

  /**
   * Génère une clé complète avec espace de noms
   * @param key Clé de base
   * @param namespace Espace de noms
   */
  private getFullKey(key: string, namespace: string): string {
    const prefix = this.config.namespaces[namespace] || this.config.namespaces.default;
    return `${prefix}:${key}`;
  }

  /**
   * Configure le nettoyage périodique du cache
   */
  private setupPeriodicCleanup(): void {
    const cleanup = async () => {
      await this.cleanExpiredEntries();
      await this.enforceStorageLimits();
      
      // Planifier le prochain nettoyage
      setTimeout(cleanup, this.config.memoryManagement.cleanupStrategy.checkInterval);
    };
    
    // Démarrer la boucle de nettoyage
    cleanup();
  }

  /**
   * Nettoie les entrées expirées du cache
   */
  private async cleanExpiredEntries(): Promise<void> {
    const now = Date.now();
    
    // Nettoyer la mémoire
    this.memoryCache.cleanExpired(now);
    
    // Nettoyer localStorage
    for (const key in this.persistentCache) {
      if (key.startsWith(this.config.namespaces.default)) {
        try {
          const value = JSON.parse(this.persistentCache.getItem(key) || '{}');
          if (value.expiry && value.expiry < now) {
            this.persistentCache.removeItem(key);
          }
        } catch (e) {
          // Ignorer les erreurs de parsing
        }
      }
    }
    
    // Nettoyer IndexedDB
    await this.indexedDB.cleanExpired(now);
  }

  /**
   * Applique les limites de stockage
   */
  private async enforceStorageLimits(): Promise<void> {
    // Vérifier et nettoyer la mémoire si nécessaire
    if (this.memoryCache.getSize() > this.config.memoryManagement.maxSize.memory * this.config.memoryManagement.cleanupStrategy.threshold) {
      this.memoryCache.prune(this.config.memoryManagement.maxSize.memory * 0.7);
    }
    
    // Vérifier et nettoyer localStorage si nécessaire
    const localStorageSize = this.getLocalStorageSize();
    if (localStorageSize > this.config.memoryManagement.maxSize.localStorage * this.config.memoryManagement.cleanupStrategy.threshold) {
      await this.cleanStorage('localStorage');
    }
    
    // Vérifier et nettoyer IndexedDB si nécessaire
    const indexedDBStats = await this.indexedDB.getStats();
    if (indexedDBStats.size > this.config.memoryManagement.maxSize.indexedDB * this.config.memoryManagement.cleanupStrategy.threshold) {
      await this.cleanStorage('indexedDB');
    }
  }

  /**
   * Nettoie un type de stockage spécifique
   * @param storageType Type de stockage à nettoyer
   */
  private async cleanStorage(storageType: 'memory' | 'localStorage' | 'indexedDB'): Promise<void> {
    // Stratégie de nettoyage par priorité et âge
    switch (storageType) {
      case 'memory':
        this.memoryCache.prune(this.config.memoryManagement.maxSize.memory * 0.7);
        break;
      case 'localStorage':
        // Récupérer toutes les entrées, les trier par priorité et date
        const localEntries: Array<{key: string, priority: string, timestamp: number}> = [];
        
        for (const key in this.persistentCache) {
          if (key.startsWith(this.config.namespaces.default)) {
            try {
              const value = JSON.parse(this.persistentCache.getItem(key) || '{}');
              // Extraire la priorité de la clé si possible
              const keyParts = key.split(':');
              const priority = this.extractPriority(keyParts[0]);
              
              localEntries.push({
                key,
                priority,
                timestamp: value.timestamp || 0
              });
            } catch (e) {
              // Ignorer les erreurs de parsing
            }
          }
        }
        
        // Trier par priorité (low en premier) puis par ancienneté
        localEntries.sort((a, b) => {
          if (a.priority !== b.priority) {
            return a.priority === 'low' ? -1 : a.priority === 'medium' && b.priority === 'high' ? -1 : 1;
          }
          return a.timestamp - b.timestamp;
        });
        
        // Supprimer les entrées jusqu'à atteindre 70% de la capacité
        const targetSize = this.config.memoryManagement.maxSize.localStorage * 0.7;
        let currentSize = this.getLocalStorageSize();
        
        for (const entry of localEntries) {
          if (currentSize <= targetSize) break;
          
          const itemSize = (this.persistentCache.getItem(entry.key) || '').length * 2; // Approximation de la taille en octets
          this.persistentCache.removeItem(entry.key);
          currentSize -= itemSize;
        }
        break;
      case 'indexedDB':
        await this.indexedDB.prune(this.config.memoryManagement.maxSize.indexedDB * 0.7);
        break;
    }
  }

  /**
   * Précharge les données critiques
   */
  private async preloadCriticalData(): Promise<void> {
    // Précharger les données critiques spécifiées dans la configuration
    await this.preload(this.config.preloadManager.critical);
    
    // Précharger les données non critiques lorsque le navigateur est inactif
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        this.preload(this.config.preloadManager.onIdle);
      });
    } else {
      // Fallback si requestIdleCallback n'est pas disponible
      setTimeout(() => {
        this.preload(this.config.preloadManager.onIdle);
      }, 3000);
    }
  }

  /**
   * Détermine la source de données pour une clé spécifique
   * @param key Clé à analyser
   */
  private async getDataSourceForKey(key: string) {
    // Cette méthode serait implémentée pour récupérer les données depuis les services appropriés
    // En fonction du préfixe de la clé
    if (key.startsWith('terrain_')) {
      const terrainService = await import('../../services/terrainService');
      return (k: string) => terrainService.getTerrainData(k.replace('terrain_', ''));
    } else if (key.startsWith('weather_')) {
      const weatherService = await import('../../services/weatherService');
      return (k: string) => weatherService.getWeatherData(k.replace('weather_', ''));
    } else if (key.startsWith('userPrefs_')) {
      const userService = await import('../../services/userService');
      return (k: string) => userService.getUserPreferences(k.replace('userPrefs_', ''));
    }
    
    return null;
  }

  /**
   * Calcule la taille approximative de localStorage en octets
   */
  private getLocalStorageSize(): number {
    let size = 0;
    
    for (const key in this.persistentCache) {
      if (key.startsWith(this.config.namespaces.default)) {
        size += (key.length + (this.persistentCache.getItem(key) || '').length) * 2; // Approximation de la taille en octets
      }
    }
    
    return size;
  }

  /**
   * Extrait la priorité d'une clé
   * @param key Clé à analyser
   */
  private extractPriority(key: string): 'high' | 'medium' | 'low' {
    for (const [type, strategy] of Object.entries(this.strategies)) {
      if (key.includes(type)) {
        return strategy.priority;
      }
    }
    
    return 'low';
  }

  /**
   * Enregistre une métrique de cache
   * @param type Type de métrique (hit, miss, set)
   * @param storage Type de stockage
   * @param key Clé concernée
   */
  private recordMetric(type: 'hit' | 'miss' | 'set', storage: string, key: string): void {
    // Cette méthode pourrait être implémentée pour enregistrer des métriques de performance
    // Utile pour le monitoring et l'optimisation du cache
  }

  /**
   * Fusionne deux objets de configuration
   * @param defaultConfig Configuration par défaut
   * @param customConfig Configuration personnalisée
   */
  private mergeConfigs(defaultConfig: any, customConfig: any): any {
    const result = { ...defaultConfig };
    
    for (const key in customConfig) {
      if (typeof customConfig[key] === 'object' && !Array.isArray(customConfig[key])) {
        result[key] = this.mergeConfigs(defaultConfig[key] || {}, customConfig[key]);
      } else {
        result[key] = customConfig[key];
      }
    }
    
    return result;
  }
}

// Export d'une instance singleton pour utilisation globale
export const unifiedCacheManager = new UnifiedCacheManager();
