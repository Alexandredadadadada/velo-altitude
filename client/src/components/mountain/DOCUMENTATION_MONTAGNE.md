# Documentation du Module Montagne

Ce document détaille l'architecture et les fonctionnalités du module Montagne intégré à l'application Grand Est Cyclisme, spécifiquement conçu pour les cyclistes souhaitant préparer des ascensions dans les grands cols européens.

## 1. Architecture du module

Le module Montagne est organisé selon une architecture modulaire avec plusieurs composants spécialisés :

```
/components/mountain/
├── MountainHub.js                    # Point d'entrée principal du module
├── index.js                          # Fichier d'export des composants
├── components/
│   ├── MountainDashboard.js          # Tableau de bord et sélection des cols
│   ├── ColSpecificTraining.js        # Plans d'entraînement spécifiques aux cols
│   ├── ColSpecificNutrition.js       # Plans nutritionnels spécifiques aux cols
│   └── RegionalTrainingPlans.js      # Plans d'entraînement par région
└── __tests__/                        # Tests unitaires du module
```

Les routes du module sont gérées par `MountainHub.js` qui utilise React Router pour le routage interne :

- `/mountain/dashboard` - Tableau de bord principal
- `/mountain/training` - Entraînement spécifique par col
- `/mountain/nutrition` - Nutrition spécifique par col
- `/mountain/regional` - Plans régionaux d'entraînement
- `/mountain/regional/:region` - Plans pour une région spécifique

## 2. Algorithmes d'entraînement spécifiques aux cols

### 2.1 Adaptation de l'entraînement aux caractéristiques des cols

Le module utilise plusieurs variables pour adapter les plans d'entraînement aux spécificités de chaque col :

| Variable | Description | Impact sur l'entraînement |
|----------|-------------|---------------------------|
| Longueur | Distance totale du col en km | Détermine le volume d'entraînement |
| Pente moyenne | Gradient moyen en % | Influence l'intensité des séances |
| Altitude maximale | Point culminant en mètres | Adapte la préparation à l'altitude |
| Profil | Régularité/irrégularité de la pente | Définit les types d'intervalles |
| Région | Alpes, Pyrénées, Dolomites, etc. | Ajuste pour les spécificités régionales |

### 2.2 Formules de calcul des zones d'entraînement adaptées

Pour chaque col, le système calcule les zones d'entraînement optimales selon les formules suivantes :

1. **Puissance cible pour l'ascension** (en watts) :
   ```
   P_cible = (FTP × (1 - (longueurCol / 100) × 0.05)) × (1 - (altitudeMax / 3000) × 0.1)
   ```

2. **Durée d'entraînement hebdomadaire** (en heures) :
   ```
   Durée = 5 + (difficulté / 10) × 5
   ```

3. **Distribution de l'intensité** (% du temps par zone) :
   ```
   Zone 1 (Récupération) = 30% - (difficulté × 1%)
   Zone 2 (Endurance) = 45% - (penteMax × 1%)
   Zone 3 (Tempo) = 15% + (penteAvg × 1%)
   Zone 4 (Seuil) = 7% + (penteMax × 0.5%)
   Zone 5 (VO2max) = 3% + (irrégularité × 1%)
   ```

### 2.3 Planification adaptative

Le système génère un plan d'entraînement sur 12 semaines qui s'adapte progressivement :

- **Semaines 1-4** : Construction de l'endurance de base
- **Semaines 5-8** : Développement de la puissance spécifique
- **Semaines 9-10** : Simulation des conditions du col
- **Semaines 11-12** : Affûtage et préparation finale

## 3. Stratégies nutritionnelles spécifiques

### 3.1 Calcul des besoins énergétiques spécifiques aux cols

Les besoins énergétiques sont calculés selon la formule :

```
Calories = Poids × Durée × (3.5 + (pente × 0.25) + (altitude/1000 × 0.2))
```

Où :
- `Poids` est en kilogrammes
- `Durée` est en heures
- `pente` est en pourcentage
- `altitude` est l'altitude moyenne en mètres

### 3.2 Stratégies d'hydratation et d'électrolytes par région

| Région | Stratégie d'hydratation | Explication |
|--------|-------------------------|-------------|
| Alpes | 750-1000ml/h + électrolytes renforcés | Climats variables, haute altitude |
| Pyrénées | 800-1100ml/h + sodium renforcé | Chaleur intense, ascensions continues |
| Dolomites | 700-900ml/h + magnésium renforcé | Ascensions techniques, moins d'exposition |
| Ardennes | 600-800ml/h + électrolytes standard | Efforts courts, intensité élevée |

### 3.3 Distribution macronutriments pendant l'ascension

```
Glucides = 60-90g/h selon l'intensité et la durée
Protéines = 5-10g/h pour ascensions >3h
Lipides = Minimaux pendant l'effort (<5g/h)
```

## 4. Intégration 3D et visualisation des cols

Le module s'intègre avec le composant `ColVisualization3D` pour offrir une représentation tridimensionnelle des cols, permettant :

- Visualisation du profil complet du col
- Identification des sections critiques (pentes maximales)
- Simulation virtuelle de l'ascension
- Points d'intérêt (ravitaillements, points de vue)

### 4.1 Sources de données pour la visualisation

Les données topographiques proviennent de plusieurs sources :

- Données d'élévation : API OpenTopoData (résolution 30m)
- Typologies de surface : OpenStreetMap
- Coordonnées GPS : calcul de latitude/longitude basé sur la géométrie
- Points d'intérêt : base de données propriétaire, complétée par crowdsourcing

## 5. Feature Flags

Le module utilise plusieurs feature flags pour activer/désactiver certaines fonctionnalités :

| Feature Flag | Description | Valeur par défaut |
|--------------|-------------|------------------|
| `enableMountainModule` | Active l'ensemble du module Montagne | `true` |
| `enableColSpecificTraining` | Active les plans d'entraînement spécifiques | `true` |
| `enableColSpecificNutrition` | Active les plans nutritionnels spécifiques | `true` |
| `enableRegionalTrainingPlans` | Active les plans régionaux | `true` |

## 6. Intégration avec les autres modules

### 6.1 Avec le module d'entraînement

- Partage des algorithmes de zones d'entraînement
- Utilisation des données FTP de l'utilisateur
- Synchronisation des plans d'entraînement

### 6.2 Avec le module de nutrition

- Partage des calculs de dépense énergétique
- Adaptation des recommandations alimentaires
- Synchronisation des plans nutritionnels

### 6.3 Avec le module "Les 7 Majeurs"

- Partage de la base de données des cols
- Utilisation des mêmes composants de visualisation
- Possibilité d'ajouter des cols au défi des 7 Majeurs

## 7. API Backend

Le module s'appuie sur plusieurs endpoints d'API :

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/cols` | GET | Liste des cols avec filtrage par région |
| `/api/cols/:id` | GET | Détails d'un col spécifique |
| `/api/mountain/training-plan` | POST | Génération plan d'entraînement |
| `/api/mountain/nutrition-plan` | POST | Génération plan nutritionnel |
| `/api/mountain/regional-plans/:region` | GET | Plans régionaux |
| `/api/cols/:id/3d-data` | GET | Données de visualisation 3D |

## 8. Technologies utilisées

- **Frontend** : React, React Router, Material UI
- **Visualisation 3D** : Three.js, react-three-fiber
- **APIs** : REST, Axios pour les requêtes
- **État** : React Hooks, Context API
- **Performance** : Chargement paresseux (lazy loading), optimisation des rendus

## 9. Maintenance et évolution

### 9.1 Roadmap future

- Intégration de données météorologiques en temps réel
- Ajout de la réalité augmentée pour la visualisation mobile
- Extension à d'autres régions montagneuses (Sierra Nevada, Alpes suisses)
- Fonctionnalités sociales pour partager les performances

### 9.2 Tests et qualité

Tous les composants sont accompagnés de tests unitaires dans le dossier `__tests__` validant :

- Le rendu correct des composants
- Les appels API et la gestion des erreurs
- Les calculs des plans d'entraînement et de nutrition
- L'intégration avec les autres modules
