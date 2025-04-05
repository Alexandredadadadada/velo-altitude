/**
 * Contrôleur pour la synchronisation des activités Strava
 */

const { logger } = require('../utils/logger');
const stravaSyncService = require('../services/strava-sync.service');
const { HTTP_STATUS } = require('../constants/http-status');

/**
 * Démarre une synchronisation des activités Strava
 * @route POST /api/strava/sync
 */
exports.startSync = async (req, res) => {
  try {
    // L'utilisateur est identifié via le middleware d'authentification
    const userId = req.user._id;
    
    // Options de synchronisation
    const options = {
      fullSync: req.body.fullSync === true,
      daysToSync: req.body.daysToSync || 30,
      startDate: req.body.startDate ? new Date(req.body.startDate) : null,
      endDate: req.body.endDate ? new Date(req.body.endDate) : null
    };
    
    // Démarrer la synchronisation
    const syncStatus = await stravaSyncService.startSync(userId, options);
    
    res.status(HTTP_STATUS.ACCEPTED).json({
      message: 'Synchronisation Strava démarrée',
      status: syncStatus
    });
  } catch (error) {
    logger.error(`Erreur au démarrage de la synchronisation Strava: ${error.message}`, {
      userId: req.user?._id,
      error
    });
    
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: `Échec de démarrage de la synchronisation: ${error.message}`
    });
  }
};

/**
 * Récupère le statut d'une synchronisation en cours
 * @route GET /api/strava/sync/status
 */
exports.getSyncStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const status = await stravaSyncService.getSyncStatus(userId);
    
    res.status(HTTP_STATUS.OK).json(status);
  } catch (error) {
    logger.error(`Erreur lors de la récupération du statut de synchronisation: ${error.message}`, {
      userId: req.user?._id,
      error
    });
    
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: `Impossible de récupérer le statut: ${error.message}`
    });
  }
};

/**
 * Annule une synchronisation en cours
 * @route DELETE /api/strava/sync
 */
exports.cancelSync = async (req, res) => {
  try {
    const userId = req.user._id;
    const result = await stravaSyncService.cancelSync(userId);
    
    if (result) {
      res.status(HTTP_STATUS.OK).json({
        message: 'Synchronisation annulée avec succès'
      });
    } else {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        message: 'Aucune synchronisation active trouvée'
      });
    }
  } catch (error) {
    logger.error(`Erreur lors de l'annulation de la synchronisation: ${error.message}`, {
      userId: req.user?._id,
      error
    });
    
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: `Impossible d'annuler la synchronisation: ${error.message}`
    });
  }
};

/**
 * Récupère l'historique des synchronisations
 * @route GET /api/strava/sync/history
 */
exports.getSyncHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 10;
    
    const history = await stravaSyncService.getSyncHistory(userId, limit);
    
    res.status(HTTP_STATUS.OK).json(history);
  } catch (error) {
    logger.error(`Erreur lors de la récupération de l'historique: ${error.message}`, {
      userId: req.user?._id,
      error
    });
    
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: `Impossible de récupérer l'historique: ${error.message}`
    });
  }
};

/**
 * Récupère les statistiques globales de synchronisation (admin uniquement)
 * @route GET /api/strava/sync/stats
 */
exports.getGlobalStats = async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin (le middleware isAdmin aura déjà été appliqué)
    const stats = await stravaSyncService.getGlobalStats();
    
    res.status(HTTP_STATUS.OK).json(stats);
  } catch (error) {
    logger.error(`Erreur lors de la récupération des statistiques globales: ${error.message}`, {
      userId: req.user?._id,
      error
    });
    
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: `Impossible de récupérer les statistiques: ${error.message}`
    });
  }
};
