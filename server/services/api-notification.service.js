/**
 * Service de notification pour les alertes d'API
 * Envoie des notifications par email et SMS pour les alertes critiques
 */
const nodemailer = require('nodemailer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Charger les variables d'environnement
dotenv.config();

class ApiNotificationService {
  constructor() {
    this.notificationHistory = new Map();
    this.cooldownPeriods = {
      email: 3600000, // 1 heure en millisecondes
      sms: 7200000,   // 2 heures en millisecondes
      slack: 1800000  // 30 minutes en millisecondes
    };
    
    // Configuration email
    this.emailConfig = {
      enabled: process.env.EMAIL_NOTIFICATIONS_ENABLED === 'true',
      from: process.env.EMAIL_FROM || 'alerts@cyclisme-europe.eu',
      to: process.env.EMAIL_ALERTS_TO || 'admin@cyclisme-europe.eu',
      smtpHost: process.env.SMTP_HOST || 'smtp.example.com',
      smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
      smtpUser: process.env.SMTP_USER,
      smtpPass: process.env.SMTP_PASS
    };
    
    // Configuration SMS (Twilio)
    this.smsConfig = {
      enabled: process.env.SMS_NOTIFICATIONS_ENABLED === 'true',
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      fromNumber: process.env.TWILIO_FROM_NUMBER,
      toNumber: process.env.SMS_ALERTS_TO
    };
    
    // Configuration Slack
    this.slackConfig = {
      enabled: process.env.SLACK_NOTIFICATIONS_ENABLED === 'true',
      webhookUrl: process.env.SLACK_WEBHOOK_URL,
      channel: process.env.SLACK_CHANNEL || '#api-alerts'
    };
    
    // Initialiser les transporteurs
    this.initializeTransporters();
    
    console.log('Service de notification API initialisé');
  }
  
  /**
   * Initialise les transporteurs de notification
   */
  initializeTransporters() {
    // Transporteur email
    if (this.emailConfig.enabled) {
      try {
        this.emailTransporter = nodemailer.createTransport({
          host: this.emailConfig.smtpHost,
          port: this.emailConfig.smtpPort,
          secure: this.emailConfig.smtpPort === 465,
          auth: {
            user: this.emailConfig.smtpUser,
            pass: this.emailConfig.smtpPass
          }
        });
        
        console.log('Transporteur email initialisé');
      } catch (error) {
        console.error('Erreur lors de l\'initialisation du transporteur email:', error);
      }
    }
    
    // Pour SMS et Slack, nous utiliserons axios au moment de l'envoi
  }
  
  /**
   * Envoie une alerte par tous les canaux activés
   * @param {Object} alert - Les données de l'alerte
   * @param {Array} channels - Les canaux à utiliser ['email', 'sms', 'slack']
   */
  async sendAlert(alert, channels = ['email']) {
    try {
      // Vérifier le délai de refroidissement pour cette alerte et ces canaux
      const canSend = this.checkCooldown(alert, channels);
      
      if (!canSend) {
        console.log(`Alerte "${alert.subject}" ignorée en raison du délai de refroidissement`);
        return;
      }
      
      // Journaliser l'alerte
      this.logAlert(alert);
      
      // Envoyer par les canaux sélectionnés
      const promises = [];
      
      if (channels.includes('email') && this.emailConfig.enabled) {
        promises.push(this.sendEmailAlert(alert));
      }
      
      if (channels.includes('sms') && this.smsConfig.enabled) {
        promises.push(this.sendSmsAlert(alert));
      }
      
      if (channels.includes('slack') && this.slackConfig.enabled) {
        promises.push(this.sendSlackAlert(alert));
      }
      
      // Attendre que toutes les notifications soient envoyées
      await Promise.all(promises);
      
      // Mettre à jour l'historique des notifications
      this.updateNotificationHistory(alert, channels);
      
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'envoi des alertes:', error);
      return false;
    }
  }
  
  /**
   * Vérifie le délai de refroidissement pour une alerte
   * @param {Object} alert - Les données de l'alerte
   * @param {Array} channels - Les canaux à vérifier
   * @returns {Boolean} - True si l'alerte peut être envoyée
   */
  checkCooldown(alert, channels) {
    const now = Date.now();
    const alertKey = `${alert.apiName}-${alert.type}`;
    
    // Si cette alerte n'a jamais été envoyée, autoriser l'envoi
    if (!this.notificationHistory.has(alertKey)) {
      return true;
    }
    
    const history = this.notificationHistory.get(alertKey);
    let canSend = false;
    
    // Vérifier chaque canal
    for (const channel of channels) {
      const lastSent = history[channel] || 0;
      const cooldownPeriod = this.cooldownPeriods[channel] || 3600000;
      
      // Si le délai de refroidissement est passé pour au moins un canal, autoriser l'envoi
      if (now - lastSent > cooldownPeriod) {
        canSend = true;
        break;
      }
    }
    
    return canSend;
  }
  
  /**
   * Met à jour l'historique des notifications
   * @param {Object} alert - Les données de l'alerte
   * @param {Array} channels - Les canaux utilisés
   */
  updateNotificationHistory(alert, channels) {
    const now = Date.now();
    const alertKey = `${alert.apiName}-${alert.type}`;
    
    let history = this.notificationHistory.get(alertKey) || {};
    
    for (const channel of channels) {
      history[channel] = now;
    }
    
    this.notificationHistory.set(alertKey, history);
  }
  
  /**
   * Envoie une alerte par email
   * @param {Object} alert - Les données de l'alerte
   */
  async sendEmailAlert(alert) {
    if (!this.emailTransporter) {
      console.error('Transporteur email non initialisé');
      return false;
    }
    
    try {
      // Construire le contenu HTML de l'email
      let htmlContent = `
        <h2>${alert.subject}</h2>
        <p>${alert.message}</p>
        <h3>Détails :</h3>
        <ul>
      `;
      
      for (const [key, value] of Object.entries(alert.details || {})) {
        htmlContent += `<li><strong>${key}</strong>: ${value}</li>`;
      }
      
      htmlContent += `
        </ul>
        <p>Date et heure: ${new Date().toLocaleString()}</p>
        <hr>
        <p><em>Ce message a été généré automatiquement par le système de monitoring du Tableau de Bord Européen de Cyclisme.</em></p>
      `;
      
      // Envoyer l'email
      const mailOptions = {
        from: this.emailConfig.from,
        to: this.emailConfig.to,
        subject: alert.subject,
        html: htmlContent
      };
      
      const result = await this.emailTransporter.sendMail(mailOptions);
      console.log(`Email d'alerte envoyé: ${result.messageId}`);
      
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email d\'alerte:', error);
      return false;
    }
  }
  
  /**
   * Envoie une alerte par SMS (Twilio)
   * @param {Object} alert - Les données de l'alerte
   */
  async sendSmsAlert(alert) {
    if (!this.smsConfig.enabled) {
      return false;
    }
    
    try {
      // Construire le message SMS (court)
      const message = `ALERTE API: ${alert.subject} - ${alert.message}`;
      
      // Utiliser l'API Twilio pour envoyer le SMS
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${this.smsConfig.accountSid}/Messages.json`;
      
      const params = new URLSearchParams();
      params.append('To', this.smsConfig.toNumber);
      params.append('From', this.smsConfig.fromNumber);
      params.append('Body', message);
      
      const response = await axios.post(twilioUrl, params, {
        auth: {
          username: this.smsConfig.accountSid,
          password: this.smsConfig.authToken
        }
      });
      
      console.log(`SMS d'alerte envoyé: ${response.data.sid}`);
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'envoi du SMS d\'alerte:', error);
      return false;
    }
  }
  
  /**
   * Envoie une alerte sur Slack
   * @param {Object} alert - Les données de l'alerte
   */
  async sendSlackAlert(alert) {
    if (!this.slackConfig.enabled) {
      return false;
    }
    
    try {
      // Déterminer la couleur en fonction du type d'alerte
      let color = '#36a64f'; // Vert par défaut
      
      if (alert.type.includes('error') || alert.type.includes('critical')) {
        color = '#ff0000'; // Rouge pour les erreurs critiques
      } else if (alert.type.includes('warning') || alert.type.includes('quota')) {
        color = '#ffcc00'; // Jaune pour les avertissements
      }
      
      // Construire les champs pour le bloc Slack
      const fields = [
        {
          title: 'API',
          value: alert.apiName,
          short: true
        },
        {
          title: 'Type',
          value: alert.type,
          short: true
        }
      ];
      
      // Ajouter les détails
      if (alert.details) {
        for (const [key, value] of Object.entries(alert.details)) {
          fields.push({
            title: key,
            value: value.toString(),
            short: true
          });
        }
      }
      
      // Créer le payload Slack
      const payload = {
        channel: this.slackConfig.channel,
        attachments: [
          {
            fallback: alert.message,
            color: color,
            pretext: 'Nouvelle alerte du système de monitoring API',
            title: alert.subject,
            text: alert.message,
            fields: fields,
            footer: 'Tableau de Bord Européen de Cyclisme',
            footer_icon: 'https://cyclisme-europe.eu/favicon.ico',
            ts: Math.floor(Date.now() / 1000)
          }
        ]
      };
      
      // Envoyer à Slack via le webhook
      await axios.post(this.slackConfig.webhookUrl, payload);
      
      console.log(`Alerte Slack envoyée au canal ${this.slackConfig.channel}`);
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'alerte Slack:', error);
      return false;
    }
  }
  
  /**
   * Journalise une alerte dans les fichiers de log
   * @param {Object} alert - Les données de l'alerte
   */
  logAlert(alert) {
    try {
      const logPath = path.resolve(process.cwd(), 'logs/alerts.log');
      const logDir = path.dirname(logPath);
      
      // Créer le répertoire des logs s'il n'existe pas
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      
      const timestamp = new Date().toISOString();
      const logEntry = {
        timestamp,
        ...alert
      };
      
      fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');
    } catch (error) {
      console.error('Erreur lors de la journalisation de l\'alerte:', error);
    }
  }
  
  /**
   * Crée une alerte pour les quotas API
   * @param {String} apiName - Nom de l'API
   * @param {Number} percentUsed - Pourcentage utilisé
   * @param {Number} remaining - Appels restants
   * @param {String} resetTime - Heure de réinitialisation
   */
  createQuotaAlert(apiName, percentUsed, remaining, resetTime) {
    let severity = 'warning';
    let channels = ['email'];
    
    // Déterminer la gravité et les canaux
    if (percentUsed >= 95) {
      severity = 'critical';
      channels = ['email', 'sms', 'slack'];
    } else if (percentUsed >= 85) {
      severity = 'high';
      channels = ['email', 'slack'];
    }
    
    const alert = {
      apiName,
      type: `quota_${severity}`,
      subject: `Alerte Quota API - ${apiName} (${percentUsed}%)`,
      message: `L'API ${apiName} a atteint ${percentUsed}% de son quota (${remaining} appels restants)`,
      details: {
        percentUsed: `${percentUsed}%`,
        remaining,
        resetTime
      }
    };
    
    this.sendAlert(alert, channels);
  }
  
  /**
   * Crée une alerte pour les erreurs API
   * @param {String} apiName - Nom de l'API
   * @param {String} errorMessage - Message d'erreur
   * @param {Object} details - Détails supplémentaires
   */
  createErrorAlert(apiName, errorMessage, details = {}) {
    const alert = {
      apiName,
      type: 'error',
      subject: `Erreur API - ${apiName}`,
      message: errorMessage,
      details
    };
    
    this.sendAlert(alert, ['email', 'slack']);
  }
  
  /**
   * Crée une alerte pour les temps de réponse élevés
   * @param {String} apiName - Nom de l'API
   * @param {Number} responseTime - Temps de réponse en ms
   * @param {Object} details - Détails supplémentaires
   */
  createLatencyAlert(apiName, responseTime, details = {}) {
    const alert = {
      apiName,
      type: 'latency',
      subject: `Latence Élevée - ${apiName}`,
      message: `L'API ${apiName} montre une latence élevée (${responseTime} ms)`,
      details: {
        responseTime,
        threshold: '2000 ms',
        ...details
      }
    };
    
    this.sendAlert(alert, ['email', 'slack']);
  }
  
  /**
   * Crée une alerte pour les conditions des cols
   * @param {String} colName - Nom du col
   * @param {String} status - Statut du col
   * @param {String} message - Message d'alerte
   * @param {Object} details - Détails supplémentaires
   */
  createColConditionAlert(colName, status, message, details = {}) {
    let severity = 'info';
    let channels = ['email'];
    
    // Déterminer la gravité en fonction du statut
    if (status === 'closed') {
      severity = 'high';
      channels = ['email', 'slack'];
    } else if (status === 'difficult') {
      severity = 'warning';
    }
    
    const alert = {
      apiName: 'ColsMonitor',
      type: `col_condition_${severity}`,
      subject: `Alerte Condition - ${colName}`,
      message,
      details: {
        colName,
        status,
        ...details
      }
    };
    
    this.sendAlert(alert, channels);
  }
}

// Exporter une instance singleton du service
const apiNotificationService = new ApiNotificationService();
module.exports = apiNotificationService;
