// controllers/route-alternatives.controller.js - Contrôleur pour les itinéraires alternatifs
const routeAlternativesModel = require('../models/route-alternatives.model');
const routePlannerModel = require('../models/route-planner.model');

/**
 * Contrôleur pour la gestion des itinéraires alternatifs
 */
class RouteAlternativesController {
  /**
   * Génère des itinéraires alternatifs basés sur les conditions météo
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async getWeatherBasedAlternatives(req, res) {
    try {
      const { routeId } = req.params;
      const { precipitation, temperature, windSpeed, stormRisk } = req.query;
      
      // Vérifier si l'itinéraire existe
      const route = routePlannerModel.getRouteById(routeId);
      if (!route) {
        return res.status(404).json({
          status: 'error',
          message: `Itinéraire avec l'ID ${routeId} non trouvé`
        });
      }
      
      // Vérifier si les données météo sont fournies
      if (!precipitation && !temperature && !windSpeed) {
        return res.status(400).json({
          status: 'error',
          message: 'Fournir au moins une donnée météo (precipitation, temperature, windSpeed)'
        });
      }
      
      // Construire l'objet de conditions météo
      const weatherConditions = {
        precipitation: precipitation ? parseFloat(precipitation) : 0,
        temperature: temperature ? parseFloat(temperature) : 20,
        windSpeed: windSpeed ? parseFloat(windSpeed) : 0,
        stormRisk: stormRisk === 'true'
      };
      
      // Générer les alternatives
      const alternatives = await routeAlternativesModel.generateWeatherBasedAlternatives(
        routeId, 
        weatherConditions
      );
      
      return res.status(200).json({
        status: 'success',
        data: alternatives
      });
    } catch (error) {
      console.error('Erreur lors de la génération d\'alternatives basées sur la météo:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Une erreur est survenue lors de la génération d\'alternatives',
        error: error.message
      });
    }
  }

  /**
   * Génère des variantes d'itinéraires adaptées au profil du cycliste
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async getProfileBasedRoutes(req, res) {
    try {
      const { routeId } = req.params;
      const { level, withChildren, preferences } = req.body;
      
      // Vérifier si l'itinéraire existe
      const route = routePlannerModel.getRouteById(routeId);
      if (!route) {
        return res.status(404).json({
          status: 'error',
          message: `Itinéraire avec l'ID ${routeId} non trouvé`
        });
      }
      
      // Vérifier si le profil du cycliste est fourni
      if (!level) {
        return res.status(400).json({
          status: 'error',
          message: 'Le niveau du cycliste est requis (beginner, intermediate, advanced, expert)'
        });
      }
      
      // Construire l'objet de profil
      const cyclistProfile = {
        level,
        withChildren: withChildren === 'true' || withChildren === true,
        preferences: preferences ? preferences.split(',') : []
      };
      
      // Générer les variantes
      const profileBasedRoutes = await routeAlternativesModel.generateProfileBasedRoutes(
        routeId, 
        cyclistProfile
      );
      
      return res.status(200).json({
        status: 'success',
        data: profileBasedRoutes
      });
    } catch (error) {
      console.error('Erreur lors de la génération de variantes basées sur le profil:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Une erreur est survenue lors de la génération de variantes',
        error: error.message
      });
    }
  }

  /**
   * Récupère toutes les variantes disponibles pour un itinéraire
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async getAllVariants(req, res) {
    try {
      const { routeId } = req.params;
      
      // Vérifier si l'itinéraire existe
      const route = routePlannerModel.getRouteById(routeId);
      if (!route) {
        return res.status(404).json({
          status: 'error',
          message: `Itinéraire avec l'ID ${routeId} non trouvé`
        });
      }
      
      // Générer les profils types pour obtenir toutes les variantes
      const defaultProfiles = [
        { level: 'beginner', withChildren: true, preferences: ['relaxed'] },
        { level: 'intermediate', withChildren: false, preferences: ['cultural'] },
        { level: 'advanced', withChildren: false, preferences: ['performance'] }
      ];
      
      // Récupérer toutes les variantes
      const allVariants = [];
      
      for (const profile of defaultProfiles) {
        const profileVariants = await routeAlternativesModel.generateProfileBasedRoutes(
          routeId, 
          profile
        );
        
        allVariants.push(...profileVariants.variants);
      }
      
      // Filtrer les doublons (par id)
      const uniqueVariants = allVariants.filter((variant, index, self) =>
        index === self.findIndex(v => v.id === variant.id)
      );
      
      return res.status(200).json({
        status: 'success',
        data: {
          originalRoute: route,
          variants: uniqueVariants
        }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des variantes:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Une erreur est survenue lors de la récupération des variantes',
        error: error.message
      });
    }
  }
}

module.exports = new RouteAlternativesController();
