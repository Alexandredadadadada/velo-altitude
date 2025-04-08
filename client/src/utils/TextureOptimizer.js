/**
 * Optimiseur de textures pour les modèles 3D
 * Implémente le chargement progressif, le mip-mapping et les optimisations selon l'appareil
 */

import * as THREE from 'three';
import deviceCapabilityDetector from './deviceCapabilityDetector';

// Formats de compression de texture supportés par plateforme
const TEXTURE_FORMATS = {
  DESKTOP: ['png', 'jpg', 'webp', 'basis', 'ktx2'],
  MOBILE_HIGH: ['webp', 'jpg', 'ktx2', 'astc'],
  MOBILE_LOW: ['webp', 'jpg', 'pvrtc']
};

// Qualités de texture et tailles correspondantes
const TEXTURE_QUALITY = {
  ULTRA: 1.0,    // Taille originale
  HIGH: 0.75,    // 75% de la taille originale
  MEDIUM: 0.5,   // 50% de la taille originale
  LOW: 0.25,     // 25% de la taille originale
  VERY_LOW: 0.1  // 10% de la taille originale
};

/**
 * Gestionnaire d'optimisation de textures
 */
class TextureOptimizer {
  constructor(options = {}) {
    // Détecter les capacités de l'appareil
    this.deviceCapabilities = deviceCapabilityDetector.getCapabilities();
    this.isMobile = this.deviceCapabilities.flags.isMobile;
    this.isHighEndDevice = this.deviceCapabilities.performanceLevel >= 4;
    
    // Initialiser le chargeur de textures
    this.textureLoader = new THREE.TextureLoader();
    this.textureCache = new Map();
    
    // Options de qualité de textures
    this.defaultQuality = options.defaultQuality || 
      (this.isHighEndDevice ? TEXTURE_QUALITY.HIGH : TEXTURE_QUALITY.MEDIUM);
    
    if (this.isMobile && !this.isHighEndDevice) {
      this.defaultQuality = TEXTURE_QUALITY.LOW;
    }
    
    // Déterminer les formats supportés pour cet appareil
    this.supportedFormats = this._detectSupportedFormats();
    
    // Paramètres par défaut pour les textures
    this.defaultTextureParams = {
      generateMipmaps: true,
      minFilter: THREE.LinearMipMapLinearFilter,
      magFilter: THREE.LinearFilter,
      anisotropy: this._getOptimalAnisotropy()
    };
  }

  /**
   * Charge une texture avec optimisation automatique
   * @param {string} url URL de la texture
   * @param {Object} options Options de chargement
   * @returns {Promise<THREE.Texture>} Texture optimisée
   */
  async loadTexture(url, options = {}) {
    const cacheKey = `${url}_${options.quality || this.defaultQuality}`;
    
    // Vérifier si la texture est déjà en cache
    if (this.textureCache.has(cacheKey)) {
      return this.textureCache.get(cacheKey);
    }
    
    // Déterminer la qualité de texture à utiliser
    const quality = options.quality || this.defaultQuality;
    
    // Construire l'URL optimisée avec la qualité et le format adapté
    const optimizedUrl = this._buildOptimizedUrl(url, quality);
    
    // Charger la texture avec les paramètres optimisés
    try {
      const texture = await this._loadTextureAsync(optimizedUrl);
      
      // Appliquer les paramètres de texture
      const textureParams = {
        ...this.defaultTextureParams,
        ...options
      };
      
      this._applyTextureParams(texture, textureParams);
      
      // Mettre en cache la texture
      this.textureCache.set(cacheKey, texture);
      
      return texture;
    } catch (error) {
      console.error(`Erreur lors du chargement de la texture ${optimizedUrl}:`, error);
      
      // En cas d'échec, essayer de charger la texture originale
      if (optimizedUrl !== url) {
        console.warn(`Tentative de repli sur la texture originale: ${url}`);
        const texture = await this._loadTextureAsync(url);
        this._applyTextureParams(texture, this.defaultTextureParams);
        this.textureCache.set(cacheKey, texture);
        return texture;
      }
      
      throw error;
    }
  }

  /**
   * Charge plusieurs textures en parallèle
   * @param {Array<Object>} textureConfigs Configurations de textures à charger
   * @returns {Promise<Object>} Map des textures chargées
   */
  async loadTextures(textureConfigs) {
    const texturePromises = textureConfigs.map(config => {
      return this.loadTexture(config.url, config.options)
        .then(texture => ({ id: config.id, texture }));
    });
    
    const loadedTextures = await Promise.all(texturePromises);
    
    // Convertir en objet avec les IDs comme clés
    return loadedTextures.reduce((result, item) => {
      result[item.id] = item.texture;
      return result;
    }, {});
  }

  /**
   * Charge une texture en utilisant une technique de mip-mapping progressif
   * @param {string} baseUrl URL de base de la texture
   * @param {Array<number>} mipLevels Niveaux de mip (puissances de 2)
   * @returns {Promise<THREE.Texture>} Texture avec mip-mapping progressif
   */
  async loadProgressiveMipMappedTexture(baseUrl, mipLevels = [2048, 1024, 512, 256, 128, 64]) {
    // Créer une texture de base
    const texture = new THREE.Texture();
    texture.generateMipmaps = false; // Nous allons gérer manuellement les mipmaps
    
    // Fonction pour charger un niveau spécifique de mipmap
    const loadMipLevel = async (level, index) => {
      // Construire l'URL pour ce niveau de mipmap
      const mipUrl = baseUrl.replace(/\.([^.]+)$/, `_${level}.$1`);
      
      try {
        const mipTexture = await this._loadTextureAsync(mipUrl);
        
        // Si c'est le niveau 0 (le plus grand), définir l'image principale
        if (index === 0) {
          texture.image = mipTexture.image;
          texture.needsUpdate = true;
        }
        
        // Stocker ce niveau de mipmap
        if (!texture.mipmaps) {
          texture.mipmaps = [];
        }
        
        // Ajouter le mipmap dans l'ordre
        texture.mipmaps[index] = {
          data: mipTexture.image,
          width: level,
          height: level
        };
        
        texture.needsUpdate = true;
        
        return texture;
      } catch (error) {
        console.warn(`Impossible de charger le niveau ${level} pour ${baseUrl}:`, error);
        return null;
      }
    };
    
    // Charger d'abord le niveau le plus bas pour un affichage rapide
    const lowestMipLevel = mipLevels[mipLevels.length - 1];
    await loadMipLevel(lowestMipLevel, mipLevels.length - 1);
    
    // Puis commencer à charger les autres niveaux en parallèle, du plus petit au plus grand
    const remainingLevels = mipLevels.slice(0, -1).reverse();
    remainingLevels.forEach((level, index) => {
      // Convertir l'index pour correspondre à la position dans le tableau original
      const mipIndex = mipLevels.length - 2 - index;
      loadMipLevel(level, mipIndex);
    });
    
    // Appliquer les paramètres de texture
    this._applyTextureParams(texture, {
      ...this.defaultTextureParams,
      generateMipmaps: false // Nous avons déjà nos mipmaps
    });
    
    return texture;
  }

  /**
   * Précharge une texture pour une utilisation future
   * @param {string} url URL de la texture
   * @param {Object} options Options de préchargement
   */
  preloadTexture(url, options = {}) {
    // Lancer le chargement sans attendre le résultat
    this.loadTexture(url, options).catch(error => {
      console.warn(`Erreur lors du préchargement de la texture ${url}:`, error);
    });
  }

  /**
   * Libère une texture du cache
   * @param {string} url URL de la texture
   * @param {Object} options Options qui avaient été utilisées pour le chargement
   */
  releaseTexture(url, options = {}) {
    const quality = options.quality || this.defaultQuality;
    const cacheKey = `${url}_${quality}`;
    
    if (this.textureCache.has(cacheKey)) {
      const texture = this.textureCache.get(cacheKey);
      texture.dispose();
      this.textureCache.delete(cacheKey);
    }
  }

  /**
   * Libère toutes les textures du cache
   */
  releaseAllTextures() {
    for (const texture of this.textureCache.values()) {
      texture.dispose();
    }
    this.textureCache.clear();
  }

  /**
   * Applique les paramètres à une texture
   * @private
   * @param {THREE.Texture} texture Texture à configurer
   * @param {Object} params Paramètres à appliquer
   */
  _applyTextureParams(texture, params) {
    // Appliquer tous les paramètres à la texture
    Object.keys(params).forEach(key => {
      if (key in texture) {
        texture[key] = params[key];
      }
    });
    
    // Vérifier si anisotropy est supporté
    if ('anisotropy' in params && 
        texture.anisotropy !== undefined && 
        params.anisotropy > texture.anisotropy) {
      texture.anisotropy = Math.min(
        params.anisotropy,
        this._getOptimalAnisotropy()
      );
    }
    
    // Forcer la mise à jour de la texture
    texture.needsUpdate = true;
  }

  /**
   * Charge une texture de manière asynchrone
   * @private
   * @param {string} url URL de la texture
   * @returns {Promise<THREE.Texture>} Texture chargée
   */
  _loadTextureAsync(url) {
    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        url,
        texture => resolve(texture),
        undefined, // Fonction de progression non utilisée
        error => reject(error)
      );
    });
  }

  /**
   * Construit une URL optimisée pour la texture
   * @private
   * @param {string} originalUrl URL originale
   * @param {number} quality Niveau de qualité souhaité
   * @returns {string} URL optimisée
   */
  _buildOptimizedUrl(originalUrl, quality) {
    // Si c'est déjà une URL optimisée, la retourner telle quelle
    if (originalUrl.includes('_q')) {
      return originalUrl;
    }
    
    // Extraire le format actuel
    const currentFormat = originalUrl.split('.').pop().toLowerCase();
    
    // Déterminer le meilleur format pour cet appareil
    const bestFormat = this._getBestSupportedFormat(currentFormat);
    
    // Si la qualité est ULTRA, utiliser simplement le meilleur format
    if (quality === TEXTURE_QUALITY.ULTRA) {
      if (bestFormat === currentFormat) {
        return originalUrl;
      }
      return originalUrl.replace(new RegExp(`\\.${currentFormat}$`), `.${bestFormat}`);
    }
    
    // Construire le nom de fichier avec qualité
    const qualityStr = quality * 100;
    const newUrl = originalUrl.replace(
      new RegExp(`\\.${currentFormat}$`),
      `_q${qualityStr}.${bestFormat}`
    );
    
    return newUrl;
  }

  /**
   * Détecte les formats de texture supportés par le navigateur
   * @private
   * @returns {Array<string>} Liste des formats supportés
   */
  _detectSupportedFormats() {
    // Déterminer le type d'appareil
    let deviceType = 'DESKTOP';
    if (this.isMobile) {
      deviceType = this.isHighEndDevice ? 'MOBILE_HIGH' : 'MOBILE_LOW';
    }
    
    // Liste des formats pour ce type d'appareil
    const potentialFormats = TEXTURE_FORMATS[deviceType];
    
    // Vérification de support pour WebP
    const hasWebP = () => {
      const canvas = document.createElement('canvas');
      if (canvas.getContext && canvas.getContext('2d')) {
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
      }
      return false;
    };
    
    // Filtrer les formats non supportés
    const supportedFormats = potentialFormats.filter(format => {
      switch (format) {
        case 'webp':
          return hasWebP();
        case 'ktx2':
        case 'basis':
        case 'astc':
        case 'pvrtc':
          // Généralement ces formats nécessitent une vérification côté serveur
          // ou l'utilisation de bibliothèques spécifiques
          return false;
        default:
          return true; // jpg et png sont toujours supportés
      }
    });
    
    return supportedFormats;
  }

  /**
   * Retourne le meilleur format supporté
   * @private
   * @param {string} currentFormat Format actuel
   * @returns {string} Meilleur format supporté
   */
  _getBestSupportedFormat(currentFormat) {
    // Si le format actuel est supporté, le conserver
    if (this.supportedFormats.includes(currentFormat)) {
      return currentFormat;
    }
    
    // Sinon, utiliser le premier format supporté
    return this.supportedFormats[0] || 'jpg';
  }

  /**
   * Retourne le niveau d'anisotropie optimal pour cet appareil
   * @private
   * @returns {number} Niveau d'anisotropie
   */
  _getOptimalAnisotropy() {
    // Créer un renderer temporaire pour obtenir les capacités GPU
    const renderer = new THREE.WebGLRenderer({ antialias: false });
    const capabilities = renderer.capabilities;
    
    // Nettoyer le renderer temporaire
    renderer.dispose();
    
    // Niveau maximum supporté
    const maxAnisotropy = capabilities.getMaxAnisotropy();
    
    // Déterminer le niveau optimal selon le type d'appareil
    if (this.isHighEndDevice) {
      return maxAnisotropy;
    } else if (this.isMobile) {
      return Math.min(2, maxAnisotropy);
    } else {
      return Math.min(4, maxAnisotropy);
    }
  }
}

// Exporter une instance singleton
const textureOptimizer = new TextureOptimizer();
export default textureOptimizer;
