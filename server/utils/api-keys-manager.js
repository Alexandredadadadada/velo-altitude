const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const dotenv = require('dotenv');
const axios = require('axios');

/**
 * Classe responsable de la gestion sécurisée des clés API
 * Implémente les recommandations de sécurité de l'Agent 3 (Assurance Qualité & Intégration)
 */
class ApiKeysManager {
  constructor(configPath) {
    this.configPath = configPath;
    this.keys = {};
    this.loadKeys();
  }

  /**
   * Charge les clés API à partir du fichier .env
   */
  loadKeys() {
    try {
      dotenv.config({ path: this.configPath });
      
      // Sécuriser les clés en mémoire
      this.keys = {
        mapbox: {
          publicToken: process.env.MAPBOX_PUBLIC_TOKEN,
          secretToken: process.env.MAPBOX_SECRET_TOKEN
        },
        openweathermap: {
          apiKey: process.env.OPENWEATHER_API_KEY
        },
        openroute: {
          apiKey: process.env.OPENROUTE_API_KEY
        },
        strava: {
          clientId: process.env.STRAVA_CLIENT_ID,
          clientSecret: process.env.STRAVA_CLIENT_SECRET,
          accessToken: process.env.STRAVA_ACCESS_TOKEN,
          refreshToken: process.env.STRAVA_REFRESH_TOKEN,
          redirectUri: process.env.STRAVA_REDIRECT_URI
        },
        openai: {
          apiKey: process.env.OPENAI_API_KEY
        },
        claude: {
          apiKey: process.env.CLAUDE_API_KEY
        }
      };
      
      console.log('API keys loaded successfully');
    } catch (error) {
      console.error('Error loading API keys:', error);
      this.keys = {};
    }
  }

  /**
   * Récupère une clé API spécifique
   * @param {string} service - Nom du service API
   * @param {string} keyType - Type de clé (si applicable)
   * @returns {string|null} - La clé API ou null si non trouvée
   */
  getKey(service, keyType = 'apiKey') {
    if (!this.keys[service]) {
      return null;
    }
    
    if (keyType && this.keys[service][keyType]) {
      return this.keys[service][keyType];
    }
    
    return this.keys[service];
  }

  /**
   * Valide toutes les clés API
   * @returns {Object} - Résultats de validation pour chaque service
   */
  async validateKeys() {
    const validationResults = {};
    
    // Pour chaque service, vérifier la validité de la clé
    const services = Object.keys(this.keys);
    for (const service of services) {
      validationResults[service] = await this.validateKey(service);
    }
    
    return validationResults;
  }

  /**
   * Valide une clé API spécifique
   * @param {string} service - Nom du service API
   * @returns {Object} - Résultat de la validation
   */
  async validateKey(service) {
    // Implémentation spécifique pour chaque service
    switch(service) {
      case 'openweathermap':
        return await this.validateOpenWeatherMap();
      case 'openroute':
        return await this.validateOpenRoute();
      case 'strava':
        return await this.validateStrava();
      case 'mapbox':
        return await this.validateMapbox();
      case 'openai':
        return await this.validateOpenAI();
      case 'claude':
        return await this.validateClaude();
      default:
        return { valid: false, message: 'Service non pris en charge' };
    }
  }

  /**
   * Valide la clé OpenWeatherMap
   * @returns {Object} - Résultat de la validation
   */
  async validateOpenWeatherMap() {
    try {
      const key = this.getKey('openweathermap');
      const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=Paris&appid=${key.apiKey}`);
      
      if (response.status === 200) {
        return { 
          valid: true, 
          message: 'Clé OpenWeatherMap valide',
          quota: 'Vérifié sur le tableau de bord OpenWeatherMap',
          details: {
            plan: 'À vérifier dans le compte OpenWeatherMap',
            remaining: 'Limite inconnue - vérifier le compte'
          }
        };
      }
      
      return { 
        valid: false, 
        message: `Erreur OpenWeatherMap: ${response.status}` 
      };
    } catch (error) {
      return { 
        valid: false, 
        message: `Erreur de validation OpenWeatherMap: ${error.message}` 
      };
    }
  }
  
  /**
   * Valide la clé OpenRouteService
   * @returns {Object} - Résultat de la validation
   */
  async validateOpenRoute() {
    try {
      const key = this.getKey('openroute');
      const response = await axios.get('https://api.openrouteservice.org/v2/health', {
        headers: {
          'Authorization': key.apiKey
        }
      });
      
      if (response.status === 200) {
        return { 
          valid: true, 
          message: 'Clé OpenRouteService valide',
          quota: 'Vérifier sur le tableau de bord OpenRouteService',
          details: response.data
        };
      }
      
      return { 
        valid: false, 
        message: `Erreur OpenRouteService: ${response.status}` 
      };
    } catch (error) {
      return { 
        valid: false, 
        message: `Erreur de validation OpenRouteService: ${error.message}` 
      };
    }
  }
  
  /**
   * Valide les identifiants Strava
   * @returns {Object} - Résultat de la validation
   */
  async validateStrava() {
    try {
      const strava = this.getKey('strava');
      
      // Tenter de rafraîchir le token pour vérifier la validité
      const response = await axios.post('https://www.strava.com/oauth/token', {
        client_id: strava.clientId,
        client_secret: strava.clientSecret,
        refresh_token: strava.refreshToken,
        grant_type: 'refresh_token'
      });
      
      if (response.status === 200 && response.data.access_token) {
        // Mettre à jour les tokens
        this.keys.strava.accessToken = response.data.access_token;
        this.keys.strava.refreshToken = response.data.refresh_token || strava.refreshToken;
        
        return { 
          valid: true, 
          message: 'Identifiants Strava valides, tokens mis à jour',
          expiresAt: response.data.expires_at,
          details: {
            tokenType: response.data.token_type,
            expiresIn: response.data.expires_in
          }
        };
      }
      
      return { 
        valid: false, 
        message: 'Échec de rafraîchissement du token Strava' 
      };
    } catch (error) {
      return { 
        valid: false, 
        message: `Erreur de validation Strava: ${error.message}` 
      };
    }
  }
  
  /**
   * Valide les clés Mapbox
   * @returns {Object} - Résultat de la validation
   */
  async validateMapbox() {
    try {
      const mapbox = this.getKey('mapbox');
      const response = await axios.get(
        `https://api.mapbox.com/styles/v1/mapbox/streets-v11?access_token=${mapbox.publicToken}`
      );
      
      if (response.status === 200) {
        return { 
          valid: true, 
          message: 'Clé publique Mapbox valide',
          details: {
            plan: 'À vérifier dans le compte Mapbox',
            remaining: 'Limite inconnue - vérifier sur le tableau de bord'
          }
        };
      }
      
      return { 
        valid: false, 
        message: `Erreur Mapbox: ${response.status}` 
      };
    } catch (error) {
      return { 
        valid: false, 
        message: `Erreur de validation Mapbox: ${error.message}` 
      };
    }
  }
  
  /**
   * Valide la clé OpenAI
   * @returns {Object} - Résultat de la validation
   */
  async validateOpenAI() {
    try {
      const openai = this.getKey('openai');
      
      const response = await axios.get('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${openai.apiKey}`
        }
      });
      
      if (response.status === 200) {
        return { 
          valid: true, 
          message: 'Clé OpenAI valide',
          models: response.data.data.length,
          details: {
            plan: 'À vérifier dans le compte OpenAI',
            credit: 'Vérifier le solde sur le tableau de bord OpenAI'
          }
        };
      }
      
      return { 
        valid: false, 
        message: `Erreur OpenAI: ${response.status}` 
      };
    } catch (error) {
      return { 
        valid: false, 
        message: `Erreur de validation OpenAI: ${error.message}` 
      };
    }
  }
  
  /**
   * Valide la clé Claude
   * @returns {Object} - Résultat de la validation
   */
  async validateClaude() {
    try {
      const claude = this.getKey('claude');
      
      const response = await axios.post('https://api.anthropic.com/v1/messages', 
        {
          model: "claude-3-haiku-20240307",
          max_tokens: 10,
          messages: [
            {
              role: "user",
              content: "Hello, Claude!"
            }
          ]
        },
        {
          headers: {
            'x-api-key': claude.apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
          }
        }
      );
      
      if (response.status === 200) {
        return { 
          valid: true, 
          message: 'Clé Claude valide',
          details: {
            plan: 'À vérifier dans le compte Anthropic',
            remaining: 'Vérifier les limites sur le tableau de bord'
          }
        };
      }
      
      return { 
        valid: false, 
        message: `Erreur Claude: ${response.status}` 
      };
    } catch (error) {
      return { 
        valid: false, 
        message: `Erreur de validation Claude: ${error.message}` 
      };
    }
  }

  /**
   * Génère un rapport sur l'état des clés API
   * @returns {Object} - Rapport complet
   */
  async generateApiKeysReport() {
    const validationResults = await this.validateKeys();
    
    return {
      timestamp: new Date().toISOString(),
      summary: {
        totalServices: Object.keys(this.keys).length,
        validServices: Object.values(validationResults).filter(r => r.valid).length,
        invalidServices: Object.values(validationResults).filter(r => !r.valid).length
      },
      services: validationResults
    };
  }
}

module.exports = ApiKeysManager;
