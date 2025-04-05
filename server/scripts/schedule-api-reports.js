#!/usr/bin/env node

/**
 * Script de planification des rapports d'API
 * Planifie l'exécution automatique des rapports d'API à intervalles réguliers
 */
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');
const cron = require('node-cron');
const dotenv = require('dotenv');
const moment = require('moment');
const colors = require('colors/safe');

// Charger les variables d'environnement
dotenv.config();

// Configuration
const config = {
  reportScriptPath: path.resolve(__dirname, 'generate-api-report.js'),
  monitoringScriptPath: path.resolve(__dirname, 'run-monitoring-test.js'),
  logPath: path.resolve(process.cwd(), 'logs/scheduler.log'),
  schedules: {
    daily: process.env.REPORT_SCHEDULE_DAILY || '0 8 * * *',  // Tous les jours à 8h
    weekly: process.env.REPORT_SCHEDULE_WEEKLY || '0 9 * * 1', // Tous les lundis à 9h
    monthly: process.env.REPORT_SCHEDULE_MONTHLY || '0 10 1 * *', // Le 1er du mois à 10h
    monitoring: process.env.MONITORING_SCHEDULE || '0 */6 * * *' // Toutes les 6 heures
  },
  emails: {
    daily: process.env.DAILY_REPORT_EMAIL || process.env.EMAIL_ALERTS_TO,
    weekly: process.env.WEEKLY_REPORT_EMAIL || process.env.EMAIL_ALERTS_TO,
    monthly: process.env.MONTHLY_REPORT_EMAIL || process.env.EMAIL_ALERTS_TO
  },
  debug: process.env.DEBUG === 'true' || false
};

// Vérifier si le répertoire des logs existe
const logDir = path.dirname(config.logPath);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

/**
 * Écrit un message dans le fichier de log et dans la console
 * @param {string} message Message à logger
 * @param {string} level Niveau de log (info, warning, error)
 */
function log(message, level = 'info') {
  const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  // Afficher dans la console avec couleurs
  switch (level) {
    case 'warning':
      console.log(colors.yellow(logMessage));
      break;
    case 'error':
      console.log(colors.red(logMessage));
      break;
    default:
      console.log(colors.green(logMessage));
  }
  
  // Écrire dans le fichier de log
  fs.appendFileSync(config.logPath, logMessage + '\n');
}

/**
 * Exécute un script Node.js
 * @param {string} scriptPath Chemin du script
 * @param {Array} args Arguments du script
 * @returns {Promise} Promesse résolue avec la sortie du script
 */
function executeScript(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    const command = `node "${scriptPath}" ${args.join(' ')}`;
    log(`Exécution de: ${command}`);
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        log(`Erreur d'exécution pour ${scriptPath}: ${error.message}`, 'error');
        return reject(error);
      }
      
      if (stderr) {
        log(`Avertissements pour ${scriptPath}: ${stderr}`, 'warning');
      }
      
      log(`Script ${scriptPath} exécuté avec succès`);
      resolve(stdout);
    });
  });
}

/**
 * Génère un rapport API
 * @param {string} period Type de rapport (daily, weekly, monthly)
 * @returns {Promise} Promesse résolue avec la sortie du script
 */
async function generateApiReport(period) {
  try {
    const email = config.emails[period];
    const args = [`--period=${period}`];
    
    if (email) {
      args.push(`--email=${email}`);
    }
    
    if (config.debug) {
      args.push('--debug');
    }
    
    // Ajouter l'option pour sauvegarder le rapport
    args.push('--save');
    
    return await executeScript(config.reportScriptPath, args);
  } catch (error) {
    log(`Erreur lors de la génération du rapport ${period}: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Exécute le monitoring complet du système
 * @returns {Promise} Promesse résolue avec la sortie du script
 */
async function runMonitoring() {
  try {
    return await executeScript(config.monitoringScriptPath);
  } catch (error) {
    log(`Erreur lors de l'exécution du monitoring: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Initialise les tâches planifiées
 */
function initializeSchedules() {
  // Planifier le rapport quotidien
  cron.schedule(config.schedules.daily, async () => {
    log('Exécution du rapport API quotidien');
    try {
      await generateApiReport('daily');
      log('Rapport API quotidien généré avec succès');
    } catch (error) {
      log('Échec de génération du rapport API quotidien', 'error');
    }
  });
  
  // Planifier le rapport hebdomadaire
  cron.schedule(config.schedules.weekly, async () => {
    log('Exécution du rapport API hebdomadaire');
    try {
      await generateApiReport('weekly');
      log('Rapport API hebdomadaire généré avec succès');
    } catch (error) {
      log('Échec de génération du rapport API hebdomadaire', 'error');
    }
  });
  
  // Planifier le rapport mensuel
  cron.schedule(config.schedules.monthly, async () => {
    log('Exécution du rapport API mensuel');
    try {
      await generateApiReport('monthly');
      log('Rapport API mensuel généré avec succès');
    } catch (error) {
      log('Échec de génération du rapport API mensuel', 'error');
    }
  });
  
  // Planifier l'exécution du monitoring
  cron.schedule(config.schedules.monitoring, async () => {
    log('Exécution du monitoring du système');
    try {
      await runMonitoring();
      log('Monitoring du système exécuté avec succès');
    } catch (error) {
      log('Échec de l\'exécution du monitoring du système', 'error');
    }
  });
  
  log('===== PLANIFICATEUR DE RAPPORTS API DÉMARRÉ =====');
  log(`Rapport quotidien: ${config.schedules.daily}`);
  log(`Rapport hebdomadaire: ${config.schedules.weekly}`);
  log(`Rapport mensuel: ${config.schedules.monthly}`);
  log(`Monitoring du système: ${config.schedules.monitoring}`);
}

/**
 * Fonction principale
 */
async function main() {
  try {
    log('Démarrage du planificateur de rapports API');
    
    // Vérifier l'existence des scripts
    if (!fs.existsSync(config.reportScriptPath)) {
      throw new Error(`Script de génération de rapport non trouvé: ${config.reportScriptPath}`);
    }
    
    if (!fs.existsSync(config.monitoringScriptPath)) {
      throw new Error(`Script de monitoring non trouvé: ${config.monitoringScriptPath}`);
    }
    
    // Initialiser les tâches planifiées
    initializeSchedules();
    
    // Exécuter un rapport immédiatement au démarrage
    if (process.argv.includes('--run-now')) {
      log('Exécution immédiate des rapports et du monitoring');
      await generateApiReport('daily');
      await runMonitoring();
    }
    
    // Garder le script en vie
    log('Planificateur démarré et en attente. Utilisez Ctrl+C pour arrêter.');
    
  } catch (error) {
    log(`Erreur lors du démarrage du planificateur: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Exécuter le programme
if (require.main === module) {
  main().catch(error => {
    log(`Erreur fatale: ${error.message}`, 'error');
    process.exit(1);
  });
}
