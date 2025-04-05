/**
 * WeatherCache.js
 * Système de cache pour les données météo de l'Explorateur de Cols
 * Permet la persistance des données entre les sessions et le mode hors ligne
 */

class WeatherCache {
  constructor(cacheName = 'col-weather-cache', expirationTime = 3600000) {
    this.cacheName = cacheName;
    this.expirationTime = expirationTime; // Temps d'expiration en ms (par défaut: 1h)
    this.storageAvailable = this.isStorageAvailable('localStorage');
    this.indexedDBAvailable = this.isIndexedDBAvailable();
  }

  /**
   * Vérifie si le localStorage est disponible
   * @param {string} type - Type de stockage à vérifier
   * @returns {boolean} - Disponibilité du stockage
   */
  isStorageAvailable(type) {
    try {
      const storage = window[type];
      const testKey = '__storage_test__';
      storage.setItem(testKey, testKey);
      storage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Vérifie si IndexedDB est disponible
   * @returns {boolean} - Disponibilité d'IndexedDB
   */
  isIndexedDBAvailable() {
    return 'indexedDB' in window;
  }

  /**
   * Génère une clé de cache pour une localisation
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @param {string} type - Type de données météo
   * @returns {string} - Clé de cache
   */
  generateCacheKey(lat, lon, type = 'current') {
    return `${this.cacheName}-${type}-${lat.toFixed(4)}-${lon.toFixed(4)}`;
  }

  /**
   * Enregistre les données météo dans le cache
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @param {Object} data - Données météo
   * @param {string} type - Type de données météo
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  async setWeatherData(lat, lon, data, type = 'current') {
    try {
      if (!data) return false;

      const cacheKey = this.generateCacheKey(lat, lon, type);
      const cacheEntry = {
        data,
        timestamp: Date.now(),
        expiration: Date.now() + this.expirationTime
      };

      if (this.storageAvailable) {
        localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
        return true;
      } else if (this.indexedDBAvailable) {
        return await this.setDataInIndexedDB(cacheKey, cacheEntry);
      }
      
      return false;
    } catch (error) {
      console.error('Erreur lors de la mise en cache des données météo:', error);
      return false;
    }
  }

  /**
   * Récupère les données météo depuis le cache
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @param {string} type - Type de données météo
   * @returns {Promise<Object|null>} - Données météo ou null si non trouvées/expirées
   */
  async getWeatherData(lat, lon, type = 'current') {
    try {
      const cacheKey = this.generateCacheKey(lat, lon, type);
      
      let cacheEntry = null;
      
      if (this.storageAvailable) {
        const storedData = localStorage.getItem(cacheKey);
        if (storedData) {
          cacheEntry = JSON.parse(storedData);
        }
      } else if (this.indexedDBAvailable) {
        cacheEntry = await this.getDataFromIndexedDB(cacheKey);
      }
      
      if (cacheEntry) {
        // Vérifier si les données sont expirées
        if (Date.now() < cacheEntry.expiration) {
          return cacheEntry.data;
        } else {
          // Supprimer les données expirées
          this.removeWeatherData(lat, lon, type);
        }
      }
      
      return null;
    } catch (error) {
      console.error('Erreur lors de la récupération des données météo du cache:', error);
      return null;
    }
  }

  /**
   * Supprime les données météo du cache
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @param {string} type - Type de données météo
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  async removeWeatherData(lat, lon, type = 'current') {
    try {
      const cacheKey = this.generateCacheKey(lat, lon, type);
      
      if (this.storageAvailable) {
        localStorage.removeItem(cacheKey);
        return true;
      } else if (this.indexedDBAvailable) {
        return await this.removeDataFromIndexedDB(cacheKey);
      }
      
      return false;
    } catch (error) {
      console.error('Erreur lors de la suppression des données météo du cache:', error);
      return false;
    }
  }

  /**
   * Nettoie toutes les entrées expirées du cache
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  async cleanExpiredCache() {
    try {
      const now = Date.now();
      
      if (this.storageAvailable) {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith(this.cacheName)) {
            try {
              const cacheEntry = JSON.parse(localStorage.getItem(key));
              if (now > cacheEntry.expiration) {
                localStorage.removeItem(key);
              }
            } catch (e) {
              // Ignorer les entrées invalides
              localStorage.removeItem(key);
            }
          }
        });
        return true;
      } else if (this.indexedDBAvailable) {
        return await this.cleanExpiredDataInIndexedDB();
      }
      
      return false;
    } catch (error) {
      console.error('Erreur lors du nettoyage du cache météo:', error);
      return false;
    }
  }

  /**
   * Stocke des données dans IndexedDB
   * @param {string} key - Clé de cache
   * @param {Object} value - Valeur à stocker
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  setDataInIndexedDB(key, value) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.cacheName, 1);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('weatherData')) {
          db.createObjectStore('weatherData', { keyPath: 'key' });
        }
      };
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(['weatherData'], 'readwrite');
        const store = transaction.objectStore('weatherData');
        
        const storeRequest = store.put({ key, value });
        
        storeRequest.onsuccess = () => resolve(true);
        storeRequest.onerror = () => reject(new Error('Erreur lors du stockage dans IndexedDB'));
      };
      
      request.onerror = () => reject(new Error('Erreur lors de l\'ouverture d\'IndexedDB'));
    });
  }

  /**
   * Récupère des données depuis IndexedDB
   * @param {string} key - Clé de cache
   * @returns {Promise<Object|null>} - Données ou null si non trouvées
   */
  getDataFromIndexedDB(key) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.cacheName, 1);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('weatherData')) {
          db.createObjectStore('weatherData', { keyPath: 'key' });
        }
      };
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(['weatherData'], 'readonly');
        const store = transaction.objectStore('weatherData');
        
        const getRequest = store.get(key);
        
        getRequest.onsuccess = () => {
          if (getRequest.result) {
            resolve(getRequest.result.value);
          } else {
            resolve(null);
          }
        };
        
        getRequest.onerror = () => reject(new Error('Erreur lors de la récupération depuis IndexedDB'));
      };
      
      request.onerror = () => reject(new Error('Erreur lors de l\'ouverture d\'IndexedDB'));
    });
  }

  /**
   * Supprime des données d'IndexedDB
   * @param {string} key - Clé de cache
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  removeDataFromIndexedDB(key) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.cacheName, 1);
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(['weatherData'], 'readwrite');
        const store = transaction.objectStore('weatherData');
        
        const deleteRequest = store.delete(key);
        
        deleteRequest.onsuccess = () => resolve(true);
        deleteRequest.onerror = () => reject(new Error('Erreur lors de la suppression depuis IndexedDB'));
      };
      
      request.onerror = () => reject(new Error('Erreur lors de l\'ouverture d\'IndexedDB'));
    });
  }

  /**
   * Nettoie les données expirées dans IndexedDB
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  cleanExpiredDataInIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.cacheName, 1);
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(['weatherData'], 'readwrite');
        const store = transaction.objectStore('weatherData');
        
        const now = Date.now();
        const getAllRequest = store.getAll();
        
        getAllRequest.onsuccess = () => {
          const entries = getAllRequest.result;
          let deleteCount = 0;
          
          entries.forEach(entry => {
            if (now > entry.value.expiration) {
              store.delete(entry.key);
              deleteCount++;
            }
          });
          
          resolve(true);
        };
        
        getAllRequest.onerror = () => reject(new Error('Erreur lors de la récupération des données pour nettoyage'));
      };
      
      request.onerror = () => reject(new Error('Erreur lors de l\'ouverture d\'IndexedDB'));
    });
  }
}

export default WeatherCache;
