/**
 * Routes pour la gestion des tokens Strava
 */

const express = require('express');
const stravaTokenController = require('../controllers/strava-token.controller');
const { authenticateUser, authenticateAdmin } = require('../middleware/auth.middleware');
const cacheMiddleware = require('../middleware/cache.middleware');

const router = express.Router();

/**
 * @swagger
 * /api/strava-token/status:
 *   get:
 *     summary: Obtenir le statut des tokens Strava
 *     tags: [Strava]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statut des tokens récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 */
router.get('/status', 
  authenticateUser,
  cacheMiddleware.route({ ttl: 60 }), // 1 minute de cache
  stravaTokenController.getTokenStatus
);

/**
 * @swagger
 * /api/strava-token/health:
 *   get:
 *     summary: Vérifier l'état de santé de l'intégration Strava
 *     tags: [Strava, Monitoring]
 *     responses:
 *       200:
 *         description: État de santé récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 */
router.get('/health', 
  cacheMiddleware.route({ ttl: 300 }), // 5 minutes de cache
  stravaTokenController.checkHealth
);

/**
 * @swagger
 * /api/strava-token/refresh:
 *   post:
 *     summary: Forcer le rafraîchissement du token Strava (admin uniquement)
 *     tags: [Strava, Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token rafraîchi avec succès
 *       403:
 *         description: Accès refusé
 */
router.post('/refresh', 
  authenticateAdmin,
  stravaTokenController.forceRefreshToken
);

/**
 * @swagger
 * /api/strava-token/cache:
 *   delete:
 *     summary: Vider le cache des tokens Strava (admin uniquement)
 *     tags: [Strava, Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cache vidé avec succès
 *       403:
 *         description: Accès refusé
 */
router.delete('/cache', 
  authenticateAdmin,
  stravaTokenController.clearTokenCache
);

module.exports = router;
