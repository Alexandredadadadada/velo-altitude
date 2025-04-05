# LoadingFallback

## Vue d'ensemble

`LoadingFallback` est un composant React conçu pour afficher des indicateurs de chargement attrayants et informatifs lors du lazy loading des composants dans l'application Grand Est Cyclisme. Il propose diverses variantes adaptées à différents types de contenu et de contextes.

## Caractéristiques principales

- **Variantes adaptées au contexte** - Différents styles pour le chargement des pages, cartes, images, etc.
- **Animations subtiles** - Feedback visuel non intrusif pour améliorer l'expérience utilisateur
- **Messages personnalisables** - Possibilité d'afficher un message explicatif pendant le chargement
- **Indicateur de progression** - Option pour afficher l'état d'avancement du chargement
- **Réduction de la "fatigue de chargement"** - Conçu pour diminuer la perception du temps d'attente
- **Accessibilité** - Annonces pour les lecteurs d'écran et compatibilité WCAG 2.1

## Installation

Le composant est disponible dans le dossier `components/common/` de l'application Grand Est Cyclisme.

```jsx
import LoadingFallback from '../components/common/LoadingFallback';
```

## Utilisation

### Exemple de base avec React Suspense

```jsx
import React, { Suspense, lazy } from 'react';
import LoadingFallback from '../components/common/LoadingFallback';

const LazyComponent = lazy(() => import('./HeavyComponent'));

function MyComponent() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LazyComponent />
    </Suspense>
  );
}
```

### Avec message personnalisé

```jsx
<Suspense fallback={
  <LoadingFallback 
    message="Chargement des données de cols..." 
    type="content"
  />
}>
  <ColsExplorer />
</Suspense>
```

### Avec indicateur de progression

```jsx
const [progress, setProgress] = useState(0);

// Mise à jour du progrès...

<LoadingFallback 
  showProgressValue={true} 
  progressValue={progress}
  message={`Chargement des images ${progress}%`} 
  type="image"
/>
```

### Différents types de fallback

```jsx
// Pour le chargement d'une page complète
<LoadingFallback type="page" />

// Pour les éléments de type carte
<LoadingFallback type="card" />

// Pour les éléments de navigation
<LoadingFallback type="navigation" />

// Pour les tableaux de données
<LoadingFallback type="table" height="400px" />
```

## API

### Props

| Nom | Type | Défaut | Description |
|-----|------|--------|-------------|
| `type` | string | `'content'` | Type de contenu en chargement. Options: `'content'`, `'navigation'`, `'image'`, `'card'`, `'table'`, `'page'` |
| `message` | string | `undefined` | Message informatif à afficher pendant le chargement |
| `height` | string\|number | Dépend du type | Hauteur du conteneur de chargement |
| `width` | string\|number | `'100%'` | Largeur du conteneur de chargement |
| `showProgressValue` | boolean | `false` | Affiche un indicateur de progression numérique |
| `progressValue` | number | `0` | Valeur de la progression (0-100) |
| `variant` | string | `'determinate'` | Type de barre de progression. Options: `'determinate'`, `'indeterminate'`, `'pulse'` |
| `color` | string | `'primary'` | Couleur des indicateurs. Options: couleurs du thème Material-UI |
| `backgroundColor` | string | Dépend du thème | Couleur de fond du conteneur |
| `showLogo` | boolean | `false` | Affiche le logo de l'application pendant le chargement |

## Intégration avec le système de navigation

Le composant `LoadingFallback` s'intègre parfaitement avec le système de navigation global et le lazy loading des pages :

```jsx
// Dans App.js
import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import GlobalNavigation from './components/navigation/GlobalNavigation';
import LoadingFallback from './components/common/LoadingFallback';

// Lazy loading des pages
const HomePage = lazy(() => import('./pages/HomePage'));
const ColsPage = lazy(() => import('./pages/ColsPage'));
const ChallengesPage = lazy(() => import('./pages/ChallengesPage'));
const SevenMajorsChallenge = lazy(() => import('./components/challenges/SevenMajorsChallenge'));

function App() {
  return (
    <>
      <GlobalNavigation />
      
      <main id="main-content">
        <Routes>
          <Route path="/" element={
            <Suspense fallback={<LoadingFallback type="page" message="Chargement de la page d'accueil..." />}>
              <HomePage />
            </Suspense>
          } />
          <Route path="/cols/*" element={
            <Suspense fallback={<LoadingFallback type="page" message="Chargement des cols..." />}>
              <ColsPage />
            </Suspense>
          } />
          <Route path="/challenges/seven-majors" element={
            <Suspense fallback={<LoadingFallback type="page" message="Préparation du défi Les 7 Majeurs..." />}>
              <SevenMajorsChallenge />
            </Suspense>
          } />
          {/* Autres routes... */}
        </Routes>
      </main>
    </>
  );
}

export default App;
```

## Adaptations pour différents types de contenu

### Pour les pages de contenu

- Affiche une animation plus large et centrée
- Peut inclure le logo de l'application pour renforcer l'identité visuelle

### Pour les cartes et vignettes

- Version plus compacte adaptée aux conteneurs de type carte
- Animation plus subtile et légère

### Pour les tableaux et listes de données

- Représentation sous forme de lignes squelettes
- Donne une impression de la structure à venir

### Pour la navigation

- Version minimaliste pour ne pas distraire l'utilisateur
- Priorité à la rapidité d'affichage

## Bonnes pratiques

- **Utiliser des messages informatifs et positifs** - "Préparation des données..." plutôt que "Veuillez patienter..."
- **Adapter le type de fallback au contenu** - Utiliser le type approprié pour chaque situation
- **Éviter les animations trop intenses** - Privilégier des animations subtiles et non distrayantes
- **Respecter les préférences de réduction de mouvement** - Le composant détecte automatiquement la préférence `prefers-reduced-motion`
- **Montrer la progression quand c'est possible** - Utiliser `showProgressValue` et `progressValue` pour les chargements longs

## Exemples d'intégration avec le défi "Les 7 Majeurs"

```jsx
// Dans SevenMajorsChallenge.js
import React, { useState, lazy, Suspense } from 'react';
import { Tabs, Tab, Box } from '@mui/material';
import LoadingFallback from '../common/LoadingFallback';

// Lazy loading des composants lourds
const ColsSearch = lazy(() => import('./ColsSearch'));
const ColVisualization3D = lazy(() => import('./ColVisualization3D'));
const CurrentChallenge = lazy(() => import('./CurrentChallenge'));
const PredefinedChallenges = lazy(() => import('./PredefinedChallenges'));
const SavedChallenges = lazy(() => import('./SavedChallenges'));

function SevenMajorsChallenge() {
  const [activeTab, setActiveTab] = useState(0);
  
  return (
    <Box>
      <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)}>
        <Tab label="Rechercher des cols" />
        <Tab label="Mon défi actuel" />
        <Tab label="Défis prédéfinis" />
        <Tab label="Mes défis sauvegardés" />
      </Tabs>
      
      <Box mt={3}>
        {activeTab === 0 && (
          <Suspense fallback={<LoadingFallback type="content" message="Chargement de la recherche..." />}>
            <ColsSearch />
          </Suspense>
        )}
        
        {activeTab === 1 && (
          <Suspense fallback={<LoadingFallback type="content" message="Chargement de votre défi..." />}>
            <CurrentChallenge />
          </Suspense>
        )}
        
        {activeTab === 2 && (
          <Suspense fallback={<LoadingFallback type="card" message="Chargement des défis prédéfinis..." />}>
            <PredefinedChallenges />
          </Suspense>
        )}
        
        {activeTab === 3 && (
          <Suspense fallback={<LoadingFallback type="card" message="Chargement de vos défis sauvegardés..." />}>
            <SavedChallenges />
          </Suspense>
        )}
      </Box>
      
      {/* Visualisation 3D avec chargement séparé */}
      <Box mt={4}>
        <Suspense fallback={
          <LoadingFallback 
            type="image" 
            height="300px"
            message="Préparation de la visualisation 3D..." 
          />
        }>
          <ColVisualization3D />
        </Suspense>
      </Box>
    </Box>
  );
}

export default SevenMajorsChallenge;
```
