// Fonction Netlify pour l'endpoint /api/auth/verify
// Vérifie la validité du token d'authentification

const jwt = require('jsonwebtoken');
const { MongoClient } = require('mongodb');

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

// Vérifier et décoder le token JWT
const verifyToken = (token) => {
  try {
    if (!token) return null;
    
    // Vérifier le token avec le secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error("Erreur de vérification du token:", error);
    return null;
  }
};

// Récupérer les informations utilisateur complètes
const getUserInfo = async (db, userId) => {
  try {
    // Récupérer les informations de base de l'utilisateur
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ auth0Id: userId });
    
    if (!user) {
      return null;
    }
    
    // Récupérer les statistiques de l'utilisateur
    const statsCollection = db.collection('user_stats');
    const stats = await statsCollection.findOne({ userId: user._id.toString() });
    
    // Récupérer les défis de l'utilisateur
    const challengesCollection = db.collection('user_challenges');
    const challenges = await challengesCollection.find({ 
      userId: user._id.toString() 
    }).toArray();
    
    // Récupérer les cols complétés
    const completedColsCollection = db.collection('user_completed_cols');
    const completedCols = await completedColsCollection.find({ 
      userId: user._id.toString() 
    }).toArray();
    
    // Construire l'objet utilisateur complet
    return {
      ...user,
      stats: stats || {},
      challengeCount: challenges.length,
      completedColsCount: completedCols.length,
      // Ne pas renvoyer de données sensibles
      password: undefined
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des informations utilisateur:", error);
    throw error;
  }
};

exports.handler = async (event, context) => {
  // Configuration CORS
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
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
    
    if (!token) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: "Token d'authentification manquant" })
      };
    }
    
    // Vérifier et décoder le token
    const decodedToken = verifyToken(token);
    
    if (!decodedToken) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: "Token d'authentification invalide" })
      };
    }
    
    // Récupérer les informations utilisateur complètes
    const db = await mongoConnect();
    const userInfo = await getUserInfo(db, decodedToken.sub);
    
    if (!userInfo) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: "Utilisateur non trouvé" })
      };
    }
    
    // Renvoyer les informations utilisateur
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        authenticated: true,
        user: userInfo,
        tokenExpiration: decodedToken.exp * 1000 // Convertir en millisecondes
      })
    };
  } catch (error) {
    console.error("Erreur lors de la vérification de l'authentification:", error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: "Erreur lors de la vérification de l'authentification",
        message: error.message
      })
    };
  }
};
