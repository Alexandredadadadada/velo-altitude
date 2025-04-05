/**
 * Routes pour les recommandations d'itinéraires
 */
const express = require('express');
const router = express.Router();
const routeRecommendationController = require('../controllers/route-recommendation.controller');
const authMiddleware = require('../middleware/auth.middleware');
const rateLimitMiddleware = require('../middleware/rate-limit.middleware');

// Middleware d'authentification pour les routes qui en ont besoin
const optionalAuth = (req, res, next) => {
  try {
    authMiddleware.verifyToken(req, res, next);
  } catch (error) {
    // Continuer même sans authentification
    req.user = null;
    next();
  }
};

// Routes publiques (authentification optionnelle)
router.get(
  '/popular',
  optionalAuth,
  rateLimitMiddleware.general,
  routeRecommendationController.getPopularRoutes
);

router.get(
  '/routes/:routeId/similar',
  optionalAuth,
  rateLimitMiddleware.general,
  routeRecommendationController.getSimilarRoutes
);

router.get(
  '/passes/popular/stats',
  optionalAuth,
  rateLimitMiddleware.general,
  routeRecommendationController.getPopularPassesStatistics
);

router.get(
  '/passes/routes',
  optionalAuth,
  rateLimitMiddleware.limitRouteSearch,
  routeRecommendationController.findRoutesByPassReviews
);

// Routes nécessitant une authentification
router.get(
  '/personalized',
  authMiddleware.verifyToken,
  rateLimitMiddleware.general,
  routeRecommendationController.getRecommendations
);

module.exports = router;
