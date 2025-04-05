// Fonction Netlify pour l'endpoint /api/cols/elevation
// Cette fonction fournit des données d'élévation détaillées pour les cols

const { MongoClient, ObjectId } = require('mongodb');
const axios = require('axios');
const redis = require('redis');
const { promisify } = require('util');

// Configuration Redis
let redisClient;
let getAsync;
let setexAsync;

// Désactivation complète de Redis pour simplifier le déploiement
const initRedis = () => {
  console.log("Redis est désactivé pour simplifier le déploiement initial");
  return null;
};

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

// Récupérer les données d'élévation pour un col
const getColElevationData = async (db, colId) => {
  try {
    const colsCollection = db.collection('cols');
    
    // Récupérer le col avec ses données d'élévation
    const col = await colsCollection.findOne(
      { _id: new ObjectId(colId) },
      { projection: { name: 1, elevation: 1, elevationData: 1, length: 1, avgGradient: 1, maxGradient: 1, location: 1 } }
    );
    
    if (!col) {
      return null;
    }
    
    // Si les données d'élévation complètes sont déjà en BDD
    if (col.elevationData && col.elevationData.points && col.elevationData.points.length > 0) {
      return col;
    }
    
    // Sinon, il faut aller les chercher via une API externe si on a les coordonnées
    if (col.location && col.location.coordinates) {
      const elevationData = await fetchExternalElevationData(
        col.location.coordinates[1], // latitude
        col.location.coordinates[0], // longitude
        col.length
      );
      
      // Mettre à jour les données en base pour les futurs appels
      if (elevationData) {
        await colsCollection.updateOne(
          { _id: col._id },
          { $set: { elevationData } }
        );
        
        return { ...col, elevationData };
      }
    }
    
    // Si on n'a pas pu récupérer les données détaillées, renvoyer un profil généré
    return {
      ...col,
      elevationData: generateSyntheticElevationProfile(col)
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des données d'élévation:", error);
    throw error;
  }
};

// Récupérer les données d'élévation via une API externe
const fetchExternalElevationData = async (lat, lng, length) => {
  try {
    // API fictive pour l'exemple - à remplacer par l'API réelle
    const response = await axios.get(`https://api.opentopodata.org/v1/srtm30m?locations=${lat},${lng}`);
    
    if (response.data && response.data.results) {
      // Traitement des données de l'API
      // Dans un cas réel, il faudrait faire plusieurs appels pour obtenir le profil complet
      
      // Structure synthétique de données pour l'exemple
      return {
        points: generateElevationPoints(length),
        source: "opentopodata",
        lastUpdated: new Date().toISOString()
      };
    }
    
    return null;
  } catch (error) {
    console.error("Erreur lors de la récupération des données d'élévation externes:", error);
    return null;
  }
};

// Générer un profil d'élévation synthétique basé sur les données existantes
const generateSyntheticElevationProfile = (col) => {
  // Nombre de points à générer (environ 1 point tous les 100m)
  const numPoints = Math.max(20, Math.ceil(col.length * 1000 / 100));
  const startElevation = col.elevation - col.avgGradient * col.length;
  
  // Générer les points
  const points = [];
  for (let i = 0; i < numPoints; i++) {
    const distance = (i / (numPoints - 1)) * col.length;
    
    // Variation de base avec la pente moyenne
    let elevation = startElevation + (col.avgGradient * distance * 1000);
    
    // Ajouter quelques variations pour rendre le profil plus naturel
    // Plus prononcées vers le milieu pour simuler des sections plus raides
    const variation = Math.sin(Math.PI * (distance / col.length)) * 
                      (col.maxGradient - col.avgGradient) * 
                      Math.random() * 50;
    
    elevation += variation;
    
    points.push({
      distance: distance.toFixed(2),
      elevation: Math.round(elevation),
      gradient: parseFloat((col.avgGradient + (variation / 100)).toFixed(1))
    });
  }
  
  return {
    points,
    source: "synthetic",
    generatedAt: new Date().toISOString()
  };
};

// Générer des points d'élévation pour le test (à remplacer par données réelles)
const generateElevationPoints = (length) => {
  const points = [];
  const steps = Math.ceil(length * 10); // Un point tous les 100m
  
  for (let i = 0; i <= steps; i++) {
    const distance = (i / steps) * length;
    const elevation = 800 + Math.sin(distance * Math.PI) * 500 + Math.random() * 50;
    const gradient = 5 + Math.sin(distance * Math.PI * 2) * 3;
    
    points.push({
      distance: distance.toFixed(2),
      elevation: Math.round(elevation),
      gradient: parseFloat(gradient.toFixed(1))
    });
  }
  
  return points;
};

// Récupérer les données d'élévation pour plusieurs cols
const getColsElevationData = async (db, colIds) => {
  try {
    const results = await Promise.all(colIds.map(id => getColElevationData(db, id)));
    return results.filter(result => result !== null);
  } catch (error) {
    console.error("Erreur lors de la récupération des données d'élévation multiples:", error);
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
    // Initialiser Redis si disponible
    let redis;
    try {
      redis = initRedis();
    } catch (redisError) {
      console.warn("Redis non disponible:", redisError.message);
      // On continue sans Redis
    }
    
    // Connexion à la base de données
    const { db, client } = await mongoConnect();
    
    try {
      // Traiter la requête selon le chemin
      const path = event.path.replace(/\/api\/cols\/elevation\/?/, '');
      
      // GET /api/cols/elevation/:id - Données d'élévation pour un col spécifique
      if (path && path !== 'batch') {
        const colId = path;
        
        // Récupérer les données d'élévation
        const elevationData = await getColElevationData(db, colId);
        
        if (!elevationData) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: "Col non trouvé" })
          };
        }
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(elevationData)
        };
      }
      
      // POST /api/cols/elevation/batch - Données d'élévation pour plusieurs cols
      if (path === 'batch' && event.httpMethod === 'POST') {
        const { colIds } = JSON.parse(event.body);
        
        if (!colIds || !Array.isArray(colIds) || colIds.length === 0) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: "Liste d'IDs de cols requise" })
          };
        }
        
        // Limiter le nombre de cols à 10 pour éviter les abus
        if (colIds.length > 10) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: "Maximum 10 cols par requête" })
          };
        }
        
        // Récupérer les données d'élévation pour tous les cols
        const elevationData = await getColsElevationData(db, colIds);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(elevationData)
        };
      }
      
      // Route non trouvée
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: "Route non trouvée" })
      };
    } finally {
      // Fermer la connexion MongoDB
      if (client) {
        await client.close();
      }
    }
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
