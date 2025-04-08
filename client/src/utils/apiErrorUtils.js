/**
 * Utilitaires pour la gestion des erreurs API
 * Ces fonctions aident à traiter les erreurs d'une manière cohérente dans toute l'application
 */

import notificationService from '../services/notification/notificationService';
import monitoringService from '../services/monitoring/MonitoringService';

/**
 * Normalise une erreur API en un format standard
 * @param {Error} error - L'erreur à normaliser
 * @returns {Object} Erreur normalisée avec status, message, code et détails
 */
export const normalizeApiError = (error) => {
  // Si l'erreur est déjà normalisée, la renvoyer telle quelle
  if (error && error.status && error.message) {
    return error;
  }

  // Erreur Axios avec réponse du serveur
  if (error.response) {
    const { status, data } = error.response;
    return {
      status,
      message: data.message || getDefaultErrorMessage(status),
      code: data.code || String(status),
      details: data.details || null,
      originalError: error
    };
  }

  // Erreur Axios sans réponse (requête n'a pas pu être envoyée)
  if (error.request) {
    return {
      status: 0, // 0 indique une erreur de connexion
      message: 'Impossible de se connecter au serveur. Veuillez vérifier votre connexion internet.',
      code: 'NETWORK_ERROR',
      details: null,
      originalError: error
    };
  }

  // Erreur générique
  return {
    status: 500,
    message: error.message || 'Une erreur inconnue est survenue.',
    code: 'UNKNOWN_ERROR',
    details: null,
    originalError: error
  };
};

/**
 * Retourne un message d'erreur par défaut en fonction du code d'état HTTP
 * @param {number} status - Code d'état HTTP
 * @returns {string} Message d'erreur par défaut
 */
export const getDefaultErrorMessage = (status) => {
  switch (status) {
    case 400:
      return 'La requête est incorrecte. Veuillez vérifier les données saisies.';
    case 401:
      return 'Vous n\'êtes pas authentifié. Veuillez vous connecter.';
    case 403:
      return 'Vous n\'avez pas la permission d\'accéder à cette ressource.';
    case 404:
      return 'La ressource demandée n\'a pas été trouvée.';
    case 409:
      return 'Un conflit est survenu lors de l\'opération.';
    case 422:
      return 'Les données fournies sont invalides.';
    case 429:
      return 'Trop de requêtes. Veuillez réessayer plus tard.';
    case 500:
      return 'Une erreur serveur est survenue. L\'équipe technique a été notifiée.';
    case 502:
      return 'Le serveur a rencontré une erreur temporaire. Veuillez réessayer.';
    case 503:
      return 'Le service est temporairement indisponible. Veuillez réessayer plus tard.';
    case 504:
      return 'Le serveur n\'a pas répondu à temps. Veuillez réessayer.';
    default:
      return 'Une erreur inattendue est survenue.';
  }
};

/**
 * Détermine si une erreur API mérite d'être notifiée à l'utilisateur
 * @param {Object} error - Erreur normalisée
 * @returns {boolean} True si l'erreur doit être notifiée
 */
export const shouldNotifyUser = (error) => {
  // Ne pas notifier les 401 (ils seront gérés par le système d'authentification)
  if (error.status === 401) return false;
  
  // Ne pas notifier les 404 quand on vérifie simplement l'existence d'une ressource
  if (error.status === 404 && error.details?.isExistenceCheck) return false;
  
  // Ne pas notifier certaines erreurs en fonction du contexte
  if (error.details?.silent) return false;
  
  return true;
};

/**
 * Traite une erreur API et effectue des actions adaptées
 * @param {Error} error - L'erreur d'origine
 * @param {Object} options - Options de traitement
 * @returns {Object} Erreur normalisée
 */
export const handleApiError = (error, options = {}) => {
  const {
    moduleName = 'API',
    silent = false,
    notifyUser = true,
    retry = false,
    retryCount = 0,
    maxRetries = 3,
    retryDelay = 1000,
    onRetry = null,
    context = {}
  } = options;
  
  // Normaliser l'erreur
  const normalizedError = normalizeApiError(error);
  
  // Journaliser l'erreur
  if (!silent) {
    console.error(`[${moduleName}] API Error:`, normalizedError);
    
    // Suivre l'erreur dans le service de monitoring
    monitoringService.trackError(normalizedError, {
      moduleName,
      context: {
        url: error.config?.url,
        method: error.config?.method,
        ...context
      }
    });
  }
  
  // Notifier l'utilisateur si nécessaire
  if (notifyUser && shouldNotifyUser(normalizedError)) {
    notificationService.showError(
      normalizedError.message,
      { 
        title: 'Erreur API',
        duration: 5000,
        variant: normalizedError.status >= 500 ? 'error' : 'warning'
      }
    );
  }
  
  // Gestion des nouvelles tentatives pour les erreurs de réseau ou 5xx
  if (retry && 
      retryCount < maxRetries && 
      (normalizedError.status === 0 || normalizedError.status >= 500)) {
    
    // Implémenter un backoff exponentiel pour les tentatives
    const delay = retryDelay * Math.pow(2, retryCount);
    
    console.log(`[${moduleName}] Retrying API call in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
    
    // Créer une promesse qui sera résolue après le délai
    return new Promise(resolve => {
      setTimeout(() => {
        if (onRetry) {
          resolve(onRetry(retryCount + 1, maxRetries));
        }
      }, delay);
    });
  }
  
  // Si aucune nouvelle tentative n'est prévue ou si nous avons atteint la limite
  return Promise.reject(normalizedError);
};

/**
 * Convertit un objet d'erreur de validation en messages d'erreur clairs
 * @param {Object} validationErrors - Objet contenant les erreurs de validation
 * @returns {Array} Tableau de messages d'erreur
 */
export const formatValidationErrors = (validationErrors) => {
  if (!validationErrors) return [];
  
  const messages = [];
  
  Object.entries(validationErrors).forEach(([field, errors]) => {
    if (Array.isArray(errors)) {
      errors.forEach(error => {
        messages.push(`${field}: ${error}`);
      });
    } else if (typeof errors === 'string') {
      messages.push(`${field}: ${errors}`);
    } else if (typeof errors === 'object') {
      // Gestion récursive des objets imbriqués
      const nestedErrors = formatValidationErrors(errors);
      nestedErrors.forEach(nestedError => {
        messages.push(`${field}.${nestedError}`);
      });
    }
  });
  
  return messages;
};

/**
 * Vérifie si une erreur est due à un problème de réseau
 * @param {Object} error - Erreur normalisée
 * @returns {boolean} True si c'est une erreur réseau
 */
export const isNetworkError = (error) => {
  return error.status === 0 || error.code === 'NETWORK_ERROR' || 
         error.originalError?.code === 'ECONNABORTED' || 
         error.originalError?.message?.includes('Network Error');
};

/**
 * Vérifie si une erreur est probablement temporaire et peut être réessayée
 * @param {Object} error - Erreur normalisée
 * @returns {boolean} True si l'erreur peut être réessayée
 */
export const isRetryableError = (error) => {
  return isNetworkError(error) || 
         error.status >= 500 || 
         error.status === 429 || 
         error.originalError?.code === 'ETIMEDOUT';
};

export default {
  normalizeApiError,
  handleApiError,
  getDefaultErrorMessage,
  shouldNotifyUser,
  formatValidationErrors,
  isNetworkError,
  isRetryableError
};
