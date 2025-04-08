# Rapport de Validation API - Velo-Altitude

## Introduction

Ce document contient les résultats de validation manuelle des APIs Velo-Altitude, réalisée le 7 avril 2025.
La validation a été effectuée en désactivant MSW (Mock Service Worker) et en testant directement avec le backend réel.

## Configuration de test

- MSW désactivé dans `client/src/index.js`
- Utilisation de `RealApiOrchestrator.ts`
- Utilisation des outils de développement du navigateur pour inspecter les requêtes
- Utilisation de l'utilitaire `browser-api-tester.js` pour tests systématiques

## Résumé

- **Endpoints publics**: 0/0 réussis
- **Endpoints protégés**: 0/0 réussis
- **Total**: 0/0 réussis (0%)

*Note: Cette section sera mise à jour automatiquement après l'exécution des tests*

## Tests des endpoints publics

### `getAllCols()`
- **Endpoint**: `/api/cols`
- **Méthode**: GET
- **Statut**: ⏳ En attente
- **Format de réponse**: *À compléter*
- **Notes**: *À compléter*

### `getColById(id)`
- **Endpoint**: `/api/cols/{id}`
- **Méthode**: GET
- **Statut**: ⏳ En attente
- **Format de réponse**: *À compléter*
- **Notes**: *À compléter*

### `searchCols(query)`
- **Endpoint**: `/api/cols/search?q={query}`
- **Méthode**: GET
- **Statut**: ⏳ En attente
- **Format de réponse**: *À compléter*
- **Notes**: *À compléter*

### `getColsByRegion(region)`
- **Endpoint**: `/api/cols?region={region}`
- **Méthode**: GET
- **Statut**: ⏳ En attente
- **Format de réponse**: *À compléter*
- **Notes**: *À compléter*

### `getColsByDifficulty(difficulty)`
- **Endpoint**: `/api/cols?difficulty={difficulty}`
- **Méthode**: GET
- **Statut**: ⏳ En attente
- **Format de réponse**: *À compléter*
- **Notes**: *À compléter*

### `getColWeather(colId)`
- **Endpoint**: `/api/weather/col/{colId}`
- **Méthode**: GET
- **Statut**: ⏳ En attente
- **Format de réponse**: *À compléter*
- **Notes**: *À compléter*

### `getWeatherForecast(colId, days)`
- **Endpoint**: `/api/weather/col/{colId}/forecast?days={days}`
- **Méthode**: GET
- **Statut**: ⏳ En attente
- **Format de réponse**: *À compléter*
- **Notes**: *À compléter*

### `getAllMajeurs7Challenges()`
- **Endpoint**: `/api/majeurs7/challenges`
- **Méthode**: GET
- **Statut**: ⏳ En attente
- **Format de réponse**: *À compléter*
- **Notes**: *À compléter*

## Tests des endpoints protégés

### `getUserProfile(userId)`
- **Endpoint**: `/api/users/{userId}/profile`
- **Méthode**: GET
- **Statut**: ⏳ En attente
- **Format de réponse**: *À compléter*
- **En-têtes d'authentification**: *À compléter*
- **Notes**: *À compléter*

### `updateUserProfile(userId, profileData)`
- **Endpoint**: `/api/users/{userId}/profile`
- **Méthode**: PATCH
- **Statut**: ⏳ En attente
- **Format de réponse**: *À compléter*
- **En-têtes d'authentification**: *À compléter*
- **Notes**: *À compléter*

### `getUserActivities(userId, page, pageSize)`
- **Endpoint**: `/api/users/{userId}/activities`
- **Méthode**: GET
- **Statut**: ⏳ En attente
- **Format de réponse**: *À compléter*
- **En-têtes d'authentification**: *À compléter*
- **Notes**: *À compléter*

### `getUserTrainingPlans(userId)`
- **Endpoint**: `/api/users/{userId}/training/plans`
- **Méthode**: GET
- **Statut**: ⏳ En attente
- **Format de réponse**: *À compléter*
- **En-têtes d'authentification**: *À compléter*
- **Notes**: *À compléter*

### `getUserNutritionPlan(userId)`
- **Endpoint**: `/api/users/{userId}/nutrition/plan`
- **Méthode**: GET
- **Statut**: ⏳ En attente
- **Format de réponse**: *À compléter*
- **En-têtes d'authentification**: *À compléter*
- **Notes**: *À compléter*

### `getMajeurs7Progress(userId, challengeId)`
- **Endpoint**: `/api/majeurs7/users/{userId}/challenges/{challengeId}/progress`
- **Méthode**: GET
- **Statut**: ⏳ En attente
- **Format de réponse**: *À compléter*
- **En-têtes d'authentification**: *À compléter*
- **Notes**: *À compléter*

### `getFTPHistory(userId)`
- **Endpoint**: `/api/users/{userId}/ftp/history`
- **Méthode**: GET
- **Statut**: ⏳ En attente
- **Format de réponse**: *À compléter*
- **En-têtes d'authentification**: *À compléter*
- **Notes**: *À compléter*

## Analyse des requêtes HTTP

*Cette section sera remplie automatiquement après l'exécution des tests*

## Conclusions et discrepancies

*À compléter après les tests*

## Recommandations

*À compléter après les tests*
