// routes/route-planner.routes.js - Routes pour le planificateur d'itinéraires avancé
const express = require('express');
const router = express.Router();
const routePlannerController = require('../controllers/route-planner.controller');
const cacheMiddleware = require('../middlewares/cache.middleware');

// Routes pour la gestion des itinéraires planifiés
router.get('/', cacheMiddleware('routes', 30), routePlannerController.getAllRoutes.bind(routePlannerController));
router.get('/thematic', cacheMiddleware('routes', 60), routePlannerController.getThematicRoutes.bind(routePlannerController));
router.get('/:id', cacheMiddleware('routes', 30), routePlannerController.getRouteById.bind(routePlannerController));
router.post('/', routePlannerController.createRoute.bind(routePlannerController));
router.put('/:id', routePlannerController.updateRoute.bind(routePlannerController));
router.delete('/:id', routePlannerController.deleteRoute.bind(routePlannerController));

// Routes pour les fonctionnalités avancées
router.get('/:id/time', cacheMiddleware('routes_estimation', 30), routePlannerController.estimateTime.bind(routePlannerController));
router.get('/:id/difficulty', cacheMiddleware('routes_analysis', 60), routePlannerController.calculateDifficulty.bind(routePlannerController));
router.get('/:id/accommodations', cacheMiddleware('routes_services', 120), routePlannerController.findAccommodations.bind(routePlannerController));

// Nouvelles routes pour les itinéraires personnalisés
router.post('/personalized', routePlannerController.generatePersonalizedRoute.bind(routePlannerController));
router.post('/:id/optimize-weather', routePlannerController.optimizeRouteForWeather.bind(routePlannerController));
router.post('/challenge', routePlannerController.generateChallengeRoute.bind(routePlannerController));
router.get('/:id/export-gpx', routePlannerController.exportRouteToGpx.bind(routePlannerController));
router.post('/:id/recommend-departure', routePlannerController.recommendDepartureTime.bind(routePlannerController));

module.exports = router;
