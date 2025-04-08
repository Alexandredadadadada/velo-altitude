# Velo-Altitude : Corrections d'intégration

Ce document recense les adaptateurs et modifications réalisés lors de la phase finale d'intégration du projet Velo-Altitude, afin de résoudre les incohérences entre les travaux des différentes équipes.

## Adaptateurs créés

| Composant attendu | Emplacement | Adaptateur vers |
|-------------------|-------------|-----------------|
| WeatherWidget | src/components/widgets/WeatherWidget.js | components/weather/WeatherDashboard.js |
| StatsSummary | src/components/home/StatsSummary.js | components/training/TrainingStats.js |
| RegionMap | src/components/maps/RegionMap.js | components/cols/MapComponent.js |
| NewsCard | src/components/home/NewsCard.js | Créé directement |
| EventsCarousel | src/components/home/EventsCarousel.js | Créé directement |
| BikeAnimationCanvas | src/components/animations/BikeAnimationCanvas.js | Créé directement |

## Fichiers de configuration ajoutés

| Fichier | Emplacement | Description |
|---------|-------------|-------------|
| constants.js | src/config/constants.js | Fichier de constantes globales avec API_BASE_URL, clés d'API et autres paramètres |
| endurancePrograms.js | src/data/endurancePrograms.js | Programmes d'entraînement d'endurance pour cyclistes, adaptés pour être compatibles avec le FTPCalculator et les zones d'entraînement |
| classicPrograms.js | src/data/classicPrograms.js | Programmes d'entraînement classiques pour cyclistes, incluant le développement de puissance et la préparation aux compétitions |
| remainingTrainingPrograms3.js | src/data/remainingTrainingPrograms3.js | Programmes complémentaires axés sur la maîtrise technique et la préparation mentale, conçus pour fonctionner avec le FTPCalculator |

## Gestion des dépendances

| Dépendance | Version installée | Raison |
|------------|-------------------|--------|
| react-helmet | latest | Gestion des métadonnées de page (SEO) |
| react-map-gl | 6.1.19 | Compatibilité avec le code existant et éviter les problèmes d'exportation |
| react-intersection-observer | latest | Détection des éléments visibles dans le viewport pour les animations |
| react-bootstrap | latest | Composants d'interface utilisateur Bootstrap pour React |
| bootstrap | latest | Framework CSS pour le design responsive |
| react-lazy-load-image-component | latest | Optimisation du chargement des images |
| @fortawesome/react-fontawesome | latest | Intégration des icônes Font Awesome |
| @fortawesome/fontawesome-svg-core | latest | Noyau de Font Awesome pour React |
| @fortawesome/free-solid-svg-icons | latest | Pack d'icônes solides Font Awesome |
| @fortawesome/free-brands-svg-icons | latest | Pack d'icônes de marques Font Awesome |
| @fortawesome/free-regular-svg-icons | latest | Pack d'icônes régulières Font Awesome |
| react-window | latest | Rendu efficace de grandes listes et grilles |
| react-window-infinite-loader | latest | Chargement infini pour react-window |
| react-virtualized-auto-sizer | latest | Dimensionnement automatique pour les listes virtualisées |

## Problèmes rencontrés et solutions

1. **Incohérences de nommage** : Les différentes équipes ont utilisé des noms de composants différents, ce qui a provoqué des erreurs lors de l'importation.
   - *Solution* : Création d'adaptateurs qui réexportent les composants existants sous les noms attendus.

2. **Dépendances manquantes** : Certaines bibliothèques externes n'étaient pas installées ou l'étaient dans des versions incompatibles.
   - *Solution* : Installation des bibliothèques manquantes et spécification des versions compatibles.

3. **Composants manquants** : Certains composants référencés n'existaient pas du tout et ont dû être créés.
   - *Solution* : Création de composants simplifiés mais fonctionnels pour compléter la base de code.

## Refactorisation future recommandée

Pour une meilleure maintenabilité du code à long terme, nous recommandons :

1. Standardiser les conventions de nommage des composants
2. Consolider les composants redondants (ex: différentes versions de cartes)
3. Mettre en place un système de documentation automatique
4. Créer une bibliothèque de composants interne avec storybook

## Variables d'environnement requises pour Netlify

Voir le fichier NETLIFY_DEPLOYMENT.md pour la liste complète des variables d'environnement à configurer dans le dashboard Netlify.
