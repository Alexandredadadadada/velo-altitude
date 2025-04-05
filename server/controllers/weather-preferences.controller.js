/**
 * Contrôleur pour la gestion des préférences météo des utilisateurs
 */
const WeatherPreferences = require('../models/weather-preferences.model');
const weatherNotificationService = require('../services/weather-notification.service');
const routeWeatherService = require('../services/route-weather.service');
const logger = require('../utils/logger');

class WeatherPreferencesController {
  /**
   * Récupère les préférences météo d'un utilisateur
   */
  static async getUserPreferences(req, res) {
    try {
      const userId = req.user.id;
      
      // Chercher les préférences existantes ou créer par défaut
      let preferences = await WeatherPreferences.findOne({ userId });
      
      if (!preferences) {
        preferences = new WeatherPreferences({ userId });
        await preferences.save();
      }
      
      return res.status(200).json({
        success: true,
        data: preferences
      });
    } catch (error) {
      logger.error('Erreur lors de la récupération des préférences météo', {
        error: error.message,
        userId: req.user.id
      });
      
      return res.status(500).json({
        success: false,
        message: `Erreur: ${error.message}`
      });
    }
  }
  
  /**
   * Met à jour les préférences météo d'un utilisateur
   */
  static async updateUserPreferences(req, res) {
    try {
      const userId = req.user.id;
      const updateData = req.body;
      
      // Mise à jour ou création des préférences
      let preferences = await WeatherPreferences.findOne({ userId });
      
      if (!preferences) {
        preferences = new WeatherPreferences({
          userId,
          ...updateData
        });
      } else {
        // Mettre à jour les propriétés fournies
        if (updateData.alertEnabled !== undefined) preferences.alertEnabled = updateData.alertEnabled;
        if (updateData.notificationChannels) preferences.notificationChannels = {...preferences.notificationChannels, ...updateData.notificationChannels};
        
        // Mise à jour des seuils
        if (updateData.thresholds) {
          // Température
          if (updateData.thresholds.temperature) {
            preferences.thresholds.temperature = {...preferences.thresholds.temperature, ...updateData.thresholds.temperature};
          }
          
          // Précipitation
          if (updateData.thresholds.precipitation) {
            preferences.thresholds.precipitation = {...preferences.thresholds.precipitation, ...updateData.thresholds.precipitation};
          }
          
          // Vent
          if (updateData.thresholds.wind) {
            preferences.thresholds.wind = {...preferences.thresholds.wind, ...updateData.thresholds.wind};
          }
          
          // Visibilité
          if (updateData.thresholds.visibility) {
            preferences.thresholds.visibility = {...preferences.thresholds.visibility, ...updateData.thresholds.visibility};
          }
          
          // Neige
          if (updateData.thresholds.snow) {
            preferences.thresholds.snow = {...preferences.thresholds.snow, ...updateData.thresholds.snow};
          }
        }
        
        // Mise à jour des itinéraires favoris
        if (updateData.favoriteRoutes) {
          preferences.favoriteRoutes = {...preferences.favoriteRoutes, ...updateData.favoriteRoutes};
        }
      }
      
      // Sauvegarder les préférences
      await preferences.save();
      
      // Synchroniser avec le service de notification météo
      await this._syncWithNotificationService(userId, preferences);
      
      return res.status(200).json({
        success: true,
        data: preferences,
        message: 'Préférences météo mises à jour avec succès'
      });
    } catch (error) {
      logger.error('Erreur lors de la mise à jour des préférences météo', {
        error: error.message,
        userId: req.user.id
      });
      
      return res.status(500).json({
        success: false,
        message: `Erreur: ${error.message}`
      });
    }
  }
  
  /**
   * Configure les alertes météo pour les itinéraires favoris
   */
  static async setupFavoriteRoutesAlerts(req, res) {
    try {
      const userId = req.user.id;
      const { routeIds, alertEnabled, alertBefore, alertFrequency } = req.body;
      
      // Trouver ou créer les préférences
      let preferences = await WeatherPreferences.findOne({ userId });
      
      if (!preferences) {
        preferences = new WeatherPreferences({ userId });
      }
      
      // Mettre à jour les préférences d'itinéraires
      if (routeIds) preferences.favoriteRoutes.routeIds = routeIds;
      if (alertEnabled !== undefined) preferences.favoriteRoutes.enabled = alertEnabled;
      if (alertBefore) preferences.favoriteRoutes.alertBefore = alertBefore;
      if (alertFrequency) preferences.favoriteRoutes.alertFrequency = alertFrequency;
      
      await preferences.save();
      
      // Configurer les alertes via le service d'itinéraires météo
      const result = await routeWeatherService.setupFavoriteRoutesWeatherAlerts(userId, {
        enabled: preferences.favoriteRoutes.enabled,
        alertBefore: preferences.favoriteRoutes.alertBefore,
        favoriteRouteIds: preferences.favoriteRoutes.routeIds,
        precipitationThreshold: preferences.thresholds.precipitation.probability,
        windThreshold: preferences.thresholds.wind.speed,
        temperatureRange: {
          min: preferences.thresholds.temperature.min,
          max: preferences.thresholds.temperature.max
        },
        notificationChannels: Object.keys(preferences.notificationChannels)
          .filter(channel => preferences.notificationChannels[channel]),
        alertFrequency: preferences.favoriteRoutes.alertFrequency
      });
      
      return res.status(200).json({
        success: true,
        data: result,
        message: 'Alertes pour itinéraires favoris configurées avec succès'
      });
    } catch (error) {
      logger.error('Erreur lors de la configuration des alertes pour itinéraires favoris', {
        error: error.message,
        userId: req.user.id
      });
      
      return res.status(500).json({
        success: false,
        message: `Erreur: ${error.message}`
      });
    }
  }
  
  /**
   * Désactive toutes les alertes météo d'un utilisateur
   */
  static async disableAllAlerts(req, res) {
    try {
      const userId = req.user.id;
      
      // Mettre à jour les préférences
      const preferences = await WeatherPreferences.findOneAndUpdate(
        { userId },
        { alertEnabled: false },
        { new: true, upsert: true }
      );
      
      // Désabonner l'utilisateur du service de notification
      await weatherNotificationService.unsubscribeUser(userId);
      
      return res.status(200).json({
        success: true,
        data: preferences,
        message: 'Toutes les alertes météo ont été désactivées'
      });
    } catch (error) {
      logger.error('Erreur lors de la désactivation des alertes météo', {
        error: error.message,
        userId: req.user.id
      });
      
      return res.status(500).json({
        success: false,
        message: `Erreur: ${error.message}`
      });
    }
  }
  
  /**
   * Synchronise les préférences utilisateur avec le service de notification
   * @private
   */
  static async _syncWithNotificationService(userId, preferences) {
    try {
      // Si les alertes sont complètement désactivées, désabonner l'utilisateur
      if (!preferences.alertEnabled) {
        await weatherNotificationService.unsubscribeUser(userId);
        return;
      }
      
      // Déterminer les canaux de notification actifs
      const channels = Object.keys(preferences.notificationChannels)
        .filter(channel => preferences.notificationChannels[channel]);
      
      // Abonner l'utilisateur aux notifications avec ses préférences
      await weatherNotificationService.subscribeUser(userId, {
        enabled: preferences.alertEnabled,
        notifyOnRain: preferences.thresholds.precipitation.enabled,
        notifyOnWind: preferences.thresholds.wind.enabled,
        notifyOnTemperature: preferences.thresholds.temperature.enabled,
        notifyOnSnow: preferences.thresholds.snow.enabled,
        rainThreshold: preferences.thresholds.precipitation.probability,
        windThreshold: preferences.thresholds.wind.speed,
        temperatureMin: preferences.thresholds.temperature.min,
        temperatureMax: preferences.thresholds.temperature.max,
        visibilityThreshold: preferences.thresholds.visibility.distance,
        email: preferences.notificationChannels.email,
        pushNotifications: preferences.notificationChannels.push,
        sms: preferences.notificationChannels.sms,
        onlyAdverseConditions: true
      });
      
      // Si les alertes d'itinéraires sont activées, configurer via le service approprié
      if (preferences.favoriteRoutes.enabled && preferences.favoriteRoutes.routeIds.length > 0) {
        await routeWeatherService.setupFavoriteRoutesWeatherAlerts(userId, {
          enabled: true,
          favoriteRouteIds: preferences.favoriteRoutes.routeIds,
          alertBefore: preferences.favoriteRoutes.alertBefore,
          notificationChannels: channels,
          alertFrequency: preferences.favoriteRoutes.alertFrequency
        });
      }
    } catch (error) {
      logger.error('Erreur lors de la synchronisation avec le service de notification', {
        error: error.message,
        userId
      });
      
      throw error;
    }
  }
}

module.exports = WeatherPreferencesController;
