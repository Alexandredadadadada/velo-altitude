/**
 * Contrôleur pour les avis et commentaires sur les itinéraires
 */
const mongoose = require('mongoose');
const RouteReview = require('../models/route-review.model');
const Route = require('../models/route.model');
const User = require('../models/user.model');
const errorService = require('../services/error.service').getInstance();
const cacheService = require('../services/cache.service').getInstance();
const logger = require('../utils/logger');

class RouteReviewController {
  /**
   * Crée un nouvel avis sur un itinéraire
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async createReview(req, res) {
    try {
      const { routeId } = req.params;
      const userId = req.user.userId;
      const { 
        rating, title, comment, difficultyRating, 
        sceneryRating, surfaceRating, trafficRating, 
        completedRoute, images 
      } = req.body;
      
      // Valider l'ID de l'itinéraire
      if (!mongoose.Types.ObjectId.isValid(routeId)) {
        return errorService.sendErrorResponse(
          res,
          errorService.ERROR_TYPES.VALIDATION,
          'ID d\'itinéraire invalide'
        );
      }
      
      // Vérifier si l'itinéraire existe
      const route = await Route.findById(routeId);
      if (!route) {
        return errorService.sendErrorResponse(
          res,
          errorService.ERROR_TYPES.NOT_FOUND,
          'Itinéraire non trouvé'
        );
      }
      
      // Vérifier si l'utilisateur a déjà laissé un avis
      const existingReview = await RouteReview.findOne({ route: routeId, user: userId });
      if (existingReview) {
        return errorService.sendErrorResponse(
          res,
          errorService.ERROR_TYPES.CONFLICT,
          'Vous avez déjà laissé un avis sur cet itinéraire'
        );
      }
      
      // Créer le nouvel avis
      const newReview = new RouteReview({
        route: routeId,
        user: userId,
        rating,
        title,
        comment,
        difficultyRating,
        sceneryRating,
        surfaceRating,
        trafficRating,
        completedRoute: completedRoute !== false, // Par défaut true
        images: images || []
      });
      
      // Enregistrer l'avis
      await newReview.save();
      
      // Mettre à jour les statistiques de l'itinéraire
      await RouteReview.calculateAverageRating(routeId);
      
      // Invalider le cache pour cet itinéraire
      await cacheService.delete(`route:${routeId}`);
      await cacheService.delete(`route_reviews:${routeId}`);
      
      // Retourner la réponse
      return res.status(201).json({
        success: true,
        message: 'Avis ajouté avec succès',
        data: {
          id: newReview._id,
          rating: newReview.rating
        }
      });
    } catch (error) {
      logger.error(`Erreur lors de la création d'un avis: ${error.message}`, { stack: error.stack });
      return errorService.sendErrorResponse(
        res,
        errorService.ERROR_TYPES.API_ERROR,
        'Erreur lors de la création de l\'avis',
        { details: error.message }
      );
    }
  }

  /**
   * Met à jour un avis existant
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async updateReview(req, res) {
    try {
      const { reviewId } = req.params;
      const userId = req.user.userId;
      const { 
        rating, title, comment, difficultyRating, 
        sceneryRating, surfaceRating, trafficRating, 
        completedRoute, images 
      } = req.body;
      
      // Valider l'ID de l'avis
      if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        return errorService.sendErrorResponse(
          res,
          errorService.ERROR_TYPES.VALIDATION,
          'ID d\'avis invalide'
        );
      }
      
      // Récupérer l'avis
      const review = await RouteReview.findById(reviewId);
      if (!review) {
        return errorService.sendErrorResponse(
          res,
          errorService.ERROR_TYPES.NOT_FOUND,
          'Avis non trouvé'
        );
      }
      
      // Vérifier que l'utilisateur est le propriétaire de l'avis
      if (review.user.toString() !== userId && !req.user.isAdmin) {
        return errorService.sendErrorResponse(
          res,
          errorService.ERROR_TYPES.FORBIDDEN,
          'Vous n\'êtes pas autorisé à modifier cet avis'
        );
      }
      
      // Mettre à jour les champs
      if (rating !== undefined) review.rating = rating;
      if (title !== undefined) review.title = title;
      if (comment !== undefined) review.comment = comment;
      if (difficultyRating !== undefined) review.difficultyRating = difficultyRating;
      if (sceneryRating !== undefined) review.sceneryRating = sceneryRating;
      if (surfaceRating !== undefined) review.surfaceRating = surfaceRating;
      if (trafficRating !== undefined) review.trafficRating = trafficRating;
      if (completedRoute !== undefined) review.completedRoute = completedRoute;
      if (images !== undefined) review.images = images;
      
      // Enregistrer les modifications
      await review.save();
      
      // Mettre à jour les statistiques de l'itinéraire
      await RouteReview.calculateAverageRating(review.route);
      
      // Invalider le cache
      await cacheService.delete(`route:${review.route}`);
      await cacheService.delete(`route_reviews:${review.route}`);
      
      return res.json({
        success: true,
        message: 'Avis mis à jour avec succès',
        data: {
          id: review._id,
          rating: review.rating
        }
      });
    } catch (error) {
      logger.error(`Erreur lors de la mise à jour d'un avis: ${error.message}`, { stack: error.stack });
      return errorService.sendErrorResponse(
        res,
        errorService.ERROR_TYPES.API_ERROR,
        'Erreur lors de la mise à jour de l\'avis',
        { details: error.message }
      );
    }
  }

  /**
   * Supprime un avis
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async deleteReview(req, res) {
    try {
      const { reviewId } = req.params;
      const userId = req.user.userId;
      
      // Valider l'ID de l'avis
      if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        return errorService.sendErrorResponse(
          res,
          errorService.ERROR_TYPES.VALIDATION,
          'ID d\'avis invalide'
        );
      }
      
      // Récupérer l'avis
      const review = await RouteReview.findById(reviewId);
      if (!review) {
        return errorService.sendErrorResponse(
          res,
          errorService.ERROR_TYPES.NOT_FOUND,
          'Avis non trouvé'
        );
      }
      
      // Vérifier que l'utilisateur est le propriétaire de l'avis ou un administrateur
      if (review.user.toString() !== userId && !req.user.isAdmin) {
        return errorService.sendErrorResponse(
          res,
          errorService.ERROR_TYPES.FORBIDDEN,
          'Vous n\'êtes pas autorisé à supprimer cet avis'
        );
      }
      
      // Stocker l'ID de l'itinéraire avant suppression
      const routeId = review.route;
      
      // Supprimer l'avis
      await RouteReview.findByIdAndDelete(reviewId);
      
      // Mettre à jour les statistiques de l'itinéraire
      await RouteReview.calculateAverageRating(routeId);
      
      // Invalider le cache
      await cacheService.delete(`route:${routeId}`);
      await cacheService.delete(`route_reviews:${routeId}`);
      
      return res.json({
        success: true,
        message: 'Avis supprimé avec succès'
      });
    } catch (error) {
      logger.error(`Erreur lors de la suppression d'un avis: ${error.message}`, { stack: error.stack });
      return errorService.sendErrorResponse(
        res,
        errorService.ERROR_TYPES.API_ERROR,
        'Erreur lors de la suppression de l\'avis',
        { details: error.message }
      );
    }
  }

  /**
   * Récupère tous les avis pour un itinéraire
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async getRouteReviews(req, res) {
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
      
      // Vérifier si l'itinéraire existe
      const route = await Route.findById(routeId);
      if (!route) {
        return errorService.sendErrorResponse(
          res,
          errorService.ERROR_TYPES.NOT_FOUND,
          'Itinéraire non trouvé'
        );
      }
      
      // Vérifier le cache
      const cacheKey = `route_reviews:${routeId}`;
      const cachedReviews = await cacheService.get(cacheKey);
      
      if (cachedReviews) {
        return res.json({
          success: true,
          data: cachedReviews.data,
          pagination: cachedReviews.pagination,
          meta: cachedReviews.meta
        });
      }
      
      // Options de pagination
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      
      // Options de tri
      const sortField = req.query.sortBy || 'createdAt';
      const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
      const sort = { [sortField]: sortOrder };
      
      // Récupérer les avis
      const reviews = await RouteReview.find({ route: routeId })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('user', 'firstName lastName profilePicture');
      
      // Compter le nombre total d'avis
      const total = await RouteReview.countDocuments({ route: routeId });
      
      // Calculer les statistiques des avis
      const stats = await RouteReview.aggregate([
        { $match: { route: mongoose.Types.ObjectId(routeId) } },
        { $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          avgDifficulty: { $avg: '$difficultyRating' },
          avgScenery: { $avg: '$sceneryRating' },
          avgSurface: { $avg: '$surfaceRating' },
          avgTraffic: { $avg: '$trafficRating' },
          count: { $sum: 1 },
          ratings: {
            $push: '$rating'
          }
        }}
      ]);
      
      // Calculer la distribution des notes
      let distribution = {
        1: 0, 2: 0, 3: 0, 4: 0, 5: 0
      };
      
      if (stats.length > 0 && stats[0].ratings) {
        stats[0].ratings.forEach(rating => {
          distribution[rating] = (distribution[rating] || 0) + 1;
        });
      }
      
      // Préparer la réponse
      const response = {
        data: reviews,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        },
        meta: {
          stats: stats.length > 0 ? {
            avgRating: stats[0].avgRating,
            avgDifficulty: stats[0].avgDifficulty,
            avgScenery: stats[0].avgScenery,
            avgSurface: stats[0].avgSurface,
            avgTraffic: stats[0].avgTraffic,
            count: stats[0].count,
            distribution
          } : {
            avgRating: 0,
            avgDifficulty: 0,
            avgScenery: 0,
            avgSurface: 0,
            avgTraffic: 0,
            count: 0,
            distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
          }
        }
      };
      
      // Mettre en cache les résultats
      await cacheService.set(cacheKey, response, 3600); // Cache d'une heure
      
      return res.json({
        success: true,
        ...response
      });
    } catch (error) {
      logger.error(`Erreur lors de la récupération des avis: ${error.message}`, { stack: error.stack });
      return errorService.sendErrorResponse(
        res,
        errorService.ERROR_TYPES.API_ERROR,
        'Erreur lors de la récupération des avis',
        { details: error.message }
      );
    }
  }

  /**
   * Récupère les avis laissés par un utilisateur
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async getUserReviews(req, res) {
    try {
      const userId = req.params.userId || req.user.userId;
      
      // Options de pagination
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      
      // Récupérer les avis
      const reviews = await RouteReview.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('route', 'name distance difficulty');
      
      // Compter le nombre total d'avis
      const total = await RouteReview.countDocuments({ user: userId });
      
      return res.json({
        success: true,
        data: reviews,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error(`Erreur lors de la récupération des avis de l'utilisateur: ${error.message}`, { stack: error.stack });
      return errorService.sendErrorResponse(
        res,
        errorService.ERROR_TYPES.API_ERROR,
        'Erreur lors de la récupération des avis de l\'utilisateur',
        { details: error.message }
      );
    }
  }

  /**
   * Ajoute ou supprime un "j'aime" sur un avis
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async toggleLike(req, res) {
    try {
      const { reviewId } = req.params;
      const userId = req.user.userId;
      
      // Valider l'ID de l'avis
      if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        return errorService.sendErrorResponse(
          res,
          errorService.ERROR_TYPES.VALIDATION,
          'ID d\'avis invalide'
        );
      }
      
      // Récupérer l'avis
      const review = await RouteReview.findById(reviewId);
      if (!review) {
        return errorService.sendErrorResponse(
          res,
          errorService.ERROR_TYPES.NOT_FOUND,
          'Avis non trouvé'
        );
      }
      
      // Vérifier si l'utilisateur a déjà aimé cet avis
      const userIndex = review.likedBy.indexOf(userId);
      
      if (userIndex === -1) {
        // Ajouter le j'aime
        review.likes += 1;
        review.likedBy.push(userId);
        await review.save();
        
        return res.json({
          success: true,
          message: 'J\'aime ajouté',
          data: {
            likes: review.likes,
            liked: true
          }
        });
      } else {
        // Supprimer le j'aime
        review.likes = Math.max(0, review.likes - 1);
        review.likedBy.splice(userIndex, 1);
        await review.save();
        
        return res.json({
          success: true,
          message: 'J\'aime retiré',
          data: {
            likes: review.likes,
            liked: false
          }
        });
      }
    } catch (error) {
      logger.error(`Erreur lors de la gestion du j'aime: ${error.message}`, { stack: error.stack });
      return errorService.sendErrorResponse(
        res,
        errorService.ERROR_TYPES.API_ERROR,
        'Erreur lors de la gestion du j\'aime',
        { details: error.message }
      );
    }
  }

  /**
   * Signale un avis inapproprié
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async flagReview(req, res) {
    try {
      const { reviewId } = req.params;
      const userId = req.user.userId;
      const { reason } = req.body;
      
      // Valider l'ID de l'avis
      if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        return errorService.sendErrorResponse(
          res,
          errorService.ERROR_TYPES.VALIDATION,
          'ID d\'avis invalide'
        );
      }
      
      // Récupérer l'avis
      const review = await RouteReview.findById(reviewId);
      if (!review) {
        return errorService.sendErrorResponse(
          res,
          errorService.ERROR_TYPES.NOT_FOUND,
          'Avis non trouvé'
        );
      }
      
      // Vérifier si l'utilisateur a déjà signalé cet avis
      if (review.flaggedBy.includes(userId)) {
        return errorService.sendErrorResponse(
          res,
          errorService.ERROR_TYPES.CONFLICT,
          'Vous avez déjà signalé cet avis'
        );
      }
      
      // Ajouter le signalement
      review.flags += 1;
      review.flaggedBy.push(userId);
      await review.save();
      
      // Notifier les administrateurs si le nombre de signalements est élevé
      if (review.flags >= 3) {
        // Logique de notification des administrateurs
        logger.warn(`Avis ${reviewId} signalé ${review.flags} fois`, {
          reviewId,
          flags: review.flags,
          reason
        });
      }
      
      return res.json({
        success: true,
        message: 'Avis signalé avec succès'
      });
    } catch (error) {
      logger.error(`Erreur lors du signalement d'un avis: ${error.message}`, { stack: error.stack });
      return errorService.sendErrorResponse(
        res,
        errorService.ERROR_TYPES.API_ERROR,
        'Erreur lors du signalement de l\'avis',
        { details: error.message }
      );
    }
  }

  /**
   * Vérifie si un utilisateur a déjà laissé un avis sur un itinéraire
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async checkUserReview(req, res) {
    try {
      const { routeId } = req.params;
      const userId = req.user.userId;
      
      // Valider l'ID de l'itinéraire
      if (!mongoose.Types.ObjectId.isValid(routeId)) {
        return errorService.sendErrorResponse(
          res,
          errorService.ERROR_TYPES.VALIDATION,
          'ID d\'itinéraire invalide'
        );
      }
      
      // Vérifier si l'utilisateur a déjà laissé un avis
      const review = await RouteReview.findOne({ route: routeId, user: userId });
      
      return res.json({
        success: true,
        data: {
          hasReviewed: !!review,
          review: review ? {
            id: review._id,
            rating: review.rating,
            title: review.title,
            comment: review.comment
          } : null
        }
      });
    } catch (error) {
      logger.error(`Erreur lors de la vérification de l'avis utilisateur: ${error.message}`, { stack: error.stack });
      return errorService.sendErrorResponse(
        res,
        errorService.ERROR_TYPES.API_ERROR,
        'Erreur lors de la vérification de l\'avis utilisateur',
        { details: error.message }
      );
    }
  }
}

module.exports = new RouteReviewController();
