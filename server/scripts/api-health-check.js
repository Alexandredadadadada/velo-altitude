#!/usr/bin/env node

/**
 * Script de vérification de l'état de santé des API
 * Ce script teste toutes les API utilisées par le tableau de bord et affiche leur état
 */

const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const Table = require('cli-table3');

// Charger les variables d'environnement
dotenv.config();

// Configuration des API à tester
const apiConfigs = [
  {
    name: 'OpenWeatherMap',
    test: async () => {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=48.8566&lon=2.3522&appid=${process.env.OPENWEATHERMAP_API_KEY}`
      );
      return {
        status: response.status,
        data: {
          city: response.data.name,
          weather: response.data.weather[0].main
        }
      };
    }
  },
  {
    name: 'OpenRouteService',
    test: async () => {
      const response = await axios.get(
        `https://api.openrouteservice.org/v2/directions/cycling-regular?api_key=${process.env.OPENROUTESERVICE_API_KEY}&start=8.681495,49.41461&end=8.687872,49.420318`
      );
      return {
        status: response.status,
        data: {
          distance: Math.round(response.data.routes[0].summary.distance) + ' m',
          duration: Math.round(response.data.routes[0].summary.duration / 60) + ' min'
        }
      };
    }
  },
  {
    name: 'Strava',
    test: async () => {
      const response = await axios.get('https://www.strava.com/api/v3/athlete', {
        headers: { 'Authorization': `Bearer ${process.env.STRAVA_ACCESS_TOKEN}` }
      });
      return {
        status: response.status,
        data: {
          athlete: response.data.firstname + ' ' + response.data.lastname,
          expires: new Date('2025-04-03T14:31:07Z').toLocaleDateString()
        }
      };
    }
  },
  {
    name: 'Mapbox',
    test: async () => {
      const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/Paris.json?access_token=${process.env.MAPBOX_ACCESS_TOKEN}`
      );
      return {
        status: response.status,
        data: {
          features: response.data.features.length,
          center: response.data.features[0].center.join(', ')
        }
      };
    }
  },
  {
    name: 'OpenAI',
    test: async () => {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', 
        {
          model: "gpt-3.5-turbo",
          messages: [{ role: "system", content: "Generate one cycling tip" }],
          max_tokens: 50
        },
        {
          headers: { 
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return {
        status: response.status,
        data: {
          model: response.data.model,
          response: response.data.choices[0].message.content.substring(0, 50) + '...'
        }
      };
    }
  },
  {
    name: 'Claude',
    test: async () => {
      const response = await axios.post('https://api.anthropic.com/v1/messages',
        {
          model: "claude-2",
          max_tokens: 50,
          messages: [{ role: "user", content: "Give me one cycling tip" }]
        },
        {
          headers: { 
            'x-api-key': process.env.CLAUDE_API_KEY,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
          }
        }
      );
      return {
        status: response.status,
        data: {
          model: "claude-2",
          response: response.data.content[0].text.substring(0, 50) + '...'
        }
      };
    }
  }
];

// Fonction principale
async function main() {
  console.log('\n=== État de Santé des API - Tableau de Bord Européen de Cyclisme ===\n');
  
  // Créer un tableau pour l'affichage des résultats
  const table = new Table({
    head: ['API', 'Statut', 'Latence', 'Détails'],
    colWidths: [20, 10, 10, 50]
  });
  
  // Tester chaque API
  for (const api of apiConfigs) {
    try {
      process.stdout.write(`Test de l'API ${api.name}... `);
      
      const startTime = Date.now();
      const result = await api.test();
      const latency = Date.now() - startTime;
      
      let status = '✅ OK';
      if (result.status !== 200) {
        status = `⚠️ ${result.status}`;
      }
      
      // Ajouter les résultats au tableau
      table.push([
        api.name,
        status,
        `${latency} ms`,
        JSON.stringify(result.data)
      ]);
      
      console.log(status);
      
      // Enregistrer les résultats pour monitoring
      logApiHealth(api.name, status === '✅ OK', latency, result);
      
    } catch (error) {
      table.push([
        api.name,
        '❌ Erreur',
        'N/A',
        error.message
      ]);
      
      console.log('❌ Erreur');
      
      // Enregistrer l'erreur pour monitoring
      logApiHealth(api.name, false, 0, { error: error.message });
    }
  }
  
  // Afficher le tableau récapitulatif
  console.log('\n' + table.toString() + '\n');
  
  console.log('Rapport de santé généré et sauvegardé dans logs/api-health.log');
}

// Fonction pour journaliser l'état de santé des API
function logApiHealth(apiName, isHealthy, latency, details) {
  try {
    const logPath = path.resolve(process.cwd(), 'logs/api-health.log');
    const logDir = path.dirname(logPath);
    
    // Créer le répertoire des logs s'il n'existe pas
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      api: apiName,
      healthy: isHealthy,
      latency,
      details
    };
    
    fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');
  } catch (error) {
    console.error(`Erreur lors de la journalisation de l'état de santé de l'API ${apiName}:`, error);
  }
}

// Exécuter le programme
main().catch(error => {
  console.error(`Erreur lors de la vérification de l'état des API:`, error);
  process.exit(1);
});
