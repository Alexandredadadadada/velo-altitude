/**
 * Gestionnaire de données offline pour Velo-Altitude
 * Implémente un système de stockage hiérarchique avec IndexedDB et localStorage
 */

class OfflineDataManager {
  constructor() {
    this.dbName = 'velo-altitude-offline';
    this.dbVersion = 1;
    this.db = null;
    this.stores = {
      cols: 'offline-cols',
      routes: 'offline-routes',
      activities: 'offline-activities',
      userProfile: 'offline-user-profile',
      pendingActions: 'pending-actions'
    };
    
    // Initialiser la base de données
    this._initDatabase();
  }

  /**
   * Initialise la base de données IndexedDB
   * @private
   */
  async _initDatabase() {
    if (!window.indexedDB) {
      console.error('IndexedDB n\'est pas supporté par ce navigateur');
      return;
    }

    try {
      const request = window.indexedDB.open(this.dbName, this.dbVersion);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Créer les object stores s'ils n'existent pas
        if (!db.objectStoreNames.contains(this.stores.cols)) {
          db.createObjectStore(this.stores.cols, { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains(this.stores.routes)) {
          db.createObjectStore(this.stores.routes, { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains(this.stores.activities)) {
          db.createObjectStore(this.stores.activities, { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains(this.stores.userProfile)) {
          db.createObjectStore(this.stores.userProfile, { keyPath: 'userId' });
        }
        
        if (!db.objectStoreNames.contains(this.stores.pendingActions)) {
          const store = db.createObjectStore(this.stores.pendingActions, { keyPath: 'id', autoIncrement: true });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('type', 'type', { unique: false });
        }
      };
      
      request.onsuccess = (event) => {
        this.db = event.target.result;
        console.log('[OfflineDataManager] Database initialized');
      };
      
      request.onerror = (event) => {
        console.error('[OfflineDataManager] Database error:', event.target.error);
      };
    } catch (error) {
      console.error('[OfflineDataManager] Error initializing database:', error);
    }
  }

  /**
   * Récupère des données depuis IndexedDB
   * @param {string} storeName - Nom du store
   * @param {string|number} key - Clé de l'élément
   * @returns {Promise<Object|null>} Données ou null si non trouvé
   */
  async getData(storeName, key) {
    if (!this.db) {
      await this._waitForDb();
    }
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);
        
        request.onsuccess = () => {
          resolve(request.result || null);
        };
        
        request.onerror = (event) => {
          console.error(`[OfflineDataManager] Error getting data from ${storeName}:`, event.target.error);
          reject(event.target.error);
        };
      } catch (error) {
        console.error(`[OfflineDataManager] Error accessing store ${storeName}:`, error);
        reject(error);
      }
    });
  }

  /**
   * Stocke des données dans IndexedDB
   * @param {string} storeName - Nom du store
   * @param {Object} data - Données à stocker
   * @returns {Promise<boolean>} Succès ou échec
   */
  async setData(storeName, data) {
    if (!this.db) {
      await this._waitForDb();
    }
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(data);
        
        request.onsuccess = () => {
          resolve(true);
        };
        
        request.onerror = (event) => {
          console.error(`[OfflineDataManager] Error storing data in ${storeName}:`, event.target.error);
          reject(event.target.error);
        };
      } catch (error) {
        console.error(`[OfflineDataManager] Error accessing store ${storeName}:`, error);
        reject(error);
      }
    });
  }

  /**
   * Supprime des données d'IndexedDB
   * @param {string} storeName - Nom du store
   * @param {string|number} key - Clé de l'élément à supprimer
   * @returns {Promise<boolean>} Succès ou échec
   */
  async deleteData(storeName, key) {
    if (!this.db) {
      await this._waitForDb();
    }
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(key);
        
        request.onsuccess = () => {
          resolve(true);
        };
        
        request.onerror = (event) => {
          console.error(`[OfflineDataManager] Error deleting data from ${storeName}:`, event.target.error);
          reject(event.target.error);
        };
      } catch (error) {
        console.error(`[OfflineDataManager] Error accessing store ${storeName}:`, error);
        reject(error);
      }
    });
  }

  /**
   * Récupère toutes les données d'un store
   * @param {string} storeName - Nom du store
   * @returns {Promise<Array>} Tableau des données
   */
  async getAllData(storeName) {
    if (!this.db) {
      await this._waitForDb();
    }
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        
        request.onsuccess = () => {
          resolve(request.result || []);
        };
        
        request.onerror = (event) => {
          console.error(`[OfflineDataManager] Error getting all data from ${storeName}:`, event.target.error);
          reject(event.target.error);
        };
      } catch (error) {
        console.error(`[OfflineDataManager] Error accessing store ${storeName}:`, error);
        reject(error);
      }
    });
  }

  /**
   * Enregistre une action en attente pour la synchronisation
   * @param {Object} action - Action à enregistrer
   * @returns {Promise<number>} ID de l'action
   */
  async storePendingAction(action) {
    if (!this.db) {
      await this._waitForDb();
    }
    
    const actionWithTimestamp = {
      ...action,
      timestamp: Date.now(),
      synced: false
    };
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction(this.stores.pendingActions, 'readwrite');
        const store = transaction.objectStore(this.stores.pendingActions);
        const request = store.add(actionWithTimestamp);
        
        request.onsuccess = () => {
          // Demander une synchronisation background si possible
          if ('serviceWorker' in navigator && 'SyncManager' in window) {
            navigator.serviceWorker.ready
              .then(registration => registration.sync.register('sync-user-data'))
              .catch(err => console.error('Erreur d\'enregistrement de la synchronisation:', err));
          }
          
          resolve(request.result);
        };
        
        request.onerror = (event) => {
          console.error('[OfflineDataManager] Error storing pending action:', event.target.error);
          reject(event.target.error);
        };
      } catch (error) {
        console.error('[OfflineDataManager] Error accessing pending actions store:', error);
        reject(error);
      }
    });
  }

  /**
   * Synchronise toutes les actions en attente
   * @returns {Promise<Array>} Résultats des synchronisations
   */
  async syncPendingActions() {
    if (!navigator.onLine) {
      return { success: false, message: 'Hors ligne' };
    }
    
    const pendingActions = await this.getAllData(this.stores.pendingActions);
    
    if (pendingActions.length === 0) {
      return { success: true, message: 'Aucune action en attente' };
    }
    
    const results = [];
    
    for (const action of pendingActions) {
      try {
        // Effectuer l'action selon son type
        if (action.type === 'activity') {
          // Sync des activités
          const result = await fetch('/api/activities', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: JSON.stringify(action.data)
          });
          
          if (result.ok) {
            await this.deleteData(this.stores.pendingActions, action.id);
            results.push({ id: action.id, success: true });
          } else {
            results.push({ id: action.id, success: false, error: await result.text() });
          }
        } else if (action.type === 'profile') {
          // Sync du profil
          const result = await fetch('/api/user/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: JSON.stringify(action.data)
          });
          
          if (result.ok) {
            await this.deleteData(this.stores.pendingActions, action.id);
            results.push({ id: action.id, success: true });
          } else {
            results.push({ id: action.id, success: false, error: await result.text() });
          }
        }
      } catch (error) {
        console.error(`[OfflineDataManager] Error syncing action ${action.id}:`, error);
        results.push({ id: action.id, success: false, error: error.message });
      }
    }
    
    return {
      success: results.every(r => r.success),
      results
    };
  }

  /**
   * Attend l'initialisation de la base de données
   * @private
   */
  async _waitForDb() {
    let attempts = 0;
    while (!this.db && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (!this.db) {
      throw new Error('Database initialization timeout');
    }
  }

  /**
   * Vérifie si IndexedDB est supporté
   * @returns {boolean} true si supporté
   */
  static isSupported() {
    return !!window.indexedDB;
  }
}

// Exporter une instance singleton
const offlineDataManager = new OfflineDataManager();
export default offlineDataManager;
