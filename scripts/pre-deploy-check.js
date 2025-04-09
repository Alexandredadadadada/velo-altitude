/**
 * Script de vérification pré-déploiement pour Velo-Altitude
 * Vérifie que toutes les conditions nécessaires au déploiement sont remplies
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Vérification pré-déploiement en cours...');

// Tableau pour collecter les avertissements et erreurs
const warnings = [];
const errors = [];

// Fonction principale de vérification
function runPreDeploymentChecks() {
  try {
    // 1. Vérification des variables d'environnement
    checkEnvironmentVariables();
    
    // 2. Vérification des dépendances
    checkDependencies();
    
    // 3. Vérification de la structure du projet
    checkProjectStructure();
    
    // 4. Vérification de la configuration webpack
    checkWebpackConfig();
    
    // 5. Vérification des fichiers de configuration Netlify
    checkNetlifyConfig();
    
    // Afficher le résumé des vérifications
    displaySummary();
    
    // Si des erreurs ont été trouvées, quitter avec un code d'erreur
    if (errors.length > 0) {
      console.error(`❌ Vérification échouée avec ${errors.length} erreur(s). Veuillez corriger ces problèmes avant de déployer.`);
      process.exit(1);
    } else {
      console.log('✅ Vérification pré-déploiement réussie ! Le projet est prêt à être déployé.');
    }
  } catch (error) {
    console.error('❌ Une erreur inattendue s\'est produite pendant la vérification:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Vérification des variables d'environnement
function checkEnvironmentVariables() {
  console.log('🔹 Vérification des variables d\'environnement...');
  
  // Variables d'environnement critiques pour le déploiement
  const criticalEnvVars = [
    'AUTH0_CLIENT_ID',
    'AUTH0_ISSUER_BASE_URL',
    'AUTH0_AUDIENCE',
    'MAPBOX_TOKEN',
    'MONGODB_URI',
    'MONGODB_DB_NAME'
  ];
  
  // Variables d'environnement optionnelles mais recommandées
  const recommendedEnvVars = [
    'OPENWEATHER_API_KEY',
    'STRAVA_CLIENT_ID',
    'STRAVA_CLIENT_SECRET',
    'REACT_APP_VERSION',
    'OPENAI_API_KEY',
    'CLAUDE_API_KEY'
  ];
  
  // Vérifier les variables critiques
  for (const envVar of criticalEnvVars) {
    if (!process.env[envVar]) {
      errors.push(`Variable d'environnement critique manquante: ${envVar}`);
    }
  }
  
  // Vérifier les variables recommandées
  for (const envVar of recommendedEnvVars) {
    if (!process.env[envVar]) {
      warnings.push(`Variable d'environnement recommandée manquante: ${envVar}`);
    }
  }
  
  // Vérification spécifique pour MONGODB_DB_NAME
  if (process.env.MONGODB_DB_NAME && process.env.MONGODB_DB_NAME !== 'velo-altitude') {
    warnings.push(`MONGODB_DB_NAME est défini comme '${process.env.MONGODB_DB_NAME}' mais devrait être 'velo-altitude'`);
  }
}

// Vérification des dépendances
function checkDependencies() {
  console.log('🔹 Vérification des dépendances...');
  
  // Vérifier la présence de webpack
  try {
    execSync('npx webpack --version', { stdio: 'pipe' });
  } catch (error) {
    errors.push('webpack n\'est pas installé ou n\'est pas accessible');
  }
  
  // Vérifier le fichier package.json
  const packageJsonPath = path.resolve(__dirname, '../package.json');
  if (!fs.existsSync(packageJsonPath)) {
    errors.push('package.json introuvable');
    return;
  }
  
  try {
    const packageJson = require(packageJsonPath);
    
    // Vérifier les scripts nécessaires
    const requiredScripts = ['build', 'clean', 'build:prod'];
    for (const script of requiredScripts) {
      if (!packageJson.scripts || !packageJson.scripts[script]) {
        errors.push(`Script '${script}' manquant dans package.json`);
      }
    }
    
    // Vérifier les dépendances critiques
    const criticalDependencies = ['react', 'webpack', 'mongoose', 'express'];
    for (const dep of criticalDependencies) {
      if (!packageJson.dependencies || !packageJson.dependencies[dep]) {
        if (!packageJson.devDependencies || !packageJson.devDependencies[dep]) {
          errors.push(`Dépendance critique manquante: ${dep}`);
        }
      }
    }
  } catch (error) {
    errors.push(`Erreur lors de la lecture de package.json: ${error.message}`);
  }
}

// Vérification de la structure du projet
function checkProjectStructure() {
  console.log('🔹 Vérification de la structure du projet...');
  
  // Dossiers et fichiers essentiels
  const essentialPaths = [
    { path: '../src', type: 'directory', critical: true },
    { path: '../public', type: 'directory', critical: true },
    { path: '../scripts', type: 'directory', critical: true },
    { path: '../webpack.config.js', type: 'file', critical: true },
    { path: '../netlify.toml', type: 'file', critical: true },
    { path: '../scripts/deploy-complete.js', type: 'file', critical: true },
    { path: '../scripts/post-build.js', type: 'file', critical: true },
    { path: '../public/auth-override.js', type: 'file', critical: false },
    { path: '../public/auth-diagnostic.js', type: 'file', critical: false }
  ];
  
  for (const item of essentialPaths) {
    const fullPath = path.resolve(__dirname, item.path);
    const exists = fs.existsSync(fullPath);
    const isCorrectType = exists && (
      (item.type === 'directory' && fs.statSync(fullPath).isDirectory()) ||
      (item.type === 'file' && fs.statSync(fullPath).isFile())
    );
    
    if (!exists || !isCorrectType) {
      const message = `${item.path} ${exists ? 'n\'est pas un ' + item.type : 'n\'existe pas'}`;
      if (item.critical) {
        errors.push(message);
      } else {
        warnings.push(message);
      }
    }
  }
  
  // Vérifier si le dossier build existe déjà
  const buildDir = path.resolve(__dirname, '../build');
  if (fs.existsSync(buildDir)) {
    warnings.push('Le dossier build existe déjà. Il sera écrasé pendant le déploiement.');
  }
}

// Vérification de la configuration webpack
function checkWebpackConfig() {
  console.log('🔹 Vérification de la configuration webpack...');
  
  const webpackConfigPath = path.resolve(__dirname, '../webpack.config.js');
  if (!fs.existsSync(webpackConfigPath)) {
    errors.push('webpack.config.js introuvable');
    return;
  }
  
  try {
    const webpackConfigContent = fs.readFileSync(webpackConfigPath, 'utf8');
    
    // Vérifications basiques du contenu du fichier webpack.config.js
    if (!webpackConfigContent.includes('output')) {
      warnings.push('La configuration webpack ne semble pas définir de sortie (output)');
    }
    
    if (!webpackConfigContent.includes('module.exports')) {
      warnings.push('La configuration webpack ne semble pas exporter correctement le module');
    }
  } catch (error) {
    errors.push(`Erreur lors de la lecture de webpack.config.js: ${error.message}`);
  }
}

// Vérification de la configuration Netlify
function checkNetlifyConfig() {
  console.log('🔹 Vérification de la configuration Netlify...');
  
  const netlifyTomlPath = path.resolve(__dirname, '../netlify.toml');
  if (!fs.existsSync(netlifyTomlPath)) {
    errors.push('netlify.toml introuvable');
    return;
  }
  
  try {
    const netlifyTomlContent = fs.readFileSync(netlifyTomlPath, 'utf8');
    
    // Vérifier les paramètres essentiels
    if (!netlifyTomlContent.includes('publish = "build"')) {
      errors.push('La configuration Netlify ne définit pas correctement le dossier de publication (publish = "build")');
    }
    
    if (!netlifyTomlContent.includes('command = "npm run build:prod"')) {
      errors.push('La configuration Netlify ne définit pas correctement la commande de build (command = "npm run build:prod")');
    }
  } catch (error) {
    errors.push(`Erreur lors de la lecture de netlify.toml: ${error.message}`);
  }
}

// Afficher le résumé des vérifications
function displaySummary() {
  console.log('\n📋 Résumé des vérifications pré-déploiement:');
  
  if (warnings.length > 0) {
    console.log('\n⚠️ Avertissements:');
    warnings.forEach((warning, index) => {
      console.log(`  ${index + 1}. ${warning}`);
    });
  }
  
  if (errors.length > 0) {
    console.log('\n❌ Erreurs:');
    errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
  }
  
  if (warnings.length === 0 && errors.length === 0) {
    console.log('✅ Aucun problème détecté !');
  }
}

// Exécuter les vérifications
runPreDeploymentChecks();
