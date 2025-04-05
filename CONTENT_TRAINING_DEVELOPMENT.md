# Guide de Développement des Programmes d'Entraînement - Velo-Altitude

**Date :** 5 avril 2025  
**Version :** 1.0

## Introduction

Ce document détaille le format et les exigences pour l'ajout de nouveaux programmes d'entraînement à la plateforme Velo-Altitude. La structure suit le format JSON existant dans `server/data/training-plans.json`.

## Structure des données

Chaque programme d'entraînement doit être défini en suivant ce modèle JSON :

```json
{
  "id": "plan-xyz",
  "name": "Nom du programme d'entraînement",
  "objective": "endurance", // ou "force", "puissance", "récupération", "préparation-col", etc.
  "level": "débutant", // ou "intermédiaire", "avancé", "élite"
  "duration_weeks": 8, // durée en semaines
  "weekly_structure": [
    {
      "week": 1,
      "theme": "Thème de la semaine",
      "total_hours": 8, // nombre d'heures totales
      "days": [
        {
          "day": "Lundi",
          "type": "repos", // ou "endurance", "force", "interval", "vitesse", etc.
          "title": "Titre de la séance",
          "description": "Description détaillée de la séance d'entraînement",
          "duration": "1h30", // format horaire
          "intensity": 3, // échelle de 0 à 10
          "metrics": [
            "Métrique 1: valeurs cibles",
            "Métrique 2: valeurs cibles"
          ]
        },
        // Répéter pour chaque jour de la semaine
      ]
    },
    // Répéter pour chaque semaine du programme
  ],
  "equipment_needed": [
    "Équipement 1",
    "Équipement 2"
  ],
  "targetAudience": {
    "fitnessLevel": "Niveau de fitness requis",
    "timeCommitment": "Engagement en temps par semaine",
    "goals": [
      "Objectif 1",
      "Objectif 2"
    ]
  },
  "nutritionRecommendations": {
    "beforeWorkout": "Recommandations avant l'entraînement",
    "duringWorkout": "Recommandations pendant l'entraînement",
    "afterWorkout": "Recommandations après l'entraînement",
    "dailyIntake": "Recommandations générales"
  },
  "progressionMetrics": [
    "Métrique 1 à surveiller",
    "Métrique 2 à surveiller"
  ],
  "complementaryExercises": [
    {
      "name": "Nom de l'exercice",
      "purpose": "Objectif de l'exercice",
      "description": "Description de l'exercice",
      "frequency": "Fréquence recommandée"
    }
  ],
  "expectedOutcomes": [
    "Résultat attendu 1",
    "Résultat attendu 2"
  ]
}
```

## Types de programmes à développer

### 1. Programmes spécifiques aux cols

Développer des programmes d'entraînement spécifiquement conçus pour préparer les cyclistes à gravir des cols particuliers.

**Priorités :**
- Col du Tourmalet (6 semaines)
- Mont Ventoux (8 semaines)
- Alpe d'Huez (6 semaines)
- Stelvio (8 semaines)
- Angliru (10 semaines)
- Les 7 Majeurs (16 semaines)

### 2. Programmes par objectif

**Développer les programmes suivants :**
- Préparation cyclosportive longue distance (12 semaines)
- Amélioration de la puissance en côte (8 semaines)
- Préparation débutant première cyclosportive (16 semaines)
- Amélioration FTP (6 semaines)
- Préparation montagne pour cyclistes de plaine (10 semaines)
- Récupération post-saison (4 semaines)
- Maintien hivernal (12 semaines)
- Entraînement par intervalles pour cycliste pressé (8 semaines)

### 3. Programmes HIIT spécialisés

**Développer 10 nouvelles séances HIIT :**
- 4 séances courtes (30 minutes)
- 4 séances moyennes (45-60 minutes)
- 2 séances longues (+75 minutes)

Chaque séance doit inclure :
- Échauffement détaillé
- Séquence d'intervalles précise
- Phases de récupération
- Retour au calme
- Métriques cibles (puissance, fréquence cardiaque)

## Format des séances d'entraînement

### Structure détaillée d'une séance d'entraînement

```json
{
  "id": "session-xyz",
  "name": "Nom de la séance",
  "type": "interval", // ou autre type
  "duration": "1h15",
  "structure": [
    {
      "phase": "Échauffement",
      "duration": "15min",
      "description": "Description détaillée",
      "intensity": "Zone 2 (65-75% FCmax)",
      "cadence": "90-100 rpm",
      "terrain": "Plat"
    },
    {
      "phase": "Corps principal",
      "duration": "45min",
      "intervals": [
        {
          "effort": "5min",
          "intensity": "Zone 4 (85-95% FCmax)",
          "cadence": "85-95 rpm",
          "terrain": "Côte modérée 4-6%",
          "recovery": "3min en Zone 1"
        },
        // Répéter pour chaque intervalle
      ]
    },
    {
      "phase": "Retour au calme",
      "duration": "15min",
      "description": "Description détaillée",
      "intensity": "Zone 1 (<65% FCmax)",
      "cadence": "85-95 rpm",
      "terrain": "Plat"
    }
  ],
  "adaptations": {
    "beginner": "Adaptations pour débutants",
    "advanced": "Options pour avancés"
  },
  "indoorVersion": {
    "smartTrainer": "Instructions pour home trainer intelligent",
    "classicTrainer": "Instructions pour home trainer classique"
  }
}
```

## Conseils pour la création de contenu d'entraînement

1. **Principes d'entraînement**
   - Respecter les principes de progression, spécificité, récupération
   - Suivre le modèle polarisé (80% faible intensité, 20% haute intensité)
   - Intégrer des semaines de récupération (généralement 1 semaine sur 4)

2. **Périodisation**
   - Structurer les programmes en phases (préparation, spécifique, compétition, transition)
   - Augmenter progressivement l'intensité et réduire le volume à l'approche de l'objectif

3. **Adaptabilité**
   - Prévoir des alternatives pour différents niveaux
   - Indiquer comment adapter en fonction des contraintes (météo, temps disponible)
   - Proposer des versions indoor et outdoor

4. **Métriques**
   - Fournir des valeurs cibles pour puissance, fréquence cardiaque et cadence
   - Utiliser à la fois les pourcentages de FCmax et les zones d'entraînement (Z1-Z5)
   - Pour la puissance, utiliser les % de FTP

## Liste de contrôle pour la validation

- [ ] Objectifs clairement définis
- [ ] Progression logique sur la durée du programme
- [ ] Périodisation appropriée (charge/récupération)
- [ ] Inclusion d'échauffements et retours au calme
- [ ] Variété dans les types de séances
- [ ] Alternance entre intensité et récupération
- [ ] Spécificité par rapport à l'objectif
- [ ] Instructions claires pour chaque séance
- [ ] Métriques précises et réalistes
- [ ] Considérations nutritionnelles incluses

## Médias à inclure

- Graphiques visuels de la structure du programme (courbe de progression)
- Vidéos démonstratives pour les exercices complémentaires
- Visualisations des zones d'intensité
- Profils des séances d'intervalles
