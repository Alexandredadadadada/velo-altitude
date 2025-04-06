/**
 * Utilitaire d'optimisation des performances pour le site Grand Est Cyclisme
 * Implémente des techniques avancées pour améliorer les performances globales
 */

import { useEffect, useState, useRef } from 'react';

// Constantes pour les seuils de performance
const PERFORMANCE_THRESHOLDS = {
  INTERACTION_DELAY: 100, // ms
  LONG_TASK_THRESHOLD: 50, // ms
  IDLE_CALLBACK_TIMEOUT: 1000, // ms
  RESOURCE_CACHE_MAX_AGE: 7 * 24 * 60 * 60 * 1000, // 7 jours
  IMAGE_LAZY_LOAD_OFFSET: 200, // px
};

/**
 * Classe principale d'optimisation des performances
 */
class PerformanceOptimizer {
  constructor() {
    this.isEnabled = true;
    this.metrics = {
      fpsHistory: [],
      resourceLoadTimes: {},
      interactionDelays: [],
      memoryUsage: [],
    };
    this.observers = {};
    this.optimizations = {
      lazyLoading: true,
      codeChunking: true,
      imageOptimization: true,
      caching: true,
      prefetching: true,
      resourceHints: true,
    };
    // Simplification de la détection des capacités pour éviter les blocages
    this.deviceInfo = {
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      isLowEndDevice: false,
      hasLimitedMemory: false,
      hasSlowConnection: false,
      supportsWebGL: true,
      supportsWebP: true,
      devicePixelRatio: window.devicePixelRatio || 1,
      screenSize: {
        width: window.screen.width,
        height: window.screen.height,
      },
      connection: null,
    };
    this.initialized = false;
  }

  /**
   * Initialise l'optimiseur de performances
   * @param {Object} options - Options de configuration
   */
  initialize(options = {}) {
    if (this.initialized) return;

    console.log('Initialisation de l\'optimiseur de performances...');
    
    // Fusionner les options avec les valeurs par défaut
    this.optimizations = { ...this.optimizations, ...options };
    
    // Ne pas bloquer le chargement initial avec la collecte de métriques
    setTimeout(() => {
      this._startMetricsCollection();
      this._initializeObservers();
      this._applyInitialOptimizations();
    }, 2000);
    
    this.initialized = true;
    console.log('Optimiseur de performances initialisé avec succès');
  }

  /**
   * Méthode de détection des capacités simplifiée pour éviter les blocages
   * @returns {Object} Informations sur l'appareil
   * @private
   */
  _detectDeviceCapabilities() {
    return this.deviceInfo;
  }

  /**
   * Démarre la collecte de métriques de performance
   * @private
   */
  _startMetricsCollection() {
    // Collecter les FPS
    if (window.requestAnimationFrame) {
      let lastTime = performance.now();
      let frames = 0;
      
      const collectFPS = () => {
        const now = performance.now();
        frames++;
        
        if (now > lastTime + 1000) {
          const fps = Math.round((frames * 1000) / (now - lastTime));
          this.metrics.fpsHistory.push({
            timestamp: now,
            fps: fps
          });
          
          // Limiter l'historique à 60 entrées (1 minute à 1 mesure/s)
          if (this.metrics.fpsHistory.length > 60) {
            this.metrics.fpsHistory.shift();
          }
          
          frames = 0;
          lastTime = now;
        }
        
        window.requestAnimationFrame(collectFPS);
      };
      
      window.requestAnimationFrame(collectFPS);
    }
    
    // Surveiller l'utilisation de la mémoire
    if (window.performance && window.performance.memory) {
      setInterval(() => {
        this.metrics.memoryUsage.push({
          timestamp: performance.now(),
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize
        });
        
        // Limiter l'historique à 60 entrées
        if (this.metrics.memoryUsage.length > 60) {
          this.metrics.memoryUsage.shift();
        }
      }, 10000); // Toutes les 10 secondes
    }
    
    // Surveiller les temps de chargement des ressources
    if (window.performance && window.performance.getEntriesByType) {
      const processResources = () => {
        const resources = performance.getEntriesByType('resource');
        
        resources.forEach(resource => {
          const url = resource.name;
          const type = this._getResourceType(url);
          
          if (!this.metrics.resourceLoadTimes[type]) {
            this.metrics.resourceLoadTimes[type] = [];
          }
          
          this.metrics.resourceLoadTimes[type].push({
            url: url,
            duration: resource.duration,
            size: resource.transferSize || 0,
            timestamp: resource.startTime
          });
        });
        
        // Effacer les entrées traitées
        performance.clearResourceTimings();
      };
      
      // Observer les nouvelles ressources
      if (window.PerformanceObserver) {
        const observer = new PerformanceObserver(list => {
          processResources();
        });
        
        observer.observe({ entryTypes: ['resource'] });
      } else {
        // Fallback pour les navigateurs sans PerformanceObserver
        setInterval(processResources, 5000);
      }
    }
    
    // Surveiller les délais d'interaction
    document.addEventListener('click', e => {
      const start = performance.now();
      
      window.requestAnimationFrame(() => {
        const duration = performance.now() - start;
        
        this.metrics.interactionDelays.push({
          timestamp: start,
          duration: duration,
          type: 'click'
        });
        
        // Limiter l'historique à 50 entrées
        if (this.metrics.interactionDelays.length > 50) {
          this.metrics.interactionDelays.shift();
        }
      });
    }, { passive: true });
  }

  /**
   * Initialise les observateurs pour surveiller les performances
   * @private
   */
  _initializeObservers() {
    // Observer les tâches longues
    if (window.PerformanceObserver) {
      try {
        this.observers.longTasks = new PerformanceObserver(list => {
          list.getEntries().forEach(entry => {
            console.warn(`Tâche longue détectée: ${entry.duration}ms`, entry);
            
            // Si la tâche est très longue, ajuster automatiquement les optimisations
            if (entry.duration > PERFORMANCE_THRESHOLDS.LONG_TASK_THRESHOLD * 2) {
              this._adjustOptimizationsForLowPerformance();
            }
          });
        });
        
        this.observers.longTasks.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        console.log('PerformanceObserver pour longtask non supporté');
      }
    }
    
    // Observer les changements de connexion réseau
    if (navigator.connection) {
      navigator.connection.addEventListener('change', () => {
        this.deviceInfo.connection = {
          type: navigator.connection.effectiveType,
          downlink: navigator.connection.downlink,
          rtt: navigator.connection.rtt,
          saveData: navigator.connection.saveData,
        };
        
        this.deviceInfo.hasSlowConnection = 
          navigator.connection.effectiveType === 'slow-2g' || 
          navigator.connection.effectiveType === '2g' ||
          navigator.connection.downlink < 1.0;
        
        // Ajuster les optimisations en fonction de la connexion
        this._adjustOptimizationsForConnection();
      });
    }
    
    // Observer la visibilité de la page
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        // La page est cachée, réduire les opérations
        this._pauseNonEssentialOperations();
      } else {
        // La page est visible à nouveau, reprendre les opérations
        this._resumeOperations();
      }
    });
  }

  /**
   * Applique les optimisations initiales
   * @private
   */
  _applyInitialOptimizations() {
    // Optimisations basées sur les capacités de l'appareil
    if (this.deviceInfo.isLowEndDevice) {
      this._adjustOptimizationsForLowPerformance();
    }
    
    // Optimisations basées sur la connexion
    this._adjustOptimizationsForConnection();
    
    // Préchargement des ressources critiques
    if (this.optimizations.prefetching) {
      this._prefetchCriticalResources();
    }
    
    // Indications de ressources
    if (this.optimizations.resourceHints) {
      this._addResourceHints();
    }
  }

  /**
   * Ajuste les optimisations pour les appareils à faibles performances
   * @private
   */
  _adjustOptimizationsForLowPerformance() {
    console.log('Ajustement des optimisations pour appareil à faibles performances');
    
    // Réduire la qualité des images
    if (this.optimizations.imageOptimization) {
      document.documentElement.classList.add('optimize-images');
    }
    
    // Désactiver les animations non essentielles
    document.documentElement.classList.add('reduce-animations');
    
    // Réduire la fréquence des mises à jour de l'interface
    this._throttleUIUpdates();
  }

  /**
   * Ajuste les optimisations en fonction de la connexion réseau
   * @private
   */
  _adjustOptimizationsForConnection() {
    if (!this.deviceInfo.connection) return;
    
    console.log(`Ajustement des optimisations pour connexion: ${this.deviceInfo.connection.type}`);
    
    if (this.deviceInfo.hasSlowConnection) {
      // Activer le mode économie de données
      document.documentElement.classList.add('data-saver');
      
      // Réduire la qualité des images
      if (this.optimizations.imageOptimization) {
        document.documentElement.classList.add('optimize-images');
      }
      
      // Désactiver le préchargement
      this.optimizations.prefetching = false;
    } else {
      // Connexion rapide, optimisations normales
      document.documentElement.classList.remove('data-saver');
      document.documentElement.classList.remove('optimize-images');
      
      // Réactiver le préchargement si désactivé
      this.optimizations.prefetching = true;
    }
  }

  /**
   * Précharge les ressources critiques
   * @private
   */
  _prefetchCriticalResources() {
    // Liste des ressources critiques à précharger
    const criticalResources = [
      // Ajouter ici les ressources critiques
    ];
    
    // Ne pas précharger sur les connexions lentes
    if (this.deviceInfo.hasSlowConnection) return;
    
    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = resource;
      document.head.appendChild(link);
    });
  }

  /**
   * Ajoute des indications de ressources (resource hints)
   * @private
   */
  _addResourceHints() {
    // Domaines à préconnecter
    const domainsToPreconnect = [
      'https://api.mapbox.com',
      'https://api.openweathermap.org',
      'https://api.openrouteservice.org'
    ];
    
    domainsToPreconnect.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = domain;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  }

  /**
   * Limite la fréquence des mises à jour de l'interface
   * @private
   */
  _throttleUIUpdates() {
    // Implémenter la limitation des mises à jour UI
    // Cette fonction serait utilisée par les composants via les hooks
  }

  /**
   * Met en pause les opérations non essentielles
   * @private
   */
  _pauseNonEssentialOperations() {
    // Mettre en pause les animations
    document.documentElement.classList.add('pause-animations');
    
    // Arrêter les mises à jour non essentielles
    this.isPaused = true;
  }

  /**
   * Reprend les opérations
   * @private
   */
  _resumeOperations() {
    // Reprendre les animations
    document.documentElement.classList.remove('pause-animations');
    
    // Reprendre les mises à jour
    this.isPaused = false;
  }

  /**
   * Détermine le type de ressource à partir de l'URL
   * @param {string} url - URL de la ressource
   * @returns {string} Type de ressource
   * @private
   */
  _getResourceType(url) {
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i)) {
      return 'image';
    } else if (url.match(/\.(js)(\?|$)/i)) {
      return 'script';
    } else if (url.match(/\.(css)(\?|$)/i)) {
      return 'style';
    } else if (url.match(/\.(woff|woff2|ttf|otf|eot)(\?|$)/i)) {
      return 'font';
    } else if (url.match(/\.(json)(\?|$)/i)) {
      return 'json';
    } else {
      return 'other';
    }
  }

  /**
   * Obtient un rapport de performance
   * @returns {Object} Rapport de performance
   */
  getPerformanceReport() {
    // Calculer les métriques moyennes
    const avgFPS = this.metrics.fpsHistory.length > 0 
      ? this.metrics.fpsHistory.reduce((sum, entry) => sum + entry.fps, 0) / this.metrics.fpsHistory.length 
      : 0;
    
    const avgInteractionDelay = this.metrics.interactionDelays.length > 0 
      ? this.metrics.interactionDelays.reduce((sum, entry) => sum + entry.duration, 0) / this.metrics.interactionDelays.length 
      : 0;
    
    // Préparer le rapport
    return {
      device: this.deviceInfo,
      metrics: {
        avgFPS,
        avgInteractionDelay,
        resourceLoadTimes: this.metrics.resourceLoadTimes,
        memoryUsage: this.metrics.memoryUsage.length > 0 ? this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1] : null
      },
      optimizations: this.optimizations,
      recommendations: this._generateRecommendations()
    };
  }

  /**
   * Génère des recommandations d'optimisation
   * @returns {Array} Liste de recommandations
   * @private
   */
  _generateRecommendations() {
    const recommendations = [];
    
    // Vérifier les FPS
    const recentFPS = this.metrics.fpsHistory.slice(-5);
    const avgRecentFPS = recentFPS.length > 0 
      ? recentFPS.reduce((sum, entry) => sum + entry.fps, 0) / recentFPS.length 
      : 0;
    
    if (avgRecentFPS < 30) {
      recommendations.push({
        type: 'critical',
        area: 'performance',
        message: 'FPS bas détecté, considérer la réduction des effets visuels'
      });
    }
    
    // Vérifier les délais d'interaction
    const recentDelays = this.metrics.interactionDelays.slice(-5);
    const avgRecentDelay = recentDelays.length > 0 
      ? recentDelays.reduce((sum, entry) => sum + entry.duration, 0) / recentDelays.length 
      : 0;
    
    if (avgRecentDelay > PERFORMANCE_THRESHOLDS.INTERACTION_DELAY) {
      recommendations.push({
        type: 'warning',
        area: 'interactivity',
        message: 'Délais d\'interaction élevés, optimiser les gestionnaires d\'événements'
      });
    }
    
    return recommendations;
  }
}

// Exporter une instance de l'optimiseur
const performanceOptimizer = new PerformanceOptimizer();
export default performanceOptimizer;

/**
 * Hook React pour utiliser l'optimiseur de performances
 * @param {Object} options - Options de configuration
 * @returns {Object} Informations sur l'appareil et méthodes d'optimisation
 */
export function usePerformanceOptimizer(options = {}) {
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    if (!isInitialized) {
      performanceOptimizer.initialize(options);
      setIsInitialized(true);
    }
  }, [options, isInitialized]);
  
  return {
    deviceInfo: performanceOptimizer.deviceInfo,
    getPerformanceReport: performanceOptimizer.getPerformanceReport.bind(performanceOptimizer),
    pauseNonEssentialOperations: performanceOptimizer._pauseNonEssentialOperations.bind(performanceOptimizer),
    resumeOperations: performanceOptimizer._resumeOperations.bind(performanceOptimizer)
  };
}

/**
 * Hook pour le chargement paresseux des images
 * @param {string} src - URL de l'image
 * @param {Object} options - Options de configuration
 * @returns {Object} État de chargement et URL optimisée
 */
export function useLazyLoad(src, options = {}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [optimizedSrc, setOptimizedSrc] = useState('');
  const ref = useRef(null);
  
  useEffect(() => {
    // Observer pour détecter quand l'élément entre dans la vue
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: `${options.offset || PERFORMANCE_THRESHOLDS.IMAGE_LAZY_LOAD_OFFSET}px`,
        threshold: options.threshold || 0.1
      }
    );
    
    // Observer l'élément
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => {
      observer.disconnect();
    };
  }, [options.offset, options.threshold]);
  
  useEffect(() => {
    if (isVisible && src) {
      // Choisir la source optimisée en fonction des capacités du navigateur
      let finalSrc = src;
      
      // Si l'optimisation d'image est activée et que nous avons un format moderne supporté
      if (performanceOptimizer.optimizations.imageOptimization) {
        if (performanceOptimizer.deviceInfo.supportsWebP) {
          // Convertir l'URL pour utiliser WebP si disponible
          finalSrc = src.replace(/\.(jpe?g|png)$/i, '.webp');
        }
        
        // Appliquer des tailles d'image appropriées pour les appareils mobiles
        if (performanceOptimizer.deviceInfo.isMobile) {
          // Ajouter des paramètres pour ajuster la taille
          const isSrcWithParams = finalSrc.includes('?');
          const connector = isSrcWithParams ? '&' : '?';
          finalSrc = `${finalSrc}${connector}width=${Math.min(window.innerWidth, 800)}`;
        }
      }
      
      setOptimizedSrc(finalSrc);
      
      // Précharger l'image
      const img = new Image();
      img.onload = () => setIsLoaded(true);
      img.src = finalSrc;
    }
  }, [isVisible, src]);
  
  return { ref, isVisible, isLoaded, src: optimizedSrc || src };
}