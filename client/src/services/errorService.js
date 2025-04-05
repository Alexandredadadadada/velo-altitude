/**
 * Service de gestion des erreurs côté client
 * Ce service fait le pont entre le système de notification et la gestion des erreurs API
 * Il assure une gestion cohérente des erreurs à travers l'application
 */

import { api } from './api';

// Mapping des types d'erreurs du backend vers les types de notifications frontend
const ERROR_TYPE_MAPPING = {
  // Erreurs d'authentification
  'auth_token_expired': { type: 'error', title: 'Session expirée', severity: 'warning' },
  'auth_token_invalid': { type: 'error', title: 'Authentification invalide', severity: 'warning' },
  'auth_token_missing': { type: 'error', title: 'Authentification requise', severity: 'warning' },
  'auth_token_revoked': { type: 'error', title: 'Session révoquée', severity: 'warning' },
  'auth_credentials_invalid': { type: 'error', title: 'Identifiants invalides', severity: 'warning' },
  
  // Erreurs de validation
  'validation_error': { type: 'warning', title: 'Données invalides', severity: 'warning' },
  'invalid_input': { type: 'warning', title: 'Saisie invalide', severity: 'warning' },
  'missing_required_field': { type: 'warning', title: 'Champ requis manquant', severity: 'warning' },
  
  // Erreurs de ressources
  'resource_not_found': { type: 'error', title: 'Ressource introuvable', severity: 'warning' },
  'route_not_found': { type: 'error', title: 'Page introuvable', severity: 'warning' },
  'resource_conflict': { type: 'error', title: 'Conflit de ressources', severity: 'warning' },
  'resource_exists': { type: 'warning', title: 'Ressource existante', severity: 'info' },
  
  // Erreurs de permissions
  'permission_denied': { type: 'error', title: 'Accès refusé', severity: 'warning' },
  'insufficient_permissions': { type: 'error', title: 'Permissions insuffisantes', severity: 'warning' },
  
  // Erreurs de serveur
  'server_error': { type: 'error', title: 'Erreur serveur', severity: 'critical' },
  'database_error': { type: 'error', title: 'Erreur de base de données', severity: 'critical' },
  'service_unavailable': { type: 'error', title: 'Service indisponible', severity: 'critical' },
  
  // Erreurs de performance
  'timeout_error': { type: 'error', title: 'Délai d\'attente dépassé', severity: 'warning' },
  'rate_limit_exceeded': { type: 'warning', title: 'Limite de requêtes dépassée', severity: 'warning' },
  'performance_issue': { type: 'warning', title: 'Problème de performance', severity: 'info' },
  
  // Erreurs de réseau
  'network_error': { type: 'error', title: 'Erreur réseau', severity: 'warning' },
  'api_error': { type: 'error', title: 'Erreur API', severity: 'warning' },
  
  // Erreur par défaut
  'default': { type: 'error', title: 'Erreur', severity: 'warning' }
};

// Configuration des notifications par type d'erreur et sévérité
const NOTIFICATION_CONFIG = {
  critical: {
    position: 'top-center',
    autoClose: false,
    type: 'toast',
    closeButton: true,
    pauseOnHover: true
  },
  warning: {
    position: 'top-right',
    autoClose: 8000,
    type: 'toast',
    closeButton: true,
    pauseOnHover: true
  },
  info: {
    position: 'bottom-right',
    autoClose: 5000,
    type: 'toast',
    closeButton: true,
    pauseOnHover: true
  }
};

/**
 * Classe de service de gestion des erreurs
 */
class ErrorService {
  constructor() {
    this.notifyFn = null;
    this.errorStats = {
      count: 0,
      byType: {},
      byEndpoint: {}
    };
    
    // Configurer l'intercepteur de réponse pour capturer les erreurs API
    this.setupApiInterceptor();
  }
  
  /**
   * Initialiser le service avec la fonction de notification
   * @param {Function} notifyFn - Fonction de notification du contexte NotificationContext
   */
  init(notifyFn) {
    this.notifyFn = notifyFn;
    console.log('Service d\'erreur initialisé avec le système de notification');
  }
  
  /**
   * Configurer l'intercepteur API pour capturer et traiter les erreurs
   */
  setupApiInterceptor() {
    api.interceptors.response.use(
      response => response,
      error => {
        this.handleApiError(error);
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * Gérer une erreur API
   * @param {Error} error - L'erreur Axios
   */
  handleApiError(error) {
    // Extraire les informations d'erreur de la réponse
    let errorData = {
      type: 'network_error',
      message: 'Erreur de connexion au serveur',
      severity: 'warning',
      details: error.message
    };
    
    // Récupérer les détails d'erreur si disponibles dans la réponse
    if (error.response && error.response.data) {
      const { data } = error.response;
      
      if (data.error) {
        errorData = {
          type: data.error.type || errorData.type,
          message: data.error.message || errorData.message,
          severity: data.error.severity || errorData.severity,
          details: data.error.details || errorData.details,
          notification: data.error.notification || null
        };
      }
    }
    
    // Mettre à jour les statistiques d'erreur
    this.trackError(errorData, error);
    
    // Notifier l'utilisateur si la fonction de notification est disponible
    this.notifyError(errorData);
    
    return errorData;
  }
  
  /**
   * Suivre les statistiques d'erreur
   * @param {Object} errorData - Données d'erreur
   * @param {Error} originalError - Erreur originale
   */
  trackError(errorData, originalError) {
    this.errorStats.count++;
    
    // Suivre par type
    if (!this.errorStats.byType[errorData.type]) {
      this.errorStats.byType[errorData.type] = 0;
    }
    this.errorStats.byType[errorData.type]++;
    
    // Suivre par endpoint si disponible
    if (originalError.config && originalError.config.url) {
      const endpoint = originalError.config.url;
      if (!this.errorStats.byEndpoint[endpoint]) {
        this.errorStats.byEndpoint[endpoint] = 0;
      }
      this.errorStats.byEndpoint[endpoint]++;
    }
    
    // Envoyer les statistiques au serveur périodiquement (à implémenter)
  }
  
  /**
   * Notifier l'utilisateur d'une erreur
   * @param {Object} errorData - Données d'erreur
   */
  notifyError(errorData) {
    if (!this.notifyFn) {
      console.warn('Système de notification non initialisé, impossible d\'afficher l\'erreur');
      return;
    }
    
    // Obtenir la configuration de notification en fonction du type d'erreur
    const errorTypeConfig = ERROR_TYPE_MAPPING[errorData.type] || ERROR_TYPE_MAPPING.default;
    const severityConfig = NOTIFICATION_CONFIG[errorData.severity] || NOTIFICATION_CONFIG.warning;
    
    // Utiliser la configuration de notification personnalisée si fournie par le backend
    const notificationConfig = errorData.notification || {};
    
    // Créer la notification
    this.notifyFn.error(
      errorData.message,
      null,
      {
        title: errorTypeConfig.title,
        details: process.env.NODE_ENV !== 'production' ? errorData.details : undefined,
        duration: notificationConfig.autoClose || severityConfig.autoClose,
        ...notificationConfig
      }
    );
  }
  
  /**
   * Gérer une erreur manuelle (non liée à une requête API)
   * @param {string} message - Message d'erreur
   * @param {string} type - Type d'erreur
   * @param {Object} options - Options supplémentaires
   */
  handleError(message, type = 'default', options = {}) {
    const errorData = {
      type,
      message,
      severity: options.severity || 'warning',
      details: options.details || '',
      notification: options.notification || null
    };
    
    this.trackError(errorData, new Error(message));
    this.notifyError(errorData);
    
    return errorData;
  }
  
  /**
   * Obtenir les statistiques d'erreur
   * @returns {Object} Statistiques d'erreur
   */
  getErrorStats() {
    return { ...this.errorStats };
  }
  
  /**
   * Réinitialiser les statistiques d'erreur
   */
  resetErrorStats() {
    this.errorStats = {
      count: 0,
      byType: {},
      byEndpoint: {}
    };
  }
}

// Créer et exporter une instance singleton
const errorService = new ErrorService();

export default errorService;
