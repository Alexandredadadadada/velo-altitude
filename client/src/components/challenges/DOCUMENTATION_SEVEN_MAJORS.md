# Documentation du Défi "Les 7 Majeurs"

Ce document détaille l'architecture, les fonctionnalités et l'implémentation technique du composant "Les 7 Majeurs" de la plateforme Dashboard-Velo.com.

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture du composant](#architecture-du-composant)
3. [Fonctionnalités principales](#fonctionnalités-principales)
4. [Intégration avec les filtres avancés de cols](#intégration-avec-les-filtres-avancés-de-cols)
5. [Système de recommandation](#système-de-recommandation)
6. [Visualisation et statistiques](#visualisation-et-statistiques)
7. [Persistance des données](#persistance-des-données)
8. [Optimisations techniques](#optimisations-techniques)
9. [Dimension européenne du défi](#dimension-européenne-du-défi)
10. [Personnalisation avancée](#personnalisation-avancée)
11. [Partage et compétition](#partage-et-compétition)

## Vue d'ensemble

Le défi "Les 7 Majeurs" est une fonctionnalité phare de la plateforme, permettant aux cyclistes de créer leurs propres défis personnalisés en sélectionnant 7 cols majeurs d'Europe. Cette approche gamifiée de la planification d'objectifs cyclistes combine visualisation interactive, analyse de données et aspects communautaires pour offrir une expérience unique aux utilisateurs.

### Concept et objectifs

Le concept des "7 Majeurs" s'inspire des grands défis d'alpinisme comme les "Seven Summits" (les sept plus hauts sommets de chaque continent). L'objectif est de permettre aux cyclistes de :

- Personnaliser leur propre défi cycliste européen
- Visualiser et comparer différents cols majeurs
- Planifier leurs saisons de cyclisme autour d'objectifs concrets
- Partager leurs défis et progressions avec la communauté
- Découvrir des cols emblématiques à travers l'Europe

L'approche innovante de cette fonctionnalité réside dans sa flexibilité : plutôt que d'imposer un défi unique à tous les utilisateurs, la plateforme leur permet de créer un défi parfaitement adapté à leurs aspirations, capacités et localisation géographique.

## Architecture du composant

Le composant "Les 7 Majeurs" est conçu selon une architecture moderne et modulaire, optimisée pour les performances et l'expérience utilisateur.

### Structure des composants

```
SevenMajorsChallenge.js (composant principal)
├── TabNavigation.js (système d'onglets)
│   ├── ColSearchTab.js (recherche et filtres)
│   │   ├── ColFilters.js (filtres avancés)
│   │   └── ColSearchResults.js (résultats de recherche)
│   ├── CurrentChallengeTab.js (défi en cours)
│   │   ├── ChallengeStats.js (statistiques du défi)
│   │   ├── ColVisualization3D.js (visualisation 3D)
│   │   └── ChallengeMap.js (carte interactive)
│   ├── PredefinedChallengesTab.js (défis prédéfinis)
│   └── SavedChallengesTab.js (défis sauvegardés)
├── ColDetail.js (détails d'un col)
│   ├── ColStats.js (statistiques)
│   ├── ColHistory.js (historique)
│   └── ColPoints.js (points d'intérêt)
├── SaveChallengeDialog.js (sauvegarde)
└── ChallengeShareDialog.js (partage)
```

### Flux de données

Le composant utilise une architecture de gestion d'état optimisée :

1. **State Management** : Utilisation du Context API de React pour une gestion d'état efficace et performante
2. **Data Fetching** : Hooks personnalisés pour la récupération des données avec cache intelligent
3. **Memoization** : Utilisation intensive de `useMemo` et `useCallback` pour éviter les rendus inutiles
4. **Code Splitting** : Chargement à la demande des composants lourds comme les visualisations 3D

## Fonctionnalités principales

Le composant "Les 7 Majeurs" offre un ensemble complet de fonctionnalités organisées en quatre sections principales accessibles via des onglets.

### 1. Recherche et filtrage des cols

Ce module permet aux utilisateurs de :

- Rechercher des cols par nom, région ou pays
- Filtrer les résultats par :
  - Altitude (min/max)
  - Difficulté (échelle de 1 à 5)
  - Longueur (km)
  - Dénivelé (m)
  - Pente moyenne (%)
  - Type de surface (asphalte, gravier, mixte)
  - Saisons recommandées
  - Région européenne

```javascript
// Extrait du système de filtrage
const filterCols = (cols, filters) => {
  return cols.filter(col => {
    // Filtrage par altitude
    if (filters.altitude.min && col.altitude < filters.altitude.min) return false;
    if (filters.altitude.max && col.altitude > filters.altitude.max) return false;
    
    // Filtrage par difficulté
    if (filters.difficulty.length && !filters.difficulty.includes(col.difficulty)) return false;
    
    // Filtrage par région
    if (filters.region.length && !filters.region.includes(col.region)) return false;
    
    // Filtrage par pays
    if (filters.country.length && !filters.country.includes(col.country)) return false;
    
    // Filtrage par type de surface
    if (filters.surface.length && !filters.surface.includes(col.surfaceType)) return false;
    
    // Filtrage par saison
    if (filters.season.length && !col.recommendedSeasons.some(s => filters.season.includes(s))) return false;
    
    return true;
  });
};
```

### 2. Mon Défi actuel

Cette section présente le défi personnalisé de l'utilisateur avec :

- Liste des cols sélectionnés avec possibilité de réorganisation par drag-and-drop
- Visualisation 3D interactive des cols sélectionnés
- Carte interactive montrant l'emplacement des cols
- Statistiques globales du défi :
  - Distance totale
  - Dénivelé cumulé
  - Difficulté moyenne
  - Score global du défi
  - Temps estimé pour compléter le défi

```javascript
// Calcul du score global du défi
const calculateChallengeScore = (selectedCols) => {
  if (!selectedCols.length) return 0;
  
  const totalElevation = selectedCols.reduce((sum, col) => sum + col.elevation, 0);
  const totalDistance = selectedCols.reduce((sum, col) => sum + col.distance, 0);
  const avgGradient = selectedCols.reduce((sum, col) => sum + col.averageGradient, 0) / selectedCols.length;
  const maxAltitude = Math.max(...selectedCols.map(col => col.altitude));
  
  // Algorithme de scoring personnalisé
  return Math.round(
    (totalElevation * 0.4) + 
    (totalDistance * 0.2) + 
    (avgGradient * 150) + 
    (maxAltitude * 0.1)
  );
};
```

### 3. Défis prédéfinis

Cette section propose des défis thématiques préconçus :

- Les classiques du Tour de France
- Les géants des Alpes
- Le tour des Pyrénées
- Les joyaux des Dolomites
- La route des grands cols suisses
- Les trésors cachés des Balkans
- Les sommets historiques

Chaque défi prédéfini est accompagné d'une description détaillée, d'une difficulté estimée et d'une recommandation saisonnière.

### 4. Mes Défis sauvegardés

Cette section permet aux utilisateurs connectés de :

- Consulter leurs défis personnalisés sauvegardés
- Suivre leur progression sur chaque défi
- Modifier ou supprimer des défis existants
- Partager leurs défis sur les réseaux sociaux
- Exporter leurs défis au format GPX/TCX

## Intégration avec les filtres avancés de cols

Le système est entièrement intégré avec le mécanisme de filtres avancés, offrant une expérience de recherche puissante et intuitive.

### API de filtrage

L'API de filtrage permet des recherches complexes avec une syntaxe simple :

```javascript
// Exemple d'utilisation de l'API de filtrage
const searchParams = {
  query: "alpe", // Recherche textuelle
  filters: {
    region: ["Alps", "Pyrenees"],
    difficulty: [4, 5],
    altitude: { min: 1500, max: 3000 },
    surface: ["asphalt"],
    season: ["summer"]
  },
  sort: { field: "altitude", order: "desc" },
  limit: 20
};

// Appel au service API
const results = await colService.searchCols(searchParams);
```

### Optimisations de performance

Pour garantir des performances optimales même avec de nombreux filtres :

- **Indexation côté serveur** : Les attributs de cols sont indexés pour des recherches rapides
- **Filtrage progressif côté client** : Application séquentielle des filtres pour éliminer rapidement les résultats non pertinents
- **Debouncing des requêtes** : Limitation des appels API pendant la modification des filtres
- **Mise en cache des résultats** : Stockage temporaire des résultats de recherche fréquents

## Système de recommandation

Le composant intègre un système de recommandation intelligent qui suggère des cols complémentaires en fonction des cols déjà sélectionnés.

### Algorithme de recommandation

```javascript
// Algorithme simplifié du système de recommandation
const getRecommendations = (selectedCols, allCols, userProfile) => {
  if (!selectedCols.length) return getPopularCols(allCols, 5);
  
  // Extraire les caractéristiques des cols sélectionnés
  const selectedRegions = getUniqueValues(selectedCols, 'region');
  const avgDifficulty = getAverage(selectedCols, 'difficulty');
  const preferredSurface = getMostFrequent(selectedCols, 'surfaceType');
  
  // Calculer un score de similarité pour chaque col non sélectionné
  return allCols
    .filter(col => !selectedCols.some(selected => selected.id === col.id))
    .map(col => ({
      col,
      score: calculateSimilarityScore(col, {
        regions: selectedRegions,
        avgDifficulty,
        preferredSurface
      }, userProfile)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(item => item.col);
};

// Fonction de calcul du score de similarité
const calculateSimilarityScore = (col, preferences, userProfile) => {
  let score = 0;
  
  // Bonus pour la même région
  if (preferences.regions.includes(col.region)) score += 20;
  
  // Bonus/malus selon la difficulté
  const difficultyDiff = Math.abs(col.difficulty - preferences.avgDifficulty);
  score += (3 - difficultyDiff) * 10;
  
  // Bonus pour le même type de surface
  if (col.surfaceType === preferences.preferredSurface) score += 15;
  
  // Bonus selon les préférences de l'utilisateur
  if (userProfile) {
    if (userProfile.preferredRegions.includes(col.region)) score += 10;
    if (userProfile.preferredSeasons.includes(col.recommendedSeasons[0])) score += 5;
  }
  
  return score;
};
```

### Apprentissage des préférences

Le système enregistre et apprend des sélections précédentes de l'utilisateur pour améliorer progressivement ses recommandations. Il utilise une combinaison de :

- Filtrage collaboratif : "Les cyclistes qui ont choisi ce col ont aussi choisi..."
- Filtrage basé sur le contenu : Caractéristiques similaires (région, difficulté, type)
- Filtrage contextuel : Saison actuelle, localisation de l'utilisateur, niveau d'expérience

## Visualisation et statistiques

### Visualisation 3D

Le composant intègre une visualisation 3D avancée des cols utilisant Three.js avec des optimisations pour les performances :

- **Level of Detail (LOD)** : Niveaux de détail adaptatifs selon la distance de visualisation
- **Textures progressives** : Chargement progressif des textures haute résolution
- **Instancing** : Utilisation de l'instancing pour les éléments répétitifs (arbres, rochers)
- **Web Workers** : Calculs complexes déportés sur des threads séparés
- **WebGL optimisé** : Minimisation des appels de rendu et optimisation des shaders

### Statistiques interactives

Le module de statistiques offre une analyse détaillée du défi avec des visualisations interactives :

- Graphiques comparatifs des cols sélectionnés
- Profils d'élévation superposés
- Diagrammes radar des caractéristiques (difficulté, beauté, trafic, etc.)
- Estimation du temps nécessaire basée sur le niveau de l'utilisateur
- Comparaison avec les records connus (KOM/QOM Strava)

## Persistance des données

Le système utilise plusieurs mécanismes pour la persistance des données :

### Utilisateurs authentifiés

Pour les utilisateurs connectés, les défis sont :
- Sauvegardés dans la base de données principale
- Synchronisés entre appareils
- Associés au profil utilisateur avec statistiques de progression

### Utilisateurs anonymes

Pour les utilisateurs non connectés :
- Utilisation de localStorage pour sauvegarder temporairement les défis
- Invitation à créer un compte pour sauvegarder de façon permanente
- Conservation d'un historique limité des dernières sélections

### Sécurité et intégrité des données

- Validation des données côté client et serveur
- Vérification des permissions avant modification/suppression
- Sauvegarde automatique pour éviter la perte de données

## Optimisations techniques

Le composant a été optimisé pour offrir des performances maximales :

### Performance front-end

- **React.memo** pour éviter les rendus inutiles des sous-composants
- **Virtualisation** des listes pour gérer efficacement de grands ensembles de données
- **Lazy loading** des images et composants lourds
- **Code splitting** pour réduire la taille initiale du bundle

### Exemple d'optimisation

```javascript
// Utilisation de React.memo pour optimiser les performances
const ColCard = React.memo(({ col, onSelect, isSelected }) => {
  // Composant optimisé avec React.memo
  return (
    <Card 
      onClick={() => onSelect(col)}
      elevation={isSelected ? 4 : 1}
      className={isSelected ? 'selected-col' : ''}
    >
      {/* Contenu de la carte */}
    </Card>
  );
}, (prevProps, nextProps) => {
  // Fonction de comparaison personnalisée pour éviter les rendus inutiles
  return prevProps.isSelected === nextProps.isSelected && 
         prevProps.col.id === nextProps.col.id;
});

// Optimisation des listes avec react-window pour la virtualisation
import { FixedSizeList } from 'react-window';

const ColList = ({ cols, onSelectCol, selectedColIds }) => {
  const Row = ({ index, style }) => {
    const col = cols[index];
    return (
      <div style={style}>
        <ColCard 
          col={col} 
          onSelect={onSelectCol} 
          isSelected={selectedColIds.includes(col.id)} 
        />
      </div>
    );
  };

  return (
    <FixedSizeList
      height={500}
      width="100%"
      itemCount={cols.length}
      itemSize={120}
    >
      {Row}
    </FixedSizeList>
  );
};
```

## Dimension européenne du défi

Le défi "Les 7 Majeurs" embrasse pleinement la dimension européenne de Dashboard-Velo.com en offrant une expérience véritablement paneuropéenne.

### Couverture géographique

Le système inclut des cols de toutes les grandes régions cyclistes d'Europe :

- **Alpes** : Cols français, italiens, suisses, autrichiens et slovènes
- **Pyrénées** : Cols français et espagnols
- **Dolomites** : Cols italiens emblématiques
- **Massif Central** : Cols français du centre
- **Sierra Nevada** : Cols espagnols
- **Balkans** : Cols de Croatie, Slovénie et Monténégro
- **Benelux** : Classiques des Ardennes et du Limbourg
- **Scandinavie** : Cols de Norvège et Suède
- **Europe de l'Est** : Carpates et montagnes tchèques

### Contextualisation culturelle

Chaque col est accompagné d'informations culturelles et historiques :

- Histoire cycliste du col (apparitions dans les grands tours)
- Anecdotes et moments historiques
- Contexte culturel et régional
- Traditions locales liées au cyclisme
- Recommandations pour l'expérience complète (gastronomie, hébergement)

### Support multilingue intégré

Le système prend en charge 5 langues européennes majeures :

- Français
- Anglais
- Allemand
- Italien
- Espagnol

Toutes les descriptions, conseils et interfaces sont disponibles dans ces 5 langues, permettant aux cyclistes de toute l'Europe de profiter pleinement de la fonctionnalité.

## Personnalisation avancée

Au-delà de la simple sélection de cols, le système offre des options de personnalisation avancées :

### Configuration du défi

- **Durée du défi** : De quelques jours à une saison complète
- **Objectifs personnalisés** : Temps cible, record personnel à battre
- **Mode de réalisation** : Consécutif ou non-consécutif
- **Contraintes additionnelles** : Conditions spécifiques (par exemple, cols à réaliser en une journée)

### Planification intégrée

L'intégration avec le reste de la plateforme permet :

- La génération automatique de programmes d'entraînement adaptés au défi
- Des recommandations nutritionnelles spécifiques
- Des itinéraires suggérés entre les cols
- L'ajout au calendrier avec notifications et rappels

## Partage et compétition

La dimension sociale est un élément clé du défi :

### Fonctionnalités sociales

- **Partage des défis** sur les réseaux sociaux avec visualisations attractives
- **Classements** des défis les plus populaires et les plus difficiles
- **Badges et récompenses** pour les défis complétés
- **Témoignages et photos** des cols conquis

### Compétition amicale

- **Classements entre amis** sur les mêmes défis
- **Défis de groupe** où plusieurs cyclistes s'engagent sur le même objectif
- **Compétitions saisonnières** avec des thèmes changeants

---

## Notes techniques

### Dépendances requises

- React 18+
- Material UI 5.x
- Three.js pour les visualisations 3D
- React Router 6.x pour la navigation
- React DnD pour le drag-and-drop
- Recharts pour les visualisations de données

### Guides d'utilisation associés

- [Guide utilisateur du défi Les 7 Majeurs](/docs/guide-utilisateur/defis/sept-majeurs.md)
- [Tutoriel vidéo d'utilisation](/docs/tutorials/video/seven-majors-challenge.mp4)
- [FAQ sur les défis personnalisés](/docs/faq/challenges.md)

---

Document mis à jour le : 05/04/2025  
Contact technique : tech@dashboard-velo.com
