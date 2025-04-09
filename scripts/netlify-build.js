/**
 * Script de build spécifique pour Netlify
 * Simplifie le processus de build pour éviter les erreurs courants sur Netlify
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const buildDir = path.resolve(__dirname, '../build');
const sourceDir = path.resolve(__dirname, '../src');
const publicDir = path.resolve(__dirname, '../public');

// Fonction de nettoyage simple
function cleanBuildDir() {
  console.log('🧹 Nettoyage du répertoire de build...');
  
  if (fs.existsSync(buildDir)) {
    try {
      // Utilisation de méthodes synchrones pour simplifier
      fs.rmSync(buildDir, { recursive: true, force: true });
      console.log('✅ Répertoire de build supprimé avec succès');
    } catch (error) {
      console.error(`❌ Erreur lors de la suppression du répertoire de build: ${error.message}`);
    }
  } else {
    console.log('ℹ️ Répertoire de build inexistant, aucun nettoyage nécessaire');
  }
  
  // Créer le répertoire de build vide
  try {
    fs.mkdirSync(buildDir, { recursive: true });
    console.log('✅ Répertoire de build créé');
  } catch (error) {
    console.error(`❌ Erreur lors de la création du répertoire de build: ${error.message}`);
  }
}

// Exécution de webpack
function runWebpack() {
  console.log('🚀 Exécution de webpack...');
  
  try {
    execSync('npx webpack --config webpack.netlify.config.js', {
      stdio: 'inherit',
      env: { ...process.env, CI: 'false', NODE_ENV: 'production' }
    });
    console.log('✅ Build webpack terminé avec succès');
    return true;
  } catch (error) {
    console.error(`❌ Erreur lors du build webpack: ${error.message}`);
    return false;
  }
}

// Copie des fichiers statiques
function copyStaticFiles() {
  console.log('📁 Copie des fichiers statiques...');
  
  if (fs.existsSync(publicDir)) {
    try {
      // Fonction récursive pour copier un répertoire
      const copyDir = (src, dest) => {
        // Créer le répertoire de destination s'il n'existe pas
        if (!fs.existsSync(dest)) {
          fs.mkdirSync(dest, { recursive: true });
        }
        
        // Lire le contenu du répertoire source
        const entries = fs.readdirSync(src, { withFileTypes: true });
        
        for (const entry of entries) {
          const srcPath = path.join(src, entry.name);
          const destPath = path.join(dest, entry.name);
          
          // Si c'est un fichier index.html, on le saute car webpack s'en occupe
          if (entry.name === 'index.html') continue;
          
          // Copier récursivement les répertoires
          if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
          } else {
            // Copier les fichiers
            fs.copyFileSync(srcPath, destPath);
          }
        }
      };
      
      copyDir(publicDir, buildDir);
      console.log('✅ Fichiers statiques copiés avec succès');
    } catch (error) {
      console.error(`❌ Erreur lors de la copie des fichiers statiques: ${error.message}`);
    }
  } else {
    console.warn('⚠️ Répertoire public inexistant, aucun fichier statique à copier');
  }
}

// Création du fichier _redirects pour Netlify
function createNetlifyConfig() {
  console.log('🔄 Création des fichiers de configuration Netlify...');
  
  // Fichier _redirects pour SPA routing
  const redirectsContent = `
# Redirections Netlify pour Velo-Altitude
# Toutes les requêtes sont redirigées vers index.html (SPA routing)
/*    /index.html   200
`;
  
  try {
    fs.writeFileSync(path.join(buildDir, '_redirects'), redirectsContent.trim());
    console.log('✅ Fichier _redirects créé');
  } catch (error) {
    console.error(`❌ Erreur lors de la création du fichier _redirects: ${error.message}`);
  }
}

// Fonction principale
function main() {
  console.log('🚀 Démarrage du build pour Netlify...');
  
  // Étape 1: Nettoyage
  cleanBuildDir();
  
  // Étape 2: Build webpack
  const webpackSuccess = runWebpack();
  
  if (webpackSuccess) {
    // Étape 3: Copie des fichiers statiques
    copyStaticFiles();
    
    // Étape 4: Configuration Netlify
    createNetlifyConfig();
    
    console.log('✅ Build Netlify terminé avec succès');
  } else {
    console.error('❌ Build Netlify échoué');
    process.exit(1);
  }
}

// Exécution du script
main();
