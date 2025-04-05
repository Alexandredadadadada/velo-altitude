/**
 * Contrôleur pour la gestion des challenges de cols
 * @module controllers/col-challenge.controller
 */

const colChallengeModel = require('../models/col-challenge.model');
const logger = require('../utils/logger');
const weatherErrorHandler = require('../utils/error-handler');
const cacheMiddleware = require('../middlewares/cache.middleware');
const { authenticateUser } = require('../middlewares/auth.middleware');
const fs = require('fs').promises;
const path = require('path');
const moment = require('moment');

/**
 * Contrôleur pour la gestion des challenges de cols
 */
class ColChallengeController {
  /**
   * Initialise les routes pour le challenge des cols
   * @param {Object} app - Application Express
   * @param {String} basePath - Chemin de base pour les routes
   */
  initialize(app, basePath = '/api/col-challenges') {
    // Routes authentifiées
    app.get(`${basePath}/user/:userId`, authenticateUser, this.getUserChallenges.bind(this));
    app.get(`${basePath}/:challengeId/user/:userId`, authenticateUser, this.getUserChallenge.bind(this));
    app.post(`${basePath}/:challengeId/user/:userId`, authenticateUser, this.createOrUpdateChallenge.bind(this));
    app.put(`${basePath}/:challengeId/user/:userId/col/:colId`, authenticateUser, this.updateColProgress.bind(this));
    app.post(`${basePath}/:challengeId/user/:userId/col/:colId/effort`, authenticateUser, this.addColEffort.bind(this));
    app.post(`${basePath}/:challengeId/user/:userId/share`, authenticateUser, this.shareOnSocialMedia.bind(this));
    
    // Routes publiques (mise en cache)
    app.get(`${basePath}/:challengeId/leaderboard`, cacheMiddleware.cache('challenge', 15), this.getLeaderboard.bind(this));
    app.get(`${basePath}/:challengeId/col/:colId/details`, cacheMiddleware.cache('challenge', 60), this.getColDetails.bind(this));
    app.get(`${basePath}/available`, cacheMiddleware.cache('challenge', 120), this.getAvailableChallenges.bind(this));
    app.get(`${basePath}/badge/:badgeId`, cacheMiddleware.cache('challenge', 120), this.getBadgeDetails.bind(this));
    app.get(`${basePath}/:challengeId/statistics`, cacheMiddleware.cache('challenge', 30), this.getChallengeStatistics.bind(this));
    
    // Route pour le certificat d'achèvement
    app.get(`${basePath}/:challengeId/user/:userId/certificate`, authenticateUser, this.getCompletionCertificate.bind(this));
    
    logger.info('Routes du challenge des cols initialisées');
  }

  /**
   * Récupère tous les challenges d'un utilisateur
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async getUserChallenges(req, res) {
    try {
      const { userId } = req.params;
      
      // Vérifier que l'utilisateur a accès à ces données
      if (req.user.id !== userId && !req.user.isAdmin) {
        return res.status(403).json({
          status: 'error',
          message: 'Accès non autorisé à ces données'
        });
      }
      
      const challenges = await colChallengeModel.getAllUserChallenges(userId);
      
      return res.status(200).json({
        status: 'success',
        data: challenges
      });
    } catch (error) {
      logger.error('Erreur lors de la récupération des challenges utilisateur', {
        error: error.message,
        stack: error.stack
      });
      
      return weatherErrorHandler.sendErrorResponse(
        res,
        'Erreur lors de la récupération des challenges utilisateur',
        error,
        'CHALLENGES_FETCH_ERROR'
      );
    }
  }

  /**
   * Récupère un challenge spécifique pour un utilisateur
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async getUserChallenge(req, res) {
    try {
      const { userId, challengeId } = req.params;
      
      // Vérifier que l'utilisateur a accès à ces données
      if (req.user.id !== userId && !req.user.isAdmin) {
        return res.status(403).json({
          status: 'error',
          message: 'Accès non autorisé à ces données'
        });
      }
      
      const challenge = await colChallengeModel.getUserChallenge(userId, challengeId);
      
      if (!challenge) {
        return res.status(404).json({
          status: 'error',
          message: 'Challenge non trouvé'
        });
      }
      
      return res.status(200).json({
        status: 'success',
        data: challenge
      });
    } catch (error) {
      logger.error('Erreur lors de la récupération d\'un challenge utilisateur', {
        error: error.message,
        stack: error.stack
      });
      
      return weatherErrorHandler.sendErrorResponse(
        res,
        'Erreur lors de la récupération d\'un challenge utilisateur',
        error,
        'CHALLENGE_FETCH_ERROR'
      );
    }
  }

  /**
   * Crée ou met à jour un challenge pour un utilisateur
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async createOrUpdateChallenge(req, res) {
    try {
      const { userId, challengeId } = req.params;
      const challengeData = req.body;
      
      // Vérifier que l'utilisateur a accès à ces données
      if (req.user.id !== userId && !req.user.isAdmin) {
        return res.status(403).json({
          status: 'error',
          message: 'Accès non autorisé à ces données'
        });
      }
      
      const challenge = await colChallengeModel.createOrUpdateChallenge(
        userId,
        challengeId,
        challengeData
      );
      
      return res.status(200).json({
        status: 'success',
        data: challenge
      });
    } catch (error) {
      logger.error('Erreur lors de la création/mise à jour d\'un challenge', {
        error: error.message,
        stack: error.stack
      });
      
      return weatherErrorHandler.sendErrorResponse(
        res,
        'Erreur lors de la création/mise à jour d\'un challenge',
        error,
        'CHALLENGE_UPDATE_ERROR'
      );
    }
  }

  /**
   * Met à jour la progression d'un col dans un challenge
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async updateColProgress(req, res) {
    try {
      const { userId, challengeId, colId } = req.params;
      const progressData = req.body;
      
      // Vérifier que l'utilisateur a accès à ces données
      if (req.user.id !== userId && !req.user.isAdmin) {
        return res.status(403).json({
          status: 'error',
          message: 'Accès non autorisé à ces données'
        });
      }
      
      const challenge = await colChallengeModel.updateColProgress(
        userId,
        challengeId,
        colId,
        progressData
      );
      
      return res.status(200).json({
        status: 'success',
        data: challenge
      });
    } catch (error) {
      logger.error('Erreur lors de la mise à jour de la progression d\'un col', {
        error: error.message,
        stack: error.stack
      });
      
      return weatherErrorHandler.sendErrorResponse(
        res,
        'Erreur lors de la mise à jour de la progression d\'un col',
        error,
        'COL_PROGRESS_UPDATE_ERROR'
      );
    }
  }

  /**
   * Ajoute un nouvel effort pour un col dans un challenge
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async addColEffort(req, res) {
    try {
      const { userId, challengeId, colId } = req.params;
      const effortData = req.body;
      
      // Vérifier que l'utilisateur a accès à ces données
      if (req.user.id !== userId && !req.user.isAdmin) {
        return res.status(403).json({
          status: 'error',
          message: 'Accès non autorisé à ces données'
        });
      }
      
      const challenge = await colChallengeModel.addColEffort(
        userId,
        challengeId,
        colId,
        effortData
      );
      
      return res.status(200).json({
        status: 'success',
        data: challenge,
        message: 'Nouvel effort ajouté avec succès'
      });
    } catch (error) {
      logger.error('Erreur lors de l\'ajout d\'un effort pour un col', {
        error: error.message,
        stack: error.stack
      });
      
      return weatherErrorHandler.sendErrorResponse(
        res,
        'Erreur lors de l\'ajout d\'un effort pour un col',
        error,
        'COL_EFFORT_ADD_ERROR'
      );
    }
  }

  /**
   * Récupère le classement pour un challenge
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async getLeaderboard(req, res) {
    try {
      const { challengeId } = req.params;
      
      const leaderboard = await colChallengeModel.getLeaderboard(challengeId);
      
      return res.status(200).json({
        status: 'success',
        data: leaderboard,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Erreur lors de la récupération du classement', {
        error: error.message,
        stack: error.stack
      });
      
      return weatherErrorHandler.sendErrorResponse(
        res,
        'Erreur lors de la récupération du classement',
        error,
        'LEADERBOARD_FETCH_ERROR'
      );
    }
  }

  /**
   * Récupère les détails d'un col
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async getColDetails(req, res) {
    try {
      const { challengeId, colId } = req.params;
      
      const colDetails = await colChallengeModel.getColDetails(challengeId, colId);
      
      if (!colDetails) {
        return res.status(404).json({
          status: 'error',
          message: 'Détails du col non trouvés'
        });
      }
      
      return res.status(200).json({
        status: 'success',
        data: colDetails
      });
    } catch (error) {
      logger.error('Erreur lors de la récupération des détails du col', {
        error: error.message,
        stack: error.stack
      });
      
      return weatherErrorHandler.sendErrorResponse(
        res,
        'Erreur lors de la récupération des détails du col',
        error,
        'COL_DETAILS_FETCH_ERROR'
      );
    }
  }

  /**
   * Récupère la liste des challenges disponibles
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async getAvailableChallenges(req, res) {
    try {
      // Données statiques pour les challenges disponibles
      // Dans une implémentation réelle, ces données viendraient d'une base de données
      const challenges = [
        {
          id: 'grand-est-7-cols',
          name: 'Les 7 Cols Majeurs du Grand Est',
          description: 'Gravissez les sept cols les plus emblématiques de la région Grand Est',
          difficulty: 'difficile',
          colsCount: 7,
          estimatedCompletionTime: '3 mois',
          thumbnail: '/images/challenges/7-cols-grand-est.jpg',
          badges: [
            {
              id: 'first-col',
              name: 'Premier Sommet',
              description: 'Gravir votre premier col du challenge',
              image: '/images/badges/first-col.png'
            },
            {
              id: 'half-way',
              name: 'À mi-chemin',
              description: 'Atteindre la moitié du challenge',
              image: '/images/badges/half-way.png'
            },
            {
              id: 'grand-est-master',
              name: 'Maître des Sommets',
              description: 'Compléter l\'intégralité du challenge',
              image: '/images/badges/grand-est-master.png'
            }
          ],
          cols: [
            {
              id: 'grand-ballon',
              name: 'Col du Grand Ballon',
              altitude: 1424,
              difficulty: 'difficile'
            },
            {
              id: 'ballon-alsace',
              name: 'Ballon d\'Alsace',
              altitude: 1247,
              difficulty: 'modéré'
            },
            {
              id: 'col-bonhomme',
              name: 'Col du Bonhomme',
              altitude: 949,
              difficulty: 'facile'
            },
            {
              id: 'col-schlucht',
              name: 'Col de la Schlucht',
              altitude: 1139,
              difficulty: 'modéré'
            },
            {
              id: 'col-hohneck',
              name: 'Col du Hohneck',
              altitude: 1363,
              difficulty: 'difficile'
            },
            {
              id: 'col-bussang',
              name: 'Col de Bussang',
              altitude: 731,
              difficulty: 'facile'
            },
            {
              id: 'col-firstplan',
              name: 'Col du Firstplan',
              altitude: 722,
              difficulty: 'modéré'
            }
          ]
        },
        {
          id: 'vosges-challenge',
          name: 'Tour des Vosges',
          description: 'Un parcours légendaire à travers les plus beaux paysages des Vosges',
          difficulty: 'très difficile',
          colsCount: 5,
          estimatedCompletionTime: '2 mois',
          thumbnail: '/images/challenges/vosges-challenge.jpg',
          badges: [
            {
              id: 'vosges-explorer',
              name: 'Explorateur des Vosges',
              description: 'Débuter le challenge Tour des Vosges',
              image: '/images/badges/vosges-explorer.png'
            },
            {
              id: 'vosges-master',
              name: 'Maître des Vosges',
              description: 'Compléter le challenge Tour des Vosges',
              image: '/images/badges/vosges-master.png'
            }
          ],
          cols: [
            {
              id: 'col-schlucht',
              name: 'Col de la Schlucht',
              altitude: 1139,
              difficulty: 'modéré'
            },
            {
              id: 'col-hohneck',
              name: 'Col du Hohneck',
              altitude: 1363,
              difficulty: 'difficile'
            },
            {
              id: 'grand-ballon',
              name: 'Col du Grand Ballon',
              altitude: 1424,
              difficulty: 'difficile'
            },
            {
              id: 'col-amic',
              name: 'Col Amic',
              altitude: 825,
              difficulty: 'modéré'
            },
            {
              id: 'petit-ballon',
              name: 'Petit Ballon',
              altitude: 1272,
              difficulty: 'difficile'
            }
          ]
        }
      ];
      
      return res.status(200).json({
        status: 'success',
        data: challenges
      });
    } catch (error) {
      logger.error('Erreur lors de la récupération des challenges disponibles', {
        error: error.message,
        stack: error.stack
      });
      
      return weatherErrorHandler.sendErrorResponse(
        res,
        'Erreur lors de la récupération des challenges disponibles',
        error,
        'AVAILABLE_CHALLENGES_FETCH_ERROR'
      );
    }
  }

  /**
   * Récupère les détails d'un badge
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async getBadgeDetails(req, res) {
    try {
      const { badgeId } = req.params;
      
      // Données statiques pour les badges
      // Dans une implémentation réelle, ces données viendraient d'une base de données
      const badges = {
        'first-col': {
          id: 'first-col',
          name: 'Premier Sommet',
          description: 'Ce badge récompense votre premier col gravi dans le cadre du challenge',
          image: '/images/badges/first-col.png',
          criteria: 'Gravir votre premier col du challenge',
          rarity: 'commun',
          pointsValue: 100
        },
        'half-way': {
          id: 'half-way',
          name: 'À mi-chemin',
          description: 'Vous avez atteint la moitié du challenge, continuez sur votre lancée !',
          image: '/images/badges/half-way.png',
          criteria: 'Compléter 50% des cols du challenge',
          rarity: 'rare',
          pointsValue: 300
        },
        'grand-est-master': {
          id: 'grand-est-master',
          name: 'Maître des Sommets',
          description: 'Vous avez conquis tous les cols majeurs du Grand Est. Félicitations pour cet exploit !',
          image: '/images/badges/grand-est-master.png',
          criteria: 'Compléter 100% des cols du challenge',
          rarity: 'épique',
          pointsValue: 1000
        },
        'vosges-explorer': {
          id: 'vosges-explorer',
          name: 'Explorateur des Vosges',
          description: 'Vous avez commencé à explorer les magnifiques cols des Vosges',
          image: '/images/badges/vosges-explorer.png',
          criteria: 'Compléter au moins un col du challenge Tour des Vosges',
          rarity: 'commun',
          pointsValue: 100
        },
        'vosges-master': {
          id: 'vosges-master',
          name: 'Maître des Vosges',
          description: 'Vous avez maîtrisé tous les cols du Tour des Vosges. Une performance remarquable !',
          image: '/images/badges/vosges-master.png',
          criteria: 'Compléter tous les cols du challenge Tour des Vosges',
          rarity: 'épique',
          pointsValue: 800
        }
      };
      
      const badge = badges[badgeId];
      
      if (!badge) {
        return res.status(404).json({
          status: 'error',
          message: 'Badge non trouvé'
        });
      }
      
      return res.status(200).json({
        status: 'success',
        data: badge
      });
    } catch (error) {
      logger.error('Erreur lors de la récupération des détails du badge', {
        error: error.message,
        stack: error.stack
      });
      
      return weatherErrorHandler.sendErrorResponse(
        res,
        'Erreur lors de la récupération des détails du badge',
        error,
        'BADGE_DETAILS_FETCH_ERROR'
      );
    }
  }

  /**
   * Récupère les statistiques globales d'un challenge
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async getChallengeStatistics(req, res) {
    try {
      const { challengeId } = req.params;
      
      // Dans une implémentation réelle, ces statistiques seraient calculées à partir de la base de données
      const statistics = {
        totalParticipants: 325,
        completionRate: 42, // pourcentage
        averageCompletionTime: 45, // jours
        mostPopularCol: {
          id: 'col-schlucht',
          name: 'Col de la Schlucht',
          completionCount: 287
        },
        hardestCol: {
          id: 'grand-ballon',
          name: 'Col du Grand Ballon',
          completionRate: 68, // pourcentage
          averageTime: 95 // minutes
        },
        recentCompletions: 12, // dernières 24h
        badgesAwarded: 753,
        topPerformers: [
          {
            userId: 'user123',
            userName: 'Thomas L.',
            completionTime: 32, // jours
            colsCompleted: 7
          },
          {
            userId: 'user456',
            userName: 'Marie D.',
            completionTime: 38, // jours
            colsCompleted: 7
          },
          {
            userId: 'user789',
            userName: 'Jean M.',
            completionTime: 40, // jours
            colsCompleted: 7
          }
        ]
      };
      
      return res.status(200).json({
        status: 'success',
        data: statistics
      });
    } catch (error) {
      logger.error('Erreur lors de la récupération des statistiques du challenge', {
        error: error.message,
        stack: error.stack
      });
      
      return weatherErrorHandler.sendErrorResponse(
        res,
        'Erreur lors de la récupération des statistiques du challenge',
        error,
        'CHALLENGE_STATISTICS_FETCH_ERROR'
      );
    }
  }

  /**
   * Partage la progression d'un challenge sur les réseaux sociaux
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async shareOnSocialMedia(req, res) {
    try {
      const { userId, challengeId } = req.params;
      const shareData = req.body;
      
      // Vérifier que l'utilisateur a accès à ces données
      if (req.user.id !== userId && !req.user.isAdmin) {
        return res.status(403).json({
          status: 'error',
          message: 'Accès non autorisé à ces données'
        });
      }
      
      const result = await colChallengeModel.shareOnSocialMedia(userId, challengeId, shareData);
      
      return res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      logger.error('Erreur lors du partage sur les réseaux sociaux', {
        error: error.message,
        stack: error.stack
      });
      
      return weatherErrorHandler.sendErrorResponse(
        res,
        'Erreur lors du partage sur les réseaux sociaux',
        error,
        'SOCIAL_SHARE_ERROR'
      );
    }
  }

  /**
   * Récupère le certificat d'achèvement d'un challenge
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async getCompletionCertificate(req, res) {
    try {
      const { userId, challengeId } = req.params;
      
      // Vérifier que l'utilisateur a accès à ces données
      if (req.user.id !== userId && !req.user.isAdmin) {
        return res.status(403).json({
          status: 'error',
          message: 'Accès non autorisé à ces données'
        });
      }
      
      // Récupérer le challenge pour vérifier s'il est complété
      const challenge = await colChallengeModel.getUserChallenge(userId, challengeId);
      
      if (!challenge) {
        return res.status(404).json({
          status: 'error',
          message: 'Challenge non trouvé'
        });
      }
      
      if (challenge.status !== 'completed') {
        return res.status(400).json({
          status: 'error',
          message: 'Le challenge n\'est pas encore complété'
        });
      }
      
      // Pour l'instant, on génère un certificat basique en HTML
      // Une implémentation réelle pourrait générer un PDF
      const certificateHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Certificat d'Achèvement</title>
  <style>
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      border: 20px solid #3498db;
      background-color: #f9f9f9;
    }
    .certificate {
      text-align: center;
      padding: 40px;
    }
    .title {
      font-size: 36px;
      color: #2c3e50;
      margin-bottom: 20px;
      font-weight: bold;
    }
    .subtitle {
      font-size: 24px;
      color: #3498db;
      margin-bottom: 40px;
    }
    .name {
      font-size: 30px;
      margin: 30px 0;
      color: #e74c3c;
      border-bottom: 2px solid #e74c3c;
      display: inline-block;
      padding: 0 20px 5px;
    }
    .description {
      font-size: 18px;
      margin: 20px 0 40px;
      line-height: 1.6;
    }
    .date {
      font-size: 18px;
      margin-top: 50px;
    }
    .signature {
      margin-top: 50px;
      font-style: italic;
    }
    .logo {
      width: 200px;
      margin-bottom: 20px;
    }
    .cols-list {
      margin: 30px auto;
      width: 80%;
      text-align: left;
    }
    .cols-list li {
      padding: 8px 0;
      font-size: 16px;
    }
  </style>
</head>
<body>
  <div class="certificate">
    <img src="/images/logo-grand-est-cyclisme.png" alt="Logo Grand Est Cyclisme" class="logo">
    <div class="title">Certificat d'Achèvement</div>
    <div class="subtitle">${challenge.challengeName}</div>
    
    <p>Ce certificat atteste que</p>
    <div class="name">${userId}</div>
    <p>a relevé avec succès le défi des</p>
    <div class="subtitle">${challenge.challengeName}</div>
    
    <div class="description">
      En gravissant les cols suivants :
      <ul class="cols-list">
        ${challenge.cols.map(col => `<li>${col.colName} (${col.completionDate ? moment(col.completionDate).format('DD/MM/YYYY') : 'Date inconnue'})</li>`).join('')}
      </ul>
    </div>
    
    <div class="date">Achevé le ${moment(challenge.completionDate).format('DD MMMM YYYY')}</div>
    
    <div class="signature">
      <p>Grand Est Cyclisme</p>
      <p>La référence du cyclisme dans le Grand Est</p>
    </div>
  </div>
</body>
</html>`;
      
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(certificateHtml);
    } catch (error) {
      logger.error('Erreur lors de la récupération du certificat', {
        error: error.message,
        stack: error.stack
      });
      
      return weatherErrorHandler.sendErrorResponse(
        res,
        'Erreur lors de la récupération du certificat',
        error,
        'CERTIFICATE_FETCH_ERROR'
      );
    }
  }
}

module.exports = new ColChallengeController();
