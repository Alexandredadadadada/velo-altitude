/**
 * Script de standardisation des programmes d'entraînement
 * Velo-Altitude
 * 
 * Ce script normalise les données des programmes d'entraînement et
 * les organise selon une structure standard dans le répertoire cible.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const chalk = require('chalk') || { green: (text) => text, red: (text) => text, yellow: (text) => text, blue: (text) => text };

// Chemins des répertoires
const SOURCE_DIRS = [
  path.join(__dirname, '../server/data'),
  path.join(__dirname, '../client/src/data')
];

// Chemin du répertoire cible
const TARGET_DIR = path.join(__dirname, '../server/data/training');

// Structure standard pour un programme d'entraînement
const STANDARD_STRUCTURE = {
  id: '',                      // Identifiant unique
  name: '',                    // Nom du programme
  slug: '',                    // Slug pour l'URL
  type: '',                    // Type (endurance, force, etc.)
  level: '',                   // Niveau (débutant, intermédiaire, avancé)
  duration: 0,                 // Durée en semaines
  description: {               // Description en plusieurs langues
    fr: '',
    en: ''
  },
  weeks: [],                   // Programme semaine par semaine
  variations: [],              // Variations du programme
  target_cols: [],             // Cols ciblés par ce programme
  related_nutrition: [],       // Plans nutritionnels associés
  videos: [],                  // Vidéos explicatives
  status: 'active',            // Statut
  completeness: 0,             // Niveau de complétude
  last_updated: ''             // Date de dernière mise à jour
};

/**
 * Crée le répertoire cible s'il n'existe pas
 */
function createTargetDirectory() {
  console.log(chalk.blue('Création du répertoire pour les programmes d\'entraînement...'));
  
  if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
    console.log(chalk.green(`✓ Répertoire créé: ${TARGET_DIR}`));
  } else {
    console.log(chalk.yellow(`! Répertoire existant: ${TARGET_DIR}`));
  }
}

/**
 * Trouve tous les fichiers contenant des données de programmes d'entraînement
 * @returns {Array} Liste des fichiers trouvés
 */
function findTrainingFiles() {
  console.log(chalk.blue('Recherche des fichiers de programmes d\'entraînement...'));
  
  let files = [];
  
  SOURCE_DIRS.forEach(dir => {
    if (fs.existsSync(dir)) {
      // Rechercher les fichiers JSON
      fs.readdirSync(dir).forEach(file => {
        if (file.includes('training') || file.includes('program') || file.includes('plan')) {
          if (file.endsWith('.json') || file.endsWith('.js')) {
            files.push(path.join(dir, file));
          }
        }
      });
      
      // Rechercher dans les sous-répertoires training ou programs
      ['training', 'programs', 'plans'].forEach(subDir => {
        const fullSubDir = path.join(dir, subDir);
        if (fs.existsSync(fullSubDir) && fs.statSync(fullSubDir).isDirectory()) {
          fs.readdirSync(fullSubDir).forEach(file => {
            if (file.endsWith('.json') || file.endsWith('.js')) {
              files.push(path.join(fullSubDir, file));
            }
          });
        }
      });
    }
  });
  
  console.log(chalk.green(`✓ ${files.length} fichiers trouvés\n`));
  files.forEach(file => console.log(`  - ${file}`));
  
  return files;
}

/**
 * Standardise les données d'un programme d'entraînement
 * @param {Object} trainingData Données du programme
 * @returns {Object} Programme standardisé
 */
function standardizeTrainingData(trainingData) {
  // Créer un objet avec la structure standard
  const standardProgram = JSON.parse(JSON.stringify(STANDARD_STRUCTURE));
  
  // Remplir avec les données disponibles
  standardProgram.id = trainingData.id || trainingData.planId || '';
  standardProgram.name = trainingData.name || trainingData.title || trainingData.nom || '';
  standardProgram.slug = trainingData.slug || trainingData.id || 
    standardProgram.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  
  standardProgram.type = trainingData.type || trainingData.category || '';
  standardProgram.level = trainingData.level || trainingData.niveau || '';
  standardProgram.duration = trainingData.duration || trainingData.weeks?.length || trainingData.duree || 0;
  
  // Description
  if (typeof trainingData.description === 'string') {
    standardProgram.description.fr = trainingData.description;
  } else if (trainingData.description) {
    standardProgram.description = { ...standardProgram.description, ...trainingData.description };
  }
  
  // Programme semaine par semaine
  standardProgram.weeks = trainingData.weeks || trainingData.semaines || [];
  
  // Autres propriétés
  standardProgram.variations = trainingData.variations || trainingData.variantes || [];
  standardProgram.target_cols = trainingData.target_cols || trainingData.cols || trainingData.cols_cibles || [];
  standardProgram.related_nutrition = trainingData.related_nutrition || trainingData.nutrition || [];
  standardProgram.videos = trainingData.videos || [];
  standardProgram.status = trainingData.status || 'active';
  
  // Calculer la complétude
  const totalFields = Object.keys(STANDARD_STRUCTURE).length;
  let filledFields = 0;
  
  // Compter les champs remplis
  Object.entries(standardProgram).forEach(([key, value]) => {
    if (Array.isArray(value) && value.length > 0) filledFields++;
    else if (typeof value === 'object' && value !== null && Object.keys(value).length > 0) filledFields++;
    else if (value && typeof value !== 'object') filledFields++;
  });
  
  standardProgram.completeness = Math.round((filledFields / totalFields) * 100);
  standardProgram.last_updated = trainingData.last_updated || trainingData.updated || new Date().toISOString();
  
  return standardProgram;
}

/**
 * Traite un fichier contenant des données de programmes d'entraînement
 * @param {string} filePath Chemin du fichier
 */
function processTrainingFile(filePath) {
  console.log(chalk.blue(`Traitement du fichier ${filePath}...`));
  
  try {
    let trainingData;
    
    if (filePath.endsWith('.json')) {
      // Lire le fichier JSON
      const rawData = fs.readFileSync(filePath, 'utf8');
      trainingData = JSON.parse(rawData);
    } else if (filePath.endsWith('.js')) {
      // Pour les fichiers JS, on les évalue dans un contexte sécurisé
      // Cette approche est simplifiée, une vraie implémentation nécessiterait plus de sécurité
      const content = fs.readFileSync(filePath, 'utf8');
      // Extraction basique des données
      const match = content.match(/module\.exports\s*=\s*({[\s\S]*})/);
      if (match) {
        // Attention: eval est dangereux en production
        // Ceci est une simplification pour l'exemple
        trainingData = eval('(' + match[1] + ')');
      }
    }
    
    if (!trainingData) {
      console.log(chalk.yellow(`! Aucune donnée trouvée dans ${filePath}`));
      return;
    }
    
    // Gérer les formats différents (objet unique ou tableau d'objets)
    const programs = Array.isArray(trainingData) ? trainingData : [trainingData];
    
    programs.forEach(program => {
      if (!program.id && !program.name && !program.title) {
        console.log(chalk.yellow(`! Programme sans identifiant trouvé dans ${filePath}, ignoré`));
        return;
      }
      
      const standardProgram = standardizeTrainingData(program);
      
      // Créer le fichier standardisé
      const targetFile = path.join(TARGET_DIR, `${standardProgram.slug}.json`);
      fs.writeFileSync(targetFile, JSON.stringify(standardProgram, null, 2), 'utf8');
      
      console.log(chalk.green(`✓ Programme standardisé: ${standardProgram.name} -> ${targetFile}`));
    });
    
  } catch (error) {
    console.log(chalk.red(`✗ Erreur lors du traitement de ${filePath}: ${error.message}`));
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log(chalk.blue('=== Standardisation des programmes d\'entraînement ===\n'));
  
  // Créer le répertoire cible
  createTargetDirectory();
  
  // Trouver et traiter les fichiers
  const trainingFiles = findTrainingFiles();
  trainingFiles.forEach(processTrainingFile);
  
  console.log(chalk.blue('\n=== Création de l\'index des programmes ==='));
  
  // Créer un fichier d'index pour tous les programmes
  const indexPath = path.join(TARGET_DIR, 'index.json');
  
  // Lire tous les programmes standardisés
  const programs = [];
  
  if (fs.existsSync(TARGET_DIR)) {
    fs.readdirSync(TARGET_DIR).forEach(file => {
      if (file !== 'index.json' && file.endsWith('.json')) {
        try {
          const data = JSON.parse(fs.readFileSync(path.join(TARGET_DIR, file), 'utf8'));
          programs.push({
            id: data.id,
            slug: data.slug,
            name: data.name,
            type: data.type,
            level: data.level,
            duration: data.duration,
            completeness: data.completeness,
            status: data.status
          });
        } catch (error) {
          console.log(chalk.yellow(`! Impossible de lire ${file}: ${error.message}`));
        }
      }
    });
  }
  
  // Écrire le fichier d'index
  fs.writeFileSync(indexPath, JSON.stringify(programs, null, 2), 'utf8');
  console.log(chalk.green(`✓ Index créé avec ${programs.length} programmes`));
  
  console.log(chalk.green('\n✓ Standardisation des programmes d\'entraînement terminée'));
}

// Exécuter la fonction principale
main().catch(error => {
  console.error(chalk.red('Erreur lors de l\'exécution du script:', error));
});
