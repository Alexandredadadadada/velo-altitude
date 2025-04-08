/**
 * Service pour l'intégration avec l'API Strava
 * Gère l'authentification et les appels API à Strava
 * Utilise apiWrapper qui gère les appels API réels avec MSW en mode développement.
 */
import api from './apiWrapper';
import authService from './authService';

class StravaService {
  /**
   * Récupère les activités Strava de l'utilisateur
   * @param {Object} params - Paramètres de filtrage (before, after, page, per_page)
   * @returns {Promise<Array>} - Liste des activités
   */
  async getUserActivities(params = {}) {
    try {
      const response = await api.get(`/strava/activities`, { params });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des activités Strava:', error);
      throw error;
    }
  }
  
  /**
   * Importe une activité Strava comme itinéraire
   * @param {string} activityId - ID de l'activité Strava
   * @returns {Promise<Object>} - Itinéraire importé
   */
  async importActivity(activityId) {
    try {
      const response = await api.post(`/strava/import`, { activityId });
      return response.data;
    } catch (error) {
      console.error("Erreur lors de l'importation de l'activité Strava:", error);
      throw error;
    }
  }
  
  /**
   * Convertit une activité Strava en itinéraire partageable
   * @param {Object} activity - Activité Strava
   * @returns {Promise<Object>} - Itinéraire créé
   */
  async convertActivityToRoute(activity) {
    try {
      const response = await api.post(`/strava/convert`, { activity });
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la conversion de l'activité Strava:", error);
      throw error;
    }
  }
  
  /**
   * Vérifie si l'utilisateur est authentifié avec Strava
   * @returns {Promise<boolean>} - Statut d'authentification
   */
  async checkAuthStatus() {
    try {
      const response = await api.get(`/strava/auth-status`);
      return response.data.isAuthenticated;
    } catch (error) {
      console.error("Erreur lors de la vérification du statut d'authentification Strava:", error);
      return false;
    }
  }
  
  /**
   * Récupère l'URL d'authentification Strava
   * @returns {Promise<string>} - URL d'authentification
   */
  async getAuthUrl() {
    try {
      const response = await api.get(`/strava/auth-url`);
      return response.data.url;
    } catch (error) {
      console.error("Erreur lors de la récupération de l'URL d'authentification Strava:", error);
      throw error;
    }
  }
  
  /**
   * Synchronise les activités Strava avec l'application
   * @returns {Promise<Object>} - Résultat de la synchronisation
   */
  async syncActivities() {
    try {
      const response = await api.post(`/strava/sync`);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la synchronisation des activités Strava:", error);
      throw error;
    }
  }
}

export default new StravaService();
