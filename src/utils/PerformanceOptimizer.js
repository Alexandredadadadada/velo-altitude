export const PerformanceOptimizer = {
  init: function() {
    // Initialisation de l'optimiseur de performance
    console.log('Performance Optimizer initialized');
    this.setupIntersectionObserver();
    this.setupNetworkMonitoring();
    this.setupResourceHints();
  },
  
  cleanup: function() {
    // Nettoyage des ressources
    console.log('Performance Optimizer cleanup');
  },
  
  setupIntersectionObserver: function() {
    // Configuration de l'Intersection Observer pour le lazy loading
    if ('IntersectionObserver' in window) {
      const lazyImages = document.querySelectorAll('.lazy-image');
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const src = img.getAttribute('data-src');
            if (src) {
              img.src = src;
              img.classList.remove('lazy-image');
              observer.unobserve(img);
            }
          }
        });
      });
      
      lazyImages.forEach(image => {
        imageObserver.observe(image);
      });
    }
  },
  
  setupNetworkMonitoring: function() {
    // Surveillance de la connexion réseau
    if ('connection' in navigator) {
      const connection = navigator.connection;
      
      if (connection.saveData) {
        // Mode économie de données activé
        this.enableLowDataMode();
      }
      
      if (connection.effectiveType.includes('2g') || connection.effectiveType.includes('slow')) {
        // Connexion lente détectée
        this.enableLowBandwidthMode();
      }
      
      connection.addEventListener('change', () => {
        if (connection.saveData) {
          this.enableLowDataMode();
        } else {
          this.disableLowDataMode();
        }
        
        if (connection.effectiveType.includes('2g') || connection.effectiveType.includes('slow')) {
          this.enableLowBandwidthMode();
        } else {
          this.disableLowBandwidthMode();
        }
      });
    }
  },
  
  setupResourceHints: function() {
    // Ajout de resource hints pour améliorer les performances
    const preconnectUrls = [
      'https://api.mapbox.com',
      'https://api.openweathermap.org'
    ];
    
    preconnectUrls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = url;
      document.head.appendChild(link);
    });
  },
  
  enableLowDataMode: function() {
    // Réduction de la qualité des images et désactivation des animations
    document.body.classList.add('low-data-mode');
    console.log('Low data mode enabled');
  },
  
  disableLowDataMode: function() {
    // Restauration de la qualité normale
    document.body.classList.remove('low-data-mode');
    console.log('Low data mode disabled');
  },
  
  enableLowBandwidthMode: function() {
    // Optimisations pour connexion lente
    document.body.classList.add('low-bandwidth-mode');
    console.log('Low bandwidth mode enabled');
  },
  
  disableLowBandwidthMode: function() {
    // Désactivation des optimisations pour connexion lente
    document.body.classList.remove('low-bandwidth-mode');
    console.log('Low bandwidth mode disabled');
  },
  
  measurePageLoad: function() {
    // Mesure des performances de chargement
    if (window.performance) {
      const perfData = window.performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      console.log(`Page load time: ${pageLoadTime}ms`);
      return pageLoadTime;
    }
    return null;
  },
  
  optimizeImages: function() {
    // Optimisation des images en fonction de l'appareil
    const devicePixelRatio = window.devicePixelRatio || 1;
    const screenWidth = window.innerWidth;
    
    document.querySelectorAll('img[data-src-template]').forEach(img => {
      const template = img.getAttribute('data-src-template');
      let quality = 'high';
      
      if (devicePixelRatio <= 1) {
        quality = screenWidth < 768 ? 'low' : 'medium';
      } else if (devicePixelRatio <= 2) {
        quality = screenWidth < 768 ? 'medium' : 'high';
      }
      
      const src = template.replace('{quality}', quality);
      img.setAttribute('data-src', src);
    });
  }
};

export default PerformanceOptimizer;
