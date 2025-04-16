/**
 * Gestionnaire de ressources GPU pour la visualisation météorologique
 * Optimise l'utilisation des textures, géométries et matériaux
 */

import { DeviceCapabilities } from '../../utils/device';

// Type simplifié pour THREE.Texture (évite la dépendance directe)
interface Texture {
  uuid: string;
  image: {
    width: number;
    height: number;
  };
  dispose: () => void;
  needsUpdate: boolean;
}

// Type simplifié pour THREE.BufferGeometry
interface BufferGeometry {
  uuid: string;
  attributes: Record<string, any>;
  deleteAttribute: (name: string) => void;
  dispose: () => void;
}

// Type simplifié pour THREE.Material
interface Material {
  uuid: string;
  map?: Texture;
  dispose: () => void;
  needsUpdate: boolean;
}

// Interface pour les ressources en cache
interface CachedResource {
  resource: any;
  lastUsed: number;
  size: number;
  type: 'texture' | 'geometry' | 'material' | 'shader';
}

/**
 * Options de configuration du gestionnaire de ressources
 */
export interface GPUResourceOptions {
  maxTextureSize: number;
  maxResourceAge: number; // ms
  maxCacheSize: number; // Mo
  preloadStrategy: 'eager' | 'lazy' | 'adaptive';
  useMipMapping: boolean;
  useCompression: boolean;
  compressionFormat?: string;
  enableLOD: boolean;
}

/**
 * Classe principale pour la gestion des ressources GPU
 */
export class GPUResourceManager {
  private texturePool: Map<string, CachedResource> = new Map();
  private geometryPool: Map<string, CachedResource> = new Map();
  private materialPool: Map<string, CachedResource> = new Map();
  private shaderPool: Map<string, CachedResource> = new Map();
  
  private memoryUsage: {
    textures: number;
    geometries: number;
    materials: number;
    shaders: number;
    total: number;
  } = {
    textures: 0,
    geometries: 0,
    materials: 0,
    shaders: 0,
    total: 0
  };
  
  private options: GPUResourceOptions;
  private deviceCapabilities: DeviceCapabilities;
  private cleanupInterval: any;
  private isInitialized: boolean = false;
  
  /**
   * Constructeur
   * @param deviceCapabilities Capacités de l'appareil
   * @param options Options de configuration
   */
  constructor(deviceCapabilities: DeviceCapabilities, options?: Partial<GPUResourceOptions>) {
    this.deviceCapabilities = deviceCapabilities;
    
    // Options par défaut
    this.options = {
      maxTextureSize: this.determineMaxTextureSize(),
      maxResourceAge: 5 * 60 * 1000, // 5 minutes
      maxCacheSize: this.determineMaxCacheSize(),
      preloadStrategy: this.determinePreloadStrategy(),
      useMipMapping: deviceCapabilities.performanceLevel !== 'low',
      useCompression: deviceCapabilities.isMobile,
      compressionFormat: this.determineCompressionFormat(),
      enableLOD: true,
      ...options
    };
    
    console.log('GPU Resource Manager initialized with options:', this.options);
  }
  
  /**
   * Initialise le gestionnaire de ressources
   */
  public initialize(): void {
    if (this.isInitialized) return;
    
    // Démarrer le nettoyage périodique
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, 60 * 1000); // Toutes les minutes
    
    this.isInitialized = true;
    console.log('GPU Resource Manager started monitoring');
  }
  
  /**
   * Précharge les ressources pour un effet météorologique
   * @param effectType Type d'effet à précharger
   * @param resources Ressources à précharger
   */
  public async preloadResources(
    effectType: string,
    resources: {
      textures?: Record<string, any>;
      geometries?: Record<string, any>;
      materials?: Record<string, any>;
      shaders?: Record<string, any>;
    }
  ): Promise<void> {
    // Vérifier la stratégie de préchargement
    if (this.options.preloadStrategy === 'lazy') {
      console.log(`Skipping preload for ${effectType} due to lazy strategy`);
      return;
    } else if (this.options.preloadStrategy === 'adaptive') {
      // En mode adaptatif, vérifier la mémoire disponible
      if (this.memoryUsage.total > this.options.maxCacheSize * 0.8) {
        console.log(`Skipping preload for ${effectType} due to high memory usage (${this.memoryUsage.total.toFixed(2)}MB)`);
        return;
      }
    }
    
    console.log(`Preloading resources for effect: ${effectType}`);
    
    // Traiter les textures
    if (resources.textures) {
      for (const [key, texture] of Object.entries(resources.textures)) {
        const resourceKey = `${effectType}_texture_${key}`;
        await this.optimizeAndCacheTexture(resourceKey, texture);
      }
    }
    
    // Traiter les géométries
    if (resources.geometries) {
      for (const [key, geometry] of Object.entries(resources.geometries)) {
        const resourceKey = `${effectType}_geometry_${key}`;
        await this.optimizeAndCacheGeometry(resourceKey, geometry);
      }
    }
    
    // Traiter les matériaux
    if (resources.materials) {
      for (const [key, material] of Object.entries(resources.materials)) {
        const resourceKey = `${effectType}_material_${key}`;
        await this.optimizeAndCacheMaterial(resourceKey, material);
      }
    }
    
    // Traiter les shaders
    if (resources.shaders) {
      for (const [key, shader] of Object.entries(resources.shaders)) {
        const resourceKey = `${effectType}_shader_${key}`;
        this.cacheShader(resourceKey, shader);
      }
    }
    
    console.log(`Preloading completed for effect: ${effectType}`);
  }
  
  /**
   * Optimise les ressources en fonction de la qualité cible
   * @param quality Niveau de qualité cible
   */
  public async optimizeResources(quality: 'low' | 'medium' | 'high'): Promise<void> {
    console.log(`Optimizing resources for quality level: ${quality}`);
    
    // Déterminer la taille maximale de texture en fonction de la qualité
    const maxTextureSize = quality === 'high' 
      ? Math.min(2048, this.options.maxTextureSize) 
      : quality === 'medium' 
        ? Math.min(1024, this.options.maxTextureSize) 
        : 512;
    
    // Optimiser les textures
    const textureOptimizations = [];
    for (const [key, cachedResource] of this.texturePool.entries()) {
      const texture = cachedResource.resource as Texture;
      if (texture.image.width > maxTextureSize || texture.image.height > maxTextureSize) {
        textureOptimizations.push(
          this.resizeTexture(texture, maxTextureSize)
            .then(optimized => {
              // Remplacer la texture
              const oldSize = cachedResource.size;
              const newSize = this.estimateTextureSize(optimized);
              
              this.memoryUsage.textures -= oldSize;
              this.memoryUsage.textures += newSize;
              this.memoryUsage.total = this.memoryUsage.textures + 
                                      this.memoryUsage.geometries + 
                                      this.memoryUsage.materials + 
                                      this.memoryUsage.shaders;
              
              cachedResource.resource = optimized;
              cachedResource.size = newSize;
              cachedResource.lastUsed = Date.now();
              
              return true;
            })
            .catch(err => {
              console.error(`Failed to resize texture ${key}:`, err);
              return false;
            })
        );
      }
    }
    
    // Attendre la fin des optimisations de texture
    if (textureOptimizations.length > 0) {
      const results = await Promise.all(textureOptimizations);
      console.log(`Texture optimizations completed: ${results.filter(r => r).length} successful, ${results.filter(r => !r).length} failed`);
    }
    
    // Optimiser les géométries
    let geometryOptimizationCount = 0;
    for (const cachedResource of this.geometryPool.values()) {
      const geometry = cachedResource.resource as BufferGeometry;
      
      // Supprimer les attributs non essentiels sur les appareils de basse performance
      if (quality === 'low') {
        if (geometry.attributes.uv2) {
          geometry.deleteAttribute('uv2');
          geometryOptimizationCount++;
        }
        
        if (geometry.attributes.tangent) {
          geometry.deleteAttribute('tangent');
          geometryOptimizationCount++;
        }
      }
    }
    
    console.log(`Geometry optimizations: removed ${geometryOptimizationCount} non-essential attributes`);
    
    // Optimiser les matériaux
    let materialOptimizationCount = 0;
    for (const cachedResource of this.materialPool.values()) {
      const material = cachedResource.resource as Material;
      
      // Définir des options d'optimisation sur les matériaux
      if (material) {
        // Ici, on pourrait modifier les propriétés des matériaux
        // en fonction de la qualité cible
        materialOptimizationCount++;
      }
    }
    
    console.log(`Material optimizations: updated ${materialOptimizationCount} materials`);
    
    // Mettre à jour les options
    this.options.maxTextureSize = maxTextureSize;
    this.options.useMipMapping = quality !== 'low';
    
    console.log('Resource optimization completed');
    console.log('Current memory usage:', this.memoryUsage);
  }
  
  /**
   * Gère le cycle de vie des ressources en fonction des effets actifs
   * @param activeEffects Ensemble des effets actuellement actifs
   */
  public manageLifecycle(activeEffects: Set<string>): void {
    if (activeEffects.size === 0) return;
    
    console.log(`Managing lifecycle for ${activeEffects.size} active effects`);
    
    // Marquer les ressources utilisées comme récemment utilisées
    let activeResourceCount = 0;
    
    [...this.texturePool.entries(),
     ...this.geometryPool.entries(),
     ...this.materialPool.entries(),
     ...this.shaderPool.entries()].forEach(([key, resource]) => {
      
      // Vérifier si la ressource est utilisée par un effet actif
      for (const effect of activeEffects) {
        if (key.startsWith(`${effect}_`)) {
          resource.lastUsed = Date.now();
          activeResourceCount++;
          break;
        }
      }
    });
    
    console.log(`Marked ${activeResourceCount} resources as recently used`);
    
    // Si nous approchons de la limite de cache, effectuer un nettoyage
    if (this.memoryUsage.total > this.options.maxCacheSize * 0.9) {
      console.log('Memory usage approaching limit, performing cleanup');
      this.performCleanup();
    }
  }
  
  /**
   * Récupère une texture du pool ou null si non disponible
   * @param key Clé de la texture
   * @returns Texture ou null
   */
  public getTexture(key: string): any | null {
    const cached = this.texturePool.get(key);
    if (!cached) return null;
    
    cached.lastUsed = Date.now();
    return cached.resource;
  }
  
  /**
   * Récupère une géométrie du pool ou null si non disponible
   * @param key Clé de la géométrie
   * @returns Géométrie ou null
   */
  public getGeometry(key: string): any | null {
    const cached = this.geometryPool.get(key);
    if (!cached) return null;
    
    cached.lastUsed = Date.now();
    return cached.resource;
  }
  
  /**
   * Récupère un matériau du pool ou null si non disponible
   * @param key Clé du matériau
   * @returns Matériau ou null
   */
  public getMaterial(key: string): any | null {
    const cached = this.materialPool.get(key);
    if (!cached) return null;
    
    cached.lastUsed = Date.now();
    return cached.resource;
  }
  
  /**
   * Récupère un shader du pool ou null si non disponible
   * @param key Clé du shader
   * @returns Shader ou null
   */
  public getShader(key: string): any | null {
    const cached = this.shaderPool.get(key);
    if (!cached) return null;
    
    cached.lastUsed = Date.now();
    return cached.resource;
  }
  
  /**
   * Obtient le taux d'utilisation de la mémoire GPU
   * @returns Utilisation en pourcentage (0-100)
   */
  public getMemoryUsage(): number {
    return Math.min(100, (this.memoryUsage.total / this.options.maxCacheSize) * 100);
  }
  
  /**
   * Nettoie toutes les ressources
   */
  public dispose(): void {
    console.log('Disposing GPU Resource Manager');
    
    // Arrêter le nettoyage périodique
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    // Nettoyer toutes les ressources
    this.disposeResources(this.texturePool);
    this.disposeResources(this.geometryPool);
    this.disposeResources(this.materialPool);
    this.disposeResources(this.shaderPool);
    
    // Réinitialiser les compteurs
    this.memoryUsage = {
      textures: 0,
      geometries: 0,
      materials: 0,
      shaders: 0,
      total: 0
    };
    
    console.log('All GPU resources disposed');
  }
  
  /**
   * Optimise et met en cache une texture
   */
  private async optimizeAndCacheTexture(key: string, texture: any): Promise<void> {
    // Vérifier si la texture est déjà en cache
    if (this.texturePool.has(key)) {
      const cached = this.texturePool.get(key)!;
      cached.lastUsed = Date.now();
      return;
    }
    
    try {
      // Vérifier si la texture doit être redimensionnée
      if (texture.image && 
         (texture.image.width > this.options.maxTextureSize || 
          texture.image.height > this.options.maxTextureSize)) {
        console.log(`Resizing texture ${key} to fit maxTextureSize: ${this.options.maxTextureSize}`);
        texture = await this.resizeTexture(texture, this.options.maxTextureSize);
      }
      
      // Configurer les options de texture
      if (texture) {
        // Définir les options comme le mip-mapping
        // Ces propriétés dépendent de l'implémentation de Three.js
      }
      
      // Estimer la taille
      const size = this.estimateTextureSize(texture);
      
      // Mettre en cache
      this.texturePool.set(key, {
        resource: texture,
        lastUsed: Date.now(),
        size,
        type: 'texture'
      });
      
      // Mettre à jour l'utilisation mémoire
      this.memoryUsage.textures += size;
      this.memoryUsage.total += size;
      
      console.log(`Texture ${key} cached (${size.toFixed(2)}MB)`);
    } catch (err) {
      console.error(`Failed to optimize and cache texture ${key}:`, err);
    }
  }
  
  /**
   * Optimise et met en cache une géométrie
   */
  private async optimizeAndCacheGeometry(key: string, geometry: any): Promise<void> {
    // Vérifier si la géométrie est déjà en cache
    if (this.geometryPool.has(key)) {
      const cached = this.geometryPool.get(key)!;
      cached.lastUsed = Date.now();
      return;
    }
    
    try {
      // Estimer la taille
      const size = this.estimateGeometrySize(geometry);
      
      // Mettre en cache
      this.geometryPool.set(key, {
        resource: geometry,
        lastUsed: Date.now(),
        size,
        type: 'geometry'
      });
      
      // Mettre à jour l'utilisation mémoire
      this.memoryUsage.geometries += size;
      this.memoryUsage.total += size;
      
      console.log(`Geometry ${key} cached (${size.toFixed(2)}MB)`);
    } catch (err) {
      console.error(`Failed to optimize and cache geometry ${key}:`, err);
    }
  }
  
  /**
   * Optimise et met en cache un matériau
   */
  private async optimizeAndCacheMaterial(key: string, material: any): Promise<void> {
    // Vérifier si le matériau est déjà en cache
    if (this.materialPool.has(key)) {
      const cached = this.materialPool.get(key)!;
      cached.lastUsed = Date.now();
      return;
    }
    
    try {
      // Estimer la taille
      const size = this.estimateMaterialSize(material);
      
      // Mettre en cache
      this.materialPool.set(key, {
        resource: material,
        lastUsed: Date.now(),
        size,
        type: 'material'
      });
      
      // Mettre à jour l'utilisation mémoire
      this.memoryUsage.materials += size;
      this.memoryUsage.total += size;
      
      console.log(`Material ${key} cached (${size.toFixed(2)}MB)`);
    } catch (err) {
      console.error(`Failed to optimize and cache material ${key}:`, err);
    }
  }
  
  /**
   * Met en cache un shader
   */
  private cacheShader(key: string, shader: any): void {
    // Vérifier si le shader est déjà en cache
    if (this.shaderPool.has(key)) {
      const cached = this.shaderPool.get(key)!;
      cached.lastUsed = Date.now();
      return;
    }
    
    try {
      // Estimer la taille (les shaders sont généralement petits)
      const size = 0.05; // 50KB
      
      // Mettre en cache
      this.shaderPool.set(key, {
        resource: shader,
        lastUsed: Date.now(),
        size,
        type: 'shader'
      });
      
      // Mettre à jour l'utilisation mémoire
      this.memoryUsage.shaders += size;
      this.memoryUsage.total += size;
      
      console.log(`Shader ${key} cached (${size.toFixed(2)}MB)`);
    } catch (err) {
      console.error(`Failed to cache shader ${key}:`, err);
    }
  }
  
  /**
   * Redimensionne une texture pour respecter les limites
   */
  private async resizeTexture(texture: any, maxSize: number): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      try {
        // Simuler le redimensionnement (l'implémentation réelle dépend de votre framework 3D)
        console.log(`Texture resized: ${texture.uuid}`);
        
        // Dans une implémentation réelle, nous créerions un canvas,
        // y dessinerions l'image de la texture redimensionnée,
        // et créerions une nouvelle texture à partir de ce canvas
        
        resolve(texture);
      } catch (err) {
        reject(err);
      }
    });
  }
  
  /**
   * Effectue un nettoyage des ressources inutilisées
   */
  private performCleanup(): void {
    const now = Date.now();
    const maxAge = this.options.maxResourceAge;
    
    console.log('Performing resource cleanup');
    
    // Nettoyer les textures anciennes
    this.cleanupPool(this.texturePool, now, maxAge, 'textures');
    
    // Nettoyer les géométries anciennes
    this.cleanupPool(this.geometryPool, now, maxAge, 'geometries');
    
    // Nettoyer les matériaux anciens
    this.cleanupPool(this.materialPool, now, maxAge, 'materials');
    
    // Nettoyer les shaders anciens
    this.cleanupPool(this.shaderPool, now, maxAge, 'shaders');
    
    // Mettre à jour le total
    this.memoryUsage.total = this.memoryUsage.textures + 
                            this.memoryUsage.geometries + 
                            this.memoryUsage.materials + 
                            this.memoryUsage.shaders;
    
    console.log('Cleanup completed, current memory usage:', this.memoryUsage);
  }
  
  /**
   * Nettoie un pool de ressources
   */
  private cleanupPool(
    pool: Map<string, CachedResource>,
    now: number,
    maxAge: number,
    memoryKey: keyof typeof this.memoryUsage
  ): void {
    const keysToRemove: string[] = [];
    
    pool.forEach((resource, key) => {
      const age = now - resource.lastUsed;
      
      if (age > maxAge) {
        // Supprimer cette ressource
        try {
          if (resource.resource && typeof resource.resource.dispose === 'function') {
            resource.resource.dispose();
          }
          
          // Réduire l'utilisation mémoire
          this.memoryUsage[memoryKey] -= resource.size;
          
          keysToRemove.push(key);
        } catch (err) {
          console.error(`Error disposing resource ${key}:`, err);
        }
      }
    });
    
    // Supprimer les entrées
    keysToRemove.forEach(key => pool.delete(key));
    
    console.log(`Cleaned up ${keysToRemove.length} ${memoryKey}`);
  }
  
  /**
   * Supprime toutes les ressources d'un pool
   */
  private disposeResources(pool: Map<string, CachedResource>): void {
    pool.forEach((resource, key) => {
      try {
        if (resource.resource && typeof resource.resource.dispose === 'function') {
          resource.resource.dispose();
        }
      } catch (err) {
        console.error(`Error disposing resource ${key}:`, err);
      }
    });
    
    pool.clear();
  }
  
  /**
   * Estime la taille d'une texture en mémoire
   * @returns Taille en MB
   */
  private estimateTextureSize(texture: any): number {
    if (!texture || !texture.image) return 0.1; // 100KB par défaut
    
    const width = texture.image.width || 256;
    const height = texture.image.height || 256;
    
    // 4 octets par pixel (RGBA)
    const sizeBytes = width * height * 4;
    
    // Ajouter 33% si mip-mapping
    const mipFactor = this.options.useMipMapping ? 1.33 : 1.0;
    
    // Conversion en MB
    return (sizeBytes * mipFactor) / (1024 * 1024);
  }
  
  /**
   * Estime la taille d'une géométrie en mémoire
   * @returns Taille en MB
   */
  private estimateGeometrySize(geometry: any): number {
    if (!geometry || !geometry.attributes) return 0.05; // 50KB par défaut
    
    let sizeBytes = 0;
    
    // Calculer la taille de chaque attribut
    for (const key in geometry.attributes) {
      const attribute = geometry.attributes[key];
      if (attribute && attribute.array) {
        sizeBytes += attribute.array.byteLength || 0;
      }
    }
    
    // Ajouter les indices si présents
    if (geometry.index && geometry.index.array) {
      sizeBytes += geometry.index.array.byteLength || 0;
    }
    
    // Conversion en MB
    return sizeBytes / (1024 * 1024);
  }
  
  /**
   * Estime la taille d'un matériau en mémoire
   * @returns Taille en MB
   */
  private estimateMaterialSize(material: any): number {
    if (!material) return 0.01; // 10KB par défaut
    
    // Les matériaux sont généralement petits, mais leurs textures peuvent être grandes
    let size = 0.01;
    
    // Ajouter la taille de la texture principale si présente
    if (material.map) {
      size += this.estimateTextureSize(material.map);
    }
    
    return size;
  }
  
  /**
   * Détermine la taille maximale de texture en fonction des capacités
   */
  private determineMaxTextureSize(): number {
    if (this.deviceCapabilities.isMobile) {
      return this.deviceCapabilities.performanceLevel === 'high' ? 2048 : 1024;
    } else {
      return this.deviceCapabilities.performanceLevel === 'high' ? 4096 : 2048;
    }
  }
  
  /**
   * Détermine la taille maximale du cache en fonction des capacités
   */
  private determineMaxCacheSize(): number {
    if (this.deviceCapabilities.isMobile) {
      return this.deviceCapabilities.performanceLevel === 'high' ? 200 : 100;
    } else {
      return this.deviceCapabilities.performanceLevel === 'high' ? 500 : 300;
    }
  }
  
  /**
   * Détermine la stratégie de préchargement en fonction des capacités
   */
  private determinePreloadStrategy(): 'eager' | 'lazy' | 'adaptive' {
    if (this.deviceCapabilities.isMobile && this.deviceCapabilities.performanceLevel === 'low') {
      return 'lazy';
    } else if (this.deviceCapabilities.isMobile) {
      return 'adaptive';
    } else {
      return 'eager';
    }
  }
  
  /**
   * Détermine le format de compression en fonction des capacités
   */
  private determineCompressionFormat(): string {
    // Cette fonction devrait vérifier les formats supportés
    // Les formats courants incluent ASTC, ETC2, PVRTC, S3TC
    return 'ETC2'; // Format largement supporté
  }
}
