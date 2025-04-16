/**
 * Script de vérification de la build Velo-Altitude
 * Analyse la taille des bundles, les performances et les dépendances
 */

const fs = require('fs');
const path = require('path');
const filesize = require('filesize');
const { execSync } = require('child_process');

// Utiliser un polyfill simple pour chalk
const chalk = {
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  gray: (text) => `\x1b[90m${text}\x1b[0m`
};

// Configuration
const config = {
  buildDir: path.resolve(__dirname, '../build'),
  statsFile: path.resolve(__dirname, '../build/bundle-stats.json'),
  thresholds: {
    totalSize: 2 * 1024 * 1024, // 2MB
    maxChunkSize: 244000,       // 244KB
    totalJsChunks: 15,          // Nombre maximum de chunks JS
    loadTime: 2500,             // 2.5s
    fcp: 1500,                  // 1.5s
    tti: 3000                   // 3.0s
  },
  reportsDir: path.resolve(__dirname, '../reports')
};

// Créer le répertoire des rapports s'il n'existe pas
if (!fs.existsSync(config.reportsDir)) {
  fs.mkdirSync(config.reportsDir, { recursive: true });
}

// Fonction pour analyser les bundles
async function analyzeBundles() {
  console.log(chalk.blue('📊 Analyse des bundles...'));
  
  // Vérifier si le répertoire de build existe
  if (!fs.existsSync(config.buildDir)) {
    console.log(chalk.yellow('⚠️ Le répertoire de build n\'existe pas. Exécutez d\'abord npm run build:safe.'));
    return null;
  }
  
  // Collectionner les informations sur les fichiers
  const jsFiles = [];
  const cssFiles = [];
  const imageFiles = [];
  let totalSize = 0;
  
  // Fonction récursive pour analyser les fichiers
  const processDirectory = (dir) => {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        processDirectory(filePath);
      } else {
        const extension = path.extname(file).toLowerCase();
        const size = stat.size;
        totalSize += size;
        
        const fileInfo = {
          path: path.relative(config.buildDir, filePath),
          size: size,
          sizeFormatted: filesize(size)
        };
        
        if (extension === '.js') {
          jsFiles.push(fileInfo);
        } else if (extension === '.css') {
          cssFiles.push(fileInfo);
        } else if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'].includes(extension)) {
          imageFiles.push(fileInfo);
        }
      }
    });
  };
  
  processDirectory(config.buildDir);
  
  // Trier les fichiers par taille
  jsFiles.sort((a, b) => b.size - a.size);
  cssFiles.sort((a, b) => b.size - a.size);
  imageFiles.sort((a, b) => b.size - a.size);
  
  // Calculer des statistiques
  const stats = {
    totalSize: totalSize,
    totalSizeFormatted: filesize(totalSize),
    jsFiles: {
      count: jsFiles.length,
      totalSize: jsFiles.reduce((sum, file) => sum + file.size, 0),
      largestFile: jsFiles.length > 0 ? jsFiles[0] : null
    },
    cssFiles: {
      count: cssFiles.length,
      totalSize: cssFiles.reduce((sum, file) => sum + file.size, 0),
      largestFile: cssFiles.length > 0 ? cssFiles[0] : null
    },
    imageFiles: {
      count: imageFiles.length,
      totalSize: imageFiles.reduce((sum, file) => sum + file.size, 0),
      largestFile: imageFiles.length > 0 ? imageFiles[0] : null
    },
    violations: {
      oversizedJs: jsFiles.filter(file => file.size > config.thresholds.maxChunkSize),
      tooManyChunks: jsFiles.length > config.thresholds.totalJsChunks
    }
  };
  
  // Afficher les résultats
  console.log(chalk.green(`✅ Analyse des bundles terminée. Taille totale: ${stats.totalSizeFormatted}`));
  console.log(chalk.cyan(`📄 Fichiers JS: ${stats.jsFiles.count} (${filesize(stats.jsFiles.totalSize)})`));
  console.log(chalk.cyan(`📄 Fichiers CSS: ${stats.cssFiles.count} (${filesize(stats.cssFiles.totalSize)})`));
  console.log(chalk.cyan(`🖼️ Images: ${stats.imageFiles.count} (${filesize(stats.imageFiles.totalSize)})`));
  
  // Vérifier les violations de taille
  if (stats.violations.oversizedJs.length > 0) {
    console.log(chalk.yellow(`⚠️ ${stats.violations.oversizedJs.length} chunks JS dépassent la taille maximale recommandée (${filesize(config.thresholds.maxChunkSize)}):`));
    stats.violations.oversizedJs.forEach(file => {
      console.log(chalk.yellow(`   - ${file.path}: ${file.sizeFormatted}`));
    });
  }
  
  if (stats.violations.tooManyChunks) {
    console.log(chalk.yellow(`⚠️ Trop de chunks JS (${stats.jsFiles.count} > ${config.thresholds.totalJsChunks})`));
  }
  
  // Générer un rapport
  const reportPath = path.join(config.reportsDir, `bundle-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(stats, null, 2));
  console.log(chalk.green(`✅ Rapport sauvegardé dans ${reportPath}`));
  
  return stats;
}

// Fonction pour vérifier les dépendances
async function checkDependencies() {
  console.log(chalk.blue('🔍 Vérification des dépendances...'));
  
  try {
    // Lire le package.json
    const packageJsonPath = path.resolve(__dirname, '../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Vérifier les dépendances problématiques
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    const issues = [];
    
    // Vérifier les versions incompatibles connues
    const incompatiblePairs = [
      { pkg1: 'react@18', pkg2: '@material-ui/core@4', message: 'React 18 n\'est pas compatible avec Material-UI v4. Migrez vers MUI v5.' },
      { pkg1: 'webpack@5', pkg2: 'react-scripts@4', message: 'webpack 5 n\'est pas compatible avec react-scripts 4. Mettez à jour react-scripts.' }
    ];
    
    for (const { pkg1, pkg2, message } of incompatiblePairs) {
      const [name1, version1] = pkg1.split('@');
      const [name2, version2] = pkg2.split('@');
      
      if (dependencies[name1] && dependencies[name1].includes(version1) && 
          dependencies[name2] && dependencies[name2].includes(version2)) {
        issues.push({ type: 'incompatible', message });
      }
    }
    
    // Vérifier les doublons (différentes versions du même package)
    const dependencyNames = Object.keys(dependencies);
    const duplicates = [];
    
    dependencyNames.forEach(name => {
      const alternatives = dependencyNames.filter(dep => 
        dep !== name && (
          dep.startsWith(`${name}/`) || // sous-packages
          dep.replace(/-/g, '') === name.replace(/-/g, '') || // différentes formes de tirets
          dep.toLowerCase() === name.toLowerCase() // différentes formes de casse
        )
      );
      
      if (alternatives.length > 0) {
        duplicates.push({ name, alternatives });
      }
    });
    
    if (duplicates.length > 0) {
      issues.push({ 
        type: 'duplicates', 
        packages: duplicates,
        message: 'Packages potentiellement dupliqués détectés.'
      });
    }
    
    // Résultat
    const result = {
      totalDependencies: Object.keys(dependencies).length,
      devDependencies: Object.keys(packageJson.devDependencies || {}).length,
      dependencies: Object.keys(packageJson.dependencies || {}).length,
      issues
    };
    
    // Afficher les résultats
    console.log(chalk.green(`✅ Vérification des dépendances terminée. ${result.totalDependencies} dépendances au total.`));
    
    if (issues.length > 0) {
      console.log(chalk.yellow(`⚠️ ${issues.length} problèmes détectés:`));
      issues.forEach(issue => {
        console.log(chalk.yellow(`   - ${issue.message}`));
      });
    }
    
    // Générer un rapport
    const reportPath = path.join(config.reportsDir, `dependencies-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));
    console.log(chalk.green(`✅ Rapport sauvegardé dans ${reportPath}`));
    
    return result;
  } catch (error) {
    console.error(chalk.red('❌ Erreur lors de la vérification des dépendances:'), error);
    return null;
  }
}

// Fonction pour simuler une mesure de performance (dans un environnement réel, utilisez Lighthouse)
async function simulatePerformanceMeasurement() {
  console.log(chalk.blue('⏱️ Simulation de mesure de performance...'));
  
  // Note: Dans un environnement réel, utilisez Lighthouse ou un outil similaire
  // Cette fonction simule des mesures pour la démonstration
  
  // Récupérer les statistiques de bundle si elles existent
  let bundleStats = null;
  if (fs.existsSync(config.statsFile)) {
    try {
      bundleStats = JSON.parse(fs.readFileSync(config.statsFile, 'utf8'));
    } catch (error) {
      console.warn(chalk.yellow('⚠️ Impossible de lire le fichier de statistiques de bundle.'));
    }
  }
  
  // Calculer des métriques estimées basées sur la taille du bundle
  // Note: ce sont des estimations très approximatives pour la démonstration
  const totalJsSize = bundleStats ? 
    bundleStats.assets.filter(asset => asset.name.endsWith('.js')).reduce((sum, asset) => sum + asset.size, 0) :
    1500000; // valeur par défaut si pas de stats
  
  const metrics = {
    FCP: Math.min(1000 + (totalJsSize / 500000) * 500, 3000), // Entre 1s et 3s selon la taille
    TTI: Math.min(1500 + (totalJsSize / 500000) * 1500, 5000), // Entre 1.5s et 5s selon la taille
    TBT: Math.min(100 + (totalJsSize / 500000) * 400, 800),    // Entre 100ms et 800ms selon la taille
    
    // Indicateurs de performance
    loadTime: Math.min(800 + (totalJsSize / 500000) * 1700, 4000), // Temps de chargement estimé
    score: Math.max(100 - (totalJsSize / 2000000) * 40, 60),       // Score entre 60 et 100
    
    // Basé sur les seuils
    meetsFcpTarget: false,
    meetsTtiTarget: false,
    meetsLoadTimeTarget: false
  };
  
  // Vérifier les objectifs
  metrics.meetsFcpTarget = metrics.FCP < config.thresholds.fcp;
  metrics.meetsTtiTarget = metrics.TTI < config.thresholds.tti;
  metrics.meetsLoadTimeTarget = metrics.loadTime < config.thresholds.loadTime;
  
  // Afficher les résultats
  console.log(chalk.green('✅ Mesure de performance terminée.'));
  console.log(chalk.cyan(`⏱️ First Contentful Paint (FCP): ${metrics.FCP.toFixed(0)}ms ${metrics.meetsFcpTarget ? '✅' : '❌'}`));
  console.log(chalk.cyan(`⏱️ Time to Interactive (TTI): ${metrics.TTI.toFixed(0)}ms ${metrics.meetsTtiTarget ? '✅' : '❌'}`));
  console.log(chalk.cyan(`⏱️ Total Blocking Time (TBT): ${metrics.TBT.toFixed(0)}ms`));
  console.log(chalk.cyan(`⏱️ Temps de chargement estimé: ${metrics.loadTime.toFixed(0)}ms ${metrics.meetsLoadTimeTarget ? '✅' : '❌'}`));
  console.log(chalk.cyan(`📊 Score de performance estimé: ${metrics.score.toFixed(0)}/100`));
  
  // Générer des recommandations
  console.log(chalk.blue('\n📋 Recommandations:'));
  
  if (!metrics.meetsFcpTarget) {
    console.log(chalk.yellow('• Améliorer le First Contentful Paint:'));
    console.log('  - Optimiser le CSS critique');
    console.log('  - Réduire la taille des JS initiaux');
    console.log('  - Implémenter un préchargement des ressources critiques');
  }
  
  if (!metrics.meetsTtiTarget) {
    console.log(chalk.yellow('• Améliorer le Time to Interactive:'));
    console.log('  - Réduire le JavaScript inutilisé');
    console.log('  - Différer le chargement des scripts non critiques');
    console.log('  - Optimiser les fonctions coûteuses en CPU');
  }
  
  if (!metrics.meetsLoadTimeTarget) {
    console.log(chalk.yellow('• Améliorer le temps de chargement global:'));
    console.log('  - Optimiser les images avec WebP et compression');
    console.log('  - Ajouter un Service Worker pour la mise en cache');
    console.log('  - Implémenter la compression Brotli ou Gzip');
  }
  
  // Générer un rapport
  const reportPath = path.join(config.reportsDir, `performance-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(metrics, null, 2));
  console.log(chalk.green(`\n✅ Rapport sauvegardé dans ${reportPath}`));
  
  return metrics;
}

// Fonction principale
async function verifyBuild() {
  console.log(chalk.blue('🚀 Démarrage de la vérification de build...'));
  
  try {
    // 1. Analyser les bundles
    const bundleStats = await analyzeBundles();
    console.log('\n' + '-'.repeat(80) + '\n');
    
    // 2. Vérifier les dépendances
    const dependencyStats = await checkDependencies();
    console.log('\n' + '-'.repeat(80) + '\n');
    
    // 3. Mesurer les performances
    const performanceStats = await simulatePerformanceMeasurement();
    console.log('\n' + '-'.repeat(80) + '\n');
    
    // 4. Générer un rapport récapitulatif
    const summary = {
      timestamp: new Date().toISOString(),
      bundleStats: bundleStats,
      dependencyStats: dependencyStats,
      performanceStats: performanceStats,
      
      // Évaluation globale
      overallStatus: 'success', // Par défaut optimiste
      issues: []
    };
    
    // Collecter les problèmes
    if (bundleStats && bundleStats.violations.oversizedJs.length > 0) {
      summary.issues.push({ 
        severity: 'warning',
        category: 'bundle',
        message: `${bundleStats.violations.oversizedJs.length} chunks JS dépassent la taille maximale recommandée`
      });
      summary.overallStatus = 'warning';
    }
    
    if (dependencyStats && dependencyStats.issues.length > 0) {
      summary.issues.push({ 
        severity: 'error',
        category: 'dependencies',
        message: `${dependencyStats.issues.length} problèmes de dépendances détectés`
      });
      summary.overallStatus = 'error';
    }
    
    if (performanceStats) {
      const failedMetrics = [];
      if (!performanceStats.meetsFcpTarget) failedMetrics.push('FCP');
      if (!performanceStats.meetsTtiTarget) failedMetrics.push('TTI');
      if (!performanceStats.meetsLoadTimeTarget) failedMetrics.push('LoadTime');
      
      if (failedMetrics.length > 0) {
        summary.issues.push({ 
          severity: 'warning',
          category: 'performance',
          message: `Les métriques suivantes ne respectent pas les objectifs: ${failedMetrics.join(', ')}`
        });
        if (summary.overallStatus !== 'error') {
          summary.overallStatus = 'warning';
        }
      }
    }
    
    // Afficher le statut global
    const statusColors = {
      'success': chalk.green,
      'warning': chalk.yellow,
      'error': chalk.red
    };
    
    const statusEmoji = {
      'success': '✅',
      'warning': '⚠️',
      'error': '❌'
    };
    
    console.log(statusColors[summary.overallStatus](`${statusEmoji[summary.overallStatus]} Statut global: ${summary.overallStatus.toUpperCase()}`));
    
    if (summary.issues.length > 0) {
      console.log(chalk.yellow(`\n⚠️ ${summary.issues.length} problèmes identifiés:`));
      summary.issues.forEach((issue, index) => {
        const issueColor = issue.severity === 'error' ? chalk.red : chalk.yellow;
        console.log(issueColor(`${index + 1}. [${issue.category}] ${issue.message}`));
      });
    }
    
    // Sauvegarder le rapport
    const summaryPath = path.join(config.reportsDir, `build-verification-${Date.now()}.json`);
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(chalk.green(`\n✅ Rapport complet sauvegardé dans ${summaryPath}`));
    
    return summary;
  } catch (error) {
    console.error(chalk.red('❌ Erreur lors de la vérification de build:'), error);
    return { overallStatus: 'error', error: error.message };
  }
}

// Si appelé directement, exécuter la vérification
if (require.main === module) {
  verifyBuild().catch(console.error);
}

module.exports = verifyBuild;
