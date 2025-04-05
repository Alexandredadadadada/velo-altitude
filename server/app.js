/**
 * Application principale du serveur
 * Tableau de bord européen de cyclisme
 */
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const fs = require('fs');

// Middleware de surveillance des performances
const performanceMonitorMiddleware = require('./middleware/performance-monitor.middleware');

// Charger les variables d'environnement
dotenv.config();

// Initialiser l'application Express
const app = express();

// Middleware de sécurité
app.use(helmet());

// Configuration de CORS
app.use(cors());

// Parser le JSON des requêtes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de surveillance des performances
app.use(performanceMonitorMiddleware);

// Limiter les requêtes pour prévenir les attaques par force brute
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limite chaque IP à 100 requêtes par fenêtre
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Trop de requêtes, veuillez réessayer dans 15 minutes.'
});
app.use('/api/', apiLimiter);

// Configurer les logs
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Logger en mode développement dans la console
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Logger toutes les requêtes dans un fichier
const accessLogStream = fs.createWriteStream(
  path.join(logsDir, 'access.log'),
  { flags: 'a' }
);
app.use(morgan('combined', { stream: accessLogStream }));

// Initialiser les services
require('./services/api-quota-monitor.service');
require('./services/strava-token.service');
require('./services/api-monitoring.service');
require('./services/cols-conditions-monitor.service');
require('./services/nutrition.service').initialize(); // Initialiser le service de nutrition

// Routes API
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const environmentalRoutes = require('./routes/environmental.routes');
const routesRoutes = require('./routes/routes.routes');
const colsRoutes = require('./routes/cols.routes');
const trainingRoutes = require('./routes/training.routes');
const trainingAiRoutes = require('./routes/training-ai.routes');
const nutritionRoutes = require('./routes/nutrition.routes');
const integratedProgramsRoutes = require('./routes/integrated-programs.routes');
const performanceAnalysisRoutes = require('./routes/performance-analysis.routes');
const advancedMappingRoutes = require('./routes/advanced-mapping.routes');
const performanceCorrelationRoutes = require('./routes/performance-correlation.routes');
const adminApiRoutes = require('./routes/admin-api.routes');
const colsConditionsRoutes = require('./routes/cols-conditions.routes');
const cacheRoutes = require('./routes/cache.routes');
const socialRoutes = require('./routes/social.routes');
const routeWeatherRoutes = require('./routes/route-weather.routes');
const physiologicalMetricsRoutes = require('./routes/physiological-metrics.routes');
const weatherPreferencesRoutes = require('./routes/weather-preferences.routes');
const europeanColsRoutes = require('./routes/europeanColsRoutes');
const routeReviewRoutes = require('./routes/route-review.routes');
const routeRecommendationRoutes = require('./routes/route-recommendation.routes');
const reviewModerationRoutes = require('./routes/review-moderation.routes');
const monitoringRoutes = require('./routes/monitoring.routes');

// Configuration Swagger
const { setupSwagger } = require('./docs/api-documentation');
setupSwagger(app);

// Appliquer les routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/environmental', environmentalRoutes);
app.use('/api/routes', routesRoutes);
app.use('/api/cols', colsRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/training/ai', trainingAiRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/integrated-programs', integratedProgramsRoutes);
app.use('/api/performance-analysis', performanceAnalysisRoutes);
app.use('/api/mapping', advancedMappingRoutes);
app.use('/api/correlations', performanceCorrelationRoutes);
app.use('/api/admin', adminApiRoutes);
app.use('/api/cols-conditions', colsConditionsRoutes);
app.use('/api/cache', cacheRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/route-weather', routeWeatherRoutes);
app.use('/api/physiological-metrics', physiologicalMetricsRoutes);
app.use('/api/weather-preferences', weatherPreferencesRoutes);
app.use('/api/reviews', routeReviewRoutes);
app.use('/api/recommendations', routeRecommendationRoutes);
app.use('/api/moderation', reviewModerationRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/', europeanColsRoutes);

// Servir les fichiers statiques du client React en production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Middleware de gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Journaliser l'erreur
  fs.appendFileSync(
    path.join(logsDir, 'errors.log'),
    `[${new Date().toISOString()}] ${err.stack}\n`
  );
  
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Une erreur est survenue' 
      : err.message
  });
});

// Gérer les routes inexistantes
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Connexion à la base de données et démarrage du serveur
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cycling-dashboard', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connecté à la base de données MongoDB');
    
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Serveur démarré sur le port ${PORT}`);
      console.log(`Environnement: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Erreur de connexion à la base de données:', error);
    process.exit(1);
  }
};

// Démarrer le serveur si non en mode test
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

// Exporter l'app pour les tests
module.exports = app;
