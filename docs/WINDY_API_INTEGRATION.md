# Documentation d'intégration de l'API Windy

## Aperçu

Cette documentation détaille l'intégration de l'API Windy dans l'application Velo-Altitude pour améliorer les fonctionnalités météorologiques liées au vent. L'intégration permet d'obtenir des données de vent précises, des prévisions détaillées et des alertes de sécurité pour les cyclistes.

## Table des matières

1. [Configuration](#configuration)
2. [Services](#services)
   - [WindyService](#windyservice)
   - [EnhancedWeatherService](#enhancedweatherservice)
3. [Composants UI](#composants-ui)
   - [WindAlert](#windalert)
   - [WindForecast](#windforecast)
4. [Utilitaires](#utilitaires)
   - [wind-safety](#wind-safety)
5. [Exemples d'utilisation](#exemples-dutilisation)
6. [Tests](#tests)
7. [Quotas et optimisations](#quotas-et-optimisations)

## Configuration

L'API Windy utilise une clé API qui est déjà configurée dans Netlify. La clé est accessible via les variables d'environnement suivantes :

```javascript
// Accès à la clé API
const apiKey = process.env.WINDY_PLUGINS_API;
```

### Variables d'environnement

| Variable           | Description                     | Valeur par défaut |
|--------------------|---------------------------------|-------------------|
| WINDY_PLUGINS_API  | Clé API pour Windy              | (Configurée dans Netlify) |

## Services

### WindyService

Le service principal pour interagir avec l'API Windy. Ce service offre les fonctionnalités suivantes :

- Récupération des données détaillées de vent
- Prévisions de vent
- Alertes pour conditions dangereuses
- Recommandations de sécurité pour les cyclistes
- Vérifications spécifiques pour les cols de montagne

#### Méthodes principales

```typescript
// Obtenir les données détaillées du vent
getDetailedWindData(location: GeoLocation): Promise<WindData>

// Obtenir les prévisions de vent
getWindForecast(location: GeoLocation, days: number): Promise<WindForecast>

// Obtenir une recommandation de sécurité
getWindSafetyRecommendation(location: GeoLocation): Promise<{
  safeToRide: boolean;
  windData: WindData;
  recommendation: string;
  warningLevel: 'none' | 'info' | 'warning' | 'danger';
}>

// Vérifier les conditions de vent pour un col spécifique
checkMountainPassWindConditions(colId: string, location: GeoLocation): Promise<{
  windData: WindData;
  warningLevel: 'none' | 'info' | 'warning' | 'danger';
  safeToRide: boolean;
  recommendation: string;
}>

// S'abonner aux alertes de vent
registerWarningCallback(callback: (warning: WindWarning) => void): () => void
```

### EnhancedWeatherService

Extension du service `UnifiedWeatherService` existant pour intégrer les fonctionnalités Windy. Ce service agit comme une façade unifiée pour toutes les API météo.

#### Nouvelles méthodes

```typescript
// Obtenir les données détaillées du vent
getDetailedWindData(location: string | GeoLocation): Promise<WindData>

// Obtenir les prévisions de vent
getWindForecast(location: string | GeoLocation, days?: number): Promise<WindForecast>

// Obtenir une recommandation de sécurité avec personnalisation selon l'expérience
getWindSafetyRecommendation(
  location: string | GeoLocation,
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced',
  terrain?: 'flat' | 'mountain_descent' | 'mountain_col' | 'exposed_road'
): Promise<any>

// Vérifier les conditions de vent pour un col
getColWindConditions(colId: string, location: GeoLocation): Promise<any>

// S'abonner aux alertes de vent
registerWindWarningCallback(callback: (warning: WindWarning) => void): () => void
```

## Composants UI

### WindAlert

Composant d'alerte pour afficher les avertissements liés au vent. Prend en charge plusieurs variantes d'affichage.

#### Propriétés

```typescript
interface WindAlertProps {
  colId?: string;                // ID du col (optionnel)
  location?: GeoLocation;        // Coordonnées géographiques
  onWarning?: (warning: WindWarning) => void; // Callback pour les alertes
  autoClose?: boolean;           // Fermeture automatique
  autoCloseDelay?: number;       // Délai de fermeture
  variant?: 'standard' | 'compact' | 'minimal'; // Style d'affichage
  position?: 'top' | 'bottom' | 'inline';       // Position sur la page
}
```

#### Exemple d'utilisation

```jsx
<WindAlert 
  colId="galibier"
  location={{ lat: 45.0608, lon: 6.4083, name: "Col du Galibier" }}
  onWarning={(warning) => console.log('Alerte vent:', warning)}
  variant="compact"
/>
```

### WindForecast

Composant de prévision qui affiche un graphique des conditions de vent à venir.

#### Propriétés

```typescript
interface WindForecastProps {
  location: GeoLocation;          // Coordonnées géographiques
  colId?: string;                 // ID du col (optionnel)
  days?: number;                  // Nombre de jours (défaut: 3)
  initialView?: 'hourly' | 'daily'; // Vue initiale
  compact?: boolean;              // Affichage compact
  showAlert?: boolean;            // Afficher alertes
  onWarning?: (warning: any) => void; // Callback pour les alertes
  className?: string;             // Classe CSS
}
```

#### Exemple d'utilisation

```jsx
<WindForecast 
  location={{ lat: 44.1741, lon: 5.2783, name: "Mont Ventoux" }}
  days={3}
  initialView="hourly"
  showAlert={true}
/>
```

## Utilitaires

### wind-safety

Module utilitaire pour évaluer la sécurité des conditions de vent pour le cyclisme.

#### Fonctions principales

```typescript
// Obtenir l'échelle de Beaufort pour une vitesse de vent
getBeaufortScale(speed: number): BeaufortScale

// Obtenir les seuils d'alerte adaptés à l'expérience et au terrain
getWindThresholds(
  experience: 'beginner' | 'intermediate' | 'advanced',
  terrain: 'flat' | 'mountain_descent' | 'mountain_col' | 'exposed_road'
): { warning: number; danger: number }

// Obtenir le nom de la direction du vent
getDirectionName(degrees: number): string

// Calculer la température ressentie avec le vent
calculateWindChill(tempC: number, windSpeedKmh: number): number

// Évaluer la sécurité des conditions de vent
assessWindSafety(
  windData: WindData,
  experience: 'beginner' | 'intermediate' | 'advanced',
  terrain: 'flat' | 'mountain_descent' | 'mountain_col' | 'exposed_road'
): {
  safetyLevel: 'safe' | 'caution' | 'warning' | 'danger';
  recommendation: string;
  beaufort: BeaufortScale;
  // etc.
}
```

## Exemples d'utilisation

### Récupération des données de vent

```typescript
import EnhancedWeatherService from '../services/weather/enhanced-weather-service';

const weatherService = new EnhancedWeatherService();

// Obtenir les données de vent pour une position
async function getWindData() {
  const ventoux = { 
    lat: 44.1741, 
    lon: 5.2783,
    name: "Mont Ventoux" 
  };
  
  try {
    // Données actuelles
    const windData = await weatherService.getDetailedWindData(ventoux);
    console.log('Vent actuel:', windData);
    
    // Prévisions sur 3 jours
    const forecast = await weatherService.getWindForecast(ventoux, 3);
    console.log('Prévisions:', forecast);
    
    // Recommandation de sécurité pour un cycliste intermédiaire en montagne
    const safety = await weatherService.getWindSafetyRecommendation(
      ventoux, 
      'intermediate',
      'mountain_col'
    );
    console.log('Recommandation:', safety);
  } catch (error) {
    console.error('Erreur:', error);
  }
}
```

### Intégration des alertes

```typescript
// Abonnement aux alertes de vent
const unregister = weatherService.registerWindWarningCallback((warning) => {
  console.log(`⚠️ ALERTE VENT: ${warning.message}`);
  // Déclencher une notification, etc.
});

// Ne pas oublier de se désabonner à la destruction du composant
useEffect(() => {
  return () => {
    unregister();
  };
}, []);
```

## Tests

Un composant de test est disponible pour vérifier l'intégration de l'API Windy :

```jsx
import WindyApiTest from '../components/weather/WindyApiTest';

// Dans un composant parent ou une route
<WindyApiTest />
```

Ce composant permet de :
- Tester les appels API
- Visualiser les données de vent
- Afficher les prévisions
- Tester les recommandations de sécurité
- Simuler des alertes

## Quotas et optimisations

L'API Windy impose des limites d'utilisation qu'il est important de respecter :

- **Quota quotidien** : 1000 requêtes
- **Quota horaire** : 60 requêtes

### Stratégies d'optimisation

1. **Cache** : Toutes les données sont mises en cache (TTL par défaut : 30 minutes)
2. **Rate Limiting** : Un mécanisme de limitation de débit est en place
3. **Priorité des requêtes** : Les informations critiques sont priorisées
4. **Agrégation** : Les prévisions sont agrégées pour minimiser les appels API

### Fallback

En cas d'indisponibilité de l'API Windy, le système basculera automatiquement vers OpenWeather pour les données de base.

---

## Notes pour les développeurs

1. Pour les intégrations front-end, privilégiez les composants `WindAlert` et `WindForecast`.
2. Pour les intégrations back-end ou les calculs, utilisez le `EnhancedWeatherService`.
3. Ne modifiez pas les seuils d'alerte sans tests approfondis avec des cyclistes.
4. Consultez le fichier `wind-safety.ts` pour comprendre les seuils de sécurité appliqués.

## Références

- [Documentation API Windy](https://api.windy.com/point-forecast/docs)
- [Échelle de Beaufort](https://fr.wikipedia.org/wiki/%C3%89chelle_de_Beaufort)
- [Formule de refroidissement éolien](https://fr.wikipedia.org/wiki/Refroidissement_%C3%A9olien)
