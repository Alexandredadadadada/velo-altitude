// api.config.js - Configuration centralisée des API
// Ce fichier charge les variables d'environnement et les expose de manière sécurisée

const dotenv = require('dotenv');
const path = require('path');

// Charge les variables d'environnement
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

// Configuration globale des API
const config = {
  server: {
    port: process.env.PORT || 3000,
    environment: process.env.NODE_ENV || 'development',
    sessionSecret: process.env.SESSION_SECRET || 'defaultSecret'
  },
  
  // Configuration Mapbox (Cartographie)
  mapbox: {
    accessToken: process.env.MAPBOX_PUBLIC_TOKEN,
    secretToken: process.env.MAPBOX_SECRET_TOKEN,
    styles: {
      outdoor: 'mapbox://styles/mapbox/outdoors-v12',
      satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
      light: 'mapbox://styles/mapbox/light-v11'
    }
  },
  
  // Configuration OpenWeatherMap (Météo)
  openWeather: {
    apiKey: process.env.OPENWEATHER_API_KEY,
    baseUrl: 'https://api.openweathermap.org/data/2.5',
    units: 'metric', // Utilise Celsius pour la température
    lang: 'fr' // Langue française
  },
  
  // Configuration OpenRouteService (Itinéraires)
  openRoute: {
    apiKey: process.env.OPENROUTE_API_KEY,
    baseUrl: 'https://api.openrouteservice.org',
    profile: 'cycling-regular', // Profile par défaut pour le cyclisme
    options: {
      elevation: true,
      instructions: true
    }
  },
  
  // Configuration Strava API
  strava: {
    clientId: process.env.STRAVA_CLIENT_ID,
    clientSecret: process.env.STRAVA_CLIENT_SECRET,
    redirectUri: process.env.STRAVA_REDIRECT_URI,
    authUrl: 'https://www.strava.com/oauth/authorize',
    tokenUrl: 'https://www.strava.com/oauth/token',
    scope: 'read,activity:read_all',
    apiUrl: 'https://www.strava.com/api/v3'
  },
  
  // Configuration OpenAI (Assistant IA)
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4',
    baseUrl: 'https://api.openai.com/v1',
    maxTokens: 500
  }
};

// Fonction pour vérifier que les clés API requises sont présentes
const validateConfig = () => {
  const requiredKeys = [
    'mapbox.accessToken',
    'mapbox.secretToken',
    'openWeather.apiKey',
    'openRoute.apiKey',
    'strava.clientId',
    'strava.clientSecret',
    'openai.apiKey'
  ];
  
  const missingKeys = [];
  
  requiredKeys.forEach(key => {
    const parts = key.split('.');
    let current = config;
    
    for (const part of parts) {
      current = current[part];
      if (!current) {
        missingKeys.push(key);
        break;
      }
    }
  });
  
  if (missingKeys.length > 0) {
    console.warn(`⚠️ Attention: Les clés API suivantes sont manquantes: ${missingKeys.join(', ')}`);
    console.warn('Veuillez vérifier votre fichier .env et vous assurer que toutes les clés requises sont présentes.');
  }
  
  return missingKeys.length === 0;
};

// Valide la configuration au chargement
config.isValid = validateConfig();

module.exports = config;
