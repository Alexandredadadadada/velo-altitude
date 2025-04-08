# Variables d'Environnement - Velo-Altitude

## Vue d'ensemble
Ce document liste et explique les variables d'environnement nécessaires au bon fonctionnement de l'application Velo-Altitude. Ces variables sont configurées sur la plateforme Netlify mais peuvent également être utilisées pour des déploiements locaux ou sur d'autres environnements.

## Importance de la Sécurité
⚠️ **AVERTISSEMENT** : Les variables d'environnement contiennent souvent des informations sensibles comme des API keys et des secrets. Ne jamais :
- Inclure ces valeurs directement dans le code source
- Partager ces valeurs dans des documents publics
- Stocker ces valeurs dans des dépôts Git non sécurisés

## Variables d'Environnement Requises

### Configuration Générale
| Variable | Description | Exemple/Format |
|----------|-------------|----------------|
| `NODE_ENV` | Environnement d'exécution | `production`, `development`, `test` |
| `REACT_APP_BASE_URL` | URL de base de l'application | `https://velo-altitude.com` |
| `REACT_APP_API_URL` | URL de l'API backend | `https://api.velo-altitude.com` |
| `REACT_APP_BRAND_NAME` | Nom de marque affiché | `Velo-Altitude` |
| `REACT_APP_VERSION` | Version de l'application | `1.0.0` |
| `REACT_APP_ENABLE_ANALYTICS` | Activer les analyses | `true` ou `false` |
| `SESSION_SECRET` | Secret pour crypter les sessions | Chaîne aléatoire (32+ caractères) |
| `API_KEYS_ENCRYPTION_KEY` | Clé pour chiffrer les API keys stockées | Chaîne aléatoire (32+ caractères) |
| `ASSET_CACHE_MAX_AGE` | Âge maximum du cache pour les assets statiques | `86400` (24h en secondes) |
| `ENABLE_BROTLI_COMPRESSION` | Activer la compression Brotli | `true` |

### Base de Données MongoDB
| Variable | Description | Exemple/Format |
|----------|-------------|----------------|
| `MONGODB_URI` | URI de connexion MongoDB | `mongodb+srv://username:password@cluster.mongodb.net/` |
| `MONGODB_DB_NAME` | Nom de la base de données | `velo-altitude-prod` |

### Auth0 Configuration
| Variable | Description | Exemple/Format |
|----------|-------------|----------------|
| `AUTH0_BASE_URL` | URL de base pour Auth0 | `https://velo-altitude.com` |
| `AUTH0_ISSUER_BASE_URL` | URL du tenant Auth0 | `https://velo-altitude.eu.auth0.com` |
| `AUTH0_CLIENT_ID` | ID client Auth0 | Obtenu depuis le dashboard Auth0 |
| `AUTH0_CLIENT_SECRET` | Secret client Auth0 | Obtenu depuis le dashboard Auth0 |
| `AUTH0_SECRET` | Secret pour crypter les cookies Auth0 | Chaîne aléatoire (32+ caractères) |
| `AUTH0_AUDIENCE` | Audience API Auth0 | `https://api.velo-altitude.com` |
| `AUTH0_SCOPE` | Scopes d'authentification | `openid profile email offline_access` |

### Intégrations API Tierces
| Variable | Description | Exemple/Format |
|----------|-------------|----------------|
| `MAPBOX_TOKEN` | Token d'accès Mapbox | Obtenu depuis le dashboard Mapbox |
| `OPENWEATHER_API_KEY` | Clé API OpenWeather | Obtenue depuis le compte OpenWeather |
| `OPENROUTE_API_KEY` | Clé API OpenRoute Service | Obtenue depuis le portail OpenRoute |
| `STRAVA_CLIENT_ID` | ID client Strava API | Obtenu depuis le dashboard Strava |
| `STRAVA_CLIENT_SECRET` | Secret client Strava API | Obtenu depuis le dashboard Strava |
| `STRAVA_ACCESS_TOKEN` | Token d'accès Strava | Généré via OAuth |
| `STRAVA_REFRESH_TOKEN` | Token de rafraîchissement Strava | Généré via OAuth |
| `WINDY_PLUGINS_API` | Clé API pour plugins Windy | Obtenue depuis la plateforme Windy |

### Services d'IA (Optionnel)
| Variable | Description | Exemple/Format |
|----------|-------------|----------------|
| `OPENAI_API_KEY` | Clé API OpenAI pour suggestions | Obtenue depuis OpenAI |
| `CLAUDE_API_KEY` | Clé API Claude pour assistants | Obtenue depuis Anthropic |

### Paramètres de Build et Déploiement
| Variable | Description | Exemple/Format |
|----------|-------------|----------------|
| `GO_IMPORT_DURING_BUILD` | Permettre l'import de packages Go pendant le build | `true` |

## Configuration par Environnement

### Production
Toutes les variables énumérées ci-dessus sont requises pour l'environnement de production.

### Staging
Même configuration que la production, mais avec:
- `NODE_ENV` = `staging`
- Utilisation de bases de données et services de test

### Développement Local
Pour le développement local, créer un fichier `.env` à la racine du projet avec:

```
NODE_ENV=development
REACT_APP_BASE_URL=http://localhost:3000
REACT_APP_API_URL=http://localhost:8000
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=velo-altitude-dev
# ... autres variables nécessaires
```

## Politique de Sécurité des Variables
Sur Netlify, une politique de sécurité des variables est configurée pour les déploiements de prévisualisation (Deploy Previews) issus de Pull Requests provenant de forks non reconnus. Ces déploiements sont considérés comme non fiables et nécessitent une approbation pour accéder aux variables sensibles.

## Rotation des Secrets

Il est recommandé de:
- Changer les secrets tous les 90 jours
- Révoquer et régénérer les secrets en cas de départ d'un membre de l'équipe
- Utiliser des secrets distincts pour chaque environnement

## Vérification de la Configuration

Avant chaque déploiement, vérifier la présence de toutes les variables requises avec le script:

```bash
node scripts/check-env-vars.js
```

## Référence des API

Pour plus d'informations sur les API utilisées:
- [Documentation Auth0](https://auth0.com/docs)
- [Documentation Mapbox](https://docs.mapbox.com)
- [Documentation OpenWeather](https://openweathermap.org/api)
- [Documentation Strava API](https://developers.strava.com)

## Support

Pour les problèmes liés aux variables d'environnement:
- **Contact**: devops@velo-altitude.com
- **Documentation interne**: [Guide Netlify](../technique/DEPLOIEMENT/NETLIFY_GUIDE.md)
