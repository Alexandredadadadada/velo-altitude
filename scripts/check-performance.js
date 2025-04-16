// scripts/check-performance.js
const webpack = require('webpack');
const path = require('path');
const chalk = require('chalk');
const filesize = require('filesize');
const fs = require('fs');
const { performance } = require('perf_hooks');

// Charger la configuration de performance
const getConfig = () => {
  try {
    const configPath = path.resolve(__dirname, '../webpack.perf.config.js');
    if (fs.existsSync(configPath)) {
      const config = require(configPath);
      return typeof config === 'function' ? config({}, { mode: 'production' }) : config;
    } else {
      console.warn(chalk.yellow('Configuration webpack.perf.config.js non trouvée, utilisation de webpack.config.js'));
      const config = require('../webpack.config.js');
      return typeof config === 'function' ? config({}, { mode: 'production' }) : config;
    }
  } catch (error) {
    console.error(chalk.red(`Erreur lors du chargement de la configuration webpack: ${error.message}`));
    process.exit(1);
  }
};

// Définir les objectifs de performance
const PERFORMANCE_TARGETS = {
  FCP: 1500, // First Contentful Paint < 1.5s
  TTI: 3000, // Time to Interactive < 3.0s
  TBT: 300,  // Total Blocking Time < 300ms
  BUNDLE_SIZE_REDUCTION: 0.3, // Réduction de 30% de la taille du bundle
  BUDGETS: {
    totalSize: 2 * 1024 * 1024, // 2MB
    individualChunk: 244000, // 244KB
    initialLoad: 512000 // 512KB
  }
};

// Fonction principale d'analyse
async function analyzeBundle() {
  console.log(chalk.blue('🔍 Analyse de la taille du bundle et des métriques de performance...'));

  const startTime = performance.now();
  
  // Vérifier si des statistiques de bundle existent
  const bundleStatsPath = path.join(__dirname, '../build/bundle-stats.json');
  
  if (!fs.existsSync(bundleStatsPath)) {
    console.log(chalk.yellow('⚠️ Statistiques de bundle non trouvées. Exécutez d\'abord "npm run build:analyze"'));
    console.log(chalk.blue('💡 Tentative d\'analyse des fichiers dans le répertoire de build...'));
    
    // Analyser le répertoire de build s'il existe
    const buildDir = path.join(__dirname, '../build');
    if (!fs.existsSync(buildDir)) {
      console.error(chalk.red('❌ Répertoire de build non trouvé. Exécutez d\'abord un build.'));
      return null;
    }
    
    // Collecter les informations sur les assets à partir du répertoire de build
    return analyzeFromBuildDirectory(buildDir, startTime);
  }
  
  // Analyser à partir des statistiques de bundle
  try {
    const statsJson = JSON.parse(fs.readFileSync(bundleStatsPath, 'utf8'));
    const endTime = performance.now();
    
    console.log(chalk.green('✅ Statistiques de bundle chargées avec succès'));
    
    // Analyser et afficher les résultats
    return analyzeAndDisplayResults(statsJson, startTime, endTime);
  } catch (error) {
    console.error(chalk.red(`❌ Erreur lors de l'analyse des statistiques: ${error.message}`));
    return null;
  }
}

// Analyser à partir du répertoire de build
function analyzeFromBuildDirectory(buildDir, startTime) {
  console.log(chalk.blue('📁 Analyse des fichiers dans le répertoire de build...'));
  
  try {
    // Fonction récursive pour trouver tous les fichiers JS et CSS
    const findFiles = (dir, fileList = []) => {
      const files = fs.readdirSync(dir);
      
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          findFiles(filePath, fileList);
        } else if (/\.(js|css)$/.test(file)) {
          fileList.push({
            name: path.relative(buildDir, filePath),
            size: stat.size
          });
        }
      });
      
      return fileList;
    };
    
    const assets = findFiles(buildDir);
    const endTime = performance.now();
    
    // Trier par taille
    assets.sort((a, b) => b.size - a.size);
    
    console.log(chalk.green(`✅ Trouvé ${assets.length} fichiers JS/CSS`));
    
    // Créer un objet simulé de statistiques
    const statsJson = {
      assets: assets
    };
    
    return analyzeAndDisplayResults(statsJson, startTime, endTime);
  } catch (error) {
    console.error(chalk.red(`❌ Erreur lors de l'analyse du répertoire de build: ${error.message}`));
    return null;
  }
}

// Analyser et afficher les résultats
function analyzeAndDisplayResults(statsJson, startTime, endTime) {
  console.log(chalk.blue('\n📊 ANALYSE DU BUNDLE:'));
  console.log(chalk.blue('---------------------'));
  
  const assets = statsJson.assets || [];
  const jsAssets = assets.filter(asset => asset.name.endsWith('.js'));
  const cssAssets = assets.filter(asset => asset.name.endsWith('.css'));
  
  // Afficher les assets JS
  console.log(chalk.yellow('\nJS Chunks:'));
  jsAssets.forEach(asset => {
    const sizeColor = asset.size < PERFORMANCE_TARGETS.BUDGETS.individualChunk ? chalk.green : chalk.yellow;
    const gzipSize = Math.round(asset.size * 0.3); // Estimation de la taille gzip si non disponible
    
    console.log(`${sizeColor('●')} ${asset.name}: ${sizeColor(filesize(asset.size))} (gzippé: ${sizeColor(filesize(asset.gzipSize || gzipSize))})`);
  });
  
  // Afficher les assets CSS
  console.log(chalk.cyan('\nCSS Chunks:'));
  cssAssets.forEach(asset => {
    const sizeColor = asset.size < PERFORMANCE_TARGETS.BUDGETS.individualChunk / 2 ? chalk.green : chalk.yellow;
    const gzipSize = Math.round(asset.size * 0.2); // Les CSS se compressent généralement mieux
    
    console.log(`${sizeColor('●')} ${asset.name}: ${sizeColor(filesize(asset.size))} (gzippé: ${sizeColor(filesize(asset.gzipSize || gzipSize))})`);
  });
  
  // Calculer et afficher la taille totale
  const totalSize = assets.reduce((sum, asset) => sum + asset.size, 0);
  const totalGzipSize = Math.round(totalSize * 0.3); // Estimation de la taille gzip
  
  const sizeColor = totalSize < PERFORMANCE_TARGETS.BUDGETS.totalSize ? chalk.green : chalk.yellow;
  
  console.log(chalk.blue('\nTaille totale du bundle:'));
  console.log(`${sizeColor('■')} ${sizeColor(filesize(totalSize))} (gzippé: ${sizeColor(filesize(totalGzipSize))})`);
  console.log(chalk.blue(`⏱️ Temps d'analyse: ${((endTime - startTime) / 1000).toFixed(2)}s`));
  
  // Vérifier les violations du budget de performance
  const violations = assets.filter(asset => asset.size > PERFORMANCE_TARGETS.BUDGETS.individualChunk);
  
  if (violations.length > 0) {
    console.log(chalk.yellow('\n⚠️ VIOLATIONS DU BUDGET DE PERFORMANCE:'));
    violations.forEach(asset => {
      const overage = ((asset.size - PERFORMANCE_TARGETS.BUDGETS.individualChunk) / PERFORMANCE_TARGETS.BUDGETS.individualChunk * 100).toFixed(1);
      console.log(chalk.yellow(`${asset.name} dépasse le budget de ${filesize(PERFORMANCE_TARGETS.BUDGETS.individualChunk)} de ${overage}%`));
    });
  }
  
  if (totalSize > PERFORMANCE_TARGETS.BUDGETS.totalSize) {
    const overage = ((totalSize - PERFORMANCE_TARGETS.BUDGETS.totalSize) / PERFORMANCE_TARGETS.BUDGETS.totalSize * 100).toFixed(1);
    console.log(chalk.yellow(`\n⚠️ La taille totale du bundle dépasse le budget de ${filesize(PERFORMANCE_TARGETS.BUDGETS.totalSize)} de ${overage}%`));
  }
  
  // Recommandations pour l'optimisation
  console.log(chalk.blue('\n💡 RECOMMANDATIONS D\'OPTIMISATION:'));
  
  if (violations.length > 0) {
    console.log(chalk.cyan('1. Optimisez les chunks trop volumineux:'));
    violations.forEach(asset => {
      console.log(chalk.cyan(`   - ${asset.name}: Vérifiez les imports et considérez une séparation supplémentaire`));
    });
  }
  
  // Déterminer les bibliothèques potentiellement mal fractionnées
  const potentiallyLargeLibs = jsAssets.filter(asset => 
    (asset.name.includes('vendor') || asset.name.includes('node_modules')) && 
    asset.size > PERFORMANCE_TARGETS.BUDGETS.individualChunk / 2
  );
  
  if (potentiallyLargeLibs.length > 0) {
    console.log(chalk.cyan('\n2. Bibliothèques à optimiser:'));
    potentiallyLargeLibs.forEach(asset => {
      console.log(chalk.cyan(`   - ${asset.name}: Vérifiez si le tree-shaking est correctement appliqué`));
    });
  }
  
  // Vérifier la présence de Three.js et Material-UI optimisés
  const hasThreeOptimized = jsAssets.some(asset => asset.name.includes('three') && asset.size < 300000);
  const hasMuiOptimized = jsAssets.some(asset => (asset.name.includes('material-ui') || asset.name.includes('mui')) && asset.size < 400000);
  
  if (!hasThreeOptimized) {
    console.log(chalk.cyan('\n3. Three.js pourrait bénéficier d\'une optimisation supplémentaire:'));
    console.log(chalk.cyan('   - Assurez-vous d\'importer uniquement les modules Three.js nécessaires'));
    console.log(chalk.cyan('   - Utilisez three/examples/jsm/ pour des imports ciblés'));
  }
  
  if (!hasMuiOptimized) {
    console.log(chalk.cyan('\n4. Material-UI pourrait bénéficier d\'une optimisation supplémentaire:'));
    console.log(chalk.cyan('   - Utilisez les imports nommés pour Material-UI: import { Button } from "@material-ui/core"'));
    console.log(chalk.cyan('   - Envisagez d\'utiliser @material-ui/core/Button plutôt que @material-ui/core'));
  }
  
  // Recommandations générales
  console.log(chalk.cyan('\n5. Recommandations générales:'));
  console.log(chalk.cyan('   - Utilisez React.lazy() et Suspense pour le chargement dynamique des composants'));
  console.log(chalk.cyan('   - Vérifiez les imports inutilisés avec un outil comme depcheck'));
  console.log(chalk.cyan('   - Optimisez les images avec image-webpack-loader'));
  
  // Recommandations pour les performances au runtime
  console.log(chalk.blue('\n⚡ OBJECTIFS DE PERFORMANCE RUNTIME:'));
  console.log(chalk.cyan(`- First Contentful Paint (FCP): < ${PERFORMANCE_TARGETS.FCP}ms`));
  console.log(chalk.cyan(`- Time to Interactive (TTI): < ${PERFORMANCE_TARGETS.TTI}ms`));
  console.log(chalk.cyan(`- Total Blocking Time (TBT): < ${PERFORMANCE_TARGETS.TBT}ms`));
  
  console.log(chalk.blue('\n📋 PROCHAINES ÉTAPES:'));
  console.log(chalk.cyan('1. Exécutez un test de performance avec Lighthouse après déploiement'));
  console.log(chalk.cyan('2. Identifiez et corrigez les goulets d\'étranglement spécifiques'));
  console.log(chalk.cyan('3. Optimisez les routes critiques pour une meilleure expérience utilisateur'));
  
  console.log(chalk.green('\n✅ Analyse terminée!'));
  
  return {
    totalSize,
    totalGzipSize,
    jsAssets,
    cssAssets,
    violations,
    buildTime: endTime - startTime
  };
}

// Exécuter l'analyse si appelé directement
if (require.main === module) {
  analyzeBundle().catch(error => {
    console.error(chalk.red(`❌ Erreur lors de l'analyse: ${error.message}`));
    process.exit(1);
  });
}

module.exports = analyzeBundle;
