/**
 * Routes d'API pour les entraînements HIIT
 * Fournit des endpoints pour gérer les séances et programmes d'entraînement HIIT
 */
const express = require('express');
const router = express.Router();
const hiitController = require('../controllers/hiit-training.controller');
const { isAuthenticated } = require('../middleware/auth.middleware');

/**
 * @route GET /api/training/hiit/workouts
 * @desc Récupère tous les templates d'entraînements HIIT disponibles
 * @access Public
 */
router.get('/workouts', hiitController.getAvailableWorkouts);

/**
 * @route GET /api/training/hiit/workouts/:templateId
 * @desc Récupère les détails d'un template de séance HIIT spécifique
 * @access Private
 */
router.get('/workouts/:templateId', isAuthenticated, hiitController.getWorkoutDetails);

/**
 * @route POST /api/training/hiit/workouts
 * @desc Crée une séance HIIT personnalisée
 * @access Private
 */
router.post('/workouts', isAuthenticated, hiitController.createWorkout);

/**
 * @route POST /api/training/hiit/programs
 * @desc Génère un programme HIIT sur plusieurs semaines
 * @access Private
 */
router.post('/programs', isAuthenticated, hiitController.generateProgram);

module.exports = router;
