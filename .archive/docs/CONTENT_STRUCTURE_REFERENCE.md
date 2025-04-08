# Référence de Structure de Contenu - Velo-Altitude

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
