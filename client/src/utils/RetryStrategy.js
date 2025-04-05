/**
 * Utilitaire pour implémenter des stratégies de retry automatique pour les erreurs réseau
 * Permet de réessayer automatiquement les requêtes qui échouent en raison de problèmes réseau temporaires
 */

import { isErrorFeatureEnabled, ERROR_FEATURE_FLAGS } from './ErrorFeatureFlags';

/**
 * Types d'erreurs qui peuvent bénéficier d'un retry automatique
 */
export const RETRYABLE_ERROR_TYPES = {
  // Erreurs de timeout
  TIMEOUT: 'timeout',
  
  // Erreurs de connexion
  CONNECTION: 'connection',
  
  // Erreurs serveur temporaires (503, 504)
  SERVER_TEMPORARY: 'server_temporary',
  
  // Erreurs de rate limiting (429)
  RATE_LIMIT: 'rate_limit'
};

/**
 * Stratégies de backoff pour les retry
 */
export const BACKOFF_STRATEGIES = {
  // Délai constant entre les tentatives
  CONSTANT: 'constant',
  
  // Délai qui augmente linéairement (baseDelay * attempt)
  LINEAR: 'linear',
  
  // Délai qui augmente exponentiellement (baseDelay * 2^attempt)
  EXPONENTIAL: 'exponential',
  
  // Délai exponentiel avec un facteur aléatoire pour éviter les collisions
  EXPONENTIAL_JITTER: 'exponential_jitter'
};

/**
 * Configuration par défaut pour les retry
 */
const DEFAULT_RETRY_CONFIG = {
  // Nombre maximum de tentatives
  maxRetries: 3,
  
  // Délai de base entre les tentatives (en ms)
  baseDelay: 1000,
  
  // Stratégie de backoff
  backoffStrategy: BACKOFF_STRATEGIES.EXPONENTIAL_JITTER,
  
  // Types d'erreurs à réessayer
  retryableErrors: [
    RETRYABLE_ERROR_TYPES.TIMEOUT,
    RETRYABLE_ERROR_TYPES.CONNECTION,
    RETRYABLE_ERROR_TYPES.SERVER_TEMPORARY
  ],
  
  // Codes HTTP à réessayer
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  
  // Fonction pour déterminer si une erreur est retryable
  isRetryable: null
};

/**
 * Détermine si une erreur est retryable en fonction de sa nature
 * @param {Error} error - L'erreur à analyser
 * @param {Object} config - Configuration de retry
 * @returns {boolean} - True si l'erreur est retryable, false sinon
 */
export const isErrorRetryable = (error, config = DEFAULT_RETRY_CONFIG) => {
  // Si la fonctionnalité n'est pas activée, ne pas réessayer
  if (!isErrorFeatureEnabled(ERROR_FEATURE_FLAGS.ENABLE_AUTO_RETRY, true)) {
    return false;
  }
  
  // Si une fonction personnalisée est fournie, l'utiliser
  if (config.isRetryable && typeof config.isRetryable === 'function') {
    return config.isRetryable(error);
  }
  
  // Vérifier si c'est une erreur Axios
  if (error.isAxiosError) {
    // Vérifier le code de statut HTTP
    const status = error.response?.status;
    if (status && config.retryableStatusCodes.includes(status)) {
      return true;
    }
    
    // Vérifier si c'est une erreur de timeout
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return config.retryableErrors.includes(RETRYABLE_ERROR_TYPES.TIMEOUT);
    }
    
    // Vérifier si c'est une erreur de connexion
    if (error.code === 'ECONNREFUSED' || !error.response) {
      return config.retryableErrors.includes(RETRYABLE_ERROR_TYPES.CONNECTION);
    }
  }
  
  // Vérifier si c'est une erreur de fetch
  if (error.name === 'TypeError' && error.message.includes('NetworkError')) {
    return config.retryableErrors.includes(RETRYABLE_ERROR_TYPES.CONNECTION);
  }
  
  return false;
};

/**
 * Calcule le délai avant la prochaine tentative en fonction de la stratégie de backoff
 * @param {number} attempt - Numéro de la tentative actuelle (commence à 1)
 * @param {Object} config - Configuration de retry
 * @returns {number} - Délai en millisecondes
 */
export const calculateBackoffDelay = (attempt, config = DEFAULT_RETRY_CONFIG) => {
  const { baseDelay, backoffStrategy } = config;
  
  switch (backoffStrategy) {
    case BACKOFF_STRATEGIES.CONSTANT:
      return baseDelay;
      
    case BACKOFF_STRATEGIES.LINEAR:
      return baseDelay * attempt;
      
    case BACKOFF_STRATEGIES.EXPONENTIAL:
      return baseDelay * Math.pow(2, attempt - 1);
      
    case BACKOFF_STRATEGIES.EXPONENTIAL_JITTER:
      // Ajouter un facteur aléatoire pour éviter les collisions
      const expDelay = baseDelay * Math.pow(2, attempt - 1);
      const jitter = Math.random() * 0.5 + 0.5; // 0.5 à 1.0
      return expDelay * jitter;
      
    default:
      return baseDelay;
  }
};

/**
 * Exécute une fonction avec retry automatique en cas d'erreur
 * @param {Function} fn - Fonction à exécuter (doit retourner une Promise)
 * @param {Object} config - Configuration de retry
 * @returns {Promise<any>} - Résultat de la fonction
 */
export const executeWithRetry = async (fn, config = DEFAULT_RETRY_CONFIG) => {
  const mergedConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let attempt = 0;
  
  while (attempt <= mergedConfig.maxRetries) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      
      // Si c'est la dernière tentative ou si l'erreur n'est pas retryable, propager l'erreur
      if (attempt > mergedConfig.maxRetries || !isErrorRetryable(error, mergedConfig)) {
        throw error;
      }
      
      // Calculer le délai avant la prochaine tentative
      const delay = calculateBackoffDelay(attempt, mergedConfig);
      
      // Ajouter des informations de retry à l'erreur pour le debugging
      error.retryInfo = {
        attempt,
        maxRetries: mergedConfig.maxRetries,
        delay,
        nextAttemptAt: new Date(Date.now() + delay)
      };
      
      // Attendre avant de réessayer
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Continuer avec la prochaine tentative
    }
  }
};

/**
 * Crée une version avec retry d'une fonction asynchrone
 * @param {Function} fn - Fonction à wrapper
 * @param {Object} config - Configuration de retry
 * @returns {Function} - Fonction avec retry
 */
export const withRetry = (fn, config = DEFAULT_RETRY_CONFIG) => {
  return (...args) => executeWithRetry(() => fn(...args), config);
};
