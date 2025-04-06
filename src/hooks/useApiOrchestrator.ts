// src/hooks/useApiOrchestrator.ts
import { useContext } from 'react';
import { ApiOrchestratorContext } from '../contexts/ApiOrchestratorContext';

/**
 * Hook personnalisé pour accéder à l'orchestrateur d'API
 * Permet d'accéder à toutes les API externes et services backend de manière unifiée
 */
export const useApiOrchestrator = () => {
  const orchestrator = useContext(ApiOrchestratorContext);
  
  if (!orchestrator) {
    throw new Error('useApiOrchestrator doit être utilisé à l\'intérieur d\'un ApiOrchestratorProvider');
  }
  
  return orchestrator;
};

export default useApiOrchestrator;
