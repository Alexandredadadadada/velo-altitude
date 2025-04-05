# Guide de Structure d'URL pour Velo-Altitude

Ce document détaille la structure d'URL mise en place pour Velo-Altitude, optimisée pour le référencement (SEO) et l'expérience utilisateur.

## Table des matières

1. [Principes généraux](#principes-généraux)
2. [Structure hiérarchique](#structure-hiérarchique)
3. [Conventions de nommage](#conventions-de-nommage)
4. [Internationalisation](#internationalisation)
5. [Paramètres d'URL](#paramètres-durl)
6. [Implémentation technique](#implémentation-technique)
7. [Bonnes pratiques](#bonnes-pratiques)

## Principes généraux

La structure d'URL de Velo-Altitude suit ces principes fondamentaux :

- **Lisibilité humaine** : URLs claires et descriptives
- **Hiérarchie logique** : Organisation reflétant la structure du contenu
- **Cohérence** : Format standardisé à travers tout le site
- **Optimisation SEO** : URLs favorisant le référencement naturel
- **Support multilingue** : Structure adaptée à l'internationalisation

## Structure hiérarchique

### Format général

```
https://www.velo-altitude.com/[langue]/[section]/[sous-section]/[identifiant]
```

- **langue** : Code de langue (optionnel, absent pour le français qui est la langue par défaut)
- **section** : Catégorie principale du contenu
- **sous-section** : Catégorie secondaire (optionnelle)
- **identifiant** : Slug unique identifiant la ressource

### Sections principales

| Section | Description | Exemple d'URL |
|---------|-------------|---------------|
| `cols` | Catalogue des cols cyclistes | `/cols/alpe-d-huez` |
| `training` | Programmes d'entraînement | `/training/debutant-premier-col` |
| `nutrition` | Recettes et plans nutritionnels | `/nutrition/recipes/barres-energie-chocolat-banane` |
| `seven-majors` | Défis "7 Majeurs" | `/seven-majors/alpes-challenge` |
| `community` | Contenu communautaire | `/community/challenges/above-2500` |
| `about` | Pages informatives | `/about/team` |
| `sitemap` | Plan du site | `/sitemap` |

### Sous-sections

#### Nutrition

| Sous-section | Description | Exemple d'URL |
|--------------|-------------|---------------|
| `recipes` | Recettes pour cyclistes | `/nutrition/recipes/recovery-smoothie` |
| `plans` | Plans nutritionnels | `/nutrition/plans/cycliste-debutant` |
| `hydration` | Conseils d'hydratation | `/nutrition/hydration` |
| `calculator` | Calculateurs nutritionnels | `/nutrition/calculator` |

#### Training

| Sous-section | Description | Exemple d'URL |
|--------------|-------------|---------------|
| `programs` | Programmes complets | `/training/programs/col-crusher` |
| `hiit` | Séances HIIT | `/training/hiit` |
| `performance` | Suivi de performance | `/training/performance` |
| `recovery` | Récupération | `/training/recovery` |

#### Community

| Sous-section | Description | Exemple d'URL |
|--------------|-------------|---------------|
| `challenges` | Défis communautaires | `/community/challenges/above-2500` |
| `events` | Événements cyclistes | `/community/events/grand-tour-alpes` |
| `forum` | Forum de discussion | `/community/forum` |
| `stories` | Récits d'aventures | `/community/stories/traversee-alpes` |

#### About

| Sous-section | Description | Exemple d'URL |
|--------------|-------------|---------------|
| `team` | L'équipe | `/about/team` |
| `contact` | Contact | `/about/contact` |
| `privacy` | Politique de confidentialité | `/about/privacy` |
| `terms` | Conditions d'utilisation | `/about/terms` |

## Conventions de nommage

### Règles générales pour les slugs

- Utiliser uniquement des caractères alphanumériques minuscules et des tirets (`-`)
- Éviter les caractères spéciaux, accents et espaces
- Limiter la longueur à 60 caractères maximum
- Inclure des mots-clés pertinents
- Éviter les mots vides (le, la, les, de, etc.)

### Exemples par type de contenu

#### Cols

Format : `[nom-du-col]`

Exemples :
- `/cols/alpe-d-huez`
- `/cols/col-du-galibier`
- `/cols/mont-ventoux`

#### Programmes d'entraînement

Format : `[niveau]-[objectif-principal]`

Exemples :
- `/training/debutant-premier-col`
- `/training/avance-haute-montagne`
- `/training/preparation-etape-du-tour`

#### Recettes

Format : `[nom-descriptif-de-la-recette]`

Exemples :
- `/nutrition/recipes/barres-energie-chocolat-banane`
- `/nutrition/recipes/smoothie-recuperation-framboise`
- `/nutrition/recipes/porridge-pre-entrainement`

#### Défis "7 Majeurs"

Format : `[région/thème]-challenge`

Exemples :
- `/seven-majors/alpes-challenge`
- `/seven-majors/pyrenees-adventure`
- `/seven-majors/above-2000-challenge`

## Internationalisation

### Structure multilingue

- **Français** (langue par défaut) : Pas de préfixe
  ```
  https://www.velo-altitude.com/cols/alpe-d-huez
  ```

- **Anglais** : Préfixe `/en`
  ```
  https://www.velo-altitude.com/en/cols/alpe-d-huez
  ```

- **Autres langues** : Préfixe avec le code ISO de la langue
  ```
  https://www.velo-altitude.com/de/cols/alpe-d-huez
  ```

### URLs canoniques et alternatives

- Chaque page a une URL canonique (version principale)
- Les balises `hreflang` indiquent les versions linguistiques alternatives
- La structure reste cohérente entre les différentes langues

## Paramètres d'URL

Les paramètres suivants sont standardisés à travers le site :

| Paramètre | Description | Valeurs possibles | Exemple |
|-----------|-------------|-------------------|---------|
| `lang` | Langue d'affichage | `fr`, `en`, `de`, `it`, `es` | `?lang=en` |
| `unit` | Système d'unités | `metric`, `imperial` | `?unit=imperial` |
| `difficulty` | Niveau de difficulté | `easy`, `medium`, `hard`, `extreme` | `?difficulty=medium` |
| `duration` | Durée | `short`, `medium`, `long` | `?duration=long` |
| `altitude` | Filtrer par altitude | Valeur numérique en mètres | `?altitude=2000` |
| `sort` | Tri des résultats | `name`, `altitude`, `difficulty`, `date` | `?sort=altitude` |
| `page` | Pagination | Numéro de page | `?page=2` |

## Implémentation technique

### Fichiers clés

- **urlManager.js** : Utilitaire central pour la gestion des URLs
- **routeConfig.js** : Configuration des routes React avec métadonnées SEO
- **SeoLink.js** : Composant React pour générer des liens optimisés SEO
- **BreadcrumbTrail.js** : Composant de fil d'Ariane avec balisage structuré

### Utilisation du gestionnaire d'URL

```javascript
// Importer le gestionnaire d'URL
import * as urlManager from '../utils/urlManager';

// Générer une URL pour un col
const colUrl = urlManager.getColUrl('alpe-d-huez');
// Résultat: "/cols/alpe-d-huez"

// Générer une URL pour une recette en anglais
const recipeUrl = urlManager.getRecipeUrl('energy-bars', 'en');
// Résultat: "/en/nutrition/recipes/energy-bars"

// Générer une URL avec filtres
const filteredUrl = urlManager.getFilteredListUrl('cols', null, { 
  difficulty: 'hard', 
  altitude: 2000 
});
// Résultat: "/cols?difficulty=hard&altitude=2000"
```

### Utilisation du composant SeoLink

```jsx
// Importer le composant SeoLink
import SeoLink from '../components/common/SeoLink';

// Lien vers un col
<SeoLink type="col" slug="alpe-d-huez" title="Découvrir l'Alpe d'Huez">
  Alpe d'Huez
</SeoLink>

// Lien vers une recette en anglais
<SeoLink type="recipe" slug="energy-bars" lang="en">
  Energy Bars
</SeoLink>

// Lien vers une liste filtrée
<SeoLink 
  type="filtered-list" 
  slug="cols" 
  params={{ difficulty: 'hard', altitude: 2000 }}
>
  Cols difficiles au-dessus de 2000m
</SeoLink>
```

## Bonnes pratiques

### Pour les développeurs

1. **Toujours utiliser les utilitaires** :
   - Utiliser `urlManager.js` pour générer les URLs
   - Utiliser `SeoLink` pour les liens internes

2. **Maintenir la cohérence** :
   - Respecter la structure hiérarchique
   - Suivre les conventions de nommage

3. **Éviter les redirections** :
   - Ne pas changer les URLs existantes sans redirection 301
   - Utiliser le système de routage pour gérer les anciennes URLs

### Pour les éditeurs de contenu

1. **Choisir des slugs descriptifs** :
   - Inclure des mots-clés pertinents
   - Rester concis et clair

2. **Vérifier l'unicité** :
   - S'assurer que chaque slug est unique dans sa section
   - Utiliser l'outil de vérification avant publication

3. **Maintenir la cohérence linguistique** :
   - Utiliser la même structure dans toutes les langues
   - Traduire les slugs de manière cohérente

---

Document créé le 6 avril 2025 | Dernière mise à jour: 6 avril 2025
