/**
 * Routes d'administration pour le Dashboard Cycliste Européen
 * Ces routes sont protégées et nécessitent un rôle d'administrateur
 */

const express = require('express');
const router = express.Router();
const { authenticateJWT, requireAdmin } = require('../middleware/authMiddleware');
const apiMonitorController = require('../controllers/apiMonitorController');

// Middleware pour vérifier l'authentification et les permissions admin sur toutes les routes
router.use(authenticateJWT);
router.use(requireAdmin);

// Routes pour le monitoring des API
router.get('/api-status', apiMonitorController.getApiStatus);
router.get('/api-usage', apiMonitorController.getApiUsage);
router.post('/check-api-status', apiMonitorController.checkApiStatus);

// Exporter le router
module.exports = router;
