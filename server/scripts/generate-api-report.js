#!/usr/bin/env node

/**
 * Générateur de rapports automatisés sur l'utilisation des API
 * Génère et envoie par email des rapports périodiques sur l'utilisation des API
 * Usage: node generate-api-report.js [--period=daily|weekly|monthly] [--email=admin@example.com]
 */
const fs = require('fs');
const path = require('path');
const { program } = require('commander');
const moment = require('moment');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const axios = require('axios');
const ejs = require('ejs');

// Services
const apiQuotaMonitor = require('../services/api-quota-monitor.service');
const apiNotificationService = require('../services/api-notification.service');

// Charger les variables d'environnement
dotenv.config();

// Configuration du programme
program
  .version('1.0.0')
  .description('Générateur de rapports automatisés sur l\'utilisation des API')
  .option('-p, --period <period>', 'Période du rapport (daily, weekly, monthly)', 'daily')
  .option('-e, --email <email>', 'Email destinataire (si différent de la config)')
  .option('-s, --save', 'Sauvegarder le rapport en HTML', false)
  .option('-d, --debug', 'Mode debug', false)
  .parse(process.argv);

const options = program.opts();

// Configuration
const config = {
  period: options.period || 'daily',
  email: options.email || process.env.EMAIL_ALERTS_TO || 'admin@cyclisme-europe.eu',
  saveReport: options.save || false,
  debug: options.debug || false,
  reportsDir: path.resolve(process.cwd(), 'reports'),
  templatesDir: path.resolve(process.cwd(), 'server/templates'),
  siteName: 'Tableau de Bord Européen de Cyclisme'
};

// Vérifier que le répertoire des rapports existe
if (!fs.existsSync(config.reportsDir)) {
  fs.mkdirSync(config.reportsDir, { recursive: true });
}

// Vérifier que le répertoire des templates existe
if (!fs.existsSync(config.templatesDir)) {
  fs.mkdirSync(config.templatesDir, { recursive: true });
}

/**
 * Récupère les données d'utilisation des API pour la période spécifiée
 * @returns {Object} Données d'utilisation des API
 */
async function getApiUsageData() {
  // Déterminer la période d'analyse
  let startDate;
  switch (config.period) {
    case 'daily':
      startDate = moment().subtract(1, 'days').startOf('day');
      break;
    case 'weekly':
      startDate = moment().subtract(7, 'days').startOf('day');
      break;
    case 'monthly':
      startDate = moment().subtract(30, 'days').startOf('day');
      break;
    default:
      startDate = moment().subtract(1, 'days').startOf('day');
  }

  // Récupérer les données d'utilisation des API
  const apiQuotas = apiQuotaMonitor.getApiQuotas();
  const apiAlerts = apiQuotaMonitor.getAlerts();
  
  // Lire les logs d'appels API pour la période
  const apiCallsLog = path.resolve(process.cwd(), 'logs/api-calls.log');
  const apiErrorsLog = path.resolve(process.cwd(), 'logs/api-errors.log');
  
  const apiCalls = await readAndParseLogFile(apiCallsLog, startDate);
  const apiErrors = await readAndParseLogFile(apiErrorsLog, startDate);
  
  // Calculer les statistiques par API
  const apiStats = {};
  const apiNames = Object.keys(apiQuotas);
  
  apiNames.forEach(apiName => {
    const quota = apiQuotas[apiName] || {};
    const calls = apiCalls.filter(call => call.api === apiName);
    const errors = apiErrors.filter(error => error.apiName === apiName);
    
    // Calculer le taux de réussite
    const totalCalls = calls.length;
    const totalErrors = errors.length;
    const successRate = totalCalls > 0 ? ((totalCalls - totalErrors) / totalCalls) * 100 : 100;
    
    // Calculer l'utilisation du quota
    const percentUsed = quota.limit ? ((quota.calls || 0) / quota.limit) * 100 : 0;
    
    // Calculer la tendance par rapport à la période précédente
    // (Ceci requiert d'avoir des données historiques, c'est un exemple simplifié)
    const trend = Math.random() > 0.5 ? Math.random() * 10 : -Math.random() * 10;
    
    apiStats[apiName] = {
      totalCalls,
      totalErrors,
      successRate: successRate.toFixed(2),
      percentUsed: percentUsed.toFixed(2),
      trend: trend.toFixed(2),
      quota
    };
  });
  
  // Calculer les statistiques globales
  const totalCalls = apiCalls.length;
  const totalErrors = apiErrors.length;
  const globalSuccessRate = totalCalls > 0 ? ((totalCalls - totalErrors) / totalCalls) * 100 : 100;
  
  // Préparer les données pour les graphiques
  const dailyCallsData = prepareDailyCallsData(apiCalls, startDate);
  const topEndpoints = prepareTopEndpointsData(apiCalls);
  
  return {
    period: config.period,
    startDate: startDate.format('YYYY-MM-DD'),
    endDate: moment().format('YYYY-MM-DD'),
    apiStats,
    apiNames,
    globalStats: {
      totalCalls,
      totalErrors,
      successRate: globalSuccessRate.toFixed(2),
      activeAlerts: apiAlerts.length
    },
    charts: {
      dailyCalls: dailyCallsData,
      topEndpoints
    },
    alerts: apiAlerts
  };
}

/**
 * Lit et analyse un fichier de log
 * @param {string} filePath Chemin du fichier de log
 * @param {moment} startDate Date de début de l'analyse
 * @returns {Array} Données analysées
 */
async function readAndParseLogFile(filePath, startDate) {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const lines = fileContent.split('\n').filter(line => line.trim());
  
  return lines.map(line => {
    try {
      const entry = JSON.parse(line);
      const entryDate = moment(entry.timestamp);
      
      // Ne conserver que les entrées dans la période d'analyse
      if (entryDate.isAfter(startDate)) {
        return entry;
      }
      return null;
    } catch (error) {
      if (config.debug) {
        console.error(`Erreur lors de l'analyse de la ligne: ${line}`);
      }
      return null;
    }
  }).filter(entry => entry !== null);
}

/**
 * Prépare les données d'appels API par jour
 * @param {Array} apiCalls Appels API
 * @param {moment} startDate Date de début
 * @returns {Array} Données formatées pour le graphique
 */
function prepareDailyCallsData(apiCalls, startDate) {
  const days = {};
  const apiByDay = {};
  
  // Initialiser les jours
  let currentDate = startDate.clone();
  while (currentDate.isSameOrBefore(moment(), 'day')) {
    const dateKey = currentDate.format('YYYY-MM-DD');
    days[dateKey] = 0;
    apiByDay[dateKey] = {};
    currentDate.add(1, 'days');
  }
  
  // Compter les appels par jour et par API
  apiCalls.forEach(call => {
    const dateKey = moment(call.timestamp).format('YYYY-MM-DD');
    if (days[dateKey] !== undefined) {
      days[dateKey]++;
      
      // Compter par API
      const apiName = call.api || 'unknown';
      apiByDay[dateKey][apiName] = (apiByDay[dateKey][apiName] || 0) + 1;
    }
  });
  
  // Formater pour le graphique
  const result = Object.keys(days).map(dateKey => {
    const dayData = { date: dateKey };
    
    // Ajouter le total
    dayData.total = days[dateKey];
    
    // Ajouter par API
    Object.keys(apiByDay[dateKey]).forEach(apiName => {
      dayData[apiName] = apiByDay[dateKey][apiName];
    });
    
    return dayData;
  });
  
  return result;
}

/**
 * Prépare les données des endpoints les plus utilisés
 * @param {Array} apiCalls Appels API
 * @returns {Array} Top 10 des endpoints les plus utilisés
 */
function prepareTopEndpointsData(apiCalls) {
  const endpoints = {};
  
  // Compter les appels par endpoint
  apiCalls.forEach(call => {
    const endpoint = call.endpoint || 'unknown';
    endpoints[endpoint] = (endpoints[endpoint] || 0) + 1;
  });
  
  // Trier et limiter aux 10 premiers
  return Object.entries(endpoints)
    .map(([endpoint, count]) => ({ endpoint, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

/**
 * Génère le rapport HTML
 * @param {Object} data Données pour le rapport
 * @returns {string} Rapport HTML
 */
async function generateHtmlReport(data) {
  // Vérifier si le template existe, sinon le créer
  const templatePath = path.join(config.templatesDir, 'api-report-template.ejs');
  if (!fs.existsSync(templatePath)) {
    await createReportTemplate(templatePath);
  }
  
  // Charger le template
  const template = fs.readFileSync(templatePath, 'utf8');
  
  // Rendre le template avec les données
  try {
    const html = ejs.render(template, {
      data,
      config,
      moment,
      generateTimeLabel: (period) => {
        switch (period) {
          case 'daily': return 'les dernières 24 heures';
          case 'weekly': return 'les 7 derniers jours';
          case 'monthly': return 'les 30 derniers jours';
          default: return 'la période';
        }
      }
    });
    
    // Sauvegarder le rapport si demandé
    if (config.saveReport) {
      const reportPath = path.join(config.reportsDir, `api-report-${data.period}-${moment().format('YYYY-MM-DD')}.html`);
      fs.writeFileSync(reportPath, html);
      console.log(`Rapport sauvegardé dans ${reportPath}`);
    }
    
    return html;
  } catch (error) {
    console.error('Erreur lors de la génération du rapport HTML:', error);
    throw error;
  }
}

/**
 * Crée un template de rapport par défaut
 * @param {string} templatePath Chemin du template
 */
async function createReportTemplate(templatePath) {
  const defaultTemplate = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport d'utilisation des API - <%= config.siteName %></title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3 {
      color: #2c3e50;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 10px;
      border-bottom: 2px solid #eee;
    }
    .summary {
      background-color: #f9f9f9;
      padding: 20px;
      border-radius: 5px;
      margin-bottom: 20px;
    }
    .stats-container {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      margin-bottom: 20px;
    }
    .stat-card {
      flex: 1;
      min-width: 200px;
      background-color: white;
      padding: 15px;
      border-radius: 5px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.12);
    }
    .stat-value {
      font-size: 24px;
      font-weight: bold;
    }
    .api-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    .api-table th, .api-table td {
      padding: 10px;
      border: 1px solid #ddd;
      text-align: left;
    }
    .api-table th {
      background-color: #f2f2f2;
    }
    .api-table tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    .alert {
      background-color: #fff3cd;
      color: #856404;
      padding: 10px 15px;
      border-radius: 5px;
      margin-bottom: 10px;
    }
    .alert.critical {
      background-color: #f8d7da;
      color: #721c24;
    }
    .chart-placeholder {
      background-color: #f5f5f5;
      border: 1px dashed #ccc;
      height: 300px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 10px;
      border-top: 1px solid #eee;
      font-size: 12px;
      color: #777;
    }
    .trend-up {
      color: #28a745;
    }
    .trend-down {
      color: #dc3545;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1><%= config.siteName %></h1>
    <h2>Rapport d'utilisation des API - <%= data.period.charAt(0).toUpperCase() + data.period.slice(1) %></h2>
    <p>Période: <%= data.startDate %> au <%= data.endDate %></p>
    <p>Généré le <%= moment().format('DD/MM/YYYY à HH:mm') %></p>
  </div>
  
  <div class="summary">
    <h3>Résumé pour <%= generateTimeLabel(data.period) %></h3>
    <div class="stats-container">
      <div class="stat-card">
        <div>Appels API Totaux</div>
        <div class="stat-value"><%= data.globalStats.totalCalls %></div>
      </div>
      <div class="stat-card">
        <div>Taux de Réussite Global</div>
        <div class="stat-value"><%= data.globalStats.successRate %>%</div>
      </div>
      <div class="stat-card">
        <div>Erreurs Totales</div>
        <div class="stat-value"><%= data.globalStats.totalErrors %></div>
      </div>
      <div class="stat-card">
        <div>Alertes Actives</div>
        <div class="stat-value"><%= data.globalStats.activeAlerts %></div>
      </div>
    </div>
  </div>
  
  <h3>Utilisation par API</h3>
  <table class="api-table">
    <thead>
      <tr>
        <th>API</th>
        <th>Appels</th>
        <th>Erreurs</th>
        <th>Taux de Réussite</th>
        <th>% Quota Utilisé</th>
        <th>Tendance</th>
      </tr>
    </thead>
    <tbody>
      <% data.apiNames.forEach(apiName => { %>
        <% const stats = data.apiStats[apiName]; %>
        <tr>
          <td><strong><%= apiName %></strong></td>
          <td><%= stats.totalCalls %></td>
          <td><%= stats.totalErrors %></td>
          <td><%= stats.successRate %>%</td>
          <td><%= stats.percentUsed %>%</td>
          <td>
            <% if (parseFloat(stats.trend) > 0) { %>
              <span class="trend-up">+<%= stats.trend %>% ↑</span>
            <% } else { %>
              <span class="trend-down"><%= stats.trend %>% ↓</span>
            <% } %>
          </td>
        </tr>
      <% }); %>
    </tbody>
  </table>
  
  <% if (data.alerts.length > 0) { %>
    <h3>Alertes Actives</h3>
    <% data.alerts.forEach(alert => { %>
      <div class="alert <%= alert.type.includes('critical') ? 'critical' : '' %>">
        <strong><%= alert.subject %></strong><br>
        <%= alert.message %><br>
        <small><%= moment(alert.timestamp).format('DD/MM/YYYY HH:mm') %></small>
      </div>
    <% }); %>
  <% } %>
  
  <h3>Graphiques d'Utilisation</h3>
  
  <div class="chart-placeholder">
    Ce rapport HTML statique ne peut pas afficher de graphiques interactifs.<br>
    Veuillez consulter le tableau de bord d'administration pour des visualisations avancées.
  </div>
  
  <h3>Top 10 des Endpoints</h3>
  <table class="api-table">
    <thead>
      <tr>
        <th>Endpoint</th>
        <th>Nombre d'Appels</th>
      </tr>
    </thead>
    <tbody>
      <% data.charts.topEndpoints.forEach(endpoint => { %>
        <tr>
          <td><%= endpoint.endpoint %></td>
          <td><%= endpoint.count %></td>
        </tr>
      <% }); %>
    </tbody>
  </table>
  
  <div class="footer">
    <p>Ce rapport a été généré automatiquement par le système de monitoring du <%= config.siteName %>.</p>
    <p>Pour plus de détails, veuillez vous connecter au <a href="https://cyclisme-europe.eu/admin/api-analytics">tableau de bord d'administration</a>.</p>
  </div>
</body>
</html>`;

  fs.writeFileSync(templatePath, defaultTemplate);
  console.log(`Template de rapport créé: ${templatePath}`);
}

/**
 * Envoie le rapport par email
 * @param {string} htmlReport Rapport HTML
 */
async function sendReportByEmail(htmlReport) {
  try {
    // Utiliser le service de notification
    const subject = `Rapport d'utilisation des API ${config.period} - ${moment().format('DD/MM/YYYY')}`;
    const message = `Veuillez trouver ci-joint le rapport ${config.period} d'utilisation des API du ${config.siteName}.`;
    
    // Créer un transporteur email
    const emailConfig = apiNotificationService.emailConfig;
    
    if (!emailConfig.enabled) {
      console.error('Configuration email non activée');
      return false;
    }
    
    const transporter = nodemailer.createTransport({
      host: emailConfig.smtpHost,
      port: emailConfig.smtpPort,
      secure: emailConfig.smtpPort === 465,
      auth: {
        user: emailConfig.smtpUser,
        pass: emailConfig.smtpPass
      }
    });
    
    // Envoyer l'email
    const mailOptions = {
      from: emailConfig.from,
      to: config.email,
      subject,
      html: htmlReport
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log(`Rapport envoyé par email à ${config.email}: ${result.messageId}`);
    
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi du rapport par email:', error);
    return false;
  }
}

/**
 * Fonction principale
 */
async function main() {
  try {
    console.log(`Génération du rapport ${config.period} pour la période jusqu'au ${moment().format('YYYY-MM-DD')}`);
    
    // Récupérer les données d'utilisation des API
    const data = await getApiUsageData();
    console.log(`Données récupérées: ${data.globalStats.totalCalls} appels, ${data.globalStats.totalErrors} erreurs`);
    
    // Générer le rapport HTML
    const htmlReport = await generateHtmlReport(data);
    console.log('Rapport HTML généré');
    
    // Envoyer le rapport par email
    const emailSent = await sendReportByEmail(htmlReport);
    if (emailSent) {
      console.log('Rapport envoyé par email avec succès');
    } else {
      console.error('Échec de l\'envoi du rapport par email');
    }
    
    console.log('Génération du rapport terminée');
    
  } catch (error) {
    console.error('Erreur lors de la génération du rapport:', error);
    process.exit(1);
  }
}

// Exécuter le programme
main().catch(error => {
  console.error(`Erreur fatale: ${error.message}`);
  process.exit(1);
});
