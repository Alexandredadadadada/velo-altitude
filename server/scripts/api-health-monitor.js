#!/usr/bin/env node

/**
 * Script de surveillance de la santé des API
 * Effectue des vérifications périodiques de toutes les API intégrées
 * et envoie des alertes en cas de problèmes détectés
 */
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { program } = require('commander');
const colors = require('colors/safe');
const Table = require('cli-table3');
const moment = require('moment');

// Services et utilitaires
const logger = require('../utils/logger');
const notificationService = require('../services/notification.service');
const stravaTokenService = require('../services/strava-token.service');
const apiQuotaManager = require('../services/api-quota-manager');
const { trackApiCall } = require('../middleware/api-quota-middleware');

// Configuration du programme
program
  .version('1.0.0')
  .description('Moniteur de santé des API')
  .option('-c, --config <file>', 'Fichier de configuration personnalisé')
  .option('-i, --interval <minutes>', 'Intervalle entre les vérifications (minutes)', '15')
  .option('-d, --dashboard', 'Afficher un tableau de bord dans la console', false)
  .option('--no-notifications', 'Désactiver les notifications')
  .parse(process.argv);

const options = program.opts();

// Configuration par défaut
const DEFAULT_CONFIG = {
  apis: {
    strava: {
      enabled: true,
      endpoints: [
        {
          name: 'Profil athlète',
          url: 'https://www.strava.com/api/v3/athlete',
          method: 'GET',
          requiresAuth: true,
          expectedStatus: 200,
          timeout: 5000,
          criticalEndpoint: true
        },
        {
          name: 'Activités récentes',
          url: 'https://www.strava.com/api/v3/athlete/activities',
          method: 'GET',
          requiresAuth: true,
          params: {
            per_page: 1
          },
          expectedStatus: 200,
          timeout: 5000,
          criticalEndpoint: false
        }
      ],
      maxConsecutiveFailures: 3,
      retryIntervalMinutes: 5
    },
    openweathermap: {
      enabled: true,
      endpoints: [
        {
          name: 'Météo actuelle',
          url: 'https://api.openweathermap.org/data/2.5/weather',
          method: 'GET',
          params: {
            q: 'Strasbourg,fr',
            appid: process.env.OPENWEATHERMAP_API_KEY,
            units: 'metric'
          },
          expectedStatus: 200,
          timeout: 5000,
          criticalEndpoint: true
        }
      ],
      maxConsecutiveFailures: 3,
      retryIntervalMinutes: 10
    }
    // Ajoutez d'autres APIs selon les besoins
  },
  notifications: {
    consoleLog: true,
    email: true,
    slack: process.env.SLACK_WEBHOOK_URL ? true : false,
    throttleMinutes: 30 // Éviter de spammer avec des notifications
  },
  healthCheckIntervalMinutes: parseInt(options.interval) || 15
};

// État de surveillance
const monitorState = {
  apis: {},
  lastChecks: {},
  consecutiveFailures: {},
  lastNotifications: {},
  isRunning: false
};

// Initialiser l'état pour chaque API
Object.keys(DEFAULT_CONFIG.apis).forEach(apiName => {
  monitorState.apis[apiName] = {
    status: 'unknown',
    lastCheck: null,
    endpoints: {}
  };
  
  monitorState.consecutiveFailures[apiName] = 0;
  monitorState.lastNotifications[apiName] = {};
  
  // Initialiser l'état pour chaque endpoint
  DEFAULT_CONFIG.apis[apiName].endpoints.forEach(endpoint => {
    monitorState.apis[apiName].endpoints[endpoint.name] = {
      status: 'unknown',
      lastResponse: null,
      lastError: null,
      responseTime: 0,
      history: []
    };
    
    monitorState.consecutiveFailures[`${apiName}:${endpoint.name}`] = 0;
    monitorState.lastNotifications[`${apiName}:${endpoint.name}`] = null;
  });
});

/**
 * Charge la configuration
 */
function loadConfig() {
  try {
    const configPath = options.config || path.join(process.cwd(), 'config', 'api-health-monitor.json');
    
    if (fs.existsSync(configPath)) {
      const userConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return mergeConfigs(DEFAULT_CONFIG, userConfig);
    }
    
    // Si aucun fichier de configuration n'existe, créer le fichier par défaut
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2));
    
    console.log(colors.yellow(`Configuration par défaut créée: ${configPath}`));
    return DEFAULT_CONFIG;
  } catch (error) {
    console.error(colors.red('Erreur lors du chargement de la configuration:'), error);
    return DEFAULT_CONFIG;
  }
}

/**
 * Fusionne les configurations
 */
function mergeConfigs(defaultConfig, userConfig) {
  const result = { ...defaultConfig };
  
  // Fusion des configurations d'API
  if (userConfig.apis) {
    Object.keys(userConfig.apis).forEach(apiName => {
      if (result.apis[apiName]) {
        result.apis[apiName] = { ...result.apis[apiName], ...userConfig.apis[apiName] };
        
        // Fusionner les endpoints si présents
        if (userConfig.apis[apiName].endpoints && Array.isArray(userConfig.apis[apiName].endpoints)) {
          // Remplacer complètement les endpoints
          result.apis[apiName].endpoints = userConfig.apis[apiName].endpoints;
        }
      } else {
        // Nouvelle API
        result.apis[apiName] = userConfig.apis[apiName];
      }
    });
  }
  
  // Fusion des autres paramètres
  if (userConfig.notifications) {
    result.notifications = { ...result.notifications, ...userConfig.notifications };
  }
  
  if (userConfig.healthCheckIntervalMinutes) {
    result.healthCheckIntervalMinutes = userConfig.healthCheckIntervalMinutes;
  }
  
  return result;
}

/**
 * Vérifie la santé d'un endpoint API
 */
async function checkEndpoint(apiName, endpoint) {
  const endpointState = monitorState.apis[apiName].endpoints[endpoint.name];
  const startTime = Date.now();
  let status = 'unknown';
  let responseData = null;
  let errorMessage = null;
  
  try {
    // Préparer les headers d'authentification si nécessaire
    const headers = {};
    if (endpoint.requiresAuth) {
      if (apiName === 'strava') {
        const accessToken = await stravaTokenService.refreshTokenIfNeeded();
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      // Ajouter d'autres méthodes d'authentification selon les APIs
    }
    
    // Effectuer la requête
    const response = await axios({
      method: endpoint.method,
      url: endpoint.url,
      params: endpoint.params,
      headers,
      timeout: endpoint.timeout
    });
    
    const responseTime = Date.now() - startTime;
    
    // Vérifier le statut de la réponse
    if (response.status === endpoint.expectedStatus) {
      status = 'healthy';
      responseData = response.data;
      
      // Réinitialiser le compteur d'échecs consécutifs
      monitorState.consecutiveFailures[`${apiName}:${endpoint.name}`] = 0;
      
      // Enregistrer l'appel réussi
      trackApiCall(
        apiName, 
        endpoint.url, 
        true, 
        response.status, 
        responseTime
      );
    } else {
      status = 'warning';
      errorMessage = `Statut HTTP inattendu: ${response.status} (attendu: ${endpoint.expectedStatus})`;
      
      // Incrémenter le compteur d'échecs
      monitorState.consecutiveFailures[`${apiName}:${endpoint.name}`]++;
      
      // Enregistrer l'appel avec avertissement
      trackApiCall(
        apiName, 
        endpoint.url, 
        false, 
        response.status, 
        responseTime
      );
    }
    
    // Mettre à jour l'état
    endpointState.status = status;
    endpointState.lastResponse = responseData;
    endpointState.lastError = errorMessage;
    endpointState.responseTime = responseTime;
    
    // Conserver l'historique (limité à 100 entrées)
    endpointState.history.push({
      timestamp: new Date().toISOString(),
      status,
      responseTime,
      errorMessage
    });
    
    if (endpointState.history.length > 100) {
      endpointState.history.shift();
    }
    
    return {
      status,
      responseTime,
      errorMessage
    };
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    status = 'error';
    
    // Déterminer le message d'erreur
    if (error.code === 'ECONNABORTED') {
      errorMessage = `Timeout après ${responseTime}ms`;
    } else if (error.response) {
      errorMessage = `Erreur HTTP ${error.response.status}: ${error.response.statusText}`;
    } else if (error.request) {
      errorMessage = 'Aucune réponse reçue du serveur';
    } else {
      errorMessage = error.message;
    }
    
    // Incrémenter le compteur d'échecs
    monitorState.consecutiveFailures[`${apiName}:${endpoint.name}`]++;
    
    // Incrémenter également le compteur global de l'API
    monitorState.consecutiveFailures[apiName]++;
    
    // Enregistrer l'appel échoué
    trackApiCall(
      apiName, 
      endpoint.url, 
      false, 
      error.response?.status || 0, 
      responseTime
    );
    
    // Logger l'erreur
    logger.error(`Erreur lors de la vérification de l'endpoint ${apiName}:${endpoint.name}`, {
      error: errorMessage,
      url: endpoint.url
    });
    
    // Mettre à jour l'état
    endpointState.status = status;
    endpointState.lastResponse = null;
    endpointState.lastError = errorMessage;
    endpointState.responseTime = responseTime;
    
    // Conserver l'historique
    endpointState.history.push({
      timestamp: new Date().toISOString(),
      status,
      responseTime,
      errorMessage
    });
    
    if (endpointState.history.length > 100) {
      endpointState.history.shift();
    }
    
    return {
      status,
      responseTime,
      errorMessage
    };
  }
}

/**
 * Vérifie la santé d'une API complète
 */
async function checkApi(apiName, apiConfig) {
  if (!apiConfig.enabled) {
    monitorState.apis[apiName].status = 'disabled';
    return {
      status: 'disabled',
      message: 'API désactivée dans la configuration'
    };
  }
  
  console.log(colors.blue(`Vérification de l'API ${apiName}...`));
  
  // Mettre à jour l'horodatage de la dernière vérification
  monitorState.apis[apiName].lastCheck = new Date().toISOString();
  monitorState.lastChecks[apiName] = new Date();
  
  const results = [];
  let criticalFailure = false;
  
  // Vérifier chaque endpoint
  for (const endpoint of apiConfig.endpoints) {
    const result = await checkEndpoint(apiName, endpoint);
    results.push({
      endpoint: endpoint.name,
      ...result
    });
    
    // Vérifier si c'est un endpoint critique et s'il a échoué
    if (endpoint.criticalEndpoint && result.status === 'error') {
      criticalFailure = true;
    }
    
    // Vérifier les échecs consécutifs et envoyer des notifications si nécessaire
    if (result.status === 'error' || result.status === 'warning') {
      const endpointKey = `${apiName}:${endpoint.name}`;
      const failures = monitorState.consecutiveFailures[endpointKey];
      
      if (failures >= apiConfig.maxConsecutiveFailures) {
        // Vérifier si nous avons déjà envoyé une notification récemment
        const now = Date.now();
        const lastNotification = monitorState.lastNotifications[endpointKey];
        const throttleMs = DEFAULT_CONFIG.notifications.throttleMinutes * 60 * 1000;
        
        if (!lastNotification || (now - lastNotification) > throttleMs) {
          // Envoyer une notification
          const severity = endpoint.criticalEndpoint ? 'critical' : 'warning';
          const subject = `Alerte API ${apiName}: ${endpoint.name}`;
          const message = `L'endpoint ${endpoint.name} a échoué ${failures} fois consécutives. Dernière erreur: ${result.errorMessage}`;
          
          sendNotification(severity, subject, message, apiName);
          
          // Mettre à jour l'horodatage de la dernière notification
          monitorState.lastNotifications[endpointKey] = now;
        }
      }
    }
  }
  
  // Déterminer le statut global de l'API
  let overallStatus;
  if (criticalFailure) {
    overallStatus = 'critical';
  } else if (results.some(r => r.status === 'error')) {
    overallStatus = 'error';
  } else if (results.some(r => r.status === 'warning')) {
    overallStatus = 'warning';
  } else if (results.every(r => r.status === 'healthy')) {
    overallStatus = 'healthy';
  } else {
    overallStatus = 'unknown';
  }
  
  // Mettre à jour l'état global de l'API
  monitorState.apis[apiName].status = overallStatus;
  
  // Vérifier si le statut global de l'API a changé et envoyer une notification si nécessaire
  handleApiStatusChange(apiName, overallStatus);
  
  return {
    status: overallStatus,
    results
  };
}

/**
 * Gère les changements de statut global d'une API
 */
function handleApiStatusChange(apiName, newStatus) {
  const apiState = monitorState.apis[apiName];
  const previousStatus = apiState.previousStatus || 'unknown';
  
  // Si le statut n'a pas changé, ne rien faire
  if (previousStatus === newStatus) {
    return;
  }
  
  // Enregistrer le changement de statut
  apiState.previousStatus = newStatus;
  
  // Si l'API se rétablit après une panne
  if ((previousStatus === 'error' || previousStatus === 'critical') && newStatus === 'healthy') {
    const subject = `API ${apiName} rétablie`;
    const message = `L'API ${apiName} est de nouveau fonctionnelle`;
    
    sendNotification('info', subject, message, apiName);
    return;
  }
  
  // Si l'API devient critique
  if (newStatus === 'critical' && previousStatus !== 'critical') {
    const subject = `API ${apiName} en état critique`;
    const message = `L'API ${apiName} est en état critique. Des fonctionnalités essentielles peuvent être affectées.`;
    
    sendNotification('critical', subject, message, apiName);
    return;
  }
  
  // Si l'API devient en erreur (mais pas critique)
  if (newStatus === 'error' && previousStatus !== 'error' && previousStatus !== 'critical') {
    const subject = `API ${apiName} en erreur`;
    const message = `L'API ${apiName} rencontre des problèmes. Certaines fonctionnalités peuvent être affectées.`;
    
    sendNotification('error', subject, message, apiName);
    return;
  }
}

/**
 * Envoie une notification
 */
function sendNotification(severity, subject, message, source) {
  if (!options.notifications) {
    return;
  }
  
  // Logger la notification
  logger.info(`Notification: ${subject}`, {
    severity,
    message,
    source
  });
  
  // Afficher dans la console
  if (DEFAULT_CONFIG.notifications.consoleLog) {
    const color = severity === 'critical' ? 'red' : 
                 severity === 'error' ? 'red' : 
                 severity === 'warning' ? 'yellow' : 'green';
    
    console.log(colors[color](`[${severity.toUpperCase()}] ${subject}: ${message}`));
  }
  
  // Envoyer la notification via le service de notification
  notificationService.sendAlert({
    type: severity,
    source: `api-monitor:${source}`,
    subject,
    message
  });
}

/**
 * Effectue un cycle complet de vérification de toutes les APIs
 */
async function runHealthCheck(config) {
  if (monitorState.isRunning) {
    console.log(colors.yellow('Une vérification est déjà en cours. Patientez...'));
    return;
  }
  
  monitorState.isRunning = true;
  const startTime = Date.now();
  
  console.log(colors.cyan('=== Vérification de santé des API ==='));
  console.log(colors.blue(`Démarrage: ${new Date().toLocaleString()}`));
  
  try {
    // Récupérer les statistiques d'utilisation des API
    const apiStats = apiQuotaManager.getUsageStatistics();
    
    // Vérifier chaque API
    for (const [apiName, apiConfig] of Object.entries(config.apis)) {
      try {
        await checkApi(apiName, apiConfig);
      } catch (error) {
        console.error(colors.red(`Erreur lors de la vérification de l'API ${apiName}:`), error);
      }
    }
    
    // Vérifier les quotas d'API et envoyer des alertes si nécessaire
    checkApiQuotas(apiStats);
    
    // Afficher le tableau de bord si demandé
    if (options.dashboard) {
      displayDashboard();
    }
    
  } catch (error) {
    console.error(colors.red('Erreur lors de la vérification de santé:'), error);
  } finally {
    monitorState.isRunning = false;
    
    const duration = Date.now() - startTime;
    console.log(colors.blue(`Vérification terminée en ${duration}ms`));
    console.log(colors.cyan('========================================'));
  }
}

/**
 * Vérifie les quotas d'API et envoie des alertes si nécessaire
 */
function checkApiQuotas(apiStats) {
  Object.entries(apiStats).forEach(([apiName, stats]) => {
    // Vérifier le quota quotidien
    if (stats.quotaUsage && stats.quotaUsage.day) {
      const dayQuota = stats.quotaUsage.day;
      
      // Alerte si nous atteignons 90% du quota quotidien
      if (parseFloat(dayQuota.percentage) > 90) {
        const subject = `Quota API ${apiName} presque épuisé`;
        const message = `Le quota quotidien de l'API ${apiName} est à ${dayQuota.percentage}% (${dayQuota.count}/${dayQuota.limit})`;
        
        sendNotification('warning', subject, message, apiName);
      }
    }
    
    // Vérifier le quota de 15 minutes
    if (stats.quotaUsage && stats.quotaUsage.fifteenMin) {
      const fifteenMinQuota = stats.quotaUsage.fifteenMin;
      
      // Alerte si nous atteignons 80% du quota de 15 minutes
      if (parseFloat(fifteenMinQuota.percentage) > 80) {
        const subject = `Quota 15min API ${apiName} élevé`;
        const message = `Le quota de 15 minutes de l'API ${apiName} est à ${fifteenMinQuota.percentage}% (${fifteenMinQuota.count}/${fifteenMinQuota.limit})`;
        
        sendNotification('warning', subject, message, apiName);
      }
    }
  });
}

/**
 * Affiche un tableau de bord dans la console
 */
function displayDashboard() {
  console.log(colors.cyan('\n=== TABLEAU DE BORD SANTÉ DES API ==='));
  
  // Tableau de résumé
  const summaryTable = new Table({
    head: ['API', 'Statut', 'Dernière vérification', 'Quota journalier', 'Quota 15min'],
    colWidths: [20, 10, 25, 20, 20]
  });
  
  Object.entries(monitorState.apis).forEach(([apiName, apiState]) => {
    const lastCheck = apiState.lastCheck ? 
      moment(apiState.lastCheck).format('DD/MM/YYYY HH:mm:ss') : 'Jamais';
    
    // Obtenir les informations de quota
    const apiStats = apiQuotaManager.getUsageStatistics()[apiName] || {};
    const dayQuota = apiStats.quotaUsage?.day?.percentage || 'N/A';
    const fifteenMinQuota = apiStats.quotaUsage?.fifteenMin?.percentage || 'N/A';
    
    // Couleur du statut
    let statusColored;
    switch (apiState.status) {
      case 'healthy':
        statusColored = colors.green(apiState.status);
        break;
      case 'warning':
        statusColored = colors.yellow(apiState.status);
        break;
      case 'error':
      case 'critical':
        statusColored = colors.red(apiState.status);
        break;
      case 'disabled':
        statusColored = colors.gray(apiState.status);
        break;
      default:
        statusColored = colors.blue(apiState.status);
    }
    
    summaryTable.push([
      apiName,
      statusColored,
      lastCheck,
      dayQuota !== 'N/A' ? `${dayQuota}%` : 'N/A',
      fifteenMinQuota !== 'N/A' ? `${fifteenMinQuota}%` : 'N/A'
    ]);
  });
  
  console.log(summaryTable.toString());
  
  // Tableau de détails pour chaque API
  Object.entries(monitorState.apis).forEach(([apiName, apiState]) => {
    if (apiState.status === 'disabled') {
      return; // Ne pas afficher les détails des APIs désactivées
    }
    
    console.log(colors.cyan(`\nDétails de l'API: ${apiName}`));
    
    const detailsTable = new Table({
      head: ['Endpoint', 'Statut', 'Temps réponse', 'Dernière erreur'],
      colWidths: [20, 10, 15, 40]
    });
    
    Object.entries(apiState.endpoints).forEach(([endpointName, endpointState]) => {
      // Couleur du statut
      let statusColored;
      switch (endpointState.status) {
        case 'healthy':
          statusColored = colors.green(endpointState.status);
          break;
        case 'warning':
          statusColored = colors.yellow(endpointState.status);
          break;
        case 'error':
          statusColored = colors.red(endpointState.status);
          break;
        default:
          statusColored = colors.blue(endpointState.status);
      }
      
      detailsTable.push([
        endpointName,
        statusColored,
        endpointState.responseTime ? `${endpointState.responseTime}ms` : 'N/A',
        endpointState.lastError || 'Aucune'
      ]);
    });
    
    console.log(detailsTable.toString());
  });
  
  console.log(colors.cyan('\n=== FIN DU TABLEAU DE BORD ===\n'));
}

/**
 * Fonction principale
 */
async function main() {
  try {
    // Charger la configuration
    const config = loadConfig();
    
    console.log(colors.green('Moniteur de santé des API démarré'));
    console.log(colors.blue(`Intervalle de vérification: ${config.healthCheckIntervalMinutes} minutes`));
    
    // Effectuer une première vérification
    await runHealthCheck(config);
    
    // Planifier les vérifications périodiques
    setInterval(() => {
      runHealthCheck(config).catch(error => {
        console.error(colors.red('Erreur lors de la vérification périodique:'), error);
      });
    }, config.healthCheckIntervalMinutes * 60 * 1000);
    
  } catch (error) {
    console.error(colors.red('Erreur fatale:'), error);
    process.exit(1);
  }
}

// Exécuter le programme
main();
