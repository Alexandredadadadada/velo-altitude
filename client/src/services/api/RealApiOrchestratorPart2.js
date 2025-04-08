/**
 * RealApiOrchestratorPart2
 * 
 * Suite de l'implémentation de l'interface ApiOrchestrator.
 * Contient les méthodes pour les défis 7 Majeurs, météo, entraînement et nutrition.
 */

import { api } from '../../config/apiConfig';
import apiErrorHandler from '../errorHandling/apiErrorHandler';
import monitoringService from '../monitoring/MonitoringService';

// Fonction de gestion d'erreur identique à RealApiOrchestrator.js
const handleError = (error, operation) => {
  console.error(`[RealApiOrchestrator] Error in ${operation}:`, error);
  
  monitoringService.trackError(error, {
    moduleName: 'RealApiOrchestrator',
    operation
  });
  
  return Promise.reject(error);
};

/**
 * Partie 2 de l'orchestrateur d'API réel
 */
class RealApiOrchestratorPart2 {
  
  // #region Services des défis 7 Majeurs
  /**
   * Récupère tous les défis 7 Majeurs
   * @returns {Promise<Array>} Liste des défis
   */
  async getAllMajeurs7Challenges() {
    try {
      const data = await api.get('/majeurs7/challenges');
      return data;
    } catch (error) {
      return handleError(error, 'getAllMajeurs7Challenges');
    }
  }

  /**
   * Récupère un défi 7 Majeurs par son ID
   * @param {string} id - ID du défi
   * @returns {Promise<Object>} Détails du défi
   */
  async getMajeurs7Challenge(id) {
    try {
      const data = await api.get(`/majeurs7/challenges/${id}`);
      return data;
    } catch (error) {
      return handleError(error, 'getMajeurs7Challenge');
    }
  }

  /**
   * Démarre un défi 7 Majeurs pour un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {string} challengeId - ID du défi
   * @returns {Promise<Object>} Progression initialisée
   */
  async startMajeurs7Challenge(userId, challengeId) {
    try {
      const data = await api.post(`/users/${userId}/majeurs7`, { challengeId });
      return data;
    } catch (error) {
      return handleError(error, 'startMajeurs7Challenge');
    }
  }

  /**
   * Récupère la progression d'un utilisateur sur un défi 7 Majeurs
   * @param {string} userId - ID de l'utilisateur
   * @param {string} challengeId - ID du défi
   * @returns {Promise<Object>} Progression
   */
  async getMajeurs7Progress(userId, challengeId) {
    try {
      const data = await api.get(`/users/${userId}/majeurs7/${challengeId}`);
      return data;
    } catch (error) {
      return handleError(error, 'getMajeurs7Progress');
    }
  }

  /**
   * Met à jour la progression d'un utilisateur sur un défi 7 Majeurs
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} progress - Données de progression
   * @returns {Promise<Object>} Progression mise à jour
   */
  async updateMajeurs7Progress(userId, progress) {
    try {
      const data = await api.patch(`/users/${userId}/majeurs7/${progress.challengeId}`, progress);
      return data;
    } catch (error) {
      return handleError(error, 'updateMajeurs7Progress');
    }
  }
  // #endregion

  // #region Services météo
  /**
   * Récupère les données météo pour un col
   * @param {string} colId - ID du col
   * @returns {Promise<Object>} Données météo
   */
  async getColWeather(colId) {
    try {
      const data = await api.get(`/weather/col/${colId}`);
      return data;
    } catch (error) {
      return handleError(error, 'getColWeather');
    }
  }

  /**
   * Récupère les données météo pour des coordonnées
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise<Object>} Données météo
   */
  async getLocationWeather(lat, lng) {
    try {
      const data = await api.get('/weather/location', {
        params: { lat, lng }
      });
      return data;
    } catch (error) {
      return handleError(error, 'getLocationWeather');
    }
  }

  /**
   * Récupère les prévisions météo pour un col
   * @param {string} colId - ID du col
   * @param {number} days - Nombre de jours de prévision
   * @returns {Promise<Array>} Prévisions
   */
  async getWeatherForecast(colId, days = 5) {
    try {
      const data = await api.get(`/weather/forecast/col/${colId}`, {
        params: { days }
      });
      return data;
    } catch (error) {
      return handleError(error, 'getWeatherForecast');
    }
  }
  // #endregion

  // #region Services d'entraînement
  /**
   * Récupère tous les plans d'entraînement d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Array>} Plans d'entraînement
   */
  async getUserTrainingPlans(userId) {
    try {
      const data = await api.get(`/users/${userId}/training/plans`);
      return data;
    } catch (error) {
      return handleError(error, 'getUserTrainingPlans');
    }
  }

  /**
   * Récupère un plan d'entraînement par son ID
   * @param {string} planId - ID du plan
   * @returns {Promise<Object>} Plan d'entraînement
   */
  async getTrainingPlan(planId) {
    try {
      const data = await api.get(`/training/plans/${planId}`);
      return data;
    } catch (error) {
      return handleError(error, 'getTrainingPlan');
    }
  }

  /**
   * Crée un nouveau plan d'entraînement
   * @param {Object} plan - Données du plan
   * @returns {Promise<Object>} Plan créé
   */
  async createTrainingPlan(plan) {
    try {
      const data = await api.post('/training/plans', plan);
      return data;
    } catch (error) {
      return handleError(error, 'createTrainingPlan');
    }
  }

  /**
   * Met à jour un plan d'entraînement
   * @param {string} planId - ID du plan
   * @param {Object} data - Données à mettre à jour
   * @returns {Promise<Object>} Plan mis à jour
   */
  async updateTrainingPlan(planId, data) {
    try {
      const result = await api.patch(`/training/plans/${planId}`, data);
      return result;
    } catch (error) {
      return handleError(error, 'updateTrainingPlan');
    }
  }

  /**
   * Met à jour la valeur FTP d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {number} value - Nouvelle valeur FTP
   * @param {string} method - Méthode de détermination
   * @returns {Promise<Object>} Entrée FTP créée
   */
  async updateFTP(userId, value, method) {
    try {
      const data = await api.post(`/users/${userId}/training/ftp`, { value, method });
      return data;
    } catch (error) {
      return handleError(error, 'updateFTP');
    }
  }

  /**
   * Récupère l'historique FTP d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Array>} Historique FTP
   */
  async getFTPHistory(userId) {
    try {
      const data = await api.get(`/users/${userId}/training/ftp`);
      return data;
    } catch (error) {
      return handleError(error, 'getFTPHistory');
    }
  }
  // #endregion

  // #region Services de nutrition
  /**
   * Récupère les données nutritionnelles d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Données nutritionnelles
   */
  async getNutritionData(userId) {
    try {
      const data = await api.get(`/users/${userId}/nutrition`);
      return data;
    } catch (error) {
      return handleError(error, 'getNutritionData');
    }
  }

  /**
   * Récupère le plan nutritionnel d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Plan nutritionnel
   */
  async getUserNutritionPlan(userId) {
    try {
      const data = await api.get(`/users/${userId}/nutrition/plan`);
      return data;
    } catch (error) {
      return handleError(error, 'getUserNutritionPlan');
    }
  }

  /**
   * Met à jour le plan nutritionnel
   * @param {string} planId - ID du plan
   * @param {Object} data - Données à mettre à jour
   * @returns {Promise<Object>} Plan mis à jour
   */
  async updateNutritionPlan(planId, data) {
    try {
      const result = await api.patch(`/nutrition/plans/${planId}`, data);
      return result;
    } catch (error) {
      return handleError(error, 'updateNutritionPlan');
    }
  }

  /**
   * Récupère le journal nutritionnel pour une date
   * @param {string} userId - ID de l'utilisateur
   * @param {string} date - Date au format YYYY-MM-DD
   * @returns {Promise<Object>} Journal nutritionnel
   */
  async getNutritionLog(userId, date) {
    try {
      const data = await api.get(`/users/${userId}/nutrition/log`, {
        params: { date }
      });
      return data;
    } catch (error) {
      return handleError(error, 'getNutritionLog');
    }
  }

  /**
   * Crée une entrée dans le journal nutritionnel
   * @param {Object} log - Données du journal
   * @returns {Promise<Object>} Entrée créée
   */
  async createNutritionLogEntry(log) {
    try {
      const data = await api.post(`/users/${log.userId}/nutrition/log`, log);
      return data;
    } catch (error) {
      return handleError(error, 'createNutritionLogEntry');
    }
  }

  /**
   * Crée un nouveau plan de repas pour un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} planData - Données du plan de repas
   * @returns {Promise<Object>} Plan de repas créé
   */
  async createMealPlan(userId, planData) {
    try {
      const data = await api.post(`/users/${userId}/nutrition/plans`, planData);
      return data;
    } catch (error) {
      return handleError(error, 'createMealPlan');
    }
  }

  /**
   * Récupère des recettes selon critères
   * @param {string} query - Termes de recherche
   * @param {Array} tags - Tags des recettes
   * @returns {Promise<Array>} Recettes correspondantes
   */
  async getNutritionRecipes(query = '', tags = []) {
    try {
      const params = {};
      if (query) params.q = query;
      if (tags && tags.length) params.tags = tags.join(',');
      
      const data = await api.get('/nutrition/recipes', { params });
      return data;
    } catch (error) {
      return handleError(error, 'getNutritionRecipes');
    }
  }

  /**
   * Récupère une recette par son ID
   * @param {string} recipeId - ID de la recette
   * @returns {Promise<Object>} Détails de la recette
   */
  async getNutritionRecipe(recipeId) {
    try {
      const data = await api.get(`/nutrition/recipes/${recipeId}`);
      return data;
    } catch (error) {
      return handleError(error, 'getNutritionRecipe');
    }
  }
  // #endregion
}

// Continue dans RealApiOrchestratorPart3.js...

export default new RealApiOrchestratorPart2();
