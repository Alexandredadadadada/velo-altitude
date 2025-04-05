# Documentation des Recettes Nutritionnelles

## Aperçu

Le module de recettes nutritionnelles de Dashboard-Velo comprend 50 recettes spécialement conçues pour les cyclistes, réparties en 5 catégories principales, chacune adaptée à des moments spécifiques de l'entraînement et de la récupération. Ces recettes sont optimisées pour fournir la nutrition appropriée aux cyclistes selon leurs besoins spécifiques.

## Structure et Organisation

### Catégories de Recettes

Les recettes sont organisées en 5 catégories principales :

1. **Petit-déjeuner** (10 recettes) - Pour bien commencer la journée et préparer les sorties matinales
2. **Pré-sortie** (10 recettes) - À consommer 1-3 heures avant l'effort
3. **Pendant la sortie** (10 recettes) - Collations et aliments faciles à transporter et digérer
4. **Post-sortie** (10 recettes) - Optimisées pour la récupération après l'effort
5. **Collations** (10 recettes) - Options nutritives pour les petits creux entre les repas

### Structure des Recettes

Chaque recette suit une structure standardisée :

```javascript
{
  id: 'overnight-oats-fruits-rouges',
  name: 'Overnight Oats aux Fruits Rouges',
  category: 'breakfast',
  image: '/images/recipes/overnight-oats.jpg',
  prepTime: 10, // minutes
  cookTime: 0, // minutes
  restTime: 240, // minutes (temps de repos/réfrigération)
  totalTime: 250, // minutes
  difficulty: 'facile',
  servings: 1,
  nutritionPerServing: {
    calories: 385,
    carbs: 65, // grammes
    protein: 12, // grammes
    fat: 8, // grammes
    fiber: 9, // grammes
    sugar: 18 // grammes
  },
  ingredients: [
    '50g de flocons d\'avoine',
    '150ml de lait d\'amande',
    '1 cuillère à soupe de graines de chia',
    '100g de fruits rouges mixtes',
    '1 cuillère à café de miel',
    '1 cuillère à café d\'extrait de vanille'
  ],
  instructions: [
    'Dans un bocal, mélangez les flocons d\'avoine, le lait d\'amande et les graines de chia.',
    'Ajoutez le miel et l\'extrait de vanille, puis mélangez bien.',
    'Incorporez la moitié des fruits rouges et mélangez à nouveau.',
    'Fermez le bocal et réfrigérez toute la nuit (ou au moins 4 heures).',
    'Au moment de servir, garnissez avec le reste des fruits rouges.'
  ],
  tips: [
    'Préparez plusieurs portions à l\'avance pour toute la semaine.',
    'Variez les fruits selon les saisons et vos préférences.'
  ],
  dietary: ['vegetarien'], // options: vegetarien, vegan, sans-gluten, sans-lactose
  trainingPhase: ['endurance', 'recuperation'],
  nutrientFocus: ['glucides-complexes', 'proteines', 'antioxydants'],
  bestFor: ['sortie-matinale', 'recuperation'],
  variations: [
    {
      name: 'Version protéinée',
      change: 'Ajoutez une cuillère de protéine en poudre et réduisez le miel.'
    },
    {
      name: 'Version énergétique',
      change: 'Ajoutez une banane écrasée et une cuillère à soupe de beurre d\'amande.'
    }
  ]
}
```

## Fonctionnalités Principales

### 1. Filtrage et Recherche

Le module permet de filtrer et rechercher les recettes selon plusieurs critères :

```javascript
// Exemple d'utilisation
import { searchRecipes } from '../data/recipes';

const filteredRecipes = searchRecipes({
  category: 'pre-ride',
  dietary: 'vegetarien',
  maxPrepTime: 15,
  nutrientFocus: 'glucides-complexes'
});
```

### 2. Ajustement des Portions

Les recettes peuvent être ajustées automatiquement pour différentes portions :

```javascript
import { adjustRecipeServings } from '../services/recipeService';

const adjustedRecipe = adjustRecipeServings(recipe, 3); // Ajuste pour 3 personnes
```

### 3. Plan Nutritionnel Hebdomadaire

Les recettes s'intègrent au planificateur de nutrition hebdomadaire :

```javascript
import { generateWeeklyPlan } from '../services/nutritionPlanService';

const userProfile = {
  weight: 75, // kg
  height: 180, // cm
  age: 35,
  gender: 'male',
  activityLevel: 'very-active',
  trainingPhase: 'build'
};

const weeklyPlan = generateWeeklyPlan(userProfile);
// Retourne un plan avec des recettes adaptées pour chaque repas de la semaine
```

## Détail des Catégories

### 1. Petit-déjeuner

Les recettes de petit-déjeuner sont conçues pour :
- Fournir une base solide d'énergie pour la journée
- Proposer un équilibre entre glucides complexes, protéines et graisses saines
- S'adapter aux sorties matinales ou aux journées de repos

**Exemples :**
- Porridge protéiné aux fruits et noix
- Omelette aux légumes et patates douces
- Smoothie bowl énergétique

### 2. Pré-sortie

Les recettes pré-sortie visent à :
- Optimiser les réserves de glycogène
- Être digestes et éviter les problèmes gastro-intestinaux
- Fournir une énergie durable pour l'effort à venir

**Exemples :**
- Riz au lait d'amande et compote de pommes
- Wrap au poulet et patate douce
- Pancakes à la banane et sirop d'érable

### 3. Pendant la sortie

Les recettes pour pendant l'effort sont :
- Faciles à transporter et à consommer sur le vélo
- Riches en glucides rapidement assimilables
- Formulées pour éviter les problèmes digestifs

**Exemples :**
- Barres énergétiques maison aux dattes et noix
- Boules d'énergie au beurre d'amande
- Gel énergétique naturel à la banane et miel

### 4. Post-sortie

Les recettes post-sortie se concentrent sur :
- La récupération musculaire avec un bon apport en protéines
- La reconstitution des réserves de glycogène
- L'hydratation et les électrolytes

**Exemples :**
- Smoothie récupération banane-myrtille et protéines
- Bowl de quinoa au poulet et légumes rôtis
- Omelette aux pommes de terre et fromage frais

### 5. Collations

Les collations sont conçues pour :
- Fournir une nutrition de qualité entre les repas
- Maintenir une glycémie stable
- S'adapter aux besoins caloriques des cyclistes actifs

**Exemples :**
- Muffins protéinés aux myrtilles
- Houmous maison et crudités
- Yaourt grec aux fruits et granola

## Considérations Nutritionnelles

### Besoins Caloriques

Les recettes tiennent compte des besoins caloriques élevés des cyclistes actifs :

| Niveau d'activité | Besoins caloriques approximatifs (homme 75kg) |
|-------------------|----------------------------------------------|
| Journée légère    | 2500-2800 kcal                               |
| Entraînement modéré | 3000-3500 kcal                             |
| Entraînement intensif | 3500-4500 kcal                           |
| Sortie longue (>4h) | 4000-5000+ kcal                            |

### Répartition Macronutriments

Les recettes respectent généralement ces répartitions, adaptées selon le moment et l'objectif :

| Phase d'entraînement | Glucides | Protéines | Lipides |
|----------------------|----------|-----------|---------|
| Endurance générale   | 55-65%   | 15-20%    | 20-30%  |
| Haute intensité      | 60-70%   | 15-20%    | 15-25%  |
| Récupération         | 50-60%   | 20-25%    | 20-25%  |
| Perte de poids       | 40-50%   | 25-30%    | 25-30%  |

### Timing Nutritionnel

Les recettes sont également optimisées selon le timing par rapport à l'effort :

| Moment | Objectif principal | Focus nutritionnel |
|--------|-------------------|-------------------|
| 3-4h avant | Remplir glycogène | Glucides complexes, protéines modérées |
| 1-2h avant | Énergie sans lourdeur | Glucides simples et complexes, faible en gras |
| Pendant | Carburant continu | Glucides simples, électrolytes |
| 0-30min après | Démarrer récupération | Glucides simples, protéines rapides |
| 1-2h après | Récupération complète | Glucides complexes, protéines, micronutriments |

## Intégration avec les Autres Modules

Les recettes nutritionnelles s'intègrent avec :

1. **Programmes d'entraînement** : Recommandations nutritionnelles adaptées à la phase d'entraînement
2. **Profil utilisateur** : Adaptation selon les préférences et restrictions alimentaires
3. **Suivi d'activité** : Recommandations basées sur les données d'entraînement récentes

## Adaptations et Personnalisation

### Adaptations Diététiques

Toutes les recettes sont marquées pour les régimes spécifiques :
- Végétarien
- Végétalien (vegan)
- Sans gluten
- Sans lactose
- Faible en FODMAP (pour les sensibilités digestives)

### Personnalisation selon les Objectifs

Les recettes peuvent être filtrées selon différents objectifs :
- Perte de poids
- Prise de masse/force
- Performance pure
- Endurance longue distance
- Récupération optimale

## Utilisations dans l'Interface

Les recettes sont accessibles via plusieurs composants de l'interface :

1. **NutritionRecipeExplorer** : Permet de parcourir et filtrer toutes les recettes
2. **WeeklyNutritionPlanner** : Intègre les recettes dans un plan hebdomadaire
3. **TrainingProgramRecipes** : Suggère des recettes spécifiques adaptées au programme d'entraînement actuel
4. **RecipeDetail** : Affiche les détails complets d'une recette avec instructions et valeurs nutritionnelles

## Évolutions Futures

Pour l'évolution future du module de recettes, nous prévoyons :

1. Intégration d'un système de notation et commentaires par les utilisateurs
2. Création d'une section de recettes communautaires
3. Implémentation d'un calculateur automatique de valeurs nutritionnelles
4. Possibilité d'ajouter les ingrédients directement à une liste de courses
5. Développement d'un système de recommandation basé sur les préférences et les habitudes

## Conclusion

Le module de recettes nutritionnelles constitue un élément essentiel de l'application Dashboard-Velo, offrant aux cyclistes des solutions nutritionnelles adaptées à leurs besoins spécifiques. Avec 50 recettes réparties en 5 catégories stratégiques, ce module fournit une base solide pour soutenir la performance, la récupération et le bien-être général des cyclistes de tous niveaux.
