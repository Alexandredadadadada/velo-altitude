/**
 * Quota Analytics - Système d'analyse des quotas d'API
 * Fournit des outils pour suivre, analyser et visualiser l'utilisation des quotas
 */

const fs = require('fs');
const path = require('path');
const { logger } = require('./logger');

class QuotaAnalytics {
  constructor(options = {}) {
    this.config = {
      dataDir: options.dataDir || path.join(__dirname, '../data/analytics'),
      retentionDays: options.retentionDays || 30,
      apiName: options.apiName || 'openroute'
    };
    
    // Créer le répertoire de données si nécessaire
    this._ensureDirectoryExists();
    
    // Initialiser les données d'analyse
    this.data = {
      dailyUsage: {},
      hourlyBreakdown: {},
      endpointUsage: {},
      responseTimesByEndpoint: {},
      errorRates: {},
      peakUsageTimes: [],
      quotaExceededEvents: [],
      countryUsage: {}, // Nouvelle propriété pour suivre l'utilisation par pays
      regionUsage: {} // Nouvelle propriété pour suivre l'utilisation par région
    };
    
    // Charger les données existantes
    this._loadData();
    
    logger.info(`Système d'analyse des quotas pour ${this.config.apiName} initialisé`);
  }
  
  /**
   * Enregistre une utilisation d'API
   * @param {Object} usage Informations sur l'utilisation
   */
  recordUsage(usage) {
    const now = new Date();
    const dateKey = this._formatDate(now);
    const hourKey = `${now.getHours()}`;
    
    // Mettre à jour l'utilisation quotidienne
    if (!this.data.dailyUsage[dateKey]) {
      this.data.dailyUsage[dateKey] = { count: 0, success: 0, failed: 0 };
    }
    this.data.dailyUsage[dateKey].count++;
    
    if (usage.success) {
      this.data.dailyUsage[dateKey].success++;
    } else {
      this.data.dailyUsage[dateKey].failed++;
    }
    
    // Mettre à jour la répartition horaire
    if (!this.data.hourlyBreakdown[dateKey]) {
      this.data.hourlyBreakdown[dateKey] = {};
    }
    if (!this.data.hourlyBreakdown[dateKey][hourKey]) {
      this.data.hourlyBreakdown[dateKey][hourKey] = 0;
    }
    this.data.hourlyBreakdown[dateKey][hourKey]++;
    
    // Mettre à jour l'utilisation par endpoint
    const endpoint = usage.endpoint || 'unknown';
    if (!this.data.endpointUsage[endpoint]) {
      this.data.endpointUsage[endpoint] = 0;
    }
    this.data.endpointUsage[endpoint]++;
    
    // Mettre à jour les temps de réponse par endpoint
    if (usage.responseTime) {
      if (!this.data.responseTimesByEndpoint[endpoint]) {
        this.data.responseTimesByEndpoint[endpoint] = {
          count: 0,
          total: 0,
          min: usage.responseTime,
          max: usage.responseTime
        };
      }
      
      const stats = this.data.responseTimesByEndpoint[endpoint];
      stats.count++;
      stats.total += usage.responseTime;
      stats.min = Math.min(stats.min, usage.responseTime);
      stats.max = Math.max(stats.max, usage.responseTime);
    }
    
    // Mettre à jour l'utilisation par pays
    const country = usage.country || 'unknown';
    if (!this.data.countryUsage[dateKey]) {
      this.data.countryUsage[dateKey] = {};
    }
    if (!this.data.countryUsage[dateKey][country]) {
      this.data.countryUsage[dateKey][country] = 0;
    }
    this.data.countryUsage[dateKey][country]++;
    
    // Mettre à jour l'utilisation par région
    const region = usage.region || 'unknown';
    if (!this.data.regionUsage[dateKey]) {
      this.data.regionUsage[dateKey] = {};
    }
    if (!this.data.regionUsage[dateKey][region]) {
      this.data.regionUsage[dateKey][region] = 0;
    }
    this.data.regionUsage[dateKey][region]++;
    
    // Enregistrer les événements de dépassement de quota
    if (usage.quotaExceeded) {
      this.data.quotaExceededEvents.push({
        timestamp: now.toISOString(),
        endpoint,
        reason: usage.quotaExceededReason || 'unknown'
      });
    }
    
    // Sauvegarder périodiquement
    if (Math.random() < 0.1) { // ~10% des appels déclenchent une sauvegarde
      this._saveData();
    }
  }
  
  /**
   * Génère un rapport d'utilisation des quotas
   * @param {Object} options Options du rapport
   * @returns {Object} Données du rapport
   */
  generateReport(options = {}) {
    const days = options.days || 7;
    const now = new Date();
    const report = {
      period: {
        start: this._formatDate(new Date(now.getTime() - (days * 24 * 60 * 60 * 1000))),
        end: this._formatDate(now)
      },
      summary: {
        totalRequests: 0,
        successRate: 0,
        averageResponseTime: 0,
        quotaExceededCount: 0
      },
      dailyBreakdown: {},
      topEndpoints: [],
      recommendations: [],
      countryUsage: {},
      regionUsage: {}
    };
    
    // Calculer les statistiques pour la période spécifiée
    let totalSuccess = 0;
    let totalFailed = 0;
    let totalResponseTime = 0;
    let totalResponseCount = 0;
    
    // Filtrer les données pour la période du rapport
    Object.entries(this.data.dailyUsage).forEach(([date, stats]) => {
      if (this._isDateInRange(date, report.period.start, report.period.end)) {
        report.dailyBreakdown[date] = stats;
        report.summary.totalRequests += stats.count;
        totalSuccess += stats.success;
        totalFailed += stats.failed;
      }
    });
    
    // Calculer le taux de succès
    if (report.summary.totalRequests > 0) {
      report.summary.successRate = (totalSuccess / report.summary.totalRequests) * 100;
    }
    
    // Calculer le temps de réponse moyen
    Object.values(this.data.responseTimesByEndpoint).forEach(stats => {
      totalResponseTime += stats.total;
      totalResponseCount += stats.count;
    });
    
    if (totalResponseCount > 0) {
      report.summary.averageResponseTime = totalResponseTime / totalResponseCount;
    }
    
    // Compter les événements de dépassement de quota
    report.summary.quotaExceededCount = this.data.quotaExceededEvents.filter(event => {
      const eventDate = event.timestamp.split('T')[0];
      return this._isDateInRange(eventDate, report.period.start, report.period.end);
    }).length;
    
    // Identifier les endpoints les plus utilisés
    report.topEndpoints = Object.entries(this.data.endpointUsage)
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Générer des recommandations
    this._generateRecommendations(report);
    
    // Calculer l'utilisation par pays
    Object.entries(this.data.countryUsage).forEach(([date, countries]) => {
      if (this._isDateInRange(date, report.period.start, report.period.end)) {
        Object.entries(countries).forEach(([country, count]) => {
          if (!report.countryUsage[country]) {
            report.countryUsage[country] = 0;
          }
          report.countryUsage[country] += count;
        });
      }
    });
    
    // Calculer l'utilisation par région
    Object.entries(this.data.regionUsage).forEach(([date, regions]) => {
      if (this._isDateInRange(date, report.period.start, report.period.end)) {
        Object.entries(regions).forEach(([region, count]) => {
          if (!report.regionUsage[region]) {
            report.regionUsage[region] = 0;
          }
          report.regionUsage[region] += count;
        });
      }
    });
    
    return report;
  }
  
  // ... (autres méthodes restent inchangées)
  
  /**
   * Obtenir les données d'utilisation quotidienne par pays pour une date spécifique
   * @param {string} date Date au format YYYY-MM-DD
   * @returns {Object} Données d'utilisation par pays
   */
  getDailyUsageByCountry(date) {
    try {
      if (!this.data.countryUsage[date]) {
        return {};
      }
      
      const result = {};
      Object.entries(this.data.countryUsage[date]).forEach(([country, count]) => {
        result[country] = count;
      });
      
      return result;
    } catch (error) {
      logger.error(`Erreur lors de la récupération des données d'utilisation par pays: ${error.message}`);
      return {};
    }
  }
  
  /**
   * Obtenir les données d'utilisation d'un endpoint par pays
   * @param {string} endpoint Nom de l'endpoint
   * @returns {Object} Données d'utilisation par pays
   */
  getEndpointUsageByCountry(endpoint) {
    try {
      const result = {};
      
      // Parcourir toutes les dates
      Object.entries(this.data.countryUsage).forEach(([date, countries]) => {
        // Parcourir tous les pays pour cette date
        Object.entries(countries).forEach(([country, data]) => {
          if (!result[country]) {
            result[country] = 0;
          }
          
          // Ajouter l'utilisation de cet endpoint pour ce pays
          if (data.byEndpoint && data.byEndpoint[endpoint]) {
            result[country] += data.byEndpoint[endpoint];
          }
        });
      });
      
      return result;
    } catch (error) {
      logger.error(`Erreur lors de la récupération des données d'utilisation d'endpoint par pays: ${error.message}`);
      return {};
    }
  }
  
  /**
   * Obtenir la distribution horaire par pays
   * @returns {Object} Données de distribution horaire par pays
   */
  getHourlyDistributionByCountry() {
    try {
      const result = {};
      
      // Initialiser le résultat pour chaque pays connu
      const knownCountries = new Set();
      Object.values(this.data.countryUsage).forEach(countries => {
        Object.keys(countries).forEach(country => knownCountries.add(country));
      });
      
      knownCountries.forEach(country => {
        result[country] = Array(24).fill(0);
      });
      
      // Parcourir toutes les dates
      Object.values(this.data.countryUsage).forEach(countries => {
        // Parcourir tous les pays pour cette date
        Object.entries(countries).forEach(([country, data]) => {
          // Ajouter la distribution horaire pour ce pays
          if (data.byHour) {
            data.byHour.forEach((count, hour) => {
              result[country][hour] += count;
            });
          }
        });
      });
      
      return result;
    } catch (error) {
      logger.error(`Erreur lors de la récupération de la distribution horaire par pays: ${error.message}`);
      return {};
    }
  }
  
  // ... (autres méthodes restent inchangées)
}
