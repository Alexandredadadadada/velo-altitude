/**
 * Service d'alertes météo pour les itinéraires
 * Offre des fonctionnalités avancées pour intégrer les informations météorologiques 
 * aux itinéraires et générer des alertes pertinentes
 */

const axios = require('axios');
const NodeCache = require('node-cache');
const logger = require('../utils/logger');
const weatherErrorHandler = require('../utils/weather-error-handler');
const gpxValidator = require('../utils/gpx-validator');
const config = require('../config');

class RouteWeatherAlertsService {
  constructor() {
    // Initialisation du cache avec TTL configurables
    this.cache = new NodeCache({
      stdTTL: 15 * 60, // 15 minutes par défaut
      checkperiod: 60   // Vérifier chaque minute
    });
    
    // Seuils configurables pour les différentes alertes
    this.thresholds = {
      // Seuils de précipitation en mm/h
      precipitation: {
        light: 1.0,    // Légère > 1.0 mm/h
        moderate: 4.0,  // Modérée > 4.0 mm/h
        heavy: 10.0,    // Forte > 10.0 mm/h
        extreme: 20.0   // Extrême > 20.0 mm/h
      },
      
      // Seuils de vent en km/h
      wind: {
        moderate: 20,   // Modéré > 20 km/h
        strong: 40,     // Fort > 40 km/h
        veryStrong: 60, // Très fort > 60 km/h
        extreme: 80     // Extrême > 80 km/h
      },
      
      // Seuils de température en °C
      temperature: {
        veryCold: 0,    // Très froid < 0°C
        cold: 5,        // Froid < 5°C
        hot: 30,        // Chaud > 30°C
        veryHot: 35     // Très chaud > 35°C
      },
      
      // Probabilité d'orage en pourcentage
      thunderstorm: {
        possible: 40,   // Possible > 40%
        likely: 70      // Probable > 70%
      },
      
      // Mauvaise visibilité en km
      visibility: {
        reduced: 5,     // Réduite < 5 km
        poor: 2,        // Faible < 2 km
        veryPoor: 0.5   // Très faible < 0.5 km
      }
    };
    
    // Types d'alertes supportés
    this.alertTypes = [
      'precipitation', 'wind', 'temperature', 
      'thunderstorm', 'visibility', 'suddenChange'
    ];
    
    // Intervalle de vérification pour les points de l'itinéraire (en km)
    this.routeCheckInterval = 5;
  }
  
  /**
   * Analyse les conditions météo le long d'un itinéraire et génère des alertes
   * @param {Object} route - Objet itinéraire avec points GPS
   * @param {Object} options - Options de l'analyse
   * @returns {Array} Alertes météo détectées sur l'itinéraire
   */
  async analyzeRouteWeather(route, options = {}) {
    try {
      const startTime = Date.now();
      logger.info(`[RouteWeatherAlertsService] Début d'analyse météo pour l'itinéraire ${route.id || 'inconnu'}`);
      
      // Options par défaut
      const analysisOptions = {
        forecastHours: options.forecastHours || 24, // Prévision sur 24h par défaut
        alertTypes: options.alertTypes || this.alertTypes, // Tous les types d'alertes par défaut
        threshold: options.threshold || 'standard', // Sensibilité standard par défaut
        useCache: options.useCache !== false, // Utiliser le cache par défaut
        segmentLength: options.segmentLength || this.routeCheckInterval // km
      };
      
      // Validation des données d'entrée
      if (!route || !route.id) {
        throw new Error('Données d\'itinéraire invalides ou manquantes');
      }
      
      if (!route.points || !Array.isArray(route.points) || route.points.length < 2) {
        throw new Error('Points GPS manquants ou invalides pour l\'itinéraire');
      }
      
      // Vérifier le cache si activé
      const cacheKey = `route_weather_alerts_${route.id}_${analysisOptions.forecastHours}h`;
      
      if (analysisOptions.useCache) {
        const cachedAlerts = this.cache.get(cacheKey);
        if (cachedAlerts) {
          logger.debug(`[RouteWeatherAlertsService] Utilisation des alertes en cache pour l'itinéraire ${route.id}`);
          return cachedAlerts;
        }
      }
      
      // Sélectionner les points à analyser (échantillonnage basé sur l'intervalle)
      const sampledPoints = this._sampleRoutePoints(route.points, analysisOptions.segmentLength);
      
      logger.debug(`[RouteWeatherAlertsService] Analyse de ${sampledPoints.length} points sur l'itinéraire ${route.id}`);
      
      // Récupérer les données météo pour chaque point
      const weatherPromises = sampledPoints.map((point, index) => 
        this._getPointWeatherForecast(point, analysisOptions.forecastHours)
          .then(forecast => ({ point, forecast, index: index * analysisOptions.segmentLength }))
      );
      
      // Attendre toutes les requêtes météo
      const pointsWeather = await Promise.all(weatherPromises);
      
      // Analyser les données météo et générer des alertes
      const alerts = this._generateWeatherAlerts(pointsWeather, analysisOptions);
      
      // Enregistrer dans le cache si activé
      if (analysisOptions.useCache) {
        this.cache.set(cacheKey, alerts);
      }
      
      const duration = (Date.now() - startTime) / 1000;
      logger.info(`[RouteWeatherAlertsService] Analyse météo terminée en ${duration.toFixed(2)}s pour l'itinéraire ${route.id}: ${alerts.length} alertes générées`);
      
      return alerts;
    } catch (error) {
      // Utiliser le weatherErrorHandler pour une gestion cohérente des erreurs
      return weatherErrorHandler.handleWeatherError(error, {
        source: 'RouteWeatherAlertsService.analyzeRouteWeather',
        routeId: route?.id,
        errorDetails: `Erreur lors de l'analyse météo de l'itinéraire ${route?.id || 'inconnu'}`
      });
    }
  }
  
  /**
   * Vérifie si des changements météo significatifs sont survenus depuis la dernière vérification
   * @param {string} routeId - ID de l'itinéraire à vérifier
   * @param {Object} options - Options de vérification
   * @returns {Array} Changements météo significatifs détectés
   */
  async checkWeatherChanges(routeId, options = {}) {
    try {
      // Cette méthode sera implémentée pour la surveillance continue
      // des changements météo sur les itinéraires favoris
      logger.info(`[RouteWeatherAlertsService] Vérification des changements météo pour l'itinéraire ${routeId}`);
      
      // À implémenter dans une phase ultérieure
      return [];
    } catch (error) {
      return weatherErrorHandler.handleWeatherError(error, {
        source: 'RouteWeatherAlertsService.checkWeatherChanges',
        routeId: routeId,
        errorDetails: `Erreur lors de la vérification des changements météo pour l'itinéraire ${routeId}`
      });
    }
  }
  
  /**
   * Échantillonne les points d'un itinéraire selon un intervalle de distance
   * @param {Array} points - Liste des points GPS de l'itinéraire
   * @param {number} interval - Intervalle en km entre les points à échantillonner
   * @returns {Array} Points échantillonnés
   * @private
   */
  _sampleRoutePoints(points, interval) {
    try {
      if (!points || points.length < 2) {
        return points;
      }
      
      const sampledPoints = [points[0]]; // Toujours inclure le point de départ
      let distanceAccumulator = 0;
      let lastSampledPoint = points[0];
      
      for (let i = 1; i < points.length; i++) {
        const currentPoint = points[i];
        const segmentDistance = this._calculateDistance(
          lastSampledPoint.lat, lastSampledPoint.lon,
          currentPoint.lat, currentPoint.lon
        );
        
        distanceAccumulator += segmentDistance;
        
        // Si on a parcouru l'intervalle souhaité, ajouter le point
        if (distanceAccumulator >= interval) {
          sampledPoints.push(currentPoint);
          lastSampledPoint = currentPoint;
          distanceAccumulator = 0;
        }
      }
      
      // Toujours inclure le point d'arrivée s'il n'a pas déjà été inclus
      const lastPoint = points[points.length - 1];
      if (sampledPoints[sampledPoints.length - 1] !== lastPoint) {
        sampledPoints.push(lastPoint);
      }
      
      return sampledPoints;
    } catch (error) {
      logger.error(`[RouteWeatherAlertsService] Erreur lors de l'échantillonnage des points: ${error.message}`);
      return [points[0], points[points.length - 1]]; // Fallback aux points de départ et d'arrivée
    }
  }

  /**
   * Calcule la distance en km entre deux points GPS en utilisant la formule haversine
   * @param {number} lat1 - Latitude du premier point
   * @param {number} lon1 - Longitude du premier point
   * @param {number} lat2 - Latitude du deuxième point
   * @param {number} lon2 - Longitude du deuxième point
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
    return R * c;
  }
  
  /**
   * Convertit des degrés en radians
   * @param {number} degrees - Angle en degrés
   * @returns {number} Angle en radians
   * @private
   */
  _toRad(degrees) {
    return degrees * Math.PI / 180;
  }
  
  /**
   * Récupère les prévisions météo pour un point GPS
   * @param {Object} point - Point GPS {lat, lon}
   * @param {number} hours - Nombre d'heures de prévision
   * @returns {Promise<Object>} Prévisions météo pour le point
   * @private
   */
  async _getPointWeatherForecast(point, hours) {
    try {
      const { lat, lon } = point;
      const cacheKey = `weather_point_${lat.toFixed(4)}_${lon.toFixed(4)}_${hours}h`;
      
      // Vérifier si les données sont en cache
      const cachedForecast = this.cache.get(cacheKey);
      if (cachedForecast) {
        return cachedForecast;
      }
      
      // Construire l'URL de l'API météo
      const apiUrl = `${config.weatherApi.baseUrl}/forecast`;
      const params = {
        lat: lat,
        lon: lon,
        hours: hours,
        key: config.weatherApi.apiKey,
        format: 'json',
        units: 'metric'
      };
      
      // Appeler l'API météo
      const response = await axios.get(apiUrl, { params });
      
      if (!response.data || response.status !== 200) {
        throw new Error(`Échec de récupération des données météo: ${response.status}`);
      }
      
      // Formater les données de prévision
      const forecast = this._formatWeatherForecast(response.data);
      
      // Stocker en cache
      this.cache.set(cacheKey, forecast);
      
      return forecast;
    } catch (error) {
      logger.error(`[RouteWeatherAlertsService] Erreur de prévision pour le point (${point.lat}, ${point.lon}): ${error.message}`);
      
      // Retourner un objet vide en cas d'erreur
      return {
        error: true,
        message: error.message,
        point: point
      };
    }
  }

  /**
   * Formatte les données de prévision météo brutes en un format standard
   * @param {Object} rawData - Données brutes de l'API météo
   * @returns {Object} Données météo formatées
   * @private
   */
  _formatWeatherForecast(rawData) {
    try {
      if (!rawData || !rawData.forecast || !Array.isArray(rawData.forecast.hourly)) {
        throw new Error('Format de données météo invalide');
      }
      
      // Extraire et normaliser les prévisions horaires
      const hourlyForecasts = rawData.forecast.hourly.map(hour => ({
        time: new Date(hour.time),
        temperature: {
          value: hour.temperature || hour.temp || 0,
          feelsLike: hour.feelsLike || hour.feels_like || 0,
          unit: 'C'
        },
        precipitation: {
          probability: hour.precipProbability || hour.precip_probability || 0,
          intensity: hour.precipIntensity || hour.precip_intensity || 0,
          type: hour.precipType || hour.precip_type || 'rain'
        },
        wind: {
          speed: hour.windSpeed || hour.wind_speed || 0,
          gust: hour.windGust || hour.wind_gust || 0,
          direction: hour.windDirection || hour.wind_direction || 0,
          unit: 'km/h'
        },
        humidity: hour.humidity || 0,
        cloudCover: hour.cloudCover || hour.cloud_cover || 0,
        visibility: hour.visibility || 10,
        uvIndex: hour.uvIndex || hour.uv_index || 0,
        weatherCode: hour.weatherCode || hour.weather_code || 0,
        thunderstormProbability: hour.thunderstorm || hour.thunderstorm_probability || 0
      }));
      
      // Résumé des conditions météo
      const summary = {
        description: rawData.forecast.summary || 'Pas de résumé disponible',
        icon: rawData.forecast.icon || 'default',
        alerts: rawData.alerts || []
      };
      
      return {
        location: {
          lat: rawData.location?.lat || 0,
          lon: rawData.location?.lon || 0,
          name: rawData.location?.name || 'Emplacement inconnu'
        },
        hourly: hourlyForecasts,
        summary: summary,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error(`[RouteWeatherAlertsService] Erreur de formatage des données météo: ${error.message}`);
      
      // Retourner un objet minimal en cas d'erreur
      return {
        error: true,
        message: error.message,
        hourly: [],
        summary: { description: 'Données indisponibles', alerts: [] }
      };
    }
  }
  
  /**
   * Génère des alertes météo en fonction des données de prévision
   * @param {Array} pointsWeather - Tableau de données météo par point
   * @param {Object} options - Options d'analyse
   * @returns {Array} Alertes météo générées
   * @private
   */
  _generateWeatherAlerts(pointsWeather, options) {
    try {
      const alerts = [];
      const { alertTypes, threshold } = options;
      
      // Vérifier si les données sont valides
      if (!pointsWeather || !Array.isArray(pointsWeather) || pointsWeather.length === 0) {
        throw new Error('Données météo invalides pour la génération d\'alertes');
      }
      
      // Pour chaque point avec des prévisions
      pointsWeather.forEach(pointData => {
        const { point, forecast, index } = pointData;
        
        // Ignorer les points avec erreur
        if (forecast.error) {
          return;
        }
        
        // Vérifier les prévisions horaires
        forecast.hourly.forEach(hourly => {
          // Vérifier chaque type d'alerte activé
          if (alertTypes.includes('precipitation')) {
            const alert = this._checkPrecipitationAlert(hourly, point, index, threshold);
            if (alert) alerts.push(alert);
          }
          
          if (alertTypes.includes('wind')) {
            const alert = this._checkWindAlert(hourly, point, index, threshold);
            if (alert) alerts.push(alert);
          }
          
          if (alertTypes.includes('temperature')) {
            const alert = this._checkTemperatureAlert(hourly, point, index, threshold);
            if (alert) alerts.push(alert);
          }
          
          if (alertTypes.includes('thunderstorm')) {
            const alert = this._checkThunderstormAlert(hourly, point, index, threshold);
            if (alert) alerts.push(alert);
          }
          
          if (alertTypes.includes('visibility')) {
            const alert = this._checkVisibilityAlert(hourly, point, index, threshold);
            if (alert) alerts.push(alert);
          }
        });
      });
      
      // Vérifier les changements soudains entre les points
      if (alertTypes.includes('suddenChange') && pointsWeather.length > 1) {
        const suddenChangeAlerts = this._checkSuddenWeatherChanges(pointsWeather, threshold);
        alerts.push(...suddenChangeAlerts);
      }
      
      // Trier les alertes par sévérité puis par horodatage
      return alerts.sort((a, b) => {
        if (a.severity !== b.severity) {
          // Ordre: high, medium, low
          const severityOrder = { high: 0, medium: 1, low: 2 };
          return severityOrder[a.severity] - severityOrder[b.severity];
        }
        // Même sévérité, trier par horodatage
        return a.time - b.time;
      });
    } catch (error) {
      logger.error(`[RouteWeatherAlertsService] Erreur de génération d'alertes: ${error.message}`);
      return [];
    }
  }

  /**
   * Vérifie les conditions de précipitation pour générer une alerte
   * @param {Object} hourly - Prévision horaire
   * @param {Object} point - Point GPS
   * @param {number} routeDistance - Distance sur l'itinéraire en km
   * @param {string} sensitivity - Sensibilité du seuil (standard, high, low)
   * @returns {Object|null} Alerte générée ou null
   * @private
   */
  _checkPrecipitationAlert(hourly, point, routeDistance, sensitivity = 'standard') {
    // Ajuster les seuils selon la sensibilité
    const thresholds = { ...this.thresholds.precipitation };
    if (sensitivity === 'high') {
      // Sensibilité haute = seuils plus bas
      Object.keys(thresholds).forEach(key => thresholds[key] *= 0.7);
    } else if (sensitivity === 'low') {
      // Sensibilité basse = seuils plus hauts
      Object.keys(thresholds).forEach(key => thresholds[key] *= 1.3);
    }
    
    const intensity = hourly.precipitation.intensity;
    const probability = hourly.precipitation.probability;
    
    // Ignorer les faibles probabilités (< 30%)
    if (probability < 0.3) return null;
    
    let level, severity, description;
    
    // Déterminer le niveau d'alerte
    if (intensity >= thresholds.extreme) {
      level = 'extreme';
      severity = 'high';
      description = 'Précipitations extrêmes';
    } else if (intensity >= thresholds.heavy) {
      level = 'heavy';
      severity = 'high';
      description = 'Fortes précipitations';
    } else if (intensity >= thresholds.moderate) {
      level = 'moderate';
      severity = 'medium';
      description = 'Précipitations modérées';
    } else if (intensity >= thresholds.light) {
      level = 'light';
      severity = 'low';
      description = 'Précipitations légères';
    } else {
      // En dessous du seuil minimal
      return null;
    }
    
    // Type de précipitation
    const precipType = hourly.precipitation.type || 'rain';
    const precipTypeMap = {
      rain: 'pluie',
      snow: 'neige',
      sleet: 'grésil',
      hail: 'grêle'
    };
    
    // Créer l'alerte
    return {
      type: 'precipitation',
      subType: precipType,
      level,
      severity,
      time: hourly.time,
      coordinates: { lat: point.lat, lon: point.lon },
      routeDistance,
      description: `${description} (${precipTypeMap[precipType] || precipType})`,
      details: {
        intensity: intensity.toFixed(1),
        probability: (probability * 100).toFixed(0) + '%'
      }
    };
  };

  /**
   * Vérifie les conditions de vent pour générer une alerte
   * @param {Object} hourly - Prévision horaire
   * @param {Object} point - Point GPS
   * @param {number} routeDistance - Distance sur l'itinéraire en km
   * @param {string} sensitivity - Sensibilité du seuil (standard, high, low)
   * @returns {Object|null} Alerte générée ou null
   * @private
   */
  _checkWindAlert(hourly, point, routeDistance, sensitivity = 'standard') {
    // Ajuster les seuils selon la sensibilité
    const thresholds = { ...this.thresholds.wind };
    if (sensitivity === 'high') {
      Object.keys(thresholds).forEach(key => thresholds[key] *= 0.8);
    } else if (sensitivity === 'low') {
      Object.keys(thresholds).forEach(key => thresholds[key] *= 1.2);
    }
    
    const windSpeed = hourly.wind.speed;
    const windGust = hourly.wind.gust || windSpeed * 1.5; // Estimation si non fourni
    
    // Utiliser la valeur la plus élevée
    const effectiveWind = Math.max(windSpeed, windGust);
    
    let level, severity, description;
    
    // Déterminer le niveau d'alerte
    if (effectiveWind >= thresholds.extreme) {
      level = 'extreme';
      severity = 'high';
      description = 'Vent extrêmement fort';
    } else if (effectiveWind >= thresholds.veryStrong) {
      level = 'veryStrong';
      severity = 'high';
      description = 'Vent très fort';
    } else if (effectiveWind >= thresholds.strong) {
      level = 'strong';
      severity = 'medium';
      description = 'Vent fort';
    } else if (effectiveWind >= thresholds.moderate) {
      level = 'moderate';
      severity = 'low';
      description = 'Vent modéré';
    } else {
      // En dessous du seuil minimal
      return null;
    }
    
    // Direction du vent (utile pour les cyclistes)
    const windDirection = hourly.wind.direction;
    const cardinalDirection = this._getCardinalDirection(windDirection);
    
    // Créer l'alerte
    return {
      type: 'wind',
      level,
      severity,
      time: hourly.time,
      coordinates: { lat: point.lat, lon: point.lon },
      routeDistance,
      description,
      details: {
        speed: `${windSpeed.toFixed(1)} km/h`,
        gust: `${windGust.toFixed(1)} km/h`,
        direction: cardinalDirection
      }
    };
  };

  /**
   * Convertit un angle en degrés en direction cardinale
   * @param {number} degrees - Angle en degrés (0-360)
   * @returns {string} Direction cardinale
   * @private
   */
  _getCardinalDirection(degrees) {
    const directions = [
      'N', 'NNE', 'NE', 'ENE', 
      'E', 'ESE', 'SE', 'SSE', 
      'S', 'SSO', 'SO', 'OSO', 
      'O', 'ONO', 'NO', 'NNO'
    ];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  };

  /**
   * Vérifie les conditions de température pour générer une alerte
   * @param {Object} hourly - Prévision horaire
   * @param {Object} point - Point GPS
   * @param {number} routeDistance - Distance sur l'itinéraire en km
   * @param {string} sensitivity - Sensibilité du seuil (standard, high, low)
   * @returns {Object|null} Alerte générée ou null
   * @private
   */
  _checkTemperatureAlert(hourly, point, routeDistance, sensitivity = 'standard') {
    // Ajuster les seuils selon la sensibilité
    const thresholds = { ...this.thresholds.temperature };
    
    if (sensitivity === 'high') {
      // Pour les seuils de chaleur, abaisser les seuils (rendre plus sensible)
      thresholds.hot -= 2;
      thresholds.veryHot -= 2;
      // Pour les seuils de froid, augmenter les seuils (rendre plus sensible)
      thresholds.cold += 2;
      thresholds.veryCold += 2;
    } else if (sensitivity === 'low') {
      // Inverse pour la sensibilité basse
      thresholds.hot += 2;
      thresholds.veryHot += 2;
      thresholds.cold -= 2;
      thresholds.veryCold -= 2;
    }
    
    const temp = hourly.temperature.value;
    const feelsLike = hourly.temperature.feelsLike;
    
    let level, severity, description;
    
    // Vérifier les conditions extrêmes (utiliser la température ressentie)
    if (feelsLike >= thresholds.veryHot) {
      level = 'veryHot';
      severity = 'high';
      description = 'Chaleur extrême';
    } else if (feelsLike >= thresholds.hot) {
      level = 'hot';
      severity = 'medium';
      description = 'Forte chaleur';
    } else if (feelsLike <= thresholds.veryCold) {
      level = 'veryCold';
      severity = 'high';
      description = 'Froid extrême';
    } else if (feelsLike <= thresholds.cold) {
      level = 'cold';
      severity = 'medium';
      description = 'Température froide';
    } else {
      // Température dans la plage normale
      return null;
    }
    
    // Créer l'alerte
    return {
      type: 'temperature',
      level,
      severity,
      time: hourly.time,
      coordinates: { lat: point.lat, lon: point.lon },
      routeDistance,
      description,
      details: {
        temperature: `${temp.toFixed(1)}°C`,
        feelsLike: `${feelsLike.toFixed(1)}°C`
      }
    };
  };

  /**
   * Vérifie les conditions d'orage pour générer une alerte
   * @param {Object} hourly - Prévision horaire
   * @param {Object} point - Point GPS
   * @param {number} routeDistance - Distance sur l'itinéraire en km
   * @param {string} sensitivity - Sensibilité du seuil (standard, high, low)
   * @returns {Object|null} Alerte générée ou null
   * @private
   */
  _checkThunderstormAlert(hourly, point, routeDistance, sensitivity = 'standard') {
    // Ajuster les seuils selon la sensibilité
    const thresholds = { ...this.thresholds.thunderstorm };
    if (sensitivity === 'high') {
      thresholds.possible *= 0.75;
      thresholds.likely *= 0.75;
    } else if (sensitivity === 'low') {
      thresholds.possible *= 1.25;
      thresholds.likely *= 1.25;
    }
    
    const probability = hourly.thunderstormProbability * 100; // En pourcentage
    
    let level, severity, description;
    
    // Déterminer le niveau d'alerte
    if (probability >= thresholds.likely) {
      level = 'likely';
      severity = 'high';
      description = 'Risque élevé d\'orage';
    } else if (probability >= thresholds.possible) {
      level = 'possible';
      severity = 'medium';
      description = 'Risque d\'orage';
    } else {
      // Probabilité trop faible
      return null;
    }
    
    // Créer l'alerte
    return {
      type: 'thunderstorm',
      level,
      severity,
      time: hourly.time,
      coordinates: { lat: point.lat, lon: point.lon },
      routeDistance,
      description,
      details: {
        probability: `${probability.toFixed(0)}%`
      }
    };
  };

  /**
   * Vérifie les conditions de visibilité pour générer une alerte
   * @param {Object} hourly - Prévision horaire
   * @param {Object} point - Point GPS
   * @param {number} routeDistance - Distance sur l'itinéraire en km
   * @param {string} sensitivity - Sensibilité du seuil (standard, high, low)
   * @returns {Object|null} Alerte générée ou null
   * @private
   */
  _checkVisibilityAlert(hourly, point, routeDistance, sensitivity = 'standard') {
    // Ajuster les seuils selon la sensibilité
    const thresholds = { ...this.thresholds.visibility };
    if (sensitivity === 'high') {
      // Pour la visibilité, augmenter les seuils rend plus sensible
      Object.keys(thresholds).forEach(key => thresholds[key] *= 1.5);
    } else if (sensitivity === 'low') {
      Object.keys(thresholds).forEach(key => thresholds[key] *= 0.7);
    }
    
    const visibility = hourly.visibility; // En km
    
    let level, severity, description;
    
    // Déterminer le niveau d'alerte
    if (visibility <= thresholds.veryPoor) {
      level = 'veryPoor';
      severity = 'high';
      description = 'Visibilité très faible';
    } else if (visibility <= thresholds.poor) {
      level = 'poor';
      severity = 'medium';
      description = 'Visibilité faible';
    } else if (visibility <= thresholds.reduced) {
      level = 'reduced';
      severity = 'low';
      description = 'Visibilité réduite';
    } else {
      // Visibilité suffisante
      return null;
    }
    
    // Créer l'alerte
    return {
      type: 'visibility',
      level,
      severity,
      time: hourly.time,
      coordinates: { lat: point.lat, lon: point.lon },
      routeDistance,
      description,
      details: {
        visibility: `${visibility.toFixed(1)} km`
      }
    };
  }

  /**
   * Vérifie les changements soudains de météo entre deux points
   * @param {Array} pointsWeather - Tableau de données météo par point
   * @param {string} sensitivity - Sensibilité du seuil (standard, high, low)
   * @returns {Array} Alertes de changement soudain
   * @private
   */
  _checkSuddenWeatherChanges(pointsWeather, sensitivity = 'standard') {
    const alerts = [];
    
    // Facteurs de sensibilité
    let sensitivityFactor = 1.0;
    if (sensitivity === 'high') {
      sensitivityFactor = 0.7; // Plus sensible
    } else if (sensitivity === 'low') {
      sensitivityFactor = 1.5; // Moins sensible
    }
    
    // Seuils de changement soudain
    const suddenChangeThresholds = {
      temperature: 5 * sensitivityFactor, // °C
      precipitation: 5 * sensitivityFactor, // mm/h
      wind: 15 * sensitivityFactor, // km/h
      visibility: 3 * sensitivityFactor, // km
    };
    
    // Pour chaque paire de points consécutifs
    for (let i = 0; i < pointsWeather.length - 1; i++) {
      const current = pointsWeather[i];
      const next = pointsWeather[i + 1];
      
      // Ignorer si l'une des prévisions a une erreur
      if (current.forecast.error || next.forecast.error) continue;
      
      // Comparer les prévisions pour la même heure (première heure de prévision)
      const currentForecast = current.forecast.hourly[0];
      const nextForecast = next.forecast.hourly[0];
      
      // Vérifier les changements soudains de température
      const tempDiff = Math.abs(nextForecast.temperature.value - currentForecast.temperature.value);
      if (tempDiff >= suddenChangeThresholds.temperature) {
        alerts.push({
          type: 'suddenChange',
          subType: 'temperature',
          severity: tempDiff >= suddenChangeThresholds.temperature * 1.5 ? 'high' : 'medium',
          routeDistanceStart: current.index,
          routeDistanceEnd: next.index,
          time: currentForecast.time,
          coordinates: [
            { lat: current.point.lat, lon: current.point.lon },
            { lat: next.point.lat, lon: next.point.lon }
          ],
          description: `Changement soudain de température (${tempDiff.toFixed(1)}°C)`,
          details: {
            from: `${currentForecast.temperature.value.toFixed(1)}°C`,
            to: `${nextForecast.temperature.value.toFixed(1)}°C`,
            distance: `${(next.index - current.index).toFixed(1)} km`
          }
        });
      }
      
      // Vérifier les changements soudains de précipitation
      const precipDiff = Math.abs(
        nextForecast.precipitation.intensity - currentForecast.precipitation.intensity
      );
      if (precipDiff >= suddenChangeThresholds.precipitation) {
        alerts.push({
          type: 'suddenChange',
          subType: 'precipitation',
          severity: precipDiff >= suddenChangeThresholds.precipitation * 1.5 ? 'high' : 'medium',
          routeDistanceStart: current.index,
          routeDistanceEnd: next.index,
          time: currentForecast.time,
          coordinates: [
            { lat: current.point.lat, lon: current.point.lon },
            { lat: next.point.lat, lon: next.point.lon }
          ],
          description: `Changement soudain de précipitations`,
          details: {
            from: `${currentForecast.precipitation.intensity.toFixed(1)} mm/h`,
            to: `${nextForecast.precipitation.intensity.toFixed(1)} mm/h`,
            distance: `${(next.index - current.index).toFixed(1)} km`
          }
        });
      }
      
      // Vérifier les changements soudains de vent
      const windDiff = Math.abs(nextForecast.wind.speed - currentForecast.wind.speed);
      if (windDiff >= suddenChangeThresholds.wind) {
        alerts.push({
          type: 'suddenChange',
          subType: 'wind',
          severity: windDiff >= suddenChangeThresholds.wind * 1.5 ? 'high' : 'medium',
          routeDistanceStart: current.index,
          routeDistanceEnd: next.index,
          time: currentForecast.time,
          coordinates: [
            { lat: current.point.lat, lon: current.point.lon },
            { lat: next.point.lat, lon: next.point.lon }
          ],
          description: `Changement soudain de vent`,
          details: {
            from: `${currentForecast.wind.speed.toFixed(1)} km/h`,
            to: `${nextForecast.wind.speed.toFixed(1)} km/h`,
            distance: `${(next.index - current.index).toFixed(1)} km`
          }
        });
      }
      
      // Vérifier les changements soudains de visibilité
      const visibilityDiff = Math.abs(nextForecast.visibility - currentForecast.visibility);
      if (visibilityDiff >= suddenChangeThresholds.visibility) {
        alerts.push({
          type: 'suddenChange',
          subType: 'visibility',
          severity: visibilityDiff >= suddenChangeThresholds.visibility * 1.5 ? 'high' : 'medium',
          routeDistanceStart: current.index,
          routeDistanceEnd: next.index,
          time: currentForecast.time,
          coordinates: [
            { lat: current.point.lat, lon: current.point.lon },
            { lat: next.point.lat, lon: next.point.lon }
          ],
          description: `Changement soudain de visibilité`,
          details: {
            from: `${currentForecast.visibility.toFixed(1)} km`,
            to: `${nextForecast.visibility.toFixed(1)} km`,
            distance: `${(next.index - current.index).toFixed(1)} km`
          }
        });
      }
    }
    
    return alerts;
  }
}

module.exports = new RouteWeatherAlertsService();
