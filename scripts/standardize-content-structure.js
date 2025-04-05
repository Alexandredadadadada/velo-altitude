/**
 * Script de standardisation de la structure du contenu
 * Velo-Altitude
 * 
 * Ce script réorganise les données du site selon une structure standardisée
 * et élimine les doublons tout en assurant la cohérence des formats.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const chalk = require('chalk') || { green: (text) => text, red: (text) => text, yellow: (text) => text, blue: (text) => text };

// Chemins des répertoires
const SOURCE_DIRS = {
  cols: [
    path.join(__dirname, '../server/data'),
    path.join(__dirname, '../client/src/data')
  ],
  training: [
    path.join(__dirname, '../server/data'),
    path.join(__dirname, '../client/src/data')
  ],
  nutrition: [
    path.join(__dirname, '../server/data'),
    path.join(__dirname, '../client/src/data')
  ],
  community: [
    path.join(__dirname, '../server/data/community'),
    path.join(__dirname, '../client/src/data')
  ]
};

// Chemins des répertoires cibles standardisés
const TARGET_DIRS = {
  cols: path.join(__dirname, '../server/data/cols/enriched'),
  training: path.join(__dirname, '../server/data/training'),
  nutrition: path.join(__dirname, '../server/data/nutrition'),
  skills: path.join(__dirname, '../server/data/skills')
};

// Structure standard pour chaque type de contenu
const STANDARD_STRUCTURES = {
  cols: {
    id: '',                      // Identifiant unique
    name: '',                    // Nom complet du col
    slug: '',                    // Slug pour l'URL
    country: '',                 // Pays
    region: '',                  // Région
    altitude: 0,                 // Altitude en mètres
    length: 0,                   // Longueur en km
    gradient: {                  // Informations sur le pourcentage de pente
      avg: 0,                    // Pourcentage moyen
      max: 0                     // Pourcentage maximum
    },
    difficulty: 0,               // Difficulté sur 10
    description: {               // Description en plusieurs langues
      fr: '',
      en: '',
      de: '',
      it: '',
      es: ''
    },
    coordinates: {               // Coordonnées géographiques
      start: { lat: 0, lng: 0 }, // Point de départ
      summit: { lat: 0, lng: 0 } // Sommet
    },
    elevation_profile: '',       // URL du profil d'élévation
    images: [],                  // Liste des images
    videos: [],                  // Liste des vidéos
    three_d_model: '',           // URL du modèle 3D
    weather: {                   // Informations météo
      best_season: [],           // Meilleure saison
      historical_data: {}        // Données historiques
    },
    services: [],                // Services disponibles
    testimonials: [],            // Témoignages
    related_cols: [],            // Cols liés
    status: 'active',            // Statut (active, inactive)
    completeness: 0,             // Niveau de complétude (0-100%)
    last_updated: ''             // Date de dernière mise à jour
  },
  training: {
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
  }
};

/**
 * Crée les répertoires de destination s'ils n'existent pas
 */
function createDirectories() {
  console.log(chalk.blue('Création des répertoires standardisés...'));
  
  Object.values(TARGET_DIRS).forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(chalk.green(`✓ Répertoire créé: ${dir}`));
    } else {
      console.log(chalk.yellow(`! Répertoire existant: ${dir}`));
    }
  });
  
  console.log(chalk.green('✓ Structure de répertoires créée avec succès\n'));
}

/**
 * Rassemble tous les fichiers contenant des données sur les cols
 * @returns {Array} Liste des fichiers trouvés
 */
function findColFiles() {
  console.log(chalk.blue('Recherche des fichiers de données sur les cols...'));
  
  let files = [];
  
  SOURCE_DIRS.cols.forEach(dir => {
    if (fs.existsSync(dir)) {
      // Rechercher les fichiers JSON
      const jsonFiles = fs.readdirSync(dir)
        .filter(file => file.endsWith('.json') && file.includes('col'))
        .map(file => path.join(dir, file));
      
      // Rechercher les fichiers JS
      const jsFiles = fs.readdirSync(dir)
        .filter(file => file.endsWith('.js') && file.includes('col'))
        .map(file => path.join(dir, file));
      
      files = [...files, ...jsonFiles, ...jsFiles];
    }
  });
  
  console.log(chalk.green(`✓ ${files.length} fichiers trouvés\n`));
  files.forEach(file => console.log(`  - ${file}`));
  
  return files;
}

/**
 * Transforme les données d'un col au format standard
 * @param {Object} colData Les données du col
 * @returns {Object} Données au format standard
 */
function standardizeColData(colData) {
  // Créer un objet avec la structure standard
  const standardCol = JSON.parse(JSON.stringify(STANDARD_STRUCTURES.cols));
  
  // Remplir avec les données disponibles
  standardCol.id = colData.id || colData.slug || '';
  standardCol.name = colData.name || colData.nom || '';
  standardCol.slug = colData.slug || colData.id || standardCol.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  standardCol.country = colData.country || colData.pays || '';
  standardCol.region = colData.region || '';
  standardCol.altitude = colData.altitude || colData.elevation || 0;
  
  // Pente
  if (colData.gradient) {
    standardCol.gradient.avg = colData.gradient.avg || colData.gradient.average || 0;
    standardCol.gradient.max = colData.gradient.max || colData.gradient.maximum || 0;
  } else if (colData.pente) {
    standardCol.gradient.avg = colData.pente.moyenne || 0;
    standardCol.gradient.max = colData.pente.max || 0;
  }
  
  // Description
  if (typeof colData.description === 'string') {
    standardCol.description.fr = colData.description;
  } else if (colData.description) {
    standardCol.description = { ...standardCol.description, ...colData.description };
  }
  
  // Coordonnées
  if (colData.coordinates) {
    standardCol.coordinates = colData.coordinates;
  } else if (colData.coordonnees) {
    standardCol.coordinates = {
      start: colData.coordonnees.depart || { lat: 0, lng: 0 },
      summit: colData.coordonnees.sommet || { lat: 0, lng: 0 }
    };
  }
  
  // Images
  standardCol.images = colData.images || colData.photos || [];
  
  // Compléter les autres champs disponibles
  standardCol.length = colData.length || colData.longueur || 0;
  standardCol.difficulty = colData.difficulty || colData.difficulte || 0;
  standardCol.videos = colData.videos || [];
  standardCol.three_d_model = colData.three_d_model || colData.modele_3d || '';
  standardCol.services = colData.services || [];
  standardCol.testimonials = colData.testimonials || colData.temoignages || [];
  standardCol.related_cols = colData.related_cols || colData.cols_lies || [];
  standardCol.status = colData.status || 'active';
  
  // Calculer la complétude
  const totalFields = Object.keys(STANDARD_STRUCTURES.cols).length;
  let filledFields = 0;
  
  // Compter les champs remplis
  Object.entries(standardCol).forEach(([key, value]) => {
    if (Array.isArray(value) && value.length > 0) filledFields++;
    else if (typeof value === 'object' && value !== null && Object.keys(value).length > 0) filledFields++;
    else if (value && typeof value !== 'object') filledFields++;
  });
  
  standardCol.completeness = Math.round((filledFields / totalFields) * 100);
  standardCol.last_updated = colData.last_updated || colData.derniere_maj || new Date().toISOString();
  
  return standardCol;
}

/**
 * Traite un fichier contenant des données de cols
 * @param {string} filePath Chemin du fichier
 */
function processColFile(filePath) {
  console.log(chalk.blue(`Traitement du fichier ${filePath}...`));
  
  try {
    let colData;
    
    if (filePath.endsWith('.json')) {
      // Lire le fichier JSON
      const rawData = fs.readFileSync(filePath, 'utf8');
      colData = JSON.parse(rawData);
    } else if (filePath.endsWith('.js')) {
      // Pour les fichiers JS, on les évalue dans un contexte sécurisé
      // Cette approche est simplifiée, une vraie implémentation nécessiterait plus de sécurité
      const content = fs.readFileSync(filePath, 'utf8');
      // Extraction basique des données
      const match = content.match(/module\.exports\s*=\s*({[\s\S]*})/);
      if (match) {
        // Attention: eval est dangereux en production
        // Ceci est une simplification pour l'exemple
        colData = eval('(' + match[1] + ')');
      }
    }
    
    if (!colData) {
      console.log(chalk.yellow(`! Aucune donnée trouvée dans ${filePath}`));
      return;
    }
    
    // Gérer les formats différents (objet unique ou tableau d'objets)
    const cols = Array.isArray(colData) ? colData : [colData];
    
    cols.forEach(col => {
      if (!col.id && !col.name && !col.slug) {
        console.log(chalk.yellow(`! Col sans identifiant trouvé dans ${filePath}, ignoré`));
        return;
      }
      
      const standardCol = standardizeColData(col);
      
      // Créer le fichier standardisé
      const targetFile = path.join(TARGET_DIRS.cols, `${standardCol.slug}.json`);
      fs.writeFileSync(targetFile, JSON.stringify(standardCol, null, 2), 'utf8');
      
      console.log(chalk.green(`✓ Col standardisé: ${standardCol.name} -> ${targetFile}`));
    });
    
  } catch (error) {
    console.log(chalk.red(`✗ Erreur lors du traitement de ${filePath}: ${error.message}`));
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log(chalk.blue('=== Standardisation de la structure du contenu Velo-Altitude ===\n'));
  
  // Créer les répertoires standardisés
  createDirectories();
  
  // Traitement des cols
  console.log(chalk.blue('\n=== Traitement des cols ===\n'));
  const colFiles = findColFiles();
  colFiles.forEach(processColFile);
  
  // TODO: Ajouter le traitement pour les autres types de contenu
  
  console.log(chalk.green('\n✓ Standardisation terminée avec succès'));
}

// Exécuter la fonction principale
main().catch(error => {
  console.error(chalk.red('Erreur lors de l\'exécution du script:', error));
});
