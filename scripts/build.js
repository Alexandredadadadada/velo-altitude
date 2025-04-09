/**
 * Script central de build pour Velo-Altitude
 * Orchestration complète du processus de build avec optimisations
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { performance } = require('perf_hooks');

// Configuration du build
const config = {
  clean: true,
  analyze: false,
  monitoring: true,
  optimizeAssets: true,
  validateDatabase: true,
  emergencyMode: false
};

// Compteurs de performance
const timers = {};

// Journal de build
const buildLog = [];

// Fonction principale de build
async function runBuild() {
  console.log('🚀 Démarrage du processus de build Velo-Altitude');
  logBuildStep('Initialisation du build');
  
  const startTime = performance.now();
  
  try {
    // 1. Vérifications préliminaires
    startTimer('preChecks');
    await runPreChecks();
    stopTimer('preChecks');
    
    // 2. Nettoyage des fichiers existants
    if (config.clean) {
      startTimer('clean');
      await cleanBuildDirectories();
      stopTimer('clean');
    }
    
    // 3. Compilation webpack
    startTimer('webpack');
    await runWebpackBuild();
    stopTimer('webpack');
    
    // 4. Post-traitement
    startTimer('postProcess');
    await runPostProcessing();
    stopTimer('postProcess');
    
    // 5. Validation finale
    startTimer('validation');
    await validateBuild();
    stopTimer('validation');
    
    // 6. Optimisations pour le déploiement 
    if (config.optimizeAssets) {
      startTimer('optimize');
      await optimizeAssets();
      stopTimer('optimize');
    }
    
    // 7. Rapport de build
    const endTime = performance.now();
    const totalTime = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(`\n✅ Build Velo-Altitude terminé en ${totalTime}s`);
    displayPerformanceReport();
    
    // 8. Sauvegarde du log de build
    saveBuildLog();
    
    return true;
  } catch (error) {
    const endTime = performance.now();
    const totalTime = ((endTime - startTime) / 1000).toFixed(2);
    
    console.error(`\n❌ Échec du build après ${totalTime}s`);
    console.error(`Erreur: ${error.message}`);
    
    // Sauvegarder le log même en cas d'échec
    logBuildStep('ERREUR', error.message);
    saveBuildLog();
    
    return false;
  }
}

// 1. Vérifications préliminaires
async function runPreChecks() {
  logBuildStep('Vérifications préliminaires');
  
  // Vérifier que les fichiers essentiels existent
  const requiredFiles = [
    { path: '../package.json', name: 'Package JSON' },
    { path: '../webpack.config.js', name: 'Config Webpack' },
    { path: '../netlify.toml', name: 'Config Netlify' }
  ];
  
  for (const file of requiredFiles) {
    const filePath = path.resolve(__dirname, file.path);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Fichier requis manquant: ${file.name} (${filePath})`);
    }
  }
  
  // Vérifier que webpack est installé
  try {
    execSync('npx webpack --version', { stdio: 'pipe' });
  } catch (error) {
    throw new Error('webpack n\'est pas installé ou accessible');
  }
  
  // Vérifier les variables d'environnement essentielles
  const criticalEnvVars = [
    'NODE_ENV', 
    'MONGODB_URI', 
    'MONGODB_DB_NAME'
  ];
  
  const missingVars = criticalEnvVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    console.warn(`⚠️ Variables d'environnement manquantes: ${missingVars.join(', ')}`);
    
    // Définir des valeurs par défaut pour le build
    process.env.NODE_ENV = process.env.NODE_ENV || 'production';
    process.env.MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'velo-altitude';
    
    logBuildStep('AVERTISSEMENT', `Variables d'environnement manquantes ajustées avec des valeurs par défaut`);
  }
  
  console.log('✅ Vérifications préliminaires terminées');
  
  // Exécuter le script de vérification pré-déploiement si disponible
  const preDeployCheckPath = path.resolve(__dirname, 'pre-deploy-check.js');
  if (fs.existsSync(preDeployCheckPath)) {
    try {
      execSync(`node "${preDeployCheckPath}"`, { stdio: 'inherit' });
    } catch (error) {
      console.warn('⚠️ Le script de vérification pré-déploiement a signalé des problèmes');
      // Continuer malgré les avertissements
    }
  }
}

// 2. Nettoyage des fichiers existants
async function cleanBuildDirectories() {
  logBuildStep('Nettoyage des répertoires');
  
  const directoriesToClean = [
    path.resolve(__dirname, '../build'),
    path.resolve(__dirname, '../.cache'),
    path.resolve(__dirname, '../dist')
  ];
  
  for (const dir of directoriesToClean) {
    if (fs.existsSync(dir)) {
      console.log(`🧹 Suppression de ${dir}`);
      try {
        fs.rmSync(dir, { recursive: true, force: true });
      } catch (error) {
        throw new Error(`Erreur lors du nettoyage de ${dir}: ${error.message}`);
      }
    }
  }
  
  console.log('✅ Nettoyage terminé');
}

// 3. Compilation webpack
async function runWebpackBuild() {
  logBuildStep('Compilation Webpack');
  
  try {
    // Définir les variables d'environnement de build
    process.env.GENERATE_SOURCEMAP = 'false';
    process.env.INLINE_RUNTIME_CHUNK = 'false';
    
    // Exécuter webpack avec la configuration optimisée
    const webpackCommand = 'npx webpack --config webpack.config.js --mode production';
    console.log(`🛠️ Exécution de: ${webpackCommand}`);
    
    execSync(webpackCommand, { stdio: 'inherit' });
    
    console.log('✅ Compilation webpack terminée');
  } catch (error) {
    throw new Error(`Erreur lors de la compilation webpack: ${error.message}`);
  }
}

// 4. Post-traitement
async function runPostProcessing() {
  logBuildStep('Post-traitement');
  
  try {
    // Exécuter le script post-build s'il existe
    const postBuildPath = path.resolve(__dirname, 'post-build.js');
    if (fs.existsSync(postBuildPath)) {
      console.log('📦 Exécution du script post-build');
      execSync(`node "${postBuildPath}"`, { stdio: 'inherit' });
    }
    
    // Exécuter le script deploy-complete s'il existe
    const deployCompletePath = path.resolve(__dirname, 'deploy-complete.js');
    if (fs.existsSync(deployCompletePath)) {
      console.log('🚀 Exécution du script deploy-complete');
      execSync(`node "${deployCompletePath}"`, { stdio: 'inherit' });
    }
    
    console.log('✅ Post-traitement terminé');
  } catch (error) {
    throw new Error(`Erreur lors du post-traitement: ${error.message}`);
  }
}

// 5. Validation finale
async function validateBuild() {
  logBuildStep('Validation du build');
  
  const buildDir = path.resolve(__dirname, '../build');
  
  // Vérifier que le dossier build existe
  if (!fs.existsSync(buildDir)) {
    throw new Error('Le dossier build n\'existe pas après la compilation');
  }
  
  // Vérifier que index.html existe
  const indexPath = path.join(buildDir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    throw new Error('index.html est manquant dans le build');
  }
  
  // Vérifier la présence de fichiers statiques (JS, CSS)
  const staticJsDir = path.join(buildDir, 'static', 'js');
  const staticCssDir = path.join(buildDir, 'static', 'css');
  
  if (!fs.existsSync(staticJsDir) || !fs.existsSync(staticCssDir)) {
    throw new Error('Les dossiers de fichiers statiques sont manquants');
  }
  
  // Vérifier la présence d'au moins un fichier JS et CSS
  const jsFiles = fs.readdirSync(staticJsDir).filter(file => file.endsWith('.js'));
  const cssFiles = fs.readdirSync(staticCssDir).filter(file => file.endsWith('.css'));
  
  if (jsFiles.length === 0) {
    throw new Error('Aucun fichier JavaScript trouvé dans le build');
  }
  
  if (cssFiles.length === 0) {
    throw new Error('Aucun fichier CSS trouvé dans le build');
  }
  
  // Vérification de la configuration de MongoDB si demandé
  if (config.validateDatabase && process.env.MONGODB_DB_NAME) {
    console.log(`ℹ️ Base de données configurée: ${process.env.MONGODB_DB_NAME}`);
    logBuildStep('INFO', `Base de données: ${process.env.MONGODB_DB_NAME}`);
  }
  
  console.log('✅ Validation du build terminée');
}

// 6. Optimisations pour le déploiement
async function optimizeAssets() {
  logBuildStep('Optimisation des assets');
  
  try {
    // Créer les fichiers de configuration Netlify
    const buildDir = path.resolve(__dirname, '../build');
    
    // Vérifier si les fichiers _redirects et _headers existent déjà
    const redirectsExists = fs.existsSync(path.join(buildDir, '_redirects'));
    const headersExists = fs.existsSync(path.join(buildDir, '_headers'));
    
    // Ne créer les fichiers que s'ils n'existent pas déjà
    if (!redirectsExists) {
      // Créer _redirects pour Netlify
      const redirects = [
        '# Redirections SPA',
        '/*    /index.html   200',
        ''
      ].join('\n');
      
      fs.writeFileSync(path.join(buildDir, '_redirects'), redirects);
      console.log('✅ Fichier _redirects créé');
    }
    
    if (!headersExists) {
      // Créer _headers pour Netlify
      const headers = [
        '/*',
        '  X-Frame-Options: DENY',
        '  X-XSS-Protection: 1; mode=block',
        '  X-Content-Type-Options: nosniff',
        '',
        '/static/*',
        '  Cache-Control: public, max-age=31536000, immutable',
        ''
      ].join('\n');
      
      fs.writeFileSync(path.join(buildDir, '_headers'), headers);
      console.log('✅ Fichier _headers créé');
    }
    
    console.log('✅ Optimisation des assets terminée');
  } catch (error) {
    console.warn(`⚠️ Erreur lors de l'optimisation des assets: ${error.message}`);
    // Continuer malgré les erreurs d'optimisation
  }
}

// Fonctions utilitaires
function startTimer(name) {
  timers[name] = {
    start: performance.now(),
    end: null,
    duration: null
  };
}

function stopTimer(name) {
  if (timers[name]) {
    timers[name].end = performance.now();
    timers[name].duration = ((timers[name].end - timers[name].start) / 1000).toFixed(2);
  }
}

function logBuildStep(step, message = '') {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    step,
    message
  };
  
  buildLog.push(logEntry);
  
  if (message) {
    console.log(`[${timestamp}] ${step}: ${message}`);
  } else {
    console.log(`[${timestamp}] ${step}`);
  }
}

function displayPerformanceReport() {
  console.log('\n📊 Rapport de performance du build:');
  
  const totalTime = Object.values(timers).reduce((total, timer) => {
    return total + (timer.duration ? parseFloat(timer.duration) : 0);
  }, 0);
  
  Object.entries(timers).forEach(([name, timer]) => {
    if (timer.duration) {
      const percentage = ((parseFloat(timer.duration) / totalTime) * 100).toFixed(1);
      console.log(`  ${name.padEnd(15)}: ${timer.duration}s (${percentage}%)`);
    }
  });
  
  console.log(`  ${'TOTAL'.padEnd(15)}: ${totalTime.toFixed(2)}s (100%)`);
}

function saveBuildLog() {
  const logDir = path.resolve(__dirname, '../logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
  const logPath = path.join(logDir, `build-${timestamp}.json`);
  
  fs.writeFileSync(logPath, JSON.stringify(buildLog, null, 2));
  console.log(`📝 Log de build sauvegardé: ${logPath}`);
}

// Exécuter le build
module.exports = runBuild;

// Si exécuté directement
if (require.main === module) {
  runBuild()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Erreur fatale:', error);
      process.exit(1);
    });
}
