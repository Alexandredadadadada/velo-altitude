/**
 * Configuration des optimisations pour la visualisation météorologique
 * Contient des fonctions et paramètres pour adapter la qualité des effets
 * en fonction des performances et des capacités de l'appareil
 */

import { DeviceCapabilities } from '../../utils/device';

/**
 * Options d'optimisation pour les particules (pluie, neige)
 */
export const particleOptimizations = {
  /**
   * Détermine le nombre optimal de particules en fonction du FPS actuel
   * @param currentFPS FPS actuel
   * @param baseCount Nombre de base de particules
   * @returns Nombre ajusté de particules
   */
  getOptimalParticleCount: (currentFPS: number, baseCount: number): number => {
    const targetFPS = 60;
    const minCount = Math.max(baseCount * 0.1, 50); // Minimum pour maintenir l'effet visuel
    
    // Calculer le ratio de performance
    const ratio = currentFPS / targetFPS;
    
    // Si les performances sont bonnes, conserver le nombre de particules
    if (ratio >= 0.9) {
      return baseCount;
    }
    
    // Sinon, réduire progressivement le nombre de particules
    // avec une relation non-linéaire pour être plus réactif aux chutes de FPS
    const reductionFactor = Math.min(Math.pow(ratio, 2), 1);
    return Math.max(Math.floor(baseCount * reductionFactor), minCount);
  },
  
  /**
   * Détermine le niveau de détail (LOD) en fonction de la distance
   * @param distance Distance à la caméra
   * @param maxDistance Distance maximale visible
   * @returns Niveau de détail (low, medium, high)
   */
  getLODLevel: (distance: number, maxDistance: number): 'low' | 'medium' | 'high' => {
    const ratio = distance / maxDistance;
    if (ratio > 0.8) return 'low';
    if (ratio > 0.4) return 'medium';
    return 'high';
  },
  
  /**
   * Paramètres par défaut pour les systèmes de particules
   */
  defaultSettings: {
    rain: {
      high: { count: 15000, size: 1.0, speed: 1.0, opacity: 1.0 },
      medium: { count: 7500, size: 0.8, speed: 1.0, opacity: 0.9 },
      low: { count: 2500, size: 0.6, speed: 1.0, opacity: 0.8 }
    },
    snow: {
      high: { count: 10000, size: 1.0, speed: 0.7, opacity: 1.0 },
      medium: { count: 5000, size: 0.9, speed: 0.7, opacity: 0.9 },
      low: { count: 1500, size: 0.7, speed: 0.7, opacity: 0.8 }
    }
  },
  
  /**
   * Ajuste les paramètres d'un système de particules en fonction du niveau de qualité
   * @param system Type de système (rain, snow)
   * @param quality Niveau de qualité
   * @param deviceCapabilities Capacités de l'appareil
   * @returns Paramètres optimisés
   */
  getOptimizedParameters: (
    system: 'rain' | 'snow', 
    quality: 'low' | 'medium' | 'high',
    deviceCapabilities: DeviceCapabilities
  ): any => {
    const baseParams = particleOptimizations.defaultSettings[system][quality];
    
    // Ajuster pour les appareils mobiles (limiter davantage le nombre de particules)
    if (deviceCapabilities.isMobile) {
      return {
        ...baseParams,
        count: Math.floor(baseParams.count * 0.6)
      };
    }
    
    // Ajuster pour les appareils à haute résolution
    if (deviceCapabilities.devicePixelRatio > 2) {
      return {
        ...baseParams,
        size: baseParams.size * 1.2
      };
    }
    
    return baseParams;
  }
};

/**
 * Optimisations pour les textures
 */
export const textureOptimizations = {
  /**
   * Détermine la résolution optimale des textures en fonction de la distance et des capacités
   * @param distance Distance à la caméra
   * @param deviceCapabilities Capacités de l'appareil
   * @returns Résolution optimale de texture
   */
  getTextureResolution: (
    distance: number, 
    deviceCapabilities: DeviceCapabilities
  ): number => {
    // Vérifier les limites matérielles
    const maxTextureSize = 4096; // Valeur par défaut
    
    // Base de départ en fonction de la qualité et du pixel ratio
    let baseSize = 1024;
    if (deviceCapabilities.performanceLevel === 'high') {
      baseSize = 2048;
    } else if (deviceCapabilities.performanceLevel === 'low') {
      baseSize = 512;
    }
    
    // Ajuster pour les écrans haute résolution
    baseSize = Math.min(baseSize * deviceCapabilities.devicePixelRatio, maxTextureSize);
    
    // Ajuster en fonction de la distance (LOD)
    const distanceFactor = Math.max(0.25, 1 - (distance / 5000));
    return Math.min(Math.round(baseSize * distanceFactor / 64) * 64, maxTextureSize);
  },
  
  /**
   * Détermine si le mip-mapping doit être activé
   * @param deviceCapabilities Capacités de l'appareil
   * @returns True si le mip-mapping doit être activé
   */
  shouldUseMipMapping: (deviceCapabilities: DeviceCapabilities): boolean => {
    // Sur les appareils moins puissants, désactiver le mip-mapping peut réduire la charge GPU
    return deviceCapabilities.performanceLevel !== 'low';
  },
  
  /**
   * Détermine le format de compression de texture optimal
   * @param deviceCapabilities Capacités de l'appareil
   * @returns Format de compression recommandé
   */
  getCompressionFormat: (deviceCapabilities: DeviceCapabilities): string => {
    // Choix du format de compression en fonction des capacités
    if (deviceCapabilities.performanceLevel === 'high' && !deviceCapabilities.isMobile) {
      return 'ASTC'; // Format haute qualité pour les appareils puissants
    } else {
      return 'ETC2'; // Format plus largement pris en charge
    }
  }
};

/**
 * Optimisations pour les effets météorologiques
 */
export const weatherEffectOptimizations = {
  /**
   * Déterminer les paramètres d'effet de brouillard optimaux
   * @param visibility Visibilité en mètres
   * @param quality Niveau de qualité
   * @returns Paramètres optimisés pour le brouillard
   */
  getFogParameters: (
    visibility: number, 
    quality: 'low' | 'medium' | 'high'
  ): { density: number, useVolumetric: boolean } => {
    // Convertir la visibilité en densité de brouillard (relation inverse)
    let density = 0;
    if (visibility < 5000) {
      density = Math.min((5000 - visibility) / 5000 * 0.05, 0.05);
    }
    
    // Déterminer si utiliser le brouillard volumétrique (plus coûteux)
    const useVolumetric = quality === 'high' && visibility < 2000;
    
    return { density, useVolumetric };
  },
  
  /**
   * Déterminer les paramètres d'effet de vent optimaux
   * @param windSpeed Vitesse du vent en km/h
   * @param quality Niveau de qualité
   * @returns Paramètres optimisés pour les effets de vent
   */
  getWindParameters: (
    windSpeed: number,
    quality: 'low' | 'medium' | 'high'
  ): { 
    intensity: number, 
    affectTrees: boolean, 
    affectGrass: boolean,
    particleCount: number
  } => {
    // Normaliser l'intensité du vent sur une échelle de 0 à 1
    const intensity = Math.min(windSpeed / 100, 1);
    
    // Décider quels éléments sont affectés par le vent selon la qualité
    const affectTrees = true; // Toujours actif car visuellement important
    const affectGrass = quality !== 'low'; // Désactiver sur basse qualité
    
    // Nombre de particules pour les effets de vent (feuilles, poussière, etc.)
    let particleCount = 0;
    if (windSpeed > 20) {
      switch (quality) {
        case 'high':
          particleCount = 500;
          break;
        case 'medium':
          particleCount = 250;
          break;
        case 'low':
          particleCount = 100;
          break;
      }
    }
    
    return { intensity, affectTrees, affectGrass, particleCount };
  },
  
  /**
   * Détermine les paramètres d'effet de pluie/neige optimaux
   * @param precipitationType Type de précipitation ('rain' ou 'snow')
   * @param intensity Intensité des précipitations (0-1)
   * @param quality Niveau de qualité
   * @returns Paramètres optimisés pour les précipitations
   */
  getPrecipitationParameters: (
    precipitationType: 'rain' | 'snow',
    intensity: number,
    quality: 'low' | 'medium' | 'high'
  ): {
    particleCount: number,
    useCollision: boolean,
    useSplash: boolean,
    useSound: boolean
  } => {
    // Déterminer le nombre de base de particules selon le type
    const baseCount = precipitationType === 'rain' ? 15000 : 10000;
    
    // Ajuster selon la qualité
    let qualityFactor = 1.0;
    switch (quality) {
      case 'high':
        qualityFactor = 1.0;
        break;
      case 'medium':
        qualityFactor = 0.5;
        break;
      case 'low':
        qualityFactor = 0.2;
        break;
    }
    
    // Calculer le nombre final de particules
    const particleCount = Math.floor(baseCount * qualityFactor * intensity);
    
    // Déterminer les fonctionnalités additionnelles selon la qualité
    const useCollision = quality !== 'low';
    const useSplash = quality === 'high' && precipitationType === 'rain';
    const useSound = true; // Le son est important pour l'immersion
    
    return { particleCount, useCollision, useSplash, useSound };
  }
};

/**
 * Optimisations pour la mise à jour des effets
 */
export const updateFrequencyOptimizations = {
  /**
   * Détermine la fréquence optimale de mise à jour des effets météo
   * @param batteryLevel Niveau de batterie (0-1)
   * @param deviceCapabilities Capacités de l'appareil
   * @returns Intervalle de mise à jour en ms
   */
  getOptimalUpdateInterval: (
    batteryLevel: number | undefined,
    deviceCapabilities: DeviceCapabilities
  ): number => {
    // Intervalle de base en fonction de la puissance de l'appareil
    let baseInterval = 60000; // 1 minute par défaut
    
    switch (deviceCapabilities.performanceLevel) {
      case 'high':
        baseInterval = 30000; // 30 secondes
        break;
      case 'medium':
        baseInterval = 60000; // 1 minute
        break;
      case 'low':
        baseInterval = 120000; // 2 minutes
        break;
    }
    
    // Ajuster selon le niveau de batterie pour les appareils mobiles
    if (deviceCapabilities.isMobile && batteryLevel !== undefined) {
      if (batteryLevel < 0.15) {
        // Batterie très faible, mettre à jour moins fréquemment
        return baseInterval * 4;
      } else if (batteryLevel < 0.3) {
        // Batterie faible, mettre à jour moins fréquemment
        return baseInterval * 2;
      }
    }
    
    return baseInterval;
  },
  
  /**
   * Détermine si les mises à jour météo doivent être suspendues
   * @param batteryLevel Niveau de batterie
   * @param isBackgrounded Application en arrière-plan
   * @returns True si les mises à jour doivent être suspendues
   */
  shouldSuspendUpdates: (
    batteryLevel: number | undefined,
    isBackgrounded: boolean
  ): boolean => {
    // Suspendre les mises à jour si l'application est en arrière-plan
    if (isBackgrounded) return true;
    
    // Suspendre les mises à jour si la batterie est critique
    if (batteryLevel !== undefined && batteryLevel < 0.1) return true;
    
    return false;
  }
};

/**
 * Optimisations des effets de post-processing
 */
export const postProcessingOptimizations = {
  /**
   * Détermine les effets de post-processing à activer
   * @param quality Niveau de qualité
   * @param deviceCapabilities Capacités de l'appareil
   * @returns Effets à activer
   */
  getEnabledEffects: (
    quality: 'low' | 'medium' | 'high',
    deviceCapabilities: DeviceCapabilities
  ): {
    bloom: boolean,
    dof: boolean,
    ssao: boolean,
    godrays: boolean
  } => {
    // Configuration de base selon la qualité
    const base = {
      bloom: quality !== 'low',
      dof: quality === 'high',
      ssao: quality === 'high',
      godrays: quality === 'high'
    };
    
    // Ajustements spécifiques à l'appareil
    if (deviceCapabilities.isMobile) {
      // Désactiver les effets coûteux sur mobile
      return {
        ...base,
        dof: false,
        ssao: false,
        godrays: quality === 'high' && deviceCapabilities.performanceLevel === 'high'
      };
    }
    
    return base;
  },
  
  /**
   * Obtient les paramètres optimisés pour l'effet bloom
   * @param quality Niveau de qualité
   * @returns Paramètres de bloom
   */
  getBloomParameters: (quality: 'low' | 'medium' | 'high'): {
    strength: number,
    radius: number,
    threshold: number
  } => {
    switch (quality) {
      case 'high':
        return { strength: 0.7, radius: 0.7, threshold: 0.9 };
      case 'medium':
        return { strength: 0.5, radius: 0.5, threshold: 0.9 };
      case 'low':
      default:
        return { strength: 0.3, radius: 0.3, threshold: 0.9 };
    }
  }
};

/**
 * Objet exporté contenant toutes les optimisations
 */
export const visualizationOptimizations = {
  particleOptimizations,
  textureOptimizations,
  weatherEffectOptimizations,
  updateFrequencyOptimizations,
  postProcessingOptimizations
};
