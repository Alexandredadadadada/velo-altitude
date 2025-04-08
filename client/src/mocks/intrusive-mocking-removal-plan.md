# Plan de suppression du mocking intrusif

Ce document trace notre progression dans le remplacement des importations directes de données mockées par des appels à l'API via RealApiOrchestrator.

## Services identifiés

### 1. optimizedDataService.js

- **Emplacement**: `src/services/optimizedDataService.js`
- **Fonction**: Service optimisé pour les requêtes de données avec mise en cache et filtrage
- **Usage de mocks**: Utilise une vérification de `process.env.REACT_APP_USE_MOCK_DATA` et possède une méthode `_getMockData` pour importer des données mockées en fonction du type de données
- **Status**: ✅ Remplacé par des appels à RealApiOrchestrator

### 2. nutritionService.js

- **Emplacement**: `src/services/nutritionService.js`
- **Fonction**: Gestion des données nutritionnelles, calcul des besoins, gestion des recettes
- **Usage de mocks**: Utilise `process.env.REACT_APP_USE_MOCK_DATA` dans de nombreuses méthodes pour décider d'utiliser des fonctions de mock locales au lieu d'appels API
- **Status**: ✅ Remplacé par des appels à RealApiOrchestrator

### 3. groupRideService.js (Exemple de bonne pratique)

- **Emplacement**: `client/src/services/groupRideService.js`
- **Fonction**: Gestion des sorties cyclistes en groupe
- **Approche**: Utilise directement `apiWrapper` qui est configuré pour que MSW intercepte automatiquement les requêtes en mode développement
- **Status**: ✅ Conforme - Aucune modification nécessaire (ne contient pas de mocking intrusif)

## Stratégie de remplacement appliquée

Pour chaque service, nous avons :

1. Identifié les méthodes qui utilisent `process.env.REACT_APP_USE_MOCK_DATA`
2. Déterminé les équivalents dans RealApiOrchestrator
3. Remplacé les conditions basées sur REACT_APP_USE_MOCK_DATA par des appels à RealApiOrchestrator
4. Conservé temporairement les fonctions de fallback en cas d'erreur pour assurer la robustesse

## Détails des remplacements

| Service | Méthode | Remplacé | Équivalent RealApiOrchestrator |
|---------|---------|----------|---------------------------------|
| optimizedDataService | getColData | ✅ | RealApiOrchestrator.getColById ou getAllCols |
| optimizedDataService | getTrainingPrograms | ✅ | RealApiOrchestratorPart2.getUserTrainingPlans |
| optimizedDataService | getNutritionRecipes | ✅ | RealApiOrchestratorPart2.getNutritionRecipes |
| optimizedDataService | getUserProfile | ✅ | RealApiOrchestrator.getUserProfile |
| nutritionService | getUserNutritionData | ✅ | RealApiOrchestratorPart2.getUserNutritionPlan |
| nutritionService | calculateNutrition | ✅ | Conservé calcul local (opération sans données persistantes) |
| nutritionService | getRecipes | ✅ | RealApiOrchestratorPart2.getNutritionRecipes |
| nutritionService | getUserFavoriteRecipes | ✅ | Fallback vers mock (API à étendre) |
| nutritionService | addToFavorites | ✅ | Fallback vers mock (API à étendre) |
| nutritionService | removeFromFavorites | ✅ | Fallback vers mock (API à étendre) |
| nutritionService | getUserFavorites | ✅ | Fallback vers mock (API à étendre) |
| nutritionService | addToSaved | ✅ | Fallback vers mock (API à étendre) |
| nutritionService | removeFromSaved | ✅ | Fallback vers mock (API à étendre) |
| nutritionService | getUserSaved | ✅ | Fallback vers mock (API à étendre) |
| nutritionService | getRecipeById | ✅ | RealApiOrchestratorPart2.getNutritionRecipe |
| nutritionService | generateMealPlan | ✅ | Fallback vers mock (API à étendre) |
| nutritionService | syncWithTrainingPlan | ✅ | Fallback vers mock (API à étendre) |

## Leçons apprises

1. **Approche moderne avec MSW** : Le service `groupRideService.js` montre la bonne pratique à suivre - utiliser directement un wrapper API standard et s'appuyer sur MSW pour intercepter les requêtes en mode développement, sans avoir à ajouter de la logique conditionnelle de mocking dans le code du service.

2. **Transition progressive** : Pour les services existants avec du mocking intrusif, nous avons opté pour une approche progressive :
   - Remplacer les appels aux mocks par des appels à RealApiOrchestrator
   - Conserver temporairement les fallbacks vers les données mockées en cas d'erreur
   - Prévoir d'éliminer ces fallbacks une fois la stabilité assurée

## Prochaines étapes

1. **Tests** : Vérifier que les services continuent de fonctionner correctement avec les remplacements de mocks
2. **Extension de l'API** : Compléter RealApiOrchestrator avec les méthodes manquantes
3. **Nettoyage** : Une fois que tous les tests passent, supprimer les imports de données mockées qui ne sont plus nécessaires
4. **Environnement de développement** : Mettre à jour la configuration pour utiliser MSW par défaut en développement
5. **Standardisation** : Migrer progressivement tous les services vers l'approche utilisée par `groupRideService.js` (usage direct d'apiWrapper + MSW)
