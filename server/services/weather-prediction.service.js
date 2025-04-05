/**
 * Service de prédiction et de préchargement pour les données météo
 * Analyse les tendances d'utilisation pour anticiper les besoins en données météo
 */

const mongoose = require('mongoose');
const schedule = require('node-schedule');
const { logger } = require('../utils/logger');
const geoClusteringService = require('./geo-clustering.service');
const weatherCacheService = require('./weather-cache.service');

// Schéma pour stocker les zones populaires et l'historique des requêtes
const weatherRequestSchema = new mongoose.Schema({
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      index: '2dsphere'
    }
  },
  requestType: {
    type: String,
    enum: ['current', 'forecast', 'hourly', 'uv', 'air', 'alert'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    required: false
  },
  source: {
    type: String,
    enum: ['web', 'app', 'api', 'system'],
    default: 'web'
  }
}, { 
  timestamps: true 
});

// Index pour les recherches par lieu et par temps
weatherRequestSchema.index({ 'location': '2dsphere' });
weatherRequestSchema.index({ 'timestamp': -1 });

// Modèle pour les requêtes météo
let WeatherRequestModel;
try {
  WeatherRequestModel = mongoose.model('WeatherRequest');
} catch (error) {
  WeatherRequestModel = mongoose.model('WeatherRequest', weatherRequestSchema);
}

class WeatherPredictionService {
  constructor() {
    this.weatherService = null; // Sera injecté après l'initialisation
    
    // Configuration
    this.config = {
      // Intervalle de préchargement (en minutes)
      preloadInterval: 30,
      // Nombre de zones populaires à précharger
      maxPopularAreas: 15,
      // Période d'analyse (en jours)
      analysisPeriod: 7,
      // Facteur de saisonnalité (poids plus élevé pour les requêtes récentes)
      recencyFactor: 2,
      // Heure de début pour le préchargement intensif (minuit)
      nightlyPreloadStart: 0,
      // Heure de fin pour le préchargement intensif (5h du matin)
      nightlyPreloadEnd: 5,
      // Facteur pour augmenter le nombre de zones pendant la nuit
      nightlyPreloadFactor: 2,
      // Seuil minimum de requêtes pour considérer une zone comme populaire
      popularityThreshold: 5
    };
    
    // Tâches planifiées
    this.jobs = {
      regularPreload: null,
      nightlyPreload: null,
      analysisUpdate: null
    };
    
    // Cache pour les zones populaires (évite des calculs répétés)
    this.popularAreasCache = {
      areas: [],
      timestamp: null,
      ttl: 6 * 60 * 60 * 1000 // 6 heures
    };
    
    logger.info('Service de prédiction météo initialisé');
  }

  /**
   * Initialise le service avec une référence au service météo
   * @param {Object} weatherService - Service météo
   */
  init(weatherService) {
    this.weatherService = weatherService;
    
    // Démarrer les tâches planifiées
    this._scheduleJobs();
    
    logger.info('Service de prédiction météo démarré avec les tâches planifiées');
  }

  /**
   * Enregistre une requête météo pour analyse
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @param {string} type - Type de requête (current, forecast, etc.)
   * @param {Object} context - Contexte de la requête (userId, routeId, etc.)
   */
  async recordRequest(lat, lon, type = 'current', context = {}) {
    try {
      // Créer une nouvelle entrée dans l'historique
      const request = new WeatherRequestModel({
        location: {
          type: 'Point',
          coordinates: [lon, lat]
        },
        requestType: type,
        userId: context.userId,
        routeId: context.routeId,
        source: context.source || 'web'
      });
      
      await request.save();
    } catch (error) {
      // Ne pas bloquer l'application si l'enregistrement échoue
      logger.error(`Erreur lors de l'enregistrement d'une requête météo: ${error.message}`);
    }
  }

  /**
   * Analyse les tendances et identifie les zones populaires
   * @param {Object} options - Options d'analyse
   * @returns {Promise<Array>} Zones populaires
   */
  async analyzePopularAreas(options = {}) {
    // Vérifier si le cache est valide
    if (this._isPopularAreasCacheValid()) {
      return this.popularAreasCache.areas;
    }
    
    const defaultOptions = {
      days: this.config.analysisPeriod,
      limit: this.config.maxPopularAreas,
      recencyWeight: this.config.recencyFactor,
      minCount: this.config.popularityThreshold
    };
    
    const opts = { ...defaultOptions, ...options };
    
    try {
      // Période d'analyse
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - opts.days);
      
      // Requête pour obtenir toutes les coordonnées demandées récemment
      const requests = await WeatherRequestModel.find({
        timestamp: { $gte: startDate }
      }).select('location requestType timestamp').lean();
      
      if (requests.length === 0) {
        logger.info('Aucune requête météo trouvée pour l\'analyse');
        return [];
      }
      
      // Transformer les requêtes en points pour le clustering
      const points = requests.map(req => {
        // Calculer le poids basé sur la récence
        const ageInDays = (new Date() - new Date(req.timestamp)) / (1000 * 3600 * 24);
        const recencyWeight = Math.max(0.1, 1 - (ageInDays / opts.days) * (1 - 1/opts.recencyWeight));
        
        return {
          lat: req.location.coordinates[1],
          lon: req.location.coordinates[0],
          type: req.requestType,
          timestamp: req.timestamp,
          weight: recencyWeight
        };
      });
      
      // Appliquer l'algorithme de clustering
      const clusters = geoClusteringService.clusterPoints(points, {
        maxDistance: 10, // 10km
        minPoints: opts.minCount
      });
      
      // Trouver les types de requêtes les plus fréquents pour chaque cluster
      const enrichedClusters = clusters.map(cluster => {
        // Compter les types de requêtes dans ce cluster
        const typeCounts = {};
        cluster.points.forEach(point => {
          typeCounts[point.type] = (typeCounts[point.type] || 0) + (point.weight || 1);
        });
        
        // Trouver le type le plus demandé
        let maxCount = 0;
        let dominantType = 'current';
        
        Object.entries(typeCounts).forEach(([type, count]) => {
          if (count > maxCount) {
            maxCount = count;
            dominantType = type;
          }
        });
        
        // Calculer un score global basé sur le nombre de points et leur poids
        const score = cluster.points.reduce(
          (sum, point) => sum + (point.weight || 1), 
          0
        );
        
        return {
          ...cluster,
          dominantType,
          typeCounts,
          score
        };
      });
      
      // Trier par score décroissant et limiter le nombre
      const popularAreas = enrichedClusters
        .sort((a, b) => b.score - a.score)
        .slice(0, opts.limit);
      
      // Mettre à jour le cache
      this.popularAreasCache = {
        areas: popularAreas,
        timestamp: new Date(),
        ttl: 6 * 60 * 60 * 1000 // 6 heures
      };
      
      logger.info(`Analyse terminée: ${popularAreas.length} zones populaires identifiées`);
      return popularAreas;
    } catch (error) {
      logger.error(`Erreur lors de l'analyse des zones populaires: ${error.message}`);
      return [];
    }
  }

  /**
   * Précharge les données météo pour les zones populaires
   * @param {Object} options - Options de préchargement
   * @returns {Promise<number>} Nombre de zones préchargées
   */
  async preloadPopularAreas(options = {}) {
    if (!this.weatherService) {
      logger.error('Service météo non disponible pour le préchargement');
      return 0;
    }
    
    const defaultOptions = {
      force: false,
      maxAreas: this.config.maxPopularAreas,
      // Types de données à précharger (par défaut, current et forecast)
      types: ['current', 'forecast'],
      // Préchargement nocturne plus intensif
      isNightlyRun: false
    };
    
    const opts = { ...defaultOptions, ...options };
    
    try {
      // Ajuster le nombre de zones pendant la nuit
      if (opts.isNightlyRun) {
        opts.maxAreas = Math.min(50, opts.maxAreas * this.config.nightlyPreloadFactor);
      }
      
      // Obtenir les zones populaires
      const popularAreas = await this.analyzePopularAreas({
        limit: opts.maxAreas,
        force: opts.force
      });
      
      if (popularAreas.length === 0) {
        logger.info('Aucune zone populaire à précharger');
        return 0;
      }
      
      logger.info(`Préchargement des données météo pour ${popularAreas.length} zones populaires`);
      
      // Préchargement des données pour chaque zone
      let successCount = 0;
      
      for (const area of popularAreas) {
        try {
          // Précharger les types de données demandés
          for (const type of opts.types) {
            if (type === 'current') {
              await this.weatherService.getCurrentWeather(
                area.centroid.lat, 
                area.centroid.lon,
                { forceRefresh: opts.force }
              );
            } else if (type === 'forecast') {
              await this.weatherService.getForecast(
                area.centroid.lat, 
                area.centroid.lon,
                { forceRefresh: opts.force }
              );
            } else if (type === 'hourly') {
              await this.weatherService.getHourlyForecast(
                area.centroid.lat, 
                area.centroid.lon,
                { forceRefresh: opts.force }
              );
            } else if (type === 'air') {
              await this.weatherService.getAirPollution(
                area.centroid.lat, 
                area.centroid.lon,
                { forceRefresh: opts.force }
              );
            }
          }
          
          successCount++;
        } catch (error) {
          logger.error(`Erreur lors du préchargement pour la zone (${area.centroid.lat}, ${area.centroid.lon}): ${error.message}`);
        }
        
        // Petite pause pour ne pas surcharger l'API
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      logger.info(`Préchargement terminé: ${successCount}/${popularAreas.length} zones préchargées avec succès`);
      return successCount;
    } catch (error) {
      logger.error(`Erreur lors du préchargement des zones populaires: ${error.message}`);
      return 0;
    }
  }

  /**
   * Nettoie les données anciennes de l'historique des requêtes
   * @param {number} days - Nombre de jours à conserver
   * @returns {Promise<number>} Nombre d'entrées supprimées
   */
  async cleanOldRequestData(days = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const result = await WeatherRequestModel.deleteMany({
        timestamp: { $lt: cutoffDate }
      });
      
      logger.info(`Nettoyage des données de requêtes: ${result.deletedCount} entrées supprimées`);
      return result.deletedCount;
    } catch (error) {
      logger.error(`Erreur lors du nettoyage des données de requêtes: ${error.message}`);
      return 0;
    }
  }

  /**
   * Démarre les tâches planifiées
   * @private
   */
  _scheduleJobs() {
    // Préchargement régulier (toutes les X minutes)
    this.jobs.regularPreload = schedule.scheduleJob(`*/${this.config.preloadInterval} * * * *`, async () => {
      logger.info('Démarrage du préchargement régulier des zones populaires');
      
      // Vérifier s'il s'agit d'un run nocturne
      const currentHour = new Date().getHours();
      const isNightlyRun = currentHour >= this.config.nightlyPreloadStart && 
                          currentHour < this.config.nightlyPreloadEnd;
      
      await this.preloadPopularAreas({ isNightlyRun });
    });
    
    // Mise à jour de l'analyse (une fois par jour à 3h du matin)
    this.jobs.analysisUpdate = schedule.scheduleJob('0 3 * * *', async () => {
      logger.info('Mise à jour de l\'analyse des zones populaires');
      
      // Forcer une mise à jour complète
      await this.analyzePopularAreas({ force: true });
      
      // Nettoyer les anciennes données
      await this.cleanOldRequestData();
    });
  }

  /**
   * Arrête les tâches planifiées
   */
  stopJobs() {
    Object.values(this.jobs).forEach(job => {
      if (job) {
        job.cancel();
      }
    });
    
    logger.info('Tâches planifiées du service de prédiction météo arrêtées');
  }

  /**
   * Vérifie si le cache des zones populaires est valide
   * @private
   * @returns {boolean} Vrai si le cache est valide
   */
  _isPopularAreasCacheValid() {
    if (!this.popularAreasCache.timestamp) {
      return false;
    }
    
    const age = new Date() - this.popularAreasCache.timestamp;
    return age < this.popularAreasCache.ttl;
  }
}

// Singleton
const weatherPredictionService = new WeatherPredictionService();
module.exports = weatherPredictionService;
