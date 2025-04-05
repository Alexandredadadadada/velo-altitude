/**
 * Service de monitoring client
 * Collecte et envoie des métriques de performance, d'utilisation et d'erreurs
 * au backend pour analyse et affichage dans le tableau de bord de monitoring
 */

import axios from 'axios';

// Configuration de base
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const METRICS_ENDPOINT = `${API_URL}/monitoring/metrics`;
const PERFORMANCE_ENDPOINT = `${API_URL}/monitoring/performance`;
const ERROR_ENDPOINT = `${API_URL}/monitoring/errors`;
const USER_TRACKING_ENDPOINT = `${API_URL}/monitoring/user-tracking`;
const API_METRICS_ENDPOINT = `${API_URL}/monitoring/api-metrics`;

// Configuration des intervalles d'envoi de données
const BATCH_INTERVAL = 30000; // 30 secondes entre chaque envoi de lot de métriques
const MAX_BATCH_SIZE = 50; // Nombre maximum de métriques par lot

// Files d'attente pour les différents types de métriques
let performanceMetrics = [];
let errorMetrics = [];
let userMetrics = [];
let apiMetrics = [];

// Statistiques d'API en temps réel (pour le dashboard)
let apiStats = {
  callCount: 0,
  errorCount: 0,
  cacheHitCount: 0,
  fallbackCount: 0,
  retryCount: 0,
  responseTimeTotal: 0,
  longestResponseTime: 0,
  endpoints: {},
  lastUpdated: Date.now(),
  // Données horodatées pour les graphiques
  timeSeriesData: {
    timestamps: [],
    responseTimes: [],
    errorRates: [],
    cacheHitRates: []
  }
};

// Map des debounces des appels API pour éviter les appels en double
const apiDebounceMap = new Map();

// Indicateurs d'état
let isInitialized = false;
let isSending = false;
let sessionId = null;

/**
 * Initialise le service de monitoring
 */
const initialize = () => {
  if (isInitialized) return;
  
  // Générer un ID de session unique
  sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  
  // Configurer l'envoi périodique de métriques
  setInterval(sendBatchedMetrics, BATCH_INTERVAL);
  
  // Écouter les événements de performance du navigateur
  if (window.PerformanceObserver) {
    try {
      // Observer les mesures de performance Web Vitals
      const perfObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (['CLS', 'FID', 'LCP', 'FCP', 'TTFB'].includes(entry.name)) {
            trackBrowserPerformance(entry.name, entry.value, entry);
          }
        });
      });
      
      perfObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      perfObserver.observe({ type: 'first-input', buffered: true });
      perfObserver.observe({ type: 'layout-shift', buffered: true });
      perfObserver.observe({ type: 'paint', buffered: true });
      
    } catch (e) {
      console.warn('PerformanceObserver not fully supported:', e);
    }
  }
  
  // Intercepter les erreurs non gérées
  window.addEventListener('error', (event) => {
    trackError('unhandled_exception', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error ? event.error.stack : null
    });
  });
  
  // Intercepter les rejets de promesses non gérés
  window.addEventListener('unhandledrejection', (event) => {
    trackError('unhandled_promise_rejection', {
      reason: event.reason ? event.reason.toString() : 'Unknown reason',
      stack: event.reason && event.reason.stack ? event.reason.stack : null
    });
  });
  
  // Marquer comme initialisé
  isInitialized = true;
  
  // Envoyer une métrique d'initialisation
  trackGenericMetric('monitoring_initialized', {
    userAgent: navigator.userAgent,
    screenSize: `${window.innerWidth}x${window.innerHeight}`,
    timestamp: Date.now()
  });
};

/**
 * Envoie les métriques accumulées au serveur
 */
const sendBatchedMetrics = async () => {
  if (isSending || 
      (performanceMetrics.length === 0 && 
       errorMetrics.length === 0 && 
       userMetrics.length === 0 && 
       apiMetrics.length === 0)) {
    return;
  }
  
  isSending = true;
  
  try {
    // Collecter les métriques actuelles et vider les files d'attente
    const metricsToSend = {
      sessionId,
      timestamp: Date.now(),
      performance: [...performanceMetrics].slice(0, MAX_BATCH_SIZE),
      errors: [...errorMetrics].slice(0, MAX_BATCH_SIZE),
      userActivity: [...userMetrics].slice(0, MAX_BATCH_SIZE),
      apiCalls: [...apiMetrics].slice(0, MAX_BATCH_SIZE)
    };
    
    // Vider les files d'attente des métriques envoyées
    performanceMetrics = performanceMetrics.slice(MAX_BATCH_SIZE);
    errorMetrics = errorMetrics.slice(MAX_BATCH_SIZE);
    userMetrics = userMetrics.slice(MAX_BATCH_SIZE);
    apiMetrics = apiMetrics.slice(MAX_BATCH_SIZE);
    
    // Envoyer les métriques au backend
    await axios.post(METRICS_ENDPOINT, metricsToSend);
    
    // Mettre à jour les statistiques d'API pour le dashboard
    updateApiStats();
    
  } catch (error) {
    // En cas d'erreur, stocker localement pour réessayer plus tard
    console.warn('Failed to send metrics to server:', error);
    
    // Stocker jusqu'à 1000 métriques localement en cas de problème de connexion
    const storedMetrics = JSON.parse(localStorage.getItem('pendingMetrics') || '[]');
    if (storedMetrics.length < 1000) {
      localStorage.setItem('pendingMetrics', JSON.stringify([
        ...storedMetrics,
        {
          timestamp: Date.now(),
          metrics: metricsToSend
        }
      ]));
    }
  } finally {
    isSending = false;
  }
};

/**
 * Suivi des performances d'un composant (temps de rendu, chargement, etc.)
 * @param {string} componentName - Nom du composant
 * @param {number} duration - Durée en millisecondes
 * @param {Object} metadata - Métadonnées supplémentaires
 */
const trackComponentPerformance = (componentName, duration, metadata = {}) => {
  if (!isInitialized) initialize();
  
  performanceMetrics.push({
    type: 'component_performance',
    component: componentName,
    duration,
    timestamp: Date.now(),
    ...metadata
  });
  
  // Si des métriques clés sont lentes, envoyer immédiatement
  if (duration > 1000 && componentName.includes('Calculator')) {
    sendBatchedMetrics();
  }
};

/**
 * Suivi du démontage d'un composant (fin de session d'utilisation)
 * @param {string} componentName - Nom du composant
 * @param {Object} sessionData - Données de la session (durée, actions, etc.)
 */
const trackComponentUnmount = (componentName, sessionData = {}) => {
  if (!isInitialized) initialize();
  
  performanceMetrics.push({
    type: 'component_unmount',
    component: componentName,
    timestamp: Date.now(),
    ...sessionData
  });
};

/**
 * Suivi des performances du navigateur (Web Vitals)
 * @param {string} metricName - Nom de la métrique (CLS, FID, LCP, etc.)
 * @param {number} value - Valeur de la métrique
 * @param {Object} entry - Entrée de performance originale
 */
const trackBrowserPerformance = (metricName, value, entry = {}) => {
  if (!isInitialized) initialize();
  
  performanceMetrics.push({
    type: 'browser_performance',
    metricName,
    value,
    timestamp: Date.now(),
    url: window.location.href,
    details: entry
  });
};

/**
 * Suivi des performances d'API
 * @param {string} endpoint - Endpoint de l'API appelé
 * @param {number} duration - Durée en millisecondes
 * @param {Object} metadata - Métadonnées (statut, taille de la réponse, etc.)
 */
const trackApiPerformance = (endpoint, duration, metadata = {}) => {
  if (!isInitialized) initialize();
  
  apiMetrics.push({
    type: 'api_performance',
    endpoint,
    duration,
    timestamp: Date.now(),
    ...metadata
  });
  
  // Mise à jour des statistiques en temps réel
  apiStats.callCount++;
  apiStats.responseTimeTotal += duration;
  apiStats.longestResponseTime = Math.max(apiStats.longestResponseTime, duration);
  
  // Mise à jour des données par endpoint
  if (!apiStats.endpoints[endpoint]) {
    apiStats.endpoints[endpoint] = {
      callCount: 0,
      errorCount: 0,
      cacheHitCount: 0,
      responseTimeTotal: 0,
      avgResponseTime: 0
    };
  }
  
  apiStats.endpoints[endpoint].callCount++;
  apiStats.endpoints[endpoint].responseTimeTotal += duration;
  apiStats.endpoints[endpoint].avgResponseTime = 
    apiStats.endpoints[endpoint].responseTimeTotal / apiStats.endpoints[endpoint].callCount;
  
  // Mise à jour des données temporelles pour les graphiques
  updateTimeSeriesData();
  
  // Si un appel API est particulièrement lent, signaler immédiatement
  if (duration > 3000) {
    sendBatchedMetrics();
  }
};

/**
 * Suivi des erreurs
 * @param {string} errorType - Type d'erreur
 * @param {Object} errorDetails - Détails de l'erreur
 */
const trackError = (errorType, errorDetails = {}) => {
  if (!isInitialized) initialize();
  
  errorMetrics.push({
    type: 'error',
    errorType,
    timestamp: Date.now(),
    url: window.location.href,
    ...errorDetails
  });
  
  // Les erreurs sont envoyées immédiatement
  sendBatchedMetrics();
};

/**
 * Suivi des interactions utilisateur
 * @param {string} componentName - Nom du composant
 * @param {string} action - Action effectuée
 * @param {Object} metadata - Métadonnées supplémentaires
 */
const trackUserInteraction = (componentName, action, metadata = {}) => {
  if (!isInitialized) initialize();
  
  userMetrics.push({
    type: 'user_interaction',
    component: componentName,
    action,
    timestamp: Date.now(),
    url: window.location.href,
    ...metadata
  });
};

/**
 * Suivi de l'engagement utilisateur sur la durée
 * @param {string} feature - Fonctionnalité utilisée
 * @param {Object} engagementData - Données d'engagement
 */
const trackUserEngagement = (feature, engagementData = {}) => {
  if (!isInitialized) initialize();
  
  userMetrics.push({
    type: 'user_engagement',
    feature,
    timestamp: Date.now(),
    url: window.location.href,
    ...engagementData
  });
};

/**
 * Suivi d'une métrique générique
 * @param {string} metricName - Nom de la métrique
 * @param {Object} data - Données associées
 */
const trackGenericMetric = (metricName, data = {}) => {
  if (!isInitialized) initialize();
  
  performanceMetrics.push({
    type: 'generic',
    metricName,
    timestamp: Date.now(),
    ...data
  });
};

/**
 * Enregistre une erreur d'API
 * @param {string} endpoint - Endpoint de l'API
 * @param {Object} error - Objet d'erreur
 * @param {Object} metadata - Métadonnées supplémentaires
 */
const logApiError = (endpoint, error, metadata = {}) => {
  if (!isInitialized) initialize();
  
  errorMetrics.push({
    type: 'api_error',
    endpoint,
    errorMessage: error.message || 'Unknown error',
    errorCode: error.response?.status || 0,
    timestamp: Date.now(),
    ...metadata
  });
  
  // Mise à jour des statistiques
  apiStats.errorCount++;
  
  if (apiStats.endpoints[endpoint]) {
    apiStats.endpoints[endpoint].errorCount++;
  }
  
  // Mise à jour des données temporelles
  updateTimeSeriesData();
  
  // Les erreurs API sont envoyées immédiatement
  sendBatchedMetrics();
};

/**
 * Enregistre l'utilisation d'un système de fallback
 * @param {string} endpoint - Endpoint de l'API
 * @param {string} fallbackType - Type de fallback (cache, données locales, etc.)
 * @param {Object} metadata - Métadonnées supplémentaires
 */
const logFallbackUsage = (endpoint, fallbackType, metadata = {}) => {
  if (!isInitialized) initialize();
  
  apiMetrics.push({
    type: 'api_fallback',
    endpoint,
    fallbackType,
    timestamp: Date.now(),
    ...metadata
  });
  
  // Mise à jour des statistiques
  apiStats.fallbackCount++;
  
  // Mise à jour des données temporelles
  updateTimeSeriesData();
};

/**
 * Enregistre un hit de cache
 * @param {string} endpoint - Endpoint de l'API
 * @param {number} savedTime - Temps économisé en ms
 */
const logCacheHit = (endpoint, savedTime, metadata = {}) => {
  if (!isInitialized) initialize();
  
  apiMetrics.push({
    type: 'cache_hit',
    endpoint,
    savedTime,
    timestamp: Date.now(),
    ...metadata
  });
  
  // Mise à jour des statistiques
  apiStats.cacheHitCount++;
  
  if (apiStats.endpoints[endpoint]) {
    apiStats.endpoints[endpoint].cacheHitCount++;
  }
  
  // Mise à jour des données temporelles
  updateTimeSeriesData();
};

/**
 * Incrémente le compteur de retries
 * @param {string} endpoint - Endpoint de l'API
 * @param {number} retryCount - Nombre de tentatives
 */
const incrementRetryCount = (endpoint, retryCount = 1) => {
  apiStats.retryCount += retryCount;
  
  apiMetrics.push({
    type: 'api_retry',
    endpoint,
    retryCount,
    timestamp: Date.now()
  });
  
  // Mise à jour des données temporelles
  updateTimeSeriesData();
};

/**
 * Suit un appel API et gère le debouncing pour éviter les appels redondants
 * @param {string} endpoint - Endpoint de l'API
 * @param {Object} parameters - Paramètres de l'appel
 * @param {Function} apiCall - Fonction d'appel API à exécuter
 * @returns {Promise<any>} Résultat de l'appel API
 */
const trackApiCall = async (endpoint, parameters, apiCall) => {
  if (!isInitialized) initialize();
  
  // Créer une clé unique pour cet appel (endpoint + paramètres sérialisés)
  const callKey = `${endpoint}:${JSON.stringify(parameters)}`;
  
  // Vérifier si cet appel est déjà en cours (debouncing)
  if (apiDebounceMap.has(callKey)) {
    return apiDebounceMap.get(callKey);
  }
  
  // Enregistrer le début de l'appel
  const startTime = performance.now();
  
  // Créer une promesse pour cet appel et la stocker dans la map de debounce
  const apiPromise = new Promise(async (resolve, reject) => {
    try {
      // Exécuter l'appel API
      const result = await apiCall();
      
      // Calculer la durée
      const duration = performance.now() - startTime;
      
      // Suivre la performance
      trackApiPerformance(endpoint, duration, {
        status: 'success',
        parameterCount: Object.keys(parameters).length,
        responseSize: JSON.stringify(result).length,
        cached: result.cached || false
      });
      
      // Si le résultat provient du cache, enregistrer un hit de cache
      if (result.cached) {
        logCacheHit(endpoint, duration, { result });
      }
      
      resolve(result);
    } catch (error) {
      // Calculer la durée même en cas d'erreur
      const duration = performance.now() - startTime;
      
      // Enregistrer l'erreur
      logApiError(endpoint, error, {
        parameters,
        duration
      });
      
      reject(error);
    } finally {
      // Supprimer l'appel de la map de debounce après un court délai
      // pour permettre à d'autres appels identiques d'utiliser la même promesse
      setTimeout(() => {
        apiDebounceMap.delete(callKey);
      }, 100);
    }
  });
  
  // Stocker la promesse dans la map
  apiDebounceMap.set(callKey, apiPromise);
  
  return apiPromise;
};

/**
 * Réinitialise les statistiques d'API
 */
const resetApiStats = () => {
  apiStats = {
    callCount: 0,
    errorCount: 0,
    cacheHitCount: 0,
    fallbackCount: 0,
    retryCount: 0,
    responseTimeTotal: 0,
    longestResponseTime: 0,
    endpoints: {},
    lastUpdated: Date.now(),
    timeSeriesData: {
      timestamps: [],
      responseTimes: [],
      errorRates: [],
      cacheHitRates: []
    }
  };
};

/**
 * Récupère les statistiques d'API actuelles
 * @returns {Object} Statistiques d'API
 */
const getApiStats = () => {
  // Calculer les statistiques dérivées
  const stats = {
    ...apiStats,
    avgResponseTime: apiStats.callCount > 0 
      ? apiStats.responseTimeTotal / apiStats.callCount 
      : 0,
    errorRate: apiStats.callCount > 0 
      ? (apiStats.errorCount / apiStats.callCount) * 100 
      : 0,
    cacheHitRate: apiStats.callCount > 0 
      ? (apiStats.cacheHitCount / apiStats.callCount) * 100 
      : 0,
    retryRate: apiStats.callCount > 0 
      ? (apiStats.retryCount / apiStats.callCount) * 100 
      : 0
  };
  
  return stats;
};

/**
 * Met à jour les statistiques d'API pour les dashboards
 */
const updateApiStats = async () => {
  try {
    // Envoyer les statistiques au backend
    await axios.post(API_METRICS_ENDPOINT, getApiStats());
    
    // Mettre à jour le timestamp de dernière mise à jour
    apiStats.lastUpdated = Date.now();
  } catch (error) {
    console.warn('Failed to update API stats:', error);
  }
};

/**
 * Met à jour les données temporelles pour les graphiques
 */
const updateTimeSeriesData = () => {
  const now = Date.now();
  
  // Limiter les points de données (garder les 100 derniers points)
  if (apiStats.timeSeriesData.timestamps.length >= 100) {
    apiStats.timeSeriesData.timestamps.shift();
    apiStats.timeSeriesData.responseTimes.shift();
    apiStats.timeSeriesData.errorRates.shift();
    apiStats.timeSeriesData.cacheHitRates.shift();
  }
  
  // Ajouter de nouveaux points de données
  apiStats.timeSeriesData.timestamps.push(now);
  
  // Calculer les métriques
  const avgResponseTime = apiStats.callCount > 0 
    ? apiStats.responseTimeTotal / apiStats.callCount 
    : 0;
    
  const errorRate = apiStats.callCount > 0 
    ? (apiStats.errorCount / apiStats.callCount) * 100 
    : 0;
    
  const cacheHitRate = apiStats.callCount > 0 
    ? (apiStats.cacheHitCount / apiStats.callCount) * 100 
    : 0;
  
  // Ajouter les points de données
  apiStats.timeSeriesData.responseTimes.push(avgResponseTime);
  apiStats.timeSeriesData.errorRates.push(errorRate);
  apiStats.timeSeriesData.cacheHitRates.push(cacheHitRate);
};

// Export du service
const monitoringService = {
  initialize,
  trackComponentPerformance,
  trackComponentUnmount,
  trackBrowserPerformance,
  trackApiPerformance,
  trackError,
  trackUserInteraction,
  trackUserEngagement,
  trackGenericMetric,
  logApiError,
  logFallbackUsage,
  logCacheHit,
  incrementRetryCount,
  trackApiCall,
  getApiStats,
  resetApiStats,
  updateApiStats
};

// Auto-initialisation
initialize();

export default monitoringService;
