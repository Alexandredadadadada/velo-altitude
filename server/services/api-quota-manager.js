/**
 * Service de gestion des quotas d'API
 * Surveille et gère les quotas d'API pour éviter les problèmes de limitation de taux
 */
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const notificationService = require('./notification.service');

class ApiQuotaManager {
  constructor() {
    this.quotaData = {};
    this.quotaConfig = {}; 
    this.quotaConfigPath = path.join(process.cwd(), 'config', 'api-quotas.json');
    this.usageDataPath = path.join(process.cwd(), 'data', 'api-usage.json');
    this.initialized = false;
    
    // Créer le répertoire de données s'il n'existe pas
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Créer le répertoire de configuration s'il n'existe pas
    const configDir = path.join(process.cwd(), 'config');
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
  }

  /**
   * Initialise le gestionnaire de quotas
   */
  async initialize() {
    try {
      // Charger la configuration des quotas
      if (fs.existsSync(this.quotaConfigPath)) {
        const configData = JSON.parse(fs.readFileSync(this.quotaConfigPath, 'utf8'));
        this.quotaConfig = configData;
      } else {
        // Configuration par défaut si le fichier n'existe pas
        this.initializeDefaultConfig();
      }

      // Charger les données d'utilisation existantes
      if (fs.existsSync(this.usageDataPath)) {
        this.quotaData = JSON.parse(fs.readFileSync(this.usageDataPath, 'utf8'));
        
        // Nettoyer les données périmées
        this.cleanExpiredData();
      } else {
        this.quotaData = {};
      }

      logger.info("Service de gestion des quotas d'API initialisé");
      this.initialized = true;
      
      // Planifier la sauvegarde périodique des données
      this.scheduleSaveInterval();
      
      // Planifier la vérification périodique des quotas
      this.scheduleQuotaCheck();
      
    } catch (error) {
      logger.error("Erreur lors de l'initialisation du gestionnaire de quotas API", { error: error.message });
      throw error;
    }
  }

  /**
   * Vérifie si une requête API peut être effectuée sans dépasser le quota
   * @param {string} apiName Nom de l'API
   * @param {number} cost Coût de la requête en nombre d'appels (par défaut 1)
   * @returns {boolean} true si la requête peut être effectuée, false sinon
   */
  canMakeRequest(apiName, cost = 1) {
    if (!this.initialized) {
      try {
        // Initialiser de manière synchrone si ce n'est pas déjà fait
        if (fs.existsSync(this.quotaConfigPath)) {
          this.quotaConfig = JSON.parse(fs.readFileSync(this.quotaConfigPath, 'utf8'));
        } else {
          this.initializeDefaultConfig();
        }
        
        if (fs.existsSync(this.usageDataPath)) {
          this.quotaData = JSON.parse(fs.readFileSync(this.usageDataPath, 'utf8'));
          this.cleanExpiredData();
        }
        
        this.initialized = true;
      } catch (error) {
        logger.error("Erreur lors de l'initialisation du gestionnaire de quotas API", { error: error.message });
        // En cas d'erreur, permettre la requête pour éviter de bloquer le service
        return true;
      }
    }

    const apiConfig = this.quotaConfig[apiName];
    if (!apiConfig) {
      // Si l'API n'est pas configurée, autoriser la requête
      return true;
    }

    // Initialiser les données pour cette API si elles n'existent pas
    if (!this.quotaData[apiName]) {
      this.quotaData[apiName] = {
        dayCount: 0,
        dayStart: Date.now(),
        fifteenMinCount: 0,
        fifteenMinStart: Date.now(),
        history: []
      };
    }

    // Réinitialiser le compteur quotidien si nécessaire
    const oneDayMs = 24 * 60 * 60 * 1000;
    if (Date.now() - this.quotaData[apiName].dayStart > oneDayMs) {
      this.quotaData[apiName].dayCount = 0;
      this.quotaData[apiName].dayStart = Date.now();
    }

    // Réinitialiser le compteur de 15 minutes si nécessaire
    const fifteenMinMs = 15 * 60 * 1000;
    if (Date.now() - this.quotaData[apiName].fifteenMinStart > fifteenMinMs) {
      this.quotaData[apiName].fifteenMinCount = 0;
      this.quotaData[apiName].fifteenMinStart = Date.now();
    }

    // Vérifier les quotas
    if (this.quotaData[apiName].dayCount + cost > apiConfig.dayLimit) {
      logger.warn(`Quota quotidien de l'API ${apiName} dépassé`, {
        current: this.quotaData[apiName].dayCount,
        limit: apiConfig.dayLimit,
        cost
      });
      return false;
    }

    if (this.quotaData[apiName].fifteenMinCount + cost > apiConfig.fifteenMinLimit) {
      logger.warn(`Quota de 15 minutes de l'API ${apiName} dépassé`, {
        current: this.quotaData[apiName].fifteenMinCount,
        limit: apiConfig.fifteenMinLimit,
        cost
      });
      return false;
    }

    return true;
  }

  /**
   * Enregistre une requête API effectuée
   * @param {string} apiName Nom de l'API
   * @param {string} endpoint Point d'accès utilisé
   * @param {number} cost Coût de la requête en nombre d'appels (par défaut 1)
   * @param {boolean} success Indique si la requête a réussi
   * @param {number} responseTime Temps de réponse en ms
   */
  recordRequest(apiName, endpoint, cost = 1, success = true, responseTime = 0) {
    if (!this.initialized) {
      try {
        // Initialiser de manière synchrone si ce n'est pas déjà fait
        if (fs.existsSync(this.quotaConfigPath)) {
          this.quotaConfig = JSON.parse(fs.readFileSync(this.quotaConfigPath, 'utf8'));
        } else {
          this.initializeDefaultConfig();
        }
        
        if (fs.existsSync(this.usageDataPath)) {
          this.quotaData = JSON.parse(fs.readFileSync(this.usageDataPath, 'utf8'));
        }
        
        this.initialized = true;
      } catch (error) {
        logger.error("Erreur lors de l'initialisation du gestionnaire de quotas API", { error: error.message });
        // Continuer avec une initialisation minimale
        this.quotaConfig = this.quotaConfig || {};
        this.quotaData = this.quotaData || {};
      }
    }

    // Initialiser les données pour cette API si elles n'existent pas
    if (!this.quotaData[apiName]) {
      this.quotaData[apiName] = {
        dayCount: 0,
        dayStart: Date.now(),
        fifteenMinCount: 0,
        fifteenMinStart: Date.now(),
        history: []
      };
    }

    // Mettre à jour les compteurs
    this.quotaData[apiName].dayCount += cost;
    this.quotaData[apiName].fifteenMinCount += cost;

    // Enregistrer l'historique
    this.quotaData[apiName].history.push({
      timestamp: Date.now(),
      endpoint,
      cost,
      success,
      responseTime
    });

    // Limiter la taille de l'historique
    if (this.quotaData[apiName].history.length > 1000) {
      this.quotaData[apiName].history = this.quotaData[apiName].history.slice(-1000);
    }

    // Logger la requête
    logger.debug(`Requête API ${apiName} enregistrée`, {
      endpoint,
      cost,
      success,
      responseTime,
      dayCount: this.quotaData[apiName].dayCount,
      fifteenMinCount: this.quotaData[apiName].fifteenMinCount
    });

    // Vérifier les seuils d'alerte
    this.checkQuotaThresholds(apiName);

    // Sauvegarder les données
    this.saveUsageData();
  }

  /**
   * Vérifie si les seuils d'alerte sont atteints et envoie des notifications si nécessaire
   * @param {string} apiName Nom de l'API
   */
  checkQuotaThresholds(apiName) {
    const apiConfig = this.quotaConfig[apiName];
    if (!apiConfig) {
      return;
    }

    const data = this.quotaData[apiName];
    if (!data) {
      return;
    }

    // Calculer les pourcentages d'utilisation
    const dayPercentage = (data.dayCount / apiConfig.dayLimit) * 100;
    const fifteenMinPercentage = (data.fifteenMinCount / apiConfig.fifteenMinLimit) * 100;

    // Vérifier le seuil critique
    if (dayPercentage >= apiConfig.criticalThreshold) {
      const message = `CRITIQUE: Quota quotidien de l'API ${apiName} à ${dayPercentage.toFixed(1)}% (${data.dayCount}/${apiConfig.dayLimit})`;
      logger.error(message);
      notificationService.sendAlert({
        type: 'critical',
        source: 'api-quota',
        subject: `Quota API ${apiName} critique`,
        message
      });
    }
    // Vérifier le seuil d'avertissement
    else if (dayPercentage >= apiConfig.warningThreshold) {
      const message = `AVERTISSEMENT: Quota quotidien de l'API ${apiName} à ${dayPercentage.toFixed(1)}% (${data.dayCount}/${apiConfig.dayLimit})`;
      logger.warn(message);
      notificationService.sendAlert({
        type: 'warning',
        source: 'api-quota',
        subject: `Quota API ${apiName} élevé`,
        message
      });
    }

    // Vérifier le quota de 15 minutes
    if (fifteenMinPercentage >= apiConfig.criticalThreshold) {
      const message = `CRITIQUE: Quota 15min de l'API ${apiName} à ${fifteenMinPercentage.toFixed(1)}% (${data.fifteenMinCount}/${apiConfig.fifteenMinLimit})`;
      logger.error(message);
      notificationService.sendAlert({
        type: 'critical',
        source: 'api-quota',
        subject: `Quota 15min API ${apiName} critique`,
        message
      });
    }
  }

  /**
   * Nettoie les données périmées
   */
  cleanExpiredData() {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    Object.keys(this.quotaData).forEach(apiName => {
      const data = this.quotaData[apiName];
      
      // Réinitialiser le compteur quotidien si nécessaire
      if (now - data.dayStart > oneDayMs) {
        data.dayCount = 0;
        data.dayStart = now;
      }

      // Réinitialiser le compteur de 15 minutes si nécessaire
      const fifteenMinMs = 15 * 60 * 1000;
      if (now - data.fifteenMinStart > fifteenMinMs) {
        data.fifteenMinCount = 0;
        data.fifteenMinStart = now;
      }

      // Nettoyer l'historique (conserver les 7 derniers jours)
      if (data.history && data.history.length > 0) {
        const sevenDaysAgo = now - (7 * oneDayMs);
        data.history = data.history.filter(item => item.timestamp >= sevenDaysAgo);
      }
    });
  }

  /**
   * Sauvegarde les données d'utilisation dans un fichier
   */
  saveUsageData() {
    try {
      fs.writeFileSync(
        this.usageDataPath,
        JSON.stringify(this.quotaData, null, 2),
        'utf8'
      );
    } catch (error) {
      logger.error('Erreur lors de la sauvegarde des données d\'utilisation API', {
        error: error.message
      });
    }
  }

  /**
   * Planifie la sauvegarde périodique des données
   */
  scheduleSaveInterval() {
    // Sauvegarder toutes les 5 minutes
    setInterval(() => {
      this.saveUsageData();
    }, 5 * 60 * 1000);
  }

  /**
   * Planifie la vérification périodique des quotas
   */
  scheduleQuotaCheck() {
    // Vérifier toutes les heures
    setInterval(() => {
      this.cleanExpiredData();
      
      // Vérifier chaque API configurée
      Object.keys(this.quotaConfig).forEach(apiName => {
        this.checkQuotaThresholds(apiName);
      });
      
      logger.info('Vérification périodique des quotas API effectuée');
    }, 60 * 60 * 1000);
  }

  /**
   * Obtient les statistiques d'utilisation des API
   * @returns {Object} Statistiques d'utilisation
   */
  getUsageStatistics() {
    const stats = {};
    
    Object.keys(this.quotaData).forEach(apiName => {
      const data = this.quotaData[apiName];
      const config = this.quotaConfig[apiName] || {};
      
      // Calculer les statistiques
      const totalRequests = data.history.length;
      const successfulRequests = data.history.filter(item => item.success).length;
      const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;
      
      const avgResponseTime = data.history.length > 0
        ? data.history.reduce((sum, item) => sum + item.responseTime, 0) / data.history.length
        : 0;
      
      // Calculer les pourcentages d'utilisation
      const dayPercentage = config.dayLimit ? (data.dayCount / config.dayLimit) * 100 : 0;
      const fifteenMinPercentage = config.fifteenMinLimit ? (data.fifteenMinCount / config.fifteenMinLimit) * 100 : 0;
      
      stats[apiName] = {
        totalRequests,
        successfulRequests,
        successRate: successRate.toFixed(2),
        avgResponseTime: avgResponseTime.toFixed(2),
        quotaUsage: {
          day: {
            count: data.dayCount,
            limit: config.dayLimit || 'Illimité',
            percentage: dayPercentage.toFixed(2)
          },
          fifteenMin: {
            count: data.fifteenMinCount,
            limit: config.fifteenMinLimit || 'Illimité',
            percentage: fifteenMinPercentage.toFixed(2)
          }
        },
        lastUpdated: new Date().toISOString()
      };
    });
    
    return stats;
  }

  /**
   * Met à jour la configuration des quotas pour une API
   * @param {string} apiName Nom de l'API
   * @param {Object} config Nouvelle configuration
   */
  updateQuotaConfig(apiName, config) {
    if (!this.quotaConfig[apiName]) {
      this.quotaConfig[apiName] = {};
    }
    
    // Mettre à jour la configuration
    Object.assign(this.quotaConfig[apiName], config);
    
    // Sauvegarder la configuration
    fs.writeFileSync(
      this.quotaConfigPath,
      JSON.stringify(this.quotaConfig, null, 2),
      'utf8'
    );
    
    logger.info(`Configuration des quotas de l'API ${apiName} mise à jour`, {
      config: this.quotaConfig[apiName]
    });
    
    return this.quotaConfig[apiName];
  }

  /**
   * Initialise la configuration par défaut des quotas
   */
  initializeDefaultConfig() {
    this.quotaConfig = {
      strava: {
        dayLimit: 1000,
        fifteenMinLimit: 100,
        warningThreshold: 80, // pourcentage
        criticalThreshold: 95 // pourcentage
      },
      // Ajoutez d'autres APIs selon les besoins
    };
    
    try {
      // Sauvegarder la configuration par défaut
      fs.writeFileSync(
        this.quotaConfigPath, 
        JSON.stringify(this.quotaConfig, null, 2), 
        'utf8'
      );
    } catch (error) {
      logger.error("Erreur lors de la sauvegarde de la configuration par défaut", { error: error.message });
    }
  }
}

// Exporter une instance unique
const quotaManager = new ApiQuotaManager();
module.exports = quotaManager;
