// Fonction Netlify pour l'endpoint /api/routes/featured
// Cette fonction remplace l'API backend existante

const { MongoClient } = require('mongodb');
const fallbackRoutes = require('../../client/src/data/fallbackRoutes');

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
    // Connexion à la base de données
    const db = await mongoConnect();
    const routesCollection = db.collection('routes');
    
    // Récupération des parcours en vedette
    const featuredRoutes = await routesCollection
      .find({ featured: true })
      .sort({ popularity: -1 })
      .limit(6)
      .toArray();

    // Renvoyer les résultats
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(featuredRoutes)
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des parcours:", error);
    
    // En cas d'erreur, utiliser les données de fallback
    return {
      statusCode: 200, // Retourner 200 même en cas d'erreur pour ne pas bloquer l'UI
      headers,
      body: JSON.stringify(fallbackRoutes)
    };
  }
};
