/**
 * Service de gestion des utilisateurs
 * Fournit des méthodes pour récupérer et mettre à jour les profils utilisateurs
 * Utilise apiWrapper qui gère les appels API réels avec MSW en mode développement.
 */
import api from './apiWrapper';
import authService from './authService';

class UserService {
  /**
   * Récupère le profil de l'utilisateur connecté
   * @returns {Promise<Object>} Profil utilisateur
   */
  async getCurrentUserProfile() {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Aucun utilisateur connecté');
      }
      
      const response = await api.get(`/users/profile`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du profil utilisateur:', error);
      throw error;
    }
  }
  
  /**
   * Récupère le profil d'un utilisateur spécifique par son ID
   * @param {string} userId - Identifiant de l'utilisateur
   * @returns {Promise<Object>} Profil utilisateur
   */
  async getUserProfile(userId) {
    try {
      if (!userId) {
        throw new Error('ID utilisateur requis');
      }
      
      const response = await api.get(`/users/${userId}/profile`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du profil utilisateur (ID: ${userId}):`, error);
      throw error;
    }
  }
  
  /**
   * Met à jour le profil utilisateur
   * @param {Object} profileData - Données du profil à mettre à jour
   * @returns {Promise<Object>} Profil utilisateur mis à jour
   */
  async updateUserProfile(profileData) {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Aucun utilisateur connecté');
      }
      
      const response = await api.put(`/users/profile`, profileData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil utilisateur:', error);
      throw error;
    }
  }
  
  /**
   * Récupère l'historique d'entraînement de l'utilisateur
   * @param {string} userId - Identifiant de l'utilisateur
   * @param {number} limit - Nombre maximum d'entrées à récupérer
   * @returns {Promise<Array>} Historique d'entraînement
   */
  async getUserWorkoutHistory(userId, limit = 10) {
    try {
      if (!userId) {
        const currentUser = authService.getCurrentUser();
        if (!currentUser) {
          throw new Error('ID utilisateur requis ou utilisateur non connecté');
        }
        userId = currentUser.id;
      }
      
      const response = await api.get(`/users/${userId}/workouts`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération de l'historique d'entraînement (ID: ${userId}):`, error);
      throw error;
    }
  }
  
  /**
   * Récupère les statistiques d'entraînement de l'utilisateur
   * @param {string} userId - Identifiant de l'utilisateur
   * @param {string} period - Période pour les statistiques (week, month, year, all)
   * @returns {Promise<Object>} Statistiques d'entraînement
   */
  async getUserTrainingStats(userId, period = 'month') {
    try {
      if (!userId) {
        const currentUser = authService.getCurrentUser();
        if (!currentUser) {
          throw new Error('ID utilisateur requis ou utilisateur non connecté');
        }
        userId = currentUser.id;
      }
      
      const response = await api.get(`/users/${userId}/training-stats`, {
        params: { period }
      });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des statistiques d'entraînement (ID: ${userId}):`, error);
      throw error;
    }
  }
}

// Export une instance singleton du service
export default new UserService();
