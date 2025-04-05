# Documentation Technique - Grand Est Cyclisme Website

## Architecture Globale

Le site web Grand Est Cyclisme est construit selon une architecture moderne MERN (MongoDB, Express, React, Node.js) avec une séparation claire entre le frontend et le backend. Le système utilise une approche API-first, permettant l'évolutivité et la maintenance à long terme.

```
┌─────────────────┐      ┌─────────────────────┐      ┌─────────────────┐
│                 │      │                     │      │                 │
│  Client React   │◄────►│  API Express/Node   │◄────►│  MongoDB Atlas  │
│                 │      │                     │      │                 │
└─────────────────┘      └─────────────────────┘      └─────────────────┘
        ▲                          ▲                           
        │                          │                           
        │                          │                           
        ▼                          ▼                           
┌─────────────────┐      ┌─────────────────────┐      
│                 │      │                     │      
│  Services tiers │      │  Services internes  │      
│  (Strava, etc.) │      │                     │      
│                 │      │                     │      
└─────────────────┘      └─────────────────────┘      
```

## Structure du Code

### Backend (Server)

Le backend est organisé en plusieurs couches suivant les principes de la clean architecture:

1. **Routes** (`/server/routes/`) - Définissent les endpoints API
2. **Controllers** (`/server/controllers/`) - Gèrent les requêtes HTTP et les réponses
3. **Services** (`/server/services/`) - Contiennent la logique métier
4. **Models** (`/server/models/`) - Définissent les schémas de données MongoDB
5. **Middlewares** (`/server/middleware/`) - Gèrent l'authentification, la validation, etc.
6. **Utils** (`/server/utils/`) - Fonctions utilitaires réutilisables
7. **Config** (`/server/config/`) - Configuration de l'application

### Frontend (Client)

Le frontend utilise React avec une architecture de composants modulaires:

1. **Components** (`/client/src/components/`) - Composants réutilisables organisés par fonctionnalité
2. **Pages** (`/client/src/pages/`) - Composants de niveau page
3. **Services** (`/client/src/services/`) - Interactions avec l'API
4. **Hooks** (`/client/src/hooks/`) - Custom hooks React
5. **Utils** (`/client/src/utils/`) - Fonctions utilitaires
6. **Layouts** (`/client/src/layouts/`) - Structures de mise en page réutilisables
7. **i18n** (`/client/src/i18n/`) - Internationalisation

## Modules Principaux

### 1. Système d'Authentification et Autorisation

Le système utilise JWT (JSON Web Tokens) pour l'authentification des utilisateurs. Les tokens sont stockés dans le localStorage et inclus dans les entêtes des requêtes API.

**Fichiers clés:**
- `/server/services/authService.js` - Logique d'authentification côté serveur
- `/client/src/services/authService.js` - Gestion de l'authentification côté client
- `/client/src/contexts/AuthContext.js` - Contexte React pour la gestion de l'état d'authentification
- `/server/middleware/auth.middleware.js` - Middleware de vérification des tokens

### 2. Système de Cartographie et Parcours

Le module de cartographie utilise Mapbox GL pour l'affichage des cartes et l'analyse des parcours cyclistes. Il s'intègre avec des services tiers pour les données d'élévation et de route.

**Fichiers clés:**
- `/client/src/components/maps/` - Composants de carte
- `/server/services/advanced-mapping.service.js` - Traitement avancé des données cartographiques
- `/server/models/route-planner.model.js` - Modèle de données pour les parcours

### 3. Analyse de Performance

Ce module analyse les données d'entraînement des cyclistes pour fournir des insights et des recommandations.

**Fichiers clés:**
- `/client/src/components/training/` - Composants d'interface utilisateur
- `/server/services/performance-analysis.service.js` - Analyses de performance
- `/server/services/training-zones.service.js` - Calcul des zones d'entraînement

### 4. Nutrition et Entraînement

Ce module intègre les données nutritionnelles avec les plans d'entraînement pour des recommandations personnalisées.

**Fichiers clés:**
- `/client/src/components/nutrition/` - Composants d'interface utilisateur
- `/server/services/nutrition.service.js` - Services de nutrition
- `/server/models/nutrition.model.js` - Modèle de données nutritionnelles
- `/client/src/components/nutrition/NutritionTrainingIntegration.js` - Composant d'intégration

### 5. Intégration Strava

Permet aux utilisateurs de connecter leurs comptes Strava pour importer leurs activités cyclistes.

**Fichiers clés:**
- `/client/src/services/stravaService.js` - Intégration Strava côté client
- `/server/services/strava.service.js` - Intégration Strava côté serveur
- `/server/services/strava-data-refresh.service.js` - Actualisation des données Strava

### 6. Visualisation 3D

Offre des visualisations 3D des parcours cyclistes.

**Fichiers clés:**
- `/client/src/components/visualization/` - Composants de visualisation
- `/server/models/visualization.model.js` - Modèle de données pour la visualisation
- `/client/src/services/visualization.service.js` - Service de visualisation

## Flux de Données

### Exemple: Parcours Cycliste

1. L'utilisateur crée un parcours via l'interface de carte
2. Les données sont envoyées à l'API (`POST /api/routes`)
3. Le serveur traite les données avec `route-planner.model.js`
4. Les services associés calculent les métriques (élévation, difficulté)
5. Le parcours est enregistré dans MongoDB
6. L'API renvoie les données complètes au client
7. Le client affiche le parcours et ses détails

### Exemple: Analyse de Performance

1. L'utilisateur charge son tableau de bord de performance
2. Le client demande les données via l'API (`GET /api/training/performance/:userId`)
3. Le serveur récupère les activités de l'utilisateur
4. `performance-analysis.service.js` calcule les métriques clés
5. Les résultats sont renvoyés au client
6. Le client affiche les graphiques et recommandations

## Modules d'Intégration

### Intégration Nutrition-Entraînement

Ce module nouvellement développé connecte:
- Les données d'entraînement de l'utilisateur
- Les besoins nutritionnels calculés
- Le système de détection de surmenage

L'intégration se fait via:
- Des appels entre services côté serveur
- Le composant `NutritionTrainingIntegration.js` côté client
- Un état partagé dans le tableau de bord principal

## Stratégies de Cache et Performance

- **Redis** est utilisé pour le cache de données fréquemment accédées
- Les calculs intensifs (comme l'analyse de parcours) sont mis en cache
- Les données météo et de qualité d'air sont actualisées selon un calendrier

## Gestion des Erreurs

- Toutes les API renvoient des erreurs structurées avec codes HTTP appropriés
- Le client utilise un système de notification pour afficher les erreurs
- Les erreurs serveur sont journalisées dans un système centralisé

## Sécurité

- Authentification JWT avec refresh tokens
- Validation des données côté serveur et client
- Protection CSRF
- Rate limiting pour prévenir les abus
- Échappement des données utilisateur

## Internationalisation

- Utilisation de react-i18next pour la traduction
- Fichiers de traduction stockés dans `/client/src/i18n/locales/`
- Support actuel pour Français et Anglais

## Tests

- Tests unitaires avec Jest
- Tests d'intégration avec Supertest
- Tests frontend avec React Testing Library
- Tests end-to-end avec Cypress

## Déploiement

- CI/CD via GitHub Actions
- Déploiement sur Hostinger pour la production
- Environnements de développement, staging et production
- Containers Docker pour la cohérence entre environnements

## Maintenance et Dépendances

- Les dépendances sont gérées via npm
- Mises à jour régulières prévues pour les bibliothèques tierces
- Suivi des vulnérabilités avec npm audit

## Contribution au Projet

Pour contribuer au projet:
1. Cloner le dépôt
2. Installer les dépendances avec `npm install`
3. Créer une branche pour la fonctionnalité (`feature/nom-fonctionnalite`)
4. Soumettre une pull request vers la branche `develop`

Toutes les contributions doivent suivre les normes de codage établies et inclure des tests appropriés.
