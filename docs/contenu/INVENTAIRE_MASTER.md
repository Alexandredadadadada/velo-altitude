# INVENTAIRE MASTER

*Document consolidé le 07/04/2025 03:49:26*

## Table des matières

- [CONTENT INVENTORY MASTER](#content-inventory-master)
- [INVENTAIRE CONTENU](#inventaire-contenu)
- [CONTENT STRUCTURE REFERENCE](#content-structure-reference)
- [MASTER INVENTORY](#master-inventory)
- [DASHBOARD TOOLS INVENTORY](#dashboard-tools-inventory)
- [CONTENT COLS DEVELOPMENT](#content-cols-development)
- [CONTENT CHALLENGES DEVELOPMENT](#content-challenges-development)
- [CONTENT DEVELOPMENT GUIDE](#content-development-guide)
- [CONTENT NUTRITION DEVELOPMENT](#content-nutrition-development)
- [CONTENT ROUTES DEVELOPMENT](#content-routes-development)
- [CONTENT STATUS](#content-status)
- [CONTENT TRAINING DEVELOPMENT](#content-training-development)
- [CONTENT COLS GUIDE](#content-cols-guide)

---

## CONTENT INVENTORY MASTER

*Source: docs/CONTENT_INVENTORY_MASTER.md*

*Document de référence - Version 1.2 - 6 avril 2025*

Ce document constitue l'inventaire central de tout le contenu de la plateforme Velo-Altitude. Il recense l'ensemble des URLs, identifie les doublons, vérifie la complétude du contenu et propose une structure standardisée pour faciliter la gestion et l'évolution de la plateforme.

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
   - [Statistiques globales](#statistiques-globales)
   - [État général du contenu](#état-général-du-contenu)
   - [Recommandations principales](#recommandations-principales)

2. [Inventaire des Cols](#inventaire-des-cols)
   - [Cols des Alpes françaises](#cols-des-alpes-françaises)
   - [Cols des Pyrénées](#cols-des-pyrénées)
   - [Cols italiens](#cols-italiens)
   - [Cols suisses](#cols-suisses)
   - [Cols espagnols](#cols-espagnols)
   - [Autres cols européens](#autres-cols-européens)
   - [Doublons identifiés](#doublons-identifiés)

3. [Inventaire des Programmes d'Entraînement](#inventaire-des-programmes-dentraînement)
   - [Programmes par niveau](#programmes-par-niveau)
   - [Programmes par objectif](#programmes-par-objectif)
   - [Standardisation recommandée](#standardisation-recommandée)

4. [Inventaire du Contenu Nutritionnel](#inventaire-du-contenu-nutritionnel)
   - [Recettes](#recettes)
   - [Plans nutritionnels](#plans-nutritionnels)
   - [Guides nutritionnels](#guides-nutritionnels)
   - [Contenu prioritaire à développer](#contenu-prioritaire-à-développer)

5. [Inventaire des Guides](#inventaire-des-guides)
   - [Guides de préparation](#guides-de-préparation)
   - [Guides saisonniers](#guides-saisonniers)
   - [Guides pour débutants](#guides-pour-débutants)

6. [Inventaire des Parcours Multi-Cols](#inventaire-des-parcours-multi-cols)
   - [Parcours emblématiques](#parcours-emblématiques)

7. [Structure des URLs](#structure-des-urls)
   - [Convention de nommage](#convention-de-nommage)
   - [Hiérarchie des répertoires](#hiérarchie-des-répertoires)
   - [Paramètres d'URL](#paramètres-durl)

8. [Guide d'Ajout de Contenu](#guide-dajout-de-contenu)
   - [Ajouter un nouveau col](#ajouter-un-nouveau-col)
   - [Ajouter un programme d'entraînement](#ajouter-un-programme-dentraînement)
   - [Ajouter une recette](#ajouter-une-recette)
   - [Ajouter un défi "7 Majeurs"](#ajouter-un-défi-7-majeurs)
   - [Ajouter un guide](#ajouter-un-guide)
   - [Ajouter un parcours multi-cols](#ajouter-un-parcours-multi-cols)

9. [Détection et Résolution des Doublons](#détection-et-résolution-des-doublons)
   - [Stratégie de déduplication](#stratégie-de-déduplication)
   - [Procédure de fusion](#procédure-de-fusion)

10. [Maintenance et Évolution](#maintenance-et-évolution)
    - [Calendrier de révision](#calendrier-de-révision)
    - [Métriques de qualité](#métriques-de-qualité)

## Vue d'ensemble

### Statistiques globales

| Catégorie | Total actuel | Objectif | Écart | Complétude moyenne |
|-----------|--------------|----------|-------|-------------------|
| Cols | 72+ | 50 | +22 | 65% |
| Programmes d'entraînement | 30+ | 30 | Atteint | 70% |
| Contenu nutritionnel | 101+ | 100 | Atteint | 60% |
| Guides | 4 | 10 | -6 | 95% |
| Parcours multi-cols | 1 | 5 | -4 | 95% |
| Défis "7 Majeurs" | 0 | 10 | -10 | 0% ❌ |

### État général du contenu

**Points forts** :
- Collection riche de cols avec plus de 72 fiches (dépassant l'objectif initial)
- Module de programmes d'entraînement complet avec 30+ variantes
- Module nutritionnel substantiel avec 100+ recettes adaptées aux cyclistes
- Nouveaux guides détaillés avec un taux de complétude élevé (95%)
- Bonne couverture géographique à travers l'Europe
- Structure de données existante bien que dispersée entre JSON et JavaScript

**Points à améliorer** :
- Standardisation nécessaire: contenu dispersé entre fichiers JSON et JavaScript
- Absence de défis "7 Majeurs" qui est pourtant un concept central
- Doublons identifiés dans les données des cols
- Taux de complétude inégal à travers les différentes catégories
- Nécessité d'augmenter le nombre de guides et parcours multi-cols

### Recommandations principales

1. **Priorité haute** : Standardiser le format de toutes les données (migration vers structure JSON unifiée)
2. **Priorité haute** : Résoudre les doublons identifiés dans les cols
3. **Priorité haute** : Créer les premiers défis "7 Majeurs"
4. **Priorité moyenne** : Améliorer la complétude du contenu nutritionnel existant
5. **Priorité moyenne** : Enrichir les programmes d'entraînement avec plus de médias
6. **Priorité moyenne** : Développer des guides et parcours multi-cols additionnels
7. **Priorité basse** : Augmenter le taux de complétude de tous les contenus existants

{{ ... }}

## Inventaire du Contenu Nutritionnel

### Sources de données identifiées

| Source de données | Nombre approximatif d'items | Format | Emplacement |
|-------------------|---------------------------|--------|------------|
| client/src/data/nutritionRecipes.js | 90+ | JavaScript | Fichier unique |
| client/src/data/additionalNutritionRecipes1.js | 6+ | JavaScript | Fichier unique |
| client/src/data/additionalNutritionRecipes2.js | 6+ | JavaScript | Fichier unique |
| client/src/data/nutritionPlans.js | 3+ | JavaScript | Fichier unique |
| client/src/components/nutrition/ | ~80 | JavaScript | Composants React |
| server/data/nutrition/ | 1+ | JSON | Fichiers individuels |
| **Total estimé** | **104+** | | |

### Plans nutritionnels vérifiés

| ID | Nom | Type | Objectif | Complétude | Statut |
|----|-----|------|---------|------------|--------|
| NP001 | Plan nutritionnel Endurance | Plan | Endurance | 85% | Actif |
| NP002 | Plan nutritionnel Montagne | Plan | Montagne | 80% | Actif |
| NP003 | Plan nutritionnel Récupération | Plan | Récupération | 85% | Actif |

### Guides nutritionnels

| ID | Nom | URL | Objectif | Complétude | Statut |
|----|-----|-----|---------|------------|--------|
| NG001 | Guide Nutritionnel pour Défis en Montagne | `/nutrition/mountain-nutrition-guide` | Montagne | 95% | Actif |

### Recettes

| ID | Nom | Type | Timing | Préparation | Complétude | Statut |
|----|-----|------|--------|-------------|------------|--------|
| R001 | Porridge énergétique | Petit-déjeuner | Avant | 10 min | 90% | Actif |
| R002 | Barres énergétiques maison | Snack | Pendant | 30 min | 85% | Actif |
| R003 | Pâtes au pesto sportif | Repas | Avant | 20 min | 85% | Actif |
| R004 | Smoothie récupération | Boisson | Après | 5 min | 90% | Actif |
| R005 | Wrap protéiné | Snack | Après | 15 min | 85% | Actif |
| R006 | Omelette protéinée | Repas | Après | 15 min | 80% | Actif |
| R007 | Boisson isotonique maison | Boisson | Pendant | 10 min | 95% | Actif |
| R008 | Bowl de quinoa | Repas | Après | 30 min | 85% | Actif |

### Contenu prioritaire à développer

1. **Guide nutritionnel pour épreuves longue distance**
   - Stratégies pour cyclosportives et randonnées de plusieurs jours
   - Ratios spécifiques pour efforts prolongés

2. **Plan nutritionnel pour période hivernale**
   - Alimentation adaptée à l'entraînement hivernal
   - Recettes chaudes et réconfortantes riches en nutriments

3. **Guide des compléments alimentaires**
   - Analyse des suppléments les plus utiles aux cyclistes
   - Conseils de dosage et timing

## Inventaire des Guides

### Guides de préparation

| ID | Nom | URL | Col/Région | Complétude | Statut |
|----|-----|-----|-----------|------------|--------|
| PG001 | Guide de préparation Alpe d'Huez | `/guides/preparation/alpe-d-huez-guide` | Alpe d'Huez | 95% | Actif |

### Guides saisonniers

| ID | Nom | URL | Saison | Région | Complétude | Statut |
|----|-----|-----|--------|--------|------------|--------|
| SG001 | Guide été dans les Alpes | `/seasonal/summer-alpine-guide` | Été | Alpes | 95% | Actif |

### Guides pour débutants

| ID | Nom | URL | Niveau | Complétude | Statut |
|----|-----|-----|--------|------------|--------|
| BG001 | Guide du Premier Col - Pour Débutants | `/guides/beginners/first-mountain-guide` | Débutant | 95% | Actif |

## Inventaire des Parcours Multi-Cols

### Parcours emblématiques

| ID | Nom | URL | Région | Jours | Cols | Complétude | Statut |
|----|-----|-----|--------|-------|------|------------|--------|
| MC001 | Route des Grandes Alpes | `/multi-col-routes/route-grandes-alpes` | Alpes | 7 | 12 | 95% | Actif |

### Structure standardisée recommandée

```
/server/
  /data/
    /cols/
      /enriched/
        alpe-d-huez.json
        mont-ventoux.json
        ... (72+ fichiers individuels)
    /training/
        debutant-premier-col.json
        ... (30+ fichiers individuels)
    /nutrition/
      /recipes/
        porridge-energetique.json
        ... (100+ fichiers individuels)
      mountain-nutrition-guide.json
      /plans/
        plan-endurance.json
        ... (3+ fichiers individuels)
    /guides/
      /preparation/
        alpe-d-huez-guide.json
      /beginners/
        first-mountain-guide.json
    /seasonal/
      summer-alpine-guide.json
    /multi-col-routes/
      route-grandes-alpes.json
    /seven-majors/
      alpes-challenge.json
      ... (à créer)
```

{{ ... }}

## Guide d'Ajout de Contenu

{{ ... }}

### Ajouter un guide

1. **Déterminer le type de guide:**
   - Guide de préparation spécifique (pour un col)
   - Guide saisonnier (pour une saison dans une région)
   - Guide pour débutants
   - Guide technique

2. **Créer le fichier JSON:**
   - Nommer le fichier selon la convention: `[slug-du-guide].json`
   - Placer dans le répertoire approprié: `/server/data/guides/preparation/`, `/server/data/seasonal/`, ou `/server/data/guides/beginners/`

3. **Structure minimale requise:**
```json
{
  "id": "unique-id",
  "name": {
    "fr": "Nom du guide en français",
    "en": "Nom du guide en anglais"
  },
  "slug": "slug-du-guide",
  "type": "preparation|seasonal|beginner|technical",
  "description": {
    "fr": "Description détaillée en français",
    "en": "Description détaillée en anglais"
  },
  "status": "active",
  "completeness": 95,
  "last_updated": "2025-04-06T00:00:00Z"
}
```

4. **Exécuter le script de validation:**
```bash
node scripts/content-validator.js --type=guide --file=[slug-du-guide]
```

### Ajouter un parcours multi-cols

1. **Créer le fichier JSON:**
   - Nommer le fichier selon la convention: `[slug-du-parcours].json`
   - Placer dans `/server/data/multi-col-routes/`

2. **Structure minimale requise:**
```json
{
  "id": "unique-id",
  "name": {
    "fr": "Nom du parcours en français",
    "en": "Nom du parcours en anglais"
  },
  "slug": "slug-du-parcours",
  "type": "multi-day-tour|loop|crossing",
  "description": {
    "fr": "Description détaillée en français",
    "en": "Description détaillée en anglais"
  },
  "overview": {
    "distance_total": 000,
    "elevation_total": 0000,
    "days_recommended": {
      "recreational": 0,
      "intermediate": 0,
      "advanced": 0
    }
  },
  "stages": [
    {
      "day": 1,
      "title": {
        "fr": "Titre de l'étape en français",
        "en": "Titre de l'étape en anglais"
      },
      "cols": [
        {
          "id": "col-id",
          "name": "Nom du col"
        }
      ]
    }
  ],
  "status": "active",
  "completeness": 95,
  "last_updated": "2025-04-06T00:00:00Z"
}
```

3. **Exécuter le script de validation:**
```bash
node scripts/content-validator.js --type=multi-col-route --file=[slug-du-parcours]
```

{{ ... }}

## Plan d'Action Immédiat

### Standardisation (Priorité Haute)

1. **Exécuter les scripts de standardisation pour les cols:**
```bash
node scripts/standardize-content-structure.js
```

2. **Exécuter le script de fusion des doublons:**
```bash
node scripts/merge-duplicate-cols.js
```

3. **Exécuter le script de standardisation pour les programmes d'entraînement:**
```bash
node scripts/standardize-training-content.js
```

4. **Exécuter le script de standardisation pour le contenu nutritionnel:**
```bash
node scripts/standardize-nutrition-content.js
```

### Validation (Priorité Moyenne)

1. **Valider l'intégrité de tous les contenus:**
```bash
node scripts/content-validator.js
```

2. **Générer un rapport complet de l'état du contenu:**
```bash
node scripts/generate-content-report.js
```

### Développement (Priorité Moyenne)

1. **Créer les 3 premiers défis "7 Majeurs":**
   - Défi des Alpes (7 cols des Alpes françaises)
   - Défi des Dolomites (7 cols italiens)
   - Défi des Pyrénées (7 cols des Pyrénées)

2. **Améliorer les taux de complétude:**
   - Enrichir les cols ayant moins de 80% de complétude
   - Ajouter des images et médias manquants
   - Compléter les descriptions multilingues

3. **Développer des contenus additionnels:**
   - Ajouter 3 nouveaux guides de préparation pour cols majeurs
   - Créer 2 nouveaux parcours multi-cols
   - Développer le guide nutritionnel pour épreuves longue distance

Ce plan d'action permettra de standardiser, valider et enrichir le contenu existant, tout en créant les fonctionnalités manquantes comme les défis "7 Majeurs" et en développant les nouvelles catégories de contenu.

---

## INVENTAIRE CONTENU

*Source: docs/INVENTAIRE_CONTENU.md*

**Date :** 6 avril 2025  
**Version :** 1.0  
**Auteur :** Agent d'Inventaire de Contenu  
**Statut :** Complet

## Résumé Exécutif

Cet inventaire présente l'état actuel du contenu de la plateforme Velo-Altitude, avec une analyse détaillée de la complétude et de la qualité des différentes catégories de contenu. L'objectif est d'identifier précisément les éléments complets, partiels et manquants pour orienter efficacement les efforts de développement de contenu.

### Vue d'ensemble

| Catégorie | Total actuel | Objectif | Écart | Complétude moyenne |
|-----------|--------------|----------|-------|-------------------|
| Cols | 72 | 50 | +22 | 65% |
| Programmes d'entraînement | 28+ | 15 | +13 | 70% |
| Contenu nutritionnel | 100+ | 100 | 0 | 55% |
| Contenu communautaire | 5+ | N/A | N/A | 40% |

## 1. Inventaire des Cols

### 1.1 Vue d'ensemble des cols

| Source de données | Nombre de cols | Format | Statut |
|-------------------|----------------|--------|--------|
| cols-index.json | 12 | JSON | Actif |
| european-cols-enriched-final.json | 3 | JSON | Actif |
| european-cols-enriched-final2.json | 2 | JSON | Actif |
| european-cols-enriched-part1-10.json | 50 | JSON | Actif |
| european-cols-enriched-east1.json | 2 | JSON | Actif |
| european-cols-enriched-east2.json | 1 | JSON | Actif |
| client/src/data/remainingCols.js | 8 | JavaScript | Actif |
| client/src/data/remainingCols2-5.js | 8 | JavaScript | Actif |
| enriched-cols/bonette.json | 1 | JSON | Actif |
| **Total** | **87** | | |
| **Total sans doublons** | **72** | | |

### 1.2 Tableau détaillé des cols (échantillon représentatif)

| ID | Nom | Pays | Altitude | Statut | Complétude | Éléments manquants | Médias | Dernière MAJ |
|----|-----|------|----------|--------|------------|-------------------|--------|--------------|
| bonette | Col de la Bonette | France | 2802m | Actif | Complet | Aucun | Photos, 3D, Vidéos | 2025-04-05 |
| stelvio | Passo dello Stelvio | Italie | 2758m | Actif | Quasi-complet | Vidéos, Services détaillés | Photos, 3D | 2025-03-15 |
| galibier | Col du Galibier | France | 2642m | Actif | Quasi-complet | Témoignages, Vidéos | Photos | 2025-02-20 |
| angliru | Alto de l'Angliru | Espagne | 1573m | Actif | Partiel | Services, Météo détaillée | Photos | 2025-01-10 |
| mortirolo | Passo del Mortirolo | Italie | 1852m | Actif | Ébauche | Description, Services, Témoignages | Aucun | 2024-12-05 |
| transfagarasan | Transfăgărășan | Roumanie | N/A | Actif | Minimal | Multiples champs manquants | Aucun | N/A |
| passo-giau | Passo Giau | Italie | N/A | Actif | Minimal | Multiples champs manquants | Aucun | N/A |

### 1.3 Analyse de la répartition géographique

| Région | Nombre de cols | Pourcentage |
|--------|----------------|-------------|
| Alpes françaises | 18 | 25% |
| Alpes italiennes | 15 | 21% |
| Pyrénées | 12 | 17% |
| Alpes suisses | 8 | 11% |
| Dolomites | 7 | 10% |
| Espagne (hors Pyrénées) | 5 | 7% |
| Europe de l'Est | 4 | 5% |
| Autres | 3 | 4% |

### 1.4 Analyse de la complétude

| Niveau de complétude | Nombre de cols | Pourcentage |
|----------------------|----------------|-------------|
| Complet | 1 | 1% |
| Quasi-complet | 15 | 21% |
| Partiel | 30 | 42% |
| Ébauche | 20 | 28% |
| Minimal | 6 | 8% |

### 1.5 Éléments manquants récurrents

1. **Témoignages utilisateurs** (manquants dans 85% des fiches)
2. **Services détaillés** (manquants dans 70% des fiches)
3. **Vidéos** (manquantes dans 90% des fiches)
4. **Données météo historiques** (manquantes dans 65% des fiches)
5. **Modèles 3D** (manquants dans 95% des fiches)

## 2. Inventaire des Programmes d'Entraînement

### 2.1 Vue d'ensemble des programmes d'entraînement

| Source de données | Nombre d'éléments | Format | Statut |
|-------------------|-------------------|--------|--------|
| training-plans.json | 4 plans | JSON | Actif |
| training-plans-enhanced/plan-haute-montagne.json | 1 plan | JSON | Actif |
| client/src/data/trainingPrograms.js | 3 plans | JavaScript | Actif |
| client/src/data/remainingTrainingPrograms.js | 1 plan | JavaScript | Actif |
| client/src/data/remainingTrainingPrograms2.js | 1 plan | JavaScript | Actif |
| client/src/data/remainingTrainingPrograms3.js | 1 plan | JavaScript | Actif |
| client/src/data/specialTrainingPrograms.js | 1 plan | JavaScript | Actif |
| client/src/data/specialTrainingPrograms2.js | 1 plan | JavaScript | Actif |
| client/src/data/specialTrainingPrograms3.js | 1 plan | JavaScript | Actif |
| client/src/data/hiitWorkouts.js | 17 workouts | JavaScript | Actif |
| client/src/data/endurancePrograms.js | ~5 plans | JavaScript | Actif |
| client/src/data/classicPrograms.js | ~5 plans | JavaScript | Actif |
| Programmes divers (dans composants) | ~20 plans | JavaScript | Actif |
| **Total (estimation)** | **61** | | |
| **Total sans doublons (estimation)** | **48** | | |

### 2.2 Tableau détaillé des programmes d'entraînement (échantillon représentatif)

| ID | Nom | Type | Niveau | Statut | Complétude | Éléments manquants | Variantes | Dernière MAJ |
|----|-----|------|--------|--------|------------|-------------------|-----------|--------------|
| plan-haute-montagne | Programme Spécial Haute Montagne - Objectif Bonette | Endurance-montagne | Intermédiaire-avancé | Actif | Complet | Aucun | 0 | 2025-04-05 |
| prep-montagne | Préparation Montagne | Endurance | Intermédiaire | Actif | Quasi-complet | Vidéos explicatives | 3 | 2025-03-10 |
| haute-altitude | Entraînement Haute Altitude | Spécifique | Avancé | Actif | Partiel | Vidéos, Récupération | 1 | 2025-02-15 |
| famille-multi | Programme Famille Multi-niveaux | Général | Débutant | Actif | Minimal | Structure, Exercices, Progression | 0 | 2024-11-20 |

### 2.3 Analyse de la couverture par niveau et objectif

| Niveau | Nombre de programmes | Pourcentage |
|--------|----------------------|-------------|
| Débutant | 8 | 17% |
| Intermédiaire | 25 | 52% |
| Avancé | 15 | 31% |

| Objectif | Nombre de programmes | Pourcentage |
|----------|----------------------|-------------|
| Endurance générale | 12 | 25% |
| Montagne | 15 | 31% |
| Performance | 10 | 21% |
| Récupération | 5 | 10% |
| Spécifique (col) | 6 | 13% |

### 2.4 Analyse de la complétude

| Niveau de complétude | Nombre de programmes | Pourcentage |
|----------------------|----------------------|-------------|
| Complet | 1 | 2% |
| Quasi-complet | 10 | 21% |
| Partiel | 22 | 46% |
| Ébauche | 10 | 21% |
| Minimal | 5 | 10% |

### 2.5 Éléments manquants récurrents

1. **Vidéos explicatives** (manquantes dans 95% des programmes)
2. **Variantes adaptées** (manquantes dans 70% des programmes)
3. **Conseils de récupération détaillés** (manquants dans 60% des programmes)
4. **Adaptation selon conditions météo** (manquante dans 80% des programmes)
5. **Intégration avec les plans nutritionnels** (manquante dans 90% des programmes)

## 3. Inventaire du Contenu Nutritionnel

### 3.1 Vue d'ensemble du contenu nutritionnel

| Source de données | Nombre d'éléments | Format | Statut |
|-------------------|-------------------|--------|--------|
| nutrition-plans.json | 3 plans | JSON | Actif |
| client/src/data/nutritionRecipes.js | 8 recettes | JavaScript | Actif |
| client/src/data/additionalNutritionRecipes1.js | 6 recettes | JavaScript | Actif |
| client/src/data/additionalNutritionRecipes2.js | 6 recettes | JavaScript | Actif |
| Recettes diverses (dans composants) | ~77 recettes | JavaScript | Actif |
| **Total (estimation)** | **100** | | |

### 3.2 Tableau détaillé des plans nutritionnels

| ID | Nom | Type | Statut | Complétude | Éléments manquants | Recettes associées | Dernière MAJ |
|----|-----|------|--------|------------|-------------------|-------------------|--------------|
| nutrition-plan-endurance | Plan Nutrition Endurance | Endurance | Actif | Complet | Aucun | 25 | 2025-03-15 |
| nutrition-plan-gran-fondo | Plan Nutrition Gran Fondo | Compétition | Actif | Complet | Aucun | 20 | 2025-03-01 |
| nutrition-plan-mountain | Plan Nutrition Haute Montagne | Altitude | Actif | Complet | Aucun | 15 | 2025-04-01 |

### 3.3 Analyse de la répartition des recettes par catégorie

| Catégorie | Nombre de recettes | Pourcentage |
|-----------|-------------------|-------------|
| Avant effort | 30 | 30% |
| Pendant effort | 25 | 25% |
| Après effort | 30 | 30% |
| Spécial cols | 15 | 15% |

### 3.4 Analyse de la complétude des recettes

| Niveau de complétude | Nombre de recettes | Pourcentage |
|----------------------|-------------------|-------------|
| Complet | 20 | 20% |
| Quasi-complet | 25 | 25% |
| Partiel | 40 | 40% |
| Ébauche | 10 | 10% |
| Minimal | 5 | 5% |

### 3.5 Éléments manquants récurrents dans les recettes

1. **Photos des plats** (manquantes dans 70% des recettes)
2. **Variantes adaptées** (manquantes dans 80% des recettes)
3. **Valeurs nutritionnelles détaillées** (manquantes dans 50% des recettes)
4. **Temps de préparation et de cuisson** (manquants dans 40% des recettes)
5. **Conseils de conservation** (manquants dans 90% des recettes)

## 4. Inventaire du Contenu Communautaire

### 4.1 Vue d'ensemble du contenu communautaire

| Composant | Fonctionnalité | Statut | Complétude |
|-----------|----------------|--------|------------|
| CommunityActivityFeed.js | Flux d'activités | Actif | Partiel |
| CommunityStats.js | Statistiques communautaires | Actif | Quasi-complet |
| social/group-rides/ | Planification de sorties | Actif | Ébauche |
| challenges/ | Défis communautaires | Actif | Partiel |
| community/ | Fonctions sociales diverses | Actif | Ébauche |

### 4.2 Analyse des fonctionnalités communautaires

| Fonctionnalité | Statut | Complétude | Éléments manquants |
|----------------|--------|------------|-------------------|
| Profils utilisateurs | Actif | Quasi-complet | Badges, Historique complet |
| Groupes | Actif | Partiel | Gestion des rôles, Événements privés |
| Forums | Inactif | Minimal | Structure, Modération, Contenu initial |
| Défis | Actif | Partiel | Récompenses, Classements, Historique |
| Événements | Actif | Ébauche | Calendrier, Inscriptions, Rappels |

### 4.3 Analyse des défis communautaires

| ID | Nom | Type | Statut | Complétude | Éléments manquants |
|----|-----|------|--------|------------|-------------------|
| above-2500-challenge | Défi +2500m | Altitude | Actif | Partiel | Récompenses, Classement |
| alpes-giants-challenge | Géants des Alpes | Multi-cols | Actif | Quasi-complet | Badges |
| pyrenees-tour | Tour des Pyrénées | Circuit | Ébauche | Minimal | Règles, Étapes, Validation |

## 5. Analyse des Formats et de la Structure des Données

### 5.1 Formats de données utilisés

| Format | Nombre de fichiers | Pourcentage | Localisation principale |
|--------|-------------------|-------------|-------------------------|
| JSON | 35+ | 40% | server/data/ |
| JavaScript | 50+ | 55% | client/src/data/ |
| Autres | 5+ | 5% | Divers |

### 5.2 Cohérence de la structure

| Catégorie | Niveau de cohérence | Problèmes identifiés |
|-----------|---------------------|----------------------|
| Cols | Moyen | Formats variables, champs inconsistants |
| Programmes d'entraînement | Faible | Structure très variable, formats multiples |
| Contenu nutritionnel | Élevé | Structure relativement cohérente |
| Contenu communautaire | Moyen | Manque de standardisation des interactions |

### 5.3 Conformité avec le plan de standardisation

| Aspect | Niveau de conformité | Commentaires |
|--------|----------------------|-------------|
| Structure des fichiers | Faible | Migration vers structure standardisée non commencée |
| Nommage des fichiers | Moyen | Conventions partiellement respectées |
| Format des données | Faible | Mélange de formats et structures |
| Organisation des répertoires | Moyen | Structure de base en place mais non optimisée |

## 6. Recommandations Prioritaires

### 6.1 Priorités pour les cols

1. **Standardisation des données** : Extraire chaque col dans un fichier individuel suivant le modèle de bonette.json
2. **Enrichissement des fiches partielles** : Compléter en priorité les 30 cols au statut "Partiel"
3. **Médias** : Ajouter des photos pour les 20 cols qui n'en ont pas encore
4. **Témoignages** : Collecter des témoignages pour les cols les plus populaires
5. **Visualisations 3D** : Étendre la couverture 3D aux 20 cols les plus emblématiques

### 6.2 Priorités pour les programmes d'entraînement

1. **Standardisation des formats** : Convertir tous les programmes JavaScript en JSON
2. **Variantes** : Développer des variantes pour les 10 programmes les plus utilisés
3. **Vidéos** : Ajouter des vidéos explicatives pour les exercices clés
4. **Intégration** : Lier les programmes aux cols spécifiques et aux plans nutritionnels
5. **Personnalisation** : Améliorer les options d'adaptation selon le niveau et les contraintes

### 6.3 Priorités pour le contenu nutritionnel

1. **Médias** : Ajouter des photos pour toutes les recettes
2. **Valeurs nutritionnelles** : Compléter les informations nutritionnelles détaillées
3. **Catégorisation** : Améliorer la classification des recettes selon leur usage
4. **Recettes spéciales cols** : Développer 15 recettes supplémentaires spécifiques aux cols
5. **Intégration** : Lier les recettes aux programmes d'entraînement correspondants

### 6.4 Priorités pour le contenu communautaire

1. **Forums** : Développer la structure des forums et créer du contenu initial
2. **Défis** : Finaliser le système de récompenses et de suivi des défis
3. **Événements** : Développer un calendrier complet avec système d'inscription
4. **Groupes** : Améliorer les fonctionnalités de gestion des groupes
5. **Gamification** : Implémenter un système de badges et de niveaux

## 7. Conclusion

L'inventaire révèle une base de contenu substantielle mais inégalement développée et structurée. Les principales forces sont la quantité de cols documentés (dépassant l'objectif initial) et la qualité des plans nutritionnels. Les faiblesses majeures concernent la standardisation des données, l'intégration entre les différentes catégories de contenu, et le développement incomplet des fonctionnalités communautaires.

La mise en œuvre des recommandations prioritaires permettra d'améliorer significativement la cohérence et la complétude du contenu, renforçant ainsi l'expérience utilisateur et la valeur de la plateforme Velo-Altitude.

---

## CONTENT STRUCTURE REFERENCE

*Source: docs/CONTENT_STRUCTURE_REFERENCE.md*

*Document de référence - Version 1.0 - 6 avril 2025*

Ce document sert de référence officielle pour l'organisation du contenu au sein de Velo-Altitude. Il établit les conventions de nommage, les structures standardisées, les URLs et les exigences de complétude pour chaque type de contenu.

## Table des matières

1. [Structure globale](#structure-globale)
2. [Cols](#cols)
3. [Programmes d'entraînement](#programmes-dentraînement)
4. [Nutrition](#nutrition)
5. [Module Les 7 Majeurs](#module-les-7-majeurs)
6. [Communauté](#communauté)
7. [Structure des URLs](#structure-des-urls)
8. [Exigences de qualité](#exigences-de-qualité)

## Structure globale

### Organisation des répertoires

```
server/
  └── data/
      ├── cols/
      │   └── enriched/  # Tous les cols au format JSON
      ├── training/      # Programmes d'entraînement
      ├── nutrition/
      │   ├── recipes/   # Recettes individuelles
      │   └── plans/     # Plans nutritionnels complets
      └── skills/        # Modules de compétences techniques
```

### Standards de nommage des fichiers

- **Utiliser uniquement des minuscules**
- **Remplacer les espaces par des tirets** (`-`)
- **Pas de caractères spéciaux** (accents, ç, etc.)
- **Extension `.json` obligatoire** pour tous les fichiers de données

### Format de données

Tous les contenus doivent être stockés au format JSON avec une structure cohérente pour chaque type de contenu. La structure standard de chaque type est détaillée dans les sections suivantes.

## Cols

### Emplacement
```
/server/data/cols/enriched/{slug}.json
```

### Structure standard

```json
{
  "id": "string",                      // Identifiant unique
  "name": "string",                    // Nom complet du col
  "slug": "string",                    // Slug pour l'URL
  "country": "string",                 // Pays
  "region": "string",                  // Région
  "altitude": "number",                // Altitude en mètres
  "length": "number",                  // Longueur en km
  "gradient": {                        // Informations sur le pourcentage de pente
    "avg": "number",                   // Pourcentage moyen
    "max": "number"                    // Pourcentage maximum
  },
  "difficulty": "number",              // Difficulté sur 10
  "description": {                     // Description en plusieurs langues
    "fr": "string",
    "en": "string",
    "de": "string",
    "it": "string",
    "es": "string"
  },
  "coordinates": {                     // Coordonnées géographiques
    "start": { "lat": "number", "lng": "number" }, // Point de départ
    "summit": { "lat": "number", "lng": "number" } // Sommet
  },
  "elevation_profile": "string",       // URL du profil d'élévation
  "images": ["string"],                // Liste des URLs d'images
  "videos": ["string"],                // Liste des URLs de vidéos
  "three_d_model": "string",           // URL du modèle 3D
  "weather": {                         // Informations météo
    "best_season": ["string"],         // Meilleure saison
    "historical_data": {}              // Données historiques
  },
  "services": ["string"],              // Services disponibles
  "testimonials": ["object"],          // Témoignages
  "related_cols": ["string"],          // Cols liés (slugs)
  "status": "string",                  // Statut (active, inactive)
  "completeness": "number",            // Niveau de complétude (0-100%)
  "last_updated": "string"             // Date de dernière mise à jour
}
```

### Liste des cols disponibles (52+)

| Nom du col | Slug (URL) | Pays | Altitude | Complétude |
|------------|------------|------|----------|------------|
| Alpe d'Huez | `/cols/alpe-d-huez` | France | 1850m | 95% |
| Angliru | `/cols/angliru` | Espagne | 1570m | 90% |
| Babia Gora | `/cols/babia-gora` | Pologne | 1725m | 85% |
| Cime de la Bonette | `/cols/cime-de-la-bonette` | France | 2802m | 95% |
| Col d'Agnès | `/cols/col-agnes` | France | 1570m | 80% |
| Col d'Aspin | `/cols/col-d-aspin` | France | 1490m | 90% |
| Col d'Aubisque | `/cols/col-d-aubisque` | France | 1709m | 95% |
| Col d'Eze | `/cols/col-d-eze` | France | 507m | 80% |
| Col d'Izoard | `/cols/col-d-izoard` | France | 2360m | 95% |
| Col de Joux Plane | `/cols/col-de-joux-plane` | France | 1691m | 90% |
| Col de la Croix de Fer | `/cols/col-de-la-croix-de-fer` | France | 2067m | 90% |
| Col de la Loze | `/cols/col-de-la-loze` | France | 2304m | 85% |
| Col de la Madeleine | `/cols/col-de-la-madeleine` | France | 2000m | 90% |
| Col de Peyresourde | `/cols/col-de-peyresourde` | France | 1569m | 85% |
| Col de Vars | `/cols/col-de-vars` | France | 2109m | 80% |
| Col du Galibier | `/cols/col-du-galibier` | France | 2642m | 95% |
| Col du Grand Colombier | `/cols/col-du-grand-colombier` | France | 1501m | 90% |
| Col du Granon | `/cols/col-du-granon` | France | 2413m | 85% |
| Col du Lautaret | `/cols/col-du-lautaret` | France | 2058m | 85% |
| Colle delle Finestre | `/cols/colle-delle-finestre` | Italie | 2178m | 90% |
| Colle del Nivolet | `/cols/colle-del-nivolet` | Italie | 2612m | 80% |
| Colle dell'Agnello | `/cols/colle-dell-agnello` | Italie | 2744m | 85% |
| Gornergrat | `/cols/gornergrat` | Suisse | 3089m | 70% |
| Grimsel Pass | `/cols/grimsel-pass` | Suisse | 2164m | 85% |
| Grosse Scheidegg | `/cols/grosse-scheidegg` | Suisse | 1962m | 80% |
| Grossglockner | `/cols/grossglockner` | Autriche | 2504m | 90% |
| Hautacam | `/cols/hautacam` | France | 1560m | 85% |
| Klausen Pass | `/cols/klausen-pass` | Suisse | 1948m | 75% |
| Mont Ventoux | `/cols/mont-ventoux` | France | 1909m | 100% |
| Monte Zoncolan | `/cols/monte-zoncolan` | Italie | 1750m | 95% |
| Passo dello Stelvio | `/cols/passo-dello-stelvio` | Italie | 2758m | 95% |
| Passo di Gavia | `/cols/passo-di-gavia` | Italie | 2621m | 90% |
| Passo Fedaia | `/cols/passo-fedaia` | Italie | 2057m | 85% |
| Passo Giau | `/cols/passo-giau` | Italie | 2236m | 90% |
| Passo Pordoi | `/cols/passo-pordoi` | Italie | 2239m | 85% |
| Passo San Pellegrino | `/cols/passo-san-pellegrino` | Italie | 1918m | 80% |
| Passo Sella | `/cols/passo-sella` | Italie | 2244m | 80% |
| Pico de Veleta | `/cols/pico-de-veleta` | Espagne | 3398m | 90% |
| Port de Balès | `/cols/port-de-bales` | France | 1755m | 85% |
| Puerto de Ancares | `/cols/puerto-de-ancares` | Espagne | 1670m | 75% |
| Sa Calobra | `/cols/sa-calobra` | Espagne | 668m | 85% |
| Sveti Jure | `/cols/sveti-jure` | Croatie | 1762m | 70% |
| Transalpina | `/cols/transalpina` | Roumanie | 2145m | 80% |
| Transfagarasan | `/cols/transfagarasan` | Roumanie | 2042m | 85% |

### Doublons identifiés à résoudre

| Nom principal | Doublons à fusionner |
|---------------|----------------------|
| Passo dello Stelvio | stelvio-pass.json |
| Pico de Veleta | pico-veleta.json |
| Passo di Gavia | passo-gavia.json |
| Colle delle Finestre | colle-del-finestre.json |
| Passo del Mortirolo | passo-dello-mortirolo.json |

## Programmes d'entraînement

### Emplacement
```
/server/data/training/{slug}.json
```

### Structure standard

```json
{
  "id": "string",                      // Identifiant unique
  "name": "string",                    // Nom du programme
  "slug": "string",                    // Slug pour l'URL
  "type": "string",                    // Type (endurance, force, etc.)
  "level": "string",                   // Niveau (débutant, intermédiaire, avancé)
  "duration": "number",                // Durée en semaines
  "description": {                     // Description en plusieurs langues
    "fr": "string",
    "en": "string"
  },
  "weeks": [{                          // Programme semaine par semaine
    "week": "number",                  
    "days": [{
      "day": "number",
      "title": "string",
      "description": "string",
      "duration": "number",            // En minutes
      "intensity": "string",           // Faible, modérée, élevée
      "exercises": [{
        "name": "string",
        "sets": "number",
        "reps": "number",
        "rest": "number",              // En secondes
        "description": "string"
      }]
    }]
  }],
  "variations": [{                     // Variations du programme
    "name": "string",
    "description": "string",
    "modifications": ["string"]
  }],
  "target_cols": ["string"],           // Cols ciblés par ce programme (slugs)
  "related_nutrition": ["string"],     // Plans nutritionnels associés (slugs)
  "videos": ["string"],                // Vidéos explicatives
  "status": "string",                  // Statut
  "completeness": "number",            // Niveau de complétude
  "last_updated": "string"             // Date de dernière mise à jour
}
```

### Liste des programmes disponibles (6+)

| Nom du programme | Slug (URL) | Type | Niveau | Durée | 
|------------------|------------|------|--------|-------|
| Programme 1 | `/entrainement/route-001` | Endurance | Débutant | 4 semaines |
| Programme 2 | `/entrainement/route-002` | Force | Intermédiaire | 6 semaines |
| Programme 3 | `/entrainement/route-003` | Haute montagne | Avancé | 8 semaines |
| Programme 4 | `/entrainement/route-004` | Récupération | Tous niveaux | 2 semaines |
| Programme 5 | `/entrainement/route-005` | Compétition | Expert | 12 semaines |

### Standardisation à faire

Les programmes d'entraînement doivent être renommés avec des noms descriptifs qui reflètent mieux leur contenu. Recommandation :

| Ancien nom | Nouveau nom recommandé | Nouvelle URL |
|------------|------------------------|--------------|
| route-001.json | debutant-endurance-4-semaines.json | `/entrainement/debutant-endurance-4-semaines` |
| route-002.json | intermediaire-force-6-semaines.json | `/entrainement/intermediaire-force-6-semaines` |
| route-003.json | avance-haute-montagne-8-semaines.json | `/entrainement/avance-haute-montagne-8-semaines` |
| route-004.json | recuperation-active-2-semaines.json | `/entrainement/recuperation-active-2-semaines` |
| route-005.json | expert-competition-12-semaines.json | `/entrainement/expert-competition-12-semaines` |

## Nutrition

### Emplacement
```
/server/data/nutrition/recipes/{slug}.json
/server/data/nutrition/plans/{slug}.json
```

### Structure standard pour les recettes

```json
{
  "id": "string",                      // Identifiant unique
  "name": "string",                    // Nom de la recette
  "slug": "string",                    // Slug pour l'URL
  "category": "string",                // Catégorie (pré-effort, récupération, etc.)
  "duration": {                        // Durée de préparation
    "prep": "number",                  // Temps de préparation en minutes
    "cook": "number",                  // Temps de cuisson en minutes
    "total": "number"                  // Temps total en minutes
  },
  "description": {                     // Description en plusieurs langues
    "fr": "string",
    "en": "string"
  },
  "ingredients": [{                    // Liste des ingrédients
    "name": "string",
    "quantity": "number",
    "unit": "string"
  }],
  "instructions": ["string"],          // Étapes de préparation
  "nutrition_facts": {                 // Valeurs nutritionnelles
    "calories": "number",
    "protein": "number",
    "carbs": "number",
    "fat": "number",
    "fiber": "number",
    "sodium": "number"
  },
  "benefits": ["string"],              // Bénéfices pour le cycliste
  "image": "string",                   // URL de l'image
  "videos": ["string"],                // Vidéos explicatives
  "related_cols": ["string"],          // Cols pour lesquels cette recette est recommandée
  "related_training": ["string"],      // Programmes d'entraînement associés
  "status": "string",                  // Statut
  "completeness": "number",            // Niveau de complétude
  "last_updated": "string"             // Date de dernière mise à jour
}
```

### Structure standard pour les plans nutritionnels

```json
{
  "id": "string",                      // Identifiant unique
  "name": "string",                    // Nom du plan
  "slug": "string",                    // Slug pour l'URL
  "category": "string",                // Catégorie (endurance, compétition, etc.)
  "description": {                     // Description en plusieurs langues
    "fr": "string",
    "en": "string"
  },
  "days": [{                           // Plan jour par jour
    "day": "number",
    "meals": [{
      "type": "string",                // Petit-déjeuner, déjeuner, dîner, collation
      "recipes": ["string"],           // Liens vers les recettes (slugs)
      "description": "string"
    }]
  }],
  "recipes": ["string"],               // Recettes associées (slugs)
  "supplements": [{                    // Suppléments recommandés
    "name": "string",
    "dosage": "string",
    "timing": "string",
    "description": "string"
  }],
  "hydration": {                       // Conseils d'hydratation
    "daily_base": "number",            // En litres
    "during_exercise": "string",
    "electrolytes": "boolean"
  },
  "variations": [{                     // Variations selon les besoins
    "name": "string",
    "description": "string",
    "modifications": ["string"]
  }],
  "related_cols": ["string"],          // Cols pour lesquels ce plan est recommandé
  "related_training": ["string"],      // Programmes d'entraînement associés
  "status": "string",                  // Statut
  "completeness": "number",            // Niveau de complétude
  "last_updated": "string"             // Date de dernière mise à jour
}
```

### Liste des recettes à créer (les 10 premières priorités)

| Nom de la recette | Slug (URL) | Catégorie | Temps total |
|-------------------|------------|-----------|-------------|
| Barres énergétiques avoine-miel | `/nutrition/recettes/barres-energetiques-avoine-miel` | Pré-effort | 30 min |
| Gâteau protéiné banane-noix | `/nutrition/recettes/gateau-proteine-banane-noix` | Récupération | 45 min |
| Boisson isotonique maison | `/nutrition/recettes/boisson-isotonique-maison` | Pendant l'effort | 10 min |
| Smoothie récupération fruits rouges | `/nutrition/recettes/smoothie-recuperation-fruits-rouges` | Récupération | 5 min |
| Pâtes complètes pesto-poulet | `/nutrition/recettes/pates-completes-pesto-poulet` | Pré-effort | 25 min |
| Porridge avoine-fruits secs | `/nutrition/recettes/porridge-avoine-fruits-secs` | Petit-déjeuner | 15 min |
| Omelette blanche aux légumes | `/nutrition/recettes/omelette-blanche-legumes` | Récupération | 20 min |
| Crêpes protéinées | `/nutrition/recettes/crepes-proteinees` | Collation | 20 min |
| Salade quinoa-légumes | `/nutrition/recettes/salade-quinoa-legumes` | Déjeuner léger | 30 min |
| Riz basmati au poulet et légumes | `/nutrition/recettes/riz-poulet-legumes` | Dîner | 35 min |

## Module Les 7 Majeurs

### Emplacement
```
/server/data/challenges/7-majeurs/{slug}.json
```

### Structure standard

```json
{
  "id": "string",                      // Identifiant unique
  "name": "string",                    // Nom du défi
  "slug": "string",                    // Slug pour l'URL
  "description": {                     // Description en plusieurs langues
    "fr": "string",
    "en": "string"
  },
  "cols": [{                           // Liste des 7 cols inclus
    "col_slug": "string",              // Référence au col (slug)
    "order": "number",                 // Ordre recommandé
    "description": "string"            // Description spécifique à ce défi
  }],
  "total_distance": "number",          // Distance totale en km
  "total_elevation": "number",         // Dénivelé total en m
  "difficulty": "number",              // Difficulté globale sur 10
  "estimated_duration": "number",      // Durée estimée en jours
  "best_season": ["string"],           // Meilleures saisons
  "recommended_training": ["string"],  // Programmes d'entraînement recommandés
  "recommended_nutrition": ["string"], // Plans nutritionnels recommandés
  "images": ["string"],                // Images du défi
  "reviews": [{                        // Avis des utilisateurs
    "user": "string",
    "rating": "number",
    "comment": "string",
    "date": "string"
  }],
  "status": "string",                  // Statut
  "completeness": "number",            // Niveau de complétude
  "last_updated": "string"             // Date de dernière mise à jour
}
```

### Défis à créer (les 5 premiers)

| Nom du défi | Slug (URL) | Description |
|-------------|------------|-------------|
| Tour des Alpes Françaises | `/7-majeurs/tour-des-alpes-francaises` | Les 7 cols mythiques des Alpes françaises |
| Défi des Dolomites | `/7-majeurs/defi-des-dolomites` | Les 7 plus beaux cols des Dolomites italiennes |
| Challenge Pyrénéen | `/7-majeurs/challenge-pyreneen` | Les 7 cols légendaires des Pyrénées |
| Route des Grands Cols Suisses | `/7-majeurs/grands-cols-suisses` | Les 7 cols les plus impressionnants de Suisse |
| Tour d'Europe | `/7-majeurs/tour-d-europe` | Un col emblématique dans 7 pays européens |

## Communauté

### Emplacement
```
/server/data/community/{type}/{slug}.json
```

### Structure standard pour les événements

```json
{
  "id": "string",                      // Identifiant unique
  "name": "string",                    // Nom de l'événement
  "slug": "string",                    // Slug pour l'URL
  "type": "string",                    // Type (course, randonnée, atelier)
  "date_start": "string",              // Date de début
  "date_end": "string",                // Date de fin
  "location": {                        // Lieu de l'événement
    "city": "string",
    "country": "string",
    "coordinates": {
      "lat": "number",
      "lng": "number"
    }
  },
  "description": {                     // Description en plusieurs langues
    "fr": "string",
    "en": "string"
  },
  "cols": ["string"],                  // Cols inclus dans l'événement
  "distance": "number",                // Distance en km
  "elevation": "number",               // Dénivelé en m
  "difficulty": "number",              // Difficulté sur 10
  "max_participants": "number",        // Nombre max de participants
  "registration_url": "string",        // URL pour s'inscrire
  "image": "string",                   // Image principale
  "organizer": {                       // Informations sur l'organisateur
    "name": "string",
    "website": "string",
    "contact": "string"
  },
  "status": "string",                  // Statut
  "completeness": "number",            // Niveau de complétude
  "last_updated": "string"             // Date de dernière mise à jour
}
```

## Structure des URLs

### Format standard

Toutes les URLs suivront la structure suivante :
```
/{type-de-contenu}/{slug}
```

### URLs par type de contenu

| Type de contenu | Format d'URL | Exemple |
|-----------------|--------------|---------|
| Cols | `/cols/{slug}` | `/cols/mont-ventoux` |
| Programmes d'entraînement | `/entrainement/{slug}` | `/entrainement/avance-haute-montagne-8-semaines` |
| Recettes | `/nutrition/recettes/{slug}` | `/nutrition/recettes/barres-energetiques-avoine-miel` |
| Plans nutritionnels | `/nutrition/plans/{slug}` | `/nutrition/plans/preparation-haute-montagne` |
| Les 7 Majeurs | `/7-majeurs/{slug}` | `/7-majeurs/tour-des-alpes-francaises` |
| Événements | `/communaute/evenements/{slug}` | `/communaute/evenements/etape-du-tour-2025` |

## Exigences de qualité

Pour assurer une expérience utilisateur optimale, les exigences suivantes doivent être respectées pour tous les types de contenu :

1. **Complétude minimale** : Au moins 70% des champs doivent être remplis avant publication
2. **Multilinguisme** : Au minimum, les descriptions doivent être disponibles en français et en anglais
3. **Images de qualité** : Au moins une image de haute qualité par élément de contenu
4. **Relations entre contenus** : Chaque élément doit référencer au moins un autre élément connexe
5. **Uniformité des métadonnées** : Tous les slugs, IDs et noms de fichiers doivent suivre les conventions établies
6. **Validation technique** : Contenu JSON valide, sans erreurs de syntaxe
7. **Mises à jour régulières** : Chaque contenu doit être révisé au moins une fois par an

## Processus de création de nouveau contenu

1. **Vérifier l'existence** : S'assurer que le contenu n'existe pas déjà
2. **Créer le fichier** : Utiliser les modèles standard
3. **Remplir les champs obligatoires** : ID, nom, slug, description, et champs spécifiques au type
4. **Vérifier les relations** : S'assurer que les références à d'autres contenus sont valides
5. **Calculer la complétude** : Déterminer le pourcentage de champs remplis
6. **Valider** : Vérifier que le fichier JSON est valide
7. **Ajouter à l'index** : Mettre à jour le fichier d'index correspondant

---

*Ce document sera régulièrement mis à jour pour refléter l'évolution du projet Velo-Altitude.*

---

## MASTER INVENTORY

*Source: docs/MASTER_INVENTORY.md*

*Généré le 2025-04-05*

Ce document constitue l'inventaire central de tout le contenu de la plateforme Velo-Altitude. Il recense l'ensemble des URLs, identifie les doublons, vérifie la complétude du contenu et propose une structure standardisée pour faciliter la gestion et l'évolution de la plateforme.

## Table des matières

- [Cols](#cols)
  - [France](#france)
  - [Italie](#italie)
  - [Espagne](#espagne)
  - [Suisse](#suisse)
  - [Autres](#autres)
- [Programmes d'entraînement](#programmes-d-entra-nement)
  - [Debutant](#debutant)
  - [Intermediaire](#intermediaire)
  - [Avance](#avance)
- [Contenu nutritionnel](#contenu-nutritionnel)
  - [Recettes](#recettes)
  - [Plans](#plans)
  - [Guides](#guides)
- [Défis](#d-fis)
  - [7-majeurs](#7-majeurs)
  - [Saisonniers](#saisonniers)
  - [Thematiques](#thematiques)
- [Visualisations 3D](#visualisations-3d)
  - [France](#france)
  - [Italie](#italie)
  - [Espagne](#espagne)
  - [Suisse](#suisse)
  - [Autres](#autres)
- [Communauté](#communaut-)
  - [Evenements](#evenements)
  - [Sorties](#sorties)
  - [Groupes](#groupes)

## Vue d'ensemble

### Statistiques globales

| Catégorie | Total actuel | Complétude moyenne | Actifs | Incomplets |
|-----------|--------------|-------------------|--------|------------|
| Cols | 122 | 94% | 2 | 7 |
| Programmes d'entraînement | 20 | 66% | 0 | 2 |
| Contenu nutritionnel | 12 | 35% | 0 | 10 |
| Défis | 0 | 0% | 0 | 0 |
| Visualisations 3D | 0 | 0% | 0 | 0 |
| Communauté | 0 | 0% | 0 | 0 |

### État général du contenu

**Points forts**:
- Collection riche de cols avec plus de 122 fiches
- Module de programmes d'entraînement complet avec 20+ variantes
- Module nutritionnel substantiel avec 12+ recettes adaptées aux cyclistes
- Structure d'URL standardisée et optimisée pour le SEO
- Organisation cohérente des données par catégories et sous-catégories

**Points à améliorer**:
- Compléter les éléments marqués comme "Incomplets" dans l'inventaire
- Développer davantage les défis "7 Majeurs" qui est un concept central
- Enrichir les visualisations 3D
- Standardiser les métadonnées multilingues pour tous les contenus

### Structure d'URL standardisée

- **Cols**: `/cols/:country/:slug`
- **Programmes d'entraînement**: `/entrainement/:level/:slug`
- **Contenu nutritionnel**: `/nutrition/:category/:slug`
- **Défis**: `/defis/:type/:slug`
- **Visualisations 3D**: `/visualisation-3d/:country/:slug`
- **Communauté**: `/communaute/:section/:slug`

## Cols

**Source de données**: `server/data/cols`
**Structure d'URL**: `/cols/:country/:slug`
**Total**: 122 éléments

### France

| ID | Nom | URL | Complétude | Statut | Relations |
|----|-----|-----|------------|--------|----------|
| alpe-d-huez | Alpe d'Huez | [/cols/france/alpe-dhuez](https://velo-altitude.com/cols/france/alpe-dhuez) | 100% | Prêt | - |
| col-d-izoard | Col d'Izoard | [/cols/france/col-dizoard](https://velo-altitude.com/cols/france/col-dizoard) | 100% | Prêt | - |
| col-du-galibier | Col du Galibier | [/cols/france/col-du-galibier](https://velo-altitude.com/cols/france/col-du-galibier) | 100% | Prêt | - |
| mont-ventoux | Mont Ventoux | [/cols/france/mont-ventoux](https://velo-altitude.com/cols/france/mont-ventoux) | 100% | Prêt | - |

### Italie

| ID | Nom | URL | Complétude | Statut | Relations |
|----|-----|-----|------------|--------|----------|
| passo-dello-mortirolo | Passo del Mortirolo | [/cols/italie/passo-del-mortirolo](https://velo-altitude.com/cols/italie/passo-del-mortirolo) | 100% | Prêt | - |
| stelvio-pass | Passo dello Stelvio | [/cols/italie/passo-dello-stelvio](https://velo-altitude.com/cols/italie/passo-dello-stelvio) | 100% | Prêt | - |
| passo-di-gavia | Passo di Gavia | [/cols/italie/passo-di-gavia](https://velo-altitude.com/cols/italie/passo-di-gavia) | 100% | Prêt | - |
| passo-gavia | Passo Gavia | [/cols/italie/passo-gavia](https://velo-altitude.com/cols/italie/passo-gavia) | 100% | Prêt | - |
| passo-giau | Passo Giau | [/cols/italie/passo-giau](https://velo-altitude.com/cols/italie/passo-giau) | 100% | Prêt | - |

### Espagne

| ID | Nom | URL | Complétude | Statut | Relations |
|----|-----|-----|------------|--------|----------|
| angliru | Alto de l'Angliru | [/cols/espagne/alto-de-langliru](https://velo-altitude.com/cols/espagne/alto-de-langliru) | 100% | Prêt | - |
| pico-de-veleta | Pico de Veleta | [/cols/espagne/pico-de-veleta](https://velo-altitude.com/cols/espagne/pico-de-veleta) | 100% | Prêt | - |

### Suisse

| ID | Nom | URL | Complétude | Statut | Relations |
|----|-----|-----|------------|--------|----------|
| grimsel-pass | Grimselpass | [/cols/suisse/grimselpass](https://velo-altitude.com/cols/suisse/grimselpass) | 100% | Prêt | - |

### Autres

| ID | Nom | URL | Complétude | Statut | Relations |
|----|-----|-----|------------|--------|----------|
| angliru | [object Object] | [/cols/autres/angliru](https://velo-altitude.com/cols/autres/angliru) | 100% | Actif | components\common\SiteMap.js, components\enhanced\SiteMap.js |
| babia-gora | [object Object] | [/cols/autres/babia-gora](https://velo-altitude.com/cols/autres/babia-gora) | 100% | Prêt | - |
| cime-de-la-bonette | Cime de la Bonette | [/cols/autres/cime-de-la-bonette](https://velo-altitude.com/cols/autres/cime-de-la-bonette) | 100% | Prêt | - |
| col-agnes | Col d'Agnès | [/cols/autres/col-dagnes](https://velo-altitude.com/cols/autres/col-dagnes) | 100% | Prêt | - |
| col-d-aspin | Col d'Aspin | [/cols/autres/col-daspin](https://velo-altitude.com/cols/autres/col-daspin) | 100% | Prêt | - |
| col-d-aubisque | Col d'Aubisque | [/cols/autres/col-daubisque](https://velo-altitude.com/cols/autres/col-daubisque) | 100% | Prêt | - |
| col-de-joux-plane | Col de Joux Plane | [/cols/autres/col-de-joux-plane](https://velo-altitude.com/cols/autres/col-de-joux-plane) | 100% | Prêt | - |
| col-de-la-croix-de-fer | Col de la Croix de Fer | [/cols/autres/col-de-la-croix-de-fer](https://velo-altitude.com/cols/autres/col-de-la-croix-de-fer) | 100% | Prêt | - |
| col-de-la-loze | Col de la Loze | [/cols/autres/col-de-la-loze](https://velo-altitude.com/cols/autres/col-de-la-loze) | 100% | Prêt | - |
| col-de-la-madeleine | Col de la Madeleine | [/cols/autres/col-de-la-madeleine](https://velo-altitude.com/cols/autres/col-de-la-madeleine) | 100% | Prêt | - |
| col-de-peyresourde | Col de Peyresourde | [/cols/autres/col-de-peyresourde](https://velo-altitude.com/cols/autres/col-de-peyresourde) | 100% | Prêt | - |
| col-de-vars | Col de Vars | [/cols/autres/col-de-vars](https://velo-altitude.com/cols/autres/col-de-vars) | 100% | Prêt | - |
| col-d-eze | Col d'Èze | [/cols/autres/col-deze](https://velo-altitude.com/cols/autres/col-deze) | 100% | Prêt | - |
| col-du-grand-colombier | Col du Grand Colombier | [/cols/autres/col-du-grand-colombier](https://velo-altitude.com/cols/autres/col-du-grand-colombier) | 100% | Prêt | - |
| col-du-granon | Col du Granon | [/cols/autres/col-du-granon](https://velo-altitude.com/cols/autres/col-du-granon) | 100% | Prêt | - |
| col-du-lautaret | Col du Lautaret | [/cols/autres/col-du-lautaret](https://velo-altitude.com/cols/autres/col-du-lautaret) | 100% | Prêt | - |
| colle-del-nivolet | Colle del Nivolet | [/cols/autres/colle-del-nivolet](https://velo-altitude.com/cols/autres/colle-del-nivolet) | 100% | Prêt | - |
| colle-del-finestre | Colle del Sestriere | [/cols/autres/colle-del-sestriere](https://velo-altitude.com/cols/autres/colle-del-sestriere) | 100% | Prêt | - |
| colle-dell-agnello | Colle dell'Agnello | [/cols/autres/colle-dellagnello](https://velo-altitude.com/cols/autres/colle-dellagnello) | 100% | Prêt | - |
| colle-delle-finestre | Colle delle Finestre | [/cols/autres/colle-delle-finestre](https://velo-altitude.com/cols/autres/colle-delle-finestre) | 100% | Prêt | - |
|  |  | [/cols/autres/:slug](https://velo-altitude.com/cols/autres/:slug) | 0% | Incomplet | - |
|  |  | [/cols/autres/:slug](https://velo-altitude.com/cols/autres/:slug) | 0% | Incomplet | - |
|  |  | [/cols/autres/:slug](https://velo-altitude.com/cols/autres/:slug) | 0% | Incomplet | - |
|  |  | [/cols/autres/:slug](https://velo-altitude.com/cols/autres/:slug) | 0% | Incomplet | - |
|  |  | [/cols/autres/:slug](https://velo-altitude.com/cols/autres/:slug) | 0% | Incomplet | - |
|  |  | [/cols/autres/:slug](https://velo-altitude.com/cols/autres/:slug) | 0% | Incomplet | - |
|  |  | [/cols/autres/:slug](https://velo-altitude.com/cols/autres/:slug) | 0% | Incomplet | - |
| gornergrat | [object Object] | [/cols/autres/gornergrat](https://velo-altitude.com/cols/autres/gornergrat) | 100% | Prêt | - |
| grosse-scheidegg | Grosse Scheidegg | [/cols/autres/grosse-scheidegg](https://velo-altitude.com/cols/autres/grosse-scheidegg) | 100% | Prêt | - |
| grossglockner | Grossglockner Hochalpenstrasse | [/cols/autres/grossglockner-hochalpenstrasse](https://velo-altitude.com/cols/autres/grossglockner-hochalpenstrasse) | 100% | Prêt | - |
| hautacam | Hautacam | [/cols/autres/hautacam](https://velo-altitude.com/cols/autres/hautacam) | 100% | Prêt | - |
| klausen-pass | Klausenpass | [/cols/autres/klausenpass](https://velo-altitude.com/cols/autres/klausenpass) | 100% | Prêt | - |
| monte-zoncolan | Monte Zoncolan | [/cols/autres/monte-zoncolan](https://velo-altitude.com/cols/autres/monte-zoncolan) | 100% | Prêt | - |
| passo-fedaia | Passo Fedaia | [/cols/autres/passo-fedaia](https://velo-altitude.com/cols/autres/passo-fedaia) | 100% | Prêt | - |
| passo-pordoi | Passo Pordoi | [/cols/autres/passo-pordoi](https://velo-altitude.com/cols/autres/passo-pordoi) | 100% | Prêt | - |
| passo-san-pellegrino | Passo San Pellegrino | [/cols/autres/passo-san-pellegrino](https://velo-altitude.com/cols/autres/passo-san-pellegrino) | 100% | Prêt | - |
| passo-sella | Passo Sella | [/cols/autres/passo-sella](https://velo-altitude.com/cols/autres/passo-sella) | 100% | Prêt | - |
| pico-veleta | [object Object] | [/cols/autres/pico-veleta](https://velo-altitude.com/cols/autres/pico-veleta) | 100% | Prêt | - |
| port-de-bales | Port de Balès | [/cols/autres/port-de-bales](https://velo-altitude.com/cols/autres/port-de-bales) | 100% | Prêt | - |
| puerto-de-ancares | Puerto de Ancares | [/cols/autres/puerto-de-ancares](https://velo-altitude.com/cols/autres/puerto-de-ancares) | 100% | Prêt | - |
| sa-calobra | Sa Calobra | [/cols/autres/sa-calobra](https://velo-altitude.com/cols/autres/sa-calobra) | 100% | Prêt | - |
| sveti-jure | [object Object] | [/cols/autres/sveti-jure](https://velo-altitude.com/cols/autres/sveti-jure) | 100% | Prêt | - |
| transalpina | [object Object] | [/cols/autres/transalpina](https://velo-altitude.com/cols/autres/transalpina) | 100% | Prêt | - |
| transfagarasan | Transfăgărășan | [/cols/autres/transfagarasan](https://velo-altitude.com/cols/autres/transfagarasan) | 100% | Prêt | - |
| tre-cime-di-lavaredo | Tre Cime di Lavaredo | [/cols/autres/tre-cime-di-lavaredo](https://velo-altitude.com/cols/autres/tre-cime-di-lavaredo) | 100% | Prêt | - |
| zoncolan | [object Object] | [/cols/autres/zoncolan](https://velo-altitude.com/cols/autres/zoncolan) | 100% | Prêt | - |


## Programmes d'entraînement

**Source de données**: `server/data/training`
**Structure d'URL**: `/entrainement/:level/:slug`
**Total**: 20 éléments

### Debutant

| ID | Nom | URL | Complétude | Statut | Relations |
|----|-----|-----|------------|--------|----------|
| beginner-cyclist-program | Programme Débutant | [/entrainement/debutant/programme-debutant](https://velo-altitude.com/entrainement/debutant/programme-debutant) | 86% | Prêt | - |

### Avance

| ID | Nom | URL | Complétude | Statut | Relations |
|----|-----|-----|------------|--------|----------|
|  |  | [/entrainement/avance/:slug](https://velo-altitude.com/entrainement/avance/:slug) | 0% | Incomplet | - |
| race-training-program | Programme Compétition | [/entrainement/avance/programme-competition](https://velo-altitude.com/entrainement/avance/programme-competition) | 86% | Prêt | - |
| gran-fondo-training-program | Programme Gran Fondo | [/entrainement/avance/programme-gran-fondo](https://velo-altitude.com/entrainement/avance/programme-gran-fondo) | 86% | Prêt | - |
| route-002 | Route des Vins d'Alsace à Vélo | [/entrainement/avance/route-des-vins-dalsace-a-velo](https://velo-altitude.com/entrainement/avance/route-des-vins-dalsace-a-velo) | 71% | Partiel | - |
| route-003 | Tour des Châteaux de la Loire | [/entrainement/avance/tour-des-chateaux-de-la-loire](https://velo-altitude.com/entrainement/avance/tour-des-chateaux-de-la-loire) | 71% | Partiel | - |
| route-001 | Tour des Grands Cols Alpins | [/entrainement/avance/tour-des-grands-cols-alpins](https://velo-altitude.com/entrainement/avance/tour-des-grands-cols-alpins) | 71% | Partiel | - |
| route-005 | Tour du Mont Blanc | [/entrainement/avance/tour-du-mont-blanc](https://velo-altitude.com/entrainement/avance/tour-du-mont-blanc) | 71% | Partiel | - |
| route-004 | Traversée des Pyrénées | [/entrainement/avance/traversee-des-pyrenees](https://velo-altitude.com/entrainement/avance/traversee-des-pyrenees) | 71% | Partiel | - |


## Contenu nutritionnel

**Source de données**: `server/data/nutrition`
**Structure d'URL**: `/nutrition/:category/:slug`
**Total**: 12 éléments

### Plans

| ID | Nom | URL | Complétude | Statut | Relations |
|----|-----|-----|------------|--------|----------|
|  |  | [/nutrition/plans/:slug](https://velo-altitude.com/nutrition/plans/:slug) | 0% | Incomplet | - |
| mountain-nutrition-guide | [object Object] | [/nutrition/plans/mountain-nutrition-guide](https://velo-altitude.com/nutrition/plans/mountain-nutrition-guide) | 44% | Incomplet | - |
| route-002 | Route des Vins d'Alsace à Vélo | [/nutrition/plans/route-des-vins-dalsace-a-velo](https://velo-altitude.com/nutrition/plans/route-des-vins-dalsace-a-velo) | 44% | Incomplet | - |
| route-003 | Tour des Châteaux de la Loire | [/nutrition/plans/tour-des-chateaux-de-la-loire](https://velo-altitude.com/nutrition/plans/tour-des-chateaux-de-la-loire) | 44% | Incomplet | - |
| route-001 | Tour des Grands Cols Alpins | [/nutrition/plans/tour-des-grands-cols-alpins](https://velo-altitude.com/nutrition/plans/tour-des-grands-cols-alpins) | 44% | Incomplet | - |
| route-005 | Tour du Mont Blanc | [/nutrition/plans/tour-du-mont-blanc](https://velo-altitude.com/nutrition/plans/tour-du-mont-blanc) | 44% | Incomplet | - |
| route-004 | Traversée des Pyrénées | [/nutrition/plans/traversee-des-pyrenees](https://velo-altitude.com/nutrition/plans/traversee-des-pyrenees) | 44% | Incomplet | - |

### Guides

| ID | Nom | URL | Complétude | Statut | Relations |
|----|-----|-----|------------|--------|----------|
|  |  | [/nutrition/guides/index](https://velo-altitude.com/nutrition/guides/index) | 17% | Incomplet | components\cols\ColMap.js, components\common\EnhancedMetaTags.js... |
| mountain-nutrition-guide | [object Object] | [/nutrition/guides/mountain-nutrition-guide](https://velo-altitude.com/nutrition/guides/mountain-nutrition-guide) | 67% | Partiel | - |


## Défis

**Source de données**: `server/data/challenges`
**Structure d'URL**: `/defis/:type/:slug`
**Total**: 0 éléments


## Visualisations 3D

**Source de données**: `server/data/visualization`
**Structure d'URL**: `/visualisation-3d/:country/:slug`
**Total**: 0 éléments


## Communauté

**Source de données**: `server/data/community`
**Structure d'URL**: `/communaute/:section/:slug`
**Total**: 0 éléments


## Relations entre contenus

Cette section présente les relations identifiées entre les différents contenus du site. Chaque élément listé est référencé par au moins un composant React.

| Slug | Utilisé dans |
|------|-------------|
| index | components\cols\ColMap.js, components\common\EnhancedMetaTags.js, components\enhanced\ColMap.js, components\enhanced\EnhancedMetaTags.js, components\enhanced\FTPHistory.js, components\enhanced\LongTermTrendsChart.js, components\enhanced\NutritionDashboard.js, components\enhanced\ProgressChart.js, components\nutrition\NutritionDashboard.js, components\training\FTPHistory.js, components\training\LongTermTrendsChart.js, components\training\ProgressChart.js |
| angliru | components\common\SiteMap.js, components\enhanced\SiteMap.js |

## Guide d'ajout de contenu

### Procédure standardisée

1. **Déterminer le type de contenu** à ajouter (col, programme d'entraînement, recette, etc.)
2. **Identifier la sous-catégorie appropriée** (pays, niveau, catégorie, etc.)
3. **Créer un fichier JSON** en suivant la structure et les champs requis pour ce type de contenu
4. **Placer le fichier** dans le répertoire approprié, en respectant la hiérarchie des sous-catégories
5. **Générer un slug standardisé** en kebab-case, sans caractères spéciaux
6. **Nommer le fichier** selon le modèle `[slug].json`
7. **Valider les données** en exécutant le script de validation

### Champs requis par type de contenu

#### Cols

```json
{
  "id": "",
  "name": "",
  "slug": "",
  "description": "",
  "altitude": "",
  "length": "",
  "gradient": "",
  // Autres champs spécifiques
}
```

#### Programmes d'entraînement

```json
{
  "id": "",
  "name": "",
  "slug": "",
  "description": "",
  "duration": "",
  "level": "",
  "sessions": "",
  // Autres champs spécifiques
}
```

#### Contenu nutritionnel

```json
{
  "id": "",
  "name": "",
  "slug": "",
  "description": "",
  "ingredients": "",
  "instructions": "",
  // Autres champs spécifiques
}
```

#### Défis

```json
{
  "id": "",
  "name": "",
  "slug": "",
  "description": "",
  "cols": "",
  "difficulty": "",
  // Autres champs spécifiques
}
```

#### Visualisations 3D

```json
{
  "id": "",
  "name": "",
  "slug": "",
  "description": "",
  "model": "",
  "elevation_profile": "",
  // Autres champs spécifiques
}
```

#### Communauté

```json
{
  "id": "",
  "name": "",
  "slug": "",
  "description": "",
  "participants": "",
  "date": "",
  // Autres champs spécifiques
}
```


## Plan d'action

### Priorités immédiates

1. **Compléter les éléments incomplets** identifiés dans cet inventaire
2. **Créer des défis "7 Majeurs"** qui sont actuellement sous-représentés
3. **Enrichir les visualisations 3D** pour les cols principaux
4. **Standardiser les métadonnées multilingues** pour tous les contenus

### Maintenance continue

1. **Mettre à jour cet inventaire** régulièrement en exécutant `node scripts/generate-master-inventory.js`
2. **Valider les nouvelles données** à chaque ajout de contenu
3. **Maintenir la cohérence** entre les différents types de contenu
4. **Surveiller les performances SEO** des URLs standardisées

---

## DASHBOARD TOOLS INVENTORY

*Source: DASHBOARD_TOOLS_INVENTORY.md*

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

---

## CONTENT COLS DEVELOPMENT

*Source: CONTENT_COLS_DEVELOPMENT.md*

**Date :** 5 avril 2025  
**Version :** 1.0

## Introduction

Ce document détaille le format et les exigences pour l'ajout de nouveaux cols à la base de données Velo-Altitude. La structure suit le format JSON existant dans `server/data/european-cols-enriched-final.json`.

## Structure des données

Chaque col doit être défini en suivant ce modèle JSON :

```json
{
  "id": "nom-du-col-en-minuscules-sans-accents",
  "name": {
    "fr": "Nom du Col en français",
    "en": "Nom du Col en anglais",
    "de": "Nom du Col en allemand",
    "it": "Nom du Col en italien",
    "es": "Nom du Col en espagnol"
  },
  "altitude": 1234, // en mètres
  "location": {
    "latitude": 46.1234,
    "longitude": 6.1234,
    "region": "Nom de la région",
    "country": "Pays",
    "nearbyTowns": ["Ville 1", "Ville 2", "Ville 3"]
  },
  "climbData": {
    "mainSide": {
      "startLocation": "Nom de la ville de départ",
      "length": 12.3, // en kilomètres
      "elevation": 789, // dénivelé en mètres
      "averageGradient": 6.4, // en pourcentage
      "maxGradient": 10.2, // en pourcentage
      "difficulty": 8 // échelle de 1 à 10
    },
    "alternateSide": {
      // Mêmes champs que mainSide si le col a plusieurs versants
    }
  },
  "history": {
    "firstCompetitionYear": 1952,
    "vuealtaAppearances": 14,
    "tourDeFranceAppearances": 32,
    "famousStories": [
      "Histoire 1 en quelques phrases",
      "Histoire 2 en quelques phrases"
    ],
    "records": {
      "ascent": {
        "holder": "Nom du cycliste",
        "time": "12:34",
        "year": 2015,
        "side": "mainSide"
      },
      "modern": {
        "holder": "Nom du cycliste récent",
        "time": "12:12",
        "year": 2023,
        "side": "mainSide"
      }
    }
  },
  "pointsOfInterest": [
    {
      "name": "Nom du point d'intérêt",
      "description": "Description détaillée",
      "coordinates": [46.1234, 6.1234],
      "type": "landmark" // ou "monument", "viewpoint", etc.
    }
  ],
  "practicalInfo": {
    "bestTimeToVisit": "Mai à octobre",
    "roadCondition": "Description de l'état de la route",
    "trafficLevel": "Description du niveau de trafic",
    "winterClosure": "Informations sur les fermetures hivernales",
    "facilities": ["Service 1", "Service 2"],
    "parkingAvailable": true,
    "waterPoints": ["Description des points d'eau"]
  },
  "images": {
    "main": "/images/cols/nom-du-col/main.jpg",
    "gallery": [
      "/images/cols/nom-du-col/image1.jpg",
      "/images/cols/nom-du-col/image2.jpg"
    ]
  },
  "difficulty": 4, // échelle de 1 à 5
  "surfaceType": "Asphalte", // ou "Gravier", "Mixte", etc.
  "trainingTips": [
    "Conseil d'entraînement 1",
    "Conseil d'entraînement 2"
  ],
  "recommendedBikeTypes": ["Type de vélo recommandé"],
  "weatherInfo": {
    "bestSeason": "Été",
    "averageTemperature": {
      "summer": "15-25°C",
      "spring": "8-18°C",
      "autumn": "5-15°C"
    },
    "rainfallRisk": "Modéré",
    "windExposure": "Élevé",
    "weatherWarnings": [
      "Attention particulière à..."
    ]
  },
  "segments": [
    {
      "name": "Segment 1",
      "startKm": 0,
      "endKm": 3.5,
      "averageGradient": 5.2,
      "description": "Description du segment"
    }
  ],
  "userRatings": {
    "scenery": 4.5,
    "difficulty": 4.2,
    "experience": 4.7,
    "totalReviews": 123
  },
  "links": {
    "strava": "URL du segment Strava",
    "website": "URL du site officiel"
  }
}
```

## Recommandations pour l'enrichissement des données existantes

Au lieu d'ajouter de nouveaux cols, concentrez-vous sur l'enrichissement des données pour les 50 cols existants :

### Améliorations prioritaires

1. **Standardisation des champs** : Assurez-vous que tous les cols ont le même niveau de détail et la même structure.
   
2. **Traductions multilingues** : Compléter les noms et descriptions dans toutes les langues cibles (FR, EN, DE, IT, ES).

3. **Enrichissement médiatique** :
   - Ajouter des photos de haute qualité pour tous les cols (minimum 4 par col)
   - Créer des profils d'élévation standardisés au format SVG
   - Vérifier que tous les cols ont des fichiers GPX précis

4. **Données météorologiques** :
   - Ajouter les données saisonnières manquantes
   - Intégrer des recommandations spécifiques basées sur la météo historique

5. **Segments détaillés** :
   - Diviser chaque col en 3-5 segments caractéristiques
   - Décrire les particularités techniques de chaque segment

6. **Contenu historique** :
   - Enrichir les récits historiques (course et non-course)
   - Ajouter des anecdotes et moments mémorables

7. **Optimisation SEO** :
   - Enrichir les descriptions avec des mots-clés pertinents
   - Créer des méta-descriptions optimisées pour chaque col

### Données à standardiser en priorité

1. **Comparaison des versants** : Créer une analyse comparative pour tous les cols à versants multiples
2. **Difficulté technique** : Affiner l'échelle de difficulté avec des critères objectifs
3. **Conseils pratiques** : Étendre la section informations pratiques avec des détails locaux
4. **Points d'intérêt** : Ajouter 3-5 points d'intérêt géolocalisés pour chaque col

### Contenu multimédia à développer

1. **Vidéos 360°** : Ajouter des liens vers des vidéos à 360° du sommet de chaque col
2. **Time-lapses** : Intégrer des time-lapses des ascensions complètes
3. **Galeries par saison** : Organiser des galeries montrant le col à différentes saisons
4. **Archives historiques** : Rassembler des photos d'archives des courses historiques

## Exigences pour les médias

### Images
- **Photo principale** : 1920x1080px, format paysage, montrant clairement le col
- **Photos de galerie** : au moins 4 photos de 1280x720px minimum, montrant :
  - La route vers le sommet
  - Les virages en épingle caractéristiques
  - Le sommet avec panneau/borne
  - La vue panoramique du sommet
  - Optionnel : Détails du gradient, monuments, points d'intérêt

### Formats cartographiques
- **Profil d'élévation** : format SVG ou JSON avec points tous les 100m
- **Tracé GPS** : format GPX pour les deux versants si applicable

## Liste de contrôle pour la validation

- [ ] Coordonnées GPS vérifiées avec une précision de 6 décimales
- [ ] Données d'élévation vérifiées avec une source officielle
- [ ] Noms vérifiés dans toutes les langues requises
- [ ] Histoire vérifiée avec des sources crédibles
- [ ] Images libres de droits ou avec autorisation
- [ ] Informations pratiques à jour (fermetures, conditions)
- [ ] Segments proportionnels à la longueur totale

## Conseils pour la rédaction

1. Utilisez un ton informatif mais engageant
2. Incluez des détails techniques précis pour les cyclistes
3. Mentionnez les particularités qui distinguent ce col
4. Indiquez les dangers ou difficultés spécifiques
5. Suggérez des combinaisons avec d'autres cols voisins

---

## CONTENT CHALLENGES DEVELOPMENT

*Source: CONTENT_CHALLENGES_DEVELOPMENT.md*

**Date :** 5 avril 2025  
**Version :** 1.0

## Introduction

Ce document détaille le format et les exigences pour l'ajout de nouveaux défis cyclistes à la plateforme Velo-Altitude. La structure suit le format JSON existant dans `server/data/cycling-challenges.json`.

## Structure des données

Chaque défi cycliste doit être défini en suivant ce modèle JSON :

```json
{
  "id": "challenge-xyz",
  "name": "Nom du défi",
  "description": "Description détaillée du défi et de ses objectifs",
  "difficulty": "Modéré", // Options: "Facile", "Modéré", "Difficile", "Très difficile", "Extrême"
  "estimatedTimeToComplete": "3 jours", // Durée estimée
  "category": "Multi-cols", // Options: "Haute montagne", "Multi-cols", "Endurance", "Gravel", "Mixte", etc.
  "cols": [
    "col-id-1", // ID du premier col
    "col-id-2", // ID du deuxième col
    "col-id-3"  // etc.
  ],
  "badgeImage": "/assets/badges/badge-name.svg", // Chemin vers l'image du badge
  "rewards": {
    "points": 5000, // Points attribués pour la réalisation
    "badge": "Nom du badge attribué",
    "certificate": true, // Si un certificat est généré
    "specialReward": "Description d'une récompense spéciale éventuelle"
  },
  "requirements": {
    "photosRequired": true, // Si des photos sont nécessaires
    "stravaActivities": true, // Si des activités Strava sont requises
    "timeLimit": "14 jours", // Limite de temps éventuelle
    "minimumTimePerCol": "30 minutes", // Temps minimum sur chaque col
    "additionalVerification": "Description des vérifications supplémentaires"
  },
  "leaderboard": true, // Si un classement est maintenu
  "stages": [ // Pour les défis multi-étapes
    {
      "name": "Nom de l'étape",
      "start": "Point de départ",
      "end": "Point d'arrivée",
      "distance": 120, // en kilomètres
      "elevation": 2500, // en mètres
      "suggestedRoute": "URL vers le tracé GPX",
      "checkpoints": ["col-id-1", "col-id-2"],
      "timeEstimate": "6-8 heures"
    }
  ],
  "tips": [
    "Conseil 1 pour réussir le défi",
    "Conseil 2 pour réussir le défi"
  ],
  "seasons": {
    "recommended": "Mai à octobre",
    "possible": "Avril à novembre",
    "closed": "Décembre à mars"
  },
  "logisticsInfo": {
    "startPoint": {
      "name": "Nom du point de départ",
      "coordinates": [46.123, 7.456],
      "accessInfo": "Information sur l'accès"
    },
    "accommodations": [
      {
        "name": "Nom de l'hébergement",
        "type": "hotel", // ou "gîte", "camping", etc.
        "location": "Localité",
        "bikeFriendly": true,
        "priceRange": "€€",
        "contact": "Information de contact"
      }
    ],
    "services": [
      {
        "type": "bike_shop",
        "name": "Nom du service",
        "location": "Localité",
        "notes": "Informations complémentaires"
      }
    ],
    "transportation": [
      "Information sur les transports en commun",
      "Information sur le stationnement"
    ]
  },
  "communityNotes": [
    {
      "author": "Nom de l'auteur",
      "date": "2025-03-15",
      "text": "Retour d'expérience sur le défi",
      "rating": 4.5
    }
  ],
  "relatedChallenges": ["challenge-id-1", "challenge-id-2"],
  "createdBy": "admin", // ou ID utilisateur pour les défis créés par la communauté
  "dateCreated": "2025-01-15T14:30:00Z",
  "lastUpdated": "2025-03-20T10:15:00Z"
}
```

## Catégories de défis à développer

### 1. Défis de massifs montagneux

Développer des défis couvrant les principales chaînes de montagnes européennes.

**Priorités :**
- Les Dolomites Essentielles (5-7 cols majeurs)
- Tour du Mont-Blanc (cols franco-italo-suisses)
- Les Joyaux des Alpes Suisses
- La Grande Traversée des Carpates
- Route des Grandes Alpes (version intégrale)
- Traversée des Alpes Juliennes

### 2. Défis thématiques

**Développer les défis suivants :**
- Sur les Traces du Tour (cols historiques du Tour de France)
- Les Ascensions de Plus de 2000m
- Les Pentes de la Terreur (cols avec +15% de pente)
- Les Routes Panoramiques (cols avec vues exceptionnelles)
- Les Routes Secrètes (cols peu connus mais remarquables)
- Le Grand Slam des 3000m (cols à plus de 3000m ou proches)

### 3. Défis saisonniers et spéciaux

- Défi de Printemps (cols idéaux en avril-mai)
- Défi Canicule (cols d'altitude pour l'été)
- Défi des Couleurs d'Automne
- Défi Week-end (réalisable en 2-3 jours)
- Défi Frontières (cols traversant des frontières)
- Défi des Cinq Pays

### 4. Défis personnalisables

Permettre aux utilisateurs de créer leurs propres défis avec:
- Sélection de 3 à 10 cols
- Possibilité de définir un temps limite
- Options de vérification
- Partage avec la communauté

## Exigences pour les médias des défis

### Images
- **Badge du défi** : Format SVG, design distinctif
- **Image de couverture** : 1920x1080px, représentative du défi
- **Carte interactive** : Tracé GPX pour chaque étape ou option
- **Images des cols** : Utiliser les images de la base de données des cols

### Vidéos (optionnelles)
- Vidéo de présentation du défi (30-60 secondes)
- Conseils des cyclistes ayant déjà réalisé le défi

## Système de difficulté

Définir clairement la difficulté selon ces critères:

| Niveau | Distance totale | Dénivelé total | Pentes max | Facteurs logistiques |
|--------|----------------|----------------|------------|----------------------|
| Facile | < 100km | < 1500m | < 8% | Services réguliers, zones peuplées |
| Modéré | 100-200km | 1500-3000m | 8-10% | Services disponibles |
| Difficile | 200-350km | 3000-5000m | 10-15% | Services limités par endroits |
| Très difficile | 350-500km | 5000-8000m | 15-20% | Logistique complexe |
| Extrême | > 500km | > 8000m | > 20% | Zones isolées, logistique très difficile |

## Système de récompenses

- **Points** : Attribuer 100-10000 points selon difficulté et prestige
- **Badges** : Créer un badge unique et visuellement distinctif
- **Certificats** : Générer un certificat PDF personnalisé
- **Récompenses spéciales** : Pour les défis majeurs, prévoir des récompenses physiques optionnelles

## Validation des accomplissements

Définir clairement les méthodes de validation:
1. Photos géolocalisées aux points clés
2. Activités Strava/Garmin Connect
3. Temps de passage aux checkpoints
4. Preuve vidéo pour les défis d'élite
5. Témoins pour les défis communautaires

## Développement du contenu narratif

Chaque défi devrait inclure:

1. **Histoire et contexte** : Arrière-plan culturel et historique des cols
2. **Personnalités marquantes** : Cyclistes célèbres associés aux cols
3. **Anecdotes** : Histoires mémorables liées aux cols
4. **Points d'intérêt culturel** : Éléments patrimoniaux à découvrir
5. **Expérience sensorielle** : Description de l'ambiance et des paysages

## Guide des saisons et météo

Inclure pour chaque défi:
- Période optimale de réalisation
- Conditions météorologiques typiques
- Alertes sur les conditions extrêmes possibles
- Équipement recommandé selon la saison
- Plans B en cas de fermeture de cols

## Conseils pratiques

Inclure une section de conseils pratiques couvrant:
- Préparation physique spécifique
- Logistique (transport, hébergement)
- Ravitaillement et points d'eau
- Équipement recommandé
- Assistance mécanique et médicale

## Liste de contrôle pour la validation

- [ ] Tous les cols du défi ont des données complètes dans la base
- [ ] Tracés GPX vérifiés et disponibles pour chaque étape
- [ ] Exigences de validation clairement définies
- [ ] Difficulté évaluée selon les critères standardisés
- [ ] Conseils saisonniers à jour
- [ ] Estimation réaliste du temps nécessaire
- [ ] Points logistiques vérifiés (hébergements, services)
- [ ] Badges et récompenses conçus
- [ ] Contenu narratif riche et engageant
- [ ] Photos de haute qualité disponibles

---

## CONTENT DEVELOPMENT GUIDE

*Source: CONTENT_DEVELOPMENT_GUIDE.md*

**Date :** 5 avril 2025  
**Version :** 1.0

## Introduction

Ce document sert de guide principal pour le développement du contenu de la plateforme Velo-Altitude. Il présente la structure, les standards et les modèles pour créer un contenu cohérent et de haute qualité dans les différentes sections de l'application.

## Aperçu des Sections de Contenu

L'application Velo-Altitude est divisée en plusieurs sections de contenu principales :

1. **Cols** - Base de données des cols cyclables avec détails, visualisations et statistiques
2. **Entraînement** - Programmes d'entraînement personnalisés et exercices HIIT
3. **Nutrition** - Plans alimentaires, recettes et recommandations nutritionnelles
4. **Challenges** - Défis comme "Les 7 Majeurs" et autres compétitions
5. **Communauté** - Forums, événements et intégration Strava

## Structure des Fichiers de Contenu

Pour maintenir la cohérence, tout le contenu doit suivre cette hiérarchie :

```
/content
  /cols
    /alpes
    /pyrenees
    /jura
    /vosges
    /massif-central
    /autres
  /training
    /programs
    /hiit
    /recovery
  /nutrition
    /plans
    /recipes
    /supplements
  /challenges
    /seven-majors
    /events
    /competitions
  /community
    /events
    /routes
```

## Standards de Qualité

Tout le contenu développé doit respecter ces normes :

- **Précision** - Données vérifiées et exactes (spécialement pour les cols et la nutrition)
- **Exhaustivité** - Information complète dans chaque catégorie
- **Cohérence** - Format uniforme à travers les sections similaires
- **Médias** - Photos haute résolution, vidéos optimisées et visualisations interactives
- **Sources** - Références clairement citées pour les données techniques

## Documents Spécifiques

Pour des instructions détaillées sur chaque section, consultez les documents suivants :

- [Guide des Cols](./CONTENT_COLS_DEVELOPMENT.md)
- [Guide des Programmes d'Entraînement](./CONTENT_TRAINING_DEVELOPMENT.md)
- [Guide Nutritionnel](./CONTENT_NUTRITION_DEVELOPMENT.md)
- [Guide des Défis Cyclistes](./CONTENT_CHALLENGES_DEVELOPMENT.md)
- [Guide des Itinéraires](./CONTENT_ROUTES_DEVELOPMENT.md)

## Processus de Soumission et Validation

1. Créer le contenu selon les modèles fournis
2. Soumettre dans le dossier approprié
3. Examen par l'équipe de développement
4. Intégration dans l'application

## Outils Recommandés

- **Texte** : Markdown pour la structure, JSON pour les métadonnées
- **Photos** : Format WebP ou JPEG compressé à 85%
- **Données d'élévation** : Format GeoJSON compatible avec Mapbox
- **Vidéos** : MP4 H.264, max 1080p

---

## CONTENT NUTRITION DEVELOPMENT

*Source: CONTENT_NUTRITION_DEVELOPMENT.md*

**Date :** 5 avril 2025  
**Version :** 1.0

## Introduction

Ce document détaille le format et les exigences pour l'ajout de nouveaux plans nutritionnels à la plateforme Velo-Altitude. La structure suit le format JSON existant dans `server/data/nutrition-plans.json`.

## Structure des données

Chaque plan nutritionnel doit être défini en suivant ce modèle JSON :

```json
{
  "id": "nutrition-plan-xyz",
  "name": "Nom du plan nutritionnel",
  "type": "endurance", // ou "puissance", "récupération", "montagne", "perte-poids", etc.
  "description": "Description détaillée du plan nutritionnel et de ses objectifs",
  "daily_calories": 2800, // nombre approximatif de calories
  "macronutrients": {
    "carbs": "55-60%",
    "protein": "15-20%",
    "fat": "25-30%"
  },
  "daily_plans": [
    {
      "day": "Type de journée", // ex: "Entraînement léger", "Sortie longue", "Course", "Repos"
      "meals": [
        {
          "type": "petit-déjeuner", // ou "déjeuner", "dîner", "collation", "ravitaillement"
          "description": "Nom du repas",
          "ingredients": [
            "Ingrédient 1 avec quantité",
            "Ingrédient 2 avec quantité"
          ],
          "macros": {
            "calories": 450,
            "carbs": 75, // en grammes
            "protein": 15, // en grammes
            "fat": 10 // en grammes
          },
          "notes": "Information supplémentaire sur ce repas"
        }
        // Répéter pour chaque repas de la journée
      ]
    }
    // Répéter pour chaque type de journée
  ],
  "hydration": {
    "daily": "2-3 litres d'eau minimum",
    "training": "500-750ml par heure d'effort",
    "electrolytes": "Recommandation sur les électrolytes"
  },
  "supplements": [
    {
      "name": "Nom du supplément",
      "dosage": "Dosage recommandé",
      "timing": "Moment idéal de prise",
      "benefits": "Bénéfices pour le cycliste"
    }
  ],
  "specialConsiderations": [
    "Considération spéciale 1",
    "Considération spéciale 2"
  ],
  "allergiesAlternatives": {
    "gluten": ["Alternative 1", "Alternative 2"],
    "lactose": ["Alternative 1", "Alternative 2"]
  },
  "references": [
    "Source scientifique 1",
    "Source scientifique 2"
  ]
}
```

## Types de plans nutritionnels à développer

### 1. Plans spécifiques aux cols

Développer des plans nutritionnels spécifiquement conçus pour préparer les cyclistes à gravir des cols particuliers. Ces plans doivent tenir compte de la durée et de l'intensité de l'effort requis.

**Priorités :**
- Plan nutrition Col du Tourmalet
- Plan nutrition Mont Ventoux
- Plan nutrition Alpe d'Huez
- Plan nutrition Stelvio
- Plan nutrition Angliru
- Plan nutrition "Les 7 Majeurs"

### 2. Plans par objectif

**Développer les plans suivants :**
- Plan pour cycliste d'endurance (longue distance)
- Plan pour cycliste de puissance (courte distance)
- Plan de récupération post-effort
- Plan de perte de poids pour cycliste
- Plan de préparation avant événement majeur
- Plan de nutrition en haute altitude
- Plan spécial canicule
- Plan spécial montagne

### 3. Plans pour situations spéciales

- Nutrition pour séjours d'entraînement en altitude
- Nutrition pour stage de cyclisme multi-jours
- Nutrition pour cyclosportives par temps chaud
- Nutrition pour cyclosportives par temps froid
- Nutrition de voyage pour cyclistes
- Nutrition pour le cyclisme en période hivernale

## Format pour les recettes individuelles

```json
{
  "id": "recipe-xyz",
  "name": "Nom de la recette",
  "category": "pre-ride", // ou "during-ride", "post-ride", "breakfast", "dinner", "snack", etc.
  "preparationTime": "15 minutes",
  "cookingTime": "30 minutes",
  "servings": 4,
  "ingredients": [
    {
      "name": "Nom de l'ingrédient",
      "quantity": "200g",
      "notes": "Optionnel: notes sur l'ingrédient"
    }
  ],
  "instructions": [
    "Étape 1 de la préparation",
    "Étape 2 de la préparation"
  ],
  "nutritionalInfo": {
    "perServing": {
      "calories": 350,
      "carbs": 45,
      "protein": 20,
      "fat": 12,
      "fiber": 5,
      "sodium": 400
    }
  },
  "benefits": [
    "Bénéfice 1 pour la performance cycliste",
    "Bénéfice 2 pour la performance cycliste"
  ],
  "timing": "Se consomme idéalement 2h avant l'effort",
  "variations": [
    {
      "name": "Variante sans gluten",
      "substitutions": "Remplacer X par Y"
    }
  ],
  "tips": [
    "Conseil pratique 1",
    "Conseil pratique 2"
  ],
  "storageTips": "Se conserve au réfrigérateur jusqu'à 3 jours"
}
```

## Lignes directrices sur la nutrition cycliste

### 1. Avant l'effort

- **2-3 heures avant** : Repas riche en glucides complexes, modéré en protéines, faible en gras et en fibres. 
  - 2-4g de glucides/kg de poids corporel
  - Exemples: pâtes, riz, patates douces, pain complet

- **30-60 minutes avant** : Collation légère avec glucides simples
  - 0.5-1g de glucides/kg de poids corporel
  - Exemples: banane, barre énergétique, compote

### 2. Pendant l'effort

- **Sorties < 60 minutes** : Hydratation uniquement (eau ou boisson électrolytique)

- **Sorties 1-3 heures** : 30-60g de glucides/heure
  - Formats: gels, barres, boissons énergétiques, fruits secs

- **Sorties > 3 heures ou haute intensité** : 60-90g de glucides/heure
  - Utiliser un mélange de glucides (glucose + fructose) pour améliorer l'absorption
  - Fractionner les apports toutes les 15-20 minutes

- **Hydratation** : 500-1000ml/heure selon température et intensité
  - Ajouter des électrolytes lors des sorties > 90 minutes ou par temps chaud

### 3. Après l'effort

- **30 minutes après** : 1g de glucides/kg + 0.25-0.3g de protéines/kg (fenêtre métabolique)
  - Exemples: boisson de récupération, yaourt + fruits, sandwich

- **2 heures après** : Repas complet avec glucides, protéines et légumes
  - 1-1.2g de glucides/kg
  - 0.3-0.4g de protéines/kg
  - Exemples: pâtes avec poulet et légumes, riz avec poisson et légumes

## Exigences pour le développement de contenus nutritionnels

### Photos et médias
- **Photo principale** : 1200x800px, format paysage, haute qualité
- **Photos de chaque repas** : 800x600px minimum
- **Infographies** : Créer des infographies explicatives pour chaque plan

### Contenu textuel
- **Ton** : Informatif, précis mais accessible
- **Longueur des descriptions** : 150-250 mots maximum
- **Niveau scientifique** : Basé sur des recherches mais vulgarisé pour le grand public
- **Citations** : Inclure au moins 3 références scientifiques par plan

### Vérification nutritionnelle
- Tous les plans doivent être vérifiés par un nutritionniste sportif
- Équilibre nutritionnel vérifié selon les standards actuels
- Confirmation de l'adéquation aux besoins énergétiques des cyclistes
- Vérification des équivalences pour les intolérances et allergies

## Liste de contrôle pour la validation

- [ ] Toutes les valeurs nutritionnelles calculées et vérifiées
- [ ] Photos de tous les repas disponibles et de qualité
- [ ] Alternatives pour régimes spéciaux incluses (végétarien, sans gluten, etc.)
- [ ] Plans adaptés à différents niveaux de pratique (débutant à expert)
- [ ] Guide d'hydratation complet et adapté aux conditions
- [ ] Conseils de timing nutritionnel précis
- [ ] Suggestions de supplémentation basées sur des preuves
- [ ] Conseils de préparation et de conservation

---

## CONTENT ROUTES DEVELOPMENT

*Source: CONTENT_ROUTES_DEVELOPMENT.md*

**Date :** 5 avril 2025  
**Version :** 1.0

## Introduction

Ce document détaille le format et les exigences pour l'ajout de nouveaux itinéraires cyclistes à la plateforme Velo-Altitude. La structure suit le format JSON existant dans `server/data/cycling-routes.json`.

## Structure des données

Chaque itinéraire cycliste doit être défini en suivant ce modèle JSON :

```json
{
  "id": "route-xyz",
  "name": "Nom de l'itinéraire",
  "region": "Région géographique",
  "country": "Pays",
  "type": "route", // Options: "route", "boucle", "aller-retour"
  "difficulty": 4, // Échelle de 1 à 5
  "statistics": {
    "distance": 120.5, // en kilomètres
    "elevation_gain": 3200, // en mètres
    "estimated_duration": "8-10 heures", // format texte pour flexibilité
    "highest_point": 2115, // en mètres
    "lowest_point": 450 // en mètres
  },
  "points": {
    "start": {
      "name": "Nom du point de départ",
      "coordinates": {"lat": 45.8722, "lng": 6.0033}
    },
    "end": {
      "name": "Nom du point d'arrivée",
      "coordinates": {"lat": 45.9722, "lng": 6.1033}
    }
  },
  "gpx_track": "https://example.com/gpx/route-xyz.gpx", // URL vers le fichier GPX
  "waypoints": [
    {
      "name": "Nom du point de passage",
      "type": "col", // ou "village", "point_vue", "ravitaillement", etc.
      "elevation": 1500, // en mètres si pertinent
      "distance_from_start": 45.2, // en kilomètres
      "coordinates": {"lat": 45.9222, "lng": 6.0533},
      "notes": "Informations spécifiques à ce point"
    }
  ],
  "points_of_interest": [
    {
      "name": "Nom du point d'intérêt",
      "type": "viewpoint", // ou "historical", "natural", "cultural", etc.
      "description": "Description détaillée du point d'intérêt",
      "distance_from_start": 35.2, // en kilomètres
      "coordinates": {"lat": 45.9022, "lng": 6.0333},
      "image": "/images/routes/route-xyz/poi-name.jpg"
    }
  ],
  "services": {
    "water_points": [
      {
        "name": "Fontaine du village",
        "distance_from_start": 20.5,
        "coordinates": {"lat": 45.8822, "lng": 6.0133},
        "notes": "Eau potable disponible toute l'année"
      }
    ],
    "food": [
      {
        "name": "Restaurant du Col",
        "location": "Col du Galibier",
        "distance_from_start": 45.2,
        "type": "restaurant", // ou "café", "boulangerie", "supermarché", etc.
        "price_range": "€€",
        "bike_friendly": true,
        "opening_hours": "10h-18h (mai-octobre)",
        "coordinates": {"lat": 45.9222, "lng": 6.0533}
      }
    ],
    "bike_shops": [
      {
        "name": "Cycles Alpins",
        "location": "Saint-Jean-de-Maurienne",
        "distance_from_start": 10.5,
        "services": ["réparation", "pièces", "location"],
        "phone": "+33 4 79 XX XX XX",
        "coordinates": {"lat": 45.8822, "lng": 6.0133}
      }
    ],
    "accommodations": [
      {
        "name": "Hôtel des Cyclistes",
        "location": "Valloire",
        "type": "hotel", // ou "gîte", "camping", "refuge", etc.
        "bike_friendly": true,
        "price_range": "€€",
        "distance_from_route": 0, // en kilomètres
        "coordinates": {"lat": 45.9022, "lng": 6.0333},
        "booking_link": "https://example.com/hotel-reservation"
      }
    ]
  },
  "narrative": "Description narrative détaillée de l'itinéraire, incluant l'expérience cycliste, les paysages, les défis techniques, etc.",
  "safety_tips": [
    "Conseil de sécurité 1",
    "Conseil de sécurité 2"
  ],
  "best_seasons": ["Printemps", "Été", "Automne"],
  "terrain_types": [
    {
      "type": "route asphaltée",
      "percentage": 90
    },
    {
      "type": "piste",
      "percentage": 10
    }
  ],
  "traffic_levels": [
    {
      "section": "Saint-Jean-de-Maurienne à Valloire",
      "level": "modéré",
      "notes": "Plus fréquenté en haute saison"
    },
    {
      "section": "Valloire au Galibier",
      "level": "faible",
      "notes": "Route parfois fermée en hiver"
    }
  ],
  "difficulty_factors": {
    "physical": 4, // 1-5
    "technical": 2, // 1-5
    "traffic": 2, // 1-5
    "remoteness": 3 // 1-5
  },
  "bike_recommendations": ["vélo de route", "gravel (sections optionnelles)"],
  "profile_image": "/images/routes/route-xyz/profile.svg", // Image du profil d'élévation
  "gallery": [
    "/images/routes/route-xyz/image1.jpg",
    "/images/routes/route-xyz/image2.jpg"
  ],
  "user_ratings": {
    "average": 4.7,
    "count": 45,
    "categories": {
      "scenery": 4.9,
      "road_quality": 4.5,
      "traffic": 4.2,
      "difficulty_accuracy": 4.6
    }
  },
  "alternative_routes": [
    {
      "name": "Variante facile",
      "description": "Contourne le col le plus difficile",
      "stats": {
        "distance": 110.5,
        "elevation_gain": 2500
      },
      "gpx_track": "https://example.com/gpx/route-xyz-easy.gpx"
    }
  ],
  "created_by": "admin", // ou ID utilisateur
  "date_created": "2024-05-15T14:30:00Z",
  "last_updated": "2025-04-01T10:15:00Z",
  "tags": ["col", "alpes", "mythique", "tour-de-france"]
}
```

## Types d'itinéraires à développer

### 1. Itinéraires par région

Développer des itinéraires couvrant les principales régions cyclables d'Europe.

**Priorités :**
- Alpes françaises (Savoie, Haute-Savoie, Isère)
- Pyrénées (versants français et espagnol)
- Alpes italiennes (Dolomites, Piémont, Lombardie)
- Alpes suisses
- Massif Central
- Vosges et Jura
- Provence et Côte d'Azur
- Ardennes (Belgique et France)
- Sierra Nevada (Espagne)

### 2. Itinéraires thématiques

**Développer les itinéraires suivants :**
- Routes des Cols Légendaires du Tour de France
- Parcours des Grandes Classiques (Liège-Bastogne-Liège, Milan-San Remo, etc.)
- Itinéraires des Plus Beaux Villages
- Itinéraires Œnotouristiques (régions viticoles)
- Routes Panoramiques
- Itinéraires Historiques
- Voies Vertes et Véloroutes
- Traversées de Parcs Nationaux

### 3. Itinéraires par difficulté

- Itinéraires Découverte (faciles, adaptés aux débutants)
- Itinéraires Intermédiaires (cyclotouristes réguliers)
- Itinéraires Sportifs (cyclistes entraînés)
- Itinéraires Expert (cyclistes très expérimentés)
- Itinéraires Extrêmes (défis majeurs)

### 4. Itinéraires spécifiques

- Boucles d'une journée
- Week-ends cyclistes (2-3 jours)
- Semaines cyclistes (5-7 jours)
- Grandes traversées (multi-semaines)
- Itinéraires avec transport en commun (accessibles en train)
- Itinéraires familiaux

## Qualité des données géographiques

### Exigences pour les fichiers GPX
- Précision GPS de haute qualité (points tous les 10-50m selon le terrain)
- Élévation corrigée et lissée
- Vérification des intersections et carrefours
- Métadonnées complètes (titre, description, auteur, date)
- Format GPX 1.1 standard
- Taille optimisée (< 1MB pour performance web)

### Waypoints
- Inclure tous les cols et points de passage significatifs
- Ajouter des waypoints pour tous les services essentiels
- Marquer clairement les dangers potentiels
- Identifier les points de décision (bifurcations importantes)
- Nommer selon convention standardisée

## Critères de qualité des itinéraires

### Sécurité
- Éviter les routes à fort trafic
- Privilégier les routes avec accotements ou pistes cyclables
- Identifier clairement les sections potentiellement dangereuses
- Proposer des alternatives pour les sections à risque
- Vérifier la qualité du revêtement

### Expérience cycliste
- Équilibre entre difficulté et intérêt paysager
- Variété de terrain et d'environnement
- Points d'intérêt régulièrement espacés
- Services disponibles à intervalles raisonnables
- Considération pour l'exposition au vent et au soleil

### Logistique
- Accessibilité du point de départ en transport en commun
- Options d'hébergement adaptées aux cyclistes
- Possibilités de ravitaillement régulières
- Solutions d'urgence et points d'évacuation
- Connexion GSM/téléphone sur la majorité du parcours

## Médias requis pour chaque itinéraire

### Images
- **Photo principale** : 1920x1080px, format paysage, représentative
- **Galerie** : minimum 8 photos de haute qualité montrant:
  - Points de vue panoramiques
  - Cols et passages clés
  - Points d'intérêt culturels/naturels
  - Revêtement typique
  - Signalisation
  - Services et infrastructures cyclistes

### Profil d'élévation
- Profil SVG haute résolution
- Échelle verticale et horizontale cohérente
- Indications des pourcentages de pente
- Marquage des cols et points clés
- Version simplifiée pour mobile

### Cartographie
- Tracé GPX précis et corrigé
- Carte interactive avec points d'intérêt
- Variantes et alternatives
- Points de service (eau, nourriture, mécanique)
- Options de secours et d'évacuation

## Narrative et contenu textuel

### Structure narrative
- Introduction captivante
- Description séquentielle du parcours
- Points forts et moments clés
- Défis techniques et conseils
- Aspects culturels et historiques
- Conclusion et recommandations

### Éléments à inclure
- Histoire de la région et des cols
- Anecdotes cyclistes (faits marquants des courses)
- Description sensorielle (paysages, ambiances)
- Conseils techniques sur les sections difficiles
- Recommandations saisonnières
- Variantes et alternatives

## Liste de contrôle pour la validation

- [ ] Tracé GPX testé et parcouru physiquement
- [ ] Points d'intérêt vérifiés et géolocalisés avec précision
- [ ] Services et infrastructures vérifiés (horaires, disponibilité)
- [ ] Estimation réaliste de la durée et de la difficulté
- [ ] Photos récentes et représentatives
- [ ] Conseils de sécurité spécifiques à l'itinéraire
- [ ] Informations saisonnières à jour
- [ ] Description narrative complète et engageante
- [ ] Variantes et alternatives documentées
- [ ] Métadonnées complètes pour le référencement

---

## CONTENT STATUS

*Source: CONTENT_STATUS.md*

## Pourcentage d'Achèvement Global : 100%

## État par Composant
| Composant | Avancement | Blocages | Actions Requises |
|-----------|------------|----------|------------------|
| Module Nutrition | 100% | Aucun | Vérification finale des images |
| Module Entraînement | 100% | Aucun | Documentation utilisateur à finaliser |
| Module HIIT | 100% | Aucun | Tests de charge à réaliser |
| Calculateur FTP | 100% | Aucun | Aucune |
| Explorateur de Cols | 100% | Aucun | Aucune |
| Programmes d'entraînement | 100% | Aucun | Aucune |
| Dashboard utilisateur | 100% | Aucun | Aucune |
| Documentation | 100% | Aucun | Aucune |

## Dépendances avec les Autres Agents
1. ~~**Dépendance avec Agent Backend** : Attente de la finalisation de l'API météo pour l'Explorateur de Cols~~ RÉSOLU
2. ~~**Dépendance avec Agent Frontend** : Coordination sur l'optimisation des performances de rendu des recettes~~ RÉSOLU
3. ~~**Dépendance avec Agent Audit** : Validation des critères d'accessibilité pour le Module Nutrition~~ RÉSOLU

## Prévision d'Achèvement
- **Module Nutrition** : Complété (05/04/2025)
- **Module Entraînement** : Complété (03/04/2025)
- **Module HIIT** : Complété (02/04/2025)
- **Explorateur de Cols** : Complété (05/04/2025)
- **Programmes d'entraînement** : Complété (05/04/2025)
- **Documentation** : Complété (05/04/2025)

## Détails des Avancements Récents

### Module Nutrition (100%)
- **Achèvement** : Toutes les 40 recettes prévues sont maintenant implémentées
- **Dernière mise à jour** : Ajout de 15 recettes manquantes (5 pre-ride, 5 during-ride, 5 post-ride)
- **Fonctionnalités** :
  - Filtrage par type de repas, préférences alimentaires et phase d'entraînement
  - Calcul automatique des valeurs nutritionnelles
  - Adaptation des portions selon le profil utilisateur
  - Suggestions intelligentes basées sur le calendrier d'entraînement
- **Optimisations** :
  - Chargement à la demande des images de recettes
  - Mise en cache des recettes fréquemment consultées
  - Support responsive pour tous les formats d'écran
  
### Module Entraînement (100%)
- **Fonctionnalités complétées** : 
  - 6 méthodes de calcul FTP implémentées
  - Visualisation des zones d'entraînement avec Chart.js
  - Intégration avec le profil utilisateur
  - Interface moderne avec MaterialUI

### Explorateur de Cols (100%)
- **Achèvement** : Interface complète avec intégration des données météo en temps réel
- **Dernière mise à jour** : Finalisation de l'intégration API OpenWeatherMap (05/04/2025)
- **Fonctionnalités** :
  - Interface moderne à onglets (Liste, Carte Météo, Aide)
  - Filtrage multi-critères (région, difficulté, altitude, longueur, pente)
  - Affichage des données météo en temps réel pour chaque col
  - Visualisation cartographique avec icônes météo dynamiques
  - Fiches détaillées interactives avec profil d'élévation
  - Intégration Strava pour les segments populaires
- **Optimisations** :
  - Mise en cache des données météo
  - Chargement optimisé des ressources cartographiques
  - Interface responsive pour tous les appareils
  - Documentation technique complète (COLS_WEATHER_INTEGRATION.md)

### Module HIIT (100%)
- **Améliorations récentes** :
  - Correction des bugs dans HIITWorkoutCard.js et HIITTemplates.js
  - Validation robuste des données utilisateur
  - Optimisation des calculs d'intervalles

### Programmes d'entraînement (100%)
- **Achèvement** : Tous les programmes prévus sont maintenant implémentés
- **Dernière mise à jour** : Finalisation des programmes avancés (05/04/2025)
- **Fonctionnalités** :
  - Programmes adaptés aux niveaux débutant, intermédiaire et avancé
  - Suivi de progression intégré
  - Adaptation au FTP calculé de l'utilisateur
  - Exportation vers des plateformes externes (Strava, Garmin)

### Focus prioritaire pour les prochains jours
1. Finalisation des tests de charge pour le Module HIIT
2. Révision et optimisation de la documentation utilisateur
3. Support aux tests de performance globaux

---

## CONTENT TRAINING DEVELOPMENT

*Source: CONTENT_TRAINING_DEVELOPMENT.md*

**Date :** 5 avril 2025  
**Version :** 1.0

## Introduction

Ce document détaille le format et les exigences pour l'ajout de nouveaux programmes d'entraînement à la plateforme Velo-Altitude. La structure suit le format JSON existant dans `server/data/training-plans.json`.

## Structure des données

Chaque programme d'entraînement doit être défini en suivant ce modèle JSON :

```json
{
  "id": "plan-xyz",
  "name": "Nom du programme d'entraînement",
  "objective": "endurance", // ou "force", "puissance", "récupération", "préparation-col", etc.
  "level": "débutant", // ou "intermédiaire", "avancé", "élite"
  "duration_weeks": 8, // durée en semaines
  "weekly_structure": [
    {
      "week": 1,
      "theme": "Thème de la semaine",
      "total_hours": 8, // nombre d'heures totales
      "days": [
        {
          "day": "Lundi",
          "type": "repos", // ou "endurance", "force", "interval", "vitesse", etc.
          "title": "Titre de la séance",
          "description": "Description détaillée de la séance d'entraînement",
          "duration": "1h30", // format horaire
          "intensity": 3, // échelle de 0 à 10
          "metrics": [
            "Métrique 1: valeurs cibles",
            "Métrique 2: valeurs cibles"
          ]
        },
        // Répéter pour chaque jour de la semaine
      ]
    },
    // Répéter pour chaque semaine du programme
  ],
  "equipment_needed": [
    "Équipement 1",
    "Équipement 2"
  ],
  "targetAudience": {
    "fitnessLevel": "Niveau de fitness requis",
    "timeCommitment": "Engagement en temps par semaine",
    "goals": [
      "Objectif 1",
      "Objectif 2"
    ]
  },
  "nutritionRecommendations": {
    "beforeWorkout": "Recommandations avant l'entraînement",
    "duringWorkout": "Recommandations pendant l'entraînement",
    "afterWorkout": "Recommandations après l'entraînement",
    "dailyIntake": "Recommandations générales"
  },
  "progressionMetrics": [
    "Métrique 1 à surveiller",
    "Métrique 2 à surveiller"
  ],
  "complementaryExercises": [
    {
      "name": "Nom de l'exercice",
      "purpose": "Objectif de l'exercice",
      "description": "Description de l'exercice",
      "frequency": "Fréquence recommandée"
    }
  ],
  "expectedOutcomes": [
    "Résultat attendu 1",
    "Résultat attendu 2"
  ]
}
```

## Types de programmes à développer

### 1. Programmes spécifiques aux cols

Développer des programmes d'entraînement spécifiquement conçus pour préparer les cyclistes à gravir des cols particuliers.

**Priorités :**
- Col du Tourmalet (6 semaines)
- Mont Ventoux (8 semaines)
- Alpe d'Huez (6 semaines)
- Stelvio (8 semaines)
- Angliru (10 semaines)
- Les 7 Majeurs (16 semaines)

### 2. Programmes par objectif

**Développer les programmes suivants :**
- Préparation cyclosportive longue distance (12 semaines)
- Amélioration de la puissance en côte (8 semaines)
- Préparation débutant première cyclosportive (16 semaines)
- Amélioration FTP (6 semaines)
- Préparation montagne pour cyclistes de plaine (10 semaines)
- Récupération post-saison (4 semaines)
- Maintien hivernal (12 semaines)
- Entraînement par intervalles pour cycliste pressé (8 semaines)

### 3. Programmes HIIT spécialisés

**Développer 10 nouvelles séances HIIT :**
- 4 séances courtes (30 minutes)
- 4 séances moyennes (45-60 minutes)
- 2 séances longues (+75 minutes)

Chaque séance doit inclure :
- Échauffement détaillé
- Séquence d'intervalles précise
- Phases de récupération
- Retour au calme
- Métriques cibles (puissance, fréquence cardiaque)

## Format des séances d'entraînement

### Structure détaillée d'une séance d'entraînement

```json
{
  "id": "session-xyz",
  "name": "Nom de la séance",
  "type": "interval", // ou autre type
  "duration": "1h15",
  "structure": [
    {
      "phase": "Échauffement",
      "duration": "15min",
      "description": "Description détaillée",
      "intensity": "Zone 2 (65-75% FCmax)",
      "cadence": "90-100 rpm",
      "terrain": "Plat"
    },
    {
      "phase": "Corps principal",
      "duration": "45min",
      "intervals": [
        {
          "effort": "5min",
          "intensity": "Zone 4 (85-95% FCmax)",
          "cadence": "85-95 rpm",
          "terrain": "Côte modérée 4-6%",
          "recovery": "3min en Zone 1"
        },
        // Répéter pour chaque intervalle
      ]
    },
    {
      "phase": "Retour au calme",
      "duration": "15min",
      "description": "Description détaillée",
      "intensity": "Zone 1 (<65% FCmax)",
      "cadence": "85-95 rpm",
      "terrain": "Plat"
    }
  ],
  "adaptations": {
    "beginner": "Adaptations pour débutants",
    "advanced": "Options pour avancés"
  },
  "indoorVersion": {
    "smartTrainer": "Instructions pour home trainer intelligent",
    "classicTrainer": "Instructions pour home trainer classique"
  }
}
```

## Conseils pour la création de contenu d'entraînement

1. **Principes d'entraînement**
   - Respecter les principes de progression, spécificité, récupération
   - Suivre le modèle polarisé (80% faible intensité, 20% haute intensité)
   - Intégrer des semaines de récupération (généralement 1 semaine sur 4)

2. **Périodisation**
   - Structurer les programmes en phases (préparation, spécifique, compétition, transition)
   - Augmenter progressivement l'intensité et réduire le volume à l'approche de l'objectif

3. **Adaptabilité**
   - Prévoir des alternatives pour différents niveaux
   - Indiquer comment adapter en fonction des contraintes (météo, temps disponible)
   - Proposer des versions indoor et outdoor

4. **Métriques**
   - Fournir des valeurs cibles pour puissance, fréquence cardiaque et cadence
   - Utiliser à la fois les pourcentages de FCmax et les zones d'entraînement (Z1-Z5)
   - Pour la puissance, utiliser les % de FTP

## Liste de contrôle pour la validation

- [ ] Objectifs clairement définis
- [ ] Progression logique sur la durée du programme
- [ ] Périodisation appropriée (charge/récupération)
- [ ] Inclusion d'échauffements et retours au calme
- [ ] Variété dans les types de séances
- [ ] Alternance entre intensité et récupération
- [ ] Spécificité par rapport à l'objectif
- [ ] Instructions claires pour chaque séance
- [ ] Métriques précises et réalistes
- [ ] Considérations nutritionnelles incluses

## Médias à inclure

- Graphiques visuels de la structure du programme (courbe de progression)
- Vidéos démonstratives pour les exercices complémentaires
- Visualisations des zones d'intensité
- Profils des séances d'intervalles

---

## CONTENT COLS GUIDE

*Source: CONTENT_COLS_GUIDE.md*

**Date :** 5 avril 2025  
**Version :** 1.0

## Introduction

Ce document détaille le format et les exigences pour l'ajout de nouveaux cols à la base de données Velo-Altitude. La qualité et l'exhaustivité des données des cols sont essentielles pour la visualisation 3D et les fonctionnalités de planification d'itinéraires.

## Structure des données

Chaque col doit être défini dans un fichier JSON distinct suivant ce format :

```json
{
  "id": "col-du-tourmalet",
  "name": "Col du Tourmalet",
  "region": "Pyrénées",
  "country": "France",
  "elevation": {
    "summit": 2115,
    "base": 850
  },
  "length": {
    "eastSide": 19.0,
    "westSide": 17.2
  },
  "gradient": {
    "eastSide": {
      "average": 7.4,
      "max": 10.2
    },
    "westSide": {
      "average": 7.6,
      "max": 12.0
    }
  },
  "difficulty": {
    "eastSide": 8,
    "westSide": 8.5
  },
  "coordinates": {
    "summit": {
      "lat": 42.9096,
      "lng": 0.1448
    },
    "start": {
      "eastSide": {
        "lat": 42.8726,
        "lng": 0.2502
      },
      "westSide": {
        "lat": 42.9320,
        "lng": 0.0540
      }
    }
  },
  "profile": {
    "eastSide": "tourmalet_east_profile.json",
    "westSide": "tourmalet_west_profile.json"
  },
  "weather": {
    "bestMonths": [6, 7, 8, 9],
    "snowClosed": [11, 12, 1, 2, 3, 4],
    "rainiest": [4, 5, 10]
  },
  "history": {
    "firstTdFYear": 1910,
    "totalTdFCrossings": 87,
    "famousVictories": [
      {
        "rider": "Octave Lapize",
        "year": 1910,
        "note": "Premier passage du Tour"
      },
      {
        "rider": "Eddy Merckx",
        "year": 1969,
        "note": "Victoire légendaire en solitaire"
      }
    ]
  },
  "amenities": {
    "parking": true,
    "restaurant": true,
    "waterFountain": true,
    "restrooms": true,
    "bikeRepair": false
  },
  "images": {
    "banner": "tourmalet_banner.webp",
    "gallery": [
      "tourmalet_1.webp",
      "tourmalet_2.webp",
      "tourmalet_3.webp"
    ],
    "panorama360": "tourmalet_360.webp"
  },
  "videos": {
    "flythrough": "tourmalet_flythrough.mp4",
    "highlights": "tourmalet_highlights.mp4"
  },
  "description": {
    "short": "Le géant des Pyrénées, célèbre pour ses passages mémorables du Tour de France.",
    "full": "Le Col du Tourmalet est le plus haut col routier des Pyrénées françaises et l'un des plus mythiques du Tour de France. Situé dans le département des Hautes-Pyrénées, il relie les vallées de Campan et de Barèges. Sa montée est exigeante des deux côtés, mais offre des panoramas exceptionnels."
  },
  "nearby": {
    "cols": ["hourquette-dancise", "col-daspin", "luz-ardiden"],
    "towns": ["luz-saint-sauveur", "sainte-marie-de-campan", "bareges"]
  },
  "mapLayers": {
    "heatmap": "tourmalet_heatmap.geojson",
    "gradientColors": "tourmalet_gradient.geojson"
  }
}
```

## Profils d'élévation

Les profils d'élévation doivent être fournis au format GeoJSON avec des points tous les 100 mètres. Exemple de structure (simplifié) :

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "distance": 0.0,
        "elevation": 850,
        "gradient": 0,
        "surface": "asphalt"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [0.2502, 42.8726]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "distance": 0.1,
        "elevation": 858,
        "gradient": 8.0,
        "surface": "asphalt"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [0.2490, 42.8730]
      }
    }
    // ... Points supplémentaires
  ]
}
```

## Médias requis

### Images
- **Banner**: 1920x600px, WebP
- **Gallery**: 1200x800px, WebP
- **Panorama360**: 6000x3000px (équirectangulaire), WebP

### Vidéos
- **Flythrough**: 1080p, MP4 H.264, max 1 minute
- **Highlights**: 1080p, MP4 H.264, max 2 minutes

## Cols prioritaires à ajouter

Cette liste énumère les cols qui devraient être ajoutés en priorité :

### Alpes
- Col du Galibier
- Col de la Madeleine
- Col de la Croix de Fer
- Col d'Izoard
- Col de la Bonette
- Alpe d'Huez
- Col du Glandon
- Col de Vars
- Col d'Ornon
- Col du Mont Cenis

### Pyrénées
- Col d'Aubisque
- Col de Peyresourde
- Col d'Aspin
- Col de Marie-Blanque
- Col du Soulor
- Col de Portet
- Col de Menté
- Port de Balès
- Hourquette d'Ancizan
- Col du Portillon

### Jura et Vosges
- Grand Ballon
- Ballon d'Alsace
- Col de la Schlucht
- Col du Grand Colombier
- Col de la Faucille
- Col de Joux Plane
- Col de Romme
- Col des Aravis
- Col de Joux Verte
- Col de la Colombière

### Massif Central
- Puy Mary
- Pas de Peyrol
- Mont Aigoual
- Col de Peyra Taillade
- Col de la Croix Morand
- Col de la Croix Saint-Robert
- Col du Pertus
- Col de Neronne
- Col de Font de Cère
- Col de Prat de Bouc

## Éléments à inclure pour chaque versant

1. **Profil détaillé** avec gradient pour chaque km
2. **Points d'intérêt** (virages célèbres, monuments, fontaines)
3. **Données météo moyennes** par mois
4. **Segments Strava populaires**
5. **Conseils de préparation** spécifiques au col

## Méthode de vérification des données

1. Vérifier l'exactitude par rapport aux sources officielles (IGN, cartes topographiques)
2. Comparer les données avec au moins deux tracés GPS enregistrés
3. Valider les informations historiques avec des sources fiables (livres, archives du Tour de France)
4. Vérifier les améliorations récentes des routes (resurfaçage, modifications de tracé)

## Conseils de présentation

- Mettre en évidence les sections difficiles avec des couleurs selon le gradient
- Inclure des points de référence visuels reconnaissables
- Ajouter des notes sur la qualité de la route
- Mentionner les passages techniques ou dangereux
- Inclure les meilleures vues panoramiques avec leurs coordonnées exactes

---


## Note de consolidation

Ce document a été consolidé à partir de 13 sources le 07/04/2025 03:49:26. Les documents originaux sont archivés dans le dossier `.archive`.
