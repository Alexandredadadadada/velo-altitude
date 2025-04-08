/**
 * Configuration de l'environnement
 * 
 * Ce fichier centralise toutes les variables d'environnement utilisées dans l'application
 * et définit les valeurs par défaut pour le développement et la production.
 */

// Récupérer l'environnement actuel
const ENV = process.env.NODE_ENV || 'development';

// Configuration par défaut
const defaultConfig = {
  // API
  apiUrl: 'http://localhost:5000/api',
  apiTimeout: 30000, // 30 secondes
  
  // Authentification
  auth0Domain: process.env.REACT_APP_AUTH0_DOMAIN,
  auth0ClientId: process.env.REACT_APP_AUTH0_CLIENT_ID,
  auth0Audience: process.env.REACT_APP_AUTH0_AUDIENCE,
  
  // Intégrations externes
  stravaClientId: process.env.REACT_APP_STRAVA_CLIENT_ID,
  stravaRedirectUri: process.env.REACT_APP_STRAVA_REDIRECT_URI,
  
  mapboxToken: process.env.REACT_APP_MAPBOX_TOKEN,
  openWeatherApiKey: process.env.REACT_APP_OPENWEATHER_API_KEY,
  
  // Fonctionnalités
  enableMockData: ENV === 'development',
  enablePerformanceMonitoring: ENV === 'production',
  
  // Cache
  defaultCacheTime: 30 * 60 * 1000, // 30 minutes
};

// Configuration par environnement
const envConfig = {
  development: {
    apiUrl: process.env.REACT_APP_DEV_API_URL || defaultConfig.apiUrl,
    enableDebugMode: true,
    logLevel: 'debug',
  },
  test: {
    apiUrl: process.env.REACT_APP_TEST_API_URL || 'http://localhost:5000/api',
    enableMockData: true,
    logLevel: 'error',
  },
  production: {
    apiUrl: process.env.REACT_APP_API_URL || '/api',
    enableDebugMode: false,
    logLevel: 'error',
    enableMockData: false,
  },
};

// Fusionner la configuration par défaut avec la configuration spécifique à l'environnement
const config = {
  ...defaultConfig,
  ...envConfig[ENV],
  env: ENV,
};

export default config;
