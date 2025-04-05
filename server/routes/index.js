// routes/index.js - Point d'entrée pour toutes les routes de l'API
const express = require('express');
const router = express.Router();

// Importation des routes spécifiques
const stravaRoutes = require('./strava.routes');
const stravaTokenRoutes = require('./strava-token.routes');
const weatherRoutes = require('./weather.routes');
const routeRoutes = require('./route.routes');
const aiRoutes = require('./ai.routes');
const passRoutes = require('./pass.routes');
const routePlannerRoutes = require('./route-planner.routes');
const elevationProfileRoutes = require('./elevation-profile.routes');
const routeAlternativesRoutes = require('./route-alternatives.routes');
const visualizationRoutes = require('./visualization.routes');
const environmentalRoutes = require('./environmental.routes');
const environmentalPredictionRoutes = require('./environmental-prediction.routes');
const effortEstimationRoutes = require('./effort-estimation.routes');
const weatherAlertRoutes = require('./weather-alert.routes');
const routeWeatherAlertsRoutes = require('./route-weather-alerts.routes');
const trainingRoutes = require('./training.routes');
const trainingAiRoutes = require('./training-ai.routes');
const hiitTrainingRoutes = require('./hiit-training.routes');
const metricsRoutes = require('./metrics.routes');
const socialRoutes = require('./social.routes');
const dataExportRoutes = require('./data-export.routes');
const cacheRoutes = require('./cache.routes');
const challengesRoutes = require('./challengesRoutes');
const colChallengeRoutes = require('./col-challenge.routes');
const adminApiRoutes = require('./admin-api.routes');
const adminSettingsRoutes = require('./admin-settings.routes');
const apiMonitoringRoutes = require('./api-monitoring.routes');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const diagnosticRoutes = require('./diagnostic.routes');
const routeVisualizationRoutes = require('./route-visualization.routes');
const colDetailsRoutes = require('./col-details.routes');

// Configuration des points de montage des routes
router.use('/api/strava', stravaRoutes);
router.use('/api/strava-token', stravaTokenRoutes);
router.use('/api/weather', weatherRoutes);
router.use('/api/routes', routeRoutes);
router.use('/api/ai', aiRoutes);
router.use('/api/passes', passRoutes);
router.use('/api/route-planner', routePlannerRoutes);
router.use('/api/elevation-profile', elevationProfileRoutes);
router.use('/api/route-alternatives', routeAlternativesRoutes);
router.use('/api/visualization', visualizationRoutes);
router.use('/api/environmental', environmentalRoutes);
router.use('/api/environmental/predictions', environmentalPredictionRoutes);
router.use('/api/effort-estimation', effortEstimationRoutes);
router.use('/api/weather-alerts', weatherAlertRoutes);
router.use('/api/routes/weather-alerts', routeWeatherAlertsRoutes);
router.use('/api/training', trainingRoutes);
router.use('/api/training/ai', trainingAiRoutes);
router.use('/api/training/hiit', hiitTrainingRoutes);
router.use('/api/metrics', metricsRoutes);
router.use('/api/social', socialRoutes);
router.use('/api/export', dataExportRoutes);
router.use('/api/cache', cacheRoutes);
router.use('/api/challenges', challengesRoutes);
router.use('/api/col-challenges', colChallengeRoutes);
router.use('/api/auth', authRoutes);
router.use('/api/users', userRoutes);
router.use('/api/admin/monitoring', adminApiRoutes);
router.use('/api/monitoring', apiMonitoringRoutes);
router.use('/api/admin', adminSettingsRoutes);
router.use('/api/diagnostic', diagnosticRoutes);
router.use('/api/route-visualization', routeVisualizationRoutes);
router.use('/api/col-details', colDetailsRoutes);

// Route de base pour vérifier que l'API est opérationnelle
router.get('/api/status', (req, res) => {
  res.json({
    status: 'success',
    message: 'API Grand Est Cyclisme opérationnelle',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Route par défaut pour les requêtes non trouvées
router.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Ressource non trouvée'
  });
});

module.exports = router;
