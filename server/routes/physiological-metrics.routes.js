/**
 * Routes pour les métriques physiologiques avancées
 */
const express = require('express');
const router = express.Router();
const physiologicalMetricsController = require('../controllers/physiological-metrics.controller');
const { authenticateJWT } = require('../middleware/auth.middleware');

// Toutes les routes nécessitent une authentification
router.use(authenticateJWT);

// Routes pour l'estimation FTP
router.post('/estimate-ftp', physiologicalMetricsController.estimateFTP);
router.get('/training-zones/:ftp', physiologicalMetricsController.getTrainingZones);
router.get('/ftp-models', physiologicalMetricsController.getFTPEstimationModels);

// Routes pour le suivi de fatigue
router.post('/evaluate-fatigue', physiologicalMetricsController.evaluateFatigue);
router.get('/fatigue-models', physiologicalMetricsController.getFatigueTrackingModels);

// Routes pour le modèle prédictif
router.post('/progression-model', physiologicalMetricsController.generateProgressionModel);

// Routes pour l'enregistrement de données physiologiques
router.post('/record-data', physiologicalMetricsController.recordPhysiologicalData);

module.exports = router;
