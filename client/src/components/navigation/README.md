# Système de Navigation Global

## Vue d'ensemble

Le système de navigation global fournit une expérience de navigation cohérente à travers toute l'application Grand Est Cyclisme. Il comprend un header, une barre de navigation principale et un menu latéral (drawer) pour les appareils mobiles.

## Composants

### GlobalNavigation

Le composant principal qui orchestre l'ensemble du système de navigation.

```jsx
import GlobalNavigation from './components/navigation/GlobalNavigation';

// Dans votre App.js
<GlobalNavigation />
```

#### Caractéristiques

- **Responsive** : S'adapte automatiquement aux différentes tailles d'écran
- **Optimisé pour les performances** :
  - Utilise React.memo pour éviter les re-renders inutiles
  - Implémente le lazy loading pour charger les composants à la demande
- **Accessible** :
  - Conforme aux normes WCAG 2.1 niveau AA
  - Prend en charge la navigation au clavier
  - Inclut un lien "Skip to content"
  - Compatible avec les lecteurs d'écran
- **Intégration de Material-UI** : Utilise les composants Material-UI pour une interface moderne et cohérente

### Header

Le composant d'en-tête qui contient le logo, les boutons d'actions et les menus utilisateur.

```jsx
import Header from './components/common/Header';

// Utilisation
<Header onMenuClick={handleMenuClick} />
```

#### Props

| Nom | Type | Défaut | Description |
|-----|------|--------|-------------|
| `onMenuClick` | function | required | Fonction appelée lors du clic sur le bouton de menu (mobile) |

#### Caractéristiques

- **Menu utilisateur** : Accès rapide au profil et aux paramètres
- **Sélecteur de langue** : Permet de changer la langue de l'application
- **Bouton de thème** : Permet de basculer entre les modes clair et sombre
- **Responsive** : Adaptation aux différentes tailles d'écran

### OptimizedImage

Composant d'image optimisé pour les performances avec lazy loading et technique de blur-up.

```jsx
import OptimizedImage from './components/common/OptimizedImage';

// Utilisation
<OptimizedImage 
  src="/path/to/image.jpg"
  lowResSrc="/path/to/thumbnail.jpg"
  alt="Description de l'image"
  aspectRatio={16/9}
/>
```

#### Props

| Nom | Type | Défaut | Description |
|-----|------|--------|-------------|
| `src` | string | required | URL de l'image |
| `lowResSrc` | string | - | URL de l'image basse résolution pour l'effet blur-up |
| `alt` | string | required | Texte alternatif pour l'accessibilité |
| `aspectRatio` | number | - | Ratio d'aspect de l'image (ex: 16/9, 4/3) |
| `width` | string\|number | '100%' | Largeur de l'image |
| `height` | string\|number | 'auto' | Hauteur de l'image |
| `borderRadius` | string\|number | - | Rayon de la bordure |
| `objectFit` | string | 'cover' | Comportement de redimensionnement |
| `onLoad` | function | - | Callback appelé quand l'image est chargée |
| `onError` | function | - | Callback appelé en cas d'erreur |
| `disableLazyLoading` | boolean | false | Désactive le lazy loading |
| `priority` | boolean | false | Charge l'image immédiatement |
| `imgProps` | object | {} | Props supplémentaires pour l'élément img |

#### Caractéristiques

- **Lazy loading** : Charge les images uniquement lorsqu'elles approchent de la zone visible
- **Technique blur-up** : Affiche d'abord une version floue puis la version complète
- **Performances optimisées** : Évite les re-renders et améliore l'expérience utilisateur
- **Accessibilité** : Compatibilité avec les lecteurs d'écran et textes alternatifs

### LoadingFallback

Composant d'indicateur de chargement à utiliser pendant le lazy loading.

```jsx
import LoadingFallback from './components/common/LoadingFallback';

// Dans un Suspense
<Suspense fallback={<LoadingFallback type="content" message="Chargement en cours..." />}>
  <ComponentAvecLazyLoading />
</Suspense>
```

#### Props

| Nom | Type | Défaut | Description |
|-----|------|--------|-------------|
| `type` | string | 'content' | Type de contenu en chargement ('navigation', 'content', 'image', 'card') |
| `height` | string\|number | - | Hauteur du composant |
| `message` | string | - | Message personnalisé à afficher |
| `showProgressValue` | boolean | false | Affiche la valeur de progression |
| `progressValue` | number | 0 | Valeur de progression (0-100) |

#### Caractéristiques

- **Différents styles** : Adaptés au type de contenu en chargement
- **Animations subtiles** : Améliore l'expérience utilisateur pendant l'attente
- **Accessibilité** : Annonces pour les lecteurs d'écran
- **Personnalisable** : Messages et apparence configurables

## Bonnes Pratiques d'Utilisation

### Performance

- Utilisez le lazy loading pour les composants lourds et les pages
- Utilisez OptimizedImage pour toutes les images de l'application
- Mettez en cache les ressources statiques pour réduire les temps de chargement

### Accessibilité

- Assurez-vous que tous les éléments interactifs sont accessibles au clavier
- Utilisez des attributs ARIA appropriés pour les composants personnalisés
- Testez régulièrement l'application avec un lecteur d'écran
- Respectez un ratio de contraste suffisant pour tous les textes

### Responsive Design

- Testez l'application sur différentes tailles d'écran
- Utilisez les hooks useMediaQuery pour adapter le contenu
- Priorisez le contenu sur mobile (mobile-first approach)

## Exemples d'Intégration

### Layout Principal

```jsx
import React, { Suspense } from 'react';
import GlobalNavigation from './components/navigation/GlobalNavigation';
import LoadingFallback from './components/common/LoadingFallback';
import Footer from './components/common/Footer';

const MainLayout = ({ children }) => (
  <>
    <Suspense fallback={<LoadingFallback type="navigation" />}>
      <GlobalNavigation />
    </Suspense>
    
    <main id="main-content">
      {children}
    </main>
    
    <Footer />
  </>
);

export default MainLayout;
```

### Page avec Contenu Lazy-Loaded

```jsx
import React, { lazy, Suspense } from 'react';
import LoadingFallback from './components/common/LoadingFallback';

const HeavyComponent = lazy(() => import('./components/HeavyComponent'));

const MyPage = () => (
  <div>
    <h1>Ma Page</h1>
    <Suspense fallback={<LoadingFallback type="content" />}>
      <HeavyComponent />
    </Suspense>
  </div>
);

export default MyPage;
```
