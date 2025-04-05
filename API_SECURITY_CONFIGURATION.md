# Guide de sécurité des API - Velo-Altitude

**Date :** 5 avril 2025  
**Version :** 1.0.0

## Aperçu

Ce document décrit les meilleures pratiques de sécurité mises en œuvre pour protéger les clés API et autres données sensibles dans l'application Velo-Altitude.

## Configuration des API

### 1. Variables d'environnement Netlify

Toutes les clés API et secrets sont stockés en tant que variables d'environnement dans Netlify avec l'option "Contains secret values" activée pour les valeurs sensibles. Cette approche garantit que les secrets ne sont jamais exposés publiquement.

### 2. API intégrées

#### Mapbox (Cartographie)
- **Variable :** `MAPBOX_TOKEN`
- **Utilisation :** Affichage des cartes interactives, visualisation des cols et itinéraires
- **Restriction :** Configuré pour limiter les domaines autorisés à votre domaine Netlify

#### OpenWeatherMap (Données météo)
- **Variable :** `OPENWEATHER_API_KEY`
- **Utilisation :** Prévisions météo pour les itinéraires et cols
- **Rotation :** Plan de rotation des clés tous les 3 mois

#### OpenRouteService (Calcul d'itinéraires)
- **Variable :** `OPENROUTE_API_KEY`
- **Utilisation :** Calcul d'itinéraires, alternatives et élévation
- **Quota :** Surveillance des quotas implémentée

#### Strava (Intégration sociale)
- **Variables :** 
  - `STRAVA_CLIENT_ID`
  - `STRAVA_CLIENT_SECRET`
  - `STRAVA_ACCESS_TOKEN`
  - `STRAVA_REFRESH_TOKEN`
- **Utilisation :** Partage d'activités, défis sociaux, connexion avec l'API Strava
- **Sécurité :** Tokens régénérés automatiquement via le refresh token

#### Services d'IA (Recommandations)
- **Variables :** 
  - `OPENAI_API_KEY`
  - `CLAUDE_API_KEY`
- **Utilisation :** Chatbot, recommandations personnalisées, analyse des itinéraires
- **Protection :** Limitation du nombre de requêtes par utilisateur

### 3. Chiffrement des clés

Pour une sécurité supplémentaire, nous utilisons la variable `API_KEYS_ENCRYPTION_KEY` pour chiffrer les clés API stockées dans la base de données (pour les clés spécifiques à l'utilisateur).

## Implémentation sécurisée dans le code

### Client (Frontend)

Toutes les références aux API dans le code client utilisent des variables d'environnement avec le préfixe `REACT_APP_` :

```javascript
// Bonne pratique - utilisation de variables d'environnement
const mapboxToken = process.env.REACT_APP_MAPBOX_TOKEN || '';

// Valeurs de fallback vides ou placeholder non fonctionnels
const weatherApiKey = process.env.REACT_APP_WEATHER_API_KEY || '';
```

### Serveur (Backend)

Le code serveur accède aux variables d'environnement directement :

```javascript
// Accès aux variables d'environnement côté serveur
const openRouteApiKey = process.env.OPENROUTE_API_KEY;
const stravaClientId = process.env.STRAVA_CLIENT_ID;
```

## Plan de rotation des clés

Un plan de rotation régulière des clés API a été mis en place :
- Clés de haute sécurité (Auth0, MongoDB) : Rotation tous les 2 mois
- Clés d'API externes : Rotation tous les 3-6 mois
- Clés de session : Rotation tous les mois

## Surveillance et alertes

Des mécanismes de surveillance de l'utilisation des API ont été implémentés :
- Journalisation de toutes les requêtes API
- Alertes en cas d'utilisation excessive
- Détection des modèles d'utilisation suspects

## Recommandations pour les développeurs

1. Ne jamais coder en dur les clés API ou secrets
2. Toujours utiliser les variables d'environnement
3. Pour les tests locaux, utiliser un fichier `.env` local (non commité)
4. Vérifier régulièrement les journaux d'utilisation des API
