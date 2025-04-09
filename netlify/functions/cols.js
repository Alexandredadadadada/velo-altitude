/**
 * Fonction Netlify spécifique pour l'API des cols alpins
 * Utilise les services existants (client/src/services/colService.ts et src/api/orchestration/services/cols.ts)
 */

const { MongoClient } = require('mongodb');
const { RealApiOrchestrator } = require('../../src/api/orchestration/RealApiOrchestrator');

// Configuration de la connexion MongoDB (où les 50 cols alpins sont déjà importés)
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
    console.log('📦 Connexion MongoDB établie pour le service des cols');
  }
  
  const db = mongoClient.db(dbName);
  
  if (!apiOrchestrator) {
    apiOrchestrator = new RealApiOrchestrator({
      db,
      collections: {
        cols: db.collection('cols')
      }
    });
    console.log('🏔️ Service des cols initialisé');
  }
  
  return { db, apiOrchestrator };
}

// Fonction principale pour le traitement des requêtes
exports.handler = async (event, context) => {
  // Optimisation: rendre la fonction persistante entre les invocations
  context.callbackWaitsForEmptyEventLoop = false;
  
  try {
    // Extraire le chemin et la méthode de la requête
    const path = event.path.replace('/api/cols', '').replace(/^\/+/, '');
    const method = event.httpMethod;
    
    // Initialiser les services
    const { apiOrchestrator } = await initServices();
    
    // Traiter la requête en fonction du chemin et de la méthode
    let result;
    
    if (method === 'GET') {
      if (path === '' || path === '/') {
        // Obtenir tous les cols (avec pagination si nécessaire)
        const page = event.queryStringParameters?.page || 1;
        const limit = event.queryStringParameters?.limit || 10;
        result = await apiOrchestrator.getCols({ page, limit });
      } else if (path.match(/^\/[a-zA-Z0-9-]+$/)) {
        // Obtenir un col spécifique par son ID ou slug
        const colId = path.substring(1);
        result = await apiOrchestrator.getColById(colId);
      } else if (path === '/search') {
        // Recherche de cols avec filtres
        const { elevation, difficulty, region } = event.queryStringParameters || {};
        result = await apiOrchestrator.searchCols({ elevation, difficulty, region });
      } else if (path === '/3d') {
        // Données 3D pour les visualisations
        const colId = event.queryStringParameters?.id;
        result = await apiOrchestrator.get3DDataForCol(colId);
      }
    } else if (method === 'POST' && path === '/favorite') {
      // Ajouter un col aux favoris de l'utilisateur
      const userId = event.headers.authorization?.split(' ')[1]; // Extrait du token
      const { colId } = JSON.parse(event.body);
      result = await apiOrchestrator.addFavoriteCol(userId, colId);
    }
    
    // Si aucune route ne correspond, retourner une erreur 404
    if (!result) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Route non trouvée' })
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
    console.error('❌ Erreur API Cols:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Erreur interne du service des cols',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Une erreur est survenue'
      })
    };
  }
};
