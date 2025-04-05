/**
 * Service pour l'interface d'administration
 * Gère les appels API aux fonctionnalités réservées aux administrateurs
 */
import axios from 'axios';
import authService from './authService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Récupère les métriques de performance
 * @param {string} timeRange - Période (day, week, month)
 * @returns {Promise<Object>} - Données de performance
 */
const getPerformanceMetrics = async (timeRange = 'day') => {
  try {
    const token = authService.getToken();
    
    const response = await axios.get(`${API_URL}/admin/performance`, {
      params: { timeRange },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des métriques de performance:', error);
    throw error;
  }
};

/**
 * Exporte les métriques de performance au format CSV
 * @param {string} timeRange - Période (day, week, month)
 * @returns {Promise<Blob>} - Fichier CSV
 */
const exportPerformanceMetrics = async (timeRange = 'day') => {
  try {
    const token = authService.getToken();
    
    const response = await axios.get(`${API_URL}/admin/performance/export`, {
      params: { timeRange },
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'text/csv'
      },
      responseType: 'blob'
    });
    
    return response.data;
  } catch (error) {
    console.error('Erreur lors de l\'export des métriques de performance:', error);
    throw error;
  }
};

/**
 * Récupère la liste des sessions actives
 * @returns {Promise<Array>} - Liste des sessions
 */
const getActiveSessions = async () => {
  try {
    const token = authService.getToken();
    
    const response = await axios.get(`${API_URL}/admin/sessions`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des sessions actives:', error);
    throw error;
  }
};

/**
 * Récupère les alertes de performance
 * @param {Object} filters - Filtres (severity, startDate, endDate)
 * @returns {Promise<Array>} - Liste des alertes
 */
const getPerformanceAlerts = async (filters = {}) => {
  try {
    const token = authService.getToken();
    
    const response = await axios.get(`${API_URL}/admin/alerts`, {
      params: filters,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des alertes:', error);
    throw error;
  }
};

/**
 * Exécute une action de maintenance système
 * @param {string} action - Type d'action (clearCache, restartService, etc.)
 * @param {Object} params - Paramètres additionnels
 * @returns {Promise<Object>} - Résultat de l'opération
 */
const executeMaintenanceAction = async (action, params = {}) => {
  try {
    const token = authService.getToken();
    
    const response = await axios.post(`${API_URL}/admin/maintenance/${action}`, params, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de l'exécution de l'action de maintenance ${action}:`, error);
    throw error;
  }
};

/**
 * Met à jour les paramètres de monitoring
 * @param {Object} settings - Nouveaux paramètres
 * @returns {Promise<Object>} - Paramètres mis à jour
 */
const updateMonitoringSettings = async (settings) => {
  try {
    const token = authService.getToken();
    
    const response = await axios.put(`${API_URL}/admin/monitoring/settings`, settings, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres de monitoring:', error);
    throw error;
  }
};

/**
 * Récupère les métriques du rendu 3D
 * @param {string} timeRange - Période (day, week, month)
 * @returns {Promise<Object>} - Données de performance du rendu 3D
 */
const get3DRenderingMetrics = async (timeRange = 'day') => {
  try {
    const token = authService.getToken();
    
    const response = await axios.get(`${API_URL}/admin/performance/3d`, {
      params: { timeRange },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des métriques de rendu 3D:', error);
    throw error;
  }
};

/**
 * Récupère les métriques de rendu des cartes
 * @param {string} timeRange - Période (day, week, month)
 * @returns {Promise<Object>} - Données de performance du rendu des cartes
 */
const getMapRenderingMetrics = async (timeRange = 'day') => {
  try {
    const token = authService.getToken();
    
    const response = await axios.get(`${API_URL}/admin/performance/maps`, {
      params: { timeRange },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des métriques de rendu des cartes:', error);
    throw error;
  }
};

/**
 * Recherche dans les logs de performance
 * @param {Object} query - Critères de recherche
 * @returns {Promise<Array>} - Résultats de recherche
 */
const searchPerformanceLogs = async (query) => {
  try {
    const token = authService.getToken();
    
    const response = await axios.post(`${API_URL}/admin/logs/search`, query, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la recherche dans les logs:', error);
    throw error;
  }
};

/**
 * Récupère les métriques nutritionnelles
 * @param {string} timeRange - Période (day, week, month)
 * @returns {Promise<Object>} - Données de performance nutritionnelle
 */
const getNutritionMetrics = async (timeRange = 'day') => {
  try {
    const token = authService.getToken();
    
    const response = await axios.get(`${API_URL}/admin/performance/nutrition`, {
      params: { timeRange },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des métriques nutritionnelles:', error);
    throw error;
  }
};

/**
 * Récupère les alertes actives du système
 * @returns {Promise<Array>} - Liste des alertes actives
 */
const getActiveAlerts = async () => {
  try {
    const token = authService.getToken();
    
    const response = await axios.get(`${API_URL}/admin/alerts/active`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des alertes actives:', error);
    throw error;
  }
};

/**
 * Acquitte une alerte
 * @param {string} alertId - ID de l'alerte à acquitter
 * @returns {Promise<Object>} - Résultat de l'opération
 */
const acknowledgeAlert = async (alertId) => {
  try {
    const token = authService.getToken();
    
    const response = await axios.post(`${API_URL}/admin/alerts/${alertId}/acknowledge`, {}, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de l'acquittement de l'alerte ${alertId}:`, error);
    throw error;
  }
};

const adminService = {
  getPerformanceMetrics,
  exportPerformanceMetrics,
  getActiveSessions,
  getPerformanceAlerts,
  executeMaintenanceAction,
  updateMonitoringSettings,
  get3DRenderingMetrics,
  getMapRenderingMetrics,
  searchPerformanceLogs,
  getNutritionMetrics,
  getActiveAlerts,
  acknowledgeAlert
};

export default adminService;
