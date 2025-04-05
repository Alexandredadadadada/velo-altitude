/**
 * Routes pour les métriques d'API
 * Fournit des endpoints pour surveiller les performances, la fiabilité et la disponibilité des API
 */

const express = require('express');
const router = express.Router();
const metricsController = require('../controllers/metrics.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Route publique pour les statistiques de base (limitée)
router.get('/status', metricsController.getApiStats);

// Routes protégées (nécessitent authentification)
router.use(authMiddleware.validateToken);

// Récupération des statistiques détaillées
router.get('/services/:apiName', metricsController.getApiDetailedStats);
router.get('/recommendations', metricsController.getReliabilityRecommendations);

// Routes d'administration (nécessitent droits admin)
router.use(authMiddleware.requireAdmin);

router.post('/reset', metricsController.resetApiStats);
router.get('/export', metricsController.exportApiStats);

module.exports = router;
