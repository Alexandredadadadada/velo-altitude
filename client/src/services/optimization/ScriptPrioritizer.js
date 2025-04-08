/**
 * Service de priorisation de scripts pour Velo-Altitude
 * Implémente le chargement différé et priorisé pour optimiser les métriques web vitals
 */

// Classification des ressources par importance
const RESOURCE_PRIORITY = {
  CRITICAL: 'critical',  // Bloque le rendu, chargé immédiatement
  ESSENTIAL: 'essential', // Nécessaire rapidement mais ne bloque pas le rendu
  IMPORTANT: 'important', // Nécessaire pour la fonctionnalité complète
  OPTIONAL: 'optional',  // Fonctionnalités secondaires, peut être différé
  LAZY: 'lazy'          // Fonctionnalités non essentielles, chargé à la demande
};

// Configuration des scripts tiers avec leurs priorités
const THIRD_PARTY_CONFIGS = {
  // Analytics
  'ga': {
    priority: RESOURCE_PRIORITY.ESSENTIAL,
    src: 'https://www.googletagmanager.com/gtag/js',
    async: true,
    defer: false,
    preconnect: true
  },
  'matomo': {
    priority: RESOURCE_PRIORITY.IMPORTANT,
    src: '/static/js/matomo.js',
    async: true,
    defer: false
  },
  
  // Cartographie
  'mapbox': {
    priority: RESOURCE_PRIORITY.ESSENTIAL,
    src: 'https://api.mapbox.com/mapbox-gl-js/v2.8.2/mapbox-gl.js',
    async: true,
    defer: false,
    preload: true,
    preconnect: true
  },
  'mapbox-css': {
    priority: RESOURCE_PRIORITY.ESSENTIAL,
    src: 'https://api.mapbox.com/mapbox-gl-js/v2.8.2/mapbox-gl.css',
    type: 'style',
    preconnect: true
  },
  
  // Intégrations
  'strava': {
    priority: RESOURCE_PRIORITY.IMPORTANT,
    src: 'https://www.strava.com/api/external/embed.js',
    async: true,
    defer: true,
    preconnect: true
  },
  
  // 3D et visualisation
  'threejs': {
    priority: RESOURCE_PRIORITY.IMPORTANT,
    src: 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js',
    async: true,
    defer: false,
    preload: true
  },
  'chart': {
    priority: RESOURCE_PRIORITY.IMPORTANT,
    src: 'https://cdn.jsdelivr.net/npm/chart.js',
    async: true,
    defer: true
  },
  
  // Polices
  'roboto-font': {
    priority: RESOURCE_PRIORITY.ESSENTIAL,
    src: 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap',
    type: 'style',
    preconnect: true
  },
  'material-icons': {
    priority: RESOURCE_PRIORITY.ESSENTIAL,
    src: 'https://fonts.googleapis.com/icon?family=Material+Icons',
    type: 'style',
    preconnect: true
  },
  
  // Utilitaires
  'hammer': {
    priority: RESOURCE_PRIORITY.OPTIONAL,
    src: 'https://hammerjs.github.io/dist/hammer.min.js',
    async: true,
    defer: true
  }
};

class ScriptPrioritizer {
  constructor() {
    this.loadedScripts = new Set();
    this.loadingPromises = new Map();
    this.criticalComplete = false;
    this.essentialComplete = false;
    this.scriptObserver = null;
    this.performanceStartTime = performance.now();
    
    // Configurer l'observer pour les scripts bloquants
    this._setupScriptObserver();
    
    // Initialiser le suivi des métriques de performance
    this._initPerformanceTracking();
  }

  /**
   * Configure l'observer pour les scripts
   * @private
   */
  _setupScriptObserver() {
    if ('IntersectionObserver' in window) {
      this.scriptObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const scriptId = entry.target.getAttribute('data-script-id');
              if (scriptId && !this.loadedScripts.has(scriptId)) {
                const config = THIRD_PARTY_CONFIGS[scriptId];
                if (config) {
                  this._loadScript(scriptId, config);
                }
                this.scriptObserver.unobserve(entry.target);
              }
            }
          });
        },
        {
          rootMargin: '200px 0px', // Préchargement avant que l'élément soit visible
          threshold: 0.01
        }
      );
    }
  }

  /**
   * Initialise le suivi des métriques de performance
   * @private
   */
  _initPerformanceTracking() {
    // Surveiller les changements de visibilité de la page pour les métriques
    if (document.addEventListener) {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this._reportMetricsOnUnload();
        }
      });
    }
    
    // Enregistrer les métriques Web Vitals disponibles
    this._registerWebVitalsMetrics();
  }
  
  /**
   * Enregistre les métriques Web Vitals pour le suivi
   * @private
   */
  _registerWebVitalsMetrics() {
    if ('performance' in window && 'PerformanceObserver' in window) {
      // Observer pour LCP (Largest Contentful Paint)
      try {
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.lcpValue = lastEntry.startTime;
          console.log('[Performance] LCP:', this.lcpValue);
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (e) {
        console.warn('[Performance] LCP observation not supported:', e);
      }
      
      // Observer pour FID (First Input Delay)
      try {
        const fidObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const firstInput = entries[0];
          this.fidValue = firstInput.processingStart - firstInput.startTime;
          console.log('[Performance] FID:', this.fidValue);
        });
        fidObserver.observe({ type: 'first-input', buffered: true });
      } catch (e) {
        console.warn('[Performance] FID observation not supported:', e);
      }
      
      // Observer pour CLS (Cumulative Layout Shift)
      try {
        let clsValue = 0;
        let clsEntries = [];
        
        const clsObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          
          entries.forEach(entry => {
            // Only count layout shifts without recent user input
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              clsEntries.push(entry);
            }
          });
          
          this.clsValue = clsValue;
          console.log('[Performance] CLS:', this.clsValue);
        });
        
        clsObserver.observe({ type: 'layout-shift', buffered: true });
      } catch (e) {
        console.warn('[Performance] CLS observation not supported:', e);
      }
    }
  }

  /**
   * Rapport des métriques de performance lors de la fermeture de la page
   * @private
   */
  _reportMetricsOnUnload() {
    // Collecter les métriques de performance
    const metrics = {
      lcpValue: this.lcpValue,
      fidValue: this.fidValue,
      clsValue: this.clsValue,
      loadedScripts: Array.from(this.loadedScripts),
      totalLoadTime: performance.now() - this.performanceStartTime
    };
    
    // Envoyer les métriques au serveur si possibles (utiliser beacon pour ne pas bloquer la navigation)
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/metrics/performance', JSON.stringify(metrics));
    }
  }

  /**
   * Charge un script en fonction de sa configuration et priorité
   * @param {string} id - Identifiant du script
   * @param {object} config - Configuration du script
   * @returns {Promise} - Promise résolue lorsque le script est chargé
   * @private
   */
  _loadScript(id, config) {
    // Si le script est déjà chargé ou en cours de chargement, retourner la promise existante
    if (this.loadedScripts.has(id)) {
      return Promise.resolve();
    }
    
    if (this.loadingPromises.has(id)) {
      return this.loadingPromises.get(id);
    }
    
    // Créer un élément script ou link selon le type
    let element;
    if (config.type === 'style') {
      element = document.createElement('link');
      element.rel = 'stylesheet';
      element.href = config.src;
    } else {
      element = document.createElement('script');
      element.src = config.src;
      element.async = config.async ?? true;
      element.defer = config.defer ?? false;
    }
    
    // Ajouter un attribut non-render-blocking pour les ressources non critiques
    if (config.priority !== RESOURCE_PRIORITY.CRITICAL) {
      if (config.type === 'style') {
        element.media = 'print';
        element.onload = () => {
          element.media = 'all';
        };
      }
    }
    
    // Suivre le chargement
    const loadPromise = new Promise((resolve, reject) => {
      element.onload = () => {
        this.loadedScripts.add(id);
        console.log(`[ScriptPrioritizer] Loaded: ${id}`);
        resolve();
      };
      element.onerror = (error) => {
        console.error(`[ScriptPrioritizer] Failed to load: ${id}`, error);
        reject(error);
      };
    });
    
    // Stocker la promise pour éviter les doublons
    this.loadingPromises.set(id, loadPromise);
    
    // Ajouter l'élément au DOM
    document.head.appendChild(element);
    
    return loadPromise;
  }
  
  /**
   * Charge tous les scripts d'une priorité donnée
   * @param {string} priority - Priorité des scripts à charger
   * @returns {Promise} - Promise résolue lorsque tous les scripts sont chargés
   * @public
   */
  loadScriptsByPriority(priority) {
    const scriptsToLoad = Object.entries(THIRD_PARTY_CONFIGS)
      .filter(([_, config]) => config.priority === priority)
      .map(([id, config]) => this._loadScript(id, config));
    
    return Promise.all(scriptsToLoad);
  }
  
  /**
   * Établit des connexions préalables aux domaines des scripts
   * @public
   */
  establishPreconnections() {
    const processedDomains = new Set();
    
    Object.entries(THIRD_PARTY_CONFIGS).forEach(([id, config]) => {
      if (config.preconnect) {
        try {
          const url = new URL(config.src);
          const domain = `${url.protocol}//${url.hostname}`;
          
          if (!processedDomains.has(domain)) {
            const link = document.createElement('link');
            link.rel = 'preconnect';
            link.href = domain;
            link.crossOrigin = 'anonymous';
            document.head.appendChild(link);
            
            // DNS-prefetch comme fallback
            const dnsLink = document.createElement('link');
            dnsLink.rel = 'dns-prefetch';
            dnsLink.href = domain;
            document.head.appendChild(dnsLink);
            
            processedDomains.add(domain);
          }
        } catch (e) {
          console.warn(`[ScriptPrioritizer] Invalid URL for preconnect: ${config.src}`);
        }
      }
    });
  }
  
  /**
   * Précharge les scripts critiques et essentiels
   * @public
   */
  preloadCriticalResources() {
    Object.entries(THIRD_PARTY_CONFIGS).forEach(([id, config]) => {
      if (config.preload || config.priority === RESOURCE_PRIORITY.CRITICAL) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = config.src;
        link.as = config.type === 'style' ? 'style' : 'script';
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      }
    });
  }
  
  /**
   * Initialise le chargement des ressources
   * @public
   */
  initialize() {
    // Établir des préconnexions pour améliorer la performance
    this.establishPreconnections();
    
    // Précharger les ressources critiques
    this.preloadCriticalResources();
    
    // Charger les scripts critiques immédiatement
    this.loadScriptsByPriority(RESOURCE_PRIORITY.CRITICAL)
      .then(() => {
        this.criticalComplete = true;
        console.log('[ScriptPrioritizer] Critical scripts loaded');
        
        // Charger les scripts essentiels après un court délai
        setTimeout(() => {
          this.loadScriptsByPriority(RESOURCE_PRIORITY.ESSENTIAL)
            .then(() => {
              this.essentialComplete = true;
              console.log('[ScriptPrioritizer] Essential scripts loaded');
              
              // Charger les scripts importants avec requestIdleCallback
              if ('requestIdleCallback' in window) {
                window.requestIdleCallback(() => {
                  this.loadScriptsByPriority(RESOURCE_PRIORITY.IMPORTANT);
                }, { timeout: 2000 });
              } else {
                setTimeout(() => {
                  this.loadScriptsByPriority(RESOURCE_PRIORITY.IMPORTANT);
                }, 2000);
              }
            });
        }, 500);
      });
  }
  
  /**
   * Observe un élément DOM pour charger un script quand il devient visible
   * @param {HTMLElement} element - Élément à observer
   * @param {string} scriptId - ID du script à charger
   * @public
   */
  observeElementForScript(element, scriptId) {
    if (this.scriptObserver && element) {
      element.setAttribute('data-script-id', scriptId);
      this.scriptObserver.observe(element);
    }
  }
  
  /**
   * Charge un script spécifique à la demande
   * @param {string} scriptId - ID du script à charger
   * @returns {Promise} - Promise résolue quand le script est chargé
   * @public
   */
  loadScriptOnDemand(scriptId) {
    const config = THIRD_PARTY_CONFIGS[scriptId];
    if (!config) {
      return Promise.reject(new Error(`Script configuration not found: ${scriptId}`));
    }
    
    return this._loadScript(scriptId, config);
  }
  
  /**
   * Récupère des métriques de performance
   * @returns {object} - Métriques de performance
   * @public
   */
  getPerformanceMetrics() {
    return {
      loadedScriptsCount: this.loadedScripts.size,
      loadedScripts: Array.from(this.loadedScripts),
      lcpValue: this.lcpValue,
      fidValue: this.fidValue,
      clsValue: this.clsValue,
      criticalComplete: this.criticalComplete,
      essentialComplete: this.essentialComplete,
      totalLoadTime: performance.now() - this.performanceStartTime
    };
  }
}

// Instance singleton
const scriptPrioritizer = new ScriptPrioritizer();
export default scriptPrioritizer;

// Export des constantes pour une utilisation externe
export { RESOURCE_PRIORITY, THIRD_PARTY_CONFIGS };
