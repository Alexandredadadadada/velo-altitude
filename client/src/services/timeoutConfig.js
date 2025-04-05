/**
 * Service de configuration des timeouts et opérations asynchrones
 * Remplace les timeouts codés en dur par des valeurs configurables
 * et implémente des stratégies de retry avancées
 */
import featureFlagsService from './featureFlags';

// Configuration par défaut des timeouts (en millisecondes)
const DEFAULT_TIMEOUT_CONFIG = {
  // Timeouts pour les opérations réseau
  api: {
    standard: 10000,        // 10 secondes pour les requêtes API standard
    long: 30000,            // 30 secondes pour les opérations plus longues
    download: 60000,        // 60 secondes pour les téléchargements
    upload: 120000          // 120 secondes pour les uploads
  },
  
  // Timeouts pour les opérations UI
  ui: {
    toast: 3000,            // 3 secondes pour les notifications toast
    autoClose: 5000,        // 5 secondes pour la fermeture automatique des dialogues
    animation: 300,         // 300ms pour les animations UI
    debounce: 300,          // 300ms pour le debounce des entrées utilisateur
    throttle: 100           // 100ms pour le throttle des événements fréquents
  },
  
  // Timeouts pour les fonctionnalités spécifiques
  features: {
    nutrition: {
      calculation: 8000,    // 8 secondes pour les calculs nutritionnels
      synchronization: 15000 // 15 secondes pour synchroniser le journal nutritionnel
    },
    training: {
      planGeneration: 20000, // 20 secondes pour générer un plan d'entraînement
      routeCalculation: 30000 // 30 secondes pour calculer un itinéraire
    },
    visualization3D: {
      load: 25000,          // 25 secondes pour charger une visualisation 3D
      render: 5000          // 5 secondes pour le rendu initial
    },
    weatherData: {
      forecast: 12000,      // 12 secondes pour obtenir des prévisions météo
      historical: 20000     // 20 secondes pour des données historiques
    }
  },
  
  // Configurations pour les retries
  retry: {
    maxAttempts: 3,         // Nombre maximum de tentatives
    baseDelay: 1000,        // Délai initial entre les tentatives (1 seconde)
    maxDelay: 15000,        // Délai maximum entre les tentatives (15 secondes)
    factor: 2               // Facteur pour le backoff exponentiel
  }
};

/**
 * Classe principale du service de timeout configurable
 */
class TimeoutConfigService {
  constructor() {
    this.config = { ...DEFAULT_TIMEOUT_CONFIG };
    this.activeTimeouts = new Map();
    this.activeIntervals = new Map();
    this.pendingOperations = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialise le service avec les configurations personnalisées
   * @param {Object} customConfig Configuration personnalisée à fusionner
   */
  initialize(customConfig = {}) {
    if (this.isInitialized) return;
    
    try {
      // Charger depuis localStorage si disponible
      const storedConfig = localStorage.getItem('timeout_config');
      
      if (storedConfig) {
        try {
          const parsedConfig = JSON.parse(storedConfig);
          this.config = this.mergeConfigs(this.config, parsedConfig);
        } catch (error) {
          console.error('Erreur lors du parsing de la configuration des timeouts:', error);
        }
      }
      
      // Appliquer les configurations personnalisées
      if (customConfig && Object.keys(customConfig).length > 0) {
        this.config = this.mergeConfigs(this.config, customConfig);
      }
      
      this.isInitialized = true;
      console.info('Service de configuration des timeouts initialisé');
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du service de timeouts:', error);
      // Fallback à la configuration par défaut
      this.config = { ...DEFAULT_TIMEOUT_CONFIG };
      this.isInitialized = true;
    }
  }

  /**
   * Fusionne deux objets de configuration de manière récursive
   * @param {Object} baseConfig Configuration de base
   * @param {Object} overrideConfig Configuration à appliquer
   * @returns {Object} Configuration fusionnée
   */
  mergeConfigs(baseConfig, overrideConfig) {
    const result = { ...baseConfig };
    
    for (const [key, value] of Object.entries(overrideConfig)) {
      if (
        typeof value === 'object' && 
        value !== null && 
        !Array.isArray(value) &&
        typeof baseConfig[key] === 'object'
      ) {
        result[key] = this.mergeConfigs(baseConfig[key], value);
      } else {
        result[key] = value;
      }
    }
    
    return result;
  }

  /**
   * Récupère une valeur de timeout depuis la configuration
   * @param {string} path Chemin de la configuration (ex: 'api.standard')
   * @param {number} defaultValue Valeur par défaut si le chemin n'existe pas
   * @returns {number} Valeur du timeout
   */
  getTimeout(path, defaultValue = 10000) {
    if (!this.isInitialized) {
      this.initialize();
    }
    
    const keys = path.split('.');
    let value = this.config;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return defaultValue;
      }
    }
    
    return typeof value === 'number' ? value : defaultValue;
  }

  /**
   * Met à jour une valeur de timeout dans la configuration
   * @param {string} path Chemin de la configuration (ex: 'api.standard')
   * @param {number} value Nouvelle valeur pour le timeout
   * @param {boolean} persist Si true, sauvegarde la configuration dans localStorage
   */
  setTimeout(path, value, persist = true) {
    if (!this.isInitialized) {
      this.initialize();
    }
    
    if (typeof value !== 'number' || value < 0) {
      console.error('Valeur de timeout invalide:', value);
      return;
    }
    
    const keys = path.split('.');
    let target = this.config;
    
    // Naviguer à travers l'objet config pour trouver le bon niveau
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      
      if (!(key in target)) {
        target[key] = {};
      }
      
      target = target[key];
    }
    
    // Définir la valeur finale
    const lastKey = keys[keys.length - 1];
    target[lastKey] = value;
    
    // Persister si demandé
    if (persist) {
      localStorage.setItem('timeout_config', JSON.stringify(this.config));
    }
  }

  /**
   * Crée un timeout avec suivi
   * @param {Function} callback Fonction à exécuter
   * @param {number} delay Délai en millisecondes
   * @param {string} id Identifiant optionnel du timeout
   * @returns {string} Identifiant du timeout
   */
  setTimeout(callback, delay, id = null) {
    if (!this.isInitialized) {
      this.initialize();
    }
    
    // Générer un ID unique si non fourni
    const timeoutId = id || `timeout_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Créer le timeout
    const handle = setTimeout(() => {
      this.activeTimeouts.delete(timeoutId);
      callback();
    }, delay);
    
    // Enregistrer le timeout
    this.activeTimeouts.set(timeoutId, {
      handle,
      created: Date.now(),
      delay,
      expires: Date.now() + delay
    });
    
    return timeoutId;
  }

  /**
   * Crée un interval avec suivi
   * @param {Function} callback Fonction à exécuter
   * @param {number} delay Délai en millisecondes
   * @param {string} id Identifiant optionnel de l'interval
   * @returns {string} Identifiant de l'interval
   */
  setInterval(callback, delay, id = null) {
    if (!this.isInitialized) {
      this.initialize();
    }
    
    // Générer un ID unique si non fourni
    const intervalId = id || `interval_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Créer l'interval
    const handle = setInterval(callback, delay);
    
    // Enregistrer l'interval
    this.activeIntervals.set(intervalId, {
      handle,
      created: Date.now(),
      delay
    });
    
    return intervalId;
  }

  /**
   * Annule un timeout par son identifiant
   * @param {string} timeoutId Identifiant du timeout
   * @returns {boolean} True si le timeout a été annulé
   */
  clearTimeout(timeoutId) {
    if (this.activeTimeouts.has(timeoutId)) {
      const { handle } = this.activeTimeouts.get(timeoutId);
      clearTimeout(handle);
      this.activeTimeouts.delete(timeoutId);
      return true;
    }
    return false;
  }

  /**
   * Annule un interval par son identifiant
   * @param {string} intervalId Identifiant de l'interval
   * @returns {boolean} True si l'interval a été annulé
   */
  clearInterval(intervalId) {
    if (this.activeIntervals.has(intervalId)) {
      const { handle } = this.activeIntervals.get(intervalId);
      clearInterval(handle);
      this.activeIntervals.delete(intervalId);
      return true;
    }
    return false;
  }

  /**
   * Exécute une fonction avec un timeout configurable
   * @param {Function} fn Fonction à exécuter (Promise)
   * @param {string} timeoutPath Chemin de la configuration du timeout
   * @param {Object} options Options supplémentaires
   * @returns {Promise} Résultat de la fonction ou rejet en cas de timeout
   */
  async withTimeout(fn, timeoutPath, options = {}) {
    if (!this.isInitialized) {
      this.initialize();
    }
    
    const {
      defaultTimeout = 10000,
      onTimeout = null,
      id = null,
      abortable = false
    } = options;
    
    // Récupérer la valeur de timeout
    const timeout = this.getTimeout(timeoutPath, defaultTimeout);
    
    // Générer un ID pour cette opération
    const operationId = id || `operation_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Créer un AbortController pour pouvoir annuler l'opération si nécessaire
    const controller = abortable ? new AbortController() : null;
    const signal = controller ? controller.signal : null;
    
    // Enregistrer l'opération
    this.pendingOperations.set(operationId, {
      id: operationId,
      started: Date.now(),
      timeout,
      controller,
      timeoutPath
    });
    
    return new Promise((resolve, reject) => {
      // Créer le timeout
      const timeoutId = this.setTimeout(() => {
        // Nettoyer
        this.pendingOperations.delete(operationId);
        
        // Annuler l'opération si possible
        if (controller) {
          controller.abort();
        }
        
        // Callback de timeout personnalisé
        if (onTimeout) {
          onTimeout(operationId, timeout);
        }
        
        reject(new Error(`Opération ${operationId} expirée après ${timeout}ms`));
      }, timeout, `timeout_for_${operationId}`);
      
      // Exécuter la fonction
      Promise.resolve()
        .then(() => fn(signal))
        .then(result => {
          // Succès, nettoyer
          this.clearTimeout(timeoutId);
          this.pendingOperations.delete(operationId);
          resolve(result);
        })
        .catch(error => {
          // Erreur, nettoyer
          this.clearTimeout(timeoutId);
          this.pendingOperations.delete(operationId);
          reject(error);
        });
    });
  }

  /**
   * Exécute une fonction avec retry automatique en cas d'échec
   * @param {Function} fn Fonction à exécuter (Promise)
   * @param {Object} options Options pour le retry
   * @returns {Promise} Résultat de la fonction
   */
  async withRetry(fn, options = {}) {
    if (!this.isInitialized) {
      this.initialize();
    }
    
    const {
      maxAttempts = this.config.retry.maxAttempts,
      baseDelay = this.config.retry.baseDelay,
      maxDelay = this.config.retry.maxDelay,
      factor = this.config.retry.factor,
      shouldRetry = null,
      onRetry = null,
      timeoutPath = null
    } = options;
    
    let attempt = 0;
    
    const execute = async () => {
      try {
        attempt++;
        
        // Exécuter avec timeout si spécifié
        if (timeoutPath) {
          return await this.withTimeout(fn, timeoutPath);
        } else {
          return await fn();
        }
      } catch (error) {
        // Vérifier si on doit réessayer
        const canRetry = 
          attempt < maxAttempts && 
          (!shouldRetry || shouldRetry(error, attempt));
        
        if (!canRetry) {
          throw error;
        }
        
        // Calculer le délai avec backoff exponentiel
        const delay = Math.min(
          baseDelay * Math.pow(factor, attempt - 1),
          maxDelay
        );
        
        // Notifier de la nouvelle tentative
        if (onRetry) {
          onRetry(error, attempt, delay);
        }
        
        // Attendre avant de réessayer
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Réessayer
        return execute();
      }
    };
    
    return execute();
  }

  /**
   * Exécute plusieurs fonctions en parallèle avec un timeout global
   * @param {Array<Function>} fns Fonctions à exécuter
   * @param {string} timeoutPath Chemin de la configuration du timeout
   * @param {Object} options Options supplémentaires
   * @returns {Promise<Array>} Résultats des fonctions
   */
  async withParallelTimeout(fns, timeoutPath, options = {}) {
    if (!this.isInitialized) {
      this.initialize();
    }
    
    const {
      defaultTimeout = 30000,
      allOrNothing = false,
      onTimeout = null
    } = options;
    
    const timeout = this.getTimeout(timeoutPath, defaultTimeout);
    const operationId = `parallel_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    return new Promise((resolve, reject) => {
      // Créer le timeout global
      const timeoutId = this.setTimeout(() => {
        if (onTimeout) {
          onTimeout(operationId, timeout);
        }
        
        if (allOrNothing) {
          reject(new Error(`Opérations parallèles expirées après ${timeout}ms`));
        } else {
          // Résoudre avec les résultats partiels et des erreurs pour les opérations en timeout
          resolve(promises.map((p, i) => {
            return p._settled ? p._result : new Error(`Opération ${i} expirée`);
          }));
        }
      }, timeout, `timeout_for_${operationId}`);
      
      // Exécuter les fonctions avec tracking
      const promises = fns.map((fn, i) => {
        const p = Promise.resolve().then(() => fn());
        
        // Ajouter des propriétés pour le tracking
        p._settled = false;
        p._result = null;
        
        return p.then(result => {
          p._settled = true;
          p._result = result;
          return result;
        }).catch(error => {
          p._settled = true;
          p._result = error;
          throw error;
        });
      });
      
      // Attendre toutes les fonctions
      Promise.all(promises)
        .then(results => {
          this.clearTimeout(timeoutId);
          resolve(results);
        })
        .catch(error => {
          if (allOrNothing) {
            this.clearTimeout(timeoutId);
            reject(error);
          } else {
            // En mode partiel, on attend que toutes les promesses soient résolues/rejetées
            Promise.allSettled(promises).then(() => {
              this.clearTimeout(timeoutId);
              resolve(promises.map(p => p._result));
            });
          }
        });
    });
  }

  /**
   * Exécute une fonction avec un debounce
   * @param {Function} fn Fonction à exécuter
   * @param {number} delay Délai de debounce
   * @param {Object} options Options supplémentaires
   * @returns {Function} Fonction avec debounce
   */
  debounce(fn, delay = null, options = {}) {
    if (!this.isInitialized) {
      this.initialize();
    }
    
    const {
      timeoutPath = 'ui.debounce',
      leading = false,
      trailing = true,
      maxWait = null
    } = options;
    
    const actualDelay = delay || this.getTimeout(timeoutPath, 300);
    let timeoutId = null;
    let lastArgs = null;
    let lastThis = null;
    let lastCallTime = 0;
    let lastInvokeTime = 0;
    
    function invokeFunc() {
      const args = lastArgs;
      const thisArg = lastThis;
      
      lastArgs = lastThis = null;
      lastInvokeTime = Date.now();
      
      return fn.apply(thisArg, args);
    }
    
    function shouldInvoke() {
      const time = Date.now();
      const timeSinceLastCall = time - lastCallTime;
      const timeSinceLastInvoke = time - lastInvokeTime;
      
      return (
        lastCallTime === 0 ||
        timeSinceLastCall >= actualDelay ||
        (maxWait !== null && timeSinceLastInvoke >= maxWait)
      );
    }
    
    function trailingEdge() {
      timeoutId = null;
      
      if (trailing && lastArgs) {
        return invokeFunc();
      }
      
      lastArgs = lastThis = null;
      return null;
    }
    
    function leadingEdge() {
      lastInvokeTime = Date.now();
      
      // Reset le timeout
      timeoutId = setTimeout(trailingEdge, actualDelay);
      
      return leading ? invokeFunc() : null;
    }
    
    function cancel() {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
      lastArgs = lastThis = null;
      lastCallTime = lastInvokeTime = 0;
    }
    
    function flush() {
      return timeoutId === null ? null : trailingEdge();
    }
    
    function debounced(...args) {
      const time = Date.now();
      const isInvoking = shouldInvoke();
      
      lastArgs = args;
      lastThis = this;
      lastCallTime = time;
      
      if (isInvoking) {
        if (timeoutId === null) {
          return leadingEdge();
        }
        
        if (maxWait !== null) {
          // Gérer les appels pendant un maxWait
          timeoutId = setTimeout(trailingEdge, actualDelay);
          return invokeFunc();
        }
      }
      
      if (timeoutId === null) {
        timeoutId = setTimeout(trailingEdge, actualDelay);
      }
      
      return null;
    }
    
    debounced.cancel = cancel;
    debounced.flush = flush;
    
    return debounced;
  }

  /**
   * Exécute une fonction avec un throttle
   * @param {Function} fn Fonction à exécuter
   * @param {number} delay Délai de throttle
   * @param {Object} options Options supplémentaires
   * @returns {Function} Fonction avec throttle
   */
  throttle(fn, delay = null, options = {}) {
    if (!this.isInitialized) {
      this.initialize();
    }
    
    const {
      timeoutPath = 'ui.throttle',
      leading = true,
      trailing = true
    } = options;
    
    const actualDelay = delay || this.getTimeout(timeoutPath, 100);
    
    return this.debounce(fn, actualDelay, {
      leading,
      trailing,
      maxWait: actualDelay
    });
  }

  /**
   * Libère les ressources en annulant tous les timeouts et intervals actifs
   */
  dispose() {
    // Arrêter tous les timeouts
    for (const [id, { handle }] of this.activeTimeouts.entries()) {
      clearTimeout(handle);
    }
    
    // Arrêter tous les intervals
    for (const [id, { handle }] of this.activeIntervals.entries()) {
      clearInterval(handle);
    }
    
    // Réinitialiser les collections
    this.activeTimeouts.clear();
    this.activeIntervals.clear();
    this.pendingOperations.clear();
    
    console.info('Service de timeout libéré');
  }
}

// Créer une instance singleton du service
const timeoutConfigService = new TimeoutConfigService();

export { DEFAULT_TIMEOUT_CONFIG };
export default timeoutConfigService;
