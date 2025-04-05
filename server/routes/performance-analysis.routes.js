/**
 * Routes pour l'analyse de performance intégrant nutrition et entraînement
 */

const express = require('express');
const router = express.Router();
const performanceAnalysisController = require('../controllers/performance-analysis.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const cacheMiddleware = require('../middleware/cache.middleware');

/**
 * @swagger
 * /api/performance/analysis/{userId}/nutrition-correlation:
 *   get:
 *     summary: Analyse la corrélation entre nutrition et performance
 *     tags: [Analyse de Performance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Nombre de jours à analyser (1-365)
 *     responses:
 *       200:
 *         description: Analyse de corrélation nutrition-performance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 correlationData:
 *                   type: array
 *                   items:
 *                     type: object
 *                 analysis:
 *                   type: object
 *                 recommendations:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Paramètres invalides
 *       404:
 *         description: Données insuffisantes pour l'analyse
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
router.get(
  '/:userId/nutrition-correlation',
  verifyToken,
  cacheMiddleware.cacheResponse('performance_analysis', 3600),
  performanceAnalysisController.analyzeNutritionPerformanceCorrelation
);

/**
 * @swagger
 * /api/performance/analysis/{userId}/pre-event/{eventId}:
 *   get:
 *     summary: Analyse la nutrition pré-événement
 *     tags: [Analyse de Performance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'événement
 *     responses:
 *       200:
 *         description: Analyse de la nutrition pré-événement
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: Données insuffisantes pour l'analyse
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
router.get(
  '/:userId/pre-event/:eventId',
  verifyToken,
  cacheMiddleware.cacheResponse('performance_analysis', 3600),
  performanceAnalysisController.analyzePreEventNutrition
);

/**
 * @swagger
 * /api/performance/analysis/{userId}/visualization:
 *   get:
 *     summary: Obtient des données de visualisation pour nutrition-performance
 *     tags: [Analyse de Performance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Nombre de jours à analyser (1-365)
 *       - in: query
 *         name: metric
 *         schema:
 *           type: string
 *           enum: [calories, carbs, protein, fat, hydration]
 *         description: Métrique nutritionnelle à visualiser
 *     responses:
 *       200:
 *         description: Données de visualisation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Paramètres invalides
 *       404:
 *         description: Données insuffisantes pour la visualisation
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
router.get(
  '/:userId/visualization',
  verifyToken,
  cacheMiddleware.cacheResponse('performance_analysis', 1800),
  performanceAnalysisController.getPerformanceVisualization
);

module.exports = router;
