import axios from 'axios';

const API_URL = '/api';

/**
 * Service pour gérer les appels API liés aux visualisations
 */
class VisualizationService {
  /**
   * Récupère les données de visualisation pour un col spécifique
   * @param {string} passId - L'identifiant du col
   * @returns {Promise} - La promesse contenant les données du col
   */
  getPassVisualization(passId) {
    return axios.get(`${API_URL}/visualization/passes/${passId}/visualization`);
  }

  /**
   * Récupère les données pour la visualisation 3D d'un col
   * @param {string} passId - L'identifiant du col
   * @returns {Promise} - La promesse contenant les données 3D
   */
  get3DPassVisualization(passId) {
    return axios.get(`${API_URL}/visualization/passes/${passId}/3d`);
  }

  /**
   * Récupère les annotations pour un col spécifique
   * @param {string} passId - L'identifiant du col
   * @returns {Promise} - La promesse contenant les annotations
   */
  getPassAnnotations(passId) {
    return axios.get(`${API_URL}/visualization/passes/${passId}/annotations`);
  }

  /**
   * Récupère les données pour comparer deux cols
   * @param {string} passId1 - L'identifiant du premier col
   * @param {string} passId2 - L'identifiant du deuxième col
   * @returns {Promise} - La promesse contenant les données de comparaison
   */
  comparePassesData(passId1, passId2) {
    return axios.get(`${API_URL}/visualization/passes/compare`, {
      params: { firstPassId: passId1, secondPassId: passId2 }
    });
  }

  /**
   * Récupère les métadonnées pour la comparaison des cols
   * @returns {Promise} - La promesse contenant les métadonnées
   */
  getPassComparisonMetadata() {
    return axios.get(`${API_URL}/visualization/passes/comparison/metadata`);
  }

  /**
   * Exporte une comparaison de cols au format spécifié
   * @param {string} passId1 - L'identifiant du premier col
   * @param {string} passId2 - L'identifiant du deuxième col
   * @param {string} format - Le format d'export (pdf, png, etc.)
   * @returns {Promise} - La promesse contenant l'URL du fichier exporté
   */
  exportPassComparison(passId1, passId2, format) {
    return axios.post(`${API_URL}/visualization/passes/export`, {
      firstPassId: passId1,
      secondPassId: passId2,
      format: format
    });
  }
}

export default new VisualizationService();
