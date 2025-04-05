/**
 * Routes pour l'estimation d'effort
 * Gère les endpoints API pour l'estimation de l'effort requis sur un itinéraire
 */

const express = require('express');
const router = express.Router();
const effortEstimationController = require('../controllers/effort-estimation.controller');
const authMiddleware = require('../middleware/auth.middleware');
const rateLimit = require('express-rate-limit');
const { cacheMiddleware, environmentalCacheKeyGenerator } = require('../middleware/cache.middleware');

// Limiter les requêtes à 50 par heure par IP
const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 50,
  message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard'
});

// Configurer le cache pour les estimations d'effort (30 minutes)
const effortCache = cacheMiddleware(1800, environmentalCacheKeyGenerator);

/**
 * @swagger
 * /api/effort-estimation/route/{routeId}:
 *   get:
 *     summary: Estime l'effort requis pour un itinéraire
 *     description: Calcule l'effort requis en fonction des conditions environnementales et du profil du cycliste
 *     tags: [Prédictions Environnementales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: routeId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'itinéraire
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Date cible pour l'estimation (format YYYY-MM-DD)
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur pour personnaliser l'estimation (optionnel)
 *     responses:
 *       200:
 *         description: Estimation générée avec succès
 *       400:
 *         description: Paramètres invalides
 *       404:
 *         description: Itinéraire non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.get('/route/:routeId', 
  authMiddleware.authenticate,
  apiLimiter,
  effortCache,
  effortEstimationController.estimateEffort
);

/**
 * @swagger
 * /api/effort-estimation/compare:
 *   post:
 *     summary: Compare l'effort requis pour plusieurs itinéraires
 *     description: Calcule et compare l'effort requis pour plusieurs itinéraires
 *     tags: [Prédictions Environnementales]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - routeIds
 *             properties:
 *               routeIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Liste des IDs d'itinéraires à comparer
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Date cible pour l'estimation (format YYYY-MM-DD)
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur pour personnaliser l'estimation (optionnel)
 *     responses:
 *       200:
 *         description: Comparaison générée avec succès
 *       400:
 *         description: Paramètres invalides
 *       500:
 *         description: Erreur serveur
 */
router.post('/compare', 
  authMiddleware.authenticate,
  apiLimiter,
  effortEstimationController.compareRoutesEffort
);

module.exports = router;
