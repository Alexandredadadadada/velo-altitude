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
- **Priorisation intelligente** : Stratégies configurables (fréquence, récence, hybride) par segment

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
- Intégration avec le système de monitoring frontend avancé
- Tableaux de bord unifiés pour les métriques frontend et backend

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
POST /api/cache/configure - Configurer les stratégies de cache par segment
```

### API de Monitoring de Performance

```
POST /api/monitoring - Envoyer des métriques de performance frontend
GET /api/monitoring/stats - Obtenir les statistiques agrégées de performance
GET /api/monitoring/report - Générer un rapport de performance complet
POST /api/monitoring/threshold - Configurer les seuils d'alerte
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

## Système de Monitoring de Performance Avancé

L'application implémente un système de monitoring avancé pour optimiser l'expérience utilisateur :

### 1. Composants du Système de Monitoring

- **EnhancedPerformanceMonitoring** : Suivi détaillé des Web Vitals, interactions utilisateur, et performances des ressources
- **RouteOptimizer** : Analyse des modèles de navigation et préchargement intelligent
- **PerformanceContext** : Accès global aux outils de monitoring via React Context
- **Performance Dashboard** : Visualisation en temps réel des métriques de performance

### 2. Métriques Collectées

- **Web Vitals** : LCP, FID, CLS, TTFB, etc.
- **Interactions utilisateur** : Temps de réponse, délais de rendu
- **Chargement des ressources** : Durées de chargement, tailles
- **Performance du cache** : Taux de succès, économies de temps
- **Métriques spécifiques à Velo-Altitude** : 
  - Temps de rendu de la visualisation 3D des cols
  - Temps de calcul des itinéraires
  - Performance des synchronisations Strava

```typescript
// Exemple d'utilisation du système de monitoring
import { usePerformance } from '../contexts/PerformanceContext';

const MyComponent = () => {
  const performance = usePerformance();
  
  useEffect(() => {
    // Mesurer le temps de chargement de la page
    performance.trackPageLoad('my_component');
    
    // Mesurer les interactions utilisateur
    performance.trackInteraction('click', 'submit_button');
    
    return () => {
      performance.trackPageUnload('my_component');
    };
  }, []);
  
  // ...
};
```

### 3. Optimisation du Routing

Le système d'optimisation de routing utilise les modèles de navigation pour améliorer les performances :

- **Préchargement adaptatif** : Précharge les routes en fonction des habitudes de navigation
- **Analyse de connexion** : Identifie les "chemins" communs entre les pages
- **Préchargement des ressources critiques** : Charge à l'avance les ressources nécessaires aux pages fréquemment visitées

## Correctifs Lint & Nettoyage Code (15/04/2025)

- Suppression des imports/variables inutiles dans les endpoints d'API.
- Refactoring des middlewares pour éviter tout code unreachable.
- Clarification des opérateurs logiques dans les contrôleurs.

**À surveiller** :
- Vérifier la cohérence des routes API après chaque refactor.
- Relancer les tests d'intégration API après chaque modification majeure.

## Mise à jour du 16 avril 2025

- L’API est déployée sur Render : https://velo-altitude-api.onrender.com
- Toutes les variables d’environnement sensibles sont gérées côté Render et Netlify
- Les procédures de déploiement et de connexion front/back sont documentées dans DEPLOYMENT.md

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
5. **Monitoring intégré** : Utiliser le système de monitoring pour tracer les performances des appels API

## Surveillance et Résolution des Problèmes

### Outils de Monitoring

L'application intègre plusieurs outils de surveillance :

- **PerformanceMonitor** : Trace des métriques de performance frontend
- **APIMonitor** : Surveille les appels API et leurs performances
- **ErrorTracker** : Capture et agrège les erreurs
- **Performance Dashboard** : Tableau de bord visuel pour l'analyse des performances
- **Collecteur de métriques de référence** : Établit une base de performance pour comparaison

### Résolution des Problèmes Courants

- **Erreurs 401/403** : Vérifier l'authentification et les droits d'accès
- **Problèmes de cache** : Utiliser l'endpoint `/api/cache/stats` pour diagnostiquer
- **Lenteurs API** : Consulter les logs de monitoring pour identifier les goulots d'étranglement
- **Problèmes de performance frontend** : Utiliser le Performance Dashboard dans `/admin/performance`

### Mécanisme de Rollback

L'application implémente un système de rollback automatique en cas de dégradation des performances :

- Sauvegarde de l'état avant chaque déploiement de fonctionnalité
- Surveillance des métriques de performance après déploiement
- Rollback automatique si les performances se dégradent au-delà des seuils configurés

## Nouveautés API – Sprint Excellence 2025

## Nouvelles routes et améliorations

- Ajout d’API batch pour l’import massif de cols, trainings, recettes
- Documentation OpenAPI enrichie pour chaque nouvelle route
- Ajout de la gestion avancée des erreurs (retours structurés, messages utilisateur)
- Endpoints pour la météo dynamique et la nutrition intelligente
- Ajout de la pagination, du filtrage et de la recherche avancée sur toutes les entités

## Standards de Qualité

- 100% TypeScript pour tous les nouveaux endpoints
- Tests automatisés requis pour chaque route
- Versionnage d’API et dépréciation documentée

## Exemples d’utilisation

```http
POST /api/cols/batch-import
POST /api/training/batch-import
POST /api/recipes/batch-import
GET /api/cols?region=Alpes&difficulty=4
```

---

Pour toute contribution, se référer à la documentation OpenAPI jointe et respecter les conventions d’excellence technique.
