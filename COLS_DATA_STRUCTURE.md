# Structure des Données des Cols Cyclistes

Ce document décrit la structure des données utilisées pour les cols cyclistes dans le projet Dashboard-Velo, le processus d'ajout de nouveaux cols, et les bonnes pratiques pour maintenir la cohérence des données.

## 1. Organisation des Fichiers

Les données des cols sont organisées par région géographique dans des fichiers JavaScript distincts :

- `src/data/cols/colsAlpes.js` : Cols des Alpes françaises
- `src/data/cols/colsPyrenees.js` : Cols des Pyrénées
- `src/data/cols/colsVosges.js` : Cols des Vosges
- `src/data/cols/colsVosgesNord.js` : Cols des Vosges du Nord
- `src/data/cols/colsJura.js` : Cols du Jura
- `src/data/cols/colsMassifCentral.js` : Cols du Massif Central
- `src/data/cols/colsDolomites.js` : Cols des Dolomites (Italie)
- `src/data/cols/colsAlpesSuisses.js` : Cols des Alpes Suisses

Ces fichiers régionaux sont ensuite importés et consolidés dans `src/data/colsData.js`, qui fournit des fonctions pour accéder à l'ensemble des données.

## 2. Structure d'un Objet Col

Chaque col est représenté par un objet JavaScript avec la structure suivante :

```javascript
{
  id: 'col-id',                      // Identifiant unique (kebab-case)
  name: 'Nom du Col',                // Nom complet du col
  region: 'region-id',               // Identifiant de la région (kebab-case)
  country: 'Pays',                   // Pays où se trouve le col
  altitude: 1500,                    // Altitude en mètres
  length: 10.5,                      // Longueur en kilomètres (versant principal)
  avgGradient: 7.2,                  // Pente moyenne en pourcentage
  maxGradient: 12,                   // Pente maximale en pourcentage
  difficulty: 'hard',                // Difficulté: 'easy', 'medium', 'hard', 'extreme'
  elevationGain: 756,                // Dénivelé positif en mètres
  startLocation: 'Village Départ',   // Localité au pied du col
  endLocation: 'Sommet du Col',      // Nom du sommet/col
  description: 'Description...',     // Description détaillée du col
  history: 'Histoire du col...',     // Contexte historique et faits marquants
  imageUrl: '/images/cols/id/main.jpg', // URL de l'image principale
  profileUrl: '/images/cols/id/profile.jpg', // URL du profil d'élévation
  
  // Segments populaires sur le col (sections spécifiques)
  popularSegments: [
    {
      name: 'Nom du Segment',        // Nom du segment
      length: 3.2,                   // Longueur du segment en km
      gradient: 8.5,                 // Pente moyenne du segment en %
      description: 'Description...'  // Description du segment
    }
  ],
  
  // Itinéraires d'ascension différents
  routes: [
    {
      name: 'Nom de l\'itinéraire',  // Nom de l'itinéraire
      startLocation: 'Départ',       // Point de départ
      length: 10.5,                  // Longueur en km
      elevationGain: 756,            // Dénivelé en mètres
      avgGradient: 7.2,              // Pente moyenne en %
      maxGradient: 12,               // Pente maximale en %
      difficulty: 'hard',            // Difficulté: 'easy', 'medium', 'hard', 'extreme'
      description: 'Description...'  // Description de l'itinéraire
    }
  ],
  
  // Informations touristiques
  touristicInfo: 'Informations touristiques...',
  
  // Installations et services
  facilities: [
    {
      type: 'water',                 // Type: 'water', 'food', 'bike-shop', etc.
      location: 'Emplacement',       // Où se trouve l'installation
      description: 'Description...'  // Détails sur l'installation
    }
  ],
  
  // Période optimale de visite
  bestTimeToVisit: 'Mai à octobre',
  
  // Informations météorologiques
  weatherInfo: 'Informations météo et saisonnières...',
  
  // Données Strava
  strava: {
    segmentId: '12345',             // ID du segment Strava
    komTime: '45:30',               // Temps record (King of Mountain)
    komName: 'Nom du détenteur'     // Nom du détenteur du record
  }
}
```

## 3. Processus d'Ajout d'un Nouveau Col

Pour ajouter un nouveau col à la base de données :

1. **Identifier le fichier régional approprié** : Déterminez dans quelle région géographique se trouve le col et ouvrez le fichier correspondant.

2. **Créer l'objet col** : Créez un nouvel objet col avec tous les champs requis en suivant la structure ci-dessus.

3. **Ajouter l'objet au tableau** : Ajoutez l'objet au tableau d'exportation du fichier régional.

4. **Vérifier l'unicité de l'ID** : Assurez-vous que l'ID du col est unique dans l'ensemble de la base de données.

5. **Vérifier les références d'images** : Assurez-vous que les chemins d'images référencés existent.

6. **Tester l'affichage** : Testez que le col s'affiche correctement dans l'explorateur de cols.

## 4. Bonnes Pratiques pour la Cohérence des Données

Pour maintenir la cohérence et la qualité des données :

### 4.1 Conventions de Nommage

- **IDs** : Utilisez le kebab-case (minuscules séparées par des tirets) pour les IDs, par exemple `col-du-tourmalet`.
- **Régions** : Utilisez les identifiants de région existants : `alpes`, `pyrenees`, `vosges`, `vosges-nord`, `jura`, `massif-central`, `dolomites`, `alpes-suisses`.
- **Noms de Cols** : Utilisez la casse correcte et l'orthographe officielle, avec les accents appropriés.

### 4.2 Validité des Données

- **Données numériques** : Les valeurs comme `altitude`, `length`, `avgGradient`, etc. doivent être des nombres valides et réalistes.
- **Niveaux de difficulté** : Utilisez uniquement les valeurs standardisées : `easy`, `medium`, `hard`, `extreme`.
- **URLs d'images** : Assurez-vous que les chemins d'accès aux images sont corrects et que les images existent.

### 4.3 Complétude des Données

- **Champs obligatoires** : Tous les champs listés dans la structure ci-dessus sont considérés comme obligatoires.
- **Routes multiples** : Pour chaque col, fournissez au moins l'itinéraire principal et, si possible, les itinéraires alternatifs.
- **Segments** : Documentez au moins un segment populaire pour chaque col.

### 4.4 Qualité du Contenu

- **Descriptions** : Les descriptions doivent être informatives, précises et bien écrites, avec une attention particulière à la grammaire et à l'orthographe.
- **Données historiques** : Incluez des informations historiques vérifiées et pertinentes.
- **Informations météorologiques** : Fournissez des informations météorologiques spécifiques et utiles, pas seulement des généralités.

## 5. Sources d'Information Recommandées

Pour garantir l'exactitude des données, utilisez des sources fiables comme :

- **Sites officiels** : Sites web des offices de tourisme locaux et des parcs nationaux.
- **Livres et guides** : Guides cyclistes reconnus et ouvrages spécialisés sur les cols.
- **Strava** : Pour les segments populaires et les données de performance.
- **Services météorologiques** : Pour les informations climatiques spécifiques aux cols.
- **Témoignages de cyclistes** : Récits et rapports de première main de cyclistes expérimentés.
- **Ressources cartographiques** : Cartes IGN, OpenStreetMap, et autres services cartographiques professionnels.

## 6. Processus de Mise à Jour

Pour mettre à jour les informations d'un col existant :

1. **Identification** : Localisez le col dans le fichier régional approprié.
2. **Modification** : Apportez les modifications nécessaires en conservant la structure de l'objet.
3. **Validation** : Vérifiez que les modifications respectent les bonnes pratiques décrites ci-dessus.
4. **Documentation** : Documentez les changements importants dans le fichier CHANGELOG.md.
5. **Test** : Vérifiez que les modifications s'affichent correctement dans l'interface utilisateur.

## 7. Intégration de Nouvelles Régions

Pour ajouter une nouvelle région de cols :

1. **Création du fichier** : Créez un nouveau fichier dans `src/data/cols/` suivant la convention de nommage `colsNouvelleRegion.js`.
2. **Structure initiale** : Initialisez le fichier avec un tableau vide qui sera exporté.
3. **Ajout des cols** : Ajoutez les objets de cols pour cette région.
4. **Intégration** : Modifiez `src/data/colsData.js` pour importer et intégrer la nouvelle région.
5. **Mise à jour de l'UI** : Assurez-vous que l'interface utilisateur prend en charge la nouvelle région.

## 8. Structure des Données pour la Visualisation 3D Optimisée

Pour assurer des performances optimales lors de la visualisation 3D des cols, nous avons implémenté un système adaptatif qui s'ajuste aux capacités de l'appareil de l'utilisateur. Les données suivantes doivent être fournies pour chaque col afin de permettre une visualisation 3D efficace et performante :

### 8.1 Données d'Élévation

```javascript
elevationData: {
  heights: [
    [123, 125, 130, ...], // Grille d'élévations (rangées)
    [125, 128, 133, ...],
    // ...
  ],
  width: 100,              // Largeur de la grille (nombre de points)
  height: 100,             // Hauteur de la grille (nombre de points)
  resolution: 10,          // Résolution en mètres entre chaque point
  minElevation: 800,       // Élévation minimale en mètres
  maxElevation: 1200,      // Élévation maximale en mètres
  
  // Chemin pour le mode Fly-through (parcours virtuel)
  path: [
    { x: 10, z: 20, elevation: 850 },
    { x: 12, z: 22, elevation: 870 },
    // ...
  ]
}
```

### 8.2 Données de Surface

```javascript
surfaceTypes: {
  dominant: 'asphalt',     // Type dominant: 'asphalt', 'gravel', 'dirt'
  sections: [
    {
      start: 0,            // Distance de départ en km
      end: 3.5,            // Distance de fin en km
      type: 'asphalt'      // Type de surface
    },
    {
      start: a3.5,
      end: 5.2,
      type: 'gravel'
    },
    // ...
  ]
}
```

### 8.3 Points d'Intérêt pour Visualisation 3D

```javascript
pointsOfInterest: [
  {
    name: 'Virage des Hollandais',
    type: 'viewpoint',      // Types: 'viewpoint', 'restaurant', 'landmark', 'parking', 'danger'
    x: 15,                  // Position X sur la grille 3D
    z: 25,                  // Position Z sur la grille 3D
    elevation: 950,         // Élévation en mètres
    description: 'Vue panoramique sur la vallée'
  },
  // ...
]
```

### 8.4 Niveaux de Détail pour Optimisation

Chaque col doit fournir des ressources adaptées à différents niveaux de détail pour s'adapter aux capacités des appareils :

```javascript
optimizationConfig: {
  detailLevels: {
    low: {
      terrainResolution: 2,      // Diviseur de résolution pour le terrain (moins de points)
      textureSize: 512,          // Taille maximale des textures en pixels
      maxPointsOfInterest: 10    // Nombre maximum de points d'intérêt affichés
    },
    medium: {
      terrainResolution: 1,
      textureSize: 1024,
      maxPointsOfInterest: 20
    },
    high: {
      terrainResolution: 0.5,    // Plus de points que le modèle original
      textureSize: 2048,
      maxPointsOfInterest: 50,
      enableEffects: true        // Activer les effets visuels avancés
    }
  },
  
  // Textures progressives (différentes résolutions)
  textures: {
    terrain: {
      low: '/textures/cols/col-id/terrain-512.jpg',
      medium: '/textures/cols/col-id/terrain-1024.jpg',
      high: '/textures/cols/col-id/terrain-2048.jpg'
    },
    road: {
      low: '/textures/cols/col-id/road-512.jpg',
      medium: '/textures/cols/col-id/road-1024.jpg',
      high: '/textures/cols/col-id/road-2048.jpg'
    }
  }
}
```

## 9. Processus d'Ajout d'un Col avec Visualisation 3D

Pour ajouter un nouveau col avec une visualisation 3D optimisée :

1. **Préparation des données d'élévation** :
   - Obtenez les données d'élévation à partir d'API comme Mapbox, Google Elevation API, ou Open-Elevation.
   - Convertissez ces données en format de grille compatible avec notre structure.
   - Simplifiez les données pour les différents niveaux de détail.

2. **Création des textures progressives** :
   - Préparez des versions de textures en différentes résolutions (2048px, 1024px, 512px).
   - Optimisez les images avec des outils comme ImageOptim, TinyPNG ou Sharp.
   - Stockez les textures dans le répertoire approprié : `/public/textures/cols/col-id/`.

3. **Définition des points d'intérêt** :
   - Identifiez les points d'intérêt pertinents le long du col.
   - Déterminez leurs coordonnées précises dans la grille 3D.
   - Classifiez-les par type (viewpoint, restaurant, etc.).

4. **Configuration du parcours Fly-through** :
   - Tracez un chemin optimal à travers le col pour le mode de survol virtuel.
   - Assurez-vous que le chemin contient suffisamment de points pour les virages serrés.
   - Vérifiez que les élévations le long du chemin sont cohérentes avec les données de terrain.

5. **Test de performance** :
   - Testez la visualisation sur différents appareils (desktop, mobile, tablette).
   - Vérifiez que le système d'optimisation adaptatif fonctionne correctement.
   - Ajustez les paramètres si nécessaire pour maintenir un minimum de 30 FPS sur les appareils cibles.

## 10. Optimisations Avancées Implémentées

Notre système utilise plusieurs techniques d'optimisation avancées :

### 10.1 Détection des Capacités de l'Appareil
Le service `deviceCapabilityDetector.js` détecte automatiquement :
- La mémoire GPU disponible
- Le nombre de cœurs CPU
- La résolution de l'écran
- La bande passante réseau

### 10.2 Configuration 3D Adaptative
Le service `3DConfigManager.js` détermine les paramètres de rendu optimaux basés sur les capacités détectées :
- Résolution du terrain
- Qualité des textures
- Effets visuels activés/désactivés
- Nombre de points d'intérêt affichés

### 10.3 Optimisations Mobiles
Le service `mobileOptimizer.js` applique des optimisations spécifiques pour les appareils mobiles :
- Résolution réduite
- Simplification des effets
- Mode d'économie de batterie

Pour plus de détails techniques sur ces optimisations, consultez les fichiers :
- `client/src/utils/deviceCapabilityDetector.js`
- `client/src/utils/3DConfigManager.js`
- `client/src/utils/mobileOptimizer.js`
- `client/src/components/visualization/ColVisualization3D.js`

---

Ce guide vise à maintenir une base de données de cols cohérente, complète et précise pour offrir la meilleure expérience possible aux utilisateurs de Dashboard-Velo.
