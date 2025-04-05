/**
 * 3DConfigManager.js
 * Gestionnaire de configuration pour les rendus 3D
 * 
 * Ce module définit les paramètres optimaux pour les rendus 3D
 * en fonction des capacités de l'appareil détectées.
 */

import deviceCapabilityDetector from './deviceCapabilityDetector';
import { PERF_LEVELS } from './PerformanceDetector';

class ThreeDConfigManager {
  constructor() {
    this.configs = {
      // Configuration pour ColVisualization3D
      colVisualization: {
        // Configuration pour performances ultra faibles
        [PERF_LEVELS.ULTRA_LOW]: {
          terrainSegments: 32,
          textureSize: 256,
          drawDistance: 2500,
          textureQuality: 'very-low',
          shadowsEnabled: false,
          postProcessingEnabled: false,
          ambientOcclusionEnabled: false,
          reflectionsEnabled: false,
          maxPointsOfInterest: 5,
          occlusionCullingEnabled: true,
          modelDetailLevel: 'very-low',
          interactiveObjects: 'minimal',
          useSimplifiedGeometry: true,
          maxParticles: 0,
          fogEnabled: false,
          animationLevel: 'none',
          backgroundDetail: 'none',
          lightingComplexity: 'basic',
          maxFrameRate: 30
        },
        
        // Configuration pour performances faibles
        [PERF_LEVELS.LOW]: {
          terrainSegments: 64,
          textureSize: 512,
          drawDistance: 5000,
          textureQuality: 'low',
          shadowsEnabled: false,
          postProcessingEnabled: false,
          ambientOcclusionEnabled: false,
          reflectionsEnabled: false,
          maxPointsOfInterest: 10,
          occlusionCullingEnabled: true,
          modelDetailLevel: 'low',
          interactiveObjects: 'reduced',
          useSimplifiedGeometry: true,
          maxParticles: 100,
          fogEnabled: true,
          animationLevel: 'minimal',
          backgroundDetail: 'low',
          lightingComplexity: 'basic',
          maxFrameRate: 45
        },
        
        // Configuration pour performances moyennes
        [PERF_LEVELS.MEDIUM]: {
          terrainSegments: 128,
          textureSize: 1024,
          drawDistance: 10000,
          textureQuality: 'medium',
          shadowsEnabled: true,
          shadowMapSize: 1024,
          postProcessingEnabled: false,
          ambientOcclusionEnabled: false,
          reflectionsEnabled: false,
          maxPointsOfInterest: 25,
          occlusionCullingEnabled: true,
          modelDetailLevel: 'medium',
          interactiveObjects: 'standard',
          useSimplifiedGeometry: false,
          maxParticles: 500,
          fogEnabled: true,
          animationLevel: 'reduced',
          backgroundDetail: 'medium',
          lightingComplexity: 'standard',
          maxFrameRate: 60
        },
        
        // Configuration pour performances élevées
        [PERF_LEVELS.HIGH]: {
          terrainSegments: 256,
          textureSize: 2048,
          drawDistance: 15000,
          textureQuality: 'high',
          shadowsEnabled: true,
          shadowMapSize: 2048,
          postProcessingEnabled: true,
          postProcessingEffects: ['bloom', 'fxaa'],
          ambientOcclusionEnabled: true,
          reflectionsEnabled: false,
          maxPointsOfInterest: 40,
          occlusionCullingEnabled: true,
          modelDetailLevel: 'high',
          interactiveObjects: 'all',
          useSimplifiedGeometry: false,
          maxParticles: 1000,
          fogEnabled: true,
          animationLevel: 'full',
          backgroundDetail: 'high',
          lightingComplexity: 'advanced',
          maxFrameRate: 90
        },
        
        // Configuration pour performances ultra élevées
        [PERF_LEVELS.ULTRA_HIGH]: {
          terrainSegments: 512,
          textureSize: 4096,
          drawDistance: 25000,
          textureQuality: 'ultra',
          shadowsEnabled: true,
          shadowMapSize: 4096,
          postProcessingEnabled: true,
          postProcessingEffects: ['bloom', 'ssao', 'godrays', 'fxaa'],
          ambientOcclusionEnabled: true,
          reflectionsEnabled: true,
          maxPointsOfInterest: 60,
          occlusionCullingEnabled: false,
          modelDetailLevel: 'ultra',
          interactiveObjects: 'all',
          useSimplifiedGeometry: false,
          maxParticles: 5000,
          fogEnabled: true,
          animationLevel: 'full',
          backgroundDetail: 'ultra',
          lightingComplexity: 'physically-based',
          maxFrameRate: 144
        }
      },
      
      // Configuration pour TrainingVisualizer3D
      trainingVisualization: {
        // Configuration pour performances ultra faibles
        [PERF_LEVELS.ULTRA_LOW]: {
          avatarSegments: 8,
          environmentDetail: 'very-low',
          maxCyclists: 2,
          textureQuality: 'very-low',
          shadowsEnabled: false,
          effectsEnabled: false,
          useSimplifiedPhysics: true,
          maxFrameRate: 30,
          drawDistance: 100,
          animationFrameskip: 3,
          backgroundEnabled: false,
          reflectionQuality: 'none',
          lightingQuality: 'basic',
          maxTrainingObjects: 5
        },
        
        // Configuration pour performances faibles
        [PERF_LEVELS.LOW]: {
          avatarSegments: 12,
          environmentDetail: 'low',
          maxCyclists: 3,
          textureQuality: 'low',
          shadowsEnabled: false,
          effectsEnabled: false,
          useSimplifiedPhysics: true,
          maxFrameRate: 45,
          drawDistance: 200,
          animationFrameskip: 2,
          backgroundEnabled: true,
          reflectionQuality: 'none',
          lightingQuality: 'basic',
          maxTrainingObjects: 10
        },
        
        // Configuration pour performances moyennes
        [PERF_LEVELS.MEDIUM]: {
          avatarSegments: 16,
          environmentDetail: 'medium',
          maxCyclists: 5,
          textureQuality: 'medium',
          shadowsEnabled: true,
          effectsEnabled: true,
          useSimplifiedPhysics: false,
          maxFrameRate: 60,
          drawDistance: 500,
          animationFrameskip: 0,
          backgroundEnabled: true,
          reflectionQuality: 'low',
          lightingQuality: 'standard',
          maxTrainingObjects: 20
        },
        
        // Configuration pour performances élevées
        [PERF_LEVELS.HIGH]: {
          avatarSegments: 24,
          environmentDetail: 'high',
          maxCyclists: 8,
          textureQuality: 'high',
          shadowsEnabled: true,
          effectsEnabled: true,
          useSimplifiedPhysics: false,
          maxFrameRate: 90,
          drawDistance: 1000,
          animationFrameskip: 0,
          backgroundEnabled: true,
          reflectionQuality: 'medium',
          lightingQuality: 'advanced',
          maxTrainingObjects: 40
        },
        
        // Configuration pour performances ultra élevées
        [PERF_LEVELS.ULTRA_HIGH]: {
          avatarSegments: 32,
          environmentDetail: 'ultra',
          maxCyclists: 12,
          textureQuality: 'ultra',
          shadowsEnabled: true,
          effectsEnabled: true,
          useSimplifiedPhysics: false,
          maxFrameRate: 120,
          drawDistance: 2000,
          animationFrameskip: 0,
          backgroundEnabled: true,
          reflectionQuality: 'high',
          lightingQuality: 'physically-based',
          maxTrainingObjects: 60
        }
      }
    };
    
    // Configuration spécifique pour les appareils mobiles
    this.mobileOverrides = {
      // Écrase certains paramètres pour optimiser sur mobile
      shadowsEnabled: false,
      postProcessingEnabled: false,
      ambientOcclusionEnabled: false,
      reflectionsEnabled: false,
      drawDistance: 0.6, // multiplicateur
      maxParticles: 0.3, // multiplicateur
      maxFrameRate: Math.min, // prend le min entre la config standard et 60
      backgroundDetail: level => Math.max(PERF_LEVELS.LOW, level - 1) // réduit de 1 niveau
    };
    
    // Configuration spécifique pour les appareils en mode économie de batterie
    this.batterySavingOverrides = {
      shadowsEnabled: false,
      postProcessingEnabled: false,
      maxFrameRate: 30,
      drawDistance: 0.5, // multiplicateur
      terrainSegments: 0.5, // multiplicateur
      textureQuality: level => Math.max(PERF_LEVELS.ULTRA_LOW, level - 2) // réduit de 2 niveaux
    };
  }
  
  /**
   * Obtient la configuration optimale pour un composant 3D spécifique
   * @param {string} componentType Type de composant ('colVisualization' ou 'trainingVisualization')
   * @param {Object} [overrideFlags={}] Drapeaux pour forcer certaines options
   * @returns {Object} Configuration optimale
   */
  getOptimalConfig(componentType, overrideFlags = {}) {
    // Récupérer les capacités de l'appareil
    const capabilities = deviceCapabilityDetector.getCapabilities();
    let perfLevel = capabilities.performanceLevel;
    
    // Vérifier si on a une configuration pour ce composant
    if (!this.configs[componentType]) {
      console.warn(`3DConfigManager: configuration non trouvée pour ${componentType}`);
      componentType = 'colVisualization'; // Fallback sur une config par défaut
    }
    
    // Obtenir la configuration de base
    let config = { ...this.configs[componentType][perfLevel] };
    
    // Appliquer les overrides pour mobile si nécessaire
    if (capabilities.flags.isMobile || overrideFlags.forceMobileMode) {
      config = this.applyMobileOverrides(config, perfLevel);
    }
    
    // Appliquer les overrides pour économie de batterie si nécessaire
    if (capabilities.flags.hasBatteryConstraints || overrideFlags.forceBatterySaving) {
      config = this.applyBatterySavingOverrides(config, perfLevel);
    }
    
    // Appliquer les overrides utilisateur si fournis
    if (overrideFlags.userOverrides) {
      config = { ...config, ...overrideFlags.userOverrides };
    }
    
    // Garantir que les paramètres restent dans des limites raisonnables
    config = this.sanitizeConfig(config);
    
    return config;
  }
  
  /**
   * Applique les overrides spécifiques aux appareils mobiles
   * @param {Object} config Configuration de base
   * @param {number} perfLevel Niveau de performance
   * @returns {Object} Configuration modifiée
   * @private
   */
  applyMobileOverrides(config, perfLevel) {
    const result = { ...config };
    
    // Appliquer chaque override
    Object.entries(this.mobileOverrides).forEach(([key, value]) => {
      if (typeof value === 'function') {
        // Si c'est une fonction, l'appliquer avec le niveau de performance
        result[key] = value(perfLevel);
      } else if (typeof value === 'number' && config[key] !== undefined) {
        // Si c'est un multiplicateur
        result[key] = Math.round(config[key] * value);
      } else {
        // Sinon remplacer directement
        result[key] = value;
      }
    });
    
    return result;
  }
  
  /**
   * Applique les overrides pour le mode économie de batterie
   * @param {Object} config Configuration de base
   * @param {number} perfLevel Niveau de performance
   * @returns {Object} Configuration modifiée
   * @private
   */
  applyBatterySavingOverrides(config, perfLevel) {
    const result = { ...config };
    
    // Appliquer chaque override
    Object.entries(this.batterySavingOverrides).forEach(([key, value]) => {
      if (typeof value === 'function') {
        // Si c'est une fonction, l'appliquer avec le niveau de performance
        result[key] = value(perfLevel);
      } else if (typeof value === 'number' && config[key] !== undefined) {
        // Si c'est un multiplicateur
        result[key] = Math.round(config[key] * value);
      } else {
        // Sinon remplacer directement
        result[key] = value;
      }
    });
    
    return result;
  }
  
  /**
   * Sanitize la configuration pour éviter des valeurs absurdes
   * @param {Object} config Configuration à sanitizer
   * @returns {Object} Configuration sanitizée
   * @private
   */
  sanitizeConfig(config) {
    const result = { ...config };
    
    // Limites minimales
    if (result.terrainSegments) {
      result.terrainSegments = Math.max(32, result.terrainSegments);
    }
    
    if (result.textureSize) {
      result.textureSize = Math.max(256, result.textureSize);
    }
    
    if (result.drawDistance) {
      result.drawDistance = Math.max(100, result.drawDistance);
    }
    
    if (result.maxFrameRate) {
      result.maxFrameRate = Math.max(24, result.maxFrameRate);
    }
    
    return result;
  }
  
  /**
   * Génère un résumé des paramètres de la configuration
   * @param {Object} config Configuration à résumer
   * @returns {string} Résumé textuel de la configuration
   */
  generateConfigSummary(config) {
    if (!config) return 'Configuration non disponible';
    
    const qualityIndicators = [
      { prop: 'terrainSegments', high: 256, low: 64 },
      { prop: 'textureSize', high: 2048, low: 512 },
      { prop: 'shadowsEnabled', binary: true },
      { prop: 'postProcessingEnabled', binary: true }
    ];
    
    let qualityScore = 0;
    let maxScore = 0;
    
    // Calculer un score de qualité basé sur les indicateurs
    qualityIndicators.forEach(indicator => {
      if (config[indicator.prop] !== undefined) {
        if (indicator.binary) {
          qualityScore += config[indicator.prop] ? 1 : 0;
          maxScore += 1;
        } else {
          const normalized = Math.min(
            1, 
            Math.max(0, (config[indicator.prop] - indicator.low) / (indicator.high - indicator.low))
          );
          qualityScore += normalized;
          maxScore += 1;
        }
      }
    });
    
    // Convertir en pourcentage
    const qualityPercentage = Math.round((qualityScore / Math.max(1, maxScore)) * 100);
    
    // Générer le résumé
    let performanceLevel = 'Moyen';
    if (qualityPercentage >= 75) performanceLevel = 'Élevé';
    else if (qualityPercentage <= 30) performanceLevel = 'Faible';
    
    return `Qualité visuelle: ${performanceLevel} (${qualityPercentage}%)
Détail terrain: ${config.terrainSegments || 'N/A'}
Résolution textures: ${config.textureSize || 'N/A'}
Ombres: ${config.shadowsEnabled ? 'Activées' : 'Désactivées'}
Effets visuels: ${config.postProcessingEnabled ? 'Activés' : 'Désactivés'}`;
  }
}

// Exporter une instance unique
const threeDConfigManager = new ThreeDConfigManager();
export default threeDConfigManager;
