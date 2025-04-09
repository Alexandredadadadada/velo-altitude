/**
 * Configuration centralisée pour les visualisations des cols
 * Définit les options, modes et paramètres pour tous les composants de visualisation
 */

// Types de visualisation disponibles
export const VISUALIZATION_TYPES = {
  PROFILE_2D: 'profile-2d',    // Profil d'élévation 2D (Canvas)
  TERRAIN_3D: 'terrain-3d',    // Terrain 3D complet (Three.js)
  MINI_PROFILE: 'mini-profile', // Version miniature pour widgets
  MOBILE_OPTIMIZED: 'mobile-optimized' // Version optimisée pour mobile
};

// Niveaux de qualité pour la visualisation 3D
export const QUALITY_LEVELS = {
  LOW: 'low',       // Faible détail, performances maximales
  MEDIUM: 'medium', // Équilibre entre détail et performance
  HIGH: 'high'      // Détail maximal, pour appareils puissants
};

// Configuration par défaut pour différents types d'appareils
export const DEFAULT_DEVICE_CONFIG = {
  mobile: {
    defaultVisualization: VISUALIZATION_TYPES.PROFILE_2D,
    fallbackVisualization: VISUALIZATION_TYPES.MINI_PROFILE,
    quality: QUALITY_LEVELS.LOW,
    maxTextureSize: 1024,
    enableShadows: false,
    antialiasing: false,
    terrainSegments: 32,
  },
  tablet: {
    defaultVisualization: VISUALIZATION_TYPES.PROFILE_2D,
    fallbackVisualization: VISUALIZATION_TYPES.PROFILE_2D,
    quality: QUALITY_LEVELS.MEDIUM,
    maxTextureSize: 2048,
    enableShadows: true,
    antialiasing: true,
    terrainSegments: 64,
  },
  desktop: {
    defaultVisualization: VISUALIZATION_TYPES.TERRAIN_3D,
    fallbackVisualization: VISUALIZATION_TYPES.PROFILE_2D,
    quality: QUALITY_LEVELS.HIGH,
    maxTextureSize: 4096,
    enableShadows: true,
    antialiasing: true,
    terrainSegments: 128,
  }
};

// Paramètres de couleur et style partagés entre les visualisations
export const VISUALIZATION_STYLE = {
  // Couleurs principales
  colors: {
    primary: '#2a5198',
    secondary: '#4CAF50',
    background: '#f5f5f5',
    surface: '#ffffff',
    elevation: {
      start: '#4CAF50',  // Vert pour départ
      middle: '#FFC107', // Jaune pour milieu
      summit: '#F44336'  // Rouge pour sommet
    },
    gradient: {
      easy: '#4CAF50',
      moderate: '#8BC34A',
      challenging: '#FFC107',
      difficult: '#FF9800',
      extreme: '#F44336'
    }
  },
  
  // Épaisseurs de ligne
  lineWidth: {
    thin: 1,
    medium: 2,
    thick: 3
  },
  
  // Polices
  fonts: {
    small: '10px Arial',
    normal: '12px Arial',
    large: '14px Arial',
    heading: 'bold 16px Arial'
  },
  
  // Points d'intérêt
  poiMarkers: {
    size: {
      small: 4,
      normal: 6,
      large: 8
    }
  }
};

// Textures par défaut pour le terrain 3D
export const DEFAULT_TEXTURES = {
  terrain: {
    diffuse: '/assets/textures/terrain/terrain_diffuse.jpg',
    normal: '/assets/textures/terrain/terrain_normal.jpg',
    roughness: '/assets/textures/terrain/terrain_roughness.jpg'
  },
  road: {
    diffuse: '/assets/textures/road/road_diffuse.jpg',
    normal: '/assets/textures/road/road_normal.jpg'
  }
};

// Facteurs d'échelle pour différentes visualisations
export const SCALE_FACTORS = {
  horizontalExaggeration: 1.0, // Facteur d'exagération horizontale
  verticalExaggeration: 1.5,   // Facteur d'exagération verticale pour profil
  terrainBaseScale: 0.01       // Échelle de base pour le terrain 3D
};

// Configuration pour les visualisations 3D
export const GENERAL_CONFIG = {
  // Taille par défaut du conteneur si non spécifiée
  defaultWidth: 800,
  defaultHeight: 600,
  
  // Paramètres de la caméra
  camera: {
    fov: 75,
    near: 0.1,
    far: 10000,
    initialPosition: [0, 50, 100],
    lookAt: [0, 0, 0]
  },
  
  // Paramètres du rendu
  renderer: {
    shadowsEnabled: true,
    antialias: true,
    pixelRatio: window.devicePixelRatio || 1,
    toneMappingExposure: 1.0,
    clearColor: 0x87ceeb // Couleur de ciel par défaut
  },
  
  // Paramètres pour la visualisation des cols
  colVisualization: {
    terrainScale: {
      horizontal: 1,
      vertical: 1.5 // Exagération verticale pour mieux voir le relief
    },
    pathWidth: 2,
    markerSize: 10,
    colors: {
      path: 0xff0000,
      startMarker: 0x00ff00,
      endMarker: 0x0000ff,
      terrain: 0x808080
    }
  },
  
  // Configuration des effets météorologiques
  weatherEffects: {
    // Détection automatique des capacités
    autoDetectCapabilities: true,
    
    // Utilisation du GPU pour les calculs
    useGPUComputation: true,
    
    // Qualité des effets par défaut ('low', 'medium', 'high')
    defaultQuality: 'medium',
    
    // Paramètres spécifiques pour chaque qualité
    qualitySettings: {
      low: {
        particleCount: 10000,
        textureSize: 64,
        maxDistance: 500,
        updateFrequency: 30 // en frames par seconde
      },
      medium: {
        particleCount: 50000,
        textureSize: 128,
        maxDistance: 1000,
        updateFrequency: 60
      },
      high: {
        particleCount: 100000,
        textureSize: 256,
        maxDistance: 2000,
        updateFrequency: 60
      }
    },
    
    // Paramètres pour les effets météorologiques
    rain: {
      enabled: true,
      dropSize: 1.5,
      dropSpeed: 10,
      dropColor: 0x999999,
      opacityMultiplier: 0.8
    },
    snow: {
      enabled: true,
      flakeSize: 3.0,
      flakeSpeed: 2,
      flakeColor: 0xffffff,
      opacityMultiplier: 0.9,
      turbulence: 0.8
    },
    fog: {
      enabled: true,
      color: 0xcccccc,
      densityMultiplier: 0.7
    },
    clouds: {
      enabled: true,
      count: 20,
      color: 0xffffff,
      opacity: 0.8,
      height: 300
    },
    lightning: {
      enabled: true,
      color: 0x5555ff,
      frequency: 0.01, // probabilité par frame
      duration: 150 // ms
    },
    wind: {
      enabled: true,
      strengthMultiplier: 1.0,
      gustFrequency: 0.3,
      gustIntensity: 0.7
    }
  },
  
  // Seuils pour la détection automatique des capacités
  deviceDetection: {
    // Seuils pour les appareils mobiles
    mobile: {
      maxParticles: 10000,
      recommendedQuality: 'low'
    },
    // Seuils pour les appareils de bureau
    desktop: {
      lowSpec: {
        maxParticles: 20000,
        recommendedQuality: 'low'
      },
      midSpec: {
        maxParticles: 50000,
        recommendedQuality: 'medium'
      },
      highSpec: {
        maxParticles: 100000,
        recommendedQuality: 'high'
      }
    }
  }
};

/**
 * Détecte les capacités de l'appareil pour la visualisation 3D
 * @param {THREE.WebGLRenderer} renderer - Le renderer WebGL
 * @returns {Object} Les capacités détectées
 */
export const detectDeviceCapabilities = (renderer) => {
  if (!renderer) return null;
  
  const gpu = renderer.capabilities;
  const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const touchScreen = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  
  // Détection de la puissance GPU basée sur les capacités
  const hasHighEndGPU = gpu.floatFragmentTextures && gpu.drawBuffers && gpu.maxTextureSize >= 4096;
  const hasMidEndGPU = gpu.floatFragmentTextures && gpu.maxTextureSize >= 2048;
  
  // Estimation du niveau de performance
  let performanceLevel = 'low';
  if (hasHighEndGPU && !mobile) {
    performanceLevel = 'high';
  } else if (hasMidEndGPU || (!mobile && gpu.maxTextureSize >= 2048)) {
    performanceLevel = 'medium';
  }
  
  // Déterminer la qualité recommandée
  let recommendedQuality = 'low';
  let maxParticles = GENERAL_CONFIG.deviceDetection.mobile.maxParticles;
  
  if (mobile || touchScreen) {
    recommendedQuality = GENERAL_CONFIG.deviceDetection.mobile.recommendedQuality;
    maxParticles = GENERAL_CONFIG.deviceDetection.mobile.maxParticles;
  } else {
    // Pour les ordinateurs de bureau
    switch (performanceLevel) {
      case 'high':
        recommendedQuality = GENERAL_CONFIG.deviceDetection.desktop.highSpec.recommendedQuality;
        maxParticles = GENERAL_CONFIG.deviceDetection.desktop.highSpec.maxParticles;
        break;
      case 'medium':
        recommendedQuality = GENERAL_CONFIG.deviceDetection.desktop.midSpec.recommendedQuality;
        maxParticles = GENERAL_CONFIG.deviceDetection.desktop.midSpec.maxParticles;
        break;
      default:
        recommendedQuality = GENERAL_CONFIG.deviceDetection.desktop.lowSpec.recommendedQuality;
        maxParticles = GENERAL_CONFIG.deviceDetection.desktop.lowSpec.maxParticles;
    }
  }
  
  return {
    gpuComputation: gpu.floatFragmentTextures && !touchScreen, // Les appareils tactiles ont souvent des GPU moins puissants
    maxParticles,
    recommendedQuality,
    isMobile: mobile,
    isTouch: touchScreen,
    performanceLevel,
    highPrecisionSupported: !!gpu.getShaderPrecisionFormat(gpu.VERTEX_SHADER, gpu.HIGH_FLOAT).precision,
    textureSize: gpu.maxTextureSize,
    maxAttributes: gpu.maxAttributes,
    drawBuffers: !!gpu.drawBuffers,
    instancedArrays: !!gpu.instancedArrays
  };
};

/**
 * Obtient les paramètres de qualité pour la visualisation
 * @param {string} quality - Niveau de qualité ('low', 'medium', 'high')
 * @returns {Object} Paramètres de qualité
 */
export const getQualitySettings = (quality = 'medium') => {
  const validQuality = ['low', 'medium', 'high'].includes(quality) ? quality : 'medium';
  return GENERAL_CONFIG.weatherEffects.qualitySettings[validQuality];
};

/**
 * Configure les paramètres de visualisation en fonction des capacités de l'appareil
 * @param {Object} capabilities - Capacités détectées
 * @param {Object} userPreferences - Préférences utilisateur
 * @returns {Object} Configuration adaptée
 */
export const getOptimizedConfig = (capabilities, userPreferences = {}) => {
  if (!capabilities) return GENERAL_CONFIG;
  
  // Fusionner les paramètres par défaut avec les préférences utilisateur
  const mergedConfig = { ...GENERAL_CONFIG };
  
  // Ajuster la qualité en fonction des capacités
  mergedConfig.weatherEffects.useGPUComputation = capabilities.gpuComputation;
  mergedConfig.weatherEffects.defaultQuality = capabilities.recommendedQuality;
  
  // Appliquer les préférences utilisateur
  if (userPreferences.quality) {
    mergedConfig.weatherEffects.defaultQuality = userPreferences.quality;
  }
  
  if (userPreferences.useGPUComputation !== undefined) {
    mergedConfig.weatherEffects.useGPUComputation = userPreferences.useGPUComputation;
  }
  
  // Ajuster les paramètres du rendu pour les appareils mobiles
  if (capabilities.isMobile) {
    mergedConfig.renderer.shadowsEnabled = false;
    mergedConfig.renderer.pixelRatio = Math.min(1.5, window.devicePixelRatio || 1);
    mergedConfig.colVisualization.terrainScale.vertical = 1.2; // Moins d'exagération pour éviter les problèmes de performance
  }
  
  return mergedConfig;
};
