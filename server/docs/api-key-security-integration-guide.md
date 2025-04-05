# Guide d'intégration du système de gestion sécurisée des clés API

## Introduction

Ce guide explique comment intégrer le système de gestion sécurisée des clés API dans de nouveaux services pour Dashboard-Velo.com. Il fournit des exemples concrets d'utilisation et des bonnes pratiques de sécurité à suivre.

## Prérequis

- Node.js 14.x ou supérieur
- Accès au répertoire des clés API (`.keys` par défaut)
- Variables d'environnement configurées (voir section Configuration)

## Installation

Le système de gestion sécurisée des clés API est déjà intégré dans le projet Dashboard-Velo.com. Si vous développez un nouveau service ou module, vous n'avez pas besoin d'installer de dépendances supplémentaires.

## Configuration

### Variables d'environnement

Les variables d'environnement suivantes doivent être configurées pour le bon fonctionnement du système :

```
# Clé de chiffrement pour les clés API (32 caractères hexadécimaux)
API_KEYS_ENCRYPTION_KEY=votre_clé_de_chiffrement_ici

# Répertoire de stockage des clés API (optionnel)
KEYS_DIRECTORY=chemin/vers/répertoire/clés

# Secret JWT pour l'authentification (si utilisé)
JWT_SECRET=votre_secret_jwt_ici
```

Pour générer une clé de chiffrement sécurisée, vous pouvez utiliser la commande suivante :

```javascript
const crypto = require('crypto');
console.log(crypto.randomBytes(32).toString('hex'));
```

### Configuration du module

Si vous avez besoin de personnaliser la configuration du système, vous pouvez passer des options lors de l'initialisation :

```javascript
const EnhancedApiKeyManager = require('../utils/enhanced-api-key-manager');

const apiKeyManager = new EnhancedApiKeyManager({
  keysDirectory: './custom-keys-directory',
  rotationInterval: 7 * 24 * 60 * 60 * 1000, // 7 jours
  gracePeriod: 12 * 60 * 60 * 1000, // 12 heures
  memoryTTL: 15 * 60 * 1000, // 15 minutes
  autoRotate: true,
  logger: customLogger // Votre logger personnalisé
});

await apiKeyManager.initialize();
```

## Intégration dans un nouveau service

### Méthode 1 : Utilisation via apiServices

La méthode la plus simple pour intégrer le système dans un nouveau service est d'utiliser le module `apiServices` qui expose une interface cohérente pour tous les services API.

```javascript
const apiServices = require('../services/apiServices');

class MyNewService {
  constructor() {
    this.serviceName = 'myNewService';
  }
  
  async callExternalApi() {
    try {
      // Obtenir la clé API pour le service
      const apiKey = await apiServices[this.serviceName].getKey();
      
      // Utiliser la clé API pour appeler l'API externe
      const response = await axios.get('https://api.example.com/data', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      
      return response.data;
    } catch (error) {
      // Gérer les erreurs
      console.error('Erreur lors de l\'appel à l\'API externe', error);
      throw error;
    }
  }
}
```

### Méthode 2 : Intégration directe

Si vous avez besoin d'un contrôle plus fin ou si vous développez un service qui n'est pas encore intégré dans `apiServices`, vous pouvez utiliser directement le gestionnaire de clés API.

```javascript
const EnhancedApiKeyManager = require('../utils/enhanced-api-key-manager');
const { logger } = require('../utils/logger');

class MyAdvancedService {
  constructor() {
    this.serviceName = 'myAdvancedService';
    this.moduleId = 'advanced-module';
    
    // Créer une instance du gestionnaire de clés API
    this.apiKeyManager = new EnhancedApiKeyManager({
      logger: logger
    });
  }
  
  async initialize() {
    // Initialiser le gestionnaire de clés API
    await this.apiKeyManager.initialize();
    
    // Vérifier si le service existe, sinon créer des clés initiales
    const services = await this.apiKeyManager.listServices();
    if (!services.includes(this.serviceName)) {
      logger.info(`Création des clés initiales pour ${this.serviceName}`);
      await this.apiKeyManager.createInitialKeys(this.serviceName, 'initial-key');
    }
  }
  
  async callExternalApi() {
    try {
      // Obtenir la clé API pour le service
      const apiKey = await this.apiKeyManager.getApiKey(this.serviceName, this.moduleId);
      
      // Utiliser la clé API pour appeler l'API externe
      const response = await axios.get('https://api.example.com/data', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      
      return response.data;
    } catch (error) {
      // Gérer les erreurs
      logger.error('Erreur lors de l\'appel à l\'API externe', {
        service: this.serviceName,
        error: error.message
      });
      throw error;
    }
  }
  
  async rotateApiKey() {
    // Forcer une rotation de clé
    await this.apiKeyManager.rotationManager.forceRotation(this.serviceName);
    logger.info(`Clé API rotée pour ${this.serviceName}`);
  }
}
```

## Gestion des erreurs et cas de repli

Il est important de gérer correctement les erreurs liées aux clés API. Voici un exemple de gestion des erreurs avec des cas de repli :

```javascript
async function callApiWithRetry(service, moduleId, url, options = {}) {
  const maxRetries = options.maxRetries || 3;
  const retryDelay = options.retryDelay || 1000;
  
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Obtenir la clé API
      const apiKey = await apiServices[service].getKey();
      
      // Appeler l'API externe
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        ...options
      });
      
      return response.data;
    } catch (error) {
      lastError = error;
      
      // Vérifier si l'erreur est liée à la clé API
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        logger.warn(`Clé API invalide pour ${service}, tentative de rotation...`);
        
        try {
          // Tenter de forcer une rotation
          await apiServices[service].rotateKeys();
          
          // Attendre un peu avant de réessayer
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        } catch (rotationError) {
          logger.error(`Échec de la rotation de clé pour ${service}`, {
            error: rotationError.message
          });
        }
      }
      
      // Si c'est la dernière tentative, propager l'erreur
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Attendre avant de réessayer
      await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
    }
  }
  
  throw lastError;
}
```

## Monitoring et alertes

Le système de gestion sécurisée des clés API inclut un module de monitoring qui permet de suivre l'utilisation des clés API et de configurer des alertes. Voici comment l'intégrer dans votre service :

```javascript
const ApiKeyMonitoring = require('../utils/api-key-monitoring');
const { logger } = require('../utils/logger');

// Créer une instance du monitoring
const monitoring = new ApiKeyMonitoring({
  alertThresholds: {
    errorRate: 0.05,           // 5% d'erreurs maximum
    responseTime: 500,         // 500ms maximum
    usageThreshold: 0.7,       // 70% d'utilisation des quotas
    rotationFailures: 2        // 2 échecs de rotation consécutifs maximum
  }
});

// Écouter les alertes
monitoring.on('alert', (alert) => {
  logger.warn(`Alerte détectée: ${alert.type} pour ${alert.data.service}`);
  
  // Envoyer une notification (email, Slack, etc.)
  notifyTeam(alert);
});

// Suivre l'utilisation des clés API
function trackApiCall(service, module, success, error, duration) {
  monitoring.trackApiKeyAccess({
    service,
    module,
    success,
    error,
    duration
  });
}

// Suivre les rotations de clés
function trackRotation(service, success, error) {
  monitoring.trackApiKeyRotation({
    service,
    success,
    error
  });
}

// Suivre l'utilisation des quotas
function trackQuota(service, quota, used) {
  monitoring.trackApiKeyQuota({
    service,
    quota,
    used
  });
}

// Générer un rapport de métriques
async function generateDailyReport() {
  const report = monitoring.generateMetricsReport('day');
  logger.info('Rapport quotidien généré', { report });
  
  // Envoyer le rapport par email
  await sendReportByEmail(report);
}
```

## Bonnes pratiques de sécurité

### 1. Ne stockez jamais les clés API en clair

Les clés API ne doivent jamais être stockées en clair dans le code, les fichiers de configuration ou les bases de données. Utilisez toujours le système de gestion sécurisée des clés API pour stocker et récupérer les clés.

### 2. Utilisez le principe du moindre privilège

Chaque module ne doit avoir accès qu'aux clés API dont il a besoin. Utilisez le système de permissions pour restreindre l'accès aux clés API.

```javascript
// Mauvaise pratique
const apiKey = await apiKeyManager.getApiKey('openai', null); // Accès sans restriction

// Bonne pratique
const apiKey = await apiKeyManager.getApiKey('openai', 'my-module'); // Accès restreint
```

### 3. Gérez correctement les erreurs

Ne laissez jamais les erreurs liées aux clés API exposer des informations sensibles. Utilisez des messages d'erreur génériques pour les utilisateurs finaux.

```javascript
// Mauvaise pratique
catch (error) {
  console.error(`Erreur avec la clé API ${apiKey}: ${error.message}`);
  res.status(500).send(`Erreur avec la clé API ${apiKey}: ${error.message}`);
}

// Bonne pratique
catch (error) {
  logger.error('Erreur lors de l\'appel à l\'API externe', {
    service: serviceName,
    error: error.message
  });
  res.status(500).send('Erreur lors de la communication avec le service externe');
}
```

### 4. Utilisez la rotation automatique des clés

Activez la rotation automatique des clés pour tous les services. Cela permet de limiter les risques en cas de compromission d'une clé.

```javascript
// Configuration recommandée
const apiKeyManager = new EnhancedApiKeyManager({
  rotationInterval: 30 * 24 * 60 * 60 * 1000, // 30 jours
  gracePeriod: 24 * 60 * 60 * 1000, // 24 heures
  autoRotate: true
});
```

### 5. Surveillez l'utilisation des clés API

Utilisez le module de monitoring pour détecter les anomalies et les tentatives d'abus.

```javascript
// Suivre chaque appel API
async function callExternalApi() {
  const startTime = Date.now();
  let success = false;
  let error = null;
  
  try {
    const apiKey = await apiServices.openai.getKey();
    const result = await axios.get('https://api.openai.com/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    
    success = true;
    return result.data;
  } catch (err) {
    error = err;
    throw err;
  } finally {
    const duration = Date.now() - startTime;
    monitoring.trackApiKeyAccess({
      service: 'openai',
      module: 'my-module',
      success,
      error: error ? error.message : null,
      duration
    });
  }
}
```

## Exemples d'intégration par service

### OpenRouteService

```javascript
const apiServices = require('../services/apiServices');

async function getRoute(startPoint, endPoint) {
  try {
    const apiKey = await apiServices.openRouteService.getKey();
    
    const response = await axios.post('https://api.openrouteservice.org/v2/directions/cycling-regular', {
      coordinates: [startPoint, endPoint],
      format: 'geojson'
    }, {
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    // Gérer les erreurs spécifiques à OpenRouteService
    if (error.response && error.response.status === 429) {
      logger.warn('Limite de requêtes OpenRouteService atteinte');
      // Attendre et réessayer ou utiliser un service alternatif
    }
    
    throw error;
  }
}
```

### Strava

```javascript
const apiServices = require('../services/apiServices');

async function getStravaActivities(userId) {
  try {
    // Pour Strava, nous avons besoin d'un token d'accès OAuth
    const clientSecret = await apiServices.strava.getKey();
    
    // Obtenir un token d'accès à partir du client secret
    const tokenResponse = await axios.post('https://www.strava.com/oauth/token', {
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: clientSecret,
      refresh_token: userRefreshToken, // Stocké pour l'utilisateur
      grant_type: 'refresh_token'
    });
    
    const accessToken = tokenResponse.data.access_token;
    
    // Utiliser le token d'accès pour appeler l'API Strava
    const activitiesResponse = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    return activitiesResponse.data;
  } catch (error) {
    // Gérer les erreurs spécifiques à Strava
    if (error.response && error.response.status === 401) {
      logger.warn('Token Strava expiré ou invalide');
      // Gérer le renouvellement du token
    }
    
    throw error;
  }
}
```

### OpenWeather

```javascript
const apiServices = require('../services/apiServices');

async function getWeatherForecast(city) {
  try {
    const apiKey = await apiServices.weatherService.getKey();
    
    const response = await axios.get(`https://api.openweathermap.org/data/2.5/forecast`, {
      params: {
        q: city,
        appid: apiKey,
        units: 'metric'
      }
    });
    
    return response.data;
  } catch (error) {
    // Gérer les erreurs spécifiques à OpenWeather
    if (error.response && error.response.status === 401) {
      logger.warn('Clé API OpenWeather invalide');
      // Tenter une rotation de clé
      await apiServices.weatherService.rotateKeys();
    }
    
    throw error;
  }
}
```

### OpenAI

```javascript
const apiServices = require('../services/apiServices');

async function generateText(prompt) {
  try {
    const apiKey = await apiServices.openai.getKey();
    
    const response = await axios.post('https://api.openai.com/v1/completions', {
      model: 'text-davinci-003',
      prompt,
      max_tokens: 100
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data.choices[0].text;
  } catch (error) {
    // Gérer les erreurs spécifiques à OpenAI
    if (error.response && error.response.status === 429) {
      logger.warn('Limite de requêtes OpenAI atteinte');
      // Implémenter une stratégie de backoff exponentiel
      await new Promise(resolve => setTimeout(resolve, 1000));
      return generateText(prompt); // Réessayer
    }
    
    throw error;
  }
}
```

## Préparation pour la production

### 1. Remplacer les clés de test

Avant de déployer en production, assurez-vous que toutes les clés de test sont remplacées par des variables d'environnement sécurisées.

```javascript
// Vérifier que les clés de production sont configurées
function validateProductionKeys() {
  const requiredKeys = [
    'API_KEYS_ENCRYPTION_KEY',
    'JWT_SECRET',
    'OPENROUTE_API_KEY',
    'STRAVA_CLIENT_SECRET',
    'OPENWEATHER_API_KEY',
    'MAPBOX_SECRET_TOKEN',
    'OPENAI_API_KEY'
  ];
  
  const missingKeys = requiredKeys.filter(key => !process.env[key]);
  
  if (missingKeys.length > 0) {
    logger.error(`Variables d'environnement manquantes: ${missingKeys.join(', ')}`);
    return false;
  }
  
  return true;
}
```

### 2. Configurer la rotation automatique

Configurez la rotation automatique des clés avec des intervalles appropriés pour la production.

```javascript
// Configuration recommandée pour la production
const productionConfig = {
  openRouteService: {
    rotationInterval: 30 * 24 * 60 * 60 * 1000, // 30 jours
    gracePeriod: 48 * 60 * 60 * 1000 // 48 heures
  },
  strava: {
    rotationInterval: 90 * 24 * 60 * 60 * 1000, // 90 jours
    gracePeriod: 72 * 60 * 60 * 1000 // 72 heures
  },
  weatherService: {
    rotationInterval: 60 * 24 * 60 * 60 * 1000, // 60 jours
    gracePeriod: 48 * 60 * 60 * 1000 // 48 heures
  },
  mapbox: {
    rotationInterval: 180 * 24 * 60 * 60 * 1000, // 180 jours
    gracePeriod: 72 * 60 * 60 * 1000 // 72 heures
  },
  openai: {
    rotationInterval: 45 * 24 * 60 * 60 * 1000, // 45 jours
    gracePeriod: 48 * 60 * 60 * 1000 // 48 heures
  }
};
```

### 3. Mettre en place un système de sauvegarde des clés

Implémentez un système de sauvegarde des clés pour éviter la perte de données.

```javascript
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Sauvegarder les clés API
function backupApiKeys() {
  const keysDirectory = process.env.KEYS_DIRECTORY || path.join(__dirname, '../../.keys');
  const backupDirectory = path.join(__dirname, '../../backups/keys');
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const backupPath = path.join(backupDirectory, `keys-backup-${timestamp}`);
  
  // Créer le répertoire de sauvegarde s'il n'existe pas
  if (!fs.existsSync(backupDirectory)) {
    fs.mkdirSync(backupDirectory, { recursive: true });
  }
  
  // Copier les fichiers de clés
  fs.cpSync(keysDirectory, backupPath, { recursive: true });
  
  logger.info(`Sauvegarde des clés API créée: ${backupPath}`);
  
  // Nettoyer les anciennes sauvegardes (garder les 10 dernières)
  const backups = fs.readdirSync(backupDirectory)
    .filter(file => file.startsWith('keys-backup-'))
    .sort((a, b) => b.localeCompare(a));
  
  if (backups.length > 10) {
    backups.slice(10).forEach(backup => {
      fs.rmSync(path.join(backupDirectory, backup), { recursive: true, force: true });
      logger.info(`Ancienne sauvegarde supprimée: ${backup}`);
    });
  }
  
  return backupPath;
}

// Programmer une sauvegarde quotidienne
function scheduleBackups() {
  // Exécuter une sauvegarde immédiate
  backupApiKeys();
  
  // Programmer une sauvegarde quotidienne à minuit
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  
  const timeUntilMidnight = midnight.getTime() - now.getTime();
  
  setTimeout(() => {
    backupApiKeys();
    // Ensuite, exécuter tous les jours
    setInterval(backupApiKeys, 24 * 60 * 60 * 1000);
  }, timeUntilMidnight);
  
  logger.info(`Sauvegardes programmées, prochaine sauvegarde dans ${Math.floor(timeUntilMidnight / 1000 / 60)} minutes`);
}
```

## Conclusion

Ce guide vous a fourni les informations nécessaires pour intégrer le système de gestion sécurisée des clés API dans vos services. En suivant ces bonnes pratiques, vous contribuerez à maintenir un niveau élevé de sécurité pour les clés API de Dashboard-Velo.com.

Pour toute question ou assistance supplémentaire, contactez l'équipe de sécurité.

## Références

- [Documentation du système de gestion sécurisée des clés API](./api-key-security-system.md)
- [Script de test de charge et de résilience](../scripts/api-key-load-test.js)
- [Module de monitoring](../utils/api-key-monitoring.js)
- [EnhancedApiKeyManager](../utils/enhanced-api-key-manager.js)
