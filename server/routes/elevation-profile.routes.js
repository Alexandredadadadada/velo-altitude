// routes/elevation-profile.routes.js - Routes pour les profils d'élévation enrichis
const express = require('express');
const router = express.Router();
const elevationProfileController = require('../controllers/elevation-profile.controller');

// Route pour analyser un profil d'élévation
router.post('/analyze', elevationProfileController.analyzeProfile.bind(elevationProfileController));

// Route pour obtenir l'analyse complète d'un col
router.get('/pass/:id', elevationProfileController.getPassAnalysis.bind(elevationProfileController));

// Route pour obtenir les données météo historiques d'un col
router.get('/pass/:id/weather', elevationProfileController.getPassWeather.bind(elevationProfileController));

// Route pour comparer deux cols
router.get('/compare', elevationProfileController.comparePasses.bind(elevationProfileController));

module.exports = router;
