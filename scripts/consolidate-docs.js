/**
 * Script de consolidation de la documentation Velo-Altitude
 * Ce script fusionne et organise la documentation selon une structure standardisée
 */

const fs = require('fs');
const path = require('path');

// Configuration du plan de consolidation - Mise à jour complète
const CONSOLIDATION_PLAN = {
  // Documentation de déploiement
  'docs/deploiement/GUIDE_DEPLOIEMENT.md': [
    'docs/DeploymentGuide.md',
    'docs/deployment-guide.md',
    'docs/DEPLOYMENT_STATUS.md',
    'docs/NUTRITION_MODULE_DEPLOYMENT.md',
    'docs/TRAINING_DASHBOARD_DEPLOYMENT.md',
    'DEPLOYMENT.md',
    'DEPLOYMENT_NETLIFY.md',
    'NETLIFY_DEPLOYMENT.md',
    'GUIDE_DEPLOIEMENT_NETLIFY.md',
    'DEPLOYMENT_CHECKLIST.md',
    'DEPLOYMENT_PLAN.md',
    'DEPLOYMENT_READY.md',
    'DEPLOYMENT_SECURITY_UPDATE.md',
    'DEPLOYMENT_UPDATE.md',
    'DEPLOYMENT_UPDATES_05_04_2025.md',
    'PLAN_DEPLOIEMENT.md',
    'PLAN_DEPLOIEMENT_FINAL.md',
    'NETLIFY_API_KEYS_GUIDE.md'
  ],
  
  // Documentation technique
  'technique/ARCHITECTURE_COMPLETE.md': [
    'docs/TechnicalDocumentation.md',
    'docs/documentation-technique.md',
    'API_ARCHITECTURE.md',
    'FRONTEND_ARCHITECTURE.md',
    'ARCHITECTURE.md',
    'technique/ARCHITECTURE.md'
  ],
  
  'technique/PERFORMANCES/OPTIMISATIONS.md': [
    'docs/performance-optimization.md',
    'docs/3D_OPTIMIZATIONS.md',
    'docs/DATA_OPTIMIZATION.md',
    'docs/PerformanceMonitoring.md',
    'PERFORMANCE_TESTS.md',
    'TESTS_OPTIMISATIONS.md'
  ],
  
  'technique/SECURITE/README.md': [
    'docs/API_SECURITY.md',
    'docs/api-key-security-system.md',
    'docs/AUTH0_PRODUCTION_CONFIG.md',
    'docs/DEPLOY_SECRETS.md',
    'API_SECURITY_CONFIGURATION.md'
  ],
  
  'technique/DATABASE/SCHEMA.md': [
    'docs/DATABASE_SCHEMA.md',
    'docs/mongodb-schema.md',
    'docs/database-structure.md'
  ],
  
  // Documentation des équipes
  'docs/equipes/architecture/COMPOSANTS.md': [
    'docs/COMPONENTS_REFERENCE.md',
    'docs/COMPONENTS_SYSTEM.md',
    'docs/UI_COMPONENTS.md',
    'docs/design-system-components.md'
  ],
  
  'docs/equipes/architecture/STANDARDS.md': [
    'docs/CODING_STANDARDS.md',
    'docs/CODE_GUIDELINES.md',
    'docs/BEST_PRACTICES.md'
  ],
  
  'docs/equipes/visualisation/OPTIMISATION_3D.md': [
    'docs/3D_IMPLEMENTATION.md',
    'docs/3D_RENDERING_GUIDE.md',
    'docs/THREE_JS_OPTIMIZATIONS.md'
  ],
  
  'docs/equipes/cols/STRUCTURE_DONNEES.md': [
    'COLS_DATA_STRUCTURE.md',
    'docs/COLS_DATA_SCHEMA.md',
    'docs/COLS_TAXONOMY.md'
  ],
  
  'docs/equipes/entrainement/INTEGRATION_DONNEES.md': [
    'docs/STRAVA_INTEGRATION.md',
    'docs/DATA_IMPORT_EXPORT.md',
    'docs/TRAINING_DATA_STRUCTURE.md'
  ],
  
  'docs/equipes/communaute/PROFILS.md': [
    'docs/USER_PROFILES.md',
    'docs/PROFILE_SCHEMA.md',
    'docs/USER_MANAGEMENT.md'
  ],
  
  'docs/equipes/communaute/SOCIAL.md': [
    'docs/SOCIAL_FEATURES.md',
    'docs/COMMUNITY_ENGAGEMENT.md',
    'docs/SOCIAL_INTERACTIONS.md'
  ],
  
  // Documentation du contenu
  'docs/contenu/INVENTAIRE_MASTER.md': [
    'docs/CONTENT_INVENTORY_MASTER.md',
    'docs/INVENTAIRE_CONTENU.md',
    'docs/CONTENT_STRUCTURE_REFERENCE.md',
    'docs/MASTER_INVENTORY.md',
    'DASHBOARD_TOOLS_INVENTORY.md',
    'CONTENT_COLS_DEVELOPMENT.md',
    'CONTENT_CHALLENGES_DEVELOPMENT.md', 
    'CONTENT_DEVELOPMENT_GUIDE.md',
    'CONTENT_NUTRITION_DEVELOPMENT.md',
    'CONTENT_ROUTES_DEVELOPMENT.md',
    'CONTENT_STATUS.md',
    'CONTENT_TRAINING_DEVELOPMENT.md',
    'CONTENT_COLS_GUIDE.md'
  ],
  
  // Documentation SEO
  'docs/technique/SEO_COMPLET.md': [
    'docs/seo-analysis-report.md',
    'docs/simple-seo-report.md',
    'docs/SEO_OPTIMIZATION_GUIDE.md',
    'docs/STRATEGIE_SEO.md',
    'docs/README_SEO.md'
  ],
  
  // Documentation de monitoring
  'docs/deploiement/MONITORING_PLAN.md': [
    'docs/MONITORING_PLAN.md',
    'docs/monitoring-system.md',
    'technique/PERFORMANCE/MONITORING.md'
  ],
  
  // Documentation d'état du projet
  'docs/ETAT_PROJET_COMPLET.md': [
    'ETAT_PROJET.md',
    'DETTE_TECHNIQUE.md',
    'DETTE_TECHNIQUE_RESOLVED.md',
    'AMELIORATIONS.md',
    'BACKEND_CHANGELOG.md',
    'BACKEND_STATUS.md',
    'BUILD_ISSUES.md',
    'CHANGELOG.md',
    'FRONTEND_STATUS.md'
  ],
  
  // Documentation de communication et coordination
  'docs/COORDINATION_PROJET.md': [
    'AGENTS_COORDINATION.md', 
    'COMMUNICATION_PLAN.md',
    'HANDOVER_DOCUMENT.md',
    'INTEGRATION_CHECKLIST.md',
    'INTEGRATION_FIXES.md',
    'PLAN_ACTION_GLOBAL.md',
    'PLAN_ACTION_SUIVI.md'
  ]
};

// Créer le dossier archive s'il n'existe pas
const ARCHIVE_DIR = path.join(__dirname, '..', '.archive');
if (!fs.existsSync(ARCHIVE_DIR)) {
  fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
}

/**
 * Fonction de consolidation des documents
 */
async function consolidateDocuments() {
  console.log('Début de la consolidation des documents...');

  for (const [target, sources] of Object.entries(CONSOLIDATION_PLAN)) {
    console.log(`\nConsolidation vers ${target}...`);
    
    // Créer le répertoire cible si nécessaire
    const targetDir = path.dirname(path.join(__dirname, '..', target));
    if (!fs.existsSync(targetDir)) {
      console.log(`Création du répertoire ${targetDir}`);
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // Initialiser le contenu consolidé avec un titre
    const targetTitle = path.basename(target, '.md').replace(/_/g, ' ');
    let consolidatedContent = `# ${targetTitle}\n\n`;
    consolidatedContent += `*Document consolidé le ${new Date().toLocaleString()}*\n\n`;
    consolidatedContent += `## Table des matières\n\n`;
    
    // Ajouter les entrées à la table des matières
    const tocEntries = [];
    for (const source of sources) {
      const sourceName = path.basename(source, '.md').replace(/_/g, ' ');
      tocEntries.push(`- [${sourceName}](#${sourceName.toLowerCase().replace(/\s+/g, '-')})`);
    }
    consolidatedContent += tocEntries.join('\n') + '\n\n';
    consolidatedContent += '---\n\n';
    
    // Consolider les contenus
    let sourceFilesFound = 0;
    for (const source of sources) {
      const fullSourcePath = path.join(__dirname, '..', source);
      if (fs.existsSync(fullSourcePath)) {
        sourceFilesFound++;
        console.log(`  - Ajout de ${source}`);
        
        const content = fs.readFileSync(fullSourcePath, 'utf8');
        const sourceName = path.basename(source, '.md').replace(/_/g, ' ');
        
        // Extraire et transformer le contenu
        let processedContent = content;
        
        // Si le contenu commence par un titre, on le supprime pour éviter la duplication
        if (processedContent.startsWith('# ')) {
          processedContent = processedContent.substring(processedContent.indexOf('\n') + 1).trim();
        }
        
        consolidatedContent += `## ${sourceName}\n\n`;
        consolidatedContent += `*Source: ${source}*\n\n`;
        consolidatedContent += processedContent + '\n\n';
        consolidatedContent += '---\n\n';
        
        // Archiver le fichier source
        const archivePath = path.join(ARCHIVE_DIR, source);
        const archiveDir = path.dirname(archivePath);
        if (!fs.existsSync(archiveDir)) {
          fs.mkdirSync(archiveDir, { recursive: true });
        }
        
        // Copier le fichier vers l'archive au lieu de le déplacer pour éviter les erreurs
        fs.copyFileSync(fullSourcePath, archivePath);
        console.log(`    → Archivé dans ${archivePath}`);
      }
    }
    
    if (sourceFilesFound > 0) {
      // Ajouter un pied de page
      consolidatedContent += `\n## Note de consolidation\n\n`;
      consolidatedContent += `Ce document a été consolidé à partir de ${sourceFilesFound} sources le ${new Date().toLocaleString()}. `;
      consolidatedContent += `Les documents originaux sont archivés dans le dossier \`.archive\`.\n`;
      
      // Écrire le fichier consolidé
      const targetPath = path.join(__dirname, '..', target);
      fs.writeFileSync(targetPath, consolidatedContent);
      console.log(`✅ Document consolidé créé: ${target} (à partir de ${sourceFilesFound} sources)`);
    } else {
      console.log(`❌ Aucun fichier source trouvé pour ${target}`);
    }
  }
  
  console.log('\nConsolidation terminée!');
}

/**
 * Fonction pour déplacer les fichiers isolés vers la structure appropriée
 */
function organizeIsolatedFiles() {
  console.log('\nOrganisation des fichiers isolés...');

  // Mappings des fichiers isolés vers les dossiers appropriés
  const FILE_MAPPINGS = {
    // Fichiers de déploiement
    'NETLIFY_WEBPACK_SOLUTIONS.md': 'docs/deploiement/solutions/',
    'NETLIFY_WEBPACK_TROUBLESHOOTING.md': 'docs/deploiement/solutions/',
    'GIT_SUBMODULE_RESOLUTION.md': 'docs/deploiement/solutions/',
    
    // Fichiers de documentation des équipes
    'GUIDE_DEVELOPPEUR.md': 'guides/developpeur/',
    
    // Structure du projet
    'STRUCTURE_PROJET.md': 'docs/'
  };

  for (const [sourceFile, targetDir] of Object.entries(FILE_MAPPINGS)) {
    const sourcePath = path.join(__dirname, '..', sourceFile);
    
    if (fs.existsSync(sourcePath)) {
      const targetDirPath = path.join(__dirname, '..', targetDir);
      
      // Créer le répertoire cible si nécessaire
      if (!fs.existsSync(targetDirPath)) {
        fs.mkdirSync(targetDirPath, { recursive: true });
      }
      
      const targetPath = path.join(targetDirPath, sourceFile);
      console.log(`  - Déplacement de ${sourceFile} vers ${targetDir}`);
      
      // Copier le fichier
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`    → Copié vers ${targetPath}`);
      
      // Archiver l'original
      const archivePath = path.join(ARCHIVE_DIR, sourceFile);
      const archiveDir = path.dirname(archivePath);
      if (!fs.existsSync(archiveDir)) {
        fs.mkdirSync(archiveDir, { recursive: true });
      }
      
      fs.copyFileSync(sourcePath, archivePath);
      console.log(`    → Archivé dans ${archivePath}`);
    }
  }
}

// Déplacer les fichiers EQUIPE vers le dossier equipes
function moveTeamFiles() {
  console.log('\nDéplacement des fichiers d\'équipe...');
  const docsDir = path.join(__dirname, '..', 'docs');
  const equipeDir = path.join(docsDir, 'equipes');
  
  if (!fs.existsSync(equipeDir)) {
    fs.mkdirSync(equipeDir, { recursive: true });
  }
  
  fs.readdirSync(docsDir).forEach(file => {
    if (file.startsWith('EQUIPE') && file.endsWith('.md')) {
      const source = path.join(docsDir, file);
      const dest = path.join(equipeDir, file);
      
      console.log(`  - Déplacement de ${file} vers le dossier equipes`);
      fs.copyFileSync(source, dest);
      console.log(`    → Copié vers ${dest}`);
    }
  });
}

/**
 * Vérifier les fichiers qui n'ont pas été consolidés
 */
function checkRemainingFiles() {
  console.log('\nVérification des fichiers MD non consolidés...');
  
  // Lister tous les fichiers MD
  const allMdFiles = [];
  
  function findMarkdownFiles(dirPath) {
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        // Ignorer le répertoire d'archive
        if (file !== '.archive') {
          findMarkdownFiles(filePath);
        }
      } else if (file.endsWith('.md')) {
        allMdFiles.push(filePath);
      }
    });
  }
  
  findMarkdownFiles(path.join(__dirname, '..'));
  
  // Vérifier quels fichiers ont été archivés
  const archivedFiles = [];
  const notArchivedFiles = [];
  
  allMdFiles.forEach(filePath => {
    // Chemin relatif
    const relativePath = path.relative(path.join(__dirname, '..'), filePath);
    // Vérifier si le fichier est dans .archive ou n'a pas été archivé
    if (relativePath.startsWith('.archive')) {
      archivedFiles.push(relativePath);
    } else {
      notArchivedFiles.push(relativePath);
    }
  });
  
  console.log(`Total des fichiers MD: ${allMdFiles.length}`);
  console.log(`Fichiers archivés: ${archivedFiles.length}`);
  console.log(`Fichiers non archivés: ${notArchivedFiles.length}`);
  
  if (notArchivedFiles.length > 0) {
    console.log('\nFichiers MD non consolidés:');
    notArchivedFiles.forEach(file => {
      console.log(`  - ${file}`);
    });
  }
}

// Exécuter les fonctions
console.log('Début de la réorganisation de la documentation...');
console.log('Date et heure: ' + new Date().toLocaleString());

moveTeamFiles();
organizeIsolatedFiles();
consolidateDocuments()
  .then(() => {
    checkRemainingFiles();
    console.log('\nRéorganisation terminée avec succès!');
  })
  .catch(error => {
    console.error('Erreur lors de la consolidation:', error);
    process.exit(1);
  });
