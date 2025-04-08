/**
 * Service pour la gestion des données des cols cyclistes
 * Utilise l'apiWrapper qui a été mis à jour pour utiliser les API réelles.
 * En mode développement, MSW intercepte les requêtes pour fournir des données mock.
 */
import api from './apiWrapper';

const ColService = {
  /**
   * Récupère la liste des cols cyclistes
   * @param {Object} options - Options de filtrage
   * @returns {Promise<Array>} Liste des cols
   */
  getAllCols: async (options = {}) => {
    try {
      // Construire les paramètres de requête
      const params = new URLSearchParams();
      if (options.region) params.append('region', options.region);
      if (options.difficulty) params.append('difficulty', options.difficulty);
      if (options.minElevation) params.append('minElevation', options.minElevation);
      if (options.maxElevation) params.append('maxElevation', options.maxElevation);
      if (options.surface && options.surface.length > 0) {
        options.surface.forEach(surface => {
          params.append('surface', surface.toLowerCase());
        });
      }
      if (options.technicalDifficulty) params.append('technicalDifficulty', options.technicalDifficulty);
      if (options.seasons && options.seasons.length > 0) {
        options.seasons.forEach(season => {
          params.append('season', season.toLowerCase());
        });
      }
      
      // Appel API
      const response = await api.get(`/cols${params.toString() ? `?${params.toString()}` : ''}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching cols:', error);
      throw error;
    }
  },
  
  /**
   * Récupère les détails d'un col spécifique
   * @param {string} colId - ID du col
   * @returns {Promise<Object>} Détails du col
   */
  getColById: async (colId) => {
    try {
      // Appel API
      const response = await api.get(`/cols/${colId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching col ${colId}:`, error);
      throw error;
    }
  },
  
  /**
   * Récupère les données d'élévation d'un col pour le graphique
   * @param {string} colId - ID du col
   * @returns {Promise<Array>} Données d'élévation
   */
  getColElevationData: async (colId) => {
    try {
      // Appel API
      const response = await api.get(`/cols/${colId}/elevation`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching elevation data for col ${colId}:`, error);
      throw error;
    }
  },
  
  /**
   * Récupère les données de terrain 3D d'un col pour la visualisation
   * @param {string} colId - ID du col
   * @returns {Promise<Object>} Données de terrain 3D
   */
  getCol3DTerrainData: async (colId) => {
    try {
      // Appel API
      const response = await api.get(`/cols/${colId}/terrain3d`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching 3D terrain data for col ${colId}:`, error);
      throw error;
    }
  }
};

export default ColService;
