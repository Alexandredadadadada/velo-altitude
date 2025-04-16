/**
 * Système de collecte de métriques de référence pour Velo-Altitude
 * Établit une base de référence avant le déploiement des optimisations
 */

import enhancedPerformanceMonitoring from './enhancedPerformanceMonitoring';
import { ENV } from '../config/environment';

// Types pour les métriques de référence
interface BaselineMetrics {
  interaction: Map<string, number[]>;
  resources: Map<string, number[]>;
  cache: Map<string, { hits: number; misses: number }>;
  webVitals: {
    fcp: number[];
    lcp: number[];
    cls: number[];
    fid: number[];
  };
  memory: {
    usage: number[];
    timestamp: number[];
  };
  routes: Map<string, {
    frequency: number;
    avgLoadTime: number;
    navigationTimes: number[];
  }>;
}

/**
 * Système de collecte de métriques de référence
 */
export const baselineMetricsCollector = {
  // Métriques de référence
  baselineMetrics: {
    interaction: new Map<string, number[]>(),
    resources: new Map<string, number[]>(),
    cache: new Map<string, { hits: number; misses: number }>(),
    webVitals: {
      fcp: [],
      lcp: [],
      cls: [],
      fid: []
    },
    memory: {
      usage: [],
      timestamp: []
    },
    routes: new Map<string, {
      frequency: number;
      avgLoadTime: number;
      navigationTimes: number[];
    }>()
  } as BaselineMetrics,
  
  // Flag pour indiquer si la collecte est en cours
  isCollecting: false,
  
  // Timestamp de début de la collecte
  startTime: 0,
  
  // Timer pour la collecte périodique
  collectionTimer: null as number | null,
  
  // Callback à appeler lorsque la collecte est terminée
  completionCallback: null as ((metrics: BaselineMetrics) => void) | null,
  
  /**
   * Démarre la collecte de métriques de référence
   * @param duration Durée de la collecte en millisecondes (par défaut 7 jours)
   * @returns Promise qui se résout avec les métriques collectées
   */
  collectBaseline(duration: number = 7 * 24 * 60 * 60 * 1000): Promise<BaselineMetrics> {
    if (this.isCollecting) {
      return Promise.reject(new Error('Une collecte de métriques de référence est déjà en cours'));
    }
    
    this.isCollecting = true;
    this.startTime = Date.now();
    
    // Réinitialiser les métriques
    this.resetMetrics();
    
    // Créer une promesse qui sera résolue lorsque la collecte sera terminée
    return new Promise((resolve) => {
      this.completionCallback = (metrics) => {
        resolve(metrics);
      };
      
      // Configurer le timer pour la collecte périodique
      this.collectionTimer = window.setInterval(() => {
        this.collectCurrentMetrics();
        
        // Vérifier si la durée de collecte est atteinte
        if (Date.now() - this.startTime >= duration) {
          this.stopCollection();
        }
      }, 60000); // Collecter toutes les minutes
      
      // Commencer la collecte immédiatement
      this.collectCurrentMetrics();
    });
  },
  
  /**
   * Arrête la collecte de métriques de référence
   */
  stopCollection(): void {
    if (!this.isCollecting) {
      return;
    }
    
    this.isCollecting = false;
    
    if (this.collectionTimer) {
      clearInterval(this.collectionTimer);
      this.collectionTimer = null;
    }
    
    // Calculer les moyennes et autres statistiques finales
    this.finalizeMetrics();
    
    // Appeler le callback de complétion
    if (this.completionCallback) {
      this.completionCallback({ ...this.baselineMetrics });
      this.completionCallback = null;
    }
    
    console.info('Collecte de métriques de référence terminée', {
      duréeTotale: (Date.now() - this.startTime) / (60 * 1000) + ' minutes',
      interactions: this.baselineMetrics.interaction.size,
      resources: this.baselineMetrics.resources.size,
      routes: this.baselineMetrics.routes.size
    });
  },
  
  /**
   * Réinitialise les métriques de référence
   */
  resetMetrics(): void {
    this.baselineMetrics = {
      interaction: new Map<string, number[]>(),
      resources: new Map<string, number[]>(),
      cache: new Map<string, { hits: number; misses: number }>(),
      webVitals: {
        fcp: [],
        lcp: [],
        cls: [],
        fid: []
      },
      memory: {
        usage: [],
        timestamp: []
      },
      routes: new Map<string, {
        frequency: number;
        avgLoadTime: number;
        navigationTimes: number[];
      }>()
    };
  },
  
  /**
   * Collecte les métriques actuelles depuis le système de monitoring
   */
  collectCurrentMetrics(): void {
    const perfMetrics = enhancedPerformanceMonitoring.metrics;
    
    // Collecter les métriques d'interaction
    Object.entries(perfMetrics.interactions.byType).forEach(([type, durations]) => {
      if (!this.baselineMetrics.interaction.has(type)) {
        this.baselineMetrics.interaction.set(type, []);
      }
      
      const interactionMetrics = this.baselineMetrics.interaction.get(type)!;
      interactionMetrics.push(...durations);
    });
    
    // Collecter les métriques de ressources
    perfMetrics.loading.resources.forEach((duration, resource) => {
      if (!this.baselineMetrics.resources.has(resource)) {
        this.baselineMetrics.resources.set(resource, []);
      }
      
      const resourceMetrics = this.baselineMetrics.resources.get(resource)!;
      resourceMetrics.push(duration);
    });
    
    // Collecter les métriques de cache
    Object.entries(perfMetrics.cache.byKey).forEach(([key, stats]) => {
      if (!this.baselineMetrics.cache.has(key)) {
        this.baselineMetrics.cache.set(key, { hits: 0, misses: 0 });
      }
      
      const cacheMetrics = this.baselineMetrics.cache.get(key)!;
      cacheMetrics.hits += stats.hits;
      cacheMetrics.misses += stats.misses;
    });
    
    // Collecter les Web Vitals (uniquement si des valeurs sont disponibles)
    if (perfMetrics.vitals.fcp > 0) {
      this.baselineMetrics.webVitals.fcp.push(perfMetrics.vitals.fcp);
    }
    
    if (perfMetrics.vitals.lcp > 0) {
      this.baselineMetrics.webVitals.lcp.push(perfMetrics.vitals.lcp);
    }
    
    if (perfMetrics.vitals.cls > 0) {
      this.baselineMetrics.webVitals.cls.push(perfMetrics.vitals.cls);
    }
    
    if (perfMetrics.vitals.fid > 0) {
      this.baselineMetrics.webVitals.fid.push(perfMetrics.vitals.fid);
    }
    
    // Collecter les métriques de mémoire
    if (perfMetrics.memory.usage > 0) {
      this.baselineMetrics.memory.usage.push(perfMetrics.memory.usage);
      this.baselineMetrics.memory.timestamp.push(Date.now());
    }
    
    // Collecter les métriques de routes (en utilisant l'historique de navigation du navigateur)
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navEntries = performance.getEntriesByType('navigation');
      
      if (navEntries.length > 0) {
        const navEntry = navEntries[0] as PerformanceNavigationTiming;
        const route = window.location.pathname;
        
        if (!this.baselineMetrics.routes.has(route)) {
          this.baselineMetrics.routes.set(route, {
            frequency: 0,
            avgLoadTime: 0,
            navigationTimes: []
          });
        }
        
        const routeMetrics = this.baselineMetrics.routes.get(route)!;
        routeMetrics.frequency++;
        routeMetrics.navigationTimes.push(navEntry.duration);
        
        // Calculer la moyenne des temps de navigation
        routeMetrics.avgLoadTime = routeMetrics.navigationTimes.reduce((a, b) => a + b, 0) / routeMetrics.navigationTimes.length;
      }
    }
  },
  
  /**
   * Finalise les métriques en calculant les statistiques finales
   */
  finalizeMetrics(): void {
    // Finaliser les métriques de routes
    this.baselineMetrics.routes.forEach((metrics) => {
      metrics.avgLoadTime = metrics.navigationTimes.reduce((a, b) => a + b, 0) / metrics.navigationTimes.length;
    });
    
    // Sauvegarder les métriques de référence si configuré
    if (ENV.monitoring?.saveBaseline) {
      this.saveBaselineToLocalStorage();
    }
  },
  
  /**
   * Sauvegarde les métriques de référence dans le stockage local
   */
  saveBaselineToLocalStorage(): void {
    try {
      // Convertir les Maps en objets pour la sérialisation
      const serializedMetrics = {
        interaction: Object.fromEntries(this.baselineMetrics.interaction),
        resources: Object.fromEntries(this.baselineMetrics.resources),
        cache: Object.fromEntries(this.baselineMetrics.cache),
        webVitals: this.baselineMetrics.webVitals,
        memory: this.baselineMetrics.memory,
        routes: Object.fromEntries(this.baselineMetrics.routes),
        timestamp: Date.now()
      };
      
      localStorage.setItem('velo_altitude_baseline_metrics', JSON.stringify(serializedMetrics));
      
      console.info('Métriques de référence sauvegardées dans le stockage local');
    } catch (e) {
      console.warn('Impossible de sauvegarder les métriques de référence:', e);
    }
  },
  
  /**
   * Charge les métriques de référence depuis le stockage local
   */
  loadBaselineFromLocalStorage(): BaselineMetrics | null {
    try {
      const savedMetrics = localStorage.getItem('velo_altitude_baseline_metrics');
      
      if (savedMetrics) {
        const parsed = JSON.parse(savedMetrics);
        
        // Convertir les objets en Maps
        this.baselineMetrics = {
          interaction: new Map(Object.entries(parsed.interaction)),
          resources: new Map(Object.entries(parsed.resources)),
          cache: new Map(Object.entries(parsed.cache)),
          webVitals: parsed.webVitals,
          memory: parsed.memory,
          routes: new Map(Object.entries(parsed.routes))
        };
        
        console.info('Métriques de référence chargées depuis le stockage local');
        return this.baselineMetrics;
      }
    } catch (e) {
      console.warn('Impossible de charger les métriques de référence:', e);
    }
    
    return null;
  },
  
  /**
   * Analyse les métriques de référence pour générer des recommandations
   */
  analyzeBaseline(): string[] {
    const recommendations: string[] = [];
    
    // Analyser les métriques d'interaction
    this.baselineMetrics.interaction.forEach((durations, type) => {
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      
      if (avg > 200) {
        recommendations.push(`Optimiser les interactions de type "${type}" (${Math.round(avg)}ms en moyenne)`);
      }
    });
    
    // Analyser les métriques de ressources
    this.baselineMetrics.resources.forEach((durations, resource) => {
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      
      if (avg > 2000) {
        recommendations.push(`Optimiser le chargement de la ressource "${resource}" (${Math.round(avg)}ms en moyenne)`);
      }
    });
    
    // Analyser les métriques de cache
    this.baselineMetrics.cache.forEach((stats, key) => {
      const total = stats.hits + stats.misses;
      const hitRate = total > 0 ? stats.hits / total : 0;
      
      if (hitRate < 0.5 && total > 10) {
        recommendations.push(`Améliorer la stratégie de cache pour "${key}" (taux de succès de ${Math.round(hitRate * 100)}%)`);
      }
    });
    
    // Analyser les Web Vitals
    if (this.baselineMetrics.webVitals.lcp.length > 0) {
      const avgLCP = this.baselineMetrics.webVitals.lcp.reduce((a, b) => a + b, 0) / this.baselineMetrics.webVitals.lcp.length;
      
      if (avgLCP > 2500) {
        recommendations.push(`Améliorer le LCP (${Math.round(avgLCP)}ms en moyenne, cible: < 2500ms)`);
      }
    }
    
    if (this.baselineMetrics.webVitals.fid.length > 0) {
      const avgFID = this.baselineMetrics.webVitals.fid.reduce((a, b) => a + b, 0) / this.baselineMetrics.webVitals.fid.length;
      
      if (avgFID > 100) {
        recommendations.push(`Améliorer le FID (${Math.round(avgFID)}ms en moyenne, cible: < 100ms)`);
      }
    }
    
    // Analyser les métriques de routes
    const slowRoutes = Array.from(this.baselineMetrics.routes.entries())
      .filter(([_, metrics]) => metrics.avgLoadTime > 3000)
      .sort((a, b) => b[1].avgLoadTime - a[1].avgLoadTime);
    
    if (slowRoutes.length > 0) {
      const routesList = slowRoutes.slice(0, 3).map(([route, metrics]) => 
        `${route} (${Math.round(metrics.avgLoadTime)}ms)`
      ).join(', ');
      
      recommendations.push(`Optimiser les routes lentes: ${routesList}`);
    }
    
    return recommendations;
  }
};

export default baselineMetricsCollector;
