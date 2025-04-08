/**
 * Service de surveillance des performances pour l'application Velo-Altitude
 * Gère la collection, l'analyse et le reporting des métriques de performance
 */

// Interface pour les métriques de base
interface BaseMetrics {
  timestamp: number;
  // URL ou emplacement dans l'application
  location?: string;
}

// Métriques de rendu de composant
interface ComponentRenderMetrics extends BaseMetrics {
  componentId: string;
  componentName: string;
  renderCount: number;
  renderTime: number;
  props?: string;
}

// Métriques de démontage de composant
interface ComponentUnmountMetrics extends BaseMetrics {
  componentId: string;
  totalRenderCount: number;
  totalLifetime: number;
}

// Métriques de navigation
interface NavigationMetrics extends BaseMetrics {
  from: string;
  to: string;
  loadTime: number;
  isInitial: boolean;
}

// Métriques de ressource
interface ResourceMetrics extends BaseMetrics {
  resourceType: 'script' | 'stylesheet' | 'image' | 'font' | 'fetch' | 'xmlhttprequest' | 'other';
  resourceUrl: string;
  duration: number;
  size?: number;
  status?: number;
}

// Métriques WebGL
interface WebGLMetrics extends BaseMetrics {
  fps: number;
  renderCalls: number;
  triangles: number;
  textures: {
    count: number;
    cached: number;
  };
  geometries: number;
  devicePerformance: 'high' | 'medium' | 'low';
  currentLOD: number;
}

// Configuration du moniteur
interface PerformanceMonitorConfig {
  // Activer/désactiver le monitoring
  enabled: boolean;
  // Intervalle de reporting en ms
  reportingInterval: number;
  // Seuil d'alerte pour le FPS (WebGL)
  fpsThreshold: number;
  // Seuil d'alerte pour le temps de rendu
  renderTimeThreshold: number;
  // Stockage des métriques
  storage: {
    // Durée de conservation des métriques en ms
    retentionPeriod: number;
    // Taille maximale du stockage en entrées
    maxEntries: number;
  };
  // Reporting aux services externes
  reporting: {
    // Envoyer à un service d'analyse
    analyticsService: boolean;
    // URL de l'endpoint de reporting
    endpoint?: string;
    // Envoyer les métriques à la console
    console: boolean;
  };
}

// Classe principale PerformanceMonitor
class PerformanceMonitorService {
  private config: PerformanceMonitorConfig;
  
  // Stockage des métriques
  private renderMetrics: ComponentRenderMetrics[] = [];
  private navigationMetrics: NavigationMetrics[] = [];
  private resourceMetrics: ResourceMetrics[] = [];
  private webGLMetrics: WebGLMetrics[] = [];
  
  // Identifiants des intervalles
  private reportingIntervalId: number | null = null;
  private cleanupIntervalId: number | null = null;
  
  // Instantané des mesures de performance Web
  private perfEntryBuffer: PerformanceEntry[] = [];
  
  // Configuration par défaut
  private defaultConfig: PerformanceMonitorConfig = {
    enabled: process.env.NODE_ENV === 'production',
    reportingInterval: 60 * 1000, // 1 minute
    fpsThreshold: 30,
    renderTimeThreshold: 100, // ms
    storage: {
      retentionPeriod: 24 * 60 * 60 * 1000, // 24 heures
      maxEntries: 1000
    },
    reporting: {
      analyticsService: false,
      console: process.env.NODE_ENV === 'development'
    }
  };

  constructor(customConfig: Partial<PerformanceMonitorConfig> = {}) {
    // Fusion de la configuration
    this.config = {
      ...this.defaultConfig,
      ...customConfig,
      storage: {
        ...this.defaultConfig.storage,
        ...customConfig.storage
      },
      reporting: {
        ...this.defaultConfig.reporting,
        ...customConfig.reporting
      }
    };
    
    // Initialiser si activé
    if (this.config.enabled) {
      this.initialize();
    }
  }
  
  /**
   * Initialise le moniteur de performance
   */
  private initialize(): void {
    // Configurer le reporting périodique
    this.setupReporting();
    
    // Configurer le nettoyage périodique
    this.setupCleanup();
    
    // Observer les métriques Web
    this.observeWebPerformance();
    
    // S'abonner aux événements de navigation
    this.observeNavigation();
    
    console.log('[PerformanceMonitor] Initialized');
  }
  
  /**
   * Configure le reporting périodique
   */
  private setupReporting(): void {
    if (typeof window !== 'undefined') {
      this.reportingIntervalId = window.setInterval(() => {
        this.reportMetrics();
      }, this.config.reportingInterval);
    }
  }
  
  /**
   * Configure le nettoyage périodique des anciennes métriques
   */
  private setupCleanup(): void {
    if (typeof window !== 'undefined') {
      this.cleanupIntervalId = window.setInterval(() => {
        this.cleanupOldMetrics();
      }, this.config.storage.retentionPeriod / 10);
    }
  }
  
  /**
   * Observer les métriques de performance Web standard
   */
  private observeWebPerformance(): void {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      // Observer pour les métriques de ressources
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          
          entries.forEach(entry => {
            if (entry.entryType === 'resource') {
              const resourceEntry = entry as PerformanceResourceTiming;
              
              this.recordResourceMetric({
                timestamp: Date.now(),
                resourceType: resourceEntry.initiatorType as any,
                resourceUrl: resourceEntry.name,
                duration: resourceEntry.duration,
                size: resourceEntry.transferSize,
                status: 0 // Non disponible dans l'API
              });
            }
          });
          
          this.perfEntryBuffer = [...this.perfEntryBuffer, ...entries];
          
          // Limiter la taille du buffer
          if (this.perfEntryBuffer.length > 100) {
            this.perfEntryBuffer = this.perfEntryBuffer.slice(-100);
          }
        });
        
        resourceObserver.observe({ entryTypes: ['resource'] });
      } catch (error) {
        console.error('[PerformanceMonitor] Resource observation error:', error);
      }
      
      // Observer pour les métriques de peinture
      try {
        const paintObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          this.perfEntryBuffer = [...this.perfEntryBuffer, ...entries];
        });
        
        paintObserver.observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
      } catch (error) {
        console.error('[PerformanceMonitor] Paint observation error:', error);
      }
    }
  }
  
  /**
   * Observer les événements de navigation
   */
  private observeNavigation(): void {
    if (typeof window !== 'undefined') {
      // Enregistrer la navigation initiale
      this.recordNavigationMetric({
        timestamp: Date.now(),
        from: 'initial',
        to: window.location.pathname,
        loadTime: 0,
        isInitial: true
      });
      
      // Capturer les temps de performance initiale quand disponibles
      window.addEventListener('load', () => {
        if (window.performance && window.performance.timing) {
          const timing = window.performance.timing;
          const loadTime = timing.loadEventEnd - timing.navigationStart;
          
          this.recordNavigationMetric({
            timestamp: Date.now(),
            from: 'initial',
            to: window.location.pathname,
            loadTime,
            isInitial: true
          });
        }
      });
      
      // Écouter les changements d'historique pour SPA
      const originalPushState = window.history.pushState;
      const originalReplaceState = window.history.replaceState;
      
      window.history.pushState = (...args) => {
        originalPushState.apply(window.history, args);
        this.handleRouteChange();
      };
      
      window.history.replaceState = (...args) => {
        originalReplaceState.apply(window.history, args);
        this.handleRouteChange();
      };
      
      window.addEventListener('popstate', () => {
        this.handleRouteChange();
      });
    }
  }
  
  /**
   * Gère un changement de route
   */
  private handleRouteChange(): void {
    const timestamp = Date.now();
    const to = window.location.pathname;
    
    // Simuler un temps de chargement pour les navigations SPA
    this.recordNavigationMetric({
      timestamp,
      from: 'spa',
      to,
      loadTime: 0, // Sera mis à jour
      isInitial: false
    });
    
    // Attendre un moment pour avoir une estimation du temps de chargement
    setTimeout(() => {
      // Mettre à jour la dernière métrique de navigation avec un temps de chargement estimé
      const lastIndex = this.navigationMetrics.length - 1;
      if (lastIndex >= 0 && this.navigationMetrics[lastIndex].to === to) {
        this.navigationMetrics[lastIndex].loadTime = Date.now() - timestamp;
      }
    }, 100);
  }
  
  /**
   * Enregistre une métrique de rendu de composant
   */
  public recordComponentRender(componentId: string, componentName: string, metrics: Partial<ComponentRenderMetrics>): void {
    if (!this.config.enabled) return;
    
    const renderMetric: ComponentRenderMetrics = {
      timestamp: Date.now(),
      componentId,
      componentName,
      renderCount: metrics.renderCount || 1,
      renderTime: metrics.renderTime || 0,
      props: metrics.props,
      location: window.location.pathname
    };
    
    this.renderMetrics.push(renderMetric);
    
    // Vérifier le seuil de temps de rendu
    if (renderMetric.renderTime > this.config.renderTimeThreshold) {
      console.warn(`[PerformanceMonitor] Slow render detected for ${componentName}: ${renderMetric.renderTime.toFixed(2)}ms`);
    }
    
    this.enforceStorageLimits();
  }
  
  /**
   * Enregistre une métrique de démontage de composant
   */
  public recordComponentUnmount(componentId: string, metrics: Partial<ComponentUnmountMetrics>): void {
    if (!this.config.enabled) return;
    
    const unmountMetric: ComponentUnmountMetrics = {
      timestamp: Date.now(),
      componentId,
      totalRenderCount: metrics.totalRenderCount || 0,
      totalLifetime: metrics.totalLifetime || 0,
      location: window.location.pathname
    };
    
    // Analyse des métriques de cycle de vie
    if (this.config.reporting.console) {
      console.debug(`[PerformanceMonitor] Component ${componentId} unmounted after ${unmountMetric.totalLifetime.toFixed(2)}ms with ${unmountMetric.totalRenderCount} renders`);
    }
    
    this.enforceStorageLimits();
  }
  
  /**
   * Enregistre une métrique de navigation
   */
  private recordNavigationMetric(metric: NavigationMetrics): void {
    if (!this.config.enabled) return;
    
    this.navigationMetrics.push(metric);
    
    if (this.config.reporting.console) {
      console.debug(`[PerformanceMonitor] Navigation: ${metric.from} -> ${metric.to} (${metric.loadTime}ms)`);
    }
    
    this.enforceStorageLimits();
  }
  
  /**
   * Enregistre une métrique de ressource
   */
  private recordResourceMetric(metric: ResourceMetrics): void {
    if (!this.config.enabled) return;
    
    this.resourceMetrics.push(metric);
    this.enforceStorageLimits();
  }
  
  /**
   * Enregistre une métrique WebGL
   */
  public recordWebGLMetrics(metrics: WebGLMetrics): void {
    if (!this.config.enabled) return;
    
    // Ajouter un timestamp si non fourni
    const metricWithTimestamp: WebGLMetrics = {
      ...metrics,
      timestamp: metrics.timestamp || Date.now()
    };
    
    this.webGLMetrics.push(metricWithTimestamp);
    
    // Vérifier le seuil de FPS
    if (metrics.fps < this.config.fpsThreshold) {
      console.warn(`[PerformanceMonitor] Low FPS detected: ${metrics.fps.toFixed(1)} FPS (threshold: ${this.config.fpsThreshold})`);
    }
    
    this.enforceStorageLimits();
  }
  
  /**
   * Applique les limites de stockage
   */
  private enforceStorageLimits(): void {
    // Limiter le nombre d'entrées
    if (this.renderMetrics.length > this.config.storage.maxEntries) {
      this.renderMetrics = this.renderMetrics.slice(-this.config.storage.maxEntries);
    }
    
    if (this.navigationMetrics.length > this.config.storage.maxEntries) {
      this.navigationMetrics = this.navigationMetrics.slice(-this.config.storage.maxEntries);
    }
    
    if (this.resourceMetrics.length > this.config.storage.maxEntries) {
      this.resourceMetrics = this.resourceMetrics.slice(-this.config.storage.maxEntries);
    }
    
    if (this.webGLMetrics.length > this.config.storage.maxEntries) {
      this.webGLMetrics = this.webGLMetrics.slice(-this.config.storage.maxEntries);
    }
  }
  
  /**
   * Nettoie les anciennes métriques
   */
  private cleanupOldMetrics(): void {
    const now = Date.now();
    const threshold = now - this.config.storage.retentionPeriod;
    
    this.renderMetrics = this.renderMetrics.filter(m => m.timestamp >= threshold);
    this.navigationMetrics = this.navigationMetrics.filter(m => m.timestamp >= threshold);
    this.resourceMetrics = this.resourceMetrics.filter(m => m.timestamp >= threshold);
    this.webGLMetrics = this.webGLMetrics.filter(m => m.timestamp >= threshold);
  }
  
  /**
   * Rapporte les métriques
   */
  private reportMetrics(): void {
    if (!this.config.enabled) return;
    
    // Générer le rapport
    const report = {
      timestamp: Date.now(),
      components: {
        count: this.renderMetrics.length,
        slowRendersCount: this.renderMetrics.filter(m => m.renderTime > this.config.renderTimeThreshold).length,
        avgRenderTime: this.calculateAverage(this.renderMetrics.map(m => m.renderTime))
      },
      navigation: {
        count: this.navigationMetrics.length,
        avgLoadTime: this.calculateAverage(this.navigationMetrics.map(m => m.loadTime))
      },
      resources: {
        count: this.resourceMetrics.length,
        avgLoadTime: this.calculateAverage(this.resourceMetrics.map(m => m.duration)),
        byType: this.groupResourcesByType()
      },
      webGL: {
        avgFPS: this.calculateAverage(this.webGLMetrics.map(m => m.fps)),
        lowFPSCount: this.webGLMetrics.filter(m => m.fps < this.config.fpsThreshold).length
      }
    };
    
    // Reporter à la console si configuré
    if (this.config.reporting.console) {
      console.info('[PerformanceMonitor] Performance Report:', report);
    }
    
    // Reporter à un service externe si configuré
    if (this.config.reporting.analyticsService && this.config.reporting.endpoint) {
      this.sendReportToAnalyticsService(report);
    }
  }
  
  /**
   * Calcule la moyenne d'une série de nombres
   */
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((a, b) => a + b, 0);
    return sum / values.length;
  }
  
  /**
   * Groupe les ressources par type
   */
  private groupResourcesByType(): Record<string, number> {
    const result: Record<string, number> = {};
    
    this.resourceMetrics.forEach(metric => {
      const type = metric.resourceType;
      if (result[type]) {
        result[type]++;
      } else {
        result[type] = 1;
      }
    });
    
    return result;
  }
  
  /**
   * Envoie un rapport à un service d'analyse externe
   */
  private sendReportToAnalyticsService(report: any): void {
    if (!this.config.reporting.endpoint) return;
    
    fetch(this.config.reporting.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(report)
    }).catch(error => {
      console.error('[PerformanceMonitor] Failed to send report:', error);
    });
  }
  
  /**
   * Obtient les métriques de performance actuelles
   */
  public getCurrentMetrics(): any {
    return {
      components: {
        totalTracked: this.renderMetrics.length,
        activeCount: new Set(this.renderMetrics.map(m => m.componentId)).size,
        slowRenders: this.renderMetrics.filter(m => m.renderTime > this.config.renderTimeThreshold).length
      },
      navigation: {
        count: this.navigationMetrics.length,
        lastLoadTime: this.navigationMetrics.length > 0 ? this.navigationMetrics[this.navigationMetrics.length - 1].loadTime : 0
      },
      resources: {
        totalCount: this.resourceMetrics.length,
        lastMinuteCount: this.resourceMetrics.filter(m => m.timestamp > Date.now() - 60000).length
      },
      webGL: {
        currentFPS: this.webGLMetrics.length > 0 ? this.webGLMetrics[this.webGLMetrics.length - 1].fps : 0,
        averageFPS: this.calculateAverage(this.webGLMetrics.slice(-10).map(m => m.fps))
      }
    };
  }
  
  /**
   * Libère les ressources
   */
  public dispose(): void {
    if (this.reportingIntervalId !== null && typeof window !== 'undefined') {
      window.clearInterval(this.reportingIntervalId);
      this.reportingIntervalId = null;
    }
    
    if (this.cleanupIntervalId !== null && typeof window !== 'undefined') {
      window.clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
    }
  }
}

// Exporter une instance singleton
export const PerformanceMonitor = new PerformanceMonitorService();

// Exporter la classe pour les tests et l'utilisation personnalisée
export default PerformanceMonitorService;
