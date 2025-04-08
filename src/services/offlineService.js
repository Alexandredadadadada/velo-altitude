/**
 * Service de gestion des données hors ligne
 * Implémente le stockage local, la synchronisation et la gestion du mode hors ligne
 */

// Configuration du stockage hors ligne
const offlineConfig = {
  storage: 'indexedDB',
  tables: ['cols', 'routes', 'user-data'],
  sync: {
    interval: 5000,
    retryAttempts: 3
  }
};

class OfflineService {
  constructor() {
    this.db = null;
    this.isOnline = navigator.onLine;
    this.pendingSync = false;
    this.syncInterval = null;
    
    // Écouter les changements de connectivité
    window.addEventListener('online', this.handleOnlineStatusChange.bind(this));
    window.addEventListener('offline', this.handleOnlineStatusChange.bind(this));
    
    // Initialiser la base de données
    this.initDatabase();
  }
  
  /**
   * Initialiser la base de données IndexedDB
   */
  async initDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('velo-altitude-offline', 1);
      
      request.onerror = event => {
        console.error('Erreur lors de l\'ouverture de la base de données:', event.target.error);
        reject(event.target.error);
      };
      
      request.onsuccess = event => {
        this.db = event.target.result;
        console.log('Base de données IndexedDB ouverte avec succès');
        
        // Démarrer la synchronisation périodique
        this.startSyncInterval();
        
        resolve(this.db);
      };
      
      request.onupgradeneeded = event => {
        const db = event.target.result;
        
        // Créer les object stores pour chaque table
        offlineConfig.tables.forEach(table => {
          if (!db.objectStoreNames.contains(table)) {
            db.createObjectStore(table, { keyPath: 'id' });
            console.log(`Object store '${table}' créé`);
          }
        });
        
        // Créer un object store pour les opérations en attente
        if (!db.objectStoreNames.contains('pendingOperations')) {
          db.createObjectStore('pendingOperations', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          console.log('Object store \'pendingOperations\' créé');
        }
      };
    });
  }
  
  /**
   * Gérer les changements de statut de connexion
   */
  handleOnlineStatusChange() {
    const wasOnline = this.isOnline;
    this.isOnline = navigator.onLine;
    
    console.log(`Statut de connexion: ${this.isOnline ? 'En ligne' : 'Hors ligne'}`);
    
    // Mettre à jour l'interface utilisateur
    document.body.classList.toggle('offline-mode', !this.isOnline);
    
    // Si on vient de passer en ligne, synchroniser les données
    if (!wasOnline && this.isOnline) {
      this.syncPendingOperations();
    }
    
    // Déclencher un événement personnalisé
    const event = new CustomEvent('connectivityChange', { 
      detail: { isOnline: this.isOnline } 
    });
    window.dispatchEvent(event);
  }
  
  /**
   * Démarrer l'intervalle de synchronisation
   */
  startSyncInterval() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.pendingSync) {
        this.syncPendingOperations();
      }
    }, offlineConfig.sync.interval);
  }
  
  /**
   * Synchroniser les opérations en attente
   */
  async syncPendingOperations() {
    if (!this.isOnline || this.pendingSync || !this.db) {
      return;
    }
    
    this.pendingSync = true;
    
    try {
      const transaction = this.db.transaction(['pendingOperations'], 'readwrite');
      const store = transaction.objectStore('pendingOperations');
      const pendingOps = await this.getAllFromStore(store);
      
      if (pendingOps.length === 0) {
        this.pendingSync = false;
        return;
      }
      
      console.log(`Synchronisation de ${pendingOps.length} opérations en attente`);
      
      // Traiter chaque opération en attente
      for (const op of pendingOps) {
        try {
          await this.processPendingOperation(op);
          
          // Supprimer l'opération traitée
          const deleteTransaction = this.db.transaction(['pendingOperations'], 'readwrite');
          const deleteStore = deleteTransaction.objectStore('pendingOperations');
          deleteStore.delete(op.id);
          
        } catch (error) {
          console.error(`Erreur lors de la synchronisation de l'opération ${op.id}:`, error);
          
          // Incrémenter le compteur de tentatives
          op.attempts = (op.attempts || 0) + 1;
          
          // Si le nombre maximal de tentatives est atteint, marquer comme échoué
          if (op.attempts >= offlineConfig.sync.retryAttempts) {
            op.failed = true;
            op.failureReason = error.message;
          }
          
          // Mettre à jour l'opération
          const updateTransaction = this.db.transaction(['pendingOperations'], 'readwrite');
          const updateStore = updateTransaction.objectStore('pendingOperations');
          updateStore.put(op);
        }
      }
      
      // Mettre à jour l'heure de la dernière synchronisation
      localStorage.setItem('lastSyncTime', Date.now().toString());
      
      // Déclencher un événement de synchronisation
      window.dispatchEvent(new CustomEvent('offlineSync', { 
        detail: { success: true } 
      }));
      
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      
      window.dispatchEvent(new CustomEvent('offlineSync', { 
        detail: { success: false, error: error.message } 
      }));
    } finally {
      this.pendingSync = false;
    }
  }
  
  /**
   * Traiter une opération en attente
   */
  async processPendingOperation(operation) {
    const { type, url, method, data, table, id } = operation;
    
    if (type === 'api') {
      // Effectuer la requête API
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: data ? JSON.stringify(data) : undefined
      });
      
      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Si c'est une opération de création ou de mise à jour, mettre à jour le cache local
      if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
        await this.saveToStore(table, result);
      }
      // Si c'est une opération de suppression, supprimer du cache local
      else if (method === 'DELETE') {
        await this.removeFromStore(table, id);
      }
      
      return result;
    }
    
    throw new Error(`Type d'opération non pris en charge: ${type}`);
  }
  
  /**
   * Récupérer tous les éléments d'un store
   */
  getAllFromStore(store) {
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      
      request.onsuccess = event => {
        resolve(event.target.result);
      };
      
      request.onerror = event => {
        reject(event.target.error);
      };
    });
  }
  
  /**
   * Enregistrer une opération en attente
   */
  async saveOperation(operation) {
    if (!this.db) {
      await this.initDatabase();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['pendingOperations'], 'readwrite');
      const store = transaction.objectStore('pendingOperations');
      
      const request = store.add({
        ...operation,
        timestamp: Date.now(),
        attempts: 0
      });
      
      request.onsuccess = event => {
        resolve(event.target.result);
      };
      
      request.onerror = event => {
        reject(event.target.error);
      };
    });
  }
  
  /**
   * Effectuer une requête API avec gestion du mode hors ligne
   */
  async apiRequest(url, method = 'GET', data = null, options = {}) {
    const { table, id, bypassCache = false } = options;
    
    // Si en ligne, effectuer la requête normalement
    if (this.isOnline && !bypassCache) {
      try {
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: data ? JSON.stringify(data) : undefined
        });
        
        if (!response.ok) {
          throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        
        // Mettre en cache le résultat si une table est spécifiée
        if (table && (method === 'GET')) {
          await this.saveToStore(table, result);
        }
        
        return result;
      } catch (error) {
        // Si la requête échoue et qu'une table est spécifiée, essayer de récupérer depuis le cache
        if (table && method === 'GET') {
          console.warn(`Erreur API, utilisation du cache pour ${url}:`, error);
          return this.getFromStore(table, id);
        }
        
        throw error;
      }
    }
    
    // Si hors ligne ou bypassCache est vrai
    if (method === 'GET' && table) {
      // Pour les requêtes GET, récupérer depuis le cache
      return this.getFromStore(table, id);
    } else {
      // Pour les autres méthodes, enregistrer l'opération pour synchronisation ultérieure
      const operationId = await this.saveOperation({
        type: 'api',
        url,
        method,
        data,
        table,
        id
      });
      
      return {
        id: operationId,
        pending: true,
        message: 'Opération enregistrée pour synchronisation ultérieure'
      };
    }
  }
  
  /**
   * Enregistrer des données dans un store
   */
  async saveToStore(table, data) {
    if (!this.db) {
      await this.initDatabase();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([table], 'readwrite');
      const store = transaction.objectStore(table);
      
      // Gérer les tableaux de données
      if (Array.isArray(data)) {
        let completed = 0;
        let failed = false;
        
        data.forEach(item => {
          const request = store.put(item);
          
          request.onsuccess = () => {
            completed++;
            if (completed === data.length && !failed) {
              resolve(data);
            }
          };
          
          request.onerror = event => {
            if (!failed) {
              failed = true;
              reject(event.target.error);
            }
          };
        });
      } else {
        // Gérer un seul élément
        const request = store.put(data);
        
        request.onsuccess = () => {
          resolve(data);
        };
        
        request.onerror = event => {
          reject(event.target.error);
        };
      }
    });
  }
  
  /**
   * Récupérer des données depuis un store
   */
  async getFromStore(table, id) {
    if (!this.db) {
      await this.initDatabase();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([table], 'readonly');
      const store = transaction.objectStore(table);
      
      if (id) {
        // Récupérer un élément spécifique
        const request = store.get(id);
        
        request.onsuccess = event => {
          resolve(event.target.result);
        };
        
        request.onerror = event => {
          reject(event.target.error);
        };
      } else {
        // Récupérer tous les éléments
        const request = store.getAll();
        
        request.onsuccess = event => {
          resolve(event.target.result);
        };
        
        request.onerror = event => {
          reject(event.target.error);
        };
      }
    });
  }
  
  /**
   * Supprimer des données d'un store
   */
  async removeFromStore(table, id) {
    if (!this.db) {
      await this.initDatabase();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([table], 'readwrite');
      const store = transaction.objectStore(table);
      
      const request = store.delete(id);
      
      request.onsuccess = () => {
        resolve(true);
      };
      
      request.onerror = event => {
        reject(event.target.error);
      };
    });
  }
  
  /**
   * Vérifier si des données sont disponibles hors ligne
   */
  async isDataAvailableOffline(table, id) {
    if (!this.db) {
      await this.initDatabase();
    }
    
    return new Promise((resolve) => {
      const transaction = this.db.transaction([table], 'readonly');
      const store = transaction.objectStore(table);
      
      if (id) {
        // Vérifier un élément spécifique
        const request = store.count(id);
        
        request.onsuccess = event => {
          resolve(event.target.result > 0);
        };
        
        request.onerror = () => {
          resolve(false);
        };
      } else {
        // Vérifier si le store contient des données
        const request = store.count();
        
        request.onsuccess = event => {
          resolve(event.target.result > 0);
        };
        
        request.onerror = () => {
          resolve(false);
        };
      }
    });
  }
  
  /**
   * Effacer toutes les données en cache
   */
  async clearCache() {
    if (!this.db) {
      await this.initDatabase();
    }
    
    const promises = offlineConfig.tables.map(table => {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([table], 'readwrite');
        const store = transaction.objectStore(table);
        const request = store.clear();
        
        request.onsuccess = () => {
          resolve();
        };
        
        request.onerror = event => {
          reject(event.target.error);
        };
      });
    });
    
    return Promise.all(promises);
  }
  
  /**
   * Obtenir le statut de la connexion
   */
  getConnectionStatus() {
    return {
      isOnline: this.isOnline,
      lastSync: localStorage.getItem('lastSyncTime') 
        ? new Date(parseInt(localStorage.getItem('lastSyncTime'))) 
        : null
    };
  }
}

// Exporter une instance singleton
const offlineService = new OfflineService();
export default offlineService;
