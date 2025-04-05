/**
 * Routes pour les fonctionnalités d'IA liées à l'entraînement
 * Endpoints pour les recommandations personnalisées et l'analyse de performance
 */

const express = require('express');
const router = express.Router();
const trainingAiController = require('../controllers/training-ai.controller');
const authMiddleware = require('../middleware/auth.middleware');

/**
 * @swagger
 * /api/training/ai/recommendations/{userId}:
 *   get:
 *     summary: Obtient des recommandations d'entraînement personnalisées
 *     description: Génère un plan d'entraînement personnalisé basé sur le profil et l'historique de l'utilisateur
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Recommandations générées avec succès
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
router.get('/recommendations/:userId', 
  authMiddleware.authenticate,
  trainingAiController.getPersonalizedRecommendations
);

/**
 * @swagger
 * /api/training/ai/analyze/{userId}/{activityId}:
 *   get:
 *     summary: Analyse les performances d'une activité
 *     description: Fournit une analyse détaillée des performances pour une activité spécifique
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *       - in: path
 *         name: activityId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'activité à analyser
 *     responses:
 *       200:
 *         description: Analyse générée avec succès
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès interdit à cette activité
 *       404:
 *         description: Activité non trouvée
 *       500:
 *         description: Erreur serveur
 */
router.get('/analyze/:userId/:activityId',
  authMiddleware.authenticate,
  trainingAiController.analyzeActivityPerformance
);

module.exports = router;
