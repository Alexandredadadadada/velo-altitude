/**
 * Service de surveillance des conditions des cols
 * Surveille en temps réel les conditions météo et la praticabilité des cols
 */
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const colsData = require('../scripts/cols-data-generator');
const apiMonitor = require('./api-quota-monitor.service');

class ColsConditionsMonitorService {
  constructor() {
    this.colsConditions = {};
    this.alertThresholds = {
      wind: 50,      // km/h
      rain: 10,      // mm/h
      snow: 1,       // cm
      temperature: 0 // °C
    };
    
    this.conditionsFilePath = path.resolve(process.cwd(), 'data/cols-conditions.json');
    this.alertsFilePath = path.resolve(process.cwd(), 'data/cols-alerts.json');
    
    // Charger les données existantes ou initialiser
    this.loadConditionsData();
    
    // Planifier la mise à jour des conditions (toutes les 3 heures)
    cron.schedule('0 */3 * * *', () => this.updateAllColsConditions());
    
    // Mise à jour initiale
    this.updateAllColsConditions();
    
    console.log('Service de surveillance des conditions des cols initialisé');
  }
  
  /**
   * Charge les données de conditions depuis le fichier
   */
  loadConditionsData() {
    try {
      if (fs.existsSync(this.conditionsFilePath)) {
        const data = fs.readFileSync(this.conditionsFilePath, 'utf8');
        this.colsConditions = JSON.parse(data);
      } else {
        // Initialiser avec des données vides
        this.initializeConditionsData();
        this.saveConditionsData();
      }
      
      // Charger les alertes existantes
      if (fs.existsSync(this.alertsFilePath)) {
        const data = fs.readFileSync(this.alertsFilePath, 'utf8');
        this.colsAlerts = JSON.parse(data);
      } else {
        this.colsAlerts = { alerts: [] };
        fs.writeFileSync(this.alertsFilePath, JSON.stringify(this.colsAlerts, null, 2));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données de conditions:', error);
      this.initializeConditionsData();
    }
  }
  
  /**
   * Initialise les données de conditions pour tous les cols
   */
  initializeConditionsData() {
    this.colsConditions = {
      lastUpdated: new Date(),
      cols: {}
    };
    
    // Initialiser pour chaque col
    colsData.cols.forEach(col => {
      this.colsConditions.cols[col.id] = {
        id: col.id,
        name: col.name,
        status: 'unknown',
        lastUpdated: new Date(),
        weather: {
          temperature: null,
          conditions: null,
          wind: null,
          precipitation: null,
          visibility: null
        },
        roadCondition: {
          status: 'unknown',
          hazards: [],
          closureReason: null
        }
      };
    });
  }
  
  /**
   * Sauvegarde les données de conditions dans le fichier
   */
  saveConditionsData() {
    try {
      const dir = path.dirname(this.conditionsFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.conditionsFilePath, JSON.stringify(this.colsConditions, null, 2));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des données de conditions:', error);
    }
  }
  
  /**
   * Met à jour les conditions pour tous les cols
   */
  async updateAllColsConditions() {
    console.log('Mise à jour des conditions pour tous les cols...');
    
    for (const col of colsData.cols) {
      try {
        await this.updateColConditions(col.id);
        // Pause pour éviter de surcharger les API
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Erreur lors de la mise à jour des conditions pour ${col.name}:`, error);
      }
    }
    
    // Mettre à jour le timestamp
    this.colsConditions.lastUpdated = new Date();
    this.saveConditionsData();
    
    console.log('Mise à jour des conditions terminée');
  }
  
  /**
   * Met à jour les conditions pour un col spécifique
   * @param {string} colId - Identifiant du col
   */
  async updateColConditions(colId) {
    try {
      const col = colsData.cols.find(c => c.id === colId);
      
      if (!col) {
        throw new Error(`Col non trouvé: ${colId}`);
      }
      
      // Récupérer les données météo
      const weatherData = await this.fetchWeatherData(col.location.coordinates.lat, col.location.coordinates.lng);
      
      // Récupérer les conditions routières (simulation)
      const roadCondition = this.simulateRoadCondition(weatherData);
      
      // Déterminer le statut global
      const status = this.determineColStatus(weatherData, roadCondition);
      
      // Mettre à jour les données
      const colConditions = this.colsConditions.cols[colId] || {
        id: colId,
        name: col.name
      };
      
      colConditions.status = status;
      colConditions.lastUpdated = new Date();
      colConditions.weather = {
        temperature: weatherData.temperature,
        conditions: weatherData.conditions,
        wind: weatherData.wind,
        precipitation: weatherData.precipitation,
        visibility: weatherData.visibility
      };
      colConditions.roadCondition = roadCondition;
      
      // Sauvegarder dans l'objet principal
      this.colsConditions.cols[colId] = colConditions;
      
      // Vérifier si des alertes doivent être créées
      this.checkForAlerts(colId, colConditions);
      
      return colConditions;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour des conditions pour ${colId}:`, error);
      throw error;
    }
  }
  
  /**
   * Récupère les données météo pour des coordonnées
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Object} - Données météo
   */
  async fetchWeatherData(lat, lng) {
    try {
      const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
        params: {
          lat,
          lon: lng,
          units: 'metric',
          appid: process.env.OPENWEATHER_API_KEY
        }
      });
      
      // Enregistrer l'appel d'API
      apiMonitor.logApiCall('openweathermap');
      
      return {
        temperature: response.data.main.temp,
        conditions: response.data.weather[0].main,
        description: response.data.weather[0].description,
        wind: {
          speed: response.data.wind.speed * 3.6, // m/s to km/h
          direction: response.data.wind.deg
        },
        precipitation: {
          rain: response.data.rain ? response.data.rain['1h'] || 0 : 0,
          snow: response.data.snow ? response.data.snow['1h'] || 0 : 0
        },
        visibility: response.data.visibility / 1000, // m to km
        humidity: response.data.main.humidity,
        pressure: response.data.main.pressure,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des données météo:', error);
      
      // En cas d'erreur, retourner des données par défaut
      return {
        temperature: null,
        conditions: 'Unknown',
        description: 'Données météo non disponibles',
        wind: { speed: null, direction: null },
        precipitation: { rain: null, snow: null },
        visibility: null,
        humidity: null,
        pressure: null,
        timestamp: new Date()
      };
    }
  }
  
  /**
   * Simule les conditions routières basées sur la météo
   * @param {Object} weatherData - Données météo
   * @returns {Object} - Conditions routières simulées
   */
  simulateRoadCondition(weatherData) {
    let status = 'open';
    const hazards = [];
    let closureReason = null;
    
    // Vérifier les conditions météo dangereuses
    if (weatherData.precipitation.snow > 5) {
      status = 'closed';
      closureReason = 'Chutes de neige importantes';
      hazards.push('snow');
    } else if (weatherData.precipitation.snow > 1) {
      status = 'difficult';
      hazards.push('snow');
    }
    
    if (weatherData.precipitation.rain > 15) {
      status = 'difficult';
      hazards.push('heavy_rain');
    } else if (weatherData.precipitation.rain > 5) {
      hazards.push('rain');
    }
    
    if (weatherData.wind.speed > 80) {
      status = 'closed';
      closureReason = 'Vents violents';
      hazards.push('strong_wind');
    } else if (weatherData.wind.speed > 50) {
      status = 'difficult';
      hazards.push('wind');
    }
    
    if (weatherData.visibility < 0.5) {
      status = 'difficult';
      hazards.push('fog');
    }
    
    if (weatherData.temperature < -5) {
      status = 'difficult';
      hazards.push('ice');
    }
    
    // Simuler des travaux routiers aléatoires (5% de chance)
    if (Math.random() < 0.05) {
      if (status === 'open') status = 'difficult';
      hazards.push('roadworks');
    }
    
    return {
      status,
      hazards,
      closureReason,
      lastUpdated: new Date()
    };
  }
  
  /**
   * Détermine le statut global du col
   * @param {Object} weatherData - Données météo
   * @param {Object} roadCondition - Conditions routières
   * @returns {string} - Statut global (open, difficult, closed, unknown)
   */
  determineColStatus(weatherData, roadCondition) {
    if (roadCondition.status === 'closed') {
      return 'closed';
    }
    
    if (roadCondition.status === 'difficult') {
      return 'difficult';
    }
    
    if (weatherData.temperature === null) {
      return 'unknown';
    }
    
    return 'open';
  }
  
  /**
   * Vérifie si des alertes doivent être créées pour un col
   * @param {string} colId - Identifiant du col
   * @param {Object} conditions - Conditions actuelles
   */
  checkForAlerts(colId, conditions) {
    const col = colsData.cols.find(c => c.id === colId);
    const alerts = [];
    
    // Vérifier les conditions d'alerte
    if (conditions.status === 'closed' && conditions.roadCondition.closureReason) {
      alerts.push({
        type: 'closure',
        severity: 'high',
        message: `${col.name} est fermé: ${conditions.roadCondition.closureReason}`,
        details: conditions.roadCondition
      });
    }
    
    if (conditions.roadCondition.hazards.includes('snow')) {
      alerts.push({
        type: 'weather',
        severity: 'medium',
        message: `Neige sur ${col.name}`,
        details: {
          snowAmount: conditions.weather.precipitation.snow,
          temperature: conditions.weather.temperature
        }
      });
    }
    
    if (conditions.roadCondition.hazards.includes('ice')) {
      alerts.push({
        type: 'weather',
        severity: 'high',
        message: `Risque de verglas sur ${col.name}`,
        details: {
          temperature: conditions.weather.temperature
        }
      });
    }
    
    if (conditions.roadCondition.hazards.includes('strong_wind')) {
      alerts.push({
        type: 'weather',
        severity: 'high',
        message: `Vents violents sur ${col.name}`,
        details: {
          windSpeed: conditions.weather.wind.speed
        }
      });
    }
    
    if (conditions.roadCondition.hazards.includes('roadworks')) {
      alerts.push({
        type: 'infrastructure',
        severity: 'medium',
        message: `Travaux en cours sur ${col.name}`,
        details: {
          status: conditions.roadCondition.status
        }
      });
    }
    
    // Si des alertes ont été générées, les enregistrer
    if (alerts.length > 0) {
      for (const alert of alerts) {
        this.addColAlert(colId, alert);
      }
    }
  }
  
  /**
   * Ajoute une alerte pour un col
   * @param {string} colId - Identifiant du col
   * @param {Object} alert - Données de l'alerte
   */
  addColAlert(colId, alert) {
    try {
      const col = colsData.cols.find(c => c.id === colId);
      
      if (!col) {
        throw new Error(`Col non trouvé: ${colId}`);
      }
      
      // Créer l'alerte
      const newAlert = {
        id: `${colId}-${Date.now()}`,
        colId,
        colName: col.name,
        timestamp: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expire après 24h
        ...alert
      };
      
      // Ajouter l'alerte au début du tableau
      this.colsAlerts.alerts.unshift(newAlert);
      
      // Limiter le nombre d'alertes stockées (garder les 100 plus récentes)
      if (this.colsAlerts.alerts.length > 100) {
        this.colsAlerts.alerts = this.colsAlerts.alerts.slice(0, 100);
      }
      
      // Sauvegarder les alertes
      fs.writeFileSync(this.alertsFilePath, JSON.stringify(this.colsAlerts, null, 2));
      
      // Journaliser l'alerte
      console.log(`Nouvelle alerte pour ${col.name}: ${alert.message}`);
      
      return newAlert;
    } catch (error) {
      console.error(`Erreur lors de l'ajout d'une alerte pour ${colId}:`, error);
      throw error;
    }
  }
  
  /**
   * Récupère les conditions actuelles pour tous les cols
   * @returns {Object} - Conditions actuelles
   */
  getAllColsConditions() {
    return {
      timestamp: new Date(),
      lastUpdated: this.colsConditions.lastUpdated,
      cols: Object.values(this.colsConditions.cols)
    };
  }
  
  /**
   * Récupère les conditions actuelles pour un col spécifique
   * @param {string} colId - Identifiant du col
   * @returns {Object} - Conditions actuelles
   */
  getColConditions(colId) {
    return this.colsConditions.cols[colId] || null;
  }
  
  /**
   * Récupère toutes les alertes actives
   * @param {Object} options - Options de filtrage
   * @returns {Array} - Alertes actives
   */
  getActiveAlerts(options = {}) {
    const now = new Date();
    
    // Filtrer les alertes expirées
    let alerts = this.colsAlerts.alerts.filter(alert => new Date(alert.expiresAt) > now);
    
    // Filtrer par type
    if (options.type) {
      alerts = alerts.filter(alert => alert.type === options.type);
    }
    
    // Filtrer par sévérité
    if (options.severity) {
      alerts = alerts.filter(alert => alert.severity === options.severity);
    }
    
    // Filtrer par col
    if (options.colId) {
      alerts = alerts.filter(alert => alert.colId === options.colId);
    }
    
    // Limiter le nombre de résultats
    if (options.limit && !isNaN(options.limit)) {
      alerts = alerts.slice(0, parseInt(options.limit));
    }
    
    return alerts;
  }
}

// Exporter une instance singleton du service
module.exports = new ColsConditionsMonitorService();
