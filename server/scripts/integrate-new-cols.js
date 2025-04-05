/**
 * Script d'intégration des nouveaux cols
 * Ce script combine tous les fichiers de cols séparés en un seul fichier unifié
 * et met à jour les références dans le système
 */

const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');

// Chemins des fichiers
const DATA_DIR = path.join(__dirname, '../data');
const OUTPUT_FILE = path.join(DATA_DIR, 'unified-european-cols.json');

// Sources de données
const DATA_SOURCES = [
  'european-cols.json',
  'european-cols-enriched-part1.json',
  'new_passes_eastern.json',
  'european-cols-enriched-final.json',
  'european-cols-enriched-final2.json'
];

/**
 * Charge le contenu d'un fichier JSON
 * @param {string} filePath Chemin du fichier
 * @returns {Array|Object} Contenu du fichier
 */
function loadJsonFile(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    logger.error(`Erreur lors du chargement du fichier ${filePath}: ${error.message}`);
    return [];
  }
}

/**
 * Sauvegarde des données en JSON
 * @param {string} filePath Chemin du fichier
 * @param {Array|Object} data Données à sauvegarder
 */
function saveJsonFile(filePath, data) {
  try {
    const jsonContent = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, jsonContent, 'utf8');
    logger.info(`Fichier sauvegardé avec succès: ${filePath}`);
  } catch (error) {
    logger.error(`Erreur lors de la sauvegarde du fichier ${filePath}: ${error.message}`);
  }
}

/**
 * Fusionne tous les cols en un seul tableau unifié
 * @returns {Array} Tableau des cols unifiés
 */
function mergeAllCols() {
  logger.info('Début de la fusion des cols...');
  
  let allCols = [];
  const processedIds = new Set();
  
  // Parcourir toutes les sources de données
  for (const source of DATA_SOURCES) {
    const filePath = path.join(DATA_DIR, source);
    if (!fs.existsSync(filePath)) {
      logger.warn(`Le fichier ${filePath} n'existe pas, ignoré.`);
      continue;
    }
    
    const cols = loadJsonFile(filePath);
    if (!Array.isArray(cols)) {
      logger.warn(`Le fichier ${source} ne contient pas un tableau, ignoré.`);
      continue;
    }
    
    logger.info(`Traitement de ${cols.length} cols depuis ${source}`);
    
    // Ajouter chaque col s'il n'existe pas déjà
    for (const col of cols) {
      if (!col.id) {
        logger.warn(`Col sans ID trouvé dans ${source}, ignoré.`);
        continue;
      }
      
      if (processedIds.has(col.id)) {
        logger.info(`Col avec ID ${col.id} déjà traité, mise à jour.`);
        // Remplacer le col existant pour avoir les données les plus récentes
        allCols = allCols.map(existingCol => 
          existingCol.id === col.id ? { ...existingCol, ...col } : existingCol
        );
      } else {
        processedIds.add(col.id);
        allCols.push(col);
      }
    }
  }
  
  logger.info(`Fusion terminée, ${allCols.length} cols au total.`);
  return allCols;
}

/**
 * Fonction principale d'exécution
 */
async function main() {
  try {
    logger.info('Début de l\'intégration des nouveaux cols...');
    
    // Fusionner tous les cols
    const mergedCols = mergeAllCols();
    
    // Sauvegarder le fichier unifié
    saveJsonFile(OUTPUT_FILE, mergedCols);
    
    // Créer un fichier d'index pour l'API
    const colsIndex = mergedCols.map(col => ({
      id: col.id,
      name: col.name,
      location: col.location,
      altitude: col.altitude
    }));
    
    saveJsonFile(path.join(DATA_DIR, 'cols-index.json'), colsIndex);
    
    logger.info('Intégration des cols terminée avec succès.');
  } catch (error) {
    logger.error(`Erreur lors de l'intégration des cols: ${error.message}`, { stack: error.stack });
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  main().catch(error => {
    logger.error(`Erreur non gérée: ${error.message}`, { stack: error.stack });
    process.exit(1);
  });
}

module.exports = { mergeAllCols };
