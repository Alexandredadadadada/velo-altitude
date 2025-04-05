/**
 * Système d'alertes pour le monitoring des performances et services
 * Permet de définir des seuils d'alertes avec différents niveaux de gravité
 * et de distribuer les alertes via différents canaux (email, Slack, SMS)
 */

const winston = require('winston');
const nodemailer = require('nodemailer');
const axios = require('axios');
const config = require('../config/config');

// Configuration du logger spécifique aux alertes
const alertLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'alert-system' },
  transports: [
    new winston.transports.File({ filename: 'logs/alerts-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/alerts-combined.log' })
  ]
});

// Ajouter console en développement
if (process.env.NODE_ENV !== 'production') {
  alertLogger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Configuration des niveaux de gravité
const SEVERITY_LEVELS = {
  INFO: 'info',       // Informationnel uniquement
  WARNING: 'warning', // Nécessite attention
  CRITICAL: 'critical', // Nécessite action immédiate
  EMERGENCY: 'emergency' // Situation critique affectant le service
};

// Configuration des canaux de notification
const NOTIFICATION_CHANNELS = {
  LOG: 'log',    // Uniquement journaliser
  EMAIL: 'email', // Envoyer email
  SLACK: 'slack', // Envoyer message Slack
  SMS: 'sms'     // Envoyer SMS (urgences)
};

// Configuration des destinataires des alertes
const ALERT_RECIPIENTS = {
  ops: {
    email: process.env.OPS_EMAIL || 'ops@grand-est-cyclisme.fr',
    phone: process.env.OPS_PHONE
  },
  dev: {
    email: process.env.DEV_EMAIL || 'dev@grand-est-cyclisme.fr',
    slack: process.env.DEV_SLACK_WEBHOOK
  },
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@grand-est-cyclisme.fr',
    phone: process.env.ADMIN_PHONE,
    slack: process.env.ADMIN_SLACK_WEBHOOK
  }
};

// Configuration des règles d'alertes
const defaultAlertRules = [
  // Règles pour les métriques HTTP
  {
    metric: 'http_request_duration_ms',
    condition: (value) => value > 5000,
    severity: SEVERITY_LEVELS.WARNING,
    message: 'Temps de réponse HTTP élevé détecté',
    channels: [NOTIFICATION_CHANNELS.LOG, NOTIFICATION_CHANNELS.EMAIL],
    recipients: ['dev', 'ops'],
    cooldownMinutes: 15
  },
  {
    metric: 'http_request_duration_ms',
    condition: (value) => value > 10000,
    severity: SEVERITY_LEVELS.CRITICAL,
    message: 'Temps de réponse HTTP critique',
    channels: [NOTIFICATION_CHANNELS.LOG, NOTIFICATION_CHANNELS.EMAIL, NOTIFICATION_CHANNELS.SLACK],
    recipients: ['dev', 'ops', 'admin'],
    cooldownMinutes: 5
  },
  {
    metric: 'api_error_rate',
    condition: (value) => value > 0.05, // 5% d'erreurs
    severity: SEVERITY_LEVELS.WARNING,
    message: 'Taux d\'erreurs API élevé',
    channels: [NOTIFICATION_CHANNELS.LOG, NOTIFICATION_CHANNELS.EMAIL],
    recipients: ['dev', 'ops'],
    cooldownMinutes: 10
  },
  {
    metric: 'api_error_rate',
    condition: (value) => value > 0.15, // 15% d'erreurs
    severity: SEVERITY_LEVELS.CRITICAL,
    message: 'Taux d\'erreurs API critique',
    channels: [NOTIFICATION_CHANNELS.LOG, NOTIFICATION_CHANNELS.EMAIL, NOTIFICATION_CHANNELS.SLACK],
    recipients: ['dev', 'ops', 'admin'],
    cooldownMinutes: 5
  },
  
  // Règles pour les services externes
  {
    metric: 'external_api_quota_remaining',
    condition: (value, metadata) => {
      if (metadata.service === 'strava') return value < 100;
      if (metadata.service === 'weatherapi') return value < 500;
      if (metadata.service === 'mapbox') return value < 10000;
      if (metadata.service === 'nutritiondb') return value < 200;
      return false;
    },
    severity: SEVERITY_LEVELS.WARNING,
    message: 'Quota d\'API externe bas',
    channels: [NOTIFICATION_CHANNELS.LOG, NOTIFICATION_CHANNELS.EMAIL],
    recipients: ['dev', 'ops'],
    cooldownMinutes: 60
  },
  {
    metric: 'external_api_quota_remaining',
    condition: (value, metadata) => {
      if (metadata.service === 'strava') return value < 20;
      if (metadata.service === 'weatherapi') return value < 100;
      if (metadata.service === 'mapbox') return value < 1000;
      if (metadata.service === 'nutritiondb') return value < 50;
      return false;
    },
    severity: SEVERITY_LEVELS.CRITICAL,
    message: 'Quota d\'API externe critique',
    channels: [NOTIFICATION_CHANNELS.LOG, NOTIFICATION_CHANNELS.EMAIL, NOTIFICATION_CHANNELS.SLACK],
    recipients: ['dev', 'ops', 'admin'],
    cooldownMinutes: 30
  },
  {
    metric: 'external_api_errors_total',
    condition: (value, metadata) => value > 10 && metadata.timeframe === '5m',
    severity: SEVERITY_LEVELS.WARNING,
    message: 'Nombre élevé d\'erreurs d\'API externe',
    channels: [NOTIFICATION_CHANNELS.LOG, NOTIFICATION_CHANNELS.EMAIL],
    recipients: ['dev', 'ops'],
    cooldownMinutes: 15
  },
  
  // Règles pour les métriques spécifiques au cyclisme
  {
    metric: 'visualization_3d_rendering_time_ms',
    condition: (value) => value > 8000,
    severity: SEVERITY_LEVELS.WARNING,
    message: 'Temps de rendu 3D élevé',
    channels: [NOTIFICATION_CHANNELS.LOG, NOTIFICATION_CHANNELS.EMAIL],
    recipients: ['dev'],
    cooldownMinutes: 20
  },
  {
    metric: 'visualization_3d_rendering_time_ms',
    condition: (value) => value > 15000,
    severity: SEVERITY_LEVELS.CRITICAL,
    message: 'Temps de rendu 3D critique',
    channels: [NOTIFICATION_CHANNELS.LOG, NOTIFICATION_CHANNELS.EMAIL, NOTIFICATION_CHANNELS.SLACK],
    recipients: ['dev', 'ops'],
    cooldownMinutes: 10
  },
  {
    metric: 'route_planning_calculation_time_ms',
    condition: (value) => value > 5000,
    severity: SEVERITY_LEVELS.WARNING,
    message: 'Temps de calcul d\'itinéraire élevé',
    channels: [NOTIFICATION_CHANNELS.LOG],
    recipients: ['dev'],
    cooldownMinutes: 30
  },
  
  // Règles pour les métriques système
  {
    metric: 'memory_usage_bytes',
    condition: (value) => value > 1.5 * 1024 * 1024 * 1024, // 1.5 GB
    severity: SEVERITY_LEVELS.WARNING,
    message: 'Utilisation mémoire élevée',
    channels: [NOTIFICATION_CHANNELS.LOG, NOTIFICATION_CHANNELS.EMAIL],
    recipients: ['ops'],
    cooldownMinutes: 10
  },
  {
    metric: 'memory_usage_bytes',
    condition: (value) => value > 2.5 * 1024 * 1024 * 1024, // 2.5 GB
    severity: SEVERITY_LEVELS.CRITICAL,
    message: 'Utilisation mémoire critique',
    channels: [NOTIFICATION_CHANNELS.LOG, NOTIFICATION_CHANNELS.EMAIL, NOTIFICATION_CHANNELS.SLACK],
    recipients: ['ops', 'admin'],
    cooldownMinutes: 5
  },
  {
    metric: 'active_sessions',
    condition: (value) => value > 1000,
    severity: SEVERITY_LEVELS.WARNING,
    message: 'Nombre élevé de sessions actives',
    channels: [NOTIFICATION_CHANNELS.LOG, NOTIFICATION_CHANNELS.EMAIL],
    recipients: ['ops'],
    cooldownMinutes: 15
  },
  {
    metric: 'active_sessions',
    condition: (value) => value > 2000,
    severity: SEVERITY_LEVELS.CRITICAL,
    message: 'Nombre critique de sessions actives',
    channels: [NOTIFICATION_CHANNELS.LOG, NOTIFICATION_CHANNELS.EMAIL, NOTIFICATION_CHANNELS.SLACK],
    recipients: ['ops', 'admin'],
    cooldownMinutes: 5
  },
  
  // Règle d'urgence pour la disponibilité du service
  {
    metric: 'service_health',
    condition: (value, metadata) => value === 'down' && metadata.service === 'api',
    severity: SEVERITY_LEVELS.EMERGENCY,
    message: 'Le service API est indisponible',
    channels: [NOTIFICATION_CHANNELS.LOG, NOTIFICATION_CHANNELS.EMAIL, NOTIFICATION_CHANNELS.SLACK, NOTIFICATION_CHANNELS.SMS],
    recipients: ['ops', 'admin', 'dev'],
    cooldownMinutes: 1
  }
];

// Stockage des alertes déjà envoyées (pour éviter les duplications)
const sentAlerts = new Map();

/**
 * Vérifie si une alerte a déjà été envoyée récemment
 * @param {Object} rule - Règle d'alerte
 * @param {string} metricKey - Identifiant unique de la métrique
 * @returns {boolean} - True si l'alerte a déjà été envoyée et est en cooldown
 */
function isAlertInCooldown(rule, metricKey) {
  const alertKey = `${rule.metric}-${metricKey}-${rule.severity}`;
  
  if (sentAlerts.has(alertKey)) {
    const lastSentTime = sentAlerts.get(alertKey);
    const cooldownMs = rule.cooldownMinutes * 60 * 1000;
    
    if (Date.now() - lastSentTime < cooldownMs) {
      return true;
    }
  }
  
  // Mettre à jour le dernier envoi
  sentAlerts.set(alertKey, Date.now());
  return false;
}

/**
 * Envoie une alerte via le canal spécifié
 * @param {string} channel - Canal de notification
 * @param {Object} alert - Contenu de l'alerte
 * @param {Array} recipients - Liste des destinataires
 */
async function sendAlert(channel, alert, recipients) {
  try {
    // Transformer la liste de destinataires en objets destinataires
    const recipientObjects = recipients.map(id => ALERT_RECIPIENTS[id]).filter(Boolean);
    
    switch (channel) {
      case NOTIFICATION_CHANNELS.LOG:
        // Déjà géré par la fonction d'alerte principale
        break;
        
      case NOTIFICATION_CHANNELS.EMAIL:
        await sendEmailAlert(alert, recipientObjects);
        break;
        
      case NOTIFICATION_CHANNELS.SLACK:
        await sendSlackAlert(alert, recipientObjects);
        break;
        
      case NOTIFICATION_CHANNELS.SMS:
        await sendSmsAlert(alert, recipientObjects);
        break;
        
      default:
        alertLogger.warn(`Canal d'alerte non reconnu: ${channel}`);
    }
  } catch (error) {
    alertLogger.error(`Erreur lors de l'envoi d'alerte via ${channel}:`, error);
  }
}

/**
 * Envoie une alerte par email
 * @param {Object} alert - Contenu de l'alerte
 * @param {Array} recipients - Liste des destinataires
 */
async function sendEmailAlert(alert, recipients) {
  // Récupérer les emails des destinataires
  const emails = recipients
    .map(recipient => recipient.email)
    .filter(Boolean);
    
  if (emails.length === 0) return;
  
  try {
    // Configuration de l'envoi d'email (à adapter selon votre infrastructure)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.grand-est-cyclisme.fr',
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
    
    // Construire le contenu de l'email
    const subject = `[${alert.severity.toUpperCase()}] ${alert.message}`;
    const textBody = `
      Alerte: ${alert.message}
      Sévérité: ${alert.severity}
      Métrique: ${alert.metric}
      Valeur: ${alert.value}
      Timestamp: ${new Date(alert.timestamp).toLocaleString()}
      
      ${alert.details ? `Détails: ${alert.details}` : ''}
      
      Cette alerte a été générée automatiquement par le système de monitoring du site Grand Est Cyclisme.
    `;
    
    // Envoyer l'email
    await transporter.sendMail({
      from: process.env.ALERT_EMAIL_FROM || 'monitoring@grand-est-cyclisme.fr',
      to: emails.join(', '),
      subject,
      text: textBody
    });
    
    alertLogger.info(`Alerte envoyée par email à ${emails.join(', ')}`);
  } catch (error) {
    alertLogger.error('Erreur lors de l\'envoi d\'alerte par email:', error);
  }
}

/**
 * Envoie une alerte via Slack
 * @param {Object} alert - Contenu de l'alerte
 * @param {Array} recipients - Liste des destinataires
 */
async function sendSlackAlert(alert, recipients) {
  // Récupérer les webhooks Slack des destinataires
  const webhooks = recipients
    .map(recipient => recipient.slack)
    .filter(Boolean);
    
  if (webhooks.length === 0) return;
  
  // Déterminer la couleur en fonction de la sévérité
  let color = '#36a64f'; // Vert par défaut
  switch (alert.severity) {
    case SEVERITY_LEVELS.WARNING:
      color = '#f2c744'; // Jaune
      break;
    case SEVERITY_LEVELS.CRITICAL:
      color = '#f25a38'; // Orange
      break;
    case SEVERITY_LEVELS.EMERGENCY:
      color = '#d40e0d'; // Rouge
      break;
  }
  
  // Créer le payload Slack
  const payload = {
    attachments: [
      {
        color,
        pretext: `*[${alert.severity.toUpperCase()}]* ${alert.message}`,
        fields: [
          {
            title: 'Métrique',
            value: alert.metric,
            short: true
          },
          {
            title: 'Valeur',
            value: alert.value.toString(),
            short: true
          },
          {
            title: 'Timestamp',
            value: new Date(alert.timestamp).toLocaleString(),
            short: true
          }
        ],
        footer: 'Grand Est Cyclisme Monitoring'
      }
    ]
  };
  
  // Ajouter des détails si disponibles
  if (alert.details) {
    payload.attachments[0].fields.push({
      title: 'Détails',
      value: alert.details
    });
  }
  
  // Envoyer à chaque webhook
  for (const webhook of webhooks) {
    try {
      await axios.post(webhook, payload);
      alertLogger.info(`Alerte envoyée via Slack`);
    } catch (error) {
      alertLogger.error(`Erreur lors de l'envoi d'alerte via Slack:`, error);
    }
  }
}

/**
 * Envoie une alerte par SMS (via service externe)
 * @param {Object} alert - Contenu de l'alerte
 * @param {Array} recipients - Liste des destinataires
 */
async function sendSmsAlert(alert, recipients) {
  // Récupérer les numéros de téléphone des destinataires
  const phones = recipients
    .map(recipient => recipient.phone)
    .filter(Boolean);
    
  if (phones.length === 0) return;
  
  // Construire le contenu SMS
  const message = `[${alert.severity.toUpperCase()}] ${alert.message} - ${alert.metric}: ${alert.value} - Grand Est Cyclisme`;
  
  // Configuration du service SMS (à adapter selon votre fournisseur)
  const SMS_API_URL = process.env.SMS_API_URL;
  const SMS_API_KEY = process.env.SMS_API_KEY;
  
  if (!SMS_API_URL || !SMS_API_KEY) {
    alertLogger.error('Configuration SMS manquante');
    return;
  }
  
  // Envoyer à chaque numéro
  for (const phone of phones) {
    try {
      await axios.post(SMS_API_URL, {
        to: phone,
        message,
        api_key: SMS_API_KEY
      });
      alertLogger.info(`Alerte SMS envoyée à ${phone}`);
    } catch (error) {
      alertLogger.error(`Erreur lors de l'envoi d'alerte SMS:`, error);
    }
  }
}

/**
 * Traite une alerte, vérifie les conditions et envoie les notifications
 * @param {Object} rule - Règle d'alerte
 * @param {number|string} value - Valeur de la métrique
 * @param {Object} metadata - Métadonnées supplémentaires
 * @returns {boolean} - true si l'alerte a été déclenchée
 */
async function processAlert(rule, value, metadata = {}) {
  // Vérifier la condition
  try {
    const conditionMet = rule.condition(value, metadata);
    
    if (!conditionMet) return false;
    
    // Construire une clé unique pour cette métrique
    const metricKey = Object.entries(metadata)
      .filter(([k, v]) => k !== 'timeframe')
      .map(([k, v]) => `${k}:${v}`)
      .join('-');
      
    // Vérifier le cooldown
    if (isAlertInCooldown(rule, metricKey)) {
      return false;
    }
    
    // Préparer l'alerte
    const alert = {
      metric: rule.metric,
      value,
      severity: rule.severity,
      message: rule.message,
      timestamp: Date.now(),
      metadata,
      details: metadata.details || null
    };
    
    // Journaliser l'alerte
    switch (rule.severity) {
      case SEVERITY_LEVELS.INFO:
        alertLogger.info(`[ALERTE] ${rule.message}`, alert);
        break;
      case SEVERITY_LEVELS.WARNING:
        alertLogger.warn(`[ALERTE] ${rule.message}`, alert);
        break;
      case SEVERITY_LEVELS.CRITICAL:
        alertLogger.error(`[ALERTE] ${rule.message}`, alert);
        break;
      case SEVERITY_LEVELS.EMERGENCY:
        alertLogger.error(`[ALERTE URGENTE] ${rule.message}`, alert);
        break;
    }
    
    // Envoyer aux canaux configurés
    for (const channel of rule.channels) {
      if (channel !== NOTIFICATION_CHANNELS.LOG) {
        await sendAlert(channel, alert, rule.recipients);
      }
    }
    
    return true;
  } catch (error) {
    alertLogger.error(`Erreur lors du traitement de l'alerte:`, error);
    return false;
  }
}

/**
 * Vérifie une métrique par rapport à toutes les règles d'alerte
 * @param {string} metricName - Nom de la métrique
 * @param {number|string} value - Valeur de la métrique
 * @param {Object} metadata - Métadonnées supplémentaires
 * @returns {Promise<Array>} - Liste des alertes déclenchées
 */
async function checkMetricAgainstRules(metricName, value, metadata = {}) {
  const triggeredAlerts = [];
  
  // Trouver toutes les règles applicables à cette métrique
  const applicableRules = alertRules.filter(rule => rule.metric === metricName);
  
  for (const rule of applicableRules) {
    const alertTriggered = await processAlert(rule, value, metadata);
    if (alertTriggered) {
      triggeredAlerts.push({
        rule: rule.message,
        severity: rule.severity,
        value
      });
    }
  }
  
  return triggeredAlerts;
}

// Initialiser les règles d'alerte
let alertRules = [...defaultAlertRules];

/**
 * Initialise le système d'alertes
 * @param {Array} customRules - Règles d'alerte personnalisées
 */
function initAlertSystem(customRules = []) {
  // Fusionner avec les règles personnalisées
  alertRules = [...defaultAlertRules, ...customRules];
  
  alertLogger.info(`Système d'alertes initialisé avec ${alertRules.length} règles`);
  
  return {
    checkMetricAgainstRules,
    SEVERITY_LEVELS,
    NOTIFICATION_CHANNELS
  };
}

module.exports = {
  initAlertSystem,
  checkMetricAgainstRules,
  SEVERITY_LEVELS,
  NOTIFICATION_CHANNELS
};
