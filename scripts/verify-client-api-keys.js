/**
 * Script de vérification des clés API côté client
 * Ce script vérifie que toutes les clés API nécessaires pour le client sont correctement configurées dans les variables d'environnement
 */

const chalk = require('chalk');
const dotenv = require('dotenv');
const path = require('path');

// Charger les variables d'environnement (pour le développement local uniquement)
dotenv.config({ path: path.resolve(__dirname, '../.env.production') });

// Configuration des clés API à vérifier
const CLIENT_API_KEYS = [
  {
    name: 'Mapbox Token',
    envVar: 'MAPBOX_PUBLIC_TOKEN',
    clientEnvVar: 'REACT_APP_MAPBOX_TOKEN',
    required: true,
    description: 'Utilisé pour l\'affichage des cartes interactives'
  }
];

// Fonction pour vérifier les clés API
function checkApiKeys() {
  console.log(chalk.blue.bold('=== Vérification des clés API côté client ===\n'));
  
  let allKeysValid = true;
  const missingKeys = [];
  
  CLIENT_API_KEYS.forEach(key => {
    const value = process.env[key.envVar];
    
    if (!value) {
      allKeysValid = false;
      missingKeys.push(key);
      console.log(chalk.red(`✗ ${key.name}: Non configurée (${key.envVar})`));
    } else {
      console.log(chalk.green(`✓ ${key.name}: Configurée`));
    }
  });
  
  console.log('\n');
  
  if (missingKeys.length > 0) {
    console.log(chalk.yellow.bold('Clés API manquantes:'));
    missingKeys.forEach(key => {
      console.log(chalk.yellow(`  - ${key.name} (${key.envVar}): ${key.description}`));
    });
    console.log('\n');
    console.log(chalk.yellow('Ces clés doivent être configurées comme variables d\'environnement dans Netlify.'));
  }
  
  return allKeysValid;
}

// Fonction principale
function main() {
  const allKeysValid = checkApiKeys();
  
  if (allKeysValid) {
    console.log(chalk.green.bold('✓ Toutes les clés API côté client sont correctement configurées.'));
    process.exit(0);
  } else {
    console.log(chalk.yellow.bold('⚠️ Certaines clés API côté client sont manquantes ou invalides.'));
    console.log(chalk.yellow('Veuillez vérifier les variables d\'environnement dans Netlify et vous assurer que toutes les clés requises sont présentes.'));
    process.exit(1);
  }
}

// Exécuter la fonction principale
main();
