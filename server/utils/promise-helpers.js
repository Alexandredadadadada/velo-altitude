/**
 * Utilitaires pour la gestion avancée des promesses
 * Fournit des fonctions pour améliorer la robustesse des opérations asynchrones
 */

const { logger } = require('./logger');

/**
 * Crée une promesse avec un délai d'expiration
 * @param {Promise<any>} promise Promesse à surveiller
 * @param {number} timeoutMs Délai d'expiration en millisecondes
 * @param {string} errorMessage Message d'erreur en cas d'expiration
 * @returns {Promise<any>} Promesse avec délai d'expiration
 */
const promiseWithTimeout = (promise, timeoutMs, errorMessage = 'Opération expirée') => {
  // Créer une promesse qui se rejette après le délai d'expiration
  const timeoutPromise = new Promise((_, reject) => {
    const timeoutId = setTimeout(() => {
      const error = new Error(errorMessage);
      error.code = 'TIMEOUT';
      reject(error);
    }, timeoutMs);
    
    // S'assurer que le timeout est nettoyé si la promesse est résolue avant l'expiration
    promise.finally(() => clearTimeout(timeoutId));
  });
  
  // Utiliser Promise.race pour retourner celle qui se résout/rejette en premier
  return Promise.race([promise, timeoutPromise]);
};

/**
 * Exécute une fonction asynchrone avec retry automatique
 * @param {Function} asyncFn Fonction asynchrone à exécuter
 * @param {Object} options Options de configuration
 * @param {number} options.maxRetries Nombre maximum de tentatives
 * @param {number} options.initialDelay Délai initial avant retry (ms)
 * @param {number} options.maxDelay Délai maximum avant retry (ms)
 * @param {Function} options.shouldRetry Fonction déterminant si une erreur justifie un retry
 * @returns {Promise<any>} Résultat de la fonction
 */
const retryAsync = async (asyncFn, options = {}) => {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    shouldRetry = (error) => {
      // Par défaut, réessayer pour les erreurs de réseau et les erreurs 5xx
      const isNetworkError = !error.response && error.code !== 'TIMEOUT';
      const isServerError = error.response && error.response.status >= 500 && error.response.status < 600;
      const isRateLimitError = error.response && error.response.status === 429;
      
      return isNetworkError || isServerError || isRateLimitError;
    }
  } = options;
  
  let lastError;
  let delay = initialDelay;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        logger.debug(`Tentative #${attempt} après un délai de ${delay}ms`);
      }
      
      return await asyncFn(attempt);
    } catch (error) {
      lastError = error;
      
      // Si c'est la dernière tentative ou si l'erreur ne justifie pas un retry, échouer
      if (attempt >= maxRetries || !shouldRetry(error)) {
        break;
      }
      
      // Attendre avec backoff exponentiel
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Augmenter le délai pour la prochaine tentative (backoff exponentiel)
      delay = Math.min(delay * 2, maxDelay);
    }
  }
  
  // Si toutes les tentatives ont échoué, rejeter avec la dernière erreur
  throw lastError;
};

/**
 * Exécute des promesses en parallèle avec limitation de concurrence
 * @param {Array<Function>} tasks Fonctions asynchrones à exécuter
 * @param {number} concurrency Nombre maximum de tâches concurrentes
 * @returns {Promise<Array<any>>} Résultats des tâches dans l'ordre d'origine
 */
const parallelLimit = async (tasks, concurrency = 5) => {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return [];
  }
  
  const results = new Array(tasks.length);
  const executing = new Set();
  let index = 0;
  
  const enqueue = async () => {
    // Si toutes les tâches sont terminées ou en cours d'exécution, sortir
    if (index >= tasks.length) {
      return;
    }
    
    // Récupérer le prochain index de tâche à exécuter
    const currentIndex = index++;
    const task = tasks[currentIndex];
    
    // Ajouter la tâche à l'ensemble des tâches en cours d'exécution
    const execution = Promise.resolve().then(() => task())
      .then(result => {
        // Stocker le résultat et retirer la tâche de l'ensemble
        results[currentIndex] = { status: 'fulfilled', value: result };
        executing.delete(execution);
        
        // Lancer la prochaine tâche
        return enqueue();
      })
      .catch(error => {
        // Stocker l'erreur et retirer la tâche de l'ensemble
        results[currentIndex] = { status: 'rejected', reason: error };
        executing.delete(execution);
        
        // Lancer la prochaine tâche
        return enqueue();
      });
    
    // Ajouter l'exécution à l'ensemble
    executing.add(execution);
    
    // Si le nombre maximum de tâches concurrentes n'est pas atteint, lancer une autre tâche
    if (executing.size < concurrency) {
      await Promise.resolve();
      return enqueue();
    }
    
    // Attendre qu'une tâche se termine avant d'en démarrer une nouvelle
    await Promise.race(executing);
  };
  
  // Démarrer le processus
  await enqueue();
  
  // Attendre que toutes les tâches soient terminées
  if (executing.size > 0) {
    await Promise.all(executing);
  }
  
  // Convertir les résultats en tableau de valeurs/erreurs
  return results.map(result => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      throw result.reason;
    }
  });
};

/**
 * Version simplifiée de Promise.allSettled
 * Exécute toutes les promesses et retourne leurs états et résultats/erreurs
 * @param {Array<Promise<any>>} promises Promesses à exécuter
 * @returns {Promise<Array<{status: string, value?: any, reason?: Error}>>} Résultats
 */
const allSettledPolyfill = async (promises) => {
  return Promise.all(
    promises.map(promise => 
      promise
        .then(value => ({ status: 'fulfilled', value }))
        .catch(reason => ({ status: 'rejected', reason }))
    )
  );
};

/**
 * Exécute une fonction avec une stratégie de circuit breaker
 * Permet d'éviter les appels répétés à un service défaillant
 * @param {Function} fn Fonction à exécuter
 * @param {Object} options Options de configuration
 * @param {number} options.failureThreshold Nombre d'échecs avant ouverture du circuit
 * @param {number} options.resetTimeout Délai avant tentative de fermeture du circuit (ms)
 * @param {Function} options.fallbackFn Fonction de repli à utiliser quand le circuit est ouvert
 * @returns {Function} Fonction encapsulée avec circuit breaker
 */
const circuitBreaker = (fn, options = {}) => {
  const {
    failureThreshold = 5,
    resetTimeout = 30000,
    fallbackFn = null
  } = options;
  
  // État du circuit breaker
  const state = {
    failures: 0,
    isOpen: false,
    lastFailureTime: null
  };
  
  // Fonction encapsulée
  return async (...args) => {
    // Si le circuit est ouvert, vérifier si le délai de réinitialisation est écoulé
    if (state.isOpen) {
      const now = Date.now();
      const timeSinceLastFailure = now - state.lastFailureTime;
      
      if (timeSinceLastFailure > resetTimeout) {
        // Tenter de fermer le circuit (half-open state)
        logger.info('Circuit breaker: tentative de fermeture du circuit');
        state.isOpen = false;
      } else {
        // Le circuit est toujours ouvert, utiliser la fonction de repli si disponible
        if (fallbackFn) {
          logger.debug('Circuit breaker: utilisation de la fonction de repli');
          return fallbackFn(...args);
        }
        
        // Sinon, rejeter avec une erreur spécifique
        const error = new Error('Circuit breaker ouvert: service temporairement indisponible');
        error.code = 'CIRCUIT_OPEN';
        throw error;
      }
    }
    
    // Le circuit est fermé ou semi-ouvert, tenter d'exécuter la fonction
    try {
      const result = await fn(...args);
      
      // Réinitialiser le compteur d'échecs en cas de succès
      if (state.failures > 0) {
        state.failures = 0;
        logger.debug('Circuit breaker: compteur d\'échecs réinitialisé après succès');
      }
      
      return result;
    } catch (error) {
      // Incrémenter le compteur d'échecs
      state.failures++;
      state.lastFailureTime = Date.now();
      
      logger.warn(`Circuit breaker: échec #${state.failures}/${failureThreshold}`);
      
      // Si le seuil d'échecs est atteint, ouvrir le circuit
      if (state.failures >= failureThreshold) {
        state.isOpen = true;
        logger.error(`Circuit breaker: circuit ouvert après ${failureThreshold} échecs`);
      }
      
      // Rejeter avec l'erreur d'origine
      throw error;
    }
  };
};

/**
 * Exécute une fonction avec une stratégie de bulkhead (cloison)
 * Limite le nombre d'exécutions concurrentes pour isoler les défaillances
 * @param {Function} fn Fonction à exécuter
 * @param {Object} options Options de configuration
 * @param {number} options.concurrentLimit Nombre maximum d'exécutions concurrentes
 * @param {number} options.queueLimit Taille maximale de la file d'attente
 * @returns {Function} Fonction encapsulée avec bulkhead
 */
const bulkhead = (fn, options = {}) => {
  const {
    concurrentLimit = 10,
    queueLimit = 100
  } = options;
  
  // État du bulkhead
  const state = {
    executing: 0,
    queue: []
  };
  
  // Fonction encapsulée
  return async (...args) => {
    // Si le nombre d'exécutions concurrentes est déjà au maximum
    if (state.executing >= concurrentLimit) {
      // Si la file d'attente est pleine, rejeter
      if (state.queue.length >= queueLimit) {
        const error = new Error('Bulkhead: file d\'attente pleine');
        error.code = 'BULKHEAD_FULL';
        throw error;
      }
      
      // Sinon, mettre en file d'attente
      return new Promise((resolve, reject) => {
        state.queue.push({ args, resolve, reject });
        logger.debug(`Bulkhead: requête mise en file d'attente (${state.queue.length}/${queueLimit})`);
      });
    }
    
    // Incrémenter le compteur d'exécutions
    state.executing++;
    
    try {
      // Exécuter la fonction
      const result = await fn(...args);
      return result;
    } catch (error) {
      throw error;
    } finally {
      // Décrémenter le compteur d'exécutions
      state.executing--;
      
      // Traiter la prochaine requête en file d'attente si disponible
      if (state.queue.length > 0) {
        const next = state.queue.shift();
        
        // Exécuter de manière asynchrone pour éviter les erreurs de pile d'appels
        Promise.resolve().then(() => {
          bulkhead(fn, options)(...next.args)
            .then(next.resolve)
            .catch(next.reject);
        });
      }
    }
  };
};

/**
 * Exécute une fonction avec une stratégie de cache
 * Mémorise les résultats des appels précédents pour éviter les appels redondants
 * @param {Function} fn Fonction à exécuter
 * @param {Object} options Options de configuration
 * @param {Function} options.keyGenerator Fonction générant une clé de cache à partir des arguments
 * @param {number} options.ttl Durée de vie des entrées en cache (ms)
 * @param {number} options.maxSize Taille maximale du cache (nombre d'entrées)
 * @returns {Function} Fonction encapsulée avec cache
 */
const memoize = (fn, options = {}) => {
  const {
    keyGenerator = (...args) => JSON.stringify(args),
    ttl = 60000,
    maxSize = 100
  } = options;
  
  // Cache simple avec LRU (Least Recently Used)
  const cache = new Map();
  const keyTimestamps = new Map();
  
  // Fonction encapsulée
  return async (...args) => {
    // Générer la clé de cache
    const cacheKey = keyGenerator(...args);
    
    // Nettoyer les entrées expirées
    const now = Date.now();
    for (const [key, timestamp] of keyTimestamps.entries()) {
      if (now - timestamp > ttl) {
        cache.delete(key);
        keyTimestamps.delete(key);
      }
    }
    
    // Vérifier si le résultat est en cache
    if (cache.has(cacheKey)) {
      // Mettre à jour le timestamp pour l'algorithme LRU
      keyTimestamps.set(cacheKey, now);
      
      return cache.get(cacheKey);
    }
    
    // Exécuter la fonction
    const result = await fn(...args);
    
    // Stocker le résultat en cache
    cache.set(cacheKey, result);
    keyTimestamps.set(cacheKey, now);
    
    // Si le cache dépasse la taille maximale, supprimer l'entrée la moins récemment utilisée
    if (cache.size > maxSize) {
      let oldestKey = null;
      let oldestTimestamp = Infinity;
      
      for (const [key, timestamp] of keyTimestamps.entries()) {
        if (timestamp < oldestTimestamp) {
          oldestKey = key;
          oldestTimestamp = timestamp;
        }
      }
      
      if (oldestKey) {
        cache.delete(oldestKey);
        keyTimestamps.delete(oldestKey);
      }
    }
    
    return result;
  };
};

/**
 * Exécute une fonction avec une stratégie de timeout dynamique
 * Ajuste automatiquement le timeout en fonction des performances observées
 * @param {Function} fn Fonction à exécuter
 * @param {Object} options Options de configuration
 * @param {number} options.initialTimeout Timeout initial (ms)
 * @param {number} options.minTimeout Timeout minimum (ms)
 * @param {number} options.maxTimeout Timeout maximum (ms)
 * @param {number} options.percentile Percentile pour l'ajustement (0-1)
 * @returns {Function} Fonction encapsulée avec timeout dynamique
 */
const adaptiveTimeout = (fn, options = {}) => {
  const {
    initialTimeout = 5000,
    minTimeout = 1000,
    maxTimeout = 30000,
    percentile = 0.95
  } = options;
  
  // État pour le calcul du timeout adaptatif
  const state = {
    timeout: initialTimeout,
    responseTimes: [],
    maxSamples: 100
  };
  
  // Fonction encapsulée
  return async (...args) => {
    // Créer une promesse avec le timeout actuel
    const startTime = Date.now();
    
    try {
      const result = await promiseWithTimeout(
        fn(...args),
        state.timeout,
        `Opération expirée après ${state.timeout}ms`
      );
      
      // Calculer le temps de réponse
      const responseTime = Date.now() - startTime;
      
      // Mettre à jour l'historique des temps de réponse
      state.responseTimes.push(responseTime);
      
      // Limiter la taille de l'historique
      if (state.responseTimes.length > state.maxSamples) {
        state.responseTimes.shift();
      }
      
      // Ajuster le timeout en fonction des temps de réponse observés
      if (state.responseTimes.length >= 10) {
        // Trier les temps de réponse
        const sortedTimes = [...state.responseTimes].sort((a, b) => a - b);
        
        // Calculer le temps au percentile spécifié
        const index = Math.floor(sortedTimes.length * percentile);
        const percentileTime = sortedTimes[index];
        
        // Ajouter une marge de sécurité (50%)
        const newTimeout = Math.min(maxTimeout, Math.max(minTimeout, percentileTime * 1.5));
        
        // Mettre à jour le timeout de manière progressive (moyenne pondérée)
        state.timeout = Math.round(0.8 * state.timeout + 0.2 * newTimeout);
        
        logger.debug(`Timeout adaptatif ajusté à ${state.timeout}ms (temps de réponse P${percentile*100}: ${percentileTime}ms)`);
      }
      
      return result;
    } catch (error) {
      // Si l'erreur est un timeout, ajuster le timeout pour la prochaine fois
      if (error.code === 'TIMEOUT') {
        // Augmenter légèrement le timeout
        state.timeout = Math.min(maxTimeout, state.timeout * 1.2);
        logger.debug(`Timeout adaptatif augmenté à ${state.timeout}ms après expiration`);
      }
      
      throw error;
    }
  };
};

module.exports = {
  promiseWithTimeout,
  retryAsync,
  parallelLimit,
  allSettled: Promise.allSettled || allSettledPolyfill,
  circuitBreaker,
  bulkhead,
  memoize,
  adaptiveTimeout
};
