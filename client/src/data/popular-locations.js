/**
 * Données des localisations populaires pour le préchargement météo
 * Contient les coordonnées des cols et itinéraires les plus consultés
 */

export const popular_locations = [
  // Cols emblématiques des Vosges
  {
    id: "col_ballon_alsace",
    name: "Col du Ballon d'Alsace",
    lat: 47.8239,
    lng: 6.8368,
    elevation: 1178,
    category: "col",
    region: "vosges",
    popularity: 9.5
  },
  {
    id: "col_schlucht",
    name: "Col de la Schlucht",
    lat: 48.0556,
    lng: 7.0067,
    elevation: 1139,
    category: "col",
    region: "vosges",
    popularity: 9.8
  },
  {
    id: "grand_ballon",
    name: "Grand Ballon",
    lat: 47.9017,
    lng: 7.0983,
    elevation: 1424,
    category: "col",
    region: "vosges",
    popularity: 10
  },
  {
    id: "col_platzerwasel",
    name: "Col du Platzerwasel",
    lat: 47.9320,
    lng: 7.0486,
    elevation: 1182,
    category: "col",
    region: "vosges",
    popularity: 8.2
  },
  {
    id: "col_bonhomme",
    name: "Col du Bonhomme",
    lat: 48.1769,
    lng: 7.0981,
    elevation: 949,
    category: "col",
    region: "vosges",
    popularity: 8.5
  },
  {
    id: "petit_ballon",
    name: "Petit Ballon",
    lat: 47.9153,
    lng: 7.1467,
    elevation: 1272,
    category: "col",
    region: "vosges",
    popularity: 8.8
  },
  {
    id: "col_firstplan",
    name: "Col du Firstplan",
    lat: 47.9333,
    lng: 7.1167,
    elevation: 722,
    category: "col",
    region: "vosges",
    popularity: 7.5
  },
  {
    id: "col_hundsruck",
    name: "Col du Hundsruck",
    lat: 47.9897,
    lng: 7.0731,
    elevation: 748,
    category: "col",
    region: "vosges",
    popularity: 7.2
  },
  
  // Villes principales de la région
  {
    id: "city_strasbourg",
    name: "Strasbourg",
    lat: 48.5734,
    lng: 7.7521,
    category: "city",
    region: "alsace",
    popularity: 9.5
  },
  {
    id: "city_colmar",
    name: "Colmar",
    lat: 48.0794,
    lng: 7.3580,
    category: "city",
    region: "alsace",
    popularity: 8.9
  },
  {
    id: "city_mulhouse",
    name: "Mulhouse",
    lat: 47.7515,
    lng: 7.3399,
    category: "city",
    region: "alsace",
    popularity: 8.2
  },
  {
    id: "city_metz",
    name: "Metz",
    lat: 49.1193,
    lng: 6.1757,
    category: "city",
    region: "lorraine",
    popularity: 8.7
  },
  {
    id: "city_nancy",
    name: "Nancy",
    lat: 48.6921,
    lng: 6.1844,
    category: "city",
    region: "lorraine",
    popularity: 8.8
  },
  {
    id: "city_gerardmer",
    name: "Gérardmer",
    lat: 48.0743,
    lng: 6.8726,
    category: "city",
    region: "vosges",
    popularity: 8.6
  },
  
  // Lacs et points d'intérêt
  {
    id: "lake_gerardmer",
    name: "Lac de Gérardmer",
    lat: 48.0663,
    lng: 6.8532,
    category: "lake",
    region: "vosges",
    popularity: 8.3
  },
  {
    id: "lake_longemer",
    name: "Lac de Longemer",
    lat: 48.0651,
    lng: 6.9484,
    category: "lake",
    region: "vosges",
    popularity: 7.8
  },
  {
    id: "lake_retournemer",
    name: "Lac de Retournemer",
    lat: 48.0583,
    lng: 6.9737,
    category: "lake",
    region: "vosges",
    popularity: 7.5
  },
  
  // Points de départ d'itinéraires populaires
  {
    id: "route_start_route_des_cretes",
    name: "Départ Route des Crêtes",
    lat: 47.9965,
    lng: 7.0072,
    category: "route_start",
    region: "vosges",
    popularity: 9.6
  },
  {
    id: "route_start_route_des_vins",
    name: "Départ Route des Vins",
    lat: 47.9112,
    lng: 7.2356,
    category: "route_start",
    region: "alsace",
    popularity: 9.2
  },
  {
    id: "route_start_grand_est_tour",
    name: "Départ Grand Est Tour",
    lat: 48.5823,
    lng: 7.7505,
    category: "route_start",
    region: "alsace",
    popularity: 8.7
  }
];

/**
 * Fonction pour obtenir les localisations les plus populaires
 * @param {number} limit Nombre maximum de résultats à retourner
 * @param {string} category Catégorie de localisation (col, city, lake, route_start)
 * @param {string} region Région (vosges, alsace, lorraine)
 * @returns {Array} Localisations filtrées
 */
export const getPopularLocations = (limit = 10, category = null, region = null) => {
  let filteredLocations = [...popular_locations];
  
  // Filtrer par catégorie si spécifié
  if (category) {
    filteredLocations = filteredLocations.filter(loc => loc.category === category);
  }
  
  // Filtrer par région si spécifié
  if (region) {
    filteredLocations = filteredLocations.filter(loc => loc.region === region);
  }
  
  // Trier par popularité décroissante
  filteredLocations.sort((a, b) => b.popularity - a.popularity);
  
  // Limiter le nombre de résultats
  return filteredLocations.slice(0, limit);
};

/**
 * Obtient les coordonnées d'une localisation par son ID
 * @param {string} id Identifiant de la localisation
 * @returns {Object|null} Coordonnées {lat, lng} ou null si non trouvé
 */
export const getLocationById = (id) => {
  const location = popular_locations.find(loc => loc.id === id);
  return location ? { lat: location.lat, lng: location.lng, name: location.name } : null;
};
