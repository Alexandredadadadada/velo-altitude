/**
 * Service pour la gestion des itinéraires cyclistes
 */
import api, { USE_MOCK_DATA } from './api';
import mockRoutes from '../mocks/routes';
import mockUserRoutes from '../mocks/userRoutes';

const RouteService = {
  /**
   * Récupère tous les itinéraires disponibles
   * @param {Object} filters - Filtres à appliquer
   * @returns {Promise<Array>} Liste des itinéraires
   */
  getAllRoutes: async (filters = {}) => {
    if (USE_MOCK_DATA) {
      // Filtrage côté client pour les données mockées
      let filteredRoutes = [...mockRoutes];
      
      if (filters.minDistance) {
        filteredRoutes = filteredRoutes.filter(route => route.distance >= filters.minDistance);
      }
      
      if (filters.maxDistance) {
        filteredRoutes = filteredRoutes.filter(route => route.distance <= filters.maxDistance);
      }
      
      if (filters.minElevation) {
        filteredRoutes = filteredRoutes.filter(route => route.elevationGain >= filters.minElevation);
      }
      
      if (filters.maxElevation) {
        filteredRoutes = filteredRoutes.filter(route => route.elevationGain <= filters.maxElevation);
      }
      
      if (filters.difficulty && filters.difficulty.length > 0) {
        filteredRoutes = filteredRoutes.filter(route => filters.difficulty.includes(route.difficulty));
      }
      
      if (filters.region && filters.region.length > 0) {
        filteredRoutes = filteredRoutes.filter(route => filters.region.includes(route.region));
      }
      
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        filteredRoutes = filteredRoutes.filter(
          route => route.name.toLowerCase().includes(term) || 
                  route.description.toLowerCase().includes(term) ||
                  route.region.toLowerCase().includes(term)
        );
      }
      
      return Promise.resolve(filteredRoutes);
    }
    
    try {
      // Envoi des filtres comme paramètres de requête
      const response = await api.get('/api/routes', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des itinéraires', error);
      throw error;
    }
  },
  
  /**
   * Récupère un itinéraire par son ID
   * @param {string} routeId - ID de l'itinéraire
   * @returns {Promise<Object>} Données de l'itinéraire
   */
  getRouteById: async (routeId) => {
    if (USE_MOCK_DATA) {
      const route = mockRoutes.find(r => r.id === routeId);
      if (!route) throw new Error('Itinéraire non trouvé');
      return Promise.resolve(route);
    }
    
    try {
      const response = await api.get(`/api/routes/${routeId}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération de l'itinéraire ${routeId}`, error);
      throw error;
    }
  },
  
  /**
   * Récupère les itinéraires d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Array>} Liste des itinéraires de l'utilisateur
   */
  getUserRoutes: async (userId) => {
    if (USE_MOCK_DATA) {
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 300));
      return Promise.resolve(mockUserRoutes);
    }
    
    try {
      const response = await api.get(`/api/users/${userId}/routes`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des itinéraires de l'utilisateur ${userId}`, error);
      throw error;
    }
  },
  
  /**
   * Ajoute un itinéraire aux favoris de l'utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {string} routeId - ID de l'itinéraire
   * @returns {Promise<Object>} Résultat de l'opération
   */
  addFavorite: async (userId, routeId) => {
    if (USE_MOCK_DATA) {
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 300));
      return Promise.resolve({ success: true });
    }
    
    try {
      const response = await api.post(`/api/users/${userId}/favorites`, { routeId });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'ajout aux favoris', error);
      throw error;
    }
  },
  
  /**
   * Retire un itinéraire des favoris de l'utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {string} routeId - ID de l'itinéraire
   * @returns {Promise<Object>} Résultat de l'opération
   */
  removeFavorite: async (userId, routeId) => {
    if (USE_MOCK_DATA) {
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 300));
      return Promise.resolve({ success: true });
    }
    
    try {
      const response = await api.delete(`/api/users/${userId}/favorites/${routeId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors du retrait des favoris', error);
      throw error;
    }
  },
  
  /**
   * Crée un nouvel itinéraire
   * @param {Object} routeData - Données de l'itinéraire
   * @returns {Promise<Object>} Itinéraire créé
   */
  createRoute: async (routeData) => {
    if (USE_MOCK_DATA) {
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 500));
      const newRoute = {
        id: `route-${Date.now()}`,
        ...routeData,
        createdAt: new Date().toISOString()
      };
      return Promise.resolve(newRoute);
    }
    
    try {
      const response = await api.post('/api/routes', routeData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de l\'itinéraire', error);
      throw error;
    }
  },
  
  /**
   * Met à jour un itinéraire existant
   * @param {string} routeId - ID de l'itinéraire
   * @param {Object} routeData - Données mises à jour
   * @returns {Promise<Object>} Itinéraire mis à jour
   */
  updateRoute: async (routeId, routeData) => {
    if (USE_MOCK_DATA) {
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 500));
      return Promise.resolve({
        id: routeId,
        ...routeData,
        updatedAt: new Date().toISOString()
      });
    }
    
    try {
      const response = await api.put(`/api/routes/${routeId}`, routeData);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de l'itinéraire ${routeId}`, error);
      throw error;
    }
  },
  
  /**
   * Supprime un itinéraire
   * @param {string} routeId - ID de l'itinéraire
   * @returns {Promise<Object>} Résultat de l'opération
   */
  deleteRoute: async (routeId) => {
    if (USE_MOCK_DATA) {
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 300));
      return Promise.resolve({ success: true });
    }
    
    try {
      const response = await api.delete(`/api/routes/${routeId}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la suppression de l'itinéraire ${routeId}`, error);
      throw error;
    }
  },
  
  /**
   * Récupère les itinéraires populaires
   * @param {number} limit - Nombre d'itinéraires à récupérer
   * @returns {Promise<Array>} Liste des itinéraires populaires
   */
  getPopularRoutes: async (limit = 5) => {
    if (USE_MOCK_DATA) {
      // Trier par popularité (nombre de favoris)
      const sortedRoutes = [...mockRoutes].sort((a, b) => (b.favorites || 0) - (a.favorites || 0));
      return Promise.resolve(sortedRoutes.slice(0, limit));
    }
    
    try {
      const response = await api.get('/api/routes/popular', { params: { limit } });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des itinéraires populaires', error);
      throw error;
    }
  },
  
  /**
   * Récupère les statistiques d'itinéraires pour un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Statistiques des itinéraires
   */
  getUserRouteStats: async (userId) => {
    if (USE_MOCK_DATA) {
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 400));
      return Promise.resolve({
        totalRoutes: mockUserRoutes.length,
        totalDistance: mockUserRoutes.reduce((sum, route) => sum + route.distance, 0),
        totalElevation: mockUserRoutes.reduce((sum, route) => sum + route.elevationGain, 0),
        favoriteRegion: 'Grand Est',
        avgDifficulty: 'Intermédiaire'
      });
    }
    
    try {
      const response = await api.get(`/api/users/${userId}/route-stats`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des statistiques d'itinéraires pour l'utilisateur ${userId}`, error);
      throw error;
    }
  }
};

export default RouteService;
