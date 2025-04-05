/**
 * Service de validation des clés API
 * Vérifie la validité des clés API au démarrage du serveur et fournit
 * des valeurs par défaut ou des messages d'erreur si nécessaire
 */
const axios = require('axios');
const config = require('../config/api.config');
const { logger } = require('../utils/logger');

class ApiValidatorService {
  constructor() {
    this.validationResults = {
      openWeather: { valid: false, message: '' },
      mapbox: { valid: false, message: '' },
      openRoute: { valid: false, message: '' },
      strava: { valid: false, message: '' },
      openai: { valid: false, message: '' }
    };
  }

  /**
   * Valide toutes les clés API au démarrage du serveur
   * @returns {Promise<Object>} Résultats de validation
   */
  async validateAllApiKeys() {
    logger.info('Démarrage de la validation des clés API...');
    
    try {
      // Validation parallèle pour améliorer les performances de démarrage
      await Promise.all([
        this.validateOpenWeatherKey(),
        this.validateMapboxKey(),
        this.validateOpenRouteKey(),
        this.validateStravaCredentials(),
        this.validateOpenAiKey()
      ]);
      
      // Afficher un récapitulatif des résultats
      this._logValidationSummary();
      
      return this.validationResults;
    } catch (error) {
      logger.error('Erreur lors de la validation des clés API:', error.message);
      return this.validationResults;
    }
  }
  
  /**
   * Valide la clé API OpenWeatherMap
   * @returns {Promise<void>}
   */
  async validateOpenWeatherKey() {
    const apiKey = config.openWeather.apiKey;
    
    if (!apiKey || apiKey === 'your_openweather_key_here') {
      this.validationResults.openWeather = {
        valid: false,
        message: 'Clé API OpenWeatherMap manquante ou invalide'
      };
      return;
    }
    
    try {
      // Effectuer une requête de test minimal (géolocalisation)
      const response = await axios.get(
        `${config.openWeather.baseUrl}/geo/1.0/direct?q=Paris&limit=1&appid=${apiKey}`
      );
      
      if (response.status === 200 && response.data && response.data.length > 0) {
        this.validationResults.openWeather = {
          valid: true,
          message: 'Clé API OpenWeatherMap valide'
        };
      } else {
        this.validationResults.openWeather = {
          valid: false,
          message: 'La clé API OpenWeatherMap ne renvoie pas de données valides'
        };
      }
    } catch (error) {
      this.validationResults.openWeather = {
        valid: false,
        message: `Erreur de validation OpenWeatherMap: ${error.response?.data?.message || error.message}`
      };
    }
  }
  
  /**
   * Valide la clé API Mapbox
   * @returns {Promise<void>}
   */
  async validateMapboxKey() {
    const apiKey = config.mapbox.publicToken;
    
    if (!apiKey || apiKey === 'your_mapbox_public_token_here') {
      this.validationResults.mapbox = {
        valid: false,
        message: 'Clé API Mapbox manquante ou invalide'
      };
      return;
    }
    
    try {
      // Effectuer une requête de test minimal (geocoding)
      const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/Paris.json?access_token=${apiKey}&limit=1`
      );
      
      if (response.status === 200 && response.data && response.data.features) {
        this.validationResults.mapbox = {
          valid: true,
          message: 'Clé API Mapbox valide'
        };
      } else {
        this.validationResults.mapbox = {
          valid: false,
          message: 'La clé API Mapbox ne renvoie pas de données valides'
        };
      }
    } catch (error) {
      this.validationResults.mapbox = {
        valid: false,
        message: `Erreur de validation Mapbox: ${error.response?.data?.message || error.message}`
      };
    }
  }
  
  /**
   * Valide la clé API OpenRouteService
   * @returns {Promise<void>}
   */
  async validateOpenRouteKey() {
    const apiKey = config.openRoute.apiKey;
    
    if (!apiKey || apiKey === 'your_openroute_key_here') {
      this.validationResults.openRoute = {
        valid: false,
        message: 'Clé API OpenRouteService manquante ou invalide'
      };
      return;
    }
    
    try {
      // Effectuer une requête de test minimal (health check)
      const response = await axios.get(
        `${config.openRoute.baseUrl}/health`, 
        { headers: { 'Authorization': apiKey } }
      );
      
      if (response.status === 200) {
        this.validationResults.openRoute = {
          valid: true,
          message: 'Clé API OpenRouteService valide'
        };
      } else {
        this.validationResults.openRoute = {
          valid: false,
          message: 'La clé API OpenRouteService ne renvoie pas de données valides'
        };
      }
    } catch (error) {
      this.validationResults.openRoute = {
        valid: false,
        message: `Erreur de validation OpenRouteService: ${error.response?.data?.error?.message || error.message}`
      };
    }
  }
  
  /**
   * Valide les identifiants Strava
   * @returns {Promise<void>}
   */
  async validateStravaCredentials() {
    const clientId = config.strava.clientId;
    const clientSecret = config.strava.clientSecret;
    
    if (!clientId || clientId === 'your_strava_client_id_here' ||
        !clientSecret || clientSecret === 'your_strava_client_secret_here') {
      this.validationResults.strava = {
        valid: false,
        message: 'Identifiants Strava manquants ou invalides'
      };
      return;
    }
    
    // Pour Strava, on ne peut pas facilement tester l'authentification sans redirection OAuth
    // On vérifie simplement si les identifiants semblent valides (non vides et aux bons formats)
    if (
      clientId.match(/^\d+$/) && 
      clientSecret.match(/^[a-f0-9]{40}$/) &&
      config.strava.redirectUri.startsWith('http')
    ) {
      this.validationResults.strava = {
        valid: true,
        message: 'Identifiants Strava semblent valides (format correct)'
      };
    } else {
      this.validationResults.strava = {
        valid: false,
        message: 'Format des identifiants Strava incorrect'
      };
    }
  }
  
  /**
   * Valide la clé API OpenAI
   * @returns {Promise<void>}
   */
  async validateOpenAiKey() {
    const apiKey = config.openai.apiKey;
    
    if (!apiKey || apiKey === 'your_openai_key_here') {
      this.validationResults.openai = {
        valid: false,
        message: 'Clé API OpenAI manquante ou invalide'
      };
      return;
    }
    
    try {
      // Effectuer une requête de test minimal (modèles disponibles)
      const response = await axios.get(
        'https://api.openai.com/v1/models',
        { headers: { 'Authorization': `Bearer ${apiKey}` } }
      );
      
      if (response.status === 200 && response.data && response.data.data) {
        this.validationResults.openai = {
          valid: true,
          message: 'Clé API OpenAI valide'
        };
      } else {
        this.validationResults.openai = {
          valid: false,
          message: 'La clé API OpenAI ne renvoie pas de données valides'
        };
      }
    } catch (error) {
      this.validationResults.openai = {
        valid: false,
        message: `Erreur de validation OpenAI: ${error.response?.data?.error?.message || error.message}`
      };
    }
  }
  
  /**
   * Modifie le gestionnaire de configuration pour utiliser des valeurs par défaut
   * pour les clés API manquantes ou invalides
   */
  applyDefaultValuesForMissingKeys() {
    if (!this.validationResults.openWeather.valid) {
      logger.warn(`⚠️ Utilisation de données météo de démo: ${this.validationResults.openWeather.message}`);
      config.fallbackOptions = config.fallbackOptions || {};
      config.fallbackOptions.useWeatherDemoData = true;
    }
    
    if (!this.validationResults.mapbox.valid) {
      logger.warn(`⚠️ Utilisation de cartes statiques: ${this.validationResults.mapbox.message}`);
      config.fallbackOptions = config.fallbackOptions || {};
      config.fallbackOptions.useStaticMaps = true;
    }
    
    if (!this.validationResults.openRoute.valid) {
      logger.warn(`⚠️ Utilisation d'itinéraires prédéfinis: ${this.validationResults.openRoute.message}`);
      config.fallbackOptions = config.fallbackOptions || {};
      config.fallbackOptions.useDefaultRoutes = true;
    }
    
    if (!this.validationResults.strava.valid) {
      logger.warn(`⚠️ Désactivation de l'intégration Strava: ${this.validationResults.strava.message}`);
      config.fallbackOptions = config.fallbackOptions || {};
      config.fallbackOptions.disableStravaIntegration = true;
    }
    
    if (!this.validationResults.openai.valid) {
      logger.warn(`⚠️ Désactivation des recommandations IA: ${this.validationResults.openai.message}`);
      config.fallbackOptions = config.fallbackOptions || {};
      config.fallbackOptions.disableAiRecommendations = true;
    }
    
    // Mettre à jour le statut global de validation
    config.isValid = Object.values(this.validationResults).every(result => result.valid);
  }
  
  /**
   * Affiche un récapitulatif de la validation des clés API
   * @private
   */
  _logValidationSummary() {
    logger.info('=== Récapitulatif de validation des clés API ===');
    Object.entries(this.validationResults).forEach(([apiName, result]) => {
      if (result.valid) {
        logger.info(`✅ ${apiName}: ${result.message}`);
      } else {
        logger.warn(`❌ ${apiName}: ${result.message}`);
      }
    });
    
    // Calcul du pourcentage de validité des APIs
    const validCount = Object.values(this.validationResults).filter(r => r.valid).length;
    const totalCount = Object.keys(this.validationResults).length;
    const validPercentage = Math.round((validCount / totalCount) * 100);
    
    logger.info(`🔑 Bilan: ${validCount}/${totalCount} APIs valides (${validPercentage}%)`);
  }
}

// Singleton service
const apiValidatorService = new ApiValidatorService();

module.exports = apiValidatorService;
