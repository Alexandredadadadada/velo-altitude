/**
 * Service de pagination côté serveur
 * Ce service fournit des fonctionnalités pour gérer la pagination des résultats de requêtes
 */

const logger = require('../config/logger');

class PaginationService {
  constructor() {
    // Configuration par défaut
    this.defaultConfig = {
      defaultPage: 1,
      defaultLimit: 20,
      maxLimit: 100,
      defaultSort: { createdAt: -1 }
    };
    
    // Cache des dernières requêtes paginées par utilisateur
    this.userQueryCache = new Map();
    
    // Durée de vie du cache (en ms)
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes
    
    logger.info('Service de pagination initialisé');
  }
  
  /**
   * Génère les options de pagination pour une requête MongoDB
   * @param {Object} query - Paramètres de requête (req.query)
   * @param {Object} options - Options supplémentaires
   * @returns {Object} Options de pagination pour MongoDB
   */
  getPaginationOptions(query, options = {}) {
    // Fusionner les options par défaut avec celles fournies
    const config = { ...this.defaultConfig, ...options };
    
    // Extraire et valider les paramètres de pagination
    const page = this._parsePageParam(query.page, config.defaultPage);
    const limit = this._parseLimitParam(query.limit, config.defaultLimit, config.maxLimit);
    const skip = (page - 1) * limit;
    
    // Extraire et valider les paramètres de tri
    const sort = this._parseSortParam(query.sort, config.defaultSort);
    
    // Construire les options de pagination
    return {
      page,
      limit,
      skip,
      sort
    };
  }
  
  /**
   * Génère une réponse paginée standardisée
   * @param {Array} data - Données à paginer
   * @param {number} total - Nombre total d'éléments
   * @param {Object} paginationOptions - Options de pagination
   * @param {Object} additionalData - Données supplémentaires à inclure dans la réponse
   * @returns {Object} Réponse paginée standardisée
   */
  createPaginatedResponse(data, total, paginationOptions, additionalData = {}) {
    const { page, limit } = paginationOptions;
    const totalPages = Math.ceil(total / limit);
    
    return {
      data,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        nextPage: page < totalPages ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null
      },
      ...additionalData
    };
  }
  
  /**
   * Mémorise la dernière requête paginée d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {string} resourceType - Type de ressource (ex: 'events', 'users')
   * @param {Object} query - Paramètres de requête
   * @param {Object} paginationOptions - Options de pagination
   */
  cacheUserQuery(userId, resourceType, query, paginationOptions) {
    if (!userId) return;
    
    // Créer une clé unique pour cet utilisateur et cette ressource
    const cacheKey = `${userId}:${resourceType}`;
    
    // Stocker les informations de requête
    this.userQueryCache.set(cacheKey, {
      query: { ...query },
      pagination: { ...paginationOptions },
      timestamp: Date.now()
    });
    
    // Nettoyer le cache périodiquement
    this._cleanupCache();
  }
  
  /**
   * Récupère la dernière requête paginée d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {string} resourceType - Type de ressource
   * @returns {Object|null} Dernière requête ou null si non trouvée
   */
  getUserLastQuery(userId, resourceType) {
    if (!userId) return null;
    
    const cacheKey = `${userId}:${resourceType}`;
    const cachedQuery = this.userQueryCache.get(cacheKey);
    
    if (!cachedQuery) return null;
    
    // Vérifier si le cache n'est pas expiré
    if (Date.now() - cachedQuery.timestamp > this.cacheTTL) {
      this.userQueryCache.delete(cacheKey);
      return null;
    }
    
    return {
      query: cachedQuery.query,
      pagination: cachedQuery.pagination
    };
  }
  
  /**
   * Génère des liens de pagination pour l'en-tête Link
   * @param {string} baseUrl - URL de base
   * @param {Object} paginationOptions - Options de pagination
   * @param {number} totalPages - Nombre total de pages
   * @returns {string} En-tête Link formaté
   */
  generateLinkHeader(baseUrl, paginationOptions, totalPages) {
    const { page, limit } = paginationOptions;
    const links = [];
    
    // Lien vers la première page
    links.push(`<${this._buildUrl(baseUrl, { page: 1, limit })}>; rel="first"`);
    
    // Lien vers la page précédente si elle existe
    if (page > 1) {
      links.push(`<${this._buildUrl(baseUrl, { page: page - 1, limit })}>; rel="prev"`);
    }
    
    // Lien vers la page suivante si elle existe
    if (page < totalPages) {
      links.push(`<${this._buildUrl(baseUrl, { page: page + 1, limit })}>; rel="next"`);
    }
    
    // Lien vers la dernière page
    links.push(`<${this._buildUrl(baseUrl, { page: totalPages, limit })}>; rel="last"`);
    
    return links.join(', ');
  }
  
  /**
   * Nettoie les entrées expirées du cache
   * @private
   */
  _cleanupCache() {
    const now = Date.now();
    
    for (const [key, value] of this.userQueryCache.entries()) {
      if (now - value.timestamp > this.cacheTTL) {
        this.userQueryCache.delete(key);
      }
    }
  }
  
  /**
   * Analyse et valide le paramètre de page
   * @param {string|number} pageParam - Paramètre de page
   * @param {number} defaultPage - Page par défaut
   * @returns {number} Numéro de page validé
   * @private
   */
  _parsePageParam(pageParam, defaultPage) {
    const page = parseInt(pageParam, 10);
    return (!isNaN(page) && page > 0) ? page : defaultPage;
  }
  
  /**
   * Analyse et valide le paramètre de limite
   * @param {string|number} limitParam - Paramètre de limite
   * @param {number} defaultLimit - Limite par défaut
   * @param {number} maxLimit - Limite maximale
   * @returns {number} Limite validée
   * @private
   */
  _parseLimitParam(limitParam, defaultLimit, maxLimit) {
    let limit = parseInt(limitParam, 10);
    
    if (isNaN(limit) || limit < 1) {
      return defaultLimit;
    }
    
    return Math.min(limit, maxLimit);
  }
  
  /**
   * Analyse et valide le paramètre de tri
   * @param {string} sortParam - Paramètre de tri (ex: 'name,-createdAt')
   * @param {Object} defaultSort - Tri par défaut
   * @returns {Object} Objet de tri pour MongoDB
   * @private
   */
  _parseSortParam(sortParam, defaultSort) {
    if (!sortParam) {
      return defaultSort;
    }
    
    const sort = {};
    
    sortParam.split(',').forEach(field => {
      if (field.startsWith('-')) {
        sort[field.substring(1)] = -1;
      } else {
        sort[field] = 1;
      }
    });
    
    return Object.keys(sort).length > 0 ? sort : defaultSort;
  }
  
  /**
   * Construit une URL avec des paramètres de requête
   * @param {string} baseUrl - URL de base
   * @param {Object} params - Paramètres à ajouter
   * @returns {string} URL complète
   * @private
   */
  _buildUrl(baseUrl, params) {
    const url = new URL(baseUrl);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        url.searchParams.set(key, value);
      }
    });
    
    return url.toString();
  }
}

// Exporter une instance singleton
let instance = null;

module.exports = {
  getInstance: () => {
    if (!instance) {
      instance = new PaginationService();
    }
    return instance;
  }
};
