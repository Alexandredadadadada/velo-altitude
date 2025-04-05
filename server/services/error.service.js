/**
 * Service de gestion des erreurs
 * Ce service fournit des méthodes pour créer, gérer et standardiser les erreurs dans l'application
 */

const logger = require('../config/logger');

class ErrorService {
  constructor() {
    // Types d'erreurs standardisés
    this.ERROR_TYPES = {
      VALIDATION: 'VALIDATION_ERROR',
      AUTHENTICATION: 'AUTHENTICATION_ERROR',
      AUTHORIZATION: 'AUTHORIZATION_ERROR',
      NOT_FOUND: 'NOT_FOUND_ERROR',
      SERVER: 'SERVER_ERROR',
      DATABASE: 'DATABASE_ERROR',
      NETWORK: 'NETWORK_ERROR',
      API: 'API_ERROR',
      TIMEOUT: 'TIMEOUT_ERROR',
      RATE_LIMIT: 'RATE_LIMIT_ERROR',
      TOKEN: 'TOKEN_ERROR',
      SECURITY: 'SECURITY_ERROR'
    };
    
    // Niveaux de gravité des erreurs
    this.SEVERITY_LEVELS = {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      CRITICAL: 'critical'
    };
    
    // Niveaux de journalisation par type d'erreur
    this.LOG_LEVELS = {
      [this.ERROR_TYPES.VALIDATION]: 'warn',
      [this.ERROR_TYPES.AUTHENTICATION]: 'warn',
      [this.ERROR_TYPES.AUTHORIZATION]: 'warn',
      [this.ERROR_TYPES.NOT_FOUND]: 'warn',
      [this.ERROR_TYPES.SERVER]: 'error',
      [this.ERROR_TYPES.DATABASE]: 'error',
      [this.ERROR_TYPES.NETWORK]: 'error',
      [this.ERROR_TYPES.API]: 'error',
      [this.ERROR_TYPES.TIMEOUT]: 'warn',
      [this.ERROR_TYPES.RATE_LIMIT]: 'warn',
      [this.ERROR_TYPES.TOKEN]: 'warn',
      [this.ERROR_TYPES.SECURITY]: 'error'
    };
    
    // Codes HTTP par type d'erreur
    this.HTTP_CODES = {
      [this.ERROR_TYPES.VALIDATION]: 400,
      [this.ERROR_TYPES.AUTHENTICATION]: 401,
      [this.ERROR_TYPES.AUTHORIZATION]: 403,
      [this.ERROR_TYPES.NOT_FOUND]: 404,
      [this.ERROR_TYPES.SERVER]: 500,
      [this.ERROR_TYPES.DATABASE]: 500,
      [this.ERROR_TYPES.NETWORK]: 503,
      [this.ERROR_TYPES.API]: 502,
      [this.ERROR_TYPES.TIMEOUT]: 504,
      [this.ERROR_TYPES.RATE_LIMIT]: 429,
      [this.ERROR_TYPES.TOKEN]: 401,
      [this.ERROR_TYPES.SECURITY]: 403
    };
    
    // Gravité par défaut pour chaque type d'erreur
    this.DEFAULT_SEVERITY = {
      [this.ERROR_TYPES.VALIDATION]: this.SEVERITY_LEVELS.LOW,
      [this.ERROR_TYPES.AUTHENTICATION]: this.SEVERITY_LEVELS.MEDIUM,
      [this.ERROR_TYPES.AUTHORIZATION]: this.SEVERITY_LEVELS.MEDIUM,
      [this.ERROR_TYPES.NOT_FOUND]: this.SEVERITY_LEVELS.LOW,
      [this.ERROR_TYPES.SERVER]: this.SEVERITY_LEVELS.HIGH,
      [this.ERROR_TYPES.DATABASE]: this.SEVERITY_LEVELS.HIGH,
      [this.ERROR_TYPES.NETWORK]: this.SEVERITY_LEVELS.MEDIUM,
      [this.ERROR_TYPES.API]: this.SEVERITY_LEVELS.MEDIUM,
      [this.ERROR_TYPES.TIMEOUT]: this.SEVERITY_LEVELS.MEDIUM,
      [this.ERROR_TYPES.RATE_LIMIT]: this.SEVERITY_LEVELS.MEDIUM,
      [this.ERROR_TYPES.TOKEN]: this.SEVERITY_LEVELS.HIGH,
      [this.ERROR_TYPES.SECURITY]: this.SEVERITY_LEVELS.CRITICAL
    };
    
    // Messages par défaut pour chaque type d'erreur
    this.DEFAULT_MESSAGES = {
      [this.ERROR_TYPES.VALIDATION]: 'Les données fournies sont invalides',
      [this.ERROR_TYPES.AUTHENTICATION]: 'Authentification requise',
      [this.ERROR_TYPES.AUTHORIZATION]: 'Accès non autorisé',
      [this.ERROR_TYPES.NOT_FOUND]: 'Ressource non trouvée',
      [this.ERROR_TYPES.SERVER]: 'Erreur interne du serveur',
      [this.ERROR_TYPES.DATABASE]: 'Erreur de base de données',
      [this.ERROR_TYPES.NETWORK]: 'Erreur réseau',
      [this.ERROR_TYPES.API]: 'Erreur d\'API externe',
      [this.ERROR_TYPES.TIMEOUT]: 'Délai d\'attente dépassé',
      [this.ERROR_TYPES.RATE_LIMIT]: 'Limite de taux dépassée',
      [this.ERROR_TYPES.TOKEN]: 'Erreur de token',
      [this.ERROR_TYPES.SECURITY]: 'Violation de sécurité détectée'
    };
    
    // Configuration des notifications frontend par niveau de gravité
    this.NOTIFICATION_CONFIG = {
      [this.SEVERITY_LEVELS.LOW]: {
        type: 'info',
        duration: 5000,
        position: 'bottom-right',
        dismissible: true
      },
      [this.SEVERITY_LEVELS.MEDIUM]: {
        type: 'warning',
        duration: 7000,
        position: 'bottom-right',
        dismissible: true
      },
      [this.SEVERITY_LEVELS.HIGH]: {
        type: 'error',
        duration: 10000,
        position: 'top-center',
        dismissible: true
      },
      [this.SEVERITY_LEVELS.CRITICAL]: {
        type: 'error',
        duration: 0, // Ne disparaît pas automatiquement
        position: 'top-center',
        dismissible: false, // Ne peut pas être fermé par l'utilisateur
        blocking: true // Bloque l'interface utilisateur
      }
    };
    
    // Statistiques d'erreurs
    this.errorStats = {
      total: 0,
      byType: {},
      bySeverity: {},
      recentErrors: [],
      timestamps: {},
      lastAlertTime: {}
    };
    
    // Nombre maximum d'erreurs récentes à conserver
    this.maxRecentErrors = 100;
    
    // Initialiser les compteurs d'erreurs
    Object.values(this.ERROR_TYPES).forEach(type => {
      this.errorStats.byType[type] = 0;
    });
    
    Object.values(this.SEVERITY_LEVELS).forEach(severity => {
      this.errorStats.bySeverity[severity] = 0;
    });
    
    logger.info('Service de gestion des erreurs initialisé');
  }

  /**
   * Initialise le middleware de gestion d'erreurs pour Express
   * @returns {Function} Middleware Express
   */
  getErrorMiddleware() {
    return (err, req, res, next) => {
      // Normaliser l'erreur si elle n'est pas déjà standardisée
      const standardizedError = err.standardized ? err : this.normalizeError(err);
      
      // Journaliser l'erreur
      const logLevel = this.LOG_LEVELS[standardizedError.type] || 'error';
      logger[logLevel](`[ERROR MIDDLEWARE] ${standardizedError.message}`, {
        errorId: standardizedError.id,
        path: req.path,
        method: req.method,
        ip: req.ip,
        userId: req.user ? req.user.id : 'anonymous'
      });
      
      // Préparer la réponse pour le client
      const clientResponse = {
        error: {
          id: standardizedError.id,
          type: standardizedError.type,
          message: standardizedError.userMessage,
          severity: standardizedError.severity,
          code: standardizedError.code
        }
      };
      
      // Ajouter les détails uniquement en développement ou pour les erreurs de validation
      if (process.env.NODE_ENV === 'development' || standardizedError.type === this.ERROR_TYPES.VALIDATION) {
        clientResponse.error.details = standardizedError.details;
      }
      
      // Ajouter la configuration de notification frontend
      clientResponse.error.notification = this.NOTIFICATION_CONFIG[standardizedError.severity];
      
      // Envoyer la réponse
      res.status(standardizedError.code).json(clientResponse);
    };
  }

  /**
   * Crée une erreur standardisée
   * @param {string} type - Type d'erreur (utiliser this.ERROR_TYPES)
   * @param {string} message - Message d'erreur personnalisé
   * @param {Object} details - Détails supplémentaires sur l'erreur
   * @param {Error} originalError - Erreur d'origine si disponible
   * @param {string} severity - Niveau de gravité (utiliser this.SEVERITY_LEVELS)
   * @returns {Object} Erreur standardisée
   */
  createError(type, message, details = {}, originalError = null, severity = null) {
    // Vérifier si le type d'erreur est valide
    if (!Object.values(this.ERROR_TYPES).includes(type)) {
      logger.warn(`Type d'erreur non reconnu: ${type}, utilisation du type par défaut SERVER_ERROR`);
      type = this.ERROR_TYPES.SERVER;
    }
    
    // Utiliser le message par défaut si aucun message n'est fourni
    if (!message) {
      message = this.DEFAULT_MESSAGES[type];
    }
    
    // Utiliser la gravité par défaut pour ce type d'erreur si non spécifiée
    if (!severity || !Object.values(this.SEVERITY_LEVELS).includes(severity)) {
      severity = this.DEFAULT_SEVERITY[type];
    }
    
    // Créer un identifiant unique pour cette erreur
    const errorId = `${type}-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    
    // Extraire la stack trace de l'erreur originale si disponible
    let stack = null;
    if (originalError && originalError.stack) {
      stack = originalError.stack;
    }
    
    // Enrichir les détails avec des informations sur l'environnement
    const enrichedDetails = {
      ...details,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    };
    
    // Créer l'objet d'erreur standardisé
    const standardizedError = {
      id: errorId,
      type,
      message,
      details: enrichedDetails,
      severity,
      stack,
      timestamp: new Date().toISOString(),
      code: this.HTTP_CODES[type] || 500,
      userMessage: this._getUserFriendlyMessage(type, message, severity)
    };
    
    // Journaliser l'erreur avec le niveau approprié
    const logLevel = this.LOG_LEVELS[type] || 'error';
    logger[logLevel](`[${type}] ${message}`, {
      errorId,
      details: JSON.stringify(enrichedDetails),
      severity,
      ...(originalError && { originalError: originalError.message })
    });
    
    // Mettre à jour les statistiques d'erreur
    this._updateErrorStats(type, severity);
    
    // Vérifier s'il existe déjà des erreurs similaires récentes
    const isGrouped = this.groupSimilarErrors(type, message);
    if (!isGrouped) {
      // Si l'erreur n'est pas groupée, l'ajouter aux erreurs récentes
      this.errorStats.recentErrors.push({
        id: errorId,
        type,
        message,
        severity,
        timestamp: new Date().toISOString(),
        count: 1
      });
      
      // Limiter le nombre d'erreurs récentes stockées
      if (this.errorStats.recentErrors.length > this.maxRecentErrors) {
        this.errorStats.recentErrors.shift();
      }
    }
    
    // Créer une instance d'Error pour pouvoir la lancer
    const error = new Error(message);
    error.id = errorId;
    error.type = type;
    error.details = enrichedDetails;
    error.severity = severity;
    error.code = this.HTTP_CODES[type] || 500;
    error.userMessage = standardizedError.userMessage;
    error.timestamp = standardizedError.timestamp;
    error.standardized = true;
    
    return error;
  }

  /**
   * Envoie une réponse d'erreur standardisée
   * @param {Object} res - Objet de réponse Express
   * @param {string} type - Type d'erreur (utiliser this.ERROR_TYPES)
   * @param {string} message - Message d'erreur personnalisé
   * @param {Object} details - Détails supplémentaires sur l'erreur
   * @param {Error} originalError - Erreur d'origine si disponible
   * @param {string} severity - Niveau de gravité (utiliser this.SEVERITY_LEVELS)
   */
  sendErrorResponse(res, type, message, details = {}, originalError = null, severity = null) {
    // Créer une erreur standardisée
    const error = this.createError(type, message, details, originalError, severity);
    
    // Déterminer le code HTTP à utiliser
    const httpCode = error.code || this.HTTP_CODES[type] || 500;
    
    // Préparer la réponse pour le client
    const clientResponse = {
      error: {
        id: error.id,
        type: error.type,
        message: error.userMessage, // Message adapté pour l'utilisateur
        severity: error.severity,
        code: httpCode
      }
    };
    
    // Ajouter les détails uniquement en développement ou pour les erreurs de validation
    if (process.env.NODE_ENV === 'development' || type === this.ERROR_TYPES.VALIDATION) {
      clientResponse.error.details = error.details;
    }
    
    // Ajouter la configuration de notification frontend
    clientResponse.error.notification = this.NOTIFICATION_CONFIG[error.severity];
    
    // Envoyer la réponse
    res.status(httpCode).json(clientResponse);
  }

  /**
   * Génère un message adapté pour l'utilisateur final
   * @param {string} type - Type d'erreur
   * @param {string} message - Message d'erreur technique
   * @param {string} severity - Niveau de gravité
   * @returns {string} Message adapté pour l'utilisateur
   * @private
   */
  _getUserFriendlyMessage(type, message, severity) {
    // Pour les erreurs critiques, utiliser un message générique
    if (severity === this.SEVERITY_LEVELS.CRITICAL) {
      return 'Une erreur critique est survenue. Notre équipe technique a été notifiée.';
    }
    
    // Pour les erreurs de validation, conserver le message original
    if (type === this.ERROR_TYPES.VALIDATION) {
      return message;
    }
    
    // Pour les autres types d'erreurs, utiliser des messages adaptés
    const userFriendlyMessages = {
      [this.ERROR_TYPES.AUTHENTICATION]: 'Problème d\'authentification. Veuillez vous reconnecter.',
      [this.ERROR_TYPES.AUTHORIZATION]: 'Vous n\'avez pas les droits nécessaires pour cette action.',
      [this.ERROR_TYPES.NOT_FOUND]: 'La ressource demandée n\'existe pas ou a été déplacée.',
      [this.ERROR_TYPES.SERVER]: 'Une erreur est survenue sur le serveur. Veuillez réessayer plus tard.',
      [this.ERROR_TYPES.NETWORK]: 'Problème de connexion. Veuillez vérifier votre connexion internet.',
      [this.ERROR_TYPES.API]: 'Un service externe est temporairement indisponible.',
      [this.ERROR_TYPES.DATABASE]: 'Problème d\'accès aux données. Veuillez réessayer plus tard.',
      [this.ERROR_TYPES.TIMEOUT]: 'La requête a pris trop de temps. Veuillez réessayer.',
      [this.ERROR_TYPES.RATE_LIMIT]: 'Trop de requêtes. Veuillez patienter quelques instants.'
    };
    
    return userFriendlyMessages[type] || message;
  }

  /**
   * Met à jour les statistiques d'erreurs
   * @param {string} type - Type d'erreur
   * @param {string} severity - Niveau de gravité
   * @private
   */
  _updateErrorStats(type, severity) {
    // Incrémenter le compteur global
    this.errorStats.total++;
    
    // Incrémenter le compteur par type
    if (!this.errorStats.byType[type]) {
      this.errorStats.byType[type] = 0;
    }
    this.errorStats.byType[type]++;
    
    // Incrémenter le compteur par gravité
    if (!this.errorStats.bySeverity[severity]) {
      this.errorStats.bySeverity[severity] = 0;
    }
    this.errorStats.bySeverity[severity]++;
    
    // Si le taux d'erreur est anormalement élevé, déclencher une alerte
    this._checkErrorRate(type);
  }

  /**
   * Vérifie si le taux d'erreur est anormalement élevé
   * @param {string} type - Type d'erreur
   * @private
   */
  _checkErrorRate(type) {
    const now = Date.now();
    const timeWindow = 60 * 1000; // 1 minute
    
    // Ajouter le timestamp de cette erreur
    if (!this.errorStats.timestamps[type]) {
      this.errorStats.timestamps[type] = [];
    }
    this.errorStats.timestamps[type].push(now);
    
    // Supprimer les timestamps trop anciens
    this.errorStats.timestamps[type] = this.errorStats.timestamps[type].filter(
      timestamp => now - timestamp < timeWindow
    );
    
    // Vérifier le nombre d'erreurs dans la fenêtre de temps
    const errorCount = this.errorStats.timestamps[type].length;
    
    // Si le nombre d'erreurs dépasse un seuil, déclencher une alerte
    if (errorCount >= 10) { // Plus de 10 erreurs du même type en 1 minute
      this.detectErrorSpike(type, errorCount);
    }
  }

  /**
   * Middleware de gestion globale des erreurs pour Express
   */
  errorHandler() {
    return (err, req, res, next) => {
      // Déterminer le type d'erreur
      let errorType = this.ERROR_TYPES.SERVER;
      let severity = null;
      
      if (err.name === 'ValidationError') {
        errorType = this.ERROR_TYPES.VALIDATION;
      } else if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
        errorType = this.ERROR_TYPES.AUTHENTICATION;
      } else if (err.name === 'ForbiddenError') {
        errorType = this.ERROR_TYPES.AUTHORIZATION;
      } else if (err.name === 'NotFoundError') {
        errorType = this.ERROR_TYPES.NOT_FOUND;
      } else if (err.code === 'ETIMEDOUT' || err.code === 'ESOCKETTIMEDOUT') {
        errorType = this.ERROR_TYPES.TIMEOUT;
      } else if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
        errorType = this.ERROR_TYPES.NETWORK;
      } else if (err.code === 'ECONNRESET' || err.code === 'EPIPE') {
        errorType = this.ERROR_TYPES.NETWORK;
        severity = this.SEVERITY_LEVELS.CRITICAL;
      } else if (err.code === 'EMFILE' || err.code === 'ENFILE') {
        // Erreurs de limite de fichiers ouverts
        errorType = this.ERROR_TYPES.SERVER;
        severity = this.SEVERITY_LEVELS.CRITICAL;
      }
      
      this.sendErrorResponse(
        res,
        errorType,
        err.message || this.DEFAULT_MESSAGES[errorType],
        { path: req.path, method: req.method },
        err,
        severity
      );
    };
  }

  /**
   * Crée un middleware pour capturer les erreurs asynchrones dans les routes Express
   * @param {Function} fn - Fonction de gestionnaire de route asynchrone
   * @returns {Function} Middleware avec gestion d'erreur
   */
  asyncErrorHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  /**
   * Obtient les statistiques d'erreurs
   * @returns {Object} Statistiques d'erreurs
   */
  getErrorStats() {
    return {
      ...this.errorStats,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Réinitialise les compteurs d'erreurs
   */
  resetErrorStats() {
    Object.values(this.ERROR_TYPES).forEach(type => {
      this.errorStats.byType[type] = 0;
    });
    
    Object.values(this.SEVERITY_LEVELS).forEach(level => {
      this.errorStats.bySeverity[level] = 0;
    });
    
    this.errorStats.total = 0;
    this.errorStats.recentErrors = [];
    
    logger.info('Statistiques d\'erreurs réinitialisées');
  }

  /**
   * Regroupe les erreurs similaires pour éviter la duplication
   * @param {string} errorType - Type d'erreur
   * @param {string} errorMessage - Message d'erreur
   * @returns {boolean} True si l'erreur a été regroupée, false sinon
   */
  groupSimilarErrors(errorType, errorMessage) {
    // Vérifier si une erreur similaire existe déjà dans les erreurs récentes
    const timeWindow = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();
    const similarErrors = this.errorStats.recentErrors.filter(error => {
      const errorTime = new Date(error.timestamp).getTime();
      const isRecent = (now - errorTime) < timeWindow;
      const isSameType = error.type === errorType;
      const isSimilarMessage = error.message === errorMessage;
      
      return isRecent && isSameType && isSimilarMessage;
    });
    
    if (similarErrors.length > 0) {
      // Mettre à jour le compteur de cette erreur au lieu d'en créer une nouvelle
      const existingError = similarErrors[0];
      existingError.count = (existingError.count || 1) + 1;
      existingError.lastOccurrence = new Date().toISOString();
      
      // Si le nombre d'occurrences dépasse un seuil, déclencher une alerte
      if (existingError.count >= 10) {
        this.detectErrorSpike(errorType, existingError.count);
      }
      
      return true;
    }
    
    return false;
  }

  /**
   * Détecte les pics d'erreurs et envoie des notifications
   * @param {string} errorType - Type d'erreur
   * @param {number} count - Nombre d'occurrences
   */
  detectErrorSpike(errorType, count) {
    // Vérifier si un pic d'erreurs a déjà été détecté récemment pour ce type
    const key = `spike_${errorType}`;
    const lastSpikeTime = this[key] || 0;
    const now = Date.now();
    
    // Ne pas envoyer plus d'une alerte toutes les 15 minutes pour le même type d'erreur
    if (now - lastSpikeTime < 15 * 60 * 1000) {
      // Ne pas envoyer d'alerte si une a déjà été envoyée récemment
      return;
    }
    
    // Mettre à jour le timestamp de la dernière alerte
    this[key] = now;
    
    // Créer un message d'alerte
    const alertMessage = `Pic d'erreurs détecté: ${count} erreurs de type "${errorType}" en moins d'une minute`;
    
    // Journaliser l'alerte
    logger.warn(alertMessage, {
      errorType,
      errorCount: count,
      timeWindow: '1 minute'
    });
    
    // Notifier les administrateurs (par exemple via email, Slack, etc.)
    this.notifyAdmins(alertMessage, {
      errorType,
      errorCount: count,
      recentErrors: this.errorStats.recentErrors.filter(e => e.type === errorType).slice(0, 5)
    });
  }

  /**
   * Notifie les administrateurs d'un problème critique
   * @param {string} message - Message d'alerte
   * @param {Object} details - Détails supplémentaires
   */
  notifyAdmins(message, details = {}) {
    // En développement, simplement journaliser
    if (process.env.NODE_ENV === 'development') {
      logger.info(`[ADMIN NOTIFICATION] ${message}`, details);
      return;
    }
    
    // En production, envoyer une notification réelle
    try {
      // Ici, on pourrait implémenter l'envoi d'email, Slack, SMS, etc.
      // Pour l'instant, on se contente de journaliser
      logger.info(`[ADMIN NOTIFICATION] ${message}`, details);
      
      // Exemple d'implémentation pour envoyer un email (à décommenter et configurer)
      /*
      const emailService = require('../services/email.service').getInstance();
      emailService.sendEmail({
        to: process.env.ADMIN_EMAIL || 'admin@grand-est-cyclisme.fr',
        subject: `[ALERTE] ${message}`,
        text: `Une alerte a été détectée sur le serveur:
        
        ${message}
        
        Détails: ${JSON.stringify(details, null, 2)}
        
        Date: ${new Date().toISOString()}
        Environnement: ${process.env.NODE_ENV}
        
        Cette notification a été générée automatiquement par le système de gestion d'erreurs.
        `
      });
      */
    } catch (error) {
      // En cas d'erreur lors de l'envoi de la notification, journaliser
      logger.error('Erreur lors de l\'envoi de la notification aux administrateurs', {
        originalMessage: message,
        error: error.message
      });
    }
  }

  /**
   * Regroupe les erreurs similaires pour éviter la duplication
   * @param {string} type - Type d'erreur
   * @param {string} message - Message d'erreur
   * @returns {boolean} True si l'erreur a été regroupée
   */
  groupSimilarErrors(type, message) {
    const now = Date.now();
    const timeWindow = 5 * 60 * 1000; // 5 minutes
    
    // Rechercher une erreur similaire récente
    const similarErrorIndex = this.errorStats.recentErrors.findIndex(error => {
      // Vérifier si l'erreur est du même type et a un message similaire
      const isSimilarType = error.type === type;
      const isSimilarMessage = this._calculateSimilarity(error.message, message) > 0.8; // 80% de similarité
      const isRecent = now - new Date(error.timestamp).getTime() < timeWindow;
      
      return isSimilarType && isSimilarMessage && isRecent;
    });
    
    if (similarErrorIndex !== -1) {
      // Incrémenter le compteur pour cette erreur
      if (!this.errorStats.recentErrors[similarErrorIndex].count) {
        this.errorStats.recentErrors[similarErrorIndex].count = 1;
      }
      this.errorStats.recentErrors[similarErrorIndex].count++;
      
      // Mettre à jour le timestamp
      this.errorStats.recentErrors[similarErrorIndex].timestamp = new Date().toISOString();
      
      return true;
    }
    
    return false;
  }

  /**
   * Calcule la similarité entre deux chaînes de caractères
   * @param {string} str1 - Première chaîne
   * @param {string} str2 - Deuxième chaîne
   * @returns {number} Score de similarité entre 0 et 1
   * @private
   */
  _calculateSimilarity(str1, str2) {
    // Méthode simple basée sur la distance de Levenshtein
    if (str1 === str2) return 1.0;
    if (!str1 || !str2) return 0.0;
    
    // Normaliser les chaînes
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    // Calculer la distance de Levenshtein
    const len1 = s1.length;
    const len2 = s2.length;
    const maxDist = Math.max(len1, len2);
    
    // Utiliser une implémentation simple de la distance de Levenshtein
    const levenshteinDistance = (a, b) => {
      const matrix = Array(a.length + 1).fill().map(() => Array(b.length + 1).fill(0));
      
      for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
      for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
      
      for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
          const cost = a[i - 1] === b[j - 1] ? 0 : 1;
          matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1,      // deletion
            matrix[i][j - 1] + 1,      // insertion
            matrix[i - 1][j - 1] + cost // substitution
          );
        }
      }
      
      return matrix[a.length][b.length];
    };
    
    const distance = levenshteinDistance(s1, s2);
    return 1 - (distance / maxDist);
  }

  /**
   * Obtient les statistiques d'erreurs
   * @returns {Object} Statistiques d'erreurs
   */
  getErrorStats() {
    return {
      total: this.errorStats.total,
      byType: this.errorStats.byType,
      bySeverity: this.errorStats.bySeverity,
      recentErrors: this.errorStats.recentErrors.slice(0, 10) // Limiter aux 10 plus récentes
    };
  }

  /**
   * Réinitialise les statistiques d'erreurs
   */
  resetErrorStats() {
    this.errorStats = {
      total: 0,
      byType: {},
      bySeverity: {},
      recentErrors: [],
      timestamps: {},
      lastAlertTime: {}
    };
  }

  /**
   * Convertit une erreur en format standardisé
   * @param {Error} error - Erreur à convertir
   * @returns {Object} Erreur standardisée
   */
  normalizeError(error) {
    // Si l'erreur est déjà standardisée, la retourner telle quelle
    if (error.standardized) {
      return error;
    }
    
    // Déterminer le type d'erreur en fonction du message ou du code
    let errorType = this.ERROR_TYPES.SERVER;
    
    if (error.name === 'ValidationError') {
      errorType = this.ERROR_TYPES.VALIDATION;
    } else if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      errorType = this.ERROR_TYPES.DATABASE;
    } else if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      errorType = this.ERROR_TYPES.AUTHENTICATION;
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      errorType = this.ERROR_TYPES.NETWORK;
    } else if (error.code === 'ETIMEDOUT') {
      errorType = this.ERROR_TYPES.TIMEOUT;
    }
    
    // Créer une erreur standardisée
    return this.createError(
      errorType,
      error.message,
      { originalName: error.name, originalCode: error.code },
      error
    );
  }
}

// Exporter une instance singleton
const errorService = new ErrorService();
module.exports = errorService;
