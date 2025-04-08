/**
 * RealApiOrchestratorProvider
 * 
 * Ce composant fournit l'orchestrateur d'API réel à tous les composants de l'application
 * via React Context. Il remplace complètement l'ancien provider basé sur des données mockées.
 */

import React, { createContext, useContext } from 'react';
import RealApiOrchestrator from '../services/api/RealApiOrchestratorCombined';

// Créer le contexte
const ApiOrchestratorContext = createContext(null);

/**
 * Hook personnalisé pour accéder à l'orchestrateur d'API
 * @returns {Object} Instance de l'orchestrateur d'API
 */
export const useApiOrchestrator = () => {
  const context = useContext(ApiOrchestratorContext);
  
  if (!context) {
    throw new Error('useApiOrchestrator doit être utilisé à l\'intérieur d\'un ApiOrchestratorProvider');
  }
  
  return context;
};

/**
 * Provider pour l'orchestrateur d'API réel
 * @param {Object} props - Props du composant
 * @param {ReactNode} props.children - Composants enfants
 */
export const RealApiOrchestratorProvider = ({ children }) => {
  // Log pour indiquer que nous utilisons l'orchestrateur réel
  console.log('[API] Utilisation de l\'orchestrateur d\'API réel');
  
  return (
    <ApiOrchestratorContext.Provider value={RealApiOrchestrator}>
      {children}
    </ApiOrchestratorContext.Provider>
  );
};

// Alias pour compatibilité avec le code existant
export const ApiOrchestratorProvider = RealApiOrchestratorProvider;

export default RealApiOrchestratorProvider;
