/**
 * Service centralisé de gestion des erreurs API
 * Implémente des stratégies robustes sans fallback vers des données mockées
 */
import config from '../../config';
import apiCache from '../apiCache';

/**
 * Types d'erreurs API
 */
export const ApiErrorTypes = {
  NETWORK: 'NETWORK_ERROR',
  SERVER: 'SERVER_ERROR',
  AUTHENTICATION: 'AUTHENTICATION_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  RATE_LIMIT: 'RATE_LIMIT_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR',
  TIMEOUT: 'TIMEOUT_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
};

/**
 * Stratégies de fallback
 */
export const FallbackStrategy = {
  CACHE: 'CACHE',
  RETRY: 'RETRY',
  NOTIFY: 'NOTIFY',
  THROW: 'THROW'
};

class ApiErrorHandler {
  constructor() {
    this.retryQueue = new Map();
    this.maxRetries = config.api.maxRetries || 3;
    this.retryDelay = config.api.retryDelay || 1000; // ms
    this.errorLoggerEndpoint = config.api.errorLoggerEndpoint || '/api/logs/error';
  }

  /**
   * Analyse et classifie une erreur API
   * @param {Error} error - L'erreur interceptée
   * @returns {Object} - Type d'erreur et informations additionnelles
   */
  classifyError(error) {
    // Erreur réseau (offline, problèmes DNS, etc.)
    if (!navigator.onLine || error.message.includes('Network Error') || error.message.includes('Failed to fetch')) {
      return {
        type: ApiErrorTypes.NETWORK,
        retryable: true,
        message: 'Erreur de connexion réseau'
      };
    }

    // Analyser le code de statut HTTP si disponible
    if (error.response) {
      const { status } = error.response;

      if (status >= 500) {
        return {
          type: ApiErrorTypes.SERVER,
          retryable: true,
          message: `Erreur serveur (${status})`,
          status
        };
      }

      if (status === 401 || status === 403) {
        return {
          type: ApiErrorTypes.AUTHENTICATION,
          retryable: false,
          message: 'Erreur d\'authentification',
          status
        };
      }

      if (status === 400 || status === 422) {
        return {
          type: ApiErrorTypes.VALIDATION,
          retryable: false,
          message: 'Données invalides',
          status
        };
      }

      if (status === 404) {
        return {
          type: ApiErrorTypes.NOT_FOUND,
          retryable: false,
          message: 'Ressource non trouvée',
          status
        };
      }

      if (status === 429) {
        return {
          type: ApiErrorTypes.RATE_LIMIT,
          retryable: true,
          message: 'Limite de requêtes dépassée',
          status
        };
      }
    }

    // Timeout
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return {
        type: ApiErrorTypes.TIMEOUT,
        retryable: true,
        message: 'Délai d\'attente dépassé'
      };
    }

    // Erreur non classifiée
    return {
      type: ApiErrorTypes.UNKNOWN,
      retryable: true,
      message: error.message || 'Erreur inconnue'
    };
  }

  /**
   * Gère une erreur API en appliquant les stratégies appropriées
   * @param {Error} error - L'erreur interceptée
   * @param {Object} context - Contexte de la requête
   * @param {Array} fallbackStrategies - Stratégies à appliquer en ordre de priorité
   * @returns {Promise} - Résultat de la stratégie de fallback
   */
  async handleApiError(error, context, fallbackStrategies = [FallbackStrategy.CACHE, FallbackStrategy.RETRY, FallbackStrategy.NOTIFY, FallbackStrategy.THROW]) {
    const { endpoint, method, params, body } = context;
    const errorInfo = this.classifyError(error);
    
    // Journalisation de l'erreur (toujours effectuée)
    await this.logError(errorInfo, context);
    
    // Parcourir les stratégies de fallback dans l'ordre
    for (const strategy of fallbackStrategies) {
      try {
        if (strategy === FallbackStrategy.CACHE) {
          const cachedData = await this.tryGetFromCache(endpoint, params);
          if (cachedData) {
            console.log(`[ApiErrorHandler] Utilisation des données en cache pour ${endpoint}`);
            return { data: cachedData, source: 'cache' };
          }
        }
        
        if (strategy === FallbackStrategy.RETRY && errorInfo.retryable) {
          const retryResult = await this.tryRetry(endpoint, method, params, body);
          if (retryResult) {
            console.log(`[ApiErrorHandler] Retry réussi pour ${endpoint}`);
            return { data: retryResult, source: 'retry' };
          }
        }
        
        if (strategy === FallbackStrategy.NOTIFY) {
          this.notifyUser(errorInfo, context);
        }
        
        if (strategy === FallbackStrategy.THROW) {
          throw new Error(`${errorInfo.message} (${errorInfo.type})`);
        }
      } catch (strategyError) {
        console.error(`[ApiErrorHandler] Échec de la stratégie ${strategy}:`, strategyError);
        // Continuer avec la stratégie suivante
      }
    }
    
    // Si toutes les stratégies ont échoué ou ne sont pas applicables
    throw error;
  }

  /**
   * Tente de récupérer les données depuis le cache
   * @param {string} endpoint - URL de l'endpoint
   * @param {Object} params - Paramètres de la requête
   * @returns {Promise<Object|null>} - Données en cache ou null
   */
  async tryGetFromCache(endpoint, params) {
    try {
      const cacheKey = this.generateCacheKey(endpoint, params);
      return await apiCache.get(cacheKey);
    } catch (error) {
      console.warn('[ApiErrorHandler] Échec de récupération du cache:', error);
      return null;
    }
  }

  /**
   * Génère une clé de cache cohérente
   * @param {string} endpoint - URL de l'endpoint
   * @param {Object} params - Paramètres de la requête
   * @returns {string} - Clé de cache
   */
  generateCacheKey(endpoint, params) {
    const baseKey = endpoint;
    
    if (!params) {
      return baseKey;
    }
    
    const paramKeys = Object.keys(params).sort();
    const paramString = paramKeys
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    return `${baseKey}:${paramString}`;
  }

  /**
   * Tente de réessayer une requête échouée
   * @param {string} endpoint - URL de l'endpoint
   * @param {string} method - Méthode HTTP
   * @param {Object} params - Paramètres de la requête
   * @param {Object} body - Corps de la requête
   * @returns {Promise<Object|null>} - Résultat de la requête ou null
   */
  async tryRetry(endpoint, method, params, body) {
    const retryKey = this.generateCacheKey(endpoint, params);
    const retryInfo = this.retryQueue.get(retryKey) || { count: 0, lastAttempt: 0 };
    
    if (retryInfo.count >= this.maxRetries) {
      console.warn(`[ApiErrorHandler] Nombre maximum de tentatives atteint pour ${endpoint}`);
      this.retryQueue.delete(retryKey); // Réinitialiser pour les futures requêtes
      return null;
    }
    
    // Calculer le délai exponentiel
    const delay = this.retryDelay * Math.pow(2, retryInfo.count);
    
    // Attendre avant de réessayer
    await new Promise(resolve => setTimeout(resolve, delay));
    
    try {
      // Effectuer une nouvelle tentative
      const api = await import('../api').default;
      let response;
      
      if (method.toUpperCase() === 'GET') {
        response = await api.get(endpoint, { params });
      } else if (method.toUpperCase() === 'POST') {
        response = await api.post(endpoint, body, { params });
      } else if (method.toUpperCase() === 'PUT') {
        response = await api.put(endpoint, body, { params });
      } else if (method.toUpperCase() === 'DELETE') {
        response = await api.delete(endpoint, { params });
      } else {
        throw new Error(`Méthode non supportée: ${method}`);
      }
      
      this.retryQueue.delete(retryKey); // Réinitialiser après succès
      return response.data;
    } catch (error) {
      // Mettre à jour les informations de tentative
      this.retryQueue.set(retryKey, {
        count: retryInfo.count + 1,
        lastAttempt: Date.now()
      });
      
      console.warn(`[ApiErrorHandler] Échec de la tentative ${retryInfo.count + 1} pour ${endpoint}`);
      return null;
    }
  }

  /**
   * Journalise l'erreur sur le serveur
   * @param {Object} errorInfo - Informations sur l'erreur
   * @param {Object} context - Contexte de la requête
   * @returns {Promise<void>}
   */
  async logError(errorInfo, context) {
    try {
      const { endpoint, method, params } = context;
      
      // Ne pas envoyer de données sensibles au serveur
      const sanitizedParams = this.sanitizeParams(params);
      
      const logData = {
        type: errorInfo.type,
        message: errorInfo.message,
        status: errorInfo.status,
        endpoint,
        method,
        params: sanitizedParams,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        appVersion: config.version,
        connectionType: navigator.connection ? navigator.connection.effectiveType : 'unknown'
      };
      
      // Log local pour développement
      console.error('[ApiErrorHandler]', logData);
      
      // En production, envoyer au serveur de logs
      if (process.env.NODE_ENV === 'production') {
        const response = await fetch(this.errorLoggerEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(logData),
          // Envoyer même si l'utilisateur quitte la page
          keepalive: true
        });
        
        if (!response.ok) {
          console.warn('[ApiErrorHandler] Échec de l\'envoi du log d\'erreur au serveur');
        }
      }
    } catch (error) {
      console.warn('[ApiErrorHandler] Erreur lors de la journalisation:', error);
    }
  }

  /**
   * Sanitise les paramètres pour éviter de logger des données sensibles
   * @param {Object} params - Paramètres originaux
   * @returns {Object} - Paramètres sanitisés
   */
  sanitizeParams(params) {
    if (!params) return {};
    
    const sanitized = { ...params };
    const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'authorization', 'credit_card'];
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    }
    
    return sanitized;
  }

  /**
   * Notifie l'utilisateur de l'erreur
   * @param {Object} errorInfo - Informations sur l'erreur
   * @param {Object} context - Contexte de la requête
   */
  notifyUser(errorInfo, context) {
    try {
      // Obtenir le service de notification si disponible
      import('../notification/notificationService')
        .then(module => {
          const notificationService = module.default;
          
          // Messages personnalisés selon le type d'erreur
          let message;
          let level = 'error';
          
          switch (errorInfo.type) {
            case ApiErrorTypes.NETWORK:
              message = 'Connexion au serveur impossible. Vérifiez votre connexion internet.';
              break;
            case ApiErrorTypes.AUTHENTICATION:
              message = 'Session expirée. Veuillez vous reconnecter.';
              break;
            case ApiErrorTypes.SERVER:
              message = 'Le serveur a rencontré un problème. Nos équipes ont été notifiées.';
              break;
            case ApiErrorTypes.VALIDATION:
              message = 'Les données envoyées sont invalides.';
              level = 'warning';
              break;
            case ApiErrorTypes.NOT_FOUND:
              message = 'La ressource demandée n\'existe pas ou plus.';
              level = 'warning';
              break;
            case ApiErrorTypes.RATE_LIMIT:
              message = 'Trop de requêtes. Veuillez réessayer dans quelques instants.';
              level = 'warning';
              break;
            case ApiErrorTypes.TIMEOUT:
              message = 'Le serveur met trop de temps à répondre. Veuillez réessayer.';
              break;
            default:
              message = 'Une erreur est survenue. Veuillez réessayer ultérieurement.';
          }
          
          notificationService.show({
            message,
            level,
            duration: 5000,
            action: errorInfo.retryable ? 'Réessayer' : null,
            onAction: errorInfo.retryable ? () => this.triggerRetry(context) : null
          });
        })
        .catch(error => {
          console.warn('[ApiErrorHandler] Service de notification non disponible:', error);
          // Fallback sur alert en dernier recours
          if (errorInfo.type === ApiErrorTypes.AUTHENTICATION) {
            alert('Votre session a expiré. Veuillez vous reconnecter.');
          }
        });
    } catch (error) {
      console.warn('[ApiErrorHandler] Erreur lors de la notification:', error);
    }
  }

  /**
   * Déclenche une nouvelle tentative (appelé depuis les notifications)
   * @param {Object} context - Contexte de la requête
   */
  triggerRetry(context) {
    const { endpoint, method, params, body, onSuccess, onError } = context;
    
    // Réinitialiser le compteur de tentatives
    const retryKey = this.generateCacheKey(endpoint, params);
    this.retryQueue.delete(retryKey);
    
    // Effectuer une nouvelle requête
    import('../api').default.then(api => {
      api[method.toLowerCase()](endpoint, method === 'GET' ? { params } : body, method !== 'GET' ? { params } : undefined)
        .then(response => {
          if (onSuccess) onSuccess(response);
        })
        .catch(error => {
          if (onError) onError(error);
        });
    });
  }
}

export default new ApiErrorHandler();
