/**
 * Gestionnaire de clés API simplifié pour utiliser uniquement des variables d'environnement
 * Dashboard-Velo.com
 */

const schedule = require('node-schedule');
const { logger } = require('./logger');

class ApiKeyManager {
  constructor(serviceName, options = {}) {
    this.serviceName = serviceName;
    this.rotationInterval = options.rotationInterval || '0 0 * * 0'; // Par défaut: rotation hebdomadaire (tous les dimanches à minuit)
    this.autoRotate = options.autoRotate !== undefined ? options.autoRotate : false; // Désactivé par défaut pour les variables d'environnement
    this.envMapping = this.getEnvironmentVariableMapping();
    
    this.loadKeysFromEnvironment();
    
    if (this.autoRotate) {
      logger.info(`Scheduled auto-rotation for ${this.serviceName} API keys`);
      this.scheduleRotation();
    }
  }

  /**
   * Obtient le mapping des services vers les variables d'environnement
   */
  getEnvironmentVariableMapping() {
    return {
      'openRouteService': ['OPENROUTE_API_KEY'],
      'strava': ['STRAVA_CLIENT_SECRET', 'STRAVA_CLIENT_ID', 'STRAVA_REFRESH_TOKEN'],
      'weatherService': ['OPENWEATHER_API_KEY'],
      'mapbox': ['MAPBOX_SECRET_TOKEN', 'MAPBOX_PUBLIC_TOKEN'],
      'openai': ['OPENAI_API_KEY'],
      'mongodb': ['MONGODB_URI']
    };
  }

  /**
   * Charge les clés API depuis les variables d'environnement
   */
  loadKeysFromEnvironment() {
    try {
      this.keys = {};
      const envKeys = this.envMapping[this.serviceName] || [`${this.serviceName.toUpperCase()}_API_KEY`];
      
      // Chercher dans toutes les variables d'environnement possibles pour ce service
      for (const envKey of envKeys) {
        if (process.env[envKey]) {
          this.keys[envKey] = process.env[envKey];
        }
      }
      
      if (Object.keys(this.keys).length === 0) {
        logger.warn(`No API keys found in environment variables for ${this.serviceName}`);
      } else {
        logger.info(`Loaded ${Object.keys(this.keys).length} API keys for ${this.serviceName} from environment variables`);
      }
    } catch (error) {
      logger.error(`Error loading API keys for ${this.serviceName}:`, error);
      this.keys = {};
    }
  }

  /**
   * Programmation de la rotation automatique (rappel de vérification uniquement)
   */
  scheduleRotation() {
    this.job = schedule.scheduleJob(this.rotationInterval, () => {
      logger.info(`Checking environment variables for ${this.serviceName}`);
      this.loadKeysFromEnvironment();
      this.notifyAdmins();
    });
  }

  /**
   * Obtention de la clé active
   * @param {string} keyType Type de clé (optionnel, pour les services avec plusieurs types de clés)
   * @returns {string} Clé API active
   */
  getKey(keyType) {
    if (!this.keys[keyType]) {
      const defaultKey = Object.values(this.keys)[0];
      logger.debug(`No specific key found for ${keyType}, using default key for ${this.serviceName}`);
      return defaultKey;
    }
    
    if (keyType && this.keys[keyType]) {
      return this.keys[keyType];
    }
    
    return this.keys;
  }

  /**
   * Vérifie si les clés API sont disponibles
   * @returns {boolean} Vrai si au moins une clé est disponible
   */
  validateKeys() {
    const services = Object.keys(this.keys);
    if (services.length === 0) {
      logger.warn(`No API keys available for ${this.serviceName}`);
      return false;
    }
    
    logger.info(`API keys validated for ${this.serviceName}`);
    return true;
  }

  /**
   * Notification aux administrateurs
   */
  notifyAdmins() {
    logger.info(`[${this.serviceName}] API keys status: ${Object.keys(this.keys).length} keys available`);
  }
  
  /**
   * Arrêt du gestionnaire de clés
   */
  stop() {
    if (this.job) {
      this.job.cancel();
      logger.info(`API key monitoring stopped for ${this.serviceName}`);
    }
  }
}

module.exports = ApiKeyManager;
