/**
 * Fonction Netlify pour le service météo
 * Utilise les services existants de météo implémentés dans le projet
 * (client/src/services/weather.service.js, server/services/weather.service.js, etc.)
 */

const { MongoClient } = require('mongodb');
const { RealApiOrchestrator } = require('../../src/api/orchestration/RealApiOrchestrator');
const { UnifiedWeatherService } = require('../../src/services/weather');

// Clé API OpenWeather
const OPENWEATHER_API_KEY = process.env.REACT_APP_OPENWEATHER_API_KEY;

// Configuration de la connexion MongoDB
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DBNAME || 'velo-altitude';

// Cache d'instances
let mongoClient = null;
let apiOrchestrator = null;
let weatherService = null;

// Fonction d'initialisation des services
async function initServices() {
  if (!mongoClient) {
    mongoClient = new MongoClient(uri, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
    await mongoClient.connect();
    console.log('📦 Connexion MongoDB établie pour le service météo');
  }
  
  const db = mongoClient.db(dbName);
  
  if (!apiOrchestrator) {
    apiOrchestrator = new RealApiOrchestrator({
      db,
      collections: {
        cols: db.collection('cols'),
        weather: db.collection('weather')
      }
    });
    console.log('🔌 API Orchestrator initialisé pour la météo');
  }
  
  if (!weatherService) {
    weatherService = new UnifiedWeatherService({
      apiKey: OPENWEATHER_API_KEY,
      cacheEnabled: true,
      cacheDuration: 3600, // 1 heure
      db: db,
      apiOrchestrator
    });
    console.log('☁️ Service météo unifié initialisé');
  }
  
  return { db, apiOrchestrator, weatherService };
}

// Fonction principale pour le traitement des requêtes
exports.handler = async (event, context) => {
  // Optimisation: rendre la fonction persistante entre les invocations
  context.callbackWaitsForEmptyEventLoop = false;
  
  try {
    // Extraire le chemin et la méthode de la requête
    const path = event.path.replace('/api/weather', '').replace(/^\/+/, '');
    const method = event.httpMethod;
    
    // Initialiser les services
    const { weatherService } = await initServices();
    
    // Traiter la requête en fonction du chemin et de la méthode
    let result;
    
    if (method === 'GET') {
      if (path === '/current') {
        // Obtenir les conditions météo actuelles pour une localisation
        const { lat, lon } = event.queryStringParameters || {};
        result = await weatherService.getCurrentWeather(lat, lon);
      } else if (path === '/forecast') {
        // Obtenir les prévisions météo pour une localisation
        const { lat, lon, days } = event.queryStringParameters || {};
        result = await weatherService.getWeatherForecast(lat, lon, days || 5);
      } else if (path === '/col') {
        // Obtenir la météo pour un col spécifique
        const { colId } = event.queryStringParameters || {};
        result = await weatherService.getWeatherForCol(colId);
      } else if (path === '/recommendations') {
        // Obtenir des recommandations pour le cyclisme basées sur la météo
        const { lat, lon } = event.queryStringParameters || {};
        result = await weatherService.getCyclingRecommendations(lat, lon);
      } else if (path === '/alerts') {
        // Obtenir les alertes météo pour une région
        const { region } = event.queryStringParameters || {};
        result = await weatherService.getWeatherAlerts(region);
      }
    }
    
    // Si aucune route ne correspond, retourner une erreur 404
    if (!result) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Route météo non trouvée' })
      };
    }
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      },
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('❌ Erreur API Météo:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Erreur interne du service météo',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Une erreur est survenue'
      })
    };
  }
};
