/**
 * Service de modération des avis
 * Gère la modération automatique et manuelle des avis signalés
 */
const mongoose = require('mongoose');
const logger = require('../utils/logger');
const cacheService = require('./cache.service').getInstance();
const errorService = require('./error.service').getInstance();
const notificationService = require('./notification.service').getInstance();

class ReviewModerationService {
  constructor() {
    this.RouteReview = mongoose.model('RouteReview');
    this.User = mongoose.model('User');
    this.initialized = false;
    this.CACHE_NAMESPACE = 'review_moderation';
    this.CACHE_TTL = 3600; // 1 heure
    
    // Seuils de modération
    this.FLAG_THRESHOLD = 3; // Nombre de signalements avant modération automatique
    this.BANNED_WORDS = []; // Mots interdits (à charger depuis la base de données)
  }

  /**
   * Initialise le service
   */
  async initialize() {
    try {
      // Vérifier que les modèles sont chargés
      if (!mongoose.modelNames().includes('RouteReview')) {
        this.RouteReview = require('../models/route-review.model');
      }
      
      if (!mongoose.modelNames().includes('User')) {
        this.User = require('../models/user.model');
      }
      
      // Charger les mots interdits depuis la base de données ou un fichier de configuration
      await this._loadBannedWords();
      
      this.initialized = true;
      logger.info('Service de modération des avis initialisé');
      return true;
    } catch (error) {
      logger.error(`Erreur lors de l'initialisation du service de modération: ${error.message}`);
      return false;
    }
  }

  /**
   * Charge la liste des mots interdits
   * @private
   */
  async _loadBannedWords() {
    try {
      // Ici, on pourrait charger les mots interdits depuis une collection MongoDB
      // Pour l'exemple, on utilise une liste statique
      this.BANNED_WORDS = [
        'insulte', 'grossier', 'obscène', 'raciste', 'haineux', 'violent',
        'spam', 'publicité', 'arnaque', 'escroquerie'
      ];
      
      logger.debug(`${this.BANNED_WORDS.length} mots interdits chargés`);
    } catch (error) {
      logger.error(`Erreur lors du chargement des mots interdits: ${error.message}`);
      this.BANNED_WORDS = [];
    }
  }

  /**
   * Vérifie si un avis contient des mots interdits
   * @param {string} text - Texte à vérifier
   * @returns {boolean} Vrai si le texte contient des mots interdits
   * @private
   */
  _containsBannedWords(text) {
    if (!text) return false;
    
    const lowerText = text.toLowerCase();
    return this.BANNED_WORDS.some(word => lowerText.includes(word.toLowerCase()));
  }

  /**
   * Traite un avis signalé
   * @param {string} reviewId - ID de l'avis
   * @param {string} reporterId - ID de l'utilisateur qui signale
   * @param {string} reason - Raison du signalement
   * @returns {Promise<Object>} Résultat du traitement
   */
  async processReportedReview(reviewId, reporterId, reason) {
    if (!this.initialized) await this.initialize();
    
    try {
      // Récupérer l'avis
      const review = await this.RouteReview.findById(reviewId);
      if (!review) {
        throw new Error('Avis non trouvé');
      }
      
      // Vérifier si l'utilisateur a déjà signalé cet avis
      if (review.flaggedBy.includes(reporterId)) {
        return {
          success: false,
          message: 'Vous avez déjà signalé cet avis',
          moderated: false
        };
      }
      
      // Ajouter le signalement
      review.flags += 1;
      review.flaggedBy.push(reporterId);
      
      // Enregistrer les détails du signalement
      if (!review.flagDetails) review.flagDetails = [];
      review.flagDetails.push({
        user: reporterId,
        reason: reason || 'Non spécifié',
        date: new Date()
      });
      
      // Vérifier si l'avis doit être modéré automatiquement
      let autoModerated = false;
      
      // 1. Vérifier le nombre de signalements
      if (review.flags >= this.FLAG_THRESHOLD) {
        autoModerated = true;
        review.hidden = true;
        review.moderationStatus = 'pending';
        review.moderationNote = `Masqué automatiquement après ${review.flags} signalements`;
      }
      
      // 2. Vérifier le contenu pour des mots interdits
      if (!autoModerated && review.comment && this._containsBannedWords(review.comment)) {
        autoModerated = true;
        review.hidden = true;
        review.moderationStatus = 'pending';
        review.moderationNote = 'Masqué automatiquement pour contenu inapproprié';
      }
      
      // Enregistrer les modifications
      await review.save();
      
      // Notifier les administrateurs si l'avis a été modéré automatiquement
      if (autoModerated) {
        await this._notifyAdminsAboutModeration(review, reason);
      }
      
      return {
        success: true,
        message: 'Signalement traité avec succès',
        moderated: autoModerated,
        review: {
          id: review._id,
          flags: review.flags,
          hidden: review.hidden,
          moderationStatus: review.moderationStatus
        }
      };
    } catch (error) {
      logger.error(`Erreur lors du traitement d'un avis signalé: ${error.message}`);
      throw errorService.createError(
        'MODERATION_ERROR',
        'Erreur lors du traitement du signalement',
        { details: error.message }
      );
    }
  }

  /**
   * Notifie les administrateurs d'un avis modéré automatiquement
   * @param {Object} review - Avis modéré
   * @param {string} reason - Raison du signalement
   * @private
   */
  async _notifyAdminsAboutModeration(review, reason) {
    try {
      // Récupérer les administrateurs
      const admins = await this.User.find({ isAdmin: true }).select('_id email');
      
      if (!admins.length) {
        logger.warn('Aucun administrateur trouvé pour la notification de modération');
        return;
      }
      
      // Préparer la notification
      const notification = {
        type: 'review_moderation',
        title: 'Avis modéré automatiquement',
        message: `Un avis a été masqué automatiquement après ${review.flags} signalements.`,
        data: {
          reviewId: review._id,
          routeId: review.route,
          userId: review.user,
          flags: review.flags,
          reason: reason || 'Non spécifié'
        },
        priority: 'medium',
        recipients: admins.map(admin => admin._id)
      };
      
      // Envoyer la notification
      await notificationService.sendNotification(notification);
      
      logger.info(`Notification de modération envoyée à ${admins.length} administrateurs`);
    } catch (error) {
      logger.error(`Erreur lors de la notification des administrateurs: ${error.message}`);
    }
  }

  /**
   * Modère manuellement un avis
   * @param {string} reviewId - ID de l'avis
   * @param {string} adminId - ID de l'administrateur
   * @param {Object} action - Action de modération
   * @returns {Promise<Object>} Résultat de la modération
   */
  async moderateReview(reviewId, adminId, action) {
    if (!this.initialized) await this.initialize();
    
    try {
      // Récupérer l'avis
      const review = await this.RouteReview.findById(reviewId);
      if (!review) {
        throw new Error('Avis non trouvé');
      }
      
      // Appliquer l'action de modération
      switch (action.type) {
        case 'approve':
          // Approuver l'avis (le rendre visible)
          review.hidden = false;
          review.moderationStatus = 'approved';
          review.moderationNote = action.note || 'Approuvé par un modérateur';
          review.moderatedBy = adminId;
          review.moderatedAt = new Date();
          break;
          
        case 'reject':
          // Rejeter l'avis (le maintenir caché)
          review.hidden = true;
          review.moderationStatus = 'rejected';
          review.moderationNote = action.note || 'Rejeté par un modérateur';
          review.moderatedBy = adminId;
          review.moderatedAt = new Date();
          break;
          
        case 'delete':
          // Supprimer l'avis
          await this.RouteReview.findByIdAndDelete(reviewId);
          return {
            success: true,
            message: 'Avis supprimé avec succès',
            action: 'delete'
          };
          
        case 'edit':
          // Modifier le contenu de l'avis
          if (action.content) {
            review.comment = action.content;
          }
          review.hidden = false;
          review.moderationStatus = 'edited';
          review.moderationNote = action.note || 'Modifié par un modérateur';
          review.moderatedBy = adminId;
          review.moderatedAt = new Date();
          break;
          
        default:
          throw new Error('Action de modération non reconnue');
      }
      
      // Enregistrer les modifications
      await review.save();
      
      // Notifier l'utilisateur de la modération
      if (action.notifyUser !== false) {
        await this._notifyUserAboutModeration(review, action);
      }
      
      return {
        success: true,
        message: 'Modération effectuée avec succès',
        action: action.type,
        review: {
          id: review._id,
          hidden: review.hidden,
          moderationStatus: review.moderationStatus
        }
      };
    } catch (error) {
      logger.error(`Erreur lors de la modération d'un avis: ${error.message}`);
      throw errorService.createError(
        'MODERATION_ERROR',
        'Erreur lors de la modération de l\'avis',
        { details: error.message }
      );
    }
  }

  /**
   * Notifie l'utilisateur de la modération de son avis
   * @param {Object} review - Avis modéré
   * @param {Object} action - Action de modération
   * @private
   */
  async _notifyUserAboutModeration(review, action) {
    try {
      // Préparer la notification
      const notification = {
        type: 'review_moderation',
        title: 'Votre avis a été modéré',
        message: this._getModerationMessage(action),
        data: {
          reviewId: review._id,
          routeId: review.route,
          action: action.type
        },
        priority: 'low',
        recipients: [review.user]
      };
      
      // Envoyer la notification
      await notificationService.sendNotification(notification);
      
      logger.info(`Notification de modération envoyée à l'utilisateur ${review.user}`);
    } catch (error) {
      logger.error(`Erreur lors de la notification de l'utilisateur: ${error.message}`);
    }
  }

  /**
   * Génère un message de modération pour l'utilisateur
   * @param {Object} action - Action de modération
   * @returns {string} Message
   * @private
   */
  _getModerationMessage(action) {
    switch (action.type) {
      case 'approve':
        return 'Votre avis a été approuvé par nos modérateurs et est désormais visible.';
      case 'reject':
        return 'Votre avis a été rejeté par nos modérateurs car il ne respecte pas nos règles de communauté.';
      case 'edit':
        return 'Votre avis a été modifié par nos modérateurs pour respecter nos règles de communauté.';
      case 'delete':
        return 'Votre avis a été supprimé par nos modérateurs car il ne respecte pas nos règles de communauté.';
      default:
        return 'Votre avis a été examiné par nos modérateurs.';
    }
  }

  /**
   * Récupère les avis en attente de modération
   * @param {Object} options - Options de pagination et tri
   * @returns {Promise<Object>} Avis en attente de modération
   */
  async getPendingReviews(options = {}) {
    if (!this.initialized) await this.initialize();
    
    try {
      // Options de pagination
      const skip = options.skip || 0;
      const limit = options.limit || 20;
      const sort = options.sort || { flags: -1, createdAt: -1 };
      
      // Récupérer les avis en attente
      const reviews = await this.RouteReview.find({
        $or: [
          { moderationStatus: 'pending' },
          { flags: { $gte: this.FLAG_THRESHOLD } }
        ]
      })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('user', 'firstName lastName email profilePicture')
      .populate('route', 'name')
      .lean();
      
      // Compter le nombre total
      const total = await this.RouteReview.countDocuments({
        $or: [
          { moderationStatus: 'pending' },
          { flags: { $gte: this.FLAG_THRESHOLD } }
        ]
      });
      
      return {
        data: reviews,
        pagination: {
          total,
          skip,
          limit,
          pages: Math.ceil(total / limit),
          currentPage: Math.floor(skip / limit) + 1
        },
        meta: {
          flagThreshold: this.FLAG_THRESHOLD,
          timestamp: new Date()
        }
      };
    } catch (error) {
      logger.error(`Erreur lors de la récupération des avis en attente de modération: ${error.message}`);
      throw errorService.createError(
        'MODERATION_ERROR',
        'Erreur lors de la récupération des avis en attente de modération',
        { details: error.message }
      );
    }
  }

  /**
   * Récupère l'historique des modérations
   * @param {Object} options - Options de pagination et tri
   * @returns {Promise<Object>} Historique des modérations
   */
  async getModerationHistory(options = {}) {
    if (!this.initialized) await this.initialize();
    
    try {
      // Options de pagination
      const skip = options.skip || 0;
      const limit = options.limit || 20;
      const sort = options.sort || { moderatedAt: -1 };
      
      // Récupérer les avis modérés
      const reviews = await this.RouteReview.find({
        moderationStatus: { $in: ['approved', 'rejected', 'edited'] },
        moderatedAt: { $exists: true }
      })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('user', 'firstName lastName email')
      .populate('moderatedBy', 'firstName lastName email')
      .populate('route', 'name')
      .lean();
      
      // Compter le nombre total
      const total = await this.RouteReview.countDocuments({
        moderationStatus: { $in: ['approved', 'rejected', 'edited'] },
        moderatedAt: { $exists: true }
      });
      
      return {
        data: reviews,
        pagination: {
          total,
          skip,
          limit,
          pages: Math.ceil(total / limit),
          currentPage: Math.floor(skip / limit) + 1
        }
      };
    } catch (error) {
      logger.error(`Erreur lors de la récupération de l'historique des modérations: ${error.message}`);
      throw errorService.createError(
        'MODERATION_ERROR',
        'Erreur lors de la récupération de l\'historique des modérations',
        { details: error.message }
      );
    }
  }

  /**
   * Obtient l'état de santé du service
   * @returns {Object} État de santé
   */
  async getHealth() {
    return {
      status: this.initialized ? 'healthy' : 'degraded',
      initialized: this.initialized,
      bannedWordsCount: this.BANNED_WORDS.length,
      flagThreshold: this.FLAG_THRESHOLD,
      timestamp: new Date().toISOString()
    };
  }
}

// Singleton
let instance = null;

/**
 * Obtient l'instance du service
 * @returns {ReviewModerationService} Instance du service
 */
module.exports.getInstance = () => {
  if (!instance) {
    instance = new ReviewModerationService();
  }
  return instance;
};

module.exports.ReviewModerationService = ReviewModerationService;
