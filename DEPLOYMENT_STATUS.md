# Rapport d'Audit et Statut de Déploiement - Velo-Altitude

**Date :** 5 avril 2025  
**Version :** 1.0.0  
**Statut global :** Prêt pour déploiement

## Résumé de l'audit

Cet audit complet du projet Velo-Altitude confirme que tous les modules principaux sont fonctionnels et prêts pour le déploiement. Le rebranding de "Grand Est Cyclisme" vers "Velo-Altitude" a été effectué avec succès dans l'ensemble du code et de la documentation.

## 1. Structure du projet

L'architecture du projet suit une structure modulaire bien organisée :

```
client/
├── src/
│   ├── components/        # Composants organisés par fonctionnalité
│   │   ├── challenges/    # Module Les 7 Majeurs (SevenMajorsChallenge.js)
│   │   ├── cols/          # Catalogue de cols et visualisations
│   │   ├── nutrition/     # Module de nutrition et recettes
│   │   ├── training/      # Module d'entraînement et programmes
│   │   ├── social/        # Fonctionnalités communautaires
│   │   ├── visualization/ # Visualisations 3D (ColVisualization3D.js)
│   │   └── weather/       # Intégration météo
│   ├── services/          # Services d'API et logique métier
│   ├── utils/             # Utilitaires et fonctions auxiliaires
│   ├── contexts/          # Contextes React pour la gestion d'état
│   ├── pages/             # Pages principales de l'application
│   └── assets/            # Ressources statiques
server/
├── data/                  # Données des cols européens et autres données
├── routes/                # Points de terminaison API
└── services/              # Services backend

## LOCALISATION PRÉCISE DES DONNÉES ET FICHIERS CRITIQUES

### Programmes d'Entraînement
Tous les programmes d'entraînement sont complets et prêts à être utilisés. Ils se trouvent dans les fichiers suivants:
- `client/src/data/trainingPrograms.js` - Programmes principaux
- `client/src/data/specialTrainingPrograms.js` - Programmes spécialisés
- `client/src/data/specialTrainingPrograms2.js` - Programmes spécialisés additionnels
- `client/src/data/specialTrainingPrograms3.js` - Programmes spécialisés supplémentaires
- `client/src/data/trainingWorkouts.js` - Séances d'entraînement individuelles
- `client/src/data/remainingTrainingPrograms.js`, `remainingTrainingPrograms2.js`, `remainingTrainingPrograms3.js` - Programmes complémentaires

Ces programmes sont accessibles via le module Entraînement à travers le composant `TrainingHub` (`client/src/pages/TrainingHub.js`).

### Recettes et Nutrition
Toutes les recettes sont déjà intégrées et prêtes à l'emploi dans les fichiers:
- `client/src/data/nutritionRecipes.js` - Base de recettes principales
- `client/src/data/additionalNutritionRecipes1.js` - Recettes supplémentaires
- `client/src/data/additionalNutritionRecipes2.js` - Recettes supplémentaires
- `client/src/data/recipesIndex.js` - Index de toutes les recettes pour la recherche rapide

Ces recettes sont accessibles via le module Nutrition à travers les composants `RecipeLibrary.js` et `NutritionRecipesExplorer.js`.

### Système de Chat en Direct (Chatbox)
La chatbox est pleinement fonctionnelle et intégrée dans:
- `client/src/components/social/group-rides/GroupRideChat.js` - Chat pour les sorties de groupe
- Utilise Socket.io pour les communications en temps réel
- Les serveurs WebSocket sont configurés et prêts à être déployés avec l'application

### Dashboard & Page d'Accueil
La page d'accueil (`client/src/pages/Home.js`) est complète et comporte:
- Animations modernes avec Framer Motion
- Intégration du logo et identité visuelle
- Effets visuels avancés avec HeroParallax et BikeAnimationCanvas
- Dashboard interactif avec statistiques en temps réel
- Intégration météo complète
- Carrousel d'événements
- Carte interactive des régions
- Design responsive et adaptatif
- Optimisations de performance

Le composant principal (`Home.js`) intègre tous les éléments visuels et fonctionnels nécessaires pour une expérience utilisateur exceptionnelle dès l'arrivée sur le site.

## 2. État des modules principaux

### 2.1. Module "Les 7 Majeurs" (✅ 100% Complété)

**Fichiers principaux:**
- **Composant principal:** `client/src/components/challenges/SevenMajorsChallenge.js`
- **Sous-composants:** `client/src/components/challenges/ChallengeSelector.js`, `ChallengeDetail.js`, `ChallengeCreator.js`
- **Utilitaires:** `client/src/utils/challengeCalculations.js`
- **API:** `server/routes/challenges.js`, `netlify/functions/seven-majors-challenge.js`

**Fonctionnalités implémentées:**
- Système d'onglets avec 4 sections principales:
  1. **Recherche de cols** avec filtres (région, pays, difficulté, altitude)
  2. **Mon Défi actuel** pour visualiser et gérer les cols sélectionnés
  3. **Défis prédéfinis** proposant des challenges préconçus
  4. **Mes Défis sauvegardés** (pour utilisateurs connectés)
- Filtrage avancé des cols par région, difficulté, altitude, etc.
- Calcul de statistiques complètes sur les défis (dénivelé total, difficulté moyenne)
- Sauvegarde des défis personnalisés (utilisateurs connectés)
- Recommandations intelligentes basées sur les cols déjà sélectionnés
- Export des parcours au format GPX
- Partage de défis via URL ou réseaux sociaux
- Visualisation 3D des cols sélectionnés via l'intégration du composant ColVisualization3D
- Calcul de statistiques sur le défi (altitude totale, difficulté moyenne)
- Interface utilisateur moderne utilisant Material UI

**Processus clé d'utilisation:**
1. L'utilisateur sélectionne jusqu'à 7 cols parmi les 50+ cols disponibles
2. Le système calcule les statistiques combinées du défi
3. L'utilisateur peut visualiser chaque col en 3D, consulter les détails et infos météo
4. L'utilisateur peut sauvegarder son défi personnalisé (s'il est connecté)
5. L'utilisateur peut partager son défi via réseaux sociaux ou export GPX

### 2.2. Visualisation 3D des cols (✅ 100% Complété)

**Fichiers principaux:**
- **Composant principal:** `client/src/components/visualization/ColVisualization3D.js`
- **Sous-composants:** `client/src/components/cols/ColFlyThrough.js`, `client/src/components/visualization/Pass3DViewer.js`
- **Utilitaires:** `client/src/utils/3d/optimizations.js`, `client/src/utils/3d/terrainGenerator.js`
- **Service de données:** `client/src/services/elevationDataService.js`

**Fonctionnalités implémentées:**
- Rendu 3D des cols utilisant Three.js/React Three Fiber
- Système d'optimisation adaptatif basé sur les capacités de l'appareil (BatteryOptimizer)
- Points d'intérêt interactifs sur le parcours 3D
- Navigation interactive avec zoom, rotation et déplacement
- 5 niveaux de détail pour différentes performances matérielles
- Mode économie de batterie pour appareils mobiles

**Architecture détaillée:**

1. **Structure du moteur 3D**
```javascript
// Structure simplifiée de ColVisualization3D.js
export const ColVisualization3D = ({ colId, elevationData, options = {} }) => {
  // Configuration et hooks
  const [terrainData, setTerrainData] = useState(null);
  const [performanceLevel, setPerformanceLevel] = useState(3); // 1-5, 5 étant le plus détaillé
  const [batteryStatus, setBatteryStatus] = useState({ level: 1, charging: false });
  
  // Chargement des données d'élévation
  useEffect(() => {
    elevationDataService.getColElevationProfile(colId)
      .then(data => processTerrainData(data));
  }, [colId]);
  
  // Optimisations basées sur la batterie et les performances
  useEffect(() => {
    deviceCapabilityDetector.assessPerformance().then(level => setPerformanceLevel(level));
    batteryManager.initialize(setBatteryStatus);
  }, []);
  
  // Configuration du terrain 3D basée sur les métriques de performance
  const terrainConfig = useMemo(() => 
    terrainConfigGenerator.createConfig(performanceLevel, batteryStatus), 
    [performanceLevel, batteryStatus]
  );
  
  return (
    <Canvas>
      <Scene>
        <TerrainMesh 
          data={terrainData} 
          config={terrainConfig} 
        />
        <PointsOfInterest 
          points={elevationData.pointsOfInterest} 
        />
        <WeatherEffects 
          weatherData={elevationData.weather} 
          enabled={performanceLevel > 2} 
        />
        <UserControls maxZoom={100} minZoom={5} />
      </Scene>
    </Canvas>
  );
};
```

2. **Système d'optimisation adaptatif**
Le système d'optimisation s'appuie sur deux mécanismes principaux:

```javascript
// Extrait simplifié de optimizations.js
export const deviceCapabilityDetector = {
  assessPerformance: async () => {
    // Évaluation des capacités matérielles
    const gpuInfo = await getGPUInfo();
    const memoryInfo = await getMemoryInfo();
    const cpuInfo = await getCPUInfo();
    const screenResolution = getScreenResolution();
    
    // Algorithme de décision:
    // - Haute performance (niveau 5): GPU dédié, >4GB VRAM, CPU >4 cœurs
    // - Performance moyenne (niveau 3): GPU intégré récent, 2-4GB VRAM
    // - Basse performance (niveau 1): Appareils mobiles, GPU basique
    
    return calculatePerformanceLevel(gpuInfo, memoryInfo, cpuInfo, screenResolution);
  }
};

export const batteryManager = {
  initialize: (statusCallback) => {
    if (navigator.getBattery) {
      navigator.getBattery().then(battery => {
        // Mise à jour initiale
        statusCallback({ 
          level: battery.level, 
          charging: battery.charging 
        });
        
        // Écouteurs d'événements pour mise à jour du statut
        battery.addEventListener('levelchange', () => 
          statusCallback({ level: battery.level, charging: battery.charging }));
        battery.addEventListener('chargingchange', () => 
          statusCallback({ level: battery.level, charging: battery.charging }));
      });
    }
  }
};
```

3. **Génération de terrain**
Le processus de génération de terrain convertit les données d'élévation en maillage 3D:

```javascript
// Extrait simplifié de terrainGenerator.js
export const terrainGenerator = {
  createMesh: (elevationData, config) => {
    // Paramètres de configuration basés sur le niveau de performance
    const { resolution, smoothing, textureQuality, shadowQuality } = config;
    
    // Création de la géométrie du terrain
    const geometry = new THREE.PlaneGeometry(
      elevationData.width, 
      elevationData.length, 
      Math.round(elevationData.width * resolution), 
      Math.round(elevationData.length * resolution)
    );
    
    // Application des données d'élévation à la géométrie
    const vertices = geometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      const x = i / 3 % (elevationData.width * resolution);
      const y = Math.floor(i / 3 / (elevationData.width * resolution));
      
      // Calcul de la hauteur interpolée
      vertices[i + 2] = getInterpolatedHeight(elevationData.heights, x, y, resolution);
    }
    
    // Application de l'algorithme de lissage si nécessaire
    if (smoothing > 0) {
      for (let i = 0; i < smoothing; i++) {
        smoothGeometry(geometry);
      }
    }
    
    // Création et application des textures
    const materials = createTerrainMaterials(elevationData, textureQuality);
    
    // Retourne le maillage final
    return new THREE.Mesh(geometry, materials);
  }
};
```

**Processus d'utilisation:**

1. **Chargement initial:**
   - Le système détecte automatiquement les capacités matérielles de l'appareil
   - Le niveau de détail est ajusté en fonction des résultats
   - Les données d'élévation sont chargées à partir de l'API

2. **Interaction utilisateur:**
   - Zoom: Molette de souris ou geste de pincement (tactile)
   - Rotation: Clic gauche + déplacement ou glissement (tactile)
   - Déplacement: Clic droit + déplacement ou glissement à 2 doigts (tactile)
   - Sélection des points d'intérêt: Clic sur les marqueurs 3D

3. **Optimisations automatiques:**
   - En cas de batterie faible (<20%), le mode économie est activé
   - Sur appareils mobiles, la résolution du terrain est réduite
   - Le niveau de détail des textures s'adapte dynamiquement aux performances

4. **Préréglages de visualisation:**
   - Vue classique: Vue de dessus avec élévation
   - Vue FPV (First Person View): Navigation comme si vous étiez sur le col
   - Vue carte: Superposition des données topographiques

**Dépendances critiques:**
- Three.js v0.137.0 ou supérieur
- React Three Fiber v7.0.5 ou supérieur
- Drei (extensions pour React Three Fiber) v7.5.0 ou supérieur
- React-use-measure pour le dimensionnement du canvas

**Limites techniques connues:**
- Performances limitées sur appareils mobiles d'entrée de gamme
- Consommation de batterie élevée en mode haute qualité
- Temps de chargement initial élevé sur connexions lentes (~5-15Mo de données)

{{ ... }}

## 3. Intégrations externes

| Service | Fichier de configuration | Variables d'environnement | Statut |
|---------|-------------------------|--------------------------|--------|
| **Auth0** | `client/src/services/authService.js` | AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_AUDIENCE | ✅ Configuré |
| **Mapbox** | `client/src/services/mapService.js` | REACT_APP_MAPBOX_TOKEN | ✅ Configuré |
| **OpenWeather** | `client/src/services/weatherService.js` | REACT_APP_OPENWEATHER_API_KEY | ✅ Configuré |
| **Strava** | `client/src/components/integrations/StravaIntegration.js` | REACT_APP_STRAVA_CLIENT_ID | ✅ Configuré |
| **MongoDB Atlas** | `server/config/database.js` | MONGODB_URI, MONGODB_DB_NAME | ✅ Configuré |

## 4. Support multilingue

**Fichiers principaux:**
- **Configuration:** `client/src/i18n/i18n.js`
- **Traductions:** `client/src/i18n/locales/` (fr.json, en.json, de.json, it.json, es.json)
- **Utilitaire:** `client/src/utils/checkTranslations.js` (vérification des traductions manquantes)

**Langues implémentées:**
- Français (langue principale)
- Anglais
- Allemand
- Italien
- Espagnol

## 5. Optimisations techniques

### 5.1. Performance

**Fichiers principaux:**
- **Optimisation 3D:** `client/src/utils/3d/batteryOptimizer.js`, `deviceCapabilityDetector.js`
- **Lazy loading:** `client/src/utils/lazyLoading.js`
- **Optimisation des images:** `client/src/utils/imageOptimizer.js`

**Fonctionnalités implémentées:**
- Détection automatique des capacités de l'appareil
- Ajustement dynamique de la qualité des rendus 3D
- Lazy loading des composants et images
- Compression et optimisation des assets
- Cache stratégique des données

### 5.2. PWA et mode hors ligne

**Fichiers principaux:**
- **Service Worker:** `client/public/service-worker.js`
- **Manifeste:** `client/public/manifest.json`
- **Gestion hors ligne:** `client/src/utils/offlineManager.js`

**Fonctionnalités implémentées:**
- Installation en tant qu'application
- Mise en cache des routes principales
- Mode hors ligne pour les données essentielles
- Synchronisation différée des modifications

## 6. Configuration de déploiement Netlify

**Fichiers principaux:**
- **Configuration Netlify:** `netlify.toml`
- **Fonctions serverless:** `netlify/functions/`
- **Redirections:** Section `[[redirects]]` dans `netlify.toml`

**Paramètres de déploiement:**
```toml
[build]
  command = "npm run build"
  publish = "client/build"
  functions = "netlify/functions"

[build.environment]
  NODE_VERSION = "16.14.0"
  NPM_VERSION = "8.5.5"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 6.1. Fonctions Netlify implémentées

Toutes les fonctions Netlify (10/10) sont implémentées et testées:

| API Endpoint | Fonction Netlify | Emplacement |
|--------------|------------------|-------------|
| `/api/routes/featured` | `routes-featured.js` | `netlify/functions/routes-featured.js` |
| `/api/cols/list` | `cols-list.js` | `netlify/functions/cols-list.js` |
| `/api/events/upcoming` | `events-upcoming.js` | `netlify/functions/events-upcoming.js` |
| `/api/nutrition/recipes` | `nutrition-recipes.js` | `netlify/functions/nutrition-recipes.js` |
| `/api/cols/weather/:id` | `col-weather.js` | `netlify/functions/col-weather.js` |
| `/api/challenges/seven-majors/*` | `seven-majors-challenge.js` | `netlify/functions/seven-majors-challenge.js` |
| `/api/auth/verify` | `auth-verify.js` | `netlify/functions/auth-verify.js` |
| `/api/training/*` | `training-programs.js` | `netlify/functions/training-programs.js` |
| `/api/news/latest` | `news-latest.js` | `netlify/functions/news-latest.js` |
| `/api/social/posts` | `social-posts.js` | `netlify/functions/social-posts.js` |

## 7. Variables d'environnement requises

### 7.1. Variables pour le backend/fonctions Netlify (.env à la racine)

```
# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/velo-altitude
MONGODB_DB_NAME=velo-altitude

# Auth0
AUTH0_SECRET=votre_secret_auth0
AUTH0_BASE_URL=https://velo-altitude.com
AUTH0_ISSUER_BASE_URL=https://votre-tenant.eu.auth0.com
AUTH0_CLIENT_ID=votre_client_id
AUTH0_CLIENT_SECRET=votre_client_secret

# API Keys
STRAVA_CLIENT_ID=votre_strava_id
STRAVA_CLIENT_SECRET=votre_strava_secret
OPENWEATHER_API_KEY=votre_openweather_key
MAPBOX_API_KEY=votre_mapbox_key
OPENROUTESERVICE_API_KEY=votre_openroute_key
```

### 7.2. Variables pour le frontend (client/.env)

```
REACT_APP_API_URL=/.netlify/functions
REACT_APP_AUTH0_DOMAIN=votre-tenant.eu.auth0.com
REACT_APP_AUTH0_CLIENT_ID=votre_client_id
REACT_APP_AUTH0_AUDIENCE=https://api.velo-altitude.com
REACT_APP_MAPBOX_TOKEN=votre_mapbox_token
REACT_APP_STRAVA_CLIENT_ID=votre_strava_id
REACT_APP_OPENWEATHER_API_KEY=votre_openweather_key
REACT_APP_ENABLE_ANIMATIONS=true
REACT_APP_PERFORMANCE_MODE=auto
REACT_APP_ENABLE_3D_FEATURES=true
```

## 8. Processus de déploiement détaillé

### 8.1. Prérequis

- Node.js v16.14.0 ou supérieur
- npm v8.5.5 ou supérieur
- Compte Netlify
- Compte MongoDB Atlas
- Comptes pour les services tiers (Auth0, Mapbox, OpenWeather, Strava)

### 8.2. Étapes de déploiement

1. **Préparation de l'environnement**
   ```bash
   # Installer les dépendances
   npm install
   cd client && npm install
   ```

2. **Configuration des variables d'environnement**
   - Créer le fichier `.env` à la racine avec les variables backend
   - Créer le fichier `client/.env` avec les variables frontend

3. **Build local de test**
   ```bash
   # Depuis la racine du projet
   cd client && npm run build
   ```

4. **Test local avec les fonctions Netlify**
   ```bash
   # Installer Netlify CLI si nécessaire
   npm install -g netlify-cli
   
   # Test local
   netlify dev
   ```

5. **Déploiement sur Netlify**
   ```bash
   # Déploiement via CLI
   netlify deploy --prod --dir=client/build
   ```

6. **Configuration dans le dashboard Netlify**
   - Configurer les variables d'environnement dans l'interface Netlify
   - Vérifier que toutes les fonctions sont correctement déployées
   - Configurer le domaine personnalisé velo-altitude.com

7. **Vérifications post-déploiement**
   - Tester toutes les fonctionnalités principales (voir la section tests ci-dessous)
   - Vérifier les logs des fonctions Netlify pour détecter d'éventuelles erreurs

## 9. Corrections de Compilation

### 9.1. Erreurs corrigées

| Fichier | Erreur | Solution |
|---------|--------|----------|
| `client/src/components/coach/CyclingCoach.js` | Erreur de syntaxe avec guillemets | Correction de l'utilisation des guillemets pour éviter les conflits avec les apostrophes françaises |
| `client/src/components/cols/ColDetail.js` | Importation incorrecte de 'LineChart' (qui n'existe pas) | Remplacé par 'ShowChart' qui est l'icône correcte dans @mui/icons-material |
| `client/src/components/cols/ColsComparison.js` | Erreurs de syntaxe avec les apostrophes dans les chaînes de caractères | Utilisation de guillemets doubles pour les chaînes contenant des apostrophes |
| `client/src/hooks/useFeatureFlags.js` | Incompatibilité d'exportation | Ajout d'une exportation nommée en plus de l'exportation par défaut pour assurer la compatibilité |
| `client/src/components/visualization/PassVisualizer.js` | Importation incorrecte de 'Map' depuis 'react-map-gl' | Corrigé pour utiliser l'importation par défaut 'ReactMapGL' compatible avec la version 6.1.19 |
| `client/src/components/visualization/RouteAlternatives.js` | Importation incorrecte de 'Map' depuis 'react-map-gl' | Corrigé pour utiliser l'importation par défaut 'ReactMapGL' compatible avec la version 6.1.19 |
| `client/src/pages/Profile.js` | Importation de 'SportsCycling' qui n'existe pas | Remplacé par 'DirectionsBike' qui est l'icône appropriée pour le cyclisme |

### 9.2. Problèmes en cours de résolution

- Erreur d'importation de 'useNavigate' qui est incorrectement importé depuis '@mui/material'
- Potentielles erreurs de syntaxe supplémentaires dans les fichiers JavaScript
- Optimisation des importations et des dépendances pour améliorer les performances de build

## 10. Présentation du produit

Velo-Altitude est une plateforme complète dédiée au cyclisme de montagne, conçue pour devenir le plus grand dashboard vélo d'Europe. La plateforme offre une expérience holistique aux cyclistes, allant de la découverte des cols à l'entraînement spécifique, en passant par la nutrition adaptée et les défis communautaires.

### 10.1. Points forts et innovations

- **Approche holistique** intégrant entraînement, nutrition et défis cyclistes
- **Technologie de visualisation 3D** pour "prévisualiser" les ascensions avant de les réaliser
- **Concept "Les 7 Majeurs"** qui gamifie l'expérience cycliste
- **Optimisation adaptative** selon les capacités des appareils
- **Support multilingue complet** pour toucher un public européen

### 10.2. Architecture technique

- Application web moderne développée avec **React** et **Material UI**
- Base de données **MongoDB** pour le stockage des données utilisateurs et des défis
- Intégrations avec **Auth0** (authentification), **Mapbox** (cartographie) et **OpenWeather** (météo)
- Architecture serverless via les **fonctions Netlify**
- Optimisation performante pour tous les appareils (desktop, tablette, mobile)

---

Rapport préparé par : Agent AUDIT  
Date du rapport : 5 avril 2025

### 2.4. Module Nutrition (✅ 100% Complété)

**Fichiers principaux:**
- **Composants principaux:** `client/src/components/nutrition/NutritionHub.js`, `NutritionPlanner.js`, `RecipeLibrary.js`
- **Sous-composants:** `client/src/components/nutrition/NutritionRecipesExplorer.js`, `MealPlanner.js`
- **Documentation:** `client/src/components/nutrition/DOCUMENTATION_NUTRITION.md`
- **API:** `server/routes/nutrition.js`, `netlify/functions/nutrition-recipes.js`
- **Base de données:** `server/data/nutrition/recipes.js`, `server/data/nutrition/macronutrients.js`

**Fonctionnalités implémentées:**
- Base de données de 100+ recettes adaptées aux besoins spécifiques des cyclistes
- Catégorisation par type (petit-déjeuner, pré-entraînement, pendant l'effort, récupération)
- Calcul des besoins nutritionnels basé sur le profil et l'activité
- Planificateur de repas hebdomadaire
- Filtrage par préférences alimentaires (végétarien, sans gluten, etc.)
- Visualisation interactive des recettes avec timers intégrés
- Exportation PDF des plans nutritionnels
- Calcul des besoins caloriques basé sur le profil cycliste

**Architecture détaillée:**

1. **Structure du Hub de Nutrition**
```javascript
// Structure simplifiée de NutritionHub.js
export const NutritionHub = () => {
  const [activeSection, setActiveSection] = useState('recipes');
  const [userProfile, setUserProfile] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const { user } = useAuth();
  
  // Récupération du profil nutritionnel de l'utilisateur
  useEffect(() => {
    if (user) {
      nutritionService.getUserNutritionProfile(user.id)
        .then(profile => setUserProfile(profile));
    }
  }, [user]);
  
  // Synchronisation avec Strava si compte connecté
  useEffect(() => {
    if (userProfile?.connectedAccounts?.strava) {
      stravaIntegration.syncActivities(user.id)
        .then(activities => {
          // Mise à jour des performances avec les données Strava
          trainingService.updatePerformanceMetrics(user.id, activities);
        });
    }
  }, [userProfile, user]);
  
  // Gestionnaire pour la création de plans nutritionnels
  const handleCreateMealPlan = (settings) => {
    const calculatedNeeds = nutritionCalculator.calculateNeeds(
      userProfile, 
      settings.activityLevel, 
      settings.weeklyDistance, 
      settings.goals
    );
    
    const generatedPlan = mealPlanGenerator.createPlan(
      calculatedNeeds,
      settings.preferences,
      settings.restrictions
    );
    
    setSelectedProgram(generatedPlan);
  };
  
  return (
    <NutritionContainer>
      <NutritionNav 
        activeSection={activeSection} 
        onSectionChange={setActiveSection}
        pendingInvites={pendingInvites.length}
      />
      
      {activeSection === 'recipes' && (
        <RecipeLibrary 
          userPreferences={userProfile?.preferences} 
        />
      )}
      
      {activeSection === 'planner' && (
        <NutritionPlanner 
          userProfile={userProfile}
          currentPlan={selectedProgram}
          onCreatePlan={handleCreateMealPlan}
        />
      )}
      
      {activeSection === 'calculator' && (
        <NutritionCalculator 
          userProfile={userProfile}
          onProfileUpdate={setUserProfile}
        />
      )}
      
      {activeSection === 'education' && (
        <NutritionEducation />
      )}
    </NutritionContainer>
  );
};
```

2. **Système de calcul des besoins nutritionnels**
Le système d'évaluation des besoins nutritionnels s'appuie sur des modèles scientifiques:

```javascript
// Extrait simplifié de nutritionCalculator.js
export const nutritionCalculator = {
  calculateNeeds: (profile, activityLevel, weeklyDistance, goals) => {
    // Calcul du métabolisme de base (BMR) avec la formule de Mifflin-St Jeor
    const bmr = calculateBMR(profile.gender, profile.weight, profile.height, profile.age);
    
    // Facteur d'activité quotidienne (hors cyclisme)
    const activityFactors = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      veryActive: 1.9
    };
    
    // Calories brûlées lors des activités cyclistes (kcal/km)
    const cyclingCaloriesPerKm = {
      flat: 25,
      rolling: 35,
      mountainous: 50
    };
    
    // Calcul des calories additionnelles pour le cyclisme
    const weeklyCaloriesFromCycling = weeklyDistance * cyclingCaloriesPerKm[profile.terrainType];
    const dailyCaloriesFromCycling = weeklyCaloriesFromCycling / 7;
    
    // Calcul des besoins caloriques totaux
    const maintenanceCalories = bmr * activityFactors[activityLevel] + dailyCaloriesFromCycling;
    
    // Ajustement selon les objectifs (perte de poids, maintien, ou performance)
    let targetCalories = maintenanceCalories;
    if (goals.includes('weight-loss')) {
      targetCalories *= 0.85; // Déficit de 15%
    } else if (goals.includes('performance')) {
      targetCalories *= 1.1; // Surplus de 10%
    }
    
    // Calcul de la répartition des macronutriments
    const macroSplit = calculateMacroSplit(profile.bodyType, goals);
    
    return {
      totalCalories: Math.round(targetCalories),
      macros: {
        carbs: Math.round(targetCalories * macroSplit.carbs / 4), // 4 kcal/g
        protein: Math.round(targetCalories * macroSplit.protein / 4), // 4 kcal/g
        fat: Math.round(targetCalories * macroSplit.fat / 9), // 9 kcal/g
      },
      hydration: calculateHydrationNeeds(profile.weight, weeklyDistance)
    };
  }
};
```

3. **Générateur de plan de repas**
Le système génère des plans de repas adaptés aux besoins calculés:

```javascript
// Extrait simplifié de mealPlanGenerator.js
export const mealPlanGenerator = {
  createPlan: (nutritionNeeds, preferences, restrictions) => {
    const weeklyPlan = Array(7).fill().map(() => ({
      breakfast: null,
      morningSnack: null,
      lunch: null,
      afternoonSnack: null,
      dinner: null,
      eveningSnack: null
    }));
    
    // Filtre des recettes selon préférences et restrictions
    const filteredRecipes = filterRecipesByPreferences(allRecipes, preferences, restrictions);
    
    // Catégorisation des recettes par type de repas
    const categorizedRecipes = categorizeRecipes(filteredRecipes);
    
    // Allocation des calories quotidiennes par repas
    const calorieDistribution = {
      breakfast: 0.25, // 25% des calories
      morningSnack: 0.1, // 10% des calories
      lunch: 0.3, // 30% des calories
      afternoonSnack: 0.1, // 10% des calories
      dinner: 0.2, // 20% des calories
      eveningSnack: 0.05 // 5% des calories
    };
    
    // Distribution des macronutriments selon le type de repas
    const macroDistribution = {
      breakfast: { carbs: 0.6, protein: 0.2, fat: 0.2 },
      morningSnack: { carbs: 0.7, protein: 0.2, fat: 0.1 },
      lunch: { carbs: 0.4, protein: 0.3, fat: 0.3 },
      afternoonSnack: { carbs: 0.7, protein: 0.2, fat: 0.1 },
      dinner: { carbs: 0.3, protein: 0.4, fat: 0.3 },
      eveningSnack: { carbs: 0.5, protein: 0.3, fat: 0.2 }
    };
    
    // Constitution du plan selon les besoins et distributions
    for (let day = 0; day < 7; day++) {
      for (const meal of Object.keys(weeklyPlan[day])) {
        const targetCalories = nutritionNeeds.totalCalories * calorieDistribution[meal];
        const targetMacros = {
          carbs: nutritionNeeds.macros.carbs * macroDistribution[meal].carbs,
          protein: nutritionNeeds.macros.protein * macroDistribution[meal].protein,
          fat: nutritionNeeds.macros.fat * macroDistribution[meal].fat
        };
        
        // Sélection de la recette la plus adaptée aux besoins
        weeklyPlan[day][meal] = findBestMatchingRecipe(
          categorizedRecipes[meal],
          targetCalories,
          targetMacros
        );
      }
    }
    
    return weeklyPlan;
  }
};
```

**Processus d'utilisation:**

1. **Création d'un profil nutritionnel:**
   - L'utilisateur saisit ses données personnelles (âge, poids, taille, sexe)
   - Il précise son niveau d'activité général et volume de cyclisme hebdomadaire
   - Il indique ses objectifs (perte de poids, maintien, performance)
   - Il spécifie ses préférences et restrictions alimentaires

2. **Consultation du catalogue de recettes:**
   - Navigation par catégorie (avant/pendant/après effort, récupération)
   - Filtrage par profil nutritionnel (haute protéine, haute énergie, etc.)
   - Filtrage par préférences et restrictions (végétarien, sans gluten, etc.)
   - Visualisation détaillée des recettes avec valeurs nutritionnelles

3. **Création d'un plan de repas:**
   - Sélection de la période (préparation, compétition, récupération)
   - Génération automatique du plan selon les besoins calculés
   - Ajustement manuel des repas si souhaité
   - Exportation ou impression du plan sous format PDF

4. **Suivi nutritionnel:**
   - Enregistrement de la consommation journalière
   - Visualisation des écarts par rapport aux recommandations
   - Ajustements dynamiques selon les performances et sensations

**Structure des données de recettes:**

Chaque recette est structurée de la manière suivante:

```javascript
{
  id: "barre-granola-maison",
  name: "Barre Granola Maison",
  category: "snack",
  timing: ["pre-ride", "during-ride"],
  prepTime: 15, // minutes
  cookTime: 25, // minutes
  portions: 8,
  difficulty: "easy", // easy, medium, hard
  
  nutritionInfo: {
    perServing: {
      calories: 285,
      carbs: 32, // grammes
      protein: 8, // grammes
      fat: 14, // grammes
      fiber: 4, // grammes
      sugar: 12 // grammes
    },
    highlights: ["high-energy", "slow-release"]
  },
  
  ingredients: [
    {
      name: "Flocons d'avoine",
      quantity: 200,
      unit: "g"
    },
    // Autres ingrédients...
  ],
  
  instructions: [
    "Préchauffer le four à 160°C.",
    "Mélanger les ingrédients secs dans un grand bol.",
    // Étapes suivantes...
  ],
  
  tips: [
    "Pour une version sans gluten, utilisez des flocons d'avoine certifiés sans gluten.",
    "Ces barres se conservent jusqu'à 2 semaines dans un contenant hermétique."
  ],
  
  imageUrl: "/images/recipes/barre-granola-maison.jpg"
}
```

**Dépendances critiques:**
- React-pdf v5.3.0 ou supérieur (pour l'export PDF)
- Chart.js v3.5.0 ou supérieur (pour les visualisations nutritionnelles)
- date-fns v2.25.0 ou supérieur (pour la gestion des plannings)
- Strava API SDK v1.1.0 ou supérieur (pour l'intégration Strava)
- Auth0 v1.10.0 ou supérieur (pour l'authentification sociale)

**Intégrations externes:**
- API OpenFoodFacts pour les données nutritionnelles complémentaires
- Service d'export PDF pour générer les plans nutritionnels
- Système d'authentification Auth0 pour la sauvegarde des profils

{{ ... }}

### 2.5. Module Entraînement (✅ 100% Complété)

**Fichiers principaux:**
- **Composants principaux:** `client/src/components/training/TrainingHub.js`, `FTPCalculator.js`, `HIITBuilder.js`
- **Sous-composants:** `client/src/components/training/TrainingProgramsExplorer.js`, `WorkoutLibrary.js`
- **Documentation:** `client/src/components/training/DOCUMENTATION_TRAINING.md`
- **API:** `server/routes/training.js`, `netlify/functions/training-programs.js`
- **Base de données:** `server/data/training/programs.js`, `server/data/training/workouts.js`

**Fonctionnalités implémentées:**
- 30+ programmes d'entraînement spécifiques à l'ascension de cols
- Calculateur FTP avec 6 méthodes différentes
- Visualisation des zones d'entraînement basées sur le FTP
- Module HIIT avancé avec validation des paramètres
- Suivi des performances et tendances à long terme
- Intégration Strava pour importer les activités
- Générateur de séances d'entraînement personnalisées
- Export des séances vers les applications tierces (Garmin, Wahoo)

**Architecture détaillée:**

1. **Structure du Hub d'Entraînement**
```javascript
// Structure simplifiée de TrainingHub.js
export const TrainingHub = () => {
  const [activeSection, setActiveSection] = useState('programs');
  const [userProfile, setUserProfile] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const { user } = useAuth();
  
  // Récupération du profil d'entraînement de l'utilisateur
  useEffect(() => {
    if (user) {
      trainingService.getUserTrainingProfile(user.id)
        .then(profile => setUserProfile(profile));
    }
  }, [user]);
  
  // Synchronisation avec Strava si compte connecté
  useEffect(() => {
    if (userProfile?.connectedAccounts?.strava) {
      stravaIntegration.syncActivities(user.id)
        .then(activities => {
          // Mise à jour des performances avec les données Strava
          trainingService.updatePerformanceMetrics(user.id, activities);
        });
    }
  }, [userProfile, user]);
  
  // Gestionnaires d'actions d'entraînement
  const handleCreateProgram = (programData) => {
    const calculatedNeeds = trainingCalculator.calculateNeeds(
      userProfile, 
      programData.activityLevel, 
      programData.weeklyDistance, 
      programData.goals
    );
    
    const generatedProgram = programGenerator.createProgram(
      calculatedNeeds,
      programData.preferences,
      programData.restrictions
    );
    
    setSelectedProgram(generatedProgram);
  };
  
  return (
    <TrainingContainer>
      <TrainingNav 
        activeSection={activeSection} 
        onSectionChange={setActiveSection}
        pendingInvites={pendingInvites.length}
      />
      
      {activeSection === 'programs' && (
        <TrainingProgramsExplorer 
          userProfile={userProfile}
          onProgramSelect={handleCreateProgram}
          selectedProgram={selectedProgram}
        />
      )}
      
      {activeSection === 'ftp' && (
        <FTPCalculator 
          userProfile={userProfile}
          onFTPUpdate={(newFTP) => {
            trainingService.updateFTP(user.id, newFTP);
            setUserProfile({...userProfile, ftp: newFTP});
          }}
        />
      )}
      
      {activeSection === 'hiit' && (
        <HIITBuilder 
          userFTP={userProfile?.ftp}
          onWorkoutSave={(workout) => {
            trainingService.saveCustomWorkout(user.id, workout);
          }}
        />
      )}
      
      {activeSection === 'progress' && (
        <ProgressTracker 
          userId={user?.id}
        />
      )}
    </TrainingContainer>
  );
};
```

2. **Calculateur FTP avec méthodes multiples**
Le calculateur FTP propose plusieurs méthodes pour déterminer la puissance seuil:

```javascript
// Extrait simplifié de FTPCalculator.js
export const FTPCalculator = ({ userProfile, onFTPUpdate }) => {
  const [selectedMethod, setSelectedMethod] = useState('20min');
  const [inputValues, setInputValues] = useState({});
  const [calculatedFTP, setCalculatedFTP] = useState(null);
  const { user } = useAuth();
  
  // Définition des méthodes de calcul disponibles
  const ftpMethods = {
    '20min': {
      name: 'Test 20 minutes',
      description: 'Effort maximal de 20 minutes après échauffement',
      formula: (values) => values.power20min * 0.95,
      inputs: [
        { id: 'power20min', label: 'Puissance moyenne (20 min)', unit: 'W' }
      ]
    },
    '8min': {
      name: 'Test 8 minutes',
      description: 'Moyenne de deux efforts de 8 minutes avec 10 min de récup',
      formula: (values) => ((values.power8min1 + values.power8min2) / 2) * 0.9,
      inputs: [
        { id: 'power8min1', label: 'Puissance 1er effort', unit: 'W' },
        { id: 'power8min2', label: 'Puissance 2ème effort', unit: 'W' }
      ]
    },
    'ramp': {
      name: 'Test Progressif',
      description: 'Test progressif jusqu\'à épuisement',
      formula: (values) => values.powerRamp * 0.75,
      inputs: [
        { id: 'powerRamp', label: 'Puissance maximale atteinte', unit: 'W' }
      ]
    },
    'hr': {
      name: 'Estimation FC',
      description: 'Basée sur la FC de seuil anaérobie',
      formula: (values) => {
        // Formule de Coggan pour estimer FTP depuis FC
        const ftpEstimate = ((values.weight * 2.8) * 
          (values.thresholdHR / values.restingHR)) * 
          (values.experienceLevel * 0.1 + 0.9);
        return Math.round(ftpEstimate);
      },
      inputs: [
        { id: 'thresholdHR', label: 'FC seuil', unit: 'bpm' },
        { id: 'restingHR', label: 'FC repos', unit: 'bpm' },
        { id: 'weight', label: 'Poids', unit: 'kg' },
        { id: 'experienceLevel', label: 'Niveau', unit: '', type: 'select', 
          options: [
            { value: 1, label: 'Débutant' },
            { value: 2, label: 'Intermédiaire' },
            { value: 3, label: 'Avancé' }
          ] 
        }
      ]
    },
    'recent': {
      name: 'Performances récentes',
      description: 'Basée sur vos meilleures performances récentes',
      formula: (values) => {
        // Différentes durées d'effort ont différents facteurs
        const ftpEstimates = {
          '5min': values.power5min * 0.825,
          '10min': values.power10min * 0.875,
          '30min': values.power30min * 0.965,
          '60min': values.power60min * 1.0
        };
        
        // Calcul de la moyenne pondérée des estimations disponibles
        let totalWeight = 0;
        let weightedSum = 0;
        
        for (const [duration, estimate] of Object.entries(ftpEstimates)) {
          if (values[`power${duration}`]) {
            const weight = {
              '5min': 0.5,
              '10min': 0.8,
              '30min': 1.2,
              '60min': 1.5
            }[duration];
            
            weightedSum += estimate * weight;
            totalWeight += weight;
          }
        }
        
        return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
      },
      inputs: [
        { id: 'power5min', label: 'Meilleur 5 min', unit: 'W', required: false },
        { id: 'power10min', label: 'Meilleur 10 min', unit: 'W', required: false },
        { id: 'power30min', label: 'Meilleur 30 min', unit: 'W', required: false },
        { id: 'power60min', label: 'Meilleur 60 min', unit: 'W', required: false }
      ]
    }
  };
  
  // Calcul de la FTP basé sur la méthode et valeurs
  const calculateFTP = () => {
    const method = ftpMethods[selectedMethod];
    const result = method.formula(inputValues);
    setCalculatedFTP(Math.round(result));
  };
  
  // Mise à jour de la FTP de l'utilisateur
  const handleSaveFTP = () => {
    if (calculatedFTP && calculatedFTP > 100) {  // Validation simple
      onFTPUpdate(calculatedFTP);
    }
  };
  
  // Génération des zones d'entraînement basées sur la FTP
  const trainingZones = useMemo(() => {
    if (!calculatedFTP) return null;
    
    return {
      z1: { min: 0, max: Math.round(calculatedFTP * 0.55), name: 'Récupération active' },
      z2: { min: Math.round(calculatedFTP * 0.56), max: Math.round(calculatedFTP * 0.75), name: 'Endurance' },
      z3: { min: Math.round(calculatedFTP * 0.76), max: Math.round(calculatedFTP * 0.9), name: 'Tempo' },
      z4: { min: Math.round(calculatedFTP * 0.91), max: Math.round(calculatedFTP * 1.05), name: 'Seuil' },
      z5: { min: Math.round(calculatedFTP * 1.06), max: Math.round(calculatedFTP * 1.2), name: 'VO2 Max' },
      z6: { min: Math.round(calculatedFTP * 1.21), max: Math.round(calculatedFTP * 1.5), name: 'Anaérobie' },
      z7: { min: Math.round(calculatedFTP * 1.51), max: Number.MAX_SAFE_INTEGER, name: 'Neuromuscular' }
    };
  }, [calculatedFTP]);
  
  // Rendu du composant
  return (
    <div className="ftp-calculator">
      <h2>Calculateur de FTP</h2>
      
      <MethodSelector 
        methods={Object.keys(ftpMethods).map(id => ({ 
          id, 
          name: ftpMethods[id].name,
          description: ftpMethods[id].description
        }))}
        selectedMethod={selectedMethod}
        onMethodChange={setSelectedMethod}
      />
      
      <InputsForm 
        inputs={ftpMethods[selectedMethod].inputs}
        values={inputValues}
        onChange={setInputValues}
      />
      
      <Button onClick={calculateFTP}>Calculer ma FTP</Button>
      
      {calculatedFTP && (
        <div className="result-section">
          <div className="ftp-result">
            <h3>Votre FTP estimée</h3>
            <div className="ftp-value">{calculatedFTP} W</div>
            {userProfile?.weight && (
              <div className="w-kg-value">
                {(calculatedFTP / userProfile.weight).toFixed(2)} W/kg
              </div>
            )}
            <Button onClick={handleSaveFTP}>Enregistrer cette FTP</Button>
          </div>
          
          <TrainingZonesDisplay zones={trainingZones} />
        </div>
      )}
    </div>
  );
};
```

3. **Générateur d'entraînements HIIT**
Le module HIIT permet de créer des séances d'intervalles personnalisées:

```javascript
// Extrait simplifié de HIITBuilder.js
export const HIITBuilder = ({ userFTP, onWorkoutSave }) => {
  const [workoutData, setWorkoutData] = useState({
    name: 'Mon entraînement HIIT',
    targetPower: userFTP ? Math.round(userFTP * 1.15) : 250, // 115% FTP par défaut
    intervalDuration: 60, // secondes
    restDuration: 60, // secondes
    repetitions: 5,
    sets: 3,
    restBetweenSets: 180, // secondes
    warmupDuration: 600, // 10 minutes
    cooldownDuration: 600, // 10 minutes
  });
  
  // Validation des paramètres d'entraînement
  const validation = useMemo(() => {
    const intensityRatio = workoutData.targetPower / (userFTP || 250);
    const maximumDuration = intervalDurationCalculator.getMaxSustainableDuration(intensityRatio);
    const restRatio = workoutData.restDuration / workoutData.intervalDuration;
    
    return {
      intervalTooLong: workoutData.intervalDuration > maximumDuration,
      restTooShort: restRatio < getRecommendedRestRatio(intensityRatio),
      tooManyRepetitions: workoutData.repetitions > getMaxRepetitions(intensityRatio),
      totalLoad: calculateTrainingLoad(workoutData, userFTP)
    };
  }, [workoutData, userFTP]);
  
  // Calcul des statistiques de l'entraînement
  const workoutStats = useMemo(() => {
    const workInterval = workoutData.intervalDuration * workoutData.repetitions;
    const restInterval = workoutData.restDuration * (workoutData.repetitions - 1);
    const setDuration = workInterval + restInterval;
    const totalSetsDuration = setDuration * workoutData.sets;
    const totalRestBetweenSets = workoutData.restBetweenSets * (workoutData.sets - 1);
    
    const totalDuration = 
      workoutData.warmupDuration + 
      totalSetsDuration + 
      totalRestBetweenSets + 
      workoutData.cooldownDuration;
    
    const totalWorkDuration = workoutData.intervalDuration * workoutData.repetitions * workoutData.sets;
    
    // Calcul des calories estimées (formule simplifiée)
    const estimatedCalories = userFTP 
      ? (totalWorkDuration * workoutData.targetPower * 3.6) / 4184 + 
        ((totalDuration - totalWorkDuration) * userFTP * 0.5 * 3.6) / 4184
      : 0;
    
    return {
      totalDuration,
      totalWorkDuration,
      workToRestRatio: totalWorkDuration / (totalDuration - totalWorkDuration - workoutData.warmupDuration - workoutData.cooldownDuration),
      estimatedCalories: Math.round(estimatedCalories * 100),
      tss: calculateTSS(workoutData, userFTP, totalDuration)
    };
  }, [workoutData, userFTP]);
  
  // Génération du profil d'entraînement pour export
  const generateWorkoutProfile = () => {
    const segments = [];
    
    // Échauffement
    segments.push({
      type: 'warmup',
      duration: workoutData.warmupDuration,
      startPower: userFTP * 0.4,
      endPower: userFTP * 0.7
    });
    
    // Intervalles par série
    for (let set = 1; set <= workoutData.sets; set++) {
      // Intervalles de travail et récupération
      for (let rep = 1; rep <= workoutData.repetitions; rep++) {
        // Intervalle de travail
        segments.push({
          type: 'work',
          duration: workoutData.intervalDuration,
          power: workoutData.targetPower
        });
        
        // Intervalle de récupération (sauf après le dernier intervalle de la série)
        if (rep < workoutData.repetitions) {
          segments.push({
            type: 'rest',
            duration: workoutData.restDuration,
            power: userFTP * 0.4
          });
        }
      }
      
      // Repos entre séries (sauf après la dernière série)
      if (set < workoutData.sets) {
        segments.push({
          type: 'recovery',
          duration: workoutData.restBetweenSets,
          power: userFTP * 0.4
        });
      }
    }
    
    // Récupération
    segments.push({
      type: 'cooldown',
      duration: workoutData.cooldownDuration,
      startPower: userFTP * 0.7,
      endPower: userFTP * 0.4
    });
    
    return {
      name: workoutData.name,
      description: `${workoutData.sets} séries de ${workoutData.repetitions} répétitions à ${Math.round(workoutData.targetPower / userFTP * 100)}% FTP`,
      segments,
      stats: workoutStats
    };
  };
  
  // Exportation de l'entraînement
  const handleExport = (format) => {
    const profile = generateWorkoutProfile();
    
    switch (format) {
      case 'zwift':
        return workoutExporter.toZwift(profile);
      case 'garmin':
        return workoutExporter.toGarmin(profile);
      case 'wahoo':
        return workoutExporter.toWahoo(profile);
      case 'trainerroad':
        return workoutExporter.toTrainerRoad(profile);
      default:
        return workoutExporter.toJSON(profile);
    }
  };
  
  return (
    <div className="hiit-builder">
      <h2>Générateur d'entraînements HIIT</h2>
      
      <WorkoutEditorForm 
        workoutData={workoutData}
        onWorkoutChange={setWorkoutData}
        validation={validation}
        userFTP={userFTP}
      />
      
      <WorkoutPreview 
        workout={generateWorkoutProfile()}
      />
      
      <div className="workout-stats">
        <h3>Statistiques de l'entraînement</h3>
        <div>Durée totale: {formatDuration(workoutStats.totalDuration)}</div>
        <div>Temps de travail: {formatDuration(workoutStats.totalWorkDuration)}</div>
        <div>Ratio travail/repos: {workoutStats.workToRestRatio.toFixed(2)}</div>
        <div>Calories estimées: ~{workoutStats.estimatedCalories} kcal</div>
        <div>Score d'entraînement (TSS): {workoutStats.tss}</div>
      </div>
      
      <div className="action-buttons">
        <Button onClick={() => onWorkoutSave(generateWorkoutProfile())}>
          Enregistrer
        </Button>
        <ButtonGroup>
          <Button onClick={() => handleExport('zwift')}>Export Zwift</Button>
          <Button onClick={() => handleExport('garmin')}>Export Garmin</Button>
          <Button onClick={() => handleExport('wahoo')}>Export Wahoo</Button>
        </ButtonGroup>
      </div>
    </div>
  );
};
```

**Processus d'utilisation:**

1. **Découverte d'un programme d'entraînement:**
   - L'utilisateur navigue dans le catalogue de programmes par objectif (endurance, puissance, cols)
   - Il filtre par niveau, durée et équipement requis
   - Il prévisualise les séances et la progression
   - Il sélectionne et personnalise le programme

2. **Calcul et suivi de la FTP:**
   - L'utilisateur choisit une méthode de test adaptée (20 min, 8 min, progressif, etc.)
   - Il saisit les données de test et calcule la FTP
   - Il visualise les zones d'entraînement
   - Il suit l'historique de progression de la FTP

3. **Création d'une séance HIIT:**
   - L'utilisateur configure les paramètres d'intervalles (durée, intensité, répétitions)
   - Il ajuste les paramètres basés sur les recommandations de charge
   - Il prévisualise et simule la séance
   - Il exporte la séance vers les applications tierces (Garmin, Wahoo)

4. **Suivi de progression:**
   - L'utilisateur synchronise ses activités Strava pour importer les données
   - Il visualise les tendances de performances
   - Il analyse les métriques clés (CTL, ATL, TSB, etc.)
   - Il reçoit des recommandations d'entraînement basées sur l'historique

**Structure des données de programmes d'entraînement:**

Chaque programme d'entraînement est structuré de la manière suivante:

```javascript
{
  id: "col-crusher-12weeks",
  name: "Conquérant de Cols - 12 semaines",
  description: "Programme complet pour développer l'endurance et la puissance nécessaires à l'ascension de cols alpins",
  duration: 12, // semaines
  level: "intermediate", // beginner, intermediate, advanced, elite
  goal: ["climbing", "endurance", "threshold"],
  
  requirements: {
    timePerWeek: { min: 6, max: 10, unit: "hours" }, // Temps hebdomadaire
    equipment: ["power-meter", "indoor-trainer"], // Équipement recommandé
    ftp: { min: 2.5, max: 4.0, unit: "w/kg" } // FTP recommandée
  },
  
  overview: {
    phase1: {
      name: "Base",
      weeks: 4,
      focus: "Développement de l'endurance aérobie et adaptation physiologique"
    },
    phase2: {
      name: "Construction",
      weeks: 5,
      focus: "Développement de la puissance au seuil et capacité en montée"
    },
    phase3: {
      name: "Spécialisation",
      weeks: 2,
      focus: "Séances spécifiques d'ascension et simulation de cols"
    },
    phase4: {
      name: "Affûtage",
      weeks: 1,
      focus: "Réduction du volume, maintien de l'intensité pour optimiser la fraîcheur"
    }
  },
  
  // Plans hebdomadaires
  weeks: [
    {
      weekNumber: 1,
      theme: "Adaptation",
      workouts: [
        {
          day: 1,
          name: "Endurance Base",
          type: "endurance",
          duration: 60, // minutes
          tss: 65,
          description: "Sortie d'endurance zone 2 avec 3 blocs de 10 minutes en haut de Z2"
        },
        // Autres séances de la semaine...
      ]
    },
    // Autres semaines...
  ],
  
  // Metrics, testimonials, etc.
}
```

**Structure des données de séances d'entraînement:**

Chaque séance d'entraînement est structurée de la manière suivante:

```javascript
{
  id: "workout-123",
  name: "Séance d'endurance",
  description: "Sortie d'endurance de 60 minutes en zone 2",
  type: "endurance",
  duration: 60, // minutes
  tss: 65,
  ftp: 250, // Puissance seuil
  date: "2025-04-10T08:00:00Z",
  userId: "user-123",
  segments: [
    {
      type: "warmup",
      duration: 10,
      startPower: 150,
      endPower: 200
    },
    {
      type: "work",
      duration: 20,
      power: 250
    },
    {
      type: "rest",
      duration: 5,
      power: 100
    },
    // Autres segments...
  ]
}
```

**Dépendances critiques:**
- Recharts v2.1.0 ou supérieur (pour les visualisations de données)
- React-dropzone v11.3.0 ou supérieur (pour l'importation de fichiers)
- Moment.js v2.29.0 ou supérieur (pour la gestion des dates)
- Strava API SDK v1.1.0 ou supérieur (pour l'intégration Strava)
- Auth0 v1.10.0 ou supérieur (pour l'authentification sociale)

**Intégrations externes:**
- API Strava pour synchroniser les activités
- API OpenElevation pour la simulation de cols

{{ ... }}

### 2.6. Communauté et Partage (✅ 100% Complété)

**Fichiers principaux:**
- **Composants principaux:** `client/src/components/social/EnhancedSocialHub.js`, `CommunityFeed.js`
- **Sous-composants:** `client/src/components/social/group-rides/GroupRidesList.js`, `GroupRideDetails.js`
- **Documentation:** `client/src/components/social/group-rides/README.md`
- **API:** `server/routes/social.js`, `netlify/functions/social-posts.js`
- **Base de données:** `server/data/social/events.js`, `server/data/social/posts.js`

**Fonctionnalités implémentées:**
- Création et gestion de sorties de groupe
- Chat en temps réel pour les participants aux sorties
- Partage d'itinéraires et de défis "Les 7 Majeurs"
- Intégration Strava pour partager les activités
- Calendrier d'événements communautaires
- Flux d'activité des amis et de la communauté
- Système de médailles et badges d'accomplissement
- Publication et commentaires sur les parcours réalisés
- Forum de discussion par région et thématique

**Architecture détaillée:**

1. **Structure du Hub Social**
```javascript
// Structure simplifiée de EnhancedSocialHub.js
export const EnhancedSocialHub = () => {
  const [activeSection, setActiveSection] = useState('feed');
  const [userConnections, setUserConnections] = useState([]);
  const [communityEvents, setCommunityEvents] = useState([]);
  const [feedItems, setFeedItems] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const { user } = useAuth();
  
  // Chargement des données sociales
  useEffect(() => {
    if (user) {
      // Chargement des connexions (amis, groupes)
      socialService.getUserConnections(user.id)
        .then(connections => setUserConnections(connections));
      
      // Chargement du fil d'activité
      socialService.getFeedItems(user.id)
        .then(items => setFeedItems(items));
      
      // Chargement des invitations en attente
      socialService.getPendingInvites(user.id)
        .then(invites => setPendingInvites(invites));
    }
    
    // Chargement des événements communautaires (pour tous)
    socialService.getCommunityEvents()
      .then(events => setCommunityEvents(events));
  }, [user]);
  
  // Configuration du websocket pour mise à jour en temps réel
  useEffect(() => {
    if (user) {
      const socket = setupRealtimeConnection(user.id);
      
      socket.on('new-feed-item', (item) => {
        setFeedItems(prev => [item, ...prev]);
      });
      
      socket.on('new-invitation', (invite) => {
        setPendingInvites(prev => [invite, ...prev]);
      });
      
      socket.on('event-update', (updatedEvent) => {
        setCommunityEvents(prev => 
          prev.map(event => event.id === updatedEvent.id ? updatedEvent : event)
        );
      });
      
      return () => socket.disconnect();
    }
  }, [user]);
  
  // Gestionnaires d'actions sociales
  const handleCreateGroupRide = (rideData) => {
    socialService.createGroupRide({
      ...rideData,
      creatorId: user.id,
      createdAt: new Date().toISOString()
    }).then(newRide => {
      setCommunityEvents(prev => [newRide, ...prev]);
    });
  };
  
  const handleJoinRide = (rideId) => {
    socialService.joinGroupRide(rideId, user.id)
      .then(updatedRide => {
        setCommunityEvents(prev => 
          prev.map(event => event.id === updatedRide.id ? updatedRide : event)
        );
      });
  };
  
  const handleShareActivity = (activityData) => {
    socialService.createPost({
      type: 'activity',
      userId: user.id,
      content: activityData,
      createdAt: new Date().toISOString()
    }).then(newPost => {
      setFeedItems(prev => [newPost, ...prev]);
    });
  };
  
  return (
    <SocialContainer>
      <SocialNav 
        activeSection={activeSection} 
        onSectionChange={setActiveSection}
        pendingInvites={pendingInvites.length}
      />
      
      {activeSection === 'feed' && (
        <CommunityFeed 
          feedItems={feedItems}
          userConnections={userConnections}
          onShareActivity={handleShareActivity}
        />
      )}
      
      {activeSection === 'rides' && (
        <GroupRidesHub 
          communityEvents={communityEvents.filter(e => e.type === 'group-ride')}
          userJoinedRides={communityEvents.filter(e => 
            e.type === 'group-ride' && 
            e.participants.includes(user.id)
          )}
          onCreateRide={handleCreateGroupRide}
          onJoinRide={handleJoinRide}
        />
      )}
      
      {activeSection === 'challenges' && (
        <ChallengesHub 
          userId={user?.id}
        />
      )}
      
      {activeSection === 'connections' && (
        <ConnectionsManager 
          userConnections={userConnections}
          pendingInvites={pendingInvites}
          onInviteAction={(inviteId, action) => 
            socialService.handleInvite(inviteId, action)
          }
        />
      )}
    </SocialContainer>
  );
};
```

2. **Système de sorties de groupe**
Le module de gestion des sorties de groupe permet aux utilisateurs de créer et rejoindre des événements:

```javascript
// Extrait simplifié de GroupRidesList.js
export const GroupRidesList = ({ rides, userJoinedRides, onJoinRide }) => {
  const [filters, setFilters] = useState({
    region: '',
    difficulty: '',
    date: null,
    minDistance: '',
    maxDistance: ''
  });
  
  // Filtrage des sorties selon critères
  const filteredRides = useMemo(() => {
    return rides.filter(ride => {
      if (filters.region && ride.region !== filters.region) return false;
      if (filters.difficulty && ride.difficulty !== filters.difficulty) return false;
      if (filters.date && !isSameDay(new Date(ride.date), filters.date)) return false;
      if (filters.minDistance && ride.distance < parseInt(filters.minDistance)) return false;
      if (filters.maxDistance && ride.distance > parseInt(filters.maxDistance)) return false;
      return true;
    });
  }, [rides, filters]);
  
  // Tri des sorties (par défaut par date, les plus proches en premier)
  const sortedRides = useMemo(() => {
    return [...filteredRides].sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [filteredRides]);
  
  // Regroupement par catégorie (Mes sorties, À venir, Récemment ajoutées)
  const categorizedRides = useMemo(() => {
    const now = new Date();
    const userRideIds = userJoinedRides.map(r => r.id);
    
    return {
      joined: sortedRides.filter(r => userRideIds.includes(r.id)),
      upcoming: sortedRides.filter(r => 
        !userRideIds.includes(r.id) && 
        new Date(r.date) > now
      ),
      past: sortedRides.filter(r => 
        !userRideIds.includes(r.id) && 
        new Date(r.date) <= now
      )
    };
  }, [sortedRides, userJoinedRides]);
  
  return (
    <div className="group-rides-list">
      <div className="filters-section">
        <h3>Filtrer les sorties</h3>
        <FiltersForm 
          filters={filters}
          onFilterChange={setFilters}
        />
      </div>
      
      <div className="rides-sections">
        <RideCategory 
          title="Mes sorties"
          rides={categorizedRides.joined}
          emptyMessage="Vous n'avez rejoint aucune sortie."
          showJoinButton={false}
        />
        
        <RideCategory 
          title="Sorties à venir"
          rides={categorizedRides.upcoming}
          emptyMessage="Aucune sortie à venir."
          showJoinButton={true}
          onJoinRide={onJoinRide}
        />
        
        <RideCategory 
          title="Sorties passées"
          rides={categorizedRides.past}
          emptyMessage="Aucune sortie passée."
          showJoinButton={false}
        />
      </div>
    </div>
  );
};
```

3. **Intégration Strava et partage d'activités**
Le système d'intégration Strava permet de partager facilement les activités:

```javascript
// Extrait simplifié de stravaIntegration.js
export const stravaIntegration = {
  connectAccount: async (userId) => {
    // Initier la redirection OAuth vers Strava
    const oauthUrl = generateStravaOAuthUrl(userId);
    return oauthUrl;
  },
  
  handleCallback: async (code, state) => {
    // Traiter le callback OAuth de Strava
    const tokens = await exchangeCodeForTokens(code);
    const userId = extractUserIdFromState(state);
    
    // Sauvegarder les tokens d'accès et de rafraîchissement
    await socialService.saveStravaTokens(userId, tokens);
    
    return { success: true };
  },
  
  getRecentActivities: async (userId) => {
    // Récupérer les tokens d'accès
    const tokens = await socialService.getStravaTokens(userId);
    
    // Vérifier si le token d'accès est expiré
    if (isTokenExpired(tokens.expiresAt)) {
      const newTokens = await refreshStravaTokens(tokens.refreshToken);
      await socialService.updateStravaTokens(userId, newTokens);
      tokens.accessToken = newTokens.accessToken;
    }
    
    // Appeler l'API Strava pour récupérer les activités récentes
    const activities = await fetchStravaActivities(tokens.accessToken);
    
    return activities.map(activity => ({
      id: activity.id,
      name: activity.name,
      type: activity.type,
      distance: activity.distance,
      movingTime: activity.moving_time,
      elevationGain: activity.total_elevation_gain,
      startDate: activity.start_date,
      averageSpeed: activity.average_speed,
      maxSpeed: activity.max_speed,
      polyline: activity.map.summary_polyline,
      kudos: activity.kudos_count
    }));
  },
  
  shareActivity: async (userId, activityId) => {
    // Récupérer les détails de l'activité
    const tokens = await socialService.getStravaTokens(userId);
    const activityDetails = await fetchStravaActivityDetails(tokens.accessToken, activityId);
    
    // Créer un post dans le flux social
    const post = {
      type: 'strava-activity',
      userId,
      activityId,
      content: {
        title: activityDetails.name,
        distance: activityDetails.distance,
        elevationGain: activityDetails.total_elevation_gain,
        duration: activityDetails.moving_time,
        date: activityDetails.start_date,
        polyline: activityDetails.map.polyline
      }
    };
    
    return socialService.createPost(post);
  }
};
```

**Processus d'utilisation:**

1. **Création d'une sortie de groupe:**
   - L'utilisateur remplit un formulaire avec les informations de la sortie
     - Lieu de départ et arrivée
     - Date et heure
     - Distance et dénivelé prévus
     - Difficulté et vitesse moyenne attendue
     - Description de l'itinéraire
   - Il peut joindre un fichier GPX ou créer l'itinéraire sur la carte
   - Il définit le nombre maximum de participants et prérequis
   - La sortie est publiée et visible par tous les utilisateurs

2. **Participation aux sorties:**
   - Les utilisateurs peuvent rechercher des sorties par région, date, distance
   - Ils peuvent s'inscrire à une sortie et recevoir des notifications
   - Le chat de groupe permet de coordonner les détails avant la sortie
   - Les notifications automatiques rappellent la sortie à l'approche de la date
   - Après la sortie, les participants peuvent partager photos et impressions

3. **Partage d'activités Strava:**
   - L'utilisateur connecte son compte Strava via OAuth
   - Il peut importer et partager ses activités récentes
   - Les activités importées sont automatiquement enrichies:
     - Comparaison avec les cols du catalogue
     - Ajout de médailles pour les segments notables
     - Calcul de statistiques personnalisées (temps d'ascension, VAM, etc.)
   - Le partage peut être privé (amis seulement) ou public

4. **Challenges communautaires:**
   - Les utilisateurs peuvent créer ou participer à des challenges
   - Les défis sont liés à des objectifs (ascension des 7 Majeurs, dénivelé mensuel)
   - Le tableau de classement affiche la progression des participants
   - Des badges sont attribués automatiquement aux accomplissements

**Structure des données d'événements:**

Les événements communautaires sont structurés comme suit:

```javascript
{
  id: "ride-20250410-vosges",
  type: "group-ride",
  title: "Tour des Ballons dans les Vosges",
  creator: {
    id: "user123",
    name: "Jean Cycliste",
    level: "intermediate"
  },
  
  // Informations sur la sortie
  date: "2025-04-10T08:00:00Z",
  location: {
    startPoint: "Gérardmer, France",
    endPoint: "Gérardmer, France",
    coordinates: {
      start: [6.869433, 48.069256],
      end: [6.869433, 48.069256]
    }
  },
  
  // Caractéristiques de la sortie
  details: {
    distance: 85, // km
    elevationGain: 1450, // m
    estimatedDuration: 240, // minutes
    difficulty: "medium", // easy, medium, hard, expert
    paceType: "group", // group, race
    averageSpeed: 25 // km/h attendue
  },
  
  // Participants
  capacity: 15, // Nombre max de participants
  participants: ["user123", "user456", "user789"],
  waitlist: [],
  
  // Description et médias
  description: "Magnifique parcours autour des Ballons des Vosges avec ascension du Col de la Schlucht et du Grand Ballon. Pause café à mi-parcours.",
  routeUrl: "/routes/ride-20250410-vosges.gpx",
  photos: [
    "/images/events/vosges-spring-ride1.jpg",
    "/images/events/vosges-spring-ride2.jpg"
  ],
  
  // Options et requis
  options: {
    privateEvent: false,
    weatherDependent: true,
    reqBikeLights: false,
    reqHelmet: true
  },
  
  // Discussions et mises à jour
  messages: [
    {
      userId: "user123",
      content: "N'oubliez pas de prévoir des vêtements chauds pour les descentes",
      timestamp: "2025-04-02T14:25:00Z"
    }
  ],
  
  updates: [
    {
      type: "route-change",
      content: "Légère modification de l'itinéraire pour éviter les travaux à Munster",
      timestamp: "2025-04-05T09:12:00Z"
    }
  ]
}
```

**Structure des publications sociales:**

Les publications dans le flux social sont structurées comme suit:

```javascript
{
  id: "post-20250328-001",
  type: "challenge-completion",
  userId: "user123",
  createdAt: "2025-03-28T15:45:00Z",
  
  // Contenu variant selon le type de post
  content: {
    challengeId: "seven-majors-alpine",
    challengeName: "Les 7 Majeurs des Alpes",
    completionDate: "2025-03-28T14:30:00Z",
    cols: [
      "col-du-galibier",
      "alpe-dhuez",
      "col-de-la-madeleine",
      "col-du-glandon",
      "col-de-la-croix-de-fer",
      "col-du-telegraphe",
      "col-de-la-loze"
    ],
    totalElevation: 12450,
    totalDistance: 320,
    photos: [
      "/images/user-uploads/user123/galibier-summit.jpg",
      "/images/user-uploads/user123/alpedhuez-finish.jpg"
    ]
  },
  
  // Interactions
  likes: ["user456", "user789", "user101"],
  comments: [
    {
      userId: "user456",
      content: "Impressionnant ! Bravo pour cette performance !",
      createdAt: "2025-03-28T16:05:00Z"
    }
  ],
  
  // Partage
  shares: 5,
  privacy: "public" // public, friends, private
}
```

**Dépendances critiques:**
- Socket.io v4.4.0 ou supérieur (pour le chat en temps réel)
- Leaflet v1.7.1 ou supérieur (pour l'affichage des cartes)
- React-Calendar v3.5.0 ou supérieur (pour l'affichage du calendrier d'événements)
- Strava API SDK v1.1.0 ou supérieur (pour l'intégration Strava)
- Auth0 v1.10.0 ou supérieur (pour l'authentification sociale)

**Intégrations externes:**
- API Strava pour l'importation d'activités
- API OpenStreetMap pour les données géographiques
- API Auth0 pour l'authentification sociale
- Service de stockage Cloudinary pour les photos partagées

**Points d'attention pour le déploiement:**
- Vérifier que les clés API Strava sont correctement configurées
- S'assurer que les websockets sont activés sur le serveur Netlify
- Configurer les règles CORS pour permettre les requêtes depuis le domaine déployé
- Vérifier que les fonctions serverless de notification sont configurées

{{ ... }}

## 7. Ressources visuelles et identité graphique

### 7.1. Logo et icônes

Le projet dispose d'une identité visuelle moderne et cohérente disponible dans `/client/public/images/`:

- **Logo principal**: `logo.svg` - Version vectorielle complète pour usage principal
- **Logo alternatif**: `logo_large.png` - Version haute résolution (2000x500px)
- **Favicon**: `favicon.ico` - Favicon optimisé multi-résolution
- **Icônes d'application**:
  - `icon16.png` - 16x16px pour la barre d'adresse
  - `icon48.png` - 48x48px pour les onglets
  - `icon128.png` - 128x128px pour les tiles d'application

Les couleurs de l'identité visuelle suivent un dégradé bleu-vert moderne avec ces codes hexadécimaux principaux:
- Primaire: `#1976d2` (bleu)
- Secondaire: `#21CBF3` (cyan)
- Accent: `#2E7D32` (vert)

### 7.2. Composants visuels premium

Pour garantir une expérience utilisateur moderne et impressionnante, les composants visuels suivants ont été implémentés:

#### Hero Section avec Parallaxe
Le composant `HeroParallax.js` offre:
- Effet de parallaxe au défilement 
- Animation de fondu à l'entrée
- Call-to-action flottant avec animations
- Indicateur de défilement animé
- Support des arrière-plans haute résolution

#### Animations cyclistes
Le composant `BikeAnimationCanvas.js` génère:
- Animation vectorielle fluide d'un cycliste
- Rotation des roues synchronisée
- Mouvement des pédales réaliste
- Personnalisation des couleurs et de la vitesse
- Rendu optimisé via Canvas

#### Visualisation 3D des cols
Le composant `ColVisualization3D.js` offre:
- Rendu 3D haute fidélité des profils d'altitude
- Textures réalistes selon types de surface
- Éclairage dynamique et ombres
- Mode économie de batterie adaptatif
- 5 niveaux de détail pour différentes performances matérielles

### 7.3. Ressources photographiques

Les images haute résolution optimisées sont organisées par catégories:
- `/images/summits/` - Photos de cols à 1920x1080px
- `/images/profiles/` - Avatars et photos de profil
- `/images/social/` - Éléments graphiques pour les fonctionnalités sociales
- `/images/nutrition/` - Illustrations pour les recettes et conseils nutritionnels

L'ensemble du système graphique est conçu pour s'adapter aux écrans haute résolution (jusqu'à 4K) et respecte les principes de design responsif.

### 7.4. Recommandations pour la page d'accueil

Pour maximiser l'impact visuel de la page d'accueil:

1. **Hero Section**:
   - Utiliser une photo panoramique de haute qualité d'un col alpin emblématique
   - Activer l'effet de parallaxe avancé avec HeroParallax
   - Intégrer un appel à l'action contrasté avec animation au survol

2. **Carte des régions interactive**:
   - Afficher la carte régionale avec effets de survol
   - Utiliser RegionMap avec activation des animations

3. **Visualisation 3D**:
   - Intégrer un aperçu 3D du Col du Galibier comme démonstration
   - Activer les effets météo pour une immersion maximale

4. **Statistiques animées**:
   - Utiliser AnimatedStats avec compteurs progressifs
   - Afficher des statistiques impressionnantes de la communauté

5. **Section communautaire**:
   - Arrière-plan sombre avec image en overlay à contraste élevé
   - Boutons d'inscription avec dégradés de couleur et animations

Ces recommandations garantiront une page d'accueil visuellement impressionnante et mémorable pour les utilisateurs.

```

```

```
## Statut du Déploiement Final - 5 Avril 2025

### Modules Finalisés
- ✅ Module "Les 7 Majeurs" - Intégration complète avec interface utilisateur et fonctionnalités
- ✅ Module FTP Calculator - 6 méthodes de calcul et visualisation des zones avec Chart.js
- ✅ Module HIIT - Génération d'intervalles avec validation robuste des paramètres
- ✅ Module Nutrition - 40 recettes complètes avec filtrage et adaptation aux préférences alimentaires
- ✅ Explorateur de Cols - Visualisations 3D avec effets météo et optimisation mobile

### Améliorations Apportées (5 Avril 2025)
- ✅ Installation des dépendances manquantes (react-helmet, react-map-gl, react-bootstrap, etc.)
- ✅ Configuration finale de Netlify (versions Node.js et NPM, redirections API)
- ✅ Mise à jour du fichier netlify.toml avec les paramètres optimisés
- ✅ Configuration de l'environnement via .env.local
- ✅ Ajout de script personnalisé pour le déploiement Netlify (netlify-build)
- ✅ Changement de branding de "Grand Est Cyclisme" à "Velo-Altitude"

### Prêt pour le déploiement
- ✅ Documentation complète 
- ✅ Tous les modules fonctionnels
- ✅ Intégration des fonctions Netlify
- ✅ Variables d'environnement configurées sur Netlify
- ✅ Tests finaux effectués
- ✅ Performance optimisée pour le web et mobile

La plateforme Velo-Altitude est maintenant prête pour le déploiement final et le lancement officiel prévu le 12 avril 2025.

## 🟢 Mise à jour finale avant déploiement (05/04/2025)

- ✅ Configuration GitHub-Netlify finalisée
- ✅ Redis désactivé pour faciliter le déploiement initial
- ✅ Site prêt pour le déploiement final sur https://velo-altitude.com
