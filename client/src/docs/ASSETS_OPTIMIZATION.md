# Documentation d'Optimisation des Assets

## Introduction

Ce document détaille les stratégies et techniques d'optimisation des assets (images, vidéos, polices, etc.) mises en place pour Dashboard-Velo.com. Ces optimisations visent à améliorer les performances de chargement, réduire l'utilisation de la bande passante et offrir une expérience utilisateur optimale sur tous les appareils.

## Stratégie Globale d'Optimisation

Notre approche d'optimisation des assets repose sur quatre principes fondamentaux :

1. **Minimalisme** : Ne charger que ce qui est nécessaire
2. **Progressivité** : Charger d'abord le contenu critique, puis le reste progressivement
3. **Adaptation** : Servir des assets adaptés aux capacités de l'appareil et du réseau
4. **Réutilisation** : Maximiser la mise en cache pour des chargements ultérieurs rapides

## Optimisation des Images

### Formats Modernes

Nous utilisons une stratégie multi-format pour servir les images dans le format le plus optimal selon le support du navigateur :

1. **AVIF** : Format nouvelle génération avec compression supérieure (réduction de 50% par rapport à WebP)
2. **WebP** : Format moderne avec bon support navigateur (réduction de 30% par rapport à JPEG)
3. **JPEG/PNG** : Formats traditionnels pour la compatibilité

L'implémentation utilise la balise `<picture>` avec sources multiples :

```html
<picture>
  <source type="image/avif" srcset="image.avif" />
  <source type="image/webp" srcset="image.webp" />
  <img src="image.jpg" alt="Description" loading="lazy" />
</picture>
```

### Images Responsives

Nous générons automatiquement plusieurs variantes de chaque image pour différentes tailles d'écran :

| Largeur | Utilisation |
|---------|-------------|
| 320px   | Petits mobiles |
| 640px   | Mobiles standard |
| 960px   | Tablettes, mobiles paysage |
| 1280px  | Ordinateurs portables, tablettes paysage |
| 1920px  | Grands écrans |
| 2560px  | Écrans haute densité |

L'implémentation utilise les attributs `srcset` et `sizes` :

```html
<img 
  src="image-960w.jpg" 
  srcset="
    image-320w.jpg 320w,
    image-640w.jpg 640w,
    image-960w.jpg 960w,
    image-1280w.jpg 1280w,
    image-1920w.jpg 1920w,
    image-2560w.jpg 2560w
  "
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  alt="Description"
/>
```

### Techniques de Chargement

1. **Lazy Loading** : Les images sont chargées uniquement lorsqu'elles approchent du viewport
2. **Placeholder Blur** : Petite image floue (data URL) affichée pendant le chargement
3. **Preloading** : Préchargement des images critiques pour un affichage immédiat
4. **Inline SVG** : Utilisation de SVG inline pour les icônes et illustrations simples

Exemple de composant optimisé `<ResponsiveImage>` :

```jsx
<ResponsiveImage
  src="/images/col-galibier.jpg"
  alt="Col du Galibier"
  width={800}
  height={600}
  sizes="(max-width: 768px) 100vw, 800px"
  lazy={true}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAoHBw..."
/>
```

### Pipeline d'Optimisation d'Images

Notre pipeline automatisé d'optimisation d'images inclut :

1. **Redimensionnement** : Génération de variantes responsives
2. **Compression** : Optimisation avec des outils comme MozJPEG, OptiPNG
3. **Conversion de format** : Génération de versions WebP et AVIF
4. **Génération de placeholders** : Création de miniatures floues pour chargement progressif

Commandes de préparation d'images :

```bash
# Installation des outils
npm install -g sharp avif webp-converter

# Conversion en WebP
find ./src/assets/images -type f \( -name "*.jpg" -o -name "*.png" \) -exec sh -c 'cwebp -q 80 $1 -o "${1%.*}.webp"' _ {} \;

# Conversion en AVIF
find ./src/assets/images -type f \( -name "*.jpg" -o -name "*.png" \) -exec sh -c 'avifenc -s 0 -d 8 -q 65 $1 "${1%.*}.avif"' _ {} \;

# Redimensionnement (exemple avec Sharp)
for img in ./src/assets/images/**/*.{jpg,png}; do
  filename=$(basename -- "$img")
  dir=$(dirname "$img")
  name="${filename%.*}"
  ext="${filename##*.}"
  
  for size in 320 640 960 1280 1920 2560; do
    sharp "$img" --resize $size --output "$dir/${name}-${size}w.${ext}"
  done
done
```

## Optimisation des Polices

### Stratégie de Chargement des Polices

1. **Subsetting** : Inclusion uniquement des caractères nécessaires pour réduire la taille
2. **Format WOFF2** : Utilisation du format de police le plus efficace (réduction de ~30%)
3. **Font Display Swap** : Affichage du texte en police système pendant le chargement
4. **Preloading** : Préchargement des polices essentielles

Exemple d'implémentation dans le `<head>` :

```html
<!-- Préchargement des polices principales -->
<link rel="preload" href="/fonts/roboto-v20-latin-regular.woff2" as="font" type="font/woff2" crossorigin>

<!-- Configuration CSS des polices -->
<style>
  @font-face {
    font-family: 'Roboto';
    font-style: normal;
    font-weight: 400;
    font-display: swap;
    src: local('Roboto'), local('Roboto-Regular'),
         url('/fonts/roboto-v20-latin-regular.woff2') format('woff2'),
         url('/fonts/roboto-v20-latin-regular.woff') format('woff');
  }
</style>
```

### Hébergement Local vs CDN

Nous privilégions l'hébergement local des polices pour :
- Contrôler précisément le chargement et la mise en cache
- Éviter les requêtes DNS supplémentaires
- Garantir la conformité RGPD sans tracker tiers

## Optimisation des Scripts et Styles

### Minification et Bundling

1. **Minification** : Réduction de la taille des fichiers JS et CSS
2. **Tree Shaking** : Élimination du code inutilisé
3. **Code Splitting** : Séparation du code en chunks chargés à la demande
4. **Compression** : Utilisation de Brotli (ou Gzip) pour la compression

Configuration dans webpack.config.prod.js pour le code splitting :

```javascript
optimization: {
  splitChunks: {
    chunks: 'all',
    maxInitialRequests: Infinity,
    minSize: 20000,
    cacheGroups: {
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name(module) {
          const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
          return `vendor.${packageName.replace('@', '')}`;
        },
      },
      styles: {
        name: 'styles',
        test: /\.css$/,
        chunks: 'all',
        enforce: true,
      },
    },
  },
  runtimeChunk: 'single',
}
```

### Critical CSS

Nous extrayons et inlinons le CSS critique nécessaire au rendu initial pour éviter les blocages de rendu :

1. **Extraction automatique** du CSS critique avec des outils comme CriticalCSS
2. **Inline dans le HTML** pour les styles critiques
3. **Chargement asynchrone** du reste du CSS

Exemple d'implémentation :

```html
<head>
  <!-- CSS critique inliné -->
  <style>
    /* CSS critique extrait automatiquement */
    body { margin: 0; font-family: sans-serif; }
    header { background: #1976d2; color: white; padding: 1rem; }
    /* ... autres styles critiques ... */
  </style>
  
  <!-- Chargement asynchrone du reste du CSS -->
  <link rel="preload" href="/static/css/main.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="/static/css/main.css"></noscript>
</head>
```

## Optimisation des Vidéos

### Formats et Encodage

1. **MP4 (H.264)** : Format universel pour la compatibilité
2. **WebM (VP9)** : Format moderne avec meilleure compression
3. **Transmuxing** : Conversion à la volée vers le format optimal

Configuration de base :

```html
<video controls preload="metadata">
  <source src="video.webm" type="video/webm">
  <source src="video.mp4" type="video/mp4">
  Votre navigateur ne supporte pas la lecture de vidéos.
</video>
```

### Techniques d'Optimisation

1. **Lazy Loading** : Chargement différé avec attribut `loading="lazy"` ou intersection observer
2. **Preloading** : `<link rel="preload">` pour les vidéos critiques
3. **Compression adaptative** : Codecs et débits adaptés selon la bande passante
4. **Streaming adaptatif** : Utilisation de HLS ou DASH pour les vidéos longues

Exemple de configuration HLS :

```html
<script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>

<video id="video" controls></video>

<script>
  const video = document.getElementById('video');
  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource('video.m3u8');
    hls.attachMedia(video);
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = 'video.m3u8';
  }
</script>
```

## Optimisation des Modèles 3D

Pour les composants 3D du Dashboard-Velo :

1. **Formats optimisés** : utilisation de glTF compressé (draco, meshopt)
2. **Niveaux de détail (LOD)** : modèles avec différents niveaux de détail selon la distance
3. **Chargement progressif** : chargement par étapes des parties les plus complexes
4. **Texturation optimisée** : mipmaps, compression de textures

Exemple de chargement d'un modèle 3D optimisé avec Three.js :

```javascript
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

// Configuration du chargeur Draco pour la décompression
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');

// Initialisation du chargeur GLTF
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

// Chargement du modèle
gltfLoader.load(
  'models/bike.glb',
  (gltf) => {
    // Modèle chargé avec succès
    scene.add(gltf.scene);
  },
  (progress) => {
    // Progression du chargement
    console.log((progress.loaded / progress.total * 100) + '% loaded');
  },
  (error) => {
    // Erreur de chargement
    console.error('An error happened:', error);
  }
);
```

## Service Workers et Mise en Cache

### Stratégie de Mise en Cache

1. **Cache-First** pour les assets statiques (images, polices, etc.)
2. **Network-First** pour les données dynamiques ou de contenu
3. **Stale-While-Revalidate** pour les données semi-dynamiques

Exemple d'implémentation dans le service worker :

```javascript
// Assets statiques - Stratégie Cache-First
workbox.routing.registerRoute(
  ({request}) => request.destination === 'image' ||
                 request.destination === 'style' ||
                 request.destination === 'font',
  new workbox.strategies.CacheFirst({
    cacheName: 'static-assets',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 jours
      }),
    ],
  })
);

// Données API - Stratégie Network-First
workbox.routing.registerRoute(
  ({url}) => url.pathname.startsWith('/api/'),
  new workbox.strategies.NetworkFirst({
    cacheName: 'api-responses',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60, // 24 heures
      }),
    ],
  })
);

// Pages HTML - Stratégie Stale-While-Revalidate
workbox.routing.registerRoute(
  ({request}) => request.mode === 'navigate',
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'pages',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 25,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 jours
      }),
    ],
  })
);
```

### Précaching des Assets Critiques

Les assets critiques sont pré-mis en cache lors de l'installation du service worker :

```javascript
workbox.precaching.precacheAndRoute([
  { url: '/index.html', revision: '383676' },
  { url: '/static/css/main.css', revision: '383676' },
  { url: '/static/js/main.js', revision: '383676' },
  { url: '/static/media/logo.svg', revision: '383676' },
  { url: '/offline.html', revision: '383676' },
]);
```

## Déploiement et CDN

### Configuration du CDN

Nous utilisons un CDN avec les optimisations suivantes :

1. **Edge Caching** : Mise en cache au plus près des utilisateurs
2. **HTTP/2** : Multiplexage des requêtes pour réduire la latence
3. **Brotli Compression** : Compression plus efficace que Gzip
4. **Cache-Control** : En-têtes optimisés pour la mise en cache

Exemple d'en-têtes Cache-Control :

```
# Longue durée pour les assets versionnés
<FilesMatch "\.(js|css|svg|ttf|woff|woff2|png|jpg|jpeg|webp|avif|ico)$">
  Header set Cache-Control "public, max-age=31536000, immutable"
</FilesMatch>

# Durée modérée pour le HTML
<FilesMatch "\.html$">
  Header set Cache-Control "public, max-age=3600, must-revalidate"
</FilesMatch>
```

### Optimisation de Livraison d'Assets

1. **Domain Sharding** : Répartition des assets sur plusieurs domaines pour contourner la limite de connexions parallèles
2. **Assets Preloading** : Préchargement des assets critiques
3. **Cookie-less Domains** : Domaines sans cookies pour les assets statiques

## Tests et Vérification des Performances

### Outils de Test

1. **Lighthouse** : Score cible > 90 pour Performance, SEO, Accessibilité
2. **WebPageTest** : Analyse détaillée des temps de chargement
3. **Core Web Vitals** : Suivi des métriques LCP, FID, CLS
4. **Bundle Analyzer** : Analyse de la taille des bundles JS

Exemple de configuration pour la surveillance des Core Web Vitals :

```javascript
// Enregistrement des métriques CWV
import { getCLS, getFID, getLCP } from 'web-vitals';

function sendToAnalytics({ name, delta, id }) {
  // Envoi des données à votre service d'analyse
  analytics.send({
    metric: name,
    value: delta,
    id: id
  });
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getLCP(sendToAnalytics);
```

### Checklist de Performance

Checklist pour valider l'optimisation des assets :

- [ ] Images servies en WebP/AVIF avec fallback
- [ ] Images responsives avec srcset et sizes appropriés
- [ ] Lazy loading pour les images non critiques
- [ ] CSS critique inliné
- [ ] JS découpé en chunks appropriés
- [ ] Polices optimisées avec font-display:swap
- [ ] Service Worker configuré avec stratégies de cache
- [ ] Compression Brotli/Gzip activée
- [ ] Cache-Control configuré correctement
- [ ] Score Lighthouse > 90 en Performance

## Conclusion

L'optimisation des assets est un processus continu qui nécessite de suivre les évolutions technologiques. Notre approche vise à fournir la meilleure expérience possible à tous les utilisateurs, quelle que soit leur appareil ou leur connexion.

Nous surveillons continuellement les métriques de performance et ajustons notre stratégie pour garantir des temps de chargement optimaux pour Dashboard-Velo.com.
