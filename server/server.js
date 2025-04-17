/**
 * Serveur principal de l'application Grand Est Cyclisme
 * Ce fichier configure et démarre le serveur Express
 */

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  console.trace(err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
  console.trace(reason);
});
console.log('Crash diagnostics enabled');

// Chargement des variables d'environnement
require('dotenv').config();

// Importations des dépendances
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const path = require('path');
const rateLimit = require('express-rate-limit');
console.log('Checkpoint 1: before logger');
const logger = require('./config/logger');
console.log('Checkpoint 2: after logger');
const errorService = require('./services/error.service');
console.log('Checkpoint 3: after errorService');
const tokenBlacklist = require('./services/token-blacklist.service');
console.log('Checkpoint 4: after tokenBlacklist');
const cacheService = require('./services/cache.service');
console.log('Checkpoint 5: after cacheService');
const paginationService = require('./services/pagination.service');
console.log('Checkpoint 6: after paginationService');
const apiMiddleware = require('./middlewares/api.middleware');
console.log('Checkpoint 7: after apiMiddleware');
const config = require('./config/api.config');
console.log('Checkpoint 8: after config');
const initServices = require('./services/initServices');
console.log('Checkpoint 9: after initServices');
const serverDiagnostics = require('./utils/server-diagnostics'); // Système de diagnostic
console.log('Checkpoint 10: after serverDiagnostics');
const apiQuotaManager = require('./utils/apiQuotaManager'); // Gestionnaire de quotas API
console.log('Checkpoint 11: after apiQuotaManager');
const performanceOptimization = require('./middleware/performance-optimization');
console.log('Checkpoint 12: after performanceOptimization');
const monitoring = require('./utils/monitoring');
console.log('Checkpoint 13: after monitoring');
const swaggerUi = require('swagger-ui-express');
console.log('Checkpoint 14: after swaggerUi');
const YAML = require('yamljs');
console.log('Checkpoint 15: after YAML');
const { environment } = require('./config/environment');
console.log('Checkpoint 16: after environment');

console.log('Starting server initialization...');

// Initialisation de l'application Express
const app = express();
const PORT = environment.server.port || 3001;

console.log('Setting up base middleware...');
// Configuration de base
app.use(helmet());
app.use(cors({
  origin: environment.server.env === 'production' 
    ? 'https://velo-altitude.com' 
    : 'http://localhost:3000',
  credentials: true
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(environment.server.sessionSecret));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limite chaque IP à 100 requêtes par fenêtre
});
app.use('/api/', limiter);

console.log('Setting up CORS configuration...');
// Configuration CORS avancée
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = config.cors?.origins || ['http://localhost:3000'];
    const wildcardAllowed = config.cors?.allowAllOrigins || false;
    
    // Autoriser les requêtes sans origine (ex: applications mobiles, Postman)
    if (!origin) return callback(null, true);
    
    // Autoriser toutes les origines si configuré ainsi
    if (wildcardAllowed) return callback(null, true);
    
    // Vérifier si l'origine est dans la liste des origines autorisées
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      return callback(null, true);
    } else {
      logger.warn(`Tentative d'accès CORS bloquée depuis: ${origin}`);
      return callback(new Error('Non autorisé par la politique CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['X-New-Access-Token']
}));

console.log('Setting up request logging middleware...');
// Middleware de journalisation des requêtes
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

console.log('Setting up response time middleware...');
// Middleware de gestion du temps de réponse
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.debug(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
    
    // Enregistrer les métriques de performance
    if (duration > 1000) {
      logger.warn(`Performance: Requête lente détectée - ${req.method} ${req.url} - ${duration}ms`);
    }
  });
  next();
});

console.log('Setting up server status middleware...');
// Middleware pour ajouter des informations sur l'état du serveur
app.use((req, res, next) => {
  // Si le serveur est en mode dégradé, ajouter un en-tête
  if (global.serverState && global.serverState.degradedMode) {
    res.set('X-Server-Status', 'degraded');
  }
  next();
});

console.log('Applying performance optimization middleware...');
// Appliquer les middlewares d'optimisation des performances
performanceOptimization.applyAll(app);

console.log('Setting up Swagger configuration...');
// Configuration Swagger
const swaggerCore = YAML.load(path.join(__dirname, 'docs/swagger-core.yaml'));
const swaggerCols3D = YAML.load(path.join(__dirname, 'docs/swagger-cols-3d.yaml'));
const swaggerRoutes = YAML.load(path.join(__dirname, 'docs/swagger-routes.yaml'));
const swaggerTraining = YAML.load(path.join(__dirname, 'docs/swagger-training.yaml'));

// Fusionner les documents
const swaggerDocument = {
  ...swaggerCore,
  paths: {
    ...swaggerCore.paths,
    ...swaggerCols3D.paths,
    ...swaggerRoutes.paths,
    ...swaggerTraining.paths
  }
};

// Configurer Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Dashboard-Velo API Documentation",
  customfavIcon: "/favicon.ico"
}));

console.log('Setting up health check route...');
// Routes de santé et de diagnostic du serveur
app.get('/api/health', async (req, res) => {
  const healthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: environment.server.env || 'development',
    degradedMode: global.serverState?.degradedMode || false
  };
  
  try {
    // Si le service d'initialisation est disponible, obtenir la santé des services
    if (initServices && typeof initServices.checkServicesHealth === 'function') {
      const servicesHealth = await initServices.checkServicesHealth();
      healthStatus.services = servicesHealth;
      
      // Déterminer l'état global en fonction de la santé des services
      if (servicesHealth.some(s => s.status === 'error')) {
        healthStatus.status = 'error';
      } else if (servicesHealth.some(s => s.status === 'degraded')) {
        healthStatus.status = 'degraded';
      }
    }
    
    // Ajouter les métriques de cache si disponibles
    if (cacheService && typeof cacheService.getMetrics === 'function') {
      healthStatus.cache = cacheService.getMetrics();
    }
    
    // Ajouter les métriques de base de données
    healthStatus.database = {
      status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      connections: mongoose.connections.length
    };
    
    // Ajouter les résultats de diagnostic si disponibles
    if (global.diagnosticResults) {
      healthStatus.diagnostics = {
        lastRun: global.diagnosticResults.timestamp,
        status: global.diagnosticResults.overallStatus
      };
    }
    
    // Envoyer la réponse avec le code d'état approprié
    const statusCode = healthStatus.status === 'ok' ? 200 : 
                       healthStatus.status === 'degraded' ? 200 : 500;
    
    res.status(statusCode).json(healthStatus);
  } catch (error) {
    logger.error(`Erreur lors de la vérification de l'état de santé: ${error.message}`);
    
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

console.log('Initializing routes...');
// Initialiser les routes de l'API
function initializeRoutes() {
  // Importer les routes
  const authRoutes = require('./routes/auth.routes');
  const userRoutes = require('./routes/user.routes');
  const eventRoutes = require('./routes/event.routes');
  const routeRoutes = require('./routes/route.routes');
  const clubRoutes = require('./routes/club.routes');
  const communityRoutes = require('./routes/community.routes');
  
  // Appliquer les middlewares communs aux routes d'API
  const apiRouter = express.Router();
  
  // Middleware de limitation de débit global pour l'API
  apiRouter.use(apiMiddleware.rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // 200 requêtes par fenêtre
    message: 'Trop de requêtes, veuillez réessayer plus tard'
  }));
  
  // Middleware de mise en cache pour les routes GET
  apiRouter.use((req, res, next) => {
    // Ne pas mettre en cache les routes d'authentification
    if (req.path.startsWith('/auth')) {
      return next();
    }
    
    // Appliquer le middleware de cache avec TTL personnalisé selon la route
    let ttl = 300; // 5 minutes par défaut
    
    if (req.path.startsWith('/routes') || req.path.startsWith('/events')) {
      ttl = 600; // 10 minutes pour les itinéraires et événements
    } else if (req.path.startsWith('/clubs')) {
      ttl = 1800; // 30 minutes pour les clubs
    }
    
    apiMiddleware.cache(ttl)(req, res, next);
  });
  
  // Configurer les routes avec leurs middlewares spécifiques
  apiRouter.use('/auth', authRoutes);
  apiRouter.use('/users', apiMiddleware.paginate(), userRoutes);
  apiRouter.use('/events', apiMiddleware.paginate(), eventRoutes);
  apiRouter.use('/routes', apiMiddleware.paginate(), routeRoutes);
  apiRouter.use('/clubs', apiMiddleware.paginate(), clubRoutes);
  apiRouter.use('/community', communityRoutes);

  // Nouvelle route pour le tableau de bord des API
  apiRouter.use('/dashboard', require('./routes/api-dashboard'));
  
  // Appliquer le router d'API
  app.use('/api', apiRouter);
  
  // Servir les fichiers statiques du client en production
  if (environment.server.env === 'production') {
    app.use(express.static(path.join(__dirname, '../client/build')));
    
    // Pour toutes les autres requêtes, servir l'application React
    app.get('*', (req, res) => {
      if (!req.url.startsWith('/api/')) {
        res.sendFile(path.join(__dirname, '../client/build/index.html'));
      }
    });
  }
}

console.log('Setting up error handling middleware...');
// Middleware pour intercepter les routes non trouvées
app.use((req, res, next) => {
  // Vérifier si la route commence par /api pour savoir si c'est une API
  if (req.path.startsWith('/api/')) {
    const error = errorService.createError(
      errorService.ERROR_TYPES.NOT_FOUND,
      `Route non trouvée: ${req.method} ${req.path}`,
      { path: req.path, method: req.method }
    );
    
    return errorService.sendErrorResponse(res, error.type, error.message, error.details);
  }
  
  // Pour les routes non-API en production, servir l'application React
  if (environment.server.env === 'production') {
    if (!req.url.startsWith('/api/')) {
      res.sendFile(path.join(__dirname, '../client/build/index.html'));
    }
  } else {
    // En développement, renvoyer une erreur 404
    res.status(404).json({
      status: 'error',
      message: `Route non trouvée: ${req.method} ${req.path}`
    });
  }
});

console.log('Setting up global error handler...');
// Middleware de gestion globale des erreurs (doit être défini après les routes)
app.use(apiMiddleware.errorHandler());

console.log('Setting up error handling...');
// Gestion des erreurs
app.use((err, req, res, next) => {
  logger.error('Error:', err);
  console.trace(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

console.log('Starting server...');
// Fonction de démarrage du serveur
const startServer = async () => {
  try {
    console.log('Connecting to MongoDB...');
    if (environment.mongodb.uri) {
      await mongoose.connect(environment.mongodb.uri, {
        dbName: environment.mongodb.dbName,
        maxPoolSize: environment.mongodb.poolSize.max,
        minPoolSize: environment.mongodb.poolSize.min,
        retryWrites: true,
        w: 'majority'
      });
      console.log('✅ Connected to MongoDB');
    }

    // Démarrage du serveur
    app.listen(PORT, () => {
      console.log(`🚀 Server started on port ${PORT} in ${environment.server.env} mode`);
    });
  } catch (error) {
    console.error('❌ Server start error:', error);
    console.trace(error);
    process.exit(1);
  }
};

console.log('Setting up graceful shutdown...');
// Gestion de l'arrêt gracieux
const gracefulShutdown = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    console.trace(error);
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Démarrer le serveur si ce fichier est exécuté directement
if (require.main === module) {
  initializeRoutes();
  startServer();
}

module.exports = app;
