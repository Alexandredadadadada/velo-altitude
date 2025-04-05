/**
 * Service d'exportation de données
 * Permet l'interopérabilité avec d'autres plateformes et applications
 */

const fs = require('fs');
const path = require('path');
const json2csv = require('json2csv').Parser;
const archiver = require('archiver');
const NodeCache = require('node-cache');
const logger = require('../utils/logger');
const gpxValidator = require('../utils/gpx-validator');
const weatherErrorHandler = require('../utils/weather-error-handler');

class DataExportService {
  constructor() {
    this.cache = new NodeCache({ 
      stdTTL: 3600, // 1 heure de cache par défaut
      checkperiod: 600 // Vérification toutes les 10 minutes
    });
    
    // Répertoire pour les fichiers d'export temporaires
    this.exportDir = path.join(__dirname, '../exports');
    
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(this.exportDir)) {
      fs.mkdirSync(this.exportDir, { recursive: true });
    }
    
    // Formats d'export supportés
    this.supportedFormats = ['json', 'csv', 'fit', 'gpx', 'tcx'];
  }
  
  /**
   * Exporte les données d'activités d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {string} format - Format d'export (json, csv, fit, gpx, tcx)
   * @param {Object} options - Options d'export (période, type d'activités, etc.)
   * @returns {Object} Informations sur le fichier exporté
   */
  async exportActivities(userId, format = 'json', options = {}) {
    try {
      if (!this.supportedFormats.includes(format.toLowerCase())) {
        return {
          success: false,
          error: `Format non supporté. Formats disponibles: ${this.supportedFormats.join(', ')}`
        };
      }
      
      // Dans un cas réel, récupérer les activités de l'utilisateur depuis la base de données
      // Pour cette démonstration, nous utilisons des données fictives
      const activities = require('../test-data/activities.json')
        .filter(activity => activity.userId === userId);
      
      if (activities.length === 0) {
        return {
          success: false,
          error: "Aucune activité trouvée pour cet utilisateur"
        };
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `activities_${userId}_${timestamp}`;
      let filePath;
      let error = null;
      
      try {
        switch (format.toLowerCase()) {
          case 'json':
            filePath = await this.exportToJson(activities, fileName);
            break;
          case 'csv':
            filePath = await this.exportToCsv(activities, fileName);
            break;
          case 'gpx':
            filePath = await this.exportToGpx(activities, fileName, options);
            break;
          case 'tcx':
            filePath = await this.exportToTcx(activities, fileName);
            break;
          case 'fit':
            filePath = await this.exportToFit(activities, fileName);
            break;
          default:
            filePath = await this.exportToJson(activities, fileName);
        }
      } catch (exportError) {
        logger.error(`[DataExportService] Erreur lors de l'export au format ${format}: ${exportError.message}`);
        error = exportError.message;
        
        // En cas d'erreur spécifique au format, essayer de sauvegarder en JSON comme fallback
        if (format.toLowerCase() !== 'json') {
          try {
            logger.info(`[DataExportService] Tentative de fallback vers JSON après échec de ${format}`);
            filePath = await this.exportToJson(activities, `${fileName}_fallback`);
            error = `Erreur avec le format ${format}, exporté en JSON à la place: ${exportError.message}`;
          } catch (fallbackError) {
            // Si même le fallback échoue, propager l'erreur originale
            throw exportError;
          }
        } else {
          // Si l'erreur était déjà avec JSON, la propager
          throw exportError;
        }
      }
      
      logger.info(`[DataExportService] Données exportées pour l'utilisateur ${userId} au format ${format}`);
      
      return {
        success: !error,
        format: error ? 'json' : format,
        filePath,
        activitiesCount: activities.length,
        fileName: path.basename(filePath),
        timestamp: new Date().toISOString(),
        error: error
      };
    } catch (error) {
      logger.error(`[DataExportService] Erreur lors de l'export des activités: ${error.message}`, {
        userId,
        format,
        stack: error.stack
      });
      return weatherErrorHandler.setProcessingError(
        `Erreur lors de l'export des activités: ${error.message}`,
        { userId, format, options },
        'EXPORT_PROCESSING_ERROR'
      );
    }
  }
  
  /**
   * Exporte les données au format JSON
   * @param {Array} data - Données à exporter
   * @param {string} fileName - Nom du fichier sans extension
   * @returns {string} Chemin du fichier exporté
   */
  async exportToJson(data, fileName) {
    const filePath = path.join(this.exportDir, `${fileName}.json`);
    
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    
    return filePath;
  }
  
  /**
   * Exporte les données au format CSV
   * @param {Array} data - Données à exporter
   * @param {string} fileName - Nom du fichier sans extension
   * @returns {string} Chemin du fichier exporté
   */
  async exportToCsv(data, fileName) {
    const filePath = path.join(this.exportDir, `${fileName}.csv`);
    
    // Aplatir les données pour le CSV (supprimer la structure imbriquée)
    const flattenedData = data.map(activity => {
      const { route, weather, bestEfforts, powerZones, hrZones, ...rest } = activity;
      
      return {
        ...rest,
        startLat: route?.startPoint?.lat,
        startLng: route?.startPoint?.lng,
        endLat: route?.endPoint?.lat,
        endLng: route?.endPoint?.lng,
        temperature: weather?.temperature,
        weatherConditions: weather?.conditions,
        windSpeed: weather?.windSpeed,
        windDirection: weather?.windDirection,
        bestEffort5s: bestEfforts?.fiveSeconds,
        bestEffort1m: bestEfforts?.oneMinute,
        bestEffort5m: bestEfforts?.fiveMinutes,
        bestEffort20m: bestEfforts?.twentyMinutes,
        bestEffort1h: bestEfforts?.oneHour
      };
    });
    
    const parser = new json2csv({
      header: true,
      includeEmptyRows: false
    });
    
    const csv = parser.parse(flattenedData);
    
    await fs.promises.writeFile(filePath, csv, 'utf8');
    
    return filePath;
  }
  
  /**
   * Exporte les données au format GPX (pour les itinéraires)
   * @param {Array} data - Données à exporter
   * @param {string} fileName - Nom du fichier sans extension
   * @param {Object} options - Options d'export
   * @returns {string} Chemin du fichier exporté
   */
  async exportToGpx(data, fileName, options = {}) {
    try {
      // Options par défaut et leur fusion avec les options fournies
      const exportOptions = {
        includeExtensions: options.includeExtensions || false,
        includeHeartRate: options.includeHeartRate || false,
        includePower: options.includePower || false,
        includeCadence: options.includeCadence || false,
        includeTemperature: options.includeTemperature || false,
        includeElevation: options.includeElevation !== false, // Activé par défaut
        includeTime: options.includeTime !== false, // Activé par défaut
        includeMetadata: options.includeMetadata !== false, // Activé par défaut
        creator: options.creator || 'Grand Est Cyclisme Dashboard',
        precision: options.precision || 6, // Précision des coordonnées GPS
        compression: options.compression || false // Compression du fichier GPX
      };

      // Vérifier que les données contiennent des coordonnées GPS
      if (!data || data.length === 0) {
        const error = new Error('Aucune donnée disponible pour l\'export GPX');
        error.code = 'GPX_NO_DATA';
        throw error;
      }
      
      // Recherche différentes structures de données possibles
      let hasGpsData = false;
      let coordinatesFormat = null;

      // Déterminer le format des coordonnées
      for (const item of data) {
        // Format 1: item.coordinates = [[lon, lat, ele], [...]]
        if (item.coordinates && Array.isArray(item.coordinates) && item.coordinates.length > 0) {
          hasGpsData = true;
          coordinatesFormat = 'array';
          break;
        }
        
        // Format 2: item.points = [{lat, lng, elevation}, {...}]
        if (item.points && Array.isArray(item.points) && item.points.length > 0) {
          hasGpsData = true;
          coordinatesFormat = 'object';
          break;
        }
        
        // Format 3: item.latLngs = [{lat, lng}, {...}]
        if (item.latLngs && Array.isArray(item.latLngs) && item.latLngs.length > 0) {
          hasGpsData = true;
          coordinatesFormat = 'latLngs';
          break;
        }
        
        // Format 4: item.trackpoints = [{latitude, longitude, elevation}, {...}]
        if (item.trackpoints && Array.isArray(item.trackpoints) && item.trackpoints.length > 0) {
          hasGpsData = true;
          coordinatesFormat = 'trackpoints';
          break;
        }
      }
      
      if (!hasGpsData) {
        const error = new Error('Aucune coordonnée GPS trouvée dans les données. Format non reconnu.');
        error.code = 'GPX_NO_COORDINATES';
        throw error;
      }
      
      logger.info(`[DataExportService] Export GPX: format de coordonnées détecté: ${coordinatesFormat}`);
      
      // Générer l'en-tête GPX
      let gpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<gpx xmlns="http://www.topografix.com/GPX/1/1" 
   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
   xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd"`;
   
      // Ajouter les extensions si nécessaire
      if (exportOptions.includeExtensions) {
        gpxContent += `
   xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1"
   xmlns:gpxx="http://www.garmin.com/xmlschemas/GpxExtensions/v3"`;
      }
   
      gpxContent += `
   version="1.1" 
   creator="${exportOptions.creator}">`;

      // Ajouter les métadonnées si nécessaire
      if (exportOptions.includeMetadata) {
        const routeName = data[0]?.name || data[0]?.title || fileName || 'Export GPX';
        const routeDescription = data[0]?.description || data[0]?.desc || '';
        
        gpxContent += `
<metadata>
  <name>${this._escapeXml(routeName)}</name>
  <desc>${this._escapeXml(routeDescription)}</desc>
  <time>${new Date().toISOString()}</time>`;
  
        // Ajouter les informations d'auteur si disponibles
        if (data[0]?.author || data[0]?.creator) {
          gpxContent += `
  <author>
    <name>${this._escapeXml(data[0]?.author || data[0]?.creator || '')}</name>
  </author>`;
        }
        
        // Ajouter les bounds (limites) calculées à partir des points
        if (data.length > 0) {
          let minLat = 90, maxLat = -90, minLon = 180, maxLon = -180;
          let pointsProcessed = false;
          
          // Calculer les limites en fonction du format de coordonnées
          for (const item of data) {
            let points = [];
            
            if (coordinatesFormat === 'array' && item.coordinates) {
              points = item.coordinates.map(coord => ({
                lat: parseFloat(coord[1]),
                lon: parseFloat(coord[0])
              }));
            } else if (coordinatesFormat === 'object' && item.points) {
              points = item.points.map(point => ({
                lat: parseFloat(point.lat || point.latitude),
                lon: parseFloat(point.lng || point.lon || point.longitude)
              }));
            } else if (coordinatesFormat === 'latLngs' && item.latLngs) {
              points = item.latLngs.map(point => ({
                lat: parseFloat(point.lat || point.latitude),
                lon: parseFloat(point.lng || point.lon || point.longitude)
              }));
            } else if (coordinatesFormat === 'trackpoints' && item.trackpoints) {
              points = item.trackpoints.map(point => ({
                lat: parseFloat(point.latitude),
                lon: parseFloat(point.longitude)
              }));
            }
            
            // Mettre à jour les limites
            for (const point of points) {
              if (!isNaN(point.lat) && !isNaN(point.lon)) {
                minLat = Math.min(minLat, point.lat);
                maxLat = Math.max(maxLat, point.lat);
                minLon = Math.min(minLon, point.lon);
                maxLon = Math.max(maxLon, point.lon);
                pointsProcessed = true;
              }
            }
          }
          
          if (pointsProcessed) {
            gpxContent += `
  <bounds minlat="${minLat.toFixed(exportOptions.precision)}" minlon="${minLon.toFixed(exportOptions.precision)}" maxlat="${maxLat.toFixed(exportOptions.precision)}" maxlon="${maxLon.toFixed(exportOptions.precision)}"/>`;
          }
        }
        
        gpxContent += `
</metadata>`;
      }
      
      // Ajouter les waypoints (points d'intérêt)
      if (data.length > 0 && data[0].points_of_interest) {
        const pois = data[0].points_of_interest;
        
        for (let i = 0; i < pois.length; i++) {
          const poi = pois[i];
          
          // Si le POI a des coordonnées, l'ajouter
          if (poi.lat && poi.lng) {
            gpxContent += `
<wpt lat="${poi.lat.toFixed(exportOptions.precision)}" lon="${poi.lng.toFixed(exportOptions.precision)}">
  <name>${this._escapeXml(poi.name || `POI ${i+1}`)}</name>`;
  
            if (poi.description) {
              gpxContent += `
  <desc>${this._escapeXml(poi.description)}</desc>`;
            }
            
            if (poi.elevation !== undefined && exportOptions.includeElevation) {
              gpxContent += `
  <ele>${parseFloat(poi.elevation).toFixed(1)}</ele>`;
            }
            
            gpxContent += `
</wpt>`;
          }
        }
      }
      
      // Ajouter chaque activité comme un track
      for (const item of data) {
        let trackPoints = [];
        
        // Extraire les points en fonction du format détecté
        if (coordinatesFormat === 'array' && item.coordinates) {
          trackPoints = item.coordinates;
        } else if (coordinatesFormat === 'object' && item.points) {
          trackPoints = item.points;
        } else if (coordinatesFormat === 'latLngs' && item.latLngs) {
          trackPoints = item.latLngs;
        } else if (coordinatesFormat === 'trackpoints' && item.trackpoints) {
          trackPoints = item.trackpoints;
        } else {
          // Passer à l'élément suivant si pas de points
          continue;
        }
        
        if (trackPoints.length === 0) {
          continue; // Ignorer les éléments sans points
        }
        
        const itemName = item.name || item.title || 'Activité sans nom';
        const itemDesc = item.description || item.desc || '';
        const itemType = item.type || item.activity_type || 'cycling';
        
        gpxContent += `
<trk>
  <name>${this._escapeXml(itemName)}</name>
  <desc>${this._escapeXml(itemDesc)}</desc>
  <type>${this._escapeXml(itemType)}</type>
  <trkseg>`;
        
        // Ajouter chaque point de track selon le format
        let pointsAdded = 0;
        let pointsSkipped = 0;
        
        for (const point of trackPoints) {
          let lat, lon, ele, time, hr, power, cadence, temp;
          
          // Extraire les données selon le format
          if (coordinatesFormat === 'array') {
            if (!Array.isArray(point) || point.length < 2) {
              pointsSkipped++;
              continue;
            }
            lat = point[1];
            lon = point[0];
            ele = point[2] || null;
            time = point[3] || null;
            hr = point[4] || null;
            power = point[5] || null;
            cadence = point[6] || null;
            temp = point[7] || null;
          } else if (coordinatesFormat === 'object') {
            lat = point.lat || point.latitude;
            lon = point.lng || point.lon || point.longitude;
            ele = point.elevation || point.ele || point.altitude || null;
            time = point.time || point.timestamp || null;
            hr = point.heartRate || point.hr || null;
            power = point.power || null;
            cadence = point.cadence || null;
            temp = point.temperature || point.temp || null;
          } else if (coordinatesFormat === 'latLngs') {
            lat = point.lat || point.latitude;
            lon = point.lng || point.lon || point.longitude;
            ele = point.elevation || point.ele || point.altitude || null;
            time = point.time || point.timestamp || null;
            hr = point.heartRate || point.hr || null;
            power = point.power || null;
            cadence = point.cadence || null;
            temp = point.temperature || point.temp || null;
          } else if (coordinatesFormat === 'trackpoints') {
            lat = point.latitude;
            lon = point.longitude;
            ele = point.elevation || point.altitude || null;
            time = point.time || point.timestamp || null;
            hr = point.heart_rate || point.heartRate || null;
            power = point.power || null;
            cadence = point.cadence || null;
            temp = point.temperature || null;
          }
          
          // Vérifier que les valeurs de latitude et longitude sont valides
          if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
            logger.warn(`[DataExportService] Coordonnée GPS hors limites ignorée: lat=${lat}, lon=${lon}`);
            pointsSkipped++;
            continue;
          }
          
          gpxContent += `
    <trkpt lat="${parseFloat(lat).toFixed(exportOptions.precision)}" lon="${parseFloat(lon).toFixed(exportOptions.precision)}">`;
          
          if (ele !== null && exportOptions.includeElevation) {
            gpxContent += `
      <ele>${parseFloat(ele).toFixed(1)}</ele>`;
          }
          
          if (time !== null && exportOptions.includeTime) {
            // Conversion du format de date si nécessaire
            let timeStr = time;
            if (typeof time === 'number') {
              timeStr = new Date(time).toISOString();
            } else if (time instanceof Date) {
              timeStr = time.toISOString();
            }
            
            gpxContent += `
      <time>${timeStr}</time>`;
          }
          
          // Ajouter les extensions si nécessaire
          if (exportOptions.includeExtensions && 
              ((hr !== null && exportOptions.includeHeartRate) || 
               (power !== null && exportOptions.includePower) || 
               (cadence !== null && exportOptions.includeCadence) || 
               (temp !== null && exportOptions.includeTemperature))) {
            
            gpxContent += `
      <extensions>
        <gpxtpx:TrackPointExtension>`;
            
            if (hr !== null && exportOptions.includeHeartRate) {
              gpxContent += `
          <gpxtpx:hr>${parseInt(hr)}</gpxtpx:hr>`;
            }
            
            if (cadence !== null && exportOptions.includeCadence) {
              gpxContent += `
          <gpxtpx:cad>${parseInt(cadence)}</gpxtpx:cad>`;
            }
            
            if (temp !== null && exportOptions.includeTemperature) {
              gpxContent += `
          <gpxtpx:atemp>${parseFloat(temp).toFixed(1)}</gpxtpx:atemp>`;
            }
            
            gpxContent += `
        </gpxtpx:TrackPointExtension>`;
            
            if (power !== null && exportOptions.includePower) {
              gpxContent += `
        <power>${parseInt(power)}</power>`;
            }
            
            gpxContent += `
      </extensions>`;
          }
          
          gpxContent += `
    </trkpt>`;
          
          pointsAdded++;
        }
        
        gpxContent += `
  </trkseg>
</trk>`;
        
        if (pointsSkipped > 0) {
          logger.warn(`[DataExportService] Export GPX: ${pointsSkipped} points invalides ignorés sur ${pointsSkipped + pointsAdded} points`);
        }
        
        logger.info(`[DataExportService] Export GPX: ${pointsAdded} points ajoutés pour l'itinéraire "${itemName}"`);
      }
      
      // Fermer le document GPX
      gpxContent += `
</gpx>`;
      
      // Valider le contenu GPX généré
      try {
        await gpxValidator.validateGpxContent(gpxContent);
        logger.info(`[DataExportService] Validation GPX réussie pour ${fileName}.gpx`);
      } catch (validationError) {
        logger.error(`[DataExportService] Validation GPX échouée: ${validationError.message}`);
        
        // Tenter de corriger les problèmes courants
        if (validationError.message.includes('XML malformed')) {
          logger.info(`[DataExportService] Tentative de correction du fichier XML malformé`);
          gpxContent = this._sanitizeXmlContent(gpxContent);
          
          // Nouvelle tentative de validation
          try {
            await gpxValidator.validateGpxContent(gpxContent);
            logger.info(`[DataExportService] Validation GPX réussie après correction`);
          } catch (secondValidationError) {
            // Si la validation échoue à nouveau, lever l'erreur
            const error = new Error(`Erreur de validation GPX après tentative de correction: ${secondValidationError.message}`);
            error.code = 'GPX_VALIDATION_ERROR';
            throw error;
          }
        } else {
          const error = new Error(`Erreur de validation GPX: ${validationError.message}`);
          error.code = 'GPX_VALIDATION_ERROR';
          throw error;
        }
      }
      
      // Écrire le fichier
      const filePath = path.join(this.exportDir, `${fileName}.gpx`);
      
      // Utiliser weatherErrorHandler pour gérer l'écriture du fichier
      await weatherErrorHandler.executeWeatherOperation(
        async () => fs.promises.writeFile(filePath, gpxContent, 'utf8'),
        { filePath, fileSize: gpxContent.length },
        { 
          source: 'DataExportService.exportToGpx', 
          maxRetries: 3,
          timeoutMs: 10000 // 10 secondes de timeout
        }
      );
      
      // Compression du fichier si demandée
      if (exportOptions.compression) {
        try {
          const compressedFilePath = `${filePath}.gz`;
          const gzip = require('zlib').createGzip();
          const fileStream = fs.createReadStream(filePath);
          const writeStream = fs.createWriteStream(compressedFilePath);
          
          await new Promise((resolve, reject) => {
            fileStream
              .pipe(gzip)
              .pipe(writeStream)
              .on('finish', () => {
                // Supprimer le fichier original si la compression réussit
                fs.unlinkSync(filePath);
                resolve();
              })
              .on('error', (err) => {
                reject(err);
              });
          });
          
          logger.info(`[DataExportService] Fichier GPX compressé: ${compressedFilePath}`);
          return compressedFilePath;
        } catch (compressionError) {
          logger.warn(`[DataExportService] Compression du fichier GPX échouée: ${compressionError.message}. Le fichier non compressé sera utilisé.`);
        }
      }
      
      return filePath;
    } catch (error) {
      logger.error(`[DataExportService] Erreur lors de l'export GPX: ${error.message}`, {
        error: error.message,
        stack: error.stack,
        code: error.code || 'GPX_EXPORT_ERROR'
      });
      
      // Déterminer le code d'erreur basé sur le message ou le code existant
      let errorCode = error.code || 'GPX_EXPORT_ERROR';
      if (!errorCode) {
        if (error.message.includes('Aucune donnée')) {
          errorCode = 'GPX_NO_DATA';
        } else if (error.message.includes('coordonnée GPS')) {
          errorCode = 'GPX_NO_COORDINATES';
        } else if (error.message.includes('Validation GPX')) {
          errorCode = 'GPX_VALIDATION_ERROR';
        } else if (error.message.includes('ENOSPC')) {
          errorCode = 'GPX_DISK_FULL';
        }
      }
      
      const enhancedError = new Error(`Erreur d'export GPX (${errorCode}): ${error.message}`);
      enhancedError.code = errorCode;
      enhancedError.originalError = error;
      throw enhancedError;
    }
  }
  
  /**
   * Exporte les données au format TCX (Training Center XML)
   * @param {Array} data - Données à exporter
   * @param {string} fileName - Nom du fichier sans extension
   * @returns {string} Chemin du fichier exporté
   */
  async exportToTcx(data, fileName) {
    // Pour une implémentation complète, il faudrait convertir les données au format TCX
    // Ici nous créons un fichier TCX simple pour l'exemple
    const filePath = path.join(this.exportDir, `${fileName}.tcx`);
    
    let tcxContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
    tcxContent += '<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2">\n';
    tcxContent += '  <Activities>\n';
    
    for (const activity of data) {
      tcxContent += '    <Activity Sport="Biking">\n';
      tcxContent += `      <Id>${activity.startDate}</Id>\n`;
      tcxContent += '      <Lap StartTime="' + activity.startDate + '">\n';
      tcxContent += `        <TotalTimeSeconds>${activity.duration}</TotalTimeSeconds>\n`;
      tcxContent += `        <DistanceMeters>${activity.distance}</DistanceMeters>\n`;
      tcxContent += `        <MaximumSpeed>${activity.maxSpeed}</MaximumSpeed>\n`;
      tcxContent += `        <Calories>${activity.calories}</Calories>\n`;
      tcxContent += '        <AverageHeartRateBpm><Value>' + activity.averageHeartRate + '</Value></AverageHeartRateBpm>\n';
      tcxContent += '        <MaximumHeartRateBpm><Value>' + activity.maxHeartRate + '</Value></MaximumHeartRateBpm>\n';
      tcxContent += '        <Intensity>Active</Intensity>\n';
      tcxContent += '        <Track>\n';
      
      if (activity.route && activity.route.waypoints) {
        for (const waypoint of activity.route.waypoints) {
          tcxContent += '          <Trackpoint>\n';
          tcxContent += '            <Position>\n';
          tcxContent += `              <LatitudeDegrees>${waypoint.lat}</LatitudeDegrees>\n`;
          tcxContent += `              <LongitudeDegrees>${waypoint.lng}</LongitudeDegrees>\n`;
          tcxContent += '            </Position>\n';
          tcxContent += '          </Trackpoint>\n';
        }
      }
      
      tcxContent += '        </Track>\n';
      tcxContent += '      </Lap>\n';
      tcxContent += '    </Activity>\n';
    }
    
    tcxContent += '  </Activities>\n';
    tcxContent += '</TrainingCenterDatabase>';
    
    await fs.promises.writeFile(filePath, tcxContent, 'utf8');
    
    return filePath;
  }
  
  /**
   * Exporte les données au format FIT (Flexible and Interoperable Data Transfer)
   * @param {Array} data - Données à exporter
   * @param {string} fileName - Nom du fichier sans extension
   * @returns {string} Chemin du fichier exporté
   */
  async exportToFit(data, fileName) {
    // Le format FIT est un format binaire complexe qui nécessiterait une bibliothèque spécifique
    // Pour cette démonstration, nous créons un fichier texte avec une note explicative
    const filePath = path.join(this.exportDir, `${fileName}.txt`);
    
    const content = `Ce fichier est un placeholder pour l'export au format FIT.
Dans une implémentation complète, nous utiliserions une bibliothèque comme 'fit-file-parser' ou 'fit-encoder' pour générer des fichiers FIT valides.
Les données FIT sont stockées dans un format binaire propriétaire développé par Garmin.`;
    
    await fs.promises.writeFile(filePath, content, 'utf8');
    
    return filePath;
  }
  
  /**
   * Crée une archive ZIP contenant plusieurs formats d'export
   * @param {string} userId - ID de l'utilisateur
   * @param {Array} formats - Formats à inclure dans l'archive
   * @param {Object} options - Options d'export
   * @returns {Object} Informations sur l'archive créée
   */
  async createExportArchive(userId, formats = ['json', 'csv', 'gpx'], options = {}) {
    try {
      // Valider les formats demandés
      const validFormats = formats.filter(format => 
        this.supportedFormats.includes(format.toLowerCase())
      );
      
      if (validFormats.length === 0) {
        return weatherErrorHandler.setProcessingError(
          'Aucun format valide spécifié',
          { formats },
          'EXPORT_INVALID_FORMAT'
        );
      }
      
      // Répertoire temporaire pour les fichiers avant archivage
      const tempDir = path.join(this.exportDir, `temp_${userId}_${Date.now()}`);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Exporter les données dans chaque format
      const exportedFiles = [];
      const exportErrors = [];
      
      for (const format of validFormats) {
        try {
          const result = await this.exportActivities(userId, format, options);
          
          if (result.success) {
            const destFile = path.join(tempDir, path.basename(result.filePath));
            await fs.promises.copyFile(result.filePath, destFile);
            
            exportedFiles.push({
              format,
              fileName: path.basename(result.filePath),
              filePath: destFile,
              activitiesCount: result.activitiesCount
            });
          } else {
            exportErrors.push(`Échec de l'export ${format}: ${result.error}`);
          }
        } catch (error) {
          logger.error(`[DataExportService] Erreur lors de l'export au format ${format}`, {
            error: error.message,
            stack: error.stack
          });
          exportErrors.push(`Échec de l'export ${format}: ${error.message}`);
        }
      }
      
      // Si aucun fichier n'a été exporté avec succès
      if (exportedFiles.length === 0) {
        // Nettoyer le répertoire temporaire
        await fs.promises.rmdir(tempDir, { recursive: true });
        
        return weatherErrorHandler.setProcessingError(
          'Aucun format n\'a pu être exporté avec succès',
          { errors: exportErrors },
          'EXPORT_ALL_FORMATS_FAILED'
        );
      }
      
      // Générer un README avec des informations sur l'export
      const readmeContent = this.generateReadme(userId, exportedFiles);
      const readmePath = path.join(tempDir, 'README.txt');
      await fs.promises.writeFile(readmePath, readmeContent, 'utf8');
      
      exportedFiles.push({
        format: 'txt',
        fileName: 'README.txt',
        filePath: readmePath
      });
      
      // Créer le fichier ZIP
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const archiveName = `export_${userId}_${timestamp}.zip`;
      const archivePath = path.join(this.exportDir, archiveName);
      
      await this._createZipArchive(tempDir, archivePath);
      
      // Nettoyer le répertoire temporaire après avoir créé l'archive
      await fs.promises.rmdir(tempDir, { recursive: true });
      
      logger.info(`[DataExportService] Archive créée pour l'utilisateur ${userId}: ${archiveName}`);
      
      return {
        success: true,
        filePath: archivePath,
        archiveName,
        formats: exportedFiles.map(file => file.format),
        timestamp: new Date().toISOString(),
        warnings: exportErrors.length > 0 ? exportErrors : undefined
      };
    } catch (error) {
      logger.error(`[DataExportService] Erreur lors de la création de l'archive: ${error.message}`, {
        error: error.message,
        stack: error.stack
      });
      
      return weatherErrorHandler.setProcessingError(
        `Erreur lors de la création de l'archive: ${error.message}`,
        { userId, formats },
        'EXPORT_ARCHIVE_ERROR'
      );
    }
  }

  /**
   * Crée une archive ZIP à partir d'un répertoire
   * @private
   * @param {string} sourceDir - Répertoire source
   * @param {string} targetFile - Fichier ZIP cible
   * @returns {Promise} Promesse résolue lorsque l'archive est créée
   */
  _createZipArchive(sourceDir, targetFile) {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(targetFile);
      const archive = archiver('zip', {
        zlib: { level: 9 } // Niveau de compression maximum
      });
      
      // Écouter les événements de sortie
      output.on('close', () => {
        logger.info(`Archive créée: ${targetFile} (${archive.pointer()} octets)`);
        resolve();
      });
      
      output.on('end', () => {
        logger.info('Flux de données terminé');
      });
      
      // Écouter les erreurs
      archive.on('warning', (err) => {
        if (err.code === 'ENOENT') {
          logger.warn(`Avertissement lors de la création de l'archive: ${err.message}`);
        } else {
          reject(err);
        }
      });
      
      archive.on('error', (err) => {
        reject(err);
      });
      
      // Diriger l'archive vers le fichier de sortie
      archive.pipe(output);
      
      // Ajouter les fichiers du répertoire source
      archive.directory(sourceDir, false);
      
      // Finaliser l'archive
      archive.finalize();
    });
  }

  /**
   * Génère un fichier README pour l'archive d'export
   * @param {string} userId - ID de l'utilisateur
   * @param {Array} files - Fichiers inclus dans l'archive
   * @returns {string} Contenu du README
   */
  generateReadme(userId, files) {
    const date = new Date().toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    let content = `EXPORT DE DONNÉES DASHBOARD CYCLISTE EUROPÉEN
====================================

Utilisateur: ${userId}
Date d'export: ${date}

Contenu de l'archive:
`;

    files.forEach(file => {
      content += `- ${file.fileName}: ${file.activitiesCount} activités au format ${file.format.toUpperCase()}\n`;
    });
    
    content += `
Formats de fichiers:
- JSON: Format de données structuré utilisable par la plupart des applications
- CSV: Format tabulaire importable dans Excel, Google Sheets, etc.
- GPX: Format d'échange de données GPS, compatible avec la plupart des applications de cartographie
- TCX: Format Training Center XML de Garmin, pour les données d'entraînement
- FIT: Format Flexible and Interoperable Data Transfer, utilisé par les appareils Garmin et autres

Comment utiliser ces fichiers:
- Les fichiers JSON et CSV peuvent être ouverts dans n'importe quel éditeur de texte ou tableur
- Les fichiers GPX peuvent être importés dans des applications comme Strava, Komoot, ou RideWithGPS
- Les fichiers TCX peuvent être importés dans des applications d'analyse comme TrainingPeaks ou Strava
- Les fichiers FIT sont compatibles avec les appareils Garmin et de nombreuses applications d'analyse

Support:
Pour toute question concernant cet export, contactez support@grand-est-cyclisme.fr

Grand Est Cyclisme Dashboard - Copyright 2025
`;

    return content;
  }
  
  /**
   * Exporte le programme d'entraînement d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {string} programId - ID du programme d'entraînement
   * @param {string} format - Format d'export (json, csv, ical)
   * @returns {Object} Informations sur le fichier exporté
   */
  async exportTrainingProgram(userId, programId, format = 'json') {
    // Cette méthode serait implémentée pour exporter les programmes d'entraînement
    // Pour l'instant, nous renvoyons un message d'information
    return {
      success: false,
      error: "Fonctionnalité en cours d'implémentation"
    };
  }
  
  /**
   * Supprime les fichiers d'export plus anciens qu'une certaine durée
   * @param {number} maxAgeHours - Âge maximum des fichiers en heures
   * @returns {Object} Résultat du nettoyage
   */
  async cleanupExportFiles(maxAgeHours = 24) {
    try {
      const files = await fs.promises.readdir(this.exportDir);
      const now = new Date();
      let deletedCount = 0;
      
      for (const file of files) {
        const filePath = path.join(this.exportDir, file);
        const stats = await fs.promises.stat(filePath);
        
        const fileAge = (now - stats.mtime) / (1000 * 60 * 60); // Âge en heures
        
        if (fileAge > maxAgeHours) {
          await fs.promises.unlink(filePath);
          deletedCount++;
        }
      }
      
      logger.info(`[DataExportService] Nettoyage des fichiers d'export: ${deletedCount} fichiers supprimés`);
      
      return {
        success: true,
        deletedFiles: deletedCount
      };
    } catch (error) {
      logger.error(`[DataExportService] Erreur lors du nettoyage des fichiers d'export: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new DataExportService();
