/**
 * Service pour la gestion des données des cols cyclistes
 */
import api from './api';

// Vérifier si nous utilisons les données mockées ou les API réelles
const USE_MOCK_DATA = process.env.REACT_APP_USE_MOCK_DATA === 'true';

// Données mockées des cols cyclistes
const mockCols = [
  {
    id: 'col-1',
    name: 'Col du Grand Ballon',
    elevation: 1424,
    location: {
      lat: 47.9019,
      lng: 7.0958
    },
    difficulty: 'Difficile',
    length: 9.3,
    avgGradient: 6.8,
    maxGradient: 11.2,
    region: 'Vosges',
    description: 'Le Grand Ballon, plus haut sommet du massif des Vosges, offre une ascension exigeante avec des panoramas exceptionnels sur la plaine d\'Alsace.',
    imageUrl: 'https://www.cyclingcols.com/sites/default/files/col/Grand%20Ballon/grand%20ballon%20gravel.jpg',
    terrainData: {
      elevationProfile: [
        { distance: 0, elevation: 454 },
        { distance: 1, elevation: 525 },
        { distance: 2, elevation: 610 },
        { distance: 3, elevation: 703 },
        { distance: 4, elevation: 812 },
        { distance: 5, elevation: 918 },
        { distance: 6, elevation: 1049 },
        { distance: 7, elevation: 1186 },
        { distance: 8, elevation: 1320 },
        { distance: 9, elevation: 1424 }
      ],
      // Coordonnées 3D approximatives pour la visualisation
      coordinates3D: Array.from({ length: 100 }, (_, i) => {
        const t = i / 99;
        const distance = t * 9.3;
        const elevation = 454 + t * (1424 - 454);
        const width = 0.5 * Math.sin(t * Math.PI); // Largeur de la route
        
        return {
          x: distance,  // Distance horizontale
          y: elevation / 100,  // Élévation (échelle réduite pour la visualisation)
          z: width      // Largeur de la route
        };
      }),
      // Points d'intérêt le long du col
      pointsOfInterest: [
        { distance: 2.3, type: 'viewpoint', name: 'Vue sur la Vallée de Guebwiller' },
        { distance: 5.7, type: 'rest', name: 'Ferme-Auberge du Grand Ballon' },
        { distance: 9.3, type: 'summit', name: 'Sommet du Grand Ballon' }
      ]
    }
  },
  {
    id: 'col-2',
    name: 'Col de la Schlucht',
    elevation: 1139,
    location: {
      lat: 48.0565,
      lng: 7.0094
    },
    difficulty: 'Modéré',
    length: 7.8,
    avgGradient: 5.5,
    maxGradient: 8.0,
    region: 'Vosges',
    description: 'Le Col de la Schlucht est l\'un des cols les plus connus des Vosges, reliant la vallée de Kaysersberg à celle de Gérardmer, avec une route bien entretenue et des forêts luxuriantes.',
    imageUrl: 'https://www.cyclingcols.com/sites/default/files/col/Schlucht/col%20de%20la%20schlucht_0.jpg',
    terrainData: {
      elevationProfile: [
        { distance: 0, elevation: 710 },
        { distance: 1, elevation: 760 },
        { distance: 2, elevation: 815 },
        { distance: 3, elevation: 880 },
        { distance: 4, elevation: 940 },
        { distance: 5, elevation: 1000 },
        { distance: 6, elevation: 1075 },
        { distance: 7, elevation: 1120 },
        { distance: 7.8, elevation: 1139 }
      ],
      // Coordonnées 3D approximatives pour la visualisation
      coordinates3D: Array.from({ length: 100 }, (_, i) => {
        const t = i / 99;
        const distance = t * 7.8;
        const elevation = 710 + t * (1139 - 710);
        const width = 0.7 * Math.sin(t * Math.PI); // Largeur de la route
        
        return {
          x: distance,  // Distance horizontale
          y: elevation / 100,  // Élévation (échelle réduite pour la visualisation)
          z: width      // Largeur de la route
        };
      }),
      // Points d'intérêt le long du col
      pointsOfInterest: [
        { distance: 2.5, type: 'rest', name: 'Auberge du Schantzwasen' },
        { distance: 4.8, type: 'viewpoint', name: 'Point de vue sur les Vosges' },
        { distance: 7.8, type: 'summit', name: 'Col de la Schlucht' }
      ]
    }
  },
  {
    id: 'col-3',
    name: 'Col du Donon',
    elevation: 727,
    location: {
      lat: 48.5121,
      lng: 7.1526
    },
    difficulty: 'Facile',
    length: 5.4,
    avgGradient: 4.2,
    maxGradient: 7.5,
    region: 'Vosges',
    description: 'Le Col du Donon est une ascension accessible offrant de beaux passages forestiers et des vues dégagées au sommet, dominé par le Temple du Donon.',
    imageUrl: 'https://www.cyclingcols.com/sites/default/files/col/Donon/donon.jpg',
    terrainData: {
      elevationProfile: [
        { distance: 0, elevation: 500 },
        { distance: 1, elevation: 540 },
        { distance: 2, elevation: 580 },
        { distance: 3, elevation: 630 },
        { distance: 4, elevation: 670 },
        { distance: 5, elevation: 710 },
        { distance: 5.4, elevation: 727 }
      ],
      // Coordonnées 3D approximatives pour la visualisation
      coordinates3D: Array.from({ length: 100 }, (_, i) => {
        const t = i / 99;
        const distance = t * 5.4;
        const elevation = 500 + t * (727 - 500);
        const width = 0.6 * Math.sin(t * Math.PI); // Largeur de la route
        
        return {
          x: distance,  // Distance horizontale
          y: elevation / 100,  // Élévation (échelle réduite pour la visualisation)
          z: width      // Largeur de la route
        };
      }),
      // Points d'intérêt le long du col
      pointsOfInterest: [
        { distance: 1.8, type: 'rest', name: 'Aire de pique-nique' },
        { distance: 3.5, type: 'viewpoint', name: 'Panorama sur la vallée' },
        { distance: 5.4, type: 'summit', name: 'Temple du Donon' }
      ]
    }
  }
];

const ColService = {
  /**
   * Récupère la liste des cols cyclistes
   * @param {Object} options - Options de filtrage
   * @returns {Promise<Array>} Liste des cols
   */
  getAllCols: async (options = {}) => {
    try {
      if (USE_MOCK_DATA) {
        console.log('Using mock data for cols');
        
        // Filtrer les cols selon les options
        let filteredCols = [...mockCols];
        
        if (options.region) {
          filteredCols = filteredCols.filter(col => col.region === options.region);
        }
        
        if (options.difficulty) {
          filteredCols = filteredCols.filter(col => col.difficulty === options.difficulty);
        }
        
        if (options.minElevation) {
          filteredCols = filteredCols.filter(col => col.elevation >= options.minElevation);
        }
        
        if (options.maxElevation) {
          filteredCols = filteredCols.filter(col => col.elevation <= options.maxElevation);
        }
        
        if (options.surface && options.surface.length > 0) {
          filteredCols = filteredCols.filter(col => 
            options.surface.some(s => col.surface && col.surface.toLowerCase().includes(s.toLowerCase()))
          );
        }
        
        if (options.technicalDifficulty) {
          filteredCols = filteredCols.filter(col => 
            col.technical_difficulty && col.technical_difficulty.toString() === options.technicalDifficulty.toString()
          );
        }
        
        if (options.seasons && options.seasons.length > 0) {
          filteredCols = filteredCols.filter(col => 
            col.recommended_season && options.seasons.some(s => 
              col.recommended_season.map(rs => rs.toLowerCase()).includes(s.toLowerCase())
            )
          );
        }
        
        // Simuler une latence réseau
        await new Promise(resolve => setTimeout(resolve, 500));
        return filteredCols;
      }
      
      // Construire les paramètres de requête
      const params = new URLSearchParams();
      if (options.region) params.append('region', options.region);
      if (options.difficulty) params.append('difficulty', options.difficulty);
      if (options.minElevation) params.append('minElevation', options.minElevation);
      if (options.maxElevation) params.append('maxElevation', options.maxElevation);
      if (options.surface && options.surface.length > 0) {
        options.surface.forEach(surface => {
          params.append('surface', surface.toLowerCase());
        });
      }
      if (options.technicalDifficulty) params.append('technicalDifficulty', options.technicalDifficulty);
      if (options.seasons && options.seasons.length > 0) {
        options.seasons.forEach(season => {
          params.append('season', season.toLowerCase());
        });
      }
      
      // Appel API réel
      const response = await api.get(`/cols?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching cols:', error);
      throw error;
    }
  },
  
  /**
   * Récupère les détails d'un col spécifique
   * @param {string} colId - ID du col
   * @returns {Promise<Object>} Détails du col
   */
  getColById: async (colId) => {
    try {
      if (USE_MOCK_DATA) {
        console.log(`Using mock data for col ${colId}`);
        
        const col = mockCols.find(c => c.id === colId);
        if (!col) {
          throw new Error(`Col with ID ${colId} not found`);
        }
        
        // Simuler une latence réseau
        await new Promise(resolve => setTimeout(resolve, 300));
        return col;
      }
      
      // Appel API réel
      const response = await api.get(`/cols/${colId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching col ${colId}:`, error);
      throw error;
    }
  },
  
  /**
   * Récupère les données d'élévation d'un col pour le graphique
   * @param {string} colId - ID du col
   * @returns {Promise<Array>} Données d'élévation
   */
  getColElevationData: async (colId) => {
    try {
      if (USE_MOCK_DATA) {
        console.log(`Using mock data for elevation profile of col ${colId}`);
        
        const col = mockCols.find(c => c.id === colId);
        if (!col) {
          throw new Error(`Col with ID ${colId} not found`);
        }
        
        // Simuler une latence réseau
        await new Promise(resolve => setTimeout(resolve, 200));
        return col.terrainData.elevationProfile;
      }
      
      // Appel API réel
      const response = await api.get(`/cols/${colId}/elevation`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching elevation data for col ${colId}:`, error);
      throw error;
    }
  },
  
  /**
   * Récupère les données de terrain 3D d'un col pour la visualisation
   * @param {string} colId - ID du col
   * @returns {Promise<Object>} Données de terrain 3D
   */
  getCol3DTerrainData: async (colId) => {
    try {
      if (USE_MOCK_DATA) {
        console.log(`Using mock data for 3D terrain of col ${colId}`);
        
        const col = mockCols.find(c => c.id === colId);
        if (!col) {
          throw new Error(`Col with ID ${colId} not found`);
        }
        
        // Simuler une latence réseau
        await new Promise(resolve => setTimeout(resolve, 400));
        return {
          coordinates: col.terrainData.coordinates3D,
          pointsOfInterest: col.terrainData.pointsOfInterest
        };
      }
      
      // Appel API réel
      const response = await api.get(`/cols/${colId}/terrain3d`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching 3D terrain data for col ${colId}:`, error);
      throw error;
    }
  }
};

export default ColService;
