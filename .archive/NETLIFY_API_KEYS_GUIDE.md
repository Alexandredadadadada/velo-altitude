# Guide de configuration des clés API sur Netlify

Ce document explique comment configurer en toute sécurité vos clés API pour le déploiement de Velo-Altitude sur Netlify.

## Pourquoi configurer les clés API dans Netlify ?

- **Sécurité** : Les clés API ne sont pas exposées dans votre code source
- **Flexibilité** : Vous pouvez modifier les clés sans avoir à redéployer l'application
- **Conformité** : Respecte les bonnes pratiques de sécurité

## Liste des clés API à configurer

Voici les variables d'environnement à configurer dans Netlify :

| Nom de la variable | Description |
|-------------------|-------------|
| `MAPBOX_PUBLIC_TOKEN` | Token public pour l'API Mapbox (cartographie) |
| `MAPBOX_SECRET_TOKEN` | Token secret pour l'API Mapbox (opérations sécurisées) |
| `OPENWEATHER_API_KEY` | Clé API pour OpenWeatherMap (données météo) |
| `OPENROUTE_API_KEY` | Clé API pour OpenRouteService (calcul d'itinéraires) |
| `OPENAI_API_KEY` | Clé API pour OpenAI (chatbot principal) |
| `CLAUDE_API_KEY` | Clé API pour Anthropic Claude (chatbot alternatif) |
| `STRAVA_CLIENT_ID` | ID client pour l'API Strava (optionnel) |
| `STRAVA_CLIENT_SECRET` | Secret client pour l'API Strava (optionnel) |

## Instructions pas à pas

1. **Accédez à votre site sur Netlify** : Connectez-vous à [app.netlify.com](https://app.netlify.com/)

2. **Allez dans les paramètres du site** :
   - Cliquez sur votre site "velo-altitude"
   - Dans le menu, cliquez sur "Site settings" (Paramètres du site)

3. **Configurez les variables d'environnement** :
   - Dans le menu de gauche, cliquez sur "Environment variables" (Variables d'environnement)
   - Cliquez sur "Add variable" (Ajouter une variable)
   - Ajoutez chaque clé API en utilisant le format suivant :
     * Clé : `MAPBOX_PUBLIC_TOKEN`
     * Valeur : `pk.eyJ1IjoiZ3JhbmRlc3RjeWNsaXNtZSIsImEiOiJjbHpqMnZ5eTUwMDFqMnFxcTRpbXg1NXZrIn0.5Z5Kg9_Qx3_Y5Xj2Z5Z5Zw`

4. **N'oubliez pas les variables de configuration Netlify** :
   - `NODE_VERSION` : `18.17.0`
   - `NPM_VERSION` : `9.6.7`
   - `CI` : `false`

5. **Déclenchez un nouveau déploiement** :
   - Dans le menu, cliquez sur "Deploys" (Déploiements)
   - Cliquez sur "Trigger deploy" (Déclencher un déploiement) puis "Deploy site" (Déployer le site)

## Vérification du fonctionnement

Après le déploiement, vérifiez les points suivants :

1. La carte s'affiche correctement (Mapbox API)
2. Les données météo sont disponibles (OpenWeatherMap API)
3. Le calcul d'itinéraires fonctionne (OpenRouteService API)
4. Les chatbots fonctionnent correctement (OpenAI et Claude API)

Si l'une de ces fonctionnalités ne fonctionne pas, vérifiez les variables d'environnement dans Netlify et assurez-vous que les clés API sont correctes.

## Sécurité supplémentaire

Pour une sécurité optimale, considérez les mesures suivantes :

1. **Restreindre les domaines autorisés** : Dans les paramètres de vos API (Mapbox, OpenWeatherMap, etc.), limitez l'accès à votre domaine velo-altitude.com uniquement

2. **Rotation des clés** : Changez périodiquement vos clés API

3. **Surveillance** : Mettez en place une surveillance de l'utilisation de vos API pour détecter toute utilisation anormale

## Conversion des .env locaux en variables Netlify

Valeurs à récupérer de vos fichiers .env locaux :

```
# Mapbox API (Cartographie)
MAPBOX_PUBLIC_TOKEN=pk.eyJ1IjoiZ3JhbmRlc3RjeWNsaXNtZSIsImEiOiJjbHpqMnZ5eTUwMDFqMnFxcTRpbXg1NXZrIn0.5Z5Kg9_Qx3_Y5Xj2Z5Z5Zw
MAPBOX_SECRET_TOKEN=sk.eyJ1IjoiZ3JhbmRlc3RjeWNsaXNtZSIsImEiOiJjbHpqMnZ5eTUwMDFqMnFxcTRpbXg1NXZrIn0.5Z5Kg9_Qx3_Y5Xj2Z5Z5Zw

# OpenWeatherMap API (Météo)
OPENWEATHER_API_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6

# OpenRouteService API (Calcul d'itinéraires)
OPENROUTE_API_KEY=5a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6

# OpenAI API (Chatbot principal)
OPENAI_API_KEY=sk-a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6

# Claude API (Chatbot alternatif)
CLAUDE_API_KEY=sk-ant-api03-a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

> **Note importante** : Les valeurs affichées ci-dessus sont des exemples basés sur vos fichiers. Assurez-vous d'utiliser vos vraies clés API qui se trouvent dans vos fichiers `.env` et `.env.production`.
