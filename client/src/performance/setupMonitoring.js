/**
 * Configuration du monitoring de performance
 * 
 * Ce fichier initialise les outils de monitoring de performance dans l'application.
 * Il est importé dans le point d'entrée principal pour garantir que le monitoring
 * est activé dès le chargement initial de l'application.
 */

import performanceMonitoring from '../utils/performanceMonitoring';

/**
 * Initialise le monitoring de performance
 * @param {Object} options Options de configuration
 */
export const setupPerformanceMonitoring = (options = {}) => {
  const {
    enableWebVitals = true,
    enableDevPanel = process.env.NODE_ENV === 'development',
    debug = process.env.NODE_ENV === 'development'
  } = options;

  // Activer la collecte des Web Vitals
  if (enableWebVitals) {
    performanceMonitoring.initWebVitalsMonitoring();
    
    if (debug) {
      console.log('[Performance] Web Vitals monitoring enabled');
    }
  }

  // Activer le panneau de développement en mode dev
  if (enableDevPanel) {
    // Attendre que le DOM soit chargé
    if (document.readyState === 'complete') {
      performanceMonitoring.createDevPerformancePanel();
    } else {
      window.addEventListener('load', () => {
        performanceMonitoring.createDevPerformancePanel();
      });
    }
    
    if (debug) {
      console.log('[Performance] Development panel enabled');
    }
  }

  // Pour le débogage
  if (debug) {
    // Exposer l'API de monitoring dans la console
    window.performanceMonitoring = performanceMonitoring;
    console.log('[Performance] Debug mode enabled - performanceMonitoring available in console');
  }

  return {
    /**
     * Mesure la performance d'une opération spécifique
     * @param {string} name Nom de l'opération 
     * @param {function} callback Fonction à mesurer
     * @returns {any} Résultat de la fonction
     */
    measure: (name, callback) => performanceMonitoring.measurePerformance(name, callback),
    
    /**
     * Surveille les performances de rendu 3D
     * @param {Object} renderer Le renderer THREE.js ou WebGL
     * @returns {Object} Contrôleur de monitoring avec méthode stop()
     */
    monitor3D: (renderer) => performanceMonitoring.monitor3DPerformance(renderer),
    
    /**
     * Récupère les métriques collectées
     * @returns {Object} Métriques de performance
     */
    getMetrics: () => performanceMonitoring.getStoredMetrics()
  };
};

// Fonction d'aide pour marquer les événements de performance importants
export const markPerformanceEvent = (name, data = {}) => {
  try {
    // Créer une marque de performance
    performance.mark(name);
    
    // Enregistrer des données additionnelles si nécessaire
    if (window.dataLayer) {
      window.dataLayer.push({
        event: 'performance_mark',
        performance_event_name: name,
        ...data
      });
    }
    
    // Log en mode développement
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance Mark] ${name}`, data);
    }
  } catch (e) {
    // Ignorer les erreurs de performance marking
    console.error('Error marking performance event:', e);
  }
};

// Exporter le monitoring par défaut
export default setupPerformanceMonitoring;
