# Documentation de l'API - Dashboard-Velo

## Introduction

Cette documentation décrit les endpoints API utilisés par le Dashboard-Velo. Elle est destinée aux développeurs qui souhaitent comprendre, maintenir ou étendre les fonctionnalités du dashboard.

## Structure générale

Toutes les requêtes API doivent inclure un token JWT valide dans l'en-tête HTTP `Authorization`, à l'exception des endpoints d'authentification.

```
Authorization: Bearer <token_jwt>
```

## Authentification

### POST /api/auth/login

Authentifie un utilisateur et renvoie un token JWT.

**Requête:**
```json
{
  "email": "utilisateur@exemple.com",
  "password": "mot_de_passe"
}
```

**Réponse:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "5f8d43e1e7179a0b9456b633",
    "email": "utilisateur@exemple.com",
    "firstName": "Prénom",
    "lastName": "Nom",
    "role": "user"
  }
}
```

### POST /api/auth/register

Crée un nouveau compte utilisateur.

**Requête:**
```json
{
  "email": "nouveau@exemple.com",
  "password": "mot_de_passe",
  "firstName": "Prénom",
  "lastName": "Nom"
}
```

**Réponse:**
```json
{
  "message": "Compte créé avec succès",
  "user": {
    "id": "5f8d43e1e7179a0b9456b633",
    "email": "nouveau@exemple.com",
    "firstName": "Prénom",
    "lastName": "Nom",
    "role": "user"
  }
}
```

### POST /api/auth/refresh-token

Renouvelle un token JWT expiré à l'aide du refresh token.

**Requête:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Réponse:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Routes

### GET /api/routes

Récupère la liste des itinéraires cyclistes disponibles.

**Paramètres de requête (optionnels):**
- `region` (string): Filtre par région géographique
- `difficulty` (number): Filtre par niveau de difficulté (1-5)
- `minDistance` (number): Distance minimale en km
- `maxDistance` (number): Distance maximale en km
- `minElevation` (number): Dénivelé minimal en mètres
- `maxElevation` (number): Dénivelé maximal en mètres

**Réponse:**
```json
[
  {
    "id": "5f9b3e7c1c9d440000d1b3c7",
    "name": "Route des Crêtes",
    "description": "Magnifique parcours à travers les montagnes",
    "distance": 45.7,
    "elevation_gain": 850,
    "difficulty": 4,
    "region": "Vosges",
    "image_url": "https://example.com/route1.jpg",
    "favorite_count": 24,
    "is_favorite": false,
    "author": {
      "id": "5f8d43e1e7179a0b9456b633",
      "name": "Jean Cycliste",
      "profile_image": "https://example.com/jean.jpg"
    },
    "tags": ["montagne", "scenic", "challenge"]
  },
  // Autres itinéraires...
]
```

### GET /api/routes/:id

Récupère les détails d'un itinéraire spécifique.

**Réponse:**
```json
{
  "id": "5f9b3e7c1c9d440000d1b3c7",
  "name": "Route des Crêtes",
  "description": "Magnifique parcours à travers les montagnes",
  "distance": 45.7,
  "elevation_gain": 850,
  "difficulty": 4,
  "region": "Vosges",
  "image_url": "https://example.com/route1.jpg",
  "favorite_count": 24,
  "is_favorite": false,
  "author": {
    "id": "5f8d43e1e7179a0b9456b633",
    "name": "Jean Cycliste",
    "profile_image": "https://example.com/jean.jpg"
  },
  "tags": ["montagne", "scenic", "challenge"],
  "waypoints": [
    {"lat": 48.123, "lng": 7.123, "elevation": 450},
    {"lat": 48.124, "lng": 7.125, "elevation": 500},
    // ...
  ],
  "points_of_interest": [
    {
      "name": "Col de la Schlucht",
      "description": "Col mythique des Vosges",
      "type": "col",
      "coordinates": {"lat": 48.125, "lng": 7.126}
    }
    // ...
  ],
  "services": [
    {
      "name": "Point d'eau",
      "type": "water",
      "coordinates": {"lat": 48.124, "lng": 7.124}
    }
    // ...
  ],
  "narrative": "Ce parcours commence à Munster et monte progressivement..."
}
```

### POST /api/routes

Crée un nouvel itinéraire.

**Requête:**
```json
{
  "name": "Tour du lac",
  "description": "Belle balade autour du lac",
  "distance": 30.5,
  "elevation_gain": 200,
  "difficulty": 2,
  "region": "Alsace",
  "waypoints": [
    {"lat": 48.123, "lng": 7.123, "elevation": 200},
    {"lat": 48.124, "lng": 7.125, "elevation": 210},
    // ...
  ],
  "tags": ["lac", "familial", "facile"]
}
```

**Réponse:**
```json
{
  "id": "5f9b3e7c1c9d440000d1b3c8",
  "name": "Tour du lac",
  "description": "Belle balade autour du lac",
  // Autres détails...
  "message": "Itinéraire créé avec succès"
}
```

### POST /api/routes/:id/favorite

Ajoute ou retire un itinéraire des favoris de l'utilisateur.

**Réponse:**
```json
{
  "is_favorite": true,
  "favorite_count": 25,
  "message": "Ajouté aux favoris"
}
```

## Strava

### GET /api/strava/auth/status

Vérifie si l'utilisateur est authentifié auprès de Strava.

**Réponse:**
```json
{
  "authenticated": true,
  "expires_at": 1618309050
}
```

### GET /api/strava/auth

Redirige vers la page d'authentification Strava.

### POST /api/strava/auth/exchange

Échange un code d'autorisation contre un token d'accès.

**Requête:**
```json
{
  "code": "code_d_autorisation_strava"
}
```

**Réponse:**
```json
{
  "access_token": "acc_token_123",
  "refresh_token": "ref_token_456",
  "expires_at": 1618309050
}
```

### GET /api/strava/activities

Récupère les activités de l'utilisateur depuis Strava.

**Paramètres de requête (optionnels):**
- `limit` (number): Nombre maximum d'activités à récupérer (défaut: 20)
- `page` (number): Page de résultats (défaut: 1)

**Réponse:**
```json
[
  {
    "id": "12345",
    "name": "Sortie matinale",
    "type": "Ride",
    "distance": 35000,
    "moving_time": 5400,
    "total_elevation_gain": 450,
    "start_date": "2023-06-15T08:30:00Z",
    "map": {
      "summary_polyline": "abc123..."
    }
  },
  // Autres activités...
]
```

### POST /api/strava/import/:activityId

Importe une activité Strava en tant qu'itinéraire.

**Réponse:**
```json
{
  "success": true,
  "route": {
    "id": "5f9b3e7c1c9d440000d1b3c9",
    "name": "Sortie matinale",
    "description": "Importé depuis Strava",
    // Autres détails...
  }
}
```

## Cols

### GET /api/cols

Récupère la liste des cols cyclistes.

**Paramètres de requête (optionnels):**
- `region` (string): Filtre par région ou pays
- `difficulty` (number): Filtre par niveau de difficulté (1-5)
- `min_elevation` (number): Altitude minimale en mètres
- `max_elevation` (number): Altitude maximale en mètres

**Réponse:**
```json
[
  {
    "id": "col-tourmalet",
    "name": "Col du Tourmalet",
    "location": {
      "country": "France",
      "region": "Hautes-Pyrénées",
      "coordinates": {
        "lat": 42.8722,
        "lng": 0.1775
      }
    },
    "statistics": {
      "length": 19.0,
      "elevation_gain": 1404,
      "avg_gradient": 7.4,
      "max_gradient": 10.2,
      "start_elevation": 850,
      "summit_elevation": 2115
    },
    "difficulty": 5
  },
  // Autres cols...
]
```

### GET /api/cols/:id

Récupère les détails d'un col spécifique.

**Réponse:**
```json
{
  "id": "col-tourmalet",
  "name": "Col du Tourmalet",
  "location": {
    "country": "France",
    "region": "Hautes-Pyrénées",
    "coordinates": {
      "lat": 42.8722,
      "lng": 0.1775
    }
  },
  "statistics": {
    "length": 19.0,
    "elevation_gain": 1404,
    "avg_gradient": 7.4,
    "max_gradient": 10.2,
    "start_elevation": 850,
    "summit_elevation": 2115
  },
  "elevation_profile": [
    {"distance": 0, "elevation": 850},
    {"distance": 2, "elevation": 950},
    // ...
  ],
  "history": {
    "tour_appearances": 87,
    "first_appearance": 1910,
    "notable_events": [
      "Première apparition dans le Tour de France en 1910",
      // ...
    ],
    "records": {
      "ascent": "36:46 par Bjarne Riis en 1996"
    }
  },
  "difficulty": 5,
  "recommended_season": ["juin", "juillet", "août", "septembre"],
  "images": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Col_du_Tourmalet.jpg/1200px-Col_du_Tourmalet.jpg",
    // ...
  ],
  "practical_info": {
    "parking": "Parking disponible à La Mongie et Barèges",
    "water_points": ["Fontaine à Sainte-Marie-de-Campan", "Fontaine au sommet"],
    "hazards": ["Tunnel non éclairé à 3km du sommet", "Vent fort possible au sommet"]
  }
}
```

## Entraînement et Nutrition

### GET /api/training-plans

Récupère la liste des plans d'entraînement disponibles.

**Paramètres de requête (optionnels):**
- `level` (string): Filtre par niveau (débutant, intermédiaire, avancé)
- `goal` (string): Filtre par objectif (endurance, puissance, perte de poids)
- `duration` (number): Filtre par durée en semaines

**Réponse:**
```json
[
  {
    "id": "plan-1",
    "name": "Préparation Cyclosportive",
    "objective": "endurance",
    "level": "intermédiaire",
    "duration_weeks": 8,
    "weekly_structure": [
      // Structure résumée...
    ]
  },
  // Autres plans...
]
```

### GET /api/training-plans/:id

Récupère les détails d'un plan d'entraînement spécifique.

**Réponse:** Structure complète du plan d'entraînement

### GET /api/nutrition-plans

Récupère la liste des plans nutritionnels disponibles.

**Paramètres de requête (optionnels):**
- `type` (string): Filtre par type (endurance, compétition, récupération)

**Réponse:**
```json
[
  {
    "id": "nutrition-plan-endurance",
    "name": "Plan Nutrition Endurance",
    "type": "endurance",
    "description": "Plan nutritionnel adapté aux cyclistes d'endurance"
  },
  // Autres plans...
]
```

### GET /api/nutrition-plans/:id

Récupère les détails d'un plan nutritionnel spécifique.

**Réponse:** Structure complète du plan nutritionnel

## Environnement

### GET /api/environmental/weather

Récupère les prévisions météo pour une localisation donnée.

**Paramètres de requête:**
- `lat` (number): Latitude
- `lng` (number): Longitude

**Réponse:**
```json
{
  "current": {
    "temp": 18.5,
    "feels_like": 17.8,
    "humidity": 65,
    "wind_speed": 15,
    "wind_direction": 270,
    "weather_conditions": "Partiellement nuageux",
    "icon": "partly_cloudy"
  },
  "forecast": [
    {
      "date": "2023-06-16",
      "temp_min": 15,
      "temp_max": 22,
      "precipitation_chance": 20,
      "weather_conditions": "Ensoleillé",
      "icon": "sunny"
    },
    // Prévisions pour les jours suivants...
  ]
}
```

### GET /api/environmental/air-quality

Récupère la qualité de l'air pour une localisation donnée.

**Paramètres de requête:**
- `lat` (number): Latitude
- `lng` (number): Longitude

**Réponse:**
```json
{
  "aqi": 45,
  "category": "Bon",
  "description": "La qualité de l'air est considérée comme satisfaisante",
  "components": {
    "pm2_5": 10.2,
    "pm10": 18.3,
    "o3": 68,
    "no2": 15.7,
    "so2": 2.1,
    "co": 0.4
  },
  "recommendation": "Conditions idéales pour le cyclisme"
}
```

### GET /api/environmental/route/:routeId

Récupère les conditions environnementales le long d'un itinéraire.

**Réponse:**
```json
{
  "points": [
    {
      "coordinates": {"lat": 48.123, "lng": 7.123},
      "weather": {
        "temp": 18.5,
        "wind_speed": 15,
        "wind_direction": 270,
        "weather_conditions": "Partiellement nuageux"
      },
      "airQuality": {
        "aqi": 45,
        "category": "Bon"
      }
    },
    // Autres points...
  ],
  "route_analysis": {
    "challenging_sections": [
      {
        "start_idx": 5,
        "end_idx": 8,
        "reason": "Vents latéraux forts",
        "severity": "modérée"
      }
    ],
    "recommendation": "Conditions généralement favorables, attention aux vents latéraux entre les km 10 et 15"
  }
}
```

## Gestion des erreurs

Les erreurs sont renvoyées au format suivant :

```json
{
  "error": true,
  "message": "Description de l'erreur",
  "status": 400,
  "details": {
    // Détails spécifiques à l'erreur, si disponibles
  }
}
```

Les codes d'état HTTP standard sont utilisés :
- 200: Succès
- 201: Ressource créée
- 400: Requête invalide
- 401: Non authentifié
- 403: Non autorisé
- 404: Ressource non trouvée
- 500: Erreur serveur

## Limites de taux

Pour prévenir les abus, l'API impose des limites de taux :
- 100 requêtes par minute par utilisateur authentifié
- 30 requêtes par minute pour les requêtes non authentifiées

Les en-têtes suivants sont inclus dans chaque réponse :
- `X-RateLimit-Limit`: Nombre total de requêtes autorisées par minute
- `X-RateLimit-Remaining`: Nombre de requêtes restantes dans la fenêtre actuelle
- `X-RateLimit-Reset`: Temps (en secondes Unix) avant la réinitialisation du compteur
