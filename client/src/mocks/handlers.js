/**
 * Handlers MSW
 * 
 * Ces handlers interceptent les requêtes API en mode développement et renvoient des réponses mockées.
 * Ils permettent de développer sans dépendre d'un backend fonctionnel.
 * 
 * Structure organisée par catégorie fonctionnelle:
 * 1. Authentification et Utilisateurs
 * 2. Cols et Météo
 * 3. Activités
 * 4. Défis 7 Majeurs
 * 5. Entraînement et Nutrition
 * 6. Strava et Intégrations
 * 7. Forum et Communauté
 * 8. Recherche et Divers
 */

import { http } from 'msw';
import mockData from './mockData';
import { tokenStore, validateAuth, handleError, authorizeResource, AUTH_ERROR } from './auth-utils';

// Utiliser la même base URL que apiConfig.ts
const baseUrl = process.env.REACT_APP_API_URL || '/api';

export const handlers = [
  // #region 1. AUTHENTIFICATION ET UTILISATEURS
  
  // Login
  http.post(`${baseUrl}/auth/login`, (req, res, ctx) => {
    const { email, password } = req.body;
    
    // Vérification simplifiée des identifiants
    const user = mockData.users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      return handleError(res, ctx, AUTH_ERROR.INVALID_CREDENTIALS);
    }
    
    // Générer un token et l'enregistrer
    const token = tokenStore.generateToken(user.id);
    const refreshToken = tokenStore.generateToken(user.id, 'refresh');
    
    // Enregistrer le token
    tokenStore.setToken(user.id, token);
    
    return res(
      ctx.status(200),
      ctx.json({
        token,
        refreshToken,
        user: {
          ...user,
          password: undefined // Ne jamais renvoyer le mot de passe
        }
      })
    );
  }),
  
  // Register
  http.post(`${baseUrl}/auth/register`, (req, res, ctx) => {
    const userData = req.body;
    
    // Vérifier si l'email existe déjà
    if (mockData.users.some(user => user.email === userData.email)) {
      return res(
        ctx.status(409),
        ctx.json({ 
          message: "Cet email est déjà utilisé",
          code: "EMAIL_EXISTS",
          timestamp: new Date().toISOString()
        })
      );
    }
    
    // Créer un nouvel utilisateur
    const newUser = {
      id: `user-${Date.now()}`,
      username: userData.username,
      email: userData.email,
      registeredAt: new Date().toISOString(),
      role: "user",
      stats: {
        totalAscents: 0,
        totalDistance: 0,
        totalElevation: 0,
        achievements: [],
        level: 1,
        pointsEarned: 0
      },
      preferences: {
        measurementUnit: "metric",
        theme: "light",
        emailNotifications: true,
        privacySettings: {
          profileVisibility: "public",
          activityVisibility: "friends",
          showRealName: true,
          showLocation: true
        },
        language: "fr-FR"
      }
    };
    
    // Générer des tokens pour le nouvel utilisateur
    const token = tokenStore.generateToken(newUser.id);
    const refreshToken = tokenStore.generateToken(newUser.id, 'refresh');
    
    // Enregistrer le token
    tokenStore.setToken(newUser.id, token);
    
    return res(
      ctx.status(201),
      ctx.json({
        token,
        refreshToken,
        user: newUser
      })
    );
  }),
  
  // Refresh token
  http.post(`${baseUrl}/auth/refresh`, (req, res, ctx) => {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return handleError(res, ctx, AUTH_ERROR.UNAUTHORIZED);
    }
    
    // Extraire l'ID utilisateur du token et vérifier sa validité
    const userId = tokenStore.extractUserId(refreshToken);
    
    if (!userId) {
      return handleError(res, ctx, AUTH_ERROR.INVALID_CREDENTIALS);
    }
    
    // Générer un nouveau token
    const newToken = tokenStore.generateToken(userId);
    
    // Enregistrer le nouveau token
    tokenStore.setToken(userId, newToken);
    
    return res(
      ctx.status(200),
      ctx.json({
        token: newToken
      })
    );
  }),
  
  // Logout
  http.post(`${baseUrl}/auth/logout`, (req, res, ctx) => {
    // Valider l'authentification
    const auth = validateAuth(req);
    
    if (auth.isValid) {
      // Invalider le token
      tokenStore.invalidate(auth.userId);
    }
    
    return res(
      ctx.status(200),
      ctx.json({ 
        success: true,
        message: "Déconnecté avec succès"
      })
    );
  }),
  
  // Récupérer un profil utilisateur
  http.get(`${baseUrl}/users/:userId/profile`, (req, res, ctx) => {
    const { userId } = req.params;
    
    // Valider que l'utilisateur a accès à ce profil
    const auth = authorizeResource(req, userId);
    
    if (!auth.isValid) {
      return handleError(res, ctx, auth.error);
    }
    
    const user = mockData.users.find(user => user.id === userId);
    
    if (!user) {
      return res(
        ctx.status(404),
        ctx.json({ 
          message: 'Utilisateur non trouvé',
          code: 'USER_NOT_FOUND',
          timestamp: new Date().toISOString()
        })
      );
    }
    
    return res(
      ctx.status(200),
      ctx.json({
        ...user,
        password: undefined // Ne jamais renvoyer le mot de passe
      })
    );
  }),
  
  // Mettre à jour un profil utilisateur
  http.patch(`${baseUrl}/users/:userId/profile`, (req, res, ctx) => {
    const { userId } = req.params;
    const updatedData = req.body;
    
    // Valider que l'utilisateur a accès à ce profil
    const auth = authorizeResource(req, userId);
    
    if (!auth.isValid) {
      return handleError(res, ctx, auth.error);
    }
    
    const userIndex = mockData.users.findIndex(user => user.id === userId);
    
    if (userIndex === -1) {
      return res(
        ctx.status(404),
        ctx.json({ 
          message: 'Utilisateur non trouvé',
          code: 'USER_NOT_FOUND',
          timestamp: new Date().toISOString()
        })
      );
    }
    
    // Mise à jour des données (simulation)
    const updatedUser = {
      ...mockData.users[userIndex],
      ...updatedData,
      password: mockData.users[userIndex].password // Protéger le mot de passe
    };
    
    return res(
      ctx.status(200),
      ctx.json({
        ...updatedUser,
        password: undefined // Ne jamais renvoyer le mot de passe
      })
    );
  }),
  
  // Récupérer les activités d'un utilisateur
  http.get(`${baseUrl}/users/:userId/activities`, (req, res, ctx) => {
    const { userId } = req.params;
    const page = parseInt(req.url.searchParams.get('page') || '1');
    const pageSize = parseInt(req.url.searchParams.get('pageSize') || '10');
    
    // Valider que l'utilisateur a accès à ces activités
    const auth = authorizeResource(req, userId);
    
    if (!auth.isValid) {
      return handleError(res, ctx, auth.error);
    }
    
    const userActivities = mockData.activities.filter(activity => activity.userId === userId);
    
    // Pagination
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const pagedActivities = userActivities.slice(start, end);
    
    return res(
      ctx.status(200),
      ctx.json({
        data: pagedActivities,
        total: userActivities.length,
        page,
        pageSize,
        totalPages: Math.ceil(userActivities.length / pageSize)
      })
    );
  }),
  // #endregion
  
  // #region 2. COLS ET MÉTÉO
  
  // Récupérer tous les cols (avec filtres optionnels)
  http.get(`${baseUrl}/cols`, (req, res, ctx) => {
    // Récupérer les paramètres de requête pour filtrer
    const region = req.url.searchParams.get('region');
    const difficulty = req.url.searchParams.get('difficulty');
    
    let result = [...mockData.cols];
    
    // Appliquer les filtres
    if (region) {
      result = result.filter(col => col.region === region);
    }
    
    if (difficulty) {
      result = result.filter(col => col.difficulty === difficulty);
    }
    
    return res(
      ctx.status(200),
      ctx.json(result)
    );
  }),
  
  // Récupérer un col par ID
  http.get(`${baseUrl}/cols/:id`, (req, res, ctx) => {
    const { id } = req.params;
    const col = mockData.cols.find(col => col.id === id);
    
    if (!col) {
      return res(
        ctx.status(404),
        ctx.json({ 
          message: 'Col non trouvé',
          code: 'COL_NOT_FOUND',
          timestamp: new Date().toISOString()
        })
      );
    }
    
    return res(
      ctx.status(200),
      ctx.json(col)
    );
  }),
  
  // Recherche de cols
  http.get(`${baseUrl}/cols/search`, (req, res, ctx) => {
    const query = req.url.searchParams.get('q');
    
    if (!query) {
      return res(
        ctx.status(400),
        ctx.json({ 
          message: 'Paramètre de recherche manquant',
          code: 'MISSING_QUERY',
          timestamp: new Date().toISOString()
        })
      );
    }
    
    const results = mockData.cols.filter(col => 
      col.name.toLowerCase().includes(query.toLowerCase()) || 
      col.description.toLowerCase().includes(query.toLowerCase())
    );
    
    return res(
      ctx.status(200),
      ctx.json(results)
    );
  }),
  
  // Filtrer les cols par région
  http.get(`${baseUrl}/cols/region/:region`, (req, res, ctx) => {
    const { region } = req.params;
    
    const results = mockData.cols.filter(col => col.region === region);
    
    return res(
      ctx.status(200),
      ctx.json(results)
    );
  }),
  
  // Filtrer les cols par difficulté
  http.get(`${baseUrl}/cols/difficulty/:difficulty`, (req, res, ctx) => {
    const { difficulty } = req.params;
    
    const results = mockData.cols.filter(col => col.difficulty === difficulty);
    
    return res(
      ctx.status(200),
      ctx.json(results)
    );
  }),
  
  // Météo actuelle pour un col
  http.get(`${baseUrl}/weather/col/:colId`, (req, res, ctx) => {
    const { colId } = req.params;
    
    if (mockData.weatherData[colId]) {
      return res(
        ctx.status(200),
        ctx.json(mockData.weatherData[colId])
      );
    }
    
    // Si nous n'avons pas de données pour ce col, renvoyer des données génériques
    return res(
      ctx.status(200),
      ctx.json({
        current: {
          temperature: 15,
          feelsLike: 13,
          windSpeed: 10,
          windDirection: 180,
          precipitation: 0,
          humidity: 65,
          pressure: 1013,
          visibility: 10000,
          uvIndex: 4,
          conditions: "Ensoleillé",
          icon: "sun"
        },
        lastUpdated: new Date().toISOString()
      })
    );
  }),
  
  // Météo par coordonnées
  http.get(`${baseUrl}/weather/location`, (req, res, ctx) => {
    const lat = req.url.searchParams.get('lat');
    const lng = req.url.searchParams.get('lng');
    
    if (!lat || !lng) {
      return res(
        ctx.status(400),
        ctx.json({ 
          message: 'Coordonnées manquantes (lat, lng requis)',
          code: 'MISSING_COORDINATES',
          timestamp: new Date().toISOString()
        })
      );
    }
    
    // Génération de données météo aléatoires basées sur lat/lng
    const temperature = 10 + Math.round(Math.random() * 20); // 10-30°C
    
    return res(
      ctx.status(200),
      ctx.json({
        current: {
          temperature,
          feelsLike: temperature - 2,
          windSpeed: Math.round(Math.random() * 30),
          windDirection: Math.round(Math.random() * 360),
          precipitation: Math.random() * 5,
          humidity: 40 + Math.round(Math.random() * 50),
          pressure: 1000 + Math.round(Math.random() * 30),
          visibility: 5000 + Math.round(Math.random() * 5000),
          uvIndex: Math.round(Math.random() * 10),
          conditions: ["Ensoleillé", "Nuageux", "Partiellement nuageux", "Pluvieux"][Math.floor(Math.random() * 4)],
          icon: ["sun", "cloud", "cloud-sun", "cloud-rain"][Math.floor(Math.random() * 4)]
        },
        location: {
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          name: "Position personnalisée"
        },
        lastUpdated: new Date().toISOString()
      })
    );
  }),
  
  // Prévisions météo pour un col
  http.get(`${baseUrl}/weather/forecast/:colId/:days`, (req, res, ctx) => {
    const { colId, days } = req.params;
    const daysCount = parseInt(days) || 3;
    
    // Limiter le nombre de jours entre 1 et 7
    const validDays = Math.min(Math.max(daysCount, 1), 7);
    
    // Créer des prévisions aléatoires
    const forecast = [];
    const baseTemp = 10 + Math.round(Math.random() * 15);
    
    for (let i = 0; i < validDays; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      forecast.push({
        date: date.toISOString().split('T')[0],
        temperature: {
          min: baseTemp - 5 + Math.round(Math.random() * 5),
          max: baseTemp + Math.round(Math.random() * 10)
        },
        windSpeed: 5 + Math.round(Math.random() * 25),
        windDirection: Math.round(Math.random() * 360),
        precipitation: {
          probability: Math.round(Math.random() * 100),
          amount: Math.round(Math.random() * 20)
        },
        humidity: 40 + Math.round(Math.random() * 50),
        pressure: 1000 + Math.round(Math.random() * 30),
        conditions: ["Ensoleillé", "Nuageux", "Partiellement nuageux", "Pluvieux"][Math.floor(Math.random() * 4)],
        icon: ["sun", "cloud", "cloud-sun", "cloud-rain"][Math.floor(Math.random() * 4)]
      });
    }
    
    return res(
      ctx.status(200),
      ctx.json({
        colId,
        days: validDays,
        forecast,
        lastUpdated: new Date().toISOString()
      })
    );
  }),
  // #endregion
  
  // #region 3. ACTIVITÉS
  
  // Créer une nouvelle activité
  http.post(`${baseUrl}/activities`, (req, res, ctx) => {
    // Valider l'authentification
    const auth = validateAuth(req);
    
    if (!auth.isValid) {
      return handleError(res, ctx, auth.error);
    }
    
    const newActivity = req.body;
    
    // Vérifier que les données nécessaires sont présentes
    if (!newActivity.title || !newActivity.date || !newActivity.colId) {
      return res(
        ctx.status(400),
        ctx.json({ 
          message: 'Données manquantes pour créer l\'activité', 
          code: 'MISSING_REQUIRED_FIELDS',
          timestamp: new Date().toISOString()
        })
      );
    }
    
    // Générer un ID unique
    const createdActivity = {
      id: `activity-${Date.now()}`,
      userId: auth.userId, // Utiliser l'ID de l'utilisateur authentifié
      ...newActivity,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return res(
      ctx.status(201),
      ctx.json(createdActivity)
    );
  }),
  
  // Récupérer une activité par ID
  http.get(`${baseUrl}/activities/:id`, (req, res, ctx) => {
    const { id } = req.params;
    
    // Authentification (pas nécessairement obligatoire pour voir une activité, dépend des règles)
    const auth = validateAuth(req);
    
    // Trouver l'activité
    const activity = mockData.activities.find(activity => activity.id === id);
    
    if (!activity) {
      return res(
        ctx.status(404),
        ctx.json({ 
          message: 'Activité non trouvée',
          code: 'ACTIVITY_NOT_FOUND',
          timestamp: new Date().toISOString()
        })
      );
    }
    
    // Vérifier que l'utilisateur a le droit de voir cette activité
    if (activity.visibility === 'private' && (!auth.isValid || activity.userId !== auth.userId)) {
      return handleError(res, ctx, AUTH_ERROR.UNAUTHORIZED);
    }
    
    return res(
      ctx.status(200),
      ctx.json(activity)
    );
  }),
  
  // Mettre à jour une activité
  http.patch(`${baseUrl}/activities/:id`, (req, res, ctx) => {
    const { id } = req.params;
    const updatedData = req.body;
    
    // Authentification requise
    const auth = validateAuth(req);
    
    if (!auth.isValid) {
      return handleError(res, ctx, auth.error);
    }
    
    // Trouver l'activité
    const activityIndex = mockData.activities.findIndex(activity => activity.id === id);
    
    if (activityIndex === -1) {
      return res(
        ctx.status(404),
        ctx.json({ 
          message: 'Activité non trouvée',
          code: 'ACTIVITY_NOT_FOUND',
          timestamp: new Date().toISOString()
        })
      );
    }
    
    const activity = mockData.activities[activityIndex];
    
    // Vérifier que l'utilisateur est bien le propriétaire de l'activité
    if (activity.userId !== auth.userId) {
      return handleError(res, ctx, AUTH_ERROR.FORBIDDEN);
    }
    
    // Mise à jour des données
    const updatedActivity = {
      ...activity,
      ...updatedData,
      updatedAt: new Date().toISOString()
    };
    
    return res(
      ctx.status(200),
      ctx.json(updatedActivity)
    );
  }),
  
  // Supprimer une activité
  http.delete(`${baseUrl}/activities/:id`, (req, res, ctx) => {
    const { id } = req.params;
    
    // Authentification requise
    const auth = validateAuth(req);
    
    if (!auth.isValid) {
      return handleError(res, ctx, auth.error);
    }
    
    // Trouver l'activité
    const activityIndex = mockData.activities.findIndex(activity => activity.id === id);
    
    if (activityIndex === -1) {
      return res(
        ctx.status(404),
        ctx.json({ 
          message: 'Activité non trouvée',
          code: 'ACTIVITY_NOT_FOUND',
          timestamp: new Date().toISOString()
        })
      );
    }
    
    const activity = mockData.activities[activityIndex];
    
    // Vérifier que l'utilisateur est bien le propriétaire de l'activité
    if (activity.userId !== auth.userId) {
      return handleError(res, ctx, AUTH_ERROR.FORBIDDEN);
    }
    
    return res(
      ctx.status(204)
    );
  }),
  
  // Ajouter un commentaire à une activité
  http.post(`${baseUrl}/activities/:id/comments`, (req, res, ctx) => {
    const { id } = req.params;
    const { content } = req.body;
    
    // Authentification requise
    const auth = validateAuth(req);
    
    if (!auth.isValid) {
      return handleError(res, ctx, auth.error);
    }
    
    // Vérifier que l'activité existe
    const activity = mockData.activities.find(activity => activity.id === id);
    
    if (!activity) {
      return res(
        ctx.status(404),
        ctx.json({ 
          message: 'Activité non trouvée',
          code: 'ACTIVITY_NOT_FOUND',
          timestamp: new Date().toISOString()
        })
      );
    }
    
    // Vérifier le contenu du commentaire
    if (!content || content.trim() === '') {
      return res(
        ctx.status(400),
        ctx.json({ 
          message: 'Le contenu du commentaire ne peut pas être vide',
          code: 'EMPTY_COMMENT',
          timestamp: new Date().toISOString()
        })
      );
    }
    
    // Créer le commentaire
    const comment = {
      id: `comment-${Date.now()}`,
      activityId: id,
      userId: auth.userId,
      content,
      createdAt: new Date().toISOString()
    };
    
    return res(
      ctx.status(201),
      ctx.json(comment)
    );
  }),
  
  // Obtenir les commentaires d'une activité
  http.get(`${baseUrl}/activities/:id/comments`, (req, res, ctx) => {
    const { id } = req.params;
    
    // Vérifier que l'activité existe
    const activity = mockData.activities.find(activity => activity.id === id);
    
    if (!activity) {
      return res(
        ctx.status(404),
        ctx.json({ 
          message: 'Activité non trouvée',
          code: 'ACTIVITY_NOT_FOUND',
          timestamp: new Date().toISOString()
        })
      );
    }
    
    // Filtrer les commentaires pour cette activité
    const comments = mockData.comments ? mockData.comments.filter(comment => comment.activityId === id) : [];
    
    return res(
      ctx.status(200),
      ctx.json(comments)
    );
  }),
  // #endregion
  
  // #region 4. DÉFIS 7 MAJEURS
  
  // Récupérer tous les défis 7 Majeurs
  http.get(`${baseUrl}/majeurs7/challenges`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(mockData.majeurs7Challenges || [])
    );
  }),
  
  // Récupérer un défi 7 Majeurs par ID
  http.get(`${baseUrl}/majeurs7/challenges/:id`, (req, res, ctx) => {
    const { id } = req.params;
    const challenge = mockData.majeurs7Challenges.find(challenge => challenge.id === id);
    
    if (!challenge) {
      return res(
        ctx.status(404),
        ctx.json({ 
          message: 'Défi 7 Majeurs non trouvé',
          code: 'CHALLENGE_NOT_FOUND',
          timestamp: new Date().toISOString()
        })
      );
    }
    
    return res(
      ctx.status(200),
      ctx.json(challenge)
    );
  }),
  
  // S'inscrire à un défi 7 Majeurs
  http.post(`${baseUrl}/majeurs7/challenges/:id/enroll`, (req, res, ctx) => {
    const { id } = req.params;
    
    // Authentification requise
    const auth = validateAuth(req);
    
    if (!auth.isValid) {
      return handleError(res, ctx, auth.error);
    }
    
    // Vérifier que le défi existe
    const challenge = mockData.majeurs7Challenges.find(challenge => challenge.id === id);
    
    if (!challenge) {
      return res(
        ctx.status(404),
        ctx.json({ 
          message: 'Défi 7 Majeurs non trouvé',
          code: 'CHALLENGE_NOT_FOUND',
          timestamp: new Date().toISOString()
        })
      );
    }
    
    // Vérifier si l'utilisateur est déjà inscrit
    if (challenge.participants && challenge.participants.includes(auth.userId)) {
      return res(
        ctx.status(409),
        ctx.json({ 
          message: 'Vous êtes déjà inscrit à ce défi',
          code: 'ALREADY_ENROLLED',
          timestamp: new Date().toISOString()
        })
      );
    }
    
    // Créer un objet d'inscription
    const enrollment = {
      userId: auth.userId,
      challengeId: id,
      status: 'active',
      progress: 0,
      startDate: new Date().toISOString(),
      completedCols: []
    };
    
    return res(
      ctx.status(201),
      ctx.json(enrollment)
    );
  }),
  
  // Mettre à jour la progression dans un défi 7 Majeurs
  http.patch(`${baseUrl}/majeurs7/challenges/:id/progress`, (req, res, ctx) => {
    const { id } = req.params;
    const { colId, date, notes } = req.body;
    
    // Authentification requise
    const auth = validateAuth(req);
    
    if (!auth.isValid) {
      return handleError(res, ctx, auth.error);
    }
    
    // Vérifier que le défi existe
    const challenge = mockData.majeurs7Challenges.find(challenge => challenge.id === id);
    
    if (!challenge) {
      return res(
        ctx.status(404),
        ctx.json({ 
          message: 'Défi 7 Majeurs non trouvé',
          code: 'CHALLENGE_NOT_FOUND',
          timestamp: new Date().toISOString()
        })
      );
    }
    
    // Vérifier que le col existe et fait partie du défi
    if (!challenge.cols.some(col => col.id === colId)) {
      return res(
        ctx.status(400),
        ctx.json({ 
          message: 'Ce col ne fait pas partie du défi',
          code: 'INVALID_COL',
          timestamp: new Date().toISOString()
        })
      );
    }
    
    // Simuler une mise à jour de la progression
    const updatedProgress = {
      userId: auth.userId,
      challengeId: id,
      colId,
      completedAt: date || new Date().toISOString(),
      notes,
      status: 'completed'
    };
    
    return res(
      ctx.status(200),
      ctx.json(updatedProgress)
    );
  }),
  
  // Récupérer la progression d'un utilisateur dans les défis 7 Majeurs
  http.get(`${baseUrl}/users/:userId/majeurs7/progress`, (req, res, ctx) => {
    const { userId } = req.params;
    
    // Valider que l'utilisateur a accès à ces données
    const auth = authorizeResource(req, userId);
    
    if (!auth.isValid) {
      return handleError(res, ctx, auth.error);
    }
    
    // Simuler des données de progression
    const challengeProgress = mockData.majeurs7Challenges.map(challenge => {
      const totalCols = challenge.cols.length;
      const completedCols = Math.floor(Math.random() * (totalCols + 1)); // Nombre aléatoire de cols complétés
      
      return {
        challengeId: challenge.id,
        challengeName: challenge.name,
        userId,
        status: completedCols === totalCols ? 'completed' : 'in-progress',
        progress: (completedCols / totalCols) * 100,
        completedCols,
        totalCols,
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Date de début (30 jours avant)
        completionDate: completedCols === totalCols ? new Date().toISOString() : null
      };
    });
    
    return res(
      ctx.status(200),
      ctx.json(challengeProgress)
    );
  }),
  // #endregion
  
  // #region 5. ENTRAÎNEMENT ET NUTRITION
  
  // Récupérer les données nutritionnelles d'un utilisateur
  http.get(`${baseUrl}/users/:userId/nutrition`, (req, res, ctx) => {
    const { userId } = req.params;
    
    // Valider que l'utilisateur a accès à ces données
    const auth = authorizeResource(req, userId);
    
    if (!auth.isValid) {
      return res(
        ctx.status(401),
        ctx.json({ error: 'Non autorisé' })
      );
    }
    
    // Données nutritionnelles mockées
    const mockNutritionData = {
      userId,
      dailyCalories: 2500,
      macroNutrients: {
        carbs: { target: 300, unit: 'g' },
        protein: { target: 120, unit: 'g' },
        fat: { target: 70, unit: 'g' }
      },
      hydration: { target: 3000, unit: 'ml' },
      preferences: {
        dietType: 'balanced',
        allergies: ['peanuts'],
        restrictions: []
      },
      lastUpdated: new Date().toISOString()
    };
    
    return res(
      ctx.delay(300),
      ctx.json(mockNutritionData)
    );
  }),
  
  // Récupérer le plan nutritionnel d'un utilisateur
  http.get(`${baseUrl}/users/:userId/nutrition/plan`, (req, res, ctx) => {
    const { userId } = req.params;
    
    // Valider que l'utilisateur a accès à ces données
    const auth = authorizeResource(req, userId);
    
    if (!auth.isValid) {
      return res(
        ctx.status(401),
        ctx.json({ error: 'Non autorisé' })
      );
    }
    
    // Plan nutritionnel mocké
    const mockNutritionPlan = {
      id: `plan-${userId}-${Date.now()}`,
      userId,
      name: "Plan cycliste endurance",
      description: "Plan nutritionnel adapté pour les cyclistes d'endurance",
      dailyCalories: 2800,
      macroNutrients: {
        carbs: { target: 350, unit: 'g' },
        protein: { target: 140, unit: 'g' },
        fat: { target: 80, unit: 'g' }
      },
      mealPlan: [
        {
          name: "Petit-déjeuner",
          time: "07:00",
          calories: 700,
          suggestions: [
            "Porridge d'avoine avec fruits et miel",
            "Omelette aux légumes avec pain complet",
            "Smoothie protéiné avec banane et beurre d'amande"
          ]
        },
        {
          name: "Collation matinale",
          time: "10:00",
          calories: 250,
          suggestions: [
            "Yaourt grec avec baies",
            "Poignée de noix et fruits secs",
            "Barre énergétique maison"
          ]
        },
        {
          name: "Déjeuner",
          time: "13:00",
          calories: 800,
          suggestions: [
            "Pâtes complètes avec sauce tomate et poulet",
            "Bol de riz avec légumes et saumon",
            "Salade composée avec quinoa et légumineuses"
          ]
        },
        {
          name: "Collation après-midi",
          time: "16:00",
          calories: 300,
          suggestions: [
            "Banane et beurre d'amande",
            "Barre de céréales et yaourt",
            "Smoothie aux fruits rouges"
          ]
        },
        {
          name: "Dîner",
          time: "19:30",
          calories: 750,
          suggestions: [
            "Patate douce, légumes verts et protéine maigre",
            "Risotto aux champignons et poulet",
            "Poisson grillé avec légumes rôtis"
          ]
        }
      ],
      hydration: { target: 3500, unit: 'ml', schedule: [
        { time: "07:00", amount: 500 },
        { time: "09:00", amount: 500 },
        { time: "11:00", amount: 500 },
        { time: "13:00", amount: 500 },
        { time: "15:00", amount: 500 },
        { time: "17:00", amount: 500 },
        { time: "19:00", amount: 500 }
      ]},
      supplements: [
        { name: "Électrolytes", timing: "Avant/pendant l'effort", dosage: "1 sachet" },
        { name: "Protéines en poudre", timing: "Après l'effort", dosage: "30g" },
        { name: "Magnésium", timing: "Soir", dosage: "300mg" }
      ],
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return res(
      ctx.delay(300),
      ctx.json(mockNutritionPlan)
    );
  }),
  
  // Mettre à jour le plan nutritionnel
  http.patch(`${baseUrl}/nutrition/plans/:planId`, (req, res, ctx) => {
    const { planId } = req.params;
    const updatedData = req.body;
    
    // Simuler la mise à jour
    const updatedPlan = {
      ...updatedData,
      id: planId,
      updatedAt: new Date().toISOString()
    };
    
    return res(
      ctx.status(200),
      ctx.json(updatedPlan)
    );
  }),
  
  // Récupérer le journal nutritionnel pour une date
  http.get(`${baseUrl}/users/:userId/nutrition/log`, (req, res, ctx) => {
    const { userId } = req.params;
    const date = req.url.searchParams.get('date') || new Date().toISOString().split('T')[0];
    
    // Valider que l'utilisateur a accès à ces données
    const auth = authorizeResource(req, userId);
    
    if (!auth.isValid) {
      return res(
        ctx.status(401),
        ctx.json({ error: 'Non autorisé' })
      );
    }
    
    // Journal nutritionnel mocké
    const mockNutritionLog = {
      userId,
      date,
      meals: [
        {
          id: `meal-${Date.now()}-1`,
          name: "Petit-déjeuner",
          time: "07:30",
          foods: [
            { name: "Porridge d'avoine", quantity: 100, unit: "g", calories: 350, macros: { carbs: 60, protein: 10, fat: 7 } },
            { name: "Banane", quantity: 1, unit: "pièce", calories: 105, macros: { carbs: 27, protein: 1, fat: 0 } },
            { name: "Miel", quantity: 15, unit: "g", calories: 45, macros: { carbs: 12, protein: 0, fat: 0 } }
          ],
          totalCalories: 500
        },
        {
          id: `meal-${Date.now()}-2`,
          name: "Déjeuner",
          time: "12:30",
          foods: [
            { name: "Pâtes complètes", quantity: 150, unit: "g", calories: 525, macros: { carbs: 105, protein: 18, fat: 3 } },
            { name: "Poulet grillé", quantity: 120, unit: "g", calories: 198, macros: { carbs: 0, protein: 36, fat: 6 } },
            { name: "Sauce tomate", quantity: 100, unit: "g", calories: 80, macros: { carbs: 12, protein: 2, fat: 3 } }
          ],
          totalCalories: 803
        }
      ],
      hydration: [
        { time: "07:30", amount: 400, unit: "ml" },
        { time: "10:00", amount: 500, unit: "ml" },
        { time: "12:30", amount: 500, unit: "ml" }
      ],
      supplements: [
        { name: "Électrolytes", time: "10:00", dosage: "1 sachet" }
      ],
      totals: {
        calories: 1303,
        macros: { carbs: 216, protein: 67, fat: 19 },
        hydration: 1400
      },
      notes: "Journée d'entraînement léger"
    };
    
    return res(
      ctx.delay(300),
      ctx.json(mockNutritionLog)
    );
  }),
  
  // Créer une entrée dans le journal nutritionnel
  http.post(`${baseUrl}/users/:userId/nutrition/log`, (req, res, ctx) => {
    const { userId } = req.params;
    const logData = req.body;
    
    // Valider que l'utilisateur a accès à ces données
    const auth = authorizeResource(req, userId);
    
    if (!auth.isValid) {
      return res(
        ctx.status(401),
        ctx.json({ error: 'Non autorisé' })
      );
    }
    
    // Simuler la création d'une entrée
    const newEntry = {
      ...logData,
      id: `log-entry-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    
    return res(
      ctx.status(201),
      ctx.json(newEntry)
    );
  }),
  
  // Créer un nouveau plan de repas
  http.post(`${baseUrl}/users/:userId/nutrition/plans`, (req, res, ctx) => {
    const { userId } = req.params;
    const planData = req.body;
    
    // Valider que l'utilisateur a accès à ces données
    const auth = authorizeResource(req, userId);
    
    if (!auth.isValid) {
      return res(
        ctx.status(401),
        ctx.json({ error: 'Non autorisé' })
      );
    }
    
    // Simuler la création d'un plan
    const newPlan = {
      ...planData,
      id: `plan-${Date.now()}`,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return res(
      ctx.status(201),
      ctx.json(newPlan)
    );
  }),
  
  // Récupérer des recettes selon critères
  http.get(`${baseUrl}/nutrition/recipes`, (req, res, ctx) => {
    const query = req.url.searchParams.get('q') || '';
    const tags = req.url.searchParams.get('tags') ? req.url.searchParams.get('tags').split(',') : [];
    
    // Recettes mockées
    const mockRecipes = [
      {
        id: "recipe-1",
        title: "Porridge énergétique",
        description: "Parfait pour le petit-déjeuner avant une sortie longue",
        prepTime: 10,
        calories: 450,
        macros: { carbs: 70, protein: 15, fat: 12 },
        ingredients: [
          "100g de flocons d'avoine",
          "300ml de lait ou alternative végétale",
          "1 banane",
          "1 cuillère à soupe de miel",
          "1 poignée de fruits rouges",
          "1 cuillère à café de cannelle"
        ],
        instructions: "Mélanger les flocons d'avoine et le lait dans une casserole. Porter à ébullition puis réduire le feu et laisser mijoter 5 minutes. Ajouter le reste des ingrédients et servir chaud.",
        tags: ["petit-déjeuner", "avant-effort", "végétarien"],
        image: "https://example.com/images/porridge.jpg"
      },
      {
        id: "recipe-2",
        title: "Pâtes au saumon et épinards",
        description: "Repas équilibré riche en protéines et glucides complexes",
        prepTime: 20,
        calories: 650,
        macros: { carbs: 80, protein: 35, fat: 20 },
        ingredients: [
          "150g de pâtes complètes",
          "120g de saumon frais",
          "100g d'épinards frais",
          "1 gousse d'ail",
          "2 cuillères à soupe d'huile d'olive",
          "Jus d'un demi-citron",
          "Sel et poivre"
        ],
        instructions: "Cuire les pâtes selon les instructions. Pendant ce temps, faire revenir l'ail dans l'huile d'olive, ajouter le saumon coupé en dés et cuire 3-4 minutes. Ajouter les épinards et laisser réduire. Égoutter les pâtes et les mélanger avec la préparation. Assaisonner avec le jus de citron, sel et poivre.",
        tags: ["déjeuner", "dîner", "récupération", "riche-en-protéines"],
        image: "https://example.com/images/salmon-pasta.jpg"
      },
      {
        id: "recipe-3",
        title: "Smoothie protéiné banane-beurre d'amande",
        description: "Idéal pour la récupération après l'effort",
        prepTime: 5,
        calories: 350,
        macros: { carbs: 45, protein: 20, fat: 10 },
        ingredients: [
          "1 banane",
          "250ml de lait ou alternative végétale",
          "1 cuillère à soupe de beurre d'amande",
          "1 scoop de protéine en poudre",
          "1 cuillère à café de miel (optionnel)",
          "Quelques glaçons"
        ],
        instructions: "Mettre tous les ingrédients dans un blender et mixer jusqu'à obtenir une consistance lisse.",
        tags: ["récupération", "après-effort", "boisson", "rapide"],
        image: "https://example.com/images/protein-smoothie.jpg"
      }
    ];
    
    // Filtrer les recettes selon les critères
    let filteredRecipes = [...mockRecipes];
    
    if (query) {
      filteredRecipes = filteredRecipes.filter(recipe => 
        recipe.title.toLowerCase().includes(query.toLowerCase()) ||
        recipe.description.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    if (tags && tags.length > 0) {
      filteredRecipes = filteredRecipes.filter(recipe => 
        tags.some(tag => recipe.tags.includes(tag))
      );
    }
    
    return res(
      ctx.delay(300),
      ctx.json({
        data: filteredRecipes,
        total: filteredRecipes.length
      })
    );
  }),
  
  // Récupérer une recette par son ID
  http.get(`${baseUrl}/nutrition/recipes/:recipeId`, (req, res, ctx) => {
    const { recipeId } = req.params;
    
    // Simuler la récupération d'une recette
    const recipe = {
      id: recipeId,
      title: "Porridge énergétique",
      description: "Parfait pour le petit-déjeuner avant une sortie longue",
      prepTime: 10,
      calories: 450,
      macros: { carbs: 70, protein: 15, fat: 12 },
      ingredients: [
        "100g de flocons d'avoine",
        "300ml de lait ou alternative végétale",
        "1 banane",
        "1 cuillère à soupe de miel",
        "1 poignée de fruits rouges",
        "1 cuillère à café de cannelle"
      ],
      instructions: "Mélanger les flocons d'avoine et le lait dans une casserole. Porter à ébullition puis réduire le feu et laisser mijoter 5 minutes. Ajouter le reste des ingrédients et servir chaud.",
      tags: ["petit-déjeuner", "avant-effort", "végétarien"],
      image: "https://example.com/images/porridge.jpg",
      nutritionalInfo: {
        calories: 450,
        macros: { carbs: 70, protein: 15, fat: 12 },
        micronutrients: {
          fiber: 8,
          sugar: 20,
          sodium: 50,
          potassium: 450,
          calcium: 200,
          iron: 2.5
        },
        servingSize: "1 bol (environ 400g)"
      },
      ratings: {
        average: 4.7,
        count: 42
      },
      author: "Équipe Velo-Altitude",
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    return res(
      ctx.delay(300),
      ctx.json(recipe)
    );
  }),
  // #endregion
  
  // #region 6. STRAVA ET INTÉGRATIONS
  
  // Connecter le compte Strava
  http.post(`${baseUrl}/users/:userId/strava/connect`, (req, res, ctx) => {
    const { userId } = req.params;
    const { code } = req.body;
    
    // Valider que l'utilisateur a accès à ces données
    const auth = authorizeResource(req, userId);
    
    if (!auth.isValid) {
      return handleError(res, ctx, auth.error);
    }
    
    if (!code) {
      return res(
        ctx.status(400),
        ctx.json({ 
          message: 'Code d\'autorisation Strava manquant',
          code: 'MISSING_STRAVA_CODE',
          timestamp: new Date().toISOString()
        })
      );
    }
    
    // Simuler une connexion réussie à Strava
    const stravaConnection = {
      userId,
      connected: true,
      accessToken: `strava-token-${Date.now()}`,
      refreshToken: `strava-refresh-${Date.now()}`,
      expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 heures
      athleteId: `strava-athlete-${Math.floor(Math.random() * 1000000)}`,
      connectedAt: new Date().toISOString()
    };
    
    return res(
      ctx.status(200),
      ctx.json(stravaConnection)
    );
  }),
  
  // Déconnecter le compte Strava
  http.post(`${baseUrl}/users/:userId/strava/disconnect`, (req, res, ctx) => {
    const { userId } = req.params;
    
    // Valider que l'utilisateur a accès à ces données
    const auth = authorizeResource(req, userId);
    
    if (!auth.isValid) {
      return handleError(res, ctx, auth.error);
    }
    
    return res(
      ctx.status(200),
      ctx.json({ 
        success: true,
        message: "Compte Strava déconnecté avec succès"
      })
    );
  }),
  
  // Synchroniser les activités Strava
  http.post(`${baseUrl}/users/:userId/strava/sync`, (req, res, ctx) => {
    const { userId } = req.params;
    
    // Valider que l'utilisateur a accès à ces données
    const auth = authorizeResource(req, userId);
    
    if (!auth.isValid) {
      return handleError(res, ctx, auth.error);
    }
    
    // Générer un nombre aléatoire d'activités synchronisées
    const activitiesCount = Math.floor(Math.random() * 10) + 1; // entre 1 et 10 activités
    
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        activitiesCount,
        syncedAt: new Date().toISOString()
      })
    );
  }),
  
  // Vérifier le statut de la connexion Strava
  http.get(`${baseUrl}/users/:userId/strava/status`, (req, res, ctx) => {
    const { userId } = req.params;
    
    // Valider que l'utilisateur a accès à ces données
    const auth = authorizeResource(req, userId);
    
    if (!auth.isValid) {
      return handleError(res, ctx, auth.error);
    }
    
    // Statut simulé de la connexion
    const isConnected = Math.random() > 0.3; // 70% de chance d'être connecté
    
    return res(
      ctx.status(200),
      ctx.json({
        connected: isConnected,
        lastSync: isConnected ? new Date(Date.now() - Math.floor(Math.random() * 60) * 60 * 1000).toISOString() : null,
        athleteId: isConnected ? `strava-athlete-${Math.floor(Math.random() * 1000000)}` : null
      })
    );
  }),
  // #endregion
  
  // #region 7. FORUM ET COMMUNAUTÉ
  
  // Récupérer tous les sujets du forum
  http.get(`${baseUrl}/forum/topics`, (req, res, ctx) => {
    const page = parseInt(req.url.searchParams.get('page') || '1');
    const pageSize = parseInt(req.url.searchParams.get('pageSize') || '10');
    const category = req.url.searchParams.get('category');
    
    let topics = mockData.forumTopics || [];
    
    // Filtrer par catégorie si nécessaire
    if (category) {
      topics = topics.filter(topic => topic.category === category);
    }
    
    // Trier par date (plus récent d'abord)
    topics.sort((a, b) => new Date(b.lastActivityAt) - new Date(a.lastActivityAt));
    
    // Pagination
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const pagedTopics = topics.slice(start, end);
    
    return res(
      ctx.status(200),
      ctx.json({
        data: pagedTopics,
        total: topics.length,
        page,
        pageSize,
        totalPages: Math.ceil(topics.length / pageSize)
      })
    );
  }),
  
  // Récupérer un sujet du forum par ID
  http.get(`${baseUrl}/forum/topics/:id`, (req, res, ctx) => {
    const { id } = req.params;
    const topic = (mockData.forumTopics || []).find(topic => topic.id === id);
    
    if (!topic) {
      return res(
        ctx.status(404),
        ctx.json({ 
          message: 'Sujet non trouvé',
          code: 'TOPIC_NOT_FOUND',
          timestamp: new Date().toISOString()
        })
      );
    }
    
    return res(
      ctx.status(200),
      ctx.json(topic)
    );
  }),
  
  // Créer un nouveau sujet
  http.post(`${baseUrl}/forum/topics`, (req, res, ctx) => {
    // Authentification requise
    const auth = validateAuth(req);
    
    if (!auth.isValid) {
      return handleError(res, ctx, auth.error);
    }
    
    const { title, content, category } = req.body;
    
    // Validation des données
    if (!title || !content || !category) {
      return res(
        ctx.status(400),
        ctx.json({ 
          message: 'Titre, contenu et catégorie sont requis',
          code: 'MISSING_REQUIRED_FIELDS',
          timestamp: new Date().toISOString()
        })
      );
    }
    
    // Créer le sujet
    const newTopic = {
      id: `topic-${Date.now()}`,
      userId: auth.userId,
      title,
      content,
      category,
      createdAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      repliesCount: 0,
      viewsCount: 0,
      likes: 0,
      status: 'open',
      pinned: false,
      tags: req.body.tags || []
    };
    
    return res(
      ctx.status(201),
      ctx.json(newTopic)
    );
  }),
  
  // Ajouter une réponse à un sujet
  http.post(`${baseUrl}/forum/topics/:id/replies`, (req, res, ctx) => {
    const { id } = req.params;
    
    // Authentification requise
    const auth = validateAuth(req);
    
    if (!auth.isValid) {
      return handleError(res, ctx, auth.error);
    }
    
    const { content } = req.body;
    
    // Validation des données
    if (!content) {
      return res(
        ctx.status(400),
        ctx.json({ 
          message: 'Le contenu est requis',
          code: 'MISSING_CONTENT',
          timestamp: new Date().toISOString()
        })
      );
    }
    
    // Vérifier que le sujet existe
    const topic = (mockData.forumTopics || []).find(topic => topic.id === id);
    
    if (!topic) {
      return res(
        ctx.status(404),
        ctx.json({ 
          message: 'Sujet non trouvé',
          code: 'TOPIC_NOT_FOUND',
          timestamp: new Date().toISOString()
        })
      );
    }
    
    // Créer la réponse
    const reply = {
      id: `reply-${Date.now()}`,
      topicId: id,
      userId: auth.userId,
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      likes: 0
    };
    
    return res(
      ctx.status(201),
      ctx.json(reply)
    );
  }),
  
  // Récupérer les réponses d'un sujet
  http.get(`${baseUrl}/forum/topics/:id/replies`, (req, res, ctx) => {
    const { id } = req.params;
    const page = parseInt(req.url.searchParams.get('page') || '1');
    const pageSize = parseInt(req.url.searchParams.get('pageSize') || '20');
    
    // Vérifier que le sujet existe
    const topic = (mockData.forumTopics || []).find(topic => topic.id === id);
    
    if (!topic) {
      return res(
        ctx.status(404),
        ctx.json({ 
          message: 'Sujet non trouvé',
          code: 'TOPIC_NOT_FOUND',
          timestamp: new Date().toISOString()
        })
      );
    }
    
    // Générer des réponses fictives si elles n'existent pas
    const replies = mockData.forumReplies ? 
      mockData.forumReplies.filter(reply => reply.topicId === id) : 
      Array.from({ length: 15 }, (_, i) => ({
        id: `reply-${i}-${id}`,
        topicId: id,
        userId: mockData.users[Math.floor(Math.random() * mockData.users.length)].id,
        content: `Réponse ${i + 1} au sujet ${topic.title}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
        createdAt: new Date(Date.now() - (15 - i) * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - (15 - i) * 24 * 60 * 60 * 1000).toISOString(),
        likes: Math.floor(Math.random() * 10)
      }));
    
    // Trier par date (plus ancien d'abord, pour les forums c'est souvent le cas)
    replies.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    // Pagination
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const pagedReplies = replies.slice(start, end);
    
    return res(
      ctx.status(200),
      ctx.json({
        data: pagedReplies,
        total: replies.length,
        page,
        pageSize,
        totalPages: Math.ceil(replies.length / pageSize)
      })
    );
  }),
  
  // Aimer un sujet ou une réponse
  http.post(`${baseUrl}/forum/:type/:id/like`, (req, res, ctx) => {
    const { type, id } = req.params;
    
    // Authentification requise
    const auth = validateAuth(req);
    
    if (!auth.isValid) {
      return handleError(res, ctx, auth.error);
    }
    
    // Vérifier le type
    if (type !== 'topics' && type !== 'replies') {
      return res(
        ctx.status(400),
        ctx.json({ 
          message: 'Type invalide. Doit être "topics" ou "replies"',
          code: 'INVALID_TYPE',
          timestamp: new Date().toISOString()
        })
      );
    }
    
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        type,
        id,
        liked: true
      })
    );
  }),
  
  // Récupérer les catégories du forum
  http.get(`${baseUrl}/forum/categories`, (req, res, ctx) => {
    // Catégories fictives si elles n'existent pas dans mockData
    const categories = mockData.forumCategories || [
      {
        id: 'general',
        name: 'Général',
        description: 'Discussions générales sur le cyclisme',
        topicsCount: 42,
        order: 1
      },
      {
        id: 'cols',
        name: 'Cols et Montagne',
        description: 'Tous les sujets liés aux cols et à la montagne',
        topicsCount: 78,
        order: 2
      },
      {
        id: 'equipment',
        name: 'Équipement',
        description: 'Discussions sur le matériel et l\'équipement',
        topicsCount: 56,
        order: 3
      },
      {
        id: 'training',
        name: 'Entraînement',
        description: 'Conseils et discussions sur l\'entraînement',
        topicsCount: 64,
        order: 4
      },
      {
        id: 'events',
        name: 'Événements',
        description: 'Événements et compétitions à venir',
        topicsCount: 27,
        order: 5
      }
    ];
    
    return res(
      ctx.status(200),
      ctx.json(categories)
    );
  }),
  // #endregion
  
  // #region 8. RECHERCHE ET DIVERS
  
  // Recherche globale
  http.get(`${baseUrl}/search`, (req, res, ctx) => {
    const query = req.url.searchParams.get('q');
    
    if (!query) {
      return res(
        ctx.status(400),
        ctx.json({ 
          message: 'Paramètre de recherche manquant',
          code: 'MISSING_QUERY',
          timestamp: new Date().toISOString()
        })
      );
    }
    
    // Filtrer les cols
    const cols = mockData.cols.filter(col => 
      col.name.toLowerCase().includes(query.toLowerCase()) || 
      col.description?.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);
    
    // Filtrer les activités
    const activities = mockData.activities.filter(activity => 
      activity.title.toLowerCase().includes(query.toLowerCase()) || 
      activity.description?.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);
    
    // Filtrer les topics du forum (si présents dans les données mockées)
    const topics = mockData.forumTopics ? mockData.forumTopics.filter(topic => 
      topic.title.toLowerCase().includes(query.toLowerCase()) || 
      topic.content?.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5) : [];
    
    // Filtrer les utilisateurs (recherche par nom d'utilisateur)
    const users = mockData.users.filter(user =>
      user.username.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5).map(user => ({
      id: user.id,
      username: user.username,
      profilePicture: user.profilePicture
    }));
    
    return res(
      ctx.status(200),
      ctx.json({
        cols,
        activities,
        topics,
        users,
        query
      })
    );
  }),
  
  // Recherche avancée par catégorie
  http.get(`${baseUrl}/search/:category`, (req, res, ctx) => {
    const { category } = req.params;
    const query = req.url.searchParams.get('q');
    
    if (!query) {
      return res(
        ctx.status(400),
        ctx.json({ 
          message: 'Paramètre de recherche manquant',
          code: 'MISSING_QUERY',
          timestamp: new Date().toISOString()
        })
      );
    }
    
    let results = [];
    
    switch (category) {
      case 'cols':
        results = mockData.cols.filter(col => 
          col.name.toLowerCase().includes(query.toLowerCase()) || 
          col.description?.toLowerCase().includes(query.toLowerCase())
        );
        break;
        
      case 'activities':
        results = mockData.activities.filter(activity => 
          activity.title.toLowerCase().includes(query.toLowerCase()) || 
          activity.description?.toLowerCase().includes(query.toLowerCase())
        );
        break;
        
      case 'topics':
        results = mockData.forumTopics ? mockData.forumTopics.filter(topic => 
          topic.title.toLowerCase().includes(query.toLowerCase()) || 
          topic.content?.toLowerCase().includes(query.toLowerCase())
        ) : [];
        break;
        
      case 'users':
        results = mockData.users.filter(user =>
          user.username.toLowerCase().includes(query.toLowerCase())
        ).map(user => ({
          id: user.id,
          username: user.username,
          profilePicture: user.profilePicture
        }));
        break;
        
      default:
        return res(
          ctx.status(400),
          ctx.json({ 
            message: 'Catégorie de recherche invalide',
            code: 'INVALID_CATEGORY',
            timestamp: new Date().toISOString()
          })
        );
    }
    
    // Pagination si nécessaire
    const page = parseInt(req.url.searchParams.get('page') || '1');
    const pageSize = parseInt(req.url.searchParams.get('pageSize') || '20');
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const pagedResults = results.slice(start, end);
    
    return res(
      ctx.status(200),
      ctx.json({
        data: pagedResults,
        total: results.length,
        page,
        pageSize,
        totalPages: Math.ceil(results.length / pageSize),
        category,
        query
      })
    );
  }),
  
  // Statistiques globales de l'application
  http.get(`${baseUrl}/stats/global`, (req, res, ctx) => {
    // Authentification optionnelle
    const auth = validateAuth(req);
    
    const stats = {
      usersCount: mockData.users.length,
      activitiesCount: mockData.activities.length,
      colsCount: mockData.cols.length,
      totalAscents: mockData.activities.length * 3, // Approximation pour les stats
      topCols: mockData.cols.slice(0, 5).map(col => ({
        id: col.id,
        name: col.name,
        region: col.region,
        ascentsCount: Math.floor(Math.random() * 1000)
      })),
      lastUpdated: new Date().toISOString()
    };
    
    // Ajouter des statistiques personnalisées si l'utilisateur est authentifié
    if (auth.isValid) {
      const userActivities = mockData.activities.filter(activity => activity.userId === auth.userId);
      
      stats.personalStats = {
        activitiesCount: userActivities.length,
        uniqueColsVisited: [...new Set(userActivities.map(a => a.colId))].length,
        totalDistance: userActivities.reduce((sum, a) => sum + (a.distance || 0), 0),
        totalElevation: userActivities.reduce((sum, a) => sum + (a.elevation || 0), 0)
      };
    }
    
    return res(
      ctx.status(200),
      ctx.json(stats)
    );
  }),
  
  // Exporter les données d'un utilisateur (RGPD)
  http.post(`${baseUrl}/users/:userId/export`, (req, res, ctx) => {
    const { userId } = req.params;
    
    // Valider que l'utilisateur a accès à ces données
    const auth = authorizeResource(req, userId);
    
    if (!auth.isValid) {
      return handleError(res, ctx, auth.error);
    }
    
    return res(
      ctx.status(202),
      ctx.json({
        message: "L'export des données a été initié. Vous recevrez un email lorsqu'il sera prêt.",
        requestedAt: new Date().toISOString(),
        estimatedCompletionTime: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes plus tard
      })
    );
  }),
  
  // Ping pour vérifier si l'API est en ligne
  http.get(`${baseUrl}/ping`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        version: "1.0.0"
      })
    );
  }),
  
  // Informations sur la version de l'API
  http.get(`${baseUrl}/version`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        version: "1.0.0",
        buildNumber: "20230728-1",
        environment: "development",
        apiDocs: "/api/docs",
        features: {
          strava: true,
          weather: true,
          challenges: true,
          forum: true
        }
      })
    );
  }),
  // #endregion
];

export default handlers;
