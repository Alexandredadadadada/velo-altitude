# Architecture Technique de Velo-Altitude

## Vue d'Ensemble
- **Objectif** : Documentation détaillée de l'architecture technique de Velo-Altitude
- **Contexte** : Plateforme complète de cyclisme de montagne avec multiples modules intégrés
- **Portée** : Front-end, back-end, base de données, services tiers et infrastructure

## Architecture Globale

### Stack Technique Principal
- **Front-end** : React 18, Material UI 5, Redux Toolkit
- **Back-end** : Node.js, Express
- **Base de données** : MongoDB (principale), Redis (cache et sessions)
- **Service d'authentification** : Auth0
- **Services cartographiques** : Mapbox
- **Hosting** : Netlify (front-end), Heroku (back-end)
- **CI/CD** : GitHub Actions

### Diagramme d'Architecture Haut Niveau
```
┌──────────────────┐      ┌──────────────────────────────────┐
│                  │      │                                  │
│  Client React    │◄────►│  API Gateway / BFF (Node.js)     │
│  (SPA)           │      │                                  │
│                  │      └─────────────┬────────────────────┘
└──────────────────┘                    │
                                        ▼
┌──────────────────┐      ┌──────────────────────────────────┐
│                  │      │                                  │
│  CDN             │◄────►│  Microservices                   │
│  (Cloudflare)    │      │  (Modules spécialisés)           │
│                  │      │                                  │
└──────────────────┘      └─────────────┬────────────────────┘
                                        │
                                        ▼
┌──────────────────┐      ┌──────────────────────────────────┐
│  Services Tiers  │      │                                  │
│  - Mapbox        │◄────►│  Base de données                 │
│  - Auth0         │      │  - MongoDB (principal)           │
│  - OpenWeather   │      │  - Redis (cache)                 │
│  - Strava        │      │                                  │
└──────────────────┘      └──────────────────────────────────┘
```

## Architecture Front-end

### Structure des Applications
- **Application Principale (Single Page Application)**
  - Architecture basée sur les modules fonctionnels
  - Routing avec React Router v6
  - Gestion d'état avec Redux Toolkit et Context API

### Gestion des États
- **Redux** : Pour l'état global (utilisateur, préférences, données partagées)
- **Context API** : Pour l'état au niveau des modules
- **React Query** : Pour la gestion du cache et des requêtes API
- **localStorage/sessionStorage** : Pour la persistance locale

### Composants et Design System
- Architecture par composants avec séparation claire:
  - Composants d'UI atomiques (boutons, champs, icônes)
  - Composants composites (cartes, panneaux, modals)
  - Layouts (grilles, conteneurs)
  - Templates (structures de pages)
  - Pages (assemblages complets)

### Performance Frontend
- Code splitting automatique par routes
- Lazy loading des composants non-critiques
- Pré-chargement des routes probables
- Optimisation des images avec WebP et srcset
- Service Workers pour caching stratégique
- SSR pour SEO (pages principales uniquement)

## Architecture Back-end

### Structure API
- **API RESTful**
  - Versioning via URL (/api/v1/)
  - Authentification par JWT
  - Réponses standardisées (JSend)

- **Services principaux**
  - Service Utilisateurs et Authentification
  - Service Cols et Données géographiques
  - Service Entraînement et Données Fitness
  - Service Nutrition
  - Service Communauté et Social

### Sécurité
- Authentification via Auth0 (OAuth 2.0 / OIDC)
- Validation des entrées avec Joi / express-validator
- Protection CSRF pour endpoints sensibles
- Rate limiting pour prévenir les abus
- Validation des JWT côté serveur
- Headers de sécurité (Helmet)

### Performance Backend
- Stratégies de cache à multiples niveaux
  - Cache en mémoire (court terme)
  - Cache Redis (moyen terme)
  - Cache HTTP avec ETags et Last-Modified
- Compression des réponses (gzip/brotli)
- Pooling de connexions DB
- Optimisation des requêtes MongoDB

## Gestion des Données

### Base de Données
- **MongoDB** comme stockage principal
  - Collections organisées par domaine fonctionnel
  - Schémas validés via Mongoose
  - Indexation pour optimisation des requêtes fréquentes
  - Modèle de cohérence ajusté par cas d'usage

### Modèle de Données (Collections Principales)
- **users**: Informations utilisateurs et préférences
- **cols**: Catalogue des cols avec métadonnées
- **workouts**: Séances d'entraînement et plans
- **nutrition**: Recettes et plans nutritionnels
- **challenges**: Défis (dont "7 Majeurs")
- **activities**: Activités enregistrées/importées
- **social**: Interactions communautaires

### Intégration de Données Externes
- **Strava API**
  - Authentification OAuth
  - Synchronisation bidirectionnelle des activités
  - Webhooks pour mises à jour en temps réel

- **Mapbox**
  - Affichage cartographique
  - Calcul d'itinéraires
  - Données d'élévation

- **OpenWeather**
  - Conditions météo actuelles
  - Prévisions pour les cols
  - Historique météorologique

## Infrastructure

### Environnements
- **Développement** : Local + services mock
- **Test** : Environnement isolé pour tests automatisés
- **Staging** : Réplique de production avec données de test
- **Production** : Environnement public hautement disponible

### Déploiement
- **Frontend** : Netlify avec déploiements automatiques
- **Backend** : Heroku avec scaling automatique
- **CI/CD** : GitHub Actions pour tests et déploiements

### Monitoring et Observabilité
- Application Performance Monitoring (New Relic)
- Logging centralisé (Papertrail)
- Monitoring utilisateur réel (Google Analytics)
- Alertes et dashboards (Grafana + Prometheus)

## Communication Inter-Services

### Synchrone
- REST API pour la majorité des communications
- GraphQL pour requêtes complexes (dashboard)

### Asynchrone
- Webhooks pour intégrations tierces
- Socket.io pour fonctionnalités temps réel (messagerie, notifications)
- Files d'attente Redis pour tâches asynchrones

## Considérations Techniques

### Scalabilité
- Architecture sans état pour faciliter le scaling horizontal
- Décomposition par domaines fonctionnels
- Mise en cache stratégique des données fréquemment accédées
- Pagination et limites pour endpoints à volume élevé

### Disponibilité
- Stratégie de fallback pour services externes critiques
- Circuit breakers pour prévenir les effets cascade
- Health checks pour tous les services
- Déploiements sans interruption de service

### Internationalisation
- Système i18n basé sur JSON pour traductions
- Détection automatique de la langue du navigateur
- Support pour contenu localisé (descriptions de cols par région)
- Format des nombres et dates adapté par locale

## Références
- [Architecture React recommandée](https://reactjs.org/docs/thinking-in-react.html)
- [Express Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [MongoDB Data Modeling](https://docs.mongodb.com/manual/core/data-model-design/)
- [Auth0 Architecture](https://auth0.com/docs/architecture-scenarios)
- [Heroku Scaling](https://devcenter.heroku.com/articles/scaling)
