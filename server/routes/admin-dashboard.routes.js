/**
 * Routes pour le tableau de bord administratif
 */

const express = require('express');
const router = express.Router();
const AdminDashboardController = require('../controllers/admin-dashboard.controller');
const { authenticate, isAdmin } = require('../middleware/auth.middleware');

// Toutes les routes nécessitent une authentification et des privilèges administrateur
router.use(authenticate, isAdmin);

/**
 * @swagger
 * /api/admin/dashboard/api-stats:
 *   get:
 *     summary: Obtient les statistiques d'utilisation des API
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month]
 *           default: day
 *         description: Période pour les statistiques
 *       - in: query
 *         name: apiName
 *         schema:
 *           type: string
 *         description: Filtrer par nom d'API (facultatif)
 *     responses:
 *       200:
 *         description: Statistiques d'utilisation des API
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès non autorisé
 */
router.get('/api-stats', AdminDashboardController.getApiUsageStats);

/**
 * @swagger
 * /api/admin/dashboard/services-status:
 *   get:
 *     summary: Obtient l'état des services externes
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: État des services
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès non autorisé
 */
router.get('/services-status', AdminDashboardController.getServicesStatus);

/**
 * @swagger
 * /api/admin/dashboard/alerts:
 *   get:
 *     summary: Obtient la liste des alertes
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, resolved, all]
 *           default: active
 *         description: Statut des alertes à récupérer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Nombre maximal d'alertes à récupérer
 *     responses:
 *       200:
 *         description: Liste des alertes
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès non autorisé
 */
router.get('/alerts', AdminDashboardController.getAlerts);

/**
 * @swagger
 * /api/admin/dashboard/alerts/{alertId}/resolve:
 *   post:
 *     summary: Marque une alerte comme résolue
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: alertId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'alerte à résoudre
 *     responses:
 *       200:
 *         description: Alerte marquée comme résolue
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès non autorisé
 *       404:
 *         description: Alerte non trouvée
 */
router.post('/alerts/:alertId/resolve', AdminDashboardController.resolveAlert);

/**
 * @swagger
 * /api/admin/dashboard/alerts/send:
 *   post:
 *     summary: Envoie une alerte manuelle
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *               - level
 *             properties:
 *               message:
 *                 type: string
 *                 description: Contenu de l'alerte
 *               level:
 *                 type: string
 *                 enum: [info, warning, error, critical]
 *                 description: Niveau de sévérité
 *               apiName:
 *                 type: string
 *                 description: Nom de l'API concernée (facultatif)
 *               recipients:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Liste d'emails ou de numéros de téléphone (facultatif)
 *               sendSms:
 *                 type: boolean
 *                 default: false
 *                 description: Envoyer également par SMS
 *     responses:
 *       200:
 *         description: Alerte envoyée
 *       400:
 *         description: Paramètres invalides
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès non autorisé
 */
router.post('/alerts/send', AdminDashboardController.sendAlert);

/**
 * @swagger
 * /api/admin/dashboard/event-log:
 *   get:
 *     summary: Obtient le journal des événements API
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Date de début (ISO 8601)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Date de fin (ISO 8601)
 *       - in: query
 *         name: apiName
 *         schema:
 *           type: string
 *         description: Filtrer par nom d'API
 *       - in: query
 *         name: statusCode
 *         schema:
 *           type: integer
 *         description: Filtrer par code de statut HTTP
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Nombre maximum d'événements à récupérer
 *     responses:
 *       200:
 *         description: Journal des événements API
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès non autorisé
 */
router.get('/event-log', AdminDashboardController.getApiEventLog);

/**
 * @swagger
 * /api/admin/dashboard/alert-config/{apiName}:
 *   put:
 *     summary: Configure les seuils d'alerte pour une API
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: apiName
 *         required: true
 *         schema:
 *           type: string
 *         description: Nom de l'API
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dailyUsageThreshold:
 *                 type: integer
 *                 description: Seuil d'utilisation quotidienne
 *               errorRateThreshold:
 *                 type: number
 *                 description: Seuil de taux d'erreur (pourcentage)
 *               responseTimeThreshold:
 *                 type: integer
 *                 description: Seuil de temps de réponse (ms)
 *               notificationEmails:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Emails à notifier
 *               notificationPhones:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Numéros de téléphone à notifier
 *     responses:
 *       200:
 *         description: Configuration mise à jour
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès non autorisé
 */
router.put('/alert-config/:apiName', AdminDashboardController.configureAlertThresholds);

module.exports = router;
