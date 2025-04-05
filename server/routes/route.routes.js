// route.routes.js - Routes pour l'intégration avec l'API OpenRouteService
const express = require('express');
const router = express.Router();
const routeController = require('../controllers/route.controller');
const apiMiddleware = require('../middlewares/api.middleware');
const { routeValidation } = require('../validations/route.validation');
const authMiddleware = require('../middlewares/auth.middleware');

// Middleware de validation pour les requêtes d'itinéraire
const validateRouteRequest = apiMiddleware.validate(routeValidation.calculateRoute, 'body');
const validateIsochroneRequest = apiMiddleware.validate(routeValidation.calculateIsochrone, 'body');
const validateElevationRequest = apiMiddleware.validate(routeValidation.getElevation, 'body');
const validateOptimizeRequest = apiMiddleware.validate(routeValidation.optimizeRoute, 'body');

// Route pour calculer un itinéraire cyclable
// Cache pendant 10 minutes avec option "hot" pour les itinéraires populaires
router.post('/calculate', validateRouteRequest, apiMiddleware.cache(600, { hot: true }), routeController.calculateRoute);

// Route pour calculer une zone accessible (isochrone)
router.post('/isochrone', validateIsochroneRequest, apiMiddleware.cache(600), routeController.calculateIsochrone);

// Route pour récupérer les données d'élévation
router.post('/elevation', validateElevationRequest, apiMiddleware.cache(600), routeController.getElevation);

// Route pour optimiser un itinéraire
router.post('/optimize', validateOptimizeRequest, apiMiddleware.cache(300), routeController.optimizeRoute);

// Route pour récupérer les itinéraires enregistrés par l'utilisateur
router.get('/saved', authMiddleware.validateToken, apiMiddleware.paginate(), routeController.getSavedRoutes);

// Route pour récupérer un itinéraire spécifique par ID
router.get('/:id', apiMiddleware.cache(1800), routeController.getRouteById);

// Route pour enregistrer un itinéraire
router.post('/save', authMiddleware.validateToken, validateRouteRequest, routeController.saveRoute);

// Route pour supprimer un itinéraire enregistré
router.delete('/:id', authMiddleware.validateToken, routeController.deleteRoute);

// Route pour partager un itinéraire
router.post('/:id/share', authMiddleware.validateToken, routeController.shareRoute);

module.exports = router;
