#!/usr/bin/env node
/**
 * Script de vérification pré-build pour Netlify
 * Vérifie que toutes les conditions sont réunies pour un build réussi
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Démarrage des vérifications pré-build pour Netlify...');

// Chemins importants
const rootDir = process.cwd();
const buildDir = path.join(rootDir, 'build');
const nodeModulesDir = path.join(rootDir, 'node_modules');

// Vérification des variables d'environnement critiques
const requiredEnvVars = [
  'NODE_ENV',
  'REACT_APP_API_URL',
  'REACT_APP_BASE_URL'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.log(`⚠️ Variables d'environnement manquantes: ${missingEnvVars.join(', ')}`);
  // Définir des valeurs par défaut pour éviter les erreurs
  process.env.NODE_ENV = process.env.NODE_ENV || 'production';
  process.env.REACT_APP_API_URL = process.env.REACT_APP_API_URL || '/api';
  process.env.REACT_APP_BASE_URL = process.env.REACT_APP_BASE_URL || 'https://velo-altitude.com';
  console.log('✅ Valeurs par défaut définies pour les variables manquantes');
}

// S'assurer que node_modules existe
if (!fs.existsSync(nodeModulesDir)) {
  console.log('⚠️ Répertoire node_modules manquant, installation des dépendances...');
  try {
    execSync('npm ci', { stdio: 'inherit' });
    console.log('✅ Dépendances installées avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de l\'installation des dépendances:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ Répertoire node_modules présent');
}

// Vérifier la présence de fichiers importants
const criticalFiles = [
  'package.json',
  'webpack.config.js',
  'src/index.js',
  'public/index.html'
];

const missingFiles = criticalFiles.filter(file => !fs.existsSync(path.join(rootDir, file)));

if (missingFiles.length > 0) {
  console.error(`❌ Fichiers critiques manquants: ${missingFiles.join(', ')}`);
  process.exit(1);
}

console.log('✅ Tous les fichiers critiques sont présents');

// Nettoyer le répertoire de build s'il existe
if (fs.existsSync(buildDir)) {
  console.log('🧹 Nettoyage du répertoire de build...');
  try {
    fs.rmSync(buildDir, { recursive: true, force: true });
    console.log('✅ Répertoire de build nettoyé');
  } catch (error) {
    console.warn(`⚠️ Impossible de nettoyer le répertoire de build: ${error.message}`);
    // Ne pas échouer si le nettoyage ne fonctionne pas
  }
}

// Créer le fichier .env.production pour être sûr
const envFilePath = path.join(rootDir, '.env.production');
const envFileContent = `
NODE_ENV=production
CI=
REACT_APP_API_URL=${process.env.REACT_APP_API_URL || '/api'}
REACT_APP_BASE_URL=${process.env.REACT_APP_BASE_URL || 'https://velo-altitude.com'}
REACT_APP_VERSION=${process.env.REACT_APP_VERSION || '2.1.0'}
REACT_APP_BRAND_NAME=${process.env.REACT_APP_BRAND_NAME || 'Velo-Altitude'}
GENERATE_SOURCEMAP=false
DISABLE_ESLINT_PLUGIN=true
`;

fs.writeFileSync(envFilePath, envFileContent.trim());
console.log('✅ Fichier .env.production créé/mis à jour');

// Vérifier le package.json pour s'assurer que les scripts nécessaires existent
try {
  const packageJsonPath = path.join(rootDir, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  if (!packageJson.scripts || !packageJson.scripts.build) {
    console.error('❌ Script "build" manquant dans package.json');
    process.exit(1);
  }
  
  console.log('✅ Scripts nécessaires présents dans package.json');
} catch (error) {
  console.error('❌ Erreur lors de la lecture de package.json:', error.message);
  process.exit(1);
}

console.log('🎉 Vérifications pré-build terminées avec succès!');
console.log('🚀 Prêt pour le build de production');

process.exit(0); // Sortie réussie
