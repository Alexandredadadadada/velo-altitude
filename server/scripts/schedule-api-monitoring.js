#!/usr/bin/env node

/**
 * Script d'automatisation du monitoring des API
 * Exécute les vérifications à intervalle régulier et envoie des notifications
 */
const cron = require('node-cron');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const { exec } = require('child_process');
const apiQuotaMonitor = require('../services/api-quota-monitor.service');

// Charger les variables d'environnement
dotenv.config();

// Configuration des emails
const emailConfig = {
  enabled: process.env.EMAIL_NOTIFICATIONS_ENABLED === 'true',
  from: process.env.EMAIL_FROM || 'alerts@cyclisme-europe.eu',
  to: process.env.EMAIL_ALERTS_TO || 'admin@cyclisme-europe.eu',
  smtpHost: process.env.SMTP_HOST || 'smtp.example.com',
  smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS
};

// Configuration des seuils d'alerte
const alertThresholds = {
  quotaWarning: 80, // Pourcentage d'utilisation des quotas avant alerte
  latencyWarning: 2000, // Temps de réponse en ms considéré comme lent
  errorCountThreshold: 3 // Nombre d'erreurs consécutives avant alerte critique
};

// Variables pour suivre les erreurs
const apiErrorCounts = {};
const apiAlertsHistory = {};

// Créer un transporteur pour l'envoi d'emails
let transporter = null;
if (emailConfig.enabled) {
  try {
    transporter = nodemailer.createTransport({
      host: emailConfig.smtpHost,
      port: emailConfig.smtpPort,
      secure: emailConfig.smtpPort === 465,
      auth: {
        user: emailConfig.smtpUser,
        pass: emailConfig.smtpPass
      }
    });
    console.log('Configuration email initialisée');
  } catch (error) {
    console.error('Erreur lors de la configuration du transporteur email:', error);
  }
}

/**
 * Exécute la vérification de l'état de santé des API
 */
async function runHealthCheck() {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, 'api-health-check.js');
    
    console.log(`Exécution de la vérification de santé des API: ${new Date().toISOString()}`);
    
    exec(`node ${scriptPath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Erreur lors de l'exécution du script de vérification:`, error);
        return reject(error);
      }
      
      if (stderr) {
        console.error(`Erreurs standard:`, stderr);
      }
      
      console.log(`Vérification terminée avec succès`);
      resolve(stdout);
    });
  });
}

/**
 * Vérifie les quotas des API et génère des alertes si nécessaire
 */
async function checkApiQuotas() {
  console.log(`Vérification des quotas d'API: ${new Date().toISOString()}`);
  
  try {
    // Récupérer les quotas pour toutes les API
    const quotas = apiQuotaMonitor.checkAllQuotas();
    
    // Vérifier chaque API pour des alertes
    for (const [apiName, apiQuota] of Object.entries(quotas)) {
      if (apiQuota.percentUsed >= alertThresholds.quotaWarning) {
        const message = `⚠️ Alerte quota: ${apiName} a atteint ${apiQuota.percentUsed}% de son quota (${apiQuota.remaining} appels restants)`;
        console.log(message);
        
        // Éviter les alertes répétitives (une seule alerte par jour)
        const today = new Date().toDateString();
        if (!apiAlertsHistory[apiName] || apiAlertsHistory[apiName].date !== today || 
            apiAlertsHistory[apiName].percent < apiQuota.percentUsed) {
          
          apiAlertsHistory[apiName] = {
            date: today,
            percent: apiQuota.percentUsed,
            type: 'quota'
          };
          
          // Envoyer une notification par email
          await sendAlertEmail({
            subject: `Alerte Quota API - ${apiName}`,
            message,
            details: apiQuota
          });
        }
      }
    }
  } catch (error) {
    console.error('Erreur lors de la vérification des quotas:', error);
  }
}

/**
 * Analyse les logs de santé pour générer des alertes
 */
async function analyzeHealthLogs() {
  console.log(`Analyse des logs de santé: ${new Date().toISOString()}`);
  
  try {
    const logPath = path.resolve(process.cwd(), 'logs/api-health.log');
    
    if (!fs.existsSync(logPath)) {
      console.log('Fichier de log non trouvé');
      return;
    }
    
    // Lire les dernières lignes du fichier de log
    const logs = fs.readFileSync(logPath, 'utf8')
      .split('\n')
      .filter(line => line.trim())
      .slice(-100); // Analyser les 100 dernières entrées
    
    // Analyser chaque entrée de log
    const apiStatuses = {};
    
    for (const log of logs) {
      try {
        const entry = JSON.parse(log);
        const { timestamp, api, healthy, latency } = entry;
        
        // Ignorer les entrées trop anciennes (plus de 6 heures)
        const entryTime = new Date(timestamp);
        const now = new Date();
        const hoursDiff = (now - entryTime) / (1000 * 60 * 60);
        
        if (hoursDiff > 6) continue;
        
        // Regrouper les statuts par API
        if (!apiStatuses[api]) {
          apiStatuses[api] = {
            checks: [],
            latencies: []
          };
        }
        
        apiStatuses[api].checks.push(healthy);
        apiStatuses[api].latencies.push(latency);
        
        // Réinitialiser le compteur d'erreurs si l'API est en bonne santé
        if (healthy) {
          apiErrorCounts[api] = 0;
        }
      } catch (e) {
        console.error('Erreur lors de l\'analyse d\'une entrée de log:', e);
      }
    }
    
    // Analyser les statuts pour chaque API
    for (const [api, status] of Object.entries(apiStatuses)) {
      // Calculer le taux d'erreur
      const totalChecks = status.checks.length;
      const failedChecks = status.checks.filter(check => !check).length;
      const errorRate = (failedChecks / totalChecks) * 100;
      
      // Calculer la latence moyenne
      const avgLatency = status.latencies.reduce((sum, latency) => sum + latency, 0) / status.latencies.length;
      
      // Vérifier si la dernière vérification a échoué
      const lastCheckFailed = status.checks[status.checks.length - 1] === false;
      
      if (lastCheckFailed) {
        // Incrémenter le compteur d'erreurs consécutives
        apiErrorCounts[api] = (apiErrorCounts[api] || 0) + 1;
        
        // Générer une alerte si le seuil est dépassé
        if (apiErrorCounts[api] >= alertThresholds.errorCountThreshold) {
          const message = `🔴 Alerte critique: ${api} est en échec depuis ${apiErrorCounts[api]} vérifications consécutives`;
          console.log(message);
          
          // Éviter les alertes répétitives (maximum une alerte par heure)
          const now = new Date();
          if (!apiAlertsHistory[api] || 
              apiAlertsHistory[api].type !== 'error' || 
              (now - new Date(apiAlertsHistory[api].timestamp)) > 60 * 60 * 1000) {
            
            apiAlertsHistory[api] = {
              timestamp: now.toISOString(),
              type: 'error'
            };
            
            // Envoyer une notification par email
            await sendAlertEmail({
              subject: `⚠️ ALERTE CRITIQUE - API ${api} en échec`,
              message,
              details: {
                errorRate: `${errorRate.toFixed(1)}%`,
                consecutiveFailures: apiErrorCounts[api],
                avgLatency: `${avgLatency.toFixed(0)} ms`
              }
            });
          }
        }
      }
      
      // Alerte de latence élevée
      if (avgLatency > alertThresholds.latencyWarning && failedChecks === 0) {
        const message = `⚠️ Alerte performance: ${api} a une latence moyenne élevée (${avgLatency.toFixed(0)} ms)`;
        console.log(message);
        
        // Éviter les alertes répétitives (maximum une alerte par jour)
        const today = new Date().toDateString();
        if (!apiAlertsHistory[api] || 
            apiAlertsHistory[api].type !== 'latency' || 
            apiAlertsHistory[api].date !== today) {
            
          apiAlertsHistory[api] = {
            date: today,
            type: 'latency'
          };
          
          // Envoyer une notification par email
          await sendAlertEmail({
            subject: `Alerte Performance API - ${api}`,
            message,
            details: {
              avgLatency: `${avgLatency.toFixed(0)} ms`,
              threshold: `${alertThresholds.latencyWarning} ms`
            }
          });
        }
      }
    }
    
  } catch (error) {
    console.error('Erreur lors de l\'analyse des logs de santé:', error);
  }
}

/**
 * Envoie un email d'alerte
 * @param {Object} options - Options de l'email
 */
async function sendAlertEmail(options) {
  if (!emailConfig.enabled || !transporter) {
    console.log('Notifications email désactivées ou non configurées');
    return;
  }
  
  try {
    // Construire le contenu HTML de l'email
    let htmlContent = `
      <h2>${options.subject}</h2>
      <p>${options.message}</p>
      <h3>Détails :</h3>
      <ul>
    `;
    
    for (const [key, value] of Object.entries(options.details)) {
      htmlContent += `<li><strong>${key}</strong>: ${value}</li>`;
    }
    
    htmlContent += `
      </ul>
      <p>Date et heure: ${new Date().toLocaleString()}</p>
      <hr>
      <p><em>Ce message a été généré automatiquement par le système de monitoring du Tableau de Bord Européen de Cyclisme.</em></p>
    `;
    
    // Envoyer l'email
    const mailOptions = {
      from: emailConfig.from,
      to: emailConfig.to,
      subject: options.subject,
      html: htmlContent
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log(`Email d'alerte envoyé: ${result.messageId}`);
    
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email d\'alerte:', error);
  }
}

/**
 * Planification des tâches de monitoring
 */

// Vérification de l'état de santé toutes les heures
cron.schedule('0 * * * *', async () => {
  try {
    await runHealthCheck();
    await analyzeHealthLogs();
  } catch (error) {
    console.error('Erreur lors de l\'exécution des vérifications de santé:', error);
  }
});

// Vérification des quotas toutes les 4 heures
cron.schedule('0 */4 * * *', async () => {
  try {
    await checkApiQuotas();
  } catch (error) {
    console.error('Erreur lors de la vérification des quotas:', error);
  }
});

// Exécution immédiate au démarrage
(async () => {
  try {
    console.log('=== Démarrage du système de monitoring automatique des API ===');
    
    // Vérifier que les répertoires nécessaires existent
    const logsDir = path.resolve(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    // Exécuter une première vérification
    await runHealthCheck();
    await checkApiQuotas();
    await analyzeHealthLogs();
    
    console.log(`Monitoring des API démarré avec succès. Vérifications planifiées.`);
  } catch (error) {
    console.error('Erreur lors du démarrage du système de monitoring:', error);
  }
})();

// Gérer la fermeture propre
process.on('SIGINT', () => {
  console.log('Arrêt du système de monitoring des API...');
  process.exit(0);
});

module.exports = {
  runHealthCheck,
  checkApiQuotas,
  analyzeHealthLogs
};
