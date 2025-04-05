/**
 * mobileOptimizer.js
 * Optimisations spécifiques pour les appareils mobiles
 * 
 * Ce module fournit des fonctions d'optimisation pour améliorer
 * les performances sur les appareils mobiles et à faible puissance.
 */

import deviceCapabilityDetector from './deviceCapabilityDetector';

class MobileOptimizer {
  constructor() {
    // État initial
    this.isMobile = this.detectMobile();
    this.isTablet = this.detectTablet();
    this.initialized = false;
    
    // Options d'optimisation par défaut
    this.optimizations = {
      reducedResolution: true,      // Réduire la résolution de rendu
      simplifiedEffects: true,      // Simplifier ou désactiver certains effets
      batterySaveMode: false,       // Mode économie de batterie
      optimizedControls: true,      // Contrôles optimisés pour tactile
      progressiveLoading: true,     // Chargement progressif des ressources
      optimizedInteraction: true,   // Interactions optimisées
      reducedAnimations: false,     // Réduire les animations
      adaptiveQuality: true         // Ajuster la qualité dynamiquement
    };
    
    this.originalPixelRatio = window.devicePixelRatio || 1;
    this.currentPixelRatio = this.originalPixelRatio;
    
    // Performance monitoring
    this.performanceMetrics = {
      frameRate: 60,
      frameHistory: [],
      dropCount: 0,
      lastPerformanceCheck: Date.now()
    };
    
    this.adaptiveQualityMetrics = {
      targetFPS: 45,               // FPS cible pour l'ajustement qualité/performance
      minFPS: 30,                  // FPS minimum acceptable
      adjustmentCooldown: 5000,    // Cooldown en ms entre les ajustements
      lastAdjustment: 0,           // Timestamp du dernier ajustement
      currentQualityMultiplier: 1.0 // Multiplicateur actuel de qualité
    };
    
    // Initialiser une fois que le DOM est prêt
    this.initialize();
  }
  
  /**
   * Initialise l'optimiseur mobile
   */
  initialize() {
    if (document.readyState === 'complete') {
      this.setupEventListeners();
    } else {
      window.addEventListener('load', () => this.setupEventListeners());
    }
  }
  
  /**
   * Configure les écouteurs d'événements
   * @private
   */
  setupEventListeners() {
    // Écouter les changements d'orientation
    window.addEventListener('orientationchange', () => {
      this.handleOrientationChange();
    });
    
    // Écouter les changements de visibilité de page
    document.addEventListener('visibilitychange', () => {
      this.handleVisibilityChange();
    });
    
    // Batterie
    if (navigator.getBattery) {
      navigator.getBattery().then(battery => {
        battery.addEventListener('levelchange', () => {
          this.checkBatteryStatus(battery);
        });
        
        battery.addEventListener('chargingchange', () => {
          this.checkBatteryStatus(battery);
        });
        
        // Vérification initiale
        this.checkBatteryStatus(battery);
      });
    }
    
    // Écouter les événements de ralentissement
    this.setupPerformanceMonitoring();
    
    this.initialized = true;
  }
  
  /**
   * Détecte si l'appareil est un mobile
   * @returns {boolean} true si l'appareil est un mobile
   */
  detectMobile() {
    const mobileRegex = /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i;
    return mobileRegex.test(navigator.userAgent || navigator.vendor || window.opera);
  }
  
  /**
   * Détecte si l'appareil est une tablette
   * @returns {boolean} true si l'appareil est une tablette
   */
  detectTablet() {
    const tabletRegex = /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(ad|hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i;
    const isTablet = tabletRegex.test(navigator.userAgent || navigator.vendor || window.opera) &&
      !this.detectMobile();
      
    return isTablet;
  }
  
  /**
   * Vérifie si les optimisations mobiles sont nécessaires
   * @returns {boolean} true si les optimisations mobiles sont nécessaires
   */
  needsMobileOptimizations() {
    const capabilities = deviceCapabilityDetector.getCapabilities();
    return this.isMobile || 
           this.isTablet || 
           capabilities.flags.isLowEndDevice || 
           capabilities.performanceLevel <= 2;
  }
  
  /**
   * Optimise un renderer THREE.js pour mobile
   * @param {THREE.WebGLRenderer} renderer Renderer à optimiser
   * @returns {THREE.WebGLRenderer} Renderer optimisé
   */
  optimizeRenderer(renderer) {
    if (!this.needsMobileOptimizations()) return renderer;
    
    // Réduire la résolution de rendu
    if (this.optimizations.reducedResolution) {
      // Calculer un ratio de pixel optimisé en fonction de la résolution de l'écran
      const capabilities = deviceCapabilityDetector.getCapabilities();
      
      // Plus la résolution est élevée, plus on peut réduire
      let reductionFactor = 1;
      const { width, height } = capabilities.screen.effectiveResolution;
      const pixelCount = width * height;
      
      if (pixelCount > 4000000) reductionFactor = 0.5;  // 4M pixels+ (2K, 4K)
      else if (pixelCount > 2000000) reductionFactor = 0.65; // 2M-4M pixels (1080p+)
      else if (pixelCount > 1000000) reductionFactor = 0.75; // 1M-2M pixels
      else reductionFactor = 0.85; // moins de 1M pixels
      
      // Réduire si mode économie de batterie
      if (this.optimizations.batterySaveMode) {
        reductionFactor *= 0.7;
      }
      
      // Appliquer la réduction
      this.currentPixelRatio = this.originalPixelRatio * reductionFactor;
      renderer.setPixelRatio(this.currentPixelRatio);
      
      console.log(`MobileOptimizer: pixel ratio réduit de ${this.originalPixelRatio} à ${this.currentPixelRatio}`);
    }
    
    // Simplifier les effets
    if (this.optimizations.simplifiedEffects) {
      // Désactiver l'antialiasing si ce n'est pas déjà fait
      if (renderer.antialias) {
        console.warn('MobileOptimizer: impossible de désactiver l\'antialiasing après la création du renderer');
      }
      
      // Réduire la précision des shaders
      if (renderer.capabilities && renderer.capabilities.precision === 'highp') {
        renderer.capabilities.precision = 'mediump';
      }
      
      // Désactiver les shadow maps si possible
      if (renderer.shadowMap && renderer.shadowMap.enabled) {
        renderer.shadowMap.enabled = false;
      }
    }
    
    return renderer;
  }
  
  /**
   * Optimise les contrôles tactiles pour un meilleur usage sur mobile
   * @param {Object} controls Contrôles à optimiser (OrbitControls, etc.)
   * @returns {Object} Contrôles optimisés
   */
  setupOptimizedTouchControls(controls) {
    if (!this.needsMobileOptimizations() || !this.optimizations.optimizedControls) {
      return controls;
    }
    
    // Paramètres génériques qui fonctionnent pour la plupart des contrôles THREE.js
    if (controls.domElement) {
      // Augmenter la zone de toucher
      if (controls.domElement.style) {
        controls.domElement.style.touchAction = 'none';
      }
    }
    
    // Ajuster la sensibilité pour le tactile
    // OrbitControls
    if (controls.rotateSpeed !== undefined) {
      controls.rotateSpeed = 0.8; // Plus lent pour plus de précision
    }
    
    if (controls.zoomSpeed !== undefined) {
      controls.zoomSpeed = 1.2; // Plus rapide pour le zoom
    }
    
    if (controls.panSpeed !== undefined) {
      controls.panSpeed = 0.8; // Plus lent pour plus de précision
    }
    
    // Désactiver l'inertie sur mobile (peut causer des problèmes de performance)
    if (controls.enableDamping !== undefined) {
      controls.enableDamping = false;
    }
    
    // Augmenter les distances min/max de zoom pour éviter des problèmes
    if (controls.minDistance !== undefined) {
      controls.minDistance *= 1.2; // Éviter de zoomer trop près
    }
    
    // TrackballControls
    if (controls.noRotate !== undefined) {
      controls.rotateSpeed = 2.0; // TrackballControls nécessite plus de rapidité
    }
    
    // FlyControls ou équivalent
    if (controls.movementSpeed !== undefined) {
      controls.movementSpeed *= 0.7; // Ralentir les mouvements
    }
    
    return controls;
  }
  
  /**
   * Active le mode économie de batterie
   * @param {THREE.WebGLRenderer} renderer Renderer à optimiser
   * @param {Function} animate Fonction d'animation originale
   * @returns {Function} Nouvelle fonction d'animation optimisée
   */
  enableBatterySaveMode(renderer, animate) {
    if (!this.needsMobileOptimizations()) return animate;
    
    this.optimizations.batterySaveMode = true;
    
    // Réduire davantage la résolution
    const batterySavePixelRatio = this.currentPixelRatio * 0.7;
    renderer.setPixelRatio(batterySavePixelRatio);
    
    // Limiter le framerate
    let lastTime = 0;
    const targetFPS = 30; // 30 FPS en mode économie de batterie
    const frameTime = 1000 / targetFPS;
    
    const throttledAnimate = (time) => {
      const currentTime = time || performance.now();
      const elapsed = currentTime - lastTime;
      
      if (elapsed > frameTime) {
        lastTime = currentTime - (elapsed % frameTime);
        animate(currentTime);
      }
      
      if (this.optimizations.batterySaveMode) {
        setTimeout(() => requestAnimationFrame(throttledAnimate), 5);
      } else {
        requestAnimationFrame(throttledAnimate);
      }
    };
    
    console.log('MobileOptimizer: mode économie de batterie activé');
    return throttledAnimate;
  }
  
  /**
   * Gère les changements d'orientation sur mobile
   * @private
   */
  handleOrientationChange() {
    // Attendre que l'orientation soit terminée
    setTimeout(() => {
      // Mettre à jour les optimisations si nécessaire
      this.adjustForCurrentContext();
      
      // Déclencher un événement personnalisé pour informer l'application
      const event = new CustomEvent('optimized-orientation-change', {
        detail: {
          orientation: window.orientation,
          aspectRatio: window.innerWidth / window.innerHeight
        }
      });
      
      window.dispatchEvent(event);
    }, 300);
  }
  
  /**
   * Gère les changements de visibilité de page
   * @private
   */
  handleVisibilityChange() {
    if (document.hidden) {
      // La page est cachée, réduire les ressources utilisées
      this.pauseNonEssentialProcesses();
    } else {
      // La page est visible à nouveau
      this.resumeNonEssentialProcesses();
    }
  }
  
  /**
   * Vérifie l'état de la batterie et ajuste les optimisations
   * @param {BatteryManager} battery Objet batterie
   * @private
   */
  checkBatteryStatus(battery) {
    const lowBattery = !battery.charging && battery.level < 0.3;
    
    if (lowBattery !== this.optimizations.batterySaveMode) {
      this.optimizations.batterySaveMode = lowBattery;
      
      if (lowBattery) {
        console.log('MobileOptimizer: niveau de batterie bas, optimisations accrues activées');
      } else {
        console.log('MobileOptimizer: niveau de batterie normal, optimisations standard');
      }
      
      // Déclencher un événement pour informer l'application
      window.dispatchEvent(new CustomEvent('battery-status-change', {
        detail: {
          low: lowBattery,
          level: battery.level,
          charging: battery.charging
        }
      }));
    }
  }
  
  /**
   * Met en pause les processus non essentiels quand la page est en arrière-plan
   * @private
   */
  pauseNonEssentialProcesses() {
    // Stocker l'état actuel pour le restaurer plus tard
    this._pausedState = {
      adaptiveQuality: this.optimizations.adaptiveQuality,
      reducedResolution: this.optimizations.reducedResolution
    };
    
    // Optimisation maximale en arrière-plan
    this.optimizations.adaptiveQuality = false;
    this.optimizations.reducedResolution = true;
    
    console.log('MobileOptimizer: pause des processus non essentiels');
    
    // Déclencher un événement
    window.dispatchEvent(new CustomEvent('optimization-state-change', {
      detail: {
        state: 'paused',
        optimizations: this.optimizations
      }
    }));
  }
  
  /**
   * Reprend les processus non essentiels quand la page revient au premier plan
   * @private
   */
  resumeNonEssentialProcesses() {
    if (this._pausedState) {
      // Restaurer l'état précédent
      this.optimizations.adaptiveQuality = this._pausedState.adaptiveQuality;
      this.optimizations.reducedResolution = this._pausedState.reducedResolution;
      
      console.log('MobileOptimizer: reprise des processus non essentiels');
      
      // Déclencher un événement
      window.dispatchEvent(new CustomEvent('optimization-state-change', {
        detail: {
          state: 'resumed',
          optimizations: this.optimizations
        }
      }));
    }
  }
  
  /**
   * Configure le monitoring de performance
   * @private
   */
  setupPerformanceMonitoring() {
    if (!this.optimizations.adaptiveQuality) return;
    
    let lastTime = performance.now();
    let frames = 0;
    
    const checkPerformance = () => {
      const now = performance.now();
      frames++;
      
      // Calculer le FPS toutes les secondes
      if (now - lastTime >= 1000) {
        const currentFPS = Math.round(frames * 1000 / (now - lastTime));
        
        // Mettre à jour l'historique
        this.performanceMetrics.frameHistory.push(currentFPS);
        if (this.performanceMetrics.frameHistory.length > 60) {
          this.performanceMetrics.frameHistory.shift();
        }
        
        // Calculer la moyenne
        const averageFPS = this.performanceMetrics.frameHistory.reduce((a, b) => a + b, 0) / 
                          this.performanceMetrics.frameHistory.length;
                         
        this.performanceMetrics.frameRate = Math.round(averageFPS);
        
        // Détecter les chutes de frames
        if (currentFPS < this.adaptiveQualityMetrics.minFPS) {
          this.performanceMetrics.dropCount++;
          
          // Si on a plusieurs chutes consécutives, ajuster la qualité
          if (this.performanceMetrics.dropCount >= 3) {
            this.adjustQualityBasedOnPerformance();
            this.performanceMetrics.dropCount = 0;
          }
        } else {
          this.performanceMetrics.dropCount = Math.max(0, this.performanceMetrics.dropCount - 1);
        }
        
        // Vérifier si on peut augmenter la qualité
        const timeSinceLastAdjustment = now - this.adaptiveQualityMetrics.lastAdjustment;
        if (timeSinceLastAdjustment > this.adaptiveQualityMetrics.adjustmentCooldown && 
            this.performanceMetrics.frameRate > this.adaptiveQualityMetrics.targetFPS + 10) {
          this.increaseQuality();
        }
        
        // Reset compteurs
        lastTime = now;
        frames = 0;
      }
      
      // Continuer la vérification
      requestAnimationFrame(checkPerformance);
    };
    
    // Démarrer le monitoring
    checkPerformance();
  }
  
  /**
   * Ajuste la qualité visuelle en fonction des performances
   * @private
   */
  adjustQualityBasedOnPerformance() {
    const now = performance.now();
    
    // Vérifier le cooldown
    if (now - this.adaptiveQualityMetrics.lastAdjustment < this.adaptiveQualityMetrics.adjustmentCooldown) {
      return;
    }
    
    // Réduire la qualité
    this.adaptiveQualityMetrics.currentQualityMultiplier *= 0.8;
    this.adaptiveQualityMetrics.currentQualityMultiplier = Math.max(0.4, this.adaptiveQualityMetrics.currentQualityMultiplier);
    this.adaptiveQualityMetrics.lastAdjustment = now;
    
    console.log(`MobileOptimizer: réduction de la qualité à ${Math.round(this.adaptiveQualityMetrics.currentQualityMultiplier * 100)}% pour maintenir les performances`);
    
    // Déclencher un événement pour informer l'application
    window.dispatchEvent(new CustomEvent('quality-adjustment', {
      detail: {
        qualityMultiplier: this.adaptiveQualityMetrics.currentQualityMultiplier,
        reason: 'performance-drop',
        frameRate: this.performanceMetrics.frameRate
      }
    }));
  }
  
  /**
   * Augmente la qualité si les performances le permettent
   * @private
   */
  increaseQuality() {
    const now = performance.now();
    
    // Vérifier le cooldown
    if (now - this.adaptiveQualityMetrics.lastAdjustment < this.adaptiveQualityMetrics.adjustmentCooldown) {
      return;
    }
    
    // Augmenter la qualité
    this.adaptiveQualityMetrics.currentQualityMultiplier *= 1.1;
    this.adaptiveQualityMetrics.currentQualityMultiplier = Math.min(1.0, this.adaptiveQualityMetrics.currentQualityMultiplier);
    this.adaptiveQualityMetrics.lastAdjustment = now;
    
    console.log(`MobileOptimizer: augmentation de la qualité à ${Math.round(this.adaptiveQualityMetrics.currentQualityMultiplier * 100)}% grâce aux bonnes performances`);
    
    // Déclencher un événement pour informer l'application
    window.dispatchEvent(new CustomEvent('quality-adjustment', {
      detail: {
        qualityMultiplier: this.adaptiveQualityMetrics.currentQualityMultiplier,
        reason: 'performance-good',
        frameRate: this.performanceMetrics.frameRate
      }
    }));
  }
  
  /**
   * Ajuste les optimisations en fonction du contexte actuel
   */
  adjustForCurrentContext() {
    const capabilities = deviceCapabilityDetector.getCapabilities();
    
    // Ajuster les optimisations en fonction de l'orientation
    const isLandscape = window.innerWidth > window.innerHeight;
    
    if (isLandscape) {
      // En mode paysage, on peut être un peu plus généreux
      this.optimizations.reducedResolution = this.isMobile;
    } else {
      // En mode portrait, optimiser davantage
      this.optimizations.reducedResolution = true;
    }
    
    // Ajuster en fonction du réseau
    if (capabilities.network.effectiveType === '2g' || 
        capabilities.network.effectiveType === 'slow-2g') {
      this.optimizations.progressiveLoading = true;
      this.optimizations.reducedAnimations = true;
    }
    
    console.log('MobileOptimizer: ajustement des optimisations au contexte actuel');
  }
  
  /**
   * Retourne la configuration d'optimisation actuelle pour les shaders
   * @returns {Object} Configuration pour les shaders
   */
  getShaderOptimizationConfig() {
    const config = {
      precision: 'mediump',
      optimizeLoops: this.needsMobileOptimizations(),
      simplifyLighting: this.needsMobileOptimizations(),
      maxLights: this.optimizations.batterySaveMode ? 2 : 4
    };
    
    if (this.optimizations.batterySaveMode) {
      config.precision = 'lowp';
    }
    
    return config;
  }
  
  /**
   * Configure un chargeur de textures pour le chargement progressif
   * @param {THREE.TextureLoader} textureLoader Chargeur de textures THREE.js
   * @returns {Object} API pour le chargement progressif
   */
  setupProgressiveTextureLoading(textureLoader) {
    if (!textureLoader) return null;
    
    const capabilities = deviceCapabilityDetector.getCapabilities();
    const isLowEnd = capabilities.flags.isLowEndDevice || capabilities.performanceLevel <= 2;
    
    // Créer une API pour le chargement progressif
    return {
      /**
       * Charge une texture de manière progressive
       * @param {string} url URL de la texture
       * @param {Function} onProgress Callback de progression
       * @returns {Promise<Object>} Promise avec les textures chargées progressivement
       */
      loadTexture: (url, onProgress) => {
        return new Promise((resolve) => {
          // Déterminer les résolutions à charger
          let resolutions = ['low', 'high'];
          
          if (isLowEnd || this.optimizations.batterySaveMode) {
            // Pour les appareils faibles, on charge uniquement la version basse résolution
            resolutions = ['low'];
          }
          
          // Générer les URLs pour les différentes résolutions
          const urls = resolutions.map(res => {
            const urlObj = new URL(url, window.location.href);
            const urlParts = urlObj.pathname.split('.');
            const ext = urlParts.pop();
            
            if (res === 'low') {
              return `${urlParts.join('.')}_low.${ext}`;
            }
            return url;
          });
          
          // Charger la version basse résolution d'abord
          textureLoader.load(urls[0], (lowTexture) => {
            if (resolutions.length === 1 || !this.optimizations.progressiveLoading) {
              // Si on ne charge qu'une résolution ou que le chargement progressif est désactivé
              resolve({ texture: lowTexture, quality: 'low' });
            } else {
              // Sinon, on charge aussi la haute résolution
              textureLoader.load(urls[1], (highTexture) => {
                resolve({ 
                  texture: highTexture, 
                  quality: 'high',
                  lowQualityTexture: lowTexture 
                });
              }, onProgress);
              
              // Mais on retourne déjà la basse résolution pour l'afficher pendant le chargement
              resolve({ 
                texture: lowTexture, 
                quality: 'low',
                pendingHighQuality: true
              });
            }
          }, onProgress);
        });
      }
    };
  }
}

// Exporter une instance singleton
const mobileOptimizer = new MobileOptimizer();
export default mobileOptimizer;
