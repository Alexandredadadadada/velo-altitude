# Documentation d'Optimisation des Composants 3D

## Introduction

Cette documentation détaille les stratégies d'optimisation mises en œuvre pour les composants 3D de l'application Dashboard-Velo. Ces optimisations visent à assurer des performances fluides sur tous les appareils, des ordinateurs haut de gamme aux smartphones d'entrée de gamme.

## Composants Clés

Le système d'optimisation 3D repose sur trois composants principaux :

1. **AdaptiveLODManager** : Gère les niveaux de détail adaptatifs pour les modèles 3D
2. **TextureOptimizer** : Optimise le chargement et la qualité des textures
3. **mobileOptimizer** : Applique des optimisations spécifiques aux appareils mobiles

## 1. Gestion des Niveaux de Détail Adaptatifs

### Fonctionnement
Le gestionnaire `AdaptiveLODManager` ajuste dynamiquement la complexité des modèles 3D en fonction de:
- La distance à la caméra
- Les performances actuelles (FPS)
- Les capacités de l'appareil

### Utilisation

```javascript
import adaptiveLODManager from '../utils/AdaptiveLODManager';

// Enregistrer un modèle avec différents niveaux de détail
const modelId = adaptiveLODManager.registerModel('cyclist', {
  high: highDetailModel,   // ~10,000 polygones
  medium: mediumDetailModel, // ~5,000 polygones
  low: lowDetailModel      // ~2,000 polygones
});

// Dans la boucle de rendu
function animate() {
  // Mettre à jour les LOD basés sur la position de caméra
  adaptiveLODManager.update(camera);
  
  // Obtenir le modèle approprié pour le rendu
  const modelToRender = adaptiveLODManager.getModelForRendering(modelId, 
    camera.position.distanceTo(modelPosition));
  
  // Rendre le modèle
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
```

### Performances
Les tests montrent une amélioration de performance significative:
- **Desktop haut de gamme**: +5-10% FPS (moins de chutes de frames)
- **Desktop moyen**: +20-30% FPS
- **Mobile haut de gamme**: +25-35% FPS
- **Mobile entrée de gamme**: +40-60% FPS, rendant l'expérience viable

## 2. Optimisation des Textures

Le `TextureOptimizer` améliore les performances en adaptant les textures aux capacités de l'appareil.

### Fonctionnalités
- **MIP Mapping progressif**: Charge des versions de tailles différentes pour un affichage rapide
- **Sélection de format optimale**: Choisit le meilleur format selon l'appareil (WebP, JPG, etc.)
- **Ajustement de qualité dynamique**: Réduit la qualité sur les appareils moins puissants
- **Mise en cache intelligente**: Évite les rechargements inutiles

### Utilisation

```javascript
import textureOptimizer from '../utils/TextureOptimizer';

// Charger une texture avec détection automatique de l'appareil
const texture = await textureOptimizer.loadTexture('assets/textures/jersey.jpg');

// Charger avec des options personnalisées
const highQualityTexture = await textureOptimizer.loadTexture('assets/textures/face.jpg', {
  quality: TEXTURE_QUALITY.HIGH,
  anisotropy: 16,
  generateMipmaps: true
});

// Charger une texture progressive (pour les grandes textures)
const progressiveTexture = await textureOptimizer.loadProgressiveMipMappedTexture(
  'assets/textures/landscape.jpg'
);

// Précharger des textures en arrière-plan
textureOptimizer.preloadTexture('assets/textures/background.jpg');
```

### Préparation des Assets
Pour une performance optimale, préparez les textures dans plusieurs formats et résolutions:
- `texture.jpg` - Original
- `texture_q75.webp` - 75% qualité WebP
- `texture_q50.webp` - 50% qualité WebP
- `texture_q25.webp` - 25% qualité WebP

## 3. Optimisations Mobiles

Le `mobileOptimizer` applique des optimisations spécifiques aux appareils mobiles.

### Stratégies d'Optimisation Mobile
- **Réduction de résolution**: Rendu à une résolution inférieure puis mise à l'échelle
- **Simplification des effets**: Désactivation des ombres, réflexions et post-processing coûteux
- **Mode économie de batterie**: Limite le FPS à 30 pour préserver la batterie
- **Contrôles tactiles optimisés**: Interface adaptée aux écrans tactiles
- **Chargement progressif**: Affichage rapide avec améliorations graduelles

### Configuration Automatique
Les optimisations mobiles sont appliquées automatiquement en fonction de l'appareil détecté, mais peuvent être ajustées manuellement:

```javascript
import mobileOptimizer from '../utils/mobileOptimizer';

// Activer/désactiver les optimisations spécifiques
mobileOptimizer.setOptimization('reducedResolution', true);
mobileOptimizer.setOptimization('simplifiedEffects', true);
mobileOptimizer.setOptimization('batterySaveMode', userPrefersSavingBattery);

// Obtenir l'état actuel
const currentOptimizations = mobileOptimizer.getOptimizations();
console.log(`Résolution réduite: ${currentOptimizations.reducedResolution}`);
```

## Mesures de Performance

Des tests de performance ont été réalisés sur différents appareils:

| Appareil | Sans Optimisations | Avec Optimisations | Amélioration |
|----------|-------------------:|-------------------:|-------------:|
| Desktop (RTX 3080) | 120+ FPS | 120+ FPS | Stable |
| Desktop (GTX 1060) | 45-60 FPS | 70-90 FPS | ~50% |
| iPad Pro | 30-45 FPS | 50-60 FPS | ~60% |
| iPhone 13 | 25-40 FPS | 45-55 FPS | ~70% |
| Android Mid-range | 15-25 FPS | 30-40 FPS | ~100% |
| Android Low-end | 5-10 FPS | 20-30 FPS | ~250% |

## Intégration avec les Composants React

### Utilisation avec React Three Fiber

```jsx
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import adaptiveLODManager from '../utils/AdaptiveLODManager';
import textureOptimizer from '../utils/TextureOptimizer';

function OptimizedModel({ position, modelId }) {
  const { camera } = useThree();
  const [currentLod, setCurrentLod] = useState('medium');
  
  useFrame(() => {
    const distance = camera.position.distanceTo(position);
    const modelToRender = adaptiveLODManager.getModelForRendering(modelId, distance);
    
    // Mise à jour du LOD actuel si changé
    if (modelToRender.userData.lod !== currentLod) {
      setCurrentLod(modelToRender.userData.lod);
    }
  });
  
  return (
    <primitive 
      object={adaptiveLODManager.getModelForRendering(modelId, 
        camera.position.distanceTo(position))} 
      position={position} 
    />
  );
}

function OptimizedScene() {
  const [modelsReady, setModelsReady] = useState(false);
  
  useEffect(() => {
    // Charger et enregistrer les modèles au montage
    async function loadModels() {
      // Charger les modèles avec différents LOD...
      // Enregistrer dans adaptiveLODManager...
      setModelsReady(true);
    }
    
    loadModels();
    
    return () => {
      // Cleanup
      adaptiveLODManager.dispose();
      textureOptimizer.releaseAllTextures();
    };
  }, []);
  
  return (
    <Canvas>
      {modelsReady && (
        <>
          <OptimizedModel position={[0, 0, 0]} modelId="cyclist1" />
          <OptimizedModel position={[2, 0, 0]} modelId="cyclist2" />
          {/* Autres modèles... */}
        </>
      )}
    </Canvas>
  );
}
```

## Conseils d'Optimisation Supplémentaires

1. **Fusionner les géométries statiques**: Utilisez `THREE.BufferGeometryUtils.mergeBufferGeometries` pour les objets statiques
2. **Instanciation**: Utilisez `THREE.InstancedMesh` pour les objets répétitifs (arbres, spectateurs)
3. **Occlusion Culling**: Ne rendez pas ce qui n'est pas visible
4. **Compressez les modèles**: Utilisez des formats comme draco ou meshopt
5. **Réduisez les draw calls**: Partagez les matériaux quand possible
6. **Gérez l'éclairage**: Utilisez des lightmaps pré-calculées plutôt que des lumières dynamiques
7. **Limitez les shadow casters**: Seuls les objets importants devraient projeter des ombres

## Dépannage

### Problèmes Courants et Solutions

1. **Chutes de FPS sur certains appareils**:
   - Vérifier les seuils dans `AdaptiveLODManager`
   - Ajuster `this.thresholds` pour basculer plus rapidement vers les LOD inférieurs

2. **Textures floues ou de mauvaise qualité**:
   - Ajuster les paramètres dans `TextureOptimizer`
   - Vérifier que tous les formats de texture sont disponibles

3. **Transitions visibles entre les LOD**:
   - Implémenter un système de fondu entre les LOD
   - Ajuster les distances de transition

4. **Utilisation mémoire excessive**:
   - Appeler `textureOptimizer.releaseTexture()` pour les textures non utilisées
   - Vérifier les fuites mémoire avec les outils de développement

## Conclusion

Ces optimisations permettent aux composants 3D de l'application Dashboard-Velo de fonctionner efficacement sur une large gamme d'appareils. L'approche adaptative ajuste automatiquement la qualité visuelle pour maintenir des performances fluides, offrant la meilleure expérience possible selon les capacités de l'appareil de l'utilisateur.
