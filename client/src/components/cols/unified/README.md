# Architecture des Composants Unifiés pour les Cols

Ce document présente l'architecture et l'organisation des composants unifiés pour les fonctionnalités liées aux cols dans l'application Velo-Altitude.

## Objectifs

L'unification des composants liés aux cols vise à:

1. Éliminer les duplications de code
2. Améliorer la cohérence de l'interface utilisateur
3. Optimiser les performances et la réutilisabilité
4. Faciliter la maintenance et les évolutions futures

## Structure des Dossiers

```
/src/components/cols/
  ├── unified/                      # Tous les composants unifiés
  │   ├── ColDetail/                # Détails du col
  │   │   ├── index.tsx             # Composant principal
  │   │   ├── WeatherSystem.tsx     # Système météo
  │   │   ├── SEOManager.tsx        # Gestion SEO
  │   │   └── types.ts              # Types partagés
  │   ├── Visualization3D/          # Visualisation 3D
  │   │   ├── index.tsx             # Composant principal
  │   │   ├── Controls.tsx          # Contrôles interactifs
  │   │   ├── PerformanceManager.tsx # Gestion performances
  │   │   └── TerrainSystem.tsx     # Rendu du terrain
  │   ├── ColExplorer/              # Explorateur de cols
  │   │   └── index.tsx             # Vue combinant détails et 3D
  │   ├── ColsList/                 # Liste des cols
  │   │   └── index.tsx             # Liste et filtrage
  │   ├── ColComparison/            # Comparaison de cols
  │   │   └── index.tsx             # Comparaison côte à côte
  │   ├── routes/                   # Gestion des routes
  │   │   └── ColRoutesManager.tsx  # Routeur unifié
  │   └── integration/              # Intégration
  │       └── ColsModule.tsx        # Module complet
```

## Composants Principaux

### 1. ColDetail

Affiche les informations détaillées d'un col spécifique.

**Caractéristiques:**
- Présentation complète des données du col
- Intégration des prévisions météo en temps réel
- Gestion optimisée du SEO pour chaque col
- Affichage adaptatif pour mobile/desktop

### 2. Visualization3D

Visualisation 3D interactive du col.

**Caractéristiques:**
- Rendu 3D optimisé avec React Three Fiber
- Contrôles interactifs pour l'expérience utilisateur
- Gestion automatique de la qualité selon les performances
- Mode économie d'énergie pour les appareils mobiles

### 3. ColExplorer

Intègre ColDetail et Visualization3D dans une interface à onglets.

**Caractéristiques:**
- Navigation intuitive entre les vues
- Partage et export des informations
- Gestion des favoris
- Adaptation au format de l'écran

### 4. ColsList

Liste et filtrage des cols disponibles.

**Caractéristiques:**
- Recherche textuelle
- Filtres avancés (région, difficulté, altitude)
- Vues grille/liste
- Gestion des favoris

### 5. ColComparison

Permet de comparer plusieurs cols côte à côte.

**Caractéristiques:**
- Comparaison des caractéristiques clés
- Mise en évidence des meilleures performances
- Partage de comparaisons
- Vues adaptatives pour mobile/desktop

### 6. ColRoutesManager

Gère l'ensemble des routes liées aux cols.

**Caractéristiques:**
- Configuration flexible
- Protection des routes (authentification)
- Gestion des redirections

### 7. ColsModule

Point d'entrée principal pour intégrer le module dans l'application.

**Caractéristiques:**
- Configuration globale
- Version légère pour les appareils à faible puissance
- Contrôle des fonctionnalités activées

## Types et Interfaces

Les principales interfaces de données sont définies dans `types.ts`:

```typescript
interface ColData {
  id: string;
  name: string;
  altitude: number;
  length: number;
  gradient: number;
  difficulty: number;
  region: string;
  description?: string;
  image?: string;
  pointsOfInterest?: PointOfInterest[];
  segments?: ColSegment[];
  weather?: WeatherData;
}

interface PointOfInterest {
  id: string;
  name: string;
  description?: string;
  type: 'viewpoint' | 'restaurant' | 'parking' | 'water' | 'danger';
  position: {
    x: number;
    y: number;
    z: number;
  };
}

interface WeatherData {
  current: {
    temp: number;
    humidity: number;
    windSpeed: number;
    condition: string;
    icon: string;
    timestamp: number;
  };
  forecast: Array<{
    day: string;
    temp: number;
    condition: string;
    icon: string;
  }>;
  alerts?: Array<{
    type: string;
    severity: 'info' | 'warning' | 'danger';
    message: string;
  }>;
}
```

## Intégration

Pour intégrer les composants unifiés dans l'application principale, utilisez le `ColsModule`:

```jsx
import { StandaloneColsModule } from './components/cols/unified/integration/ColsModule';

function App() {
  return (
    <div className="App">
      <Header />
      <main>
        <StandaloneColsModule />
      </main>
      <Footer />
    </div>
  );
}
```

Ou avec une configuration spécifique:

```jsx
import ColsModule from './components/cols/unified/integration/ColsModule';

function App() {
  return (
    <div className="App">
      <Header />
      <main>
        <ColsModule 
          requireAuth={true}
          baseRoute="/montagnes"
          enableFavorites={true}
          enable3D={true}
          defaultQuality="high"
        />
      </main>
      <Footer />
    </div>
  );
}
```

## Performance et Optimisation

Les composants unifiés intègrent plusieurs optimisations:

1. **Chargement paresseux**: Les composants lourds sont chargés à la demande
2. **Détection automatique**: Ajustement de la qualité selon les capacités de l'appareil
3. **Mise en cache**: Les données et ressources fréquemment utilisées sont mises en cache
4. **Rendu conditionnel**: Certaines fonctionnalités sont désactivées sur les appareils à faible puissance

## Évolutions Futures

- Intégration d'un système de cartographie avancé
- Ajout de statistiques et analyses pour les utilisateurs
- Support pour la réalité augmentée sur les appareils compatibles
- Extension du système de favoris avec des collections personnalisées
