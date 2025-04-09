/**
 * Script post-build pour Velo-Altitude
 * Exécuté automatiquement après le processus de build
 * Effectue des tâches de finalisation et d'optimisation
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Exécution du script post-build...');

// Chemins importants
const buildDir = path.resolve(__dirname, '../build');
const publicDir = path.resolve(__dirname, '../public');

// Fonction principale
async function postBuildProcess() {
  try {
    // 1. Vérifier que le dossier build existe
    if (!fs.existsSync(buildDir)) {
      throw new Error('Le dossier build n\'existe pas. Le build a probablement échoué.');
    }

    // 2. Copier les fichiers d'authentification d'urgence s'ils existent
    copyEmergencyFiles();

    // 3. Générer les fichiers de configuration runtime
    generateRuntimeConfig();

    // 4. Créer les fichiers de redirection pour Netlify
    createNetlifyRedirects();

    // 5. Ajouter les entêtes pour l'optimisation du cache
    addCacheHeaders();

    console.log('✅ Processus post-build terminé avec succès');
  } catch (error) {
    console.error('❌ Erreur lors du processus post-build:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Copier les fichiers d'authentification d'urgence
function copyEmergencyFiles() {
  console.log('📂 Copie des fichiers d\'authentification d\'urgence...');
  
  const emergencyFiles = [
    'auth-override.js',
    'auth-diagnostic.js',
    'emergency-login.html',
    'emergency-dashboard.html'
  ];
  
  emergencyFiles.forEach(file => {
    const srcPath = path.join(publicDir, file);
    const destPath = path.join(buildDir, file);
    
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`✅ Copié: ${file}`);
    } else {
      console.warn(`⚠️ Fichier source non trouvé: ${srcPath}`);
    }
  });
}

// Générer les fichiers de configuration runtime
function generateRuntimeConfig() {
  console.log('⚙️ Génération de la configuration runtime...');
  
  const configPath = path.join(buildDir, 'runtime-config.js');
  
  // Configuration basée sur les variables d'environnement
  const runtimeConfig = {
    environment: process.env.NODE_ENV || 'production',
    version: new Date().toISOString(),
    apiBaseUrl: process.env.REACT_APP_API_URL || '/api',
    features: {
      analytics: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
      emergency: true,
      cache: true
    },
    auth: {
      enabled: true,
      provider: 'auth0'
    },
    apis: {
      mapbox: !!process.env.MAPBOX_TOKEN,
      strava: !!process.env.STRAVA_CLIENT_ID,
      openweather: !!process.env.OPENWEATHER_API_KEY,
      openai: !!process.env.OPENAI_API_KEY,
      claude: !!process.env.CLAUDE_API_KEY
    }
  };
  
  const configContent = `window.VELO_ALTITUDE_CONFIG = ${JSON.stringify(runtimeConfig, null, 2)};`;
  fs.writeFileSync(configPath, configContent);
  console.log('✅ Configuration runtime générée');
  
  // Injecter la référence au script dans l'index.html
  injectRuntimeConfigScript();
}

// Injecter le script de configuration runtime dans l'index.html
function injectRuntimeConfigScript() {
  const indexPath = path.join(buildDir, 'index.html');
  
  if (!fs.existsSync(indexPath)) {
    console.warn('⚠️ Fichier index.html non trouvé, impossible d\'injecter la configuration runtime');
    return;
  }
  
  let indexContent = fs.readFileSync(indexPath, 'utf8');
  
  // Vérifier si la référence existe déjà
  if (!indexContent.includes('runtime-config.js')) {
    // Injecter avant la première balise script
    indexContent = indexContent.replace(
      '<head>',
      '<head>\n    <script src="/runtime-config.js"></script>'
    );
    
    fs.writeFileSync(indexPath, indexContent);
    console.log('✅ Script de configuration runtime injecté dans index.html');
  } else {
    console.log('ℹ️ Le script de configuration runtime est déjà présent dans index.html');
  }
}

// Créer le fichier _redirects pour Netlify
function createNetlifyRedirects() {
  console.log('🔄 Création des règles de redirection pour Netlify...');
  
  // Règles de redirection pour une SPA
  const redirects = [
    '# Redirections pour l\'application Velo-Altitude',
    '# Redirection des anciennes URLs',
    '/col/*    /cols/:splat    301',
    '/itineraire/*    /itineraires/:splat    301',
    '/entrainements/*    /entrainement/:splat    301',
    '/profile/*    /profil/:splat    301',
    '',
    '# Redirection SPA - toutes les routes non correspondantes sont gérées par React Router',
    '/*    /index.html    200',
    ''
  ].join('\n');
  
  fs.writeFileSync(path.join(buildDir, '_redirects'), redirects);
  console.log('✅ Fichier _redirects créé');
}

// Ajouter les entêtes pour l'optimisation du cache
function addCacheHeaders() {
  console.log('📦 Configuration des entêtes de cache...');
  
  // Règles d'entêtes pour Netlify
  const headers = [
    '# Cache-Control Headers pour Velo-Altitude',
    '',
    '# Tous les fichiers dans /static/',
    '/static/*',
    '  Cache-Control: public, max-age=31536000, immutable',
    '',
    '# Fichiers JS et CSS',
    '/static/js/*',
    '  Cache-Control: public, max-age=31536000, immutable',
    '',
    '/static/css/*',
    '  Cache-Control: public, max-age=31536000, immutable',
    '',
    '# Images',
    '/static/media/*',
    '  Cache-Control: public, max-age=604800',
    '',
    '# Favicon',
    '/favicon.ico',
    '  Cache-Control: public, max-age=86400',
    '',
    '# HTML et autres ressources',
    '/*',
    '  X-Frame-Options: DENY',
    '  X-XSS-Protection: 1; mode=block',
    '  X-Content-Type-Options: nosniff',
    '  Referrer-Policy: strict-origin-when-cross-origin',
    ''
  ].join('\n');
  
  fs.writeFileSync(path.join(buildDir, '_headers'), headers);
  console.log('✅ Fichier _headers créé');
}

// Exécuter le processus post-build
postBuildProcess();
