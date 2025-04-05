// strava.routes.js - Routes pour l'intégration avec l'API Strava
const express = require('express');
const router = express.Router();
const stravaController = require('../controllers/strava.controller');

// Route pour initialiser l'authentification Strava
router.get('/auth', stravaController.initiateAuth.bind(stravaController));

// Route de callback pour l'authentification Strava
router.get('/callback', stravaController.handleCallback.bind(stravaController));

// Route pour récupérer les activités de l'utilisateur
router.get('/activities', stravaController.getActivities.bind(stravaController));

// Route pour récupérer les détails d'une activité spécifique
router.get('/activities/:activityId', stravaController.getActivityDetails.bind(stravaController));

// Route pour récupérer les statistiques de l'athlète
router.get('/stats', stravaController.getAthleteStats.bind(stravaController));

// Route pour déconnecter l'utilisateur de Strava
router.post('/logout', stravaController.logout.bind(stravaController));

module.exports = router;
