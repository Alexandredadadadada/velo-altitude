/**
 * Service de qualité de l'air pour le dashboard européen de cyclisme
 * Utilise plusieurs sources de données pour fournir des informations précises sur la qualité de l'air
 */

const axios = require('axios');
const NodeCache = require('node-cache');
const ApiManagerService = require('./api-manager.service');
const logger = require('../utils/logger');

class AirQualityService {
  constructor() {
    this.apiManager = new ApiManagerService();
    this.cache = new NodeCache({ 
      stdTTL: process.env.CACHE_TTL || 600, 
      checkperiod: process.env.CACHE_CHECK_PERIOD || 120 
    });
    
    // Sources de données pour la qualité de l'air
    this.dataSources = {
      primary: {
        name: 'openweather',
        endpoint: 'air_pollution',
        params: {}
      },
      secondary: {
        name: 'waqi', // World Air Quality Index
        endpoint: 'feed',
        params: {}
      }
    };
  }

  /**
   * Obtient la qualité de l'air actuelle pour une localisation donnée
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @returns {Promise<Object>} - Données de qualité d'air
   */
  async getCurrentAirQuality(lat, lon) {
    const cacheKey = `air-quality-${lat}-${lon}`;
    const cachedData = this.cache.get(cacheKey);
    
    if (cachedData) {
      logger.info(`[AirQualityService] Using cached air quality data for ${lat},${lon}`);
      return cachedData;
    }

    try {
      // Utiliser le gestionnaire d'API pour exécuter la requête avec retry et fallback
      const airQualityData = await this.apiManager.execute(
        'weather',
        'fetchAirPollution',
        { lat, lon },
        { 
          cacheTTL: 1800, // 30 minutes
          alternativeService: {
            name: 'waqi',
            method: 'getAirQuality',
            params: { lat, lon }
          }
        }
      );

      // Traitement et standardisation des données
      const processedData = this._processAirQualityData(airQualityData);
      
      // Mise en cache
      this.cache.set(cacheKey, processedData);
      
      return processedData;
    } catch (error) {
      logger.error(`[AirQualityService] Error fetching air quality data: ${error.message}`);
      throw new Error(`Failed to fetch air quality data: ${error.message}`);
    }
  }

  /**
   * Obtient les prévisions de qualité d'air pour une localisation sur plusieurs jours
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @param {number} days - Nombre de jours de prévision (max 5)
   * @returns {Promise<Object>} - Prévisions de qualité d'air
   */
  async getAirQualityForecast(lat, lon, days = 3) {
    const cacheKey = `air-quality-forecast-${lat}-${lon}-${days}`;
    const cachedData = this.cache.get(cacheKey);
    
    if (cachedData) {
      logger.info(`[AirQualityService] Using cached air quality forecast for ${lat},${lon}`);
      return cachedData;
    }

    try {
      // Limiter à 5 jours maximum
      const daysToFetch = Math.min(days, 5);
      
      const forecastData = await this.apiManager.execute(
        'weather',
        'fetchAirPollutionForecast',
        { lat, lon, days: daysToFetch },
        { cacheTTL: 3600 } // 1 heure
      );

      // Traitement et standardisation des données de prévision
      const processedForecast = this._processAirQualityForecast(forecastData, daysToFetch);
      
      // Mise en cache
      this.cache.set(cacheKey, processedForecast);
      
      return processedForecast;
    } catch (error) {
      logger.error(`[AirQualityService] Error fetching air quality forecast: ${error.message}`);
      throw new Error(`Failed to fetch air quality forecast: ${error.message}`);
    }
  }
  
  /**
   * Obtient la qualité de l'air le long d'un itinéraire
   * @param {Array<Array<number>>} routePoints - Points de l'itinéraire [lon, lat]
   * @param {number} sampleInterval - Intervalle d'échantillonnage en kilomètres
   * @returns {Promise<Array<Object>>} - Données de qualité d'air le long de l'itinéraire
   */
  async getAirQualityAlongRoute(routePoints, sampleInterval = 5) {
    try {
      // Échantillonner les points de l'itinéraire pour réduire le nombre de requêtes
      const sampledPoints = this._sampleRoutePoints(routePoints, sampleInterval);
      
      // Récupérer les données de qualité d'air pour chaque point échantillonné
      const airQualityPromises = sampledPoints.map(point => 
        this.getCurrentAirQuality(point[1], point[0]) // [lon, lat] -> lat, lon
      );
      
      const airQualityData = await Promise.all(airQualityPromises);
      
      // Combiner les données avec les points de l'itinéraire
      return sampledPoints.map((point, index) => ({
        location: {
          lon: point[0],
          lat: point[1]
        },
        distance: index * sampleInterval,
        airQuality: airQualityData[index]
      }));
    } catch (error) {
      logger.error(`[AirQualityService] Error fetching air quality along route: ${error.message}`);
      throw new Error(`Failed to fetch air quality along route: ${error.message}`);
    }
  }

  /**
   * Traite et standardise les données de qualité d'air
   * @private
   * @param {Object} data - Données brutes de qualité d'air
   * @returns {Object} - Données traitées
   */
  _processAirQualityData(data) {
    try {
      // Si les données viennent d'OpenWeatherMap
      if (data.list && data.list.length > 0) {
        const airData = data.list[0].components;
        const aqi = data.list[0].main.aqi;
        
        return {
          timestamp: new Date(data.list[0].dt * 1000).toISOString(),
          aqi: aqi,
          aqiCategory: this._getAQICategory(aqi),
          pollutants: {
            co: airData.co, // Monoxyde de carbone (μg/m3)
            no: airData.no, // Monoxyde d'azote (μg/m3)
            no2: airData.no2, // Dioxyde d'azote (μg/m3)
            o3: airData.o3, // Ozone (μg/m3)
            so2: airData.so2, // Dioxyde de soufre (μg/m3)
            pm2_5: airData.pm2_5, // Particules fines PM2.5 (μg/m3)
            pm10: airData.pm10, // Particules PM10 (μg/m3)
            nh3: airData.nh3 // Ammoniac (μg/m3)
          },
          health: {
            respiratoryImpact: this._calculateRespiratoryImpact(airData),
            cyclingSafety: this._calculateCyclingSafety(aqi, airData)
          }
        };
      } else {
        throw new Error('Unknown air quality data format');
      }
    } catch (error) {
      logger.error(`[AirQualityService] Error processing air quality data: ${error.message}`);
      throw new Error(`Failed to process air quality data: ${error.message}`);
    }
  }

  /**
   * Traite les données de prévision de qualité d'air
   * @private
   * @param {Object} data - Données brutes de prévision
   * @param {number} days - Nombre de jours
   * @returns {Object} - Données traitées
   */
  _processAirQualityForecast(data, days) {
    try {
      if (!data.list || data.list.length === 0) {
        throw new Error('Invalid forecast data format');
      }
      
      // Regrouper par jour
      const dailyForecasts = [];
      const now = new Date();
      
      for (let i = 0; i < days; i++) {
        const targetDate = new Date(now);
        targetDate.setDate(targetDate.getDate() + i);
        const targetDay = targetDate.toISOString().split('T')[0];
        
        // Filtrer les entrées pour ce jour
        const dayEntries = data.list.filter(entry => {
          const entryDate = new Date(entry.dt * 1000);
          return entryDate.toISOString().split('T')[0] === targetDay;
        });
        
        if (dayEntries.length > 0) {
          // Calculer l'AQI moyen pour la journée
          const avgAqi = Math.round(
            dayEntries.reduce((sum, entry) => sum + entry.main.aqi, 0) / dayEntries.length
          );
          
          // Trouver l'entrée la plus critique (pire AQI)
          const worstEntry = dayEntries.reduce((worst, entry) => 
            entry.main.aqi > worst.main.aqi ? entry : worst, dayEntries[0]
          );
          
          dailyForecasts.push({
            date: targetDay,
            averageAqi: avgAqi,
            aqiCategory: this._getAQICategory(avgAqi),
            worstAqi: worstEntry.main.aqi,
            worstTime: new Date(worstEntry.dt * 1000).toISOString(),
            worstCondition: this._processAirQualityData({list: [worstEntry]}),
            cyclingSafety: this._calculateCyclingSafety(avgAqi, worstEntry.components)
          });
        }
      }
      
      return {
        location: {
          lat: data.coord.lat,
          lon: data.coord.lon
        },
        forecastGenerated: new Date().toISOString(),
        days: dailyForecasts
      };
    } catch (error) {
      logger.error(`[AirQualityService] Error processing air quality forecast: ${error.message}`);
      throw new Error(`Failed to process air quality forecast: ${error.message}`);
    }
  }

  /**
   * Échantillonne les points d'un itinéraire pour réduire le nombre de requêtes
   * @private
   * @param {Array<Array<number>>} routePoints - Points de l'itinéraire [lon, lat]
   * @param {number} interval - Intervalle d'échantillonnage en kilomètres
   * @returns {Array<Array<number>>} - Points échantillonnés
   */
  _sampleRoutePoints(routePoints, interval) {
    if (!routePoints || routePoints.length === 0) {
      return [];
    }
    
    const sampledPoints = [routePoints[0]];
    let distanceSoFar = 0;
    
    for (let i = 1; i < routePoints.length; i++) {
      const prevPoint = routePoints[i - 1];
      const currPoint = routePoints[i];
      
      const segmentDistance = this._calculateDistance(
        prevPoint[1], prevPoint[0],
        currPoint[1], currPoint[0]
      );
      
      distanceSoFar += segmentDistance;
      
      if (distanceSoFar >= interval) {
        sampledPoints.push(currPoint);
        distanceSoFar = 0;
      }
    }
    
    // Toujours inclure le dernier point
    if (sampledPoints[sampledPoints.length - 1] !== routePoints[routePoints.length - 1]) {
      sampledPoints.push(routePoints[routePoints.length - 1]);
    }
    
    return sampledPoints;
  }

  /**
   * Calcule la distance entre deux points en kilomètres (formule de Haversine)
   * @private
   * @param {number} lat1 - Latitude du point 1
   * @param {number} lon1 - Longitude du point 1
   * @param {number} lat2 - Latitude du point 2
   * @param {number} lon2 - Longitude du point 2
   * @returns {number} - Distance en kilomètres
   */
  _calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this._deg2rad(lat2 - lat1);
    const dLon = this._deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this._deg2rad(lat1)) * Math.cos(this._deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Convertit les degrés en radians
   * @private
   * @param {number} deg - Angle en degrés
   * @returns {number} - Angle en radians
   */
  _deg2rad(deg) {
    return deg * (Math.PI/180);
  }

  /**
   * Retourne la catégorie de qualité d'air basée sur l'indice
   * @private
   * @param {number} aqi - Indice de qualité d'air
   * @returns {string} - Catégorie
   */
  _getAQICategory(aqi) {
    // Selon les standards européens
    switch(aqi) {
      case 1: return 'Bonne';
      case 2: return 'Moyenne';
      case 3: return 'Modérée';
      case 4: return 'Mauvaise';
      case 5: return 'Très mauvaise';
      default: return 'Inconnue';
    }
  }

  /**
   * Calcule l'impact respiratoire basé sur les polluants
   * @private
   * @param {Object} pollutants - Données des polluants
   * @returns {Object} - Impact respiratoire
   */
  _calculateRespiratoryImpact(pollutants) {
    // Pondération simplifiée des impacts respiratoires des différents polluants
    let impact = 0;
    
    // Seuils OMS pour impact respiratoire
    if (pollutants.pm2_5 > 10) impact += (pollutants.pm2_5 - 10) / 5;
    if (pollutants.pm10 > 20) impact += (pollutants.pm10 - 20) / 10;
    if (pollutants.o3 > 100) impact += (pollutants.o3 - 100) / 20;
    if (pollutants.no2 > 40) impact += (pollutants.no2 - 40) / 10;
    
    // Normaliser entre 0 et 10
    impact = Math.min(10, Math.max(0, impact));
    
    let category;
    if (impact < 2) category = 'Négligeable';
    else if (impact < 4) category = 'Faible';
    else if (impact < 6) category = 'Modéré';
    else if (impact < 8) category = 'Élevé';
    else category = 'Sévère';
    
    return {
      score: Math.round(impact * 10) / 10,
      category: category
    };
  }

  /**
   * Calcule la sécurité pour le cyclisme basée sur la qualité de l'air
   * @private
   * @param {number} aqi - Indice de qualité d'air
   * @param {Object} pollutants - Données des polluants
   * @returns {Object} - Évaluation de sécurité
   */
  _calculateCyclingSafety(aqi, pollutants) {
    let safetyScore;
    let recommendation;
    
    switch(aqi) {
      case 1:
        safetyScore = 90;
        recommendation = 'Conditions optimales pour le cyclisme.';
        break;
      case 2:
        safetyScore = 75;
        recommendation = 'Bonnes conditions. Les personnes sensibles peuvent ressentir un léger inconfort.';
        break;
      case 3:
        safetyScore = 50;
        recommendation = 'Évitez les efforts intenses prolongés, surtout si vous avez des problèmes respiratoires.';
        break;
      case 4:
        safetyScore = 30;
        recommendation = 'Limitez la durée de votre sortie et évitez les efforts intenses.';
        break;
      case 5:
        safetyScore = 10;
        recommendation = 'Sortie déconseillée. Risque élevé pour la santé respiratoire.';
        break;
      default:
        safetyScore = 50;
        recommendation = 'Données insuffisantes pour évaluer les conditions.';
    }
    
    // Ajustements spécifiques pour les cyclistes
    if (pollutants) {
      // Ozone - particulièrement problématique pendant l'effort
      if (pollutants.o3 > 120) {
        safetyScore -= 10;
        recommendation += ' Niveau d\'ozone élevé, attention aux problèmes respiratoires.';
      }
      
      // NO2 - irritant pour les voies respiratoires pendant l'exercice
      if (pollutants.no2 > 50) {
        safetyScore -= 5;
      }
    }
    
    // Classification
    let category;
    if (safetyScore >= 80) category = 'Excellent';
    else if (safetyScore >= 60) category = 'Bon';
    else if (safetyScore >= 40) category = 'Modéré';
    else if (safetyScore >= 20) category = 'Mauvais';
    else category = 'Dangereux';
    
    return {
      score: Math.max(0, Math.min(100, safetyScore)),
      category: category,
      recommendation: recommendation
    };
  }
}

module.exports = new AirQualityService();
