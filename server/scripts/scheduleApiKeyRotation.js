/**
 * Script de planification de rotation automatique des clés API
 * Dashboard-Velo.com
 * 
 * Ce script peut être exécuté comme un service indépendant ou via cron
 * pour assurer la rotation automatique des clés API selon un calendrier prédéfini.
 */

require('dotenv').config({ path: '../../.env' });
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const schedule = require('node-schedule');
const { logger } = require('../utils/logger');
const apiKeyNotifications = require('../utils/api-key-notifications');

// Configuration
const keysDirectory = process.env.KEYS_DIRECTORY || path.join(__dirname, '../../.keys');
const encryptionKey = process.env.API_KEYS_ENCRYPTION_KEY;
const logFilePath = path.join(__dirname, '../../logs/api-key-rotation.log');

// Créer le répertoire des logs s'il n'existe pas
const logDir = path.dirname(logFilePath);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Configuration du logger spécifique à la rotation des clés
const rotationLogger = {
  log: (message) => {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    
    // Écrire dans le fichier de log
    fs.appendFileSync(logFilePath, logEntry);
    
    // Afficher dans la console
    console.log(message);
  }
};

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
 * @returns {Promise<Object>} Résultat de la rotation
 */
async function rotateServiceKeys(serviceName) {
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
  
  // Générer une nouvelle clé
  keys.keys[oldestKeyIndex] = generateApiKey();
  
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
 * @returns {Array<Object>} Liste des services avec leurs configurations
 */
function listAvailableServices() {
  try {
    const files = fs.readdirSync(keysDirectory);
    const services = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const serviceName = file.replace('.json', '');
        const keysPath = path.join(keysDirectory, file);
        
        try {
          const encryptedData = fs.readFileSync(keysPath, 'utf8');
          const keys = decryptKeys(encryptedData);
          
          services.push({
            name: serviceName,
            rotationInterval: keys.rotationInterval,
            lastRotation: keys.lastRotation,
            keyCount: keys.keyCount
          });
        } catch (error) {
          rotationLogger.log(`Erreur lors de la lecture des clés pour ${serviceName}: ${error.message}`);
        }
      }
    }
    
    return services;
  } catch (error) {
    rotationLogger.log(`Erreur lors de la lecture du répertoire: ${error.message}`);
    return [];
  }
}

/**
 * Planifie la rotation automatique des clés
 */
function scheduleKeyRotations() {
  const services = listAvailableServices();
  
  if (services.length === 0) {
    rotationLogger.log('Aucun service trouvé pour la rotation automatique');
    return;
  }
  
  rotationLogger.log(`Planification de la rotation automatique pour ${services.length} services`);
  
  for (const service of services) {
    if (service.rotationInterval) {
      try {
        // Planifier la rotation selon l'intervalle cron
        const job = schedule.scheduleJob(service.rotationInterval, async () => {
          rotationLogger.log(`Exécution de la rotation planifiée pour ${service.name}`);
          
          try {
            const result = await rotateServiceKeys(service.name);
            rotationLogger.log(`Rotation réussie pour ${service.name}`);
            
            // Envoyer une notification
            await apiKeyNotifications.notifyKeyRotation(service.name, {
              oldKeyIndex: result.oldActiveKeyIndex,
              newKeyIndex: result.newActiveKeyIndex,
              rotationTime: result.rotationTime
            });
          } catch (error) {
            rotationLogger.log(`Erreur lors de la rotation pour ${service.name}: ${error.message}`);
            
            // Envoyer une notification d'erreur
            await apiKeyNotifications.notifyError(service.name, error);
          }
        });
        
        rotationLogger.log(`Rotation planifiée pour ${service.name} avec l'intervalle: ${service.rotationInterval}`);
        
        // Calculer la prochaine exécution
        const nextInvocation = job.nextInvocation();
        if (nextInvocation) {
          rotationLogger.log(`Prochaine rotation pour ${service.name}: ${nextInvocation.toLocaleString()}`);
        } else {
          rotationLogger.log(`Impossible de déterminer la prochaine rotation pour ${service.name}`);
        }
      } catch (error) {
        rotationLogger.log(`Erreur lors de la planification pour ${service.name}: ${error.message}`);
      }
    } else {
      rotationLogger.log(`Pas d'intervalle de rotation défini pour ${service.name}`);
    }
  }
}

/**
 * Vérifie si une rotation immédiate est nécessaire
 * @param {Object} service Configuration du service
 * @returns {boolean} True si une rotation est nécessaire
 */
function isRotationNeeded(service) {
  if (!service.lastRotation) {
    return true;
  }
  
  const lastRotation = new Date(service.lastRotation);
  const now = new Date();
  
  // Vérifier si la dernière rotation date de plus de 30 jours
  const daysSinceRotation = Math.floor((now - lastRotation) / (1000 * 60 * 60 * 24));
  
  return daysSinceRotation > 30;
}

/**
 * Effectue une rotation immédiate pour les services qui en ont besoin
 */
async function performImmediateRotationsIfNeeded() {
  const services = listAvailableServices();
  
  for (const service of services) {
    if (isRotationNeeded(service)) {
      rotationLogger.log(`Rotation immédiate nécessaire pour ${service.name} (dernière rotation: ${service.lastRotation})`);
      
      try {
        const result = await rotateServiceKeys(service.name);
        rotationLogger.log(`Rotation immédiate réussie pour ${service.name}`);
        
        // Envoyer une notification
        await apiKeyNotifications.notifyKeyRotation(service.name, {
          oldKeyIndex: result.oldActiveKeyIndex,
          newKeyIndex: result.newActiveKeyIndex,
          rotationTime: result.rotationTime,
          reason: 'Rotation immédiate nécessaire (plus de 30 jours depuis la dernière rotation)'
        });
      } catch (error) {
        rotationLogger.log(`Erreur lors de la rotation immédiate pour ${service.name}: ${error.message}`);
        
        // Envoyer une notification d'erreur
        await apiKeyNotifications.notifyError(service.name, error);
      }
    }
  }
}

/**
 * Fonction principale
 */
async function main() {
  rotationLogger.log('=== Démarrage du service de rotation automatique des clés API ===');
  
  // Vérifier la configuration
  if (!encryptionKey) {
    rotationLogger.log('Erreur: API_KEYS_ENCRYPTION_KEY n\'est pas définie dans le fichier .env');
    process.exit(1);
  }
  
  if (!fs.existsSync(keysDirectory)) {
    rotationLogger.log(`Erreur: Le répertoire de stockage des clés n'existe pas: ${keysDirectory}`);
    process.exit(1);
  }
  
  // Effectuer les rotations immédiates si nécessaire
  await performImmediateRotationsIfNeeded();
  
  // Planifier les rotations automatiques
  scheduleKeyRotations();
  
  rotationLogger.log('Service de rotation automatique des clés API démarré avec succès');
  
  // Garder le processus en vie
  process.on('SIGINT', () => {
    rotationLogger.log('Arrêt du service de rotation automatique des clés API');
    process.exit(0);
  });
}

// Exécuter la fonction principale
main().catch(error => {
  rotationLogger.log(`Erreur lors de l'exécution du script: ${error.message}`);
  process.exit(1);
});
