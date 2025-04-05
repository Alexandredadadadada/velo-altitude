/**
 * Contrôleur pour les fonctionnalités sociales
 * Gère les interactions entre utilisateurs, partage d'activités et fil d'actualités
 */

const socialService = require('../services/social.service');
const logger = require('../utils/logger');

/**
 * Crée une connexion (following) entre deux utilisateurs
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const followUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { targetUserId } = req.body;
    
    if (!targetUserId) {
      return res.status(400).json({
        status: 'error',
        message: 'ID de l\'utilisateur cible requis'
      });
    }
    
    // Vérifier que l'utilisateur authentifié est autorisé à effectuer cette action
    if (req.user.id !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Vous n\'êtes pas autorisé à effectuer cette action'
      });
    }
    
    const result = await socialService.createConnection(userId, targetUserId);
    
    if (!result.success) {
      return res.status(400).json({
        status: 'error',
        message: result.error
      });
    }
    
    res.status(201).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    logger.error(`[SocialController] Erreur lors du suivi d'un utilisateur: ${error.message}`);
    
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors du suivi de l\'utilisateur',
      error: error.message
    });
  }
};

/**
 * Supprime une connexion entre deux utilisateurs
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const unfollowUser = async (req, res) => {
  try {
    const { userId, targetUserId } = req.params;
    
    // Vérifier que l'utilisateur authentifié est autorisé à effectuer cette action
    if (req.user.id !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Vous n\'êtes pas autorisé à effectuer cette action'
      });
    }
    
    const result = await socialService.removeConnection(userId, targetUserId);
    
    if (!result.success) {
      return res.status(400).json({
        status: 'error',
        message: result.error
      });
    }
    
    res.json({
      status: 'success',
      data: result
    });
  } catch (error) {
    logger.error(`[SocialController] Erreur lors du retrait du suivi d'un utilisateur: ${error.message}`);
    
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors du retrait du suivi de l\'utilisateur',
      error: error.message
    });
  }
};

/**
 * Récupère la liste des utilisateurs suivis
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const following = await socialService.getFollowing(userId);
    
    res.json({
      status: 'success',
      data: {
        userId,
        following,
        count: following.length
      }
    });
  } catch (error) {
    logger.error(`[SocialController] Erreur lors de la récupération des abonnements: ${error.message}`);
    
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération des abonnements',
      error: error.message
    });
  }
};

/**
 * Récupère la liste des abonnés
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const followers = await socialService.getFollowers(userId);
    
    res.json({
      status: 'success',
      data: {
        userId,
        followers,
        count: followers.length
      }
    });
  } catch (error) {
    logger.error(`[SocialController] Erreur lors de la récupération des abonnés: ${error.message}`);
    
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération des abonnés',
      error: error.message
    });
  }
};

/**
 * Partage une activité
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const shareActivity = async (req, res) => {
  try {
    const { userId } = req.params;
    const { activityId, privacy, targetUserIds } = req.body;
    
    if (!activityId) {
      return res.status(400).json({
        status: 'error',
        message: 'ID de l\'activité requis'
      });
    }
    
    // Vérifier que l'utilisateur authentifié est autorisé à effectuer cette action
    if (req.user.id !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Vous n\'êtes pas autorisé à effectuer cette action'
      });
    }
    
    const result = await socialService.shareActivity(userId, activityId, { privacy, targetUserIds });
    
    if (!result.success) {
      return res.status(400).json({
        status: 'error',
        message: result.error
      });
    }
    
    res.status(201).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    logger.error(`[SocialController] Erreur lors du partage d'activité: ${error.message}`);
    
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors du partage de l\'activité',
      error: error.message
    });
  }
};

/**
 * Ajoute un commentaire sur une activité partagée
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const addComment = async (req, res) => {
  try {
    const { shareId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;
    
    if (!content) {
      return res.status(400).json({
        status: 'error',
        message: 'Contenu du commentaire requis'
      });
    }
    
    const result = await socialService.addComment(shareId, userId, content);
    
    if (!result.success) {
      return res.status(400).json({
        status: 'error',
        message: result.error
      });
    }
    
    res.status(201).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    logger.error(`[SocialController] Erreur lors de l'ajout d'un commentaire: ${error.message}`);
    
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de l\'ajout du commentaire',
      error: error.message
    });
  }
};

/**
 * Ajoute un kudo (j'aime) sur une activité partagée
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const addKudo = async (req, res) => {
  try {
    const { shareId } = req.params;
    const userId = req.user.id;
    
    const result = await socialService.addKudo(shareId, userId);
    
    if (!result.success) {
      return res.status(400).json({
        status: 'error',
        message: result.error
      });
    }
    
    res.status(201).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    logger.error(`[SocialController] Erreur lors de l'ajout d'un kudo: ${error.message}`);
    
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de l\'ajout du kudo',
      error: error.message
    });
  }
};

/**
 * Récupère le fil d'activités
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const getFeed = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit, offset, filter } = req.query;
    
    // Vérifier que l'utilisateur authentifié est autorisé à effectuer cette action
    if (req.user.id !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Vous n\'êtes pas autorisé à effectuer cette action'
      });
    }
    
    const result = await socialService.getFeed(userId, {
      limit: limit ? parseInt(limit) : 20,
      offset: offset ? parseInt(offset) : 0,
      filter
    });
    
    if (!result.success) {
      return res.status(400).json({
        status: 'error',
        message: result.error
      });
    }
    
    res.json({
      status: 'success',
      data: result
    });
  } catch (error) {
    logger.error(`[SocialController] Erreur lors de la récupération du fil d'activités: ${error.message}`);
    
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération du fil d\'activités',
      error: error.message
    });
  }
};

/**
 * Recherche des utilisateurs
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.status(400).json({
        status: 'error',
        message: 'Terme de recherche invalide (minimum 2 caractères)'
      });
    }
    
    const result = await socialService.searchUsers(query);
    
    if (!result.success) {
      return res.status(400).json({
        status: 'error',
        message: result.error
      });
    }
    
    res.json({
      status: 'success',
      data: result
    });
  } catch (error) {
    logger.error(`[SocialController] Erreur lors de la recherche d'utilisateurs: ${error.message}`);
    
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la recherche d\'utilisateurs',
      error: error.message
    });
  }
};

/**
 * Récupère les statistiques sociales d'un utilisateur
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const getUserSocialStats = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await socialService.getUserSocialStats(userId);
    
    if (!result.success) {
      return res.status(400).json({
        status: 'error',
        message: result.error
      });
    }
    
    res.json({
      status: 'success',
      data: result
    });
  } catch (error) {
    logger.error(`[SocialController] Erreur lors de la récupération des statistiques: ${error.message}`);
    
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
};

module.exports = {
  followUser,
  unfollowUser,
  getFollowing,
  getFollowers,
  shareActivity,
  addComment,
  addKudo,
  getFeed,
  searchUsers,
  getUserSocialStats
};
