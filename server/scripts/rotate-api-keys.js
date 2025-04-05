/**
 * Script personnalisé pour effectuer la rotation des clés API
 * Ce script utilise explicitement la clé de chiffrement et effectue la rotation des clés API pour tous les services
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const dotenv = require('dotenv');

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '../../.env') });

console.log('=== Rotation des clés API ===');

// Définir explicitement la clé de chiffrement
const ENCRYPTION_KEY = process.env.API_KEYS_ENCRYPTION_KEY || 'e231f4e9bee8b2cf838cd39d41523b4313633496fecae88af509449ffe54cc10';
console.log(`Utilisation de la clé: ${ENCRYPTION_KEY.substring(0, 8)}...`);

// Répertoire de stockage des clés
const keysDir = path.join(__dirname, '../../.keys');
if (!fs.existsSync(keysDir)) {
  console.error('Le répertoire de stockage des clés n\'existe pas');
  process.exit(1);
}

// Services pour lesquels effectuer la rotation des clés
const services = [
  { 
    name: 'openRouteService', 
    description: 'OpenRouteService API',
    envKey: 'OPENROUTE_API_KEY'
  },
  { 
    name: 'strava', 
    description: 'Strava API',
    envKey: 'STRAVA_CLIENT_SECRET'
  },
  { 
    name: 'weatherService', 
    description: 'OpenWeatherMap API',
    envKey: 'OPENWEATHER_API_KEY'
  },
  { 
    name: 'openai', 
    description: 'OpenAI API',
    envKey: 'OPENAI_API_KEY'
  },
  { 
    name: 'mapbox', 
    description: 'Mapbox API',
    envKey: 'MAPBOX_SECRET_TOKEN'
  }
];

// Fonction pour déchiffrer les clés
function decryptKeys(encryptedData) {
  try {
    const { iv, data } = JSON.parse(encryptedData);
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  } catch (error) {
    throw new Error(`Erreur lors du déchiffrement: ${error.message}`);
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

// Fonction pour effectuer la rotation des clés d'un service
function rotateServiceKeys(service) {
  const { name, description, envKey } = service;
  const keyFilePath = path.join(keysDir, `${name}.json`);
  
  console.log(`\n--- Rotation des clés pour ${description} (${name}) ---`);
  
  // Vérifier si le fichier de clés existe
  if (!fs.existsSync(keyFilePath)) {
    console.error(`✗ Fichier de clés manquant pour ${description}`);
    return false;
  }
  
  try {
    // Lire et déchiffrer les clés
    const encryptedData = fs.readFileSync(keyFilePath, 'utf8');
    const keys = decryptKeys(encryptedData);
    
    console.log(`✓ Fichier de clés présent et déchiffré avec succès`);
    console.log(`  - Nombre de clés: ${keys.keys.length}`);
    console.log(`  - Clé active avant rotation: ${keys.active}`);
    
    // Effectuer la rotation des clés
    const previousActive = keys.active;
    keys.active = (keys.active + 1) % keys.keys.length;
    keys.lastRotation = new Date().toISOString();
    
    console.log(`  - Clé active après rotation: ${keys.active}`);
    console.log(`  - Nouvelle date de rotation: ${keys.lastRotation}`);
    
    // Chiffrer et sauvegarder les clés
    const newEncryptedData = encryptKeys(keys);
    fs.writeFileSync(keyFilePath, newEncryptedData);
    
    console.log(`✓ Rotation des clés effectuée avec succès pour ${description}`);
    return true;
  } catch (error) {
    console.error(`✗ Erreur lors de la rotation des clés pour ${description}: ${error.message}`);
    return false;
  }
}

// Effectuer la rotation des clés pour tous les services
let allSuccess = true;
services.forEach(service => {
  try {
    const success = rotateServiceKeys(service);
    if (!success) {
      allSuccess = false;
    }
  } catch (error) {
    console.error(`Erreur lors de la rotation des clés pour ${service.name}:`, error.message);
    allSuccess = false;
  }
});

console.log('\n=== Résultat de la rotation ===');
if (allSuccess) {
  console.log('✅ La rotation des clés API a été effectuée avec succès pour tous les services');
} else {
  console.error('❌ Des erreurs ont été rencontrées lors de la rotation des clés API');
  console.error('Veuillez corriger les erreurs ci-dessus avant de continuer');
}

// Vérifier l'intégration avec les services
console.log('\n=== Vérification de l\'intégration avec les services ===');
console.log('Pour vérifier que la rotation des clés a été correctement prise en compte par les services, exécutez:');
console.log('node server/scripts/test-api-key-integration.js');
