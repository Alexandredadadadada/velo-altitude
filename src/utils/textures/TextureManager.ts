import * as THREE from 'three';

/**
 * Types de qualité de texture disponibles
 */
export type TextureQuality = 'high' | 'medium' | 'low';

/**
 * Interface pour les options de texture
 */
interface TextureOptions {
  repeat?: [number, number];
  anisotropy?: number;
  flipY?: boolean;
  generateMipmaps?: boolean;
}

/**
 * Gestionnaire de textures pour optimiser le chargement et le rendu des textures
 * dans les visualisations 3D
 */
export class TextureManager {
  private static instance: TextureManager;
  private textureCache: Map<string, THREE.Texture>;
  private textureLoader: THREE.TextureLoader;
  private isInitialized: boolean = false;
  private defaultQuality: TextureQuality = 'medium';
  private maxAnisotropy: number = 1;

  /**
   * Constructeur privé pour le pattern Singleton
   */
  private constructor() {
    this.textureCache = new Map<string, THREE.Texture>();
    this.textureLoader = new THREE.TextureLoader();
  }

  /**
   * Obtient l'instance unique du gestionnaire de textures (Singleton)
   */
  public static getInstance(): TextureManager {
    if (!TextureManager.instance) {
      TextureManager.instance = new TextureManager();
    }
    return TextureManager.instance;
  }

  /**
   * Initialise le gestionnaire de textures avec un renderer WebGL
   * pour obtenir les capacités maximales
   */
  public initialize(renderer?: THREE.WebGLRenderer): void {
    if (this.isInitialized) return;

    // Si un renderer est fourni, obtenir l'anisotropie maximale
    if (renderer) {
      const capabilities = renderer.capabilities;
      this.maxAnisotropy = capabilities.getMaxAnisotropy();
    }

    console.log(`TextureManager initialisé avec anisotropie maximale: ${this.maxAnisotropy}`);
    this.isInitialized = true;
  }

  /**
   * Définit la qualité par défaut des textures
   */
  public setDefaultQuality(quality: TextureQuality): void {
    this.defaultQuality = quality;
  }

  /**
   * Précharge un ensemble de textures
   */
  public async preloadTextures(paths: string[], quality: TextureQuality = this.defaultQuality): Promise<void> {
    const qualitySuffix = this.getQualitySuffix(quality);
    
    const loadPromises = paths.map(path => {
      // Ajouter le suffixe de qualité au chemin si nécessaire
      const finalPath = path.includes('_high') || path.includes('_medium') || path.includes('_low') 
        ? path 
        : `${path}${qualitySuffix}`;
        
      return this.loadTexture(`/images/textures/${finalPath}.jpg`);
    });

    await Promise.all(loadPromises);
    console.log(`${paths.length} textures préchargées avec qualité ${quality}`);
  }

  /**
   * Charge une texture avec les options spécifiées
   */
  public async loadTexture(path: string, options?: TextureOptions): Promise<THREE.Texture> {
    // Vérifier si la texture est déjà dans le cache
    const cacheKey = this.getCacheKey(path, options);
    if (this.textureCache.has(cacheKey)) {
      return this.textureCache.get(cacheKey)!;
    }

    // Charger la texture
    return new Promise<THREE.Texture>((resolve, reject) => {
      this.textureLoader.load(
        path,
        (texture) => {
          // Appliquer les options
          if (options) {
            if (options.repeat) {
              texture.repeat.set(options.repeat[0], options.repeat[1]);
              texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            }
            
            if (options.anisotropy !== undefined) {
              texture.anisotropy = Math.min(options.anisotropy, this.maxAnisotropy);
            } else {
              // Appliquer l'anisotropie maximale par défaut pour la qualité maximale
              texture.anisotropy = this.maxAnisotropy;
            }
            
            if (options.flipY !== undefined) {
              texture.flipY = options.flipY;
            }
            
            if (options.generateMipmaps !== undefined) {
              texture.generateMipmaps = options.generateMipmaps;
            }
          }

          // Mettre en cache la texture
          this.textureCache.set(cacheKey, texture);
          resolve(texture);
        },
        undefined,
        (error) => {
          console.error(`Erreur lors du chargement de la texture ${path}:`, error);
          reject(error);
        }
      );
    });
  }

  /**
   * Obtient une texture du cache ou la charge si elle n'existe pas
   */
  public getTexture(path: string, quality: TextureQuality = this.defaultQuality, options?: TextureOptions): THREE.Texture {
    const qualitySuffix = this.getQualitySuffix(quality);
    const finalPath = path.includes('_high') || path.includes('_medium') || path.includes('_low') 
      ? path 
      : `${path}${qualitySuffix}`;
    
    const fullPath = `/images/textures/${finalPath}.jpg`;
    const cacheKey = this.getCacheKey(fullPath, options);
    
    // Si la texture n'est pas dans le cache, utiliser une texture vide temporairement
    // et déclencher le chargement en arrière-plan
    if (!this.textureCache.has(cacheKey)) {
      const tempTexture = new THREE.Texture();
      this.textureCache.set(cacheKey, tempTexture);
      
      this.loadTexture(fullPath, options).then(loadedTexture => {
        // Remplacer la texture temporaire par la texture chargée
        tempTexture.image = loadedTexture.image;
        tempTexture.needsUpdate = true;
      });
      
      return tempTexture;
    }
    
    return this.textureCache.get(cacheKey)!;
  }

  /**
   * Libère les ressources d'une texture spécifique
   */
  public disposeTexture(path: string, options?: TextureOptions): void {
    const cacheKey = this.getCacheKey(path, options);
    if (this.textureCache.has(cacheKey)) {
      const texture = this.textureCache.get(cacheKey)!;
      texture.dispose();
      this.textureCache.delete(cacheKey);
    }
  }

  /**
   * Libère toutes les textures du cache
   */
  public disposeAllTextures(): void {
    this.textureCache.forEach(texture => {
      texture.dispose();
    });
    this.textureCache.clear();
  }

  /**
   * Génère une clé de cache unique pour une texture et ses options
   */
  private getCacheKey(path: string, options?: TextureOptions): string {
    if (!options) return path;
    return `${path}|${JSON.stringify(options)}`;
  }

  /**
   * Obtient le suffixe de qualité pour un niveau de qualité donné
   */
  private getQualitySuffix(quality: TextureQuality): string {
    switch (quality) {
      case 'high':
        return '_high';
      case 'medium':
        return '_medium';
      case 'low':
        return '_low';
      default:
        return '_medium';
    }
  }
}

export default TextureManager;
