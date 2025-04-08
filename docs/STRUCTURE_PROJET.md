# Structure du Projet Velo-Altitude

Ce document présente l'organisation complète du code source et de la documentation du projet Velo-Altitude, conçu pour devenir le plus grand dashboard vélo d'Europe.

## Vue d'Ensemble

Velo-Altitude est une application web moderne développée avec React et Material UI, utilisant MongoDB comme base de données principale. Le projet est organisé selon une architecture modulaire correspondant aux différentes fonctionnalités offertes aux cyclistes.

## Organisation du Code Source

```
velo-altitude/
├── client/                      # Application Frontend React
│   ├── public/
│   │   ├── index.html
│   │   ├── favicon.ico
│   │   └── assets/
│   │       ├── images/         # Images statiques
│   │       └── icons/          # Icônes du site
│   │
│   ├── src/
│   │   ├── components/         # Composants React
│   │   │   ├── layout/         # Composants de mise en page
│   │   │   │   ├── Header/
│   │   │   │   ├── Footer/
│   │   │   │   ├── Navbar/
│   │   │   │   └── Sidebar/
│   │   │   │
│   │   │   ├── cols/           # Module Cols & Défis
│   │   │   │   ├── ColMap/
│   │   │   │   ├── ColProfile/
│   │   │   │   ├── ColStats/
│   │   │   │   └── ColSearch/
│   │   │   │
│   │   │   ├── training/       # Module Entraînement
│   │   │   │   ├── Calendar/
│   │   │   │   ├── WorkoutPlanner/
│   │   │   │   ├── StravaIntegration/
│   │   │   │   └── Statistics/
│   │   │   │
│   │   │   ├── nutrition/      # Module Nutrition
│   │   │   │   ├── MealPlanner/
│   │   │   │   ├── RecipeBook/
│   │   │   │   ├── NutritionCalculator/
│   │   │   │   └── ProgressTracker/
│   │   │   │
│   │   │   └── community/      # Module Communauté
│   │   │       ├── Profile/
│   │   │       ├── Challenges/
│   │   │       ├── Forum/
│   │   │       └── Messaging/
│   │   │
│   │   ├── pages/              # Pages principales
│   │   │   ├── Home/
│   │   │   ├── ColsExplorer/
│   │   │   ├── Training/
│   │   │   ├── Nutrition/
│   │   │   ├── Community/
│   │   │   └── Profile/
│   │   │
│   │   ├── features/           # Fonctionnalités spécifiques
│   │   │   ├── auth/           # Authentification
│   │   │   ├── maps/           # Intégration cartographique
│   │   │   ├── weather/        # Services météo
│   │   │   └── analytics/      # Analyses et statistiques
│   │   │
│   │   ├── services/           # Services et API
│   │   │   ├── api/            # Appels API
│   │   │   ├── strava/         # Intégration Strava
│   │   │   └── storage/        # Gestion du stockage local
│   │   │
│   │   ├── hooks/              # Custom Hooks React
│   │   │   ├── useAuth.js
│   │   │   ├── useMap.js
│   │   │   └── useWeather.js
│   │   │
│   │   ├── utils/              # Utilitaires
│   │   │   ├── formatters/
│   │   │   ├── validators/
│   │   │   └── helpers/
│   │   │
│   │   ├── styles/             # Styles globaux
│   │   │   ├── theme/
│   │   │   ├── global.css
│   │   │   └── variables.css
│   │   │
│   │   ├── assets/             # Assets dynamiques
│   │   │   ├── icons/
│   │   │   └── animations/
│   │   │
│   │   ├── config/             # Configuration
│   │   │   ├── routes.js
│   │   │   ├── api.js
│   │   │   └── constants.js
│   │   │
│   │   ├── i18n/               # Internationalisation
│   │   │   ├── fr/
│   │   │   └── en/
│   │   │
│   │   ├── App.js              # Composant racine
│   │   └── index.js            # Point d'entrée
│   │
│   ├── package.json
│   ├── .env                   # Variables d'environnement
│   └── README.md
│
├── server/                     # Backend Express
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── models/
│   │   └── services/
│   ├── package.json
│   └── .env
│
├── .github/                    # Configuration GitHub
│   └── workflows/             # CI/CD
│
├── netlify.toml               # Configuration Netlify
├── README.md
```

## Organisation de la Documentation

La documentation est organisée selon différentes perspectives : par équipes, technique, déploiement et guides utilisateurs.

```
├── docs/                       # Documentation générale
│   ├── setup.md
│   ├── architecture.md
│   └── api.md
│
├── equipes/                   # Documentation par équipes
│   ├── architecture/          # Équipe 1 – Architecture & Design
│   │   ├── README.md          # Vue d'ensemble de l'architecture
│   │   ├── COMPOSANTS.md      # Documentation des composants
│   │   ├── PERFORMANCES.md    # Optimisations et métriques
│   │   ├── STANDARDS.md       # Standards de code
│   │   └── INTEGRATION.md     # Guide d'intégration
│   │
│   ├── visualisation/         # Équipe 2 – Visualisation 3D
│   │   ├── README.md          # Vue d'ensemble 3D
│   │   ├── OPTIMISATION_3D.md  # Optimisations 3D
│   │   ├── ASSETS_3D.md       # Gestion des assets 3D
│   │   ├── INTERACTIONS.md    # Système d'interactions
│   │   └── MOBILE_3D.md       # Adaptations mobile
│   │
│   ├── entrainement/          # Équipe 3 – Entraînement & Nutrition
│   │   ├── README.md          # Vue d'ensemble
│   │   ├── CALCULATEURS.md    # Calculateurs (FTP, etc.)
│   │   ├── NUTRITION.md       # Module nutrition
│   │   ├── PROGRAMMES.md      # Programmes d'entraînement
│   │   └── INTEGRATION_DONNEES.md  # Intégration des données
│   │
│   ├── cols/                 # Équipe 4 – Cols & Défis
│   │   ├── README.md         # Vue d'ensemble
│   │   ├── STRUCTURE_DONNEES.md  # Structure des données
│   │   ├── INTEGRATION_MAPS.md   # Intégration cartographique
│   │   ├── DEFIS.md          # Système de défis
│   │   └── METEO.md          # Intégration météo
│   │
│   └── communaute/           # Équipe 5 – Communauté & Auth
│       ├── README.md         # Vue d'ensemble
│       ├── AUTHENTIFICATION.md  # Système d'auth
│       ├── PROFILS.md        # Gestion des profils
│       ├── SOCIAL.md         # Fonctionnalités sociales
│       └── MODERATION.md     # Système de modération
│
├── technique/                 # Documentation technique transversale
│   ├── ARCHITECTURE.md        # Architecture technique détaillée
│   ├── API/
│   │   ├── README.md         # Documentation API
│   │   ├── ENDPOINTS.md      # Liste des endpoints
│   │   └── AUTHENTIFICATION.md   # Auth API
│   ├── SECURITE/
│   │   ├── README.md         # Vue d'ensemble sécurité
│   │   └── PROCEDURES.md     # Procédures de sécurité
│   ├── PERFORMANCE/
│   │   ├── README.md         # Vue d'ensemble performance
│   │   └── MONITORING.md     # Système de monitoring
│   └── DATABASE/
│       ├── SCHEMA.md         # Schéma de base de données
│       └── MIGRATIONS.md     # Gestion des migrations
│
├── deploiement/               # Documentation de déploiement
│   ├── README.md              # Vue d'ensemble déploiement
│   ├── ENVIRONNEMENTS.md      # Configuration des environnements
│   ├── PROCEDURES/
│   │   ├── DEPLOIEMENT.md    # Procédures de déploiement
│   │   ├── ROLLBACK.md       # Procédures de rollback
│   │   └── MONITORING.md     # Monitoring de déploiement
│   ├── CHECKLIST/
│   │   ├── PRE_DEPLOIEMENT.md    # Vérifications pré-déploiement
│   │   └── POST_DEPLOIEMENT.md   # Vérifications post-déploiement
│   └── INCIDENTS/
│       ├── PROCEDURES.md     # Gestion des incidents
│       └── TEMPLATES.md      # Templates de rapports
│
└── guides/                    # Guides utilisateurs et développeurs
    ├── utilisateur/
    │   ├── README.md          # Guide utilisateur principal
    │   ├── PREMIERS_PAS.md    # Guide de démarrage
    │   ├── FONCTIONNALITES.md # Guide des fonctionnalités
    │   └── FAQ.md             # Questions fréquentes
    │
    └── developpeur/
        ├── README.md          # Guide développeur principal
        ├── INSTALLATION.md    # Guide d'installation
        ├── CONTRIBUTION.md    # Guide de contribution
        └── BONNES_PRATIQUES.md# Bonnes pratiques
```

## Description des Modules Principaux

### Module Cols & Défis
Ce module est au cœur de Velo-Altitude et comprend :
- Un catalogue exhaustif de plus de 50 cols européens
- Le concept unique "Les 7 Majeurs" permettant de créer des défis personnalisés
- Des fiches détaillées pour chaque col (technique, historique, météo)
- L'intégration cartographique avec Mapbox

### Module Visualisation 3D
Module innovant permettant de prévisualiser les cols en 3D :
- Rendu 3D immersif avec Three.js/React Three Fiber
- Points d'intérêt interactifs (restaurants, vues, monuments)
- Navigation intuitive dans les profils d'élévation
- Optimisations automatiques selon les appareils

### Module Entraînement & Nutrition
Accompagnement complet pour la préparation physique :
- 30+ programmes spécifiques à l'ascension des cols
- 50+ séances détaillées incluant des workouts HIIT
- Synchronisation avec Strava
- 100+ recettes adaptées (avant/pendant/après effort)
- Outils nutritionnels (calculateur, planificateur, journal)

### Module Communauté & Authentification
Aspects sociaux et sécurité de la plateforme :
- Système d'authentification avec Auth0
- Profils utilisateurs détaillés
- Challenges communautaires et événements
- Messagerie et planification collaborative
- Système de modération et de réputation

## Intégrations Externes Clés

- **Auth0** : Authentification sécurisée
- **Mapbox** : Cartographie et données d'élévation
- **Strava** : Synchronisation des activités cyclistes
- **OpenWeather** : Données météorologiques en temps réel
- **MongoDB** : Stockage des données utilisateurs et des défis

## Environnements

Le projet est déployé sur les environnements suivants :
- **Développement** : Local + services mock
- **Test** : Environnement isolé pour tests automatisés
- **Staging** : Réplique de production avec données de test
- **Production** : Environnement public sur Netlify/Heroku

## Workflow de Développement

1. Développement local (branches feature/)
2. Pull Request avec revue de code
3. Tests automatisés via GitHub Actions
4. Déploiement sur staging pour tests manuels
5. Déploiement en production via CI/CD

Ce document fournit un aperçu de la structure globale du projet Velo-Altitude. Pour des informations plus détaillées sur chaque composant, veuillez consulter la documentation spécifique correspondante.
