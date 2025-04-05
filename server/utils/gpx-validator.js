/**
 * Utilitaire de validation et traitement des fichiers GPX
 * Fournit des fonctions pour valider, analyser et traiter les fichiers GPX
 */

const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const logger = require('./logger');
const weatherErrorHandler = require('./weather-error-handler');

// Codes d'erreur pour les problèmes liés aux fichiers GPX
const GPX_ERROR_CODES = {
  NO_FILE: 'GPX_NO_FILE',
  INVALID_FORMAT: 'GPX_INVALID_FORMAT',
  FILE_TOO_LARGE: 'GPX_FILE_TOO_LARGE',
  EMPTY_CONTENT: 'GPX_EMPTY_CONTENT',
  PARSING_ERROR: 'GPX_PARSING_ERROR',
  INVALID_STRUCTURE: 'GPX_INVALID_STRUCTURE',
  NO_COORDINATES: 'GPX_NO_COORDINATES',
  COORDINATES_OUT_OF_RANGE: 'GPX_COORDINATES_OUT_OF_RANGE',
  IO_ERROR: 'GPX_IO_ERROR'
};

/**
 * Valide un fichier GPX avant traitement
 * @param {Object} file - Fichier à valider (multer file object)
 * @returns {Boolean} - true si le fichier est valide
 * @throws {Error} - erreur détaillée en cas de problème
 */
function validateGpxFile(file) {
  try {
    // Vérifier si le fichier existe
    if (!file) {
      throw weatherErrorHandler.setProcessingError(
        'Aucun fichier GPX fourni',
        { code: GPX_ERROR_CODES.NO_FILE },
        'GPX_PARSING_ERROR'
      );
    }

    // Vérifier le type MIME
    if (file.mimetype !== 'application/gpx+xml' && 
        file.mimetype !== 'application/xml' && 
        file.mimetype !== 'text/xml' && 
        !file.originalname.toLowerCase().endsWith('.gpx')) {
      throw weatherErrorHandler.setProcessingError(
        'Le fichier doit être au format GPX',
        { 
          mimetype: file.mimetype,
          filename: file.originalname
        },
        'GPX_PARSING_ERROR'
      );
    }
    
    // Vérifier la taille du fichier (10 MB max)
    if (file.size > 10 * 1024 * 1024) {
      throw weatherErrorHandler.setProcessingError(
        'Le fichier GPX est trop volumineux (max 10 MB)',
        { 
          fileSize: file.size,
          maxSize: 10 * 1024 * 1024
        },
        'GPX_PARSING_ERROR'
      );
    }
    
    return true;
  } catch (error) {
    // Si l'erreur est déjà formatée par weatherErrorHandler, la propager
    if (error.code && error.details) {
      throw error;
    }
    
    // Sinon, créer une erreur formatée
    throw weatherErrorHandler.setProcessingError(
      `Erreur de validation du fichier GPX: ${error.message}`,
      { originalError: error.message },
      'GPX_PARSING_ERROR'
    );
  }
}

/**
 * Valide le contenu XML d'un fichier GPX
 * @param {String} content - Contenu du fichier GPX
 * @returns {Promise<Boolean>} - true si le contenu est valide
 * @throws {Error} - erreur détaillée en cas de problème
 */
async function validateGpxContent(content) {
  try {
    // Vérifier que le contenu est bien du XML
    if (!content || typeof content !== 'string') {
      throw weatherErrorHandler.setProcessingError(
        'Contenu GPX invalide ou vide',
        { contentType: typeof content },
        'GPX_PARSING_ERROR'
      );
    }

    // Vérifier la présence des balises obligatoires dans le XML
    if (!content.includes('<gpx') || !content.includes('</gpx>')) {
      throw weatherErrorHandler.setProcessingError(
        'Structure GPX invalide - balise gpx manquante',
        { 
          hasOpeningTag: content.includes('<gpx'),
          hasClosingTag: content.includes('</gpx>')
        },
        'GPX_PARSING_ERROR'
      );
    }

    // Parser le XML pour vérifier la validité de la structure
    const parser = new xml2js.Parser();
    let result;
    
    try {
      result = await parser.parseStringPromise(content);
    } catch (parseError) {
      throw weatherErrorHandler.setProcessingError(
        `Erreur de parsing XML: ${parseError.message}`,
        { 
          parseError: parseError.message,
          line: parseError.line,
          column: parseError.column
        },
        'GPX_PARSING_ERROR'
      );
    }

    // Vérifier la présence d'au moins une route ou un track
    if (!result.gpx) {
      throw weatherErrorHandler.setProcessingError(
        'Document GPX invalide - élément gpx manquant',
        { content: content.substring(0, 100) + '...' },
        'GPX_PARSING_ERROR'
      );
    }

    // Vérifier la présence d'au moins une route ou un track ou des waypoints
    const hasTrack = result.gpx.trk && result.gpx.trk.length > 0;
    const hasRoute = result.gpx.rte && result.gpx.rte.length > 0;
    const hasWaypoints = result.gpx.wpt && result.gpx.wpt.length > 0;
    
    if (!hasTrack && !hasRoute && !hasWaypoints) {
      throw weatherErrorHandler.setProcessingError(
        'Fichier GPX vide - aucun track, route ou waypoint trouvé',
        { 
          hasTrack,
          hasRoute,
          hasWaypoints
        },
        'GPX_PARSING_ERROR'
      );
    }

    return true;
  } catch (error) {
    // Si l'erreur est déjà formatée par weatherErrorHandler, la propager
    if (error.code && error.details) {
      throw error;
    }
    
    // Sinon, créer une erreur formatée
    throw weatherErrorHandler.setProcessingError(
      `Erreur de validation du contenu GPX: ${error.message}`,
      { originalError: error.message },
      'GPX_PARSING_ERROR'
    );
  }
}

/**
 * Charge et analyse un fichier GPX à partir d'un chemin
 * @param {String} filePath - Chemin vers le fichier GPX
 * @returns {Promise<Object>} - Données GPX analysées
 */
async function parseGpxFile(filePath) {
  try {
    // Vérifier que le fichier existe
    if (!fs.existsSync(filePath)) {
      throw weatherErrorHandler.setProcessingError(
        `Fichier GPX introuvable: ${filePath}`,
        { filePath },
        'GPX_PARSING_ERROR'
      );
    }
    
    // Lire le fichier
    let content;
    try {
      content = fs.readFileSync(filePath, 'utf8');
    } catch (readError) {
      throw weatherErrorHandler.setProcessingError(
        `Erreur lors de la lecture du fichier GPX: ${readError.message}`,
        { 
          filePath,
          error: readError.message
        },
        'GPX_PARSING_ERROR'
      );
    }
    
    // Valider le contenu
    await validateGpxContent(content);
    
    // Parser le XML en objet JavaScript
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(content);
    
    logger.debug('Fichier GPX analysé avec succès', {
      filePath,
      tracks: result.gpx.trk ? result.gpx.trk.length : 0,
      routes: result.gpx.rte ? result.gpx.rte.length : 0,
      waypoints: result.gpx.wpt ? result.gpx.wpt.length : 0
    });
    
    return result;
  } catch (error) {
    // Si l'erreur est déjà formatée par weatherErrorHandler, la propager
    if (error.code && error.details) {
      throw error;
    }
    
    // Sinon, journaliser l'erreur et créer une erreur formatée
    logger.error('Erreur lors de l\'analyse du fichier GPX', { 
      error: error.message, 
      filePath,
      stack: error.stack 
    });
    
    throw weatherErrorHandler.setProcessingError(
      `Erreur lors de l'analyse du fichier GPX: ${error.message}`,
      { 
        filePath,
        originalError: error.message
      },
      'GPX_PARSING_ERROR'
    );
  }
}

/**
 * Extrait les coordonnées d'un fichier GPX parsé
 * @param {Object} gpxData - Données GPX parsées
 * @returns {Array} - Liste des coordonnées [lon, lat, ele]
 */
function extractCoordinates(gpxData) {
  try {
    const coordinates = [];
    
    // Extraire les coordonnées des tracks
    if (gpxData.gpx.trk) {
      gpxData.gpx.trk.forEach(track => {
        if (track.trkseg) {
          track.trkseg.forEach(segment => {
            if (segment.trkpt) {
              segment.trkpt.forEach(point => {
                const lat = parseFloat(point.$.lat);
                const lon = parseFloat(point.$.lon);
                const ele = point.ele ? parseFloat(point.ele[0]) : null;
                
                // Vérifier la validité des coordonnées
                if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
                  throw weatherErrorHandler.setProcessingError(
                    'Coordonnées GPS invalides détectées dans le track',
                    { 
                      latitude: lat,
                      longitude: lon
                    },
                    'GPX_PARSING_ERROR'
                  );
                }
                
                coordinates.push([lon, lat, ele]);
              });
            }
          });
        }
      });
    }
    
    // Extraire les coordonnées des routes
    if (gpxData.gpx.rte) {
      gpxData.gpx.rte.forEach(route => {
        if (route.rtept) {
          route.rtept.forEach(point => {
            const lat = parseFloat(point.$.lat);
            const lon = parseFloat(point.$.lon);
            const ele = point.ele ? parseFloat(point.ele[0]) : null;
            
            // Vérifier la validité des coordonnées
            if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
              throw weatherErrorHandler.setProcessingError(
                'Coordonnées GPS invalides détectées dans la route',
                { 
                  latitude: lat,
                  longitude: lon
                },
                'GPX_PARSING_ERROR'
              );
            }
            
            coordinates.push([lon, lat, ele]);
          });
        }
      });
    }
    
    // Extraire les coordonnées des waypoints
    if (gpxData.gpx.wpt) {
      gpxData.gpx.wpt.forEach(point => {
        const lat = parseFloat(point.$.lat);
        const lon = parseFloat(point.$.lon);
        const ele = point.ele ? parseFloat(point.ele[0]) : null;
        
        // Vérifier la validité des coordonnées
        if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
          throw weatherErrorHandler.setProcessingError(
            'Coordonnées GPS invalides détectées dans le waypoint',
            { 
              latitude: lat,
              longitude: lon
            },
            'GPX_PARSING_ERROR'
          );
        }
        
        coordinates.push([lon, lat, ele]);
      });
    }
    
    // Vérifier qu'il y a au moins une coordonnée
    if (coordinates.length === 0) {
      throw weatherErrorHandler.setProcessingError(
        'Aucune coordonnée GPS valide trouvée dans le fichier GPX',
        { gpxStructure: Object.keys(gpxData.gpx) },
        'GPX_PARSING_ERROR'
      );
    }
    
    logger.debug(`Extraction réussie de ${coordinates.length} points GPS`, {
      firstPoint: coordinates[0],
      lastPoint: coordinates[coordinates.length - 1]
    });
    
    return coordinates;
  } catch (error) {
    // Si l'erreur est déjà formatée par weatherErrorHandler, la propager
    if (error.code && error.details) {
      throw error;
    }
    
    // Sinon, journaliser l'erreur et créer une erreur formatée
    logger.error('Erreur lors de l\'extraction des coordonnées GPX', { 
      error: error.message,
      stack: error.stack 
    });
    
    throw weatherErrorHandler.setProcessingError(
      `Erreur lors de l'extraction des coordonnées: ${error.message}`,
      { originalError: error.message },
      'GPX_PARSING_ERROR'
    );
  }
}

/**
 * Extrait les métadonnées d'un fichier GPX
 * @param {Object} gpxData - Données GPX parsées
 * @returns {Object} - Métadonnées du fichier GPX
 */
function extractMetadata(gpxData) {
  try {
    const metadata = {
      name: null,
      description: null,
      author: null,
      time: null,
      distance: null,
      trackCount: 0,
      routeCount: 0,
      waypointCount: 0
    };
    
    // Extraire les métadonnées du fichier
    if (gpxData.gpx.metadata) {
      const meta = gpxData.gpx.metadata[0];
      metadata.name = meta.name ? meta.name[0] : null;
      metadata.description = meta.desc ? meta.desc[0] : null;
      metadata.time = meta.time ? new Date(meta.time[0]) : null;
      
      if (meta.author) {
        metadata.author = meta.author[0].name ? meta.author[0].name[0] : null;
      }
    }
    
    // Extraire le nom du premier track si nom pas dans les métadonnées
    if (!metadata.name && gpxData.gpx.trk && gpxData.gpx.trk[0].name) {
      metadata.name = gpxData.gpx.trk[0].name[0];
    }
    
    // Compter les tracks, routes et waypoints
    metadata.trackCount = gpxData.gpx.trk ? gpxData.gpx.trk.length : 0;
    metadata.routeCount = gpxData.gpx.rte ? gpxData.gpx.rte.length : 0;
    metadata.waypointCount = gpxData.gpx.wpt ? gpxData.gpx.wpt.length : 0;
    
    return metadata;
  } catch (error) {
    logger.error('Erreur lors de l\'extraction des métadonnées GPX', { 
      error: error.message,
      stack: error.stack 
    });
    
    // Retourner des métadonnées minimales en cas d'erreur
    return {
      name: 'GPX sans titre',
      description: null,
      author: null,
      time: new Date(),
      trackCount: 0,
      routeCount: 0,
      waypointCount: 0,
      error: error.message
    };
  }
}

/**
 * Sauvegarde le contenu GPX dans un fichier temporaire
 * @param {String} content - Contenu GPX à sauvegarder
 * @param {String} prefix - Préfixe pour le nom du fichier
 * @returns {String} - Chemin du fichier temporaire
 */
function saveGpxToTempFile(content, prefix = 'gpx-') {
  try {
    // Créer un dossier temporaire s'il n'existe pas
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileName = `${prefix}${timestamp}-${randomStr}.gpx`;
    const filePath = path.join(tempDir, fileName);
    
    // Écrire le contenu dans le fichier
    fs.writeFileSync(filePath, content, 'utf8');
    
    logger.debug(`Fichier GPX temporaire créé: ${filePath}`);
    
    return filePath;
  } catch (error) {
    logger.error('Erreur lors de la sauvegarde du fichier GPX temporaire', { 
      error: error.message,
      stack: error.stack 
    });
    
    throw weatherErrorHandler.setProcessingError(
      `Erreur lors de la sauvegarde du fichier GPX temporaire: ${error.message}`,
      { originalError: error.message },
      'GPX_PARSING_ERROR'
    );
  }
}

/**
 * Convertit des coordonnées en une chaîne GPX
 * @param {Array} coordinates - Liste des coordonnées [[lon, lat, ele], ...]
 * @param {Object} options - Options de conversion
 * @returns {String} - Contenu GPX
 */
function createGpxFromCoordinates(coordinates, options = {}) {
  try {
    const {
      name = 'Parcours généré',
      description = 'Parcours créé par Grand Est Cyclisme',
      author = 'Grand Est Cyclisme WebApp',
      includeMetadata = true,
      includeExtensions = true,
      waypoints = [],
      routeType = 'standard',
      difficulty = 'moderate',
      weatherData = null,
      pointsOfInterest = [],
      cols = [],
      includeRouteExtension = true,
      challengeData = null,
      surfaceInfo = false,
      routeHighlights = [],
      routeTags = []
    } = options;
    
    // Valider les coordonnées
    if (!Array.isArray(coordinates) || coordinates.length === 0) {
      throw new Error('Les coordonnées doivent être un tableau non vide');
    }
    
    // Créer l'en-tête GPX
    let gpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Grand Est Cyclisme WebApp" xmlns="http://www.topografix.com/GPX/1/1"`;
    
    // Ajouter les namespaces pour les extensions
    // Toujours inclure les extensions pour la compatibilité maximale
    gpxContent += ` xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd
  http://www.garmin.com/xmlschemas/GpxExtensions/v3 http://www.garmin.com/xmlschemas/GpxExtensionsv3.xsd
  http://www.garmin.com/xmlschemas/TrackPointExtension/v1 http://www.garmin.com/xmlschemas/TrackPointExtensionv1.xsd
  http://www.garmin.com/xmlschemas/WaypointExtension/v1 http://www.garmin.com/xmlschemas/WaypointExtensionv1.xsd"
  xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1"
  xmlns:gpxx="http://www.garmin.com/xmlschemas/GpxExtensions/v3"
  xmlns:wptx1="http://www.garmin.com/xmlschemas/WaypointExtension/v1"
  xmlns:gec="http://www.grandestcyclisme.fr/GPXExtensions/v1"`;
    
    gpxContent += `>`;
    
    // Ajouter les métadonnées
    if (includeMetadata) {
      const timeNow = new Date().toISOString();
      gpxContent += `
  <metadata>
    <name>${escapeXml(name)}</name>
    <desc>${escapeXml(description)}</desc>
    <author>
      <name>${escapeXml(author)}</name>
      <link href="https://www.grandestcyclisme.fr">
        <text>Grand Est Cyclisme</text>
        <type>website</type>
      </link>
    </author>
    <time>${timeNow}</time>
    <keywords>${escapeXml(routeTags.join(', '))}</keywords>`;
      
      // Ajouter les liens si disponible
      if (options.links && Array.isArray(options.links)) {
        options.links.forEach(link => {
          gpxContent += `
    <link href="${escapeXml(link.href)}">
      <text>${escapeXml(link.text || '')}</text>
      <type>${escapeXml(link.type || 'website')}</type>
    </link>`;
        });
      }
      
      // Ajouter les extensions des métadonnées spécifiques à GEC
      gpxContent += `
    <extensions>
      <gec:route-metadata>
        <gec:difficulty>${escapeXml(difficulty)}</gec:difficulty>
        <gec:route-type>${escapeXml(routeType)}</gec:route-type>
        <gec:creation-date>${timeNow}</gec:creation-date>`;
      
      // Ajouter les statistiques de l'itinéraire si disponibles
      if (options.stats) {
        gpxContent += `
        <gec:stats>
          <gec:distance>${options.stats.distance || calculateDistance(coordinates)}</gec:distance>
          <gec:elevation-gain>${options.stats.elevationGain || calculateElevationGain(coordinates)}</gec:elevation-gain>
          <gec:estimated-duration>${options.stats.estimatedDuration || ''}</gec:estimated-duration>
          <gec:max-gradient>${options.stats.maxGradient || ''}</gec:max-gradient>
          <gec:avg-gradient>${options.stats.avgGradient || ''}</gec:avg-gradient>
        </gec:stats>`;
      }
      
      // Ajouter les données de challenge si disponibles
      if (challengeData) {
        gpxContent += `
        <gec:challenge>
          <gec:id>${escapeXml(challengeData.id)}</gec:id>
          <gec:name>${escapeXml(challengeData.name)}</gec:name>
          <gec:description>${escapeXml(challengeData.description || '')}</gec:description>
          <gec:difficulty>${escapeXml(challengeData.difficulty || '')}</gec:difficulty>
          <gec:cols-count>${challengeData.colsCount || ''}</gec:cols-count>
        </gec:challenge>`;
      }
      
      // Fermer les extensions des métadonnées
      gpxContent += `
      </gec:route-metadata>
    </extensions>
  </metadata>`;
    }
    
    // Ajouter les waypoints
    if (waypoints && waypoints.length > 0) {
      for (const waypoint of waypoints) {
        gpxContent += `
  <wpt lat="${waypoint.lat}" lon="${waypoint.lon}">`;
        
        if (waypoint.name) {
          gpxContent += `
    <name>${escapeXml(waypoint.name)}</name>`;
        }
        
        if (waypoint.description) {
          gpxContent += `
    <desc>${escapeXml(waypoint.description)}</desc>`;
        }
        
        if (waypoint.elevation !== undefined && waypoint.elevation !== null) {
          gpxContent += `
    <ele>${waypoint.elevation}</ele>`;
        }
        
        if (waypoint.symbol) {
          gpxContent += `
    <sym>${escapeXml(waypoint.symbol)}</sym>`;
        }
        
        if (waypoint.type) {
          gpxContent += `
    <type>${escapeXml(waypoint.type)}</type>`;
        }
        
        // Ajouter des extensions pour les waypoints
        if (includeExtensions && (waypoint.waypointType || waypoint.amenity || waypoint.isCol)) {
          gpxContent += `
    <extensions>
      <wptx1:WaypointExtension>`;
          
          if (waypoint.waypointType) {
            gpxContent += `
        <wptx1:DisplayMode>${waypoint.waypointType}</wptx1:DisplayMode>`;
          }
          
          gpxContent += `
      </wptx1:WaypointExtension>
      <gec:waypoint-data>`;
          
          if (waypoint.amenity) {
            gpxContent += `
        <gec:amenity>${escapeXml(waypoint.amenity)}</gec:amenity>`;
          }
          
          if (waypoint.isCol) {
            gpxContent += `
        <gec:col-data>
          <gec:col-id>${escapeXml(waypoint.colId || '')}</gec:col-id>
          <gec:col-name>${escapeXml(waypoint.colName || waypoint.name || '')}</gec:col-name>
          <gec:altitude>${waypoint.altitude || waypoint.elevation || 0}</gec:altitude>
          <gec:difficulty>${escapeXml(waypoint.colDifficulty || '')}</gec:difficulty>
          <gec:length>${waypoint.colLength || 0}</gec:length>
          <gec:avg-gradient>${waypoint.avgGradient || 0}</gec:avg-gradient>
          <gec:max-gradient>${waypoint.maxGradient || 0}</gec:max-gradient>
        </gec:col-data>`;
          }
          
          gpxContent += `
      </gec:waypoint-data>
    </extensions>`;
        }
        
        gpxContent += `
  </wpt>`;
      }
    }
    
    // Ajouter les points d'intérêt
    if (pointsOfInterest && pointsOfInterest.length > 0) {
      for (const poi of pointsOfInterest) {
        gpxContent += `
  <wpt lat="${poi.lat}" lon="${poi.lon}">
    <name>${escapeXml(poi.name)}</name>
    <desc>${escapeXml(poi.description || '')}</desc>`;
        
        if (poi.elevation !== undefined && poi.elevation !== null) {
          gpxContent += `
    <ele>${poi.elevation}</ele>`;
        }
        
        // Déterminer le symbole en fonction du type de POI
        let poiSymbol = 'Scenic Area';
        
        switch (poi.type.toLowerCase()) {
          case 'water':
            poiSymbol = 'Drinking Water';
            break;
          case 'scenic':
            poiSymbol = 'Scenic Area';
            break;
          case 'food':
            poiSymbol = 'Restaurant';
            break;
          case 'bike_shop':
            poiSymbol = 'Bike Trail';
            break;
          case 'rest':
            poiSymbol = 'Picnic Area';
            break;
          case 'historical':
            poiSymbol = 'Museum';
            break;
          case 'danger':
            poiSymbol = 'Danger Area';
            break;
          default:
            poiSymbol = 'Information';
        }
        
        gpxContent += `
    <sym>${poiSymbol}</sym>
    <type>${escapeXml(poi.type)}</type>
    <extensions>
      <gec:poi-data>
        <gec:poi-type>${escapeXml(poi.type)}</gec:poi-type>
        <gec:importance>${poi.importance || 'medium'}</gec:importance>`;
            
        if (poi.images && poi.images.length > 0) {
          gpxContent += `
        <gec:images>`;
          
          for (const image of poi.images) {
            gpxContent += `
          <gec:image url="${escapeXml(image.url)}" caption="${escapeXml(image.caption || '')}"/>`;
          }
          
          gpxContent += `
        </gec:images>`;
        }
            
        gpxContent += `
      </gec:poi-data>
    </extensions>
  </wpt>`;
      }
    }
    
    // Ajouter les informations sur les cols
    if (cols && cols.length > 0) {
      for (const col of cols) {
        gpxContent += `
  <wpt lat="${col.lat}" lon="${col.lon}">
    <name>${escapeXml(col.name)}</name>
    <desc>${escapeXml(col.description || `Col - Altitude: ${col.altitude}m, Longueur: ${col.length}km, Pente moyenne: ${col.avgGradient}%`)}</desc>
    <ele>${col.altitude}</ele>
    <sym>Summit</sym>
    <type>col</type>
    <extensions>
      <gec:col-data>
        <gec:col-id>${escapeXml(col.id || '')}</gec:col-id>
        <gec:col-name>${escapeXml(col.name)}</gec:col-name>
        <gec:altitude>${col.altitude}</gec:altitude>
        <gec:difficulty>${escapeXml(col.difficulty || '')}</gec:difficulty>
        <gec:length>${col.length || 0}</gec:length>
        <gec:avg-gradient>${col.avgGradient || 0}</gec:avg-gradient>
        <gec:max-gradient>${col.maxGradient || 0}</gec:max-gradient>`;
        
        // Ajouter les versants si disponibles
        if (col.sides && Array.isArray(col.sides) && col.sides.length > 0) {
          gpxContent += `
        <gec:sides>`;
          
          for (const side of col.sides) {
            gpxContent += `
          <gec:side>
            <gec:name>${escapeXml(side.name || '')}</gec:name>
            <gec:difficulty>${escapeXml(side.difficulty || '')}</gec:difficulty>
            <gec:length>${side.length || 0}</gec:length>
            <gec:avg-gradient>${side.avgGradient || 0}</gec:avg-gradient>
            <gec:max-gradient>${side.maxGradient || 0}</gec:max-gradient>
            <gec:start-altitude>${side.startAltitude || 0}</gec:start-altitude>
          </gec:side>`;
          }
          
          gpxContent += `
        </gec:sides>`;
        }
        
        // Ajouter les conditions actuelles si disponibles
        if (col.currentConditions) {
          gpxContent += `
        <gec:current-conditions>
          <gec:weather>${escapeXml(col.currentConditions.weather || '')}</gec:weather>
          <gec:temperature>${col.currentConditions.temperature || 0}</gec:temperature>
          <gec:wind-speed>${col.currentConditions.windSpeed || 0}</gec:wind-speed>
          <gec:wind-direction>${col.currentConditions.windDirection || 0}</gec:wind-direction>
          <gec:road-status>${escapeXml(col.currentConditions.roadStatus || 'open')}</gec:road-status>
          <gec:last-updated>${col.currentConditions.lastUpdated || new Date().toISOString()}</gec:last-updated>
        </gec:current-conditions>`;
        }
        
        gpxContent += `
      </gec:col-data>
    </extensions>
  </wpt>`;
      }
    }
    
    // Ajouter les points de route (pour la navigation)
    if (includeRouteExtension && options.routePoints) {
      gpxContent += `
  <rte>
    <name>${escapeXml(name)}</name>
    <desc>${escapeXml(description)}</desc>`;
      
      for (const point of options.routePoints) {
        gpxContent += `
    <rtept lat="${point.lat}" lon="${point.lon}">`;
        
        if (point.ele !== undefined && point.ele !== null) {
          gpxContent += `<ele>${point.ele}</ele>`;
        }
        
        if (point.name) {
          gpxContent += `<name>${escapeXml(point.name)}</name>`;
        }
        
        gpxContent += `</rtept>`;
      }
      
      gpxContent += `
  </rte>`;
    }
    
    // Ajouter la trace
    gpxContent += `
  <trk>
    <name>${escapeXml(name)}</name>
    <desc>${escapeXml(description)}</desc>`;
    
    // Ajouter les extensions de trace
    if (includeExtensions && (routeType || routeHighlights.length > 0 || surfaceInfo)) {
      gpxContent += `
    <extensions>
      <gpxx:TrackExtension>
        <gpxx:DisplayColor>Blue</gpxx:DisplayColor>
      </gpxx:TrackExtension>
      <gec:track-data>
        <gec:route-type>${escapeXml(routeType)}</gec:route-type>
        <gec:difficulty>${escapeXml(difficulty)}</gec:difficulty>`;
      
      // Ajouter les points forts de l'itinéraire
      if (routeHighlights && routeHighlights.length > 0) {
        gpxContent += `
        <gec:highlights>`;
        
        for (const highlight of routeHighlights) {
          gpxContent += `
          <gec:highlight type="${escapeXml(highlight.type || 'scenery')}">${escapeXml(highlight.description)}</gec:highlight>`;
        }
        
        gpxContent += `
        </gec:highlights>`;
      }
      
      // Ajouter les informations de surface si disponibles
      if (surfaceInfo) {
        gpxContent += `
        <gec:surface-info>`;
        
        if (Array.isArray(surfaceInfo)) {
          for (const surface of surfaceInfo) {
            gpxContent += `
          <gec:surface-segment>
            <gec:start-index>${surface.startIndex}</gec:start-index>
            <gec:end-index>${surface.endIndex}</gec:end-index>
            <gec:surface-type>${escapeXml(surface.type)}</gec:surface-type>
            <gec:quality>${escapeXml(surface.quality || 'good')}</gec:quality>
          </gec:surface-segment>`;
          }
        } else {
          gpxContent += `
          <gec:main-surface>${escapeXml(typeof surfaceInfo === 'string' ? surfaceInfo : 'asphalt')}</gec:main-surface>`;
        }
        
        gpxContent += `
        </gec:surface-info>`;
      }
      
      gpxContent += `
      </gec:track-data>
    </extensions>`;
    }
    
    gpxContent += `
    <trkseg>`;
    
    // Ajouter les points
    for (let i = 0; i < coordinates.length; i++) {
      const point = coordinates[i];
      // Vérifier le format du point (il peut être [lon, lat, ele] ou {lat, lon, ele})
      let lon, lat, ele, time, hr, cad, temp, weatherPoint;
      
      if (Array.isArray(point)) {
        [lon, lat, ele, time, hr, cad, temp] = point;
      } else {
        lon = point.lon;
        lat = point.lat;
        ele = point.ele || point.elevation;
        time = point.time;
        hr = point.heartRate || point.hr;
        cad = point.cadence || point.cad;
        temp = point.temperature || point.temp;
      }
      
      // Récupérer les données météo pour ce point si disponibles
      if (weatherData && weatherData.points && weatherData.points[i]) {
        weatherPoint = weatherData.points[i];
      }
      
      // Valider les coordonnées
      if (isNaN(lon) || isNaN(lat) || lon < -180 || lon > 180 || lat < -90 || lat > 90) {
        logger.warn('Coordonnée GPS invalide ignorée', { lon, lat });
        continue;
      }
      
      // Initialiser le point
      gpxContent += `
      <trkpt lat="${lat}" lon="${lon}">`;
      
      // Ajouter l'élévation si disponible
      if (ele !== null && !isNaN(ele)) {
        gpxContent += `<ele>${ele}</ele>`;
      }
      
      // Ajouter l'horodatage si disponible
      if (time) {
        // S'assurer que c'est un format ISO valide
        let timeStr;
        if (time instanceof Date) {
          timeStr = time.toISOString();
        } else if (typeof time === 'string' && time.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
          timeStr = time;
        } else if (!isNaN(new Date(time).getTime())) {
          timeStr = new Date(time).toISOString();
        }
        
        if (timeStr) {
          gpxContent += `<time>${timeStr}</time>`;
        }
      }
      
      // Ajouter les extensions
      let hasExtensions = (hr || cad || temp || weatherPoint);
      if (includeExtensions && hasExtensions) {
        gpxContent += `<extensions>`;
        
        // Extensions standard de Garmin
        if (hr || cad || temp) {
          gpxContent += `
        <gpxtpx:TrackPointExtension>`;
          
          if (hr && !isNaN(hr)) {
            gpxContent += `
          <gpxtpx:hr>${Math.round(hr)}</gpxtpx:hr>`;
          }
          
          if (cad && !isNaN(cad)) {
            gpxContent += `
          <gpxtpx:cad>${Math.round(cad)}</gpxtpx:cad>`;
          }
          
          if (temp && !isNaN(temp)) {
            gpxContent += `
          <gpxtpx:atemp>${temp.toFixed(1)}</gpxtpx:atemp>`;
          }
          
          gpxContent += `
        </gpxtpx:TrackPointExtension>`;
        }
        
        // Extensions pour les données météo
        if (weatherPoint) {
          gpxContent += `
        <gec:weather-data>`;
          
          if (weatherPoint.temp !== undefined) {
            gpxContent += `
          <gec:temperature>${weatherPoint.temp.toFixed(1)}</gec:temperature>`;
          }
          
          if (weatherPoint.condition) {
            gpxContent += `
          <gec:condition>${escapeXml(weatherPoint.condition)}</gec:condition>`;
          }
          
          if (weatherPoint.windSpeed !== undefined) {
            gpxContent += `
          <gec:wind-speed>${weatherPoint.windSpeed.toFixed(1)}</gec:wind-speed>`;
          }
          
          if (weatherPoint.windDirection !== undefined) {
            gpxContent += `
          <gec:wind-direction>${weatherPoint.windDirection}</gec:wind-direction>`;
          }
          
          if (weatherPoint.precipitation !== undefined) {
            gpxContent += `
          <gec:precipitation>${weatherPoint.precipitation.toFixed(2)}</gec:precipitation>`;
          }
          
          if (weatherPoint.humidity !== undefined) {
            gpxContent += `
          <gec:humidity>${weatherPoint.humidity}</gec:humidity>`;
          }
          
          if (weatherPoint.pressure !== undefined) {
            gpxContent += `
          <gec:pressure>${weatherPoint.pressure}</gec:pressure>`;
          }
          
          gpxContent += `
        </gec:weather-data>`;
        }
        
        gpxContent += `
      </extensions>`;
      }
      
      // Fermer le point
      gpxContent += `</trkpt>`;
    }
    
    // Fermer le fichier GPX
    gpxContent += `
    </trkseg>
  </trk>
</gpx>`;
    
    return gpxContent;
  } catch (error) {
    logger.error('Erreur lors de la création du contenu GPX', { 
      error: error.message,
      stack: error.stack 
    });
    
    throw weatherErrorHandler.setProcessingError(
      `Erreur lors de la création du contenu GPX: ${error.message}`,
      { originalError: error.message },
      'GPX_PARSING_ERROR'
    );
  }
}

/**
 * Calcule la distance totale d'un itinéraire à partir de ses coordonnées
 * @param {Array} coordinates - Coordonnées de l'itinéraire
 * @returns {number} - Distance en kilomètres
 */
function calculateDistance(coordinates) {
  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    return 0;
  }
  
  let totalDistance = 0;
  
  for (let i = 1; i < coordinates.length; i++) {
    const prev = coordinates[i - 1];
    const curr = coordinates[i];
    
    let prevLat, prevLon, currLat, currLon;
    
    if (Array.isArray(prev)) {
      [prevLon, prevLat] = prev;
    } else {
      prevLat = prev.lat;
      prevLon = prev.lon;
    }
    
    if (Array.isArray(curr)) {
      [currLon, currLat] = curr;
    } else {
      currLat = curr.lat;
      currLon = curr.lon;
    }
    
    totalDistance += haversineDistance(prevLat, prevLon, currLat, currLon);
  }
  
  return parseFloat(totalDistance.toFixed(2));
}

/**
 * Calcule le dénivelé positif total d'un itinéraire
 * @param {Array} coordinates - Coordonnées de l'itinéraire avec élévation
 * @returns {number} - Dénivelé positif en mètres
 */
function calculateElevationGain(coordinates) {
  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    return 0;
  }
  
  let totalGain = 0;
  
  for (let i = 1; i < coordinates.length; i++) {
    const prev = coordinates[i - 1];
    const curr = coordinates[i];
    
    let prevEle, currEle;
    
    if (Array.isArray(prev)) {
      prevEle = prev[2];
    } else {
      prevEle = prev.ele || prev.elevation;
    }
    
    if (Array.isArray(curr)) {
      currEle = curr[2];
    } else {
      currEle = curr.ele || curr.elevation;
    }
    
    if (!isNaN(prevEle) && !isNaN(currEle) && currEle > prevEle) {
      totalGain += currEle - prevEle;
    }
  }
  
  return Math.round(totalGain);
}

/**
 * Calcule la distance entre deux points géographiques (formule de Haversine)
 * @param {number} lat1 - Latitude du premier point
 * @param {number} lon1 - Longitude du premier point
 * @param {number} lat2 - Latitude du deuxième point
 * @param {number} lon2 - Longitude du deuxième point
 * @returns {number} - Distance en kilomètres
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Rayon de la Terre en km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance;
}

/**
 * Convertit des degrés en radians
 * @param {number} degrees - Valeur en degrés
 * @returns {number} - Valeur en radians
 */
function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Corrige la structure d'un fichier GPX
 * @param {String} content - Contenu GPX à corriger
 * @returns {String} - Contenu GPX corrigé
 */
function fixGpxStructure(content) {
  try {
    // Si le contenu est vide, retourner une erreur
    if (!content || typeof content !== 'string') {
      throw new Error('Contenu GPX vide ou invalide');
    }
    
    let fixedContent = content;
    
    // 1. Correction des balises <n> incorrectes qui devraient être <name>
    fixedContent = fixedContent.replace(/<n>([^<]*)<\/n>/g, '<name>$1</name>');
    
    // 2. Correction des coordonnées inversées (lat/lon)
    // Cette correction est complexe et nécessite un parsing complet
    // Nous allons uniquement signaler le problème pour l'instant
    if (/<trkpt[^>]+lon="[^"]*"[^>]+lat="[^"]*"/g.test(content)) {
      logger.warn('Possible inversion des coordonnées détectée dans le fichier GPX');
    }
    
    // 3. Correction des namespaces manquants
    if (!content.includes('xmlns=') && content.includes('<gpx')) {
      fixedContent = fixedContent.replace(
        /<gpx([^>]*)>/,
        '<gpx$1 xmlns="http://www.topografix.com/GPX/1/1">'
      );
    }
    
    // 4. Ajout de l'en-tête XML si manquant
    if (!content.includes('<?xml')) {
      fixedContent = '<?xml version="1.0" encoding="UTF-8"?>\n' + fixedContent;
    }
    
    // 5. Correction des balises auto-fermantes invalides
    fixedContent = fixedContent.replace(/<(trkpt|wpt)([^>]*?)\/>/g, '<$1$2></$1>');
    
    // 6. Correction des balises de métadonnées manquantes
    if (!content.includes('<metadata>') && content.includes('<gpx')) {
      const metadataInsertPoint = content.indexOf('>') + 1;
      fixedContent = fixedContent.slice(0, metadataInsertPoint) + 
        '\n  <metadata>\n    <time>' + new Date().toISOString() + '</time>\n  </metadata>' + 
        fixedContent.slice(metadataInsertPoint);
    }
    
    return fixedContent;
  } catch (error) {
    logger.error('Erreur lors de la correction de la structure GPX', {
      error: error.message,
      stack: error.stack
    });
    
    throw weatherErrorHandler.setProcessingError(
      `Erreur lors de la correction de la structure GPX: ${error.message}`,
      { originalError: error.message },
      'GPX_PARSING_ERROR'
    );
  }
}

/**
 * Échappe les caractères spéciaux XML
 * @param {String} str - Chaîne à échapper
 * @returns {String} - Chaîne échappée
 */
function escapeXml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

module.exports = {
  validateGpxFile,
  validateGpxContent,
  parseGpxFile,
  extractCoordinates,
  extractMetadata,
  saveGpxToTempFile,
  createGpxFromCoordinates,
  fixGpxStructure,
  GPX_ERROR_CODES
};
