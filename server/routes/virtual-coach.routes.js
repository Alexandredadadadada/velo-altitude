/**
 * Routes pour l'assistant virtuel d'entraînement
 */

const express = require('express');
const router = express.Router();
const VirtualCoachController = require('../controllers/virtual-coach.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { cacheMiddleware } = require('../middleware/cache.middleware');

// Toutes les routes nécessitent une authentification
router.use(authenticate);

/**
 * @swagger
 * /api/virtual-coach/{userId}/question:
 *   post:
 *     summary: Pose une question à l'assistant d'entraînement
 *     tags: [Virtual Coach]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifiant de l'utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question
 *             properties:
 *               question:
 *                 type: string
 *                 description: Question posée à l'assistant
 *               domain:
 *                 type: string
 *                 enum: [training, nutrition, performance, general]
 *                 default: general
 *                 description: Domaine de la question
 *               includeUserContext:
 *                 type: boolean
 *                 default: true
 *                 description: Inclure le contexte utilisateur dans l'analyse
 *     responses:
 *       200:
 *         description: Réponse de l'assistant
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 question:
 *                   type: string
 *                 answer:
 *                   type: string
 *                 domain:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 sources:
 *                   type: array
 *                   items:
 *                     type: string
 *                 confidence:
 *                   type: number
 *                   format: float
 *       400:
 *         description: Paramètres invalides
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
router.post('/:userId/question', VirtualCoachController.answerQuestion);

/**
 * @swagger
 * /api/virtual-coach/{userId}/advice:
 *   post:
 *     summary: Génère un conseil personnalisé basé sur les données de l'utilisateur
 *     tags: [Virtual Coach]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifiant de l'utilisateur
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               focusArea:
 *                 type: string
 *                 enum: [general, endurance, intensity, recovery, nutrition]
 *                 default: general
 *               lookbackPeriod:
 *                 type: integer
 *                 default: 30
 *                 description: Période d'analyse en jours
 *               targetEventId:
 *                 type: string
 *                 description: ID de l'événement cible (optionnel)
 *     responses:
 *       200:
 *         description: Conseil personnalisé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 focusArea:
 *                   type: string
 *                 overview:
 *                   type: string
 *                 insights:
 *                   type: array
 *                   items:
 *                     type: string
 *                 recommendations:
 *                   type: array
 *                   items:
 *                     type: string
 *                 nextSteps:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
router.post('/:userId/advice', cacheMiddleware({ ttl: 3600 }), VirtualCoachController.generatePersonalizedAdvice);

/**
 * @swagger
 * /api/virtual-coach/{userId}/workout/{activityId}/analyze:
 *   post:
 *     summary: Analyse un entraînement spécifique et fournit des commentaires
 *     tags: [Virtual Coach]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifiant de l'utilisateur
 *       - in: path
 *         name: activityId
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifiant de l'activité à analyser
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               detailLevel:
 *                 type: string
 *                 enum: [basic, standard, detailed]
 *                 default: standard
 *               compareToPrevious:
 *                 type: boolean
 *                 default: true
 *               focusAreas:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [technique, intensity, pacing, efficiency]
 *     responses:
 *       200:
 *         description: Analyse de l'entraînement
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: string
 *                 activityId:
 *                   type: string
 *                 activityName:
 *                   type: string
 *                 activityDate:
 *                   type: string
 *                   format: date-time
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 overview:
 *                   type: string
 *                 strengths:
 *                   type: array
 *                   items:
 *                     type: string
 *                 improvements:
 *                   type: array
 *                   items:
 *                     type: string
 *                 recommendations:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Activité non trouvée
 *       500:
 *         description: Erreur serveur
 */
router.post('/:userId/workout/:activityId/analyze', cacheMiddleware({ ttl: 86400 }), VirtualCoachController.analyzeWorkout);

/**
 * @swagger
 * /api/virtual-coach/{userId}/plan/{programId}/adjust:
 *   post:
 *     summary: Suggère des ajustements à un plan d'entraînement
 *     tags: [Virtual Coach]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifiant de l'utilisateur
 *       - in: path
 *         name: programId
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifiant du programme d'entraînement
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               difficultyFeedback:
 *                 type: string
 *                 enum: [too_easy, appropriate, too_hard]
 *               completedWorkouts:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     workoutId:
 *                       type: string
 *                     completionRate:
 *                       type: number
 *                       format: float
 *                     perceivedExertion:
 *                       type: integer
 *                       minimum: 1
 *                       maximum: 10
 *               timeConstraints:
 *                 type: object
 *                 properties:
 *                   availableHours:
 *                     type: integer
 *                   preferredDays:
 *                     type: array
 *                     items:
 *                       type: string
 *                       enum: [monday, tuesday, wednesday, thursday, friday, saturday, sunday]
 *               healthIssues:
 *                 type: array
 *                 items:
 *                   type: string
 *               goals:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Ajustements suggérés pour le plan d'entraînement
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: string
 *                 programId:
 *                   type: string
 *                 programName:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 summary:
 *                   type: string
 *                 weeklyAdjustments:
 *                   type: object
 *                 workoutModifications:
 *                   type: array
 *                   items:
 *                     type: string
 *                 intensityAdjustments:
 *                   type: string
 *                 recoveryRecommendations:
 *                   type: string
 *                 progressionStrategy:
 *                   type: string
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Programme non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.post('/:userId/plan/:programId/adjust', VirtualCoachController.suggestPlanAdjustments);

module.exports = router;
