// Fonction Netlify pour l'endpoint /api/news/latest
// Cette fonction récupère les actualités récentes pour la page d'accueil

const { MongoClient } = require('mongodb');
const fallbackNews = require('../../client/src/data/fallbackNews');

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
    // Paramètres pour limiter le nombre d'actualités
    const limit = event.queryStringParameters?.limit || 4;
    
    // Connexion à la base de données
    const db = await mongoConnect();
    const newsCollection = db.collection('news');
    
    // Récupération des actualités récentes
    const latestNews = await newsCollection
      .find({})
      .sort({ publishedAt: -1 })
      .limit(parseInt(limit))
      .toArray();

    // Renvoyer les résultats
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(latestNews)
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des actualités:", error);
    
    // En cas d'erreur, utiliser les données de fallback
    return {
      statusCode: 200, // Retourner 200 même en cas d'erreur pour ne pas bloquer l'UI
      headers,
      body: JSON.stringify(fallbackNews)
    };
  }
};
