# Plan de Standardisation du Contenu Velo-Altitude

**Date :** 6 avril 2025  
**Version :** 1.1  
**Auteur :** Cascade, Chef de Projet Contenu  
**Statut :** En cours d'implémentation

## 1. Objectifs

- Éliminer tous les doublons de contenu
- Standardiser la structure des données selon un format uniforme
- Assurer la rétrocompatibilité avec le système existant
- Faciliter l'intégration des nouveaux contenus

## 2. Inventaire des Contenus Existants

### 2.1 Cols (Total actuel : 72)

| Source de données | Nombre de cols | Format | Statut | Action requise |
|-------------------|----------------|--------|--------|----------------|
| cols-index.json | 12 | Index simple | Actif | Migrer vers index unifié |
| european-cols-enriched-final.json | 3 | Enrichi | Actif | Extraire en fichiers individuels |
| european-cols-enriched-final2.json | 2 | Enrichi | Actif | Extraire en fichiers individuels |
| european-cols-enriched-part1-10.json | 50 (5×10) | Enrichi | Actif | Extraire en fichiers individuels |
| european-cols-enriched-east1.json | 2 | Enrichi | Actif | Extraire en fichiers individuels |
| european-cols-enriched-east2.json | 1 | Enrichi | Actif | Extraire en fichiers individuels |
| client/src/data/remainingCols.js | 8 | JavaScript | Actif | Convertir en JSON et standardiser |
| client/src/data/remainingCols2.js | 2 | JavaScript | Actif | Convertir en JSON et standardiser |
| client/src/data/remainingCols3.js | 2 | JavaScript | Actif | Convertir en JSON et standardiser |
| client/src/data/remainingCols4.js | 2 (estimé) | JavaScript | Actif | Convertir en JSON et standardiser |
| client/src/data/remainingCols5.js | 2 (estimé) | JavaScript | Actif | Convertir en JSON et standardiser |
| enriched-cols/bonette.json | 1 | Enrichi complet | Actif | Utiliser comme modèle de référence |

**Liste des cols identifiés comme doublons potentiels** :
- Stelvio (apparaît dans cols-index.json et european-cols-enriched-part3.json)
- Mont Ventoux (apparaît dans cols-index.json et european-cols-enriched-part2.json)
- Galibier (apparaît dans cols-index.json et european-cols-enriched-part1.json)

### 2.2 Plans nutritionnels et Recettes (Total : 23)

| Source de données | Nombre d'éléments | Format | Statut | Action requise |
|-------------------|-------------------|--------|--------|----------------|
| nutrition-plans.json | 3 plans | JSON | Actif | Extraire en fichiers individuels |
| client/src/data/nutritionRecipes.js | 8 recettes | JavaScript | Actif | Convertir en JSON et standardiser |
| client/src/data/additionalNutritionRecipes1.js | 6 recettes | JavaScript | Actif | Convertir en JSON et standardiser |
| client/src/data/additionalNutritionRecipes2.js | 6 recettes | JavaScript | Actif | Convertir en JSON et standardiser |
| Recettes diverses cachées (dans composants) | ~77 recettes (estimé) | JavaScript | Actif | Identifier, extraire et standardiser |

### 2.3 Plans d'entraînement et Workouts (Total : 28)

| Source de données | Nombre d'éléments | Format | Statut | Action requise |
|-------------------|-------------------|--------|--------|----------------|
| training-plans.json | 4 plans | JSON | Actif | Extraire en fichiers individuels |
| training-plans-enhanced/plan-haute-montagne.json | 1 plan | JSON | Actif | Standardiser le format |
| client/src/data/trainingPrograms.js | 3 plans | JavaScript | Actif | Convertir en JSON et standardiser |
| client/src/data/remainingTrainingPrograms.js | 1 plan | JavaScript | Actif | Convertir en JSON et standardiser |
| client/src/data/remainingTrainingPrograms2.js | 1 plan | JavaScript | Actif | Convertir en JSON et standardiser |
| client/src/data/remainingTrainingPrograms3.js | 1 plan (estimé) | JavaScript | Actif | Convertir en JSON et standardiser |
| client/src/data/specialTrainingPrograms.js | 1 plan | JavaScript | Actif | Convertir en JSON et standardiser |
| client/src/data/specialTrainingPrograms2.js | 1 plan | JavaScript | Actif | Convertir en JSON et standardiser |
| client/src/data/specialTrainingPrograms3.js | 1 plan (estimé) | JavaScript | Actif | Convertir en JSON et standardiser |
| client/src/data/hiitWorkouts.js | 17 workouts | JavaScript | Actif | Convertir en JSON et standardiser |
| client/src/data/endurancePrograms.js | ~5 plans (estimé) | JavaScript | Actif | Convertir en JSON et standardiser |
| client/src/data/classicPrograms.js | ~5 plans (estimé) | JavaScript | Actif | Convertir en JSON et standardiser |
| Programmes divers cachés (dans composants) | ~20 plans (estimé) | JavaScript | Actif | Identifier, extraire et standardiser |

### 2.4 Visualisations 3D disponibles

| Composant | Fonctionnalité | Cols pris en charge | Statut |
|-----------|----------------|---------------------|--------|
| ColVisualization3D.js | Visualisation complète | Bonette et ~4 autres cols | Actif |
| Pass3DViewer.js | Visualisation interactive | Tous les cols enrichis | Actif |
| InteractivePoint.js | Points d'intérêt interactifs | Tous les cols enrichis | Actif |
| PassComparison.js | Comparaison visuelle | Tous les cols enrichis | Actif |

### 2.5 Fonctionnalités Communautaires

| Composant | Fonctionnalité | Statut |
|-----------|----------------|--------|
| CommunityActivityFeed.js | Flux d'activités | Actif |
| CommunityStats.js | Statistiques communautaires | Actif |
| social/group-rides/ | Planification de sorties | Actif |
| challenges/ | Défis communautaires | Actif |
| community/ | Fonctions sociales diverses | Actif |

## 3. Nouvelle Structure Standardisée

```
/server/data/
  /cols/
    cols-index.json             # Index unifié de tous les cols
    /enriched/                  # Un fichier par col enrichi
      angliru.json
      bonette.json
      galibier.json
      mont-ventoux.json
      stelvio.json
      ...
  /nutrition/
    nutrition-plans.json        # Fichier original pour compatibilité
    /plans/                     # Un fichier par plan nutritionnel
      plan-endurance.json
      plan-intensite.json
      plan-recuperation.json
      plan-haute-montagne.json  # Nouveau plan
      ...
    /recipes/                   # Un répertoire pour toutes les recettes
      /pre-ride/                # Organisées par catégorie
      /during-ride/
      /post-ride/
      /special/                 # Recettes spéciales (cols, longues distances)
  /training/
    training-plans.json         # Fichier original pour compatibilité
    /plans/                     # Un fichier par plan d'entraînement
      preparation-cyclosportive.json
      puissance-aerobie.json
      preparation-montagne.json
      recuperation-active.json
      plan-haute-montagne.json  # Format standardisé
      plan-ventoux.json         # Nouveau plan
      plan-angliru.json         # Nouveau plan
      ...
    /workouts/                  # Séances d'entraînement individuelles
      /hiit/                    # Workouts HIIT
      /endurance/               # Séances d'endurance
      /strength/                # Renforcement musculaire
  /skills/                      # Nouveau module
    techniques-descente.json
    ...
  /community/                   # Données communautaires
    challenges.json             # Défis prédéfinis
    events.json                 # Événements cyclistes
```

## 4. Procédure de Migration et Vérification

### 4.1 Migration des cols

1. **Extraction** : Extraire chaque col enrichi dans un fichier individuel
   - Identifier les doublons à l'aide des ID et de la position géographique
   - Conserver la version la plus complète en cas de conflit
   - Normaliser selon le format de référence (bonette.json)

2. **Conversion JavaScript vers JSON** :
   - Extraire les données des fichiers JS du frontend
   - Normaliser le format pour correspondre au modèle de référence
   - Fusion avec les données existantes pour éviter les doublons

3. **Vérification** :
   - Validation du schéma JSON pour chaque col
   - Contrôle d'intégrité des données (altitude, coordonnées, etc.)
   - Test d'affichage dans l'interface

4. **Indexation** :
   - Création d'un index unifié pointant vers tous les cols

### 4.2 Migration des plans nutritionnels et recettes

1. **Extraction** : Extraire chaque plan dans un fichier individuel
2. **Extraction des recettes JavaScript** : Convertir toutes les recettes JS en JSON
3. **Organisation** : Structurer les recettes selon leur catégorie et moment de consommation
4. **Format standard** : Normaliser selon le modèle établi
5. **Rétrocompatibilité** : Maintenir le fichier agrégé pour les fonctions existantes

### 4.3 Migration des plans d'entraînement et workouts

1. **Format unifié** : Standardiser le format de tous les plans
2. **Extraction JavaScript vers JSON** : Convertir tous les plans et workouts JS en JSON
3. **Organisation** : Structurer selon le type (plan, workout) et la catégorie
4. **Extraction** : Extraire chaque plan dans un fichier individuel
5. **Rétrocompatibilité** : Maintenir le fichier agrégé pour les fonctions existantes

## 5. Suivi de la Migration

| Catégorie | Total avant | Extraits | Validés | Indexés | Statut |
|-----------|-------------|----------|---------|---------|--------|
| Cols | 72 | 0 | 0 | 0 | Non commencé |
| Plans nutritionnels et recettes | 23+ | 0 | 0 | 0 | Non commencé |
| Plans d'entraînement et workouts | 28+ | 0 | 0 | 0 | Non commencé |
| Compétences | 0 | 0 | 0 | 0 | Non applicable |

## 6. Tests et Validation

Pour chaque catégorie de contenu, les tests suivants seront effectués :

1. **Tests unitaires** : Validation du format et de l'intégrité des données
2. **Tests d'intégration** : Vérification du chargement correct dans les services
3. **Tests d'interface** : Vérification de l'affichage correct dans le frontend

## 7. Calendrier de Mise en Œuvre

| Phase | Tâche | Date de début | Date de fin | Statut |
|-------|-------|---------------|------------|--------|
| 1 | Migration des cols | 07/04/2025 | 14/04/2025 | Non commencé |
| 2 | Migration des plans nutritionnels et recettes | 15/04/2025 | 18/04/2025 | Non commencé |
| 3 | Migration des plans d'entraînement et workouts | 19/04/2025 | 22/04/2025 | Non commencé |
| 4 | Tests et validation | 23/04/2025 | 26/04/2025 | Non commencé |
| 5 | Déploiement | 27/04/2025 | 27/04/2025 | Non commencé |

## 8. Liste de Vérification Finale

- [ ] Tous les cols sont extraits en fichiers individuels
- [ ] Tous les doublons sont résolus
- [ ] L'index unifié est créé et fonctionnel
- [ ] Toutes les recettes sont migrées et organisées
- [ ] Tous les plans nutritionnels sont standardisés
- [ ] Tous les plans d'entraînement et workouts sont standardisés
- [ ] Les fichiers originaux sont préservés pour la rétrocompatibilité
- [ ] Tous les tests sont passés avec succès
- [ ] La documentation est mise à jour
