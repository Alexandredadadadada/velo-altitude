/**
 * Utilitaire pour l'API Strava
 * Fournit des fonctions pour interagir avec l'API Strava en utilisant les tokens générés
 */
const axios = require('axios');
const stravaTokenService = require('../services/strava-token.service');

class StravaApiUtils {
  constructor() {
    this.baseUrl = 'https://www.strava.com/api/v3';
  }
  
  /**
   * Effectue un appel à l'API Strava
   * @param {string} endpoint - Point de terminaison API (sans le baseUrl)
   * @param {string} method - Méthode HTTP (GET, POST, PUT, DELETE)
   * @param {Object} data - Données pour les requêtes POST et PUT
   * @returns {Promise<Object>} - Réponse de l'API
   */
  async makeApiCall(endpoint, method = 'GET', data = null) {
    try {
      // Obtenir le token d'accès actuel
      const accessToken = stravaTokenService.getAccessToken();
      
      // Configurer les options de la requête
      const options = {
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      };
      
      // Ajouter des données pour les requêtes POST et PUT
      if (data && ['POST', 'PUT'].includes(method)) {
        options.data = data;
      }
      
      // Effectuer la requête
      const response = await axios(options);
      return response.data;
    } catch (error) {
      // Gérer les erreurs spécifiques à Strava
      if (error.response) {
        const { status, data } = error.response;
        
        // Vérifier si l'erreur est due à un token expiré
        if (status === 401 && data.errors && data.errors.some(e => e.field === 'access_token')) {
          // Forcer le rafraîchissement du token et réessayer
          await stravaTokenService.refreshTokenIfNeeded();
          return this.makeApiCall(endpoint, method, data);
        }
        
        // Autres erreurs de l'API
        throw new Error(`Erreur API Strava (${status}): ${JSON.stringify(data)}`);
      }
      
      // Erreurs de réseau ou autres
      throw new Error(`Erreur lors de l'appel à l'API Strava: ${error.message}`);
    }
  }
  
  /**
   * Récupère les activités de l'athlète authentifié
   * @param {Object} params - Paramètres de filtrage (before, after, page, per_page)
   * @returns {Promise<Array>} - Liste des activités
   */
  async getAthleteActivities(params = {}) {
    return this.makeApiCall('/athlete/activities', 'GET', params);
  }
  
  /**
   * Récupère les détails d'une activité
   * @param {string} activityId - ID de l'activité Strava
   * @returns {Promise<Object>} - Détails de l'activité
   */
  async getActivity(activityId) {
    return this.makeApiCall(`/activities/${activityId}`);
  }
  
  /**
   * Récupère les segments d'une activité
   * @param {string} activityId - ID de l'activité Strava
   * @returns {Promise<Array>} - Liste des segments
   */
  async getActivitySegments(activityId) {
    return this.makeApiCall(`/activities/${activityId}/segments`);
  }
  
  /**
   * Récupère le profil de l'athlète authentifié
   * @returns {Promise<Object>} - Profil de l'athlète
   */
  async getAthleteProfile() {
    return this.makeApiCall('/athlete');
  }
  
  /**
   * Récupère les statistiques de l'athlète
   * @param {string} athleteId - ID de l'athlète
   * @returns {Promise<Object>} - Statistiques de l'athlète
   */
  async getAthleteStats(athleteId) {
    return this.makeApiCall(`/athletes/${athleteId}/stats`);
  }
  
  /**
   * Crée une nouvelle activité
   * @param {Object} activityData - Données de l'activité à créer
   * @returns {Promise<Object>} - Activité créée
   */
  async createActivity(activityData) {
    return this.makeApiCall('/activities', 'POST', activityData);
  }
  
  /**
   * Met à jour une activité existante
   * @param {string} activityId - ID de l'activité à mettre à jour
   * @param {Object} activityData - Données à mettre à jour
   * @returns {Promise<Object>} - Activité mise à jour
   */
  async updateActivity(activityId, activityData) {
    return this.makeApiCall(`/activities/${activityId}`, 'PUT', activityData);
  }
}

// Exporter une instance unique
module.exports = new StravaApiUtils();
