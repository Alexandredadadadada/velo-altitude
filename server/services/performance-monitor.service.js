/**
 * Service de surveillance des performances
 * Surveille les performances des différents services et détecte les anomalies
 */
const logger = require('../utils/logger');
const { EventEmitter } = require('events');
const cacheService = require('./cache.service');
const notificationService = require('./notification.service');

class PerformanceMonitorService extends EventEmitter {
  constructor() {
    super();
    
    // Configuration
    this.config = {
      samplingInterval: 60000, // 1 minute
      metricsRetention: 24 * 60 * 60 * 1000, // 24 heures
      alertThresholds: {
        responseTime: {
          warning: 2000, // 2 secondes
          critical: 5000 // 5 secondes
        },
        errorRate: {
          warning: 0.05, // 5%
          critical: 0.10 // 10%
        },
        concurrentRequests: {
          warning: 50,
          critical: 100
        }
      }
    };
    
    // Métriques
    this.metrics = {
      services: new Map(), // serviceName -> { responseTime, errorCount, requestCount, etc. }
      global: {
        startTime: Date.now(),
        totalRequests: 0,
        totalErrors: 0,
        activeRequests: 0
      }
    };
    
    // Historique des métriques pour la détection d'anomalies
    this.metricsHistory = new Map(); // serviceName -> [{ timestamp, metrics }]
    
    // État des alertes
    this.activeAlerts = new Map(); // alertId -> { service, type, level, timestamp, message }
    
    // Démarrer la collecte périodique
    this.startPeriodicCollection();
    
    logger.info('Service de surveillance des performances initialisé');
  }
  
  /**
   * Démarre la collecte périodique des métriques
   */
  startPeriodicCollection() {
    this.collectionInterval = setInterval(() => {
      this.collectMetrics();
      this.detectAnomalies();
      this.pruneOldMetrics();
    }, this.config.samplingInterval);
  }
  
  /**
   * Collecte les métriques actuelles et les stocke dans l'historique
   */
  collectMetrics() {
    // Pour chaque service surveillé
    for (const [serviceName, metrics] of this.metrics.services.entries()) {
      // Calculer les métriques dérivées
      const avgResponseTime = metrics.requestCount > 0 
        ? metrics.totalResponseTime / metrics.requestCount 
        : 0;
      
      const errorRate = metrics.requestCount > 0 
        ? metrics.errorCount / metrics.requestCount 
        : 0;
      
      // Créer un snapshot des métriques actuelles
      const snapshot = {
        timestamp: Date.now(),
        avgResponseTime,
        errorRate,
        requestCount: metrics.requestCount,
        errorCount: metrics.errorCount,
        activeRequests: metrics.activeRequests
      };
      
      // Ajouter à l'historique
      if (!this.metricsHistory.has(serviceName)) {
        this.metricsHistory.set(serviceName, []);
      }
      
      this.metricsHistory.get(serviceName).push(snapshot);
      
      // Réinitialiser les compteurs pour la prochaine période
      metrics.totalResponseTime = 0;
      metrics.requestCount = 0;
      metrics.errorCount = 0;
      
      // Stocker dans le cache pour l'API de monitoring
      cacheService.set(`metrics:${serviceName}:latest`, snapshot, this.config.metricsRetention);
    }
    
    // Métriques globales
    const globalSnapshot = {
      timestamp: Date.now(),
      uptime: Date.now() - this.metrics.global.startTime,
      totalRequests: this.metrics.global.totalRequests,
      totalErrors: this.metrics.global.totalErrors,
      activeRequests: this.metrics.global.activeRequests,
      errorRate: this.metrics.global.totalRequests > 0 
        ? this.metrics.global.totalErrors / this.metrics.global.totalRequests 
        : 0
    };
    
    cacheService.set('metrics:global:latest', globalSnapshot, this.config.metricsRetention);
  }
  
  /**
   * Détecte les anomalies dans les métriques collectées
   */
  detectAnomalies() {
    for (const [serviceName, history] of this.metricsHistory.entries()) {
      // Besoin d'au moins quelques points de données pour la détection
      if (history.length < 5) continue;
      
      const latestMetrics = history[history.length - 1];
      
      // Vérifier les seuils d'alerte
      this.checkThresholds(serviceName, latestMetrics);
      
      // Détecter les tendances anormales
      this.detectTrends(serviceName, history);
    }
  }
  
  /**
   * Vérifie si les métriques actuelles dépassent les seuils configurés
   * @param {string} serviceName Nom du service
   * @param {Object} metrics Métriques actuelles
   */
  checkThresholds(serviceName, metrics) {
    // Vérifier le temps de réponse
    if (metrics.avgResponseTime > this.config.alertThresholds.responseTime.critical) {
      this.raiseAlert(serviceName, 'responseTime', 'critical', 
        `Temps de réponse critique pour ${serviceName}: ${Math.round(metrics.avgResponseTime)}ms`);
    } else if (metrics.avgResponseTime > this.config.alertThresholds.responseTime.warning) {
      this.raiseAlert(serviceName, 'responseTime', 'warning',
        `Temps de réponse élevé pour ${serviceName}: ${Math.round(metrics.avgResponseTime)}ms`);
    } else {
      this.resolveAlert(serviceName, 'responseTime');
    }
    
    // Vérifier le taux d'erreur
    if (metrics.errorRate > this.config.alertThresholds.errorRate.critical) {
      this.raiseAlert(serviceName, 'errorRate', 'critical',
        `Taux d'erreur critique pour ${serviceName}: ${Math.round(metrics.errorRate * 100)}%`);
    } else if (metrics.errorRate > this.config.alertThresholds.errorRate.warning) {
      this.raiseAlert(serviceName, 'errorRate', 'warning',
        `Taux d'erreur élevé pour ${serviceName}: ${Math.round(metrics.errorRate * 100)}%`);
    } else {
      this.resolveAlert(serviceName, 'errorRate');
    }
    
    // Vérifier les requêtes concurrentes
    if (metrics.activeRequests > this.config.alertThresholds.concurrentRequests.critical) {
      this.raiseAlert(serviceName, 'concurrentRequests', 'critical',
        `Nombre critique de requêtes concurrentes pour ${serviceName}: ${metrics.activeRequests}`);
    } else if (metrics.activeRequests > this.config.alertThresholds.concurrentRequests.warning) {
      this.raiseAlert(serviceName, 'concurrentRequests', 'warning',
        `Nombre élevé de requêtes concurrentes pour ${serviceName}: ${metrics.activeRequests}`);
    } else {
      this.resolveAlert(serviceName, 'concurrentRequests');
    }
  }
  
  /**
   * Détecte les tendances anormales dans l'historique des métriques
   * @param {string} serviceName Nom du service
   * @param {Array} history Historique des métriques
   */
  detectTrends(serviceName, history) {
    // Obtenir les 5 derniers points de données
    const recentHistory = history.slice(-5);
    
    // Vérifier si le temps de réponse augmente de manière constante
    const responseTimeTrend = this.calculateTrend(recentHistory.map(m => m.avgResponseTime));
    if (responseTimeTrend > 0.3) { // Augmentation significative
      this.raiseAlert(serviceName, 'responseTimeTrend', 'warning',
        `Tendance à la hausse du temps de réponse pour ${serviceName}`);
    } else {
      this.resolveAlert(serviceName, 'responseTimeTrend');
    }
    
    // Vérifier si le taux d'erreur augmente de manière constante
    const errorRateTrend = this.calculateTrend(recentHistory.map(m => m.errorRate));
    if (errorRateTrend > 0.2) { // Augmentation significative
      this.raiseAlert(serviceName, 'errorRateTrend', 'warning',
        `Tendance à la hausse du taux d'erreur pour ${serviceName}`);
    } else {
      this.resolveAlert(serviceName, 'errorRateTrend');
    }
  }
  
  /**
   * Calcule la tendance d'une série de valeurs
   * @param {Array<number>} values Série de valeurs
   * @returns {number} Coefficient de tendance (-1 à 1)
   */
  calculateTrend(values) {
    if (values.length < 2) return 0;
    
    // Calculer la tendance avec une régression linéaire simple
    const n = values.length;
    const indices = Array.from({ length: n }, (_, i) => i);
    
    const sumX = indices.reduce((sum, x) => sum + x, 0);
    const sumY = values.reduce((sum, y) => sum + y, 0);
    const sumXY = indices.reduce((sum, x, i) => sum + x * values[i], 0);
    const sumXX = indices.reduce((sum, x) => sum + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const meanY = sumY / n;
    
    // Normaliser la pente par rapport à la moyenne
    return meanY !== 0 ? slope / meanY : 0;
  }
  
  /**
   * Déclenche une alerte
   * @param {string} serviceName Nom du service
   * @param {string} type Type d'alerte
   * @param {string} level Niveau d'alerte (warning, critical)
   * @param {string} message Message d'alerte
   */
  raiseAlert(serviceName, type, level, message) {
    const alertId = `${serviceName}:${type}`;
    
    // Vérifier si cette alerte est déjà active
    if (this.activeAlerts.has(alertId)) {
      const existingAlert = this.activeAlerts.get(alertId);
      
      // Ne pas redéclencher si le niveau est le même ou inférieur
      if (level === 'warning' && existingAlert.level === 'critical') {
        return;
      }
      
      // Si l'alerte existe déjà avec le même niveau, mettre à jour le timestamp
      if (level === existingAlert.level) {
        existingAlert.timestamp = Date.now();
        return;
      }
    }
    
    // Créer une nouvelle alerte
    const alert = {
      id: alertId,
      service: serviceName,
      type,
      level,
      message,
      timestamp: Date.now()
    };
    
    // Stocker l'alerte
    this.activeAlerts.set(alertId, alert);
    
    // Émettre un événement
    this.emit('alert', alert);
    
    // Journaliser l'alerte
    logger.warn(`[ALERTE ${level.toUpperCase()}] ${message}`);
    
    // Envoyer une notification
    notificationService.sendAlert({
      type: 'performance',
      level,
      subject: `Alerte de performance - ${serviceName}`,
      message
    });
  }
  
  /**
   * Résout une alerte existante
   * @param {string} serviceName Nom du service
   * @param {string} type Type d'alerte
   */
  resolveAlert(serviceName, type) {
    const alertId = `${serviceName}:${type}`;
    
    // Vérifier si cette alerte est active
    if (this.activeAlerts.has(alertId)) {
      const alert = this.activeAlerts.get(alertId);
      
      // Supprimer l'alerte
      this.activeAlerts.delete(alertId);
      
      // Émettre un événement
      this.emit('alertResolved', {
        id: alertId,
        service: serviceName,
        type,
        resolvedAt: Date.now(),
        duration: Date.now() - alert.timestamp
      });
      
      // Journaliser la résolution
      logger.info(`Alerte résolue pour ${serviceName} (${type})`);
      
      // Envoyer une notification de résolution
      notificationService.sendAlert({
        type: 'performance',
        level: 'info',
        subject: `Alerte résolue - ${serviceName}`,
        message: `L'alerte ${type} pour ${serviceName} a été résolue`
      });
    }
  }
  
  /**
   * Enregistre le début d'une requête
   * @param {string} serviceName Nom du service
   * @returns {Function} Fonction à appeler à la fin de la requête
   */
  startRequest(serviceName) {
    // Initialiser les métriques du service si nécessaire
    if (!this.metrics.services.has(serviceName)) {
      this.metrics.services.set(serviceName, {
        totalResponseTime: 0,
        requestCount: 0,
        errorCount: 0,
        activeRequests: 0
      });
    }
    
    // Incrémenter les compteurs
    const serviceMetrics = this.metrics.services.get(serviceName);
    serviceMetrics.activeRequests++;
    this.metrics.global.activeRequests++;
    
    const startTime = Date.now();
    
    // Retourner une fonction pour terminer la mesure
    return (error = null) => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Mettre à jour les métriques du service
      serviceMetrics.totalResponseTime += duration;
      serviceMetrics.requestCount++;
      serviceMetrics.activeRequests--;
      
      // Mettre à jour les métriques globales
      this.metrics.global.totalRequests++;
      this.metrics.global.activeRequests--;
      
      // En cas d'erreur
      if (error) {
        serviceMetrics.errorCount++;
        this.metrics.global.totalErrors++;
      }
      
      return duration;
    };
  }
  
  /**
   * Supprime les anciennes métriques de l'historique
   */
  pruneOldMetrics() {
    const cutoffTime = Date.now() - this.config.metricsRetention;
    
    for (const [serviceName, history] of this.metricsHistory.entries()) {
      const newHistory = history.filter(entry => entry.timestamp >= cutoffTime);
      this.metricsHistory.set(serviceName, newHistory);
    }
  }
  
  /**
   * Obtient les métriques actuelles d'un service
   * @param {string} serviceName Nom du service
   * @returns {Object} Métriques du service
   */
  getServiceMetrics(serviceName) {
    if (!this.metricsHistory.has(serviceName)) {
      return null;
    }
    
    const history = this.metricsHistory.get(serviceName);
    if (history.length === 0) {
      return null;
    }
    
    return history[history.length - 1];
  }
  
  /**
   * Obtient les métriques globales du système
   * @returns {Object} Métriques globales
   */
  getGlobalMetrics() {
    return {
      timestamp: Date.now(),
      uptime: Date.now() - this.metrics.global.startTime,
      totalRequests: this.metrics.global.totalRequests,
      totalErrors: this.metrics.global.totalErrors,
      activeRequests: this.metrics.global.activeRequests,
      errorRate: this.metrics.global.totalRequests > 0 
        ? this.metrics.global.totalErrors / this.metrics.global.totalRequests 
        : 0,
      services: Array.from(this.metrics.services.keys())
    };
  }
  
  /**
   * Obtient les alertes actives
   * @returns {Array} Liste des alertes actives
   */
  getActiveAlerts() {
    return Array.from(this.activeAlerts.values());
  }
}

// Exporter une instance singleton
module.exports = new PerformanceMonitorService();
