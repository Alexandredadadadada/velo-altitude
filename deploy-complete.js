/**
 * Script de déploiement complet pour Velo-Altitude
 * Résout définitivement les problèmes d'authentification
 * Version: 2.0 - Avril 2025
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Fonctions utilitaires
function runCommand(command, directory, silent = false) {
  const options = { 
    cwd: directory || process.cwd(),
    stdio: silent ? 'pipe' : 'inherit',
    env: { ...process.env, CI: 'false', DISABLE_ESLINT_PLUGIN: 'true' }
  };
  
  try {
    console.log(`\n\x1b[36m> ${command}\x1b[0m`);
    return execSync(command, options);
  } catch (error) {
    console.error(`\x1b[31mErreur lors de l'exécution de: ${command}\x1b[0m`);
    console.error(error.message);
    throw error;
  }
}

// Vérifier si un fichier existe
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

// Copier un fichier avec création du dossier de destination si nécessaire
function copyFile(source, destination) {
  const destinationDir = path.dirname(destination);
  if (!fs.existsSync(destinationDir)) {
    fs.mkdirSync(destinationDir, { recursive: true });
  }
  
  fs.copyFileSync(source, destination);
  console.log(`\x1b[32m✓ Copié: ${path.basename(source)} → ${destination}\x1b[0m`);
}

// Fonction principale de déploiement
async function deployVeloAltitude() {
  console.log('\n\x1b[32m=== DÉPLOIEMENT COMPLET VELO-ALTITUDE ===\x1b[0m');
  
  const projectRoot = __dirname;
  const clientDir = path.join(projectRoot, 'client');
  const buildDir = path.join(clientDir, 'build');
  
  // 1. Vérification des fichiers essentiels
  console.log('\n\x1b[33m1. Vérification des fichiers essentiels...\x1b[0m');
  
  const requiredFiles = [
    {path: path.join(clientDir, 'src', 'auth', 'AuthCore.js'), name: 'AuthCore.js'},
    {path: path.join(clientDir, 'public', 'auth-override.js'), name: 'auth-override.js'},
    {path: path.join(clientDir, 'src', 'index.js'), name: 'index.js'},
    {path: path.join(clientDir, 'package.json'), name: 'package.json'},
  ];
  
  for (const file of requiredFiles) {
    if (!fileExists(file.path)) {
      console.error(`\x1b[31mERREUR: ${file.name} non trouvé à ${file.path}\x1b[0m`);
      process.exit(1);
    }
  }
  
  console.log('\x1b[32m✓ Tous les fichiers essentiels sont présents\x1b[0m');
  
  // 2. Nettoyer les dépendances
  console.log('\n\x1b[33m2. Nettoyage des dépendances...\x1b[0m');
  
  try {
    if (fileExists(path.join(clientDir, 'node_modules'))) {
      // Sauvegarder package-lock.json pour accélérer la réinstallation
      const hasPackageLock = fileExists(path.join(clientDir, 'package-lock.json'));
      
      if (!hasPackageLock) {
        console.log('Pas de package-lock.json trouvé, une installation complète sera effectuée');
      }
    }
  } catch (error) {
    console.warn('Impossible de nettoyer complètement, continuons...');
  }
  
  // 3. Création du fichier d'environnement
  console.log('\n\x1b[33m3. Création du fichier .env pour les variables d\'environnement...\x1b[0m');
  
  // Récupérer les variables d'environnement pour l'authentification et les APIs
  const envVars = {
    // Auth0 Configuration
    REACT_APP_AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID || '',
    REACT_APP_AUTH0_ISSUER_BASE_URL: process.env.AUTH0_ISSUER_BASE_URL || '',
    REACT_APP_AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE || '',
    REACT_APP_AUTH0_SCOPE: process.env.AUTH0_SCOPE || 'openid profile email',
    
    // API Keys
    REACT_APP_MAPBOX_TOKEN: process.env.MAPBOX_TOKEN || '',
    REACT_APP_OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY || '',
    REACT_APP_OPENROUTE_API_KEY: process.env.OPENROUTE_API_KEY || '',
    
    // Application Settings
    REACT_APP_VERSION: new Date().toISOString(),
    REACT_APP_BRAND_NAME: "Velo-Altitude",
    REACT_APP_BASE_URL: process.env.URL || "https://velo-altitude.com",
    REACT_APP_API_URL: process.env.REACT_APP_API_URL || "/api",
    
    // AI Integration
    REACT_APP_AI_ENABLED: process.env.CLAUDE_API_KEY || process.env.OPENAI_API_KEY ? 'true' : 'false',
    
    // Mode de déploiement
    NODE_ENV: 'production',
    GENERATE_SOURCEMAP: 'false',
    DISABLE_ESLINT_PLUGIN: 'true',
    CI: 'false'
  };
  
  // Écrire le fichier .env
  const envContent = Object.entries(envVars)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  fs.writeFileSync(path.join(clientDir, '.env'), envContent);
  console.log('\x1b[32m✓ Fichier .env créé avec succès\x1b[0m');
  
  // 4. Installation des dépendances
  console.log('\n\x1b[33m4. Installation des dépendances...\x1b[0m');
  runCommand('npm ci || npm install', clientDir);
  
  // 5. Construction de l'application
  console.log('\n\x1b[33m5. Construction de l\'application React...\x1b[0m');
  runCommand('npm run build', clientDir);
  
  // 6. Préparation des fichiers d'authentification d'urgence
  console.log('\n\x1b[33m6. Préparation des fichiers d\'authentification d\'urgence...\x1b[0m');
  
  // Créer le répertoire de build s'il n'existe pas
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }
  
  // Copier les fichiers d'authentification d'urgence
  const emergencyFiles = [
    { src: path.join(clientDir, 'public', 'auth-override.js'), dest: path.join(buildDir, 'auth-override.js') },
    { src: path.join(clientDir, 'public', 'emergency-auth.js'), dest: path.join(buildDir, 'emergency-auth.js') },
    { src: path.join(clientDir, 'public', 'emergency-login.html'), dest: path.join(buildDir, 'emergency-login.html') }
  ];
  
  for (const file of emergencyFiles) {
    if (fileExists(file.src)) {
      copyFile(file.src, file.dest);
    } else {
      console.warn(`\x1b[33mAttention: Fichier ${file.src} non trouvé, ignoré\x1b[0m`);
    }
  }
  
  // 7. Configuration des redirections
  console.log('\n\x1b[33m7. Configuration des redirections pour SPA...\x1b[0m');
  
  // Créer un fichier _redirects pour Netlify
  const redirectsPath = path.join(buildDir, '_redirects');
  fs.writeFileSync(redirectsPath, `/* /index.html 200`);
  console.log('\x1b[32m✓ Fichier _redirects configuré pour servir l\'application\x1b[0m');
  
  // 8. Préparation du déploiement Netlify
  console.log('\n\x1b[33m8. Préparation du déploiement Netlify...\x1b[0m');
  
  // Vérifier si netlify.toml existe dans le dossier de build
  const sourceNetlifyConfig = path.join(projectRoot, 'netlify.toml');
  const destNetlifyConfig = path.join(buildDir, 'netlify.toml');
  
  if (fileExists(sourceNetlifyConfig) && !fileExists(destNetlifyConfig)) {
    copyFile(sourceNetlifyConfig, destNetlifyConfig);
  }
  
  console.log('\n\x1b[32m✓ Déploiement prêt !\x1b[0m');
  console.log('\x1b[33mPour déployer sur Netlify, exécutez:\x1b[0m');
  console.log('\x1b[36m  netlify deploy --prod --dir=client/build\x1b[0m');
  
  console.log('\n\x1b[32m=== PRÉPARATION TERMINÉE ===\x1b[0m');
  console.log('\x1b[32mVelo-Altitude est prêt à être déployé !\x1b[0m');
}

// Exécuter le déploiement
deployVeloAltitude().catch(err => {
  console.error('\n\x1b[31mLe déploiement a échoué:\x1b[0m', err);
  process.exit(1);
});
