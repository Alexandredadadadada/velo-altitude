/**
 * Module de monitoring pour le système de gestion sécurisée des clés API
 * 
 * Ce module permet de suivre l'utilisation des clés API, de configurer des alertes
 * et de générer des métriques pour le tableau de bord.
 * 
 * Dashboard-Velo.com
 */

const { EventEmitter } = require('events');
const { logger } = require('./logger');

class ApiKeyMonitoring extends EventEmitter {
  /**
   * Constructeur
   * @param {Object} options - Options de configuration
   */
  constructor(options = {}) {
    super();
    
    this.options = {
      alertThresholds: {
        errorRate: 0.1,           // Taux d'erreur maximum (10%)
        responseTime: 1000,       // Temps de réponse maximum (1s)
        usageThreshold: 0.8,      // Seuil d'utilisation des quotas (80%)
        rotationFailures: 3       // Nombre maximum d'échecs de rotation consécutifs
      },
      metricsInterval: 60000,     // Intervalle de collecte des métriques (1 minute)
      retentionPeriod: 7 * 24 * 60 * 60 * 1000, // Période de rétention des métriques (7 jours)
      ...options
    };
    
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0
      },
      services: {},
      rotations: {
        total: 0,
        successful: 0,
        failed: 0
      },
      responseTime: {
        avg: 0,
        min: Infinity,
        max: 0
      },
      alerts: []
    };
    
    this.history = [];
    this.rotationFailures = {};
    
    // Démarrer la collecte des métriques
    this.metricsInterval = setInterval(() => this.collectMetrics(), this.options.metricsInterval);
    
    logger.info('ApiKeyMonitoring initialisé');
  }
  
  /**
   * Enregistrer une requête d'accès à une clé API
   * @param {Object} data - Données de la requête
   */
  trackApiKeyAccess(data) {
    const { service, module, success, error, duration } = data;
    
    // Mettre à jour les métriques globales
    this.metrics.requests.total++;
    if (success) {
      this.metrics.requests.successful++;
    } else {
      this.metrics.requests.failed++;
    }
    
    // Mettre à jour les métriques de temps de réponse
    if (duration) {
      this.metrics.responseTime.avg = 
        ((this.metrics.responseTime.avg * (this.metrics.requests.total - 1)) + duration) / 
        this.metrics.requests.total;
      this.metrics.responseTime.min = Math.min(this.metrics.responseTime.min, duration);
      this.metrics.responseTime.max = Math.max(this.metrics.responseTime.max, duration);
    }
    
    // Mettre à jour les métriques par service
    if (!this.metrics.services[service]) {
      this.metrics.services[service] = {
        requests: 0,
        successful: 0,
        failed: 0,
        modules: {}
      };
    }
    
    this.metrics.services[service].requests++;
    if (success) {
      this.metrics.services[service].successful++;
    } else {
      this.metrics.services[service].failed++;
    }
    
    // Mettre à jour les métriques par module
    if (module) {
      if (!this.metrics.services[service].modules[module]) {
        this.metrics.services[service].modules[module] = {
          requests: 0,
          successful: 0,
          failed: 0
        };
      }
      
      this.metrics.services[service].modules[module].requests++;
      if (success) {
        this.metrics.services[service].modules[module].successful++;
      } else {
        this.metrics.services[service].modules[module].failed++;
      }
    }
    
    // Vérifier les alertes
    this.checkAlerts(service);
    
    // Émettre un événement
    this.emit('apiKeyAccess', data);
  }
  
  /**
   * Enregistrer une rotation de clé API
   * @param {Object} data - Données de la rotation
   */
  trackApiKeyRotation(data) {
    const { service, success, error } = data;
    
    // Mettre à jour les métriques
    this.metrics.rotations.total++;
    if (success) {
      this.metrics.rotations.successful++;
      // Réinitialiser le compteur d'échecs
      this.rotationFailures[service] = 0;
    } else {
      this.metrics.rotations.failed++;
      
      // Incrémenter le compteur d'échecs
      if (!this.rotationFailures[service]) {
        this.rotationFailures[service] = 0;
      }
      this.rotationFailures[service]++;
      
      // Vérifier si le seuil d'alerte est dépassé
      if (this.rotationFailures[service] >= this.options.alertThresholds.rotationFailures) {
        this.createAlert('ROTATION_FAILURE', {
          service,
          failureCount: this.rotationFailures[service],
          error
        });
      }
    }
    
    // Émettre un événement
    this.emit('apiKeyRotation', data);
  }
  
  /**
   * Enregistrer l'utilisation des quotas d'une clé API
   * @param {Object} data - Données d'utilisation des quotas
   */
  trackApiKeyQuota(data) {
    const { service, quota, used } = data;
    
    // Calculer le pourcentage d'utilisation
    const usagePercent = used / quota;
    
    // Vérifier si le seuil d'alerte est dépassé
    if (usagePercent >= this.options.alertThresholds.usageThreshold) {
      this.createAlert('QUOTA_THRESHOLD', {
        service,
        usagePercent: usagePercent * 100,
        quota,
        used
      });
    }
    
    // Émettre un événement
    this.emit('apiKeyQuota', data);
  }
  
  /**
   * Créer une alerte
   * @param {string} type - Type d'alerte
   * @param {Object} data - Données de l'alerte
   */
  createAlert(type, data) {
    const alert = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      timestamp: new Date().toISOString(),
      data
    };
    
    // Ajouter l'alerte à la liste
    this.metrics.alerts.push(alert);
    
    // Limiter le nombre d'alertes stockées
    if (this.metrics.alerts.length > 100) {
      this.metrics.alerts.shift();
    }
    
    // Journaliser l'alerte
    logger.warn(`Alerte ${type} pour le service ${data.service}`, {
      alert
    });
    
    // Émettre un événement
    this.emit('alert', alert);
    
    return alert;
  }
  
  /**
   * Vérifier les alertes pour un service
   * @param {string} service - Nom du service
   */
  checkAlerts(service) {
    if (!this.metrics.services[service]) {
      return;
    }
    
    const serviceMetrics = this.metrics.services[service];
    
    // Vérifier le taux d'erreur
    if (serviceMetrics.requests > 10) {
      const errorRate = serviceMetrics.failed / serviceMetrics.requests;
      
      if (errorRate >= this.options.alertThresholds.errorRate) {
        this.createAlert('ERROR_RATE', {
          service,
          errorRate: errorRate * 100,
          threshold: this.options.alertThresholds.errorRate * 100
        });
      }
    }
    
    // Vérifier le temps de réponse
    if (this.metrics.responseTime.avg > this.options.alertThresholds.responseTime) {
      this.createAlert('RESPONSE_TIME', {
        service,
        responseTime: this.metrics.responseTime.avg,
        threshold: this.options.alertThresholds.responseTime
      });
    }
  }
  
  /**
   * Collecter les métriques périodiques
   */
  collectMetrics() {
    const snapshot = {
      timestamp: new Date().toISOString(),
      metrics: JSON.parse(JSON.stringify(this.metrics))
    };
    
    // Ajouter le snapshot à l'historique
    this.history.push(snapshot);
    
    // Nettoyer l'historique (conserver uniquement la période de rétention)
    const retentionDate = new Date(Date.now() - this.options.retentionPeriod);
    this.history = this.history.filter(item => new Date(item.timestamp) >= retentionDate);
    
    // Émettre un événement
    this.emit('metricsCollected', snapshot);
    
    return snapshot;
  }
  
  /**
   * Générer un rapport de métriques
   * @param {string} period - Période du rapport ('hour', 'day', 'week')
   * @returns {Object} - Rapport de métriques
   */
  generateMetricsReport(period = 'day') {
    let startDate;
    
    switch (period) {
      case 'hour':
        startDate = new Date(Date.now() - 60 * 60 * 1000);
        break;
      case 'day':
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    }
    
    // Filtrer les métriques pour la période spécifiée
    const filteredHistory = this.history.filter(item => new Date(item.timestamp) >= startDate);
    
    // Agréger les métriques
    const report = {
      period,
      startDate: startDate.toISOString(),
      endDate: new Date().toISOString(),
      requests: {
        total: 0,
        successful: 0,
        failed: 0
      },
      services: {},
      rotations: {
        total: 0,
        successful: 0,
        failed: 0
      },
      responseTime: {
        avg: 0,
        min: Infinity,
        max: 0
      },
      alerts: []
    };
    
    // Si aucune donnée, retourner le rapport vide
    if (filteredHistory.length === 0) {
      return report;
    }
    
    // Agréger les métriques
    filteredHistory.forEach(snapshot => {
      report.requests.total += snapshot.metrics.requests.total;
      report.requests.successful += snapshot.metrics.requests.successful;
      report.requests.failed += snapshot.metrics.requests.failed;
      
      report.rotations.total += snapshot.metrics.rotations.total;
      report.rotations.successful += snapshot.metrics.rotations.successful;
      report.rotations.failed += snapshot.metrics.rotations.failed;
      
      if (snapshot.metrics.responseTime.avg > 0) {
        report.responseTime.avg = 
          (report.responseTime.avg + snapshot.metrics.responseTime.avg) / 2;
      }
      
      if (snapshot.metrics.responseTime.min < report.responseTime.min) {
        report.responseTime.min = snapshot.metrics.responseTime.min;
      }
      
      if (snapshot.metrics.responseTime.max > report.responseTime.max) {
        report.responseTime.max = snapshot.metrics.responseTime.max;
      }
      
      // Agréger les métriques par service
      Object.entries(snapshot.metrics.services).forEach(([service, metrics]) => {
        if (!report.services[service]) {
          report.services[service] = {
            requests: 0,
            successful: 0,
            failed: 0
          };
        }
        
        report.services[service].requests += metrics.requests;
        report.services[service].successful += metrics.successful;
        report.services[service].failed += metrics.failed;
      });
      
      // Collecter les alertes
      snapshot.metrics.alerts.forEach(alert => {
        if (!report.alerts.some(a => a.id === alert.id)) {
          report.alerts.push(alert);
        }
      });
    });
    
    // Trier les alertes par date
    report.alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return report;
  }
  
  /**
   * Arrêter le monitoring
   */
  stop() {
    clearInterval(this.metricsInterval);
    logger.info('ApiKeyMonitoring arrêté');
  }
}

module.exports = ApiKeyMonitoring;
