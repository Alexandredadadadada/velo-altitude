/**
 * Service de préchargement intelligent des ressources
 * Implémente des stratégies avancées de prefetching pour optimiser les temps de chargement
 */

import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

// Configuration des routes principales et leurs ressources associées
const ROUTE_RESOURCES = {
  // Page d'accueil
  '/': {
    priority: 'high',
    resources: [
      '/static/js/dashboard.chunk.js',
      '/static/media/hero-background.jpg',
      '/static/media/logo-full.svg'
    ],
    apiEndpoints: [
      '/api/cols/featured',
      '/api/challenges/recent'
    ],
    nextRoutes: ['/cols', '/challenges', '/profile']
  },
  
  // Page des cols
  '/cols': {
    priority: 'high',
    resources: [
      '/static/js/colslist.chunk.js',
      '/static/js/mapbox.chunk.js'
    ],
    apiEndpoints: [
      '/api/cols/list',
      '/api/cols/stats'
    ],
    nextRoutes: ['/cols/:id']
  },
  
  // Page de détail d'un col
  '/cols/:id': {
    priority: 'medium',
    resources: [
      '/static/js/coldetail.chunk.js',
      '/static/js/threejs.chunk.js',
      '/static/js/elevation.chunk.js'
    ],
    apiEndpoints: [
      '/api/cols/:id',
      '/api/cols/:id/photos',
      '/api/cols/:id/comments'
    ],
    nextRoutes: []
  },
  
  // Page des défis
  '/challenges': {
    priority: 'high',
    resources: [
      '/static/js/challenges.chunk.js',
      '/static/media/challenge-background.jpg'
    ],
    apiEndpoints: [
      '/api/challenges',
      '/api/user/stats'
    ],
    nextRoutes: ['/challenges/:id']
  },
  
  // Page de profil
  '/profile': {
    priority: 'medium',
    resources: [
      '/static/js/profile.chunk.js',
      '/static/js/charts.chunk.js'
    ],
    apiEndpoints: [
      '/api/user/profile',
      '/api/user/activities'
    ],
    nextRoutes: ['/settings']
  }
};

/**
 * Classe principale de préchargement des ressources
 */
class ResourcePrefetcher {
  constructor() {
    this.supportsPrefetch = this._checkPrefetchSupport();
    this.supportsPreconnect = this._checkPreconnectSupport();
    this.visitedRoutes = new Set();
    this.prefetchedResources = new Set();
    this.currentRouteInfo = null;
    this.idleCallbackSupported = 'requestIdleCallback' in window;
    this.networkInfo = this._getNetworkInfo();
    this.prefetchedApiEndpoints = new Set();
    
    // Observer les changements de l'état du réseau
    this._setupNetworkObserver();
  }

  /**
   * Vérifie si le navigateur supporte le prefetch
   * @returns {boolean} Support du prefetch
   * @private
   */
  _checkPrefetchSupport() {
    const link = document.createElement('link');
    return link.relList && link.relList.supports && link.relList.supports('prefetch');
  }
  
  /**
   * Vérifie si le navigateur supporte le preconnect
   * @returns {boolean} Support du preconnect
   * @private
   */
  _checkPreconnectSupport() {
    const link = document.createElement('link');
    return link.relList && link.relList.supports && link.relList.supports('preconnect');
  }
  
  /**
   * Obtient les informations réseau actuelles
   * @returns {object} Informations sur le réseau
   * @private
   */
  _getNetworkInfo() {
    // Utiliser Network Information API si disponible
    if ('connection' in navigator) {
      return {
        effectiveType: navigator.connection.effectiveType,
        saveData: navigator.connection.saveData,
        rtt: navigator.connection.rtt,
        downlink: navigator.connection.downlink
      };
    }
    
    return {
      effectiveType: 'unknown',
      saveData: false,
      rtt: undefined,
      downlink: undefined
    };
  }
  
  /**
   * Configure l'observateur de changements réseau
   * @private
   */
  _setupNetworkObserver() {
    if ('connection' in navigator && navigator.connection.addEventListener) {
      navigator.connection.addEventListener('change', () => {
        this.networkInfo = this._getNetworkInfo();
      });
    }
  }
  
  /**
   * Vérifie si le préchargement doit être désactivé en fonction des conditions réseau
   * @returns {boolean} True si le préchargement doit être désactivé
   * @private
   */
  _shouldDisablePrefetch() {
    // Ne pas précharger si l'utilisateur a activé l'économie de données
    if (this.networkInfo.saveData) {
      return true;
    }
    
    // Ne pas précharger sur les connexions très lentes
    if (this.networkInfo.effectiveType === 'slow-2g' || this.networkInfo.effectiveType === '2g') {
      return true;
    }
    
    // Ne pas précharger si le RTT est élevé
    if (this.networkInfo.rtt && this.networkInfo.rtt > 500) {
      return true;
    }
    
    // Ne pas précharger si le débit est faible
    if (this.networkInfo.downlink && this.networkInfo.downlink < 0.5) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Précharge une ressource via prefetch
   * @param {string} url - URL de la ressource à précharger
   * @param {string} as - Type de ressource (script, style, image, etc.)
   * @private
   */
  _prefetchResource(url, as = null) {
    // Vérifier si la ressource a déjà été préchargée
    if (this.prefetchedResources.has(url)) {
      return;
    }
    
    // Vérifier si le préchargement doit être désactivé
    if (this._shouldDisablePrefetch()) {
      console.log('Prefetch skipped due to network constraints:', url);
      return;
    }
    
    // Vérifier le support du prefetch
    if (!this.supportsPrefetch) {
      console.log('Prefetch not supported by browser');
      return;
    }
    
    // Créer l'élément link pour le prefetch
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    if (as) {
      link.as = as;
    }
    
    // Ajouter l'attribut crossorigin si nécessaire
    if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
      link.crossOrigin = 'anonymous';
    }
    
    // Ajouter le link au head
    document.head.appendChild(link);
    
    // Enregistrer la ressource comme préchargée
    this.prefetchedResources.add(url);
    
    console.log('Prefetched resource:', url);
  }
  
  /**
   * Préétablit une connexion à un domaine via preconnect
   * @param {string} domain - Domaine pour la connexion
   * @private
   */
  _preconnectToDomain(domain) {
    if (!this.supportsPreconnect) {
      return;
    }
    
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
    
    // DNS-prefetch comme fallback pour les navigateurs plus anciens
    const dnsLink = document.createElement('link');
    dnsLink.rel = 'dns-prefetch';
    dnsLink.href = domain;
    document.head.appendChild(dnsLink);
    
    console.log('Preconnected to domain:', domain);
  }
  
  /**
   * Précharge les données d'API en avance
   * @param {string} endpoint - Point d'API à précharger
   * @param {string} routeParam - Paramètre de route à remplacer dans l'URL
   * @private
   */
  _prefetchApiEndpoint(endpoint, routeParam = null) {
    // Remplacer les paramètres de route si nécessaire
    let url = endpoint;
    if (routeParam && endpoint.includes(':id')) {
      url = endpoint.replace(':id', routeParam);
    }
    
    // Vérifier si l'endpoint a déjà été préchargé
    const cacheKey = routeParam ? `${endpoint}:${routeParam}` : endpoint;
    if (this.prefetchedApiEndpoints.has(cacheKey)) {
      return;
    }
    
    // Ne pas précharger sur les connexions limitées
    if (this._shouldDisablePrefetch()) {
      return;
    }
    
    // Précharger l'API endpoint
    fetch(url, {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'X-Prefetch': 'true'
      }
    })
    .then(() => {
      console.log('Prefetched API endpoint:', url);
      this.prefetchedApiEndpoints.add(cacheKey);
    })
    .catch(error => {
      console.error('Failed to prefetch API endpoint:', url, error);
    });
  }
  
  /**
   * Détermine le type de ressource en fonction de l'extension
   * @param {string} url - URL de la ressource
   * @returns {string|null} Type de ressource ou null
   * @private
   */
  _getResourceType(url) {
    if (url.endsWith('.js')) return 'script';
    if (url.endsWith('.css')) return 'style';
    if (url.match(/\.(jpe?g|png|gif|svg|webp|avif)$/)) return 'image';
    if (url.match(/\.(woff2?|ttf|otf|eot)$/)) return 'font';
    return null;
  }
  
  /**
   * Précharge les ressources pour une route spécifique
   * @param {string} route - Route à précharger
   * @param {string} routeParam - Paramètre de route optionnel
   * @param {boolean} isCurrentRoute - Si c'est la route actuelle
   * @public
   */
  prefetchRouteResources(route, routeParam = null, isCurrentRoute = false) {
    // Vérifier si la route a des ressources définies
    let routeConfig = ROUTE_RESOURCES[route];
    if (!routeConfig) {
      // Vérifier les routes avec paramètres
      Object.keys(ROUTE_RESOURCES).forEach(pattern => {
        if (pattern.includes(':id') && route.match(pattern.replace(':id', '\\w+'))) {
          routeConfig = ROUTE_RESOURCES[pattern];
        }
      });
      
      if (!routeConfig) {
        return;
      }
    }
    
    // Si c'est la route actuelle, précharger immédiatement les ressources critiques
    if (isCurrentRoute) {
      // Ajouter la route à l'historique des visites
      this.visitedRoutes.add(route);
      this.currentRouteInfo = routeConfig;
      
      // Précharger les ressources principales immédiatement
      routeConfig.resources.forEach(resource => {
        const resourceType = this._getResourceType(resource);
        this._prefetchResource(resource, resourceType);
      });
      
      // Précharger les endpoints d'API
      if (routeConfig.apiEndpoints) {
        routeConfig.apiEndpoints.forEach(endpoint => {
          this._prefetchApiEndpoint(endpoint, routeParam);
        });
      }
    } 
    // Sinon, utiliser requestIdleCallback pour précharger de manière non bloquante
    else {
      const prefetchInBackground = () => {
        // Précharger les ressources avec une priorité
        if (routeConfig.resources) {
          routeConfig.resources.forEach((resource, index) => {
            // Délai progressif pour réduire la contention
            const delay = index * 150;
            setTimeout(() => {
              const resourceType = this._getResourceType(resource);
              this._prefetchResource(resource, resourceType);
            }, delay);
          });
        }
        
        // Précharger certains endpoints API en avance
        if (routeConfig.apiEndpoints && routeConfig.apiEndpoints.length > 0) {
          // Précharger uniquement le premier endpoint pour les routes futures
          this._prefetchApiEndpoint(routeConfig.apiEndpoints[0], routeParam);
        }
      };
      
      if (this.idleCallbackSupported) {
        window.requestIdleCallback(prefetchInBackground, { timeout: 2000 });
      } else {
        // Fallback pour les navigateurs ne supportant pas requestIdleCallback
        setTimeout(prefetchInBackground, 1000);
      }
    }
  }
  
  /**
   * Précharge les routes probables suivantes
   * @public
   */
  prefetchNextRoutes() {
    if (!this.currentRouteInfo || !this.currentRouteInfo.nextRoutes) {
      return;
    }
    
    // Utiliser requestIdleCallback pour ne pas affecter les performances
    const prefetchNextRoutesInBackground = () => {
      this.currentRouteInfo.nextRoutes.forEach((nextRoute, index) => {
        // Préchargement progressif pour éviter de surcharger le réseau
        setTimeout(() => {
          this.prefetchRouteResources(nextRoute);
        }, index * 500);
      });
    };
    
    if (this.idleCallbackSupported) {
      window.requestIdleCallback(prefetchNextRoutesInBackground, { timeout: 3000 });
    } else {
      setTimeout(prefetchNextRoutesInBackground, 1500);
    }
  }
  
  /**
   * Préétablir des connexions aux domaines externes importants
   * @public
   */
  preconnectToExternalDomains() {
    const domains = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://api.mapbox.com',
      'https://events.mapbox.com',
      'https://api.strava.com'
    ];
    
    domains.forEach((domain, index) => {
      // Délai progressif pour les préconnexions
      setTimeout(() => {
        this._preconnectToDomain(domain);
      }, index * 100);
    });
  }
}

// Instance singleton
const resourcePrefetcher = new ResourcePrefetcher();
export default resourcePrefetcher;

/**
 * Hook React pour utiliser le préchargeur de ressources
 * @param {string} routeParam - Paramètre de route optionnel
 * @returns {object} État du préchargeur
 */
export function usePrefetching(routeParam = null) {
  const location = useLocation();
  const [prefetchingState, setPrefetchingState] = useState({
    prefetchingComplete: false,
    prefetchedResources: 0
  });
  
  useEffect(() => {
    // Précharger les ressources pour la route actuelle
    const currentPath = location.pathname;
    
    // Trouver la route correspondante
    let matchedRoute = null;
    
    // D'abord, chercher une correspondance exacte
    Object.keys(ROUTE_RESOURCES).forEach(route => {
      if (route === currentPath) {
        matchedRoute = route;
      }
    });
    
    // Si pas de correspondance exacte, chercher un pattern de route
    if (!matchedRoute) {
      Object.keys(ROUTE_RESOURCES).forEach(route => {
        if (route.includes(':id')) {
          const pattern = route.replace(':id', '[^/]+');
          const regex = new RegExp(`^${pattern}$`);
          if (regex.test(currentPath)) {
            matchedRoute = route;
          }
        }
      });
    }
    
    // Si une route correspondante est trouvée, précharger ses ressources
    if (matchedRoute) {
      const initialCount = resourcePrefetcher.prefetchedResources.size;
      resourcePrefetcher.prefetchRouteResources(matchedRoute, routeParam, true);
      const finalCount = resourcePrefetcher.prefetchedResources.size;
      
      setPrefetchingState({
        prefetchingComplete: true,
        prefetchedResources: finalCount - initialCount
      });
      
      // Précharger les routes probables suivantes
      setTimeout(() => {
        resourcePrefetcher.prefetchNextRoutes();
      }, 2000);
    }
    
    // Préétablir des connexions aux domaines externes importants
    resourcePrefetcher.preconnectToExternalDomains();
    
  }, [location, routeParam]);
  
  return prefetchingState;
}

// Composant pour la réinitialisation manuelle du préchargement
export const PrefetchReset = () => {
  useEffect(() => {
    return () => {
      resourcePrefetcher.prefetchedResources.clear();
      resourcePrefetcher.prefetchedApiEndpoints.clear();
    };
  }, []);
  
  return null;
};
