const fs = require('fs');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Charger les variables d'environnement
dotenv.config();

// Définir les API à auditer
const APIs = [
  {
    name: 'OpenWeatherMap',
    envVar: 'OPENWEATHER_API_KEY',
    testEndpoint: 'https://api.openweathermap.org/data/2.5/weather',
    testParams: { q: 'Paris', appid: process.env.OPENWEATHER_API_KEY },
    quotaInfo: 'https://openweathermap.org/price'
  },
  {
    name: 'OpenRouteService',
    envVar: 'OPENROUTE_API_KEY',
    testEndpoint: 'https://api.openrouteservice.org/v2/directions/cycling-regular',
    testParams: { 
      api_key: process.env.OPENROUTE_API_KEY,
      start: '8.681495,49.41461',
      end: '8.687872,49.420318'
    },
    quotaInfo: 'https://openrouteservice.org/plans/'
  },
  {
    name: 'Strava',
    envVar: 'STRAVA_ACCESS_TOKEN',
    testEndpoint: 'https://www.strava.com/api/v3/athlete',
    testHeaders: { 'Authorization': `Bearer ${process.env.STRAVA_ACCESS_TOKEN}` },
    refreshToken: process.env.STRAVA_REFRESH_TOKEN,
    clientId: process.env.STRAVA_CLIENT_ID,
    clientSecret: process.env.STRAVA_CLIENT_SECRET,
    quotaInfo: '200 requests every 15 minutes, 2,000 daily'
  },
  {
    name: 'Mapbox',
    envVar: 'MAPBOX_ACCESS_TOKEN',
    testEndpoint: 'https://api.mapbox.com/geocoding/v5/mapbox.places/Paris.json',
    testParams: { access_token: process.env.MAPBOX_ACCESS_TOKEN },
    quotaInfo: 'https://www.mapbox.com/pricing/'
  },
  {
    name: 'OpenAI',
    envVar: 'OPENAI_API_KEY',
    testEndpoint: 'https://api.openai.com/v1/chat/completions',
    testMethod: 'post',
    testHeaders: { 
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    testData: {
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Hello" }],
      max_tokens: 5
    },
    quotaInfo: 'Based on usage, check dashboard'
  },
  {
    name: 'Claude',
    envVar: 'CLAUDE_API_KEY',
    testEndpoint: 'https://api.anthropic.com/v1/messages',
    testMethod: 'post',
    testHeaders: { 
      'x-api-key': process.env.CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    testData: {
      model: "claude-3-opus-20240229",
      max_tokens: 10,
      messages: [{ role: "user", content: "Hello" }]
    },
    quotaInfo: 'Based on usage, check dashboard'
  }
];

// Fonction principale d'audit
async function auditApiKeys() {
  console.log('Démarrage de l\'audit des clés API...\n');
  
  const results = {
    valid: [],
    invalid: [],
    missing: []
  };
  
  // Vérifier si le fichier .env existe
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    console.error('Fichier .env non trouvé. Création d\'un nouveau fichier...');
    fs.writeFileSync(envPath, '# API Keys for European Cycling Dashboard\n\n');
  }
  
  // Lire le contenu actuel du fichier .env
  let envContent = fs.readFileSync(envPath, 'utf8');
  let envUpdated = false;
  
  // Tester chaque API
  for (const api of APIs) {
    console.log(`Vérification de l'API ${api.name}...`);
    
    // Vérifier si la clé API est définie
    if (!process.env[api.envVar] && !api.apiKey) {
      console.log(`❌ Clé API ${api.name} manquante (${api.envVar})`);
      results.missing.push(api.name);
      
      // Si une clé est fournie directement dans la configuration
      if (api.apiKey) {
        console.log(`✅ Ajout de la clé ${api.name} au fichier .env`);
        envContent += `\n${api.envVar}=${api.apiKey}`;
        envUpdated = true;
      }
      continue;
    }
    
    // Utiliser la clé API fournie si disponible
    const apiKey = api.apiKey || process.env[api.envVar];
    
    try {
      let response;
      
      // Effectuer la requête de test
      if (api.testMethod === 'post') {
        response = await axios.post(api.testEndpoint, api.testData, { headers: api.testHeaders });
      } else {
        response = await axios.get(api.testEndpoint, { 
          params: api.testParams,
          headers: api.testHeaders
        });
      }
      
      console.log(`✅ API ${api.name} valide (statut: ${response.status})`);
      
      // Extraire les informations de quota si disponibles
      let quotaInfo = '';
      if (response.headers['x-ratelimit-limit']) {
        quotaInfo = `Limite: ${response.headers['x-ratelimit-limit']}, Restant: ${response.headers['x-ratelimit-remaining']}`;
      } else {
        quotaInfo = api.quotaInfo || 'Information de quota non disponible';
      }
      
      results.valid.push({
        name: api.name,
        status: response.status,
        quota: quotaInfo
      });
      
      // Si la clé n'est pas dans le fichier .env mais fournie dans la configuration
      if (api.apiKey && !process.env[api.envVar]) {
        console.log(`✅ Ajout de la clé ${api.name} au fichier .env`);
        envContent += `\n${api.envVar}=${api.apiKey}`;
        envUpdated = true;
      }
    } catch (error) {
      console.log(`❌ API ${api.name} invalide: ${error.message}`);
      results.invalid.push({
        name: api.name,
        error: error.message,
        response: error.response?.data
      });
    }
  }
  
  // Mettre à jour le fichier .env si nécessaire
  if (envUpdated) {
    fs.writeFileSync(envPath, envContent);
    console.log('\nFichier .env mis à jour avec les nouvelles clés API');
  }
  
  // Générer le rapport d'audit
  generateAuditReport(results);
  
  return results;
}

// Fonction pour générer un rapport d'audit
function generateAuditReport(results) {
  const reportPath = path.resolve(process.cwd(), 'api-audit-report.md');
  
  let reportContent = `# Rapport d'Audit des API - ${new Date().toLocaleString()}\n\n`;
  
  // APIs valides
  reportContent += `## APIs Valides (${results.valid.length})\n\n`;
  if (results.valid.length > 0) {
    reportContent += `| API | Statut | Quota |\n|-----|--------|-------|\n`;
    results.valid.forEach(api => {
      reportContent += `| ${api.name} | ${api.status} | ${api.quota} |\n`;
    });
  } else {
    reportContent += `Aucune API valide trouvée.\n`;
  }
  
  // APIs invalides
  reportContent += `\n## APIs Invalides (${results.invalid.length})\n\n`;
  if (results.invalid.length > 0) {
    reportContent += `| API | Erreur |\n|-----|-------|\n`;
    results.invalid.forEach(api => {
      reportContent += `| ${api.name} | ${api.error} |\n`;
    });
  } else {
    reportContent += `Aucune API invalide trouvée.\n`;
  }
  
  // APIs manquantes
  reportContent += `\n## APIs Manquantes (${results.missing.length})\n\n`;
  if (results.missing.length > 0) {
    reportContent += `- ${results.missing.join('\n- ')}\n`;
  } else {
    reportContent += `Aucune API manquante.\n`;
  }
  
  // Recommandations
  reportContent += `\n## Recommandations\n\n`;
  
  if (results.invalid.length > 0) {
    reportContent += `- Vérifier et mettre à jour les clés API invalides: ${results.invalid.map(api => api.name).join(', ')}\n`;
  }
  
  if (results.missing.length > 0) {
    reportContent += `- Obtenir des clés API pour les services manquants: ${results.missing.join(', ')}\n`;
  }
  
  if (results.valid.length > 0) {
    reportContent += `- Configurer le monitoring pour surveiller l'utilisation des quotas\n`;
    reportContent += `- Mettre en place un système de rotation des clés API pour les services à forte utilisation\n`;
  }
  
  fs.writeFileSync(reportPath, reportContent);
  console.log(`\nRapport d'audit généré: ${reportPath}`);
}

module.exports = { auditApiKeys, APIs };

// Exécuter l'audit si appelé directement
if (require.main === module) {
  auditApiKeys().catch(error => {
    console.error('Erreur lors de l\'audit:', error);
  });
}
