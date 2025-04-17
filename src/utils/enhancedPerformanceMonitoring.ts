/**
 * Système amélioré de monitoring des performances pour Velo-Altitude
 * Fournit des métriques détaillées et des analyses pour optimiser l'expérience utilisateur
 */

import { ENV } from '../config/environment';
import performanceConfig, { getDeviceTier } from '../config/performance';

// Interfaces pour les métriques de performance
interface PerformanceReport {
  timestamp: number;
  metrics: PerformanceMetrics;
  recommendations: string[];
  criticalIssues: string[];
}

interface PerformanceMetrics {
  interactions: {
    avg: number;
    p95: number;
    count: number;
    byType: Record<string, number[]>;
  };
  loading: {
    critical: {
      avg: number;
      max: number;
    };
    resources: Map<string, number>;
  };
  cache: {
    hitRate: number;
    size: number;
    byKey: Record<string, { hits: number; misses: number }>;
  };
  memory: {
    usage: number;
    limit: number;
  };
  vitals: {
    fcp: number;
    lcp: number;
    cls: number;
    fid: number;
    ttfb: number;
  };
}

/**
 * Système amélioré de monitoring des performances
 */
export const enhancedPerformanceMonitoring = {
  // Métriques de performance
  metrics: {
    interactions: {
      avg: 0,
      p95: 0,
      count: 0,
      byType: {} as Record<string, number[]>
    },
    loading: {
      critical: {
        avg: 0,
        max: 0
      },
      resources: new Map<string, number>()
    },
    cache: {
      hitRate: 0,
      size: 0,
      byKey: {} as Record<string, { hits: number; misses: number }>
    },
    memory: {
      usage: 0,
      limit: 0
    },
    vitals: {
      fcp: 0,
      lcp: 0,
      cls: 0,
      fid: 0,
      ttfb: 0
    }
  },
  
  // Suivi des interactions utilisateur
  userInteractions: new Map<string, number[]>(),
  
  // Ressources critiques à surveiller
  criticalResources: new Set([
    'main.js',
    'vendor.js',
    'three.js',
    'material-ui.js',
    'cols-data.json',
    'routes.json',
    'training-programs.json'
  ]),
  
  // Seuils d'alerte
  thresholds: {
    interaction: 100, // ms
    resourceLoading: 1000, // ms
    cacheHitRate: 0.5, // 50%
    memoryUsage: 0.8, // 80% de la limite
    cls: 0.1, // Cumulative Layout Shift
    fid: 100, // First Input Delay (ms)
    ttfb: 600, // Time to First Byte (ms)
  },
  
  /**
   * Initialise le système de monitoring
   */
  init(): void {
    // Configurer les observateurs de performance si disponibles
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        // Observer les interactions utilisateur
        if ('interaction' in PerformanceObserver.supportedEntryTypes) {
          const interactionObserver = new PerformanceObserver((entryList) => {
            entryList.getEntries().forEach(entry => {
              // @ts-ignore - La propriété interactionId n'est pas dans la définition standard
              this.trackInteraction(entry.name, entry.duration, entry.interactionId);
            });
          });
          interactionObserver.observe({ type: 'interaction', buffered: true });
        }
        
        // Observer les ressources
        const resourceObserver = new PerformanceObserver((entryList) => {
          entryList.getEntries().forEach(entry => {
            const resourceName = entry.name.split('/').pop() || '';
            this.trackResourceLoading(entry, resourceName);
          });
        });
        resourceObserver.observe({ type: 'resource', buffered: true });
        
        // Observer les métriques Web Vitals
        this.observeWebVitals();
        
        console.info('Monitoring de performance amélioré initialisé');
      } catch (e) {
        console.error('Erreur lors de l\'initialisation du monitoring de performance:', e);
      }
    }
    
    // Configurer le monitoring de la mémoire
    this.monitorMemoryUsage();
    
    // Générer des rapports périodiques
    if (ENV.monitoring?.enabled) {
      setInterval(() => {
        this.generateReport();
      }, ENV.monitoring.reportInterval || 60000); // Par défaut toutes les minutes
    }
  },
  
  /**
   * Observe les métriques Web Vitals
   */
  observeWebVitals(): void {
    // First Contentful Paint
    const fcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const fcp = entries[0]?.startTime || 0;
      this.metrics.vitals.fcp = fcp;
      
      if (fcp > performanceConfig.timeToInteractiveTargets[getDeviceTier()] * 0.5) {
        console.warn(`FCP lent: ${Math.round(fcp)}ms`);
      }
    });
    fcpObserver.observe({ type: 'paint', buffered: true });
    
    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lcp = entries[entries.length - 1]?.startTime || 0;
      this.metrics.vitals.lcp = lcp;
      
      if (lcp > performanceConfig.timeToInteractiveTargets[getDeviceTier()] * 0.8) {
        console.warn(`LCP lent: ${Math.round(lcp)}ms`);
      }
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    
    // Cumulative Layout Shift
    const clsObserver = new PerformanceObserver((entryList) => {
      let clsValue = 0;
      entryList.getEntries().forEach(entry => {
        // @ts-ignore - La propriété value n'est pas dans la définition standard
        clsValue += entry.value || 0;
      });
      
      this.metrics.vitals.cls = clsValue;
      
      if (clsValue > this.thresholds.cls) {
        console.warn(`CLS élevé: ${clsValue.toFixed(3)}`);
      }
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });
    
    // First Input Delay
    const fidObserver = new PerformanceObserver((entryList) => {
      entryList.getEntries().forEach(entry => {
        // @ts-ignore - La propriété processingStart et startTime ne sont pas dans la définition standard
        const fid = entry.processingStart - entry.startTime;
        this.metrics.vitals.fid = fid;
        
        if (fid > this.thresholds.fid) {
          console.warn(`FID lent: ${Math.round(fid)}ms`);
        }
      });
    });
    fidObserver.observe({ type: 'first-input', buffered: true });
    
    // Time to First Byte
    const navigationObserver = new PerformanceObserver((entryList) => {
      const navigationEntry = entryList.getEntries()[0];
      // @ts-ignore - La propriété responseStart et requestStart ne sont pas dans la définition standard
      const ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
      this.metrics.vitals.ttfb = ttfb;
      
      if (ttfb > this.thresholds.ttfb) {
        console.warn(`TTFB lent: ${Math.round(ttfb)}ms`);
      }
    });
    navigationObserver.observe({ type: 'navigation', buffered: true });
  },
  
  /**
   * Surveille l'utilisation de la mémoire
   */
  monitorMemoryUsage(): void {
    // Vérifier si l'API performance.memory est disponible (Chrome uniquement)
    const checkMemory = () => {
      if (typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
        // @ts-ignore - L'API memory n'est pas standard
        const { usedJSHeapSize, jsHeapSizeLimit } = performance.memory;
        
        this.metrics.memory = {
          usage: usedJSHeapSize,
          limit: jsHeapSizeLimit
        };
        
        const usageRatio = usedJSHeapSize / jsHeapSizeLimit;
        if (usageRatio > this.thresholds.memoryUsage) {
          console.warn(`Utilisation mémoire élevée: ${Math.round(usageRatio * 100)}%`);
        }
      }
    };
    
    // Vérifier la mémoire périodiquement
    setInterval(checkMemory, 10000);
    checkMemory();
  },
  
  /**
   * Surveille une interaction utilisateur
   */
  trackInteraction(type: string, duration: number, id?: string): void {
    if (!this.userInteractions.has(type)) {
      this.userInteractions.set(type, []);
    }
    
    const interactions = this.userInteractions.get(type)!;
    interactions.push(duration);
    
    // Garder uniquement les 100 dernières interactions
    if (interactions.length > 100) {
      interactions.shift();
    }
    
    // Mettre à jour les métriques
    const allInteractions = Array.from(this.userInteractions.values()).flat();
    const avg = allInteractions.reduce((a, b) => a + b, 0) / allInteractions.length;
    
    // Calculer le 95e percentile
    const sorted = [...allInteractions].sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);
    const p95 = sorted[p95Index] || 0;
    
    this.metrics.interactions = {
      avg,
      p95,
      count: allInteractions.length,
      byType: Object.fromEntries(Array.from(this.userInteractions.entries()))
    };
    
    // Alerter si l'interaction est lente
    if (duration > this.thresholds.interaction) {
      console.warn(`Interaction '${type}' lente: ${Math.round(duration)}ms${id ? ` (ID: ${id})` : ''}`);
    }
  },
  
  /**
   * Surveille le chargement d'une ressource
   */
  trackResourceLoading(resource: PerformanceResourceTiming, resourceName: string): void {
    // Extraire le nom de fichier de l'URL
    const fileName = resourceName.split('?')[0]; // Enlever les paramètres de requête
    
    // Surveiller les ressources critiques
    if (this.criticalResources.has(fileName)) {
      this.metrics.loading.resources.set(fileName, resource.duration);
      
      // Calculer la moyenne et le maximum pour les ressources critiques
      const durations = Array.from(this.metrics.loading.resources.values());
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      const max = Math.max(...durations);
      
      this.metrics.loading.critical = { avg, max };
      
      // Alerter si la ressource est lente à charger
      if (resource.duration > this.thresholds.resourceLoading) {
        console.warn(`Ressource critique '${fileName}' lente à charger: ${Math.round(resource.duration)}ms`);
      }
    }
  },
  
  /**
   * Surveille l'efficacité du cache
   */
  trackCacheEfficiency(cacheKey: string, hitOrMiss: 'hit' | 'miss'): void {
    if (!this.metrics.cache.byKey[cacheKey]) {
      this.metrics.cache.byKey[cacheKey] = { hits: 0, misses: 0 };
    }
    
    const stats = this.metrics.cache.byKey[cacheKey];
    if (hitOrMiss === 'hit') {
      stats.hits++;
    } else {
      stats.misses++;
    }
    
    // Calculer le taux de succès global
    let totalHits = 0;
    let totalRequests = 0;
    
    Object.values(this.metrics.cache.byKey).forEach(stat => {
      totalHits += stat.hits;
      totalRequests += stat.hits + stat.misses;
    });
    
    this.metrics.cache.hitRate = totalRequests > 0 ? totalHits / totalRequests : 0;
    this.metrics.cache.size = Object.keys(this.metrics.cache.byKey).length;
    
    // Alerter si le taux de succès est faible pour une clé fréquemment utilisée
    const keyTotal = stats.hits + stats.misses;
    if (keyTotal > 10 && stats.hits / keyTotal < this.thresholds.cacheHitRate) {
      console.warn(`Taux de succès du cache faible pour '${cacheKey}': ${Math.round((stats.hits / keyTotal) * 100)}%`);
    }
  },
  
  /**
   * Vérifie les problèmes de performance critiques
   */
  checkCriticalIssues(): string[] {
    const criticalIssues: string[] = [];
    
    // Vérifier les métriques Web Vitals
    if (this.metrics.vitals.lcp > 2500) {
      criticalIssues.push(`LCP élevé (${Math.round(this.metrics.vitals.lcp)}ms)`);
    }
    
    if (this.metrics.vitals.fid > 100) {
      criticalIssues.push(`FID élevé (${Math.round(this.metrics.vitals.fid)}ms)`);
    }
    
    if (this.metrics.vitals.cls > 0.1) {
      criticalIssues.push(`CLS élevé (${this.metrics.vitals.cls.toFixed(3)})`);
    }
    
    // Vérifier les interactions lentes
    if (this.metrics.interactions.p95 > 200) {
      criticalIssues.push(`Interactions lentes (P95: ${Math.round(this.metrics.interactions.p95)}ms)`);
    }
    
    // Vérifier la mémoire
    if (this.metrics.memory.usage / this.metrics.memory.limit > 0.9) {
      criticalIssues.push(`Utilisation mémoire critique (${Math.round((this.metrics.memory.usage / this.metrics.memory.limit) * 100)}%)`);
    }
    
    return criticalIssues;
  },
  
  /**
   * Génère des recommandations d'optimisation
   */
  generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    // Recommandations basées sur les métriques Web Vitals
    if (this.metrics.vitals.lcp > 2000) {
      recommendations.push('Optimiser le chargement des images et des ressources principales');
    }
    
    if (this.metrics.vitals.fid > 50) {
      recommendations.push('Réduire la complexité JavaScript sur le thread principal');
    }
    
    if (this.metrics.vitals.cls > 0.05) {
      recommendations.push('Améliorer la stabilité visuelle en fixant les dimensions des éléments');
    }
    
    // Recommandations basées sur les interactions
    const slowInteractionTypes = Object.entries(this.metrics.interactions.byType)
      .filter(([type, durations]) => {
        const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
        return avg > this.thresholds.interaction;
      })
      .map(([type]) => type);
    
    if (slowInteractionTypes.length > 0) {
      recommendations.push(`Optimiser les interactions: ${slowInteractionTypes.join(', ')}`);
    }
    
    // Recommandations basées sur le cache
    const lowHitRateKeys = Object.entries(this.metrics.cache.byKey)
      .filter(([key, stats]) => {
        const total = stats.hits + stats.misses;
        return total > 10 && stats.hits / total < this.thresholds.cacheHitRate;
      })
      .map(([key]) => key);
    
    if (lowHitRateKeys.length > 0) {
      recommendations.push(`Améliorer la stratégie de mise en cache pour: ${lowHitRateKeys.join(', ')}`);
    }
    
    return recommendations;
  },
  
  /**
   * Génère un rapport de performance
   */
  generateReport(): PerformanceReport {
    const criticalIssues = this.checkCriticalIssues();
    const recommendations = this.generateRecommendations();
    
    const report: PerformanceReport = {
      timestamp: Date.now(),
      metrics: { ...this.metrics },
      recommendations,
      criticalIssues
    };
    
    // Envoyer le rapport au service de monitoring si configuré
    if (ENV.monitoring?.endpoint) {
      this.sendReport(report);
    }
    
    // Afficher un résumé dans la console
    console.info(`Rapport de performance - ${new Date().toISOString()}`);
    
    if (criticalIssues.length > 0) {
      console.warn('Problèmes critiques détectés:', criticalIssues);
    }
    
    if (recommendations.length > 0) {
      console.info('Recommandations:', recommendations);
    }
    
    return report;
  },
  
  /**
   * Envoie un rapport au service de monitoring
   */
  sendReport(report: PerformanceReport): void {
    if (!ENV.monitoring?.endpoint) return;
    
    fetch(ENV.monitoring.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': ENV.monitoring.apiKey || ''
      },
      body: JSON.stringify(report)
    }).catch(err => {
      console.error('Erreur lors de l\'envoi du rapport de performance:', err);
    });
  },
  
  /**
   * Réinitialise les métriques
   */
  resetMetrics(): void {
    this.userInteractions.clear();
    
    this.metrics = {
      interactions: {
        avg: 0,
        p95: 0,
        count: 0,
        byType: {}
      },
      loading: {
        critical: {
          avg: 0,
          max: 0
        },
        resources: new Map()
      },
      cache: {
        hitRate: 0,
        size: 0,
        byKey: {}
      },
      memory: {
        usage: 0,
        limit: 0
      },
      vitals: {
        fcp: 0,
        lcp: 0,
        cls: 0,
        fid: 0,
        ttfb: 0
      }
    };
  }
};

export default enhancedPerformanceMonitoring;
