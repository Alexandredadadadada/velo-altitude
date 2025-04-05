/**
 * Routes pour les prédictions environnementales
 * Gère les endpoints API pour les prédictions de conditions et dates optimales
 */

const express = require('express');
const router = express.Router();
const environmentalPredictionController = require('../controllers/environmental-prediction.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { cacheMiddleware, environmentalCacheKeyGenerator } = require('../middleware/cache.middleware');

// Configurer le cache pour les prédictions environnementales (1 heure)
const predictionCache = cacheMiddleware(3600, environmentalCacheKeyGenerator);

/**
 * @swagger
 * /api/environmental/predictions/route/{routeId}:
 *   get:
 *     summary: Prédit les conditions environnementales pour un itinéraire
 *     description: Génère des prédictions météo, qualité d'air et vent pour un itinéraire à une date spécifique
 *     tags: [Prédictions Environnementales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: routeId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'itinéraire
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Date cible pour la prédiction (format YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Prédictions générées avec succès
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
 *                     routePoints:
 *                       type: integer
 *                       example: 120
 *                     keyPointsPredictions:
 *                       type: array
 *                       items:
 *                         type: object
 *                     overallPrediction:
 *                       type: object
 *                       properties:
 *                         score:
 *                           type: integer
 *                           example: 78
 *                         category:
 *                           type: string
 *                           example: "Bon"
 *                     optimalTimeOfDay:
 *                       type: object
 *                     confidence:
 *                       type: object
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Paramètres invalides
 *       404:
 *         description: Itinéraire non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.get('/route/:routeId', 
  authMiddleware.authenticate,
  predictionCache,
  environmentalPredictionController.predictRouteConditions
);

/**
 * @swagger
 * /api/environmental/predictions/optimal-date/{routeId}:
 *   get:
 *     summary: Trouve la date optimale pour un itinéraire
 *     description: Détermine la meilleure date pour parcourir un itinéraire dans une plage donnée
 *     tags: [Prédictions Environnementales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: routeId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'itinéraire
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de début de la plage (format YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de fin de la plage (format YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Date optimale trouvée avec succès
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
 *                     routeId:
 *                       type: string
 *                       example: "60a1f2c3d4e5f6a7b8c9d0e1"
 *                     optimalDate:
 *                       type: string
 *                       format: date-time
 *                     score:
 *                       type: integer
 *                       example: 85
 *                     allDates:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date-time
 *                           score:
 *                             type: integer
 *                           category:
 *                             type: string
 *       400:
 *         description: Paramètres invalides
 *       404:
 *         description: Itinéraire non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.get('/optimal-date/:routeId', 
  authMiddleware.authenticate,
  predictionCache,
  environmentalPredictionController.findOptimalDate
);

module.exports = router;
