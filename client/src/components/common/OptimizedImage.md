# OptimizedImage

## Vue d'ensemble

`OptimizedImage` est un composant React optimisé pour le chargement d'images qui améliore les performances et l'expérience utilisateur. Il implémente plusieurs techniques d'optimisation comme le lazy loading (chargement paresseux) et l'effet blur-up pour offrir une expérience visuelle fluide.

## Caractéristiques principales

- **Lazy loading** - Les images ne sont chargées que lorsqu'elles approchent du viewport
- **Effet blur-up** - Affiche d'abord une version basse résolution qui se transforme progressivement en image haute résolution
- **Gestion des ratios d'aspect** - Maintient le ratio d'aspect correct pendant le chargement
- **Gestion des erreurs** - Affiche une image de remplacement en cas d'erreur
- **Indicateur de chargement** - Montre un état de chargement pendant le téléchargement de l'image
- **Accessibilité** - Supporte les textes alternatifs et les annonces pour lecteurs d'écran

## Installation

Le composant est disponible dans le dossier `components/common/` de l'application Grand Est Cyclisme.

```jsx
import OptimizedImage from '../components/common/OptimizedImage';
```

## Utilisation

### Exemple de base

```jsx
<OptimizedImage
  src="/images/col-du-galibier.jpg"
  alt="Col du Galibier dans les Alpes françaises"
  width="100%"
  height="300px"
/>
```

### Avec effet blur-up

```jsx
<OptimizedImage
  src="/images/mont-ventoux-hd.jpg"
  lowResSrc="/images/mont-ventoux-thumbnail.jpg"
  alt="Mont Ventoux"
  aspectRatio={16/9}
/>
```

### En tant qu'image prioritaire

```jsx
<OptimizedImage
  src="/images/hero-image.jpg"
  alt="Image principale de la page d'accueil"
  priority={true}
  width="100%"
/>
```

### Avec gestion d'événements

```jsx
<OptimizedImage
  src="/images/alpe-dhuez.jpg"
  alt="L'Alpe d'Huez"
  onLoad={() => console.log('Image chargée avec succès')}
  onError={() => console.error('Erreur de chargement')}
/>
```

## API

### Props

| Nom | Type | Défaut | Description |
|-----|------|--------|-------------|
| `src` | string | *obligatoire* | URL de l'image principale à charger |
| `alt` | string | *obligatoire* | Texte alternatif pour l'accessibilité |
| `lowResSrc` | string | `undefined` | URL d'une version basse résolution pour l'effet blur-up |
| `width` | string\|number | `'100%'` | Largeur de l'image |
| `height` | string\|number | `'auto'` | Hauteur de l'image |
| `aspectRatio` | number | `undefined` | Ratio d'aspect à maintenir (ex: 16/9) |
| `objectFit` | string | `'cover'` | Comment l'image doit s'adapter à son conteneur |
| `borderRadius` | string\|number | `undefined` | Rayon de la bordure |
| `disableLazyLoading` | boolean | `false` | Désactive le lazy loading |
| `priority` | boolean | `false` | Charge l'image immédiatement, sans lazy loading |
| `fallbackSrc` | string | `/images/placeholder.jpg` | Image à afficher en cas d'erreur |
| `onLoad` | function | `undefined` | Fonction appelée quand l'image est chargée |
| `onError` | function | `undefined` | Fonction appelée en cas d'erreur de chargement |
| `imgProps` | object | `{}` | Props supplémentaires à passer à l'élément img |

## Fonctionnement interne

### Lazy Loading

Le composant utilise `IntersectionObserver` via le hook `useInView` de `react-intersection-observer` pour détecter quand l'image s'approche du viewport. L'image n'est chargée que lorsqu'elle est sur le point d'être visible, ce qui permet :

- De réduire le chargement initial de la page
- D'économiser la bande passante pour les utilisateurs
- D'améliorer les performances globales de l'application

### Technique Blur-Up

Cette technique consiste à :
1. Afficher d'abord une version très légère et floue de l'image (ex: 20-30 KB)
2. Charger l'image haute résolution en arrière-plan
3. Effectuer une transition douce entre les deux images

Cela donne l'impression d'un chargement instantané tout en offrant une expérience visuelle agréable pendant le chargement de l'image complète.

### Gestion du ratio d'aspect

Le composant peut maintenir un ratio d'aspect spécifique, ce qui évite les sauts de contenu (layout shift) lors du chargement des images. C'est particulièrement important pour le Core Web Vitals et l'expérience utilisateur.

## Bonnes pratiques

- **Toujours fournir un attribut `alt`** pour l'accessibilité
- **Utiliser des thumbnails appropriés** pour l'effet blur-up (environ 10-20 fois plus petits que l'image d'origine)
- **Spécifier un `aspectRatio`** pour éviter les sauts de mise en page
- **Utiliser `priority={true}`** uniquement pour les images au-dessus de la ligne de flottaison (above the fold)
- **Optimiser les images source** avant de les servir (compression, dimensionnement approprié)

## Exemple d'intégration avec les grilles d'images

```jsx
import React from 'react';
import { Grid, Box } from '@mui/material';
import OptimizedImage from '../components/common/OptimizedImage';

const ImageGallery = ({ images }) => (
  <Grid container spacing={2}>
    {images.map((image, index) => (
      <Grid item xs={12} sm={6} md={4} key={index}>
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <OptimizedImage
            src={image.src}
            lowResSrc={image.thumbnail}
            alt={image.description}
            aspectRatio={4/3}
            borderRadius={8}
          />
          <Box mt={1}>
            <Typography variant="subtitle1">{image.title}</Typography>
          </Box>
        </Box>
      </Grid>
    ))}
  </Grid>
);

export default ImageGallery;
```
