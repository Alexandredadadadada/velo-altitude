/**
 * Contrôleur pour les fonctionnalités météo liées aux itinéraires
 */

const routeWeatherService = require('../services/route-weather.service');
const weatherNotificationService = require('../services/weather-notification.service');
const cacheMiddleware = require('../middleware/cache.middleware');
const logger = require('../utils/logger');

/**
 * Contrôleur pour les prévisions météo et recommandations d'itinéraires
 */
class RouteWeatherController {
  /**
   * Récupère les prévisions météo pour un itinéraire spécifique
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  static async getRouteWeatherForecast(req, res) {
    try {
      const { routeId } = req.params;
      const options = {
        startTime: req.query.startTime,
        forceRefresh: req.query.forceRefresh === 'true'
      };
      
      logger.debug(`Demande de prévisions météo pour l'itinéraire ${routeId}`, {
        routeId,
        options
      });
      
      const forecast = await routeWeatherService.getRouteWeatherForecast(routeId, options);
      
      return res.status(200).json({
        success: true,
        data: forecast
      });
    } catch (error) {
      logger.error('Erreur lors de la récupération des prévisions météo pour l\'itinéraire', {
        error: error.message,
        routeId: req.params.routeId
      });
      
      return res.status(500).json({
        success: false,
        message: `Erreur lors de la récupération des prévisions météo: ${error.message}`
      });
    }
  }
  
  /**
   * Trouve les meilleurs créneaux météo pour un itinéraire
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  static async findBestWeatherTimeSlots(req, res) {
    try {
      const { routeId } = req.params;
      const options = {
        startDate: req.query.startDate ? new Date(req.query.startDate) : new Date(),
        endDate: req.query.endDate ? new Date(req.query.endDate) : new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        timeSlotDuration: parseInt(req.query.duration || '3', 10),
        onlyDaytime: req.query.onlyDaytime !== 'false',
        activityType: req.query.activityType || 'cycling'
      };
      
      logger.debug(`Recherche des meilleurs créneaux météo pour l'itinéraire ${routeId}`, {
        routeId,
        options
      });
      
      const timeSlots = await routeWeatherService.findBestWeatherTimeSlots(routeId, options);
      
      return res.status(200).json({
        success: true,
        data: timeSlots
      });
    } catch (error) {
      logger.error('Erreur lors de la recherche des meilleurs créneaux météo', {
        error: error.message,
        routeId: req.params.routeId
      });
      
      return res.status(500).json({
        success: false,
        message: `Erreur lors de la recherche des meilleurs créneaux météo: ${error.message}`
      });
    }
  }
  
  /**
   * Recommande des itinéraires en fonction des conditions météo
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  static async recommendRoutesByWeather(req, res) {
    try {
      const userId = req.user.id;
      const options = {
        location: req.query.lat && req.query.lon 
          ? { lat: parseFloat(req.query.lat), lon: parseFloat(req.query.lon) } 
          : null,
        maxDistance: parseInt(req.query.maxDistance || '50', 10),
        maxResults: parseInt(req.query.maxResults || '5', 10),
        activityType: req.query.activityType || 'cycling',
        minRating: parseFloat(req.query.minRating || '3')
      };
      
      logger.debug(`Recommandation d'itinéraires basée sur la météo pour l'utilisateur ${userId}`, {
        userId,
        options
      });
      
      const recommendations = await routeWeatherService.recommendRoutesByWeather(userId, options);
      
      return res.status(200).json({
        success: true,
        data: recommendations
      });
    } catch (error) {
      logger.error('Erreur lors de la recommandation d\'itinéraires basée sur la météo', {
        error: error.message,
        userId: req.user.id
      });
      
      return res.status(500).json({
        success: false,
        message: `Erreur lors de la recommandation d'itinéraires: ${error.message}`
      });
    }
  }
  
  /**
   * Configure des alertes météo pour les itinéraires favoris
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  static async setupFavoriteRoutesWeatherAlerts(req, res) {
    try {
      const userId = req.user.id;
      const alertConfig = req.body;
      
      logger.debug(`Configuration des alertes météo pour les itinéraires favoris de l'utilisateur ${userId}`, {
        userId,
        config: alertConfig
      });
      
      const result = await routeWeatherService.setupFavoriteRoutesWeatherAlerts(userId, alertConfig);
      
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erreur lors de la configuration des alertes météo', {
        error: error.message,
        userId: req.user.id
      });
      
      return res.status(500).json({
        success: false,
        message: `Erreur lors de la configuration des alertes météo: ${error.message}`
      });
    }
  }
  
  /**
   * Génère des données pour la visualisation météo sur une carte
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  static async generateWeatherMapVisualization(req, res) {
    try {
      const bounds = {
        south: parseFloat(req.query.south),
        west: parseFloat(req.query.west),
        north: parseFloat(req.query.north),
        east: parseFloat(req.query.east)
      };
      
      // Vérifier que les limites sont valides
      if (isNaN(bounds.south) || isNaN(bounds.west) || isNaN(bounds.north) || isNaN(bounds.east)) {
        return res.status(400).json({
          success: false,
          message: 'Limites de carte invalides'
        });
      }
      
      const options = {
        resolution: req.query.resolution || 'medium',
        layers: (req.query.layers || 'temperature,precipitation,wind').split(','),
        forecastTime: req.query.forecastTime ? parseInt(req.query.forecastTime, 10) : Math.floor(Date.now() / 1000)
      };
      
      logger.debug('Génération de visualisation météo pour une carte', {
        bounds,
        options
      });
      
      const visualization = await routeWeatherService.generateWeatherMapVisualization(bounds, options);
      
      return res.status(200).json({
        success: true,
        data: visualization
      });
    } catch (error) {
      logger.error('Erreur lors de la génération de la visualisation météo', {
        error: error.message
      });
      
      return res.status(500).json({
        success: false,
        message: `Erreur lors de la génération de la visualisation météo: ${error.message}`
      });
    }
  }
  
  /**
   * Obtient l'état actuel des alertes météo pour un utilisateur
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  static async getUserWeatherAlertStatus(req, res) {
    try {
      const userId = req.user.id;
      
      logger.debug(`Récupération du statut des alertes météo pour l'utilisateur ${userId}`, {
        userId
      });
      
      // Récupérer les informations sur les abonnements de l'utilisateur
      const subscription = weatherNotificationService.getUserSubscription(userId);
      
      if (!subscription) {
        return res.status(200).json({
          success: true,
          data: {
            userId,
            status: 'not_configured',
            subscription: null
          }
        });
      }
      
      // Récupérer les dernières alertes pour cet utilisateur
      const alerts = await weatherNotificationService.getUserAlerts(userId, 10);
      
      return res.status(200).json({
        success: true,
        data: {
          userId,
          status: subscription.enabled ? 'active' : 'paused',
          subscription,
          alerts
        }
      });
    } catch (error) {
      logger.error('Erreur lors de la récupération du statut des alertes météo', {
        error: error.message,
        userId: req.user.id
      });
      
      return res.status(500).json({
        success: false,
        message: `Erreur lors de la récupération du statut des alertes météo: ${error.message}`
      });
    }
  }
}

module.exports = RouteWeatherController;
