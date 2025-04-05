/**
 * Service Worker pour Dashboard-Velo
 * Implémente des stratégies de mise en cache pour une expérience offline
 * Version: 1.0.0
 */

const CACHE_NAME = 'dashboard-velo-cache-v1';
const RUNTIME_CACHE = 'dashboard-velo-runtime-v1';

// Ressources à mettre en cache lors de l'installation
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/static/css/main.css',
  '/static/js/main.js',
  '/static/js/vendor.js',
  '/static/media/logo.svg',
  '/static/media/background.jpg',
  '/manifest.json',
  '/favicon.ico'
];

// Installation du Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activation du Service Worker
self.addEventListener('activate', event => {
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
    }).then(cachesToDelete => {
      return Promise.all(cachesToDelete.map(cacheToDelete => {
        return caches.delete(cacheToDelete);
      }));
    }).then(() => self.clients.claim())
  );
});

// Stratégie de mise en cache
self.addEventListener('fetch', event => {
  // Ignorer les requêtes non GET et les requêtes API avec authentification
  if (
    event.request.method !== 'GET' ||
    (event.request.url.startsWith(self.location.origin + '/api/') && 
     event.request.url.includes('/auth/'))
  ) {
    return;
  }

  // Stratégie Stale-While-Revalidate pour les ressources statiques
  if (event.request.url.match(/\.(js|css|png|jpg|jpeg|svg|gif|woff|woff2|ttf|eot|webp|avif)$/)) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        const fetchPromise = fetch(event.request).then(response => {
          // Mettre en cache la nouvelle version
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        }).catch(() => {
          // Retourner la page offline en cas d'échec
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
          return null;
        });

        return cachedResponse || fetchPromise;
      })
    );
  } 
  // Stratégie Network-First pour les pages HTML
  else if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request).then(cachedResponse => {
          return cachedResponse || caches.match('/offline.html');
        });
      })
    );
  } 
  // Stratégie Cache-First pour les autres ressources
  else {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        return cachedResponse || fetch(event.request).then(response => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        }).catch(() => {
          return null;
        });
      })
    );
  }
});

// Gestion des messages
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Synchronisation en arrière-plan
self.addEventListener('sync', event => {
  if (event.tag === 'sync-user-data') {
    event.waitUntil(syncUserData());
  }
});

// Fonction pour synchroniser les données utilisateur
async function syncUserData() {
  const dbPromise = indexedDB.open('dashboard-velo-offline', 1);
  
  dbPromise.onupgradeneeded = function(event) {
    const db = event.target.result;
    
    if (!db.objectStoreNames.contains('pending-requests')) {
      db.createObjectStore('pending-requests', { keyPath: 'id' });
    }
  };
  
  try {
    const db = await new Promise((resolve, reject) => {
      dbPromise.onsuccess = e => resolve(e.target.result);
      dbPromise.onerror = e => reject(e);
    });
    
    const transaction = db.transaction('pending-requests', 'readwrite');
    const store = transaction.objectStore('pending-requests');
    
    const requests = await new Promise((resolve, reject) => {
      const requestsResult = store.getAll();
      requestsResult.onsuccess = () => resolve(requestsResult.result);
      requestsResult.onerror = e => reject(e);
    });
    
    for (const request of requests) {
      try {
        await fetch(request.url, {
          method: request.method,
          headers: request.headers,
          body: request.body,
          credentials: 'include'
        });
        
        // Suppression de la requête synchronisée
        store.delete(request.id);
      } catch (error) {
        console.error('Erreur lors de la synchronisation:', error);
      }
    }
    
    return await new Promise((resolve) => {
      transaction.oncomplete = () => resolve({ result: 'success' });
      transaction.onerror = () => resolve({ result: 'error' });
    });
  } catch (error) {
    console.error('Erreur lors de l\'accès à IndexedDB:', error);
    return { result: 'error' };
  }
}

// Notifications push
self.addEventListener('push', event => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/static/media/logo.svg',
      badge: '/static/media/badge.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/'
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Dashboard Velo', options)
    );
  } catch (e) {
    console.error('Erreur de traitement des données push:', e);
    
    // Fallback si les données ne sont pas au format JSON
    event.waitUntil(
      self.registration.showNotification('Dashboard Velo', {
        body: event.data.text(),
        icon: '/static/media/logo.svg'
      })
    );
  }
});

// Interaction avec les notifications
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      // Si un onglet est déjà ouvert, l'utiliser
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      
      // Sinon, ouvrir un nouvel onglet
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
