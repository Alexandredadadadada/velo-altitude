// Fonction Netlify pour l'endpoint /api/nutrition/recipes
// Cette fonction gère les recettes nutritionnelles pour les cyclistes

const { MongoClient } = require('mongodb');
const fallbackRecipes = require('../../client/src/data/fallbackRecipes');

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
    const { 
      category, 
      mealType, 
      maxPrepTime, 
      dietary,
      page = 1, 
      limit = 20 
    } = params;
    
    // Construire le filtre
    let filter = {};
    
    if (category) filter.category = category;
    if (mealType) filter.mealType = mealType;
    if (maxPrepTime) filter.prepTime = { $lte: parseInt(maxPrepTime) };
    if (dietary) {
      if (Array.isArray(dietary)) {
        filter.dietaryTags = { $all: dietary };
      } else {
        filter.dietaryTags = dietary;
      }
    }
    
    // Connexion à la base de données
    const db = await mongoConnect();
    const recipesCollection = db.collection('nutrition_recipes');
    
    // Calculer le skip pour la pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Récupérer les recettes
    const recipes = await recipesCollection
      .find(filter)
      .sort({ popularity: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();
      
    // Compter le total pour la pagination
    const total = await recipesCollection.countDocuments(filter);
    
    // Renvoyer les résultats
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        recipes,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      })
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des recettes:", error);
    
    // En cas d'erreur, utiliser les données de fallback
    return {
      statusCode: 200, // Retourner 200 même en cas d'erreur pour ne pas bloquer l'UI
      headers,
      body: JSON.stringify({
        recipes: fallbackRecipes,
        pagination: {
          total: fallbackRecipes.length,
          page: 1,
          limit: fallbackRecipes.length,
          pages: 1
        }
      })
    };
  }
};
