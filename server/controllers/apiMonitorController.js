/**
 * Contrôleur pour la gestion du monitoring des API
 * Fournit les données pour le tableau de bord d'administration
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const apiQuotaMonitor = require('../utils/api-quota-monitor');

// Modèle pour les données d'utilisation (si disponible)
let ApiUsage;
if (mongoose.connection.models.ApiUsage) {
  ApiUsage = mongoose.model('ApiUsage');
}

/**
 * Récupère le statut actuel des différentes API
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
exports.getApiStatus = async (req, res) => {
  try {
    // Structure pour le statut
    const statusData = {
      strava: {
        status: 'unknown',
        description: 'API Strava pour l\'importation des activités cyclistes',
        lastCheck: null
      },
      openweather: {
        status: 'unknown',
        description: 'API météo pour les prévisions sur les itinéraires',
        lastCheck: null
      },
      openroute: {
        status: 'unknown',
        description: 'Service de calcul d\'itinéraires et d\'élévation',
        lastCheck: null
      },
      mapbox: {
        status: 'unknown',
        description: 'Rendu des cartes et services géographiques',
        lastCheck: null
      },
      openai: {
        status: 'unknown',
        description: 'AI générative pour les descriptions et recommandations',
        lastCheck: null
      },
      claude: {
        status: 'unknown',
        description: 'AI avancée pour l\'analyse technique des itinéraires',
        lastCheck: null
      }
    };

    // Si apiQuotaMonitor a un service de surveillance
    if (apiQuotaMonitor.getServiceStatus) {
      const serviceStatus = apiQuotaMonitor.getServiceStatus();
      
      // Mettre à jour les statuts avec les données de surveillance
      serviceStatus.forEach(service => {
        const apiName = service.name.toLowerCase();
        if (statusData[apiName]) {
          statusData[apiName].status = service.status;
          statusData[apiName].lastCheck = service.lastCheck;
        }
      });
    } else {
      // Mode simulation: alimenter avec des données fictives pour la démo
      Object.keys(statusData).forEach(api => {
        // Génération aléatoire de statut pour la démonstration
        const statuses = ['operational', 'operational', 'operational', 'operational', 'degraded', 'down'];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        
        statusData[api].status = randomStatus;
        statusData[api].lastCheck = new Date();
      });
    }

    res.json(statusData);
  } catch (error) {
    console.error('Erreur lors de la récupération du statut des API:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du statut des API' });
  }
};

/**
 * Récupère les données d'utilisation des API pour la période spécifiée
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
exports.getApiUsage = async (req, res) => {
  try {
    const timeRange = req.query.timeRange || 'day';
    
    // Structure pour les données d'utilisation
    const usageData = {
      strava: {
        totalToday: 0,
        dailyLimit: 1000,
        endpoints: [],
        recentAlerts: []
      },
      openweather: {
        totalToday: 0,
        dailyLimit: 1000,
        endpoints: [],
        recentAlerts: []
      },
      openroute: {
        totalToday: 0,
        dailyLimit: 2000,
        endpoints: [],
        recentAlerts: []
      },
      mapbox: {
        totalToday: 0,
        dailyLimit: 300,
        monthlyLimit: 50000,
        endpoints: [],
        recentAlerts: []
      },
      openai: {
        totalToday: 0,
        dailyLimit: 1000,
        endpoints: [],
        recentAlerts: []
      },
      claude: {
        totalToday: 0,
        dailyLimit: 500,
        endpoints: [],
        recentAlerts: []
      }
    };

    // Date de début basée sur la plage temporelle
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    
    if (timeRange === 'week') {
      // 7 jours en arrière
      startDate.setDate(startDate.getDate() - 7);
    } else if (timeRange === 'month') {
      // 30 jours en arrière
      startDate.setDate(startDate.getDate() - 30);
    }

    // Si le modèle ApiUsage est disponible, récupérer les vraies données
    if (ApiUsage) {
      // Aggrégation pour obtenir les totaux par API
      const apiTotals = await ApiUsage.aggregate([
        {
          $match: { date: { $gte: startDate } }
        },
        {
          $group: {
            _id: '$api',
            totalRequests: { $sum: '$requestCount' },
            totalErrors: { $sum: '$errorCount' }
          }
        }
      ]);

      // Aggrégation pour obtenir les détails par endpoint
      const endpointDetails = await ApiUsage.aggregate([
        {
          $match: { date: { $gte: startDate } }
        },
        {
          $group: {
            _id: { api: '$api', endpoint: '$endpoint' },
            count: { $sum: '$requestCount' },
            errors: { $sum: '$errorCount' }
          }
        }
      ]);

      // Mise à jour des données d'utilisation
      apiTotals.forEach(apiTotal => {
        if (usageData[apiTotal._id]) {
          usageData[apiTotal._id].totalToday = apiTotal.totalRequests;
        }
      });

      // Mise à jour des données par endpoint
      endpointDetails.forEach(endpoint => {
        if (usageData[endpoint._id.api]) {
          usageData[endpoint._id.api].endpoints.push({
            path: endpoint._id.endpoint,
            count: endpoint.count,
            errors: endpoint.errors
          });
        }
      });

      // Selon la plage temporelle, ajouter des données structurées pour les graphiques
      if (timeRange === 'day') {
        // Regrouper par heure
        const hourlyData = await getHourlyData(startDate);
        
        // Alimenter les structures hourly
        Object.keys(usageData).forEach(api => {
          usageData[api].hourly = {};
          
          // Créer des entrées pour chaque heure
          for (let i = 0; i < 24; i++) {
            const hour = i.toString().padStart(2, '0');
            usageData[api].hourly[hour] = {
              requestCount: 0,
              errorCount: 0,
              quota: null
            };
          }
        });
        
        // Remplir avec les données réelles si disponibles
        hourlyData.forEach(hour => {
          if (usageData[hour._id.api] && usageData[hour._id.api].hourly[hour._id.hour]) {
            usageData[hour._id.api].hourly[hour._id.hour] = {
              requestCount: hour.requestCount,
              errorCount: hour.errorCount,
              quota: hour.quota
            };
          }
        });
      } else if (timeRange === 'week') {
        // Regrouper par jour
        const dailyData = await getDailyData(startDate);
        
        // Alimenter les structures daily
        Object.keys(usageData).forEach(api => {
          usageData[api].daily = {};
          
          // Créer des entrées pour chaque jour de la semaine dernière
          for (let i = 0; i < 7; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            const dayKey = date.toISOString().split('T')[0];
            
            usageData[api].daily[dayKey] = {
              requestCount: 0,
              errorCount: 0
            };
          }
        });
        
        // Remplir avec les données réelles
        dailyData.forEach(day => {
          const dayKey = day._id.date;
          if (usageData[day._id.api] && usageData[day._id.api].daily[dayKey]) {
            usageData[day._id.api].daily[dayKey] = {
              requestCount: day.requestCount,
              errorCount: day.errorCount
            };
          }
        });
      } else if (timeRange === 'month') {
        // Regrouper par semaine
        const weeklyData = await getWeeklyData(startDate);
        
        // Alimenter les structures weekly
        Object.keys(usageData).forEach(api => {
          usageData[api].weekly = {};
          
          // Créer des entrées pour les 4 dernières semaines
          const today = new Date();
          for (let i = 0; i < 4; i++) {
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - ((today.getDay() || 7) - 1) - (7 * i));
            const weekNumber = getWeekNumber(weekStart);
            const weekKey = `${weekStart.getFullYear()}-${weekNumber}`;
            
            usageData[api].weekly[weekKey] = {
              requestCount: 0,
              errorCount: 0
            };
          }
        });
        
        // Remplir avec les données réelles
        weeklyData.forEach(week => {
          const weekKey = week._id.week;
          if (usageData[week._id.api] && usageData[week._id.api].weekly[weekKey]) {
            usageData[week._id.api].weekly[weekKey] = {
              requestCount: week.requestCount,
              errorCount: week.errorCount
            };
          }
        });
      }
    } else {
      // Mode simulation: générer des données fictives pour la démonstration
      Object.keys(usageData).forEach(api => {
        // Total pour aujourd'hui
        const randomFactor = Math.random();
        const limit = usageData[api].dailyLimit;
        
        usageData[api].totalToday = Math.floor(randomFactor * limit * 0.8);
        
        // Endpoints fictifs
        const endpoints = [
          { path: '/auth', count: Math.floor(Math.random() * 50), errors: Math.floor(Math.random() * 2) },
          { path: '/data', count: Math.floor(Math.random() * 200), errors: Math.floor(Math.random() * 5) },
          { path: '/users', count: Math.floor(Math.random() * 100), errors: Math.floor(Math.random() * 3) }
        ];
        
        usageData[api].endpoints = endpoints;
        
        // Alertes récentes fictives
        if (Math.random() > 0.7) {
          usageData[api].recentAlerts.push({
            level: 'warning',
            message: 'Augmentation inhabituelle des requêtes détectée',
            timestamp: new Date(Date.now() - Math.floor(Math.random() * 86400000))
          });
        }
        
        if (Math.random() > 0.9) {
          usageData[api].recentAlerts.push({
            level: 'error',
            message: 'Taux d\'erreur élevé sur certains endpoints',
            timestamp: new Date(Date.now() - Math.floor(Math.random() * 43200000))
          });
        }
        
        // Données horaires pour le graphique "jour"
        if (timeRange === 'day') {
          usageData[api].hourly = {};
          
          for (let i = 0; i < 24; i++) {
            const hour = i.toString().padStart(2, '0');
            const hourRequests = i < (new Date()).getHours() 
              ? Math.floor(Math.random() * (limit / 24) * 1.5)
              : 0;
              
            usageData[api].hourly[hour] = {
              requestCount: hourRequests,
              errorCount: Math.floor(hourRequests * 0.02),
              quota: {
                total: Math.floor(limit / 24),
                remaining: Math.floor(limit / 24) - hourRequests
              }
            };
          }
        }
        
        // Données journalières pour le graphique "semaine"
        if (timeRange === 'week') {
          usageData[api].daily = {};
          
          for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() - 6 + i);
            const dayKey = date.toISOString().split('T')[0];
            
            usageData[api].daily[dayKey] = {
              requestCount: Math.floor(Math.random() * limit * 0.8),
              errorCount: Math.floor(Math.random() * 20)
            };
          }
        }
        
        // Données hebdomadaires pour le graphique "mois"
        if (timeRange === 'month') {
          usageData[api].weekly = {};
          
          const today = new Date();
          for (let i = 0; i < 4; i++) {
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - ((today.getDay() || 7) - 1) - (7 * i));
            const weekNumber = getWeekNumber(weekStart);
            const weekKey = `${weekStart.getFullYear()}-${weekNumber}`;
            
            usageData[api].weekly[weekKey] = {
              requestCount: Math.floor(Math.random() * limit * 4),
              errorCount: Math.floor(Math.random() * 50)
            };
          }
        }
      });
    }

    res.json(usageData);
  } catch (error) {
    console.error('Erreur lors de la récupération des données d\'utilisation des API:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des données d\'utilisation' });
  }
};

/**
 * Obtient les données regroupées par heure
 * @param {Date} startDate - Date de début
 * @returns {Array} Données regroupées par heure
 */
async function getHourlyData(startDate) {
  if (!ApiUsage) return [];

  try {
    return await ApiUsage.aggregate([
      {
        $match: { date: { $gte: startDate } }
      },
      {
        $project: {
          api: 1,
          hour: { $substr: [{ $hour: '$lastRequest' }, 0, 2] },
          requestCount: 1,
          errorCount: 1,
          quota: 1
        }
      },
      {
        $group: {
          _id: { api: '$api', hour: '$hour' },
          requestCount: { $sum: '$requestCount' },
          errorCount: { $sum: '$errorCount' },
          quota: { $first: '$quota' }
        }
      }
    ]);
  } catch (error) {
    console.error('Erreur lors de la récupération des données horaires:', error);
    return [];
  }
}

/**
 * Obtient les données regroupées par jour
 * @param {Date} startDate - Date de début
 * @returns {Array} Données regroupées par jour
 */
async function getDailyData(startDate) {
  if (!ApiUsage) return [];

  try {
    return await ApiUsage.aggregate([
      {
        $match: { date: { $gte: startDate } }
      },
      {
        $project: {
          api: 1,
          date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          requestCount: 1,
          errorCount: 1
        }
      },
      {
        $group: {
          _id: { api: '$api', date: '$date' },
          requestCount: { $sum: '$requestCount' },
          errorCount: { $sum: '$errorCount' }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ]);
  } catch (error) {
    console.error('Erreur lors de la récupération des données journalières:', error);
    return [];
  }
}

/**
 * Obtient les données regroupées par semaine
 * @param {Date} startDate - Date de début
 * @returns {Array} Données regroupées par semaine
 */
async function getWeeklyData(startDate) {
  if (!ApiUsage) return [];

  try {
    return await ApiUsage.aggregate([
      {
        $match: { date: { $gte: startDate } }
      },
      {
        $project: {
          api: 1,
          year: { $year: '$date' },
          week: { $week: '$date' },
          requestCount: 1,
          errorCount: 1
        }
      },
      {
        $group: {
          _id: { 
            api: '$api', 
            week: { 
              $concat: [
                { $toString: '$year' }, 
                '-', 
                { $toString: '$week' }
              ]
            }
          },
          requestCount: { $sum: '$requestCount' },
          errorCount: { $sum: '$errorCount' }
        }
      },
      {
        $sort: { '_id.week': 1 }
      }
    ]);
  } catch (error) {
    console.error('Erreur lors de la récupération des données hebdomadaires:', error);
    return [];
  }
}

/**
 * Exécute une vérification manuelle des API et force l'actualisation des statuts
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
exports.checkApiStatus = async (req, res) => {
  try {
    if (apiQuotaMonitor.checkAllServices) {
      await apiQuotaMonitor.checkAllServices();
      res.json({ message: 'Vérification des services API lancée avec succès' });
    } else {
      res.status(501).json({ message: 'La vérification manuelle n\'est pas implémentée' });
    }
  } catch (error) {
    console.error('Erreur lors de la vérification manuelle des API:', error);
    res.status(500).json({ message: 'Erreur lors de la vérification des API' });
  }
};

/**
 * Obtient le numéro de semaine d'une date
 * @param {Date} date - Date
 * @returns {number} Numéro de semaine
 */
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}
