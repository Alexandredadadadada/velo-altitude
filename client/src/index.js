import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
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
