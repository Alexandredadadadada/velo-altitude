#!/usr/bin/env node

/**
 * Outil d'analyse de l'utilisation des API
 * Analyse les logs d'appels API pour identifier les tendances et optimisations potentielles
 */
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { program } = require('commander');
const colors = require('colors/safe');
const Table = require('cli-table3');
const moment = require('moment');
const dotenv = require('dotenv');

// Charger les variables d'environnement
dotenv.config();

// Configuration du programme
program
  .version('1.0.0')
  .description('Analyseur d\'utilisation des API pour le Tableau de Bord Européen de Cyclisme')
  .option('-d, --days <days>', 'Période d\'analyse en jours', 7)
  .option('-o, --output <output>', 'Chemin du fichier de sortie pour le rapport', '')
  .option('-a, --api <api>', 'Filtrer par nom d\'API spécifique')
  .option('-f, --format <format>', 'Format de sortie (console, json, html)', 'console')
  .option('-v, --verbose', 'Afficher des informations détaillées')
  .parse(process.argv);

const options = program.opts();

// Constantes
const LOG_DIR = path.resolve(process.cwd(), 'logs');
const API_LOG_FILE = path.join(LOG_DIR, 'api-calls.log');
const QUOTAS_LOG_FILE = path.join(LOG_DIR, 'api-quotas.log');
const ERRORS_LOG_FILE = path.join(LOG_DIR, 'api-errors.log');

// Période d'analyse
const days = parseInt(options.days) || 7;
const startDate = moment().subtract(days, 'days').startOf('day');

// Variables pour l'analyse
const apiCalls = {};
const apiErrors = {};
const apiQuotas = {};
const apiEndpoints = {};
const apiTrends = {};
const hourlyUsage = Array(24).fill(0);

/**
 * Lit et analyse un fichier de log ligne par ligne
 * @param {string} filePath - Chemin du fichier à analyser
 * @param {Function} lineProcessor - Fonction de traitement pour chaque ligne
 */
async function processLogFile(filePath, lineProcessor) {
  if (!fs.existsSync(filePath)) {
    console.warn(colors.yellow(`Avertissement: Le fichier ${filePath} n'existe pas, il sera ignoré`));
    return;
  }

  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (line.trim()) {
      try {
        const entry = JSON.parse(line);
        
        // Ne traiter que les entrées dans la période d'analyse
        const entryDate = moment(entry.timestamp);
        if (entryDate.isAfter(startDate)) {
          lineProcessor(entry);
        }
      } catch (error) {
        if (options.verbose) {
          console.error(`Erreur lors du traitement de la ligne: ${line}`);
          console.error(error);
        }
      }
    }
  }
}

/**
 * Analyse les appels API
 */
async function analyzeApiCalls() {
  await processLogFile(API_LOG_FILE, (entry) => {
    const apiName = entry.api || 'unknown';
    
    // Filtrer par API spécifique si demandé
    if (options.api && apiName !== options.api) {
      return;
    }
    
    // Compter les appels par API
    apiCalls[apiName] = (apiCalls[apiName] || 0) + 1;
    
    // Compter les appels par endpoint
    const endpoint = entry.endpoint || 'unknown';
    apiEndpoints[endpoint] = (apiEndpoints[endpoint] || 0) + 1;
    
    // Analyser l'utilisation par heure
    const hour = moment(entry.timestamp).hour();
    hourlyUsage[hour]++;
    
    // Analyser les tendances d'utilisation par jour
    const day = moment(entry.timestamp).format('YYYY-MM-DD');
    apiTrends[day] = apiTrends[day] || {};
    apiTrends[day][apiName] = (apiTrends[day][apiName] || 0) + 1;
  });
}

/**
 * Analyse les erreurs API
 */
async function analyzeApiErrors() {
  await processLogFile(ERRORS_LOG_FILE, (entry) => {
    const apiName = entry.apiName || 'unknown';
    
    // Filtrer par API spécifique si demandé
    if (options.api && apiName !== options.api) {
      return;
    }
    
    // Compter les erreurs par API
    apiErrors[apiName] = apiErrors[apiName] || { count: 0, types: {} };
    apiErrors[apiName].count++;
    
    // Classifier les erreurs par type
    const errorType = entry.type || 'unknown';
    apiErrors[apiName].types[errorType] = (apiErrors[apiName].types[errorType] || 0) + 1;
  });
}

/**
 * Analyse les quotas API
 */
async function analyzeApiQuotas() {
  await processLogFile(QUOTAS_LOG_FILE, (entry) => {
    const apiName = entry.apiName || 'unknown';
    
    // Filtrer par API spécifique si demandé
    if (options.api && apiName !== options.api) {
      return;
    }
    
    // Stocker la dernière entrée de quota pour chaque API
    apiQuotas[apiName] = {
      limit: entry.limit || 'unknown',
      used: entry.used || 0,
      remaining: entry.remaining || 0,
      resetAt: entry.resetAt || 'unknown',
      timestamp: entry.timestamp
    };
  });
}

/**
 * Calcule le pourcentage d'utilisation des quotas
 * @param {Object} quota - Données de quota pour une API
 * @returns {string} - Pourcentage d'utilisation formaté
 */
function calculateQuotaPercentage(quota) {
  if (quota.limit === 'unknown' || quota.limit === 0) {
    return 'N/A';
  }
  
  const percentage = (quota.used / quota.limit) * 100;
  return `${percentage.toFixed(2)}%`;
}

/**
 * Identifie les tendances de croissance d'utilisation
 * @returns {Object} - Tendances identifiées
 */
function identifyGrowthTrends() {
  const trends = {};
  const days = Object.keys(apiTrends).sort();
  
  if (days.length < 2) {
    return trends;
  }
  
  // Pour chaque API, calculer le taux de croissance moyen
  Object.keys(apiCalls).forEach(api => {
    let previousDayCount = 0;
    let growthRates = [];
    
    days.forEach(day => {
      const count = (apiTrends[day] && apiTrends[day][api]) || 0;
      
      if (previousDayCount > 0) {
        const growthRate = ((count - previousDayCount) / previousDayCount) * 100;
        growthRates.push(growthRate);
      }
      
      previousDayCount = count;
    });
    
    if (growthRates.length > 0) {
      const avgGrowthRate = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;
      trends[api] = avgGrowthRate.toFixed(2);
    }
  });
  
  return trends;
}

/**
 * Identifie les pics d'utilisation par heure
 * @returns {Array} - Heures de pic d'utilisation
 */
function identifyUsagePeaks() {
  const peaks = [];
  const average = hourlyUsage.reduce((a, b) => a + b, 0) / 24;
  const threshold = average * 1.5;
  
  hourlyUsage.forEach((count, hour) => {
    if (count > threshold) {
      peaks.push({ hour, count });
    }
  });
  
  return peaks.sort((a, b) => b.count - a.count);
}

/**
 * Identifie les endpoints les plus utilisés
 * @param {number} limit - Nombre d'endpoints à retourner
 * @returns {Array} - Endpoints les plus utilisés
 */
function identifyTopEndpoints(limit = 5) {
  const endpoints = Object.entries(apiEndpoints)
    .map(([endpoint, count]) => ({ endpoint, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
  
  return endpoints;
}

/**
 * Calcule l'efficacité des API
 * @returns {Object} - Efficacité par API
 */
function calculateApiEfficiency() {
  const efficiency = {};
  
  Object.keys(apiCalls).forEach(api => {
    const totalCalls = apiCalls[api] || 0;
    const totalErrors = (apiErrors[api] && apiErrors[api].count) || 0;
    
    if (totalCalls > 0) {
      const successRate = ((totalCalls - totalErrors) / totalCalls) * 100;
      efficiency[api] = successRate.toFixed(2);
    } else {
      efficiency[api] = 'N/A';
    }
  });
  
  return efficiency;
}

/**
 * Recommande des optimisations basées sur l'analyse
 * @returns {Array} - Recommandations d'optimisation
 */
function recommendOptimizations() {
  const recommendations = [];
  const growthTrends = identifyGrowthTrends();
  const peaks = identifyUsagePeaks();
  const efficiency = calculateApiEfficiency();
  
  // Optimisations basées sur la croissance
  Object.entries(growthTrends).forEach(([api, rate]) => {
    if (parseFloat(rate) > 20) {
      recommendations.push({
        api,
        type: 'growth',
        message: `L'API ${api} montre une croissance rapide (${rate}% par jour). Envisagez d'augmenter les quotas ou d'optimiser l'utilisation.`
      });
    }
  });
  
  // Optimisations basées sur les pics d'utilisation
  if (peaks.length > 0) {
    const peakHours = peaks.map(p => `${p.hour}h (${p.count} appels)`).join(', ');
    recommendations.push({
      type: 'peak',
      message: `Pics d'utilisation identifiés aux heures suivantes: ${peakHours}. Envisagez de répartir les tâches planifiées.`
    });
  }
  
  // Optimisations basées sur l'efficacité
  Object.entries(efficiency).forEach(([api, rate]) => {
    if (rate !== 'N/A' && parseFloat(rate) < 90) {
      recommendations.push({
        api,
        type: 'efficiency',
        message: `L'API ${api} a un taux de réussite faible (${rate}%). Vérifiez les paramètres de requête et la gestion des erreurs.`
      });
    }
  });
  
  // Optimisations basées sur les quotas
  Object.entries(apiQuotas).forEach(([api, quota]) => {
    const percentage = calculateQuotaPercentage(quota);
    if (percentage !== 'N/A' && parseFloat(percentage) > 80) {
      recommendations.push({
        api,
        type: 'quota',
        message: `L'API ${api} approche de sa limite de quota (${percentage}). Envisagez d'augmenter le quota ou d'optimiser l'utilisation.`
      });
    }
  });
  
  return recommendations;
}

/**
 * Génère un rapport au format console
 */
function generateConsoleReport() {
  console.log(colors.cyan('=== RAPPORT D\'ANALYSE D\'UTILISATION DES API ==='));
  console.log(colors.cyan(`Période d'analyse: ${startDate.format('YYYY-MM-DD')} à ${moment().format('YYYY-MM-DD')}`));
  console.log(colors.cyan(`Date du rapport: ${moment().format('YYYY-MM-DD HH:mm:ss')}`));
  console.log('');
  
  // Utilisation par API
  console.log(colors.yellow('== UTILISATION PAR API =='));
  const apiTable = new Table({
    head: ['API', 'Appels', 'Erreurs', 'Taux de réussite', '% Quota utilisé'],
    colWidths: [20, 10, 10, 15, 15]
  });
  
  Object.keys(apiCalls).sort().forEach(api => {
    const calls = apiCalls[api] || 0;
    const errors = (apiErrors[api] && apiErrors[api].count) || 0;
    const successRate = calls > 0 ? (((calls - errors) / calls) * 100).toFixed(2) + '%' : 'N/A';
    const quota = apiQuotas[api] || { used: 0, limit: 'N/A' };
    const quotaPercentage = calculateQuotaPercentage(quota);
    
    apiTable.push([api, calls, errors, successRate, quotaPercentage]);
  });
  
  console.log(apiTable.toString());
  console.log('');
  
  // Top endpoints
  console.log(colors.yellow('== TOP 5 ENDPOINTS =='));
  const endpointTable = new Table({
    head: ['Endpoint', 'Appels'],
    colWidths: [50, 10]
  });
  
  identifyTopEndpoints(5).forEach(({ endpoint, count }) => {
    endpointTable.push([endpoint, count]);
  });
  
  console.log(endpointTable.toString());
  console.log('');
  
  // Tendances de croissance
  console.log(colors.yellow('== TENDANCES DE CROISSANCE =='));
  const trendsTable = new Table({
    head: ['API', 'Taux de croissance quotidien'],
    colWidths: [20, 30]
  });
  
  const growthTrends = identifyGrowthTrends();
  Object.entries(growthTrends).sort((a, b) => parseFloat(b[1]) - parseFloat(a[1])).forEach(([api, rate]) => {
    trendsTable.push([api, `${rate}%`]);
  });
  
  console.log(trendsTable.toString());
  console.log('');
  
  // Pics d'utilisation
  console.log(colors.yellow('== PICS D\'UTILISATION =='));
  const peaksTable = new Table({
    head: ['Heure', 'Nombre d\'appels'],
    colWidths: [10, 20]
  });
  
  identifyUsagePeaks().forEach(({ hour, count }) => {
    peaksTable.push([`${hour}h`, count]);
  });
  
  console.log(peaksTable.toString());
  console.log('');
  
  // Recommandations d'optimisation
  console.log(colors.yellow('== RECOMMANDATIONS D\'OPTIMISATION =='));
  const recommendations = recommendOptimizations();
  
  if (recommendations.length > 0) {
    recommendations.forEach(rec => {
      console.log(colors.green(`- ${rec.message}`));
    });
  } else {
    console.log(colors.green('Aucune recommandation d\'optimisation identifiée.'));
  }
  
  console.log('');
  console.log(colors.cyan('=== FIN DU RAPPORT ==='));
}

/**
 * Génère un rapport au format JSON
 * @returns {string} - Rapport au format JSON
 */
function generateJsonReport() {
  const report = {
    metadata: {
      generatedAt: moment().format('YYYY-MM-DD HH:mm:ss'),
      period: {
        start: startDate.format('YYYY-MM-DD'),
        end: moment().format('YYYY-MM-DD')
      }
    },
    summary: {
      totalApis: Object.keys(apiCalls).length,
      totalCalls: Object.values(apiCalls).reduce((a, b) => a + b, 0),
      totalErrors: Object.values(apiErrors).reduce((a, b) => a + b.count, 0)
    },
    apis: Object.keys(apiCalls).map(api => {
      const calls = apiCalls[api] || 0;
      const errors = (apiErrors[api] && apiErrors[api].count) || 0;
      const successRate = calls > 0 ? ((calls - errors) / calls) * 100 : null;
      const quota = apiQuotas[api] || {};
      
      return {
        name: api,
        calls,
        errors,
        successRate: successRate ? successRate.toFixed(2) : null,
        quota: {
          limit: quota.limit,
          used: quota.used,
          remaining: quota.remaining,
          percentage: calculateQuotaPercentage(quota),
          resetAt: quota.resetAt
        }
      };
    }),
    analysis: {
      topEndpoints: identifyTopEndpoints(10),
      growthTrends: identifyGrowthTrends(),
      usagePeaks: identifyUsagePeaks(),
      recommendations: recommendOptimizations()
    },
    hourlyUsage
  };
  
  return JSON.stringify(report, null, 2);
}

/**
 * Génère un rapport au format HTML
 * @returns {string} - Rapport au format HTML
 */
function generateHtmlReport() {
  const growthTrends = identifyGrowthTrends();
  const peaks = identifyUsagePeaks();
  const recommendations = recommendOptimizations();
  
  let apiRows = '';
  Object.keys(apiCalls).sort().forEach(api => {
    const calls = apiCalls[api] || 0;
    const errors = (apiErrors[api] && apiErrors[api].count) || 0;
    const successRate = calls > 0 ? (((calls - errors) / calls) * 100).toFixed(2) + '%' : 'N/A';
    const quota = apiQuotas[api] || { used: 0, limit: 'N/A' };
    const quotaPercentage = calculateQuotaPercentage(quota);
    
    apiRows += `
      <tr>
        <td>${api}</td>
        <td>${calls}</td>
        <td>${errors}</td>
        <td>${successRate}</td>
        <td>${quotaPercentage}</td>
      </tr>
    `;
  });
  
  let endpointRows = '';
  identifyTopEndpoints(10).forEach(({ endpoint, count }) => {
    endpointRows += `
      <tr>
        <td>${endpoint}</td>
        <td>${count}</td>
      </tr>
    `;
  });
  
  let trendRows = '';
  Object.entries(growthTrends).sort((a, b) => parseFloat(b[1]) - parseFloat(a[1])).forEach(([api, rate]) => {
    trendRows += `
      <tr>
        <td>${api}</td>
        <td>${rate}%</td>
      </tr>
    `;
  });
  
  let peakRows = '';
  peaks.forEach(({ hour, count }) => {
    peakRows += `
      <tr>
        <td>${hour}h</td>
        <td>${count}</td>
      </tr>
    `;
  });
  
  let recommendationItems = '';
  recommendations.forEach(rec => {
    recommendationItems += `<li>${rec.message}</li>`;
  });
  
  // Données pour le graphique d'utilisation horaire
  const hourlyData = JSON.stringify(hourlyUsage);
  
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Rapport d'analyse d'utilisation des API</title>
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
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th, td {
          padding: 12px 15px;
          border-bottom: 1px solid #ddd;
          text-align: left;
        }
        th {
          background-color: #f2f2f2;
          font-weight: bold;
        }
        tr:hover {
          background-color: #f5f5f5;
        }
        .card {
          background: white;
          border-radius: 5px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
          padding: 20px;
          margin-bottom: 20px;
        }
        .chart-container {
          height: 300px;
          margin-bottom: 30px;
        }
        .recommendation {
          background-color: #e3f2fd;
          padding:.5em 1em;
          border-left: 3px solid #2196f3;
          margin-bottom: .5em;
        }
      </style>
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    </head>
    <body>
      <div class="card">
        <h1>Rapport d'analyse d'utilisation des API</h1>
        <p><strong>Période d'analyse:</strong> ${startDate.format('YYYY-MM-DD')} à ${moment().format('YYYY-MM-DD')}</p>
        <p><strong>Date du rapport:</strong> ${moment().format('YYYY-MM-DD HH:mm:ss')}</p>
      </div>
      
      <div class="card">
        <h2>Utilisation horaire</h2>
        <div class="chart-container">
          <canvas id="hourlyChart"></canvas>
        </div>
      </div>
      
      <div class="card">
        <h2>Utilisation par API</h2>
        <table>
          <thead>
            <tr>
              <th>API</th>
              <th>Appels</th>
              <th>Erreurs</th>
              <th>Taux de réussite</th>
              <th>% Quota utilisé</th>
            </tr>
          </thead>
          <tbody>
            ${apiRows}
          </tbody>
        </table>
      </div>
      
      <div class="card">
        <h2>Top 10 Endpoints</h2>
        <table>
          <thead>
            <tr>
              <th>Endpoint</th>
              <th>Appels</th>
            </tr>
          </thead>
          <tbody>
            ${endpointRows}
          </tbody>
        </table>
      </div>
      
      <div class="card">
        <h2>Tendances de croissance</h2>
        <table>
          <thead>
            <tr>
              <th>API</th>
              <th>Taux de croissance quotidien</th>
            </tr>
          </thead>
          <tbody>
            ${trendRows}
          </tbody>
        </table>
      </div>
      
      <div class="card">
        <h2>Pics d'utilisation</h2>
        <table>
          <thead>
            <tr>
              <th>Heure</th>
              <th>Nombre d'appels</th>
            </tr>
          </thead>
          <tbody>
            ${peakRows}
          </tbody>
        </table>
      </div>
      
      <div class="card">
        <h2>Recommandations d'optimisation</h2>
        ${recommendationItems ? `<ul>${recommendationItems}</ul>` : '<p>Aucune recommandation d\'optimisation identifiée.</p>'}
      </div>
      
      <script>
        const ctx = document.getElementById('hourlyChart').getContext('2d');
        const hourlyData = ${hourlyData};
        const hourLabels = Array.from({length: 24}, (_, i) => \`\${i}h\`);
        
        new Chart(ctx, {
          type: 'bar',
          data: {
            labels: hourLabels,
            datasets: [{
              label: 'Appels API par heure',
              data: hourlyData,
              backgroundColor: 'rgba(54, 162, 235, 0.5)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        });
      </script>
    </body>
    </html>
  `;
}

/**
 * Écrit le rapport dans un fichier
 * @param {string} content - Contenu du rapport
 * @param {string} outputPath - Chemin du fichier de sortie
 */
function writeReportToFile(content, outputPath) {
  try {
    fs.writeFileSync(outputPath, content);
    console.log(`Rapport écrit dans le fichier: ${outputPath}`);
  } catch (error) {
    console.error(`Erreur lors de l'écriture du rapport: ${error.message}`);
  }
}

/**
 * Fonction principale
 */
async function main() {
  try {
    console.log(colors.cyan('Analyseur d\'utilisation des API'));
    console.log(`Période d'analyse: ${startDate.format('YYYY-MM-DD')} à aujourd'hui`);
    
    // S'assurer que le répertoire des logs existe
    if (!fs.existsSync(LOG_DIR)) {
      console.log(colors.yellow(`Le répertoire des logs ${LOG_DIR} n'existe pas. Création...`));
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
    
    // Analyser les logs
    console.log('Analyse des appels API...');
    await analyzeApiCalls();
    
    console.log('Analyse des erreurs API...');
    await analyzeApiErrors();
    
    console.log('Analyse des quotas API...');
    await analyzeApiQuotas();
    
    // Générer le rapport dans le format spécifié
    let reportContent = '';
    
    if (options.format === 'json') {
      reportContent = generateJsonReport();
    } else if (options.format === 'html') {
      reportContent = generateHtmlReport();
    } else {
      generateConsoleReport();
    }
    
    // Écrire le rapport dans un fichier si demandé
    if (options.output && reportContent) {
      writeReportToFile(reportContent, options.output);
    }
    
  } catch (error) {
    console.error(colors.red(`Erreur lors de l'analyse: ${error.message}`));
    console.error(error.stack);
    process.exit(1);
  }
}

// Exécuter le programme
main().catch(error => {
  console.error(colors.red(`Erreur fatale: ${error.message}`));
  process.exit(1);
});
