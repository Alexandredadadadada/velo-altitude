# Documentation API Dashboard-Velo

Cette documentation décrit les endpoints API disponibles pour le tableau de bord de Dashboard-Velo, incluant les nouveaux paramètres de filtrage géographique.

## Base URL

```
/api/dashboard
```

## Authentification

Toutes les requêtes API nécessitent une authentification via un token JWT.

```
Authorization: Bearer <token>
```

## Paramètres de filtrage géographique

Les endpoints suivants acceptent des paramètres de filtrage par pays et région :

| Paramètre | Description | Valeurs possibles |
|-----------|-------------|-------------------|
| `country` | Code du pays à filtrer | `all` (défaut), `fr`, `de`, `it`, `es`, `be`, `nl`, `ch`, `at`, `gb`, `ie`, `dk`, `se`, `no`, `fi`, `pt`, `pl`, `cz`, `sk`, `hu`, etc. |
| `region` | Région européenne à filtrer | `all` (défaut), `western`, `eastern`, `northern`, `southern`, `central` |

**Note** : Si `country` et `region` sont spécifiés simultanément, le paramètre `country` a priorité.

## Endpoints

### GET /status

Retourne l'état actuel du système, incluant le statut des API, des quotas et du cache.

**Paramètres** :
- `country` (optionnel) : Filtre les données par pays
- `region` (optionnel) : Filtre les données par région

**Exemple de requête** :
```
GET /api/dashboard/status?country=fr
```

**Exemple de réponse** :
```json
{
  "api": {
    "status": "ok"
  },
  "quota": {
    "status": "ok",
    "daily": {
      "used": 1250,
      "limit": 5000
    },
    "hourly": {
      "used": 120,
      "limit": 500
    }
  },
  "cache": {
    "status": "ok",
    "hitRate": 0.75,
    "size": 1024
  },
  "circuitBreaker": {
    "status": "closed"
  },
  "metrics": {
    "totalRequests": 1500,
    "successfulRequests": 1450,
    "avgResponseTime": 235,
    "responseTimeSamples": 1500
  },
  "queue": {
    "highPriority": 5,
    "normalPriority": 12,
    "lowPriority": 3
  }
}
```

### GET /analytics

Retourne des données d'analytique pour la période spécifiée.

**Paramètres** :
- `period` (optionnel) : Nombre de jours à analyser (défaut: 30)
- `country` (optionnel) : Filtre les données par pays
- `region` (optionnel) : Filtre les données par région

**Exemple de requête** :
```
GET /api/dashboard/analytics?period=14&region=western
```

**Exemple de réponse** :
```json
{
  "dailyUsage": [
    { "date": "2025-03-22", "count": 1250 },
    { "date": "2025-03-23", "count": 1300 }
    // ...
  ],
  "dailyLimit": 5000,
  "topEndpoints": [
    { "endpoint": "/route", "count": 3500 },
    { "endpoint": "/elevation", "count": 1200 }
    // ...
  ],
  "hourlyDistribution": [0, 5, 10, 15, 20, 30, 45, 120, 250, 350, 400, 450, 500, 480, 450, 420, 380, 350, 300, 250, 180, 120, 80, 20],
  "responseTimeTrend": [
    { "date": "2025-03-22", "avgTime": 230 },
    { "date": "2025-03-23", "avgTime": 235 }
    // ...
  ],
  "countryDistribution": [
    { "country": "fr", "count": 5000 },
    { "country": "be", "count": 2500 }
    // ...
  ]
}
```

### GET /real-time

Retourne des données en temps réel sur l'activité du système.

**Paramètres** :
- `country` (optionnel) : Filtre les données par pays
- `region` (optionnel) : Filtre les données par région

**Exemple de requête** :
```
GET /api/dashboard/real-time?country=de
```

**Exemple de réponse** :
```json
{
  "recentActivity": [
    {
      "timestamp": "2025-04-05T01:04:15.123Z",
      "endpoint": "/route",
      "status": "success",
      "responseTime": 235,
      "country": "de"
    }
    // ...
  ],
  "recentErrors": [
    {
      "timestamp": "2025-04-05T01:02:10.456Z",
      "type": "quota_exceeded",
      "message": "Limite de quota horaire atteinte",
      "endpoint": "/elevation",
      "country": "de"
    }
    // ...
  ]
}
```

### GET /recommendations

Retourne des recommandations pour optimiser l'utilisation des API.

**Paramètres** :
- `country` (optionnel) : Filtre les recommandations par pays
- `region` (optionnel) : Filtre les recommandations par région

**Exemple de requête** :
```
GET /api/dashboard/recommendations?region=northern
```

**Exemple de réponse** :
```json
{
  "insights": [
    {
      "title": "Optimisation du cache",
      "description": "Augmenter la durée du cache pour les itinéraires populaires en Scandinavie pourrait réduire la charge API de 25%.",
      "severity": "warning"
    },
    {
      "title": "Pic d'utilisation",
      "description": "Un pic d'utilisation est observé entre 17h et 19h dans les pays nordiques. Envisagez d'ajuster les limites de quota pour cette période.",
      "severity": "info"
    }
    // ...
  ]
}
```

### GET /predictions

Retourne des prédictions d'utilisation future basées sur les données historiques.

**Paramètres** :
- `country` (optionnel) : Filtre les prédictions par pays
- `region` (optionnel) : Filtre les prédictions par région

**Exemple de requête** :
```
GET /api/dashboard/predictions?country=es
```

**Exemple de réponse** :
```json
{
  "historical": [
    { "date": "2025-03-29", "count": 1250 },
    { "date": "2025-03-30", "count": 1300 }
    // ...
  ],
  "predictions": [
    {
      "date": "2025-04-06",
      "prediction": 1350,
      "confidence": 100,
      "limit": 5000
    },
    {
      "date": "2025-04-07",
      "prediction": 1400,
      "confidence": 120,
      "limit": 5000
    }
    // ...
  ],
  "dailyLimit": 5000
}
```

### GET /risk-assessment

Retourne une évaluation des risques pour une date spécifique.

**Paramètres** :
- `date` (requis) : Date pour l'évaluation des risques (format YYYY-MM-DD)
- `country` (optionnel) : Filtre l'évaluation par pays
- `region` (optionnel) : Filtre l'évaluation par région

**Exemple de requête** :
```
GET /api/dashboard/risk-assessment?date=2025-04-10&region=southern
```

**Exemple de réponse** :
```json
{
  "predictedUsage": 3800,
  "limit": 5000,
  "confidence": 350,
  "recommendations": [
    {
      "title": "Risque modéré",
      "description": "L'utilisation prévue atteindra 76% de la limite quotidienne. Envisagez d'optimiser les requêtes les plus fréquentes.",
      "severity": "warning"
    }
    // ...
  ]
}
```

### GET /monitoring/metrics

Retourne les métriques détaillées du système de monitoring, incluant les métriques système, de performance et d'utilisation des quotas.

**Paramètres** :
- `country` (optionnel) : Filtre les métriques par pays
- `region` (optionnel) : Filtre les métriques par région

**Exemple de requête** :
```
GET /api/dashboard/monitoring/metrics?region=central
```

**Exemple de réponse** :
```json
{
  "timestamp": "2025-04-05T01:15:30.123Z",
  "metrics": {
    "system": {
      "cpu": 45,
      "memory": {
        "used": 1024000000,
        "total": 4096000000,
        "percentage": 25
      },
      "uptime": 86400
    },
    "requests": {
      "total": 15000,
      "success": 14850,
      "error": 150,
      "byEndpoint": {
        "/route": {
          "total": 8000,
          "success": 7950,
          "error": 50
        },
        "/elevation": {
          "total": 4000,
          "success": 3950,
          "error": 50
        }
      },
      "byCountry": {
        "de": {
          "total": 5000,
          "success": 4950,
          "error": 50
        },
        "at": {
          "total": 2500,
          "success": 2475,
          "error": 25
        },
        "ch": {
          "total": 1500,
          "success": 1485,
          "error": 15
        }
      },
      "byRegion": {
        "central": {
          "total": 9000,
          "success": 8910,
          "error": 90
        }
      }
    },
    "performance": {
      "responseTime": {
        "avg": 235,
        "min": 50,
        "max": 1200,
        "samples": 15000
      },
      "byEndpoint": {
        "/route": {
          "avg": 250,
          "min": 80,
          "max": 1200,
          "samples": 8000
        },
        "/elevation": {
          "avg": 180,
          "min": 50,
          "max": 800,
          "samples": 4000
        }
      },
      "byCountry": {
        "de": {
          "avg": 220,
          "min": 60,
          "max": 1000,
          "samples": 5000
        },
        "at": {
          "avg": 210,
          "min": 55,
          "max": 950,
          "samples": 2500
        },
        "ch": {
          "avg": 200,
          "min": 50,
          "max": 900,
          "samples": 1500
        }
      }
    },
    "quotas": {
      "daily": {
        "used": 15000,
        "limit": 50000,
        "percentage": 30
      },
      "hourly": {
        "used": 1200,
        "limit": 5000,
        "percentage": 24
      },
      "byCountry": {
        "de": {
          "used": 5000,
          "percentage": 10
        },
        "at": {
          "used": 2500,
          "percentage": 5
        },
        "ch": {
          "used": 1500,
          "percentage": 3
        }
      },
      "byRegion": {
        "central": {
          "used": 9000,
          "percentage": 18
        }
      }
    }
  }
}
```

### GET /monitoring/alerts

Retourne les alertes actives du système de monitoring.

**Paramètres** :
- `country` (optionnel) : Filtre les alertes par pays
- `region` (optionnel) : Filtre les alertes par région
- `severity` (optionnel) : Filtre les alertes par niveau de sévérité (`info`, `warning`, `error`, `critical`)
- `type` (optionnel) : Filtre les alertes par type (`system`, `quota`, `error`)

**Exemple de requête** :
```
GET /api/dashboard/monitoring/alerts?severity=warning&region=southern
```

**Exemple de réponse** :
```json
{
  "timestamp": "2025-04-05T01:15:30.123Z",
  "alerts": [
    {
      "type": "quota",
      "severity": "warning",
      "message": "Utilisation élevée du quota pour la région southern: 85%",
      "region": "southern",
      "timestamp": "2025-04-05T01:10:15.456Z"
    },
    {
      "type": "error",
      "severity": "warning",
      "message": "Taux d'erreur élevé pour l'Italie: 4.5%",
      "country": "it",
      "timestamp": "2025-04-05T01:12:30.789Z"
    }
  ]
}
```

### POST /reset-limits

Réinitialise les limites de quota (nécessite des droits d'administration).

**Exemple de requête** :
```
POST /api/dashboard/reset-limits
```

**Exemple de réponse** :
```json
{
  "success": true,
  "message": "Limites réinitialisées avec succès"
}
```

### POST /clear-cache

Vide le cache d'itinéraires (nécessite des droits d'administration).

**Exemple de requête** :
```
POST /api/dashboard/clear-cache
```

**Exemple de réponse** :
```json
{
  "success": true,
  "message": "Cache vidé avec succès"
}
```

## Codes de pays et régions

### Codes de pays

| Code | Pays |
|------|------|
| `fr` | France |
| `de` | Allemagne |
| `it` | Italie |
| `es` | Espagne |
| `be` | Belgique |
| `nl` | Pays-Bas |
| `ch` | Suisse |
| `at` | Autriche |
| `gb` | Royaume-Uni |
| `ie` | Irlande |
| `dk` | Danemark |
| `se` | Suède |
| `no` | Norvège |
| `fi` | Finlande |
| `pt` | Portugal |
| `pl` | Pologne |
| `cz` | République tchèque |
| `sk` | Slovaquie |
| `hu` | Hongrie |
| `ro` | Roumanie |
| `bg` | Bulgarie |
| `gr` | Grèce |
| `hr` | Croatie |
| `si` | Slovénie |
| `ee` | Estonie |
| `lv` | Lettonie |
| `lt` | Lituanie |
| `lu` | Luxembourg |

### Régions européennes

| Code | Région | Pays inclus |
|------|--------|-------------|
| `western` | Europe occidentale | France, Belgique, Pays-Bas, Luxembourg |
| `eastern` | Europe orientale | Pologne, République tchèque, Slovaquie, Hongrie, Roumanie, Bulgarie |
| `northern` | Europe du Nord | Danemark, Suède, Norvège, Finlande, Estonie, Lettonie, Lituanie |
| `southern` | Europe du Sud | Espagne, Portugal, Italie, Grèce, Croatie, Slovénie |
| `central` | Europe centrale | Allemagne, Autriche, Suisse |

## Bonnes pratiques

### Optimisation des requêtes

Pour optimiser l'utilisation des API et éviter les dépassements de quota, suivez ces bonnes pratiques :

1. **Utilisez les filtres géographiques** : Limitez vos requêtes aux pays ou régions qui vous intéressent.
2. **Mettez en cache les résultats** : Les données ne changent pas fréquemment, utilisez un cache côté client.
3. **Regroupez les requêtes** : Utilisez les endpoints qui retournent plusieurs types de données plutôt que de faire plusieurs requêtes.
4. **Évitez les pics d'utilisation** : Répartissez vos requêtes dans le temps pour éviter les pics.

### Gestion des erreurs

En cas d'erreur, l'API retourne un code d'erreur HTTP approprié et un message d'erreur dans le corps de la réponse :

```json
{
  "error": {
    "code": "quota_exceeded",
    "message": "Limite de quota journalière atteinte",
    "details": {
      "limit": 5000,
      "used": 5000,
      "resetTime": "2025-04-06T00:00:00.000Z"
    }
  }
}
```

## Changements récents

### Version 2.0.0 (Avril 2025)

- Ajout des paramètres de filtrage géographique (`country` et `region`)
- Ajout des endpoints de monitoring (`/monitoring/metrics` et `/monitoring/alerts`)
- Ajout de la distribution par pays dans les réponses d'analytique
- Optimisation des performances pour les requêtes avec filtres géographiques
