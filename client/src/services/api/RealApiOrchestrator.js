/**
 * RealApiOrchestrator
 * 
 * Implémentation de l'interface ApiOrchestrator qui se connecte à de vrais endpoints API
 * au lieu d'utiliser des données mockées. Ce service remplace entièrement l'utilisation
 * des mocks intrusifs qui existaient précédemment.
 */

import { api } from '../../config/apiConfig';
import apiErrorHandler from '../errorHandling/apiErrorHandler';
import monitoringService from '../monitoring/MonitoringService';

/**
 * Transforme une erreur en un format standard et la rejette
 * @param {Error} error - L'erreur à traiter
 * @param {string} operation - L'opération qui a échoué
 */
const handleError = (error, operation) => {
  console.error(`[RealApiOrchestrator] Error in ${operation}:`, error);
  
  // Journaliser l'erreur
  monitoringService.trackError(error, {
    moduleName: 'RealApiOrchestrator',
    operation
  });
  
  // Rejeter l'erreur transformée
  return Promise.reject(error);
};

/**
 * Implémentation de l'orchestrateur d'API réelle
 */
class RealApiOrchestrator {
  
  // #region Services des cols
  /**
   * Récupère tous les cols
   * @returns {Promise<Array>} Liste des cols
   */
  async getAllCols() {
    try {
      const data = await api.get('/cols');
      return data;
    } catch (error) {
      return handleError(error, 'getAllCols');
    }
  }

  /**
   * Récupère un col par son ID
   * @param {string} id - ID du col à récupérer
   * @returns {Promise<Object>} Détails du col
   */
  async getColById(id) {
    try {
      const data = await api.get(`/cols/${id}`);
      return data;
    } catch (error) {
      return handleError(error, 'getColById');
    }
  }

  /**
   * Récupère les cols par région
   * @param {string} region - Région à filtrer
   * @returns {Promise<Array>} Liste des cols dans la région
   */
  async getColsByRegion(region) {
    try {
      const data = await api.get('/cols', { params: { region } });
      return data;
    } catch (error) {
      return handleError(error, 'getColsByRegion');
    }
  }

  /**
   * Récupère les cols par niveau de difficulté
   * @param {string} difficulty - Niveau de difficulté
   * @returns {Promise<Array>} Liste des cols correspondants
   */
  async getColsByDifficulty(difficulty) {
    try {
      const data = await api.get('/cols', { params: { difficulty } });
      return data;
    } catch (error) {
      return handleError(error, 'getColsByDifficulty');
    }
  }

  /**
   * Recherche des cols par requête
   * @param {string} query - Termes de recherche
   * @returns {Promise<Array>} Liste des cols correspondants
   */
  async searchCols(query) {
    try {
      const data = await api.get('/cols/search', { params: { q: query } });
      return data;
    } catch (error) {
      return handleError(error, 'searchCols');
    }
  }
  // #endregion

  // #region Services utilisateur
  /**
   * Récupère le profil d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Profil utilisateur
   */
  async getUserProfile(userId) {
    try {
      const data = await api.get(`/users/${userId}/profile`);
      return data;
    } catch (error) {
      return handleError(error, 'getUserProfile');
    }
  }

  /**
   * Met à jour le profil d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} data - Données à mettre à jour
   * @returns {Promise<Object>} Profil mis à jour
   */
  async updateUserProfile(userId, data) {
    try {
      const result = await api.patch(`/users/${userId}/profile`, data);
      return result;
    } catch (error) {
      return handleError(error, 'updateUserProfile');
    }
  }

  /**
   * Récupère les activités d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {number} page - Numéro de page
   * @param {number} pageSize - Taille de la page
   * @returns {Promise<Object>} Activités paginées
   */
  async getUserActivities(userId, page = 1, pageSize = 10) {
    try {
      const data = await api.get(`/users/${userId}/activities`, {
        params: { page, pageSize }
      });
      return data;
    } catch (error) {
      return handleError(error, 'getUserActivities');
    }
  }
  // #endregion

  // #region Services d'activité
  /**
   * Crée une nouvelle activité
   * @param {Object} activity - Données de l'activité
   * @returns {Promise<Object>} Activité créée
   */
  async createActivity(activity) {
    try {
      const data = await api.post('/activities', activity);
      return data;
    } catch (error) {
      return handleError(error, 'createActivity');
    }
  }

  /**
   * Récupère une activité par son ID
   * @param {string} id - ID de l'activité
   * @returns {Promise<Object>} Détails de l'activité
   */
  async getActivity(id) {
    try {
      const data = await api.get(`/activities/${id}`);
      return data;
    } catch (error) {
      return handleError(error, 'getActivity');
    }
  }

  /**
   * Met à jour une activité
   * @param {string} id - ID de l'activité
   * @param {Object} data - Données à mettre à jour
   * @returns {Promise<Object>} Activité mise à jour
   */
  async updateActivity(id, data) {
    try {
      const result = await api.patch(`/activities/${id}`, data);
      return result;
    } catch (error) {
      return handleError(error, 'updateActivity');
    }
  }

  /**
   * Supprime une activité
   * @param {string} id - ID de l'activité
   * @returns {Promise<void>}
   */
  async deleteActivity(id) {
    try {
      await api.delete(`/activities/${id}`);
    } catch (error) {
      return handleError(error, 'deleteActivity');
    }
  }
  // #endregion
}

// Continue dans RealApiOrchestratorPart2.js...

export default new RealApiOrchestrator();
