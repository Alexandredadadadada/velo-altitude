/**
 * Utilitaire de détection de performance pour optimiser les visualisations 3D
 * Détecte automatiquement les capacités de l'appareil et ajuste la qualité du rendu
 */

class PerformanceDetector {
  constructor() {
    // Niveaux de performance
    this.PERF_LEVELS = {
      ULTRA_LOW: 0,   // Appareils très anciens ou très contraints
      LOW: 1,         // Appareils d'entrée de gamme ou anciens
      MEDIUM_LOW: 2,  // Appareils intermédiaires faibles
      MEDIUM: 3,      // Appareils moyens
      MEDIUM_HIGH: 4, // Appareils intermédiaires puissants
      HIGH: 5,        // Appareils puissants
      ULTRA_HIGH: 6   // Appareils haut de gamme
    };
    
    // Niveaux de qualité correspondants
    this.QUALITY_PRESETS = {
      ULTRA_LOW: {
        terrainSegments: 32,
        terrainTexture: 512,
        usePostProcessing: false,
        useRealisticLighting: false,
        useShadows: false,
        drawDistance: 5000,
        useAntialiasing: false,
        useBloom: false,
        particleDensity: 0.2,
        maxPointsOfInterest: 5,
        maxBackgroundModels: 0
      },
      LOW: {
        terrainSegments: 64,
        terrainTexture: 1024,
        usePostProcessing: false,
        useRealisticLighting: false,
        useShadows: false,
        drawDistance: 8000,
        useAntialiasing: false,
        useBloom: false,
        particleDensity: 0.4,
        maxPointsOfInterest: 10,
        maxBackgroundModels: 2
      },
      MEDIUM_LOW: {
        terrainSegments: 96,
        terrainTexture: 1024,
        usePostProcessing: false,
        useRealisticLighting: true,
        useShadows: false,
        drawDistance: 10000,
        useAntialiasing: true,
        useBloom: false,
        particleDensity: 0.6,
        maxPointsOfInterest: 15,
        maxBackgroundModels: 5
      },
      MEDIUM: {
        terrainSegments: 128,
        terrainTexture: 2048,
        usePostProcessing: true,
        useRealisticLighting: true,
        useShadows: true,
        drawDistance: 12000,
        useAntialiasing: true,
        useBloom: false,
        particleDensity: 0.7,
        maxPointsOfInterest: 20,
        maxBackgroundModels: 8
      },
      MEDIUM_HIGH: {
        terrainSegments: 160,
        terrainTexture: 2048,
        usePostProcessing: true,
        useRealisticLighting: true,
        useShadows: true,
        drawDistance: 15000,
        useAntialiasing: true,
        useBloom: true,
        particleDensity: 0.8,
        maxPointsOfInterest: 30,
        maxBackgroundModels: 12
      },
      HIGH: {
        terrainSegments: 192,
        terrainTexture: 4096,
        usePostProcessing: true,
        useRealisticLighting: true,
        useShadows: true,
        drawDistance: 20000,
        useAntialiasing: true,
        useBloom: true,
        particleDensity: 0.9,
        maxPointsOfInterest: 50,
        maxBackgroundModels: 20
      },
      ULTRA_HIGH: {
        terrainSegments: 256,
        terrainTexture: 4096,
        usePostProcessing: true,
        useRealisticLighting: true,
        useShadows: true,
        drawDistance: 30000,
        useAntialiasing: true,
        useBloom: true,
        particleDensity: 1.0,
        maxPointsOfInterest: 100,
        maxBackgroundModels: 30
      }
    };
    
    // État de détection
    this.perfLevel = null; // Niveau de performance détecté
    this.isDetecting = false;
    this.onDetectionComplete = null;
    this.detectionTimeout = 10000; // 10 secondes max pour la détection
    
    // Paramètres du test
    this.testDuration = 3000; // 3 secondes
    this.targetFPS = 60;
    this.minimumAcceptableFPS = 30;
    
    // Cache pour les réglages utilisateur
    this.userOverrides = {};
    this.storageKey = 'gec_performance_settings';
    
    // Niveau par défaut en attendant la détection
    this.defaultLevel = this.PERF_LEVELS.MEDIUM;
  }
  
  /**
   * Détecte le niveau de performance de l'appareil
   * @param {Function} callback - Fonction appelée une fois la détection terminée
   * @returns {Promise} Résultat de la détection avec niveau de performance
   */
  async detectPerformance(callback = null) {
    if (this.isDetecting) {
      console.log('Détection de performance déjà en cours');
      return;
    }
    
    // Configurer la promesse et le timeout
    this.isDetecting = true;
    this.onDetectionComplete = callback;
    
    const detectionPromise = new Promise(async (resolve) => {
      console.log('Démarrage de la détection de performance...');
      
      // Essayer de charger les préférences utilisateur
      const savedSettings = this._loadUserSettings();
      if (savedSettings && savedSettings.userSelectedLevel !== undefined) {
        console.log('Utilisation des réglages utilisateur sauvegardés');
        this.perfLevel = savedSettings.userSelectedLevel;
        this.isDetecting = false;
        if (this.onDetectionComplete) this.onDetectionComplete(this.perfLevel);
        resolve({
          level: this.perfLevel,
          preset: this._getQualityPreset(),
          source: 'user_preference'
        });
        return;
      }
      
      // Détection multi-facteurs
      try {
        // 1. Niveau initial basé sur l'appareil et le navigateur
        const initialLevel = this._detectInitialLevel();
        
        // 2. Test de FPS pour validation
        const fpsResult = await this._runFPSTest();
        
        // 3. Déterminer le niveau final basé sur une combinaison de facteurs
        this.perfLevel = this._determineLevelFromFPS(fpsResult, initialLevel);
        
        // 4. Ajustements additionnels basés sur la mémoire disponible et la résolution
        this.perfLevel = this._adjustForMemoryAndResolution(this.perfLevel);
        
        console.log(`Détection terminée: niveau de performance ${this.perfLevel}`);
        
        // Sauvegarder le résultat pour les futures visites
        this._saveDetectionResult();
        
        // Appeler le callback si fourni
        if (this.onDetectionComplete) this.onDetectionComplete(this.perfLevel);
        
        this.isDetecting = false;
        resolve({
          level: this.perfLevel,
          preset: this._getQualityPreset(),
          source: 'detection',
          fps: fpsResult
        });
      } catch (error) {
        console.error('Erreur lors de la détection de performance:', error);
        // En cas d'erreur, utiliser un niveau par défaut sécurisé
        this.perfLevel = this.PERF_LEVELS.MEDIUM_LOW;
        this.isDetecting = false;
        
        if (this.onDetectionComplete) this.onDetectionComplete(this.perfLevel);
        
        resolve({
          level: this.perfLevel,
          preset: this._getQualityPreset(),
          source: 'error_fallback',
          error: error.message
        });
      }
    });
    
    // Ajouter un timeout de sécurité
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => {
        if (this.isDetecting) {
          console.warn('Timeout de détection de performance');
          this.isDetecting = false;
          this.perfLevel = this.defaultLevel;
          
          if (this.onDetectionComplete) this.onDetectionComplete(this.perfLevel);
          
          resolve({
            level: this.perfLevel,
            preset: this._getQualityPreset(),
            source: 'timeout'
          });
        }
      }, this.detectionTimeout);
    });
    
    // Retourne le premier qui termine: la détection ou le timeout
    return Promise.race([detectionPromise, timeoutPromise]);
  }
  
  /**
   * Obtient les réglages de qualité correspondant au niveau détecté
   * @param {number} customLevel - Niveau personnalisé (optionnel)
   * @returns {Object} Réglages de qualité
   */
  getQualitySettings(customLevel = null) {
    // Si pas encore détecté, utiliser le niveau par défaut
    if (this.perfLevel === null && customLevel === null) {
      console.warn('Niveau de performance non détecté, utilisation du niveau par défaut');
      return this._getLevelPreset(this.defaultLevel);
    }
    
    const level = customLevel !== null ? customLevel : this.perfLevel;
    const preset = this._getLevelPreset(level);
    
    // Appliquer les overrides utilisateur
    return { ...preset, ...this.userOverrides };
  }
  
  /**
   * Définit manuellement le niveau de qualité
   * @param {number} level - Niveau de qualité
   * @param {boolean} save - Sauvegarder le réglage pour les visites futures
   * @returns {Object} Nouveaux réglages
   */
  setQualityLevel(level, save = true) {
    if (!Object.values(this.PERF_LEVELS).includes(level)) {
      console.error('Niveau de qualité invalide');
      return this.getQualitySettings();
    }
    
    this.perfLevel = level;
    
    if (save) {
      this._saveUserSettings({ userSelectedLevel: level });
    }
    
    return this.getQualitySettings();
  }
  
  /**
   * Remplace certains paramètres de qualité
   * @param {Object} overrides - Paramètres à remplacer
   * @param {boolean} save - Sauvegarder les overrides
   * @returns {Object} Réglages mis à jour
   */
  overrideSettings(overrides, save = true) {
    this.userOverrides = { ...this.userOverrides, ...overrides };
    
    if (save) {
      this._saveUserSettings({ overrides: this.userOverrides });
    }
    
    return this.getQualitySettings();
  }
  
  /**
   * Réinitialise tous les paramètres à leur valeur détectée
   * @param {boolean} clearSaved - Effacer les préférences sauvegardées
   * @returns {Object} Réglages réinitialisés
   */
  resetToDetectedSettings(clearSaved = true) {
    this.userOverrides = {};
    
    if (clearSaved) {
      localStorage.removeItem(this.storageKey);
    }
    
    // Re-détecter si nécessaire
    if (this.perfLevel === null) {
      this.detectPerformance();
      return this._getLevelPreset(this.defaultLevel);
    }
    
    return this.getQualitySettings();
  }
  
  /**
   * Précharge les ressources à basse résolution puis améliore progressivement
   * @param {Function} preloadCallback - Fonction appelée pour précharger à basse résolution
   * @param {Function} upgradeCallback - Fonction appelée pour améliorer la qualité
   * @returns {Promise} Résultat du préchargement
   */
  async progressiveLoad(preloadCallback, upgradeCallback) {
    // Assurer que la détection est terminée
    if (this.perfLevel === null) {
      await this.detectPerformance();
    }
    
    // Démarrer avec les paramètres de qualité basse, quelle que soit la détection
    const lowQualitySettings = this._getLevelPreset(this.PERF_LEVELS.LOW);
    
    // Précharger avec la qualité basse
    try {
      await preloadCallback(lowQualitySettings);
      
      // Passer aux réglages détectés (amélioration progressive)
      const targetSettings = this.getQualitySettings();
      
      // Si le niveau cible est supérieur au niveau bas
      if (this.perfLevel > this.PERF_LEVELS.LOW) {
        // Calculer les paliers intermédiaires pour une transition fluide
        const steps = this.perfLevel - this.PERF_LEVELS.LOW;
        
        for (let i = 1; i <= steps; i++) {
          // Niveau intermédiaire
          const intermediateLevel = this.PERF_LEVELS.LOW + i;
          const intermediateSettings = this._getLevelPreset(intermediateLevel);
          
          // Pause pour permettre au rendu de se stabiliser
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Appliquer le niveau intermédiaire
          await upgradeCallback(intermediateSettings, i, steps);
        }
      }
      
      return { success: true, finalSettings: targetSettings };
    } catch (error) {
      console.error('Erreur lors du chargement progressif:', error);
      return { 
        success: false, 
        error: error.message,
        // Rester avec les paramètres basse qualité en cas d'échec
        finalSettings: lowQualitySettings 
      };
    }
  }
  
  // ---------- Méthodes privées ----------
  
  /**
   * Détecte le niveau initial basé sur l'appareil et le navigateur
   * @returns {number} Niveau initial estimé
   * @private
   */
  _detectInitialLevel() {
    // Vérifier si on est sur mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Vérifier si c'est Safari (peut avoir des problèmes avec WebGL)
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    // Vérifier la mémoire disponible (si l'API est disponible)
    let memoryScore = 3; // Score moyen par défaut
    if (navigator.deviceMemory) {
      // deviceMemory donne la RAM en GB (0.25, 0.5, 1, 2, 4, 8)
      memoryScore = Math.min(6, Math.max(1, Math.floor(navigator.deviceMemory)));
    }
    
    // Vérifier le nombre de cœurs CPU (si disponible)
    let cpuScore = 3; // Score moyen par défaut
    if (navigator.hardwareConcurrency) {
      // Échelle proportionnelle jusqu'à 16 cœurs
      cpuScore = Math.min(6, Math.max(1, Math.floor(navigator.hardwareConcurrency / 2)));
    }
    
    // Vérifier la résolution de l'écran
    const pixelCount = window.screen.width * window.screen.height;
    const resolutionScore = Math.min(6, Math.max(1, Math.floor(pixelCount / (1280 * 720))));
    
    // Calculer le score initial
    let score = Math.round((memoryScore + cpuScore + resolutionScore) / 3);
    
    // Ajustements particuliers
    if (isMobile) score = Math.min(score, 4); // Plafonner les mobiles à HIGH (pas ULTRA)
    if (isSafari) score = Math.min(score, 3); // Safari peut avoir des problèmes avec les visualisations 3D avancées
    
    console.log(`Détection initiale: mobile=${isMobile}, safari=${isSafari}, mémoire=${memoryScore}, CPU=${cpuScore}, résolution=${resolutionScore}, score=${score}`);
    
    return score;
  }
  
  /**
   * Exécute un test de FPS pour mesurer les performances réelles
   * @returns {Promise<Object>} Résultats du test avec FPS moyen
   * @private
   */
  async _runFPSTest() {
    return new Promise((resolve) => {
      // Créer un élément canvas temporaire pour le test
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      canvas.style.position = 'absolute';
      canvas.style.left = '-9999px';  // Hors écran
      document.body.appendChild(canvas);
      
      const ctx = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!ctx) {
        document.body.removeChild(canvas);
        // Si WebGL n'est pas disponible, supposer des performances basses
        resolve({ avgFps: 15, framesCount: 0, supported: false });
        return;
      }
      
      let lastTime = performance.now();
      let frames = 0;
      let totalFps = 0;
      
      // Animation de test
      const testAnimation = () => {
        // Effacer le canvas
        ctx.clearColor(0.0, 0.0, 0.0, 1.0);
        ctx.clear(ctx.COLOR_BUFFER_BIT);
        
        // Dessiner un triangle (contenu simple pour le test)
        // (Code simplifié pour l'exemple)
        
        // Calculer le FPS
        const now = performance.now();
        const delta = now - lastTime;
        const fps = 1000 / delta;
        
        frames++;
        totalFps += fps;
        lastTime = now;
        
        // Continuer le test jusqu'à la durée spécifiée
        if (performance.now() - startTime < this.testDuration) {
          requestAnimationFrame(testAnimation);
        } else {
          // Test terminé
          document.body.removeChild(canvas);
          
          const avgFps = totalFps / frames;
          console.log(`Test FPS terminé: ${avgFps.toFixed(2)} FPS moyen sur ${frames} frames`);
          
          resolve({
            avgFps,
            framesCount: frames,
            duration: this.testDuration,
            supported: true
          });
        }
      };
      
      // Démarrer le test
      const startTime = performance.now();
      requestAnimationFrame(testAnimation);
    });
  }
  
  /**
   * Détermine le niveau de performance à partir des résultats du test FPS
   * @param {Object} fpsResult - Résultats du test FPS
   * @param {number} initialLevel - Niveau initial estimé
   * @returns {number} Niveau final déterminé
   * @private
   */
  _determineLevelFromFPS(fpsResult, initialLevel) {
    if (!fpsResult.supported) {
      // WebGL non supporté, utiliser le niveau minimum
      return this.PERF_LEVELS.ULTRA_LOW;
    }
    
    const { avgFps } = fpsResult;
    
    // Échelle progressive des FPS pour les différents niveaux
    if (avgFps < 20) return this.PERF_LEVELS.ULTRA_LOW;
    if (avgFps < 30) return this.PERF_LEVELS.LOW;
    if (avgFps < 40) return this.PERF_LEVELS.MEDIUM_LOW;
    if (avgFps < 50) return this.PERF_LEVELS.MEDIUM;
    if (avgFps < 55) return this.PERF_LEVELS.MEDIUM_HIGH;
    if (avgFps < 59) return this.PERF_LEVELS.HIGH;
    
    // Si les FPS sont excellents, considérer le niveau initial pour décider ULTRA_HIGH
    return avgFps >= 59 && initialLevel >= this.PERF_LEVELS.HIGH 
      ? this.PERF_LEVELS.ULTRA_HIGH 
      : this.PERF_LEVELS.HIGH;
  }
  
  /**
   * Ajuste le niveau en fonction de la mémoire et de la résolution
   * @param {number} level - Niveau à ajuster
   * @returns {number} Niveau ajusté
   * @private
   */
  _adjustForMemoryAndResolution(level) {
    // Ajustements supplémentaires basés sur la mémoire
    if (navigator.deviceMemory) {
      if (navigator.deviceMemory <= 2 && level > this.PERF_LEVELS.MEDIUM) {
        level = this.PERF_LEVELS.MEDIUM;
      }
      if (navigator.deviceMemory <= 1 && level > this.PERF_LEVELS.LOW) {
        level = this.PERF_LEVELS.LOW;
      }
    }
    
    // Ajustements basés sur la résolution d'écran
    const pixelCount = window.screen.width * window.screen.height;
    if (pixelCount > 2560 * 1440 && level < this.PERF_LEVELS.MEDIUM_HIGH) {
      // Écrans haute résolution ont besoin d'au moins MEDIUM_HIGH pour un bon rendu
      level = this.PERF_LEVELS.MEDIUM_HIGH;
    }
    
    // Protection contre les appareils à très haute résolution mais faibles performances
    if (pixelCount > 3840 * 2160 && navigator.deviceMemory && navigator.deviceMemory <= 4) {
      level = Math.min(level, this.PERF_LEVELS.MEDIUM_HIGH);
    }
    
    return level;
  }
  
  /**
   * Obtient le preset de qualité pour un niveau donné
   * @param {number} level - Niveau de performance
   * @returns {Object} Preset de qualité
   * @private
   */
  _getLevelPreset(level) {
    switch (level) {
      case this.PERF_LEVELS.ULTRA_LOW:
        return this.QUALITY_PRESETS.ULTRA_LOW;
      case this.PERF_LEVELS.LOW:
        return this.QUALITY_PRESETS.LOW;
      case this.PERF_LEVELS.MEDIUM_LOW:
        return this.QUALITY_PRESETS.MEDIUM_LOW;
      case this.PERF_LEVELS.MEDIUM:
        return this.QUALITY_PRESETS.MEDIUM;
      case this.PERF_LEVELS.MEDIUM_HIGH:
        return this.QUALITY_PRESETS.MEDIUM_HIGH;
      case this.PERF_LEVELS.HIGH:
        return this.QUALITY_PRESETS.HIGH;
      case this.PERF_LEVELS.ULTRA_HIGH:
        return this.QUALITY_PRESETS.ULTRA_HIGH;
      default:
        return this.QUALITY_PRESETS.MEDIUM;
    }
  }
  
  /**
   * Obtient le preset de qualité pour le niveau détecté actuel
   * @returns {Object} Preset de qualité
   * @private
   */
  _getQualityPreset() {
    return this._getLevelPreset(this.perfLevel || this.defaultLevel);
  }
  
  /**
   * Sauvegarde le résultat de la détection
   * @private
   */
  _saveDetectionResult() {
    localStorage.setItem(this.storageKey, JSON.stringify({
      detectedLevel: this.perfLevel,
      timestamp: Date.now(),
      userAgent: navigator.userAgent
    }));
  }
  
  /**
   * Sauvegarde les préférences utilisateur
   * @param {Object} settings - Paramètres à sauvegarder
   * @private
   */
  _saveUserSettings(settings) {
    const current = this._loadUserSettings() || {};
    localStorage.setItem(this.storageKey, JSON.stringify({
      ...current,
      ...settings,
      timestamp: Date.now()
    }));
  }
  
  /**
   * Charge les préférences utilisateur
   * @returns {Object|null} Paramètres sauvegardés ou null
   * @private
   */
  _loadUserSettings() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error('Erreur lors du chargement des préférences:', e);
      return null;
    }
  }
}

// Exporter une instance unique
const performanceDetector = new PerformanceDetector();
export default performanceDetector;
