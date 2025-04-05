/**
 * Routes pour le système de cartographie avancée
 */

const express = require('express');
const advancedMappingController = require('../controllers/advanced-mapping.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const cacheMiddleware = require('../middlewares/cache.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Cartographie Avancée
 *   description: API pour les fonctionnalités de cartographie avancée, profiles d'élévation et itinéraires
 */

/**
 * @swagger
 * /api/mapping/3d-terrain:
 *   get:
 *     summary: Récupère les données de terrain 3D pour une région
 *     description: Renvoie les données d'élévation formatées pour la visualisation 3D
 *     tags: [Cartographie Avancée]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sw_lat
 *         required: true
 *         schema:
 *           type: number
 *         description: Latitude sud-ouest de la bounding box
 *       - in: query
 *         name: sw_lng
 *         required: true
 *         schema:
 *           type: number
 *         description: Longitude sud-ouest de la bounding box
 *       - in: query
 *         name: ne_lat
 *         required: true
 *         schema:
 *           type: number
 *         description: Latitude nord-est de la bounding box
 *       - in: query
 *         name: ne_lng
 *         required: true
 *         schema:
 *           type: number
 *         description: Longitude nord-est de la bounding box
 *       - in: query
 *         name: resolution
 *         required: false
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Résolution du modèle d'élévation (10-1000)
 *     responses:
 *       200:
 *         description: Données de terrain récupérées avec succès
 *       400:
 *         description: Paramètres invalides
 *       500:
 *         description: Erreur serveur
 */
router.get(
  '/3d-terrain',
  authMiddleware.verifyToken,
  cacheMiddleware.route({ ttl: 86400 }), // 24 heures
  advancedMappingController.get3DTerrainData
);

/**
 * @swagger
 * /api/mapping/elevation-profile:
 *   get:
 *     summary: Récupère le profil d'élévation pour un itinéraire
 *     description: Renvoie les données d'élévation et statistiques pour un itinéraire
 *     tags: [Cartographie Avancée]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: coordinates
 *         required: true
 *         schema:
 *           type: string
 *         description: Coordonnées au format lng1,lat1|lng2,lat2|...
 *     responses:
 *       200:
 *         description: Profil d'élévation récupéré avec succès
 *       400:
 *         description: Paramètres invalides
 *       500:
 *         description: Erreur serveur
 *   post:
 *     summary: Récupère le profil d'élévation pour un itinéraire
 *     description: Renvoie les données d'élévation et statistiques pour un itinéraire
 *     tags: [Cartographie Avancée]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - coordinates
 *             properties:
 *               coordinates:
 *                 type: array
 *                 items:
 *                   type: array
 *                   items:
 *                     type: number
 *                   minItems: 2
 *                   maxItems: 2
 *     responses:
 *       200:
 *         description: Profil d'élévation récupéré avec succès
 *       400:
 *         description: Paramètres invalides
 *       500:
 *         description: Erreur serveur
 */
router.get(
  '/elevation-profile',
  authMiddleware.verifyToken,
  cacheMiddleware.route({ ttl: 86400 }), // 24 heures
  advancedMappingController.getElevationProfile
);

router.post(
  '/elevation-profile',
  authMiddleware.verifyToken,
  cacheMiddleware.route({ ttl: 86400 }), // 24 heures
  advancedMappingController.getElevationProfile
);

/**
 * @swagger
 * /api/mapping/strava-segments:
 *   get:
 *     summary: Récupère les segments Strava populaires dans une région
 *     description: Renvoie les segments Strava populaires avec leurs détails
 *     tags: [Cartographie Avancée]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sw_lat
 *         required: true
 *         schema:
 *           type: number
 *         description: Latitude sud-ouest de la bounding box
 *       - in: query
 *         name: sw_lng
 *         required: true
 *         schema:
 *           type: number
 *         description: Longitude sud-ouest de la bounding box
 *       - in: query
 *         name: ne_lat
 *         required: true
 *         schema:
 *           type: number
 *         description: Latitude nord-est de la bounding box
 *       - in: query
 *         name: ne_lng
 *         required: true
 *         schema:
 *           type: number
 *         description: Longitude nord-est de la bounding box
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Nombre maximum de segments à récupérer
 *     responses:
 *       200:
 *         description: Segments Strava récupérés avec succès
 *       400:
 *         description: Paramètres invalides
 *       500:
 *         description: Erreur serveur
 */
router.get(
  '/strava-segments',
  authMiddleware.verifyToken,
  cacheMiddleware.route({ ttl: 3600 }), // 1 heure
  advancedMappingController.getPopularStravaSegments
);

/**
 * @swagger
 * /api/mapping/plan-route:
 *   post:
 *     summary: Planifie un itinéraire avec estimation de temps et difficulté
 *     description: Génère un itinéraire détaillé avec profil d'élévation, difficulté et estimations
 *     tags: [Cartographie Avancée]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - waypoints
 *             properties:
 *               waypoints:
 *                 type: array
 *                 items:
 *                   type: array
 *                   items:
 *                     type: number
 *                   minItems: 2
 *                   maxItems: 2
 *                 description: Points de l'itinéraire au format [[lng, lat], ...]
 *                 example: [[7.742, 48.583], [7.854, 48.671]]
 *               options:
 *                 type: object
 *                 properties:
 *                   profile:
 *                     type: string
 *                     enum: [cycling, road, mountain]
 *                     default: cycling
 *                   cyclistLevel:
 *                     type: string
 *                     enum: [beginner, intermediate, advanced, pro]
 *                     default: intermediate
 *                   avoidTraffic:
 *                     type: boolean
 *                     default: true
 *                   avoidHills:
 *                     type: boolean
 *                     default: false
 *                   preferScenic:
 *                     type: boolean
 *                     default: false
 *                   includeWeather:
 *                     type: boolean
 *                     default: true
 *                   includeTraffic:
 *                     type: boolean
 *                     default: true
 *     responses:
 *       200:
 *         description: Itinéraire planifié avec succès
 *       400:
 *         description: Paramètres invalides
 *       500:
 *         description: Erreur serveur
 */
router.post(
  '/plan-route',
  authMiddleware.verifyToken,
  cacheMiddleware.route({ ttl: 3600 }), // 1 heure
  advancedMappingController.planRoute
);

/**
 * @swagger
 * /api/mapping/real-time-overlays:
 *   get:
 *     summary: Récupère les données météo et trafic en temps réel
 *     description: Renvoie les données météo et trafic pour superposition sur la carte
 *     tags: [Cartographie Avancée]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sw_lat
 *         required: true
 *         schema:
 *           type: number
 *         description: Latitude sud-ouest de la bounding box
 *       - in: query
 *         name: sw_lng
 *         required: true
 *         schema:
 *           type: number
 *         description: Longitude sud-ouest de la bounding box
 *       - in: query
 *         name: ne_lat
 *         required: true
 *         schema:
 *           type: number
 *         description: Latitude nord-est de la bounding box
 *       - in: query
 *         name: ne_lng
 *         required: true
 *         schema:
 *           type: number
 *         description: Longitude nord-est de la bounding box
 *     responses:
 *       200:
 *         description: Données en temps réel récupérées avec succès
 *       400:
 *         description: Paramètres invalides
 *       500:
 *         description: Erreur serveur
 */
router.get(
  '/real-time-overlays',
  authMiddleware.verifyToken,
  cacheMiddleware.route({ ttl: 300 }), // 5 minutes
  advancedMappingController.getRealTimeOverlays
);

module.exports = router;
