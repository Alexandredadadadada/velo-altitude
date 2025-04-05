// Fonction Netlify pour l'endpoint /api/cols/list
// Cette fonction fournit la liste des cols cyclistes

const { MongoClient } = require('mongodb');
const fallbackCols = require('../../client/src/data/fallbackCols');

// Connexion à MongoDB Atlas
const mongoConnect = async () => {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
  });
  
  try {
    await client.connect();
    return client.db("dashboard-velo");
  } catch (error) {
    console.error("Erreur de connexion MongoDB:", error);
    throw error;
  }
};

exports.handler = async (event, context) => {
  // Configuration CORS
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  // Gestion des requêtes OPTIONS (CORS preflight)
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: "CORS enabled" })
    };
  }

  try {
    // Extraire les paramètres de requête
    const params = event.queryStringParameters || {};
    const { region, difficulty, minAltitude, maxAltitude, page = 1, limit = 20 } = params;
    
    // Construire le filtre
    let filter = {};
    
    if (region) filter.region = region;
    if (difficulty) filter.difficulty = parseInt(difficulty);
    
    // Filtrer par altitude
    if (minAltitude || maxAltitude) {
      filter.altitude = {};
      if (minAltitude) filter.altitude.$gte = parseInt(minAltitude);
      if (maxAltitude) filter.altitude.$lte = parseInt(maxAltitude);
    }
    
    // Connexion à la base de données
    const db = await mongoConnect();
    const colsCollection = db.collection('cols');
    
    // Calculer le skip pour la pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Récupérer les cols
    const cols = await colsCollection
      .find(filter)
      .sort({ popularity: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();
      
    // Compter le total pour la pagination
    const total = await colsCollection.countDocuments(filter);
    
    // Renvoyer les résultats
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        cols,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      })
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des cols:", error);
    
    // En cas d'erreur, utiliser les données de fallback
    return {
      statusCode: 200, // Retourner 200 même en cas d'erreur pour ne pas bloquer l'UI
      headers,
      body: JSON.stringify({
        cols: fallbackCols,
        pagination: {
          total: fallbackCols.length,
          page: 1,
          limit: fallbackCols.length,
          pages: 1
        }
      })
    };
  }
};
