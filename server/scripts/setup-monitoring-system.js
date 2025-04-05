#!/usr/bin/env node

/**
 * Script de configuration initiale du système de monitoring des API
 * Ce script crée les répertoires nécessaires et initialise les fichiers de configuration par défaut
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const colors = require('colors/safe');
const prompts = require('prompts');
const dotenv = require('dotenv');

// Charger les variables d'environnement
dotenv.config();

// Constantes
const PROJECT_ROOT = process.cwd();
const LOGS_DIR = path.join(PROJECT_ROOT, 'logs');
const CONFIG_DIR = path.join(PROJECT_ROOT, 'config');
const REPORTS_DIR = path.join(PROJECT_ROOT, 'reports');
const TEMPLATES_DIR = path.join(PROJECT_ROOT, 'server/templates');

// Définition des répertoires à créer
const directories = [
  LOGS_DIR,
  CONFIG_DIR,
  REPORTS_DIR,
  TEMPLATES_DIR,
  path.join(LOGS_DIR, 'api-calls'),
  path.join(LOGS_DIR, 'alerts'),
  path.join(REPORTS_DIR, 'daily'),
  path.join(REPORTS_DIR, 'weekly'),
  path.join(REPORTS_DIR, 'monthly')
];

// Définition des fichiers de configuration par défaut
const defaultConfigs = {
  'api-configs.json': [
    {
      name: 'Strava',
      description: 'API pour récupérer les données d\'activités sportives',
      key: '',
      dailyLimit: 1000,
      isActive: true,
      testEndpoint: 'https://www.strava.com/api/v3/athlete',
      refreshTokenUrl: 'https://www.strava.com/oauth/token',
      monitoringEnabled: true
    },
    {
      name: 'OpenWeatherMap',
      description: 'API météorologique pour les conditions des cols',
      key: '',
      dailyLimit: 1000,
      isActive: true,
      testEndpoint: 'https://api.openweathermap.org/data/2.5/weather',
      refreshTokenUrl: '',
      monitoringEnabled: true
    },
    {
      name: 'MapBox',
      description: 'API de cartographie',
      key: '',
      dailyLimit: 50000,
      isActive: true,
      testEndpoint: 'https://api.mapbox.com/geocoding/v5/mapbox.places/Paris.json',
      refreshTokenUrl: '',
      monitoringEnabled: true
    }
  ],
  'notification-settings.json': {
    emailEnabled: true,
    smsEnabled: false,
    slackEnabled: false,
    emailRecipients: process.env.EMAIL_ALERTS_TO || 'admin@cyclisme-europe.eu',
    smsRecipients: '',
    slackWebhook: ''
  },
  'schedule-settings.json': {
    dailyReport: '0 8 * * *',
    weeklyReport: '0 9 * * 1',
    monthlyReport: '0 10 1 * *',
    monitoringInterval: '0 */6 * * *'
  },
  'threshold-settings.json': {
    quotaWarning: 70,
    quotaCritical: 90,
    responseTimeWarning: 1000,
    responseTimeCritical: 3000
  }
};

// Définition des fichiers de log par défaut
const defaultLogs = {
  'api-calls.log': '',
  'api-errors.log': '',
  'monitoring.log': '',
  'alerts.log': ''
};

// Définition des modèles de templates
const defaultTemplates = {
  'api-report-template.ejs': `<!DOCTYPE html>
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
</html>`
};

// Dépendances requises
const requiredDependencies = [
  'nodemailer',
  'twilio',
  'axios',
  'moment',
  'ejs',
  'cli-table3',
  'colors',
  'node-cron',
  'prompts',
  'dotenv',
  'express-rate-limit',
  'bcrypt',
  'jsonwebtoken',
  'commander'
];

/**
 * Affiche un message de statut
 * @param {string} message Message à afficher
 * @param {string} type Type de message (info, success, error, warning)
 */
function displayStatus(message, type = 'info') {
  const timestamp = new Date().toISOString();
  let coloredMessage;
  
  switch (type) {
    case 'success':
      coloredMessage = colors.green(`[${timestamp}] ✓ ${message}`);
      break;
    case 'error':
      coloredMessage = colors.red(`[${timestamp}] ✗ ${message}`);
      break;
    case 'warning':
      coloredMessage = colors.yellow(`[${timestamp}] ⚠ ${message}`);
      break;
    default:
      coloredMessage = colors.cyan(`[${timestamp}] ℹ ${message}`);
  }
  
  console.log(coloredMessage);
}

/**
 * Crée les répertoires nécessaires
 */
function createDirectories() {
  displayStatus('Création des répertoires nécessaires...');
  
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      displayStatus(`Répertoire créé: ${dir}`, 'success');
    } else {
      displayStatus(`Répertoire existant: ${dir}`, 'info');
    }
  });
}

/**
 * Crée les fichiers de configuration par défaut
 */
function createDefaultConfigs() {
  displayStatus('Création des fichiers de configuration par défaut...');
  
  Object.entries(defaultConfigs).forEach(([fileName, content]) => {
    const filePath = path.join(CONFIG_DIR, fileName);
    
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
      displayStatus(`Fichier de configuration créé: ${fileName}`, 'success');
    } else {
      displayStatus(`Fichier de configuration existant: ${fileName}`, 'info');
    }
  });
}

/**
 * Crée les fichiers de log par défaut
 */
function createDefaultLogs() {
  displayStatus('Création des fichiers de log par défaut...');
  
  Object.entries(defaultLogs).forEach(([fileName, content]) => {
    const filePath = path.join(LOGS_DIR, fileName);
    
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, content);
      displayStatus(`Fichier de log créé: ${fileName}`, 'success');
    } else {
      displayStatus(`Fichier de log existant: ${fileName}`, 'info');
    }
  });
}

/**
 * Crée les templates par défaut
 */
function createDefaultTemplates() {
  displayStatus('Création des templates par défaut...');
  
  Object.entries(defaultTemplates).forEach(([fileName, content]) => {
    const filePath = path.join(TEMPLATES_DIR, fileName);
    
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, content);
      displayStatus(`Template créé: ${fileName}`, 'success');
    } else {
      displayStatus(`Template existant: ${fileName}`, 'info');
    }
  });
}

/**
 * Vérifie les dépendances npm requises
 */
async function checkDependencies() {
  displayStatus('Vérification des dépendances npm...');
  
  const packageJsonPath = path.join(PROJECT_ROOT, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    displayStatus('Le fichier package.json n\'existe pas. Création impossible.', 'error');
    return;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = { ...(packageJson.dependencies || {}), ...(packageJson.devDependencies || {}) };
  
  const missingDeps = requiredDependencies.filter(dep => !dependencies[dep]);
  
  if (missingDeps.length > 0) {
    displayStatus(`Dépendances manquantes: ${missingDeps.join(', ')}`, 'warning');
    
    const response = await prompts({
      type: 'confirm',
      name: 'install',
      message: 'Voulez-vous installer les dépendances manquantes?',
      initial: true
    });
    
    if (response.install) {
      displayStatus('Installation des dépendances manquantes...');
      
      try {
        execSync(`npm install --save ${missingDeps.join(' ')}`, { stdio: 'inherit' });
        displayStatus('Dépendances installées avec succès', 'success');
      } catch (error) {
        displayStatus(`Erreur lors de l'installation des dépendances: ${error.message}`, 'error');
      }
    }
  } else {
    displayStatus('Toutes les dépendances requises sont installées', 'success');
  }
}

/**
 * Vérifie l'existence d'un fichier .env et aide à le configurer
 */
async function setupEnvironmentVariables() {
  displayStatus('Vérification des variables d\'environnement...');
  
  const envFilePath = path.join(PROJECT_ROOT, '.env');
  let existingEnv = {};
  
  if (fs.existsSync(envFilePath)) {
    displayStatus('Fichier .env trouvé, chargement des variables existantes...', 'info');
    
    // Lire le fichier .env existant
    const envContent = fs.readFileSync(envFilePath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        existingEnv[match[1].trim()] = match[2].trim();
      }
    });
  } else {
    displayStatus('Fichier .env non trouvé, création d\'un nouveau fichier...', 'warning');
  }
  
  // Variables d'environnement requises pour le monitoring
  const requiredEnvVars = [
    { name: 'EMAIL_ALERTS_TO', default: 'admin@cyclisme-europe.eu', description: 'Email pour les alertes' },
    { name: 'SMTP_HOST', default: 'smtp.example.com', description: 'Hôte SMTP pour les emails' },
    { name: 'SMTP_PORT', default: '587', description: 'Port SMTP' },
    { name: 'SMTP_USER', default: 'notifications@cyclisme-europe.eu', description: 'Utilisateur SMTP' },
    { name: 'SMTP_PASS', default: '', description: 'Mot de passe SMTP' },
    { name: 'TWILIO_ACCOUNT_SID', default: '', description: 'Twilio Account SID pour les SMS' },
    { name: 'TWILIO_AUTH_TOKEN', default: '', description: 'Twilio Auth Token' },
    { name: 'TWILIO_PHONE_NUMBER', default: '', description: 'Numéro de téléphone Twilio' },
    { name: 'SLACK_WEBHOOK_URL', default: '', description: 'URL du webhook Slack' },
    { name: 'REPORT_SCHEDULE_DAILY', default: '0 8 * * *', description: 'Planification du rapport quotidien (cron)' },
    { name: 'REPORT_SCHEDULE_WEEKLY', default: '0 9 * * 1', description: 'Planification du rapport hebdomadaire (cron)' },
    { name: 'REPORT_SCHEDULE_MONTHLY', default: '0 10 1 * *', description: 'Planification du rapport mensuel (cron)' },
    { name: 'MONITORING_SCHEDULE', default: '0 */6 * * *', description: 'Planification du monitoring (cron)' }
  ];
  
  // Demander à l'utilisateur de configurer les variables manquantes ou vides
  const questions = [];
  requiredEnvVars.forEach(({ name, default: defaultValue, description }) => {
    const existing = existingEnv[name];
    
    if (existing === undefined || existing === '') {
      questions.push({
        type: 'text',
        name,
        message: `${description} (${name}):`,
        initial: defaultValue
      });
    }
  });
  
  let newEnvVars = {};
  
  if (questions.length > 0) {
    displayStatus(`${questions.length} variables d'environnement doivent être configurées`, 'warning');
    newEnvVars = await prompts(questions);
  } else {
    displayStatus('Toutes les variables d\'environnement requises sont configurées', 'success');
  }
  
  // Mettre à jour le fichier .env
  if (Object.keys(newEnvVars).length > 0) {
    // Fusionner les variables existantes et nouvelles
    const mergedEnv = { ...existingEnv, ...newEnvVars };
    
    // Préparer le contenu du fichier
    const envContent = Object.entries(mergedEnv)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    // Écrire le fichier .env
    fs.writeFileSync(envFilePath, envContent);
    displayStatus('Fichier .env mis à jour avec succès', 'success');
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log(colors.bold.cyan('\n=== CONFIGURATION DU SYSTÈME DE MONITORING DES API ===\n'));
  
  try {
    // Étape 1: Création des répertoires
    createDirectories();
    
    // Étape 2: Création des fichiers de configuration
    createDefaultConfigs();
    
    // Étape 3: Création des fichiers de log
    createDefaultLogs();
    
    // Étape 4: Création des templates
    createDefaultTemplates();
    
    // Étape 5: Vérification des dépendances
    await checkDependencies();
    
    // Étape 6: Configuration des variables d'environnement
    await setupEnvironmentVariables();
    
    console.log(colors.bold.green('\n=== CONFIGURATION TERMINÉE AVEC SUCCÈS ===\n'));
    console.log(colors.cyan('Pour démarrer le système de monitoring :'));
    console.log(colors.white('1. Exécutez `node server/scripts/run-monitoring-test.js` pour tester le système'));
    console.log(colors.white('2. Exécutez `node server/scripts/schedule-api-reports.js` pour démarrer la génération automatique de rapports'));
    console.log(colors.white('3. Accédez au tableau de bord d\'administration pour visualiser les données en temps réel'));
    
  } catch (error) {
    console.error(colors.bold.red('\n=== ERREUR LORS DE LA CONFIGURATION ===\n'));
    console.error(colors.red(error.message));
    console.error(colors.red(error.stack));
    process.exit(1);
  }
}

// Exécuter le programme
if (require.main === module) {
  main().catch(error => {
    console.error(colors.red(`Erreur fatale: ${error.message}`));
    process.exit(1);
  });
}
