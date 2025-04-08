/**
 * Utilitaires pour l'accès aux API
 * 
 * Ce fichier contient des fonctions utilitaires pour simplifier l'accès
 * aux services d'API en dehors des composants React.
 */

import RealApiOrchestrator from './RealApiOrchestratorCombined';

/**
 * Récupère l'instance de l'orchestrateur d'API réel
 * Cette fonction peut être utilisée dans des services qui ne sont pas des composants React
 * @returns {Object} L'instance de RealApiOrchestrator
 */
export const getRealApiOrchestrator = () => {
  return RealApiOrchestrator;
};

// Créer l'objet d'export par défaut avant de l'exporter
const apiUtils = {
  getRealApiOrchestrator
};

export default apiUtils;
