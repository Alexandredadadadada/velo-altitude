/**
 * Service de Monitoring Unifié
 * 
 * Ce service consolide toutes les fonctionnalités de monitoring précédemment
 * dispersées dans plusieurs fichiers.
 * 
 * Fonctionnalités:
 * - Surveillance des performances de l'application
 * - Suivi des erreurs et exceptions
 * - Métriques d'utilisation et engagement utilisateur
 * - Diagnostics réseau et API
 * - Journalisation unifiée
 */

class UnifiedMonitoringService {
  constructor(config = {}) {
    this.config = {
      appName: 'Velo-Altitude',
      environment: process.env.NODE_ENV || 'development',
      logLevel: process.env.LOG_LEVEL || 'info',
      errorReportingEnabled: true,
      performanceMonitoringEnabled: true,
      userMetricsEnabled: true,
      networkDiagnosticsEnabled: true,
      samplingRate: 0.1, // 10% d'échantillonnage par défaut
      sendToBackend: true,
      backendUrl: process.env.REACT_APP_MONITORING_API_URL || '/api/monitoring',
      ...config
    };
    
    // Métriques et états
    this.metrics = {
      errors: [],
      performance: {},
      userEvents: [],
      networkRequests: [],
      componentRenders: {},
      pageLoadTimes: {}
    };
    
    // Initialisation du monitoring
    this._initErrorHandling();
    this._initPerformanceMonitoring();
    this._initNetworkMonitoring();
    
    // Démarrer l'envoi périodique des données
    if (this.config.sendToBackend) {
      this._startPeriodicDataSending();
    }
    
    console.log(`[UnifiedMonitoringService] Initialized in ${this.config.environment} environment`);
  }
  
  /**
   * Initialise la capture des erreurs globales
   */
  _initErrorHandling() {
    if (!this.config.errorReportingEnabled) return;
    
    // Capturer les erreurs non gérées
    const originalOnError = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
      this.logError({
        message,
        source,
        lineno,
        colno,
        stack: error ? error.stack : null,
        timestamp: Date.now()
      });
      
      // Ne pas interrompre la chaîne des gestionnaires d'erreurs existants
      if (originalOnError) {
        return originalOnError(message, source, lineno, colno, error);
      }
      
      return false;
    };
    
    // Capturer les rejets de promesses non gérés
    const originalUnhandledRejection = window.onunhandledrejection;
    window.onunhandledrejection = (event) => {
      this.logError({
        type: 'unhandledrejection',
        message: event.reason instanceof Error ? event.reason.message : String(event.reason),
        stack: event.reason instanceof Error ? event.reason.stack : null,
        timestamp: Date.now()
      });
      
      if (originalUnhandledRejection) {
        return originalUnhandledRejection(event);
      }
    };
  }
  
  /**
   * Initialise le suivi des performances
   */
  _initPerformanceMonitoring() {
    if (!this.config.performanceMonitoringEnabled) return;
    
    // Observer les mesures de performance
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // Ne collecter qu'un échantillon des données selon le taux configuré
        if (Math.random() < this.config.samplingRate) {
          this._recordPerformanceEntry(entry);
        }
      }
    });
    
    // Observer diverses métriques de performance
    try {
      observer.observe({ entryTypes: ['navigation', 'resource', 'paint', 'largest-contentful-paint'] });
    } catch (e) {
      console.warn('[UnifiedMonitoringService] Some performance metrics are not supported in this browser');
    }
  }
  
  /**
   * Initialise le monitoring réseau
   */
  _initNetworkMonitoring() {
    if (!this.config.networkDiagnosticsEnabled) return;
    
    // Intercepter les requêtes fetch
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = Date.now();
      const url = args[0] instanceof Request ? args[0].url : String(args[0]);
      
      try {
        const response = await originalFetch(...args);
        const duration = Date.now() - startTime;
        
        // Échantillonnage
        if (Math.random() < this.config.samplingRate) {
          this._recordNetworkRequest({
            url,
            method: args[1]?.method || 'GET',
            status: response.status,
            duration,
            success: true,
            timestamp: startTime
          });
        }
        
        return response;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        this._recordNetworkRequest({
          url,
          method: args[1]?.method || 'GET',
          status: 0,
          duration,
          success: false,
          error: error.message,
          timestamp: startTime
        });
        
        throw error;
      }
    };
    
    // Intercepter les requêtes XMLHttpRequest
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(...args) {
      const startTime = Date.now();
      const method = args[0];
      const url = args[1];
      
      this.addEventListener('load', () => {
        const duration = Date.now() - startTime;
        
        // Échantillonnage
        if (Math.random() < this.config.samplingRate) {
          this._recordNetworkRequest({
            url,
            method,
            status: this.status,
            duration,
            success: this.status >= 200 && this.status < 300,
            timestamp: startTime
          });
        }
      });
      
      this.addEventListener('error', () => {
        const duration = Date.now() - startTime;
        
        this._recordNetworkRequest({
          url,
          method,
          status: this.status,
          duration,
          success: false,
          error: 'Network error',
          timestamp: startTime
        });
      });
      
      return originalOpen.apply(this, args);
    };
  }
  
  /**
   * Démarrer l'envoi périodique des données au backend
   */
  _startPeriodicDataSending() {
    setInterval(() => {
      this._sendMetricsToBackend();
    }, 60000); // Toutes les minutes
  }
  
  /**
   * Enregistre une entrée de performance
   */
  _recordPerformanceEntry(entry) {
    switch (entry.entryType) {
      case 'navigation':
        this.metrics.pageLoadTimes[entry.name] = {
          loadTime: entry.loadEventEnd - entry.startTime,
          domContentLoaded: entry.domContentLoadedEventEnd - entry.startTime,
          firstByte: entry.responseStart - entry.startTime,
          redirect: entry.redirectEnd - entry.redirectStart,
          dns: entry.domainLookupEnd - entry.domainLookupStart,
          tcp: entry.connectEnd - entry.connectStart,
          request: entry.responseStart - entry.requestStart,
          response: entry.responseEnd - entry.responseStart,
          timestamp: Date.now()
        };
        break;
        
      case 'paint':
      case 'largest-contentful-paint':
        if (!this.metrics.performance[entry.name]) {
          this.metrics.performance[entry.name] = [];
        }
        this.metrics.performance[entry.name].push({
          value: entry.startTime,
          timestamp: Date.now()
        });
        break;
        
      case 'resource':
        // Ne pas enregistrer toutes les ressources pour éviter de surcharger
        if (entry.initiatorType === 'fetch' || entry.initiatorType === 'xmlhttprequest') {
          const key = `resource-${entry.initiatorType}`;
          if (!this.metrics.performance[key]) {
            this.metrics.performance[key] = [];
          }
          this.metrics.performance[key].push({
            name: entry.name,
            duration: entry.duration,
            size: entry.transferSize,
            timestamp: Date.now()
          });
        }
        break;
    }
  }
  
  /**
   * Enregistre une requête réseau
   */
  _recordNetworkRequest(requestData) {
    // Limiter la taille des données
    if (this.metrics.networkRequests.length >= 100) {
      this.metrics.networkRequests.shift();
    }
    this.metrics.networkRequests.push(requestData);
  }
  
  /**
   * Envoie les métriques au backend
   */
  async _sendMetricsToBackend() {
    // Si pas de données à envoyer, ignorer
    if (this.metrics.errors.length === 0 && 
        Object.keys(this.metrics.performance).length === 0 && 
        this.metrics.networkRequests.length === 0) {
      return;
    }
    
    // Préparer les données
    const payload = {
      appName: this.config.appName,
      environment: this.config.environment,
      timestamp: Date.now(),
      sessionId: this._getSessionId(),
      metrics: {
        ...this.metrics
      }
    };
    
    try {
      const response = await fetch(this.config.backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        // Réinitialiser les métriques envoyées
        this.metrics.errors = [];
        this.metrics.networkRequests = [];
        this.metrics.userEvents = [];
        this.metrics.performance = {};
        console.debug('[UnifiedMonitoringService] Metrics sent successfully');
      } else {
        console.error('[UnifiedMonitoringService] Failed to send metrics:', await response.text());
      }
    } catch (error) {
      console.error('[UnifiedMonitoringService] Error sending metrics:', error);
    }
  }
  
  /**
   * Obtient l'ID de session unique
   */
  _getSessionId() {
    if (!window.sessionStorage.veloAltitudeSessionId) {
      window.sessionStorage.veloAltitudeSessionId = Date.now() + '-' + 
        Math.random().toString(36).substring(2, 9);
    }
    return window.sessionStorage.veloAltitudeSessionId;
  }
  
  /**
   * API publique pour enregistrer une erreur
   */
  logError(errorData) {
    // Enrichir avec des informations de contexte
    const enrichedError = {
      ...errorData,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now()
    };
    
    // Limiter la taille des données
    if (this.metrics.errors.length >= 50) {
      this.metrics.errors.shift();
    }
    
    this.metrics.errors.push(enrichedError);
    
    // Log en console pour le débogage
    if (this.config.environment === 'development') {
      console.error('[ErrorMonitoring]', enrichedError);
    }
    
    // Envoyer immédiatement au backend pour les erreurs critiques
    if (this.config.sendToBackend && errorData.severity === 'critical') {
      this._sendMetricsToBackend();
    }
  }
  
  /**
   * API publique pour suivre un événement utilisateur
   */
  trackUserEvent(category, action, label = null, value = null) {
    if (!this.config.userMetricsEnabled) return;
    
    const event = {
      category,
      action,
      label,
      value,
      timestamp: Date.now()
    };
    
    // Limiter la taille des données
    if (this.metrics.userEvents.length >= 100) {
      this.metrics.userEvents.shift();
    }
    
    this.metrics.userEvents.push(event);
  }
  
  /**
   * API publique pour mesurer la performance d'un composant React
   */
  measureComponentRender(componentName, renderTime) {
    if (!this.config.performanceMonitoringEnabled) return;
    
    if (!this.metrics.componentRenders[componentName]) {
      this.metrics.componentRenders[componentName] = [];
    }
    
    if (this.metrics.componentRenders[componentName].length >= 50) {
      this.metrics.componentRenders[componentName].shift();
    }
    
    this.metrics.componentRenders[componentName].push({
      renderTime,
      timestamp: Date.now()
    });
  }
  
  /**
   * API publique pour journaliser un message
   */
  log(level, message, data = {}) {
    const logLevels = {
      debug: 10,
      info: 20,
      warn: 30,
      error: 40,
      critical: 50
    };
    
    // Ne pas journaliser si le niveau est trop bas
    const configuredLevel = logLevels[this.config.logLevel] || 20;
    const messageLevel = logLevels[level] || 20;
    
    if (messageLevel < configuredLevel) {
      return;
    }
    
    const logEntry = {
      level,
      message,
      data,
      timestamp: Date.now()
    };
    
    // Afficher en console
    switch (level) {
      case 'debug':
        console.debug('[UnifiedMonitoringService]', message, data);
        break;
      case 'info':
        console.info('[UnifiedMonitoringService]', message, data);
        break;
      case 'warn':
        console.warn('[UnifiedMonitoringService]', message, data);
        break;
      case 'error':
      case 'critical':
        console.error('[UnifiedMonitoringService]', message, data);
        break;
    }
    
    // Pour les logs d'erreur, ajouter aux métriques
    if (level === 'error' || level === 'critical') {
      this.logError({
        type: 'log',
        message,
        data,
        severity: level,
        timestamp: Date.now()
      });
    }
  }
  
  /**
   * Obtenir un rapport résumé des métriques
   */
  getSummaryReport() {
    const errorCount = this.metrics.errors.length;
    const slowRequests = this.metrics.networkRequests.filter(req => req.duration > 1000).length;
    
    let pageLoadTime = null;
    const pageLoadMetrics = Object.values(this.metrics.pageLoadTimes)[0];
    if (pageLoadMetrics) {
      pageLoadTime = pageLoadMetrics.loadTime;
    }
    
    let fpMetric = null;
    if (this.metrics.performance['first-paint']?.length > 0) {
      fpMetric = this.metrics.performance['first-paint'][0].value;
    }
    
    return {
      errorsCount: errorCount,
      slowRequestsCount: slowRequests,
      pageLoadTime,
      firstPaint: fpMetric,
      timestamp: Date.now()
    };
  }
  
  /**
   * Récupère les erreurs actuelles
   */
  getCurrentErrors() {
    return [...this.metrics.errors];
  }
}

// Créer une instance singleton
const monitoringService = new UnifiedMonitoringService();

// Hook React pour faciliter l'intégration avec les composants React
export function usePerformanceMonitoring(componentName) {
  return {
    logRender: (renderTime) => monitoringService.measureComponentRender(componentName, renderTime),
    logError: (error) => monitoringService.logError({
      source: componentName,
      message: error.message,
      stack: error.stack,
      timestamp: Date.now()
    })
  };
}

export default monitoringService;
