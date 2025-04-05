/**
 * Utilitaire d'analyse de code pour détecter les dettes techniques
 * Implémente les recommandations de l'Agent 3 (Assurance Qualité & Intégration)
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const projectRoot = path.resolve(__dirname, '../..');
const excludeDirs = ['node_modules', 'dist', 'build', '.git'];
const fileExtensions = ['.js', '.jsx', '.ts', '.tsx'];

/**
 * Analyse le projet pour détecter les dettes techniques
 * @returns {Object} Rapport d'analyse
 */
function analyzeProject() {
  console.log('Analyzing project for technical debt...');
  
  // Exécuter ESLint
  let eslintIssues = [];
  try {
    console.log('Running ESLint...');
    const eslintOutput = execSync('npx eslint --ext .js,.jsx,.ts,.tsx src', { 
      cwd: projectRoot,
      encoding: 'utf8'
    });
    console.log('ESLint completed successfully');
  } catch (error) {
    console.log('ESLint found issues:');
    console.log(error.stdout);
    
    // Analyser la sortie d'ESLint pour extraire les problèmes
    eslintIssues = parseEslintOutput(error.stdout);
  }
  
  // Analyser la complexité cyclomatique
  console.log('\nAnalyzing code complexity...');
  const complexFiles = findComplexFiles();
  
  // Rechercher les duplications de code
  console.log('\nSearching for code duplications...');
  const duplications = findCodeDuplications();
  
  // Vérifier les performances
  console.log('\nChecking for performance issues...');
  const performanceIssues = findPerformanceIssues();
  
  // Générer le rapport
  const report = {
    timestamp: new Date().toISOString(),
    eslintIssues,
    complexFiles,
    duplications,
    performanceIssues,
    summary: {
      totalIssues: eslintIssues.length + complexFiles.length + duplications.length + performanceIssues.length,
      byCategory: {
        eslint: eslintIssues.length,
        complexity: complexFiles.length,
        duplication: duplications.length,
        performance: performanceIssues.length
      },
      bySeverity: {
        critical: eslintIssues.filter(i => i.severity === 'critical').length,
        high: eslintIssues.filter(i => i.severity === 'high').length,
        medium: eslintIssues.filter(i => i.severity === 'medium').length,
        low: eslintIssues.filter(i => i.severity === 'low').length,
      }
    }
  };
  
  const reportPath = path.join(projectRoot, 'technical-debt-report.json');
  fs.writeFileSync(
    reportPath,
    JSON.stringify(report, null, 2)
  );
  
  console.log(`\nTechnical debt analysis completed. Report saved to ${reportPath}`);
  return report;
}

/**
 * Analyse la sortie d'ESLint pour extraire les problèmes
 * @param {string} output - Sortie d'ESLint
 * @returns {Array} Liste des problèmes
 */
function parseEslintOutput(output) {
  const issues = [];
  const lines = output.split('\n');
  
  let currentFile = null;
  let issueCount = 0;
  
  for (const line of lines) {
    // Ligne de fichier
    if (line.trim().endsWith('.js') || line.trim().endsWith('.jsx') || line.trim().endsWith('.ts') || line.trim().endsWith('.tsx')) {
      currentFile = line.trim();
      continue;
    }
    
    // Ligne d'erreur
    const errorMatch = line.match(/^\s*(\d+):(\d+)\s+(\w+)\s+(.+)\s+(\w+\/[\w-]+)/);
    if (errorMatch && currentFile) {
      const [_, lineNum, colNum, level, message, rule] = errorMatch;
      
      let severity = 'low';
      if (level === 'error') {
        severity = message.toLowerCase().includes('security') ? 'critical' : 'high';
      } else if (level === 'warning') {
        severity = 'medium';
      }
      
      issues.push({
        file: currentFile,
        line: parseInt(lineNum),
        column: parseInt(colNum),
        severity,
        message,
        rule
      });
      
      issueCount++;
    }
  }
  
  return issues;
}

/**
 * Trouve les fichiers complexes
 * @returns {Array} Liste des fichiers complexes
 */
function findComplexFiles() {
  const complexFiles = [];
  
  function processFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Heuristiques simples pour détecter la complexité
    const nestedLoops = countPatternOccurrences(content, /for\s*\([^)]*\)\s*{[^}]*for\s*\([^)]*\)/g);
    const longFunctions = content.match(/function\s+\w+\s*\([^)]*\)\s*{[^}]*}/g)?.filter(fn => fn.length > 500) || [];
    const highComplexityConditions = countPatternOccurrences(content, /if\s*\([^)]*&&[^)]*&&[^)]*\)/g);
    
    if (nestedLoops > 0 || longFunctions.length > 0 || highComplexityConditions > 0) {
      complexFiles.push({
        file: filePath.replace(projectRoot, ''),
        issues: {
          nestedLoops,
          longFunctions: longFunctions.length,
          highComplexityConditions
        },
        severity: calculateComplexitySeverity(nestedLoops, longFunctions.length, highComplexityConditions)
      });
    }
  }
  
  traverseDirectory(projectRoot, processFile);
  return complexFiles;
}

/**
 * Calcule la sévérité des problèmes de complexité
 * @param {number} nestedLoops - Nombre de boucles imbriquées
 * @param {number} longFunctions - Nombre de fonctions longues
 * @param {number} highComplexityConditions - Nombre de conditions complexes
 * @returns {string} Niveau de sévérité
 */
function calculateComplexitySeverity(nestedLoops, longFunctions, highComplexityConditions) {
  const total = nestedLoops * 2 + longFunctions + highComplexityConditions;
  
  if (total > 10) {
    return 'critical';
  } else if (total > 5) {
    return 'high';
  } else if (total > 2) {
    return 'medium';
  }
  
  return 'low';
}

/**
 * Trouve les duplications de code
 * @returns {Array} Liste des duplications
 */
function findCodeDuplications() {
  const codeBlocks = new Map();
  const duplications = [];
  
  function processFile(filePath) {
    const relativePath = filePath.replace(projectRoot, '');
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Rechercher des blocs de code de taille significative (5+ lignes)
    for (let i = 0; i < lines.length - 5; i++) {
      const block = lines.slice(i, i + 5).join('\n');
      if (block.trim().length > 100) { // Ignorer les blocs trop courts
        if (codeBlocks.has(block)) {
          const existingLocation = codeBlocks.get(block);
          
          // Éviter les doublons dans les duplications
          const existingDuplication = duplications.find(d => 
            (d.locations[0].file === existingLocation.file && d.locations[1].file === relativePath) ||
            (d.locations[0].file === relativePath && d.locations[1].file === existingLocation.file)
          );
          
          if (!existingDuplication) {
            duplications.push({
              blockPreview: block.substring(0, 100) + '...',
              size: block.length,
              lines: 5,
              locations: [
                existingLocation,
                { file: relativePath, startLine: i + 1 }
              ],
              severity: block.length > 500 ? 'high' : 'medium'
            });
          }
        } else {
          codeBlocks.set(block, { file: relativePath, startLine: i + 1 });
        }
      }
    }
  }
  
  traverseDirectory(projectRoot, processFile);
  return duplications;
}

/**
 * Trouve les problèmes de performance
 * @returns {Array} Liste des problèmes de performance
 */
function findPerformanceIssues() {
  const performanceIssues = [];
  
  function processFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Rechercher des problèmes de performance courants
    const inefficientLoops = countPatternOccurrences(content, /forEach|map|filter|reduce/g);
    const domManipulations = countPatternOccurrences(content, /document\.querySelector|getElementById|getElementsBy/g);
    const largeArrays = countPatternOccurrences(content, /new Array\(\d{4,}\)/g);
    const documentReflows = countPatternOccurrences(content, /offsetHeight|offsetWidth|getComputedStyle|getBoundingClientRect/g);
    const nodeOperations = countPatternOccurrences(content, /appendChild|removeChild|insertBefore/g);
    
    // Ne rapporter que si plusieurs problèmes sont détectés
    if (inefficientLoops > 10 || domManipulations > 20 || largeArrays > 0 || 
        documentReflows > 5 || (domManipulations > 10 && nodeOperations > 10)) {
      
      const severity = calculatePerformanceSeverity(
        inefficientLoops, domManipulations, largeArrays, documentReflows, nodeOperations
      );
      
      performanceIssues.push({
        file: filePath.replace(projectRoot, ''),
        issues: {
          inefficientLoops,
          domManipulations,
          largeArrays,
          documentReflows,
          nodeOperations
        },
        severity
      });
    }
  }
  
  traverseDirectory(projectRoot, processFile);
  return performanceIssues;
}

/**
 * Calcule la sévérité des problèmes de performance
 * @param {number} inefficientLoops - Nombre de boucles inefficaces
 * @param {number} domManipulations - Nombre de manipulations DOM
 * @param {number} largeArrays - Nombre de grands tableaux
 * @param {number} documentReflows - Nombre de reflows du document
 * @param {number} nodeOperations - Nombre d'opérations sur les nœuds
 * @returns {string} Niveau de sévérité
 */
function calculatePerformanceSeverity(inefficientLoops, domManipulations, largeArrays, documentReflows, nodeOperations) {
  if (largeArrays > 0 || documentReflows > 10 || 
      (domManipulations > 30 && nodeOperations > 30)) {
    return 'critical';
  } else if (inefficientLoops > 20 || documentReflows > 5 || 
            (domManipulations > 20 && nodeOperations > 20)) {
    return 'high';
  } else if (inefficientLoops > 10 || 
            (domManipulations > 10 && nodeOperations > 10)) {
    return 'medium';
  }
  
  return 'low';
}

/**
 * Compte les occurrences d'un modèle dans un texte
 * @param {string} text - Texte à analyser
 * @param {RegExp} pattern - Modèle à rechercher
 * @returns {number} Nombre d'occurrences
 */
function countPatternOccurrences(text, pattern) {
  return (text.match(pattern) || []).length;
}

/**
 * Parcourt un répertoire et ses sous-répertoires
 * @param {string} dir - Répertoire à parcourir
 * @param {Function} fileCallback - Fonction à appeler pour chaque fichier
 */
function traverseDirectory(dir, fileCallback) {
  if (excludeDirs.some(excluded => dir.includes(excluded))) {
    return;
  }
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        if (!excludeDirs.includes(entry.name)) {
          traverseDirectory(fullPath, fileCallback);
        }
      } else if (entry.isFile() && fileExtensions.includes(path.extname(entry.name))) {
        try {
          fileCallback(fullPath);
        } catch (error) {
          console.error(`Error processing file ${fullPath}:`, error);
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }
}

// Exportation des fonctions
module.exports = {
  analyzeProject,
  findComplexFiles,
  findCodeDuplications,
  findPerformanceIssues
};
