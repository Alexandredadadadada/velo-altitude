/**
 * api-key-rotation.js - Système de rotation des clés API
 * Ce module gère la rotation automatique des clés API pour éviter les abus et améliorer la sécurité
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { logger } = require('./logger');

class ApiKeyRotationManager {
  constructor() {
    this.keyRegistry = new Map();
    this.rotationSchedules = new Map();
    this.backupKeys = new Map();
  }

  /**
   * Initialise le gestionnaire de rotation des clés
   * @param {Object} config Configuration des clés à gérer
   */
  initialize(config = {}) {
    logger.info('Initialisation du système de rotation des clés API');
    
    // Chargement des clés depuis les variables d'environnement
    this._loadKeysFromEnv();
    
    // Configuration des plannings de rotation
    Object.entries(config).forEach(([service, settings]) => {
      this.rotationSchedules.set(service, {
        interval: settings.rotationInterval || 7 * 24 * 60 * 60 * 1000, // 7 jours par défaut
        lastRotation: Date.now(),
        nextRotation: Date.now() + (settings.rotationInterval || 7 * 24 * 60 * 60 * 1000),
        autoRotate: settings.autoRotate || false,
        backupCount: settings.backupCount || 2
      });
      
      // Chargement des clés de backup si disponibles
      this._loadBackupKeys(service);
    });
    
    // Démarrage du planificateur de rotation
    if (Object.values(config).some(settings => settings.autoRotate)) {
      this._startRotationScheduler();
    }
    
    logger.info('Système de rotation des clés API initialisé avec succès');
  }
  
  /**
   * Obtient la clé API active pour un service donné
   * @param {string} service Nom du service (ex: 'openroute')
   * @returns {string} Clé API active
   */
  getActiveKey(service) {
    if (!this.keyRegistry.has(service)) {
      logger.warn(`Aucune clé trouvée pour le service ${service}`);
      return null;
    }
    
    const keyData = this.keyRegistry.get(service);
    
    // Vérification si une rotation est nécessaire
    this._checkRotationNeeded(service);
    
    return keyData.currentKey;
  }
  
  /**
   * Force la rotation de la clé pour un service donné
   * @param {string} service Nom du service
   * @param {string} newKey Nouvelle clé (optionnel, sinon utilise une clé de backup)
   * @returns {boolean} Succès de l'opération
   */
  rotateKey(service, newKey = null) {
    if (!this.keyRegistry.has(service)) {
      logger.error(`Impossible de faire tourner la clé pour ${service}: service non enregistré`);
      return false;
    }
    
    try {
      const keyData = this.keyRegistry.get(service);
      const oldKey = keyData.currentKey;
      
      // Si une nouvelle clé est fournie, l'utiliser
      if (newKey) {
        keyData.currentKey = newKey;
      } 
      // Sinon, utiliser une clé de backup si disponible
      else if (this.backupKeys.has(service) && this.backupKeys.get(service).length > 0) {
        const backupKey = this.backupKeys.get(service).shift();
        keyData.currentKey = backupKey;
        logger.info(`Utilisation d'une clé de backup pour ${service}`);
      } else {
        logger.error(`Aucune clé de backup disponible pour ${service}`);
        return false;
      }
      
      // Mise à jour des informations de rotation
      if (this.rotationSchedules.has(service)) {
        const schedule = this.rotationSchedules.get(service);
        schedule.lastRotation = Date.now();
        schedule.nextRotation = Date.now() + schedule.interval;
      }
      
      // Sauvegarde de l'ancienne clé comme backup si nécessaire
      if (oldKey && this.rotationSchedules.has(service)) {
        const backupCount = this.rotationSchedules.get(service).backupCount;
        if (!this.backupKeys.has(service)) {
          this.backupKeys.set(service, []);
        }
        
        const backups = this.backupKeys.get(service);
        if (backups.length < backupCount) {
          backups.push(oldKey);
        }
      }
      
      // Sauvegarde des modifications
      this._saveBackupKeys(service);
      
      logger.info(`Clé API pour ${service} rotée avec succès`);
      return true;
    } catch (error) {
      logger.error(`Erreur lors de la rotation de la clé pour ${service}: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Ajoute une clé de backup pour un service
   * @param {string} service Nom du service
   * @param {string} backupKey Clé de backup à ajouter
   */
  addBackupKey(service, backupKey) {
    if (!backupKey) {
      logger.warn(`Tentative d'ajout d'une clé de backup invalide pour ${service}`);
      return false;
    }
    
    if (!this.backupKeys.has(service)) {
      this.backupKeys.set(service, []);
    }
    
    this.backupKeys.get(service).push(backupKey);
    this._saveBackupKeys(service);
    
    logger.info(`Clé de backup ajoutée pour ${service}`);
    return true;
  }
  
  /**
   * Charge les clés API depuis les variables d'environnement
   * @private
   */
  _loadKeysFromEnv() {
    // OpenRouteService
    if (process.env.OPENROUTE_API_KEY) {
      this.keyRegistry.set('openroute', {
        currentKey: process.env.OPENROUTE_API_KEY,
        lastUsed: Date.now(),
        usageCount: 0
      });
    }
    
    // Autres services...
    if (process.env.OPENWEATHER_API_KEY) {
      this.keyRegistry.set('openweather', {
        currentKey: process.env.OPENWEATHER_API_KEY,
        lastUsed: Date.now(),
        usageCount: 0
      });
    }
    
    if (process.env.MAPBOX_PUBLIC_TOKEN) {
      this.keyRegistry.set('mapbox', {
        currentKey: process.env.MAPBOX_PUBLIC_TOKEN,
        lastUsed: Date.now(),
        usageCount: 0
      });
    }
    
    if (process.env.OPENAI_API_KEY) {
      this.keyRegistry.set('openai', {
        currentKey: process.env.OPENAI_API_KEY,
        lastUsed: Date.now(),
        usageCount: 0
      });
    }
  }
  
  /**
   * Démarre le planificateur de rotation des clés
   * @private
   */
  _startRotationScheduler() {
    // Vérification toutes les heures
    setInterval(() => {
      this.rotationSchedules.forEach((schedule, service) => {
        if (schedule.autoRotate && Date.now() >= schedule.nextRotation) {
          logger.info(`Rotation automatique programmée pour ${service}`);
          this.rotateKey(service);
        }
      });
    }, 60 * 60 * 1000); // Vérification horaire
    
    logger.info('Planificateur de rotation des clés démarré');
  }
  
  /**
   * Vérifie si une rotation est nécessaire pour un service
   * @param {string} service Nom du service
   * @private
   */
  _checkRotationNeeded(service) {
    if (!this.rotationSchedules.has(service)) return;
    
    const schedule = this.rotationSchedules.get(service);
    if (schedule.autoRotate && Date.now() >= schedule.nextRotation) {
      logger.info(`Rotation automatique déclenchée pour ${service}`);
      this.rotateKey(service);
    }
  }
  
  /**
   * Charge les clés de backup depuis le stockage
   * @param {string} service Nom du service
   * @private
   */
  _loadBackupKeys(service) {
    try {
      const backupDir = path.join(__dirname, '../data/api-keys');
      
      // Création du répertoire s'il n'existe pas
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      const backupFile = path.join(backupDir, `${service}-backup-keys.json`);
      
      if (fs.existsSync(backupFile)) {
        const encryptedData = fs.readFileSync(backupFile, 'utf8');
        const backupData = this._decryptData(encryptedData, process.env.JWT_SECRET || 'default-encryption-key');
        
        if (backupData && Array.isArray(backupData.keys)) {
          this.backupKeys.set(service, backupData.keys);
          logger.info(`${backupData.keys.length} clés de backup chargées pour ${service}`);
        }
      }
    } catch (error) {
      logger.error(`Erreur lors du chargement des clés de backup pour ${service}: ${error.message}`);
    }
  }
  
  /**
   * Sauvegarde les clés de backup dans le stockage
   * @param {string} service Nom du service
   * @private
   */
  _saveBackupKeys(service) {
    try {
      if (!this.backupKeys.has(service)) return;
      
      const backupDir = path.join(__dirname, '../data/api-keys');
      
      // Création du répertoire s'il n'existe pas
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      const backupFile = path.join(backupDir, `${service}-backup-keys.json`);
      const backupData = {
        service,
        keys: this.backupKeys.get(service),
        updatedAt: new Date().toISOString()
      };
      
      const encryptedData = this._encryptData(backupData, process.env.JWT_SECRET || 'default-encryption-key');
      fs.writeFileSync(backupFile, encryptedData);
      
      logger.info(`Clés de backup sauvegardées pour ${service}`);
    } catch (error) {
      logger.error(`Erreur lors de la sauvegarde des clés de backup pour ${service}: ${error.message}`);
    }
  }
  
  /**
   * Chiffre les données avec une clé secrète
   * @param {Object} data Données à chiffrer
   * @param {string} secret Clé secrète
   * @returns {string} Données chiffrées
   * @private
   */
  _encryptData(data, secret) {
    const algorithm = 'aes-256-ctr';
    const iv = crypto.randomBytes(16);
    const key = crypto.createHash('sha256').update(String(secret)).digest('base64').substr(0, 32);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const encrypted = Buffer.concat([cipher.update(JSON.stringify(data)), cipher.final()]);
    
    return JSON.stringify({
      iv: iv.toString('hex'),
      content: encrypted.toString('hex')
    });
  }
  
  /**
   * Déchiffre les données avec une clé secrète
   * @param {string} encryptedData Données chiffrées
   * @param {string} secret Clé secrète
   * @returns {Object} Données déchiffrées
   * @private
   */
  _decryptData(encryptedData, secret) {
    try {
      const algorithm = 'aes-256-ctr';
      const parsedData = JSON.parse(encryptedData);
      const iv = Buffer.from(parsedData.iv, 'hex');
      const content = Buffer.from(parsedData.content, 'hex');
      const key = crypto.createHash('sha256').update(String(secret)).digest('base64').substr(0, 32);
      
      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      const decrypted = Buffer.concat([decipher.update(content), decipher.final()]);
      
      return JSON.parse(decrypted.toString());
    } catch (error) {
      logger.error(`Erreur lors du déchiffrement des données: ${error.message}`);
      return null;
    }
  }
}

// Singleton
const apiKeyRotationManager = new ApiKeyRotationManager();

module.exports = apiKeyRotationManager;
