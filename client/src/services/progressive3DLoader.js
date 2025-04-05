/**
 * Service de chargement progressif pour visualisations 3D
 * Optimise les performances en adaptant la qualité du rendu aux capacités de l'appareil
 * et en utilisant un chargement progressif des détails
 */
import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import featureFlagsService from './featureFlags';
import apiCacheService, { CACHE_STRATEGIES } from './apiCache';

// Niveaux de détail (LOD) pour le chargement progressif
const DETAIL_LEVELS = {
  ULTRA_LOW: 'ultra-low',   // Pour appareils très limités ou chargement initial
  LOW: 'low',               // Pour appareils mobiles bas de gamme
  MEDIUM: 'medium',         // Pour la plupart des mobiles et tablettes
  HIGH: 'high',             // Pour ordinateurs de bureau standard
  ULTRA: 'ultra'            // Pour ordinateurs puissants
};

// Paramètres pour chaque niveau de détail
const DETAIL_PARAMS = {
  [DETAIL_LEVELS.ULTRA_LOW]: {
    segmentCount: 10,       // Nombre de segments pour les courbes
    textureSize: 128,       // Taille des textures en pixels
    shadowsEnabled: false,  // Désactiver les ombres
    lightCount: 1,          // Nombre de sources lumineuses
    terrainResolution: 8,   // Résolution du terrain (1 = pleine résolution)
    maxVisibleElements: 20  // Nombre maximum d'éléments visibles
  },
  [DETAIL_LEVELS.LOW]: {
    segmentCount: 20,
    textureSize: 256,
    shadowsEnabled: false,
    lightCount: 2,
    terrainResolution: 4,
    maxVisibleElements: 50
  },
  [DETAIL_LEVELS.MEDIUM]: {
    segmentCount: 32,
    textureSize: 512,
    shadowsEnabled: true,
    lightCount: 2,
    terrainResolution: 2,
    maxVisibleElements: 100
  },
  [DETAIL_LEVELS.HIGH]: {
    segmentCount: 64,
    textureSize: 1024,
    shadowsEnabled: true,
    lightCount: 3,
    terrainResolution: 1,
    maxVisibleElements: 200
  },
  [DETAIL_LEVELS.ULTRA]: {
    segmentCount: 128,
    textureSize: 2048,
    shadowsEnabled: true,
    lightCount: 4,
    terrainResolution: 1,
    maxVisibleElements: 500
  }
};

// Tailles des textures optimisées pour mobile
const MOBILE_TEXTURE_SIZES = {
  thumbnail: 128,
  small: 256,
  medium: 512,
  large: 1024
};

// Seuils de mémoire pour les appareils mobiles (en Mo)
const MEMORY_THRESHOLDS = {
  critical: 150,  // Seuil critique - libération immédiate des ressources
  warning: 300,   // Seuil d'avertissement - réduire la qualité
  optimal: 500    // Seuil optimal - fonctionnement normal
};

// Géométries simplifiées pour remplacer les modèles complexes à distance
const SIMPLE_GEOMETRIES = {
  tree: new THREE.BoxGeometry(1, 2, 1),
  rock: new THREE.SphereGeometry(1, 4, 4),
  building: new THREE.BoxGeometry(1, 1, 1)
};

/**
 * Class principale pour le chargement progressif des visualisations 3D
 */
class Progressive3DLoader {
  constructor() {
    this.progressiveModeEnabled = true;
    this.currentDetailLevel = DETAIL_LEVELS.MEDIUM;
    this.deviceCapabilities = null;
    this.loadedModels = new Map();
    this.loadingProgress = {};
    this.worker = null;
    this.frustumCullingEnabled = true;
    this.lastRenderTime = 0;
    this.targetFrameRate = 30;
    this.renderTimeHistory = [];
    this.adaptiveQualityEnabled = true;
    this.isInitialized = false;
    this.texturePool = new Map(); // Pool de textures réutilisables
    this.activeRenderers = new Set(); // Ensemble des renderers actifs
    this.memoryMonitorInterval = null;
    this.contextLossHandled = false;
    this.lowMemoryMode = false;
    this.deviceMemory = null;
    this.isIOS = false;
    this.estimatedMemoryUsage = 0;
  }

  /**
   * Initialise le service de chargement progressif
   */
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Vérifier si le feature flag est activé
      const progressiveLoadingEnabled = featureFlagsService.isEnabled('enableProgressiveLoading3D');
      
      if (!progressiveLoadingEnabled) {
        console.info('Chargement progressif 3D désactivé via feature flags');
        this.progressiveModeEnabled = false;
        this.isInitialized = true;
        return;
      }
      
      // Détecter les capacités du dispositif
      await this.detectDeviceCapabilities();
      
      // Initialiser le Web Worker si supporté
      if (this.deviceCapabilities.webWorkerSupport) {
        this.initializeWebWorker();
      }
      
      // Initialiser les gestionnaires d'événements pour la perte de contexte WebGL
      this.setupContextLossHandlers();
      
      // Configurer la surveillance de la mémoire pour les appareils mobiles
      if (this.deviceCapabilities.isMobile) {
        this.setupMemoryMonitoring();
      }
      
      console.info('Service de chargement progressif 3D initialisé', {
        detailLevel: this.currentDetailLevel,
        adaptiveQuality: this.adaptiveQualityEnabled,
        webWorker: this.worker !== null,
        deviceMemory: this.deviceMemory,
        isMobile: this.deviceCapabilities.isMobile,
        isIOS: this.isIOS
      });
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du chargement progressif 3D:', error);
      // Fallback au mode standard en cas d'erreur
      this.progressiveModeEnabled = false;
      this.isInitialized = true;
    }
  }

  /**
   * Détecte les capacités du dispositif utilisé
   */
  async detectDeviceCapabilities() {
    this.deviceCapabilities = {
      webWorkerSupport: typeof Worker !== 'undefined',
      webGLVersion: 1,
      maxTextureSize: 2048,
      anisotropySupport: false,
      maxAnisotropy: 1,
      isMobile: false,
      devicePixelRatio: window.devicePixelRatio || 1
    };
    
    // Détection des plateformes mobiles
    this.deviceCapabilities.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    // Détection de la mémoire disponible (si supportée)
    if (navigator.deviceMemory) {
      this.deviceMemory = navigator.deviceMemory;
    } else {
      // Estimation basée sur l'agent utilisateur
      this.deviceMemory = this.deviceCapabilities.isMobile ? 2 : 8;
    }
    
    try {
      // Créer un canvas temporaire pour tester les capacités WebGL
      const canvas = document.createElement('canvas');
      let gl = canvas.getContext('webgl2');
      
      if (gl) {
        this.deviceCapabilities.webGLVersion = 2;
      } else {
        gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        this.deviceCapabilities.webGLVersion = gl ? 1 : 0;
      }
      
      if (gl) {
        // Détecter la taille maximale de texture
        this.deviceCapabilities.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
        
        // Détecter le support d'anisotropie
        const ext = gl.getExtension('EXT_texture_filter_anisotropic') || 
                    gl.getExtension('MOZ_EXT_texture_filter_anisotropic') || 
                    gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');
        
        if (ext) {
          this.deviceCapabilities.anisotropySupport = true;
          this.deviceCapabilities.maxAnisotropy = gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
        }
        
        // Libérer les ressources du contexte temporaire
        const loseContext = gl.getExtension('WEBGL_lose_context');
        if (loseContext) {
          loseContext.loseContext();
        }
      }
      
      // Définir le niveau de détail approprié en fonction des capacités détectées
      if (this.deviceCapabilities.isMobile) {
        if (this.deviceMemory <= 2) {
          this.currentDetailLevel = DETAIL_LEVELS.LOW;
        } else {
          this.currentDetailLevel = DETAIL_LEVELS.MEDIUM;
        }
        
        // Activer automatiquement le frustum culling sur mobile
        this.frustumCullingEnabled = true;
      } else {
        if (this.deviceCapabilities.webGLVersion >= 2) {
          this.currentDetailLevel = DETAIL_LEVELS.HIGH;
        } else {
          this.currentDetailLevel = DETAIL_LEVELS.MEDIUM;
        }
      }
      
    } catch (error) {
      console.error('Erreur lors de la détection des capacités WebGL:', error);
      this.currentDetailLevel = DETAIL_LEVELS.LOW;
    }
    
    return this.deviceCapabilities;
  }

  /**
   * Unload d'un modèle et libération des ressources WebGL associées
   * @param {string} modelId Identifiant du modèle
   */
  unloadModel(modelId) {
    const model = this.loadedModels.get(modelId);
    
    if (model) {
      // Libération améliorée des ressources Three.js
      if (model.geometry) {
        model.geometry.dispose();
      }
      
      // Libérer les textures et matériaux
      if (model.material) {
        if (Array.isArray(model.material)) {
          model.material.forEach(material => this.disposeMaterial(material));
        } else {
          this.disposeMaterial(model.material);
        }
      }
      
      // Libérer les animations et mixers s'ils existent
      if (model.animations && model.mixer) {
        model.mixer.stopAllAction();
        model.mixer.uncacheRoot(model);
      }
      
      // Libérer les enfants récursivement
      if (model.children) {
        model.children.forEach(child => {
          this.disposeObject3D(child);
        });
      }
      
      // Supprimer de la scène si ajouté
      if (model.parent) {
        model.parent.remove(model);
      }
      
      this.loadedModels.delete(modelId);
      
      // Mettre à jour l'estimation de la mémoire
      this.updateMemoryUsage();
      
      console.info(`Modèle ${modelId} déchargé et ressources libérées`);
    }
  }

  /**
   * Libère les ressources d'un matériau
   * @param {THREE.Material} material Le matériau à libérer
   */
  disposeMaterial(material) {
    if (!material) return;
    
    // Libérer les textures
    for (const propertyName in material) {
      const property = material[propertyName];
      if (property && property.isTexture) {
        // Si la texture est dans le pool, la marquer comme disponible
        if (this.texturePool.has(property.uuid)) {
          const poolEntry = this.texturePool.get(property.uuid);
          poolEntry.inUse = false;
        } else {
          // Sinon, libérer complètement
          property.dispose();
        }
      }
    }
    
    // Libérer le matériau lui-même
    material.dispose();
  }

  /**
   * Dispose récursivement un Object3D et toutes ses ressources
   * @param {THREE.Object3D} object L'objet à libérer
   */
  disposeObject3D(object) {
    if (!object) return;
    
    // Traiter les enfants de manière récursive
    if (object.children && object.children.length > 0) {
      // Créer une copie du tableau pour éviter les problèmes de modification pendant l'itération
      const children = [...object.children];
      children.forEach(child => {
        this.disposeObject3D(child);
        object.remove(child);
      });
    }
    
    // Libérer la géométrie
    if (object.geometry) {
      object.geometry.dispose();
    }
    
    // Libérer le matériau
    if (object.material) {
      if (Array.isArray(object.material)) {
        object.material.forEach(material => this.disposeMaterial(material));
      } else {
        this.disposeMaterial(object.material);
      }
    }
  }

  /**
   * Mise en place des gestionnaires pour la perte de contexte WebGL
   */
  setupContextLossHandlers() {
    // Enregistrer une fonction pour traiter la perte de contexte WebGL
    window.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      this.contextLossHandled = true;
      console.warn('Contexte WebGL perdu, tentative de récupération...');
      
      // Arrêter tous les rendus 3D en cours
      this.activeRenderers.forEach(renderer => {
        renderer.forceContextLoss();
      });
      
      // Passer en mode basse mémoire
      this.lowMemoryMode = true;
      this.currentDetailLevel = DETAIL_LEVELS.ULTRA_LOW;
      
      // Notifier l'application de la perte de contexte
      document.dispatchEvent(new CustomEvent('webgl-context-lost'));
    }, false);
    
    // Gestionnaire pour la restauration du contexte
    window.addEventListener('webglcontextrestored', () => {
      console.info('Contexte WebGL restauré');
      this.contextLossHandled = false;
      
      // Réinitialiser les renderers
      this.activeRenderers.forEach(renderer => {
        renderer.resetState();
      });
      
      // Réinitialiser les textures et matériaux si nécessaire
      this.rebuildTextures();
      
      // Notifier l'application de la restauration du contexte
      document.dispatchEvent(new CustomEvent('webgl-context-restored'));
    }, false);
  }

  /**
   * Surveille l'utilisation de la mémoire sur les appareils mobiles
   */
  setupMemoryMonitoring() {
    // Nettoyer l'ancien interval si existant
    if (this.memoryMonitorInterval) {
      clearInterval(this.memoryMonitorInterval);
    }
    
    // Établir un intervalle pour vérifier la mémoire
    this.memoryMonitorInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, 30000); // Vérifier toutes les 30 secondes
    
    // Ajouter des gestionnaires pour les événements de visibilité de page
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // L'utilisateur a quitté la page, libérer les ressources non essentielles
        this.releaseNonEssentialResources();
      } else {
        // L'utilisateur est revenu, vérifier la mémoire
        this.checkMemoryUsage();
      }
    });
  }

  /**
   * Vérifier l'utilisation de la mémoire et prendre des mesures si nécessaire
   */
  checkMemoryUsage() {
    // Estimation de l'utilisation de la mémoire
    this.updateMemoryUsage();
    
    // Vérifier les performances du système
    const performanceNow = performance.now();
    const memoryUsageMB = this.estimatedMemoryUsage / (1024 * 1024);
    
    console.debug(`Utilisation estimée de la mémoire 3D: ${memoryUsageMB.toFixed(2)} MB`);
    
    // Mesures basées sur l'utilisation de la mémoire
    if (memoryUsageMB > MEMORY_THRESHOLDS.critical) {
      console.warn(`Utilisation critique de la mémoire: ${memoryUsageMB.toFixed(2)} MB`);
      this.handleCriticalMemory();
    } else if (memoryUsageMB > MEMORY_THRESHOLDS.warning) {
      console.warn(`Avertissement mémoire: ${memoryUsageMB.toFixed(2)} MB`);
      this.decreaseQuality();
      this.releaseNonEssentialResources();
    } else if (memoryUsageMB < MEMORY_THRESHOLDS.optimal && this.lowMemoryMode) {
      // Si nous sommes en dessous du seuil optimal et en mode basse mémoire,
      // nous pouvons revenir à un mode normal
      this.lowMemoryMode = false;
      if (this.adaptiveQualityEnabled) {
        this.increaseQuality();
      }
    }
  }

  /**
   * Gestion du cas critique de mémoire - libérer immédiatement les ressources
   */
  handleCriticalMemory() {
    this.lowMemoryMode = true;
    
    // Réduire drastiquement la qualité
    this.currentDetailLevel = DETAIL_LEVELS.ULTRA_LOW;
    
    // Libérer les modèles non essentiels
    this.unloadNonVisibleModels();
    
    // Vider le pool de textures
    this.clearTexturePool();
    
    // Forcer la libération de la mémoire si supporté
    if (window.gc) window.gc();
    
    // Notifier l'application pour qu'elle prenne des mesures supplémentaires
    document.dispatchEvent(new CustomEvent('webgl-memory-critical'));
  }

  /**
   * Libération des ressources non essentielles
   */
  releaseNonEssentialResources() {
    // Libérer les textures non utilisées
    this.cleanupTexturePool();
    
    // Libérer les modèles en cache mais non visibles
    this.unloadNonVisibleModels();
  }

  /**
   * Décharger les modèles qui ne sont pas actuellement visibles
   */
  unloadNonVisibleModels() {
    const visibleModelIds = new Set();
    
    // Obtenir les IDs des modèles actuellement visibles (ceci est une simulation, 
    // l'implémentation réelle dépendrait de comment la visibilité est gérée)
    document.querySelectorAll('[data-model-visible="true"]').forEach(el => {
      const modelId = el.dataset.modelId;
      if (modelId) visibleModelIds.add(modelId);
    });
    
    // Décharger les modèles non visibles
    this.loadedModels.forEach((model, modelId) => {
      if (!visibleModelIds.has(modelId)) {
        this.unloadModel(modelId);
      }
    });
  }

  /**
   * Mise à jour de l'estimation de l'utilisation de la mémoire
   */
  updateMemoryUsage() {
    let totalMemoryUsage = 0;
    
    // Calculer la mémoire utilisée par les géométries
    this.loadedModels.forEach(model => {
      if (model.geometry) {
        // Estimation de la taille de la géométrie
        if (model.geometry.attributes) {
          for (const name in model.geometry.attributes) {
            const attribute = model.geometry.attributes[name];
            if (attribute.array) {
              totalMemoryUsage += attribute.array.byteLength || 0;
            }
          }
        }
      }
      
      // Estimation de la taille des textures
      if (model.material) {
        const materials = Array.isArray(model.material) ? model.material : [model.material];
        materials.forEach(material => {
          for (const prop in material) {
            const texture = material[prop];
            if (texture && texture.isTexture && texture.image) {
              const width = texture.image.width || 0;
              const height = texture.image.height || 0;
              // Estimation de 4 octets par pixel (RGBA)
              totalMemoryUsage += width * height * 4;
            }
          }
        });
      }
    });
    
    // Ajouter la mémoire utilisée par le pool de textures
    this.texturePool.forEach(entry => {
      const texture = entry.texture;
      if (texture && texture.image) {
        const width = texture.image.width || 0;
        const height = texture.image.height || 0;
        totalMemoryUsage += width * height * 4;
      }
    });
    
    this.estimatedMemoryUsage = totalMemoryUsage;
    return totalMemoryUsage;
  }

  /**
   * Gestion d'un pool de textures pour la réutilisation
   * @param {string} url URL de la texture
   * @param {object} options Options de la texture
   * @returns {THREE.Texture} Texture du pool ou nouvelle texture
   */
  getTextureFromPool(url, options = {}) {
    // Rechercher une texture disponible dans le pool
    for (const [uuid, entry] of this.texturePool.entries()) {
      if (!entry.inUse && entry.url === url) {
        entry.inUse = true;
        return entry.texture;
      }
    }
    
    // Si aucune texture n'est disponible, en créer une nouvelle
    const texture = new THREE.TextureLoader().load(url);
    
    // Appliquer les options
    if (options.anisotropy && this.deviceCapabilities.anisotropySupport) {
      texture.anisotropy = Math.min(
        options.anisotropy,
        this.deviceCapabilities.maxAnisotropy
      );
    }
    
    // Ajouter au pool
    this.texturePool.set(texture.uuid, {
      texture,
      url,
      inUse: true,
      lastUsed: Date.now()
    });
    
    return texture;
  }

  /**
   * Nettoyage des textures non utilisées dans le pool
   */
  cleanupTexturePool() {
    const now = Date.now();
    const unusedTimeout = 60000; // 1 minute
    
    for (const [uuid, entry] of this.texturePool.entries()) {
      if (!entry.inUse && (now - entry.lastUsed > unusedTimeout)) {
        entry.texture.dispose();
        this.texturePool.delete(uuid);
      }
    }
  }

  /**
   * Vider complètement le pool de textures
   */
  clearTexturePool() {
    for (const [uuid, entry] of this.texturePool.entries()) {
      entry.texture.dispose();
    }
    this.texturePool.clear();
  }

  /**
   * Reconstruire les textures après une perte de contexte
   */
  rebuildTextures() {
    // Recréer les textures qui étaient en utilisation
    const texturesToRebuild = new Map();
    
    // Collecter les textures qui doivent être reconstruites
    this.texturePool.forEach((entry, uuid) => {
      if (entry.inUse) {
        texturesToRebuild.set(uuid, {
          url: entry.url,
          options: entry.options
        });
      }
    });
    
    // Vider le pool actuel
    this.clearTexturePool();
    
    // Reconstruire les textures nécessaires
    texturesToRebuild.forEach((info, uuid) => {
      const texture = this.getTextureFromPool(info.url, info.options);
      
      // Mettre à jour les références dans les matériaux si nécessaire
      this.loadedModels.forEach(model => {
        if (model.material) {
          const materials = Array.isArray(model.material) ? model.material : [model.material];
          materials.forEach(material => {
            for (const prop in material) {
              if (material[prop] && material[prop].isTexture && material[prop].uuid === uuid) {
                material[prop] = texture;
              }
            }
          });
        }
      });
    });
  }

  /**
   * Enregistre un renderer pour surveillance
   * @param {THREE.WebGLRenderer} renderer Le renderer à surveiller
   */
  registerRenderer(renderer) {
    if (renderer && !this.activeRenderers.has(renderer)) {
      this.activeRenderers.add(renderer);
      
      // Configurer le renderer pour optimiser les performances mobiles
      if (this.deviceCapabilities.isMobile) {
        renderer.setPixelRatio(Math.min(this.deviceCapabilities.devicePixelRatio, 2));
        renderer.shadowMap.enabled = this.currentDetailLevel !== DETAIL_LEVELS.ULTRA_LOW && 
                                     this.currentDetailLevel !== DETAIL_LEVELS.LOW;
        renderer.shadowMap.autoUpdate = false; // Mettre à jour manuellement pour économiser des ressources
      }
    }
  }

  /**
   * Désenregistre un renderer
   * @param {THREE.WebGLRenderer} renderer Le renderer à désenregistrer
   */
  unregisterRenderer(renderer) {
    if (renderer && this.activeRenderers.has(renderer)) {
      this.activeRenderers.delete(renderer);
    }
  }

  /**
   * Optimise les géométries pour les appareils mobiles
   * @param {THREE.BufferGeometry} geometry La géométrie à optimiser
   * @returns {THREE.BufferGeometry} La géométrie optimisée
   */
  optimizeGeometryForMobile(geometry) {
    if (!geometry || !this.deviceCapabilities.isMobile) return geometry;
    
    // Créer une copie de la géométrie
    const optimized = geometry.clone();
    
    // Réduire la complexité pour les appareils mobiles
    if (this.currentDetailLevel === DETAIL_LEVELS.ULTRA_LOW || this.currentDetailLevel === DETAIL_LEVELS.LOW) {
      // Utiliser Three.js BufferGeometryUtils pour simplifier la géométrie
      if (mergeVertices) {
        return mergeVertices(optimized, 0.01);
      }
    }
    
    return optimized;
  }

  /**
   * Libère toutes les ressources
   */
  dispose() {
    // Arrêter le Web Worker
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    
    // Arrêter la surveillance de la mémoire
    if (this.memoryMonitorInterval) {
      clearInterval(this.memoryMonitorInterval);
      this.memoryMonitorInterval = null;
    }
    
    // Libérer tous les modèles et leurs ressources
    this.loadedModels.forEach((model, modelId) => {
      this.unloadModel(modelId);
    });
    
    // Libérer les géométries simplifiées
    for (const key in SIMPLE_GEOMETRIES) {
      if (SIMPLE_GEOMETRIES[key]) {
        SIMPLE_GEOMETRIES[key].dispose();
      }
    }
    
    // Vider le pool de textures
    this.clearTexturePool();
    
    // Désenregistrer tous les renderers
    this.activeRenderers.clear();
    
    // Vider le cache en mémoire
    this.loadedModels.clear();
    
    // Réinitialiser l'état
    this.loadingProgress = {};
    this.renderTimeHistory = [];
    this.isInitialized = false;
    this.contextLossHandled = false;
    this.lowMemoryMode = false;
    
    // Forcer la collecte des déchets (suggestion pour le navigateur)
    if (window.gc) {
      window.gc();
    }
    
    console.info('Service de chargement progressif 3D libéré et ressources WebGL nettoyées');
  }
}

// Créer une instance singleton du service
const progressive3DLoader = new Progressive3DLoader();

export { DETAIL_LEVELS, MOBILE_TEXTURE_SIZES };
export default progressive3DLoader;
