/**
 * Script de vérification des clés API côté client
 * Ce script vérifie que toutes les clés API nécessaires pour le client sont correctement configurées
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const dotenv = require('dotenv');

// Charger les variables d'environnement
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
  const validKeys = [];
  
  CLIENT_API_KEYS.forEach(key => {
    const value = process.env[key.envVar];
    
    if (!value) {
      allKeysValid = false;
      missingKeys.push(key);
      console.log(chalk.red(`✗ ${key.name}: Non configurée (${key.envVar})`));
    } else {
      validKeys.push(key);
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
  }
  
  // Générer le fichier .env.local pour React
  generateReactEnvFile(validKeys, missingKeys);
  
  return allKeysValid;
}

// Fonction pour générer le fichier .env.local pour React
function generateReactEnvFile(validKeys, missingKeys) {
  console.log(chalk.blue.bold('Génération du fichier .env.local pour React...'));
  
  let envContent = '# Fichier de configuration généré automatiquement pour React\n';
  envContent += '# Ne pas modifier manuellement\n\n';
  
  // Ajouter les clés valides
  validKeys.forEach(key => {
    envContent += `${key.clientEnvVar}=${process.env[key.envVar]}\n`;
  });
  
  // Ajouter des placeholders pour les clés manquantes
  missingKeys.forEach(key => {
    if (key.required) {
      envContent += `# ATTENTION: Clé requise manquante\n`;
      envContent += `${key.clientEnvVar}=REPLACE_WITH_VALID_KEY\n`;
    } else {
      envContent += `# Clé optionnelle\n`;
      envContent += `# ${key.clientEnvVar}=\n`;
    }
  });
  
  // Ajouter d'autres variables d'environnement React
  envContent += '\n# Configuration de l\'API\n';
  envContent += `REACT_APP_API_URL=${process.env.API_BASE_URL || 'https://api.grand-est-cyclisme.fr'}\n`;
  envContent += `REACT_APP_USE_MOCK_DATA=false\n`;
  
  // Écrire le fichier
  const envFilePath = path.resolve(__dirname, '../client/.env.local');
  
  try {
    fs.writeFileSync(envFilePath, envContent);
    console.log(chalk.green(`✓ Fichier .env.local créé avec succès: ${envFilePath}`));
  } catch (error) {
    console.error(chalk.red(`✗ Erreur lors de la création du fichier .env.local: ${error.message}`));
  }
}

// Fonction principale
function main() {
  const allKeysValid = checkApiKeys();
  
  if (allKeysValid) {
    console.log(chalk.green.bold('✓ Toutes les clés API côté client sont correctement configurées.'));
    process.exit(0);
  } else {
    console.log(chalk.yellow.bold('⚠️ Certaines clés API côté client sont manquantes ou invalides.'));
    console.log(chalk.yellow('Veuillez vérifier le fichier .env.production et vous assurer que toutes les clés requises sont présentes.'));
    process.exit(1);
  }
}

// Exécuter la fonction principale
main();
