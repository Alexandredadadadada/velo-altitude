/**
 * Configuration du cache Redis pour Velo-Altitude
 * Utilisé par les services backend pour optimiser les performances
 */

const cacheConfig = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || '',
    tls: process.env.NODE_ENV === 'production'
  },
  defaultTTL: 3600, // 1 heure par défaut
  prefix: 'velo-altitude:',
  
  // Configurations spécifiques par entité
  ttlConfig: {
    cols: 86400, // 24 heures pour les cols (données stables)
    weather: 1800, // 30 minutes pour les données météo
    activities: 3600, // 1 heure pour les activités
    profile: 600, // 10 minutes pour les données de profil
    leaderboard: 300 // 5 minutes pour les classements
  }
};

module.exports = cacheConfig;
