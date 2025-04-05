/**
 * Script de correction des doublons de cols et standardisation des URLs
 * Velo-Altitude
 * 
 * Ce script identifie et fusionne les doublons de cols identifiés dans l'analyse d'inventaire,
 * standardise les noms et les URLs, et assure la cohérence des données.
 */

const fs = require('fs');
const path = require('path');
const slugify = require('slugify');

// Configuration
const CONFIG = {
  colsDir: path.join(__dirname, '../src/data/cols'),
  colsDataFile: path.join(__dirname, '../src/data/colsData.js'),
  outputDir: path.join(__dirname, '../src/data/enhanced'),
  backupDir: path.join(__dirname, '../backup/cols'),
  duplicateMappings: {
    // Format: [nom à conserver]: [noms à fusionner]
    'passo-dello-stelvio': ['stelvio-pass'],
    'pico-de-veleta': ['pico-veleta'],
    'passo-del-mortirolo': ['passo-dello-mortirolo'],
    'colle-delle-finestre': ['colle-del-finestre'],
    'passo-di-gavia': ['passo-gavia']
  },
  standardizedNames: {
    'passo-dello-stelvio': 'Passo dello Stelvio',
    'pico-de-veleta': 'Pico de Veleta',
    'passo-del-mortirolo': 'Passo del Mortirolo',
    'colle-delle-finestre': 'Colle delle Finestre',
    'passo-di-gavia': 'Passo di Gavia'
  }
};

// Créer les répertoires nécessaires s'ils n'existent pas
function ensureDirectoriesExist() {
  [CONFIG.outputDir, CONFIG.backupDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

// Charger tous les cols depuis les fichiers JS
function loadAllCols() {
  console.log('Chargement des données de cols...');
  
  // Créer une sauvegarde du fichier colsData.js
  const backupPath = path.join(CONFIG.backupDir, 'colsData.js.bak');
  fs.copyFileSync(CONFIG.colsDataFile, backupPath);
  console.log(`Sauvegarde créée: ${backupPath}`);
  
  // Charger les fichiers de cols
  const colFiles = fs.readdirSync(CONFIG.colsDir)
    .filter(file => file.endsWith('.js'))
    .map(file => path.join(CONFIG.colsDir, file));
  
  let allCols = [];
  
  colFiles.forEach(filePath => {
    try {
      // Supprimer le cache pour recharger le fichier
      delete require.cache[require.resolve(filePath)];
      const colsData = require(filePath);
      
      // Créer une sauvegarde du fichier
      const fileName = path.basename(filePath);
      const backupPath = path.join(CONFIG.backupDir, `${fileName}.bak`);
      fs.copyFileSync(filePath, backupPath);
      
      if (Array.isArray(colsData)) {
        allCols = [...allCols, ...colsData];
        console.log(`Chargé ${colsData.length} cols depuis ${fileName}`);
      } else if (colsData.default && Array.isArray(colsData.default)) {
        allCols = [...allCols, ...colsData.default];
        console.log(`Chargé ${colsData.default.length} cols depuis ${fileName}`);
      }
    } catch (error) {
      console.error(`Erreur lors du chargement de ${filePath}: ${error.message}`);
    }
  });
  
  console.log(`Total: ${allCols.length} cols chargés`);
  return allCols;
}

// Identifier les doublons basés sur les mappings configurés
function identifyDuplicates(cols) {
  console.log('\nIdentification des doublons...');
  
  const duplicates = {};
  const slugMap = {};
  
  // Créer une map des cols par slug pour faciliter la recherche
  cols.forEach(col => {
    if (col.slug) {
      slugMap[col.slug] = col;
    } else if (col.id) {
      // Si pas de slug, utiliser l'ID
      slugMap[col.id] = col;
    }
  });
  
  // Identifier les doublons basés sur les mappings configurés
  Object.entries(CONFIG.duplicateMappings).forEach(([primarySlug, duplicateSlugs]) => {
    const primaryCol = slugMap[primarySlug];
    
    if (!primaryCol) {
      console.log(`⚠️ Col principal non trouvé: ${primarySlug}`);
      return;
    }
    
    duplicates[primarySlug] = {
      primary: primaryCol,
      duplicates: []
    };
    
    duplicateSlugs.forEach(dupSlug => {
      const dupCol = slugMap[dupSlug];
      if (dupCol) {
        duplicates[primarySlug].duplicates.push(dupCol);
        console.log(`✓ Doublon trouvé: ${dupSlug} -> ${primarySlug}`);
      } else {
        console.log(`⚠️ Doublon non trouvé: ${dupSlug}`);
      }
    });
  });
  
  return duplicates;
}

// Fusionner les doublons en gardant les meilleures informations
function mergeDuplicates(duplicatesMap) {
  console.log('\nFusion des doublons...');
  
  const mergedCols = [];
  const processedSlugs = new Set();
  
  // Traiter les doublons identifiés
  Object.entries(duplicatesMap).forEach(([primarySlug, data]) => {
    const { primary, duplicates } = data;
    
    // Créer une copie du col principal
    const mergedCol = { ...primary };
    
    // Marquer comme traité
    processedSlugs.add(primarySlug);
    duplicates.forEach(dup => {
      if (dup.slug) processedSlugs.add(dup.slug);
      if (dup.id && dup.id !== dup.slug) processedSlugs.add(dup.id);
    });
    
    // Fusionner les informations des doublons
    duplicates.forEach(dupCol => {
      Object.entries(dupCol).forEach(([key, value]) => {
        // Ne pas écraser les champs clés comme id, slug, name
        if (['id', 'slug', 'name'].includes(key)) {
          return;
        }
        
        // Si le champ est vide dans le col principal, utiliser celui du doublon
        if (!mergedCol[key] && value) {
          mergedCol[key] = value;
        }
        
        // Si le champ est un tableau, fusionner les tableaux sans doublons
        if (Array.isArray(mergedCol[key]) && Array.isArray(value)) {
          // Pour les tableaux d'objets (comme les images), fusionner par URL
          if (mergedCol[key][0] && typeof mergedCol[key][0] === 'object') {
            const existingUrls = new Set(mergedCol[key].map(item => item.url || item.src || JSON.stringify(item)));
            value.forEach(item => {
              const itemKey = item.url || item.src || JSON.stringify(item);
              if (!existingUrls.has(itemKey)) {
                mergedCol[key].push(item);
              }
            });
          } else {
            // Pour les tableaux simples, fusionner sans doublons
            mergedCol[key] = [...new Set([...mergedCol[key], ...value])];
          }
        }
        
        // Pour les descriptions, prendre la plus longue ou fusionner
        if (key === 'description' && typeof value === 'string' && typeof mergedCol[key] === 'string') {
          if (value.length > mergedCol[key].length) {
            mergedCol[key] = value;
          }
        }
        
        // Pour les objets de description multilingue
        if (key === 'description' && typeof value === 'object' && typeof mergedCol[key] === 'object') {
          Object.entries(value).forEach(([lang, text]) => {
            if (!mergedCol[key][lang] || text.length > mergedCol[key][lang].length) {
              mergedCol[key][lang] = text;
            }
          });
        }
      });
    });
    
    // Standardiser le nom si défini dans la configuration
    if (CONFIG.standardizedNames[primarySlug]) {
      mergedCol.name = CONFIG.standardizedNames[primarySlug];
    }
    
    // S'assurer que le slug est correct
    mergedCol.slug = primarySlug;
    
    // S'assurer que l'ID est cohérent avec le slug
    mergedCol.id = primarySlug;
    
    mergedCols.push(mergedCol);
    console.log(`✓ Fusion terminée pour: ${mergedCol.name} (${primarySlug})`);
  });
  
  return mergedCols;
}

// Standardiser tous les cols (pas seulement les doublons)
function standardizeAllCols(cols, mergedCols) {
  console.log('\nStandardisation de tous les cols...');
  
  // Créer un ensemble des slugs déjà traités (doublons)
  const processedSlugs = new Set(mergedCols.map(col => col.slug));
  
  // Traiter les cols non dupliqués
  cols.forEach(col => {
    // Ignorer les cols déjà traités (doublons)
    if (col.slug && processedSlugs.has(col.slug)) {
      return;
    }
    if (col.id && processedSlugs.has(col.id)) {
      return;
    }
    
    // Créer une copie du col
    const standardizedCol = { ...col };
    
    // S'assurer que le col a un nom
    if (!standardizedCol.name) {
      console.log(`⚠️ Col sans nom trouvé, ID: ${standardizedCol.id}`);
      return;
    }
    
    // Générer un slug si manquant
    if (!standardizedCol.slug) {
      standardizedCol.slug = slugify(standardizedCol.name, { lower: true, strict: true });
      console.log(`✓ Slug généré pour: ${standardizedCol.name} -> ${standardizedCol.slug}`);
    }
    
    // S'assurer que l'ID est cohérent avec le slug
    standardizedCol.id = standardizedCol.slug;
    
    // Ajouter aux cols fusionnés
    mergedCols.push(standardizedCol);
  });
  
  console.log(`✓ Standardisation terminée pour ${mergedCols.length} cols`);
  return mergedCols;
}

// Sauvegarder les cols standardisés et fusionnés
function saveStandardizedCols(standardizedCols) {
  console.log('\nSauvegarde des cols standardisés...');
  
  // Sauvegarder chaque col dans un fichier JSON individuel
  standardizedCols.forEach(col => {
    const filePath = path.join(CONFIG.outputDir, `${col.slug}.json`);
    fs.writeFileSync(filePath, JSON.stringify(col, null, 2), 'utf8');
  });
  
  // Créer un fichier index.json avec tous les cols
  const indexPath = path.join(CONFIG.outputDir, 'index.json');
  fs.writeFileSync(indexPath, JSON.stringify(standardizedCols, null, 2), 'utf8');
  
  console.log(`✓ ${standardizedCols.length} cols sauvegardés dans ${CONFIG.outputDir}`);
  console.log(`✓ Index créé: ${indexPath}`);
}

// Générer un rapport sur les modifications effectuées
function generateReport(originalCols, standardizedCols, duplicatesMap) {
  console.log('\nGénération du rapport...');
  
  const reportPath = path.join(__dirname, '../docs/cols-standardization-report.md');
  
  let report = '# Rapport de Standardisation des Cols - Velo-Altitude\n\n';
  report += `*Date: ${new Date().toISOString().split('T')[0]}*\n\n`;
  
  // Statistiques
  report += '## Statistiques\n\n';
  report += `- Nombre de cols avant standardisation: ${originalCols.length}\n`;
  report += `- Nombre de cols après standardisation: ${standardizedCols.length}\n`;
  report += `- Doublons fusionnés: ${Object.keys(duplicatesMap).length}\n\n`;
  
  // Détails des fusions
  report += '## Détails des fusions\n\n';
  
  Object.entries(duplicatesMap).forEach(([primarySlug, data]) => {
    const { primary, duplicates } = data;
    
    report += `### ${primary.name} (${primarySlug})\n\n`;
    report += `- **Nom standardisé**: ${CONFIG.standardizedNames[primarySlug] || primary.name}\n`;
    report += `- **Doublons fusionnés**:\n`;
    
    duplicates.forEach(dup => {
      report += `  - ${dup.name} (${dup.slug || dup.id})\n`;
    });
    
    report += '\n';
  });
  
  // Recommandations
  report += '## Recommandations\n\n';
  report += '1. Mettre à jour les références aux anciens slugs dans le code\n';
  report += '2. Mettre à jour les URLs dans les liens internes\n';
  report += '3. Configurer des redirections pour les anciennes URLs\n';
  report += '4. Vérifier les références dans les programmes d\'entraînement et parcours\n\n';
  
  // Écrire le rapport
  fs.writeFileSync(reportPath, report, 'utf8');
  console.log(`✓ Rapport généré: ${reportPath}`);
}

// Fonction principale
async function main() {
  console.log('=== Correction des doublons de cols et standardisation des URLs ===\n');
  
  // S'assurer que les répertoires existent
  ensureDirectoriesExist();
  
  // Charger tous les cols
  const allCols = loadAllCols();
  
  // Identifier les doublons
  const duplicatesMap = identifyDuplicates(allCols);
  
  // Fusionner les doublons
  const mergedCols = mergeDuplicates(duplicatesMap);
  
  // Standardiser tous les cols
  const standardizedCols = standardizeAllCols(allCols, mergedCols);
  
  // Sauvegarder les cols standardisés
  saveStandardizedCols(standardizedCols);
  
  // Générer un rapport
  generateReport(allCols, standardizedCols, duplicatesMap);
  
  console.log('\n=== Traitement terminé avec succès ===');
}

// Exécuter la fonction principale
main().catch(error => {
  console.error(`Erreur lors de l'exécution du script: ${error.message}`);
});
