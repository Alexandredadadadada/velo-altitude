# Inventaire des Outils et Structure des Dashboards - Velo-Altitude

*Document de référence - Version 1.0 - 6 avril 2025*

Ce document présente un inventaire complet des outils interactifs, calculatrices et dashboards de la plateforme Velo-Altitude, ainsi que leur organisation au sein des différentes pages. Il sert de référence pour comprendre la distribution des fonctionnalités et guider les développements futurs.

## Table des matières

1. [Vue d'ensemble des dashboards](#vue-densemble-des-dashboards)
2. [Dashboard principal](#dashboard-principal)
3. [Dashboard cols](#dashboard-cols)
4. [Dashboard entraînement](#dashboard-entraînement)
5. [Dashboard nutrition](#dashboard-nutrition)
6. [Dashboard météo](#dashboard-météo)
7. [Dashboard communautaire](#dashboard-communautaire)
8. [Calculatrices et outils interactifs](#calculatrices-et-outils-interactifs)
9. [Visualisations avancées](#visualisations-avancées)
10. [Structure d'URL et navigation](#structure-durl-et-navigation)
11. [Recommandations d'optimisation](#recommandations-doptimisation)

## Vue d'ensemble des dashboards

La plateforme Velo-Altitude est organisée autour de 6 dashboards principaux, chacun avec ses outils spécifiques et des fonctionnalités interactives.

| Dashboard | URL principale | Outils disponibles | État | Niveau d'interactivité |
|-----------|----------------|-------------------|------|------------------------|
| Principal | `/` | 5 | Actif | ★★★★☆ |
| Cols | `/cols` | 7 | Actif | ★★★★★ |
| Entraînement | `/entrainement` | 8 | Actif | ★★★★★ |
| Nutrition | `/nutrition` | 4 | Actif | ★★★☆☆ |
| Météo | `/meteo` | 3 | Actif | ★★★★☆ |
| Communautaire | `/communaute` | 6 | Actif | ★★★☆☆ |

## Dashboard principal

**URL:** `/`

Le dashboard principal sert de hub central vers les différentes sections et affiche un résumé des informations clés.

### Outils disponibles

| Outil | Description | Emplacement | Statut | Technologies |
|-------|-------------|------------|--------|--------------|
| ColExplorer | Mini-explorateur interactif des cols à proximité | Panneau central | Actif | React, Mapbox |
| NextRideWeather | Aperçu météo pour votre prochaine sortie | Panneau latéral droit | Actif | React, OpenWeatherAPI |
| UserActivityFeed | Flux d'activités personnalisé | Panneau inférieur | Actif | React, Context API |
| CommunityHighlights | Points forts de la communauté | Panneau latéral gauche | Actif | React |
| UpcomingChallenges | Aperçu des défis à venir | Panneau supérieur | Actif | React, Context API |

### Composition du dashboard

```
+-----------------------------------------------+
|                  Header Nav                   |
+-----------------------------------------------+
| UpcomingChallenges                           |
+---------------+-------------------+-----------+
|               |                   |           |
| Community     |                   | NextRide  |
| Highlights    |   ColExplorer     | Weather   |
|               |                   |           |
|               |                   |           |
+---------------+-------------------+-----------+
|             UserActivityFeed                  |
+-----------------------------------------------+
|                    Footer                     |
+-----------------------------------------------+
```

## Dashboard cols

**URL:** `/cols`

Ce dashboard présente les informations détaillées sur les cols et offre des outils avancés d'exploration et de visualisation.

### Outils disponibles

| Outil | Description | Emplacement | Statut | Technologies |
|-------|-------------|------------|--------|--------------|
| Col3DVisualization | Visualisation 3D interactive des cols | Page détaillée col | Actif | Three.js, React Three Fiber |
| ColProfileAnalyzer | Analyse détaillée du profil d'un col | Page détaillée col | Actif | D3.js, SVG |
| ColComparisonTool | Comparaison côte à côte de plusieurs cols | `/cols/compare` | Actif | React, CSS Grid |
| WeatherHistoryViewer | Historique météo du col | Page détaillée col | Actif | Chart.js, OpenWeatherAPI |
| SegmentExplorer | Exploration des segments Strava | Page détaillée col | Actif | React, StravaAPI |
| ClimbTimeCalculator | Calculateur de temps d'ascension | Page détaillée col | Actif | React, JavaScript |
| ColFilterMap | Carte interactive avec filtres avancés | `/cols` | Actif | Mapbox, React |

### URL et structure

- **Liste principale:** `/cols`
- **Page région:** `/cols/{region}` (ex: `/cols/alpes`)
- **Page détaillée:** `/cols/{region}/{col-slug}` (ex: `/cols/alpes/alpe-d-huez`)
- **Page visualisation 3D:** `/cols/{region}/{col-slug}/3d`
- **Page comparaison:** `/cols/compare?cols={col1},{col2},{col3}`

## Dashboard entraînement

**URL:** `/entrainement`

Ce dashboard offre des outils de planification, de suivi et d'analyse pour l'entraînement cycliste.

### Outils disponibles

| Outil | Description | Emplacement | Statut | Technologies |
|-------|-------------|------------|--------|--------------|
| FTPCalculator | Calculateur de FTP avec 6 méthodes | `/entrainement/outils/ftp-calculator` | Actif | React, MUI |
| TrainingZoneVisualizer | Visualisation des zones d'entraînement | `/entrainement/outils/zones` | Actif | D3.js, React |
| TrainingPlanBuilder | Création de plans d'entraînement | `/entrainement/plan-builder` | Actif | React, DnD Kit |
| WorkoutCreator | Création de séances personnalisées | `/entrainement/workout-creator` | Actif | React, JavaScript |
| ClimbPreparationTool | Outil de préparation pour cols spécifiques | `/entrainement/preparation-cols` | Actif | React, JavaScript |
| StravaDataAnalyzer | Analyse des données Strava | `/entrainement/strava-analyzer` | Actif | React, StravaAPI, Chart.js |
| ProgressTracker | Suivi de progression | `/entrainement/progression` | Actif | React, Chart.js |
| TrainingCalendar | Calendrier d'entraînement | `/entrainement/calendrier` | Actif | React, FullCalendar |

### URL et structure

- **Accueil:** `/entrainement`
- **Programmes:** `/entrainement/{niveau}` (ex: `/entrainement/debutant`)
- **Programme spécifique:** `/entrainement/{niveau}/{programme-slug}`
- **Outils:** `/entrainement/outils`
- **Outil spécifique:** `/entrainement/outils/{outil-slug}`

## Dashboard nutrition

**URL:** `/nutrition`

Ce dashboard offre des outils pour la planification nutritionnelle adaptée au cyclisme.

### Outils disponibles

| Outil | Description | Emplacement | Statut | Technologies |
|-------|-------------|------------|--------|--------------|
| NutritionCalculator | Calculateur de besoins nutritionnels | `/nutrition/calculateur` | Actif | React, MUI |
| MealPlanner | Planificateur de repas pour cyclistes | `/nutrition/meal-planner` | Actif | React, JavaScript |
| HydrationCalculator | Calculateur de besoins en hydratation | `/nutrition/hydratation` | Actif | React, JavaScript |
| RecipeFinder | Recherche de recettes adaptées à l'effort | `/nutrition/recettes` | Actif | React, JavaScript |

### URL et structure

- **Accueil:** `/nutrition`
- **Recettes:** `/nutrition/recettes`
- **Recette détaillée:** `/nutrition/recettes/{recette-slug}`
- **Plans:** `/nutrition/plans`
- **Plan détaillé:** `/nutrition/plans/{plan-slug}`
- **Guides:** `/nutrition/guides`
- **Guide détaillé:** `/nutrition/guides/{guide-slug}`

## Dashboard météo

**URL:** `/meteo`

Ce dashboard fournit des informations météorologiques adaptées au cyclisme.

### Outils disponibles

| Outil | Description | Emplacement | Statut | Technologies |
|-------|-------------|------------|--------|--------------|
| WeatherMap | Carte météo interactive pour cyclistes | `/meteo` | Actif | Mapbox, OpenWeatherAPI |
| WindVisualization | Visualisation des vents | `/meteo/vent` | Actif | D3.js, OpenWeatherAPI |
| RouteWeatherPlanner | Planificateur météo pour itinéraires | `/meteo/itineraire` | Actif | React, OpenWeatherAPI, Mapbox |

### URL et structure

- **Accueil:** `/meteo`
- **Prévisions par région:** `/meteo/{region}`
- **Prévisions pour col:** `/meteo/col/{col-slug}`

## Dashboard communautaire

**URL:** `/communaute`

Ce dashboard offre des fonctionnalités sociales et de partage pour les cyclistes.

### Outils disponibles

| Outil | Description | Emplacement | Statut | Technologies |
|-------|-------------|------------|--------|--------------|
| GroupRidePlanner | Planificateur de sorties en groupe | `/communaute/sorties` | Actif | React, Mapbox |
| ChallengeTracker | Suivi des défis collectifs | `/communaute/defis` | Actif | React, JavaScript |
| RidePhotoGallery | Galerie photos communautaire | `/communaute/galerie` | Actif | React, Lightbox |
| UserProfileViewer | Visualisation des profils utilisateurs | `/communaute/profil/{user-slug}` | Actif | React, JavaScript |
| AchievementSystem | Système de badges et récompenses | `/communaute/recompenses` | Actif | React, JavaScript |
| ForumDiscussion | Forum de discussion | `/communaute/forum` | Actif | React, JavaScript |

### URL et structure

- **Accueil:** `/communaute`
- **Profil utilisateur:** `/communaute/profil/{user-slug}`
- **Forum:** `/communaute/forum`
- **Sujet forum:** `/communaute/forum/{categorie}/{sujet-slug}`

## Calculatrices et outils interactifs

Cette section présente une vue d'ensemble des calculatrices et outils interactifs disponibles à travers la plateforme.

### Calculatrices avancées

| Outil | Description | URL | Complexité |
|-------|-------------|-----|------------|
| FTPCalculator | Calculateur multi-méthodes de FTP | `/entrainement/outils/ftp-calculator` | ★★★★★ |
| NutritionCalculator | Calculateur de besoins nutritionnels | `/nutrition/calculateur` | ★★★★☆ |
| ClimbTimeCalculator | Estimateur de temps d'ascension | `/cols/outils/climb-calculator` | ★★★☆☆ |
| HydrationCalculator | Calculateur besoins hydratation | `/nutrition/hydratation` | ★★★☆☆ |
| PowerEstimator | Estimateur de puissance | `/entrainement/outils/power-estimator` | ★★★★☆ |

### Outils d'analyse

| Outil | Description | URL | Complexité |
|-------|-------------|-----|------------|
| StravaDataAnalyzer | Analyse des données Strava | `/entrainement/strava-analyzer` | ★★★★★ |
| ColProfileAnalyzer | Analyse des profils de cols | `/cols/outils/profile-analyzer` | ★★★★☆ |
| TrainingLoadAnalyzer | Analyse de charge d'entraînement | `/entrainement/outils/training-load` | ★★★★☆ |
| PerformancePredictor | Prédicteur de performance | `/entrainement/outils/performance-predictor` | ★★★★☆ |

### Planificateurs

| Outil | Description | URL | Complexité |
|-------|-------------|-----|------------|
| TrainingPlanBuilder | Créateur de plans d'entraînement | `/entrainement/plan-builder` | ★★★★★ |
| RouteWeatherPlanner | Planificateur météo d'itinéraire | `/meteo/itineraire` | ★★★★☆ |
| NutritionPlanner | Planificateur nutritionnel | `/nutrition/meal-planner` | ★★★★☆ |
| GroupRidePlanner | Planificateur de sorties groupe | `/communaute/sorties` | ★★★☆☆ |

## Visualisations avancées

Cette section détaille les visualisations interactives les plus impressionnantes de la plateforme.

### Visualisations 3D

| Outil | Description | URL | Performance |
|-------|-------------|-----|------------|
| Col3DVisualization | Visualisation 3D des cols | `/cols/{region}/{col-slug}/3d` | ★★★★★ |
| ElevationProfiler3D | Profil d'élévation 3D | `/cols/outils/elevation-profiler` | ★★★★☆ |

### Visualisations de données

| Outil | Description | URL | Complexité |
|-------|-------------|-----|------------|
| TrainingZoneVisualizer | Visualisation zones d'entraînement | `/entrainement/outils/zones` | ★★★★☆ |
| WindVisualization | Visualisation des vents | `/meteo/vent` | ★★★★★ |
| ProgressTracker | Suivi progression graphique | `/entrainement/progression` | ★★★★☆ |
| ChallengeTracker | Suivi graphique des défis | `/communaute/defis` | ★★★☆☆ |

### Cartes interactives

| Outil | Description | URL | Complexité |
|-------|-------------|-----|------------|
| ColFilterMap | Carte des cols avec filtres | `/cols` | ★★★★★ |
| WeatherMap | Carte météo pour cyclistes | `/meteo` | ★★★★☆ |
| UserActivityMap | Carte des activités utilisateurs | `/communaute/activites` | ★★★★☆ |

## Structure d'URL et navigation

### Structure globale

La structure d'URL de Velo-Altitude suit une hiérarchie claire et intuitive :

```
/
├── cols/
│   ├── [region]/
│   │   └── [col-slug]/
│   │       └── 3d
│   ├── compare
│   └── outils/
│       ├── climb-calculator
│       ├── profile-analyzer
│       └── elevation-profiler
├── entrainement/
│   ├── [niveau]/
│   │   └── [programme-slug]
│   ├── outils/
│   │   ├── ftp-calculator
│   │   ├── zones
│   │   ├── power-estimator
│   │   ├── training-load
│   │   └── performance-predictor
│   ├── plan-builder
│   ├── workout-creator
│   ├── preparation-cols
│   ├── strava-analyzer
│   ├── progression
│   └── calendrier
├── nutrition/
│   ├── recettes/
│   │   └── [recette-slug]
│   ├── plans/
│   │   └── [plan-slug]
│   ├── guides/
│   │   └── [guide-slug]
│   ├── calculateur
│   ├── meal-planner
│   └── hydratation
├── meteo/
│   ├── [region]
│   ├── col/
│   │   └── [col-slug]
│   ├── vent
│   └── itineraire
└── communaute/
    ├── profil/
    │   └── [user-slug]
    ├── forum/
    │   └── [categorie]/
    │       └── [sujet-slug]
    ├── sorties
    ├── defis
    ├── galerie
    └── recompenses
```

### Navigation principale

La navigation principale utilise un système de menus à deux niveaux :

1. **Menu principal :** Navigation entre les 6 dashboards principaux
2. **Sous-menu contextuel :** Options spécifiques au dashboard actif

### Points d'entrée recommandés

Pour chaque type d'utilisateur, les points d'entrée suivants sont recommandés :

| Type d'utilisateur | Dashboard recommandé | Outils à mettre en avant |
|-------------------|---------------------|--------------------------|
| Débutant | `/entrainement/debutant` | FTPCalculator, ClimbTimeCalculator |
| Intermédiaire | `/entrainement` et `/cols` | TrainingPlanBuilder, Col3DVisualization |
| Avancé | Tous les dashboards | StravaDataAnalyzer, TrainingLoadAnalyzer |
| Focalisé sur les cols | `/cols` | Col3DVisualization, ColProfileAnalyzer |
| Focalisé sur la performance | `/entrainement` | FTPCalculator, StravaDataAnalyzer |
| Focalisé sur la nutrition | `/nutrition` | NutritionCalculator, MealPlanner |

## Recommandations d'optimisation

### Mise en avant des outils par dashboard

Pour chaque dashboard, les outils suivants devraient être mis en avant :

1. **Dashboard principal**
   - ColExplorer (accès rapide aux cols)
   - NextRideWeather (valeur immédiate)

2. **Dashboard cols**
   - Col3DVisualization (techniquement impressionnant)
   - ColComparisonTool (fonctionnalité unique)

3. **Dashboard entraînement**
   - FTPCalculator (complet et unique)
   - TrainingPlanBuilder (haute valeur ajoutée)

4. **Dashboard nutrition**
   - NutritionCalculator (complet)
   - MealPlanner (pratique)

5. **Dashboard météo**
   - WindVisualization (visuellement impressionnant)
   - RouteWeatherPlanner (fonctionnalité unique)

6. **Dashboard communautaire**
   - GroupRidePlanner (fonctionnalité sociale)
   - ChallengeTracker (engagement)

### Optimisations prioritaires

1. **Performance**
   - Optimiser le chargement des visualisations 3D
   - Implémenter le lazy loading pour les composants lourds
   - Améliorer la gestion de batterie sur mobile

2. **Expérience utilisateur**
   - Créer des tutoriels interactifs pour les outils complexes
   - Simplifier les interfaces des calculatrices
   - Améliorer la navigabilité entre outils connexes

3. **Nouvelles fonctionnalités**
   - Développer l'intégration AR/VR pour Col3DVisualization
   - Ajouter des fonctionnalités d'apprentissage automatique aux prédicteurs
   - Créer des versions Widget de certains outils pour intégration au dashboard principal

### Recommandations pour la présentation des dashboards

1. **Organisation cohérente**
   - Maintenir une grille standardisée de 3x3 pour les widgets
   - Positionner les outils les plus visuels en haut
   - Placer les outils analytiques plus complexes en bas

2. **Mise en avant des fonctionnalités uniques**
   - Créer des bannières pour les outils vedettes
   - Utiliser des animations discrètes pour attirer l'attention
   - Ajouter des badges "Nouveau" ou "Amélioré" aux outils récemment mis à jour

3. **Personnalisation**
   - Permettre à l'utilisateur de personnaliser ses dashboards
   - Recommander automatiquement des outils selon le profil
   - Mémoriser les derniers outils utilisés

---

Ce document d'inventaire servira de référence pour l'organisation et la mise en avant des outils sur les différents dashboards de la plateforme Velo-Altitude. Il permet d'identifier les fonctionnalités les plus impressionnantes et de les présenter de manière optimale aux utilisateurs.
