import axios from 'axios';

const API_URL = '/api';

/**
 * Service pour gérer les appels API liés aux itinéraires alternatifs
 */
class RouteAlternativesService {
  /**
   * Récupère les alternatives d'un itinéraire basées sur la météo
   * @param {string} routeId - L'identifiant de l'itinéraire
   * @param {Object} weatherConditions - Les conditions météo
   * @returns {Promise} - La promesse contenant les alternatives météo
   */
  getWeatherBasedAlternatives(routeId, weatherConditions) {
    return axios.get(`${API_URL}/route-alternatives/${routeId}/weather`, {
      params: weatherConditions
    });
  }

  /**
   * Récupère les alternatives d'un itinéraire basées sur le profil cycliste
   * @param {string} routeId - L'identifiant de l'itinéraire
   * @param {string} profileType - Le type de profil cycliste
   * @returns {Promise} - La promesse contenant les alternatives
   */
  getProfileBasedAlternatives(routeId, profileType) {
    return axios.get(`${API_URL}/route-alternatives/${routeId}/profile/${profileType}`);
  }

  /**
   * Récupère les prévisions météo pour un itinéraire
   * @param {string} routeId - L'identifiant de l'itinéraire
   * @returns {Promise} - La promesse contenant les prévisions météo
   */
  getRouteWeatherForecast(routeId) {
    return axios.get(`${API_URL}/route-alternatives/${routeId}/weather-forecast`);
  }

  /**
   * Recommande un profil cycliste en fonction d'un itinéraire et des conditions météo
   * @param {string} routeId - L'identifiant de l'itinéraire
   * @param {Object} weatherConditions - Les conditions météo
   * @returns {Promise} - La promesse contenant le profil recommandé
   */
  getRecommendedProfile(routeId, weatherConditions) {
    return axios.post(`${API_URL}/route-alternatives/${routeId}/recommend-profile`, {
      weatherConditions
    });
  }

  /**
   * Sauvegarde un itinéraire alternatif pour utilisation future
   * @param {string} routeId - L'identifiant de l'itinéraire principal
   * @param {string} alternativeId - L'identifiant de l'alternative
   * @param {Object} userData - Les données utilisateur
   * @returns {Promise} - La promesse contenant le résultat de la sauvegarde
   */
  saveAlternativeRoute(routeId, alternativeId, userData) {
    return axios.post(`${API_URL}/route-alternatives/${routeId}/save`, {
      alternativeId,
      userData
    });
  }

  /**
   * Récupère les types de profils cyclistes disponibles
   * @returns {Promise} - La promesse contenant les types de profils
   */
  getAvailableProfileTypes() {
    return axios.get(`${API_URL}/route-alternatives/profile-types`);
  }
}

export default new RouteAlternativesService();
