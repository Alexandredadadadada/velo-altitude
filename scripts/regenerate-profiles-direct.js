/**
 * Script de régénération directe des profils d'élévation pour les cols
 * Ce script se connecte directement à MongoDB pour extraire les cols et mettre à jour leurs profils d'élévation
 */

const { MongoClient, ObjectId } = require('mongodb');
const https = require('https');
const dotenv = require('dotenv');

// Charger les variables d'environnement
dotenv.config();

// Configuration MongoDB - URI exacte pour se connecter au cluster avec 50 cols
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

/**
 * Fonction pour récupérer le profil d'élévation depuis l'API OpenRouteService
 * @param {Array<Array<number>>} coordinates - Les coordonnées [longitude, latitude] des points du trajet
 * @returns {Promise<Object>} - Le profil d'élévation
 */
async function fetchElevationProfile(coordinates) {
  return new Promise((resolve, reject) => {
    // Limiter le nombre de points à 500 pour respecter les limitations de l'API
    const limitedCoordinates = coordinates.length > 500 
      ? coordinates.filter((_, idx) => idx % Math.ceil(coordinates.length / 500) === 0) 
      : coordinates;
    
    // Format selon la documentation officielle
    const data = JSON.stringify({
      format_in: "polyline",
      format_out: "geojson",
      geometry: limitedCoordinates
    });
    
    console.log(`Envoi de ${limitedCoordinates.length} points à l'API`);
    
    const options = {
      hostname: "api.openrouteservice.org",
      port: 443,
      path: "/elevation/line",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": ORS_API_KEY,
        "Accept": "application/json, application/geo+json",
        "Content-Length": Buffer.byteLength(data)
      }
    };
    
    const req = https.request(options, (res) => {
      let responseData = "";
      
      res.on("data", (chunk) => {
        responseData += chunk;
      });
      
      res.on("end", () => {
        if (res.statusCode === 200) {
          try {
            const result = JSON.parse(responseData);
            resolve(result);
          } catch (err) {
            reject(new Error(`Erreur lors du parsing de la réponse: ${err.message}`));
          }
        } else {
          reject(new Error(`Erreur API (${res.statusCode}): ${responseData}`));
        }
      });
    });
    
    req.on("error", (err) => {
      reject(new Error(`Erreur de requête: ${err.message}`));
    });
    
    req.write(data);
    req.end();
  });
}

/**
 * Transforme les données de l'API en un profil d'élévation structuré
 * @param {Object} apiResponse - La réponse de l'API OpenRouteService
 * @returns {Object} - Le profil d'élévation structuré
 */
function processElevationData(apiResponse) {
  try {
    // Vérifier le format de la réponse pour extraire les coordonnées avec les élévations
    let coordinates = [];
    
    // Format de réponse GeoJSON
    if (apiResponse.geometry && apiResponse.geometry.coordinates) {
      coordinates = apiResponse.geometry.coordinates;
    } else if (apiResponse.features && apiResponse.features.length > 0 && 
               apiResponse.features[0].geometry && apiResponse.features[0].geometry.coordinates) {
      coordinates = apiResponse.features[0].geometry.coordinates;
    } else if (apiResponse.coordinates) {
      coordinates = apiResponse.coordinates;
    }
    
    if (!coordinates.length) {
      console.log("Réponse API: ", JSON.stringify(apiResponse, null, 2));
      throw new Error("Aucune donnée de coordonnées dans la réponse");
    }
    
    // Construire le profil d'élévation
    const points = coordinates.map((point, index) => {
      // Vérifier si point contient les coordonnées [longitude, latitude, élévation]
      if (!Array.isArray(point) || point.length < 3) {
        console.error(`Point invalide à l'index ${index}:`, point);
        return {
          distance: 0,
          elevation: 0,
          lat: 0,
          lng: 0
        };
      }
      
      return {
        distance: index > 0 && coordinates[index-1] && coordinates[index-1].length >= 2
          ? calculateDistance(
              coordinates[index-1][1], coordinates[index-1][0], 
              point[1], point[0]
            ) 
          : 0,
        elevation: point[2] || 0,
        lat: point[1] || 0,
        lng: point[0] || 0
      };
    });
    
    // Filtrer les points invalides
    const validPoints = points.filter(p => p.lat !== 0 || p.lng !== 0);
    
    if (validPoints.length === 0) {
      throw new Error("Aucun point valide dans les données d'élévation");
    }
    
    // Calculer la distance cumulée
    let cumulativeDistance = 0;
    validPoints.forEach((point, index) => {
      cumulativeDistance += point.distance;
      validPoints[index].cumulativeDistance = cumulativeDistance;
    });
    
    // Détecter les segments (montées et descentes significatives)
    const segments = detectSegments(validPoints);
    
    // Calculer les statistiques
    const elevationGain = calculateElevationGain(validPoints);
    const elevationLoss = calculateElevationLoss(validPoints);
    const maxElevation = Math.max(...validPoints.map(p => p.elevation));
    const minElevation = Math.min(...validPoints.map(p => p.elevation));
    const avgGradient = cumulativeDistance > 0 
      ? (elevationGain / (cumulativeDistance * 1000)) * 100 
      : 0;
    
    return {
      points: validPoints,
      segments,
      stats: {
        elevationGain,
        elevationLoss,
        maxElevation,
        minElevation,
        totalDistance: cumulativeDistance,
        avgGradient: parseFloat(avgGradient.toFixed(2))
      },
      metadata: {
        generatedAt: new Date(),
        source: "OpenRouteService",
        pointCount: validPoints.length
      }
    };
  } catch (error) {
    throw new Error(`Erreur lors du traitement des données d'élévation: ${error.message}`);
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
 * Régénère le profil d'élévation pour un col
 * @param {Object} col - Le col à traiter
 * @param {MongoClient} client - Client MongoDB
 * @returns {Promise<Object>} - Résultat de la régénération
 */
async function regenerateColProfile(col, client) {
  try {
    // S'assurer que les coordonnées sont valides
    if (!col.coordinates || col.coordinates.length !== 2) {
      throw new Error(`Coordonnées invalides pour le col ${col.name}`);
    }

    // Si le col a des montées définies, utiliser les coordonnées des montées
    const climbsTracks = [];
    
    if (col.climbs && col.climbs.length > 0) {
      for (const climb of col.climbs) {
        // Vérifier si nous avons des coordonnées de départ et d'arrivée valides
        if (climb.startCoordinates && climb.startCoordinates.length === 2 &&
            climb.endCoordinates && climb.endCoordinates.length === 2) {
          // Inverser lat/lng pour l'API qui attend [lng, lat]
          climbsTracks.push([
            [climb.startCoordinates[1], climb.startCoordinates[0]],
            [climb.endCoordinates[1], climb.endCoordinates[0]]
          ]);
        }
      }
    }
    
    // Si nous n'avons pas de traces valides depuis les montées, utiliser les coordonnées du col
    // et créer un trajet synthétique en ajoutant des points virtuels
    if (climbsTracks.length === 0) {
      // Coordonnées centrales du col
      const colLat = col.coordinates[0];
      const colLng = col.coordinates[1];
      
      // Créer un petit trajet artificiel autour du col (1km dans plusieurs directions)
      const syntheticTrack = [];
      
      // Générer des points le long d'une montée fictive (baisse de 300m d'altitude sur 5km)
      const pointCount = 20;
      const distanceStepLat = 0.02 / pointCount; // environ 2km au total
      const distanceStepLng = 0.01 / pointCount; // environ 1km au total
      
      for (let i = 0; i < pointCount; i++) {
        // Partir d'en bas et monter vers le sommet
        const lat = colLat - distanceStepLat * (pointCount - i);
        const lng = colLng - distanceStepLng * (pointCount - i);
        syntheticTrack.push([lng, lat]);
      }
      
      // Point central (sommet)
      syntheticTrack.push([colLng, colLat]);
      
      // Créer une descente de l'autre côté
      for (let i = 0; i < pointCount; i++) {
        const lat = colLat + distanceStepLat * (i + 1);
        const lng = colLng + distanceStepLng * (i + 1);
        syntheticTrack.push([lng, lat]);
      }
      
      climbsTracks.push(syntheticTrack);
    }
    
    // Traiter chaque trace
    const profiles = [];
    
    for (let i = 0; i < climbsTracks.length; i++) {
      const track = climbsTracks[i];
      
      console.log(`🔄 Récupération du profil d'élévation pour ${col.name} - trace ${i+1}/${climbsTracks.length}...`);
      
      try {
        // Récupérer les données d'élévation depuis l'API
        const elevationData = await fetchElevationProfile(track);
        
        // Traiter les données en un format structuré
        const profile = processElevationData(elevationData);
        
        // Ajouter des métadonnées supplémentaires
        profile.colId = col._id.toString();
        profile.colName = col.name;
        profile.metadata.trackIndex = i;
        
        profiles.push(profile);
        
      } catch (error) {
        console.error(`❌ Erreur lors de la récupération/traitement du profil pour ${col.name} - trace ${i+1}: ${error.message}`);
      }
    }
    
    // Si nous avons au moins un profil valide, mettre à jour le col
    if (profiles.length > 0) {
      // Mettre à jour le document col dans la base de données
      const db = client.db(MONGODB_CONFIG.dbName);
      const colsCollection = db.collection(MONGODB_CONFIG.collections.cols);
      
      await colsCollection.updateOne(
        { _id: col._id },
        { 
          $set: { 
            elevationProfiles: profiles,
            updatedAt: new Date()
          } 
        }
      );
      
      console.log(`✅ Profil d'élévation mis à jour pour ${col.name}`);
      return { colId: col._id.toString(), success: true, profileCount: profiles.length };
    } else {
      console.error(`❌ Aucun profil valide généré pour ${col.name}`);
      return { colId: col._id.toString(), success: false, error: "Aucun profil valide généré" };
    }
    
  } catch (error) {
    console.error(`❌ Erreur lors de la régénération du profil pour ${col.name}: ${error.message}`);
    return { colId: col._id.toString(), success: false, error: error.message };
  }
}

/**
 * Régénère les profils d'élévation pour tous les cols
 */
async function regenerateAllProfiles() {
  let client = null;
  
  try {
    console.log('=== RÉGÉNÉRATION DES PROFILS D\'ÉLÉVATION DES COLS ===');
    console.log('🚀 Démarrage du processus de régénération des profils d\'élévation...');
    
    // Connexion à MongoDB
    console.log('📡 Connexion à MongoDB...');
    client = new MongoClient(MONGODB_CONFIG.uri);
    await client.connect();
    console.log('✅ Connecté à MongoDB');
    
    const db = client.db(MONGODB_CONFIG.dbName);
    const colsCollection = db.collection(MONGODB_CONFIG.collections.cols);
    
    // Récupérer tous les cols
    console.log('📚 Récupération des cols depuis la base de données...');
    const cols = await colsCollection.find({}).toArray();
    console.log(`📊 ${cols.length} cols trouvés`);
    
    if (cols.length === 0) {
      console.warn('⚠️ Aucun col trouvé. Vérifiez la connexion et les permissions.');
      return;
    }
    
    // Limiter le nombre de cols à traiter 
    // On peut utiliser une variable d'environnement pour limiter si nécessaire, sinon on prend tous les cols (max 50)
    const MAX_COLS = process.env.MAX_COLS ? parseInt(process.env.MAX_COLS) : Math.min(cols.length, 50);
    const colsToProcess = cols.slice(0, MAX_COLS);
    
    console.log(`🔄 Régénération des profils pour ${colsToProcess.length} cols...`);
    console.log(`⚠️ Attention: l'API OpenRouteService a une limite de 200 requêtes au total et 40 par minute.`);
    
    // Traiter les cols un par un pour éviter de surcharger l'API
    const results = [];
    let successCount = 0;
    let errorCount = 0;
    let requestsCount = 0;
    let minuteStartTime = Date.now();
    
    for (let i = 0; i < colsToProcess.length; i++) {
      const col = colsToProcess[i];
      console.log(`\n🔄 Traitement du col ${i+1}/${colsToProcess.length}: ${col.name}`);
      
      try {
        // Vérifier si nous devons réinitialiser le compteur de requêtes par minute
        const currentTime = Date.now();
        if (currentTime - minuteStartTime > 60000) {
          // Réinitialiser le compteur après 1 minute
          minuteStartTime = currentTime;
          requestsCount = 0;
        }
        
        // Respecter la limite de requêtes par minute (40 par minute)
        if (requestsCount >= 35) { // On garde une marge de sécurité
          const timeToWait = 60000 - (currentTime - minuteStartTime) + 2000; // Attendre la fin de la minute + 2s de marge
          console.log(`⏳ Attente de ${timeToWait/1000}s pour respecter les limites d'API (40 req/min)...`);
          await new Promise(resolve => setTimeout(resolve, timeToWait));
          minuteStartTime = Date.now();
          requestsCount = 0;
        }
        
        // Ajouter un délai entre les requêtes pour éviter de surcharger l'API
        if (i > 0) {
          const delay = 1500; // 1.5s entre chaque col pour rester sous la limite de 40/min
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        // Incrémenter le compteur de requêtes
        requestsCount++;
        
        // Régénérer le profil d'élévation
        const result = await regenerateColProfile(col, client);
        results.push(result);
        
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
        
        // Afficher un résumé intermédiaire tous les 10 cols
        if ((i + 1) % 10 === 0 || i === colsToProcess.length - 1) {
          console.log(`\n--- Résumé intermédiaire (${i + 1}/${colsToProcess.length}) ---`);
          console.log(`✅ ${successCount} cols mis à jour avec succès`);
          console.log(`❌ ${errorCount} cols en erreur`);
        }
        
      } catch (error) {
        console.error(`❌ Erreur lors du traitement du col ${col.name}: ${error.message}`);
        results.push({ colId: col._id.toString(), success: false, error: error.message });
        errorCount++;
      }
    }
    
    // Afficher le résumé final
    console.log('\n=== RÉSUMÉ FINAL ===');
    console.log(`✅ ${successCount} cols mis à jour avec succès`);
    console.log(`❌ ${errorCount} cols en erreur`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la régénération des profils:', error);
  } finally {
    if (client) {
      console.log('Fermeture de la connexion MongoDB...');
      await client.close();
      console.log('Connexion fermée.');
    }
  }
}

// Exécuter le script
regenerateAllProfiles()
  .then(() => console.log('Script terminé'))
  .catch(error => console.error('Erreur non gérée:', error));
