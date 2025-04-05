# Guide des Composants de Visualisation

## Introduction

Cette documentation détaille les nouveaux composants de visualisation développés pour Euro Cycling Dashboard. Ces composants sont conçus pour afficher des informations sur les cols et parcours cyclistes de manière attrayante et interactive.

## Table des matières

1. [VisualizationCard](#visualizationcard)
2. [VisualizationGrid](#visualizationgrid)
3. [VisualizationCarousel](#visualizationcarousel)
4. [AnimatedStats](#animatedstats)
5. [Intégration avec le Dashboard](#intégration-avec-le-dashboard)
6. [Bonnes pratiques](#bonnes-pratiques)

## VisualizationCard

`VisualizationCard` est un composant qui affiche une carte détaillée pour un col ou un parcours spécifique.

### Propriétés

| Propriété | Type | Description | Défaut |
|-----------|------|-------------|--------|
| id | string | Identifiant unique de la visualisation | requis |
| title | string | Titre de la visualisation | requis |
| subtitle | string | Sous-titre ou description courte | "" |
| image | string | URL de l'image d'aperçu | requis |
| type | string | Type de visualisation ('col' ou 'route') | "col" |
| location | string | Localisation de la visualisation | "" |
| stats | object | Statistiques (difficulté, distance, dénivelé, vues) | {} |
| details | array | Détails supplémentaires pour la section expandable | [] |
| detailsUrl | string | URL pour afficher la visualisation complète | "" |
| variant | string | Variante d'affichage ('compact' ou 'expanded') | "compact" |
| isFavorite | boolean | Si la visualisation est dans les favoris | false |
| isBookmarked | boolean | Si la visualisation est enregistrée | false |
| onFavoriteToggle | function | Fonction appelée lors du clic sur le bouton favori | - |
| onBookmarkToggle | function | Fonction appelée lors du clic sur le bouton enregistrement | - |
| onShare | function | Fonction appelée lors du clic sur le bouton partage | - |

### Exemple d'utilisation

```jsx
import VisualizationCard from '../components/visualization/VisualizationCard';

// Exemple de données
const colData = {
  id: 'col-1',
  title: 'Col du Galibier',
  subtitle: 'Un des plus beaux cols des Alpes',
  image: '/images/cols/galibier.jpg',
  type: 'col',
  location: 'Alpes, France',
  stats: {
    difficulty: 'difficile',
    distance: '23',
    elevation: '1245',
    views: '3248'
  },
  details: [
    { title: 'Histoire', content: 'Le Col du Galibier est un col mythique du Tour de France...' },
    { title: 'Conseils', content: 'Prévoyez des vêtements chauds même en été.' }
  ],
  detailsUrl: '/cols/galibier',
  isFavorite: false,
  isBookmarked: true
};

// Utilisation du composant
const ExampleComponent = () => (
  <VisualizationCard
    {...colData}
    variant="expanded"
    onFavoriteToggle={(id) => console.log(`Favori toggled: ${id}`)}
    onBookmarkToggle={(id) => console.log(`Bookmark toggled: ${id}`)}
    onShare={(id) => console.log(`Shared: ${id}`)}
  />
);
```

## VisualizationGrid

`VisualizationGrid` est un composant qui affiche une grille de cartes de visualisation avec des options de filtrage et de pagination.

### Propriétés

| Propriété | Type | Description | Défaut |
|-----------|------|-------------|--------|
| items | array | Liste des éléments à afficher | [] |
| loading | boolean | Indique si les données sont en cours de chargement | false |
| title | string | Titre de la grille | "Visualisations" |
| filters | object | Filtres disponibles (types, difficultés, régions) | {} |
| onFilterChange | function | Fonction appelée lorsque les filtres changent | - |
| onSearch | function | Fonction appelée lors d'une recherche | - |
| onFavoriteToggle | function | Fonction appelée lors du clic sur le bouton favori | - |
| onBookmarkToggle | function | Fonction appelée lors du clic sur le bouton enregistrement | - |
| onShare | function | Fonction appelée lors du clic sur le bouton partage | - |
| itemsPerPage | number | Nombre d'éléments par page | 12 |
| emptyStateMessage | string | Message à afficher quand il n'y a pas de résultats | "Aucune visualisation trouvée..." |

### Exemple d'utilisation

```jsx
import VisualizationGrid from '../components/visualization/VisualizationGrid';

// Exemple de données
const visualizationItems = [
  // ... plusieurs éléments de visualisation (même format que pour VisualizationCard)
];

// Filtres disponibles
const availableFilters = {
  type: ['col', 'route'],
  difficulty: ['facile', 'moyen', 'difficile', 'très difficile', 'extrême'],
  region: ['Alpes', 'Pyrénées', 'Vosges', 'Jura', 'Massif central']
};

// Utilisation du composant
const ExampleGridComponent = () => {
  // Gestion des filtres
  const handleFilterChange = (filters) => {
    console.log('Nouveaux filtres:', filters);
    // Logique pour filtrer les données
  };
  
  // Gestion de la recherche
  const handleSearch = (query) => {
    console.log('Recherche:', query);
    // Logique pour rechercher dans les données
  };
  
  return (
    <VisualizationGrid
      items={visualizationItems}
      filters={availableFilters}
      onFilterChange={handleFilterChange}
      onSearch={handleSearch}
      onFavoriteToggle={(id) => console.log(`Favori toggled: ${id}`)}
      onBookmarkToggle={(id) => console.log(`Bookmark toggled: ${id}`)}
      onShare={(id) => console.log(`Shared: ${id}`)}
      title="Explorateur de Cols"
      itemsPerPage={8}
    />
  );
};
```

## VisualizationCarousel

`VisualizationCarousel` est un composant qui affiche un carrousel d'éléments de visualisation, idéal pour mettre en avant des cols ou parcours recommandés.

### Propriétés

| Propriété | Type | Description | Défaut |
|-----------|------|-------------|--------|
| items | array | Liste des éléments à afficher dans le carrousel | [] |
| title | string | Titre du carrousel | "Visualisations recommandées" |
| loading | boolean | État de chargement | false |
| autoPlay | boolean | Activer le défilement automatique | true |
| autoPlayInterval | number | Intervalle de défilement automatique en ms | 5000 |
| showDots | boolean | Afficher les points de navigation | true |
| showArrows | boolean | Afficher les flèches de navigation | true |
| loop | boolean | Activer la lecture en boucle | true |
| variant | string | Variante du carrousel ('compact' ou 'expanded') | "compact" |
| viewAllUrl | string | URL pour voir tous les éléments | - |
| onFavoriteToggle | function | Fonction appelée lors du clic sur le bouton favori | - |
| onBookmarkToggle | function | Fonction appelée lors du clic sur le bouton enregistrement | - |
| onShare | function | Fonction appelée lors du clic sur le bouton partage | - |

### Exemple d'utilisation

```jsx
import VisualizationCarousel from '../components/visualization/VisualizationCarousel';

// Exemple de données (même format que pour VisualizationCard)
const featuredCols = [
  // ... plusieurs éléments de visualisation
];

// Utilisation du composant
const ExampleCarouselComponent = () => (
  <VisualizationCarousel
    items={featuredCols}
    title="Cols Mythiques"
    viewAllUrl="/cols"
    autoPlayInterval={6000}
    variant="expanded"
    onFavoriteToggle={(id) => console.log(`Favori toggled: ${id}`)}
    onBookmarkToggle={(id) => console.log(`Bookmark toggled: ${id}`)}
    onShare={(id) => console.log(`Shared: ${id}`)}
  />
);
```

## Intégration avec le Dashboard

Pour intégrer ces composants dans le `VisualizationDashboard` existant, vous pouvez suivre cet exemple :

```jsx
import React, { useState, useEffect } from 'react';
import { Box, Typography, Container, Grid, Paper, Tabs, Tab, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import VisualizationGrid from '../components/visualization/VisualizationGrid';
import VisualizationCarousel from '../components/visualization/VisualizationCarousel';
import ColVisualization3D from '../components/visualization/ColVisualization3D';
import { fetchCols, fetchRoutes } from '../services/mountainService';

const VisualizationDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [cols, setCols] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [featuredItems, setFeaturedItems] = useState([]);
  
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Charger les données
        const colsData = await fetchCols();
        const routesData = await fetchRoutes();
        
        setCols(colsData);
        setRoutes(routesData);
        
        // Sélectionner les éléments mis en avant
        setFeaturedItems([
          ...colsData.filter(col => col.featured).slice(0, 3),
          ...routesData.filter(route => route.featured).slice(0, 2)
        ]);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Actions
  const handleFavoriteToggle = (id) => {
    console.log(`Favori toggled: ${id}`);
    // Logique pour ajouter/retirer des favoris
  };
  
  const handleBookmarkToggle = (id) => {
    console.log(`Bookmark toggled: ${id}`);
    // Logique pour ajouter/retirer des enregistrements
  };
  
  const handleShare = (id) => {
    console.log(`Shared: ${id}`);
    // Logique pour partager
  };
  
  // Filtres disponibles
  const availableFilters = {
    type: ['col', 'route'],
    difficulty: ['facile', 'moyen', 'difficile', 'très difficile', 'extrême'],
    region: ['Alpes', 'Pyrénées', 'Vosges', 'Jura', 'Massif central']
  };
  
  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Tableau de bord des visualisations
        </Typography>
        
        {/* Carrousel des éléments mis en avant */}
        <VisualizationCarousel
          items={featuredItems}
          title="Cols et Parcours à découvrir"
          loading={loading}
          viewAllUrl="/cols"
          variant="expanded"
          onFavoriteToggle={handleFavoriteToggle}
          onBookmarkToggle={handleBookmarkToggle}
          onShare={handleShare}
        />
        
        {/* Tabs pour la navigation */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            centered
          >
            <Tab label="Tous" />
            <Tab label="Cols" />
            <Tab label="Parcours" />
            <Tab label="Favoris" />
          </Tabs>
        </Paper>
        
        {/* Contenu basé sur l'onglet actif */}
        {activeTab === 0 && (
          <VisualizationGrid
            items={[...cols, ...routes]}
            loading={loading}
            title="Toutes les visualisations"
            filters={availableFilters}
            onFavoriteToggle={handleFavoriteToggle}
            onBookmarkToggle={handleBookmarkToggle}
            onShare={handleShare}
          />
        )}
        
        {activeTab === 1 && (
          <VisualizationGrid
            items={cols}
            loading={loading}
            title="Cols"
            filters={{
              difficulty: availableFilters.difficulty,
              region: availableFilters.region
            }}
            onFavoriteToggle={handleFavoriteToggle}
            onBookmarkToggle={handleBookmarkToggle}
            onShare={handleShare}
          />
        )}
        
        {activeTab === 2 && (
          <VisualizationGrid
            items={routes}
            loading={loading}
            title="Parcours"
            filters={{
              difficulty: availableFilters.difficulty,
              region: availableFilters.region
            }}
            onFavoriteToggle={handleFavoriteToggle}
            onBookmarkToggle={handleBookmarkToggle}
            onShare={handleShare}
          />
        )}
        
        {activeTab === 3 && (
          <VisualizationGrid
            items={[...cols, ...routes].filter(item => item.isFavorite)}
            loading={loading}
            title="Mes favoris"
            filters={availableFilters}
            onFavoriteToggle={handleFavoriteToggle}
            onBookmarkToggle={handleBookmarkToggle}
            onShare={handleShare}
            emptyStateMessage="Vous n'avez pas encore de favoris. Explorez les cols et parcours pour en ajouter."
          />
        )}
      </Box>
    </Container>
  );
};

export default VisualizationDashboard;
```

## AnimatedStats

`AnimatedStats` est un composant qui affiche des statistiques clés avec des animations pour créer un impact visuel fort. Il est idéal pour présenter des chiffres importants de manière engageante.

### Propriétés

| Propriété | Type | Description | Défaut |
|-----------|------|-------------|--------|
| stats | array | Liste des statistiques à afficher | [] |
| title | string | Titre de la section | "Nos chiffres clés" |
| subtitle | string | Sous-titre descriptif | "Découvrez ce qui fait de notre plateforme le choix préféré des cyclistes" |
| backgroundColor | string | Couleur de fond personnalisée | alpha(theme.palette.primary.main, 0.03) |
| sx | object | Styles supplémentaires pour le conteneur | {} |

### Format des statistiques

Chaque élément du tableau `stats` doit avoir la structure suivante :

```javascript
{
  id: 'identifier',          // Identifiant unique (requis)
  value: 42,                 // Valeur numérique à animer (requis)
  label: 'Label',            // Libellé de la statistique (requis)
  description: 'Description', // Description courte (optionnel)
  icon: <Icon />,            // Icône React (optionnel)
  color: 'primary',          // Couleur MUI (primary, secondary, error, warning, info, success)
  valueType: 'number'        // Type de valeur: 'number', 'percentage', 'plus' (optionnel)
}
```

### Exemple d'utilisation

```jsx
import AnimatedStats from '../components/animations/AnimatedStats';
import { MountainIcon, BikeIcon, RouteIcon, EventIcon } from '@mui/icons-material';

const ExampleStatsComponent = () => (
  <AnimatedStats 
    title="Notre communauté en chiffres"
    subtitle="Rejoignez des milliers de cyclistes passionnés"
    stats={[
      {
        id: 'cols',
        value: 240,
        label: 'Cols documentés',
        description: 'Des plus célèbres aux plus secrets',
        icon: <MountainIcon fontSize="large" />,
        color: 'primary'
      },
      {
        id: 'cyclists',
        value: 15750,
        label: 'Cyclistes actifs',
        description: 'Une communauté grandissante',
        icon: <BikeIcon fontSize="large" />,
        color: 'secondary'
      },
      {
        id: 'routes',
        value: 1280,
        label: 'Itinéraires partagés',
        description: 'À travers toute l\'Europe',
        icon: <RouteIcon fontSize="large" />,
        color: 'info'
      },
      {
        id: 'satisfaction',
        value: 98,
        label: 'Satisfaction utilisateurs',
        description: 'Des retours exceptionnels',
        icon: <EventIcon fontSize="large" />,
        valueType: 'percentage',
        color: 'success'
      }
    ]}
    backgroundColor="#f5f8ff"
  />
);
```

### Fonctionnalités avancées

- **Animation à l'affichage** : Les statistiques s'animent lors de leur apparition à l'écran.
- **Compteur animé** : Les valeurs s'incrémentent de 0 jusqu'à leur valeur finale.
- **Responsive** : S'adapte à toutes les tailles d'écran, de mobile à desktop.
- **Personnalisable** : Chaque statistic peut avoir sa propre couleur et icône.
- **Types de valeurs** : Support des valeurs numériques, pourcentages, et valeurs avec signe +.

### Intégration

Ce composant s'intègre parfaitement dans les pages d'accueil, tableaux de bord, ou sections de présentation pour mettre en avant des métriques importantes de votre application.

## Bonnes pratiques

### Performance

- Utilisez `React.memo` pour les composants de carte qui pourraient être rendus en grand nombre
- Implémentez la pagination côté serveur pour les grandes collections de données
- Optimisez les images avec des versions thumbnails pour les aperçus

### Accessibilité

- Tous les composants sont conçus pour être accessibles au clavier
- Les images ont des textes alternatifs appropriés
- Les contrôles de carrousel et de pagination sont entièrement accessibles

### Responsive Design

- Les composants s'adaptent automatiquement aux différentes tailles d'écran
- Sur mobile, le nombre d'éléments par ligne est réduit
- Les filtres se réorganisent pour s'adapter aux petits écrans

### Extensibilité

Ces composants sont conçus pour être facilement personnalisables :

- Utilisez le `variant` pour adapter l'apparence
- Passez des propriétés de style personnalisées pour modifier l'apparence
- Étendez les composants avec des fonctionnalités spécifiques à votre application

## Conclusion

Ces composants de visualisation offrent une expérience utilisateur moderne et cohérente pour Explorer les cols et parcours cyclistes. Ils sont conçus pour être flexibles, performants et accessibles, tout en s'intégrant parfaitement avec le reste de l'application Euro Cycling Dashboard.

Pour toute question ou suggestion d'amélioration, contactez l'équipe frontend à frontend@euro-cycling-dashboard.eu.
