/**
 * Contrôleur pour la gestion des tokens Strava
 * Expose les fonctionnalités d'administration et diagnostiques pour les tokens
 */

const stravaTokenService = require('../services/strava-token.service');
const { authenticateAdmin } = require('../middleware/auth.middleware');

class StravaTokenController {
  /**
   * Récupère le statut des tokens Strava
   * @param {object} req - Requête Express
   * @param {object} res - Réponse Express
   */
  async getTokenStatus(req, res) {
    try {
      const tokenStatus = await stravaTokenService.getStatus();
      
      // Masquer les informations sensibles pour les utilisateurs non-admin
      if (!req.user?.isAdmin) {
        delete tokenStatus.clientCredentialsStatus;
        if (tokenStatus.refreshTokenStatus) {
          tokenStatus.refreshTokenStatus = {
            isAvailable: tokenStatus.refreshTokenStatus.isAvailable
          };
        }
      }
      
      res.json({
        success: true,
        data: tokenStatus
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du statut des tokens Strava:', error);
      res.status(500).json({
        success: false,
        error: 'Impossible de récupérer le statut des tokens Strava'
      });
    }
  }

  /**
   * Force le rafraîchissement du token Strava (admin uniquement)
   * @param {object} req - Requête Express
   * @param {object} res - Réponse Express
   */
  async forceRefreshToken(req, res) {
    try {
      // Cette route nécessite d'être authentifié en tant qu'admin
      if (!req.user?.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Accès refusé. Privilèges d\'administrateur requis.'
        });
      }
      
      const startTime = Date.now();
      const newToken = await stravaTokenService.refreshTokenIfNeeded(true);
      const refreshTime = Date.now() - startTime;
      
      const tokenStatus = await stravaTokenService.getStatus();
      
      res.json({
        success: true,
        message: 'Token Strava rafraîchi avec succès',
        data: {
          tokenRefreshed: !!newToken,
          refreshTimeMs: refreshTime,
          tokenStatus
        }
      });
    } catch (error) {
      console.error('Erreur lors du rafraîchissement forcé du token Strava:', error);
      res.status(500).json({
        success: false,
        error: 'Échec du rafraîchissement forcé du token Strava'
      });
    }
  }

  /**
   * Vide le cache des tokens Strava (admin uniquement)
   * @param {object} req - Requête Express
   * @param {object} res - Réponse Express
   */
  async clearTokenCache(req, res) {
    try {
      // Cette route nécessite d'être authentifié en tant qu'admin
      if (!req.user?.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Accès refusé. Privilèges d\'administrateur requis.'
        });
      }
      
      // Supprimer les clés de cache associées aux tokens
      await Promise.all([
        stravaTokenService.clearCache('TOKEN'),
        stravaTokenService.clearCache('REFRESH_STATUS')
      ]);
      
      res.json({
        success: true,
        message: 'Cache des tokens Strava vidé avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de la suppression du cache des tokens Strava:', error);
      res.status(500).json({
        success: false,
        error: 'Échec de la suppression du cache des tokens Strava'
      });
    }
  }

  /**
   * Vérifie l'état de santé de l'intégration Strava
   * @param {object} req - Requête Express
   * @param {object} res - Réponse Express
   */
  async checkHealth(req, res) {
    try {
      const tokenStatus = await stravaTokenService.getStatus();
      
      // Déterminer l'état de santé global
      const health = {
        status: 'healthy',
        issues: []
      };
      
      // Vérifier si les tokens sont disponibles
      if (!tokenStatus.isConfigured) {
        health.status = 'critical';
        health.issues.push('Configuration Strava incomplète');
      }
      
      // Vérifier si le token d'accès est expiré
      if (tokenStatus.accessTokenStatus.isExpired) {
        if (tokenStatus.refreshState.tokenRefreshAttempts > 2) {
          health.status = 'critical';
          health.issues.push('Token expiré avec échecs multiples de rafraîchissement');
        } else {
          health.status = 'warning';
          health.issues.push('Token expiré, en attente de rafraîchissement');
        }
      }
      
      // Vérifier l'utilisation du quota API
      if (tokenStatus.apiQuotaUsage.day && tokenStatus.apiQuotaUsage.day.percentage > 80) {
        health.status = health.status === 'healthy' ? 'warning' : health.status;
        health.issues.push(`Quota API journalier élevé (${tokenStatus.apiQuotaUsage.day.percentage}%)`);
      }
      
      if (tokenStatus.apiQuotaUsage.fifteenMin && tokenStatus.apiQuotaUsage.fifteenMin.percentage > 90) {
        health.status = 'critical';
        health.issues.push(`Quota API 15 min critique (${tokenStatus.apiQuotaUsage.fifteenMin.percentage}%)`);
      }
      
      res.json({
        success: true,
        data: {
          health,
          tokenStatus: {
            isConfigured: tokenStatus.isConfigured,
            accessTokenValid: !tokenStatus.accessTokenStatus.isExpired,
            timeUntilExpiration: tokenStatus.accessTokenStatus.formattedExpiration,
            tokenCheckerActive: tokenStatus.tokenCheckerActive,
            apiQuotaPercentage: {
              day: tokenStatus.apiQuotaUsage.day?.percentage || '0',
              fifteenMin: tokenStatus.apiQuotaUsage.fifteenMin?.percentage || '0'
            }
          }
        }
      });
    } catch (error) {
      console.error('Erreur lors de la vérification de santé Strava:', error);
      res.status(500).json({
        success: false,
        error: 'Impossible de vérifier l\'état de santé de l\'intégration Strava'
      });
    }
  }
}

module.exports = new StravaTokenController();
