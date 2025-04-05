export const ImageOptimizer = {
  init: function() {
    // Initialisation de l'optimiseur d'images
    console.log('Image Optimizer initialized');
    this.setupLazyLoading();
    this.setupResponsiveImages();
    this.setupWebPDetection();
  },
  
  setupLazyLoading: function() {
    // Configuration du lazy loading pour les images
    if ('IntersectionObserver' in window) {
      const lazyImages = document.querySelectorAll('img.lazy');
      
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const src = img.getAttribute('data-src');
            const srcset = img.getAttribute('data-srcset');
            
            if (src) img.src = src;
            if (srcset) img.srcset = srcset;
            
            img.classList.remove('lazy');
            observer.unobserve(img);
          }
        });
      });
      
      lazyImages.forEach(image => {
        imageObserver.observe(image);
      });
    } else {
      // Fallback pour les navigateurs ne supportant pas IntersectionObserver
      this.lazyLoadFallback();
    }
  },
  
  lazyLoadFallback: function() {
    // Fallback pour le lazy loading
    const lazyImages = document.querySelectorAll('img.lazy');
    let active = false;
    
    const lazyLoad = function() {
      if (active === false) {
        active = true;
        
        setTimeout(function() {
          lazyImages.forEach(lazyImage => {
            if ((lazyImage.getBoundingClientRect().top <= window.innerHeight && 
                lazyImage.getBoundingClientRect().bottom >= 0) && 
                getComputedStyle(lazyImage).display !== "none") {
              
              const src = lazyImage.getAttribute('data-src');
              const srcset = lazyImage.getAttribute('data-srcset');
              
              if (src) lazyImage.src = src;
              if (srcset) lazyImage.srcset = srcset;
              
              lazyImage.classList.remove("lazy");
              
              lazyImages = lazyImages.filter(image => image !== lazyImage);
              
              if (lazyImages.length === 0) {
                document.removeEventListener("scroll", lazyLoad);
                window.removeEventListener("resize", lazyLoad);
                window.removeEventListener("orientationchange", lazyLoad);
              }
            }
          });
          
          active = false;
        }, 200);
      }
    };
    
    document.addEventListener("scroll", lazyLoad);
    window.addEventListener("resize", lazyLoad);
    window.addEventListener("orientationchange", lazyLoad);
    window.addEventListener("DOMContentLoaded", lazyLoad);
  },
  
  setupResponsiveImages: function() {
    // Configuration des images responsives
    const devicePixelRatio = window.devicePixelRatio || 1;
    const screenWidth = window.innerWidth;
    
    document.querySelectorAll('img[data-sizes="auto"]').forEach(img => {
      img.sizes = img.getBoundingClientRect().width + 'px';
    });
  },
  
  setupWebPDetection: function() {
    // Détection du support WebP
    const supportsWebP = () => {
      const elem = document.createElement('canvas');
      
      if (elem.getContext && elem.getContext('2d')) {
        return elem.toDataURL('image/webp').indexOf('data:image/webp') === 0;
      }
      
      return false;
    };
    
    if (supportsWebP()) {
      document.documentElement.classList.add('webp');
    } else {
      document.documentElement.classList.add('no-webp');
    }
  },
  
  optimizeImageQuality: function(connectionType) {
    // Ajustement de la qualité des images en fonction de la connexion
    let quality = 'high';
    
    if (connectionType === '4g') {
      quality = 'medium';
    } else if (connectionType === '3g' || connectionType === '2g' || connectionType === 'slow-2g') {
      quality = 'low';
    }
    
    document.querySelectorAll('img[data-quality]').forEach(img => {
      const qualitySrc = img.getAttribute(`data-src-${quality}`);
      if (qualitySrc) {
        img.src = qualitySrc;
      }
    });
    
    return quality;
  },
  
  preloadCriticalImages: function(images) {
    // Préchargement des images critiques
    if (!images || !images.length) return;
    
    images.forEach(imageSrc => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = imageSrc;
      document.head.appendChild(link);
    });
  },
  
  convertToWebP: function(imageUrl) {
    // Conversion d'URL pour utiliser WebP si supporté
    if (document.documentElement.classList.contains('webp')) {
      return imageUrl.replace(/\.(jpg|jpeg|png)/gi, '.webp');
    }
    return imageUrl;
  }
};

export default ImageOptimizer;
