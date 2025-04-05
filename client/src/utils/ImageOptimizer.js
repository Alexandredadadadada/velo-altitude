/**
 * Optimiseur d'images pour le site Grand Est Cyclisme
 * Implémente des techniques avancées pour optimiser le chargement et l'affichage des images
 */

import { useEffect, useState, useRef } from 'react';
import { useLazyLoad } from './PerformanceOptimizer';

// Constantes pour les formats d'image
const IMAGE_FORMATS = {
  WEBP: 'webp',
  JPEG: 'jpeg',
  PNG: 'png',
  AVIF: 'avif',
};

// Constantes pour les tailles d'image
const IMAGE_SIZES = {
  THUMBNAIL: 'thumbnail', // 150px
  SMALL: 'small',         // 300px
  MEDIUM: 'medium',       // 600px
  LARGE: 'large',         // 1200px
  ORIGINAL: 'original',   // Taille originale
};

/**
 * Classe principale d'optimisation des images
 */
class ImageOptimizer {
  constructor() {
    this.supportsWebP = false;
    this.supportsAvif = false;
    this.devicePixelRatio = window.devicePixelRatio || 1;
    this.isLowBandwidth = false;
    this.isLowMemory = false;
    this.initialized = false;
    this.placeholderColor = '#f0f0f0';
    this.blurHashEnabled = true;
  }

  /**
   * Initialise l'optimiseur d'images
   */
  initialize() {
    if (this.initialized) return;

    console.log('Initialisation de l\'optimiseur d\'images...');
    
    // Détecter le support des formats modernes
    this._detectFormatSupport();
    
    // Détecter les contraintes de l'appareil
    this._detectDeviceConstraints();
    
    // Observer les changements de connexion
    this._observeConnectionChanges();
    
    this.initialized = true;
    console.log('Optimiseur d\'images initialisé avec succès');
  }

  /**
   * Détecte le support des formats d'image modernes
   * @private
   */
  _detectFormatSupport() {
    // Détecter le support WebP
    const webpImage = new Image();
    webpImage.onload = () => {
      this.supportsWebP = (webpImage.width > 0) && (webpImage.height > 0);
    };
    webpImage.onerror = () => {
      this.supportsWebP = false;
    };
    webpImage.src = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';
    
    // Détecter le support AVIF
    const avifImage = new Image();
    avifImage.onload = () => {
      this.supportsAvif = (avifImage.width > 0) && (avifImage.height > 0);
    };
    avifImage.onerror = () => {
      this.supportsAvif = false;
    };
    avifImage.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=';
  }

  /**
   * Détecte les contraintes de l'appareil
   * @private
   */
  _detectDeviceConstraints() {
    // Détecter la mémoire disponible
    if ('deviceMemory' in navigator) {
      this.isLowMemory = navigator.deviceMemory < 4; // Moins de 4GB de RAM
    }
    
    // Détecter la qualité de la connexion
    if ('connection' in navigator && navigator.connection) {
      this.isLowBandwidth = 
        navigator.connection.effectiveType === 'slow-2g' || 
        navigator.connection.effectiveType === '2g' ||
        navigator.connection.downlink < 1.0 ||
        navigator.connection.saveData;
    }
  }

  /**
   * Observe les changements de connexion
   * @private
   */
  _observeConnectionChanges() {
    if ('connection' in navigator && navigator.connection) {
      navigator.connection.addEventListener('change', () => {
        this.isLowBandwidth = 
          navigator.connection.effectiveType === 'slow-2g' || 
          navigator.connection.effectiveType === '2g' ||
          navigator.connection.downlink < 1.0 ||
          navigator.connection.saveData;
      });
    }
  }

  /**
   * Détermine le meilleur format d'image pour l'appareil actuel
   * @returns {string} Format d'image optimal
   */
  getBestImageFormat() {
    if (this.supportsAvif) {
      return IMAGE_FORMATS.AVIF;
    } else if (this.supportsWebP) {
      return IMAGE_FORMATS.WEBP;
    } else {
      return IMAGE_FORMATS.JPEG;
    }
  }

  /**
   * Détermine la taille d'image optimale en fonction de la largeur cible
   * @param {number} targetWidth - Largeur cible en pixels
   * @returns {string} Taille d'image optimale
   */
  getOptimalImageSize(targetWidth) {
    // Ajuster pour la densité de pixels
    const adjustedWidth = targetWidth * this.devicePixelRatio;
    
    // Réduire la qualité pour les connexions lentes
    if (this.isLowBandwidth) {
      if (adjustedWidth <= 300) return IMAGE_SIZES.THUMBNAIL;
      if (adjustedWidth <= 600) return IMAGE_SIZES.SMALL;
      return IMAGE_SIZES.MEDIUM;
    }
    
    // Sélection normale basée sur la largeur
    if (adjustedWidth <= 150) return IMAGE_SIZES.THUMBNAIL;
    if (adjustedWidth <= 300) return IMAGE_SIZES.SMALL;
    if (adjustedWidth <= 600) return IMAGE_SIZES.MEDIUM;
    if (adjustedWidth <= 1200) return IMAGE_SIZES.LARGE;
    return IMAGE_SIZES.ORIGINAL;
  }

  /**
   * Génère l'URL optimisée pour une image
   * @param {string} baseUrl - URL de base de l'image
   * @param {Object} options - Options de configuration
   * @returns {string} URL optimisée
   */
  getOptimizedImageUrl(baseUrl, options = {}) {
    if (!baseUrl) return '';
    
    const format = options.format || this.getBestImageFormat();
    const size = options.size || this.getOptimalImageSize(options.width || 600);
    const quality = this.isLowBandwidth ? 'low' : 'high';
    
    // Si l'URL est déjà une URL d'image optimisée, la retourner telle quelle
    if (baseUrl.includes('/images/optimized/')) {
      return baseUrl;
    }
    
    // Construire l'URL optimisée
    // Format: /images/optimized/{size}/{quality}/{format}/{originalPath}
    const urlParts = baseUrl.split('/');
    const filename = urlParts[urlParts.length - 1];
    
    return `/images/optimized/${size}/${quality}/${format}/${filename}`;
  }

  /**
   * Génère une URL de placeholder pour une image
   * @param {string} baseUrl - URL de base de l'image
   * @param {Object} options - Options de configuration
   * @returns {string} URL du placeholder
   */
  getPlaceholderUrl(baseUrl, options = {}) {
    if (!baseUrl) return '';
    
    // Si le blurHash est activé et disponible
    if (this.blurHashEnabled && options.blurHash) {
      return `/images/blurhash/${options.blurHash}`;
    }
    
    // Sinon, utiliser un placeholder de couleur unie
    const width = options.width || 100;
    const height = options.height || 100;
    const color = options.placeholderColor || this.placeholderColor;
    const colorHex = color.replace('#', '');
    
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'%3E%3Crect width='${width}' height='${height}' fill='%23${colorHex}'/%3E%3C/svg%3E`;
  }
}

// Instance singleton
const imageOptimizer = new ImageOptimizer();

/**
 * Hook React pour utiliser l'optimiseur d'images
 * @returns {Object} Utilitaires d'optimisation d'images
 */
export const useImageOptimizer = () => {
  const [isInitialized, setIsInitialized] = useState(imageOptimizer.initialized);
  
  useEffect(() => {
    if (!imageOptimizer.initialized) {
      imageOptimizer.initialize();
      setIsInitialized(true);
    }
  }, []);
  
  return {
    isInitialized,
    getBestImageFormat: () => imageOptimizer.getBestImageFormat(),
    getOptimalImageSize: (width) => imageOptimizer.getOptimalImageSize(width),
    getOptimizedImageUrl: (url, options) => imageOptimizer.getOptimizedImageUrl(url, options),
    getPlaceholderUrl: (url, options) => imageOptimizer.getPlaceholderUrl(url, options),
    supportsWebP: imageOptimizer.supportsWebP,
    supportsAvif: imageOptimizer.supportsAvif,
    isLowBandwidth: imageOptimizer.isLowBandwidth
  };
};

/**
 * Composant d'image optimisée avec chargement paresseux
 * @param {Object} props - Propriétés du composant
 * @returns {JSX.Element} Composant React
 */
export const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  className,
  style,
  blurHash,
  placeholderColor,
  onLoad,
  onError,
  sizes,
  loading = 'lazy',
  ...rest
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);
  
  // Initialiser l'optimiseur d'images
  useEffect(() => {
    if (!imageOptimizer.initialized) {
      imageOptimizer.initialize();
    }
  }, []);
  
  // Obtenir l'URL optimisée
  const optimizedSrc = imageOptimizer.getOptimizedImageUrl(src, { width, blurHash });
  
  // Obtenir l'URL du placeholder
  const placeholderSrc = imageOptimizer.getPlaceholderUrl(src, { 
    width, 
    height, 
    blurHash, 
    placeholderColor 
  });
  
  // Référence pour le chargement paresseux
  const lazyLoadRef = useLazyLoad(() => {
    if (imgRef.current) {
      imgRef.current.src = optimizedSrc;
    }
  });
  
  // Gestionnaire de chargement
  const handleLoad = (e) => {
    setIsLoaded(true);
    if (onLoad) onLoad(e);
  };
  
  // Gestionnaire d'erreur
  const handleError = (e) => {
    setError(true);
    if (onError) onError(e);
  };
  
  // Styles combinés
  const combinedStyle = {
    ...style,
    transition: 'opacity 0.3s ease',
    opacity: isLoaded ? 1 : 0.5,
    backgroundColor: placeholderColor || imageOptimizer.placeholderColor,
  };
  
  return (
    <div 
      ref={lazyLoadRef}
      className={`optimized-image-container ${className || ''}`}
      style={{
        width: width ? `${width}px` : 'auto',
        height: height ? `${height}px` : 'auto',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {!isLoaded && !error && (
        <div 
          className="image-placeholder"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `url(${placeholderSrc})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: blurHash ? 'blur(10px)' : 'none',
          }}
        />
      )}
      
      <img
        ref={imgRef}
        src={loading === 'eager' ? optimizedSrc : placeholderSrc}
        data-src={optimizedSrc}
        alt={alt || ''}
        width={width}
        height={height}
        onLoad={handleLoad}
        onError={handleError}
        style={combinedStyle}
        loading={loading}
        sizes={sizes}
        {...rest}
      />
    </div>
  );
};

export default imageOptimizer;
