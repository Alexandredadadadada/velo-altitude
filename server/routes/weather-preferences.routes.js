/**
 * Routes pour la gestion des préférences météo des utilisateurs
 */

const express = require('express');
const router = express.Router();
const WeatherPreferencesController = require('../controllers/weather-preferences.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { trackApiEndpoint } = require('../middleware/api-quota-middleware');

// Toutes les routes nécessitent une authentification
router.use(authMiddleware.verifyToken);

// Récupérer les préférences météo de l'utilisateur connecté
router.get(
  '/preferences',
  trackApiEndpoint('weather_preferences', 'getPreferences'),
  WeatherPreferencesController.getUserPreferences
);

// Mettre à jour les préférences météo
router.put(
  '/preferences',
  trackApiEndpoint('weather_preferences', 'updatePreferences'),
  WeatherPreferencesController.updateUserPreferences
);

// Configurer les alertes pour les itinéraires favoris
router.post(
  '/favorite-routes-alerts',
  trackApiEndpoint('weather_preferences', 'setupRouteAlerts'),
  WeatherPreferencesController.setupFavoriteRoutesAlerts
);

// Désactiver toutes les alertes météo
router.post(
  '/disable-alerts',
  trackApiEndpoint('weather_preferences', 'disableAlerts'),
  WeatherPreferencesController.disableAllAlerts
);

module.exports = router;
