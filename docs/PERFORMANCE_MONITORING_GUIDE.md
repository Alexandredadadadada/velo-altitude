# Guide du Système de Monitoring de Performance

## Présentation

Ce document décrit le système de monitoring de performance implémenté dans l'application Velo-Altitude. Ce système permet de collecter, afficher et analyser des métriques de performance critiques pour assurer une expérience utilisateur optimale.

## Architecture du Système

Le système de monitoring de performance est composé de plusieurs éléments :

1. **Infrastructure de base** (`client/src/performance/setupMonitoring.js`)
   - Initialisation et configuration du système
   - API pour marquer les événements de performance

2. **Utilitaires de monitoring** (`client/src/utils/performanceMonitoring.js`)
   - Collection automatique des Web Vitals
   - Fonctions de mesure pour les opérations spécifiques
   - Monitoring des performances 3D (FPS)
   - Panneau de développement pour visualiser les métriques

3. **Instrumentation des composants critiques**
   - Visualisation 3D (`client/src/components/visualization/ColVisualization3D.jsx`)
   - Cartes interactives (`client/src/components/cols/ColMap.js`)

4. **Tests automatisés**
   - Tests Lighthouse (`performance-testing/lighthouse-ci-config.js`)
   - Tests E2E de performance (`performance-testing/e2e-performance-tests.js`)

## Configuration

Le système est initialisé dans `client/src/index.js` :

```javascript
const performanceMonitor = setupPerformanceMonitoring({
  enableWebVitals: true,                               // Collecter les Core Web Vitals
  enableDevPanel: process.env.NODE_ENV === 'development', // Activer le panneau de développement en mode dev
  debug: process.env.NODE_ENV === 'development'        // Afficher les logs détaillés en mode dev
});

// API de debugging exposée en développement
if (process.env.NODE_ENV === 'development') {
  window.perfMonitor = performanceMonitor;
}
```

## Utilisation de l'API de Monitoring

### Marqueurs d'événements de performance

Pour mesurer une opération spécifique :

```javascript
import { markPerformanceEvent } from '../../performance/setupMonitoring';

// Marquer le début d'une opération
markPerformanceEvent('operation_start', { 
  operationId: 'unique_id',
  additionalInfo: 'value'
});

// Code à mesurer
// ...

// Marquer la fin de l'opération
markPerformanceEvent('operation_end', { 
  operationId: 'unique_id',
  result: 'success'
});
```

### Monitoring 3D (FPS)

Pour les composants 3D, le monitoring FPS est disponible :

```javascript
// Dans un composant utilisant three.js/WebGL
if (window.perfMonitor) {
  const renderer = myThreeJsRenderer;
  const fpsMonitor = window.perfMonitor.monitor3D(renderer);
  
  // Arrêter le monitoring si nécessaire
  fpsMonitor.stop();
}
```

### Panneau de développement

En mode développement, un panneau flottant affiche en temps réel :
- Les Core Web Vitals (LCP, CLS, INP, FID, TTFB)
- Le FPS pour les rendus 3D
- Les événements de performance marqués manuellement

## Métriques Collectées

### Web Vitals

| Métrique | Description | Budget |
|----------|-------------|--------|
| LCP | Largest Contentful Paint - Temps de chargement du plus grand élément visible | < 2.5s |
| CLS | Cumulative Layout Shift - Stabilité visuelle de la page | < 0.1 |
| INP | Interaction to Next Paint - Réactivité de l'interface | < 200ms |
| FID | First Input Delay - Délai avant la première interaction possible | < 100ms |
| TTFB | Time To First Byte - Temps de réponse du serveur | < 800ms |

### Métriques Personnalisées

| Catégorie | Événement | Description |
|-----------|-----------|-------------|
| **Carte** | `map_init_start`/`map_init_complete` | Temps d'initialisation de la carte |
|  | `map_interaction_*` | Interactions utilisateur avec la carte |
| **3D** | `3d_render_init_start`/`3d_render_init_complete` | Temps d'initialisation du rendu 3D |
|  | `3d_fps` | Images par seconde du rendu 3D |
| **Élévation** | `elevation_chart_init_*` | Temps de chargement du graphique d'élévation |

## Débogage en Développement

En mode développement, vous pouvez accéder à l'API de monitoring via `window.perfMonitor` :

```javascript
// Console du navigateur
window.perfMonitor.getWebVitals();  // Obtenir les valeurs actuelles des Web Vitals
window.perfMonitor.getFPS();        // Obtenir le FPS actuel
window.perfMonitor.getEvents();     // Obtenir tous les événements de performance enregistrés
```

## Exécution des Tests de Performance

Pour exécuter les tests de performance automatisés :

```bash
# Tests Lighthouse pour les métriques standards
npm run test:lighthouse

# Tests E2E pour les scénarios d'utilisation
npm run test:performance

# Rapport complet (build + lighthouse + e2e)
npm run performance:report
```

## Analyse des Résultats

Les résultats des tests sont sauvegardés dans :

- Lighthouse : `./performance-testing/lighthouse-results/`
- Tests E2E : `./performance-results/`

Comparez ces résultats avec les budgets définis dans `docs/PERFORMANCE_BUDGETS.md` pour identifier les problèmes potentiels et les possibilités d'optimisation.

## Bonnes Pratiques

1. **Ajoutez des marqueurs aux opérations coûteuses**
   - Chargement asynchrone de données
   - Calculs complexes
   - Interactions critiques pour l'utilisateur

2. **Vérifiez régulièrement les performances**
   - Lors du développement de nouvelles fonctionnalités
   - Après l'intégration de nouvelles dépendances
   - Avant chaque déploiement majeur

3. **Comparez avec les baselines**
   - Établissez une base de référence
   - Surveillez les régressions de performance
   - Célébrez les améliorations!
