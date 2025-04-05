// models/visualization.model.js - Modèle pour les visualisations avancées
const elevationProfileModel = require('./elevation-profile.model');
const passModel = require('./pass.model');
const routePlannerModel = require('./route-planner.model');
const routeColorService = require('../services/route-color.service');

/**
 * Classe pour gérer les visualisations avancées des cols et itinéraires
 */
class VisualizationModel {
  /**
   * Génère les données de visualisation segmentée par couleur pour un col
   * @param {string} passId - ID du col
   * @returns {Object} Données de visualisation segmentée
   */
  generatePassVisualization(passId) {
    try {
      const pass = passModel.getPassById(passId);
      if (!pass) {
        throw new Error(`Col avec l'ID ${passId} non trouvé`);
      }
      
      // Vérifier si le col a un profil d'élévation
      if (!pass.elevationProfile || !Array.isArray(pass.elevationProfile) || pass.elevationProfile.length < 2) {
        throw new Error(`Le col ${passId} n'a pas de profil d'élévation valide`);
      }
      
      // Analyser le profil d'élévation
      const analysis = elevationProfileModel.analyzeProfile(pass.elevationProfile);
      
      // Générer des données de visualisation segmentée par difficulté
      return this._createColorSegmentedVisualization(pass, analysis);
    } catch (error) {
      console.error(`Erreur lors de la génération de la visualisation pour le col ${passId}:`, error);
      throw error;
    }
  }
  
  /**
   * Crée une visualisation segmentée par couleur selon la difficulté
   * @param {Object} pass - Données du col
   * @param {Object} analysis - Analyse du profil d'élévation
   * @returns {Object} Données formatées pour la visualisation
   * @private
   */
  _createColorSegmentedVisualization(pass, analysis) {
    // Préparer les données pour la visualisation
    const segmentsByDifficulty = analysis.segmentsByDifficulty;
    
    // Créer une structure de données pour la visualisation
    const visualization = {
      id: pass.id,
      name: pass.name,
      length: pass.length,
      elevation: pass.elevation,
      difficulty: pass.difficulty,
      elevationProfile: pass.elevationProfile,
      segmentsByDifficulty: Object.keys(segmentsByDifficulty).map(key => ({
        difficulty: key,
        color: segmentsByDifficulty[key].color,
        segments: segmentsByDifficulty[key].segments,
        totalLength: segmentsByDifficulty[key].totalLength,
        percentage: segmentsByDifficulty[key].percentage
      })),
      keyPoints: [
        {
          name: "Départ",
          distance: 0,
          elevation: pass.elevationProfile[0][1],
          type: "start"
        },
        ...analysis.keySegments.map(segment => ({
          name: `Section ${segment.type}`,
          distanceStart: segment.startDistance,
          distanceEnd: segment.endDistance,
          length: segment.length,
          gradient: segment.avgGradient,
          type: "key_segment",
          severity: segment.avgGradient > 8 ? "high" : "medium"
        })),
        {
          name: "Sommet",
          distance: pass.length,
          elevation: pass.elevationProfile[pass.elevationProfile.length - 1][1],
          type: "summit"
        }
      ],
      colorScale: [
        { gradient: "0-4%", color: "#4CAF50", difficulty: "Facile" },
        { gradient: "4-7%", color: "#FFC107", difficulty: "Modéré" },
        { gradient: "7-10%", color: "#FF9800", difficulty: "Difficile" },
        { gradient: "10-15%", color: "#F44336", difficulty: "Très difficile" },
        { gradient: ">15%", color: "#9C27B0", difficulty: "Extrême" }
      ],
      summary: {
        maxGradient: analysis.summary.maxGradient,
        averageGradient: analysis.summary.averageGradient,
        maxGradientLocation: analysis.summary.maxGradientLocation,
        elevationGain: analysis.summary.totalElevationGain
      }
    };
    
    return visualization;
  }
  
  /**
   * Génère les données pour une visualisation 3D d'un col
   * @param {string} passId - ID du col
   * @returns {Object} Données pour la visualisation 3D
   */
  generate3DPassVisualization(passId) {
    try {
      const pass = passModel.getPassById(passId);
      if (!pass) {
        throw new Error(`Col avec l'ID ${passId} non trouvé`);
      }
      
      // Vérifier si le col a un profil d'élévation et des coordonnées géographiques
      if (!pass.elevationProfile || !Array.isArray(pass.elevationProfile) || pass.elevationProfile.length < 2) {
        throw new Error(`Le col ${passId} n'a pas de profil d'élévation valide`);
      }
      
      if (!pass.coordinates3D || !Array.isArray(pass.coordinates3D) || pass.coordinates3D.length < 10) {
        // Si pas de coordonnées 3D, générer des données fictives basées sur le profil d'élévation
        return this._generate3DData(pass);
      }
      
      // Sinon, utiliser les coordonnées 3D existantes
      return {
        id: pass.id,
        name: pass.name,
        coordinates3D: pass.coordinates3D,
        textureMap: pass.textureMap || null,
        camera: {
          initialPosition: [0, 50, 100], // Position par défaut, à ajuster
          lookAt: [0, 0, 0],
          fov: 45
        },
        markers: this._generate3DMarkers(pass)
      };
    } catch (error) {
      console.error(`Erreur lors de la génération de la visualisation 3D pour le col ${passId}:`, error);
      throw error;
    }
  }
  
  /**
   * Génère des données 3D à partir du profil d'élévation
   * @param {Object} pass - Données du col
   * @returns {Object} Données 3D générées
   * @private
   */
  _generate3DData(pass) {
    try {
      // Vérifier si le col a un profil d'élévation et des coordonnées GPS
      if (!pass.elevationProfile || !pass.coordinates) {
        throw new Error(`Le col ${pass.id} n'a pas de données suffisantes pour une visualisation 3D`);
      }
      
      // Données de base pour la visualisation 3D
      const terrainData = {
        width: 10000,                  // Largeur du terrain en mètres (10km)
        length: pass.length * 1000,    // Longueur en mètres
        resolution: 128,               // Résolution de la grille
        heightScale: 1.5,              // Facteur d'échelle pour l'élévation
        textureResolution: 2048,       // Résolution des textures
        roadWidth: 6,                  // Largeur de la route en mètres
      };
      
      // Générer la grille d'élévation pour le terrain
      const terrain = this._generateTerrainGrid(pass.elevationProfile, pass.coordinates, terrainData);
      
      // Générer les données pour la route
      const road = this._generateRoadGeometry(pass.elevationProfile, pass.coordinates, terrainData);
      
      // Générer les données pour l'environnement (arbres, rochers, etc.)
      const environment = this._generateEnvironmentData(pass, terrainData);
      
      // Générer les données météo et d'éclairage
      const lighting = this._generateLightingData(pass);
      
      // Générer les données pour les points d'intérêt et repères
      const markers = this._generate3DMarkers(pass);
      
      // Générer les textures
      const textures = this._generateTextureData(pass, terrainData);
      
      // Générer les données pour les effets visuels (brouillard, nuages, etc.)
      const effects = this._generateVisualEffects(pass);
      
      // Assembler les données 3D complètes
      return {
        id: pass.id,
        name: pass.name,
        length: pass.length,
        elevation: pass.elevation,
        terrainData,
        terrain,
        road,
        environment,
        lighting,
        markers,
        textures,
        effects,
        cameraSettings: {
          defaultView: 'route',  // Options: route, panorama, helicopter
          initialPosition: [0, 50, 0],  // xyz en mètres, relatif au début de la route
          presetViews: [
            { name: 'Départ', position: [0, 50, 20], lookAt: [100, 0, 0] },
            { name: 'Mi-parcours', position: [pass.length * 500, 100, 50], lookAt: [pass.length * 500 + 100, 0, 0] },
            { name: 'Sommet', position: [pass.length * 1000 - 100, 70, 30], lookAt: [pass.length * 1000, 0, 0] }
          ],
          followMode: true,  // Mode caméra qui suit automatiquement la position du cycliste
          followHeight: 15,  // Hauteur de la caméra en mode suivi
          followDistance: 30 // Distance derrière le cycliste
        },
        interactionSettings: {
          allowTerrainDeformation: false,
          allowWeatherControl: true,
          allowTimeControl: true,
          allowVirtualRiding: true
        },
        renderingSettings: {
          shadows: true,
          ambientOcclusion: true,
          reflections: true,
          antialiasing: true,
          qualityPreset: 'high', // low, medium, high, ultra
          optimizedForMobile: false
        }
      };
    } catch (error) {
      console.error(`Erreur lors de la génération des données 3D:`, error);
      throw error;
    }
  }
  
  /**
   * Génère une grille d'élévation pour le terrain
   * @param {Array} elevationProfile - Profil d'élévation
   * @param {Array} coordinates - Coordonnées GPS
   * @param {Object} terrainData - Paramètres du terrain
   * @returns {Object} Données de grille du terrain
   * @private
   */
  _generateTerrainGrid(elevationProfile, coordinates, terrainData) {
    const gridSize = terrainData.resolution;
    const heightData = new Array(gridSize).fill(0).map(() => new Array(gridSize).fill(0));
    
    // Générer une grille d'élévation réaliste basée sur le profil du col
    // et extrapoler pour créer le terrain environnant
    
    // Calcul de l'élévation de base à partir du profil
    const baseElevations = elevationProfile.map(point => point[1]);
    const minElevation = Math.min(...baseElevations);
    const maxElevation = Math.max(...baseElevations);
    
    // Génération de la grille principale suivant la route
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        // Convertir les indices de grille en position relative sur le terrain
        const x = (i / gridSize) * terrainData.length;
        const z = ((j / gridSize) - 0.5) * terrainData.width;
        
        // Trouver le point du profil d'élévation le plus proche
        const distanceAlongRoute = x;
        const index = Math.min(
          elevationProfile.length - 1,
          Math.floor((distanceAlongRoute / (terrainData.length)) * elevationProfile.length)
        );
        
        // Élévation de base à ce point
        let elevation = elevationProfile[index][1];
        
        // Ajouter des variations pour le terrain environnant
        // Plus on s'éloigne de la route, plus le terrain varie
        const distanceFromRoute = Math.abs(z);
        const variationFactor = Math.min(1, distanceFromRoute / (terrainData.width * 0.3));
        
        // Générer des variations naturelles de terrain avec du bruit Perlin (simulé)
        const noise = this._generatePerlinNoise(i, j, 0.1) * 300 * variationFactor;
        
        // Calculer l'élévation finale avec un dégradé naturel
        elevation += noise;
        
        // S'assurer que le terrain descend progressivement sur les côtés (vallée)
        const valleyFactor = Math.max(0, Math.abs(z) / (terrainData.width * 0.4) - 0.2);
        elevation -= valleyFactor * 200;
        
        // Limiter l'élévation minimale
        elevation = Math.max(minElevation - 200, elevation);
        
        heightData[i][j] = elevation;
      }
    }
    
    return {
      heightData,
      gridSize,
      physicalWidth: terrainData.width,
      physicalLength: terrainData.length,
      minElevation,
      maxElevation,
      normalMap: true, // Générer une normal map pour un meilleur rendu
      roughnessMap: true, // Carte de rugosité pour les effets PBR
      terrainTypes: [
        { 
          name: 'roche', 
          threshold: 0.8, // Au-dessus de 80% de la hauteur max -> roches
          texture: 'rock' 
        },
        { 
          name: 'herbe', 
          threshold: 0.4, // Entre 40% et 80% -> herbe
          texture: 'grass' 
        },
        { 
          name: 'forêt', 
          threshold: 0.3, // Entre 30% et 40% -> forêt
          texture: 'forest' 
        },
        { 
          name: 'terre', 
          threshold: 0, // Reste -> terre
          texture: 'dirt' 
        }
      ]
    };
  }
  
  /**
   * Génère des données géométriques pour la route
   * @param {Array} elevationProfile - Profil d'élévation
   * @param {Array} coordinates - Coordonnées GPS
   * @param {Object} terrainData - Paramètres du terrain
   * @returns {Object} Données de la géométrie de la route
   * @private
   */
  _generateRoadGeometry(elevationProfile, coordinates, terrainData) {
    // Générer les points de la route en 3D
    const routePoints = [];
    const numberOfPoints = Math.min(500, elevationProfile.length); // Limiter pour des raisons de performance
    
    for (let i = 0; i < numberOfPoints; i++) {
      const index = Math.floor((i / numberOfPoints) * elevationProfile.length);
      const distanceRatio = index / elevationProfile.length;
      
      const x = distanceRatio * terrainData.length;
      const y = elevationProfile[index][1] + 0.2; // Légèrement au-dessus du terrain
      const z = 0; // Centré sur l'axe Z
      
      routePoints.push([x, y, z]);
    }
    
    // Analyser les segments de la route pour déterminer les types de revêtement
    const surfaceSegments = this._analyzeRoadSurface(coordinates, elevationProfile);
    
    return {
      centerline: routePoints,
      width: terrainData.roadWidth,
      surfaceSegments,
      guardrails: this._generateGuardrails(elevationProfile, routePoints),
      tunnels: this._analyzeTunnels(coordinates, elevationProfile),
      bridges: this._analyzeBridges(coordinates, elevationProfile),
      renderOptions: {
        textureResolution: 1024,
        normalMapping: true,
        reflective: true,
        bumpMapping: true
      }
    };
  }
  
  /**
   * Génère des données pour les glissières de sécurité
   * @param {Array} elevationProfile - Profil d'élévation
   * @param {Array} routePoints - Points 3D de la route
   * @returns {Array} Données des glissières
   * @private
   */
  _generateGuardrails(elevationProfile, routePoints) {
    const guardrails = [];
    
    // Analyser le profil pour déterminer où placer des glissières
    for (let i = 1; i < routePoints.length; i++) {
      const prev = routePoints[i - 1];
      const curr = routePoints[i];
      
      // Calculer la pente
      const distance = Math.sqrt(Math.pow(curr[0] - prev[0], 2) + Math.pow(curr[2] - prev[2], 2));
      const slope = (curr[1] - prev[1]) / distance;
      
      // Si la pente est forte (descente) ou si l'élévation est élevée, ajouter une glissière
      if (slope < -0.05 || curr[1] > 900) {
        guardrails.push({
          startIndex: i - 1,
          endIndex: i,
          side: slope < -0.1 ? 'both' : 'outer', // Des deux côtés si très pentu
          height: 1.0,
          type: curr[1] > 1200 ? 'mountain' : 'standard'
        });
      }
    }
    
    return guardrails;
  }
  
  /**
   * Analyse les données pour identifier les tunnels
   * @param {Array} coordinates - Coordonnées GPS
   * @param {Array} elevationProfile - Profil d'élévation
   * @returns {Array} Données des tunnels
   * @private
   */
  _analyzeTunnels(coordinates, elevationProfile) {
    // Implémentation simplifiée - à enrichir avec des données réelles
    return [];
  }
  
  /**
   * Analyse les données pour identifier les ponts
   * @param {Array} coordinates - Coordonnées GPS
   * @param {Array} elevationProfile - Profil d'élévation
   * @returns {Array} Données des ponts
   * @private
   */
  _analyzeBridges(coordinates, elevationProfile) {
    // Implémentation simplifiée - à enrichir avec des données réelles
    return [];
  }
  
  /**
   * Analyse le revêtement de la route
   * @param {Array} coordinates - Coordonnées GPS
   * @param {Array} elevationProfile - Profil d'élévation
   * @returns {Array} Segments de revêtement
   * @private
   */
  _analyzeRoadSurface(coordinates, elevationProfile) {
    // Par défaut, on suppose une route asphaltée
    // Cette fonction pourrait être enrichie avec des données réelles
    return [
      {
        startIndex: 0,
        endIndex: elevationProfile.length - 1,
        type: 'asphalt',
        quality: 'good',
        color: [0.3, 0.3, 0.3], // Gris foncé
        roughness: 0.2,
        metalness: 0.0
      }
    ];
  }
  
  /**
   * Génère des données pour l'environnement
   * @param {Object} pass - Données du col
   * @param {Object} terrainData - Paramètres du terrain
   * @returns {Object} Données d'environnement
   * @private
   */
  _generateEnvironmentData(pass, terrainData) {
    const environment = {
      trees: [],
      rocks: [],
      buildings: [],
      waterBodies: []
    };
    
    // Déterminer l'altitude de la ligne des arbres
    const treeLineAltitude = 1800; // en mètres
    
    // Déterminer les altitudes min et max du col
    const altitudes = pass.elevationProfile.map(point => point[1]);
    const minAltitude = Math.min(...altitudes);
    const maxAltitude = Math.max(...altitudes);
    
    // Générer les arbres
    const treeCount = Math.floor(terrainData.length / 50); // Un arbre tous les 50m en moyenne
    for (let i = 0; i < treeCount; i++) {
      // Position aléatoire le long de la route
      const distanceAlongRoute = Math.random() * terrainData.length;
      
      // Trouver l'altitude à cette distance
      const index = Math.floor((distanceAlongRoute / terrainData.length) * pass.elevationProfile.length);
      const altitude = pass.elevationProfile[index][1];
      
      // Ne pas placer d'arbres au-dessus de la ligne des arbres
      if (altitude < treeLineAltitude) {
        // Distance aléatoire depuis le centre de la route (mais pas sur la route)
        const distanceFromRoad = (Math.random() * 0.4 + 0.1) * terrainData.width * 0.5 * (Math.random() > 0.5 ? 1 : -1);
        
        // Déterminer le type d'arbre en fonction de l'altitude
        let treeType;
        if (altitude < 800) {
          treeType = 'deciduous'; // Feuillus en basse altitude
        } else if (altitude < 1500) {
          treeType = 'coniferous'; // Conifères en moyenne altitude
        } else {
          treeType = 'alpine'; // Pins alpins en haute altitude
        }
        
        environment.trees.push({
          position: [distanceAlongRoute, altitude, distanceFromRoad],
          type: treeType,
          height: 5 + Math.random() * 10,
          width: 3 + Math.random() * 5
        });
      }
    }
    
    // Générer des rochers en haute altitude
    const rockCount = Math.floor(terrainData.length / 100);
    for (let i = 0; i < rockCount; i++) {
      const distanceAlongRoute = Math.random() * terrainData.length;
      const index = Math.floor((distanceAlongRoute / terrainData.length) * pass.elevationProfile.length);
      const altitude = pass.elevationProfile[index][1];
      
      // Placer des rochers principalement en haute altitude
      if (altitude > treeLineAltitude - 300 || Math.random() < 0.2) {
        const distanceFromRoad = (Math.random() * 0.4 + 0.05) * terrainData.width * 0.5 * (Math.random() > 0.5 ? 1 : -1);
        
        environment.rocks.push({
          position: [distanceAlongRoute, altitude, distanceFromRoad],
          size: 2 + Math.random() * 8,
          type: altitude > treeLineAltitude ? 'alpine' : 'standard'
        });
      }
    }
    
    // Ajouter quelques bâtiments (refuges, chalets, etc.)
    if (pass.pointsOfInterest && Array.isArray(pass.pointsOfInterest)) {
      pass.pointsOfInterest.forEach(poi => {
        if (poi.type === 'refuge' || poi.type === 'restaurant' || poi.type === 'hotel') {
          // Convertir la position du POI en coordonnées 3D
          const relativePos = poi.location.includes("Virage") ? 
            parseInt(poi.location.replace("Virage ", "")) / 21 : // Pour Alpe d'Huez
            Math.random(); // Placement aléatoire pour les autres
        
          const distance = relativePos * pass.length;
          const idx = Math.floor(relativePos * (elevationProfile.length - 1));
          const elevation = elevationProfile[idx][1];
          
          environment.buildings.push({
            position: [distance * 50, Math.sin(distance / pass.length * Math.PI * 2) * distance * 0.2, elevation + 10],
            type: poi.type,
            name: poi.name,
            size: poi.type === 'hotel' ? 'large' : 'small'
          });
        }
      });
    }
    
    return environment;
  }
  
  /**
   * Génère des données de lumière et de conditions atmosphériques
   * @param {Object} pass - Données du col
   * @returns {Object} Données d'éclairage
   * @private
   */
  _generateLightingData(pass) {
    // Par défaut, utiliser un éclairage de jour ensoleillé
    const lighting = {
      timeOfDay: 'day',
      sunPosition: [100000, 100000, 100000], // Position du soleil très éloignée
      sunColor: [1.0, 0.98, 0.92],
      sunIntensity: 1.0,
      ambientColor: [0.6, 0.7, 0.9],
      ambientIntensity: 0.3,
      shadows: true,
      shadowQuality: 'high',
      fog: {
        enabled: true,
        color: [0.8, 0.9, 1.0],
        density: 0.0005,
        start: 1000,
        end: 8000
      }
    };
    
    // Adapter l'éclairage en fonction de l'altitude maximale
    const maxAltitude = Math.max(...pass.elevationProfile.map(point => point[1]));
    
    if (maxAltitude > 2000) {
      // Éclairage de haute montagne
      lighting.ambientColor = [0.7, 0.8, 1.0]; // Plus bleu
      lighting.ambientIntensity = 0.4;
      lighting.fog.density = 0.0003; // Air plus clair
    }
    
    return lighting;
  }
  
  /**
   * Génère des données de texture pour le rendu
   * @param {Object} pass - Données du col
   * @param {Object} terrainData - Paramètres du terrain
   * @returns {Object} Données de texture
   * @private
   */
  _generateTextureData(pass, terrainData) {
    return {
      terrain: {
        baseTextures: {
          rock: {
            diffuse: '/textures/terrain/rock_diffuse.jpg',
            normal: '/textures/terrain/rock_normal.jpg',
            roughness: '/textures/terrain/rock_roughness.jpg',
            tiling: 20
          },
          grass: {
            diffuse: '/textures/terrain/grass_diffuse.jpg',
            normal: '/textures/terrain/grass_normal.jpg',
            roughness: '/textures/terrain/grass_roughness.jpg',
            tiling: 30
          },
          forest: {
            diffuse: '/textures/terrain/forest_diffuse.jpg',
            normal: '/textures/terrain/forest_normal.jpg',
            roughness: '/textures/terrain/forest_roughness.jpg',
            tiling: 25
          },
          dirt: {
            diffuse: '/textures/terrain/dirt_diffuse.jpg',
            normal: '/textures/terrain/dirt_normal.jpg',
            roughness: '/textures/terrain/dirt_roughness.jpg',
            tiling: 15
          },
          snow: {
            diffuse: '/textures/terrain/snow_diffuse.jpg',
            normal: '/textures/terrain/snow_normal.jpg',
            roughness: '/textures/terrain/snow_roughness.jpg',
            tiling: 20
          }
        },
        // Texture de mélange pour la transition entre les différents types de terrain
        blendMap: '/textures/terrain/blend_map.png',
        // Texture d'ombrage ambiant précalculé
        aoMap: '/textures/terrain/ao_map.png'
      },
      road: {
        asphalt: {
          diffuse: '/textures/road/asphalt_diffuse.jpg',
          normal: '/textures/road/asphalt_normal.jpg',
          roughness: '/textures/road/asphalt_roughness.jpg',
          tiling: [1, 100] // Répétition différente sur les axes x et y
        },
        gravel: {
          diffuse: '/textures/road/gravel_diffuse.jpg',
          normal: '/textures/road/gravel_normal.jpg',
          roughness: '/textures/road/gravel_roughness.jpg',
          tiling: [1, 80]
        },
        // Texture pour les marquages routiers
        markings: '/textures/road/road_markings.png'
      }
    };
  }
  
  /**
   * Génère des données pour les effets visuels
   * @param {Object} pass - Données du col
   * @returns {Object} Données d'effets visuels
   * @private
   */
  _generateVisualEffects(pass) {
    // Déterminer les altitudes min et max du col
    const altitudes = pass.elevationProfile.map(point => point[1]);
    const maxAltitude = Math.max(...altitudes);
    
    const effects = {
      sky: {
        type: 'dynamic', // Options: static, dynamic, hdri
        hdriTexture: '/textures/sky/mountains_hdri.hdr',
        sunSize: 0.04,
        moonSize: 0.02,
        stars: maxAltitude > 1500, // Étoiles visibles en haute altitude
        cloudCoverage: 0.3,
        cloudDensity: 0.5
      },
      postProcessing: {
        bloom: {
          enabled: true,
          intensity: 0.2,
          threshold: 0.85
        },
        dof: {
          enabled: true,
          focusDistance: 100,
          aperture: 0.1
        },
        ssao: {
          enabled: true,
          intensity: 0.3,
          radius: 2
        },
        toneMappingEnabled: true,
        toneMapping: 'ACESFilmic'
      }
    };
    
    // Ajuster les effets en fonction de l'altitude
    if (maxAltitude > 2000) {
      // Plus de soleil et moins de nuages en haute montagne
      effects.sky.cloudCoverage = 0.2;
      effects.sky.cloudDensity = 0.3;
      
      // Effet de vent sur la végétation
      effects.wind = {
        enabled: true,
        strength: 0.5,
        direction: [1, 0, 0]
      };
    }
    
    return effects;
  }
  
  /**
   * Génère un bruit Perlin simplifié pour les variations de terrain
   * @param {number} x - Coordonnée X
   * @param {number} y - Coordonnée Y
   * @param {number} scale - Échelle du bruit
   * @returns {number} Valeur de bruit entre -1 et 1
   * @private
   */
  _generatePerlinNoise(x, y, scale) {
    // Version simplifiée du bruit Perlin
    x = x * scale;
    y = y * scale;
    
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    
    x -= Math.floor(x);
    y -= Math.floor(y);
    
    // Fonctions de fondu
    const u = x * x * (3 - 2 * x);
    const v = y * y * (3 - 2 * y);
    
    // Valeur simulée (algorithme simplifié)
    let result = Math.sin(X * 0.1 + Y * 0.1) * 0.5 + 0.5;
    result = result * 2 - 1; // Passage à [-1, 1]
    
    return result;
  }
  
  /**
   * Génère des marqueurs 3D pour les points d'intérêt
   * @param {Object} pass - Données du col
   * @returns {Array} Marqueurs 3D
   * @private
   */
  _generate3DMarkers(pass) {
    const markers = [];
    const elevationProfile = pass.elevationProfile;
    
    // Départ
    markers.push({
      id: "start",
      name: "Départ",
      position: [0, 0, elevationProfile[0][1]],
      type: "start",
      icon: "flag-start"
    });
    
    // Sommet
    markers.push({
      id: "summit",
      name: "Sommet",
      position: [pass.length * 50, 0, elevationProfile[elevationProfile.length - 1][1]],
      type: "summit",
      icon: "flag-finish"
    });
    
    // Points d'intérêt si disponibles
    if (pass.pointsOfInterest && Array.isArray(pass.pointsOfInterest)) {
      pass.pointsOfInterest.forEach(poi => {
        // Calculer la position approximative basée sur la description du POI
        const relativePos = poi.location.includes("Virage") ? 
          parseInt(poi.location.replace("Virage ", "")) / 21 : // Pour Alpe d'Huez
          Math.random(); // Placement aléatoire pour les autres
        
        const distance = relativePos * pass.length;
        const idx = Math.floor(relativePos * (elevationProfile.length - 1));
        const elevation = elevationProfile[idx][1];
        
        markers.push({
          id: `poi-${poi.id}`,
          name: poi.name,
          position: [distance * 50, Math.sin(distance / pass.length * Math.PI * 2) * distance * 0.2, elevation + 10],
          type: poi.type,
          icon: this._getIconForPoiType(poi.type),
          description: poi.description || ""
        });
      });
    }
    
    return markers;
  }
  
  /**
   * Détermine l'icône à utiliser pour un type de point d'intérêt
   * @param {string} type - Type de point d'intérêt
   * @returns {string} Nom de l'icône
   * @private
   */
  _getIconForPoiType(type) {
    switch (type) {
      case "ravitaillement": return "restaurant";
      case "panorama": return "photo";
      case "monument": return "landmark";
      case "culture": return "museum";
      case "nature": return "tree";
      case "gastronomie": return "food";
      default: return "info";
    }
  }
  
  /**
   * Génère un système d'annotations pour un itinéraire
   * @param {string} routeId - ID de l'itinéraire
   * @returns {Object} Données d'annotations
   */
  generateRouteAnnotations(routeId) {
    try {
      const route = routePlannerModel.getRouteById(routeId);
      if (!route) {
        throw new Error(`Itinéraire avec l'ID ${routeId} non trouvé`);
      }
      
      // Générer différents types d'annotations
      return {
        id: route.id,
        name: route.name,
        segments: route.segments,
        strategicAnnotations: this._generateStrategicAnnotations(route),
        pointsOfInterestAnnotations: this._generatePoiAnnotations(route),
        safetyAnnotations: this._generateSafetyAnnotations(route),
        technicalAnnotations: this._generateTechnicalAnnotations(route)
      };
    } catch (error) {
      console.error(`Erreur lors de la génération des annotations pour l'itinéraire ${routeId}:`, error);
      throw error;
    }
  }
  
  /**
   * Génère des annotations stratégiques pour un itinéraire
   * @param {Object} route - Données de l'itinéraire
   * @returns {Array} Annotations stratégiques
   * @private
   */
  _generateStrategicAnnotations(route) {
    const annotations = [];
    
    // Ajout d'annotations pour les segments clés
    route.segments.forEach((segment, index) => {
      if (segment.averageGradient > 5) {
        annotations.push({
          id: `strat-${index}-climb`,
          type: "climbing",
          location: {
            segmentIndex: index,
            position: "start"
          },
          title: `Montée: ${segment.averageGradient}% sur ${segment.distance}km`,
          content: `Conservez un rythme régulier et choisissez un braquet adapté pour cette montée.`,
          severity: segment.averageGradient > 8 ? "high" : "medium",
          icon: "trending_up"
        });
      }
      
      // Si c'est un segment de vallée après une montée
      if (index > 0 && route.segments[index-1].averageGradient > 5 && segment.averageGradient < 2) {
        annotations.push({
          id: `strat-${index}-recovery`,
          type: "recovery",
          location: {
            segmentIndex: index,
            position: "start"
          },
          title: "Zone de récupération",
          content: "Profitez de cette section plate pour récupérer, vous hydrater et vous alimenter.",
          severity: "low",
          icon: "healing"
        });
      }
      
      // Si c'est un segment de descente rapide
      if (index > 0 && segment.elevation < 0 && Math.abs(segment.averageGradient) > 5) {
        annotations.push({
          id: `strat-${index}-descent`,
          type: "descent",
          location: {
            segmentIndex: index,
            position: "start"
          },
          title: `Descente technique: ${Math.abs(segment.averageGradient)}%`,
          content: "Attention aux virages serrés et au revêtement. Contrôlez votre vitesse.",
          severity: Math.abs(segment.averageGradient) > 8 ? "high" : "medium",
          icon: "trending_down"
        });
      }
    });
    
    return annotations;
  }
  
  /**
   * Génère des annotations pour les points d'intérêt
   * @param {Object} route - Données de l'itinéraire
   * @returns {Array} Annotations de points d'intérêt
   * @private
   */
  _generatePoiAnnotations(route) {
    const annotations = [];
    
    if (route.pointsOfInterest && Array.isArray(route.pointsOfInterest)) {
      route.pointsOfInterest.forEach((poi, index) => {
        // Trouver le segment le plus proche
        let nearestSegmentIndex = 0;
        let minDistance = Infinity;
        
        route.segments.forEach((segment, sIndex) => {
          if (segment.points.includes(poi.location)) {
            nearestSegmentIndex = sIndex;
            minDistance = 0;
          }
        });
        
        // Si aucun segment ne contient exactement le POI, chercher par similarité
        if (minDistance !== 0) {
          route.segments.forEach((segment, sIndex) => {
            segment.points.forEach(point => {
              const similarity = this._calculateSimilarity(point, poi.location);
              if (similarity < minDistance) {
                minDistance = similarity;
                nearestSegmentIndex = sIndex;
              }
            });
          });
        }
        
        annotations.push({
          id: `poi-${index}`,
          type: poi.type,
          location: {
            segmentIndex: nearestSegmentIndex,
            position: "custom",
            details: poi.location
          },
          title: poi.name,
          content: poi.description || `Point d'intérêt: ${poi.type}`,
          icon: this._getIconForPoiType(poi.type)
        });
      });
    }
    
    return annotations;
  }
  
  /**
   * Calcule la similarité entre deux chaînes (distance de Levenshtein simplifiée)
   * @param {string} str1 - Première chaîne
   * @param {string} str2 - Deuxième chaîne
   * @returns {number} Score de similarité (plus c'est bas, plus c'est similaire)
   * @private
   */
  _calculateSimilarity(str1, str2) {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    // Vérifier si l'une contient l'autre
    if (s1.includes(s2) || s2.includes(s1)) {
      return 0;
    }
    
    // Sinon, calculer une distance simple
    let distance = 0;
    const maxLength = Math.max(s1.length, s2.length);
    const minLength = Math.min(s1.length, s2.length);
    
    distance += maxLength - minLength; // Différence de longueur
    
    // Comparer les caractères jusqu'à la longueur minimale
    for (let i = 0; i < minLength; i++) {
      if (s1[i] !== s2[i]) {
        distance++;
      }
    }
    
    return distance;
  }
  
  /**
   * Génère des annotations de sécurité
   * @param {Object} route - Données de l'itinéraire
   * @returns {Array} Annotations de sécurité
   * @private
   */
  _generateSafetyAnnotations(route) {
    const annotations = [];
    
    // Descentes dangereuses
    route.segments.forEach((segment, index) => {
      if (segment.elevation < 0 && Math.abs(segment.averageGradient) > 7) {
        annotations.push({
          id: `safety-${index}-descent`,
          type: "danger",
          location: {
            segmentIndex: index,
            position: "start"
          },
          title: "Descente dangereuse",
          content: `Descente à ${Math.abs(segment.averageGradient)}% sur ${segment.distance}km. Attention aux virages et au contrôle de la vitesse.`,
          severity: "high",
          icon: "warning"
        });
      }
    });
    
    // Passages à risque (tunnels, ponts, etc.)
    if (route.hazards && Array.isArray(route.hazards)) {
      route.hazards.forEach((hazard, index) => {
        annotations.push({
          id: `safety-hazard-${index}`,
          type: "hazard",
          location: hazard.location,
          title: hazard.name,
          content: hazard.description,
          severity: hazard.severity || "medium",
          icon: "error"
        });
      });
    }
    
    // Points d'eau et secours
    if (route.services && Array.isArray(route.services)) {
      route.services.forEach((service, index) => {
        if (service.type === "water" || service.type === "firstaid") {
          annotations.push({
            id: `safety-service-${index}`,
            type: "service",
            location: service.location,
            title: service.name,
            content: service.description,
            icon: service.type === "water" ? "water_drop" : "local_hospital"
          });
        }
      });
    }
    
    return annotations;
  }
  
  /**
   * Génère des annotations techniques
   * @param {Object} route - Données de l'itinéraire
   * @returns {Array} Annotations techniques
   * @private
   */
  _generateTechnicalAnnotations(route) {
    const annotations = [];
    
    // Revêtement et état de la route
    route.segments.forEach((segment, index) => {
      if (segment.surface) {
        annotations.push({
          id: `tech-${index}-surface`,
          type: "surface",
          location: {
            segmentIndex: index,
            position: "middle"
          },
          title: `Revêtement: ${segment.surface}`,
          content: this._getSurfaceDescription(segment.surface),
          icon: "road"
        });
      }
    });
    
    // Segments Strava
    if (route.stravaSegments && Array.isArray(route.stravaSegments)) {
      route.stravaSegments.forEach((segment, index) => {
        annotations.push({
          id: `tech-strava-${index}`,
          type: "strava",
          location: segment.location,
          title: `Segment Strava: ${segment.name}`,
          content: `Record: ${segment.record}, Moyenne: ${segment.average}`,
          icon: "timer"
        });
      });
    }
    
    return annotations;
  }
  
  /**
   * Retourne une description pour un type de revêtement
   * @param {string} surface - Type de revêtement
   * @returns {string} Description du revêtement
   * @private
   */
  _getSurfaceDescription(surface) {
    switch (surface.toLowerCase()) {
      case "asphalte":
      case "asphalt":
        return "Bon revêtement routier, adapté à tous types de vélos.";
      case "gravier":
      case "gravel":
        return "Chemin en gravier, recommandé pour vélos gravel ou VTT.";
      case "piste":
      case "track":
        return "Piste cyclable dédiée, généralement bien entretenue.";
      case "terre":
      case "dirt":
        return "Chemin de terre, peut être boueux par temps humide.";
      case "pavés":
      case "cobbles":
        return "Section pavée, attention aux vibrations et à l'adhérence par temps humide.";
      default:
        return `Revêtement de type ${surface}.`;
    }
  }
  
  /**
   * Génère un GeoJSON à partir d'un itinéraire avec code couleur par difficulté
   * @param {Object} route - L'itinéraire à visualiser
   * @param {Boolean} includeSegments - Inclure les segments de difficulté distincte
   * @returns {Object} - GeoJSON de l'itinéraire
   */
  async generateColorCodedRouteGeoJSON(route, includeSegments = true) {
    try {
      if (!route || !route.coordinates || route.coordinates.length === 0) {
        throw new Error('Route invalide ou sans coordonnées');
      }

      // Calculer la difficulté globale de l'itinéraire
      const routeStats = {
        avgGradient: route.stats?.avgGradient || 0,
        elevationGain: route.stats?.elevationGain || 0,
        distance: route.stats?.distance || 0,
        maxGradient: route.stats?.maxGradient || 0
      };
      
      const difficulty = routeColorService.calculateRouteDifficulty(routeStats);
      
      // Créer le GeoJSON de base pour l'itinéraire complet
      const baseGeoJSON = {
        type: 'Feature',
        properties: {
          id: route._id?.toString() || 'temp-route',
          name: route.name || 'Itinéraire sans nom',
          difficulty: difficulty,
          color: routeColorService.getColorForDifficulty(difficulty),
          cssClass: routeColorService.getCssClassForDifficulty(difficulty),
          stats: route.stats || {}
        },
        geometry: {
          type: 'LineString',
          coordinates: route.coordinates.map(coord => [coord.lon, coord.lat])
        }
      };
      
      // Si les segments ne sont pas demandés, retourner uniquement l'itinéraire complet
      if (!includeSegments || !route.segments || route.segments.length === 0) {
        return {
          type: 'FeatureCollection',
          features: [baseGeoJSON]
        };
      }
      
      // Ajouter des segments colorés selon leur difficulté spécifique
      const segmentFeatures = route.segments.map(segment => {
        if (!segment.coordinates || segment.coordinates.length === 0) {
          return null;
        }
        
        const segmentGradient = segment.gradient || 0;
        const segmentDifficulty = routeColorService.getGradientSegmentStyle(segmentGradient);
        
        return {
          type: 'Feature',
          properties: {
            id: `${route._id?.toString() || 'temp-route'}-segment-${segment.id || Math.random().toString(36).substring(7)}`,
            name: segment.name || `Segment ${segment.gradient ? `(${segment.gradient.toFixed(1)}%)` : ''}`,
            gradient: segmentGradient,
            color: segmentDifficulty.color,
            cssClass: segmentDifficulty.className,
            isSegment: true
          },
          geometry: {
            type: 'LineString',
            coordinates: segment.coordinates.map(coord => [coord.lon, coord.lat])
          }
        };
      }).filter(segment => segment !== null);
      
      // Retourner la collection de features
      return {
        type: 'FeatureCollection',
        features: [baseGeoJSON, ...segmentFeatures]
      };
    } catch (error) {
      console.error('Erreur lors de la génération du GeoJSON coloré', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
}

module.exports = new VisualizationModel();
