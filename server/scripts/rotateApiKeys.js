/**
 * Script de rotation manuelle des clés API
 * Dashboard-Velo.com
 */

require('dotenv').config({ path: '../../.env' });
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');
const { logger } = require('../utils/logger');

// Configuration
const keysDirectory = process.env.KEYS_DIRECTORY || path.join(__dirname, '../../.keys');
const encryptionKey = process.env.API_KEYS_ENCRYPTION_KEY;

// Créer une interface de ligne de commande
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Déchiffre les données de clés API
 * @param {string} encryptedData Données chiffrées
 * @returns {Object} Données déchiffrées
 */
function decryptKeys(encryptedData) {
  try {
    const encryptedObj = JSON.parse(encryptedData);
    const iv = Buffer.from(encryptedObj.iv, 'base64');
    const encryptedText = encryptedObj.data;
    const authTag = Buffer.from(encryptedObj.authTag, 'base64');
    
    const key = Buffer.from(encryptionKey, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  } catch (error) {
    throw new Error(`Erreur de déchiffrement: ${error.message}`);
  }
}

/**
 * Chiffre les données de clés API
 * @param {Object} data Données à chiffrer
 * @returns {string} Données chiffrées
 */
function encryptKeys(data) {
  try {
    const key = Buffer.from(encryptionKey, 'hex');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const authTag = cipher.getAuthTag();
    
    return JSON.stringify({
      iv: iv.toString('base64'),
      data: encrypted,
      authTag: authTag.toString('base64')
    });
  } catch (error) {
    throw new Error(`Erreur de chiffrement: ${error.message}`);
  }
}

/**
 * Génère une clé API aléatoire
 * @returns {string} Clé API générée
 */
function generateApiKey() {
  return crypto.randomBytes(24).toString('hex');
}

/**
 * Effectue une rotation des clés pour un service
 * @param {string} serviceName Nom du service
 * @param {Object} options Options de rotation
 * @returns {Promise<Object>} Résultat de la rotation
 */
async function rotateServiceKeys(serviceName, options = {}) {
  const keysPath = path.join(keysDirectory, `${serviceName}.json`);
  
  // Vérifier si le fichier de clés existe
  if (!fs.existsSync(keysPath)) {
    throw new Error(`Fichier de clés non trouvé pour ${serviceName}`);
  }
  
  // Lire et déchiffrer les clés
  const encryptedData = fs.readFileSync(keysPath, 'utf8');
  const keys = decryptKeys(encryptedData);
  
  // Sauvegarder l'ancienne clé active
  const oldActiveKeyIndex = keys.active;
  const oldActiveKey = keys.keys[oldActiveKeyIndex];
  
  // Effectuer la rotation
  keys.active = (keys.active + 1) % keys.keyCount;
  const oldestKeyIndex = (keys.active + 1) % keys.keyCount;
  
  // Générer une nouvelle clé ou utiliser celle fournie
  if (options.newKey) {
    keys.keys[oldestKeyIndex] = options.newKey;
  } else {
    keys.keys[oldestKeyIndex] = generateApiKey();
  }
  
  // Mettre à jour la date de dernière rotation
  keys.lastRotation = new Date().toISOString();
  
  // Chiffrer et sauvegarder les clés
  const newEncryptedData = encryptKeys(keys);
  fs.writeFileSync(keysPath, newEncryptedData);
  
  return {
    service: serviceName,
    oldActiveKeyIndex,
    newActiveKeyIndex: keys.active,
    oldActiveKey,
    newActiveKey: keys.keys[keys.active],
    rotationTime: keys.lastRotation
  };
}

/**
 * Liste tous les services disponibles
 * @returns {Array<string>} Liste des noms de services
 */
function listAvailableServices() {
  try {
    const files = fs.readdirSync(keysDirectory);
    return files
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''));
  } catch (error) {
    console.error(`Erreur lors de la lecture du répertoire: ${error.message}`);
    return [];
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log('=== Rotation manuelle des clés API ===\n');
  
  // Vérifier la configuration
  if (!encryptionKey) {
    console.error('Erreur: API_KEYS_ENCRYPTION_KEY n\'est pas définie dans le fichier .env');
    process.exit(1);
  }
  
  if (!fs.existsSync(keysDirectory)) {
    console.error(`Erreur: Le répertoire de stockage des clés n'existe pas: ${keysDirectory}`);
    process.exit(1);
  }
  
  // Lister les services disponibles
  const services = listAvailableServices();
  
  if (services.length === 0) {
    console.error('Aucun service trouvé dans le répertoire des clés');
    process.exit(1);
  }
  
  console.log('Services disponibles:');
  services.forEach((service, index) => {
    console.log(`${index + 1}. ${service}`);
  });
  
  // Demander à l'utilisateur de choisir un service ou tous
  rl.question('\nEntrez le numéro du service à traiter (ou "all" pour tous): ', async (answer) => {
    try {
      let servicesToRotate = [];
      
      if (answer.toLowerCase() === 'all') {
        servicesToRotate = services;
        console.log('\nRotation des clés pour tous les services...');
      } else {
        const serviceIndex = parseInt(answer) - 1;
        if (isNaN(serviceIndex) || serviceIndex < 0 || serviceIndex >= services.length) {
          throw new Error('Numéro de service invalide');
        }
        servicesToRotate = [services[serviceIndex]];
        console.log(`\nRotation des clés pour ${services[serviceIndex]}...`);
      }
      
      // Effectuer la rotation pour chaque service
      for (const service of servicesToRotate) {
        try {
          const result = await rotateServiceKeys(service);
          console.log(`✅ ${service}: Rotation réussie`);
          console.log(`   Ancienne clé active: ${result.oldActiveKeyIndex} (${maskKey(result.oldActiveKey)})`);
          console.log(`   Nouvelle clé active: ${result.newActiveKeyIndex} (${maskKey(result.newActiveKey)})`);
          console.log(`   Rotation effectuée le: ${new Date(result.rotationTime).toLocaleString()}`);
        } catch (error) {
          console.error(`❌ ${service}: Erreur lors de la rotation: ${error.message}`);
        }
      }
      
      console.log('\n=== Rotation terminée ===');
      console.log('\nPour vérifier l\'état de santé des clés, exécutez:');
      console.log('node server/scripts/checkApiKeyHealth.js');
      
      rl.close();
    } catch (error) {
      console.error(`Erreur: ${error.message}`);
      rl.close();
    }
  });
}

/**
 * Masque une clé pour l'affichage
 * @param {string} key Clé à masquer
 * @returns {string} Clé masquée
 */
function maskKey(key) {
  if (!key) return 'undefined';
  if (key.length <= 8) return '********';
  return key.substring(0, 4) + '...' + key.substring(key.length - 4);
}

// Exécuter la fonction principale
main().catch(error => {
  console.error('Erreur lors de l\'exécution du script:', error);
  rl.close();
});
