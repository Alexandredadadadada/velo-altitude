/**
 * Routes pour la visualisation des itinéraires
 * @module routes/route-visualization.routes
 */

const express = require('express');
const router = express.Router();
const routeVisualizationController = require('../controllers/route-visualization.controller');
const authMiddleware = require('../middleware/auth.middleware');
const cacheMiddleware = require('../middleware/cache.middleware');

/**
 * @route GET /api/route-visualization/route/:routeId
 * @description Récupère un itinéraire avec code couleur par difficulté
 * @access Public
 */
router.get(
  '/route/:routeId',
  cacheMiddleware.cacheResponse('route-visualization', 30), // Cache pendant 30 minutes
  routeVisualizationController.getColorCodedRoute
);

/**
 * @route GET /api/route-visualization/colors.css
 * @description Récupère le CSS pour les couleurs d'itinéraires
 * @access Public
 */
router.get(
  '/colors.css',
  cacheMiddleware.cacheResponse('route-visualization', 1440), // Cache pendant 24 heures (1440 minutes)
  routeVisualizationController.getRouteColorsCss
);

/**
 * @route POST /api/route-visualization/difficulty
 * @description Calcule la difficulté globale d'un itinéraire
 * @access Public
 */
router.post(
  '/difficulty',
  cacheMiddleware.cacheResponse('route-visualization', 60), // Cache pendant 1 heure
  routeVisualizationController.calculateRouteDifficulty
);

/**
 * @route GET /api/route-visualization/gradient-style/:gradient
 * @description Génère le style Leaflet pour un segment de pente spécifique
 * @access Public
 */
router.get(
  '/gradient-style/:gradient',
  cacheMiddleware.cacheResponse('route-visualization', 1440), // Cache pendant 24 heures
  routeVisualizationController.getGradientStyle
);

/**
 * @route POST /api/route-visualization/color-palette
 * @description Obtient une palette de couleurs pour un ensemble de routes
 * @access Private
 */
router.post(
  '/color-palette',
  authMiddleware.authenticate,
  cacheMiddleware.cacheResponse('route-visualization', 30), // Cache pendant 30 minutes
  routeVisualizationController.getRouteColorPalette
);

module.exports = router;
