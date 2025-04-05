/**
 * Routes pour les fonctionnalités de diagnostic et monitoring
 */

const express = require('express');
const router = express.Router();
const diagnosticController = require('../controllers/diagnostic.controller');
const authMiddleware = require('../middleware/auth.middleware');
const cacheMiddleware = require('../middleware/cache.middleware');

// Appliquer l'authentification à toutes les routes de diagnostic
// Ces routes sont sensibles car elles exposent des informations système
router.use(authMiddleware.requireAuth);
router.use(authMiddleware.requireAdmin);

/**
 * @swagger
 * /api/diagnostic/health:
 *   get:
 *     summary: Obtient l'état de santé global du système
 *     tags: [Diagnostic]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: État de santé récupéré avec succès
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès interdit (rôle administrateur requis)
 *       500:
 *         description: Erreur serveur
 */
router.get('/health', cacheMiddleware.cache('diagnostic', 60), diagnosticController.getHealth);

/**
 * @swagger
 * /api/diagnostic/errors:
 *   get:
 *     summary: Obtient les statistiques d'erreurs
 *     tags: [Diagnostic]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques récupérées avec succès
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès interdit (rôle administrateur requis)
 *       500:
 *         description: Erreur serveur
 */
router.get('/errors', cacheMiddleware.cache('diagnostic', 300), diagnosticController.getErrorStats);

/**
 * @swagger
 * /api/diagnostic/errors/patterns:
 *   get:
 *     summary: Analyse les modèles d'erreur
 *     tags: [Diagnostic]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: integer
 *         description: Période d'analyse en heures (défaut 24)
 *       - in: query
 *         name: minOccurrences
 *         schema:
 *           type: integer
 *         description: Nombre minimum d'occurrences pour considérer un modèle (défaut 3)
 *       - in: query
 *         name: types
 *         schema:
 *           type: string
 *         description: Types d'erreurs à analyser (séparés par virgule, défaut error,weather,api)
 *     responses:
 *       200:
 *         description: Analyse effectuée avec succès
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès interdit (rôle administrateur requis)
 *       500:
 *         description: Erreur serveur
 */
router.get('/errors/patterns', cacheMiddleware.cache('diagnostic', 600), diagnosticController.analyzeErrorPatterns);

/**
 * @swagger
 * /api/diagnostic/weather:
 *   get:
 *     summary: Vérifie l'état des services météo
 *     tags: [Diagnostic]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: services
 *         schema:
 *           type: string
 *         description: Services météo à vérifier (séparés par virgule)
 *     responses:
 *       200:
 *         description: Vérification effectuée avec succès
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès interdit (rôle administrateur requis)
 *       500:
 *         description: Erreur serveur
 */
router.get('/weather', cacheMiddleware.cache('diagnostic', 300), diagnosticController.checkWeatherServices);

/**
 * @swagger
 * /api/diagnostic/logs:
 *   get:
 *     summary: Effectue un diagnostic des logs
 *     tags: [Diagnostic]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Diagnostic effectué avec succès
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès interdit (rôle administrateur requis)
 *       500:
 *         description: Erreur serveur
 */
router.get('/logs', cacheMiddleware.cache('diagnostic', 1800), diagnosticController.diagnoseLogs);

/**
 * @swagger
 * /api/diagnostic/errors/reset:
 *   post:
 *     summary: Réinitialise les statistiques d'erreur
 *     tags: [Diagnostic]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Réinitialisation effectuée avec succès
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès interdit (rôle administrateur requis)
 *       500:
 *         description: Erreur serveur
 */
router.post('/errors/reset', diagnosticController.resetErrorStats);

module.exports = router;
