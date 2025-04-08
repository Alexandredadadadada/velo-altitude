/**
 * Configuration centrale pour le client
 * Ce fichier contient toutes les configurations nécessaires pour le client
 * y compris les clés API publiques et les URLs de base
 */

// Configuration de l'environnement
const isDevelopment = process.env.NODE_ENV === 'development';
const isNetlify = process.env.NETLIFY === 'true';
const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://api.velo-altitude.com';

// Configuration pour les APIs externes
const config = {
  // Mapbox (cartographie)
  mapboxToken: process.env.MAPBOX_TOKEN || process.env.REACT_APP_MAPBOX_TOKEN || 'YOUR_MAPBOX_TOKEN',
  mapboxStyles: {
    outdoor: 'mapbox://styles/mapbox/outdoors-v12',
    satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
    light: 'mapbox://styles/mapbox/light-v11'
  },
  
  // API interne
  api: {
    baseUrl: apiBaseUrl,
    timeout: 15000, // 15 secondes
    retryAttempts: 3,
    // Suppression de useMockData qui est géré par MSW maintenant
  },
  
  // Paramètres d'affichage
  display: {
    defaultZoom: 12,
    maxZoom: 18,
    minZoom: 5,
    defaultCenter: [4.8357, 48.8640], // Centre de la région Grand Est
    defaultLanguage: 'fr'
  },
  
  // Paramètres pour les fonctionnalités
  features: {
    useElevationProfile: true,
    useWeatherData: true,
    // MODIFICATION: Activer les données en temps réel sur Netlify
    useRealTimeData: true,
    cacheDuration: 30 * 60 * 1000 // 30 minutes
  },
  
  // Paramètres pour le développement
  development: {
    enableLogs: isDevelopment,
    // Modification: Données mockées gérées par MSW maintenant
    mockDataMigrated: true
  }
};

export default config;
