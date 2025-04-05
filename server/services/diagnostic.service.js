/**
 * Service de diagnostic et monitoring
 * Fournit des méthodes pour analyser les erreurs et surveiller l'état du système
 */

const logger = require('../utils/logger');
const weatherErrorHandler = require('../utils/weather-error-handler');
const fs = require('fs');
const path = require('path');
const os = require('os');

class DiagnosticService {
  constructor() {
    this.startTime = Date.now();
    
    // Intervalles de vérification de santé (en ms)
    this.healthCheckIntervals = {
      weather: 15 * 60 * 1000 // 15 minutes pour les services météo
    };
    
    // État de santé des systèmes
    this.healthStatus = {
      weather: {
        status: 'unknown',
        lastCheck: null,
        services: {}
      },
      database: {
        status: 'unknown',
        lastCheck: null
      },
      cache: {
        status: 'unknown',
        lastCheck: null
      },
      system: {
        status: 'healthy',
        lastCheck: new Date()
      }
    };
    
    // Démarrer les vérifications périodiques
    this.startHealthChecks();
    
    logger.info('Service de diagnostic initialisé');
  }
  
  /**
   * Démarre les vérifications périodiques de santé
   */
  startHealthChecks() {
    // Vérification périodique des services météo
    setInterval(async () => {
      try {
        const weatherHealth = await weatherErrorHandler.checkWeatherServicesHealth();
        this.healthStatus.weather = {
          ...weatherHealth,
          lastCheck: new Date()
        };
        
        logger.debug('Vérification de santé des services météo effectuée', { 
          status: weatherHealth.overall 
        });
      } catch (error) {
        logger.error('Erreur lors de la vérification de santé des services météo', { error });
        this.healthStatus.weather.status = 'error';
        this.healthStatus.weather.lastCheck = new Date();
      }
    }, this.healthCheckIntervals.weather);
    
    // Vérification périodique de l'état du système
    setInterval(() => {
      try {
        const systemStatus = this.checkSystemHealth();
        this.healthStatus.system = {
          ...systemStatus,
          lastCheck: new Date()
        };
      } catch (error) {
        logger.error('Erreur lors de la vérification de santé du système', { error });
        this.healthStatus.system.status = 'error';
        this.healthStatus.system.lastCheck = new Date();
      }
    }, 5 * 60 * 1000); // 5 minutes
  }
  
  /**
   * Obtient l'état de santé global du système
   * @returns {Object} État de santé
   */
  async getHealthStatus() {
    try {
      // Mettre à jour l'état de santé du système
      const systemStatus = this.checkSystemHealth();
      this.healthStatus.system = {
        ...systemStatus,
        lastCheck: new Date()
      };
      
      // Déterminer l'état global en fonction des états individuels
      const states = Object.values(this.healthStatus).map(s => s.status);
      let overallStatus = 'healthy';
      
      if (states.includes('error')) {
        overallStatus = 'error';
      } else if (states.includes('degraded')) {
        overallStatus = 'degraded';
      } else if (states.includes('unknown')) {
        overallStatus = 'unknown';
      }
      
      return {
        status: overallStatus,
        uptime: this.getUptime(),
        timestamp: new Date(),
        components: this.healthStatus
      };
    } catch (error) {
      logger.error('Erreur lors de l\'obtention de l\'état de santé', { error });
      return {
        status: 'error',
        uptime: this.getUptime(),
        timestamp: new Date(),
        error: error.message
      };
    }
  }
  
  /**
   * Vérifie l'état de santé du système (CPU, mémoire, disque)
   * @returns {Object} État de santé du système
   */
  checkSystemHealth() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMemPercent = ((totalMem - freeMem) / totalMem) * 100;
    
    const cpuLoad = os.loadavg()[0]; // Charge moyenne sur 1 minute
    const cpuCount = os.cpus().length;
    const normalizedLoad = (cpuLoad / cpuCount) * 100; // Charge normalisée en pourcentage
    
    // Vérifier la santé en fonction des métriques
    let status = 'healthy';
    const issues = [];
    
    if (usedMemPercent > 90) {
      status = 'error';
      issues.push('Mémoire critique');
    } else if (usedMemPercent > 80) {
      status = 'degraded';
      issues.push('Mémoire haute');
    }
    
    if (normalizedLoad > 90) {
      status = 'error';
      issues.push('CPU critique');
    } else if (normalizedLoad > 70) {
      status = 'degraded';
      issues.push('CPU élevé');
    }
    
    return {
      status,
      issues,
      metrics: {
        memory: {
          total: Math.round(totalMem / (1024 * 1024)) + ' MB',
          free: Math.round(freeMem / (1024 * 1024)) + ' MB',
          used: Math.round(usedMemPercent) + '%'
        },
        cpu: {
          load: cpuLoad.toFixed(2),
          cores: cpuCount,
          normalized: normalizedLoad.toFixed(2) + '%'
        },
        platform: os.platform(),
        hostname: os.hostname()
      }
    };
  }
  
  /**
   * Obtient le temps de fonctionnement de l'application
   * @returns {Object} Uptime formaté
   */
  getUptime() {
    const uptimeMs = Date.now() - this.startTime;
    const seconds = Math.floor(uptimeMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    return {
      total: uptimeMs,
      formatted: `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`,
      days,
      hours: hours % 24,
      minutes: minutes % 60,
      seconds: seconds % 60
    };
  }
  
  /**
   * Obtient des statistiques sur les erreurs
   * @returns {Object} Statistiques d'erreurs
   */
  getErrorStats() {
    try {
      const generalStats = logger.getErrorStats();
      const weatherStats = weatherErrorHandler.getErrorStats();
      
      return {
        timestamp: new Date(),
        general: generalStats,
        weather: weatherStats
      };
    } catch (error) {
      logger.error('Erreur lors de l\'obtention des statistiques d\'erreurs', { error });
      return {
        timestamp: new Date(),
        error: error.message
      };
    }
  }
  
  /**
   * Analyse les logs pour détecter des modèles récurrents
   * @param {Object} options - Options d'analyse
   * @returns {Object} Résultats de l'analyse
   */
  async analyzeErrorPatterns(options = {}) {
    try {
      const {
        timeframe = 24, // Heures
        minOccurrences = 3,
        types = ['error', 'weather', 'api']
      } = options;
      
      const patterns = {
        bySource: {},
        byHour: {},
        mostFrequent: [],
        trends: []
      };
      
      // Analyse des logs d'erreur généraux
      if (types.includes('error')) {
        const errorStats = logger.getErrorStats();
        patterns.bySource = {
          ...patterns.bySource,
          general: errorStats.byType
        };
        patterns.mostFrequent.push(...errorStats.topErrors.map(e => ({
          ...e,
          source: 'general'
        })));
      }
      
      // Analyse des logs d'erreur météo
      if (types.includes('weather')) {
        const weatherStats = weatherErrorHandler.getErrorStats();
        patterns.bySource = {
          ...patterns.bySource,
          weather: weatherStats.mostCommon
        };
        patterns.mostFrequent.push(...weatherStats.mostCommon.map(e => ({
          message: e.key,
          count: e.count,
          source: 'weather'
        })));
      }
      
      // Trier les erreurs les plus fréquentes
      patterns.mostFrequent.sort((a, b) => b.count - a.count);
      
      return {
        timestamp: new Date(),
        timeframe,
        patterns
      };
    } catch (error) {
      logger.error('Erreur lors de l\'analyse des modèles d\'erreurs', { error });
      return {
        timestamp: new Date(),
        error: error.message
      };
    }
  }
  
  /**
   * Exécute des diagnostics sur les dossiers de logs
   * @returns {Object} Résultats des diagnostics
   */
  async diagnoseLogs() {
    try {
      const logsDir = path.join(__dirname, '../logs');
      const results = {
        size: 0,
        files: 0,
        oldestLog: null,
        newestLog: null,
        byType: {}
      };
      
      if (!fs.existsSync(logsDir)) {
        return {
          error: 'Dossier de logs introuvable',
          path: logsDir
        };
      }
      
      // Parcourir les fichiers de logs récursivement
      const processDirectory = (dir) => {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
          const fullPath = path.join(dir, file);
          const stats = fs.statSync(fullPath);
          
          if (stats.isDirectory()) {
            processDirectory(fullPath);
          } else if (stats.isFile() && file.endsWith('.log')) {
            results.files++;
            results.size += stats.size;
            
            // Déterminer le type de log
            const logType = path.relative(logsDir, dir).split(path.sep)[0] || 'main';
            if (!results.byType[logType]) {
              results.byType[logType] = {
                count: 0,
                size: 0
              };
            }
            results.byType[logType].count++;
            results.byType[logType].size += stats.size;
            
            // Mettre à jour les dates des logs
            if (!results.oldestLog || stats.mtime < results.oldestLog.date) {
              results.oldestLog = {
                file: path.relative(logsDir, fullPath),
                date: stats.mtime
              };
            }
            
            if (!results.newestLog || stats.mtime > results.newestLog.date) {
              results.newestLog = {
                file: path.relative(logsDir, fullPath),
                date: stats.mtime
              };
            }
          }
        }
      };
      
      processDirectory(logsDir);
      
      // Convertir la taille en format lisible
      results.formattedSize = this.formatBytes(results.size);
      Object.keys(results.byType).forEach(type => {
        results.byType[type].formattedSize = this.formatBytes(results.byType[type].size);
      });
      
      return {
        timestamp: new Date(),
        logs: results
      };
    } catch (error) {
      logger.error('Erreur lors du diagnostic des logs', { error });
      return {
        timestamp: new Date(),
        error: error.message
      };
    }
  }
  
  /**
   * Formate les octets en taille lisible
   * @param {Number} bytes - Taille en octets
   * @returns {String} Taille formatée
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

module.exports = new DiagnosticService();
