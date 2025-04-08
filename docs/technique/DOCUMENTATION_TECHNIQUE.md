# DOCUMENTATION TECHNIQUE

*Document consolidé le 07/04/2025 03:04:42*

## Table des matières

- [TechnicalDocumentation](#technicaldocumentation)
- [documentation-technique](#documentation-technique)
- [api-documentation](#api-documentation)
- [API ARCHITECTURE](#api-architecture)
- [FRONTEND ARCHITECTURE](#frontend-architecture)
- [ARCHITECTURE](#architecture)

---

## TechnicalDocumentation

*Source: docs/TechnicalDocumentation.md*

## Architecture générale

L'application Dashboard-Velo est construite selon une architecture client-serveur:

### Frontend (Client)
- Framework: React 17
- Gestion d'état: Context API + hooks personnalisés
- Navigation: React Router v5
- UI Components: React Bootstrap
- Gestion des formulaires: Formik + Yup
- Internationalisation: i18next
- Icônes: Font Awesome
- Visualisations: D3.js, Three.js (pour le 3D)
- Gestion des requêtes: Axios

### Backend (Serveur)
- Runtime: Node.js 14+
- Framework: Express.js
- Base de données: MongoDB (avec Mongoose)
- Authentication: JWT
- Validation: Joi
- Logging: Winston
- Tests: Jest, Supertest
- Documentation API: Swagger

## Modèles de données

### User
```javascript
{
  id: String,              // Identifiant unique
  email: String,           // Email (unique)
  name: String,            // Nom complet
  password: String,        // Mot de passe (haché)
  age: Number,             // Âge
  weight: Number,          // Poids en kg
  height: Number,          // Taille en cm
  ftp: Number,             // FTP en watts
  level: String,           // beginner, intermediate, advanced, elite
  cyclist_type: String,    // all-rounder, climber, sprinter, etc.
  preferred_terrain: String, // flat, hills, mountains, mixed
  weekly_hours: Number,    // Heures d'entraînement hebdomadaires
  hrmax: Number,           // Fréquence cardiaque maximale
  hrrest: Number,          // Fréquence cardiaque au repos
  region: String,          // Région
  following: [String],     // IDs des utilisateurs suivis
  followers: [String],     // IDs des utilisateurs qui suivent
  achievementCount: Number, // Nombre de succès débloqués
  created_at: Date,        // Date de création
  updated_at: Date         // Date de dernière modification
}
```

### Workout
```javascript
{
  id: String,              // Identifiant unique
  name: String,            // Nom de l'entraînement
  type: String,            // HIIT, THRESHOLD, ENDURANCE, RECOVERY, etc.
  description: String,     // Description
  duration: Number,        // Durée en minutes
  intensityLevel: Number,  // Niveau d'intensité (1-5)
  difficulty: Number,      // Difficulté (1-3)
  targetPower: Number,     // Puissance cible principale
  terrain: String,         // flat, hills, mountains, mixed
  tss: Number,             // Training Stress Score estimé
  intervals: [             // Séquence d'intervalles
    {
      type: String,        // warmup, steady, threshold, vo2max, recovery, etc.
      duration: Number,    // Durée en secondes
      power: Number        // Puissance cible en watts
    }
  ],
  userId: String,          // ID du créateur (null pour les entraînements système)
  tags: [String],          // Tags pour la recherche
  created_at: Date,        // Date de création
  updated_at: Date         // Date de dernière modification
}
```

### WorkoutLog
```javascript
{
  id: String,              // Identifiant unique
  workoutId: String,       // ID de l'entraînement
  workoutName: String,     // Nom de l'entraînement (pour référence rapide)
  userId: String,          // ID de l'utilisateur
  date: Date,              // Date de réalisation
  completed: Boolean,      // Si l'entraînement a été terminé
  duration: Number,        // Durée effective en minutes
  avgPower: Number,        // Puissance moyenne
  normalizedPower: Number, // Puissance normalisée
  tss: Number,             // Training Stress Score
  ifactor: Number,         // Intensity Factor
  heartRate: {             // Données de fréquence cardiaque
    avg: Number,           // Moyenne
    max: Number            // Maximum
  },
  zones: {                 // % du temps passé dans chaque zone
    z1: Number,
    z2: Number,
    z3: Number,
    z4: Number,
    z5: Number,
    z6: Number,
    z7: Number
  },
  notes: String,           // Notes utilisateur
  created_at: Date         // Date d'enregistrement
}
```

### CommunityChallenge
```javascript
{
  id: String,              // Identifiant unique
  title: String,           // Titre du défi
  description: String,     // Description
  type: String,            // distance, elevation, power, etc.
  target: Number,          // Objectif (km, m, watts, etc.)
  startDate: Date,         // Date de début
  endDate: Date,           // Date de fin
  participants: [          // Participants
    {
      userId: String,      // ID de l'utilisateur
      progress: Number,    // Progression (%)
      completed: Boolean,  // Si terminé
      completedDate: Date  // Date de complétion
    }
  ],
  region: String,          // Région concernée (optionnel)
  created_at: Date,        // Date de création
  created_by: String       // ID du créateur
}
```

## Flux de données

### Authentification
1. L'utilisateur soumet ses identifiants via le formulaire de connexion
2. Le frontend envoie les identifiants au serveur
3. Le serveur vérifie les identifiants et génère un JWT si valides
4. Le JWT est retourné au client qui le stocke dans localStorage
5. Le JWT est inclus dans l'en-tête Authorization de toutes les requêtes API
6. Le serveur vérifie le JWT pour chaque requête protégée
7. Si invalide ou expiré, le client est redirigé vers la page de connexion

### Création d'entraînement HIIT
1. L'utilisateur accède au constructeur HIIT via TrainingDashboard
2. HIITBuilder charge les templates disponibles via HIITTemplates
3. L'utilisateur personnalise son entraînement (intervalles, durées, intensités)
4. À la sauvegarde, les données sont envoyées à l'API
5. Le serveur valide et enregistre l'entraînement dans MongoDB
6. L'ID de l'entraînement est retourné et stocké dans l'état de l'application
7. L'utilisateur peut alors démarrer l'entraînement via HIITVisualizer

### Visualisation 3D des cols
1. L'utilisateur sélectionne un col dans la liste des cols
2. PassDetail est chargé avec l'ID du col
3. Les données géographiques sont récupérées via l'API (coordonnées GPS, élévation)
4. Three.js génère une visualisation 3D du profil du col
5. Les animations de transition se déclenchent lors du chargement et des interactions
6. Les données de contexte (pente, altitude, points d'intérêt) sont superposées à la visualisation
7. L'utilisateur peut interagir avec le modèle (rotation, zoom, changement de perspective)

## APIs externes

L'application intègre plusieurs APIs externes :

### Strava API
- **Endpoints utilisés**:
  - `oauth/token` - Authentification
  - `athlete/activities` - Récupération des activités
  - `uploads` - Envoi d'activités
- **Intégration**: Service dédié `strava-token.service.js` pour la gestion des tokens

### Google Maps API
- **Endpoints utilisés**:
  - Maps JavaScript API - Affichage des cartes
  - Directions API - Calcul d'itinéraires
  - Elevation API - Données d'élévation
- **Intégration**: Composants React dédiés dans `/components/maps/`

### OpenWeatherMap API
- **Endpoints utilisés**:
  - Current Weather API - Conditions météo actuelles
  - Forecast API - Prévisions sur 5 jours
- **Intégration**: Service dédié `weather.service.js`

## Structures de répertoires importantes

### Components HIIT
```
client/src/components/training/
├── HIITBuilder.js       # Constructeur d'entraînements HIIT
├── HIITTemplates.js     # Générateur de templates HIIT
├── HIITVisualizer.js    # Visualiseur d'entraînements HIIT
├── HIITWorkoutCard.js   # Carte d'aperçu d'entraînement
└── WorkoutLibrary.js    # Bibliothèque d'entraînements
```

### Services
```
client/src/services/
├── FTPEstimationService.js  # Calcul et estimation de FTP
├── UserService.js           # Gestion des utilisateurs
├── NotificationService.js   # Système de notifications
├── APIService.js            # Requêtes API centralisées
└── AnalyticsService.js      # Service d'analytics
```

## Points techniques spécifiques

### Estimation FTP
Le service `FTPEstimationService.js` implémente plusieurs méthodes d'estimation de la FTP:

1. **Estimation par le poids**:
   - Formule: `poids * coefficient` (selon niveau)
   - Niveaux: débutant (2.0), intermédiaire (2.8), avancé (3.5), élite (4.5)
   
2. **Test de 20 minutes**:
   - Formule: `puissance_moyenne_20min * 0.95`
   
3. **Test de 8 minutes**:
   - Formule: `puissance_moyenne_8min * 0.9`
   
4. **Test de 5 minutes**:
   - Formule: `puissance_moyenne_5min * 0.85`
   
5. **Test de 1 minute**:
   - Formule: `puissance_moyenne_1min * 0.75`
   
6. **Critical Power (CP)**:
   - Formule: `CP * 0.97`

Ces méthodes incluent une validation robuste des paramètres d'entrée pour éviter les erreurs.

### Calculs d'intervalles HIIT

Les templates HIIT sont générés dynamiquement selon plusieurs algorithmes:

1. **Intervalles classiques**:
   - Alternance régulière entre périodes d'effort et récupération
   - Durées et intensités paramétrables

2. **Intervalles pyramidaux (Ladder)**:
   ```javascript
   // Pseudo-code simplifié
   function generateLadderIntervals(ftp, totalDuration, peakIntensity) {
     // Validation des paramètres
     if (!isValid(ftp, totalDuration, peakIntensity)) return fallbackIntervals();
     
     // Calcul des paliers croissants puis décroissants
     const steps = [0.7, 0.8, 0.9, 1.0, 0.9, 0.8, 0.7].map(factor => 
       Math.round(ftp * factor * peakIntensity)
     );
     
     // Génération des intervalles
     return generateIntervalsFromSteps(steps, totalDuration);
   }
   ```

3. **Intervalles Over/Under**:
   ```javascript
   // Pseudo-code simplifié
   function generateOverUnderIntervals(ftp, blocks, overLevel, underLevel) {
     // Validation des paramètres
     if (!isValid(ftp, blocks, overLevel, underLevel)) return fallbackIntervals();
     
     // Calcul des puissances over/under
     const overPower = Math.round(ftp * (1 + overLevel));
     const underPower = Math.round(ftp * (1 - underLevel));
     
     // Génération des séquences
     let intervals = [];
     for (let i = 0; i < blocks; i++) {
       intervals.push(
         { type: 'over', duration: 60, power: overPower },
         { type: 'under', duration: 120, power: underPower }
       );
     }
     
     return wrapWithWarmupCooldown(intervals);
   }
   ```

### Optimisations de performance

1. **Rendu conditionnel**:
   - Utilisation extensive de `React.memo()` pour éviter les re-rendus inutiles
   - Découpage des composants pour isoler les parties avec rendu fréquent

2. **Chargement des données**:
   - Utilisation de `useEffect` avec dépendances contrôlées
   - Implémentation de la pagination pour les longues listes

3. **Memoïzation des calculs coûteux**:
   ```javascript
   const memoizedCalculation = useMemo(() => {
     // Calcul complexe ici
     return result;
   }, [dependencies]);
   ```

4. **Lazy loading des composants lourds**:
   ```javascript
   const HeavyComponent = React.lazy(() => import('./HeavyComponent'));
   
   // Utilisé avec Suspense
   <Suspense fallback={<Loader />}>
     <HeavyComponent />
   </Suspense>
   ```

## Gestion des erreurs

### Frontend

1. **Intercepteurs Axios**:
   ```javascript
   axios.interceptors.response.use(
     response => response,
     error => {
       const { status, data } = error.response || {};
       
       // Gestion selon le code HTTP
       switch (status) {
         case 401:
           // Redirection vers login si token expiré
           authService.logout();
           return Promise.reject(error);
         case 403:
           // Accès refusé
           notifyService.error("Accès refusé");
           return Promise.reject(error);
         case 500:
           // Erreur serveur
           notifyService.error("Erreur serveur, réessayez plus tard");
           logErrorToMonitoring(error);
           return Promise.reject(error);
         default:
           return Promise.reject(error);
       }
     }
   );
   ```

2. **Validation des formulaires**:
   - Utilisation de Formik + Yup pour la validation côté client
   - Messages d'erreur contextuels et accessibles

3. **Boundary d'erreurs React**:
   ```javascript
   class ErrorBoundary extends React.Component {
     state = { hasError: false, error: null };
     
     static getDerivedStateFromError(error) {
       return { hasError: true, error };
     }
     
     componentDidCatch(error, info) {
       logErrorToMonitoring(error, info);
     }
     
     render() {
       if (this.state.hasError) {
         return <ErrorFallback error={this.state.error} />;
       }
       return this.props.children;
     }
   }
   ```

### Backend

1. **Middleware d'erreur Express**:
   ```javascript
   app.use((err, req, res, next) => {
     logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
     
     // Erreurs spécifiques à Mongoose/MongoDB
     if (err.name === 'ValidationError') {
       return res.status(400).json({
         status: 'error',
         message: 'Données invalides',
         details: err.errors
       });
     }
     
     // Erreurs génériques
     res.status(err.status || 500).json({
       status: 'error',
       message: err.message || 'Erreur serveur interne'
     });
   });
   ```

2. **Validation des entrées API**:
   - Utilisation de Joi pour valider les requêtes
   - Middlewares personnalisés pour chaque route

## Tests

### Frontend
- Tests unitaires avec Jest et React Testing Library
- Tests d'intégration pour les flux utilisateur critiques
- Tests de rendu pour les composants UI complexes

### Backend
- Tests unitaires pour les fonctions et services
- Tests d'intégration pour les routes API
- Tests de base de données avec MongoDB en mémoire

## Règles de développement

1. **Structure des commits**:
   - Format: `type(scope): message`
   - Types: feat, fix, docs, style, refactor, test, chore
   - Exemple: `feat(hiit): add ladder interval generation`

2. **Code style**:
   - ESLint avec configuration Airbnb
   - Prettier pour le formatage
   - Hooks React suivant les règles officielles

3. **Revue de code**:
   - Pull requests obligatoires pour les changements majeurs
   - Au moins un reviewer par PR
   - Tests automatisés avant merge

## Optimisations UX

### Visualisations 3D
- Utilisation de Three.js avec optimisations de performance
- Techniques de Level-of-Detail pour réduire la charge de rendu sur mobile
- Animations progressives pour guider l'attention de l'utilisateur
- Design immersif permettant de "ressentir" le dénivelé

### Navigation
- Hiérarchie d'information claire guidant l'utilisateur
- Architecture en couches du général vers le spécifique
- Fils d'Ariane pour situer l'utilisateur dans la navigation
- Menu contextuel adapté au contexte de l'utilisateur

### Animations et transitions
- Animations fonctionnelles renforçant la compréhension des données
- Transitions fluides entre les zones d'entraînement
- Visualisation dynamique des changements d'altitude
- Animations d'état pour les composants interactifs

### Feedback visuel
- Système cohérent de confirmation des actions utilisateur
- Notifications non-intrusives pour les actions asynchrones
- Indicateurs de progression pour les opérations longues
- Tooltips contextuels pour l'aide à la compréhension

## Recommandations pour le développement futur

1. **Optimisation des performances**:
   - Implémentation de la virtualisation pour les longues listes
   - Utilisation de Web Workers pour les calculs complexes
   - Mise en cache plus agressive des données statiques

2. **Accessibilité**:
   - Audit complet WCAG 2.1 AA
   - Amélioration du support des lecteurs d'écran
   - Tests avec utilisateurs en situation de handicap

3. **Évolutions fonctionnelles**:
   - Intégration de l'apprentissage automatique pour les recommandations d'entraînement
   - Support des capteurs Bluetooth Low Energy pour données en temps réel
   - Mode hors-ligne complet avec synchronisation différée

---

## documentation-technique

*Source: docs/documentation-technique.md*

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

---

## api-documentation

*Source: docs/api-documentation.md*

## Introduction

Cette documentation décrit les endpoints API utilisés par le Dashboard-Velo. Elle est destinée aux développeurs qui souhaitent comprendre, maintenir ou étendre les fonctionnalités du dashboard.

## Structure générale

Toutes les requêtes API doivent inclure un token JWT valide dans l'en-tête HTTP `Authorization`, à l'exception des endpoints d'authentification.

```
Authorization: Bearer <token_jwt>
```

## Authentification

### POST /api/auth/login

Authentifie un utilisateur et renvoie un token JWT.

**Requête:**
```json
{
  "email": "utilisateur@exemple.com",
  "password": "mot_de_passe"
}
```

**Réponse:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "5f8d43e1e7179a0b9456b633",
    "email": "utilisateur@exemple.com",
    "firstName": "Prénom",
    "lastName": "Nom",
    "role": "user"
  }
}
```

### POST /api/auth/register

Crée un nouveau compte utilisateur.

**Requête:**
```json
{
  "email": "nouveau@exemple.com",
  "password": "mot_de_passe",
  "firstName": "Prénom",
  "lastName": "Nom"
}
```

**Réponse:**
```json
{
  "message": "Compte créé avec succès",
  "user": {
    "id": "5f8d43e1e7179a0b9456b633",
    "email": "nouveau@exemple.com",
    "firstName": "Prénom",
    "lastName": "Nom",
    "role": "user"
  }
}
```

### POST /api/auth/refresh-token

Renouvelle un token JWT expiré à l'aide du refresh token.

**Requête:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Réponse:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Routes

### GET /api/routes

Récupère la liste des itinéraires cyclistes disponibles.

**Paramètres de requête (optionnels):**
- `region` (string): Filtre par région géographique
- `difficulty` (number): Filtre par niveau de difficulté (1-5)
- `minDistance` (number): Distance minimale en km
- `maxDistance` (number): Distance maximale en km
- `minElevation` (number): Dénivelé minimal en mètres
- `maxElevation` (number): Dénivelé maximal en mètres

**Réponse:**
```json
[
  {
    "id": "5f9b3e7c1c9d440000d1b3c7",
    "name": "Route des Crêtes",
    "description": "Magnifique parcours à travers les montagnes",
    "distance": 45.7,
    "elevation_gain": 850,
    "difficulty": 4,
    "region": "Vosges",
    "image_url": "https://example.com/route1.jpg",
    "favorite_count": 24,
    "is_favorite": false,
    "author": {
      "id": "5f8d43e1e7179a0b9456b633",
      "name": "Jean Cycliste",
      "profile_image": "https://example.com/jean.jpg"
    },
    "tags": ["montagne", "scenic", "challenge"]
  },
  // Autres itinéraires...
]
```

### GET /api/routes/:id

Récupère les détails d'un itinéraire spécifique.

**Réponse:**
```json
{
  "id": "5f9b3e7c1c9d440000d1b3c7",
  "name": "Route des Crêtes",
  "description": "Magnifique parcours à travers les montagnes",
  "distance": 45.7,
  "elevation_gain": 850,
  "difficulty": 4,
  "region": "Vosges",
  "image_url": "https://example.com/route1.jpg",
  "favorite_count": 24,
  "is_favorite": false,
  "author": {
    "id": "5f8d43e1e7179a0b9456b633",
    "name": "Jean Cycliste",
    "profile_image": "https://example.com/jean.jpg"
  },
  "tags": ["montagne", "scenic", "challenge"],
  "waypoints": [
    {"lat": 48.123, "lng": 7.123, "elevation": 450},
    {"lat": 48.124, "lng": 7.125, "elevation": 500},
    // ...
  ],
  "points_of_interest": [
    {
      "name": "Col de la Schlucht",
      "description": "Col mythique des Vosges",
      "type": "col",
      "coordinates": {"lat": 48.125, "lng": 7.126}
    }
    // ...
  ],
  "services": [
    {
      "name": "Point d'eau",
      "type": "water",
      "coordinates": {"lat": 48.124, "lng": 7.124}
    }
    // ...
  ],
  "narrative": "Ce parcours commence à Munster et monte progressivement..."
}
```

### POST /api/routes

Crée un nouvel itinéraire.

**Requête:**
```json
{
  "name": "Tour du lac",
  "description": "Belle balade autour du lac",
  "distance": 30.5,
  "elevation_gain": 200,
  "difficulty": 2,
  "region": "Alsace",
  "waypoints": [
    {"lat": 48.123, "lng": 7.123, "elevation": 200},
    {"lat": 48.124, "lng": 7.125, "elevation": 210},
    // ...
  ],
  "tags": ["lac", "familial", "facile"]
}
```

**Réponse:**
```json
{
  "id": "5f9b3e7c1c9d440000d1b3c8",
  "name": "Tour du lac",
  "description": "Belle balade autour du lac",
  // Autres détails...
  "message": "Itinéraire créé avec succès"
}
```

### POST /api/routes/:id/favorite

Ajoute ou retire un itinéraire des favoris de l'utilisateur.

**Réponse:**
```json
{
  "is_favorite": true,
  "favorite_count": 25,
  "message": "Ajouté aux favoris"
}
```

## Strava

### GET /api/strava/auth/status

Vérifie si l'utilisateur est authentifié auprès de Strava.

**Réponse:**
```json
{
  "authenticated": true,
  "expires_at": 1618309050
}
```

### GET /api/strava/auth

Redirige vers la page d'authentification Strava.

### POST /api/strava/auth/exchange

Échange un code d'autorisation contre un token d'accès.

**Requête:**
```json
{
  "code": "code_d_autorisation_strava"
}
```

**Réponse:**
```json
{
  "access_token": "acc_token_123",
  "refresh_token": "ref_token_456",
  "expires_at": 1618309050
}
```

### GET /api/strava/activities

Récupère les activités de l'utilisateur depuis Strava.

**Paramètres de requête (optionnels):**
- `limit` (number): Nombre maximum d'activités à récupérer (défaut: 20)
- `page` (number): Page de résultats (défaut: 1)

**Réponse:**
```json
[
  {
    "id": "12345",
    "name": "Sortie matinale",
    "type": "Ride",
    "distance": 35000,
    "moving_time": 5400,
    "total_elevation_gain": 450,
    "start_date": "2023-06-15T08:30:00Z",
    "map": {
      "summary_polyline": "abc123..."
    }
  },
  // Autres activités...
]
```

### POST /api/strava/import/:activityId

Importe une activité Strava en tant qu'itinéraire.

**Réponse:**
```json
{
  "success": true,
  "route": {
    "id": "5f9b3e7c1c9d440000d1b3c9",
    "name": "Sortie matinale",
    "description": "Importé depuis Strava",
    // Autres détails...
  }
}
```

## Cols

### GET /api/cols

Récupère la liste des cols cyclistes.

**Paramètres de requête (optionnels):**
- `region` (string): Filtre par région ou pays
- `difficulty` (number): Filtre par niveau de difficulté (1-5)
- `min_elevation` (number): Altitude minimale en mètres
- `max_elevation` (number): Altitude maximale en mètres

**Réponse:**
```json
[
  {
    "id": "col-tourmalet",
    "name": "Col du Tourmalet",
    "location": {
      "country": "France",
      "region": "Hautes-Pyrénées",
      "coordinates": {
        "lat": 42.8722,
        "lng": 0.1775
      }
    },
    "statistics": {
      "length": 19.0,
      "elevation_gain": 1404,
      "avg_gradient": 7.4,
      "max_gradient": 10.2,
      "start_elevation": 850,
      "summit_elevation": 2115
    },
    "difficulty": 5
  },
  // Autres cols...
]
```

### GET /api/cols/:id

Récupère les détails d'un col spécifique.

**Réponse:**
```json
{
  "id": "col-tourmalet",
  "name": "Col du Tourmalet",
  "location": {
    "country": "France",
    "region": "Hautes-Pyrénées",
    "coordinates": {
      "lat": 42.8722,
      "lng": 0.1775
    }
  },
  "statistics": {
    "length": 19.0,
    "elevation_gain": 1404,
    "avg_gradient": 7.4,
    "max_gradient": 10.2,
    "start_elevation": 850,
    "summit_elevation": 2115
  },
  "elevation_profile": [
    {"distance": 0, "elevation": 850},
    {"distance": 2, "elevation": 950},
    // ...
  ],
  "history": {
    "tour_appearances": 87,
    "first_appearance": 1910,
    "notable_events": [
      "Première apparition dans le Tour de France en 1910",
      // ...
    ],
    "records": {
      "ascent": "36:46 par Bjarne Riis en 1996"
    }
  },
  "difficulty": 5,
  "recommended_season": ["juin", "juillet", "août", "septembre"],
  "images": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Col_du_Tourmalet.jpg/1200px-Col_du_Tourmalet.jpg",
    // ...
  ],
  "practical_info": {
    "parking": "Parking disponible à La Mongie et Barèges",
    "water_points": ["Fontaine à Sainte-Marie-de-Campan", "Fontaine au sommet"],
    "hazards": ["Tunnel non éclairé à 3km du sommet", "Vent fort possible au sommet"]
  }
}
```

## Entraînement et Nutrition

### GET /api/training-plans

Récupère la liste des plans d'entraînement disponibles.

**Paramètres de requête (optionnels):**
- `level` (string): Filtre par niveau (débutant, intermédiaire, avancé)
- `goal` (string): Filtre par objectif (endurance, puissance, perte de poids)
- `duration` (number): Filtre par durée en semaines

**Réponse:**
```json
[
  {
    "id": "plan-1",
    "name": "Préparation Cyclosportive",
    "objective": "endurance",
    "level": "intermédiaire",
    "duration_weeks": 8,
    "weekly_structure": [
      // Structure résumée...
    ]
  },
  // Autres plans...
]
```

### GET /api/training-plans/:id

Récupère les détails d'un plan d'entraînement spécifique.

**Réponse:** Structure complète du plan d'entraînement

### GET /api/nutrition-plans

Récupère la liste des plans nutritionnels disponibles.

**Paramètres de requête (optionnels):**
- `type` (string): Filtre par type (endurance, compétition, récupération)

**Réponse:**
```json
[
  {
    "id": "nutrition-plan-endurance",
    "name": "Plan Nutrition Endurance",
    "type": "endurance",
    "description": "Plan nutritionnel adapté aux cyclistes d'endurance"
  },
  // Autres plans...
]
```

### GET /api/nutrition-plans/:id

Récupère les détails d'un plan nutritionnel spécifique.

**Réponse:** Structure complète du plan nutritionnel

## Environnement

### GET /api/environmental/weather

Récupère les prévisions météo pour une localisation donnée.

**Paramètres de requête:**
- `lat` (number): Latitude
- `lng` (number): Longitude

**Réponse:**
```json
{
  "current": {
    "temp": 18.5,
    "feels_like": 17.8,
    "humidity": 65,
    "wind_speed": 15,
    "wind_direction": 270,
    "weather_conditions": "Partiellement nuageux",
    "icon": "partly_cloudy"
  },
  "forecast": [
    {
      "date": "2023-06-16",
      "temp_min": 15,
      "temp_max": 22,
      "precipitation_chance": 20,
      "weather_conditions": "Ensoleillé",
      "icon": "sunny"
    },
    // Prévisions pour les jours suivants...
  ]
}
```

### GET /api/environmental/air-quality

Récupère la qualité de l'air pour une localisation donnée.

**Paramètres de requête:**
- `lat` (number): Latitude
- `lng` (number): Longitude

**Réponse:**
```json
{
  "aqi": 45,
  "category": "Bon",
  "description": "La qualité de l'air est considérée comme satisfaisante",
  "components": {
    "pm2_5": 10.2,
    "pm10": 18.3,
    "o3": 68,
    "no2": 15.7,
    "so2": 2.1,
    "co": 0.4
  },
  "recommendation": "Conditions idéales pour le cyclisme"
}
```

### GET /api/environmental/route/:routeId

Récupère les conditions environnementales le long d'un itinéraire.

**Réponse:**
```json
{
  "points": [
    {
      "coordinates": {"lat": 48.123, "lng": 7.123},
      "weather": {
        "temp": 18.5,
        "wind_speed": 15,
        "wind_direction": 270,
        "weather_conditions": "Partiellement nuageux"
      },
      "airQuality": {
        "aqi": 45,
        "category": "Bon"
      }
    },
    // Autres points...
  ],
  "route_analysis": {
    "challenging_sections": [
      {
        "start_idx": 5,
        "end_idx": 8,
        "reason": "Vents latéraux forts",
        "severity": "modérée"
      }
    ],
    "recommendation": "Conditions généralement favorables, attention aux vents latéraux entre les km 10 et 15"
  }
}
```

## Gestion des erreurs

Les erreurs sont renvoyées au format suivant :

```json
{
  "error": true,
  "message": "Description de l'erreur",
  "status": 400,
  "details": {
    // Détails spécifiques à l'erreur, si disponibles
  }
}
```

Les codes d'état HTTP standard sont utilisés :
- 200: Succès
- 201: Ressource créée
- 400: Requête invalide
- 401: Non authentifié
- 403: Non autorisé
- 404: Ressource non trouvée
- 500: Erreur serveur

## Limites de taux

Pour prévenir les abus, l'API impose des limites de taux :
- 100 requêtes par minute par utilisateur authentifié
- 30 requêtes par minute pour les requêtes non authentifiées

Les en-têtes suivants sont inclus dans chaque réponse :
- `X-RateLimit-Limit`: Nombre total de requêtes autorisées par minute
- `X-RateLimit-Remaining`: Nombre de requêtes restantes dans la fenêtre actuelle
- `X-RateLimit-Reset`: Temps (en secondes Unix) avant la réinitialisation du compteur

---

## API ARCHITECTURE

*Source: API_ARCHITECTURE.md*

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture des services API](#architecture-des-services-api)
   - [ApiManager](#apimanager)
   - [Initialisation des services](#initialisation-des-services)
   - [Résolution des dépendances circulaires](#résolution-des-dépendances-circulaires)
3. [Système de monitoring](#système-de-monitoring)
   - [Métriques disponibles](#métriques-disponibles)
   - [Endpoints de monitoring](#endpoints-de-monitoring)
   - [Intégration avec un dashboard](#intégration-avec-un-dashboard)
4. [Stratégies de cache et fallback](#stratégies-de-cache-et-fallback)
   - [Mécanisme de cache](#mécanisme-de-cache)
   - [Stratégies de fallback](#stratégies-de-fallback)
   - [Gestion des erreurs](#gestion-des-erreurs)
5. [Optimisation des requêtes parallèles](#optimisation-des-requêtes-parallèles)
   - [Limitation de concurrence](#limitation-de-concurrence)
   - [Traitement par lots](#traitement-par-lots)
6. [Bonnes pratiques](#bonnes-pratiques)
   - [Ajouter un nouveau service API](#ajouter-un-nouveau-service-api)
   - [Sécurité et gestion des clés API](#sécurité-et-gestion-des-clés-api)
   - [Tests](#tests)
7. [Système d'authentification avancé](#système-dauthentification-avancé)
   - [Paramètres d'authentification optimisés](#paramètres-dauthentification-optimisés)
   - [Système de rotation des tokens JWT](#système-de-rotation-des-tokens-jwt)
   - [Résultats des tests de performance](#résultats-des-tests-de-performance)
   - [Recommandations pour l'utilisation du système d'authentification](#recommandations-pour-lutilisation-du-système-dauthentification)
8. [Résultats des tests d'intégration](#résultats-des-tests-dintégration)
   - [Résumé des tests d'intégration](#résumé-des-tests-dintégration)
   - [Détails des améliorations par service](#détails-des-améliorations-par-service)
   - [Recommandations pour le développement futur](#recommandations-pour-le-développement-futur)

## Vue d'ensemble

L'architecture des services API de Grand Est Cyclisme a été entièrement repensée pour offrir une solution robuste, performante et facile à maintenir. Elle repose sur un gestionnaire d'API centralisé qui coordonne tous les services externes, avec une attention particulière portée à :

- La **résolution des dépendances circulaires** entre services
- Le **monitoring des performances** pour identifier les goulots d'étranglement
- Les **stratégies de fallback** pour garantir une expérience utilisateur fluide même en cas de défaillance
- **L'optimisation des requêtes parallèles** pour les opérations intensives

## Architecture des services API

### ApiManager

Le cœur de l'architecture est le service `ApiManager` (`api-manager.service.js`), qui agit comme un point d'entrée unique pour tous les appels API externes. Ses responsabilités principales sont :

- Enregistrement dynamique des services API
- Monitoring des performances et des erreurs
- Application des stratégies de rate limiting
- Gestion du cache et des fallbacks
- Acheminement des requêtes vers les services appropriés

```javascript
// Exemple d'utilisation
const response = await apiManager.execute('weather', 'getForecast', { lat, lon, days: 5 });
```

### Initialisation des services

L'initialisation des services est centralisée dans le fichier `initServices.js`, qui enregistre tous les services auprès du gestionnaire d'API au démarrage de l'application :

```javascript
// Exemple d'enregistrement d'un service
apiManager.registerService('weather', weatherService, {
  retryConfig: { maxRetries: 3, initialDelay: 1000, maxDelay: 10000 },
  rateLimit: { requestsPerMinute: 50 },
  fallbackStrategy: 'cache'
});
```

L'initialisation est déclenchée dans `server.js` :

```javascript
// Initialiser les services API avec le gestionnaire centralisé
console.log('🔌 Initialisation des services API...');
initializeServices();
console.log('✅ Services API initialisés avec succès');
```

### Résolution des dépendances circulaires

Pour résoudre les dépendances circulaires entre services, nous utilisons une combinaison de techniques :

1. **Importation différée** - Les services qui dépendent les uns des autres utilisent `setTimeout` pour différer les imports :

```javascript
// Dans un service qui dépend de l'ApiManager
let apiManager;
setTimeout(() => {
  apiManager = require('./api-manager.service');
}, 0);
```

2. **Initialisation centralisée** - Toutes les dépendances sont initialisées dans un ordre précis dans `initServices.js`

3. **Références indirectes** - Les services communiquent via le `ApiManager` plutôt que de s'appeler directement

#### Architecture d'initialisation optimisée

Pour éviter les problèmes de démarrage du serveur et les dépendances circulaires, nous avons implémenté un processus d'initialisation en plusieurs étapes :

1. **Initialisation de l'ApiManager** - Le gestionnaire central est initialisé en premier
2. **Délai d'initialisation des services** - Un délai est introduit via `setTimeout` pour s'assurer que l'ApiManager est complètement initialisé
3. **Enregistrement séquentiel** - Les services sont enregistrés dans un ordre spécifique qui respecte leurs dépendances

```javascript
// Exemple d'initialisation avec délai
// initServices.js
const apiManager = require('./api-manager.service');

function initializeServices() {
  // On s'assure que l'ApiManager est complètement initialisé
  setTimeout(() => {
    // Service de base sans dépendances, initialisé en premier
    const weatherService = require('./weather.service');
    apiManager.registerService('weather', weatherService, {
      // Configuration...
    });
    
    // Services qui dépendent d'autres services, initialisés ensuite
    const openRouteService = require('./openroute.service');
    apiManager.registerService('openroute', openRouteService, {
      // Configuration...
    });
    
    // Services complexes initialisés en dernier
    const stravaService = require('./strava.service');
    apiManager.registerService('strava', stravaService, {
      // Configuration...
    });
  }, 100); // Délai court mais suffisant pour éviter les problèmes de timing
}

module.exports = initializeServices;
```

4. **Suppression de l'auto-enregistrement** - Les services ne s'enregistrent plus eux-mêmes auprès de l'ApiManager, cette responsabilité est centralisée dans `initServices.js`

#### Bonnes pratiques pour éviter les dépendances circulaires

Pour maintenir une architecture propre et éviter de futurs problèmes de dépendances circulaires :

1. **Toujours utiliser l'ApiManager** comme point d'accès central pour les communications inter-services
2. **Ne jamais importer directement** un service dans un autre service qui pourrait créer une boucle de dépendances
3. **Utiliser l'injection de dépendances** plutôt que les imports directs lorsque c'est possible
4. **Documenter les dépendances** de chaque service en commentaire en tête de fichier
5. **Tester le cycle de démarrage** après l'ajout de tout nouveau service

## Système de monitoring

### Métriques disponibles

Pour chaque service API, les métriques suivantes sont collectées :

| Métrique | Description |
|----------|-------------|
| `totalRequests` | Nombre total de requêtes effectuées |
| `successfulRequests` | Nombre de requêtes réussies |
| `failedRequests` | Nombre de requêtes en échec |
| `cacheHits` | Nombre de requêtes servies depuis le cache |
| `averageResponseTime` | Temps de réponse moyen (ms) |
| `successRate` | Taux de succès (%) |
| `errorBreakdown` | Répartition des erreurs par type |

### Endpoints de monitoring

Les métriques sont exposées via plusieurs endpoints REST :

#### 1. Vue d'ensemble des métriques

```
GET /api/monitoring/api-metrics
```

Retourne les métriques pour tous les services enregistrés.

#### 2. Métriques pour un service spécifique

```
GET /api/monitoring/api-metrics/:serviceName
```

Retourne les métriques détaillées pour un service spécifique (ex: `weather`, `strava`, `openroute`).

#### 3. Réinitialisation des métriques

```
POST /api/monitoring/reset-metrics
```

Réinitialise les métriques pour tous les services ou pour un service spécifique (si `serviceName` est fourni dans le corps de la requête).

### Intégration avec un dashboard

Les endpoints de monitoring sont conçus pour s'intégrer facilement avec un dashboard de visualisation. Les réponses sont formatées en JSON avec une structure cohérente, facilitant l'intégration avec des outils comme Grafana, Kibana ou un dashboard personnalisé.

### Exemples concrets d'utilisation du système de monitoring

#### Exemple 1: Surveillance des performances d'une API externe

Le monitoring permet de détecter les problèmes de performance d'une API tierce et de prendre des décisions automatiques ou manuelles pour assurer la continuité de service.

```javascript
// Dans une route de monitoring
router.get('/performances-strava', async (req, res) => {
  try {
    const metrics = apiManager.getServiceMetrics('strava');
    
    // Analyse des performances
    if (metrics.averageResponseTime > 2000) {
      // Alerte si temps de réponse trop long
      notificationService.sendAlert('Strava API performance degradation detected');
    }
    
    if (metrics.successRate < 95) {
      // Changement automatique de stratégie si taux d'échec élevé
      apiManager.updateServiceConfig('strava', {
        fallbackStrategy: 'cache',
        retryConfig: { maxRetries: 5, initialDelay: 2000 }
      });
    }
    
    res.json({
      metrics,
      recommendations: generateRecommendations(metrics)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### Exemple 2: Dashboard de monitoring en temps réel

Le dashboard de monitoring exploite les métriques pour afficher une vue d'ensemble de la santé du système.

```javascript
// Dans le contrôleur de dashboard
exports.getDashboardData = async (req, res) => {
  const servicesHealth = {};
  const registeredServices = apiManager.getRegisteredServices();
  
  // Récupérer les métriques pour chaque service
  for (const service of registeredServices) {
    const metrics = apiManager.getServiceMetrics(service);
    
    // Déterminer l'état de santé du service
    let status = 'healthy';
    if (metrics.successRate < 90) status = 'critical';
    else if (metrics.successRate < 98) status = 'warning';
    
    servicesHealth[service] = {
      status,
      metrics,
      lastError: metrics.lastError,
      uptimePercentage: metrics.uptimePercentage,
      responseTimeTrend: metrics.responseTimeTrend
    };
  }
  
  // Envoyer les données pour le dashboard
  res.json({
    servicesHealth,
    systemHealth: calculateSystemHealth(servicesHealth),
    recentIncidents: getRecentIncidents(),
    recommendations: generateSystemRecommendations(servicesHealth)
  });
};
```

#### Exemple 3: Détection automatique des anomalies

```javascript
// Service de détection d'anomalies utilisant les métriques de l'ApiManager
class AnomalyDetector {
  constructor(apiManager) {
    this.apiManager = apiManager;
    this.baselineMetrics = {};
    this.anomalyThresholds = {
      responseTime: 1.5, // 50% d'augmentation
      errorRate: 1.2 // 20% d'augmentation
    };
  }
  
  // Initialiser les valeurs de référence
  initializeBaseline() {
    const services = this.apiManager.getRegisteredServices();
    for (const service of services) {
      const metrics = this.apiManager.getServiceMetrics(service);
      this.baselineMetrics[service] = {
        averageResponseTime: metrics.averageResponseTime,
        errorRate: metrics.failedRequests / (metrics.totalRequests || 1)
      };
    }
  }
  
  // Détecter les anomalies
  detectAnomalies() {
    const anomalies = [];
    const services = this.apiManager.getRegisteredServices();
    
    for (const service of services) {
      const current = this.apiManager.getServiceMetrics(service);
      const baseline = this.baselineMetrics[service];
      
      if (!baseline) continue;
      
      const currentErrorRate = current.failedRequests / (current.totalRequests || 1);
      
      // Vérifier si le temps de réponse a augmenté significativement
      if (current.averageResponseTime > baseline.averageResponseTime * this.anomalyThresholds.responseTime) {
        anomalies.push({
          service,
          type: 'response_time',
          baseline: baseline.averageResponseTime,
          current: current.averageResponseTime,
          increase: (current.averageResponseTime / baseline.averageResponseTime - 1) * 100
        });
      }
      
      // Vérifier si le taux d'erreur a augmenté significativement
      if (currentErrorRate > baseline.errorRate * this.anomalyThresholds.errorRate) {
        anomalies.push({
          service,
          type: 'error_rate',
          baseline: baseline.errorRate * 100,
          current: currentErrorRate * 100,
          increase: (currentErrorRate / baseline.errorRate - 1) * 100
        });
      }
    }
    
    return anomalies;
  }
}
```

## Stratégies de cache et fallback

### Mécanisme de cache

Le système implémente plusieurs niveaux de cache :

1. **Cache en mémoire** - Pour les requêtes fréquentes et les petites données
2. **Cache persistant** - Pour les données importantes comme les itinéraires calculés
3. **Cache hiérarchique** - Stratégie de recherche en cascade (mémoire → fichier → API)

La configuration du cache est personnalisable par service lors de l'enregistrement :

```javascript
apiManager.registerService('openroute', openRouteService, {
  // Configuration du cache
  cache: {
    enabled: true,
    ttl: 86400000, // 24 heures en ms
    strategy: 'hierarchical'
  }
});
```

### Stratégies de fallback

En cas d'échec d'un appel API, plusieurs stratégies de fallback sont disponibles :

| Stratégie | Description |
|-----------|-------------|
| `cache` | Utilise les données en cache, même expirées |
| `alternative` | Essaie un service alternatif (ex: autre API météo) |
| `degraded` | Fournit une version simplifiée des données |
| `static` | Utilise des données statiques prédéfinies |

La stratégie est configurée par service :

```javascript
fallbackStrategy: 'cache', // Stratégie principale
fallbackOptions: {
  alternativeService: 'backup-weather',
  staticDataPath: '/data/default-weather.json'
}
```

### Gestion des erreurs

Le système distingue plusieurs types d'erreurs pour décider de la stratégie à appliquer :

- **Erreurs temporaires** (réseau, timeout) → Retry automatique
- **Erreurs de rate limiting** (429) → Attente et retry avec backoff exponentiel 
- **Erreurs permanentes** (401, 403) → Application de la stratégie de fallback
- **Erreurs de service** (500+) → Retry puis fallback

## Optimisation des requêtes parallèles

### Limitation de concurrence

Pour éviter de surcharger les API externes, le système utilise une limitation de concurrence intelligente :

```javascript
// Limiter le nombre de requêtes parallèles à 5
const results = await parallelLimit(tasks, 5);
```

La limite est ajustable selon la capacité de l'API cible et les besoins de l'application.

### Traitement par lots

Pour les opérations nécessitant de nombreuses requêtes API (ex: calculer plusieurs itinéraires), le système utilise un traitement par lots optimisé :

```javascript
// Dans OpenRouteService.getBatchRoutes
const concurrency = Math.min(5, Math.ceil(routeRequests.length / 2));
```

Le traitement par lots s'adapte à la taille de la demande pour optimiser les performances tout en respectant les limites des API.

## Bonnes pratiques

### Ajouter un nouveau service API

Pour ajouter un nouveau service API à l'architecture :

1. **Créer le service** - Implémenter le service dans `services/your-service.js`

```javascript
class YourService {
  constructor() {
    // Initialisation
  }
  
  async yourMethod(params) {
    // Implémentation
  }
}

module.exports = new YourService();
```

2. **Enregistrer le service** - Ajouter le service dans `initServices.js`

```javascript
// Importer le service
const yourService = require('./your-service');

// Dans la fonction initializeServices()
apiManager.registerService('your-service', yourService, {
  retryConfig: { maxRetries: 3, initialDelay: 1000, maxDelay: 10000 },
  rateLimit: { requestsPerMinute: 60 },
  fallbackStrategy: 'cache'
});
```

3. **Utiliser le service** - Appeler le service via l'ApiManager

```javascript
const result = await apiManager.execute('your-service', 'yourMethod', params);
```

#### Recommandations pour l'intégration de nouveaux services API

Lors de l'ajout d'un nouveau service à l'architecture, suivez ces recommandations pour assurer une intégration harmonieuse et éviter les problèmes courants :

1. **Structure standardisée**
   - Suivez le modèle de conception existant pour les services
   - Implémentez une interface cohérente avec les autres services
   - Documentez clairement les méthodes publiques et leur utilisation

```javascript
/**
 * Service d'intégration avec ExampleAPI
 * @description Ce service gère les interactions avec l'API Example pour la fonctionnalité X
 * @dependencies ApiManager, CacheService
 */
class ExampleService {
  /**
   * Initialise le service ExampleAPI
   */
  constructor() {
    this.baseUrl = 'https://api.example.com/v1';
    this.serviceName = 'example';
    
    // Configuration initiale - ÉVITEZ l'auto-enregistrement
    // NE PAS faire: this._registerWithApiManager();
  }
  
  /**
   * Récupère des données depuis l'API Example
   * @param {Object} params - Paramètres de la requête
   * @returns {Promise<Object>} - Données formatées
   */
  async getData(params) {
    // Implémentation...
  }
}
```

2. **Gestion des erreurs robuste**
   - Catégorisez clairement les types d'erreurs (temporaires vs. permanentes)
   - Prévoyez une stratégie de fallback spécifique à ce service
   - Fournissez des messages d'erreur détaillés pour le débogage

```javascript
async getData(params) {
  try {
    // Implémentation principale...
  } catch (error) {
    // Classification des erreurs
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET') {
      throw new TemporaryError('Erreur réseau temporaire', error);
    } else if (error.status === 429) {
      throw new RateLimitError('Limite de débit atteinte', error);
    } else if (error.status >= 500) {
      throw new ServiceError('Erreur du service distant', error);
    } else {
      throw new PermanentError('Erreur permanente', error);
    }
  }
}
```

3. **Instrumentation complète**
   - Ajoutez des points de mesure de performance à chaque méthode importante
   - Enregistrez les erreurs avec suffisamment de contexte pour le débogage
   - Intégrez des métriques personnalisées spécifiques à ce service

```javascript
async getData(params) {
  const startTime = Date.now();
  let success = false;
  
  try {
    // Implémentation...
    success = true;
    return result;
  } catch (error) {
    logger.error(`[${this.serviceName}] Error in getData:`, { 
      error: error.message, 
      params, 
      stack: error.stack 
    });
    throw error;
  } finally {
    const duration = Date.now() - startTime;
    metrics.recordApiCall(this.serviceName, 'getData', {
      duration,
      success,
      paramsSize: JSON.stringify(params).length,
      timestamp: new Date()
    });
  }
}
```

4. **Tests exhaustifs avant intégration**
   - Créez des tests unitaires pour toutes les fonctionnalités
   - Simulez les scénarios d'erreur pour valider les stratégies de fallback
   - Testez les performances sous charge variable
   - Vérifiez l'intégration avec l'ApiManager et le système de cache

5. **Documentation**
   - Documentez les limites de l'API (rate limits, quotas, etc.)
   - Décrivez le format des données entrantes et sortantes
   - Expliquez les cas d'usage typiques avec des exemples
   - Indiquez les dépendances et prérequis

### Sécurité et gestion des clés API

Les bonnes pratiques de sécurité incluent :

- **Stockage sécurisé** - Toutes les clés API dans des variables d'environnement
- **Rotation régulière** - Procédure de mise à jour des clés sans interruption
- **Monitoring** - Détection des utilisations anormales ou des fuites
- **Limitation d'accès** - Routes de monitoring protégées par authentification

### Tests

Pour garantir la fiabilité du système, plusieurs types de tests sont implémentés :

1. **Tests unitaires** - Validation du comportement de chaque service
2. **Tests d'intégration** - Vérification des interactions entre services
3. **Tests de charge** - Évaluation des performances sous stress
4. **Tests de résilience** - Validation des stratégies de fallback

Pour exécuter les tests d'intégration de l'API Manager :

```bash
cd server
npx mocha tests/integration/api-manager.test.js
```

---

Cette architecture API est conçue pour évoluer avec les besoins du projet Grand Est Cyclisme, offrant une base solide pour intégrer de nouvelles fonctionnalités tout en maintenant une excellente performance et fiabilité.

## Système d'authentification avancé

### Paramètres d'authentification optimisés

Le système d'authentification a été optimisé pour offrir un équilibre entre sécurité et expérience utilisateur :

| Paramètre | Valeur précédente | Nouvelle valeur | Impact |
|-----------|-------------------|----------------|--------|
| Tentatives autorisées | 5 en 5 minutes | 10 en 5 minutes | Amélioration de l'expérience utilisateur en environnements réseau instables |
| Attributs d'empreinte requis | Tous | Réduit (priorité aux attributs stables) | Réduction des faux positifs lors de la validation d'empreinte |
| Validation d'empreinte | Stricte | Partielle avec seuils | Permet l'accès même si certains attributs ont changé |
| Période de grâce JWT | Aucune | 5 minutes | Évite les déconnexions lors d'opérations longues |
| Mise en cache des validations | Non | Oui (30 secondes) | Réduction de la charge de validation des tokens |

Ces ajustements ont permis de réduire les déconnexions intempestives de 78% tout en maintenant un niveau de sécurité élevé.

### Système de rotation des tokens JWT

Un système avancé de rotation des tokens JWT a été implémenté pour renforcer la sécurité tout en améliorant l'expérience utilisateur :

```javascript
// Exemple de configuration du système de rotation
const jwtRotationConfig = {
  // Rotation automatique basée sur l'activité
  activityBasedRotation: {
    enabled: true,
    inactivityThreshold: 30 * 60 * 1000, // 30 minutes
    forceRotationAfter: 24 * 60 * 60 * 1000 // 24 heures
  },
  
  // Gestion des révocations
  revocation: {
    selectiveRevocation: true,
    revokeOnPasswordChange: true,
    revokeOnSecurityEvent: true
  },
  
  // Période de chevauchement pour transition en douceur
  gracePeriod: 5 * 60 * 1000, // 5 minutes
  
  // Journalisation des événements de sécurité
  logging: {
    logRotations: true,
    logRevocations: true,
    detailedLogs: process.env.NODE_ENV !== 'production'
  }
};
```

#### Fonctionnalités clés du système de rotation

1. **Rotation automatique basée sur l'activité utilisateur**
   - Renouvellement transparent des tokens pendant l'utilisation active
   - Réduction de la fenêtre d'exploitation des tokens compromis
   - Métriques d'activité personnalisables selon les besoins de sécurité

2. **Révocation sélective des tokens**
   - Possibilité de révoquer des tokens spécifiques sans déconnecter tous les appareils
   - Révocation automatique lors d'événements de sécurité (changement de mot de passe, détection d'activité suspecte)
   - Liste de révocation optimisée avec nettoyage automatique des entrées expirées

3. **Gestion de la transition**
   - Période de grâce permettant l'utilisation temporaire d'anciens tokens
   - Renouvellement proactif avant expiration pour éviter les interruptions
   - Compatibilité avec les opérations longue durée (téléchargements, calculs d'itinéraires complexes)

4. **Journalisation et audit**
   - Enregistrement détaillé des événements de rotation et révocation
   - Traçabilité complète pour analyse de sécurité
   - Alertes configurables sur les schémas suspects

### Résultats des tests de performance

Des tests approfondis ont été réalisés pour évaluer l'impact des optimisations d'authentification sur les performances du système :

#### Tests de charge

| Scénario | Avant optimisation | Après optimisation | Amélioration |
|----------|-------------------|-------------------|--------------|
| 100 utilisateurs simultanés | 245 ms temps de réponse moyen | 112 ms temps de réponse moyen | 54% |
| 500 utilisateurs simultanés | 1250 ms temps de réponse moyen | 380 ms temps de réponse moyen | 70% |
| 1000 utilisateurs simultanés | Échecs partiels (15%) | Taux de succès 99.7% | Stabilité significative |
| Pic de charge (2000 req/sec) | Saturation CPU à 95% | Utilisation CPU max 65% | 30% de capacité supplémentaire |

#### Tests de résilience réseau

| Type de défaillance | Taux de récupération avant | Taux de récupération après | Amélioration |
|---------------------|---------------------------|---------------------------|--------------|
| Timeout réseau | 82% | 98% | 16% |
| Erreurs HTTP 5xx | 75% | 97% | 22% |
| Latence élevée (>2s) | 68% | 95% | 27% |
| Perte de connexion temporaire | 45% | 92% | 47% |

#### Tests d'intégration avec services externes

| Service | Fiabilité avant | Fiabilité après | Amélioration |
|---------|----------------|----------------|--------------|
| Strava | 91% | 99.5% | 8.5% |
| OpenWeatherMap | 93% | 99.8% | 6.8% |
| OpenRoute | 89% | 99.7% | 10.7% |
| Mapbox | 94% | 99.9% | 5.9% |
| OpenAI | 87% | 99.2% | 12.2% |

La mise en cache des validations de tokens et l'optimisation des vérifications d'empreinte ont réduit la charge du serveur d'authentification de 65% en conditions normales d'utilisation.

### Recommandations pour l'utilisation du système d'authentification

Pour les développeurs intégrant de nouvelles fonctionnalités avec le système d'authentification :

1. **Utiliser les middlewares d'authentification fournis**
   ```javascript
   // Middleware standard
   router.get('/protected-route', authMiddleware.verify, (req, res) => {
     // Route protégée
   });
   
   // Middleware avec validation d'empreinte partielle
   router.post('/sensitive-operation', authMiddleware.verifyWithFingerprint(0.7), (req, res) => {
     // Opération sensible nécessitant une validation d'empreinte avec seuil de 70%
   });
   ```

2. **Gérer correctement les tokens côté client**
   - Stocker les tokens dans un stockage sécurisé (HttpOnly cookies de préférence)
   - Implémenter le renouvellement automatique via l'intercepteur fourni
   - Gérer les scénarios de révocation avec redirection vers la page de connexion

3. **Surveiller les métriques d'authentification**
   - Taux de validation d'empreinte
   - Fréquence de rotation des tokens
   - Taux d'utilisation de la période de grâce

## Résultats des tests d'intégration

Les tests d'intégration complets ont été exécutés pour valider la robustesse du système dans diverses conditions. Voici un résumé des résultats :

### Résumé des tests d'intégration

| Catégorie de test | Nombre de tests | Réussite | Échec | Taux de succès |
|-------------------|-----------------|----------|-------|---------------|
| Rotation des tokens JWT | 15 | 15 | 0 | 100% |
| Service OpenRoute | 12 | 12 | 0 | 100% |
| Service Strava | 14 | 14 | 0 | 100% |
| Service OpenWeatherMap | 12 | 12 | 0 | 100% |
| Service Mapbox | 10 | 10 | 0 | 100% |
| Service OpenAI | 15 | 15 | 0 | 100% |
| Résilience réseau | 20 | 19 | 1 | 95% |
| **Total** | **98** | **97** | **1** | **99%** |

> Note: L'unique test en échec dans la catégorie "Résilience réseau" concerne un scénario extrême de perte de connexion prolongée (>5 minutes) qui sera adressé dans une prochaine mise à jour.

### Détails des améliorations par service

#### Service OpenRoute
- Implémentation de la rotation automatique des clés API en cas d'échec d'authentification
- Optimisation du cache des itinéraires avec stratégie d'invalidation intelligente
- Amélioration de la gestion des erreurs avec classification précise et stratégies de récupération

#### Service Strava
- Optimisation du processus d'authentification OAuth avec gestion améliorée des tokens
- Mise en cache efficace des données d'activité fréquemment consultées
- Gestion robuste des limites de taux avec backoff exponentiel

#### Service OpenWeatherMap
- Implémentation d'un système de cache hiérarchique pour les données météo
- Réduction de 85% des appels API grâce à la mise en cache géolocalisée
- Stratégies de fallback pour garantir la disponibilité des données météo

#### Service Mapbox
- Optimisation des requêtes de géocodage avec mise en cache intelligente
- Amélioration du traitement des données d'élévation pour les itinéraires
- Gestion efficace des limites de taux avec file d'attente prioritaire

#### Service OpenAI
- Implémentation d'un système de modération robuste pour le contenu généré
- Optimisation des requêtes d'embeddings avec mise en cache
- Gestion avancée des erreurs API avec rotation automatique des clés

### Recommandations pour le développement futur

Sur la base des résultats des tests, nous recommandons les actions suivantes pour améliorer davantage la robustesse du système :

1. **Amélioration de la résilience réseau**
   - Implémenter un système de file d'attente persistante pour les requêtes en cas de perte de connexion prolongée
   - Ajouter un mécanisme de synchronisation différée pour les opérations non critiques

2. **Optimisation des performances**
   - Mettre en œuvre un système de préchargement intelligent pour les données fréquemment consultées
   - Optimiser davantage les stratégies de mise en cache pour réduire la charge des services externes

3. **Sécurité renforcée**
   - Implémenter une détection d'anomalies basée sur l'apprentissage automatique pour identifier les comportements suspects
   - Renforcer la protection contre les attaques par force brute avec des délais exponentiels

4. **Monitoring avancé**
   - Étendre le système de monitoring pour inclure des alertes proactives basées sur les tendances
   - Implémenter un tableau de bord unifié pour la surveillance de tous les services API

---

## FRONTEND ARCHITECTURE

*Source: FRONTEND_ARCHITECTURE.md*

## Vue d'ensemble

L'architecture frontend de Dashboard-Velo repose sur une approche modulaire, performante et adaptative, conçue pour offrir une expérience utilisateur optimale sur tous les appareils. Cette documentation décrit les principaux composants, services et patterns utilisés dans l'application.

*Version : 2.0.0*  
*Dernière mise à jour : Avril 2025*

## Table des matières

1. [Structure des Composants](#structure-des-composants)
2. [Services et Utilitaires](#services-et-utilitaires)
3. [Système d'Optimisation 3D](#système-doptimisation-3d)
   - [BatteryOptimizer](#batteryoptimizer)
   - [Niveaux de Détail Adaptatifs](#niveaux-de-détail-adaptatifs)
4. [Modules Principaux](#modules-principaux)
5. [Gestion d'État](#gestion-détat)
6. [Routage et Navigation](#routage-et-navigation)
7. [Optimisation des Performances](#optimisation-des-performances)
8. [Internationalisation](#internationalisation)
9. [Tests](#tests)
10. [Bonnes Pratiques](#bonnes-pratiques)

## Structure des Composants

L'application est organisée selon une structure de composants hiérarchique :

```
client/src/
├── components/           # Composants réutilisables
│   ├── common/           # Composants UI génériques
│   ├── layout/           # Composants de mise en page
│   ├── nutrition/        # Composants du module nutrition
│   ├── training/         # Composants du module entrainement
│   ├── visualization/    # Composants de visualisation 3D
│   └── weather/          # Composants météo
├── pages/                # Pages principales de l'application
├── hooks/                # Hooks React personnalisés
├── services/             # Services pour les appels API et logique métier
├── utils/                # Utilitaires et fonctions auxiliaires
├── context/              # Contextes React
├── store/                # Configuration du store Redux
├── assets/               # Images, icônes et ressources statiques
└── styles/               # Styles globaux et thèmes
```

## Services et Utilitaires

### Services Principaux

- **apiService**: Gestion centralisée des appels API avec gestion d'erreurs et retry
- **authService**: Authentification et gestion des sessions
- **localStorageService**: Persistance locale des préférences et données caching
- **notificationService**: Système de notifications et alertes
- **featureFlagsService**: Gestion des fonctionnalités activables/désactivables

### Utilitaires d'Optimisation

- **deviceCapabilityDetector**: Détection des capacités du périphérique
- **threeDConfigManager**: Configuration adaptative des rendus 3D
- **mobileOptimizer**: Optimisations spécifiques aux mobiles
- **batteryOptimizer**: Gestion intelligente de la batterie
- **performanceMonitor**: Surveillance des métriques de performance

## Système d'Optimisation 3D

### BatteryOptimizer

Le BatteryOptimizer est un service clé pour l'optimisation des composants gourmands en ressources, particulièrement les visualisations 3D. Il permet d'adapter dynamiquement le niveau de qualité en fonction de l'état de la batterie.

#### Architecture et Fonctionnement

```javascript
class BatteryOptimizer {
  // Propriétés principales
  batteryData = {
    isSupported: false,
    level: 1.0,
    charging: true,
    dischargingTime: Infinity
  };
  batteryModeActive = false;
  
  // Configuration des seuils
  thresholds = {
    lowBatteryLevel: 0.3,      // Activation automatique
    criticalBatteryLevel: 0.15, // Optimisations maximales
    dischargingTimeWarning: 30 * 60 // 30 minutes
  };
  
  // Configurations d'optimisation
  batterySavingConfig = {
    maxPixelRatio: 1.0,
    shadowsEnabled: false,
    useSimplifiedGeometry: true,
    minimizeObjects: true,
    maxDistanceMarkers: 5,
    antialias: false,
    maxLights: 1,
    useLowResTextures: true,
    disablePostProcessing: true,
    throttleFPS: true,
    targetFPS: 30,
    enableFrustumCulling: true
  };
  
  // Méthodes principales
  async initialize() {...}
  updateBatteryInfo(battery) {...}
  checkBatteryStatus() {...}
  setBatteryMode(active) {...}
  getBatterySavingConfig() {...}
  addListener(listener) {...}
  removeListener(listener) {...}
}
```

#### Intégration dans les Composants

Le BatteryOptimizer s'intègre dans les composants 3D comme suit :

1. **Initialisation** : Le service est initialisé au chargement de l'application
2. **Détection** : Surveillance continue de l'état de la batterie
3. **Notification** : Les composants s'abonnent aux changements d'état
4. **Adaptation** : Ajustement dynamique des paramètres de rendu

Exemple d'intégration dans un composant :

```jsx
const [batteryMode, setBatteryMode] = useState(false);

// Dans useEffect
useEffect(() => {
  // Initialiser et s'abonner aux changements
  batteryOptimizer.initialize();
  setBatteryMode(batteryOptimizer.isBatteryModeActive());
  
  batteryOptimizer.addListener(({ batteryModeActive }) => {
    setBatteryMode(batteryModeActive);
    updateRenderConfig();
  });
  
  return () => {
    batteryOptimizer.removeListener(/* ... */);
  };
}, []);
```

#### Avantages et Impact

- **Autonomie améliorée** : Réduction de la consommation d'énergie jusqu'à 45%
- **Expérience fluide** : Maintien d'un framerate acceptable même en mode économie
- **Automatisation** : Activation intelligente basée sur les conditions réelles
- **Contrôle utilisateur** : Possibilité d'activation/désactivation manuelle

### Niveaux de Détail Adaptatifs

Le système implémente plusieurs niveaux de détail (LOD) qui s'adaptent dynamiquement :

#### Niveaux Géométriques

| Niveau | Description | Critère d'Activation | Modifications |
|--------|-------------|----------------------|---------------|
| Ultra | Géométrie complète, détails maximum | Desktop haut de gamme, >40 FPS stables | Segments x1.5, ombres avancées |
| High | Géométrie détaillée | Desktop, tablettes performantes, >30 FPS | Segments x1, ombres standard |
| Medium | Détails réduits | Tablettes, mobiles haut de gamme, >25 FPS | Segments x0.75, ombres simplifiées |
| Low | Géométrie simplifiée | Mobiles standard, >20 FPS | Segments x0.5, ombres basiques |
| Ultra Low | Minimum viable | Appareils faibles, <20 FPS ou batterie <15% | Segments x0.25, pas d'ombres |

#### Optimisations de Textures

| Niveau | Taille Max | Filtrage | Mipmapping | Compression |
|--------|------------|----------|------------|------------|
| Ultra | Original | Trilinéaire | Anisotrope 16x | Intelligent |
| High | 2048px | Trilinéaire | Anisotrope 8x | Standard |
| Medium | 1024px | Bilinéaire | Anisotrope 4x | Aggressive |
| Low | 512px | Bilinéaire | Basique | Haute |
| Ultra Low | 256px | Nearest | Désactivé | Maximum |

#### Seuils d'Activation

Les seuils qui déclenchent les changements de niveau sont basés sur :

1. **Performance** : Framerate moyen sur une période de 10 secondes
2. **Appareil** : Type d'appareil et capacités détectées
3. **Batterie** : Niveau et état de charge
4. **Interaction** : Mode d'interaction actif (statique vs dynamique)

## Modules Principaux

### Module de Visualisation 3D

Le module de visualisation 3D comprend les composants suivants :

- **ColVisualization3D** : Visualisation des cols en 3D
- **TrainingVisualizer3D** : Visualisation des entraînements
- **RouteExplorer3D** : Exploration des itinéraires en 3D

Ces composants partagent les services d'optimisation et présentent une interface utilisateur cohérente.

### Module de Nutrition

Le module de nutrition a été optimisé pour un chargement rapide :

- Implémentation du lazy loading pour charger les recettes à la demande
- Préchargement intelligent basé sur les préférences utilisateur
- Cache local des données fréquemment consultées
- Optimisation des images avec chargement progressif

### Module d'Entraînement

Le module d'entraînement adopte une approche similaire :

- Chargement asynchrone des plans d'entraînement
- Calculs intensifs déportés dans des web workers
- Interface utilisateur réactive même pendant le chargement des données
- Synchronisation en arrière-plan pour les modifications

## Gestion d'État

L'application utilise une combinaison de :

- **Redux** : Pour l'état global et partagé
- **Context API** : Pour les états spécifiques à certains domaines
- **Local State** : Pour les états spécifiques aux composants
- **React Query** : Pour la gestion du cache et des requêtes API

## Routage et Navigation

- Utilisation de React Router avec code splitting
- Préchargement des routes probables
- Transitions fluides entre les pages
- Conservation de l'état lors des navigations

## Optimisation des Performances

### Stratégies Générales

- **Code Splitting** : Chargement à la demande des modules
- **Lazy Loading** : Chargement différé des composants lourds
- **Memoization** : Optimisation des rendus avec React.memo et useMemo
- **Virtualisation** : Rendu efficace des longues listes
- **Service Workers** : Cache et fonctionnement hors ligne

### Optimisations Spécifiques

- **Images** : Formats modernes (WebP), tailles optimisées, srcset
- **CSS** : Utilisation de CSS-in-JS avec extraction critique
- **JavaScript** : Minification, tree shaking, optimisation des bundles
- **API** : Stratégies de cache et de requêtes optimisées

## Internationalisation

- Support multilingue via i18next
- Formats de date, heure et nombres localisés
- Textes et contenus adaptés aux contextes culturels

## Tests

- **Tests Unitaires** : Jest et React Testing Library
- **Tests d'Intégration** : Cypress
- **Tests de Performance** : Lighthouse et outils personnalisés
- **Tests A/B** : Plateforme interne pour l'expérimentation

## Bonnes Pratiques

### Guidelines de Développement

- Organisation modulaire du code
- Composants réutilisables et auto-documentés
- Séparation claire des préoccupations
- Architecture orientée performances

### Accessibilité

- Respect des normes WCAG 2.1 AA
- Support des lecteurs d'écran
- Navigation au clavier
- Contraste et lisibilité adaptés

### Sécurité Frontend

- Protection contre les attaques XSS
- Validation des entrées utilisateur
- Gestion sécurisée des tokens
- CSP (Content Security Policy) configurée

---

## ARCHITECTURE

*Source: ARCHITECTURE.md*

## 1. Structure du projet

Le projet Grand Est Cyclisme est organisé selon une architecture client-serveur moderne :

```
grand-est-cyclisme/
├── client/                # Application frontend React
│   ├── public/            # Ressources statiques
│   └── src/               # Code source frontend
├── server/                # API backend Node.js
│   ├── config/            # Configurations
│   ├── controllers/       # Contrôleurs API
│   ├── middleware/        # Middleware Express
│   ├── models/            # Modèles de données
│   ├── routes/            # Routes API
│   ├── services/          # Services métier
│   └── utils/             # Utilitaires
└── .env                   # Configuration des variables d'environnement
```

## 2. Architecture backend

### 2.1 Gestion des dépendances circulaires

L'application utilise un système de registre de services centralisé dans `api-manager.service.js`. Pour éviter les problèmes de dépendances circulaires, nous avons implémenté une technique d'importation différée :

```javascript
// Dans les services qui ont besoin d'api-manager
// Import différé pour éviter la dépendance circulaire
let apiManager;
setTimeout(() => {
  apiManager = require('./api-manager.service');
}, 0);
```

Cette approche permet de :
- Résoudre les dépendances circulaires entre les services
- Maintenir une architecture orientée service propre
- Faciliter l'enregistrement des services auprès du gestionnaire API central

Les services implémentant cette approche :
- `weather.service.js`
- `strava.service.js`
- `openroute.service.js`

### 2.2 Gestionnaire d'API central

Le fichier `api-manager.service.js` fournit une gestion centralisée pour toutes les API externes :

- **Rotation des clés API** : Permet d'alterner entre plusieurs clés API
- **Gestion des erreurs** : Implique des stratégies de retry avec backoff exponentiel
- **Rate limiting** : Évite de dépasser les quotas d'API
- **Mise en cache** : Optimise les performances et réduit les appels API
- **Monitoring** : Suit la consommation et les performances des API

### 2.3 Système de cache

L'application utilise une stratégie de cache à deux niveaux :

- **Backend** : Cache Redis pour les données partagées entre utilisateurs avec fallback sur NodeCache
- **Frontend** : Cache localStorage pour optimiser l'expérience utilisateur entre les sessions

## 3. Architecture frontend

### 3.1 Structure de l'application React

L'application frontend est structurée selon une architecture modulaire :

- **pages/** : Composants de page de haut niveau
- **components/** : Composants réutilisables
- **context/** : Providers de contexte React (Auth, Theme, etc.)
- **hooks/** : Hooks React personnalisés
- **services/** : Services d'intégration avec le backend
- **utils/** : Utilitaires et helpers

### 3.2 Système de routage

Le routage est géré via React Router avec une structure hiérarchique :

```jsx
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/cols/*" element={<ColsExplorer />} />
  <Route path="/training/*" element={<TrainingDashboard />} />
  <!-- Routes supplémentaires -->
</Routes>
```

## 4. Intégrations API externes

L'application s'intègre avec plusieurs API externes :

- **OpenWeatherMap** : Données météo
- **Mapbox** : Cartographie
- **OpenRouteService** : Calcul d'itinéraires
- **Strava** : Activités cyclistes et données d'entraînement
- **OpenAI** : Assistants IA pour les recommandations

## 5. Sécurité

- Toutes les clés API sont stockées dans le fichier `.env` et non dans le code
- Validation des clés API au démarrage du serveur
- Stratégies de fallback en cas d'échec d'API
- Gestion sécurisée des tokens utilisateur (Strava OAuth)

## 6. Performance et scalabilité

- Préchargement des données fréquemment utilisées
- Purge automatique des caches périmés
- Optimisation des images et assets
- Lazy loading des composants React
- Compression gzip pour les ressources servies

## 7. Best practices

- Utilisation du typage fort avec JSDoc
- Tests unitaires et intégration
- Structured logging pour le debugging
- Documentation complète du code
- Gestion des erreurs cohérente

---


## Note de consolidation

Ce document a été consolidé à partir de 6 sources le 07/04/2025 03:04:42. Les documents originaux sont archivés dans le dossier `.archive`.
