/**
 * Script d'intégration du nouveau logo Dashboard-Velo
 * 
 * Ce script copie le nouveau logo dans tous les emplacements nécessaires et
 * génère les différentes tailles d'icônes requises pour le site et les applications.
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp'); // Requiert l'installation de sharp: npm install sharp
const { execSync } = require('child_process');

// Chemins des répertoires
const IMAGES_DIR = path.resolve(__dirname, '../public/images');
const ICONS_DIR = path.resolve(__dirname, '../public/images/icons');
const SOCIAL_DIR = path.resolve(__dirname, '../public/images/social');

// S'assurer que les répertoires existent
[ICONS_DIR, SOCIAL_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Répertoire créé: ${dir}`);
  }
});

// Source du logo original (à remplacer par le chemin du nouveau logo)
const SOURCE_LOGO = path.resolve(__dirname, '../temp/dashboard-velo-logo.png');

// Vérification que le logo source existe
if (!fs.existsSync(SOURCE_LOGO)) {
  console.error('ERREUR: Logo source non trouvé!');
  console.log('Placez le nouveau logo à l\'emplacement suivant:');
  console.log(SOURCE_LOGO);
  process.exit(1);
}

// Configuration des tailles d'icônes
const iconSizes = [
  { name: 'favicon.ico', size: 32, type: 'ico' },
  { name: 'icon16.png', size: 16, type: 'png' },
  { name: 'icon48.png', size: 48, type: 'png' },
  { name: 'icon128.png', size: 128, type: 'png' },
  { name: 'logo.png', size: 200, type: 'png' },
  { name: 'logo_large.png', size: 500, type: 'png' },
  { name: 'dashboard-velo-75x75.png', size: 75, type: 'png' },
  { name: 'icons/icon-16.png', size: 16, type: 'png' },
  { name: 'icons/icon-48.png', size: 48, type: 'png' },
  { name: 'icons/icon-128.png', size: 128, type: 'png' },
  { name: 'icons/icon-192.png', size: 192, type: 'png' },
  { name: 'icons/icon-512.png', size: 512, type: 'png' },
  { name: 'social/dashboard-velo-facebook.png', size: [1200, 630], type: 'social' },
  { name: 'social/dashboard-velo-twitter.png', size: [1200, 675], type: 'social' },
  { name: 'social/dashboard-velo-linkedin.png', size: [1200, 627], type: 'social' }
];

/**
 * Génère une image redimensionnée
 * @param {string} sourcePath Chemin de l'image source
 * @param {string} targetPath Chemin de l'image cible
 * @param {number|Array} size Taille(s) de l'image cible
 * @param {string} type Type d'image à générer
 */
async function generateImage(sourcePath, targetPath, size, type) {
  try {
    let sharpInstance = sharp(sourcePath);
    
    // Redimensionnement selon le type
    if (Array.isArray(size)) {
      // Format spécifique pour les images sociales
      sharpInstance = sharpInstance.resize({
        width: size[0],
        height: size[1],
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      });
      
      // Pour les images sociales, ajouter du texte ou des éléments supplémentaires
      if (type === 'social') {
        // Note: Pour ajouter du texte, on utiliserait une autre bibliothèque comme jimp
        // ou on composerait l'image avec un autre élément via sharp.composite()
        console.log(`Image sociale générée: ${targetPath}`);
      }
    } else {
      // Format standard pour les icônes
      sharpInstance = sharpInstance.resize({
        width: size,
        height: size,
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      });
    }
    
    // Génération de l'image
    if (type === 'ico') {
      // Pour les .ico, on sauvegarde d'abord en PNG puis on convertit
      const pngPath = targetPath.replace('.ico', '.png');
      await sharpInstance.png().toFile(pngPath);
      
      // Utiliser ImageMagick pour la conversion en .ico (nécessite imagemagick installé)
      // execSync(`convert ${pngPath} ${targetPath}`);
      console.log(`Favicon généré: ${targetPath} (nécessite conversion manuelle)`);
      
      // Nettoyer le fichier PNG temporaire
      // fs.unlinkSync(pngPath);
    } else {
      await sharpInstance.png().toFile(targetPath);
      console.log(`Image générée: ${targetPath}`);
    }
  } catch (error) {
    console.error(`ERREUR lors de la génération de ${targetPath}:`, error);
  }
}

// Fonction principale
async function main() {
  console.log('Début de l\'intégration du logo Dashboard-Velo...');
  
  // Créer le répertoire temporaire si nécessaire
  const tempDir = path.resolve(__dirname, '../temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  // Génération de toutes les icônes et images
  for (const icon of iconSizes) {
    const targetPath = path.resolve(IMAGES_DIR, icon.name);
    console.log(`Génération de ${icon.name}...`);
    await generateImage(SOURCE_LOGO, targetPath, icon.size, icon.type);
  }
  
  console.log('\nIntégration du logo terminée!');
  console.log('N\'oubliez pas d\'installer les dépendances requises:');
  console.log('npm install sharp');
}

// Exécution du script
main().catch(console.error);
