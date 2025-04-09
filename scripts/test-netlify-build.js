/**
 * Script pour tester le build Netlify en local
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function testNetlifyBuild() {
  try {
    console.log('🚀 Démarrage du test de build Netlify en local...');
    
    // S'assurer que webpack-cli est installé
    console.log('📦 Vérification de webpack-cli...');
    try {
      require.resolve('webpack-cli');
      console.log('✅ webpack-cli est déjà installé');
    } catch (e) {
      console.log('📦 Installation de webpack-cli...');
      execSync('npm install -D webpack-cli', { stdio: 'inherit' });
    }
    
    // Définir toutes les variables d'environnement nécessaires pour le build
    const env = { 
      ...process.env, 
      CI: 'false', 
      NODE_ENV: 'production',
      GENERATE_SOURCEMAP: 'false',
      DISABLE_ESLINT_PLUGIN: 'true',
      // Variables d'application React
      REACT_APP_API_URL: 'http://localhost:3000/api',
      REACT_APP_BASE_URL: 'http://localhost:3000',
      REACT_APP_BRAND_NAME: 'Velo-Altitude',
      REACT_APP_VERSION: '1.0.0',
      REACT_APP_ENABLE_ANALYTICS: 'false',
      // Variables MongoDB (mettre des valeurs factices pour les tests)
      MONGODB_URI: 'mongodb://localhost:27017/velo-altitude',
      MONGODB_DB_NAME: 'velo-altitude',
      // API Keys (mettre des valeurs factices pour les tests)
      MAPBOX_TOKEN: 'pk.dummy.mapbox.token',
      OPENWEATHER_API_KEY: 'dummy_openweather_key',
      STRAVA_CLIENT_ID: 'dummy_strava_id',
      STRAVA_CLIENT_SECRET: 'dummy_strava_secret',
      // Auth0 (mettre des valeurs factices pour les tests)
      AUTH0_CLIENT_ID: 'dummy_auth0_id',
      AUTH0_CLIENT_SECRET: 'dummy_auth0_secret',
      AUTH0_ISSUER_BASE_URL: 'https://dummy.auth0.com',
      // Variables de cache
      ASSET_CACHE_MAX_AGE: '86400',
      ENABLE_BROTLI_COMPRESSION: 'true'
    };
    
    // Exécuter le script de prebuild
    console.log('🏗️ Exécution du script de prebuild...');
    execSync('node scripts/netlify-prebuild.js', { 
      stdio: 'inherit',
      env 
    });
    
    // Créer un fichier .env.production temporaire
    console.log('📝 Création d\'un fichier .env.production temporaire pour le test...');
    const envFile = path.join(process.cwd(), '.env.production');
    let envContent = '';
    
    Object.entries(env).forEach(([key, value]) => {
      // Ne pas inclure les variables d'environnement système
      if (key.startsWith('REACT_APP_') || 
          key.startsWith('MONGODB_') || 
          key.startsWith('AUTH0_') ||
          key === 'MAPBOX_TOKEN' ||
          key === 'OPENWEATHER_API_KEY' ||
          key === 'STRAVA_CLIENT_ID' ||
          key === 'STRAVA_CLIENT_SECRET') {
        envContent += `${key}=${value}\n`;
      }
    });
    
    // Écrire le fichier si nous ne sommes pas en test automatisé
    if (!process.env.CI) {
      fs.writeFileSync(envFile, envContent);
      console.log('✅ Fichier .env.production créé temporairement');
    }
    
    // Build de production
    try {
      console.log('🏗️ Build de production...');
      execSync('npx webpack --config webpack.config.js --mode production', { 
        stdio: 'inherit',
        env
      });
      console.log('✅ Build webpack terminé avec succès');
    } catch (buildError) {
      console.error('❌ Erreur lors du build webpack:', buildError.message);
      // Afficher plus de détails sur l'erreur
      console.log('Détail de l\'erreur de build:');
      console.log(buildError);
      throw buildError;
    }
    
    // Supprimer le fichier .env.production temporaire après le build
    if (fs.existsSync(envFile) && !process.env.CI) {
      fs.unlinkSync(envFile);
      console.log('🧹 Fichier .env.production temporaire supprimé');
    }
    
    console.log('✅ Test de build Netlify terminé avec succès!');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors du test de build Netlify:', error.message);
    return false;
  }
}

// Exécuter le script
testNetlifyBuild().then(success => {
  if (!success) {
    process.exit(1);
  }
});
