/**
 * Dashboard Manager
 * Gestion du dashboard personnalisable avec widgets drag-and-drop
 */

const DashboardManager = (function() {
  // Configuration par défaut
  const DEFAULT_CONFIG = {
    // Layout par défaut
    layout: 'grid', // 'grid' ou 'list'
    // Widgets activés par défaut
    activeWidgets: ['weather', 'map', 'elevation', 'strava-stats', 'pass-list'],
    // Configuration par widget
    widgetConfig: {
      weather: { position: 1, size: 'medium', refreshRate: 30 },
      map: { position: 2, size: 'large', center: [6.8770, 48.1000], zoom: 9 },
      elevation: { position: 3, size: 'medium', showMini: true },
      'strava-stats': { position: 4, size: 'small', metrics: ['distance', 'elevation'] },
      'pass-list': { position: 5, size: 'medium', sortBy: 'difficulty' }
    }
  };
  
  // État interne du dashboard
  let currentConfig = { ...DEFAULT_CONFIG };
  let widgetInstances = {};
  let initialized = false;
  
  // Stocke la configuration actuelle dans localStorage
  function saveConfig() {
    try {
      localStorage.setItem('dashboardConfig', JSON.stringify(currentConfig));
      return true;
    } catch (e) {
      console.error('Erreur lors de la sauvegarde de la configuration du dashboard:', e);
      return false;
    }
  }
  
  // Charge la configuration depuis localStorage ou utilise la configuration par défaut
  function loadConfig() {
    try {
      const savedConfig = localStorage.getItem('dashboardConfig');
      if (savedConfig) {
        currentConfig = { ...DEFAULT_CONFIG, ...JSON.parse(savedConfig) };
      }
    } catch (e) {
      console.error('Erreur lors du chargement de la configuration du dashboard:', e);
    }
    return currentConfig;
  }
  
  // API publique
  return {
    init() {
      if (initialized) return;
      
      // Charger la configuration sauvegardée
      loadConfig();
      
      // Initialiser les widgets
      this.renderDashboard();
      
      initialized = true;
    },
    
    renderDashboard() {
      // Implémentation à venir
      console.log('Rendu du dashboard avec la configuration:', currentConfig);
    },
    
    // Récupérer la configuration actuelle
    getConfig() {
      return { ...currentConfig };
    },
    
    // Mettre à jour la configuration
    updateConfig(newConfig) {
      currentConfig = { ...currentConfig, ...newConfig };
      saveConfig();
      this.renderDashboard();
    },
    
    // Récupérer les préréglages disponibles
    getPresets() {
      // Implémentation à venir
      return [
        { id: 'planning', name: 'Planification d\'itinéraire' },
        { id: 'ride-day', name: 'Jour de sortie' },
        { id: 'analysis', name: 'Analyse de performance' },
        { id: 'complete', name: 'Vue complète' }
      ];
    }
  };
})();

// Exporter pour une utilisation globale
window.DashboardManager = DashboardManager;
