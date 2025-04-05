/**
 * Service de récupération et d'analyse des erreurs
 * Permet de diagnostiquer et résoudre automatiquement les problèmes d'itinéraires
 */

const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');
const { retryAsync } = require('../utils/promise-helpers');

class ErrorRecoveryService {
  constructor() {
    this.dataDirectory = path.join(__dirname, '../data/error-recovery');
    this.errorLog = [];
    this.recoveryStrategies = {};
    this.maxErrorLogSize = 1000;
    this.recoveryStats = {
      totalErrors: 0,
      recoveryAttempts: 0,
      successfulRecoveries: 0,
      failedRecoveries: 0
    };
    
    // Créer le répertoire de données si nécessaire
    this._ensureDirectoryExists();
    
    // Charger les erreurs précédentes
    this._loadErrorLog();
    
    // Initialiser les stratégies de récupération
    this._initializeRecoveryStrategies();
    
    logger.info('Service de récupération d\'erreurs initialisé');
  }
  
  /**
   * Enregistre une erreur et tente de la récupérer
   * @param {Error} error Erreur à traiter
   * @param {Object} context Contexte de l'erreur (méthode, paramètres, etc.)
   * @returns {Promise<Object>} Résultat de la tentative de récupération
   */
  async handleError(error, context = {}) {
    try {
      // Enrichir l'erreur avec des informations contextuelles
      const enhancedError = this._enhanceError(error, context);
      
      // Enregistrer l'erreur
      this._logError(enhancedError);
      
      // Vérifier si une stratégie de récupération est disponible
      const recoveryStrategy = this._findRecoveryStrategy(enhancedError);
      
      if (recoveryStrategy) {
        logger.info(`Tentative de récupération pour l'erreur: ${enhancedError.code || 'UNKNOWN'}`);
        this.recoveryStats.recoveryAttempts++;
        
        // Tenter la récupération
        const recoveryResult = await recoveryStrategy.execute(enhancedError, context);
        
        if (recoveryResult.success) {
          this.recoveryStats.successfulRecoveries++;
          logger.info(`Récupération réussie pour l'erreur: ${enhancedError.code || 'UNKNOWN'}`);
          
          // Mettre à jour l'erreur avec les informations de récupération
          enhancedError.recovered = true;
          enhancedError.recoveryMethod = recoveryStrategy.name;
          enhancedError.recoveryTime = new Date().toISOString();
          this._updateErrorLog(enhancedError);
          
          return {
            success: true,
            originalError: enhancedError,
            recoveryMethod: recoveryStrategy.name,
            result: recoveryResult.result
          };
        } else {
          this.recoveryStats.failedRecoveries++;
          logger.warn(`Échec de récupération pour l'erreur: ${enhancedError.code || 'UNKNOWN'}`);
          
          // Mettre à jour l'erreur avec les informations d'échec
          enhancedError.recoveryAttempted = true;
          enhancedError.recoveryMethod = recoveryStrategy.name;
          enhancedError.recoveryFailure = recoveryResult.error || 'Échec de récupération sans détails';
          this._updateErrorLog(enhancedError);
          
          return {
            success: false,
            originalError: enhancedError,
            recoveryMethod: recoveryStrategy.name,
            error: recoveryResult.error
          };
        }
      } else {
        logger.warn(`Aucune stratégie de récupération disponible pour l'erreur: ${enhancedError.code || 'UNKNOWN'}`);
        
        return {
          success: false,
          originalError: enhancedError,
          error: 'Aucune stratégie de récupération disponible'
        };
      }
    } catch (recoveryError) {
      logger.error(`Erreur lors de la tentative de récupération: ${recoveryError.message}`);
      
      return {
        success: false,
        originalError: error,
        error: `Erreur lors de la tentative de récupération: ${recoveryError.message}`
      };
    }
  }
  
  /**
   * Enregistre une erreur dans le journal
   * @param {Error} error Erreur à enregistrer
   * @private
   */
  _logError(error) {
    // Incrémenter le compteur d'erreurs
    this.recoveryStats.totalErrors++;
    
    // Créer une entrée de journal
    const errorEntry = {
      id: this._generateErrorId(),
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        code: error.code || 'UNKNOWN',
        stack: error.stack,
        context: error.context || {}
      },
      recovered: false,
      recoveryAttempted: false
    };
    
    // Ajouter au journal
    this.errorLog.unshift(errorEntry);
    
    // Limiter la taille du journal
    if (this.errorLog.length > this.maxErrorLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxErrorLogSize);
    }
    
    // Sauvegarder périodiquement
    if (this.recoveryStats.totalErrors % 10 === 0) {
      this._saveErrorLog();
    }
    
    return errorEntry;
  }
  
  /**
   * Met à jour une entrée du journal d'erreurs
   * @param {Object} enhancedError Erreur enrichie avec informations de récupération
   * @private
   */
  _updateErrorLog(enhancedError) {
    // Trouver l'entrée correspondante
    const errorIndex = this.errorLog.findIndex(entry => entry.id === enhancedError.id);
    
    if (errorIndex >= 0) {
      // Mettre à jour l'entrée
      this.errorLog[errorIndex] = {
        ...this.errorLog[errorIndex],
        recovered: enhancedError.recovered || false,
        recoveryAttempted: enhancedError.recoveryAttempted || false,
        recoveryMethod: enhancedError.recoveryMethod,
        recoveryTime: enhancedError.recoveryTime,
        recoveryFailure: enhancedError.recoveryFailure
      };
      
      // Sauvegarder le journal
      this._saveErrorLog();
    }
  }
  
  /**
   * Enrichit une erreur avec des informations contextuelles
   * @param {Error} error Erreur d'origine
   * @param {Object} context Contexte de l'erreur
   * @returns {Error} Erreur enrichie
   * @private
   */
  _enhanceError(error, context) {
    // Copier l'erreur pour éviter de modifier l'original
    const enhancedError = Object.assign(new Error(error.message), error);
    
    // Ajouter un identifiant unique
    enhancedError.id = this._generateErrorId();
    
    // Ajouter le contexte
    enhancedError.context = context;
    
    // Ajouter un timestamp
    enhancedError.timestamp = new Date().toISOString();
    
    // Analyser le message d'erreur pour déterminer le type
    if (!enhancedError.code) {
      enhancedError.code = this._determineErrorCode(error);
    }
    
    return enhancedError;
  }
  
  /**
   * Détermine un code d'erreur basé sur le message
   * @param {Error} error Erreur à analyser
   * @returns {string} Code d'erreur
   * @private
   */
  _determineErrorCode(error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('timeout') || message.includes('délai')) {
      return 'TIMEOUT';
    } else if (message.includes('quota') || message.includes('rate limit')) {
      return 'QUOTA_EXCEEDED';
    } else if (message.includes('network') || message.includes('réseau') || message.includes('connection')) {
      return 'NETWORK_ERROR';
    } else if (message.includes('invalid') || message.includes('invalide')) {
      return 'INVALID_PARAMETERS';
    } else if (message.includes('not found') || message.includes('introuvable')) {
      return 'NOT_FOUND';
    } else if (message.includes('server') || message.includes('serveur')) {
      return 'SERVER_ERROR';
    } else if (message.includes('authorization') || message.includes('authorisation') || message.includes('api key')) {
      return 'AUTH_ERROR';
    } else {
      return 'UNKNOWN';
    }
  }
  
  /**
   * Génère un identifiant unique pour une erreur
   * @returns {string} Identifiant unique
   * @private
   */
  _generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  }
  
  /**
   * Trouve une stratégie de récupération adaptée à l'erreur
   * @param {Error} error Erreur à traiter
   * @returns {Object|null} Stratégie de récupération ou null si aucune n'est disponible
   * @private
   */
  _findRecoveryStrategy(error) {
    // Vérifier si une stratégie spécifique existe pour ce code d'erreur
    if (error.code && this.recoveryStrategies[error.code]) {
      return this.recoveryStrategies[error.code];
    }
    
    // Vérifier si une stratégie générique existe
    if (this.recoveryStrategies.DEFAULT) {
      return this.recoveryStrategies.DEFAULT;
    }
    
    return null;
  }
  
  /**
   * Initialise les stratégies de récupération
   * @private
   */
  _initializeRecoveryStrategies() {
    // Stratégie pour les erreurs de timeout
    this.recoveryStrategies.TIMEOUT = {
      name: 'TimeoutRecovery',
      execute: async (error, context) => {
        try {
          logger.info(`Tentative de récupération pour timeout: ${context.method || 'unknown method'}`);
          
          // Si une fonction de récupération est fournie dans le contexte, l'utiliser
          if (context.recoveryFunction && typeof context.recoveryFunction === 'function') {
            // Augmenter le timeout et réessayer
            const newContext = {
              ...context,
              timeout: (context.timeout || 10000) * 2 // Doubler le timeout
            };
            
            // Réessayer avec un timeout plus long
            const result = await retryAsync(
              () => context.recoveryFunction(newContext),
              { maxRetries: 2, initialDelay: 2000, maxDelay: 10000 }
            );
            
            return { success: true, result };
          }
          
          return { success: false, error: 'Aucune fonction de récupération fournie' };
        } catch (error) {
          return { success: false, error: error.message };
        }
      }
    };
    
    // Stratégie pour les erreurs de quota
    this.recoveryStrategies.QUOTA_EXCEEDED = {
      name: 'QuotaRecovery',
      execute: async (error, context) => {
        try {
          logger.info(`Tentative de récupération pour quota dépassé: ${context.method || 'unknown method'}`);
          
          // Attendre avant de réessayer
          await new Promise(resolve => setTimeout(resolve, 60000)); // Attendre 1 minute
          
          // Si une fonction de récupération est fournie, l'utiliser
          if (context.recoveryFunction && typeof context.recoveryFunction === 'function') {
            const result = await context.recoveryFunction(context);
            return { success: true, result };
          }
          
          return { success: false, error: 'Aucune fonction de récupération fournie' };
        } catch (error) {
          return { success: false, error: error.message };
        }
      }
    };
    
    // Stratégie pour les erreurs de paramètres invalides
    this.recoveryStrategies.INVALID_PARAMETERS = {
      name: 'ParameterRecovery',
      execute: async (error, context) => {
        try {
          logger.info(`Tentative de correction de paramètres invalides: ${context.method || 'unknown method'}`);
          
          // Si des paramètres alternatifs sont fournis, les utiliser
          if (context.alternativeParams) {
            // Si une fonction de récupération est fournie, l'utiliser avec les paramètres alternatifs
            if (context.recoveryFunction && typeof context.recoveryFunction === 'function') {
              const newContext = {
                ...context,
                params: context.alternativeParams
              };
              
              const result = await context.recoveryFunction(newContext);
              return { success: true, result };
            }
          }
          
          return { success: false, error: 'Paramètres alternatifs ou fonction de récupération non fournis' };
        } catch (error) {
          return { success: false, error: error.message };
        }
      }
    };
    
    // Stratégie pour les erreurs réseau
    this.recoveryStrategies.NETWORK_ERROR = {
      name: 'NetworkRecovery',
      execute: async (error, context) => {
        try {
          logger.info(`Tentative de récupération pour erreur réseau: ${context.method || 'unknown method'}`);
          
          // Attendre avant de réessayer
          await new Promise(resolve => setTimeout(resolve, 5000)); // Attendre 5 secondes
          
          // Si une fonction de récupération est fournie, l'utiliser
          if (context.recoveryFunction && typeof context.recoveryFunction === 'function') {
            // Réessayer avec backoff exponentiel
            const result = await retryAsync(
              () => context.recoveryFunction(context),
              { maxRetries: 3, initialDelay: 2000, maxDelay: 15000 }
            );
            
            return { success: true, result };
          }
          
          return { success: false, error: 'Aucune fonction de récupération fournie' };
        } catch (error) {
          return { success: false, error: error.message };
        }
      }
    };
    
    // Stratégie par défaut
    this.recoveryStrategies.DEFAULT = {
      name: 'DefaultRecovery',
      execute: async (error, context) => {
        try {
          logger.info(`Tentative de récupération par défaut: ${context.method || 'unknown method'}`);
          
          // Si une fonction de récupération est fournie, l'utiliser
          if (context.recoveryFunction && typeof context.recoveryFunction === 'function') {
            // Réessayer une fois
            const result = await context.recoveryFunction(context);
            return { success: true, result };
          }
          
          return { success: false, error: 'Aucune fonction de récupération fournie' };
        } catch (error) {
          return { success: false, error: error.message };
        }
      }
    };
  }
  
  /**
   * Sauvegarde le journal d'erreurs sur le disque
   * @private
   */
  _saveErrorLog() {
    try {
      const filePath = path.join(this.dataDirectory, 'error-log.json');
      fs.writeFileSync(filePath, JSON.stringify({
        stats: this.recoveryStats,
        errors: this.errorLog
      }, null, 2));
      
      logger.debug(`Journal d'erreurs sauvegardé (${this.errorLog.length} entrées)`);
    } catch (error) {
      logger.error(`Erreur lors de la sauvegarde du journal d'erreurs: ${error.message}`);
    }
  }
  
  /**
   * Charge le journal d'erreurs depuis le disque
   * @private
   */
  _loadErrorLog() {
    try {
      const filePath = path.join(this.dataDirectory, 'error-log.json');
      
      if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        this.errorLog = data.errors || [];
        this.recoveryStats = data.stats || this.recoveryStats;
        
        logger.info(`Journal d'erreurs chargé (${this.errorLog.length} entrées)`);
      }
    } catch (error) {
      logger.error(`Erreur lors du chargement du journal d'erreurs: ${error.message}`);
    }
  }
  
  /**
   * Assure que le répertoire de données existe
   * @private
   */
  _ensureDirectoryExists() {
    try {
      if (!fs.existsSync(this.dataDirectory)) {
        fs.mkdirSync(this.dataDirectory, { recursive: true });
        logger.info(`Répertoire de récupération d'erreurs créé: ${this.dataDirectory}`);
      }
    } catch (error) {
      logger.error(`Erreur lors de la création du répertoire de récupération d'erreurs: ${error.message}`);
    }
  }
  
  /**
   * Récupère les statistiques de récupération
   * @returns {Object} Statistiques de récupération
   */
  getStats() {
    // Calculer le taux de succès
    const successRate = this.recoveryStats.recoveryAttempts > 0 
      ? (this.recoveryStats.successfulRecoveries / this.recoveryStats.recoveryAttempts) * 100 
      : 0;
    
    return {
      ...this.recoveryStats,
      successRate: Math.round(successRate * 100) / 100,
      errorCount: this.errorLog.length,
      recentErrors: this.errorLog.slice(0, 10).map(entry => ({
        id: entry.id,
        timestamp: entry.timestamp,
        code: entry.error.code,
        message: entry.error.message,
        recovered: entry.recovered
      }))
    };
  }
  
  /**
   * Récupère les erreurs récentes
   * @param {number} limit Nombre maximum d'erreurs à récupérer
   * @param {Object} filters Filtres à appliquer
   * @returns {Array<Object>} Liste des erreurs
   */
  getRecentErrors(limit = 50, filters = {}) {
    // Filtrer les erreurs
    let filteredErrors = [...this.errorLog];
    
    if (filters.code) {
      filteredErrors = filteredErrors.filter(entry => entry.error.code === filters.code);
    }
    
    if (filters.recovered !== undefined) {
      filteredErrors = filteredErrors.filter(entry => entry.recovered === filters.recovered);
    }
    
    if (filters.method) {
      filteredErrors = filteredErrors.filter(entry => 
        entry.error.context && entry.error.context.method === filters.method
      );
    }
    
    // Limiter le nombre d'erreurs
    return filteredErrors.slice(0, limit).map(entry => ({
      id: entry.id,
      timestamp: entry.timestamp,
      code: entry.error.code,
      message: entry.error.message,
      method: entry.error.context?.method || 'unknown',
      recovered: entry.recovered,
      recoveryMethod: entry.recoveryMethod
    }));
  }
  
  /**
   * Génère un rapport d'erreurs
   * @param {Object} options Options du rapport
   * @returns {Object} Rapport d'erreurs
   */
  generateErrorReport(options = {}) {
    // Analyser les erreurs par type
    const errorsByCode = {};
    this.errorLog.forEach(entry => {
      const code = entry.error.code;
      if (!errorsByCode[code]) {
        errorsByCode[code] = {
          count: 0,
          recovered: 0,
          examples: []
        };
      }
      
      errorsByCode[code].count++;
      
      if (entry.recovered) {
        errorsByCode[code].recovered++;
      }
      
      // Ajouter quelques exemples
      if (errorsByCode[code].examples.length < 3) {
        errorsByCode[code].examples.push({
          message: entry.error.message,
          timestamp: entry.timestamp,
          recovered: entry.recovered
        });
      }
    });
    
    // Analyser les erreurs par méthode
    const errorsByMethod = {};
    this.errorLog.forEach(entry => {
      const method = entry.error.context?.method || 'unknown';
      if (!errorsByMethod[method]) {
        errorsByMethod[method] = {
          count: 0,
          recovered: 0
        };
      }
      
      errorsByMethod[method].count++;
      
      if (entry.recovered) {
        errorsByMethod[method].recovered++;
      }
    });
    
    // Créer le rapport
    return {
      timestamp: new Date().toISOString(),
      stats: {
        ...this.recoveryStats,
        successRate: this.recoveryStats.recoveryAttempts > 0 
          ? Math.round((this.recoveryStats.successfulRecoveries / this.recoveryStats.recoveryAttempts) * 100) 
          : 0
      },
      errorsByCode,
      errorsByMethod,
      recentErrors: this.getRecentErrors(10)
    };
  }
  
  /**
   * Arrête le service de récupération d'erreurs
   */
  shutdown() {
    // Sauvegarder le journal d'erreurs
    this._saveErrorLog();
    
    logger.info('Service de récupération d\'erreurs arrêté');
  }
}

// Créer une instance singleton
const errorRecoveryService = new ErrorRecoveryService();

module.exports = errorRecoveryService;
