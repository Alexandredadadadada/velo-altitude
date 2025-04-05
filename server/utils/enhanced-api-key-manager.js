/**
 * EnhancedApiKeyManager - Gestionnaire amélioré des clés API avec sécurité renforcée
 * Utilise exclusivement les variables d'environnement pour une meilleure sécurité
 * 
 * Cette classe intègre les différents composants du système de sécurité des clés API :
 * - SecureMemoryStorage pour le stockage sécurisé en mémoire
 * - SecretManager pour la validation des secrets
 * - ApiKeyPermissionManager pour le contrôle d'accès
 * 
 * Dashboard-Velo.com
 */

const { logger } = require('./logger');

// Importer les composants de sécurité
const SecureMemoryStorage = require('./secure-memory-storage');
const SecretManager = require('./secret-manager');
const ApiKeyPermissionManager = require('./api-key-permission-manager');

class EnhancedApiKeyManager {
  /**
   * Constructeur
   * @param {Object} options - Options de configuration
   */
  constructor(options = {}) {
    this.options = {
      memoryTTL: 30 * 60 * 1000, // 30 minutes par défaut
      logger: logger,
      ...options
    };

    // Valider les secrets requis
    this.secretManager = new SecretManager({
      logger: this.options.logger
    });

    // Initialiser le stockage sécurisé en mémoire
    this.memoryStorage = new SecureMemoryStorage(process.env.API_KEYS_ENCRYPTION_KEY, {
      ttl: this.options.memoryTTL,
      logger: this.options.logger
    });

    // Initialiser le gestionnaire de permissions
    this.permissionManager = new ApiKeyPermissionManager({
      logger: this.options.logger
    });
    
    // Mapping des services vers les variables d'environnement
    this.serviceEnvMapping = this.getServiceEnvMapping();
    
    // Cache des clés API chargées depuis les variables d'environnement
    this.apiKeys = {};
  }

  /**
   * Obtient le mapping des services vers les variables d'environnement
   * @returns {Object} - Mapping des services vers les variables d'environnement
   */
  getServiceEnvMapping() {
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
   * Initialiser le gestionnaire
   * @returns {Promise<boolean>} - Succès de l'initialisation
   */
  async initialize() {
    try {
      // Valider les secrets requis
      const secretValidation = this.secretManager.validateRequiredSecrets();
      if (!secretValidation.valid) {
        throw new Error(`Secrets manquants ou invalides: ${secretValidation.missingSecrets.join(', ')}`);
      }

      // Initialiser les services
      await this.loadAllApiKeys();

      this.options.logger.info('EnhancedApiKeyManager initialisé avec succès');
      return true;
    } catch (error) {
      this.options.logger.error('Erreur lors de l\'initialisation de EnhancedApiKeyManager', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Charger toutes les clés API depuis les variables d'environnement
   * @returns {Promise<void>}
   */
  async loadAllApiKeys() {
    const services = Object.keys(this.serviceEnvMapping);
    
    for (const service of services) {
      await this.loadApiKeysForService(service);
    }
    
    this.options.logger.info(`Clés API chargées pour ${Object.keys(this.apiKeys).length} services`);
  }
  
  /**
   * Charger les clés API pour un service spécifique depuis les variables d'environnement
   * @param {string} service - Nom du service
   * @returns {Promise<Object>} - Clés API du service
   */
  async loadApiKeysForService(service) {
    try {
      const envVars = this.serviceEnvMapping[service] || [`${service.toUpperCase()}_API_KEY`];
      
      const serviceKeys = {};
      
      for (const envVar of envVars) {
        if (process.env[envVar]) {
          serviceKeys[envVar] = process.env[envVar];
        }
      }
      
      if (Object.keys(serviceKeys).length === 0) {
        this.options.logger.warn(`Aucune clé API trouvée pour le service ${service}`);
        this.apiKeys[service] = null;
        return null;
      }
      
      this.apiKeys[service] = serviceKeys;
      this.options.logger.debug(`Clés API chargées pour ${service}`);
      
      return serviceKeys;
    } catch (error) {
      this.options.logger.error(`Erreur lors du chargement des clés API pour ${service}`, {
        service,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Obtenir la clé API active pour un service
   * @param {string} service - Nom du service
   * @param {string} [moduleId] - Identifiant du module demandeur (pour le contrôle d'accès)
   * @returns {Promise<string>} - Clé API active
   */
  async getApiKey(service, moduleId = null) {
    try {
      // Vérifier les permissions si un moduleId est fourni
      if (moduleId && !this.permissionManager.hasAccess(service, moduleId)) {
        throw new Error(`Accès refusé: le module ${moduleId} n'a pas accès au service ${service}`);
      }
      
      // Vérifier si les clés sont déjà en mémoire
      if (!this.apiKeys[service]) {
        await this.loadApiKeysForService(service);
      }
      
      // Vérifier si des clés ont été trouvées
      if (!this.apiKeys[service] || Object.keys(this.apiKeys[service]).length === 0) {
        throw new Error(`Aucune clé API disponible pour ${service}`);
      }
      
      // Prendre la première clé disponible
      const keyName = Object.keys(this.apiKeys[service])[0];
      return this.apiKeys[service][keyName];
    } catch (error) {
      this.options.logger.error(`Erreur lors de la récupération de la clé API pour ${service}`, {
        service,
        moduleId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Obtenir toutes les clés pour un service
   * @param {string} service - Nom du service
   * @param {string} [moduleId] - Identifiant du module demandeur
   * @returns {Promise<Object>} - Toutes les clés du service
   */
  async getAllKeys(service, moduleId = null) {
    try {
      // Vérifier les permissions si un moduleId est fourni
      if (moduleId && !this.permissionManager.hasAccess(service, moduleId)) {
        throw new Error(`Accès refusé: le module ${moduleId} n'a pas accès au service ${service}`);
      }
      
      // Vérifier si les clés sont déjà en mémoire
      if (!this.apiKeys[service]) {
        await this.loadApiKeysForService(service);
      }
      
      return this.apiKeys[service] || {};
    } catch (error) {
      this.options.logger.error(`Erreur lors de la récupération des clés pour ${service}`, {
        service,
        moduleId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Vérifier si une clé est valide pour un service
   * @param {string} service - Nom du service
   * @param {string} key - Clé à vérifier
   * @returns {Promise<boolean>} - True si la clé est valide
   */
  async isValidKey(service, key) {
    try {
      // Vérifier si les clés sont déjà en mémoire
      if (!this.apiKeys[service]) {
        await this.loadApiKeysForService(service);
      }
      
      // Vérifier si la clé existe dans les valeurs des clés du service
      return Object.values(this.apiKeys[service] || {}).includes(key);
    } catch (error) {
      this.options.logger.error(`Erreur lors de la vérification de la validité de la clé pour ${service}`, {
        service,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Lister tous les services disponibles
   * @returns {Promise<Array<string>>} - Liste des services
   */
  async listServices() {
    try {
      // Si les clés n'ont pas été chargées, les charger
      if (Object.keys(this.apiKeys).length === 0) {
        await this.loadAllApiKeys();
      }
      
      // Filtrer uniquement les services qui ont des clés
      return Object.keys(this.apiKeys).filter(service => this.apiKeys[service] !== null);
    } catch (error) {
      this.options.logger.error('Erreur lors de la récupération de la liste des services', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Générer un rapport sur l'état des clés API
   * @returns {Promise<Object>} - Rapport détaillé
   */
  async generateReport() {
    try {
      // Si les clés n'ont pas été chargées, les charger
      if (Object.keys(this.apiKeys).length === 0) {
        await this.loadAllApiKeys();
      }
      
      const services = await this.listServices();
      const report = {
        timestamp: new Date().toISOString(),
        services: {},
        summary: {
          totalServices: services.length,
          totalKeys: 0,
          availableServices: 0,
          missingServices: 0
        }
      };
      
      for (const service of Object.keys(this.serviceEnvMapping)) {
        const serviceKeys = this.apiKeys[service];
        const keyCount = serviceKeys ? Object.keys(serviceKeys).length : 0;
        
        report.summary.totalKeys += keyCount;
        
        if (keyCount > 0) {
          report.summary.availableServices++;
        } else {
          report.summary.missingServices++;
        }
        
        report.services[service] = {
          totalKeys: keyCount,
          keyNames: serviceKeys ? Object.keys(serviceKeys) : [],
          available: keyCount > 0,
          permissions: this.permissionManager.getModulesWithAccess(service)
        };
      }
      
      return report;
    } catch (error) {
      this.options.logger.error('Erreur lors de la génération du rapport', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Arrêter le gestionnaire
   * @returns {boolean} - Succès de l'opération
   */
  stop() {
    try {
      // Nettoyer le stockage mémoire
      this.memoryStorage.clear();
      
      this.options.logger.info('EnhancedApiKeyManager arrêté');
      return true;
    } catch (error) {
      this.options.logger.error('Erreur lors de l\'arrêt de EnhancedApiKeyManager', {
        error: error.message
      });
      return false;
    }
  }
}

module.exports = EnhancedApiKeyManager;
