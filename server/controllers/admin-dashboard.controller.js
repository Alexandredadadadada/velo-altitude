/**
 * Contrôleur pour le tableau de bord administratif
 * Fournit les données pour le monitoring des API et l'état des services
 */

const apiMonitoringService = require('../services/api-monitoring.service');
const stravaService = require('../services/strava.service');
const { handleApiError } = require('../middleware/error-handler.middleware');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const mongoose = require('mongoose');
const AdminAlert = mongoose.model('AdminAlert', new mongoose.Schema({
  type: String,
  message: String,
  level: { type: String, enum: ['info', 'warning', 'error', 'critical'] },
  timestamp: { type: Date, default: Date.now },
  resolved: { type: Boolean, default: false },
  resolvedAt: Date,
  apiName: String,
  threshold: Number,
  currentValue: Number,
  contactedAdmins: [String]
}));

// Configuration du transport d'email
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Configuration de Twilio pour les SMS (si configuré)
let twilioClient;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

/**
 * Contrôleur pour le tableau de bord administratif
 */
class AdminDashboardController {
  /**
   * Obtient les statistiques d'utilisation des API pour le tableau de bord
   * @param {Request} req - Requête Express
   * @param {Response} res - Réponse Express
   */
  static async getApiUsageStats(req, res) {
    try {
      const { period, apiName } = req.query;
      const stats = await apiMonitoringService.getApiUsageStats(apiName, period);
      
      // Ajouter des métriques de performance
      const enhancedStats = stats.map(stat => ({
        ...stat,
        performanceScore: this._calculatePerformanceScore(stat),
        healthStatus: this._determineHealthStatus(stat)
      }));
      
      res.status(200).json({
        period: period || 'day',
        timestamp: new Date().toISOString(),
        stats: enhancedStats
      });
    } catch (error) {
      handleApiError(error, req, res);
    }
  }

  /**
   * Obtient l'état actuel des services externes
   * @param {Request} req - Requête Express
   * @param {Response} res - Réponse Express
   */
  static async getServicesStatus(req, res) {
    try {
      // Vérifier l'état des services externes
      const services = [
        { name: 'OpenWeatherMap', endpoint: 'api.openweathermap.org' },
        { name: 'OpenRouteService', endpoint: 'api.openrouteservice.org' },
        { name: 'Strava', endpoint: 'www.strava.com/api' },
        { name: 'Mapbox', endpoint: 'api.mapbox.com' },
        { name: 'Claude API', endpoint: 'api.anthropic.com' }
      ];
      
      const statuses = await Promise.all(services.map(async (service) => {
        try {
          const status = await this._checkServiceStatus(service.endpoint);
          return {
            name: service.name,
            status: status.isUp ? 'online' : 'offline',
            responseTime: status.responseTime,
            lastChecked: new Date().toISOString(),
            details: status.details || null
          };
        } catch (err) {
          return {
            name: service.name,
            status: 'unknown',
            error: err.message,
            lastChecked: new Date().toISOString()
          };
        }
      }));
      
      // Vérifier l'état des connexions à la base de données
      const dbStatus = {
        name: 'MongoDB',
        status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        details: {
          connectionState: mongoose.connection.readyState,
          host: mongoose.connection.host,
          name: mongoose.connection.name
        }
      };
      
      // Vérifier l'état des tokens Strava
      const stravaTokensStatus = await stravaService.getTokensStatus();
      
      res.status(200).json({
        timestamp: new Date().toISOString(),
        services: statuses,
        database: dbStatus,
        stravaTokens: stravaTokensStatus
      });
    } catch (error) {
      handleApiError(error, req, res);
    }
  }

  /**
   * Obtient les alertes actives et l'historique récent
   * @param {Request} req - Requête Express
   * @param {Response} res - Réponse Express
   */
  static async getAlerts(req, res) {
    try {
      const { status = 'active', limit = 50 } = req.query;
      
      let query = {};
      if (status === 'active') {
        query.resolved = false;
      } else if (status === 'resolved') {
        query.resolved = true;
      }
      
      const alerts = await AdminAlert.find(query)
        .sort({ timestamp: -1 })
        .limit(parseInt(limit))
        .lean();
      
      res.status(200).json({
        count: alerts.length,
        alerts
      });
    } catch (error) {
      handleApiError(error, req, res);
    }
  }

  /**
   * Marque une alerte comme résolue
   * @param {Request} req - Requête Express
   * @param {Response} res - Réponse Express
   */
  static async resolveAlert(req, res) {
    try {
      const { alertId } = req.params;
      
      const alert = await AdminAlert.findByIdAndUpdate(
        alertId,
        {
          resolved: true,
          resolvedAt: new Date()
        },
        { new: true }
      );
      
      if (!alert) {
        return res.status(404).json({ message: 'Alerte non trouvée' });
      }
      
      res.status(200).json({
        message: 'Alerte marquée comme résolue',
        alert
      });
    } catch (error) {
      handleApiError(error, req, res);
    }
  }

  /**
   * Envoie une alerte par email et/ou SMS aux administrateurs
   * @param {Request} req - Requête Express
   * @param {Response} res - Réponse Express
   */
  static async sendAlert(req, res) {
    try {
      const { message, level, apiName, recipients, sendSms } = req.body;
      
      if (!message || !level) {
        return res.status(400).json({ message: 'Message et niveau requis' });
      }
      
      // Créer l'alerte dans la base de données
      const alert = await AdminAlert.create({
        type: 'manual',
        message,
        level,
        apiName,
        timestamp: new Date(),
        contactedAdmins: recipients
      });
      
      // Envoyer l'email
      const emailSent = await this._sendAlertEmail(alert, recipients);
      
      // Envoyer le SMS si demandé
      let smsSent = false;
      if (sendSms && twilioClient) {
        smsSent = await this._sendAlertSms(alert, recipients);
      }
      
      res.status(200).json({
        message: 'Alerte envoyée avec succès',
        alert,
        emailSent,
        smsSent
      });
    } catch (error) {
      handleApiError(error, req, res);
    }
  }

  /**
   * Obtient le journal d'événements API
   * @param {Request} req - Requête Express
   * @param {Response} res - Réponse Express
   */
  static async getApiEventLog(req, res) {
    try {
      const { startDate, endDate, apiName, limit = 100, statusCode } = req.query;
      
      // Construire la requête
      const query = {};
      
      if (startDate) {
        query.timestamp = { $gte: new Date(startDate) };
      }
      
      if (endDate) {
        if (!query.timestamp) query.timestamp = {};
        query.timestamp.$lte = new Date(endDate);
      }
      
      if (apiName) {
        query.api = apiName;
      }
      
      if (statusCode) {
        query.statusCode = parseInt(statusCode);
      }
      
      // Récupérer les événements depuis la base de données
      const events = await mongoose.model('ApiCall').find(query)
        .sort({ timestamp: -1 })
        .limit(parseInt(limit))
        .lean();
      
      res.status(200).json({
        count: events.length,
        events
      });
    } catch (error) {
      handleApiError(error, req, res);
    }
  }

  /**
   * Configure les seuils d'alerte pour une API
   * @param {Request} req - Requête Express
   * @param {Response} res - Réponse Express
   */
  static async configureAlertThresholds(req, res) {
    try {
      const { apiName } = req.params;
      const { dailyUsageThreshold, errorRateThreshold, responseTimeThreshold, notificationEmails, notificationPhones } = req.body;
      
      // Mettre à jour les seuils dans la base de données
      const updatedConfig = await mongoose.model('ApiAlertConfig').findOneAndUpdate(
        { apiName },
        {
          apiName,
          dailyUsageThreshold,
          errorRateThreshold,
          responseTimeThreshold,
          notificationEmails,
          notificationPhones
        },
        { upsert: true, new: true }
      );
      
      res.status(200).json({
        message: 'Configuration des seuils mise à jour',
        config: updatedConfig
      });
    } catch (error) {
      handleApiError(error, req, res);
    }
  }

  /**
   * Méthodes privées
   */

  /**
   * Calcule un score de performance pour une API
   * @private
   * @param {Object} stat - Statistique d'API
   * @returns {number} Score de performance (0-100)
   */
  static _calculatePerformanceScore(stat) {
    // Facteurs de performance: taux de succès (60%), temps de réponse (40%)
    const successScore = stat.successRate * 0.6;
    
    // Normaliser le temps de réponse (score plus élevé = meilleur)
    // Considérer 50ms comme excellent (100%) et 1000ms comme seuil bas (0%)
    const responseTimeScore = Math.max(0, 100 - (stat.avgResponseTime / 10));
    
    return Math.min(100, Math.round(successScore + (responseTimeScore * 0.4)));
  }

  /**
   * Détermine l'état de santé d'une API
   * @private
   * @param {Object} stat - Statistique d'API
   * @returns {string} État de santé (healthy, warning, critical)
   */
  static _determineHealthStatus(stat) {
    if (stat.errorRate > 20 || stat.avgResponseTime > 2000) {
      return 'critical';
    } else if (stat.errorRate > 5 || stat.avgResponseTime > 1000) {
      return 'warning';
    } else {
      return 'healthy';
    }
  }

  /**
   * Vérifie l'état d'un service externe
   * @private
   * @param {string} endpoint - Point de terminaison du service
   * @returns {Object} Informations sur l'état du service
   */
  static async _checkServiceStatus(endpoint) {
    try {
      const startTime = Date.now();
      const response = await fetch(`https://${endpoint}/status`, {
        method: 'GET',
        timeout: 5000
      });
      const responseTime = Date.now() - startTime;
      
      return {
        isUp: response.status < 500,
        responseTime,
        details: {
          statusCode: response.status,
          statusText: response.statusText
        }
      };
    } catch (error) {
      return {
        isUp: false,
        responseTime: null,
        details: {
          error: error.message
        }
      };
    }
  }

  /**
   * Envoie une alerte par email
   * @private
   * @param {Object} alert - Objet alerte
   * @param {Array<string>} recipients - Destinataires
   * @returns {boolean} Succès de l'envoi
   */
  static async _sendAlertEmail(alert, recipients) {
    try {
      const adminEmails = recipients || (process.env.ADMIN_EMAILS || '').split(',');
      
      if (!adminEmails.length) {
        return false;
      }
      
      const mailOptions = {
        from: `"Monitoring GEC" <${process.env.SMTP_USER}>`,
        to: adminEmails.join(','),
        subject: `[${alert.level.toUpperCase()}] Alerte API ${alert.apiName || ''}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: ${this._getAlertColor(alert.level)}; color: white; padding: 10px; text-align: center;">
              <h2>Alerte ${alert.level.toUpperCase()}</h2>
            </div>
            <div style="padding: 20px; border: 1px solid #ddd;">
              <p><strong>Message:</strong> ${alert.message}</p>
              <p><strong>API concernée:</strong> ${alert.apiName || 'N/A'}</p>
              <p><strong>Date:</strong> ${new Date(alert.timestamp).toLocaleString()}</p>
              ${alert.threshold ? `<p><strong>Seuil:</strong> ${alert.threshold}</p>` : ''}
              ${alert.currentValue ? `<p><strong>Valeur actuelle:</strong> ${alert.currentValue}</p>` : ''}
              <p><strong>ID de l'alerte:</strong> ${alert._id}</p>
              <div style="margin-top: 20px; text-align: center;">
                <a href="${process.env.BASE_URL}/admin/alerts/${alert._id}" 
                   style="background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">
                  Voir les détails
                </a>
              </div>
            </div>
            <div style="background-color: #f1f1f1; padding: 10px; text-align: center; font-size: 12px; color: #666;">
              Ceci est un message automatique du système de monitoring API de Grand Est Cyclisme.
            </div>
          </div>
        `
      };
      
      await emailTransporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error(`Erreur lors de l'envoi de l'email d'alerte: ${error.message}`);
      return false;
    }
  }

  /**
   * Envoie une alerte par SMS
   * @private
   * @param {Object} alert - Objet alerte
   * @param {Array<string>} recipients - Destinataires (numéros de téléphone)
   * @returns {boolean} Succès de l'envoi
   */
  static async _sendAlertSms(alert, recipients) {
    try {
      if (!twilioClient) {
        return false;
      }
      
      const adminPhones = recipients || (process.env.ADMIN_PHONES || '').split(',');
      
      if (!adminPhones.length) {
        return false;
      }
      
      const messageBody = `[${alert.level.toUpperCase()}] API ${alert.apiName || ''}: ${alert.message}`;
      
      // Envoyer un SMS à chaque destinataire
      await Promise.all(adminPhones.map(phone => 
        twilioClient.messages.create({
          body: messageBody,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: phone
        })
      ));
      
      return true;
    } catch (error) {
      console.error(`Erreur lors de l'envoi du SMS d'alerte: ${error.message}`);
      return false;
    }
  }

  /**
   * Obtient la couleur correspondant au niveau d'alerte
   * @private
   * @param {string} level - Niveau d'alerte
   * @returns {string} Code couleur
   */
  static _getAlertColor(level) {
    switch (level) {
      case 'critical':
        return '#FF0000'; // Rouge
      case 'error':
        return '#FF4500'; // Rouge-orange
      case 'warning':
        return '#FFA500'; // Orange
      case 'info':
        return '#007BFF'; // Bleu
      default:
        return '#007BFF'; // Bleu par défaut
    }
  }
}

module.exports = AdminDashboardController;
