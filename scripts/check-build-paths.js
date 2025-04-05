const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification des chemins de fichiers pour le build Netlify...');
console.log('📂 Répertoire actuel: ' + process.cwd());

// Fonction pour afficher le contenu d'un répertoire
function listDirectory(dir) {
  try {
    const files = fs.readdirSync(dir);
    console.log(`\n📂 Contenu du répertoire ${dir}:`);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        console.log(`  📁 ${file}/`);
      } else {
        console.log(`  📄 ${file} (${stats.size} bytes)`);
      }
    });
  } catch (err) {
    console.error(`❌ Erreur lors de la lecture du répertoire ${dir}: ${err.message}`);
  }
}

// Liste les principaux répertoires
console.log('\n==== STRUCTURE DU PROJET ====');
listDirectory('.');
listDirectory('./src');
listDirectory('./public');

// Chemins critiques à vérifier
const requiredPaths = [
  'src/index.js',
  'public/index.html',
  'webpack.fix.js'
];

// Chemins référencés dans webpack.fix.js qui pourraient ne pas exister
const optionalPaths = [
  'client/public',
  'client/public/js/image-fallback.js',
  'public/js/weather-map-fixed.js',
  'src/assets',
  'client/src/index.js'
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
    
    // Si c'est webpack.fix.js, vérifier son contenu
    if (p === 'webpack.fix.js') {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        console.log(`\n📄 Contenu de webpack.fix.js (premiers 200 caractères):`);
        console.log(content.substring(0, 200) + '...');
        
        // Vérifier si des modules potentiellement problématiques sont référencés
        const problematicModules = ['@svgr/webpack', 'url-loader', 'css-loader', 'html-webpack-plugin'];
        problematicModules.forEach(module => {
          if (content.includes(module)) {
            console.log(`⚠️ Module potentiellement problématique trouvé dans webpack.fix.js: ${module}`);
          }
        });
      } catch (err) {
        console.error(`❌ Erreur lors de la lecture de webpack.fix.js: ${err.message}`);
      }
    }
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
      // Pour client/src/index.js
      else if (p.endsWith('client/src/index.js')) {
        defaultContent = `// Point d'entrée client/src/index.js (stub)
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const root = createRoot(document.getElementById('root'));
root.render(<App />);`;
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
  } else {
    // Créer un point d'entrée minimal
    console.log(`📄 Création d'un point d'entrée minimal: src/index.js`);
    
    // Créer le répertoire src s'il n'existe pas
    const srcDir = path.resolve(__dirname, '..', 'src');
    if (!fs.existsSync(srcDir)) {
      fs.mkdirSync(srcDir, { recursive: true });
    }
    
    // Créer un fichier index.js minimal avec React
    const minimalContent = `import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

// Composant App minimal
const App = () => {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Velo-Altitude</h1>
        <p>Plateforme dédiée au cyclisme de montagne en Europe</p>
      </header>
      <main>
        <section className="hero">
          <div className="container">
            <h2>Bienvenue sur Velo-Altitude</h2>
            <p>Le site est en cours de maintenance. Merci de votre patience.</p>
          </div>
        </section>
      </main>
    </div>
  );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);`;
    
    fs.writeFileSync(entryPoint, minimalContent);
    
    // Créer également un fichier CSS minimal
    const cssPath = path.resolve(__dirname, '..', 'src/index.css');
    const minimalCss = `body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  margin: 0;
  padding: 0;
  background-color: #f7f9fc;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background-color: #1976d2;
  color: white;
  padding: 1rem 2rem;
  text-align: center;
}

.hero {
  padding: 3rem 2rem;
  text-align: center;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}`;
    
    fs.writeFileSync(cssPath, minimalCss);
    console.log(`✅ Fichier CSS créé: src/index.css`);
  }
}

// Vérifier si le public/index.html existe, sinon le créer
const indexHtmlPath = path.resolve(__dirname, '..', 'public/index.html');
if (!fs.existsSync(indexHtmlPath)) {
  console.log(`📄 Création d'un fichier index.html minimal: public/index.html`);
  
  // Créer le répertoire public s'il n'existe pas
  const publicDir = path.resolve(__dirname, '..', 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  // Créer un fichier index.html minimal
  const minimalHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Velo-Altitude | Cyclisme de montagne en Europe</title>
  <meta name="description" content="Plateforme complète dédiée au cyclisme de montagne en Europe">
  <link rel="icon" href="/favicon.ico">
</head>
<body>
  <div id="root"></div>
</body>
</html>`;
  
  fs.writeFileSync(indexHtmlPath, minimalHtml);
}

// Vérifier les dépendances nécessaires dans package.json
const packageJsonPath = path.resolve(__dirname, '..', 'package.json');
try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  console.log('\n==== VÉRIFICATION DES DÉPENDANCES ====');
  
  // Liste des dépendances critiques pour webpack
  const criticalDeps = [
    'webpack', 'webpack-cli', 'html-webpack-plugin', 'babel-loader',
    '@babel/preset-env', '@babel/preset-react', 'css-loader',
    'style-loader', 'file-loader', 'url-loader', '@svgr/webpack'
  ];
  
  // Vérifier si ces dépendances sont dans dependencies (pas devDependencies)
  criticalDeps.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      console.log(`✅ Dépendance critique présente dans dependencies: ${dep}`);
    } else if (packageJson.devDependencies && packageJson.devDependencies[dep]) {
      console.log(`⚠️ Dépendance critique trouvée dans devDependencies (peut causer des problèmes): ${dep}`);
    } else {
      console.log(`❌ Dépendance critique manquante: ${dep}`);
    }
  });
} catch (err) {
  console.error(`❌ Erreur lors de la lecture/analyse de package.json: ${err.message}`);
}

console.log('\n✨ Vérification des chemins terminée. Prêt pour le build Netlify !');
