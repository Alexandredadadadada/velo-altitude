/**
 * Service de suivi des Web Vitals pour Velo-Altitude
 * Mesure et rapporte les métriques de performance critiques
 */

import { getCLS, getFID, getLCP, getTTFB, getFCP } from 'web-vitals';

// Objectifs de performance à atteindre
const PERFORMANCE_TARGETS = {
  CLS: 0.1,    // Cumulative Layout Shift
  FID: 100,    // First Input Delay (ms)
  LCP: 2500,   // Largest Contentful Paint (ms)
  TTFB: 800,   // Time to First Byte (ms)
  FCP: 1200,   // First Contentful Paint (ms)
  TTI: 2800    // Time to Interactive (ms)
};

class WebVitalsMonitor {
  constructor(reportCallback = null) {
    this.metricsCollected = {};
    this.reportCallback = reportCallback || this._defaultReportCallback;
    
    // Indicateur pour savoir si les métriques initiales ont été collectées
    this.initialMetricsCollected = false;
    
    // Activer automatiquement le monitoring
    this.initMonitoring();
  }

  /**
   * Initialise le suivi des métriques Web Vitals
   */
  initMonitoring() {
    // Surveiller les métriques Core Web Vitals
    getCLS(this._handleMetric.bind(this));
    getFID(this._handleMetric.bind(this));
    getLCP(this._handleMetric.bind(this));
    getTTFB(this._handleMetric.bind(this));
    getFCP(this._handleMetric.bind(this));
    
    // Surveiller Time to Interactive (TTI) si la bibliothèque est disponible
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this._monitorTTI();
    }
    
    // Surveillance de la taille du bundle
    this._monitorResourceSizes();
    
    // Surveiller l'état de chargement de la page
    window.addEventListener('load', () => {
      // Attendre un peu pour que toutes les métriques se stabilisent
      setTimeout(() => {
        this._collectNavigationTiming();
        this._checkPerformanceTargets();
        this.initialMetricsCollected = true;
      }, 1000);
    });
  }

  /**
   * Traitement unifié des métriques
   * @private
   */
  _handleMetric(metric) {
    // Stocker la métrique
    this.metricsCollected[metric.name] = metric;
    
    // Envoyer au callback
    this.reportCallback(metric);
    
    // Vérifier si la métrique atteint l'objectif
    if (PERFORMANCE_TARGETS[metric.name.toUpperCase()]) {
      const target = PERFORMANCE_TARGETS[metric.name.toUpperCase()];
      metric.isGood = metric.value <= target;
      
      // Log pour debug
      console.log(`[WebVitals] ${metric.name}: ${metric.value} (Target: ${target}, Status: ${metric.isGood ? 'Good' : 'Needs improvement'})`);
    }
  }

  /**
   * Mesure le Time to Interactive (approximation)
   * @private
   */
  _monitorTTI() {
    // Cette implémentation est simplifiée par rapport à l'algorithme complet de TTI
    let longTasksObserver;
    let firstInteractionTime = 0;
    let ttiResolved = false;
    
    try {
      // Détecter la première interaction
      const firstInteractionDetected = () => {
        if (!firstInteractionTime) {
          firstInteractionTime = performance.now();
        }
      };
      
      // Écouter les événements d'interaction
      ['pointerdown', 'keydown', 'touchstart'].forEach(event => {
        window.addEventListener(event, firstInteractionDetected, { once: true, passive: true });
      });
      
      // Observer les longues tâches
      if ('PerformanceObserver' in window) {
        longTasksObserver = new PerformanceObserver(entries => {
          // Traiter les longues tâches
          const lastTask = entries.getEntries().pop();
          if (lastTask && !ttiResolved) {
            // Le TTI est approximativement quand les dernières longues tâches sont terminées
            const endTime = lastTask.startTime + lastTask.duration;
            
            // La page est interactive quand il n'y a plus de longues tâches pendant un certain temps
            setTimeout(() => {
              if (!ttiResolved) {
                ttiResolved = true;
                const ttiValue = endTime;
                this._handleMetric({
                  name: 'TTI',
                  value: ttiValue,
                  delta: ttiValue,
                  id: 'v1-TTI'
                });
                
                // Nettoyer l'observer
                if (longTasksObserver) {
                  longTasksObserver.disconnect();
                }
              }
            }, 5000); // Attendre 5s sans longues tâches pour considérer le TTI stabilisé
          }
        });
        
        longTasksObserver.observe({ entryTypes: ['longtask'] });
      }
    } catch (e) {
      console.warn('[WebVitals] Error monitoring TTI:', e);
    }
  }

  /**
   * Collecte les métriques de Navigation Timing
   * @private
   */
  _collectNavigationTiming() {
    if (performance && performance.getEntriesByType) {
      const navEntries = performance.getEntriesByType('navigation');
      
      if (navEntries && navEntries.length > 0) {
        const navTiming = navEntries[0];
        
        this.metricsCollected.DOMContentLoaded = {
          name: 'DOMContentLoaded',
          value: navTiming.domContentLoadedEventEnd - navTiming.fetchStart
        };
        
        this.metricsCollected.LoadComplete = {
          name: 'LoadComplete',
          value: navTiming.loadEventEnd - navTiming.fetchStart
        };
        
        this.metricsCollected.TimeToFirstByte = {
          name: 'TimeToFirstByte',
          value: navTiming.responseStart - navTiming.requestStart
        };
        
        // Logging
        console.log('[WebVitals] Navigation Timing:', {
          DOMContentLoaded: this.metricsCollected.DOMContentLoaded.value,
          LoadComplete: this.metricsCollected.LoadComplete.value,
          TimeToFirstByte: this.metricsCollected.TimeToFirstByte.value
        });
      }
    }
  }

  /**
   * Surveille la taille des ressources chargées
   * @private
   */
  _monitorResourceSizes() {
    if (performance && performance.getEntriesByType) {
      window.addEventListener('load', () => {
        const resources = performance.getEntriesByType('resource');
        
        // Calculer les statistiques
        let totalTransferSize = 0;
        let jsSize = 0;
        let cssSize = 0;
        let imageSize = 0;
        let fontSize = 0;
        let otherSize = 0;
        
        resources.forEach(resource => {
          const size = resource.transferSize || 0;
          totalTransferSize += size;
          
          if (resource.name.match(/\.js($|\?)/)) {
            jsSize += size;
          } else if (resource.name.match(/\.css($|\?)/)) {
            cssSize += size;
          } else if (resource.name.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)($|\?)/i)) {
            imageSize += size;
          } else if (resource.name.match(/\.(woff|woff2|ttf|otf|eot)($|\?)/i)) {
            fontSize += size;
          } else {
            otherSize += size;
          }
        });
        
        this.metricsCollected.ResourceSizes = {
          name: 'ResourceSizes',
          total: totalTransferSize,
          js: jsSize,
          css: cssSize,
          images: imageSize,
          fonts: fontSize,
          other: otherSize,
          count: resources.length
        };
        
        // Logguer les statistiques
        console.log('[WebVitals] Resource sizes:', {
          totalKB: Math.round(totalTransferSize / 1024),
          jsKB: Math.round(jsSize / 1024),
          cssKB: Math.round(cssSize / 1024),
          imagesKB: Math.round(imageSize / 1024),
          fontsKB: Math.round(fontSize / 1024),
          otherKB: Math.round(otherSize / 1024),
          resourceCount: resources.length
        });
      });
    }
  }

  /**
   * Vérifie si les métriques respectent les objectifs de performance
   * @private
   */
  _checkPerformanceTargets() {
    const results = {
      passedTests: 0,
      totalTests: 0,
      metrics: {}
    };
    
    Object.entries(PERFORMANCE_TARGETS).forEach(([metricName, targetValue]) => {
      const lcMetricName = metricName.toLowerCase();
      const metric = this.metricsCollected[lcMetricName];
      
      results.totalTests++;
      
      if (metric) {
        const value = metric.value;
        const isPassing = value <= targetValue;
        
        if (isPassing) {
          results.passedTests++;
        }
        
        results.metrics[metricName] = {
          actual: value,
          target: targetValue,
          isPassing,
          delta: value - targetValue
        };
      } else {
        results.metrics[metricName] = {
          actual: null,
          target: targetValue,
          isPassing: false,
          delta: null,
          missing: true
        };
      }
    });
    
    results.overallScore = results.totalTests > 0 
      ? Math.round((results.passedTests / results.totalTests) * 100) 
      : 0;
    
    this.performanceResults = results;
    
    // Logging
    console.log('[WebVitals] Performance check results:', {
      score: `${results.overallScore}%`,
      passed: `${results.passedTests}/${results.totalTests}`,
      details: results.metrics
    });
    
    return results;
  }

  /**
   * Callback par défaut pour le rapport des métriques
   * @private
   */
  _defaultReportCallback(metric) {
    // Par défaut, uniquement logger dans la console
    console.log('[WebVitals]', metric.name, metric.value);
    
    // Envoyer à Google Analytics si disponible
    if (window.gtag) {
      window.gtag('event', 'web_vitals', {
        event_category: 'Web Vitals',
        event_label: metric.id,
        value: Math.round(metric.value),
        non_interaction: true,
      });
    }
  }

  /**
   * Obtient toutes les métriques collectées
   * @public
   */
  getAllMetrics() {
    return this.metricsCollected;
  }

  /**
   * Obtient les résultats de performance
   * @public
   */
  getPerformanceResults() {
    if (!this.performanceResults) {
      return this._checkPerformanceTargets();
    }
    return this.performanceResults;
  }
  
  /**
   * Vérifie si les métriques essentielles sont collectées
   * @public
   */
  areMetricsCollected() {
    return this.initialMetricsCollected;
  }
}

// Exporter une instance singleton
const webVitalsMonitor = new WebVitalsMonitor();
export default webVitalsMonitor;
