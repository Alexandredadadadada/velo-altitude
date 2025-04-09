# Velo-Altitude Environment Variables

Ce document fournit une guide des variables d'environnement utilisées dans l'application Velo-Altitude, avec priorisation des APIs et configuration des mécanismes de fallback.

## Catégories de Configuration

- [Services Critiques (Priority 1)](#services-critiques-priority-1)
- [Services d'Intelligence Artificielle (Priority 2)](#services-dintelligence-artificielle-priority-2) 
- [Configuration de Base de Données](#database-configuration)
- [Configuration Redis](#redis-configuration)
- [Configuration Auth0](#auth0-configuration)
- [Paramètres d'Application](#application-settings)

## Services Critiques (Priority 1)

### Services Météo

#### `OPENWEATHER_API_KEY`
- **Description**: Clé API pour le service OpenWeather (service principal)
- **Priorité**: Critique (Priority 1)
- **Required**: Oui
- **Usage**: 
  - Rate limit: 60 requêtes/heure
  - Cache: 30 minutes
  - Implémentation: `enhanced-weather-service.ts`

#### `WINDY_PLUGINS_API`
- **Description**: Clé API pour Windy (service de fallback)
- **Priorité**: Critique (Priority 1, Fallback)
- **Required**: Recommandé pour la robustesse
- **Usage**:
  - Déclencheur: Échec d'OpenWeather ou limite de taux atteinte
  - Cache: 1 heure
  - Implémentation: `windy-service.ts`

### Services Cartographie

#### `MAPBOX_TOKEN`
- **Description**: Token pour les services MapBox
- **Priorité**: Critique (Priority 1)
- **Required**: Oui
- **Usage**:
  - Cartes interactives, profils d'élévation
  - Cache basé sur les tuiles
  - Implémentation: `map-service.ts`

### Services Routage et Élévation

#### `OPENROUTE_API_KEY`
- **Description**: Clé API pour le service OpenRoute
- **Priorité**: Critique (Priority 1)
- **Required**: Oui
- **Usage**:
  - Cache: 24 heures
  - Implémentation: `elevation-service.ts`

### Intégration Strava

#### `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `STRAVA_ACCESS_TOKEN`, `STRAVA_REFRESH_TOKEN`
- **Description**: Paramètres pour l'intégration Strava
- **Priorité**: Importante (Priority 1)
- **Required**: Pour intégration Strava uniquement

## Services d'Intelligence Artificielle (Priority 2)

#### `CLAUDE_API_KEY`
- **Description**: Clé API pour Claude AI (service principal)
- **Priorité**: Importante (Priority 2)
- **Usage**:
  - Recommandations d'entraînement, conseils nutritionnels
  - Suggestions d'équipement, chat interactif
  - Implémentation: `ai-service.ts`

#### `OPENAI_API_KEY`
- **Description**: Clé API pour OpenAI (service de fallback)
- **Priorité**: Importante (Priority 2, Fallback)
- **Usage**:
  - Déclencheur: Indisponibilité de Claude
  - Implémentation: `ai-service.ts`

## Configuration de Base de Données

### `MONGODB_URI`
- **Description**: URI de connexion pour la base de données MongoDB
- **Required**: Oui, pour toutes les opérations de base de données
- **Format**: Chaîne
- **Exemple**: `mongodb+srv://username:password@cluster.mongodb.net/dbname`

### `MONGODB_DB_NAME`
- **Description**: Nom de la base de données MongoDB à utiliser
- **Required**: Oui, pour toutes les opérations de base de données
- **Format**: Chaîne
- **Exemple**: `velo-altitude-production`

## Configuration Redis

### `REDIS_URL`
- **Description**: URL pour la connexion Redis, y compris le port
- **Required**: Pour le caching et la limitation de débit
- **Format**: Chaîne
- **Exemple**: `redis://redis-hostname:6379`

### `REDIS_PASSWORD`
- **Description**: Mot de passe pour la connexion Redis
- **Required**: Pour les instances Redis sécurisées
- **Format**: Chaîne

## Configuration Auth0

### `AUTH0_AUDIENCE`
- **Description**: Identifiant de l'audience API pour Auth0
- **Required**: Oui, pour l'authentification
- **Format**: Chaîne
- **Exemple**: `https://api.velo-altitude.com`

### `AUTH0_BASE_URL`
- **Description**: URL de base de l'application (pour les rappels)
- **Required**: Oui, pour l'authentification
- **Format**: Chaîne
- **Exemple**: `https://velo-altitude.com`

### `AUTH0_CLIENT_ID`
- **Description**: ID client à partir des paramètres de l'application Auth0
- **Required**: Oui, pour l'authentification
- **Format**: Chaîne

### `AUTH0_CLIENT_SECRET`
- **Description**: Secret client à partir des paramètres de l'application Auth0
- **Required**: Oui, pour l'authentification
- **Format**: Chaîne

### `AUTH0_ISSUER_BASE_URL`
- **Description**: URL de base du domaine Auth0
- **Required**: Oui, pour l'authentification
- **Format**: Chaîne
- **Exemple**: `https://velo-altitude.auth0.com`

### `AUTH0_SCOPE`
- **Description**: Étendues demandées pour les jetons Auth0
- **Required**: Oui, pour l'authentification
- **Format**: Chaîne
- **Exemple**: `openid profile email offline_access`

### `AUTH0_SECRET`
- **Description**: Secret utilisé pour chiffrer les cookies de session
- **Required**: Oui, pour l'authentification
- **Format**: Chaîne, au moins 32 caractères
- **Exemple**: Générez une chaîne aléatoire forte

## Paramètres d'Application

### `NODE_ENV`
- **Description**: Environnement de l'application
- **Required**: Oui
- **Format**: Chaîne
- **Valeurs autorisées**: `development`, `production`, `test`
- **Défaut**: `development`

### `SESSION_SECRET`
- **Description**: Secret utilisé pour la signature des cookies de session
- **Required**: Oui, pour la sécurité
- **Format**: Chaîne (aléatoire, haute entropie)

### `API_KEYS_ENCRYPTION_KEY`
- **Description**: Clé utilisée pour chiffrer les clés API sensibles dans la base de données
- **Required**: Oui, pour le stockage sécurisé des clés
- **Format**: Chaîne (32 caractères pour AES-256)

## Configuration Netlify Recommandée

### Services Critiques (Priority 1)
Toutes ces variables doivent être marquées "Contains secret values":

```
# Services Critiques (Priority 1)
OPENWEATHER_API_KEY:
  scopes: [builds, functions, runtime]
  contexts: [production, preview, branch-deploy]

MAPBOX_TOKEN:
  scopes: [builds, functions, runtime]
  contexts: [production, preview, branch-deploy]

OPENROUTE_API_KEY:
  scopes: [builds, functions, runtime]
  contexts: [production, preview, branch-deploy]

WINDY_PLUGINS_API:
  scopes: [builds, functions, runtime]
  contexts: [production, preview, branch-deploy]
```

### Services d'Intelligence Artificielle (Priority 2)
```
# Services IA (Priority 2)
CLAUDE_API_KEY:
  scopes: [builds, functions, runtime]
  contexts: [production, preview]

OPENAI_API_KEY:
  scopes: [builds, functions, runtime]
  contexts: [production, preview]
```

## Meilleures Pratiques pour les Variables d'Environnement

1. **Ne jamais stocker de secrets dans le contrôle de version**
2. **Prioritiser les services**: Assurez-vous que les services Priority 1 sont toujours configurés
3. **Tester les fallbacks**: Validez que les transitions vers les services de secours fonctionnent
4. **Faire tourner les secrets régulièrement**: Actualisez périodiquement les clés API
5. **Alertes de rate limiting**: Configurez des alertes à 80% des quotas API

## Variables Requises par Environnement

### Variables Minimales pour Netlify Production
```
# Priority 1 - Core Services
OPENWEATHER_API_KEY
MAPBOX_TOKEN
OPENROUTE_API_KEY
WINDY_PLUGINS_API  # Recommandé pour fallback
MONGODB_URI
REDIS_URL
REDIS_PASSWORD
AUTH0_* (toutes les variables Auth0)
SESSION_SECRET

# Priority 2 - AI Services (recommandé)
CLAUDE_API_KEY
OPENAI_API_KEY
```
