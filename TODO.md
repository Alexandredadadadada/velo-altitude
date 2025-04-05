# TODO Liste - Grand Est Cyclisme

Ce document liste les tâches restantes à effectuer pour finaliser le projet Grand Est Cyclisme, organisées par priorité.

## Priorité Haute

### Corrections de build
- [x] Exécuter un build complet avec `npm run build -- --stats-error-details` pour identifier toutes les erreurs restantes
- [x] Corriger les erreurs CSS relatives aux références d'images manquantes dans le module Social
- [x] Créer les dossiers manquants pour les images
- [x] Terminer l'implementation de CopyWebpackPlugin pour les assets statiques
- [x] Résoudre le conflit d'index.html avec configuration webpack.fix.js

### Documentation
- [x] Mettre à jour BUILD_ISSUES.md avec les solutions implémentées
- [x] Créer CHANGELOG.md pour suivre les modifications
- [x] Créer PROGRESS.md pour suivre l'avancement
- [x] Mettre à jour GUIDE_DEVELOPPEUR.md avec les solutions techniques
- [x] Compléter le README.md avec les instructions de déploiement
- [x] Créer un guide de test pour le module Explorateur de Cols (TEST_COLEXPLORER.md)

## Priorité Moyenne

### Module Explorateur de Cols
- [x] Corriger les chemins d'API dans EnhancedColDetail.js
- [x] Ajouter un système de fallback pour les images météo
- [x] Créer le composant LineChartComponent pour le chargement paresseux des graphiques
- [x] Créer un système de cache météo pour améliorer les performances
- [x] Optimiser les performances du chargement de la carte avec lazy loading
- [x] Améliorer la réactivité sur mobile via CSS
- [ ] Tester toutes les fonctionnalités de navigation et d'affichage des cols

### Module Nutrition
- [ ] Valider la logique de calcul de NutritionPlanner.js
- [ ] Tester la génération des plans nutritionnels
- [ ] Documenter les algorithmes de calcul nutritionnel
- [ ] Ajouter des exemples de plans nutritionnels prédéfinis

### Module Training
- [x] Finaliser TrainingPlanBuilder.js
- [x] Valider les calculs du FTPCalculator.js
- [x] Intégrer les plans d'entraînement avec le calendrier
- [x] Documenter les formules de calcul utilisées

## Priorité Basse

### Module Social
- [ ] Ajouter les images manquantes dans le dossier social
- [ ] Tester les interactions sociales (commentaires, partages)
- [ ] Optimiser le chargement des flux sociaux

### Styles et Interface
- [x] Améliorer la réactivité mobile du module Explorateur de Cols
- [x] Créer des animations pour améliorer l'expérience utilisateur
- [ ] Valider la cohérence des styles sur tous les composants
- [ ] Tester la réactivité sur mobile des autres modules (Nutrition, Training, Social)
- [ ] Optimiser les transitions et animations restantes

### Tests et Performance
- [x] Ajouter des tests unitaires pour les composants clés
- [ ] Effectuer des tests de performance (Lighthouse)
- [ ] Optimiser le bundle size (code splitting)

## Notes additionnelles

- Pour chaque tâche terminée, cocher la case et mettre à jour le fichier PROGRESS.md
- Pour chaque correction majeure, ajouter une entrée dans CHANGELOG.md
- Pour chaque décision technique importante, documenter dans GUIDE_DEVELOPPEUR.md
- Suivre les standards de code établis dans le projet
