# Gestion des Assets 3D

## Vue d'Ensemble
- **Objectif** : Documentation de la gestion et organisation des assets 3D
- **Contexte** : Visualisation immersive des cols avec Three.js/React Three Fiber
- **Portée** : Tous les modèles 3D, textures et données d'élévation

## Contenu Principal
- **Structure des Assets**
  - Organisation par région géographique
  - Hiérarchie des modèles (terrain, routes, POI)
  - Système de nommage standardisé
  - Versionnement des assets

- **Types d'Assets**
  - Modèles de terrains (maillages d'élévation)
  - Textures satellite et stylisées
  - Points d'intérêt (restaurants, vues panoramiques, monuments)
  - Assets d'ambiance (arbres, rochers, bâtiments)
  - Données météo visuelles

- **Pipeline de Production**
  - Extraction des données d'élévation
  - Génération des maillages
  - Texturation des surfaces
  - Optimisation et LOD
  - Exportation et intégration

- **Gestion des Matériaux**
  - Shaders personnalisés (terrain, routes)
  - Matériaux PBR pour points d'intérêt
  - Effets visuels (neige, pluie)
  - Conditions d'éclairage variables

## Points Techniques
```javascript
// Exemple de structure d'assets pour un col
const colAssetStructure = {
  id: 'galibier',
  name: 'Col du Galibier',
  region: 'alpes',
  terrain: {
    meshes: [
      { lod: 0, path: '/assets/cols/alpes/galibier/terrain_high.glb', vertices: 98500 },
      { lod: 1, path: '/assets/cols/alpes/galibier/terrain_med.glb', vertices: 42300 },
      { lod: 2, path: '/assets/cols/alpes/galibier/terrain_low.glb', vertices: 9700 }
    ],
    textures: [
      { type: 'diffuse', resolution: 2048, path: '/assets/cols/alpes/galibier/terrain_diffuse.ktx2' },
      { type: 'normal', resolution: 2048, path: '/assets/cols/alpes/galibier/terrain_normal.ktx2' },
      { type: 'heightmap', resolution: 4096, path: '/assets/cols/alpes/galibier/heightmap.png' }
    ]
  },
  pointsOfInterest: [
    {
      id: 'restaurant_1',
      type: 'restaurant',
      name: 'Refuge du Galibier',
      position: [45.064, 6.407],
      model: '/assets/poi/restaurant_mountain.glb',
      details: {
        description: 'Restaurant traditionnel avec vue panoramique',
        images: ['/assets/cols/alpes/galibier/poi/restaurant_1.jpg']
      }
    },
    {
      id: 'panorama_1',
      type: 'panoramic_view',
      name: 'Vue sur les Écrins',
      position: [45.060, 6.403],
      model: '/assets/poi/panoramic_view.glb',
      details: {
        description: 'Point de vue exceptionnel sur le massif des Écrins',
        panorama: '/assets/cols/alpes/galibier/poi/panorama_ecrins.jpg'
      }
    }
  ],
  ambiance: {
    trees: { density: 0.3, types: ['pine', 'alpine'] },
    weather: ['clear', 'cloudy', 'snow'],
    lighting: {
      presets: ['morning', 'midday', 'evening'],
      dynamic: true
    }
  }
};
```

## Métriques de Couverture
- **État Actuel**
  - 40% des cols avec visualisation 3D complète
  - 30% avec visualisation partielle
  - 30% sans visualisation 3D
- **Objectifs**
  - 80% des cols avec visualisation 3D d'ici fin du trimestre
  - 100% des points d'intérêt mappés
  - 100% des textures en format optimisé

## Outils et Technologies
- **Création d'Assets**
  - Blender pour modélisation et optimisation
  - QGIS pour extraction de données géographiques
  - MapBox API pour données terrain
  - TexturePacker pour optimisation de textures

- **Runtime**
  - Three.js pour le rendu 3D
  - React Three Fiber comme wrapper React
  - Drei pour composants 3D utilitaires
  - GLTF Loader pour chargement optimisé

## Maintenance
- **Responsable** : Directeur artistique 3D
- **Procédures** :
  1. Update trimestriel des données d'élévation
  2. Vérification mensuelle des points d'intérêt
  3. Optimisation continue des assets existants
  4. Ajout progressif des cols manquants

## Références
- [Three.js Documentation](https://threejs.org/docs/)
- [GLTF Specification](https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md)
- [MapBox Elevation API](https://docs.mapbox.com/help/glossary/elevation-api/)
- [Asset Management Best Practices](https://docs.pmnd.rs/react-three-fiber/tutorials/loading-models)
