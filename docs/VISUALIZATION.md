# Guide d'utilisation du système de visualisation des cols

## Introduction

Le système de visualisation des cols de Velo-Altitude propose une solution unifiée pour représenter graphiquement les profils d'élévation des cols. Ce système a été conçu pour être performant, adaptatif et facile à utiliser dans toute l'application.

## Fonctionnalités

- **Rendu 2D** : Profil d'élévation simple et léger utilisant Canvas
- **Rendu 3D** : Terrain en 3D utilisant Three.js (chargé dynamiquement)
- **Adaptation automatique** : S'adapte aux capacités de l'appareil
- **Performance optimisée** : Chargement conditionnel des ressources lourdes
- **Responsive design** : S'ajuste aux différentes tailles d'écran
- **Statistiques intégrées** : Affiche les métriques clés des cols

## Architecture

Le système est composé de trois éléments principaux :

1. **Configuration centralisée** (`visualizationConfig.js`)
   - Paramètres partagés et constantes
   - Configuration par type d'appareil
   - Styles et couleurs unifiés

2. **Service de transformation** (`UnifiedColVisualization.ts`)
   - Transformation des données de col en profil d'élévation
   - Génération des données de terrain 3D
   - Calculs et optimisations

3. **Composant React** (`UnifiedColVisualization.jsx`)
   - Rendu Canvas pour la visualisation 2D
   - Intégration Three.js pour la visualisation 3D
   - États et adaptabilité

## Guide d'utilisation

### 1. Import du composant

```jsx
// Import simplifié grâce au barrel file
import { ColVisualization } from '../components/visualization';

// Optionnel: import des constantes
import { VISUALIZATION_TYPES } from '../components/visualization';
```

### 2. Utilisation basique

```jsx
<ColVisualization 
  col={colData}
  height="400px"
/>
```

### 3. Options avancées

```jsx
<ColVisualization 
  col={colData}
  visualizationType={VISUALIZATION_TYPES.TERRAIN_3D} // ou 'auto', 'profile-2d', etc.
  quality="high" // ou 'auto', 'medium', 'low'
  width="100%" 
  height="500px"
  className="custom-visualization"
  interactive={true}
  showStats={true}
  onVisualizationReady={(data) => console.log('Visualization ready:', data)}
/>
```

### 4. Données requises

Le composant attend un objet `col` avec au minimum les propriétés suivantes :

```javascript
const colData = {
  name: "Col du Galibier",
  elevation: 2642,         // Élévation au sommet (m)
  length: 18.1,            // Longueur (km)
  avgGradient: 6.9,        // Pente moyenne (%)
  
  // Propriétés optionnelles
  startElevation: 1400,    // Élévation du départ (m)
  maxGradient: 10.1,       // Pente maximale (%)
  climbs: [                // Sections spécifiques
    { 
      name: "Section difficile", 
      gradient: 9.2, 
      length: 2.5,
      startDistance: 12.5  // Distance depuis le départ (km)
    }
  ]
};
```

## Bonnes pratiques

1. **Utiliser le mode 'auto'** pour la majorité des cas d'utilisation.
2. **Précharger les données** avant de rendre le composant.
3. **Adapter la taille** selon le contexte d'affichage.
4. **Gérer les états de chargement** au niveau du composant parent.

## Exemples concrets

### Affichage dans une page de détail

```jsx
import React, { useState, useEffect } from 'react';
import { ColVisualization } from '../components/visualization';
import { getColById } from '../services/api';

const ColDetailPage = ({ colId }) => {
  const [col, setCol] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchCol = async () => {
      try {
        setLoading(true);
        const data = await getColById(colId);
        setCol(data);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCol();
  }, [colId]);
  
  if (loading) return <div>Chargement...</div>;
  if (!col) return <div>Col non trouvé</div>;
  
  return (
    <div className="col-detail-page">
      <h1>{col.name}</h1>
      
      <div className="visualization-container">
        <ColVisualization 
          col={col}
          height="500px"
          showStats={true}
        />
      </div>
      
      {/* Autres informations du col */}
    </div>
  );
};

export default ColDetailPage;
```

### Utilisation dans un tableau comparatif

```jsx
import React from 'react';
import { ColVisualization } from '../components/visualization';
import { VISUALIZATION_TYPES } from '../components/visualization';

const ColComparisonTable = ({ cols }) => {
  return (
    <div className="comparison-table">
      <div className="table-header">
        <h2>Comparaison des cols</h2>
      </div>
      
      <div className="cols-grid">
        {cols.map(col => (
          <div key={col.id} className="col-card">
            <h3>{col.name}</h3>
            
            <div className="col-visualization-wrapper">
              <ColVisualization 
                col={col}
                visualizationType={VISUALIZATION_TYPES.PROFILE_2D}
                height="200px"
                showStats={false}
              />
            </div>
            
            <div className="col-stats">
              <p>Élévation: {col.elevation}m</p>
              <p>Distance: {col.length}km</p>
              <p>Pente: {col.avgGradient}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ColComparisonTable;
```

## Données de test

Pour le développement et les tests, vous pouvez utiliser ce jeu de données d'exemple :

```javascript
const testCols = [
  {
    id: "galibier",
    name: "Col du Galibier",
    elevation: 2642,
    length: 18.1,
    avgGradient: 6.9,
    startElevation: 1400,
    maxGradient: 10.1,
    image: "https://images.unsplash.com/photo-1472791108553-c9405341e398",
    climbs: [
      { name: "Plan Lachat", gradient: 8.0, length: 3.5, startDistance: 7.5 },
      { name: "Virage des Valloires", gradient: 9.2, length: 2.3, startDistance: 12.8 }
    ]
  },
  {
    id: "alpe-huez",
    name: "Alpe d'Huez",
    elevation: 1860,
    length: 13.8,
    avgGradient: 8.1,
    startElevation: 720,
    maxGradient: 13.0,
    image: "https://images.unsplash.com/photo-1467173472333-9f0e0397d785"
  },
  {
    id: "tourmalet",
    name: "Col du Tourmalet",
    elevation: 2115,
    length: 19.0,
    avgGradient: 7.4,
    startElevation: 850,
    maxGradient: 10.5,
    image: "https://images.unsplash.com/photo-1455581580-92fa937ccfaf"
  },
  {
    id: "ventoux",
    name: "Mont Ventoux",
    elevation: 1909,
    length: 21.5,
    avgGradient: 7.5,
    startElevation: 300,
    maxGradient: 12.0,
    image: "https://images.unsplash.com/photo-1557646581-cf0226184399"
  },
  {
    id: "izoard",
    name: "Col d'Izoard",
    elevation: 2360,
    length: 15.9,
    avgGradient: 6.8,
    startElevation: 1280,
    maxGradient: 10.0,
    image: "https://images.unsplash.com/photo-1497492637206-77c65160f365"
  }
];
```
