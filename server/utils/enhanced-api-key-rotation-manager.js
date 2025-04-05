/**
 * EnhancedApiKeyRotationManager - Classe pour la gestion améliorée de la rotation des clés API
 * 
 * Cette classe implémente un système avancé de rotation des clés API avec période de grâce,
 * rotation automatique et nettoyage des clés expirées.
 */

const crypto = require('crypto');

class EnhancedApiKeyRotationManager {
  /**
   * Constructeur
   * @param {Object} apiKeyManager - Instance du gestionnaire de clés API
   * @param {Object} options - Options de configuration
   */
  constructor(apiKeyManager, options = {}) {
    if (!apiKeyManager) {
      throw new Error('apiKeyManager est requis');
    }

    this.apiKeyManager = apiKeyManager;
    
    // Options par défaut
    this.options = {
      rotationInterval: 30 * 24 * 60 * 60 * 1000, // 30 jours par défaut
      gracePeriod: 24 * 60 * 60 * 1000, // 24 heures de période de grâce
      maxKeyAge: 90 * 24 * 60 * 60 * 1000, // 90 jours maximum
      autoRotationCheckInterval: 24 * 60 * 60 * 1000, // Vérifier toutes les 24 heures
      ...options
    };
    
    this.logger = options.logger || console;
    this._autoRotationInterval = null;
  }

  /**
   * Vérifier si une rotation est nécessaire pour un service
   * @param {string} service - Nom du service
   * @returns {Promise<boolean>} - True si une rotation est nécessaire
   */
  async checkRotationNeeded(service) {
    try {
      const keys = await this.apiKeyManager.loadKeysFromFile(service);
      
      if (!keys || !keys.lastRotation) {
        this.logger.warn(`Aucune information de rotation trouvée pour ${service}, rotation recommandée`);
        return true;
      }
      
      const lastRotation = new Date(keys.lastRotation);
      const now = new Date();
      const timeSinceLastRotation = now.getTime() - lastRotation.getTime();
      
      // Vérifier si la dernière rotation est trop ancienne
      if (timeSinceLastRotation > this.options.rotationInterval) {
        this.logger.info(`Rotation nécessaire pour ${service} (dernière rotation: ${lastRotation.toISOString()})`);
        return true;
      }
      
      return false;
    } catch (error) {
      this.logger.error(`Erreur lors de la vérification de rotation pour ${service}`, {
        service,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Effectuer une rotation avec période de grâce
   * @param {string} service - Nom du service
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  async rotateWithGracePeriod(service) {
    try {
      const keys = await this.apiKeyManager.loadKeysFromFile(service);
      
      if (!keys || !keys.keys || keys.keys.length < 2) {
        throw new Error(`Configuration de clés invalide pour ${service}`);
      }
      
      // Sauvegarder l'index de la clé active actuelle
      const oldActiveKeyIndex = keys.activeKeyIndex;
      
      // Trouver un nouvel index pour la clé active
      let newActiveKeyIndex = (oldActiveKeyIndex + 1) % keys.keys.length;
      
      // Mettre à jour l'index de la clé active
      keys.activeKeyIndex = newActiveKeyIndex;
      
      // Ajouter l'ancienne clé active à la liste des clés en période de grâce
      if (!keys.gracePeriodKeys) {
        keys.gracePeriodKeys = [];
      }
      
      // Nettoyer d'abord les clés expirées de la période de grâce
      await this.cleanupExpiredGracePeriodKeys(service, keys);
      
      // Ajouter la clé actuelle à la période de grâce
      keys.gracePeriodKeys.push({
        keyIndex: oldActiveKeyIndex,
        expiresAt: new Date(Date.now() + this.options.gracePeriod).toISOString()
      });
      
      // Mettre à jour la date de dernière rotation
      keys.lastRotation = new Date().toISOString();
      
      // Sauvegarder les modifications
      await this.apiKeyManager.saveKeysToFile(service, keys);
      
      this.logger.info(`Rotation effectuée pour ${service} avec période de grâce`, {
        service,
        oldActiveKeyIndex,
        newActiveKeyIndex,
        gracePeriodExpiry: keys.gracePeriodKeys[keys.gracePeriodKeys.length - 1].expiresAt
      });
      
      return true;
    } catch (error) {
      this.logger.error(`Erreur lors de la rotation avec période de grâce pour ${service}`, {
        service,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Nettoyer les clés expirées de la période de grâce
   * @param {string} service - Nom du service
   * @param {Object} [keysData] - Données des clés (optionnel, chargées si non fournies)
   * @returns {Promise<boolean>} - True si des clés ont été nettoyées
   */
  async cleanupExpiredGracePeriodKeys(service, keysData = null) {
    try {
      const keys = keysData || await this.apiKeyManager.loadKeysFromFile(service);
      
      if (!keys.gracePeriodKeys || keys.gracePeriodKeys.length === 0) {
        return false;
      }
      
      const now = new Date();
      const expiredKeys = keys.gracePeriodKeys.filter(gracePeriodKey => {
        return new Date(gracePeriodKey.expiresAt) < now;
      });
      
      if (expiredKeys.length === 0) {
        return false;
      }
      
      // Supprimer les clés expirées
      keys.gracePeriodKeys = keys.gracePeriodKeys.filter(gracePeriodKey => {
        return new Date(gracePeriodKey.expiresAt) >= now;
      });
      
      // Sauvegarder les modifications si keysData n'était pas fourni
      if (!keysData) {
        await this.apiKeyManager.saveKeysToFile(service, keys);
      }
      
      this.logger.info(`Nettoyage des clés expirées pour ${service}`, {
        service,
        expiredKeysCount: expiredKeys.length,
        remainingGracePeriodKeysCount: keys.gracePeriodKeys.length
      });
      
      return true;
    } catch (error) {
      this.logger.error(`Erreur lors du nettoyage des clés expirées pour ${service}`, {
        service,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Vérifier si une clé est valide (active ou en période de grâce)
   * @param {string} service - Nom du service
   * @param {number} keyIndex - Index de la clé à vérifier
   * @returns {Promise<boolean>} - True si la clé est valide
   */
  async isKeyValid(service, keyIndex) {
    try {
      const keys = await this.apiKeyManager.loadKeysFromFile(service);
      
      // Si c'est la clé active, elle est valide
      if (keys.activeKeyIndex === keyIndex) {
        return true;
      }
      
      // Vérifier si la clé est en période de grâce
      if (keys.gracePeriodKeys && keys.gracePeriodKeys.length > 0) {
        const now = new Date();
        
        const isInGracePeriod = keys.gracePeriodKeys.some(gracePeriodKey => {
          return gracePeriodKey.keyIndex === keyIndex && new Date(gracePeriodKey.expiresAt) >= now;
        });
        
        return isInGracePeriod;
      }
      
      return false;
    } catch (error) {
      this.logger.error(`Erreur lors de la vérification de validité de la clé pour ${service}`, {
        service,
        keyIndex,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Démarrer le service de rotation automatique des clés
   * @returns {boolean} - Succès de l'opération
   */
  startAutomaticRotation() {
    if (this._autoRotationInterval) {
      this.stopAutomaticRotation();
    }
    
    this.logger.info('Démarrage du service de rotation automatique des clés API');
    
    this._autoRotationInterval = setInterval(async () => {
      try {
        await this.performScheduledRotations();
      } catch (error) {
        this.logger.error('Erreur lors des rotations automatiques', {
          error: error.message
        });
      }
    }, this.options.autoRotationCheckInterval);
    
    // S'assurer que l'intervalle ne bloque pas le processus de se terminer
    this._autoRotationInterval.unref();
    
    return true;
  }

  /**
   * Arrêter le service de rotation automatique des clés
   * @returns {boolean} - Succès de l'opération
   */
  stopAutomaticRotation() {
    if (this._autoRotationInterval) {
      clearInterval(this._autoRotationInterval);
      this._autoRotationInterval = null;
      this.logger.info('Service de rotation automatique des clés API arrêté');
      return true;
    }
    return false;
  }

  /**
   * Effectuer les rotations planifiées pour tous les services
   * @returns {Promise<Object>} - Résultats des rotations
   */
  async performScheduledRotations() {
    const results = {
      timestamp: new Date().toISOString(),
      rotated: [],
      failed: [],
      skipped: []
    };
    
    try {
      const services = await this.apiKeyManager.listServices();
      
      for (const service of services) {
        try {
          // Nettoyer les clés expirées
          await this.cleanupExpiredGracePeriodKeys(service);
          
          // Vérifier si une rotation est nécessaire
          const rotationNeeded = await this.checkRotationNeeded(service);
          
          if (rotationNeeded) {
            await this.rotateWithGracePeriod(service);
            results.rotated.push(service);
          } else {
            results.skipped.push(service);
          }
        } catch (error) {
          this.logger.error(`Erreur lors de la rotation automatique pour ${service}`, {
            service,
            error: error.message
          });
          results.failed.push({
            service,
            error: error.message
          });
        }
      }
      
      this.logger.info('Rotations automatiques terminées', {
        rotatedCount: results.rotated.length,
        failedCount: results.failed.length,
        skippedCount: results.skipped.length
      });
      
      return results;
    } catch (error) {
      this.logger.error('Erreur lors de la récupération de la liste des services', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Forcer la rotation immédiate d'un service
   * @param {string} service - Nom du service
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  async forceRotation(service) {
    try {
      await this.rotateWithGracePeriod(service);
      return true;
    } catch (error) {
      this.logger.error(`Erreur lors de la rotation forcée pour ${service}`, {
        service,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Générer un rapport sur l'état des rotations
   * @returns {Promise<Object>} - Rapport détaillé
   */
  async generateRotationReport() {
    const report = {
      timestamp: new Date().toISOString(),
      services: {},
      summary: {
        totalServices: 0,
        needRotation: 0,
        recentlyRotated: 0,
        gracePeriodKeys: 0
      }
    };
    
    try {
      const services = await this.apiKeyManager.listServices();
      report.summary.totalServices = services.length;
      
      for (const service of services) {
        try {
          const keys = await this.apiKeyManager.loadKeysFromFile(service);
          const lastRotation = keys.lastRotation ? new Date(keys.lastRotation) : null;
          const now = new Date();
          const timeSinceLastRotation = lastRotation ? now.getTime() - lastRotation.getTime() : null;
          const needsRotation = !lastRotation || timeSinceLastRotation > this.options.rotationInterval;
          
          if (needsRotation) {
            report.summary.needRotation++;
          }
          
          if (lastRotation && timeSinceLastRotation < 24 * 60 * 60 * 1000) {
            report.summary.recentlyRotated++;
          }
          
          const gracePeriodKeysCount = keys.gracePeriodKeys ? keys.gracePeriodKeys.length : 0;
          report.summary.gracePeriodKeys += gracePeriodKeysCount;
          
          report.services[service] = {
            lastRotation: lastRotation ? lastRotation.toISOString() : null,
            daysSinceLastRotation: lastRotation ? Math.floor(timeSinceLastRotation / (24 * 60 * 60 * 1000)) : null,
            needsRotation,
            activeKeyIndex: keys.activeKeyIndex,
            totalKeys: keys.keys.length,
            gracePeriodKeys: gracePeriodKeysCount,
            gracePeriodDetails: keys.gracePeriodKeys || []
          };
        } catch (error) {
          report.services[service] = {
            error: error.message
          };
        }
      }
      
      return report;
    } catch (error) {
      this.logger.error('Erreur lors de la génération du rapport de rotation', {
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = EnhancedApiKeyRotationManager;
