/**
 * Service de notifications météo
 * Surveille les conditions météorologiques et envoie des notifications
 * en cas de changements significatifs
 */
const axios = require('axios');
const schedule = require('node-schedule');
const logger = require('../utils/logger');
const notificationService = require('./notification.service');
const { trackApiCall } = require('../middleware/api-quota-middleware');

class WeatherNotificationService {
  constructor() {
    this.apiKey = process.env.OPENWEATHERMAP_API_KEY;
    this.defaultCity = 'Strasbourg,fr';
    this.locations = [];
    this.cachedWeatherData = {};
    this.weatherAlertThresholds = {
      // Précipitations (mm/h)
      rain: {
        light: 0.5,
        moderate: 2.5,
        heavy: 7.6
      },
      // Vent (m/s)
      wind: {
        moderate: 5.5,  // ~20 km/h
        strong: 10.8,   // ~39 km/h
        veryStrong: 17.2 // ~62 km/h
      },
      // Température (°C)
      temperature: {
        veryCold: 0,
        cold: 5,
        hot: 28,
        veryHot: 32
      },
      // Visibilité (m)
      visibility: {
        poor: 1000,
        veryPoor: 500
      }
    };
    this.scheduledJobs = {};
    this.userSubscriptions = {};
  }

  /**
   * Initialise le service
   * @param {Array} locations Liste des emplacements à surveiller [{ city, country, lat, lon }]
   */
  initialize(locations = []) {
    if (!this.apiKey) {
      logger.error('Clé API OpenWeatherMap non configurée');
      return false;
    }

    // Configurer les emplacements à surveiller
    this.locations = locations.length > 0 ? locations : [{ city: this.defaultCity }];
    
    // Charger les données météo initiales
    this.locations.forEach(location => {
      this.fetchWeatherData(location);
    });
    
    // Planifier les vérifications périodiques
    this.scheduleWeatherChecks();
    
    logger.info('Service de notifications météo initialisé', {
      locations: this.locations.map(l => l.city || `${l.lat},${l.lon}`).join(', ')
    });
    
    return true;
  }

  /**
   * Récupère les données météo actuelles pour un emplacement
   * @param {Object} location Emplacement { city, country, lat, lon }
   */
  async fetchWeatherData(location) {
    try {
      const startTime = Date.now();
      const locationKey = location.city || `${location.lat},${location.lon}`;
      
      const params = location.city 
        ? { q: location.city, appid: this.apiKey, units: 'metric', lang: 'fr' }
        : { lat: location.lat, lon: location.lon, appid: this.apiKey, units: 'metric', lang: 'fr' };

      const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', { params });
      
      // Enregistrer l'appel API
      trackApiCall(
        'openweathermap',
        '/data/2.5/weather',
        true,
        response.status,
        Date.now() - startTime
      );
      
      const previousData = this.cachedWeatherData[locationKey];
      this.cachedWeatherData[locationKey] = response.data;
      
      // Si nous avons des données précédentes, vérifier les changements
      if (previousData) {
        this.checkWeatherChanges(locationKey, previousData, response.data);
      }
      
      logger.debug(`Données météo récupérées pour ${locationKey}`, {
        temp: response.data.main.temp,
        conditions: response.data.weather[0].description
      });
      
      return response.data;
    } catch (error) {
      // Enregistrer l'appel API échoué
      trackApiCall('openweathermap', '/data/2.5/weather', false);
      
      logger.error(`Erreur lors de la récupération des données météo pour ${location.city || `${location.lat},${location.lon}`}`, {
        error: error.message
      });
      
      return null;
    }
  }

  /**
   * Compare les données météo et détecte les changements significatifs
   * @param {string} locationKey Clé d'emplacement
   * @param {Object} oldData Anciennes données
   * @param {Object} newData Nouvelles données
   */
  checkWeatherChanges(locationKey, oldData, newData) {
    try {
      // Vérifier les changements de précipitations
      this.checkPrecipitationChanges(locationKey, oldData, newData);
      
      // Vérifier les changements de vent
      this.checkWindChanges(locationKey, oldData, newData);
      
      // Vérifier les changements de température
      this.checkTemperatureChanges(locationKey, oldData, newData);

      // Vérifier si les conditions sont globalement défavorables
      const isAdverse = this.isAdverseWeather(newData);
      if (isAdverse) {
        this.sendWeatherNotification(
          'adverse',
          'Conditions météo défavorables',
          `Les conditions météo à ${locationKey} se sont dégradées: ${newData.weather[0].description}`,
          locationKey,
          true
        );
      }
    } catch (error) {
      logger.error(`Erreur lors de la vérification des changements météo pour ${locationKey}`, {
        error: error.message
      });
    }
  }

  /**
   * Vérifie les changements de température
   * @param {string} locationKey Clé d'emplacement
   * @param {Object} oldData Anciennes données
   * @param {Object} newData Nouvelles données
   */
  checkTemperatureChanges(locationKey, oldData, newData) {
    try {
      const oldTemp = oldData.main.temp;
      const newTemp = newData.main.temp;
      const tempDiff = Math.abs(newTemp - oldTemp);
      
      // Notifier si changement significatif de température
      if (tempDiff >= 5) {
        const direction = newTemp > oldTemp ? 'augmenté' : 'diminué';
        this.sendWeatherNotification(
          'temperature',
          'Changement important de température',
          `La température à ${locationKey} a ${direction} de ${tempDiff.toFixed(1)}°C (maintenant: ${newTemp.toFixed(1)}°C)`,
          locationKey,
          (newTemp < this.weatherAlertThresholds.temperature.veryCold || newTemp > this.weatherAlertThresholds.temperature.veryHot)
        );
      }
      
      // Vérifier les seuils extrêmes
      if ((oldTemp > this.weatherAlertThresholds.temperature.veryCold && newTemp <= this.weatherAlertThresholds.temperature.veryCold) ||
          (oldTemp > this.weatherAlertThresholds.temperature.cold && newTemp <= this.weatherAlertThresholds.temperature.cold)) {
        this.sendWeatherNotification(
          'temperature',
          'Alerte de basse température',
          `La température à ${locationKey} est descendue à ${newTemp.toFixed(1)}°C. Conditions froides pour le cyclisme.`,
          locationKey,
          true
        );
      }
      
      if ((oldTemp < this.weatherAlertThresholds.temperature.veryHot && newTemp >= this.weatherAlertThresholds.temperature.veryHot) ||
          (oldTemp < this.weatherAlertThresholds.temperature.hot && newTemp >= this.weatherAlertThresholds.temperature.hot)) {
        this.sendWeatherNotification(
          'temperature',
          'Alerte de haute température',
          `La température à ${locationKey} a atteint ${newTemp.toFixed(1)}°C. Conditions chaudes pour le cyclisme.`,
          locationKey,
          true
        );
      }
    } catch (error) {
      logger.error(`Erreur lors de la vérification des changements de température pour ${locationKey}`, {
        error: error.message
      });
    }
  }

  /**
   * Vérifie si les conditions météo sont défavorables
   * @param {Object} weatherData Données météo
   * @returns {boolean} true si les conditions sont défavorables
   */
  isAdverseWeather(weatherData) {
    // Codes de condition météo défavorable
    const adverseConditions = [
      // Orages
      2, 
      // Bruine
      3, 
      // Pluie
      5, 
      // Neige
      6, 
      // Atmosphère (brouillard, etc.)
      7
    ];
    
    // Vérifier la condition météo principale
    const weatherId = Math.floor(weatherData.weather[0].id / 100);
    if (adverseConditions.includes(weatherId)) {
      return true;
    }
    
    // Vérifier les vents forts
    if (weatherData.wind && weatherData.wind.speed >= this.weatherAlertThresholds.wind.strong) {
      return true;
    }
    
    // Vérifier la visibilité réduite
    if (weatherData.visibility && weatherData.visibility <= this.weatherAlertThresholds.visibility.poor) {
      return true;
    }
    
    // Vérifier les températures extrêmes
    if (weatherData.main) {
      if (weatherData.main.temp <= this.weatherAlertThresholds.temperature.veryCold ||
          weatherData.main.temp >= this.weatherAlertThresholds.temperature.veryHot) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Vérifie les changements de précipitations
   * @param {string} locationKey Clé d'emplacement
   * @param {Object} oldData Anciennes données
   * @param {Object} newData Nouvelles données
   */
  checkPrecipitationChanges(locationKey, oldData, newData) {
    // Vérifier l'apparition de pluie
    const hadRain = oldData.rain && oldData.rain['1h'] > 0;
    const hasRain = newData.rain && newData.rain['1h'] > 0;
    
    if (!hadRain && hasRain) {
      const intensity = this.getRainIntensity(newData.rain['1h']);
      const message = `Il commence à pleuvoir à ${newData.name} (${intensity}, ${newData.rain['1h']} mm/h)`;
      const severity = intensity === 'forte' ? 'warning' : 'info';
      
      this.sendWeatherNotification(severity, `Pluie détectée: ${newData.name}`, message, locationKey);
      
      // Notifier les utilisateurs
      this.notifySubscribedUsers(locationKey, `Pluie détectée à ${newData.name}`, message, severity === 'warning');
    }
    
    // Vérifier l'apparition de neige
    const hadSnow = oldData.snow && oldData.snow['1h'] > 0;
    const hasSnow = newData.snow && newData.snow['1h'] > 0;
    
    if (!hadSnow && hasSnow) {
      const message = `Il commence à neiger à ${newData.name} (${newData.snow['1h']} mm/h)`;
      
      this.sendWeatherNotification('warning', `Neige détectée: ${newData.name}`, message, locationKey);
      
      // Notifier les utilisateurs
      this.notifySubscribedUsers(locationKey, `Neige détectée à ${newData.name}`, message, true);
    }
  }

  /**
   * Vérifie les changements de vent
   * @param {string} locationKey Clé d'emplacement
   * @param {Object} oldData Anciennes données
   * @param {Object} newData Nouvelles données
   */
  checkWindChanges(locationKey, oldData, newData) {
    if (!oldData.wind || !newData.wind) return;
    
    const oldSpeed = oldData.wind.speed;
    const newSpeed = newData.wind.speed;
    
    // Si le vent s'intensifie et dépasse un seuil
    if (newSpeed > oldSpeed && 
        (newSpeed >= this.weatherAlertThresholds.wind.strong && 
         oldSpeed < this.weatherAlertThresholds.wind.strong)) {
      
      const intensity = this.getWindIntensity(newSpeed);
      const message = `Le vent s'intensifie à ${newData.name} (${intensity}, ${newSpeed} m/s)`;
      const severity = intensity === 'très fort' ? 'warning' : 'info';
      
      this.sendWeatherNotification(severity, `Vent fort: ${newData.name}`, message, locationKey);
      
      // Notifier les utilisateurs
      this.notifySubscribedUsers(locationKey, `Vent fort à ${newData.name}`, message, severity === 'warning');
    }
  }

  /**
   * Détermine l'intensité de la pluie
   * @param {number} rainAmount Quantité de pluie en mm/h
   * @returns {string} Intensité (légère, modérée, forte)
   */
  getRainIntensity(rainAmount) {
    if (rainAmount >= this.weatherAlertThresholds.rain.heavy) {
      return 'forte';
    } else if (rainAmount >= this.weatherAlertThresholds.rain.moderate) {
      return 'modérée';
    } else {
      return 'légère';
    }
  }

  /**
   * Détermine l'intensité du vent
   * @param {number} windSpeed Vitesse du vent en m/s
   * @returns {string} Intensité (modéré, fort, très fort)
   */
  getWindIntensity(windSpeed) {
    if (windSpeed >= this.weatherAlertThresholds.wind.veryStrong) {
      return 'très fort';
    } else if (windSpeed >= this.weatherAlertThresholds.wind.strong) {
      return 'fort';
    } else {
      return 'modéré';
    }
  }

  /**
   * Envoie une notification météo
   */
  sendWeatherNotification(type, subject, message, locationKey, isAdverse = false) {
    // Logger la notification
    logger.info(`Notification météo: ${subject}`, {
      message,
      location: locationKey,
      type
    });
    
    // Envoyer via le service de notification
    notificationService.sendAlert({
      type,
      source: 'weather-service',
      subject,
      message
    });
  }

  /**
   * Planifie les vérifications périodiques de la météo
   */
  scheduleWeatherChecks() {
    // Annuler les planifications existantes
    Object.values(this.scheduledJobs).forEach(job => job.cancel());
    this.scheduledJobs = {};
    
    // Planifier une vérification toutes les 30 minutes pour chaque emplacement
    this.locations.forEach(location => {
      const locationKey = location.city || `${location.lat},${location.lon}`;
      
      // Planifier la tâche pour qu'elle s'exécute toutes les 30 minutes
      this.scheduledJobs[locationKey] = schedule.scheduleJob('*/30 * * * *', async () => {
        logger.debug(`Vérification programmée de la météo pour ${locationKey}`);
        await this.fetchWeatherData(location);
      });
      
      logger.info(`Vérification météo programmée pour ${locationKey} (toutes les 30 minutes)`);
    });
  }

  /**
   * Ajoute un emplacement à surveiller
   * @param {Object} location Emplacement { city, country, lat, lon }
   */
  addLocation(location) {
    const locationKey = location.city || `${location.lat},${location.lon}`;
    
    // Vérifier si l'emplacement existe déjà
    const exists = this.locations.some(loc => 
      (loc.city && loc.city === location.city) || 
      (loc.lat && loc.lon && loc.lat === location.lat && loc.lon === location.lon)
    );
    
    if (!exists) {
      this.locations.push(location);
      
      // Récupérer les données initiales
      this.fetchWeatherData(location);
      
      // Planifier les vérifications
      this.scheduledJobs[locationKey] = schedule.scheduleJob('*/30 * * * *', async () => {
        await this.fetchWeatherData(location);
      });
      
      logger.info(`Nouvel emplacement ajouté pour la surveillance météo: ${locationKey}`);
      return true;
    }
    
    return false;
  }

  /**
   * Abonne un utilisateur aux notifications météo
   * @param {string} userId ID de l'utilisateur
   * @param {Object} preferences Préférences de notification
   */
  subscribeUser(userId, preferences = {}) {
    this.userSubscriptions[userId] = {
      enabled: true,
      locations: preferences.locations || this.locations.map(l => l.city || `${l.lat},${l.lon}`),
      notifyOnRain: preferences.notifyOnRain !== undefined ? preferences.notifyOnRain : true,
      notifyOnSnow: preferences.notifyOnSnow !== undefined ? preferences.notifyOnSnow : true,
      notifyOnWind: preferences.notifyOnWind !== undefined ? preferences.notifyOnWind : true,
      notifyOnTempChange: preferences.notifyOnTempChange !== undefined ? preferences.notifyOnTempChange : true,
      onlyAdverseConditions: preferences.onlyAdverseConditions !== undefined ? preferences.onlyAdverseConditions : false,
      pushNotifications: preferences.pushNotifications !== undefined ? preferences.pushNotifications : true,
      email: preferences.email,
      pushToken: preferences.pushToken
    };
    
    logger.info(`Utilisateur ${userId} abonné aux notifications météo`, {
      locations: this.userSubscriptions[userId].locations,
      preferences: {
        rain: this.userSubscriptions[userId].notifyOnRain,
        snow: this.userSubscriptions[userId].notifyOnSnow,
        wind: this.userSubscriptions[userId].notifyOnWind
      }
    });
    
    return this.userSubscriptions[userId];
  }

  /**
   * Notifie les utilisateurs abonnés d'un changement météo
   * @param {string} locationKey Clé d'emplacement
   * @param {string} title Titre de la notification
   * @param {string} message Message de la notification
   * @param {boolean} isAdverse Indique si les conditions sont défavorables
   */
  notifySubscribedUsers(locationKey, title, message, isAdverse = false) {
    Object.entries(this.userSubscriptions).forEach(([userId, subscription]) => {
      // Vérifier si l'utilisateur est abonné à cet emplacement et si les notifications sont activées
      if (subscription.enabled && subscription.locations.includes(locationKey)) {
        // Vérifier si l'utilisateur souhaite être notifié uniquement des conditions défavorables
        if (subscription.onlyAdverseConditions && !isAdverse) {
          return;
        }
        
        // Envoyer des notifications push si configuré
        if (subscription.pushNotifications && subscription.pushToken) {
          this.sendPushNotification(subscription.pushToken, title, message);
        }
        
        // Envoyer un email si configuré
        if (subscription.email) {
          notificationService.sendEmailNotification(
            subscription.email,
            title,
            message
          );
        }
        
        logger.debug(`Notification météo envoyée à l'utilisateur ${userId}`, {
          location: locationKey,
          isAdverse
        });
      }
    });
  }

  /**
   * Désabonne un utilisateur des notifications météo
   * @param {string} userId ID de l'utilisateur
   * @returns {boolean} Succès de l'opération
   */
  unsubscribeUser(userId) {
    if (this.userSubscriptions[userId]) {
      delete this.userSubscriptions[userId];
      logger.info(`Utilisateur ${userId} désabonné des notifications météo`);
      return true;
    }
    
    return false;
  }

  /**
   * Récupère l'abonnement d'un utilisateur
   * @param {string} userId ID de l'utilisateur
   * @returns {Object|null} Abonnement de l'utilisateur ou null
   */
  getUserSubscription(userId) {
    return this.userSubscriptions[userId] || null;
  }

  /**
   * Récupère les alertes d'un utilisateur
   * @param {string} userId ID de l'utilisateur
   * @param {number} limit Nombre d'alertes à récupérer
   * @returns {Array} Alertes de l'utilisateur
   */
  async getUserAlerts(userId, limit = 10) {
    try {
      // Cette méthode pourrait être connectée à une base de données
      // Pour l'instant, nous retournons un tableau vide
      // Dans une implémentation complète, on interrogerait une collection d'alertes
      return [];
    } catch (error) {
      logger.error(`Erreur lors de la récupération des alertes de l'utilisateur ${userId}`, {
        error: error.message
      });
      return [];
    }
  }

  /**
   * Envoie une notification push à un appareil
   * @param {string} token Token de l'appareil
   * @param {string} title Titre de la notification
   * @param {string} message Message de la notification
   */
  async sendPushNotification(token, title, message) {
    try {
      // Utiliser le service Firebase Cloud Messaging ou une autre plateforme de notification
      // Ceci est une implémentation simplifiée
      
      // Dans un environnement réel, vous utiliseriez firebase-admin ou un autre SDK
      /* exemple avec firebase-admin:
      const admin = require('firebase-admin');
      await admin.messaging().send({
        token,
        notification: {
          title,
          body: message
        }
      });
      */
      
      // Pour l'instant, nous allons simplement logger la notification
      logger.info(`Notification push envoyée (simulée): ${title}`, {
        message,
        token: token.substring(0, 8) + '...'
      });
      
      return true;
    } catch (error) {
      logger.error('Erreur lors de l\'envoi de la notification push', {
        error: error.message,
        token: token.substring(0, 8) + '...'
      });
      
      return false;
    }
  }

  /**
   * Obtient le statut du service de notification météo
   */
  getStatus() {
    return {
      active: !!Object.keys(this.scheduledJobs).length,
      locations: this.locations.map(loc => {
        const key = loc.city || `${loc.lat},${loc.lon}`;
        const data = this.cachedWeatherData[key];
        
        return {
          location: key,
          lastUpdated: data ? new Date(data.dt * 1000).toISOString() : null,
          currentConditions: data ? {
            temp: data.main.temp,
            humidity: data.main.humidity,
            pressure: data.main.pressure,
            windSpeed: data.wind?.speed,
            windDirection: data.wind?.deg,
            description: data.weather[0].description,
            icon: data.weather[0].icon
          } : null
        };
      }),
      subscribedUsers: Object.keys(this.userSubscriptions).length,
      alertThresholds: this.weatherAlertThresholds
    };
  }
}

// Exporter une instance singleton
const weatherNotificationService = new WeatherNotificationService();
module.exports = weatherNotificationService;
