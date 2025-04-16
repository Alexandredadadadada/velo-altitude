/**
 * Configuration pour la visualisation météorologique en 3D
 * Cette configuration est adaptée dynamiquement selon les capacités de l'appareil
 */

import { DeviceCapabilities } from '../utils/device';

/**
 * Configuration pour la visualisation météorologique
 */
export interface WeatherVisualizationConfig {
  particleSystems: {
    rain: {
      low: { count: number, size: number },
      medium: { count: number, size: number },
      high: { count: number, size: number }
    },
    snow: {
      low: { count: number, size: number },
      medium: { count: number, size: number },
      high: { count: number, size: number }
    }
  },
  performance: {
    mobileLimits: {
      maxParticles: number,
      maxTextureSize: number,
      preferredQuality: 'low' | 'medium' | 'high'
    },
    powerSaving: {
      batteryThreshold: number, // 0-1
      reducedParticleMultiplier: number
    }
  },
  weatherEffects: {
    rain: {
      opacity: number,
      speed: { min: number, max: number },
      color: string,
      dropLength: number
    },
    snow: {
      opacity: number,
      speed: { min: number, max: number },
      color: string,
      size: { min: number, max: number }
    },
    fog: {
      density: { min: number, max: number },
      color: string
    },
    wind: {
      visible: boolean,
      particleMultiplier: number
    }
  },
  terrain: {
    textures: {
      low: number,
      medium: number,
      high: number
    },
    detail: {
      low: number,
      medium: number,
      high: number
    }
  }
}

/**
 * Configuration par défaut pour la visualisation météorologique
 */
export const defaultConfig: WeatherVisualizationConfig = {
  particleSystems: {
    rain: {
      low: { count: 1000, size: 0.8 },
      medium: { count: 3000, size: 1.0 },
      high: { count: 5000, size: 1.2 }
    },
    snow: {
      low: { count: 800, size: 1.2 },
      medium: { count: 2000, size: 1.5 },
      high: { count: 4000, size: 1.8 }
    }
  },
  performance: {
    mobileLimits: {
      maxParticles: 2000,
      maxTextureSize: 2048,
      preferredQuality: 'medium'
    },
    powerSaving: {
      batteryThreshold: 0.2, // 20%
      reducedParticleMultiplier: 0.5
    }
  },
  weatherEffects: {
    rain: {
      opacity: 0.6,
      speed: { min: 15, max: 25 },
      color: '#ffffff',
      dropLength: 0.8
    },
    snow: {
      opacity: 0.7,
      speed: { min: 2, max: 5 },
      color: '#ffffff',
      size: { min: 0.1, max: 0.4 }
    },
    fog: {
      density: { min: 0.001, max: 0.03 },
      color: '#c8d0d3'
    },
    wind: {
      visible: true,
      particleMultiplier: 1.2
    }
  },
  terrain: {
    textures: {
      low: 1024,
      medium: 2048,
      high: 4096
    },
    detail: {
      low: 50,
      medium: 100,
      high: 200
    }
  }
};

/**
 * Obtient des paramètres optimisés pour l'appareil
 * @param deviceCapabilities Capacités de l'appareil
 * @param batteryLevel Niveau de batterie (optionnel)
 * @returns Configuration optimisée
 */
export function getDeviceOptimizedSettings(
  deviceCapabilities: DeviceCapabilities,
  batteryLevel?: number
): Partial<WeatherVisualizationConfig> {
  const config: Partial<WeatherVisualizationConfig> = {
    particleSystems: JSON.parse(JSON.stringify(defaultConfig.particleSystems))
  };

  // Optimisations mobiles
  if (deviceCapabilities.isMobile) {
    // Limiter le nombre de particules
    config.particleSystems.rain.high.count = Math.min(
      config.particleSystems.rain.high.count,
      defaultConfig.performance.mobileLimits.maxParticles
    );
    config.particleSystems.snow.high.count = Math.min(
      config.particleSystems.snow.high.count,
      defaultConfig.performance.mobileLimits.maxParticles
    );
    
    // Limiter également les réglages medium et low
    config.particleSystems.rain.medium.count = Math.min(
      config.particleSystems.rain.medium.count,
      defaultConfig.performance.mobileLimits.maxParticles * 0.6
    );
    config.particleSystems.snow.medium.count = Math.min(
      config.particleSystems.snow.medium.count,
      defaultConfig.performance.mobileLimits.maxParticles * 0.6
    );
  }

  // Mode économie d'énergie
  if (batteryLevel !== undefined && batteryLevel <= defaultConfig.performance.powerSaving.batteryThreshold) {
    const multiplier = defaultConfig.performance.powerSaving.reducedParticleMultiplier;
    
    // Réduire le nombre de particules
    Object.keys(config.particleSystems).forEach(system => {
      Object.keys(config.particleSystems[system]).forEach(quality => {
        config.particleSystems[system][quality].count *= multiplier;
      });
    });
    
    // Réduire également la qualité des textures
    if (!config.terrain) {
      config.terrain = { 
        textures: { ...defaultConfig.terrain.textures },
        detail: { ...defaultConfig.terrain.detail }
      };
    }
    
    // Réduire la qualité des textures et des détails
    config.terrain.textures.high = Math.min(config.terrain.textures.high, 2048);
    config.terrain.detail.high = Math.min(config.terrain.detail.high, 100);
  }

  // Optimisations spécifiques aux appareils à faible puissance
  if (deviceCapabilities.performanceLevel === 'low') {
    if (!config.terrain) {
      config.terrain = { 
        textures: { ...defaultConfig.terrain.textures },
        detail: { ...defaultConfig.terrain.detail }
      };
    }
    
    // Réduire davantage les textures et les détails
    config.terrain.textures.medium = Math.min(config.terrain.textures.medium, 1024);
    config.terrain.textures.high = Math.min(config.terrain.textures.high, 1024);
    config.terrain.detail.medium = Math.min(config.terrain.detail.medium, 50);
    config.terrain.detail.high = Math.min(config.terrain.detail.high, 75);
    
    // Désactiver certains effets
    if (!config.weatherEffects) {
      config.weatherEffects = { ...defaultConfig.weatherEffects };
    }
    config.weatherEffects.wind.visible = false;
  }

  return config;
}

/**
 * Type pour les avertissements de vent
 */
export interface WindWarning {
  speed: number;      // Vitesse en km/h
  direction: number;  // Direction en degrés
  gustiness?: number; // Facteur de rafale (1.0 = normal)
}

/**
 * Interface pour les effets météorologiques
 */
export interface WeatherEffects {
  rain?: {
    intensity: number;
    isSnow: boolean;
  } | null;
  wind?: {
    speed: number;
    direction: number;
    gustFactor: number;
  };
  fog?: {
    density: number;
  } | null;
}

/**
 * Interface pour la localisation géographique
 */
export interface GeoLocation {
  lat: number;
  lng: number;
  altitude?: number;
}
