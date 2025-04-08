// Velo-Altitude Service Worker
// Version: 1.0.0

const CACHE_NAME = 'velo-altitude-v1';
const OFFLINE_PAGE = '/offline.html';

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/static/js/main.bundle.js',
  '/static/css/main.css',
  '/images/logo.svg',
  '/images/placeholder.webp',
  '/favicon.ico'
];

// Cache strategies by resource type
const CACHE_STRATEGIES = {
  images: 'cache-first',
  api: 'network-first',
  static: 'cache-first',
  default: 'network-first'
};

// Install event - precache critical assets
self.addEventListener('install', event => {
  console.log('[ServiceWorker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Pre-caching offline page and critical assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[ServiceWorker] Installation complete');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => cacheName !== CACHE_NAME)
            .map(cacheName => {
              console.log(`[ServiceWorker] Deleting old cache: ${cacheName}`);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[ServiceWorker] Claiming clients');
        return self.clients.claim();
      })
  );
});

// Helper function to determine cache strategy based on request URL
const getCacheStrategy = request => {
  const url = new URL(request.url);
  
  // API requests
  if (url.pathname.includes('/api/') || url.pathname.includes('/.netlify/functions/')) {
    return CACHE_STRATEGIES.api;
  }
  
  // Image requests
  if (
    url.pathname.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)$/) ||
    url.pathname.includes('/images/')
  ) {
    return CACHE_STRATEGIES.images;
  }
  
  // Static assets
  if (
    url.pathname.match(/\.(css|js|woff2|woff|ttf|eot)$/) ||
    url.pathname.includes('/static/')
  ) {
    return CACHE_STRATEGIES.static;
  }
  
  // Default strategy
  return CACHE_STRATEGIES.default;
};

// Implement cache-first strategy
const cacheFirst = async request => {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[ServiceWorker] Cache-first strategy failed:', error);
    return new Response('Network error occurred', { status: 408, headers: { 'Content-Type': 'text/plain' } });
  }
};

// Implement network-first strategy
const networkFirst = async request => {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[ServiceWorker] Network request failed, falling back to cache:', request.url);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If it's a navigation request, return the offline page
    if (request.mode === 'navigate') {
      return caches.match(OFFLINE_PAGE);
    }
    
    return new Response('Network error occurred', { status: 408, headers: { 'Content-Type': 'text/plain' } });
  }
};

// Fetch event - handle all requests
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // Skip chrome-extension requests
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }
  
  const strategy = getCacheStrategy(event.request);
  
  if (strategy === 'cache-first') {
    event.respondWith(cacheFirst(event.request));
  } else {
    event.respondWith(networkFirst(event.request));
  }
});

// Handle background sync for offline operations
self.addEventListener('sync', event => {
  console.log('[ServiceWorker] Background sync event:', event.tag);
  
  if (event.tag === 'sync-user-data') {
    event.waitUntil(syncUserData());
  } else if (event.tag === 'sync-routes') {
    event.waitUntil(syncRoutes());
  }
});

// Sync user data when back online
const syncUserData = async () => {
  try {
    const db = await openIndexedDB();
    const pendingChanges = await db.transaction('pendingChanges')
      .objectStore('pendingChanges')
      .getAll();
    
    if (pendingChanges.length === 0) {
      return;
    }
    
    console.log(`[ServiceWorker] Syncing ${pendingChanges.length} pending changes`);
    
    for (const change of pendingChanges) {
      try {
        const response = await fetch(change.url, {
          method: change.method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(change.data)
        });
        
        if (response.ok) {
          await db.transaction('pendingChanges', 'readwrite')
            .objectStore('pendingChanges')
            .delete(change.id);
          
          console.log(`[ServiceWorker] Successfully synced change ${change.id}`);
        }
      } catch (error) {
        console.error(`[ServiceWorker] Failed to sync change ${change.id}:`, error);
      }
    }
  } catch (error) {
    console.error('[ServiceWorker] Error during data sync:', error);
  }
};

// Helper function to open IndexedDB
const openIndexedDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('velo-altitude-offline', 1);
    
    request.onerror = event => {
      reject('Error opening IndexedDB');
    };
    
    request.onsuccess = event => {
      resolve(event.target.result);
    };
    
    request.onupgradeneeded = event => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('pendingChanges')) {
        db.createObjectStore('pendingChanges', { keyPath: 'id', autoIncrement: true });
      }
      
      if (!db.objectStoreNames.contains('cols')) {
        db.createObjectStore('cols', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('routes')) {
        db.createObjectStore('routes', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('user-data')) {
        db.createObjectStore('user-data', { keyPath: 'id' });
      }
    };
  });
};

// Push notification handling
self.addEventListener('push', event => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    const options = {
      body: data.body || 'Nouvelle notification de Velo-Altitude',
      icon: '/images/logo-192x192.png',
      badge: '/images/badge-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/'
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Velo-Altitude', options)
    );
  } catch (error) {
    console.error('[ServiceWorker] Error showing notification:', error);
  }
});

// Notification click handling
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(clientList => {
        const url = event.notification.data.url;
        
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If not, open a new window
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

console.log('[ServiceWorker] Script loaded');
