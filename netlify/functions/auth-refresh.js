// Fonction Netlify pour la rotation des JWT tokens
// Cette fonction gère le rafraîchissement des tokens JWT pour améliorer la sécurité

const jwt = require('jsonwebtoken');
const { MongoClient, ObjectId } = require('mongodb');

// Connexion à MongoDB Atlas
const mongoConnect = async () => {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
  });
  
  try {
    await client.connect();
    return { db: client.db("dashboard-velo"), client };
  } catch (error) {
    console.error("Erreur de connexion MongoDB:", error);
    throw error;
  }
};

// Vérifier le token existant
const verifyToken = (token) => {
  try {
    if (!token) return null;
    
    // Vérifier avec le secret principal
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    // Si le token est expiré mais valide, on peut toujours le rafraîchir
    if (error.name === 'TokenExpiredError') {
      try {
        // On utilise le secret de rotation pour permettre un refresh même si expiré
        return jwt.verify(token, process.env.JWT_ROTATION_SECRET, { ignoreExpiration: true });
      } catch (innerError) {
        console.error("Erreur lors de la vérification du token de rotation:", innerError);
        return null;
      }
    }
    console.error("Erreur de vérification du token:", error);
    return null;
  }
};

// Vérifier si le token est blacklisté
const isTokenBlacklisted = async (db, token) => {
  try {
    const blacklistCollection = db.collection('token_blacklist');
    const blacklistedToken = await blacklistCollection.findOne({ token });
    return !!blacklistedToken;
  } catch (error) {
    console.error("Erreur lors de la vérification de la blacklist:", error);
    return true; // Par sécurité, en cas d'erreur on considère le token comme blacklisté
  }
};

// Générer un nouveau token JWT
const generateToken = (user) => {
  // Créer un nouveau token avec une durée de validité de 1 heure
  return jwt.sign(
    {
      sub: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions || [],
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

// Blacklister un ancien token
const blacklistToken = async (db, token, decodedToken) => {
  try {
    const blacklistCollection = db.collection('token_blacklist');
    
    // Stocker le token dans la blacklist avec sa date d'expiration
    await blacklistCollection.insertOne({
      token,
      exp: new Date(decodedToken.exp * 1000),
      userId: decodedToken.sub,
      createdAt: new Date()
    });
    
    // Nettoyer les tokens expirés depuis plus de 24h de la blacklist
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    await blacklistCollection.deleteMany({
      exp: { $lt: oneDayAgo }
    });
    
    return true;
  } catch (error) {
    console.error("Erreur lors du blacklisting du token:", error);
    return false;
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
    // Cette fonction ne devrait être appelée qu'en POST
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: "Méthode non autorisée" })
      };
    }
    
    // Extraire le token d'authentification
    const authHeader = event.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;
    
    if (!token) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: "Token d'authentification requis" })
      };
    }
    
    // Vérifier le token
    const decodedToken = verifyToken(token);
    
    if (!decodedToken) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: "Token invalide ou malformé" })
      };
    }
    
    // Connexion à la base de données
    const { db, client } = await mongoConnect();
    
    try {
      // Vérifier si le token est blacklisté
      const isBlacklisted = await isTokenBlacklisted(db, token);
      
      if (isBlacklisted) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: "Token révoqué ou expiré" })
        };
      }
      
      // Récupérer les informations utilisateur
      const usersCollection = db.collection('users');
      const user = await usersCollection.findOne({ _id: new ObjectId(decodedToken.sub) });
      
      if (!user) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: "Utilisateur non trouvé" })
        };
      }
      
      // Blacklister l'ancien token
      await blacklistToken(db, token, decodedToken);
      
      // Générer un nouveau token
      const newToken = generateToken(user);
      
      // Enregistrer l'activité de rafraîchissement
      const activitiesCollection = db.collection('user_activities');
      await activitiesCollection.insertOne({
        userId: user._id,
        type: 'token_refresh',
        timestamp: new Date(),
        userAgent: event.headers['user-agent'] || 'unknown',
        ip: event.headers['client-ip'] || 'unknown'
      });
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          token: newToken,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            permissions: user.permissions || []
          }
        })
      };
    } finally {
      // Fermer la connexion MongoDB
      if (client) {
        await client.close();
      }
    }
  } catch (error) {
    console.error("Erreur lors du rafraîchissement du token:", error);
    
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
