import * as THREE from 'three';
import { unifiedCacheManager } from '../CacheManager';
import SimplifyModifier from '../../../utils/three/SimplifyModifier';

/**
 * Interface de configuration pour l'optimiseur WebGL
 */
export interface WebGLOptimizerConfig {
  // Niveau de détail (0-5, 0 étant le plus détaillé)
  lod: {
    auto: boolean;
    level: number;
    distanceThresholds: number[];
  };
  // Gestion des textures
  textures: {
    maxSize: number;
    anisotropy: number;
    mipMapping: boolean;
    compression: boolean;
  };
  // Gestion de la géométrie
  geometry: {
    decimationRatio: number;
    instancing: boolean;
    mergeGeometries: boolean;
  };
  // Gestion des ombres
  shadows: {
    enabled: boolean;
    type: 'basic' | 'pcf' | 'pcfsoft' | 'none';
    mapSize: number;
  };
  // Mise en cache
  caching: {
    geometries: boolean;
    textures: boolean;
    materials: boolean;
    ttl: number;
  };
  // Rendu
  rendering: {
    antialiasing: boolean;
    pixelRatio: number | 'auto';
    throttleWhenHidden: boolean;
    lowPowerMode: boolean;
  };
  // Mémoire
  memory: {
    textureCache: boolean;
    geometryCache: boolean;
    disposeUnusedObjects: boolean;
  };
}

/**
 * Optimiseur WebGL pour les visualisations 3D
 * Améliore les performances des rendus Three.js
 */
export class WebGLOptimizer {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private config: WebGLOptimizerConfig;
  private originalObjects: Map<string, THREE.Object3D> = new Map();
  private lodModels: Map<string, Map<number, THREE.Object3D>> = new Map();
  private textureCache: Map<string, THREE.Texture> = new Map();
  private geometryCache: Map<string, THREE.BufferGeometry> = new Map();
  private simplifyModifier: SimplifyModifier;
  private instancedMeshes: Map<string, THREE.InstancedMesh> = new Map();
  private fps: number = 60;
  private isVisible: boolean = true;
  private devicePerformance: 'high' | 'medium' | 'low' = 'medium';
  private animationFrameId: number | null = null;
  private lastRenderTime: number = 0;
  private performanceReportingIntervalId: number | null = null;
  private lastReportTime: number = 0;
  private frameCount: number = 0;
  private totalFPS: number = 0;
  private fpsCount: number = 0;
  private averageFPS: number = 0;
  private lowFPSCount: number = 0;
  private reportInterval: number = 1000; // 1 seconde

  // Configuration par défaut
  private defaultConfig: WebGLOptimizerConfig = {
    lod: {
      auto: true,
      level: 2,
      distanceThresholds: [10, 50, 100, 200, 500]
    },
    textures: {
      maxSize: 2048,
      anisotropy: 4,
      mipMapping: true,
      compression: true
    },
    geometry: {
      decimationRatio: 0.5,
      instancing: true,
      mergeGeometries: true
    },
    shadows: {
      enabled: true,
      type: 'pcf',
      mapSize: 1024
    },
    caching: {
      geometries: true,
      textures: true,
      materials: true,
      ttl: 60 * 60 * 1000 // 1 heure
    },
    rendering: {
      antialiasing: true,
      pixelRatio: 'auto',
      throttleWhenHidden: true,
      lowPowerMode: false
    },
    memory: {
      textureCache: true,
      geometryCache: true,
      disposeUnusedObjects: true
    }
  };

  /**
   * Crée un nouvel optimiseur WebGL
   * @param renderer Renderer Three.js
   * @param scene Scene Three.js
   * @param camera Caméra Three.js
   * @param customConfig Configuration personnalisée (partielle)
   */
  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    customConfig: Partial<WebGLOptimizerConfig> = {}
  ) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.config = this.mergeConfigs(this.defaultConfig, customConfig);
    
    this.textureCache = new Map<string, THREE.Texture>();
    this.geometryCache = new Map<string, THREE.BufferGeometry>();
    this.simplifyModifier = new SimplifyModifier();
    this.instancedMeshes = new Map<string, THREE.InstancedMesh>();
    
    this.initialize();
  }

  /**
   * Initialise l'optimiseur
   */
  private initialize(): void {
    // Détecter les capacités du périphérique
    this.detectDevicePerformance();
    
    // Configurer le renderer
    this.optimizeRenderer();
    
    // Mettre en place les écouteurs d'événements
    this.setupEventListeners();
    
    // Optimiser la scène initiale
    this.optimizeScene();
    
    // Configuration du rapport périodique des performances
    this.setupPerformanceReporting();
  }

  /**
   * Détecte les capacités du périphérique
   */
  private detectDevicePerformance(): void {
    // Vérifier l'UA et les capacités GPU
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isOldDevice = /iPhone\s(5|6|7|8)|iPad\s(Mini|Air)|Android\s[4-6]/i.test(navigator.userAgent);
    
    // Vérifier les capacités WebGL
    const gl = this.renderer.getContext();
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    let gpuInfo = '';
    
    if (debugInfo) {
      gpuInfo = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
    }
    
    const isLowEndGPU = /Intel|HD Graphics|Iris|GMA|Mali-[4-6]|Adreno [23]/i.test(gpuInfo);
    
    // Déterminer le niveau de performance
    if (isMobile || isOldDevice || isLowEndGPU) {
      this.devicePerformance = 'low';
      // Adapter la configuration
      this.adaptConfigToPerformance('low');
    } else if (/ GTX | RTX | Radeon RX | Quadro | Tesla /i.test(gpuInfo)) {
      this.devicePerformance = 'high';
    } else {
      this.devicePerformance = 'medium';
      // Configuration modérément adaptée
      this.adaptConfigToPerformance('medium');
    }
  }

  /**
   * Adapte la configuration au niveau de performance
   * @param level Niveau de performance
   */
  private adaptConfigToPerformance(level: 'low' | 'medium' | 'high'): void {
    switch (level) {
      case 'low':
        this.config.lod.level = 4;
        this.config.textures.maxSize = 1024;
        this.config.textures.anisotropy = 1;
        this.config.shadows.enabled = false;
        this.config.rendering.antialiasing = false;
        this.config.rendering.pixelRatio = Math.min(1, window.devicePixelRatio);
        break;
      case 'medium':
        this.config.lod.level = 2;
        this.config.textures.maxSize = 2048;
        this.config.textures.anisotropy = 2;
        this.config.shadows.type = 'basic';
        this.config.rendering.pixelRatio = Math.min(1.5, window.devicePixelRatio);
        break;
      // La configuration 'high' reste celle par défaut
    }
  }

  /**
   * Optimise les paramètres du renderer
   */
  private optimizeRenderer(): void {
    // Configurer le pixel ratio
    if (this.config.rendering.pixelRatio === 'auto') {
      this.renderer.setPixelRatio(window.devicePixelRatio);
    } else {
      this.renderer.setPixelRatio(this.config.rendering.pixelRatio as number);
    }
    
    // Configurer les ombres
    this.renderer.shadowMap.enabled = this.config.shadows.enabled;
    
    switch (this.config.shadows.type) {
      case 'basic':
        this.renderer.shadowMap.type = THREE.BasicShadowMap;
        break;
      case 'pcf':
        this.renderer.shadowMap.type = THREE.PCFShadowMap;
        break;
      case 'pcfsoft':
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        break;
      case 'none':
        this.renderer.shadowMap.enabled = false;
        break;
    }
    
    // Utiliser les nouvelles propriétés pour Three.js moderne, et
    // employer des châtellements de type pour la compatibilité avec
    // différentes versions de Three.js
    if ('outputColorSpace' in this.renderer) {
      (this.renderer as any).outputColorSpace = THREE.SRGBColorSpace;
    } else {
      // Utiliser une valeur par défaut sûre pour toutes les versions de Three.js
      (this.renderer as any).outputEncoding = 3001; // SRGBEncoding a pour valeur 3001 dans Three.js
    }
    
    // Gestion des lumières physiques
    if ('useLegacyLights' in this.renderer) {
      (this.renderer as any).useLegacyLights = false;
    } else if ('physicallyCorrectLights' in this.renderer) {
      (this.renderer as any).physicallyCorrectLights = true;
    }
  }

  /**
   * Configure les écouteurs d'événements
   */
  private setupEventListeners(): void {
    // Observer la visibilité de la page
    if (document.hidden !== undefined && this.config.rendering.throttleWhenHidden) {
      document.addEventListener('visibilitychange', () => {
        this.isVisible = !document.hidden;
      });
    }
    
    // Observer les FPS et ajuster dynamiquement si nécessaire
    if (typeof window.requestAnimationFrame === 'function') {
      let lastTime = performance.now();
      let frames = 0;
      
      const measureFPS = () => {
        const now = performance.now();
        frames++;
        
        if (now >= lastTime + 1000) {
          this.fps = (frames * 1000) / (now - lastTime);
          frames = 0;
          lastTime = now;
          
          // Adapter la qualité en fonction des FPS
          this.adaptToFPS();
        }
        
        requestAnimationFrame(measureFPS);
      };
      
      requestAnimationFrame(measureFPS);
    }
    
    // Observer les changements de taille de fenêtre
    window.addEventListener('resize', () => {
      // Adapter les paramètres de rendu si nécessaire
      if (this.config.rendering.lowPowerMode && window.innerWidth < 768) {
        this.adaptConfigToPerformance('low');
        this.optimizeRenderer();
      }
    });
  }

  /**
   * Configure le reporting de performance périodique
   */
  private setupPerformanceReporting(): void {
    // Rapport périodique vers le PerformanceMonitor
    if (typeof window !== 'undefined') {
      this.performanceReportingIntervalId = window.setInterval(() => {
        this.reportPerformanceMetrics();
      }, this.reportInterval); // Rapport toutes les secondes
    }
  }

  /**
   * Optimise la scène entière
   */
  private optimizeScene(): void {
    // Stocker les objets originaux pour référence
    this.scene.traverse((object) => {
      if (object.uuid) {
        this.originalObjects.set(object.uuid, object.clone());
      }
      
      // Optimiser chaque objet
      this.optimizeObject(object);
    });
  }

  /**
   * Optimise un objet 3D
   * @param object Objet 3D à optimiser
   */
  private optimizeObject(object: THREE.Object3D): void {
    // Optimiser la géométrie
    if (object instanceof THREE.Mesh && object.geometry) {
      this.optimizeGeometry(object);
    }
    
    // Optimiser les textures
    if (object instanceof THREE.Mesh && object.material) {
      this.optimizeMaterial(object);
    }
    
    // Optimiser les ombres
    if (object instanceof THREE.Light) {
      this.optimizeLight(object);
    }
  }

  /**
   * Optimise une géométrie
   * @param mesh Mesh à optimiser
   */
  private optimizeGeometry(mesh: THREE.Mesh): void {
    if (!mesh.geometry) return;
    
    // Créer des LOD pour les objets complexes
    if (mesh.geometry instanceof THREE.BufferGeometry && 
        mesh.geometry.attributes.position &&
        mesh.geometry.attributes.position.count > 1000) {
      
      this.generateLOD(mesh);
    }
    
    // Fusionner les géométries statiques si configuré
    if (this.config.geometry.mergeGeometries) {
      // La fusion serait implémentée ici
    }
    
    // Mettre en cache la géométrie
    if (this.config.caching.geometries) {
      const geometryId = mesh.geometry.uuid;
      // Utiliser le cache unifié pour stocker la géométrie
      unifiedCacheManager.set(`geometry_${geometryId}`, mesh.geometry.toJSON());
    }
  }

  /**
   * Simplifie une géométrie en réduisant le nombre de vertices
   * @param geometry Géométrie à simplifier
   * @param ratio Ratio de simplification (0-1, où 0 est la simplification maximale)
   * @param preserveBoundaries Si true, préserve les bords de la géométrie
   * @returns La géométrie simplifiée ou null en cas d'échec
   */
  simplifyGeometry(geometry: THREE.BufferGeometry, ratio: number, preserveBoundaries: boolean = true): THREE.BufferGeometry | null {
    try {
      // Vérifier si la géométrie est déjà dans le cache avec ce ratio
      const cacheKey = `${geometry.uuid}_${ratio}`;
      if (this.geometryCache.has(cacheKey)) {
        return this.geometryCache.get(cacheKey) as THREE.BufferGeometry;
      }

      // Vérifier que le ratio est valide
      if (ratio < 0 || ratio > 1) {
        console.warn('WebGLOptimizer: ratio de simplification invalide, doit être entre 0 et 1');
        return geometry;
      }

      // Utiliser SimplifyModifier pour simplifier la géométrie
      const simplified = this.simplifyModifier.simplify(geometry, ratio, preserveBoundaries);

      // Mettre en cache le résultat
      if (this.config.memory.geometryCache) {
        this.geometryCache.set(cacheKey, simplified);
      }

      return simplified;
    } catch (error) {
      console.error('WebGLOptimizer: Erreur lors de la simplification de la géométrie', error);
      return null;
    }
  }

  /**
   * Optimise un matériau et ses textures
   * @param mesh Mesh avec matériau à optimiser
   */
  private optimizeMaterial(mesh: THREE.Mesh): void {
    if (!mesh.material) return;
    
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    
    materials.forEach(material => {
      // Optimiser chaque texture du matériau
      Object.keys(material).forEach(key => {
        const value = (material as any)[key];
        
        if (value instanceof THREE.Texture) {
          this.optimizeTexture(value);
        }
      });
      
      // Mettre en cache le matériau
      if (this.config.caching.materials) {
        const materialId = material.uuid;
        
        // En raison des différences de signature entre les versions de Three.js,
        // utiliser une approche simplifiée pour la sérialisation
        const simplifiedMaterial = {
          uuid: material.uuid,
          type: material.type,
          color: material instanceof THREE.MeshBasicMaterial && material.color ? 
                 material.color.getHex() : undefined,
          properties: {}
        };
        
        unifiedCacheManager.set(`material_${materialId}`, simplifiedMaterial);
      }
    });
  }

  /**
   * Optimise une texture pour réduire la consommation mémoire
   * @param texture Texture à optimiser
   */
  private optimizeTexture(texture: THREE.Texture): void {
    if (!texture) return;

    // Appliquer la configuration des textures
    const config = this.config.textures;

    // Définir la taille maximale
    if (texture.image && config.maxSize) {
      const maxDimension = Math.max(texture.image.width, texture.image.height);
      if (maxDimension > config.maxSize) {
        const scale = config.maxSize / maxDimension;
        texture.image.width *= scale;
        texture.image.height *= scale;
        texture.needsUpdate = true;
      }
    }

    // Configurer l'anisotropie
    if (config.anisotropy && this.renderer.capabilities.getMaxAnisotropy) {
      const maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy();
      texture.anisotropy = Math.min(config.anisotropy, maxAnisotropy);
    }

    // Activer/désactiver le mipmap
    texture.generateMipmaps = config.mipMapping;

    // Définir les filtres de texture pour économiser de la mémoire
    if (!config.mipMapping) {
      texture.minFilter = THREE.LinearFilter;
    }

    // Mode de répétition
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

    // Forcer la mise à jour
    texture.needsUpdate = true;
  }

  /**
   * Charge une texture avec optimisation et mise en cache
   * @param url URL de la texture
   * @returns Promise avec la texture
   */
  async loadTexture(url: string): Promise<THREE.Texture> {
    // Vérifier si la texture est déjà dans le cache
    if (this.textureCache.has(url)) {
      return this.textureCache.get(url) as THREE.Texture;
    }

    // Créer un chargeur de texture
    const textureLoader = new THREE.TextureLoader();
    
    return new Promise<THREE.Texture>((resolve, reject) => {
      textureLoader.load(
        url,
        (texture) => {
        // Optimiser la texture chargée
        this.optimizeTexture(texture);
        
        // Mettre en cache si nécessaire
        if (this.config.memory.textureCache) {
          this.textureCache.set(url, texture);
        }
        
        resolve(texture);
      },
      undefined,
      (error) => {
        console.error('WebGLOptimizer: Erreur lors du chargement de la texture', error);
        reject(error);
      }
      );
    });
  }

  /**
   * Crée ou récupère un maillage instancié pour un modèle donné
   * @param geometry Géométrie de base
   * @param material Matériau à utiliser
   * @param count Nombre maximal d'instances
   * @param key Clé unique pour identifier ce groupe de maillages instanciés
   * @returns Un maillage instancié
   */
  getInstancedMesh(geometry: THREE.BufferGeometry, material: THREE.Material, count: number, key: string): THREE.InstancedMesh {
    // Vérifier si ce maillage instancié existe déjà
    if (this.instancedMeshes.has(key)) {
      return this.instancedMeshes.get(key) as THREE.InstancedMesh;
    }

    // Créer un nouveau maillage instancié
    const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
    instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    
    // Stocker dans le cache
    this.instancedMeshes.set(key, instancedMesh);
    
    // Ajouter à la scène
    this.scene.add(instancedMesh);
    
    return instancedMesh;
  }

  /**
   * Configure une instance d'un maillage instancié
   * @param mesh Le maillage instancié
   * @param index L'index de l'instance
   * @param position La position
   * @param quaternion La rotation sous forme de quaternion
   * @param scale L'échelle
   */
  setInstanceMatrix(
    mesh: THREE.InstancedMesh, 
    index: number, 
    position: THREE.Vector3, 
    quaternion: THREE.Quaternion = new THREE.Quaternion(), 
    scale: THREE.Vector3 = new THREE.Vector3(1, 1, 1)
  ): void {
    const matrix = new THREE.Matrix4();
    matrix.compose(position, quaternion, scale);
    mesh.setMatrixAt(index, matrix);
    mesh.instanceMatrix.needsUpdate = true;
  }

  /**
   * Optimise une lumière
   * @param light Lumière à optimiser
   */
  private optimizeLight(light: THREE.Light): void {
    // Optimiser les paramètres d'ombre
    if ('shadow' in light && this.config.shadows.enabled) {
      const shadowLight = light as THREE.DirectionalLight | THREE.SpotLight;
      if (shadowLight.shadow) {
        // Configurer la qualité des ombres
        shadowLight.shadow.mapSize.width = this.config.shadows.mapSize;
        shadowLight.shadow.mapSize.height = this.config.shadows.mapSize;
        
        // Autres optimisations spécifiques aux ombres
        if (light instanceof THREE.DirectionalLight) {
          // Optimiser la frustum de l'ombre directionnelle
          if (shadowLight.shadow.camera instanceof THREE.OrthographicCamera) {
            shadowLight.shadow.camera.left = -100;
            shadowLight.shadow.camera.right = 100;
            shadowLight.shadow.camera.top = 100;
            shadowLight.shadow.camera.bottom = -100;
            
            // Optimiser pour le niveau de performance
            if (this.devicePerformance === 'low') {
              shadowLight.shadow.camera.near = 10;
              shadowLight.shadow.camera.far = 200;
              shadowLight.shadow.bias = 0.001;
            }
          }
        }
      }
    }
  }

  /**
   * Génère des niveaux de détail (LOD) pour un mesh
   * @param mesh Mesh pour lequel générer des LOD
   */
  private generateLOD(mesh: THREE.Mesh): void {
    if (!mesh.geometry) return;
    
    // Créer un groupe LOD
    const lod = new THREE.LOD();
    lod.position.copy(mesh.position);
    lod.rotation.copy(mesh.rotation);
    lod.scale.copy(mesh.scale);
    
    // Ajouter le mesh original (niveau 0)
    lod.addLevel(mesh, 0);
    
    // Générer des niveaux de détail supplémentaires
    const lodLevels = this.config.lod.distanceThresholds.length;
    
    // Stocker les niveaux pour ce mesh
    const meshLodMap = new Map<number, THREE.Object3D>();
    meshLodMap.set(0, mesh);
    
    for (let i = 1; i <= lodLevels; i++) {
      // Utiliser SimplifyModifier pour simplifier la géométrie
      const simplifiedGeometry = this.simplifyGeometry(
        mesh.geometry, 
        1 - (i * this.config.geometry.decimationRatio / lodLevels)
      );
      
      if (simplifiedGeometry) {
        const material = mesh.material instanceof THREE.Material
          ? mesh.material.clone()
          : Array.isArray(mesh.material)
            ? mesh.material.map(m => m.clone())
            : new THREE.MeshBasicMaterial();
        
        const simplifiedMesh = new THREE.Mesh(simplifiedGeometry, material);
        simplifiedMesh.castShadow = mesh.castShadow;
        simplifiedMesh.receiveShadow = mesh.receiveShadow;
        
        // Ajouter au LOD
        lod.addLevel(simplifiedMesh, this.config.lod.distanceThresholds[i - 1]);
        
        // Stocker pour référence
        meshLodMap.set(i, simplifiedMesh);
      }
    }
    
    // Remplacer le mesh par le LOD
    if (mesh.parent) {
      mesh.parent.add(lod);
      mesh.parent.remove(mesh);
    }
    
    // Stocker les références LOD
    this.lodModels.set(mesh.uuid, meshLodMap);
  }

  /**
   * Adapte la qualité en fonction du FPS mesuré
   */
  private adaptToFPS(): void {
    if (!this.config.lod.auto) return;
    
    // Ajuster la qualité en fonction du FPS
    if (this.fps < 30 && this.config.lod.level < 4) {
      // Réduire la qualité
      this.config.lod.level += 1;
      this.applyLODLevel(this.config.lod.level);
      
    } else if (this.fps > 55 && this.config.lod.level > 0 && this.devicePerformance !== 'low') {
      // Augmenter la qualité
      this.config.lod.level -= 1;
      this.applyLODLevel(this.config.lod.level);
    }
  }

  /**
   * Applique un niveau de LOD spécifique
   * @param level Niveau de LOD à appliquer
   */
  private applyLODLevel(level: number): void {
    // Mettre à jour les objets LOD
    this.scene.traverse((object) => {
      if (object instanceof THREE.LOD) {
        object.levels.forEach((lodLevel, index) => {
          if (lodLevel.object) {
            lodLevel.object.visible = index === level;
          }
        });
      }
    });
    
    // Autres ajustements selon le niveau
    switch (level) {
      case 0: // Qualité maximale
        this.renderer.shadowMap.enabled = this.config.shadows.enabled;
        break;
      case 1: // Haute qualité
        this.renderer.shadowMap.enabled = this.config.shadows.enabled;
        break;
      case 2: // Qualité moyenne
        this.renderer.shadowMap.enabled = this.devicePerformance !== 'low';
        break;
      case 3: // Basse qualité
        this.renderer.shadowMap.enabled = false;
        break;
      case 4: // Qualité minimale
        this.renderer.shadowMap.enabled = false;
        break;
    }
  }

  /**
   * Lance le rendu optimisé
   * @param time Timestamp d'animation
   */
  public render(time: number = 0): void {
    // Si non visible et throttling activé, limiter les FPS
    if (!this.isVisible && this.config.rendering.throttleWhenHidden) {
      // Limiter à ~10 FPS quand non visible
      if (time - this.lastRenderTime < 100) {
        return;
      }
    }
    
    // Mettre à jour le timestamp
    this.lastRenderTime = time;
    
    // Mode économie d'énergie
    if (this.config.rendering.lowPowerMode && this.devicePerformance === 'low') {
      // Réduire la résolution temporairement
      const originalPixelRatio = this.renderer.getPixelRatio();
      this.renderer.setPixelRatio(Math.min(0.75, originalPixelRatio));
      
      // Effectuer le rendu
      this.renderer.render(this.scene, this.camera);
      
      // Restaurer
      this.renderer.setPixelRatio(originalPixelRatio);
    } else {
      // Rendu normal
      this.renderer.render(this.scene, this.camera);
    }
  }

  /**
   * Démarre une boucle de rendu animée
   */
  public startAnimationLoop(): void {
    if (this.animationFrameId !== null) {
      this.stopAnimationLoop();
    }
    
    const animate = (time: number) => {
      this.animationFrameId = requestAnimationFrame(animate);
      this.render(time);
    };
    
    this.animationFrameId = requestAnimationFrame(animate);
  }

  /**
   * Arrête la boucle d'animation
   */
  public stopAnimationLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Libère les ressources
   */
  public dispose(): void {
    this.stopAnimationLoop();
    
    // Arrêter le reporting de performance
    if (this.performanceReportingIntervalId !== null && typeof window !== 'undefined') {
      window.clearInterval(this.performanceReportingIntervalId);
      this.performanceReportingIntervalId = null;
    }
    
    // Libérer les textures
    this.textureCache.forEach(texture => texture.dispose());
    this.textureCache.clear();
    
    // Restaurer la scène originale si nécessaire
    // En pratique, cette étape serait plus complexe
  }

  /**
   * Fusion de configurations
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
  
  /**
   * Retourne les statistiques de performance actuelles
   */
  public getPerformanceStats(): any {
    return {
      fps: this.fps,
      devicePerformance: this.devicePerformance,
      currentLOD: this.config.lod.level,
      renderCalls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      textures: {
        count: this.renderer.info.memory.textures,
        cached: this.textureCache.size
      },
      geometries: this.renderer.info.memory.geometries
    };
  }
  
  /**
   * Envoie les métriques de performance à PerformanceMonitor
   * @private
   */
  private reportPerformanceMetrics(): void {
    if (!this.renderer || !this.scene || !this.camera) return;

    // Calculer le FPS actuel
    const now = performance.now();
    const elapsed = now - this.lastReportTime;
    this.frameCount++;

    // Mise à jour à intervalles réguliers
    if (elapsed >= this.reportInterval) {
      const currentFPS = this.frameCount / (elapsed / 1000);
      this.totalFPS += currentFPS;
      this.fpsCount++;
      this.averageFPS = this.totalFPS / this.fpsCount;

      // Vérifier les low FPS events
      if (currentFPS < 30) {
        this.lowFPSCount++;
      }

      // Collecter les métriques de WebGL
      const memoryInfo = this.renderer.info.memory;
      const renderInfo = this.renderer.info.render;

      // Intégration avec PerformanceMonitor
      try {
        const { PerformanceMonitor } = require('../../performance/PerformanceMonitor');
        
        // Envoyer les métriques
        PerformanceMonitor.recordWebGLMetrics({
          currentFPS,
          averageFPS: this.averageFPS,
          lowFPSCount: this.lowFPSCount,
          triangles: renderInfo.triangles,
          drawCalls: renderInfo.calls,
          geometries: memoryInfo.geometries,
          textures: memoryInfo.textures,
          level: this.config.lod?.level || 1,
          pxRatio: this.renderer.getPixelRatio(),
          memoryUsage: performance && (performance as any).memory ? 
            Math.round((performance as any).memory.usedJSHeapSize / (1024 * 1024)) : 
            undefined
        });
        
        // Enregistrer également comme événement de performance
        if (currentFPS < 30) {
          PerformanceMonitor.recordEvent('webgl_low_fps', {
            fps: currentFPS,
            triangles: renderInfo.triangles,
            drawCalls: renderInfo.calls
          });
        }
      } catch (e) {
        // Gérer le cas où PerformanceMonitor n'est pas disponible
        console.warn('PerformanceMonitor non disponible, métriques WebGL ignorées', e);
      }

      // Réinitialiser pour la prochaine période
      this.lastReportTime = now;
      this.frameCount = 0;
    }
  }

  /**
   * Libère les textures et géométries non utilisées
   */
  public disposeUnusedResources(): void {
    if (!this.config.memory.disposeUnusedObjects) return;

    // Parcourir la scène pour identifier les ressources encore utilisées
    const usedTextures = new Set<THREE.Texture>();
    const usedGeometries = new Set<THREE.BufferGeometry>();

    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        // Collecter les géométries
        if (object.geometry) {
          usedGeometries.add(object.geometry);
        }
        
        // Collecter les textures
        if (object.material) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          
          materials.forEach(material => {
            // Parcourir toutes les propriétés du matériau pour trouver les textures
            Object.keys(material).forEach(prop => {
              const value = (material as any)[prop];
              if (value instanceof THREE.Texture) {
                usedTextures.add(value);
              }
            });
          });
        }
      }
    });

    // Nettoyer les textures non utilisées
    if (this.config.memory.textureCache) {
      // Utiliser Array.from pour contourner le problème d'itération avec TypeScript
      Array.from(this.textureCache.entries()).forEach(([url, texture]) => {
        if (!usedTextures.has(texture)) {
          texture.dispose();
          this.textureCache.delete(url);
        }
      });
    }

    // Nettoyer les géométries non utilisées
    if (this.config.memory.geometryCache) {
      // Utiliser Array.from pour contourner le problème d'itération avec TypeScript
      Array.from(this.geometryCache.entries()).forEach(([key, geometry]) => {
        if (!usedGeometries.has(geometry)) {
          geometry.dispose();
          this.geometryCache.delete(key);
        }
      });
    }
  }
}

// Export d'une fonction factory pour faciliter l'utilisation
export function createWebGLOptimizer(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  config: Partial<WebGLOptimizerConfig> = {}
): WebGLOptimizer {
  return new WebGLOptimizer(renderer, scene, camera, config);
}
