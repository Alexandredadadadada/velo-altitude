const express = require('express');
const router = express.Router();
const europeanColsController = require('../controllers/europeanColsController');
const cacheMiddleware = require('../middleware/cache.middleware');

/**
 * Routes pour la gestion des cols européens enrichis
 */

// GET /api/european-cols - Récupérer tous les cols avec pagination et filtres
router.get(
  '/api/european-cols',
  cacheMiddleware.cache('10 minutes', cacheMiddleware.defaultCacheKeyGenerator),
  europeanColsController.getAllCols
);

// GET /api/european-cols/filters - Récupérer les options de filtres
router.get(
  '/api/european-cols/filters',
  cacheMiddleware.cache('1 hour', cacheMiddleware.defaultCacheKeyGenerator),
  europeanColsController.getFilterOptions
);

// GET /api/european-cols/:id - Récupérer un col spécifique par son ID
router.get(
  '/api/european-cols/:id',
  cacheMiddleware.cache('1 hour', cacheMiddleware.colCacheKeyGenerator),
  europeanColsController.getColById
);

// GET /api/european-cols/3d-data/:id - Récupérer les données 3D d'un col spécifique
router.get(
  '/api/european-cols/3d-data/:id',
  cacheMiddleware.cache('1 day', cacheMiddleware.colCacheKeyGenerator),
  europeanColsController.getCol3DData
);

module.exports = router;
