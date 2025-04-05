// routes/route-alternatives.routes.js - Routes pour les itinéraires alternatifs
const express = require('express');
const router = express.Router();
const routeAlternativesController = require('../controllers/route-alternatives.controller');

// Route pour générer des alternatives basées sur les conditions météo
router.get('/:routeId/weather-alternatives', routeAlternativesController.getWeatherBasedAlternatives.bind(routeAlternativesController));

// Route pour générer des variantes selon le profil du cycliste
router.post('/:routeId/profile-variants', routeAlternativesController.getProfileBasedRoutes.bind(routeAlternativesController));

// Route pour récupérer toutes les variantes disponibles
router.get('/:routeId/all-variants', routeAlternativesController.getAllVariants.bind(routeAlternativesController));

module.exports = router;
