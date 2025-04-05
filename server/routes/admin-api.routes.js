/**
 * Routes d'administration pour la surveillance des API
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const apiQuotaMonitor = require('../services/api-quota-monitor.service');
const { authenticateJWT, isAdmin } = require('../middleware/auth.middleware');

// Middleware d'authentification et de vérification du rôle admin
router.use(authenticateJWT, isAdmin);

/**
 * @route GET /api/admin/dashboard
 * @desc Obtenir les données pour le tableau de bord administrateur
 * @access Admin
 */
router.get('/dashboard', async (req, res) => {
  try {
    // Récupérer les statistiques d'API
    const apiStatus = apiQuotaMonitor.getApiQuotaStatus();
    
    // Récupérer les dernières alertes (10 maximum)
    const alerts = await getLatestAlerts(10);
    
    // Récupérer les statistiques d'utilisation
    const usageStats = await getApiUsageStats();
    
    res.json({
      apiStatus,
      alerts,
      usageStats,
      serverStatus: {
        uptime: Math.floor(process.uptime()),
        memoryUsage: process.memoryUsage(),
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des données du tableau de bord:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des données du tableau de bord' });
  }
});

/**
 * @route GET /api/admin/api-status
 * @desc Obtenir l'état de toutes les API
 * @access Admin
 */
router.get('/api-status', (req, res) => {
  try {
    const apiStatus = apiQuotaMonitor.getApiQuotaStatus();
    res.json(apiStatus);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'état des API:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'état des API' });
  }
});

/**
 * @route GET /api/admin/alerts
 * @desc Obtenir les alertes de quota
 * @access Admin
 */
router.get('/alerts', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const alerts = await getLatestAlerts(limit);
    res.json(alerts);
  } catch (error) {
    console.error('Erreur lors de la récupération des alertes:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des alertes' });
  }
});

/**
 * @route POST /api/admin/check-quotas
 * @desc Forcer une vérification des quotas API
 * @access Admin
 */
router.post('/check-quotas', async (req, res) => {
  try {
    await apiQuotaMonitor.checkAllApiQuotas();
    const apiStatus = apiQuotaMonitor.getApiQuotaStatus();
    res.json({
      message: 'Vérification des quotas effectuée avec succès',
      apiStatus
    });
  } catch (error) {
    console.error('Erreur lors de la vérification des quotas:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification des quotas' });
  }
});

/**
 * @route GET /api/admin/usage-stats
 * @desc Obtenir les statistiques d'utilisation des API
 * @access Admin
 */
router.get('/usage-stats', async (req, res) => {
  try {
    const usageStats = await getApiUsageStats();
    res.json(usageStats);
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques d\'utilisation:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques d\'utilisation' });
  }
});

/**
 * Récupère les dernières alertes à partir du fichier de log
 * @param {number} limit - Nombre maximum d'alertes à retourner
 * @returns {Promise<Array>} - Tableau d'alertes
 */
async function getLatestAlerts(limit) {
  try {
    const alertLogPath = path.resolve(process.cwd(), 'logs/api-alerts.log');
    
    if (!fs.existsSync(alertLogPath)) {
      return [];
    }
    
    const content = fs.readFileSync(alertLogPath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    // Prendre les dernières lignes
    const latestLines = lines.slice(-Math.min(limit, lines.length));
    
    // Parser les alertes
    return latestLines.map(line => {
      const timestampMatch = line.match(/\[(.*?)\]/);
      const messageMatch = line.match(/\] (.*)/);
      
      return {
        timestamp: timestampMatch ? new Date(timestampMatch[1]) : new Date(),
        message: messageMatch ? messageMatch[1] : line
      };
    });
  } catch (error) {
    console.error('Erreur lors de la lecture du fichier d\'alertes:', error);
    return [];
  }
}

/**
 * Récupère les statistiques d'utilisation des API
 * @returns {Promise<Object>} - Statistiques d'utilisation
 */
async function getApiUsageStats() {
  try {
    const healthLogPath = path.resolve(process.cwd(), 'logs/api-health.log');
    
    if (!fs.existsSync(healthLogPath)) {
      return { daily: {}, weekly: {} };
    }
    
    const content = fs.readFileSync(healthLogPath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    // Parser les logs
    const logs = lines.map(line => {
      try {
        return JSON.parse(line);
      } catch (e) {
        return null;
      }
    }).filter(log => log !== null);
    
    // Filtrer par date
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const dailyLogs = logs.filter(log => new Date(log.timestamp) > oneDayAgo);
    const weeklyLogs = logs.filter(log => new Date(log.timestamp) > oneWeekAgo);
    
    // Agréger par API
    const dailyStats = aggregateLogsByApi(dailyLogs);
    const weeklyStats = aggregateLogsByApi(weeklyLogs);
    
    return {
      daily: dailyStats,
      weekly: weeklyStats
    };
  } catch (error) {
    console.error('Erreur lors de la lecture du fichier de santé des API:', error);
    return { daily: {}, weekly: {} };
  }
}

/**
 * Agrège les logs par API
 * @param {Array} logs - Logs à agréger
 * @returns {Object} - Statistiques par API
 */
function aggregateLogsByApi(logs) {
  const stats = {};
  
  logs.forEach(log => {
    if (!stats[log.api]) {
      stats[log.api] = {
        totalCalls: 0,
        successCount: 0,
        errorCount: 0,
        averageLatency: 0
      };
    }
    
    stats[log.api].totalCalls++;
    
    if (log.healthy) {
      stats[log.api].successCount++;
    } else {
      stats[log.api].errorCount++;
    }
    
    // Mise à jour de la latence moyenne
    const currentTotal = stats[log.api].averageLatency * (stats[log.api].totalCalls - 1);
    stats[log.api].averageLatency = (currentTotal + log.latency) / stats[log.api].totalCalls;
  });
  
  // Calculer les taux de succès
  Object.values(stats).forEach(stat => {
    stat.successRate = stat.totalCalls > 0 ? Math.round((stat.successCount / stat.totalCalls) * 100) : 0;
    stat.averageLatency = Math.round(stat.averageLatency);
  });
  
  return stats;
}

module.exports = router;
