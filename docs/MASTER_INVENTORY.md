# Inventaire Principal - Velo-Altitude

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
