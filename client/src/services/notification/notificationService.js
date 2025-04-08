/**
 * Service de notification centralisé
 * Permet d'afficher des notifications à l'utilisateur de manière cohérente
 */
import { Subject } from 'rxjs';

// Types de notifications
export const NotificationLevel = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error'
};

// Positions des notifications
export const NotificationPosition = {
  TOP_LEFT: 'top-left',
  TOP_CENTER: 'top-center',
  TOP_RIGHT: 'top-right',
  BOTTOM_LEFT: 'bottom-left',
  BOTTOM_CENTER: 'bottom-center',
  BOTTOM_RIGHT: 'bottom-right'
};

class NotificationService {
  constructor() {
    // Canal d'émission des notifications
    this.notifications$ = new Subject();
    
    // Configuration par défaut
    this.defaultConfig = {
      duration: 5000,
      level: NotificationLevel.INFO,
      position: NotificationPosition.TOP_RIGHT,
      dismissible: true
    };
    
    // Historique des notifications
    this.history = [];
    this.maxHistoryLength = 50;
  }

  /**
   * Affiche une notification
   * @param {Object} notification - Objet contenant les détails de la notification
   */
  show(notification) {
    const finalNotification = {
      ...this.defaultConfig,
      ...notification,
      id: this._generateId(),
      timestamp: Date.now()
    };
    
    // Enregistrer dans l'historique
    this._addToHistory(finalNotification);
    
    // Émettre la notification
    this.notifications$.next(finalNotification);
    
    // Retourner l'ID pour référence (utile pour dismiss)
    return finalNotification.id;
  }

  /**
   * Affiche une notification de succès
   * @param {string} message - Message à afficher
   * @param {Object} options - Options supplémentaires
   */
  success(message, options = {}) {
    return this.show({
      message,
      level: NotificationLevel.SUCCESS,
      ...options
    });
  }

  /**
   * Affiche une notification d'information
   * @param {string} message - Message à afficher
   * @param {Object} options - Options supplémentaires
   */
  info(message, options = {}) {
    return this.show({
      message,
      level: NotificationLevel.INFO,
      ...options
    });
  }

  /**
   * Affiche une notification d'avertissement
   * @param {string} message - Message à afficher
   * @param {Object} options - Options supplémentaires
   */
  warning(message, options = {}) {
    return this.show({
      message,
      level: NotificationLevel.WARNING,
      ...options
    });
  }

  /**
   * Affiche une notification d'erreur
   * @param {string} message - Message à afficher
   * @param {Object} options - Options supplémentaires
   */
  error(message, options = {}) {
    return this.show({
      message,
      level: NotificationLevel.ERROR,
      duration: 8000, // Durée plus longue pour les erreurs
      ...options
    });
  }

  /**
   * Ferme une notification spécifique
   * @param {string} id - ID de la notification à fermer
   */
  dismiss(id) {
    this.notifications$.next({
      id,
      action: 'dismiss'
    });
  }

  /**
   * Ferme toutes les notifications actives
   */
  dismissAll() {
    this.notifications$.next({
      action: 'dismiss-all'
    });
  }

  /**
   * Met à jour la configuration par défaut
   * @param {Object} config - Nouvelle configuration
   */
  updateDefaultConfig(config) {
    this.defaultConfig = {
      ...this.defaultConfig,
      ...config
    };
  }

  /**
   * Récupère l'historique des notifications
   * @param {Object} options - Options de filtrage
   * @returns {Array} - Historique des notifications
   */
  getHistory(options = {}) {
    let history = [...this.history];
    
    // Filtrer par niveau
    if (options.level) {
      history = history.filter(notif => notif.level === options.level);
    }
    
    // Filtrer par date
    if (options.since) {
      history = history.filter(notif => notif.timestamp >= options.since);
    }
    
    // Limiter le nombre de résultats
    if (options.limit) {
      history = history.slice(0, options.limit);
    }
    
    return history;
  }

  /**
   * Efface l'historique des notifications
   */
  clearHistory() {
    this.history = [];
  }

  /**
   * Génère un ID unique pour une notification
   * @returns {string} - ID unique
   * @private
   */
  _generateId() {
    return `notification-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Ajoute une notification à l'historique
   * @param {Object} notification - Notification à ajouter
   * @private
   */
  _addToHistory(notification) {
    // Limiter la taille de l'historique
    if (this.history.length >= this.maxHistoryLength) {
      this.history.shift();
    }
    
    this.history.push(notification);
  }
}

// Singleton
const notificationService = new NotificationService();
export default notificationService;
