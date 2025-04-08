import { apiWrapper as api } from '../utils/apiWrapper';

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
    return api.get(`/visualization/passes/${passId}/visualization`);
  }

  /**
   * Récupère les données pour la visualisation 3D d'un col
   * @param {string} passId - L'identifiant du col
   * @returns {Promise} - La promesse contenant les données 3D
   */
  get3DPassVisualization(passId) {
    return api.get(`/visualization/passes/${passId}/3d`);
  }

  /**
   * Récupère les annotations pour un col spécifique
   * @param {string} passId - L'identifiant du col
   * @returns {Promise} - La promesse contenant les annotations
   */
  getPassAnnotations(passId) {
    return api.get(`/visualization/passes/${passId}/annotations`);
  }

  /**
   * Récupère les données pour comparer deux cols
   * @param {string} passId1 - L'identifiant du premier col
   * @param {string} passId2 - L'identifiant du deuxième col
   * @returns {Promise} - La promesse contenant les données de comparaison
   */
  comparePassesData(passId1, passId2) {
    return api.get(`/visualization/passes/compare`, {
      params: { firstPassId: passId1, secondPassId: passId2 }
    });
  }

  /**
   * Récupère les métadonnées pour la comparaison des cols
   * @returns {Promise} - La promesse contenant les métadonnées
   */
  getPassComparisonMetadata() {
    return api.get(`/visualization/passes/comparison/metadata`);
  }

  /**
   * Exporte une comparaison de cols au format spécifié
   * @param {string} passId1 - L'identifiant du premier col
   * @param {string} passId2 - L'identifiant du deuxième col
   * @param {string} format - Le format d'export (pdf, png, etc.)
   * @returns {Promise} - La promesse contenant l'URL du fichier exporté
   */
  exportPassComparison(passId1, passId2, format) {
    return api.post(`/visualization/passes/export`, {
      firstPassId: passId1,
      secondPassId: passId2,
      format: format
    });
  }
}

export default new VisualizationService();
