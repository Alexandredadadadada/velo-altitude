/**
 * API Dashboard - Routes pour le tableau de bord de suivi des API
 * Fournit des endpoints pour visualiser l'utilisation des quotas et l'état des API
 */

const express = require('express');
const router = express.Router();
const apiQuotaManager = require('../utils/apiQuotaManager');
const quotaAnalytics = require('../utils/quota-analytics');
const { logger } = require('../utils/logger');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// Middleware pour vérifier les permissions d'administration
router.use(isAuthenticated);

// Cache pour les résultats filtrés (optimisation des performances)
const filteredDataCache = {
  cache: new Map(),
  maxSize: 100, // Limiter la taille du cache
  ttl: 5 * 60 * 1000, // TTL de 5 minutes

  // Générer une clé de cache basée sur les paramètres
  getKey(dataId, country, region) {
    return `${dataId}:${country || 'all'}:${region || 'all'}`;
  },

  // Récupérer des données du cache
  get(dataId, country, region) {
    const key = this.getKey(dataId, country, region);
    const cachedItem = this.cache.get(key);
    
    if (cachedItem && Date.now() < cachedItem.expiry) {
      return cachedItem.data;
    }
    
    return null;
  },

  // Stocker des données dans le cache
  set(dataId, country, region, data) {
    // Nettoyer le cache si nécessaire
    if (this.cache.size >= this.maxSize) {
      // Supprimer les entrées les plus anciennes
      const keysToDelete = [...this.cache.entries()]
        .sort((a, b) => a[1].expiry - b[1].expiry)
        .slice(0, Math.floor(this.maxSize / 4))
        .map(entry => entry[0]);
      
      keysToDelete.forEach(key => this.cache.delete(key));
    }
    
    const key = this.getKey(dataId, country, region);
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.ttl
    });
  },

  // Invalider le cache pour un type de données
  invalidate(dataId) {
    [...this.cache.keys()]
      .filter(key => key.startsWith(`${dataId}:`))
      .forEach(key => this.cache.delete(key));
  },

  // Invalider tout le cache
  clear() {
    this.cache.clear();
  }
};

/**
 * Filtre les données en fonction du pays et de la région
 * @param {Object} data - Données à filtrer
 * @param {string} country - Code du pays (ou 'all' pour tous)
 * @param {string} region - Code de la région (ou 'all' pour toutes)
 * @param {string} dataId - Identifiant du type de données pour la mise en cache
 * @returns {Object} - Données filtrées
 */
function filterByCountryAndRegion(data, country, region, dataId = null) {
  // Si aucun filtre n'est appliqué, retourner les données telles quelles
  if ((country === 'all' || !country) && (region === 'all' || !region)) {
    return data;
  }

  // Vérifier le cache si un dataId est fourni
  if (dataId) {
    const cachedResult = filteredDataCache.get(dataId, country, region);
    if (cachedResult) {
      return cachedResult;
    }
  }

  // Définir les pays par région
  const regionCountries = {
    western: ['fr', 'be', 'nl', 'lu'],
    eastern: ['pl', 'cz', 'sk', 'hu', 'ro', 'bg'],
    northern: ['dk', 'se', 'no', 'fi', 'ee', 'lv', 'lt'],
    southern: ['es', 'pt', 'it', 'gr', 'hr', 'si'],
    central: ['de', 'at', 'ch']
  };

  // Créer une copie profonde des données pour éviter de modifier l'original
  const filteredData = JSON.parse(JSON.stringify(data));

  // Filtrer par pays si spécifié
  if (country !== 'all' && country) {
    // Logique de filtrage spécifique à chaque type de données
    if (filteredData.dailyUsage) {
      filteredData.dailyUsage = filteredData.dailyUsage.map(item => {
        if (item.countryData) {
          return {
            ...item,
            count: item.countryData[country] || 0
          };
        }
        return item;
      });
    }

    if (filteredData.topEndpoints) {
      filteredData.topEndpoints = filteredData.topEndpoints.filter(item => 
        item.countryData && item.countryData[country]
      ).map(item => ({
        ...item,
        count: item.countryData[country] || 0
      }));
    }

    if (filteredData.hourlyDistribution) {
      // Supposons que hourlyDistribution a des données par pays
      filteredData.hourlyDistribution = filteredData.hourlyDistributionByCountry?.[country] || Array(24).fill(0);
    }

    if (filteredData.responseTimeTrend) {
      filteredData.responseTimeTrend = filteredData.responseTimeTrend.map(item => {
        if (item.countryData) {
          return {
            ...item,
            avgTime: item.countryData[country]?.avgTime || item.avgTime
          };
        }
        return item;
      });
    }

    // Filtrer les autres propriétés selon les besoins
  }
  // Filtrer par région si spécifiée
  else if (region !== 'all' && region) {
    const countriesInRegion = regionCountries[region] || [];
    
    if (filteredData.dailyUsage) {
      filteredData.dailyUsage = filteredData.dailyUsage.map(item => {
        if (item.countryData) {
          const regionCount = countriesInRegion.reduce((sum, countryCode) => 
            sum + (item.countryData[countryCode] || 0), 0);
          return {
            ...item,
            count: regionCount
          };
        }
        return item;
      });
    }

    if (filteredData.topEndpoints) {
      // Recalculer les compteurs pour les pays de la région
      const regionEndpoints = {};
      filteredData.topEndpoints.forEach(item => {
        if (item.countryData) {
          const regionCount = countriesInRegion.reduce((sum, countryCode) => 
            sum + (item.countryData[countryCode] || 0), 0);
          
          if (!regionEndpoints[item.endpoint]) {
            regionEndpoints[item.endpoint] = {
              endpoint: item.endpoint,
              count: 0
            };
          }
          regionEndpoints[item.endpoint].count += regionCount;
        }
      });
      
      filteredData.topEndpoints = Object.values(regionEndpoints)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Garder les 5 premiers
    }

    // Filtrer les autres propriétés selon les besoins
  }

  // Mettre en cache le résultat si un dataId est fourni
  if (dataId) {
    filteredDataCache.set(dataId, country, region, filteredData);
  }

  return filteredData;
}

/**
 * GET /api/dashboard/status
 * Retourne l'état actuel des quotas API
 */
router.get('/status', (req, res) => {
  const { country, region } = req.query;
  
  try {
    const status = {
      timestamp: new Date().toISOString(),
      quotaStatus: apiQuotaManager.getStatus(),
      isLimited: apiQuotaManager.state.isLimited,
      limitReason: apiQuotaManager.state.limitReason,
      limitUntil: apiQuotaManager.state.limitUntil,
      queueLength: {
        high: apiQuotaManager.queue.high.length,
        normal: apiQuotaManager.queue.normal.length,
        low: apiQuotaManager.queue.low.length
      },
      currentRate: apiQuotaManager.state.currentRate,
      activeRequests: apiQuotaManager.state.activeRequests
    };
    
    // Filtrer les données si nécessaire
    status = filterByCountryAndRegion(status, country, region, 'status');
    
    res.json(status);
  } catch (error) {
    logger.error(`Erreur lors de la récupération du statut des API: ${error.message}`);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération du statut' });
  }
});

/**
 * GET /api/dashboard/analytics
 * Retourne les données d'analyse des quotas API
 */
router.get('/analytics', (req, res) => {
  const days = parseInt(req.query.days || '7', 10);
  const { country, region } = req.query;
  
  try {
    const report = quotaAnalytics.generateReport({ days });
    
    // Ajouter des données par pays pour le filtrage
    report.dailyUsage.forEach(item => {
      item.countryData = quotaAnalytics.getDailyUsageByCountry(item.date);
    });
    
    report.topEndpoints.forEach(item => {
      item.countryData = quotaAnalytics.getEndpointUsageByCountry(item.endpoint);
    });
    
    report.hourlyDistributionByCountry = quotaAnalytics.getHourlyDistributionByCountry();
    
    report.responseTimeTrend.forEach(item => {
      item.countryData = quotaAnalytics.getResponseTimeByCountry(item.date);
    });
    
    // Filtrer les données si nécessaire
    report = filterByCountryAndRegion(report, country, region, `analytics:${days}`);
    
    res.json(report);
  } catch (error) {
    logger.error(`Erreur lors de la génération du rapport d'analyse: ${error.message}`);
    res.status(500).json({ error: 'Erreur serveur lors de la génération du rapport' });
  }
});

/**
 * GET /api/dashboard/real-time
 * Retourne les données en temps réel pour le monitoring
 */
router.get('/real-time', (req, res) => {
  const { country, region } = req.query;
  
  try {
    const realTimeData = {
      timestamp: new Date().toISOString(),
      rateHistory: apiQuotaManager.realTimeData.rateHistory.slice(-20), // Dernières 20 mesures
      quotaUsage: {
        daily: (apiQuotaManager.counters.daily / apiQuotaManager.config.quotaPerDay) * 100,
        hourly: Object.entries(apiQuotaManager.counters.hourly).map(([hour, count]) => ({
          hour: parseInt(hour, 10),
          usage: (count / apiQuotaManager.config.quotaPerHour) * 100
        })),
        minute: Object.entries(apiQuotaManager.counters.minute)
          .slice(-10) // Dernières 10 minutes
          .map(([minute, count]) => ({
            minute,
            usage: (count / apiQuotaManager.config.quotaPerMinute) * 100
          }))
      },
      activeEndpoints: Array.from(apiQuotaManager.realTimeData.activeEndpoints),
      queueStatus: {
        high: apiQuotaManager.queue.high.length,
        normal: apiQuotaManager.queue.normal.length,
        low: apiQuotaManager.queue.low.length
      }
    };
    
    // Filtrer par pays ou région si spécifié
    if (country && country !== 'all') {
      realTimeData.activeEndpoints = realTimeData.activeEndpoints.filter(
        endpoint => endpoint.country === country
      );
    } else if (region && region !== 'all') {
      const regionCountries = {
        western: ['fr', 'be', 'nl', 'lu'],
        eastern: ['pl', 'cz', 'sk', 'hu', 'ro', 'bg'],
        northern: ['dk', 'se', 'no', 'fi', 'ee', 'lv', 'lt'],
        southern: ['es', 'pt', 'it', 'gr', 'hr', 'si'],
        central: ['de', 'at', 'ch']
      };
      
      const countriesInRegion = regionCountries[region] || [];
      
      realTimeData.activeEndpoints = realTimeData.activeEndpoints.filter(
        endpoint => countriesInRegion.includes(endpoint.country)
      );
    }
    
    res.json(realTimeData);
  } catch (error) {
    logger.error(`Erreur lors de la récupération des données en temps réel: ${error.message}`);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des données en temps réel' });
  }
});

/**
 * GET /api/dashboard/recommendations
 * Retourne des recommandations pour optimiser l'utilisation des API
 * Nécessite des droits d'administration
 */
router.get('/recommendations', isAdmin, (req, res) => {
  const { country, region } = req.query;
  
  try {
    const report = quotaAnalytics.generateReport({ days: 30 });
    
    // Ajouter des recommandations supplémentaires basées sur l'état actuel
    const recommendations = [...report.recommendations];
    
    // Vérifier l'état des files d'attente
    const totalQueued = apiQuotaManager.queue.high.length + 
                        apiQuotaManager.queue.normal.length + 
                        apiQuotaManager.queue.low.length;
    
    if (totalQueued > 20) {
      recommendations.push({
        type: 'warning',
        message: `${totalQueued} requêtes en file d'attente. Envisagez d'augmenter les ressources ou d'optimiser les requêtes.`
      });
    }
    
    // Vérifier si le système est actuellement limité
    if (apiQuotaManager.state.isLimited) {
      recommendations.push({
        type: 'critical',
        message: `Le système est actuellement limité (${apiQuotaManager.state.limitReason}). Réduction temporaire des requêtes recommandée.`
      });
    }
    
    // Filtrer les recommandations par pays ou région si spécifié
    if (country && country !== 'all') {
      recommendations.forEach(rec => {
        if (rec.country && rec.country !== country) {
          rec.relevance = 0;
        }
      });
    } else if (region && region !== 'all') {
      const regionCountries = {
        western: ['fr', 'be', 'nl', 'lu'],
        eastern: ['pl', 'cz', 'sk', 'hu', 'ro', 'bg'],
        northern: ['dk', 'se', 'no', 'fi', 'ee', 'lv', 'lt'],
        southern: ['es', 'pt', 'it', 'gr', 'hr', 'si'],
        central: ['de', 'at', 'ch']
      };
      
      const countriesInRegion = regionCountries[region] || [];
      
      recommendations.forEach(rec => {
        if (rec.country && !countriesInRegion.includes(rec.country)) {
          rec.relevance = 0;
        }
      });
    }
    
    res.json({ recommendations });
  } catch (error) {
    logger.error(`Erreur lors de la génération des recommandations: ${error.message}`);
    res.status(500).json({ error: 'Erreur serveur lors de la génération des recommandations' });
  }
});

/**
 * POST /api/dashboard/reset-limits
 * Réinitialise manuellement l'état limité (admin uniquement)
 */
router.post('/reset-limits', isAdmin, (req, res) => {
  try {
    apiQuotaManager._resetLimitedState();
    
    logger.info(`État limité réinitialisé manuellement par ${req.user.username}`);
    
    res.json({ 
      success: true, 
      message: 'État limité réinitialisé avec succès',
      newStatus: apiQuotaManager.getStatus()
    });
  } catch (error) {
    logger.error(`Erreur lors de la réinitialisation de l'état limité: ${error.message}`);
    res.status(500).json({ error: 'Erreur serveur lors de la réinitialisation' });
  }
});

/**
 * POST /api/dashboard/clear-cache
 * Vide le cache de filtrage (admin uniquement)
 */
router.post('/clear-cache', isAdmin, (req, res) => {
  try {
    filteredDataCache.clear();
    
    res.json({ 
      success: true, 
      message: 'Cache vidé avec succès'
    });
  } catch (error) {
    logger.error(`Erreur lors du vidage du cache: ${error.message}`);
    res.status(500).json({ error: 'Erreur serveur lors du vidage du cache' });
  }
});

module.exports = router;
