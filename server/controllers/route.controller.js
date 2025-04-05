// route.controller.js - Contrôleur pour les interactions avec l'API OpenRouteService
const openRouteService = require('../services/openroute.service');
const errorService = require('../services/error.service').getInstance();
const cacheService = require('../services/cache.service').getInstance();
const mongoose = require('mongoose');
const logger = require('../config/logger');

// Modèles
let Route = null;
let User = null;

// Chargement différé des modèles pour éviter les dépendances circulaires
const loadModels = () => {
  if (!Route) {
    try {
      Route = require('../models/route.model');
      User = require('../models/user.model');
    } catch (error) {
      logger.error(`Erreur lors du chargement des modèles: ${error.message}`);
    }
  }
};

class RouteController {
  /**
   * Calcule un itinéraire cyclable entre deux points
   * @param {object} req - Requête Express
   * @param {object} res - Réponse Express
   */
  async calculateRoute(req, res) {
    try {
      const { start, end, waypoints, profile, preference, options } = req.body;
      
      // La validation est maintenant gérée par le middleware de validation
      
      const route = await openRouteService.getRoute(
        start, 
        end, 
        waypoints || [], 
        { 
          profile: profile || 'cycling-road',
          preference: preference || 'recommended',
          ...options 
        }
      );
      
      // Enregistrer l'utilisation de l'itinéraire pour les statistiques
      if (req.user) {
        this._trackRouteUsage(req.user.id, {
          start,
          end,
          waypoints: waypoints || []
        });
      }
      
      return res.json({
        success: true,
        data: route
      });
    } catch (error) {
      logger.error(`Erreur lors du calcul d'itinéraire: ${error.message}`, { stack: error.stack });
      return errorService.sendErrorResponse(
        res,
        errorService.ERROR_TYPES.API_ERROR,
        'Échec du calcul d\'itinéraire cyclable',
        { details: error.message }
      );
    }
  }

  /**
   * Calcule une zone accessible (isochrone) depuis un point
   * @param {object} req - Requête Express
   * @param {object} res - Réponse Express
   */
  async calculateIsochrone(req, res) {
    try {
      const { center, range, rangeType, profile, options } = req.body;
      
      // La validation est maintenant gérée par le middleware de validation
      
      const isochrone = await openRouteService.getIsochrone(
        center, 
        { 
          range: Number(range),
          rangeType: rangeType || 'time',
          profile: profile || 'cycling-road',
          ...options
        }
      );
      
      return res.json({
        success: true,
        data: isochrone
      });
    } catch (error) {
      logger.error(`Erreur lors du calcul d'isochrone: ${error.message}`, { stack: error.stack });
      return errorService.sendErrorResponse(
        res,
        errorService.ERROR_TYPES.API_ERROR,
        'Échec du calcul de zone accessible',
        { details: error.message }
      );
    }
  }

  /**
   * Récupère les données d'élévation pour une série de points
   * @param {object} req - Requête Express
   * @param {object} res - Réponse Express
   */
  async getElevation(req, res) {
    try {
      const { points, format } = req.body;
      
      // La validation est maintenant gérée par le middleware de validation
      
      const elevation = await openRouteService.getElevation(points, { format });
      
      return res.json({
        success: true,
        data: elevation
      });
    } catch (error) {
      logger.error(`Erreur lors de la récupération des données d'élévation: ${error.message}`, { stack: error.stack });
      return errorService.sendErrorResponse(
        res,
        errorService.ERROR_TYPES.API_ERROR,
        'Échec de la récupération des données d\'élévation',
        { details: error.message }
      );
    }
  }

  /**
   * Optimise un itinéraire pour plusieurs points à visiter
   * @param {object} req - Requête Express
   * @param {object} res - Réponse Express
   */
  async optimizeRoute(req, res) {
    try {
      const { points, roundTrip, profile, metric } = req.body;
      
      // La validation est maintenant gérée par le middleware de validation
      
      // Vérifier si la fonction d'optimisation existe
      if (typeof openRouteService.optimizeRoute !== 'function') {
        throw new Error('La fonctionnalité d\'optimisation d\'itinéraire n\'est pas disponible');
      }
      
      const optimizedRoute = await openRouteService.optimizeRoute(
        points, 
        { 
          roundTrip: roundTrip === true,
          profile: profile || 'cycling-road',
          metric: metric || 'time'
        }
      );
      
      return res.json({
        success: true,
        data: optimizedRoute
      });
    } catch (error) {
      logger.error(`Erreur lors de l'optimisation de l'itinéraire: ${error.message}`, { stack: error.stack });
      return errorService.sendErrorResponse(
        res,
        errorService.ERROR_TYPES.API_ERROR,
        'Échec de l\'optimisation de l\'itinéraire',
        { details: error.message }
      );
    }
  }
  
  /**
   * Récupère les itinéraires enregistrés par l'utilisateur
   * @param {object} req - Requête Express
   * @param {object} res - Réponse Express
   */
  async getSavedRoutes(req, res) {
    try {
      loadModels();
      
      if (!Route) {
        return errorService.sendErrorResponse(
          res,
          errorService.ERROR_TYPES.INTERNAL_ERROR,
          'Le modèle Route n\'est pas disponible'
        );
      }
      
      const userId = req.user.id;
      const { filter, sort = 'createdAt', order = 'desc' } = req.query;
      
      // Construire la requête de filtrage
      const query = { user: userId };
      
      if (filter) {
        // Filtrer par nom ou description
        query.$or = [
          { name: { $regex: filter, $options: 'i' } },
          { description: { $regex: filter, $options: 'i' } }
        ];
        
        // Filtrer par tags si c'est un tableau
        if (Array.isArray(req.query.tags) && req.query.tags.length > 0) {
          query.tags = { $in: req.query.tags };
        }
      }
      
      // Compter le nombre total d'itinéraires
      const total = await Route.countDocuments(query);
      
      // Construire l'objet de tri
      const sortObj = {};
      sortObj[sort] = order === 'desc' ? -1 : 1;
      
      // Récupérer les itinéraires avec pagination
      const routes = await Route.find(query)
        .sort(sortObj)
        .skip(req.pagination.skip)
        .limit(req.pagination.limit)
        .select('-route'); // Exclure les données GeoJSON pour alléger la réponse
      
      // Renvoyer la réponse paginée
      return res.paginate(routes, total, {
        filter: filter || '',
        sort,
        order
      });
    } catch (error) {
      logger.error(`Erreur lors de la récupération des itinéraires enregistrés: ${error.message}`, { stack: error.stack });
      return errorService.sendErrorResponse(
        res,
        errorService.ERROR_TYPES.DATABASE_ERROR,
        'Échec de la récupération des itinéraires enregistrés',
        { details: error.message }
      );
    }
  }
  
  /**
   * Récupère un itinéraire spécifique par ID
   * @param {object} req - Requête Express
   * @param {object} res - Réponse Express
   */
  async getRouteById(req, res) {
    try {
      loadModels();
      
      if (!Route) {
        return errorService.sendErrorResponse(
          res,
          errorService.ERROR_TYPES.INTERNAL_ERROR,
          'Le modèle Route n\'est pas disponible'
        );
      }
      
      const routeId = req.params.id;
      
      // Valider l'ID
      if (!mongoose.Types.ObjectId.isValid(routeId)) {
        return errorService.sendErrorResponse(
          res,
          errorService.ERROR_TYPES.VALIDATION,
          'ID d\'itinéraire invalide'
        );
      }
      
      // Récupérer l'itinéraire
      const route = await Route.findById(routeId);
      
      if (!route) {
        return errorService.sendErrorResponse(
          res,
          errorService.ERROR_TYPES.NOT_FOUND,
          'Itinéraire non trouvé'
        );
      }
      
      // Vérifier les droits d'accès
      if (!route.isPublic && (!req.user || route.user.toString() !== req.user.id)) {
        return errorService.sendErrorResponse(
          res,
          errorService.ERROR_TYPES.FORBIDDEN,
          'Vous n\'avez pas accès à cet itinéraire'
        );
      }
      
      // Incrémenter le compteur de vues
      route.views = (route.views || 0) + 1;
      await route.save();
      
      return res.json({
        success: true,
        data: route
      });
    } catch (error) {
      logger.error(`Erreur lors de la récupération de l'itinéraire: ${error.message}`, { stack: error.stack });
      return errorService.sendErrorResponse(
        res,
        errorService.ERROR_TYPES.DATABASE_ERROR,
        'Échec de la récupération de l\'itinéraire',
        { details: error.message }
      );
    }
  }
  
  /**
   * Enregistre un itinéraire pour l'utilisateur
   * @param {object} req - Requête Express
   * @param {object} res - Réponse Express
   */
  async saveRoute(req, res) {
    try {
      loadModels();
      
      if (!Route) {
        return errorService.sendErrorResponse(
          res,
          errorService.ERROR_TYPES.INTERNAL_ERROR,
          'Le modèle Route n\'est pas disponible'
        );
      }
      
      const userId = req.user.id;
      const routeData = req.body;
      
      // Créer un nouvel itinéraire
      const newRoute = new Route({
        ...routeData,
        user: userId,
        createdAt: new Date(),
        views: 0,
        shares: 0
      });
      
      // Enregistrer l'itinéraire
      await newRoute.save();
      
      return res.status(201).json({
        success: true,
        data: newRoute
      });
    } catch (error) {
      logger.error(`Erreur lors de l'enregistrement de l'itinéraire: ${error.message}`, { stack: error.stack });
      return errorService.sendErrorResponse(
        res,
        errorService.ERROR_TYPES.DATABASE_ERROR,
        'Échec de l\'enregistrement de l\'itinéraire',
        { details: error.message }
      );
    }
  }
  
  /**
   * Supprime un itinéraire enregistré
   * @param {object} req - Requête Express
   * @param {object} res - Réponse Express
   */
  async deleteRoute(req, res) {
    try {
      loadModels();
      
      if (!Route) {
        return errorService.sendErrorResponse(
          res,
          errorService.ERROR_TYPES.INTERNAL_ERROR,
          'Le modèle Route n\'est pas disponible'
        );
      }
      
      const userId = req.user.id;
      const routeId = req.params.id;
      
      // Valider l'ID
      if (!mongoose.Types.ObjectId.isValid(routeId)) {
        return errorService.sendErrorResponse(
          res,
          errorService.ERROR_TYPES.VALIDATION,
          'ID d\'itinéraire invalide'
        );
      }
      
      // Vérifier si l'itinéraire existe et appartient à l'utilisateur
      const route = await Route.findOne({ _id: routeId, user: userId });
      
      if (!route) {
        return errorService.sendErrorResponse(
          res,
          errorService.ERROR_TYPES.NOT_FOUND,
          'Itinéraire non trouvé ou vous n\'êtes pas autorisé à le supprimer'
        );
      }
      
      // Supprimer l'itinéraire
      await Route.deleteOne({ _id: routeId });
      
      return res.json({
        success: true,
        message: 'Itinéraire supprimé avec succès'
      });
    } catch (error) {
      logger.error(`Erreur lors de la suppression de l'itinéraire: ${error.message}`, { stack: error.stack });
      return errorService.sendErrorResponse(
        res,
        errorService.ERROR_TYPES.DATABASE_ERROR,
        'Échec de la suppression de l\'itinéraire',
        { details: error.message }
      );
    }
  }
  
  /**
   * Partage un itinéraire avec d'autres utilisateurs
   * @param {object} req - Requête Express
   * @param {object} res - Réponse Express
   */
  async shareRoute(req, res) {
    try {
      loadModels();
      
      if (!Route || !User) {
        return errorService.sendErrorResponse(
          res,
          errorService.ERROR_TYPES.INTERNAL_ERROR,
          'Les modèles nécessaires ne sont pas disponibles'
        );
      }
      
      const userId = req.user.id;
      const routeId = req.params.id;
      const { recipients, message } = req.body;
      
      // Valider l'ID
      if (!mongoose.Types.ObjectId.isValid(routeId)) {
        return errorService.sendErrorResponse(
          res,
          errorService.ERROR_TYPES.VALIDATION,
          'ID d\'itinéraire invalide'
        );
      }
      
      // Vérifier si l'itinéraire existe et appartient à l'utilisateur ou est public
      const route = await Route.findOne({
        _id: routeId,
        $or: [{ user: userId }, { isPublic: true }]
      });
      
      if (!route) {
        return errorService.sendErrorResponse(
          res,
          errorService.ERROR_TYPES.NOT_FOUND,
          'Itinéraire non trouvé ou vous n\'êtes pas autorisé à le partager'
        );
      }
      
      // Valider les destinataires
      if (!Array.isArray(recipients) || recipients.length === 0) {
        return errorService.sendErrorResponse(
          res,
          errorService.ERROR_TYPES.VALIDATION,
          'Liste de destinataires invalide'
        );
      }
      
      // Trouver les utilisateurs correspondants aux emails
      const users = await User.find({ email: { $in: recipients } });
      
      if (users.length === 0) {
        return errorService.sendErrorResponse(
          res,
          errorService.ERROR_TYPES.NOT_FOUND,
          'Aucun destinataire trouvé'
        );
      }
      
      // Envoyer une notification à chaque utilisateur
      // Note: Ceci est une implémentation simplifiée, dans un système réel,
      // on utiliserait un service de notification
      const notifications = users.map(user => ({
        user: user._id,
        type: 'route_shared',
        content: {
          routeId: route._id,
          routeName: route.name,
          sharedBy: req.user.id,
          sharedByName: req.user.name || req.user.email,
          message: message || `${req.user.name || 'Un utilisateur'} a partagé un itinéraire avec vous`
        },
        read: false,
        createdAt: new Date()
      }));
      
      // Enregistrer les notifications (si un modèle de notification existe)
      if (mongoose.models.Notification) {
        await mongoose.models.Notification.insertMany(notifications);
      }
      
      // Incrémenter le compteur de partages
      route.shares = (route.shares || 0) + 1;
      await route.save();
      
      return res.json({
        success: true,
        message: `Itinéraire partagé avec ${users.length} utilisateur(s)`,
        data: {
          recipients: users.map(u => u.email),
          route: {
            id: route._id,
            name: route.name
          }
        }
      });
    } catch (error) {
      logger.error(`Erreur lors du partage de l'itinéraire: ${error.message}`, { stack: error.stack });
      return errorService.sendErrorResponse(
        res,
        errorService.ERROR_TYPES.API_ERROR,
        'Échec du partage de l\'itinéraire',
        { details: error.message }
      );
    }
  }
  
  /**
   * Suit l'utilisation des itinéraires pour les statistiques
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} routeInfo - Informations sur l'itinéraire
   * @private
   */
  async _trackRouteUsage(userId, routeInfo) {
    try {
      // Stocker l'utilisation dans le cache pour agrégation ultérieure
      const cacheKey = `route_usage:${userId}:${Date.now()}`;
      await cacheService.set(cacheKey, {
        userId,
        timestamp: new Date(),
        route: routeInfo
      }, 86400); // TTL de 24h
      
      // Incrémenter le compteur d'utilisation
      const counterKey = `route_usage_counter:${userId}`;
      const counter = await cacheService.get(counterKey) || 0;
      await cacheService.set(counterKey, counter + 1, 0); // Pas de TTL
    } catch (error) {
      logger.error(`Erreur lors du suivi de l'utilisation de l'itinéraire: ${error.message}`);
      // Ne pas propager l'erreur pour ne pas perturber l'expérience utilisateur
    }
  }
}

module.exports = new RouteController();
