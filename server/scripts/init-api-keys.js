/**
 * Script personnalisé pour initialiser les clés API
 * Ce script utilise explicitement la clé de chiffrement et initialise les clés API pour tous les services
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const dotenv = require('dotenv');

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '../../.env') });

console.log('=== Initialisation des clés API ===');

// Définir explicitement la clé de chiffrement
const ENCRYPTION_KEY = process.env.API_KEYS_ENCRYPTION_KEY || 'd606e4da13394595c952864a3eb026a96fa7a1f1ff76e5d0ac24d22c8ec5cb5d';
console.log(`Utilisation de la clé: ${ENCRYPTION_KEY.substring(0, 8)}...`);

// Créer le répertoire de stockage des clés s'il n'existe pas
const keysDir = path.join(__dirname, '../../.keys');
if (!fs.existsSync(keysDir)) {
  fs.mkdirSync(keysDir, { recursive: true });
  console.log('Répertoire de stockage des clés créé');
} else {
  console.log('Le répertoire de stockage des clés existe déjà');
}

// Services à initialiser
const services = [
  { 
    name: 'openRouteService', 
    envKey: 'OPENROUTE_API_KEY',
    description: 'OpenRouteService API'
  },
  { 
    name: 'strava', 
    envKey: 'STRAVA_CLIENT_SECRET',
    description: 'Strava API'
  },
  { 
    name: 'weatherService', 
    envKey: 'OPENWEATHER_API_KEY',
    description: 'OpenWeatherMap API'
  },
  { 
    name: 'openai', 
    envKey: 'OPENAI_API_KEY',
    description: 'OpenAI API'
  },
  { 
    name: 'mapbox', 
    envKey: 'MAPBOX_SECRET_TOKEN',
    description: 'Mapbox API'
  }
];

// Fonction pour initialiser les clés d'un service
function initializeServiceKeys(service) {
  const { name, envKey, description } = service;
  const keyFilePath = path.join(keysDir, `${name}.json`);
  
  // Vérifier si le fichier de clés existe déjà
  if (fs.existsSync(keyFilePath)) {
    console.log(`Les clés pour ${description} (${name}) existent déjà`);
    return true;
  }
  
  // Récupérer la clé depuis les variables d'environnement
  const apiKey = process.env[envKey];
  if (!apiKey) {
    console.error(`Aucune clé API trouvée pour ${description} (${envKey})`);
    return false;
  }
  
  // Créer l'objet de clés
  const keys = {
    active: 0,
    keys: [
      {
        key: apiKey,
        created: new Date().toISOString()
      },
      {
        key: `${apiKey}_backup`,
        created: new Date().toISOString()
      }
    ],
    lastRotation: new Date().toISOString()
  };
  
  try {
    // Chiffrer les clés
    const encryptedData = encryptKeys(keys);
    
    // Sauvegarder les clés chiffrées
    fs.writeFileSync(keyFilePath, encryptedData);
    console.log(`✓ Clés initialisées pour ${description} (${name})`);
    return true;
  } catch (error) {
    console.error(`Erreur lors de l'initialisation des clés pour ${description} (${name}):`, error.message);
    return false;
  }
}

// Fonction pour chiffrer les clés
function encryptKeys(keys) {
  if (!ENCRYPTION_KEY) {
    throw new Error('API_KEYS_ENCRYPTION_KEY n\'est pas définie');
  }
  
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(JSON.stringify(keys), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return JSON.stringify({
    iv: iv.toString('hex'),
    data: encrypted
  });
}

// Initialiser les clés pour tous les services
let allSuccess = true;
services.forEach(service => {
  try {
    const success = initializeServiceKeys(service);
    if (!success) {
      allSuccess = false;
    }
  } catch (error) {
    console.error(`Erreur lors de l'initialisation des clés pour ${service.name}:`, error.message);
    allSuccess = false;
  }
});

console.log('=== Initialisation des clés API terminée ===');

// Vérifier l'état de santé des clés API
console.log('\n=== Vérification de l\'état de santé des clés API ===');
services.forEach(service => {
  const { name, description } = service;
  const keyFilePath = path.join(keysDir, `${name}.json`);
  
  if (fs.existsSync(keyFilePath)) {
    console.log(`✓ ${description} (${name}): Fichier de clés présent`);
    
    // Vérifier que le fichier est correctement chiffré
    try {
      const fileContent = fs.readFileSync(keyFilePath, 'utf8');
      const encryptedData = JSON.parse(fileContent);
      
      if (encryptedData.iv && encryptedData.data) {
        console.log(`  ✓ Format de chiffrement correct`);
      } else {
        console.error(`  ✗ Format de chiffrement incorrect`);
        allSuccess = false;
      }
    } catch (error) {
      console.error(`  ✗ Erreur lors de la lecture du fichier: ${error.message}`);
      allSuccess = false;
    }
  } else {
    console.error(`✗ ${description} (${name}): Fichier de clés manquant`);
    allSuccess = false;
  }
});

console.log('\n=== Résultat de l\'initialisation ===');
if (allSuccess) {
  console.log('✅ Toutes les clés API ont été correctement initialisées et vérifiées');
  console.log('\nVous pouvez maintenant exécuter le script checkApiKeyHealth.js pour vérifier la santé des clés API');
} else {
  console.error('❌ Des erreurs ont été rencontrées lors de l\'initialisation ou de la vérification des clés API');
  console.error('Veuillez corriger les erreurs ci-dessus avant de continuer');
}
