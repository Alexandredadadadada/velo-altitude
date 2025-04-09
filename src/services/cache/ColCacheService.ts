/**
 * Service de cache avancé pour les données des cols
 * Implémente des stratégies de mise en cache intelligentes et adaptatives
 */

import { CacheConfig } from '../cols/types/ColTypes';

/**
 * Interface d'entrée de cache
 */
interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  priority: number;
}

/**
 * Interface pour les options de cache
 */
export interface CacheOptions {
  maxSize?: number;           // Taille maximale du cache (nombre d'éléments)
  defaultTTL?: number;        // Durée de vie par défaut (ms)
  storageType?: 'memory' | 'localStorage' | 'indexedDB'; // Type de stockage
  persistBetweenSessions?: boolean; // Conserver les données entre les sessions
  compressionEnabled?: boolean; // Activer la compression des données
  prefetchEnabled?: boolean;  // Activer le préchargement prédictif
  debug?: boolean;            // Mode debug
}

/**
 * Configuration pour les types de données spécifiques
 */
export interface TypeSpecificConfig {
  ttl: number;               // Durée de vie (ms)
  priority: number;          // Priorité (1-10, 10 étant la plus élevée)
  refreshStrategy: 'eager' | 'lazy' | 'none'; // Stratégie de rafraîchissement
}

/**
 * Service de cache avancé pour les données des cols
 */
export class ColCacheService {
  private cache: Map<string, CacheEntry> = new Map();
  private storage: Storage | null = null;
  private db: IDBDatabase | null = null;
  private readonly DEFAULT_OPTIONS: Required<CacheOptions> = {
    maxSize: 500,
    defaultTTL: 30 * 60 * 1000, // 30 minutes
    storageType: 'memory',
    persistBetweenSessions: false,
    compressionEnabled: false,
    prefetchEnabled: false,
    debug: false
  };
  private options: Required<CacheOptions>;
  
  // Configuration par type de données
  private readonly CACHE_CONFIG: Record<string, TypeSpecificConfig> = {
    'col': { 
      ttl: 24 * 60 * 60 * 1000,  // 24h 
      priority: 8,
      refreshStrategy: 'lazy'
    },
    'elevation': { 
      ttl: 7 * 24 * 60 * 60 * 1000,  // 7 jours
      priority: 7,
      refreshStrategy: 'none'
    },
    'weather': { 
      ttl: 30 * 60 * 1000,  // 30 minutes
      priority: 10,
      refreshStrategy: 'eager'
    },
    'terrain3d': { 
      ttl: 30 * 24 * 60 * 60 * 1000,  // 30 jours
      priority: 6,
      refreshStrategy: 'none'
    },
    'search': { 
      ttl: 10 * 60 * 1000,  // 10 minutes
      priority: 5,
      refreshStrategy: 'lazy'
    },
    'pois': { 
      ttl: 24 * 60 * 60 * 1000,  // 24h
      priority: 7,
      refreshStrategy: 'lazy'
    },
    'route': { 
      ttl: 7 * 24 * 60 * 60 * 1000,  // 7 jours
      priority: 7,
      refreshStrategy: 'none'
    },
    'panoramas': { 
      ttl: 7 * 24 * 60 * 60 * 1000,  // 7 jours
      priority: 6,
      refreshStrategy: 'none'
    },
    'default': { 
      ttl: 30 * 60 * 1000,  // 30 minutes
      priority: 5,
      refreshStrategy: 'lazy'
    }
  };

  /**
   * Constructeur
   * @param options Options de configuration du cache
   */
  constructor(options?: Partial<CacheOptions>) {
    this.options = { ...this.DEFAULT_OPTIONS, ...options };
    this.initializeStorage();
    if (this.options.persistBetweenSessions) {
      this.loadFromPersistentStorage();
    }
    
    // Maintenance périodique
    setInterval(() => this.performMaintenance(), 5 * 60 * 1000); // Toutes les 5 minutes
  }

  /**
   * Initialise le stockage selon les options
   */
  private async initializeStorage(): Promise<void> {
    switch (this.options.storageType) {
      case 'localStorage':
        try {
          this.storage = window.localStorage;
          this.log('Stockage initialisé avec localStorage');
        } catch (error) {
          console.error('Erreur lors de l\'initialisation de localStorage:', error);
          this.options.storageType = 'memory';
        }
        break;
        
      case 'indexedDB':
        try {
          await this.initializeIndexedDB();
          this.log('Stockage initialisé avec IndexedDB');
        } catch (error) {
          console.error('Erreur lors de l\'initialisation d\'IndexedDB:', error);
          this.options.storageType = 'memory';
        }
        break;
        
      case 'memory':
      default:
        this.storage = null;
        this.log('Stockage initialisé en mémoire');
        break;
    }
  }

  /**
   * Initialise IndexedDB
   */
  private initializeIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('ColCache', 1);
      
      request.onerror = () => reject(new Error('Impossible d\'ouvrir IndexedDB'));
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' });
        }
      };
      
      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };
    });
  }

  /**
   * Charge les données depuis le stockage persistant
   */
  private async loadFromPersistentStorage(): Promise<void> {
    if (this.options.storageType === 'localStorage' && this.storage) {
      try {
        const cacheData = this.storage.getItem('colCache');
        if (cacheData) {
          const data = JSON.parse(cacheData);
          for (const [key, entry] of Object.entries(data)) {
            this.cache.set(key, entry as CacheEntry);
          }
        }
        this.log(`Chargé ${this.cache.size} éléments depuis localStorage`);
      } catch (error) {
        console.error('Erreur lors du chargement depuis localStorage:', error);
      }
    } else if (this.options.storageType === 'indexedDB' && this.db) {
      try {
        const transaction = this.db.transaction(['cache'], 'readonly');
        const store = transaction.objectStore('cache');
        const request = store.getAll();
        
        request.onsuccess = () => {
          const items = request.result;
          for (const item of items) {
            this.cache.set(item.key, item.value);
          }
          this.log(`Chargé ${items.length} éléments depuis IndexedDB`);
        };
      } catch (error) {
        console.error('Erreur lors du chargement depuis IndexedDB:', error);
      }
    }
  }

  /**
   * Sauvegarde les données dans le stockage persistant
   */
  private async saveToPersistentStorage(): Promise<void> {
    if (!this.options.persistBetweenSessions) return;
    
    if (this.options.storageType === 'localStorage' && this.storage) {
      try {
        const cacheData: Record<string, CacheEntry> = {};
        for (const [key, entry] of this.cache.entries()) {
          cacheData[key] = entry;
        }
        this.storage.setItem('colCache', JSON.stringify(cacheData));
        this.log(`Sauvegardé ${this.cache.size} éléments dans localStorage`);
      } catch (error) {
        console.error('Erreur lors de la sauvegarde dans localStorage:', error);
      }
    } else if (this.options.storageType === 'indexedDB' && this.db) {
      try {
        const transaction = this.db.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');
        
        // Vider le store
        store.clear();
        
        // Ajouter les données
        for (const [key, entry] of this.cache.entries()) {
          store.add({ key, value: entry });
        }
        
        this.log(`Sauvegardé ${this.cache.size} éléments dans IndexedDB`);
      } catch (error) {
        console.error('Erreur lors de la sauvegarde dans IndexedDB:', error);
      }
    }
  }

  /**
   * Obtient la configuration pour un type de données
   * @param key Clé de cache
   * @returns Configuration spécifique pour ce type
   */
  private getConfigForKey(key: string): TypeSpecificConfig {
    // Extraire le type depuis la clé (format: 'type:id')
    const type = key.split(':')[0];
    return this.CACHE_CONFIG[type] || this.CACHE_CONFIG.default;
  }

  /**
   * Récupère une entrée du cache
   * @param key Clé de l'entrée
   * @returns Données associées, ou null si absente ou expirée
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.log(`Cache miss pour ${key}`);
      return null;
    }
    
    // Vérifier si l'entrée est expirée
    if (this.isExpired(entry)) {
      this.log(`Entrée expirée pour ${key}`);
      this.cache.delete(key);
      return null;
    }
    
    // Mettre à jour les statistiques d'accès
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    
    // Rafraîchissement selon la stratégie
    const config = this.getConfigForKey(key);
    if (config.refreshStrategy === 'eager' && this.isNearExpiry(entry)) {
      this.log(`Déclenchement du rafraîchissement eager pour ${key}`);
      this.triggerRefresh(key);
    }
    
    this.log(`Cache hit pour ${key}`);
    return entry.data as T;
  }

  /**
   * Déclenche un rafraîchissement asynchrone
   * @param key Clé à rafraîchir
   */
  private triggerRefresh(key: string): void {
    // Cette méthode serait normalement implémentée avec un mécanisme
    // pour déclencher un rechargement asynchrone des données
    // via le service associé
    
    this.log(`Rafraîchissement asynchrone déclenché pour ${key}`);
    
    // Exemple de code:
    // const [type, id] = key.split(':');
    // if (type === 'weather') {
    //   weatherService.getColWeather(id)
    //     .then(data => this.set(key, data))
    //     .catch(error => console.error(`Erreur de rafraîchissement pour ${key}:`, error));
    // }
  }

  /**
   * Définit une entrée dans le cache
   * @param key Clé de l'entrée
   * @param data Données à stocker
   * @param ttl Durée de vie spécifique (facultatif)
   */
  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    const config = this.getConfigForKey(key);
    const actualTtl = ttl || config.ttl;
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: actualTtl,
      accessCount: 0,
      lastAccessed: Date.now(),
      priority: config.priority
    };
    
    // Compresser les données si nécessaire
    if (this.options.compressionEnabled) {
      // Ici, on simulerait la compression (non implémentée dans cet exemple)
    }
    
    // Vérifier si le cache a atteint sa taille maximale
    if (this.cache.size >= this.options.maxSize) {
      this.evictEntries();
    }
    
    this.cache.set(key, entry);
    this.log(`Entrée mise en cache pour ${key}, ttl=${actualTtl}ms`);
    
    // Sauvegarder dans le stockage persistant si nécessaire
    if (this.options.persistBetweenSessions) {
      this.saveToPersistentStorage();
    }
  }

  /**
   * Supprime des entrées selon la stratégie d'éviction
   */
  private evictEntries(): void {
    // Stratégie LRU (Least Recently Used) avec prise en compte de la priorité
    const entries = Array.from(this.cache.entries())
      .map(([key, entry]) => ({ key, entry }))
      .sort((a, b) => {
        // D'abord trier par priorité (ascendant)
        if (a.entry.priority !== b.entry.priority) {
          return a.entry.priority - b.entry.priority;
        }
        // Ensuite par date du dernier accès (ascendant)
        return a.entry.lastAccessed - b.entry.lastAccessed;
      });
    
    // Supprimer 20% des entrées
    const entriesToRemove = Math.ceil(this.options.maxSize * 0.2);
    for (let i = 0; i < entriesToRemove && i < entries.length; i++) {
      this.cache.delete(entries[i].key);
    }
    
    this.log(`Éviction de ${entriesToRemove} entrées, taille du cache: ${this.cache.size}`);
  }

  /**
   * Vérifie si une entrée est expirée
   * @param entry Entrée à vérifier
   * @returns true si l'entrée est expirée
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() > entry.timestamp + entry.ttl;
  }

  /**
   * Vérifie si une entrée est proche de l'expiration
   * @param entry Entrée à vérifier
   * @returns true si l'entrée arrive bientôt à expiration
   */
  private isNearExpiry(entry: CacheEntry): boolean {
    // Considère comme "proche de l'expiration" si moins de 20% du TTL reste
    const expiryThreshold = entry.timestamp + (entry.ttl * 0.8);
    return Date.now() > expiryThreshold;
  }

  /**
   * Supprime une entrée du cache
   * @param key Clé de l'entrée à supprimer
   */
  async remove(key: string): Promise<void> {
    const removed = this.cache.delete(key);
    this.log(`Entrée ${key} ${removed ? 'supprimée' : 'non trouvée'}`);
    
    if (removed && this.options.persistBetweenSessions) {
      this.saveToPersistentStorage();
    }
  }

  /**
   * Vide entièrement le cache
   */
  async clear(): Promise<void> {
    const size = this.cache.size;
    this.cache.clear();
    this.log(`Cache vidé, ${size} entrées supprimées`);
    
    if (this.options.persistBetweenSessions) {
      this.saveToPersistentStorage();
    }
  }

  /**
   * Effectue des opérations de maintenance sur le cache
   */
  private performMaintenance(): void {
    let expiredCount = 0;
    
    // Supprimer les entrées expirées
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        expiredCount++;
      }
    }
    
    if (expiredCount > 0) {
      this.log(`Maintenance: ${expiredCount} entrées expirées supprimées`);
      
      if (this.options.persistBetweenSessions) {
        this.saveToPersistentStorage();
      }
    }
  }

  /**
   * Précharge les données pour des clés prédites
   * @param predictions Prédictions de clés qui seront demandées
   */
  async prefetchData(predictions: string[]): Promise<void> {
    if (!this.options.prefetchEnabled) return;
    
    this.log(`Préchargement de ${predictions.length} clés prédites`);
    
    // Cette méthode serait implémentée avec un mécanisme pour charger
    // de manière proactive les données prédites via le service associé
    
    // Exemple de code:
    // for (const key of predictions) {
    //   const [type, id] = key.split(':');
    //   if (type === 'col' && !this.cache.has(key)) {
    //     colService.getColById(id)
    //       .then(data => this.set(key, data))
    //       .catch(error => console.error(`Erreur de préchargement pour ${key}:`, error));
    //   }
    // }
  }

  /**
   * Obtient les statistiques du cache
   * @returns Statistiques d'utilisation du cache
   */
  getStats(): any {
    const stats = {
      size: this.cache.size,
      maxSize: this.options.maxSize,
      byType: {} as Record<string, { count: number, avgAge: number, hitRate: number }>,
      totalHits: 0,
      totalMisses: 0,
      efficiency: 0
    };
    
    // Calculer les statistiques par type
    const typeStats: Record<string, { count: number, totalAge: number, hits: number, misses: number }> = {};
    
    for (const [key, entry] of this.cache.entries()) {
      const type = key.split(':')[0];
      
      if (!typeStats[type]) {
        typeStats[type] = { count: 0, totalAge: 0, hits: 0, misses: 0 };
      }
      
      typeStats[type].count++;
      typeStats[type].totalAge += Date.now() - entry.timestamp;
      typeStats[type].hits += entry.accessCount;
    }
    
    // Calculer les moyennes et ratios
    for (const [type, typeStat] of Object.entries(typeStats)) {
      stats.byType[type] = {
        count: typeStat.count,
        avgAge: typeStat.count > 0 ? Math.round(typeStat.totalAge / typeStat.count) : 0,
        hitRate: (typeStat.hits + typeStat.misses) > 0 
          ? typeStat.hits / (typeStat.hits + typeStat.misses) 
          : 0
      };
      
      stats.totalHits += typeStat.hits;
      stats.totalMisses += typeStat.misses;
    }
    
    // Efficacité globale
    stats.efficiency = (stats.totalHits + stats.totalMisses) > 0
      ? stats.totalHits / (stats.totalHits + stats.totalMisses)
      : 0;
    
    return stats;
  }

  /**
   * Journalise un message de débogage
   * @param message Message à journaliser
   */
  private log(message: string): void {
    if (this.options.debug) {
      console.log(`[ColCacheService] ${message}`);
    }
  }
}

/**
 * Crée une instance configurée du service de cache
 * @param options Options spécifiques
 * @returns Instance du service de cache
 */
export function createColCacheService(options?: Partial<CacheOptions>): ColCacheService {
  return new ColCacheService(options);
}
