/**
 * Routes pour les données environnementales
 * Expose les API pour accéder aux données de qualité d'air et de vent
 */

const express = require('express');
const router = express.Router();
const environmentalController = require('../controllers/environmental.controller');
const rateLimit = require('express-rate-limit');
const { cacheMiddleware, environmentalCacheKeyGenerator } = require('../middleware/cache.middleware');

// Limiter les requêtes à 100 par heure par IP pour éviter l'abus de l'API
const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 100,
  message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard'
});

// Configurer le cache pour les données environnementales (30 minutes)
const environmentalCache = cacheMiddleware(1800, environmentalCacheKeyGenerator);

/**
 * @route   GET /api/environmental/data
 * @desc    Récupère les données environnementales complètes pour une localisation
 * @access  Public
 * @param   {number} lat - Latitude
 * @param   {number} lng - Longitude
 * @returns {Object} Données environnementales combinées
 */
router.get('/data', apiLimiter, environmentalCache, environmentalController.getEnvironmentalData);

/**
 * @route   GET /api/environmental/air-quality
 * @desc    Récupère uniquement les données de qualité d'air pour une localisation
 * @access  Public
 * @param   {number} lat - Latitude
 * @param   {number} lng - Longitude
 * @returns {Object} Données de qualité d'air
 */
router.get('/air-quality', apiLimiter, environmentalCache, environmentalController.getAirQuality);

/**
 * @route   GET /api/environmental/wind-forecast
 * @desc    Récupère uniquement les prévisions de vent pour une localisation
 * @access  Public
 * @param   {number} lat - Latitude
 * @param   {number} lng - Longitude
 * @returns {Object} Données de prévision de vent
 */
router.get('/wind-forecast', apiLimiter, environmentalCache, environmentalController.getWindForecast);

/**
 * @route   POST /api/environmental/route
 * @desc    Récupère les données environnementales le long d'un itinéraire
 * @access  Public
 * @body    {Array<Object>} routePoints - Points de l'itinéraire [{lat, lng}, ...]
 * @returns {Object} Données environnementales pour l'itinéraire
 */
router.post('/route', apiLimiter, environmentalController.getEnvironmentalDataAlongRoute);

/**
 * @route   POST /api/environmental/route/air-quality
 * @desc    Récupère uniquement les données de qualité d'air le long d'un itinéraire
 * @access  Public
 * @body    {Array<Object>} routePoints - Points de l'itinéraire [{lat, lng}, ...]
 * @returns {Object} Données de qualité d'air pour l'itinéraire
 */
router.post('/route/air-quality', apiLimiter, environmentalController.getAirQualityAlongRoute);

/**
 * @route   POST /api/environmental/route/wind-forecast
 * @desc    Récupère uniquement les prévisions de vent le long d'un itinéraire
 * @access  Public
 * @body    {Array<Object>} routePoints - Points de l'itinéraire [{lat, lng}, ...]
 * @returns {Object} Données de prévision de vent pour l'itinéraire
 */
router.post('/route/wind-forecast', apiLimiter, environmentalController.getWindForecastAlongRoute);

module.exports = router;
