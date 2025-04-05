/**
 * Documentation des API du système de défi des cols
 * @module docs/col-challenge-api
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ColProgress:
 *       type: object
 *       properties:
 *         colId:
 *           type: string
 *           description: Identifiant unique du col
 *         colName:
 *           type: string
 *           description: Nom du col
 *         completed:
 *           type: boolean
 *           description: Indique si le col a été complété
 *         completionDate:
 *           type: string
 *           format: date-time
 *           description: Date à laquelle le col a été complété
 *         efforts:
 *           type: array
 *           description: Liste des efforts effectués sur ce col
 *           items:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date-time
 *               duration:
 *                 type: number
 *                 description: Durée en secondes
 *               avgSpeed:
 *                 type: number
 *                 description: Vitesse moyenne en km/h
 *               maxSpeed:
 *                 type: number
 *                 description: Vitesse maximale en km/h
 *               avgPower:
 *                 type: number
 *                 description: Puissance moyenne en watts
 *               maxPower:
 *                 type: number
 *                 description: Puissance maximale en watts
 *               avgHeartRate:
 *                 type: number
 *                 description: Fréquence cardiaque moyenne en bpm
 *               maxHeartRate:
 *                 type: number
 *                 description: Fréquence cardiaque maximale en bpm
 *               elevationGain:
 *                 type: number
 *                 description: Dénivelé positif en mètres
 *               route:
 *                 type: string
 *                 description: ID de l'itinéraire utilisé
 *               fileId:
 *                 type: string
 *                 description: ID du fichier d'activité
 *               weather:
 *                 type: object
 *                 properties:
 *                   temperature:
 *                     type: number
 *                     description: Température en degrés Celsius
 *                   condition:
 *                     type: string
 *                     description: Condition météo (ex: ensoleillé, nuageux, etc.)
 *                   windSpeed:
 *                     type: number
 *                     description: Vitesse du vent en km/h
 *                   windDirection:
 *                     type: number
 *                     description: Direction du vent en degrés
 *         personalBest:
 *           type: object
 *           description: Record personnel sur ce col
 *           properties:
 *             date:
 *               type: string
 *               format: date-time
 *             duration:
 *               type: number
 *               description: Durée en secondes
 *             avgSpeed:
 *               type: number
 *               description: Vitesse moyenne en km/h
 *             segments:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   duration:
 *                     type: number
 *                   avgSpeed:
 *                     type: number
 *                   avgPower:
 *                     type: number
 *                   maxPower:
 *                     type: number
 *         notes:
 *           type: string
 *           description: Notes personnelles sur ce col
 *         favorite:
 *           type: boolean
 *           description: Indique si c'est un col favori
 * 
 *     Badge:
 *       type: object
 *       properties:
 *         badgeId:
 *           type: string
 *           description: Identifiant unique du badge
 *         name:
 *           type: string
 *           description: Nom du badge
 *         description:
 *           type: string
 *           description: Description détaillée du badge
 *         imageUrl:
 *           type: string
 *           description: URL de l'image du badge
 *         earnedDate:
 *           type: string
 *           format: date-time
 *           description: Date à laquelle le badge a été obtenu
 *         criteria:
 *           type: string
 *           description: Critères pour obtenir ce badge
 *         rarity:
 *           type: string
 *           description: Rareté du badge (commun, rare, épique, etc.)
 *         pointsValue:
 *           type: number
 *           description: Valeur en points du badge
 * 
 *     ColChallenge:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           description: ID de l'utilisateur
 *         challengeId:
 *           type: string
 *           description: ID du défi
 *         challengeName:
 *           type: string
 *           description: Nom du défi
 *         description:
 *           type: string
 *           description: Description du défi
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: Date de début du défi
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: Date de fin du défi (si applicable)
 *         status:
 *           type: string
 *           enum: [not_started, in_progress, completed, abandoned]
 *           description: Statut actuel du défi
 *         progress:
 *           type: number
 *           description: Pourcentage de progression (0-100)
 *         completionCertificateUrl:
 *           type: string
 *           description: URL du certificat d'achèvement
 *         completionDate:
 *           type: string
 *           format: date-time
 *           description: Date d'achèvement du défi
 *         cols:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ColProgress'
 *         badges:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Badge'
 *         totalDistance:
 *           type: number
 *           description: Distance totale parcourue en km
 *         totalElevationGain:
 *           type: number
 *           description: Dénivelé total positif en mètres
 *         sharedOnSocialMedia:
 *           type: array
 *           description: Historique des partages sur les réseaux sociaux
 *           items:
 *             type: object
 *             properties:
 *               platform:
 *                 type: string
 *                 description: Plateforme de médias sociaux (Facebook, Twitter, etc.)
 *               shareDate:
 *                 type: string
 *                 format: date-time
 *               shareUrl:
 *                 type: string
 *                 description: URL du partage
 * 
 *     LeaderboardEntry:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *         userName:
 *           type: string
 *         userAvatar:
 *           type: string
 *         completionDate:
 *           type: string
 *           format: date-time
 *         totalTime:
 *           type: number
 *           description: Temps total en secondes
 *         totalPoints:
 *           type: number
 *         colsCompleted:
 *           type: number
 *         fastestCol:
 *           type: object
 *           properties:
 *             colId:
 *               type: string
 *             colName:
 *               type: string
 *             time:
 *               type: number
 *               description: Temps en secondes
 *         badges:
 *           type: array
 *           items:
 *             type: string
 *         rank:
 *           type: number
 * 
 *     Leaderboard:
 *       type: object
 *       properties:
 *         challengeId:
 *           type: string
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         entries:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/LeaderboardEntry'
 * 
 *     ColDetail:
 *       type: object
 *       properties:
 *         colId:
 *           type: string
 *         name:
 *           type: string
 *         altitude:
 *           type: number
 *           description: Altitude en mètres
 *         location:
 *           type: object
 *           properties:
 *             lat:
 *               type: number
 *             lon:
 *               type: number
 *         description:
 *           type: string
 *         difficulty:
 *           type: string
 *         length:
 *           type: number
 *           description: Longueur en km
 *         avgGradient:
 *           type: number
 *           description: Gradient moyen en pourcentage
 *         maxGradient:
 *           type: number
 *           description: Gradient maximum en pourcentage
 *         imageUrl:
 *           type: string
 *         sides:
 *           type: array
 *           description: Différents versants du col
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               difficulty:
 *                 type: string
 *               length:
 *                 type: number
 *               avgGradient:
 *                 type: number
 *               maxGradient:
 *                 type: number
 *               startAltitude:
 *                 type: number
 *         pointsOfInterest:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               lat:
 *                 type: number
 *               lon:
 *                 type: number
 *         bestSeasons:
 *           type: array
 *           items:
 *             type: string
 * 
 *     ChallengeStatistics:
 *       type: object
 *       properties:
 *         totalParticipants:
 *           type: number
 *         completionRate:
 *           type: number
 *           description: Pourcentage de complétion parmi les participants
 *         averageCompletionTime:
 *           type: number
 *           description: Temps moyen en jours
 *         mostPopularCol:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *             completionCount:
 *               type: number
 *         hardestCol:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *             completionRate:
 *               type: number
 *             averageTime:
 *               type: number
 *         recentCompletions:
 *           type: number
 *           description: Nombre de complétions dans les dernières 24h
 *         badgesAwarded:
 *           type: number
 *         topPerformers:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               userName:
 *                 type: string
 *               completionTime:
 *                 type: number
 *               colsCompleted:
 *                 type: number
 * 
 *     AvailableChallenge:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         difficulty:
 *           type: string
 *         colsCount:
 *           type: number
 *         estimatedCompletionTime:
 *           type: string
 *         thumbnail:
 *           type: string
 *         badges:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Badge'
 *         cols:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               name:
 *                 type: string
 *               altitude:
 *                 type: number
 *               difficulty:
 *                 type: string
 */

/**
 * @swagger
 * tags:
 *   name: ColChallenges
 *   description: API pour la gestion des défis des cols
 */

/**
 * @swagger
 * /api/col-challenges/available:
 *   get:
 *     summary: Récupère la liste des défis disponibles
 *     tags: [ColChallenges]
 *     description: Retourne la liste des défis de cols disponibles avec leurs détails
 *     responses:
 *       200:
 *         description: Liste des défis récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AvailableChallenge'
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /api/col-challenges/user/{userId}:
 *   get:
 *     summary: Récupère tous les défis d'un utilisateur
 *     tags: [ColChallenges]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Défis récupérés avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ColChallenge'
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès refusé
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /api/col-challenges/{challengeId}/user/{userId}:
 *   get:
 *     summary: Récupère un défi spécifique pour un utilisateur
 *     tags: [ColChallenges]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: challengeId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID du défi
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Défi récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/ColChallenge'
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Défi non trouvé
 *       500:
 *         description: Erreur serveur
 *   post:
 *     summary: Crée ou met à jour un défi pour un utilisateur
 *     tags: [ColChallenges]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: challengeId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID du défi
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de l'utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ColChallenge'
 *     responses:
 *       200:
 *         description: Défi créé ou mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/ColChallenge'
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès refusé
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /api/col-challenges/{challengeId}/user/{userId}/col/{colId}:
 *   put:
 *     summary: Met à jour la progression d'un col dans un défi
 *     tags: [ColChallenges]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: challengeId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID du défi
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de l'utilisateur
 *       - in: path
 *         name: colId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID du col
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ColProgress'
 *     responses:
 *       200:
 *         description: Progression du col mise à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/ColChallenge'
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Défi ou col non trouvé
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /api/col-challenges/{challengeId}/user/{userId}/col/{colId}/effort:
 *   post:
 *     summary: Ajoute un nouvel effort pour un col
 *     tags: [ColChallenges]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: challengeId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID du défi
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de l'utilisateur
 *       - in: path
 *         name: colId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID du col
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date-time
 *               duration:
 *                 type: number
 *               avgSpeed:
 *                 type: number
 *               maxSpeed:
 *                 type: number
 *               avgPower:
 *                 type: number
 *               maxPower:
 *                 type: number
 *               avgHeartRate:
 *                 type: number
 *               maxHeartRate:
 *                 type: number
 *               elevationGain:
 *                 type: number
 *               route:
 *                 type: string
 *               fileId:
 *                 type: string
 *               weather:
 *                 type: object
 *                 properties:
 *                   temperature:
 *                     type: number
 *                   condition:
 *                     type: string
 *                   windSpeed:
 *                     type: number
 *                   windDirection:
 *                     type: number
 *     responses:
 *       200:
 *         description: Effort ajouté avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/ColChallenge'
 *                 message:
 *                   type: string
 *                   example: Nouvel effort ajouté avec succès
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Défi ou col non trouvé
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /api/col-challenges/{challengeId}/leaderboard:
 *   get:
 *     summary: Récupère le classement pour un défi
 *     tags: [ColChallenges]
 *     parameters:
 *       - in: path
 *         name: challengeId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID du défi
 *     responses:
 *       200:
 *         description: Classement récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Leaderboard'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /api/col-challenges/{challengeId}/col/{colId}/details:
 *   get:
 *     summary: Récupère les détails d'un col
 *     tags: [ColChallenges]
 *     parameters:
 *       - in: path
 *         name: challengeId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID du défi
 *       - in: path
 *         name: colId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID du col
 *     responses:
 *       200:
 *         description: Détails du col récupérés avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/ColDetail'
 *       404:
 *         description: Col non trouvé
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /api/col-challenges/badge/{badgeId}:
 *   get:
 *     summary: Récupère les détails d'un badge
 *     tags: [ColChallenges]
 *     parameters:
 *       - in: path
 *         name: badgeId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID du badge
 *     responses:
 *       200:
 *         description: Détails du badge récupérés avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Badge'
 *       404:
 *         description: Badge non trouvé
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /api/col-challenges/{challengeId}/statistics:
 *   get:
 *     summary: Récupère les statistiques d'un défi
 *     tags: [ColChallenges]
 *     parameters:
 *       - in: path
 *         name: challengeId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID du défi
 *     responses:
 *       200:
 *         description: Statistiques récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/ChallengeStatistics'
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /api/col-challenges/{challengeId}/user/{userId}/share:
 *   post:
 *     summary: Partage un défi sur les réseaux sociaux
 *     tags: [ColChallenges]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: challengeId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID du défi
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de l'utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               platform:
 *                 type: string
 *                 example: Twitter
 *               shareUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Défi partagé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                     message:
 *                       type: string
 *                     shareUrl:
 *                       type: string
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Défi non trouvé
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /api/col-challenges/{challengeId}/user/{userId}/certificate:
 *   get:
 *     summary: Récupère le certificat d'achèvement d'un défi
 *     tags: [ColChallenges]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: challengeId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID du défi
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Certificat récupéré avec succès
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       400:
 *         description: Le défi n'est pas encore complété
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Défi non trouvé
 *       500:
 *         description: Erreur serveur
 */
