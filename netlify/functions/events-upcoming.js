// Fonction Netlify pour l'endpoint /api/events/upcoming
// Cette fonction remplace l'API backend existante pour les événements à venir

const { MongoClient } = require('mongodb');
const fallbackEvents = require('../../client/src/data/fallbackEvents');

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
    // Date actuelle pour filtrer les événements passés
    const today = new Date();
    
    // Connexion à la base de données
    const db = await mongoConnect();
    const eventsCollection = db.collection('events');
    
    // Récupération des événements à venir
    const upcomingEvents = await eventsCollection
      .find({ 
        date: { $gte: today } 
      })
      .sort({ date: 1 })
      .limit(6)
      .toArray();

    // Renvoyer les résultats
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(upcomingEvents)
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des événements:", error);
    
    // En cas d'erreur, utiliser les données de fallback
    return {
      statusCode: 200, // Retourner 200 même en cas d'erreur pour ne pas bloquer l'UI
      headers,
      body: JSON.stringify(fallbackEvents)
    };
  }
};
