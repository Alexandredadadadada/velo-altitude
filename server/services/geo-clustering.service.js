/**
 * Service de clustering géographique
 * Permet de regrouper des points géographiques proches pour optimiser les requêtes API
 */

const turf = require('@turf/turf');
const { logger } = require('../utils/logger');
const NodeCache = require('node-cache');

class GeoClusteringService {
  constructor() {
    // Cache pour stocker les résultats de clustering
    this.cache = new NodeCache({ 
      stdTTL: 3600, // 1 heure
      checkperiod: 600 // Vérification toutes les 10 minutes
    });

    // Configuration par défaut
    this.config = {
      // Distance maximale entre points (en km) pour être considérés dans le même cluster
      maxDistance: 25,
      // Nombre minimum de points pour former un cluster
      minPoints: 2,
      // Nombre maximum de clusters à générer
      maxClusters: 10,
      // Distance maximale entre points (en km) pour réutiliser un résultat météo
      weatherReuseDistance: 10
    };

    logger.info('Service de clustering géographique initialisé');
  }

  /**
   * Applique l'algorithme DBSCAN pour regrouper des points géographiques proches
   * @param {Array} points - Points à regrouper [{lat, lon, ...}]
   * @param {Object} options - Options de clustering
   * @returns {Array} Clusters de points
   */
  clusterPoints(points, options = {}) {
    if (!points || points.length === 0) {
      return [];
    }

    const cacheKey = this._generateCacheKey(points, options);
    const cachedResult = this.cache.get(cacheKey);
    if (cachedResult) {
      logger.debug('Utilisation du cache pour le clustering');
      return cachedResult;
    }

    // Fusionner les options avec la configuration par défaut
    const config = { ...this.config, ...options };
    
    try {
      // Convertir les points en format GeoJSON pour turf.js
      const features = points.map((point, index) => ({
        type: 'Feature',
        properties: { 
          index,
          ...point // Préserve les propriétés additionnelles
        },
        geometry: {
          type: 'Point',
          coordinates: [point.lon, point.lat]
        }
      }));
      
      const collection = turf.featureCollection(features);
      
      // Appliquer l'algorithme DBSCAN de turf.js
      const clustered = turf.clustersDbscan(collection, config.maxDistance, {
        units: 'kilometers',
        minPoints: config.minPoints
      });
      
      // Organiser les résultats en clusters
      const clusters = this._organizeIntoClusters(clustered);
      
      // Limiter le nombre de clusters si nécessaire
      const finalClusters = this._limitClusters(clusters, config.maxClusters);
      
      // Calculer le centroïde et d'autres propriétés utiles pour chaque cluster
      const enrichedClusters = this._enrichClusters(finalClusters);
      
      // Mettre en cache le résultat
      this.cache.set(cacheKey, enrichedClusters);
      
      return enrichedClusters;
    } catch (error) {
      logger.error('Erreur lors du clustering géographique:', error);
      // En cas d'échec, retourner un cluster par point (pas d'optimisation)
      return points.map(point => ({
        centroid: { lat: point.lat, lon: point.lon },
        points: [point],
        radius: 0,
        area: 0
      }));
    }
  }

  /**
   * Regroupe des points géographiques en grille adaptative
   * Méthode alternative au clustering, utile pour des distributions uniformes
   * @param {Array} points - Points à regrouper [{lat, lon, ...}]
   * @param {Object} bounds - Limites géographiques {north, south, east, west}
   * @param {Object} options - Options de grille
   * @returns {Array} Grille de points avec leurs centroïdes
   */
  createAdaptiveGrid(points, bounds, options = {}) {
    if (!points || points.length === 0) {
      return [];
    }

    const cacheKey = `grid_${JSON.stringify(bounds)}_${points.length}_${JSON.stringify(options)}`;
    const cachedResult = this.cache.get(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    // Paramètres par défaut
    const defaultOptions = {
      minCellSize: 10, // Taille minimale d'une cellule en km
      maxCellSize: 50, // Taille maximale d'une cellule en km
      densityFactor: 5, // Facteur de densité pour déterminer la taille des cellules
      maxCells: 25 // Nombre maximum de cellules à générer
    };

    const config = { ...defaultOptions, ...options };
    
    try {
      // Calculer la densité de points pour déterminer la taille des cellules
      const area = this._calculateBoundsArea(bounds);
      const density = points.length / area;
      
      // Ajuster la taille des cellules en fonction de la densité
      let cellSize = Math.max(
        config.minCellSize,
        Math.min(config.maxCellSize, config.densityFactor / Math.sqrt(density))
      );
      
      // Créer la grille
      const grid = this._generateGrid(bounds, cellSize, config.maxCells);
      
      // Assigner les points aux cellules
      const filledGrid = this._assignPointsToCells(points, grid);
      
      // Filtrer les cellules vides
      const nonEmptyCells = filledGrid.filter(cell => cell.points.length > 0);
      
      // Calculer le centroïde et d'autres propriétés pour chaque cellule
      const enrichedCells = nonEmptyCells.map(cell => {
        if (cell.points.length === 1) {
          return {
            centroid: { lat: cell.points[0].lat, lon: cell.points[0].lon },
            points: cell.points,
            bounds: cell.bounds,
            area: 0,
            radius: 0
          };
        }

        // Calculer le centroïde comme moyenne des coordonnées
        const centroid = this._calculateCentroid(cell.points);
        
        // Calculer d'autres propriétés utiles
        const radius = this._calculateMaxDistance(centroid, cell.points);
        
        return {
          centroid,
          points: cell.points,
          bounds: cell.bounds,
          area: this._calculateBoundsArea(cell.bounds),
          radius
        };
      });
      
      // Mettre en cache le résultat
      this.cache.set(cacheKey, enrichedCells);
      
      return enrichedCells;
    } catch (error) {
      logger.error('Erreur lors de la création de la grille adaptative:', error);
      // En cas d'échec, retourner un cluster par point (pas d'optimisation)
      return points.map(point => ({
        centroid: { lat: point.lat, lon: point.lon },
        points: [point],
        bounds: {
          north: point.lat + 0.0001,
          south: point.lat - 0.0001,
          east: point.lon + 0.0001,
          west: point.lon - 0.0001
        },
        area: 0,
        radius: 0
      }));
    }
  }

  /**
   * Détermine si un nouveau point peut réutiliser les données météo d'un point existant
   * @param {Object} existingPoint - Point existant avec données météo {lat, lon, weather}
   * @param {Object} newPoint - Nouveau point nécessitant des données météo {lat, lon}
   * @param {number} maxDistance - Distance maximale pour la réutilisation (en km)
   * @returns {boolean} Vrai si les données peuvent être réutilisées
   */
  canReuseWeatherData(existingPoint, newPoint, maxDistance = null) {
    if (!existingPoint || !newPoint) {
      return false;
    }

    const distance = this._calculateHaversineDistance(
      existingPoint.lat, existingPoint.lon,
      newPoint.lat, newPoint.lon
    );

    // Utiliser la distance configurée ou celle par défaut
    const reuseDistance = maxDistance || this.config.weatherReuseDistance;
    
    return distance <= reuseDistance;
  }

  /**
   * Optimise une liste de requêtes météo en regroupant les points proches
   * @param {Array} requests - Liste de requêtes [{lat, lon, ...}]
   * @param {Object} options - Options d'optimisation
   * @returns {Object} Requêtes optimisées et mapping pour reconstruction
   */
  optimizeWeatherRequests(requests, options = {}) {
    if (!requests || requests.length <= 1) {
      return { 
        optimizedRequests: requests || [],
        mapping: requests ? requests.map((_, i) => ({ originalIndex: i, requestIndex: i })) : []
      };
    }

    // Extraire les points des requêtes
    const points = requests.map((req, index) => ({
      ...req,
      originalIndex: index
    }));

    // Appliquer le clustering
    const clusters = this.clusterPoints(points, options);

    // Créer les requêtes optimisées (une par cluster)
    const optimizedRequests = clusters.map(cluster => ({
      lat: cluster.centroid.lat,
      lon: cluster.centroid.lon,
      // Conserver les autres propriétés de la première requête du cluster
      // (en supposant que les requêtes d'un même cluster ont les mêmes paramètres)
      ...this._getCommonRequestParams(cluster.points),
      // Ajouter des métadonnées utiles
      _cluster: {
        radius: cluster.radius,
        pointCount: cluster.points.length
      }
    }));

    // Créer le mapping pour reconstruire les résultats
    const mapping = this._createRequestMapping(clusters);

    return {
      optimizedRequests,
      mapping
    };
  }

  /**
   * Reconstruit les résultats complets à partir des réponses optimisées
   * @param {Array} responses - Réponses des requêtes optimisées
   * @param {Array} mapping - Mapping pour la reconstruction
   * @returns {Array} Résultats reconstruits pour chaque requête originale
   */
  reconstructResults(responses, mapping) {
    if (!responses || !mapping) {
      return [];
    }

    // Créer un tableau de la taille du nombre de requêtes originales
    const originalCount = Math.max(...mapping.map(m => m.originalIndex)) + 1;
    const results = new Array(originalCount);

    // Remplir le tableau avec les résultats
    mapping.forEach(map => {
      const response = responses[map.requestIndex];
      
      // Copier la réponse pour éviter les problèmes de référence
      results[map.originalIndex] = JSON.parse(JSON.stringify(response));
    });

    return results;
  }

  /**
   * Génère une clé de cache pour le clustering
   * @private
   * @param {Array} points - Points à regrouper
   * @param {Object} options - Options de clustering
   * @returns {string} Clé de cache
   */
  _generateCacheKey(points, options) {
    // Créer une empreinte basée sur les coordonnées, arrondie pour plus de stabilité
    const coordinatesHash = points.map(point => 
      `${Math.round(point.lat * 1000) / 1000},${Math.round(point.lon * 1000) / 1000}`
    ).sort().join('|');
    
    // Ajouter les options principales qui influencent le résultat
    const optionsHash = `${options.maxDistance || this.config.maxDistance}_${options.minPoints || this.config.minPoints}`;
    
    return `cluster_${coordinatesHash}_${optionsHash}`;
  }

  /**
   * Organise les points en clusters
   * @private
   * @param {Object} clusteredFeatures - Résultat du clustering de turf.js
   * @returns {Array} Clusters organisés
   */
  _organizeIntoClusters(clusteredFeatures) {
    // Initialiser un tableau pour chaque cluster
    const clusters = {};
    
    // Parcourir tous les points
    clusteredFeatures.features.forEach(feature => {
      const clusterId = feature.properties.cluster;
      const point = {
        lat: feature.geometry.coordinates[1],
        lon: feature.geometry.coordinates[0],
        // Récupérer les propriétés originales
        ...feature.properties
      };
      
      // Si le point n'appartient à aucun cluster (noise), créer un cluster singleton
      if (clusterId === null || clusterId === undefined) {
        const singletonId = `singleton_${feature.properties.index}`;
        clusters[singletonId] = [point];
      } else {
        // Sinon, ajouter au cluster existant ou créer un nouveau
        if (!clusters[clusterId]) {
          clusters[clusterId] = [];
        }
        clusters[clusterId].push(point);
      }
    });
    
    // Convertir l'objet en tableau de clusters
    return Object.values(clusters);
  }

  /**
   * Limite le nombre de clusters si nécessaire
   * @private
   * @param {Array} clusters - Clusters à limiter
   * @param {number} maxClusters - Nombre maximum de clusters
   * @returns {Array} Clusters limités
   */
  _limitClusters(clusters, maxClusters) {
    if (clusters.length <= maxClusters) {
      return clusters;
    }
    
    // Trier les clusters par taille (du plus grand au plus petit)
    const sortedClusters = [...clusters].sort((a, b) => b.length - a.length);
    
    // Prendre les N plus grands clusters
    const topClusters = sortedClusters.slice(0, maxClusters - 1);
    
    // Fusionner les clusters restants en un seul
    const remainingPoints = sortedClusters.slice(maxClusters - 1).flat();
    
    if (remainingPoints.length > 0) {
      topClusters.push(remainingPoints);
    }
    
    return topClusters;
  }

  /**
   * Enrichit les clusters avec des métadonnées utiles
   * @private
   * @param {Array} clusters - Clusters à enrichir
   * @returns {Array} Clusters enrichis
   */
  _enrichClusters(clusters) {
    return clusters.map(cluster => {
      // Si le cluster ne contient qu'un seul point
      if (cluster.length === 1) {
        return {
          centroid: { lat: cluster[0].lat, lon: cluster[0].lon },
          points: cluster,
          radius: 0,
          area: 0
        };
      }
      
      // Calculer le centroïde comme moyenne des coordonnées
      const centroid = this._calculateCentroid(cluster);
      
      // Calculer le rayon du cluster (distance max du centroïde)
      const radius = this._calculateMaxDistance(centroid, cluster);
      
      // Calculer la zone approximative (cercle basé sur le rayon)
      const area = Math.PI * radius * radius;
      
      return {
        centroid,
        points: cluster,
        radius,
        area
      };
    });
  }

  /**
   * Calcule le centroïde d'un ensemble de points
   * @private
   * @param {Array} points - Points à considérer
   * @returns {Object} Coordonnées du centroïde {lat, lon}
   */
  _calculateCentroid(points) {
    if (!points || points.length === 0) {
      return { lat: 0, lon: 0 };
    }
    
    if (points.length === 1) {
      return { lat: points[0].lat, lon: points[0].lon };
    }
    
    // Convertir en radians pour précision sur les longues distances
    const radianPoints = points.map(point => ({
      lat: (point.lat * Math.PI) / 180,
      lon: (point.lon * Math.PI) / 180
    }));
    
    let x = 0;
    let y = 0;
    let z = 0;
    
    // Calculer la somme des coordonnées cartésiennes
    radianPoints.forEach(point => {
      const cosLat = Math.cos(point.lat);
      x += cosLat * Math.cos(point.lon);
      y += cosLat * Math.sin(point.lon);
      z += Math.sin(point.lat);
    });
    
    // Calculer la moyenne
    x /= points.length;
    y /= points.length;
    z /= points.length;
    
    // Convertir de cartésien à sphérique
    const lon = Math.atan2(y, x);
    const hyp = Math.sqrt(x * x + y * y);
    const lat = Math.atan2(z, hyp);
    
    // Convertir en degrés
    return {
      lat: (lat * 180) / Math.PI,
      lon: (lon * 180) / Math.PI
    };
  }

  /**
   * Calcule la distance maximale entre un point central et un ensemble de points
   * @private
   * @param {Object} center - Point central {lat, lon}
   * @param {Array} points - Points à considérer
   * @returns {number} Distance maximale en kilomètres
   */
  _calculateMaxDistance(center, points) {
    if (!points || points.length === 0) {
      return 0;
    }
    
    return Math.max(...points.map(point => 
      this._calculateHaversineDistance(center.lat, center.lon, point.lat, point.lon)
    ));
  }

  /**
   * Calcule la distance de Haversine entre deux points
   * @private
   * @param {number} lat1 - Latitude du premier point
   * @param {number} lon1 - Longitude du premier point
   * @param {number} lat2 - Latitude du deuxième point
   * @param {number} lon2 - Longitude du deuxième point
   * @returns {number} Distance en kilomètres
   */
  _calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    // Rayon de la Terre en kilomètres
    const R = 6371;
    
    // Convertir en radians
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Calcule la surface d'une zone délimitée par des bornes
   * @private
   * @param {Object} bounds - Limites {north, south, east, west}
   * @returns {number} Surface approximative en km²
   */
  _calculateBoundsArea(bounds) {
    // Largeur approximative (en km)
    const width = this._calculateHaversineDistance(
      bounds.south,
      bounds.west,
      bounds.south,
      bounds.east
    );
    
    // Hauteur approximative (en km)
    const height = this._calculateHaversineDistance(
      bounds.south,
      bounds.west,
      bounds.north,
      bounds.west
    );
    
    return width * height;
  }

  /**
   * Génère une grille adaptative basée sur les limites
   * @private
   * @param {Object} bounds - Limites {north, south, east, west}
   * @param {number} cellSize - Taille approximative des cellules en km
   * @param {number} maxCells - Nombre maximum de cellules
   * @returns {Array} Cellules de la grille avec leurs limites
   */
  _generateGrid(bounds, cellSize, maxCells) {
    // Calculer la largeur et la hauteur de la zone en km
    const width = this._calculateHaversineDistance(
      bounds.south,
      bounds.west,
      bounds.south,
      bounds.east
    );
    
    const height = this._calculateHaversineDistance(
      bounds.south,
      bounds.west,
      bounds.north,
      bounds.west
    );
    
    // Calculer le nombre de cellules dans chaque dimension
    let cols = Math.ceil(width / cellSize);
    let rows = Math.ceil(height / cellSize);
    
    // Ajuster si nécessaire pour respecter le nombre maximum de cellules
    const totalCells = cols * rows;
    if (totalCells > maxCells) {
      const scaleFactor = Math.sqrt(maxCells / totalCells);
      cols = Math.max(1, Math.floor(cols * scaleFactor));
      rows = Math.max(1, Math.floor(rows * scaleFactor));
    }
    
    // Calculer la taille d'une cellule en degrés
    const cellWidth = (bounds.east - bounds.west) / cols;
    const cellHeight = (bounds.north - bounds.south) / rows;
    
    // Générer la grille
    const grid = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const south = bounds.south + row * cellHeight;
        const north = bounds.south + (row + 1) * cellHeight;
        const west = bounds.west + col * cellWidth;
        const east = bounds.west + (col + 1) * cellWidth;
        
        grid.push({
          row,
          col,
          bounds: { north, south, east, west },
          points: []
        });
      }
    }
    
    return grid;
  }

  /**
   * Assigne des points à des cellules d'une grille
   * @private
   * @param {Array} points - Points à assigner
   * @param {Array} grid - Grille de cellules
   * @returns {Array} Grille avec points assignés
   */
  _assignPointsToCells(points, grid) {
    // Copier la grille pour éviter de modifier l'original
    const filledGrid = grid.map(cell => ({ ...cell, points: [] }));
    
    // Assigner chaque point à la cellule appropriée
    points.forEach(point => {
      // Trouver la cellule qui contient ce point
      const cell = filledGrid.find(cell => 
        point.lat >= cell.bounds.south && 
        point.lat < cell.bounds.north &&
        point.lon >= cell.bounds.west && 
        point.lon < cell.bounds.east
      );
      
      if (cell) {
        cell.points.push(point);
      } else {
        // Si aucune cellule ne contient le point, l'assigner à la plus proche
        let minDistance = Infinity;
        let closestCell = null;
        
        filledGrid.forEach(cell => {
          // Calculer le centre de la cellule
          const cellCenter = {
            lat: (cell.bounds.north + cell.bounds.south) / 2,
            lon: (cell.bounds.east + cell.bounds.west) / 2
          };
          
          const distance = this._calculateHaversineDistance(
            point.lat, point.lon,
            cellCenter.lat, cellCenter.lon
          );
          
          if (distance < minDistance) {
            minDistance = distance;
            closestCell = cell;
          }
        });
        
        if (closestCell) {
          closestCell.points.push(point);
        }
      }
    });
    
    return filledGrid;
  }

  /**
   * Extrait les paramètres communs d'un ensemble de requêtes
   * @private
   * @param {Array} requests - Requêtes à analyser
   * @returns {Object} Paramètres communs
   */
  _getCommonRequestParams(requests) {
    if (!requests || requests.length === 0) {
      return {};
    }
    
    // Utiliser les paramètres de la première requête par défaut
    const commonParams = { ...requests[0] };
    
    // Supprimer les coordonnées et l'index original
    delete commonParams.lat;
    delete commonParams.lon;
    delete commonParams.originalIndex;
    
    return commonParams;
  }

  /**
   * Crée un mapping entre les requêtes originales et optimisées
   * @private
   * @param {Array} clusters - Clusters de points
   * @returns {Array} Mapping pour reconstruction
   */
  _createRequestMapping(clusters) {
    const mapping = [];
    
    clusters.forEach((cluster, clusterIndex) => {
      cluster.points.forEach(point => {
        if (point.originalIndex !== undefined) {
          mapping.push({
            originalIndex: point.originalIndex,
            requestIndex: clusterIndex
          });
        }
      });
    });
    
    // Trier par index original pour faciliter la reconstruction
    return mapping.sort((a, b) => a.originalIndex - b.originalIndex);
  }
}

// Singleton
const geoClusteringService = new GeoClusteringService();
module.exports = geoClusteringService;
