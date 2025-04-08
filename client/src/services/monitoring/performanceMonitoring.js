/**
 * Service de monitoring des performances pour Velo-Altitude
 * Implémente le suivi des performances côté client et intègre avec le backend
 */

import { ErrorTelemetryService } from '../ErrorTelemetryService';

class PerformanceMonitoringService {
  constructor() {
    this.metrics = {
      pageLoads: {},
      apiCalls: {},
      componentRenders: {},
      userInteractions: {}
    };
    
    this.config = {
      enabled: process.env.REACT_APP_ENABLE_MONITORING === 'true',
      sampleRate: 0.1, // 10% des sessions
      reportingInterval: 60000, // 1 minute
      apiEndpoint: '/api/monitoring/metrics',
      errorThreshold: 1000, // Temps de réponse considéré lent (ms)
    };
    
    // Initialiser le monitoring si activé
    if (this.config.enabled && Math.random() <= this.config.sampleRate) {
      this._initMonitoring();
    }
  }
  
  /**
   * Initialise le monitoring des performances
   */
  _initMonitoring() {
    // Enregistrer les métriques de navigation
    if (window.performance && window.performance.getEntriesByType) {
      this._captureNavigationMetrics();
    }
    
    // Observer les métriques Web Vitals
    this._observeWebVitals();
    
    // Mettre en place le reporting périodique
    this._setupPeriodicReporting();
    
    console.log('[PerformanceMonitoring] Initialized');
  }
  
  /**
   * Capture les métriques de navigation
   */
  _captureNavigationMetrics() {
    try {
      const navigationEntries = window.performance.getEntriesByType('navigation');
      if (navigationEntries.length > 0) {
        const nav = navigationEntries[0];
        this.metrics.pageLoads[window.location.pathname] = {
          loadTime: nav.loadEventEnd - nav.startTime,
          domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime,
          firstPaint: this._getFirstPaint(),
          timestamp: Date.now()
        };
      }
    } catch (error) {
      console.error('[PerformanceMonitoring] Error capturing navigation metrics:', error);
    }
  }
  
  /**
   * Obtient le temps du premier rendu
   */
  _getFirstPaint() {
    const paintEntries = window.performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? firstPaint.startTime : null;
  }
  
  /**
   * Observe les métriques Web Vitals
   */
  _observeWebVitals() {
    // Importer dynamiquement web-vitals pour ne pas affecter le chargement initial
    import('web-vitals').then(({ getCLS, getFID, getLCP }) => {
      getCLS(metric => this._reportWebVital('CLS', metric.value));
      getFID(metric => this._reportWebVital('FID', metric.value));
      getLCP(metric => this._reportWebVital('LCP', metric.value));
    }).catch(error => {
      console.error('[PerformanceMonitoring] Error loading web-vitals:', error);
    });
  }
  
  /**
   * Rapporte une métrique Web Vital
   */
  _reportWebVital(name, value) {
    if (!this.metrics.webVitals) {
      this.metrics.webVitals = {};
    }
    
    this.metrics.webVitals[name] = value;
  }
  
  /**
   * Configure le reporting périodique des métriques
   */
  _setupPeriodicReporting() {
    this.reportingInterval = setInterval(() => {
      this._reportMetrics();
    }, this.config.reportingInterval);
    
    // S'assurer que les métriques sont envoyées avant que l'utilisateur ne quitte la page
    window.addEventListener('beforeunload', () => {
      this._reportMetrics();
      clearInterval(this.reportingInterval);
    });
  }
  
  /**
   * Envoie les métriques collectées au backend
   */
  _reportMetrics() {
    if (Object.keys(this.metrics).length === 0) return;
    
    const payload = {
      metrics: this.metrics,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      // Ajouter des informations de session si disponibles
      sessionId: localStorage.getItem('session_id') || null
    };
    
    // Envoyer les métriques au backend en utilisant sendBeacon pour fiabilité
    if (navigator.sendBeacon) {
      navigator.sendBeacon(this.config.apiEndpoint, JSON.stringify(payload));
    } else {
      // Fallback vers fetch si sendBeacon n'est pas supporté
      fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(error => {
        console.error('[PerformanceMonitoring] Error reporting metrics:', error);
      });
    }
    
    // Réinitialiser certaines métriques après envoi
    this.metrics.apiCalls = {};
    this.metrics.componentRenders = {};
    this.metrics.userInteractions = {};
    // Conserver les métriques cumulatives comme pageLoads et webVitals
  }
  
  /**
   * Enregistre le temps de réponse d'un appel API
   */
  recordApiCall(endpoint, method, duration, statusCode) {
    if (!this.config.enabled) return;
    
    if (!this.metrics.apiCalls[endpoint]) {
      this.metrics.apiCalls[endpoint] = {
        count: 0,
        totalDuration: 0,
        errors: 0,
        methods: {}
      };
    }
    
    const endpointMetrics = this.metrics.apiCalls[endpoint];
    endpointMetrics.count += 1;
    endpointMetrics.totalDuration += duration;
    
    if (!endpointMetrics.methods[method]) {
      endpointMetrics.methods[method] = { count: 0, totalDuration: 0 };
    }
    endpointMetrics.methods[method].count += 1;
    endpointMetrics.methods[method].totalDuration += duration;
    
    // Capturer les erreurs
    if (statusCode >= 400) {
      endpointMetrics.errors += 1;
    }
    
    // Alerter sur les appels lents
    if (duration > this.config.errorThreshold) {
      console.warn(`[PerformanceMonitoring] Slow API call detected: ${method} ${endpoint} (${duration}ms)`);
      
      // Si activé, envoyer la télémétrie d'erreur immédiatement
      ErrorTelemetryService.reportPerformanceIssue({
        type: 'slow_api_call',
        endpoint,
        method,
        duration,
        statusCode,
        timestamp: Date.now()
      });
    }
  }
  
  /**
   * Enregistre le temps de rendu d'un composant
   */
  recordComponentRender(componentName, duration) {
    if (!this.config.enabled) return;
    
    if (!this.metrics.componentRenders[componentName]) {
      this.metrics.componentRenders[componentName] = {
        count: 0,
        totalDuration: 0,
        maxDuration: 0
      };
    }
    
    const metrics = this.metrics.componentRenders[componentName];
    metrics.count += 1;
    metrics.totalDuration += duration;
    metrics.maxDuration = Math.max(metrics.maxDuration, duration);
    
    // Alerter sur les rendus lents
    if (duration > 50) { // Plus de 50ms est considéré lent pour un rendu
      console.warn(`[PerformanceMonitoring] Slow component render: ${componentName} (${duration}ms)`);
    }
  }
  
  /**
   * Enregistre une interaction utilisateur
   */
  recordUserInteraction(actionType, targetElement, duration) {
    if (!this.config.enabled) return;
    
    if (!this.metrics.userInteractions[actionType]) {
      this.metrics.userInteractions[actionType] = {
        count: 0,
        totalDuration: 0,
        elements: {}
      };
    }
    
    const metrics = this.metrics.userInteractions[actionType];
    metrics.count += 1;
    metrics.totalDuration += duration;
    
    if (targetElement) {
      if (!metrics.elements[targetElement]) {
        metrics.elements[targetElement] = { count: 0, totalDuration: 0 };
      }
      metrics.elements[targetElement].count += 1;
      metrics.elements[targetElement].totalDuration += duration;
    }
  }
}

// Exporter une instance singleton
export default new PerformanceMonitoringService();
