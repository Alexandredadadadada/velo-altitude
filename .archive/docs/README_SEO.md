# Stratégie SEO pour Velo-Altitude

Ce document présente la stratégie SEO mise en place pour Velo-Altitude, plateforme dédiée au cyclisme de montagne. Il détaille les optimisations techniques, les structures de données, et les bonnes pratiques à suivre pour maintenir et améliorer le référencement du site.

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Optimisations techniques](#optimisations-techniques)
3. [Structure des données](#structure-des-données)
4. [Contenu optimisé](#contenu-optimisé)
5. [Internationalisation](#internationalisation)
6. [Maintenance et mise à jour](#maintenance-et-mise-à-jour)
7. [Outils de suivi](#outils-de-suivi)

## Vue d'ensemble

Velo-Altitude vise à devenir la référence européenne pour le cyclisme de montagne. La stratégie SEO est conçue pour maximiser la visibilité du site dans les moteurs de recherche, en ciblant les cyclistes francophones et internationaux intéressés par les cols, l'entraînement spécifique et la nutrition adaptée.

### Objectifs SEO

- Positionner Velo-Altitude comme la référence pour les informations sur les cols cyclistes
- Attirer un trafic qualifié d'amateurs de cyclisme de montagne
- Optimiser l'indexation des contenus riches (fiches de cols, programmes d'entraînement, recettes)
- Améliorer l'expérience utilisateur pour réduire le taux de rebond
- Favoriser le partage et la viralité des contenus

## Optimisations techniques

### Fichiers essentiels

- **robots.txt**: Situé dans `/public/robots.txt`, il indique aux moteurs de recherche quelles pages indexer ou non
- **sitemap.xml**: Situé dans `/public/sitemap.xml`, il liste toutes les URLs du site pour faciliter l'indexation
- **Script de génération de sitemap**: Situé dans `/scripts/generateSitemap.js`, permet de mettre à jour automatiquement le sitemap

### Prérendu pour les moteurs de recherche

Le site utilise une configuration de prérendu (voir `prerender-config.js`) pour générer des versions statiques des pages, améliorant ainsi l'indexation du contenu dynamique React par les moteurs de recherche.

### Performance

- Lazy loading des composants React pour améliorer les temps de chargement
- Optimisation des images avec des formats modernes (WebP) et des dimensions adaptées
- Mise en cache appropriée des ressources statiques

### Plan du site HTML

Un plan du site HTML accessible aux utilisateurs (`/sitemap`) a été créé pour améliorer la navigation et l'indexation.

## Structure des données

### Données structurées (Schema.org)

Des schémas JSON-LD ont été implémentés pour les types de contenu suivants :

1. **Cols** (`generateColSchema` dans `schemaTemplates.js`)
   - Type: Place, TouristAttraction
   - Propriétés: elevation, geo, description, image, etc.

2. **Programmes d'entraînement** (`generateTrainingProgramSchema` dans `schemaTemplates.js`)
   - Type: Course
   - Propriétés: name, description, provider, timeRequired, etc.

3. **Recettes** (`generateRecipeSchema` dans `schemaTemplates.js`)
   - Type: Recipe
   - Propriétés: name, recipeIngredient, recipeInstructions, nutrition, etc.

### Métadonnées

Le fichier `seoMetadata.js` centralise toutes les métadonnées SEO du site, organisées par section et par langue.

## Contenu optimisé

### Pages optimisées

Des composants spécifiques ont été créés pour optimiser les pages clés :

- `EnhancedColDetail.js`: Détail des cols avec données structurées
- `EnhancedTrainingDetail.js`: Programmes d'entraînement avec données structurées
- `EnhancedRecipeDetail.js`: Recettes avec données structurées

### Balises meta

Le composant `SEOHead.js` gère l'insertion des balises meta pour chaque page :
- Title
- Description
- Open Graph (pour le partage sur les réseaux sociaux)
- Twitter Cards
- Canonical URLs
- Hreflang (pour l'internationalisation)

## Internationalisation

Le site est disponible en français (langue principale) et en anglais. La stratégie SEO prend en compte cette dimension multilingue :

- Balises hreflang pour indiquer les versions linguistiques alternatives
- URLs localisées (ex: `/en/cols` pour la version anglaise)
- Métadonnées traduites dans chaque langue
- Contenu adapté culturellement (pas seulement traduit)

## Maintenance et mise à jour

### Processus de mise à jour

1. **Ajout de nouvelles pages**:
   - Ajouter la route dans `App.js`
   - Créer les métadonnées dans `seoMetadata.js`
   - Générer un nouveau sitemap avec `npm run generate-sitemap`

2. **Mise à jour du contenu existant**:
   - Mettre à jour les métadonnées correspondantes
   - Vérifier la cohérence des données structurées

### Bonnes pratiques

- Maintenir des URLs propres et descriptives
- Utiliser des mots-clés pertinents dans les titres et descriptions
- Créer du contenu original et de qualité
- Optimiser les images avec des attributs alt descriptifs
- Maintenir une structure de liens internes cohérente

## Outils de suivi

### Outils recommandés

- **Google Search Console**: Pour suivre l'indexation et les performances dans les résultats de recherche
- **Google Analytics**: Pour analyser le trafic et le comportement des utilisateurs
- **Lighthouse**: Pour évaluer les performances, l'accessibilité et le SEO
- **Schema Validator**: Pour vérifier la validité des données structurées

### Suivi des performances

Mettre en place un tableau de bord de suivi mensuel incluant :
- Positions moyennes des mots-clés cibles
- Trafic organique par section
- Taux de conversion par source de trafic
- Problèmes d'indexation détectés

---

## Ressources additionnelles

- [Documentation complète de Schema.org](https://schema.org/docs/full.html)
- [Guide SEO de Google pour les sites React](https://developers.google.com/search/docs/guides/javascript-seo-basics)
- [Stratégie SEO détaillée](./STRATEGIE_SEO.md) - Document complet de la stratégie SEO

---

Document créé le 6 avril 2025 | Dernière mise à jour: 6 avril 2025
