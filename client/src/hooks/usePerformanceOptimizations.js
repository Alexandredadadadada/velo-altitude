/**
 * Hook personnalisé pour utiliser les optimisations de performance dans les composants React
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

// Importer les services d'optimisation
import perceivedPerformance from '../services/optimization/PerceivedPerformance';
import optimizedImageLoader from '../services/optimization/OptimizedImageLoader';
import resourcePrefetcher from '../services/optimization/ResourcePrefetcher';
import webVitalsMonitor from '../services/monitoring/WebVitalsMonitor';

/**
 * Hook pour appliquer des optimisations de performance dans un composant
 * @param {Object} options - Options de configuration
 * @returns {Object} Utilitaires et états d'optimisation
 */
const usePerformanceOptimizations = (options = {}) => {
  const {
    componentId = `component-${Math.random().toString(36).substr(2, 9)}`,
    trackPerformance = true,
    applySkeletons = true,
    optimizeImages = true,
    prefetchLinks = true,
    routePrefetching = false,
    adaptToNetworkConditions = true
  } = options;
  
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isNetworkLimited, setIsNetworkLimited] = useState(false);
  const [optimalQuality, setOptimalQuality] = useState('high');
  const componentRef = useRef(null);
  const renderStartTime = useRef(performance.now());
  
  // Détecter les conditions réseau limitées
  useEffect(() => {
    if (!adaptToNetworkConditions) return;
    
    const checkNetworkConditions = () => {
      let isLimited = false;
      
      if ('connection' in navigator) {
        const { effectiveType, saveData } = navigator.connection;
        
        // Marquer comme limité si économie de données activée ou connexion lente
        if (saveData || ['slow-2g', '2g', '3g'].includes(effectiveType)) {
          isLimited = true;
          setOptimalQuality(effectiveType === 'slow-2g' ? 'low' : 
                           effectiveType === '2g' ? 'low' : 'medium');
        } else {
          setOptimalQuality('high');
        }
      }
      
      setIsNetworkLimited(isLimited);
    };
    
    checkNetworkConditions();
    
    // Surveiller les changements de connexion
    if ('connection' in navigator && 'addEventListener' in navigator.connection) {
      navigator.connection.addEventListener('change', checkNetworkConditions);
      return () => navigator.connection.removeEventListener('change', checkNetworkConditions);
    }
  }, [adaptToNetworkConditions]);
  
  // Mesurer les performances de rendu du composant
  useEffect(() => {
    if (!trackPerformance) return;
    
    renderStartTime.current = performance.now();
    
    return () => {
      const renderDuration = performance.now() - renderStartTime.current;
      
      if (webVitalsMonitor && componentId && renderDuration > 50) {
        // Ne signaler que les rendus significatifs (> 50ms)
        webVitalsMonitor.recordComponentMetric(componentId, {
          renderTime: renderDuration,
          location: location.pathname
        });
      }
    };
  }, [location.pathname, componentId, trackPerformance]);
  
  // Simuler la progression du chargement
  useEffect(() => {
    if (!isLoading) {
      setLoadingProgress(100);
      return;
    }
    
    let progress = 0;
    const totalSteps = 5;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 5;
      
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }
      
      setLoadingProgress(progress);
    }, 300);
    
    return () => clearInterval(interval);
  }, [isLoading]);
  
  // Gérer les squelettes pendant le chargement
  useEffect(() => {
    if (!applySkeletons) return;
    
    if (isLoading) {
      perceivedPerformance.handleSkeletons(true, componentId);
    } else {
      perceivedPerformance.handleSkeletons(false, componentId);
    }
  }, [applySkeletons, isLoading, componentId]);
  
  // Précharger les images les plus importantes
  const preloadImage = useCallback((src, options = {}) => {
    if (optimizeImages && src) {
      optimizedImageLoader.preloadImage(src, options);
    }
  }, [optimizeImages]);
  
  // Optimiser l'URL d'une image
  const optimizeImage = useCallback((src, options = {}) => {
    if (!optimizeImages || !src) return src;
    
    // Si la qualité est limitée par le réseau, l'ajuster
    if (isNetworkLimited && !options.quality) {
      options.quality = optimalQuality === 'low' ? 50 : 
                       optimalQuality === 'medium' ? 70 : 80;
    }
    
    return optimizedImageLoader.getOptimizedUrl(src, options);
  }, [optimizeImages, isNetworkLimited, optimalQuality]);
  
  // Précharger les routes probables
  useEffect(() => {
    if (!routePrefetching) return;
    
    // Précharger uniquement après le chargement complet du composant
    if (!isLoading) {
      // Attendre un moment avant de précharger pour ne pas interférer avec le rendu
      const timeout = setTimeout(() => {
        resourcePrefetcher.prefetchNextRoutes();
      }, 2000);
      
      return () => clearTimeout(timeout);
    }
  }, [routePrefetching, isLoading, location.pathname]);
  
  // Précharger les liens visibles
  const setupLinkPrefetching = useCallback((containerRef) => {
    if (!prefetchLinks || !containerRef || !containerRef.current) return;
    
    // Observer les liens pour précharger au survol
    const container = containerRef.current;
    const links = container.querySelectorAll('a[href]');
    
    const handleMouseOver = (e) => {
      const link = e.currentTarget;
      const href = link.getAttribute('href');
      
      // Ne précharger que les liens internes (pas les liens externes ou les ancres)
      if (href && !href.startsWith('http') && !href.startsWith('#')) {
        resourcePrefetcher.prefetchRouteResources(href);
      }
    };
    
    // Attacher les gestionnaires d'événements
    links.forEach(link => {
      link.addEventListener('mouseover', handleMouseOver, { once: true });
    });
    
    // Nettoyer les gestionnaires d'événements
    return () => {
      links.forEach(link => {
        link.removeEventListener('mouseover', handleMouseOver);
      });
    };
  }, [prefetchLinks]);
  
  // Marquer un composant comme complètement chargé
  const markLoadingComplete = useCallback(() => {
    setIsLoading(false);
    perceivedPerformance.markStep(`component_${componentId}_complete`);
  }, [componentId]);
  
  // Simulation de chargement des données avec délai minimal pour UX
  const loadData = useCallback(async (dataFetcher, options = {}) => {
    const {
      minLoadTime = 500,
      markComplete = true,
      showSkeleton = true
    } = options;
    
    const startTime = performance.now();
    
    if (showSkeleton) {
      perceivedPerformance.handleSkeletons(true, componentId);
    }
    
    try {
      // Exécuter le chargement réel
      const result = await dataFetcher();
      
      // Calculer le temps écoulé
      const elapsed = performance.now() - startTime;
      
      // Si le chargement a été trop rapide, ajouter un délai pour éviter les flashs d'UI
      if (elapsed < minLoadTime) {
        await new Promise(resolve => setTimeout(resolve, minLoadTime - elapsed));
      }
      
      if (markComplete) {
        markLoadingComplete();
      }
      
      if (showSkeleton) {
        perceivedPerformance.handleSkeletons(false, componentId);
      }
      
      return result;
    } catch (error) {
      // En cas d'erreur, également cacher les squelettes
      if (showSkeleton) {
        perceivedPerformance.handleSkeletons(false, componentId);
      }
      throw error;
    }
  }, [componentId, markLoadingComplete]);
  
  return {
    isLoading,
    loadingProgress,
    markLoadingComplete,
    optimizeImage,
    preloadImage,
    setupLinkPrefetching,
    loadData,
    isNetworkLimited,
    optimalQuality,
    componentRef,
    perceivedPerformance
  };
};

export default usePerformanceOptimizations;
