# Documentation du Gestionnaire d'API Centralisé - Grand Est Cyclisme

Cette documentation détaille l'utilisation du gestionnaire d'API centralisé pour le projet Grand Est Cyclisme étendu à l'Europe.

## Table des matières

1. [Introduction](#introduction)
2. [Architecture du système](#architecture)
3. [Services disponibles](#services)
4. [Utilisation de l'API](#utilisation)
5. [Fonctionnalités avancées](#fonctionnalites)
6. [Configuration régionale pour l'Europe](#regions)
7. [Exemples d'utilisation](#exemples)

<a name="introduction"></a>
## 1. Introduction

Le gestionnaire d'API centralisé fournit une interface unifiée pour toutes les API externes utilisées dans l'application Grand Est Cyclisme. Il implémente des mécanismes avancés de retry, fallback, mise en cache et gestion de limites de taux pour assurer une expérience utilisateur fluide même en cas de problèmes avec les API externes.

<a name="architecture"></a>
## 2. Architecture du système

Le système est organisé en couches :

```
┌──────────────────┐
│  API Controllers │
└────────┬─────────┘
         │
┌────────▼─────────┐
│  API Manager     │◄────┐
└────────┬─────────┘     │
         │               │
┌────────▼─────────┐     │
│ Service Adapters │     │
└────────┬─────────┘     │
         │               │
┌────────▼─────────┐     │
│ External APIs    │     │
└──────────────────┘     │
         │               │
┌────────▼─────────┐     │
│  Cache System    ├─────┘
└──────────────────┘
```

<a name="services"></a>
## 3. Services disponibles

Le gestionnaire d'API intègre les services suivants :

| Service | Description | Couverture |
|---------|-------------|------------|
| `weather` | Données météo via OpenWeatherMap | Europe complète |
| `openroute` | Calcul d'itinéraires via OpenRouteService | Europe complète |
| `strava` | Intégration avec Strava | Mondial |
| `mapbox` | Cartes et géocodage via Mapbox | Mondial |

<a name="utilisation"></a>
## 4. Utilisation de l'API

### 4.1. Interface principale

Le gestionnaire d'API s'utilise via la méthode `execute` :

```javascript
const apiManager = require('../services/api-manager.service');

// Exemple d'utilisation
const result = await apiManager.execute(
  'weather',               // nom du service
  'fetchCurrentWeather',   // endpoint/méthode
  { lat: 48.5734, lon: 7.7521 }, // paramètres
  { cacheTTL: 300 }        // options
);
```

### 4.2. Options disponibles

Les options suivantes peuvent être utilisées avec la méthode `execute` :

| Option | Type | Description |
|--------|------|-------------|
| `cacheTTL` | Number | Durée de vie en cache (secondes) |
| `bypassCache` | Boolean | Ignore le cache existant |
| `region` | String | Force une région spécifique |
| `alternativeService` | Object | Service alternatif pour fallback |
| `staticFallback` | Object | Données statiques pour fallback |

<a name="fonctionnalites"></a>
## 5. Fonctionnalités avancées

### 5.1. Système de retry intelligent

Le gestionnaire implémente un système de retry avec backoff exponentiel :

- Intervalle entre les tentatives augmente progressivement
- Configuration par service (tentatives max, délais)
- Journalisation détaillée des retries

### 5.2. Stratégies de fallback

En cas d'échec après tous les retries, différentes stratégies sont disponibles :

- `cache` : Utilise les données en cache même expirées
- `alternative` : Bascule vers un service alternatif
- `static` : Utilise des données statiques prédéfinies
- `error` : Renvoie une erreur (dernier recours)

### 5.3. Gestion des clés API

Le gestionnaire utilise un système avancé de gestion des clés API :

- Rotation automatique des clés
- Détection des clés problématiques
- Période de refroidissement pour les clés ayant rencontré des erreurs
- Support multi-clés avec priorisation régionale

### 5.4. Limites de taux (Rate Limiting)

Prévention proactive des erreurs de rate limiting :

- Comptabilisation des requêtes par service et par intervalle
- Stratégies adaptatives selon les limites des fournisseurs
- Fallback automatique quand les limites sont approchées

<a name="regions"></a>
## 6. Configuration régionale pour l'Europe

Le système détecte automatiquement la région européenne basée sur les coordonnées :

| Code de région | Zone | Pays principaux |
|---------------|------|-----------------|
| `western-europe` | Europe de l'Ouest | FR, BE, NL, LU, UK, IE, PT, ES |
| `central-europe` | Europe centrale | DE, CH, AT, CZ, PL, SK, HU |
| `eastern-europe` | Europe de l'Est | RO, BG, UA, MD, BY, EE, LV, LT |
| `northern-europe` | Europe du Nord | DK, NO, SE, FI, IS |
| `southern-europe` | Europe du Sud | IT, GR, HR, SI, RS, BA, ME, MK, AL |

Les paramètres sont automatiquement adaptés selon la région (unités, langue, etc.)

<a name="exemples"></a>
## 7. Exemples d'utilisation

### 7.1. Récupération de données météo

```javascript
// Récupération de la météo actuelle
const currentWeather = await apiManager.execute(
  'weather',
  'fetchCurrentWeather',
  { lat: 48.5734, lon: 7.7521 }
);

// Récupération des prévisions
const forecast = await apiManager.execute(
  'weather',
  'fetchForecast',
  { lat: 48.5734, lon: 7.7521, days: 5 }
);
```

### 7.2. Calcul d'itinéraire cyclable

```javascript
// Calcul d'un itinéraire entre deux points
const route = await apiManager.execute(
  'openroute',
  'fetchRoute',
  { 
    start: [7.7521, 48.5734], // [lon, lat] pour Strasbourg
    end: [6.1744, 48.6939],   // [lon, lat] pour Nancy
    waypoints: [] 
  }
);
```

### 7.3. Intégration avec Strava

```javascript
// Récupération des activités récentes
const activities = await apiManager.execute(
  'strava',
  'fetchActivities',
  { 
    accessToken: 'user-access-token',
    page: 1,
    perPage: 10
  }
);
```

### 7.4. Gestion des erreurs

```javascript
try {
  const result = await apiManager.execute('weather', 'fetchCurrentWeather', params);
  // Traitement du résultat...
} catch (error) {
  if (error.fromFallback) {
    console.warn(`Données obtenues via fallback: ${error.fallbackType}`);
    // Traitement des données de fallback...
  } else {
    console.error(`Erreur critique: ${error.message}`);
    // Gestion de l'erreur...
  }
}
```
