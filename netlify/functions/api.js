/**
 * Fonction principale d'API pour Velo-Altitude
 * Utilise toutes les variables d'environnement déjà configurées sur Netlify
 */

const { MongoClient } = require('mongodb');

// Configuration de la connexion MongoDB
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'velo-altitude';

// Cache d'instances pour optimiser les performances
let mongoClient = null;
let db = null;

// Fonction d'initialisation des services
async function initServices() {
  if (!mongoClient) {
    mongoClient = new MongoClient(uri, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true,
      maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10'),
      minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE || '5')
    });
    await mongoClient.connect();
    console.log(' Connexion MongoDB établie');
  }
  
  if (!db) {
    db = mongoClient.db(dbName);
    console.log(` Base de données "${dbName}" sélectionnée`);
  }
  
  return { db };
}

// Routage des requêtes API
async function routeApiRequest(event, db) {
  const path = event.path.replace(/^\/?api\//, '');
  const method = event.httpMethod;
  const params = event.queryStringParameters || {};
  const body = event.body ? JSON.parse(event.body) : {};
  
  console.log(` Requête API reçue: ${method} ${path}`);
  
  // Gestion des cols alpins
  if (path.startsWith('cols')) {
    return handleColsRequest(path.replace(/^cols\/?/, ''), method, params, body, db);
  }
  
  // Gestion de la météo
  if (path.startsWith('weather')) {
    return handleWeatherRequest(path.replace(/^weather\/?/, ''), method, params, body, db);
  }
  
  // Gestion des défis
  if (path.startsWith('challenges')) {
    return handleChallengesRequest(path.replace(/^challenges\/?/, ''), method, params, body, db);
  }
  
  // Gestion de la nutrition
  if (path.startsWith('nutrition')) {
    return handleNutritionRequest(path.replace(/^nutrition\/?/, ''), method, params, body, db);
  }
  
  // Si aucune route ne correspond
  if (path === '' || path === '/') {
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: 'online',
        timestamp: new Date().toISOString(),
        services: {
          cols: '/api/cols',
          weather: '/api/weather',
          nutrition: '/api/nutrition',
          challenges: '/api/challenges'
        }
      })
    };
  }
  
  return {
    statusCode: 404,
    body: JSON.stringify({ error: 'Route non trouvée' })
  };
}

// Gestionnaire des requêtes sur les cols alpins
async function handleColsRequest(path, method, params, body, db) {
  const colsCollection = db.collection('cols');
  
  if (method === 'GET') {
    if (path === '' || path === '/') {
      // Liste des cols (avec pagination)
      const page = parseInt(params.page || '1');
      const limit = parseInt(params.limit || '10');
      const skip = (page - 1) * limit;
      
      const cols = await colsCollection.find({})
        .skip(skip)
        .limit(limit)
        .toArray();
      
      const total = await colsCollection.countDocuments({});
      
      return {
        statusCode: 200,
        body: JSON.stringify({
          data: cols,
          pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit)
          }
        })
      };
    } else if (path.match(/^[a-zA-Z0-9-]+$/)) {
      // Détails d'un col spécifique
      const colId = path;
      const col = await colsCollection.findOne({ 
        $or: [
          { _id: colId },
          { slug: colId },
          { name: { $regex: new RegExp(`^${colId}$`, 'i') } }
        ]
      });
      
      if (!col) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Col non trouvé' })
        };
      }
      
      return {
        statusCode: 200,
        body: JSON.stringify(col)
      };
    } else if (path === 'search') {
      // Recherche de cols avec filtres
      const { elevation, difficulty, region } = params;
      const query = {};
      
      if (elevation) {
        const [min, max] = elevation.split('-').map(Number);
        query.elevation = { $gte: min || 0 };
        if (max) query.elevation.$lte = max;
      }
      
      if (difficulty) {
        query.difficulty = difficulty;
      }
      
      if (region) {
        query.region = { $regex: new RegExp(region, 'i') };
      }
      
      const cols = await colsCollection.find(query)
        .limit(20)
        .toArray();
      
      return {
        statusCode: 200,
        body: JSON.stringify(cols)
      };
    }
  }
  
  return {
    statusCode: 501,
    body: JSON.stringify({ error: 'Fonctionnalité non implémentée' })
  };
}

// Gestionnaire des requêtes météo
async function handleWeatherRequest(path, method, params, body, db) {
  // Utiliser l'API OpenWeather avec la clé déjà configurée
  const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
  
  if (method === 'GET') {
    if (path === 'current') {
      // Obtenir la météo actuelle pour une localisation
      const { lat, lon } = params;
      
      if (!lat || !lon) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Latitude et longitude requises' })
        };
      }
      
      try {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
        );
        
        const data = await response.json();
        
        // Enregistrer dans la base de données pour le cache
        await db.collection('weather_cache').updateOne(
          { lat, lon, type: 'current' },
          { 
            $set: {
              data,
              timestamp: new Date()
            }
          },
          { upsert: true }
        );
        
        return {
          statusCode: 200,
          body: JSON.stringify(data)
        };
      } catch (error) {
        console.error('Erreur API météo:', error);
        
        // Essayer de récupérer depuis le cache
        const cachedData = await db.collection('weather_cache').findOne({
          lat, lon, type: 'current'
        });
        
        if (cachedData) {
          return {
            statusCode: 200,
            body: JSON.stringify({
              ...cachedData.data,
              fromCache: true,
              cachedAt: cachedData.timestamp
            })
          };
        }
        
        return {
          statusCode: 500,
          body: JSON.stringify({ 
            error: 'Erreur lors de la récupération des données météo',
            message: error.message
          })
        };
      }
    }
  }
  
  return {
    statusCode: 501,
    body: JSON.stringify({ error: 'Fonctionnalité non implémentée' })
  };
}

// Gestionnaire des requêtes de défis
async function handleChallengesRequest(path, method, params, body, db) {
  const challengesCollection = db.collection('challenges');
  
  if (method === 'GET') {
    if (path === '' || path === '/') {
      // Liste de tous les défis
      const challenges = await challengesCollection.find({}).toArray();
      
      return {
        statusCode: 200,
        body: JSON.stringify(challenges)
      };
    } else if (path.match(/^[a-zA-Z0-9-]+$/)) {
      // Détails d'un défi spécifique
      const challengeId = path;
      const challenge = await challengesCollection.findOne({ 
        $or: [
          { _id: challengeId },
          { slug: challengeId },
          { name: { $regex: new RegExp(`^${challengeId}$`, 'i') } }
        ]
      });
      
      if (!challenge) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Défi non trouvé' })
        };
      }
      
      return {
        statusCode: 200,
        body: JSON.stringify(challenge)
      };
    }
  }
  
  return {
    statusCode: 501,
    body: JSON.stringify({ error: 'Fonctionnalité non implémentée' })
  };
}

// Gestionnaire des requêtes de nutrition
async function handleNutritionRequest(path, method, params, body, db) {
  if (method === 'GET') {
    if (path === 'recommendations') {
      // Calcul des recommandations nutritionnelles basées sur l'effort
      const { routeId, intensity } = params;
      
      // Logique simplifiée pour les recommandations
      const recommendations = {
        beforeRide: [
          { type: 'carbohydrates', amount: '60-90g', foods: ['oatmeal', 'banana', 'toast with honey'] },
          { type: 'protein', amount: '15-20g', foods: ['yogurt', 'eggs'] },
          { type: 'fat', amount: '10-15g', foods: ['nuts', 'avocado'] }
        ],
        duringRide: [
          { type: 'carbohydrates', amount: '30-60g per hour', foods: ['energy gels', 'sports drinks', 'bananas'] },
          { type: 'electrolytes', amount: '500-750mg sodium per hour', foods: ['sports drinks', 'electrolyte tablets'] }
        ],
        afterRide: [
          { type: 'protein', amount: '20-25g', foods: ['protein shake', 'chicken', 'fish'] },
          { type: 'carbohydrates', amount: '1g per kg body weight', foods: ['rice', 'potatoes', 'pasta'] }
        ]
      };
      
      return {
        statusCode: 200,
        body: JSON.stringify(recommendations)
      };
    }
  }
  
  return {
    statusCode: 501,
    body: JSON.stringify({ error: 'Fonctionnalité non implémentée' })
  };
}

// Fonction principale
exports.handler = async (event, context) => {
  // Optimisation: maintenir la connexion entre les invocations
  context.callbackWaitsForEmptyEventLoop = false;
  
  try {
    // Initialiser les services
    const { db } = await initServices();
    
    // Router la requête vers le gestionnaire approprié
    const result = await routeApiRequest(event, db);
    
    return {
      ...result,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      },
    };
  } catch (error) {
    console.error(' Erreur API:', error);
    
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
