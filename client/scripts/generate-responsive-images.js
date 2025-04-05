/**
 * Script de génération d'images responsives pour Dashboard-Velo.com
 * Ce script crée des versions optimisées et redimensionnées des images
 * pour différentes tailles d'écran, utilisant le format WebP pour une meilleure compression.
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuration des tailles d'images à générer
const sizes = [
  { suffix: '_small', width: 400 },
  { suffix: '_medium', width: 800 },
  { suffix: '_large', width: 1200 }
];

// Dossiers d'images à traiter
const imageFolders = [
  'client/public/assets/cols',
  'client/public/assets/nutrition',
  'client/public/assets/training',
  'public/images/summits',
  'public/images/profiles'
];

// Créer le dossier de destination s'il n'existe pas
const ensureDirectoryExists = (directory) => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
};

// Optimiser et convertir une image en plusieurs tailles
const processImage = async (filePath) => {
  const fileDir = path.dirname(filePath);
  const fileName = path.basename(filePath);
  const fileNameWithoutExt = fileName.replace(/\.[^.]+$/, '');
  const fileExt = path.extname(filePath).toLowerCase();
  
  // Ignorer les fichiers déjà générés
  if (fileNameWithoutExt.endsWith('_small') || 
      fileNameWithoutExt.endsWith('_medium') || 
      fileNameWithoutExt.endsWith('_large')) {
    return;
  }
  
  // Ignorer les fichiers non-image
  if (!['.jpg', '.jpeg', '.png'].includes(fileExt)) {
    return;
  }
  
  console.log(`Traitement de: ${filePath}`);
  
  try {
    // Obtenir les métadonnées de l'image originale
    const metadata = await sharp(filePath).metadata();
    
    // Générer une version WebP de l'original
    await sharp(filePath)
      .webp({ quality: 85 })
      .toFile(path.join(fileDir, `${fileNameWithoutExt}.webp`));
    
    // Générer les différentes tailles
    for (const size of sizes) {
      // Ne pas agrandir les images qui sont déjà plus petites
      if (metadata.width <= size.width) {
        continue;
      }
      
      // Créer les versions redimensionnées en WebP (meilleure compression)
      await sharp(filePath)
        .resize(size.width)
        .webp({ quality: 80 })
        .toFile(path.join(fileDir, `${fileNameWithoutExt}${size.suffix}.webp`));
      
      // Créer aussi les versions redimensionnées au format d'origine
      await sharp(filePath)
        .resize(size.width)
        .toFile(path.join(fileDir, `${fileNameWithoutExt}${size.suffix}${fileExt}`));
    }
    
    console.log(`\u2713 Terminé: ${filePath}`);
  } catch (error) {
    console.error(`\u2717 Erreur lors du traitement de ${filePath}:`, error);
  }
};

// Fonction principale pour traiter tous les dossiers
const processAllFolders = async () => {
  console.log("Début de la génération d'images responsives...");
  
  let totalProcessed = 0;
  let totalErrors = 0;
  
  for (const folder of imageFolders) {
    console.log(`\nTraitement du dossier: ${folder}`);
    
    // Vérifier si le dossier existe
    if (!fs.existsSync(folder)) {
      console.warn(`Le dossier ${folder} n'existe pas, création...`);
      ensureDirectoryExists(folder);
      continue;
    }
    
    // Trouver toutes les images
    const imageFiles = glob.sync(path.join(folder, '**/*.{jpg,jpeg,png}'));
    
    if (imageFiles.length === 0) {
      console.log(`Aucune image trouvée dans ${folder}`);
      continue;
    }
    
    console.log(`${imageFiles.length} images trouvées dans ${folder}`);
    
    // Traiter chaque image
    for (const file of imageFiles) {
      try {
        await processImage(file);
        totalProcessed++;
      } catch (error) {
        console.error(`Erreur pendant le traitement de ${file}:`, error);
        totalErrors++;
      }
    }
  }
  
  console.log('\n=== Résumé ===');
  console.log(`Total des images traitées: ${totalProcessed}`);
  console.log(`Erreurs: ${totalErrors}`);
  console.log("Génération d'images responsives terminée!");
};

// Exécuter le script
processAllFolders().catch(error => {
  console.error('Erreur globale:', error);
  process.exit(1);
});
