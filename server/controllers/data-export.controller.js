/**
 * Contrôleur d'exportation de données
 * Expose les API pour exporter les données dans différents formats
 */

const dataExportService = require('../services/data-export.service');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

/**
 * Exporte les activités d'un utilisateur dans un format spécifique
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const exportActivities = async (req, res) => {
  try {
    const { userId } = req.params;
    const { format = 'json', startDate, endDate, activityType } = req.query;
    
    // Vérifier que l'utilisateur authentifié est autorisé à effectuer cette action
    if (req.user.id !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Vous n\'êtes pas autorisé à effectuer cette action'
      });
    }
    
    const options = {
      startDate,
      endDate,
      activityType
    };
    
    const result = await dataExportService.exportActivities(userId, format, options);
    
    if (!result.success) {
      return res.status(400).json({
        status: 'error',
        message: result.error
      });
    }
    
    // Si le client a demandé un téléchargement direct du fichier
    if (req.query.download === 'true') {
      const filePath = result.filePath;
      const fileName = path.basename(filePath);
      
      res.setHeader('Content-Type', getContentType(format));
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } else {
      // Sinon, renvoyer les méta-données d'export
      res.json({
        status: 'success',
        data: result
      });
    }
  } catch (error) {
    logger.error(`[DataExportController] Erreur lors de l'export des activités: ${error.message}`);
    
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de l\'export des activités',
      error: error.message
    });
  }
};

/**
 * Crée une archive contenant plusieurs formats d'export
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const createExportArchive = async (req, res) => {
  try {
    const { userId } = req.params;
    const { formats = ['json', 'csv', 'gpx'], startDate, endDate, activityType } = req.body;
    
    // Vérifier que l'utilisateur authentifié est autorisé à effectuer cette action
    if (req.user.id !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Vous n\'êtes pas autorisé à effectuer cette action'
      });
    }
    
    const options = {
      startDate,
      endDate,
      activityType
    };
    
    const result = await dataExportService.createExportArchive(userId, formats, options);
    
    if (!result.success) {
      return res.status(400).json({
        status: 'error',
        message: result.error
      });
    }
    
    // Si le client a demandé un téléchargement direct de l'archive
    if (req.query.download === 'true') {
      const filePath = result.archivePath;
      const fileName = result.archiveName;
      
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } else {
      // Sinon, renvoyer les méta-données d'export
      res.json({
        status: 'success',
        data: result
      });
    }
  } catch (error) {
    logger.error(`[DataExportController] Erreur lors de la création de l'archive: ${error.message}`);
    
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la création de l\'archive',
      error: error.message
    });
  }
};

/**
 * Exporte un programme d'entraînement
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const exportTrainingProgram = async (req, res) => {
  try {
    const { userId, programId } = req.params;
    const { format = 'json' } = req.query;
    
    // Vérifier que l'utilisateur authentifié est autorisé à effectuer cette action
    if (req.user.id !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Vous n\'êtes pas autorisé à effectuer cette action'
      });
    }
    
    const result = await dataExportService.exportTrainingProgram(userId, programId, format);
    
    if (!result.success) {
      return res.status(400).json({
        status: 'error',
        message: result.error
      });
    }
    
    // Si le client a demandé un téléchargement direct du fichier
    if (req.query.download === 'true') {
      const filePath = result.filePath;
      const fileName = path.basename(filePath);
      
      res.setHeader('Content-Type', getContentType(format));
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } else {
      // Sinon, renvoyer les méta-données d'export
      res.json({
        status: 'success',
        data: result
      });
    }
  } catch (error) {
    logger.error(`[DataExportController] Erreur lors de l'export du programme d'entraînement: ${error.message}`);
    
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de l\'export du programme d\'entraînement',
      error: error.message
    });
  }
};

/**
 * Récupère le type de contenu MIME en fonction du format d'export
 * @param {string} format - Format d'export
 * @returns {string} Type de contenu MIME
 */
const getContentType = (format) => {
  switch (format.toLowerCase()) {
    case 'json':
      return 'application/json';
    case 'csv':
      return 'text/csv';
    case 'gpx':
      return 'application/gpx+xml';
    case 'tcx':
      return 'application/xml';
    case 'fit':
      return 'application/octet-stream';
    case 'ical':
      return 'text/calendar';
    default:
      return 'application/octet-stream';
  }
};

module.exports = {
  exportActivities,
  createExportArchive,
  exportTrainingProgram
};
