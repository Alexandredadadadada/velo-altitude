/**
 * Contexte de performances pour Velo-Altitude
 * Permet d'accéder aux outils de monitoring des performances depuis n'importe quel composant
 */

import React, { createContext, useContext } from 'react';
import enhancedPerformanceMonitoring from '../utils/enhancedPerformanceMonitoring';

// Création du contexte avec la valeur par défaut
const PerformanceContext = createContext(enhancedPerformanceMonitoring);

/**
 * Hook pour utiliser le contexte de performances
 */
export const usePerformance = () => {
  const context = useContext(PerformanceContext);
  
  if (!context) {
    throw new Error('usePerformance doit être utilisé à l\'intérieur d\'un PerformanceProvider');
  }
  
  return context;
};

/**
 * Fournisseur du contexte de performances
 */
export const PerformanceProvider = ({ children }) => {
  return (
    <PerformanceContext.Provider value={enhancedPerformanceMonitoring}>
      {children}
    </PerformanceContext.Provider>
  );
};

export default PerformanceContext;
