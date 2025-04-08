# Analyse Comparative : Documentation API vs Implémentation RealApiOrchestrator

Ce document compare les endpoints documentés dans `API_DOCUMENTATION.md` avec leur implémentation dans les fichiers `RealApiOrchestrator`.

## Méthodologie

L'analyse identifie trois catégories de divergences :
1. **Endpoints documentés mais non implémentés** - Présents dans la documentation mais absents de l'implémentation
2. **Endpoints implémentés mais non documentés** - Présents dans l'implémentation mais absents de la documentation
3. **Différences d'implémentation** - Endpoints dont les paramètres, URLs ou méthodes diffèrent entre documentation et implémentation

## Résumé des résultats

| Catégorie | Nombre d'endpoints |
|-----------|-------------------|
| Endpoints documentés | 15 |
| Endpoints implémentés | 46 |
| Documentés mais non implémentés | 4 |
| Implémentés mais non documentés | 35 |
| Différences d'implémentation | 3 |

## Endpoints documentés mais non implémentés

| Endpoint | Méthode | URL documentée | Statut |
|----------|---------|----------------|--------|
| Calculer l'estimation FTP | POST | `/api/training/ftp` | Non implémenté (différent de `updateFTP`) |
| Récupérer les entrainements | GET | `/api/training/workouts` | Non implémenté |
| Créer un entrainement | POST | `/api/training/workouts` | Non implémenté |
| Vérifier l'état de santé du cache | GET | `/api/cache/health` | Non implémenté |

## Endpoints implémentés mais non documentés

| Endpoint | Méthode | URL implémentée | Méthode dans RealApiOrchestrator |
|----------|---------|-----------------|----------------------------------|
| **Forum & Communauté** | | | |
| Récupération des catégories du forum | GET | `/forum/categories` | `getForumCategories()` |
| Récupération des sujets d'une catégorie | GET | `/forum/categories/:categoryId/topics` | `getForumTopics(categoryId, page, pageSize)` |
| Récupération des messages d'un sujet | GET | `/forum/topics/:topicId/posts` | `getForumPosts(topicId, page, pageSize)` |
| Création d'un sujet | POST | `/forum/categories/:categoryId/topics` | `createForumTopic(categoryId, title, content)` |
| Création d'un message | POST | `/forum/topics/:topicId/posts` | `createForumPost(topicId, content)` |
| **Authentification** | | | |
| Connexion | POST | `/auth/login` | `login(email, password)` |
| Inscription | POST | `/auth/register` | `register(userData)` |
| Rafraîchissement de token | POST | `/auth/refresh` | `refreshToken()` |
| Déconnexion | POST | `/auth/logout` | `logout()` |
| **Strava** | | | |
| Connexion Strava | POST | `/users/:userId/strava/connect` | `connectStrava(userId, authCode)` |
| Déconnexion Strava | POST | `/users/:userId/strava/disconnect` | `disconnectStrava(userId)` |
| Synchronisation des activités Strava | POST | `/users/:userId/strava/sync` | `syncStravaActivities(userId)` |
| **Défis 7 Majeurs** | | | |
| Récupération de tous les défis | GET | `/majeurs7/challenges` | `getAllMajeurs7Challenges()` |
| Récupération d'un défi spécifique | GET | `/majeurs7/challenges/:id` | `getMajeurs7Challenge(id)` |
| Démarrage d'un défi | POST | `/users/:userId/majeurs7` | `startMajeurs7Challenge(userId, challengeId)` |
| Récupération de la progression | GET | `/users/:userId/majeurs7/:challengeId` | `getMajeurs7Progress(userId, challengeId)` |
| Mise à jour de la progression | PATCH | `/users/:userId/majeurs7/:challengeId` | `updateMajeurs7Progress(userId, progress)` |
| **Nutrition** | | | |
| Récupération des recettes | GET | `/nutrition/recipes` | `getNutritionRecipes(query, tags)` |
| Récupération d'une recette | GET | `/nutrition/recipes/:recipeId` | `getNutritionRecipe(recipeId)` |
| Mise à jour du plan nutritionnel | PATCH | `/nutrition/plans/:planId` | `updateNutritionPlan(planId, data)` |
| Création d'une entrée de journal | POST | `/users/:userId/nutrition/log` | `createNutritionLogEntry(log)` |
| **Entraînement** | | | |
| Récupération des plans d'entraînement | GET | `/users/:userId/training/plans` | `getUserTrainingPlans(userId)` |
| Récupération d'un plan d'entraînement | GET | `/training/plans/:planId` | `getTrainingPlan(planId)` |
| Création d'un plan d'entraînement | POST | `/training/plans` | `createTrainingPlan(plan)` |
| Mise à jour d'un plan d'entraînement | PATCH | `/training/plans/:planId` | `updateTrainingPlan(planId, data)` |
| Mise à jour de la FTP | POST | `/users/:userId/training/ftp` | `updateFTP(userId, value, method)` |
| Récupération de l'historique FTP | GET | `/users/:userId/training/ftp` | `getFTPHistory(userId)` |
| **Météo** | | | |
| Météo par coordonnées | GET | `/weather/location` | `getLocationWeather(lat, lng)` |
| **Activités** | | | |
| Récupération des activités d'un utilisateur | GET | `/users/:userId/activities` | `getUserActivities(userId, page, pageSize)` |
| Création d'une activité | POST | `/activities` | `createActivity(activity)` |
| Récupération d'une activité | GET | `/activities/:id` | `getActivity(id)` |
| Mise à jour d'une activité | PATCH | `/activities/:id` | `updateActivity(id, data)` |
| Suppression d'une activité | DELETE | `/activities/:id` | `deleteActivity(id)` |
| **Recherche** | | | |
| Recherche globale | GET | `/search` | `searchGlobal(query)` |

## Différences d'implémentation

| Endpoint | Documentation | Implémentation | Différence |
|----------|---------------|----------------|------------|
| Récupérer un profil utilisateur | GET `/api/users/:id` | GET `/users/:userId/profile` | URL différente et paramètre différent (`:id` vs `:userId`) |
| Mettre à jour un profil utilisateur | PUT `/api/users/:id` | PATCH `/users/:userId/profile` | Méthode différente (PUT vs PATCH) et URL différente |
| Météo actuelle pour un col | GET `/api/weather/current/:colId` | GET `/weather/col/:colId` | URL différente (`/api/weather/current/:colId` vs `/weather/col/:colId`) |

## Analyse et Recommandations

### Documentation à mettre à jour

La documentation API actuelle est incomplète et ne couvre pas plusieurs fonctionnalités majeures :

1. **Forum & Communauté** - Aucun endpoint documenté
2. **Authentification** - Flux complet d'authentification non documenté
3. **Strava** - Détails d'intégration mentionnés mais endpoints non documentés
4. **Défis 7 Majeurs** - Fonctionnalité non documentée
5. **Nutrition & Entraînement** - Documentation partielle

### Implémentation à vérifier

Plusieurs incohérences ont été identifiées entre la documentation et l'implémentation :

1. **Endpoints manquants** - Certains endpoints documentés ne sont pas implémentés, notamment ceux liés aux entrainements et à la gestion du cache
2. **Différences de structure d'URL** - Plusieurs URLs diffèrent entre documentation et implémentation
3. **Différences de méthodes HTTP** - Certains endpoints utilisent des méthodes différentes (PUT vs PATCH)
4. **Base URL non standard** - La documentation utilise `/api/...` comme préfixe alors que l'implémentation n'utilise pas ce préfixe

### Problèmes potentiels pour la validation

1. **Cohérence des URLs** - La différence dans la structure des URLs pourrait causer des erreurs 404
2. **Méthodes HTTP** - L'utilisation de PATCH au lieu de PUT pourrait causer des problèmes si le backend attend spécifiquement PUT
3. **FTP et Entrainements** - Discordance majeure entre documentation et implémentation

## Plan d'action

1. Mettre à jour `API_DOCUMENTATION.md` pour inclure tous les endpoints implémentés

2. Vérifier la correspondance exacte des URLs, paramètres et types de retour

3. Standardiser les noms d'endpoints et structures de réponse

4. Documenter les formats de payload pour les méthodes POST/PUT

5. Ajouter les informations d'authentification requise pour chaque endpoint

6. Tester en priorité les endpoints publics (cols, météo) pour valider le fonctionnement de base

7. Tester ensuite l'authentification pour vérifier le flux complet

8. Détecter les divergences entre la structure de données attendue et retournée

## Inconsistances Identifiées

Les inconsistances suivantes ont été identifiées entre la documentation API et l'implémentation réelle :

1. Endpoints manquants dans la documentation :
   - `/api/activity/favorites` : Gestion des activités favorites
   - `/api/nutrition/search` : Recherche avancée de recettes
   - `/api/cols/nearby` : Recherche de cols à proximité

2. Endpoints documentés mais non implémentés :
   - `/api/user/preferences/export` : Export des préférences utilisateur
   - `/api/training/share` : Partage de programmes d'entraînement

## Objectifs

Cette documentation vise à :

1. Documenter les divergences entre la documentation API et l'implémentation

2. Fournir un plan de mise à jour pour harmoniser les deux

3. Définir les responsabilités pour la mise à jour et la maintenance
