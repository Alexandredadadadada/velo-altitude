/**
 * Routes pour la synchronisation des activités Strava
 */

const express = require('express');
const router = express.Router();
const stravaSyncController = require('../controllers/strava-sync.controller');
const { authenticateJWT, isAdmin } = require('../middleware/auth.middleware');

// Routes protégées par authentification
router.use(authenticateJWT);

// Démarrer une synchronisation
router.post('/', stravaSyncController.startSync);

// Obtenir le statut de synchronisation actuel
router.get('/status', stravaSyncController.getSyncStatus);

// Annuler une synchronisation en cours
router.delete('/', stravaSyncController.cancelSync);

// Obtenir l'historique des synchronisations
router.get('/history', stravaSyncController.getSyncHistory);

// Obtenir les statistiques globales (admin uniquement)
router.get('/stats', isAdmin, stravaSyncController.getGlobalStats);

module.exports = router;
