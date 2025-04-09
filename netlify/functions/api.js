/**
 * Fonction principale d'API pour Velo-Altitude
 * Gère les requêtes API et les achemine vers les orchestrateurs appropriés
 */

const { MongoClient } = require('mongodb');
const { APIGateway } = require('../../src/api/orchestration/APIGateway');
const { RealApiOrchestrator } = require('../../src/api/orchestration/RealApiOrchestrator');

// Configuration de la connexion MongoDB
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DBNAME || 'velo-altitude';

// Cache d'instances pour optimiser les performances
let mongoClient = null;
let apiOrchestrator = null;

// Fonction d'initialisation des services
async function initServices() {
  if (!mongoClient) {
    mongoClient = new MongoClient(uri, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
    await mongoClient.connect();
    console.log('📦 Connexion MongoDB établie');
  }
  
  const db = mongoClient.db(dbName);
  
  if (!apiOrchestrator) {
    apiOrchestrator = new RealApiOrchestrator({
      db,
      collections: {
        cols: db.collection('cols'),
        challenges: db.collection('challenges'),
        users: db.collection('users'),
        routes: db.collection('routes'),
        nutrition: db.collection('nutrition'),
        weather: db.collection('weather')
      }
    });
    console.log('🔌 API Orchestrator initialisé');
  }
  
  return { db, apiOrchestrator };
}

// Fonction principale pour le traitement des requêtes
exports.handler = async (event, context) => {
  // Optimisation: rendre la fonction persistante entre les invocations
  context.callbackWaitsForEmptyEventLoop = false;
  
  try {
    // Initialiser les services
    const { apiOrchestrator } = await initServices();
    
    // Créer la passerelle API
    const apiGateway = new APIGateway({
      orchestrator: apiOrchestrator,
      event,
      context
    });
    
    // Router la requête vers le gestionnaire approprié
    const response = await apiGateway.routeRequest();
    
    return {
      statusCode: response.statusCode || 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      },
      body: JSON.stringify(response.body || {})
    };
  } catch (error) {
    console.error('❌ Erreur API:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Erreur interne du serveur',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Une erreur est survenue'
      })
    };
  }
};
