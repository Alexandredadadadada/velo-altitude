/**
 * Service de wrapping des appels API
 * Fournit une interface unifiée pour les appels API avec authentification
 * 
 * En mode développement, MSW intercepte automatiquement les requêtes,
 * ce qui élimine la nécessité d'une logique de mocking intégrée.
 */
import axios from 'axios';
import config from '../config';
import { handleApiError } from '../utils/apiErrorUtils';
import { getAccessToken } from '../auth';

/**
 * Wrapper pour les appels API
 */
class ApiWrapper {
  /**
   * Récupère les données via un appel GET
   * @param {string} endpoint - L'endpoint API à appeler
   * @param {Object} options - Options de la requête
   * @returns {Promise} - Promesse avec les données
   */
  async get(endpoint, options = {}) {
    try {
      // Préparer les headers avec authentification si disponible
      const headers = await this.prepareHeaders(options.headers);
      
      const response = await axios.get(`${config.API_BASE_URL}${endpoint}`, {
        headers,
        ...options
      });

      if (!response.ok) {
        throw await this.createApiError(response);
      }

      return await response.data;
    } catch (error) {
      return handleApiError(error, endpoint, 'GET');
    }
  }

  /**
   * Effectue un appel POST à l'API
   * @param {string} endpoint - L'endpoint API
   * @param {Object} data - Les données à envoyer
   * @param {Object} options - Options de la requête
   * @returns {Promise} - Promesse avec la réponse
   */
  async post(endpoint, data, options = {}) {
    try {
      // Préparer les headers avec authentification si disponible
      const headers = await this.prepareHeaders(options.headers);
      
      const response = await axios.post(`${config.API_BASE_URL}${endpoint}`, data, {
        headers,
        ...options
      });

      if (!response.ok) {
        throw await this.createApiError(response);
      }

      return await response.data;
    } catch (error) {
      return handleApiError(error, endpoint, 'POST');
    }
  }

  /**
   * Effectue un appel PUT à l'API
   * @param {string} endpoint - L'endpoint API
   * @param {Object} data - Les données à envoyer
   * @param {Object} options - Options de la requête
   * @returns {Promise} - Promesse avec la réponse
   */
  async put(endpoint, data, options = {}) {
    try {
      // Préparer les headers avec authentification si disponible
      const headers = await this.prepareHeaders(options.headers);
      
      const response = await axios.put(`${config.API_BASE_URL}${endpoint}`, data, {
        headers,
        ...options
      });

      if (!response.ok) {
        throw await this.createApiError(response);
      }

      return await response.data;
    } catch (error) {
      return handleApiError(error, endpoint, 'PUT');
    }
  }

  /**
   * Effectue un appel DELETE à l'API
   * @param {string} endpoint - L'endpoint API
   * @param {Object} options - Options de la requête
   * @returns {Promise} - Promesse avec la réponse
   */
  async delete(endpoint, options = {}) {
    try {
      // Préparer les headers avec authentification si disponible
      const headers = await this.prepareHeaders(options.headers);
      
      const response = await axios.delete(`${config.API_BASE_URL}${endpoint}`, {
        headers,
        ...options
      });

      if (!response.ok) {
        throw await this.createApiError(response);
      }

      return await response.data;
    } catch (error) {
      return handleApiError(error, endpoint, 'DELETE');
    }
  }

  /**
   * Prépare les headers avec authentification
   * @param {Object} customHeaders - Headers spécifiques à ajouter
   * @returns {Promise<Object>} - Headers complets
   */
  async prepareHeaders(customHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...customHeaders
    };

    try {
      // Ajouter le token d'authentification s'il est disponible
      const authToken = await getAccessToken();
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du token d\'authentification:', error);
      // Continuer sans token
    }

    return headers;
  }

  /**
   * Crée une erreur API structurée
   * @param {Response} response - Réponse de l'API
   * @returns {Error} - Erreur API
   */
  async createApiError(response) {
    let errorDetails;
    try {
      errorDetails = await response.data;
    } catch {
      errorDetails = { message: 'Unknown error' };
    }

    const error = new Error(errorDetails.message || `API error: ${response.status}`);
    error.status = response.status;
    error.statusText = response.statusText;
    error.details = errorDetails;
    return error;
  }
}

// Exporter une instance unique du wrapper
const apiWrapperInstance = new ApiWrapper();
export default apiWrapperInstance;
