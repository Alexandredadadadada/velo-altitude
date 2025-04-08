# Composants du Design System

## Vue d'Ensemble
- **Objectif** : Documentation des composants UI standardisés
- **Contexte** : Unification de l'interface utilisateur à travers l'application
- **Portée** : Tous les composants partagés et leur usage

## Contenu Principal
- **Composants de Base**
  - Boutons (primaire, secondaire, tertiaire, iconique)
  - Champs de formulaire (text, select, checkbox, radio)
  - Cartes et conteneurs
  - Navigation (tabs, breadcrumbs, menus)
  
- **Composants Spécifiques**
  - ColCard - Affichage des cols avec métriques
  - ProfileMetrics - Métriques utilisateur
  - TrainingZones - Visualisation des zones d'entraînement
  - ChallengeProgress - Suivi des défis

- **Layouts**
  - MainLayout - Structure principale avec sidebar et header
  - DashboardLayout - Disposition des widgets
  - ProfileLayout - Structure des pages profil
  - ResponsiveGrid - Grille adaptative

## Points Techniques
```jsx
// Exemple d'utilisation du composant ColCard
import { ColCard } from '@components/cols';

<ColCard 
  name="Col du Galibier"
  elevation={2642}
  difficulty="Difficile"
  length={23.7}
  gradient={5.1}
  region="Alpes"
  hasVisualization={true}
  onSelect={handleColSelect}
/>
```

## Métriques et KPIs
- **Objectifs**
  - Couverture du design system > 95%
  - Consistency score > 90%
  - Bundle size < 50KB (core components)
  
- **État actuel**
  - 85% des composants migrés
  - 95% d'adhérence au design system
  - 60KB bundle size

## Dépendances
- Material UI 5.x
- React 18.x
- Emotion
- Chart.js (pour visualisations)

## Maintenance
- **Responsable** : Chef d'équipe Design
- **Procédure de mise à jour** :
  1. Proposition de changement
  2. Revue design
  3. Implémentation dans la librarie de composants
  4. Tests visuels
  5. Documentation mise à jour
  6. Déploiement

## Références
- [Figma Design System](https://figma.com/file/velo-altitude-design-system)
- [Material UI Documentation](https://mui.com/material-ui/getting-started/overview/)
- [Storybook](http://storybook.velo-altitude.com)
