/**
 * Service pour la gestion des itinéraires cyclables
 * Utilise apiWrapper qui gère les appels API réels avec MSW en mode développement.
 */
import api from './apiWrapper';

const RouteService = {
  /**
   * Récupère la liste des itinéraires disponibles
   * @param {Object} options - Options de filtrage et de pagination
   * @returns {Promise<Array>} Liste des itinéraires
   */
  getAllRoutes: async (options = {}) => {
    try {
      // Construire les paramètres de requête
      const params = new URLSearchParams();
      if (options.region) params.append('region', options.region);
      if (options.difficulty) params.append('difficulty', options.difficulty);
      if (options.minLength) params.append('minLength', options.minLength);
      if (options.maxLength) params.append('maxLength', options.maxLength);
      if (options.minElevation) params.append('minElevation', options.minElevation);
      if (options.maxElevation) params.append('maxElevation', options.maxElevation);
      if (options.surface) params.append('surface', options.surface);
      if (options.page) params.append('page', options.page);
      if (options.limit) params.append('limit', options.limit);
      if (options.sortBy) params.append('sortBy', options.sortBy);
      if (options.sortOrder) params.append('sortOrder', options.sortOrder);
      
      // Appel API
      const response = await api.get(`/routes${params.toString() ? `?${params.toString()}` : ''}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching routes:', error);
      throw error;
    }
  },
  
  /**
   * Récupère les détails d'un itinéraire
   * @param {string} routeId - ID de l'itinéraire
   * @returns {Promise<Object>} Détails de l'itinéraire
   */
  getRouteById: async (routeId) => {
    try {
      const response = await api.get(`/routes/${routeId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching route ${routeId}:`, error);
      throw error;
    }
  },
  
  /**
   * Récupère les itinéraires d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Array>} Liste des itinéraires de l'utilisateur
   */
  getUserRoutes: async (userId) => {
    try {
      const response = await api.get(`/users/${userId}/routes`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching routes for user ${userId}:`, error);
      throw error;
    }
  },
  
  /**
   * Ajoute un itinéraire aux favoris
   * @param {string} routeId - ID de l'itinéraire
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Résultat de l'opération
   */
  addFavorite: async (routeId, userId) => {
    try {
      const response = await api.post(`/routes/${routeId}/favorite`, { userId });
      return response.data;
    } catch (error) {
      console.error(`Error adding route ${routeId} to favorites:`, error);
      throw error;
    }
  },
  
  /**
   * Retire un itinéraire des favoris
   * @param {string} routeId - ID de l'itinéraire
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Résultat de l'opération
   */
  removeFavorite: async (routeId, userId) => {
    try {
      const response = await api.delete(`/routes/${routeId}/favorite`, { data: { userId } });
      return response.data;
    } catch (error) {
      console.error(`Error removing route ${routeId} from favorites:`, error);
      throw error;
    }
  },
  
  /**
   * Crée un nouvel itinéraire
   * @param {Object} routeData - Données de l'itinéraire
   * @returns {Promise<Object>} Itinéraire créé
   */
  createRoute: async (routeData) => {
    try {
      const response = await api.post('/routes', routeData);
      return response.data;
    } catch (error) {
      console.error('Error creating route:', error);
      throw error;
    }
  },
  
  /**
   * Met à jour un itinéraire existant
   * @param {string} routeId - ID de l'itinéraire
   * @param {Object} routeData - Nouvelles données
   * @returns {Promise<Object>} Itinéraire mis à jour
   */
  updateRoute: async (routeId, routeData) => {
    try {
      const response = await api.put(`/routes/${routeId}`, routeData);
      return response.data;
    } catch (error) {
      console.error(`Error updating route ${routeId}:`, error);
      throw error;
    }
  },
  
  /**
   * Supprime un itinéraire
   * @param {string} routeId - ID de l'itinéraire
   * @returns {Promise<Object>} Résultat de l'opération
   */
  deleteRoute: async (routeId) => {
    try {
      const response = await api.delete(`/routes/${routeId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting route ${routeId}:`, error);
      throw error;
    }
  },
  
  /**
   * Récupère les itinéraires populaires
   * @param {number} limit - Nombre d'itinéraires à récupérer
   * @returns {Promise<Array>} Liste des itinéraires populaires
   */
  getPopularRoutes: async (limit = 5) => {
    try {
      const response = await api.get(`/routes/popular?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching popular routes:', error);
      throw error;
    }
  },
  
  /**
   * Récupère les statistiques d'utilisation des itinéraires d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Statistiques d'utilisation
   */
  getUserRouteStats: async (userId) => {
    try {
      const response = await api.get(`/users/${userId}/routes/stats`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching route stats for user ${userId}:`, error);
      throw error;
    }
  }
};

export default RouteService;
