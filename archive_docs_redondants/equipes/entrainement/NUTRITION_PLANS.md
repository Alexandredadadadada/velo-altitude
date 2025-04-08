# Plans Nutritionnels

## Vue d'Ensemble
- **Objectif** : Documentation des plans nutritionnels et outils associés
- **Contexte** : Nutrition adaptée aux cyclistes pour l'entraînement et les défis en montagne
- **Portée** : Plus de 100 recettes, plans nutritionnels et outils de planification

## Contenu Principal
- **Catégories de Plans Nutritionnels**
  - Plans pré-saison (construction)
  - Plans spécifiques cols (avant/pendant/après)
  - Plans récupération
  - Plans spéciaux (perte poids, performance pure)

- **Structure des Recettes**
  - Recettes avant effort (charge glucidique)
  - Recettes pendant effort (énergie rapide, digestibilité)
  - Recettes récupération (protéines, anti-inflammatoires)
  - Recettes spéciales cols (altitude, chaleur, froid)

- **Outils Nutritionnels**
  - Calculateur besoins énergétiques
  - Planificateur de repas
  - Journal nutritionnel
  - Synchronisation avec données d'entraînement

- **Personnalisation**
  - Par profil physiologique
  - Par objectifs (performance, santé, poids)
  - Par préférences alimentaires et restrictions
  - Par conditions spécifiques (type de col, météo)

## Points Techniques
```javascript
// Structure d'un plan nutritionnel
const alpineNutritionPlan = {
  id: 'nutrition_haute_montagne',
  name: 'Plan nutritionnel haute montagne',
  targetScenario: 'cols_altitude',
  adaptationFactors: ['altitude', 'effort_prolongé', 'températures_variables'],
  
  phasesJournalières: {
    avantEffort: {
      objectifs: ['charge_glucidique', 'hydratation_optimale', 'électrolytes'],
      répartitionMacros: {
        glucides: { pourcentage: 65, grammes: 8, parKg: true },
        protéines: { pourcentage: 15, grammes: 1.5, parKg: true },
        lipides: { pourcentage: 20, grammes: 1, parKg: true }
      },
      repasTypes: [
        {
          moment: 'dîner_veille',
          exemple: 'pasta_loading_special',
          portions: { glucides: 'élevée', protéines: 'modérée', lipides: 'faible' },
          hydratation: 'élevée',
          sel: 'modéré'
        },
        {
          moment: 'petit_déjeuner',
          exemple: 'breakfast_alpine_challenge',
          timing: '3h avant départ',
          portions: { glucides: 'élevée', protéines: 'modérée', lipides: 'faible' },
          hydratation: 'élevée',
          spécifiques: ['faible_fibre', 'facile_digestion']
        },
        {
          moment: 'collation_prédépart',
          exemple: 'energy_booster',
          timing: '30-45min avant départ',
          portions: { glucides: 'modérée', protéines: 'faible', lipides: 'très_faible' },
          spécifiques: ['sucres_rapides', 'caféine_option']
        }
      ]
    },
    
    pendantEffort: {
      objectifs: ['énergie_constante', 'hydratation', 'électrolytes', 'prévention_crampes'],
      stratégieGlobale: 'frequent_small_intakes',
      répartitionMacros: {
        glucides: { grammesParHeure: { min: 60, target: 90, max: 120 } },
        protéines: { grammesParHeure: { min: 5, target: 10, max: 15 } },
        lipides: { minimal: true }
      },
      planHydratation: {
        base: { mlParHeure: { min: 500, target: 750, max: 1000 } },
        électrolytes: { sodium: '700-1000mg/L', potassium: '150-250mg/L' },
        adaptations: {
          chaleur: { facteurMultiplicateur: 1.5 },
          froid: { facteurMultiplicateur: 0.8 },
          altitude: { facteurMultiplicateur: 1.2 }
        }
      },
      optionsRavitaillement: [
        // Options de ravitaillement pendant l'effort
      ]
    },
    
    aprèsEffort: {
      objectifs: ['récupération_glycogène', 'réparation_musculaire', 'réhydratation'],
      fenêtreOptimale: '0-30min',
      répartitionMacros: {
        glucides: { grammes: 1.0, parKg: true },
        protéines: { grammes: 0.3, parKg: true },
        lipides: { modéré: true }
      },
      repasTypes: [
        {
          moment: 'immédiat_post_effort',
          exemple: 'alpine_recovery_shake',
          compositionClé: 'glucides:protéines 3:1',
          inclusions: ['électrolytes', 'antioxydants']
        },
        {
          moment: '1-2h_post_effort',
          exemple: 'recovery_complete_meal',
          portions: { glucides: 'élevée', protéines: 'élevée', lipides: 'modérée' },
          hydratation: 'élevée',
          spécifiques: ['anti_inflammatoires', 'facile_digestion']
        }
      ]
    }
  },
  
  adaptations: {
    températureElevée: {
      // Adaptations pour températures élevées
    },
    altitude: {
      // Adaptations pour haute altitude
    },
    duréeExtended: {
      // Adaptations pour efforts très longs
    }
  }
};
```

## Base de Recettes
- **Distribution Actuelle**
  - Avant effort: 35 recettes
  - Pendant effort: 25 recettes
  - Après effort: 30 recettes
  - Spécial cols: 15 recettes

- **Critères Nutritionnels**
  - Densité énergétique
  - Digestibilité
  - Index glycémique
  - Profil anti-inflammatoire
  - Densité micronutriments

- **Structure Technique**
  - JSON Schema pour standardisation
  - Indexation par profil nutritionnel
  - Tags multiples (timing, intensité, météo, durée)
  - Système de notation utilisateur

## Métriques et KPIs
- **Objectifs**
  - Utilisation journal nutritionnel > 60%
  - Satisfaction recettes > 4.5/5
  - Adhérence aux plans > 70%
  - Corrélation nutrition/performance > 0.7

- **Mesures actuelles**
  - Utilisation journal: 45%
  - Satisfaction recettes: 4.3/5
  - Adhérence: 65%
  - Corrélation: 0.65

## Intégration avec Autres Modules
- **Module Entraînement**
  - Synchronisation avec charge d'entraînement
  - Ajustement nutritionnel selon TSS
  - Préparation spécifique aux séances clés

- **Module Cols & Défis**
  - Planification nutritionnelle spécifique au col
  - Points de ravitaillement géolocalisés
  - Conseils adaptés au profil du col

## Technologie et Implémentation
- **Front-end**
  - Composants de planification interactive
  - Drag-and-drop meal builder
  - Visualisation macronutriments
  - Graphiques de synchronisation avec entraînement

- **Back-end**
  - Base de données recettes MongoDB
  - Moteur de règles pour recommandations
  - API nutritionnelle pour données standards
  - Algorithme de correspondance utilisateur/recette

## Maintenance
- **Responsable** : Chef d'équipe Nutrition
- **Procédures** :
  1. Ajout mensuel de nouvelles recettes
  2. Validation nutritionnelle trimestrielle
  3. Mise à jour des recommandations selon études récentes
  4. Ajustement des modèles selon feedback utilisateur

## Références
- [Burke, L. "Clinical Sports Nutrition"](https://www.mheducation.com.au/clinical-sports-nutrition-9781743073681-aus)
- [Jeukendrup, A. "Sports Nutrition"](https://www.askerjeukendrup.com/book-sports-nutrition/)
- [Thomas, T. "Nutrition for Cyclists"](https://www.humankinetics.com/)
- [Base de données nutritionnelles ANSES](https://ciqual.anses.fr/)
