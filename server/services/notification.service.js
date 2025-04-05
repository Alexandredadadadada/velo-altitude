/**
 * Service de notification
 * Gère les notifications et alertes du système
 */

const { logger } = require('../utils/logger');

// Éviter les dépendances circulaires en utilisant des importations différées
let authService = null;

class NotificationService {
  constructor() {
    this.handlers = {
      'email': [],
      'slack': [],
      'console': [this._consoleNotificationHandler.bind(this)]
    };
    
    // Par défaut, toutes les notifications vont dans la console
    this.defaultChannel = 'console';
    
    // Configuration de la journalisation
    this.logNotifications = true;
    
    logger.info('Service de notification initialisé');
  }
  
  /**
   * Envoie une notification via les canaux appropriés
   * @param {string} title - Titre de la notification
   * @param {string} message - Contenu de la notification
   * @param {string} level - Niveau d'importance (info, warning, error, critical)
   * @param {Object} options - Options supplémentaires (channel, metadata)
   * @returns {Promise<boolean>} - True si la notification a été envoyée avec succès
   */
  async send(title, message, level = 'info', options = {}) {
    try {
      const channel = options.channel || this.defaultChannel;
      const metadata = options.metadata || {};
      
      // Journaliser la notification
      if (this.logNotifications) {
        this._logNotification(title, message, level, channel, metadata);
      }
      
      // Obtenir les handlers pour ce canal
      const handlers = this.handlers[channel] || [];
      
      if (handlers.length === 0) {
        logger.warn(`Aucun handler trouvé pour le canal de notification '${channel}'`);
        // Utiliser le canal par défaut si le canal spécifié n'existe pas
        return this.send(title, message, level, { ...options, channel: this.defaultChannel });
      }
      
      // Exécuter tous les handlers pour ce canal
      const results = await Promise.all(
        handlers.map(handler => handler(title, message, level, metadata))
      );
      
      return results.every(Boolean);
    } catch (error) {
      logger.error(`Erreur lors de l'envoi de la notification: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Envoie une notification de sécurité à un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {string} title - Titre de la notification
   * @param {string} message - Contenu de la notification
   * @returns {Promise<boolean>} - True si la notification a été envoyée avec succès
   */
  async sendSecurityNotification(userId, title, message) {
    try {
      return await this.send(title, message, 'warning', {
        channel: 'console', // Par défaut, utiliser la console
        metadata: { userId, type: 'security' }
      });
    } catch (error) {
      logger.error(`Erreur lors de l'envoi de la notification de sécurité: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Ajoute un handler de notification pour un canal spécifique
   * @param {string} channel - Canal de notification (email, slack, console, etc.)
   * @param {Function} handler - Fonction de traitement de la notification
   */
  registerHandler(channel, handler) {
    if (!this.handlers[channel]) {
      this.handlers[channel] = [];
    }
    
    this.handlers[channel].push(handler);
    logger.info(`Handler de notification enregistré pour le canal '${channel}'`);
  }
  
  /**
   * Handler par défaut pour les notifications console
   * @private
   */
  _consoleNotificationHandler(title, message, level, metadata) {
    const timestamp = new Date().toISOString();
    
    // Formater le message en fonction du niveau
    let logFunction = logger.info;
    if (level === 'warning') logFunction = logger.warn;
    if (level === 'error' || level === 'critical') logFunction = logger.error;
    
    logFunction(`[NOTIFICATION ${level.toUpperCase()}] ${title}: ${message}`);
    return true;
  }
  
  /**
   * Journalise une notification
   * @private
   */
  _logNotification(title, message, level, channel, metadata) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      title,
      message,
      level,
      channel,
      metadata
    };
    
    logger.debug('Notification envoyée:', JSON.stringify(logEntry));
  }
}

// Exporter une instance singleton
const notificationService = new NotificationService();
module.exports = notificationService;
