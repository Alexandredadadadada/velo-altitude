/**
 * Routes de programmes d'entraînement
 * Expose les endpoints API liés aux programmes d'entraînement personnalisés
 */

const express = require('express');
const router = express.Router();
const trainingProgramsController = require('../controllers/training-programs.controller');
const { isAuthenticated } = require('../middleware/auth.middleware');
const { cacheMiddleware } = require('../middleware/cache.middleware');

// Configuration des durées de cache
const CACHE_DURATIONS = {
  PROGRAMS: 12 * 60 * 60 // 12 heures pour les programmes d'entraînement
};

/**
 * @swagger
 * /api/training/programs/users/{userId}:
 *   post:
 *     summary: Génère un programme d'entraînement personnalisé
 *     description: Crée un programme d'entraînement adapté au profil et aux objectifs de l'utilisateur
 *     tags: [Entraînement]
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
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [endurance, performance, climbing]
 *                 description: Type de programme
 *               weeklyHours:
 *                 type: number
 *                 description: Nombre d'heures d'entraînement hebdomadaire souhaité
 *               preferredDays:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Jours préférés pour l'entraînement
 *               duration:
 *                 type: number
 *                 description: Durée du programme en jours
 *               notes:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Notes spécifiques pour le programme
 *     responses:
 *       200:
 *         description: Programme d'entraînement généré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/TrainingProgram'
 *       400:
 *         description: Paramètres invalides
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.post(
  '/users/:userId',
  isAuthenticated,
  trainingProgramsController.generateProgram
);

/**
 * @swagger
 * /api/training/programs/users/{userId}/integrated:
 *   post:
 *     summary: Génère un programme intégré entraînement-nutrition
 *     description: Crée un programme combinant entraînement personnalisé et plan nutritionnel adapté
 *     tags: [Entraînement, Nutrition]
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
 *               - trainingParameters
 *             properties:
 *               trainingParameters:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [endurance, performance, climbing]
 *                     description: Type de programme d'entraînement
 *                   weeklyHours:
 *                     type: number
 *                     description: Nombre d'heures d'entraînement hebdomadaire souhaité
 *                   preferredDays:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Jours préférés pour l'entraînement
 *                   duration:
 *                     type: number
 *                     description: Durée du programme en jours
 *               nutritionGoal:
 *                 type: string
 *                 enum: [performance, weightLoss, recovery, maintenance]
 *                 description: Objectif nutritionnel
 *     responses:
 *       200:
 *         description: Programme intégré généré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/IntegratedProgram'
 *       400:
 *         description: Paramètres invalides
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.post(
  '/users/:userId/integrated',
  isAuthenticated,
  trainingProgramsController.generateIntegratedProgram
);

/**
 * @swagger
 * /api/training/programs/users/{userId}/{programId}/adjust:
 *   put:
 *     summary: Ajuste un programme d'entraînement existant
 *     description: Modifie un programme existant selon les nouveaux paramètres
 *     tags: [Entraînement]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de l'utilisateur
 *       - in: path
 *         name: programId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID du programme à ajuster
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - adjustments
 *             properties:
 *               adjustments:
 *                 type: object
 *                 properties:
 *                   weeklyHours:
 *                     type: number
 *                     description: Nouveau nombre d'heures hebdomadaires
 *                   preferredDays:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Nouveaux jours préférés
 *                   duration:
 *                     type: number
 *                     description: Nouvelle durée en jours
 *                   type:
 *                     type: string
 *                     enum: [endurance, performance, climbing]
 *                     description: Nouveau type de programme
 *     responses:
 *       200:
 *         description: Programme ajusté avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/TrainingProgram'
 *       400:
 *         description: Paramètres invalides
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Utilisateur ou programme non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.put(
  '/users/:userId/:programId/adjust',
  isAuthenticated,
  trainingProgramsController.adjustProgram
);

module.exports = router;
