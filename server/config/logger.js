/**
 * Configuration du système de logging pour Dashboard-Velo
 * Utilise Winston pour des logs structurés et formatés
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Créer le répertoire de logs s'il n'existe pas
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Format personnalisé pour les logs
const customFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Format pour la console
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(
    info => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Niveaux de log personnalisés pour Dashboard-Velo
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6
};

// Création du logger
const logger = winston.createLogger({
  levels,
  format: customFormat,
  defaultMeta: { service: 'dashboard-velo-api' },
  transports: [
    // Logs d'erreur dans un fichier séparé
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Tous les logs dans un fichier combiné
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
    // Logs dans la console en développement
    new winston.transports.Console({
      format: consoleFormat,
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    })
  ],
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logDir, 'exceptions.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logDir, 'rejections.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  ]
});

// Ajouter des méthodes pratiques pour les logs de performance
logger.performance = {
  start: (label) => {
    const startTime = process.hrtime();
    return {
      end: () => {
        const hrtime = process.hrtime(startTime);
        const duration = hrtime[0] * 1000 + hrtime[1] / 1000000;
        logger.debug(`Performance [${label}]: ${duration.toFixed(2)}ms`);
        return duration;
      }
    };
  }
};

// Ajouter des méthodes pour les logs d'API
logger.api = {
  request: (req, res, next) => {
    const start = process.hrtime();
    
    // Une fois la réponse terminée
    res.on('finish', () => {
      const hrtime = process.hrtime(start);
      const duration = hrtime[0] * 1000 + hrtime[1] / 1000000;
      
      const logInfo = {
        method: req.method,
        url: req.originalUrl || req.url,
        status: res.statusCode,
        duration: `${duration.toFixed(2)}ms`,
        userAgent: req.get('user-agent') || '',
        ip: req.ip || req.connection.remoteAddress
      };
      
      // Ajouter l'ID utilisateur si disponible
      if (req.user && req.user.id) {
        logInfo.userId = req.user.id;
      }
      
      // Log différent selon le statut de la réponse
      if (res.statusCode >= 400) {
        logger.warn(`API Request: ${JSON.stringify(logInfo)}`);
      } else {
        logger.http(`API Request: ${JSON.stringify(logInfo)}`);
      }
    });
    
    next();
  }
};

// Exporter le logger
module.exports = logger;
