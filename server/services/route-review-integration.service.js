/**
 * Service d'intégration pour les avis sur les itinéraires
 * Permet de lier les avis aux cols européens et d'enrichir les données
 */
const mongoose = require('mongoose');
const logger = require('../utils/logger');
const cacheService = require('./cache.service').getInstance();
const errorService = require('./error.service').getInstance();

class RouteReviewIntegrationService {
  constructor() {
    this.Route = mongoose.model('Route');
    this.Pass = mongoose.model('Pass');
    this.RouteReview = mongoose.model('RouteReview');
    this.initialized = false;
    this.CACHE_NAMESPACE = 'route_review_integration';
    this.CACHE_TTL = 3600; // 1 heure
  }

  /**
   * Initialise le service
   */
  async initialize() {
    try {
      // Vérifier que les modèles sont chargés
      if (!mongoose.modelNames().includes('Route')) {
        this.Route = require('../models/route.model');
      }
      
      if (!mongoose.modelNames().includes('Pass')) {
        this.Pass = require('../models/pass.model');
      }
      
      if (!mongoose.modelNames().includes('RouteReview')) {
        this.RouteReview = require('../models/route-review.model');
      }
      
      this.initialized = true;
      logger.info('Service d\'intégration des avis initialisé');
      return true;
    } catch (error) {
      logger.error(`Erreur lors de l'initialisation du service d'intégration des avis: ${error.message}`);
      return false;
    }
  }

  /**
   * Recherche des itinéraires en fonction des avis sur les cols qu'ils contiennent
   * @param {Array<string>} passIds - IDs des cols
   * @param {Object} reviewCriteria - Critères de filtrage des avis (note minimale, etc.)
   * @param {Object} options - Options de pagination et tri
   * @returns {Promise<Object>} Résultats de la recherche
   */
  async findRoutesByPassReviews(passIds, reviewCriteria = {}, options = {}) {
    if (!this.initialized) await this.initialize();
    
    try {
      // Construire la clé de cache
      const cacheKey = `${this.CACHE_NAMESPACE}:pass_reviews:${JSON.stringify(passIds)}:${JSON.stringify(reviewCriteria)}:${JSON.stringify(options)}`;
      
      // Vérifier si les résultats sont en cache
      const cachedResults = await cacheService.get(cacheKey);
      if (cachedResults) {
        logger.debug(`Résultats de recherche par cols récupérés depuis le cache: ${cacheKey}`);
        return cachedResults;
      }
      
      // Récupérer les cols avec leurs statistiques d'avis
      const passes = await this.Pass.find({ _id: { $in: passIds } })
        .select('name location ratings')
        .lean();
      
      if (!passes.length) {
        return { data: [], pagination: { total: 0 } };
      }
      
      // Filtrer les cols en fonction des critères d'avis
      const filteredPasses = passes.filter(pass => {
        if (!pass.ratings) return false;
        
        // Vérifier la note moyenne minimale
        if (reviewCriteria.minRating && pass.ratings.average < reviewCriteria.minRating) {
          return false;
        }
        
        // Vérifier le nombre minimal d'avis
        if (reviewCriteria.minReviews && pass.ratings.count < reviewCriteria.minReviews) {
          return false;
        }
        
        // Vérifier les critères spécifiques
        if (reviewCriteria.minDifficulty && pass.ratings.difficulty < reviewCriteria.minDifficulty) {
          return false;
        }
        
        if (reviewCriteria.minScenery && pass.ratings.scenery < reviewCriteria.minScenery) {
          return false;
        }
        
        return true;
      });
      
      if (!filteredPasses.length) {
        return { data: [], pagination: { total: 0 } };
      }
      
      // Extraire les coordonnées des cols filtrés
      const passCoordinates = filteredPasses.map(pass => pass.location.coordinates);
      
      // Rechercher les itinéraires qui passent par ces cols
      const query = {
        route: {
          $geoIntersects: {
            $geometry: {
              type: 'MultiPoint',
              coordinates: passCoordinates
            }
          }
        }
      };
      
      // Ajouter des critères de filtrage supplémentaires pour les itinéraires
      if (reviewCriteria.routeMinRating) {
        query['ratings.average'] = { $gte: reviewCriteria.routeMinRating };
      }
      
      if (reviewCriteria.routeMinReviews) {
        query['ratings.count'] = { $gte: reviewCriteria.routeMinReviews };
      }
      
      // Exécuter la requête
      const routes = await this.Route.find(query)
        .sort(options.sort || { 'ratings.average': -1 })
        .skip(options.skip || 0)
        .limit(options.limit || 20)
        .populate('user', 'firstName lastName profilePicture')
        .lean();
      
      // Compter le nombre total
      const total = await this.Route.countDocuments(query);
      
      // Enrichir les résultats avec des informations sur les cols
      const enrichedRoutes = await this._enrichRoutesWithPassInfo(routes, filteredPasses);
      
      // Préparer la réponse
      const results = {
        data: enrichedRoutes,
        pagination: {
          total,
          skip: options.skip || 0,
          limit: options.limit || 20,
          pages: Math.ceil(total / (options.limit || 20)),
          currentPage: Math.floor((options.skip || 0) / (options.limit || 20)) + 1
        },
        meta: {
          passes: filteredPasses.map(p => ({
            id: p._id,
            name: p.name,
            ratings: p.ratings
          })),
          criteria: reviewCriteria,
          timestamp: new Date()
        }
      };
      
      // Mettre en cache les résultats
      await cacheService.set(cacheKey, results, this.CACHE_TTL);
      
      return results;
    } catch (error) {
      logger.error(`Erreur lors de la recherche d'itinéraires par avis sur cols: ${error.message}`);
      throw errorService.createError(
        'SEARCH_ERROR',
        'Erreur lors de la recherche d\'itinéraires par avis sur cols',
        { details: error.message }
      );
    }
  }

  /**
   * Génère des recommandations d'itinéraires basées sur les préférences utilisateur et les avis
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} preferences - Préférences de l'utilisateur (optionnel)
   * @param {Object} options - Options de pagination et tri
   * @returns {Promise<Object>} Itinéraires recommandés
   */
  async generateRecommendations(userId, preferences = {}, options = {}) {
    if (!this.initialized) await this.initialize();
    
    try {
      // Construire la clé de cache
      const cacheKey = `${this.CACHE_NAMESPACE}:recommendations:${userId}:${JSON.stringify(preferences)}:${JSON.stringify(options)}`;
      
      // Vérifier si les résultats sont en cache
      const cachedResults = await cacheService.get(cacheKey);
      if (cachedResults) {
        logger.debug(`Recommandations récupérées depuis le cache: ${cacheKey}`);
        return cachedResults;
      }
      
      // Récupérer les avis de l'utilisateur
      const userReviews = await this.RouteReview.find({ user: userId })
        .populate('route', 'difficulty profile surface season tags')
        .lean();
      
      // Si l'utilisateur n'a pas d'avis, utiliser uniquement ses préférences
      if (!userReviews.length && !Object.keys(preferences).length) {
        // Retourner des itinéraires populaires par défaut
        return this._getPopularRoutes(options);
      }
      
      // Extraire les préférences à partir des avis de l'utilisateur
      const extractedPreferences = this._extractPreferencesFromReviews(userReviews);
      
      // Fusionner avec les préférences explicites
      const mergedPreferences = {
        ...extractedPreferences,
        ...preferences
      };
      
      // Construire la requête de recommandation
      const query = this._buildRecommendationQuery(mergedPreferences);
      
      // Exécuter la requête
      const routes = await this.Route.find(query)
        .sort(options.sort || { 'ratings.average': -1, createdAt: -1 })
        .skip(options.skip || 0)
        .limit(options.limit || 10)
        .populate('user', 'firstName lastName profilePicture')
        .lean();
      
      // Compter le nombre total
      const total = await this.Route.countDocuments(query);
      
      // Préparer la réponse
      const results = {
        data: routes,
        pagination: {
          total,
          skip: options.skip || 0,
          limit: options.limit || 10,
          pages: Math.ceil(total / (options.limit || 10)),
          currentPage: Math.floor((options.skip || 0) / (options.limit || 10)) + 1
        },
        meta: {
          preferences: mergedPreferences,
          timestamp: new Date()
        }
      };
      
      // Mettre en cache les résultats
      await cacheService.set(cacheKey, results, this.CACHE_TTL);
      
      return results;
    } catch (error) {
      logger.error(`Erreur lors de la génération de recommandations: ${error.message}`);
      throw errorService.createError(
        'RECOMMENDATION_ERROR',
        'Erreur lors de la génération de recommandations',
        { details: error.message }
      );
    }
  }

  /**
   * Obtient des statistiques sur les itinéraires incluant des cols populaires
   * @param {number} minRating - Note minimale pour considérer un col comme populaire
   * @param {number} minReviews - Nombre minimal d'avis pour considérer un col comme populaire
   * @returns {Promise<Object>} Statistiques
   */
  async getPopularPassesStatistics(minRating = 4, minReviews = 5) {
    if (!this.initialized) await this.initialize();
    
    try {
      // Construire la clé de cache
      const cacheKey = `${this.CACHE_NAMESPACE}:popular_passes_stats:${minRating}:${minReviews}`;
      
      // Vérifier si les résultats sont en cache
      const cachedResults = await cacheService.get(cacheKey);
      if (cachedResults) {
        logger.debug(`Statistiques des cols populaires récupérées depuis le cache: ${cacheKey}`);
        return cachedResults;
      }
      
      // Trouver les cols populaires
      const popularPasses = await this.Pass.find({
        'ratings.average': { $gte: minRating },
        'ratings.count': { $gte: minReviews }
      })
      .sort({ 'ratings.average': -1, 'ratings.count': -1 })
      .limit(20)
      .lean();
      
      if (!popularPasses.length) {
        return { passes: [], routeStats: {} };
      }
      
      // Extraire les IDs des cols populaires
      const passIds = popularPasses.map(pass => pass._id);
      
      // Agréger les statistiques des itinéraires qui incluent ces cols
      const routeStats = await this.Route.aggregate([
        {
          $match: {
            passesCrossed: { $in: passIds }
          }
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            avgDistance: { $avg: '$distance' },
            avgElevation: { $avg: '$elevation.gain' },
            avgRating: { $avg: '$ratings.average' },
            byDifficulty: {
              $push: {
                k: '$difficulty',
                v: 1
              }
            },
            bySurface: {
              $push: {
                k: '$surface',
                v: 1
              }
            },
            byProfile: {
              $push: {
                k: '$profile',
                v: 1
              }
            }
          }
        },
        {
          $project: {
            _id: 0,
            count: 1,
            avgDistance: 1,
            avgElevation: 1,
            avgRating: 1,
            byDifficulty: { $arrayToObject: '$byDifficulty' },
            bySurface: { $arrayToObject: '$bySurface' },
            byProfile: { $arrayToObject: '$byProfile' }
          }
        }
      ]);
      
      // Préparer la réponse
      const results = {
        passes: popularPasses.map(pass => ({
          id: pass._id,
          name: pass.name,
          location: pass.location,
          ratings: pass.ratings,
          elevation: pass.elevation
        })),
        routeStats: routeStats.length > 0 ? routeStats[0] : {
          count: 0,
          avgDistance: 0,
          avgElevation: 0,
          avgRating: 0
        }
      };
      
      // Mettre en cache les résultats
      await cacheService.set(cacheKey, results, this.CACHE_TTL * 6); // Cache plus long (6h)
      
      return results;
    } catch (error) {
      logger.error(`Erreur lors de la récupération des statistiques des cols populaires: ${error.message}`);
      throw errorService.createError(
        'STATS_ERROR',
        'Erreur lors de la récupération des statistiques des cols populaires',
        { details: error.message }
      );
    }
  }

  /**
   * Enrichit les itinéraires avec des informations sur les cols qu'ils traversent
   * @param {Array<Object>} routes - Itinéraires à enrichir
   * @param {Array<Object>} passes - Cols
   * @returns {Promise<Array<Object>>} Itinéraires enrichis
   * @private
   */
  async _enrichRoutesWithPassInfo(routes, passes) {
    if (!routes.length || !passes.length) return routes;
    
    try {
      return routes.map(route => {
        // Créer une copie pour ne pas modifier l'original
        const enriched = { ...route };
        
        // Ajouter des informations sur les cols traversés
        enriched.passes = passes.filter(pass => {
          // Vérifier si l'itinéraire passe près du col
          // Cette logique simplifiée devrait être remplacée par une vérification géospatiale plus précise
          if (!enriched.route || !enriched.route.coordinates) return false;
          
          // Si l'itinéraire a déjà une liste de cols traversés
          if (enriched.passesCrossed && enriched.passesCrossed.includes(pass._id.toString())) {
            return true;
          }
          
          // Logique simplifiée pour l'exemple
          return true;
        }).map(pass => ({
          id: pass._id,
          name: pass.name,
          coordinates: pass.location.coordinates,
          ratings: pass.ratings
        }));
        
        return enriched;
      });
    } catch (error) {
      logger.error(`Erreur lors de l'enrichissement des itinéraires: ${error.message}`);
      return routes; // Retourner les itinéraires non enrichis en cas d'erreur
    }
  }

  /**
   * Extrait les préférences utilisateur à partir de ses avis
   * @param {Array<Object>} reviews - Avis de l'utilisateur
   * @returns {Object} Préférences extraites
   * @private
   */
  _extractPreferencesFromReviews(reviews) {
    if (!reviews.length) return {};
    
    // Initialiser les compteurs
    const difficulties = {};
    const profiles = {};
    const surfaces = {};
    const seasons = {};
    const tags = {};
    
    // Analyser les avis
    reviews.forEach(review => {
      if (!review.route) return;
      
      // Compter uniquement les avis positifs (note >= 4)
      if (review.rating >= 4) {
        // Incrémenter les compteurs pour chaque attribut
        if (review.route.difficulty) {
          difficulties[review.route.difficulty] = (difficulties[review.route.difficulty] || 0) + 1;
        }
        
        if (review.route.profile) {
          profiles[review.route.profile] = (profiles[review.route.profile] || 0) + 1;
        }
        
        if (review.route.surface) {
          surfaces[review.route.surface] = (surfaces[review.route.surface] || 0) + 1;
        }
        
        if (review.route.season) {
          seasons[review.route.season] = (seasons[review.route.season] || 0) + 1;
        }
        
        // Traiter les tags
        if (review.route.tags && Array.isArray(review.route.tags)) {
          review.route.tags.forEach(tag => {
            tags[tag] = (tags[tag] || 0) + 1;
          });
        }
      }
    });
    
    // Trouver les valeurs les plus fréquentes
    const preferences = {};
    
    if (Object.keys(difficulties).length) {
      preferences.difficulty = this._getMostFrequent(difficulties);
    }
    
    if (Object.keys(profiles).length) {
      preferences.profile = this._getMostFrequent(profiles);
    }
    
    if (Object.keys(surfaces).length) {
      preferences.surface = this._getMostFrequent(surfaces);
    }
    
    if (Object.keys(seasons).length) {
      preferences.season = this._getMostFrequent(seasons);
    }
    
    // Extraire les tags les plus fréquents (max 3)
    if (Object.keys(tags).length) {
      preferences.tags = this._getMostFrequentTags(tags, 3);
    }
    
    return preferences;
  }

  /**
   * Construit une requête de recommandation basée sur les préférences
   * @param {Object} preferences - Préférences utilisateur
   * @returns {Object} Requête MongoDB
   * @private
   */
  _buildRecommendationQuery(preferences) {
    const query = {
      isPublic: true,
      'ratings.count': { $gte: 1 } // Au moins un avis
    };
    
    // Ajouter les critères de difficulté
    if (preferences.difficulty) {
      query.difficulty = preferences.difficulty;
    }
    
    // Ajouter les critères de profil
    if (preferences.profile) {
      query.profile = preferences.profile;
    }
    
    // Ajouter les critères de surface
    if (preferences.surface) {
      query.surface = preferences.surface;
    }
    
    // Ajouter les critères de saison
    if (preferences.season) {
      query.season = preferences.season;
    }
    
    // Ajouter les critères de tags
    if (preferences.tags && preferences.tags.length) {
      query.tags = { $in: preferences.tags };
    }
    
    // Ajouter les critères de distance
    if (preferences.minDistance || preferences.maxDistance) {
      query.distance = {};
      
      if (preferences.minDistance) {
        query.distance.$gte = preferences.minDistance;
      }
      
      if (preferences.maxDistance) {
        query.distance.$lte = preferences.maxDistance;
      }
    }
    
    // Ajouter les critères d'élévation
    if (preferences.minElevation || preferences.maxElevation) {
      query['elevation.gain'] = {};
      
      if (preferences.minElevation) {
        query['elevation.gain'].$gte = preferences.minElevation;
      }
      
      if (preferences.maxElevation) {
        query['elevation.gain'].$lte = preferences.maxElevation;
      }
    }
    
    return query;
  }

  /**
   * Récupère les itinéraires les plus populaires
   * @param {Object} options - Options de pagination et tri
   * @returns {Promise<Object>} Itinéraires populaires
   * @private
   */
  async _getPopularRoutes(options) {
    try {
      // Requête pour trouver les itinéraires populaires
      const query = {
        isPublic: true,
        'ratings.count': { $gte: 3 }, // Au moins 3 avis
        'ratings.average': { $gte: 4 } // Note moyenne d'au moins 4
      };
      
      // Exécuter la requête
      const routes = await this.Route.find(query)
        .sort({ 'ratings.average': -1, 'ratings.count': -1 })
        .skip(options.skip || 0)
        .limit(options.limit || 10)
        .populate('user', 'firstName lastName profilePicture')
        .lean();
      
      // Compter le nombre total
      const total = await this.Route.countDocuments(query);
      
      return {
        data: routes,
        pagination: {
          total,
          skip: options.skip || 0,
          limit: options.limit || 10,
          pages: Math.ceil(total / (options.limit || 10)),
          currentPage: Math.floor((options.skip || 0) / (options.limit || 10)) + 1
        },
        meta: {
          type: 'popular_routes',
          timestamp: new Date()
        }
      };
    } catch (error) {
      logger.error(`Erreur lors de la récupération des itinéraires populaires: ${error.message}`);
      throw errorService.createError(
        'SEARCH_ERROR',
        'Erreur lors de la récupération des itinéraires populaires',
        { details: error.message }
      );
    }
  }

  /**
   * Trouve la valeur la plus fréquente dans un objet de compteurs
   * @param {Object} counters - Objet de compteurs
   * @returns {string} Valeur la plus fréquente
   * @private
   */
  _getMostFrequent(counters) {
    let maxCount = 0;
    let mostFrequent = null;
    
    for (const [key, count] of Object.entries(counters)) {
      if (count > maxCount) {
        maxCount = count;
        mostFrequent = key;
      }
    }
    
    return mostFrequent;
  }

  /**
   * Trouve les tags les plus fréquents
   * @param {Object} tagCounters - Objet de compteurs de tags
   * @param {number} limit - Nombre maximum de tags à retourner
   * @returns {Array<string>} Tags les plus fréquents
   * @private
   */
  _getMostFrequentTags(tagCounters, limit = 3) {
    return Object.entries(tagCounters)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(entry => entry[0]);
  }

  /**
   * Obtient l'état de santé du service
   * @returns {Object} État de santé
   */
  async getHealth() {
    return {
      status: this.initialized ? 'healthy' : 'degraded',
      initialized: this.initialized,
      timestamp: new Date().toISOString()
    };
  }
}

// Singleton
let instance = null;

/**
 * Obtient l'instance du service
 * @returns {RouteReviewIntegrationService} Instance du service
 */
module.exports.getInstance = () => {
  if (!instance) {
    instance = new RouteReviewIntegrationService();
  }
  return instance;
};

module.exports.RouteReviewIntegrationService = RouteReviewIntegrationService;
