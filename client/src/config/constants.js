/**
 * Constantes de configuration pour l'application Velo-Altitude
 * Ces valeurs sont utilisées par les différents services pour les appels API
 * et d'autres configurations globales.
 */

// URL de base de l'API - sera remplacée par la valeur correcte en production via Netlify
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';

// Clés d'API pour les services tiers - à configurer dans les variables d'environnement Netlify
export const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_TOKEN || process.env.REACT_APP_MAPBOX_ACCESS_TOKEN || 'pk.placeholder';
export const WEATHER_API_KEY = process.env.REACT_APP_OPENWEATHER_API_KEY || 'placeholder';
export const STRAVA_CLIENT_ID = process.env.REACT_APP_STRAVA_CLIENT_ID || 'placeholder';
// export const STRAVA_CLIENT_SECRET = process.env.REACT_APP_STRAVA_CLIENT_SECRET || 'placeholder'; // REMOVED FOR SECURITY
export const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY || 'placeholder';

// Constantes d'application
export const APP_NAME = 'Velo-Altitude';
export const APP_VERSION = '1.0.0';

// Configuration des limites d'utilisation
export const MAX_FILE_UPLOAD_SIZE = 5 * 1024 * 1024; // 5MB

// Coordonnées par défaut pour la région Grand Est
export const DEFAULT_MAP_CENTER = [48.7, 6.2]; // Nancy (centre approximatif du Grand Est)
export const DEFAULT_MAP_ZOOM = 7;

// Configuration des niveaux de difficulté pour les cols et parcours
export const DIFFICULTY_LEVELS = [
  { id: 1, label: 'Facile', color: '#4CAF50' },
  { id: 2, label: 'Modéré', color: '#2196F3' },
  { id: 3, label: 'Difficile', color: '#FF9800' },
  { id: 4, label: 'Très difficile', color: '#F44336' },
  { id: 5, label: 'Extrême', color: '#9C27B0' }
];
