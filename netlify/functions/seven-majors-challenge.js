// Fonction Netlify pour l'endpoint /api/challenges/seven-majors
// Cette fonction gère le Défi des 7 Majeurs

const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

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

// Vérifier l'authentification de l'utilisateur
const verifyToken = (token) => {
  try {
    if (!token) return null;
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error("Erreur de vérification du token:", error);
    return null;
  }
};

// Récupérer les défis prédéfinis
const getPredefinedChallenges = async (db) => {
  try {
    const challengesCollection = db.collection('predefined_challenges');
    return await challengesCollection.find({}).toArray();
  } catch (error) {
    console.error("Erreur lors de la récupération des défis prédéfinis:", error);
    throw error;
  }
};

// Récupérer les défis sauvegardés d'un utilisateur
const getUserChallenges = async (db, userId) => {
  try {
    const userChallengesCollection = db.collection('user_challenges');
    return await userChallengesCollection.find({ userId }).toArray();
  } catch (error) {
    console.error("Erreur lors de la récupération des défis utilisateur:", error);
    throw error;
  }
};

// Sauvegarder un défi personnalisé
const saveUserChallenge = async (db, userId, challenge) => {
  try {
    const userChallengesCollection = db.collection('user_challenges');
    
    const newChallenge = {
      ...challenge,
      userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await userChallengesCollection.insertOne(newChallenge);
    return { ...newChallenge, _id: result.insertedId };
  } catch (error) {
    console.error("Erreur lors de la sauvegarde du défi utilisateur:", error);
    throw error;
  }
};

// Obtenir des recommandations basées sur les cols déjà sélectionnés
const getRecommendations = async (db, selectedColIds) => {
  try {
    // Si aucun col n'est sélectionné, retourner les cols les plus populaires
    if (!selectedColIds || selectedColIds.length === 0) {
      const colsCollection = db.collection('cols');
      return await colsCollection.find({})
        .sort({ popularity: -1 })
        .limit(7)
        .toArray();
    }
    
    // Récupérer les cols déjà sélectionnés
    const colsCollection = db.collection('cols');
    const selectedCols = await colsCollection.find({
      _id: { $in: selectedColIds.map(id => new ObjectId(id)) }
    }).toArray();
    
    // Calculer les caractéristiques moyennes des cols sélectionnés
    const avgDifficulty = selectedCols.reduce((sum, col) => sum + col.difficulty, 0) / selectedCols.length;
    const avgAltitude = selectedCols.reduce((sum, col) => sum + col.altitude, 0) / selectedCols.length;
    
    // Trouver des régions différentes de celles déjà sélectionnées
    const selectedRegions = new Set(selectedCols.map(col => col.region));
    
    // Trouver des cols similaires mais dans des régions différentes
    const recommendations = await colsCollection.find({
      _id: { $nin: selectedColIds.map(id => new ObjectId(id)) },
      difficulty: { $gte: avgDifficulty - 1, $lte: avgDifficulty + 1 },
      altitude: { $gte: avgAltitude * 0.7, $lte: avgAltitude * 1.3 }
    })
    .sort({ popularity: -1 })
    .limit(10)
    .toArray();
    
    // Prioriser les cols de régions différentes
    const sortedRecommendations = recommendations.sort((a, b) => {
      const aInSelectedRegion = selectedRegions.has(a.region) ? 1 : 0;
      const bInSelectedRegion = selectedRegions.has(b.region) ? 1 : 0;
      return aInSelectedRegion - bInSelectedRegion;
    });
    
    return sortedRecommendations.slice(0, 7);
  } catch (error) {
    console.error("Erreur lors de la génération des recommandations:", error);
    throw error;
  }
};

exports.handler = async (event, context) => {
  // Configuration CORS
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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
    // Extraire le token d'authentification
    const authHeader = event.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;
    
    // Vérifier l'authentification
    const decodedToken = verifyToken(token);
    const userId = decodedToken ? decodedToken.sub : null;
    
    // Connexion à la base de données
    const db = await mongoConnect();
    
    // Traiter la requête selon la méthode HTTP et le chemin
    const path = event.path.split('/').pop();
    
    // GET /api/challenges/seven-majors/predefined
    if (event.httpMethod === "GET" && path === "predefined") {
      const predefinedChallenges = await getPredefinedChallenges(db);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(predefinedChallenges)
      };
    }
    
    // GET /api/challenges/seven-majors/user
    if (event.httpMethod === "GET" && path === "user") {
      // Vérifier l'authentification pour les défis utilisateur
      if (!userId) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: "Authentification requise" })
        };
      }
      
      const userChallenges = await getUserChallenges(db, userId);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(userChallenges)
      };
    }
    
    // POST /api/challenges/seven-majors/save
    if (event.httpMethod === "POST" && path === "save") {
      // Vérifier l'authentification
      if (!userId) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: "Authentification requise" })
        };
      }
      
      const challenge = JSON.parse(event.body);
      
      // Valider le défi
      if (!challenge || !challenge.name || !challenge.cols || challenge.cols.length !== 7) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Données de défi invalides" })
        };
      }
      
      const savedChallenge = await saveUserChallenge(db, userId, challenge);
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(savedChallenge)
      };
    }
    
    // POST /api/challenges/seven-majors/recommend
    if (event.httpMethod === "POST" && path === "recommend") {
      const { selectedColIds } = JSON.parse(event.body);
      
      const recommendations = await getRecommendations(db, selectedColIds);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(recommendations)
      };
    }
    
    // Route non trouvée
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: "Route non trouvée" })
    };
  } catch (error) {
    console.error("Erreur lors du traitement de la requête:", error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: "Erreur serveur",
        message: error.message
      })
    };
  }
};
