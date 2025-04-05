// Fonction Netlify pour l'endpoint /api/cols/region
// Cette fonction fournit des cols filtrés par région géographique avec optimisation du cache

const { MongoClient } = require('mongodb');
const redis = require('redis');
const { promisify } = require('util');

// Configuration Redis
let redisClient;
let getAsync;
let setexAsync;

const initRedis = () => {
  if (!redisClient) {
    // Connexion Redis avec support de cluster
    const options = {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      password: process.env.REDIS_PASSWORD,
    };
    
    // Si un cluster est configuré
    if (process.env.REDIS_CLUSTER_NODES) {
      const nodes = JSON.parse(process.env.REDIS_CLUSTER_NODES);
      redisClient = redis.createCluster({
        rootNodes: nodes,
        defaults: {
          password: process.env.REDIS_PASSWORD
        }
      });
    } else {
      redisClient = redis.createClient(options);
    }
    
    redisClient.on('error', err => console.error('Redis error:', err));
    
    getAsync = promisify(redisClient.get).bind(redisClient);
    setexAsync = promisify(redisClient.setex).bind(redisClient);
  }
  
  return {
    getAsync,
    setexAsync
  };
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

// Récupérer les cols par région
const getColsByRegion = async (db, region, filters = {}) => {
  try {
    const colsCollection = db.collection('cols');
    
    // Construire la requête principale
    const query = { region };
    
    // Ajouter les filtres
    if (filters.minElevation) {
      query.elevation = { $gte: parseInt(filters.minElevation) };
    }
    
    if (filters.maxElevation) {
      if (query.elevation) {
        query.elevation.$lte = parseInt(filters.maxElevation);
      } else {
        query.elevation = { $lte: parseInt(filters.maxElevation) };
      }
    }
    
    if (filters.difficulty) {
      query.difficulty = filters.difficulty;
    }
    
    if (filters.country) {
      query.country = filters.country;
    }
    
    // Projection pour limiter les données retournées
    const projection = {
      name: 1,
      elevation: 1,
      length: 1,
      avgGradient: 1,
      maxGradient: 1,
      difficulty: 1,
      region: 1,
      country: 1,
      images: { $slice: 1 }, // Prendre juste la première image
      location: 1
    };
    
    // Options de pagination
    const limit = filters.limit ? parseInt(filters.limit) : 20;
    const skip = filters.page ? (parseInt(filters.page) - 1) * limit : 0;
    
    // Récupérer les cols
    const cols = await colsCollection
      .find(query, { projection })
      .sort({ elevation: -1 }) // Trier par altitude décroissante
      .skip(skip)
      .limit(limit)
      .toArray();
    
    // Compter le total pour la pagination
    const total = await colsCollection.countDocuments(query);
    
    return {
      cols,
      pagination: {
        total,
        page: filters.page ? parseInt(filters.page) : 1,
        limit,
        pages: Math.ceil(total / limit)
      },
      region
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des cols par région:", error);
    throw error;
  }
};

// Récupérer les régions disponibles
const getAvailableRegions = async (db) => {
  try {
    const colsCollection = db.collection('cols');
    
    // Utiliser l'agrégation pour récupérer les régions et le nombre de cols
    const regions = await colsCollection.aggregate([
      {
        $group: {
          _id: "$region",
          count: { $sum: 1 },
          countries: { $addToSet: "$country" },
          maxElevation: { $max: "$elevation" },
          minElevation: { $min: "$elevation" }
        }
      },
      {
        $project: {
          _id: 0,
          region: "$_id",
          count: 1,
          countries: 1,
          maxElevation: 1,
          minElevation: 1
        }
      },
      {
        $sort: { count: -1 }
      }
    ]).toArray();
    
    return regions;
  } catch (error) {
    console.error("Erreur lors de la récupération des régions disponibles:", error);
    throw error;
  }
};

// Récupérer les pays pour une région
const getCountriesByRegion = async (db, region) => {
  try {
    const colsCollection = db.collection('cols');
    
    // Utiliser l'agrégation pour récupérer les pays d'une région
    const countries = await colsCollection.aggregate([
      {
        $match: { region }
      },
      {
        $group: {
          _id: "$country",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          country: "$_id",
          count: 1
        }
      },
      {
        $sort: { count: -1 }
      }
    ]).toArray();
    
    return countries;
  } catch (error) {
    console.error("Erreur lors de la récupération des pays par région:", error);
    throw error;
  }
};

// Récupérer les cols recommandés pour le défi des 7 Majeurs
const getRecommendedCols = async (db, selectedIds, region) => {
  try {
    const colsCollection = db.collection('cols');
    
    // Convertir les IDs en ObjectIds pour la recherche des cols déjà sélectionnés
    const ObjectId = require('mongodb').ObjectId;
    const selectedObjectIds = selectedIds.map(id => new ObjectId(id));
    
    // Récupérer les cols déjà sélectionnés pour analyser leurs caractéristiques
    const selectedCols = await colsCollection
      .find({ _id: { $in: selectedObjectIds } })
      .toArray();
    
    // Calculer les moyennes des cols sélectionnés
    let avgElevation = 0;
    let avgDifficulty = 0;
    let regions = new Set();
    let countries = new Set();
    
    if (selectedCols.length > 0) {
      avgElevation = selectedCols.reduce((sum, col) => sum + col.elevation, 0) / selectedCols.length;
      
      // Convertir la difficulté en valeur numérique pour le calcul
      const difficultyMap = { 'easy': 1, 'medium': 2, 'hard': 3, 'extreme': 4 };
      avgDifficulty = selectedCols.reduce((sum, col) => sum + difficultyMap[col.difficulty], 0) / selectedCols.length;
      
      // Collecter les régions et pays déjà représentés
      selectedCols.forEach(col => {
        if (col.region) regions.add(col.region);
        if (col.country) countries.add(col.country);
      });
    }
    
    // Construire la requête pour les recommandations
    const query = {
      _id: { $nin: selectedObjectIds }
    };
    
    // Si une région est spécifiée, filtrer par cette région
    if (region) {
      query.region = region;
    }
    
    // Construire le pipeline d'agrégation pour les recommandations
    const pipeline = [
      { $match: query },
      { $addFields: {
        // Calculer un score de similarité basé sur plusieurs facteurs
        similarityScore: { 
          $add: [
            // Score basé sur la proximité d'altitude
            { $multiply: [
                { $divide: [1, { $abs: { $subtract: ["$elevation", avgElevation] } }] },
                1000 // Facteur de pondération
            ]},
            // Bonus pour les régions et pays différents (diversité)
            { $cond: { if: { $in: ["$region", Array.from(regions)] }, then: 0, else: 50 } },
            { $cond: { if: { $in: ["$country", Array.from(countries)] }, then: 0, else: 30 } },
            // Bonus pour les cols emblématiques
            { $cond: { if: "$isLegendary", then: 100, else: 0 } },
            // Bonus pour les cols du Tour de France
            { $cond: { if: "$tourDeFrance", then: 80, else: 0 } }
          ]
        }
      }},
      { $sort: { similarityScore: -1 } },
      { $limit: 10 },
      { $project: {
        name: 1,
        elevation: 1,
        length: 1,
        avgGradient: 1,
        maxGradient: 1,
        difficulty: 1,
        region: 1,
        country: 1,
        images: { $slice: ["$images", 1] },
        location: 1,
        similarityScore: 1,
        isLegendary: 1,
        tourDeFrance: 1
      }}
    ];
    
    const recommendations = await colsCollection.aggregate(pipeline).toArray();
    
    return {
      recommendations,
      selectedCount: selectedCols.length,
      avgElevation,
      regions: Array.from(regions),
      countries: Array.from(countries)
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des cols recommandés:", error);
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
      // Extraire le chemin et les paramètres
      const pathParts = event.path.split('/');
      const action = pathParts.pop();
      
      // GET /api/cols/region - Liste des régions disponibles
      if (action === 'region' && event.httpMethod === "GET") {
        // Vérifier dans le cache Redis si disponible
        let cachedData;
        if (redis) {
          const cacheKey = 'explorer:regions';
          cachedData = await redis.getAsync(cacheKey);
          
          if (cachedData) {
            return {
              statusCode: 200,
              headers,
              body: cachedData
            };
          }
        }
        
        const regions = await getAvailableRegions(db);
        
        // Mettre en cache si Redis est disponible
        if (redis) {
          const cacheKey = 'explorer:regions';
          const cacheData = JSON.stringify(regions);
          // Cache de 24 heures car les régions changent rarement
          await redis.setexAsync(cacheKey, 86400, cacheData);
        }
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(regions)
        };
      }
      
      // GET /api/cols/region/:region - Cols d'une région spécifique
      if (action !== 'region' && event.httpMethod === "GET") {
        const region = action;
        const filters = event.queryStringParameters || {};
        
        // Générer une clé de cache unique basée sur la région et les filtres
        const cacheKey = `explorer:region:${region}:${JSON.stringify(filters)}`;
        
        // Vérifier dans le cache Redis si disponible
        let cachedData;
        if (redis) {
          cachedData = await redis.getAsync(cacheKey);
          
          if (cachedData) {
            return {
              statusCode: 200,
              headers,
              body: cachedData
            };
          }
        }
        
        const colsData = await getColsByRegion(db, region, filters);
        
        // Mettre en cache si Redis est disponible
        if (redis) {
          const cacheData = JSON.stringify(colsData);
          // Cache de 12 heures
          await redis.setexAsync(cacheKey, 43200, cacheData);
        }
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(colsData)
        };
      }
      
      // GET /api/cols/region/:region/countries - Pays d'une région
      if (pathParts.pop() === 'countries' && event.httpMethod === "GET") {
        const region = action;
        
        // Vérifier dans le cache Redis si disponible
        const cacheKey = `explorer:region:${region}:countries`;
        let cachedData;
        
        if (redis) {
          cachedData = await redis.getAsync(cacheKey);
          
          if (cachedData) {
            return {
              statusCode: 200,
              headers,
              body: cachedData
            };
          }
        }
        
        const countries = await getCountriesByRegion(db, region);
        
        // Mettre en cache si Redis est disponible
        if (redis) {
          const cacheData = JSON.stringify(countries);
          // Cache de 24 heures
          await redis.setexAsync(cacheKey, 86400, cacheData);
        }
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(countries)
        };
      }
      
      // POST /api/cols/region/recommend - Recommandations pour le défi des 7 Majeurs
      if (action === 'recommend' && event.httpMethod === "POST") {
        const { selectedIds, region } = JSON.parse(event.body);
        
        if (!selectedIds || !Array.isArray(selectedIds)) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: "IDs des cols sélectionnés requis" })
          };
        }
        
        const recommendations = await getRecommendedCols(db, selectedIds, region);
        
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
