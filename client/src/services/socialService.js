/**
 * Service pour la gestion des fonctionnalités sociales
 * Utilise apiWrapper qui a été mis à jour pour fonctionner avec MSW en mode développement.
 */
import api from './apiWrapper';
import { handleApiError } from '../utils/apiErrorUtils';

const SocialService = {
  /**
   * Récupère les posts du fil d'actualité
   * @param {Object} options - Options de filtrage
   * @returns {Promise<Array>} Liste des posts
   */
  getFeedPosts: async (options = {}) => {
    try {
      // Construire les paramètres de requête
      const params = new URLSearchParams();
      if (options.filter && options.filter !== 'all') {
        params.append('type', options.filter);
      }
      
      // Appel API
      const response = await api.get(`/social/posts${params.toString() ? `?${params.toString()}` : ''}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching feed posts:', error);
      throw error;
    }
  },
  
  /**
   * Crée un nouveau post
   * @param {Object} postData - Données du post
   * @returns {Promise<Object>} Post créé
   */
  createPost: async (postData) => {
    try {
      // Appel API
      const response = await api.post('/social/posts', postData);
      return response.data;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  },
  
  /**
   * Récupère les commentaires d'un post
   * @param {string} postId - ID du post
   * @returns {Promise<Array>} Liste des commentaires
   */
  getComments: async (postId) => {
    try {
      // Appel API
      const response = await api.get(`/social/posts/${postId}/comments`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching comments for post ${postId}:`, error);
      throw error;
    }
  },
  
  /**
   * Ajoute un commentaire à un post
   * @param {string} postId - ID du post
   * @param {string} content - Contenu du commentaire
   * @returns {Promise<Object>} Commentaire créé
   */
  addComment: async (postId, content) => {
    try {
      // Appel API
      const response = await api.post(`/social/posts/${postId}/comments`, { content });
      return response.data;
    } catch (error) {
      console.error(`Error adding comment to post ${postId}:`, error);
      throw error;
    }
  },
  
  /**
   * Active/désactive le "j'aime" sur un post
   * @param {string} postId - ID du post
   * @param {boolean} liked - Nouvel état (aimé ou non)
   * @returns {Promise<Object>} Résultat de l'opération
   */
  toggleLike: async (postId, liked) => {
    try {
      // Appel API
      const response = await api.post(`/social/posts/${postId}/like`, { liked });
      return response.data;
    } catch (error) {
      console.error(`Error toggling like for post ${postId}:`, error);
      throw error;
    }
  },
  
  /**
   * Vérifie si l'utilisateur est connecté à Strava
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<boolean>} État de la connexion
   */
  checkStravaConnection: async (userId) => {
    try {
      // Appel API
      const response = await api.get(`/social/strava/check/${userId}`);
      return response.data.connected;
    } catch (error) {
      console.error(`Error checking Strava connection for user ${userId}:`, error);
      throw error;
    }
  },
  
  /**
   * Connecte l'utilisateur à Strava
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Résultat de la connexion
   */
  connectStrava: async (userId) => {
    try {
      // Appel API
      const response = await api.post(`/social/strava/connect`, { userId });
      return response.data;
    } catch (error) {
      console.error(`Error connecting Strava for user ${userId}:`, error);
      throw error;
    }
  },
  
  /**
   * Récupère les activités Strava de l'utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Array>} Liste des activités
   */
  getStravaActivities: async (userId) => {
    try {
      // Appel API
      const response = await api.get(`/social/strava/activities/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching Strava activities for user ${userId}:`, error);
      throw error;
    }
  },
  
  /**
   * Récupère un post par son ID
   * @param {string} postId - ID du post
   * @returns {Promise<Object>} Données du post
   */
  getPostById: async (postId) => {
    try {
      const response = await api.get(`/api/social/posts/${postId}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du post ${postId}`, error);
      throw error;
    }
  },
  
  /**
   * Met à jour un post existant
   * @param {string} postId - ID du post
   * @param {Object} postData - Données à mettre à jour
   * @returns {Promise<Object>} Post mis à jour
   */
  updatePost: async (postId, postData) => {
    try {
      const response = await api.put(`/api/social/posts/${postId}`, postData);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du post ${postId}`, error);
      throw error;
    }
  },
  
  /**
   * Supprime un post
   * @param {string} postId - ID du post
   * @returns {Promise<Object>} Résultat de l'opération
   */
  deletePost: async (postId) => {
    try {
      const response = await api.delete(`/api/social/posts/${postId}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la suppression du post ${postId}`, error);
      throw error;
    }
  },
  
  /**
   * Partage une activité Strava sur le fil social
   * @param {string} userId - ID de l'utilisateur
   * @param {string} activityId - ID de l'activité Strava
   * @param {Object} postData - Données additionnelles pour le post
   * @returns {Promise<Object>} Post créé
   */
  shareStravaActivity: async (userId, activityId, postData = {}) => {
    try {
      const response = await api.post(`/api/social/strava/${activityId}/share`, {
        userId,
        ...postData
      });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors du partage de l'activité Strava ${activityId}`, error);
      throw error;
    }
  },
  
  /**
   * Vérifie le statut de connexion Strava d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Statut de connexion Strava
   */
  getStravaConnectionStatus: async (userId) => {
    try {
      const response = await api.get(`/api/users/${userId}/strava/status`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la vérification du statut Strava pour l'utilisateur ${userId}`, error);
      throw error;
    }
  }
};

/**
 * Formate la durée en secondes vers un format lisible (HH:MM:SS)
 * @param {number} seconds - Durée en secondes
 * @returns {string} Durée formatée
 */
const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  } else {
    return `${minutes}min ${remainingSeconds}s`;
  }
};

export default SocialService;
