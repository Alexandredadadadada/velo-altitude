/**
 * Utilitaires pour la gestion et l'analyse des erreurs
 * Fournit des fonctions pour enrichir, classifier et analyser les erreurs
 */

const { logger } = require('./logger');

/**
 * Types d'erreurs connus
 * @enum {string}
 */
const ErrorTypes = {
  NETWORK: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  QUOTA: 'QUOTA_EXCEEDED',
  VALIDATION: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  SERVER: 'SERVER_ERROR',
  AUTH: 'AUTH_ERROR',
  CIRCUIT_OPEN: 'CIRCUIT_OPEN',
  UNKNOWN: 'UNKNOWN'
};

/**
 * Enrichit une erreur avec des informations contextuelles
 * @param {Error} error Erreur d'origine
 * @param {Object} context Contexte de l'erreur
 * @returns {Error} Erreur enrichie
 */
function enhanceError(error, context = {}) {
  // Créer une nouvelle erreur pour éviter de modifier l'original
  const enhancedError = new Error(error.message);
  
  // Copier les propriétés de l'erreur d'origine
  Object.getOwnPropertyNames(error).forEach(prop => {
    if (prop !== 'stack') {
      enhancedError[prop] = error[prop];
    }
  });
  
  // Conserver la stack trace originale
  enhancedError.stack = error.stack;
  
  // Ajouter un identifiant unique
  enhancedError.id = generateErrorId();
  
  // Ajouter le contexte
  enhancedError.context = context;
  
  // Ajouter un timestamp
  enhancedError.timestamp = new Date().toISOString();
  
  // Déterminer le type d'erreur si non spécifié
  if (!enhancedError.type) {
    enhancedError.type = determineErrorType(error);
  }
  
  return enhancedError;
}

/**
 * Génère un identifiant unique pour une erreur
 * @returns {string} Identifiant unique
 */
function generateErrorId() {
  return `err_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

/**
 * Détermine le type d'erreur en fonction de ses caractéristiques
 * @param {Error} error Erreur à analyser
 * @returns {string} Type d'erreur
 */
function determineErrorType(error) {
  // Vérifier si un code ou type est déjà défini
  if (error.type) return error.type;
  if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET' || error.code === 'ENOTFOUND') {
    return ErrorTypes.NETWORK;
  }
  if (error.code === 'TIMEOUT' || error.code === 'ETIMEDOUT') {
    return ErrorTypes.TIMEOUT;
  }
  if (error.code === 'CIRCUIT_OPEN') {
    return ErrorTypes.CIRCUIT_OPEN;
  }
  
  // Analyser le message d'erreur
  const message = error.message.toLowerCase();
  
  if (message.includes('timeout') || message.includes('délai')) {
    return ErrorTypes.TIMEOUT;
  } else if (message.includes('quota') || message.includes('rate limit')) {
    return ErrorTypes.QUOTA;
  } else if (message.includes('network') || message.includes('réseau') || message.includes('connection')) {
    return ErrorTypes.NETWORK;
  } else if (message.includes('invalid') || message.includes('invalide') || message.includes('validation')) {
    return ErrorTypes.VALIDATION;
  } else if (message.includes('not found') || message.includes('introuvable')) {
    return ErrorTypes.NOT_FOUND;
  } else if (message.includes('server') || message.includes('serveur')) {
    return ErrorTypes.SERVER;
  } else if (message.includes('authorization') || message.includes('authorisation') || message.includes('api key')) {
    return ErrorTypes.AUTH;
  } else {
    return ErrorTypes.UNKNOWN;
  }
}

/**
 * Crée une erreur spécifique au domaine
 * @param {string} message Message d'erreur
 * @param {string} type Type d'erreur
 * @param {Object} details Détails supplémentaires
 * @returns {Error} Erreur enrichie
 */
function createError(message, type = ErrorTypes.UNKNOWN, details = {}) {
  const error = new Error(message);
  error.type = type;
  
  // Ajouter les détails à l'erreur
  Object.keys(details).forEach(key => {
    error[key] = details[key];
  });
  
  return enhanceError(error, details.context || {});
}

/**
 * Analyse une erreur HTTP et la convertit en erreur enrichie
 * @param {Error} error Erreur HTTP (généralement d'Axios)
 * @returns {Error} Erreur enrichie
 */
function parseHttpError(error) {
  // Extraire les détails de l'erreur
  let statusCode = null;
  let errorDetails = null;
  let errorType = ErrorTypes.UNKNOWN;
  
  // Extraire le code de statut et les détails si disponibles
  if (error.response) {
    statusCode = error.response.status;
    errorDetails = error.response.data?.error || error.response.data;
    
    // Déterminer le type d'erreur en fonction du code de statut
    if (statusCode >= 400 && statusCode < 500) {
      if (statusCode === 401 || statusCode === 403) {
        errorType = ErrorTypes.AUTH;
      } else if (statusCode === 404) {
        errorType = ErrorTypes.NOT_FOUND;
      } else if (statusCode === 422 || statusCode === 400) {
        errorType = ErrorTypes.VALIDATION;
      } else if (statusCode === 429) {
        errorType = ErrorTypes.QUOTA;
      }
    } else if (statusCode >= 500) {
      errorType = ErrorTypes.SERVER;
    }
  } else if (error.request) {
    // La requête a été faite mais pas de réponse
    errorType = ErrorTypes.NETWORK;
  } else {
    // Erreur lors de la configuration de la requête
    errorType = determineErrorType(error);
  }
  
  // Créer une erreur plus informative
  const message = errorDetails?.message || error.message || 'Erreur HTTP inconnue';
  const enhancedError = createError(message, errorType, {
    statusCode,
    details: errorDetails,
    originalError: error
  });
  
  return enhancedError;
}

/**
 * Formate une erreur pour l'affichage ou la journalisation
 * @param {Error} error Erreur à formater
 * @param {boolean} includeStack Inclure la stack trace
 * @returns {Object} Erreur formatée
 */
function formatError(error, includeStack = false) {
  const formattedError = {
    id: error.id || generateErrorId(),
    message: error.message,
    type: error.type || determineErrorType(error),
    timestamp: error.timestamp || new Date().toISOString()
  };
  
  // Ajouter des propriétés supplémentaires si disponibles
  if (error.statusCode) formattedError.statusCode = error.statusCode;
  if (error.code) formattedError.code = error.code;
  if (error.context) formattedError.context = error.context;
  if (error.details) formattedError.details = error.details;
  
  // Ajouter la stack trace si demandé
  if (includeStack && error.stack) {
    formattedError.stack = error.stack;
  }
  
  return formattedError;
}

/**
 * Journalise une erreur avec le niveau approprié
 * @param {Error} error Erreur à journaliser
 */
function logError(error) {
  const formattedError = formatError(error, true);
  const errorType = error.type || determineErrorType(error);
  
  // Déterminer le niveau de journalisation en fonction du type d'erreur
  switch (errorType) {
    case ErrorTypes.NETWORK:
    case ErrorTypes.TIMEOUT:
    case ErrorTypes.QUOTA:
      logger.warn(`${errorType}: ${error.message}`, formattedError);
      break;
    case ErrorTypes.VALIDATION:
    case ErrorTypes.NOT_FOUND:
      logger.info(`${errorType}: ${error.message}`, formattedError);
      break;
    case ErrorTypes.SERVER:
    case ErrorTypes.AUTH:
    case ErrorTypes.UNKNOWN:
    default:
      logger.error(`${errorType}: ${error.message}`, formattedError);
      break;
  }
}

/**
 * Détermine si une erreur est récupérable
 * @param {Error} error Erreur à analyser
 * @returns {boolean} True si l'erreur est récupérable
 */
function isRecoverableError(error) {
  const errorType = error.type || determineErrorType(error);
  
  // Les erreurs réseau, timeout et quota sont généralement récupérables
  return [
    ErrorTypes.NETWORK,
    ErrorTypes.TIMEOUT,
    ErrorTypes.QUOTA,
    ErrorTypes.SERVER
  ].includes(errorType);
}

/**
 * Analyse une erreur et suggère une stratégie de récupération
 * @param {Error} error Erreur à analyser
 * @returns {Object} Stratégie de récupération suggérée
 */
function suggestRecoveryStrategy(error) {
  const errorType = error.type || determineErrorType(error);
  
  switch (errorType) {
    case ErrorTypes.NETWORK:
      return {
        strategy: 'retry',
        options: {
          maxRetries: 3,
          initialDelay: 1000,
          backoff: true
        }
      };
    case ErrorTypes.TIMEOUT:
      return {
        strategy: 'retry',
        options: {
          maxRetries: 2,
          initialDelay: 2000,
          timeout: (error.timeout || 5000) * 2 // Doubler le timeout
        }
      };
    case ErrorTypes.QUOTA:
      return {
        strategy: 'delay',
        options: {
          delay: 60000, // Attendre 1 minute
          priority: 'low'
        }
      };
    case ErrorTypes.SERVER:
      return {
        strategy: 'retry',
        options: {
          maxRetries: 2,
          initialDelay: 5000,
          backoff: true
        }
      };
    case ErrorTypes.VALIDATION:
      return {
        strategy: 'fallback',
        options: {
          useCache: true,
          approximateResult: true
        }
      };
    case ErrorTypes.NOT_FOUND:
      return {
        strategy: 'fallback',
        options: {
          useCache: true,
          useAlternative: true
        }
      };
    case ErrorTypes.AUTH:
      return {
        strategy: 'alert',
        options: {
          critical: true,
          requiresIntervention: true
        }
      };
    default:
      return {
        strategy: 'none',
        options: {}
      };
  }
}

module.exports = {
  ErrorTypes,
  enhanceError,
  createError,
  parseHttpError,
  formatError,
  logError,
  isRecoverableError,
  suggestRecoveryStrategy
};
