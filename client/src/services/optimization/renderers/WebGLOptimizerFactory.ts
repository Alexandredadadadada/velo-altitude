import * as THREE from 'three';
import { WebGLOptimizer, WebGLOptimizerConfig } from './WebGLOptimizer';

/**
 * Configuration par défaut pour l'optimiseur WebGL
 */
const DEFAULT_CONFIG: WebGLOptimizerConfig = {
  lod: {
    auto: true,
    level: 1,
    distanceThresholds: [5, 15, 30]
  },
  textures: {
    maxSize: 1024,
    anisotropy: 1,
    compress: true,
    mipmap: true
  },
  materials: {
    simplifyShaders: true,
    instancing: true,
    mergeSimilar: true
  },
  geometry: {
    mergeGeometries: true,
    useIndexedGeometry: true,
    decimateInBackground: true
  },
  rendering: {
    pixelRatio: typeof window !== 'undefined' ? 
      window.devicePixelRatio > 2 ? 2 : window.devicePixelRatio : 
      1,
    useFrustumCulling: true,
    useOcclusionCulling: true,
    depthPrepass: true
  },
  memory: {
    disposeUnusedObjects: true,
    textureCache: true,
    geometryCache: true
  }
};

/**
 * Fonction pour créer facilement un WebGLOptimizer avec une configuration par défaut
 * @param renderer Le renderer WebGL de Three.js
 * @param scene La scène Three.js
 * @param camera La caméra Three.js
 * @param config Configuration partielle de l'optimiseur (fusionnée avec les valeurs par défaut)
 * @returns Une instance de WebGLOptimizer configurée
 */
export function createWebGLOptimizer(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  config: Partial<WebGLOptimizerConfig> = {}
): WebGLOptimizer {
  // Fusion de la configuration partielle avec les valeurs par défaut
  const mergedConfig: WebGLOptimizerConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    lod: { ...DEFAULT_CONFIG.lod, ...config.lod },
    textures: { ...DEFAULT_CONFIG.textures, ...config.textures },
    materials: { ...DEFAULT_CONFIG.materials, ...config.materials },
    geometry: { ...DEFAULT_CONFIG.geometry, ...config.geometry },
    rendering: { ...DEFAULT_CONFIG.rendering, ...config.rendering },
    memory: { ...DEFAULT_CONFIG.memory, ...config.memory }
  };

  // Créer et retourner l'optimiseur
  return new WebGLOptimizer(renderer, scene, camera, mergedConfig);
}

/**
 * Fonction pour détecter automatiquement le niveau de performance de l'appareil
 * et créer un WebGLOptimizer avec des paramètres adaptés
 * @param renderer Le renderer WebGL de Three.js
 * @param scene La scène Three.js
 * @param camera La caméra Three.js
 * @returns Une instance de WebGLOptimizer configurée pour les performances de l'appareil
 */
export function createAdaptiveWebGLOptimizer(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera
): WebGLOptimizer {
  // Créer d'abord un optimiseur avec les paramètres par défaut
  const optimizer = new WebGLOptimizer(renderer, scene, camera, DEFAULT_CONFIG);
  
  // Utiliser sa méthode de détection des performances
  const performanceLevel = optimizer.detectDevicePerformance();
  
  // Adapter la configuration en fonction du niveau de performance
  let adaptedConfig: Partial<WebGLOptimizerConfig>;
  
  switch (performanceLevel) {
    case 'low':
      adaptedConfig = {
        lod: { level: 0, auto: true },
        textures: { maxSize: 512, anisotropy: 1 },
        rendering: { pixelRatio: 1 }
      };
      break;
      
    case 'medium':
      adaptedConfig = {
        lod: { level: 1, auto: true },
        textures: { maxSize: 1024, anisotropy: 2 },
        rendering: { pixelRatio: Math.min(1.5, window.devicePixelRatio || 1) }
      };
      break;
      
    case 'high':
    default:
      adaptedConfig = {
        lod: { level: 2, auto: true },
        textures: { maxSize: 2048, anisotropy: 4 },
        rendering: { pixelRatio: Math.min(2, window.devicePixelRatio || 1) }
      };
      break;
  }
  
  // Appliquer la configuration adaptée
  optimizer.updateConfig(adaptedConfig);
  
  return optimizer;
}
