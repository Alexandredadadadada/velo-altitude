// Fonction Netlify pour l'endpoint /api/training/programs
// Gère l'accès aux programmes d'entraînement

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

// Récupérer les programmes d'entraînement
const getTrainingPrograms = async (db, filters = {}) => {
  try {
    const programsCollection = db.collection('training_programs');
    
    // Construire le filtre de recherche
    let query = {};
    
    if (filters.level) {
      query.level = filters.level;
    }
    
    if (filters.duration) {
      query.durationWeeks = parseInt(filters.duration);
    }
    
    if (filters.goal) {
      query.primaryGoal = filters.goal;
    }
    
    // Exécuter la requête
    return await programsCollection.find(query)
      .sort({ popularity: -1 })
      .toArray();
  } catch (error) {
    console.error("Erreur lors de la récupération des programmes d'entraînement:", error);
    throw error;
  }
};

// Récupérer un programme d'entraînement spécifique
const getTrainingProgramById = async (db, programId) => {
  try {
    const programsCollection = db.collection('training_programs');
    return await programsCollection.findOne({ _id: new ObjectId(programId) });
  } catch (error) {
    console.error("Erreur lors de la récupération du programme d'entraînement:", error);
    throw error;
  }
};

// Calculer la FTP avec différentes méthodes
const calculateFTP = (method, params) => {
  switch (method) {
    case 'cp20':
      // Méthode Critical Power 20min
      return params.cp20 * 0.95;
      
    case 'cp60':
      // Méthode Critical Power 60min
      return params.cp60;
      
    case 'ramp':
      // Méthode du test RAMP
      return params.rampResult * 0.75;
      
    case 'power_curve':
      // Méthode basée sur la courbe de puissance
      const maxPower = params.maxPower;
      const duration = params.duration; // en secondes
      // Formule non-linéaire basée sur la courbe de puissance
      return maxPower * Math.pow(duration / 3600, -0.07);
      
    case 'recent_best':
      // Méthode basée sur les meilleures performances récentes
      const best20min = params.best20min || 0;
      const best60min = params.best60min || 0;
      
      if (best20min > 0 && best60min > 0) {
        // Moyenne pondérée si les deux valeurs sont disponibles
        return (best20min * 0.95 * 0.65) + (best60min * 0.35);
      } else if (best20min > 0) {
        return best20min * 0.95;
      } else if (best60min > 0) {
        return best60min;
      }
      return 0;
      
    case 'weight_based':
      // Estimation basée sur le poids et la catégorie
      const weight = params.weight;
      const category = params.category; // débutant, intermédiaire, avancé, élite
      
      const categoryFactors = {
        débutant: 2.5,
        intermédiaire: 3.2,
        avancé: 3.8,
        élite: 4.5
      };
      
      const factor = categoryFactors[category] || 3.2;
      return weight * factor;
      
    default:
      return 0;
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
    
    // GET /api/training/programs - Liste des programmes
    if (event.httpMethod === "GET" && (path === "programs" || !path)) {
      const filters = event.queryStringParameters || {};
      const programs = await getTrainingPrograms(db, filters);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(programs)
      };
    }
    
    // GET /api/training/programs/:id - Détails d'un programme
    if (event.httpMethod === "GET" && path !== "programs" && path !== "ftp") {
      const programId = path;
      const program = await getTrainingProgramById(db, programId);
      
      if (!program) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: "Programme d'entraînement non trouvé" })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(program)
      };
    }
    
    // POST /api/training/ftp - Calcul de FTP
    if (event.httpMethod === "POST" && path === "ftp") {
      const { method, params } = JSON.parse(event.body);
      
      if (!method || !params) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Méthode ou paramètres manquants" })
        };
      }
      
      const ftp = calculateFTP(method, params);
      
      // Enregistrer le résultat pour l'utilisateur si authentifié
      if (userId && ftp > 0) {
        const userStatsCollection = db.collection('user_stats');
        
        await userStatsCollection.updateOne(
          { userId },
          { 
            $set: { 
              ftp,
              ftpMethod: method,
              ftpUpdatedAt: new Date() 
            },
            $setOnInsert: { createdAt: new Date() }
          },
          { upsert: true }
        );
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ ftp })
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
