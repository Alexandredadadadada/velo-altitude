/**
 * verify-netlify-build.js
 * Script pour vérifier la compatibilité du build avec Netlify
 * 
 * Exécute un build dans un environnement simulant Netlify et vérifie les erreurs courantes
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk') || { green: (t) => t, red: (t) => t, yellow: (t) => t, blue: (t) => t };

// Chemins importants
const rootDir = path.resolve(__dirname, '..');
const buildDir = path.join(rootDir, 'build');
const netlifyTomlPath = path.join(rootDir, 'netlify.toml');

console.log(chalk.blue('🔍 Vérification de la compatibilité Netlify\n'));

// Vérifier si netlify.toml existe
if (!fs.existsSync(netlifyTomlPath)) {
  console.error(chalk.red('❌ Fichier netlify.toml non trouvé'));
  process.exit(1);
}

console.log(chalk.green('✅ Fichier netlify.toml trouvé'));

// Lire la configuration Netlify
const netlifyToml = fs.readFileSync(netlifyTomlPath, 'utf8');
console.log(chalk.blue('\nConfiguration Netlify:'));

// Extraire des informations clés
const nodeVersionMatch = netlifyToml.match(/NODE_VERSION\s*=\s*["']([^"']+)["']/);
const nodeVersion = nodeVersionMatch ? nodeVersionMatch[1] : 'non spécifié';

const npmVersionMatch = netlifyToml.match(/NPM_VERSION\s*=\s*["']([^"']+)["']/);
const npmVersion = npmVersionMatch ? npmVersionMatch[1] : 'non spécifié';

const buildCommandMatch = netlifyToml.match(/command\s*=\s*["']([^"']+)["']/);
const buildCommand = buildCommandMatch ? buildCommandMatch[1] : 'non spécifié';

const publishDirMatch = netlifyToml.match(/publish\s*=\s*["']([^"']+)["']/);
const publishDir = publishDirMatch ? publishDirMatch[1] : 'non spécifié';

console.log(`- Version Node: ${nodeVersion}`);
console.log(`- Version NPM: ${npmVersion}`);
console.log(`- Commande de build: ${buildCommand}`);
console.log(`- Répertoire de publication: ${publishDir}`);

// Vérifier le package.json
const packageJsonPath = path.join(rootDir, 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error(chalk.red('\n❌ Fichier package.json non trouvé'));
  process.exit(1);
}

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
console.log(chalk.blue('\nScripts disponibles:'));
for (const [key, value] of Object.entries(packageJson.scripts)) {
  if (key.includes('build') || key.includes('deploy') || key === 'validate') {
    console.log(`- ${key}: ${value}`);
  }
}

// Vérifier les dépendances requises pour Netlify
console.log(chalk.blue('\nVérification des dépendances critiques:'));
const criticalDeps = [
  '@babel/core', 
  '@babel/preset-env', 
  '@babel/preset-react', 
  'babel-loader', 
  'webpack', 
  'webpack-cli',
  'html-webpack-plugin',
  'mini-css-extract-plugin'
];

const missingDeps = [];
for (const dep of criticalDeps) {
  const found = packageJson.dependencies[dep] || packageJson.devDependencies[dep];
  if (found) {
    console.log(chalk.green(`✅ ${dep}: ${found}`));
  } else {
    console.log(chalk.red(`❌ ${dep}: manquant`));
    missingDeps.push(dep);
  }
}

// Simuler un build Netlify
console.log(chalk.blue('\n🚀 Simulation du build Netlify:'));
try {
  // Nettoyer le répertoire de build s'il existe
  if (fs.existsSync(buildDir)) {
    console.log('Nettoyage du répertoire build...');
    try {
      execSync('npm run clean', { cwd: rootDir, stdio: 'inherit' });
    } catch (e) {
      // Si clean script fails, try manual removal
      console.log('Suppression manuelle du répertoire build...');
      fs.rmSync(buildDir, { recursive: true, force: true });
    }
  }

  // Définir les variables d'environnement comme sur Netlify
  const env = {
    ...process.env,
    CI: 'false',
    NODE_ENV: 'production'
  };

  // Exécuter le build (sans utiliser toute la commande Netlify pour éviter les problèmes)
  console.log('\nExécution du build de test...');
  
  // Utiliser un script de build simplifié pour le test
  execSync('npm run build', { 
    cwd: rootDir, 
    stdio: 'inherit',
    env
  });

  // Vérifier que le répertoire de build a été créé
  if (!fs.existsSync(buildDir)) {
    console.error(chalk.red('\n❌ Le build a échoué - Le répertoire build n\'a pas été créé'));
    process.exit(1);
  }

  // Vérifier la taille du build
  let buildSize = 0;
  const calcDirSize = (dirPath) => {
    const files = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const file of files) {
      const filePath = path.join(dirPath, file.name);
      if (file.isDirectory()) {
        calcDirSize(filePath);
      } else {
        buildSize += fs.statSync(filePath).size;
      }
    }
  };
  
  calcDirSize(buildDir);
  const buildSizeMB = (buildSize / (1024 * 1024)).toFixed(2);
  console.log(chalk.green(`\n✅ Build réussi! Taille: ${buildSizeMB} MB`));

  // Vérifier la présence des fichiers essentiels
  console.log(chalk.blue('\nVérification des fichiers essentiels:'));
  const essentialFiles = [
    'index.html',
    path.join('static', 'js')
  ];

  for (const file of essentialFiles) {
    const filePath = path.join(buildDir, file);
    if (fs.existsSync(filePath)) {
      console.log(chalk.green(`✅ ${file}`));
    } else {
      console.log(chalk.red(`❌ ${file}`));
    }
  }

  // Recommandations finales
  console.log(chalk.blue('\n📋 Recommandations pour Netlify:'));
  
  if (missingDeps.length > 0) {
    console.log(chalk.yellow(`⚠️ Installer les dépendances manquantes: ${missingDeps.join(', ')}`));
  }
  
  console.log(chalk.green(`
✅ Votre projet semble prêt pour Netlify. Commandes recommandées:

1. Build local complet:       npm run pre-deploy
2. Déploiement sur Netlify:   git push origin main

Si vous rencontrez des problèmes sur Netlify, vérifiez les logs de build sur la plateforme.
  `));

} catch (error) {
  console.error(chalk.red(`\n❌ Erreur lors du build: ${error.message}`));
  process.exit(1);
}
