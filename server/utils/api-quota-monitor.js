/**
 * Module de surveillance des quotas API
 * 
 * Cet utilitaire permet de :
 * - Surveiller l'utilisation des quotas des différentes API
 * - Alerter lorsque les quotas approchent de leurs limites
 * - Enregistrer les statistiques d'utilisation pour analyse
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const axios = require('axios');
const cron = require('node-cron');
const nodemailer = require('nodemailer');

// Modèle de données pour stocker les informations d'utilisation des API
const ApiUsageSchema = new mongoose.Schema({
  api: {
    type: String,
    required: true,
    enum: ['strava', 'openweather', 'openroute', 'mapbox', 'openai', 'claude']
  },
  endpoint: {
    type: String,
    required: true
  },
  requestCount: {
    type: Number,
    default: 0
  },
  quota: {
    total: Number,
    remaining: Number,
    resetTime: Date
  },
  errorCount: {
    type: Number,
    default: 0
  },
  lastRequest: {
    type: Date,
    default: Date.now
  },
  dayCount: {
    type: Number,
    default: 0
  },
  date: {
    type: Date,
    default: Date.now
  }
});

// Création d'un index composé pour faciliter les requêtes
ApiUsageSchema.index({ api: 1, endpoint: 1, date: 1 });

// Initialiser le modèle si mongoose est connecté
let ApiUsage;
if (mongoose.connection.readyState === 1) {
  ApiUsage = mongoose.model('ApiUsage', ApiUsageSchema);
} else {
  console.warn('Mongoose non connecté, la surveillance des quotas API sera stockée localement');
}

class ApiQuotaMonitor {
  constructor() {
    this.config = {
      strava: {
        minuteLimit: 100,
        dailyLimit: 1000,
        thresholds: {
          warning: 0.7, // 70% utilisé
          critical: 0.9  // 90% utilisé
        }
      },
      openweather: {
        minuteLimit: 60,
        dailyLimit: 1000,
        thresholds: {
          warning: 0.7,
          critical: 0.9
        }
      },
      openroute: {
        dailyLimit: 2000,
        thresholds: {
          warning: 0.7,
          critical: 0.9
        }
      },
      mapbox: {
        minuteLimit: 300,
        monthlyLimit: 50000,
        thresholds: {
          warning: 0.7,
          critical: 0.9
        }
      },
      openai: {
        minuteLimit: 60,
        dailyLimit: 1000,
        costPerToken: 0.000002, // $0.002 par 1000 tokens
        thresholds: {
          warning: 0.7,
          critical: 0.9
        }
      },
      claude: {
        minuteLimit: 50,
        dailyLimit: 500,
        costPerToken: 0.000003, // $0.003 par 1000 tokens
        thresholds: {
          warning: 0.7,
          critical: 0.9
        }
      }
    };

    // Cache local pour stocker temporairement les données d'utilisation
    this.usageCache = {};
    
    // Intervalles de réinitialisation des compteurs
    this.resetIntervals = {
      minute: 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000
    };
    
    // Configuration de l'email pour les alertes (si disponible)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      this.mailer = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    }
    
    // Initialisation des tâches planifiées
    this.initScheduledTasks();
    
    // Création du dossier pour les logs locaux si nécessaire
    this.logDir = path.join(__dirname, '../logs/api-usage');
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }
  
  /**
   * Initialise les tâches planifiées pour la collecte et l'analyse des données
   */
  initScheduledTasks() {
    // Toutes les heures, analyser l'utilisation et envoyer des alertes si nécessaire
    cron.schedule('0 * * * *', () => {
      this.analyzeUsageAndAlert();
    });
    
    // Chaque jour à minuit, archiver les données de la journée
    cron.schedule('0 0 * * *', () => {
      this.archiveDailyData();
    });
    
    // Chaque semaine, générer un rapport hebdomadaire
    cron.schedule('0 0 * * 0', () => {
      this.generateWeeklyReport();
    });
  }
  
  /**
   * Enregistre l'utilisation d'une API
   * @param {string} api - Nom de l'API (strava, openweather, etc.)
   * @param {string} endpoint - Point d'accès spécifique de l'API
   * @param {object} response - Réponse de l'API pour extraire les infos de quota
   * @param {boolean} isError - Indique si la requête a généré une erreur
   * @param {number} tokenCount - Nombre de tokens utilisés (pour les API IA)
   */
  async trackApiUsage(api, endpoint, response = null, isError = false, tokenCount = 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const cacheKey = `${api}-${endpoint}-${today.toISOString()}`;
    
    // Initialiser ou récupérer l'entrée de cache
    if (!this.usageCache[cacheKey]) {
      this.usageCache[cacheKey] = {
        api,
        endpoint,
        requestCount: 0,
        errorCount: 0,
        quota: {
          total: this.config[api]?.dailyLimit || null,
          remaining: null,
          resetTime: null
        },
        lastRequest: new Date(),
        dayCount: 0,
        date: today
      };
      
      // Essayer de charger les données existantes depuis la base de données
      if (ApiUsage) {
        try {
          const existingData = await ApiUsage.findOne({
            api,
            endpoint,
            date: {
              $gte: today,
              $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
            }
          });
          
          if (existingData) {
            this.usageCache[cacheKey] = {
              api: existingData.api,
              endpoint: existingData.endpoint,
              requestCount: existingData.requestCount,
              errorCount: existingData.errorCount,
              quota: existingData.quota,
              lastRequest: existingData.lastRequest,
              dayCount: existingData.dayCount,
              date: existingData.date
            };
          }
        } catch (error) {
          console.error(`Erreur lors de la récupération des données d'utilisation pour ${api}/${endpoint}:`, error);
        }
      }
    }
    
    // Mettre à jour les compteurs
    const usageData = this.usageCache[cacheKey];
    usageData.requestCount++;
    usageData.lastRequest = new Date();
    
    if (isError) {
      usageData.errorCount++;
    }
    
    // Extraire les informations de quota de la réponse si disponible
    if (response) {
      // Format différent selon l'API
      switch(api) {
        case 'strava':
          if (response.headers && response.headers['x-ratelimit-limit']) {
            usageData.quota.total = parseInt(response.headers['x-ratelimit-limit'], 10);
            usageData.quota.remaining = parseInt(response.headers['x-ratelimit-remaining'], 10);
            
            // Strava fournit une date d'expiration en secondes depuis l'époque Unix
            if (response.headers['x-ratelimit-reset']) {
              usageData.quota.resetTime = new Date(parseInt(response.headers['x-ratelimit-reset'], 10) * 1000);
            }
          }
          break;
          
        case 'openweather':
          // OpenWeatherMap fournit des infos dans les en-têtes standards
          if (response.headers && response.headers['x-ratelimit-remaining']) {
            usageData.quota.remaining = parseInt(response.headers['x-ratelimit-remaining'], 10);
          }
          break;
          
        case 'openai':
        case 'claude':
          // Pour les API d'IA, suivre l'utilisation des tokens
          if (tokenCount > 0) {
            usageData.dayCount += tokenCount;
          }
          break;
      }
    }
    
    // Sauvegarder dans la base de données si disponible
    if (ApiUsage) {
      try {
        await ApiUsage.findOneAndUpdate(
          {
            api,
            endpoint,
            date: {
              $gte: today,
              $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
            }
          },
          usageData,
          { upsert: true, new: true }
        );
      } catch (error) {
        console.error(`Erreur lors de l'enregistrement des données d'utilisation pour ${api}/${endpoint}:`, error);
      }
    }
    
    // Sauvegarder localement en cas de problème avec la base de données
    this.saveToLocalLog(usageData);
    
    // Vérifier si des alertes doivent être envoyées
    this.checkQuotaThresholds(usageData);
    
    return usageData;
  }
  
  /**
   * Sauvegarde les données d'utilisation dans un fichier de log local
   * @param {object} usageData - Données d'utilisation de l'API
   */
  saveToLocalLog(usageData) {
    const date = new Date(usageData.date).toISOString().split('T')[0];
    const logFile = path.join(this.logDir, `${date}-${usageData.api}.log`);
    
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        ...usageData
      };
      
      fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
    } catch (error) {
      console.error(`Erreur lors de l'écriture du log local pour ${usageData.api}:`, error);
    }
  }
  
  /**
   * Vérifie si les seuils de quota sont atteints et envoie des alertes si nécessaire
   * @param {object} usageData - Données d'utilisation de l'API
   */
  checkQuotaThresholds(usageData) {
    const { api, endpoint, quota, requestCount, dayCount } = usageData;
    const config = this.config[api];
    
    if (!config) return;
    
    let usagePercentage = 0;
    let limitType = '';
    
    // Calcul du pourcentage d'utilisation
    if (quota.total && quota.remaining) {
      usagePercentage = (quota.total - quota.remaining) / quota.total;
      limitType = 'limit';
    } else if (config.dailyLimit && requestCount) {
      usagePercentage = requestCount / config.dailyLimit;
      limitType = 'count';
    } else if (config.costPerToken && dayCount) {
      // Pour les API d'IA, calculer le coût estimé
      const dailyCost = (dayCount * config.costPerToken).toFixed(2);
      // Supposons une limite quotidienne de $10
      usagePercentage = dailyCost / 10;
      limitType = 'cost';
    }
    
    // Vérifier les seuils et envoyer des alertes
    if (usagePercentage >= config.thresholds.critical) {
      this.sendAlert('critical', api, endpoint, usagePercentage, limitType);
    } else if (usagePercentage >= config.thresholds.warning) {
      this.sendAlert('warning', api, endpoint, usagePercentage, limitType);
    }
  }
  
  /**
   * Envoie une alerte par email et/ou console
   * @param {string} level - Niveau d'alerte (warning, critical)
   * @param {string} api - Nom de l'API
   * @param {string} endpoint - Point d'accès de l'API
   * @param {number} percentage - Pourcentage d'utilisation
   * @param {string} limitType - Type de limite (limit, count, cost)
   */
  sendAlert(level, api, endpoint, percentage, limitType) {
    const percentFormatted = (percentage * 100).toFixed(1);
    const message = `[${level.toUpperCase()}] Utilisation élevée de l'API ${api} (${endpoint}): ${percentFormatted}% du quota ${limitType}`;
    
    // Toujours logger dans la console
    console.warn(message);
    
    // Si configuré, envoyer un email
    if (this.mailer && process.env.ALERT_EMAIL) {
      this.mailer.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.ALERT_EMAIL,
        subject: `[Dashboard Cycliste] Alerte Quota API ${api}`,
        text: `
Alerte d'utilisation d'API

Niveau: ${level}
API: ${api}
Endpoint: ${endpoint}
Utilisation: ${percentFormatted}% du quota ${limitType}
Date: ${new Date().toISOString()}

Cette alerte est envoyée automatiquement par le système de surveillance des quotas API.
        `
      }, (error) => {
        if (error) {
          console.error('Erreur lors de l\'envoi de l\'email d\'alerte:', error);
        }
      });
    }
  }
  
  /**
   * Analyse l'utilisation des API et envoie des alertes globales si nécessaire
   */
  async analyzeUsageAndAlert() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let report = {
      timestamp: new Date().toISOString(),
      status: 'ok',
      apis: {}
    };
    
    // Collecter les données pour chaque API
    for (const api of Object.keys(this.config)) {
      let apiTotal = 0;
      let apiErrors = 0;
      
      // Récupérer depuis la base de données si disponible
      if (ApiUsage) {
        try {
          const apiData = await ApiUsage.aggregate([
            {
              $match: {
                api,
                date: {
                  $gte: today,
                  $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                }
              }
            },
            {
              $group: {
                _id: null,
                totalRequests: { $sum: '$requestCount' },
                totalErrors: { $sum: '$errorCount' },
                endpoints: { $push: { endpoint: '$endpoint', count: '$requestCount' } }
              }
            }
          ]);
          
          if (apiData.length > 0) {
            apiTotal = apiData[0].totalRequests;
            apiErrors = apiData[0].totalErrors;
            
            report.apis[api] = {
              totalRequests: apiTotal,
              errorRate: apiTotal > 0 ? (apiErrors / apiTotal * 100).toFixed(1) + '%' : '0%',
              quota: {
                daily: this.config[api].dailyLimit || 'N/A',
                used: (apiTotal / (this.config[api].dailyLimit || 1) * 100).toFixed(1) + '%'
              },
              endpoints: apiData[0].endpoints.sort((a, b) => b.count - a.count)
            };
          }
        } catch (error) {
          console.error(`Erreur lors de l'analyse des données pour ${api}:`, error);
        }
      } else {
        // Fallback sur les données en cache
        const apiEntries = Object.values(this.usageCache).filter(entry => entry.api === api);
        apiTotal = apiEntries.reduce((sum, entry) => sum + entry.requestCount, 0);
        apiErrors = apiEntries.reduce((sum, entry) => sum + entry.errorCount, 0);
        
        report.apis[api] = {
          totalRequests: apiTotal,
          errorRate: apiTotal > 0 ? (apiErrors / apiTotal * 100).toFixed(1) + '%' : '0%',
          quota: {
            daily: this.config[api].dailyLimit || 'N/A',
            used: (apiTotal / (this.config[api].dailyLimit || 1) * 100).toFixed(1) + '%'
          },
          endpoints: apiEntries.map(entry => ({
            endpoint: entry.endpoint,
            count: entry.requestCount
          })).sort((a, b) => b.count - a.count)
        };
      }
      
      // Déterminer si un API a un problème
      if (apiErrors > 0 && (apiTotal > 0 && apiErrors / apiTotal > 0.1)) {
        report.status = 'warning';
      }
      
      if (apiTotal > 0 && this.config[api].dailyLimit && apiTotal >= this.config[api].dailyLimit * 0.9) {
        report.status = 'critical';
      }
    }
    
    // Enregistrer le rapport
    const reportFile = path.join(this.logDir, `hourly-report-${new Date().toISOString().replace(/:/g, '-')}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    // Envoyer une alerte globale si nécessaire
    if (report.status !== 'ok' && this.mailer && process.env.ALERT_EMAIL) {
      this.mailer.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.ALERT_EMAIL,
        subject: `[Dashboard Cycliste] Rapport d'utilisation API - ${report.status.toUpperCase()}`,
        text: `
Rapport d'utilisation des API

Statut global: ${report.status.toUpperCase()}
Date: ${report.timestamp}

Détails:
${Object.keys(report.apis).map(api => `
${api.toUpperCase()}:
  Requêtes totales: ${report.apis[api].totalRequests}
  Taux d'erreur: ${report.apis[api].errorRate}
  Quota utilisé: ${report.apis[api].quota.used} (sur ${report.apis[api].quota.daily} quotidien)
  
  Top 3 Endpoints:
    ${report.apis[api].endpoints.slice(0, 3).map(e => `${e.endpoint}: ${e.count} requêtes`).join('\n    ')}
`).join('\n')}

Ce rapport est généré automatiquement par le système de surveillance des quotas API.
        `
      }, (error) => {
        if (error) {
          console.error('Erreur lors de l\'envoi de l\'email de rapport:', error);
        }
      });
    }
  }
  
  /**
   * Archive les données d'utilisation quotidienne
   */
  async archiveDailyData() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    console.log(`Archivage des données d'utilisation API pour ${yesterday.toISOString().split('T')[0]}...`);
    
    // Si la base de données est disponible
    if (ApiUsage) {
      // Les données sont déjà dans la base, nous n'avons qu'à exporter pour sauvegarde
      try {
        const data = await ApiUsage.find({
          date: {
            $gte: yesterday,
            $lt: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000)
          }
        });
        
        if (data.length > 0) {
          const archiveFile = path.join(this.logDir, `archive-${yesterday.toISOString().split('T')[0]}.json`);
          fs.writeFileSync(archiveFile, JSON.stringify(data, null, 2));
        }
      } catch (error) {
        console.error('Erreur lors de l\'archivage des données:', error);
      }
    }
    
    // Réinitialiser le cache pour les entrées d'hier
    Object.keys(this.usageCache).forEach(key => {
      const date = new Date(this.usageCache[key].date);
      if (date.getTime() === yesterday.getTime()) {
        delete this.usageCache[key];
      }
    });
  }
  
  /**
   * Génère un rapport hebdomadaire d'utilisation des API
   */
  async generateWeeklyReport() {
    console.log('Génération du rapport hebdomadaire d\'utilisation des API...');
    
    const endDate = new Date();
    endDate.setHours(0, 0, 0, 0);
    
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 7);
    
    let report = {
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      summary: {},
      dailyBreakdown: {},
      recommendations: []
    };
    
    // Si la base de données est disponible
    if (ApiUsage) {
      try {
        // Récupérer les données groupées par API
        const apiSummary = await ApiUsage.aggregate([
          {
            $match: {
              date: { $gte: startDate, $lt: endDate }
            }
          },
          {
            $group: {
              _id: '$api',
              totalRequests: { $sum: '$requestCount' },
              totalErrors: { $sum: '$errorCount' },
              avgDailyRequests: { $avg: '$requestCount' },
              topEndpoints: { $push: { endpoint: '$endpoint', count: '$requestCount' } }
            }
          }
        ]);
        
        // Récupérer la répartition quotidienne
        const dailyData = await ApiUsage.aggregate([
          {
            $match: {
              date: { $gte: startDate, $lt: endDate }
            }
          },
          {
            $group: {
              _id: {
                date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                api: '$api'
              },
              totalRequests: { $sum: '$requestCount' },
              totalErrors: { $sum: '$errorCount' }
            }
          },
          {
            $sort: { '_id.date': 1, '_id.api': 1 }
          }
        ]);
        
        // Formater les données pour le rapport
        apiSummary.forEach(api => {
          report.summary[api._id] = {
            totalRequests: api.totalRequests,
            errorRate: api.totalRequests > 0 ? (api.totalErrors / api.totalRequests * 100).toFixed(1) + '%' : '0%',
            avgDailyRequests: Math.round(api.avgDailyRequests),
            topEndpoints: api.topEndpoints
              .sort((a, b) => b.count - a.count)
              .slice(0, 5)
          };
          
          // Générer des recommandations
          if (api.totalRequests > 0) {
            const dailyLimit = this.config[api._id]?.dailyLimit || Infinity;
            const avgUsagePercent = (api.avgDailyRequests / dailyLimit * 100);
            
            if (avgUsagePercent > 80) {
              report.recommendations.push({
                api: api._id,
                severity: 'high',
                message: `L'utilisation moyenne de l'API ${api._id} est de ${avgUsagePercent.toFixed(1)}% du quota quotidien. Envisager d'optimiser ou d'augmenter le quota.`
              });
            } else if (avgUsagePercent > 50) {
              report.recommendations.push({
                api: api._id,
                severity: 'medium',
                message: `L'utilisation moyenne de l'API ${api._id} approche 50% du quota quotidien. Surveiller l'évolution.`
              });
            }
            
            if (api.totalErrors / api.totalRequests > 0.05) {
              report.recommendations.push({
                api: api._id,
                severity: 'high',
                message: `Le taux d'erreur pour l'API ${api._id} est de ${(api.totalErrors / api.totalRequests * 100).toFixed(1)}%. Investiguer les causes.`
              });
            }
          }
        });
        
        // Organiser les données quotidiennes
        dailyData.forEach(day => {
          const dateStr = day._id.date;
          if (!report.dailyBreakdown[dateStr]) {
            report.dailyBreakdown[dateStr] = {};
          }
          
          report.dailyBreakdown[dateStr][day._id.api] = {
            requests: day.totalRequests,
            errors: day.totalErrors
          };
        });
        
        // Enregistrer le rapport
        const reportFile = path.join(this.logDir, `weekly-report-${endDate.toISOString().split('T')[0]}.json`);
        fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
        
        // Envoyer le rapport par email si configuré
        if (this.mailer && process.env.REPORT_EMAIL) {
          this.sendWeeklyReportEmail(report);
        }
      } catch (error) {
        console.error('Erreur lors de la génération du rapport hebdomadaire:', error);
      }
    } else {
      console.warn('Base de données non disponible, impossible de générer le rapport hebdomadaire');
    }
  }
  
  /**
   * Envoie le rapport hebdomadaire par email
   * @param {object} report - Rapport hebdomadaire
   */
  sendWeeklyReportEmail(report) {
    const startDateFormatted = new Date(report.period.start).toLocaleDateString();
    const endDateFormatted = new Date(report.period.end).toLocaleDateString();
    
    let emailText = `
Rapport hebdomadaire d'utilisation des API - ${startDateFormatted} au ${endDateFormatted}

RÉSUMÉ

${Object.keys(report.summary).map(api => `
${api.toUpperCase()}:
  Requêtes totales: ${report.summary[api].totalRequests}
  Taux d'erreur: ${report.summary[api].errorRate}
  Moyenne quotidienne: ${report.summary[api].avgDailyRequests}
  
  Top 5 Endpoints:
    ${report.summary[api].topEndpoints.map(e => `${e.endpoint}: ${e.count} requêtes`).join('\n    ')}
`).join('\n')}

RECOMMANDATIONS

${report.recommendations.length > 0 
  ? report.recommendations.map(rec => `[${rec.severity.toUpperCase()}] ${rec.message}`).join('\n')
  : 'Aucune recommandation particulière pour cette période.'}

Ce rapport est généré automatiquement par le système de surveillance des quotas API.
    `;
    
    this.mailer.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.REPORT_EMAIL,
      subject: `[Dashboard Cycliste] Rapport Hebdomadaire API - ${startDateFormatted} au ${endDateFormatted}`,
      text: emailText
    }, (error) => {
      if (error) {
        console.error('Erreur lors de l\'envoi de l\'email de rapport hebdomadaire:', error);
      } else {
        console.log('Rapport hebdomadaire envoyé avec succès');
      }
    });
  }
  
  /**
   * Génère un middleware Express pour suivre automatiquement l'utilisation des API
   * @param {string} api - Nom de l'API
   * @returns {function} Middleware Express
   */
  createTrackingMiddleware(api) {
    return (req, res, next) => {
      // Capturer la méthode d'origine pour pouvoir surveiller la réponse
      const originalSend = res.send;
      
      res.send = function(body) {
        // Extraire l'endpoint à partir de l'URL
        const endpoint = req.baseUrl + req.path;
        
        // Vérifier si c'est une erreur
        const isError = res.statusCode >= 400;
        
        // Suivre l'utilisation
        this.trackApiUsage(api, endpoint, res, isError);
        
        // Appeler la méthode d'origine
        return originalSend.call(this, body);
      }.bind(this);
      
      next();
    };
  }
}

// Exporter une instance unique
module.exports = new ApiQuotaMonitor();
