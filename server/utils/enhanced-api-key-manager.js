/**
 * EnhancedApiKeyManager - Gestionnaire amélioré des clés API avec sécurité renforcée
 * 
 * Cette classe intègre les différents composants du système de sécurité des clés API :
 * - SecureMemoryStorage pour le stockage sécurisé en mémoire
 * - SecretManager pour la validation des secrets
 * - ApiKeyPermissionManager pour le contrôle d'accès
 * - EnhancedApiKeyRotationManager pour la rotation des clés
 * 
 * Dashboard-Velo.com
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { logger } = require('./logger');

// Importer les composants de sécurité
const SecureMemoryStorage = require('./secure-memory-storage');
const SecretManager = require('./secret-manager');
const ApiKeyPermissionManager = require('./api-key-permission-manager');
const EnhancedApiKeyRotationManager = require('./enhanced-api-key-rotation-manager');

class EnhancedApiKeyManager {
  /**
   * Constructeur
   * @param {Object} options - Options de configuration
   */
  constructor(options = {}) {
    this.options = {
      keysDirectory: process.env.KEYS_DIRECTORY || './.keys',
      encryptionKey: process.env.API_KEYS_ENCRYPTION_KEY,
      rotationInterval: 30 * 24 * 60 * 60 * 1000, // 30 jours par défaut
      gracePeriod: 24 * 60 * 60 * 1000, // 24 heures par défaut
      memoryTTL: 30 * 60 * 1000, // 30 minutes par défaut
      autoRotate: true,
      logger: logger,
      ...options
    };

    // Valider les secrets requis
    this.secretManager = new SecretManager({
      logger: this.options.logger
    });

    // Initialiser le stockage sécurisé en mémoire
    this.memoryStorage = new SecureMemoryStorage(this.options.encryptionKey, {
      ttl: this.options.memoryTTL,
      logger: this.options.logger
    });

    // Initialiser le gestionnaire de permissions
    this.permissionManager = new ApiKeyPermissionManager({
      logger: this.options.logger
    });

    // Initialiser le gestionnaire de rotation
    this.rotationManager = new EnhancedApiKeyRotationManager(this, {
      rotationInterval: this.options.rotationInterval,
      gracePeriod: this.options.gracePeriod,
      logger: this.options.logger
    });

    // Créer le répertoire des clés s'il n'existe pas
    if (!fs.existsSync(this.options.keysDirectory)) {
      fs.mkdirSync(this.options.keysDirectory, { recursive: true });
    }

    // Démarrer la rotation automatique si activée
    if (this.options.autoRotate) {
      this.rotationManager.startAutomaticRotation();
    }
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
      await this.initializeServices();

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
   * Initialiser les services
   * @returns {Promise<void>}
   */
  async initializeServices() {
    const services = [
      'openRouteService',
      'strava',
      'weatherService',
      'mapbox',
      'openai'
    ];

    for (const service of services) {
      const keysPath = path.join(this.options.keysDirectory, `${service}.json`);
      
      if (!fs.existsSync(keysPath)) {
        // Utiliser les clés existantes depuis les variables d'environnement
        const existingKey = process.env[`${service.toUpperCase()}_API_KEY`];
        
        if (!existingKey) {
          this.options.logger.warn(`Aucune clé API existante trouvée pour ${service}, vérification des noms alternatifs`);
          
          // Vérifier les noms alternatifs pour les clés API
          const alternativeNames = {
            'openRouteService': ['OPENROUTE_API_KEY'],
            'strava': ['STRAVA_CLIENT_SECRET'],
            'weatherService': ['OPENWEATHER_API_KEY'],
            'mapbox': ['MAPBOX_SECRET_TOKEN'],
            'openai': ['OPENAI_API_KEY']
          };
          
          const alternatives = alternativeNames[service] || [];
          let found = false;
          
          for (const altName of alternatives) {
            if (process.env[altName]) {
              await this.createInitialKeys(service, process.env[altName]);
              found = true;
              this.options.logger.info(`Utilisation de la variable d'environnement alternative ${altName} pour ${service}`);
              break;
            }
          }
          
          if (!found) {
            this.options.logger.warn(`Aucune clé API trouvée pour ${service}, génération d'une clé factice pour les tests`);
            await this.createInitialKeys(service, `test-${service}-key-${crypto.randomBytes(8).toString('hex')}`);
          }
        } else {
          await this.createInitialKeys(service, existingKey);
        }
      }
    }
  }

  /**
   * Créer les clés initiales pour un service
   * @param {string} service - Nom du service
   * @param {string} initialKey - Clé initiale
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  async createInitialKeys(service, initialKey) {
    try {
      const keys = {
        keys: [
          { key: initialKey, created: new Date().toISOString() },
          { key: crypto.randomBytes(32).toString('hex'), created: new Date().toISOString() }
        ],
        activeKeyIndex: 0,
        lastRotation: new Date().toISOString(),
        gracePeriodKeys: []
      };
      
      await this.saveKeysToFile(service, keys);
      this.options.logger.info(`Clés API initialisées pour ${service}`);
      return true;
    } catch (error) {
      this.options.logger.error(`Erreur lors de la création des clés initiales pour ${service}`, {
        service,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Charger les clés depuis le fichier
   * @param {string} service - Nom du service
   * @returns {Promise<Object>} - Données des clés
   */
  async loadKeysFromFile(service) {
    try {
      const keysPath = path.join(this.options.keysDirectory, `${service}.json`);
      
      if (!fs.existsSync(keysPath)) {
        throw new Error(`Fichier de clés non trouvé pour ${service}`);
      }
      
      const encryptedData = fs.readFileSync(keysPath, 'utf8');
      const keys = this.decryptKeys(encryptedData);
      
      return keys;
    } catch (error) {
      this.options.logger.error(`Erreur lors du chargement des clés pour ${service}`, {
        service,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Sauvegarder les clés dans le fichier
   * @param {string} service - Nom du service
   * @param {Object} keys - Données des clés
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  async saveKeysToFile(service, keys) {
    try {
      const keysPath = path.join(this.options.keysDirectory, `${service}.json`);
      const encryptedData = this.encryptKeys(keys);
      
      fs.writeFileSync(keysPath, encryptedData, 'utf8');
      this.options.logger.debug(`Clés API sauvegardées pour ${service}`);
      
      // Invalider le cache en mémoire
      this.memoryStorage.delete(`${service}_key`);
      
      return true;
    } catch (error) {
      this.options.logger.error(`Erreur lors de la sauvegarde des clés pour ${service}`, {
        service,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Chiffrer les clés
   * @param {Object} keys - Objet contenant les clés à chiffrer
   * @returns {string} - Données chiffrées au format JSON
   */
  encryptKeys(keys) {
    if (!this.options.encryptionKey) {
      this.options.logger.warn('Aucune clé de chiffrement fournie, utilisation d\'une clé de secours');
      this.options.encryptionKey = crypto.createHash('sha256').update('dashboard-velo-fallback-key').digest('hex');
    }
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(this.options.encryptionKey, 'hex'), iv);
    let encrypted = cipher.update(JSON.stringify(keys), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return JSON.stringify({
      iv: iv.toString('hex'),
      data: encrypted
    });
  }

  /**
   * Déchiffrer les clés
   * @param {string} encryptedData - Données chiffrées au format JSON
   * @returns {Object} - Objet contenant les clés déchiffrées
   */
  decryptKeys(encryptedData) {
    if (!this.options.encryptionKey) {
      this.options.logger.warn('Aucune clé de chiffrement fournie, utilisation d\'une clé de secours');
      this.options.encryptionKey = crypto.createHash('sha256').update('dashboard-velo-fallback-key').digest('hex');
    }
    
    const { iv, data } = JSON.parse(encryptedData);
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(this.options.encryptionKey, 'hex'), Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }

  /**
   * Obtenir la clé API active pour un service
   * @param {string} service - Nom du service
   * @param {string} moduleId - Identifiant du module demandeur
   * @returns {Promise<string>} - Clé API active
   */
  async getApiKey(service, moduleId) {
    try {
      // Vérifier les permissions si un moduleId est fourni
      if (moduleId) {
        if (!this.permissionManager.hasPermission(moduleId, service)) {
          throw new Error(`Accès non autorisé à la clé API ${service} pour le module ${moduleId}`);
        }
      }
      
      // Essayer d'abord de récupérer depuis le stockage mémoire sécurisé
      const cachedKey = this.memoryStorage.get(`${service}_key`);
      if (cachedKey) {
        this.options.logger.debug(`Clé API récupérée depuis le cache mémoire pour ${service}`);
        return cachedKey;
      }
      
      // Si pas en mémoire, charger depuis le fichier
      const keys = await this.loadKeysFromFile(service);
      const activeKey = keys.keys[keys.activeKeyIndex].key;
      
      // Stocker en mémoire sécurisée pour les prochains accès
      this.memoryStorage.set(`${service}_key`, activeKey);
      
      this.options.logger.debug(`Clé API récupérée depuis le fichier pour ${service}`);
      return activeKey;
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
   * Obtenir toutes les clés valides pour un service
   * @param {string} service - Nom du service
   * @param {string} moduleId - Identifiant du module demandeur
   * @returns {Promise<Array<string>>} - Liste des clés valides
   */
  async getAllValidKeys(service, moduleId) {
    try {
      // Vérifier les permissions si un moduleId est fourni
      if (moduleId) {
        if (!this.permissionManager.hasPermission(moduleId, service)) {
          throw new Error(`Accès non autorisé aux clés API ${service} pour le module ${moduleId}`);
        }
      }
      
      const keys = await this.loadKeysFromFile(service);
      const validKeys = [];
      
      // Ajouter la clé active
      validKeys.push(keys.keys[keys.activeKeyIndex].key);
      
      // Ajouter les clés en période de grâce
      if (keys.gracePeriodKeys && keys.gracePeriodKeys.length > 0) {
        const now = new Date();
        
        for (const gracePeriodKey of keys.gracePeriodKeys) {
          if (new Date(gracePeriodKey.expiresAt) >= now) {
            validKeys.push(keys.keys[gracePeriodKey.keyIndex].key);
          }
        }
      }
      
      return validKeys;
    } catch (error) {
      this.options.logger.error(`Erreur lors de la récupération des clés valides pour ${service}`, {
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
      const validKeys = await this.getAllValidKeys(service);
      return validKeys.includes(key);
    } catch (error) {
      this.options.logger.error(`Erreur lors de la vérification de validité de la clé pour ${service}`, {
        service,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Ajouter une nouvelle clé pour un service
   * @param {string} service - Nom du service
   * @param {string} key - Nouvelle clé à ajouter
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  async addKey(service, key) {
    try {
      const keys = await this.loadKeysFromFile(service);
      
      // Vérifier si la clé existe déjà
      if (keys.keys.some(k => k.key === key)) {
        this.options.logger.warn(`La clé existe déjà pour ${service}`);
        return false;
      }
      
      // Trouver l'index d'une clé non active pour la remplacer
      const activeIndex = keys.activeKeyIndex;
      let replacementIndex = -1;
      
      // Chercher une clé qui n'est ni active ni en période de grâce
      for (let i = 0; i < keys.keys.length; i++) {
        if (i !== activeIndex && (!keys.gracePeriodKeys || !keys.gracePeriodKeys.some(gp => gp.keyIndex === i))) {
          replacementIndex = i;
          break;
        }
      }
      
      // Si aucun index disponible, ajouter une nouvelle entrée
      if (replacementIndex === -1) {
        keys.keys.push({
          key,
          created: new Date().toISOString()
        });
      } else {
        // Remplacer la clé existante
        keys.keys[replacementIndex] = {
          key,
          created: new Date().toISOString()
        };
      }
      
      await this.saveKeysToFile(service, keys);
      this.options.logger.info(`Nouvelle clé API ajoutée pour ${service}`);
      
      return true;
    } catch (error) {
      this.options.logger.error(`Erreur lors de l'ajout d'une nouvelle clé pour ${service}`, {
        service,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Lister tous les services disponibles
   * @returns {Promise<Array<string>>} - Liste des services
   */
  async listServices() {
    try {
      const files = fs.readdirSync(this.options.keysDirectory);
      const services = files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));
      
      return services;
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
      const services = await this.listServices();
      const report = {
        timestamp: new Date().toISOString(),
        services: {},
        summary: {
          totalServices: services.length,
          totalKeys: 0,
          activeKeys: 0,
          gracePeriodKeys: 0
        }
      };
      
      for (const service of services) {
        try {
          const keys = await this.loadKeysFromFile(service);
          const gracePeriodKeysCount = keys.gracePeriodKeys ? keys.gracePeriodKeys.length : 0;
          
          report.summary.totalKeys += keys.keys.length;
          report.summary.activeKeys++;
          report.summary.gracePeriodKeys += gracePeriodKeysCount;
          
          report.services[service] = {
            totalKeys: keys.keys.length,
            activeKeyIndex: keys.activeKeyIndex,
            lastRotation: keys.lastRotation,
            gracePeriodKeys: gracePeriodKeysCount,
            permissions: this.permissionManager.getModulesWithAccess(service)
          };
        } catch (error) {
          report.services[service] = {
            error: error.message
          };
        }
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
      // Arrêter la rotation automatique
      this.rotationManager.stopAutomaticRotation();
      
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
