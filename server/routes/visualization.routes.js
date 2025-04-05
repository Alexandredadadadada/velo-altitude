// routes/visualization.routes.js - Routes pour les visualisations avancées
const express = require('express');
const router = express.Router();
const visualizationController = require('../controllers/visualization.controller');

// Route pour la visualisation segmentée d'un col
router.get('/passes/:passId/visualization', visualizationController.getPassVisualization);

// Route pour la visualisation 3D d'un col
router.get('/passes/:passId/visualization-3d', visualizationController.get3DPassVisualization);

// Route pour les annotations d'un itinéraire
router.get('/routes/:routeId/annotations', visualizationController.getRouteAnnotations);

// Route pour comparer deux cols
router.get('/passes/compare/:passId1/:passId2', visualizationController.comparePassesVisualization);

module.exports = router;
