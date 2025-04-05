// weather.routes.js - Routes pour l'intégration avec l'API OpenWeatherMap
const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weather.controller');

// Route pour récupérer les données météo actuelles
router.get('/current', weatherController.getCurrentWeather);

// Route pour récupérer les prévisions météo
router.get('/forecast', weatherController.getForecast);

// Route pour récupérer les prévisions météo horaires
router.get('/hourly', weatherController.getHourlyForecast);

// Route pour récupérer l'indice UV
router.get('/uv', weatherController.getUvIndex);

// Route pour récupérer la qualité de l'air
router.get('/air', weatherController.getAirQuality);

// Route pour récupérer les conditions optimales pour le cyclisme
router.get('/cycling-conditions', weatherController.getCyclingConditions);

module.exports = router;
