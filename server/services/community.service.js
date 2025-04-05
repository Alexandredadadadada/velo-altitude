/**
 * Service de gestion des fonctionnalités communautaires
 * Gère les interactions sociales, les flux d'activités et les événements communautaires
 */

const { logger } = require('../utils/logger');
const mongoose = require('mongoose');
const { getAsync, setAsync } = require('./cache.service');

// Modèles
let Activity, User, Comment, Event, Challenge;

// Services de dépendance
let notificationService, errorService, cacheService, apiManager;

// Configuration
const ACTIVITY_FEED_CACHE_TTL = 300; // 5 minutes
const ACTIVITY_FEED_DEFAULT_LIMIT = 20;
const ACTIVITY_TYPES = {
  RIDE: 'ride',
  COMMENT: 'comment',
  EVENT_JOIN: 'event_join',
  ACHIEVEMENT: 'achievement',
  CHALLENGE_COMPLETION: 'challenge_completion',
  FOLLOW: 'follow',
  KUDOS: 'kudos'
};

/**
 * Initialise le service et charge les modèles nécessaires
 */
async function init() {
  try {
    logger.debug('Initialisation du service communautaire...');
    
    // Charger les modèles
    Activity = mongoose.model('Activity');
    User = mongoose.model('User');
    Comment = mongoose.model('Comment');
    Event = mongoose.model('Event');
    Challenge = mongoose.model('Challenge');
    
    logger.info('Service communautaire initialisé avec succès');
    return true;
  } catch (error) {
    logger.error(`Erreur d'initialisation du service communautaire: ${error.message}`);
    throw error;
  }
}

/**
 * Définit le service de notification
 * @param {Object} service Service de notification
 */
function setNotificationService(service) {
  notificationService = service;
  logger.debug('Service de notification défini pour le service communautaire');
}

/**
 * Définit le service d'erreur
 * @param {Object} service Service d'erreur
 */
function setErrorService(service) {
  errorService = service;
  logger.debug('Service d\'erreur défini pour le service communautaire');
}

/**
 * Définit le service de cache
 * @param {Object} service Service de cache
 */
function setCacheService(service) {
  cacheService = service;
  logger.debug('Service de cache défini pour le service communautaire');
}

/**
 * Définit le gestionnaire d'API
 * @param {Object} manager Gestionnaire d'API
 */
function setApiManager(manager) {
  apiManager = manager;
  logger.debug('Gestionnaire d\'API défini pour le service communautaire');
}

/**
 * Récupère le flux d'activités pour un utilisateur
 * @param {string} userId ID de l'utilisateur
 * @param {Object} options Options de pagination et de filtrage
 * @returns {Promise<Array>} Liste des activités
 */
async function getActivityFeed(userId, options = {}) {
  try {
    const limit = options.limit || ACTIVITY_FEED_DEFAULT_LIMIT;
    const page = options.page || 1;
    const skip = (page - 1) * limit;
    
    // Vérifier le cache
    const cacheKey = `activity_feed:${userId}:${limit}:${page}`;
    const cachedFeed = await getAsync(cacheKey);
    
    if (cachedFeed) {
      logger.debug(`Récupération du flux d'activités depuis le cache pour l'utilisateur ${userId}`);
      return JSON.parse(cachedFeed);
    }
    
    // Récupérer l'utilisateur pour obtenir ses abonnements
    const user = await User.findById(userId);
    if (!user) {
      throw errorService.createError('Utilisateur non trouvé', 404);
    }
    
    // IDs des utilisateurs suivis + l'utilisateur lui-même
    const followingIds = [...user.following, userId];
    
    // Récupérer les activités
    const activities = await Activity.find({ userId: { $in: followingIds } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'firstName lastName profilePicture')
      .lean();
    
    // Enrichir les activités avec des métadonnées supplémentaires
    const enrichedActivities = await Promise.all(activities.map(async (activity) => {
      const enriched = { ...activity };
      
      // Ajouter des commentaires si c'est une activité sociale
      if (activity.type === ACTIVITY_TYPES.RIDE) {
        const commentCount = await Comment.countDocuments({ activityId: activity._id });
        enriched.commentCount = commentCount;
        
        // Ajouter le nombre de kudos
        enriched.kudosCount = activity.kudos ? activity.kudos.length : 0;
        enriched.hasGivenKudos = activity.kudos && activity.kudos.includes(userId);
      }
      
      return enriched;
    }));
    
    // Mettre en cache les résultats
    await setAsync(cacheKey, JSON.stringify(enrichedActivities), ACTIVITY_FEED_CACHE_TTL);
    
    return enrichedActivities;
  } catch (error) {
    logger.error(`Erreur lors de la récupération du flux d'activités: ${error.message}`);
    throw error;
  }
}

/**
 * Crée une nouvelle activité
 * @param {string} userId ID de l'utilisateur
 * @param {string} type Type d'activité
 * @param {Object} data Données de l'activité
 * @returns {Promise<Object>} Activité créée
 */
async function createActivity(userId, type, data) {
  try {
    // Valider le type d'activité
    if (!Object.values(ACTIVITY_TYPES).includes(type)) {
      throw errorService.createError('Type d\'activité invalide', 400);
    }
    
    // Créer l'activité
    const activity = new Activity({
      userId,
      type,
      data,
      createdAt: new Date()
    });
    
    await activity.save();
    
    // Invalider le cache pour tous les abonnés
    const user = await User.findById(userId);
    if (user && user.followers && user.followers.length > 0) {
      // Invalider le cache pour chaque abonné
      const promises = user.followers.map(followerId => {
        const pattern = `activity_feed:${followerId}:*`;
        return cacheService.deleteByPattern(pattern);
      });
      
      // Invalider également le cache de l'utilisateur lui-même
      promises.push(cacheService.deleteByPattern(`activity_feed:${userId}:*`));
      
      await Promise.all(promises);
    } else {
      // Invalider seulement le cache de l'utilisateur
      await cacheService.deleteByPattern(`activity_feed:${userId}:*`);
    }
    
    // Notifier les abonnés si nécessaire
    if (notificationService && type !== ACTIVITY_TYPES.COMMENT) {
      await notifyFollowers(userId, activity);
    }
    
    return activity;
  } catch (error) {
    logger.error(`Erreur lors de la création d'une activité: ${error.message}`);
    throw error;
  }
}

/**
 * Ajoute un commentaire à une activité
 * @param {string} userId ID de l'utilisateur qui commente
 * @param {string} activityId ID de l'activité
 * @param {string} content Contenu du commentaire
 * @returns {Promise<Object>} Commentaire créé
 */
async function addComment(userId, activityId, content) {
  try {
    // Vérifier que l'activité existe
    const activity = await Activity.findById(activityId);
    if (!activity) {
      throw errorService.createError('Activité non trouvée', 404);
    }
    
    // Créer le commentaire
    const comment = new Comment({
      userId,
      activityId,
      content,
      createdAt: new Date()
    });
    
    await comment.save();
    
    // Créer une activité de type commentaire
    await createActivity(userId, ACTIVITY_TYPES.COMMENT, {
      activityId,
      commentId: comment._id
    });
    
    // Notifier le propriétaire de l'activité si ce n'est pas l'utilisateur lui-même
    if (notificationService && activity.userId.toString() !== userId) {
      await notificationService.sendNotification(
        activity.userId,
        'Nouveau commentaire',
        `Quelqu'un a commenté votre activité`,
        {
          type: 'comment',
          activityId: activity._id,
          commentId: comment._id
        }
      );
    }
    
    return comment;
  } catch (error) {
    logger.error(`Erreur lors de l'ajout d'un commentaire: ${error.message}`);
    throw error;
  }
}

/**
 * Donne un kudos à une activité
 * @param {string} userId ID de l'utilisateur
 * @param {string} activityId ID de l'activité
 * @returns {Promise<boolean>} Succès de l'opération
 */
async function giveKudos(userId, activityId) {
  try {
    // Vérifier que l'activité existe
    const activity = await Activity.findById(activityId);
    if (!activity) {
      throw errorService.createError('Activité non trouvée', 404);
    }
    
    // Vérifier si l'utilisateur a déjà donné un kudos
    if (activity.kudos && activity.kudos.includes(userId)) {
      return false; // Déjà donné un kudos
    }
    
    // Ajouter le kudos
    activity.kudos = activity.kudos || [];
    activity.kudos.push(userId);
    await activity.save();
    
    // Créer une activité de type kudos
    await createActivity(userId, ACTIVITY_TYPES.KUDOS, {
      activityId
    });
    
    // Notifier le propriétaire de l'activité si ce n'est pas l'utilisateur lui-même
    if (notificationService && activity.userId.toString() !== userId) {
      await notificationService.sendNotification(
        activity.userId,
        'Nouveau kudos',
        `Quelqu'un a aimé votre activité`,
        {
          type: 'kudos',
          activityId: activity._id
        }
      );
    }
    
    return true;
  } catch (error) {
    logger.error(`Erreur lors de l'ajout d'un kudos: ${error.message}`);
    throw error;
  }
}

/**
 * Retire un kudos d'une activité
 * @param {string} userId ID de l'utilisateur
 * @param {string} activityId ID de l'activité
 * @returns {Promise<boolean>} Succès de l'opération
 */
async function removeKudos(userId, activityId) {
  try {
    // Mettre à jour l'activité en retirant le kudos
    const result = await Activity.updateOne(
      { _id: activityId, kudos: userId },
      { $pull: { kudos: userId } }
    );
    
    return result.modifiedCount > 0;
  } catch (error) {
    logger.error(`Erreur lors du retrait d'un kudos: ${error.message}`);
    throw error;
  }
}

/**
 * Récupère les événements à venir
 * @param {Object} options Options de pagination et de filtrage
 * @returns {Promise<Array>} Liste des événements
 */
async function getUpcomingEvents(options = {}) {
  try {
    const limit = options.limit || 10;
    const page = options.page || 1;
    const skip = (page - 1) * limit;
    
    // Récupérer les événements à venir
    const events = await Event.find({ 
      date: { $gte: new Date() }
    })
      .sort({ date: 1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'firstName lastName profilePicture')
      .lean();
    
    return events;
  } catch (error) {
    logger.error(`Erreur lors de la récupération des événements à venir: ${error.message}`);
    throw error;
  }
}

/**
 * Récupère les défis actifs
 * @param {Object} options Options de pagination et de filtrage
 * @returns {Promise<Array>} Liste des défis
 */
async function getActiveChallenges(options = {}) {
  try {
    const limit = options.limit || 10;
    const page = options.page || 1;
    const skip = (page - 1) * limit;
    
    const now = new Date();
    
    // Récupérer les défis actifs
    const challenges = await Challenge.find({
      startDate: { $lte: now },
      endDate: { $gte: now }
    })
      .sort({ endDate: 1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'firstName lastName profilePicture')
      .lean();
    
    return challenges;
  } catch (error) {
    logger.error(`Erreur lors de la récupération des défis actifs: ${error.message}`);
    throw error;
  }
}

/**
 * Notifie les abonnés d'une nouvelle activité
 * @param {string} userId ID de l'utilisateur
 * @param {Object} activity Activité créée
 * @returns {Promise<void>}
 */
async function notifyFollowers(userId, activity) {
  try {
    // Récupérer les abonnés de l'utilisateur
    const user = await User.findById(userId);
    if (!user || !user.followers || user.followers.length === 0) {
      return;
    }
    
    // Préparer le message de notification en fonction du type d'activité
    let title, message;
    switch (activity.type) {
      case ACTIVITY_TYPES.RIDE:
        title = 'Nouvelle sortie';
        message = `${user.firstName} a partagé une nouvelle sortie`;
        break;
      case ACTIVITY_TYPES.EVENT_JOIN:
        title = 'Nouvel événement';
        message = `${user.firstName} participe à un événement`;
        break;
      case ACTIVITY_TYPES.ACHIEVEMENT:
        title = 'Nouvel accomplissement';
        message = `${user.firstName} a obtenu un nouvel accomplissement`;
        break;
      case ACTIVITY_TYPES.CHALLENGE_COMPLETION:
        title = 'Défi terminé';
        message = `${user.firstName} a terminé un défi`;
        break;
      default:
        title = 'Nouvelle activité';
        message = `${user.firstName} a une nouvelle activité`;
    }
    
    // Envoyer des notifications à chaque abonné
    const promises = user.followers.map(followerId => {
      return notificationService.sendNotification(
        followerId,
        title,
        message,
        {
          type: 'activity',
          activityId: activity._id
        }
      );
    });
    
    await Promise.all(promises);
  } catch (error) {
    logger.warn(`Erreur lors de la notification des abonnés: ${error.message}`);
    // Ne pas propager l'erreur pour ne pas bloquer la création d'activité
  }
}

/**
 * Enregistre les routes d'API avec le gestionnaire d'API
 * @param {Object} apiManagerService Gestionnaire d'API
 */
async function _registerWithApiManager(apiManagerService) {
  if (!apiManagerService) {
    logger.warn('Gestionnaire d\'API non disponible pour le service communautaire');
    return;
  }
  
  // Enregistrer les routes
  apiManagerService.registerRoutes([
    {
      method: 'GET',
      path: '/api/community/activity-feed',
      handler: async (req, res) => {
        try {
          const userId = req.user.id;
          const options = {
            limit: parseInt(req.query.limit) || ACTIVITY_FEED_DEFAULT_LIMIT,
            page: parseInt(req.query.page) || 1
          };
          
          const activities = await getActivityFeed(userId, options);
          res.json(activities);
        } catch (error) {
          apiManagerService.handleError(error, req, res);
        }
      },
      middleware: ['auth']
    },
    {
      method: 'POST',
      path: '/api/community/activity',
      handler: async (req, res) => {
        try {
          const userId = req.user.id;
          const { type, data } = req.body;
          
          const activity = await createActivity(userId, type, data);
          res.status(201).json(activity);
        } catch (error) {
          apiManagerService.handleError(error, req, res);
        }
      },
      middleware: ['auth']
    },
    {
      method: 'POST',
      path: '/api/community/activity/:activityId/comment',
      handler: async (req, res) => {
        try {
          const userId = req.user.id;
          const { activityId } = req.params;
          const { content } = req.body;
          
          const comment = await addComment(userId, activityId, content);
          res.status(201).json(comment);
        } catch (error) {
          apiManagerService.handleError(error, req, res);
        }
      },
      middleware: ['auth']
    },
    {
      method: 'POST',
      path: '/api/community/activity/:activityId/kudos',
      handler: async (req, res) => {
        try {
          const userId = req.user.id;
          const { activityId } = req.params;
          
          const result = await giveKudos(userId, activityId);
          res.json({ success: result });
        } catch (error) {
          apiManagerService.handleError(error, req, res);
        }
      },
      middleware: ['auth']
    },
    {
      method: 'DELETE',
      path: '/api/community/activity/:activityId/kudos',
      handler: async (req, res) => {
        try {
          const userId = req.user.id;
          const { activityId } = req.params;
          
          const result = await removeKudos(userId, activityId);
          res.json({ success: result });
        } catch (error) {
          apiManagerService.handleError(error, req, res);
        }
      },
      middleware: ['auth']
    },
    {
      method: 'GET',
      path: '/api/community/events',
      handler: async (req, res) => {
        try {
          const options = {
            limit: parseInt(req.query.limit) || 10,
            page: parseInt(req.query.page) || 1
          };
          
          const events = await getUpcomingEvents(options);
          res.json(events);
        } catch (error) {
          apiManagerService.handleError(error, req, res);
        }
      },
      middleware: ['auth']
    },
    {
      method: 'GET',
      path: '/api/community/challenges',
      handler: async (req, res) => {
        try {
          const options = {
            limit: parseInt(req.query.limit) || 10,
            page: parseInt(req.query.page) || 1
          };
          
          const challenges = await getActiveChallenges(options);
          res.json(challenges);
        } catch (error) {
          apiManagerService.handleError(error, req, res);
        }
      },
      middleware: ['auth']
    }
  ]);
  
  logger.info('Routes du service communautaire enregistrées avec succès');
}

/**
 * Vérifie l'état de santé du service
 * @returns {Promise<Object>} État de santé
 */
async function getHealth() {
  try {
    // Vérifier la connexion à la base de données
    const isDbConnected = mongoose.connection.readyState === 1;
    
    return {
      status: isDbConnected ? 'healthy' : 'degraded',
      details: {
        database: isDbConnected ? 'connected' : 'disconnected',
        dependencies: {
          notification: notificationService ? 'available' : 'unavailable',
          cache: cacheService ? 'available' : 'unavailable'
        }
      }
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
}

module.exports = {
  init,
  setNotificationService,
  setErrorService,
  setCacheService,
  setApiManager,
  getActivityFeed,
  createActivity,
  addComment,
  giveKudos,
  removeKudos,
  getUpcomingEvents,
  getActiveChallenges,
  _registerWithApiManager,
  getHealth,
  ACTIVITY_TYPES
};
