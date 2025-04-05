/**
 * Service de chargement progressif des images
 * Optimise le chargement des images en fonction de la priorité et des capacités de l'appareil
 */

import apiCacheService, { CACHE_STRATEGIES } from './apiCache';

// Configuration des tailles d'images selon les appareils
const IMAGE_SIZES = {
  thumbnail: { width: 120, height: 80 },
  small: { width: 320, height: 240 },
  medium: { width: 640, height: 480 },
  large: { width: 1280, height: 960 },
  original: { width: null, height: null } // Dimension originale
};

// Priorités de chargement
const LOAD_PRIORITIES = {
  CRITICAL: 1,  // Images dans la viewport initiale ou essentielles à l'UX
  HIGH: 2,      // Images juste en-dessous de la fold ou importantes
  MEDIUM: 3,    // Images qui seront visibles après un peu de défilement
  LOW: 4,       // Images qui ne sont visibles qu'après beaucoup de défilement
  LAZY: 5       // Images qui peuvent être chargées en dernier
};

// Configuration du débit réseau estimé (en octets/seconde)
const NETWORK_SPEEDS = {
  SLOW_2G: 50 * 1024,     // ~50 KB/s
  REGULAR_2G: 250 * 1024, // ~250 KB/s
  GOOD_3G: 750 * 1024,    // ~750 KB/s
  REGULAR_4G: 1.5 * 1024 * 1024, // ~1.5 MB/s
  FAST: 3 * 1024 * 1024   // >3 MB/s
};

class ProgressiveImageLoader {
  constructor() {
    this.loadQueue = [];
    this.loadingImages = new Map();
    this.loadedImages = new Map();
    this.placeholders = new Map();
    this.observer = null;
    this.networkSpeed = NETWORK_SPEEDS.GOOD_3G; // Estimation par défaut
    this.isProcessingQueue = false;
    this.isMobile = this.detectMobile();
    this.devicePixelRatio = window.devicePixelRatio || 1;
    this.concurrentLoads = this.isMobile ? 2 : 4;
    this.setupIntersectionObserver();
    this.estimateNetworkSpeed();
  }

  /**
   * Détecte si l'appareil est mobile
   * @returns {boolean} True si mobile
   */
  detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * Estime la vitesse du réseau
   */
  estimateNetworkSpeed() {
    // Si l'API NetworkInformation est disponible
    if (navigator.connection) {
      const connection = navigator.connection;
      
      if (connection.effectiveType === 'slow-2g') {
        this.networkSpeed = NETWORK_SPEEDS.SLOW_2G;
      } else if (connection.effectiveType === '2g') {
        this.networkSpeed = NETWORK_SPEEDS.REGULAR_2G;
      } else if (connection.effectiveType === '3g') {
        this.networkSpeed = NETWORK_SPEEDS.GOOD_3G;
      } else if (connection.effectiveType === '4g') {
        this.networkSpeed = NETWORK_SPEEDS.REGULAR_4G;
      } else {
        this.networkSpeed = NETWORK_SPEEDS.FAST;
      }
      
      // Écouter les changements de connexion
      connection.addEventListener('change', () => {
        this.estimateNetworkSpeed();
        this.reprocessQueue();
      });
    } else {
      // Méthode alternative si l'API n'est pas disponible
      this.estimateSpeedWithTestImage();
    }
  }

  /**
   * Estime la vitesse réseau en chargeant une image test
   */
  estimateSpeedWithTestImage() {
    const startTime = Date.now();
    const testImage = new Image();
    const testImageUrl = '/assets/images/network-test.jpg'; // ~100KB test image
    
    testImage.onload = () => {
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000; // en secondes
      const imageSize = 100 * 1024; // Taille approximative de 100KB
      this.networkSpeed = Math.floor(imageSize / duration);
      
      // Ajuster le nombre de chargements concurrents selon la vitesse réseau
      if (this.networkSpeed < NETWORK_SPEEDS.REGULAR_2G) {
        this.concurrentLoads = 1;
      } else if (this.networkSpeed < NETWORK_SPEEDS.GOOD_3G) {
        this.concurrentLoads = this.isMobile ? 1 : 2;
      } else {
        this.concurrentLoads = this.isMobile ? 2 : 4;
      }
      
      this.reprocessQueue();
    };
    
    testImage.onerror = () => {
      // En cas d'erreur, utiliser une valeur par défaut
      this.networkSpeed = NETWORK_SPEEDS.GOOD_3G;
    };
    
    testImage.src = testImageUrl;
  }

  /**
   * Configure l'Intersection Observer pour le chargement basé sur la visibilité
   */
  setupIntersectionObserver() {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const element = entry.target;
              const imageId = element.dataset.imageId;
              
              if (imageId && !this.loadedImages.has(imageId) && !this.loadingImages.has(imageId)) {
                const imageUrl = element.dataset.imageUrl;
                const priority = parseInt(element.dataset.imagePriority || LOAD_PRIORITIES.MEDIUM);
                
                this.loadImage(imageId, imageUrl, { 
                  priority, 
                  element,
                  size: element.dataset.imageSize || 'medium'
                });
              }
              
              // Arrêter d'observer une fois que l'image commence à charger
              this.observer.unobserve(element);
            }
          });
        }, 
        {
          root: null,
          rootMargin: '200px', // Marge pour précharger avant que l'élément entre dans le viewport
          threshold: 0.01 // Déclencher dès qu'une petite partie de l'image est visible
        }
      );
    }
  }

  /**
   * Génère un placeholder pour une image en attendant son chargement
   * @param {string} imageId Identifiant de l'image
   * @param {string} type Type de placeholder ('color', 'blur', 'lqip')
   * @param {string} value Valeur du placeholder (couleur ou image basse qualité)
   */
  setPlaceholder(imageId, type = 'color', value = '#f0f0f0') {
    this.placeholders.set(imageId, { type, value });
    return { type, value };
  }

  /**
   * Récupère le placeholder pour une image
   * @param {string} imageId Identifiant de l'image
   * @returns {Object|null} Informations du placeholder ou null
   */
  getPlaceholder(imageId) {
    return this.placeholders.get(imageId) || null;
  }

  /**
   * Charge une image avec gestion de priorité et mise en cache
   * @param {string} imageId Identifiant unique de l'image
   * @param {string} url URL de l'image
   * @param {Object} options Options de chargement
   * @returns {Promise<string>} URL de l'image chargée
   */
  loadImage(imageId, url, options = {}) {
    const {
      priority = LOAD_PRIORITIES.MEDIUM,
      size = 'medium',
      element = null,
      onProgress = null,
      onLoad = null,
      useCache = true
    } = options;
    
    // Si l'image est déjà chargée, renvoyer son URL
    if (this.loadedImages.has(imageId)) {
      return Promise.resolve(this.loadedImages.get(imageId));
    }
    
    // Si l'image est déjà en cours de chargement, renvoyer sa promesse
    if (this.loadingImages.has(imageId)) {
      return this.loadingImages.get(imageId);
    }
    
    // Préparer l'URL adaptée à la taille demandée
    const optimizedUrl = this.getOptimizedImageUrl(url, size);
    
    // Créer une promesse de chargement
    const loadPromise = new Promise((resolve, reject) => {
      // Ajouter à la file d'attente avec sa priorité
      this.loadQueue.push({
        id: imageId,
        url: optimizedUrl,
        priority,
        resolve,
        reject,
        element,
        onProgress,
        onLoad,
        useCache,
        addedTime: Date.now()
      });
      
      // Trier et traiter la file d'attente
      this.sortQueue();
      this.processQueue();
      
      // Observer l'élément pour le chargement basé sur la visibilité
      if (element && this.observer) {
        this.observer.observe(element);
      }
    });
    
    // Stocker la promesse dans la map des images en cours de chargement
    this.loadingImages.set(imageId, loadPromise);
    
    return loadPromise;
  }

  /**
   * Optimise l'URL de l'image en fonction de la taille demandée
   * @param {string} url URL originale
   * @param {string} size Taille demandée ('thumbnail', 'small', 'medium', 'large', 'original')
   * @returns {string} URL optimisée
   */
  getOptimizedImageUrl(url, size) {
    // Si la taille est 'original' ou non reconnue, renvoyer l'URL originale
    if (size === 'original' || !IMAGE_SIZES[size]) {
      return url;
    }
    
    // Vérifier si l'URL contient déjà des paramètres
    const hasParams = url.includes('?');
    const connector = hasParams ? '&' : '?';
    
    // Ajouter des paramètres pour le redimensionnement
    const { width, height } = IMAGE_SIZES[size];
    return `${url}${connector}w=${width}&h=${height}&fit=crop&auto=format`;
  }

  /**
   * Trie la file d'attente selon la priorité et l'ancienneté
   */
  sortQueue() {
    this.loadQueue.sort((a, b) => {
      // D'abord par priorité (les nombres plus petits ont une priorité plus élevée)
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      
      // Ensuite par ancienneté (FIFO)
      return a.addedTime - b.addedTime;
    });
  }

  /**
   * Traite la file d'attente de chargement d'images
   */
  processQueue() {
    if (this.isProcessingQueue || this.loadQueue.length === 0) {
      return;
    }
    
    this.isProcessingQueue = true;
    
    // Déterminer combien d'images peuvent être chargées simultanément
    const currentlyLoading = this.loadingImages.size;
    const slotsAvailable = Math.max(0, this.concurrentLoads - currentlyLoading);
    
    // Traiter autant d'éléments que possible
    for (let i = 0; i < Math.min(slotsAvailable, this.loadQueue.length); i++) {
      const item = this.loadQueue.shift();
      
      if (!item) break;
      
      // Charger l'image depuis le cache ou via un nouvel appel
      if (item.useCache) {
        this.loadImageWithCache(item);
      } else {
        this.loadImageDirect(item);
      }
    }
    
    this.isProcessingQueue = false;
    
    // Si d'autres éléments sont en attente, planifier un traitement ultérieur
    if (this.loadQueue.length > 0) {
      setTimeout(() => this.processQueue(), 100);
    }
  }

  /**
   * Charge une image avec cache via le service apiCache
   * @param {Object} item Élément de la file d'attente
   */
  loadImageWithCache(item) {
    apiCacheService.get(item.url, {
      strategy: CACHE_STRATEGIES.CACHE_FIRST,
      ttl: 7 * 24 * 60 * 60 * 1000, // 7 jours
      tags: ['images']
    })
    .then(response => {
      const imageUrl = response.data || item.url;
      this.finalizeImageLoading(item, imageUrl);
    })
    .catch(error => {
      console.warn(`Échec de chargement de l'image depuis le cache: ${item.url}`, error);
      // Tenter un chargement direct en cas d'échec du cache
      this.loadImageDirect(item);
    });
  }

  /**
   * Charge une image directement sans cache
   * @param {Object} item Élément de la file d'attente
   */
  loadImageDirect(item) {
    const image = new Image();
    let loadStartTime = Date.now();
    
    image.onload = () => {
      // Calculer le temps de chargement pour ajuster les estimations
      const loadTime = Date.now() - loadStartTime;
      const imageSize = this.estimateImageSize(item.url, image);
      this.updateNetworkEstimation(imageSize, loadTime);
      
      this.finalizeImageLoading(item, item.url);
      
      if (item.onLoad) {
        item.onLoad(item.url);
      }
    };
    
    image.onerror = () => {
      console.error(`Échec de chargement de l'image: ${item.url}`);
      this.loadingImages.delete(item.id);
      item.reject(new Error(`Failed to load image: ${item.url}`));
    };
    
    // Démarrer le chargement
    image.src = item.url;
  }

  /**
   * Finalise le chargement d'une image
   * @param {Object} item Élément de la file d'attente
   * @param {string} finalUrl URL finale de l'image chargée
   */
  finalizeImageLoading(item, finalUrl) {
    // Marquer l'image comme chargée
    this.loadedImages.set(item.id, finalUrl);
    this.loadingImages.delete(item.id);
    
    // Résoudre la promesse
    item.resolve(finalUrl);
    
    // Mettre à jour l'élément DOM si fourni
    if (item.element) {
      if (item.element.tagName === 'IMG') {
        item.element.src = finalUrl;
      } else {
        item.element.style.backgroundImage = `url(${finalUrl})`;
      }
      
      // Ajouter une classe pour indiquer que l'image est chargée
      item.element.classList.add('image-loaded');
      item.element.classList.remove('image-loading');
    }
    
    // Continuer à traiter la file d'attente
    this.processQueue();
  }

  /**
   * Estime la taille d'une image en octets
   * @param {string} url URL de l'image
   * @param {Image} image Objet Image chargé
   * @returns {number} Taille estimée en octets
   */
  estimateImageSize(url, image) {
    // Si l'URL inclut "w=" et "h=", utiliser ces dimensions
    let width = image.naturalWidth;
    let height = image.naturalHeight;
    
    const wMatch = url.match(/w=(\d+)/);
    const hMatch = url.match(/h=(\d+)/);
    
    if (wMatch && hMatch) {
      width = parseInt(wMatch[1]);
      height = parseInt(hMatch[1]);
    }
    
    // Estimation simple: 4 octets par pixel (RGBA)
    return width * height * 4;
  }

  /**
   * Met à jour l'estimation de la vitesse réseau
   * @param {number} imageSize Taille de l'image en octets
   * @param {number} loadTime Temps de chargement en millisecondes
   */
  updateNetworkEstimation(imageSize, loadTime) {
    // Convertir le temps en secondes
    const loadTimeSeconds = loadTime / 1000;
    
    // Calculer la vitesse en octets par seconde
    if (loadTimeSeconds > 0) {
      const speed = imageSize / loadTimeSeconds;
      
      // Moyenne pondérée avec l'estimation actuelle (70% ancien, 30% nouveau)
      this.networkSpeed = (this.networkSpeed * 0.7) + (speed * 0.3);
      
      // Ajuster le nombre de chargements concurrents
      this.updateConcurrentLoads();
    }
  }

  /**
   * Met à jour le nombre de chargements concurrents en fonction de la vitesse réseau
   */
  updateConcurrentLoads() {
    if (this.networkSpeed < NETWORK_SPEEDS.REGULAR_2G) {
      this.concurrentLoads = 1;
    } else if (this.networkSpeed < NETWORK_SPEEDS.GOOD_3G) {
      this.concurrentLoads = this.isMobile ? 1 : 2;
    } else if (this.networkSpeed < NETWORK_SPEEDS.REGULAR_4G) {
      this.concurrentLoads = this.isMobile ? 2 : 3;
    } else {
      this.concurrentLoads = this.isMobile ? 2 : 4;
    }
  }

  /**
   * Force le retraitement de la file d'attente
   * (utile après un changement de priorité ou d'état réseau)
   */
  reprocessQueue() {
    this.sortQueue();
    this.isProcessingQueue = false;
    this.processQueue();
  }

  /**
   * Précharge des images sans les afficher
   * @param {Array<Object>} imageInfos Liste d'objets {id, url, priority, size}
   * @returns {Promise<Array>} Promesses de chargement
   */
  preloadImages(imageInfos) {
    return Promise.all(
      imageInfos.map(info => 
        this.loadImage(info.id, info.url, {
          priority: info.priority || LOAD_PRIORITIES.LOW,
          size: info.size || 'small'
        })
      )
    );
  }

  /**
   * Annule le chargement d'une image
   * @param {string} imageId Identifiant de l'image
   */
  cancelLoading(imageId) {
    // Supprimer de la file d'attente si présent
    this.loadQueue = this.loadQueue.filter(item => item.id !== imageId);
    
    // Supprimer des images en cours de chargement
    this.loadingImages.delete(imageId);
  }

  /**
   * Nettoie les ressources du service
   */
  dispose() {
    // Arrêter l'Intersection Observer
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    // Vider les files d'attente et les caches
    this.loadQueue = [];
    this.loadingImages.clear();
    this.loadedImages.clear();
    this.placeholders.clear();
  }
}

// Exporter le service comme singleton
const progressiveImageLoader = new ProgressiveImageLoader();
export { LOAD_PRIORITIES, IMAGE_SIZES };
export default progressiveImageLoader;
