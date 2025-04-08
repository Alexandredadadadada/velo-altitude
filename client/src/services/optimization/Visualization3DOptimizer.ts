import * as THREE from 'three';
import { LODManager } from './components/LODManager';
import { TextureManager } from './components/TextureManager';
import { RenderOptimizer } from './components/RenderOptimizer';
import { MemoryManager } from './components/MemoryManager';

/**
 * Gestionnaire d'optimisation pour les visualisations 3D
 * Optimise le rendu, les textures, les maillages et la mémoire
 */
export class Visualization3DOptimizer {
  private lodManager: LODManager;
  private textureManager: TextureManager;
  private renderOptimizer: RenderOptimizer;
  private memoryManager: MemoryManager;
  
  private config = {
    lod: {
      levels: [
        { distance: 500, segments: 64, textures: 'high' },
        { distance: 1000, segments: 128, textures: 'medium' },
        { distance: 2000, segments: 256, textures: 'low' }
      ],
      updateInterval: 1000,
      autoAdjust: true
    },
    textures: {
      maxSize: 2048,
      format: 'webp',
      compression: true,
      mipMapping: true,
      anisotropy: 4,
      progressive: {
        enabled: true,
        initial: {
          resolution: 512,
          quality: 'low'
        },
        upgrade: {
          resolution: 2048,
          quality: 'high',
          delayMs: 1000
        }
      }
    },
    render: {
      frustumCulling: true,
      occlusionCulling: true, 
      instancedMeshes: true,
      shaderOptimization: {
        precision: 'mediump',
        defines: {
          USE_DERIVATIVES: true,
          USE_TANGENT: false
        }
      }
    },
    memory: {
      textureCache: 100,  // MB
      geometryCache: 50,  // MB
      disposalStrategy: 'LRU',
      cleanupInterval: 30000,
      threshold: 0.8
    }
  };

  /**
   * Crée une nouvelle instance de l'optimiseur 3D
   * @param customConfig Configuration personnalisée (optionnelle)
   */
  constructor(customConfig?: Partial<typeof Visualization3DOptimizer.prototype.config>) {
    // Fusion de la configuration par défaut avec la configuration personnalisée
    if (customConfig) {
      this.config = this.mergeConfigs(this.config, customConfig);
    }
    
    // Initialisation des gestionnaires
    this.lodManager = new LODManager(this.config.lod);
    this.textureManager = new TextureManager(this.config.textures);
    this.renderOptimizer = new RenderOptimizer(this.config.render);
    this.memoryManager = new MemoryManager(this.config.memory);
  }

  /**
   * Optimise l'ensemble de la scène 3D
   * @param scene Scène Three.js à optimiser
   * @param camera Caméra utilisée pour le rendu
   * @param renderer Renderer Three.js
   */
  public optimizeScene(scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer): void {
    console.log('[Visualization3DOptimizer] Optimizing scene...');
    
    // Appliquer les optimisations pour chaque composant
    this.applyLOD(scene, camera);
    this.optimizeTextures(scene);
    this.optimizeRendering(scene, renderer);
    this.setupMemoryManagement(scene);
    
    // Configurer les mises à jour périodiques
    this.setupUpdateLoop(scene, camera, renderer);
  }

  /**
   * Configure les niveaux de détail pour la scène
   * @param scene Scène à configurer
   * @param camera Caméra pour le calcul des distances
   */
  private applyLOD(scene: THREE.Scene, camera: THREE.Camera): void {
    this.lodManager.setup(scene, camera);
  }

  /**
   * Optimise toutes les textures utilisées dans la scène
   * @param scene Scène contenant les objets avec textures
   */
  private optimizeTextures(scene: THREE.Scene): void {
    this.textureManager.processScene(scene);
  }

  /**
   * Applique les optimisations de rendu
   * @param scene Scène à optimiser
   * @param renderer Renderer à configurer
   */
  private optimizeRendering(scene: THREE.Scene, renderer: THREE.WebGLRenderer): void {
    this.renderOptimizer.optimize(scene, renderer);
  }

  /**
   * Configure la gestion de la mémoire
   * @param scene Scène à surveiller
   */
  private setupMemoryManagement(scene: THREE.Scene): void {
    this.memoryManager.monitor(scene);
  }

  /**
   * Configure la boucle de mise à jour des optimisations
   * @param scene Scène à mettre à jour
   * @param camera Caméra pour le calcul des distances
   * @param renderer Renderer à optimiser
   */
  private setupUpdateLoop(scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer): void {
    const update = () => {
      this.lodManager.update(camera);
      this.memoryManager.checkMemoryUsage();
      
      // Planifier la prochaine mise à jour
      setTimeout(update, this.config.lod.updateInterval);
    };
    
    // Démarrer la boucle de mise à jour
    update();
  }

  /**
   * Libère les ressources utilisées par l'optimiseur
   */
  public dispose(): void {
    this.lodManager.dispose();
    this.textureManager.dispose();
    this.renderOptimizer.dispose();
    this.memoryManager.dispose();
  }

  /**
   * Retourne les métriques actuelles de performance
   */
  public getPerformanceMetrics() {
    return {
      memory: this.memoryManager.getMemoryUsage(),
      lod: this.lodManager.getCurrentLevel(),
      textures: this.textureManager.getTextureStats(),
      rendering: this.renderOptimizer.getRenderingStats()
    };
  }

  /**
   * Fusionne deux objets de configuration
   * @param defaultConfig Configuration par défaut
   * @param customConfig Configuration personnalisée
   */
  private mergeConfigs(defaultConfig: any, customConfig: any): any {
    const result = { ...defaultConfig };
    
    for (const key in customConfig) {
      if (typeof customConfig[key] === 'object' && !Array.isArray(customConfig[key])) {
        result[key] = this.mergeConfigs(defaultConfig[key] || {}, customConfig[key]);
      } else {
        result[key] = customConfig[key];
      }
    }
    
    return result;
  }
}

// Export d'une instance singleton pour utilisation globale
export const visualization3DOptimizer = new Visualization3DOptimizer();
