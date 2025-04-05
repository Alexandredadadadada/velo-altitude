/**
 * Routes pour les détails des cols
 * @module routes/col-details.routes
 */

const express = require('express');
const router = express.Router();
const colDetailsController = require('../controllers/col-details.controller');
const cacheMiddleware = require('../middleware/cache.middleware');

/**
 * @route GET /api/col-details/:colId
 * @description Récupère les détails complets d'un col
 * @access Public
 */
router.get(
  '/:colId',
  cacheMiddleware.cacheResponse('col-details', 60), // Cache pendant 1 heure
  colDetailsController.getColDetails
);

/**
 * @route GET /api/col-details/:colId/segments
 * @description Récupère les segments d'un col avec code couleur par difficulté
 * @access Public
 */
router.get(
  '/:colId/segments',
  cacheMiddleware.cacheResponse('col-details', 60), // Cache pendant 1 heure
  colDetailsController.getColSegments
);

/**
 * @route GET /api/col-details/:colId/points-of-interest
 * @description Récupère les points d'intérêt d'un col
 * @access Public
 */
router.get(
  '/:colId/points-of-interest',
  cacheMiddleware.cacheResponse('col-details', 60), // Cache pendant 1 heure
  colDetailsController.getColPointsOfInterest
);

/**
 * @route GET /api/col-details/:colId/weather
 * @description Récupère les prévisions météo pour un col
 * @access Public
 */
router.get(
  '/:colId/weather',
  cacheMiddleware.cacheResponse('col-details', 15), // Cache pendant 15 minutes
  colDetailsController.getColWeatherForecast
);

/**
 * @route GET /api/col-details/:colId/routes
 * @description Récupère les itinéraires qui passent par un col
 * @access Public
 */
router.get(
  '/:colId/routes',
  cacheMiddleware.cacheResponse('col-details', 60), // Cache pendant 1 heure
  colDetailsController.getColRoutes
);

/**
 * @route GET /api/col-details/:colId/similar
 * @description Récupère les cols similaires à un col donné
 * @access Public
 */
router.get(
  '/:colId/similar',
  cacheMiddleware.cacheResponse('col-details', 120), // Cache pendant 2 heures
  colDetailsController.getSimilarCols
);

module.exports = router;
