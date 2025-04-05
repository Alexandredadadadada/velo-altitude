/**
 * Contrôleur pour les recommandations d'itinéraires
 * Gère l'intégration entre les avis, les cols et les recommandations personnalisées
 */
const mongoose = require('mongoose');
const logger = require('../utils/logger');
const errorService = require('../services/error.service').getInstance();
const routeReviewIntegrationService = require('../services/route-review-integration.service').getInstance();
const cacheService = require('../services/cache.service').getInstance();

class RouteRecommendationController {
  /**
   * Obtient des recommandations d'itinéraires pour un utilisateur
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async getRecommendations(req, res) {
    try {
      const userId = req.user.userId;
      
      // Extraire les préférences de la requête
      const preferences = {
        difficulty: req.query.difficulty,
        profile: req.query.profile,
        surface: req.query.surface,
        season: req.query.season,
        tags: req.query.tags ? req.query.tags.split(',') : undefined,
        minDistance: req.query.minDistance ? parseFloat(req.query.minDistance) : undefined,
        maxDistance: req.query.maxDistance ? parseFloat(req.query.maxDistance) : undefined,
        minElevation: req.query.minElevation ? parseFloat(req.query.minElevation) : undefined,
        maxElevation: req.query.maxElevation ? parseFloat(req.query.maxElevation) : undefined
      };
      
      // Nettoyer les préférences (supprimer les valeurs undefined)
      Object.keys(preferences).forEach(key => {
        if (preferences[key] === undefined) {
          delete preferences[key];
        }
      });
      
      // Options de pagination
      const options = {
        skip: parseInt(req.query.skip) || 0,
        limit: parseInt(req.query.limit) || 10,
        sort: req.query.sort ? JSON.parse(req.query.sort) : { 'ratings.average': -1 }
      };
      
      // Générer les recommandations
      const recommendations = await routeReviewIntegrationService.generateRecommendations(
        userId,
        preferences,
        options
      );
      
      return res.json({
        success: true,
        data: recommendations.data,
        pagination: recommendations.pagination,
        meta: recommendations.meta
      });
    } catch (error) {
      logger.error(`Erreur lors de la génération de recommandations: ${error.message}`, { stack: error.stack });
      return errorService.sendErrorResponse(
        res,
        errorService.ERROR_TYPES.API_ERROR,
        'Erreur lors de la génération de recommandations',
        { details: error.message }
      );
    }
  }

  /**
   * Recherche des itinéraires en fonction des avis sur les cols qu'ils contiennent
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async findRoutesByPassReviews(req, res) {
    try {
      // Extraire les IDs des cols
      const passIds = req.query.passIds ? req.query.passIds.split(',') : [];
      
      if (!passIds.length) {
        return errorService.sendErrorResponse(
          res,
          errorService.ERROR_TYPES.VALIDATION,
          'Veuillez spécifier au moins un col (paramètre passIds)'
        );
      }
      
      // Valider les IDs des cols
      for (const passId of passIds) {
        if (!mongoose.Types.ObjectId.isValid(passId)) {
          return errorService.sendErrorResponse(
            res,
            errorService.ERROR_TYPES.VALIDATION,
            `ID de col invalide: ${passId}`
          );
        }
      }
      
      // Extraire les critères d'avis
      const reviewCriteria = {
        minRating: req.query.minRating ? parseFloat(req.query.minRating) : 3,
        minReviews: req.query.minReviews ? parseInt(req.query.minReviews) : 1,
        minDifficulty: req.query.minDifficulty ? parseFloat(req.query.minDifficulty) : undefined,
        minScenery: req.query.minScenery ? parseFloat(req.query.minScenery) : undefined,
        routeMinRating: req.query.routeMinRating ? parseFloat(req.query.routeMinRating) : undefined,
        routeMinReviews: req.query.routeMinReviews ? parseInt(req.query.routeMinReviews) : undefined
      };
      
      // Options de pagination
      const options = {
        skip: parseInt(req.query.skip) || 0,
        limit: parseInt(req.query.limit) || 20,
        sort: req.query.sort ? JSON.parse(req.query.sort) : { 'ratings.average': -1 }
      };
      
      // Rechercher les itinéraires
      const results = await routeReviewIntegrationService.findRoutesByPassReviews(
        passIds,
        reviewCriteria,
        options
      );
      
      return res.json({
        success: true,
        data: results.data,
        pagination: results.pagination,
        meta: results.meta
      });
    } catch (error) {
      logger.error(`Erreur lors de la recherche d'itinéraires par avis sur cols: ${error.message}`, { stack: error.stack });
      return errorService.sendErrorResponse(
        res,
        errorService.ERROR_TYPES.API_ERROR,
        'Erreur lors de la recherche d\'itinéraires par avis sur cols',
        { details: error.message }
      );
    }
  }

  /**
   * Obtient des statistiques sur les itinéraires incluant des cols populaires
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async getPopularPassesStatistics(req, res) {
    try {
      const minRating = req.query.minRating ? parseFloat(req.query.minRating) : 4;
      const minReviews = req.query.minReviews ? parseInt(req.query.minReviews) : 5;
      
      // Récupérer les statistiques
      const stats = await routeReviewIntegrationService.getPopularPassesStatistics(
        minRating,
        minReviews
      );
      
      return res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error(`Erreur lors de la récupération des statistiques des cols populaires: ${error.message}`, { stack: error.stack });
      return errorService.sendErrorResponse(
        res,
        errorService.ERROR_TYPES.API_ERROR,
        'Erreur lors de la récupération des statistiques des cols populaires',
        { details: error.message }
      );
    }
  }

  /**
   * Obtient des itinéraires similaires à un itinéraire donné
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async getSimilarRoutes(req, res) {
    try {
      const { routeId } = req.params;
      
      // Valider l'ID de l'itinéraire
      if (!mongoose.Types.ObjectId.isValid(routeId)) {
        return errorService.sendErrorResponse(
          res,
          errorService.ERROR_TYPES.VALIDATION,
          'ID d\'itinéraire invalide'
        );
      }
      
      // Vérifier le cache
      const cacheKey = `similar_routes:${routeId}`;
      const cachedResults = await cacheService.get(cacheKey);
      
      if (cachedResults) {
        return res.json({
          success: true,
          data: cachedResults.data,
          meta: cachedResults.meta
        });
      }
      
      // Options
      const options = {
        limit: parseInt(req.query.limit) || 5
      };
      
      // Récupérer les itinéraires similaires via le service de recherche
      const routeSearchService = require('../services/route-search.service').getInstance();
      const similarRoutes = await routeSearchService.findSimilarRoutes(routeId, options);
      
      // Mettre en cache les résultats
      await cacheService.set(cacheKey, similarRoutes, 3600); // Cache d'une heure
      
      return res.json({
        success: true,
        data: similarRoutes.data,
        meta: similarRoutes.meta
      });
    } catch (error) {
      logger.error(`Erreur lors de la recherche d'itinéraires similaires: ${error.message}`, { stack: error.stack });
      return errorService.sendErrorResponse(
        res,
        errorService.ERROR_TYPES.API_ERROR,
        'Erreur lors de la recherche d\'itinéraires similaires',
        { details: error.message }
      );
    }
  }

  /**
   * Obtient des itinéraires populaires
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async getPopularRoutes(req, res) {
    try {
      // Vérifier le cache
      const cacheKey = 'popular_routes';
      const cachedResults = await cacheService.get(cacheKey);
      
      if (cachedResults) {
        return res.json({
          success: true,
          data: cachedResults.data,
          pagination: cachedResults.pagination
        });
      }
      
      // Options de pagination
      const options = {
        skip: parseInt(req.query.skip) || 0,
        limit: parseInt(req.query.limit) || 10
      };
      
      // Récupérer les itinéraires populaires
      const popularRoutes = await routeReviewIntegrationService._getPopularRoutes(options);
      
      // Mettre en cache les résultats
      await cacheService.set(cacheKey, popularRoutes, 3600); // Cache d'une heure
      
      return res.json({
        success: true,
        data: popularRoutes.data,
        pagination: popularRoutes.pagination
      });
    } catch (error) {
      logger.error(`Erreur lors de la récupération des itinéraires populaires: ${error.message}`, { stack: error.stack });
      return errorService.sendErrorResponse(
        res,
        errorService.ERROR_TYPES.API_ERROR,
        'Erreur lors de la récupération des itinéraires populaires',
        { details: error.message }
      );
    }
  }
}

module.exports = new RouteRecommendationController();
