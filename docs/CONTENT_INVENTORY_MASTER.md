# Inventaire Complet du Contenu - Velo-Altitude

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
