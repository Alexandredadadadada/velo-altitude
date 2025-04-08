import api from './apiWrapper';
import { formatDate } from '../utils/formatters';

/**
 * Service de gestion des données d'entraînement
 * Utilise apiWrapper qui gère les appels API réels avec MSW en mode développement.
 */
class TrainingService {
  /**
   * Récupère les activités d'un utilisateur pour une période donnée
   * @param {string} userId - Identifiant de l'utilisateur
   * @param {string} timeframe - Période (week, month, year, all)
   * @returns {Promise<Object>} - Données des activités et résumé
   */
  async getActivities(userId, timeframe = 'month') {
    try {
      const response = await api.get(`/training/activities`, {
        params: { userId, timeframe }
      });
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des activités:', error);
      throw error;
    }
  }
  
  /**
   * Récupère une activité spécifique
   * @param {string} activityId - Identifiant de l'activité
   * @returns {Promise<Object>} - Données détaillées de l'activité
   */
  async getActivityById(activityId) {
    try {
      const response = await api.get(`/training/activities/${activityId}`);
      
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération de l'activité ${activityId}:`, error);
      throw error;
    }
  }
  
  /**
   * Crée une nouvelle activité
   * @param {Object} activityData - Données de l'activité
   * @returns {Promise<Object>} - Activité créée
   */
  async createActivity(activityData) {
    try {
      const response = await api.post(`/training/activities`, activityData);
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de l\'activité:', error);
      throw error;
    }
  }
  
  /**
   * Met à jour une activité existante
   * @param {string} activityId - Identifiant de l'activité
   * @param {Object} activityData - Nouvelles données
   * @returns {Promise<Object>} - Activité mise à jour
   */
  async updateActivity(activityId, activityData) {
    try {
      const response = await api.put(`/training/activities/${activityId}`, activityData);
      
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de l'activité ${activityId}:`, error);
      throw error;
    }
  }
  
  /**
   * Supprime une activité
   * @param {string} activityId - Identifiant de l'activité à supprimer
   * @returns {Promise<Object>} - Confirmation de suppression
   */
  async deleteActivity(activityId) {
    try {
      const response = await api.delete(`/training/activities/${activityId}`);
      
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la suppression de l'activité ${activityId}:`, error);
      throw error;
    }
  }
  
  /**
   * Importe une activité depuis un fichier GPX
   * @param {File} file - Fichier GPX
   * @param {Object} metadata - Métadonnées de l'activité
   * @returns {Promise<Object>} - Activité importée
   */
  async importFromGpx(file, metadata = {}) {
    try {
      const formData = new FormData();
      formData.append('gpxFile', file);
      
      // Ajouter les métadonnées au formulaire
      Object.keys(metadata).forEach(key => {
        formData.append(key, metadata[key]);
      });
      
      const response = await api.post(`/training/import-gpx`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'importation du fichier GPX:', error);
      throw error;
    }
  }
  
  /**
   * Récupère les statistiques d'entraînement
   * @param {string} userId - Identifiant de l'utilisateur
   * @param {string} timeframe - Période (week, month, year, all)
   * @returns {Promise<Object>} - Statistiques d'entraînement
   */
  async getTrainingStats(userId, timeframe = 'month') {
    try {
      const response = await api.get(`/training/stats`, {
        params: { userId, timeframe }
      });
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }
  
  /**
   * Récupère les objectifs d'entraînement
   * @param {string} userId - Identifiant de l'utilisateur
   * @returns {Promise<Array>} - Liste des objectifs
   */
  async getTrainingGoals(userId) {
    try {
      const response = await api.get(`/training/goals`, {
        params: { userId }
      });
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des objectifs:', error);
      throw error;
    }
  }
  
  /**
   * Crée un nouvel objectif d'entraînement
   * @param {Object} goalData - Données de l'objectif
   * @returns {Promise<Object>} - Objectif créé
   */
  async createTrainingGoal(goalData) {
    try {
      const response = await api.post(`/training/goals`, goalData);
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de l\'objectif:', error);
      throw error;
    }
  }
}

// Exporter une instance du service
const trainingService = new TrainingService();
export default trainingService;
