/**
 * Service pour les fonctionnalités sociales du Dashboard Cycliste Européen
 * Gère les connexions entre utilisateurs, partage d'activités, et interactions sociales
 */

const NodeCache = require('node-cache');
const logger = require('../utils/logger');
const ApiManagerService = require('./api-manager.service');

class SocialService {
  constructor() {
    // Cache pour stocker les données temporaires
    this.cache = new NodeCache({ 
      stdTTL: 3600, // 1 heure de cache par défaut
      checkperiod: 600 // Vérification toutes les 10 minutes
    });
    
    this.apiManager = new ApiManagerService();
    
    // Format de stockage interne pour les connexions
    this.connectionsMap = {};
    this.activityShares = {};
    this.comments = {};
    this.kudos = {};
  }

  /**
   * Crée une connexion entre deux utilisateurs (following/follower)
   * @param {string} userId - ID de l'utilisateur qui initie la connexion
   * @param {string} targetUserId - ID de l'utilisateur cible
   * @returns {Object} Statut de la connexion
   */
  async createConnection(userId, targetUserId) {
    try {
      if (userId === targetUserId) {
        return { 
          success: false, 
          error: "Un utilisateur ne peut pas se suivre lui-même" 
        };
      }

      // Initialiser les tableaux de connexions si nécessaire
      if (!this.connectionsMap[userId]) {
        this.connectionsMap[userId] = { following: [], followers: [] };
      }
      
      if (!this.connectionsMap[targetUserId]) {
        this.connectionsMap[targetUserId] = { following: [], followers: [] };
      }
      
      // Vérifier si la connexion existe déjà
      if (this.connectionsMap[userId].following.includes(targetUserId)) {
        return { 
          success: false, 
          error: "Connexion déjà existante" 
        };
      }
      
      // Créer la connexion bidirectionnelle
      this.connectionsMap[userId].following.push(targetUserId);
      this.connectionsMap[targetUserId].followers.push(userId);
      
      logger.info(`[SocialService] Connexion créée: ${userId} suit ${targetUserId}`);
      
      return {
        success: true,
        userId,
        targetUserId,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`[SocialService] Erreur lors de la création de connexion: ${error.message}`);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }
  
  /**
   * Supprime une connexion entre deux utilisateurs
   * @param {string} userId - ID de l'utilisateur qui initie la déconnexion
   * @param {string} targetUserId - ID de l'utilisateur cible
   * @returns {Object} Statut de l'opération
   */
  async removeConnection(userId, targetUserId) {
    try {
      if (!this.connectionsMap[userId] || !this.connectionsMap[targetUserId]) {
        return { 
          success: false, 
          error: "Connexion inexistante" 
        };
      }
      
      // Filtrer les connexions pour supprimer la relation
      this.connectionsMap[userId].following = this.connectionsMap[userId].following
        .filter(id => id !== targetUserId);
        
      this.connectionsMap[targetUserId].followers = this.connectionsMap[targetUserId].followers
        .filter(id => id !== userId);
      
      logger.info(`[SocialService] Connexion supprimée: ${userId} ne suit plus ${targetUserId}`);
      
      return {
        success: true,
        userId,
        targetUserId,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`[SocialService] Erreur lors de la suppression de connexion: ${error.message}`);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }
  
  /**
   * Récupère la liste des utilisateurs suivis par un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Array} Liste des utilisateurs suivis
   */
  async getFollowing(userId) {
    try {
      if (!this.connectionsMap[userId]) {
        return [];
      }
      
      return this.connectionsMap[userId].following;
    } catch (error) {
      logger.error(`[SocialService] Erreur lors de la récupération des abonnements: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Récupère la liste des utilisateurs qui suivent un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Array} Liste des abonnés
   */
  async getFollowers(userId) {
    try {
      if (!this.connectionsMap[userId]) {
        return [];
      }
      
      return this.connectionsMap[userId].followers;
    } catch (error) {
      logger.error(`[SocialService] Erreur lors de la récupération des abonnés: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Partage une activité avec d'autres utilisateurs ou publiquement
   * @param {string} userId - ID de l'utilisateur qui partage
   * @param {string} activityId - ID de l'activité partagée
   * @param {Object} options - Options de partage (niveau de confidentialité, utilisateurs spécifiques)
   * @returns {Object} Statut du partage
   */
  async shareActivity(userId, activityId, options = {}) {
    try {
      const { privacy = 'followers', targetUserIds = [] } = options;
      
      // Vérifier que l'utilisateur possède cette activité (à implémenter avec DB)
      
      const shareId = `share_${Date.now()}_${userId}_${activityId}`;
      
      this.activityShares[shareId] = {
        userId,
        activityId,
        privacy,
        targetUserIds,
        timestamp: new Date().toISOString(),
        comments: [],
        kudos: []
      };
      
      logger.info(`[SocialService] Activité partagée: ${activityId} par ${userId}`);
      
      return {
        success: true,
        shareId,
        userId,
        activityId,
        privacy,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`[SocialService] Erreur lors du partage d'activité: ${error.message}`);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }
  
  /**
   * Ajoute un commentaire sur une activité partagée
   * @param {string} shareId - ID du partage
   * @param {string} userId - ID de l'utilisateur qui commente
   * @param {string} content - Contenu du commentaire
   * @returns {Object} Commentaire créé
   */
  async addComment(shareId, userId, content) {
    try {
      if (!this.activityShares[shareId]) {
        return { 
          success: false, 
          error: "Partage inexistant" 
        };
      }
      
      const commentId = `comment_${Date.now()}_${userId}`;
      
      const comment = {
        id: commentId,
        shareId,
        userId,
        content,
        timestamp: new Date().toISOString()
      };
      
      if (!this.activityShares[shareId].comments) {
        this.activityShares[shareId].comments = [];
      }
      
      this.activityShares[shareId].comments.push(comment);
      this.comments[commentId] = comment;
      
      logger.info(`[SocialService] Commentaire ajouté sur ${shareId} par ${userId}`);
      
      return {
        success: true,
        ...comment
      };
    } catch (error) {
      logger.error(`[SocialService] Erreur lors de l'ajout d'un commentaire: ${error.message}`);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }
  
  /**
   * Ajoute un kudo (j'aime) sur une activité partagée
   * @param {string} shareId - ID du partage
   * @param {string} userId - ID de l'utilisateur qui ajoute le kudo
   * @returns {Object} Statut de l'opération
   */
  async addKudo(shareId, userId) {
    try {
      if (!this.activityShares[shareId]) {
        return { 
          success: false, 
          error: "Partage inexistant" 
        };
      }
      
      const kudoId = `kudo_${Date.now()}_${userId}`;
      
      const kudo = {
        id: kudoId,
        shareId,
        userId,
        timestamp: new Date().toISOString()
      };
      
      if (!this.activityShares[shareId].kudos) {
        this.activityShares[shareId].kudos = [];
      }
      
      // Vérifier si l'utilisateur a déjà ajouté un kudo
      const existingKudo = this.activityShares[shareId].kudos
        .find(k => k.userId === userId);
        
      if (existingKudo) {
        return { 
          success: false, 
          error: "Kudo déjà ajouté par cet utilisateur" 
        };
      }
      
      this.activityShares[shareId].kudos.push(kudo);
      this.kudos[kudoId] = kudo;
      
      logger.info(`[SocialService] Kudo ajouté sur ${shareId} par ${userId}`);
      
      return {
        success: true,
        ...kudo
      };
    } catch (error) {
      logger.error(`[SocialService] Erreur lors de l'ajout d'un kudo: ${error.message}`);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }
  
  /**
   * Récupère le fil d'activités social pour un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} options - Options de pagination et filtrage
   * @returns {Array} Fil d'activités
   */
  async getFeed(userId, options = {}) {
    try {
      const { limit = 20, offset = 0, filter = 'all' } = options;
      
      // Récupérer la liste des utilisateurs suivis
      const following = await this.getFollowing(userId);
      following.push(userId); // Inclure ses propres activités
      
      // Collecter toutes les activités partagées pertinentes
      const relevantShares = Object.values(this.activityShares)
        .filter(share => {
          // Appliquer les filtres de confidentialité
          if (share.userId === userId) return true; // Ses propres partages
          if (share.privacy === 'public') return true; // Partages publics
          if (share.privacy === 'followers' && following.includes(share.userId)) return true; // Partages des suivis
          if (share.privacy === 'specific' && share.targetUserIds.includes(userId)) return true; // Partages spécifiques
          return false;
        })
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) // Tri par date décroissante
        .slice(offset, offset + limit); // Pagination
      
      // Enrichir les données avec informations complètes
      const feedItems = [];
      for (const share of relevantShares) {
        // Ici nous simulons l'enrichissement des données
        // Dans un environnement réel, ces données viendraient de la base de données
        feedItems.push({
          ...share,
          activityDetails: {}, // À remplir avec les détails de l'activité
          userDetails: {}, // À remplir avec les détails de l'utilisateur
          commentCount: share.comments ? share.comments.length : 0,
          kudoCount: share.kudos ? share.kudos.length : 0
        });
      }
      
      return {
        success: true,
        items: feedItems,
        pagination: {
          limit,
          offset,
          total: Object.values(this.activityShares).length // Approximatif, à affiner dans une implémentation réelle
        }
      };
    } catch (error) {
      logger.error(`[SocialService] Erreur lors de la récupération du fil d'activités: ${error.message}`);
      return { 
        success: false, 
        error: error.message,
        items: []
      };
    }
  }
  
  /**
   * Recherche des utilisateurs par nom ou autres critères
   * @param {string} query - Terme de recherche
   * @param {Object} options - Options de recherche
   * @returns {Array} Utilisateurs correspondants
   */
  async searchUsers(query, options = {}) {
    // Cette méthode serait implémentée avec une recherche dans la base de données
    // Nous renvoyons des données fictives pour cette simulation
    return {
      success: true,
      users: [
        { id: "user1", name: "Thomas Lefort", followersCount: 12, followingCount: 5 },
        { id: "user2", name: "Sophie Martin", followersCount: 28, followingCount: 15 },
        { id: "user3", name: "Michael Schmitt", followersCount: 45, followingCount: 20 }
      ]
    };
  }
  
  /**
   * Récupère les statistiques sociales d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Object} Statistiques sociales
   */
  async getUserSocialStats(userId) {
    try {
      const followers = await this.getFollowers(userId) || [];
      const following = await this.getFollowing(userId) || [];
      
      // Calculer le nombre d'activités partagées par l'utilisateur
      const userShares = Object.values(this.activityShares)
        .filter(share => share.userId === userId);
      
      // Calculer le nombre total de kudos reçus
      const totalKudos = userShares.reduce((total, share) => {
        return total + (share.kudos ? share.kudos.length : 0);
      }, 0);
      
      // Calculer le nombre total de commentaires reçus
      const totalComments = userShares.reduce((total, share) => {
        return total + (share.comments ? share.comments.length : 0);
      }, 0);
      
      return {
        success: true,
        userId,
        stats: {
          followersCount: followers.length,
          followingCount: following.length,
          activitiesSharedCount: userShares.length,
          totalKudosReceived: totalKudos,
          totalCommentsReceived: totalComments,
          lastActivityDate: userShares.length > 0 
            ? userShares.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0].timestamp 
            : null
        }
      };
    } catch (error) {
      logger.error(`[SocialService] Erreur lors de la récupération des statistiques sociales: ${error.message}`);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }
}

module.exports = new SocialService();
