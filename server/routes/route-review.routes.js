/**
 * Routes pour les avis et commentaires sur les itinéraires
 */
const express = require('express');
const router = express.Router();
const routeReviewController = require('../controllers/route-review.controller');
const authMiddleware = require('../middleware/auth.middleware');
const rateLimitMiddleware = require('../middleware/rate-limit.middleware');

// Middleware d'authentification pour toutes les routes
router.use(authMiddleware.verifyToken);

// Routes pour les avis sur les itinéraires
router.post(
  '/routes/:routeId/reviews',
  rateLimitMiddleware.limitReviewCreation,
  routeReviewController.createReview
);

router.get(
  '/routes/:routeId/reviews',
  routeReviewController.getRouteReviews
);

router.get(
  '/routes/:routeId/reviews/check',
  routeReviewController.checkUserReview
);

router.get(
  '/users/:userId/reviews',
  routeReviewController.getUserReviews
);

router.get(
  '/users/me/reviews',
  routeReviewController.getUserReviews
);

// Routes pour la gestion des avis individuels
router.put(
  '/reviews/:reviewId',
  rateLimitMiddleware.limitReviewUpdates,
  routeReviewController.updateReview
);

router.delete(
  '/reviews/:reviewId',
  routeReviewController.deleteReview
);

router.post(
  '/reviews/:reviewId/like',
  rateLimitMiddleware.limitInteractions,
  routeReviewController.toggleLike
);

router.post(
  '/reviews/:reviewId/flag',
  rateLimitMiddleware.limitInteractions,
  routeReviewController.flagReview
);

module.exports = router;
