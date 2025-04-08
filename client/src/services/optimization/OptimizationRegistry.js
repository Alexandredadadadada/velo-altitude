/**
 * Registre central des services d'optimisation pour Velo-Altitude
 * Centralise et coordonne tous les services d'optimisation
 */

// Import des services d'optimisation
import optimizedImageLoader from './OptimizedImageLoader';
import perceivedPerformance from './PerceivedPerformance';
import resourcePrefetcher from './ResourcePrefetcher';
import scriptPrioritizer from './ScriptPrioritizer';
import webVitalsMonitor from '../monitoring/WebVitalsMonitor';
import { isAuthenticated } from '../../auth/authUtils';

/**
 * Classe de registre central d'optimisation
 */
class OptimizationRegistry {
  constructor() {
    this.services = {
      imageLoader: optimizedImageLoader,
      perceivedPerformance,
      resourcePrefetcher,
      scriptPrioritizer,
      webVitalsMonitor
    };
    
    this.isInitialized = false;
    this.settings = {
      enableAllOptimizations: true,
      enableImageOptimization: true,
      enableScriptPrioritization: true,
      enableResourcePrefetching: true,
      enablePerformanceMonitoring: true,
      adaptiveQualityEnabled: true,
      serviceWorkerEnabled: true
    };
    
    // Métriques globales
    this.metrics = {
      initialLoadComplete: false,
      authLoadComplete: false,
      resourcesOptimized: 0,
      imagesOptimized: 0,
      componentsOptimized: new Set(),
      routeTransitions: []
    };
  }

  /**
   * Initialise tous les services d'optimisation
   * @public
   */
  initialize() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    
    console.log('[OptimizationRegistry] Initializing optimization services...');
    
    // Configurer les services en fonction des paramètres
    if (this.settings.enableAllOptimizations) {
      // 1. Initialiser le service de performance perçue
      if (this.settings.enablePerformanceMonitoring) {
        perceivedPerformance.initialize();
        perceivedPerformance.markStep('optimizationRegistryInit');
      }
      
      // 2. Initialiser le prioritiseur de scripts
      if (this.settings.enableScriptPrioritization) {
        scriptPrioritizer.initialize();
      }
      
      // 3. Préconnexions aux domaines externes
      if (this.settings.enableResourcePrefetching) {
        resourcePrefetcher.preconnectToExternalDomains();
      }
    }
    
    // Écouter les transitions de route
    this._setupRouteTransitionMonitoring();
    
    // Écouter l'état du réseau
    this._setupNetworkMonitoring();
    
    return this;
  }

  /**
   * Vérifie l'état d'authentification
   * Méthode synchrone simplifiée pour remplacer le système événementiel
   * @returns {boolean} L'utilisateur est-il authentifié
   * @public
   */
  checkAuth() {
    // Vérifier l'authentification de manière synchrone
    const authenticated = isAuthenticated();
    
    // Si c'est la première fois qu'on obtient une réponse claire
    if (!this.metrics.authLoadComplete) {
      this.metrics.authLoadComplete = true;
      perceivedPerformance.markStep('authStateResolved');
    }
    
    return authenticated;
  }

  /**
   * Configure la surveillance des transitions de route
   * @private
   */
  _setupRouteTransitionMonitoring() {
    // Surveiller les transitions de route via History API
    console.log('[OptimizationRegistry] Route transition monitoring ready');
  }

  /**
   * Configure la surveillance du réseau
   * @private
   */
  _setupNetworkMonitoring() {
    if (typeof navigator === 'undefined' || typeof navigator.connection === 'undefined') {
      return;
    }

    const updateNetworkInfo = () => {
      const conn = navigator.connection;
      if (!conn) return;

      if ('saveData' in conn && conn.saveData) {
        this._adaptToSaveDataMode();
      }

      if ('effectiveType' in conn) {
        const effectiveType = conn.effectiveType;
        if (effectiveType === 'slow-2g' || effectiveType === '2g') {
          this._adaptToSlowConnection();
        }
      }
    };

    updateNetworkInfo();

    if (navigator.connection) {
      navigator.connection.addEventListener('change', updateNetworkInfo);
    }
  }

  /**
   * Adapte les stratégies d'optimisation pour le mode économie de données
   * @private
   */
  _adaptToSaveDataMode() {
    // Désactiver les préchargements et images HD
    this.settings.enableResourcePrefetching = false;
    
    // Configurer l'optimisation d'images pour économiser les données
    if (optimizedImageLoader) {
      // Méthode fictive - à implémenter dans OptimizedImageLoader
      optimizedImageLoader.setQualityMode('low');
    }
  }

  /**
   * Adapte les stratégies d'optimisation pour les connexions lentes
   * @private
   */
  _adaptToSlowConnection() {
    // Réduire la quantité de ressources préchargées
    this.settings.enableResourcePrefetching = false;
    
    // Configurer l'optimisation d'images pour bande passante réduite
    if (optimizedImageLoader) {
      // Méthode fictive - à implémenter dans OptimizedImageLoader
      optimizedImageLoader.setQualityMode('medium');
    }
  }

  /**
   * Enregistre une transition de route
   * @param {string} from - Route de départ
   * @param {string} to - Route d'arrivée
   * @param {number} duration - Durée de la transition en ms
   * @public
   */
  recordRouteTransition(from, to, duration) {
    this.metrics.routeTransitions.push({
      from,
      to,
      duration,
      timestamp: Date.now()
    });
    
    // Ne garder que les 10 dernières transitions
    if (this.metrics.routeTransitions.length > 10) {
      this.metrics.routeTransitions.shift();
    }
    
    // Analyser pour détecter des problèmes de performance
    this._analyzeRouteTransitions();
  }

  /**
   * Analyse les transitions de route pour optimisations
   * @private
   */
  _analyzeRouteTransitions() {
    const transitions = this.metrics.routeTransitions;
    if (transitions.length < 3) return;
    
    // Calculer la durée moyenne des transitions
    const durations = transitions.map(t => t.duration);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    
    // Si la moyenne dépasse 500ms, suggérer des optimisations
    if (avgDuration > 500) {
      console.warn(`[OptimizationRegistry] Route transitions are slow (avg: ${Math.round(avgDuration)}ms). Consider optimizing code-splitting and lazy loading.`);
      
      // Identifier les routes les plus problématiques
      const routeStats = {};
      transitions.forEach(t => {
        const key = t.to;
        routeStats[key] = routeStats[key] || { count: 0, totalDuration: 0 };
        routeStats[key].count++;
        routeStats[key].totalDuration += t.duration;
      });
      
      // Identifier la route la plus lente
      let slowestRoute = null;
      let maxAvgDuration = 0;
      
      for (const [route, stats] of Object.entries(routeStats)) {
        const routeAvg = stats.totalDuration / stats.count;
        if (routeAvg > maxAvgDuration) {
          maxAvgDuration = routeAvg;
          slowestRoute = route;
        }
      }
      
      if (slowestRoute) {
        console.warn(`[OptimizationRegistry] Slowest route: ${slowestRoute} (avg: ${Math.round(maxAvgDuration)}ms)`);
        
        // Précharger automatiquement cette route lors des moments d'inactivité
        if (this.settings.enableResourcePrefetching) {
          resourcePrefetcher.prefetchRouteResources(slowestRoute);
        }
      }
    }
  }

  /**
   * Enregistre un composant optimisé
   * @param {string} componentId - ID du composant
   * @param {Object} metrics - Métriques du composant
   * @public
   */
  recordOptimizedComponent(componentId, metrics) {
    this.metrics.componentsOptimized.add(componentId);
    
    // Transmettre au moniteur de Web Vitals
    if (this.settings.enablePerformanceMonitoring && webVitalsMonitor) {
      webVitalsMonitor.recordComponentMetric(componentId, metrics);
    }
  }

  /**
   * Obtient tous les services d'optimisation
   * @returns {Object} Services d'optimisation
   * @public
   */
  getServices() {
    return this.services;
  }

  /**
   * Obtient les métriques globales d'optimisation
   * @returns {Object} Métriques d'optimisation
   * @public
   */
  getMetrics() {
    return {
      ...this.metrics,
      componentsOptimizedCount: this.metrics.componentsOptimized.size,
      webVitals: this.settings.enablePerformanceMonitoring ? webVitalsMonitor.getPerformanceResults() : null,
      perceivedPerformance: perceivedPerformance.getPerformanceStats()
    };
  }
}

// Exporter une instance singleton
const optimizationRegistry = new OptimizationRegistry();
export default optimizationRegistry;
