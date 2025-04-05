/**
 * SecureLogger - Système de journalisation sécurisé
 * Dashboard-Velo.com
 * 
 * Ce module fournit un système de journalisation qui masque automatiquement
 * les données sensibles comme les clés API, tokens JWT, etc.
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

class SecureLogger {
  /**
   * Crée une nouvelle instance de logger sécurisé
   * @param {Object} options Options de configuration
   */
  constructor(options = {}) {
    this.options = {
      maskSensitiveData: true,
      logLevel: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      logDir: path.join(process.cwd(), 'logs'),
      ...options
    };
    
    // Créer le répertoire de logs s'il n'existe pas
    if (!fs.existsSync(this.options.logDir)) {
      fs.mkdirSync(this.options.logDir, { recursive: true });
    }
    
    // Patterns pour détecter les données sensibles
    this.sensitivePatterns = [
      // Patterns pour les clés API génériques (8+ caractères avec tirets/underscores)
      /([a-zA-Z0-9]{8,}[-_]?[a-zA-Z0-9]{4,}[-_]?[a-zA-Z0-9]{4,})/g,
      // Pattern pour les clés OpenAI
      /sk-[a-zA-Z0-9]{32,}/g,
      // Pattern pour les tokens JWT
      /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g,
      // Pattern pour les clés Mapbox
      /pk\.[a-zA-Z0-9]{60,}/g,
      // Pattern pour les clés Strava
      /[0-9a-f]{32}/g
    ];
    
    // Configurer le logger Winston
    this.logger = winston.createLogger({
      level: this.options.logLevel,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        // Écrire dans les fichiers de log
        new winston.transports.File({ 
          filename: path.join(this.options.logDir, 'error.log'), 
          level: 'error' 
        }),
        new winston.transports.File({ 
          filename: path.join(this.options.logDir, 'combined.log') 
        })
      ]
    });
    
    // Ajouter la console en développement
    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      }));
    }
  }

  /**
   * Masque les données sensibles dans une chaîne
   * @param {string} message Message à masquer
   * @returns {string} Message masqué
   */
  maskSensitiveData(message) {
    if (!this.options.maskSensitiveData || typeof message !== 'string') {
      return message;
    }
    
    let maskedMessage = message;
    
    this.sensitivePatterns.forEach(pattern => {
      maskedMessage = maskedMessage.replace(pattern, (match) => {
        // Garder les 4 premiers et 2 derniers caractères, masquer le reste
        if (match.length <= 8) return match; // Ne pas masquer les chaînes trop courtes
        const firstChars = match.substring(0, 4);
        const lastChars = match.substring(match.length - 2);
        return `${firstChars}${'*'.repeat(match.length - 6)}${lastChars}`;
      });
    });
    
    return maskedMessage;
  }

  /**
   * Masque les données sensibles dans un objet
   * @param {Object} obj Objet à masquer
   * @returns {Object} Objet avec données masquées
   */
  maskSensitiveDataInObject(obj) {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }
    
    const result = Array.isArray(obj) ? [] : {};
    
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        
        if (typeof value === 'string') {
          result[key] = this.maskSensitiveData(value);
        } else if (typeof value === 'object' && value !== null) {
          result[key] = this.maskSensitiveDataInObject(value);
        } else {
          result[key] = value;
        }
      }
    }
    
    return result;
  }

  /**
   * Vérifie si un niveau de log doit être journalisé
   * @param {string} level Niveau de log
   * @returns {boolean} true si le niveau doit être journalisé
   */
  shouldLog(level) {
    const levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
      silly: 4
    };
    
    return levels[level] <= levels[this.options.logLevel];
  }

  /**
   * Journalise un message
   * @param {string} level Niveau de log
   * @param {string} message Message à journaliser
   * @param {Object} data Données additionnelles
   */
  log(level, message, data = {}) {
    if (this.shouldLog(level)) {
      const maskedMessage = this.maskSensitiveData(message);
      const maskedData = this.maskSensitiveDataInObject(data);
      
      this.logger.log({
        level,
        message: maskedMessage,
        ...maskedData
      });
    }
  }

  /**
   * Journalise une erreur
   * @param {string} message Message d'erreur
   * @param {Object} data Données additionnelles
   */
  error(message, data = {}) {
    this.log('error', message, data);
  }

  /**
   * Journalise un avertissement
   * @param {string} message Message d'avertissement
   * @param {Object} data Données additionnelles
   */
  warn(message, data = {}) {
    this.log('warn', message, data);
  }

  /**
   * Journalise une information
   * @param {string} message Message d'information
   * @param {Object} data Données additionnelles
   */
  info(message, data = {}) {
    this.log('info', message, data);
  }

  /**
   * Journalise un message de débogage
   * @param {string} message Message de débogage
   * @param {Object} data Données additionnelles
   */
  debug(message, data = {}) {
    this.log('debug', message, data);
  }
}

// Créer une instance par défaut
const logger = new SecureLogger();

module.exports = {
  SecureLogger,
  logger
};
