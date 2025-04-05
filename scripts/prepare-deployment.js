/**
 * Script de préparation au déploiement sur Hostinger
 * Exécute une série de vérifications et de validations avant le déploiement
 */

// Charger les dépendances
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

// Importer les utilitaires existants
const ApiKeysManager = require('../server/utils/api-keys-manager');
const apiKeysAudit = require('../server/utils/api-keys-audit');

// Configuration
const config = {
  rootDir: path.resolve(__dirname, '..'),
  envProdPath: path.resolve(__dirname, '..', '.env.production'),
  outputDir: path.resolve(__dirname, '..', 'deployment-report')
};

// Créer le répertoire de sortie s'il n'existe pas
if (!fs.existsSync(config.outputDir)) {
  fs.mkdirSync(config.outputDir, { recursive: true });
}

/**
 * Fonction principale
 */
async function main() {
  console.log(chalk.blue.bold('=== Préparation au déploiement sur Hostinger ===\n'));
  
  // Étape 1: Vérifier la présence du fichier .env.production
  await checkEnvProduction();
  
  // Étape 2: Exécuter l'audit des clés API
  await auditApiKeys();
  
  // Étape 3: Vérifier les dépendances vulnérables
  await checkVulnerableDependencies();
  
  // Étape 4: Vérifier les services externes
  await checkExternalServices();
  
  // Étape 5: Générer le rapport final
  await generateFinalReport();
  
  console.log(chalk.green.bold('\n✓ Préparation au déploiement terminée.'));
  console.log(chalk.blue(`  Rapport disponible dans: ${config.outputDir}`));
}

/**
 * Vérifie la présence et la validité du fichier .env.production
 */
async function checkEnvProduction() {
  console.log(chalk.blue('Vérification du fichier .env.production...'));
  
  if (!fs.existsSync(config.envProdPath)) {
    console.log(chalk.red('❌ Fichier .env.production non trouvé.'));
    console.log(chalk.yellow('  Création d\'un fichier .env.production à partir de .env.example...'));
    
    // Copier .env.example vers .env.production
    const envExamplePath = path.resolve(config.rootDir, '.env.example');
    if (fs.existsSync(envExamplePath)) {
      fs.copyFileSync(envExamplePath, config.envProdPath);
      console.log(chalk.green('✓ Fichier .env.production créé.'));
    } else {
      console.log(chalk.red('❌ Fichier .env.example non trouvé. Impossible de créer .env.production.'));
      process.exit(1);
    }
  } else {
    console.log(chalk.green('✓ Fichier .env.production trouvé.'));
  }
  
  // Vérifier les variables critiques
  const envContent = fs.readFileSync(config.envProdPath, 'utf8');
  const envLines = envContent.split('\n');
  const criticalVars = [
    'NODE_ENV', 'API_BASE_URL', 'CLIENT_BASE_URL', 'MONGODB_URI', 
    'REDIS_HOST', 'SESSION_SECRET', 'JWT_SECRET', 'CORS_ORIGIN'
  ];
  
  const missingVars = [];
  const placeholderVars = [];
  
  criticalVars.forEach(varName => {
    const varLine = envLines.find(line => line.startsWith(`${varName}=`));
    if (!varLine) {
      missingVars.push(varName);
    } else {
      const varValue = varLine.split('=')[1].trim();
      if (varValue.includes('votre_') || varValue.includes('your_') || varValue.includes('ChangeThis')) {
        placeholderVars.push(varName);
      }
    }
  });
  
  if (missingVars.length > 0) {
    console.log(chalk.red(`❌ Variables critiques manquantes: ${missingVars.join(', ')}`));
  }
  
  if (placeholderVars.length > 0) {
    console.log(chalk.yellow(`⚠️ Variables avec valeurs placeholder: ${placeholderVars.join(', ')}`));
    console.log(chalk.yellow('  Ces variables doivent être remplacées par des valeurs réelles avant le déploiement.'));
  }
  
  // Vérifier que NODE_ENV est bien "production"
  const nodeEnvLine = envLines.find(line => line.startsWith('NODE_ENV='));
  if (nodeEnvLine && !nodeEnvLine.includes('production')) {
    console.log(chalk.red('❌ NODE_ENV n\'est pas défini sur "production".'));
  }
  
  // Vérifier que les URLs utilisent HTTPS
  const urlVars = ['API_BASE_URL', 'CLIENT_BASE_URL', 'CORS_ORIGIN', 'STRAVA_REDIRECT_URI'];
  urlVars.forEach(varName => {
    const varLine = envLines.find(line => line.startsWith(`${varName}=`));
    if (varLine && !varLine.includes('https://')) {
      console.log(chalk.red(`❌ ${varName} n'utilise pas HTTPS. C'est obligatoire pour la production.`));
    }
  });
  
  // Écrire le rapport
  const report = {
    timestamp: new Date().toISOString(),
    envProduction: {
      exists: true,
      missingVars,
      placeholderVars,
      isProduction: nodeEnvLine && nodeEnvLine.includes('production'),
      usesHttps: urlVars.every(varName => {
        const varLine = envLines.find(line => line.startsWith(`${varName}=`));
        return !varLine || varLine.includes('https://');
      })
    }
  };
  
  fs.writeFileSync(
    path.join(config.outputDir, 'env-production-check.json'),
    JSON.stringify(report, null, 2)
  );
}

/**
 * Exécute l'audit des clés API
 */
async function auditApiKeys() {
  console.log(chalk.blue('\nAudit des clés API...'));
  
  try {
    // Utiliser le gestionnaire de clés API existant
    const apiKeysManager = new ApiKeysManager(config.envProdPath);
    const report = await apiKeysManager.generateApiKeysReport();
    
    // Afficher le résumé
    console.log(chalk.blue(`Services API totaux: ${report.summary.totalServices}`));
    console.log(chalk.green(`✓ Services valides: ${report.summary.validServices}`));
    console.log(chalk.red(`❌ Services invalides: ${report.summary.invalidServices}`));
    
    // Afficher les détails des services invalides
    if (report.summary.invalidServices > 0) {
      console.log(chalk.yellow('\nServices API invalides:'));
      Object.entries(report.services).forEach(([name, result]) => {
        if (!result.valid) {
          console.log(chalk.red(`  - ${name}: ${result.message}`));
        }
      });
    }
    
    // Écrire le rapport
    fs.writeFileSync(
      path.join(config.outputDir, 'api-keys-report.json'),
      JSON.stringify(report, null, 2)
    );
    
    // Exécuter également l'audit des clés API
    const auditResults = await apiKeysAudit.auditApiKeys();
    fs.writeFileSync(
      path.join(config.outputDir, 'api-keys-audit.json'),
      JSON.stringify(auditResults, null, 2)
    );
    
    return report;
  } catch (error) {
    console.error(chalk.red(`Erreur lors de l'audit des clés API: ${error.message}`));
    return null;
  }
}

/**
 * Vérifie les dépendances vulnérables
 */
async function checkVulnerableDependencies() {
  console.log(chalk.blue('\nVérification des dépendances vulnérables...'));
  
  try {
    // Créer un fichier temporaire pour stocker la sortie de npm audit
    const auditOutputPath = path.join(config.outputDir, 'npm-audit-output.txt');
    
    try {
      // Exécuter npm audit et capturer la sortie
      const auditOutput = execSync('npm audit --json', { 
        cwd: config.rootDir,
        encoding: 'utf8'
      });
      
      fs.writeFileSync(auditOutputPath, auditOutput);
      
      // Analyser la sortie JSON
      const auditResult = JSON.parse(auditOutput);
      const vulnerabilities = auditResult.vulnerabilities || {};
      const totalVulnerabilities = Object.values(vulnerabilities).reduce((sum, severity) => sum + severity.length, 0);
      
      if (totalVulnerabilities > 0) {
        console.log(chalk.red(`❌ ${totalVulnerabilities} vulnérabilités trouvées.`));
        
        // Afficher les vulnérabilités critiques et élevées
        const highVulnerabilities = vulnerabilities.high || [];
        const criticalVulnerabilities = vulnerabilities.critical || [];
        
        if (criticalVulnerabilities.length > 0) {
          console.log(chalk.red(`  - ${criticalVulnerabilities.length} vulnérabilités critiques`));
        }
        
        if (highVulnerabilities.length > 0) {
          console.log(chalk.red(`  - ${highVulnerabilities.length} vulnérabilités élevées`));
        }
        
        console.log(chalk.yellow('  Exécutez "npm audit fix" pour résoudre les problèmes automatiquement.'));
        console.log(chalk.yellow('  Pour les vulnérabilités qui ne peuvent pas être résolues automatiquement, consultez le rapport complet.'));
      } else {
        console.log(chalk.green('✓ Aucune vulnérabilité trouvée.'));
      }
      
      // Écrire le rapport
      fs.writeFileSync(
        path.join(config.outputDir, 'dependencies-audit.json'),
        JSON.stringify(auditResult, null, 2)
      );
    } catch (execError) {
      console.log(chalk.red(`❌ Erreur lors de l'exécution de npm audit: ${execError.message}`));
      if (execError.stdout) {
        fs.writeFileSync(auditOutputPath, execError.stdout.toString());
      }
    }
  } catch (error) {
    console.error(chalk.red(`Erreur lors de la vérification des dépendances: ${error.message}`));
  }
}

/**
 * Vérifie les services externes
 */
async function checkExternalServices() {
  console.log(chalk.blue('\nVérification des services externes...'));
  
  const services = [
    { name: 'MongoDB', url: process.env.MONGODB_URI, type: 'database' },
    { name: 'Redis', host: process.env.REDIS_HOST, port: process.env.REDIS_PORT, type: 'cache' },
    { name: 'API Météo', url: 'https://api.openweathermap.org', type: 'api' },
    { name: 'Strava API', url: 'https://www.strava.com/api/v3', type: 'api' },
    { name: 'Mapbox API', url: 'https://api.mapbox.com', type: 'api' },
    { name: 'OpenRouteService API', url: 'https://api.openrouteservice.org', type: 'api' }
  ];
  
  const results = [];
  
  for (const service of services) {
    console.log(chalk.blue(`Vérification de ${service.name}...`));
    
    try {
      let status = 'unknown';
      let message = '';
      
      if (service.type === 'api') {
        // Pour les API, on vérifie juste que l'URL est accessible
        const response = await fetch(service.url, { method: 'HEAD' }).catch(() => null);
        status = response && response.ok ? 'ok' : 'error';
        message = response ? `Statut: ${response.status}` : 'Non accessible';
      } else if (service.type === 'database') {
        // Pour les bases de données, on ne peut pas vraiment tester sans connexion
        status = 'warning';
        message = 'Vérifiez manuellement la connexion à la base de données';
      } else if (service.type === 'cache') {
        // Pour Redis, on ne peut pas vraiment tester sans connexion
        status = 'warning';
        message = 'Vérifiez manuellement la connexion au cache Redis';
      }
      
      results.push({
        name: service.name,
        type: service.type,
        status,
        message
      });
      
      if (status === 'ok') {
        console.log(chalk.green(`✓ ${service.name} accessible.`));
      } else if (status === 'warning') {
        console.log(chalk.yellow(`⚠️ ${service.name}: ${message}`));
      } else {
        console.log(chalk.red(`❌ ${service.name}: ${message}`));
      }
    } catch (error) {
      results.push({
        name: service.name,
        type: service.type,
        status: 'error',
        message: error.message
      });
      
      console.log(chalk.red(`❌ ${service.name}: ${error.message}`));
    }
  }
  
  // Écrire le rapport
  fs.writeFileSync(
    path.join(config.outputDir, 'external-services-check.json'),
    JSON.stringify(results, null, 2)
  );
}

/**
 * Génère le rapport final
 */
async function generateFinalReport() {
  console.log(chalk.blue('\nGénération du rapport final...'));
  
  // Lire tous les rapports individuels
  const envReport = JSON.parse(fs.readFileSync(path.join(config.outputDir, 'env-production-check.json'), 'utf8'));
  const apiKeysReport = JSON.parse(fs.readFileSync(path.join(config.outputDir, 'api-keys-report.json'), 'utf8'));
  let dependenciesReport = {};
  try {
    dependenciesReport = JSON.parse(fs.readFileSync(path.join(config.outputDir, 'dependencies-audit.json'), 'utf8'));
  } catch (error) {
    console.log(chalk.yellow('⚠️ Rapport d\'audit des dépendances non disponible.'));
  }
  const servicesReport = JSON.parse(fs.readFileSync(path.join(config.outputDir, 'external-services-check.json'), 'utf8'));
  
  // Générer le rapport HTML
  const htmlReport = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport de préparation au déploiement - Grand Est Cyclisme</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    h1, h2, h3 {
      color: #2c3e50;
    }
    h1 {
      border-bottom: 2px solid #ecf0f1;
      padding-bottom: 10px;
    }
    .section {
      margin-bottom: 30px;
      padding: 20px;
      border-radius: 5px;
      background-color: #f8f9fa;
      border-left: 5px solid #3498db;
    }
    .summary {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .summary-box {
      flex: 1;
      margin: 0 10px;
      padding: 15px;
      border-radius: 5px;
      text-align: center;
    }
    .success {
      background-color: #d5f5e3;
      color: #27ae60;
      border-left: 5px solid #27ae60;
    }
    .warning {
      background-color: #fef9e7;
      color: #f39c12;
      border-left: 5px solid #f39c12;
    }
    .error {
      background-color: #fadbd8;
      color: #c0392b;
      border-left: 5px solid #c0392b;
    }
    .info {
      background-color: #d6eaf8;
      color: #2980b9;
      border-left: 5px solid #2980b9;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #f2f2f2;
    }
    .status-ok {
      color: #27ae60;
      font-weight: bold;
    }
    .status-warning {
      color: #f39c12;
      font-weight: bold;
    }
    .status-error {
      color: #c0392b;
      font-weight: bold;
    }
    .recommendations {
      margin-top: 30px;
      padding: 20px;
      background-color: #eaf2f8;
      border-radius: 5px;
    }
    .timestamp {
      margin-top: 30px;
      color: #7f8c8d;
      font-size: 0.9em;
      text-align: center;
    }
  </style>
</head>
<body>
  <h1>Rapport de préparation au déploiement - Grand Est Cyclisme</h1>
  <p>Ce rapport présente l'état de préparation de l'application pour le déploiement sur Hostinger.</p>
  
  <div class="summary">
    <div class="summary-box ${envReport.envProduction.missingVars.length === 0 && envReport.envProduction.isProduction ? 'success' : 'error'}">
      <h3>Configuration</h3>
      <p>${envReport.envProduction.missingVars.length === 0 && envReport.envProduction.isProduction ? 'Prête' : 'À compléter'}</p>
    </div>
    <div class="summary-box ${apiKeysReport.summary.validServices === apiKeysReport.summary.totalServices ? 'success' : 'warning'}">
      <h3>Clés API</h3>
      <p>${apiKeysReport.summary.validServices}/${apiKeysReport.summary.totalServices} valides</p>
    </div>
    <div class="summary-box ${dependenciesReport.vulnerabilities ? 'warning' : 'success'}">
      <h3>Dépendances</h3>
      <p>${dependenciesReport.vulnerabilities ? 'Vulnérabilités détectées' : 'Sécurisées'}</p>
    </div>
    <div class="summary-box ${servicesReport.some(s => s.status === 'error') ? 'error' : servicesReport.some(s => s.status === 'warning') ? 'warning' : 'success'}">
      <h3>Services externes</h3>
      <p>${servicesReport.filter(s => s.status === 'ok').length}/${servicesReport.length} accessibles</p>
    </div>
  </div>
  
  <div class="section">
    <h2>1. Configuration de l'environnement</h2>
    
    <h3>Fichier .env.production</h3>
    <p>Statut: ${envReport.envProduction.exists ? '<span class="status-ok">Existe</span>' : '<span class="status-error">Manquant</span>'}</p>
    <p>NODE_ENV: ${envReport.envProduction.isProduction ? '<span class="status-ok">production</span>' : '<span class="status-error">non défini sur production</span>'}</p>
    <p>HTTPS: ${envReport.envProduction.usesHttps ? '<span class="status-ok">Configuré</span>' : '<span class="status-error">Non configuré</span>'}</p>
    
    ${envReport.envProduction.missingVars.length > 0 ? `
    <h4>Variables manquantes</h4>
    <ul>
      ${envReport.envProduction.missingVars.map(v => `<li class="status-error">${v}</li>`).join('')}
    </ul>
    ` : ''}
    
    ${envReport.envProduction.placeholderVars.length > 0 ? `
    <h4>Variables avec valeurs placeholder</h4>
    <ul>
      ${envReport.envProduction.placeholderVars.map(v => `<li class="status-warning">${v}</li>`).join('')}
    </ul>
    <p class="status-warning">Ces variables doivent être remplacées par des valeurs réelles avant le déploiement.</p>
    ` : ''}
  </div>
  
  <div class="section">
    <h2>2. Clés API</h2>
    
    <p>Services API totaux: ${apiKeysReport.summary.totalServices}</p>
    <p>Services valides: <span class="status-ok">${apiKeysReport.summary.validServices}</span></p>
    <p>Services invalides: <span class="${apiKeysReport.summary.invalidServices > 0 ? 'status-error' : 'status-ok'}">${apiKeysReport.summary.invalidServices}</span></p>
    
    <h3>État des services API</h3>
    <table>
      <thead>
        <tr>
          <th>Service</th>
          <th>Statut</th>
          <th>Message</th>
        </tr>
      </thead>
      <tbody>
        ${Object.entries(apiKeysReport.services).map(([name, result]) => `
        <tr>
          <td>${name}</td>
          <td class="${result.valid ? 'status-ok' : 'status-error'}">${result.valid ? 'Valide' : 'Invalide'}</td>
          <td>${result.message}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  
  <div class="section">
    <h2>3. Dépendances</h2>
    
    ${dependenciesReport.vulnerabilities ? `
    <p class="status-warning">Des vulnérabilités ont été détectées dans les dépendances.</p>
    
    <table>
      <thead>
        <tr>
          <th>Sévérité</th>
          <th>Nombre</th>
        </tr>
      </thead>
      <tbody>
        ${Object.entries(dependenciesReport.vulnerabilities).map(([severity, vulns]) => `
        <tr>
          <td class="status-${severity === 'critical' || severity === 'high' ? 'error' : severity === 'moderate' ? 'warning' : 'ok'}">${severity}</td>
          <td>${vulns.length}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    
    <p>Exécutez <code>npm audit fix</code> pour résoudre les problèmes automatiquement.</p>
    ` : `
    <p class="status-ok">Aucune vulnérabilité détectée dans les dépendances.</p>
    `}
  </div>
  
  <div class="section">
    <h2>4. Services externes</h2>
    
    <table>
      <thead>
        <tr>
          <th>Service</th>
          <th>Type</th>
          <th>Statut</th>
          <th>Message</th>
        </tr>
      </thead>
      <tbody>
        ${servicesReport.map(service => `
        <tr>
          <td>${service.name}</td>
          <td>${service.type}</td>
          <td class="status-${service.status === 'ok' ? 'ok' : service.status === 'warning' ? 'warning' : 'error'}">${service.status}</td>
          <td>${service.message}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  
  <div class="recommendations">
    <h2>Recommandations avant déploiement</h2>
    
    <ol>
      ${envReport.envProduction.missingVars.length > 0 ? `
      <li>Complétez les variables d'environnement manquantes: ${envReport.envProduction.missingVars.join(', ')}</li>
      ` : ''}
      
      ${envReport.envProduction.placeholderVars.length > 0 ? `
      <li>Remplacez les valeurs placeholder par des valeurs réelles: ${envReport.envProduction.placeholderVars.join(', ')}</li>
      ` : ''}
      
      ${apiKeysReport.summary.invalidServices > 0 ? `
      <li>Corrigez les clés API invalides pour les services: ${Object.entries(apiKeysReport.services)
        .filter(([_, result]) => !result.valid)
        .map(([name, _]) => name)
        .join(', ')}</li>
      ` : ''}
      
      ${dependenciesReport.vulnerabilities ? `
      <li>Résolvez les vulnérabilités dans les dépendances avec <code>npm audit fix</code></li>
      ` : ''}
      
      ${servicesReport.some(s => s.status === 'error') ? `
      <li>Vérifiez l'accès aux services externes: ${servicesReport
        .filter(s => s.status === 'error')
        .map(s => s.name)
        .join(', ')}</li>
      ` : ''}
      
      <li>Configurez le monitoring des quotas API avec api-quota-monitor.js</li>
      <li>Mettez en place la rotation automatique des clés API pour les services qui le supportent</li>
      <li>Vérifiez les permissions des fichiers sur le serveur (755 pour les dossiers, 644 pour les fichiers)</li>
      <li>Testez le mécanisme de rollback automatique en cas d'échec du déploiement</li>
    </ol>
  </div>
  
  <div class="timestamp">
    Rapport généré le ${new Date().toLocaleString('fr-FR')}
  </div>
</body>
</html>
  `;
  
  // Écrire le rapport HTML
  fs.writeFileSync(
    path.join(config.outputDir, 'deployment-preparation-report.html'),
    htmlReport
  );
  
  console.log(chalk.green(`✓ Rapport final généré: ${path.join(config.outputDir, 'deployment-preparation-report.html')}`));
}

// Exécuter la fonction principale
main().catch(error => {
  console.error(chalk.red(`Erreur non gérée: ${error.message}`));
  process.exit(1);
});
