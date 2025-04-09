/**
 * Script de build Netlify spécialisé pour Velo-Altitude
 * Conçu pour fonctionner avec la structure hybride du projet
 * et les services refactorisés (RealApiOrchestrator)
 */

const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const { execSync } = require('child_process');

console.log('🚀 Démarrage du build Netlify spécialisé pour Velo-Altitude...');

// Vérification de l'environnement
console.log('📋 Variables d\'environnement configurées:');
['NODE_ENV', 'CI', 'REACT_APP_API_URL', 'REACT_APP_BASE_URL'].forEach(envVar => {
  console.log(`${envVar}: ${process.env[envVar] || '(non défini)'}`);
});

// Créer un fichier .env.production temporaire si nécessaire
const envFilePath = path.resolve(__dirname, '../.env.production');
if (!fs.existsSync(envFilePath)) {
  console.log('ℹ️ Création d\'un fichier .env.production temporaire');
  
  const envContent = `
REACT_APP_API_URL=${process.env.REACT_APP_API_URL || 'https://velo-altitude.netlify.app/api'}
REACT_APP_BASE_URL=${process.env.REACT_APP_BASE_URL || 'https://velo-altitude.netlify.app'}
REACT_APP_BRAND_NAME=Velo-Altitude
REACT_APP_VERSION=1.0.0
REACT_APP_ENABLE_ANALYTICS=false
`;
  
  fs.writeFileSync(envFilePath, envContent.trim());
  console.log('✅ Fichier .env.production créé');
}

// Vérifier l'installation de webpack-cli
try {
  console.log('🔍 Vérification de webpack-cli...');
  require.resolve('webpack-cli');
  console.log('✅ webpack-cli est installé');
} catch (error) {
  console.log('⚠️ webpack-cli non trouvé, installation...');
  execSync('npm install --save-dev webpack-cli', { stdio: 'inherit' });
  console.log('✅ webpack-cli installé');
}

// Vérifier les loaders nécessaires
const requiredLoaders = [
  'css-loader', 
  'style-loader', 
  'file-loader', 
  'ts-loader',
  'raw-loader',
  'glslify-loader'
];

console.log('🔍 Vérification des loaders nécessaires...');

for (const loader of requiredLoaders) {
  try {
    require.resolve(loader);
    console.log(`✅ ${loader} est installé`);
  } catch (error) {
    console.log(`⚠️ ${loader} non trouvé, installation...`);
    execSync(`npm install --save-dev ${loader} --legacy-peer-deps`, { stdio: 'inherit' });
    console.log(`✅ ${loader} installé`);
  }
}

// Lancer le build webpack
console.log('🚀 Lancement du build webpack...');

// Utilisation de la commande npm run build standard
try {
  execSync('npx cross-env CI=false NODE_ENV=production npm run build', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      CI: 'false',
      NODE_ENV: 'production'
    }
  });
  console.log('✅ Build webpack terminé avec succès');
} catch (error) {
  console.error('❌ Erreur lors du build webpack:', error.message);
  process.exit(1);
}

// Créer les fichiers pour Netlify
const buildDir = path.resolve(__dirname, '../build');

// Fichier _redirects
const redirectsContent = `
# Redirections Netlify pour Velo-Altitude
/api/*    /.netlify/functions/api/:splat    200
/*    /index.html   200
`;

fs.writeFileSync(path.join(buildDir, '_redirects'), redirectsContent.trim());
console.log('✅ Fichier _redirects créé');

// Fichier robots.txt s'il n'existe pas déjà
const robotsPath = path.join(buildDir, 'robots.txt');
if (!fs.existsSync(robotsPath)) {
  const robotsContent = `
User-agent: *
Allow: /
`;
  fs.writeFileSync(robotsPath, robotsContent.trim());
  console.log('✅ Fichier robots.txt créé');
}

console.log('🎉 Build Netlify finalisé et prêt pour déploiement!');
