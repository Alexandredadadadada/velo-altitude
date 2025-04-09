/**
 * Configuration centralisée des variables d'environnement
 * Ce fichier sert de point unique de vérité pour toutes les variables d'environnement
 * utilisées dans l'application Velo-Altitude.
 */

export const ENV = {
  // Auth0
  auth0: {
    domain: process.env.AUTH0_ISSUER_BASE_URL?.replace(/^https?:\/\//, ''),
    clientId: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    audience: process.env.AUTH0_AUDIENCE,
    scope: process.env.AUTH0_SCOPE || 'openid profile email',
    secret: process.env.AUTH0_SECRET,
    baseUrl: process.env.AUTH0_BASE_URL,
  },
  
  // Weather
  weather: {
    openWeatherKey: process.env.OPENWEATHER_API_KEY,
    meteoFranceKey: process.env.METEO_FRANCE_API_KEY,
    weatherApiKey: process.env.WEATHER_API_KEY,
    climacellKey: process.env.CLIMACELL_API_KEY,
  },
  
  // Strava
  strava: {
    clientId: process.env.STRAVA_CLIENT_ID,
    clientSecret: process.env.STRAVA_CLIENT_SECRET,
    refreshToken: process.env.STRAVA_REFRESH_TOKEN,
    accessToken: process.env.STRAVA_ACCESS_TOKEN,
    redirectUri: process.env.STRAVA_REDIRECT_URI,
  },
  
  // MongoDB
  mongodb: {
    uri: process.env.MONGODB_URI,
    dbName: process.env.MONGODB_DB_NAME,
    maxPoolSize: process.env.MONGODB_MAX_POOL_SIZE || '10',
    minPoolSize: process.env.MONGODB_MIN_POOL_SIZE || '1',
    region: process.env.MONGODB_REGION,
    clusterName: process.env.MONGODB_CLUSTER_NAME,
    projectTagKey: process.env.MONGODB_PROJECT_TAG_KEY,
    projectTagValue: process.env.MONGODB_PROJECT_TAG_VALUE,
  },
  
  // Redis
  redis: {
    url: process.env.REDIS_URL,
    password: process.env.REDIS_PASSWORD,
  },
  
  // API Keys
  apiKeys: {
    encryption: process.env.API_KEYS_ENCRYPTION_KEY,
    openai: process.env.OPENAI_API_KEY,
    claude: process.env.CLAUDE_API_KEY,
    openroute: process.env.OPENROUTE_API_KEY,
    mapbox: process.env.MAPBOX_TOKEN,
    windy: process.env.WINDY_PLUGINS_API,
  },
  
  // Application
  app: {
    nodeEnv: process.env.NODE_ENV,
    apiUrl: process.env.REACT_APP_API_URL,
    baseUrl: process.env.REACT_APP_BASE_URL,
    brandName: process.env.REACT_APP_BRAND_NAME,
    version: process.env.REACT_APP_VERSION,
    enableAnalytics: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
    siteUrl: process.env.REACT_APP_SITE_URL || 'https://velo-altitude.com',
    useMockData: process.env.REACT_APP_USE_MOCK_DATA === 'true',
  },
  
  // Analytics et Tracking
  analytics: {
    googleAnalyticsId: process.env.REACT_APP_GA_ID || 'UA-XXXXXXXXX-X',
    googleSearchConsole: process.env.REACT_APP_GSC_ID || '',
    matomoUrl: process.env.REACT_APP_MATOMO_URL || '',
    matomoSiteId: process.env.REACT_APP_MATOMO_SITE_ID || '',
    dataLayerName: 'dataLayer'
  },
  
  // Maps & Navigation
  maps: {
    mapboxToken: process.env.MAPBOX_TOKEN || process.env.REACT_APP_MAPBOX_TOKEN,
    openRouteKey: process.env.OPENROUTE_API_KEY,
  },
  
  // Monitoring
  monitoring: {
    apiUrl: process.env.REACT_APP_MONITORING_API_URL || '/api/monitoring',
    enableMonitoring: process.env.REACT_APP_ENABLE_MONITORING === 'true',
  },
  
  // Service d'élévation
  elevation: {
    openRoute: {
      apiKey: process.env.OPENROUTE_API_KEY,
      baseUrl: 'https://api.openrouteservice.org/v2/elevation',
      maxRequestsPerMinute: 40
    },
    mapbox: {
      token: process.env.MAPBOX_TOKEN || process.env.REACT_APP_MAPBOX_TOKEN,
      baseUrl: 'https://api.mapbox.com/v4/mapbox.terrain-rgb'
    }
  },
  
  // Service Météo
  weather: {
    // OpenWeather
    openWeather: {
      apiKey: process.env.OPENWEATHER_API_KEY || process.env.REACT_APP_OPENWEATHER_API_KEY,
      baseUrl: 'https://api.openweathermap.org/data/2.5',
      units: 'metric',
      lang: 'fr',
      maxRequestsPerMinute: 60
    },
    
    // Services API supplémentaires
    weatherApi: {
      apiKey: process.env.WEATHER_API_KEY,
      baseUrl: 'https://api.weatherapi.com/v1'
    },
    meteoFrance: {
      apiKey: process.env.METEO_FRANCE_API_KEY,
      baseUrl: 'https://api.meteo-france.fr'
    },
    climacell: {
      apiKey: process.env.CLIMACELL_API_KEY,
      baseUrl: 'https://api.climacell.co/v3'
    },
    windy: {
      apiKey: process.env.WINDY_API_KEY,
      baseUrl: 'https://api.windy.com'
    },
    
    // Cache Configuration
    cache: {
      ttl: 30 * 60, // 30 minutes en secondes
      prefix: 'weather_cache:',
      enableCompression: true
    },
    
    // Paramètres de mise à jour
    update: {
      frequency: 15 * 60 * 1000, // 15 minutes en millisecondes
      retryAttempts: 3,
      retryDelay: 1000 // 1 seconde entre les tentatives
    },

    // Seuils d'alerte
    alerts: {
      wind: {
        warning: 30, // km/h
        danger: 40   // km/h
      },
      rain: {
        warning: 5,  // mm/h
        danger: 10   // mm/h
      },
      temperature: {
        min: -10,    // °C
        max: 40      // °C
      }
    },

    // Endpoints spécifiques
    endpoints: {
      current: '/weather',
      forecast: '/forecast',
      onecall: '/onecall'
    },

    // Rate Limiting
    rateLimiting: {
      enabled: true,
      capacity: 60,
      refillRate: 1,
      refillInterval: 1000,
      fallbackMode: 'strict'
    },

    // Monitoring
    monitoring: {
      enabled: true,
      errorThreshold: 5, // Nombre d'erreurs avant alerte
      responseTimeThreshold: 2000 // ms
    }
  },
  
  // AI Services
  ai: {
    model: process.env.REACT_APP_AI_MODEL || 'gpt-4',
    openaiKey: process.env.OPENAI_API_KEY,
    claudeKey: process.env.CLAUDE_API_KEY,
  },
  
  // Server
  server: {
    sessionSecret: process.env.SESSION_SECRET,
    assetCacheMaxAge: process.env.ASSET_CACHE_MAX_AGE,
    enableBrotli: process.env.ENABLE_BROTLI_COMPRESSION === 'true',
    goImportDuringBuild: process.env.GO_IMPORT_DURING_BUILD === 'true',
  },
};

/**
 * Vérifie la présence des variables d'environnement critiques
 * et enregistre un avertissement si certaines sont manquantes
 * @returns {boolean} True si toutes les variables critiques sont présentes, false sinon
 */
export const validateEnvironment = () => {
  // Variables d'environnement critiques pour le fonctionnement de l'application
  const criticalVars = [
    // Auth0
    { key: 'AUTH0_ISSUER_BASE_URL', value: process.env.AUTH0_ISSUER_BASE_URL, component: 'Auth0' },
    { key: 'AUTH0_CLIENT_ID', value: process.env.AUTH0_CLIENT_ID, component: 'Auth0' },
    { key: 'AUTH0_AUDIENCE', value: process.env.AUTH0_AUDIENCE, component: 'Auth0' },
    
    // MongoDB
    { key: 'MONGODB_URI', value: process.env.MONGODB_URI, component: 'Database' },
    
    // Sécurité
    { key: 'SESSION_SECRET', value: process.env.SESSION_SECRET, component: 'Security' },
    
    // API Clés
    { key: 'OPENWEATHER_API_KEY', value: process.env.OPENWEATHER_API_KEY || process.env.REACT_APP_OPENWEATHER_API_KEY, component: 'Weather' },
    { key: 'OPENROUTE_API_KEY', value: process.env.OPENROUTE_API_KEY, component: 'Elevation' },
    { key: 'MAPBOX_TOKEN', value: process.env.MAPBOX_TOKEN, component: 'Maps' },
  ];
  
  // Filtrer les variables manquantes
  const missingVars = criticalVars.filter(v => !v.value);
  
  // Grouper par composant pour un meilleur diagnostic
  if (missingVars.length > 0) {
    const missingByComponent = missingVars.reduce((acc, v) => {
      if (!acc[v.component]) {
        acc[v.component] = [];
      }
      acc[v.component].push(v.key);
      return acc;
    }, {});
    
    console.warn('⚠️ Variables d\'environnement critiques manquantes dans Netlify:');
    Object.keys(missingByComponent).forEach(component => {
      console.warn(`  ${component}: ${missingByComponent[component].join(', ')}`);
    });
    
    console.warn('ℹ️ Toutes les variables d\'environnement doivent être configurées dans Netlify.');
    return false;
  }
  
  return true;
};

export default ENV;
