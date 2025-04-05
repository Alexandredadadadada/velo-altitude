/**
 * Service de recherche avancée d'itinéraires
 * Permet de rechercher des itinéraires selon divers critères (région, difficulté, cols, etc.)
 */

const mongoose = require('mongoose');
const logger = require('../utils/logger');
const cacheService = require('./cache.service').getInstance();
const errorService = require('./error.service').getInstance();

class RouteSearchService {
  constructor() {
    this.Route = mongoose.model('Route');
    this.Pass = mongoose.model('Pass');
    this.initialized = false;
    this.CACHE_NAMESPACE = 'route_search';
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
      
      this.initialized = true;
      logger.info('Service de recherche d\'itinéraires initialisé');
      return true;
    } catch (error) {
      logger.error(`Erreur lors de l'initialisation du service de recherche d'itinéraires: ${error.message}`);
      return false;
    }
  }

  /**
   * Recherche avancée d'itinéraires selon plusieurs critères
   * @param {Object} criteria - Critères de recherche
   * @param {Object} options - Options de pagination et tri
   * @returns {Promise<Object>} Résultats de la recherche avec pagination
   */
  async searchRoutes(criteria = {}, options = {}) {
    if (!this.initialized) await this.initialize();
    
    try {
      // Construire la clé de cache
      const cacheKey = `${this.CACHE_NAMESPACE}:${JSON.stringify(criteria)}:${JSON.stringify(options)}`;
      
      // Vérifier si les résultats sont en cache
      const cachedResults = await cacheService.get(cacheKey);
      if (cachedResults) {
        logger.debug(`Résultats de recherche récupérés depuis le cache: ${cacheKey}`);
        return cachedResults;
      }
      
      // Construire le filtre MongoDB
      const filter = this._buildFilter(criteria);
      
      // Options de pagination et tri
      const skip = options.skip || 0;
      const limit = options.limit || 20;
      const sort = options.sort || { createdAt: -1 };
      
      // Exécuter la requête
      const routes = await this.Route.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('user', 'firstName lastName profilePicture')
        .lean();
      
      // Compter le nombre total de résultats
      const total = await this.Route.countDocuments(filter);
      
      // Enrichir les résultats avec des informations supplémentaires
      const enrichedRoutes = await this._enrichRouteResults(routes);
      
      // Préparer la réponse
      const results = {
        data: enrichedRoutes,
        pagination: {
          total,
          skip,
          limit,
          pages: Math.ceil(total / limit),
          currentPage: Math.floor(skip / limit) + 1
        },
        meta: {
          criteria,
          timestamp: new Date()
        }
      };
      
      // Mettre en cache les résultats
      await cacheService.set(cacheKey, results, this.CACHE_TTL);
      
      return results;
    } catch (error) {
      logger.error(`Erreur lors de la recherche d'itinéraires: ${error.message}`);
      throw errorService.createError(
        'SEARCH_ERROR',
        'Erreur lors de la recherche d\'itinéraires',
        { details: error.message }
      );
    }
  }

  /**
   * Recherche d'itinéraires passant par des cols spécifiques
   * @param {Array<string>} passIds - IDs des cols
   * @param {Object} options - Options de pagination et tri
   * @returns {Promise<Object>} Résultats de la recherche
   */
  async searchRoutesByPasses(passIds, options = {}) {
    if (!this.initialized) await this.initialize();
    
    try {
      // Récupérer les coordonnées des cols
      const passes = await this.Pass.find({ _id: { $in: passIds } })
        .select('name location.coordinates')
        .lean();
      
      if (!passes.length) {
        return { data: [], pagination: { total: 0 } };
      }
      
      // Extraire les coordonnées
      const passCoordinates = passes.map(pass => pass.location.coordinates);
      
      // Rechercher les itinéraires qui passent près de ces cols
      const routes = await this.Route.find({
        route: {
          $geoIntersects: {
            $geometry: {
              type: 'MultiPoint',
              coordinates: passCoordinates
            }
          }
        }
      })
      .sort(options.sort || { createdAt: -1 })
      .skip(options.skip || 0)
      .limit(options.limit || 20)
      .populate('user', 'firstName lastName profilePicture')
      .lean();
      
      // Compter le nombre total
      const total = await this.Route.countDocuments({
        route: {
          $geoIntersects: {
            $geometry: {
              type: 'MultiPoint',
              coordinates: passCoordinates
            }
          }
        }
      });
      
      // Enrichir les résultats
      const enrichedRoutes = await this._enrichRouteResults(routes, passes);
      
      return {
        data: enrichedRoutes,
        pagination: {
          total,
          skip: options.skip || 0,
          limit: options.limit || 20,
          pages: Math.ceil(total / (options.limit || 20)),
          currentPage: Math.floor((options.skip || 0) / (options.limit || 20)) + 1
        },
        meta: {
          passes: passes.map(p => ({ id: p._id, name: p.name })),
          timestamp: new Date()
        }
      };
    } catch (error) {
      logger.error(`Erreur lors de la recherche d'itinéraires par cols: ${error.message}`);
      throw errorService.createError(
        'SEARCH_ERROR',
        'Erreur lors de la recherche d\'itinéraires par cols',
        { details: error.message }
      );
    }
  }

  /**
   * Recherche d'itinéraires dans une région géographique
   * @param {Array<number>} bbox - Bounding box [minLon, minLat, maxLon, maxLat]
   * @param {Object} options - Options supplémentaires
   * @returns {Promise<Object>} Résultats de la recherche
   */
  async searchRoutesByRegion(bbox, options = {}) {
    if (!this.initialized) await this.initialize();
    
    try {
      // Valider la bounding box
      if (!bbox || bbox.length !== 4) {
        throw new Error('Bounding box invalide');
      }
      
      // Construire le polygone de la région
      const polygon = {
        type: 'Polygon',
        coordinates: [[
          [bbox[0], bbox[1]], // minLon, minLat
          [bbox[2], bbox[1]], // maxLon, minLat
          [bbox[2], bbox[3]], // maxLon, maxLat
          [bbox[0], bbox[3]], // minLon, maxLat
          [bbox[0], bbox[1]]  // Fermer le polygone
        ]]
      };
      
      // Critères supplémentaires
      const additionalCriteria = this._buildFilter(options.criteria || {});
      
      // Rechercher les itinéraires dans cette région
      const filter = {
        ...additionalCriteria,
        $or: [
          { 'start.coordinates': { $geoWithin: { $geometry: polygon } } },
          { 'end.coordinates': { $geoWithin: { $geometry: polygon } } },
          { 
            route: { 
              $geoIntersects: { 
                $geometry: polygon 
              } 
            } 
          }
        ]
      };
      
      // Exécuter la requête
      const routes = await this.Route.find(filter)
        .sort(options.sort || { createdAt: -1 })
        .skip(options.skip || 0)
        .limit(options.limit || 20)
        .populate('user', 'firstName lastName profilePicture')
        .lean();
      
      // Compter le nombre total
      const total = await this.Route.countDocuments(filter);
      
      // Enrichir les résultats
      const enrichedRoutes = await this._enrichRouteResults(routes);
      
      return {
        data: enrichedRoutes,
        pagination: {
          total,
          skip: options.skip || 0,
          limit: options.limit || 20,
          pages: Math.ceil(total / (options.limit || 20)),
          currentPage: Math.floor((options.skip || 0) / (options.limit || 20)) + 1
        },
        meta: {
          region: {
            bbox,
            center: [
              (bbox[0] + bbox[2]) / 2, // Center longitude
              (bbox[1] + bbox[3]) / 2  // Center latitude
            ]
          },
          timestamp: new Date()
        }
      };
    } catch (error) {
      logger.error(`Erreur lors de la recherche d'itinéraires par région: ${error.message}`);
      throw errorService.createError(
        'SEARCH_ERROR',
        'Erreur lors de la recherche d\'itinéraires par région',
        { details: error.message }
      );
    }
  }

  /**
   * Recherche d'itinéraires similaires à un itinéraire donné
   * @param {string} routeId - ID de l'itinéraire de référence
   * @param {Object} options - Options supplémentaires
   * @returns {Promise<Object>} Itinéraires similaires
   */
  async findSimilarRoutes(routeId, options = {}) {
    if (!this.initialized) await this.initialize();
    
    try {
      // Récupérer l'itinéraire de référence
      const referenceRoute = await this.Route.findById(routeId).lean();
      
      if (!referenceRoute) {
        throw new Error('Itinéraire de référence non trouvé');
      }
      
      // Construire la clé de cache
      const cacheKey = `${this.CACHE_NAMESPACE}:similar:${routeId}:${JSON.stringify(options)}`;
      
      // Vérifier si les résultats sont en cache
      const cachedResults = await cacheService.get(cacheKey);
      if (cachedResults) {
        logger.debug(`Itinéraires similaires récupérés depuis le cache: ${cacheKey}`);
        return cachedResults;
      }
      
      // Critères de similarité
      const distanceRange = {
        min: referenceRoute.distance * 0.7,  // 70% de la distance
        max: referenceRoute.distance * 1.3   // 130% de la distance
      };
      
      const elevationRange = {
        min: referenceRoute.elevation.gain * 0.7,
        max: referenceRoute.elevation.gain * 1.3
      };
      
      // Rechercher des itinéraires similaires
      const filter = {
        _id: { $ne: routeId },
        distance: { $gte: distanceRange.min, $lte: distanceRange.max },
        'elevation.gain': { $gte: elevationRange.min, $lte: elevationRange.max },
        difficulty: referenceRoute.difficulty,
        isPublic: true
      };
      
      // Ajouter un critère de proximité géographique
      if (referenceRoute.start && referenceRoute.start.coordinates) {
        filter['start.coordinates'] = {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: referenceRoute.start.coordinates
            },
            $maxDistance: 50000 // 50km
          }
        };
      }
      
      // Exécuter la requête
      const routes = await this.Route.find(filter)
        .sort(options.sort || { createdAt: -1 })
        .limit(options.limit || 5)
        .populate('user', 'firstName lastName profilePicture')
        .lean();
      
      // Enrichir les résultats
      const enrichedRoutes = await this._enrichRouteResults(routes);
      
      // Préparer la réponse
      const results = {
        data: enrichedRoutes,
        meta: {
          referenceRoute: {
            id: referenceRoute._id,
            name: referenceRoute.name,
            distance: referenceRoute.distance,
            elevation: referenceRoute.elevation
          },
          timestamp: new Date()
        }
      };
      
      // Mettre en cache les résultats
      await cacheService.set(cacheKey, results, this.CACHE_TTL);
      
      return results;
    } catch (error) {
      logger.error(`Erreur lors de la recherche d'itinéraires similaires: ${error.message}`);
      throw errorService.createError(
        'SEARCH_ERROR',
        'Erreur lors de la recherche d\'itinéraires similaires',
        { details: error.message }
      );
    }
  }

  /**
   * Construit le filtre MongoDB à partir des critères de recherche
   * @param {Object} criteria - Critères de recherche
   * @returns {Object} Filtre MongoDB
   * @private
   */
  _buildFilter(criteria) {
    const filter = {};
    
    // Filtrer par utilisateur
    if (criteria.userId) {
      filter.user = mongoose.Types.ObjectId(criteria.userId);
    }
    
    // Filtrer par visibilité
    if (criteria.hasOwnProperty('isPublic')) {
      filter.isPublic = criteria.isPublic;
    }
    
    // Filtrer par difficulté
    if (criteria.difficulty) {
      filter.difficulty = Array.isArray(criteria.difficulty) 
        ? { $in: criteria.difficulty }
        : criteria.difficulty;
    }
    
    // Filtrer par profil de cyclisme
    if (criteria.profile) {
      filter.profile = Array.isArray(criteria.profile)
        ? { $in: criteria.profile }
        : criteria.profile;
    }
    
    // Filtrer par surface
    if (criteria.surface) {
      filter.surface = Array.isArray(criteria.surface)
        ? { $in: criteria.surface }
        : criteria.surface;
    }
    
    // Filtrer par saison
    if (criteria.season) {
      filter.season = Array.isArray(criteria.season)
        ? { $in: criteria.season }
        : criteria.season;
    }
    
    // Filtrer par tags
    if (criteria.tags && criteria.tags.length) {
      filter.tags = { $in: criteria.tags };
    }
    
    // Filtrer par distance
    if (criteria.distance) {
      filter.distance = {};
      
      if (criteria.distance.min) {
        filter.distance.$gte = parseFloat(criteria.distance.min);
      }
      
      if (criteria.distance.max) {
        filter.distance.$lte = parseFloat(criteria.distance.max);
      }
    }
    
    // Filtrer par élévation
    if (criteria.elevation) {
      filter['elevation.gain'] = {};
      
      if (criteria.elevation.min) {
        filter['elevation.gain'].$gte = parseFloat(criteria.elevation.min);
      }
      
      if (criteria.elevation.max) {
        filter['elevation.gain'].$lte = parseFloat(criteria.elevation.max);
      }
    }
    
    // Filtrer par date de création
    if (criteria.createdAt) {
      filter.createdAt = {};
      
      if (criteria.createdAt.start) {
        filter.createdAt.$gte = new Date(criteria.createdAt.start);
      }
      
      if (criteria.createdAt.end) {
        filter.createdAt.$lte = new Date(criteria.createdAt.end);
      }
    }
    
    // Recherche textuelle
    if (criteria.search) {
      filter.$text = { $search: criteria.search };
    }
    
    return filter;
  }

  /**
   * Enrichit les résultats de recherche avec des informations supplémentaires
   * @param {Array<Object>} routes - Itinéraires à enrichir
   * @param {Array<Object>} passes - Cols (optionnel)
   * @returns {Promise<Array<Object>>} Itinéraires enrichis
   * @private
   */
  async _enrichRouteResults(routes, passes = []) {
    if (!routes.length) return [];
    
    try {
      // Simplifier les données GeoJSON pour alléger la réponse
      const enrichedRoutes = routes.map(route => {
        // Créer une copie pour ne pas modifier l'original
        const enriched = { ...route };
        
        // Simplifier les données GeoJSON si elles sont trop volumineuses
        if (enriched.route && typeof enriched.route === 'object') {
          const routeString = JSON.stringify(enriched.route);
          if (routeString.length > 10000) {
            // Conserver uniquement les métadonnées et un aperçu simplifié
            enriched.routeSimplified = true;
            enriched.route = {
              type: 'FeatureCollection',
              properties: enriched.route.properties || {},
              summary: enriched.route.summary || {}
            };
          }
        }
        
        // Ajouter des informations sur les cols traversés
        if (passes.length > 0) {
          enriched.passes = passes.filter(pass => {
            // Vérifier si l'itinéraire passe près du col
            // Cette logique simplifiée devrait être remplacée par une vérification géospatiale plus précise
            if (!enriched.route || !enriched.route.coordinates) return false;
            
            // Logique simplifiée pour l'exemple
            return true;
          }).map(pass => ({
            id: pass._id,
            name: pass.name,
            coordinates: pass.location.coordinates
          }));
        }
        
        return enriched;
      });
      
      return enrichedRoutes;
    } catch (error) {
      logger.error(`Erreur lors de l'enrichissement des résultats: ${error.message}`);
      return routes; // Retourner les routes non enrichies en cas d'erreur
    }
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
 * @returns {RouteSearchService} Instance du service
 */
module.exports.getInstance = () => {
  if (!instance) {
    instance = new RouteSearchService();
  }
  return instance;
};

module.exports.RouteSearchService = RouteSearchService;
