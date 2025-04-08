/**
 * Service de monitoring centralisé pour l'application Velo-Altitude
 * Permet de surveiller les performances et la stabilité de l'application
 */
class MonitoringService {
  constructor(options = {}) {
    this.config = {
      enabled: true,
      sampleRate: 0.1, // Échantillonnage à 10% des utilisateurs
      metricsEndpoint: '/api/monitoring/metrics',
      errorEndpoint: '/api/monitoring/errors',
      performanceThresholds: {
        pageLoad: 3000, // ms
        apiResponse: 1000, // ms
        interaction: 100, // ms
        renderTime: 50, // ms
      },
      ...options
    };
    
    this.metrics = {
      errors: 0,
      apiRequests: 0,
      apiFailures: 0,
      pageLoads: 0,
      interactions: 0,
      navigationTimings: []
    };
    
    this.initialized = false;
    this.userId = null;
    this.sessionId = null;
  }

  /**
   * Initialise le service de monitoring
   * @param {string} userId - ID de l'utilisateur connecté
   */
  init(userId) {
    if (this.initialized) return;
    
    // Déterminer si cet utilisateur est échantillonné
    const isIncluded = Math.random() < this.config.sampleRate;
    
    if (!isIncluded && process.env.NODE_ENV === 'production') {
      console.log('[MonitoringService] Utilisateur exclu de l\'échantillonnage');
      return;
    }
    
    this.userId = userId;
    this.sessionId = this._generateSessionId();
    this.startTime = Date.now();
    
    // Observer la performance de navigation
    this._initPerformanceObservers();
    
    // Observer les erreurs non capturées
    this._initErrorHandlers();
    
    // Envoyer des métriques périodiquement
    this._scheduleMetricsReport();
    
    this.initialized = true;
    console.log('[MonitoringService] Initialisé');
  }
  
  /**
   * Enregistre un événement utilisateur (clic, navigation, etc.)
   * @param {string} name - Nom de l'événement
   * @param {Object} data - Données associées à l'événement
   */
  trackEvent(name, data = {}) {
    if (!this.initialized) return;
    
    this.metrics.interactions++;
    
    const event = {
      type: 'event',
      name,
      data,
      timestamp: Date.now()
    };
    
    this._queueMetric(event);
  }
  
  /**
   * Enregistre le début d'une opération
   * @param {string} operationName - Nom de l'opération
   * @returns {Function} - Fonction à appeler pour marquer la fin de l'opération
   */
  startOperation(operationName) {
    if (!this.initialized) return () => {};
    
    const startTime = performance.now();
    const operationId = `${operationName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return (status = 'success', extraData = {}) => {
      const duration = performance.now() - startTime;
      
      this._queueMetric({
        type: 'operation',
        name: operationName,
        id: operationId,
        status,
        duration,
        ...extraData,
        timestamp: Date.now()
      });
      
      // Vérifier si l'opération a dépassé les seuils
      if (status === 'success' && this.config.performanceThresholds[operationName] && 
          duration > this.config.performanceThresholds[operationName]) {
        console.warn(`[MonitoringService] Opération lente: ${operationName} - ${duration.toFixed(2)}ms`);
      }
      
      return duration;
    };
  }
  
  /**
   * Enregistre une requête API
   * @param {string} endpoint - URL de l'endpoint
   * @param {string} method - Méthode HTTP
   * @param {number} status - Code de statut de la réponse
   * @param {number} duration - Durée de la requête en ms
   */
  trackApiRequest(endpoint, method, status, duration) {
    if (!this.initialized) return;
    
    this.metrics.apiRequests++;
    
    if (status >= 400) {
      this.metrics.apiFailures++;
    }
    
    const isSlowRequest = duration > this.config.performanceThresholds.apiResponse;
    
    this._queueMetric({
      type: 'api',
      endpoint,
      method,
      status,
      duration,
      slow: isSlowRequest,
      timestamp: Date.now()
    });
    
    if (isSlowRequest) {
      console.warn(`[MonitoringService] Requête API lente: ${method} ${endpoint} - ${duration.toFixed(2)}ms`);
    }
  }
  
  /**
   * Enregistre une erreur capturée
   * @param {Error} error - L'erreur capturée
   * @param {Object} context - Contexte dans lequel l'erreur s'est produite
   */
  trackError(error, context = {}) {
    if (!this.initialized) return;
    
    this.metrics.errors++;
    
    const errorData = {
      type: 'error',
      message: error.message,
      stack: error.stack,
      context,
      timestamp: Date.now()
    };
    
    // Envoi immédiat des erreurs critiques
    this._sendError(errorData);
  }
  
  /**
   * Enregistre le temps de chargement d'une page
   * @param {string} route - Route de la page
   * @param {number} loadTime - Temps de chargement en ms
   */
  trackPageLoad(route, loadTime) {
    if (!this.initialized) return;
    
    this.metrics.pageLoads++;
    
    const isSlowLoad = loadTime > this.config.performanceThresholds.pageLoad;
    
    this._queueMetric({
      type: 'pageLoad',
      route,
      loadTime,
      slow: isSlowLoad,
      timestamp: Date.now()
    });
    
    if (isSlowLoad) {
      console.warn(`[MonitoringService] Chargement de page lent: ${route} - ${loadTime.toFixed(2)}ms`);
    }
  }
  
  /**
   * Enregistre le temps de rendu d'un composant
   * @param {string} componentName - Nom du composant
   * @param {number} renderTime - Temps de rendu en ms
   */
  trackComponentRender(componentName, renderTime) {
    if (!this.initialized) return;
    
    const isSlowRender = renderTime > this.config.performanceThresholds.renderTime;
    
    this._queueMetric({
      type: 'componentRender',
      componentName,
      renderTime,
      slow: isSlowRender,
      timestamp: Date.now()
    });
    
    if (isSlowRender) {
      console.warn(`[MonitoringService] Rendu de composant lent: ${componentName} - ${renderTime.toFixed(2)}ms`);
    }
  }
  
  /**
   * Enregistre des métriques personnalisées
   * @param {string} name - Nom de la métrique
   * @param {number} value - Valeur de la métrique
   * @param {Object} tags - Tags associés à la métrique
   */
  trackMetric(name, value, tags = {}) {
    if (!this.initialized) return;
    
    this._queueMetric({
      type: 'metric',
      name,
      value,
      tags,
      timestamp: Date.now()
    });
  }
  
  /**
   * Récupère les statistiques actuelles
   * @returns {Object} - Statistiques
   */
  getStats() {
    return {
      ...this.metrics,
      sessionDuration: Date.now() - this.startTime,
      userAgent: navigator.userAgent,
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
      timestamp: Date.now()
    };
  }
  
  /**
   * Met en file d'attente une métrique pour envoi ultérieur
   * @param {Object} metric - Métrique à envoyer
   * @private
   */
  _queueMetric(metric) {
    // Cette méthode pourrait être étendue pour gérer une file d'attente persistante
    // Pour l'instant, elle ajoute simplement le contexte standard et envoie immédiatement
    const enrichedMetric = {
      ...metric,
      userId: this.userId,
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      url: window.location.href,
      referrer: document.referrer,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      timestamp: metric.timestamp || Date.now()
    };
    
    // Envoie immédiatement ou stocke pour envoi groupé ultérieur
    if (metric.type === 'error' || metric.type === 'critical') {
      this._sendMetricsImmediately([enrichedMetric]);
    } else {
      // En production, stocker pour envoi groupé
      // Pour simplifier l'exemple, on envoie immédiatement
      if (process.env.NODE_ENV === 'development') {
        this._sendMetricsImmediately([enrichedMetric]);
      }
      // En production, on pourrait stocker dans une file pour envoi groupé
    }
  }
  
  /**
   * Envoie les métriques au serveur
   * @param {Array} metrics - Liste de métriques à envoyer
   * @private
   */
  _sendMetricsImmediately(metrics) {
    if (!this.config.enabled) return;
    
    fetch(this.config.metricsEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metrics }),
      // Envoyer même si l'utilisateur quitte la page
      keepalive: true
    }).catch(err => {
      console.error('[MonitoringService] Erreur lors de l\'envoi des métriques:', err);
    });
  }
  
  /**
   * Envoie une erreur au serveur
   * @param {Object} errorData - Données d'erreur
   * @private
   */
  _sendError(errorData) {
    if (!this.config.enabled) return;
    
    const enrichedError = {
      ...errorData,
      userId: this.userId,
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      url: window.location.href,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      timestamp: errorData.timestamp || Date.now()
    };
    
    fetch(this.config.errorEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enrichedError),
      // Envoyer même si l'utilisateur quitte la page
      keepalive: true
    }).catch(err => {
      console.error('[MonitoringService] Erreur lors de l\'envoi d\'une erreur:', err);
    });
  }
  
  /**
   * Initialise les observateurs de performance Web
   * @private
   */
  _initPerformanceObservers() {
    if (typeof PerformanceObserver !== 'function') {
      return;
    }
    
    try {
      // Observer les timings de navigation
      const navObserver = new PerformanceObserver(list => {
        const entries = list.getEntries();
        this.metrics.navigationTimings.push(...entries);
        
        // Analyser les entrées pour identifier les problèmes
        entries.forEach(entry => {
          if (entry.entryType === 'navigation') {
            this.trackPageLoad(window.location.pathname, entry.loadEventEnd - entry.startTime);
          }
        });
      });
      
      navObserver.observe({ entryTypes: ['navigation', 'resource'] });
      
      // Observer les performances des requêtes réseau (fetch, xmlhttprequest)
      const resourceObserver = new PerformanceObserver(list => {
        list.getEntries().forEach(entry => {
          if (entry.initiatorType === 'fetch' || entry.initiatorType === 'xmlhttprequest') {
            // Ne pas monitorer les appels au service de monitoring lui-même
            if (entry.name.includes(this.config.metricsEndpoint) || 
                entry.name.includes(this.config.errorEndpoint)) {
              return;
            }
            
            this.trackApiRequest(
              entry.name,
              'GET', // Nous ne pouvons pas connaître la méthode HTTP à partir de l'entrée de performance
              200, // Nous ne pouvons pas connaître le statut à partir de l'entrée de performance
              entry.duration
            );
          }
        });
      });
      
      resourceObserver.observe({ entryTypes: ['resource'] });
      
      // Observer les temps de peinture du navigateur
      const paintObserver = new PerformanceObserver(list => {
        list.getEntries().forEach(entry => {
          this._queueMetric({
            type: 'paint',
            name: entry.name,
            startTime: entry.startTime,
            timestamp: Date.now()
          });
        });
      });
      
      paintObserver.observe({ entryTypes: ['paint'] });
      
      // Observer les longues tâches (blocage du thread principal)
      if (typeof PerformanceLongTaskTiming !== 'undefined') {
        const longTaskObserver = new PerformanceObserver(list => {
          list.getEntries().forEach(entry => {
            this._queueMetric({
              type: 'longTask',
              duration: entry.duration,
              startTime: entry.startTime,
              timestamp: Date.now()
            });
            
            console.warn(`[MonitoringService] Tâche longue détectée: ${entry.duration.toFixed(2)}ms`);
          });
        });
        
        longTaskObserver.observe({ entryTypes: ['longtask'] });
      }
    } catch (error) {
      console.error('[MonitoringService] Erreur lors de l\'initialisation des observateurs de performance:', error);
    }
  }
  
  /**
   * Initialise les gestionnaires d'erreurs globaux
   * @private
   */
  _initErrorHandlers() {
    // Erreurs non capturées
    window.addEventListener('error', event => {
      this.trackError(event.error || new Error(event.message), {
        source: event.filename,
        line: event.lineno,
        column: event.colno,
        type: 'uncaught_error'
      });
    });
    
    // Promesses rejetées non gérées
    window.addEventListener('unhandledrejection', event => {
      let error;
      if (event.reason instanceof Error) {
        error = event.reason;
      } else {
        error = new Error(
          typeof event.reason === 'object' 
            ? JSON.stringify(event.reason) 
            : String(event.reason)
        );
      }
      
      this.trackError(error, {
        type: 'unhandled_rejection'
      });
    });
  }
  
  /**
   * Planifie l'envoi périodique des métriques
   * @private
   */
  _scheduleMetricsReport() {
    // Envoyer les statistiques toutes les 5 minutes
    setInterval(() => {
      if (!this.config.enabled) return;
      
      const stats = this.getStats();
      this._sendMetricsImmediately([
        {
          type: 'session_stats',
          ...stats
        }
      ]);
    }, 5 * 60 * 1000); // 5 minutes
    
    // Envoyer également les statistiques avant que l'utilisateur ne quitte la page
    window.addEventListener('beforeunload', () => {
      if (!this.config.enabled) return;
      
      const stats = this.getStats();
      navigator.sendBeacon(this.config.metricsEndpoint, JSON.stringify({
        metrics: [
          {
            type: 'session_end',
            ...stats
          }
        ]
      }));
    });
  }
  
  /**
   * Génère un identifiant de session unique
   * @returns {string} - ID de session
   * @private
   */
  _generateSessionId() {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton
const monitoringService = new MonitoringService();
export default monitoringService;
