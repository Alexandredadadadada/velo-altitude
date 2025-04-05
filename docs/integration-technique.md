# Guide d'Intégration Technique - Dashboard Cycliste Européen

## Introduction

Ce document fournit les détails techniques nécessaires pour intégrer les différents services et API utilisés par le Dashboard Cycliste Européen. Il est destiné aux développeurs qui maintiennent ou étendent les fonctionnalités de l'application.

## Architecture globale

L'application utilise une architecture client-serveur:

- **Frontend**: React.js avec Material UI
- **Backend**: Node.js avec Express
- **Base de données**: MongoDB
- **Services tiers**: Strava API, OpenWeatherMap, OpenRouteService, Mapbox, OpenAI, Claude (Anthropic)

Le diagramme ci-dessous illustre l'architecture globale:

```
┌─────────────┐      ┌──────────────┐      ┌───────────────┐
│             │      │              │      │               │
│   Frontend  │◄────►│   Backend    │◄────►│   MongoDB     │
│   (React)   │      │   (Node.js)  │      │               │
│             │      │              │      │               │
└─────────────┘      └──────┬───────┘      └───────────────┘
                            │
                            ▼
         ┌─────────────────────────────────────┐
         │                                     │
         │           Services Tiers            │
         │                                     │
         ├─────────────┬───────────┬──────────┤
         │             │           │          │
         │  Strava API │ Weather   │ Mapping  │
         │             │ API       │ APIs     │
         │             │           │          │
         └─────────────┴───────────┴──────────┘
```

## Configuration des Services

### 1. Strava API

#### Configuration du client OAuth

1. Créez une application sur [Strava Developers](https://developers.strava.com/)
2. Configurez les URLs de redirection:
   - Pour le développement: `http://localhost:3000/strava/callback`
   - Pour la production: `https://your-domain.com/strava/callback`

#### Variables d'environnement

```
STRAVA_CLIENT_ID=votre_client_id
STRAVA_CLIENT_SECRET=votre_client_secret
STRAVA_ACCESS_TOKEN=token_initial_si_disponible
STRAVA_REFRESH_TOKEN=token_refresh_initial_si_disponible
```

#### Endpoints principaux

```javascript
// Authentification
GET /api/strava/auth
POST /api/strava/auth/exchange
GET /api/strava/auth/status

// Activités
GET /api/strava/activities
POST /api/strava/import/:activityId
```

#### Gestion du token

Le système gère automatiquement:
- La vérification de l'expiration des tokens
- Le rafraîchissement des tokens expirés
- Le stockage des tokens dans la base de données

```javascript
// Exemple de middleware de vérification de token Strava
const checkStravaToken = async (req, res, next) => {
  const userId = req.user.id;
  const tokens = await StravaTokenModel.findOne({ userId });
  
  if (!tokens) {
    return res.status(401).json({ message: 'Strava non connecté' });
  }
  
  // Vérifier si le token est expiré ou va expirer bientôt
  if (tokens.expiresAt <= Date.now() + 600000) { // 10 min de marge
    try {
      const refreshed = await refreshStravaToken(tokens.refreshToken);
      tokens.accessToken = refreshed.access_token;
      tokens.refreshToken = refreshed.refresh_token;
      tokens.expiresAt = refreshed.expires_at * 1000;
      await tokens.save();
    } catch (error) {
      return res.status(401).json({ message: 'Impossible de rafraîchir le token' });
    }
  }
  
  req.stravaToken = tokens.accessToken;
  next();
};
```

### 2. OpenWeatherMap API

#### Variables d'environnement

```
OPENWEATHER_API_KEY=votre_clé_api
```

#### Service d'intégration

```javascript
const getWeatherForLocation = async (lat, lng) => {
  try {
    const response = await axios.get('https://api.openweathermap.org/data/2.5/onecall', {
      params: {
        lat,
        lon: lng,
        appid: process.env.OPENWEATHER_API_KEY,
        units: 'metric',
        exclude: 'minutely,alerts'
      }
    });
    
    return {
      current: mapWeatherData(response.data.current),
      forecast: response.data.daily.map(mapWeatherData)
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des données météo:', error);
    throw new Error('Service météo indisponible');
  }
};
```

### 3. OpenRouteService API

#### Variables d'environnement

```
OPENROUTE_API_KEY=votre_clé_api
```

#### Service d'intégration

```javascript
const getRouteDirections = async (points) => {
  try {
    const coordinates = points.map(p => [p.lng, p.lat]);
    
    const response = await axios.post('https://api.openrouteservice.org/v2/directions/cycling-regular/geojson', {
      coordinates
    }, {
      headers: {
        'Authorization': process.env.OPENROUTE_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Erreur lors du calcul d\'itinéraire:', error);
    throw new Error('Service d\'itinéraire indisponible');
  }
};
```

### 4. Mapbox API

#### Variables d'environnement

```
MAPBOX_ACCESS_TOKEN=votre_clé_api
```

#### Intégration Frontend

```javascript
// Dans le composant Map.jsx
import { MapContainer, TileLayer } from 'react-leaflet';

// L'URL des tuiles Mapbox
const MAPBOX_URL = `https://api.mapbox.com/styles/v1/mapbox/outdoors-v11/tiles/{z}/{x}/{y}?access_token=${process.env.REACT_APP_MAPBOX_ACCESS_TOKEN}`;

function Map({ center, zoom, routes }) {
  return (
    <MapContainer center={center} zoom={zoom}>
      <TileLayer url={MAPBOX_URL} attribution="© Mapbox" />
      {/* Autres couches et composants */}
    </MapContainer>
  );
}
```

### 5. OpenAI API

#### Variables d'environnement

```
OPENAI_API_KEY=votre_clé_api
```

#### Service d'intégration

```javascript
const generateRouteDescription = async (routeData) => {
  try {
    const prompt = `Générer une description détaillée pour l'itinéraire cycliste suivant:
    Nom: ${routeData.name}
    Distance: ${routeData.distance} km
    Dénivelé: ${routeData.elevation_gain} m
    Région: ${routeData.region}
    Difficulté: ${routeData.difficulty}/5
    Points d'intérêt: ${routeData.points_of_interest.map(p => p.name).join(', ')}`;
    
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "Vous êtes un expert en cyclisme qui connaît parfaitement les routes européennes." },
        { role: "user", content: prompt }
      ],
      max_tokens: 500
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Erreur lors de la génération de description:', error);
    return null; // Retourne null plutôt que de faire échouer l'application
  }
};
```

### 6. Claude API (Anthropic)

#### Variables d'environnement

```
CLAUDE_API_KEY=votre_clé_api
```

#### Service d'intégration

```javascript
const analyzeRouteForCyclist = async (routeData, userProfile) => {
  try {
    const prompt = `Analyser cet itinéraire cycliste du point de vue d'un cycliste avec le profil suivant:
    
    Itinéraire:
    - Nom: ${routeData.name}
    - Distance: ${routeData.distance} km
    - Dénivelé: ${routeData.elevation_gain} m
    - Difficulté: ${routeData.difficulty}/5
    - Pente max: ${routeData.max_gradient}%
    
    Profil du cycliste:
    - Niveau: ${userProfile.level}
    - FTP: ${userProfile.ftp} watts
    - Poids: ${userProfile.weight} kg
    - Objectifs: ${userProfile.goals}
    
    Fournir une analyse personnalisée indiquant:
    1. Si cet itinéraire est adapté au niveau du cycliste
    2. Les sections qui pourraient être difficiles
    3. Des conseils spécifiques pour aborder cet itinéraire
    4. Une estimation du temps nécessaire
    5. Des recommandations nutritionnelles`;
    
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: "claude-3-opus-20240229",
      max_tokens: 1000,
      messages: [
        { role: "user", content: prompt }
      ]
    }, {
      headers: {
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      }
    });
    
    return response.data.content[0].text;
  } catch (error) {
    console.error('Erreur lors de l\'analyse d\'itinéraire:', error);
    return null;
  }
};
```

## Rotation des Tokens

### Mise en place du système de rotation des tokens

Le système de rotation des tokens est implémenté à la fois côté client et serveur.

#### Côté Client

```javascript
// authService.js
export class AuthService {
  static setTokenData(tokenData) {
    localStorage.setItem('token', tokenData.token);
    localStorage.setItem('refreshToken', tokenData.refreshToken);
    localStorage.setItem('tokenExpiry', new Date(Date.now() + 3600000).toISOString()); // 1h par défaut
  }
  
  static getToken() {
    return localStorage.getItem('token');
  }
  
  static getRefreshToken() {
    return localStorage.getItem('refreshToken');
  }
  
  static isTokenExpired() {
    const expiryString = localStorage.getItem('tokenExpiry');
    if (!expiryString) return true;
    
    const expiry = new Date(expiryString);
    // Considérer le token comme expiré 5 minutes avant son expiration réelle
    return expiry.getTime() <= Date.now() + 300000;
  }
  
  static async refreshToken() {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) throw new Error('Aucun refresh token disponible');
      
      const response = await axios.post('/api/auth/refresh-token', { refreshToken });
      this.setTokenData(response.data);
      return response.data.token;
    } catch (error) {
      this.clearTokens();
      throw error;
    }
  }
  
  static clearTokens() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpiry');
  }
  
  // Configurer les interceptors Axios pour gérer automatiquement les tokens
  static setupAxiosInterceptors() {
    // Intercepteur de requête pour ajouter le token à toutes les requêtes
    axios.interceptors.request.use(async (config) => {
      if (this.isTokenExpired()) {
        try {
          await this.refreshToken();
        } catch (error) {
          console.error('Erreur lors du rafraîchissement du token', error);
          this.clearTokens();
          window.location.href = '/login';
          return Promise.reject(error);
        }
      }
      
      const token = this.getToken();
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    }, (error) => Promise.reject(error));
    
    // Intercepteur de réponse pour gérer les 401 Unauthorized
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // Si une erreur 401 et que nous n'avons pas déjà essayé de rafraîchir le token
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            await this.refreshToken();
            const token = this.getToken();
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return axios(originalRequest);
          } catch (refreshError) {
            this.clearTokens();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );
  }
}
```

#### Côté Serveur

```javascript
// authController.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

const generateRefreshToken = (user) => {
  const refreshToken = crypto.randomBytes(40).toString('hex');
  
  // Stocker le refresh token dans la base de données
  RefreshToken.create({
    token: refreshToken,
    user: user._id,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 jours
  });
  
  return refreshToken;
};

exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token requis' });
  }
  
  try {
    // Vérifier si le refresh token existe et n'est pas expiré
    const refreshTokenDoc = await RefreshToken.findOne({
      token: refreshToken,
      expiresAt: { $gt: new Date() }
    }).populate('user');
    
    if (!refreshTokenDoc) {
      return res.status(401).json({ message: 'Refresh token invalide ou expiré' });
    }
    
    // Générer un nouveau token d'accès
    const token = generateToken(refreshTokenDoc.user);
    
    // Remplacer le refresh token (rotation)
    await RefreshToken.findByIdAndDelete(refreshTokenDoc._id);
    const newRefreshToken = generateRefreshToken(refreshTokenDoc.user);
    
    return res.json({
      token,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('Erreur lors du rafraîchissement du token:', error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};
```

## Points d'API Sensibles

### Sécurisation des endpoints sensibles

Certains endpoints API nécessitent une attention particulière en matière de sécurité:

#### 1. Authentification et autorisation

Tous les endpoints protégés doivent utiliser le middleware d'authentification:

```javascript
// authMiddleware.js
const jwt = require('jsonwebtoken');

exports.authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ message: 'Token manquant' });
  }
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Format de token invalide' });
  }
  
  const token = parts[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expiré' });
    }
    return res.status(401).json({ message: 'Token invalide' });
  }
};

exports.requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès refusé' });
  }
  next();
};
```

#### 2. Rate limiting

Pour prévenir les abus:

```javascript
// rateLimitMiddleware.js
const rateLimit = require('express-rate-limit');

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 tentatives maximum
  message: {
    error: true,
    message: 'Trop de tentatives, veuillez réessayer dans 15 minutes'
  }
});

const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requêtes par minute
  headers: true,
  message: {
    error: true,
    message: 'Trop de requêtes, veuillez ralentir'
  }
});

module.exports = { authRateLimiter, apiRateLimiter };
```

## Monitoring et Logging

### Configuration du monitoring

Pour surveiller l'état des API et détecter les problèmes:

```javascript
// monitoring.js
const axios = require('axios');
const cron = require('node-cron');

class APIMonitor {
  constructor() {
    this.services = [
      {
        name: 'Strava API',
        checkFunction: this.checkStravaAPI,
        lastStatus: 'unknown',
        lastCheck: null
      },
      {
        name: 'Weather API',
        checkFunction: this.checkWeatherAPI,
        lastStatus: 'unknown',
        lastCheck: null
      },
      // Autres services...
    ];
    
    // Exécuter la vérification toutes les 15 minutes
    cron.schedule('*/15 * * * *', () => {
      this.checkAllServices();
    });
  }
  
  async checkAllServices() {
    console.log('Vérification des services API...');
    for (const service of this.services) {
      try {
        const status = await service.checkFunction();
        service.lastStatus = status ? 'operational' : 'down';
      } catch (error) {
        service.lastStatus = 'error';
        console.error(`Erreur lors de la vérification de ${service.name}:`, error);
      }
      service.lastCheck = new Date();
    }
    this.logStatus();
  }
  
  async checkStravaAPI() {
    try {
      // Requête simple pour vérifier l'état
      await axios.get('https://www.strava.com/api/v3/athlete', {
        headers: { 'Authorization': `Bearer ${process.env.STRAVA_TEST_TOKEN}` }
      });
      return true;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        // C'est normal si le token est expiré, l'API fonctionne
        return true;
      }
      return false;
    }
  }
  
  async checkWeatherAPI() {
    try {
      await axios.get('https://api.openweathermap.org/data/2.5/weather', {
        params: {
          q: 'Paris',
          appid: process.env.OPENWEATHER_API_KEY
        }
      });
      return true;
    } catch (error) {
      return false;
    }
  }
  
  logStatus() {
    console.log('Statut des services API:');
    for (const service of this.services) {
      console.log(`${service.name}: ${service.lastStatus} (vérifié à ${service.lastCheck})`);
    }
  }
  
  getServiceStatus() {
    return this.services.map(s => ({
      name: s.name,
      status: s.lastStatus,
      lastCheck: s.lastCheck
    }));
  }
}

module.exports = new APIMonitor();
```

## Tests Automatisés

### Configuration des tests

#### Jest et Supertest pour les tests API

```javascript
// package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "jest": {
    "testEnvironment": "node",
    "testPathIgnorePatterns": ["/node_modules/", "/client/"],
    "collectCoverageFrom": [
      "server/**/*.js",
      "!server/tests/**/*.js"
    ],
    "coverageThreshold": {
      "global": {
        "statements": 70,
        "branches": 60,
        "functions": 70,
        "lines": 70
      }
    }
  }
}
```

#### Tests Cypress pour le frontend

```javascript
// cypress.json
{
  "baseUrl": "http://localhost:3000",
  "viewportWidth": 1280,
  "viewportHeight": 720,
  "video": false,
  "screenshotOnRunFailure": true,
  "integrationFolder": "cypress/integration",
  "testFiles": "**/*.spec.js"
}
```

## CI/CD Pipeline

### Configuration GitHub Actions

```yaml
# .github/workflows/main.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
      - name: Run API audit
        run: node server/scripts/api-keys-audit.js
        env:
          OPENWEATHER_API_KEY: ${{ secrets.OPENWEATHER_API_KEY }}
          OPENROUTE_API_KEY: ${{ secrets.OPENROUTE_API_KEY }}
          STRAVA_ACCESS_TOKEN: ${{ secrets.STRAVA_ACCESS_TOKEN }}
          STRAVA_REFRESH_TOKEN: ${{ secrets.STRAVA_REFRESH_TOKEN }}
          STRAVA_CLIENT_ID: ${{ secrets.STRAVA_CLIENT_ID }}
          STRAVA_CLIENT_SECRET: ${{ secrets.STRAVA_CLIENT_SECRET }}
          MAPBOX_ACCESS_TOKEN: ${{ secrets.MAPBOX_ACCESS_TOKEN }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          CLAUDE_API_KEY: ${{ secrets.CLAUDE_API_KEY }}
  
  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Deploy
        uses: netlify/actions/cli@master
        with:
          args: deploy --prod
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

## Bonne Pratiques de Sécurité

### Audit de sécurité régulier

1. Exécuter des analyses de vulnérabilités:
   ```bash
   npm audit
   ```

2. Mettre à jour les dépendances:
   ```bash
   npm update
   ```

3. Utiliser des outils d'analyse statique:
   ```bash
   eslint --ext .js,.jsx --fix .
   ```

### Protection des clés API

- **JAMAIS** de clés API dans le code source
- Utiliser des variables d'environnement ou des secrets pour CI/CD
- Rotation régulière des clés API
- Utilisation de restrictions par origine (CORS) côté API
- Monitoring des quotas d'utilisation

## Troubleshooting

### Problèmes courants et solutions

1. **Erreur 401 avec Strava API**
   - Vérifier l'expiration du token
   - Essayer de forcer un rafraîchissement du token
   - Vérifier les permissions de l'application

2. **Quota dépassé pour les API météo**
   - Implémenter une mise en cache des résultats
   - Réduire la fréquence des requêtes
   - Envisager un plan payant si l'utilisation est intensive

3. **Performance des cartes**
   - Limiter le nombre de waypoints affichés
   - Utiliser le clustering pour les marqueurs
   - Charger les tuiles à la demande

4. **Problèmes de connexion avec MongoDB**
   - Vérifier les chaînes de connexion
   - S'assurer que les adresses IP sont autorisées
   - Tester la connectivité réseau

## Contacts et Support

Pour toute question technique concernant l'intégration:

- **Équipe de développement**: dev@grand-est-cyclisme.fr
- **Support API**: support@grand-est-cyclisme.fr
- **Documentation Strava**: [Strava Developers](https://developers.strava.com)
- **Documentation OpenWeatherMap**: [OpenWeatherMap API](https://openweathermap.org/api)
- **Documentation OpenRouteService**: [OpenRouteService API](https://openrouteservice.org/dev/#/api-docs)
