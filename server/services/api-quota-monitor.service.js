/**
 * Service de monitoring des quotas d'API
 * Surveille l'utilisation des API et alerte en cas d'approche des limites
 */
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const axios = require('axios');
const dotenv = require('dotenv');

class ApiQuotaMonitorService {
  constructor() {
    this.quotaData = {
      lastUpdated: new Date(),
      apis: {}
    };
    
    this.quotaFilePath = path.resolve(process.cwd(), 'logs/api-quotas.json');
    this.alertThreshold = 0.8; // 80% du quota atteint déclenche une alerte
    
    // Créer le répertoire de logs si nécessaire
    const logDir = path.dirname(this.quotaFilePath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    // Charger les données existantes
    this.loadQuotaData();
    
    // Planifier les vérifications de quota (toutes les 4 heures)
    cron.schedule('0 */4 * * *', () => this.checkAllApiQuotas());
    
    console.log('Service de monitoring des quotas d\'API initialisé');
  }
  
  /**
   * Charge les données de quota depuis le fichier
   */
  loadQuotaData() {
    try {
      if (fs.existsSync(this.quotaFilePath)) {
        const data = fs.readFileSync(this.quotaFilePath, 'utf8');
        this.quotaData = JSON.parse(data);
      } else {
        // Initialiser avec la configuration par défaut
        this.initializeDefaultQuotas();
        this.saveQuotaData();
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données de quota:', error);
      // Initialiser avec la configuration par défaut en cas d'erreur
      this.initializeDefaultQuotas();
    }
  }
  
  /**
   * Initialise les quotas par défaut pour chaque API
   */
  initializeDefaultQuotas() {
    this.quotaData = {
      lastUpdated: new Date(),
      apis: {
        openweathermap: {
          name: 'OpenWeatherMap',
          dailyLimit: 1000,
          dailyUsage: 0,
          minuteLimit: 60,
          minuteUsage: 0,
          resetTime: new Date(new Date().setHours(24, 0, 0, 0)),
          lastChecked: new Date()
        },
        openrouteservice: {
          name: 'OpenRouteService',
          dailyLimit: 2000,
          dailyUsage: 0,
          minuteLimit: 40,
          minuteUsage: 0,
          resetTime: new Date(new Date().setHours(24, 0, 0, 0)),
          lastChecked: new Date()
        },
        strava: {
          name: 'Strava',
          fifteenMinuteLimit: 100,
          fifteenMinuteUsage: 0,
          dailyLimit: 1000,
          dailyUsage: 0,
          resetTime: new Date(new Date().setHours(24, 0, 0, 0)),
          lastChecked: new Date()
        },
        mapbox: {
          name: 'Mapbox',
          monthlyLimit: 50000,
          monthlyUsage: 0,
          minuteLimit: 300,
          minuteUsage: 0,
          resetTime: new Date(new Date().setDate(1)).setMonth(new Date().getMonth() + 1),
          lastChecked: new Date()
        },
        openai: {
          name: 'OpenAI',
          dailyTokenLimit: 100000,
          dailyTokenUsage: 0,
          minuteLimit: 10,
          minuteUsage: 0,
          resetTime: new Date(new Date().setHours(24, 0, 0, 0)),
          lastChecked: new Date()
        },
        claude: {
          name: 'Claude',
          dailyTokenLimit: 100000,
          dailyTokenUsage: 0,
          minuteLimit: 5,
          minuteUsage: 0,
          resetTime: new Date(new Date().setHours(24, 0, 0, 0)),
          lastChecked: new Date()
        }
      }
    };
  }
  
  /**
   * Sauvegarde les données de quota dans le fichier
   */
  saveQuotaData() {
    try {
      fs.writeFileSync(this.quotaFilePath, JSON.stringify(this.quotaData, null, 2));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des données de quota:', error);
    }
  }
  
  /**
   * Enregistre un appel d'API
   * @param {string} apiName - Nom de l'API (openweathermap, strava, etc.)
   * @param {number} count - Nombre d'appels (par défaut 1)
   * @param {number} tokens - Nombre de tokens utilisés (pour les API IA)
   */
  logApiCall(apiName, count = 1, tokens = 0) {
    if (!this.quotaData.apis[apiName]) {
      console.warn(`API inconnue: ${apiName}`);
      return;
    }
    
    const api = this.quotaData.apis[apiName];
    const now = new Date();
    
    // Réinitialiser les compteurs si nécessaire
    if (new Date(api.resetTime) <= now) {
      if (apiName === 'mapbox') {
        // Réinitialisation mensuelle pour Mapbox
        api.monthlyUsage = 0;
        api.resetTime = new Date(new Date(now).setDate(1)).setMonth(now.getMonth() + 1);
      } else {
        // Réinitialisation quotidienne pour les autres API
        if (api.dailyUsage) api.dailyUsage = 0;
        if (api.dailyTokenUsage) api.dailyTokenUsage = 0;
        api.resetTime = new Date(new Date(now).setHours(24, 0, 0, 0));
      }
    }
    
    // Mise à jour des compteurs d'utilisation
    if (api.dailyUsage !== undefined) api.dailyUsage += count;
    if (api.minuteUsage !== undefined) api.minuteUsage += count;
    if (api.fifteenMinuteUsage !== undefined) api.fifteenMinuteUsage += count;
    if (tokens > 0 && api.dailyTokenUsage !== undefined) api.dailyTokenUsage += tokens;
    
    api.lastChecked = now;
    this.quotaData.lastUpdated = now;
    
    // Vérifier si les seuils d'alerte sont atteints
    this.checkQuotaAlerts(apiName);
    
    // Sauvegarder les mises à jour
    this.saveQuotaData();
    
    return {
      apiName,
      remainingDailyQuota: api.dailyLimit ? api.dailyLimit - api.dailyUsage : undefined,
      remainingMinuteQuota: api.minuteLimit ? api.minuteLimit - api.minuteUsage : undefined,
      remainingFifteenMinuteQuota: api.fifteenMinuteLimit ? api.fifteenMinuteLimit - api.fifteenMinuteUsage : undefined,
      remainingTokenQuota: api.dailyTokenLimit ? api.dailyTokenLimit - api.dailyTokenUsage : undefined,
      resetTime: api.resetTime
    };
  }
  
  /**
   * Vérifie si les quotas d'une API approchent des limites
   * @param {string} apiName - Nom de l'API
   */
  checkQuotaAlerts(apiName) {
    const api = this.quotaData.apis[apiName];
    
    // Vérifier les quotas quotidiens
    if (api.dailyLimit && api.dailyUsage / api.dailyLimit > this.alertThreshold) {
      this.logQuotaAlert(apiName, 'daily', api.dailyUsage, api.dailyLimit);
    }
    
    // Vérifier les quotas par minute
    if (api.minuteLimit && api.minuteUsage / api.minuteLimit > this.alertThreshold) {
      this.logQuotaAlert(apiName, 'minute', api.minuteUsage, api.minuteLimit);
    }
    
    // Vérifier les quotas par 15 minutes (Strava)
    if (api.fifteenMinuteLimit && api.fifteenMinuteUsage / api.fifteenMinuteLimit > this.alertThreshold) {
      this.logQuotaAlert(apiName, '15-minute', api.fifteenMinuteUsage, api.fifteenMinuteLimit);
    }
    
    // Vérifier les quotas de tokens (OpenAI, Claude)
    if (api.dailyTokenLimit && api.dailyTokenUsage / api.dailyTokenLimit > this.alertThreshold) {
      this.logQuotaAlert(apiName, 'token', api.dailyTokenUsage, api.dailyTokenLimit);
    }
  }
  
  /**
   * Journalise une alerte de quota
   */
  logQuotaAlert(apiName, quotaType, currentUsage, limit) {
    const percentage = Math.round((currentUsage / limit) * 100);
    const message = `ALERTE QUOTA: ${apiName} a atteint ${percentage}% de son quota ${quotaType} (${currentUsage}/${limit})`;
    
    console.warn(message);
    
    // Journaliser l'alerte
    const alertLogPath = path.resolve(process.cwd(), 'logs/api-alerts.log');
    try {
      fs.appendFileSync(alertLogPath, `[${new Date().toISOString()}] ${message}\n`);
    } catch (error) {
      console.error('Erreur lors de la journalisation de l\'alerte:', error);
    }
    
    // TODO: Implémenter des notifications (email, Slack, etc.)
  }
  
  /**
   * Vérifie les quotas pour toutes les API
   */
  async checkAllApiQuotas() {
    console.log('Vérification des quotas d\'API...');
    
    try {
      // OpenWeatherMap
      await this.checkOpenWeatherMapQuota();
      
      // OpenRouteService
      await this.checkOpenRouteServiceQuota();
      
      // Strava
      await this.checkStravaQuota();
      
      // Les autres API n'exposent pas facilement leurs quotas via l'API
      
      // Mettre à jour le timestamp
      this.quotaData.lastUpdated = new Date();
      this.saveQuotaData();
      
      console.log('Vérification des quotas terminée');
    } catch (error) {
      console.error('Erreur lors de la vérification des quotas:', error);
    }
  }
  
  /**
   * Vérifie les quotas pour OpenWeatherMap
   */
  async checkOpenWeatherMapQuota() {
    try {
      // OpenWeatherMap n'expose pas directement les informations de quota
      // On peut estimer l'utilisation en fonction des headers de réponse
      const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=Paris&appid=${process.env.OPENWEATHER_API_KEY}`);
      
      // Mettre à jour les minuteUsage sur la base d'une estimation
      const api = this.quotaData.apis.openweathermap;
      api.minuteUsage = Math.min(api.minuteUsage + 1, api.minuteLimit);
      api.lastChecked = new Date();
    } catch (error) {
      if (error.response && error.response.status === 429) {
        // Limite atteinte
        const api = this.quotaData.apis.openweathermap;
        api.minuteUsage = api.minuteLimit;
        this.logQuotaAlert('openweathermap', 'minute', api.minuteUsage, api.minuteLimit);
      }
      console.error('Erreur lors de la vérification des quotas OpenWeatherMap:', error.message);
    }
  }
  
  /**
   * Vérifie les quotas pour OpenRouteService
   */
  async checkOpenRouteServiceQuota() {
    try {
      const response = await axios.get(`https://api.openrouteservice.org/v2/status?api_key=${process.env.OPENROUTE_API_KEY}`);
      
      if (response.data && response.data.rate_limit) {
        const api = this.quotaData.apis.openrouteservice;
        api.dailyLimit = response.data.rate_limit.day;
        api.dailyUsage = response.data.rate_limit.day - response.data.rate_limit.remaining_day;
        api.lastChecked = new Date();
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des quotas OpenRouteService:', error.message);
    }
  }
  
  /**
   * Vérifie les quotas pour Strava
   */
  async checkStravaQuota() {
    try {
      const response = await axios.get('https://www.strava.com/api/v3/athlete', {
        headers: { 'Authorization': `Bearer ${process.env.STRAVA_ACCESS_TOKEN}` }
      });
      
      if (response.headers && response.headers['x-ratelimit-limit']) {
        const api = this.quotaData.apis.strava;
        const fifteenMinuteLimit = parseInt(response.headers['x-ratelimit-limit'] || '100');
        const fifteenMinuteUsage = fifteenMinuteLimit - parseInt(response.headers['x-ratelimit-usage'] || '0');
        
        api.fifteenMinuteLimit = fifteenMinuteLimit;
        api.fifteenMinuteUsage = fifteenMinuteUsage;
        api.lastChecked = new Date();
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des quotas Strava:', error.message);
    }
  }
  
  /**
   * Récupère l'état actuel des quotas pour toutes les API
   */
  getApiQuotaStatus() {
    const statusReport = {
      timestamp: new Date(),
      apis: {}
    };
    
    for (const [apiKey, api] of Object.entries(this.quotaData.apis)) {
      let percentageUsed = 0;
      let remainingCalls = 0;
      let resetIn = 0;
      
      // Calcul du pourcentage utilisé en fonction des limites disponibles
      if (api.dailyLimit) {
        percentageUsed = Math.round((api.dailyUsage / api.dailyLimit) * 100);
        remainingCalls = api.dailyLimit - api.dailyUsage;
        resetIn = Math.max(0, Math.floor((new Date(api.resetTime) - new Date()) / (1000 * 60 * 60)));
      } else if (api.monthlyLimit) {
        percentageUsed = Math.round((api.monthlyUsage / api.monthlyLimit) * 100);
        remainingCalls = api.monthlyLimit - api.monthlyUsage;
        resetIn = Math.max(0, Math.floor((new Date(api.resetTime) - new Date()) / (1000 * 60 * 60 * 24)));
      }
      
      statusReport.apis[apiKey] = {
        name: api.name,
        percentageUsed,
        remainingCalls,
        resetIn: resetIn === 0 ? 'moins d\'une heure' : `environ ${resetIn} heures`,
        lastChecked: api.lastChecked
      };
    }
    
    return statusReport;
  }
}

// Exporter une instance singleton du service
module.exports = new ApiQuotaMonitorService();
