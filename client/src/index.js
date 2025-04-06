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
  try {
    // Liste minimale de ressources critiques - éviter trop de préchargements
    const criticalResources = [
      '/assets/images/logo.svg'
    ];
    
    // Précharger les ressources avec une gestion d'erreurs robuste
    criticalResources.forEach(resource => {
      try {
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
      } catch (err) {
        console.warn(`Erreur lors du préchargement de ${resource}:`, err);
        // Continuer malgré les erreurs
      }
    });
  } catch (err) {
    console.warn('Erreur dans preloadCriticalResources:', err);
    // Continuer même si le préchargement échoue complètement
  }
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

// Optimiser le rendu initial
const optimizeInitialRender = () => {
  // Masquer le contenu jusqu'à ce qu'il soit prêt
  const style = document.createElement('style');
  style.textContent = `
    .root-loading * {
      transition: none !important;
    }
    .root-loading {
      opacity: 0.2;
      transition: opacity 0.3s ease-in;
    }
  `;
  document.head.appendChild(style);
  document.documentElement.classList.add('root-loading');
  
  // Révéler le contenu une fois chargé ou après un délai de sécurité
  const revealContent = () => {
    requestAnimationFrame(() => {
      document.documentElement.classList.remove('root-loading');
    });
  };

  // Révéler le contenu après un délai maximal, même si tout n'est pas chargé
  setTimeout(revealContent, 2000);
  
  // Mais aussi quand tout est vraiment chargé
  window.addEventListener('load', revealContent);
};

// Fonction principale d'initialisation
const initApp = () => {
  try {
    // Tenter d'optimiser, mais continuer même en cas d'échec
    try {
      preloadCriticalResources();
      preconnectToDomains();
    } catch (err) {
      console.warn('Erreur lors des optimisations initiales:', err);
      // Continuer malgré les erreurs
    }
    
    // Rendu de l'application - point critique qui doit fonctionner
    const root = ReactDOM.createRoot(document.getElementById('root'));
    const browserFeatures = detectBrowserFeatures();
    root.render(
      <React.StrictMode>
        <App browserFeatures={browserFeatures} />
      </React.StrictMode>
    );
    
    // Mesure des performances après le rendu
    reportWebVitals(console.log);
  } catch (err) {
    console.error('Erreur critique lors de l'initialisation de l'application:', err);
    
    // Affichage d'un message d'erreur user-friendly en cas d'échec total
    document.body.innerHTML = `
      <div style="font-family: system-ui, sans-serif; text-align: center; padding: 2rem;">
        <h1>Désolé, une erreur s'est produite</h1>
        <p>Nous n'avons pas pu charger l'application Velo-Altitude. Veuillez réessayer dans quelques instants.</p>
        <button onclick="window.location.reload()" style="padding: 0.5rem 1rem; margin-top: 1rem; cursor: pointer;">
          Réessayer
        </button>
      </div>
    `;
  }
};

// Démarrer l'application
initApp();
