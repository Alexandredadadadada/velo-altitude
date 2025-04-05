// models/route-planner.model.js - Modèle pour le planificateur d'itinéraires avancé
const fs = require('fs');
const path = require('path');

/**
 * Classe représentant le modèle de données pour les itinéraires planifiés
 */
class RoutePlannerModel {
  constructor() {
    this.dataPath = path.join(__dirname, '../data/planned-routes.json');
    this.routes = this._loadRoutes();
    this.accommodationsPath = path.join(__dirname, '../data/accommodations.json');
    this.accommodations = this._loadAccommodations();
  }

  /**
   * Charge les données des itinéraires planifiés depuis le fichier JSON
   * @returns {Array} Liste des itinéraires
   * @private
   */
  _loadRoutes() {
    try {
      if (fs.existsSync(this.dataPath)) {
        const data = fs.readFileSync(this.dataPath, 'utf8');
        return JSON.parse(data);
      }
      // Retourne un tableau vide si le fichier n'existe pas encore
      return [];
    } catch (error) {
      console.error('Erreur lors du chargement des itinéraires planifiés:', error);
      return [];
    }
  }

  /**
   * Charge les données des hébergements cyclistes depuis le fichier JSON
   * @returns {Array} Liste des hébergements
   * @private
   */
  _loadAccommodations() {
    try {
      if (fs.existsSync(this.accommodationsPath)) {
        const data = fs.readFileSync(this.accommodationsPath, 'utf8');
        return JSON.parse(data);
      }
      // Retourne un tableau vide si le fichier n'existe pas encore
      return [];
    } catch (error) {
      console.error('Erreur lors du chargement des hébergements:', error);
      return [];
    }
  }

  /**
   * Enregistre les données des itinéraires dans le fichier JSON
   * @private
   */
  _saveRoutes() {
    try {
      // Crée le répertoire s'il n'existe pas
      const dir = path.dirname(this.dataPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.dataPath, JSON.stringify(this.routes, null, 2), 'utf8');
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement des itinéraires:', error);
    }
  }

  /**
   * Récupère tous les itinéraires
   * @param {Object} filters - Filtres à appliquer (thème, difficulté, durée, etc.)
   * @returns {Array} Liste d'itinéraires filtrés
   */
  getAllRoutes(filters = {}) {
    let filteredRoutes = [...this.routes];
    
    // Application des filtres
    if (filters.theme) {
      filteredRoutes = filteredRoutes.filter(route => 
        route.theme === filters.theme);
    }
    
    if (filters.difficulty) {
      filteredRoutes = filteredRoutes.filter(route => 
        route.difficulty === filters.difficulty);
    }
    
    if (filters.duration) {
      filteredRoutes = filteredRoutes.filter(route => 
        route.duration <= parseInt(filters.duration));
    }
    
    if (filters.region) {
      filteredRoutes = filteredRoutes.filter(route => 
        route.region === filters.region);
    }
    
    if (filters.country) {
      filteredRoutes = filteredRoutes.filter(route => 
        route.country === filters.country);
    }
    
    return filteredRoutes;
  }

  /**
   * Récupère un itinéraire par son ID
   * @param {string} id ID de l'itinéraire
   * @returns {Object|null} Détails de l'itinéraire ou null si non trouvé
   */
  getRouteById(id) {
    return this.routes.find(route => route.id === id) || null;
  }

  /**
   * Crée un nouvel itinéraire
   * @param {Object} routeData Données de l'itinéraire
   * @returns {Object} L'itinéraire créé
   */
  createRoute(routeData) {
    // Génération d'un ID unique si non fourni
    const newRoute = {
      id: routeData.id || Date.now().toString(),
      ...routeData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.routes.push(newRoute);
    this._saveRoutes();
    return newRoute;
  }

  /**
   * Met à jour un itinéraire existant
   * @param {string} id ID de l'itinéraire à mettre à jour
   * @param {Object} routeData Nouvelles données de l'itinéraire
   * @returns {Object|null} L'itinéraire mis à jour ou null si non trouvé
   */
  updateRoute(id, routeData) {
    const index = this.routes.findIndex(route => route.id === id);
    if (index === -1) return null;

    const updatedRoute = {
      ...this.routes[index],
      ...routeData,
      updatedAt: new Date().toISOString()
    };
    
    this.routes[index] = updatedRoute;
    this._saveRoutes();
    return updatedRoute;
  }

  /**
   * Supprime un itinéraire
   * @param {string} id ID de l'itinéraire à supprimer
   * @returns {boolean} Succès de la suppression
   */
  deleteRoute(id) {
    const initialLength = this.routes.length;
    this.routes = this.routes.filter(route => route.id !== id);
    
    if (initialLength !== this.routes.length) {
      this._saveRoutes();
      return true;
    }
    return false;
  }

  /**
   * Calcule le temps estimé pour un itinéraire en fonction du niveau du cycliste
   * @param {string} routeId ID de l'itinéraire
   * @param {string} cyclistLevel Niveau du cycliste (débutant, intermédiaire, avancé, expert)
   * @returns {Object} Temps estimé pour chaque segment et total
   */
  estimateTime(routeId, cyclistLevel) {
    const route = this.getRouteById(routeId);
    if (!route) return null;
    
    // Facteurs de vitesse moyenne par niveau (km/h)
    const speedFactors = {
      débutant: 15,
      intermédiaire: 20,
      avancé: 25,
      expert: 30
    };
    
    // Facteur de ralentissement par % de pente
    const gradientSlowdown = (gradient) => {
      if (gradient <= 2) return 1;
      if (gradient <= 5) return 0.85;
      if (gradient <= 8) return 0.7;
      if (gradient <= 12) return 0.5;
      return 0.35; // Pentes très raides > 12%
    };
    
    const baseSpeed = speedFactors[cyclistLevel] || speedFactors.intermédiaire;
    let totalTime = 0;
    const segmentTimes = [];
    
    // Calcul pour chaque segment
    for (const segment of route.segments) {
      const adjustedSpeed = baseSpeed * gradientSlowdown(segment.averageGradient);
      const segmentTime = (segment.distance / adjustedSpeed) * 60; // En minutes
      segmentTimes.push({
        name: segment.name,
        time: Math.round(segmentTime),
        timeFormatted: this._formatTime(segmentTime)
      });
      totalTime += segmentTime;
    }
    
    return {
      totalTime: Math.round(totalTime),
      totalTimeFormatted: this._formatTime(totalTime),
      segmentTimes
    };
  }

  /**
   * Convertit des minutes en format heures:minutes
   * @param {number} minutes Nombre de minutes
   * @returns {string} Temps formaté (HH:MM)
   * @private
   */
  _formatTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Calcule la difficulté globale d'un itinéraire
   * @param {string} routeId ID de l'itinéraire
   * @returns {Object} Score de difficulté et catégorie
   */
  calculateDifficulty(routeId) {
    const route = this.getRouteById(routeId);
    if (!route) return null;
    
    // Facteurs pour le calcul de difficulté
    const distanceFactor = 0.3; // 30% pour la distance
    const elevationFactor = 0.4; // 40% pour le dénivelé
    const gradientFactor = 0.3; // 30% pour la pente
    
    // Normalisation des valeurs
    const normalizedDistance = Math.min(route.totalDistance / 150, 1); // 150km considéré comme maximum
    const normalizedElevation = Math.min(route.totalElevation / 3000, 1); // 3000m considéré comme maximum
    const normalizedGradient = Math.min(route.maxGradient / 15, 1); // 15% considéré comme maximum
    
    // Calcul du score global (0-100)
    const difficultyScore = Math.round(
      (normalizedDistance * distanceFactor + 
       normalizedElevation * elevationFactor + 
       normalizedGradient * gradientFactor) * 100
    );
    
    // Attribution d'une catégorie
    let category;
    if (difficultyScore < 25) category = 'Facile';
    else if (difficultyScore < 50) category = 'Modéré';
    else if (difficultyScore < 75) category = 'Difficile';
    else category = 'Très difficile';
    
    return {
      score: difficultyScore,
      category
    };
  }

  /**
   * Trouve des hébergements le long d'un itinéraire
   * @param {string} routeId ID de l'itinéraire
   * @returns {Array} Liste d'hébergements proches de l'itinéraire
   */
  findAccommodations(routeId) {
    const route = this.getRouteById(routeId);
    if (!route) return [];
    
    // Extraction des coordonnées des points de l'itinéraire
    const routeCoordinates = route.segments.flatMap(segment => segment.coordinates || []);
    
    if (routeCoordinates.length === 0) return [];
    
    // Rayon de recherche (en km)
    const searchRadius = 5;
    
    // Filtrer les hébergements proches de l'itinéraire
    const nearbyAccommodations = this.accommodations.filter(accommodation => {
      // Vérifier si l'hébergement est proche d'au moins un point de l'itinéraire
      return routeCoordinates.some(coord => 
        this._calculateDistance(
          coord[0], coord[1], 
          accommodation.location.latitude, 
          accommodation.location.longitude
        ) <= searchRadius
      );
    });
    
    return nearbyAccommodations;
  }

  /**
   * Calcule la distance entre deux points géographiques (formule de Haversine)
   * @param {number} lat1 Latitude du point 1
   * @param {number} lon1 Longitude du point 1
   * @param {number} lat2 Latitude du point 2
   * @param {number} lon2 Longitude du point 2
   * @returns {number} Distance en kilomètres
   * @private
   */
  _calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this._toRad(lat2 - lat1);
    const dLon = this._toRad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this._toRad(lat1)) * Math.cos(this._toRad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
  }

  /**
   * Convertit des degrés en radians
   * @param {number} degrees Valeur en degrés
   * @returns {number} Valeur en radians
   * @private
   */
  _toRad(degrees) {
    return degrees * (Math.PI / 180);
  }
}

module.exports = new RoutePlannerModel();
