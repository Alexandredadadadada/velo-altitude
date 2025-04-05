/**
 * Routes pour l'analyse de corrélation des performances
 */

const express = require('express');
const performanceCorrelationController = require('../controllers/performance-correlation.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const cacheMiddleware = require('../middlewares/cache.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Corrélation des Performances
 *   description: API pour l'analyse des corrélations entre métriques d'entraînement et performances
 */

/**
 * @swagger
 * /api/correlations/training/{userId}:
 *   post:
 *     summary: Analyse les corrélations entre variables d'entraînement et performances
 *     description: Fournit une analyse détaillée des corrélations entre différentes métriques d'entraînement et indicateurs de performance
 *     tags: [Corrélation des Performances]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               options:
 *                 type: object
 *                 properties:
 *                   period:
 *                     type: integer
 *                     default: 90
 *                     description: Période d'analyse en jours
 *                   activityTypes:
 *                     type: array
 *                     items:
 *                       type: string
 *                     default: ['ride', 'virtualRide']
 *                     description: Types d'activités à inclure
 *                   metrics:
 *                     type: array
 *                     items:
 *                       type: string
 *                     default: ['duration', 'distance', 'elevationGain', 'averagePower', 'tss', 'intensity']
 *                     description: Métriques à analyser
 *     responses:
 *       200:
 *         description: Analyse des corrélations réussie
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
 *                     trainingMetrics:
 *                       type: object
 *                     performanceIndicators:
 *                       type: object
 *                     correlations:
 *                       type: object
 *                     timeSeriesData:
 *                       type: array
 *                       items:
 *                         type: object
 *                     insights:
 *                       type: array
 *                       items:
 *                         type: string
 *       400:
 *         description: Paramètres invalides
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.post(
  '/training/:userId',
  authMiddleware.verifyToken,
  cacheMiddleware.route({ ttl: 3600 }), // 1 heure
  performanceCorrelationController.analyzeTrainingPerformanceCorrelations
);

/**
 * @swagger
 * /api/correlations/compare/{userId}:
 *   post:
 *     summary: Compare les performances avec des cyclistes similaires
 *     description: Fournit une analyse comparative entre l'utilisateur et des cyclistes aux profils similaires
 *     tags: [Corrélation des Performances]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               options:
 *                 type: object
 *                 properties:
 *                   count:
 *                     type: integer
 *                     default: 5
 *                     description: Nombre de cyclistes similaires à inclure
 *                   matchCriteria:
 *                     type: array
 *                     items:
 *                       type: string
 *                     default: ['gender', 'ageRange', 'experienceLevel']
 *                     description: Critères de correspondance
 *                   includeDetailedStats:
 *                     type: boolean
 *                     default: true
 *                     description: Inclure les statistiques détaillées
 *     responses:
 *       200:
 *         description: Comparaison réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ComparisonData'
 *       400:
 *         description: Paramètres invalides
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.post(
  '/compare/:userId',
  authMiddleware.verifyToken,
  cacheMiddleware.route({ ttl: 86400 }), // 24 heures
  performanceCorrelationController.compareWithSimilarAthletes
);

/**
 * @swagger
 * /api/correlations/visualizations/{userId}:
 *   get:
 *     summary: Génère des visualisations pour les métriques avancées
 *     description: Fournit des données formatées pour visualiser les métriques avancées d'entraînement
 *     tags: [Corrélation des Performances]
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
 *         name: options
 *         required: false
 *         schema:
 *           type: string
 *         description: Options de visualisation (JSON stringifié)
 *     responses:
 *       200:
 *         description: Visualisations générées avec succès
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
 *                     metrics:
 *                       type: object
 *                     explanations:
 *                       type: object
 *                     timeSeriesData:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         description: Paramètres invalides
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.get(
  '/visualizations/:userId',
  authMiddleware.verifyToken,
  cacheMiddleware.route({ ttl: 3600 }), // 1 heure
  performanceCorrelationController.generateAdvancedMetricsVisualizations
);

/**
 * @swagger
 * /api/correlations/predict/{userId}/{eventId}:
 *   get:
 *     summary: Prédit les performances pour un événement
 *     description: Fournit des prédictions de performance pour un événement spécifique basées sur l'historique d'entraînement
 *     tags: [Corrélation des Performances]
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
 *       - in: query
 *         name: options
 *         required: false
 *         schema:
 *           type: string
 *         description: Options de prédiction (JSON stringifié)
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
 *                   $ref: '#/components/schemas/PerformancePrediction'
 *       400:
 *         description: Paramètres invalides
 *       404:
 *         description: Utilisateur ou événement non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.get(
  '/predict/:userId/:eventId',
  authMiddleware.verifyToken,
  cacheMiddleware.route({ ttl: 86400 }), // 24 heures
  performanceCorrelationController.predictEventPerformance
);

/**
 * @swagger
 * /api/correlations/dashboard/{userId}:
 *   get:
 *     summary: Récupère le tableau de bord analytique personnalisé
 *     description: Fournit un tableau de bord complet avec analyses, comparaisons et visualisations
 *     tags: [Corrélation des Performances]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Tableau de bord récupéré avec succès
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
 *                     correlations:
 *                       type: object
 *                     comparisons:
 *                       $ref: '#/components/schemas/ComparisonData'
 *                     visualizations:
 *                       type: object
 *                     lastUpdated:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.get(
  '/dashboard/:userId',
  authMiddleware.verifyToken,
  cacheMiddleware.route({ ttl: 3600 }), // 1 heure
  performanceCorrelationController.getCustomAnalyticsDashboard
);

module.exports = router;
