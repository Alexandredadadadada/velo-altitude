/**
 * Contrôleur de cartographie avancée
 * Gère les endpoints API pour les fonctionnalités de cartographie 3D et analytique
 */

const AdvancedMappingService = require('../services/advanced-mapping.service');
const { validateBoundingBox, validateWaypoints } = require('../helpers/validation.helper');
const { handleError } = require('../helpers/error.helper');
const CacheMiddleware = require('../middlewares/cache.middleware');

/**
 * Contrôleur pour les fonctionnalités de cartographie avancée
 */
class AdvancedMappingController {
  /**
   * Récupère les données de terrain 3D pour une région
   * @param {*} req - Requête Express
   * @param {*} res - Réponse Express
   */
  async get3DTerrainData(req, res) {
    try {
      const { sw_lat, sw_lng, ne_lat, ne_lng, resolution } = req.query;
      
      // Valider les paramètres
      const boundingBox = {
        sw: { lat: parseFloat(sw_lat), lng: parseFloat(sw_lng) },
        ne: { lat: parseFloat(ne_lat), lng: parseFloat(ne_lng) }
      };
      
      if (!validateBoundingBox(boundingBox)) {
        return res.status(400).json({
          success: false,
          message: 'Paramètres de bounding box invalides',
          error: 'INVALID_PARAMETERS'
        });
      }
      
      // Limiter la taille de la région pour des raisons de performance
      const latDiff = Math.abs(boundingBox.ne.lat - boundingBox.sw.lat);
      const lngDiff = Math.abs(boundingBox.ne.lng - boundingBox.sw.lng);
      
      if (latDiff > 1 || lngDiff > 1) {
        return res.status(400).json({
          success: false,
          message: 'La région demandée est trop grande pour les données 3D. Limitez à 1 degré maximum.',
          error: 'REGION_TOO_LARGE'
        });
      }
      
      // Récupérer les données de terrain
      const terrainData = await AdvancedMappingService.get3DTerrainData(
        boundingBox,
        resolution ? parseInt(resolution) : 100
      );
      
      res.json({
        success: true,
        data: terrainData
      });
    } catch (error) {
      handleError(res, error, 'Erreur lors de la récupération des données de terrain 3D');
    }
  }

  /**
   * Récupère le profil d'élévation pour un itinéraire
   * @param {*} req - Requête Express
   * @param {*} res - Réponse Express
   */
  async getElevationProfile(req, res) {
    try {
      // Extraire les coordonnées de la requête
      let coordinates;
      
      if (req.query.coordinates) {
        // Format: lng1,lat1|lng2,lat2|...
        coordinates = req.query.coordinates.split('|').map(pair => {
          const [lng, lat] = pair.split(',').map(Number);
          return [lng, lat];
        });
      } else if (req.body.coordinates) {
        // Format JSON: [[lng1, lat1], [lng2, lat2], ...]
        coordinates = req.body.coordinates;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Paramètre "coordinates" manquant',
          error: 'MISSING_PARAMETERS'
        });
      }
      
      if (!validateWaypoints(coordinates)) {
        return res.status(400).json({
          success: false,
          message: 'Format de coordonnées invalide',
          error: 'INVALID_COORDINATES'
        });
      }
      
      // Récupérer le profil d'élévation
      const elevationProfile = await AdvancedMappingService.getElevationProfile(coordinates);
      
      res.json({
        success: true,
        data: elevationProfile
      });
    } catch (error) {
      handleError(res, error, 'Erreur lors de la récupération du profil d\'élévation');
    }
  }

  /**
   * Récupère les segments Strava populaires dans une région
   * @param {*} req - Requête Express
   * @param {*} res - Réponse Express
   */
  async getPopularStravaSegments(req, res) {
    try {
      const { sw_lat, sw_lng, ne_lat, ne_lng, limit } = req.query;
      
      // Valider les paramètres
      const boundingBox = {
        sw: { lat: parseFloat(sw_lat), lng: parseFloat(sw_lng) },
        ne: { lat: parseFloat(ne_lat), lng: parseFloat(ne_lng) }
      };
      
      if (!validateBoundingBox(boundingBox)) {
        return res.status(400).json({
          success: false,
          message: 'Paramètres de bounding box invalides',
          error: 'INVALID_PARAMETERS'
        });
      }
      
      // Récupérer les segments
      const segments = await AdvancedMappingService.getPopularStravaSegments(
        boundingBox,
        limit ? parseInt(limit) : 20
      );
      
      res.json({
        success: true,
        data: segments
      });
    } catch (error) {
      handleError(res, error, 'Erreur lors de la récupération des segments Strava');
    }
  }

  /**
   * Planifie un itinéraire avec estimation de temps et difficulté
   * @param {*} req - Requête Express
   * @param {*} res - Réponse Express
   */
  async planRoute(req, res) {
    try {
      const { waypoints, options } = req.body;
      
      if (!waypoints || !Array.isArray(waypoints) || waypoints.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Au moins deux waypoints sont nécessaires',
          error: 'INVALID_PARAMETERS'
        });
      }
      
      if (!validateWaypoints(waypoints)) {
        return res.status(400).json({
          success: false,
          message: 'Format de waypoints invalide',
          error: 'INVALID_WAYPOINTS'
        });
      }
      
      // Planifier l'itinéraire
      const routePlan = await AdvancedMappingService.planRoute(waypoints, options || {});
      
      res.json({
        success: true,
        data: routePlan
      });
    } catch (error) {
      handleError(res, error, 'Erreur lors de la planification d\'itinéraire');
    }
  }

  /**
   * Récupère les données météo et trafic en temps réel pour une carte
   * @param {*} req - Requête Express
   * @param {*} res - Réponse Express
   */
  async getRealTimeOverlays(req, res) {
    try {
      const { sw_lat, sw_lng, ne_lat, ne_lng } = req.query;
      
      // Valider les paramètres
      const boundingBox = {
        sw: { lat: parseFloat(sw_lat), lng: parseFloat(sw_lng) },
        ne: { lat: parseFloat(ne_lat), lng: parseFloat(ne_lng) }
      };
      
      if (!validateBoundingBox(boundingBox)) {
        return res.status(400).json({
          success: false,
          message: 'Paramètres de bounding box invalides',
          error: 'INVALID_PARAMETERS'
        });
      }
      
      // Récupérer les overlays
      const overlays = await AdvancedMappingService.getRealTimeOverlays(boundingBox);
      
      res.json({
        success: true,
        data: overlays
      });
    } catch (error) {
      handleError(res, error, 'Erreur lors de la récupération des données en temps réel');
    }
  }
}

module.exports = new AdvancedMappingController();
