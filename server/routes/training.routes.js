/**
 * Routes pour les fonctionnalités d'entraînement
 * Fournit des endpoints pour les zones d'entraînement, l'estimation FTP,
 * et la gestion des programmes d'entraînement
 */

const express = require('express');
const router = express.Router();
const trainingController = require('../controllers/training.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const trainingProgramsRoutes = require('./training-programs.routes');

// Middleware d'authentification pour toutes les routes d'entraînement
router.use(authMiddleware.validateToken);

// Routes pour les programmes d'entraînement avancés
router.use('/programs', trainingProgramsRoutes);

// Routes pour les zones d'entraînement
router.get('/users/:userId/zones', trainingController.getTrainingZones);

// Routes pour l'estimation FTP
router.post('/users/:userId/ftp/estimate', trainingController.estimateFtpFromActivities);
router.post('/users/:userId/ftp/test', trainingController.estimateFtpFromTest);

// Routes pour les activités
router.get('/users/:userId/activities', trainingController.getUserActivities);
router.post('/users/:userId/activities', trainingController.saveActivity);

// Routes pour les programmes d'entraînement
router.get('/users/:userId/programs', trainingController.getUserPrograms);
router.post('/users/:userId/programs', trainingController.generateTrainingProgram);

// Route pour l'analyse des performances
router.get('/users/:userId/performance', trainingController.analyzePerformance);

module.exports = router;
