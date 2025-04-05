/**
 * Documentation Swagger pour les API de météo liées aux itinéraires
 */

/**
 * @swagger
 * tags:
 *   name: Météo des Itinéraires
 *   description: API pour la gestion des prévisions météo liées aux itinéraires
 */

/**
 * @swagger
 * /api/route-weather/forecast/{routeId}:
 *   get:
 *     summary: Récupère les prévisions météo pour un itinéraire spécifique
 *     description: Fournit des prévisions météo détaillées pour chaque segment d'un itinéraire
 *     tags: [Météo des Itinéraires]
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
 *         name: startTime
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Heure de départ pour les prévisions (format ISO)
 *       - in: query
 *         name: forceRefresh
 *         schema:
 *           type: boolean
 *         description: Force le rafraîchissement du cache
 *     responses:
 *       200:
 *         description: Prévisions météo récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     routeId:
 *                       type: string
 *                     routeName:
 *                       type: string
 *                     startTime:
 *                       type: string
 *                     requestTime:
 *                       type: string
 *                     distance:
 *                       type: number
 *                     durationEstimate:
 *                       type: number
 *                     weatherStats:
 *                       type: object
 *                     segments:
 *                       type: array
 *                       items:
 *                         type: object
 *                     assessment:
 *                       type: object
 *       400:
 *         description: Paramètres invalides
 *       404:
 *         description: Itinéraire non trouvé
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /api/route-weather/best-time-slots/{routeId}:
 *   get:
 *     summary: Trouve les meilleurs créneaux météo pour un itinéraire
 *     description: Analyse les conditions météo et suggère les meilleurs moments pour emprunter un itinéraire
 *     tags: [Météo des Itinéraires]
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
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Date de début de la recherche
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Date de fin de la recherche
 *       - in: query
 *         name: duration
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Durée des créneaux en heures
 *       - in: query
 *         name: onlyDaytime
 *         schema:
 *           type: boolean
 *         description: Limite la recherche aux heures de jour
 *       - in: query
 *         name: activityType
 *         schema:
 *           type: string
 *           enum: [cycling, running]
 *         description: Type d'activité
 *     responses:
 *       200:
 *         description: Meilleurs créneaux météo trouvés avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     routeId:
 *                       type: string
 *                     routeName:
 *                       type: string
 *                     requestTime:
 *                       type: string
 *                     searchPeriod:
 *                       type: object
 *                     bestTimeSlots:
 *                       type: array
 *                       items:
 *                         type: object
 *                     allTimeSlots:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         description: Paramètres invalides
 *       404:
 *         description: Itinéraire non trouvé
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /api/route-weather/recommendations:
 *   get:
 *     summary: Recommande des itinéraires en fonction des conditions météo
 *     description: Suggère des itinéraires adaptés aux conditions météo actuelles
 *     tags: [Météo des Itinéraires]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *         description: Latitude du point de départ
 *       - in: query
 *         name: lon
 *         schema:
 *           type: number
 *         description: Longitude du point de départ
 *       - in: query
 *         name: maxDistance
 *         schema:
 *           type: integer
 *         description: Distance maximale en km
 *       - in: query
 *         name: maxResults
 *         schema:
 *           type: integer
 *         description: Nombre maximal de résultats
 *       - in: query
 *         name: activityType
 *         schema:
 *           type: string
 *           enum: [cycling, running]
 *         description: Type d'activité
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: number
 *         description: Note minimale des itinéraires (0-5)
 *     responses:
 *       200:
 *         description: Recommandations d'itinéraires générées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                     location:
 *                       type: object
 *                     requestTime:
 *                       type: string
 *                     weatherConditions:
 *                       type: object
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         description: Paramètres invalides
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /api/route-weather/alerts/setup:
 *   post:
 *     summary: Configure des alertes météo pour les itinéraires favoris
 *     description: Définit les paramètres d'alerte météo pour les itinéraires favoris d'un utilisateur
 *     tags: [Météo des Itinéraires]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enabled:
 *                 type: boolean
 *               alertBefore:
 *                 type: integer
 *                 description: Heures avant le départ prévu
 *               favoriteRouteIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               precipitationThreshold:
 *                 type: integer
 *                 description: Seuil de probabilité de précipitation en %
 *               windThreshold:
 *                 type: integer
 *                 description: Seuil de vitesse du vent en km/h
 *               temperatureRange:
 *                 type: object
 *                 properties:
 *                   min:
 *                     type: number
 *                   max:
 *                     type: number
 *               notificationChannels:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [app, email, sms]
 *               alertFrequency:
 *                 type: string
 *                 enum: [once, daily]
 *     responses:
 *       200:
 *         description: Alertes configurées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                     alertConfig:
 *                       type: object
 *                     routeCount:
 *                       type: integer
 *                     status:
 *                       type: string
 *       400:
 *         description: Paramètres invalides
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /api/route-weather/alerts/status:
 *   get:
 *     summary: Obtient l'état actuel des alertes météo
 *     description: Récupère les informations sur les alertes météo configurées pour l'utilisateur
 *     tags: [Météo des Itinéraires]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statut des alertes récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [active, paused, not_configured]
 *                     subscription:
 *                       type: object
 *                     alerts:
 *                       type: array
 *                       items:
 *                         type: object
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /api/route-weather/map-visualization:
 *   get:
 *     summary: Génère des données pour la visualisation météo sur une carte
 *     description: Fournit des données formatées pour afficher les conditions météo sur une carte
 *     tags: [Météo des Itinéraires]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: south
 *         required: true
 *         schema:
 *           type: number
 *         description: Latitude sud de la zone
 *       - in: query
 *         name: west
 *         required: true
 *         schema:
 *           type: number
 *         description: Longitude ouest de la zone
 *       - in: query
 *         name: north
 *         required: true
 *         schema:
 *           type: number
 *         description: Latitude nord de la zone
 *       - in: query
 *         name: east
 *         required: true
 *         schema:
 *           type: number
 *         description: Longitude est de la zone
 *       - in: query
 *         name: resolution
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *         description: Résolution de la grille météo
 *       - in: query
 *         name: layers
 *         schema:
 *           type: string
 *         description: Couches météo à inclure (séparées par des virgules)
 *       - in: query
 *         name: forecastTime
 *         schema:
 *           type: integer
 *         description: Timestamp Unix pour les prévisions
 *     responses:
 *       200:
 *         description: Données de visualisation générées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     bounds:
 *                       type: object
 *                     timestamp:
 *                       type: string
 *                     forecastTime:
 *                       type: string
 *                     gridSize:
 *                       type: object
 *                     layers:
 *                       type: object
 *       400:
 *         description: Paramètres invalides
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * tags:
 *   name: Préférences Météo
 *   description: API pour la gestion des préférences météo des utilisateurs
 */

/**
 * @swagger
 * /api/weather-preferences/preferences:
 *   get:
 *     summary: Récupère les préférences météo d'un utilisateur
 *     description: Obtient les préférences de notification et seuils d'alerte météo de l'utilisateur
 *     tags: [Préférences Météo]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Préférences récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                     alertEnabled:
 *                       type: boolean
 *                     notificationChannels:
 *                       type: object
 *                     thresholds:
 *                       type: object
 *                     favoriteRoutes:
 *                       type: object
 *       500:
 *         description: Erreur serveur
 * 
 *   put:
 *     summary: Met à jour les préférences météo d'un utilisateur
 *     description: Modifie les préférences de notification et seuils d'alerte météo
 *     tags: [Préférences Météo]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               alertEnabled:
 *                 type: boolean
 *               notificationChannels:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: boolean
 *                   push:
 *                     type: boolean
 *                   sms:
 *                     type: boolean
 *               thresholds:
 *                 type: object
 *                 properties:
 *                   temperature:
 *                     type: object
 *                     properties:
 *                       min:
 *                         type: number
 *                       max:
 *                         type: number
 *                       enabled:
 *                         type: boolean
 *                   precipitation:
 *                     type: object
 *                     properties:
 *                       probability:
 *                         type: number
 *                       intensity:
 *                         type: number
 *                       enabled:
 *                         type: boolean
 *                   wind:
 *                     type: object
 *                     properties:
 *                       speed:
 *                         type: number
 *                       enabled:
 *                         type: boolean
 *                   visibility:
 *                     type: object
 *                     properties:
 *                       distance:
 *                         type: number
 *                       enabled:
 *                         type: boolean
 *               favoriteRoutes:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                   alertBefore:
 *                     type: number
 *                   routeIds:
 *                     type: array
 *                     items:
 *                       type: string
 *                   alertFrequency:
 *                     type: string
 *                     enum: [once, daily]
 *     responses:
 *       200:
 *         description: Préférences mises à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *       400:
 *         description: Paramètres invalides
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /api/weather-preferences/favorite-routes-alerts:
 *   post:
 *     summary: Configure les alertes pour les itinéraires favoris
 *     description: Paramètre les alertes météo spécifiquement pour les itinéraires favoris
 *     tags: [Préférences Météo]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               routeIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               alertEnabled:
 *                 type: boolean
 *               alertBefore:
 *                 type: number
 *               alertFrequency:
 *                 type: string
 *                 enum: [once, daily]
 *     responses:
 *       200:
 *         description: Alertes pour itinéraires favoris configurées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *       400:
 *         description: Paramètres invalides
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /api/weather-preferences/disable-alerts:
 *   post:
 *     summary: Désactive toutes les alertes météo
 *     description: Désactive temporairement toutes les alertes météo pour l'utilisateur
 *     tags: [Préférences Météo]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Alertes désactivées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *       500:
 *         description: Erreur serveur
 */
