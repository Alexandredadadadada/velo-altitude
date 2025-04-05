/**
 * Gestionnaire de niveaux de détail adaptatifs pour les modèles 3D
 * Optimise les performances en ajustant automatiquement la qualité des modèles
 * selon les capacités de l'appareil et la distance à la caméra
 */

import * as THREE from 'three';
import deviceCapabilityDetector from './deviceCapabilityDetector';
import threeDConfigManager from './threeDConfigManager';

// Moniteur FPS simple pour mesurer les performances en temps réel
class FPSMonitor {
  constructor(sampleSize = 60) {
    this.frameTimes = [];
    this.lastFrameTime = 0;
    this.sampleSize = sampleSize;
    this.currentFPS = 60;
  }

  update() {
    const now = performance.now();
    if (this.lastFrameTime) {
      const delta = now - this.lastFrameTime;
      this.frameTimes.push(delta);
      
      // Limiter la taille de l'échantillon
      if (this.frameTimes.length > this.sampleSize) {
        this.frameTimes.shift();
      }
      
      // Calculer la moyenne des FPS
      if (this.frameTimes.length > 0) {
        const averageDelta = this.frameTimes.reduce((sum, time) => sum + time, 0) / this.frameTimes.length;
        this.currentFPS = Math.round(1000 / averageDelta);
      }
    }
    this.lastFrameTime = now;
    return this.currentFPS;
  }

  getFPS() {
    return this.currentFPS;
  }

  reset() {
    this.frameTimes = [];
    this.lastFrameTime = 0;
    this.currentFPS = 60;
  }
}

/**
 * Gestionnaire de niveaux de détail adaptatifs
 */
class AdaptiveLODManager {
  constructor(options = {}) {
    // Détecter les capacités de l'appareil
    this.device = this._detectDeviceCapabilities();
    this.models = new Map();
    
    // Seuils pour les changements de LOD
    this.thresholds = options.thresholds || {
      high: { distance: 50, fps: 45 },
      medium: { distance: 150, fps: 30 },
      low: { distance: 300, fps: 20 }
    };
    
    // Moniteur de performance
    this.fpsMonitor = new FPSMonitor();
    this.currentFps = 60;
    
    // Mettre à jour la lecture FPS toutes les secondes
    this.fpsUpdateInterval = setInterval(() => {
      this.currentFps = this.fpsMonitor.getFPS();
    }, 1000);
    
    // État du gestionnaire
    this.enabled = true;
    
    // Récupérer les configurations 3D actuelles
    this.configManager = threeDConfigManager;
    
    // Debug
    this.debug = options.debug || false;
    
    console.log('AdaptiveLODManager initialized:', {
      device: this.device,
      initialFps: this.currentFps
    });
  }

  /**
   * Enregistre un modèle avec ses différents niveaux de détail
   * @param {string} modelId Identifiant unique du modèle
   * @param {Object} lodLevels Niveaux de détail ({high, medium, low})
   * @returns {string} ID du modèle enregistré
   */
  registerModel(modelId, lodLevels) {
    if (!lodLevels.high || !lodLevels.medium || !lodLevels.low) {
      throw new Error(`Le modèle ${modelId} doit avoir des niveaux high, medium et low`);
    }
    
    this.models.set(modelId, {
      levels: lodLevels,
      currentLevel: this._getInitialLODLevel(),
      loaded: { high: false, medium: false, low: false },
      visible: false,
      distance: Infinity
    });
    
    // Marquer le niveau initial comme chargé
    const initialLevel = this._getInitialLODLevel();
    this.models.get(modelId).loaded[initialLevel] = true;
    
    // Précharger les niveaux appropriés selon les capacités de l'appareil
    this._preloadLevels(modelId);
    
    if (this.debug) {
      console.log(`Model registered: ${modelId} with initial level: ${initialLevel}`);
    }
    
    return modelId;
  }

  /**
   * Récupère le modèle approprié pour le rendu
   * @param {string} modelId ID du modèle
   * @param {number} distance Distance à la caméra
   * @returns {Object} Modèle 3D pour le niveau de détail approprié
   */
  getModelForRendering(modelId, distance) {
    if (!this.models.has(modelId)) {
      throw new Error(`Modèle ${modelId} non enregistré`);
    }
    
    const modelInfo = this.models.get(modelId);
    modelInfo.distance = distance;
    
    // Si la gestion de LOD est désactivée, utiliser toujours le niveau initial
    if (!this.enabled) {
      return modelInfo.levels[this._getInitialLODLevel()];
    }
    
    const newLevel = this._determineLODLevel(distance);
    
    // Si le niveau a changé et que le nouveau niveau est chargé, mettre à jour le niveau actuel
    if (newLevel !== modelInfo.currentLevel && modelInfo.loaded[newLevel]) {
      if (this.debug) {
        console.log(`Model ${modelId} LOD changed: ${modelInfo.currentLevel} -> ${newLevel} (distance: ${Math.round(distance)})`);
      }
      modelInfo.currentLevel = newLevel;
    }
    
    // Marquer comme visible pour le préchargeur
    modelInfo.visible = true;
    
    // Retourner le modèle du niveau actuel
    return modelInfo.levels[modelInfo.currentLevel];
  }

  /**
   * Mettre à jour les modèles (à appeler dans la boucle de rendu)
   * @param {THREE.Camera} camera Caméra pour calculer les distances
   */
  update(camera) {
    // Mettre à jour le moniteur FPS
    this.fpsMonitor.update();
    
    // Récupérer la configuration 3D actuelle
    const config = this.configManager.getConfig();
    
    // Ajuster les modèles visibles en fonction de la distance et des FPS
    for (const [modelId, modelInfo] of this.models.entries()) {
      if (modelInfo.visible) {
        // Obtenir le modèle du niveau actuel
        const model = modelInfo.levels[modelInfo.currentLevel];
        if (!model || !model.position) continue;
        
        // Calculer la distance à la caméra
        const distance = camera.position.distanceTo(model.position);
        modelInfo.distance = distance;
        
        // Vérifier si nous devons changer de LOD en fonction de la distance et des FPS
        const newLevel = this._determineLODLevel(distance);
        if (newLevel !== modelInfo.currentLevel && modelInfo.loaded[newLevel]) {
          if (this.debug) {
            console.log(`Update: Model ${modelId} LOD changed: ${modelInfo.currentLevel} -> ${newLevel} (distance: ${Math.round(distance)}, FPS: ${this.currentFps})`);
          }
          modelInfo.currentLevel = newLevel;
        }
        
        // Réinitialiser le drapeau de visibilité pour la prochaine frame
        modelInfo.visible = false;
      }
    }
    
    // Précharger des niveaux supplémentaires si les performances le permettent
    this._updatePreloading();
  }

  /**
   * Active ou désactive le gestionnaire de LOD
   * @param {boolean} enabled État d'activation
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    
    if (this.debug) {
      console.log(`AdaptiveLODManager ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    // Si désactivé, revenir au niveau initial pour tous les modèles
    if (!enabled) {
      const initialLevel = this._getInitialLODLevel();
      for (const [modelId, modelInfo] of this.models.entries()) {
        modelInfo.currentLevel = initialLevel;
      }
    }
  }

  /**
   * Force un niveau de détail spécifique pour tous les modèles
   * @param {string} level Niveau de détail à forcer ('high', 'medium', 'low')
   */
  forceLODLevel(level) {
    if (!['high', 'medium', 'low'].includes(level)) {
      console.error(`Niveau LOD invalide: ${level}`);
      return;
    }
    
    for (const [modelId, modelInfo] of this.models.entries()) {
      if (modelInfo.loaded[level]) {
        modelInfo.currentLevel = level;
      }
    }
    
    if (this.debug) {
      console.log(`Forced LOD level for all models: ${level}`);
    }
  }

  /**
   * Détecte les capacités de l'appareil
   * @private
   * @returns {string} Type d'appareil détecté
   */
  _detectDeviceCapabilities() {
    const capabilities = deviceCapabilityDetector.getCapabilities();
    const isMobile = capabilities.flags.isMobile;
    const performanceLevel = capabilities.performanceLevel;
    
    if (isMobile) {
      return performanceLevel >= 3 ? 'mobile-high' : 'mobile-low';
    } else {
      if (performanceLevel >= 5) return 'desktop-high';
      if (performanceLevel >= 3) return 'desktop-medium';
      return 'desktop-low';
    }
  }

  /**
   * Détermine le niveau de détail initial en fonction des capacités de l'appareil
   * @private
   * @returns {string} Niveau de détail initial ('high', 'medium', 'low')
   */
  _getInitialLODLevel() {
    // Utiliser la configuration du gestionnaire 3D si disponible
    const config = this.configManager.getConfig();
    const quality = config.cyclistDetail || 'medium';
    
    // Mapper la qualité du cycliste au niveau LOD
    const qualityToLOD = {
      'ultra': 'high',
      'high': 'high',
      'medium': 'medium',
      'low': 'low'
    };
    
    return qualityToLOD[quality] || 'medium';
  }

  /**
   * Détermine le niveau de détail approprié en fonction de la distance et des performances
   * @private
   * @param {number} distance Distance à la caméra
   * @returns {string} Niveau de détail approprié ('high', 'medium', 'low')
   */
  _determineLODLevel(distance) {
    // Vérifier d'abord les seuils de distance
    if (distance < this.thresholds.high.distance) {
      // Pour les objets proches, vérifier si les performances sont suffisantes pour un détail élevé
      if (this.currentFps >= this.thresholds.high.fps) {
        return 'high';
      } else {
        return 'medium';
      }
    } else if (distance < this.thresholds.medium.distance) {
      // Pour les distances moyennes, vérifier si nous devons passer à un faible détail
      if (this.currentFps < this.thresholds.low.fps) {
        return 'low';
      } else {
        return 'medium';
      }
    } else {
      // Pour les objets éloignés, toujours utiliser un faible détail
      return 'low';
    }
  }

  /**
   * Précharge les niveaux de détail en fonction des capacités de l'appareil
   * @private
   * @param {string} modelId ID du modèle à précharger
   */
  _preloadLevels(modelId) {
    const modelInfo = this.models.get(modelId);
    const initialLevel = modelInfo.currentLevel;
    
    // Déterminer les autres niveaux à précharger en fonction de l'appareil
    let preloadQueue = [];
    
    switch (this.device) {
      case 'desktop-high':
        // Précharger tous les niveaux pour les ordinateurs haut de gamme
        preloadQueue = ['high', 'medium', 'low'].filter(level => level !== initialLevel);
        break;
      case 'desktop-medium':
        // Précharger les niveaux moyen et bas pour les ordinateurs de milieu de gamme
        preloadQueue = ['medium', 'low'].filter(level => level !== initialLevel);
        break;
      default:
        // Ne précharger que le niveau bas pour tout le reste si ce n'est pas déjà chargé
        if (initialLevel !== 'low') preloadQueue = ['low'];
        break;
    }
    
    if (this.debug && preloadQueue.length > 0) {
      console.log(`Preloading levels for model ${modelId}:`, preloadQueue);
    }
    
    // Commencer le préchargement en arrière-plan
    for (const level of preloadQueue) {
      this._loadModelLevel(modelId, level);
    }
  }

  /**
   * Charge un niveau de détail spécifique pour un modèle
   * @private
   * @param {string} modelId ID du modèle
   * @param {string} level Niveau de détail à charger
   */
  async _loadModelLevel(modelId, level) {
    const modelInfo = this.models.get(modelId);
    
    // Si déjà chargé, ignorer
    if (modelInfo.loaded[level]) return;
    
    try {
      if (this.debug) {
        console.log(`Started loading ${level} LOD for model ${modelId}`);
      }
      
      // Marquer comme chargé (dans une implémentation réelle, ce serait après le chargement effectif)
      // Dans ce cas, nous supposons que les niveaux ont déjà été chargés dans les objets levels
      modelInfo.loaded[level] = true;
      
      if (this.debug) {
        console.log(`Completed loading ${level} LOD for model ${modelId}`);
      }
    } catch (error) {
      console.error(`Failed to load ${level} LOD for model ${modelId}:`, error);
    }
  }

  /**
   * Met à jour le préchargement des modèles en fonction des performances actuelles
   * @private
   */
  _updatePreloading() {
    // Si les performances sont bonnes, précharger d'autres niveaux
    if (this.currentFps > this.thresholds.high.fps) {
      for (const [modelId, modelInfo] of this.models.entries()) {
        // Précharger le niveau élevé pour les modèles les plus proches
        if (modelInfo.distance < this.thresholds.high.distance * 2 && !modelInfo.loaded.high) {
          this._loadModelLevel(modelId, 'high');
        }
      }
    }
  }

  /**
   * Nettoie les ressources utilisées par le gestionnaire
   */
  dispose() {
    clearInterval(this.fpsUpdateInterval);
    this.fpsMonitor.reset();
    this.models.clear();
    
    if (this.debug) {
      console.log('AdaptiveLODManager disposed');
    }
  }
}

// Exporter une instance singleton
const adaptiveLODManager = new AdaptiveLODManager();
export default adaptiveLODManager;
