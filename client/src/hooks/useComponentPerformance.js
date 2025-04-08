import { useRef, useEffect } from 'react';
import monitoringService from '../services/monitoring/MonitoringService';

/**
 * Hook pour mesurer les performances de rendu des composants React
 * Utilisé pour identifier les composants lents et optimiser les performances
 * 
 * @param {string} componentName - Nom du composant pour l'identification
 * @param {Object} options - Options supplémentaires
 * @param {number} options.threshold - Seuil en ms au-delà duquel le rendu est considéré comme lent (par défaut: 50ms)
 * @param {boolean} options.logToConsole - Log les métriques dans la console (uniquement en dev)
 * @param {boolean} options.trackProps - Tracker les changements de props qui déclenchent les rendus
 * @returns {Object} - Métriques de performance
 */
const useComponentPerformance = (componentName, options = {}) => {
  const {
    threshold = 50,
    logToConsole = process.env.NODE_ENV === 'development',
    trackProps = false
  } = options;
  
  // Référence pour stocker le timestamp du début du rendu
  const renderStartTimeRef = useRef(null);
  
  // Référence pour stocker les props précédentes pour comparaison
  const previousPropsRef = useRef(null);
  
  // Métriques cumulées
  const metricsRef = useRef({
    totalRenders: 0,
    totalRenderTime: 0,
    slowRenders: 0,
    maxRenderTime: 0,
    lastRenderTime: 0,
    averageRenderTime: 0
  });
  
  // Enregistrer le début du rendu
  renderStartTimeRef.current = performance.now();
  
  // Après le rendu
  useEffect(() => {
    // Calculer le temps de rendu
    const renderEndTime = performance.now();
    const renderTime = renderEndTime - renderStartTimeRef.current;
    
    // Mettre à jour les métriques
    const metrics = metricsRef.current;
    metrics.totalRenders += 1;
    metrics.totalRenderTime += renderTime;
    metrics.lastRenderTime = renderTime;
    metrics.averageRenderTime = metrics.totalRenderTime / metrics.totalRenders;
    
    if (renderTime > metrics.maxRenderTime) {
      metrics.maxRenderTime = renderTime;
    }
    
    // Déterminer si c'est un rendu lent
    const isSlowRender = renderTime > threshold;
    if (isSlowRender) {
      metrics.slowRenders += 1;
    }
    
    // Envoyer les métriques au service de monitoring
    monitoringService.trackComponentRender(componentName, renderTime);
    
    // Log dans la console en mode dev si demandé ou si c'est un rendu lent
    if (logToConsole || (isSlowRender && process.env.NODE_ENV === 'development')) {
      const performance = isSlowRender ? '🔴 LENT' : '🟢 OK';
      console.log(
        `[Perf] ${componentName} - Rendu ${performance}: ${renderTime.toFixed(2)}ms`,
        `(moy: ${metrics.averageRenderTime.toFixed(2)}ms, max: ${metrics.maxRenderTime.toFixed(2)}ms, lents: ${metrics.slowRenders}/${metrics.totalRenders})`
      );
    }
  });
  
  // Retourner les métriques actuelles
  return {
    ...metricsRef.current,
    isCurrentRenderSlow: () => {
      const currentRenderTime = performance.now() - renderStartTimeRef.current;
      return currentRenderTime > threshold;
    }
  };
};

export default useComponentPerformance;
