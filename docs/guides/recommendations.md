# Documentation du Système de Recommandations

## Vue d'ensemble

Le système de recommandations permet de suggérer des routes cyclables personnalisées aux utilisateurs en fonction de leurs préférences, historique d'activités et des avis d'autres cyclistes. Cette fonctionnalité améliore l'expérience utilisateur en facilitant la découverte de nouveaux parcours adaptés à leurs besoins spécifiques.

## Fonctionnalités principales

### 1. Recommandations personnalisées

- **Basées sur les préférences** : Suggestions adaptées aux préférences de l'utilisateur (distance, dénivelé, difficulté)
- **Basées sur l'historique** : Recommandations en fonction des routes précédemment parcourues
- **Basées sur les revues** : Suggestions influencées par les notes et commentaires d'autres utilisateurs
- **Filtrage contextuel** : Adaptation des recommandations selon la saison, la météo et d'autres facteurs contextuels

### 2. Recherche avancée de routes

- **Filtrage multi-critères** : Recherche de routes selon de nombreux paramètres (région, difficulté, longueur, etc.)
- **Recherche par cols** : Trouver des routes contenant des cols spécifiques
- **Tri intelligent** : Classement des résultats selon la pertinence pour l'utilisateur
- **Filtrage par revues** : Recherche de routes bien notées ou contenant des caractéristiques spécifiques mentionnées dans les revues

### 3. Statistiques et tendances

- **Cols populaires** : Identification des cols les plus appréciés
- **Routes tendance** : Mise en avant des routes gagnant en popularité
- **Statistiques saisonnières** : Évolution des préférences selon les saisons
- **Analyse des commentaires** : Extraction de caractéristiques fréquemment mentionnées dans les revues positives

## Architecture technique

### Services

#### RouteRecommendationService

Gère la génération de recommandations personnalisées, incluant :
- Analyse des préférences utilisateur
- Traitement de l'historique des activités
- Intégration des données de revues
- Application d'algorithmes de recommandation

#### RouteSearchService

Fournit des fonctionnalités de recherche avancée :
- Filtrage multi-critères
- Recherche sémantique dans les revues
- Tri et pagination des résultats
- Optimisation des performances via le cache

#### RouteReviewIntegrationService

Intègre les données de revues dans le système de recommandation :
- Analyse des tendances dans les revues
- Extraction de caractéristiques des routes à partir des commentaires
- Liaison entre les cols européens et les revues
- Calcul de métriques d'affinité entre utilisateurs

### API REST

#### Endpoints pour les recommandations

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/recommendations/personalized` | Récupère des recommandations personnalisées pour l'utilisateur connecté |
| GET | `/api/recommendations/similar/:routeId` | Trouve des routes similaires à une route spécifique |
| GET | `/api/recommendations/trending` | Récupère les routes tendance actuelles |
| GET | `/api/recommendations/seasonal` | Récupère des recommandations adaptées à la saison actuelle |

#### Endpoints pour la recherche avancée

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/recommendations/search` | Recherche avancée avec filtres multiples |
| GET | `/api/recommendations/by-col/:colId` | Trouve des routes contenant un col spécifique |
| GET | `/api/recommendations/popular-cols` | Récupère les statistiques des cols les plus populaires |

## Algorithmes de recommandation

### 1. Filtrage collaboratif

Recommande des routes appréciées par des utilisateurs ayant des préférences similaires :

```javascript
// Pseudo-code de l'algorithme de filtrage collaboratif
function getCollaborativeRecommendations(userId) {
  // 1. Trouver des utilisateurs similaires
  const similarUsers = findSimilarUsers(userId);
  
  // 2. Récupérer les routes bien notées par ces utilisateurs
  const candidateRoutes = getHighlyRatedRoutesByUsers(similarUsers);
  
  // 3. Filtrer les routes déjà parcourues par l'utilisateur
  const newRoutes = filterAlreadyRiddenRoutes(candidateRoutes, userId);
  
  // 4. Calculer un score de recommandation pour chaque route
  const scoredRoutes = calculateRecommendationScores(newRoutes, similarUsers);
  
  // 5. Trier et retourner les meilleures recommandations
  return sortByScore(scoredRoutes);
}
```

### 2. Filtrage basé sur le contenu

Recommande des routes similaires à celles que l'utilisateur a déjà appréciées :

```javascript
// Pseudo-code de l'algorithme de filtrage basé sur le contenu
function getContentBasedRecommendations(userId) {
  // 1. Récupérer les routes appréciées par l'utilisateur
  const likedRoutes = getUserLikedRoutes(userId);
  
  // 2. Extraire les caractéristiques de ces routes
  const userPreferences = extractRouteFeatures(likedRoutes);
  
  // 3. Trouver des routes avec des caractéristiques similaires
  const candidateRoutes = findRoutesWithSimilarFeatures(userPreferences);
  
  // 4. Filtrer les routes déjà parcourues
  const newRoutes = filterAlreadyRiddenRoutes(candidateRoutes, userId);
  
  // 5. Calculer un score de similarité pour chaque route
  const scoredRoutes = calculateSimilarityScores(newRoutes, userPreferences);
  
  // 6. Trier et retourner les meilleures recommandations
  return sortByScore(scoredRoutes);
}
```

### 3. Recommandations hybrides

Combine plusieurs approches pour des recommandations plus précises :

```javascript
// Pseudo-code de l'algorithme hybride
function getHybridRecommendations(userId) {
  // 1. Obtenir les recommandations de chaque algorithme
  const collaborativeRecs = getCollaborativeRecommendations(userId);
  const contentBasedRecs = getContentBasedRecommendations(userId);
  const popularityRecs = getPopularityBasedRecommendations();
  
  // 2. Fusionner les recommandations avec des poids différents
  const hybridRecs = mergeRecommendations([
    { recs: collaborativeRecs, weight: 0.5 },
    { recs: contentBasedRecs, weight: 0.3 },
    { recs: popularityRecs, weight: 0.2 }
  ]);
  
  // 3. Appliquer des filtres contextuels (saison, météo, etc.)
  const contextualizedRecs = applyContextualFilters(hybridRecs, userId);
  
  // 4. Trier et retourner les recommandations finales
  return sortByScore(contextualizedRecs);
}
```

## Utilisation

### Obtenir des recommandations personnalisées

```javascript
// Exemple de requête pour obtenir des recommandations personnalisées
const getPersonalizedRecommendations = async () => {
  try {
    const response = await fetch('/api/recommendations/personalized', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la récupération des recommandations:', error);
    throw error;
  }
};
```

### Rechercher des routes similaires

```javascript
// Exemple de requête pour trouver des routes similaires
const getSimilarRoutes = async (routeId) => {
  try {
    const response = await fetch(`/api/recommendations/similar/${routeId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la recherche de routes similaires:', error);
    throw error;
  }
};
```

### Recherche avancée avec filtres

```javascript
// Exemple de requête pour une recherche avancée
const searchRoutes = async (filters) => {
  try {
    const queryParams = new URLSearchParams(filters).toString();
    const response = await fetch(`/api/recommendations/search?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la recherche de routes:', error);
    throw error;
  }
};
```

## Optimisation des performances

### Stratégies de cache

Le système utilise plusieurs niveaux de cache pour optimiser les performances :

1. **Cache de premier niveau** : Mise en cache des recommandations personnalisées pour chaque utilisateur avec une durée de validité courte (30 minutes)
2. **Cache de second niveau** : Mise en cache des données agrégées et des statistiques avec une durée de validité moyenne (2 heures)
3. **Cache persistant** : Mise en cache des recommandations génériques et des routes populaires avec une durée de validité longue (24 heures)

### Calculs asynchrones

Certains calculs intensifs sont effectués de manière asynchrone :

1. **Pré-calcul des recommandations** : Génération périodique des recommandations en arrière-plan
2. **Mise à jour des statistiques** : Calcul des statistiques de popularité à intervalles réguliers
3. **Analyse des revues** : Traitement asynchrone des nouvelles revues pour mettre à jour les recommandations

## Intégration avec d'autres systèmes

### Système de revues

- Utilisation des notes et commentaires pour affiner les recommandations
- Détection des caractéristiques appréciées ou critiquées dans les revues
- Calcul de la similarité entre utilisateurs basé sur leurs revues

### Données météorologiques

- Adaptation des recommandations en fonction des conditions météorologiques actuelles
- Filtrage des routes déconseillées en cas de mauvais temps
- Suggestion de routes adaptées aux conditions saisonnières

### Données d'entraînement

- Prise en compte du niveau de forme physique de l'utilisateur
- Recommandation de routes adaptées aux objectifs d'entraînement
- Suggestion de progressions basées sur l'historique d'activités

## Évolutions futures

1. **Apprentissage automatique avancé** : Intégration d'algorithmes d'apprentissage automatique plus sophistiqués
2. **Recommandations en temps réel** : Adaptation des recommandations en fonction de la position actuelle de l'utilisateur
3. **Recommandations sociales** : Suggestions basées sur les activités des amis et du réseau social
4. **Recommandations multi-jours** : Génération d'itinéraires sur plusieurs jours pour les voyages à vélo
5. **Intégration d'images** : Utilisation de l'analyse d'images pour identifier les préférences visuelles des utilisateurs

## Dépannage

### Problèmes courants

1. **Recommandations non pertinentes** : S'assurer que l'utilisateur a suffisamment d'historique et de préférences définies
2. **Temps de réponse lent** : Vérifier l'état du cache et les performances du serveur
3. **Résultats de recherche incomplets** : Vérifier les paramètres de filtrage et leur compatibilité

### Support

Pour toute question ou problème concernant le système de recommandations, contacter l'équipe de support à support@euro-cycling-dashboard.eu.
