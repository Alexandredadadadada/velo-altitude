/**
 * Script de réorganisation du contenu selon la structure standardisée
 * Velo-Altitude
 * 
 * Ce script organise tous les fichiers de données selon la structure définie:
 * - Cols: /server/data/cols/[pays]/[nom-du-col].json
 * - Programmes: /server/data/training/[niveau]/[nom-du-programme].json
 * - Recettes: /server/data/nutrition/[categorie]/[nom-de-recette].json
 * - Défis: /server/data/challenges/[type]/[nom-du-defi].json
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const slugify = require('slugify');

// Configuration
const CONFIG = {
  rootDir: path.resolve(__dirname, '..'),
  serverDataDir: path.resolve(__dirname, '../server/data'),
  srcDataDir: path.resolve(__dirname, '../src/data'),
  backupDir: path.resolve(__dirname, '../backup/data'),
  reportsDir: path.resolve(__dirname, '../docs'),
  structure: {
    cols: {
      sourceDirs: ['server/data/cols/enriched', 'src/data/cols'],
      targetDir: 'server/data/cols',
      countries: ['france', 'italie', 'espagne', 'suisse', 'autres']
    },
    training: {
      sourceDirs: ['server/data/training', 'src/data/training'],
      targetDir: 'server/data/training',
      levels: ['debutant', 'intermediaire', 'avance']
    },
    nutrition: {
      sourceDirs: ['server/data/nutrition', 'src/data/nutrition'],
      targetDir: 'server/data/nutrition',
      categories: ['recettes', 'plans', 'guides']
    },
    challenges: {
      sourceDirs: ['server/data/seven-majors', 'src/data/challenges'],
      targetDir: 'server/data/challenges',
      types: ['7-majeurs', 'saisonniers', 'thematiques']
    }
  }
};

// Créer les répertoires nécessaires
function createDirectories() {
  console.log(chalk.blue('Création des répertoires pour la structure standardisée...'));
  
  // Créer le répertoire de backup
  if (!fs.existsSync(CONFIG.backupDir)) {
    fs.mkdirSync(CONFIG.backupDir, { recursive: true });
    console.log(chalk.green(`✓ Répertoire de backup créé: ${CONFIG.backupDir}`));
  }
  
  // Créer les répertoires selon la structure
  Object.entries(CONFIG.structure).forEach(([contentType, structure]) => {
    const baseDir = path.resolve(CONFIG.rootDir, structure.targetDir);
    
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
      console.log(chalk.green(`✓ Répertoire créé: ${structure.targetDir}`));
    }
    
    // Créer les sous-répertoires
    const subDirs = structure.countries || structure.levels || structure.categories || structure.types || [];
    subDirs.forEach(subDir => {
      const fullPath = path.join(baseDir, subDir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(chalk.green(`✓ Sous-répertoire créé: ${structure.targetDir}/${subDir}`));
      }
    });
  });
}

// Sauvegarder les données existantes
function backupExistingData() {
  console.log(chalk.blue('\nSauvegarde des données existantes...'));
  
  Object.entries(CONFIG.structure).forEach(([contentType, structure]) => {
    structure.sourceDirs.forEach(sourceDir => {
      const fullSourceDir = path.resolve(CONFIG.rootDir, sourceDir);
      
      if (fs.existsSync(fullSourceDir)) {
        const backupTargetDir = path.join(CONFIG.backupDir, path.basename(sourceDir));
        
        if (!fs.existsSync(backupTargetDir)) {
          fs.mkdirSync(backupTargetDir, { recursive: true });
        }
        
        try {
          copyDirectory(fullSourceDir, backupTargetDir);
          console.log(chalk.green(`✓ Données sauvegardées: ${sourceDir} → ${backupTargetDir}`));
        } catch (error) {
          console.error(chalk.red(`Erreur lors de la sauvegarde de ${sourceDir}: ${error.message}`));
        }
      }
    });
  });
}

// Copier un répertoire et son contenu
function copyDirectory(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }
  
  const entries = fs.readdirSync(source, { withFileTypes: true });
  
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);
    
    if (entry.isDirectory()) {
      copyDirectory(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

// Déterminer le pays d'un col
function determineColCountry(col) {
  const name = col.name || '';
  const description = col.description || '';
  const region = col.region || '';
  const fullText = `${name} ${description} ${region}`.toLowerCase();
  
  if (/alpe d'huez|ventoux|galibier|tourmalet|izoard|france|français|alpes|pyrénées/i.test(fullText)) {
    return 'france';
  } else if (/stelvio|mortirolo|gavia|giro|italie|italien|dolomites/i.test(fullText)) {
    return 'italie';
  } else if (/angliru|veleta|espagne|espagnol/i.test(fullText)) {
    return 'espagne';
  } else if (/grimsel|suisse|alpes suisses|gotthard/i.test(fullText)) {
    return 'suisse';
  } else {
    return 'autres';
  }
}

// Déterminer le niveau d'un programme d'entraînement
function determineTrainingLevel(program) {
  const difficulty = program.difficulty || '';
  const name = program.name || '';
  const description = program.description || '';
  const fullText = `${name} ${description} ${difficulty}`.toLowerCase();
  
  if (/débutant|beginner|facile|easy|niveau 1|démarrer|initiation/i.test(fullText)) {
    return 'debutant';
  } else if (/intermédiaire|intermediate|moyen|medium|niveau 2/i.test(fullText)) {
    return 'intermediaire';
  } else {
    return 'avance';
  }
}

// Déterminer la catégorie d'un contenu nutritionnel
function determineNutritionCategory(item) {
  const type = item.type || '';
  const name = item.name || '';
  const fullText = `${name} ${type}`.toLowerCase();
  
  if (/recette|recipe|repas|meal|déjeuner|petit-déjeuner|dîner|snack/i.test(fullText)) {
    return 'recettes';
  } else if (/plan|planning|programme|régime|diet/i.test(fullText)) {
    return 'plans';
  } else {
    return 'guides';
  }
}

// Déterminer le type d'un défi
function determineChallengeType(challenge) {
  const type = challenge.type || '';
  const name = challenge.name || '';
  const description = challenge.description || '';
  const fullText = `${name} ${description} ${type}`.toLowerCase();
  
  if (/7 majeurs|seven majors|7-majeurs/i.test(fullText)) {
    return '7-majeurs';
  } else if (/saison|season|hiver|été|winter|summer|printemps|automne/i.test(fullText)) {
    return 'saisonniers';
  } else {
    return 'thematiques';
  }
}

// Standardiser un slug
function standardizeSlug(text) {
  return slugify(text, {
    replacement: '-',
    remove: /[*+~.()'"!:@]/g,
    lower: true,
    strict: true,
    locale: 'fr'
  });
}

// Traiter les fichiers JSON
function processJsonFiles(sourceDir, targetDir, categorizer, contentType) {
  console.log(chalk.blue(`\nTraitement des fichiers JSON dans ${sourceDir}...`));
  
  if (!fs.existsSync(sourceDir)) {
    console.log(chalk.yellow(`Le répertoire source n'existe pas: ${sourceDir}`));
    return [];
  }
  
  const processedItems = [];
  const files = fs.readdirSync(sourceDir);
  
  for (const file of files) {
    const sourcePath = path.join(sourceDir, file);
    
    // Ignorer les répertoires et les fichiers non-JSON
    if (fs.statSync(sourcePath).isDirectory() || !file.endsWith('.json')) {
      continue;
    }
    
    try {
      // Lire le fichier JSON
      const data = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
      
      // Déterminer la catégorie
      let category;
      switch (contentType) {
        case 'cols':
          category = determineColCountry(data);
          break;
        case 'training':
          category = determineTrainingLevel(data);
          break;
        case 'nutrition':
          category = determineNutritionCategory(data);
          break;
        case 'challenges':
          category = determineChallengeType(data);
          break;
        default:
          category = 'default';
      }
      
      // Créer le slug standardisé
      const name = data.name || path.basename(file, '.json');
      const slug = data.slug || standardizeSlug(name);
      
      // Mettre à jour le slug dans les données
      data.slug = slug;
      
      // Créer le nom de fichier
      const targetFileName = `${slug}.json`;
      const targetPath = path.join(targetDir, category, targetFileName);
      
      // Écrire le fichier dans le répertoire cible
      const targetDirPath = path.dirname(targetPath);
      if (!fs.existsSync(targetDirPath)) {
        fs.mkdirSync(targetDirPath, { recursive: true });
      }
      
      fs.writeFileSync(targetPath, JSON.stringify(data, null, 2), 'utf8');
      console.log(chalk.green(`✓ Fichier traité: ${file} → ${category}/${targetFileName}`));
      
      // Ajouter à la liste des éléments traités
      processedItems.push({
        id: data.id || slug,
        name: name,
        slug: slug,
        category: category,
        sourcePath: sourcePath,
        targetPath: targetPath
      });
    } catch (error) {
      console.error(chalk.red(`Erreur lors du traitement de ${file}: ${error.message}`));
    }
  }
  
  return processedItems;
}

// Traiter les fichiers JavaScript contenant des données
function processJsDataFiles(sourceDir, targetDir, categorizer, contentType) {
  console.log(chalk.blue(`\nTraitement des fichiers JavaScript dans ${sourceDir}...`));
  
  if (!fs.existsSync(sourceDir)) {
    console.log(chalk.yellow(`Le répertoire source n'existe pas: ${sourceDir}`));
    return [];
  }
  
  const processedItems = [];
  const files = fs.readdirSync(sourceDir);
  
  for (const file of files) {
    const sourcePath = path.join(sourceDir, file);
    
    // Ignorer les répertoires et les fichiers non-JS
    if (fs.statSync(sourcePath).isDirectory() || !file.endsWith('.js')) {
      continue;
    }
    
    try {
      // Lire le fichier JS
      const content = fs.readFileSync(sourcePath, 'utf8');
      
      // Extraire le tableau d'objets (approche simplifiée)
      const arrayMatch = content.match(/const\s+\w+\s*=\s*\[([\s\S]*?)\];/m) || 
                          content.match(/export\s+const\s+\w+\s*=\s*\[([\s\S]*?)\];/m) ||
                          content.match(/export\s+default\s*\[([\s\S]*?)\];/m) ||
                          content.match(/module\.exports\s*=\s*\[([\s\S]*?)\];/m);
      
      if (arrayMatch) {
        // Prétraiter pour créer un tableau JSON valide
        let jsonString = `[${arrayMatch[1]}]`;
        
        // Remplacer les commentaires et autres éléments JS non-JSON
        jsonString = jsonString.replace(/\/\/.*$/gm, '');
        jsonString = jsonString.replace(/\/\*[\s\S]*?\*\//g, '');
        
        // Essayer de convertir en JSON valide (approche simplifiée)
        jsonString = jsonString.replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":');
        jsonString = jsonString.replace(/'/g, '"');
        
        // Tenter de parser
        try {
          const dataArray = eval(`(${jsonString})`); // Évaluation pour gérer les objets JS
          
          // Traiter chaque élément
          for (let i = 0; i < dataArray.length; i++) {
            const item = dataArray[i];
            
            // Déterminer la catégorie
            let category;
            switch (contentType) {
              case 'cols':
                category = determineColCountry(item);
                break;
              case 'training':
                category = determineTrainingLevel(item);
                break;
              case 'nutrition':
                category = determineNutritionCategory(item);
                break;
              case 'challenges':
                category = determineChallengeType(item);
                break;
              default:
                category = 'default';
            }
            
            // Créer le slug standardisé
            const name = item.name || `item-${i}`;
            const slug = item.slug || standardizeSlug(name);
            
            // Mettre à jour le slug
            item.slug = slug;
            
            // Créer le nom de fichier
            const targetFileName = `${slug}.json`;
            const targetPath = path.join(targetDir, category, targetFileName);
            
            // Écrire le fichier dans le répertoire cible
            const targetDirPath = path.dirname(targetPath);
            if (!fs.existsSync(targetDirPath)) {
              fs.mkdirSync(targetDirPath, { recursive: true });
            }
            
            fs.writeFileSync(targetPath, JSON.stringify(item, null, 2), 'utf8');
            console.log(chalk.green(`✓ Élément extrait: ${file}[${i}] → ${category}/${targetFileName}`));
            
            // Ajouter à la liste des éléments traités
            processedItems.push({
              id: item.id || slug,
              name: name,
              slug: slug,
              category: category,
              sourcePath: `${sourcePath}[${i}]`,
              targetPath: targetPath
            });
          }
        } catch (parseError) {
          console.error(chalk.red(`Erreur de parsing pour ${file}: ${parseError.message}`));
        }
      } else {
        console.log(chalk.yellow(`Aucun tableau d'objets trouvé dans ${file}`));
      }
    } catch (error) {
      console.error(chalk.red(`Erreur lors du traitement de ${file}: ${error.message}`));
    }
  }
  
  return processedItems;
}

// Générer un rapport sur la réorganisation
function generateReorganizationReport(processedItems) {
  console.log(chalk.blue('\nGénération du rapport de réorganisation...'));
  
  // Regrouper par type de contenu
  const itemsByType = {};
  
  processedItems.forEach(item => {
    if (!itemsByType[item.contentType]) {
      itemsByType[item.contentType] = [];
    }
    itemsByType[item.contentType].push(item);
  });
  
  let report = `# Rapport de Réorganisation des Données - Velo-Altitude

*Généré le ${new Date().toISOString().split('T')[0]}*

Ce rapport détaille la réorganisation des données selon la structure standardisée définie pour le projet Velo-Altitude.

## Résumé

`;

  // Ajouter le résumé
  Object.entries(itemsByType).forEach(([contentType, items]) => {
    report += `### ${contentType.charAt(0).toUpperCase() + contentType.slice(1)}\n\n`;
    report += `- **Total d'éléments traités**: ${items.length}\n`;
    
    // Regrouper par catégorie
    const itemsByCategory = {};
    items.forEach(item => {
      if (!itemsByCategory[item.category]) {
        itemsByCategory[item.category] = [];
      }
      itemsByCategory[item.category].push(item);
    });
    
    report += `- **Répartition par catégorie**:\n`;
    Object.entries(itemsByCategory).forEach(([category, categoryItems]) => {
      report += `  - ${category}: ${categoryItems.length} éléments\n`;
    });
    
    report += '\n';
  });

  // Ajouter les détails par type de contenu
  Object.entries(itemsByType).forEach(([contentType, items]) => {
    report += `## Détails - ${contentType.charAt(0).toUpperCase() + contentType.slice(1)}\n\n`;
    
    // Regrouper par catégorie
    const itemsByCategory = {};
    items.forEach(item => {
      if (!itemsByCategory[item.category]) {
        itemsByCategory[item.category] = [];
      }
      itemsByCategory[item.category].push(item);
    });
    
    // Générer les tableaux par catégorie
    Object.entries(itemsByCategory).forEach(([category, categoryItems]) => {
      report += `### Catégorie: ${category}\n\n`;
      report += `| ID | Nom | Slug | Chemin source | Chemin cible |\n`;
      report += `|----|-----|------|--------------|-------------|\n`;
      
      categoryItems.forEach(item => {
        const sourcePathRelative = path.relative(CONFIG.rootDir, item.sourcePath);
        const targetPathRelative = path.relative(CONFIG.rootDir, item.targetPath);
        
        report += `| ${item.id} | ${item.name} | ${item.slug} | ${sourcePathRelative} | ${targetPathRelative} |\n`;
      });
      
      report += '\n';
    });
  });

  // Ajouter les recommandations
  report += `## Recommandations

1. **Mise à jour des importations**:
   - Mettre à jour les imports dans les composants React pour utiliser les nouveaux chemins
   - Exemple: \`import { getColById } from '../server/data/colsApi';\`

2. **Validation des données**:
   - Vérifier l'intégrité de toutes les données après la migration
   - Exécuter le script de validation: \`node scripts/validate-content.js\`

3. **Tests d'intégration**:
   - Tester toutes les fonctionnalités qui dépendent de ces données
   - S'assurer que les liens et la navigation fonctionnent correctement

4. **Déploiement**:
   - Mettre à jour le script de build pour inclure les nouvelles structures
   - Tester le déploiement sur un environnement de staging

`;

  // Écrire le rapport
  const reportPath = path.join(CONFIG.reportsDir, 'CONTENT_REORGANIZATION_REPORT.md');
  fs.writeFileSync(reportPath, report);
  console.log(chalk.green(`✓ Rapport de réorganisation généré: ${reportPath}`));
}

// Fonction principale
async function main() {
  console.log(chalk.cyan('=== Réorganisation du contenu - Velo-Altitude ===\n'));
  
  // Créer les répertoires nécessaires
  createDirectories();
  
  // Sauvegarder les données existantes
  backupExistingData();
  
  // Traiter les différents types de contenu
  const processedItems = [];
  
  // Traiter les cols
  Object.entries(CONFIG.structure).forEach(([contentType, structure]) => {
    const targetDir = path.resolve(CONFIG.rootDir, structure.targetDir);
    
    structure.sourceDirs.forEach(sourceDir => {
      const fullSourceDir = path.resolve(CONFIG.rootDir, sourceDir);
      
      if (fs.existsSync(fullSourceDir)) {
        // Traiter les fichiers JSON
        const jsonItems = processJsonFiles(fullSourceDir, targetDir, null, contentType);
        jsonItems.forEach(item => processedItems.push({ ...item, contentType }));
        
        // Traiter les fichiers JS
        const jsItems = processJsDataFiles(fullSourceDir, targetDir, null, contentType);
        jsItems.forEach(item => processedItems.push({ ...item, contentType }));
      }
    });
  });
  
  // Générer le rapport de réorganisation
  generateReorganizationReport(processedItems);
  
  console.log(chalk.cyan('\n=== Réorganisation terminée avec succès ==='));
  console.log(chalk.yellow('\nPour finaliser l\'optimisation, exécutez les scripts complémentaires:'));
  console.log(chalk.yellow('1. node scripts/update-react-components.js'));
  console.log(chalk.yellow('2. node scripts/validate-url-structure.js'));
  console.log(chalk.yellow('3. node scripts/generate-master-inventory.js'));
}

// Exécuter la fonction principale
main().catch(error => {
  console.error(chalk.red(`Erreur lors de l'exécution du script: ${error.message}`));
});
