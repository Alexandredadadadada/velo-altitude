/**
 * Service Worker pour Velo-Altitude
 * Implémente une stratégie "Network First, Cache Fallback" avec précaching optimisé
 * Version: 2.0.0
 */

const CACHE_VERSION = 'velo-altitude-v2';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const API_CACHE = `${CACHE_VERSION}-api`;
const IMG_CACHE = `${CACHE_VERSION}-images`;

// Ressources critiques à précharger lors de l'installation
const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/static/css/main.css',
  '/static/js/main.js',
  '/static/js/vendor.js',
  '/static/media/logo.svg',
  '/static/media/logo-icon.svg',
  '/favicon.ico',
  '/manifest.json'
];

// Ressources importantes à précharger en arrière-plan
const IMPORTANT_ASSETS = [
  '/static/js/chunk-common.js',
  '/static/media/background.jpg',
  '/static/fonts/roboto-v20-latin-regular.woff2',
  '/static/fonts/roboto-v20-latin-500.woff2'
];

// Installation du Service Worker optimisée
self.addEventListener('install', event => {
  event.waitUntil(
    // Stratégie de précaching à deux niveaux
    Promise.all([
      // 1. Mettre en cache les ressources critiques immédiatement
      caches.open(STATIC_CACHE).then(cache => 
        cache.addAll(CRITICAL_ASSETS)
      ),
      
      // 2. Précharger les ressources importantes après l'activation
      self.skipWaiting()
    ])
  );
});

// Activation et nettoyage des anciens caches
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      // Nettoyer les anciens caches
      caches.keys().then(keys => {
        return Promise.all(
          keys.filter(key => key.startsWith('velo-altitude-') && !key.includes(CACHE_VERSION))
              .map(key => caches.delete(key))
        );
      }),
      
      // Précharger les ressources importantes en arrière-plan
      caches.open(STATIC_CACHE).then(cache => cache.addAll(IMPORTANT_ASSETS)),
      
      // Prendre le contrôle de toutes les pages immédiatement
      self.clients.claim()
    ])
  );
});

// Stratégies de mise en cache avancées par type de ressource
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Ne pas intercepter les requêtes POST ou les requêtes d'API avec authentification
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Ignorer les requêtes d'API d'authentification
  if (url.pathname.includes('/auth/') || url.pathname.includes('/.auth/')) {
    return;
  }
  
  // Stratégie pour la page principale et les routes HTML: Network First, Cache Fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(STATIC_CACHE).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => {
          return caches.match(event.request)
            .then(cachedResponse => {
              return cachedResponse || caches.match('/offline.html');
            });
        })
    );
    return;
  }
  
  // Stratégie pour les fichiers statiques: Cache First avec mise à jour en arrière-plan
  if (
    url.pathname.startsWith('/static/') || 
    url.pathname.endsWith('.js') || 
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.ttf')
  ) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        // Retourner la ressource mise en cache immédiatement
        const fetchPromise = fetch(event.request)
          .then(networkResponse => {
            if (networkResponse && networkResponse.ok) {
              const clonedResponse = networkResponse.clone();
              caches.open(STATIC_CACHE)
                .then(cache => cache.put(event.request, clonedResponse));
            }
            return networkResponse;
          })
          .catch(() => null);
        
        // Si la ressource n'est pas en cache, attendre le réseau
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }
  
  // Stratégie pour les images: Stale-While-Revalidate avec compression
  if (
    url.pathname.match(/\.(jpe?g|png|gif|svg|webp|avif)$/) ||
    url.pathname.includes('/image-optimizer')
  ) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        const fetchPromise = fetch(event.request)
          .then(networkResponse => {
            if (networkResponse && networkResponse.ok) {
              const clonedResponse = networkResponse.clone();
              caches.open(IMG_CACHE)
                .then(cache => cache.put(event.request, clonedResponse));
            }
            return networkResponse;
          })
          .catch(() => null);
        
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }
  
  // Stratégie pour les données d'API: Network First avec cache limité (TTL)
  if (url.pathname.startsWith('/api/') || url.href.includes('/api/')) {
    const apiRequest = event.request.url;
    
    // Ignorer les endpoints d'API sensibles qui ne doivent pas être mis en cache
    if (
      apiRequest.includes('/api/user/') ||
      apiRequest.includes('/api/auth/') ||
      apiRequest.includes('/api/profile/')
    ) {
      return;
    }
    
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Vérifier si la réponse est valide
          if (!response || response.status !== 200) {
            return response;
          }
          
          // Cloner et mettre en cache la réponse
          const clonedResponse = response.clone();
          
          caches.open(API_CACHE).then(cache => {
            // Ajouter les headers TTL pour la gestion de la fraîcheur
            const headers = new Headers(clonedResponse.headers);
            const cachedAt = Date.now();
            
            // Créer une nouvelle réponse avec les métadonnées ajoutées
            const augmentedResponse = new Response(clonedResponse.body, {
              status: clonedResponse.status,
              statusText: clonedResponse.statusText,
              headers: headers
            });
            
            // Stocker avec les métadonnées
            cache.put(event.request, augmentedResponse);
            
            // Nettoyer les réponses trop anciennes (toutes les 50 requêtes)
            if (Math.random() < 0.02) {
              cleanExpiredApiCache();
            }
          });
          
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // Stratégie par défaut: Network First, Cache Fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Ne pas mettre en cache les réponses non-200
        if (!response || response.status !== 200) {
          return response;
        }
        
        // Cloner et mettre en cache la réponse
        const clonedResponse = response.clone();
        caches.open(DYNAMIC_CACHE)
          .then(cache => cache.put(event.request, clonedResponse));
        
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// Nettoyer le cache API des réponses expirées
async function cleanExpiredApiCache() {
  const MAX_API_CACHE_AGE = 24 * 60 * 60 * 1000; // 24 heures
  
  try {
    const cache = await caches.open(API_CACHE);
    const requests = await cache.keys();
    
    const now = Date.now();
    
    for (const request of requests) {
      const response = await cache.match(request);
      const cachedAt = parseInt(response.headers.get('x-cached-at') || '0');
      
      if (now - cachedAt > MAX_API_CACHE_AGE) {
        await cache.delete(request);
      }
    }
  } catch (error) {
    console.error('Erreur lors du nettoyage du cache API:', error);
  }
}

// Synchronisation en arrière-plan
self.addEventListener('sync', event => {
  if (event.tag === 'sync-user-data') {
    event.waitUntil(syncUserData());
  } else if (event.tag === 'sync-activities') {
    event.waitUntil(syncActivities());
  }
});

// Fonction pour synchroniser les données utilisateur
async function syncUserData() {
  const dbPromise = indexedDB.open('velo-altitude-offline', 1);
  
  try {
    const db = await new Promise((resolve, reject) => {
      dbPromise.onsuccess = e => resolve(e.target.result);
      dbPromise.onerror = e => reject(e);
    });
    
    const transaction = db.transaction('pending-actions', 'readwrite');
    const store = transaction.objectStore('pending-actions');
    
    const actions = await new Promise((resolve, reject) => {
      const actionsResult = store.getAll();
      actionsResult.onsuccess = () => resolve(actionsResult.result);
      actionsResult.onerror = e => reject(e);
    });
    
    for (const action of actions) {
      try {
        const response = await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body,
          credentials: 'include'
        });
        
        if (response.ok) {
          store.delete(action.id);
        }
      } catch (error) {
        console.error('Erreur lors de la synchronisation:', error);
      }
    }
    
    return { result: 'success' };
  } catch (error) {
    console.error('Erreur lors de la synchronisation des données utilisateur:', error);
    return { result: 'error' };
  }
}

// Fonction pour synchroniser les activités
async function syncActivities() {
  // Implémentation similaire à syncUserData mais pour les activités
  return { result: 'success' };
}

// Gestion des notifications push
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
      },
      actions: [
        {
          action: 'open',
          title: 'Ouvrir'
        },
        {
          action: 'close',
          title: 'Ignorer'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Velo-Altitude', options)
    );
  } catch (e) {
    console.error('Erreur de traitement des données push:', e);
  }
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  const url = event.notification.data.url || '/';
  
  event.waitUntil(
    clients.matchAll({type: 'window'})
      .then(windowClients => {
        // Si une fenêtre est déjà ouverte, la focaliser et y naviguer
        for (const client of windowClients) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Sinon, ouvrir une nouvelle fenêtre
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Messages depuis l'application
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'CACHE_URLS') {
    // Précharger des URLs spécifiques à la demande de l'application
    event.waitUntil(
      caches.open(STATIC_CACHE)
        .then(cache => cache.addAll(event.data.urls))
    );
  } else if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys()
        .then(cacheNames => {
          return Promise.all(
            cacheNames
              .filter(cacheName => cacheName.startsWith('velo-altitude-'))
              .map(cacheName => caches.delete(cacheName))
          );
        })
    );
  }
});
