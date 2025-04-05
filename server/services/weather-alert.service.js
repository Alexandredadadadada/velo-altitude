/**
 * Service d'alerte météo pour les itinéraires cyclistes
 * Surveille les changements météorologiques et envoie des alertes aux utilisateurs
 */

const NodeCache = require('node-cache');
const weatherService = require('./weather.service');
const userService = require('./user.service');
const notificationService = require('./notification.service');
const logger = require('../utils/logger');

class WeatherAlertService {
  constructor() {
    // Cache pour les dernières conditions météo vérifiées
    this.cache = new NodeCache({ stdTTL: 3600 }); // 1 heure
    
    // Seuils d'alerte
    this.thresholds = {
      temperature_change: 10, // °C
      precipitation_probability: 70, // %
      wind_speed: 30, // km/h
      severe_weather: true // Alertes pour conditions sévères
    };
    
    // Démarrer la vérification périodique
    this.startPeriodicCheck();
    
    logger.info('Service d\'alerte météo initialisé');
  }
  
  /**
   * Démarre la vérification périodique des conditions météo
   */
  startPeriodicCheck() {
    // Vérifier toutes les 3 heures
    setInterval(() => this.checkAllFavoriteRoutes(), 3 * 60 * 60 * 1000);
    
    // Première vérification au démarrage (après 5 secondes)
    setTimeout(() => this.checkAllFavoriteRoutes(), 5000);
  }
  
  /**
   * Vérifie les conditions météo pour tous les itinéraires favoris
   */
  async checkAllFavoriteRoutes() {
    try {
      logger.info('Vérification des conditions météo pour les itinéraires favoris');
      
      // Récupérer tous les utilisateurs avec leurs itinéraires favoris
      const users = await userService.getUsersWithFavoriteRoutes();
      
      // Pour chaque utilisateur, vérifier ses itinéraires favoris
      for (const user of users) {
        await this.checkUserFavoriteRoutes(user);
      }
      
      logger.info('Vérification des conditions météo terminée');
    } catch (error) {
      logger.error(`Erreur lors de la vérification des conditions météo: ${error.message}`);
    }
  }
  
  /**
   * Vérifie les conditions météo pour les itinéraires favoris d'un utilisateur
   * @param {Object} user - Utilisateur avec ses itinéraires favoris
   */
  async checkUserFavoriteRoutes(user) {
    try {
      // Vérifier chaque itinéraire favori
      for (const route of user.favoriteRoutes) {
        // Vérifier si l'utilisateur a activé les alertes pour cet itinéraire
        if (route.alerts_enabled) {
          await this.checkRouteWeather(user, route);
        }
      }
    } catch (error) {
      logger.error(`Erreur lors de la vérification des itinéraires de l'utilisateur ${user.id}: ${error.message}`);
    }
  }
  
  /**
   * Vérifie les conditions météo pour un itinéraire spécifique
   * @param {Object} user - Utilisateur
   * @param {Object} route - Itinéraire
   */
  async checkRouteWeather(user, route) {
    try {
      // Récupérer les points clés de l'itinéraire
      const keyPoints = this.getRouteKeyPoints(route);
      
      // Récupérer les prévisions météo pour ces points
      const forecasts = await Promise.all(
        keyPoints.map(point => 
          weatherService.getWeatherForecast(point.lat, point.lng)
        )
      );
      
      // Récupérer les conditions précédentes depuis le cache
      const cacheKey = `weather_${route.id}`;
      const previousForecasts = this.cache.get(cacheKey);
      
      // Comparer et générer des alertes si nécessaire
      if (previousForecasts) {
        const alerts = this.detectSignificantChanges(previousForecasts, forecasts, route);
        
        // Envoyer des notifications pour les alertes
        if (alerts.length > 0) {
          await this.sendAlerts(user, route, alerts);
        }
      }
      
      // Mettre à jour le cache
      this.cache.set(cacheKey, forecasts);
    } catch (error) {
      logger.error(`Erreur lors de la vérification de la météo pour l'itinéraire ${route.id}: ${error.message}`);
    }
  }
  
  /**
   * Détecte les changements significatifs dans les conditions météo
   * @param {Array<Object>} previous - Prévisions précédentes
   * @param {Array<Object>} current - Prévisions actuelles
   * @param {Object} route - Itinéraire
   * @returns {Array<Object>} Alertes générées
   */
  detectSignificantChanges(previous, current, route) {
    const alerts = [];
    
    // Comparer les prévisions pour chaque point
    for (let i = 0; i < previous.length; i++) {
      const prev = previous[i];
      const curr = current[i];
      
      // Changement de température
      const tempChange = Math.abs(curr.temperature.avg - prev.temperature.avg);
      if (tempChange >= this.thresholds.temperature_change) {
        alerts.push({
          type: 'temperature',
          location: `km ${Math.round(route.points[i].distance / 1000)}`,
          message: `Changement de température de ${tempChange.toFixed(1)}°C`,
          severity: this.getSeverity(tempChange, this.thresholds.temperature_change)
        });
      }
      
      // Augmentation des précipitations
      if (curr.precipitation.probability >= this.thresholds.precipitation_probability &&
          prev.precipitation.probability < this.thresholds.precipitation_probability) {
        alerts.push({
          type: 'precipitation',
          location: `km ${Math.round(route.points[i].distance / 1000)}`,
          message: `Risque élevé de précipitations (${curr.precipitation.probability}%)`,
          severity: 'high'
        });
      }
      
      // Augmentation du vent
      if (curr.wind.speed >= this.thresholds.wind_speed &&
          prev.wind.speed < this.thresholds.wind_speed) {
        alerts.push({
          type: 'wind',
          location: `km ${Math.round(route.points[i].distance / 1000)}`,
          message: `Vent fort prévu (${curr.wind.speed} km/h)`,
          severity: this.getSeverity(curr.wind.speed, this.thresholds.wind_speed)
        });
      }
      
      // Conditions météo sévères
      if (this.thresholds.severe_weather && 
          this.isSevereWeather(curr) && 
          !this.isSevereWeather(prev)) {
        alerts.push({
          type: 'severe',
          location: `km ${Math.round(route.points[i].distance / 1000)}`,
          message: `Conditions météo sévères prévues (${curr.conditions})`,
          severity: 'critical'
        });
      }
    }
    
    return alerts;
  }
  
  /**
   * Envoie des alertes à l'utilisateur
   * @param {Object} user - Utilisateur
   * @param {Object} route - Itinéraire
   * @param {Array<Object>} alerts - Alertes à envoyer
   */
  async sendAlerts(user, route, alerts) {
    try {
      // Trier les alertes par sévérité
      alerts.sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      });
      
      // Créer le message de notification
      const title = `Alerte météo pour ${route.name}`;
      let message = `Changements météo importants détectés pour votre itinéraire favori "${route.name}":\n\n`;
      
      alerts.forEach(alert => {
        message += `- ${alert.message} (${alert.location})\n`;
      });
      
      message += `\nConsultez l'application pour plus de détails.`;
      
      // Envoyer la notification
      await notificationService.sendNotification(user.id, {
        title,
        message,
        type: 'weather_alert',
        data: {
          routeId: route.id,
          alerts
        }
      });
      
      logger.info(`Alertes météo envoyées à l'utilisateur ${user.id} pour l'itinéraire ${route.id}`);
    } catch (error) {
      logger.error(`Erreur lors de l'envoi des alertes: ${error.message}`);
    }
  }
  
  /**
   * Détermine la sévérité d'une alerte
   * @param {number} value - Valeur actuelle
   * @param {number} threshold - Seuil d'alerte
   * @returns {string} Niveau de sévérité
   */
  getSeverity(value, threshold) {
    const ratio = value / threshold;
    
    if (ratio >= 2) return 'critical';
    if (ratio >= 1.5) return 'high';
    if (ratio >= 1.2) return 'medium';
    return 'low';
  }
  
  /**
   * Vérifie si les conditions météo sont sévères
   * @param {Object} forecast - Prévisions météo
   * @returns {boolean} Vrai si conditions sévères
   */
  isSevereWeather(forecast) {
    // Conditions considérées comme sévères
    const severeConditions = [
      'thunderstorm', 'freezing_rain', 'hail', 'blizzard', 'hurricane',
      'tornado', 'extreme_heat', 'extreme_cold'
    ];
    
    return severeConditions.includes(forecast.conditions) ||
           forecast.wind.speed > 50 || // Vent très fort
           forecast.precipitation.amount > 30; // Fortes précipitations
  }
  
  /**
   * Récupère les points clés d'un itinéraire
   * @param {Object} route - Itinéraire
   * @returns {Array<Object>} Points clés
   */
  getRouteKeyPoints(route) {
    // Simplification : utiliser le début, le milieu et la fin
    const points = route.points;
    
    return [
      points[0], // Départ
      points[Math.floor(points.length / 2)], // Milieu
      points[points.length - 1] // Arrivée
    ];
  }
  
  /**
   * Configure manuellement les seuils d'alerte
   * @param {Object} thresholds - Nouveaux seuils
   */
  configureThresholds(thresholds) {
    this.thresholds = {
      ...this.thresholds,
      ...thresholds
    };
    
    logger.info('Seuils d\'alerte météo mis à jour');
    return this.thresholds;
  }
  
  /**
   * Force une vérification immédiate pour un utilisateur et un itinéraire spécifiques
   * @param {string} userId - ID de l'utilisateur
   * @param {string} routeId - ID de l'itinéraire
   * @returns {Promise<Array<Object>>} Alertes générées
   */
  async forceCheck(userId, routeId) {
    try {
      const user = await userService.getUserById(userId);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }
      
      const route = await userService.getUserFavoriteRoute(userId, routeId);
      if (!route) {
        throw new Error('Itinéraire non trouvé dans les favoris');
      }
      
      // Supprimer du cache pour forcer une nouvelle vérification
      const cacheKey = `weather_${route.id}`;
      this.cache.del(cacheKey);
      
      // Effectuer la vérification
      await this.checkRouteWeather(user, route);
      
      // Récupérer les prévisions fraîches
      const keyPoints = this.getRouteKeyPoints(route);
      const forecasts = await Promise.all(
        keyPoints.map(point => 
          weatherService.getWeatherForecast(point.lat, point.lng)
        )
      );
      
      // Générer un résumé des conditions actuelles
      return {
        route: {
          id: route.id,
          name: route.name
        },
        forecasts: forecasts.map((forecast, index) => ({
          location: keyPoints[index],
          conditions: forecast.conditions,
          temperature: forecast.temperature,
          precipitation: forecast.precipitation,
          wind: forecast.wind
        }))
      };
    } catch (error) {
      logger.error(`Erreur lors de la vérification forcée: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new WeatherAlertService();
