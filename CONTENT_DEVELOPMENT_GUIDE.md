# Guide de Développement du Contenu - Velo-Altitude

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
