/**
 * Middleware de surveillance des performances
 * Surveille les performances des requêtes HTTP et détecte les anomalies
 */
const performanceMonitor = require('../services/performance-monitor.service');
const logger = require('../utils/logger');

/**
 * Middleware qui surveille les performances des requêtes HTTP
 * @param {Object} req Requête Express
 * @param {Object} res Réponse Express
 * @param {Function} next Fonction suivante
 */
function performanceMonitorMiddleware(req, res, next) {
  // Ignorer les requêtes pour les ressources statiques et les favicons
  if (req.path.startsWith('/static') || req.path === '/favicon.ico') {
    return next();
  }
  
  // Déterminer le service concerné par la requête
  const service = getServiceFromPath(req.path);
  
  // Démarrer la mesure de performance
  const endMeasure = performanceMonitor.startRequest(service);
  
  // Stocker l'heure de début pour calculer la durée
  const startTime = Date.now();
  
  // Intercepter la fin de la requête
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const isError = statusCode >= 400;
    
    // Terminer la mesure de performance
    endMeasure(isError ? new Error(`HTTP ${statusCode}`) : null);
    
    // Journaliser les requêtes lentes (> 1s)
    if (duration > 1000) {
      logger.warn(`Requête lente: ${req.method} ${req.path} (${duration}ms, ${statusCode})`);
    }
  });
  
  next();
}

/**
 * Détermine le service concerné par le chemin de la requête
 * @param {string} path Chemin de la requête
 * @returns {string} Nom du service
 */
function getServiceFromPath(path) {
  // Extraire le premier segment du chemin après /api
  if (path.startsWith('/api/')) {
    const segments = path.split('/');
    if (segments.length >= 3) {
      return segments[2];
    }
  }
  
  // Mapper certains chemins spécifiques à des services
  const pathMappings = {
    '/auth': 'AuthService',
    '/login': 'AuthService',
    '/register': 'AuthService',
    '/routes': 'RouteService',
    '/activities': 'ActivityService',
    '/strava': 'StravaService',
    '/users': 'UserService',
    '/profile': 'UserService',
    '/stats': 'StatsService',
    '/cols': 'ColService',
    '/mountains': 'MountainService',
    '/weather': 'WeatherService'
  };
  
  // Chercher une correspondance dans les mappings
  for (const [prefix, service] of Object.entries(pathMappings)) {
    if (path.startsWith(prefix)) {
      return service;
    }
  }
  
  // Par défaut, utiliser "API" comme service
  return 'API';
}

module.exports = performanceMonitorMiddleware;
