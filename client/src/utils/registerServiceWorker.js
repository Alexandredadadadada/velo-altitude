/**
 * Utilitaire pour l'enregistrement et la gestion du Service Worker
 * Dashboard-Velo
 */

export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('Service Worker enregistré avec succès:', registration.scope);
          
          // Configuration des mises à jour du Service Worker
          setupServiceWorkerUpdates(registration);
        })
        .catch(error => {
          console.error('Erreur lors de l\'enregistrement du Service Worker:', error);
        });
    });
  }
};

/**
 * Configure la détection et la gestion des mises à jour du Service Worker
 * @param {ServiceWorkerRegistration} registration - L'enregistrement du Service Worker
 */
const setupServiceWorkerUpdates = (registration) => {
  // Vérifier les mises à jour du Service Worker tous les 60 minutes
  setInterval(() => {
    registration.update();
  }, 60 * 60 * 1000);
  
  // Détecter les nouveaux Service Workers en attente d'activation
  registration.addEventListener('updatefound', () => {
    // Récupérer le nouveau Service Worker
    const newWorker = registration.installing;
    
    // Suivre le changement d'état du nouveau Service Worker
    newWorker.addEventListener('statechange', () => {
      // Une fois que le nouveau Service Worker est installé mais en attente
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        // Notifier l'utilisateur de la mise à jour disponible
        notifyUserOfUpdate();
      }
    });
  });
};

/**
 * Notifie l'utilisateur qu'une mise à jour est disponible
 */
const notifyUserOfUpdate = () => {
  // Dispatch d'un événement personnalisé pour la notification
  window.dispatchEvent(new CustomEvent('serviceWorkerUpdateAvailable'));
  
  // Si une fonction de notification existe, l'appeler
  if (typeof window.onServiceWorkerUpdateAvailable === 'function') {
    window.onServiceWorkerUpdateAvailable();
  }
};

/**
 * Applique la mise à jour du Service Worker et recharge la page
 */
export const applyServiceWorkerUpdate = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      // Envoi d'un message au service worker pour ignorer l'attente
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Recharger une fois que le nouveau SW a pris le contrôle
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    });
  }
};

/**
 * Crée un composant de notification de mise à jour
 * @param {Function} onUpdate - Fonction à appeler lorsque l'utilisateur accepte la mise à jour
 * @returns {Object} - Informations de mise à jour et composant de notification
 */
export const useServiceWorkerUpdateNotification = (onUpdate) => {
  const [showUpdateNotification, setShowUpdateNotification] = React.useState(false);
  
  React.useEffect(() => {
    // Gestionnaire d'événement pour la notification de mise à jour
    const handleUpdateAvailable = () => {
      setShowUpdateNotification(true);
    };
    
    // Enregistrer le gestionnaire
    window.addEventListener('serviceWorkerUpdateAvailable', handleUpdateAvailable);
    
    // Définir la fonction globale de notification
    window.onServiceWorkerUpdateAvailable = handleUpdateAvailable;
    
    // Nettoyage
    return () => {
      window.removeEventListener('serviceWorkerUpdateAvailable', handleUpdateAvailable);
      delete window.onServiceWorkerUpdateAvailable;
    };
  }, []);
  
  // Gestionnaire de clic pour le bouton "Mettre à jour"
  const handleUpdate = () => {
    setShowUpdateNotification(false);
    
    // Appeler la fonction de rappel si fournie
    if (typeof onUpdate === 'function') {
      onUpdate();
    }
    
    // Appliquer la mise à jour et recharger
    applyServiceWorkerUpdate();
  };
  
  return {
    showUpdateNotification,
    handleUpdate,
    handleDismiss: () => setShowUpdateNotification(false)
  };
};

/**
 * Vérifie si l'application est actuellement en mode hors ligne
 * @returns {boolean} - True si hors ligne, sinon false
 */
export const isOffline = () => {
  return typeof navigator !== 'undefined' && !navigator.onLine;
};

/**
 * Hook React pour suivre l'état de la connexion (en ligne/hors ligne)
 * @returns {boolean} - False si hors ligne, sinon true
 */
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = React.useState(
    typeof navigator !== 'undefined' && navigator.onLine
  );
  
  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return isOnline;
};

/**
 * Configure le service de synchronisation en arrière-plan pour les requêtes en échec
 * @param {Function} fetchFunction - Fonction fetch à intercepter
 * @returns {Function} - Fonction fetch modifiée avec synchronisation en arrière-plan
 */
export const setupBackgroundSync = (fetchFunction = fetch) => {
  // Si les Service Workers ne sont pas supportés, retourner fetch inchangé
  if (!('serviceWorker' in navigator)) {
    return fetchFunction;
  }
  
  return async (url, options = {}) => {
    try {
      // Essayer la requête normale
      return await fetchFunction(url, options);
    } catch (error) {
      // Si hors ligne, stocker la requête pour synchronisation future
      if (!navigator.onLine && error.name === 'TypeError') {
        await storeRequestForSync(url, options);
        
        // Planifier une synchronisation en arrière-plan
        try {
          await navigator.serviceWorker.ready;
          await navigator.serviceWorker.sync.register('sync-user-data');
        } catch (syncError) {
          console.warn('Background sync not supported or failed', syncError);
        }
        
        // Rethrow pour que l'application puisse traiter l'erreur
        throw new Error('Vous êtes hors ligne. Votre action sera synchronisée lorsque la connexion sera rétablie.');
      }
      
      // Rethrow pour toute autre erreur
      throw error;
    }
  };
};

/**
 * Stocke une requête échouée dans IndexedDB pour synchronisation ultérieure
 * @param {string} url - URL de la requête
 * @param {Object} options - Options de la requête
 * @returns {Promise<void>}
 */
const storeRequestForSync = async (url, options) => {
  // Ouvrir/créer la base de données
  const dbPromise = indexedDB.open('dashboard-velo-offline', 1);
  
  // Configurer la structure de la base de données si nécessaire
  dbPromise.onupgradeneeded = function(event) {
    const db = event.target.result;
    
    if (!db.objectStoreNames.contains('pending-requests')) {
      db.createObjectStore('pending-requests', { keyPath: 'id' });
    }
  };
  
  return new Promise((resolve, reject) => {
    dbPromise.onsuccess = function(event) {
      const db = event.target.result;
      const transaction = db.transaction(['pending-requests'], 'readwrite');
      const store = transaction.objectStore('pending-requests');
      
      // Créer une entrée pour la requête
      const requestEntry = {
        id: Date.now().toString(),
        url,
        method: options.method || 'GET',
        headers: options.headers || {},
        body: options.body || null,
        credentials: options.credentials || 'same-origin',
        timestamp: Date.now()
      };
      
      // Stocker la requête
      store.add(requestEntry);
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = (error) => reject(error);
    };
    
    dbPromise.onerror = function(event) {
      reject(event.target.error);
    };
  });
};

export default {
  registerServiceWorker,
  applyServiceWorkerUpdate,
  useServiceWorkerUpdateNotification,
  isOffline,
  useOnlineStatus,
  setupBackgroundSync
};
