/**
 * Routes pour l'exportation de données
 * Permet l'interopérabilité avec d'autres plateformes
 */

const express = require('express');
const router = express.Router();
const dataExportController = require('../controllers/data-export.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Toutes les routes d'exportation nécessitent une authentification
router.use(authMiddleware.validateToken);

// Export d'activités
router.get('/users/:userId/activities', dataExportController.exportActivities);

// Création d'archives d'export multi-formats
router.post('/users/:userId/archive', dataExportController.createExportArchive);

// Export de programmes d'entraînement
router.get('/users/:userId/programs/:programId', dataExportController.exportTrainingProgram);

module.exports = router;
