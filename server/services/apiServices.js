/**
 * Services API centralisés avec rotation des clés et sécurité renforcée
 * Dashboard-Velo.com
 */

const EnhancedApiKeyManager = require('../utils/enhanced-api-key-manager');
const { logger } = require('../utils/logger');
const path = require('path');

// Définir le répertoire de stockage des clés
const keysDirectory = process.env.KEYS_DIRECTORY || path.join(__dirname, '../../.keys');

// Initialisation du gestionnaire de clés API sécurisé
const apiKeyManager = new EnhancedApiKeyManager({
  keysDirectory: keysDirectory,
  rotationInterval: 30 * 24 * 60 * 60 * 1000, // 30 jours par défaut
  gracePeriod: 24 * 60 * 60 * 1000, // 24 heures de période de grâce
  logger: logger
});

// Initialiser le gestionnaire
apiKeyManager.initialize().then(() => {
  logger.info('Enhanced API Services initialized with security features');
}).catch(error => {
  logger.error('Failed to initialize Enhanced API Services', { error: error.message });
});

// Modules de l'application
const MODULES = {
  WEATHER: 'weather-module',
  MAP: 'map-module',
  ACTIVITY: 'activity-module',
  ADMIN: 'admin'
};

// Exportation des gestionnaires de clés
module.exports = {
  openRouteService: {
    getKey: () => apiKeyManager.getApiKey('openRouteService', MODULES.MAP),
    getAllKeys: () => apiKeyManager.getAllValidKeys('openRouteService', MODULES.MAP),
    isValidKey: (key) => apiKeyManager.isValidKey('openRouteService', key),
    rotateKeys: () => apiKeyManager.rotationManager.forceRotation('openRouteService'),
    addKey: (key) => apiKeyManager.addKey('openRouteService', key)
  },
  strava: {
    getKey: () => apiKeyManager.getApiKey('strava', MODULES.ACTIVITY),
    getAllKeys: () => apiKeyManager.getAllValidKeys('strava', MODULES.ACTIVITY),
    isValidKey: (key) => apiKeyManager.isValidKey('strava', key),
    rotateKeys: () => apiKeyManager.rotationManager.forceRotation('strava'),
    addKey: (key) => apiKeyManager.addKey('strava', key)
  },
  weatherService: {
    getKey: () => apiKeyManager.getApiKey('weatherService', MODULES.WEATHER),
    getAllKeys: () => apiKeyManager.getAllValidKeys('weatherService', MODULES.WEATHER),
    isValidKey: (key) => apiKeyManager.isValidKey('weatherService', key),
    rotateKeys: () => apiKeyManager.rotationManager.forceRotation('weatherService'),
    addKey: (key) => apiKeyManager.addKey('weatherService', key)
  },
  mapbox: {
    getKey: () => apiKeyManager.getApiKey('mapbox', MODULES.MAP),
    getAllKeys: () => apiKeyManager.getAllValidKeys('mapbox', MODULES.MAP),
    isValidKey: (key) => apiKeyManager.isValidKey('mapbox', key),
    rotateKeys: () => apiKeyManager.rotationManager.forceRotation('mapbox'),
    addKey: (key) => apiKeyManager.addKey('mapbox', key)
  },
  openai: {
    getKey: () => apiKeyManager.getApiKey('openai', MODULES.ADMIN),
    getAllKeys: () => apiKeyManager.getAllValidKeys('openai', MODULES.ADMIN),
    isValidKey: (key) => apiKeyManager.isValidKey('openai', key),
    rotateKeys: () => apiKeyManager.rotationManager.forceRotation('openai'),
    addKey: (key) => apiKeyManager.addKey('openai', key)
  },
  
  // Utilitaire pour arrêter le gestionnaire de clés (utile pour les tests)
  stopAll: () => {
    apiKeyManager.stop();
    logger.info('Enhanced API key manager stopped');
  },
  
  // Exposer le gestionnaire pour les tests et la configuration avancée
  manager: apiKeyManager
};
