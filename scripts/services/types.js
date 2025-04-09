/**
 * Types et interfaces pour la gestion des cols
 * Version JavaScript des types proposés
 */

/**
 * @typedef {Object} ColBase
 * @property {string} name - Nom du col
 * @property {string} region - Région où se trouve le col
 * @property {string} country - Pays du col
 * @property {number} elevation - Altitude du col en mètres
 * @property {number} length - Longueur du col en kilomètres
 * @property {number} avgGradient - Pente moyenne en pourcentage
 * @property {number} maxGradient - Pente maximale en pourcentage
 * @property {'easy'|'medium'|'hard'|'extreme'} difficulty - Niveau de difficulté
 * @property {[number, number]} coordinates - Coordonnées [lat, lon] du sommet
 * @property {string} description - Description détaillée du col
 * @property {ColClimb[]} climbs - Les différentes ascensions possibles
 * @property {string[]} tags - Tags associés au col
 */

/**
 * @typedef {Object} ColClimb
 * @property {string} side - Côté de l'ascension (nord, sud, etc.)
 * @property {[number, number]} startCoordinates - Coordonnées du début de l'ascension [lat, lon]
 * @property {[number, number]} endCoordinates - Coordonnées de la fin de l'ascension [lat, lon]
 * @property {number} length - Longueur de l'ascension en kilomètres
 * @property {number} avgGradient - Pente moyenne de l'ascension en pourcentage
 * @property {number} maxGradient - Pente maximale de l'ascension en pourcentage
 */

/**
 * @typedef {Object} ElevationProfile
 * @property {Array<Object>} points - Points du profil d'élévation
 * @property {Array<Object>} segments - Segments significatifs du profil
 * @property {Object} stats - Statistiques du profil
 * @property {Object} metadata - Métadonnées du profil
 */

/**
 * @typedef {Object} TerrainData
 * @property {Object} boundingBox - Délimitation géographique du terrain
 * @property {Array<Object>} features - Caractéristiques du terrain
 * @property {Object} textures - URLs vers les textures du terrain
 */

/**
 * @typedef {Object} WeatherData
 * @property {Object} climate - Données climatiques générales
 * @property {Object} seasonal - Données saisonnières
 * @property {Object} typical - Conditions météo typiques
 */

/**
 * @typedef {Object} RenderSettings
 * @property {string} quality - Qualité du rendu (low, medium, high, ultra)
 * @property {number} textureResolution - Résolution des textures
 * @property {string} shadowQuality - Qualité des ombres
 * @property {number} vegetationDensity - Densité de la végétation
 * @property {boolean} waterEffects - Effets d'eau activés
 * @property {boolean} atmosphericEffects - Effets atmosphériques activés
 */

/**
 * @typedef {Object} Visualization3D
 * @property {ElevationProfile} elevationProfile - Profil d'élévation
 * @property {TerrainData} terrain - Données de terrain
 * @property {WeatherData} weather - Données météorologiques
 * @property {RenderSettings} renderSettings - Paramètres de rendu 3D
 */

/**
 * @typedef {Object} Metadata
 * @property {Date} lastUpdated - Date de dernière mise à jour
 * @property {string} dataVersion - Version des données
 * @property {string[]} dataSource - Sources des données
 * @property {'verified'|'pending'|'unverified'} verificationStatus - Statut de vérification
 */

/**
 * @typedef {Object} Col
 * @property {string} _id - ID MongoDB du col
 * @property {string} name - Nom du col
 * @property {string} region - Région où se trouve le col
 * @property {string} country - Pays du col
 * @property {number} elevation - Altitude du col en mètres
 * @property {number} length - Longueur du col en kilomètres
 * @property {number} avgGradient - Pente moyenne en pourcentage
 * @property {number} maxGradient - Pente maximale en pourcentage
 * @property {'easy'|'medium'|'hard'|'extreme'} difficulty - Niveau de difficulté
 * @property {[number, number]} coordinates - Coordonnées [lat, lon] du sommet
 * @property {string} description - Description détaillée du col
 * @property {ColClimb[]} climbs - Les différentes ascensions possibles
 * @property {string[]} tags - Tags associés au col
 * @property {Visualization3D} visualization3D - Données pour la visualisation 3D
 * @property {ElevationProfile} elevation_profile - Profil d'élévation (format compatible)
 * @property {Metadata} metadata - Métadonnées du col
 * @property {Date} createdAt - Date de création
 * @property {Date} updatedAt - Date de dernière mise à jour
 */

module.exports = {
  // Les types sont documentés via JSDoc pour utilisation en JavaScript
};
