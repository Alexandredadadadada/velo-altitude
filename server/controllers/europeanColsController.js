const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

/**
 * Contrôleur pour gérer les cols européens enrichis
 * Ce contrôleur permet de récupérer les données de notre base enrichie de 50 cols majeurs
 */
const europeanColsController = {
  /**
   * Récupère tous les cols européens avec pagination et filtres
   */
  getAllCols: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;
      
      // Filtres possibles
      const region = req.query.region;
      const country = req.query.country;
      const minAltitude = req.query.minAltitude ? parseInt(req.query.minAltitude) : null;
      const maxAltitude = req.query.maxAltitude ? parseInt(req.query.maxAltitude) : null;
      const difficulty = req.query.difficulty ? parseInt(req.query.difficulty) : null;
      const searchQuery = req.query.search?.toLowerCase();
      
      // Charger tous les fichiers de cols enrichis
      const colsFiles = [
        'european-cols-enriched-part1.json',
        'european-cols-enriched-part2.json',
        'european-cols-enriched-part3.json',
        'european-cols-enriched-part4.json',
        'european-cols-enriched-part5.json',
        'european-cols-enriched-part6.json',
        'european-cols-enriched-part7.json',
        'european-cols-enriched-part8.json',
        'european-cols-enriched-part9.json',
        'european-cols-enriched-part10.json'
      ];
      
      let allCols = [];
      
      // Lire et fusionner tous les fichiers
      for (const file of colsFiles) {
        try {
          const filePath = path.join(__dirname, '../data', file);
          const fileData = await fs.readFile(filePath, 'utf8');
          const cols = JSON.parse(fileData);
          allCols = [...allCols, ...cols];
        } catch (fileError) {
          logger.warn(`Impossible de charger le fichier ${file}: ${fileError.message}`);
          // Continue avec les autres fichiers même si l'un d'eux est manquant
        }
      }
      
      // Appliquer les filtres
      let filteredCols = allCols.filter(col => {
        let match = true;
        
        if (region && col.location.region !== region) {
          match = false;
        }
        
        if (country && col.location.country !== country) {
          match = false;
        }
        
        if (minAltitude !== null && col.altitude < minAltitude) {
          match = false;
        }
        
        if (maxAltitude !== null && col.altitude > maxAltitude) {
          match = false;
        }
        
        if (difficulty !== null && col.difficulty !== difficulty) {
          match = false;
        }
        
        if (searchQuery) {
          const nameMatch = col.name.toLowerCase().includes(searchQuery);
          const regionMatch = col.location.region.toLowerCase().includes(searchQuery);
          const countryMatch = col.location.country.toLowerCase().includes(searchQuery);
          
          if (!(nameMatch || regionMatch || countryMatch)) {
            match = false;
          }
        }
        
        return match;
      });
      
      // Obtenir le nombre total d'éléments après filtrage
      const totalItems = filteredCols.length;
      
      // Appliquer la pagination
      filteredCols = filteredCols.slice(skip, skip + limit);
      
      // Créer un objet de réponse approprié
      const response = {
        cols: filteredCols,
        pagination: {
          total: totalItems,
          page,
          limit,
          pages: Math.ceil(totalItems / limit)
        }
      };
      
      res.json(response);
    } catch (error) {
      logger.error(`Erreur lors de la récupération des cols européens: ${error.message}`);
      res.status(500).json({ message: 'Erreur serveur lors de la récupération des cols' });
    }
  },
  
  /**
   * Récupère un col spécifique par son ID
   */
  getColById: async (req, res) => {
    try {
      const colId = req.params.id;
      
      // Charger tous les fichiers de cols enrichis
      const colsFiles = [
        'european-cols-enriched-part1.json',
        'european-cols-enriched-part2.json',
        'european-cols-enriched-part3.json',
        'european-cols-enriched-part4.json',
        'european-cols-enriched-part5.json',
        'european-cols-enriched-part6.json',
        'european-cols-enriched-part7.json',
        'european-cols-enriched-part8.json',
        'european-cols-enriched-part9.json',
        'european-cols-enriched-part10.json'
      ];
      
      let foundCol = null;
      
      // Parcourir tous les fichiers pour trouver le col correspondant
      for (const file of colsFiles) {
        try {
          const filePath = path.join(__dirname, '../data', file);
          const fileData = await fs.readFile(filePath, 'utf8');
          const cols = JSON.parse(fileData);
          
          foundCol = cols.find(col => col.id === colId);
          if (foundCol) break;
        } catch (fileError) {
          logger.warn(`Impossible de charger le fichier ${file}: ${fileError.message}`);
          // Continue avec les autres fichiers même si l'un d'eux est manquant
        }
      }
      
      if (!foundCol) {
        return res.status(404).json({ message: 'Col non trouvé' });
      }
      
      res.json(foundCol);
    } catch (error) {
      logger.error(`Erreur lors de la récupération du col ${req.params.id}: ${error.message}`);
      res.status(500).json({ message: 'Erreur serveur lors de la récupération du col' });
    }
  },
  
  /**
   * Récupère les données 3D d'un col spécifique
   */
  getCol3DData: async (req, res) => {
    try {
      const colId = req.params.id;
      
      // Vérifier si des données 3D existent pour ce col
      const threeDFilePath = path.join(__dirname, '../data/3d', `${colId}.json`);
      
      try {
        const fileData = await fs.readFile(threeDFilePath, 'utf8');
        const data = JSON.parse(fileData);
        res.json(data);
      } catch (fileError) {
        // Générer des données 3D basiques si le fichier n'existe pas
        logger.info(`Aucune donnée 3D trouvée pour le col ${colId}, génération de données basiques`);
        
        // Trouver les informations du col pour générer des données basées sur ses attributs
        let colInfo = null;
        const colsFiles = [
          'european-cols-enriched-part1.json',
          'european-cols-enriched-part2.json',
          'european-cols-enriched-part3.json',
          'european-cols-enriched-part4.json',
          'european-cols-enriched-part5.json',
          'european-cols-enriched-part6.json',
          'european-cols-enriched-part7.json',
          'european-cols-enriched-part8.json',
          'european-cols-enriched-part9.json',
          'european-cols-enriched-part10.json'
        ];
        
        for (const file of colsFiles) {
          try {
            const filePath = path.join(__dirname, '../data', file);
            const data = await fs.readFile(filePath, 'utf8');
            const cols = JSON.parse(data);
            
            colInfo = cols.find(col => col.id === colId);
            if (colInfo) break;
          } catch (error) {
            // Continuer avec le prochain fichier
          }
        }
        
        if (!colInfo) {
          return res.status(404).json({ message: 'Col non trouvé' });
        }
        
        // Générer un modèle 3D basique basé sur les données du col
        const genericData = generateGeneric3DData(colInfo);
        res.json(genericData);
      }
    } catch (error) {
      logger.error(`Erreur lors de la récupération des données 3D pour le col ${req.params.id}: ${error.message}`);
      res.status(500).json({ message: 'Erreur serveur lors de la récupération des données 3D' });
    }
  },
  
  /**
   * Récupère les régions et pays disponibles pour les filtres
   */
  getFilterOptions: async (req, res) => {
    try {
      // Charger tous les fichiers de cols enrichis
      const colsFiles = [
        'european-cols-enriched-part1.json',
        'european-cols-enriched-part2.json',
        'european-cols-enriched-part3.json',
        'european-cols-enriched-part4.json',
        'european-cols-enriched-part5.json',
        'european-cols-enriched-part6.json',
        'european-cols-enriched-part7.json',
        'european-cols-enriched-part8.json',
        'european-cols-enriched-part9.json',
        'european-cols-enriched-part10.json'
      ];
      
      let allCols = [];
      
      // Lire et fusionner tous les fichiers
      for (const file of colsFiles) {
        try {
          const filePath = path.join(__dirname, '../data', file);
          const fileData = await fs.readFile(filePath, 'utf8');
          const cols = JSON.parse(fileData);
          allCols = [...allCols, ...cols];
        } catch (fileError) {
          logger.warn(`Impossible de charger le fichier ${file}: ${fileError.message}`);
          // Continue avec les autres fichiers même si l'un d'eux est manquant
        }
      }
      
      // Extraire les régions et pays uniques
      const regions = [...new Set(allCols.map(col => col.location.region))].sort();
      const countries = [...new Set(allCols.map(col => col.location.country))].sort();
      
      // Trouver les altitudes min et max
      const altitudes = allCols.map(col => col.altitude);
      const minAltitude = Math.min(...altitudes);
      const maxAltitude = Math.max(...altitudes);
      
      // Trouver les niveaux de difficulté disponibles
      const difficulties = [...new Set(allCols.map(col => col.difficulty))].sort((a, b) => a - b);
      
      res.json({
        regions,
        countries,
        altitudeRange: {
          min: minAltitude,
          max: maxAltitude
        },
        difficulties
      });
    } catch (error) {
      logger.error(`Erreur lors de la récupération des options de filtre: ${error.message}`);
      res.status(500).json({ message: 'Erreur serveur lors de la récupération des options de filtre' });
    }
  }
};

/**
 * Génère des données 3D basiques pour un col
 */
function generateGeneric3DData(colInfo) {
  // Déterminer les caractéristiques du terrain en fonction des données du col
  const climbData = colInfo.climbData || {};
  const sides = Object.keys(climbData);
  
  // Prendre les données de la première face disponible pour la génération
  const sideName = sides.length > 0 ? sides[0] : null;
  const sideData = sideName ? climbData[sideName] : null;
  
  // Calculer la longueur et l'élévation pour le modèle 3D
  const length = sideData ? sideData.length : 10; // Valeur par défaut si non disponible
  const elevation = sideData ? sideData.elevation : 500; // Valeur par défaut si non disponible
  
  // Générer un tableau de hauteurs pour représenter le profil d'élévation
  const width = 100; // Résolution horizontale
  const height = 100; // Résolution verticale
  const heights = Array(height).fill().map(() => Array(width).fill(0));
  
  // Générer un profil d'élévation simplifié basé sur la difficulté et les données du col
  const difficulty = colInfo.difficulty || 3;
  const gradient = sideData ? sideData.averageGradient / 100 : 0.07; // Convertir % en facteur
  const maxGradient = sideData ? sideData.maxGradient / 100 : 0.12; // Convertir % en facteur
  
  // Créer un profil avec une élévation progressive et quelques variations
  for (let z = 0; z < height; z++) {
    for (let x = 0; x < width; x++) {
      // Calculer l'élévation de base (progression linéaire)
      let baseElevation = (x / width) * elevation;
      
      // Ajouter des variations en fonction de la difficulté
      if (difficulty >= 4) {
        // Cols plus difficiles : sections plus raides et irrégulières
        const variationFactor = 0.2 + (difficulty - 3) * 0.1;
        const variationFrequency = 0.05 + (difficulty - 3) * 0.02;
        
        // Ajouter des sections plus raides aléatoirement
        if (Math.random() < variationFrequency && x > width * 0.2 && x < width * 0.8) {
          baseElevation += Math.random() * elevation * variationFactor;
        }
      }
      
      // Ajouter une variation latérale (perpendiculaire à la direction de montée)
      const lateralVariation = Math.sin(z * 0.1) * 20 * (difficulty / 5);
      
      heights[z][x] = baseElevation + lateralVariation;
    }
  }
  
  // Adoucir le terrain
  smoothHeightMap(heights, 2);
  
  // Déterminer le type de surface principal
  const surfaceType = colInfo.surfaceType || 'Asphalte';
  
  // Créer une carte des types de surface
  const surfaceTypes = Array(height).fill().map(() => Array(width).fill('asphalt'));
  
  // Si la surface n'est pas de l'asphalte standard, ajuster la carte des surfaces
  if (surfaceType.toLowerCase().includes('gravel') || surfaceType.toLowerCase().includes('gravier')) {
    for (let z = 0; z < height; z++) {
      for (let x = 0; x < width; x++) {
        if (Math.random() < 0.7) {
          surfaceTypes[z][x] = 'gravel';
        }
      }
    }
  }
  
  // Créer des points d'intérêt pour la visualisation 3D
  const pointsOfInterest = [];
  
  // Ajouter le sommet comme point d'intérêt
  pointsOfInterest.push({
    name: `Sommet - ${colInfo.name}`,
    x: width - 10,
    z: height / 2,
    elevation: heights[Math.floor(height/2)][width-10],
    type: 'summit'
  });
  
  // Ajouter d'autres points d'intérêt basés sur les POI du col
  if (colInfo.pointsOfInterest && colInfo.pointsOfInterest.length > 0) {
    colInfo.pointsOfInterest.forEach((poi, index) => {
      if (index < 5) { // Limiter le nombre de POI pour la visualisation
        const xPos = 10 + Math.floor(Math.random() * (width - 20));
        const zPos = 10 + Math.floor(Math.random() * (height - 20));
        
        pointsOfInterest.push({
          name: poi.name,
          x: xPos,
          z: zPos,
          elevation: heights[zPos][xPos],
          type: poi.type || 'landmark'
        });
      }
    });
  }
  
  return {
    elevationData: {
      width,
      height,
      heights,
      maxElevation: elevation
    },
    surfaceTypes,
    pointsOfInterest
  };
}

/**
 * Fonction pour adoucir une carte de hauteurs
 */
function smoothHeightMap(heights, iterations = 1) {
  const height = heights.length;
  const width = heights[0].length;
  
  for (let iter = 0; iter < iterations; iter++) {
    const tempHeights = JSON.parse(JSON.stringify(heights));
    
    for (let z = 1; z < height - 1; z++) {
      for (let x = 1; x < width - 1; x++) {
        // Moyenne avec les cellules voisines
        heights[z][x] = (
          tempHeights[z-1][x] + 
          tempHeights[z+1][x] + 
          tempHeights[z][x-1] + 
          tempHeights[z][x+1] + 
          tempHeights[z][x]
        ) / 5;
      }
    }
  }
}

module.exports = europeanColsController;
