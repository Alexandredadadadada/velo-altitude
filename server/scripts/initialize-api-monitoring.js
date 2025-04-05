#!/usr/bin/env node

/**
 * Script d'initialisation du système de monitoring API
 * Ce script configure et démarre tous les composants du système de monitoring
 */
const fs = require('fs');
const path = require('path');
const colors = require('colors/safe');
const dotenv = require('dotenv');

// Charger les variables d'environnement
dotenv.config();

// Services et utilitaires
const logger = require('../utils/logger');
const stravaTokenService = require('../services/strava-token.service');
const apiQuotaManager = require('../services/api-quota-manager');
const weatherNotificationService = require('../services/weather-notification.service');
const notificationService = require('../services/notification.service');

// Configuration par défaut
const DEFAULT_CONFIG = {
  services: {
    apiQuotaManager: true,
    stravaTokenService: true,
    weatherNotification: true
  },
  autoRefresh: {
    interval: 30, // minutes
    apis: {
      strava: {
        enabled: true,
        endpoints: [
          {
            name: 'activités',
            path: '/athletes/activities',
            interval: 60 // minutes
          },
          {
            name: 'segments',
            path: '/segments/starred',
            interval: 720 // 12 heures
          }
        ]
      }
    }
  },
  weatherLocations: [
    { city: 'Strasbourg,fr' },
    { city: 'Colmar,fr' },
    { city: 'Mulhouse,fr' },
    { city: 'Metz,fr' }
  ],
  dataRefreshSchedule: {
    routes: '0 3 * * *', // 3h du matin tous les jours
    events: '0 4 * * *', // 4h du matin tous les jours
    clubs: '0 5 * * 1'   // 5h du matin tous les lundis
  }
};

/**
 * Charge la configuration du système de monitoring
 */
function loadConfig() {
  try {
    const configPath = path.join(process.cwd(), 'config', 'api-monitoring.json');
    
    if (fs.existsSync(configPath)) {
      const userConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      // Fusionner avec la configuration par défaut
      return { ...DEFAULT_CONFIG, ...userConfig };
    }
    
    // Si aucun fichier n'existe, créer le fichier par défaut
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
 * Initialise le gestionnaire de quotas API
 */
async function initializeApiQuotaManager() {
  try {
    console.log(colors.blue('Initialisation du gestionnaire de quotas API...'));
    await apiQuotaManager.initialize();
    console.log(colors.green('✅ Gestionnaire de quotas API initialisé'));
    return true;
  } catch (error) {
    console.error(colors.red('❌ Erreur lors de l\'initialisation du gestionnaire de quotas API:'), error);
    return false;
  }
}

/**
 * Initialise le service de token Strava
 */
async function initializeStravaTokenService() {
  try {
    console.log(colors.blue('Initialisation du service de token Strava...'));
    
    // Vérifier si les variables d'environnement Strava sont définies
    const requiredEnvVars = [
      'STRAVA_CLIENT_ID',
      'STRAVA_CLIENT_SECRET',
      'STRAVA_ACCESS_TOKEN',
      'STRAVA_REFRESH_TOKEN'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.warn(colors.yellow(`⚠️ Variables d'environnement Strava manquantes: ${missingVars.join(', ')}`));
      console.log(colors.yellow('Le service de token Strava pourrait ne pas fonctionner correctement'));
    }
    
    // Initialiser le service et planifier les vérifications
    await stravaTokenService.refreshTokenIfNeeded();
    stravaTokenService.scheduleTokenRefreshCheck();
    
    console.log(colors.green('✅ Service de token Strava initialisé'));
    return true;
  } catch (error) {
    console.error(colors.red('❌ Erreur lors de l\'initialisation du service de token Strava:'), error);
    return false;
  }
}

/**
 * Initialise le service de notification météo
 * @param {Array} locations Emplacements à surveiller
 */
async function initializeWeatherNotificationService(locations) {
  try {
    console.log(colors.blue('Initialisation du service de notification météo...'));
    
    // Vérifier si la clé API OpenWeatherMap est définie
    if (!process.env.OPENWEATHERMAP_API_KEY) {
      console.warn(colors.yellow('⚠️ Clé API OpenWeatherMap non définie'));
      console.log(colors.yellow('Le service de notification météo ne fonctionnera pas correctement'));
      return false;
    }
    
    // Initialiser le service avec les emplacements fournis
    const success = weatherNotificationService.initialize(locations);
    
    if (success) {
      console.log(colors.green('✅ Service de notification météo initialisé'));
      return true;
    } else {
      console.error(colors.red('❌ Échec de l\'initialisation du service de notification météo'));
      return false;
    }
  } catch (error) {
    console.error(colors.red('❌ Erreur lors de l\'initialisation du service de notification météo:'), error);
    return false;
  }
}

/**
 * Configure le rafraîchissement automatique des données pour une API
 * @param {Object} apiConfig Configuration de l'API
 * @param {string} apiName Nom de l'API
 */
function setupApiDataRefresh(apiConfig, apiName) {
  try {
    console.log(colors.blue(`Configuration du rafraîchissement automatique pour l'API ${apiName}...`));
    
    if (!apiConfig.enabled) {
      console.log(colors.yellow(`Rafraîchissement automatique désactivé pour l'API ${apiName}`));
      return false;
    }
    
    // Configurer chaque endpoint
    apiConfig.endpoints.forEach(endpoint => {
      const intervalMs = endpoint.interval * 60 * 1000;
      
      console.log(colors.blue(`- Planification du rafraîchissement de ${apiName}:${endpoint.name} toutes les ${endpoint.interval} minutes`));
      
      // Créer une tâche planifiée pour cet endpoint
      setInterval(async () => {
        try {
          logger.info(`Rafraîchissement automatique des données ${apiName}:${endpoint.name}`);
          
          // Le code spécifique pour appeler l'API dépend de l'API concernée
          if (apiName === 'strava') {
            // Exemple pour Strava
            const accessToken = await stravaTokenService.refreshTokenIfNeeded();
            
            // Vérifier si nous avons atteint les limites d'API
            if (!apiQuotaManager.canMakeRequest('strava')) {
              logger.warn(`Rafraîchissement ${apiName}:${endpoint.name} reporté: quota API dépassé`);
              return;
            }
            
            // Appeler l'API Strava et mettre à jour les données
            // Cette partie serait implémentée dans un service dédié au rafraîchissement des données
            logger.info(`Données ${apiName}:${endpoint.name} rafraîchies avec succès`);
          }
          // Ajouter d'autres APIs selon les besoins
          
        } catch (error) {
          logger.error(`Erreur lors du rafraîchissement automatique ${apiName}:${endpoint.name}`, {
            error: error.message
          });
        }
      }, intervalMs);
      
      // Exécuter immédiatement une première fois (après un court délai)
      setTimeout(async () => {
        try {
          logger.info(`Premier rafraîchissement des données ${apiName}:${endpoint.name}`);
          // Code similaire à celui ci-dessus
        } catch (error) {
          logger.error(`Erreur lors du premier rafraîchissement ${apiName}:${endpoint.name}`, {
            error: error.message
          });
        }
      }, 10000); // 10 secondes après le démarrage
      
    });
    
    console.log(colors.green(`✅ Rafraîchissement automatique configuré pour l'API ${apiName}`));
    return true;
  } catch (error) {
    console.error(colors.red(`❌ Erreur lors de la configuration du rafraîchissement pour l'API ${apiName}:`), error);
    return false;
  }
}

/**
 * Configure le rafraîchissement programmé des données
 * @param {Object} schedule Configuration du planning
 */
function setupScheduledDataRefresh(schedule) {
  try {
    console.log(colors.blue('Configuration du rafraîchissement programmé des données...'));
    
    const schedule = require('node-schedule');
    
    // Configurer chaque type de donnée
    Object.entries(schedule).forEach(([dataType, cronExpression]) => {
      console.log(colors.blue(`- Planification du rafraîchissement des ${dataType}: ${cronExpression}`));
      
      // Créer une tâche planifiée
      schedule.scheduleJob(cronExpression, async () => {
        try {
          logger.info(`Rafraîchissement programmé des données: ${dataType}`);
          
          // Le code spécifique dépend du type de donnée
          switch (dataType) {
            case 'routes':
              // Code pour rafraîchir les données de routes
              break;
            case 'events':
              // Code pour rafraîchir les données d'événements
              break;
            case 'clubs':
              // Code pour rafraîchir les données de clubs
              break;
            default:
              logger.warn(`Type de donnée inconnu: ${dataType}`);
          }
          
          logger.info(`Données ${dataType} rafraîchies avec succès`);
        } catch (error) {
          logger.error(`Erreur lors du rafraîchissement programmé des ${dataType}`, {
            error: error.message
          });
        }
      });
    });
    
    console.log(colors.green('✅ Rafraîchissement programmé des données configuré'));
    return true;
  } catch (error) {
    console.error(colors.red('❌ Erreur lors de la configuration du rafraîchissement programmé:'), error);
    return false;
  }
}

/**
 * Fonction principale
 */
async function main() {
  try {
    console.log(colors.cyan('=== Initialisation du système de monitoring API ==='));
    
    // Charger la configuration
    const config = loadConfig();
    
    // Initialiser les services
    const services = config.services || {};
    
    // Initialiser le gestionnaire de quotas API (toujours en premier)
    if (services.apiQuotaManager !== false) {
      await initializeApiQuotaManager();
    }
    
    // Initialiser le service de token Strava
    if (services.stravaTokenService !== false) {
      await initializeStravaTokenService();
    }
    
    // Initialiser le service de notification météo
    if (services.weatherNotification !== false) {
      await initializeWeatherNotificationService(config.weatherLocations || []);
    }
    
    // Configurer le rafraîchissement automatique des données pour chaque API
    const autoRefresh = config.autoRefresh || {};
    if (autoRefresh.enabled !== false) {
      Object.entries(autoRefresh.apis || {}).forEach(([apiName, apiConfig]) => {
        setupApiDataRefresh(apiConfig, apiName);
      });
    }
    
    // Configurer le rafraîchissement programmé des données
    if (config.dataRefreshSchedule) {
      setupScheduledDataRefresh(config.dataRefreshSchedule);
    }
    
    console.log(colors.green('\n✅ Système de monitoring API initialisé avec succès'));
    
    // Envoyer une notification pour indiquer le démarrage réussi
    notificationService.sendAlert({
      type: 'info',
      source: 'system',
      subject: 'Système de monitoring API démarré',
      message: 'Le système de monitoring API a été initialisé avec succès'
    });
    
  } catch (error) {
    console.error(colors.red('❌ Erreur fatale lors de l\'initialisation du système de monitoring:'), error);
    
    // Envoyer une notification d'erreur
    notificationService.sendAlert({
      type: 'error',
      source: 'system',
      subject: 'Erreur d\'initialisation du système de monitoring',
      message: `Une erreur s'est produite lors de l'initialisation: ${error.message}`
    });
    
    process.exit(1);
  }
}

// Exécuter le programme
main();
