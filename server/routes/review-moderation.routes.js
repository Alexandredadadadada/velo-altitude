/**
 * Routes pour la modération des avis
 */
const express = require('express');
const router = express.Router();
const reviewModerationController = require('../controllers/review-moderation.controller');
const authMiddleware = require('../middleware/auth.middleware');
const rateLimitMiddleware = require('../middleware/rate-limit.middleware');

// Middleware d'authentification pour toutes les routes
router.use(authMiddleware.verifyToken);

// Routes pour les utilisateurs (signalement d'avis)
router.post(
  '/reviews/:reviewId/report',
  rateLimitMiddleware.limitInteractions,
  reviewModerationController.reportReview
);

// Routes pour les administrateurs (modération)
router.get(
  '/pending',
  authMiddleware.isAdmin,
  reviewModerationController.getPendingReviews
);

router.get(
  '/history',
  authMiddleware.isAdmin,
  reviewModerationController.getModerationHistory
);

router.post(
  '/reviews/:reviewId/moderate',
  authMiddleware.isAdmin,
  reviewModerationController.moderateReview
);

module.exports = router;
