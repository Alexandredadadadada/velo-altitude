# Documentation du Module de Nutrition

Ce document détaille les algorithmes et formules utilisés dans le module de nutrition de la plateforme Dashboard-Velo, ainsi que leur mise en œuvre dans le code.

## Table des matières

1. [Calcul des besoins nutritionnels](#calcul-des-besoins-nutritionnels)
2. [Génération de plans de repas](#génération-de-plans-de-repas)
3. [Modèles nutritionnels spécifiques](#modèles-nutritionnels-spécifiques)
4. [Nutrition pour les cols européens](#nutrition-pour-les-cols-européens)
5. [Intégration avec les filtres de cols](#intégration-avec-les-filtres-de-cols)
6. [Base de données alimentaire](#base-de-données-alimentaire)
7. [Recettes adaptées au cyclisme européen](#recettes-adaptées-au-cyclisme-européen)
8. [Plan de mise à jour continue](#plan-de-mise-à-jour-continue)
9. [Tests et validation](#tests-et-validation)
10. [Explorateur de Recettes Unifié](#explorateur-de-recettes-unifié)

## Calcul des besoins nutritionnels

### Métabolisme de base (BMR)

Le calcul du métabolisme de base utilise la formule de **Mifflin-St Jeor**, reconnue comme étant plus précise que la formule de Harris-Benedict pour la population moderne :

- **Homme** : BMR = 10 × poids(kg) + 6.25 × taille(cm) - 5 × âge(ans) + 5
- **Femme** : BMR = 10 × poids(kg) + 6.25 × taille(cm) - 5 × âge(ans) - 161

### Dépense énergétique totale (TDEE)

La dépense énergétique totale est calculée en multipliant le BMR par un facteur d'activité :

- Sédentaire (peu ou pas d'exercice) : 1.2
- Légèrement actif (exercice 1-3 jours/semaine) : 1.375
- Modérément actif (exercice 3-5 jours/semaine) : 1.55
- Très actif (exercice 6-7 jours/semaine) : 1.725
- Extrêmement actif (exercice intense + travail physique) : 1.9

### Ajustement pour le cyclisme

Les besoins caloriques supplémentaires liés au cyclisme sont calculés en fonction de l'intensité de l'effort :

- Cyclisme léger (15-20 km/h) : 400 calories/heure
- Cyclisme modéré (20-25 km/h) : 500 calories/heure
- Cyclisme intense (25+ km/h) : 600 calories/heure

Ces calories supplémentaires sont réparties sur la semaine pour obtenir une moyenne journalière.

### Ajustement selon l'objectif

- **Maintien du poids** : TDEE calculé
- **Perte de poids** : TDEE × 0.85 (déficit de 15%)
- **Prise de masse/performance** : TDEE × 1.15 (surplus de 15%)

### Calcul des macronutriments

Les macronutriments sont calculés selon des ratios adaptés à l'objectif :

**Objectif : Performance**
- Protéines : 20% des calories (1.6-2.0g/kg de poids corporel)
- Glucides : 60% des calories
- Lipides : 20% des calories

**Objectif : Perte de poids**
- Protéines : 35% des calories (2.0-2.4g/kg de poids corporel)
- Glucides : 40% des calories
- Lipides : 25% des calories

**Objectif : Endurance**
- Protéines : 15% des calories (1.2-1.6g/kg de poids corporel)
- Glucides : 65% des calories
- Lipides : 20% des calories

Pour convertir les pourcentages en grammes :
- 1g de protéines = 4 calories
- 1g de glucides = 4 calories
- 1g de lipides = 9 calories

## Génération de plans de repas

### Distribution calorique par repas

Le plan répartit les calories quotidiennes entre différents repas selon la distribution suivante :

- Petit déjeuner : 25% des calories quotidiennes
- Déjeuner : 35% des calories quotidiennes
- Dîner : 30% des calories quotidiennes
- Collations : 10% des calories quotidiennes

### Sélection des aliments

Pour chaque repas, l'algorithme :

1. Filtre les aliments appropriés pour le type de repas
2. Sélectionne aléatoirement des aliments qui correspondent approximativement aux macros cibles
3. Ajuste les portions pour atteindre les objectifs nutritionnels
4. Vérifie que la somme des macros reste conforme aux objectifs globaux

## Modèles nutritionnels spécifiques

### Modèle Performance

Optimisé pour les cyclistes recherchant une performance maximale :

- Ratio macronutriments : 60% glucides, 20% protéines, 20% lipides
- Hydratation recommandée : 40ml/kg de poids corporel
- Suppléments recommandés : Électrolytes, gels glucidiques, BCAA

### Modèle Perte de Poids

Conçu pour les cyclistes souhaitant perdre du poids tout en maintenant leur performance :

- Déficit calorique de 15%
- Ratio macronutriments : 40% glucides, 35% protéines, 25% lipides
- Hydratation recommandée : 35ml/kg de poids corporel
- Suppléments recommandés : Protéines, L-carnitine, fibres

### Modèle Endurance

Adapté aux cyclistes préparant des événements d'endurance :

- Surplus calorique de 20%
- Ratio macronutriments : 65% glucides, 15% protéines, 20% lipides
- Hydratation recommandée : 45ml/kg de poids corporel
- Suppléments recommandés : Électrolytes, maltodextrine, sel de réhydratation

### Modèle Récupération

Adapté pour optimiser la récupération après des efforts intenses :

- Équilibre calorique ou léger surplus (5-10%)
- Ratio macronutriments : 50% glucides, 30% protéines, 20% lipides
- Hydratation recommandée : 40ml/kg de poids corporel + remplacement des pertes sudorales
- Suppléments recommandés : Protéines à absorption rapide, électrolytes, antioxydants
- Timing : Apport en protéines et glucides dans les 30 minutes après l'effort

## Nutrition pour les cols européens

### Adaptation nutritionnelle selon le type de col

Le module applique des ajustements spécifiques en fonction des caractéristiques du col à gravir :

#### Cols d'altitude élevée (>2000m)

- **Avant l'ascension** :
  - Augmentation des glucides à 70-75% des calories 24-48h avant
  - Hydratation renforcée : +25% par rapport aux recommandations standard
  - Supplémentation en fer recommandée pour optimiser le transport d'oxygène
  - Focus sur les aliments riches en antioxydants pour contrer le stress oxydatif lié à l'altitude

- **Pendant l'ascension** :
  - Apport glucidique de 60-90g/heure selon la durée
  - Augmentation de la fréquence d'hydratation (150-200ml toutes les 15-20 minutes)
  - Sodium et potassium renforcés dans les boissons
  - Apport calorique total augmenté de 20-30% par rapport à une sortie standard

#### Cols longs (>15km)

- **Avant l'ascension** :
  - Charge glucidique progressive sur 48-72h
  - Plans de repas riches en glucides complexes à index glycémique modéré
  - Hydratation préventive avec électrolytes

- **Pendant l'ascension** :
  - Stratégie nutritionnelle séquentielle : glucides liquides durant la première moitié, combinés à des sources solides ensuite
  - Rotation des sources de glucides pour optimiser l'absorption
  - Protocole d'hydratation personnalisé selon le poids, les conditions climatiques et le profil de sudation

#### Cols à forte pente (>10%)

- **Avant l'ascension** :
  - Réduction du volume alimentaire la veille (-10-15%)
  - Ratio macronutriments optimisé : 65% glucides, 20% protéines, 15% lipides
  - Focus sur les aliments à faible index glycémique pour une énergie soutenue

- **Pendant l'ascension** :
  - Apports énergétiques fragmentés et plus fréquents
  - Utilisation de gels avec caféine stratégiquement placés aux segments les plus raides
  - Hydratation enrichie en électrolytes pour prévenir les crampes

### Stratégies de périodisation nutritionnelle

Le module intègre un système de périodisation nutritionnelle spécifique aux défis de cols multiples :

#### Défis multi-cols (type "Seven Majors Challenge")

- **Phase préparatoire (J-7 à J-3)** :
  - Augmentation progressive des glucides
  - Optimisation des réserves de glycogène musculaire et hépatique
  - Protocole d'hydratation renforcé

- **Phase de charge (J-2 à J-1)** :
  - Supercompensation glucidique (8-10g/kg de poids corporel)
  - Limitation des fibres pour réduire les problèmes gastro-intestinaux
  - Hydratation stratégique avec électrolytes

- **Jour(s) du défi** :
  - Alimentation personnalisée pour chaque col selon son profil
  - Stratégie de récupération inter-cols avec focus sur la resynthèse rapide du glycogène
  - Hydratation adaptée aux conditions climatiques spécifiques de chaque col

- **Phase de récupération** :
  - Protocole de récupération accélérée sur 48-72h
  - Réintroduction progressive des macronutriments avec focus sur les protéines et antioxydants
  - Plan de micronutriments ciblé pour la régénération musculaire

### Modèles nutritionnels spécifiques par région

Le module propose des recommandations alimentaires adaptées aux différentes régions européennes :

#### Alpes

- Stratégies nutritionnelles adaptées à l'altitude et aux longues ascensions
- Hydratation spécifique pour les conditions alpines (variation rapide de température)
- Recommandations de sources locales de glucides complexes

#### Pyrénées

- Plans nutritionnels adaptés aux enchaînements de cols
- Stratégies hydro-électrolytiques pour les conditions souvent chaudes
- Adaptation aux pentes irrégulières caractéristiques des cols pyrénéens

#### Dolomites

- Stratégies pour les changements rapides de pente
- Approche nutritionnelle pour les cols techniques et sinueux
- Hydratation adaptée aux conditions microclimatiques

#### Cols du Nord

- Plans adaptés aux efforts dans des conditions potentiellement humides
- Stratégies nutritionnelles pour les cols courts mais intenses
- Recommandations pour les secteurs pavés et techniques

### Intégration avec le système de visualisation 3D

Le module de nutrition est désormais intégré avec la visualisation 3D des cols :

- Marqueurs nutritionnels sur le profil 3D indiquant les points stratégiques pour l'alimentation
- Recommandations en temps réel basées sur la position sur le col
- Calcul dynamique des besoins caloriques et hydriques selon le segment du col

## Intégration avec les filtres de cols

Le module de nutrition s'intègre désormais avec les nouveaux filtres avancés de cols pour fournir des recommandations nutritionnelles encore plus précises et personnalisées.

### Adaptation nutritionnelle selon le type de surface

Les recommandations nutritionnelles sont automatiquement ajustées en fonction du type de surface du col sélectionné :

#### Asphalte
- **Hydratation** : Standard (500-750ml/heure)
- **Glucides** : 60-80g/heure
- **Électrolytes** : Concentration standard
- **Caractéristiques** : Focus sur l'endurance aérobie et l'optimisation du rapport poids/puissance
- **Aliments recommandés** : Barres énergétiques à assimilation modérée, gels classiques

#### Gravier
- **Hydratation** : Augmentée (+15%, 600-850ml/heure) pour compenser la dépense énergétique accrue
- **Glucides** : 70-90g/heure avec ratio glucose:fructose optimisé (2:1)
- **Électrolytes** : Concentration augmentée (700-900mg sodium/litre)
- **Caractéristiques** : Support pour l'effort musculaire accru et la stabilisation
- **Aliments recommandés** : Barres plus riches en protéines (ratio glucides:protéines 4:1), gels à haute densité énergétique

#### Mixte
- **Hydratation** : Adaptative (550-800ml/heure)
- **Glucides** : 65-85g/heure
- **Électrolytes** : Concentration adaptative
- **Caractéristiques** : Stratégie hybride avec focus sur la flexibilité énergétique
- **Aliments recommandés** : Combinaison de sources d'énergie liquides et solides, rotation stratégique

### Adaptation nutritionnelle selon la difficulté technique

La difficulté technique (échelle 1-5) influence directement les besoins nutritionnels en raison des efforts neuromusculaires et des pics d'intensité :

#### Difficulté 1-2 (Facile à Modérée)
- **Stratégie** : Apports réguliers et prévisibles
- **Fréquence** : Toutes les 30-45 minutes
- **Intensité glycémique** : Modérée à faible pour une énergie stable
- **Complexité digestive** : Peut accepter des aliments plus complexes

#### Difficulté 3 (Intermédiaire)
- **Stratégie** : Apports plus fréquents avant les sections techniques
- **Fréquence** : Toutes les 20-30 minutes
- **Intensité glycémique** : Mixte selon le profil du parcours
- **Complexité digestive** : Privilégier des aliments à digestion facile

#### Difficulté 4-5 (Difficile à Très difficile)
- **Stratégie** : Apports stratégiques avant les sections techniques et récupération active après
- **Fréquence** : Toutes les 15-20 minutes en petites quantités
- **Intensité glycémique** : Haute pour répondre aux demandes énergétiques soudaines
- **Complexité digestive** : Uniquement des aliments très faciles à digérer, privilégier les formes liquides
- **Spécificité** : Ajout de caféine (1-3mg/kg) pour améliorer la vigilance et les performances en terrain technique

### Implémentation technique

L'intégration entre le module de nutrition et les filtres de cols est réalisée par :

1. **Service d'interopérabilité** : Le `nutritionColIntegrationService.js` qui fait le lien entre `colService.js` et `nutritionService.js`
2. **Algorithme adaptatif** : `nutriPlanAdapter.js` qui modifie dynamiquement les recommandations en fonction des caractéristiques du col
3. **Composant d'interface** : `ColNutritionRecommendations.js` qui affiche les recommandations spécifiques dans l'explorateur de cols
4. **Stockage de données** : Nouvelles tables dans la base de données associant les caractéristiques des cols aux recommandations nutritionnelles

### Exemple de recommandation nutritionnelle personnalisée

Pour un col avec les caractéristiques suivantes:
- Surface: Mixte
- Difficulté technique: 4
- Saison recommandée: Été

Le système génère automatiquement un plan nutritionnel adapté:

```javascript
const planNutritionnel = {
  pre: {
    hydratation: "1000ml dans les 2 heures précédentes avec 800mg sodium/litre",
    apportsCaloriques: "400-500kcal, ratio glucides:protéines:lipides 4:1:1",
    timing: "2h avant pour repas principal, 30min avant pour collation rapide",
    alimentsRecommandés: ["Porridge aux fruits rouges", "Banane", "Pain d'épices"]
  },
  pendant: {
    hydratation: {
      volume: "750-900ml/heure",
      électrolytes: "1000mg sodium/litre + 200mg potassium/litre",
      stratégie: "Boire plus fréquemment en petites quantités, surtout avant sections techniques"
    },
    nutrition: {
      glucides: "80-90g/heure avec ratio glucose:fructose 2:1",
      fractionnement: "Apports toutes les 15-20 minutes",
      sources: ["Boisson énergétique à 8%", "Gels à libération séquentielle", "Purée de fruits"]
    },
    suppléments: {
      caféine: "200mg avant les sections les plus techniques",
      bcaa: "5g/heure pour sections à difficulté soutenue"
    }
  },
  après: {
    récupération: {
      immédiate: "Boisson récupération glucides:protéines 4:1 (60g:15g)",
      hydratation: "150% des pertes (pesée avant/après recommandée)",
      alimentsSolides: "Dans les 2 heures post-effort: repas complet riche en protéines et antioxydants"
    }
  }
};
```

## Base de données alimentaire

La base de données alimentaire de Dashboard-Velo est l'une des plus complètes d'Europe, couvrant plus de 15,000 aliments et spécialités régionales européennes.

### Structure de la base de données

La base de données est structurée selon une hiérarchie à trois niveaux :

1. **Catégories principales** : Viandes, Poissons, Légumes, Fruits, Céréales, Produits laitiers, etc.
2. **Sous-catégories** : Par exemple, dans "Céréales" : Pâtes, Riz, Pain, etc.
3. **Aliments spécifiques** : Par exemple, dans "Pain" : Pain complet allemand, Baguette française, Pain au levain italien, etc.

### Spécialités régionales européennes

Notre base intègre des aliments spécifiques aux différentes régions européennes :

- **Méditerranéenne** : Huile d'olive, tomates séchées, pâtes complètes
- **Nordique** : Poissons gras, baies sauvages, pain de seigle
- **Alpine** : Fromages de montagne, viandes séchées, céréales de haute altitude
- **Europe de l'Est** : Graines, betteraves, yaourts riches en protéines
- **Ibérique** : Fruits secs, légumineuses, huiles d'olive variées

### Implémentation technique

```javascript
// Structure d'un aliment dans la base de données
const foodItem = {
  id: 'string-unique-id',
  name: {
    fr: 'Nom français',
    en: 'English name',
    de: 'Deutscher Name',
    it: 'Nome italiano',
    es: 'Nombre español'
  },
  category: 'main-category',
  subCategory: 'sub-category',
  region: 'european-region',
  country: 'country-of-origin',
  nutritionalValues: {
    calories: 0, // kcal per 100g
    protein: 0, // g per 100g
    carbohydrates: 0, // g per 100g
    fat: 0, // g per 100g
    fiber: 0, // g per 100g
    // Valeurs supplémentaires
    sodium: 0,
    potassium: 0,
    magnesium: 0,
    iron: 0,
    calcium: 0
  },
  glycemicIndex: 0, // 0-100
  sportSpecificBenefits: [
    'string describing benefit'
  ],
  seasonality: ['january', 'february'], // Mois de disponibilité optimale
  sustainabilityScore: 0, // 0-10
  allergens: ['allergen1', 'allergen2'],
  isVegan: false,
  isVegetarian: true,
  isGlutenFree: true,
  recommendations: {
    preRide: true,
    duringRide: false,
    postRide: true
  }
};
```

La base de données est accessible via le service `NutritionService.js` qui fournit les méthodes :

- `getFoodDatabase()` : Récupère la base de données complète
- `searchFood(query, filters)` : Recherche des aliments selon des critères
- `getFoodByCategory(category)` : Récupère les aliments d'une catégorie
- `getFoodsByRegion(region)` : Récupère les aliments d'une région européenne

### Focus sur l'excellence européenne

Notre base intègre des méta-données de sources reconnues :

- Base de données EUROFIR (European Food Information Resource)
- Bases nationales : CIQUAL (France), BLS (Allemagne), BEDCA (Espagne)
- Collaborations avec des instituts nutritionnels européens

### Intégration pour les cols européens

Le module connecte automatiquement les besoins spécifiques pour les cols de différentes régions :

- Aliments adaptés aux températures attendues 
- Suggestions basées sur la disponibilité locale
- Recommandations tenant compte de l'altitude et de la durée d'effort

## Recettes adaptées au cyclisme européen

Dashboard-Velo propose plus de 100 recettes spécifiquement conçues pour répondre aux besoins des cyclistes sur les routes européennes.

### Catégories de recettes

Les recettes sont organisées selon plusieurs critères :

1. **Moment de consommation**
   - Petit-déjeuner pré-sortie
   - Collations transportables
   - Repas de récupération
   - Ravitaillement pendant l'effort

2. **Type d'effort**
   - Courtes sorties à haute intensité
   - Sorties d'endurance longue
   - Ascensions de cols multiples
   - Épreuves multi-jours

3. **Conditions climatiques**
   - Recettes pour climat chaud (Méditerranée, Sud)
   - Recettes pour climat froid (Alpes, Pyrénées en début/fin de saison)
   - Recettes pour conditions humides

### Structure technique des recettes

Chaque recette est structurée selon le modèle suivant :

```javascript
const recipeStructure = {
  id: 'unique-recipe-id',
  title: {
    fr: 'Titre français',
    en: 'English title',
    // Autres langues
  },
  category: ['pre-ride', 'recovery', 'long-distance'],
  difficulty: 1-5, // Niveau de difficulté
  preparationTime: 15, // minutes
  cookingTime: 30, // minutes
  servings: 4,
  nutritionalValues: {
    perServing: {
      calories: 450,
      protein: 25,
      carbs: 65,
      fat: 12
      // Autres valeurs
    },
    // Macronutrient ratio in percentage
    ratio: {
      protein: 20,
      carbs: 60,
      fat: 20
    }
  },
  ingredients: [
    {
      id: 'food-db-id',
      name: 'Ingredient name',
      quantity: 100,
      unit: 'g'
    }
    // Autres ingrédients
  ],
  steps: [
    'Step 1 description',
    'Step 2 description'
    // Autres étapes
  ],
  tips: [
    'Cooking tip',
    'Nutritional tip'
  ],
  suitableFor: ['long-climbs', 'multi-day-events'],
  europeanRegionOrigin: 'Alps',
  transportable: true,
  shelfLife: {
    refrigerated: 3, // jours
    roomTemperature: 1 // jours
  },
  seasonality: 'summer',
  authorNotes: 'Notes about the recipe'
};
```

### Implémentation dans l'interface

Les recettes sont présentées dans les composants suivants :

- `RecipeDirectory.js` : Exploration et recherche des recettes
- `RecipeDetail.js` : Affichage détaillé d'une recette
- `NutritionCalendar.js` : Planification et intégration des recettes dans un plan hebdomadaire
- `ShoppingListGenerator.js` : Génération de listes de courses basées sur les recettes sélectionnées

## Plan de mise à jour continue

Pour maintenir l'excellence de notre base de données nutritionnelle européenne :

1. **Mises à jour trimestrielles** :
   - Ajout de nouvelles recettes saisonnières
   - Intégration des dernières recherches en nutrition sportive
   - Enrichissement de la base de données alimentaire régionale

2. **Contributions d'experts** :
   - Collaboration avec des nutritionnistes sportifs à travers l'Europe
   - Validation des données par des instituts de recherche
   - Retours des cyclistes professionnels et amateurs

3. **Adaptation aux nouvelles tendances** :
   - Alimentation à base de plantes
   - Nutrition de précision
   - Aliments fonctionnels pour cyclistes

## Tests et validation

Le module intègre un système de test automatisé qui :

1. Valide les calculs de BMR, TDEE et des besoins caloriques
2. Vérifie la cohérence des plans de repas générés
3. S'assure que la répartition des macronutriments reste conforme aux objectifs
4. Teste différents profils d'utilisateurs (performance, endurance, perte de poids)

Un test est considéré comme réussi si la déviation entre les valeurs cibles et les valeurs générées est inférieure à 5% pour chaque catégorie (calories, protéines, glucides, lipides).

## Explorateur de Recettes Unifié

L'explorateur de recettes est un composant central qui permet aux utilisateurs de découvrir et filtrer toutes les recettes disponibles sur la plateforme, adaptées spécifiquement aux besoins des cyclistes.

### Fonctionnalités principales

- **Navigation par catégories** : 
  - Avant l'effort (préparation)
  - Pendant l'effort (ravitaillement)
  - Récupération (post-effort)
  - Recettes spéciales pour cols

- **Filtres avancés** :
  - Par objectif nutritionnel (endurance, performance, perte de poids, récupération)
  - Par propriétés diététiques (sans gluten, végétarien, végétalien, riche en protéines)
  - Par difficulté et temps de préparation
  - Par valeurs nutritionnelles (calories, macronutriments)

- **Fonctionnalités utilisateur** :
  - Sauvegarde de recettes en favoris
  - Ajout de recettes au plan de repas
  - Impression des recettes
  - Recommandations personnalisées basées sur le profil utilisateur

### Intégration avec les autres modules

L'explorateur de recettes est intégré avec :

- **Planificateur de repas** : Les recettes peuvent être ajoutées directement au planificateur de repas hebdomadaire
- **Profil utilisateur** : Les recommandations sont adaptées aux objectifs et restrictions alimentaires de l'utilisateur
- **Entraînement** : Les recettes sont suggérées en fonction des séances d'entraînement planifiées

### Algorithme de recommandation 

Le système de recommandation utilise plusieurs facteurs pour proposer des recettes pertinentes :

1. **Objectif principal de l'utilisateur** :
   - Endurance → recettes riches en glucides complexes
   - Performance → recettes équilibrées en macronutriments
   - Perte de poids → recettes moins caloriques mais rassasiantes
   - Récupération → recettes riches en protéines et antioxydants

2. **Restrictions alimentaires** :
   - Filtrage automatique des recettes non adaptées aux restrictions (sans gluten, végétarien, etc.)

3. **Planification d'entraînement** :
   - Proposition de recettes spécifiques avant/après les entraînements intensifs
   - Adaptation selon la proximité avec une compétition

### Structure des données

Les recettes sont organisées selon plusieurs classifications :

```javascript
// Structure principale par moment de consommation
categories: {
  preRide: { recipes: [...] },
  duringRide: { recipes: [...] },
  postRide: { recipes: [...] },
  colSpecific: { recipes: [...] }
}

// Classification par objectif
objectives: {
  endurance: { recipes: [...] },
  performance: { recipes: [...] },
  weightLoss: { recipes: [...] },
  recovery: { recipes: [...] }
}

// Classification par propriétés diététiques
dietaryProperties: {
  glutenFree: { recipes: [...] },
  vegetarian: { recipes: [...] },
  vegan: { recipes: [...] },
  dairyFree: { recipes: [...] },
  highProtein: { recipes: [...] }
}
```

### Flux d'utilisation typique

1. L'utilisateur accède à l'explorateur de recettes via le hub de nutrition
2. Le système présente des recommandations personnalisées en haut de page
3. L'utilisateur peut filtrer les recettes selon différents critères
4. Pour chaque recette, l'utilisateur peut :
   - Voir les détails complets (ingrédients, instructions, valeurs nutritionnelles)
   - Ajouter la recette à ses favoris
   - Ajouter la recette à son plan de repas
   - Imprimer la recette pour une utilisation hors ligne

### Interface avec le profil utilisateur

Le composant utilise le profil utilisateur pour :
- Récupérer les préférences et restrictions alimentaires
- Stocker les recettes favorites
- Adapter les recommandations aux objectifs actuels

### Développements futurs prévus

- Création d'une collection de recettes par l'utilisateur
- Partage social de recettes personnalisées
- Adaptation automatique des portions selon les besoins caloriques
- Estimation de l'impact sur la performance des recettes

---

Document créé le : 11/2023  
Dernière mise à jour : 04/2025
