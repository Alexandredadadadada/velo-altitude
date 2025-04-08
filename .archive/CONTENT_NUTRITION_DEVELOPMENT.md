# Guide de Développement du Contenu Nutritionnel - Velo-Altitude

**Date :** 5 avril 2025  
**Version :** 1.0

## Introduction

Ce document détaille le format et les exigences pour l'ajout de nouveaux plans nutritionnels à la plateforme Velo-Altitude. La structure suit le format JSON existant dans `server/data/nutrition-plans.json`.

## Structure des données

Chaque plan nutritionnel doit être défini en suivant ce modèle JSON :

```json
{
  "id": "nutrition-plan-xyz",
  "name": "Nom du plan nutritionnel",
  "type": "endurance", // ou "puissance", "récupération", "montagne", "perte-poids", etc.
  "description": "Description détaillée du plan nutritionnel et de ses objectifs",
  "daily_calories": 2800, // nombre approximatif de calories
  "macronutrients": {
    "carbs": "55-60%",
    "protein": "15-20%",
    "fat": "25-30%"
  },
  "daily_plans": [
    {
      "day": "Type de journée", // ex: "Entraînement léger", "Sortie longue", "Course", "Repos"
      "meals": [
        {
          "type": "petit-déjeuner", // ou "déjeuner", "dîner", "collation", "ravitaillement"
          "description": "Nom du repas",
          "ingredients": [
            "Ingrédient 1 avec quantité",
            "Ingrédient 2 avec quantité"
          ],
          "macros": {
            "calories": 450,
            "carbs": 75, // en grammes
            "protein": 15, // en grammes
            "fat": 10 // en grammes
          },
          "notes": "Information supplémentaire sur ce repas"
        }
        // Répéter pour chaque repas de la journée
      ]
    }
    // Répéter pour chaque type de journée
  ],
  "hydration": {
    "daily": "2-3 litres d'eau minimum",
    "training": "500-750ml par heure d'effort",
    "electrolytes": "Recommandation sur les électrolytes"
  },
  "supplements": [
    {
      "name": "Nom du supplément",
      "dosage": "Dosage recommandé",
      "timing": "Moment idéal de prise",
      "benefits": "Bénéfices pour le cycliste"
    }
  ],
  "specialConsiderations": [
    "Considération spéciale 1",
    "Considération spéciale 2"
  ],
  "allergiesAlternatives": {
    "gluten": ["Alternative 1", "Alternative 2"],
    "lactose": ["Alternative 1", "Alternative 2"]
  },
  "references": [
    "Source scientifique 1",
    "Source scientifique 2"
  ]
}
```

## Types de plans nutritionnels à développer

### 1. Plans spécifiques aux cols

Développer des plans nutritionnels spécifiquement conçus pour préparer les cyclistes à gravir des cols particuliers. Ces plans doivent tenir compte de la durée et de l'intensité de l'effort requis.

**Priorités :**
- Plan nutrition Col du Tourmalet
- Plan nutrition Mont Ventoux
- Plan nutrition Alpe d'Huez
- Plan nutrition Stelvio
- Plan nutrition Angliru
- Plan nutrition "Les 7 Majeurs"

### 2. Plans par objectif

**Développer les plans suivants :**
- Plan pour cycliste d'endurance (longue distance)
- Plan pour cycliste de puissance (courte distance)
- Plan de récupération post-effort
- Plan de perte de poids pour cycliste
- Plan de préparation avant événement majeur
- Plan de nutrition en haute altitude
- Plan spécial canicule
- Plan spécial montagne

### 3. Plans pour situations spéciales

- Nutrition pour séjours d'entraînement en altitude
- Nutrition pour stage de cyclisme multi-jours
- Nutrition pour cyclosportives par temps chaud
- Nutrition pour cyclosportives par temps froid
- Nutrition de voyage pour cyclistes
- Nutrition pour le cyclisme en période hivernale

## Format pour les recettes individuelles

```json
{
  "id": "recipe-xyz",
  "name": "Nom de la recette",
  "category": "pre-ride", // ou "during-ride", "post-ride", "breakfast", "dinner", "snack", etc.
  "preparationTime": "15 minutes",
  "cookingTime": "30 minutes",
  "servings": 4,
  "ingredients": [
    {
      "name": "Nom de l'ingrédient",
      "quantity": "200g",
      "notes": "Optionnel: notes sur l'ingrédient"
    }
  ],
  "instructions": [
    "Étape 1 de la préparation",
    "Étape 2 de la préparation"
  ],
  "nutritionalInfo": {
    "perServing": {
      "calories": 350,
      "carbs": 45,
      "protein": 20,
      "fat": 12,
      "fiber": 5,
      "sodium": 400
    }
  },
  "benefits": [
    "Bénéfice 1 pour la performance cycliste",
    "Bénéfice 2 pour la performance cycliste"
  ],
  "timing": "Se consomme idéalement 2h avant l'effort",
  "variations": [
    {
      "name": "Variante sans gluten",
      "substitutions": "Remplacer X par Y"
    }
  ],
  "tips": [
    "Conseil pratique 1",
    "Conseil pratique 2"
  ],
  "storageTips": "Se conserve au réfrigérateur jusqu'à 3 jours"
}
```

## Lignes directrices sur la nutrition cycliste

### 1. Avant l'effort

- **2-3 heures avant** : Repas riche en glucides complexes, modéré en protéines, faible en gras et en fibres. 
  - 2-4g de glucides/kg de poids corporel
  - Exemples: pâtes, riz, patates douces, pain complet

- **30-60 minutes avant** : Collation légère avec glucides simples
  - 0.5-1g de glucides/kg de poids corporel
  - Exemples: banane, barre énergétique, compote

### 2. Pendant l'effort

- **Sorties < 60 minutes** : Hydratation uniquement (eau ou boisson électrolytique)

- **Sorties 1-3 heures** : 30-60g de glucides/heure
  - Formats: gels, barres, boissons énergétiques, fruits secs

- **Sorties > 3 heures ou haute intensité** : 60-90g de glucides/heure
  - Utiliser un mélange de glucides (glucose + fructose) pour améliorer l'absorption
  - Fractionner les apports toutes les 15-20 minutes

- **Hydratation** : 500-1000ml/heure selon température et intensité
  - Ajouter des électrolytes lors des sorties > 90 minutes ou par temps chaud

### 3. Après l'effort

- **30 minutes après** : 1g de glucides/kg + 0.25-0.3g de protéines/kg (fenêtre métabolique)
  - Exemples: boisson de récupération, yaourt + fruits, sandwich

- **2 heures après** : Repas complet avec glucides, protéines et légumes
  - 1-1.2g de glucides/kg
  - 0.3-0.4g de protéines/kg
  - Exemples: pâtes avec poulet et légumes, riz avec poisson et légumes

## Exigences pour le développement de contenus nutritionnels

### Photos et médias
- **Photo principale** : 1200x800px, format paysage, haute qualité
- **Photos de chaque repas** : 800x600px minimum
- **Infographies** : Créer des infographies explicatives pour chaque plan

### Contenu textuel
- **Ton** : Informatif, précis mais accessible
- **Longueur des descriptions** : 150-250 mots maximum
- **Niveau scientifique** : Basé sur des recherches mais vulgarisé pour le grand public
- **Citations** : Inclure au moins 3 références scientifiques par plan

### Vérification nutritionnelle
- Tous les plans doivent être vérifiés par un nutritionniste sportif
- Équilibre nutritionnel vérifié selon les standards actuels
- Confirmation de l'adéquation aux besoins énergétiques des cyclistes
- Vérification des équivalences pour les intolérances et allergies

## Liste de contrôle pour la validation

- [ ] Toutes les valeurs nutritionnelles calculées et vérifiées
- [ ] Photos de tous les repas disponibles et de qualité
- [ ] Alternatives pour régimes spéciaux incluses (végétarien, sans gluten, etc.)
- [ ] Plans adaptés à différents niveaux de pratique (débutant à expert)
- [ ] Guide d'hydratation complet et adapté aux conditions
- [ ] Conseils de timing nutritionnel précis
- [ ] Suggestions de supplémentation basées sur des preuves
- [ ] Conseils de préparation et de conservation
