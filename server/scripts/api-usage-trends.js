#!/usr/bin/env node

/**
 * Script d'analyse des tendances d'utilisation des API
 * Analyse les logs d'appels API pour identifier les tendances et anomalies
 */
const fs = require('fs');
const path = require('path');
const { program } = require('commander');
const moment = require('moment');
const Table = require('cli-table3');
const colors = require('colors/safe');

// Configuration du programme
program
  .version('1.0.0')
  .description('Analyse des tendances d\'utilisation des API')
  .option('-d, --days <days>', 'Nombre de jours à analyser', '30')
  .option('-o, --output <format>', 'Format de sortie (console, json, html)', 'console')
  .option('-f, --file <file>', 'Fichier de sortie (pour json et html)')
  .option('-a, --api <api>', 'Filtrer par nom d\'API')
  .option('--alerts', 'Inclure les alertes dans l\'analyse', false)
  .option('--errors', 'Analyser seulement les erreurs', false)
  .parse(process.argv);

const options = program.opts();

// Constantes
const LOGS_DIR = path.join(process.cwd(), 'logs');
const API_CALLS_LOG = path.join(LOGS_DIR, 'api-calls.log');
const API_ERRORS_LOG = path.join(LOGS_DIR, 'api-errors.log');
const ALERTS_LOG = path.join(LOGS_DIR, 'alerts.log');
const OUTPUT_DIR = path.join(process.cwd(), 'reports');

// S'assurer que le répertoire de sortie existe
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Lit et analyse un fichier de log
 * @param {string} logPath Chemin du fichier de log
 * @param {Date} startDate Date de début de l'analyse
 * @returns {Array} Entrées de log analysées
 */
function parseLogFile(logPath, startDate) {
  if (!fs.existsSync(logPath)) {
    return [];
  }

  try {
    const content = fs.readFileSync(logPath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    
    return lines
      .map(line => {
        try {
          const entry = JSON.parse(line);
          const timestamp = entry.timestamp ? new Date(entry.timestamp) : null;
          
          // Filtrer par date
          if (timestamp && timestamp >= startDate) {
            return entry;
          }
          return null;
        } catch (error) {
          // Ignorer les lignes non JSON
          return null;
        }
      })
      .filter(entry => entry !== null);
  } catch (error) {
    console.error(`Erreur lors de la lecture du fichier ${logPath}:`, error);
    return [];
  }
}

/**
 * Analyse les tendances d'utilisation des API
 * @param {Array} apiCalls Liste des appels API
 * @param {Array} apiErrors Liste des erreurs API
 * @param {Array} alerts Liste des alertes
 * @returns {Object} Résultats de l'analyse
 */
function analyzeTrends(apiCalls, apiErrors, alerts) {
  // Initialiser les résultats
  const results = {
    totalCalls: apiCalls.length,
    totalErrors: apiErrors.length,
    totalAlerts: alerts.length,
    successRate: apiCalls.length > 0 ? ((apiCalls.length - apiErrors.length) / apiCalls.length * 100).toFixed(2) : 0,
    apiUsage: {},
    dailyTrends: {},
    hourlyDistribution: Array(24).fill(0),
    topEndpoints: {},
    errorTypes: {},
    responseTimeTrends: {
      average: 0,
      max: 0,
      min: Number.MAX_SAFE_INTEGER,
      trend: []
    },
    anomalies: []
  };

  // Analyser les appels API
  apiCalls.forEach(call => {
    const timestamp = new Date(call.timestamp);
    const day = moment(timestamp).format('YYYY-MM-DD');
    const hour = timestamp.getHours();
    const api = call.api || 'unknown';
    const endpoint = call.endpoint || 'unknown';
    const responseTime = call.responseTime || 0;
    
    // Filtrer par API si spécifié
    if (options.api && api !== options.api) {
      return;
    }

    // Compter par API
    if (!results.apiUsage[api]) {
      results.apiUsage[api] = {
        calls: 0,
        errors: 0,
        avgResponseTime: 0,
        totalResponseTime: 0
      };
    }
    results.apiUsage[api].calls++;
    results.apiUsage[api].totalResponseTime += responseTime;
    results.apiUsage[api].avgResponseTime = results.apiUsage[api].totalResponseTime / results.apiUsage[api].calls;

    // Tendances quotidiennes
    if (!results.dailyTrends[day]) {
      results.dailyTrends[day] = {
        calls: 0,
        errors: 0,
        apis: {}
      };
    }
    results.dailyTrends[day].calls++;
    if (!results.dailyTrends[day].apis[api]) {
      results.dailyTrends[day].apis[api] = 0;
    }
    results.dailyTrends[day].apis[api]++;

    // Distribution horaire
    results.hourlyDistribution[hour]++;

    // Top endpoints
    if (!results.topEndpoints[endpoint]) {
      results.topEndpoints[endpoint] = 0;
    }
    results.topEndpoints[endpoint]++;

    // Temps de réponse
    results.responseTimeTrends.average = 
      (results.responseTimeTrends.average * (apiCalls.indexOf(call)) + responseTime) / 
      (apiCalls.indexOf(call) + 1);
    
    results.responseTimeTrends.max = Math.max(results.responseTimeTrends.max, responseTime);
    if (responseTime > 0) {
      results.responseTimeTrends.min = Math.min(results.responseTimeTrends.min, responseTime);
    }

    // Ajouter à la tendance des temps de réponse
    results.responseTimeTrends.trend.push({
      timestamp: call.timestamp,
      api,
      responseTime
    });
  });

  // Analyser les erreurs API
  apiErrors.forEach(error => {
    const timestamp = new Date(error.timestamp);
    const day = moment(timestamp).format('YYYY-MM-DD');
    const api = error.api || error.apiName || 'unknown';
    const errorType = error.error || error.message || 'unknown';
    
    // Filtrer par API si spécifié
    if (options.api && api !== options.api) {
      return;
    }

    // Compter par API
    if (results.apiUsage[api]) {
      results.apiUsage[api].errors++;
    }

    // Tendances quotidiennes
    if (results.dailyTrends[day]) {
      results.dailyTrends[day].errors++;
    }

    // Types d'erreurs
    if (!results.errorTypes[errorType]) {
      results.errorTypes[errorType] = 0;
    }
    results.errorTypes[errorType]++;
  });

  // Analyser les anomalies
  const dailyAvgCalls = Object.values(results.dailyTrends).reduce((sum, day) => sum + day.calls, 0) / 
                        Object.keys(results.dailyTrends).length || 0;
  
  Object.entries(results.dailyTrends).forEach(([day, data]) => {
    // Détecter les jours avec un nombre d'appels anormalement élevé ou bas
    if (data.calls > dailyAvgCalls * 1.5) {
      results.anomalies.push({
        type: 'high_usage',
        day,
        value: data.calls,
        average: dailyAvgCalls,
        message: `Utilisation anormalement élevée le ${day}: ${data.calls} appels (moyenne: ${dailyAvgCalls.toFixed(0)})`
      });
    } else if (data.calls < dailyAvgCalls * 0.5 && data.calls > 0) {
      results.anomalies.push({
        type: 'low_usage',
        day,
        value: data.calls,
        average: dailyAvgCalls,
        message: `Utilisation anormalement basse le ${day}: ${data.calls} appels (moyenne: ${dailyAvgCalls.toFixed(0)})`
      });
    }

    // Détecter les jours avec un taux d'erreur élevé
    const errorRate = data.calls > 0 ? (data.errors / data.calls) * 100 : 0;
    if (errorRate > 10 && data.calls >= 10) {
      results.anomalies.push({
        type: 'high_error_rate',
        day,
        value: errorRate,
        message: `Taux d'erreur élevé le ${day}: ${errorRate.toFixed(2)}% (${data.errors}/${data.calls})`
      });
    }
  });

  // Calculer les totaux et moyennes finales
  Object.keys(results.apiUsage).forEach(api => {
    const usage = results.apiUsage[api];
    usage.errorRate = usage.calls > 0 ? (usage.errors / usage.calls * 100).toFixed(2) : 0;
  });

  // Trier les endpoints par nombre d'appels
  results.topEndpoints = Object.entries(results.topEndpoints)
    .sort((a, b) => b[1] - a[1])
    .reduce((obj, [key, value]) => {
      obj[key] = value;
      return obj;
    }, {});

  // Si le minimum n'a pas été défini (aucun appel avec temps de réponse > 0)
  if (results.responseTimeTrends.min === Number.MAX_SAFE_INTEGER) {
    results.responseTimeTrends.min = 0;
  }

  return results;
}

/**
 * Génère un rapport au format console
 * @param {Object} results Résultats de l'analyse
 */
function generateConsoleReport(results) {
  console.log(colors.cyan('\n=== RAPPORT D\'ANALYSE DES TENDANCES D\'UTILISATION DES API ===\n'));
  
  console.log(colors.yellow('Période:'), `${options.days} derniers jours`);
  if (options.api) {
    console.log(colors.yellow('API filtrée:'), options.api);
  }
  console.log();

  // Statistiques générales
  console.log(colors.cyan('--- Statistiques Générales ---'));
  console.log(colors.yellow('Total des appels:'), results.totalCalls);
  console.log(colors.yellow('Total des erreurs:'), results.totalErrors);
  console.log(colors.yellow('Taux de réussite:'), `${results.successRate}%`);
  console.log(colors.yellow('Total des alertes:'), results.totalAlerts);
  console.log();

  // Utilisation par API
  console.log(colors.cyan('--- Utilisation par API ---'));
  const apiTable = new Table({
    head: ['API', 'Appels', 'Erreurs', 'Taux d\'erreur', 'Temps moyen (ms)'],
    colWidths: [20, 10, 10, 15, 20]
  });

  Object.entries(results.apiUsage).forEach(([api, usage]) => {
    apiTable.push([
      api,
      usage.calls,
      usage.errors,
      `${usage.errorRate}%`,
      usage.avgResponseTime.toFixed(2)
    ]);
  });
  console.log(apiTable.toString());
  console.log();

  // Top 10 endpoints
  console.log(colors.cyan('--- Top 10 Endpoints ---'));
  const endpointTable = new Table({
    head: ['Endpoint', 'Appels'],
    colWidths: [50, 10]
  });

  Object.entries(results.topEndpoints)
    .slice(0, 10)
    .forEach(([endpoint, count]) => {
      endpointTable.push([endpoint, count]);
    });
  console.log(endpointTable.toString());
  console.log();

  // Distribution horaire
  console.log(colors.cyan('--- Distribution Horaire des Appels ---'));
  const hourlyTable = new Table({
    head: ['Heure', 'Appels', 'Pourcentage'],
    colWidths: [10, 10, 15]
  });

  results.hourlyDistribution.forEach((count, hour) => {
    const percentage = results.totalCalls > 0 ? (count / results.totalCalls * 100).toFixed(2) : '0.00';
    hourlyTable.push([
      `${hour}h-${(hour + 1) % 24}h`,
      count,
      `${percentage}%`
    ]);
  });
  console.log(hourlyTable.toString());
  console.log();

  // Types d'erreurs
  if (Object.keys(results.errorTypes).length > 0) {
    console.log(colors.cyan('--- Types d\'Erreurs ---'));
    const errorTable = new Table({
      head: ['Type d\'erreur', 'Occurrences'],
      colWidths: [50, 15]
    });

    Object.entries(results.errorTypes)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        errorTable.push([type.substring(0, 45) + (type.length > 45 ? '...' : ''), count]);
      });
    console.log(errorTable.toString());
    console.log();
  }

  // Anomalies détectées
  if (results.anomalies.length > 0) {
    console.log(colors.cyan('--- Anomalies Détectées ---'));
    results.anomalies.forEach(anomaly => {
      const color = anomaly.type.includes('high_error') ? 'red' : 
                    anomaly.type.includes('high_usage') ? 'yellow' : 'cyan';
      console.log(colors[color](`[${anomaly.type}] ${anomaly.message}`));
    });
    console.log();
  }

  // Temps de réponse
  console.log(colors.cyan('--- Statistiques de Temps de Réponse ---'));
  console.log(colors.yellow('Temps moyen:'), `${results.responseTimeTrends.average.toFixed(2)} ms`);
  console.log(colors.yellow('Temps maximum:'), `${results.responseTimeTrends.max} ms`);
  console.log(colors.yellow('Temps minimum:'), `${results.responseTimeTrends.min} ms`);
  console.log();

  // Recommandations
  console.log(colors.cyan('--- Recommandations ---'));
  if (results.totalCalls === 0) {
    console.log(colors.red('Aucune donnée d\'appel API disponible pour la période sélectionnée.'));
  } else {
    if (results.successRate < 95) {
      console.log(colors.red(`- Le taux de réussite est bas (${results.successRate}%). Investiguer les causes d'erreurs.`));
    }
    
    const highErrorApis = Object.entries(results.apiUsage)
      .filter(([_, usage]) => parseFloat(usage.errorRate) > 5)
      .map(([api, usage]) => api);
    
    if (highErrorApis.length > 0) {
      console.log(colors.yellow(`- APIs avec taux d'erreur élevé: ${highErrorApis.join(', ')}`));
    }
    
    // Trouver l'heure de pointe
    const peakHour = results.hourlyDistribution.indexOf(Math.max(...results.hourlyDistribution));
    console.log(colors.yellow(`- Heure de pointe: ${peakHour}h-${(peakHour + 1) % 24}h`));
    
    if (results.responseTimeTrends.max > 2000) {
      console.log(colors.yellow(`- Temps de réponse maximum élevé (${results.responseTimeTrends.max} ms). Vérifier la performance des API concernées.`));
    }
  }

  console.log(colors.cyan('\n=== FIN DU RAPPORT ===\n'));
}

/**
 * Génère un rapport au format JSON
 * @param {Object} results Résultats de l'analyse
 * @param {string} outputFile Fichier de sortie
 */
function generateJsonReport(results, outputFile) {
  const reportPath = outputFile || path.join(OUTPUT_DIR, `api-trends-${moment().format('YYYY-MM-DD')}.json`);
  
  // Ajouter des métadonnées
  const report = {
    metadata: {
      generatedAt: new Date().toISOString(),
      period: `${options.days} jours`,
      apiFilter: options.api || 'all'
    },
    results
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`Rapport JSON généré: ${reportPath}`);
}

/**
 * Génère un rapport au format HTML
 * @param {Object} results Résultats de l'analyse
 * @param {string} outputFile Fichier de sortie
 */
function generateHtmlReport(results, outputFile) {
  const reportPath = outputFile || path.join(OUTPUT_DIR, `api-trends-${moment().format('YYYY-MM-DD')}.html`);
  
  // En-tête HTML
  let html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport des Tendances d'Utilisation des API</title>
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
    .section {
      margin-bottom: 30px;
      padding: 20px;
      background-color: #f9f9f9;
      border-radius: 5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th, td {
      padding: 10px;
      border: 1px solid #ddd;
      text-align: left;
    }
    th {
      background-color: #f2f2f2;
    }
    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    .error {
      color: #d9534f;
    }
    .warning {
      color: #f0ad4e;
    }
    .success {
      color: #5cb85c;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Rapport des Tendances d'Utilisation des API</h1>
    <p>Période: ${options.days} derniers jours</p>
    <p>Généré le ${moment().format('DD/MM/YYYY à HH:mm')}</p>
    ${options.api ? `<p>API filtrée: ${options.api}</p>` : ''}
  </div>`;
  
  // Statistiques générales
  html += `
  <div class="section">
    <h2>Statistiques Générales</h2>
    <p>Total des appels: <strong>${results.totalCalls}</strong></p>
    <p>Total des erreurs: <strong>${results.totalErrors}</strong></p>
    <p>Taux de réussite: <strong>${results.successRate}%</strong></p>
    <p>Total des alertes: <strong>${results.totalAlerts}</strong></p>
  </div>`;
  
  // Utilisation par API
  html += `
  <div class="section">
    <h2>Utilisation par API</h2>
    <table>
      <thead>
        <tr>
          <th>API</th>
          <th>Appels</th>
          <th>Erreurs</th>
          <th>Taux d'erreur</th>
          <th>Temps moyen (ms)</th>
        </tr>
      </thead>
      <tbody>`;
  
  Object.entries(results.apiUsage).forEach(([api, usage]) => {
    html += `
        <tr>
          <td>${api}</td>
          <td>${usage.calls}</td>
          <td>${usage.errors}</td>
          <td>${usage.errorRate}%</td>
          <td>${usage.avgResponseTime.toFixed(2)}</td>
        </tr>`;
  });
  
  html += `
      </tbody>
    </table>
  </div>`;
  
  // Top 10 endpoints
  html += `
  <div class="section">
    <h2>Top 10 Endpoints</h2>
    <table>
      <thead>
        <tr>
          <th>Endpoint</th>
          <th>Appels</th>
        </tr>
      </thead>
      <tbody>`;
  
  Object.entries(results.topEndpoints)
    .slice(0, 10)
    .forEach(([endpoint, count]) => {
      html += `
        <tr>
          <td>${endpoint}</td>
          <td>${count}</td>
        </tr>`;
    });
  
  html += `
      </tbody>
    </table>
  </div>`;
  
  // Distribution horaire
  html += `
  <div class="section">
    <h2>Distribution Horaire des Appels</h2>
    <table>
      <thead>
        <tr>
          <th>Heure</th>
          <th>Appels</th>
          <th>Pourcentage</th>
        </tr>
      </thead>
      <tbody>`;
  
  results.hourlyDistribution.forEach((count, hour) => {
    const percentage = results.totalCalls > 0 ? (count / results.totalCalls * 100).toFixed(2) : '0.00';
    html += `
        <tr>
          <td>${hour}h-${(hour + 1) % 24}h</td>
          <td>${count}</td>
          <td>${percentage}%</td>
        </tr>`;
  });
  
  html += `
      </tbody>
    </table>
  </div>`;
  
  // Types d'erreurs
  if (Object.keys(results.errorTypes).length > 0) {
    html += `
  <div class="section">
    <h2>Types d'Erreurs</h2>
    <table>
      <thead>
        <tr>
          <th>Type d'erreur</th>
          <th>Occurrences</th>
        </tr>
      </thead>
      <tbody>`;
    
    Object.entries(results.errorTypes)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        html += `
        <tr>
          <td>${type}</td>
          <td>${count}</td>
        </tr>`;
      });
    
    html += `
      </tbody>
    </table>
  </div>`;
  }
  
  // Anomalies détectées
  if (results.anomalies.length > 0) {
    html += `
  <div class="section">
    <h2>Anomalies Détectées</h2>
    <ul>`;
    
    results.anomalies.forEach(anomaly => {
      const className = anomaly.type.includes('high_error') ? 'error' : 
                      anomaly.type.includes('high_usage') ? 'warning' : '';
      html += `
      <li class="${className}">${anomaly.message}</li>`;
    });
    
    html += `
    </ul>
  </div>`;
  }
  
  // Temps de réponse
  html += `
  <div class="section">
    <h2>Statistiques de Temps de Réponse</h2>
    <p>Temps moyen: <strong>${results.responseTimeTrends.average.toFixed(2)} ms</strong></p>
    <p>Temps maximum: <strong>${results.responseTimeTrends.max} ms</strong></p>
    <p>Temps minimum: <strong>${results.responseTimeTrends.min} ms</strong></p>
  </div>`;
  
  // Recommandations
  html += `
  <div class="section">
    <h2>Recommandations</h2>`;
  
  if (results.totalCalls === 0) {
    html += `
    <p class="error">Aucune donnée d'appel API disponible pour la période sélectionnée.</p>`;
  } else {
    html += `
    <ul>`;
    
    if (results.successRate < 95) {
      html += `
      <li class="error">Le taux de réussite est bas (${results.successRate}%). Investiguer les causes d'erreurs.</li>`;
    }
    
    const highErrorApis = Object.entries(results.apiUsage)
      .filter(([_, usage]) => parseFloat(usage.errorRate) > 5)
      .map(([api, usage]) => api);
    
    if (highErrorApis.length > 0) {
      html += `
      <li class="warning">APIs avec taux d'erreur élevé: ${highErrorApis.join(', ')}</li>`;
    }
    
    // Trouver l'heure de pointe
    const peakHour = results.hourlyDistribution.indexOf(Math.max(...results.hourlyDistribution));
    html += `
      <li>Heure de pointe: ${peakHour}h-${(peakHour + 1) % 24}h</li>`;
    
    if (results.responseTimeTrends.max > 2000) {
      html += `
      <li class="warning">Temps de réponse maximum élevé (${results.responseTimeTrends.max} ms). Vérifier la performance des API concernées.</li>`;
    }
    
    html += `
    </ul>`;
  }
  
  html += `
  </div>
  
  <div class="footer">
    <p>Rapport généré automatiquement par le système de monitoring des API.</p>
  </div>
</body>
</html>`;
  
  fs.writeFileSync(reportPath, html);
  console.log(`Rapport HTML généré: ${reportPath}`);
}

/**
 * Fonction principale
 */
async function main() {
  try {
    console.log(colors.cyan('Analyse des tendances d\'utilisation des API...'));
    
    // Calculer la date de début
    const startDate = moment().subtract(options.days, 'days').startOf('day').toDate();
    console.log(`Période d'analyse: du ${moment(startDate).format('YYYY-MM-DD')} au ${moment().format('YYYY-MM-DD')}`);
    
    // Charger les logs
    console.log('Chargement des logs...');
    const apiCalls = parseLogFile(API_CALLS_LOG, startDate);
    const apiErrors = parseLogFile(API_ERRORS_LOG, startDate);
    const alerts = options.alerts ? parseLogFile(ALERTS_LOG, startDate) : [];
    
    console.log(`${apiCalls.length} appels API, ${apiErrors.length} erreurs et ${alerts.length} alertes chargés.`);
    
    // Analyser les tendances
    console.log('Analyse des tendances...');
    const results = analyzeTrends(apiCalls, apiErrors, alerts);
    
    // Générer le rapport
    console.log(`Génération du rapport au format ${options.output}...`);
    switch (options.output) {
      case 'json':
        generateJsonReport(results, options.file);
        break;
      case 'html':
        generateHtmlReport(results, options.file);
        break;
      case 'console':
      default:
        generateConsoleReport(results);
    }
    
    console.log(colors.green('Analyse terminée avec succès.'));
    
  } catch (error) {
    console.error(colors.red('Erreur lors de l\'analyse:'), error);
    process.exit(1);
  }
}

// Exécuter le programme
main();
