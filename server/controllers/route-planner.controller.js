// controllers/route-planner.controller.js - Contrôleur pour le planificateur d'itinéraires avancé
const routePlannerModel = require('../models/route-planner.model');

/**
 * Contrôleur pour la gestion du planificateur d'itinéraires
 */
class RoutePlannerController {
  /**
   * Récupère tous les itinéraires avec filtres optionnels
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  getAllRoutes(req, res) {
    try {
      // Récupère les filtres depuis la query string
      const { theme, difficulty, duration, region, country } = req.query;
      const filters = {};
      
      if (theme) filters.theme = theme;
      if (difficulty) filters.difficulty = difficulty;
      if (duration) filters.duration = parseInt(duration);
      if (region) filters.region = region;
      if (country) filters.country = country;
      
      const routes = routePlannerModel.getAllRoutes(filters);
      
      return res.status(200).json({
        status: 'success',
        count: routes.length,
        data: routes
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des itinéraires:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Une erreur est survenue lors de la récupération des itinéraires',
        error: error.message
      });
    }
  }

  /**
   * Récupère un itinéraire par son ID
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  getRouteById(req, res) {
    try {
      const { id } = req.params;
      const route = routePlannerModel.getRouteById(id);
      
      if (!route) {
        return res.status(404).json({
          status: 'error',
          message: `Itinéraire avec l'ID ${id} non trouvé`
        });
      }
      
      return res.status(200).json({
        status: 'success',
        data: route
      });
    } catch (error) {
      console.error(`Erreur lors de la récupération de l'itinéraire ${req.params.id}:`, error);
      return res.status(500).json({
        status: 'error',
        message: 'Une erreur est survenue lors de la récupération de l\'itinéraire',
        error: error.message
      });
    }
  }

  /**
   * Crée un nouvel itinéraire
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  createRoute(req, res) {
    try {
      // Validation des données minimales requises
      const { name, totalDistance, totalElevation, segments } = req.body;
      
      if (!name || !totalDistance || !totalElevation || !segments || !Array.isArray(segments) || segments.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Données incomplètes. Veuillez fournir au moins le nom, la distance totale, l\'élévation totale et les segments'
        });
      }
      
      const newRoute = routePlannerModel.createRoute(req.body);
      
      return res.status(201).json({
        status: 'success',
        message: 'Itinéraire créé avec succès',
        data: newRoute
      });
    } catch (error) {
      console.error('Erreur lors de la création de l\'itinéraire:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Une erreur est survenue lors de la création de l\'itinéraire',
        error: error.message
      });
    }
  }

  /**
   * Met à jour un itinéraire existant
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  updateRoute(req, res) {
    try {
      const { id } = req.params;
      const updatedRoute = routePlannerModel.updateRoute(id, req.body);
      
      if (!updatedRoute) {
        return res.status(404).json({
          status: 'error',
          message: `Itinéraire avec l'ID ${id} non trouvé`
        });
      }
      
      return res.status(200).json({
        status: 'success',
        message: 'Itinéraire mis à jour avec succès',
        data: updatedRoute
      });
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de l'itinéraire ${req.params.id}:`, error);
      return res.status(500).json({
        status: 'error',
        message: 'Une erreur est survenue lors de la mise à jour de l\'itinéraire',
        error: error.message
      });
    }
  }

  /**
   * Supprime un itinéraire
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  deleteRoute(req, res) {
    try {
      const { id } = req.params;
      const deleted = routePlannerModel.deleteRoute(id);
      
      if (!deleted) {
        return res.status(404).json({
          status: 'error',
          message: `Itinéraire avec l'ID ${id} non trouvé`
        });
      }
      
      return res.status(200).json({
        status: 'success',
        message: 'Itinéraire supprimé avec succès'
      });
    } catch (error) {
      console.error(`Erreur lors de la suppression de l'itinéraire ${req.params.id}:`, error);
      return res.status(500).json({
        status: 'error',
        message: 'Une erreur est survenue lors de la suppression de l\'itinéraire',
        error: error.message
      });
    }
  }

  /**
   * Calcule le temps estimé pour un itinéraire donné
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  estimateTime(req, res) {
    try {
      const { id } = req.params;
      const { cyclistLevel } = req.query;
      
      if (!cyclistLevel) {
        return res.status(400).json({
          status: 'error',
          message: 'Niveau du cycliste requis (débutant, intermédiaire, avancé ou expert)'
        });
      }
      
      const timeEstimation = routePlannerModel.estimateTime(id, cyclistLevel);
      
      if (!timeEstimation) {
        return res.status(404).json({
          status: 'error',
          message: `Itinéraire avec l'ID ${id} non trouvé`
        });
      }
      
      return res.status(200).json({
        status: 'success',
        data: timeEstimation
      });
    } catch (error) {
      console.error(`Erreur lors de l'estimation du temps pour l'itinéraire ${req.params.id}:`, error);
      return res.status(500).json({
        status: 'error',
        message: 'Une erreur est survenue lors de l\'estimation du temps',
        error: error.message
      });
    }
  }

  /**
   * Calcule la difficulté globale d'un itinéraire
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  calculateDifficulty(req, res) {
    try {
      const { id } = req.params;
      
      const difficultyAssessment = routePlannerModel.calculateDifficulty(id);
      
      if (!difficultyAssessment) {
        return res.status(404).json({
          status: 'error',
          message: `Itinéraire avec l'ID ${id} non trouvé`
        });
      }
      
      return res.status(200).json({
        status: 'success',
        data: difficultyAssessment
      });
    } catch (error) {
      console.error(`Erreur lors du calcul de la difficulté pour l'itinéraire ${req.params.id}:`, error);
      return res.status(500).json({
        status: 'error',
        message: 'Une erreur est survenue lors du calcul de la difficulté',
        error: error.message
      });
    }
  }

  /**
   * Trouve des hébergements le long d'un itinéraire
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  findAccommodations(req, res) {
    try {
      const { id } = req.params;
      
      const accommodations = routePlannerModel.findAccommodations(id);
      
      return res.status(200).json({
        status: 'success',
        count: accommodations.length,
        data: accommodations
      });
    } catch (error) {
      console.error(`Erreur lors de la recherche d'hébergements pour l'itinéraire ${req.params.id}:`, error);
      return res.status(500).json({
        status: 'error',
        message: 'Une erreur est survenue lors de la recherche d\'hébergements',
        error: error.message
      });
    }
  }

  /**
   * Récupère tous les itinéraires thématiques
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  getThematicRoutes(req, res) {
    try {
      // Grouper les itinéraires par thème
      const routes = routePlannerModel.getAllRoutes();
      const thematicRoutes = {};
      
      routes.forEach(route => {
        if (!thematicRoutes[route.theme]) {
          thematicRoutes[route.theme] = [];
        }
        thematicRoutes[route.theme].push(route);
      });
      
      return res.status(200).json({
        status: 'success',
        data: thematicRoutes
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des itinéraires thématiques:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Une erreur est survenue lors de la récupération des itinéraires thématiques',
        error: error.message
      });
    }
  }

  /**
   * Génère un itinéraire personnalisé en fonction des préférences utilisateur
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  generatePersonalizedRoute(req, res) {
    try {
      // Valider les préférences requises
      const { 
        startPoint, 
        endPoint, 
        distance, 
        difficulty, 
        preferences = {} 
      } = req.body;
      
      // Vérifier que les données essentielles sont présentes
      if (!startPoint || !endPoint) {
        return res.status(400).json({
          status: 'error',
          message: 'Points de départ et d\'arrivée requis'
        });
      }
      
      // Extraire les préférences spécifiques (optionnelles)
      const { 
        avoidTraffic = true, 
        scenicRoute = false,
        includeColsIds = [],
        maxGradient,
        surfacePreference,
        weatherConsideration = true,
        includeRefreshPoints = true
      } = preferences;
      
      // Générer l'itinéraire personnalisé
      const personalizedRoute = routePlannerModel.generatePersonalizedRoute({
        startPoint,
        endPoint,
        distance,
        difficulty,
        avoidTraffic,
        scenicRoute,
        includeColsIds,
        maxGradient,
        surfacePreference,
        weatherConsideration,
        includeRefreshPoints
      });
      
      return res.status(200).json({
        status: 'success',
        message: 'Itinéraire personnalisé généré avec succès',
        data: personalizedRoute
      });
    } catch (error) {
      console.error('Erreur lors de la génération de l\'itinéraire personnalisé:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Une erreur est survenue lors de la génération de l\'itinéraire personnalisé',
        error: error.message
      });
    }
  }
  
  /**
   * Optimise un itinéraire existant en fonction des conditions météo actuelles
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  optimizeRouteForWeather(req, res) {
    try {
      const { id } = req.params;
      const { date, time, avoidRain = true, avoidWind = true, temperaturePreference } = req.body;
      
      // Vérifier si l'itinéraire existe
      const route = routePlannerModel.getRouteById(id);
      if (!route) {
        return res.status(404).json({
          status: 'error',
          message: `Itinéraire avec l'ID ${id} non trouvé`
        });
      }
      
      // Optimiser l'itinéraire en fonction des conditions météo
      const optimizedRoute = routePlannerModel.optimizeRouteForWeather(id, {
        date,
        time,
        avoidRain,
        avoidWind,
        temperaturePreference
      });
      
      return res.status(200).json({
        status: 'success',
        message: 'Itinéraire optimisé avec succès en fonction des conditions météo',
        data: optimizedRoute
      });
    } catch (error) {
      console.error(`Erreur lors de l'optimisation météo de l'itinéraire ${req.params.id}:`, error);
      return res.status(500).json({
        status: 'error',
        message: 'Une erreur est survenue lors de l\'optimisation météo de l\'itinéraire',
        error: error.message
      });
    }
  }
  
  /**
   * Génère un itinéraire de type "challenge" incluant un ou plusieurs cols spécifiques
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  generateChallengeRoute(req, res) {
    try {
      const { colIds, startPoint, difficulty, maxDistance } = req.body;
      
      // Valider les données requises
      if (!colIds || !Array.isArray(colIds) || colIds.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Au moins un ID de col est requis'
        });
      }
      
      if (!startPoint) {
        return res.status(400).json({
          status: 'error',
          message: 'Point de départ requis'
        });
      }
      
      // Générer l'itinéraire de challenge
      const challengeRoute = routePlannerModel.generateChallengeRoute({
        colIds,
        startPoint,
        difficulty: difficulty || 'intermediate',
        maxDistance: maxDistance || 120
      });
      
      return res.status(200).json({
        status: 'success',
        message: 'Itinéraire challenge généré avec succès',
        data: challengeRoute
      });
    } catch (error) {
      console.error('Erreur lors de la génération de l\'itinéraire challenge:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Une erreur est survenue lors de la génération de l\'itinéraire challenge',
        error: error.message
      });
    }
  }
  
  /**
   * Exporte un itinéraire au format GPX avec annotations et points d'intérêt
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  exportRouteToGpx(req, res) {
    try {
      const { id } = req.params;
      const { includeWeather = true, includePois = true, includeAlerts = true } = req.query;
      
      // Vérifier si l'itinéraire existe
      const route = routePlannerModel.getRouteById(id);
      if (!route) {
        return res.status(404).json({
          status: 'error',
          message: `Itinéraire avec l'ID ${id} non trouvé`
        });
      }
      
      // Générer le fichier GPX
      const gpxData = routePlannerModel.exportRouteToGpx(id, {
        includeWeather: includeWeather === 'true',
        includePois: includePois === 'true',
        includeAlerts: includeAlerts === 'true'
      });
      
      // Configurer les en-têtes pour le téléchargement
      res.setHeader('Content-Type', 'application/gpx+xml');
      res.setHeader('Content-Disposition', `attachment; filename="${route.name.replace(/\s+/g, '_')}.gpx"`);
      
      // Envoyer le fichier
      return res.status(200).send(gpxData);
    } catch (error) {
      console.error(`Erreur lors de l'exportation de l'itinéraire ${req.params.id} au format GPX:`, error);
      return res.status(500).json({
        status: 'error',
        message: 'Une erreur est survenue lors de l\'exportation de l\'itinéraire au format GPX',
        error: error.message
      });
    }
  }
  
  /**
   * Recommande une heure de départ optimale en fonction des conditions météo prévues
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  recommendDepartureTime(req, res) {
    try {
      const { id } = req.params;
      const { date, timeRange = '06:00-18:00', avoidRain = true, avoidWind = true, preferWarmer = true } = req.body;
      
      // Vérifier si l'itinéraire existe
      const route = routePlannerModel.getRouteById(id);
      if (!route) {
        return res.status(404).json({
          status: 'error',
          message: `Itinéraire avec l'ID ${id} non trouvé`
        });
      }
      
      // Analyser la plage horaire
      const [startTime, endTime] = timeRange.split('-');
      
      // Obtenir la recommandation
      const recommendation = routePlannerModel.recommendDepartureTime(id, {
        date,
        startTime,
        endTime,
        avoidRain,
        avoidWind,
        preferWarmer
      });
      
      return res.status(200).json({
        status: 'success',
        message: 'Recommandation d\'heure de départ générée avec succès',
        data: recommendation
      });
    } catch (error) {
      console.error(`Erreur lors de la recommandation d'heure de départ pour l'itinéraire ${req.params.id}:`, error);
      return res.status(500).json({
        status: 'error',
        message: 'Une erreur est survenue lors de la génération de la recommandation d\'heure de départ',
        error: error.message
      });
    }
  }
}

module.exports = new RoutePlannerController();
