// strava.controller.js - Contrôleur pour les interactions avec l'API Strava
const stravaService = require('../services/strava.service');

class StravaController {
  /**
   * Redirige l'utilisateur vers l'URL d'autorisation Strava
   * @param {object} req - Requête Express
   * @param {object} res - Réponse Express
   */
  async initiateAuth(req, res) {
    try {
      const authUrl = stravaService.getAuthorizationUrl();
      res.redirect(authUrl);
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de l\'auth Strava:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur lors de l\'initialisation de l\'authentification Strava' 
      });
    }
  }

  /**
   * Gère le callback d'autorisation Strava
   * @param {object} req - Requête Express
   * @param {object} res - Réponse Express
   */
  async handleCallback(req, res) {
    try {
      const { code } = req.query;
      
      if (!code) {
        return res.status(400).json({ 
          success: false, 
          error: 'Code d\'autorisation manquant' 
        });
      }

      const tokenData = await stravaService.exchangeCodeForToken(code);
      
      // Stockage des données de token dans la session
      req.session.stravaTokens = {
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        expiresAt: tokenData.expiresAt
      };
      
      req.session.stravaAthlete = tokenData.athlete;
      
      // Redirection vers la page de profil ou d'accueil
      res.redirect('/profile');
    } catch (error) {
      console.error('Erreur lors du traitement du callback Strava:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Échec de l\'authentification avec Strava' 
      });
    }
  }

  /**
   * Récupère et retourne les activités de l'utilisateur
   * @param {object} req - Requête Express
   * @param {object} res - Réponse Express
   */
  async getActivities(req, res) {
    try {
      const { page = 1, per_page = 10 } = req.query;
      
      // Vérification de l'authentification Strava
      if (!req.session.stravaTokens) {
        return res.status(401).json({ 
          success: false, 
          error: 'Non authentifié avec Strava' 
        });
      }

      // Vérification et rafraîchissement du token si nécessaire
      await this._ensureValidToken(req);
      
      const activities = await stravaService.getActivities(
        req.session.stravaTokens.accessToken,
        parseInt(page),
        parseInt(per_page)
      );
      
      res.json({ 
        success: true, 
        data: activities 
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des activités:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Échec de la récupération des activités Strava' 
      });
    }
  }

  /**
   * Récupère les détails d'une activité spécifique
   * @param {object} req - Requête Express
   * @param {object} res - Réponse Express
   */
  async getActivityDetails(req, res) {
    try {
      const { activityId } = req.params;
      
      // Vérification de l'authentification Strava
      if (!req.session.stravaTokens) {
        return res.status(401).json({ 
          success: false, 
          error: 'Non authentifié avec Strava' 
        });
      }

      // Vérification et rafraîchissement du token si nécessaire
      await this._ensureValidToken(req);
      
      const activityDetails = await stravaService.getActivityDetails(
        req.session.stravaTokens.accessToken,
        activityId
      );
      
      res.json({ 
        success: true, 
        data: activityDetails 
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des détails de l\'activité:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Échec de la récupération des détails de l\'activité Strava' 
      });
    }
  }

  /**
   * Récupère les statistiques de l'athlète
   * @param {object} req - Requête Express
   * @param {object} res - Réponse Express
   */
  async getAthleteStats(req, res) {
    try {
      // Vérification de l'authentification Strava
      if (!req.session.stravaTokens || !req.session.stravaAthlete) {
        return res.status(401).json({ 
          success: false, 
          error: 'Non authentifié avec Strava' 
        });
      }

      // Vérification et rafraîchissement du token si nécessaire
      await this._ensureValidToken(req);
      
      const athleteStats = await stravaService.getAthleteStats(
        req.session.stravaTokens.accessToken,
        req.session.stravaAthlete.id
      );
      
      res.json({ 
        success: true, 
        data: athleteStats 
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques athlète:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Échec de la récupération des statistiques Strava' 
      });
    }
  }

  /**
   * Déconnecte l'utilisateur de Strava
   * @param {object} req - Requête Express
   * @param {object} res - Réponse Express
   */
  async logout(req, res) {
    try {
      // Suppression des données Strava de la session
      delete req.session.stravaTokens;
      delete req.session.stravaAthlete;
      
      res.json({ 
        success: true, 
        message: 'Déconnecté de Strava avec succès' 
      });
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Échec de la déconnexion de Strava' 
      });
    }
  }

  /**
   * Vérifie et rafraîchit le token Strava si nécessaire
   * @param {object} req - Requête Express
   * @private
   */
  async _ensureValidToken(req) {
    const now = Math.floor(Date.now() / 1000);
    
    // Si le token est expiré ou va expirer dans les 10 minutes
    if (req.session.stravaTokens.expiresAt < now + 600) {
      try {
        const refreshedTokens = await stravaService.refreshAccessToken(
          req.session.stravaTokens.refreshToken
        );
        
        // Mise à jour des tokens dans la session
        req.session.stravaTokens = {
          accessToken: refreshedTokens.accessToken,
          refreshToken: refreshedTokens.refreshToken,
          expiresAt: refreshedTokens.expiresAt
        };
      } catch (error) {
        console.error('Erreur lors du rafraîchissement du token Strava:', error);
        throw new Error('Échec du rafraîchissement du token Strava');
      }
    }
  }
}

module.exports = new StravaController();
