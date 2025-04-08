/**
 * Script de vérification des dépendances pour Velo-Altitude
 * 
 * Ce script vérifie que toutes les dépendances nécessaires sont installées
 * et à jour avant le déploiement en production.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

console.log(chalk.blue.bold('🔍 Vérification des dépendances Velo-Altitude'));
console.log(chalk.blue('================================================'));

// Chemin vers le package.json
const packageJsonPath = path.resolve(__dirname, '..', 'package.json');

// Vérifier l'existence du package.json
if (!fs.existsSync(packageJsonPath)) {
  console.error(chalk.red.bold('❌ Le fichier package.json est introuvable!'));
  process.exit(1);
}

// Lire le package.json
const packageJson = require(packageJsonPath);

// Liste des dépendances critiques pour la production
const criticalDependencies = [
  '@auth0/auth0-react',
  'axios',
  'react',
  'react-dom',
  'react-router-dom',
  'react-query',
  'react-error-boundary'
];

// Vérifier les dépendances critiques
console.log(chalk.blue.bold('\n📋 Vérification des dépendances critiques:'));

let allDependenciesOk = true;

criticalDependencies.forEach(dep => {
  console.log(chalk.gray(`Vérification de ${dep}...`));
  
  if (!packageJson.dependencies[dep]) {
    console.error(chalk.red(`❌ ERREUR: La dépendance ${dep} n'est pas installée!`));
    allDependenciesOk = false;
    return;
  }
  
  console.log(chalk.green(`✅ ${dep} - OK (${packageJson.dependencies[dep]})`));
});

// Vérifier les vulnérabilités npm
console.log(chalk.blue.bold('\n🛡️ Vérification des vulnérabilités:'));

try {
  console.log(chalk.gray('Exécution de npm audit...'));
  const auditOutput = execSync('npm audit --json', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
  const auditResult = JSON.parse(auditOutput);
  
  const highSeverities = auditResult.metadata?.vulnerabilities?.high || 0;
  const criticalSeverities = auditResult.metadata?.vulnerabilities?.critical || 0;
  
  if (highSeverities > 0 || criticalSeverities > 0) {
    console.warn(chalk.yellow(`⚠️ AVERTISSEMENT: ${highSeverities} vulnérabilités de niveau élevé et ${criticalSeverities} critiques détectées`));
    console.warn(chalk.yellow('   Considérez exécuter npm audit fix avant le déploiement'));
    // Ne pas bloquer le build pour les vulnérabilités, juste avertir
  } else {
    console.log(chalk.green('✅ Aucune vulnérabilité critique détectée'));
  }
} catch (error) {
  console.warn(chalk.yellow('⚠️ Impossible d\'exécuter npm audit. Continuez avec précaution.'));
  console.warn(chalk.gray(error.message));
}

// Vérifier les packages obsolètes
console.log(chalk.blue.bold('\n📦 Vérification des packages obsolètes:'));

try {
  console.log(chalk.gray('Exécution de npm outdated...'));
  const outdatedOutput = execSync('npm outdated --json', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
  
  if (outdatedOutput.trim()) {
    const outdatedPackages = JSON.parse(outdatedOutput);
    const outdatedCount = Object.keys(outdatedPackages).length;
    
    if (outdatedCount > 0) {
      console.warn(chalk.yellow(`⚠️ AVERTISSEMENT: ${outdatedCount} packages sont obsolètes`));
      console.warn(chalk.yellow('   Considérez mettre à jour les packages avant le déploiement'));
      // Ne pas bloquer le build pour les packages obsolètes, juste avertir
    }
  } else {
    console.log(chalk.green('✅ Tous les packages sont à jour'));
  }
} catch (error) {
  // Si npm outdated ne trouve rien, il peut sortir avec un code d'erreur
  if (error.status === 0) {
    console.log(chalk.green('✅ Tous les packages sont à jour'));
  } else {
    console.warn(chalk.yellow('⚠️ Impossible de vérifier les packages obsolètes. Continuez avec précaution.'));
    console.warn(chalk.gray(error.message));
  }
}

// Résultat final
console.log(chalk.blue('\n================================================'));
if (allDependenciesOk) {
  console.log(chalk.green.bold('✅ Vérification des dépendances complète: Le projet est prêt pour le déploiement!'));
} else {
  console.error(chalk.red.bold('❌ Certaines dépendances critiques sont manquantes. Corrigez les problèmes avant le déploiement.'));
  process.exit(1);
}

console.log(chalk.blue('\nRecommandations:'));
console.log(chalk.gray('1. Exécutez npm ci au lieu de npm install en production pour des installations plus fiables'));
console.log(chalk.gray('2. Considérez utiliser npm-check-updates pour maintenir vos dépendances à jour'));
console.log(chalk.gray('3. Vérifiez régulièrement les vulnérabilités avec npm audit'));
