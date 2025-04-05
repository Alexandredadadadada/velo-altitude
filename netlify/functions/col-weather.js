// Fonction Netlify pour l'endpoint /api/cols/weather/:id
// Cette fonction récupère les données météo pour un col spécifique

const axios = require('axios');
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
    return client.db("dashboard-velo");
  } catch (error) {
    console.error("Erreur de connexion MongoDB:", error);
    throw error;
  }
};

// Récupérer les données météo depuis OpenWeather API
const fetchWeatherData = async (lat, lon) => {
  try {
    const apiKey = process.env.REACT_APP_OPENWEATHER_API_KEY;
    const url = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly&units=metric&lang=fr&appid=${apiKey}`;
    
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la récupération des données météo:", error);
    throw error;
  }
};

// Enregistrer les données météo dans le cache
const saveWeatherCache = async (db, colId, weatherData) => {
  try {
    const weatherCacheCollection = db.collection('weather_cache');
    
    // Définir la date d'expiration (24 heures)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    // Vérifier si une entrée existe déjà pour ce col
    const existingCache = await weatherCacheCollection.findOne({ colId });
    
    if (existingCache) {
      // Mettre à jour l'entrée existante
      await weatherCacheCollection.updateOne(
        { colId },
        { 
          $set: { 
            weatherData,
            updatedAt: new Date(),
            expiresAt
          } 
        }
      );
    } else {
      // Créer une nouvelle entrée
      await weatherCacheCollection.insertOne({
        colId,
        weatherData,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt
      });
    }
    
    return true;
  } catch (error) {
    console.error("Erreur lors de l'enregistrement du cache météo:", error);
    return false;
  }
};

// Récupérer les données météo depuis le cache
const getWeatherFromCache = async (db, colId) => {
  try {
    const weatherCacheCollection = db.collection('weather_cache');
    
    // Récupérer l'entrée de cache pour ce col
    const cacheEntry = await weatherCacheCollection.findOne({ 
      colId,
      expiresAt: { $gt: new Date() } // Vérifier que le cache n'est pas expiré
    });
    
    return cacheEntry ? cacheEntry.weatherData : null;
  } catch (error) {
    console.error("Erreur lors de la récupération du cache météo:", error);
    return null;
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
    // Extraire l'ID du col depuis les paramètres
    const colId = event.path.split('/').pop();
    
    if (!colId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "ID du col manquant" })
      };
    }
    
    // Connexion à la base de données
    const db = await mongoConnect();
    
    // Vérifier si les données météo sont en cache
    const cachedWeather = await getWeatherFromCache(db, colId);
    
    if (cachedWeather) {
      // Renvoyer les données du cache
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          source: "cache",
          data: cachedWeather
        })
      };
    }
    
    // Si pas en cache, récupérer les coordonnées du col
    const colsCollection = db.collection('cols');
    const col = await colsCollection.findOne({ _id: new ObjectId(colId) });
    
    if (!col) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: "Col non trouvé" })
      };
    }
    
    // Récupérer les données météo
    const weatherData = await fetchWeatherData(col.coordinates.lat, col.coordinates.lng);
    
    // Enregistrer dans le cache
    await saveWeatherCache(db, colId, weatherData);
    
    // Renvoyer les résultats
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        source: "api",
        data: weatherData
      })
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des données météo:", error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: "Erreur lors de la récupération des données météo",
        message: error.message
      })
    };
  }
};
