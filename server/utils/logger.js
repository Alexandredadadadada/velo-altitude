/**
 * Module de logging pour l'application
 * Centralise et normalise les logs de l'application
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');
const { createHash } = require('crypto');

// Créer le répertoire de logs s'il n'existe pas
const logsDir = path.join(__dirname, '../logs');
const errorLogsDir = path.join(logsDir, 'errors');
const apiLogsDir = path.join(logsDir, 'api');

// Créer les sous-répertoires nécessaires
[logsDir, errorLogsDir, apiLogsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Format personnalisé pour les logs
const customFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.printf((info) => {
    let logMessage = `${info.timestamp} [${info.level.toUpperCase()}] ${info.message}`;
    
    // Ajouter les méta-données si présentes, en excluant les champs standards
    if (info.meta) {
      logMessage += ` | ${JSON.stringify(info.meta)}`;
    }
    
    return logMessage;
  })
);

// Format JSON pour les fichiers de log
const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

// Configuration du logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: jsonFormat,
  defaultMeta: { service: 'grand-est-cyclisme' },
  transports: [
    // Sortie console pour le développement
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        customFormat
      )
    }),
    // Fichier de log pour toutes les informations
    new winston.transports.File({ 
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Fichier spécifique pour les erreurs
    new winston.transports.File({ 
      filename: path.join(errorLogsDir, 'error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Fichier spécifique pour les API
    new winston.transports.File({ 
      filename: path.join(apiLogsDir, 'api.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],
  // Ne pas quitter en cas d'erreur non gérée
  exitOnError: false
});

// Journaliser les erreurs non gérées
process.on('uncaughtException', (error) => {
  logger.error('Erreur non gérée', { 
    error: error.message,
    stack: error.stack
  });
  
  // En production, on pourrait vouloir redémarrer proprement le serveur ici
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Promesse rejetée non gérée', {
    reason: reason.message || reason,
    stack: reason.stack
  });
});

// Stockage des erreurs pour analyse et tendances
const errorStore = {
  recentErrors: new Map(), // Pour les erreurs récentes
  errorCounts: new Map(),  // Pour le comptage des erreurs
  errorsByType: new Map(),  // Erreurs groupées par type
  lastCleanup: Date.now()
};

// Nettoyage périodique des erreurs anciennes (toutes les 24 heures)
setInterval(() => {
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  
  let oldErrorsCount = 0;
  
  // Nettoyer les erreurs récentes de plus de 24h
  errorStore.recentErrors.forEach((value, key) => {
    if (value.timestamp < oneDayAgo) {
      errorStore.recentErrors.delete(key);
      oldErrorsCount++;
    }
  });
  
  logger.info(`Nettoyage des erreurs anciennes terminé: ${oldErrorsCount} erreurs supprimées`);
  errorStore.lastCleanup = now;
}, 24 * 60 * 60 * 1000);

// Version améliorée pour l'exportation
module.exports = {
  logger,
  
  // Méthodes utilitaires améliorées
  debug: (message, meta = {}) => logger.debug(message, { meta }),
  
  info: (message, meta = {}) => logger.info(message, { meta }),
  
  warn: (message, meta = {}) => logger.warn(message, { meta }),
  
  error: (message, errorOrMeta = null) => {
    let meta = {};
    let errorObj = null;
    
    if (errorOrMeta instanceof Error) {
      errorObj = errorOrMeta;
      meta = {
        errorMessage: errorObj.message,
        stack: errorObj.stack
      };
    } else if (errorOrMeta && typeof errorOrMeta === 'object') {
      meta = errorOrMeta;
      if (meta.error instanceof Error) {
        errorObj = meta.error;
        meta.errorMessage = errorObj.message;
        meta.stack = errorObj.stack;
      }
    }
    
    // Journaliser l'erreur
    logger.error(message, { meta });
    
    // Stocker l'erreur pour analyse des tendances
    if (errorObj || meta.errorMessage) {
      const errorMessage = errorObj ? errorObj.message : meta.errorMessage;
      const errorHash = createHash('md5').update(errorMessage).digest('hex');
      
      // Incrémenter le compteur pour ce type d'erreur
      const currentCount = errorStore.errorCounts.get(errorHash) || 0;
      errorStore.errorCounts.set(errorHash, currentCount + 1);
      
      // Stocker l'erreur récente
      errorStore.recentErrors.set(errorHash, {
        message: errorMessage,
        meta,
        count: currentCount + 1,
        timestamp: Date.now()
      });
      
      // Grouper par type (premier mot du message d'erreur)
      const errorType = errorMessage.split(' ')[0];
      if (!errorStore.errorsByType.has(errorType)) {
        errorStore.errorsByType.set(errorType, []);
      }
      
      const typeErrors = errorStore.errorsByType.get(errorType);
      if (typeErrors.length >= 100) {
        typeErrors.shift(); // Limiter à 100 erreurs par type
      }
      typeErrors.push({
        hash: errorHash,
        message: errorMessage,
        timestamp: Date.now()
      });
    }
    
    return errorObj || new Error(message);
  },
  
  // Journaliser les erreurs d'un domaine spécifique
  logDomainError: (domain, message, meta = {}) => {
    const domainLogFile = path.join(errorLogsDir, `${domain}.log`);
    
    // Créer un logger spécifique pour ce domaine s'il n'existe pas déjà
    if (!winston.loggers.has(domain)) {
      winston.loggers.add(domain, {
        format: jsonFormat,
        transports: [
          new winston.transports.File({
            filename: domainLogFile,
            maxsize: 5242880, // 5MB
            maxFiles: 3
          })
        ]
      });
    }
    
    // Journaliser l'erreur du domaine
    winston.loggers.get(domain).error(message, { meta });
    
    // Également journaliser dans le log principal
    logger.error(`[${domain}] ${message}`, { meta, domain });
  },
  
  // Obtenir des statistiques sur les erreurs
  getErrorStats: () => {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    
    // Compter les erreurs de la dernière heure
    let recentErrorCount = 0;
    errorStore.recentErrors.forEach(error => {
      if (error.timestamp > oneHourAgo) {
        recentErrorCount++;
      }
    });
    
    // Trouver les erreurs les plus fréquentes
    const sortedErrors = [...errorStore.errorCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // Top 5
    
    return {
      total: errorStore.recentErrors.size,
      lastHour: recentErrorCount,
      topErrors: sortedErrors.map(([hash, count]) => {
        const error = errorStore.recentErrors.get(hash);
        return {
          message: error ? error.message : 'Erreur inconnue',
          count,
          lastSeen: error ? new Date(error.timestamp).toISOString() : null
        };
      }),
      byType: Array.from(errorStore.errorsByType.keys()).map(type => ({
        type,
        count: errorStore.errorsByType.get(type).length
      }))
    };
  },
  
  // Middleware Express pour logger les requêtes
  requestLogger: (req, res, next) => {
    const start = Date.now();
    
    // Une fois la réponse envoyée
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`, {
        meta: {
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          duration,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        }
      });
      
      // Journaliser séparément les requêtes API pour analyse de performance
      if (req.originalUrl.startsWith('/api/')) {
        // Créer un logger spécifique pour l'API si nécessaire
        if (!winston.loggers.has('api-performance')) {
          winston.loggers.add('api-performance', {
            format: jsonFormat,
            transports: [
              new winston.transports.File({
                filename: path.join(apiLogsDir, 'performance.log'),
                maxsize: 5242880, // 5MB
                maxFiles: 3
              })
            ]
          });
        }
        
        winston.loggers.get('api-performance').info('API Request', {
          meta: {
            method: req.method,
            endpoint: req.originalUrl,
            statusCode: res.statusCode,
            duration,
            timestamp: new Date().toISOString()
          }
        });
      }
    });
    
    next();
  },
  
  // Middleware de gestion des erreurs pour Express
  errorHandler: (err, req, res, next) => {
    // Journaliser l'erreur avec contexte de la requête
    logger.error(`Erreur non gérée dans la requête ${req.method} ${req.originalUrl}`, {
      meta: {
        error: err.message,
        stack: err.stack,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        requestBody: req.body
      }
    });
    
    // Créer des logs détaillés pour les erreurs d'API 
    if (req.originalUrl.startsWith('/api/')) {
      module.exports.logDomainError('api-errors', err.message, {
        method: req.method,
        url: req.originalUrl,
        statusCode: 500,
        requestBody: req.body,
        requestParams: req.params,
        requestQuery: req.query,
        stack: err.stack
      });
    }
    
    // Envoyer une réponse d'erreur appropriée au client
    res.status(500).json({
      status: 'error',
      message: process.env.NODE_ENV === 'production' 
        ? 'Une erreur interne est survenue'
        : err.message,
      // Ajouter un ID d'erreur en production pour faciliter le diagnostic des utilisateurs
      errorId: process.env.NODE_ENV === 'production' 
        ? createHash('md5').update(Date.now().toString()).digest('hex').substring(0, 8)
        : undefined
    });
  }
};
