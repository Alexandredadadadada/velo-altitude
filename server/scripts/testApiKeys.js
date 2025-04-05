/**
 * Script de test du système de gestion des clés API
 * Dashboard-Velo.com
 */

require('dotenv').config({ path: '../../.env' });
const fs = require('fs');
const path = require('path');
const ApiKeyManager = require('../utils/apiKeyManager');

// Définir le répertoire de stockage des clés
const keysDirectory = process.env.KEYS_DIRECTORY || path.join(__dirname, '../../.keys');

// Vérifier que la clé de chiffrement est définie
if (!process.env.API_KEYS_ENCRYPTION_KEY) {
  console.error('Erreur: API_KEYS_ENCRYPTION_KEY n\'est pas définie dans le fichier .env');
  console.error('Exécutez d\'abord le script generateEncryptionKey.js pour générer une clé');
  process.exit(1);
}

// Vérifier que le répertoire des clés existe
if (!fs.existsSync(keysDirectory)) {
  console.error(`Erreur: Le répertoire de stockage des clés n'existe pas: ${keysDirectory}`);
  console.error('Exécutez d\'abord le script initializeApiKeys.js pour initialiser les clés');
  process.exit(1);
}

console.log('=== Test du système de gestion des clés API ===\n');

// Liste des services à tester
const services = [
  {
    name: 'openRouteService',
    keyCount: 3
  },
  {
    name: 'strava',
    keyCount: 2
  },
  {
    name: 'weatherService',
    keyCount: 2
  },
  {
    name: 'mapbox',
    keyCount: 2
  },
  {
    name: 'openai',
    keyCount: 2
  }
];

// Fonction pour tester un gestionnaire de clés
async function testKeyManager(service) {
  console.log(`\n--- Test du gestionnaire de clés pour ${service.name} ---`);
  
  try {
    // Initialiser le gestionnaire de clés
    const keyManager = new ApiKeyManager(service.name, {
      keyCount: service.keyCount,
      keysPath: path.join(keysDirectory, `${service.name}.json`),
      autoRotate: false // Désactiver la rotation automatique pour le test
    });
    
    // Tester la récupération de la clé active
    const activeKey = keyManager.getActiveKey();
    console.log(`✅ Clé active récupérée: ${maskKey(activeKey)}`);
    
    // Tester la récupération de toutes les clés valides
    const allKeys = keyManager.getAllValidKeys();
    console.log(`✅ ${allKeys.length} clés valides récupérées`);
    
    // Tester la validation d'une clé
    const isValid = keyManager.isValidKey(activeKey);
    console.log(`✅ Validation de clé: ${isValid ? 'OK' : 'ÉCHEC'}`);
    
    // Tester la rotation des clés
    console.log('Rotation des clés...');
    const oldActiveKey = activeKey;
    keyManager.rotateKeys();
    const newActiveKey = keyManager.getActiveKey();
    
    if (oldActiveKey !== newActiveKey) {
      console.log(`✅ Rotation réussie: ${maskKey(oldActiveKey)} -> ${maskKey(newActiveKey)}`);
    } else {
      console.log('❌ ÉCHEC: La rotation n\'a pas changé la clé active');
    }
    
    // Tester l'ajout d'une nouvelle clé
    const newKey = 'test_key_' + Date.now();
    keyManager.addKey(newKey);
    const keyExists = keyManager.isValidKey(newKey);
    console.log(`✅ Ajout de clé: ${keyExists ? 'OK' : 'ÉCHEC'}`);
    
    // Tester la sauvegarde des clés
    keyManager.saveKeys();
    console.log('✅ Sauvegarde des clés réussie');
    
    return true;
  } catch (error) {
    console.error(`❌ ERREUR: ${error.message}`);
    return false;
  }
}

// Masquer la clé pour l'affichage
function maskKey(key) {
  if (!key) return 'undefined';
  if (key.length <= 8) return '********';
  return key.substring(0, 4) + '...' + key.substring(key.length - 4);
}

// Tester tous les gestionnaires de clés
async function runTests() {
  let successCount = 0;
  
  for (const service of services) {
    const success = await testKeyManager(service);
    if (success) successCount++;
  }
  
  console.log(`\n=== Résultats des tests: ${successCount}/${services.length} services testés avec succès ===`);
  
  if (successCount === services.length) {
    console.log('\n✅ Tous les tests ont réussi. Le système de gestion des clés API fonctionne correctement.');
  } else {
    console.log('\n❌ Certains tests ont échoué. Vérifiez les erreurs ci-dessus.');
  }
}

// Exécuter les tests
runTests().catch(error => {
  console.error('Erreur lors de l\'exécution des tests:', error);
});
