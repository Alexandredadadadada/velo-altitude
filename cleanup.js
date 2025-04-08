/**
 * Script de nettoyage pour le projet Velo-Altitude
 * Ce script archive les fichiers redondants et réorganise la structure du projet
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Date pour le dossier d'archive
const today = new Date().toISOString().split('T')[0];
const ARCHIVE_DIR = path.join('.archive', today);

console.log('Démarrage du processus de nettoyage...');
console.log(`Dossier d'archive: ${ARCHIVE_DIR}`);

// Création du dossier d'archive
fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
console.log(`Dossier d'archive créé: ${ARCHIVE_DIR}`);

// Liste des fichiers à archiver
const filesToArchive = [
  // Documentation
  ...glob.sync('DEPLOYMENT_*.md'),
  ...glob.sync('NETLIFY_*.md'),
  ...glob.sync('CONTENT_*.md'),
  ...glob.sync('*_STATUS.md'),
  
  // Scripts de déploiement
  'deploy-script.js',
  'deploy-auth-fix.js',
  'deploy-velo-altitude.js',
  'deploy-velo-altitude.sh',
  'deploy-complete.js',
  'deploy.bat',
  
  // Configurations redondantes
  'netlify-simple.toml',
  'webpack.fix.js'
];

// Archivage des fichiers
let archivedCount = 0;
filesToArchive.forEach(pattern => {
  const files = glob.sync(pattern);
  files.forEach(file => {
    if (fs.existsSync(file)) {
      const destination = path.join(ARCHIVE_DIR, file);
      // Créer le dossier de destination si nécessaire
      const destDir = path.dirname(destination);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      
      fs.copyFileSync(file, destination);
      fs.unlinkSync(file);
      console.log(`Archivé: ${file} -> ${destination}`);
      archivedCount++;
    }
  });
});

// Création de la nouvelle structure
const newDirs = [
  'docs/deployment',
  'docs/development',
  'docs/content',
  'config'
];

newDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Dossier créé: ${dir}`);
  }
});

// Déplacement des fichiers de configuration
const configFiles = [
  { source: 'webpack.config.js', dest: 'config/webpack.config.js' },
  { source: 'netlify.toml', dest: 'config/netlify.toml' }
];

configFiles.forEach(({ source, dest }) => {
  if (fs.existsSync(source)) {
    fs.copyFileSync(source, dest);
    fs.unlinkSync(source);
    console.log(`Déplacé: ${source} -> ${dest}`);
  }
});

// Consolider la documentation
const docsToConsolidate = {
  'docs/deployment/GUIDE.md': [
    'DEPLOYMENT.md',
    'DEPLOYMENT_CHECKLIST.md',
    'DEPLOYMENT_PLAN.md',
    'DEPLOYMENT_READY.md',
    'DEPLOYMENT_SECURITY_UPDATE.md',
    'DEPLOYMENT_UPDATE.md',
    'DEPLOYMENT_UPDATES_05_04_2025.md'
  ],
  'docs/deployment/NETLIFY.md': [
    'NETLIFY_API_KEYS_GUIDE.md',
    'NETLIFY_DEPLOYMENT.md',
    'NETLIFY_PROGRESS.md',
    'NETLIFY_WEBPACK_SOLUTIONS.md',
    'NETLIFY_WEBPACK_TROUBLESHOOTING.md',
    'GUIDE_DEPLOIEMENT_NETLIFY.md'
  ],
  'docs/content/GUIDE.md': [
    'CONTENT_CHALLENGES_DEVELOPMENT.md',
    'CONTENT_COLS_DEVELOPMENT.md',
    'CONTENT_COLS_GUIDE.md',
    'CONTENT_DEVELOPMENT_GUIDE.md',
    'CONTENT_NUTRITION_DEVELOPMENT.md',
    'CONTENT_ROUTES_DEVELOPMENT.md',
    'CONTENT_TRAINING_DEVELOPMENT.md'
  ]
};

Object.entries(docsToConsolidate).forEach(([target, sources]) => {
  let consolidatedContent = `# ${path.basename(target, '.md')}\n\n`;
  consolidatedContent += `> Document consolidé le ${today}\n\n`;
  
  sources.forEach(source => {
    if (fs.existsSync(source)) {
      const content = fs.readFileSync(source, 'utf8');
      consolidatedContent += `\n\n## Contenu de ${source}\n\n${content}\n\n`;
      console.log(`Contenu de ${source} ajouté à ${target}`);
    }
  });
  
  fs.writeFileSync(target, consolidatedContent);
  console.log(`Document consolidé créé: ${target}`);
});

// Créer le script de déploiement consolidé
const deployScriptPath = 'scripts/deploy.js';
if (!fs.existsSync(path.dirname(deployScriptPath))) {
  fs.mkdirSync(path.dirname(deployScriptPath), { recursive: true });
}

// Créer une checklist de vérification
const checklistContent = `# Checklist de vérification post-nettoyage

## État : À vérifier

- [ ] Build du projet fonctionne
- [ ] Tests passent
- [ ] Déploiement fonctionne
- [ ] Documentation principale accessible
- [ ] Pas de liens cassés dans la documentation
- [ ] Sauvegarde accessible

## Éléments nettoyés
- ${archivedCount} fichiers archivés dans ${ARCHIVE_DIR}
- Structure de dossiers réorganisée
- Documentation consolidée

Date de nettoyage: ${today}
`;

fs.writeFileSync('docs/CLEANUP_VERIFICATION.md', checklistContent);
console.log('Checklist de vérification créée: docs/CLEANUP_VERIFICATION.md');

console.log('\nNettoyage terminé !');
console.log('Pour finaliser le processus:');
console.log('1. Vérifiez que tout fonctionne correctement avec la nouvelle structure');
console.log('2. Exécutez les tests de build et de déploiement');
console.log('3. Complétez la checklist dans docs/CLEANUP_VERIFICATION.md');
