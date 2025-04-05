/**
 * Module de surveillance des services externes
 * Étend le système de monitoring pour surveiller tous les services externes
 * et intégrer des métriques spécifiques aux fonctionnalités de cyclisme
 */

const axios = require('axios');
const Prometheus = require('prom-client');
const winston = require('winston');
const config = require('../config/config');
const performanceMonitoringService = require('./performance-monitoring.service');

// Registre pour les métriques spécifiques aux services externes
const register = performanceMonitoringService.register;

// Configuration du logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'external-services-monitor' },
  transports: [
    new winston.transports.File({ filename: 'logs/external-services-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/external-services-combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Définition des métriques pour les services externes
const externalApiCallDuration = new Prometheus.Histogram({
  name: 'external_api_call_duration_ms',
  help: 'Durée des appels aux API externes en millisecondes',
  labelNames: ['service', 'endpoint', 'status'],
  buckets: [10, 50, 100, 250, 500, 1000, 2500, 5000, 10000]
});

const externalApiCallCounter = new Prometheus.Counter({
  name: 'external_api_calls_total',
  help: 'Nombre total d\'appels aux API externes',
  labelNames: ['service', 'endpoint', 'status']
});

const externalApiErrorCounter = new Prometheus.Counter({
  name: 'external_api_errors_total',
  help: 'Nombre total d\'erreurs lors des appels aux API externes',
  labelNames: ['service', 'endpoint', 'error_type']
});

const externalApiQuotaGauge = new Prometheus.Gauge({
  name: 'external_api_quota_remaining',
  help: 'Quota restant pour chaque API externe',
  labelNames: ['service']
});

// Métriques spécifiques au cyclisme
const visualization3DRenderingTime = new Prometheus.Histogram({
  name: 'visualization_3d_rendering_time_ms',
  help: 'Temps de génération des visualisations 3D en millisecondes',
  labelNames: ['col_id', 'resolution', 'complexity'],
  buckets: [100, 250, 500, 1000, 2500, 5000, 10000, 15000]
});

const trainingZonesCalculationTime = new Prometheus.Histogram({
  name: 'training_zones_calculation_time_ms',
  help: 'Temps de calcul des zones d\'entraînement en millisecondes',
  labelNames: ['zone_type', 'with_nutrition_data'],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000]
});

const routePlanningCalculationTime = new Prometheus.Histogram({
  name: 'route_planning_calculation_time_ms',
  help: 'Temps de calcul pour la planification d\'itinéraire en millisecondes',
  labelNames: ['distance_km', 'elevation_profile', 'with_weather_data'],
  buckets: [50, 100, 250, 500, 1000, 2500, 5000, 10000]
});

const nutritionCalculationTime = new Prometheus.Histogram({
  name: 'nutrition_calculation_time_ms',
  help: 'Temps de calcul des recommandations nutritionnelles en millisecondes',
  labelNames: ['calculation_type', 'with_training_data'],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000]
});

// Enregistrer les métriques
register.registerMetric(externalApiCallDuration);
register.registerMetric(externalApiCallCounter);
register.registerMetric(externalApiErrorCounter);
register.registerMetric(externalApiQuotaGauge);
register.registerMetric(visualization3DRenderingTime);
register.registerMetric(trainingZonesCalculationTime);
register.registerMetric(routePlanningCalculationTime);
register.registerMetric(nutritionCalculationTime);

// Liste des services externes à surveiller
const EXTERNAL_SERVICES = {
  STRAVA: {
    name: 'strava',
    baseUrl: 'https://www.strava.com/api/v3',
    healthCheckEndpoint: '/athlete',
    quotaEndpoint: '/usage',
    credentials: {
      clientId: process.env.STRAVA_CLIENT_ID,
      clientSecret: process.env.STRAVA_CLIENT_SECRET,
      refreshToken: process.env.STRAVA_REFRESH_TOKEN
    },
    quotaThresholds: {
      warning: 100,  // Alerte quand il reste 100 appels
      critical: 20   // Alerte critique quand il reste 20 appels
    }
  },
  WEATHER_API: {
    name: 'weatherapi',
    baseUrl: 'https://api.weatherapi.com/v1',
    healthCheckEndpoint: '/current.json',
    quotaEndpoint: '/usage.json',
    credentials: {
      apiKey: process.env.WEATHER_API_KEY
    },
    quotaThresholds: {
      warning: 500,
      critical: 100
    }
  },
  MAPBOX: {
    name: 'mapbox',
    baseUrl: 'https://api.mapbox.com',
    healthCheckEndpoint: '/directions/v5/mapbox/cycling',
    credentials: {
      apiKey: process.env.MAPBOX_API_KEY
    },
    quotaThresholds: {
      warning: 10000,
      critical: 1000
    }
  },
  NUTRITION_DB: {
    name: 'nutritiondb',
    baseUrl: 'https://api.nutritiondb.io/v1',
    healthCheckEndpoint: '/foods',
    credentials: {
      apiKey: process.env.NUTRITION_DB_API_KEY
    },
    quotaThresholds: {
      warning: 200,
      critical: 50
    }
  }
};

/**
 * Intercepteur HTTP pour surveiller tous les appels externes
 */
const setupAxiosInterceptors = () => {
  // Intercepteur pour les requêtes
  axios.interceptors.request.use(config => {
    config.meta = { startTime: Date.now() };
    return config;
  }, error => {
    return Promise.reject(error);
  });

  // Intercepteur pour les réponses
  axios.interceptors.response.use(
    response => {
      const duration = Date.now() - response.config.meta.startTime;
      
      // Identifier le service externe
      const url = new URL(response.config.url);
      const baseUrl = `${url.protocol}//${url.hostname}`;
      
      // Trouver le service correspondant
      let serviceName = 'unknown';
      let endpoint = url.pathname;
      
      for (const [key, service] of Object.entries(EXTERNAL_SERVICES)) {
        if (response.config.url.startsWith(service.baseUrl)) {
          serviceName = service.name;
          endpoint = url.pathname.replace(new URL(service.baseUrl).pathname, '');
          break;
        }
      }
      
      // Enregistrer les métriques
      externalApiCallDuration
        .labels(serviceName, endpoint, response.status.toString())
        .observe(duration);
        
      externalApiCallCounter
        .labels(serviceName, endpoint, response.status.toString())
        .inc();
        
      // Logger les appels lents (> 1s)
      if (duration > 1000) {
        logger.warn({
          message: 'Appel API externe lent',
          service: serviceName,
          endpoint,
          duration,
          status: response.status
        });
      }
      
      // Vérifier les informations de quota si présentes dans la réponse
      if (response.headers['x-ratelimit-remaining']) {
        const remainingQuota = parseInt(response.headers['x-ratelimit-remaining'], 10);
        externalApiQuotaGauge.labels(serviceName).set(remainingQuota);
        
        // Vérifier les seuils d'alerte
        const service = Object.values(EXTERNAL_SERVICES).find(s => s.name === serviceName);
        if (service && service.quotaThresholds) {
          if (remainingQuota <= service.quotaThresholds.critical) {
            logger.error({
              message: 'Quota API critique',
              service: serviceName,
              remainingQuota
            });
          } else if (remainingQuota <= service.quotaThresholds.warning) {
            logger.warn({
              message: 'Quota API bas',
              service: serviceName,
              remainingQuota
            });
          }
        }
      }
      
      return response;
    },
    error => {
      if (error.config) {
        const duration = Date.now() - (error.config.meta ? error.config.meta.startTime : Date.now());
        
        // Identifier le service externe
        const url = new URL(error.config.url);
        const baseUrl = `${url.protocol}//${url.hostname}`;
        
        // Trouver le service correspondant
        let serviceName = 'unknown';
        let endpoint = url.pathname;
        
        for (const [key, service] of Object.entries(EXTERNAL_SERVICES)) {
          if (error.config.url.startsWith(service.baseUrl)) {
            serviceName = service.name;
            endpoint = url.pathname.replace(new URL(service.baseUrl).pathname, '');
            break;
          }
        }
        
        // Déterminer le type d'erreur
        let status = error.response ? error.response.status.toString() : 'network_error';
        let errorType = 'unknown';
        
        if (error.response) {
          errorType = `http_${error.response.status}`;
        } else if (error.code) {
          errorType = error.code;
        } else if (error.message) {
          errorType = error.message.substring(0, 30);
        }
        
        // Enregistrer les métriques
        externalApiCallDuration
          .labels(serviceName, endpoint, status)
          .observe(duration);
          
        externalApiErrorCounter
          .labels(serviceName, endpoint, errorType)
          .inc();
          
        // Logger l'erreur
        logger.error({
          message: 'Erreur API externe',
          service: serviceName,
          endpoint,
          duration,
          errorType,
          status,
          errorMessage: error.message,
          stack: error.stack
        });
      }
      
      return Promise.reject(error);
    }
  );
};

/**
 * Vérifie la santé et le quota de tous les services externes
 * @returns {Promise<Object>} - État de santé des services
 */
const checkExternalServicesHealth = async () => {
  const results = {};
  
  for (const [key, service] of Object.entries(EXTERNAL_SERVICES)) {
    try {
      // Construire la requête
      let url = `${service.baseUrl}${service.healthCheckEndpoint}`;
      const params = {};
      const headers = {};
      
      // Ajouter les paramètres d'authentification selon le service
      if (service.credentials.apiKey) {
        if (service.name === 'weatherapi') {
          params.key = service.credentials.apiKey;
          params.q = 'Paris';
        } else if (service.name === 'mapbox') {
          url += `?access_token=${service.credentials.apiKey}`;
        } else {
          headers['X-Api-Key'] = service.credentials.apiKey;
        }
      } else if (service.credentials.refreshToken) {
        headers['Authorization'] = `Bearer ${service.credentials.refreshToken}`;
      }
      
      const startTime = Date.now();
      const response = await axios.get(url, { params, headers });
      const duration = Date.now() - startTime;
      
      results[service.name] = {
        status: 'healthy',
        responseTime: duration,
        timestamp: new Date().toISOString()
      };
      
      // Vérifier le quota si disponible
      if (service.quotaEndpoint) {
        try {
          const quotaUrl = `${service.baseUrl}${service.quotaEndpoint}`;
          const quotaResponse = await axios.get(quotaUrl, { params, headers });
          
          let remainingQuota = null;
          
          // Extraire le quota restant selon le service
          if (service.name === 'strava') {
            remainingQuota = quotaResponse.data.rate_limit_remaining;
          } else if (service.name === 'weatherapi') {
            remainingQuota = quotaResponse.data.data.remaining_calls;
          } else if (quotaResponse.headers['x-ratelimit-remaining']) {
            remainingQuota = parseInt(quotaResponse.headers['x-ratelimit-remaining'], 10);
          }
          
          if (remainingQuota !== null) {
            results[service.name].remainingQuota = remainingQuota;
            externalApiQuotaGauge.labels(service.name).set(remainingQuota);
            
            // Vérifier les seuils d'alerte
            if (remainingQuota <= service.quotaThresholds.critical) {
              results[service.name].quotaStatus = 'critical';
              logger.error({
                message: 'Quota API critique',
                service: service.name,
                remainingQuota
              });
            } else if (remainingQuota <= service.quotaThresholds.warning) {
              results[service.name].quotaStatus = 'warning';
              logger.warn({
                message: 'Quota API bas',
                service: service.name,
                remainingQuota
              });
            } else {
              results[service.name].quotaStatus = 'normal';
            }
          }
        } catch (quotaError) {
          logger.warn({
            message: 'Erreur lors de la vérification du quota',
            service: service.name,
            error: quotaError.message
          });
        }
      }
    } catch (error) {
      results[service.name] = {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
      
      logger.error({
        message: 'Service externe indisponible',
        service: service.name,
        error: error.message,
        stack: error.stack
      });
    }
  }
  
  return results;
};

/**
 * Enregistre le temps de génération d'une visualisation 3D
 * @param {string} colId - ID du col
 * @param {string} resolution - Résolution des données (high, medium, low)
 * @param {string} complexity - Complexité du modèle (high, medium, low)
 * @param {number} durationMs - Durée en millisecondes
 */
const record3DVisualizationTime = (colId, resolution, complexity, durationMs) => {
  visualization3DRenderingTime
    .labels(colId, resolution, complexity)
    .observe(durationMs);
    
  if (durationMs > 5000) {
    logger.warn({
      message: 'Génération de visualisation 3D lente',
      colId,
      resolution,
      complexity,
      durationMs
    });
  }
};

/**
 * Enregistre le temps de calcul des zones d'entraînement
 * @param {string} zoneType - Type de zones (power, hr, pace)
 * @param {boolean} withNutritionData - Si des données nutritionnelles sont incluses
 * @param {number} durationMs - Durée en millisecondes
 */
const recordTrainingZonesCalculationTime = (zoneType, withNutritionData, durationMs) => {
  trainingZonesCalculationTime
    .labels(zoneType, withNutritionData.toString())
    .observe(durationMs);
    
  if (durationMs > 500) {
    logger.warn({
      message: 'Calcul des zones d\'entraînement lent',
      zoneType,
      withNutritionData,
      durationMs
    });
  }
};

/**
 * Enregistre le temps de calcul de planification d'itinéraire
 * @param {number} distanceKm - Distance en km
 * @param {string} elevationProfile - Profil d'élévation (flat, hilly, mountainous)
 * @param {boolean} withWeatherData - Si des données météo sont incluses
 * @param {number} durationMs - Durée en millisecondes
 */
const recordRoutePlanningTime = (distanceKm, elevationProfile, withWeatherData, durationMs) => {
  routePlanningCalculationTime
    .labels(distanceKm.toString(), elevationProfile, withWeatherData.toString())
    .observe(durationMs);
    
  if (durationMs > 2000) {
    logger.warn({
      message: 'Calcul de planification d\'itinéraire lent',
      distanceKm,
      elevationProfile,
      withWeatherData,
      durationMs
    });
  }
};

/**
 * Enregistre le temps de calcul des recommandations nutritionnelles
 * @param {string} calculationType - Type de calcul (daily, pre-ride, during-ride, recovery)
 * @param {boolean} withTrainingData - Si des données d'entraînement sont incluses
 * @param {number} durationMs - Durée en millisecondes
 */
const recordNutritionCalculationTime = (calculationType, withTrainingData, durationMs) => {
  nutritionCalculationTime
    .labels(calculationType, withTrainingData.toString())
    .observe(durationMs);
    
  if (durationMs > 500) {
    logger.warn({
      message: 'Calcul des recommandations nutritionnelles lent',
      calculationType,
      withTrainingData,
      durationMs
    });
  }
};

/**
 * Planifie la vérification régulière des services externes
 * @param {number} intervalMinutes - Intervalle en minutes
 */
const scheduleHealthChecks = (intervalMinutes = 15) => {
  setInterval(async () => {
    try {
      const results = await checkExternalServicesHealth();
      
      // Journaliser l'état des services
      logger.info({
        message: 'État des services externes',
        results
      });
      
      // Vérifier les services non sains
      const unhealthyServices = Object.entries(results)
        .filter(([name, status]) => status.status === 'unhealthy')
        .map(([name]) => name);
        
      if (unhealthyServices.length > 0) {
        logger.error({
          message: 'Services externes indisponibles',
          services: unhealthyServices
        });
      }
      
      // Vérifier les services avec quota bas
      const lowQuotaServices = Object.entries(results)
        .filter(([name, status]) => status.quotaStatus === 'warning' || status.quotaStatus === 'critical')
        .map(([name, status]) => ({
          name,
          status: status.quotaStatus,
          remaining: status.remainingQuota
        }));
        
      if (lowQuotaServices.length > 0) {
        logger.warn({
          message: 'Services avec quota bas',
          services: lowQuotaServices
        });
      }
    } catch (error) {
      logger.error({
        message: 'Erreur lors de la vérification des services externes',
        error: error.message,
        stack: error.stack
      });
    }
  }, intervalMinutes * 60 * 1000);
};

/**
 * Initialise le monitoring des services externes
 */
const initExternalServicesMonitoring = () => {
  // Configurer les intercepteurs
  setupAxiosInterceptors();
  
  // Première vérification des services
  checkExternalServicesHealth().then(results => {
    logger.info({
      message: 'Monitoring des services externes initialisé',
      initialStatus: results
    });
  });
  
  // Planifier les vérifications régulières
  scheduleHealthChecks();
  
  return {
    checkExternalServicesHealth,
    record3DVisualizationTime,
    recordTrainingZonesCalculationTime,
    recordRoutePlanningTime,
    recordNutritionCalculationTime
  };
};

module.exports = {
  initExternalServicesMonitoring,
  checkExternalServicesHealth,
  record3DVisualizationTime,
  recordTrainingZonesCalculationTime,
  recordRoutePlanningTime,
  recordNutritionCalculationTime,
  logger
};
