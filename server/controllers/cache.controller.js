/**
 * Contrôleur pour la gestion du cache
 * Permet d'obtenir des informations et de gérer le cache Redis
 */

const cacheService = require('../services/cache.service');
const logger = require('../utils/logger');

/**
 * Obtient des informations sur l'état actuel du cache
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const getCacheInfo = async (req, res) => {
  try {
    // Vérifier si l'utilisateur est administrateur
    if (!req.user || !req.user.roles || !req.user.roles.includes('admin')) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé - Réservé aux administrateurs'
      });
    }

    const stats = await cacheService.getStats();
    
    res.json({
      success: true,
      data: {
        status: stats.connected ? 'connected' : 'disconnected',
        type: stats.type,
        hits: stats.hits || 0,
        misses: stats.misses || 0,
        keys: stats.keys || 0,
        ttlSettings: {
          environmental: 1800,  // 30 minutes
          predictions: 3600,    // 1 heure
          efforts: 1800,        // 30 minutes
          alerts: 900           // 15 minutes
        }
      }
    });
  } catch (error) {
    logger.error(`Erreur lors de la récupération des infos du cache: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des informations du cache',
      error: error.message
    });
  }
};

/**
 * Vide complètement le cache
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const flushCache = async (req, res) => {
  try {
    // Vérifier si l'utilisateur est administrateur
    if (!req.user || !req.user.roles || !req.user.roles.includes('admin')) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé - Réservé aux administrateurs'
      });
    }

    const result = await cacheService.flushAll();
    
    logger.info(`Cache vidé avec succès: ${result} clés supprimées`);
    res.json({
      success: true,
      message: 'Cache vidé avec succès',
      data: {
        keysDeleted: result
      }
    });
  } catch (error) {
    logger.error(`Erreur lors du vidage du cache: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du vidage du cache',
      error: error.message
    });
  }
};

/**
 * Vide le cache pour un motif spécifique
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const flushCachePattern = async (req, res) => {
  try {
    // Vérifier si l'utilisateur est administrateur
    if (!req.user || !req.user.roles || !req.user.roles.includes('admin')) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé - Réservé aux administrateurs'
      });
    }

    const { pattern } = req.body;
    
    if (!pattern) {
      return res.status(400).json({
        success: false,
        message: 'Le motif de recherche est requis'
      });
    }

    const result = await cacheService.delByPattern(pattern);
    
    logger.info(`Cache vidé pour le motif ${pattern}: ${result} clés supprimées`);
    res.json({
      success: true,
      message: `Cache supprimé pour le motif ${pattern}`,
      data: {
        keysDeleted: result
      }
    });
  } catch (error) {
    logger.error(`Erreur lors du vidage du cache par motif: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du vidage du cache par motif',
      error: error.message
    });
  }
};

module.exports = {
  getCacheInfo,
  flushCache,
  flushCachePattern
};
