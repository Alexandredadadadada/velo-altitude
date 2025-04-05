// strava.service.js - Service pour l'intégration avec l'API Strava
const axios = require('axios');
const config = require('../config/api.config');
// Import différé pour éviter la dépendance circulaire
let apiManager;
setTimeout(() => {
  apiManager = require('./api-manager.service');
}, 0);
const { logger } = require('../utils/logger');
const { promiseWithTimeout, retryAsync } = require('../utils/promise-helpers');
const apiServices = require('./apiServices');

class StravaService {
  constructor() {
    this.clientId = config.strava.clientId;
    this.clientSecret = config.strava.clientSecret;
    this.redirectUri = config.strava.redirectUri;
    this.baseUrl = 'https://www.strava.com/api/v3';
    this.timeout = config.strava.timeout || 15000; // Timeout par défaut: 15s
    this.tokenExpireTolerance = 5 * 60; // 5 minutes en secondes
    
    // Configuration des retries
    this.retryConfig = {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 10000,
      shouldRetry: (error) => {
        // Réessayer pour les erreurs réseau et 500, mais pas pour 400 ou 401
        const isNetworkError = !error.response;
        const isServerError = error.response && error.response.status >= 500;
        const isRateLimitError = error.response && error.response.status === 429;
        
        return isNetworkError || isServerError || isRateLimitError;
      }
    };
    
    // Métriques de performance
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      tokenRefreshes: 0,
      averageResponseTime: 0,
      lastResponseTimes: [],
      rateLimitRemaining: null,
      rateLimitLimit: null
    };
    
    // Ne plus s'auto-enregistrer - cette tâche est maintenant gérée par initServices.js
    // this._registerWithApiManager();
    
    logger.info('Service Strava initialisé avec monitoring de performance');
  }
  
  /**
   * Méthode d'enregistrement désactivée - l'enregistrement est maintenant géré par initServices.js
   * @private
   */
  /*
  _registerWithApiManager() {
    // Vérifier que apiManager et apiManager.services existent avant d'y accéder
    if (!apiManager || !apiManager.services) {
      logger.warn('ApiManager n\'est pas encore initialisé, l\'enregistrement du service Strava sera différé');
      // Réessayer l'enregistrement après un délai
      setTimeout(() => {
        if (apiManager && apiManager.services) {
          this._registerWithApiManager();
        } else {
          logger.error('Impossible d\'enregistrer le service Strava après plusieurs tentatives');
        }
      }, 1000);
      return;
    }

    if (!apiManager.services.strava) {
      logger.info('Enregistrement du service Strava dans le gestionnaire d\'API');
      
      apiManager.services.strava = {
        service: this,
        retryConfig: this.retryConfig,
        rateLimit: { 
          requestsPerMinute: 100,  // Limite standard de Strava
          requestsPerDay: 1000     // Limite quotidienne Strava
        },
        fallbackStrategy: 'error'  // Pas de fallback pour Strava (authentification)
      };
    }
  }
  */
  
  /**
   * Génère l'URL d'autorisation pour la connexion Strava
   * @param {string} scope Périmètre d'accès demandé
   * @returns {string} URL d'autorisation
   */
  getAuthorizationUrl(scope = 'read,activity:read') {
    return `https://www.strava.com/oauth/authorize?client_id=${this.clientId}&response_type=code&redirect_uri=${encodeURIComponent(this.redirectUri)}&approval_prompt=auto&scope=${scope}`;
  }
  
  /**
   * Échange le code d'autorisation contre des tokens d'accès
   * @param {string} code Code d'autorisation
   * @returns {Promise<Object>} Informations du token
   */
  async exchangeToken(code) {
    try {
      const startTime = Date.now();
      this.metrics.totalRequests++;
      
      // Utiliser la clé API active du gestionnaire de clés
      const activeClientSecret = this._getActiveApiKey();
      
      const response = await retryAsync(async () => {
        return await axios.post('https://www.strava.com/oauth/token', {
          client_id: this.clientId,
          client_secret: activeClientSecret,
          code,
          grant_type: 'authorization_code'
        });
      }, this.retryConfig);
      
      // Mettre à jour les métriques
      const responseTime = Date.now() - startTime;
      this._updateMetrics(true, responseTime, response);
      
      return response.data;
    } catch (error) {
      // Mettre à jour les métriques en cas d'erreur
      this.metrics.failedRequests++;
      
      // Journaliser et enrichir l'erreur
      logger.error(`Erreur lors de l'échange du token: ${error.message}`);
      throw this._enhanceError(error, 'exchangeToken');
    }
  }
  
  /**
   * Rafraîchit un token d'accès expiré
   * @param {string} refreshToken Token de rafraîchissement
   * @returns {Promise<Object>} Nouveaux tokens
   */
  async refreshToken(refreshToken) {
    try {
      const startTime = Date.now();
      this.metrics.totalRequests++;
      this.metrics.tokenRefreshes++;
      
      // Utiliser la clé API active du gestionnaire de clés
      const activeClientSecret = this._getActiveApiKey();
      
      const response = await retryAsync(async () => {
        return await axios.post('https://www.strava.com/oauth/token', {
          client_id: this.clientId,
          client_secret: activeClientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        });
      }, this.retryConfig);
      
      // Mettre à jour les métriques
      const responseTime = Date.now() - startTime;
      this._updateMetrics(true, responseTime, response);
      
      return response.data;
    } catch (error) {
      // Mettre à jour les métriques en cas d'erreur
      this.metrics.failedRequests++;
      
      // Journaliser et enrichir l'erreur
      logger.error(`Erreur lors du rafraîchissement du token: ${error.message}`);
      throw this._enhanceError(error, 'refreshToken');
    }
  }
  
  /**
   * Vérifie si un token a besoin d'être rafraîchi
   * @param {Object} tokenData Données du token
   * @returns {boolean} True si le token doit être rafraîchi
   */
  isTokenExpired(tokenData) {
    if (!tokenData || !tokenData.expires_at) {
      return true;
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    return currentTime + this.tokenExpireTolerance >= tokenData.expires_at;
  }
  
  /**
   * Récupère le profil de l'utilisateur connecté
   * @param {string} accessToken Token d'accès de l'utilisateur
   * @returns {Promise<Object>} Données du profil
   */
  async getAthleteProfile(accessToken) {
    try {
      return await this._makeRequest('/athlete', accessToken);
    } catch (error) {
      logger.error(`Erreur lors de la récupération du profil athlète: ${error.message}`);
      throw this._enhanceError(error, 'getAthleteProfile');
    }
  }
  
  /**
   * Récupère les activités récentes de l'utilisateur
   * @param {string} accessToken Token d'accès
   * @param {Object} params Paramètres supplémentaires (page, per_page, before, after)
   * @returns {Promise<Array>} Liste des activités
   */
  async getActivities(accessToken, params = {}) {
    try {
      const defaultParams = {
        page: 1,
        per_page: 30
      };
      
      const queryParams = { ...defaultParams, ...params };
      return await this._makeRequest('/athlete/activities', accessToken, queryParams);
    } catch (error) {
      logger.error(`Erreur lors de la récupération des activités: ${error.message}`);
      throw this._enhanceError(error, 'getActivities');
    }
  }
  
  /**
   * Récupère les détails d'une activité spécifique
   * @param {string} accessToken Token d'accès
   * @param {string|number} activityId ID de l'activité
   * @param {boolean} includeEffort Inclure les segments?
   * @returns {Promise<Object>} Détails de l'activité
   */
  async getActivity(accessToken, activityId, includeEffort = false) {
    try {
      const params = includeEffort ? { include_all_efforts: true } : {};
      return await this._makeRequest(`/activities/${activityId}`, accessToken, params);
    } catch (error) {
      logger.error(`Erreur lors de la récupération de l'activité ${activityId}: ${error.message}`);
      throw this._enhanceError(error, 'getActivity');
    }
  }
  
  /**
   * Récupère les statistiques d'un athlète
   * @param {string} accessToken Token d'accès
   * @param {string|number} athleteId ID de l'athlète (facultatif, utilise l'athlète connecté par défaut)
   * @returns {Promise<Object>} Statistiques de l'athlète
   */
  async getAthleteStats(accessToken, athleteId = null) {
    try {
      // Si athleteId n'est pas fourni, obtenir l'ID de l'utilisateur connecté
      if (!athleteId) {
        const profile = await this.getAthleteProfile(accessToken);
        athleteId = profile.id;
      }
      
      return await this._makeRequest(`/athletes/${athleteId}/stats`, accessToken);
    } catch (error) {
      logger.error(`Erreur lors de la récupération des statistiques de l'athlète: ${error.message}`);
      throw this._enhanceError(error, 'getAthleteStats');
    }
  }
  
  /**
   * Récupère les zones de fréquence cardiaque de l'athlète
   * @param {string} accessToken Token d'accès
   * @returns {Promise<Object>} Zones de fréquence cardiaque
   */
  async getHeartRateZones(accessToken) {
    try {
      return await this._makeRequest('/athlete/zones', accessToken);
    } catch (error) {
      logger.error(`Erreur lors de la récupération des zones cardiaques: ${error.message}`);
      throw this._enhanceError(error, 'getHeartRateZones');
    }
  }
  
  /**
   * Récupère les segments vedettes dans une région géographique
   * @param {string} accessToken Token d'accès
   * @param {Array<number>} bounds Limites de la région [minLat, minLng, maxLat, maxLng]
   * @param {string} activityType Type d'activité (riding, running)
   * @returns {Promise<Array>} Liste des segments
   */
  async getSegments(accessToken, bounds, activityType = 'riding') {
    try {
      if (!Array.isArray(bounds) || bounds.length !== 4) {
        throw new Error('Les limites géographiques doivent être un tableau de 4 nombres [minLat, minLng, maxLat, maxLng]');
      }
      
      const params = {
        bounds: bounds.join(','),
        activity_type: activityType
      };
      
      return await this._makeRequest('/segments/explore', accessToken, params);
    } catch (error) {
      logger.error(`Erreur lors de la récupération des segments: ${error.message}`);
      throw this._enhanceError(error, 'getSegments');
    }
  }
  
  /**
   * Effectue une requête à l'API Strava
   * @param {string} endpoint Point d'accès API
   * @param {string} accessToken Token d'accès
   * @param {Object} params Paramètres de la requête
   * @param {string} method Méthode HTTP
   * @returns {Promise<any>} Données de la réponse
   * @private
   */
  async _makeRequest(endpoint, accessToken, params = {}, method = 'GET') {
    const startTime = Date.now();
    this.metrics.totalRequests++;
    
    try {
      // Ajouter un timeout pour éviter les requêtes bloquées
      const response = await promiseWithTimeout(
        axios({
          method,
          url: `${this.baseUrl}${endpoint}`,
          headers: {
            'Authorization': `Bearer ${accessToken}`
          },
          params: method === 'GET' ? params : undefined,
          data: method !== 'GET' ? params : undefined
        }),
        this.timeout,
        `La requête à ${endpoint} a expiré après ${this.timeout}ms`
      );
      
      // Mettre à jour les métriques
      const responseTime = Date.now() - startTime;
      this._updateMetrics(true, responseTime, response);
      
      return response.data;
    } catch (error) {
      // Mettre à jour les métriques en cas d'erreur
      this.metrics.failedRequests++;
      
      // Vérifier si l'erreur est due à un token expiré
      if (error.response && error.response.status === 401) {
        error.code = 'TOKEN_EXPIRED';
      }
      
      // Pour toute autre erreur, enrichir et propager
      throw this._parseApiError(error);
    }
  }
  
  /**
   * Met à jour les métriques de performance
   * @param {boolean} success Indique si la requête a réussi
   * @param {number} responseTime Temps de réponse en ms
   * @param {Object} response Réponse HTTP (facultatif)
   * @private
   */
  _updateMetrics(success, responseTime, response = null) {
    if (success) {
      this.metrics.successfulRequests++;
      
      // Mettre à jour le temps de réponse moyen
      this.metrics.lastResponseTimes.push(responseTime);
      if (this.metrics.lastResponseTimes.length > 10) {
        this.metrics.lastResponseTimes.shift(); // Garder les 10 derniers temps
      }
      
      // Calculer la moyenne
      const total = this.metrics.lastResponseTimes.reduce((sum, time) => sum + time, 0);
      this.metrics.averageResponseTime = Math.round(total / this.metrics.lastResponseTimes.length);
      
      // Mettre à jour les informations de rate limit si disponibles
      if (response && response.headers) {
        if (response.headers['x-ratelimit-limit']) {
          this.metrics.rateLimitLimit = parseInt(response.headers['x-ratelimit-limit']);
        }
        
        if (response.headers['x-ratelimit-usage']) {
          const usage = parseInt(response.headers['x-ratelimit-usage']);
          this.metrics.rateLimitRemaining = this.metrics.rateLimitLimit ? (this.metrics.rateLimitLimit - usage) : null;
        }
      }
    } else {
      this.metrics.failedRequests++;
    }
  }
  
  /**
   * Parse une erreur d'API pour en extraire les informations pertinentes
   * @param {Error} error Erreur d'origine
   * @returns {Error} Erreur enrichie
   * @private
   */
  _parseApiError(error) {
    // Extraire les informations utiles de l'erreur
    const message = error.response?.data?.message || error.message || 'Erreur inconnue avec l\'API Strava';
    const apiError = new Error(message);
    
    // Ajouter des propriétés utiles
    apiError.code = error.code || error.response?.status || 'UNKNOWN_ERROR';
    apiError.status = error.response?.status;
    apiError.original = error;
    
    // Ajouter des informations spécifiques à Strava
    if (error.response?.data?.errors) {
      apiError.errors = error.response.data.errors;
    }
    
    return apiError;
  }
  
  /**
   * Enrichit une erreur avec des informations contextuelles
   * @param {Error} error Erreur d'origine
   * @param {string} method Méthode qui a généré l'erreur
   * @returns {Error} Erreur enrichie
   * @private
   */
  _enhanceError(error, method) {
    // Créer une nouvelle erreur avec un message plus informatif
    const enhancedError = new Error(`Erreur dans StravaService.${method}: ${error.message}`);
    
    // Copier les propriétés de l'erreur d'origine
    enhancedError.code = error.code || 'STRAVA_ERROR';
    enhancedError.status = error.status;
    enhancedError.original = error.original || error;
    
    // Ajouter des informations supplémentaires pour le débogage
    enhancedError.context = {
      service: 'StravaService',
      method,
      time: new Date().toISOString(),
      metrics: this.getMetrics()
    };
    
    return enhancedError;
  }
  
  /**
   * Obtient la clé API active pour les requêtes
   * @returns {string} Clé API active
   * @private
   */
  _getActiveApiKey() {
    // Utiliser le nouveau système de gestion des clés API
    try {
      return apiServices.strava.getKey();
    } catch (error) {
      logger.warn(`Erreur lors de la récupération de la clé API Strava: ${error.message}. Utilisation de la clé de secours.`);
      return this.clientSecret;
    }
  }
  
  /**
   * Récupère les métriques de performance du service
   * @returns {Object} Métriques de performance
   */
  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.totalRequests > 0 
        ? Math.round((this.metrics.successfulRequests / this.metrics.totalRequests) * 100) 
        : 100
    };
  }
}

module.exports = new StravaService();
