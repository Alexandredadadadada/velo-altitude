/**
 * Script de validation du projet Velo-Altitude
 * Ce script vérifie que la structure et la configuration du projet sont cohérentes
 * pour éviter les problèmes de déploiement.
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Configuration
const PROJECT_ROOT = path.resolve(__dirname, '../');
const CLIENT_ROOT = path.join(PROJECT_ROOT, 'client');
const SERVER_ROOT = path.join(PROJECT_ROOT, 'server');

// État de la validation
const validationState = {
  success: true,
  errors: [],
  warnings: [],
  info: []
};

/**
 * Point d'entrée principal
 */
async function validateProject() {
  console.log(chalk.blue('🔍 VELO-ALTITUDE - VALIDATION DU PROJET'));
  console.log(chalk.blue('=========================================\n'));

  try {
    // Vérifier la structure du projet
    validateProjectStructure();
    
    // Vérifier les fichiers de configuration
    validateConfigurationFiles();
    
    // Vérifier le système d'authentification
    validateAuthSystem();
    
    // Vérifier les dépendances
    validateDependencies();
    
    // Vérifier les variables d'environnement
    validateEnvironmentVariables();
    
    // Afficher le résultat
    showValidationResults();
    
    // Retourner l'état
    return validationState;
  } catch (error) {
    console.error(chalk.red(`\n❌ Erreur inattendue: ${error.message}`));
    console.error(error.stack);
    process.exit(1);
  }
}

/**
 * Vérifie la structure du projet
 */
function validateProjectStructure() {
  console.log(chalk.yellow('\n📁 Vérification de la structure du projet...'));
  
  // Vérifier les dossiers principaux
  checkDirectory(CLIENT_ROOT, 'Client');
  checkDirectory(SERVER_ROOT, 'Server');
  
  // Vérifier les sous-dossiers du client
  const clientSubdirs = [
    'src/components', 
    'src/pages', 
    'src/assets',
    'src/auth',
    'src/services',
    'src/hooks',
    'public'
  ];
  
  clientSubdirs.forEach(dir => {
    checkDirectory(path.join(CLIENT_ROOT, dir), `Client/${dir}`);
  });

  // Vérifier si le fichier auth-override.js existe
  const authOverridePath = path.join(CLIENT_ROOT, 'public', 'auth-override.js');
  if (!fs.existsSync(authOverridePath)) {
    validationState.errors.push('Le fichier auth-override.js est manquant dans client/public/');
  } else {
    validationState.info.push('✅ Fichier auth-override.js présent');
  }
}

/**
 * Vérifie si un dossier existe
 */
function checkDirectory(dirPath, label) {
  if (!fs.existsSync(dirPath)) {
    validationState.errors.push(`Dossier ${label} manquant: ${dirPath}`);
    validationState.success = false;
    return false;
  }

  validationState.info.push(`✅ Dossier ${label} présent`);
  return true;
}

/**
 * Vérifie les fichiers de configuration
 */
function validateConfigurationFiles() {
  console.log(chalk.yellow('\n📄 Vérification des fichiers de configuration...'));
  
  // Vérifier package.json du client
  const clientPackageJsonPath = path.join(CLIENT_ROOT, 'package.json');
  if (fs.existsSync(clientPackageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(clientPackageJsonPath, 'utf8'));
      
      // Vérifier les scripts essentiels
      if (!packageJson.scripts || !packageJson.scripts.build) {
        validationState.errors.push('Script de build manquant dans client/package.json');
      }
      
      validationState.info.push('✅ package.json du client valide');
    } catch (error) {
      validationState.errors.push(`Erreur de parsing du package.json client: ${error.message}`);
    }
  } else {
    validationState.errors.push('package.json manquant dans le dossier client');
  }
  
  // Vérifier netlify.toml
  const netlifyTomlPath = path.join(PROJECT_ROOT, 'netlify.toml');
  if (fs.existsSync(netlifyTomlPath)) {
    const netlifyToml = fs.readFileSync(netlifyTomlPath, 'utf8');
    
    // Vérifier les configurations essentielles
    if (!netlifyToml.includes('[build]')) {
      validationState.errors.push('Configuration [build] manquante dans netlify.toml');
    }
    
    if (!netlifyToml.includes('[[redirects]]')) {
      validationState.warnings.push('Configuration [[redirects]] manquante dans netlify.toml');
    }
    
    validationState.info.push('✅ netlify.toml présent');
  } else {
    validationState.errors.push('netlify.toml manquant à la racine du projet');
  }
  
  // Vérifier les fichiers de déploiement redondants
  const deployScripts = fs.readdirSync(PROJECT_ROOT)
    .filter(file => file.startsWith('deploy-') && file !== 'deploy-complete.js');
  
  if (deployScripts.length > 0) {
    validationState.warnings.push(`Scripts de déploiement redondants détectés: ${deployScripts.join(', ')}`);
  } else {
    validationState.info.push('✅ Pas de scripts de déploiement redondants');
  }
}

/**
 * Vérifie le système d'authentification
 */
function validateAuthSystem() {
  console.log(chalk.yellow('\n🔐 Vérification du système d\'authentification...'));
  
  // Vérifier les composants d'authentification nécessaires
  const authFiles = [
    { path: path.join(CLIENT_ROOT, 'src/auth/AuthCore.js'), required: true },
    { path: path.join(CLIENT_ROOT, 'src/auth/AuthUnified.js'), required: true },
    { path: path.join(CLIENT_ROOT, 'src/auth/ProtectedRoute.jsx'), required: true },
    { path: path.join(CLIENT_ROOT, 'src/auth/AuthenticationWrapper.jsx'), required: true },
    { path: path.join(CLIENT_ROOT, 'public/auth-override.js'), required: true }
  ];
  
  let authSystemValid = true;
  
  authFiles.forEach(file => {
    if (fs.existsSync(file.path)) {
      validationState.info.push(`✅ Fichier d'authentification présent: ${path.basename(file.path)}`);
    } else if (file.required) {
      validationState.errors.push(`Fichier d'authentification requis manquant: ${file.path}`);
      authSystemValid = false;
    } else {
      validationState.warnings.push(`Fichier d'authentification optionnel manquant: ${file.path}`);
    }
  });
  
  // Vérifier l'intégration de Auth0
  const authConfigPath = path.join(CLIENT_ROOT, 'src/config/auth.config.js');
  if (fs.existsSync(authConfigPath)) {
    validationState.info.push('✅ Configuration Auth0 présente');
  } else {
    validationState.warnings.push('Configuration Auth0 non trouvée');
  }
  
  // Vérifier si Router est enveloppé par AuthProvider
  // Note: ceci est une vérification simplifiée, une analyse AST serait plus précise
  const appJsPath = path.join(CLIENT_ROOT, 'src/App.js');
  if (fs.existsSync(appJsPath)) {
    const appJsContent = fs.readFileSync(appJsPath, 'utf8');
    
    if (appJsContent.includes('AuthProvider') && 
        appJsContent.match(/\bAuthProvider\b.*\bRouter\b/s)) {
      validationState.info.push('✅ Router est correctement enveloppé par AuthProvider');
    } else {
      validationState.warnings.push('Router ne semble pas être enveloppé par AuthProvider');
    }
  }
  
  if (authSystemValid) {
    validationState.info.push('✅ Système d\'authentification complet');
  } else {
    validationState.errors.push('❌ Système d\'authentification incomplet');
  }
}

/**
 * Vérifie les dépendances
 */
function validateDependencies() {
  console.log(chalk.yellow('\n📦 Vérification des dépendances...'));
  
  if (!fs.existsSync(path.join(CLIENT_ROOT, 'package.json'))) {
    validationState.errors.push('package.json manquant dans le dossier client');
    return;
  }
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(CLIENT_ROOT, 'package.json'), 'utf8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    // Vérifier les dépendances conflictuelles
    if (deps['next'] && deps['react-scripts']) {
      validationState.errors.push('Conflit détecté: Next.js et Create React App sont utilisés simultanément');
    }
    
    // Vérifier les dépendances essentielles
    const essentialDeps = [
      'react', 'react-dom', 'react-router-dom', 
      '@auth0/auth0-react', '@mui/material'
    ];
    
    const missingDeps = essentialDeps.filter(dep => !deps[dep]);
    
    if (missingDeps.length > 0) {
      validationState.errors.push(`Dépendances essentielles manquantes: ${missingDeps.join(', ')}`);
    } else {
      validationState.info.push('✅ Toutes les dépendances essentielles sont présentes');
    }
    
    // Vérifier les versions Node et npm
    const engines = packageJson.engines || {};
    if (!engines.node) {
      validationState.warnings.push('Version de Node.js non spécifiée dans package.json');
    }
    
    if (!engines.npm) {
      validationState.warnings.push('Version de npm non spécifiée dans package.json');
    }
  } catch (error) {
    validationState.errors.push(`Erreur lors de la vérification des dépendances: ${error.message}`);
  }
}

/**
 * Vérifie les variables d'environnement
 */
function validateEnvironmentVariables() {
  console.log(chalk.yellow('\n🔧 Vérification des variables d\'environnement...'));
  
  // Vérifier le fichier .env dans client
  const envPath = path.join(CLIENT_ROOT, '.env');
  const envProdPath = path.join(CLIENT_ROOT, '.env.production');
  
  if (!fs.existsSync(envPath) && !fs.existsSync(envProdPath)) {
    validationState.warnings.push('Aucun fichier .env trouvé dans le dossier client');
    return;
  }
  
  // Liste des variables d'environnement requises pour Auth0
  const requiredAuthVars = [
    'REACT_APP_AUTH0_DOMAIN',
    'REACT_APP_AUTH0_CLIENT_ID',
    'REACT_APP_AUTH0_AUDIENCE'
  ];
  
  // Liste des variables d'environnement requises pour les API
  const requiredApiVars = [
    'REACT_APP_MAPBOX_TOKEN',
    'REACT_APP_WEATHER_API_KEY'
  ];
  
  // Vérifier les variables d'environnement dans .env
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    const missingAuthVars = requiredAuthVars.filter(v => !envContent.includes(v));
    if (missingAuthVars.length > 0) {
      validationState.warnings.push(`Variables Auth0 manquantes dans .env: ${missingAuthVars.join(', ')}`);
    } else {
      validationState.info.push('✅ Variables Auth0 présentes dans .env');
    }
    
    const missingApiVars = requiredApiVars.filter(v => !envContent.includes(v));
    if (missingApiVars.length > 0) {
      validationState.warnings.push(`Variables API manquantes dans .env: ${missingApiVars.join(', ')}`);
    } else {
      validationState.info.push('✅ Variables API présentes dans .env');
    }
  }
  
  // Vérifier les variables d'environnement dans .env.production
  if (fs.existsSync(envProdPath)) {
    const envProdContent = fs.readFileSync(envProdPath, 'utf8');
    
    const missingAuthVars = requiredAuthVars.filter(v => !envProdContent.includes(v));
    if (missingAuthVars.length > 0) {
      validationState.warnings.push(`Variables Auth0 manquantes dans .env.production: ${missingAuthVars.join(', ')}`);
    } else {
      validationState.info.push('✅ Variables Auth0 présentes dans .env.production');
    }
    
    const missingApiVars = requiredApiVars.filter(v => !envProdContent.includes(v));
    if (missingApiVars.length > 0) {
      validationState.warnings.push(`Variables API manquantes dans .env.production: ${missingApiVars.join(', ')}`);
    } else {
      validationState.info.push('✅ Variables API présentes dans .env.production');
    }
  }
}

/**
 * Affiche les résultats de la validation
 */
function showValidationResults() {
  console.log(chalk.blue('\n📊 RÉSULTATS DE LA VALIDATION'));
  console.log(chalk.blue('==============================\n'));
  
  if (validationState.errors.length > 0) {
    console.log(chalk.red('❌ ERREURS:'));
    validationState.errors.forEach(error => {
      console.log(chalk.red(`  - ${error}`));
    });
    console.log('');
  }
  
  if (validationState.warnings.length > 0) {
    console.log(chalk.yellow('⚠️ AVERTISSEMENTS:'));
    validationState.warnings.forEach(warning => {
      console.log(chalk.yellow(`  - ${warning}`));
    });
    console.log('');
  }
  
  if (validationState.info.length > 0) {
    console.log(chalk.green('ℹ️  INFORMATIONS:'));
    validationState.info.forEach(info => {
      console.log(chalk.green(`  - ${info}`));
    });
    console.log('');
  }
  
  if (validationState.success && validationState.errors.length === 0) {
    console.log(chalk.green('✅ VALIDATION RÉUSSIE: Le projet est prêt pour le déploiement!'));
  } else {
    console.log(chalk.red('❌ VALIDATION ÉCHOUÉE: Des problèmes doivent être résolus avant le déploiement.'));
  }
}

// Exécuter la validation
validateProject();
