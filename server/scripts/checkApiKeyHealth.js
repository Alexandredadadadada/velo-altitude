/**
 * Script de vérification de l'état de santé du système de gestion des clés API
 * Dashboard-Velo.com
 */

require('dotenv').config({ path: '../../.env' });
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');
const { logger } = require('../utils/logger');

// Configuration
const keysDirectory = process.env.KEYS_DIRECTORY || path.join(__dirname, '../../.keys');
const encryptionKey = process.env.API_KEYS_ENCRYPTION_KEY;

// Services à vérifier
const services = [
  {
    name: 'openRouteService',
    testEndpoint: 'https://api.openrouteservice.org/v2/health',
    testParams: {},
    validateResponse: (data) => data && data.status === 'ready'
  },
  {
    name: 'weatherService',
    testEndpoint: 'https://api.openweathermap.org/data/2.5/weather',
    testParams: { lat: 48.8534, lon: 2.3488, appid: '{key}' },
    validateResponse: (data) => data && data.cod === 200
  },
  {
    name: 'mapbox',
    testEndpoint: 'https://api.mapbox.com/geocoding/v5/mapbox.places/Paris.json',
    testParams: { access_token: '{key}' },
    validateResponse: (data) => data && data.features && data.features.length > 0
  }
];

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
 * Vérifie l'état de santé d'une clé API
 * @param {Object} service Configuration du service
 * @param {string} key Clé API à tester
 * @returns {Promise<Object>} Résultat du test
 */
async function testApiKey(service, key) {
  try {
    const params = { ...service.testParams };
    
    // Remplacer le placeholder par la vraie clé
    Object.keys(params).forEach(paramKey => {
      if (params[paramKey] === '{key}') {
        params[paramKey] = key;
      }
    });
    
    const response = await axios.get(service.testEndpoint, { 
      params,
      timeout: 5000,
      validateStatus: () => true // Accepter tous les codes de statut
    });
    
    const isValid = service.validateResponse(response.data);
    
    return {
      status: isValid ? 'valid' : 'invalid',
      statusCode: response.status,
      message: isValid ? 'Clé valide' : 'Clé invalide',
      responseTime: response.headers['x-response-time'] || 'N/A',
      rateLimitRemaining: response.headers['x-ratelimit-remaining'] || 'N/A'
    };
  } catch (error) {
    return {
      status: 'error',
      message: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    };
  }
}

/**
 * Vérifie l'état de santé de toutes les clés d'un service
 * @param {Object} service Configuration du service
 * @returns {Promise<Object>} Résultat des tests
 */
async function checkServiceHealth(service) {
  console.log(`\n=== Vérification du service ${service.name} ===`);
  
  try {
    // Vérifier si le fichier de clés existe
    const keysPath = path.join(keysDirectory, `${service.name}.json`);
    if (!fs.existsSync(keysPath)) {
      console.log(`❌ Fichier de clés non trouvé pour ${service.name}`);
      return {
        service: service.name,
        status: 'missing',
        message: 'Fichier de clés non trouvé'
      };
    }
    
    // Lire et déchiffrer les clés
    const encryptedData = fs.readFileSync(keysPath, 'utf8');
    const keys = decryptKeys(encryptedData);
    
    console.log(`Nombre de clés: ${keys.keys.length}`);
    console.log(`Clé active: ${keys.active}`);
    console.log(`Dernière rotation: ${new Date(keys.lastRotation).toLocaleString()}`);
    
    // Tester chaque clé
    const results = [];
    for (let i = 0; i < keys.keys.length; i++) {
      const key = keys.keys[i];
      const isActive = i === keys.active;
      
      process.stdout.write(`Test de la clé ${i} ${isActive ? '(active)' : ''}: `);
      
      const result = await testApiKey(service, key);
      results.push({ keyIndex: i, isActive, ...result });
      
      if (result.status === 'valid') {
        console.log(`✅ Valide (${result.statusCode})`);
      } else if (result.status === 'invalid') {
        console.log(`⚠️ Invalide (${result.statusCode})`);
      } else {
        console.log(`❌ Erreur: ${result.message}`);
      }
    }
    
    // Analyser les résultats
    const activeKeyResult = results.find(r => r.isActive);
    const validKeys = results.filter(r => r.status === 'valid');
    
    return {
      service: service.name,
      status: activeKeyResult.status === 'valid' ? 'healthy' : 'unhealthy',
      activeKeyValid: activeKeyResult.status === 'valid',
      validKeysCount: validKeys.length,
      totalKeysCount: keys.keys.length,
      lastRotation: keys.lastRotation,
      results
    };
  } catch (error) {
    console.log(`❌ Erreur: ${error.message}`);
    return {
      service: service.name,
      status: 'error',
      message: error.message
    };
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log('=== Vérification de l\'état de santé du système de gestion des clés API ===');
  
  // Vérifier la configuration
  if (!encryptionKey) {
    console.error('Erreur: API_KEYS_ENCRYPTION_KEY n\'est pas définie dans le fichier .env');
    process.exit(1);
  }
  
  if (!fs.existsSync(keysDirectory)) {
    console.error(`Erreur: Le répertoire de stockage des clés n'existe pas: ${keysDirectory}`);
    process.exit(1);
  }
  
  // Vérifier chaque service
  const results = [];
  for (const service of services) {
    const result = await checkServiceHealth(service);
    results.push(result);
  }
  
  // Afficher le résumé
  console.log('\n=== Résumé de l\'état de santé ===');
  
  let allHealthy = true;
  for (const result of results) {
    const statusSymbol = result.status === 'healthy' ? '✅' : result.status === 'unhealthy' ? '⚠️' : '❌';
    console.log(`${statusSymbol} ${result.service}: ${result.status}`);
    
    if (result.status !== 'healthy') {
      allHealthy = false;
    }
  }
  
  console.log('\n=== Conclusion ===');
  if (allHealthy) {
    console.log('✅ Tous les services sont en bonne santé');
  } else {
    console.log('⚠️ Certains services présentent des problèmes');
    console.log('Exécutez le script suivant pour effectuer une rotation des clés:');
    console.log('node server/scripts/rotateApiKeys.js');
  }
}

// Exécuter la fonction principale
main().catch(error => {
  console.error('Erreur lors de l\'exécution du script:', error);
});
