/**
 * Routes de nutrition
 * Expose les endpoints API liés à la nutrition des cyclistes
 */

const express = require('express');
const router = express.Router();
const nutritionController = require('../controllers/nutrition.controller');
const { isAuthenticated } = require('../middleware/auth.middleware');
const { cacheMiddleware } = require('../middleware/cache.middleware');

// Configuration des durées de cache
const CACHE_DURATIONS = {
  PLANS: 24 * 60 * 60, // 24 heures pour les plans statiques
  NEEDS: 6 * 60 * 60,  // 6 heures pour les besoins nutritionnels
  PERSONAL: 12 * 60 * 60 // 12 heures pour les plans personnalisés
};

/**
 * @swagger
 * /api/nutrition/plans:
 *   get:
 *     summary: Récupère tous les plans nutritionnels disponibles
 *     description: Retourne la liste de tous les plans nutritionnels génériques disponibles
 *     tags: [Nutrition]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des plans nutritionnels
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/NutritionPlan'
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur serveur
 */
router.get(
  '/plans',
  isAuthenticated,
  cacheMiddleware('nutrition:plans', CACHE_DURATIONS.PLANS),
  nutritionController.getAllNutritionPlans
);

/**
 * @swagger
 * /api/nutrition/plans/{planId}:
 *   get:
 *     summary: Récupère un plan nutritionnel par son ID
 *     description: Retourne les détails d'un plan nutritionnel spécifique
 *     tags: [Nutrition]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID du plan nutritionnel
 *     responses:
 *       200:
 *         description: Plan nutritionnel trouvé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/NutritionPlan'
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Plan non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.get(
  '/plans/:planId',
  isAuthenticated,
  cacheMiddleware('nutrition:plan', CACHE_DURATIONS.PLANS),
  nutritionController.getNutritionPlanById
);

/**
 * @swagger
 * /api/nutrition/users/{userId}/needs:
 *   get:
 *     summary: Calcule les besoins nutritionnels d'un utilisateur
 *     description: Calcule les besoins caloriques et en macronutriments en fonction du profil et de l'activité
 *     tags: [Nutrition]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de l'utilisateur
 *       - in: query
 *         name: activityLevel
 *         schema:
 *           type: string
 *           enum: [sedentary, lightlyActive, moderatelyActive, veryActive, extraActive]
 *         description: Niveau d'activité (optionnel)
 *       - in: query
 *         name: goal
 *         schema:
 *           type: string
 *           enum: [maintenance, performance, weightLoss, recovery]
 *         description: Objectif nutritionnel (optionnel)
 *     responses:
 *       200:
 *         description: Besoins nutritionnels calculés
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/NutritionalNeeds'
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.get(
  '/users/:userId/needs',
  isAuthenticated,
  cacheMiddleware('nutrition:needs', CACHE_DURATIONS.NEEDS),
  nutritionController.calculateNutritionalNeeds
);

/**
 * @swagger
 * /api/nutrition/users/{userId}/plan:
 *   get:
 *     summary: Génère un plan nutritionnel personnalisé
 *     description: Crée un plan alimentaire personnalisé adapté au profil et aux objectifs de l'utilisateur
 *     tags: [Nutrition]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de l'utilisateur
 *       - in: query
 *         name: trainingPlanId
 *         schema:
 *           type: string
 *         description: ID du plan d'entraînement associé (optionnel)
 *     responses:
 *       200:
 *         description: Plan nutritionnel personnalisé généré
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/NutritionPlan'
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.get(
  '/users/:userId/plan',
  isAuthenticated,
  cacheMiddleware('nutrition:user:plan', CACHE_DURATIONS.PERSONAL),
  nutritionController.generatePersonalizedPlan
);

/**
 * @swagger
 * /api/nutrition/users/{userId}/event-strategy:
 *   post:
 *     summary: Génère une stratégie nutritionnelle pour un événement
 *     description: Crée une stratégie alimentaire adaptée à un événement spécifique (course, randonnée, etc.)
 *     tags: [Nutrition]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de l'utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - duration
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nom de l'événement
 *               type:
 *                 type: string
 *                 description: Type d'événement (course, randonnée, montagne, etc.)
 *               duration:
 *                 type: number
 *                 description: Durée estimée en minutes
 *               distance:
 *                 type: number
 *                 description: Distance en kilomètres (optionnel)
 *               elevation:
 *                 type: number
 *                 description: Dénivelé en mètres (optionnel)
 *               temperature:
 *                 type: number
 *                 description: Température prévue en °C (optionnel)
 *               intensity:
 *                 type: number
 *                 description: Intensité prévue de 0 à 1 (optionnel)
 *     responses:
 *       200:
 *         description: Stratégie nutritionnelle générée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/EventNutritionStrategy'
 *       400:
 *         description: Données d'événement incomplètes
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.post(
  '/users/:userId/event-strategy',
  isAuthenticated,
  nutritionController.generateEventStrategy
);

/**
 * @swagger
 * /api/nutrition/users/{userId}/analyze-journal:
 *   post:
 *     summary: Analyse un journal alimentaire
 *     description: Analyse le journal alimentaire de l'utilisateur et fournit des recommandations
 *     tags: [Nutrition]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de l'utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - foodJournal
 *             properties:
 *               foodJournal:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - calories
 *                     - macros
 *                   properties:
 *                     name:
 *                       type: string
 *                       description: Nom de l'aliment
 *                     calories:
 *                       type: number
 *                       description: Calories
 *                     macros:
 *                       type: object
 *                       properties:
 *                         carbs:
 *                           type: number
 *                           description: Glucides en grammes
 *                         protein:
 *                           type: number
 *                           description: Protéines en grammes
 *                         fat:
 *                           type: number
 *                           description: Lipides en grammes
 *                     category:
 *                       type: string
 *                       description: Catégorie d'aliment (optionnel)
 *                     timing:
 *                       type: string
 *                       description: Moment de consommation (optionnel)
 *     responses:
 *       200:
 *         description: Analyse et recommandations générées
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/JournalAnalysis'
 *       400:
 *         description: Journal alimentaire invalide
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur serveur
 */
router.post(
  '/users/:userId/analyze-journal',
  isAuthenticated,
  nutritionController.analyzeNutritionJournal
);

module.exports = router;
