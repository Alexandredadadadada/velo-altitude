# Guide de l'Interface Utilisateur

## Introduction

Ce document détaille les composants UI, animations et styles implémentés dans Euro Cycling Dashboard. Il sert de référence pour les développeurs qui souhaitent comprendre et utiliser correctement les composants dans le respect des standards établis pour le projet.

## Table des matières

1. [Migration vers Material UI](#migration-vers-material-ui)
2. [Thème personnalisé](#thème-personnalisé)
3. [Système de navigation](#système-de-navigation)
4. [Composants d'animation](#composants-danimation)
5. [Composants de visualisation](#composants-de-visualisation)
6. [Bonnes pratiques](#bonnes-pratiques)
7. [Accessibilité](#accessibilité)
8. [Tests](#tests)

## Migration vers Material UI

### Vue d'ensemble

Nous avons migré de Bootstrap vers Material UI pour offrir une expérience utilisateur plus riche et cohérente. Material UI fournit des composants réactifs, accessibles et stylisables qui permettent un développement rapide tout en maintenant une haute qualité visuelle.

### Avantages principaux

- **Système de thème avancé** : Personnalisation centralisée des couleurs, typographies et dimensions
- **Composants riches** : Ensemble complet de composants prêts à l'emploi
- **Styled Components** : Intégration avec styled-components pour des styles personnalisés
- **Support des animations** : Compatibilité avec Framer Motion pour des transitions riches
- **Accessibilité** : Conformité WCAG 2.1 intégrée aux composants

### Comment utiliser Material UI

```jsx
import { Button, Typography, Box } from '@mui/material';
import { styled } from '@mui/material/styles';

// Utilisation de base
<Button variant="contained" color="primary">Mon Bouton</Button>

// Utilisation avec styled-components
const CustomButton = styled(Button)(({ theme }) => ({
  borderRadius: '50px',
  padding: theme.spacing(1, 3),
  textTransform: 'none',
  boxShadow: theme.shadows[3]
}));

<CustomButton variant="contained" color="secondary">
  Bouton Personnalisé
</CustomButton>
```

## Thème personnalisé

### Configuration du thème

Nous avons créé un thème personnalisé dans `src/theme/modernTheme.js` qui définit notre palette de couleurs, typographie et style global. Ce thème est ensuite appliqué à l'application via le `ThemeProvider` dans `App.js`.

### Palette de couleurs

```javascript
palette: {
  primary: {
    light: '#4dabf5',
    main: '#1976d2',  // Bleu cyclisme
    dark: '#1565c0',
    contrastText: '#fff',
  },
  secondary: {
    light: '#ff94c2',
    main: '#f50057',  // Rouge dynamique
    dark: '#c51162',
    contrastText: '#fff',
  },
  // Autres couleurs...
}
```

### Typographie

Notre système utilise la police "Inter" optimisée pour la lisibilité sur tous les appareils et offre une hiérarchie claire des textes.

### Comment utiliser le thème

```jsx
import { useTheme } from '@mui/material/styles';

function MyComponent() {
  const theme = useTheme();
  
  return (
    <div style={{ 
      backgroundColor: theme.palette.background.paper,
      padding: theme.spacing(2),
      borderRadius: theme.shape.borderRadius
    }}>
      Contenu avec styles dérivés du thème
    </div>
  );
}
```

## Système de navigation

### AnimatedNavbar

Le composant `AnimatedNavbar` (`src/components/navigation/AnimatedNavbar.js`) est notre composant de navigation principal qui s'adapte au défilement et aux dimensions de l'écran.

#### Caractéristiques

- **Animation au défilement** : La barre se compresse et change d'apparence au défilement
- **Navigation réactive** : S'adapte automatiquement aux mobiles avec un drawer latéral
- **Indicateurs visuels** : Animation des liens actifs avec une barre sous le texte
- **Intégration utilisateur** : Affichage du profil et menu utilisateur intégrés

#### Utilisation

```jsx
// Dans App.js
import AnimatedNavbar from './components/navigation/AnimatedNavbar';

function App() {
  return (
    <div className="app">
      <AnimatedNavbar />
      {/* Reste de l'application */}
    </div>
  );
}
```

### Comportement mobile vs desktop

- **Desktop** : Barre horizontale avec menu complet visible
- **Mobile** : Icône de menu hamburger ouvrant un drawer latéral avec animation

## Composants d'animation

### PageTransition

Le composant `PageTransition` (`src/components/animations/PageTransition.js`) gère les transitions entre les pages de l'application.

#### Caractéristiques

- **Transitions fluides** : Animations douces entre les pages
- **Modes multiples** : Plusieurs types de transitions (fade, slide, etc.)
- **Performance optimisée** : Utilisation de l'accélération matérielle quand disponible

#### Utilisation

```jsx
import { PageTransition } from '../components/animations/PageTransition';

function MyPage() {
  return (
    <PageTransition>
      <div className="page-content">
        {/* Contenu de la page */}
      </div>
    </PageTransition>
  );
}
```

### HeroParallax

Le composant `HeroParallax` (`src/components/animations/HeroParallax.js`) crée un effet de parallaxe pour les sections d'en-tête.

#### Caractéristiques

- **Effet de profondeur** : Mouvement des éléments à différentes vitesses
- **Réactivité** : S'adapte à tous les formats d'écran
- **Performance** : Optimisé pour des animations fluides
- **Accessibilité** : Peut être désactivé pour les utilisateurs qui préfèrent les mouvements réduits

#### Utilisation

```jsx
import HeroParallax from '../components/animations/HeroParallax';

function HomePage() {
  return (
    <HeroParallax
      backgroundImage="/images/hero-bg.jpg"
      title="Découvrez les plus beaux cols d'Europe"
      subtitle="Planifiez vos aventures cyclistes comme jamais auparavant"
    >
      <Button variant="contained" color="primary">
        Explorer maintenant
      </Button>
    </HeroParallax>
  );
}
```

## Composants de visualisation

### VisualizationDashboard

Le tableau de bord de visualisation (`src/pages/VisualizationDashboard.js`) offre une interface unifiée pour explorer les données des cols et des parcours.

#### Caractéristiques

- **Interface à onglets** : Navigation facile entre différentes visualisations
- **Chargement dynamique** : Affichage progressif des données
- **États de chargement** : Feedback visuel pendant le chargement des données
- **Gestion des erreurs** : Affichage élégant des erreurs avec options de récupération

### ColVisualization3D

Le composant `ColVisualization3D` visualise les cols en 3D avec des données d'élévation et des points d'intérêt.

#### Caractéristiques

- **Visualisation 3D** : Représentation tridimensionnelle des profils d'élévation
- **Navigation interactive** : Rotation, zoom et déplacement dans la visualisation
- **Points d'intérêt** : Marqueurs pour les points notables sur le parcours
- **Informations contextuelles** : Affichage des données pertinentes au survol

#### Configuration technique

La visualisation 3D utilise Three.js et est optimisée pour une performance fluide même sur des appareils moins puissants.

## Bonnes pratiques

### Style et conventions

1. **Styled Components** : Privilégier l'utilisation de styled-components pour les styles personnalisés
2. **Nommage des composants** : CamelCase pour les noms de composants (ex: `CustomButton`)
3. **Propriétés des composants** : camelCase pour les noms de propriétés (ex: `onClick`)
4. **Organisation des imports** : Grouper les imports par catégorie (React, MUI, Components, etc.)

### Performance

1. **Lazy loading** : Utiliser le chargement paresseux pour les composants lourds
2. **Memoization** : Utiliser React.memo et useMemo pour optimiser les rendus
3. **useCallback** : Pour les fonctions passées aux composants enfants
4. **Optimisation des animations** : Utiliser `will-change` et `transform` pour les animations fluides

## Accessibilité

Notre interface respecte les standards WCAG 2.1 AA avec les fonctionnalités suivantes :

- **Navigation au clavier** : Tous les éléments interactifs sont accessibles au clavier
- **ARIA** : Attributs ARIA appropriés pour tous les composants complexes
- **Contraste** : Respecte les ratios de contraste minimum
- **Texte alternatif** : Images accompagnées de textes alternatifs descriptifs
- **Préférences de mouvement** : Respect des préférences de réduction de mouvement

## Tests

### Tests unitaires

Les composants UI sont testés avec Jest et React Testing Library.

```javascript
// Exemple de test pour AnimatedNavbar
import { render, screen, fireEvent } from '@testing-library/react';
import AnimatedNavbar from '../../components/navigation/AnimatedNavbar';

test('renders navigation links', () => {
  render(<AnimatedNavbar />);
  expect(screen.getByText(/Accueil/i)).toBeInTheDocument();
  expect(screen.getByText(/Cols/i)).toBeInTheDocument();
});

test('opens mobile menu when hamburger icon is clicked', () => {
  render(<AnimatedNavbar />);
  fireEvent.click(screen.getByLabelText(/menu/i));
  expect(screen.getByRole('presentation')).toBeInTheDocument();
});
```

### Tests d'accessibilité

Nous utilisons axe-core pour tester l'accessibilité de nos composants.

```javascript
import { axe } from 'jest-axe';

test('has no accessibility violations', async () => {
  const { container } = render(<AnimatedNavbar />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Tests de performance

Utilisation de Lighthouse et de mesures de performance personnalisées pour garantir une UI fluide sur tous les appareils.

## Conclusion

Cette documentation est en constante évolution. Pour toute question ou suggestion concernant l'interface utilisateur, contactez l'équipe frontend à frontend@euro-cycling-dashboard.eu.
