/**
 * Service d'optimisation des visualisations 3D des cols pour Dashboard-Velo
 * Optimisé pour les performances à l'échelle européenne
 */

const path = require('path');
const fs = require('fs').promises;
const { performance } = require('perf_hooks');
const logger = require('../utils/logger');
const config = require('../config');
const { getInstance: getCacheInstance } = require('../utils/distributed-cache');

// Import différé pour éviter les dépendances circulaires
let apiManager;
setTimeout(() => {
  apiManager = require('./api-manager.service');
}, 0);

/**
 * Classe Col3DService
 * Gère l'optimisation des visualisations 3D des cols pour Dashboard-Velo
 */
class Col3DService {
  constructor() {
    this.cache = getCacheInstance();
    this.baseDataPath = path.join(__dirname, '../data/cols-3d');
    this.meshResolutions = {
      high: { triangles: 50000, textureSize: 2048 },
      medium: { triangles: 25000, textureSize: 1024 },
      low: { triangles: 10000, textureSize: 512 },
      minimal: { triangles: 5000, textureSize: 256 }
    };
    
    // Précharger les données de base au démarrage
    this.preloadBasicData();
  }

  /**
   * Précharge les données de base des visualisations 3D
   */
  async preloadBasicData() {
    try {
      logger.info('Préchargement des données de base des visualisations 3D');
      
      // Précharger les données de base des cols populaires
      const popularColsFile = path.join(this.baseDataPath, 'popular-cols.json');
      const popularColsData = await fs.readFile(popularColsFile, 'utf8');
      const popularCols = JSON.parse(popularColsData);
      
      for (const col of popularCols) {
        const cacheKey = `col3d:basic:${col.id}`;
        await this.cache.set(cacheKey, col, { 
          ttl: 86400 * 7, // 7 jours
          localOnly: false
        });
      }
      
      logger.info(`${popularCols.length} cols populaires préchargés pour les visualisations 3D`);
    } catch (error) {
      logger.error(`Erreur lors du préchargement des données 3D: ${error.message}`, { error });
    }
  }

  /**
   * Récupère les données 3D optimisées pour un col spécifique
   * @param {string} colId - ID du col
   * @param {Object} options - Options de visualisation
   * @param {string} options.resolution - Résolution du maillage (high, medium, low, minimal)
   * @param {string} options.region - Région européenne
   * @param {string} options.device - Type d'appareil (desktop, tablet, mobile)
   * @param {boolean} options.withTextures - Inclure les textures
   * @param {boolean} options.withAnimation - Inclure les données d'animation
   * @returns {Promise<Object>} Données 3D optimisées
   */
  async getCol3DData(colId, options = {}) {
    const startTime = performance.now();
    
    try {
      // Paramètres par défaut
      const resolution = options.resolution || this.determineOptimalResolution(options.device);
      const withTextures = options.withTextures !== false;
      const withAnimation = options.withAnimation !== false;
      const region = options.region || 'western';
      
      // Générer la clé de cache
      const cacheKey = this.generateCacheKey(colId, resolution, withTextures, withAnimation);
      
      // Vérifier le cache
      const cachedData = await this.cache.get(cacheKey);
      if (cachedData) {
        logger.debug(`Données 3D pour le col ${colId} récupérées depuis le cache`);
        return cachedData;
      }
      
      // Récupérer les données de base du col
      const basicData = await this.getBasicColData(colId);
      if (!basicData) {
        throw new Error(`Col ${colId} non trouvé`);
      }
      
      // Récupérer et optimiser le maillage 3D
      const meshData = await this.getMeshData(colId, resolution);
      
      // Récupérer les textures si nécessaire
      let textureData = null;
      if (withTextures) {
        textureData = await this.getTextureData(colId, resolution, region);
      }
      
      // Récupérer les données d'animation si nécessaire
      let animationData = null;
      if (withAnimation) {
        animationData = await this.getAnimationData(colId);
      }
      
      // Assembler les données complètes
      const col3DData = {
        id: colId,
        name: basicData.name,
        region: basicData.region,
        elevation: basicData.elevation,
        length: basicData.length,
        gradient: basicData.gradient,
        mesh: meshData,
        textures: textureData,
        animation: animationData,
        metadata: {
          resolution,
          optimizedFor: options.device || 'desktop',
          generatedAt: new Date().toISOString()
        }
      };
      
      // Mettre en cache les données
      const ttl = resolution === 'high' ? 86400 : 86400 * 3; // 1 jour pour haute résolution, 3 jours pour les autres
      await this.cache.set(cacheKey, col3DData, { 
        ttl,
        region,
        localOnly: false
      });
      
      const duration = performance.now() - startTime;
      logger.debug(`Données 3D pour le col ${colId} générées en ${duration.toFixed(2)}ms`);
      
      return col3DData;
    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error(`Erreur lors de la génération des données 3D pour le col ${colId}: ${error.message}`, { 
        error, 
        colId, 
        options,
        duration: duration.toFixed(2)
      });
      
      throw error;
    }
  }

  /**
   * Détermine la résolution optimale en fonction du type d'appareil
   * @param {string} device - Type d'appareil (desktop, tablet, mobile)
   * @returns {string} Résolution optimale
   */
  determineOptimalResolution(device) {
    switch (device) {
      case 'desktop':
        return 'high';
      case 'tablet':
        return 'medium';
      case 'mobile':
        return 'low';
      default:
        return 'medium';
    }
  }

  /**
   * Génère une clé de cache pour les données 3D
   * @param {string} colId - ID du col
   * @param {string} resolution - Résolution du maillage
   * @param {boolean} withTextures - Inclure les textures
   * @param {boolean} withAnimation - Inclure les données d'animation
   * @returns {string} Clé de cache
   */
  generateCacheKey(colId, resolution, withTextures, withAnimation) {
    return `col3d:${colId}:${resolution}:${withTextures ? 'tex' : 'notex'}:${withAnimation ? 'anim' : 'noanim'}`;
  }

  /**
   * Récupère les données de base d'un col
   * @param {string} colId - ID du col
   * @returns {Promise<Object>} Données de base du col
   */
  async getBasicColData(colId) {
    try {
      // Vérifier le cache
      const cacheKey = `col3d:basic:${colId}`;
      const cachedData = await this.cache.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      
      // Récupérer depuis le fichier
      const colFile = path.join(this.baseDataPath, `${colId}.json`);
      const colData = await fs.readFile(colFile, 'utf8');
      const parsedData = JSON.parse(colData);
      
      // Mettre en cache
      await this.cache.set(cacheKey, parsedData, { 
        ttl: 86400 * 7, // 7 jours
        localOnly: false
      });
      
      return parsedData;
    } catch (error) {
      logger.warn(`Erreur lors de la récupération des données de base pour le col ${colId}: ${error.message}`);
      
      // Tenter de récupérer depuis l'API
      try {
        const ColService = require('./col.service');
        const colService = new ColService();
        const colData = await colService.getColById(colId);
        
        if (colData) {
          // Mettre en cache
          const basicData = {
            id: colData.id,
            name: colData.name,
            region: colData.region,
            elevation: colData.elevation,
            length: colData.length,
            gradient: colData.gradient
          };
          
          await this.cache.set(`col3d:basic:${colId}`, basicData, { 
            ttl: 86400 * 7, // 7 jours
            localOnly: false
          });
          
          return basicData;
        }
      } catch (apiError) {
        logger.error(`Impossible de récupérer les données du col ${colId} depuis l'API: ${apiError.message}`);
      }
      
      return null;
    }
  }

  /**
   * Récupère et optimise les données de maillage 3D
   * @param {string} colId - ID du col
   * @param {string} resolution - Résolution du maillage
   * @returns {Promise<Object>} Données de maillage optimisées
   */
  async getMeshData(colId, resolution) {
    try {
      // Vérifier le cache
      const cacheKey = `col3d:mesh:${colId}:${resolution}`;
      const cachedData = await this.cache.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      
      // Récupérer le maillage complet
      const meshFile = path.join(this.baseDataPath, 'meshes', `${colId}.json`);
      const meshData = await fs.readFile(meshFile, 'utf8');
      const fullMesh = JSON.parse(meshData);
      
      // Optimiser le maillage selon la résolution
      const optimizedMesh = await this.optimizeMesh(fullMesh, resolution);
      
      // Mettre en cache
      await this.cache.set(cacheKey, optimizedMesh, { 
        ttl: 86400 * 3, // 3 jours
        localOnly: false
      });
      
      return optimizedMesh;
    } catch (error) {
      logger.error(`Erreur lors de la récupération du maillage pour le col ${colId}: ${error.message}`, { error });
      
      // Retourner un maillage par défaut en cas d'erreur
      return this.getDefaultMesh(resolution);
    }
  }

  /**
   * Optimise un maillage 3D selon la résolution spécifiée
   * @param {Object} fullMesh - Maillage complet
   * @param {string} resolution - Résolution cible
   * @returns {Promise<Object>} Maillage optimisé
   */
  async optimizeMesh(fullMesh, resolution) {
    try {
      const targetTriangles = this.meshResolutions[resolution].triangles;
      
      // Si le maillage a déjà la bonne résolution
      if (fullMesh.metadata && fullMesh.metadata.triangles <= targetTriangles) {
        return fullMesh;
      }
      
      // Simplifier le maillage
      const simplifiedMesh = this.simplifyMesh(fullMesh, targetTriangles);
      
      return {
        vertices: simplifiedMesh.vertices,
        indices: simplifiedMesh.indices,
        normals: simplifiedMesh.normals,
        uvs: simplifiedMesh.uvs,
        metadata: {
          triangles: simplifiedMesh.indices.length / 3,
          resolution,
          optimizedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error(`Erreur lors de l'optimisation du maillage: ${error.message}`, { error });
      throw error;
    }
  }

  /**
   * Simplifie un maillage 3D à un nombre cible de triangles
   * @param {Object} mesh - Maillage à simplifier
   * @param {number} targetTriangles - Nombre cible de triangles
   * @returns {Object} Maillage simplifié
   */
  simplifyMesh(mesh, targetTriangles) {
    // Implémentation simplifiée de la simplification de maillage
    // Dans une implémentation réelle, utiliser une bibliothèque comme simplify-3d
    
    const currentTriangles = mesh.indices.length / 3;
    const ratio = targetTriangles / currentTriangles;
    
    if (ratio >= 1) {
      return mesh;
    }
    
    // Échantillonner les indices pour atteindre le nombre cible de triangles
    const newIndicesCount = targetTriangles * 3;
    const newIndices = [];
    
    for (let i = 0; i < newIndicesCount; i += 3) {
      const sourceIndex = Math.floor(i / ratio);
      newIndices.push(mesh.indices[sourceIndex]);
      newIndices.push(mesh.indices[sourceIndex + 1]);
      newIndices.push(mesh.indices[sourceIndex + 2]);
    }
    
    return {
      vertices: mesh.vertices,
      indices: newIndices,
      normals: mesh.normals,
      uvs: mesh.uvs
    };
  }

  /**
   * Retourne un maillage par défaut en cas d'erreur
   * @param {string} resolution - Résolution cible
   * @returns {Object} Maillage par défaut
   */
  getDefaultMesh(resolution) {
    const triangleCount = this.meshResolutions[resolution].triangles;
    
    // Créer un maillage simple (une colline)
    const vertices = [];
    const indices = [];
    const normals = [];
    const uvs = [];
    
    // Générer une grille simple
    const gridSize = Math.ceil(Math.sqrt(triangleCount / 2));
    const step = 1 / gridSize;
    
    for (let i = 0; i <= gridSize; i++) {
      for (let j = 0; j <= gridSize; j++) {
        const x = j * step - 0.5;
        const z = i * step - 0.5;
        const y = Math.exp(-(x * x + z * z) * 10) * 0.2; // Forme de colline
        
        vertices.push(x, y, z);
        
        // Normal approximative
        const nx = -x * 20 * Math.exp(-(x * x + z * z) * 10);
        const ny = 1;
        const nz = -z * 20 * Math.exp(-(x * x + z * z) * 10);
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
        
        normals.push(nx / len, ny / len, nz / len);
        uvs.push(j * step, i * step);
      }
    }
    
    // Générer les indices
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const a = i * (gridSize + 1) + j;
        const b = i * (gridSize + 1) + j + 1;
        const c = (i + 1) * (gridSize + 1) + j;
        const d = (i + 1) * (gridSize + 1) + j + 1;
        
        // Premier triangle
        indices.push(a, b, c);
        
        // Second triangle
        indices.push(b, d, c);
      }
    }
    
    return {
      vertices,
      indices,
      normals,
      uvs,
      metadata: {
        triangles: indices.length / 3,
        resolution,
        isDefault: true
      }
    };
  }

  /**
   * Récupère les données de texture pour un col
   * @param {string} colId - ID du col
   * @param {string} resolution - Résolution de la texture
   * @param {string} region - Région européenne
   * @returns {Promise<Object>} Données de texture
   */
  async getTextureData(colId, resolution, region) {
    try {
      // Vérifier le cache
      const cacheKey = `col3d:texture:${colId}:${resolution}:${region}`;
      const cachedData = await this.cache.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      
      // Récupérer les textures
      const textureSize = this.meshResolutions[resolution].textureSize;
      const textureFile = path.join(this.baseDataPath, 'textures', `${colId}_${textureSize}.json`);
      const textureData = await fs.readFile(textureFile, 'utf8');
      const textures = JSON.parse(textureData);
      
      // Adapter les textures à la région (conditions météo, saison, etc.)
      const adaptedTextures = await this.adaptTexturesToRegion(textures, region);
      
      // Mettre en cache
      await this.cache.set(cacheKey, adaptedTextures, { 
        ttl: 86400 * 2, // 2 jours
        region,
        localOnly: false
      });
      
      return adaptedTextures;
    } catch (error) {
      logger.error(`Erreur lors de la récupération des textures pour le col ${colId}: ${error.message}`, { error });
      
      // Retourner des textures par défaut en cas d'erreur
      return this.getDefaultTextures(resolution);
    }
  }

  /**
   * Adapte les textures à une région spécifique
   * @param {Object} textures - Données de texture
   * @param {string} region - Région européenne
   * @returns {Promise<Object>} Textures adaptées
   */
  async adaptTexturesToRegion(textures, region) {
    // Adapter les textures selon la région (conditions météo, saison, etc.)
    // Implémentation simplifiée
    
    // Récupérer les informations météo et de saison pour la région
    const weatherService = apiManager.getService('weather');
    const regionInfo = await weatherService.getRegionInfo(region);
    
    // Ajuster les paramètres de texture
    const adjustedTextures = { ...textures };
    
    // Ajuster la luminosité selon la saison et la météo
    if (regionInfo.season === 'winter') {
      adjustedTextures.brightness = (textures.brightness || 1.0) * 0.9;
    } else if (regionInfo.season === 'summer') {
      adjustedTextures.brightness = (textures.brightness || 1.0) * 1.1;
    }
    
    // Ajuster la saturation selon la météo
    if (regionInfo.weather === 'rainy') {
      adjustedTextures.saturation = (textures.saturation || 1.0) * 0.8;
    } else if (regionInfo.weather === 'sunny') {
      adjustedTextures.saturation = (textures.saturation || 1.0) * 1.2;
    }
    
    return adjustedTextures;
  }

  /**
   * Retourne des textures par défaut en cas d'erreur
   * @param {string} resolution - Résolution cible
   * @returns {Object} Textures par défaut
   */
  getDefaultTextures(resolution) {
    return {
      diffuse: {
        url: `/assets/textures/default_diffuse_${resolution}.jpg`,
        size: this.meshResolutions[resolution].textureSize
      },
      normal: {
        url: `/assets/textures/default_normal_${resolution}.jpg`,
        size: this.meshResolutions[resolution].textureSize
      },
      metadata: {
        resolution,
        isDefault: true
      }
    };
  }

  /**
   * Récupère les données d'animation pour un col
   * @param {string} colId - ID du col
   * @returns {Promise<Object>} Données d'animation
   */
  async getAnimationData(colId) {
    try {
      // Vérifier le cache
      const cacheKey = `col3d:animation:${colId}`;
      const cachedData = await this.cache.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      
      // Récupérer les données d'animation
      const animationFile = path.join(this.baseDataPath, 'animations', `${colId}.json`);
      const animationData = await fs.readFile(animationFile, 'utf8');
      const animation = JSON.parse(animationData);
      
      // Mettre en cache
      await this.cache.set(cacheKey, animation, { 
        ttl: 86400 * 7, // 7 jours
        localOnly: false
      });
      
      return animation;
    } catch (error) {
      logger.warn(`Erreur lors de la récupération des animations pour le col ${colId}: ${error.message}`, { error });
      
      // Retourner des animations par défaut en cas d'erreur
      return this.getDefaultAnimation();
    }
  }

  /**
   * Retourne des données d'animation par défaut en cas d'erreur
   * @returns {Object} Animation par défaut
   */
  getDefaultAnimation() {
    return {
      camera: {
        path: [
          { position: [0, 0.5, 2], target: [0, 0, 0], time: 0 },
          { position: [2, 0.5, 0], target: [0, 0, 0], time: 5 },
          { position: [0, 0.5, -2], target: [0, 0, 0], time: 10 },
          { position: [-2, 0.5, 0], target: [0, 0, 0], time: 15 },
          { position: [0, 0.5, 2], target: [0, 0, 0], time: 20 }
        ],
        duration: 20
      },
      lighting: {
        keyframes: [
          { intensity: 1.0, color: [1, 1, 1], time: 0 },
          { intensity: 0.8, color: [1, 0.9, 0.8], time: 10 },
          { intensity: 1.0, color: [1, 1, 1], time: 20 }
        ],
        duration: 20
      },
      metadata: {
        isDefault: true
      }
    };
  }

  /**
   * Précharge les données 3D pour une liste de cols
   * @param {Array<string>} colIds - Liste d'IDs de cols
   * @param {Object} options - Options de préchargement
   * @returns {Promise<Object>} Résultat du préchargement
   */
  async preloadCols3DData(colIds, options = {}) {
    try {
      logger.info(`Préchargement des données 3D pour ${colIds.length} cols`);
      
      const results = {
        total: colIds.length,
        success: 0,
        failed: 0,
        skipped: 0,
        details: []
      };
      
      // Limiter le nombre de préchargements simultanés
      const batchSize = options.batchSize || 5;
      const batches = [];
      
      for (let i = 0; i < colIds.length; i += batchSize) {
        batches.push(colIds.slice(i, i + batchSize));
      }
      
      for (const batch of batches) {
        await Promise.all(batch.map(async (colId) => {
          try {
            // Vérifier si les données sont déjà en cache
            const cacheKey = this.generateCacheKey(
              colId, 
              options.resolution || 'medium', 
              options.withTextures !== false, 
              options.withAnimation !== false
            );
            
            const cachedData = await this.cache.get(cacheKey);
            if (cachedData) {
              results.skipped++;
              results.details.push({ colId, status: 'skipped', reason: 'already_cached' });
              return;
            }
            
            // Précharger les données
            await this.getCol3DData(colId, options);
            
            results.success++;
            results.details.push({ colId, status: 'success' });
          } catch (error) {
            results.failed++;
            results.details.push({ 
              colId, 
              status: 'failed', 
              error: error.message 
            });
            
            logger.error(`Échec du préchargement des données 3D pour le col ${colId}: ${error.message}`);
          }
        }));
      }
      
      logger.info(`Préchargement terminé: ${results.success} réussis, ${results.skipped} ignorés, ${results.failed} échoués`);
      
      return results;
    } catch (error) {
      logger.error(`Erreur lors du préchargement des données 3D: ${error.message}`, { error });
      throw error;
    }
  }

  /**
   * Invalide le cache pour un col spécifique
   * @param {string} colId - ID du col
   * @returns {Promise<boolean>} Succès de l'opération
   */
  async invalidateColCache(colId) {
    try {
      logger.info(`Invalidation du cache pour le col ${colId}`);
      
      // Invalider toutes les entrées de cache liées à ce col
      await this.cache.flush(`col3d:${colId}`);
      
      return true;
    } catch (error) {
      logger.error(`Erreur lors de l'invalidation du cache pour le col ${colId}: ${error.message}`, { error });
      return false;
    }
  }
}

// Singleton
let instance = null;

/**
 * Récupère l'instance du service Col3D
 * @returns {Col3DService} Instance du service Col3D
 */
function getInstance() {
  if (!instance) {
    instance = new Col3DService();
  }
  return instance;
}

module.exports = {
  Col3DService,
  getInstance
};
