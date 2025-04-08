# Changelog

Ce fichier documente les modifications apportées au projet Grand Est Cyclisme.

## [Version 1.0] - 2025-04-04

### Corrections majeures
- Résolution du conflit d'index.html lors du build
  - Création d'une configuration webpack simplifiée (webpack.fix.js)
  - Modification de CopyWebpackPlugin pour ignorer les fichiers index.html dupliqués
  - Validation du build complet sans erreurs

### Module Training
- Amélioration du FTPEstimationService avec des formules plus précises
- Validation et documentation des calculs de FTP dans FTPCalculator.js
- Intégration des plans d'entraînement avec le calendrier
- Création de tests unitaires pour valider les calculs FTP
- Ajout de la documentation DOCUMENTATION_TRAINING.md
- Intégration des tests entre TrainingPlanBuilder et le calendrier

### Module Social
- Ajout des images manquantes dans le dossier /images/social
  - default-avatar.svg
  - event-placeholder.svg
  - route-placeholder.svg
  - notification-icon.svg
  - like-icon.svg
- Implémentation du système de fallback d'images dans CommunityFeed.js
- Amélioration des fonctionnalités de base (like, commentaire)
- Intégration de react-share pour permettre le partage sur les réseaux sociaux
- Amélioration de l'interface utilisateur avec react-icons
- Implémentation d'une boîte de dialogue de partage moderne

### Tests et Optimisations
- Création des tests unitaires pour les calculs critiques (FTPCalculations.test.js)
- Ajout de tests d'intégration entre TrainingPlanBuilder et le calendrier
- Création de tests pour les interactions sociales (SocialInteractions.test.js)
- Implémentation de tests d'intégration entre modules (ModuleIntegration.test.js)
- Mise à jour de la documentation (PROGRESS.md, CHANGELOG.md)
- Vérification de la compatibilité avec les corrections de build de l'Agent 1

## [Unreleased]

### Corrections de bugs
- Résolution des problèmes de minification avec le fichier weather-map.js
  - Création d'une version simplifiée (weather-map-fixed.js) utilisant IIFE
  - Exclusion du fichier de la minification par Terser dans webpack.config.js
- Correction des chemins d'API dans EnhancedColDetail.js
- Ajout d'un mécanisme de fallback pour les images manquantes
  - Création d'un script image-fallback.js pour gérer automatiquement les images manquantes
  - Création d'une image placeholder.svg générique
  - Ajout d'un gestionnaire d'erreurs global dans index.html

### Améliorations
- Mise à jour du fichier index.html
  - Ajout d'un loader visuel pendant le chargement de l'application
  - Préchargement des ressources critiques
  - Gestion des erreurs non critiques
- Amélioration de la robustesse du composant ParallaxHeader
- Finalisation du module TrainingPlanBuilder

### Optimisations
- Modification de la configuration webpack pour optimiser le build
  - Ajout de CopyWebpackPlugin pour gérer les ressources statiques
  - Configuration des règles de traitement des fichiers CSS et images
  - Ajustement des options de minification

## [Version Initiale] - 2025-04-03
- Version initiale du projet avec problèmes de build identifiés
