/**
 * Module de monitoring pour Dashboard-Velo
 * Configure le monitoring des performances et des erreurs pour l'audience européenne
 */

const os = require('os');
const { performance } = require('perf_hooks');
const ApiQuotaManager = require('./apiQuotaManager');
const QuotaAnalytics = require('./quota-analytics');
const logger = require('./logger');

// Configuration
const config = {
  // Intervalle de collecte des métriques (ms)
  metricsInterval: 60000, // 1 minute
  
  // Seuils d'alerte
  thresholds: {
    cpu: 80, // Pourcentage d'utilisation CPU
    memory: 85, // Pourcentage d'utilisation mémoire
    responseTime: 1000, // ms
    errorRate: 5, // Pourcentage
    quotaUsage: 80 // Pourcentage
  },
  
  // Configuration des alertes par pays/région
  geoAlerts: {
    // Seuils spécifiques par région
    regions: {
      western: { quotaUsage: 85, errorRate: 4 },
      eastern: { quotaUsage: 75, errorRate: 6 },
      northern: { quotaUsage: 80, errorRate: 5 },
      southern: { quotaUsage: 80, errorRate: 5 },
      central: { quotaUsage: 85, errorRate: 4 }
    },
    
    // Seuils spécifiques par pays
    countries: {
      fr: { quotaUsage: 90, errorRate: 3 },
      de: { quotaUsage: 90, errorRate: 3 },
      it: { quotaUsage: 85, errorRate: 4 },
      es: { quotaUsage: 85, errorRate: 4 }
    }
  }
};

// Métriques collectées
const metrics = {
  startTime: Date.now(),
  requests: {
    total: 0,
    success: 0,
    error: 0,
    byEndpoint: {},
    byCountry: {},
    byRegion: {}
  },
  performance: {
    responseTime: {
      avg: 0,
      min: Number.MAX_SAFE_INTEGER,
      max: 0,
      samples: 0
    },
    byEndpoint: {},
    byCountry: {},
    byRegion: {}
  },
  system: {
    cpu: 0,
    memory: {
      used: 0,
      total: 0,
      percentage: 0
    },
    uptime: 0
  },
  quotas: {
    daily: {
      used: 0,
      limit: 0,
      percentage: 0
    },
    hourly: {
      used: 0,
      limit: 0,
      percentage: 0
    },
    byCountry: {},
    byRegion: {}
  },
  alerts: []
};

/**
 * Collecte les métriques système
 */
function collectSystemMetrics() {
  // CPU
  const cpus = os.cpus();
  let totalIdle = 0;
  let totalTick = 0;
  
  cpus.forEach(cpu => {
    for (const type in cpu.times) {
      totalTick += cpu.times[type];
    }
    totalIdle += cpu.times.idle;
  });
  
  const idle = totalIdle / cpus.length;
  const total = totalTick / cpus.length;
  const usage = 100 - (idle / total * 100);
  
  metrics.system.cpu = Math.round(usage);
  
  // Mémoire
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  
  metrics.system.memory.total = totalMem;
  metrics.system.memory.used = usedMem;
  metrics.system.memory.percentage = Math.round((usedMem / totalMem) * 100);
  
  // Uptime
  metrics.system.uptime = Math.floor((Date.now() - metrics.startTime) / 1000);
}

/**
 * Collecte les métriques de quota
 */
function collectQuotaMetrics() {
  const apiQuotaManager = ApiQuotaManager.getInstance();
  const quotaAnalytics = QuotaAnalytics.getInstance();
  
  // Quotas généraux
  const dailyQuota = apiQuotaManager.getDailyQuota();
  const hourlyQuota = apiQuotaManager.getHourlyQuota();
  
  metrics.quotas.daily.used = dailyQuota.used;
  metrics.quotas.daily.limit = dailyQuota.limit;
  metrics.quotas.daily.percentage = Math.round((dailyQuota.used / dailyQuota.limit) * 100);
  
  metrics.quotas.hourly.used = hourlyQuota.used;
  metrics.quotas.hourly.limit = hourlyQuota.limit;
  metrics.quotas.hourly.percentage = Math.round((hourlyQuota.used / hourlyQuota.limit) * 100);
  
  // Quotas par pays
  const countryDistribution = quotaAnalytics.getCountryDistribution();
  
  if (countryDistribution && Array.isArray(countryDistribution)) {
    countryDistribution.forEach(item => {
      if (item.country && item.count) {
        metrics.quotas.byCountry[item.country] = {
          used: item.count,
          percentage: Math.round((item.count / dailyQuota.limit) * 100)
        };
      }
    });
  }
  
  // Quotas par région
  const regionCountries = {
    western: ['fr', 'be', 'nl', 'lu'],
    eastern: ['pl', 'cz', 'sk', 'hu', 'ro', 'bg'],
    northern: ['dk', 'se', 'no', 'fi', 'ee', 'lv', 'lt'],
    southern: ['es', 'pt', 'it', 'gr', 'hr', 'si'],
    central: ['de', 'at', 'ch']
  };
  
  Object.entries(regionCountries).forEach(([region, countries]) => {
    let regionalUsage = 0;
    
    countries.forEach(country => {
      if (metrics.quotas.byCountry[country]) {
        regionalUsage += metrics.quotas.byCountry[country].used;
      }
    });
    
    metrics.quotas.byRegion[region] = {
      used: regionalUsage,
      percentage: Math.round((regionalUsage / dailyQuota.limit) * 100)
    };
  });
}

/**
 * Vérifie les seuils d'alerte et génère des alertes si nécessaire
 */
function checkAlertThresholds() {
  const alerts = [];
  
  // Vérifier les seuils système
  if (metrics.system.cpu > config.thresholds.cpu) {
    alerts.push({
      type: 'system',
      severity: 'warning',
      message: `Utilisation CPU élevée: ${metrics.system.cpu}%`,
      timestamp: new Date().toISOString()
    });
  }
  
  if (metrics.system.memory.percentage > config.thresholds.memory) {
    alerts.push({
      type: 'system',
      severity: 'warning',
      message: `Utilisation mémoire élevée: ${metrics.system.memory.percentage}%`,
      timestamp: new Date().toISOString()
    });
  }
  
  // Vérifier les seuils de quota
  if (metrics.quotas.daily.percentage > config.thresholds.quotaUsage) {
    alerts.push({
      type: 'quota',
      severity: 'warning',
      message: `Utilisation élevée du quota journalier: ${metrics.quotas.daily.percentage}%`,
      timestamp: new Date().toISOString()
    });
  }
  
  if (metrics.quotas.hourly.percentage > config.thresholds.quotaUsage) {
    alerts.push({
      type: 'quota',
      severity: 'warning',
      message: `Utilisation élevée du quota horaire: ${metrics.quotas.hourly.percentage}%`,
      timestamp: new Date().toISOString()
    });
  }
  
  // Vérifier les seuils par pays
  Object.entries(metrics.quotas.byCountry).forEach(([country, quota]) => {
    const countryThreshold = config.geoAlerts.countries[country]?.quotaUsage || config.thresholds.quotaUsage;
    
    if (quota.percentage > countryThreshold) {
      alerts.push({
        type: 'quota',
        severity: 'warning',
        message: `Utilisation élevée du quota pour ${country}: ${quota.percentage}%`,
        country,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  // Vérifier les seuils par région
  Object.entries(metrics.quotas.byRegion).forEach(([region, quota]) => {
    const regionThreshold = config.geoAlerts.regions[region]?.quotaUsage || config.thresholds.quotaUsage;
    
    if (quota.percentage > regionThreshold) {
      alerts.push({
        type: 'quota',
        severity: 'warning',
        message: `Utilisation élevée du quota pour la région ${region}: ${quota.percentage}%`,
        region,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  // Vérifier le taux d'erreur
  if (metrics.requests.total > 0) {
    const errorRate = (metrics.requests.error / metrics.requests.total) * 100;
    
    if (errorRate > config.thresholds.errorRate) {
      alerts.push({
        type: 'error',
        severity: 'error',
        message: `Taux d'erreur élevé: ${errorRate.toFixed(2)}%`,
        timestamp: new Date().toISOString()
      });
    }
    
    // Vérifier le taux d'erreur par pays
    Object.entries(metrics.requests.byCountry).forEach(([country, data]) => {
      if (data.total > 0) {
        const countryErrorRate = (data.error / data.total) * 100;
        const countryThreshold = config.geoAlerts.countries[country]?.errorRate || config.thresholds.errorRate;
        
        if (countryErrorRate > countryThreshold) {
          alerts.push({
            type: 'error',
            severity: 'error',
            message: `Taux d'erreur élevé pour ${country}: ${countryErrorRate.toFixed(2)}%`,
            country,
            timestamp: new Date().toISOString()
          });
        }
      }
    });
    
    // Vérifier le taux d'erreur par région
    Object.entries(metrics.requests.byRegion).forEach(([region, data]) => {
      if (data.total > 0) {
        const regionErrorRate = (data.error / data.total) * 100;
        const regionThreshold = config.geoAlerts.regions[region]?.errorRate || config.thresholds.errorRate;
        
        if (regionErrorRate > regionThreshold) {
          alerts.push({
            type: 'error',
            severity: 'error',
            message: `Taux d'erreur élevé pour la région ${region}: ${regionErrorRate.toFixed(2)}%`,
            region,
            timestamp: new Date().toISOString()
          });
        }
      }
    });
  }
  
  // Mettre à jour les alertes
  metrics.alerts = alerts;
  
  // Journaliser les alertes
  alerts.forEach(alert => {
    if (alert.severity === 'error') {
      logger.error(alert.message, { alert });
    } else {
      logger.warn(alert.message, { alert });
    }
  });
  
  return alerts;
}

/**
 * Middleware de monitoring des requêtes
 */
function requestMonitoringMiddleware() {
  return (req, res, next) => {
    // Marquer le début de la requête
    const startTime = performance.now();
    
    // Fonction pour enregistrer les métriques
    const recordMetrics = () => {
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      // Incrémenter le compteur de requêtes
      metrics.requests.total++;
      
      // Vérifier si la requête a réussi ou échoué
      const isSuccess = res.statusCode >= 200 && res.statusCode < 400;
      
      if (isSuccess) {
        metrics.requests.success++;
      } else {
        metrics.requests.error++;
      }
      
      // Mettre à jour les métriques de temps de réponse
      metrics.performance.responseTime.samples++;
      metrics.performance.responseTime.avg = (
        (metrics.performance.responseTime.avg * (metrics.performance.responseTime.samples - 1)) +
        responseTime
      ) / metrics.performance.responseTime.samples;
      
      metrics.performance.responseTime.min = Math.min(metrics.performance.responseTime.min, responseTime);
      metrics.performance.responseTime.max = Math.max(metrics.performance.responseTime.max, responseTime);
      
      // Mettre à jour les métriques par endpoint
      const endpoint = req.path;
      
      if (!metrics.requests.byEndpoint[endpoint]) {
        metrics.requests.byEndpoint[endpoint] = {
          total: 0,
          success: 0,
          error: 0
        };
      }
      
      if (!metrics.performance.byEndpoint[endpoint]) {
        metrics.performance.byEndpoint[endpoint] = {
          avg: 0,
          min: Number.MAX_SAFE_INTEGER,
          max: 0,
          samples: 0
        };
      }
      
      metrics.requests.byEndpoint[endpoint].total++;
      
      if (isSuccess) {
        metrics.requests.byEndpoint[endpoint].success++;
      } else {
        metrics.requests.byEndpoint[endpoint].error++;
      }
      
      metrics.performance.byEndpoint[endpoint].samples++;
      metrics.performance.byEndpoint[endpoint].avg = (
        (metrics.performance.byEndpoint[endpoint].avg * (metrics.performance.byEndpoint[endpoint].samples - 1)) +
        responseTime
      ) / metrics.performance.byEndpoint[endpoint].samples;
      
      metrics.performance.byEndpoint[endpoint].min = Math.min(metrics.performance.byEndpoint[endpoint].min, responseTime);
      metrics.performance.byEndpoint[endpoint].max = Math.max(metrics.performance.byEndpoint[endpoint].max, responseTime);
      
      // Mettre à jour les métriques par pays
      if (req.query.country) {
        const country = req.query.country;
        
        if (!metrics.requests.byCountry[country]) {
          metrics.requests.byCountry[country] = {
            total: 0,
            success: 0,
            error: 0
          };
        }
        
        if (!metrics.performance.byCountry[country]) {
          metrics.performance.byCountry[country] = {
            avg: 0,
            min: Number.MAX_SAFE_INTEGER,
            max: 0,
            samples: 0
          };
        }
        
        metrics.requests.byCountry[country].total++;
        
        if (isSuccess) {
          metrics.requests.byCountry[country].success++;
        } else {
          metrics.requests.byCountry[country].error++;
        }
        
        metrics.performance.byCountry[country].samples++;
        metrics.performance.byCountry[country].avg = (
          (metrics.performance.byCountry[country].avg * (metrics.performance.byCountry[country].samples - 1)) +
          responseTime
        ) / metrics.performance.byCountry[country].samples;
        
        metrics.performance.byCountry[country].min = Math.min(metrics.performance.byCountry[country].min, responseTime);
        metrics.performance.byCountry[country].max = Math.max(metrics.performance.byCountry[country].max, responseTime);
      }
      
      // Mettre à jour les métriques par région
      if (req.query.region) {
        const region = req.query.region;
        
        if (!metrics.requests.byRegion[region]) {
          metrics.requests.byRegion[region] = {
            total: 0,
            success: 0,
            error: 0
          };
        }
        
        if (!metrics.performance.byRegion[region]) {
          metrics.performance.byRegion[region] = {
            avg: 0,
            min: Number.MAX_SAFE_INTEGER,
            max: 0,
            samples: 0
          };
        }
        
        metrics.requests.byRegion[region].total++;
        
        if (isSuccess) {
          metrics.requests.byRegion[region].success++;
        } else {
          metrics.requests.byRegion[region].error++;
        }
        
        metrics.performance.byRegion[region].samples++;
        metrics.performance.byRegion[region].avg = (
          (metrics.performance.byRegion[region].avg * (metrics.performance.byRegion[region].samples - 1)) +
          responseTime
        ) / metrics.performance.byRegion[region].samples;
        
        metrics.performance.byRegion[region].min = Math.min(metrics.performance.byRegion[region].min, responseTime);
        metrics.performance.byRegion[region].max = Math.max(metrics.performance.byRegion[region].max, responseTime);
      }
    };
    
    // Intercepter la fin de la requête
    res.on('finish', recordMetrics);
    res.on('close', recordMetrics);
    
    next();
  };
}

/**
 * Initialise la collecte périodique des métriques
 */
function startMetricsCollection() {
  // Collecter les métriques immédiatement
  collectSystemMetrics();
  collectQuotaMetrics();
  checkAlertThresholds();
  
  // Configurer la collecte périodique
  setInterval(() => {
    collectSystemMetrics();
    collectQuotaMetrics();
    checkAlertThresholds();
  }, config.metricsInterval);
  
  logger.info('Collecte des métriques démarrée');
}

/**
 * Endpoint pour récupérer les métriques
 */
function metricsEndpoint(req, res) {
  // Mettre à jour les métriques système avant de les renvoyer
  collectSystemMetrics();
  collectQuotaMetrics();
  
  res.json({
    timestamp: new Date().toISOString(),
    metrics
  });
}

/**
 * Endpoint pour récupérer les alertes
 */
function alertsEndpoint(req, res) {
  // Vérifier les seuils d'alerte avant de renvoyer les alertes
  const alerts = checkAlertThresholds();
  
  res.json({
    timestamp: new Date().toISOString(),
    alerts
  });
}

/**
 * Configure le monitoring pour l'application
 * @param {Object} app - Application Express
 */
function setupMonitoring(app) {
  // Ajouter le middleware de monitoring des requêtes
  app.use(requestMonitoringMiddleware());
  
  // Ajouter les endpoints de monitoring
  app.get('/api/dashboard/monitoring/metrics', (req, res) => {
    metricsEndpoint(req, res);
  });
  
  app.get('/api/dashboard/monitoring/alerts', (req, res) => {
    alertsEndpoint(req, res);
  });
  
  // Démarrer la collecte des métriques
  startMetricsCollection();
  
  logger.info('Monitoring configuré');
}

/**
 * Initialise le monitoring post-lancement
 */
function initPostLaunchMonitoring() {
  // Configurer des alertes spécifiques pour le post-lancement
  const postLaunchConfig = {
    // Période de surveillance post-lancement (ms)
    monitoringPeriod: 3600000, // 1 heure
    
    // Seuils d'alerte plus stricts pour la période post-lancement
    thresholds: {
      responseTime: 800, // ms
      errorRate: 3, // Pourcentage
      quotaUsage: 70 // Pourcentage
    }
  };
  
  // Sauvegarder les seuils d'origine
  const originalThresholds = { ...config.thresholds };
  
  // Appliquer les seuils post-lancement
  config.thresholds = { ...config.thresholds, ...postLaunchConfig.thresholds };
  
  logger.info('Monitoring post-lancement initialisé avec des seuils plus stricts');
  
  // Restaurer les seuils d'origine après la période de surveillance
  setTimeout(() => {
    config.thresholds = originalThresholds;
    logger.info('Seuils de monitoring restaurés aux valeurs normales après la période post-lancement');
  }, postLaunchConfig.monitoringPeriod);
}

module.exports = {
  setupMonitoring,
  initPostLaunchMonitoring,
  getMetrics: () => ({ ...metrics }),
  getAlerts: () => checkAlertThresholds()
};
