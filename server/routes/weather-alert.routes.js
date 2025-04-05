/**
 * Routes pour les alertes météo
 * Gère les endpoints API pour la vérification et la gestion des alertes météo
 */

const express = require('express');
const router = express.Router();
const weatherAlertController = require('../controllers/weather-alert.controller');
const authMiddleware = require('../middleware/auth.middleware');
const rateLimit = require('express-rate-limit');
const { cacheMiddleware, environmentalCacheKeyGenerator } = require('../middleware/cache.middleware');

// Limiter les requêtes à 30 par heure par IP
const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 30,
  message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard'
});

// Configurer le cache pour les alertes météo (15 minutes)
const alertCache = cacheMiddleware(900, environmentalCacheKeyGenerator);

/**
 * @swagger
 * /api/weather-alerts/route/{routeId}:
 *   get:
 *     summary: Vérifie les alertes météo pour un itinéraire
 *     description: Recherche les changements significatifs dans les prévisions météo pour un itinéraire
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
 *     responses:
 *       200:
 *         description: Vérification des alertes effectuée avec succès
 *       404:
 *         description: Itinéraire non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.get('/route/:routeId', 
  authMiddleware.authenticate,
  apiLimiter,
  alertCache,
  weatherAlertController.checkRouteAlerts
);

/**
 * @swagger
 * /api/weather-alerts/route/{routeId}/toggle:
 *   put:
 *     summary: Active ou désactive les alertes pour un itinéraire
 *     description: Configure la réception des alertes météo pour un itinéraire favori
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - enabled
 *             properties:
 *               enabled:
 *                 type: boolean
 *                 description: État d'activation des alertes
 *     responses:
 *       200:
 *         description: Configuration mise à jour avec succès
 *       400:
 *         description: Paramètres invalides
 *       404:
 *         description: Itinéraire non trouvé dans les favoris
 *       500:
 *         description: Erreur serveur
 */
router.put('/route/:routeId/toggle', 
  authMiddleware.authenticate,
  weatherAlertController.toggleRouteAlerts
);

/**
 * @swagger
 * /api/weather-alerts/thresholds:
 *   put:
 *     summary: Configure les seuils d'alerte météo
 *     description: Modifie les seuils utilisés pour générer les alertes météo (admin uniquement)
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
 *               - thresholds
 *             properties:
 *               thresholds:
 *                 type: object
 *                 properties:
 *                   temperature_change:
 *                     type: number
 *                     description: Seuil de changement de température en °C
 *                   precipitation_probability:
 *                     type: number
 *                     description: Seuil de probabilité de précipitation en %
 *                   wind_speed:
 *                     type: number
 *                     description: Seuil de vitesse du vent en km/h
 *                   severe_weather:
 *                     type: boolean
 *                     description: Activer les alertes pour conditions sévères
 *     responses:
 *       200:
 *         description: Seuils mis à jour avec succès
 *       400:
 *         description: Paramètres invalides
 *       403:
 *         description: Accès non autorisé (admin uniquement)
 *       500:
 *         description: Erreur serveur
 */
router.put('/thresholds', 
  authMiddleware.authenticate,
  weatherAlertController.configureAlertThresholds
);

/**
 * @swagger
 * /api/weather-alerts/history:
 *   get:
 *     summary: Récupère l'historique des alertes météo
 *     description: Obtient l'historique des alertes météo pour l'utilisateur actuel
 *     tags: [Prédictions Environnementales]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Historique récupéré avec succès
 *       500:
 *         description: Erreur serveur
 */
router.get('/history', 
  authMiddleware.authenticate,
  alertCache,
  weatherAlertController.getUserAlertHistory
);

/**
 * @swagger
 * /api/weather-alerts/history/{userId}:
 *   get:
 *     summary: Récupère l'historique des alertes pour un utilisateur spécifique
 *     description: Obtient l'historique des alertes météo pour un utilisateur spécifique (admin uniquement)
 *     tags: [Prédictions Environnementales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Historique récupéré avec succès
 *       403:
 *         description: Accès non autorisé (admin uniquement)
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.get('/history/:userId', 
  authMiddleware.authenticate,
  alertCache,
  weatherAlertController.getUserAlertHistory
);

module.exports = router;
