/**
 * Script de déploiement automatisé pour le projet Dashboard-Velo
 * Ce script:
 * 1. Nettoie le dossier build existant
 * 2. Génère un nouveau build avec webpack.fix.js
 * 3. Valide le build
 * 4. Crée une archive de déploiement
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const archiver = require('archiver');

// Chemins
const rootDir = path.resolve(__dirname, '..');
const buildDir = path.join(rootDir, 'build');
const deploymentDir = path.join(rootDir, 'deployment');

// Configuration
const config = {
  projectName: 'dashboard-velo',
  version: '1.0.0',
  date: new Date().toISOString().split('T')[0], // Format YYYY-MM-DD
};

// Fonctions utilitaires
function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m%s\x1b[0m',    // Cyan
    success: '\x1b[32m%s\x1b[0m', // Vert
    error: '\x1b[31m%s\x1b[0m',   // Rouge
    warning: '\x1b[33m%s\x1b[0m', // Jaune
  };
  
  console.log(colors[type], `[${type.toUpperCase()}] ${message}`);
}

// 1. Préparation
function prepareDeployment() {
  log('Démarrage du déploiement...', 'info');
  
  // Nettoyer le build précédent s'il existe
  if (fs.existsSync(buildDir)) {
    log('Nettoyage du dossier build précédent...', 'info');
    try {
      fs.rmSync(buildDir, { recursive: true });
      log('Dossier build nettoyé avec succès', 'success');
    } catch (error) {
      log(`Erreur lors du nettoyage du dossier build: ${error.message}`, 'error');
      process.exit(1);
    }
  }
  
  // Créer le dossier de déploiement s'il n'existe pas
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }
}

// 2. Build du projet
function buildProject() {
  log('Démarrage du build avec webpack.fix.js...', 'info');
  
  try {
    // Utiliser webpack.fix.js pour éviter le conflit d'index.html
    execSync('npx webpack --config webpack.fix.js', { 
      cwd: rootDir, 
      stdio: 'inherit' 
    });
    log('Build terminé avec succès', 'success');
  } catch (error) {
    log('Erreur lors du build du projet', 'error');
    process.exit(1);
  }
}

// 3. Validation du build
function validateBuild() {
  log('Validation du build...', 'info');
  
  // Vérifier si le dossier build et index.html existent
  if (!fs.existsSync(buildDir) || !fs.existsSync(path.join(buildDir, 'index.html'))) {
    log('Le build est incomplet, fichiers essentiels manquants', 'error');
    process.exit(1);
  }
  
  const requiredSubfolders = ['static', 'js', 'images', 'assets'];
  const missingFolders = requiredSubfolders.filter(folder => 
    !fs.existsSync(path.join(buildDir, folder))
  );
  
  if (missingFolders.length > 0) {
    log(`Dossiers manquants dans le build: ${missingFolders.join(', ')}`, 'warning');
  } else {
    log('Structure du build validée avec succès', 'success');
  }
}

// 4. Création d'une archive pour le déploiement
function createDeploymentArchive() {
  const now = new Date();
  const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  const archiveName = `${config.projectName}-${config.version}-${timestamp}.zip`;
  const archivePath = path.join(deploymentDir, archiveName);
  
  log(`Création de l'archive de déploiement: ${archiveName}...`, 'info');
  
  const output = fs.createWriteStream(archivePath);
  const archive = archiver('zip', {
    zlib: { level: 9 } // Compression maximale
  });
  
  output.on('close', () => {
    const sizeInMB = (archive.pointer() / 1048576).toFixed(2);
    log(`Archive de déploiement créée avec succès: ${archiveName} (${sizeInMB} MB)`, 'success');
    log(`Chemin complet: ${archivePath}`, 'info');
    displayDeploymentInstructions(archiveName);
  });
  
  archive.on('error', (err) => {
    log(`Erreur lors de la création de l'archive: ${err.message}`, 'error');
    process.exit(1);
  });
  
  archive.pipe(output);
  archive.directory(buildDir, false);
  archive.finalize();
}

// 5. Afficher les instructions de déploiement
function displayDeploymentInstructions(archiveName) {
  console.log('\n');
  log('Instructions de déploiement', 'info');
  console.log('\n=============================================');
  console.log('INSTRUCTIONS DE DÉPLOIEMENT MANUEL');
  console.log('=============================================');
  console.log(`
1. Transférez l'archive ${archiveName} vers votre serveur
2. Décompressez l'archive dans le répertoire racine de votre serveur web
3. Configurez votre serveur web pour servir ces fichiers statiques
4. Configurez les redirections vers index.html pour le routage SPA

Un exemple de configuration Nginx est disponible dans le README.md.
Pour un déploiement sur Netlify ou Vercel, suivez les instructions dans le README.md.
  `);
  console.log('=============================================');
}

// Exécution principale
try {
  prepareDeployment();
  buildProject();
  validateBuild();
  createDeploymentArchive();
} catch (error) {
  log(`Erreur inattendue lors du déploiement: ${error.message}`, 'error');
  process.exit(1);
}
