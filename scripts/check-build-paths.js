const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification des chemins de fichiers pour le build Netlify...');

// Chemins critiques à vérifier
const requiredPaths = [
  'src/index.js',
  'public/index.html'
];

// Chemins référencés dans webpack.fix.js qui pourraient ne pas exister
const optionalPaths = [
  'client/public',
  'client/public/js/image-fallback.js',
  'public/js/weather-map-fixed.js',
  'src/assets'
];

// Vérifier les chemins requis
let allPathsExist = true;
requiredPaths.forEach(p => {
  const fullPath = path.resolve(__dirname, '..', p);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Chemin requis manquant: ${p}`);
    allPathsExist = false;
  } else {
    console.log(`✅ Chemin requis présent: ${p}`);
  }
});

// Si tous les chemins requis n'existent pas, arrêter le script
if (!allPathsExist) {
  console.error('❌ Des chemins requis sont manquants. Build impossible.');
  process.exit(1);
}

// Vérifier et créer les chemins optionnels si nécessaire
optionalPaths.forEach(p => {
  const fullPath = path.resolve(__dirname, '..', p);
  
  // Si c'est un fichier (contient une extension)
  if (path.extname(p)) {
    const dir = path.dirname(fullPath);
    
    // Créer le répertoire parent si nécessaire
    if (!fs.existsSync(dir)) {
      console.log(`📁 Création du répertoire: ${path.dirname(p)}`);
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Créer un fichier vide s'il n'existe pas
    if (!fs.existsSync(fullPath)) {
      console.log(`📄 Création du fichier: ${p}`);
      
      // Contenu par défaut basé sur le type de fichier
      let defaultContent = '';
      
      // Pour image-fallback.js
      if (p.endsWith('image-fallback.js')) {
        defaultContent = `// Script de fallback d'images pour Velo-Altitude
document.addEventListener('DOMContentLoaded', function() {
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    img.addEventListener('error', function() {
      this.src = '/images/fallback/placeholder.jpg';
    });
  });
});`;
      }
      // Pour weather-map-fixed.js
      else if (p.endsWith('weather-map-fixed.js')) {
        defaultContent = `// Version corrigée de weather-map.js pour Velo-Altitude
function initWeatherMap(container, options) {
  console.log('Initialisation de la carte météo...');
  // Fonction stub - sera remplacée lors du déploiement final
}

// Exporter la fonction pour utilisation
if (typeof module !== 'undefined') {
  module.exports = { initWeatherMap };
}`;
      }
      
      // Écrire le contenu dans le fichier
      fs.writeFileSync(fullPath, defaultContent);
    } else {
      console.log(`✅ Fichier déjà présent: ${p}`);
    }
  } 
  // Si c'est un répertoire
  else {
    if (!fs.existsSync(fullPath)) {
      console.log(`📁 Création du répertoire: ${p}`);
      fs.mkdirSync(fullPath, { recursive: true });
    } else {
      console.log(`✅ Répertoire déjà présent: ${p}`);
    }
  }
});

// Vérifier le point d'entrée principal
const entryPoint = path.resolve(__dirname, '..', 'src/index.js');
if (!fs.existsSync(entryPoint)) {
  console.log(`⚠️ Point d'entrée manquant: src/index.js - Vérification du point d'entrée alternatif...`);
  
  // Vérifier s'il existe un point d'entrée alternatif dans client/src/index.js
  const alternativeEntryPoint = path.resolve(__dirname, '..', 'client/src/index.js');
  if (fs.existsSync(alternativeEntryPoint)) {
    console.log(`🔄 Création d'un lien vers le point d'entrée alternatif...`);
    
    // Créer le répertoire src s'il n'existe pas
    const srcDir = path.resolve(__dirname, '..', 'src');
    if (!fs.existsSync(srcDir)) {
      fs.mkdirSync(srcDir, { recursive: true });
    }
    
    // Copier le contenu du fichier alternatif
    const content = fs.readFileSync(alternativeEntryPoint, 'utf8');
    fs.writeFileSync(entryPoint, content);
    console.log(`✅ Point d'entrée créé: src/index.js (copié depuis client/src/index.js)`);
  }
}

console.log('✨ Vérification des chemins terminée. Prêt pour le build Netlify !');
