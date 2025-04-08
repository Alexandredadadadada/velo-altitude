/**
 * threeDConfigManager.js
 * Gestionnaire de configuration pour les rendus 3D
 * 
 * Ce module fournit des configurations optimisées pour les rendus 3D
 * en fonction des capacités de l'appareil, de l'état de la batterie,
 * et des préférences utilisateur.
 */

import deviceCapabilityDetector from './deviceCapabilityDetector';
import { PERF_LEVELS } from './PerformanceDetector';
import batteryOptimizer from './batteryOptimizer';

class ThreeDConfigManager {
  constructor() {
    // Configurations par défaut pour chaque niveau de performance
    this.defaultConfigs = {
      [PERF_LEVELS.ULTRA_LOW]: {
        terrainDetail: 16,       // résolution du terrain (verticies par côté)
        terrainTexture: 256,     // taille des textures du terrain
        cyclistDetail: 'low',    // niveau de détail du cycliste (low, medium, high)
        shadowsEnabled: false,   // ombres désactivées
        shadowMapSize: 512,      // taille des shadow maps
        effectsEnabled: false,   // effets post-processing
        maxLights: 1,            // nombre max de sources lumineuses
        antialiasing: false,     // antialiasing
        reflections: false,      // réflexions
        maxFPS: 30,              // FPS max
        drawDistance: 500,       // distance de rendu
        textureLODBias: -1,      // biais LOD pour les textures
        dynamicObjects: 'static', // tous les objets sont statiques
        vegetationDensity: 0,    // pas de végétation
        particlesEnabled: false, // pas de particules
        enabledFeatures: ['basic-terrain', 'basic-cyclist']
      },
      [PERF_LEVELS.LOW]: {
        terrainDetail: 32,
        terrainTexture: 512,
        cyclistDetail: 'low',
        shadowsEnabled: false,
        shadowMapSize: 1024,
        effectsEnabled: false,
        maxLights: 2,
        antialiasing: false,
        reflections: false,
        maxFPS: 40,
        drawDistance: 1000,
        textureLODBias: -0.5,
        dynamicObjects: 'minimal',
        vegetationDensity: 0.2,
        particlesEnabled: false,
        enabledFeatures: ['basic-terrain', 'basic-cyclist', 'basic-vegetation']
      },
      [PERF_LEVELS.MEDIUM]: {
        terrainDetail: 64,
        terrainTexture: 1024,
        cyclistDetail: 'medium',
        shadowsEnabled: true,
        shadowMapSize: 2048,
        effectsEnabled: true,
        maxLights: 4,
        antialiasing: true,
        reflections: false,
        maxFPS: 50,
        drawDistance: 2000,
        textureLODBias: 0,
        dynamicObjects: 'normal',
        vegetationDensity: 0.5,
        particlesEnabled: true,
        enabledFeatures: ['terrain', 'cyclist', 'vegetation', 'shadows', 'particles']
      },
      [PERF_LEVELS.HIGH]: {
        terrainDetail: 128,
        terrainTexture: 2048,
        cyclistDetail: 'high',
        shadowsEnabled: true,
        shadowMapSize: 4096,
        effectsEnabled: true,
        maxLights: 8,
        antialiasing: true,
        reflections: true,
        maxFPS: 60,
        drawDistance: 4000,
        textureLODBias: 0,
        dynamicObjects: 'full',
        vegetationDensity: 0.8,
        particlesEnabled: true,
        enabledFeatures: ['detailed-terrain', 'detailed-cyclist', 'vegetation', 'shadows', 'particles', 'reflections']
      },
      [PERF_LEVELS.ULTRA_HIGH]: {
        terrainDetail: 256,
        terrainTexture: 4096,
        cyclistDetail: 'ultra',
        shadowsEnabled: true,
        shadowMapSize: 8192,
        effectsEnabled: true,
        maxLights: 16,
        antialiasing: true,
        reflections: true,
        maxFPS: 120,
        drawDistance: 6000,
        textureLODBias: 0,
        dynamicObjects: 'full',
        vegetationDensity: 1.0,
        particlesEnabled: true,
        enabledFeatures: ['ultra-terrain', 'ultra-cyclist', 'vegetation', 'advanced-shadows', 'advanced-particles', 'reflections']
      }
    };
    
    // Configuration active (initialisée par updateConfig)
    this.currentConfig = { ...this.defaultConfigs[PERF_LEVELS.MEDIUM] };
    
    // Préférences utilisateur (peut être défini via setUserPreferences)
    this.userPreferences = {
      qualityPreference: 'auto', // auto, performance, quality, battery
      enableShadows: true,
      enableEffects: true,
      maxFPS: 'auto', // auto, 30, 60, 120
    };
    
    // Écouteurs sur les changements de batterie et de performance
    this.setupEventListeners();
    
    // Initialiser la config
    this.updateConfig();
  }
  
  /**
   * Met à jour la configuration active en fonction des capacités et préférences
   * @returns {Object} Configuration active mise à jour
   */
  updateConfig() {
    const capabilities = deviceCapabilityDetector.getCapabilities();
    const batteryStatus = batteryOptimizer.getStatus();
    let performanceLevel = capabilities.performanceLevel;
    
    // Ajuster en fonction des préférences utilisateur
    if (this.userPreferences.qualityPreference === 'performance') {
      performanceLevel = Math.max(PERF_LEVELS.LOW, performanceLevel - 1);
    } else if (this.userPreferences.qualityPreference === 'quality') {
      performanceLevel = Math.min(PERF_LEVELS.ULTRA_HIGH, performanceLevel + 1);
    } else if (this.userPreferences.qualityPreference === 'battery') {
      performanceLevel = Math.max(PERF_LEVELS.ULTRA_LOW, performanceLevel - 2);
    }
    
    // Ajuster en fonction de l'état de la batterie
    if (batteryStatus.shouldReducePerformance) {
      performanceLevel = Math.max(PERF_LEVELS.ULTRA_LOW, performanceLevel - batteryStatus.reductionLevel);
    }
    
    // Définir la config de base en fonction du niveau de performance
    let baseConfig = this.defaultConfigs[performanceLevel];
    if (!baseConfig) {
      console.warn(`ThreeDConfigManager: niveau de performance inconnu ${performanceLevel}, utilisation du niveau MEDIUM`);
      baseConfig = this.defaultConfigs[PERF_LEVELS.MEDIUM];
    }
    
    // Appliquer les préférences spécifiques de l'utilisateur
    const config = { ...baseConfig };
    
    if (this.userPreferences.enableShadows === false) {
      config.shadowsEnabled = false;
    }
    
    if (this.userPreferences.enableEffects === false) {
      config.effectsEnabled = false;
      config.reflections = false;
      config.antialiasing = false;
    }
    
    if (this.userPreferences.maxFPS !== 'auto') {
      config.maxFPS = parseInt(this.userPreferences.maxFPS, 10);
    }
    
    // Ajustements spécifiques pour les appareils mobiles
    if (capabilities.flags.isMobile) {
      config.maxFPS = Math.min(config.maxFPS, 60); // Limiter à 60 FPS sur mobile
      
      if (batteryStatus.level < 0.2) {
        // Réduire drastiquement pour économiser la batterie en dessous de 20%
        config.terrainDetail = Math.min(config.terrainDetail, 32);
        config.shadowsEnabled = false;
        config.effectsEnabled = false;
        config.maxFPS = 30;
      }
    }
    
    // Ajustements pour le mode économie d'énergie
    if (batteryStatus.savingMode) {
      config.shadowsEnabled = false;
      config.effectsEnabled = false;
      config.reflections = false;
      config.maxFPS = 30;
      config.terrainDetail = Math.min(config.terrainDetail, 64);
    }
    
    // Réduction des mouvements pour l'accessibilité
    if (capabilities.flags.preferReducedMotion) {
      config.particlesEnabled = false;
      config.dynamicObjects = 'minimal';
    }
    
    this.currentConfig = config;
    
    // 
    // console.log('ThreeDConfigManager: configuration mise à jour', {
    //   performanceLevel,
    //   batteryLevel: batteryStatus.level,
    //   savingMode: batteryStatus.savingMode,
    //   config: this.getConfigSummary()
    // });
    
    return this.currentConfig;
  }
  
  /**
   * Définit les préférences utilisateur
   * @param {Object} preferences Préférences à définir
   * @returns {Object} Configuration mise à jour
   */
  setUserPreferences(preferences) {
    this.userPreferences = {
      ...this.userPreferences,
      ...preferences
    };
    
    return this.updateConfig();
  }
  
  /**
   * Configure les écouteurs d'événements
   * @private
   */
  setupEventListeners() {
    // Mettre à jour la configuration quand l'état de la batterie change
    batteryOptimizer.addEventListener('statusChanged', () => {
      this.updateConfig();
    });
    
    // Mettre à jour la configuration quand les capacités sont détectées
    window.addEventListener('deviceCapabilitiesUpdated', () => {
      this.updateConfig();
    });
    
    // Mettre à jour lors des changements de préférences d'accessibilité
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    mediaQuery.addEventListener('change', () => {
      this.updateConfig();
    });
    
    // Mettre à jour quand la fenêtre est redimensionnée
    let resizeTimeout;
    window.addEventListener('resize', () => {
      // Debounce pour éviter les mises à jour trop fréquentes
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.updateConfig();
      }, 300);
    });
  }
  
  /**
   * Récupère la configuration active complète
   * @returns {Object} Configuration complète
   */
  getConfig() {
    return { ...this.currentConfig };
  }
  
  /**
   * Récupère le résumé de la configuration active pour le logging
   * @private
   * @returns {Object} Résumé de la configuration
   */
  getConfigSummary() {
    const { terrainDetail, cyclistDetail, shadowsEnabled, maxFPS } = this.currentConfig;
    return { terrainDetail, cyclistDetail, shadowsEnabled, maxFPS };
  }
  
  /**
   * Récupère une configuration spécifique à un composant
   * @param {string} componentName Nom du composant (e.g., 'terrain', 'cyclist')
   * @returns {Object} Configuration pour le composant
   */
  getComponentConfig(componentName) {
    const config = { ...this.currentConfig };
    
    // Configurations spécifiques aux composants
    switch (componentName) {
      case 'terrain':
        return {
          detail: config.terrainDetail,
          textureSize: config.terrainTexture,
          shadowsEnabled: config.shadowsEnabled,
          drawDistance: config.drawDistance,
          vegetationDensity: config.vegetationDensity
        };
        
      case 'cyclist':
        return {
          detail: config.cyclistDetail,
          animationQuality: config.cyclistDetail,
          shadowsEnabled: config.shadowsEnabled,
          maxAnimationsActive: config.cyclistDetail === 'low' ? 1 : 
                               config.cyclistDetail === 'medium' ? 2 : 3
        };
        
      case 'postprocessing':
        return {
          enabled: config.effectsEnabled,
          antialiasing: config.antialiasing,
          reflections: config.reflections
        };
        
      case 'particles':
        return {
          enabled: config.particlesEnabled,
          maxParticles: config.cyclistDetail === 'low' ? 50 : 
                        config.cyclistDetail === 'medium' ? 200 : 500
        };
        
      default:
        return config;
    }
  }
  
  /**
   * Force un niveau de qualité spécifique pour une session
   * @param {number} level Niveau de performance forcé
   * @returns {Object} Configuration mise à jour
   */
  forceQualityLevel(level) {
    if (!(level in PERF_LEVELS)) {
      console.error(`ThreeDConfigManager: niveau de qualité invalide ${level}`);
      return this.currentConfig;
    }
    
    const capabilities = deviceCapabilityDetector.getCapabilities();
    capabilities.performanceLevel = level;
    
    return this.updateConfig();
  }
  
  /**
   * Réinitialise les paramètres et préférences
   * @returns {Object} Configuration par défaut
   */
  resetToDefaults() {
    this.userPreferences = {
      qualityPreference: 'auto',
      enableShadows: true,
      enableEffects: true,
      maxFPS: 'auto',
    };
    
    return this.updateConfig();
  }
}

// Export d'une instance unique
const threeDConfigManager = new ThreeDConfigManager();
export default threeDConfigManager;
