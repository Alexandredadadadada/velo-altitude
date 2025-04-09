/**
 * Script pour générer des cols optimisés pour l'API OpenRouteService 
 * Ce script crée un jeu de données de cols européens qui fonctionnent bien avec l'API
 */

const { MongoClient } = require('mongodb');
const https = require('https');
const dotenv = require('dotenv');

// Charger les variables d'environnement
dotenv.config();

// Configuration MongoDB
const MONGODB_CONFIG = {
  uri: process.env.MONGODB_URI || "mongodb+srv://veloaltitude:veloaltitude2025@cluster0grandest.mongodb.net/velo-altitude?retryWrites=true&w=majority",
  dbName: "velo-altitude",
  collections: {
    challenges: "challenges",
    cols: "cols"
  }
};

// Configuration de l'API OpenRouteService
const ORS_API_KEY = process.env.OPENROUTE_API_KEY || "5b3ce3597851110001cf62484cbe82d2ae70493ea1b04c4c35f76279";

// Liste des cols optimisés pour l'API OpenRouteService
// Cols situés principalement en France et dans des régions où l'API a de bonnes données
const OPTIMIZED_COLS = [
  {
    name: "Col du Galibier",
    region: "Savoie",
    country: "France",
    elevation: 2642,
    length: 17.7,
    avgGradient: 7.1,
    maxGradient: 12.1,
    difficulty: "hard",
    description: "Le col du Galibier est l'un des plus hauts cols routiers des Alpes françaises. Il relie Saint-Michel-de-Maurienne et Briançon via le col du Télégraphe et le col du Lautaret.",
    coordinates: [45.0612, 6.4085],
    image: "https://images.unsplash.com/photo-1472791108553-c9405341e398",
    climbs: [
      {
        side: "nord",
        startCoordinates: [45.2, 6.43],
        endCoordinates: [45.0612, 6.4085],
        length: 18.1,
        avgGradient: 6.9,
        maxGradient: 10.1
      },
      {
        side: "sud",
        startCoordinates: [44.98, 6.38],
        endCoordinates: [45.0612, 6.4085],
        length: 16.7,
        avgGradient: 6.8,
        maxGradient: 9.2
      }
    ],
    tags: ["tour-de-france", "mythique", "alpes"]
  },
  {
    name: "Alpe d'Huez",
    region: "Isère",
    country: "France",
    elevation: 1850,
    length: 13.8,
    avgGradient: 8.1,
    maxGradient: 13.0,
    difficulty: "hard",
    description: "Célèbre pour ses 21 virages numérotés, l'Alpe d'Huez est l'une des montées les plus emblématiques du Tour de France.",
    coordinates: [45.0922, 6.0703],
    image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05",
    climbs: [
      {
        side: "est",
        startCoordinates: [45.05, 6.05],
        endCoordinates: [45.0922, 6.0703],
        length: 13.8,
        avgGradient: 8.1,
        maxGradient: 13.0
      }
    ],
    tags: ["tour-de-france", "mythique", "21-virages"]
  },
  {
    name: "Col du Tourmalet",
    region: "Hautes-Pyrénées", 
    country: "France",
    elevation: 2115,
    length: 19.0,
    avgGradient: 7.4,
    maxGradient: 10.2,
    difficulty: "hard",
    description: "Le géant des Pyrénées, le col du Tourmalet est le col routier le plus haut des Pyrénées françaises.",
    coordinates: [42.9104, 0.1458],
    image: "https://images.unsplash.com/photo-1500520198921-6d4704f98092",
    climbs: [
      {
        side: "est",
        startCoordinates: [42.97, 0.23],
        endCoordinates: [42.9104, 0.1458],
        length: 17.2,
        avgGradient: 7.7,
        maxGradient: 10.2
      },
      {
        side: "ouest",
        startCoordinates: [42.87, 0.05],
        endCoordinates: [42.9104, 0.1458],
        length: 19.0,
        avgGradient: 7.4,
        maxGradient: 9.5
      }
    ],
    tags: ["tour-de-france", "mythique", "pyrenees"]
  },
  {
    name: "Col d'Izoard",
    region: "Hautes-Alpes",
    country: "France",
    elevation: 2360,
    length: 14.1,
    avgGradient: 7.3,
    maxGradient: 10.0,
    difficulty: "hard",
    description: "Célèbre pour ses paysages lunaires de la Casse Déserte, l'Izoard est l'un des cols les plus spectaculaires des Alpes.",
    coordinates: [44.8203, 6.7347],
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b",
    climbs: [
      {
        side: "sud",
        startCoordinates: [44.7, 6.7],
        endCoordinates: [44.8203, 6.7347],
        length: 14.1,
        avgGradient: 7.3,
        maxGradient: 10.0
      },
      {
        side: "nord",
        startCoordinates: [44.9, 6.75],
        endCoordinates: [44.8203, 6.7347],
        length: 19.0,
        avgGradient: 5.7,
        maxGradient: 9.0
      }
    ],
    tags: ["tour-de-france", "mythique", "alpes"]
  },
  {
    name: "Col de la Madeleine",
    region: "Savoie",
    country: "France",
    elevation: 2000,
    length: 19.5,
    avgGradient: 7.9,
    maxGradient: 10.3,
    difficulty: "hard",
    description: "Un col alpin exigeant qui relie les vallées de la Maurienne et de la Tarentaise.",
    coordinates: [45.4302, 6.3965],
    image: "https://images.unsplash.com/photo-1486901796908-dad827fbbb32",
    climbs: [
      {
        side: "sud",
        startCoordinates: [45.35, 6.32],
        endCoordinates: [45.4302, 6.3965],
        length: 19.5,
        avgGradient: 7.9,
        maxGradient: 10.3
      },
      {
        side: "nord",
        startCoordinates: [45.5, 6.47],
        endCoordinates: [45.4302, 6.3965],
        length: 26.5,
        avgGradient: 5.2,
        maxGradient: 9.0
      }
    ],
    tags: ["tour-de-france", "alpes", "difficile"]
  }
];

/**
 * Fonction pour récupérer le profil d'élévation depuis l'API OpenRouteService
 * @param {Array<Array<number>>} coordinates - Les coordonnées [longitude, latitude] des points du trajet
 * @returns {Promise<Object>} - Le profil d'élévation
 */
async function fetchElevationProfile(coordinates) {
  return new Promise((resolve, reject) => {
    // Préparer les données pour l'API
    const data = JSON.stringify({
      format_in: "pointlist",
      format_out: "pointlist",
      geometry: coordinates
    });

    // Options de la requête
    const options = {
      hostname: 'api.openrouteservice.org',
      path: '/elevation/line',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': ORS_API_KEY,
        'Content-Length': data.length
      }
    };

    // Faire la requête
    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(responseData);
            resolve(response);
          } catch (error) {
            reject(new Error(`Erreur de parsing JSON: ${error.message}. Données: ${responseData}`));
          }
        } else {
          reject(new Error(`Erreur HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

/**
 * Génère un profil d'élévation synthétique pour un col
 * @param {Object} col - Le col pour lequel générer le profil
 * @returns {Promise<Object>} - Le profil d'élévation
 */
async function generateElevationProfile(col) {
  try {
    console.log(`🔄 Génération du profil d'élévation pour ${col.name}...`);
    
    // Créer un trajet synthétique autour du col
    const colLat = col.coordinates[0];
    const colLng = col.coordinates[1];
    
    // Créer un chemin qui monte et descend du col (approximation)
    const elevationPoints = [];
    const pointsCount = 41; // Nombre de points dans le profil
    
    // Créer une trajectoire qui traverse le col
    const climb = col.climbs[0]; // Utiliser la première ascension définie
    const startLat = climb.startCoordinates[0];
    const startLng = climb.startCoordinates[1];
    const endLat = colLat;
    const endLng = colLng;
    
    // Générer des points intermédiaires
    const latStep = (endLat - startLat) / (pointsCount / 2);
    const lngStep = (endLng - startLng) / (pointsCount / 2);
    
    // Points pour la montée
    const trajectory = [];
    for (let i = 0; i < pointsCount / 2; i++) {
      const lat = startLat + latStep * i;
      const lng = startLng + lngStep * i;
      trajectory.push([lng, lat]); // API attend [longitude, latitude]
    }
    
    // Ajouter des points pour la descente (de l'autre côté du col)
    if (col.climbs.length > 1) {
      // Si on a une deuxième ascension, l'utiliser pour la descente
      const descent = col.climbs[1];
      const descent_endLat = descent.startCoordinates[0];
      const descent_endLng = descent.startCoordinates[1];
      
      const descent_latStep = (descent_endLat - colLat) / (pointsCount / 2);
      const descent_lngStep = (descent_endLng - colLng) / (pointsCount / 2);
      
      for (let i = 1; i <= pointsCount / 2; i++) {
        const lat = colLat + descent_latStep * i;
        const lng = colLng + descent_lngStep * i;
        trajectory.push([lng, lat]);
      }
    } else {
      // Sinon, descendre dans la direction opposée
      const descent_latStep = -(endLat - startLat) / (pointsCount / 2);
      const descent_lngStep = -(endLng - startLng) / (pointsCount / 2);
      
      for (let i = 1; i <= pointsCount / 2; i++) {
        const lat = colLat + descent_latStep * i;
        const lng = colLng + descent_lngStep * i;
        trajectory.push([lng, lat]);
      }
    }
    
    console.log(`Envoi de ${trajectory.length} points à l'API`);
    
    // Récupérer les élévations depuis l'API
    const response = await fetchElevationProfile(trajectory);
    
    if (!response || !response.geometry) {
      throw new Error("Format de réponse invalide ou manquant de l'API OpenRouteService");
    }
    
    // Transformer les données en points d'élévation
    const points = [];
    let cumulativeDistance = 0;
    let prevLat = null;
    let prevLng = null;
    
    response.geometry.forEach((point, index) => {
      const lng = point[0];
      const lat = point[1];
      const elevation = point[2];
      
      // Calculer la distance depuis le point précédent
      let distance = 0;
      if (index > 0) {
        distance = calculateDistance(prevLat, prevLng, lat, lng);
        cumulativeDistance += distance;
      }
      
      points.push({
        lat,
        lng,
        elevation,
        distance,
        cumulativeDistance
      });
      
      prevLat = lat;
      prevLng = lng;
    });
    
    // Détecter les segments significatifs
    const segments = detectSegments(points);
    
    // Calculer les statistiques
    const elevationGain = calculateElevationGain(points);
    const elevationLoss = calculateElevationLoss(points);
    const minElevation = Math.min(...points.map(p => p.elevation));
    const maxElevation = Math.max(...points.map(p => p.elevation));
    
    // Créer le profil d'élévation complet
    const elevationProfile = {
      points,
      segments,
      stats: {
        elevationGain,
        elevationLoss,
        maxElevation,
        minElevation,
        totalDistance: cumulativeDistance,
        avgGradient: parseFloat(((elevationGain / (cumulativeDistance * 1000)) * 100).toFixed(2))
      },
      metadata: {
        generatedAt: new Date(),
        source: "OpenRouteService",
        pointCount: points.length,
        trackIndex: 0
      },
      colId: col._id ? col._id.toString() : undefined,
      colName: col.name
    };
    
    console.log(`✅ Profil d'élévation généré avec succès pour ${col.name}`);
    return elevationProfile;
    
  } catch (error) {
    console.error(`❌ Erreur lors de la génération du profil d'élévation pour ${col.name}:`, error.message);
    return null;
  }
}

/**
 * Calcule la distance en kilomètres entre deux points
 * @param {number} lat1 - Latitude du premier point
 * @param {number} lon1 - Longitude du premier point
 * @param {number} lat2 - Latitude du deuxième point
 * @param {number} lon2 - Longitude du deuxième point
 * @returns {number} - Distance en kilomètres
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
}

/**
 * Calcule le dénivelé positif total
 * @param {Array<Object>} points - Points du profil d'élévation
 * @returns {number} - Dénivelé positif en mètres
 */
function calculateElevationGain(points) {
  let gain = 0;
  for (let i = 1; i < points.length; i++) {
    const elevationDiff = points[i].elevation - points[i-1].elevation;
    if (elevationDiff > 0) {
      gain += elevationDiff;
    }
  }
  return parseFloat(gain.toFixed(2));
}

/**
 * Calcule le dénivelé négatif total
 * @param {Array<Object>} points - Points du profil d'élévation
 * @returns {number} - Dénivelé négatif en mètres
 */
function calculateElevationLoss(points) {
  let loss = 0;
  for (let i = 1; i < points.length; i++) {
    const elevationDiff = points[i-1].elevation - points[i].elevation;
    if (elevationDiff > 0) {
      loss += elevationDiff;
    }
  }
  return parseFloat(loss.toFixed(2));
}

/**
 * Détecte les segments significatifs (montées/descentes) dans le profil
 * @param {Array<Object>} points - Points du profil d'élévation
 * @returns {Array<Object>} - Segments détectés
 */
function detectSegments(points) {
  if (points.length < 10) return [];
  
  const segments = [];
  let currentDirection = null;
  let segmentStart = 0;
  const significantChange = 5; // Changement minimum d'élévation en mètres pour considérer un segment
  
  for (let i = 5; i < points.length; i++) {
    // Utiliser une fenêtre glissante pour éviter les petites variations
    const averageChange = (
      (points[i].elevation - points[i-5].elevation)
    ) / 5;
    
    const newDirection = averageChange > 0.5 ? 'climb' : (averageChange < -0.5 ? 'descent' : currentDirection);
    
    if (newDirection !== currentDirection && newDirection !== null) {
      // Si nous avons un segment en cours et un changement de direction
      if (currentDirection !== null) {
        const startElevation = points[segmentStart].elevation;
        const endElevation = points[i-1].elevation;
        const elevationChange = Math.abs(endElevation - startElevation);
        
        // Seulement enregistrer si le changement est significatif
        if (elevationChange >= significantChange) {
          const startDistance = points[segmentStart].cumulativeDistance;
          const endDistance = points[i-1].cumulativeDistance;
          const distance = endDistance - startDistance;
          
          // Ne pas enregistrer les segments trop courts
          if (distance >= 0.2) {
            segments.push({
              type: currentDirection,
              startIndex: segmentStart,
              endIndex: i-1,
              startElevation,
              endElevation,
              elevationChange,
              startDistance,
              endDistance,
              distance,
              gradient: parseFloat(((elevationChange / (distance * 1000)) * 100).toFixed(2)) * (currentDirection === 'climb' ? 1 : -1)
            });
          }
        }
      }
      
      segmentStart = i;
      currentDirection = newDirection;
    }
  }
  
  // Traiter le dernier segment
  if (currentDirection !== null) {
    const startElevation = points[segmentStart].elevation;
    const endElevation = points[points.length - 1].elevation;
    const elevationChange = Math.abs(endElevation - startElevation);
    
    if (elevationChange >= significantChange) {
      const startDistance = points[segmentStart].cumulativeDistance;
      const endDistance = points[points.length - 1].cumulativeDistance;
      const distance = endDistance - startDistance;
      
      if (distance >= 0.2) {
        segments.push({
          type: currentDirection,
          startIndex: segmentStart,
          endIndex: points.length - 1,
          startElevation,
          endElevation,
          elevationChange,
          startDistance,
          endDistance,
          distance,
          gradient: parseFloat(((elevationChange / (distance * 1000)) * 100).toFixed(2)) * (currentDirection === 'climb' ? 1 : -1)
        });
      }
    }
  }
  
  return segments;
}

/**
 * Fonction principale pour générer les cols optimisés avec leurs profils d'élévation
 */
async function generateOptimizedCols() {
  let client = null;
  
  try {
    console.log('=== GÉNÉRATION DE COLS OPTIMISÉS AVEC PROFILS D\'ÉLÉVATION ===');
    console.log('🚀 Démarrage du processus...');
    
    // Connexion à MongoDB
    console.log('📡 Connexion à MongoDB...');
    client = new MongoClient(MONGODB_CONFIG.uri);
    await client.connect();
    console.log('✅ Connecté à MongoDB');
    
    const db = client.db(MONGODB_CONFIG.dbName);
    const colsCollection = db.collection(MONGODB_CONFIG.collections.cols);
    
    // Vérifier si des cols existent déjà
    const existingCount = await colsCollection.countDocuments();
    console.log(`📊 ${existingCount} cols trouvés dans la base de données`);
    
    if (existingCount > 0) {
      console.log('🗑️ Suppression des cols existants...');
      await colsCollection.deleteMany({});
      console.log('✅ Cols supprimés avec succès');
    }
    
    // Ajouter les timestamps aux cols
    const colsWithTimestamps = OPTIMIZED_COLS.map(col => ({
      ...col,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    // Insérer les cols de base
    console.log(`📝 Ajout de ${colsWithTimestamps.length} cols optimisés...`);
    const insertResult = await colsCollection.insertMany(colsWithTimestamps);
    console.log(`✅ ${insertResult.insertedCount} cols insérés avec succès`);
    
    // Récupérer les cols insérés avec leurs IDs
    const insertedCols = await colsCollection.find({}).toArray();
    
    // Générer les profils d'élévation pour chaque col
    console.log('🔄 Génération des profils d\'élévation...');
    
    for (let i = 0; i < insertedCols.length; i++) {
      const col = insertedCols[i];
      console.log(`\n📊 Col ${i+1}/${insertedCols.length}: ${col.name}`);
      
      try {
        // Ajouter un délai entre les requêtes à l'API pour éviter le rate limiting
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
        
        // Générer le profil d'élévation
        const profile = await generateElevationProfile(col);
        
        if (profile) {
          // Mettre à jour le col avec son profil d'élévation
          await colsCollection.updateOne(
            { _id: col._id },
            { $set: { elevation_profile: profile, updatedAt: new Date() } }
          );
          console.log(`✅ Profil d'élévation enregistré pour ${col.name}`);
        } else {
          console.error(`❌ Aucun profil généré pour ${col.name}`);
        }
      } catch (error) {
        console.error(`❌ Erreur pour ${col.name}:`, error.message);
      }
    }
    
    // Vérifier le résultat final
    const colsWithProfiles = await colsCollection.countDocuments({
      elevation_profile: { $exists: true, $ne: null }
    });
    
    console.log('\n=== RÉSUMÉ ===');
    console.log(`✅ ${colsWithProfiles} cols avec profils d'élévation sur ${insertedCols.length} cols`);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    if (client) {
      console.log('\nFermeture de la connexion MongoDB...');
      await client.close();
      console.log('Connexion fermée.');
    }
  }
}

// Exécuter la fonction
generateOptimizedCols()
  .then(() => console.log('Script terminé'))
  .catch(error => console.error('Erreur non gérée:', error));
