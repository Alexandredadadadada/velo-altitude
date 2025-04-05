/**
 * Service optimisé pour les requêtes de données
 * Implémente des stratégies d'optimisation comme la mise en cache, 
 * la gestion des requêtes concurrentes et le filtrage des données
 */
import axios from 'axios';

class OptimizedDataService {
  constructor(baseApiUrl = process.env.REACT_APP_API_URL) {
    this.apiClient = axios.create({
      baseURL: baseApiUrl || 'https://api.dashboard-velo.com',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Initialisation du cache
    this.cache = new Map();
    
    // Requêtes en cours (pour éviter les requêtes dupliquées)
    this.pendingRequests = new Map();
    
    // Configuration du cache
    this.cacheConfig = {
      defaultExpiration: 5 * 60 * 1000, // 5 minutes par défaut
      expirations: {
        'cols': 60 * 60 * 1000, // 1 heure pour les données de cols (statiques)
        'training-programs': 24 * 60 * 60 * 1000, // 24 heures pour les programmes d'entraînement (très statiques)
        'nutrition-recipes': 12 * 60 * 60 * 1000, // 12 heures pour les recettes (statiques)
        'user-profile': 10 * 60 * 1000, // 10 minutes pour le profil utilisateur (peut changer)
        'weather': 15 * 60 * 1000, // 15 minutes pour la météo (plus dynamique)
      }
    };
    
    // Configuration de la compression
    this.useCompression = true;
    
    // Vérifier si mock data est activé
    this.useMockData = process.env.REACT_APP_USE_MOCK_DATA === 'true';
  }

  /**
   * Récupère les données de cols avec filtrage et optimisation
   * @param {Object} options Options de requête
   * @returns {Promise<Object>} Données de cols filtrées
   */
  async getColData(colId, options = {}) {
    const { fields, includeDetails, language, forceRefresh } = options;
    
    // Construire la clé de cache basée sur les paramètres
    const cacheKey = `cols_${colId}_${fields?.join(',') || 'all'}_${includeDetails ? 'detailed' : 'basic'}_${language || 'default'}`;
    
    // Vérifier le cache d'abord (sauf si forceRefresh est true)
    if (!forceRefresh && this.cache.has(cacheKey)) {
      console.log('[OptimizedDataService] Cache hit for:', cacheKey);
      return this.cache.get(cacheKey);
    }
    
    // Vérifier s'il y a déjà une requête en cours pour ces données
    if (this.pendingRequests.has(cacheKey)) {
      console.log('[OptimizedDataService] Reusing pending request for:', cacheKey);
      return this.pendingRequests.get(cacheKey);
    }
    
    // Construire les paramètres de requête
    const queryParams = new URLSearchParams();
    if (fields && fields.length > 0) {
      queryParams.set('fields', fields.join(','));
    }
    if (includeDetails !== undefined) {
      queryParams.set('includeDetails', includeDetails.toString());
    }
    if (language) {
      queryParams.set('language', language);
    }
    if (this.useCompression) {
      queryParams.set('compress', 'true');
    }
    
    // Chemin d'api pour les données de cols
    const apiPath = colId ? `/api/cols/${colId}` : '/api/cols';
    
    // Créer la promesse de requête
    const requestPromise = this._makeApiRequest(apiPath, queryParams, 'cols', cacheKey);
    
    // Stocker la requête en cours
    this.pendingRequests.set(cacheKey, requestPromise);
    
    return requestPromise;
  }

  /**
   * Récupère les programmes d'entraînement avec filtres et pagination
   * @param {Object} options Options de filtrage et pagination
   * @returns {Promise<Object>} Programmes d'entraînement filtrés
   */
  async getTrainingPrograms(options = {}) {
    const { 
      level, duration, goal, 
      page = 1, pageSize = 10, 
      fields, 
      includeWorkouts = false,
      forceRefresh 
    } = options;
    
    // Construire la clé de cache
    const cacheKey = `training-programs_${level || 'all'}_${duration || 'all'}_${goal || 'all'}_${page}_${pageSize}_${fields?.join(',') || 'all'}_${includeWorkouts ? 'with-workouts' : 'basic'}`;
    
    // Vérifier le cache d'abord
    if (!forceRefresh && this.cache.has(cacheKey)) {
      console.log('[OptimizedDataService] Cache hit for:', cacheKey);
      return this.cache.get(cacheKey);
    }
    
    // Construire les paramètres de requête
    const queryParams = new URLSearchParams();
    if (level) queryParams.set('level', level);
    if (duration) queryParams.set('duration', duration);
    if (goal) queryParams.set('goal', goal);
    queryParams.set('page', page.toString());
    queryParams.set('pageSize', pageSize.toString());
    if (fields && fields.length > 0) {
      queryParams.set('fields', fields.join(','));
    }
    queryParams.set('includeWorkouts', includeWorkouts.toString());
    if (this.useCompression) {
      queryParams.set('compress', 'true');
    }
    
    // Faire la requête avec la gestion du cache
    return this._makeApiRequest('/api/training-programs', queryParams, 'training-programs', cacheKey);
  }

  /**
   * Récupère les recettes nutritionnelles avec filtres et pagination
   * @param {Object} options Options de filtrage et pagination
   * @returns {Promise<Object>} Recettes filtrées
   */
  async getNutritionRecipes(options = {}) {
    const { 
      category, difficulty, prepTime, dietary,
      nutrientFocus, trainingPhase,
      page = 1, pageSize = 10, 
      fields, sortBy, forceRefresh 
    } = options;
    
    // Construire la clé de cache
    const cacheKey = `nutrition-recipes_${category || 'all'}_${difficulty || 'all'}_${prepTime || 'all'}_${dietary || 'all'}_${nutrientFocus || 'all'}_${trainingPhase || 'all'}_${page}_${pageSize}_${fields?.join(',') || 'all'}_${sortBy || 'default'}`;
    
    // Vérifier le cache d'abord
    if (!forceRefresh && this.cache.has(cacheKey)) {
      console.log('[OptimizedDataService] Cache hit for:', cacheKey);
      return this.cache.get(cacheKey);
    }
    
    // Construire les paramètres de requête
    const queryParams = new URLSearchParams();
    if (category) queryParams.set('category', category);
    if (difficulty) queryParams.set('difficulty', difficulty);
    if (prepTime) queryParams.set('prepTime', prepTime);
    if (dietary) queryParams.set('dietary', dietary);
    if (nutrientFocus) queryParams.set('nutrientFocus', nutrientFocus);
    if (trainingPhase) queryParams.set('trainingPhase', trainingPhase);
    queryParams.set('page', page.toString());
    queryParams.set('pageSize', pageSize.toString());
    if (fields && fields.length > 0) {
      queryParams.set('fields', fields.join(','));
    }
    if (sortBy) queryParams.set('sortBy', sortBy);
    if (this.useCompression) {
      queryParams.set('compress', 'true');
    }
    
    // Faire la requête avec la gestion du cache
    return this._makeApiRequest('/api/nutrition-recipes', queryParams, 'nutrition-recipes', cacheKey);
  }

  /**
   * Récupère le profil utilisateur avec les données optimisées
   * @param {string} userId ID de l'utilisateur
   * @param {Object} options Options de requête
   * @returns {Promise<Object>} Profil utilisateur
   */
  async getUserProfile(userId, options = {}) {
    const { fields, includeStats, forceRefresh } = options;
    
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    // Construire la clé de cache
    const cacheKey = `user-profile_${userId}_${fields?.join(',') || 'all'}_${includeStats ? 'with-stats' : 'basic'}`;
    
    // Vérifier le cache d'abord
    if (!forceRefresh && this.cache.has(cacheKey)) {
      console.log('[OptimizedDataService] Cache hit for:', cacheKey);
      return this.cache.get(cacheKey);
    }
    
    // Construire les paramètres de requête
    const queryParams = new URLSearchParams();
    if (fields && fields.length > 0) {
      queryParams.set('fields', fields.join(','));
    }
    if (includeStats !== undefined) {
      queryParams.set('includeStats', includeStats.toString());
    }
    if (this.useCompression) {
      queryParams.set('compress', 'true');
    }
    
    // Faire la requête avec la gestion du cache
    return this._makeApiRequest(`/api/users/${userId}/profile`, queryParams, 'user-profile', cacheKey);
  }

  /**
   * Méthode générique pour faire des requêtes API avec gestion de cache
   * @param {string} endpoint Endpoint API
   * @param {URLSearchParams} queryParams Paramètres de requête
   * @param {string} dataType Type de données pour la configuration du cache
   * @param {string} cacheKey Clé de cache
   * @returns {Promise<Object>} Données de réponse
   * @private
   */
  async _makeApiRequest(endpoint, queryParams, dataType, cacheKey) {
    try {
      // Si nous utilisons des données simulées, retourner les données mockées
      if (this.useMockData) {
        const mockData = await this._getMockData(dataType, queryParams);
        
        // Mettre en cache les données mockées
        this._setCacheData(cacheKey, mockData, dataType);
        
        // Supprimer des requêtes en cours
        if (this.pendingRequests.has(cacheKey)) {
          this.pendingRequests.delete(cacheKey);
        }
        
        return mockData;
      }
      
      // Construire l'URL complète
      const url = `${endpoint}?${queryParams.toString()}`;
      
      // Faire la requête API
      const response = await this.apiClient.get(url);
      
      // Vérifier la réponse
      if (response.status !== 200) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      // Mettre en cache les données
      this._setCacheData(cacheKey, response.data, dataType);
      
      // Supprimer des requêtes en cours
      if (this.pendingRequests.has(cacheKey)) {
        this.pendingRequests.delete(cacheKey);
      }
      
      return response.data;
    } catch (error) {
      console.error('[OptimizedDataService] API request error:', error);
      
      // Supprimer des requêtes en cours en cas d'erreur
      if (this.pendingRequests.has(cacheKey)) {
        this.pendingRequests.delete(cacheKey);
      }
      
      // En cas d'erreur et si des données en cache existent, retourner les données en cache périmées
      if (this.cache.has(cacheKey)) {
        console.warn('[OptimizedDataService] Returning stale cache data due to API error');
        return this.cache.get(cacheKey);
      }
      
      throw error;
    }
  }

  /**
   * Stocke les données dans le cache avec expiration
   * @param {string} key Clé de cache
   * @param {Object} data Données à mettre en cache
   * @param {string} dataType Type de données pour la configuration d'expiration
   * @private
   */
  _setCacheData(key, data, dataType) {
    // Stocker les données dans le cache
    this.cache.set(key, data);
    
    // Définir l'expiration
    const expirationTime = this.cacheConfig.expirations[dataType] || this.cacheConfig.defaultExpiration;
    
    // Programmer la suppression après expiration
    setTimeout(() => {
      this.cache.delete(key);
    }, expirationTime);
  }

  /**
   * Récupère des données mockées pour le développement et les tests
   * @param {string} dataType Type de données
   * @param {URLSearchParams} params Paramètres de requête
   * @returns {Promise<Object>} Données mockées
   * @private
   */
  async _getMockData(dataType, params) {
    try {
      // Simuler un délai réseau pour le réalisme
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Charger les données mockées en fonction du type
      let mockData;
      
      switch(dataType) {
        case 'cols':
          const colsData = await import('../data/colsData');
          mockData = colsData.default;
          break;
        case 'training-programs':
          const trainingData = await import('../data/training');
          mockData = trainingData.allPrograms;
          break;
        case 'nutrition-recipes':
          const recipesData = await import('../data/recipes');
          mockData = recipesData.allRecipes;
          break;
        case 'user-profile':
          // Profil utilisateur simulé
          mockData = {
            id: 'mock-user-1',
            username: 'CyclisteTest',
            email: 'cycliste@test.com',
            level: 'intermediate',
            ftp: 250,
            weight: 75,
            age: 35,
            cyclingType: 'road',
            lastLogin: new Date().toISOString(),
            preferences: {
              units: 'metric',
              language: 'fr',
              notifications: true
            }
          };
          break;
        default:
          mockData = { message: 'No mock data available for this type' };
      }
      
      // Appliquer les filtres de base pour simuler le comportement de l'API
      if (params.has('page') && params.has('pageSize')) {
        const page = parseInt(params.get('page'));
        const pageSize = parseInt(params.get('pageSize'));
        
        if (Array.isArray(mockData)) {
          const start = (page - 1) * pageSize;
          const end = start + pageSize;
          mockData = {
            items: mockData.slice(start, end),
            totalItems: mockData.length,
            currentPage: page,
            totalPages: Math.ceil(mockData.length / pageSize),
            pageSize
          };
        }
      }
      
      return mockData;
    } catch (error) {
      console.error('[OptimizedDataService] Error loading mock data:', error);
      return { error: 'Failed to load mock data', message: error.message };
    }
  }

  /**
   * Efface le cache pour une entité spécifique ou entièrement
   * @param {string} entityType Type d'entité (cols, training-programs, etc.)
   * @param {string} entityId ID facultatif de l'entité spécifique
   */
  clearCache(entityType, entityId) {
    if (!entityType) {
      // Effacer tout le cache
      this.cache.clear();
      console.log('[OptimizedDataService] Cleared entire cache');
      return;
    }
    
    // Effacer un type d'entité spécifique ou une entité
    const prefix = entityId ? `${entityType}_${entityId}` : `${entityType}_`;
    
    let clearedCount = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        clearedCount++;
      }
    }
    
    console.log(`[OptimizedDataService] Cleared ${clearedCount} cache entries for ${prefix}`);
  }

  /**
   * Précharge les données fréquemment utilisées pour améliorer l'expérience utilisateur
   */
  preloadCommonData() {
    // Précharger les listes principales pour l'interface utilisateur
    Promise.all([
      this.getColData(null, { fields: ['id', 'name', 'location', 'elevation', 'difficulty'] }),
      this.getTrainingPrograms({ fields: ['id', 'name', 'level', 'duration', 'goals'], pageSize: 100 }),
      this.getNutritionRecipes({ fields: ['id', 'name', 'category', 'difficulty', 'prepTime'], pageSize: 100 })
    ]).then(() => {
      console.log('[OptimizedDataService] Preloaded common data successfully');
    }).catch(error => {
      console.error('[OptimizedDataService] Failed to preload common data:', error);
    });
  }
}

// Exporter une instance singleton
const optimizedDataService = new OptimizedDataService();
export default optimizedDataService;
