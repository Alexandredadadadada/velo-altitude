/**
 * Configuration pour l'environnement de production
 * Utilisé lors du déploiement sur Hostinger
 */

module.exports = {
  // Configuration du serveur
  server: {
    port: process.env.PORT || 3000,
    apiBaseUrl: process.env.API_BASE_URL || 'https://api.grand-est-cyclisme.com',
    clientBaseUrl: process.env.CLIENT_BASE_URL || 'https://grand-est-cyclisme.com',
  },
  
  // Configuration de la base de données
  database: {
    uri: process.env.MONGODB_URI,
    name: process.env.MONGODB_DB_NAME || 'grand_est_cyclisme',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 60000,
      serverSelectionTimeoutMS: 30000,
      maxPoolSize: 50,
      minPoolSize: 10,
    }
  },
  
  // Configuration Redis pour le cache
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB) || 0,
    keyPrefix: 'gec:',
    maxRetriesPerRequest: 3,
    connectTimeout: 10000,
    reconnectOnError: true
  },
  
  // Configuration du cache
  cache: {
    ttl: parseInt(process.env.CACHE_TTL) || 600, // 10 minutes par défaut
    checkPeriod: parseInt(process.env.CACHE_CHECK_PERIOD) || 120, // 2 minutes par défaut
    enabled: true,
    excludedRoutes: [
      '/api/auth',
      '/api/user/profile'
    ]
  },
  
  // Configuration de sécurité
  security: {
    cors: {
      origin: process.env.CORS_ORIGIN || 'https://grand-est-cyclisme.com',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      credentials: true
    },
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes par défaut
      max: parseInt(process.env.RATE_LIMIT_MAX) || 100 // 100 requêtes par fenêtre
    },
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: parseInt(process.env.JWT_EXPIRATION) || 86400 // 24 heures par défaut
    },
    sessionSecret: process.env.SESSION_SECRET
  },
  
  // Configuration des logs
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || '/var/log/grand-est-cyclisme',
    maxSize: '10m',
    maxFiles: 10,
    format: 'combined'
  },
  
  // Configuration des API externes
  externalApis: {
    mapbox: {
      publicToken: process.env.MAPBOX_PUBLIC_TOKEN,
      secretToken: process.env.MAPBOX_SECRET_TOKEN
    },
    openWeather: {
      apiKey: process.env.OPENWEATHER_API_KEY
    },
    openRoute: {
      apiKey: process.env.OPENROUTE_API_KEY
    },
    strava: {
      clientId: process.env.STRAVA_CLIENT_ID,
      clientSecret: process.env.STRAVA_CLIENT_SECRET,
      redirectUri: process.env.STRAVA_REDIRECT_URI
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY
    },
    claude: {
      apiKey: process.env.CLAUDE_API_KEY
    }
  },
  
  // Configuration des uploads de fichiers
  uploads: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB par défaut
    directory: process.env.UPLOAD_DIR || '/tmp/grand-est-cyclisme-uploads'
  },
  
  // Configuration des emails
  email: {
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: parseInt(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    },
    from: process.env.EMAIL_FROM || 'contact@grand-est-cyclisme.com',
    templates: {
      directory: 'templates/emails'
    }
  },
  
  // Configuration des assets statiques
  static: {
    maxAge: 86400000, // 1 jour en millisecondes
    etag: true,
    lastModified: true,
    compression: true
  },
  
  // Configuration de la visualisation des itinéraires
  routeVisualization: {
    cacheTime: 1800, // 30 minutes
    colorsCacheDuration: 86400, // 24 heures
    maxRoutePoints: 10000,
    maxSegments: 100
  }
};
