/**
 * Exemples pour la documentation OpenAPI/Swagger
 * Ce fichier contient les définitions et exemples pour les différentes API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - id
 *         - email
 *         - name
 *       properties:
 *         id:
 *           type: string
 *           description: ID unique de l'utilisateur
 *         email:
 *           type: string
 *           format: email
 *           description: Email de l'utilisateur
 *         name:
 *           type: string
 *           description: Nom de l'utilisateur
 *         gender:
 *           type: string
 *           enum: [male, female, other]
 *           description: Genre de l'utilisateur
 *         weight:
 *           type: number
 *           description: Poids en kg
 *         height:
 *           type: number
 *           description: Taille en cm
 *         ftp:
 *           type: number
 *           description: FTP (Functional Threshold Power) en watts
 *       example:
 *         id: "user123"
 *         email: "cycliste@example.com"
 *         name: "Jean Cycliste"
 *         gender: "male"
 *         weight: 75
 *         height: 180
 *         ftp: 280
 *
 *     TrainingZones:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           description: ID de l'utilisateur
 *         ftp:
 *           type: number
 *           description: FTP utilisé pour le calcul
 *         weight:
 *           type: number
 *           description: Poids utilisé pour le calcul
 *         gender:
 *           type: string
 *           enum: [male, female, other]
 *           description: Genre utilisé pour le calcul
 *         powerZones:
 *           type: object
 *           properties:
 *             z1:
 *               type: object
 *               properties:
 *                 min: 
 *                   type: number
 *                 max: 
 *                   type: number
 *             z2:
 *               type: object
 *               properties:
 *                 min: 
 *                   type: number
 *                 max: 
 *                   type: number
 *             z3:
 *               type: object
 *               properties:
 *                 min: 
 *                   type: number
 *                 max: 
 *                   type: number
 *             z4:
 *               type: object
 *               properties:
 *                 min: 
 *                   type: number
 *                 max: 
 *                   type: number
 *             z5:
 *               type: object
 *               properties:
 *                 min: 
 *                   type: number
 *                 max: 
 *                   type: number
 *             z6:
 *               type: object
 *               properties:
 *                 min: 
 *                   type: number
 *                 max: 
 *                   type: number
 *             z7:
 *               type: object
 *               properties:
 *                 min: 
 *                   type: number
 *                 max: 
 *                   type: number
 *         hrZones:
 *           type: object
 *           properties:
 *             z1:
 *               type: object
 *               properties:
 *                 min: 
 *                   type: number
 *                 max: 
 *                   type: number
 *             z2:
 *               type: object
 *               properties:
 *                 min: 
 *                   type: number
 *                 max: 
 *                   type: number
 *             z3:
 *               type: object
 *               properties:
 *                 min: 
 *                   type: number
 *                 max: 
 *                   type: number
 *             z4:
 *               type: object
 *               properties:
 *                 min: 
 *                   type: number
 *                 max: 
 *                   type: number
 *             z5:
 *               type: object
 *               properties:
 *                 min: 
 *                   type: number
 *                 max: 
 *                   type: number
 *         powerToWeight:
 *           type: object
 *           properties:
 *             threshold:
 *               type: number
 *             zones:
 *               type: object
 *       example:
 *         userId: "user123"
 *         ftp: 280
 *         weight: 75
 *         gender: "male"
 *         powerZones:
 *           z1: { min: 0, max: 168 }
 *           z2: { min: 169, max: 224 }
 *           z3: { min: 225, max: 252 }
 *           z4: { min: 253, max: 280 }
 *           z5: { min: 281, max: 308 }
 *           z6: { min: 309, max: 364 }
 *           z7: { min: 365, max: 500 }
 *         hrZones:
 *           z1: { min: 0, max: 124 }
 *           z2: { min: 125, max: 149 }
 *           z3: { min: 150, max: 162 }
 *           z4: { min: 163, max: 174 }
 *           z5: { min: 175, max: 200 }
 *         powerToWeight:
 *           threshold: 3.73
 *           zones:
 *             z1: { min: 0, max: 2.24 }
 *             z2: { min: 2.25, max: 2.99 }
 *             z3: { min: 3.0, max: 3.36 }
 *             z4: { min: 3.37, max: 3.73 }
 *             z5: { min: 3.74, max: 4.11 }
 *             z6: { min: 4.12, max: 4.85 }
 *             z7: { min: 4.86, max: 8.0 }
 *
 *     FtpEstimate:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           description: ID de l'utilisateur
 *         estimatedFtp:
 *           type: number
 *           description: FTP estimé en watts
 *         confidence:
 *           type: string
 *           enum: [low, medium, high]
 *           description: Niveau de confiance dans l'estimation
 *         dataPoints:
 *           type: integer
 *           description: Nombre de points de données utilisés pour l'estimation
 *         method:
 *           type: string
 *           description: Méthode utilisée pour l'estimation
 *         recommendations:
 *           type: array
 *           items:
 *             type: string
 *       example:
 *         userId: "user123"
 *         estimatedFtp: 285
 *         confidence: "medium"
 *         dataPoints: 12
 *         method: "best_efforts"
 *         recommendations: [
 *           "Effectuer un test FTP structuré pour une mesure plus précise",
 *           "Augmenter les entraînements en zone 4 pour améliorer votre FTP"
 *         ]
 *
 *     Activity:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID de l'activité
 *         userId:
 *           type: string
 *           description: ID de l'utilisateur
 *         type:
 *           type: string
 *           description: Type d'activité (vélo de route, VTT, etc.)
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: Date et heure de début de l'activité
 *         duration:
 *           type: number
 *           description: Durée en secondes
 *         distance:
 *           type: number
 *           description: Distance en mètres
 *         elevationGain:
 *           type: number
 *           description: Dénivelé positif en mètres
 *         averagePower:
 *           type: number
 *           description: Puissance moyenne en watts
 *         normalizedPower:
 *           type: number
 *           description: Puissance normalisée en watts
 *         maxPower:
 *           type: number
 *           description: Puissance maximale en watts
 *         averageHeartRate:
 *           type: number
 *           description: Fréquence cardiaque moyenne en bpm
 *         maxHeartRate:
 *           type: number
 *           description: Fréquence cardiaque maximale en bpm
 *         bestEfforts:
 *           type: object
 *           properties:
 *             fiveSeconds:
 *               type: number
 *             oneMinute:
 *               type: number
 *             fiveMinutes:
 *               type: number
 *             twentyMinutes:
 *               type: number
 *             oneHour:
 *               type: number
 *       example:
 *         id: "activity123"
 *         userId: "user123"
 *         type: "road"
 *         startDate: "2025-04-03T10:00:00Z"
 *         duration: 5400
 *         distance: 40000
 *         elevationGain: 450
 *         averagePower: 220
 *         normalizedPower: 238
 *         maxPower: 850
 *         averageHeartRate: 145
 *         maxHeartRate: 175
 *         bestEfforts:
 *           fiveSeconds: 800
 *           oneMinute: 450
 *           fiveMinutes: 300
 *           twentyMinutes: 270
 *           oneHour: 250
 *
 *     TrainingProgram:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID du programme
 *         userId:
 *           type: string
 *           description: ID de l'utilisateur
 *         name:
 *           type: string
 *           description: Nom du programme
 *         objective:
 *           type: string
 *           description: Objectif du programme
 *         startDate:
 *           type: string
 *           format: date
 *           description: Date de début du programme
 *         endDate:
 *           type: string
 *           format: date
 *           description: Date de fin du programme
 *         weeks:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               weekNumber:
 *                 type: integer
 *               workouts:
 *                 type: array
 *                 items:
 *                   type: object
 *       example:
 *         id: "program123"
 *         userId: "user123"
 *         name: "Préparation Grand Fondo"
 *         objective: "Amélioration endurance"
 *         startDate: "2025-04-10"
 *         endDate: "2025-06-10"
 *         weeks: [
 *           {
 *             weekNumber: 1,
 *             workouts: [
 *               {
 *                 id: "workout1",
 *                 day: "Lundi",
 *                 name: "Récupération active",
 *                 type: "Récupération",
 *                 duration: 60,
 *                 description: "Sortie facile de récupération"
 *               },
 *               {
 *                 id: "workout2",
 *                 day: "Mercredi",
 *                 name: "Intervalles 4x5min",
 *                 type: "Intervalles",
 *                 duration: 90,
 *                 description: "Échauffement 15min, puis 4 x 5min en zone 4 avec 5min de récupération, retour au calme 15min"
 *               }
 *             ]
 *           }
 *         ]
 *
 *     EnvironmentalData:
 *       type: object
 *       properties:
 *         location:
 *           type: object
 *           properties:
 *             lat:
 *               type: number
 *               description: Latitude
 *             lng:
 *               type: number
 *               description: Longitude
 *             region:
 *               type: string
 *               description: Région européenne
 *         airQuality:
 *           type: object
 *           properties:
 *             aqi:
 *               type: number
 *               description: Indice de qualité de l'air (1-5)
 *             qualityLabel:
 *               type: string
 *               description: Label de qualité de l'air
 *             pollutants:
 *               type: object
 *         windForecast:
 *           type: object
 *           properties:
 *             current:
 *               type: object
 *               properties:
 *                 speed:
 *                   type: number
 *                   description: Vitesse du vent en m/s
 *                 direction:
 *                   type: number
 *                   description: Direction du vent en degrés
 *             forecast:
 *               type: array
 *               items:
 *                 type: object
 *         recommendations:
 *           type: object
 *           properties:
 *             overall:
 *               type: string
 *             warnings:
 *               type: array
 *               items:
 *                 type: string
 *             equipment:
 *               type: array
 *               items:
 *                 type: string
 *             rideCondition:
 *               type: string
 *               enum: [Excellente, Bonne, Acceptable, Difficile, Déconseillée]
 *       example:
 *         location:
 *           lat: 48.5734
 *           lng: 7.7521
 *           region: "Western Europe"
 *         airQuality:
 *           aqi: 2
 *           qualityLabel: "Bonne"
 *           pollutants:
 *             pm25: 8.2
 *             pm10: 12.5
 *             o3: 68.3
 *             no2: 15.2
 *         windForecast:
 *           current:
 *             speed: 3.5
 *             direction: 270
 *             gust: 5.2
 *           forecast: [
 *             {
 *               timestamp: "2025-04-04T12:00:00Z",
 *               speed: 4.1,
 *               direction: 285,
 *               gust: 7.0
 *             }
 *           ]
 *         recommendations:
 *           overall: "Qualité de l'air: Bonne. Vent: 12.6 km/h"
 *           warnings: ["Rafales de vent possibles dans l'après-midi"]
 *           equipment: ["Vêtements coupe-vent recommandés"]
 *           rideCondition: "Bonne"
 *
 *     ApiMetrics:
 *       type: object
 *       properties:
 *         totalCalls:
 *           type: integer
 *           description: Nombre total d'appels API
 *         successfulCalls:
 *           type: integer
 *           description: Nombre d'appels API réussis
 *         failedCalls:
 *           type: integer
 *           description: Nombre d'appels API échoués
 *         avgResponseTime:
 *           type: number
 *           description: Temps de réponse moyen en ms
 *         successRate:
 *           type: number
 *           description: Taux de réussite en pourcentage
 *         apiUsage:
 *           type: object
 *           additionalProperties:
 *             type: object
 *       example:
 *         totalCalls: 1250
 *         successfulCalls: 1200
 *         failedCalls: 50
 *         avgResponseTime: 235.8
 *         successRate: 96
 *         apiUsage:
 *           weather:
 *             totalCalls: 500
 *             successfulCalls: 485
 *             failedCalls: 15
 *             avgResponseTime: 310.2
 *           openroute:
 *             totalCalls: 350
 *             successfulCalls: 342
 *             failedCalls: 8
 *             avgResponseTime: 198.5
 */

/**
 * @swagger
 * tags:
 *   - name: Training
 *     description: API pour les fonctionnalités d'entraînement
 *   - name: Environmental
 *     description: API pour les données environnementales
 *   - name: Metrics
 *     description: API pour le monitoring et les métriques
 */

/**
 * @swagger
 * /api/training/users/{userId}/zones:
 *   get:
 *     summary: Récupère les zones d'entraînement d'un utilisateur
 *     tags: [Training]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *       - in: query
 *         name: ftp
 *         schema:
 *           type: number
 *         description: FTP personnalisé (optionnel)
 *       - in: query
 *         name: weight
 *         schema:
 *           type: number
 *         description: Poids personnalisé en kg (optionnel)
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *           enum: [male, female, other]
 *         description: Genre (optionnel)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Zones d'entraînement calculées
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TrainingZones'
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Utilisateur non trouvé
 */

/**
 * @swagger
 * /api/training/users/{userId}/ftp/estimate:
 *   post:
 *     summary: Estime le FTP à partir des activités récentes
 *     tags: [Training]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               activityIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Liste d'IDs d'activités à utiliser (optionnel)
 *               timePeriod:
 *                 type: string
 *                 enum: [1week, 4weeks, 3months, 6months]
 *                 description: Période de temps pour les activités (optionnel)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: FTP estimé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FtpEstimate'
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Utilisateur non trouvé
 */

/**
 * @swagger
 * /api/environmental/location:
 *   get:
 *     summary: Récupère les données environnementales pour une localisation
 *     tags: [Environmental]
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *         description: Latitude
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *         description: Longitude
 *     responses:
 *       200:
 *         description: Données environnementales
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EnvironmentalData'
 *       400:
 *         description: Paramètres invalides
 */

/**
 * @swagger
 * /api/metrics/status:
 *   get:
 *     summary: Récupère les statistiques globales des API
 *     tags: [Metrics]
 *     responses:
 *       200:
 *         description: Statistiques d'API
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiMetrics'
 */
