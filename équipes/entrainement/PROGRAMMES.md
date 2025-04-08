# Documentation des Programmes d'Entraînement

## Aperçu

Les programmes d'entraînement sont conçus pour offrir aux cyclistes un plan structuré adapté à leur niveau et à leurs objectifs. Le module comporte trois programmes principaux :

1. **Programme de Course** (Race Training) - 12 semaines
2. **Programme Gran Fondo** - 16 semaines
3. **Programme Débutant** - 8 semaines

Chaque programme est structuré avec une approche progressive, comprenant différentes phases, des plans hebdomadaires et des entraînements spécifiques.

## Structure des Programmes

Tous les programmes partagent une structure commune :

```javascript
{
  id: 'program-id',
  name: 'Nom du Programme',
  description: 'Description complète',
  duration: 12, // en semaines
  level: ['débutant', 'intermédiaire', 'avancé'],
  goals: ['objectif1', 'objectif2'],
  requirements: {
    minFTP: 200,
    minTrainingHours: 6,
    equipment: ['Liste', 'des', 'équipements']
  },
  phases: [
    {
      id: 'phase-id',
      name: 'Nom de la Phase',
      weeks: 3,
      focus: 'Focus principal',
      description: 'Description de la phase'
    }
  ],
  weeklyPlans: [
    {
      week: 1,
      theme: 'Thème de la semaine',
      workouts: [
        {
          day: 1,
          name: 'Nom de l\'entraînement',
          type: 'Type (Endurance, Intervalle, etc.)',
          duration: 60, // en minutes
          intensityType: 'Facile/Modéré/Intense',
          description: 'Description de l\'entraînement',
          structure: [
            { name: 'Partie de l\'entraînement', duration: 10, zone: 'Zone d\'intensité' }
          ]
        }
      ]
    }
  ],
  // Sections supplémentaires
  adaptations: { ... },
  progressionMetrics: { ... },
  equipment: { ... },
  nutrition: { ... },
  nextSteps: { ... }
}
```

## Fonctionnalités Principales

### 1. Recherche et Filtrage

Le module permet de rechercher et filtrer les programmes selon plusieurs critères :

- **Niveau** : débutant, intermédiaire, avancé
- **Durée** : court (4-8 semaines), moyen (9-12 semaines), long (13+ semaines)
- **Objectif** : endurance, compétition, cyclosportive, etc.
- **Recherche textuelle** : recherche dans les titres, descriptions et objectifs

```javascript
// Exemple d'utilisation
import { searchPrograms } from '../data/training';

const programs = searchPrograms({
  query: 'endurance',
  level: 'intermédiaire',
  duration: 'medium',
  goal: 'granfondo'
});
```

### 2. Personnalisation

Le module offre la possibilité de personnaliser les programmes en fonction du profil utilisateur :

```javascript
import { generatePersonalizedProgram } from '../data/training';

const userProfile = {
  ftp: 250,
  level: 'intermédiaire',
  age: 45,
  timeAvailable: 6 // heures par semaine
};

const myProgram = generatePersonalizedProgram(userProfile, 'race-training-program');
```

### 3. Calcul des Zones d'Entraînement

Les zones d'entraînement sont automatiquement calculées en fonction du FTP de l'utilisateur :

```javascript
import { calculateTrainingZones } from '../data/training';

const ftp = 250;
const zones = calculateTrainingZones(ftp);
// Retourne un objet avec les 7 zones d'entraînement et leurs plages de puissance
```

## Programmes Disponibles

### Programme de Course (12 semaines)

Conçu pour préparer les cyclistes aux compétitions, ce programme comprend 4 phases :
1. **Fondation** (3 semaines)
2. **Développement** (4 semaines)
3. **Spécifique** (3 semaines)
4. **Affûtage** (2 semaines)

Le programme se concentre sur le développement de la puissance, la capacité aérobie et anaérobie, et les compétences tactiques.

### Programme Gran Fondo (16 semaines)

Destiné à préparer les cyclistes pour les événements de longue distance, ce programme comprend 4 phases :
1. **Base** (4 semaines)
2. **Construction** (6 semaines)
3. **Spécialisation** (4 semaines)
4. **Affûtage** (2 semaines)

L'accent est mis sur l'endurance, la gestion de l'effort, et la préparation pour des parcours exigeants avec du dénivelé.

### Programme Débutant (8 semaines)

Idéal pour les cyclistes novices, ce programme comprend 4 phases plus courtes :
1. **Familiarisation** (2 semaines)
2. **Endurance fondamentale** (3 semaines)
3. **Consolidation** (2 semaines)
4. **Conclusion** (1 semaine)

Ce programme se concentre sur l'acquisition des techniques de base, le développement d'une endurance fondamentale et l'établissement d'habitudes d'entraînement durables.

## Intégration avec les Autres Modules

Les programmes d'entraînement s'intègrent avec :

1. **FTPCalculator** : Pour déterminer les zones d'entraînement
2. **HIITTemplates** : Pour des séances d'entraînement par intervalles spécifiques
3. **NutritionRecipes** : Pour des recommandations nutritionnelles adaptées aux phases d'entraînement

## Utilisation dans l'Interface

Les programmes sont accessibles via le composant `ClassicTrainingPrograms.js` qui permet aux utilisateurs de :
- Parcourir la bibliothèque de programmes
- Filtrer selon leurs besoins
- Consulter les détails de chaque programme
- Adopter un programme et le suivre

## Personnalisation Future

Des suggestions pour l'évolution future :
- Ajout de programmes spécialisés (montagne, sprint, cyclocross)
- Intégration de données d'entraînement réelles pour ajuster les programmes
- Exportation des entraînements vers des appareils Garmin, Wahoo, etc.
- Fonctionnalité de création de programmes personnalisés
