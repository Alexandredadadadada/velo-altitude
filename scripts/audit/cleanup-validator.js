/**
 * Script d'audit et de nettoyage pour le projet Velo-Altitude
 * 
 * Ce script identifie :
 * - Les composants inutilisés
 * - Les assets non référencés
 * - Les styles CSS non utilisés
 * - Les imports inutilisés
 * - Les fichiers de données obsolètes
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const chalk = require('chalk');

// Configuration
const PROJECT_ROOT = path.resolve(__dirname, '../../');
const SRC_DIR = path.join(PROJECT_ROOT, 'src');
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');

// Statistiques de l'audit
const stats = {
  componentsScanned: 0,
  componentsUnused: 0,
  assetsScanned: 0,
  assetsUnused: 0,
  stylesScanned: 0,
  stylesUnused: 0,
  importsScanned: 0,
  importsUnused: 0
};

/**
 * Trouver les composants inutilisés
 */
async function findUnusedComponents() {
  console.log(chalk.blue('\n🔍 Recherche des composants inutilisés...'));
  
  const componentFiles = glob.sync(`${SRC_DIR}/components/**/*.{js,jsx,ts,tsx}`);
  const sourceFiles = glob.sync(`${SRC_DIR}/**/*.{js,jsx,ts,tsx}`);
  
  const unusedComponents = [];
  
  componentFiles.forEach(componentFile => {
    stats.componentsScanned++;
    
    const componentName = path.basename(componentFile, path.extname(componentFile));
    const relPath = path.relative(PROJECT_ROOT, componentFile);
    
    // Skip index files
    if (componentName.toLowerCase() === 'index') {
      return;
    }
    
    // Count references to this component in other files
    let referencesCount = 0;
    
    sourceFiles.forEach(sourceFile => {
      if (sourceFile === componentFile) return; // Skip self
      
      const content = fs.readFileSync(sourceFile, 'utf8');
      
      // Check for import statements or component usage
      const importRegex = new RegExp(`(import|from).*['"].*${componentName}['"]`, 'g');
      const usageRegex = new RegExp(`<${componentName}[^a-zA-Z0-9_]`, 'g');
      
      if (importRegex.test(content) || usageRegex.test(content)) {
        referencesCount++;
      }
    });
    
    if (referencesCount === 0) {
      unusedComponents.push({
        path: relPath,
        name: componentName,
        size: fs.statSync(componentFile).size
      });
      stats.componentsUnused++;
    }
  });
  
  return unusedComponents;
}

/**
 * Trouver les assets inutilisés
 */
async function findUnusedAssets() {
  console.log(chalk.blue('\n🔍 Recherche des assets inutilisés...'));
  
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'];
  const imageFiles = glob.sync(`${PUBLIC_DIR}/images/**/*`).filter(file => {
    return imageExtensions.includes(path.extname(file).toLowerCase());
  });
  
  const sourceFiles = glob.sync([
    `${SRC_DIR}/**/*.{js,jsx,ts,tsx,css,scss}`,
    `${PUBLIC_DIR}/**/*.{html,css}`
  ]);
  
  const unusedAssets = [];
  
  imageFiles.forEach(imageFile => {
    stats.assetsScanned++;
    
    const imageName = path.basename(imageFile);
    const relPath = path.relative(PROJECT_ROOT, imageFile);
    
    // Count references to this image in source files
    let referencesCount = 0;
    
    sourceFiles.forEach(sourceFile => {
      const content = fs.readFileSync(sourceFile, 'utf8');
      
      // Check if the image is referenced by name
      if (content.includes(imageName)) {
        referencesCount++;
      }
    });
    
    if (referencesCount === 0) {
      unusedAssets.push({
        path: relPath,
        name: imageName,
        size: fs.statSync(imageFile).size
      });
      stats.assetsUnused++;
    }
  });
  
  return unusedAssets;
}

/**
 * Trouver les classes CSS inutilisées
 */
async function findUnusedStyles() {
  console.log(chalk.blue('\n🔍 Recherche des styles CSS inutilisés...'));
  
  const cssFiles = glob.sync(`${SRC_DIR}/**/*.{css,scss}`);
  const sourceFiles = glob.sync(`${SRC_DIR}/**/*.{js,jsx,ts,tsx,html}`);
  
  const unusedStyles = [];
  const cssClassRegex = /\.([a-zA-Z0-9_-]+)\s*\{/g;
  
  cssFiles.forEach(cssFile => {
    const content = fs.readFileSync(cssFile, 'utf8');
    const relPath = path.relative(PROJECT_ROOT, cssFile);
    let match;
    
    while ((match = cssClassRegex.exec(content)) !== null) {
      stats.stylesScanned++;
      
      const className = match[1];
      let isUsed = false;
      
      // Skip utility class names that might be dynamically constructed
      if (className.length < 3 || className === 'active' || className === 'disabled') {
        continue;
      }
      
      // Check if the class is used in any source file
      for (const sourceFile of sourceFiles) {
        const sourceContent = fs.readFileSync(sourceFile, 'utf8');
        if (sourceContent.includes(`className="${className}"`) || 
            sourceContent.includes(`className='${className}'`) ||
            sourceContent.includes(`class="${className}"`) ||
            sourceContent.includes(`class='${className}'`)) {
          isUsed = true;
          break;
        }
      }
      
      if (!isUsed) {
        unusedStyles.push({
          file: relPath,
          className: className,
          line: content.substring(0, match.index).split('\n').length
        });
        stats.stylesUnused++;
      }
    }
  });
  
  return unusedStyles;
}

/**
 * Trouver les imports inutilisés
 */
async function findUnusedImports() {
  console.log(chalk.blue('\n🔍 Recherche des imports inutilisés...'));
  
  const sourceFiles = glob.sync(`${SRC_DIR}/**/*.{js,jsx,ts,tsx}`);
  const unusedImports = [];
  const importRegex = /import\s+(?:{([^}]+)}\s+from\s+['"]([^'"]+)['"]|([^;]+?)\s+from\s+['"]([^'"]+)['"])/g;
  
  sourceFiles.forEach(sourceFile => {
    const content = fs.readFileSync(sourceFile, 'utf8');
    const relPath = path.relative(PROJECT_ROOT, sourceFile);
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      stats.importsScanned++;
      
      const importedItems = match[1] ? match[1] : match[3];
      const importSource = match[2] ? match[2] : match[4];
      
      // Skip React and library imports
      if (importSource === 'react' || !importedItems) {
        continue;
      }
      
      // Split imported items and check each
      const items = importedItems.split(',').map(item => {
        // Handle "X as Y" imports
        const match = item.trim().match(/(\w+)(?:\s+as\s+(\w+))?/);
        return match ? match[2] || match[1] : null;
      }).filter(Boolean);
      
      items.forEach(item => {
        // Skip destructuring imports or default imports that are whole file
        if (item === 'default' || item.includes('...')) {
          return;
        }
        
        // Check if the import is used in file content
        const afterImports = content.substring(match.index + match[0].length);
        const regex = new RegExp(`\\b${item}\\b`, 'g');
        
        if (!regex.test(afterImports)) {
          unusedImports.push({
            file: relPath,
            item: item,
            source: importSource,
            line: content.substring(0, match.index).split('\n').length
          });
          stats.importsUnused++;
        }
      });
    }
  });
  
  return unusedImports;
}

/**
 * Exécuter toutes les vérifications et générer un rapport
 */
async function validateProject() {
  console.log(chalk.green('🚀 Démarrage de l\'audit du projet Velo-Altitude\n'));
  console.log(chalk.gray(`Répertoire racine: ${PROJECT_ROOT}`));
  
  try {
    // Exécuter toutes les vérifications
    const unusedComponents = await findUnusedComponents();
    const unusedAssets = await findUnusedAssets();
    const unusedStyles = await findUnusedStyles();
    const unusedImports = await findUnusedImports();
    
    // Générer un rapport
    const reportData = {
      date: new Date().toISOString(),
      stats,
      unusedComponents,
      unusedAssets,
      unusedStyles,
      unusedImports
    };
    
    // Afficher le rapport dans la console
    displayReport(reportData);
    
    // Enregistrer le rapport dans un fichier
    const reportFile = path.join(__dirname, 'audit-report.json');
    fs.writeFileSync(reportFile, JSON.stringify(reportData, null, 2));
    
    console.log(chalk.green(`\n✅ Rapport d'audit enregistré: ${reportFile}`));
    
  } catch (error) {
    console.error(chalk.red(`\n❌ Erreur lors de l'audit: ${error.message}`));
    console.error(error.stack);
  }
}

/**
 * Affichage du rapport dans la console
 */
function displayReport(report) {
  console.log(chalk.green('\n📊 RAPPORT D\'AUDIT - VELO-ALTITUDE\n'));
  
  console.log(chalk.yellow('📦 Composants:'));
  console.log(`  Analysés: ${report.stats.componentsScanned}`);
  console.log(`  Inutilisés: ${report.stats.componentsUnused}`);
  
  console.log(chalk.yellow('\n🖼️ Assets:'));
  console.log(`  Analysés: ${report.stats.assetsScanned}`);
  console.log(`  Inutilisés: ${report.stats.assetsUnused}`);
  
  console.log(chalk.yellow('\n🎨 Styles CSS:'));
  console.log(`  Analysés: ${report.stats.stylesScanned}`);
  console.log(`  Inutilisés: ${report.stats.stylesUnused}`);
  
  console.log(chalk.yellow('\n📥 Imports:'));
  console.log(`  Analysés: ${report.stats.importsScanned}`);
  console.log(`  Inutilisés: ${report.stats.importsUnused}`);
  
  if (report.unusedComponents.length > 0) {
    console.log(chalk.red('\n⚠️ TOP 10 COMPOSANTS INUTILISÉS:'));
    report.unusedComponents
      .sort((a, b) => b.size - a.size)
      .slice(0, 10)
      .forEach(comp => {
        console.log(`  - ${comp.name} (${formatBytes(comp.size)}): ${comp.path}`);
      });
  }
  
  if (report.unusedAssets.length > 0) {
    console.log(chalk.red('\n⚠️ TOP 10 ASSETS INUTILISÉS:'));
    report.unusedAssets
      .sort((a, b) => b.size - a.size)
      .slice(0, 10)
      .forEach(asset => {
        console.log(`  - ${asset.name} (${formatBytes(asset.size)}): ${asset.path}`);
      });
  }
}

/**
 * Formater les octets en unités lisibles
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Exécuter la validation du projet
validateProject();
