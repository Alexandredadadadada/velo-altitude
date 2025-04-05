/**
 * Service de rafraîchissement automatique des données Strava
 * Gère la mise à jour périodique des données d'activités, segments, clubs et athlètes
 * tout en respectant les limites de taux de l'API
 */
const axios = require('axios');
const schedule = require('node-schedule');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');
const stravaTokenService = require('./strava-token.service');
const apiQuotaManager = require('./api-quota-manager');
const { trackApiCall, canCallApi } = require('../middleware/api-quota-middleware');
const notificationService = require('./notification.service');

class StravaDataRefreshService {
  constructor() {
    this.baseUrl = 'https://www.strava.com/api/v3';
    this.dataDir = path.join(process.cwd(), 'data', 'strava');
    this.schedules = {};
    this.refreshStatus = {
      activities: {
        lastRefresh: null,
        inProgress: false,
        error: null,
        totalItems: 0
      },
      segments: {
        lastRefresh: null,
        inProgress: false,
        error: null,
        totalItems: 0
      },
      clubs: {
        lastRefresh: null,
        inProgress: false,
        error: null,
        totalItems: 0
      },
      routes: {
        lastRefresh: null,
        inProgress: false,
        error: null,
        totalItems: 0
      }
    };
    
    // Créer le répertoire de données s'il n'existe pas
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  /**
   * Initialise le service de rafraîchissement des données
   * @param {Object} config Configuration des rafraîchissements
   */
  initialize(config = {}) {
    try {
      logger.info('Initialisation du service de rafraîchissement des données Strava');
      
      // Configuration par défaut
      const defaultConfig = {
        activities: {
          enabled: true,
          interval: '0 */2 * * *', // Toutes les 2 heures
          limit: 100,
          includeDetails: true
        },
        segments: {
          enabled: true,
          interval: '0 0 * * *', // Une fois par jour à minuit
          limit: 50
        },
        clubs: {
          enabled: true,
          interval: '0 3 * * *', // Une fois par jour à 3h du matin
          ids: []
        },
        routes: {
          enabled: true,
          interval: '0 4 * * *', // Une fois par jour à 4h du matin
          limit: 50
        }
      };
      
      // Fusionner avec la configuration fournie
      this.config = { ...defaultConfig, ...config };
      
      // Planifier les rafraîchissements
      this.scheduleRefreshes();
      
      logger.info('Service de rafraîchissement des données Strava initialisé');
      return true;
    } catch (error) {
      logger.error('Erreur lors de l\'initialisation du service de rafraîchissement Strava', {
        error: error.message
      });
      return false;
    }
  }

  /**
   * Planifie les rafraîchissements périodiques
   */
  scheduleRefreshes() {
    // Annuler les planifications existantes
    Object.values(this.schedules).forEach(job => job.cancel());
    this.schedules = {};
    
    // Planifier le rafraîchissement des activités
    if (this.config.activities.enabled) {
      this.schedules.activities = schedule.scheduleJob(
        this.config.activities.interval,
        () => this.refreshActivities()
      );
      logger.info(`Rafraîchissement des activités planifié: ${this.config.activities.interval}`);
    }
    
    // Planifier le rafraîchissement des segments
    if (this.config.segments.enabled) {
      this.schedules.segments = schedule.scheduleJob(
        this.config.segments.interval,
        () => this.refreshSegments()
      );
      logger.info(`Rafraîchissement des segments planifié: ${this.config.segments.interval}`);
    }
    
    // Planifier le rafraîchissement des clubs
    if (this.config.clubs.enabled) {
      this.schedules.clubs = schedule.scheduleJob(
        this.config.clubs.interval,
        () => this.refreshClubs()
      );
      logger.info(`Rafraîchissement des clubs planifié: ${this.config.clubs.interval}`);
    }
    
    // Planifier le rafraîchissement des routes
    if (this.config.routes.enabled) {
      this.schedules.routes = schedule.scheduleJob(
        this.config.routes.interval,
        () => this.refreshRoutes()
      );
      logger.info(`Rafraîchissement des routes planifié: ${this.config.routes.interval}`);
    }
  }

  /**
   * Effectue une requête authentifiée à l'API Strava
   * @param {string} endpoint Point d'accès de l'API
   * @param {Object} params Paramètres de la requête
   * @returns {Promise<Object>} Réponse de l'API
   */
  async makeStravaRequest(endpoint, params = {}) {
    try {
      if (!canCallApi('strava')) {
        throw new Error('Quota API Strava dépassé');
      }
      
      // Obtenir un token d'accès valide
      const accessToken = await stravaTokenService.refreshTokenIfNeeded();
      
      const startTime = Date.now();
      const response = await axios.get(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        params
      });
      
      // Enregistrer l'appel API réussi
      trackApiCall(
        'strava',
        endpoint,
        true,
        response.status,
        Date.now() - startTime
      );
      
      return response.data;
    } catch (error) {
      // Enregistrer l'appel API échoué
      trackApiCall(
        'strava',
        endpoint,
        false,
        error.response?.status || 0,
        Date.now() - startTime
      );
      
      // Logger l'erreur
      logger.error(`Erreur lors de la requête Strava ${endpoint}`, {
        error: error.message,
        status: error.response?.status,
        params
      });
      
      throw error;
    }
  }

  /**
   * Rafraîchit les activités
   * @param {boolean} force Force le rafraîchissement même si récent
   * @returns {Promise<boolean>} Succès ou échec
   */
  async refreshActivities(force = false) {
    const status = this.refreshStatus.activities;
    
    // Vérifier si un rafraîchissement est déjà en cours
    if (status.inProgress) {
      logger.warn('Rafraîchissement des activités déjà en cours');
      return false;
    }
    
    // Vérifier si un rafraîchissement a été effectué récemment (moins d'une heure)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (!force && status.lastRefresh && new Date(status.lastRefresh) > oneHourAgo) {
      logger.info('Rafraîchissement des activités ignoré (dernier rafraîchissement < 1h)');
      return false;
    }
    
    try {
      logger.info('Début du rafraîchissement des activités');
      status.inProgress = true;
      status.error = null;
      
      // Récupérer les activités
      const limit = this.config.activities.limit || 100;
      const activities = await this.makeStravaRequest('/athlete/activities', {
        per_page: limit,
        page: 1
      });
      
      // Sauvegarder les données
      const filePath = path.join(this.dataDir, 'activities.json');
      fs.writeFileSync(filePath, JSON.stringify(activities, null, 2));
      
      status.totalItems = activities.length;
      
      // Si la configuration demande de récupérer les détails, faire des requêtes supplémentaires
      if (this.config.activities.includeDetails) {
        let detailedActivities = [];
        
        // Créer un répertoire pour les activités détaillées
        const detailsDir = path.join(this.dataDir, 'activity_details');
        if (!fs.existsSync(detailsDir)) {
          fs.mkdirSync(detailsDir, { recursive: true });
        }
        
        // Limiter le nombre d'appels API pour les détails
        const maxDetailedActivities = Math.min(activities.length, 10);
        
        for (let i = 0; i < maxDetailedActivities; i++) {
          const activity = activities[i];
          
          // Vérifier si les détails existent déjà
          const detailPath = path.join(detailsDir, `${activity.id}.json`);
          if (fs.existsSync(detailPath)) {
            // Récupérer depuis le fichier
            const detailData = JSON.parse(fs.readFileSync(detailPath, 'utf8'));
            detailedActivities.push(detailData);
          } else {
            // Vérifier si on peut faire un appel API
            if (canCallApi('strava')) {
              try {
                // Récupérer depuis l'API
                const details = await this.makeStravaRequest(`/activities/${activity.id}`);
                
                // Sauvegarder les détails
                fs.writeFileSync(detailPath, JSON.stringify(details, null, 2));
                detailedActivities.push(details);
                
                // Attendre un peu pour ne pas surcharger l'API
                await new Promise(resolve => setTimeout(resolve, 1000));
              } catch (error) {
                logger.error(`Erreur lors de la récupération des détails de l'activité ${activity.id}`, {
                  error: error.message
                });
                // Continuer avec l'activité suivante
              }
            } else {
              logger.warn('Quota API dépassé, arrêt de la récupération des détails');
              break;
            }
          }
        }
        
        // Sauvegarder un index des activités détaillées
        fs.writeFileSync(
          path.join(this.dataDir, 'detailed_activities_index.json'),
          JSON.stringify(detailedActivities.map(a => ({
            id: a.id,
            name: a.name,
            start_date: a.start_date,
            type: a.type,
            distance: a.distance,
            moving_time: a.moving_time
          })), null, 2)
        );
      }
      
      // Mettre à jour le statut
      status.lastRefresh = new Date().toISOString();
      status.inProgress = false;
      
      logger.info(`Rafraîchissement des activités terminé (${status.totalItems} activités)`);
      return true;
    } catch (error) {
      status.error = error.message;
      status.inProgress = false;
      
      logger.error('Erreur lors du rafraîchissement des activités', {
        error: error.message
      });
      
      notificationService.sendAlert({
        type: 'error',
        source: 'strava-refresh',
        subject: 'Erreur de rafraîchissement des activités Strava',
        message: `Une erreur s'est produite lors du rafraîchissement des activités: ${error.message}`
      });
      
      return false;
    }
  }

  /**
   * Rafraîchit les segments favoris
   * @param {boolean} force Force le rafraîchissement même si récent
   * @returns {Promise<boolean>} Succès ou échec
   */
  async refreshSegments(force = false) {
    const status = this.refreshStatus.segments;
    
    // Vérifier si un rafraîchissement est déjà en cours
    if (status.inProgress) {
      logger.warn('Rafraîchissement des segments déjà en cours');
      return false;
    }
    
    // Vérifier si un rafraîchissement a été effectué récemment (moins de 12 heures)
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    if (!force && status.lastRefresh && new Date(status.lastRefresh) > twelveHoursAgo) {
      logger.info('Rafraîchissement des segments ignoré (dernier rafraîchissement < 12h)');
      return false;
    }
    
    try {
      logger.info('Début du rafraîchissement des segments');
      status.inProgress = true;
      status.error = null;
      
      // Récupérer les segments favoris
      const limit = this.config.segments.limit || 50;
      const segments = await this.makeStravaRequest('/segments/starred', {
        per_page: limit,
        page: 1
      });
      
      // Sauvegarder les données
      const filePath = path.join(this.dataDir, 'segments.json');
      fs.writeFileSync(filePath, JSON.stringify(segments, null, 2));
      
      status.totalItems = segments.length;
      
      // Mettre à jour le statut
      status.lastRefresh = new Date().toISOString();
      status.inProgress = false;
      
      logger.info(`Rafraîchissement des segments terminé (${status.totalItems} segments)`);
      return true;
    } catch (error) {
      status.error = error.message;
      status.inProgress = false;
      
      logger.error('Erreur lors du rafraîchissement des segments', {
        error: error.message
      });
      
      notificationService.sendAlert({
        type: 'error',
        source: 'strava-refresh',
        subject: 'Erreur de rafraîchissement des segments Strava',
        message: `Une erreur s'est produite lors du rafraîchissement des segments: ${error.message}`
      });
      
      return false;
    }
  }

  /**
   * Rafraîchit les données des clubs
   * @param {boolean} force Force le rafraîchissement même si récent
   * @returns {Promise<boolean>} Succès ou échec
   */
  async refreshClubs(force = false) {
    const status = this.refreshStatus.clubs;
    
    // Vérifier si un rafraîchissement est déjà en cours
    if (status.inProgress) {
      logger.warn('Rafraîchissement des clubs déjà en cours');
      return false;
    }
    
    // Vérifier si un rafraîchissement a été effectué récemment (moins de 24 heures)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    if (!force && status.lastRefresh && new Date(status.lastRefresh) > oneDayAgo) {
      logger.info('Rafraîchissement des clubs ignoré (dernier rafraîchissement < 24h)');
      return false;
    }
    
    try {
      logger.info('Début du rafraîchissement des clubs');
      status.inProgress = true;
      status.error = null;
      
      // D'abord, récupérer les clubs de l'athlète
      const athleteClubs = await this.makeStravaRequest('/athlete/clubs');
      
      // Fusionner avec les IDs de clubs configurés
      const configClubIds = this.config.clubs.ids || [];
      const clubIds = [...new Set([
        ...athleteClubs.map(club => club.id),
        ...configClubIds
      ])];
      
      const clubsData = {};
      
      // Récupérer les détails pour chaque club
      for (const clubId of clubIds) {
        if (!canCallApi('strava')) {
          logger.warn('Quota API dépassé, arrêt de la récupération des clubs');
          break;
        }
        
        try {
          const clubDetails = await this.makeStravaRequest(`/clubs/${clubId}`);
          clubsData[clubId] = clubDetails;
          
          // Pause entre les requêtes
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          logger.error(`Erreur lors de la récupération des détails du club ${clubId}`, {
            error: error.message
          });
          // Continuer avec le club suivant
        }
      }
      
      // Sauvegarder les données
      const filePath = path.join(this.dataDir, 'clubs.json');
      fs.writeFileSync(filePath, JSON.stringify(Object.values(clubsData), null, 2));
      
      status.totalItems = Object.keys(clubsData).length;
      
      // Mettre à jour le statut
      status.lastRefresh = new Date().toISOString();
      status.inProgress = false;
      
      logger.info(`Rafraîchissement des clubs terminé (${status.totalItems} clubs)`);
      return true;
    } catch (error) {
      status.error = error.message;
      status.inProgress = false;
      
      logger.error('Erreur lors du rafraîchissement des clubs', {
        error: error.message
      });
      
      notificationService.sendAlert({
        type: 'error',
        source: 'strava-refresh',
        subject: 'Erreur de rafraîchissement des clubs Strava',
        message: `Une erreur s'est produite lors du rafraîchissement des clubs: ${error.message}`
      });
      
      return false;
    }
  }

  /**
   * Rafraîchit les routes
   * @param {boolean} force Force le rafraîchissement même si récent
   * @returns {Promise<boolean>} Succès ou échec
   */
  async refreshRoutes(force = false) {
    const status = this.refreshStatus.routes;
    
    // Vérifier si un rafraîchissement est déjà en cours
    if (status.inProgress) {
      logger.warn('Rafraîchissement des routes déjà en cours');
      return false;
    }
    
    // Vérifier si un rafraîchissement a été effectué récemment (moins de 24 heures)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    if (!force && status.lastRefresh && new Date(status.lastRefresh) > oneDayAgo) {
      logger.info('Rafraîchissement des routes ignoré (dernier rafraîchissement < 24h)');
      return false;
    }
    
    try {
      logger.info('Début du rafraîchissement des routes');
      status.inProgress = true;
      status.error = null;
      
      // Récupérer les routes de l'athlète
      const limit = this.config.routes.limit || 50;
      const routes = await this.makeStravaRequest('/athletes/routes', {
        per_page: limit,
        page: 1
      });
      
      // Sauvegarder les données
      const filePath = path.join(this.dataDir, 'routes.json');
      fs.writeFileSync(filePath, JSON.stringify(routes, null, 2));
      
      status.totalItems = routes.length;
      
      // Mettre à jour le statut
      status.lastRefresh = new Date().toISOString();
      status.inProgress = false;
      
      logger.info(`Rafraîchissement des routes terminé (${status.totalItems} routes)`);
      return true;
    } catch (error) {
      status.error = error.message;
      status.inProgress = false;
      
      logger.error('Erreur lors du rafraîchissement des routes', {
        error: error.message
      });
      
      notificationService.sendAlert({
        type: 'error',
        source: 'strava-refresh',
        subject: 'Erreur de rafraîchissement des routes Strava',
        message: `Une erreur s'est produite lors du rafraîchissement des routes: ${error.message}`
      });
      
      return false;
    }
  }

  /**
   * Force le rafraîchissement immédiat d'un type de données
   * @param {string} dataType Type de données (activities, segments, clubs, routes)
   * @returns {Promise<boolean>} Succès ou échec
   */
  async forceRefresh(dataType) {
    switch (dataType) {
      case 'activities':
        return this.refreshActivities(true);
      case 'segments':
        return this.refreshSegments(true);
      case 'clubs':
        return this.refreshClubs(true);
      case 'routes':
        return this.refreshRoutes(true);
      case 'all':
        // Rafraîchir tous les types de données
        const results = await Promise.all([
          this.refreshActivities(true),
          this.refreshSegments(true),
          this.refreshClubs(true),
          this.refreshRoutes(true)
        ]);
        return results.every(result => result);
      default:
        logger.error(`Type de données inconnu: ${dataType}`);
        return false;
    }
  }

  /**
   * Obtient le statut actuel des rafraîchissements
   * @returns {Object} État actuel des rafraîchissements
   */
  getStatus() {
    return {
      config: this.config,
      status: this.refreshStatus,
      schedules: Object.entries(this.schedules).reduce((acc, [key, job]) => {
        acc[key] = {
          active: !!job,
          nextInvocation: job ? job.nextInvocation() : null
        };
        return acc;
      }, {})
    };
  }
}

// Exporter une instance singleton
const stravaDataRefreshService = new StravaDataRefreshService();
module.exports = stravaDataRefreshService;
