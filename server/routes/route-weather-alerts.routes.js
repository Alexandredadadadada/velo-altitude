/**
 * Routes pour les alertes météo liées aux itinéraires
 */

const express = require('express');
const router = express.Router();
const routeWeatherAlertsController = require('../controllers/route-weather-alerts.controller');
const { authenticateJWT } = require('../middleware/auth.middleware');
const cacheMiddleware = require('../middleware/cache.middleware');

/**
 * @swagger
 * /api/routes/weather-alerts/{routeId}:
 *   get:
 *     summary: Analyse les conditions météo d'un itinéraire et génère des alertes
 *     tags: [Routes, Météo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: routeId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'itinéraire à analyser
 *       - in: query
 *         name: forecastHours
 *         schema:
 *           type: integer
 *           default: 24
 *         description: Nombre d'heures de prévision
 *       - in: query
 *         name: alertTypes
 *         schema:
 *           type: string
 *         description: Types d'alertes à inclure (séparés par des virgules)
 *       - in: query
 *         name: threshold
 *         schema:
 *           type: string
 *           enum: [standard, high, low]
 *           default: standard
 *         description: Sensibilité des alertes
 *       - in: query
 *         name: useCache
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Utiliser le cache pour les résultats
 *       - in: query
 *         name: segmentLength
 *         schema:
 *           type: number
 *         description: Intervalle de distance (km) entre les points analysés
 *     responses:
 *       200:
 *         description: Alertes météo générées pour l'itinéraire
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     alerts:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/WeatherAlert'
 *                     stats:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         bySeverity:
 *                           type: object
 *                         byType:
 *                           type: object
 *                     routeInfo:
 *                       type: object
 *       400:
 *         description: Paramètres invalides
 *       404:
 *         description: Itinéraire non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.get('/:routeId', 
  authenticateJWT, 
  cacheMiddleware.route({ ttl: 15 * 60 }), // 15 minutes de cache
  routeWeatherAlertsController.analyzeRouteWeather
);

/**
 * @swagger
 * /api/routes/weather-alerts/{routeId}/changes:
 *   get:
 *     summary: Vérifie les changements significatifs de météo pour un itinéraire
 *     tags: [Routes, Météo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: routeId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'itinéraire à surveiller
 *       - in: query
 *         name: onlySignificant
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Ne renvoyer que les changements significatifs
 *     responses:
 *       200:
 *         description: Changements météo détectés
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     changes:
 *                       type: array
 *                       items:
 *                         type: object
 *                     hasSignificantChanges:
 *                       type: boolean
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Itinéraire non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.get('/:routeId/changes', 
  authenticateJWT, 
  cacheMiddleware.route({ ttl: 5 * 60 }), // 5 minutes de cache
  routeWeatherAlertsController.checkWeatherChanges
);

module.exports = router;
