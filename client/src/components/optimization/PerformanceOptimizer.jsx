import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

// Importer les services d'optimisation
import optimizedImageLoader from '../../services/optimization/OptimizedImageLoader';
import resourcePrefetcher, { usePrefetching } from '../../services/optimization/ResourcePrefetcher';
import scriptPrioritizer from '../../services/optimization/ScriptPrioritizer';
import perceivedPerformance from '../../services/optimization/PerceivedPerformance';
import webVitalsMonitor from '../../services/monitoring/WebVitalsMonitor';

/**
 * Composant qui initialise et gère toutes les optimisations de performance
 * À inclure dans App.jsx pour une activation globale
 */
const PerformanceOptimizer = ({ children, serviceWorkerPath = '/service-worker.js' }) => {
  const location = useLocation();
  const [isInitialized, setIsInitialized] = useState(false);
  const [registeredSW, setRegisteredSW] = useState(false);
  const [performanceData, setPerformanceData] = useState({});
  
  // Utiliser le hook de préchargement
  const prefetchStatus = usePrefetching(location.pathname.split('/')[2]); // Paramètre de route si présent
  
  // Initialisation des services lors du premier rendu
  useEffect(() => {
    if (!isInitialized) {
      console.log('[PerformanceOptimizer] Initializing performance services...');
      
      // 1. Initialiser le service de performance perçue
      perceivedPerformance.initialize();
      perceivedPerformance.markStep('optimizerInitialized');
      
      // 2. Initialiser le prioritiseur de scripts
      scriptPrioritizer.initialize();
      
      // 3. Précharger les ressources critiques pour la route actuelle
      perceivedPerformance.preloadCriticalResources(location.pathname);
      
      // 4. Établir des connexions préalables pour les domaines externes
      resourcePrefetcher.preconnectToExternalDomains();
      
      // 5. Marquer l'initialisation comme terminée
      setIsInitialized(true);
    }
  }, [isInitialized]);
  
  // Enregistrer le service worker
  useEffect(() => {
    if ('serviceWorker' in navigator && !registeredSW) {
      // Enregistrer le service worker
      navigator.serviceWorker.register(serviceWorkerPath)
        .then(registration => {
          console.log('[PerformanceOptimizer] Service Worker registered successfully:', registration.scope);
          setRegisteredSW(true);
          
          // Configurer la gestion des mises à jour du service worker
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Une nouvelle version est disponible et prête à être utilisée
                console.log('[PerformanceOptimizer] New Service Worker version available');
                
                // Notifier l'utilisateur d'une mise à jour disponible
                dispatchEvent(new CustomEvent('serviceWorkerUpdateAvailable'));
              }
            });
          });
        })
        .catch(error => {
          console.error('[PerformanceOptimizer] Service Worker registration failed:', error);
        });
      
      // Écouter les messages du service worker
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data && event.data.type === 'CACHE_UPDATED') {
          console.log('[PerformanceOptimizer] Cache updated:', event.data.url);
        }
      });
    }
  }, [registeredSW, serviceWorkerPath]);
  
  // Gérer les transitions de route
  useEffect(() => {
    // Marquer le début de la transition
    perceivedPerformance.markStep('routeTransitionStart');
    
    // Afficher les squelettes lors des transitions de route
    perceivedPerformance.handleSkeletons(true);
    
    // Précharger les ressources pour la nouvelle route
    perceivedPerformance.preloadCriticalResources(location.pathname);
    
    // Collecter des statistiques de performance après le rendu complet
    const completeRender = () => {
      // Marquer la fin du rendu
      perceivedPerformance.markStep('renderComplete');
      perceivedPerformance.handleSkeletons(false);
      
      // Collecter les données de performance
      const vitalsData = webVitalsMonitor.getPerformanceResults();
      const perceptionData = perceivedPerformance.getPerformanceStats();
      
      setPerformanceData({
        webVitals: vitalsData,
        perception: perceptionData,
        route: location.pathname,
        timestamp: Date.now()
      });
    };
    
    // Attendre que la page se stabilise après la transition de route
    const renderTimeout = setTimeout(completeRender, 1000);
    
    // Nettoyage lors des transitions de route
    return () => {
      clearTimeout(renderTimeout);
    };
  }, [location.pathname]);
  
  // Installer le gestionnaire de mise à jour du service worker
  useEffect(() => {
    const handleServiceWorkerUpdate = () => {
      // Un nouveau service worker est disponible
      if (window.confirm('Une nouvelle version de Velo-Altitude est disponible. Voulez-vous l\'activer maintenant ?')) {
        // Demander au service worker de prendre le contrôle
        navigator.serviceWorker.controller?.postMessage({ type: 'SKIP_WAITING' });
        
        // Recharger la page
        window.location.reload();
      }
    };
    
    // Écouter les événements de mise à jour
    window.addEventListener('serviceWorkerUpdateAvailable', handleServiceWorkerUpdate);
    
    return () => {
      window.removeEventListener('serviceWorkerUpdateAvailable', handleServiceWorkerUpdate);
    };
  }, []);
  
  // Signaler à l'application les données de performance importantes
  useEffect(() => {
    if (performanceData.webVitals && window.dispatchEvent) {
      window.dispatchEvent(
        new CustomEvent('performanceReport', { 
          detail: performanceData 
        })
      );
    }
  }, [performanceData]);
  
  // Exporter les services d'optimisation via le contexte React si nécessaire
  return (
    <>
      {/* Insérer les balises nécessaires pour l'optimisation */}
      {React.Children.map(children, child => React.cloneElement(child, {
        performanceData,
        prefetchingActive: isInitialized
      }))}
      
      {/* Component-level performance debugging (en mode développement uniquement) */}
      {process.env.NODE_ENV === 'development' && (
        <div id="performance-debug" style={{ 
          position: 'fixed', bottom: 0, right: 0, 
          background: 'rgba(0,0,0,0.6)', color: 'white', 
          padding: '5px', fontSize: '10px', zIndex: 9999,
          display: 'none' // Caché par défaut, activable via la console
        }}>
          Performance: {JSON.stringify({
            route: location.pathname,
            prefetchedItems: prefetchStatus.prefetchedResources,
            webVitalsCollected: webVitalsMonitor.areMetricsCollected()
          })}
        </div>
      )}
    </>
  );
};

export default PerformanceOptimizer;
