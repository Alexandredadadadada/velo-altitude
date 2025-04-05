/**
 * Script d'exécution de l'audit de sécurité
 * Exécute l'audit de sécurité et génère un rapport
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

// Importer le script d'audit de sécurité
const securityAudit = require('./security-audit');
const apiKeysAudit = require('../server/utils/api-keys-audit');
const ApiKeysManager = require('../server/utils/api-keys-manager');

// Configuration
const config = {
  rootDir: path.resolve(__dirname, '..'),
  outputDir: path.resolve(__dirname, '..', 'security-reports')
};

// Créer le répertoire de sortie s'il n'existe pas
if (!fs.existsSync(config.outputDir)) {
  fs.mkdirSync(config.outputDir, { recursive: true });
}

/**
 * Fonction principale
 */
async function main() {
  console.log(chalk.blue.bold('=== Exécution de l\'audit de sécurité ===\n'));
  
  // Étape 1: Exécuter l'audit de sécurité du code
  await runCodeSecurityAudit();
  
  // Étape 2: Exécuter l'audit des clés API
  await runApiKeysAudit();
  
  // Étape 3: Vérifier les dépendances vulnérables
  await checkVulnerableDependencies();
  
  // Étape 4: Générer le rapport final
  await generateFinalReport();
  
  console.log(chalk.green.bold('\n✓ Audit de sécurité terminé.'));
  console.log(chalk.blue(`  Rapport disponible dans: ${config.outputDir}`));
}

/**
 * Exécute l'audit de sécurité du code
 */
async function runCodeSecurityAudit() {
  console.log(chalk.blue('Exécution de l\'audit de sécurité du code...'));
  
  try {
    const results = await securityAudit.runAudit(config.rootDir);
    
    // Afficher le résumé
    const totalIssues = Object.values(results.summary).reduce((sum, count) => sum + count, 0);
    console.log(chalk.blue(`Issues de sécurité totales: ${totalIssues}`));
    
    if (results.summary.critical > 0) {
      console.log(chalk.red(`❌ Issues critiques: ${results.summary.critical}`));
    }
    
    if (results.summary.high > 0) {
      console.log(chalk.red(`❌ Issues élevées: ${results.summary.high}`));
    }
    
    if (results.summary.medium > 0) {
      console.log(chalk.yellow(`⚠️ Issues moyennes: ${results.summary.medium}`));
    }
    
    if (results.summary.low > 0) {
      console.log(chalk.blue(`ℹ️ Issues faibles: ${results.summary.low}`));
    }
    
    // Écrire le rapport
    fs.writeFileSync(
      path.join(config.outputDir, 'code-security-audit.json'),
      JSON.stringify(results, null, 2)
    );
    
    return results;
  } catch (error) {
    console.error(chalk.red(`Erreur lors de l'audit de sécurité: ${error.message}`));
    return null;
  }
}

/**
 * Exécute l'audit des clés API
 */
async function runApiKeysAudit() {
  console.log(chalk.blue('\nExécution de l\'audit des clés API...'));
  
  try {
    // Utiliser l'auditeur de clés API existant
    const auditResults = await apiKeysAudit.auditApiKeys();
    
    // Afficher le résumé
    console.log(chalk.blue(`Services API totaux: ${auditResults.totalServices}`));
    console.log(chalk.green(`✓ Services valides: ${auditResults.validServices.length}`));
    console.log(chalk.red(`❌ Services invalides: ${auditResults.invalidServices.length}`));
    console.log(chalk.yellow(`⚠️ Services manquants: ${auditResults.missingServices.length}`));
    
    // Afficher les détails des services invalides
    if (auditResults.invalidServices.length > 0) {
      console.log(chalk.yellow('\nServices API invalides:'));
      auditResults.invalidServices.forEach(service => {
        console.log(chalk.red(`  - ${service.name}: ${service.reason}`));
      });
    }
    
    // Afficher les détails des services manquants
    if (auditResults.missingServices.length > 0) {
      console.log(chalk.yellow('\nServices API manquants:'));
      auditResults.missingServices.forEach(service => {
        console.log(chalk.yellow(`  - ${service}`));
      });
    }
    
    // Écrire le rapport
    fs.writeFileSync(
      path.join(config.outputDir, 'api-keys-audit.json'),
      JSON.stringify(auditResults, null, 2)
    );
    
    // Vérifier également la validité des clés API
    const apiKeysManager = new ApiKeysManager(path.resolve(config.rootDir, '.env.production'));
    const validationResults = await apiKeysManager.validateKeys();
    
    fs.writeFileSync(
      path.join(config.outputDir, 'api-keys-validation.json'),
      JSON.stringify(validationResults, null, 2)
    );
    
    return auditResults;
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
      } else {
        console.log(chalk.green('✓ Aucune vulnérabilité trouvée.'));
      }
      
      // Écrire le rapport
      fs.writeFileSync(
        path.join(config.outputDir, 'dependencies-audit.json'),
        JSON.stringify(auditResult, null, 2)
      );
      
      return auditResult;
    } catch (execError) {
      console.log(chalk.red(`❌ Erreur lors de l'exécution de npm audit: ${execError.message}`));
      if (execError.stdout) {
        fs.writeFileSync(auditOutputPath, execError.stdout.toString());
      }
      return null;
    }
  } catch (error) {
    console.error(chalk.red(`Erreur lors de la vérification des dépendances: ${error.message}`));
    return null;
  }
}

/**
 * Génère le rapport final
 */
async function generateFinalReport() {
  console.log(chalk.blue('\nGénération du rapport final...'));
  
  // Lire tous les rapports individuels
  let codeAuditReport = {};
  let apiKeysAuditReport = {};
  let dependenciesReport = {};
  
  try {
    codeAuditReport = JSON.parse(fs.readFileSync(path.join(config.outputDir, 'code-security-audit.json'), 'utf8'));
  } catch (error) {
    console.log(chalk.yellow('⚠️ Rapport d\'audit de code non disponible.'));
  }
  
  try {
    apiKeysAuditReport = JSON.parse(fs.readFileSync(path.join(config.outputDir, 'api-keys-audit.json'), 'utf8'));
  } catch (error) {
    console.log(chalk.yellow('⚠️ Rapport d\'audit des clés API non disponible.'));
  }
  
  try {
    dependenciesReport = JSON.parse(fs.readFileSync(path.join(config.outputDir, 'dependencies-audit.json'), 'utf8'));
  } catch (error) {
    console.log(chalk.yellow('⚠️ Rapport d\'audit des dépendances non disponible.'));
  }
  
  // Générer le rapport HTML
  const htmlReport = generateHtmlReport(codeAuditReport, apiKeysAuditReport, dependenciesReport);
  
  // Écrire le rapport HTML
  fs.writeFileSync(
    path.join(config.outputDir, 'security-audit-report.html'),
    htmlReport
  );
  
  console.log(chalk.green(`✓ Rapport final généré: ${path.join(config.outputDir, 'security-audit-report.html')}`));
}

/**
 * Génère le rapport HTML
 */
function generateHtmlReport(codeAuditReport, apiKeysAuditReport, dependenciesReport) {
  const totalCodeIssues = codeAuditReport.summary 
    ? Object.values(codeAuditReport.summary).reduce((sum, count) => sum + count, 0)
    : 0;
  
  const totalApiIssues = apiKeysAuditReport.invalidServices 
    ? apiKeysAuditReport.invalidServices.length + apiKeysAuditReport.missingServices.length
    : 0;
  
  const totalDependencyIssues = dependenciesReport.vulnerabilities 
    ? Object.values(dependenciesReport.vulnerabilities).reduce((sum, severity) => sum + severity.length, 0)
    : 0;
  
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport d'audit de sécurité - Grand Est Cyclisme</title>
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
    .status-critical {
      color: #c0392b;
      font-weight: bold;
    }
    .status-high {
      color: #e74c3c;
      font-weight: bold;
    }
    .status-medium {
      color: #f39c12;
      font-weight: bold;
    }
    .status-low {
      color: #3498db;
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
  <h1>Rapport d'audit de sécurité - Grand Est Cyclisme</h1>
  <p>Ce rapport présente les résultats de l'audit de sécurité de l'application Grand Est Cyclisme.</p>
  
  <div class="summary">
    <div class="summary-box ${totalCodeIssues === 0 ? 'success' : totalCodeIssues > 5 ? 'error' : 'warning'}">
      <h3>Sécurité du code</h3>
      <p>${totalCodeIssues} problèmes</p>
    </div>
    <div class="summary-box ${totalApiIssues === 0 ? 'success' : totalApiIssues > 3 ? 'error' : 'warning'}">
      <h3>Clés API</h3>
      <p>${totalApiIssues} problèmes</p>
    </div>
    <div class="summary-box ${totalDependencyIssues === 0 ? 'success' : totalDependencyIssues > 10 ? 'error' : 'warning'}">
      <h3>Dépendances</h3>
      <p>${totalDependencyIssues} vulnérabilités</p>
    </div>
  </div>
  
  <div class="section">
    <h2>1. Audit de sécurité du code</h2>
    
    ${codeAuditReport.summary ? `
    <p>Résumé des problèmes de sécurité détectés dans le code :</p>
    <ul>
      <li class="status-critical">Problèmes critiques : ${codeAuditReport.summary.critical}</li>
      <li class="status-high">Problèmes élevés : ${codeAuditReport.summary.high}</li>
      <li class="status-medium">Problèmes moyens : ${codeAuditReport.summary.medium}</li>
      <li class="status-low">Problèmes faibles : ${codeAuditReport.summary.low}</li>
    </ul>
    
    ${codeAuditReport.issues && codeAuditReport.issues.length > 0 ? `
    <h3>Détails des problèmes</h3>
    <table>
      <thead>
        <tr>
          <th>Sévérité</th>
          <th>Type</th>
          <th>Fichier</th>
          <th>Ligne</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        ${codeAuditReport.issues.map(issue => `
        <tr>
          <td class="status-${issue.severity}">${issue.severity}</td>
          <td>${issue.type}</td>
          <td>${issue.file}</td>
          <td>${issue.line}</td>
          <td>${issue.description}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    ` : '<p>Aucun problème spécifique détecté.</p>'}
    ` : '<p>Rapport d\'audit de code non disponible.</p>'}
  </div>
  
  <div class="section">
    <h2>2. Audit des clés API</h2>
    
    ${apiKeysAuditReport.totalServices ? `
    <p>Services API totaux : ${apiKeysAuditReport.totalServices}</p>
    <p>Services valides : ${apiKeysAuditReport.validServices.length}</p>
    <p>Services invalides : ${apiKeysAuditReport.invalidServices.length}</p>
    <p>Services manquants : ${apiKeysAuditReport.missingServices.length}</p>
    
    ${apiKeysAuditReport.invalidServices && apiKeysAuditReport.invalidServices.length > 0 ? `
    <h3>Services API invalides</h3>
    <table>
      <thead>
        <tr>
          <th>Service</th>
          <th>Raison</th>
        </tr>
      </thead>
      <tbody>
        ${apiKeysAuditReport.invalidServices.map(service => `
        <tr>
          <td>${service.name}</td>
          <td>${service.reason}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    ` : ''}
    
    ${apiKeysAuditReport.missingServices && apiKeysAuditReport.missingServices.length > 0 ? `
    <h3>Services API manquants</h3>
    <ul>
      ${apiKeysAuditReport.missingServices.map(service => `<li>${service}</li>`).join('')}
    </ul>
    ` : ''}
    ` : '<p>Rapport d\'audit des clés API non disponible.</p>'}
  </div>
  
  <div class="section">
    <h2>3. Audit des dépendances</h2>
    
    ${dependenciesReport.vulnerabilities ? `
    <p>Vulnérabilités détectées dans les dépendances :</p>
    
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
          <td class="status-${severity === 'critical' ? 'critical' : severity === 'high' ? 'high' : severity === 'moderate' ? 'medium' : 'low'}">${severity}</td>
          <td>${Array.isArray(vulns) ? vulns.length : 0}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    
    <p>Exécutez <code>npm audit fix</code> pour résoudre les problèmes automatiquement.</p>
    ` : '<p>Rapport d\'audit des dépendances non disponible.</p>'}
  </div>
  
  <div class="recommendations">
    <h2>Recommandations de sécurité</h2>
    
    <ol>
      ${codeAuditReport.summary && codeAuditReport.summary.critical > 0 ? `
      <li class="status-critical">Résoudre immédiatement les ${codeAuditReport.summary.critical} problèmes critiques détectés dans le code.</li>
      ` : ''}
      
      ${codeAuditReport.summary && codeAuditReport.summary.high > 0 ? `
      <li class="status-high">Corriger les ${codeAuditReport.summary.high} problèmes de sécurité élevés avant le déploiement.</li>
      ` : ''}
      
      ${apiKeysAuditReport.invalidServices && apiKeysAuditReport.invalidServices.length > 0 ? `
      <li class="status-high">Corriger les ${apiKeysAuditReport.invalidServices.length} services API invalides.</li>
      ` : ''}
      
      ${apiKeysAuditReport.missingServices && apiKeysAuditReport.missingServices.length > 0 ? `
      <li class="status-medium">Configurer les ${apiKeysAuditReport.missingServices.length} services API manquants.</li>
      ` : ''}
      
      ${dependenciesReport.vulnerabilities && (dependenciesReport.vulnerabilities.critical || dependenciesReport.vulnerabilities.high) ? `
      <li class="status-high">Exécuter <code>npm audit fix</code> pour résoudre les vulnérabilités critiques et élevées dans les dépendances.</li>
      ` : ''}
      
      <li>Mettre en place une rotation régulière des clés API pour les services qui le supportent.</li>
      <li>Configurer le monitoring des quotas API avec api-quota-monitor.js.</li>
      <li>Vérifier que toutes les entrées utilisateur sont correctement validées et échappées.</li>
      <li>S'assurer que les en-têtes de sécurité HTTP sont correctement configurés (CSP, X-XSS-Protection, etc.).</li>
      <li>Activer HTTPS pour toutes les communications.</li>
    </ol>
  </div>
  
  <div class="timestamp">
    Rapport généré le ${new Date().toLocaleString('fr-FR')}
  </div>
</body>
</html>
  `;
}

// Exécuter la fonction principale
main().catch(error => {
  console.error(chalk.red(`Erreur non gérée: ${error.message}`));
  process.exit(1);
});
