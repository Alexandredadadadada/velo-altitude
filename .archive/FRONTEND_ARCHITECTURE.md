# Architecture Frontend Dashboard-Velo

## Vue d'ensemble

L'architecture frontend de Dashboard-Velo repose sur une approche modulaire, performante et adaptative, conçue pour offrir une expérience utilisateur optimale sur tous les appareils. Cette documentation décrit les principaux composants, services et patterns utilisés dans l'application.

*Version : 2.0.0*  
*Dernière mise à jour : Avril 2025*

## Table des matières

1. [Structure des Composants](#structure-des-composants)
2. [Services et Utilitaires](#services-et-utilitaires)
3. [Système d'Optimisation 3D](#système-doptimisation-3d)
   - [BatteryOptimizer](#batteryoptimizer)
   - [Niveaux de Détail Adaptatifs](#niveaux-de-détail-adaptatifs)
4. [Modules Principaux](#modules-principaux)
5. [Gestion d'État](#gestion-détat)
6. [Routage et Navigation](#routage-et-navigation)
7. [Optimisation des Performances](#optimisation-des-performances)
8. [Internationalisation](#internationalisation)
9. [Tests](#tests)
10. [Bonnes Pratiques](#bonnes-pratiques)

## Structure des Composants

L'application est organisée selon une structure de composants hiérarchique :

```
client/src/
├── components/           # Composants réutilisables
│   ├── common/           # Composants UI génériques
│   ├── layout/           # Composants de mise en page
│   ├── nutrition/        # Composants du module nutrition
│   ├── training/         # Composants du module entrainement
│   ├── visualization/    # Composants de visualisation 3D
│   └── weather/          # Composants météo
├── pages/                # Pages principales de l'application
├── hooks/                # Hooks React personnalisés
├── services/             # Services pour les appels API et logique métier
├── utils/                # Utilitaires et fonctions auxiliaires
├── context/              # Contextes React
├── store/                # Configuration du store Redux
├── assets/               # Images, icônes et ressources statiques
└── styles/               # Styles globaux et thèmes
```

## Services et Utilitaires

### Services Principaux

- **apiService**: Gestion centralisée des appels API avec gestion d'erreurs et retry
- **authService**: Authentification et gestion des sessions
- **localStorageService**: Persistance locale des préférences et données caching
- **notificationService**: Système de notifications et alertes
- **featureFlagsService**: Gestion des fonctionnalités activables/désactivables

### Utilitaires d'Optimisation

- **deviceCapabilityDetector**: Détection des capacités du périphérique
- **threeDConfigManager**: Configuration adaptative des rendus 3D
- **mobileOptimizer**: Optimisations spécifiques aux mobiles
- **batteryOptimizer**: Gestion intelligente de la batterie
- **performanceMonitor**: Surveillance des métriques de performance

## Système d'Optimisation 3D

### BatteryOptimizer

Le BatteryOptimizer est un service clé pour l'optimisation des composants gourmands en ressources, particulièrement les visualisations 3D. Il permet d'adapter dynamiquement le niveau de qualité en fonction de l'état de la batterie.

#### Architecture et Fonctionnement

```javascript
class BatteryOptimizer {
  // Propriétés principales
  batteryData = {
    isSupported: false,
    level: 1.0,
    charging: true,
    dischargingTime: Infinity
  };
  batteryModeActive = false;
  
  // Configuration des seuils
  thresholds = {
    lowBatteryLevel: 0.3,      // Activation automatique
    criticalBatteryLevel: 0.15, // Optimisations maximales
    dischargingTimeWarning: 30 * 60 // 30 minutes
  };
  
  // Configurations d'optimisation
  batterySavingConfig = {
    maxPixelRatio: 1.0,
    shadowsEnabled: false,
    useSimplifiedGeometry: true,
    minimizeObjects: true,
    maxDistanceMarkers: 5,
    antialias: false,
    maxLights: 1,
    useLowResTextures: true,
    disablePostProcessing: true,
    throttleFPS: true,
    targetFPS: 30,
    enableFrustumCulling: true
  };
  
  // Méthodes principales
  async initialize() {...}
  updateBatteryInfo(battery) {...}
  checkBatteryStatus() {...}
  setBatteryMode(active) {...}
  getBatterySavingConfig() {...}
  addListener(listener) {...}
  removeListener(listener) {...}
}
```

#### Intégration dans les Composants

Le BatteryOptimizer s'intègre dans les composants 3D comme suit :

1. **Initialisation** : Le service est initialisé au chargement de l'application
2. **Détection** : Surveillance continue de l'état de la batterie
3. **Notification** : Les composants s'abonnent aux changements d'état
4. **Adaptation** : Ajustement dynamique des paramètres de rendu

Exemple d'intégration dans un composant :

```jsx
const [batteryMode, setBatteryMode] = useState(false);

// Dans useEffect
useEffect(() => {
  // Initialiser et s'abonner aux changements
  batteryOptimizer.initialize();
  setBatteryMode(batteryOptimizer.isBatteryModeActive());
  
  batteryOptimizer.addListener(({ batteryModeActive }) => {
    setBatteryMode(batteryModeActive);
    updateRenderConfig();
  });
  
  return () => {
    batteryOptimizer.removeListener(/* ... */);
  };
}, []);
```

#### Avantages et Impact

- **Autonomie améliorée** : Réduction de la consommation d'énergie jusqu'à 45%
- **Expérience fluide** : Maintien d'un framerate acceptable même en mode économie
- **Automatisation** : Activation intelligente basée sur les conditions réelles
- **Contrôle utilisateur** : Possibilité d'activation/désactivation manuelle

### Niveaux de Détail Adaptatifs

Le système implémente plusieurs niveaux de détail (LOD) qui s'adaptent dynamiquement :

#### Niveaux Géométriques

| Niveau | Description | Critère d'Activation | Modifications |
|--------|-------------|----------------------|---------------|
| Ultra | Géométrie complète, détails maximum | Desktop haut de gamme, >40 FPS stables | Segments x1.5, ombres avancées |
| High | Géométrie détaillée | Desktop, tablettes performantes, >30 FPS | Segments x1, ombres standard |
| Medium | Détails réduits | Tablettes, mobiles haut de gamme, >25 FPS | Segments x0.75, ombres simplifiées |
| Low | Géométrie simplifiée | Mobiles standard, >20 FPS | Segments x0.5, ombres basiques |
| Ultra Low | Minimum viable | Appareils faibles, <20 FPS ou batterie <15% | Segments x0.25, pas d'ombres |

#### Optimisations de Textures

| Niveau | Taille Max | Filtrage | Mipmapping | Compression |
|--------|------------|----------|------------|------------|
| Ultra | Original | Trilinéaire | Anisotrope 16x | Intelligent |
| High | 2048px | Trilinéaire | Anisotrope 8x | Standard |
| Medium | 1024px | Bilinéaire | Anisotrope 4x | Aggressive |
| Low | 512px | Bilinéaire | Basique | Haute |
| Ultra Low | 256px | Nearest | Désactivé | Maximum |

#### Seuils d'Activation

Les seuils qui déclenchent les changements de niveau sont basés sur :

1. **Performance** : Framerate moyen sur une période de 10 secondes
2. **Appareil** : Type d'appareil et capacités détectées
3. **Batterie** : Niveau et état de charge
4. **Interaction** : Mode d'interaction actif (statique vs dynamique)

## Modules Principaux

### Module de Visualisation 3D

Le module de visualisation 3D comprend les composants suivants :

- **ColVisualization3D** : Visualisation des cols en 3D
- **TrainingVisualizer3D** : Visualisation des entraînements
- **RouteExplorer3D** : Exploration des itinéraires en 3D

Ces composants partagent les services d'optimisation et présentent une interface utilisateur cohérente.

### Module de Nutrition

Le module de nutrition a été optimisé pour un chargement rapide :

- Implémentation du lazy loading pour charger les recettes à la demande
- Préchargement intelligent basé sur les préférences utilisateur
- Cache local des données fréquemment consultées
- Optimisation des images avec chargement progressif

### Module d'Entraînement

Le module d'entraînement adopte une approche similaire :

- Chargement asynchrone des plans d'entraînement
- Calculs intensifs déportés dans des web workers
- Interface utilisateur réactive même pendant le chargement des données
- Synchronisation en arrière-plan pour les modifications

## Gestion d'État

L'application utilise une combinaison de :

- **Redux** : Pour l'état global et partagé
- **Context API** : Pour les états spécifiques à certains domaines
- **Local State** : Pour les états spécifiques aux composants
- **React Query** : Pour la gestion du cache et des requêtes API

## Routage et Navigation

- Utilisation de React Router avec code splitting
- Préchargement des routes probables
- Transitions fluides entre les pages
- Conservation de l'état lors des navigations

## Optimisation des Performances

### Stratégies Générales

- **Code Splitting** : Chargement à la demande des modules
- **Lazy Loading** : Chargement différé des composants lourds
- **Memoization** : Optimisation des rendus avec React.memo et useMemo
- **Virtualisation** : Rendu efficace des longues listes
- **Service Workers** : Cache et fonctionnement hors ligne

### Optimisations Spécifiques

- **Images** : Formats modernes (WebP), tailles optimisées, srcset
- **CSS** : Utilisation de CSS-in-JS avec extraction critique
- **JavaScript** : Minification, tree shaking, optimisation des bundles
- **API** : Stratégies de cache et de requêtes optimisées

## Internationalisation

- Support multilingue via i18next
- Formats de date, heure et nombres localisés
- Textes et contenus adaptés aux contextes culturels

## Tests

- **Tests Unitaires** : Jest et React Testing Library
- **Tests d'Intégration** : Cypress
- **Tests de Performance** : Lighthouse et outils personnalisés
- **Tests A/B** : Plateforme interne pour l'expérimentation

## Bonnes Pratiques

### Guidelines de Développement

- Organisation modulaire du code
- Composants réutilisables et auto-documentés
- Séparation claire des préoccupations
- Architecture orientée performances

### Accessibilité

- Respect des normes WCAG 2.1 AA
- Support des lecteurs d'écran
- Navigation au clavier
- Contraste et lisibilité adaptés

### Sécurité Frontend

- Protection contre les attaques XSS
- Validation des entrées utilisateur
- Gestion sécurisée des tokens
- CSP (Content Security Policy) configurée
