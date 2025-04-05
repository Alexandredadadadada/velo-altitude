/**
 * Contrôleur pour la modération des avis
 * Gère les actions de modération des avis signalés
 */
const mongoose = require('mongoose');
const logger = require('../utils/logger');
const errorService = require('../services/error.service').getInstance();
const reviewModerationService = require('../services/review-moderation.service').getInstance();

class ReviewModerationController {
  /**
   * Récupère les avis en attente de modération
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async getPendingReviews(req, res) {
    try {
      // Vérifier que l'utilisateur est un administrateur
      if (!req.user.isAdmin) {
        return errorService.sendErrorResponse(
          res,
          errorService.ERROR_TYPES.FORBIDDEN,
          'Accès réservé aux administrateurs'
        );
      }
      
      // Options de pagination
      const options = {
        skip: parseInt(req.query.skip) || 0,
        limit: parseInt(req.query.limit) || 20,
        sort: req.query.sort ? JSON.parse(req.query.sort) : { flags: -1, createdAt: -1 }
      };
      
      // Récupérer les avis en attente
      const pendingReviews = await reviewModerationService.getPendingReviews(options);
      
      return res.json({
        success: true,
        data: pendingReviews.data,
        pagination: pendingReviews.pagination,
        meta: pendingReviews.meta
      });
    } catch (error) {
      logger.error(`Erreur lors de la récupération des avis en attente: ${error.message}`, { stack: error.stack });
      return errorService.sendErrorResponse(
        res,
        errorService.ERROR_TYPES.API_ERROR,
        'Erreur lors de la récupération des avis en attente',
        { details: error.message }
      );
    }
  }

  /**
   * Récupère l'historique des modérations
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async getModerationHistory(req, res) {
    try {
      // Vérifier que l'utilisateur est un administrateur
      if (!req.user.isAdmin) {
        return errorService.sendErrorResponse(
          res,
          errorService.ERROR_TYPES.FORBIDDEN,
          'Accès réservé aux administrateurs'
        );
      }
      
      // Options de pagination
      const options = {
        skip: parseInt(req.query.skip) || 0,
        limit: parseInt(req.query.limit) || 20,
        sort: req.query.sort ? JSON.parse(req.query.sort) : { moderatedAt: -1 }
      };
      
      // Récupérer l'historique
      const history = await reviewModerationService.getModerationHistory(options);
      
      return res.json({
        success: true,
        data: history.data,
        pagination: history.pagination
      });
    } catch (error) {
      logger.error(`Erreur lors de la récupération de l'historique: ${error.message}`, { stack: error.stack });
      return errorService.sendErrorResponse(
        res,
        errorService.ERROR_TYPES.API_ERROR,
        'Erreur lors de la récupération de l\'historique',
        { details: error.message }
      );
    }
  }

  /**
   * Modère un avis
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async moderateReview(req, res) {
    try {
      // Vérifier que l'utilisateur est un administrateur
      if (!req.user.isAdmin) {
        return errorService.sendErrorResponse(
          res,
          errorService.ERROR_TYPES.FORBIDDEN,
          'Accès réservé aux administrateurs'
        );
      }
      
      const { reviewId } = req.params;
      const adminId = req.user.userId;
      const { action, note, content, notifyUser } = req.body;
      
      // Valider l'ID de l'avis
      if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        return errorService.sendErrorResponse(
          res,
          errorService.ERROR_TYPES.VALIDATION,
          'ID d\'avis invalide'
        );
      }
      
      // Valider l'action
      if (!action || !['approve', 'reject', 'delete', 'edit'].includes(action)) {
        return errorService.sendErrorResponse(
          res,
          errorService.ERROR_TYPES.VALIDATION,
          'Action de modération invalide'
        );
      }
      
      // Préparer l'action de modération
      const moderationAction = {
        type: action,
        note: note,
        content: content,
        notifyUser: notifyUser !== false
      };
      
      // Modérer l'avis
      const result = await reviewModerationService.moderateReview(
        reviewId,
        adminId,
        moderationAction
      );
      
      return res.json({
        success: true,
        message: result.message,
        data: result
      });
    } catch (error) {
      logger.error(`Erreur lors de la modération de l'avis: ${error.message}`, { stack: error.stack });
      return errorService.sendErrorResponse(
        res,
        errorService.ERROR_TYPES.API_ERROR,
        'Erreur lors de la modération de l\'avis',
        { details: error.message }
      );
    }
  }

  /**
   * Signale un avis
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async reportReview(req, res) {
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
      
      // Traiter le signalement
      const result = await reviewModerationService.processReportedReview(
        reviewId,
        userId,
        reason
      );
      
      return res.json({
        success: true,
        message: result.message,
        data: {
          moderated: result.moderated,
          review: result.review
        }
      });
    } catch (error) {
      logger.error(`Erreur lors du signalement de l'avis: ${error.message}`, { stack: error.stack });
      return errorService.sendErrorResponse(
        res,
        errorService.ERROR_TYPES.API_ERROR,
        'Erreur lors du signalement de l\'avis',
        { details: error.message }
      );
    }
  }
}

module.exports = new ReviewModerationController();
