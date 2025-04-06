/**
 * Configuration centrale pour le client
 * Ce fichier contient toutes les configurations nécessaires pour le client
 * y compris les clés API publiques et les URLs de base
 */

// Configuration de l'environnement
const isDevelopment = process.env.NODE_ENV === 'development';
const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';

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
    retryAttempts: 3
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
    useRealTimeData: true,
    cacheDuration: 30 * 60 * 1000 // 30 minutes
  },
  
  // Paramètres pour le développement
  development: {
    enableLogs: isDevelopment,
    mockData: isDevelopment && (process.env.REACT_APP_USE_MOCK_DATA === 'true')
  }
};

export default config;
