const mongoose = require('mongoose');
const cron = require('node-cron');
const path = require('path');
const fs = require('fs');

// Configuration du logger
const logger = {
  info: (message) => {
    console.log(`[INFO] ${new Date().toISOString()}: ${message}`);
    appendToLogFile('info', message);
  },
  warn: (message) => {
    console.warn(`[WARN] ${new Date().toISOString()}: ${message}`);
    appendToLogFile('warn', message);
  },
  error: (message) => {
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`);
    appendToLogFile('error', message);
  }
};

// Fonction pour ajouter des entrées au fichier de log
function appendToLogFile(level, message) {
  const logDir = path.join(__dirname, '../logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  const logFile = path.join(logDir, `api-monitoring-${new Date().toISOString().split('T')[0]}.log`);
  const logEntry = `${new Date().toISOString()} [${level.toUpperCase()}] ${message}\n`;
  
  fs.appendFileSync(logFile, logEntry);
}

// Schéma pour les appels API
const ApiCallSchema = new mongoose.Schema({
  api: {
    type: String,
    required: true,
    index: true
  },
  endpoint: {
    type: String,
    required: true
  },
  method: {
    type: String,
    required: true,
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  },
  statusCode: {
    type: Number,
    required: true
  },
  responseTime: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  error: {
    type: String
  }
});

// Schéma pour les quotas API
const ApiQuotaSchema = new mongoose.Schema({
  api: {
    type: String,
    required: true,
    unique: true
  },
  dailyLimit: {
    type: Number,
    required: true
  },
  dailyUsage: {
    type: Number,
    default: 0
  },
  minuteLimit: {
    type: Number
  },
  minuteUsage: {
    type: Number,
    default: 0
  },
  resetDate: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Modèles
let ApiCall;
let ApiQuota;

class ApiMonitoringService {
  constructor() {
    this.initialized = false;
  }
  
  async initialize() {
    if (this.initialized) return;
    
    try {
      // Initialiser les modèles seulement si Mongoose est connecté
      if (mongoose.connection.readyState !== 1) {
        logger.warn('Mongoose non connecté. Le service de monitoring fonctionnera en mode limité.');
      } else {
        // Définir les modèles
        ApiCall = mongoose.model('ApiCall', ApiCallSchema);
        ApiQuota = mongoose.model('ApiQuota', ApiQuotaSchema);
        
        // Initialiser les quotas API
        await this.initializeQuotas();
        
        // Planifier la réinitialisation quotidienne des compteurs
        cron.schedule('0 0 * * *', () => {
          this.resetDailyCounters();
        });
        
        // Planifier la génération de rapports quotidiens
        cron.schedule('0 1 * * *', () => {
          this.generateDailyReport();
        });
      }
      
      this.initialized = true;
      logger.info('Service de monitoring API initialisé');
    } catch (error) {
      logger.error(`Erreur lors de l'initialisation du service de monitoring API: ${error.message}`);
    }
  }
  
  // Initialiser les quotas API
  async initializeQuotas() {
    try {
      const apis = [
        { api: 'OpenWeatherMap', dailyLimit: 1000, minuteLimit: 60 },
        { api: 'OpenRouteService', dailyLimit: 2000, minuteLimit: 40 },
        { api: 'Strava', dailyLimit: 2000, minuteLimit: 200 },
        { api: 'Mapbox', dailyLimit: 50000, minuteLimit: 300 },
        { api: 'OpenAI', dailyLimit: 10000, minuteLimit: 500 },
        { api: 'Claude', dailyLimit: 5000, minuteLimit: 250 }
      ];
      
      for (const apiData of apis) {
        await ApiQuota.findOneAndUpdate(
          { api: apiData.api },
          apiData,
          { upsert: true, new: true }
        );
      }
      
      logger.info('Quotas API initialisés');
    } catch (error) {
      logger.error(`Erreur lors de l'initialisation des quotas API: ${error.message}`);
    }
  }
  
  // Enregistrer un appel API
  async logApiCall(apiData) {
    try {
      // Vérifier si Mongoose est connecté
      if (mongoose.connection.readyState !== 1) {
        logger.warn(`Appel API non enregistré (base de données non connectée): ${apiData.api} - ${apiData.endpoint}`);
        return;
      }
      
      // Créer un nouvel enregistrement d'appel API
      const apiCall = new ApiCall({
        api: apiData.api,
        endpoint: apiData.endpoint,
        method: apiData.method,
        statusCode: apiData.statusCode,
        responseTime: apiData.responseTime,
        userId: apiData.userId,
        error: apiData.error
      });
      
      await apiCall.save();
      
      // Mettre à jour les compteurs de quota
      await this.updateQuotaCounters(apiData.api);
      
      // Vérifier si les seuils d'alerte sont atteints
      await this.checkAlertThresholds(apiData.api);
      
      logger.info(`Appel API enregistré: ${apiData.api} - ${apiData.endpoint} (${apiData.statusCode})`);
    } catch (error) {
      logger.error(`Erreur lors de l'enregistrement de l'appel API: ${error.message}`);
    }
  }
  
  // Mettre à jour les compteurs de quota
  async updateQuotaCounters(apiName) {
    try {
      const quota = await ApiQuota.findOne({ api: apiName });
      
      if (!quota) {
        logger.warn(`Quota non trouvé pour l'API ${apiName}`);
        return;
      }
      
      // Incrémenter les compteurs
      quota.dailyUsage += 1;
      quota.minuteUsage += 1;
      quota.lastUpdated = new Date();
      
      await quota.save();
      
      // Réinitialiser le compteur par minute après 1 minute
      setTimeout(async () => {
        try {
          const updatedQuota = await ApiQuota.findOne({ api: apiName });
          if (updatedQuota) {
            updatedQuota.minuteUsage = Math.max(0, updatedQuota.minuteUsage - 1);
            await updatedQuota.save();
          }
        } catch (err) {
          logger.error(`Erreur lors de la mise à jour du compteur par minute: ${err.message}`);
        }
      }, 60000);
    } catch (error) {
      logger.error(`Erreur lors de la mise à jour des compteurs de quota: ${error.message}`);
    }
  }
  
  // Vérifier les seuils d'alerte
  async checkAlertThresholds(apiName) {
    try {
      const quota = await ApiQuota.findOne({ api: apiName });
      
      if (!quota) return;
      
      // Seuils d'alerte (pourcentages)
      const thresholds = {
        daily: 0.8,  // 80% du quota quotidien
        minute: 0.9  // 90% du quota par minute
      };
      
      // Vérifier le seuil quotidien
      if (quota.dailyUsage >= quota.dailyLimit * thresholds.daily) {
        const percentage = Math.round(quota.dailyUsage / quota.dailyLimit * 100);
        logger.warn(`ALERTE: ${apiName} a atteint ${percentage}% de son quota quotidien (${quota.dailyUsage}/${quota.dailyLimit})`);
        // Ici, vous pourriez envoyer une notification ou un email
      }
      
      // Vérifier le seuil par minute
      if (quota.minuteLimit && quota.minuteUsage >= quota.minuteLimit * thresholds.minute) {
        const percentage = Math.round(quota.minuteUsage / quota.minuteLimit * 100);
        logger.warn(`ALERTE: ${apiName} a atteint ${percentage}% de son quota par minute (${quota.minuteUsage}/${quota.minuteLimit})`);
        // Ici, vous pourriez implémenter une stratégie de limitation de débit
      }
    } catch (error) {
      logger.error(`Erreur lors de la vérification des seuils d'alerte: ${error.message}`);
    }
  }
  
  // Réinitialiser les compteurs quotidiens
  async resetDailyCounters() {
    try {
      if (mongoose.connection.readyState !== 1) {
        logger.warn('Réinitialisation des compteurs quotidiens non effectuée (base de données non connectée)');
        return;
      }
      
      await ApiQuota.updateMany({}, { 
        $set: { 
          dailyUsage: 0,
          resetDate: new Date()
        } 
      });
      
      logger.info('Compteurs quotidiens d\'API réinitialisés');
    } catch (error) {
      logger.error(`Erreur lors de la réinitialisation des compteurs quotidiens: ${error.message}`);
    }
  }
  
  // Générer un rapport quotidien
  async generateDailyReport() {
    try {
      if (mongoose.connection.readyState !== 1) {
        logger.warn('Génération du rapport quotidien non effectuée (base de données non connectée)');
        return;
      }
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Agréger les appels API par service
      const apiCalls = await ApiCall.aggregate([
        {
          $match: {
            timestamp: {
              $gte: yesterday,
              $lt: today
            }
          }
        },
        {
          $group: {
            _id: {
              api: '$api',
              statusCode: '$statusCode'
            },
            count: { $sum: 1 },
            avgResponseTime: { $avg: '$responseTime' }
          }
        },
        {
          $group: {
            _id: '$_id.api',
            totalCalls: { $sum: '$count' },
            statusCodes: {
              $push: {
                code: '$_id.statusCode',
                count: '$count',
                avgResponseTime: '$avgResponseTime'
              }
            }
          }
        },
        {
          $sort: { totalCalls: -1 }
        }
      ]);
      
      // Calculer les taux d'erreur
      const report = apiCalls.map(api => {
        const successCalls = api.statusCodes
          .filter(s => s.code >= 200 && s.code < 300)
          .reduce((sum, s) => sum + s.count, 0);
        
        const errorCalls = api.statusCodes
          .filter(s => s.code >= 400)
          .reduce((sum, s) => sum + s.count, 0);
        
        const errorRate = api.totalCalls > 0 ? (errorCalls / api.totalCalls) * 100 : 0;
        
        return {
          api: api._id,
          totalCalls: api.totalCalls,
          successCalls,
          errorCalls,
          errorRate: errorRate.toFixed(2) + '%',
          statusCodes: api.statusCodes.sort((a, b) => a.code - b.code)
        };
      });
      
      // Générer le rapport en format Markdown
      const reportDate = yesterday.toISOString().split('T')[0];
      const reportPath = path.join(__dirname, '../logs', `api-usage-report-${reportDate}.md`);
      
      let reportContent = `# Rapport d'Utilisation des API - ${reportDate}\n\n`;
      
      if (report.length === 0) {
        reportContent += "Aucun appel API enregistré pour cette période.\n";
      } else {
        // Tableau résumé
        reportContent += "## Résumé\n\n";
        reportContent += "| API | Total Appels | Succès | Erreurs | Taux d'Erreur |\n";
        reportContent += "|-----|--------------|--------|---------|--------------|\n";
        
        report.forEach(api => {
          reportContent += `| ${api.api} | ${api.totalCalls} | ${api.successCalls} | ${api.errorCalls} | ${api.errorRate} |\n`;
        });
        
        // Détails par API
        reportContent += "\n## Détails par API\n\n";
        
        report.forEach(api => {
          reportContent += `### ${api.api}\n\n`;
          reportContent += "| Code Status | Nombre | Temps de Réponse Moyen (ms) |\n";
          reportContent += "|-------------|--------|-----------------------------|\n";
          
          api.statusCodes.forEach(status => {
            reportContent += `| ${status.code} | ${status.count} | ${Math.round(status.avgResponseTime)} |\n`;
          });
          
          reportContent += "\n";
        });
      }
      
      // Ajouter des recommandations
      reportContent += "## Recommandations\n\n";
      
      const highErrorAPIs = report.filter(api => parseFloat(api.errorRate) > 5);
      if (highErrorAPIs.length > 0) {
        reportContent += `- Examiner les erreurs pour les API suivantes avec un taux d'erreur élevé: ${highErrorAPIs.map(api => api.api).join(', ')}\n`;
      }
      
      const highUsageAPIs = report.filter(api => api.totalCalls > 1000);
      if (highUsageAPIs.length > 0) {
        reportContent += `- Considérer une mise à niveau du forfait pour les API à forte utilisation: ${highUsageAPIs.map(api => api.api).join(', ')}\n`;
      }
      
      reportContent += "- Surveiller l'évolution des temps de réponse pour détecter d'éventuelles dégradations de performance\n";
      
      // Écrire le rapport dans un fichier
      fs.writeFileSync(reportPath, reportContent);
      
      logger.info(`Rapport quotidien d'utilisation des API généré: ${reportPath}`);
      
      return report;
    } catch (error) {
      logger.error(`Erreur lors de la génération du rapport quotidien: ${error.message}`);
    }
  }
  
  // Obtenir les statistiques d'utilisation des API
  async getApiUsageStats(apiName, period = 'day') {
    try {
      if (mongoose.connection.readyState !== 1) {
        logger.warn('Récupération des statistiques d\'utilisation non effectuée (base de données non connectée)');
        return [];
      }
      
      const now = new Date();
      let startDate;
      
      // Déterminer la période
      switch (period) {
        case 'hour':
          startDate = new Date(now);
          startDate.setHours(now.getHours() - 1);
          break;
        case 'day':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1);
          break;
        default:
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 1);
      }
      
      // Construire la requête
      const match = {
        timestamp: { $gte: startDate }
      };
      
      if (apiName) {
        match.api = apiName;
      }
      
      // Agréger les données
      const stats = await ApiCall.aggregate([
        {
          $match: match
        },
        {
          $group: {
            _id: '$api',
            totalCalls: { $sum: 1 },
            avgResponseTime: { $avg: '$responseTime' },
            minResponseTime: { $min: '$responseTime' },
            maxResponseTime: { $max: '$responseTime' },
            successCount: {
              $sum: {
                $cond: [{ $and: [
                  { $gte: ['$statusCode', 200] },
                  { $lt: ['$statusCode', 300] }
                ]}, 1, 0]
              }
            },
            errorCount: {
              $sum: {
                $cond: [{ $gte: ['$statusCode', 400] }, 1, 0]
              }
            }
          }
        },
        {
          $project: {
            api: '$_id',
            totalCalls: 1,
            avgResponseTime: 1,
            minResponseTime: 1,
            maxResponseTime: 1,
            successCount: 1,
            errorCount: 1,
            successRate: {
              $multiply: [
                { $divide: ['$successCount', { $max: ['$totalCalls', 1] }] },
                100
              ]
            },
            errorRate: {
              $multiply: [
                { $divide: ['$errorCount', { $max: ['$totalCalls', 1] }] },
                100
              ]
            }
          }
        },
        {
          $sort: { totalCalls: -1 }
        }
      ]);
      
      return stats;
    } catch (error) {
      logger.error(`Erreur lors de la récupération des statistiques d'utilisation: ${error.message}`);
      throw error;
    }
  }
  
  // Middleware Express pour enregistrer les appels API
  createMiddleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      
      // Capturer la réponse
      const originalSend = res.send;
      res.send = function (body) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        // Déterminer l'API appelée en fonction du chemin
        let apiName = 'Interne';
        const apiPatterns = [
          { pattern: /\/weather/, api: 'OpenWeatherMap' },
          { pattern: /\/directions/, api: 'OpenRouteService' },
          { pattern: /\/strava/, api: 'Strava' },
          { pattern: /\/mapbox/, api: 'Mapbox' },
          { pattern: /\/openai/, api: 'OpenAI' },
          { pattern: /\/claude/, api: 'Claude' }
        ];
        
        for (const pattern of apiPatterns) {
          if (pattern.pattern.test(req.path)) {
            apiName = pattern.api;
            break;
          }
        }
        
        // Enregistrer l'appel API
        this.logApiCall({
          api: apiName,
          endpoint: req.path,
          method: req.method,
          statusCode: res.statusCode,
          responseTime,
          userId: req.user ? req.user._id : null,
          error: res.statusCode >= 400 ? body : null
        });
        
        return originalSend.apply(res, arguments);
      };
      
      next();
    };
  }
}

// Exporter une instance unique du service
const apiMonitoringService = new ApiMonitoringService();
module.exports = apiMonitoringService;
