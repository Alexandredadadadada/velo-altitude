# Documentation Technique Complète - Dashboard-Velo

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
