/**
 * Script d'enrichissement des données des cols
 * Génère des profils d'élévation et des données complémentaires sans dépendre d'API externes
 */

const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Charger les variables d'environnement
dotenv.config();

// Configuration MongoDB
const MONGODB_CONFIG = {
  uri: process.env.MONGODB_URI || "mongodb+srv://veloaltitude:veloaltitude2025@cluster0grandest.mongodb.net/velo-altitude?retryWrites=true&w=majority",
  dbName: "velo-altitude",
  collections: {
    cols: "cols"
  }
};

/**
 * Génère un profil d'élévation synthétique pour un col basé sur ses caractéristiques connues
 * @param {Object} options - Options pour la génération
 * @returns {Object} - Le profil d'élévation généré
 */
function generateElevationProfile(options) {
  const { startPoint, length, elevation, avgGradient, maxGradient } = options;
  const pointsPerKm = options.pointsPerKm || 10;
  const totalPoints = Math.ceil(length * pointsPerKm);
  
  console.log(`Génération d'un profil avec ${totalPoints} points`);
  
  // Créer des points d'élévation réalistes
  const points = [];
  let cumulativeDistance = 0;
  
  // Altitude de départ (environ 30-40% de l'altitude maximale du col)
  const startElevation = Math.round(elevation * 0.35);
  
  // Définir quelques points de variation de pente pour un profil réaliste
  const variationPoints = [];
  const numVariations = Math.floor(length / 3) + 1; // Un changement tous les ~3km
  
  for (let i = 0; i < numVariations; i++) {
    const position = i / numVariations;
    // Générer des variations de pente autour de la pente moyenne
    const gradientFactor = i === numVariations - 1 
      ? 0.7 // La fin est généralement moins pentue
      : (Math.random() * 0.5 + 0.75); // Entre 75% et 125% de la pente moyenne
      
    variationPoints.push({
      position,
      gradientFactor
    });
  }
  
  // Générer les points du profil
  for (let i = 0; i < totalPoints; i++) {
    const position = i / (totalPoints - 1);
    
    // Trouver la variation de pente applicable à cette position
    let gradientFactor = 1;
    for (let j = 0; j < variationPoints.length - 1; j++) {
      if (position >= variationPoints[j].position && position < variationPoints[j + 1].position) {
        // Interpolation linéaire entre deux points de variation
        const ratio = (position - variationPoints[j].position) / 
          (variationPoints[j + 1].position - variationPoints[j].position);
        
        gradientFactor = variationPoints[j].gradientFactor * (1 - ratio) + 
          variationPoints[j + 1].gradientFactor * ratio;
        break;
      }
    }
    
    // Calculer la distance depuis le point précédent
    const distanceStep = length / (totalPoints - 1);
    
    // Ajouter un peu de variation aléatoire à la distance
    const jitteredDistance = distanceStep * (0.95 + Math.random() * 0.1);
    
    if (i > 0) {
      cumulativeDistance += jitteredDistance;
    }
    
    // Calculer l'élévation basée sur la distance parcourue et la pente
    // On ajoute une petite variation aléatoire pour un profil plus réaliste
    const normalizedPosition = position < 0.9 ? position / 0.9 : 1; // Ralentir l'augmentation vers la fin
    const baseElevation = startElevation + (elevation - startElevation) * Math.pow(normalizedPosition, 0.9);
    
    // Ajouter une ondulation naturelle au terrain
    const undulation = Math.sin(position * Math.PI * 8) * 5 * (1 - position);
    
    // Calculer l'élévation finale
    const pointElevation = baseElevation + undulation;
    
    // Calculer les coordonnées approximatives (simplifiées pour l'exemple)
    // En pratique, il faudrait utiliser une vraie projection géographique
    const lat = startPoint[0] + (position * 0.015) * (Math.random() * 0.01 - 0.005);
    const lng = startPoint[1] + (position * 0.015) * (Math.random() * 0.01 - 0.005);
    
    points.push({
      lat,
      lng,
      elevation: Math.round(pointElevation * 10) / 10,
      distance: jitteredDistance,
      cumulativeDistance: Math.round(cumulativeDistance * 100) / 100,
      gradient: i > 0 ? calculateGradient(points[i-1].elevation, pointElevation, jitteredDistance) : 0
    });
  }
  
  // Détecter les segments significatifs du profil
  const segments = detectSegments(points);
  
  // Calculer les statistiques globales
  const elevationGain = calculateElevationGain(points);
  const elevationLoss = calculateElevationLoss(points);
  const minElevation = Math.min(...points.map(p => p.elevation));
  const maxElevation = Math.max(...points.map(p => p.elevation));
  
  return {
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
      source: "synthetic",
      algorithm: "terrain-aware-simulation",
      pointCount: points.length,
      trackIndex: 0
    }
  };
}

/**
 * Calcule la pente entre deux points
 * @param {number} elevation1 - Élévation du premier point (m)
 * @param {number} elevation2 - Élévation du deuxième point (m)
 * @param {number} distance - Distance entre les points (km)
 * @returns {number} - Pente en pourcentage
 */
function calculateGradient(elevation1, elevation2, distance) {
  const elevationDiff = elevation2 - elevation1;
  return parseFloat(((elevationDiff / (distance * 1000)) * 100).toFixed(2));
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
 * Détecte les segments significatifs du profil d'élévation
 * @param {Array<Object>} points - Points du profil
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
 * Génère un bounding box autour des coordonnées du col
 * @param {Array<number>} coordinates - Coordonnées [lat, lon] du col
 * @param {number} length - Longueur du col en km
 * @returns {Object} - Bounding box du col
 */
function calculateBoundingBox(coordinates, length) {
  // Approximation: 1 degré ~ 111km à l'équateur
  // Nous ajoutons une marge pour couvrir la zone du col
  const marginLatLon = length / 111 * 1.5;
  
  return {
    north: coordinates[0] + marginLatLon / 2,
    south: coordinates[0] - marginLatLon / 2,
    east: coordinates[1] + marginLatLon / 2,
    west: coordinates[1] - marginLatLon / 2,
  };
}

/**
 * Génère des caractéristiques de terrain pour un col
 * @param {Object} col - Le col
 * @returns {Array<Object>} - Caractéristiques du terrain
 */
function generateTerrainFeatures(col) {
  const features = [];
  
  // Points de vue aux changements de pente significatifs
  if (col.maxGradient > 8) {
    // Position du point de vue à environ 70% de la montée
    const viewpointPosition = [
      col.coordinates[0] + (Math.random() * 0.001 - 0.0005),
      col.coordinates[1] + (Math.random() * 0.001 - 0.0005)
    ];
    
    features.push({
      type: 'viewpoint',
      position: viewpointPosition,
      description: `Point de vue panoramique à ${Math.round(col.elevation * 0.7)}m d'altitude`,
      properties: {
        panoramaUrl: null, // Pourrait être défini plus tard
        visibilityRange: Math.round(10 + Math.random() * 20), // 10-30km
        pointsOfInterest: []
      }
    });
  }
  
  // Abris/refuges basés sur la longueur et l'altitude
  if (col.length > 15 || col.elevation > 2000) {
    // Position du refuge à environ 60% de la montée
    const shelterPosition = [
      col.coordinates[0] + (Math.random() * 0.002 - 0.001),
      col.coordinates[1] + (Math.random() * 0.002 - 0.001)
    ];
    
    features.push({
      type: 'shelter',
      position: shelterPosition,
      description: `Refuge à ${Math.round(col.elevation * 0.6)}m d'altitude`,
      properties: {
        name: `Refuge du ${col.name.split(' ').pop()}`,
        capacity: Math.round(10 + Math.random() * 40), // 10-50 personnes
        facilities: ['water'],
        openingPeriod: 'Mai à Octobre'
      }
    });
  }
  
  // Caractéristiques géologiques pour les cols très élevés
  if (col.elevation > 2200) {
    features.push({
      type: 'geological',
      description: 'Formation rocheuse remarquable',
      position: [
        col.coordinates[0] + (Math.random() * 0.003 - 0.0015),
        col.coordinates[1] + (Math.random() * 0.003 - 0.0015)
      ],
      properties: {
        type: Math.random() > 0.5 ? 'rock_formation' : 'glacial_feature',
        name: `${Math.random() > 0.5 ? 'Aiguille' : 'Éperon'} du ${col.name.split(' ').pop()}`
      }
    });
  }
  
  return features;
}

/**
 * Génère des données environnementales pour un col
 * @param {Object} col - Le col
 * @returns {Object} - Données environnementales
 */
function generateEnvironmentData(col) {
  // Déterminer les zones de végétation en fonction de l'altitude
  const vegetationZones = [];
  
  // Zones de végétation typiques dans les montagnes européennes
  if (col.elevation < 1000) {
    vegetationZones.push({
      type: 'forest',
      elevationRange: [0, 1000],
      dominantSpecies: ['oak', 'beech', 'pine'],
      density: 0.8
    });
  } else if (col.elevation < 1800) {
    vegetationZones.push({
      type: 'forest',
      elevationRange: [0, 1000],
      dominantSpecies: ['oak', 'beech', 'pine'],
      density: 0.8
    });
    
    vegetationZones.push({
      type: 'coniferous_forest',
      elevationRange: [1000, 1800],
      dominantSpecies: ['spruce', 'fir', 'larch'],
      density: 0.7
    });
  } else {
    vegetationZones.push({
      type: 'forest',
      elevationRange: [0, 1000],
      dominantSpecies: ['oak', 'beech', 'pine'],
      density: 0.8
    });
    
    vegetationZones.push({
      type: 'coniferous_forest',
      elevationRange: [1000, 1800],
      dominantSpecies: ['spruce', 'fir', 'larch'],
      density: 0.7
    });
    
    vegetationZones.push({
      type: 'alpine_meadow',
      elevationRange: [1800, 2400],
      dominantSpecies: ['alpine_grass', 'edelweiss', 'gentian'],
      density: 0.5
    });
  }
  
  if (col.elevation > 2400) {
    vegetationZones.push({
      type: 'rock',
      elevationRange: [2400, 3500],
      dominantSpecies: ['lichen', 'moss'],
      density: 0.2
    });
  }
  
  // Données climatiques approximatives basées sur l'altitude et la région
  let climateProfile;
  
  if (col.region.includes('Alpes') || col.region === 'Savoie' || col.region === 'Haute-Savoie' || col.region === 'Isère') {
    climateProfile = {
      type: 'alpine',
      averageTemperature: 15 - (col.elevation / 300), // Baisse d'environ 1°C tous les 300m
      precipitationMonthly: [100, 90, 100, 120, 130, 120, 100, 120, 100, 120, 150, 120],
      snowMonths: col.elevation > 1500 ? [11, 12, 1, 2, 3, 4] : [12, 1, 2, 3],
      windSpeed: 10 + (col.elevation / 200), // Plus venteux en altitude
      sunnyDays: 180 - (col.elevation / 100) // Moins ensoleillé en altitude
    };
  } else if (col.region.includes('Pyrénées') || col.country === 'Spain') {
    climateProfile = {
      type: 'continental',
      averageTemperature: 17 - (col.elevation / 300),
      precipitationMonthly: [80, 70, 90, 100, 110, 80, 60, 70, 90, 110, 120, 90],
      snowMonths: col.elevation > 1800 ? [11, 12, 1, 2, 3] : [12, 1, 2],
      windSpeed: 8 + (col.elevation / 250),
      sunnyDays: 210 - (col.elevation / 100) // Plus ensoleillé que les Alpes
    };
  } else {
    climateProfile = {
      type: 'temperate',
      averageTemperature: 16 - (col.elevation / 300),
      precipitationMonthly: [90, 80, 90, 100, 110, 90, 80, 90, 100, 110, 130, 100],
      snowMonths: col.elevation > 1600 ? [12, 1, 2, 3] : [1, 2],
      windSpeed: 9 + (col.elevation / 220),
      sunnyDays: 195 - (col.elevation / 100)
    };
  }
  
  return {
    vegetation: {
      zones: vegetationZones
    },
    climate: climateProfile,
    terrain: {
      type: col.elevation > 2200 ? 'rocky' : col.elevation > 1800 ? 'alpine' : 'forested',
      features: generateTerrainFeatures(col)
    }
  };
}

/**
 * Enrichit les données d'un col avec des profils d'élévation et des données environnementales
 * @param {Object} col - Le col à enrichir
 * @returns {Object} - Le col enrichi
 */
async function enrichColData(col) {
  console.log(`\n🔄 Enrichissement des données pour ${col.name}`);
  
  try {
    // 1. Générer le profil d'élévation
    console.log('📊 Génération du profil d\'élévation...');
    const elevationProfile = generateElevationProfile({
      startPoint: col.coordinates,
      length: col.length,
      elevation: col.elevation,
      avgGradient: col.avgGradient,
      maxGradient: col.maxGradient,
      pointsPerKm: 10 // Un point tous les 100m
    });
    
    // 2. Générer les données de terrain
    console.log('🏔️ Génération des données de terrain...');
    const terrain = {
      boundingBox: calculateBoundingBox(col.coordinates, col.length),
      resolution: 30, // 30m de résolution, standard pour les données topographiques
      textureMap: `https://terrain-textures.velo-altitude.com/${col._id}/texture.jpg`,
      normalMap: `https://terrain-textures.velo-altitude.com/${col._id}/normal.jpg`,
      heightMap: `https://terrain-textures.velo-altitude.com/${col._id}/height.jpg`,
      features: generateTerrainFeatures(col)
    };
    
    // 3. Générer les données environnementales
    console.log('🌿 Génération des données environnementales...');
    const environment = generateEnvironmentData(col);
    
    // 4. Assembler le col enrichi
    const enrichedCol = {
      ...col,
      elevation_profile: elevationProfile,
      visualization3D: {
        terrain,
        environment,
        renderSettings: {
          quality: 'medium',
          textureResolution: 2048,
          shadowQuality: 'medium',
          vegetationDensity: 0.7,
          waterEffects: true,
          atmosphericEffects: true
        }
      },
      metadata: {
        lastUpdated: new Date(),
        dataVersion: '1.0',
        dataSource: ['synthetic_elevation', 'calculated_terrain'],
        verificationStatus: 'unverified'
      }
    };
    
    console.log('✅ Enrichissement terminé');
    return enrichedCol;
    
  } catch (error) {
    console.error(`❌ Erreur lors de l'enrichissement pour ${col.name}:`, error.message);
    throw error;
  }
}

/**
 * Fonction principale pour enrichir tous les cols dans la base de données
 */
async function enrichAllCols() {
  let client = null;
  
  try {
    console.log('=== ENRICHISSEMENT DES DONNÉES DES COLS ===');
    console.log('🚀 Démarrage du processus...');
    
    // Connexion à MongoDB
    console.log('📡 Connexion à MongoDB...');
    client = new MongoClient(MONGODB_CONFIG.uri);
    await client.connect();
    console.log('✅ Connecté à MongoDB');
    
    const db = client.db(MONGODB_CONFIG.dbName);
    const colsCollection = db.collection(MONGODB_CONFIG.collections.cols);
    
    // Récupérer tous les cols
    const cols = await colsCollection.find({}).toArray();
    console.log(`📊 ${cols.length} cols trouvés dans la base de données`);
    
    if (cols.length === 0) {
      // Créer quelques cols de test si aucun n'existe
      console.log('📝 Création de cols de test...');
      
      const testCols = [
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
          tags: ["tour-de-france", "mythique", "alpes"],
          createdAt: new Date(),
          updatedAt: new Date()
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
          tags: ["tour-de-france", "mythique", "21-virages"],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      const insertResult = await colsCollection.insertMany(testCols);
      console.log(`✅ ${insertResult.insertedCount} cols de test insérés`);
      
      const insertedCols = await colsCollection.find({}).toArray();
      cols.push(...insertedCols);
    }
    
    // Enrichir chaque col
    console.log('\n🔄 Enrichissement des cols...');
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < cols.length; i++) {
      try {
        const col = cols[i];
        console.log(`\n📊 Col ${i+1}/${cols.length}: ${col.name}`);
        
        // Ajouter un délai entre chaque col
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Enrichir le col
        const enrichedCol = await enrichColData(col);
        
        // Mettre à jour le col dans la base de données
        await colsCollection.updateOne(
          { _id: col._id },
          { 
            $set: {
              elevation_profile: enrichedCol.elevation_profile,
              visualization3D: enrichedCol.visualization3D,
              metadata: enrichedCol.metadata,
              updatedAt: new Date()
            }
          }
        );
        
        console.log(`✅ Col ${col.name} mis à jour dans la base de données`);
        successCount++;
      } catch (error) {
        console.error(`❌ Erreur pour le col ${i+1}/${cols.length}:`, error.message);
        errorCount++;
      }
    }
    
    // Vérifier le résultat final
    const colsWithProfiles = await colsCollection.countDocuments({
      elevation_profile: { $exists: true, $ne: null }
    });
    
    const colsWith3D = await colsCollection.countDocuments({
      visualization3D: { $exists: true, $ne: null }
    });
    
    console.log('\n=== RÉSUMÉ ===');
    console.log(`✅ ${successCount} cols enrichis avec succès`);
    console.log(`❌ ${errorCount} cols en erreur`);
    console.log(`📊 ${colsWithProfiles} cols avec profils d'élévation`);
    console.log(`🏔️ ${colsWith3D} cols avec données 3D`);
    
  } catch (error) {
    console.error('❌ Erreur globale:', error);
  } finally {
    if (client) {
      console.log('\nFermeture de la connexion MongoDB...');
      await client.close();
      console.log('Connexion fermée.');
    }
  }
}

// Exécuter la fonction principale
enrichAllCols()
  .then(() => console.log('Script terminé'))
  .catch(error => console.error('Erreur non gérée:', error));
