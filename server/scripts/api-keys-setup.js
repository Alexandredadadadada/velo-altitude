#!/usr/bin/env node

/**
 * Script de configuration des clés API
 * Ce script vérifie et configure les clés API nécessaires au fonctionnement
 * du tableau de bord européen de cyclisme
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const dotenv = require('dotenv');
const { execSync } = require('child_process');
const axios = require('axios');

// Chemin vers le fichier .env
const envPath = path.resolve(process.cwd(), '.env');

// Clés API requises
const requiredKeys = [
  {
    name: 'OPENWEATHERMAP_API_KEY',
    description: 'Clé API OpenWeatherMap pour les données météo',
    testUrl: 'https://api.openweathermap.org/data/2.5/weather?lat=48.8566&lon=2.3522&appid=$KEY',
    testResponse: (data) => data && data.coord && data.weather
  },
  {
    name: 'OPENROUTESERVICE_API_KEY',
    description: 'Clé API OpenRouteService pour le calcul d\'itinéraires',
    testUrl: 'https://api.openrouteservice.org/v2/directions/cycling-regular?api_key=$KEY&start=8.681495,49.41461&end=8.687872,49.420318',
    testResponse: (data) => data && data.routes && data.routes.length > 0
  },
  {
    name: 'STRAVA_CLIENT_ID',
    description: 'ID Client Strava pour OAuth',
    testFunction: async (key, allKeys) => {
      // Ne peut pas être testé directement sans authentification utilisateur
      return true;
    }
  },
  {
    name: 'STRAVA_CLIENT_SECRET',
    description: 'Secret Client Strava pour OAuth',
    testFunction: async (key, allKeys) => {
      // Ne peut pas être testé directement sans authentification utilisateur
      return true;
    }
  },
  {
    name: 'STRAVA_ACCESS_TOKEN',
    description: 'Token d\'accès Strava (sera géré automatiquement)',
    testUrl: 'https://www.strava.com/api/v3/athlete',
    testHeaders: { 'Authorization': 'Bearer $KEY' },
    testResponse: (data) => data && data.id
  },
  {
    name: 'STRAVA_REFRESH_TOKEN',
    description: 'Token de rafraîchissement Strava (sera géré automatiquement)',
    testFunction: async (key, allKeys) => {
      // Ne peut pas être testé directement
      return key && key.length > 10;
    }
  },
  {
    name: 'MAPBOX_ACCESS_TOKEN',
    description: 'Token d\'accès Mapbox pour la cartographie',
    testUrl: 'https://api.mapbox.com/geocoding/v5/mapbox.places/Paris.json?access_token=$KEY',
    testResponse: (data) => data && data.features && data.features.length > 0
  },
  {
    name: 'OPENAI_API_KEY',
    description: 'Clé API OpenAI pour les fonctionnalités IA',
    testUrl: 'https://api.openai.com/v1/chat/completions',
    testHeaders: { 'Authorization': 'Bearer $KEY', 'Content-Type': 'application/json' },
    testMethod: 'post',
    testData: {
      model: "gpt-3.5-turbo",
      messages: [{ role: "system", content: "Hello" }],
      max_tokens: 10
    },
    testResponse: (data) => data && data.choices
  },
  {
    name: 'CLAUDE_API_KEY',
    description: 'Clé API Claude (Anthropic) pour les fonctionnalités IA alternatives',
    testUrl: 'https://api.anthropic.com/v1/messages',
    testHeaders: { 'x-api-key': '$KEY', 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
    testMethod: 'post',
    testData: {
      model: "claude-2",
      max_tokens: 10,
      messages: [{ role: "user", content: "Hello" }]
    },
    testResponse: (data) => data && data.content
  }
];

// Interface de lecture pour l'entrée utilisateur
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Fonction principale
async function main() {
  console.log('\n=== Configuration des clés API pour le Tableau de Bord Européen de Cyclisme ===\n');
  
  // Charger le fichier .env existant ou créer un nouveau
  let envVars = {};
  if (fs.existsSync(envPath)) {
    console.log(`Fichier .env trouvé à ${envPath}`);
    dotenv.config();
    envVars = process.env;
  } else {
    console.log(`Création d'un nouveau fichier .env à ${envPath}`);
    fs.writeFileSync(envPath, '# Configuration API pour le Tableau de Bord Européen de Cyclisme\n\n');
  }
  
  console.log('\nVérification des clés API requises...\n');
  
  let updated = false;
  let anyErrors = false;
  
  // Vérifier chaque clé API
  for (const keyConfig of requiredKeys) {
    process.stdout.write(`⏳ ${keyConfig.name}: `);
    
    // Obtenir la valeur actuelle
    let value = envVars[keyConfig.name];
    let isValid = false;
    let errorMsg = '';
    
    if (value) {
      // Tester la validité de la clé
      try {
        if (keyConfig.testFunction) {
          isValid = await keyConfig.testFunction(value, envVars);
        } else {
          const testUrl = keyConfig.testUrl.replace('$KEY', value);
          const options = {
            method: keyConfig.testMethod || 'get',
            url: testUrl,
            headers: {}
          };
          
          if (keyConfig.testHeaders) {
            Object.entries(keyConfig.testHeaders).forEach(([key, val]) => {
              options.headers[key] = val.replace('$KEY', value);
            });
          }
          
          if (keyConfig.testData) {
            options.data = keyConfig.testData;
          }
          
          const response = await axios(options);
          isValid = keyConfig.testResponse(response.data);
        }
      } catch (error) {
        isValid = false;
        errorMsg = error.message;
      }
    }
    
    if (isValid) {
      console.log('✅ Valide');
    } else {
      console.log('❌ ' + (value ? `Invalide${errorMsg ? ': ' + errorMsg : ''}` : 'Non configurée'));
      anyErrors = true;
      
      // Proposer de saisir ou corriger la clé
      const newValue = await new Promise(resolve => {
        rl.question(`\nEntrez votre ${keyConfig.name} (${keyConfig.description}): `, answer => {
          resolve(answer.trim());
        });
      });
      
      if (newValue && newValue !== value) {
        // Mettre à jour le fichier .env
        updateEnvFile(keyConfig.name, newValue);
        console.log(`✅ ${keyConfig.name} mise à jour dans le fichier .env`);
        updated = true;
      } else if (!newValue) {
        console.log(`⚠️ ${keyConfig.name} non configurée`);
      }
    }
  }
  
  console.log('\n=== Résumé de la configuration ===');
  
  if (!anyErrors) {
    console.log('✅ Toutes les clés API sont configurées et valides!');
  } else if (updated) {
    console.log('⚠️ Certaines clés ont été mises à jour. Veuillez redémarrer l\'application pour les prendre en compte.');
  } else {
    console.log('⚠️ Certaines clés n\'ont pas été configurées. L\'application pourrait ne pas fonctionner correctement.');
  }
  
  rl.close();
}

// Fonction pour mettre à jour le fichier .env
function updateEnvFile(key, value) {
  try {
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
      
      // Vérifier si la clé existe déjà
      const keyRegex = new RegExp(`^${key}=.*`, 'm');
      if (keyRegex.test(envContent)) {
        // Remplacer la valeur existante
        envContent = envContent.replace(keyRegex, `${key}=${value}`);
      } else {
        // Ajouter la nouvelle clé à la fin
        envContent += `\n${key}=${value}`;
      }
    } else {
      // Créer un nouveau fichier
      envContent = `# Configuration API pour le Tableau de Bord Européen de Cyclisme\n\n${key}=${value}\n`;
    }
    
    fs.writeFileSync(envPath, envContent);
    
    // Mettre à jour la variable d'environnement en cours d'exécution
    process.env[key] = value;
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du fichier .env: ${error.message}`);
  }
}

// Exécuter le programme
main().catch(error => {
  console.error(`Erreur lors de la configuration des clés API: ${error.message}`);
  rl.close();
  process.exit(1);
});
