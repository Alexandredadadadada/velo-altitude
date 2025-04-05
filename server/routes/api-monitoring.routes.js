/**
 * Routes pour le monitoring des API
 * Permet d'accéder aux statistiques, statuts et contrôles des services API
 */
const express = require('express');
const router = express.Router();

// Services
const stravaTokenService = require('../services/strava-token.service');
const apiQuotaManager = require('../services/api-quota-manager');
const weatherNotificationService = require('../services/weather-notification.service');
const stravaDataRefreshService = require('../services/strava-data-refresh.service');
const apiManager = require('../services/api-manager.service');

// Middlewares
const { isAuthenticated, isAdmin } = require('../middleware/auth.middleware');

/**
 * Récupère le statut global du système de monitoring
 * GET /api/monitoring/status
 */
router.get('/status', isAuthenticated, isAdmin, (req, res) => {
  try {
    // Récupérer le statut de chaque service
    const stravaTokenStatus = stravaTokenService.getStatus();
    const apiQuotaStatus = apiQuotaManager.getUsageStatistics();
    const weatherStatus = weatherNotificationService.getStatus();
    const stravaDataRefreshStatus = stravaDataRefreshService.getStatus();
    
    // Construire la réponse
    const status = {
      timestamp: new Date().toISOString(),
      services: {
        stravaToken: {
          status: stravaTokenStatus.accessTokenStatus.isExpired ? 'warning' : 
                 !stravaTokenStatus.isConfigured ? 'error' : 'healthy',
          details: stravaTokenStatus
        },
        apiQuota: {
          status: 'healthy', // Par défaut, sera mis à jour ci-dessous
          details: apiQuotaStatus
        },
        weatherNotification: {
          status: weatherStatus.active ? 'healthy' : 'inactive',
          details: weatherStatus
        },
        stravaDataRefresh: {
          status: 'healthy', // Par défaut, sera mis à jour ci-dessous
          details: stravaDataRefreshStatus
        }
      }
    };
    
    // Vérifier les quotas pour déterminer le statut
    Object.entries(apiQuotaStatus).forEach(([apiName, stats]) => {
      if (stats.quotaUsage) {
        const dayPercentage = parseFloat(stats.quotaUsage.day.percentage);
        const fifteenMinPercentage = parseFloat(stats.quotaUsage.fifteenMin.percentage);
        
        if (dayPercentage > 90 || fifteenMinPercentage > 90) {
          status.services.apiQuota.status = 'critical';
        } else if (dayPercentage > 75 || fifteenMinPercentage > 75) {
          status.services.apiQuota.status = 'warning';
        }
      }
    });
    
    // Vérifier les erreurs dans le rafraîchissement de données
    const refreshStatusItems = stravaDataRefreshStatus.status;
    const hasErrors = Object.values(refreshStatusItems).some(item => item.error);
    const allInactive = Object.values(refreshStatusItems).every(item => item.lastRefresh === null);
    
    if (hasErrors) {
      status.services.stravaDataRefresh.status = 'error';
    } else if (allInactive) {
      status.services.stravaDataRefresh.status = 'inactive';
    }
    
    res.json(status);
  } catch (error) {
    res.status(500).json({
      error: 'Erreur lors de la récupération du statut',
      message: error.message
    });
  }
});

/**
 * Récupère les statistiques d'utilisation des API
 * GET /api/monitoring/statistics
 */
router.get('/statistics', isAuthenticated, isAdmin, (req, res) => {
  try {
    const statistics = apiQuotaManager.getUsageStatistics();
    res.json(statistics);
  } catch (error) {
    res.status(500).json({
      error: 'Erreur lors de la récupération des statistiques',
      message: error.message
    });
  }
});

/**
 * Force le rafraîchissement d'un token Strava
 * POST /api/monitoring/strava/refresh-token
 */
router.post('/strava/refresh-token', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const accessToken = await stravaTokenService.refreshTokenIfNeeded();
    const status = stravaTokenService.getStatus();
    
    res.json({
      success: true,
      message: 'Token Strava rafraîchi avec succès',
      status
    });
  } catch (error) {
    res.status(500).json({
      error: 'Erreur lors du rafraîchissement du token',
      message: error.message
    });
  }
});

/**
 * Force le rafraîchissement des données Strava
 * POST /api/monitoring/strava/refresh-data
 */
router.post('/strava/refresh-data', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { dataType = 'activities' } = req.body;
    
    const result = await stravaDataRefreshService.forceRefresh(dataType);
    const status = stravaDataRefreshService.getStatus();
    
    res.json({
      success: result,
      message: result ? 
        `Données Strava (${dataType}) rafraîchies avec succès` : 
        `Échec du rafraîchissement des données Strava (${dataType})`,
      status
    });
  } catch (error) {
    res.status(500).json({
      error: 'Erreur lors du rafraîchissement des données',
      message: error.message
    });
  }
});

/**
 * Met à jour la configuration des quotas d'API
 * PUT /api/monitoring/quotas
 */
router.put('/quotas', isAuthenticated, isAdmin, (req, res) => {
  try {
    const { apiName, config } = req.body;
    
    if (!apiName || !config) {
      return res.status(400).json({
        error: 'Paramètres invalides',
        message: 'Le nom de l\'API et la configuration sont requis'
      });
    }
    
    const updatedConfig = apiQuotaManager.updateQuotaConfig(apiName, config);
    
    res.json({
      success: true,
      message: `Configuration des quotas pour ${apiName} mise à jour`,
      config: updatedConfig
    });
  } catch (error) {
    res.status(500).json({
      error: 'Erreur lors de la mise à jour de la configuration',
      message: error.message
    });
  }
});

/**
 * Ajoute un emplacement à surveiller pour les notifications météo
 * POST /api/monitoring/weather/locations
 */
router.post('/weather/locations', isAuthenticated, isAdmin, (req, res) => {
  try {
    const { city, lat, lon } = req.body;
    
    if ((!city && (!lat || !lon)) || (city && (lat || lon))) {
      return res.status(400).json({
        error: 'Paramètres invalides',
        message: 'Fournir soit city, soit lat et lon'
      });
    }
    
    const location = city ? { city } : { lat, lon };
    const result = weatherNotificationService.addLocation(location);
    
    if (result) {
      res.json({
        success: true,
        message: `Emplacement ${city || `${lat},${lon}`} ajouté à la surveillance météo`,
        status: weatherNotificationService.getStatus()
      });
    } else {
      res.status(400).json({
        error: 'Emplacement déjà surveillé',
        message: `L'emplacement ${city || `${lat},${lon}`} est déjà sous surveillance`
      });
    }
  } catch (error) {
    res.status(500).json({
      error: 'Erreur lors de l\'ajout de l\'emplacement',
      message: error.message
    });
  }
});

/**
 * Abonne un utilisateur aux notifications météo
 * POST /api/monitoring/weather/subscribe
 */
router.post('/weather/subscribe', isAuthenticated, (req, res) => {
  try {
    const userId = req.user.id;
    const preferences = req.body;
    
    const subscription = weatherNotificationService.subscribeUser(userId, preferences);
    
    res.json({
      success: true,
      message: 'Abonnement aux notifications météo effectué',
      subscription
    });
  } catch (error) {
    res.status(500).json({
      error: 'Erreur lors de l\'abonnement',
      message: error.message
    });
  }
});

/**
 * Récupère les métriques de performance pour tous les services API
 * GET /api/monitoring/api-metrics
 */
router.get('/api-metrics', isAuthenticated, isAdmin, (req, res) => {
  try {
    const metrics = apiManager.getAllMetrics();
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      metrics
    });
  } catch (error) {
    res.status(500).json({
      error: 'Erreur lors de la récupération des métriques',
      message: error.message
    });
  }
});

/**
 * Récupère les métriques pour un service API spécifique
 * GET /api/monitoring/api-metrics/:serviceName
 */
router.get('/api-metrics/:serviceName', isAuthenticated, isAdmin, (req, res) => {
  try {
    const { serviceName } = req.params;
    const metrics = apiManager.getServiceMetrics(serviceName);
    
    if (!metrics) {
      return res.status(404).json({
        error: 'Service introuvable',
        message: `Le service "${serviceName}" n'existe pas ou n'a pas de métriques disponibles`
      });
    }
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      serviceName,
      metrics
    });
  } catch (error) {
    res.status(500).json({
      error: 'Erreur lors de la récupération des métriques',
      message: error.message
    });
  }
});

/**
 * Réinitialise les métriques de performance des services API
 * POST /api/monitoring/reset-metrics
 */
router.post('/reset-metrics', isAuthenticated, isAdmin, (req, res) => {
  try {
    const { serviceName } = req.body;
    
    apiManager.resetMetrics(serviceName);
    
    res.json({
      success: true,
      message: serviceName 
        ? `Métriques réinitialisées pour le service ${serviceName}` 
        : 'Toutes les métriques ont été réinitialisées'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Erreur lors de la réinitialisation des métriques',
      message: error.message
    });
  }
});

module.exports = router;
