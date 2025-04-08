/**
 * RealApiOrchestratorPart3
 * 
 * Dernière partie de l'implémentation de l'interface ApiOrchestrator.
 * Contient les méthodes pour le forum, l'authentification, Strava et la recherche.
 */

import { api } from '../../config/apiConfig';
import apiErrorHandler from '../errorHandling/apiErrorHandler';
import monitoringService from '../monitoring/MonitoringService';

// Fonction de gestion d'erreur identique aux autres parties
const handleError = (error, operation) => {
  console.error(`[RealApiOrchestrator] Error in ${operation}:`, error);
  
  monitoringService.trackError(error, {
    moduleName: 'RealApiOrchestrator',
    operation
  });
  
  return Promise.reject(error);
};

/**
 * Partie 3 de l'orchestrateur d'API réel
 */
class RealApiOrchestratorPart3 {
  
  // #region Services de forum et communauté
  /**
   * Récupère toutes les catégories du forum
   * @returns {Promise<Array>} Catégories du forum
   */
  async getForumCategories() {
    try {
      const data = await api.get('/forum/categories');
      return data;
    } catch (error) {
      return handleError(error, 'getForumCategories');
    }
  }

  /**
   * Récupère les sujets d'une catégorie du forum
   * @param {string} categoryId - ID de la catégorie
   * @param {number} page - Numéro de page
   * @param {number} pageSize - Taille de la page
   * @returns {Promise<Object>} Sujets paginés
   */
  async getForumTopics(categoryId, page = 1, pageSize = 20) {
    try {
      const data = await api.get(`/forum/categories/${categoryId}/topics`, {
        params: { page, pageSize }
      });
      return data;
    } catch (error) {
      return handleError(error, 'getForumTopics');
    }
  }

  /**
   * Récupère les messages d'un sujet du forum
   * @param {string} topicId - ID du sujet
   * @param {number} page - Numéro de page
   * @param {number} pageSize - Taille de la page
   * @returns {Promise<Object>} Messages paginés
   */
  async getForumPosts(topicId, page = 1, pageSize = 20) {
    try {
      const data = await api.get(`/forum/topics/${topicId}/posts`, {
        params: { page, pageSize }
      });
      return data;
    } catch (error) {
      return handleError(error, 'getForumPosts');
    }
  }

  /**
   * Crée un nouveau sujet dans le forum
   * @param {string} categoryId - ID de la catégorie
   * @param {string} title - Titre du sujet
   * @param {string} content - Contenu du premier message
   * @returns {Promise<Object>} Sujet créé
   */
  async createForumTopic(categoryId, title, content) {
    try {
      const data = await api.post(`/forum/categories/${categoryId}/topics`, {
        title,
        content
      });
      return data;
    } catch (error) {
      return handleError(error, 'createForumTopic');
    }
  }

  /**
   * Crée un nouveau message dans un sujet
   * @param {string} topicId - ID du sujet
   * @param {string} content - Contenu du message
   * @returns {Promise<Object>} Message créé
   */
  async createForumPost(topicId, content) {
    try {
      const data = await api.post(`/forum/topics/${topicId}/posts`, {
        content
      });
      return data;
    } catch (error) {
      return handleError(error, 'createForumPost');
    }
  }
  // #endregion

  // #region Services d'authentification
  /**
   * Connecte un utilisateur
   * @param {string} email - Email de l'utilisateur
   * @param {string} password - Mot de passe
   * @returns {Promise<Object>} Token et utilisateur
   */
  async login(email, password) {
    try {
      const data = await api.post('/auth/login', {
        email,
        password
      });
      
      // Stocker les tokens dans le localStorage
      if (data.token) {
        localStorage.setItem('authToken', data.token);
      }
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      
      return data;
    } catch (error) {
      return handleError(error, 'login');
    }
  }

  /**
   * Inscrit un nouvel utilisateur
   * @param {Object} userData - Données d'inscription
   * @returns {Promise<Object>} Token et utilisateur
   */
  async register(userData) {
    try {
      const data = await api.post('/auth/register', userData);
      
      // Stocker les tokens dans le localStorage
      if (data.token) {
        localStorage.setItem('authToken', data.token);
      }
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      
      return data;
    } catch (error) {
      return handleError(error, 'register');
    }
  }

  /**
   * Rafraîchit le token d'authentification
   * @returns {Promise<Object>} Nouveau token
   */
  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const data = await api.post('/auth/refresh', {
        refreshToken
      });
      
      // Stocker le nouveau token
      if (data.token) {
        localStorage.setItem('authToken', data.token);
      }
      
      return data;
    } catch (error) {
      // Supprimer les tokens en cas d'échec
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      
      return handleError(error, 'refreshToken');
    }
  }

  /**
   * Déconnecte l'utilisateur
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      await api.post('/auth/logout');
      
      // Supprimer les tokens
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
    } catch (error) {
      // Supprimer les tokens même en cas d'erreur
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      
      return handleError(error, 'logout');
    }
  }
  // #endregion

  // #region Services Strava
  /**
   * Connecte le compte Strava d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {string} authCode - Code d'autorisation Strava
   * @returns {Promise<Object>} Connexion Strava
   */
  async connectStrava(userId, authCode) {
    try {
      const data = await api.post(`/users/${userId}/strava/connect`, {
        authCode
      });
      return data;
    } catch (error) {
      return handleError(error, 'connectStrava');
    }
  }

  /**
   * Déconnecte le compte Strava d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<void>}
   */
  async disconnectStrava(userId) {
    try {
      await api.post(`/users/${userId}/strava/disconnect`);
    } catch (error) {
      return handleError(error, 'disconnectStrava');
    }
  }

  /**
   * Synchronise les activités Strava
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Array>} Activités synchronisées
   */
  async syncStravaActivities(userId) {
    try {
      const data = await api.post(`/users/${userId}/strava/sync`);
      return data;
    } catch (error) {
      return handleError(error, 'syncStravaActivities');
    }
  }
  // #endregion

  // #region Services de recherche
  /**
   * Recherche globale dans l'application
   * @param {string} query - Termes de recherche
   * @returns {Promise<Object>} Résultats de recherche
   */
  async searchGlobal(query) {
    try {
      const data = await api.get('/search', {
        params: { q: query }
      });
      return data;
    } catch (error) {
      return handleError(error, 'searchGlobal');
    }
  }
  // #endregion
}

export default new RealApiOrchestratorPart3();
