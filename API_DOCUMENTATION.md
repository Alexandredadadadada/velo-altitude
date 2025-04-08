# Documentation API Velo-Altitude

## Introduction

Cette documentation décrit les API utilisées par le frontend de Velo-Altitude pour communiquer avec le backend et les services externes. Elle est destinée aux développeurs travaillant sur le projet.

## Configuration des API

Le projet utilise plusieurs APIs externes et internes, toutes configurées via des variables d'environnement dans Netlify:

- Auth0 pour l'authentification
- Mapbox pour la cartographie 
- OpenWeather pour les prévisions météo
- Strava pour les données d'activité
- OpenAI et Claude pour les recommandations personnalisées
- MongoDB comme base de données

## Architecture Backend Optimisée

Le backend de Velo-Altitude a été optimisé avec plusieurs services clés qui améliorent les performances, la sécurité et la fiabilité :

### 1. Service de Cache

Le système de cache implémente plusieurs mécanismes avancés :

- **Cache segmenté** : Différents types de données (nutrition, entraînement, Strava, etc.) sont stockés dans des segments distincts
- **TTL (Time To Live)** : Chaque type de données a une durée de vie configurée indépendamment
- **Éviction LRU** : Les données les moins récemment utilisées sont évincées en priorité
- **Invalidation sélective** : Possibilité d'invalider tout le cache ou un segment spécifique

```js
// Exemple d'utilisation du cache pour les APIs
this.getCachedData<NutritionPlan>(cacheKey, 'nutrition');
this.setCachedData(cacheKey, data, 'nutrition');
this.clearCache('nutrition');
```

### 2. Middleware de Sécurité

- Limitation de débit (rate limiting) pour prévenir les attaques par force brute
- Validation des entrées pour bloquer les injections
- En-têtes de sécurité (HSTS, CSP, etc.)
- Sanitization des données

### 3. Authentification Avancée

- Vérification JWT avec liste noire de tokens révoqués
- Contrôle d'accès basé sur les rôles (RBAC)
- Authentification d'urgence en cas de panne Auth0

### 4. Monitoring des Performances

- Suivi en temps réel des performances API
- Journalisation des erreurs
- Collecte de métriques système

## Points d'API du Backend

### API des Cols

```
GET /api/cols - Récupérer tous les cols
GET /api/cols/:id - Récupérer un col spécifique
GET /api/cols/search - Rechercher des cols par critères
```

### API des Défis

```
GET /api/challenges - Récupérer tous les défis
GET /api/challenges/:userId - Récupérer les défis d'un utilisateur
POST /api/challenges - Créer un nouveau défi
PUT /api/challenges/:id - Mettre à jour un défi
DELETE /api/challenges/:id - Supprimer un défi
```

### API d'Utilisateurs

```
GET /api/users/:id - Récupérer un profil utilisateur
PUT /api/users/:id - Mettre à jour un profil utilisateur
```

### API d'Entrainement

```
POST /api/training/ftp - Calculer l'estimation FTP
GET /api/training/workouts - Récupérer les entrainements
POST /api/training/workouts - Créer un entrainement
```

### API de Gestion du Cache

```
GET /api/cache/stats - Obtenir les statistiques du cache (taille, hit ratio, etc.)
POST /api/cache/clear - Vider le cache (peut accepter un paramètre 'type')
GET /api/cache/health - Vérifier l'état de santé du cache
```

### API Météo

```
GET /api/weather/current/:colId - Météo actuelle pour un col spécifique
GET /api/weather/forecast/:colId - Prévisions pour un col spécifique
GET /api/weather/history/:colId - Historique météo pour un col
```

## Intégrations Externes

### Mapbox

Utilisé pour toutes les visualisations cartographiques et le rendu 3D des cols.

### Strava

L'intégration Strava utilise OAuth 2.0 pour l'authentification avec gestion avancée des tokens :
1. Redirection vers l'autorisation Strava
2. Callback vers notre application
3. Échange du code d'autorisation pour un token d'accès (côté serveur pour sécurité)
4. Gestion automatique du rafraîchissement des tokens expirés
5. Mise en cache des données Strava pour réduire les appels API

### OpenWeather

Utilisé pour afficher les prévisions météo spécifiques pour chaque col, avec cache optimisé pour réduire les appels API.

## Orchestration API et Gestion de Cache

Le frontend utilise un `APIOrchestrator` qui gère la communication avec toutes les APIs et implémente un système de cache local pour optimiser les performances :

```typescript
// Exemple de méthode avec cache dans APIOrchestrator
async getNutritionLogEntries(date: string): Promise<NutritionLog[]> {
  // Vérifier si les données sont en cache
  const cacheKey = `nutrition:log:${date}`;
  const cachedData = this.getCachedData<NutritionLog[]>(cacheKey, 'nutrition');
  
  if (cachedData) {
    console.log(`Utilisation des entrées du journal nutritionnel en cache pour la date ${date}`);
    return cachedData;
  }
  
  // Si pas en cache, appeler l'API
  const response = await axios.get(`${this.apiBaseUrl}/nutrition/log?date=${date}`);
  
  // Mettre en cache les données récupérées
  this.setCachedData(cacheKey, response.data);
  return response.data;
}
```

## Sécurité des API

Toutes les requêtes API authentifiées doivent inclure un token JWT dans l'en-tête:

```
Authorization: Bearer <token>
```

Les tokens sont obtenus via le flux d'authentification Auth0 ou le système de secours implémenté.

## Bonnes Pratiques pour l'Utilisation des APIs

1. **Utiliser le cache** : Privilégier l'utilisation des méthodes de l'APIOrchestrator qui intègrent le cache
2. **Gestion des erreurs** : Toujours implémenter une gestion des erreurs robuste pour chaque appel API
3. **Invalidation du cache** : Après une mutation de données (POST/PUT/DELETE), invalider le segment de cache correspondant
4. **Limitation des appels parallèles** : Éviter les appels multiples simultanés à la même ressource

## Surveillance et Résolution des Problèmes

### Outils de Monitoring

L'application intègre plusieurs outils de surveillance :

- **PerformanceMonitor** : Trace des métriques de performance frontend
- **APIMonitor** : Surveille les appels API et leurs performances
- **ErrorTracker** : Capture et agrège les erreurs

### Résolution des Problèmes Courants

- **Erreurs 401/403** : Vérifier l'authentification et les droits d'accès
- **Problèmes de cache** : Utiliser l'endpoint `/api/cache/stats` pour diagnostiquer
- **Lenteurs API** : Consulter les logs de monitoring pour identifier les goulots d'étranglement
