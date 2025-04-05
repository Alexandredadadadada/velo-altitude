/**
 * Système de notifications pour la rotation des clés API
 * Dashboard-Velo.com
 */

const nodemailer = require('nodemailer');
const { logger } = require('./logger');

class ApiKeyNotifications {
  constructor(config = {}) {
    this.config = {
      enabled: process.env.API_KEY_NOTIFICATIONS_ENABLED === 'true' || false,
      recipients: process.env.API_KEY_NOTIFICATION_RECIPIENTS?.split(',') || [],
      smtpConfig: {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        }
      },
      from: process.env.EMAIL_FROM || 'Dashboard Velo <notifications@dashboard-velo.com>',
      ...config
    };

    // Initialiser le transporteur SMTP si les notifications sont activées
    if (this.config.enabled && this.config.smtpConfig.host) {
      this.transporter = nodemailer.createTransport(this.config.smtpConfig);
      logger.info('Système de notifications pour les clés API initialisé');
    } else if (this.config.enabled) {
      logger.warn('Notifications de clés API activées mais configuration SMTP manquante');
    }
  }

  /**
   * Envoie une notification de rotation de clé
   * @param {string} serviceName Nom du service
   * @param {string} event Type d'événement (rotation, expiration, etc.)
   * @param {Object} data Données supplémentaires
   * @returns {Promise<boolean>} Succès de l'envoi
   */
  async sendNotification(serviceName, event, data = {}) {
    if (!this.config.enabled || !this.transporter) {
      logger.debug(`Notification de clé API non envoyée (désactivée): ${serviceName} - ${event}`);
      return false;
    }

    if (!this.config.recipients.length) {
      logger.warn(`Aucun destinataire configuré pour les notifications de clés API`);
      return false;
    }

    try {
      const subject = this._getSubject(serviceName, event);
      const content = this._generateContent(serviceName, event, data);

      const mailOptions = {
        from: this.config.from,
        to: this.config.recipients.join(', '),
        subject,
        html: content
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Notification de clé API envoyée: ${serviceName} - ${event}`);
      return true;
    } catch (error) {
      logger.error(`Erreur lors de l'envoi de la notification de clé API: ${error.message}`, { 
        error, 
        serviceName, 
        event 
      });
      return false;
    }
  }

  /**
   * Génère l'objet de l'email
   * @private
   */
  _getSubject(serviceName, event) {
    const prefix = '[Dashboard-Velo API]';
    
    switch (event) {
      case 'rotation':
        return `${prefix} Rotation de clé API ${serviceName}`;
      case 'expiration':
        return `${prefix} ALERTE: Expiration imminente de clé API ${serviceName}`;
      case 'quota_exceeded':
        return `${prefix} ALERTE: Quota dépassé pour ${serviceName}`;
      case 'error':
        return `${prefix} ERREUR: Problème avec la clé API ${serviceName}`;
      default:
        return `${prefix} Notification de clé API ${serviceName}`;
    }
  }

  /**
   * Génère le contenu HTML de l'email
   * @private
   */
  _generateContent(serviceName, event, data) {
    const timestamp = new Date().toLocaleString('fr-FR', { 
      timeZone: 'Europe/Paris' 
    });
    
    const environment = process.env.NODE_ENV || 'development';
    const serverInfo = process.env.SERVER_NAME || 'Non spécifié';
    
    let title, message, actionNeeded;
    
    switch (event) {
      case 'rotation':
        title = `Rotation de clé API ${serviceName}`;
        message = `Une rotation de clé API a été effectuée pour le service <strong>${serviceName}</strong>.`;
        actionNeeded = 'Aucune action n\'est requise. Cette notification est informative.';
        break;
      case 'expiration':
        title = `Expiration imminente de clé API ${serviceName}`;
        message = `La clé API pour le service <strong>${serviceName}</strong> expirera bientôt.`;
        actionNeeded = 'Veuillez générer une nouvelle clé API et la configurer dans le système.';
        break;
      case 'quota_exceeded':
        title = `Quota dépassé pour ${serviceName}`;
        message = `Le quota d'utilisation de l'API <strong>${serviceName}</strong> a été dépassé.`;
        actionNeeded = 'Vérifiez l\'utilisation de l\'API et envisagez d\'augmenter votre forfait ou de limiter l\'utilisation.';
        break;
      case 'error':
        title = `Erreur avec la clé API ${serviceName}`;
        message = `Une erreur est survenue avec la clé API du service <strong>${serviceName}</strong>.`;
        actionNeeded = 'Vérifiez les journaux du serveur pour plus de détails et résolvez le problème dès que possible.';
        break;
      default:
        title = `Notification de clé API ${serviceName}`;
        message = `Une notification concernant la clé API du service <strong>${serviceName}</strong> a été déclenchée.`;
        actionNeeded = 'Veuillez vérifier le système pour plus de détails.';
    }
    
    // Construire le contenu HTML
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
          .container { padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
          .header { background-color: #f5f5f5; padding: 10px; border-radius: 5px 5px 0 0; border-bottom: 2px solid #0056b3; }
          .content { padding: 20px 0; }
          .footer { font-size: 12px; color: #777; border-top: 1px solid #ddd; padding-top: 10px; margin-top: 20px; }
          .alert { color: #721c24; background-color: #f8d7da; padding: 10px; border-radius: 5px; margin: 10px 0; }
          .info { color: #0c5460; background-color: #d1ecf1; padding: 10px; border-radius: 5px; margin: 10px 0; }
          .details { background-color: #f9f9f9; padding: 10px; border-radius: 5px; margin: 10px 0; font-family: monospace; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>${title}</h2>
          </div>
          <div class="content">
            <p>${message}</p>
            
            ${event === 'error' || event === 'quota_exceeded' ? 
              `<div class="alert"><strong>Action requise!</strong> ${actionNeeded}</div>` : 
              `<div class="info"><strong>Information:</strong> ${actionNeeded}</div>`
            }
            
            <h3>Détails:</h3>
            <div class="details">
              <p><strong>Service:</strong> ${serviceName}</p>
              <p><strong>Événement:</strong> ${event}</p>
              <p><strong>Date:</strong> ${timestamp}</p>
              <p><strong>Environnement:</strong> ${environment}</p>
              <p><strong>Serveur:</strong> ${serverInfo}</p>
              ${data.message ? `<p><strong>Message:</strong> ${data.message}</p>` : ''}
              ${data.usageStats ? `<p><strong>Statistiques d'utilisation:</strong> ${JSON.stringify(data.usageStats)}</p>` : ''}
            </div>
          </div>
          <div class="footer">
            <p>Ce message a été envoyé automatiquement par le système de gestion des clés API de Dashboard-Velo.</p>
            <p>Pour vous désabonner de ces notifications, veuillez contacter l'administrateur système.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Notifie une rotation de clé API
   * @param {string} serviceName Nom du service
   * @param {Object} data Données supplémentaires
   * @returns {Promise<boolean>} Succès de l'envoi
   */
  async notifyKeyRotation(serviceName, data = {}) {
    return this.sendNotification(serviceName, 'rotation', data);
  }

  /**
   * Notifie une expiration imminente de clé API
   * @param {string} serviceName Nom du service
   * @param {Object} data Données supplémentaires
   * @returns {Promise<boolean>} Succès de l'envoi
   */
  async notifyKeyExpiration(serviceName, data = {}) {
    return this.sendNotification(serviceName, 'expiration', data);
  }

  /**
   * Notifie un dépassement de quota
   * @param {string} serviceName Nom du service
   * @param {Object} data Données supplémentaires
   * @returns {Promise<boolean>} Succès de l'envoi
   */
  async notifyQuotaExceeded(serviceName, data = {}) {
    return this.sendNotification(serviceName, 'quota_exceeded', data);
  }

  /**
   * Notifie une erreur avec une clé API
   * @param {string} serviceName Nom du service
   * @param {Error} error Erreur survenue
   * @param {Object} data Données supplémentaires
   * @returns {Promise<boolean>} Succès de l'envoi
   */
  async notifyError(serviceName, error, data = {}) {
    return this.sendNotification(serviceName, 'error', {
      ...data,
      message: error.message,
      stack: error.stack
    });
  }
}

// Exporter une instance singleton
module.exports = new ApiKeyNotifications();
