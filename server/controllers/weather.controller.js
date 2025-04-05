// weather.controller.js - Contrôleur pour les interactions avec l'API OpenWeatherMap
const weatherService = require('../services/weather.service');

class WeatherController {
  /**
   * Récupère les données météo actuelles pour une localisation
   * @param {object} req - Requête Express
   * @param {object} res - Réponse Express
   */
  async getCurrentWeather(req, res) {
    try {
      const { lat, lon } = req.query;
      
      // Validation des coordonnées
      if (!lat || !lon || isNaN(Number(lat)) || isNaN(Number(lon))) {
        return res.status(400).json({
          success: false,
          error: 'Coordonnées (lat, lon) requises et doivent être numériques'
        });
      }
      
      const weather = await weatherService.getCurrentWeather(Number(lat), Number(lon));
      
      res.json({
        success: true,
        data: weather
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des données météo:', error);
      res.status(500).json({
        success: false,
        error: 'Échec de la récupération des données météo'
      });
    }
  }

  /**
   * Récupère les prévisions météo pour une localisation
   * @param {object} req - Requête Express
   * @param {object} res - Réponse Express
   */
  async getForecast(req, res) {
    try {
      const { lat, lon } = req.query;
      
      // Validation des coordonnées
      if (!lat || !lon || isNaN(Number(lat)) || isNaN(Number(lon))) {
        return res.status(400).json({
          success: false,
          error: 'Coordonnées (lat, lon) requises et doivent être numériques'
        });
      }
      
      const forecast = await weatherService.getForecast(Number(lat), Number(lon));
      
      res.json({
        success: true,
        data: forecast
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des prévisions météo:', error);
      res.status(500).json({
        success: false,
        error: 'Échec de la récupération des prévisions météo'
      });
    }
  }

  /**
   * Récupère les prévisions météo horaires pour une localisation
   * @param {object} req - Requête Express
   * @param {object} res - Réponse Express
   */
  async getHourlyForecast(req, res) {
    try {
      const { lat, lon } = req.query;
      
      // Validation des coordonnées
      if (!lat || !lon || isNaN(Number(lat)) || isNaN(Number(lon))) {
        return res.status(400).json({
          success: false,
          error: 'Coordonnées (lat, lon) requises et doivent être numériques'
        });
      }
      
      const hourlyForecast = await weatherService.getHourlyForecast(Number(lat), Number(lon));
      
      res.json({
        success: true,
        data: hourlyForecast
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des prévisions horaires:', error);
      res.status(500).json({
        success: false,
        error: 'Échec de la récupération des prévisions météo horaires'
      });
    }
  }

  /**
   * Récupère l'indice UV pour une localisation
   * @param {object} req - Requête Express
   * @param {object} res - Réponse Express
   */
  async getUvIndex(req, res) {
    try {
      const { lat, lon } = req.query;
      
      // Validation des coordonnées
      if (!lat || !lon || isNaN(Number(lat)) || isNaN(Number(lon))) {
        return res.status(400).json({
          success: false,
          error: 'Coordonnées (lat, lon) requises et doivent être numériques'
        });
      }
      
      const uvIndex = await weatherService.getUvIndex(Number(lat), Number(lon));
      
      res.json({
        success: true,
        data: uvIndex
      });
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'indice UV:', error);
      res.status(500).json({
        success: false,
        error: 'Échec de la récupération de l\'indice UV'
      });
    }
  }

  /**
   * Récupère les données de qualité de l'air pour une localisation
   * @param {object} req - Requête Express
   * @param {object} res - Réponse Express
   */
  async getAirQuality(req, res) {
    try {
      const { lat, lon } = req.query;
      
      // Validation des coordonnées
      if (!lat || !lon || isNaN(Number(lat)) || isNaN(Number(lon))) {
        return res.status(400).json({
          success: false,
          error: 'Coordonnées (lat, lon) requises et doivent être numériques'
        });
      }
      
      const airQuality = await weatherService.getAirPollution(Number(lat), Number(lon));
      
      res.json({
        success: true,
        data: airQuality
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des données de qualité de l\'air:', error);
      res.status(500).json({
        success: false,
        error: 'Échec de la récupération des données de qualité de l\'air'
      });
    }
  }
  
  /**
   * Récupère les conditions optimales pour le cyclisme sur plusieurs jours
   * @param {object} req - Requête Express
   * @param {object} res - Réponse Express
   */
  async getCyclingConditions(req, res) {
    try {
      const { lat, lon } = req.query;
      
      // Validation des coordonnées
      if (!lat || !lon || isNaN(Number(lat)) || isNaN(Number(lon))) {
        return res.status(400).json({
          success: false,
          error: 'Coordonnées (lat, lon) requises et doivent être numériques'
        });
      }
      
      // Récupération des prévisions sur 5 jours
      const forecast = await weatherService.getForecast(Number(lat), Number(lon));
      
      // Filtrage et classement des meilleures conditions de cyclisme
      const cyclingConditions = forecast.list
        .map(item => ({
          date: item.date,
          score: item.cyclingCondition,
          temperature: item.temperature.current,
          weather: item.weather,
          wind: item.wind,
          humidity: item.humidity
        }))
        .sort((a, b) => b.score - a.score); // Tri par meilleur score
      
      res.json({
        success: true,
        location: forecast.city,
        data: cyclingConditions
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des conditions de cyclisme:', error);
      res.status(500).json({
        success: false,
        error: 'Échec de la récupération des conditions optimales pour le cyclisme'
      });
    }
  }
}

module.exports = new WeatherController();
