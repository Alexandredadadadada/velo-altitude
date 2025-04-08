/**
 * Service d'optimisation d'images pour Velo-Altitude
 * Implémente le chargement adaptatif et la compression avancée
 */

class OptimizedImageLoader {
  constructor() {
    this.supportCache = {
      webp: null,
      avif: null
    };
    this.devicePixelRatio = window.devicePixelRatio || 1;
    this.connectionType = this._getConnectionType();
    this.preloadedImages = new Set();
    this.imageRegistry = new Map();
    
    // Détecter les formats supportés
    this._detectSupportedFormats();
    
    // Observer les changements de connexion
    this._observeConnectionChanges();
  }

  /**
   * Détecte les formats d'image supportés par le navigateur
   * @private
   */
  _detectSupportedFormats() {
    // Détecter le support WebP
    const webpImage = new Image();
    webpImage.onload = () => {
      this.supportCache.webp = true;
    };
    webpImage.onerror = () => {
      this.supportCache.webp = false;
    };
    webpImage.src = 'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=';

    // Détecter le support AVIF
    const avifImage = new Image();
    avifImage.onload = () => {
      this.supportCache.avif = true;
    };
    avifImage.onerror = () => {
      this.supportCache.avif = false;
    };
    avifImage.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK';
  }

  /**
   * Observe les changements du type de connexion
   * @private
   */
  _observeConnectionChanges() {
    // Utiliser Network Information API si disponible
    if ('connection' in navigator && 'addEventListener' in navigator.connection) {
      navigator.connection.addEventListener('change', () => {
        this.connectionType = this._getConnectionType();
      });
    }
  }

  /**
   * Récupère le type de connexion actuel
   * @private
   * @returns {string} Type de connexion ('slow', 'medium', 'fast')
   */
  _getConnectionType() {
    if (!('connection' in navigator)) {
      return 'unknown';
    }

    const connection = navigator.connection;
    
    if (connection.saveData) {
      return 'saveData';
    }

    if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
      return 'slow';
    } else if (connection.effectiveType === '3g') {
      return 'medium';
    } else {
      return 'fast';
    }
  }

  /**
   * Détermine la taille optimale pour une image
   * @private
   * @param {number} targetWidth - Largeur cible
   * @param {Array} availableSizes - Tailles disponibles
   * @returns {number} Taille optimale
   */
  _getOptimalSize(targetWidth, availableSizes = [320, 640, 1024, 1280, 1920, 2560]) {
    // Appliquer le ratio de pixels de l'appareil
    const adjustedWidth = targetWidth * this.devicePixelRatio;
    
    // Trouver la taille optimale (25% plus grande pour éviter le flou)
    const optimalWidth = adjustedWidth * 1.25;
    
    // Trouver la plus petite taille disponible qui est >= à la taille optimale
    for (const size of availableSizes) {
      if (size >= optimalWidth) {
        return size;
      }
    }
    
    // Si aucune taille n'est assez grande, prendre la plus grande disponible
    return availableSizes[availableSizes.length - 1];
  }

  /**
   * Génère une URL d'image optimisée
   * @param {string} src - URL source de l'image
   * @param {object} options - Options d'optimisation
   * @returns {string} URL optimisée
   */
  getOptimizedUrl(src, options = {}) {
    const {
      width = 800,
      height = null,
      quality = 'auto',
      format = 'auto',
      availableSizes = [320, 640, 1024, 1280, 1920, 2560]
    } = options;
    
    // Si c'est une URL externe ou une data URL, la retourner telle quelle
    if (src.startsWith('http') || src.startsWith('data:')) {
      return src;
    }
    
    // Adapter la qualité selon la connexion
    let adjustedQuality = quality;
    if (quality === 'auto') {
      switch (this.connectionType) {
        case 'slow':
          adjustedQuality = 60;
          break;
        case 'medium':
          adjustedQuality = 75;
          break;
        case 'saveData':
          adjustedQuality = 50;
          break;
        default:
          adjustedQuality = 85;
      }
    }

    // Déterminer le format optimal
    let optimalFormat = format;
    if (format === 'auto') {
      if (this.supportCache.avif === true) {
        optimalFormat = 'avif';
      } else if (this.supportCache.webp === true) {
        optimalFormat = 'webp';
      } else {
        // Détecter l'extension du fichier original
        const extension = src.split('.').pop().toLowerCase();
        optimalFormat = ['jpg', 'jpeg', 'png'].includes(extension) ? extension : 'jpg';
      }
    }
    
    // Calculer la taille optimale
    const optimalWidth = this._getOptimalSize(width, availableSizes);
    
    // Construire l'URL optimisée pour le CDN ou le service d'images
    if (src.includes('/assets/')) {
      // Utiliser le service d'optimisation d'images si disponible
      return `/image-optimizer?src=${encodeURIComponent(src)}&w=${optimalWidth}${
        height ? `&h=${height}` : ''
      }&q=${adjustedQuality}&fmt=${optimalFormat}`;
    }
    
    // Sinon, essayer de servir une version préoptimisée si elle existe
    const basePath = src.substring(0, src.lastIndexOf('.'));
    const optimizedPath = `${basePath}-${optimalWidth}.${optimalFormat}`;
    
    // Enregistrer cette image pour le préchargement potentiel
    this._registerImage(src, optimizedPath);
    
    return optimizedPath;
  }

  /**
   * Précharge une image
   * @param {string} src - URL source de l'image
   * @param {object} options - Options d'optimisation
   */
  preloadImage(src, options = {}) {
    if (this.preloadedImages.has(src)) return;
    
    const optimizedUrl = this.getOptimizedUrl(src, options);
    const preloadLink = document.createElement('link');
    preloadLink.rel = 'preload';
    preloadLink.as = 'image';
    preloadLink.href = optimizedUrl;
    document.head.appendChild(preloadLink);
    
    this.preloadedImages.add(src);
  }

  /**
   * Précharge intelligemment les images qui seront probablement nécessaires
   * @param {Array} imagePaths - Chemins des images à précharger
   */
  preloadNextImages(imagePaths = []) {
    // Si la connexion est limitée, ne pas précharger
    if (this.connectionType === 'slow' || this.connectionType === 'saveData') {
      return;
    }
    
    // Utiliser requestIdleCallback pour ne pas bloquer le rendu
    if (window.requestIdleCallback) {
      window.requestIdleCallback(() => {
        imagePaths.forEach(path => this.preloadImage(path));
      });
    } else {
      // Fallback pour les navigateurs sans requestIdleCallback
      setTimeout(() => {
        imagePaths.forEach(path => this.preloadImage(path));
      }, 1000);
    }
  }

  /**
   * Enregistre une image pour le suivi
   * @private
   * @param {string} originalSrc - URL d'origine
   * @param {string} optimizedSrc - URL optimisée
   */
  _registerImage(originalSrc, optimizedSrc) {
    this.imageRegistry.set(originalSrc, {
      optimizedSrc,
      registeredAt: Date.now()
    });
  }

  /**
   * Récupère des statistiques sur l'utilisation du service
   * @returns {object} Statistiques
   */
  getStatistics() {
    return {
      supportedFormats: {
        webp: this.supportCache.webp,
        avif: this.supportCache.avif
      },
      connectionType: this.connectionType,
      devicePixelRatio: this.devicePixelRatio,
      preloadedImagesCount: this.preloadedImages.size,
      registeredImagesCount: this.imageRegistry.size
    };
  }
}

// Exporter une instance singleton
const optimizedImageLoader = new OptimizedImageLoader();
export default optimizedImageLoader;

// Composant React pour l'utilisation facile avec JSX
export const OptimizedImage = ({ src, alt, width, height, quality, format, className, style, onLoad, onError, loading = 'lazy', ...props }) => {
  const optimizedSrc = optimizedImageLoader.getOptimizedUrl(src, {
    width,
    height,
    quality,
    format
  });

  return React.createElement('img', {
    src: optimizedSrc,
    alt: alt || '',
    width: width,
    height: height,
    className,
    style,
    onLoad,
    onError,
    loading,
    ...props
  });
};
