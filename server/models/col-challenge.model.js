/**
 * Modèle pour gérer le système de défi des cols
 * @module models/col-challenge.model
 */

const mongoose = require('mongoose');
const logger = require('../utils/logger');
const weatherErrorHandler = require('../utils/error-handler');

// Schéma pour un col individuel dans le challenge
const colProgressSchema = new mongoose.Schema({
  colId: {
    type: String,
    required: true
  },
  colName: {
    type: String,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  completionDate: {
    type: Date
  },
  efforts: [{
    date: {
      type: Date,
      required: true
    },
    duration: Number,
    avgSpeed: Number,
    maxSpeed: Number,
    avgPower: Number,
    maxPower: Number,
    avgHeartRate: Number,
    maxHeartRate: Number,
    elevationGain: Number,
    route: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route'
    },
    fileId: String,
    weather: {
      temperature: Number,
      condition: String,
      windSpeed: Number,
      windDirection: Number
    }
  }],
  personalBest: {
    date: Date,
    duration: Number,
    avgSpeed: Number,
    segments: [{
      name: String,
      duration: Number,
      avgSpeed: Number,
      avgPower: Number,
      maxPower: Number
    }]
  },
  notes: String,
  favorite: {
    type: Boolean,
    default: false
  }
});

// Schéma pour le challenge global
const colChallengeSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  challengeId: {
    type: String,
    required: true
  },
  challengeName: {
    type: String,
    required: true
  },
  description: String,
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: Date,
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed', 'abandoned'],
    default: 'not_started'
  },
  progress: {
    type: Number,
    default: 0
  },
  completionCertificateUrl: String,
  completionDate: Date,
  cols: [colProgressSchema],
  badges: [{
    badgeId: String,
    name: String,
    description: String,
    imageUrl: String,
    earnedDate: {
      type: Date,
      default: Date.now
    },
    criteria: String
  }],
  totalDistance: {
    type: Number,
    default: 0
  },
  totalElevationGain: {
    type: Number,
    default: 0
  },
  sharedOnSocialMedia: [{
    platform: String,
    shareDate: {
      type: Date,
      default: Date.now
    },
    shareUrl: String
  }]
}, {
  timestamps: true
});

// Index pour les recherches fréquentes
colChallengeSchema.index({ userId: 1, challengeId: 1 }, { unique: true });
colChallengeSchema.index({ completionDate: -1 });
colChallengeSchema.index({ status: 1 });

/**
 * Modèle pour le leaderboard du challenge
 */
const leaderboardSchema = new mongoose.Schema({
  challengeId: {
    type: String,
    required: true,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  entries: [{
    userId: String,
    userName: String,
    userAvatar: String,
    completionDate: Date,
    totalTime: Number, // Temps total en secondes
    totalPoints: Number,
    colsCompleted: Number,
    fastestCol: {
      colId: String,
      colName: String,
      time: Number
    },
    badges: [String], // Liste des badges gagnés
    rank: Number
  }]
});

// Créer les modèles
const ColChallenge = mongoose.model('ColChallenge', colChallengeSchema);
const Leaderboard = mongoose.model('ColLeaderboard', leaderboardSchema);

/**
 * Classe pour gérer les challenges de cols
 */
class ColChallengeModel {
  /**
   * Crée ou met à jour un challenge pour un utilisateur
   * @param {String} userId - ID de l'utilisateur
   * @param {String} challengeId - ID du challenge
   * @param {Object} challengeData - Données du challenge
   * @returns {Promise<Object>} - Challenge créé ou mis à jour
   */
  async createOrUpdateChallenge(userId, challengeId, challengeData) {
    try {
      const challenge = await ColChallenge.findOneAndUpdate(
        { userId, challengeId },
        challengeData,
        { new: true, upsert: true }
      );
      
      return challenge;
    } catch (error) {
      logger.error('Erreur lors de la création/mise à jour du challenge', {
        error: error.message,
        userId,
        challengeId
      });
      
      throw weatherErrorHandler.setProcessingError(
        'Erreur lors de la création/mise à jour du challenge',
        { originalError: error.message },
        'CHALLENGE_UPDATE_ERROR'
      );
    }
  }

  /**
   * Récupère le challenge d'un utilisateur
   * @param {String} userId - ID de l'utilisateur
   * @param {String} challengeId - ID du challenge
   * @returns {Promise<Object>} - Challenge de l'utilisateur
   */
  async getUserChallenge(userId, challengeId) {
    try {
      const challenge = await ColChallenge.findOne({ userId, challengeId });
      return challenge;
    } catch (error) {
      logger.error('Erreur lors de la récupération du challenge utilisateur', {
        error: error.message,
        userId,
        challengeId
      });
      
      throw weatherErrorHandler.setProcessingError(
        'Erreur lors de la récupération du challenge utilisateur',
        { originalError: error.message },
        'CHALLENGE_FETCH_ERROR'
      );
    }
  }

  /**
   * Récupère tous les challenges d'un utilisateur
   * @param {String} userId - ID de l'utilisateur
   * @returns {Promise<Array>} - Liste des challenges de l'utilisateur
   */
  async getAllUserChallenges(userId) {
    try {
      const challenges = await ColChallenge.find({ userId });
      return challenges;
    } catch (error) {
      logger.error('Erreur lors de la récupération des challenges utilisateur', {
        error: error.message,
        userId
      });
      
      throw weatherErrorHandler.setProcessingError(
        'Erreur lors de la récupération des challenges utilisateur',
        { originalError: error.message },
        'CHALLENGES_FETCH_ERROR'
      );
    }
  }

  /**
   * Met à jour la progression d'un col spécifique dans un challenge
   * @param {String} userId - ID de l'utilisateur
   * @param {String} challengeId - ID du challenge
   * @param {String} colId - ID du col
   * @param {Object} progressData - Données de progression
   * @returns {Promise<Object>} - Challenge mis à jour
   */
  async updateColProgress(userId, challengeId, colId, progressData) {
    try {
      const challenge = await ColChallenge.findOne({ userId, challengeId });
      
      if (!challenge) {
        throw new Error('Challenge non trouvé');
      }
      
      // Trouver le col dans le challenge
      const colIndex = challenge.cols.findIndex(col => col.colId === colId);
      
      if (colIndex === -1) {
        // Si le col n'existe pas dans le challenge, l'ajouter
        if (progressData.colName) {
          challenge.cols.push({
            colId,
            colName: progressData.colName,
            ...progressData
          });
        } else {
          throw new Error('Le col n\'existe pas dans ce challenge');
        }
      } else {
        // Mettre à jour les données du col
        Object.keys(progressData).forEach(key => {
          challenge.cols[colIndex][key] = progressData[key];
        });
      }
      
      // Recalculer la progression globale
      const completedCols = challenge.cols.filter(col => col.completed).length;
      challenge.progress = Math.round((completedCols / challenge.cols.length) * 100);
      
      // Si tous les cols sont complétés, marquer le challenge comme terminé
      if (challenge.progress === 100) {
        challenge.status = 'completed';
        challenge.completionDate = new Date();
      } else if (challenge.progress > 0) {
        challenge.status = 'in_progress';
      }
      
      await challenge.save();
      return challenge;
    } catch (error) {
      logger.error('Erreur lors de la mise à jour de la progression du col', {
        error: error.message,
        userId,
        challengeId,
        colId
      });
      
      throw weatherErrorHandler.setProcessingError(
        'Erreur lors de la mise à jour de la progression du col',
        { originalError: error.message },
        'COL_PROGRESS_UPDATE_ERROR'
      );
    }
  }

  /**
   * Ajoute un effort pour un col spécifique
   * @param {String} userId - ID de l'utilisateur
   * @param {String} challengeId - ID du challenge
   * @param {String} colId - ID du col
   * @param {Object} effortData - Données de l'effort
   * @returns {Promise<Object>} - Challenge mis à jour
   */
  async addColEffort(userId, challengeId, colId, effortData) {
    try {
      const challenge = await ColChallenge.findOne({ userId, challengeId });
      
      if (!challenge) {
        throw new Error('Challenge non trouvé');
      }
      
      // Trouver le col dans le challenge
      const colIndex = challenge.cols.findIndex(col => col.colId === colId);
      
      if (colIndex === -1) {
        throw new Error('Col non trouvé dans ce challenge');
      }
      
      // Ajouter l'effort à la liste des efforts
      challenge.cols[colIndex].efforts.push({
        date: new Date(),
        ...effortData
      });
      
      // Marquer le col comme complété
      challenge.cols[colIndex].completed = true;
      challenge.cols[colIndex].completionDate = new Date();
      
      // Vérifier si c'est un record personnel
      if (effortData.duration && (!challenge.cols[colIndex].personalBest || 
          effortData.duration < challenge.cols[colIndex].personalBest.duration)) {
        challenge.cols[colIndex].personalBest = {
          date: new Date(),
          duration: effortData.duration,
          avgSpeed: effortData.avgSpeed,
          segments: effortData.segments || []
        };
      }
      
      // Recalculer la progression globale
      const completedCols = challenge.cols.filter(col => col.completed).length;
      challenge.progress = Math.round((completedCols / challenge.cols.length) * 100);
      
      // Si tous les cols sont complétés, marquer le challenge comme terminé
      if (challenge.progress === 100) {
        challenge.status = 'completed';
        challenge.completionDate = new Date();
        
        // Générer un certificat d'achèvement
        challenge.completionCertificateUrl = await this.generateCompletionCertificate(userId, challengeId);
      } else if (challenge.progress > 0) {
        challenge.status = 'in_progress';
      }
      
      await challenge.save();
      
      // Mettre à jour le classement si nécessaire
      await this.updateLeaderboard(challengeId);
      
      return challenge;
    } catch (error) {
      logger.error('Erreur lors de l\'ajout d\'un effort pour un col', {
        error: error.message,
        userId,
        challengeId,
        colId
      });
      
      throw weatherErrorHandler.setProcessingError(
        'Erreur lors de l\'ajout d\'un effort pour un col',
        { originalError: error.message },
        'COL_EFFORT_ADD_ERROR'
      );
    }
  }

  /**
   * Génère un certificat d'achèvement pour un challenge
   * @param {String} userId - ID de l'utilisateur
   * @param {String} challengeId - ID du challenge
   * @returns {Promise<String>} - URL du certificat
   */
  async generateCompletionCertificate(userId, challengeId) {
    try {
      // Implémentation de la génération de certificat
      // Cette fonction pourrait appeler un service externe pour générer un PDF
      // Pour l'instant, on simule le retour d'une URL
      return `/certificates/${userId}_${challengeId}_${Date.now()}.pdf`;
    } catch (error) {
      logger.error('Erreur lors de la génération du certificat', {
        error: error.message,
        userId,
        challengeId
      });
      
      throw weatherErrorHandler.setProcessingError(
        'Erreur lors de la génération du certificat',
        { originalError: error.message },
        'CERTIFICATE_GENERATION_ERROR'
      );
    }
  }

  /**
   * Récupère le classement pour un challenge
   * @param {String} challengeId - ID du challenge
   * @returns {Promise<Object>} - Classement du challenge
   */
  async getLeaderboard(challengeId) {
    try {
      let leaderboard = await Leaderboard.findOne({ challengeId });
      
      if (!leaderboard) {
        // Si le leaderboard n'existe pas, le créer
        leaderboard = await this.updateLeaderboard(challengeId);
      }
      
      return leaderboard;
    } catch (error) {
      logger.error('Erreur lors de la récupération du classement', {
        error: error.message,
        challengeId
      });
      
      throw weatherErrorHandler.setProcessingError(
        'Erreur lors de la récupération du classement',
        { originalError: error.message },
        'LEADERBOARD_FETCH_ERROR'
      );
    }
  }

  /**
   * Met à jour le classement pour un challenge
   * @param {String} challengeId - ID du challenge
   * @returns {Promise<Object>} - Classement mis à jour
   */
  async updateLeaderboard(challengeId) {
    try {
      // Récupérer tous les utilisateurs ayant participé à ce challenge
      const challenges = await ColChallenge.find({ 
        challengeId, 
        status: { $in: ['in_progress', 'completed'] } 
      });
      
      // Préparer les entrées du leaderboard
      const entries = await Promise.all(challenges.map(async (challenge) => {
        // Pour chaque utilisateur, calculer les métriques de classement
        const totalTime = challenge.cols.reduce((total, col) => {
          if (col.personalBest && col.personalBest.duration) {
            return total + col.personalBest.duration;
          }
          return total;
        }, 0);
        
        // Trouver le col le plus rapide
        let fastestCol = null;
        let fastestTime = Infinity;
        
        challenge.cols.forEach(col => {
          if (col.personalBest && col.personalBest.duration && col.personalBest.duration < fastestTime) {
            fastestTime = col.personalBest.duration;
            fastestCol = {
              colId: col.colId,
              colName: col.colName,
              time: col.personalBest.duration
            };
          }
        });
        
        // Calculer le score total (basé sur les cols complétés et les performances)
        const colsCompleted = challenge.cols.filter(col => col.completed).length;
        const totalPoints = colsCompleted * 100 - (totalTime / 60); // Points de base moins le temps en minutes
        
        return {
          userId: challenge.userId,
          userName: challenge.userId, // À remplacer par le vrai nom d'utilisateur via un service utilisateur
          userAvatar: null, // À remplacer par l'avatar réel
          completionDate: challenge.completionDate,
          totalTime,
          totalPoints,
          colsCompleted,
          fastestCol,
          badges: challenge.badges.map(badge => badge.badgeId),
          rank: 0 // Sera calculé plus tard
        };
      }));
      
      // Trier par nombre de cols complétés puis par temps total
      entries.sort((a, b) => {
        if (b.colsCompleted !== a.colsCompleted) {
          return b.colsCompleted - a.colsCompleted;
        }
        // Si le même nombre de cols est complété, trier par temps (le plus petit d'abord)
        return a.totalTime - b.totalTime;
      });
      
      // Attribuer les rangs
      entries.forEach((entry, index) => {
        entry.rank = index + 1;
      });
      
      // Mettre à jour ou créer le leaderboard
      const leaderboard = await Leaderboard.findOneAndUpdate(
        { challengeId },
        { 
          updatedAt: new Date(),
          entries 
        },
        { new: true, upsert: true }
      );
      
      return leaderboard;
    } catch (error) {
      logger.error('Erreur lors de la mise à jour du classement', {
        error: error.message,
        challengeId
      });
      
      throw weatherErrorHandler.setProcessingError(
        'Erreur lors de la mise à jour du classement',
        { originalError: error.message },
        'LEADERBOARD_UPDATE_ERROR'
      );
    }
  }

  /**
   * Partage la progression d'un challenge sur les réseaux sociaux
   * @param {String} userId - ID de l'utilisateur
   * @param {String} challengeId - ID du challenge
   * @param {Object} shareData - Données de partage
   * @returns {Promise<Object>} - Informations de partage
   */
  async shareOnSocialMedia(userId, challengeId, shareData) {
    try {
      const challenge = await ColChallenge.findOne({ userId, challengeId });
      
      if (!challenge) {
        throw new Error('Challenge non trouvé');
      }
      
      // Ajouter l'entrée de partage
      challenge.sharedOnSocialMedia.push({
        platform: shareData.platform,
        shareDate: new Date(),
        shareUrl: shareData.shareUrl
      });
      
      await challenge.save();
      
      return {
        success: true,
        message: `Challenge partagé sur ${shareData.platform}`,
        shareUrl: shareData.shareUrl
      };
    } catch (error) {
      logger.error('Erreur lors du partage sur les réseaux sociaux', {
        error: error.message,
        userId,
        challengeId
      });
      
      throw weatherErrorHandler.setProcessingError(
        'Erreur lors du partage sur les réseaux sociaux',
        { originalError: error.message },
        'SOCIAL_SHARE_ERROR'
      );
    }
  }

  /**
   * Obtient les détails d'un col pour un challenge
   * @param {String} challengeId - ID du challenge
   * @param {String} colId - ID du col
   * @returns {Promise<Object>} - Détails du col
   */
  async getColDetails(challengeId, colId) {
    try {
      // Récupérer les détails du col à partir de la base de données
      // C'est une information globale, pas spécifique à l'utilisateur
      // Implémentation à compléter selon la structure de la base de données
      
      return {
        colId,
        name: "Col du Grand Ballon",
        altitude: 1424,
        location: {
          lat: 47.9013,
          lon: 7.0958
        },
        description: "Le plus haut sommet des Vosges",
        difficulty: "difficile",
        length: 9.3,
        avgGradient: 6.8,
        maxGradient: 10.2,
        imageUrl: "/images/cols/grand-ballon.jpg",
        sides: [
          {
            name: "Versant Sud (Cernay)",
            difficulty: "difficile",
            length: 20.2,
            avgGradient: 5.4,
            maxGradient: 10.2,
            startAltitude: 320
          },
          {
            name: "Versant Nord (Winstein)",
            difficulty: "très difficile",
            length: 12.8,
            avgGradient: 7.2,
            maxGradient: 12.0,
            startAltitude: 450
          }
        ],
        pointsOfInterest: [
          {
            name: "Radar militaire",
            description: "Point de vue exceptionnel",
            lat: 47.9017,
            lon: 7.0960
          }
        ],
        bestSeasons: ["printemps", "été", "automne"]
      };
    } catch (error) {
      logger.error('Erreur lors de la récupération des détails du col', {
        error: error.message,
        challengeId,
        colId
      });
      
      throw weatherErrorHandler.setProcessingError(
        'Erreur lors de la récupération des détails du col',
        { originalError: error.message },
        'COL_DETAILS_FETCH_ERROR'
      );
    }
  }
}

module.exports = new ColChallengeModel();
