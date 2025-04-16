/**
 * Visualiseur 3D de cols optimisé avec détection automatique des capacités
 * et ajustement des paramètres de rendu pour les appareils mobiles et moins performants.
 */

import * as THREE from 'three';
import { SimplifyModifier } from './SimplifyModifier';

// Types pour les capacités des appareils
interface DeviceCapabilities {
  isMobile: boolean;
  isTouchDevice: boolean;
  hasWebGL2: boolean;
  devicePixelRatio: number;
  performanceLevel: 'high' | 'medium' | 'low';
  gpu?: string;
  memory?: number;
}

// Types pour les paramètres de qualité
interface QualitySettings {
  resolution: number;  // Facteur de résolution (0.5 = moitié de la résolution native)
  textureSize: number; // Taille max des textures (512, 1024, 2048, etc.)
  shadowsEnabled: boolean;
  maxObjectDetail: 'high' | 'medium' | 'low';
  terrainSegments: number;
  maxLights: number;
  antialiasing: boolean;
  ambientOcclusion: boolean;
  reflections: boolean;
  realtimeShadows: boolean;
}

/**
 * Classe de visualisation 3D optimisée pour les cols
 */
export class OptimizedCol3DViewer {
  private container: HTMLElement;
  private colData: any;
  private deviceCapabilities: DeviceCapabilities;
  private quality: QualitySettings;
  private renderer?: THREE.WebGLRenderer;
  private scene?: THREE.Scene;
  private camera?: THREE.PerspectiveCamera;
  private controls?: any;
  private disposables: THREE.Object3D[] = [];
  private modifiers: SimplifyModifier[] = [];
  private isDisposed: boolean = false;
  private frameRates: number[] = [];
  private lastFrameTime: number = 0;
  private memoryWatcher?: number;
  
  constructor(containerId: string, colData: any) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with ID ${containerId} not found`);
    }
    
    this.container = container;
    this.colData = colData;
    this.deviceCapabilities = this.detectDeviceCapabilities();
    this.quality = this.getQualitySettings();
    
    console.log('Device capabilities detected:', this.deviceCapabilities);
    console.log('Quality settings applied:', this.quality);
    
    this.init();
  }
  
  /**
   * Détecte les capacités de l'appareil
   */
  private detectDeviceCapabilities(): DeviceCapabilities {
    const isMobile = window.innerWidth < 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const hasWebGL2 = !!document.createElement('canvas').getContext('webgl2');
    const devicePixelRatio = window.devicePixelRatio || 1;
    
    return {
      isMobile,
      isTouchDevice,
      hasWebGL2,
      devicePixelRatio,
      performanceLevel: this.determinePerformanceLevel(),
      gpu: this.getGPUInfo()
    };
  }
  
  /**
   * Détermine le niveau de performance de l'appareil
   */
  private determinePerformanceLevel(): 'high' | 'medium' | 'low' {
    // Test simple de performance
    const start = performance.now();
    const iterations = 10000;
    for (let i = 0; i < iterations; i++) {
      Math.sqrt(i);
    }
    const duration = performance.now() - start;
    
    // Test de mémoire disponible (approximatif)
    let memoryLevel: 'high' | 'medium' | 'low' = 'medium';
    if (navigator.deviceMemory) {
      if (navigator.deviceMemory < 4) memoryLevel = 'low';
      else if (navigator.deviceMemory >= 8) memoryLevel = 'high';
    }
    
    // Test de nombre de cœurs CPU
    const cpuLevel: 'high' | 'medium' | 'low' = 
      (navigator.hardwareConcurrency || 0) >= 6 ? 'high' :
      (navigator.hardwareConcurrency || 0) >= 4 ? 'medium' : 'low';
    
    // Évaluation basée sur la durée du test de performance
    const perfLevel: 'high' | 'medium' | 'low' = 
      duration < 5 ? 'high' :
      duration < 15 ? 'medium' : 'low';
    
    // Détermination du niveau final (le plus bas gagne)
    const levels = [perfLevel, memoryLevel, cpuLevel];
    if (levels.includes('low')) return 'low';
    if (levels.includes('medium')) return 'medium';
    return 'high';
  }
  
  /**
   * Obtient des informations sur le GPU (si disponible)
   */
  private getGPUInfo(): string | undefined {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return undefined;
      
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (!debugInfo) return undefined;
      
      return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    } catch (e) {
      console.error('Failed to get GPU info:', e);
      return undefined;
    }
  }
  
  /**
   * Initialise le visualiseur 3D
   */
  private init(): void {
    // Appliquer optimisations basées sur les capacités de l'appareil
    this.initRenderer();
    this.initScene();
    this.setupCamera();
    this.setupControls();
    this.setupLighting();
    this.loadTerrain();
    this.setupAnimationLoop();
    this.setupMemoryManagement();
    this.setupEventListeners();
    
    // Initialiser le monitoring de performance si disponible
    this.startPerformanceMonitoring();
  }
  
  /**
   * Obtient les paramètres de qualité basés sur les capacités de l'appareil
   */
  private getQualitySettings(): QualitySettings {
    const { isMobile, performanceLevel, devicePixelRatio } = this.deviceCapabilities;
    
    // Paramètres pour appareils mobiles
    if (isMobile) {
      return {
        resolution: Math.min(0.5, 1 / devicePixelRatio),
        textureSize: 512,
        shadowsEnabled: false,
        maxObjectDetail: 'low',
        terrainSegments: 32,
        maxLights: 2,
        antialiasing: false,
        ambientOcclusion: false,
        reflections: false,
        realtimeShadows: false
      };
    }
    
    // Paramètres pour appareils de bureau selon le niveau de performance
    switch (performanceLevel) {
      case 'high':
        return {
          resolution: 1.0,
          textureSize: 2048,
          shadowsEnabled: true,
          maxObjectDetail: 'high',
          terrainSegments: 128,
          maxLights: 8,
          antialiasing: true,
          ambientOcclusion: true,
          reflections: true,
          realtimeShadows: true
        };
      case 'medium':
        return {
          resolution: 0.75,
          textureSize: 1024,
          shadowsEnabled: true,
          maxObjectDetail: 'medium',
          terrainSegments: 64,
          maxLights: 4,
          antialiasing: true,
          ambientOcclusion: false,
          reflections: false,
          realtimeShadows: false
        };
      default: // 'low'
        return {
          resolution: 0.5,
          textureSize: 512,
          shadowsEnabled: false,
          maxObjectDetail: 'low',
          terrainSegments: 32,
          maxLights: 2,
          antialiasing: false,
          ambientOcclusion: false,
          reflections: false,
          realtimeShadows: false
        };
    }
  }
  
  /**
   * Initialise le renderer WebGL avec les optimisations appropriées
   */
  private initRenderer(): void {
    const { antialiasing } = this.quality;
    
    this.renderer = new THREE.WebGLRenderer({
      antialias: antialiasing,
      powerPreference: 'high-performance',
      alpha: true
    });
    
    const { resolution } = this.quality;
    const pixelRatio = this.deviceCapabilities.devicePixelRatio;
    
    // Appliquer la résolution optimisée
    this.renderer.setPixelRatio(pixelRatio * resolution);
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    
    // Optimisations supplémentaires pour les appareils faibles
    if (this.deviceCapabilities.performanceLevel === 'low') {
      this.renderer.shadowMap.enabled = false;
    } else {
      this.renderer.shadowMap.enabled = this.quality.shadowsEnabled;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    
    // Optimisations de tonalité pour économiser les performances sur les appareils mobiles
    if (!this.deviceCapabilities.isMobile) {
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.0;
      this.renderer.outputEncoding = THREE.sRGBEncoding;
    }
    
    this.container.appendChild(this.renderer.domElement);
  }
  
  /**
   * Initialise la scène 3D
   */
  private initScene(): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb); // Ciel bleu
    
    // Réduire la complexité du brouillard sur mobile
    if (!this.deviceCapabilities.isMobile) {
      this.scene.fog = new THREE.FogExp2(0xcccccc, 0.002);
    }
  }
  
  /**
   * Configure la caméra avec des paramètres adaptés
   */
  private setupCamera(): void {
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(70, aspect, 0.1, 5000);
    this.camera.position.set(100, 100, 100);
    this.camera.lookAt(0, 0, 0);
  }
  
  /**
   * Configure les contrôles adaptés au type d'appareil
   */
  private setupControls(): void {
    // Implémentation dépend de la bibliothèque de contrôles utilisée
    // Par exemple, avec OrbitControls, on pourrait faire:
    /*
    import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
    this.controls = new OrbitControls(this.camera!, this.renderer!.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    
    // Optimiser pour le mobile
    if (this.deviceCapabilities.isMobile) {
      this.controls.rotateSpeed = 0.7;
      this.controls.zoomSpeed = 0.7;
      this.controls.enablePan = false; // Désactiver le pan sur mobile
    }
    */
    console.log('Controls setup skipped - implementation required');
  }
  
  /**
   * Configure l'éclairage optimisé selon les capacités
   */
  private setupLighting(): void {
    const { maxLights } = this.quality;
    
    // Éclairage ambiant (toujours présent)
    const ambientLight = new THREE.AmbientLight(0x404040, 0.7);
    this.scene!.add(ambientLight);
    this.disposables.push(ambientLight);
    
    // Éclairage directionnel (soleil)
    const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    sunLight.position.set(100, 100, 50);
    
    // Activer les ombres uniquement si supportées par la qualité
    if (this.quality.shadowsEnabled) {
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.width = this.quality.textureSize;
      sunLight.shadow.mapSize.height = this.quality.textureSize;
      
      // Optimiser la taille de la carte d'ombre
      const shadowRange = 200;
      sunLight.shadow.camera.left = -shadowRange;
      sunLight.shadow.camera.right = shadowRange;
      sunLight.shadow.camera.top = shadowRange;
      sunLight.shadow.camera.bottom = -shadowRange;
      sunLight.shadow.camera.near = 0.5;
      sunLight.shadow.camera.far = 500;
    }
    
    this.scene!.add(sunLight);
    this.disposables.push(sunLight);
    
    // Ajouter des lumières supplémentaires uniquement sur les appareils performants
    if (maxLights > 2) {
      const fillLight = new THREE.DirectionalLight(0x8080ff, 0.2);
      fillLight.position.set(-100, 50, -50);
      this.scene!.add(fillLight);
      this.disposables.push(fillLight);
    }
  }
  
  /**
   * Charge et optimise le terrain 3D
   */
  private loadTerrain(): void {
    // Implémentation spécifique à l'application
    // Exemple:
    /*
    const terrainGeometry = new THREE.PlaneGeometry(
      1000, 
      1000, 
      this.quality.terrainSegments, 
      this.quality.terrainSegments
    );
    
    // Appliquer les données d'élévation du col
    const positions = terrainGeometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      // Utiliser les données du col pour définir y (élévation)
      positions.setY(i, this.getElevationAt(x, z));
    }
    
    // Optimiser la géométrie pour les appareils moins performants
    if (this.deviceCapabilities.performanceLevel !== 'high') {
      const modifier = new SimplifyModifier();
      const simplificationFactor = 
        this.deviceCapabilities.performanceLevel === 'low' ? 0.7 : 0.3;
      
      const simplifiedGeometry = modifier.modify(
        terrainGeometry, 
        Math.floor(positions.count * simplificationFactor)
      );
      
      terrainGeometry.dispose();
      terrainGeometry = simplifiedGeometry;
    }
    
    const terrainMaterial = new THREE.MeshStandardMaterial({
      color: 0x3b7d4e,
      metalness: 0.1,
      roughness: 0.9
    });
    
    const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
    terrain.rotation.x = -Math.PI / 2; // Orienter horizontalement
    terrain.receiveShadow = this.quality.shadowsEnabled;
    
    this.scene!.add(terrain);
    this.disposables.push(terrain);
    */
    console.log('Terrain loading skipped - implementation required');
  }
  
  /**
   * Configure la boucle d'animation avec gestion de performance
   */
  private setupAnimationLoop(): void {
    let lastFrameTime = 0;
    
    const animate = (time: number) => {
      if (this.isDisposed) return;
      
      const deltaTime = time - lastFrameTime;
      lastFrameTime = time;
      
      // Mesure du FPS pour ajustement dynamique de la qualité
      this.measureFrameRate(deltaTime);
      
      // Mettre à jour les contrôles si présents
      // if (this.controls) this.controls.update(deltaTime / 1000);
      
      // Rendu de la scène
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
      
      requestAnimationFrame(animate);
    };
    
    requestAnimationFrame(animate);
  }
  
  /**
   * Configure la gestion de la mémoire et des ressources
   */
  private setupMemoryManagement(): void {
    // Démarrer la surveillance de la mémoire s'il y a beaucoup d'objets
    this.memoryWatcher = window.setInterval(() => {
      // Vérifier si des ajustements sont nécessaires
      this.checkMemoryUsage();
    }, 5000);
    
    // Nettoyer correctement les ressources à la fermeture
    window.addEventListener('beforeunload', this.dispose.bind(this));
  }
  
  /**
   * Configure les écouteurs d'événements pour le redimensionnement
   */
  private setupEventListeners(): void {
    // Gérer le redimensionnement de la fenêtre
    const handleResize = () => {
      if (!this.camera || !this.renderer) return;
      
      this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
      this.camera.updateProjectionMatrix();
      
      this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    };
    
    window.addEventListener('resize', handleResize);
  }
  
  /**
   * Mesure le taux de rafraîchissement pour les ajustements dynamiques
   */
  private measureFrameRate(deltaTime: number): void {
    // Ignorer les valeurs aberrantes
    if (deltaTime <= 0 || deltaTime > 1000) return;
    
    const fps = 1000 / deltaTime;
    this.frameRates.push(fps);
    
    // Limiter la taille du tableau
    if (this.frameRates.length > 60) {
      this.frameRates.shift();
    }
    
    // Ajuster la qualité si nécessaire (toutes les 2 secondes)
    const now = performance.now();
    if (now - this.lastFrameTime > 2000) {
      this.lastFrameTime = now;
      this.adjustQualityBasedOnPerformance();
    }
  }
  
  /**
   * Ajuste la qualité basée sur les performances mesurées
   */
  private adjustQualityBasedOnPerformance(): void {
    if (this.frameRates.length < 30) return;
    
    // Calculer la moyenne des FPS
    const avgFps = this.frameRates.reduce((sum, fps) => sum + fps, 0) / this.frameRates.length;
    
    // Ajuster la qualité si nécessaire
    if (avgFps < 30 && this.quality.resolution > 0.5) {
      // Réduire la qualité
      this.quality.resolution = Math.max(0.2, this.quality.resolution - 0.1);
      this.applyQualityChanges();
      console.log(`Reduced quality to resolution=${this.quality.resolution} due to low FPS: ${avgFps.toFixed(1)}`);
    } else if (avgFps > 58 && this.quality.resolution < 1.0) {
      // Augmenter la qualité
      this.quality.resolution = Math.min(1.0, this.quality.resolution + 0.1);
      this.applyQualityChanges();
      console.log(`Increased quality to resolution=${this.quality.resolution} due to high FPS: ${avgFps.toFixed(1)}`);
    }
  }
  
  /**
   * Applique les changements de qualité au renderer
   */
  private applyQualityChanges(): void {
    if (!this.renderer) return;
    
    // Appliquer la nouvelle résolution
    const pixelRatio = this.deviceCapabilities.devicePixelRatio;
    this.renderer.setPixelRatio(pixelRatio * this.quality.resolution);
  }
  
  /**
   * Vérifie l'utilisation de la mémoire et ajuste si nécessaire
   */
  private checkMemoryUsage(): void {
    // Cette fonction est appelée périodiquement pour vérifier l'utilisation de la mémoire
    const memory = (performance as any).memory;
    if (!memory) return;
    
    const totalHeapSize = memory.totalJSHeapSize;
    const usedHeapSize = memory.usedJSHeapSize;
    const usageRatio = usedHeapSize / totalHeapSize;
    
    // Si l'utilisation de la mémoire est élevée, forcer le garbage collection
    // et réduire la qualité si nécessaire
    if (usageRatio > 0.8) {
      console.warn('High memory usage detected:', 
                   `${(usedHeapSize / 1048576).toFixed(1)}MB / ${(totalHeapSize / 1048576).toFixed(1)}MB`,
                   `(${(usageRatio * 100).toFixed(1)}%)`);
      
      // Réduire la qualité en cas de pression mémoire
      if (this.quality.textureSize > 512) {
        this.quality.textureSize = 512;
        console.log('Reduced texture size due to memory pressure');
      }
      
      // Autres ajustements possibles en cas de pression mémoire
    }
  }
  
  /**
   * Démarre le monitoring de performance si disponible
   */
  private startPerformanceMonitoring(): void {
    // Cette fonction peut être étendue pour intégrer avec des outils plus avancés
    console.log('Starting performance monitoring');
  }
  
  /**
   * Libère les ressources utilisées par le visualiseur
   */
  public dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;
    
    console.log('Disposing 3D viewer resources');
    
    // Arrêter le monitoring de la mémoire
    if (this.memoryWatcher) {
      clearInterval(this.memoryWatcher);
      this.memoryWatcher = undefined;
    }
    
    // Disposer des objets de la scène
    this.disposables.forEach(item => {
      if (item.geometry) item.geometry.dispose();
      if (item.material) {
        if (Array.isArray(item.material)) {
          item.material.forEach((mat: THREE.Material) => mat.dispose());
        } else {
          item.material.dispose();
        }
      }
    });
    this.disposables = [];
    
    // Nettoyer les modifiers
    this.modifiers = [];
    
    // Disposer du renderer
    if (this.renderer) {
      this.renderer.dispose();
      if (this.container.contains(this.renderer.domElement)) {
        this.container.removeChild(this.renderer.domElement);
      }
      this.renderer = undefined;
    }
    
    // Nettoyer la scène
    if (this.scene) {
      this.scene.clear();
      this.scene = undefined;
    }
    
    // Nettoyer les contrôles
    if (this.controls && this.controls.dispose) {
      this.controls.dispose();
      this.controls = undefined;
    }
    
    // Nettoyer la caméra
    this.camera = undefined;
  }
}
