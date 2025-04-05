/**
 * Gestionnaire de clés API avec rotation automatique et stockage sécurisé
 * Dashboard-Velo.com
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const schedule = require('node-schedule');
const { logger } = require('./logger');

class ApiKeyManager {
  constructor(serviceName, options = {}) {
    this.serviceName = serviceName;
    this.keyCount = options.keyCount || 2; // Nombre de clés actives simultanément
    this.rotationInterval = options.rotationInterval || '0 0 * * 0'; // Par défaut: rotation hebdomadaire (tous les dimanches à minuit)
    this.keysPath = options.keysPath || path.join(process.env.KEYS_DIRECTORY || './.keys', `${serviceName}.json`);
    this.encryptionKey = process.env.API_KEYS_ENCRYPTION_KEY;
    this.autoRotate = options.autoRotate !== undefined ? options.autoRotate : true;
    
    this.initializeKeys();
    
    if (this.autoRotate) {
      this.scheduleRotation();
    }
  }

  /**
   * Initialisation des clés
   * Utilise les clés existantes des variables d'environnement si aucun fichier n'existe
   */
  initializeKeys() {
    try {
      if (fs.existsSync(this.keysPath)) {
        const encryptedData = fs.readFileSync(this.keysPath, 'utf8');
        this.keys = this.decryptKeys(encryptedData);
        logger.info(`API keys loaded for ${this.serviceName}`);
      } else {
        // Utilisation des clés existantes depuis les variables d'environnement
        const existingKey = process.env[`${this.serviceName.toUpperCase()}_API_KEY`];
        
        if (!existingKey) {
          logger.warn(`No existing API key found for ${this.serviceName}, checking alternative environment variables`);
          
          // Vérifier les noms alternatifs pour les clés API
          const alternativeNames = {
            'openRouteService': ['OPENROUTE_API_KEY'],
            'strava': ['STRAVA_CLIENT_SECRET'],
            'weatherService': ['OPENWEATHER_API_KEY'],
            'mapbox': ['MAPBOX_SECRET_TOKEN'],
            'openai': ['OPENAI_API_KEY']
          };
          
          const alternatives = alternativeNames[this.serviceName] || [];
          let found = false;
          
          for (const altName of alternatives) {
            if (process.env[altName]) {
              this.keys = {
                active: 0,
                keys: [
                  {
                    key: process.env[altName],
                    created: new Date().toISOString()
                  },
                  ...Array(this.keyCount - 1).fill().map(() => this.generateNewKey())
                ],
                lastRotation: new Date().toISOString()
              };
              found = true;
              logger.info(`Using alternative environment variable ${altName} for ${this.serviceName}`);
              break;
            }
          }
          
          if (!found) {
            throw new Error(`No API key found for ${this.serviceName}`);
          }
        } else {
          // Création initiale avec la clé existante comme clé active
          this.keys = {
            active: 0,
            keys: [
              {
                key: existingKey,
                created: new Date().toISOString()
              },
              ...Array(this.keyCount - 1).fill().map(() => this.generateNewKey())
            ],
            lastRotation: new Date().toISOString()
          };
        }
        
        this.saveKeys();
        logger.info(`API keys initialized for ${this.serviceName} using environment variables`);
      }
    } catch (error) {
      logger.error(`Error initializing API keys for ${this.serviceName}:`, error);
      throw new Error(`Failed to initialize API keys for ${this.serviceName}`);
    }
  }

  /**
   * Génération d'une nouvelle clé
   * @returns {Object} Objet contenant la clé et sa date de création
   */
  generateNewKey() {
    return {
      key: crypto.randomBytes(32).toString('hex'),
      created: new Date().toISOString()
    };
  }

  /**
   * Programmation de la rotation automatique
   */
  scheduleRotation() {
    this.job = schedule.scheduleJob(this.rotationInterval, () => {
      this.rotateKeys();
    });
    logger.info(`API key rotation scheduled for ${this.serviceName} with interval ${this.rotationInterval}`);
  }

  /**
   * Rotation des clés
   * Remplace la clé la plus ancienne par une nouvelle
   */
  rotateKeys() {
    try {
      // Mise à jour de l'index de la clé active
      this.keys.active = (this.keys.active + 1) % this.keyCount;
      
      // Remplacement de la clé la plus ancienne
      const oldestKeyIndex = (this.keys.active + 1) % this.keyCount;
      this.keys.keys[oldestKeyIndex] = this.generateNewKey();
      
      this.keys.lastRotation = new Date().toISOString();
      this.saveKeys();
      
      logger.info(`API keys rotated for ${this.serviceName}`);
      
      // Notification aux administrateurs
      this.notifyAdmins();
      
      return true;
    } catch (error) {
      logger.error(`Error rotating API keys for ${this.serviceName}:`, error);
      return false;
    }
  }

  /**
   * Sauvegarde des clés (chiffrées)
   */
  saveKeys() {
    try {
      // Création du répertoire si nécessaire
      const dir = path.dirname(this.keysPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      const encryptedData = this.encryptKeys(this.keys);
      fs.writeFileSync(this.keysPath, encryptedData, 'utf8');
      logger.debug(`API keys saved for ${this.serviceName}`);
    } catch (error) {
      logger.error(`Error saving API keys for ${this.serviceName}:`, error);
    }
  }

  /**
   * Chiffrement des clés
   * @param {Object} keys Objet contenant les clés à chiffrer
   * @returns {string} Données chiffrées au format JSON
   */
  encryptKeys(keys) {
    if (!this.encryptionKey) {
      logger.warn(`No encryption key provided for ${this.serviceName}, using fallback encryption`);
      // Utiliser une clé de secours dérivée du nom du service
      this.encryptionKey = crypto.createHash('sha256').update(this.serviceName).digest('hex');
    }
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(this.encryptionKey, 'hex'), iv);
    let encrypted = cipher.update(JSON.stringify(keys), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return JSON.stringify({
      iv: iv.toString('hex'),
      data: encrypted
    });
  }

  /**
   * Déchiffrement des clés
   * @param {string} encryptedData Données chiffrées au format JSON
   * @returns {Object} Objet contenant les clés déchiffrées
   */
  decryptKeys(encryptedData) {
    if (!this.encryptionKey) {
      logger.warn(`No encryption key provided for ${this.serviceName}, using fallback encryption`);
      // Utiliser une clé de secours dérivée du nom du service
      this.encryptionKey = crypto.createHash('sha256').update(this.serviceName).digest('hex');
    }
    
    const { iv, data } = JSON.parse(encryptedData);
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(this.encryptionKey, 'hex'), Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  }

  /**
   * Obtention de la clé active
   * @returns {string} Clé API active
   */
  getActiveKey() {
    return this.keys.keys[this.keys.active].key;
  }

  /**
   * Obtention de toutes les clés valides
   * @returns {Array} Tableau des clés valides
   */
  getAllValidKeys() {
    return this.keys.keys.map(k => k.key);
  }

  /**
   * Vérification si une clé est valide (active ou récemment active)
   * @param {string} key Clé à vérifier
   * @returns {boolean} Vrai si la clé est valide
   */
  isValidKey(key) {
    return this.keys.keys.some(k => k.key === key);
  }

  /**
   * Ajout d'une nouvelle clé
   * @param {string} key Nouvelle clé à ajouter
   * @returns {boolean} Vrai si la clé a été ajoutée avec succès
   */
  addKey(key) {
    try {
      // Vérifier si la clé existe déjà
      if (this.isValidKey(key)) {
        logger.warn(`Key already exists for ${this.serviceName}`);
        return false;
      }
      
      // Remplacer la clé la plus ancienne (qui n'est pas la clé active)
      const activeIndex = this.keys.active;
      const oldestKeyIndex = (activeIndex + 1) % this.keyCount;
      
      this.keys.keys[oldestKeyIndex] = {
        key,
        created: new Date().toISOString()
      };
      
      this.saveKeys();
      logger.info(`New API key added for ${this.serviceName}`);
      return true;
    } catch (error) {
      logger.error(`Error adding new API key for ${this.serviceName}:`, error);
      return false;
    }
  }

  /**
   * Notification aux administrateurs
   */
  notifyAdmins() {
    // Implémentation selon les besoins (email, Slack, etc.)
    logger.info(`API key rotation notification for ${this.serviceName} would be sent to admins`);
    
    // TODO: Implémenter la notification aux administrateurs
  }
  
  /**
   * Arrêt du gestionnaire de clés
   */
  stop() {
    if (this.job) {
      this.job.cancel();
      logger.info(`API key rotation stopped for ${this.serviceName}`);
    }
  }
}

module.exports = ApiKeyManager;
