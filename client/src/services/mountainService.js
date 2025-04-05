import axios from 'axios';
import { API_BASE_URL } from '../config/constants';

/**
 * Service pour gérer les appels API du module Montagne
 * Gère les demandes liées aux cols, plans d'entraînement et nutrition
 */
const mountainService = {
  /**
   * Récupère tous les cols disponibles
   * @param {Object} filters - Filtres pour les cols (région, difficulté, etc.)
   * @returns {Promise} - Promesse contenant les données des cols
   */
  async getCols(filters = {}) {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/cols`, { params: filters });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des cols:', error);
      throw error;
    }
  },

  /**
   * Récupère les détails d'un col spécifique
   * @param {string} colId - Identifiant du col
   * @returns {Promise} - Promesse contenant les données du col
   */
  async getColDetails(colId) {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/cols/${colId}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des détails du col ${colId}:`, error);
      throw error;
    }
  },

  /**
   * Génère un plan d'entraînement spécifique pour un col
   * @param {string} colId - Identifiant du col
   * @param {Object} userMetrics - Métriques de l'utilisateur (FTP, poids, etc.)
   * @returns {Promise} - Promesse contenant le plan d'entraînement
   */
  async generateTrainingPlan(colId, userMetrics) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/mountain/training-plan`, {
        colId,
        userMetrics
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la génération du plan d\'entraînement:', error);
      throw error;
    }
  },

  /**
   * Génère un plan nutritionnel spécifique pour un col
   * @param {string} colId - Identifiant du col
   * @param {Object} userMetrics - Métriques de l'utilisateur (poids, préférences alimentaires, etc.)
   * @returns {Promise} - Promesse contenant le plan nutritionnel
   */
  async generateNutritionPlan(colId, userMetrics) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/mountain/nutrition-plan`, {
        colId,
        userMetrics
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la génération du plan nutritionnel:', error);
      throw error;
    }
  },

  /**
   * Récupère les plans d'entraînement régionaux
   * @param {string} region - Région (alpes, pyrenees, dolomites, ardennes)
   * @returns {Promise} - Promesse contenant les plans d'entraînement régionaux
   */
  async getRegionalTrainingPlans(region) {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/mountain/regional-plans/${region}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des plans régionaux pour ${region}:`, error);
      throw error;
    }
  },

  /**
   * Récupère les données de visualisation 3D pour un col
   * @param {string} colId - Identifiant du col
   * @returns {Promise} - Promesse contenant les données de visualisation 3D
   */
  async getCol3DVisualizationData(colId) {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/cols/${colId}/3d-data`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des données 3D pour le col ${colId}:`, error);
      throw error;
    }
  }
};

export default mountainService;
