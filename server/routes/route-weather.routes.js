/**
 * Routes pour les fonctionnalités météo liées aux itinéraires
 */

const express = require('express');
const router = express.Router();
const RouteWeatherController = require('../controllers/route-weather.controller');
const authMiddleware = require('../middleware/auth.middleware');
const cacheMiddleware = require('../middleware/cache.middleware');
const { trackApiEndpoint } = require('../middleware/api-quota-middleware');

// Toutes les routes nécessitent une authentification
router.use(authMiddleware.verifyToken);

// Récupérer les prévisions météo pour un itinéraire
router.get(
  '/forecast/:routeId',
  trackApiEndpoint('route_weather', 'getForecast'),
  cacheMiddleware.cache('weather', 15), // 15 minutes de cache
  RouteWeatherController.getRouteWeatherForecast
);

// Trouver les meilleurs créneaux météo pour un itinéraire
router.get(
  '/best-time-slots/:routeId',
  trackApiEndpoint('route_weather', 'getBestTimeSlots'),
  cacheMiddleware.cache('weather', 30), // 30 minutes de cache
  RouteWeatherController.findBestWeatherTimeSlots
);

// Recommander des itinéraires en fonction des conditions météo
router.get(
  '/recommendations',
  trackApiEndpoint('route_weather', 'getRecommendations'),
  cacheMiddleware.cache('weather', 15), // 15 minutes de cache
  RouteWeatherController.recommendRoutesByWeather
);

// Configurer des alertes météo pour les itinéraires favoris
router.post(
  '/alerts/setup',
  trackApiEndpoint('route_weather', 'setupAlerts'),
  RouteWeatherController.setupFavoriteRoutesWeatherAlerts
);

// Obtenir l'état actuel des alertes météo de l'utilisateur
router.get(
  '/alerts/status',
  trackApiEndpoint('route_weather', 'getAlertStatus'),
  RouteWeatherController.getUserWeatherAlertStatus
);

// Générer des données pour la visualisation météo sur une carte
router.get(
  '/map-visualization',
  trackApiEndpoint('route_weather', 'getMapVisualization'),
  cacheMiddleware.cache('weather', 10), // 10 minutes de cache
  RouteWeatherController.generateWeatherMapVisualization
);

module.exports = router;
