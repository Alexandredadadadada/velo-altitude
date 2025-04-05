/**
 * Service d'entraînement pour les cyclistes
 * Gère le stockage, l'analyse et la génération de programmes d'entraînement
 */

const NodeCache = require('node-cache');
const logger = require('../utils/logger');
const trainingZonesCalculator = require('./training-zones.service');
const workoutGenerator = require('./workout-generator.service');

// Cache avec TTL de 24 heures pour les données d'entraînement
const trainingCache = new NodeCache({ stdTTL: 86400 });

// Base de données temporaire en mémoire (à remplacer par MongoDB)
let trainingDatabase = {
  users: {},
  workouts: {},
  activities: {},
  plans: {}
};

/**
 * Service d'entraînement
 */
class TrainingService {
  constructor() {
    this.cache = trainingCache;
    this.db = trainingDatabase;
  }

  /**
   * Enregistre une nouvelle activité d'entraînement
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} activityData - Données de l'activité
   * @returns {Promise<Object>} - Activité enregistrée avec métriques calculées
   */
  async saveActivity(userId, activityData) {
    try {
      logger.info(`[TrainingService] Enregistrement d'une activité pour l'utilisateur ${userId}`);
      
      if (!userId || !activityData) {
        throw new Error('ID utilisateur et données d\'activité requis');
      }
      
      // Générer un ID unique pour l'activité
      const activityId = `act_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      // Calculer les métriques d'entraînement
      const enrichedActivity = this._calculateTrainingMetrics(activityData);
      
      // Ajouter les métadonnées
      const activity = {
        ...enrichedActivity,
        id: activityId,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Stocker dans la base de données
      if (!this.db.users[userId]) {
        this.db.users[userId] = { activities: {} };
      }
      
      if (!this.db.users[userId].activities) {
        this.db.users[userId].activities = {};
      }
      
      this.db.users[userId].activities[activityId] = activity;
      this.db.activities[activityId] = activity;
      
      // Invalider le cache pour cet utilisateur
      this._invalidateUserCache(userId);
      
      return activity;
    } catch (error) {
      logger.error(`[TrainingService] Erreur lors de l'enregistrement de l'activité: ${error.message}`);
      throw new Error(`Échec de l'enregistrement de l'activité: ${error.message}`);
    }
  }

  /**
   * Récupère les activités d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} options - Options de filtrage
   * @returns {Promise<Array<Object>>} - Liste des activités
   */
  async getUserActivities(userId, options = {}) {
    try {
      logger.info(`[TrainingService] Récupération des activités pour l'utilisateur ${userId}`);
      
      const cacheKey = `user_activities_${userId}_${JSON.stringify(options)}`;
      const cachedActivities = this.cache.get(cacheKey);
      
      if (cachedActivities) {
        logger.debug(`[TrainingService] Utilisation du cache pour les activités de l'utilisateur ${userId}`);
        return cachedActivities;
      }
      
      if (!this.db.users[userId] || !this.db.users[userId].activities) {
        return [];
      }
      
      let activities = Object.values(this.db.users[userId].activities);
      
      // Appliquer les filtres
      if (options.startDate) {
        const startDate = new Date(options.startDate);
        activities = activities.filter(activity => 
          new Date(activity.startDate) >= startDate
        );
      }
      
      if (options.endDate) {
        const endDate = new Date(options.endDate);
        activities = activities.filter(activity => 
          new Date(activity.startDate) <= endDate
        );
      }
      
      if (options.type) {
        activities = activities.filter(activity => 
          activity.type === options.type
        );
      }
      
      // Trier les activités (par défaut par date décroissante)
      activities.sort((a, b) => 
        new Date(b.startDate) - new Date(a.startDate)
      );
      
      // Pagination
      if (options.limit) {
        const limit = parseInt(options.limit);
        const offset = options.offset ? parseInt(options.offset) : 0;
        activities = activities.slice(offset, offset + limit);
      }
      
      // Mettre en cache le résultat
      this.cache.set(cacheKey, activities, 3600); // Cache d'une heure
      
      return activities;
    } catch (error) {
      logger.error(`[TrainingService] Erreur lors de la récupération des activités: ${error.message}`);
      throw new Error(`Échec de la récupération des activités: ${error.message}`);
    }
  }

  /**
   * Génère un programme d'entraînement personnalisé
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} programParams - Paramètres du programme
   * @returns {Promise<Object>} - Programme d'entraînement généré
   */
  async generateTrainingProgram(userId, programParams) {
    try {
      logger.info(`[TrainingService] Génération d'un programme d'entraînement pour l'utilisateur ${userId}`);
      
      if (!userId || !programParams) {
        throw new Error('ID utilisateur et paramètres du programme requis');
      }
      
      // Récupérer les données utilisateur
      const userProfile = await this._getUserProfile(userId);
      
      // Calculer les zones d'entraînement
      const trainingZones = await trainingZonesCalculator.calculateZones(
        userProfile.ftp || programParams.ftp,
        userProfile.hr_max || programParams.hr_max,
        userProfile.age || programParams.age,
        userProfile.weight || programParams.weight
      );
      
      // Générer le programme
      const program = await workoutGenerator.generateProgram(
        programParams,
        userProfile,
        trainingZones
      );
      
      // Enregistrer le programme
      const programId = `prog_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const completeProgram = {
        ...program,
        id: programId,
        userId,
        createdAt: new Date().toISOString(),
        status: 'active'
      };
      
      // Stocker dans la base de données
      if (!this.db.users[userId]) {
        this.db.users[userId] = { programs: {} };
      }
      
      if (!this.db.users[userId].programs) {
        this.db.users[userId].programs = {};
      }
      
      this.db.users[userId].programs[programId] = completeProgram;
      this.db.plans[programId] = completeProgram;
      
      return completeProgram;
    } catch (error) {
      logger.error(`[TrainingService] Erreur lors de la génération du programme: ${error.message}`);
      throw new Error(`Échec de la génération du programme: ${error.message}`);
    }
  }

  /**
   * Récupère les programmes d'entraînement d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Array<Object>>} - Liste des programmes
   */
  async getUserPrograms(userId) {
    try {
      logger.info(`[TrainingService] Récupération des programmes pour l'utilisateur ${userId}`);
      
      const cacheKey = `user_programs_${userId}`;
      const cachedPrograms = this.cache.get(cacheKey);
      
      if (cachedPrograms) {
        logger.debug(`[TrainingService] Utilisation du cache pour les programmes de l'utilisateur ${userId}`);
        return cachedPrograms;
      }
      
      if (!this.db.users[userId] || !this.db.users[userId].programs) {
        return [];
      }
      
      const programs = Object.values(this.db.users[userId].programs);
      
      // Trier les programmes (par date de création décroissante)
      programs.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      
      // Mettre en cache le résultat
      this.cache.set(cacheKey, programs, 3600); // Cache d'une heure
      
      return programs;
    } catch (error) {
      logger.error(`[TrainingService] Erreur lors de la récupération des programmes: ${error.message}`);
      throw new Error(`Échec de la récupération des programmes: ${error.message}`);
    }
  }

  /**
   * Analyse les performances d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} - Analyse des performances
   */
  async analyzePerformance(userId) {
    try {
      logger.info(`[TrainingService] Analyse des performances pour l'utilisateur ${userId}`);
      
      const cacheKey = `user_performance_${userId}`;
      const cachedAnalysis = this.cache.get(cacheKey);
      
      if (cachedAnalysis) {
        logger.debug(`[TrainingService] Utilisation du cache pour l'analyse des performances de l'utilisateur ${userId}`);
        return cachedAnalysis;
      }
      
      // Récupérer les activités récentes
      const recentActivities = await this.getUserActivities(userId, {
        startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 derniers jours
        limit: 100
      });
      
      if (recentActivities.length === 0) {
        return {
          userId,
          message: 'Données insuffisantes pour l\'analyse',
          timestamp: new Date().toISOString()
        };
      }
      
      // Calculer les métriques d'analyse
      const analysis = this._calculatePerformanceMetrics(recentActivities);
      
      // Ajouter des recommandations
      analysis.recommendations = this._generateRecommendations(analysis);
      
      // Mettre en cache le résultat
      this.cache.set(cacheKey, analysis, 86400); // Cache d'un jour
      
      return analysis;
    } catch (error) {
      logger.error(`[TrainingService] Erreur lors de l'analyse des performances: ${error.message}`);
      throw new Error(`Échec de l'analyse des performances: ${error.message}`);
    }
  }

  /**
   * Calcule les métriques d'entraînement pour une activité
   * @private
   * @param {Object} activity - Données brutes de l'activité
   * @returns {Object} - Activité enrichie avec métriques
   */
  _calculateTrainingMetrics(activity) {
    // Copier l'activité pour ne pas modifier l'original
    const enrichedActivity = { ...activity };
    
    // Calculer la durée en secondes si non fournie
    if (!enrichedActivity.duration && enrichedActivity.startDate && enrichedActivity.endDate) {
      const start = new Date(enrichedActivity.startDate);
      const end = new Date(enrichedActivity.endDate);
      enrichedActivity.duration = (end - start) / 1000;
    }
    
    // Calculer les calories si non fournies
    if (!enrichedActivity.calories && enrichedActivity.duration && enrichedActivity.power) {
      // Formule simplifiée: calories = puissance moyenne (W) * durée (h) * 3.6
      enrichedActivity.calories = Math.round(
        (enrichedActivity.power * enrichedActivity.duration / 3600) * 3.6
      );
    }
    
    // Calculer l'intensité relative (IF) si non fournie
    if (!enrichedActivity.intensity && enrichedActivity.power && enrichedActivity.userFtp) {
      enrichedActivity.intensity = parseFloat((enrichedActivity.power / enrichedActivity.userFtp).toFixed(2));
    }
    
    // Calculer le Training Stress Score (TSS) si non fourni
    if (!enrichedActivity.tss && enrichedActivity.intensity && enrichedActivity.duration) {
      // Formule TSS = (durée en secondes * intensité normalisée^2 * 100) / 3600
      enrichedActivity.tss = Math.round(
        (enrichedActivity.duration * Math.pow(enrichedActivity.intensity, 2) * 100) / 3600
      );
    }
    
    return enrichedActivity;
  }

  /**
   * Calcule les métriques d'analyse de performance
   * @private
   * @param {Array<Object>} activities - Liste des activités
   * @returns {Object} - Métriques d'analyse
   */
  _calculatePerformanceMetrics(activities) {
    // Initialiser l'objet d'analyse
    const analysis = {
      userId: activities[0].userId,
      period: {
        startDate: activities.reduce((earliest, activity) => 
          new Date(activity.startDate) < new Date(earliest) ? activity.startDate : earliest, 
          activities[0].startDate
        ),
        endDate: activities.reduce((latest, activity) => 
          new Date(activity.startDate) > new Date(latest) ? activity.startDate : latest, 
          activities[0].startDate
        )
      },
      metrics: {
        totalActivities: activities.length,
        totalDistance: activities.reduce((sum, a) => sum + (a.distance || 0), 0),
        totalDuration: activities.reduce((sum, a) => sum + (a.duration || 0), 0),
        totalCalories: activities.reduce((sum, a) => sum + (a.calories || 0), 0),
        totalElevation: activities.reduce((sum, a) => sum + (a.elevation || 0), 0)
      },
      performance: {},
      fatigue: {},
      timestamp: new Date().toISOString()
    };
    
    // Calculer les moyennes
    analysis.metrics.avgDistance = analysis.metrics.totalDistance / activities.length;
    analysis.metrics.avgDuration = analysis.metrics.totalDuration / activities.length;
    analysis.metrics.avgSpeed = activities.reduce((sum, a) => sum + (a.averageSpeed || 0), 0) / activities.length;
    
    // Calculer la charge d'entraînement (CTL, ATL)
    const sortedActivities = [...activities].sort((a, b) => 
      new Date(a.startDate) - new Date(b.startDate)
    );
    
    let ctl = 0; // Charge d'entraînement chronique (forme)
    let atl = 0; // Charge d'entraînement aiguë (fatigue)
    
    sortedActivities.forEach(activity => {
      const tss = activity.tss || 0;
      // Mise à jour CTL (42 jours de constante de temps)
      ctl = ctl + (tss - ctl) / 42;
      // Mise à jour ATL (7 jours de constante de temps)
      atl = atl + (tss - atl) / 7;
    });
    
    analysis.performance.ctl = Math.round(ctl);
    analysis.fatigue.atl = Math.round(atl);
    analysis.performance.tsb = Math.round(ctl - atl); // Training Stress Balance (fraîcheur)
    
    // Déterminer la tendance (amélioration, plateau, déclin)
    const recentActivities = sortedActivities.slice(-10); // 10 dernières activités
    if (recentActivities.length >= 5) {
      const firstHalf = recentActivities.slice(0, Math.floor(recentActivities.length / 2));
      const secondHalf = recentActivities.slice(Math.floor(recentActivities.length / 2));
      
      const avgPowerFirstHalf = firstHalf.reduce((sum, a) => sum + (a.power || 0), 0) / firstHalf.length;
      const avgPowerSecondHalf = secondHalf.reduce((sum, a) => sum + (a.power || 0), 0) / secondHalf.length;
      
      const powerDifference = avgPowerSecondHalf - avgPowerFirstHalf;
      
      if (powerDifference > 5) {
        analysis.performance.trend = 'amélioration';
      } else if (powerDifference < -5) {
        analysis.performance.trend = 'déclin';
      } else {
        analysis.performance.trend = 'plateau';
      }
    } else {
      analysis.performance.trend = 'données insuffisantes';
    }
    
    return analysis;
  }

  /**
   * Génère des recommandations basées sur l'analyse des performances
   * @private
   * @param {Object} analysis - Analyse des performances
   * @returns {Array<Object>} - Recommandations
   */
  _generateRecommendations(analysis) {
    const recommendations = [];
    
    // Recommandation basée sur le TSB (fraîcheur)
    if (analysis.performance.tsb < -30) {
      recommendations.push({
        type: 'recovery',
        priority: 'high',
        title: 'Fatigue importante détectée',
        description: 'Votre équilibre stress-récupération est très négatif. Prévoyez 2-3 jours de récupération active.'
      });
    } else if (analysis.performance.tsb < -10) {
      recommendations.push({
        type: 'recovery',
        priority: 'medium',
        title: 'Fatigue modérée',
        description: 'Un peu de récupération serait bénéfique. Envisagez une sortie légère ou un jour de repos.'
      });
    } else if (analysis.performance.tsb > 20) {
      recommendations.push({
        type: 'intensity',
        priority: 'medium',
        title: 'Bonne fraîcheur',
        description: 'Vous êtes bien récupéré. C\'est le moment idéal pour une séance intense ou une compétition.'
      });
    }
    
    // Recommandation basée sur la tendance de performance
    if (analysis.performance.trend === 'déclin') {
      recommendations.push({
        type: 'training',
        priority: 'high',
        title: 'Baisse de performance',
        description: 'Vos performances semblent diminuer. Envisagez de modifier votre approche d\'entraînement ou de prendre plus de repos.'
      });
    } else if (analysis.performance.trend === 'plateau' && analysis.performance.ctl > 60) {
      recommendations.push({
        type: 'training',
        priority: 'medium',
        title: 'Plateau de performance',
        description: 'Malgré une bonne charge d\'entraînement, vos performances stagnent. Essayez d\'introduire de la variabilité dans vos séances.'
      });
    } else if (analysis.performance.trend === 'amélioration') {
      recommendations.push({
        type: 'training',
        priority: 'low',
        title: 'Amélioration des performances',
        description: 'Continuez sur cette lancée, votre approche actuelle fonctionne bien.'
      });
    }
    
    // Recommandation basée sur le volume
    const avgWeeklyHours = (analysis.metrics.totalDuration / 3600) / (activities.length / 7);
    if (avgWeeklyHours < 3) {
      recommendations.push({
        type: 'volume',
        priority: 'medium',
        title: 'Volume d\'entraînement faible',
        description: 'Pour progresser davantage, essayez d\'augmenter progressivement votre volume d\'entraînement hebdomadaire.'
      });
    } else if (avgWeeklyHours > 12 && analysis.performance.trend !== 'amélioration') {
      recommendations.push({
        type: 'volume',
        priority: 'medium',
        title: 'Volume d\'entraînement élevé sans progression',
        description: 'Votre volume est élevé mais ne semble pas produire de gains. Envisagez de réduire légèrement le volume et d\'augmenter la qualité.'
      });
    }
    
    return recommendations;
  }

  /**
   * Récupère le profil utilisateur
   * @private
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} - Profil utilisateur
   */
  async _getUserProfile(userId) {
    // Dans une implémentation réelle, cela récupérerait le profil depuis une base de données
    if (!this.db.users[userId]) {
      return { id: userId };
    }
    
    return this.db.users[userId].profile || { id: userId };
  }

  /**
   * Invalide le cache pour un utilisateur
   * @private
   * @param {string} userId - ID de l'utilisateur
   */
  _invalidateUserCache(userId) {
    const keys = this.cache.keys();
    const userKeys = keys.filter(key => key.includes(userId));
    
    userKeys.forEach(key => {
      this.cache.del(key);
    });
    
    logger.debug(`[TrainingService] Cache invalidé pour l'utilisateur ${userId}`);
  }
}

module.exports = new TrainingService();
