# Documentation des Composants de Nutrition - Dashboard-Velo

Ce document détaille l'architecture, l'utilisation et les fonctionnalités des composants de nutrition intégrés dans l'application Dashboard-Velo, permettant aux cyclistes de gérer leurs besoins nutritionnels et d'hydratation.

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [NutritionSection](#nutritionsection)
3. [Composants spécialisés](#composants-spécialisés)
   - [NutritionCalculator](#nutritioncalculator)
   - [MacroChart](#macrochart)
   - [HydrationPlanner](#hydrationplanner)
   - [RecipeSuggestions](#recipesuggestions)
4. [Architecture des données](#architecture-des-données)
5. [Bonnes pratiques](#bonnes-pratiques)
6. [Recommandations d'utilisation](#recommandations-dutilisation)
7. [Optimisations de performance](#optimisations-de-performance)

## Vue d'ensemble

La section Nutrition de Dashboard-Velo offre une suite complète d'outils interactifs permettant aux cyclistes de gérer leurs besoins nutritionnels et d'hydratation, adaptés à leur profil personnel et au type d'activité cycliste. Cette section intègre les technologies suivantes:

- **React** pour l'interface utilisateur
- **Framer Motion** pour les animations fluides
- **Chart.js** pour la visualisation des données nutritionnelles
- **styled-components** pour le styling modulaire et réactif

L'architecture modulaire permet une maintenance facile et une évolution progressive des fonctionnalités.

## NutritionSection

Le composant `NutritionSection` est le conteneur principal qui coordonne tous les sous-composants nutritionnels. Il gère l'état global lié aux données nutritionnelles de l'utilisateur et assure la communication entre les différents outils.

### Responsabilités

- Gestion du profil nutritionnel de l'utilisateur (âge, poids, taille, etc.)
- Coordination des différents sous-composants
- Adaptation des données en fonction du niveau d'activité cycliste
- Fourniture d'une expérience utilisateur cohérente

### Utilisation

```jsx
// Dans ModernHomePage.js
import NutritionSection from '../components/home/modern/NutritionSection';

const ModernHomePage = () => {
  return (
    <div className="homepage">
      <HeroSection />
      <FeaturesSection />
      <TrainingSection />
      <NutritionSection animationComplexity="high" />
      <Footer />
    </div>
  );
};
```

### Propriétés

| Propriété | Type | Description | Valeur par défaut |
|-----------|------|-------------|------------------|
| `animationComplexity` | string | Contrôle la complexité des animations ("low", "medium", "high") | "medium" |
| `userProfile` | object | Données utilisateur préremplies (optionnel) | null |
| `onSaveProfile` | function | Callback lorsqu'un profil est sauvegardé | null |

## Composants spécialisés

### NutritionCalculator

Le composant `NutritionCalculator` permet aux utilisateurs de calculer leurs besoins caloriques et la répartition des macronutriments en fonction de leur profil et de leur niveau d'activité cycliste.

#### Fonctionnalités

- Formulaire de saisie du profil utilisateur (sexe, âge, poids, taille)
- Sélection du niveau d'activité et d'intensité cycliste
- Calcul des besoins caloriques de base et adaptés à l'activité
- Répartition recommandée des macronutriments (protéines, glucides, lipides)
- Ajustements pour les jours de course ou d'entraînement intensif

#### Algorithmes nutritionnels

Le calculateur utilise plusieurs formules scientifiques reconnues :

1. **Métabolisme de base (BMR)** : Formule de Mifflin-St Jeor
2. **Dépense énergétique totale** : BMR × facteur d'activité × intensité cycliste
3. **Ajustements pour types d'activité spécifiques** (endurance, sprints, montagne)

#### Exemple d'utilisation

```jsx
import NutritionCalculator from './nutrition/NutritionCalculator';

<NutritionCalculator 
  onCalculate={(nutritionData) => console.log(nutritionData)}
  defaultValues={{
    gender: 'male',
    age: 30,
    weight: 75,
    height: 180
  }}
  animationComplexity="medium"
/>
```

### MacroChart

Le composant `MacroChart` visualise la répartition des macronutriments et fournit des recommandations sur les sources alimentaires optimales pour chaque macronutriment.

#### Fonctionnalités

- Graphique circulaire interactif montrant la répartition des macronutriments
- Recommendations de sources alimentaires pour chaque macronutriment
- Adaptation dynamique en fonction du profil d'activité cycliste
- Possibilité d'ajuster manuellement les pourcentages

#### Structure des données

```javascript
// Structure des données de macronutriments
const macroData = {
  carbs: { percentage: 55, grams: 330, calories: 1320 },
  protein: { percentage: 25, grams: 150, calories: 600 },
  fat: { percentage: 20, grams: 53, calories: 480 }
};
```

#### Exemple d'utilisation

```jsx
import MacroChart from './nutrition/MacroChart';

<MacroChart 
  macroData={macroData}
  cyclingLevel="intermediate"
  onMacroAdjust={(newMacros) => handleMacroChange(newMacros)}
  animationComplexity="high"
/>
```

### HydrationPlanner

Le composant `HydrationPlanner` calcule les besoins en hydratation pendant l'effort, en tenant compte des conditions environnementales, de la durée et de l'intensité de l'activité.

#### Fonctionnalités

- Calculateur des besoins d'hydratation basé sur le profil utilisateur
- Ajustements pour la durée de sortie, l'intensité, la température et l'humidité
- Recommandations pour l'hydratation avant, pendant et après l'effort
- Planning détaillé de consommation de liquides pendant la sortie
- Conseils sur l'utilisation d'électrolytes selon les conditions

#### Algorithmes d'hydratation

Le planificateur utilise des formules basées sur la recherche sportive pour calculer :

1. **Taux d'hydratation de base** : Volume horaire ajusté au poids corporel
2. **Ajustements environnementaux** : Facteurs pour la température et l'humidité
3. **Périodisation de l'hydratation** : Répartition optimale avant/pendant/après l'effort

#### Exemple d'utilisation

```jsx
import HydrationPlanner from './nutrition/HydrationPlanner';

<HydrationPlanner 
  weight={75}
  activityLevel="high"
  dailyNeeds={2500}
  animationComplexity="medium"
/>
```

### RecipeSuggestions

Le composant `RecipeSuggestions` propose des recettes adaptées aux besoins nutritionnels spécifiques des cyclistes selon la phase d'entraînement (avant, pendant, après la sortie, récupération).

#### Fonctionnalités

- Catégorisation des recettes par moment de consommation
- Affichage des macronutriments par recette
- Filtrage selon les objectifs nutritionnels
- Interface visuelle attrayante avec images et temps de préparation
- Conseils nutritionnels contextuels

#### Structure des données de recettes

```javascript
// Structure d'une recette
{
  title: 'Porridge aux fruits et miel',
  image: '/assets/images/recipes/porridge.jpg',
  time: '15 min',
  difficulty: 'Facile',
  macros: { carbs: 65, protein: 15, fat: 8 },
  ingredients: ['Flocons d\'avoine', 'Lait', 'Banane', 'Baies', 'Miel', 'Graines de chia']
}
```

#### Exemple d'utilisation

```jsx
import RecipeSuggestions from './nutrition/RecipeSuggestions';

<RecipeSuggestions 
  nutritionNeeds={{
    calories: 2500,
    carbs: 330,
    protein: 150,
    fat: 53
  }}
  cyclingFocus="endurance"
  animationComplexity="medium"
/>
```

## Architecture des données

Les composants de nutrition partagent une structure de données commune pour assurer la cohérence et faciliter l'extension future.

### Flux des données nutritionnelles

1. **Entrée utilisateur** → NutritionCalculator calcule les besoins de base
2. **Besoins calculés** → Transmis à MacroChart pour visualisation
3. **Macronutriments** → Utilisés par RecipeSuggestions pour recommandations
4. **Profil utilisateur** → Utilisé par HydrationPlanner pour recommandations d'hydratation

### Types de données partagées

```javascript
// Types principales (format JSDoc)

/**
 * @typedef {Object} UserProfile
 * @property {string} gender - 'male' ou 'female'
 * @property {number} age - Âge en années
 * @property {number} weight - Poids en kg
 * @property {number} height - Taille en cm
 * @property {string} activityLevel - 'sedentary', 'light', 'moderate', 'active', 'very_active'
 * @property {string} cyclingLevel - 'beginner', 'intermediate', 'advanced', 'pro'
 */

/**
 * @typedef {Object} NutritionNeeds
 * @property {number} calories - Besoins caloriques totaux
 * @property {Object} macros - Répartition des macronutriments
 * @property {Object} macros.carbs - Données glucides
 * @property {Object} macros.protein - Données protéines
 * @property {Object} macros.fat - Données lipides
 */

/**
 * @typedef {Object} HydrationNeeds
 * @property {number} totalNeeds - Besoins totaux en ml
 * @property {number} hourlyRate - Taux horaire en ml
 * @property {boolean} electrolytes - Besoin d'électrolytes
 * @property {number} preRideAmount - Volume pré-sortie en ml
 * @property {number} duringRideAmount - Volume pendant la sortie en ml
 * @property {number} postRideAmount - Volume post-sortie en ml
 */
```

## Bonnes pratiques

Pour utiliser efficacement les composants de nutrition :

1. **Commencez par le calculateur nutritionnel** pour établir les besoins de base
2. **Transmettez les données calculées** aux autres composants pour assurer la cohérence
3. **Adaptez les valeurs nutritionnelles** selon la période d'entraînement (pré-saison, compétition, récupération)
4. **Combinaison optimale** : le calculateur avec le graphique de macros offre la meilleure vue d'ensemble
5. **Personnalisez les seuils** pour les athlètes ayant des besoins spécifiques (par exemple, haute intensité ou longue distance)

### Anti-patterns à éviter

- Ne pas utiliser des valeurs nutritionnelles génériques sans adaptation au profil cycliste
- Éviter de réinitialiser les données utilisateur entre les rendus (utiliser la persistance locale)
- Ne pas ignorer les paramètres spécifiques comme la température pour l'hydratation

## Recommandations d'utilisation

Pour optimiser l'expérience utilisateur avec les composants de nutrition :

### Placement dans l'interface

- Positionner le `NutritionCalculator` en haut de la section pour établir d'abord le profil
- Placer le `MacroChart` adjacent au calculateur pour une visualisation immédiate
- Intégrer le `HydrationPlanner` en position centrale pour accès rapide
- Disposer les `RecipeSuggestions` en bas, utilisant les données des composants précédents

### Personnalisation visuelle

- Adapter les couleurs des graphiques aux thèmes de l'application
- Utiliser des icônes pertinentes pour représenter les différents types de macronutriments
- Maintenir un contraste élevé pour la lisibilité des données nutritionnelles
- Ajouter des transitions douces entre les états de données

## Optimisations de performance

Les composants de nutrition incluent plusieurs optimisations de performance :

1. **Rendu conditionnel** : Les graphiques complexes ne sont rendus que lorsqu'ils sont visibles
2. **Mémoisation** : `useMemo` et `useCallback` pour éviter les calculs redondants
3. **Chargement progressif** : Les images de recettes sont chargées à la demande
4. **Détection de performance** : Réduction automatique de la complexité d'animation sur les appareils moins puissants

### Configuration pour différents niveaux de performance

```jsx
// Exemple d'implémentation pour différents niveaux de performance
<NutritionSection 
  animationComplexity={
    devicePerformance === 'high' ? 'high' : 
    devicePerformance === 'medium' ? 'medium' : 'low'
  }
/>
```

### Métriques de performance surveillées

- Temps de rendu initial des composants nutritionnels
- Fluidité des animations de graphiques (FPS)
- Temps de réponse aux interactions utilisateur
- Consommation mémoire des visualisations de données

---

Cette documentation sera mise à jour au fur et à mesure de l'évolution des composants de nutrition et de l'ajout de nouvelles fonctionnalités.
