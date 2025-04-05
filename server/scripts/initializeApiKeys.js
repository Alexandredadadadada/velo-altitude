/**
 * Script d'initialisation des clés API
 * Dashboard-Velo.com
 * 
 * Ce script initialise le système de gestion des clés API en créant les fichiers
 * de clés chiffrés à partir des variables d'environnement existantes.
 */

require('dotenv').config({ path: '../../.env' });
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Vérifier que la clé de chiffrement est définie
if (!process.env.API_KEYS_ENCRYPTION_KEY) {
  console.error('Erreur: API_KEYS_ENCRYPTION_KEY n\'est pas définie dans le fichier .env');
  console.error('Exécutez d\'abord le script generateEncryptionKey.js pour générer une clé');
  process.exit(1);
}

// Définir le répertoire de stockage des clés
const keysDirectory = process.env.KEYS_DIRECTORY || path.join(__dirname, '../../.keys');

// Créer le répertoire s'il n'existe pas
if (!fs.existsSync(keysDirectory)) {
  fs.mkdirSync(keysDirectory, { recursive: true });
  console.log(`Répertoire de stockage des clés créé: ${keysDirectory}`);
}

// Configuration des services et leurs clés API
const services = [
  {
    name: 'openRouteService',
    envKey: 'OPENROUTE_API_KEY',
    keyCount: 3,
    rotationInterval: '0 0 1 * *' // Mensuelle (1er jour du mois)
  },
  {
    name: 'strava',
    envKey: 'STRAVA_CLIENT_SECRET',
    keyCount: 2,
    rotationInterval: '0 0 * * 0' // Hebdomadaire
  },
  {
    name: 'weatherService',
    envKey: 'OPENWEATHER_API_KEY',
    keyCount: 2,
    rotationInterval: '0 0 1,15 * *' // Bi-mensuelle
  },
  {
    name: 'mapbox',
    envKey: 'MAPBOX_SECRET_TOKEN',
    keyCount: 2,
    rotationInterval: '0 0 1 * *' // Mensuelle
  },
  {
    name: 'openai',
    envKey: 'OPENAI_API_KEY',
    keyCount: 2,
    rotationInterval: '0 0 15 * *' // Mensuelle (15 du mois)
  }
];

/**
 * Chiffre les données avec AES-256-GCM
 * @param {Object} data Données à chiffrer
 * @returns {string} Données chiffrées en base64
 */
function encryptData(data) {
  const key = Buffer.from(process.env.API_KEYS_ENCRYPTION_KEY, 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  const authTag = cipher.getAuthTag();
  
  // Combine IV, encrypted data, and auth tag
  return JSON.stringify({
    iv: iv.toString('base64'),
    data: encrypted,
    authTag: authTag.toString('base64')
  });
}

/**
 * Génère une clé API aléatoire
 * @returns {string} Clé API générée
 */
function generateApiKey() {
  return crypto.randomBytes(24).toString('hex');
}

// Initialiser les clés pour chaque service
for (const service of services) {
  const existingKey = process.env[service.envKey];
  
  if (!existingKey) {
    console.warn(`Avertissement: ${service.envKey} n'est pas définie dans le fichier .env. Une clé aléatoire sera générée.`);
  }
  
  // Créer la structure de clés
  const keys = {
    active: 0,
    lastRotation: new Date().toISOString(),
    rotationInterval: service.rotationInterval,
    keyCount: service.keyCount,
    keys: []
  };
  
  // Ajouter la clé existante comme première clé
  keys.keys.push(existingKey || generateApiKey());
  
  // Générer des clés supplémentaires
  for (let i = 1; i < service.keyCount; i++) {
    keys.keys.push(generateApiKey());
  }
  
  // Chiffrer et sauvegarder les clés
  const encryptedData = encryptData(keys);
  const keysPath = path.join(keysDirectory, `${service.name}.json`);
  
  fs.writeFileSync(keysPath, encryptedData);
  console.log(`Clés pour ${service.name} initialisées et chiffrées dans ${keysPath}`);
}

console.log('\nInitialisation des clés API terminée avec succès.');
console.log('Le système de rotation des clés API est maintenant prêt à être utilisé.');
console.log('\nPour tester le système, exécutez:');
console.log('node server/scripts/testApiKeys.js');
