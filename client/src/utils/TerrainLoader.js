/**
 * Système de chargement progressif des données topographiques pour visualisations 3D
 * Optimisé pour l'échelle européenne avec gestion de LOD (Level of Detail)
 */

import * as THREE from 'three';

class TerrainLoader {
  constructor(options = {}) {
    // Configuration par défaut
    this.options = {
      cacheDuration: 1000 * 60 * 30, // 30 minutes de cache
      maxCacheSize: 150,             // Nombre max de tuiles en cache
      baseLOD: 3,                    // LOD par défaut (plus petit = moins détaillé)
      maxLOD: 12,                    // LOD maximum (pour zoom rapproché)
      preloadRadius: 1,              // Rayon de préchargement autour de la tuile actuelle
      lowDetailMode: false,          // Mode basse résolution pour appareils moins performants
      enablePriority: true,          // Système de priorité pour le chargement
      apiEndpoint: '/api/terrain',   // Point d'accès à l'API
      ...options
    };

    // Cache pour les tuiles chargées (utilisation d'une Map pour l'ordre d'insertion)
    this.tileCache = new Map();
    
    // Files d'attente de chargement (par niveau de priorité)
    this.loadQueue = {
      high: [],    // Tuiles directement visibles
      medium: [],  // Tuiles adjacentes (préchargement)
      low: []      // Tuiles de contexte (faible priorité)
    };
    
    // État du chargeur
    this.activeLoads = 0;
    this.maxConcurrentLoads = 4;
    this.isProcessingQueue = false;
    
    // Géométries et matériaux par défaut pour affichage pendant le chargement
    this.defaultGeometry = null;
    this.defaultMaterial = null;
    
    // Statistiques et monitoring
    this.stats = {
      totalLoaded: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalDataVolume: 0,
      abortedLoads: 0
    };
    
    // Gérer les contrôleurs d'annulation pour les requêtes fetch
    this.abortControllers = new Map();
    
    // Initialiser
    this._initDefaultGeometry();
  }
  
  /**
   * Initialise la géométrie par défaut pour affichage durant le chargement
   * @private
   */
  _initDefaultGeometry() {
    this.defaultGeometry = new THREE.PlaneGeometry(1, 1, 1, 1);
    this.defaultMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xcccccc,
      wireframe: true, 
      transparent: true,
      opacity: 0.5
    });
  }
  
  /**
   * Charge une tuile de terrain pour une localisation donnée
   * @param {Object} location - Coordonnées {lat, lng} de la localisation
   * @param {number} zoom - Niveau de zoom (détermine le LOD)
   * @param {Object} options - Options de chargement
   * @returns {Promise<Object>} - Promesse résolue avec les données de terrain
   */
  loadTerrain(location, zoom, options = {}) {
    // Calculer le niveau de détail (LOD) basé sur le zoom
    const lod = this._calculateLOD(zoom);
    
    // Convertir la localisation en identifiant de tuile
    const tileId = this._locationToTileId(location, lod);
    
    // Vérifier si la tuile est déjà en cache
    if (this.tileCache.has(tileId)) {
      const cachedTile = this.tileCache.get(tileId);
      
      // Vérifier si le cache est encore valide
      if (Date.now() - cachedTile.timestamp < this.options.cacheDuration) {
        // Mettre à jour les statistiques
        this.stats.cacheHits++;
        
        // Rafraîchir la position dans le cache (LRU)
        this.tileCache.delete(tileId);
        this.tileCache.set(tileId, {
          ...cachedTile,
          lastAccessed: Date.now()
        });
        
        return Promise.resolve(cachedTile.data);
      }
    }
    
    // Si pas en cache ou cache expiré, ajouter à la file d'attente
    const priority = options.priority || this._calculatePriority(location, zoom, options.isVisible);
    
    return new Promise((resolve, reject) => {
      const loadRequest = {
        tileId,
        location,
        lod,
        priority,
        resolve,
        reject,
        timestamp: Date.now(),
        options
      };
      
      // Ajouter à la file d'attente appropriée
      this.loadQueue[priority].push(loadRequest);
      
      // Démarrer le traitement de la file si pas déjà en cours
      if (!this.isProcessingQueue) {
        this._processQueue();
      }
    });
  }
  
  /**
   * Précharge les tuiles autour d'une localisation donnée
   * @param {Object} location - Coordonnées centrales
   * @param {number} zoom - Niveau de zoom actuel
   */
  preloadSurroundingTiles(location, zoom) {
    const centerLod = this._calculateLOD(zoom);
    const preloadLod = Math.max(this.options.baseLOD, centerLod - 1); // Moins détaillé pour le préchargement
    
    // Déterminer les tuiles adjacentes
    const centerTileXY = this._locationToTileXY(location, preloadLod);
    const radius = this.options.preloadRadius;
    
    for (let x = -radius; x <= radius; x++) {
      for (let y = -radius; y <= radius; y++) {
        // Éviter de précharger la tuile centrale (déjà chargée)
        if (x === 0 && y === 0) continue;
        
        const tileLocation = this._tileXYToLocation({
          x: centerTileXY.x + x,
          y: centerTileXY.y + y
        }, preloadLod);
        
        // Déterminer la priorité basée sur la distance
        const distance = Math.sqrt(x*x + y*y);
        let priority = 'medium';
        
        if (distance > 1) {
          priority = 'low';
        }
        
        // Précharger avec basse priorité
        this.loadTerrain(tileLocation, zoom - 1, { 
          priority, 
          isPreload: true,
          isVisible: false
        }).catch(() => {
          // Ignorer les erreurs de préchargement
        });
      }
    }
  }
  
  /**
   * Traite la file d'attente de chargement
   * @private
   */
  _processQueue() {
    if (this.activeLoads >= this.maxConcurrentLoads) {
      return;
    }
    
    this.isProcessingQueue = true;
    
    // Chercher la prochaine requête à traiter par ordre de priorité
    const nextRequest = this._getNextRequest();
    
    if (!nextRequest) {
      this.isProcessingQueue = false;
      return;
    }
    
    this.activeLoads++;
    
    // Créer un contrôleur d'annulation pour cette requête
    const abortController = new AbortController();
    this.abortControllers.set(nextRequest.tileId, abortController);
    
    // Charger la tuile
    this._loadTileFromServer(nextRequest, abortController.signal)
      .then(data => {
        // Mettre en cache
        this._cacheTile(nextRequest.tileId, data);
        
        // Résoudre la promesse
        nextRequest.resolve(data);
        
        // Mettre à jour les statistiques
        this.stats.totalLoaded++;
        this.stats.totalDataVolume += this._estimateDataSize(data);
      })
      .catch(error => {
        // Ne pas rejeter si c'était une annulation intentionnelle
        if (error.name === 'AbortError') {
          this.stats.abortedLoads++;
          return;
        }
        
        // Rejeter avec l'erreur
        nextRequest.reject(error);
      })
      .finally(() => {
        // Nettoyer
        this.abortControllers.delete(nextRequest.tileId);
        this.activeLoads--;
        
        // Continuer à traiter la file
        this._processQueue();
      });
      
    // Traiter d'autres requêtes si possible
    if (this.activeLoads < this.maxConcurrentLoads) {
      setTimeout(() => this._processQueue(), 0);
    }
  }
  
  /**
   * Récupère la prochaine requête à traiter depuis les files d'attente
   * @returns {Object|null} Requête de chargement ou null si aucune
   * @private
   */
  _getNextRequest() {
    // Vérifier les files par ordre de priorité
    for (const priority of ['high', 'medium', 'low']) {
      if (this.loadQueue[priority].length > 0) {
        return this.loadQueue[priority].shift();
      }
    }
    
    return null;
  }
  
  /**
   * Charge une tuile depuis le serveur
   * @param {Object} request - Requête de chargement
   * @param {AbortSignal} signal - Signal d'annulation
   * @returns {Promise<Object>} - Promesse résolue avec les données de terrain
   * @private
   */
  _loadTileFromServer(request, signal) {
    const { tileId, lod, location } = request;
    
    // Préparer les paramètres de l'API
    const params = new URLSearchParams({
      lat: location.lat.toFixed(6),
      lng: location.lng.toFixed(6),
      lod: lod,
      format: this.options.lowDetailMode ? 'low' : 'standard'
    });
    
    // Mise à jour des statistiques
    this.stats.cacheMisses++;
    
    return fetch(`${this.options.apiEndpoint}?${params.toString()}`, { signal })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Erreur de chargement de terrain: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        // Transformer les données brutes en géométrie Three.js
        return this._processTerrainData(data, lod);
      });
  }
  
  /**
   * Transforme les données brutes de l'API en géométrie Three.js
   * @param {Object} data - Données brutes de terrain
   * @param {number} lod - Niveau de détail
   * @returns {Object} - Objet avec géométrie, matériau et métadonnées
   * @private
   */
  _processTerrainData(data, lod) {
    // Créer une géométrie à partir des données d'élévation
    const geometry = new THREE.PlaneGeometry(
      data.width,
      data.height,
      data.resolution - 1,
      data.resolution - 1
    );
    
    // Appliquer les données d'élévation
    const vertices = geometry.attributes.position.array;
    const elevationData = data.elevation;
    
    for (let i = 0, j = 0; i < vertices.length; i += 3, j++) {
      // Modifier Z (élévation)
      vertices[i + 2] = elevationData[j];
    }
    
    // Recalculer les normales pour l'éclairage
    geometry.computeVertexNormals();
    
    // Créer un matériau adapté aux données du terrain
    let material;
    
    if (data.texture) {
      // Si une texture est fournie
      const texture = new THREE.TextureLoader().load(data.texture);
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      
      material = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.8,
        metalness: 0.2
      });
    } else {
      // Sinon, utiliser un matériau basé sur l'altitude
      material = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.8,
        metalness: 0.1
      });
      
      // Ajouter des couleurs basées sur l'altitude
      const colors = new Float32Array(vertices.length);
      const color = new THREE.Color();
      
      for (let i = 0, j = 0; i < vertices.length; i += 3, j++) {
        const height = vertices[i + 2];
        
        // Échelle de couleur basée sur l'altitude
        if (height < 0) {
          color.setRGB(0.2, 0.3, 0.8); // Eau (bleu)
        } else if (height < 200) {
          color.setRGB(0.3, 0.55, 0.3); // Plaine (vert)
        } else if (height < 800) {
          color.setRGB(0.5, 0.5, 0.3); // Colline (beige)
        } else if (height < 1500) {
          color.setRGB(0.6, 0.5, 0.3); // Moyenne montagne (marron clair)
        } else if (height < 2500) {
          color.setRGB(0.6, 0.4, 0.3); // Haute montagne (marron)
        } else {
          color.setRGB(1, 1, 1); // Neige (blanc)
        }
        
        colors[i] = color.r;
        colors[i+1] = color.g;
        colors[i+2] = color.b;
      }
      
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    }
    
    return {
      geometry,
      material,
      metadata: {
        bounds: data.bounds,
        resolution: data.resolution,
        lod: lod,
        features: data.features || []
      }
    };
  }
  
  /**
   * Met en cache une tuile de terrain
   * @param {string} tileId - Identifiant de la tuile
   * @param {Object} data - Données de terrain
   * @private
   */
  _cacheTile(tileId, data) {
    // Vérifier la taille du cache et supprimer les éléments les plus anciens si nécessaire
    if (this.tileCache.size >= this.options.maxCacheSize) {
      // Identifier les entrées les moins récemment accédées
      const entries = Array.from(this.tileCache.entries());
      const sorted = entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
      
      // Supprimer les 10% les plus anciens
      const toRemove = Math.max(1, Math.floor(this.options.maxCacheSize * 0.1));
      for (let i = 0; i < toRemove; i++) {
        if (sorted[i]) {
          const [key, value] = sorted[i];
          // Nettoyer les ressources WebGL
          if (value.data && value.data.geometry) {
            value.data.geometry.dispose();
          }
          if (value.data && value.data.material) {
            value.data.material.dispose();
          }
          this.tileCache.delete(key);
        }
      }
    }
    
    // Ajouter au cache
    this.tileCache.set(tileId, {
      data,
      timestamp: Date.now(),
      lastAccessed: Date.now()
    });
  }
  
  /**
   * Annule les chargements en cours pour les tuiles non visibles
   * @param {Array<Object>} visibleLocations - Liste des localisations actuellement visibles
   * @param {number} zoom - Niveau de zoom actuel
   */
  cancelNonVisibleLoads(visibleLocations, zoom) {
    // Convertir les localisations visibles en IDs de tuiles
    const visibleTileIds = new Set();
    const lod = this._calculateLOD(zoom);
    
    visibleLocations.forEach(location => {
      const tileId = this._locationToTileId(location, lod);
      visibleTileIds.add(tileId);
      
      // Ajouter aussi les tuiles adjacentes (pour le préchargement)
      const tileXY = this._locationToTileXY(location, lod);
      for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
          const adjacentLocation = this._tileXYToLocation({
            x: tileXY.x + x,
            y: tileXY.y + y
          }, lod);
          const adjacentTileId = this._locationToTileId(adjacentLocation, lod);
          visibleTileIds.add(adjacentTileId);
        }
      }
    });
    
    // Annuler les chargements pour les tuiles non visibles
    this.abortControllers.forEach((controller, tileId) => {
      if (!visibleTileIds.has(tileId)) {
        controller.abort();
        this.abortControllers.delete(tileId);
      }
    });
    
    // Nettoyer également les files d'attente
    ['high', 'medium', 'low'].forEach(priority => {
      this.loadQueue[priority] = this.loadQueue[priority].filter(request => {
        return visibleTileIds.has(request.tileId);
      });
    });
  }
  
  /**
   * Calcule le niveau de détail (LOD) basé sur le zoom
   * @param {number} zoom - Niveau de zoom
   * @returns {number} Niveau de détail
   * @private
   */
  _calculateLOD(zoom) {
    // Ajuster selon les capacités de l'appareil
    const baseLOD = this.options.lowDetailMode ? 
      Math.max(1, this.options.baseLOD - 1) : this.options.baseLOD;
    
    // Calculer le LOD en fonction du zoom
    let lod = Math.round(baseLOD + (zoom / 20) * (this.options.maxLOD - baseLOD));
    
    // Limiter aux valeurs min/max
    return Math.max(baseLOD, Math.min(this.options.maxLOD, lod));
  }
  
  /**
   * Détermine la priorité de chargement d'une tuile
   * @param {Object} location - Coordonnées de la tuile
   * @param {number} zoom - Niveau de zoom actuel
   * @param {boolean} isVisible - Si la tuile est visible
   * @returns {string} Priorité ('high', 'medium', ou 'low')
   * @private
   */
  _calculatePriority(location, zoom, isVisible) {
    if (isVisible === false) {
      return 'low';
    }
    
    // Les tuiles avec un niveau de zoom proche du niveau actuel sont prioritaires
    const lod = this._calculateLOD(zoom);
    
    if (lod >= this.options.maxLOD - 2) {
      return 'high';
    } else if (lod >= this.options.baseLOD + 2) {
      return 'medium';
    }
    
    return 'low';
  }
  
  /**
   * Estime la taille des données en mémoire
   * @param {Object} data - Données de terrain
   * @returns {number} Taille estimée en octets
   * @private
   */
  _estimateDataSize(data) {
    let size = 0;
    
    if (data.geometry) {
      // Taille approximative des attributs de géométrie
      const position = data.geometry.attributes.position;
      if (position) {
        size += position.array.length * 4; // Float32Array = 4 octets par élément
      }
      
      const normal = data.geometry.attributes.normal;
      if (normal) {
        size += normal.array.length * 4;
      }
      
      const uv = data.geometry.attributes.uv;
      if (uv) {
        size += uv.array.length * 4;
      }
      
      const color = data.geometry.attributes.color;
      if (color) {
        size += color.array.length * 4;
      }
    }
    
    // Ajouter la taille des métadonnées (approximatif)
    if (data.metadata) {
      size += JSON.stringify(data.metadata).length * 2;
    }
    
    return size;
  }
  
  /**
   * Convertit une localisation en identifiant de tuile
   * @param {Object} location - Coordonnées {lat, lng}
   * @param {number} lod - Niveau de détail
   * @returns {string} Identifiant de tuile
   * @private
   */
  _locationToTileId(location, lod) {
    const tileXY = this._locationToTileXY(location, lod);
    return `${lod}_${tileXY.x}_${tileXY.y}`;
  }
  
  /**
   * Convertit une localisation en coordonnées de tuile
   * @param {Object} location - Coordonnées {lat, lng}
   * @param {number} lod - Niveau de détail
   * @returns {Object} Coordonnées de tuile {x, y}
   * @private
   */
  _locationToTileXY(location, lod) {
    const n = Math.pow(2, lod);
    
    // Formule standard pour la projection Web Mercator
    const lat_rad = location.lat * Math.PI / 180;
    const x = Math.floor(n * ((location.lng + 180) / 360));
    const y = Math.floor(n * (1 - (Math.log(Math.tan(lat_rad) + 1 / Math.cos(lat_rad)) / Math.PI)) / 2);
    
    return { x, y };
  }
  
  /**
   * Convertit des coordonnées de tuile en localisation
   * @param {Object} tileXY - Coordonnées de tuile {x, y}
   * @param {number} lod - Niveau de détail
   * @returns {Object} Coordonnées {lat, lng}
   * @private
   */
  _tileXYToLocation(tileXY, lod) {
    const n = Math.pow(2, lod);
    
    const lng = (tileXY.x / n) * 360 - 180;
    const lat_rad = Math.atan(Math.sinh(Math.PI * (1 - 2 * tileXY.y / n)));
    const lat = lat_rad * 180 / Math.PI;
    
    return { lat, lng };
  }
  
  /**
   * Nettoie le cache et annule les chargements en cours
   */
  clearCache() {
    // Annuler tous les chargements en cours
    this.abortControllers.forEach(controller => {
      controller.abort();
    });
    this.abortControllers.clear();
    
    // Vider les files d'attente
    this.loadQueue.high = [];
    this.loadQueue.medium = [];
    this.loadQueue.low = [];
    
    // Nettoyer les ressources WebGL
    this.tileCache.forEach(cached => {
      if (cached.data && cached.data.geometry) {
        cached.data.geometry.dispose();
      }
      if (cached.data && cached.data.material) {
        cached.data.material.dispose();
      }
    });
    
    // Vider le cache
    this.tileCache.clear();
    
    // Réinitialiser les statistiques
    this.stats = {
      totalLoaded: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalDataVolume: 0,
      abortedLoads: 0
    };
  }
  
  /**
   * Obtient un maillage temporaire pendant le chargement
   * @param {Object} bounds - Limites de la tuile {north, south, east, west}
   * @returns {Object} Maillage Three.js temporaire
   */
  getPlaceholderMesh(bounds) {
    const width = Math.abs(bounds.east - bounds.west);
    const height = Math.abs(bounds.north - bounds.south);
    
    const geometry = this.defaultGeometry.clone();
    const material = this.defaultMaterial.clone();
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.scale.set(width, height, 1);
    
    return {
      mesh,
      dispose: () => {
        geometry.dispose();
        material.dispose();
      }
    };
  }
}

export default TerrainLoader;
