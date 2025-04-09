/**
 * Script pour mettre à jour les références aux anciens composants de visualisation
 * Remplace les importations existantes par le nouveau composant unifié
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

// Configuration
const rootDir = path.resolve(__dirname, '..');
const ignoreDirectories = ['node_modules', 'dist', 'build', '.git', 'backup'];

// Modèles de recherche
const importPatterns = [
  /import\s+(\w+)\s+from\s+['"](.+)(Col3DVisualization|ColVisualization3D)['"];?/g,
  /import\s+{\s*(.+)\s*}\s+from\s+['"](.+)(visualization)['"];?/g,
];

// Remplacement
const newImportStatement = 'import { ColVisualization } from \'../../components/visualization\';';

// Fonction pour trouver tous les fichiers JS/JSX récursivement
async function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!ignoreDirectories.includes(file)) {
        await findFiles(filePath, fileList);
      }
    } else if (/\.(js|jsx|ts|tsx)$/.test(file)) {
      fileList.push(filePath);
    }
  }

  return fileList;
}

// Fonction pour vérifier et mettre à jour un fichier
async function processFile(filePath) {
  try {
    const content = await readFileAsync(filePath, 'utf8');
    let modified = false;
    let newContent = content;

    // Remplacer les imports
    for (const pattern of importPatterns) {
      if (pattern.test(content)) {
        console.log(`[Update] Fichier à modifier: ${filePath}`);
        modified = true;

        // Reset le regex (sinon lastIndex ne sera pas réinitialisé)
        pattern.lastIndex = 0;
        
        // Identifier les imports à remplacer
        const matches = [...content.matchAll(pattern)];
        
        if (matches.length > 0) {
          console.log(`[Update] - ${matches.length} imports trouvés`);
          
          // Remplacer chaque import
          for (const match of matches) {
            const fullMatch = match[0];
            const componentName = match[1];
            
            // Remplacer l'import
            newContent = newContent.replace(fullMatch, newImportStatement);
            
            // Remplacer les usages du composant
            const usagePattern = new RegExp(`<${componentName}\\s+`, 'g');
            newContent = newContent.replace(usagePattern, '<ColVisualization ');
            
            console.log(`[Update] - Remplacé: ${fullMatch.trim()}`);
            console.log(`[Update] - Par: ${newImportStatement.trim()}`);
          }
        }
      }
    }

    // Sauvegarder les modifications
    if (modified) {
      await writeFileAsync(filePath, newContent, 'utf8');
      console.log(`[Update] ✅ Fichier mis à jour: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`[Update] ❌ Erreur lors du traitement du fichier ${filePath}:`, error);
    return false;
  }
}

// Fonction principale
async function main() {
  console.log('[Update] Recherche des fichiers à mettre à jour...');
  
  // Trouver tous les fichiers JS/JSX
  const files = await findFiles(rootDir);
  console.log(`[Update] ${files.length} fichiers trouvés`);
  
  // Statistiques
  let updatedCount = 0;
  
  // Traiter chaque fichier
  for (const file of files) {
    const updated = await processFile(file);
    if (updated) updatedCount++;
  }
  
  // Résumé
  console.log('\n[Update] Résumé des mises à jour:');
  console.log(`[Update] - Fichiers scannés: ${files.length}`);
  console.log(`[Update] - Fichiers mis à jour: ${updatedCount}`);
  console.log('[Update] Opération terminée');
}

// Exécuter le script
main().catch(error => {
  console.error('[Update] ❌ Erreur lors de l\'exécution du script:', error);
  process.exit(1);
});
