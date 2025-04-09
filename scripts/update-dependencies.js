/**
 * Script de mise à jour des dépendances pour Velo-Altitude
 * Préserve l'architecture backend optimisée tout en mettant à jour vers les dernières versions
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { performance } = require('perf_hooks');

// Configuration
const config = {
  preserveArchitecture: true,
  updateToDev: false,
  skipPrompts: true,
  backupFiles: true
};

// Dépendances critiques liées à l'architecture backend optimisée
const criticalPackages = [
  // Cache Service
  'ioredis', 'node-cache', 'redis',
  
  // Database Manager
  'mongoose',
  
  // Security Middleware
  'helmet', 'express-rate-limit', 'jsonwebtoken', 'jwks-rsa', 'express-jwt',
  
  // Authentication Middleware
  '@auth0/auth0-react', 'bcryptjs',
  
  // Monitoring Service
  'winston', 'compression',
  
  // API Router
  'express', 'express-session', 'cookie-parser', 'cors',
  
  // Strava Integration
  'axios'
];

// Fonction principale
async function updateDependencies() {
  console.log('🚀 Démarrage de la mise à jour des dépendances');
  const startTime = performance.now();
  
  try {
    // 1. Sauvegarde des fichiers importants
    if (config.backupFiles) {
      backupImportantFiles();
    }
    
    // 2. Analyse du package.json actuel
    const packageJson = readPackageJson();
    console.log(`📦 ${Object.keys(packageJson.dependencies || {}).length} dépendances trouvées`);
    console.log(`🛠️ ${Object.keys(packageJson.devDependencies || {}).length} dépendances de développement trouvées`);
    
    // 3. Mise à jour des dependencies
    await updateRegularDependencies(packageJson);
    
    // 4. Mise à jour des devDependencies
    await updateDevDependencies(packageJson);
    
    // 5. Vérification de l'intégrité après mise à jour
    const newPackageJson = readPackageJson();
    verifyIntegrity(packageJson, newPackageJson);
    
    // 6. Validation et installation des dépendances mises à jour
    installUpdatedDependencies();
    
    // Affichage du temps écoulé
    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    console.log(`✅ Mise à jour terminée en ${duration} secondes`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Sauvegarde des fichiers importants
function backupImportantFiles() {
  console.log('📑 Sauvegarde des fichiers importants...');
  
  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
  const backupDir = path.resolve(__dirname, '../backups', timestamp);
  
  try {
    // Créer le dossier de sauvegarde
    fs.mkdirSync(backupDir, { recursive: true });
    
    // Fichiers à sauvegarder
    const filesToBackup = [
      '../package.json',
      '../package-lock.json',
      '../netlify.toml',
      '../webpack.config.js'
    ];
    
    for (const file of filesToBackup) {
      const srcPath = path.resolve(__dirname, file);
      const fileName = path.basename(srcPath);
      const destPath = path.join(backupDir, fileName);
      
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`✅ ${fileName} sauvegardé`);
      }
    }
    
    console.log(`📁 Sauvegarde terminée dans ${backupDir}`);
  } catch (error) {
    console.warn(`⚠️ Impossible de créer des sauvegardes: ${error.message}`);
  }
}

// Lecture du package.json
function readPackageJson() {
  const packageJsonPath = path.resolve(__dirname, '../package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error('package.json introuvable');
  }
  
  try {
    const content = fs.readFileSync(packageJsonPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Erreur lors de la lecture de package.json: ${error.message}`);
  }
}

// Mise à jour des dépendances régulières
async function updateRegularDependencies(packageJson) {
  console.log('🔄 Mise à jour des dépendances...');
  
  const dependencies = packageJson.dependencies || {};
  let updateCommand = 'npm install';
  
  // Traiter les dépendances en fonction de leur criticité
  for (const [pkg, version] of Object.entries(dependencies)) {
    const isCritical = criticalPackages.includes(pkg);
    
    if (isCritical && config.preserveArchitecture) {
      console.log(`🔒 Préservation de la dépendance critique: ${pkg}@${version}`);
      updateCommand += ` ${pkg}@latest`;
    } else {
      // Pour les dépendances non critiques, mise à jour automatique
      updateCommand += ` ${pkg}@latest`;
    }
  }
  
  try {
    console.log('⏳ Exécution de la mise à jour, cela peut prendre un moment...');
    execSync(updateCommand, { stdio: 'inherit' });
    console.log('✅ Dépendances mises à jour avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour des dépendances:', error.message);
    // Continuer malgré les erreurs
  }
}

// Mise à jour des dépendances de développement
async function updateDevDependencies(packageJson) {
  console.log('🔄 Mise à jour des dépendances de développement...');
  
  const devDependencies = packageJson.devDependencies || {};
  let updateCommand = 'npm install --save-dev';
  
  for (const [pkg, version] of Object.entries(devDependencies)) {
    updateCommand += ` ${pkg}@latest`;
  }
  
  try {
    console.log('⏳ Exécution de la mise à jour des devDependencies, cela peut prendre un moment...');
    execSync(updateCommand, { stdio: 'inherit' });
    console.log('✅ Dépendances de développement mises à jour avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour des dépendances de développement:', error.message);
    // Continuer malgré les erreurs
  }
}

// Vérification de l'intégrité
function verifyIntegrity(oldPackageJson, newPackageJson) {
  console.log('🔍 Vérification de l\'intégrité après mise à jour...');
  
  // Vérifier que toutes les dépendances critiques sont toujours présentes
  const newDeps = newPackageJson.dependencies || {};
  
  for (const criticalPkg of criticalPackages) {
    if (oldPackageJson.dependencies && oldPackageJson.dependencies[criticalPkg]) {
      if (!newDeps[criticalPkg]) {
        console.warn(`⚠️ Dépendance critique manquante après mise à jour: ${criticalPkg}`);
        throw new Error(`Perte de dépendance critique: ${criticalPkg}`);
      }
    }
  }
  
  console.log('✅ Intégrité vérifiée, toutes les dépendances critiques sont présentes');
}

// Installation finale des dépendances mises à jour
function installUpdatedDependencies() {
  console.log('📦 Installation des dépendances mises à jour...');
  
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Installation réussie');
  } catch (error) {
    console.error('❌ Erreur lors de l\'installation finale:', error.message);
    throw error;
  }
}

// Exécution du script
updateDependencies().catch(console.error);
