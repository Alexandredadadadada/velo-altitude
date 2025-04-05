import axios from 'axios';
import config from '../config';

/**
 * Service pour gérer les requêtes liées aux cols
 */

// Cache pour optimiser les requêtes
const colsCache = {};

/**
 * Récupère les détails d'un col par son ID
 * @param {string} colId - Identifiant unique du col
 * @returns {Promise<Object>} - Données détaillées du col
 */
export const getColDetailById = async (colId) => {
  // Vérifier si les données sont déjà en cache
  if (colsCache[colId]) {
    return colsCache[colId];
  }

  try {
    const response = await axios.get(`/api/passes/cols/${colId}`);
    
    // Mettre en cache pour les futures requêtes
    colsCache[colId] = response.data;
    
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de la récupération des détails du col ${colId}:`, error);
    throw error;
  }
};

/**
 * Récupère tous les cols d'une région spécifique
 * @param {string} region - Nom de la région (ex: "Alpes", "Pyrénées", etc.)
 * @returns {Promise<Array>} - Liste des cols dans la région
 */
export const getColsByRegion = async (region) => {
  try {
    const response = await axios.get(`/api/passes/cols?region=${region}`);
    return response.data.cols || [];
  } catch (error) {
    console.error(`Erreur lors de la récupération des cols de la région ${region}:`, error);
    throw error;
  }
};

/**
 * Récupère les cols en fonction de filtres spécifiques
 * @param {Object} filters - Filtres à appliquer (difficulté, altitude min/max, région, etc.)
 * @returns {Promise<Array>} - Liste des cols correspondant aux critères
 */
export const getColsByFilters = async (filters) => {
  try {
    // Construire les paramètres de requête à partir des filtres
    const params = new URLSearchParams();
    
    if (filters.difficulty) {
      params.append('difficulty', filters.difficulty);
    }
    
    if (filters.minElevation) {
      params.append('minElevation', filters.minElevation);
    }
    
    if (filters.maxElevation) {
      params.append('maxElevation', filters.maxElevation);
    }
    
    if (filters.region) {
      params.append('region', filters.region);
    }
    
    if (filters.country) {
      params.append('country', filters.country);
    }
    
    if (filters.minLength) {
      params.append('minLength', filters.minLength);
    }
    
    if (filters.minGradient) {
      params.append('minGradient', filters.minGradient);
    }
    
    const response = await axios.get(`/api/passes/cols?${params.toString()}`);
    return response.data.cols || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des cols filtrés:', error);
    throw error;
  }
};

/**
 * Récupère les cols les plus populaires
 * @param {number} limit - Nombre maximum de cols à récupérer
 * @returns {Promise<Array>} - Liste des cols les plus populaires
 */
export const getMostPopularCols = async (limit = 10) => {
  try {
    const response = await axios.get(`/api/passes/cols/popular?limit=${limit}`);
    return response.data.cols || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des cols populaires:', error);
    throw error;
  }
};

/**
 * Récupère les cols à proximité d'une position géographique
 * @param {number} latitude - Latitude de la position
 * @param {number} longitude - Longitude de la position
 * @param {number} radius - Rayon de recherche en kilomètres
 * @returns {Promise<Array>} - Liste des cols à proximité
 */
export const getColsNearby = async (latitude, longitude, radius = 50) => {
  try {
    const response = await axios.get(`/api/passes/cols/nearby?lat=${latitude}&lng=${longitude}&radius=${radius}`);
    return response.data.cols || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des cols à proximité:', error);
    throw error;
  }
};

/**
 * Récupère les prévisions météo pour un col spécifique
 * @param {string} colId - Identifiant unique du col
 * @returns {Promise<Object>} - Prévisions météo pour le col
 */
export const getColWeather = async (colId) => {
  try {
    const response = await axios.get(`/api/passes/cols/${colId}/weather`);
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de la récupération de la météo pour le col ${colId}:`, error);
    throw error;
  }
};

/**
 * Récupère les activités récentes sur un col spécifique (via Strava ou autres)
 * @param {string} colId - Identifiant unique du col
 * @param {number} limit - Nombre maximum d'activités à récupérer
 * @returns {Promise<Array>} - Liste des activités récentes
 */
export const getRecentColActivities = async (colId, limit = 5) => {
  try {
    const response = await axios.get(`/api/passes/cols/${colId}/activities?limit=${limit}`);
    return response.data.activities || [];
  } catch (error) {
    console.error(`Erreur lors de la récupération des activités récentes pour le col ${colId}:`, error);
    throw error;
  }
};

/**
 * Récupère les itinéraires recommandés pour un col spécifique
 * @param {string} colId - Identifiant unique du col
 * @returns {Promise<Array>} - Liste des itinéraires recommandés
 */
export const getRecommendedRoutesForCol = async (colId) => {
  try {
    const response = await axios.get(`/api/passes/cols/${colId}/recommended-routes`);
    return response.data.routes || [];
  } catch (error) {
    console.error(`Erreur lors de la récupération des itinéraires recommandés pour le col ${colId}:`, error);
    throw error;
  }
};

export default {
  getColDetailById,
  getColsByRegion,
  getColsByFilters,
  getMostPopularCols,
  getColsNearby,
  getColWeather,
  getRecentColActivities,
  getRecommendedRoutesForCol
};
