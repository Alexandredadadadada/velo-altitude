/**
 * RealApiOrchestratorProvider
 * 
 * Ce composant fournit l'orchestrateur d'API réel à tous les composants de l'application
 * via React Context. Il remplace complètement l'ancien provider basé sur des données mockées.
 * 
 * L'orchestrateur d'API centralise tous les appels API et implémente l'interface ApiOrchestrator
 * définie dans types/api.ts, permettant ainsi une utilisation cohérente des services d'API
 * à travers l'application.
 * 
 * Ce provider doit être placé dans la hiérarchie des composants après AuthProvider
 * et avant les composants qui utilisent les données d'API.
 */

import React, { createContext, useContext, ReactNode } from 'react';
import RealApiOrchestrator from '../services/api/RealApiOrchestrator';
import { ApiOrchestrator } from '../types/api';

// Créer le contexte
const ApiOrchestratorContext = createContext<ApiOrchestrator | null>(null);

/**
 * Fonction utilitaire pour exposer l'instance de RealApiOrchestrator
 * pour le débogage et les tests
 */
export const getRealApiOrchestrator = (): ApiOrchestrator => {
  return RealApiOrchestrator;
};

/**
 * Hook personnalisé pour accéder à l'orchestrateur d'API
 * @returns {ApiOrchestrator} Instance de l'orchestrateur d'API
 * @throws {Error} Si utilisé en dehors d'un ApiOrchestratorProvider
 * @example
 * const { apiOrchestrator } = useApiOrchestrator();
 * const cols = await apiOrchestrator.getAllCols();
 */
export const useApiOrchestrator = (): ApiOrchestrator => {
  const context = useContext(ApiOrchestratorContext);
  
  if (!context) {
    throw new Error('useApiOrchestrator doit être utilisé à l\'intérieur d\'un ApiOrchestratorProvider');
  }
  
  return context;
};

/**
 * Props pour le RealApiOrchestratorProvider
 */
interface RealApiOrchestratorProviderProps {
  /** Les composants enfants qui auront accès à l'orchestrateur d'API */
  children: ReactNode;
}

/**
 * Provider pour l'orchestrateur d'API réel
 * Ce composant doit être placé après AuthProvider dans la hiérarchie des providers
 * pour que les appels API puissent accéder au token d'authentification.
 * 
 * @param {RealApiOrchestratorProviderProps} props - Props du composant
 * @returns {JSX.Element} Provider React Context
 */
export const RealApiOrchestratorProvider: React.FC<RealApiOrchestratorProviderProps> = ({ children }) => {
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
