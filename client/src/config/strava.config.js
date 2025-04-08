/**
 * Configuration de l'intégration Strava
 * Paramètres nécessaires pour l'API Strava
 */

export const STRAVA_CONFIG = {
  // Informations OAuth
  clientId: process.env.REACT_APP_STRAVA_CLIENT_ID,
  // clientSecret: process.env.REACT_APP_STRAVA_CLIENT_SECRET, // REMOVED FOR SECURITY
  redirectUri: `${window.location.origin}/callback`,
  
  // Endpoints API
  apiUrl: 'https://www.strava.com/api/v3',
  authUrl: 'https://www.strava.com/oauth/authorize',
  tokenUrl: 'https://www.strava.com/oauth/token',
  
  // Scopes requis pour l'application
  scopes: [
    'read',
    'read_all',
    'profile:read_all',
    'activity:read',
    'activity:read_all'
  ].join(','),
  
  // Paramètres d'affichage
  display: {
    activityTypes: {
      Ride: {
        icon: 'bicycle',
        color: '#FC4C02'
      },
      Run: {
        icon: 'running',
        color: '#2672EC'
      },
      Hike: {
        icon: 'hiking',
        color: '#4B862C'
      }
    },
    defaultColors: {
      primary: '#FC4C02',
      secondary: '#FCBA03'
    }
  },
  
  // Configuration d'importation
  importSettings: {
    maxActivities: 100,
    includeSports: ['Ride', 'VirtualRide', 'EBikeRide', 'GravelRide'],
    excludeIndoor: true,
    includePrivate: true
  }
};
