/**
 * Système de clustering pour les points d'intérêt
 * Optimise l'affichage en regroupant les points proches pour éviter la surcharge visuelle
 */
class PointClustering {
  constructor(options = {}) {
    // Configuration par défaut
    this.options = {
      clusterRadius: 50,          // Rayon de clustering en pixels
      clusterThreshold: 3,        // Nombre minimum de points pour former un cluster
      clusterScaling: true,       // Mise à l'échelle des clusters selon le nombre de points
      maxZoomLevel: 15,           // Niveau de zoom max où le clustering est désactivé
      priorityTypes: ['danger'],  // Types de points à prioriser pour l'affichage
      maxPointsPerCluster: 15,    // Nombre max de points visibles dans un cluster
      ...options
    };
    
    // État du clustering
    this.clusters = [];
    this.visiblePoints = [];
    this.allPoints = [];
    this.currentZoom = 1;
    this.viewport = { width: 0, height: 0 };
    this.isDirty = true;          // Indique si le calcul doit être refait
    
    // Cache des distances
    this.distanceCache = new Map();
  }
  
  /**
   * Définit la liste complète des points d'intérêt
   * @param {Array} points - Liste des points à gérer
   */
  setPoints(points) {
    if (!Array.isArray(points)) {
      console.error('Points must be an array');
      return;
    }
    
    this.allPoints = points.map((point, index) => ({
      ...point,
      _id: point.id || `point_${index}`,
      _visible: true,
      _priority: this._calculatePriority(point)
    }));
    
    this.isDirty = true;
  }
  
  /**
   * Définit les dimensions du viewport
   * @param {number} width - Largeur du viewport en pixels
   * @param {number} height - Hauteur du viewport en pixels
   */
  setViewport(width, height) {
    if (this.viewport.width !== width || this.viewport.height !== height) {
      this.viewport = { width, height };
      this.isDirty = true;
    }
  }
  
  /**
   * Définit le niveau de zoom actuel
   * @param {number} zoom - Niveau de zoom (1.0 = 100%)
   */
  setZoom(zoom) {
    if (this.currentZoom !== zoom) {
      this.currentZoom = zoom;
      this.isDirty = true;
    }
  }
  
  /**
   * Met à jour les clusters et retourne les points/clusters à afficher
   * @param {Object} camera - Caméra Three.js pour calculer les positions 2D
   * @param {Function} worldToScreen - Fonction de conversion coordonnées 3D -> 2D
   * @returns {Object} Points et clusters à afficher
   */
  update(camera, worldToScreen) {
    // Si pas de points ou viewport non défini, retourner liste vide
    if (this.allPoints.length === 0 || !this.viewport.width || !this.viewport.height) {
      return { points: [], clusters: [] };
    }
    
    // Si niveau de zoom > maxZoomLevel, désactiver le clustering
    if (this.currentZoom >= this.options.maxZoomLevel) {
      return { 
        points: this.allPoints,
        clusters: []
      };
    }
    
    // Recalculer uniquement si nécessaire
    if (this.isDirty) {
      // 1. Calculer les positions à l'écran pour tous les points
      const pointsWithScreenPos = this._calculateScreenPositions(this.allPoints, camera, worldToScreen);
      
      // 2. Filtrer les points hors écran avec une marge
      const margin = this.options.clusterRadius * 2;
      const visiblePoints = this._filterVisiblePoints(pointsWithScreenPos, margin);
      
      // 3. Former les clusters avec les points visibles
      this.clusters = this._formClusters(visiblePoints);
      
      // 4. Déterminer quels points individuels afficher
      this.visiblePoints = this._determineVisiblePoints(visiblePoints, this.clusters);
      
      this.isDirty = false;
    }
    
    return {
      points: this.visiblePoints,
      clusters: this.clusters
    };
  }
  
  /**
   * Marque comme sale pour forcer le recalcul au prochain update
   */
  invalidate() {
    this.isDirty = true;
  }
  
  /**
   * Force le recalcul des clusters
   * @param {Object} camera - Caméra Three.js
   * @param {Function} worldToScreen - Fonction de conversion coordonnées 3D -> 2D
   * @returns {Object} Points et clusters mis à jour
   */
  forceUpdate(camera, worldToScreen) {
    this.invalidate();
    return this.update(camera, worldToScreen);
  }
  
  /**
   * Calcule la priorité d'un point basée sur son type
   * @param {Object} point - Point d'intérêt
   * @returns {number} Priorité du point (plus élevée = plus prioritaire)
   * @private
   */
  _calculatePriority(point) {
    // Points de type prioritaire ont une priorité plus élevée
    if (point.type && this.options.priorityTypes.includes(point.type)) {
      return 100;
    }
    
    // Priorité par défaut basée sur le type
    const typePriorities = {
      danger: 90,
      refreshment: 80, 
      water: 70,
      view: 60,
      photo: 50,
      technical: 40,
      info: 30
    };
    
    return typePriorities[point.type] || 0;
  }
  
  /**
   * Calcule les positions à l'écran pour chaque point
   * @param {Array} points - Points à traiter
   * @param {Object} camera - Caméra Three.js
   * @param {Function} worldToScreen - Fonction de conversion
   * @returns {Array} Points avec position écran
   * @private
   */
  _calculateScreenPositions(points, camera, worldToScreen) {
    return points.map(point => {
      // Calculer la position 2D à l'écran
      const screenPosition = worldToScreen(point.position, camera);
      
      return {
        ...point,
        screenPosition,
        // Calculer aussi la distance à la caméra pour le z-order
        distanceToCamera: camera.position.distanceTo(
          point.position.clone ? point.position.clone() : 
          { x: point.position.x, y: point.position.y, z: point.position.z }
        )
      };
    });
  }
  
  /**
   * Filtre les points qui sont visibles dans le viewport (avec marge)
   * @param {Array} points - Points avec position écran
   * @param {number} margin - Marge additionnelle en pixels
   * @returns {Array} Points visibles
   * @private
   */
  _filterVisiblePoints(points, margin = 0) {
    const { width, height } = this.viewport;
    
    return points.filter(point => {
      const { x, y } = point.screenPosition;
      return x >= -margin && x <= width + margin && 
             y >= -margin && y <= height + margin;
    });
  }
  
  /**
   * Calcule la distance entre deux points à l'écran
   * @param {Object} point1 - Premier point
   * @param {Object} point2 - Second point
   * @returns {number} Distance en pixels
   * @private
   */
  _calculateDistance(point1, point2) {
    // Utiliser le cache pour éviter de recalculer les mêmes distances
    const id1 = point1._id;
    const id2 = point2._id;
    const cacheKey = id1 < id2 ? `${id1}|${id2}` : `${id2}|${id1}`;
    
    if (this.distanceCache.has(cacheKey)) {
      return this.distanceCache.get(cacheKey);
    }
    
    const dx = point1.screenPosition.x - point2.screenPosition.x;
    const dy = point1.screenPosition.y - point2.screenPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Stocker dans le cache
    this.distanceCache.set(cacheKey, distance);
    
    return distance;
  }
  
  /**
   * Forme des clusters à partir des points visibles
   * @param {Array} visiblePoints - Points visibles
   * @returns {Array} Clusters formés
   * @private
   */
  _formClusters(visiblePoints) {
    // Réinitialiser le cache des distances si trop grand
    if (this.distanceCache.size > 10000) {
      this.distanceCache.clear();
    }
    
    // Trier les points par priorité (pour que les points importants soient traités en premier)
    const sortedPoints = [...visiblePoints].sort((a, b) => b._priority - a._priority);
    
    const clusters = [];
    const processedPoints = new Set();
    
    // Ajuster le rayon de clustering en fonction du zoom
    const adjustedRadius = this.options.clusterRadius / Math.max(0.3, this.currentZoom);
    
    // Pour chaque point non traité
    for (const point of sortedPoints) {
      if (processedPoints.has(point._id)) continue;
      
      // Chercher des voisins dans le rayon de clustering
      const neighbors = sortedPoints.filter(p => 
        p._id !== point._id && 
        !processedPoints.has(p._id) && 
        this._calculateDistance(point, p) <= adjustedRadius
      );
      
      // Si assez de voisins pour former un cluster
      if (neighbors.length >= this.options.clusterThreshold - 1) {
        // Marquer le point et ses voisins comme traités
        processedPoints.add(point._id);
        neighbors.forEach(p => processedPoints.add(p._id));
        
        // Créer le cluster
        const clusterPoints = [point, ...neighbors];
        
        // Calculer le centre du cluster
        const center = this._calculateClusterCenter(clusterPoints);
        
        // Créer l'objet cluster
        clusters.push({
          id: `cluster_${clusters.length}`,
          position: center.position,
          screenPosition: center.screenPosition,
          count: clusterPoints.length,
          points: clusterPoints,
          mainType: this._determineMainType(clusterPoints),
          radius: this._calculateClusterRadius(clusterPoints.length)
        });
      }
    }
    
    return clusters;
  }
  
  /**
   * Calcule le centre d'un groupe de points
   * @param {Array} points - Points du groupe
   * @returns {Object} Centre du groupe
   * @private
   */
  _calculateClusterCenter(points) {
    // Moyenne pondérée par la priorité pour favoriser les points importants
    let totalWeight = 0;
    const weightedSum = { x: 0, y: 0, z: 0, screenX: 0, screenY: 0 };
    
    points.forEach(point => {
      const weight = point._priority;
      totalWeight += weight;
      
      // Position 3D
      weightedSum.x += point.position.x * weight;
      weightedSum.y += point.position.y * weight;
      weightedSum.z += point.position.z * weight;
      
      // Position écran
      weightedSum.screenX += point.screenPosition.x * weight;
      weightedSum.screenY += point.screenPosition.y * weight;
    });
    
    // Éviter division par zéro
    const divisor = totalWeight > 0 ? totalWeight : 1;
    
    return {
      position: {
        x: weightedSum.x / divisor,
        y: weightedSum.y / divisor,
        z: weightedSum.z / divisor
      },
      screenPosition: {
        x: weightedSum.screenX / divisor,
        y: weightedSum.screenY / divisor
      }
    };
  }
  
  /**
   * Détermine le type principal d'un cluster
   * @param {Array} points - Points du cluster
   * @returns {string} Type principal
   * @private
   */
  _determineMainType(points) {
    // Compter les occurrences de chaque type
    const typeCounts = {};
    
    // Prioriser les types "importants"
    for (const point of points) {
      if (this.options.priorityTypes.includes(point.type)) {
        return point.type; // Retourner immédiatement le type prioritaire
      }
      
      typeCounts[point.type] = (typeCounts[point.type] || 0) + 1;
    }
    
    // Trouver le type le plus fréquent
    let maxCount = 0;
    let mainType = 'info'; // Type par défaut
    
    for (const [type, count] of Object.entries(typeCounts)) {
      if (count > maxCount) {
        maxCount = count;
        mainType = type;
      }
    }
    
    return mainType;
  }
  
  /**
   * Calcule le rayon visuel d'un cluster selon le nombre de points
   * @param {number} count - Nombre de points dans le cluster
   * @returns {number} Rayon en pixels
   * @private
   */
  _calculateClusterRadius(count) {
    if (!this.options.clusterScaling) {
      return this.options.clusterRadius;
    }
    
    // Rayon de base
    const baseRadius = this.options.clusterRadius;
    
    // Croissance logarithmique pour éviter des clusters trop grands
    const scaleFactor = 1 + Math.log10(Math.max(1, count / this.options.clusterThreshold));
    
    return baseRadius * scaleFactor;
  }
  
  /**
   * Détermine quels points individuels afficher en plus des clusters
   * @param {Array} visiblePoints - Tous les points visibles
   * @param {Array} clusters - Clusters formés
   * @returns {Array} Points à afficher individuellement
   * @private
   */
  _determineVisiblePoints(visiblePoints, clusters) {
    // Ensemble des IDs des points dans des clusters
    const clusteredPointIds = new Set();
    clusters.forEach(cluster => {
      cluster.points.forEach(point => {
        clusteredPointIds.add(point._id);
      });
    });
    
    // Filtrer pour garder uniquement les points non clusterisés
    return visiblePoints.filter(point => !clusteredPointIds.has(point._id));
  }
  
  /**
   * Obtient les détails d'un cluster pour l'affichage
   * @param {string} clusterId - ID du cluster
   * @returns {Object|null} Détails du cluster ou null si non trouvé
   */
  getClusterDetails(clusterId) {
    const cluster = this.clusters.find(c => c.id === clusterId);
    if (!cluster) return null;
    
    // Trier les points du cluster par priorité
    const sortedPoints = [...cluster.points].sort((a, b) => b._priority - a._priority);
    
    // Limiter le nombre de points retournés
    const visiblePoints = sortedPoints.slice(0, this.options.maxPointsPerCluster);
    const hiddenCount = Math.max(0, sortedPoints.length - this.options.maxPointsPerCluster);
    
    return {
      ...cluster,
      visiblePoints,
      hiddenCount,
      totalCount: cluster.points.length
    };
  }
  
  /**
   * Vérifie si un point est visible individuellement
   * @param {string} pointId - ID du point
   * @returns {boolean} Vrai si le point est visible individuellement
   */
  isPointVisible(pointId) {
    return this.visiblePoints.some(p => p._id === pointId);
  }
  
  /**
   * Obtient le cluster contenant un point spécifique
   * @param {string} pointId - ID du point
   * @returns {Object|null} Cluster contenant le point ou null
   */
  getClusterForPoint(pointId) {
    return this.clusters.find(cluster => 
      cluster.points.some(p => p._id === pointId)
    );
  }
}

export default PointClustering;
