import React from 'react';
import ReactDOM from 'react-dom/client';
// Import critical CSS first for fastest rendering
import './styles/critical.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Polyfills pour les navigateurs plus anciens
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import 'intersection-observer';
import 'whatwg-fetch';

// Préchargement des ressources critiques
const preloadCriticalResources = () => {
  // Liste des ressources critiques à précharger
  const criticalResources = [
    '/fonts/main-font.woff2',
    '/images/logo.svg',
    '/images/hero-background.jpg'
  ];
  
  // Précharger les ressources
  criticalResources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource;
    
    // Définir le type approprié
    if (resource.endsWith('.woff2')) {
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
    } else if (resource.endsWith('.svg')) {
      link.as = 'image';
      link.type = 'image/svg+xml';
    } else if (resource.endsWith('.jpg') || resource.endsWith('.jpeg')) {
      link.as = 'image';
      link.type = 'image/jpeg';
    } else if (resource.endsWith('.png')) {
      link.as = 'image';
      link.type = 'image/png';
    }
    
    document.head.appendChild(link);
  });
};

// Préconnexion aux domaines externes
const preconnectToDomains = () => {
  const domains = [
    'https://api.mapbox.com',
    'https://api.openweathermap.org',
    'https://api.openrouteservice.org'
  ];
  
  domains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
};

// Exécuter les optimisations de préchargement
preloadCriticalResources();
preconnectToDomains();

// Charger les styles CSS non critiques de manière asynchrone
const loadNonCriticalCSS = () => {
  // Détecter la taille de l'écran pour charger les styles appropriés
  const width = window.innerWidth;
  
  // Styles de base pour tous les appareils
  const linkBase = document.createElement('link');
  linkBase.rel = 'stylesheet';
  linkBase.href = '/static/css/base.css';
  document.head.appendChild(linkBase);
  
  // Styles spécifiques à l'appareil
  if (width < 768) {
    // Mobile styles
    const linkMobile = document.createElement('link');
    linkMobile.rel = 'stylesheet';
    linkMobile.href = '/static/css/mobile.css';
    linkMobile.media = 'screen and (max-width: 767px)';
    document.head.appendChild(linkMobile);
  } else if (width >= 768 && width < 1024) {
    // Tablet styles
    const linkTablet = document.createElement('link');
    linkTablet.rel = 'stylesheet';
    linkTablet.href = '/static/css/tablet.css';
    linkTablet.media = 'screen and (min-width: 768px) and (max-width: 1023px)';
    document.head.appendChild(linkTablet);
  } else {
    // Desktop styles
    const linkDesktop = document.createElement('link');
    linkDesktop.rel = 'stylesheet';
    linkDesktop.href = '/static/css/desktop.css';
    linkDesktop.media = 'screen and (min-width: 1024px)';
    document.head.appendChild(linkDesktop);
  }
  
  // Autres styles non critiques
  const nonCriticalStylesheets = [
    '/static/css/animations.css',
  ];
  
  nonCriticalStylesheets.forEach(href => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  });
};

// Détecter les fonctionnalités du navigateur
const detectBrowserFeatures = () => {
  const features = {
    webp: false,
    webgl: false,
    touchscreen: false,
    passiveEvents: false
  };
  
  // Détecter le support WebP
  const webpImage = new Image();
  webpImage.onload = () => {
    if (webpImage.width > 0 && webpImage.height > 0) {
      features.webp = true;
      document.documentElement.classList.add('webp-support');
    }
  };
  webpImage.src = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';
  
  // Détecter le support WebGL
  try {
    const canvas = document.createElement('canvas');
    features.webgl = !!(window.WebGLRenderingContext && 
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    
    if (features.webgl) {
      document.documentElement.classList.add('webgl-support');
    }
  } catch (e) {
    features.webgl = false;
  }
  
  // Détecter l'écran tactile
  features.touchscreen = ('ontouchstart' in window) || 
    (navigator.maxTouchPoints > 0) || 
    (navigator.msMaxTouchPoints > 0);
  
  if (features.touchscreen) {
    document.documentElement.classList.add('touch-device');
  }
  
  // Détecter le support des événements passifs
  try {
    const options = {
      get passive() {
        features.passiveEvents = true;
        return true;
      }
    };
    
    window.addEventListener('test', null, options);
    window.removeEventListener('test', null, options);
  } catch (err) {
    features.passiveEvents = false;
  }
  
  return features;
};

// Détecter les fonctionnalités du navigateur
const browserFeatures = detectBrowserFeatures();

// Optimiser le rendu initial
const optimizeInitialRender = () => {
  // Masquer le contenu jusqu'à ce qu'il soit prêt
  const style = document.createElement('style');
  style.textContent = `
    .root-loading * {
      transition: none !important;
    }
    .root-loading {
      opacity: 0;
    }
  `;
  document.head.appendChild(style);
  document.documentElement.classList.add('root-loading');
  
  // Charger les styles non critiques après le chargement initial
  if (window.requestIdleCallback) {
    window.requestIdleCallback(loadNonCriticalCSS);
  } else {
    window.setTimeout(loadNonCriticalCSS, 1000);
  }
  
  // Révéler le contenu une fois chargé
  window.addEventListener('load', () => {
    requestAnimationFrame(() => {
      document.documentElement.classList.remove('root-loading');
    });
  });
};

// Appliquer l'optimisation du rendu initial
optimizeInitialRender();

// Créer la racine React
const root = ReactDOM.createRoot(document.getElementById('root'));

// Rendu de l'application
root.render(
  <React.StrictMode>
    <App browserFeatures={browserFeatures} />
  </React.StrictMode>
);

// Mesurer les performances
reportWebVitals(metric => {
  // Envoyer les métriques à un service d'analyse si nécessaire
  if (process.env.NODE_ENV === 'production' && metric.value > metric.threshold) {
    console.log(`Performance metric: ${metric.name} = ${metric.value}ms`);
    
    // Ici, on pourrait envoyer les métriques à un service d'analyse
    // sendToAnalyticsService(metric);
  }
});

// Enregistrer le Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker enregistré avec succès:', registration.scope);
        
        // Mettre à jour le Service Worker si nécessaire
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker == null) {
            return;
          }
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // Une nouvelle version est disponible
                console.log('Une nouvelle version est disponible et sera utilisée au prochain chargement.');
                
                // Afficher une notification à l'utilisateur
                const updateNotification = document.createElement('div');
                updateNotification.className = 'update-notification';
                updateNotification.innerHTML = `
                  <div class="update-content">
                    <p>Une nouvelle version est disponible!</p>
                    <button id="update-button">Mettre à jour</button>
                  </div>
                `;
                document.body.appendChild(updateNotification);
                
                // Gérer le clic sur le bouton de mise à jour
                document.getElementById('update-button').addEventListener('click', () => {
                  window.location.reload();
                  updateNotification.remove();
                });
              } else {
                // L'application est mise en cache pour une utilisation hors ligne
                console.log('L\'application est maintenant disponible hors ligne.');
                
                // Stocker l'heure de la dernière synchronisation
                localStorage.setItem('lastSyncTime', Date.now().toString());
              }
            }
          };
        };
      })
      .catch(error => {
        console.error('Erreur lors de l\'enregistrement du Service Worker:', error);
      });
      
    // Gérer les mises à jour du Service Worker
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  });
}
