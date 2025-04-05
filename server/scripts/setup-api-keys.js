/**
 * Script pour configurer et initialiser les clés API
 * Ce script définit explicitement la clé de chiffrement et initialise les clés API
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const dotenv = require('dotenv');
const { logger } = require('../utils/logger');

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Définir explicitement la clé de chiffrement si elle n'est pas déjà définie
if (!process.env.API_KEYS_ENCRYPTION_KEY) {
  process.env.API_KEYS_ENCRYPTION_KEY = 'e231f4e9bee8b2cf838cd39d41523b4313633496fecae88af509449ffe54cc10';
  logger.info('Clé de chiffrement définie explicitement');
}

// Créer le répertoire de stockage des clés s'il n'existe pas
const keysDir = path.join(__dirname, '../../.keys');
if (!fs.existsSync(keysDir)) {
  fs.mkdirSync(keysDir, { recursive: true });
  logger.info('Répertoire de stockage des clés créé');
}

// Initialiser les clés API pour chaque service
const services = [
  { 
    name: 'openRouteService', 
    envKey: 'OPENROUTE_API_KEY', 
    keyCount: 2 
  },
  { 
    name: 'strava', 
    envKey: 'STRAVA_CLIENT_SECRET', 
    keyCount: 2 
  },
  { 
    name: 'weatherService', 
    envKey: 'OPENWEATHER_API_KEY', 
    keyCount: 2 
  },
  { 
    name: 'openai', 
    envKey: 'OPENAI_API_KEY', 
    keyCount: 2 
  },
  { 
    name: 'mapbox', 
    envKey: 'MAPBOX_SECRET_TOKEN', 
    keyCount: 2 
  }
];

// Fonction pour initialiser les clés d'un service
function initializeServiceKeys(service) {
  const { name, envKey, keyCount } = service;
  const keyFilePath = path.join(keysDir, `${name}.json`);
  
  // Vérifier si le fichier de clés existe déjà
  if (fs.existsSync(keyFilePath)) {
    logger.info(`Les clés pour ${name} existent déjà`);
    return;
  }
  
  // Récupérer la clé depuis les variables d'environnement
  const apiKey = process.env[envKey];
  if (!apiKey) {
    logger.error(`Aucune clé API trouvée pour ${name} (${envKey})`);
    return;
  }
  
  // Créer l'objet de clés
  const keys = {
    active: 0,
    keys: [
      {
        key: apiKey,
        created: new Date().toISOString()
      }
    ],
    lastRotation: new Date().toISOString()
  };
  
  // Ajouter des clés supplémentaires (générées aléatoirement pour le moment)
  for (let i = 1; i < keyCount; i++) {
    keys.keys.push({
      key: crypto.randomBytes(32).toString('hex'),
      created: new Date().toISOString()
    });
  }
  
  // Chiffrer les clés
  const encryptedData = encryptKeys(keys);
  
  // Sauvegarder les clés chiffrées
  fs.writeFileSync(keyFilePath, encryptedData);
  logger.info(`Clés initialisées pour ${name}`);
}

// Fonction pour chiffrer les clés
function encryptKeys(keys) {
  const encryptionKey = process.env.API_KEYS_ENCRYPTION_KEY;
  if (!encryptionKey) {
    throw new Error('API_KEYS_ENCRYPTION_KEY n\'est pas définie');
  }
  
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(encryptionKey, 'hex'), iv);
  let encrypted = cipher.update(JSON.stringify(keys), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return JSON.stringify({
    iv: iv.toString('hex'),
    data: encrypted
  });
}

// Initialiser les clés pour tous les services
logger.info('=== Initialisation des clés API ===');
services.forEach(service => {
  try {
    initializeServiceKeys(service);
  } catch (error) {
    logger.error(`Erreur lors de l'initialisation des clés pour ${service.name}:`, error);
  }
});

logger.info('=== Initialisation des clés API terminée ===');

// Vérifier l'état de santé des clés API
logger.info('=== Vérification de l\'état de santé des clés API ===');
services.forEach(service => {
  const { name } = service;
  const keyFilePath = path.join(keysDir, `${name}.json`);
  
  if (fs.existsSync(keyFilePath)) {
    logger.info(`✓ ${name}: Fichier de clés présent`);
  } else {
    logger.error(`✗ ${name}: Fichier de clés manquant`);
  }
});

logger.info('=== Vérification terminée ===');
