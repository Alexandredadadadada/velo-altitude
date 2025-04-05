/**
 * Script d'audit de sécurité pour le code source
 * Analyse l'ensemble du code pour détecter les vulnérabilités potentielles
 * avant le déploiement final
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const chalk = require('chalk');
const glob = promisify(require('glob'));
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

// Configuration
const config = {
  // Répertoires à analyser
  directories: [
    path.join(__dirname, '..', 'server'),
    path.join(__dirname, '..', 'client', 'src')
  ],
  // Extensions de fichiers à analyser
  extensions: ['.js', '.jsx', '.ts', '.tsx'],
  // Fichiers à exclure
  excludes: [
    'node_modules',
    'dist',
    'build',
    '.git',
    'coverage',
    'test',
    'tests',
    '__tests__',
    '__mocks__'
  ],
  // Motifs de vulnérabilités à rechercher
  patterns: {
    // Secrets hardcodés
    hardcodedSecrets: {
      regex: [
        /['"](?:api[_-]?key|auth[_-]?token|password|secret|credential)['"]\s*:\s*['"]([^'"]{8,})['"](?!.*process\.env)/gi,
        /const\s+(?:api[_-]?key|auth[_-]?token|password|secret|credential)\s*=\s*['"]([^'"]{8,})['"](?!.*process\.env)/gi,
        /(?:api[_-]?key|auth[_-]?token|password|secret|credential)\s*=\s*['"]([^'"]{8,})['"](?!.*process\.env)/gi
      ],
      severity: 'high',
      message: 'Secret hardcodé détecté. Utilisez des variables d\'environnement à la place.'
    },
    // Injection SQL
    sqlInjection: {
      regex: [
        /(?:db|database|connection)\.query\(\s*[`'"].*\$\{.*\}.*[`'"](?!\s*,\s*\[)/gi,
        /(?:db|database|connection)\.query\(\s*(?:req|request)\.(?:body|query|params)/gi
      ],
      severity: 'critical',
      message: 'Vulnérabilité d\'injection SQL potentielle. Utilisez des requêtes paramétrées.'
    },
    // Injection NoSQL
    noSqlInjection: {
      regex: [
        /(?:find|findOne|update|delete)\(\s*\{\s*[`'"].*\$\{.*\}.*[`'"]/gi,
        /(?:find|findOne|update|delete)\(\s*(?:req|request)\.(?:body|query|params)/gi
      ],
      severity: 'critical',
      message: 'Vulnérabilité d\'injection NoSQL potentielle. Validez les entrées utilisateur.'
    },
    // XSS
    xss: {
      regex: [
        /(?:innerHTML|outerHTML)\s*=\s*(?!.*DOMPurify)/gi,
        /document\.write\(/gi,
        /eval\(/gi,
        /dangerouslySetInnerHTML/gi
      ],
      severity: 'high',
      message: 'Vulnérabilité XSS potentielle. Utilisez des méthodes sécurisées pour manipuler le DOM.'
    },
    // Expressions régulières dangereuses
    dangerousRegex: {
      regex: [
        /(?:\.|\[['"])match\(['"](\.\*|\\\w\+\*|\(\.\*\)\*|\[\^\\w\]\*)/gi,
        /(?:\.|\[['"])test\(['"](\.\*|\\\w\+\*|\(\.\*\)\*|\[\^\\w\]\*)/gi,
        /new RegExp\(['"](\.\*|\\\w\+\*|\(\.\*\)\*|\[\^\\w\]\*)/gi
      ],
      severity: 'medium',
      message: 'Expression régulière potentiellement vulnérable aux attaques ReDoS.'
    },
    // Path traversal
    pathTraversal: {
      regex: [
        /(?:fs|require\(['"]fs['"]\))\.(?:readFile|writeFile|readFileSync|writeFileSync|createReadStream|createWriteStream)\(\s*(?:req|request)\.(?:body|query|params)/gi,
        /(?:path|require\(['"]path['"]\))\.(?:join|resolve)\(\s*(?:__dirname|__filename)(?:.*,\s*(?:req|request)\.(?:body|query|params))/gi
      ],
      severity: 'high',
      message: 'Vulnérabilité de traversée de chemin potentielle. Validez les entrées utilisateur.'
    },
    // Commandes OS
    commandInjection: {
      regex: [
        /(?:exec|spawn|execSync)\(\s*(?:req|request)\.(?:body|query|params)/gi,
        /(?:exec|spawn|execSync)\(\s*[`'"].*\$\{.*\}.*[`'"]/gi
      ],
      severity: 'critical',
      message: 'Vulnérabilité d\'injection de commande potentielle. Validez les entrées utilisateur.'
    },
    // Désérialisation non sécurisée
    unsafeDeserialization: {
      regex: [
        /JSON\.parse\(\s*(?:req|request)\.(?:body|query|params)/gi,
        /(?:unserialize|deserialize)\(\s*(?:req|request)\.(?:body|query|params)/gi
      ],
      severity: 'medium',
      message: 'Désérialisation non sécurisée potentielle. Validez les entrées utilisateur.'
    },
    // Mauvaise configuration CORS
    insecureCors: {
      regex: [
        /cors\(\s*\{\s*origin\s*:\s*(?:['"](?:\*|null)['"]\s*|true)/gi,
        /(?:res|response)\.header\(\s*['"]Access-Control-Allow-Origin['"],\s*['"](?:\*|null)['"]\)/gi
      ],
      severity: 'medium',
      message: 'Configuration CORS potentiellement non sécurisée. Limitez les origines autorisées.'
    },
    // Mauvaise configuration des cookies
    insecureCookies: {
      regex: [
        /(?:cookie|cookies)\.(?:set|create)\(\s*['"].*['"],\s*['"].*['"],\s*\{\s*(?!.*secure)(?!.*httpOnly)/gi,
        /(?:res|response)\.cookie\(\s*['"].*['"],\s*['"].*['"],\s*\{\s*(?!.*secure)(?!.*httpOnly)/gi
      ],
      severity: 'medium',
      message: 'Configuration de cookie potentiellement non sécurisée. Utilisez les options secure et httpOnly.'
    },
    // Utilisation de fonctions dépréciées ou non sécurisées
    deprecatedFunctions: {
      regex: [
        /(?:md5|sha1)\(/gi,
        /createCipher\(/gi,
        /(?:\.|\[['"])substr\(/gi
      ],
      severity: 'low',
      message: 'Utilisation de fonctions dépréciées ou non sécurisées.'
    }
  },
  // Chemin vers le rapport d'audit
  reportPath: path.join(__dirname, '..', 'security-audit-report.html')
};

// Variables pour le rapport
const vulnerabilities = [];
let filesAnalyzed = 0;
let totalLinesAnalyzed = 0;

/**
 * Trouve tous les fichiers à analyser
 * @returns {Array} - Liste des chemins de fichiers
 */
async function findFilesToAnalyze() {
  const allFiles = [];
  
  for (const directory of config.directories) {
    if (!fs.existsSync(directory)) {
      console.log(chalk.yellow(`Le répertoire ${directory} n'existe pas, il sera ignoré.`));
      continue;
    }
    
    const pattern = path.join(directory, '**', `*+(${config.extensions.join('|')})`);
    const files = await glob(pattern, { 
      nodir: true,
      ignore: config.excludes.map(exclude => `**/${exclude}/**`)
    });
    
    allFiles.push(...files);
  }
  
  return allFiles;
}

/**
 * Analyse un fichier pour détecter les vulnérabilités
 * @param {String} filePath - Chemin du fichier à analyser
 */
async function analyzeFile(filePath) {
  try {
    const content = await readFileAsync(filePath, 'utf8');
    const lines = content.split('\n');
    totalLinesAnalyzed += lines.length;
    
    // Analyser chaque type de vulnérabilité
    Object.entries(config.patterns).forEach(([type, pattern]) => {
      pattern.regex.forEach(regex => {
        let match;
        // Réinitialiser le regex pour chaque fichier
        regex.lastIndex = 0;
        
        // Rechercher toutes les occurrences
        while ((match = regex.exec(content)) !== null) {
          // Trouver le numéro de ligne
          const lineIndex = content.substring(0, match.index).split('\n').length - 1;
          const line = lines[lineIndex];
          
          vulnerabilities.push({
            type,
            severity: pattern.severity,
            message: pattern.message,
            file: path.relative(path.join(__dirname, '..'), filePath),
            line: lineIndex + 1,
            lineContent: line.trim(),
            match: match[0]
          });
        }
      });
    });
    
    filesAnalyzed++;
  } catch (error) {
    console.error(chalk.red(`Erreur lors de l'analyse du fichier ${filePath}: ${error.message}`));
  }
}

/**
 * Génère un rapport HTML des vulnérabilités détectées
 * @returns {String} - Rapport HTML
 */
function generateHtmlReport() {
  // Trier les vulnérabilités par sévérité
  const sortedVulnerabilities = [...vulnerabilities].sort((a, b) => {
    const severityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
  
  // Compter les vulnérabilités par sévérité
  const severityCounts = {
    critical: sortedVulnerabilities.filter(v => v.severity === 'critical').length,
    high: sortedVulnerabilities.filter(v => v.severity === 'high').length,
    medium: sortedVulnerabilities.filter(v => v.severity === 'medium').length,
    low: sortedVulnerabilities.filter(v => v.severity === 'low').length
  };
  
  // Générer les lignes du tableau
  const vulnerabilityRows = sortedVulnerabilities.map(v => {
    const severityClass = v.severity === 'critical' ? 'critical' : 
                          v.severity === 'high' ? 'high' : 
                          v.severity === 'medium' ? 'medium' : 'low';
    
    return `
      <tr>
        <td><span class="severity ${severityClass}">${v.severity}</span></td>
        <td>${v.type}</td>
        <td>${v.message}</td>
        <td>${v.file}</td>
        <td>${v.line}</td>
        <td><code>${escapeHtml(v.lineContent)}</code></td>
      </tr>
    `;
  }).join('');
  
  // Générer le rapport HTML
  const htmlReport = `
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
    h1, h2 {
      color: #2c3e50;
      border-bottom: 2px solid #ecf0f1;
      padding-bottom: 10px;
    }
    .summary {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
    }
    .summary-box {
      flex: 1;
      margin: 0 10px;
      padding: 15px;
      border-radius: 5px;
      text-align: center;
    }
    .critical {
      background-color: #fadbd8;
      color: #c0392b;
    }
    .high {
      background-color: #f9e79f;
      color: #d35400;
    }
    .medium {
      background-color: #d6eaf8;
      color: #2980b9;
    }
    .low {
      background-color: #d5f5e3;
      color: #27ae60;
    }
    .count {
      font-size: 2em;
      font-weight: bold;
      margin: 10px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 0.9em;
    }
    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #f8f9fa;
      font-weight: bold;
    }
    tr:hover {
      background-color: #f5f5f5;
    }
    .severity {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 3px;
      font-weight: bold;
      text-transform: uppercase;
      font-size: 0.8em;
    }
    code {
      font-family: Consolas, Monaco, 'Andale Mono', monospace;
      background-color: #f8f9fa;
      padding: 2px 5px;
      border-radius: 3px;
      font-size: 0.9em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 400px;
      display: block;
    }
    .stats {
      margin: 20px 0;
      padding: 15px;
      background-color: #f8f9fa;
      border-radius: 5px;
    }
    .timestamp {
      margin-top: 30px;
      color: #7f8c8d;
      font-size: 0.9em;
      text-align: center;
    }
    .no-vulnerabilities {
      padding: 20px;
      text-align: center;
      background-color: #d5f5e3;
      color: #27ae60;
      border-radius: 5px;
      font-weight: bold;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <h1>Rapport d'audit de sécurité - Grand Est Cyclisme</h1>
  
  <div class="stats">
    <strong>Statistiques:</strong> ${filesAnalyzed} fichiers analysés, ${totalLinesAnalyzed} lignes de code, ${vulnerabilities.length} vulnérabilités potentielles détectées.
  </div>
  
  <div class="summary">
    <div class="summary-box critical">
      <div>Critiques</div>
      <div class="count">${severityCounts.critical}</div>
    </div>
    <div class="summary-box high">
      <div>Élevées</div>
      <div class="count">${severityCounts.high}</div>
    </div>
    <div class="summary-box medium">
      <div>Moyennes</div>
      <div class="count">${severityCounts.medium}</div>
    </div>
    <div class="summary-box low">
      <div>Faibles</div>
      <div class="count">${severityCounts.low}</div>
    </div>
  </div>
  
  <h2>Vulnérabilités détectées</h2>
  
  ${vulnerabilities.length === 0 ? 
    '<div class="no-vulnerabilities">Aucune vulnérabilité potentielle n\'a été détectée. Excellent travail !</div>' :
    `<table>
      <thead>
        <tr>
          <th>Sévérité</th>
          <th>Type</th>
          <th>Message</th>
          <th>Fichier</th>
          <th>Ligne</th>
          <th>Contenu</th>
        </tr>
      </thead>
      <tbody>
        ${vulnerabilityRows}
      </tbody>
    </table>`
  }
  
  <h2>Recommandations</h2>
  <ul>
    <li>Corrigez toutes les vulnérabilités critiques et élevées avant le déploiement.</li>
    <li>Planifiez la correction des vulnérabilités moyennes dans les prochaines itérations.</li>
    <li>Examinez les vulnérabilités de faible sévérité lors des revues de code régulières.</li>
    <li>Envisagez d'ajouter des tests de sécurité automatisés à votre pipeline CI/CD.</li>
    <li>Effectuez des audits de sécurité réguliers, idéalement avant chaque déploiement majeur.</li>
  </ul>
  
  <div class="timestamp">
    Rapport généré le ${new Date().toLocaleString('fr-FR')}
  </div>
</body>
</html>
  `;
  
  return htmlReport;
}

/**
 * Échappe les caractères HTML
 * @param {String} text - Texte à échapper
 * @returns {String} - Texte échappé
 */
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Affiche les résultats de l'audit
 */
function displayResults() {
  console.log(chalk.bold('\n=== Résultats de l\'audit de sécurité ===\n'));
  
  // Compter les vulnérabilités par sévérité
  const critical = vulnerabilities.filter(v => v.severity === 'critical').length;
  const high = vulnerabilities.filter(v => v.severity === 'high').length;
  const medium = vulnerabilities.filter(v => v.severity === 'medium').length;
  const low = vulnerabilities.filter(v => v.severity === 'low').length;
  
  // Afficher les statistiques
  console.log(`Fichiers analysés: ${filesAnalyzed}`);
  console.log(`Lignes de code analysées: ${totalLinesAnalyzed}`);
  console.log(`Vulnérabilités potentielles détectées: ${vulnerabilities.length}`);
  console.log('');
  
  // Afficher le résumé par sévérité
  console.log(chalk.red.bold(`Critiques: ${critical}`));
  console.log(chalk.yellow.bold(`Élevées: ${high}`));
  console.log(chalk.blue.bold(`Moyennes: ${medium}`));
  console.log(chalk.green.bold(`Faibles: ${low}`));
  console.log('');
  
  // Afficher les vulnérabilités critiques et élevées
  if (critical > 0 || high > 0) {
    console.log(chalk.bold('Vulnérabilités critiques et élevées:'));
    
    vulnerabilities
      .filter(v => v.severity === 'critical' || v.severity === 'high')
      .forEach(v => {
        const severityColor = v.severity === 'critical' ? chalk.red : chalk.yellow;
        console.log(severityColor(`[${v.severity.toUpperCase()}] ${v.type}: ${v.file}:${v.line}`));
        console.log(`  ${v.message}`);
        console.log(`  ${chalk.gray(v.lineContent)}`);
        console.log('');
      });
  }
  
  // Afficher le résultat global
  if (vulnerabilities.length === 0) {
    console.log(chalk.green.bold('✓ Aucune vulnérabilité potentielle n\'a été détectée. Excellent travail !'));
  } else if (critical === 0 && high === 0) {
    console.log(chalk.yellow.bold('⚠ Des vulnérabilités de sévérité moyenne et faible ont été détectées.'));
    console.log(chalk.yellow('  Examinez le rapport complet et planifiez leur correction.'));
  } else {
    console.log(chalk.red.bold('✗ Des vulnérabilités critiques et/ou élevées ont été détectées.'));
    console.log(chalk.red('  Corrigez ces vulnérabilités avant le déploiement.'));
  }
  
  console.log(chalk.blue(`\nRapport HTML généré: ${config.reportPath}`));
}

/**
 * Fonction principale
 */
async function main() {
  console.log(chalk.blue.bold('Audit de sécurité du code source en cours...'));
  
  try {
    // Trouver tous les fichiers à analyser
    const files = await findFilesToAnalyze();
    console.log(chalk.blue(`Analyse de ${files.length} fichiers...`));
    
    // Analyser chaque fichier
    for (const file of files) {
      await analyzeFile(file);
      // Afficher la progression
      if (filesAnalyzed % 10 === 0 || filesAnalyzed === files.length) {
        process.stdout.write(`\rFichiers analysés: ${filesAnalyzed}/${files.length}`);
      }
    }
    
    console.log('\n');
    
    // Générer le rapport HTML
    const htmlReport = generateHtmlReport();
    await writeFileAsync(config.reportPath, htmlReport);
    
    // Afficher les résultats
    displayResults();
  } catch (error) {
    console.error(chalk.red(`Erreur lors de l'audit de sécurité: ${error.message}`));
    process.exit(1);
  }
}

// Exécuter la fonction principale
main().catch(error => {
  console.error(chalk.red(`Erreur non gérée: ${error.message}`));
  process.exit(1);
});
