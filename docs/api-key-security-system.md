# Documentation du Système de Gestion Sécurisée des Clés API

## Vue d'Ensemble

Le système de gestion sécurisée des clés API de Dashboard-Velo.com est une solution complète pour gérer, sécuriser et contrôler l'accès aux clés API utilisées par l'application. Ce système implémente les meilleures pratiques de sécurité pour protéger les clés API contre les accès non autorisés, les fuites et les utilisations abusives.

## Architecture

Le système est composé de quatre composants principaux qui travaillent ensemble pour assurer la sécurité des clés API :

1. **SecureMemoryStorage** : Stockage sécurisé des clés en mémoire avec chiffrement
2. **SecretManager** : Gestion et validation des secrets de l'application
3. **ApiKeyPermissionManager** : Contrôle d'accès basé sur les permissions
4. **EnhancedApiKeyRotationManager** : Rotation automatique des clés avec période de grâce

### Diagramme d'Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  Système de Gestion des Clés API                │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌───────────────────┐       ┌───────────────────────────┐      │
│  │  SecretManager    │       │  ApiKeyPermissionManager  │      │
│  └───────────────────┘       └───────────────────────────┘      │
│           │                              │                      │
│           ▼                              ▼                      │
│  ┌───────────────────┐       ┌───────────────────────────┐      │
│  │SecureMemoryStorage│◄─────►│EnhancedApiKeyRotationMgr  │      │
│  └───────────────────┘       └───────────────────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Services de l'Application                   │
│                                                                 │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐        │
│  │ WeatherService│  │ StravaService │  │OpenRouteService│        │
│  └───────────────┘  └───────────────┘  └───────────────┘        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Composants

### 1. SecureMemoryStorage

Ce composant fournit un stockage sécurisé en mémoire pour les clés API. Il utilise le chiffrement AES-256-GCM pour protéger les clés même après leur chargement depuis les fichiers.

#### Caractéristiques principales :

- Chiffrement AES-256-GCM avec IV unique pour chaque entrée
- Authentification des données avec GCM pour détecter les manipulations
- Gestion automatique de la durée de vie (TTL) des clés en mémoire
- Nettoyage automatique des entrées expirées
- Dérivation de clé de chiffrement spécifique à la mémoire

#### Exemple d'utilisation :

```javascript
const storage = new SecureMemoryStorage(process.env.API_KEYS_ENCRYPTION_KEY, {
  ttl: 30 * 60 * 1000, // 30 minutes
  autoCleanup: true
});

// Stocker une clé API
storage.set('openai_key', { key: 'sk-abcdef123456', created: new Date() });

// Récupérer une clé API
const apiKey = storage.get('openai_key');

// Vérifier si une clé existe et n'est pas expirée
if (storage.has('openai_key')) {
  // Utiliser la clé...
}

// Supprimer une clé
storage.delete('openai_key');
```

### 2. SecretManager

Ce composant gère et valide les secrets de l'application, assurant qu'ils sont présents et suffisamment forts pour garantir la sécurité du système.

#### Caractéristiques principales :

- Validation de la présence des secrets requis
- Vérification de la force des secrets (longueur, entropie)
- Génération de secrets forts
- Rapports détaillés sur l'état des secrets

#### Exemple d'utilisation :

```javascript
const secretManager = new SecretManager({
  additionalSecrets: ['OPENAI_API_KEY', 'STRAVA_CLIENT_SECRET'],
  minSecretLength: 32,
  minEntropyLevel: 3
});

// Initialiser et valider tous les secrets
try {
  secretManager.initialize();
  console.log('Tous les secrets sont valides');
} catch (error) {
  console.error('Erreur de validation des secrets:', error.message);
  
  // Générer des suggestions pour les secrets manquants ou faibles
  const suggestions = secretManager.generateSecretSuggestions();
  console.log('Suggestions de secrets:', suggestions);
}

// Générer un rapport sur l'état des secrets
const report = secretManager.generateReport();
console.log('Rapport des secrets:', report);
```

### 3. ApiKeyPermissionManager

Ce composant implémente un système de contrôle d'accès basé sur les permissions pour limiter l'accès aux clés API selon le contexte d'utilisation.

#### Caractéristiques principales :

- Définition des permissions par module
- Vérification des permissions avant l'accès aux clés
- Gestion granulaire des permissions (ajout, suppression)
- Rapports détaillés sur les permissions

#### Exemple d'utilisation :

```javascript
const permissionManager = new ApiKeyPermissionManager({
  logger: customLogger
});

// Configurer des permissions personnalisées
permissionManager.setPermissions('weather-module', ['weatherService']);
permissionManager.setPermissions('map-module', ['openRouteService', 'mapbox']);

// Vérifier les permissions
if (permissionManager.hasPermission('weather-module', 'weatherService')) {
  // Accéder à la clé API...
} else {
  console.error('Accès non autorisé');
}

// Ajouter des permissions à un module existant
permissionManager.addPermissions('weather-module', ['additionalWeatherService']);

// Générer un rapport des permissions
const report = permissionManager.generatePermissionsReport();
console.log('Rapport des permissions:', report);
```

### 4. EnhancedApiKeyRotationManager

Ce composant gère la rotation automatique des clés API avec une période de grâce pour assurer une transition en douceur lors des changements de clés.

#### Caractéristiques principales :

- Rotation automatique des clés selon un intervalle configurable
- Période de grâce pour les anciennes clés
- Nettoyage automatique des clés expirées
- Rapports détaillés sur l'état des rotations

#### Exemple d'utilisation :

```javascript
const rotationManager = new EnhancedApiKeyRotationManager(apiKeyManager, {
  rotationInterval: 30 * 24 * 60 * 60 * 1000, // 30 jours
  gracePeriod: 24 * 60 * 60 * 1000, // 24 heures
  logger: customLogger
});

// Démarrer le service de rotation automatique
rotationManager.startAutomaticRotation();

// Vérifier si une rotation est nécessaire
const rotationNeeded = await rotationManager.checkRotationNeeded('openai');
if (rotationNeeded) {
  await rotationManager.rotateWithGracePeriod('openai');
}

// Vérifier si une clé est valide (active ou en période de grâce)
const isKeyValid = await rotationManager.isKeyValid('openai', keyIndex);

// Générer un rapport sur l'état des rotations
const report = await rotationManager.generateRotationReport();
console.log('Rapport des rotations:', report);
```

## Intégration des Composants

L'intégration des quatre composants crée un système complet de gestion sécurisée des clés API. Voici comment ils interagissent :

1. **SecretManager** valide les secrets au démarrage de l'application
2. **ApiKeyPermissionManager** définit les permissions d'accès aux clés API
3. **SecureMemoryStorage** stocke les clés API en mémoire de manière sécurisée
4. **EnhancedApiKeyRotationManager** gère la rotation automatique des clés

### Exemple d'Intégration Complète

```javascript
// Initialisation du système
const secretManager = new SecretManager();
secretManager.initialize(); // Valider les secrets au démarrage

const storage = new SecureMemoryStorage(process.env.API_KEYS_ENCRYPTION_KEY);
const permissionManager = new ApiKeyPermissionManager({ logger });

// Intégration avec ApiKeyManager existant
class EnhancedApiKeyManager {
  constructor(encryptionKey, options = {}) {
    this.fileEncryptionKey = encryptionKey;
    this.memoryStorage = new SecureMemoryStorage(encryptionKey);
    this.permissionManager = new ApiKeyPermissionManager();
    this.logger = options.logger || console;
    
    // Initialiser le gestionnaire de rotation
    this.rotationManager = new EnhancedApiKeyRotationManager(this, {
      logger: this.logger,
      rotationInterval: options.rotationInterval || (30 * 24 * 60 * 60 * 1000)
    });
    
    // Démarrer la rotation automatique si activée
    if (options.autoRotation) {
      this.rotationManager.startAutomaticRotation();
    }
  }
  
  async getApiKey(service, moduleId) {
    // Vérifier les permissions
    if (!moduleId || !this.permissionManager.hasPermission(moduleId, service)) {
      throw new Error(`Accès non autorisé à la clé API ${service} pour le module ${moduleId}`);
    }
    
    // Essayer d'abord de récupérer depuis le stockage mémoire sécurisé
    const cachedKey = this.memoryStorage.get(`${service}_key`);
    if (cachedKey) return cachedKey;
    
    // Si pas en mémoire, charger depuis le fichier
    const keys = await this.loadKeysFromFile(service);
    const activeKey = keys.keys[keys.activeKeyIndex];
    
    // Stocker en mémoire sécurisée pour les prochains accès
    this.memoryStorage.set(`${service}_key`, activeKey);
    
    return activeKey;
  }
  
  // Autres méthodes...
}

// Utilisation dans les services
class WeatherService {
  constructor(apiKeyManager) {
    this.apiKeyManager = apiKeyManager;
    this.moduleId = 'weather-module';
  }
  
  async getWeather(location) {
    try {
      const apiKey = await this.apiKeyManager.getApiKey('weatherService', this.moduleId);
      // Utiliser la clé pour l'appel API...
    } catch (error) {
      console.error('Erreur d\'accès à la clé API:', error.message);
      throw new Error('Impossible d\'accéder au service météo');
    }
  }
}
```

## Sécurité

Le système implémente plusieurs couches de sécurité pour protéger les clés API :

1. **Chiffrement** : Les clés sont chiffrées à la fois sur disque et en mémoire
2. **Contrôle d'accès** : Accès limité selon le principe du moindre privilège
3. **Rotation des clés** : Changement régulier des clés pour limiter l'impact d'une fuite
4. **Période de grâce** : Transition en douceur lors des rotations de clés
5. **Validation des secrets** : Vérification de la force des secrets de l'application
6. **Expiration en mémoire** : Les clés ne restent en mémoire que pour une durée limitée

## Tests

Un framework de test complet est fourni pour valider le fonctionnement du système :

```javascript
const tester = new ApiKeySecurityTester();
tester.runAllTests()
  .then(results => {
    console.log('Résultats des tests:', results);
  });
```

Les tests couvrent :
- Le fonctionnement individuel de chaque composant
- L'intégration entre les composants
- Les cas d'erreur et la gestion des exceptions
- Les scénarios de sécurité critiques

## Bonnes Pratiques

### Configuration

- Utiliser des variables d'environnement pour les secrets
- Définir des clés de chiffrement fortes (au moins 32 caractères)
- Configurer des intervalles de rotation adaptés à la sensibilité des services

### Développement

- Toujours vérifier les permissions avant d'accéder aux clés API
- Ne jamais stocker les clés API en clair dans le code ou les logs
- Utiliser le système de période de grâce pour éviter les interruptions de service

### Déploiement

- Utiliser des secrets différents pour chaque environnement
- Mettre en place une surveillance des rotations de clés
- Configurer des alertes en cas d'échec de rotation

## Conclusion

Le système de gestion sécurisée des clés API de Dashboard-Velo.com offre une solution robuste et complète pour protéger les clés API contre les accès non autorisés et les fuites. En implémentant les meilleures pratiques de sécurité comme le chiffrement, le contrôle d'accès, la rotation des clés et la validation des secrets, ce système assure la sécurité des intégrations externes de l'application.
