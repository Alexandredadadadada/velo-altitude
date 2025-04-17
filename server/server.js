/**
 * Serveur principal de l'application Grand Est Cyclisme
 * Ce fichier configure et démarre le serveur Express
 */

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
const logger = require('./config/logger');
const errorService = require('./services/error.service').getInstance();
const tokenBlacklist = require('./services/token-blacklist.service').getInstance();
const cacheService = require('./services/cache.service').getInstance();
const paginationService = require('./services/pagination.service').getInstance();
const apiMiddleware = require('./middlewares/api.middleware');
const config = require('./config/api.config');
const initServices = require('./services/initServices');
const serverDiagnostics = require('./utils/server-diagnostics'); // Système de diagnostic
const apiQuotaManager = require('./utils/apiQuotaManager'); // Gestionnaire de quotas API
const performanceOptimization = require('./middleware/performance-optimization');
const monitoring = require('./utils/monitoring');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

// Initialisation de l'application Express
const app = express();
const PORT = process.env.PORT || 3000;

// Options de démarrage du serveur
const serverOptions = {
  progressiveStartup: true,     // Démarrage progressif des services
  degradedModeEnabled: true,    // Mode dégradé autorisé
  autoDiagnostic: true,         // Diagnostic automatique
  maxStartupRetries: 3,         // Nombre maximum de tentatives de démarrage
  criticalServices: ['error.service', 'token-blacklist.service', 'cache.service'] // Services critiques
};

// Configuration des middlewares de base
app.use(helmet()); // Sécurité
app.use(compression()); // Compression des réponses

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

// Limitation de débit pour prévenir les attaques par force brute
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes par IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    error: {
      type: 'rate_limit_exceeded',
      message: 'Trop de requêtes, veuillez réessayer plus tard',
      severity: 'warning'
    }
  },
  skip: (req) => {
    // Ne pas limiter les requêtes en développement
    return process.env.NODE_ENV === 'development';
  }
});

// Appliquer la limitation de débit aux routes d'API sensibles
app.use('/api/auth', apiLimiter);
app.use('/api/users', apiLimiter);

// Middlewares de parsing
app.use(express.json({ limit: '50mb' })); // Analyse du JSON avec limite de taille
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Analyse des URL encodées
app.use(cookieParser()); // Analyse des cookies

// Middleware de journalisation des requêtes
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

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

// Middleware pour ajouter des informations sur l'état du serveur
app.use((req, res, next) => {
  // Si le serveur est en mode dégradé, ajouter un en-tête
  if (global.serverState && global.serverState.degradedMode) {
    res.set('X-Server-Status', 'degraded');
  }
  next();
});

// Appliquer les middlewares d'optimisation des performances
performanceOptimization.applyAll(app);

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

// Routes de santé et de diagnostic du serveur
app.get('/api/health', async (req, res) => {
  const healthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
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

// Initialiser les routes de l'API
function initializeRoutes() {
  // Importer les routes
  const authRoutes = require('./routes/auth.routes');
  const userRoutes = require('./routes/user.routes');
  const eventRoutes = require('./routes/event.routes');
  const routeRoutes = require('./routes/route.routes');
  const clubRoutes = require('./routes/club.routes');
  
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
  
  // Nouvelle route pour le tableau de bord des API
  apiRouter.use('/dashboard', require('./routes/api-dashboard'));
  
  // Appliquer le router d'API
  app.use('/api', apiRouter);
  
  // Servir les fichiers statiques du client en production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/build')));
    
    // Pour toutes les autres requêtes, servir l'application React
    app.get('*', (req, res) => {
      if (!req.url.startsWith('/api/')) {
        res.sendFile(path.join(__dirname, '../client/build/index.html'));
      }
    });
  }
}

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
  if (process.env.NODE_ENV === 'production') {
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

// Middleware de gestion globale des erreurs (doit être défini après les routes)
app.use(apiMiddleware.errorHandler());

// Fonction de vérification des dépendances critiques
async function checkDependencies() {
  logger.info('🔍 Vérification des dépendances critiques...');
  
  try {
    // Vérifier les variables d'environnement requises
    const requiredEnvVars = [
      'MONGODB_URI',
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'JWT_EXPIRATION'
    ];
    
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingEnvVars.length > 0) {
      if (serverOptions.degradedModeEnabled) {
        logger.warn(`⚠️ Variables d'environnement manquantes: ${missingEnvVars.join(', ')}. Mode dégradé activé.`);
        global.serverState = {
          degradedMode: true,
          missingDependencies: missingEnvVars
        };
        return true;
      } else {
        throw new Error(`Variables d'environnement requises manquantes: ${missingEnvVars.join(', ')}`);
      }
    }
    
    // Vérifier la connexion à MongoDB
    if (mongoose.connection.readyState !== 1) {
      logger.warn('⚠️ MongoDB non connecté, tentative de connexion...');
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      logger.info('✅ Connexion MongoDB établie');
    }
    
    // Vérifier les services critiques
    const criticalServices = serverOptions.criticalServices || [];
    for (const service of criticalServices) {
      if (!global.services || !global.services[service]) {
        throw new Error(`Service critique non disponible: ${service}`);
      }
    }
    
    // Vérifier le gestionnaire de quotas API
    if (!apiQuotaManager) {
      logger.warn('⚠️ Gestionnaire de quotas API non disponible');
      global.serverState = global.serverState || {};
      global.serverState.degradedMode = true;
    } else {
      logger.info('✅ Gestionnaire de quotas API disponible');
    }
    
    logger.info('✅ Toutes les dépendances critiques sont disponibles');
    return true;
  } catch (error) {
    logger.error(`❌ Erreur lors de la vérification des dépendances: ${error.message}`);
    
    // Activer le mode dégradé si autorisé
    if (serverOptions.degradedModeEnabled) {
      global.serverState = global.serverState || {};
      global.serverState.degradedMode = true;
      logger.warn('⚠️ Serveur démarré en mode dégradé');
      return true;
    }
    
    return false;
  }
}

// Initialiser les services
async function initializeServices() {
  logger.info('🚀 Initialisation des services...');
  
  try {
    // Initialiser les services de base
    global.services = global.services || {};
    
    // Initialiser le service d'erreur s'il n'est pas déjà initialisé
    if (!global.services['error.service']) {
      global.services['error.service'] = errorService;
    }
    
    // Initialiser le service de liste noire de tokens
    if (!global.services['token-blacklist.service']) {
      global.services['token-blacklist.service'] = tokenBlacklist;
      tokenBlacklist.startCacheCleanup();
    }
    
    // Initialiser le service de cache
    if (!global.services['cache.service']) {
      global.services['cache.service'] = cacheService;
    }
    
    // Initialiser le service de pagination
    if (!global.services['pagination.service']) {
      global.services['pagination.service'] = paginationService;
    }
    
    // Initialiser le gestionnaire de quotas API s'il n'est pas déjà initialisé
    if (!global.services['api-quota.service']) {
      global.services['api-quota.service'] = apiQuotaManager;
      logger.info('✅ Service de gestion des quotas API initialisé');
    }
    
    // Utiliser le service d'initialisation progressive si disponible
    if (initServices && typeof initServices.initializeAll === 'function') {
      await initServices.initializeAll();
    }
    
    logger.info('✅ Services initialisés avec succès');
    return true;
  } catch (error) {
    logger.error(`❌ Erreur lors de l'initialisation des services: ${error.message}`);
    return false;
  }
}

// Démarrage du serveur
function startServer() {
  // Initialiser l'état global du serveur
  global.serverState = {
    startTime: new Date(),
    degradedMode: false,
    version: process.env.npm_package_version || '1.0.0'
  };
  
  logger.info('Démarrage du serveur Grand Est Cyclisme...');
  
  // Vérifier les dépendances avant de démarrer
  checkDependencies().then(dependenciesOk => {
    if (!dependenciesOk && !global.serverState.degradedMode) {
      logger.error('❌ Vérification des dépendances échouée, arrêt du serveur');
      process.exit(1);
    }
    
    // Connecter à MongoDB
    mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    // Configurer et démarrer le serveur HTTP
    console.log('PORT value:', PORT);
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      
      if (global.serverState.degradedMode) {
        logger.warn(`⚠️ Le serveur fonctionne en mode dégradé: ${global.serverState.degradedReason}`);
      }
      
      // Initialiser les services après le démarrage du serveur
      initializeServices().then(servicesInitialized => {
        if (servicesInitialized) {
          logger.info('✅ Services principaux initialisés avec succès');
        } else if (!global.serverState.degradedMode) {
          logger.warn('⚠️ Certains services n\'ont pas pu être initialisés correctement');
        }
        
        // Vérifier l'état du système
        const systemStatus = {
          server: 'online',
          degradedMode: global.serverState.degradedMode,
          database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
          environment: process.env.NODE_ENV || 'development',
          startTime: new Date().toISOString()
        };
        
        logger.info('📊 État du système:', systemStatus);
        
        // Vérifier les secrets JWT
        if (process.env.JWT_SECRET === undefined) {
          errorService.logError({
            type: 'security_config',
            message: 'JWT_SECRET non défini dans les variables d\'environnement',
            severity: 'critical',
            details: {
              recommendation: 'Définir une clé secrète forte dans les variables d\'environnement'
            }
          });
        }
        
        // Configurer le monitoring
        monitoring.setupMonitoring(app);
      }).catch(error => {
        logger.error(`❌ Erreur lors de l'initialisation des services: ${error.message}`, {
          stack: error.stack
        });
      });
    });
    
    // Configurer un délai d'attente pour les connexions inactives
    server.keepAliveTimeout = 65000; // 65 secondes
    server.headersTimeout = 66000; // 66 secondes (doit être supérieur à keepAliveTimeout)
    
    return server;
  }).catch(error => {
    logger.error(`❌ Erreur fatale: ${error.message}`);
    process.exit(1);
  });
}

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  // Afficher plus de détails sur l'erreur
  console.error('ERREUR NON CAPTURÉE DÉTAILLÉE:', error);
  console.error('Message:', error.message);
  console.error('Stack:', error.stack);
  
  const criticalError = errorService.createError({
    type: 'uncaught_exception',
    message: `Exception non capturée: ${error.message}`,
    severity: 'critical',
    details: {
      stack: error.stack
    }
  });
  
  logger.error(`❌ ${criticalError.message}`, {
    stack: error.stack
  });
  
  // En production, on peut choisir de redémarrer le serveur
  if (process.env.NODE_ENV === 'production') {
    logger.error('🔄 Redémarrage du serveur suite à une erreur critique...');
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  // Afficher plus de détails sur l'erreur
  console.error('PROMESSE REJETÉE DÉTAILLÉE:', reason);
  console.error('Stack:', reason.stack);
  
  const criticalError = errorService.createError({
    type: 'unhandled_rejection',
    message: `Promesse rejetée non gérée: ${reason}`,
    severity: 'critical',
    details: {
      stack: reason.stack
    }
  });
  
  logger.error(`❌ ${criticalError.message}`, {
    stack: reason.stack
  });
});

/**
 * Gestion de l'arrêt propre du serveur
 */
const gracefulShutdown = async () => {
  logger.info('🛑 Arrêt du serveur en cours...');
  
  try {
    // Arrêter le service de liste noire de tokens
    if (tokenBlacklist && typeof tokenBlacklist.stopCacheCleanup === 'function') {
      tokenBlacklist.stopCacheCleanup();
      logger.info('✅ Service de liste noire de tokens arrêté');
    }
    
    // Fermer la connexion à MongoDB
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      logger.info('✅ Connexion MongoDB fermée');
    }
    
    logger.info('✅ Arrêt propre du serveur terminé');
    process.exit(0);
  } catch (error) {
    logger.error(`❌ Erreur lors de l'arrêt du serveur: ${error.message}`);
    process.exit(1);
  }
  
  // Si tout échoue, forcer l'arrêt après 5 secondes
  setTimeout(() => {
    logger.error("⏱️ Délai d'attente dépassé pour l'arrêt propre, arrêt forcé");
    process.exit(1);
  }, 5000);
};

// Intercepter les signaux d'arrêt
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Démarrer le serveur
if (require.main === module) {
  startServer();
}

module.exports = app;
