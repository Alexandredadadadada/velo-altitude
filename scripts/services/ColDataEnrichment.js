/**
 * Service d'enrichissement des données de cols
 * Contient les algorithmes de génération des données d'élévation, de terrain et météo
 */

/**
 * Génère un profil d'élévation pour un col
 * @param {import('./types').ColBase} col - Col de base
 * @returns {import('./types').ElevationProfile} - Profil d'élévation généré
 */
function generateElevationProfile(col) {
  // Nombre de points par kilomètre
  const pointsPerKm = 20;
  // Nombre total de points
  const totalPoints = Math.ceil(col.length * pointsPerKm);
  
  // Points du profil d'élévation
  const points = [];
  // Segments détectés (montées, descentes, plateaux)
  const segments = [];
  
  // Élévation de départ approximative basée sur l'altitude du sommet et la pente moyenne
  const estimatedStartElevation = col.elevation - (col.avgGradient * col.length * 10);
  
  // Génération des points d'élévation
  for (let i = 0; i < totalPoints; i++) {
    const distance = i / pointsPerKm;
    
    // Progression relative (0 au départ, 1 au sommet)
    const progress = distance / col.length;
    
    // Variation aléatoire pour rendre le profil plus réaliste
    const randomVariation = (Math.random() - 0.5) * 0.2;
    
    // Élévation calculée avec une fonction non-linéaire pour simuler des variations de pente
    let elevationFactor;
    
    if (col.difficulty === 'extreme') {
      // Profil très irrégulier pour les cols extrêmes
      elevationFactor = Math.pow(progress, 0.7) + 0.1 * Math.sin(progress * 10) + randomVariation * 0.5;
    } else if (col.difficulty === 'hard') {
      // Profil avec des passages difficiles pour les cols difficiles
      elevationFactor = Math.pow(progress, 0.8) + 0.05 * Math.sin(progress * 8) + randomVariation * 0.4;
    } else if (col.difficulty === 'medium') {
      // Profil plus régulier pour les cols moyens
      elevationFactor = Math.pow(progress, 0.9) + 0.02 * Math.sin(progress * 6) + randomVariation * 0.3;
    } else {
      // Profil très régulier pour les cols faciles
      elevationFactor = progress + 0.01 * Math.sin(progress * 4) + randomVariation * 0.2;
    }
    
    // Ajustement pour que l'élévation finale corresponde exactement à l'élévation du col
    const elevationRange = col.elevation - estimatedStartElevation;
    const elevation = estimatedStartElevation + elevationFactor * elevationRange;
    
    // Calcul du gradient local (en pourcentage)
    let gradient;
    if (i === 0) {
      gradient = col.avgGradient * (0.8 + Math.random() * 0.4);
    } else {
      const prevElevation = points[i-1].elevation;
      const elevationChange = elevation - prevElevation;
      const distanceChange = 1 / pointsPerKm * 1000; // convert to meters
      gradient = (elevationChange / distanceChange) * 100;
    }
    
    // Limiter le gradient à une valeur réaliste basée sur le gradient maximal du col
    const maxLocalGradient = col.maxGradient * 1.2;
    gradient = Math.max(-5, Math.min(maxLocalGradient, gradient));
    
    // Interpoler les coordonnées géographiques en fonction de la progression
    const climb = col.climbs[0]; // Utiliser la première ascension disponible
    const startLat = climb.startCoordinates[0];
    const startLon = climb.startCoordinates[1];
    const endLat = climb.endCoordinates[0];
    const endLon = climb.endCoordinates[1];
    
    const lat = startLat + progress * (endLat - startLat);
    const lon = startLon + progress * (endLon - startLon);
    
    // Ajouter le point au profil
    points.push({
      distance,
      elevation,
      gradient,
      coordinates: [lat, lon]
    });
  }
  
  // Détecter les segments (montées, descentes, plateaux)
  let currentSegmentType = null;
  let segmentStartIndex = 0;
  
  for (let i = 1; i < points.length; i++) {
    const currentGradient = points[i].gradient;
    let segmentType;
    
    if (currentGradient > 1.5) segmentType = 'climb';
    else if (currentGradient < -1.5) segmentType = 'descent';
    else segmentType = 'flat';
    
    // Si c'est le début ou si le type de segment change
    if (currentSegmentType === null || segmentType !== currentSegmentType) {
      // Finir le segment précédent
      if (currentSegmentType !== null) {
        const segmentPoints = points.slice(segmentStartIndex, i);
        const segmentLength = segmentPoints[segmentPoints.length - 1].distance - segmentPoints[0].distance;
        const elevationGain = segmentPoints[segmentPoints.length - 1].elevation - segmentPoints[0].elevation;
        const avgSegmentGradient = elevationGain / (segmentLength * 10); // en pourcentage
        
        segments.push({
          type: currentSegmentType,
          startIndex: segmentStartIndex,
          endIndex: i - 1,
          startDistance: segmentPoints[0].distance,
          endDistance: segmentPoints[segmentPoints.length - 1].distance,
          length: segmentLength,
          startElevation: segmentPoints[0].elevation,
          endElevation: segmentPoints[segmentPoints.length - 1].elevation,
          elevationChange: elevationGain,
          avgGradient: avgSegmentGradient
        });
      }
      
      // Commencer un nouveau segment
      currentSegmentType = segmentType;
      segmentStartIndex = i;
    }
  }
  
  // Ajouter le dernier segment
  if (currentSegmentType !== null) {
    const segmentPoints = points.slice(segmentStartIndex);
    const segmentLength = segmentPoints[segmentPoints.length - 1].distance - segmentPoints[0].distance;
    const elevationGain = segmentPoints[segmentPoints.length - 1].elevation - segmentPoints[0].elevation;
    const avgSegmentGradient = elevationGain / (segmentLength * 10); // en pourcentage
    
    segments.push({
      type: currentSegmentType,
      startIndex: segmentStartIndex,
      endIndex: points.length - 1,
      startDistance: segmentPoints[0].distance,
      endDistance: segmentPoints[segmentPoints.length - 1].distance,
      length: segmentLength,
      startElevation: segmentPoints[0].elevation,
      endElevation: segmentPoints[segmentPoints.length - 1].elevation,
      elevationChange: elevationGain,
      avgGradient: avgSegmentGradient
    });
  }
  
  // Calculer les statistiques du profil
  const elevations = points.map(p => p.elevation);
  const minElevation = Math.min(...elevations);
  const maxElevation = Math.max(...elevations);
  const totalElevationGain = segments
    .filter(s => s.type === 'climb')
    .reduce((sum, segment) => sum + segment.elevationChange, 0);
  const totalElevationLoss = segments
    .filter(s => s.type === 'descent')
    .reduce((sum, segment) => sum + Math.abs(segment.elevationChange), 0);
  
  // Statistiques des segments par type
  const climbSegments = segments.filter(s => s.type === 'climb');
  const descentSegments = segments.filter(s => s.type === 'descent');
  const flatSegments = segments.filter(s => s.type === 'flat');
  
  const stats = {
    minElevation,
    maxElevation,
    elevationGain: totalElevationGain,
    elevationLoss: totalElevationLoss,
    segments: {
      total: segments.length,
      climb: climbSegments.length,
      descent: descentSegments.length,
      flat: flatSegments.length
    }
  };
  
  // Métadonnées du profil
  const metadata = {
    resolution: `${1000/pointsPerKm}m`,
    totalPoints,
    generatedAt: new Date(),
    algorithm: 'synthetic_generation_v2',
    pointsPerKm
  };
  
  return {
    points,
    segments,
    stats,
    metadata
  };
}

/**
 * Calcule la bounding box autour d'un point de coordonnées
 * @param {[number, number]} coordinates - Coordonnées [lat, lon]
 * @param {number} distance - Distance en km
 * @returns {Object} - Bounding box
 */
function calculateBoundingBox(coordinates, distance) {
  const [lat, lon] = coordinates;
  // Approximation: 1° de latitude = 111 km
  const latOffset = distance / 111;
  // 1° de longitude = 111 * cos(lat) km
  const lonOffset = distance / (111 * Math.cos(lat * Math.PI / 180));
  
  return {
    north: lat + latOffset,
    south: lat - latOffset,
    east: lon + lonOffset,
    west: lon - lonOffset,
    center: [lat, lon],
    width: distance * 2,
    height: distance * 2
  };
}

/**
 * Génère des caractéristiques de terrain en fonction du type de col
 * @param {import('./types').ColBase} col - Col de base
 * @returns {Array} - Caractéristiques du terrain
 */
function generateTerrainFeatures(col) {
  const features = [];
  
  // Simuler les caractéristiques en fonction de la région et de la difficulté
  const isAlpine = ['Savoie', 'Haute-Savoie', 'Isère', 'Hautes-Alpes'].includes(col.region);
  const isPyrénéen = ['Hautes-Pyrénées', 'Pyrénées-Atlantiques', 'Ariège'].includes(col.region);
  const isMediterranean = ['Var', 'Alpes-Maritimes', 'Corse'].includes(col.region);
  
  // Végétation
  if (col.elevation < 1000) {
    features.push({
      type: 'vegetation',
      density: 'high',
      varieties: isMediterranean ? ['mediterranean', 'shrubs'] : ['deciduous', 'mixed']
    });
  } else if (col.elevation < 2000) {
    features.push({
      type: 'vegetation',
      density: 'medium',
      varieties: isAlpine ? ['coniferous', 'alpine'] : ['mixed', 'subalpine']
    });
  } else {
    features.push({
      type: 'vegetation',
      density: 'low',
      varieties: ['alpine', 'rocks']
    });
  }
  
  // Caractéristiques géologiques
  if (isAlpine) {
    features.push({
      type: 'geological',
      features: ['limestone_cliffs', 'steep_ridges']
    });
  } else if (isPyrénéen) {
    features.push({
      type: 'geological',
      features: ['granite_peaks', 'sharp_ridges']
    });
  } else if (isMediterranean) {
    features.push({
      type: 'geological',
      features: ['rocky_outcrops', 'Mediterranean_scrub']
    });
  } else {
    features.push({
      type: 'geological',
      features: ['rolling_hills', 'mixed_terrain']
    });
  }
  
  // Cours d'eau
  if (col.difficulty === 'extreme' || col.difficulty === 'hard') {
    features.push({
      type: 'water',
      features: ['mountain_streams', 'waterfalls'],
      density: 'medium'
    });
  } else {
    features.push({
      type: 'water',
      features: ['small_streams'],
      density: 'low'
    });
  }
  
  return features;
}

/**
 * Génère des données de terrain pour un col
 * @param {import('./types').ColBase} col - Col de base
 * @returns {import('./types').TerrainData} - Données de terrain
 */
function generateTerrainData(col) {
  const boundingBox = calculateBoundingBox(col.coordinates, col.length * 1.5);
  const features = generateTerrainFeatures(col);
  
  // Normalized slug for file naming based on region and difficulty
  const regionSlug = col.region.toLowerCase().replace(/\s+/g, '-');
  const difficultySlug = col.difficulty.toLowerCase();
  
  return {
    boundingBox,
    features,
    textures: {
      terrain: `terrains/${regionSlug}_${difficultySlug}.jpg`,
      normal: `normals/${regionSlug}_${difficultySlug}.jpg`,
      height: `heights/${regionSlug}_${difficultySlug}.jpg`
    },
    resolution: 30, // 30m per pixel
    metadata: {
      generatedAt: new Date(),
      algorithm: 'synthetic_terrain_v2'
    }
  };
}

/**
 * Génère des données météo pour un col
 * @param {import('./types').ColBase} col - Col de base
 * @returns {import('./types').WeatherData} - Données météo
 */
function generateWeatherData(col) {
  // Les données météo varient selon l'altitude, la région, etc.
  const isHighAltitude = col.elevation > 2000;
  const isMediumAltitude = col.elevation > 1000 && col.elevation <= 2000;
  const isLowAltitude = col.elevation <= 1000;
  
  // Estimations de température en fonction de l'altitude (règle du -0.6°C/100m)
  const baseTempSummer = 25 - (col.elevation / 100) * 0.6;
  const baseTempWinter = 5 - (col.elevation / 100) * 0.6;
  
  // Variation des précipitations selon la région
  let precipitationFactor = 1.0;
  if (['Bretagne', 'Normandie', 'Hauts-de-France'].includes(col.region)) {
    precipitationFactor = 1.4; // Régions pluvieuses
  } else if (['Provence-Alpes-Côte d\'Azur', 'Occitanie'].includes(col.region)) {
    precipitationFactor = 0.7; // Régions plus sèches
  }
  
  // Climat général
  const climate = {
    elevation: col.elevation,
    temperatureRange: {
      summer: {
        min: baseTempSummer - 10,
        max: baseTempSummer + 5,
        avg: baseTempSummer
      },
      winter: {
        min: baseTempWinter - 10,
        max: baseTempWinter + 5,
        avg: baseTempWinter
      }
    },
    precipitation: {
      annual: 1000 * precipitationFactor * (isHighAltitude ? 1.3 : isMediumAltitude ? 1.1 : 1),
      snowDays: isHighAltitude ? 90 : isMediumAltitude ? 40 : 10
    },
    wind: {
      avgSpeed: isHighAltitude ? 30 : isMediumAltitude ? 20 : 15,
      prevailingDirection: 'west'
    },
    extremeConditions: {
      stormFrequency: isHighAltitude ? 'high' : isMediumAltitude ? 'medium' : 'low',
      fogDays: isHighAltitude ? 100 : isMediumAltitude ? 60 : 30
    }
  };
  
  // Données saisonnières
  const seasonal = {
    spring: {
      accessibility: isHighAltitude ? 'difficult' : 'moderate',
      snow: isHighAltitude ? 'likely' : 'possible',
      temperature: {
        min: baseTempWinter,
        max: baseTempSummer,
        avg: (baseTempWinter + baseTempSummer) / 2
      }
    },
    summer: {
      accessibility: 'good',
      temperature: {
        min: baseTempSummer - 5,
        max: baseTempSummer + 10,
        avg: baseTempSummer
      }
    },
    autumn: {
      accessibility: isHighAltitude ? 'moderate' : 'good',
      snow: isHighAltitude ? 'possible' : 'rare',
      temperature: {
        min: baseTempWinter + 5,
        max: baseTempSummer - 5,
        avg: (baseTempWinter + 5 + baseTempSummer - 5) / 2
      }
    },
    winter: {
      accessibility: isHighAltitude ? 'closed' : isMediumAltitude ? 'difficult' : 'moderate',
      snow: isHighAltitude ? 'certain' : isMediumAltitude ? 'likely' : 'possible',
      temperature: {
        min: baseTempWinter - 10,
        max: baseTempWinter + 5,
        avg: baseTempWinter
      }
    }
  };
  
  // Conditions météo typiques
  const typical = {
    bestTime: isHighAltitude ? 'July-August' : 'June-September',
    worstTime: isHighAltitude ? 'November-April' : 'December-February',
    morningConditions: {
      summer: isHighAltitude ? 'clear, cool' : 'clear, mild',
      winter: isHighAltitude ? 'freezing, often snowy' : 'cold, possible frost'
    },
    afternoonConditions: {
      summer: isHighAltitude ? 'chance of thunderstorms' : 'warm, occasional showers',
      winter: isHighAltitude ? 'very cold, snow' : 'cold, overcast'
    }
  };
  
  return {
    climate,
    seasonal,
    typical,
    metadata: {
      generatedAt: new Date(),
      algorithm: 'synthetic_weather_v2',
      note: 'Data is synthetic and for visualization purposes only'
    }
  };
}

/**
 * Détermine le niveau de qualité de rendu en fonction de la difficulté du col
 * @param {string} difficulty - Niveau de difficulté du col
 * @returns {string} - Niveau de qualité
 */
function determineQualityLevel(difficulty) {
  switch (difficulty) {
    case 'extreme':
      return 'ultra';
    case 'hard':
      return 'high';
    case 'medium':
      return 'medium';
    default:
      return 'standard';
  }
}

/**
 * Calcule la densité de végétation en fonction du col
 * @param {import('./types').ColBase} col - Col de base
 * @returns {number} - Densité de végétation (0-1)
 */
function calculateVegetationDensity(col) {
  // Moins de végétation en haute altitude
  if (col.elevation > 2000) {
    return 0.1 + Math.random() * 0.2; // 0.1-0.3
  } else if (col.elevation > 1500) {
    return 0.3 + Math.random() * 0.3; // 0.3-0.6
  } else if (col.elevation > 1000) {
    return 0.5 + Math.random() * 0.3; // 0.5-0.8
  } else {
    return 0.7 + Math.random() * 0.3; // 0.7-1.0
  }
}

/**
 * Génère les paramètres de rendu 3D pour un col
 * @param {import('./types').ColBase} col - Col de base
 * @returns {import('./types').RenderSettings} - Paramètres de rendu
 */
function generateRenderSettings(col) {
  const quality = determineQualityLevel(col.difficulty);
  const vegetationDensity = calculateVegetationDensity(col);
  
  return {
    quality,
    textureResolution: quality === 'ultra' ? 4096 : quality === 'high' ? 2048 : 1024,
    shadowQuality: quality === 'ultra' || quality === 'high' ? 'high' : 'medium',
    vegetationDensity,
    waterEffects: true,
    atmosphericEffects: true,
    lightingPreset: 'midday',
    fogDensity: col.elevation > 1800 ? 0.05 : 0.02,
    renderDistance: quality === 'ultra' ? 10000 : quality === 'high' ? 7500 : 5000
  };
}

module.exports = {
  generateElevationProfile,
  generateTerrainData,
  generateWeatherData,
  generateRenderSettings,
  calculateBoundingBox,
  determineQualityLevel,
  calculateVegetationDensity
};
