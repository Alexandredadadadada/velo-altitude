/**
 * Routes pour le monitoring des performances
 */
const express = require('express');
const router = express.Router();
const performanceMonitor = require('../services/performance-monitor.service');
const { authenticateJWT, authorizeAdmin } = require('../middleware/auth.middleware');

/**
 * @swagger
 * /api/monitoring/metrics:
 *   get:
 *     summary: Récupère les métriques de performance globales
 *     description: Récupère les métriques de performance globales du système
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Métriques de performance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 global:
 *                   type: object
 *                 services:
 *                   type: object
 */
router.get('/metrics', authenticateJWT, authorizeAdmin, (req, res) => {
  const globalMetrics = performanceMonitor.getGlobalMetrics();
  const serviceMetrics = {};
  
  // Récupérer les métriques pour chaque service
  globalMetrics.services.forEach(serviceName => {
    serviceMetrics[serviceName] = performanceMonitor.getServiceMetrics(serviceName);
  });
  
  res.json({
    global: globalMetrics,
    services: serviceMetrics
  });
});

/**
 * @swagger
 * /api/monitoring/alerts:
 *   get:
 *     summary: Récupère les alertes actives
 *     description: Récupère la liste des alertes de performance actives
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des alertes actives
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   service:
 *                     type: string
 *                   type:
 *                     type: string
 *                   level:
 *                     type: string
 *                   message:
 *                     type: string
 *                   timestamp:
 *                     type: string
 */
router.get('/alerts', authenticateJWT, authorizeAdmin, (req, res) => {
  const alerts = performanceMonitor.getActiveAlerts();
  res.json(alerts);
});

/**
 * @swagger
 * /api/monitoring/services/{serviceName}/metrics:
 *   get:
 *     summary: Récupère les métriques d'un service spécifique
 *     description: Récupère les métriques détaillées pour un service spécifique
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceName
 *         required: true
 *         schema:
 *           type: string
 *         description: Nom du service
 *     responses:
 *       200:
 *         description: Métriques du service
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: Service non trouvé
 */
router.get('/services/:serviceName/metrics', authenticateJWT, authorizeAdmin, (req, res) => {
  const { serviceName } = req.params;
  const metrics = performanceMonitor.getServiceMetrics(serviceName);
  
  if (!metrics) {
    return res.status(404).json({ error: `Service ${serviceName} non trouvé` });
  }
  
  res.json(metrics);
});

/**
 * @swagger
 * /api/monitoring/health:
 *   get:
 *     summary: Vérifie l'état de santé du système
 *     description: Endpoint public pour vérifier l'état de santé global du système
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: État de santé du système
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 uptime:
 *                   type: number
 *                 version:
 *                   type: string
 */
router.get('/health', (req, res) => {
  const globalMetrics = performanceMonitor.getGlobalMetrics();
  const alerts = performanceMonitor.getActiveAlerts();
  
  // Déterminer le statut global
  let status = 'healthy';
  if (alerts.some(alert => alert.level === 'critical')) {
    status = 'critical';
  } else if (alerts.some(alert => alert.level === 'warning')) {
    status = 'warning';
  }
  
  res.json({
    status,
    uptime: globalMetrics.uptime,
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString(),
    services: globalMetrics.services.length,
    activeAlerts: alerts.length
  });
});

module.exports = router;
