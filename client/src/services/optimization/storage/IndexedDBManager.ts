/**
 * Gestionnaire pour le stockage IndexedDB
 * Fournit une interface simplifiée pour utiliser IndexedDB avec des promesses
 */
export class IndexedDBManager {
  private dbName: string;
  private storeName: string = 'cache';
  private dbVersion: number = 1;
  private db: IDBDatabase | null = null;
  private dbPromise: Promise<IDBDatabase> | null = null;
  private ready: boolean = false;

  /**
   * Crée une nouvelle instance du gestionnaire IndexedDB
   * @param dbName Nom de la base de données
   * @param storeName Nom du store (optionnel, par défaut: 'cache')
   * @param dbVersion Version de la base de données (optionnel, par défaut: 1)
   */
  constructor(dbName: string, storeName: string = 'cache', dbVersion: number = 1) {
    this.dbName = dbName;
    this.storeName = storeName;
    this.dbVersion = dbVersion;
    this.init();
  }

  /**
   * Initialise la connexion à la base de données
   */
  private init(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error('IndexedDB not supported by this browser'));
        return;
      }

      const request = window.indexedDB.open(this.dbName, this.dbVersion);

      // Mise à jour ou création de la structure de la base de données
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Créer le store d'objets s'il n'existe pas
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'key' });
        }
      };

      // Succès de l'ouverture
      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        this.ready = true;
        resolve(this.db);
      };

      // Échec de l'ouverture
      request.onerror = (event) => {
        console.error('[IndexedDBManager] Error opening database:', (event.target as IDBOpenDBRequest).error);
        reject((event.target as IDBOpenDBRequest).error);
      };
    });

    return this.dbPromise;
  }

  /**
   * Récupère une valeur de la base de données
   * @param key Clé à récupérer
   * @returns Valeur associée à la clé ou null
   */
  public async get<T>(key: string): Promise<T | null> {
    try {
      const db = await this.init();
      
      return new Promise<T | null>((resolve, reject) => {
        const transaction = db.transaction(this.storeName, 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get(key);

        request.onsuccess = () => {
          const result = request.result;
          resolve(result ? result.value : null);
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch (error) {
      console.error(`[IndexedDBManager] Error getting ${key}:`, error);
      return null;
    }
  }

  /**
   * Stocke une valeur dans la base de données
   * @param key Clé à utiliser
   * @param value Valeur à stocker
   * @returns Promesse résolue quand le stockage est terminé
   */
  public async set(key: string, value: any): Promise<void> {
    try {
      const db = await this.init();

      return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(this.storeName, 'readwrite');
        const store = transaction.objectStore(this.storeName);
        
        // Préparer l'objet à stocker
        const item = {
          key,
          value,
          timestamp: Date.now()
        };
        
        // Effectuer l'opération de stockage
        const request = store.put(item);

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch (error) {
      console.error(`[IndexedDBManager] Error setting ${key}:`, error);
      throw error;
    }
  }

  /**
   * Supprime une valeur de la base de données
   * @param key Clé à supprimer
   * @returns Promesse résolue quand la suppression est terminée
   */
  public async delete(key: string): Promise<void> {
    try {
      const db = await this.init();

      return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(this.storeName, 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(key);

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch (error) {
      console.error(`[IndexedDBManager] Error deleting ${key}:`, error);
      throw error;
    }
  }

  /**
   * Vide la base de données
   * @returns Promesse résolue quand la suppression est terminée
   */
  public async clear(): Promise<void> {
    try {
      const db = await this.init();

      return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(this.storeName, 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.clear();

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('[IndexedDBManager] Error clearing database:', error);
      throw error;
    }
  }

  /**
   * Supprime toutes les entrées d'un namespace spécifique
   * @param namespace Préfixe de namespace
   * @returns Nombre d'entrées supprimées
   */
  public async clearNamespace(namespace: string): Promise<number> {
    try {
      const keys = await this.getKeysStartingWith(namespace);
      let count = 0;

      for (const key of keys) {
        await this.delete(key);
        count++;
      }

      return count;
    } catch (error) {
      console.error(`[IndexedDBManager] Error clearing namespace ${namespace}:`, error);
      throw error;
    }
  }

  /**
   * Récupère toutes les clés commençant par un préfixe donné
   * @param prefix Préfixe à rechercher
   * @returns Liste des clés correspondantes
   */
  public async getKeysStartingWith(prefix: string): Promise<string[]> {
    try {
      const db = await this.init();

      return new Promise<string[]>((resolve, reject) => {
        const transaction = db.transaction(this.storeName, 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.openCursor();
        const keys: string[] = [];

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
          
          if (cursor) {
            const key = cursor.value.key;
            
            if (typeof key === 'string' && key.startsWith(prefix)) {
              keys.push(key);
            }
            
            cursor.continue();
          } else {
            resolve(keys);
          }
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch (error) {
      console.error(`[IndexedDBManager] Error getting keys with prefix ${prefix}:`, error);
      return [];
    }
  }

  /**
   * Récupère toutes les entrées commençant par un préfixe donné
   * @param prefix Préfixe à rechercher
   * @returns Liste des entrées correspondantes
   */
  public async getEntriesStartingWith<T>(prefix: string): Promise<Array<{ key: string; value: T; timestamp: number }>> {
    try {
      const db = await this.init();

      return new Promise<Array<{ key: string; value: T; timestamp: number }>>((resolve, reject) => {
        const transaction = db.transaction(this.storeName, 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.openCursor();
        const entries: Array<{ key: string; value: T; timestamp: number }> = [];

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
          
          if (cursor) {
            const item = cursor.value;
            
            if (typeof item.key === 'string' && item.key.startsWith(prefix)) {
              entries.push({
                key: item.key,
                value: item.value,
                timestamp: item.timestamp
              });
            }
            
            cursor.continue();
          } else {
            resolve(entries);
          }
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch (error) {
      console.error(`[IndexedDBManager] Error getting entries with prefix ${prefix}:`, error);
      return [];
    }
  }

  /**
   * Nettoie les entrées expirées
   * @param now Timestamp actuel
   * @returns Nombre d'entrées supprimées
   */
  public async cleanExpired(now: number): Promise<number> {
    try {
      const db = await this.init();
      
      return new Promise<number>((resolve, reject) => {
        const transaction = db.transaction(this.storeName, 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.openCursor();
        let count = 0;

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
          
          if (cursor) {
            const item = cursor.value;
            
            if (item.value && item.value.expiry && item.value.expiry < now) {
              const deleteRequest = cursor.delete();
              
              deleteRequest.onsuccess = () => {
                count++;
              };
            }
            
            cursor.continue();
          } else {
            resolve(count);
          }
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('[IndexedDBManager] Error cleaning expired entries:', error);
      return 0;
    }
  }

  /**
   * Réduit la taille de la base de données à une capacité cible
   * @param targetSize Taille cible en octets
   * @returns Nombre d'entrées supprimées
   */
  public async prune(targetSize: number): Promise<number> {
    try {
      const entries = await this.getAllEntriesSortedByTimestamp();
      let currentSize = await this.getSize();
      let pruned = 0;

      // Trier par timestamp (plus ancien en premier)
      for (const entry of entries) {
        if (currentSize <= targetSize) {
          break;
        }

        // Estimer la taille de cette entrée
        const entrySize = this.estimateEntrySize(entry);
        
        // Supprimer l'entrée
        await this.delete(entry.key);
        
        // Mettre à jour la taille et le compteur
        currentSize -= entrySize;
        pruned++;
      }

      return pruned;
    } catch (error) {
      console.error(`[IndexedDBManager] Error pruning database:`, error);
      return 0;
    }
  }

  /**
   * Récupère toutes les entrées triées par timestamp
   * @returns Entrées triées du plus ancien au plus récent
   */
  private async getAllEntriesSortedByTimestamp(): Promise<Array<{ key: string; value: any; timestamp: number }>> {
    try {
      const db = await this.init();

      return new Promise<Array<{ key: string; value: any; timestamp: number }>>((resolve, reject) => {
        const transaction = db.transaction(this.storeName, 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.getAll();

        request.onsuccess = () => {
          const entries = request.result;
          
          // Trier par timestamp (plus ancien en premier)
          entries.sort((a, b) => a.timestamp - b.timestamp);
          
          resolve(entries);
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('[IndexedDBManager] Error getting all entries:', error);
      return [];
    }
  }

  /**
   * Estime la taille d'une entrée en octets
   * @param entry Entrée à mesurer
   * @returns Taille estimée en octets
   */
  private estimateEntrySize(entry: { key: string; value: any }): number {
    // Estimation simplifiée de la taille
    // Dans une implémentation réelle, on pourrait utiliser une méthode plus précise
    let size = 0;
    
    // Taille de la clé
    size += entry.key.length * 2; // Approximation pour les caractères Unicode
    
    // Taille de la valeur (approximation)
    const valueString = JSON.stringify(entry.value);
    size += valueString.length * 2;
    
    return size;
  }

  /**
   * Récupère la taille approximative de la base de données
   * @returns Taille en octets
   */
  public async getSize(): Promise<number> {
    try {
      const entries = await this.getAllEntriesSortedByTimestamp();
      let size = 0;

      for (const entry of entries) {
        size += this.estimateEntrySize(entry);
      }

      return size;
    } catch (error) {
      console.error('[IndexedDBManager] Error getting database size:', error);
      return 0;
    }
  }

  /**
   * Récupère les statistiques de la base de données
   * @returns Statistiques
   */
  public async getStats(): Promise<{ count: number; size: number; oldest: number; newest: number }> {
    try {
      const entries = await this.getAllEntriesSortedByTimestamp();
      
      const stats = {
        count: entries.length,
        size: 0,
        oldest: entries.length > 0 ? entries[0].timestamp : 0,
        newest: entries.length > 0 ? entries[entries.length - 1].timestamp : 0
      };

      // Calculer la taille totale
      for (const entry of entries) {
        stats.size += this.estimateEntrySize(entry);
      }

      return stats;
    } catch (error) {
      console.error('[IndexedDBManager] Error getting database stats:', error);
      return { count: 0, size: 0, oldest: 0, newest: 0 };
    }
  }

  /**
   * Ferme la connexion à la base de données
   */
  public close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.dbPromise = null;
      this.ready = false;
    }
  }

  /**
   * Vérifie si la base de données est disponible
   * @returns true si disponible
   */
  public isReady(): boolean {
    return this.ready;
  }

  /**
   * Attend que la base de données soit prête
   * @param timeout Délai d'attente en ms (par défaut: 5000)
   */
  public async waitForReady(timeout: number = 5000): Promise<boolean> {
    if (this.ready) {
      return true;
    }

    return new Promise<boolean>(resolve => {
      const startTime = Date.now();
      
      const checkReady = () => {
        if (this.ready) {
          resolve(true);
          return;
        }

        if (Date.now() - startTime > timeout) {
          resolve(false);
          return;
        }

        setTimeout(checkReady, 100);
      };

      checkReady();
    });
  }
}
