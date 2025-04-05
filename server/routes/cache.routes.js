/**
 * Routes pour la gestion du cache
 * Gère les endpoints API pour les informations et la gestion du cache Redis
 */

const express = require('express');
const router = express.Router();
const cacheController = require('../controllers/cache.controller');
const authMiddleware = require('../middleware/auth.middleware');

/**
 * @route   GET /api/cache/info
 * @desc    Obtient des informations sur l'état du cache
 * @access  Admin
 */
router.get('/info', 
  authMiddleware.authenticate,
  cacheController.getCacheInfo
);

/**
 * @route   DELETE /api/cache/flush
 * @desc    Vide complètement le cache
 * @access  Admin
 */
router.delete('/flush', 
  authMiddleware.authenticate,
  cacheController.flushCache
);

/**
 * @route   DELETE /api/cache/pattern
 * @desc    Vide le cache pour un motif spécifique
 * @access  Admin
 * @body    {String} pattern - Motif de recherche dans les clés de cache
 */
router.delete('/pattern', 
  authMiddleware.authenticate,
  cacheController.flushCachePattern
);

module.exports = router;
