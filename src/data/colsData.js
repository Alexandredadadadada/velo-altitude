/**
 * Base de données des cols cyclistes européens
 * Contient les informations détaillées sur plus de 50 cols majeurs
 */

import colsAlpes from './cols/colsAlpes';
import colsPyrenees from './cols/colsPyrenees';
import colsVosges from './cols/colsVosges';
import colsJura from './cols/colsJura';
import colsMassifCentral from './cols/colsMassifCentral';
import colsDolomites from './cols/colsDolomites';
import colsAlpesSuisses from './cols/colsAlpesSuisses';
import colsVosgesNord from './cols/colsVosgesNord';

// Structure d'un col:
// {
//   id: 'string', // Identifiant unique
//   name: 'string', // Nom du col
//   region: 'string', // Région (alpes, pyrenees, vosges, jura, massif-central, dolomites, alps-switzerland)
//   country: 'string', // Pays
//   altitude: number, // Altitude en mètres
//   length: number, // Longueur en km
//   avgGradient: number, // Pente moyenne en %
//   maxGradient: number, // Pente maximale en %
//   difficulty: 'string', // Difficulté (easy, medium, hard, extreme)
//   elevationGain: number, // Dénivelé en mètres
//   startLocation: 'string', // Lieu de départ
//   endLocation: 'string', // Lieu d'arrivée (souvent le nom du col)
//   description: 'string', // Description du col
//   history: 'string', // Histoire du col (Tour de France, etc.)
//   imageUrl: 'string', // URL de l'image principale
//   mapUrl: 'string', // URL d'une carte
//   profileUrl: 'string', // URL du profil d'élévation
//   popularSegments: [
//     {
//       name: 'string', // Nom du segment
//       length: number, // Longueur en km
//       gradient: number, // Pente moyenne en %
//       description: 'string' // Description du segment
//     }
//   ],
//   routes: [ // Différentes approches du col
//     {
//       name: 'string', // Nom de la route (par exemple "versant nord", "versant sud", etc.)
//       startLocation: 'string', // Point de départ
//       length: number, // Longueur en km
//       elevationGain: number, // Dénivelé en mètres
//       avgGradient: number, // Pente moyenne en %
//       maxGradient: number, // Pente maximale en %
//       difficulty: 'string', // Difficulté spécifique à cette approche
//       description: 'string' // Description de cette approche
//     }
//   ],
//   touristicInfo: 'string', // Informations touristiques
//   facilities: [ // Équipements disponibles
//     {
//       type: 'string', // Type d'équipement (water, food, bike-shop, toilet, etc.)
//       location: 'string', // Emplacement
//       description: 'string' // Description
//     }
//   ],
//   bestTimeToVisit: 'string', // Meilleure période pour visiter
//   weatherInfo: 'string', // Informations météo générales
//   strava: { // Informations Strava
//     segmentId: 'string', // ID du segment Strava
//     komTime: 'string', // Temps record
//     komName: 'string' // Nom du détenteur du record
//   },
//   relatedCols: ['string'] // IDs des cols proches ou similaires
// }

/**
 * Récupère tous les cols disponibles dans la base de données
 * @returns {Array} Liste de tous les cols
 */
export const getAllCols = () => {
  return [
    ...colsAlpes,
    ...colsPyrenees,
    ...colsVosges,
    ...colsJura,
    ...colsMassifCentral,
    ...colsDolomites,
    ...colsAlpesSuisses,
    ...colsVosgesNord
  ];
};

/**
 * Récupère les cols par région
 * @param {string} region - Code de la région (alpes, pyrenees, etc.)
 * @returns {Array} Liste des cols de la région
 */
export const getColsByRegion = (region) => {
  switch (region) {
    case 'alpes':
      return colsAlpes;
    case 'pyrenees':
      return colsPyrenees;
    case 'vosges':
      return colsVosges;
    case 'jura':
      return colsJura;
    case 'massif-central':
      return colsMassifCentral;
    case 'dolomites':
      return colsDolomites;
    case 'alpes-suisses':
      return colsAlpesSuisses;
    case 'vosges-nord':
      return colsVosgesNord;
    default:
      return [];
  }
};

/**
 * Récupère un col par son ID
 * @param {string} colId - Identifiant unique du col
 * @returns {Object|null} Détails du col ou null si non trouvé
 */
export const getColById = (colId) => {
  const allCols = getAllCols();
  return allCols.find(col => col.id === colId) || null;
};

/**
 * Filtre les cols selon différents critères
 * @param {Object} filters - Critères de filtrage
 * @returns {Array} Liste des cols filtrés
 */
export const filterCols = (filters) => {
  let cols = getAllCols();
  
  // Filtre par région
  if (filters.region && filters.region !== 'all') {
    cols = getColsByRegion(filters.region);
  }
  
  // Filtre par difficulté
  if (filters.difficulty && filters.difficulty !== 'all') {
    cols = cols.filter(col => col.difficulty === filters.difficulty);
  }
  
  // Filtre par altitude
  if (filters.altitude && filters.altitude !== 'all') {
    switch (filters.altitude) {
      case '0-1000':
        cols = cols.filter(col => col.altitude < 1000);
        break;
      case '1000-1500':
        cols = cols.filter(col => col.altitude >= 1000 && col.altitude < 1500);
        break;
      case '1500-2000':
        cols = cols.filter(col => col.altitude >= 1500 && col.altitude < 2000);
        break;
      case '2000+':
        cols = cols.filter(col => col.altitude >= 2000);
        break;
    }
  }
  
  // Filtre par pays
  if (filters.country && filters.country !== 'all') {
    cols = cols.filter(col => col.country === filters.country);
  }
  
  // Filtre par longueur
  if (filters.length) {
    const [min, max] = filters.length.split('-').map(Number);
    if (max) {
      cols = cols.filter(col => col.length >= min && col.length <= max);
    } else {
      cols = cols.filter(col => col.length >= min);
    }
  }
  
  return cols;
};

/**
 * Obtient les cols recommandés selon différents critères
 * @param {string} criterion - Critère de recommandation (popular, scenic, challenging)
 * @param {number} limit - Nombre de cols à retourner
 * @returns {Array} Liste des cols recommandés
 */
export const getRecommendedCols = (criterion = 'popular', limit = 5) => {
  const allCols = getAllCols();
  
  switch (criterion) {
    case 'scenic':
      // Prioriser les cols avec des vues panoramiques
      const scenicCols = allCols.filter(col => 
        col.description.toLowerCase().includes('panoram') || 
        col.description.toLowerCase().includes('vue') ||
        col.description.toLowerCase().includes('paysage')
      );
      return scenicCols.slice(0, limit);
      
    case 'challenging':
      // Cols les plus difficiles
      return [...allCols]
        .sort((a, b) => 
          (b.avgGradient * b.length) - (a.avgGradient * a.length)
        )
        .slice(0, limit);
      
    case 'popular':
    default:
      // Cols les plus populaires (Tour de France, etc.)
      const popularCols = allCols.filter(col => 
        col.history.toLowerCase().includes('tour de france') || 
        col.history.toLowerCase().includes('giro') ||
        col.history.toLowerCase().includes('vuelta')
      );
      return popularCols.slice(0, limit);
  }
};

export default {
  getAllCols,
  getColsByRegion,
  getColById,
  filterCols,
  getRecommendedCols
};
