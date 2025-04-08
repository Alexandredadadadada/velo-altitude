/**
 * Service pour la gestion des sorties de groupe
 * Permet de créer, rechercher et gérer les sorties cyclistes en groupe
 * Utilise apiWrapper qui gère les appels API réels avec MSW en mode développement.
 */
import api from './apiWrapper';
import authService from './authService';

const GroupRideService = {
  /**
   * Récupère toutes les sorties de groupe
   * @param {Object} filters - Filtres pour la recherche
   * @returns {Promise<Array>} Liste des sorties de groupe
   */
  getAllGroupRides: async (filters = {}) => {
    try {
      // Construire les paramètres de requête
      const params = new URLSearchParams();
      if (filters.region) params.append('region', filters.region);
      if (filters.difficulty) params.append('difficulty', filters.difficulty);
      if (filters.date) params.append('date', filters.date);
      if (filters.terrain) params.append('terrain', filters.terrain);
      if (filters.level) params.append('level', filters.level);
      if (filters.minDistance) params.append('minDistance', filters.minDistance);
      if (filters.maxDistance) params.append('maxDistance', filters.maxDistance);
      if (filters.hasAvailableSpots !== undefined) params.append('hasAvailableSpots', filters.hasAvailableSpots);
      if (filters.organizerId) params.append('organizerId', filters.organizerId);
      if (filters.searchTerm) params.append('search', filters.searchTerm);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
      
      // Appel API
      const response = await api.get(`/group-rides${params.toString() ? `?${params.toString()}` : ''}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching group rides:', error);
      throw error;
    }
  },
  
  /**
   * Récupère une sortie de groupe par son ID
   * @param {string} rideId - ID de la sortie
   * @returns {Promise<Object>} Détails de la sortie
   */
  getGroupRideById: async (rideId) => {
    try {
      const response = await api.get(`/group-rides/${rideId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching group ride ${rideId}:`, error);
      throw error;
    }
  },
  
  /**
   * Crée une nouvelle sortie de groupe
   * @param {Object} rideData - Données de la sortie
   * @returns {Promise<Object>} Sortie créée
   */
  createGroupRide: async (rideData) => {
    try {
      // Vérifier l'authenticité de l'utilisateur
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Authentication required to create a group ride');
      }
      
      // Préparer les données de la sortie
      const preparedRideData = {
        ...rideData,
        organizerId: currentUser.id
      };
      
      // Si les détails de l'itinéraire ne sont pas inclus mais l'ID est fourni,
      // on pourrait les récupérer, mais c'est mieux géré côté serveur
      
      const response = await api.post('/group-rides', preparedRideData);
      return response.data;
    } catch (error) {
      console.error('Error creating group ride:', error);
      throw error;
    }
  },
  
  /**
   * Met à jour une sortie de groupe existante
   * @param {string} rideId - ID de la sortie
   * @param {Object} rideData - Données à mettre à jour
   * @returns {Promise<Object>} Sortie mise à jour
   */
  updateGroupRide: async (rideId, rideData) => {
    try {
      const response = await api.put(`/group-rides/${rideId}`, rideData);
      return response.data;
    } catch (error) {
      console.error(`Error updating group ride ${rideId}:`, error);
      throw error;
    }
  },
  
  /**
   * Supprime une sortie de groupe
   * @param {string} rideId - ID de la sortie
   * @returns {Promise<Object>} Confirmation de suppression
   */
  deleteGroupRide: async (rideId) => {
    try {
      const response = await api.delete(`/group-rides/${rideId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting group ride ${rideId}:`, error);
      throw error;
    }
  },
  
  /**
   * Rejoindre une sortie de groupe
   * @param {string} rideId - ID de la sortie
   * @returns {Promise<Object>} Résultat de l'opération
   */
  joinGroupRide: async (rideId) => {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Authentication required to join a group ride');
      }
      
      const response = await api.post(`/group-rides/${rideId}/join`);
      return response.data;
    } catch (error) {
      console.error(`Error joining group ride ${rideId}:`, error);
      throw error;
    }
  },
  
  /**
   * Quitter une sortie de groupe
   * @param {string} rideId - ID de la sortie
   * @returns {Promise<Object>} Résultat de l'opération
   */
  leaveGroupRide: async (rideId) => {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Authentication required to leave a group ride');
      }
      
      const response = await api.post(`/group-rides/${rideId}/leave`);
      return response.data;
    } catch (error) {
      console.error(`Error leaving group ride ${rideId}:`, error);
      throw error;
    }
  },
  
  /**
   * Partage une sortie de groupe sur Strava
   * @param {string} rideId - ID de la sortie
   * @returns {Promise<Object>} Résultat de l'opération avec ID d'événement Strava
   */
  shareOnStrava: async (rideId) => {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Authentication required to share on Strava');
      }
      
      const response = await api.post(`/group-rides/${rideId}/share-strava`);
      return response.data;
    } catch (error) {
      console.error(`Error sharing group ride ${rideId} on Strava:`, error);
      throw error;
    }
  },
  
  /**
   * Récupère les sorties de groupe auxquelles participe un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Array>} Liste des sorties
   */
  getUserGroupRides: async (userId) => {
    try {
      if (!userId) {
        const currentUser = authService.getCurrentUser();
        if (!currentUser) {
          throw new Error('User ID not specified and no user logged in');
        }
        userId = currentUser.id;
      }
      
      const response = await api.get(`/users/${userId}/group-rides`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching group rides for user ${userId}:`, error);
      throw error;
    }
  },
  
  /**
   * Récupère les sorties de groupe organisées par un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Array>} Liste des sorties
   */
  getUserOrganizedRides: async (userId) => {
    try {
      if (!userId) {
        const currentUser = authService.getCurrentUser();
        if (!currentUser) {
          throw new Error('User ID not specified and no user logged in');
        }
        userId = currentUser.id;
      }
      
      const response = await api.get(`/users/${userId}/organized-rides`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching organized rides for user ${userId}:`, error);
      throw error;
    }
  }
};

export default GroupRideService;
