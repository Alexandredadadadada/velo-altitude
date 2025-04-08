/**
 * Service optimisé pour les requêtes de données
 * Implémente des stratégies d'optimisation comme la mise en cache, 
 * la gestion des requêtes concurrentes et le filtrage des données
 */
import RealApiOrchestrator from './api/RealApiOrchestrator';
import RealApiOrchestratorPart2 from './api/RealApiOrchestratorPart2';

class OptimizedDataService {
  constructor() {
    // Initialisation du cache
    this.cache = new Map();
    
    // Requêtes en cours (pour éviter les requêtes dupliquées)
    this.pendingRequests = new Map();
    
    // Configuration du cache
    this.cacheConfig = {
      defaultExpiration: 5 * 60 * 1000, // 5 minutes par défaut
      expirations: {
        'cols': 60 * 60 * 1000, // 1 heure pour les données de cols (statiques)
        'weather': 15 * 60 * 1000, // 15 minutes pour la météo (plus dynamique)
        'user': 10 * 60 * 1000, // 10 minutes pour les données utilisateur (peut changer)
        'training-programs': 24 * 60 * 60 * 1000, // 24 heures pour les programmes d'entraînement (très statiques)
        'nutrition-recipes': 12 * 60 * 60 * 1000, // 12 heures pour les recettes (statiques)
      }
    };
    
    // Orchestrateur d'API
    this.apiOrchestrator = RealApiOrchestrator;
    this.apiOrchestratorPart2 = RealApiOrchestratorPart2;
  }

  /**
   * Récupère les données de cols avec filtrage et optimisation
   * @param {string} colId - ID de col (ou null pour tous les cols)
   * @param {Object} options - Options de requête
   * @returns {Promise<Object|Array>} - Données de cols filtrées
   */
  async getColData(colId, options = {}) {
    const { fields, includeDetails, language, forceRefresh } = options;
    
    // Construire la clé de cache basée sur les paramètres
    const cacheKey = `cols_${colId}_${fields?.join(',') || 'all'}_${includeDetails ? 'detailed' : 'basic'}_${language || 'default'}`;
    
    // Vérifier le cache d'abord
    const cachedData = this._getCacheData(cacheKey);
    if (cachedData && !forceRefresh) {
      console.log('[OptimizedDataService] Cache hit for:', cacheKey);
      return cachedData;
    }
    
    // Vérifier s'il y a déjà une requête en cours pour ces données
    if (this.pendingRequests.has(cacheKey)) {
      console.log('[OptimizedDataService] Reusing pending request for:', cacheKey);
      return this.pendingRequests.get(cacheKey);
    }
    
    // Faire une nouvelle requête
    try {
      // Créer une promesse pour cette requête
      const promise = colId 
        ? this.apiOrchestrator.getColById(colId)
        : this.apiOrchestrator.getAllCols();
      
      // Stocker la promesse pour éviter les requêtes dupliquées
      this.pendingRequests.set(cacheKey, promise);
      
      // Attendre le résultat
      const result = await promise;
      
      // Mettre en cache le résultat
      this._setCacheData(cacheKey, result, 'cols');
      
      // Supprimer des requêtes en cours
      this.pendingRequests.delete(cacheKey);
      
      return result;
    } catch (error) {
      // Supprimer des requêtes en cours en cas d'erreur
      this.pendingRequests.delete(cacheKey);
      console.error('[OptimizedDataService] Error:', error);
      throw error;
    }
  }

  /**
   * Récupère les programmes d'entraînement avec filtres et pagination
   * @param {Object} options - Options de filtrage et pagination
   * @returns {Promise<Object|Array>} - Programmes d'entraînement filtrés
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
    const cachedData = this._getCacheData(cacheKey);
    if (cachedData && !forceRefresh) {
      console.log('[OptimizedDataService] Cache hit for:', cacheKey);
      return cachedData;
    }
    
    // Vérifier s'il y a déjà une requête en cours pour ces données
    if (this.pendingRequests.has(cacheKey)) {
      console.log('[OptimizedDataService] Reusing pending request for:', cacheKey);
      return this.pendingRequests.get(cacheKey);
    }
    
    // Faire une nouvelle requête
    try {
      // Cette méthode devrait être implémentée dans RealApiOrchestrator si elle ne l'est pas déjà
      // Pour l'instant, nous utilisons une approche simplifiée
      const userId = 'current'; // Ceci proviendrait généralement du contexte d'authentification
      const promise = this.apiOrchestratorPart2.getUserTrainingPlans(userId);
      
      // Stocker la promesse
      this.pendingRequests.set(cacheKey, promise);
      
      // Attendre le résultat
      const result = await promise;
      
      // Mettre en cache le résultat
      this._setCacheData(cacheKey, result, 'training-programs');
      
      // Supprimer des requêtes en cours
      this.pendingRequests.delete(cacheKey);
      
      return result;
    } catch (error) {
      this.pendingRequests.delete(cacheKey);
      console.error('[OptimizedDataService] Error:', error);
      throw error;
    }
  }

  /**
   * Récupère les recettes nutritionnelles avec filtres et pagination
   * @param {Object} options - Options de filtrage et pagination
   * @returns {Promise<Object|Array>} - Recettes filtrées
   */
  async getNutritionRecipes(options = {}) {
    const { query, tags, page = 1, pageSize = 20, forceRefresh } = options;
    
    // Construire la clé de cache
    const cacheKey = `nutrition-recipes_${query || 'all'}_${tags?.join(',') || 'all'}_${page}_${pageSize}`;
    
    // Vérifier le cache d'abord
    const cachedData = this._getCacheData(cacheKey);
    if (cachedData && !forceRefresh) {
      console.log('[OptimizedDataService] Cache hit for:', cacheKey);
      return cachedData;
    }
    
    // Vérifier s'il y a déjà une requête en cours pour ces données
    if (this.pendingRequests.has(cacheKey)) {
      console.log('[OptimizedDataService] Reusing pending request for:', cacheKey);
      return this.pendingRequests.get(cacheKey);
    }
    
    // Faire une nouvelle requête
    try {
      const promise = this.apiOrchestratorPart2.getNutritionRecipes(query, tags);
      
      // Stocker la promesse
      this.pendingRequests.set(cacheKey, promise);
      
      // Attendre le résultat
      const result = await promise;
      
      // Mettre en cache le résultat
      this._setCacheData(cacheKey, result, 'nutrition-recipes');
      
      // Supprimer des requêtes en cours
      this.pendingRequests.delete(cacheKey);
      
      return result;
    } catch (error) {
      this.pendingRequests.delete(cacheKey);
      console.error('[OptimizedDataService] Error:', error);
      throw error;
    }
  }

  /**
   * Récupère le profil utilisateur avec les données optimisées
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} options - Options de requête
   * @returns {Promise<Object>} - Profil utilisateur
   */
  async getUserProfile(userId, options = {}) {
    const { forceRefresh } = options;
    
    // Construire la clé de cache
    const cacheKey = `user-profile_${userId}`;
    
    // Vérifier le cache d'abord
    const cachedData = this._getCacheData(cacheKey);
    if (cachedData && !forceRefresh) {
      console.log('[OptimizedDataService] Cache hit for:', cacheKey);
      return cachedData;
    }
    
    // Vérifier s'il y a déjà une requête en cours pour ces données
    if (this.pendingRequests.has(cacheKey)) {
      console.log('[OptimizedDataService] Reusing pending request for:', cacheKey);
      return this.pendingRequests.get(cacheKey);
    }
    
    // Faire une nouvelle requête
    try {
      const promise = this.apiOrchestrator.getUserProfile(userId);
      
      // Stocker la promesse
      this.pendingRequests.set(cacheKey, promise);
      
      // Attendre le résultat
      const result = await promise;
      
      // Mettre en cache le résultat
      this._setCacheData(cacheKey, result, 'user');
      
      // Supprimer des requêtes en cours
      this.pendingRequests.delete(cacheKey);
      
      return result;
    } catch (error) {
      this.pendingRequests.delete(cacheKey);
      console.error('[OptimizedDataService] Error:', error);
      throw error;
    }
  }

  /**
   * Récupère les données météo pour un col avec mise en cache
   * @param {string} colId - ID de col
   * @returns {Promise<Object>} - Données météo
   */
  async getWeatherData(colId) {
    const cacheKey = `weather-${colId}`;
    
    // Vérifier le cache d'abord
    const cachedData = this._getCacheData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    
    try {
      // Récupérer les données météo depuis l'orchestrateur d'API
      const result = await this.apiOrchestratorPart2.getColWeather(colId);
      
      // Mettre en cache le résultat
      this._setCacheData(cacheKey, result, 'weather');
      
      return result;
    } catch (error) {
      console.error('[OptimizedDataService] Weather Error:', error);
      throw error;
    }
  }

  /**
   * Stocke les données dans le cache avec expiration
   * @param {string} key - Clé de cache
   * @param {Object} data - Données à mettre en cache
   * @param {string} type - Type de données pour la configuration d'expiration
   * @private
   */
  _setCacheData(key, data, type = 'default') {
    const expiration = this.cacheConfig.expirations[type] || this.cacheConfig.defaultExpiration;
    const expiresAt = Date.now() + expiration;
    
    this.cache.set(key, {
      data,
      expiresAt
    });
  }

  /**
   * Récupère les données en cache si elles n'ont pas expiré
   * @param {string} key - Clé de cache
   * @returns {Object|null} - Données en cache ou null si elles ont expiré
   * @private
   */
  _getCacheData(key) {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }
    
    if (cached.expiresAt < Date.now()) {
      // Expired
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  /**
   * Efface le cache pour une entité spécifique ou entièrement
   * @param {string} entityType - Type d'entité (cols, training-programs, etc.)
   * @param {string} entityId - ID facultatif de l'entité spécifique
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
