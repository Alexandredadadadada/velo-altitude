/**
 * Service de cartographie avancée
 * Gère les fonctionnalités de cartographie 3D, profiles d'élévation et planification d'itinéraires
 */

const NodeCache = require('node-cache');
const axios = require('axios');
const turf = require('@turf/turf');
const ColsService = require('./cols.service');
const RoutesService = require('./routes.service');
const WeatherService = require('./weather.service');
const StravaService = require('./strava.service');
const CacheService = require('./cache.service');

// Cache local pour les données cartographiques lourdes
const mapCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

// Configuration Mapbox
const MAPBOX_API_KEY = process.env.MAPBOX_API_KEY;
const MAPBOX_STYLE = process.env.MAPBOX_STYLE || 'mapbox://styles/mapbox/outdoors-v11';

/**
 * Service de cartographie avancée
 */
class AdvancedMappingService {
  /**
   * Initialise le service de cartographie
   */
  static initialize() {
    console.log('Service de cartographie avancée initialisé');
    // Précharger certaines données cartographiques courantes
    this.preloadCommonMapData();
  }

  /**
   * Précharge les données cartographiques fréquemment utilisées
   */
  static async preloadCommonMapData() {
    try {
      // Précharger les cols populaires
      const popularCols = await ColsService.getPopularCols(10);
      mapCache.set('popular_cols', popularCols);

      // Précharger les régions principales
      const mainRegions = await this.getMainRegions();
      mapCache.set('main_regions', mainRegions);
    } catch (error) {
      console.error('Erreur lors du préchargement des données cartographiques:', error);
    }
  }

  /**
   * Récupère les données d'élévation 3D pour une région spécifique
   * @param {Object} boundingBox - Boîte englobante de la région (coordonnées)
   * @param {number} resolution - Résolution du modèle d'élévation (10-1000)
   * @returns {Object} Données d'élévation au format compatible avec Three.js
   */
  static async get3DTerrainData(boundingBox, resolution = 100) {
    try {
      const cacheKey = `terrain_3d_${boundingBox.sw.lat}_${boundingBox.sw.lng}_${boundingBox.ne.lat}_${boundingBox.ne.lng}_${resolution}`;
      
      // Vérifier dans le cache
      const cachedData = mapCache.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      // Formater la requête pour l'API d'élévation
      const bbox = `${boundingBox.sw.lng},${boundingBox.sw.lat},${boundingBox.ne.lng},${boundingBox.ne.lat}`;
      
      // Récupérer les données d'élévation depuis Mapbox ou autre service
      const response = await axios.get(`https://api.mapbox.com/v4/mapbox.terrain-rgb/auto/500x500.pngraw`, {
        params: {
          access_token: MAPBOX_API_KEY,
          bbox
        },
        responseType: 'arraybuffer'
      });

      // Traiter les données d'élévation pour Three.js
      // Cette étape serait implémentée côté client avec Three.js
      // Ici, nous préparons juste les données brutes
      
      // Simuler le traitement des données pour l'exemple
      const terrainData = {
        elevationData: Buffer.from(response.data).toString('base64'),
        boundingBox,
        resolution,
        format: 'mapbox-terrain-rgb'
      };

      // Mettre en cache
      mapCache.set(cacheKey, terrainData, 86400); // 24 heures
      
      return terrainData;
    } catch (error) {
      console.error(`Erreur lors de la récupération des données de terrain 3D: ${error.message}`);
      throw new Error(`Impossible de récupérer les données de terrain 3D: ${error.message}`);
    }
  }

  /**
   * Récupère le profil d'élévation pour un itinéraire donné
   * @param {Array} coordinates - Tableau de coordonnées [lng, lat]
   * @returns {Object} Profil d'élévation avec points, statistiques et visualisation
   */
  static async getElevationProfile(coordinates) {
    try {
      if (!coordinates || coordinates.length < 2) {
        throw new Error('Coordonnées insuffisantes pour générer un profil d\'élévation');
      }

      // Générer une clé unique pour ces coordonnées
      const coordHash = coordinates.map(c => `${c[0].toFixed(5)},${c[1].toFixed(5)}`).join('|');
      const cacheKey = `elevation_profile_${coordHash}`;
      
      // Vérifier dans le cache
      const cachedProfile = mapCache.get(cacheKey);
      if (cachedProfile) {
        return cachedProfile;
      }

      // Préparer les points pour la requête d'élévation
      const encodedLine = this._encodePolyline(coordinates);
      
      // Récupérer les données d'élévation
      const response = await axios.get('https://api.mapbox.com/v4/mapbox.mapbox-terrain-v2/tilequery/geojson', {
        params: {
          access_token: MAPBOX_API_KEY,
          layers: 'contour',
          geometry: encodedLine,
          limit: 100
        }
      });

      const elevationData = response.data;
      
      // Calculer le profil d'élévation
      const profile = {
        points: [],
        distance: 0,
        elevationGain: 0,
        elevationLoss: 0,
        maxElevation: -Infinity,
        minElevation: Infinity,
        avgGradient: 0,
        steepestGradient: 0
      };
      
      // Traitement des données d'élévation pour créer le profil
      let previousElevation = null;
      let totalDistance = 0;

      for (let i = 0; i < elevationData.features.length; i++) {
        const feature = elevationData.features[i];
        const elevation = feature.properties.ele;
        
        // Distance depuis le début de l'itinéraire
        if (i > 0) {
          const from = turf.point([coordinates[i-1][0], coordinates[i-1][1]]);
          const to = turf.point([coordinates[i][0], coordinates[i][1]]);
          const segmentDistance = turf.distance(from, to, { units: 'kilometers' });
          totalDistance += segmentDistance;
        }
        
        // Mise à jour des statistiques du profil
        if (elevation > profile.maxElevation) profile.maxElevation = elevation;
        if (elevation < profile.minElevation) profile.minElevation = elevation;
        
        if (previousElevation !== null) {
          const elevationDiff = elevation - previousElevation;
          if (elevationDiff > 0) {
            profile.elevationGain += elevationDiff;
          } else {
            profile.elevationLoss += Math.abs(elevationDiff);
          }
          
          // Calculer le gradient pour ce segment
          if (i > 0) {
            const from = turf.point([coordinates[i-1][0], coordinates[i-1][1]]);
            const to = turf.point([coordinates[i][0], coordinates[i][1]]);
            const segmentDistance = turf.distance(from, to, { units: 'kilometers' }) * 1000; // en mètres
            
            if (segmentDistance > 0) {
              const gradient = (elevationDiff / segmentDistance) * 100;
              if (Math.abs(gradient) > Math.abs(profile.steepestGradient)) {
                profile.steepestGradient = gradient;
              }
            }
          }
        }
        
        previousElevation = elevation;
        
        // Ajouter le point au profil
        profile.points.push({
          distance: totalDistance,
          elevation,
          coordinates: [coordinates[i][0], coordinates[i][1]]
        });
      }
      
      // Finaliser les statistiques
      profile.distance = totalDistance;
      profile.avgGradient = (profile.elevationGain / (totalDistance * 1000)) * 100;
      
      // Données pour la visualisation (pour D3.js)
      profile.visualization = {
        x: profile.points.map(p => p.distance),
        y: profile.points.map(p => p.elevation)
      };
      
      // Mettre en cache
      mapCache.set(cacheKey, profile, 86400); // 24 heures
      
      return profile;
    } catch (error) {
      console.error(`Erreur lors de la génération du profil d'élévation: ${error.message}`);
      throw new Error(`Impossible de générer le profil d'élévation: ${error.message}`);
    }
  }

  /**
   * Récupère les segments Strava populaires dans une région
   * @param {Object} boundingBox - Boîte englobante de la région
   * @param {number} limit - Nombre maximum de segments à récupérer
   * @returns {Array} Segments Strava populaires
   */
  static async getPopularStravaSegments(boundingBox, limit = 20) {
    try {
      const cacheKey = `strava_segments_${boundingBox.sw.lat}_${boundingBox.sw.lng}_${boundingBox.ne.lat}_${boundingBox.ne.lng}_${limit}`;
      
      // Vérifier dans le cache
      const cachedSegments = CacheService.getCache().get(cacheKey);
      if (cachedSegments) {
        return cachedSegments;
      }

      // Utiliser le service Strava pour récupérer les segments populaires
      const segments = await StravaService.exploreSegments({
        bounds: [
          boundingBox.sw.lat,
          boundingBox.sw.lng,
          boundingBox.ne.lat,
          boundingBox.ne.lng
        ],
        activity_type: 'cycling',
        min_cat: 0,
        max_cat: 5
      });
      
      // Limiter le nombre de segments
      const limitedSegments = segments.slice(0, limit);
      
      // Enrichir les segments avec des métadonnées supplémentaires
      const enhancedSegments = await Promise.all(limitedSegments.map(async segment => {
        try {
          const detailedSegment = await StravaService.getSegment(segment.id);
          return {
            ...segment,
            elevation_profile: detailedSegment.elevation_profile,
            average_grade: detailedSegment.average_grade,
            maximum_grade: detailedSegment.maximum_grade,
            effort_count: detailedSegment.effort_count,
            athlete_count: detailedSegment.athlete_count,
            star_count: detailedSegment.star_count
          };
        } catch (error) {
          console.warn(`Impossible de récupérer les détails pour le segment ${segment.id}:`, error.message);
          return segment;
        }
      }));
      
      // Mettre en cache
      CacheService.getCache().set(cacheKey, enhancedSegments, 3600); // 1 heure
      
      return enhancedSegments;
    } catch (error) {
      console.error(`Erreur lors de la récupération des segments Strava: ${error.message}`);
      throw new Error(`Impossible de récupérer les segments Strava: ${error.message}`);
    }
  }

  /**
   * Planifie un itinéraire avec estimation de temps et difficulté
   * @param {Array} waypoints - Points de l'itinéraire [[lng, lat], ...]
   * @param {Object} options - Options de planification (type de vélo, niveau du cycliste, etc.)
   * @returns {Object} Itinéraire planifié avec estimations
   */
  static async planRoute(waypoints, options = {}) {
    try {
      if (!waypoints || waypoints.length < 2) {
        throw new Error('Au moins deux points sont nécessaires pour planifier un itinéraire');
      }

      // Générer une clé unique pour cette requête
      const waypointsStr = waypoints.map(wp => `${wp[0].toFixed(5)},${wp[1].toFixed(5)}`).join('|');
      const optionsStr = JSON.stringify(options);
      const cacheKey = `route_plan_${waypointsStr}_${optionsStr}`;
      
      // Vérifier dans le cache
      const cachedRoute = CacheService.getCache().get(cacheKey);
      if (cachedRoute) {
        return cachedRoute;
      }

      // Paramètres par défaut
      const defaults = {
        profile: 'cycling',         // cycling, road, mountain
        cyclistLevel: 'intermediate', // beginner, intermediate, advanced, pro
        avoidTraffic: true,
        avoidHills: false,
        preferScenic: false,
        includeWeather: true,
        includeTraffic: true
      };
      
      // Fusionner avec les options fournies
      const routeOptions = { ...defaults, ...options };
      
      // Préparer les waypoints pour l'API de directions
      const coordinates = waypoints.map(wp => `${wp[0]},${wp[1]}`).join(';');
      
      // Appeler l'API Mapbox pour obtenir l'itinéraire
      const response = await axios.get(`https://api.mapbox.com/directions/v5/mapbox/${routeOptions.profile}/${coordinates}`, {
        params: {
          access_token: MAPBOX_API_KEY,
          geometries: 'geojson',
          steps: true,
          annotations: 'distance,duration,speed,congestion',
          overview: 'full',
          alternatives: true,
          exclude: routeOptions.avoidTraffic ? 'motorway' : ''
        }
      });

      const routeData = response.data;
      
      // Récupérer le profil d'élévation
      const elevationProfile = await this.getElevationProfile(routeData.routes[0].geometry.coordinates);
      
      // Calculer l'estimation du temps en fonction du niveau du cycliste
      const baseTime = routeData.routes[0].duration; // en secondes
      const levelFactors = {
        beginner: 1.3,
        intermediate: 1.0,
        advanced: 0.85,
        pro: 0.7
      };
      
      const estimatedTime = baseTime * levelFactors[routeOptions.cyclistLevel];
      
      // Calculer la difficulté de l'itinéraire (1-10)
      const difficulty = this._calculateRouteDifficulty(
        routeData.routes[0].distance,
        elevationProfile.elevationGain,
        elevationProfile.steepestGradient
      );
      
      // Intégrer les données météo si demandé
      let weatherData = null;
      if (routeOptions.includeWeather) {
        try {
          // Échantillonner quelques points le long de l'itinéraire pour la météo
          const route = routeData.routes[0].geometry.coordinates;
          const samplePoints = [
            route[0], // départ
            route[Math.floor(route.length / 2)], // milieu
            route[route.length - 1] // arrivée
          ];
          
          weatherData = await Promise.all(samplePoints.map(async point => {
            return WeatherService.getCurrentWeather({
              lat: point[1],
              lng: point[0]
            });
          }));
        } catch (error) {
          console.warn('Impossible de récupérer les données météo:', error.message);
        }
      }
      
      // Intégrer les données de trafic si demandé
      let trafficData = null;
      if (routeOptions.includeTraffic) {
        try {
          // Récupérer les segments de l'itinéraire avec congestion
          trafficData = routeData.routes[0].legs.flatMap(leg => 
            leg.steps.map(step => ({
              location: step.maneuver.location,
              congestion: step.congestion || 'unknown'
            }))
          );
        } catch (error) {
          console.warn('Impossible de récupérer les données de trafic:', error.message);
        }
      }
      
      // Construire l'objet résultat
      const routePlan = {
        route: routeData.routes[0].geometry,
        distance: routeData.routes[0].distance, // en mètres
        duration: {
          base: routeData.routes[0].duration, // en secondes
          estimated: estimatedTime, // en secondes
          formattedEstimated: this._formatDuration(estimatedTime)
        },
        elevationProfile,
        difficulty: {
          score: difficulty,
          level: this._getDifficultyLevel(difficulty),
          factors: {
            distance: routeData.routes[0].distance,
            elevationGain: elevationProfile.elevationGain,
            steepestGradient: elevationProfile.steepestGradient
          }
        },
        weather: weatherData,
        traffic: trafficData,
        alternatives: routeData.routes.slice(1).map(route => ({
          geometry: route.geometry,
          distance: route.distance,
          duration: route.duration
        }))
      };
      
      // Mettre en cache
      CacheService.getCache().set(cacheKey, routePlan, 3600); // 1 heure
      
      return routePlan;
    } catch (error) {
      console.error(`Erreur lors de la planification d'itinéraire: ${error.message}`);
      throw new Error(`Impossible de planifier l'itinéraire: ${error.message}`);
    }
  }

  /**
   * Récupère les données météo et trafic en temps réel pour une carte
   * @param {Object} boundingBox - Boîte englobante de la région
   * @returns {Object} Données météo et trafic pour superposition sur la carte
   */
  static async getRealTimeOverlays(boundingBox) {
    try {
      const cacheKey = `overlays_${boundingBox.sw.lat}_${boundingBox.sw.lng}_${boundingBox.ne.lat}_${boundingBox.ne.lng}`;
      
      // Expiration courte pour les données en temps réel
      const cachedData = CacheService.getCache().get(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      // Calculer le centre de la bounding box
      const center = {
        lat: (boundingBox.sw.lat + boundingBox.ne.lat) / 2,
        lng: (boundingBox.sw.lng + boundingBox.ne.lng) / 2
      };
      
      // Récupérer les données météo
      const weatherData = await WeatherService.getCurrentWeather(center);
      
      // Récupérer les données de trafic (simulé ici, serait remplacé par un appel API réel)
      const trafficData = {
        timestamp: new Date().toISOString(),
        attribution: "Powered by Mapbox Traffic API",
        url: `https://api.mapbox.com/v4/mapbox.mapbox-traffic-v1/tiles/{z}/{x}/{y}.mvt?access_token=${MAPBOX_API_KEY}`
      };
      
      const overlays = {
        weather: {
          current: weatherData,
          radar: {
            timestamp: new Date().toISOString(),
            attribution: "Powered by Weather API",
            url: `https://api.rainviewer.com/public/weather-maps.json`
          }
        },
        traffic: trafficData
      };
      
      // Mettre en cache avec une TTL courte
      CacheService.getCache().set(cacheKey, overlays, 300); // 5 minutes
      
      return overlays;
    } catch (error) {
      console.error(`Erreur lors de la récupération des données en temps réel: ${error.message}`);
      throw new Error(`Impossible de récupérer les données en temps réel: ${error.message}`);
    }
  }

  /**
   * Récupère les régions principales pour le préchargement
   * @returns {Array} Régions principales
   */
  static async getMainRegions() {
    // Cette méthode simulerait un appel à un service géographique
    // Pour l'exemple, nous retournons des données statiques
    return [
      {
        name: "Vosges",
        center: { lat: 48.099, lng: 7.075 },
        boundingBox: {
          sw: { lat: 47.739, lng: 6.524 },
          ne: { lat: 48.459, lng: 7.625 }
        }
      },
      {
        name: "Alpes",
        center: { lat: 45.917, lng: 6.867 },
        boundingBox: {
          sw: { lat: 45.517, lng: 6.467 },
          ne: { lat: 46.317, lng: 7.267 }
        }
      },
      {
        name: "Pyrénées",
        center: { lat: 42.633, lng: 0.983 },
        boundingBox: {
          sw: { lat: 42.233, lng: 0.583 },
          ne: { lat: 43.033, lng: 1.383 }
        }
      }
    ];
  }

  /**
   * Encode un tableau de coordonnées au format polyline pour les API
   * @private
   * @param {Array} coordinates - Tableau de coordonnées [lng, lat]
   * @returns {string} Polyline encodée
   */
  static _encodePolyline(coordinates) {
    // Implémentation simplifiée de l'algorithme d'encodage polyline
    // Dans un cas réel, utilisez une bibliothèque comme @mapbox/polyline
    return coordinates.map(c => `${c[0]},${c[1]}`).join(';');
  }

  /**
   * Calcule le niveau de difficulté d'un itinéraire (1-10)
   * @private
   * @param {number} distance - Distance en mètres
   * @param {number} elevationGain - Dénivelé positif en mètres
   * @param {number} steepestGradient - Pente la plus raide en pourcentage
   * @returns {number} Score de difficulté (1-10)
   */
  static _calculateRouteDifficulty(distance, elevationGain, steepestGradient) {
    // Distance (en km) facteur: jusqu'à 3 points
    const distanceFactor = Math.min(3, (distance / 1000) / 40);
    
    // Dénivelé facteur: jusqu'à 4 points
    const elevationFactor = Math.min(4, elevationGain / 500);
    
    // Pente facteur: jusqu'à 3 points
    const gradientFactor = Math.min(3, Math.abs(steepestGradient) / 5);
    
    // Calculer le score total et limiter entre 1 et 10
    const difficultyScore = Math.max(1, Math.min(10, Math.round(distanceFactor + elevationFactor + gradientFactor)));
    
    return difficultyScore;
  }

  /**
   * Obtient le niveau de difficulté textuel à partir du score
   * @private
   * @param {number} score - Score de difficulté (1-10)
   * @returns {string} Niveau de difficulté
   */
  static _getDifficultyLevel(score) {
    if (score <= 2) return 'Très facile';
    if (score <= 4) return 'Facile';
    if (score <= 6) return 'Modéré';
    if (score <= 8) return 'Difficile';
    return 'Très difficile';
  }

  /**
   * Formate une durée en secondes en chaîne lisible
   * @private
   * @param {number} seconds - Durée en secondes
   * @returns {string} Durée formatée
   */
  static _formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours === 0) {
      return `${minutes} min`;
    } else {
      return `${hours}h ${minutes}min`;
    }
  }
}

module.exports = AdvancedMappingService;
