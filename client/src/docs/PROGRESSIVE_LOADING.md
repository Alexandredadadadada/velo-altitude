# Documentation de Chargement Progressif

Ce document détaille les fonctionnalités de chargement progressif implémentées pour améliorer les performances de l'application, particulièrement sur les appareils mobiles.

## Table des matières

1. [Chargement 3D progressif](#chargement-3d-progressif)
2. [Chargement progressif des images](#chargement-progressif-des-images)
3. [Intégration dans les composants](#intégration-dans-les-composants)
4. [Optimisations mobiles](#optimisations-mobiles)
5. [Dépannage](#dépannage)
6. [Nouvelles optimisations de performance (Avril 2025)](#nouvelles-optimisations-de-performance-avril-2025)

## Chargement 3D progressif

Le service `progressive3DLoader.js` gère le chargement optimisé des modèles 3D en adaptant la qualité aux capacités de l'appareil.

### Fonctionnalités principales

- **Détection automatique des capacités** : Identification du type d'appareil, de la puissance GPU et de la mémoire disponible
- **Niveaux de détail adaptatifs** : Ajustement automatique de la qualité 3D (LOD) en fonction des performances
- **Gestion optimisée de la mémoire** : Surveillance et libération des ressources WebGL pour éviter les crashs sur mobile
- **Récupération après perte de contexte** : Restauration des ressources en cas de perte du contexte WebGL

### Utilisation de base

```javascript
import progressive3DLoader, { DETAIL_LEVELS } from '../services/progressive3DLoader';

// Initialiser le service
await progressive3DLoader.initialize();

// Enregistrer un renderer pour l'optimisation automatique
progressive3DLoader.registerRenderer(myThreeJsRenderer);

// Chargement d'un modèle 3D (utilisation simplifiée)
async function loadModel() {
  // Le chargement sera adapté aux capacités de l'appareil
  const model = await progressive3DLoader.loadModel('modelId', 'path/to/model.glb');
  
  // Ajouter à la scène
  scene.add(model);
}

// Libération des ressources quand nécessaire
function cleanupModel(modelId) {
  // Très important pour éviter les fuites mémoire sur mobile
  progressive3DLoader.unloadModel(modelId);
}

// Libération complète
function dispose() {
  progressive3DLoader.dispose();
}
```

### Niveaux de détail disponibles

Le service définit plusieurs niveaux de détail, de `ULTRA_LOW` à `ULTRA`, chacun adapté à différentes capacités d'appareil.

| Niveau | Utilisation recommandée |
|--------|-------------------------|
| ULTRA_LOW | Appareils très limités ou chargement initial |
| LOW | Téléphones mobiles bas de gamme |
| MEDIUM | La plupart des mobiles et tablettes |
| HIGH | Ordinateurs de bureau standard |
| ULTRA | Ordinateurs puissants |

## Chargement progressif des images

Le service `progressiveImageLoader.js` gère le chargement optimisé des images avec différentes priorités et tailles.

### Fonctionnalités principales

- **Priorités de chargement** : Les images importantes sont chargées en premier
- **Chargement basé sur la visibilité** : Les images sont chargées uniquement lorsqu'elles s'approchent du viewport
- **Placeholders adaptatifs** : Affichage de placeholders en attendant le chargement complet
- **Adaptation au réseau** : Estimation de la vitesse réseau pour optimiser le chargement
- **Réutilisation du cache** : Utilisation intelligente du cache pour les images fréquemment utilisées

### Utilisation de base

```javascript
import progressiveImageLoader, { LOAD_PRIORITIES, IMAGE_SIZES } from '../services/progressiveImageLoader';

// Charger une image avec priorité élevée
const imageUrl = await progressiveImageLoader.loadImage(
  'hero-image-1', 
  '/assets/images/hero.jpg',
  {
    priority: LOAD_PRIORITIES.CRITICAL,
    size: 'large',
    onLoad: (url) => console.log('Image chargée:', url)
  }
);

// Précharger plusieurs images en arrière-plan
const imagesToPreload = [
  { id: 'image1', url: '/assets/images/photo1.jpg', priority: LOAD_PRIORITIES.LOW, size: 'small' },
  { id: 'image2', url: '/assets/images/photo2.jpg', priority: LOAD_PRIORITIES.LOW, size: 'small' }
];

progressiveImageLoader.preloadImages(imagesToPreload);
```

### Priorités de chargement disponibles

| Priorité | Valeur | Utilisation |
|----------|--------|-------------|
| CRITICAL | 1 | Images dans la viewport initiale ou essentielles à l'UX |
| HIGH | 2 | Images juste en-dessous de la fold ou importantes |
| MEDIUM | 3 | Images qui seront visibles après un peu de défilement |
| LOW | 4 | Images qui ne sont visibles qu'après beaucoup de défilement |
| LAZY | 5 | Images qui peuvent être chargées en dernier |

### Tailles d'images

| Taille | Dimensions | Utilisation recommandée |
|--------|------------|-------------------------|
| thumbnail | 120×80 | Miniatures, icônes, aperçus |
| small | 320×240 | Petites images, listes, grilles |
| medium | 640×480 | Images standard, vignettes |
| large | 1280×960 | Images plein écran, héros |
| original | - | Qualité originale (utiliser avec parcimonie) |

## Intégration dans les composants

### Composant ProgressiveImage

Le composant `ProgressiveImage` simplifie l'utilisation du chargement progressif d'images dans votre interface.

```jsx
import ProgressiveImage from '../components/common/ProgressiveImage';
import { LOAD_PRIORITIES } from '../services/progressiveImageLoader';

// Utilisation de base
<ProgressiveImage 
  src="/assets/images/col-du-ballon.jpg" 
  alt="Col du Ballon d'Alsace" 
  size="medium"
  priority={LOAD_PRIORITIES.HIGH}
/>

// Utilisation avancée avec placeholder flou
<ProgressiveImage 
  src="/assets/images/col-du-galibier.jpg" 
  alt="Col du Galibier" 
  size="large"
  priority={LOAD_PRIORITIES.CRITICAL}
  height="400px"
  objectFit="cover"
  objectPosition="center"
  useBlur={true}
  placeholderUrl="/assets/images/col-du-galibier-tiny.jpg"
  onLoad={() => console.log('Image chargée')}
/>
```

### Props du composant ProgressiveImage

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| src | string | (requis) | URL de l'image à charger |
| alt | string | (requis) | Texte alternatif pour l'accessibilité |
| id | string | (auto-généré) | Identifiant unique pour l'image |
| priority | number | MEDIUM | Priorité de chargement |
| size | string | 'medium' | Taille de l'image à charger |
| objectFit | string | 'cover' | Propriété CSS object-fit |
| objectPosition | string | 'center' | Propriété CSS object-position |
| height | string | 'auto' | Hauteur du conteneur |
| width | string | '100%' | Largeur du conteneur |
| placeholderColor | string | '#f0f0f0' | Couleur du placeholder |
| placeholderUrl | string | null | URL d'une version basse qualité |
| useBlur | boolean | false | Activer l'effet de flou sur le placeholder |
| showSpinner | boolean | true | Afficher un spinner pendant le chargement |
| lazy | boolean | true | Activer le chargement différé |
| onLoad | function | null | Callback appelé quand l'image est chargée |

## Optimisations mobiles

Nos services de chargement progressif sont spécialement conçus pour améliorer les performances sur mobile :

1. **Détection automatique des appareils mobiles** : Optimisations spécifiques pour iOS et Android
2. **Adaptation au réseau mobile** : Détection de la qualité de connexion (2G/3G/4G)
3. **Gestion stricte de la mémoire** : Évite les crashs sur les appareils à mémoire limitée
4. **Optimisation des textures** : Redimensionnement adapté aux écrans mobiles
5. **Prioritisation des ressources visibles** : Focus sur ce que l'utilisateur voit actuellement

### Configuration recommandée pour les mobiles

Pour les vues contenant de nombreuses images ou du contenu 3D, utilisez ces techniques :

```jsx
// Dans vos composants React contenant beaucoup d'images
useEffect(() => {
  // Passer en mode basse qualité si l'appareil est mobile
  if (isMobileDevice()) {
    // Prioriser les images visibles et réduire la qualité des autres
    setImageQuality('medium');
  }
  
  // Nettoyer les ressources lors du démontage
  return () => {
    // Important pour libérer la mémoire sur mobile
    cleanupResources();
  };
}, []);

// Nettoyer les ressources lors du démontage
return () => {
  if (isMobileDevice()) {
    progressiveImageLoader.releaseNonEssentialResources();
  }
};
```

## Dépannage

### Problèmes courants de rendu 3D

| Problème | Solution possible |
|----------|-------------------|
| Performances lentes sur mobile | Vérifier `currentDetailLevel`, réduire à LOW ou ULTRA_LOW |
| Crash mémoire WebGL | Appeler `unloadModel()` pour les modèles non visibles |
| Modèles invisibles | Vérifier si la qualité est trop basse, désactiver le `frustumCulling` |
| Perte de contexte WebGL | Ne rien faire, la récupération est automatique |

### Problèmes courants de chargement d'image

| Problème | Solution possible |
|----------|-------------------|
| Images qui ne se chargent pas | Vérifier le réseau et les URLs, utiliser `priority: CRITICAL` |
| Chargement lent | Réduire `size`, vérifier la taille originale des images |
| Clignotement pendant le chargement | Utiliser `useBlur` avec un `placeholderUrl` |
| Mémoire excessive | Réduire le nombre d'images à précharger |

Pour tout autre problème, consulter les logs de console qui contiennent des informations détaillées sur l'état du chargement.

## Nouvelles optimisations de performance (Avril 2025)

Nous avons récemment amélioré nos services de chargement progressif avec plusieurs nouvelles fonctionnalités essentielles :

### 1. Gestion de mémoire avancée pour appareils mobiles

```javascript
// Extension du service de gestion de mémoire
progressive3DLoader.monitorMemoryUsage({
  warningThreshold: 80, // Pourcentage d'utilisation de la mémoire qui déclenche un avertissement
  criticalThreshold: 90, // Pourcentage d'utilisation critique qui déclenche une libération automatique
  releaseStrategy: 'LRU', // Stratégie de libération (LRU, FIFO, priorityBased)
  checkInterval: 5000 // Intervalle de vérification en ms
});

// Nouvelle API de récupération de ressources optimisée 
progressive3DLoader.enableGarbageCollectionHints();
```

Le nouveau système de surveillance de la mémoire permet de :
- Détecter proactivement les risques de saturation mémoire
- Libérer automatiquement les ressources selon la stratégie définie
- Maintenir une expérience fluide même sur des appareils contraints
- Éviter les crashs liés aux limitations WebGL sur mobile

### 2. Intégration avec le système de contexte React

Les services de chargement progressif sont maintenant intégrés avec notre système de gestion d'état basé sur Context API :

```jsx
import { useUIContext } from '../../contexts/UIContext';
import ProgressiveImage from '../common/ProgressiveImage';

function GalleryComponent() {
  const { 
    deviceCapabilities,
    networkStatus,
    performanceSettings
  } = useUIContext();
  
  return (
    <ProgressiveImage
      src="/path/to/image.jpg"
      alt="Description"
      // Les paramètres sont automatiquement adaptés en fonction du contexte
      adaptToDeviceCapabilities={true}
      adaptToNetworkStatus={true}
      qualityPreset={performanceSettings.imageQuality}
    />
  );
}
```

Cette approche permet de :
- Centraliser les décisions de performance et d'optimisation
- Adapter la qualité visuelle en fonction des préférences utilisateur et des capacités de l'appareil
- Maintenir une expérience utilisateur cohérente sur tous les appareils
- Simplifier la maintenance et l'évolution des composants

### 3. Nouvelles stratégies pour appareils à faible puissance

Afin d'offrir la meilleure expérience possible sur tous les appareils, nous avons implémenté des stratégies spécifiques pour les appareils à faible puissance :

| Condition détectée | Stratégie appliquée |
|--------------------|--------------------|
| Batterie faible (<20%) | Réduction automatique de la qualité des images et modèles 3D |
| Mode économie d'énergie | Désactivation des effets visuels avancés |
| Connexion réseau limitée | Chargement de versions plus légères des ressources |
| GPU intégré faible | Simplification des shaders et réduction de la complexité 3D |
| RAM limitée (<2GB) | Chargement séquentiel et libération agressive des ressources |

```javascript
// Exemple d'utilisation des nouvelles API de détection
import { useLowPowerMode } from '../../hooks/usePowerManagement';

function OptimizedComponent() {
  const isLowPower = useLowPowerMode();
  
  // Adapter le rendu en fonction du mode d'alimentation
  return isLowPower ? <SimplifiedView /> : <FullFeaturedView />;
}
```

## Intégration avec la nouvelle gestion d'état

Nos services de chargement progressif sont désormais parfaitement intégrés avec notre architecture de gestion d'état basée sur Context API.

### ChallengeContext et visualisations optimisées

Le composant `SevenMajorsChallenge` utilise maintenant le `ChallengeContext` pour gérer toute la logique d'état tout en bénéficiant des optimisations de chargement :

```jsx
import React from 'react';
import { useChallenge } from '../../contexts/ChallengeContext';
import ProgressiveImage from '../common/ProgressiveImage';

const ColPreview = ({ colId }) => {
  const { 
    getColById,
    userSettings, 
    deviceCapabilities
  } = useChallenge();
  
  const col = getColById(colId);
  const qualityLevel = deviceCapabilities.isLowEndDevice 
    ? 'medium' 
    : userSettings.preferredImageQuality;
  
  return (
    <div className="col-preview">
      <ProgressiveImage
        src={col.imageUrl}
        alt={col.name}
        size={qualityLevel}
        priority={col.featured ? 'HIGH' : 'MEDIUM'}
        onLoad={() => trackImageLoaded(col.id)}
      />
      <h3>{col.name}</h3>
      <p>{col.altitude}m - Difficulté: {col.difficulty}/10</p>
    </div>
  );
};
```

Cette approche permet de :
- Centraliser les décisions de performance et d'optimisation
- Adapter la qualité visuelle en fonction des préférences utilisateur et des capacités de l'appareil
- Maintenir une expérience utilisateur cohérente sur tous les appareils
- Simplifier la maintenance et l'évolution des composants

## Documentation associée

Pour plus d'informations sur l'architecture de gestion d'état, consultez notre [documentation dédiée](./STATE_MANAGEMENT.md).

Pour l'optimisation spécifique des visualisations 3D, consultez notre [guide des composants de visualisation](./VISUALIZATION_COMPONENTS.md).
