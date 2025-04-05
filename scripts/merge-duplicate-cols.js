/**
 * Script de fusion des cols en doublon
 * Velo-Altitude
 * 
 * Ce script identifie et fusionne automatiquement les cols en doublon
 * en conservant les informations les plus complètes de chaque version.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const chalk = require('chalk') || { green: (text) => text, red: (text) => text, yellow: (text) => text, blue: (text) => text };

// Chemin du répertoire des cols
const COLS_DIR = path.join(__dirname, '../server/data/cols/enriched');

// Chemin du répertoire de sauvegarde
const BACKUP_DIR = path.join(__dirname, '../server/data/cols/backup');

// Liste des doublons connus (préidentifiés)
const KNOWN_DUPLICATES = [
  {
    primary: 'passo-dello-stelvio.json',
    duplicates: ['stelvio-pass.json'],
    primaryName: 'Passo dello Stelvio'
  },
  {
    primary: 'pico-de-veleta.json',
    duplicates: ['pico-veleta.json'],
    primaryName: 'Pico de Veleta'
  },
  {
    primary: 'passo-di-gavia.json',
    duplicates: ['passo-gavia.json'],
    primaryName: 'Passo di Gavia'
  },
  {
    primary: 'colle-delle-finestre.json',
    duplicates: ['colle-del-finestre.json'],
    primaryName: 'Colle delle Finestre'
  },
  {
    primary: 'passo-del-mortirolo.json',
    duplicates: ['passo-dello-mortirolo.json'],
    primaryName: 'Passo del Mortirolo'
  }
];

/**
 * Crée un répertoire de sauvegarde s'il n'existe pas
 */
function createBackupDirectory() {
  console.log(chalk.blue('Création du répertoire de sauvegarde...'));
  
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(chalk.green(`✓ Répertoire de sauvegarde créé: ${BACKUP_DIR}`));
  } else {
    console.log(chalk.yellow(`! Répertoire de sauvegarde existant: ${BACKUP_DIR}`));
  }
}

/**
 * Fusionne deux objets en privilégiant les valeurs non vides du second
 * @param {Object} target Objet cible
 * @param {Object} source Objet source
 * @returns {Object} Objet fusionné
 */
function deepMerge(target, source) {
  // Si la source est null ou undefined, retourner la cible
  if (!source) return target;
  
  // Si la cible est null ou undefined, retourner la source
  if (!target) return source;
  
  // Si les deux sont des tableaux, les combiner
  if (Array.isArray(target) && Array.isArray(source)) {
    // Éliminer les doublons lors de la fusion des tableaux
    return [...new Set([...target, ...source])];
  }
  
  // Si les deux sont des objets, fusionner récursivement
  if (typeof target === 'object' && typeof source === 'object' && !Array.isArray(target) && !Array.isArray(source)) {
    const result = { ...target };
    
    for (const key in source) {
      // Si la clé existe dans la cible et les deux sont des objets, fusionner récursivement
      if (key in result && typeof result[key] === 'object' && typeof source[key] === 'object') {
        result[key] = deepMerge(result[key], source[key]);
      } 
      // Si la valeur source est non vide, la privilégier
      else if (source[key] !== null && source[key] !== undefined && 
              (source[key] !== '' || typeof source[key] !== 'string') &&
              (!Array.isArray(source[key]) || source[key].length > 0)) {
        result[key] = source[key];
      }
    }
    
    return result;
  }
  
  // Privilégier la valeur non vide
  if (source !== null && source !== undefined && 
      (source !== '' || typeof source !== 'string') &&
      (!Array.isArray(source) || source.length > 0)) {
    return source;
  }
  
  return target;
}

/**
 * Calcule le taux de complétude d'un objet
 * @param {Object} obj Objet à analyser
 * @returns {number} Pourcentage de complétude (0-100)
 */
function calculateCompleteness(obj) {
  // Champs attendus pour un col
  const expectedFields = [
    'id', 'name', 'slug', 'country', 'region', 'altitude', 'length', 'gradient',
    'difficulty', 'description', 'coordinates', 'elevation_profile', 'images',
    'videos', 'three_d_model', 'weather', 'services', 'testimonials', 
    'related_cols', 'status'
  ];
  
  let filledFields = 0;
  let totalFields = expectedFields.length;
  
  expectedFields.forEach(field => {
    // Vérifier si le champ existe
    if (obj[field] !== undefined && obj[field] !== null) {
      // Si c'est un tableau, vérifier qu'il n'est pas vide
      if (Array.isArray(obj[field])) {
        if (obj[field].length > 0) {
          filledFields++;
        }
      }
      // Si c'est un objet, vérifier qu'il n'est pas vide
      else if (typeof obj[field] === 'object') {
        if (Object.keys(obj[field]).length > 0) {
          filledFields++;
        }
      }
      // Pour les types simples, vérifier qu'il n'est pas vide
      else if (obj[field] !== '') {
        filledFields++;
      }
    }
  });
  
  return Math.round((filledFields / totalFields) * 100);
}

/**
 * Fusionne une paire de cols en doublon
 * @param {string} primaryFile Fichier primaire à conserver
 * @param {string} duplicateFile Fichier en doublon à fusionner
 * @returns {boolean} True si la fusion a réussi
 */
function mergeCols(primaryFile, duplicateFile) {
  console.log(chalk.blue(`Fusion de ${duplicateFile} vers ${primaryFile}...`));
  
  try {
    // Lire les fichiers
    const primaryPath = path.join(COLS_DIR, primaryFile);
    const duplicatePath = path.join(COLS_DIR, duplicateFile);
    
    if (!fs.existsSync(primaryPath)) {
      console.log(chalk.red(`✗ Fichier primaire non trouvé: ${primaryPath}`));
      return false;
    }
    
    if (!fs.existsSync(duplicatePath)) {
      console.log(chalk.red(`✗ Fichier doublon non trouvé: ${duplicatePath}`));
      return false;
    }
    
    const primaryData = JSON.parse(fs.readFileSync(primaryPath, 'utf8'));
    const duplicateData = JSON.parse(fs.readFileSync(duplicatePath, 'utf8'));
    
    // Calculer les taux de complétude actuels
    const primaryCompleteness = primaryData.completeness || calculateCompleteness(primaryData);
    const duplicateCompleteness = duplicateData.completeness || calculateCompleteness(duplicateData);
    
    console.log(chalk.yellow(`! Complétude avant fusion: ${primaryFile}: ${primaryCompleteness}%, ${duplicateFile}: ${duplicateCompleteness}%`));
    
    // Fusionner les données
    const mergedData = deepMerge(primaryData, duplicateData);
    
    // S'assurer que le nom et le slug sont corrects
    const primaryName = primaryData.name || duplicateData.name;
    mergedData.name = primaryName;
    mergedData.slug = primaryData.slug;
    
    // Calculer le nouveau taux de complétude
    mergedData.completeness = calculateCompleteness(mergedData);
    
    // Mettre à jour la date de dernière modification
    mergedData.last_updated = new Date().toISOString();
    
    // Créer une sauvegarde du fichier en doublon
    const backupPath = path.join(BACKUP_DIR, duplicateFile);
    fs.writeFileSync(backupPath, JSON.stringify(duplicateData, null, 2), 'utf8');
    
    // Écrire les données fusionnées dans le fichier primaire
    fs.writeFileSync(primaryPath, JSON.stringify(mergedData, null, 2), 'utf8');
    
    // Supprimer le fichier en doublon
    fs.unlinkSync(duplicatePath);
    
    console.log(chalk.green(`✓ Fusion réussie. Nouvelle complétude: ${mergedData.completeness}%`));
    return true;
    
  } catch (error) {
    console.log(chalk.red(`✗ Erreur lors de la fusion: ${error.message}`));
    return false;
  }
}

/**
 * Recherche d'autres doublons potentiels basés sur les noms similaires
 * @returns {Array} Liste des doublons potentiels
 */
function findPotentialDuplicates() {
  console.log(chalk.blue('Recherche de doublons potentiels supplémentaires...'));
  
  const potentialDuplicates = [];
  const colNames = new Map();
  
  if (!fs.existsSync(COLS_DIR)) {
    console.log(chalk.red(`✗ Répertoire des cols non trouvé: ${COLS_DIR}`));
    return potentialDuplicates;
  }
  
  // Lire tous les fichiers JSON
  const files = fs.readdirSync(COLS_DIR).filter(file => file.endsWith('.json'));
  
  // Première passe: collecter tous les noms normalisés
  files.forEach(file => {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(COLS_DIR, file), 'utf8'));
      
      if (data.name) {
        // Normaliser le nom
        const normalizedName = data.name.toLowerCase()
          .replace(/[àáâãäå]/g, 'a')
          .replace(/[èéêë]/g, 'e')
          .replace(/[ìíîï]/g, 'i')
          .replace(/[òóôõö]/g, 'o')
          .replace(/[ùúûü]/g, 'u')
          .replace(/[ç]/g, 'c')
          .replace(/pass|passo|col|colle|puerto|pic|mount|monte/g, '')
          .trim();
        
        if (colNames.has(normalizedName)) {
          // Vérifier si ce n'est pas déjà dans la liste des doublons connus
          const isKnown = KNOWN_DUPLICATES.some(dup => 
            dup.primary === file || dup.duplicates.includes(file)
          );
          
          if (!isKnown) {
            const existing = colNames.get(normalizedName);
            
            // Vérifier si cette paire n'est pas déjà identifiée
            const alreadyListed = potentialDuplicates.some(dup => 
              (dup.primary === existing.file && dup.duplicates.includes(file)) ||
              (dup.primary === file && dup.duplicates.includes(existing.file))
            );
            
            if (!alreadyListed) {
              // Déterminer le fichier primaire (celui avec la meilleure complétude)
              const existingData = JSON.parse(fs.readFileSync(path.join(COLS_DIR, existing.file), 'utf8'));
              const currentData = data;
              
              const existingCompleteness = existingData.completeness || calculateCompleteness(existingData);
              const currentCompleteness = currentData.completeness || calculateCompleteness(currentData);
              
              let primary, duplicate;
              
              if (currentCompleteness > existingCompleteness) {
                primary = file;
                duplicate = existing.file;
              } else {
                primary = existing.file;
                duplicate = file;
              }
              
              potentialDuplicates.push({
                primary,
                duplicates: [duplicate],
                primaryName: primary === file ? data.name : existingData.name
              });
            }
          }
        } else {
          colNames.set(normalizedName, {
            name: data.name,
            file
          });
        }
      }
      
    } catch (error) {
      console.log(chalk.red(`✗ Erreur lors de l'analyse de ${file}: ${error.message}`));
    }
  });
  
  console.log(chalk.green(`✓ ${potentialDuplicates.length} doublons potentiels supplémentaires trouvés`));
  return potentialDuplicates;
}

/**
 * Fonction principale
 */
async function main() {
  console.log(chalk.blue('=== Fusion des cols en doublon ===\n'));
  
  // Créer le répertoire de sauvegarde
  createBackupDirectory();
  
  // Fusionner les doublons connus
  console.log(chalk.blue('\n=== Fusion des doublons connus ===\n'));
  
  let successCount = 0;
  let failureCount = 0;
  
  KNOWN_DUPLICATES.forEach(dup => {
    console.log(chalk.blue(`\nTraitement du doublon: ${dup.primaryName}`));
    
    dup.duplicates.forEach(duplicateFile => {
      const success = mergeCols(dup.primary, duplicateFile);
      if (success) {
        successCount++;
      } else {
        failureCount++;
      }
    });
  });
  
  console.log(chalk.green(`\n✓ Fusion terminée: ${successCount} fusions réussies, ${failureCount} échecs`));
  
  // Chercher d'autres doublons potentiels
  console.log(chalk.blue('\n=== Recherche d'autres doublons potentiels ===\n'));
  
  const potentialDuplicates = findPotentialDuplicates();
  
  if (potentialDuplicates.length > 0) {
    console.log(chalk.yellow('\n! Doublons potentiels supplémentaires trouvés:'));
    
    potentialDuplicates.forEach(dup => {
      console.log(`  - ${dup.primaryName} (${dup.primary}) <-> ${dup.duplicates.join(', ')}`);
    });
    
    console.log(chalk.yellow('\nPour fusionner ces doublons potentiels, modifiez la liste KNOWN_DUPLICATES dans ce script et relancez-le.'));
  } else {
    console.log(chalk.green('\n✓ Aucun autre doublon potentiel trouvé'));
  }
  
  console.log(chalk.green('\n✓ Traitement terminé avec succès'));
}

// Exécuter la fonction principale
main().catch(error => {
  console.error(chalk.red('Erreur lors de l\'exécution du script:', error));
});
