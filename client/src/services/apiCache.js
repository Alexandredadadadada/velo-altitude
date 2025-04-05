/**
 * Service de cache API avancé
 * Permet de réduire les appels API redondants et d'améliorer les performances
 * Supporte plusieurs stratégies de cache, invalidation intelligente et persistance
 */
import axios from 'axios';
import featureFlagsService from './featureFlags';

// Constantes pour les stratégies de cache
const CACHE_STRATEGIES = {
  NETWORK_FIRST: 'network-first',  // Essaie le réseau, utilise le cache en fallback
  CACHE_FIRST: 'cache-first',      // Utilise le cache, fait appel au réseau si expiré ou absent
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate', // Retourne le cache immédiatement et met à jour en arrière-plan
  NETWORK_ONLY: 'network-only',    // Toujours utiliser le réseau (désactive le cache)
  CACHE_ONLY: 'cache-only'         // Toujours utiliser le cache (mode hors ligne)
};

// Structure de l'élément de cache
class CacheItem {
  constructor(data, params = {}) {
    this.data = data;
    this.timestamp = Date.now();
    this.expiry = this.timestamp + (params.ttl || 5 * 60 * 1000); // 5 minutes par défaut
    this.staleExpiry = this.expiry + (params.staleTime || 60 * 60 * 1000); // 1 heure de plus pour les données obsolètes
    this.tags = params.tags || [];
    this.etag = params.etag || null;
    this.lastModified = params.lastModified || null;
  }

  isExpired() {
    return Date.now() > this.expiry;
  }

  isStale() {
    return this.isExpired() && Date.now() <= this.staleExpiry;
  }

  // Méthode pour étendre la durée de vie du cache
  extend(additionalTime) {
    this.expiry += additionalTime;
    this.staleExpiry += additionalTime;
  }
}

/**
 * Service principal de gestion du cache API
 */
class ApiCacheService {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.isInitialized = false;
    this.storageKey = 'api_cache_data';
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes par défaut
    this.maxCacheSize = 100; // Nombre maximum d'entrées dans le cache
    this.defaultStrategy = CACHE_STRATEGIES.CACHE_FIRST;
    this.networkMonitor = {
      isOnline: true,
      lastCheck: Date.now()
    };
    this.statistics = {
      hits: 0,
      misses: 0,
      errors: 0,
      networkCalls: 0
    };
    this.ttlConfigKey = 'api_cache_ttl_config';
    this.categoryTTLs = {};

    // Création d'une instance axios personnalisée
    this.axiosInstance = axios.create({
      timeout: 10000, // 10 secondes de timeout par défaut
    });

    // Intercepteur pour ajouter les headers de cache
    this.axiosInstance.interceptors.request.use(config => {
      const cacheKey = this.generateCacheKey(config.url, config.params);
      
      // Ajouter les headers conditionnels si disponibles
      const cachedItem = this.cache.get(cacheKey);
      if (cachedItem) {
        if (cachedItem.etag) {
          config.headers['If-None-Match'] = cachedItem.etag;
        }
        if (cachedItem.lastModified) {
          config.headers['If-Modified-Since'] = cachedItem.lastModified;
        }
      }
      
      return config;
    });

    // Intercepteur pour gérer les réponses 304 Not Modified
    this.axiosInstance.interceptors.response.use(
      response => {
        // Capture des headers ETag et Last-Modified
        const newHeaders = {};
        if (response.headers.etag) {
          newHeaders.etag = response.headers.etag;
        }
        if (response.headers['last-modified']) {
          newHeaders.lastModified = response.headers['last-modified'];
        }
        
        // Ajouter les headers à la réponse pour utilisation dans le cache
        response.cacheHeaders = newHeaders;
        return response;
      },
      error => {
        // Si 304 Not Modified, considérer comme un succès
        if (error.response && error.response.status === 304) {
          const cacheKey = this.generateCacheKey(
            error.config.url, 
            error.config.params
          );
          const cachedItem = this.cache.get(cacheKey);
          
          if (cachedItem) {
            // Créer une réponse simulée avec les données du cache
            const response = {
              data: cachedItem.data,
              status: 200,
              statusText: 'OK (from cache)',
              headers: error.response.headers,
              config: error.config,
              fromCache: true
            };
            
            // Prolonger la durée de vie du cache
            cachedItem.extend(this.defaultTTL);
            this.cache.set(cacheKey, cachedItem);
            
            return response;
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  /**
   * Initialise le service de cache
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Charger les TTL spécifiques par catégorie depuis les feature flags
      await this.loadTTLConfigurations();
      
      // Si le caching avancé est activé, charger depuis le stockage
      if (featureFlagsService.isEnabled('enableAdvancedCaching')) {
        await this.loadCacheFromStorage();
      }
      
      // Configurer la surveillance réseau
      this.setupNetworkMonitoring();
      
      // Configurer le nettoyage périodique du cache
      this.setupPeriodicCleanup();
      
      this.isInitialized = true;
      console.info('Service de cache API initialisé', {
        cacheSize: this.cache.size,
        defaultTTL: this.formatDuration(this.defaultTTL)
      });
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du cache API:', error);
    }
  }

  /**
   * Configure la surveillance de la connexion réseau
   */
  setupNetworkMonitoring() {
    if (typeof window !== 'undefined') {
      // Détecter les changements de connectivité
      window.addEventListener('online', () => {
        this.networkMonitor.isOnline = true;
        this.networkMonitor.lastCheck = Date.now();
        console.info('Connectivité rétablie - API Cache passe en mode en ligne');
      });
      
      window.addEventListener('offline', () => {
        this.networkMonitor.isOnline = false;
        this.networkMonitor.lastCheck = Date.now();
        console.info('Connectivité perdue - API Cache passe en mode hors ligne');
      });
      
      // État initial
      this.networkMonitor.isOnline = navigator.onLine;
    }
  }

  /**
   * Configure le nettoyage périodique du cache
   */
  setupPeriodicCleanup() {
    // Nettoyer toutes les heures
    const CLEANUP_INTERVAL = 60 * 60 * 1000;
    
    if (typeof window !== 'undefined') {
      setInterval(() => this.cleanupCache(), CLEANUP_INTERVAL);
    }
  }

  /**
   * Nettoie le cache en supprimant les entrées expirées et en respectant la taille maximale
   */
  cleanupCache() {
    if (this.cache.size === 0) return;
    
    console.info('Nettoyage du cache API en cours...');
    const now = Date.now();
    let deleteCount = 0;
    
    // Supprimer les entrées complètement expirées (même stale)
    for (const [key, item] of this.cache.entries()) {
      if (now > item.staleExpiry) {
        this.cache.delete(key);
        deleteCount++;
      }
    }
    
    // Si le cache est toujours trop grand, supprimer les entrées les plus anciennes
    if (this.cache.size > this.maxCacheSize) {
      const excess = this.cache.size - this.maxCacheSize;
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      for (let i = 0; i < excess; i++) {
        this.cache.delete(entries[i][0]);
        deleteCount++;
      }
    }
    
    console.info(`Nettoyage du cache terminé: ${deleteCount} entrées supprimées`);
    this.saveCacheToStorage();
  }

  /**
   * Charge le cache depuis le localStorage
   */
  async loadCacheFromStorage() {
    try {
      const storedCache = localStorage.getItem(this.storageKey);
      if (!storedCache) return;
      
      const parsedCache = JSON.parse(storedCache);
      const now = Date.now();
      let validEntries = 0;
      
      // Ne charger que les entrées non complètement expirées
      Object.entries(parsedCache).forEach(([key, value]) => {
        // Recréer l'objet CacheItem correctement avec ses méthodes
        const cacheItem = new CacheItem(value.data, {
          ttl: value.expiry - value.timestamp,
          staleTime: value.staleExpiry - value.expiry,
          tags: value.tags,
          etag: value.etag,
          lastModified: value.lastModified
        });
        
        // Restaurer les timestamps originaux
        cacheItem.timestamp = value.timestamp;
        cacheItem.expiry = value.expiry;
        cacheItem.staleExpiry = value.staleExpiry;
        
        // Ne pas charger les entrées complètement expirées
        if (now <= cacheItem.staleExpiry) {
          this.cache.set(key, cacheItem);
          validEntries++;
        }
      });
      
      console.info(`Cache chargé depuis le localStorage: ${validEntries} entrées valides`);
    } catch (error) {
      console.error('Erreur lors du chargement du cache depuis le localStorage:', error);
      // Si erreur, démarrer avec un cache vide
      this.cache.clear();
    }
  }

  /**
   * Sauvegarde le cache dans le localStorage
   */
  saveCacheToStorage() {
    try {
      // Convertir le Map en objet pour le stockage
      const cacheObject = {};
      
      for (const [key, value] of this.cache.entries()) {
        cacheObject[key] = {
          data: value.data,
          timestamp: value.timestamp,
          expiry: value.expiry,
          staleExpiry: value.staleExpiry,
          tags: value.tags,
          etag: value.etag,
          lastModified: value.lastModified
        };
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(cacheObject));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du cache dans le localStorage:', error);
    }
  }

  /**
   * Génère une clé de cache unique pour une URL et des paramètres
   * @param {string} url URL de la requête
   * @param {Object} params Paramètres de la requête
   * @returns {string} Clé de cache unique
   */
  generateCacheKey(url, params = {}) {
    // Normaliser l'URL
    const normalizedUrl = url.toLowerCase().trim();
    
    // Trier les paramètres pour assurer la cohérence des clés
    const sortedParams = {};
    if (params) {
      Object.keys(params).sort().forEach(key => {
        sortedParams[key] = params[key];
      });
    }
    
    // Créer une clé unique
    return `${normalizedUrl}|${JSON.stringify(sortedParams)}`;
  }

  /**
   * Effectue une requête GET avec gestion de cache
   * @param {string} url URL de la requête
   * @param {Object} options Options de la requête
   * @param {Object} options.params Paramètres de la requête
   * @param {string} options.strategy Stratégie de cache à utiliser
   * @param {number} options.ttl Durée de vie du cache en millisecondes
   * @param {Array<string>} options.tags Tags associés à cette entrée de cache
   * @returns {Promise<any>} Données de la réponse
   */
  async get(url, options = {}) {
    // Initialiser le service si ce n'est pas déjà fait
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    const {
      params = {},
      strategy = this.defaultStrategy,
      tags = []
    } = options;
    
    // Utiliser le TTL approprié pour cette URL
    const ttl = this.getTTLForUrl(url, options);
    
    // Créer la clé de cache
    const cacheKey = this.generateCacheKey(url, params);
    
    // Vérifier si la réponse est en cache
    const cachedItem = this.cache.get(cacheKey);
    
    // Options de cache à utiliser pour la mise en cache
    const cacheOptions = { ttl, tags };
    
    // Vérifier si le caching est activé
    const isCachingEnabled = featureFlagsService.isEnabled('enableApiCaching');
    
    // Si le caching est désactivé, faire un appel réseau direct
    if (!isCachingEnabled || strategy === CACHE_STRATEGIES.NETWORK_ONLY) {
      return this.fetchFromNetwork(url, params);
    }
    
    // Gestion du mode hors ligne forcé
    if (strategy === CACHE_STRATEGIES.CACHE_ONLY) {
      if (cachedItem) {
        this.statistics.hits++;
        return { ...cachedItem.data, fromCache: true };
      } else {
        this.statistics.misses++;
        throw new Error('Aucune donnée en cache et mode CACHE_ONLY activé');
      }
    }
    
    // Gestion du mode hors ligne en cas de perte de connectivité
    if (!this.networkMonitor.isOnline) {
      if (cachedItem) {
        console.info('Mode hors ligne - Utilisation du cache pour:', url);
        return { ...cachedItem.data, fromCache: true };
      } else {
        throw new Error('Aucune donnée en cache et appareil hors ligne');
      }
    }
    
    // Stratégie CACHE_FIRST
    if (strategy === CACHE_STRATEGIES.CACHE_FIRST) {
      if (cachedItem && !cachedItem.isExpired()) {
        this.statistics.hits++;
        return { ...cachedItem.data, fromCache: true };
      }
      
      // Cache expiré ou absent
      try {
        const response = await this.fetchFromNetwork(url, params);
        this.cacheResponse(cacheKey, response, cacheOptions);
        return response;
      } catch (error) {
        // En cas d'erreur réseau, utiliser le cache même expiré si disponible
        if (cachedItem) {
          console.warn('Erreur réseau - Utilisation du cache expiré pour:', url);
          return { ...cachedItem.data, fromCache: true, stale: true };
        }
        throw error;
      }
    }
    
    // Stratégie STALE_WHILE_REVALIDATE
    if (strategy === CACHE_STRATEGIES.STALE_WHILE_REVALIDATE) {
      // Si un élément est en cache, le retourner immédiatement
      if (cachedItem) {
        // Mettre à jour en arrière-plan si expiré
        if (cachedItem.isExpired()) {
          this.fetchFromNetworkAndUpdateCache(url, params, cacheKey, cacheOptions)
            .catch(error => console.error('Erreur lors de la mise à jour du cache en arrière-plan:', error));
        }
        
        this.statistics.hits++;
        return { ...cachedItem.data, fromCache: true, stale: cachedItem.isExpired() };
      }
      
      // Rien en cache, faire un appel réseau
      const response = await this.fetchFromNetwork(url, params);
      this.cacheResponse(cacheKey, response, cacheOptions);
      return response;
    }
    
    // Par défaut: NETWORK_FIRST
    try {
      const response = await this.fetchFromNetwork(url, params);
      this.cacheResponse(cacheKey, response, cacheOptions);
      return response;
    } catch (error) {
      // En cas d'erreur réseau, utiliser le cache si disponible
      if (cachedItem) {
        console.warn('Erreur réseau - Utilisation du cache pour:', url);
        this.statistics.hits++;
        return { ...cachedItem.data, fromCache: true, stale: cachedItem.isExpired() };
      }
      throw error;
    }
  }

  /**
   * Effectue une requête POST (non mise en cache)
   * @param {string} url URL de la requête
   * @param {Object} data Données à envoyer
   * @param {Object} config Configuration axios supplémentaire
   * @returns {Promise<any>} Réponse de la requête
   */
  async post(url, data, config = {}) {
    return this.axiosInstance.post(url, data, config).then(response => response.data);
  }

  /**
   * Effectue une requête PUT (non mise en cache)
   * @param {string} url URL de la requête
   * @param {Object} data Données à envoyer
   * @param {Object} config Configuration axios supplémentaire
   * @returns {Promise<any>} Réponse de la requête
   */
  async put(url, data, config = {}) {
    return this.axiosInstance.put(url, data, config).then(response => response.data);
  }

  /**
   * Effectue une requête DELETE (non mise en cache)
   * @param {string} url URL de la requête
   * @param {Object} config Configuration axios supplémentaire
   * @returns {Promise<any>} Réponse de la requête
   */
  async delete(url, config = {}) {
    return this.axiosInstance.delete(url, config).then(response => response.data);
  }

  /**
   * Effectue un appel réseau et met à jour le cache en arrière-plan
   * @param {string} url URL de la requête
   * @param {Object} params Paramètres de la requête
   * @param {string} cacheKey Clé de cache
   * @param {Object} cacheOptions Options de cache
   * @returns {Promise<void>}
   */
  async fetchFromNetworkAndUpdateCache(url, params, cacheKey, cacheOptions) {
    try {
      const response = await this.fetchFromNetwork(url, params);
      this.cacheResponse(cacheKey, response, cacheOptions);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du cache en arrière-plan:', error);
    }
  }

  /**
   * Effectue un appel réseau en gérant les requêtes en parallèle
   * @param {string} url URL de la requête
   * @param {Object} params Paramètres de la requête
   * @returns {Promise<any>} Données de la réponse
   */
  async fetchFromNetwork(url, params = {}) {
    const cacheKey = this.generateCacheKey(url, params);
    
    // Vérifier si une requête identique est déjà en cours
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }
    
    // Créer une nouvelle promesse pour cette requête
    const requestPromise = this.axiosInstance.get(url, { params })
      .then(response => {
        // Capturer les headers ETag et Last-Modified
        const headers = response.cacheHeaders || {};
        
        this.statistics.networkCalls++;
        this.pendingRequests.delete(cacheKey);
        return {
          data: response.data,
          headers,
          fromCache: false
        };
      })
      .catch(error => {
        this.statistics.errors++;
        this.pendingRequests.delete(cacheKey);
        throw error;
      });
    
    // Enregistrer cette requête en cours
    this.pendingRequests.set(cacheKey, requestPromise);
    
    return requestPromise;
  }

  /**
   * Enregistre une réponse dans le cache
   * @param {string} cacheKey Clé de cache
   * @param {Object} response Réponse à mettre en cache
   * @param {Object} options Options de cache
   */
  cacheResponse(cacheKey, response, options = {}) {
    const { ttl = this.defaultTTL, tags = [] } = options;
    
    // Ne pas mettre en cache les réponses déjà issues du cache
    if (response.fromCache) return;
    
    // Créer un objet de cache
    const cacheItem = new CacheItem(response.data, {
      ttl,
      tags,
      etag: response.headers?.etag,
      lastModified: response.headers?.lastModified
    });
    
    // Ajouter au cache
    this.cache.set(cacheKey, cacheItem);
    
    // Si le cache dépasse sa taille maximale, supprimer les entrées les plus anciennes
    if (this.cache.size > this.maxCacheSize) {
      this.pruneCache();
    }
    
    // Persister dans le localStorage si nécessaire
    if (featureFlagsService.isEnabled('enableAdvancedCaching')) {
      this.saveCacheToStorage();
    }
  }

  /**
   * Réduit la taille du cache en supprimant les entrées les plus anciennes
   */
  pruneCache() {
    if (this.cache.size <= this.maxCacheSize) return;
    
    const excess = this.cache.size - this.maxCacheSize;
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    for (let i = 0; i < excess; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  /**
   * Invalide les entrées de cache pour une URL spécifique
   * @param {string} url URL dont les entrées doivent être invalidées
   * @param {Object} params Paramètres spécifiques (si null, toutes les entrées pour cette URL sont invalidées)
   */
  invalidateCache(url, params = null) {
    if (params === null) {
      // Invalider toutes les entrées commençant par cette URL
      const normalizedUrl = url.toLowerCase().trim();
      
      for (const key of this.cache.keys()) {
        if (key.startsWith(normalizedUrl)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Invalider uniquement l'entrée spécifique
      const cacheKey = this.generateCacheKey(url, params);
      this.cache.delete(cacheKey);
    }
    
    // Persister les changements
    if (featureFlagsService.isEnabled('enableAdvancedCaching')) {
      this.saveCacheToStorage();
    }
  }

  /**
   * Invalide les entrées de cache par tags
   * @param {Array<string>} tags Liste des tags à invalider
   */
  invalidateByTags(tags) {
    if (!Array.isArray(tags) || tags.length === 0) return;
    
    const keysToDelete = [];
    
    // Trouver toutes les entrées correspondant aux tags
    for (const [key, item] of this.cache.entries()) {
      const hasMatchingTag = tags.some(tag => item.tags.includes(tag));
      if (hasMatchingTag) {
        keysToDelete.push(key);
      }
    }
    
    // Supprimer les entrées trouvées
    keysToDelete.forEach(key => this.cache.delete(key));
    
    // Persister les changements
    if (keysToDelete.length > 0 && featureFlagsService.isEnabled('enableAdvancedCaching')) {
      this.saveCacheToStorage();
    }
  }

  /**
   * Efface tout le cache
   */
  clearCache() {
    this.cache.clear();
    localStorage.removeItem(this.storageKey);
    console.info('Cache API entièrement effacé');
  }

  /**
   * Récupère les statistiques d'utilisation du cache
   * @returns {Object} Statistiques d'utilisation
   */
  getStatistics() {
    return {
      ...this.statistics,
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size
    };
  }

  /**
   * Configure le service de cache
   * @param {Object} config Configuration
   */
  configure(config = {}) {
    if (config.defaultTTL) this.defaultTTL = config.defaultTTL;
    if (config.maxCacheSize) this.maxCacheSize = config.maxCacheSize;
    if (config.defaultStrategy) this.defaultStrategy = config.defaultStrategy;
    
    console.info('Configuration du cache API mise à jour:', config);
  }

  /**
   * Charge les configurations TTL depuis les feature flags
   */
  async loadTTLConfigurations() {
    try {
      // Vérifier si la fonctionnalité de configuration TTL est activée
      const configurationEnabled = featureFlagsService.isEnabled('enableConfigurableCacheTTL');
      
      if (configurationEnabled) {
        // Récupérer le TTL global par défaut si configuré
        const globalTTL = featureFlagsService.getValue('defaultCacheTTL');
        if (globalTTL && typeof globalTTL === 'number' && globalTTL > 0) {
          this.defaultTTL = globalTTL * 1000; // Conversion de secondes en millisecondes
          console.info(`TTL de cache global configuré à ${this.formatDuration(this.defaultTTL)}`);
        }
        
        // Récupérer les TTL spécifiques par catégorie
        const categoryTTLs = featureFlagsService.getValue('categorySpecificTTLs') || {};
        
        for (const [category, ttl] of Object.entries(categoryTTLs)) {
          if (typeof ttl === 'number' && ttl > 0) {
            this.categoryTTLs[category] = ttl * 1000; // Conversion de secondes en millisecondes
            console.info(`TTL de cache pour la catégorie "${category}" configuré à ${this.formatDuration(ttl * 1000)}`);
          }
        }
        
        // Sauvegarder la configuration pour référence
        localStorage.setItem(this.ttlConfigKey, JSON.stringify({
          defaultTTL: this.defaultTTL,
          categoryTTLs: this.categoryTTLs
        }));
      } else {
        // Si désactivé, utiliser les valeurs par défaut mais tenter de charger depuis le localStorage pour la persistance
        const savedConfig = localStorage.getItem(this.ttlConfigKey);
        if (savedConfig) {
          try {
            const { defaultTTL, categoryTTLs } = JSON.parse(savedConfig);
            this.defaultTTL = defaultTTL || this.defaultTTL;
            this.categoryTTLs = categoryTTLs || {};
          } catch (e) {
            console.warn('Impossible de charger la configuration TTL sauvegardée:', e);
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des configurations TTL:', error);
    }
  }

  /**
   * Obtient le TTL approprié pour une URL donnée en se basant sur les catégories
   * @param {string} url URL de la requête
   * @param {Object} options Options de cache spécifiques à la requête
   * @returns {number} TTL en millisecondes
   */
  getTTLForUrl(url, options = {}) {
    // Si un TTL est explicitement défini dans les options, l'utiliser
    if (options.ttl && typeof options.ttl === 'number') {
      return options.ttl;
    }
    
    // Vérifier si l'URL correspond à une catégorie configurée
    const normalizedUrl = url.toLowerCase();
    
    // Définir les catégories d'URL et leurs patterns
    const urlCategories = {
      'cols': /(\/api\/cols|\/api\/passes)/,
      'user': /\/api\/user/,
      'activities': /\/api\/activities/,
      'routes': /\/api\/routes/,
      'weather': /\/api\/weather/,
      'challenges': /\/api\/challenges/,
      'social': /\/api\/social/
    };
    
    // Vérifier si l'URL correspond à une catégorie ayant un TTL spécifique
    for (const [category, pattern] of Object.entries(urlCategories)) {
      if (pattern.test(normalizedUrl) && this.categoryTTLs[category]) {
        return this.categoryTTLs[category];
      }
    }
    
    // Utiliser le TTL par défaut
    return this.defaultTTL;
  }

  /**
   * Formate une durée en millisecondes en chaîne de caractères lisible
   * @param {number} ms Durée en millisecondes
   * @returns {string} Durée formatée
   */
  formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
    return `${Math.round(ms / 3600000)}h`;
  }
}

// Créer une instance singleton du service
const apiCacheService = new ApiCacheService();

// Exporter les constantes et le service
export { CACHE_STRATEGIES };
export default apiCacheService;
