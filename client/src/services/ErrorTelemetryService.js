/**
 * Service de télémétrie pour collecter et envoyer les erreurs en production
 * Ce service permet de suivre les erreurs rencontrées par les utilisateurs
 * et d'améliorer la qualité de l'application
 */

import { v4 as uuidv4 } from 'uuid';
import { isErrorFeatureEnabled, ERROR_FEATURE_FLAGS } from '../utils/ErrorFeatureFlags';

class ErrorTelemetryService {
  constructor() {
    this.endpoint = process.env.REACT_APP_ERROR_TELEMETRY_ENDPOINT || '/api/telemetry/errors';
    this.batchSize = 10;
    this.flushInterval = 60000; // 1 minute
    this.errorQueue = [];
    this.sessionId = uuidv4();
    this.isEnabled = isErrorFeatureEnabled(ERROR_FEATURE_FLAGS.ENABLE_ERROR_TELEMETRY, true);
    
    // Démarrer le timer de flush automatique
    if (this.isEnabled) {
      this.flushTimer = setInterval(() => this.flush(), this.flushInterval);
      
      // Enregistrer les erreurs non capturées
      window.addEventListener('error', this.handleGlobalError);
      window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
      
      // Flush avant que l'utilisateur ne quitte la page
      window.addEventListener('beforeunload', () => this.flush());
    }
  }
  
  /**
   * Capture une erreur et l'ajoute à la file d'attente
   * @param {Error} error - L'erreur à capturer
   * @param {Object} context - Contexte supplémentaire sur l'erreur
   */
  captureError(error, context = {}) {
    if (!this.isEnabled) return;
    
    const errorData = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      message: error.message || 'Unknown error',
      stack: error.stack,
      type: error.name || 'Error',
      url: window.location.href,
      userAgent: navigator.userAgent,
      context: {
        ...context,
        route: window.location.pathname,
        referrer: document.referrer,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      }
    };
    
    // Ajouter à la file d'attente
    this.errorQueue.push(errorData);
    
    // Flush automatique si la taille du batch est atteinte
    if (this.errorQueue.length >= this.batchSize) {
      this.flush();
    }
    
    return errorData.id;
  }
  
  /**
   * Gestionnaire d'erreurs globales non capturées
   * @param {ErrorEvent} event - L'événement d'erreur
   */
  handleGlobalError = (event) => {
    const { message, filename, lineno, colno, error } = event;
    
    this.captureError(error || new Error(message), {
      source: 'window.onerror',
      location: {
        filename,
        line: lineno,
        column: colno
      }
    });
  };
  
  /**
   * Gestionnaire de rejets de promesses non gérés
   * @param {PromiseRejectionEvent} event - L'événement de rejet
   */
  handleUnhandledRejection = (event) => {
    const error = event.reason instanceof Error 
      ? event.reason 
      : new Error(String(event.reason));
    
    this.captureError(error, {
      source: 'unhandledrejection'
    });
  };
  
  /**
   * Envoie les erreurs collectées au serveur
   * @returns {Promise<void>}
   */
  async flush() {
    if (!this.isEnabled || this.errorQueue.length === 0) return;
    
    const errors = [...this.errorQueue];
    this.errorQueue = [];
    
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          errors,
          metadata: {
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            batchSize: errors.length
          }
        }),
        // Utiliser keepalive pour s'assurer que la requête est envoyée
        // même si l'utilisateur quitte la page
        keepalive: true
      });
      
      if (!response.ok) {
        console.error('Failed to send error telemetry:', await response.text());
        // Remettre les erreurs dans la file d'attente
        this.errorQueue = [...errors, ...this.errorQueue];
      }
    } catch (error) {
      console.error('Error sending telemetry:', error);
      // Remettre les erreurs dans la file d'attente
      this.errorQueue = [...errors, ...this.errorQueue];
    }
  }
  
  /**
   * Nettoie les ressources utilisées par le service
   */
  cleanup() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    window.removeEventListener('error', this.handleGlobalError);
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
    window.removeEventListener('beforeunload', this.flush);
    
    // Flush final
    this.flush();
  }
}

// Créer une instance singleton
const errorTelemetry = new ErrorTelemetryService();

export default errorTelemetry;
