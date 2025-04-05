/**
 * Middleware d'optimisation des performances pour Dashboard-Velo
 * Optimise les requêtes avec filtres géographiques pour l'audience européenne
 */

const compression = require('compression');
const { performance } = require('perf_hooks');

// Configuration
const config = {
  // Seuil de temps de réponse pour le logging (ms)
  responseTimeThreshold: 500,
  
  // Taille maximale pour la compression (bytes)
  compressionThreshold: 1024, // 1KB
  
  // Durée de mise en cache par défaut (secondes)
  defaultCacheDuration: 60,
  
  // Durée de mise en cache pour les données statiques (secondes)
  staticCacheDuration: 3600, // 1 heure
  
  // Durée de mise en cache pour les données de pays/région (secondes)
  geoCacheDuration: 300, // 5 minutes
  
  // Endpoints nécessitant des données en temps réel (pas de mise en cache)
  realtimeEndpoints: [
    '/api/dashboard/real-time',
    '/api/dashboard/status'
  ]
};

/**
 * Middleware de compression
 * Compresse les réponses pour réduire la taille des données transférées
 */
function compressionMiddleware() {
  return compression({
    // Ne pas compresser les petites réponses
    threshold: config.compressionThreshold,
    
    // Niveau de compression (1 = rapide, 9 = meilleure compression)
    level: 6,
    
    // Filtre pour déterminer quelles réponses compresser
    filter: (req, res) => {
      // Ne pas compresser les requêtes pour les images, vidéos, etc.
      if (req.headers['content-type'] && (
        req.headers['content-type'].includes('image') ||
        req.headers['content-type'].includes('video') ||
        req.headers['content-type'].includes('audio')
      )) {
        return false;
      }
      
      // Compresser par défaut
      return true;
    }
  });
}

/**
 * Middleware de mise en cache des réponses
 * Configure les en-têtes de cache pour les réponses
 */
function cacheControlMiddleware() {
  return (req, res, next) => {
    // Déterminer la durée de mise en cache
    let cacheDuration = config.defaultCacheDuration;
    
    // Vérifier si l'endpoint est en temps réel
    if (config.realtimeEndpoints.some(endpoint => req.path.includes(endpoint))) {
      // Pas de mise en cache pour les données en temps réel
      cacheDuration = 0;
    } 
    // Vérifier si la requête contient des filtres géographiques
    else if (req.query.country || req.query.region) {
      cacheDuration = config.geoCacheDuration;
    }
    // Vérifier si c'est une ressource statique
    else if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/i)) {
      cacheDuration = config.staticCacheDuration;
    }
    
    // Configurer les en-têtes de cache
    if (cacheDuration > 0) {
      res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    } else {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    
    next();
  };
}

/**
 * Middleware de mesure des performances
 * Mesure le temps de réponse des requêtes
 */
function performanceMonitoringMiddleware() {
  return (req, res, next) => {
    // Marquer le début de la requête
    const startTime = performance.now();
    
    // Fonction pour enregistrer les métriques de performance
    const logPerformance = () => {
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      // Enregistrer les métriques si le temps de réponse dépasse le seuil
      if (responseTime > config.responseTimeThreshold) {
        console.warn(`Performance: ${req.method} ${req.path} - ${responseTime.toFixed(2)}ms`);
        
        // Enregistrer des informations supplémentaires pour les requêtes lentes
        const logData = {
          timestamp: new Date().toISOString(),
          method: req.method,
          path: req.path,
          query: req.query,
          responseTime,
          statusCode: res.statusCode
        };
        
        // Vous pouvez envoyer ces données à un service de monitoring
        // ou les enregistrer dans un fichier de log
        if (process.env.NODE_ENV === 'production') {
          // Exemple: envoi à un service de monitoring
          // monitoringService.logPerformanceIssue(logData);
        }
      }
    };
    
    // Intercepter la fin de la requête
    res.on('finish', logPerformance);
    res.on('close', logPerformance);
    
    next();
  };
}

/**
 * Middleware d'optimisation des requêtes géographiques
 * Optimise les requêtes avec filtres par pays/région
 */
function geoOptimizationMiddleware() {
  // Définir les pays par région pour éviter de recalculer à chaque requête
  const regionCountries = {
    western: ['fr', 'be', 'nl', 'lu'],
    eastern: ['pl', 'cz', 'sk', 'hu', 'ro', 'bg'],
    northern: ['dk', 'se', 'no', 'fi', 'ee', 'lv', 'lt'],
    southern: ['es', 'pt', 'it', 'gr', 'hr', 'si'],
    central: ['de', 'at', 'ch']
  };
  
  return (req, res, next) => {
    // Vérifier si la requête contient des filtres géographiques
    if (req.query.country || req.query.region) {
      // Normaliser les paramètres
      if (req.query.country) {
        req.query.country = req.query.country.toLowerCase();
      }
      
      if (req.query.region) {
        req.query.region = req.query.region.toLowerCase();
        
        // Ajouter un paramètre avec la liste des pays de la région
        // pour éviter de recalculer dans chaque handler
        if (regionCountries[req.query.region]) {
          req.regionCountries = regionCountries[req.query.region];
        }
      }
      
      // Ajouter un indicateur pour les handlers
      req.hasGeoFilters = true;
    }
    
    next();
  };
}

/**
 * Middleware de limitation de la taille des réponses
 * Limite la taille des réponses pour les requêtes avec filtres géographiques
 */
function responseSizeLimitMiddleware() {
  return (req, res, next) => {
    // Sauvegarder la méthode json originale
    const originalJson = res.json;
    
    // Remplacer la méthode json
    res.json = function(data) {
      // Vérifier si la requête a des filtres géographiques
      if (req.hasGeoFilters && data) {
        // Limiter la taille des tableaux dans la réponse
        Object.keys(data).forEach(key => {
          if (Array.isArray(data[key]) && data[key].length > 100) {
            // Limiter à 100 éléments pour les grands tableaux
            data[key] = data[key].slice(0, 100);
            
            // Ajouter une indication que les données sont tronquées
            if (!data.meta) {
              data.meta = {};
            }
            
            data.meta.truncated = true;
            data.meta.truncatedFields = data.meta.truncatedFields || [];
            data.meta.truncatedFields.push(key);
          }
        });
      }
      
      // Appeler la méthode json originale
      return originalJson.call(this, data);
    };
    
    next();
  };
}

/**
 * Exporte tous les middlewares d'optimisation
 */
module.exports = {
  compression: compressionMiddleware,
  cacheControl: cacheControlMiddleware,
  performanceMonitoring: performanceMonitoringMiddleware,
  geoOptimization: geoOptimizationMiddleware,
  responseSizeLimit: responseSizeLimitMiddleware,
  
  /**
   * Applique tous les middlewares d'optimisation
   * @param {Object} app - Application Express
   */
  applyAll: function(app) {
    app.use(this.compression());
    app.use(this.cacheControl());
    app.use(this.performanceMonitoring());
    app.use(this.geoOptimization());
    app.use(this.responseSizeLimit());
    
    console.log('Middlewares d\'optimisation des performances appliqués');
  }
};
