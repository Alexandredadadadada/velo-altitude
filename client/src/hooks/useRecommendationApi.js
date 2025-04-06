import { useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './useAuthCentral';

/**
 * Hook personnalisé pour interagir avec l'API des recommandations
 * 
 * @returns {Object} Méthodes pour interagir avec l'API des recommandations
 */
const useRecommendationApi = () => {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);

  /**
   * Configuration des en-têtes avec le token d'authentification
   */
  const getHeaders = useCallback(async () => {
    const token = await getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : undefined
    };
  }, [getToken]);

  /**
   * Récupère les recommandations personnalisées
   * 
   * @param {Object} params - Paramètres de requête
   * @returns {Promise<Object>} Résultat de la requête
   */
  const getPersonalizedRecommendations = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const headers = await getHeaders();
      const queryParams = new URLSearchParams();
      
      // Ajouter les paramètres de base
      if (params.userId) queryParams.append('userId', params.userId);
      if (params.limit) queryParams.append('limit', params.limit);
      
      // Ajouter les paramètres de filtrage
      if (params.difficulty && params.difficulty.length > 0) {
        params.difficulty.forEach(diff => queryParams.append('difficulty', diff));
      }
      
      if (params.surface && params.surface.length > 0) {
        params.surface.forEach(surf => queryParams.append('surface', surf));
      }
      
      if (params.distance) {
        if (params.distance.min > 0) queryParams.append('minDistance', params.distance.min);
        if (params.distance.max < 200) queryParams.append('maxDistance', params.distance.max);
      }
      
      if (params.elevation) {
        if (params.elevation.min > 0) queryParams.append('minElevation', params.elevation.min);
        if (params.elevation.max < 3000) queryParams.append('maxElevation', params.elevation.max);
      }
      
      const response = await axios.get(
        `/api/recommendations/personalized?${queryParams.toString()}`,
        { headers }
      );
      
      return {
        success: true,
        data: response.data.routes
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des recommandations personnalisées:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de la récupération des recommandations'
      };
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  /**
   * Récupère les itinéraires tendance
   * 
   * @param {Object} params - Paramètres de requête
   * @returns {Promise<Object>} Résultat de la requête
   */
  const getTrendingRoutes = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const headers = await getHeaders();
      const queryParams = new URLSearchParams();
      
      // Ajouter les paramètres de base
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.period) queryParams.append('period', params.period); // 'day', 'week', 'month'
      
      // Ajouter les paramètres de filtrage
      if (params.difficulty && params.difficulty.length > 0) {
        params.difficulty.forEach(diff => queryParams.append('difficulty', diff));
      }
      
      if (params.surface && params.surface.length > 0) {
        params.surface.forEach(surf => queryParams.append('surface', surf));
      }
      
      if (params.distance) {
        if (params.distance.min > 0) queryParams.append('minDistance', params.distance.min);
        if (params.distance.max < 200) queryParams.append('maxDistance', params.distance.max);
      }
      
      if (params.elevation) {
        if (params.elevation.min > 0) queryParams.append('minElevation', params.elevation.min);
        if (params.elevation.max < 3000) queryParams.append('maxElevation', params.elevation.max);
      }
      
      const response = await axios.get(
        `/api/recommendations/trending?${queryParams.toString()}`,
        { headers }
      );
      
      return {
        success: true,
        data: response.data.routes
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des itinéraires tendance:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de la récupération des itinéraires tendance'
      };
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  /**
   * Récupère les recommandations saisonnières
   * 
   * @param {Object} params - Paramètres de requête
   * @returns {Promise<Object>} Résultat de la requête
   */
  const getSeasonalRecommendations = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const headers = await getHeaders();
      const queryParams = new URLSearchParams();
      
      // Ajouter les paramètres de base
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.season) queryParams.append('season', params.season); // 'spring', 'summer', 'autumn', 'winter'
      
      // Ajouter les paramètres de filtrage
      if (params.difficulty && params.difficulty.length > 0) {
        params.difficulty.forEach(diff => queryParams.append('difficulty', diff));
      }
      
      if (params.surface && params.surface.length > 0) {
        params.surface.forEach(surf => queryParams.append('surface', surf));
      }
      
      if (params.distance) {
        if (params.distance.min > 0) queryParams.append('minDistance', params.distance.min);
        if (params.distance.max < 200) queryParams.append('maxDistance', params.distance.max);
      }
      
      if (params.elevation) {
        if (params.elevation.min > 0) queryParams.append('minElevation', params.elevation.min);
        if (params.elevation.max < 3000) queryParams.append('maxElevation', params.elevation.max);
      }
      
      const response = await axios.get(
        `/api/recommendations/seasonal?${queryParams.toString()}`,
        { headers }
      );
      
      return {
        success: true,
        data: response.data.routes
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des recommandations saisonnières:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de la récupération des recommandations saisonnières'
      };
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  /**
   * Récupère les itinéraires favoris de l'utilisateur
   * 
   * @param {Object} params - Paramètres de requête
   * @returns {Promise<Object>} Résultat de la requête
   */
  const getFavoriteRoutes = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const headers = await getHeaders();
      const queryParams = new URLSearchParams();
      
      // Ajouter les paramètres de base
      if (params.userId) queryParams.append('userId', params.userId);
      if (params.limit) queryParams.append('limit', params.limit);
      
      // Ajouter les paramètres de filtrage
      if (params.difficulty && params.difficulty.length > 0) {
        params.difficulty.forEach(diff => queryParams.append('difficulty', diff));
      }
      
      if (params.surface && params.surface.length > 0) {
        params.surface.forEach(surf => queryParams.append('surface', surf));
      }
      
      if (params.distance) {
        if (params.distance.min > 0) queryParams.append('minDistance', params.distance.min);
        if (params.distance.max < 200) queryParams.append('maxDistance', params.distance.max);
      }
      
      if (params.elevation) {
        if (params.elevation.min > 0) queryParams.append('minElevation', params.elevation.min);
        if (params.elevation.max < 3000) queryParams.append('maxElevation', params.elevation.max);
      }
      
      const response = await axios.get(
        `/api/users/favorites?${queryParams.toString()}`,
        { headers }
      );
      
      return {
        success: true,
        data: response.data.routes
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des itinéraires favoris:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de la récupération des itinéraires favoris'
      };
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  /**
   * Ajoute ou retire un itinéraire des favoris
   * 
   * @param {string} routeId - ID de l'itinéraire
   * @returns {Promise<Object>} Résultat de la requête
   */
  const toggleFavorite = useCallback(async (routeId) => {
    setLoading(true);
    try {
      const headers = await getHeaders();
      const response = await axios.post(`/api/routes/${routeId}/favorite`, {}, { headers });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Erreur lors de la modification des favoris:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de la modification des favoris'
      };
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  /**
   * Recherche des itinéraires avec des critères spécifiques
   * 
   * @param {Object} params - Paramètres de recherche
   * @returns {Promise<Object>} Résultat de la requête
   */
  const searchRoutes = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const headers = await getHeaders();
      const queryParams = new URLSearchParams();
      
      // Ajouter les paramètres de recherche
      if (params.query) queryParams.append('q', params.query);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.page) queryParams.append('page', params.page);
      
      // Ajouter les paramètres de filtrage
      if (params.difficulty && params.difficulty.length > 0) {
        params.difficulty.forEach(diff => queryParams.append('difficulty', diff));
      }
      
      if (params.surface && params.surface.length > 0) {
        params.surface.forEach(surf => queryParams.append('surface', surf));
      }
      
      if (params.distance) {
        if (params.distance.min > 0) queryParams.append('minDistance', params.distance.min);
        if (params.distance.max < 200) queryParams.append('maxDistance', params.distance.max);
      }
      
      if (params.elevation) {
        if (params.elevation.min > 0) queryParams.append('minElevation', params.elevation.min);
        if (params.elevation.max < 3000) queryParams.append('maxElevation', params.elevation.max);
      }
      
      if (params.minRating) queryParams.append('minRating', params.minRating);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
      
      const response = await axios.get(
        `/api/routes/search?${queryParams.toString()}`,
        { headers }
      );
      
      return {
        success: true,
        data: response.data.routes,
        pagination: response.data.pagination
      };
    } catch (error) {
      console.error('Erreur lors de la recherche d\'itinéraires:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de la recherche d\'itinéraires'
      };
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  /**
   * Récupère des itinéraires similaires à un itinéraire donné
   * 
   * @param {string} routeId - ID de l'itinéraire de référence
   * @param {Object} params - Paramètres de requête
   * @returns {Promise<Object>} Résultat de la requête
   */
  const getSimilarRoutes = useCallback(async (routeId, params = {}) => {
    setLoading(true);
    try {
      const headers = await getHeaders();
      const queryParams = new URLSearchParams();
      
      // Ajouter les paramètres de base
      if (params.limit) queryParams.append('limit', params.limit);
      
      const response = await axios.get(
        `/api/routes/${routeId}/similar?${queryParams.toString()}`,
        { headers }
      );
      
      return {
        success: true,
        data: response.data.routes
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des itinéraires similaires:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de la récupération des itinéraires similaires'
      };
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  return {
    loading,
    getPersonalizedRecommendations,
    getTrendingRoutes,
    getSeasonalRecommendations,
    getFavoriteRoutes,
    toggleFavorite,
    searchRoutes,
    getSimilarRoutes
  };
};

export default useRecommendationApi;
