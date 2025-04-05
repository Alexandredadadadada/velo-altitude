/**
 * Script de vérification des dépendances
 * 
 * Ce script vérifie que toutes les dépendances nécessaires sont installées
 * et que les versions sont compatibles. Il génère un rapport des dépendances
 * manquantes ou obsolètes.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Dépendances critiques pour le fonctionnement du serveur
const criticalDependencies = [
  'express',
  'mongoose',
  'jsonwebtoken',
  'bcryptjs',
  'cookie-parser',
  'dotenv',
  'cors',
  'helmet',
  'winston',
  'express-rate-limit',
  'express-validator',
  'jwt-decode'
];

// Dépendances recommandées mais non critiques
const recommendedDependencies = [
  'compression',
  'node-cache',
  'uuid',
  'moment',
  'crypto-js',
  'express-jwt',
  'express-async-errors',
  'http-status-codes',
  'winston-daily-rotate-file'
];

// Dépendances client critiques
const clientCriticalDependencies = [
  'react',
  'react-dom',
  'react-router-dom',
  'axios',
  '@mui/material',
  '@mui/icons-material',
  'react-hook-form',
  'framer-motion'
];

// Dépendances client recommandées
const clientRecommendedDependencies = [
  'react-query',
  'notistack',
  'jwt-decode',
  'date-fns',
  'react-error-boundary',
  'react-helmet-async'
];

// Versions minimales requises pour certaines dépendances
const minVersions = {
  'express': '4.17.1',
  'mongoose': '6.0.0',
  'jsonwebtoken': '8.5.1',
  'react': '17.0.0',
  'react-router-dom': '6.0.0',
  '@mui/material': '5.0.0',
  'axios': '0.21.0',
  'express-rate-limit': '6.0.0',
  'helmet': '5.0.0'
};

/**
 * Vérifie si une dépendance est installée
 * @param {string} dependency - Nom de la dépendance
 * @returns {boolean} - True si installée
 */
function isDependencyInstalled(dependency) {
  try {
    // Essayer de résoudre le module
    require.resolve(dependency);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Obtient la version installée d'une dépendance
 * @param {string} dependency - Nom de la dépendance
 * @returns {string|null} - Version ou null si non installée
 */
function getInstalledVersion(dependency) {
  try {
    const packageJsonPath = require.resolve(`${dependency}/package.json`);
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    return packageJson.version;
  } catch (error) {
    return null;
  }
}

/**
 * Compare deux versions sémantiques
 * @param {string} v1 - Première version
 * @param {string} v2 - Deuxième version
 * @returns {number} - -1 si v1 < v2, 0 si v1 = v2, 1 si v1 > v2
 */
function compareVersions(v1, v2) {
  const v1Parts = v1.split('.').map(Number);
  const v2Parts = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const v1Part = v1Parts[i] || 0;
    const v2Part = v2Parts[i] || 0;
    
    if (v1Part > v2Part) return 1;
    if (v1Part < v2Part) return -1;
  }
  
  return 0;
}

/**
 * Vérifie si une version est obsolète
 * @param {string} currentVersion - Version actuelle
 * @param {string} latestVersion - Dernière version
 * @returns {boolean} - True si obsolète
 */
function isVersionOutdated(currentVersion, latestVersion) {
  if (!currentVersion || !latestVersion) return false;
  return compareVersions(currentVersion, latestVersion) < 0;
}

/**
 * Vérifie si une version est inférieure à la version minimale requise
 * @param {string} currentVersion - Version actuelle
 * @param {string} minVersion - Version minimale requise
 * @returns {boolean} - True si la version est trop ancienne
 */
function isBelowMinVersion(currentVersion, minVersion) {
  if (!currentVersion || !minVersion) return false;
  return compareVersions(currentVersion, minVersion) < 0;
}

/**
 * Obtient la dernière version disponible d'une dépendance
 * @param {string} dependency - Nom de la dépendance
 * @returns {string|null} - Dernière version ou null en cas d'erreur
 */
function getLatestVersion(dependency) {
  try {
    const output = execSync(`npm view ${dependency} version`, { encoding: 'utf8' });
    return output.trim();
  } catch (error) {
    console.error(`Erreur lors de la récupération de la version de ${dependency}:`, error.message);
    return null;
  }
}

/**
 * Vérifie les dépendances du projet
 */
function checkDependencies() {
  console.log(`${colors.cyan}=== Vérification des dépendances ====${colors.reset}\n`);
  
  const serverPackageJsonPath = path.join(__dirname, '..', 'server', 'package.json');
  const clientPackageJsonPath = path.join(__dirname, '..', 'client', 'package.json');
  const rootPackageJsonPath = path.join(__dirname, '..', 'package.json');
  
  let serverPackageJson, clientPackageJson, rootPackageJson;
  
  // Vérifier les package.json
  try {
    if (fs.existsSync(serverPackageJsonPath)) {
      serverPackageJson = JSON.parse(fs.readFileSync(serverPackageJsonPath, 'utf8'));
      console.log(`${colors.green}✓ package.json du serveur trouvé${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠ package.json du serveur non trouvé${colors.reset}`);
    }
    
    if (fs.existsSync(clientPackageJsonPath)) {
      clientPackageJson = JSON.parse(fs.readFileSync(clientPackageJsonPath, 'utf8'));
      console.log(`${colors.green}✓ package.json du client trouvé${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠ package.json du client non trouvé${colors.reset}`);
    }
    
    if (fs.existsSync(rootPackageJsonPath)) {
      rootPackageJson = JSON.parse(fs.readFileSync(rootPackageJsonPath, 'utf8'));
      console.log(`${colors.green}✓ package.json racine trouvé${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠ package.json racine non trouvé${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.red}Erreur lors de la lecture des fichiers package.json:${colors.reset}`, error.message);
    process.exit(1);
  }
  
  // Fusionner les dépendances déclarées
  const serverDependencies = serverPackageJson ? { 
    ...serverPackageJson.dependencies || {}, 
    ...serverPackageJson.devDependencies || {} 
  } : {};
  
  const clientDependencies = clientPackageJson ? { 
    ...clientPackageJson.dependencies || {}, 
    ...clientPackageJson.devDependencies || {} 
  } : {};
  
  const rootDependencies = rootPackageJson ? { 
    ...rootPackageJson.dependencies || {}, 
    ...rootPackageJson.devDependencies || {} 
  } : {};
  
  // Fusionner toutes les dépendances
  const allDependencies = {
    ...serverDependencies,
    ...clientDependencies,
    ...rootDependencies
  };
  
  // Résultats
  const missing = [];
  const outdated = [];
  const tooOld = [];
  const ok = [];
  
  // Vérifier les dépendances serveur critiques
  console.log(`\n${colors.magenta}Vérification des dépendances serveur critiques...${colors.reset}`);
  criticalDependencies.forEach(dep => {
    const isDeclared = dep in serverDependencies || dep in rootDependencies;
    const isInstalled = isDependencyInstalled(dep);
    
    if (!isDeclared) {
      missing.push({ name: dep, type: 'server-critical', declared: false, installed: isInstalled });
    } else if (!isInstalled) {
      missing.push({ name: dep, type: 'server-critical', declared: true, installed: false });
    } else {
      const currentVersion = getInstalledVersion(dep);
      const latestVersion = getLatestVersion(dep);
      
      // Vérifier si la version est trop ancienne
      if (dep in minVersions && isBelowMinVersion(currentVersion, minVersions[dep])) {
        tooOld.push({ 
          name: dep, 
          type: 'server-critical', 
          current: currentVersion, 
          required: minVersions[dep] 
        });
      }
      // Vérifier si la version est obsolète
      else if (isVersionOutdated(currentVersion, latestVersion)) {
        outdated.push({ 
          name: dep, 
          type: 'server-critical', 
          current: currentVersion, 
          latest: latestVersion 
        });
      } else {
        ok.push({ name: dep, type: 'server-critical', version: currentVersion });
      }
    }
  });
  
  // Vérifier les dépendances serveur recommandées
  console.log(`${colors.magenta}Vérification des dépendances serveur recommandées...${colors.reset}`);
  recommendedDependencies.forEach(dep => {
    const isDeclared = dep in serverDependencies || dep in rootDependencies;
    const isInstalled = isDependencyInstalled(dep);
    
    if (!isDeclared) {
      missing.push({ name: dep, type: 'server-recommended', declared: false, installed: isInstalled });
    } else if (!isInstalled) {
      missing.push({ name: dep, type: 'server-recommended', declared: true, installed: false });
    } else {
      const currentVersion = getInstalledVersion(dep);
      const latestVersion = getLatestVersion(dep);
      
      // Vérifier si la version est trop ancienne
      if (dep in minVersions && isBelowMinVersion(currentVersion, minVersions[dep])) {
        tooOld.push({ 
          name: dep, 
          type: 'server-recommended', 
          current: currentVersion, 
          required: minVersions[dep] 
        });
      }
      // Vérifier si la version est obsolète
      else if (isVersionOutdated(currentVersion, latestVersion)) {
        outdated.push({ 
          name: dep, 
          type: 'server-recommended', 
          current: currentVersion, 
          latest: latestVersion 
        });
      } else {
        ok.push({ name: dep, type: 'server-recommended', version: currentVersion });
      }
    }
  });
  
  // Vérifier les dépendances client critiques
  if (clientPackageJson) {
    console.log(`${colors.magenta}Vérification des dépendances client critiques...${colors.reset}`);
    clientCriticalDependencies.forEach(dep => {
      const isDeclared = dep in clientDependencies;
      
      if (!isDeclared) {
        missing.push({ name: dep, type: 'client-critical', declared: false, installed: false });
      } else {
        const declaredVersion = clientDependencies[dep];
        
        // Vérifier si la version est trop ancienne
        if (dep in minVersions) {
          const versionWithoutPrefix = declaredVersion.replace(/^\^|~/, '');
          if (isBelowMinVersion(versionWithoutPrefix, minVersions[dep])) {
            tooOld.push({ 
              name: dep, 
              type: 'client-critical', 
              current: versionWithoutPrefix, 
              required: minVersions[dep] 
            });
          } else {
            ok.push({ name: dep, type: 'client-critical', version: declaredVersion });
          }
        } else {
          ok.push({ name: dep, type: 'client-critical', version: declaredVersion });
        }
      }
    });
    
    // Vérifier les dépendances client recommandées
    console.log(`${colors.magenta}Vérification des dépendances client recommandées...${colors.reset}`);
    clientRecommendedDependencies.forEach(dep => {
      const isDeclared = dep in clientDependencies;
      
      if (!isDeclared) {
        missing.push({ name: dep, type: 'client-recommended', declared: false, installed: false });
      } else {
        const declaredVersion = clientDependencies[dep];
        ok.push({ name: dep, type: 'client-recommended', version: declaredVersion });
      }
    });
  }
  
  // Afficher les résultats
  console.log('\n=== Résultats ===\n');
  
  // Dépendances manquantes
  if (missing.length > 0) {
    console.log(`${colors.red}Dépendances manquantes:${colors.reset}`);
    missing.forEach(dep => {
      let status = '';
      if (dep.type === 'server-critical') status = 'Serveur CRITIQUE';
      else if (dep.type === 'server-recommended') status = 'Serveur Recommandée';
      else if (dep.type === 'client-critical') status = 'Client CRITIQUE';
      else if (dep.type === 'client-recommended') status = 'Client Recommandée';
      
      const details = dep.declared 
        ? 'Déclarée dans package.json mais non installée' 
        : 'Non déclarée dans package.json';
      console.log(`  - ${dep.name} (${status}): ${details}`);
    });
    console.log('');
  }
  
  // Dépendances trop anciennes
  if (tooOld.length > 0) {
    console.log(`${colors.red}Dépendances trop anciennes (version minimale requise non atteinte):${colors.reset}`);
    tooOld.forEach(dep => {
      let status = '';
      if (dep.type === 'server-critical') status = 'Serveur CRITIQUE';
      else if (dep.type === 'server-recommended') status = 'Serveur Recommandée';
      else if (dep.type === 'client-critical') status = 'Client CRITIQUE';
      else if (dep.type === 'client-recommended') status = 'Client Recommandée';
      
      console.log(`  - ${dep.name} (${status}): ${dep.current} → min requis: ${dep.required}`);
    });
    console.log('');
  }
  
  // Dépendances obsolètes
  if (outdated.length > 0) {
    console.log(`${colors.yellow}Dépendances obsolètes:${colors.reset}`);
    outdated.forEach(dep => {
      let status = '';
      if (dep.type === 'server-critical') status = 'Serveur CRITIQUE';
      else if (dep.type === 'server-recommended') status = 'Serveur Recommandée';
      else if (dep.type === 'client-critical') status = 'Client CRITIQUE';
      else if (dep.type === 'client-recommended') status = 'Client Recommandée';
      
      console.log(`  - ${dep.name} (${status}): ${dep.current} → ${dep.latest}`);
    });
    console.log('');
  }
  
  // Dépendances OK
  if (ok.length > 0) {
    console.log(`${colors.green}Dépendances à jour:${colors.reset}`);
    ok.forEach(dep => {
      let status = '';
      if (dep.type === 'server-critical') status = 'Serveur CRITIQUE';
      else if (dep.type === 'server-recommended') status = 'Serveur Recommandée';
      else if (dep.type === 'client-critical') status = 'Client CRITIQUE';
      else if (dep.type === 'client-recommended') status = 'Client Recommandée';
      
      console.log(`  - ${dep.name} (${status}): ${dep.version}`);
    });
    console.log('');
  }
  
  // Résumé
  console.log(`${colors.cyan}=== Résumé ===${colors.reset}`);
  const totalDeps = criticalDependencies.length + recommendedDependencies.length + 
                   clientCriticalDependencies.length + clientRecommendedDependencies.length;
  console.log(`Total des dépendances vérifiées: ${totalDeps}`);
  console.log(`  - ${colors.green}À jour: ${ok.length}${colors.reset}`);
  console.log(`  - ${colors.yellow}Obsolètes: ${outdated.length}${colors.reset}`);
  console.log(`  - ${colors.red}Trop anciennes: ${tooOld.length}${colors.reset}`);
  console.log(`  - ${colors.red}Manquantes: ${missing.length}${colors.reset}`);
  
  // Génération des commandes npm si nécessaire
  if (missing.length > 0 || tooOld.length > 0) {
    // Dépendances serveur critiques manquantes ou trop anciennes
    const serverCriticalIssues = [
      ...missing.filter(dep => dep.type === 'server-critical' && !dep.installed),
      ...tooOld.filter(dep => dep.type === 'server-critical')
    ];
    
    if (serverCriticalIssues.length > 0) {
      console.log(`\n${colors.red}Commande pour installer/mettre à jour les dépendances serveur critiques:${colors.reset}`);
      console.log(`cd server && npm install ${serverCriticalIssues.map(dep => dep.name).join(' ')}`);
    }
    
    // Dépendances serveur recommandées manquantes
    const serverRecommendedMissing = missing.filter(dep => dep.type === 'server-recommended' && !dep.installed);
    if (serverRecommendedMissing.length > 0) {
      console.log(`\n${colors.yellow}Commande pour installer les dépendances serveur recommandées:${colors.reset}`);
      console.log(`cd server && npm install ${serverRecommendedMissing.map(dep => dep.name).join(' ')}`);
    }
    
    // Dépendances client critiques manquantes ou trop anciennes
    const clientCriticalIssues = [
      ...missing.filter(dep => dep.type === 'client-critical'),
      ...tooOld.filter(dep => dep.type === 'client-critical')
    ];
    
    if (clientCriticalIssues.length > 0) {
      console.log(`\n${colors.red}Commande pour installer/mettre à jour les dépendances client critiques:${colors.reset}`);
      console.log(`cd client && npm install ${clientCriticalIssues.map(dep => dep.name).join(' ')}`);
    }
    
    // Dépendances client recommandées manquantes
    const clientRecommendedMissing = missing.filter(dep => dep.type === 'client-recommended');
    if (clientRecommendedMissing.length > 0) {
      console.log(`\n${colors.yellow}Commande pour installer les dépendances client recommandées:${colors.reset}`);
      console.log(`cd client && npm install ${clientRecommendedMissing.map(dep => dep.name).join(' ')}`);
    }
  }
  
  // Retourner un code d'erreur si des dépendances critiques sont manquantes ou trop anciennes
  const criticalIssues = [
    ...missing.filter(dep => (dep.type === 'server-critical' || dep.type === 'client-critical') && !dep.installed),
    ...tooOld.filter(dep => dep.type === 'server-critical' || dep.type === 'client-critical')
  ];
  
  if (criticalIssues.length > 0) {
    process.exit(1);
  }
}

// Exécuter la vérification
checkDependencies();
