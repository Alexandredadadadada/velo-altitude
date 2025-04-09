// deploy-complete.js
// Script de post-déploiement pour Velo-Altitude
// Configures les variables d'environnement et prépare les fichiers d'authentification d'urgence
const fs = require('fs');
const path = require('path');

// Détermine l'environnement de déploiement
function getDeploymentEnvironment() {
  return process.env.CONTEXT || 'development';
}

// Copie les fichiers d'authentification d'urgence
function copyEmergencyAuth() {
  const env = getDeploymentEnvironment();
  console.log(`Copie des fichiers d'authentification d'urgence pour l'environnement ${env}`);
  
  const srcDir = path.join(__dirname, '..', 'public');
  const destDir = path.join(__dirname, '..', 'build');
  
  // Crée le répertoire de destination s'il n'existe pas
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  // Copie les fichiers avec configuration spécifique à l'environnement
  const files = ['auth-override.js', 'auth-diagnostic.js', 'emergency-login.html', 'emergency-dashboard.html'];
  files.forEach(file => {
    const src = path.join(srcDir, file);
    const dest = path.join(destDir, file);
    
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`Fichier ${file} copié vers ${dest}`);
    } else {
      console.warn(`Fichier source ${src} introuvable`);
    }
  });
}

// Crée un fichier .env spécifique à l'environnement
function createEnvFile() {
  const env = getDeploymentEnvironment();
  console.log(`Création du fichier .env pour l'environnement ${env}`);
  
  const envVars = {
    REACT_APP_AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
    REACT_APP_AUTH0_DOMAIN: process.env.AUTH0_ISSUER_BASE_URL,
    REACT_APP_AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE,
    REACT_APP_AUTH0_SCOPE: process.env.AUTH0_SCOPE,
    REACT_APP_MAPBOX_TOKEN: process.env.MAPBOX_TOKEN,
    REACT_APP_OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY,
    REACT_APP_OPENROUTE_API_KEY: process.env.OPENROUTE_API_KEY,
    REACT_APP_VERSION: new Date().toISOString(),
    REACT_APP_BRAND_NAME: "Velo-Altitude",
    REACT_APP_BASE_URL: process.env.URL || "https://velo-altitude.netlify.app",
    REACT_APP_API_URL: process.env.REACT_APP_API_URL || "/api",
    REACT_APP_STRAVA_CLIENT_ID: process.env.STRAVA_CLIENT_ID,
    REACT_APP_CLAUDE_API_ENABLED: process.env.CLAUDE_API_KEY ? "true" : "false",
    REACT_APP_OPENAI_API_ENABLED: process.env.OPENAI_API_KEY ? "true" : "false"
  };
  
  // Crée le fichier .env avec les variables correctement formatées
  const envContent = Object.entries(envVars)
    .filter(([key, value]) => value !== undefined) // Inclut uniquement les variables définies
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  fs.writeFileSync(path.join(__dirname, '..', '.env'), envContent);
  console.log('Fichier .env créé avec succès');
  
  // Crée également une copie dans le répertoire client pour le build
  fs.writeFileSync(path.join(__dirname, '..', '.env'), envContent);
  console.log('Fichier .env copié dans le répertoire client');
}

// Crée un fichier de configuration runtime pour l'authentification d'urgence
function createRuntimeConfig() {
  const env = getDeploymentEnvironment();
  console.log(`Création de la configuration runtime pour l'environnement ${env}`);
  
  const configContent = `
  window.VELO_ALTITUDE_CONFIG = {
    environment: "${env}",
    auth0: {
      enabled: true,
      clientId: "${process.env.AUTH0_CLIENT_ID || ''}",
      domain: "${process.env.AUTH0_ISSUER_BASE_URL || ''}",
      audience: "${process.env.AUTH0_AUDIENCE || ''}",
      scope: "${process.env.AUTH0_SCOPE || 'openid profile email'}"
    },
    emergencyAuth: {
      enabled: true,
      version: "${new Date().toISOString()}"
    },
    apis: {
      strava: { enabled: ${!!process.env.STRAVA_CLIENT_ID} },
      mapbox: { enabled: ${!!process.env.MAPBOX_TOKEN} },
      openweather: { enabled: ${!!process.env.OPENWEATHER_API_KEY} },
      openroute: { enabled: ${!!process.env.OPENROUTE_API_KEY} },
      claude: { enabled: ${!!process.env.CLAUDE_API_KEY} },
      openai: { enabled: ${!!process.env.OPENAI_API_KEY} }
    }
  };
  `;
  
  const configPath = path.join(__dirname, '..', 'build', 'runtime-config.js');
  fs.writeFileSync(configPath, configContent);
  console.log('Fichier de configuration runtime créé avec succès');
}

// Valide les variables d'environnement requises
function validateEnvironment() {
  console.log('Validation des variables d\'environnement');
  
  const requiredVars = [
    'AUTH0_CLIENT_ID',
    'AUTH0_ISSUER_BASE_URL',
    'AUTH0_AUDIENCE',
    'MAPBOX_TOKEN'
  ];
  
  const missingVars = requiredVars.filter(name => !process.env[name]);
  if (missingVars.length > 0) {
    console.warn(`Variables d'environnement requises manquantes : ${missingVars.join(', ')}`);
    console.warn('Le déploiement va continuer, mais l\'application pourrait ne pas fonctionner correctement');
  }
  
  return true;
}

// Modifie le fichier index.html pour inclure la config runtime
function patchIndexHtml() {
  const indexPath = path.join(__dirname, '..', 'build', 'index.html');
  
  if (!fs.existsSync(indexPath)) {
    console.warn('Fichier index.html introuvable, impossible d\'appliquer le patch');
    return;
  }
  
  let indexContent = fs.readFileSync(indexPath, 'utf8');
  
  // Vérifie si runtime-config.js est déjà inclus
  if (!indexContent.includes('runtime-config.js')) {
    // Ajoute le script de configuration avant le premier script existant
    indexContent = indexContent.replace(
      '<head>',
      '<head>\n    <script src="/runtime-config.js"></script>'
    );
    
    fs.writeFileSync(indexPath, indexContent);
    console.log('Fichier index.html patché avec succès pour inclure runtime-config.js');
  } else {
    console.log('Le fichier index.html contient déjà runtime-config.js');
  }
}

// Exécute les fonctions avec gestion d'erreurs améliorée
try {
  console.log('Démarrage de la préparation du déploiement...');
  validateEnvironment();
  createEnvFile();
  createRuntimeConfig();
  copyEmergencyAuth();
  patchIndexHtml();
  console.log('Préparation du déploiement terminée avec succès');
} catch (error) {
  console.error('Erreur pendant la préparation du déploiement:', error.message);
  console.error(error.stack);
  process.exit(1);
}
