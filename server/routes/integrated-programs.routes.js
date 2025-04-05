/**
 * Routes pour les programmes intégrés combinant entraînement et nutrition
 */

const express = require('express');
const router = express.Router();
const integratedProgramsController = require('../controllers/integrated-programs.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const cacheMiddleware = require('../middleware/cache.middleware');

/**
 * @swagger
 * /api/programs/integrated/{userId}:
 *   get:
 *     summary: Récupère tous les programmes intégrés d'un utilisateur
 *     tags: [Programmes Intégrés]
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
 *         description: Liste des programmes intégrés de l'utilisateur
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/IntegratedProgram'
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
router.get(
  '/:userId',
  verifyToken,
  cacheMiddleware.cacheResponse('integrated_programs', 1800),
  integratedProgramsController.getUserPrograms
);

/**
 * @swagger
 * /api/programs/integrated/{userId}/{programId}:
 *   get:
 *     summary: Récupère un programme intégré par son ID
 *     tags: [Programmes Intégrés]
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
 *         name: programId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du programme intégré
 *     responses:
 *       200:
 *         description: Détails du programme intégré
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IntegratedProgram'
 *       404:
 *         description: Programme non trouvé
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
router.get(
  '/:userId/:programId',
  verifyToken,
  cacheMiddleware.cacheResponse('integrated_programs', 1800),
  integratedProgramsController.getProgramById
);

/**
 * @swagger
 * /api/programs/integrated/{userId}/{programId}/summary:
 *   get:
 *     summary: Récupère un résumé du programme intégré
 *     tags: [Programmes Intégrés]
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
 *         name: programId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du programme intégré
 *     responses:
 *       200:
 *         description: Résumé du programme intégré
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: Programme non trouvé
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
router.get(
  '/:userId/:programId/summary',
  verifyToken,
  cacheMiddleware.cacheResponse('integrated_programs', 3600),
  integratedProgramsController.getProgramSummary
);

/**
 * @swagger
 * /api/programs/integrated/{userId}:
 *   post:
 *     summary: Génère un nouveau programme intégré
 *     tags: [Programmes Intégrés]
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [endurance, performance, mountain]
 *               weeklyHours:
 *                 type: number
 *               focusAreas:
 *                 type: array
 *                 items:
 *                   type: string
 *               duration:
 *                 type: number
 *               nutritionPreferences:
 *                 type: object
 *               goal:
 *                 type: string
 *                 enum: [performance, weightLoss, recovery, maintenance]
 *     responses:
 *       201:
 *         description: Programme intégré créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IntegratedProgram'
 *       400:
 *         description: Paramètres invalides
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
router.post(
  '/:userId',
  verifyToken,
  integratedProgramsController.generateProgram
);

/**
 * @swagger
 * /api/programs/integrated/{userId}/{programId}:
 *   put:
 *     summary: Ajuste un programme intégré existant
 *     tags: [Programmes Intégrés]
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
 *         name: programId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du programme intégré
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               trainingAdjustments:
 *                 type: object
 *               nutritionAdjustments:
 *                 type: object
 *     responses:
 *       200:
 *         description: Programme intégré ajusté avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IntegratedProgram'
 *       400:
 *         description: Paramètres invalides
 *       404:
 *         description: Programme non trouvé
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
router.put(
  '/:userId/:programId',
  verifyToken,
  integratedProgramsController.adjustProgram
);

module.exports = router;
