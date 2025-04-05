/**
 * Service de monitoring des performances
 * Permet de suivre les métriques de performance du site en production
 */

const mongoose = require('mongoose');
const os = require('os');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const winston = require('winston');
const Prometheus = require('prom-client');
const dayjs = require('dayjs');
const config = require('../config/config');

// Configuration du client Prometheus
const collectDefaultMetrics = Prometheus.collectDefaultMetrics;
const Registry = Prometheus.Registry;
const register = new Registry();
collectDefaultMetrics({ register });

// Création des métriques personnalisées
const httpRequestDurationMicroseconds = new Prometheus.Histogram({
  name: 'http_request_duration_ms',
  help: 'Durée des requêtes HTTP en millisecondes',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000]
});

const apiCallCounter = new Prometheus.Counter({
  name: 'api_calls_total',
  help: 'Nombre total d\'appels API',
  labelNames: ['method', 'endpoint', 'status']
});

const databaseQueryDuration = new Prometheus.Histogram({
  name: 'database_query_duration_ms',
  help: 'Durée des requêtes de base de données en millisecondes',
  labelNames: ['operation', 'collection'],
  buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000]
});

const mapRenderingTime = new Prometheus.Histogram({
  name: 'map_rendering_time_ms',
  help: 'Temps de rendu de la carte en millisecondes',
  labelNames: ['complexity', 'zoom_level'],
  buckets: [50, 100, 250, 500, 1000, 2500, 5000, 10000]
});

const visualizationRenderingTime = new Prometheus.Histogram({
  name: 'visualization_rendering_time_ms',
  help: 'Temps de rendu des visualisations 3D en millisecondes',
  labelNames: ['type', 'complexity'],
  buckets: [50, 100, 250, 500, 1000, 2500, 5000, 10000]
});

const memoryUsageGauge = new Prometheus.Gauge({
  name: 'memory_usage_bytes',
  help: 'Utilisation de la mémoire en bytes'
});

const activeSessions = new Prometheus.Gauge({
  name: 'active_sessions',
  help: 'Nombre de sessions utilisateurs actives'
});

// Enregistrement des métriques personnalisées
register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(apiCallCounter);
register.registerMetric(databaseQueryDuration);
register.registerMetric(mapRenderingTime);
register.registerMetric(visualizationRenderingTime);
register.registerMetric(memoryUsageGauge);
register.registerMetric(activeSessions);

// Configuration de Winston pour les logs de performance
const performanceLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'performance-monitoring' },
  transports: [
    new winston.transports.File({ filename: 'logs/performance-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/performance-combined.log' })
  ]
});

// Ajouter console en développement
if (process.env.NODE_ENV !== 'production') {
  performanceLogger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

/**
 * Middleware de monitoring HTTP
 */
const httpMonitoringMiddleware = (req, res, next) => {
  const start = Date.now();
  
  // Ajouter un eventListener pour la fin de la réponse
  res.on('finish', () => {
    const duration = Date.now() - start;
    const route = req.route ? req.route.path : req.path;
    
    // Enregistrer la métrique dans Prometheus
    httpRequestDurationMicroseconds
      .labels(req.method, route, res.statusCode)
      .observe(duration);
    
    // Compter l'appel API
    apiCallCounter
      .labels(req.method, route, res.statusCode)
      .inc();
    
    // Enregistrer les requêtes lentes (> 1s) dans les logs
    if (duration > 1000) {
      performanceLogger.warn({
        message: 'Requête HTTP lente détectée',
        method: req.method,
        route,
        duration,
        statusCode: res.statusCode,
        userAgent: req.headers['user-agent'],
        clientIp: req.ip
      });
    }
  });
  
  next();
};

/**
 * Patch Mongoose pour surveiller les performances de la BDD
 */
const setupDatabaseMonitoring = () => {
  const originalExecute = mongoose.Query.prototype.exec;
  
  mongoose.Query.prototype.exec = async function() {
    const start = Date.now();
    const collection = this.model.collection.collectionName;
    const operation = this.op;
    
    try {
      const result = await originalExecute.apply(this, arguments);
      const duration = Date.now() - start;
      
      // Enregistrer la métrique
      databaseQueryDuration
        .labels(operation, collection)
        .observe(duration);
      
      // Logger les requêtes lentes
      if (duration > 500) {
        performanceLogger.warn({
          message: 'Requête DB lente détectée',
          operation,
          collection,
          duration,
          query: JSON.stringify(this.getQuery())
        });
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      
      performanceLogger.error({
        message: 'Erreur de requête DB',
        operation,
        collection,
        duration,
        query: JSON.stringify(this.getQuery()),
        error: error.message,
        stack: error.stack
      });
      
      throw error;
    }
  };
};

/**
 * Collecter les métriques système
 */
const collectSystemMetrics = async () => {
  try {
    // Utilisation mémoire
    const memoryUsage = process.memoryUsage();
    memoryUsageGauge.set(memoryUsage.rss);
    
    performanceLogger.debug({
      message: 'Métriques système',
      memory: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external
      },
      cpu: process.cpuUsage(),
      uptime: process.uptime()
    });
  } catch (error) {
    performanceLogger.error({
      message: 'Erreur lors de la collecte des métriques système',
      error: error.message,
      stack: error.stack
    });
  }
};

/**
 * Enregistre une métrique de rendu de carte
 * @param {Number} renderTimeMs - Temps de rendu en ms
 * @param {String} complexity - Complexité (low, medium, high)
 * @param {Number} zoomLevel - Niveau de zoom
 */
const recordMapRenderingMetric = (renderTimeMs, complexity, zoomLevel) => {
  mapRenderingTime
    .labels(complexity, String(zoomLevel))
    .observe(renderTimeMs);
    
  if (renderTimeMs > 2000) {
    performanceLogger.warn({
      message: 'Rendu de carte lent détecté',
      renderTimeMs,
      complexity,
      zoomLevel
    });
  }
};

/**
 * Enregistre une métrique de rendu de visualisation 3D
 * @param {Number} renderTimeMs - Temps de rendu en ms
 * @param {String} type - Type de visualisation
 * @param {String} complexity - Complexité (low, medium, high)
 */
const recordVisualizationRenderingMetric = (renderTimeMs, type, complexity) => {
  visualizationRenderingTime
    .labels(type, complexity)
    .observe(renderTimeMs);
    
  if (renderTimeMs > 3000) {
    performanceLogger.warn({
      message: 'Rendu de visualisation 3D lent détecté',
      renderTimeMs,
      type,
      complexity
    });
  }
};

/**
 * Met à jour le nombre de sessions actives
 * @param {Number} count - Nombre de sessions actives
 */
const updateActiveSessionCount = (count) => {
  activeSessions.set(count);
};

/**
 * Génère un rapport de performance quotidien
 */
const generateDailyPerformanceReport = async () => {
  try {
    const metrics = await register.getMetricsAsJSON();
    
    // Traitement et analyse des métriques pour le rapport
    const report = {
      date: dayjs().format('YYYY-MM-DD'),
      httpRequestSummary: {
        totalRequests: metrics.find(m => m.name === 'api_calls_total')?.values || [],
        averageDuration: calculateAverageDuration(metrics.find(m => m.name === 'http_request_duration_ms')),
        slowEndpoints: findSlowEndpoints(metrics.find(m => m.name === 'http_request_duration_ms'))
      },
      databasePerformance: {
        averageQueryTime: calculateAverageDuration(metrics.find(m => m.name === 'database_query_duration_ms')),
        slowestQueries: findSlowOperations(metrics.find(m => m.name === 'database_query_duration_ms'))
      },
      renderingPerformance: {
        maps: calculateAverageDuration(metrics.find(m => m.name === 'map_rendering_time_ms')),
        visualizations: calculateAverageDuration(metrics.find(m => m.name === 'visualization_rendering_time_ms'))
      },
      systemResources: {
        peakMemoryUsage: getPeakValue(metrics.find(m => m.name === 'memory_usage_bytes')),
        peakActiveSessions: getPeakValue(metrics.find(m => m.name === 'active_sessions'))
      }
    };
    
    performanceLogger.info({
      message: 'Rapport quotidien de performance',
      report
    });
    
    // Sauvegarder le rapport dans la base de données pour historisation
    // TODO: Implémenter la persistance du rapport
    
    return report;
  } catch (error) {
    performanceLogger.error({
      message: 'Erreur lors de la génération du rapport de performance',
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

// Fonctions utilitaires pour l'analyse des métriques
const calculateAverageDuration = (metricData) => {
  if (!metricData || !metricData.values || metricData.values.length === 0) {
    return 0;
  }
  
  let sum = 0;
  let count = 0;
  
  metricData.values.forEach(v => {
    sum += v.value * v.metricName;
    count += v.value;
  });
  
  return count > 0 ? sum / count : 0;
};

const findSlowEndpoints = (metricData) => {
  if (!metricData || !metricData.values) return [];
  
  const endpointStats = {};
  
  metricData.values.forEach(v => {
    const endpoint = `${v.labels.method} ${v.labels.route}`;
    if (!endpointStats[endpoint]) {
      endpointStats[endpoint] = { totalTime: 0, count: 0 };
    }
    endpointStats[endpoint].totalTime += v.value * v.metricName;
    endpointStats[endpoint].count += v.value;
  });
  
  const results = Object.entries(endpointStats).map(([endpoint, stats]) => ({
    endpoint,
    averageDuration: stats.count > 0 ? stats.totalTime / stats.count : 0,
    count: stats.count
  }));
  
  return results.sort((a, b) => b.averageDuration - a.averageDuration).slice(0, 5);
};

const findSlowOperations = (metricData) => {
  if (!metricData || !metricData.values) return [];
  
  const operationStats = {};
  
  metricData.values.forEach(v => {
    const operation = `${v.labels.operation} ${v.labels.collection}`;
    if (!operationStats[operation]) {
      operationStats[operation] = { totalTime: 0, count: 0 };
    }
    operationStats[operation].totalTime += v.value * v.metricName;
    operationStats[operation].count += v.value;
  });
  
  const results = Object.entries(operationStats).map(([operation, stats]) => ({
    operation,
    averageDuration: stats.count > 0 ? stats.totalTime / stats.count : 0,
    count: stats.count
  }));
  
  return results.sort((a, b) => b.averageDuration - a.averageDuration).slice(0, 5);
};

const getPeakValue = (metricData) => {
  if (!metricData || !metricData.values || metricData.values.length === 0) {
    return 0;
  }
  
  return Math.max(...metricData.values.map(v => v.value));
};

/**
 * Initialisation du système de monitoring
 */
const initMonitoring = () => {
  // Surveiller les requêtes DB
  setupDatabaseMonitoring();
  
  // Collecter les métriques système toutes les minutes
  setInterval(collectSystemMetrics, 60000);
  
  // Générer un rapport quotidien à minuit
  const scheduleNextReport = () => {
    const now = new Date();
    const night = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1, // demain
      0, 0, 0 // minuit
    );
    const timeToMidnight = night.getTime() - now.getTime();
    
    setTimeout(() => {
      generateDailyPerformanceReport();
      scheduleNextReport(); // programmer le prochain rapport
    }, timeToMidnight);
  };
  
  scheduleNextReport();
  
  performanceLogger.info({
    message: 'Système de monitoring des performances initialisé',
    environment: process.env.NODE_ENV
  });
};

module.exports = {
  httpMonitoringMiddleware,
  initMonitoring,
  recordMapRenderingMetric,
  recordVisualizationRenderingMetric,
  updateActiveSessionCount,
  generateDailyPerformanceReport,
  register, // Exposer le registre pour les endpoints metrics
  performanceLogger
};
