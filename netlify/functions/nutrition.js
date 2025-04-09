/**
 * Fonction Netlify pour le service de nutrition
 * Utilise le service nutritionService refactorisé qui utilise RealApiOrchestrator
 */

const { MongoClient } = require('mongodb');
const { RealApiOrchestrator } = require('../../src/api/orchestration/RealApiOrchestrator');

// Configuration de la connexion MongoDB
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DBNAME || 'velo-altitude';

// Cache d'instances
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
    console.log('📦 Connexion MongoDB établie pour le service de nutrition');
  }
  
  const db = mongoClient.db(dbName);
  
  if (!apiOrchestrator) {
    apiOrchestrator = new RealApiOrchestrator({
      db,
      collections: {
        nutrition: db.collection('nutrition'),
        users: db.collection('users')
      }
    });
    console.log('🍎 Service de nutrition initialisé');
  }
  
  return { db, apiOrchestrator };
}

// Fonction principale pour le traitement des requêtes
exports.handler = async (event, context) => {
  // Optimisation: rendre la fonction persistante entre les invocations
  context.callbackWaitsForEmptyEventLoop = false;
  
  try {
    // Extraire le chemin et la méthode de la requête
    const path = event.path.replace('/api/nutrition', '').replace(/^\/+/, '');
    const method = event.httpMethod;
    
    // Initialiser les services
    const { apiOrchestrator } = await initServices();
    
    // Traiter la requête en fonction du chemin et de la méthode
    let result;
    
    if (method === 'GET') {
      if (path === '/recommendations') {
        // Obtenir des recommandations nutritionnelles pour un parcours
        const { routeId, userId, intensity } = event.queryStringParameters || {};
        result = await apiOrchestrator.getNutritionRecommendations(routeId, userId, intensity);
      } else if (path === '/products') {
        // Obtenir la liste des produits nutritionnels
        const { category, sort } = event.queryStringParameters || {};
        result = await apiOrchestrator.getNutritionProducts(category, sort);
      } else if (path.match(/^\/products\/[a-zA-Z0-9-]+$/)) {
        // Obtenir un produit nutritionnel spécifique
        const productId = path.split('/')[2];
        result = await apiOrchestrator.getNutritionProductById(productId);
      } else if (path === '/user-plan') {
        // Obtenir le plan nutritionnel d'un utilisateur
        const userId = event.headers.authorization?.split(' ')[1]; // Extrait du token
        result = await apiOrchestrator.getUserNutritionPlan(userId);
      }
    } else if (method === 'POST') {
      if (path === '/user-plan') {
        // Créer ou mettre à jour le plan nutritionnel d'un utilisateur
        const userId = event.headers.authorization?.split(' ')[1]; // Extrait du token
        const planData = JSON.parse(event.body);
        result = await apiOrchestrator.updateUserNutritionPlan(userId, planData);
      } else if (path === '/calculate') {
        // Calculer les besoins nutritionnels pour un parcours spécifique
        const { weight, height, age, gender, activityLevel, routeId } = JSON.parse(event.body);
        result = await apiOrchestrator.calculateNutritionNeeds({
          weight, height, age, gender, activityLevel, routeId
        });
      }
    }
    
    // Si aucune route ne correspond, retourner une erreur 404
    if (!result) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Route nutrition non trouvée' })
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
    console.error('❌ Erreur API Nutrition:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Erreur interne du service de nutrition',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Une erreur est survenue'
      })
    };
  }
};
