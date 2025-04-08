# Plan d'Implémentation des Handlers MSW

Ce document détaille le plan d'implémentation pour la mise à jour des handlers MSW dans le fichier `handlers.js`.

## Objectifs

1. Couvrir tous les endpoints identifiés dans l'analyse comparative
2. Organiser les handlers par catégorie fonctionnelle
3. Implémenter une gestion cohérente des erreurs 
4. Mettre en place un mécanisme de simulation d'authentification

## Structure Proposée

```javascript
// Structure générale
import { http } from 'msw';
import mockData from './mockData';
import { getAuthHeaders, validateAuth } from './auth-utils'; // Utilitaires à créer

// Constantes partagées
const baseUrl = process.env.REACT_APP_API_URL || '/api';
const AUTH_ERROR = {
  UNAUTHORIZED: { status: 401, message: 'Non authentifié' },
  FORBIDDEN: { status: 403, message: 'Accès non autorisé' },
  TOKEN_EXPIRED: { status: 401, message: 'Token expiré' }
};

export const handlers = [
  // Handlers par catégorie...
];
```

## Catégories de Handlers

### 1. Authentification et Utilisateurs

- `/auth/login` - POST
- `/auth/register` - POST
- `/auth/refresh` - POST
- `/auth/logout` - POST
- `/users/:userId/profile` - GET, PATCH
- `/users/:userId/activities` - GET

### 2. Cols et Météo

- `/cols` - GET (filtrage par région, difficulté)
- `/cols/:id` - GET
- `/cols/search` - GET
- `/weather/col/:colId` - GET
- `/weather/location` - GET (avec params lat, lng)
- `/weather/forecast/:colId/:days` - GET

### 3. Activités

- `/activities` - POST
- `/activities/:id` - GET, PATCH, DELETE

### 4. Défis 7 Majeurs

- `/majeurs7/challenges` - GET
- `/majeurs7/challenges/:id` - GET
- `/users/:userId/majeurs7` - POST
- `/users/:userId/majeurs7/:challengeId` - GET, PATCH

### 5. Entraînement et Nutrition

- `/users/:userId/training/plans` - GET
- `/training/plans/:planId` - GET, PATCH
- `/training/plans` - POST
- `/users/:userId/training/ftp` - GET, POST
- `/users/:userId/nutrition/plan` - GET
- `/nutrition/plans/:planId` - PATCH
- `/nutrition/recipes` - GET 
- `/nutrition/recipes/:recipeId` - GET
- `/users/:userId/nutrition/log` - POST

### 6. Strava et Intégrations

- `/users/:userId/strava/connect` - POST
- `/users/:userId/strava/disconnect` - POST
- `/users/:userId/strava/sync` - POST
- `/users/:userId/strava/status` - GET

### 7. Forum et Communauté

- `/forum/categories` - GET
- `/forum/categories/:categoryId/topics` - GET
- `/forum/topics/:topicId/posts` - GET 
- `/forum/categories/:categoryId/topics` - POST
- `/forum/topics/:topicId/posts` - POST

### 8. Recherche et Divers

- `/search` - GET
- `/cache/stats` - GET
- `/cache/clear` - POST

## Utilitaires d'Authentification à Implémenter

1. **Token Store** - Gestion des tokens en mémoire

```javascript
// auth-utils.js
const tokenStore = {
  tokens: new Map(),
  
  // Enregistrer un token pour un utilisateur
  setToken(userId, token, expiry = 3600000) {
    this.tokens.set(userId, {
      token,
      expiry: Date.now() + expiry
    });
  },
  
  // Vérifier si un token est valide
  isValid(userId, token) {
    const userToken = this.tokens.get(userId);
    return userToken && 
           userToken.token === token && 
           userToken.expiry > Date.now();
  },
  
  // Invalider un token
  invalidate(userId) {
    this.tokens.delete(userId);
  }
};
```

2. **Middleware d'Authentification**

```javascript
// Fonction pour extraire et valider un token d'autorisation
export const validateAuth = (req) => {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader) {
    return { isValid: false, error: AUTH_ERROR.UNAUTHORIZED };
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  // Simuler la validation JWT
  // Dans un cas réel, on décodera le JWT pour obtenir l'utilisateur
  const userId = token.split('-').pop(); // Extraire userId du mock token
  
  if (!tokenStore.isValid(userId, token)) {
    return { isValid: false, error: AUTH_ERROR.TOKEN_EXPIRED };
  }
  
  return { isValid: true, userId };
};
```

## Gestion Cohérente des Erreurs

Utiliser un format standardisé pour toutes les réponses d'erreur :

```javascript
const handleError = (res, ctx, error) => {
  return res(
    ctx.status(error.status),
    ctx.json({
      message: error.message,
      code: error.code || 'ERROR',
      timestamp: new Date().toISOString()
    })
  );
};
```

## Plan d'Implémentation

1. Créer les utilitaires d'authentification (auth-utils.js)
2. Mettre à jour handlers.js par catégorie :
   - Conserver les handlers existants en les adaptant au nouveau format
   - Ajouter les handlers manquants
   - Implémenter le middleware d'authentification pour les endpoints protégés
3. Tester l'ensemble des handlers avec Postman ou depuis l'application

## Prochaine Étape

Après l'implémentation des handlers MSW, nous pourrons passer à la suppression du mocking intrusif en remplaçant les imports de données mockées dans les services par des appels à RealApiOrchestrator.
