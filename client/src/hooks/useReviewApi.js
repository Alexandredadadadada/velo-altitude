import { useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './useAuth';

/**
 * Hook personnalisé pour interagir avec l'API des avis
 * 
 * @returns {Object} Méthodes pour interagir avec l'API des avis
 */
const useReviewApi = () => {
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
   * Récupère les avis pour un itinéraire
   * 
   * @param {string} routeId - ID de l'itinéraire
   * @param {Object} params - Paramètres de requête (pagination, tri, filtres)
   * @returns {Promise<Object>} Résultat de la requête
   */
  const getRouteReviews = useCallback(async (routeId, params = {}) => {
    setLoading(true);
    try {
      const headers = await getHeaders();
      const queryParams = new URLSearchParams();
      
      // Ajouter les paramètres de pagination
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      
      // Ajouter les paramètres de tri
      if (params.sort) queryParams.append('sort', params.sort);
      
      // Ajouter les paramètres de filtrage
      if (params.minRating) queryParams.append('minRating', params.minRating);
      if (params.maxRating) queryParams.append('maxRating', params.maxRating);
      if (params.hasComments) queryParams.append('hasComments', params.hasComments);
      
      const response = await axios.get(
        `/api/routes/${routeId}/reviews?${queryParams.toString()}`,
        { headers }
      );
      
      return {
        success: true,
        data: response.data.reviews,
        pagination: response.data.pagination
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des avis:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de la récupération des avis'
      };
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  /**
   * Récupère un avis spécifique
   * 
   * @param {string} reviewId - ID de l'avis
   * @returns {Promise<Object>} Résultat de la requête
   */
  const getReview = useCallback(async (reviewId) => {
    setLoading(true);
    try {
      const headers = await getHeaders();
      const response = await axios.get(`/api/reviews/${reviewId}`, { headers });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'avis:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de la récupération de l\'avis'
      };
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  /**
   * Ajoute un nouvel avis
   * 
   * @param {Object} reviewData - Données de l'avis
   * @returns {Promise<Object>} Résultat de la requête
   */
  const addReview = useCallback(async (reviewData) => {
    setLoading(true);
    try {
      const headers = await getHeaders();
      const response = await axios.post('/api/reviews', reviewData, { headers });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'avis:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de l\'ajout de l\'avis'
      };
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  /**
   * Met à jour un avis existant
   * 
   * @param {string} reviewId - ID de l'avis
   * @param {Object} reviewData - Données mises à jour
   * @returns {Promise<Object>} Résultat de la requête
   */
  const updateReview = useCallback(async (reviewId, reviewData) => {
    setLoading(true);
    try {
      const headers = await getHeaders();
      const response = await axios.put(`/api/reviews/${reviewId}`, reviewData, { headers });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'avis:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de la mise à jour de l\'avis'
      };
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  /**
   * Supprime un avis
   * 
   * @param {string} reviewId - ID de l'avis
   * @returns {Promise<Object>} Résultat de la requête
   */
  const deleteReview = useCallback(async (reviewId) => {
    setLoading(true);
    try {
      const headers = await getHeaders();
      await axios.delete(`/api/reviews/${reviewId}`, { headers });
      
      return {
        success: true
      };
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'avis:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de la suppression de l\'avis'
      };
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  /**
   * Ajoute ou retire un "j'aime" sur un avis
   * 
   * @param {string} reviewId - ID de l'avis
   * @returns {Promise<Object>} Résultat de la requête
   */
  const likeReview = useCallback(async (reviewId) => {
    setLoading(true);
    try {
      const headers = await getHeaders();
      const response = await axios.post(`/api/reviews/${reviewId}/like`, {}, { headers });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Erreur lors de l\'ajout du j\'aime:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de l\'ajout du j\'aime'
      };
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  /**
   * Signale un avis
   * 
   * @param {string} reviewId - ID de l'avis
   * @param {string} reason - Raison du signalement
   * @returns {Promise<Object>} Résultat de la requête
   */
  const reportReview = useCallback(async (reviewId, reason) => {
    setLoading(true);
    try {
      const headers = await getHeaders();
      const response = await axios.post(
        `/api/reviews/${reviewId}/report`,
        { reason },
        { headers }
      );
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Erreur lors du signalement de l\'avis:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors du signalement de l\'avis'
      };
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  /**
   * Récupère les avis signalés (pour les modérateurs)
   * 
   * @param {Object} params - Paramètres de requête (pagination, statut)
   * @returns {Promise<Object>} Résultat de la requête
   */
  const getReportedReviews = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const headers = await getHeaders();
      const queryParams = new URLSearchParams();
      
      // Ajouter les paramètres de pagination
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      
      // Ajouter les paramètres de filtrage
      if (params.status) queryParams.append('status', params.status);
      
      const response = await axios.get(
        `/api/moderation/reviews?${queryParams.toString()}`,
        { headers }
      );
      
      return {
        success: true,
        data: response.data.reports,
        pagination: response.data.pagination
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des avis signalés:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de la récupération des avis signalés'
      };
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  /**
   * Modère un avis signalé
   * 
   * @param {string} reportId - ID du signalement
   * @param {Object} moderationData - Données de modération
   * @returns {Promise<Object>} Résultat de la requête
   */
  const moderateReview = useCallback(async (reportId, moderationData) => {
    setLoading(true);
    try {
      const headers = await getHeaders();
      const response = await axios.post(
        `/api/moderation/reviews/${reportId}`,
        moderationData,
        { headers }
      );
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Erreur lors de la modération de l\'avis:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de la modération de l\'avis'
      };
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  return {
    loading,
    getRouteReviews,
    getReview,
    addReview,
    updateReview,
    deleteReview,
    likeReview,
    reportReview,
    getReportedReviews,
    moderateReview
  };
};

export default useReviewApi;
