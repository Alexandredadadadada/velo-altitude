/**
 * Configuration centralisée pour le système de visualisation
 * Définit les paramètres adaptifs pour différents appareils et conditions
 */
import { 
  DeviceCapabilities, 
  VisualizationSettings,
  WeatherPreset
} from './types';

export const VISUALIZATION_CONFIG = {
  // Configuration des performances
  performance: {
    // Paramètres des particules par niveau de qualité
    particles: {
      low: {
        rain: {
          count: 5000,
          batchSize: 1000,
          updateFrequency: 100
        },
        snow: {
          count: 3000,
          batchSize: 500,
          updateFrequency: 150
        }
      },
      medium: {
        rain: {
          count: 15000,
          batchSize: 2000,
          updateFrequency: 60
        },
        snow: {
          count: 10000,
          batchSize: 1000,
          updateFrequency: 100
        }
      },
      high: {
        rain: {
          count: 50000,
          batchSize: 5000,
          updateFrequency: 30
        },
        snow: {
          count: 30000,
          batchSize: 3000,
          updateFrequency: 50
        }
      }
    },
    
    // Configuration GPU
    gpu: {
      computeShaderEnabled: true,
      particleBatchSize: 10000,
      textureSize: 1024,
      updateRate: 60
    },
    
    // Surveillance des performances
    monitoring: {
      fpsThreshold: {
        min: 30,
        target: 60
      },
      adjustmentInterval: 5000,
      samplingRate: 1000
    }
  },

  // Configuration du terrain
  terrain: {
    detail: {
      low: { segments: 64, textureSize: 1024 },
      medium: { segments: 128, textureSize: 2048 },
      high: { segments: 256, textureSize: 4096 }
    },
    materials: {
      snow: {
        threshold: 2000, // Altitude en mètres
        blendRange: 200
      },
      rock: {
        normalScale: 1.5,
        roughness: 0.8
      }
    }
  },

  // Configuration d'adaptation
  adaptation: {
    enabled: true,
    
    mobile: {
      reducedEffects: {
        particles: 0.5,
        shadows: false,
        postProcessing: false
      },
      powerSaving: {
        batteryThreshold: 0.2,
        extreme: {
          particles: 0.2,
          resolution: 0.5
        }
      }
    },

    desktop: {
      highEnd: {
        particles: 1.5,
        shadows: true,
        postProcessing: true
      }
    }
  },

  // Configuration des transitions
  transitions: {
    defaultDuration: 3000,
    easing: 'easeInOutCubic',
    properties: {
      precipitation: { min: 0, max: 1, step: 0.01 },
      visibility: { min: 0, max: 1, step: 0.01 },
      windSpeed: { min: 0, max: 30, step: 0.1 }
    }
  }
};

/**
 * Détecte les capacités de l'appareil pour optimiser les paramètres de visualisation
 */
export function detectDeviceCapabilities(navigator: Navigator): DeviceCapabilities {
  // Détecter si mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Vérifier les capacités WebGL
  let webGL2 = false;
  let computeShaders = false;
  let floatTextures = false;
  
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    webGL2 = !!gl;
    
    if (gl) {
      // Vérifier les extensions nécessaires pour les calculs GPU
      computeShaders = !!gl.getExtension('OES_texture_float');
      floatTextures = !!gl.getExtension('EXT_color_buffer_float');
    }
  } catch (e) {
    console.warn('Erreur lors de la détection des capacités WebGL:', e);
  }
  
  // Estimation de la capacité GPU basée sur les fonctionnalités disponibles
  const hasGPU = webGL2 && floatTextures;
  
  // Estimation du niveau de performance (simple)
  const isHighEnd = hasGPU && !isMobile && window.navigator.hardwareConcurrency > 4;
  
  // Obtenir le niveau de batterie si disponible
  let batteryLevel: number | undefined;
  let isLowPowerMode = false;
  
  if (navigator.getBattery) {
    navigator.getBattery().then((battery: any) => {
      batteryLevel = battery.level;
      
      // iOS spécifique - détection de mode d'économie d'énergie (approximative)
      if (batteryLevel < 0.2 || battery.charging === false) {
        isLowPowerMode = true;
      }
    }).catch(() => {
      console.warn('Impossible d\'accéder aux informations de batterie');
    });
  }
  
  return {
    isMobile,
    isHighEnd,
    hasGPU,
    batteryLevel,
    isLowPowerMode,
    browserSupport: {
      webGL2,
      computeShaders,
      floatTextures
    }
  };
}

/**
 * Obtient les paramètres de visualisation optimisés pour l'appareil
 */
export function getDeviceOptimizedSettings(capabilities: DeviceCapabilities): VisualizationSettings {
  const settings: VisualizationSettings = {
    quality: 'medium',
    useGPU: capabilities.hasGPU,
    particleMultiplier: 1.0,
    shadowsEnabled: true,
    postProcessingEnabled: true,
    terrainDetail: VISUALIZATION_CONFIG.terrain.detail.medium.segments,
    textureResolution: VISUALIZATION_CONFIG.terrain.detail.medium.textureSize,
    adaptiveQuality: VISUALIZATION_CONFIG.adaptation.enabled
  };

  // Ajuster pour mobile
  if (capabilities.isMobile) {
    settings.quality = 'low';
    settings.shadowsEnabled = false;
    settings.postProcessingEnabled = false;
    settings.particleMultiplier = VISUALIZATION_CONFIG.adaptation.mobile.reducedEffects.particles;
    settings.terrainDetail = VISUALIZATION_CONFIG.terrain.detail.low.segments;
    settings.textureResolution = VISUALIZATION_CONFIG.terrain.detail.low.textureSize;
  } 
  // Ajuster pour haute performance
  else if (capabilities.isHighEnd) {
    settings.quality = 'high';
    settings.particleMultiplier = VISUALIZATION_CONFIG.adaptation.desktop.highEnd.particles;
    settings.terrainDetail = VISUALIZATION_CONFIG.terrain.detail.high.segments;
    settings.textureResolution = VISUALIZATION_CONFIG.terrain.detail.high.textureSize;
  }

  // Ajuster pour économie d'énergie
  if (capabilities.batteryLevel !== undefined && 
      capabilities.batteryLevel <= VISUALIZATION_CONFIG.adaptation.mobile.powerSaving.batteryThreshold) {
    settings.quality = 'low';
    settings.shadowsEnabled = false;
    settings.postProcessingEnabled = false;
    settings.particleMultiplier = VISUALIZATION_CONFIG.adaptation.mobile.powerSaving.extreme.particles;
  }

  return settings;
}

/**
 * Récupère les paramètres de particules pour un type et une qualité donnés
 */
export function getParticleSettings(quality: 'low' | 'medium' | 'high', type: 'rain' | 'snow') {
  return VISUALIZATION_CONFIG.performance.particles[quality][type];
}

export default VISUALIZATION_CONFIG;
